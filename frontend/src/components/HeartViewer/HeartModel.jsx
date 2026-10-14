import HeartBody from "./HeartBody";
import CoronaryArtery from "./CoronaryArtery";
import SceneParts from "./SceneParts";

export default function HeartModel({ selected, onSelect }) {
  return (
    <group>
      <HeartBody />
      <CoronaryArtery selected={selected} onSelect={onSelect} />
      <SceneParts />
    </group>
  );
}