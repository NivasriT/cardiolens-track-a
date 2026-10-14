import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Vector3 } from "three";

/* Smoothly flies the camera to `goal` = { id, position, target }.
   Any manual drag cancels the animation. Needs <OrbitControls makeDefault />. */
export function CameraRig({ goal }) {
  const controls = useThree((s) => s.controls);
  const camera = useThree((s) => s.camera);
  const anim = useRef(null);

  useEffect(() => {
    if (!goal) return;
    anim.current = {
      pos: new Vector3(...goal.position),
      tgt: new Vector3(...goal.target),
    };
  }, [goal]);

  useEffect(() => {
    if (!controls) return;
    const stop = () => (anim.current = null);
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [controls]);

  useFrame((_, dt) => {
    const a = anim.current;
    if (!a || !controls) return;
    const k = 1 - Math.exp(-4 * dt);
    camera.position.lerp(a.pos, k);
    controls.target.lerp(a.tgt, k);
    controls.update();
    if (
      camera.position.distanceTo(a.pos) < 0.01 &&
      controls.target.distanceTo(a.tgt) < 0.01
    ) {
      anim.current = null;
    }
  });

  return null;
}

/* "lub-dub" pulse at the patient's pulse rate. */
const bump = (t, c, w) => Math.exp(-(((t - c) / w) ** 2));

export function Heartbeat({ frame, bpm, active }) {
  useFrame(({ clock }) => {
    if (!frame) return;
    let s = 1;
    if (active) {
      const ph = ((clock.elapsedTime * bpm) / 60) % 1;
      s = 1 + 0.028 * bump(ph, 0.08, 0.06) + 0.016 * bump(ph, 0.36, 0.07);
    }
    frame.scale.setScalar(s);
  });
  return null;
}

/* Floating anatomy label that hides itself when it is on the far side. */
export function Landmark({ region, position, active }) {
  const el = useRef(null);
  const outward = useMemo(() => position.clone().normalize(), [position]);
  const toCam = useMemo(() => new Vector3(), []);

  useFrame(({ camera }) => {
    if (!el.current) return;
    toCam.copy(camera.position).sub(position).normalize();
    el.current.style.opacity = outward.dot(toCam) > 0.1 ? "1" : "0";
  });

  return (
    <Html
      position={position}
      center
      zIndexRange={[20, 0]}
      style={{ pointerEvents: "none" }}
    >
      <div ref={el} className={`hv-pin${active ? " is-active" : ""}`}>
        <i />
        {region.name}
      </div>
    </Html>
  );
}
