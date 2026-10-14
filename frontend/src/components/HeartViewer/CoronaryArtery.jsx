import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D } from "three";
import { buildVesselGeometry, gauss } from "./geometry";
import { riskLevel } from "./heartConfig";

/* Red cells drifting along the vessel. Higher risk = slower flow. */
function BloodFlow({ curve, probability, count = 22 }) {
  const mesh = useRef();
  const dummy = useMemo(() => new Object3D(), []);
  const pts = useMemo(() => curve.getSpacedPoints(240), [curve]);
  const speed = 0.16 * (1 - 0.7 * probability);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.elapsedTime;
    const last = pts.length - 1;
    for (let i = 0; i < count; i++) {
      const u = (i / count + t * speed) % 1;
      const f = u * last;
      const k = Math.floor(f);
      dummy.position.lerpVectors(pts[k], pts[Math.min(k + 1, last)], f - k);
      dummy.scale.setScalar(0.8 + 0.4 * (((i * 7) % 5) / 5));
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, count]} frustumCulled={false}>
      <sphereGeometry args={[0.011, 10, 10]} />
      <meshStandardMaterial
        color="#ff3b3b"
        emissive="#ff1a1a"
        emissiveIntensity={0.9}
        roughness={0.3}
      />
    </instancedMesh>
  );
}

export default function CoronaryArtery({
  name,
  cfg,
  curves,
  vessel,
  selected,
  hovered,
  dimmed,
  showFlow,
  onSelect,
  onHover,
  onLeave,
}) {
  const level = riskLevel(vessel.probability);
  const key = `artery:${name}`;
  const sev = vessel.probability;
  const thick = selected ? 1.22 : 1;

  /* main vessel: tapered, narrowed at the lesion, plaque-tinted */
  const mainGeo = useMemo(() => {
    const [r0, r1] = cfg.radius;
    return buildVesselGeometry({
      curve: curves.main,
      color: level.color,
      radiusAt: (t) =>
        (r0 + (r1 - r0) * t) * thick * (1 - 0.6 * sev * gauss(t, cfg.lesionAt, 0.055)),
      plaqueAt: (t) => 0.75 * sev * gauss(t, cfg.lesionAt, 0.06),
    });
  }, [curves.main, cfg, level.color, sev, thick]);

  /* side branches: thin, no lesion */
  const branchGeos = useMemo(
    () =>
      curves.branches.map((c) =>
        buildVesselGeometry({
          curve: c,
          color: level.color,
          radiusAt: (t) => 0.013 * (1 - 0.55 * t),
          segments: 80,
          radial: 10,
        })
      ),
    [curves.branches, level.color]
  );

  useEffect(() => () => mainGeo.dispose(), [mainGeo]);
  useEffect(() => () => branchGeos.forEach((g) => g.dispose()), [branchGeos]);

  const handlers = {
    onClick: (e) => {
      e.stopPropagation();
      onSelect(name);
    },
    onPointerOver: (e) => {
      e.stopPropagation();
      onHover(key);
      document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      onLeave(key);
      document.body.style.cursor = "auto";
    },
  };

  const emissiveIntensity = selected ? 0.55 : hovered ? 0.4 : 0.12;
  const opacity = dimmed ? 0.45 : 0.78;

  return (
    <group>
      <mesh geometry={mainGeo} {...handlers}>
        <meshPhysicalMaterial
          vertexColors
          emissive={level.color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.35}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </mesh>

      {branchGeos.map((g, i) => (
        <mesh key={i} geometry={g} {...handlers}>
          <meshPhysicalMaterial
            vertexColors
            emissive={level.color}
            emissiveIntensity={emissiveIntensity * 0.6}
            roughness={0.4}
            transparent
            opacity={opacity * 0.85}
            depthWrite={false}
          />
        </mesh>
      ))}

      {showFlow && <BloodFlow curve={curves.main} probability={sev} />}
    </group>
  );
}
