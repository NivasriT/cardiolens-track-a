import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import HeartModel from "./HeartModel";

export default function HeartViewer({ selected, onSelect }) {
  const [activePreset, setActivePreset] = useState("front");

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#0c1017" }}>
      {/* Preset View Controls */}
      <div style={{
        position: "absolute",
        top: 12,
        left: 12,
        zIndex: 10,
        display: "flex",
        gap: 6,
        background: "rgba(15, 23, 42, 0.75)",
        padding: "4px",
        borderRadius: "8px",
        backdropFilter: "blur(8px)"
      }}>
        {["front", "back", "left", "right", "top"].map((preset) => (
          <button
            key={preset}
            onClick={() => setActivePreset(preset)}
            style={{
              background: activePreset === preset ? "#1e293b" : "transparent",
              color: activePreset === preset ? "#ffffff" : "#94a3b8",
              border: "none",
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {preset.charAt(0).toUpperCase() + preset.slice(1)}
          </button>
        ))}
      </div>

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <HeartModel selected={selected} onSelect={onSelect} preset={activePreset} />
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}