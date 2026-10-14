import { useCallback, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bvh, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
// NOTE: if this file lives at a different depth than before, fix this path.
import sampleData from "../../mock/sample_response.json";
import { DEBUG_POINTS, REGIONS, VESSELS, VIEWS, riskLevel } from "./heartConfig";
import { makeSnappedCurve, snapToSurface } from "./geometry";
import HeartBody from "./HeartBody";
import CoronaryArtery from "./CoronaryArtery";
import { CameraRig, Heartbeat, Landmark } from "./SceneParts";
import "./HeartViewer.css";

const pct = (v) => `${Math.round(v * 100)}%`;

const TOGGLES = [
  ["beat", "Heartbeat"],
  ["flow", "Blood flow"],
  ["xray", "X-ray"],
  ["labels", "Labels"],
  ["rotate", "Auto-rotate"],
];

export default function HeartViewer({ data = sampleData }) {
  const [selected, setSelected] = useState("LAD");
  const [hoverKey, setHoverKey] = useState(null);
  const [opts, setOpts] = useState({
    beat: true,
    flow: true,
    xray: false,
    labels: true,
    rotate: false,
  });
  const [goal, setGoal] = useState(null);
  const [frame, setFrame] = useState(null);
  const [curves, setCurves] = useState(null);
  const [regionPos, setRegionPos] = useState(null);

  const frameRef = useRef(null);
  const regionRef = useRef(null);
  const tipRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });

  const bpm = Math.min(140, Math.max(40, data.vitals?.PR ?? 72));
  const toggle = (k) => setOpts((o) => ({ ...o, [k]: !o[k] }));

  /* ---- build arteries once the heart mesh is ready ---- */
  const attachFrame = useCallback((g) => {
    frameRef.current = g;
    setFrame(g);
  }, []);

  const handleReady = useCallback((root) => {
    const f = frameRef.current;
    if (!f) return;
    const next = {};
    for (const [name, cfg] of Object.entries(VESSELS)) {
      next[name] = {
        main: makeSnappedCurve(cfg.main, root, f),
        branches: cfg.branches.map((b) => makeSnappedCurve(b, root, f, 18)),
      };
    }
    const rp = snapToSurface(
      REGIONS.map((r) => new Vector3(...r.pos)),
      root,
      f,
      0.03
    );
    regionRef.current = rp;
    setRegionPos(rp);
    setCurves(next);
  }, []);

  /* ---- hover on the heart body -> nearest anatomical region ---- */
  const onRegionMove = useCallback((worldPoint) => {
    const f = frameRef.current;
    const rp = regionRef.current;
    if (!f || !rp) return;
    const p = f.worldToLocal(worldPoint.clone());
    let best = 0;
    let bd = Infinity;
    rp.forEach((r, i) => {
      const d = r.distanceToSquared(p);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    setHoverKey(`region:${REGIONS[best].id}`);
  }, []);

  const onRegionOut = useCallback(
    () => setHoverKey((k) => (k && k.startsWith("region:") ? null : k)),
    []
  );
  const leave = useCallback(
    (key) => setHoverKey((k) => (k === key ? null : k)),
    []
  );

  /* ---- camera ---- */
  const flyTo = (view) =>
    setGoal({ id: Date.now(), position: view.position, target: view.target });

  const focusArtery = (name) => {
    setSelected(name);
    const c = curves?.[name]?.main;
    if (!c) return;
    const mid = c.getPointAt(0.5);
    const dir = mid.clone().normalize();
    flyTo({
      position: mid.clone().addScaledVector(dir, 2.4).toArray(),
      target: mid.clone().multiplyScalar(0.5).toArray(),
    });
  };

  /* ---- tooltip follows the mouse (direct DOM, no re-render) ---- */
  const placeTip = (el) => {
    if (el) el.style.transform = `translate(${mouse.current.x + 16}px, ${mouse.current.y + 16}px)`;
  };
  const onStageMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    placeTip(tipRef.current);
  };

  /* ---- tooltip content ---- */
  const [hKind, hId] = hoverKey ? hoverKey.split(":") : [];
  let tip = null;
  if (hKind === "artery") {
    const v = data.vessels[hId];
    const lv = riskLevel(v.probability);
    tip = (
      <>
        <strong>{hId} · {VESSELS[hId].fullName}</strong>
        <div className="hv-tip-row">
          <span className="hv-dot" style={{ background: lv.color }} />
          {pct(v.probability)} predicted stenosis · {lv.label}
        </div>
        <div className="hv-tip-sub">
          95% interval {pct(v.ci_low)}–{pct(v.ci_high)} · {v.confidence} confidence
        </div>
        <p>{VESSELS[hId].territory}</p>
        <em>Click to inspect</em>
      </>
    );
  } else if (hKind === "region") {
    const r = REGIONS.find((x) => x.id === hId);
    const v = r.artery ? data.vessels[r.artery] : null;
    tip = (
      <>
        <strong>{r.name}</strong>
        <p>{r.text}</p>
        {v && (
          <div className="hv-tip-row">
            <span className="hv-dot" style={{ background: riskLevel(v.probability).color }} />
            {r.artery} risk {pct(v.probability)}
          </div>
        )}
      </>
    );
  }

  /* ---- panel data ---- */
  const expl = data.explanations?.[selected];
  const factors = expl?.top_factors ?? [];
  const maxShap = Math.max(0.001, ...factors.map((f) => Math.abs(f.shap)));
  const cadLevel = riskLevel(data.cad.probability);

  return (
    <section className="hv-root">
      {/* ================= 3D stage ================= */}
      <div className="hv-stage" onPointerMove={onStageMove}>
        <div className="hv-toolbar">
          <div className="hv-group" role="group" aria-label="Camera views">
            {Object.entries(VIEWS).map(([label, v]) => (
              <button key={label} onClick={() => flyTo(v)}>
                {label}
              </button>
            ))}
          </div>
          <div className="hv-group" role="group" aria-label="Display options">
            {TOGGLES.map(([k, label]) => (
              <button
                key={k}
                aria-pressed={opts[k]}
                onClick={() => toggle(k)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Canvas
          camera={{ position: [0, 0.1, 5], fov: 38 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <ambientLight intensity={0.35} />
          <directionalLight position={[3, 4, 5]} intensity={2.2} />
          <directionalLight position={[-4, -1, -3]} intensity={0.9} color="#7aa2ff" />

          {/* offline-safe studio lighting: gives the wet specular highlights */}
          <Environment resolution={256}>
            <Lightformer form="rect" intensity={3} position={[0, 4, 4]} scale={[8, 3, 1]} />
            <Lightformer form="rect" intensity={1.5} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} color="#9db8ff" />
            <Lightformer form="rect" intensity={2} position={[5, 0, -3]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} color="#ffb199" />
          </Environment>

          <group ref={attachFrame} scale={1.25}>
            <Bvh firstHitOnly>
              <HeartBody
                xray={opts.xray}
                onReady={handleReady}
                onRegionMove={onRegionMove}
                onRegionOut={onRegionOut}
              />
            </Bvh>

            {curves &&
              Object.entries(VESSELS).map(([name, cfg]) => (
                <CoronaryArtery
                  key={name}
                  name={name}
                  cfg={cfg}
                  curves={curves[name]}
                  vessel={data.vessels[name]}
                  selected={selected === name}
                  hovered={hoverKey === `artery:${name}`}
                  dimmed={selected !== name}
                  showFlow={opts.flow}
                  onSelect={setSelected}
                  onHover={setHoverKey}
                  onLeave={leave}
                />
              ))}

            {opts.labels &&
              regionPos &&
              REGIONS.map((r, i) => (
                <Landmark
                  key={r.id}
                  region={r}
                  position={regionPos[i]}
                  active={hoverKey === `region:${r.id}`}
                />
              ))}

            {DEBUG_POINTS && (
              <>
                {Object.values(VESSELS).flatMap((v) =>
                  [v.main, ...v.branches].flat().map((p, i) => (
                    <mesh key={`d${p.join()}${i}`} position={p}>
                      <sphereGeometry args={[0.025, 8, 8]} />
                      <meshBasicMaterial color="red" />
                    </mesh>
                  ))
                )}
                {REGIONS.map((r) => (
                  <mesh key={r.id} position={r.pos}>
                    <sphereGeometry args={[0.03, 8, 8]} />
                    <meshBasicMaterial color="#38bdf8" />
                  </mesh>
                ))}
              </>
            )}
          </group>

          <Heartbeat frame={frame} bpm={bpm} active={opts.beat} />
          <CameraRig goal={goal} />
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.08}
            minDistance={1.8}
            maxDistance={9}
            zoomToCursor
            autoRotate={opts.rotate && !hoverKey}
            autoRotateSpeed={0.8}
          />
        </Canvas>

        {tip && (
          <div className="hv-tip" ref={(el) => { tipRef.current = el; placeTip(el); }}>
            {tip}
          </div>
        )}

        <div className="hv-legend">
          {["lower", "moderate", "high"].map((k) => {
            const l = riskLevel({ lower: 0, moderate: 0.5, high: 0.8 }[k]);
            return (
              <span key={k}>
                <span className="hv-dot" style={{ background: l.color }} />
                {l.label}
              </span>
            );
          })}
          <span className="hv-bpm">{bpm} bpm</span>
        </div>

        <div className="hv-disclaimer" role="note">
          Educational decision-support demo. Not a diagnosis and not a substitute
          for formal diagnostic imaging. Vessel narrowing is an illustrative
          encoding of predicted probability, not a measurement.
        </div>
      </div>

      {/* ================= clinical panel ================= */}
      <aside className="hv-panel">
        <header>
          <h2>CardioLens</h2>
          <p>Coronary risk, mapped onto the heart</p>
        </header>

        <div className="hv-cad" style={{ borderColor: cadLevel.color }}>
          <div className="hv-cad-num">{pct(data.cad.probability)}</div>
          <div>
            <strong>{data.cad.label}</strong>
            <div className="hv-tip-sub">
              Overall CAD · interval {pct(data.cad.ci_low)}–{pct(data.cad.ci_high)}
            </div>
          </div>
        </div>

        <div className="hv-vessels">
          {Object.keys(VESSELS).map((name) => {
            const v = data.vessels[name];
            const lv = riskLevel(v.probability);
            return (
              <button
                key={name}
                className={selected === name ? "is-selected" : ""}
                onClick={() => focusArtery(name)}
              >
                <span className="hv-vname">{name}</span>
                <span className="hv-bar">
                  <i style={{ width: pct(v.probability), background: lv.color }} />
                </span>
                <span className="hv-vpct">{pct(v.probability)}</span>
              </button>
            );
          })}
        </div>

        <div className="hv-detail">
          <h3>{VESSELS[selected].fullName}</h3>
          <p className="hv-tip-sub">
            {pct(data.vessels[selected].ci_low)}–{pct(data.vessels[selected].ci_high)} interval ·{" "}
            {data.vessels[selected].confidence} confidence
          </p>
          <p>{VESSELS[selected].territory}</p>
          {expl && <p className="hv-summary">{expl.summary}</p>}

          <ul className="hv-factors">
            {factors.map((f) => (
              <li key={f.feature} title={f.sentence}>
                <span>{f.feature} <small>({f.value})</small></span>
                <span className="hv-fbar">
                  <i
                    className={f.direction === "increases" ? "up" : "down"}
                    style={{ width: `${(Math.abs(f.shap) / maxShap) * 100}%` }}
                  />
                </span>
                <span className="hv-fval">
                  {f.shap > 0 ? "+" : ""}
                  {f.shap.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {data.vitals && (
          <div className="hv-vitals">
            {Object.entries(data.vitals).map(([k, v]) => (
              <span key={k}><small>{k}</small>{v}</span>
            ))}
          </div>
        )}
      </aside>
    </section>
  );
}