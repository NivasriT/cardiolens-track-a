import { Component, Suspense, useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import {
  Box3,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { MODEL } from "./heartConfig";

/* ---------- material ---------- */
function styleTissue(root) {
  const t = MODEL.tissue;
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
    if (MODEL.keepOriginalMaterial) return;

    const old = o.material;
    const keepColour = !!old.map || !!old.vertexColors;
    o.material = new MeshPhysicalMaterial({
      color: keepColour ? "#ffffff" : t.color,
      map: old.map || null,
      normalMap: old.normalMap || null,
      vertexColors: !!old.vertexColors,
      emissive: t.emissive,
      emissiveIntensity: t.emissiveIntensity,
      roughness: t.roughness,
      clearcoat: t.clearcoat,
      clearcoatRoughness: t.clearcoatRoughness,
      sheen: t.sheen,
      sheenColor: t.sheenColor,
      side: old.side,
    });
  });
}

function applyXray(root, xray) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.material.transparent = xray;
    o.material.opacity = xray ? 0.25 : 1;
    o.material.depthWrite = !xray;
    o.material.needsUpdate = true;
  });
}

/* ---------- shared body ---------- */
function Body({ root, xray, onReady, onRegionMove, onRegionOut }) {
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  useEffect(() => applyXray(root, xray), [root, xray]);

  // Small delay so the BVH (fast raycasting) is built before we snap arteries.
  useEffect(() => {
    const id = setTimeout(() => readyRef.current?.(root), 80);
    return () => clearTimeout(id);
  }, [root]);

  return (
    <primitive
      object={root}
      onPointerMove={(e) => {
        e.stopPropagation();
        onRegionMove?.(e.point);
      }}
      onPointerOut={() => onRegionOut?.()}
    />
  );
}

/* ---------- real model ---------- */
function GLBHeart(props) {
  const { scene } = useGLTF(MODEL.url);

  const root = useMemo(() => {
    const g = new Group();
    const model = scene.clone(true);
    g.add(model);

    // 1) orient, 2) measure, 3) centre + scale to a standard size
    model.rotation.set(...MODEL.rotation);
    model.updateMatrixWorld(true);
    const box = new Box3().setFromObject(model);
    const size = box.getSize(new Vector3());
    const centre = box.getCenter(new Vector3());
    const s = MODEL.size / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(s);
    model.position.copy(centre.multiplyScalar(-s));

    styleTissue(g);
    return g;
  }, [scene]);

  return <Body root={root} {...props} />;
}

/* ---------- fallback if heart.glb is missing ---------- */
function PlaceholderHeart(props) {
  const root = useMemo(() => {
    const g = new Group();
    const m = new Mesh(new SphereGeometry(1, 72, 56), new MeshPhysicalMaterial());
    m.scale.set(0.78, 1.05, 0.62);
    m.rotation.z = 0.35; // apex towards +X
    g.add(m);
    styleTissue(g);
    return g;
  }, []);

  return <Body root={root} {...props} />;
}

class Boundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    console.warn(
      `[HeartBody] Could not load ${MODEL.url} - showing placeholder.`,
      err
    );
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function HeartBody(props) {
  return (
    <Boundary fallback={<PlaceholderHeart {...props} />}>
      <Suspense fallback={null}>
        <GLBHeart {...props} />
      </Suspense>
    </Boundary>
  );
}
