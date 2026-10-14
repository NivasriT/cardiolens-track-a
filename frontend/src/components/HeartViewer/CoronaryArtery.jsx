import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D } from "three";
import { buildVesselGeometry, gauss } from "./geometry";
import { riskLevel } from "./heartConfig";

/* Red cells drifting along the vessel. Higher risk = slower flow. */
function BloodFlow({ curve, probability = 0, count = 22 }) {
  const mesh = useRef();
  const dummy = useMemo(() => new Object3D(), []);
  const pts = useMemo(() => (curve?.getSpacedPoints ? curve.getSpacedPoints(240) : []), [curve]);
  const speed = 0.16 * (1 - 0.7 * (probability || 0));

  useFrame(({ clock }) => {
    if (!mesh.current || pts.length === 0) return;
    const t = clock.elapsedTime;
    const last = pts.length - 1;
    for (let i = 0; i < count; i++) {
      const u = (i / count + t * speed) % 1;
      const f = u * last;
      const k = Math.floor(f);
      const p1 = pts[k] || pts[0];
      const p2 = pts[Math.min(k + 1, last)] || p1;
      dummy.position.lerpVectors(p1, p2, f - k);
      dummy.scale.setScalar(0.8 + 0.4 * (((i * 7) % 5) / 5));
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  if (!curve || pts.length === 0) return null;

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
  vessels,
  selected,
  hovered,
  dimmed,
  showFlow,
  onSelect = () => {},
  onHover = () => {},
  onLeave = () => {},
}) {
  // Safely extract vessel data with optional chaining and fallbacks
  const vesselData = vessel || vessels?.[name] || {};
  const prob = vesselData?.probability ?? 0;
  
  const level = riskLevel(prob);
  const key = `artery:${name}`;
  const sev = prob;
  const thick = selected === name || selected === true ? 1.22 : 1;

  /* main vessel: tapered, narrowed at the lesion, plaque-tinted */
  const mainGeo = useMemo(() => {
    if (!curves?.main || !cfg) return null;
    const [r0, r1] = cfg.radius || [0.02, 0.01];
    return buildVesselGeometry({
      curve: curves.main,
      color: level?.color || "#7fa655",
      radiusAt: (t) =>
        (r0 + (r1 - r0) * t) * thick * (1 - 0.6 * sev * gauss(t, cfg.lesionAt || 0.5, 0.055)),
      plaqueAt: (t) => 0.75 * sev * gauss(t, cfg.lesionAt || 0.5, 0.06),
    });
  }, [curves?.main, cfg, level?.color, sev, thick]);

  /* side branches: thin, no lesion */
  const branchGeos = useMemo(() => {
    if (!curves?.branches) return [];
    return curves.branches.map((c) =>
      buildVesselGeometry({
        curve: c,
        color: level?.color || "#7fa655",
        radiusAt: (t) => 0.013 * (1 - 0.55 * t),
        segments: 80,
        radial: 10,
      })
    );
  }, [curves?.branches, level?.color]);

  useEffect(() => () => mainGeo?.dispose(), [mainGeo]);
  useEffect(() => () => branchGeos.forEach((g) => g?.dispose()), [branchGeos]);

  const handlers = {
    onClick: (e) => {
      e?.stopPropagation();
      onSelect(name);
    },
    onPointerOver: (e) => {
      e?.stopPropagation();
      onHover(key);
      if (document?.body) document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      onLeave(key);
      if (document?.body) document.body.style.cursor = "auto";
    },
  };

  const emissiveIntensity = selected ? 0.55 : hovered ? 0.4 : 0.12;
  const opacity = dimmed ? 0.45 : 0.78;

  if (!mainGeo) return null;

  return (
    <group>
      <mesh geometry={mainGeo} {...handlers}>
        <meshPhysicalMaterial
          vertexColors
          emissive={level?.color || "#7fa655"}
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
            emissive={level?.color || "#7fa655"}
            emissiveIntensity={emissiveIntensity * 0.6}
            roughness={0.4}
            transparent
            opacity={opacity * 0.85}
            depthWrite={false}
          />
        </mesh>
      ))}

      {showFlow && curves?.main && <BloodFlow curve={curves.main} probability={sev} />}
    </group>
  );
}