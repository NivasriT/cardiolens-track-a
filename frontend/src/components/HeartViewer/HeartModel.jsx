import HeartBody from "./HeartBody";
import CoronaryArtery from "./CoronaryArtery";
import * as ScenePartsModule from "./SceneParts";

const ScenePartsComponent = ScenePartsModule.default || ScenePartsModule.SceneParts || ScenePartsModule.Parts;

export default function HeartModel({ vessels = {}, selected, onSelect, showFlow }) {
  return (
    <group>
      {HeartBody && <HeartBody />}
      {CoronaryArtery && (
        <CoronaryArtery
          vessels={vessels}
          selected={selected}
          onSelect={onSelect}
          showFlow={showFlow}
        />
      )}
      {ScenePartsComponent && <ScenePartsComponent />}
    </group>
  );
}