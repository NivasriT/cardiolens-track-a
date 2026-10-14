import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Float32BufferAttribute,
  Raycaster,
  Vector3,
} from "three";

const raycaster = new Raycaster();
raycaster.firstHitOnly = true; // used by three-mesh-bvh (drei <Bvh>), ignored otherwise

export const gauss = (t, c, w) => Math.exp(-(((t - c) / w) ** 2));

/**
 * Project points (in `frame` local space) onto the visible surface of `root`
 * by shooting rays from outside towards the heart centre.
 */
export function snapToSurface(points, root, frame, offset = 0.015) {
  frame.updateWorldMatrix(true, false);
  root.updateWorldMatrix(true, true);

  return points.map((p) => {
    const outward = p.clone().normalize();
    const origin = frame.localToWorld(p.clone().addScaledVector(outward, 3));
    const inside = frame.localToWorld(p.clone());
    const dir = inside.sub(origin).normalize();

    raycaster.set(origin, dir);
    const hit = raycaster.intersectObject(root, true)[0];
    if (!hit) return p.clone();

    const n = hit.face
      ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
      : dir.clone().negate();
    if (n.dot(dir) > 0) n.negate(); // make sure it points out of the surface

    return frame.worldToLocal(hit.point.clone().addScaledVector(n, offset));
  });
}

function smooth(points, passes = 2) {
  let a = points;
  for (let k = 0; k < passes; k++) {
    a = a.map((p, i) =>
      i === 0 || i === a.length - 1
        ? p
        : a[i - 1].clone().add(a[i + 1]).addScaledVector(p, 2).multiplyScalar(0.25)
    );
  }
  return a;
}

/** Rough control points -> smooth curve that hugs the heart surface. */
export function makeSnappedCurve(control, root, frame, samples = 28) {
  const coarse = new CatmullRomCurve3(
    control.map((p) => new Vector3(...p)),
    false,
    "centripetal"
  );
  const dense = coarse.getSpacedPoints(samples);
  const snapped = smooth(snapToSurface(dense, root, frame));
  return new CatmullRomCurve3(snapped, false, "centripetal");
}

/**
 * Tube with a radius that changes along its length (taper + stenosis) and
 * per-vertex colour (risk colour blended towards plaque yellow at the lesion).
 */
export function buildVesselGeometry({
  curve,
  radiusAt,
  plaqueAt = () => 0,
  color,
  plaqueColor = "#eadfae",
  segments = 160,
  radial = 16,
}) {
  const frames = curve.computeFrenetFrames(segments, false);
  const base = new Color(color);
  const plaque = new Color(plaqueColor);
  const tmp = new Color();

  const pos = [];
  const nor = [];
  const col = [];
  const idx = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const P = curve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const r = radiusAt(t);
    tmp.copy(base).lerp(plaque, plaqueAt(t));

    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const nx = c * N.x + s * B.x;
      const ny = c * N.y + s * B.y;
      const nz = c * N.z + s * B.z;
      pos.push(P.x + r * nx, P.y + r * ny, P.z + r * nz);
      nor.push(nx, ny, nz);
      col.push(tmp.r, tmp.g, tmp.b);
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = (radial + 1) * i + j;
      const b = (radial + 1) * (i + 1) + j;
      const c = (radial + 1) * (i + 1) + j + 1;
      const d = (radial + 1) * i + j + 1;
      idx.push(a, b, d, b, c, d);
    }
  }

  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new Float32BufferAttribute(nor, 3));
  g.setAttribute("color", new Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}
