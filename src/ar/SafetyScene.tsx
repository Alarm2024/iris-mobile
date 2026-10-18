// The AR scene. ARCore finds flat surfaces (a table, the floor); tap one and
// the safety card stands on it where you tapped, turning to face you as you
// walk around it. Text only: no 3D models, no network assets. Load this file
// through loadSafetyScene() in ./viro, never with a static import (see there).
import { ViroARPlaneSelector, ViroARScene, ViroFlexView, ViroNode, ViroText } from "@reactvision/react-viro";
import { factLines, type SafetyCard } from "../core/safetyCard";

type SceneProps = { sceneNavigator: { viroAppProps: { card: SafetyCard; onPlaced: () => void } } };

const TEXT = { fontFamily: "sans-serif", color: "#FFFFFF", textAlignVertical: "center" as const, textAlign: "left" as const };

export function SafetyScene({ sceneNavigator }: SceneProps) {
  const { card, onPlaced } = sceneNavigator.viroAppProps;
  const lines = [...factLines(card), ...card.activity.map((a) => `Recent · ${a}`), ...card.rules.map((r, i) => `${i + 1}. ${r}`)];
  return (
    <ViroARScene>
      <ViroARPlaneSelector alignment="HorizontalUpward" minWidth={0.2} minHeight={0.2} maxPlanes={6} onPlaneSelected={onPlaced}>
        <ViroNode position={[0, 0.45, 0]} transformBehaviors={["billboardY"]}>
          <ViroFlexView width={0.8} height={0.8} style={{ flexDirection: "column", padding: 0.03, backgroundColor: "#140A2CE6" }}>
            <ViroText text={card.title} style={{ ...TEXT, flex: 0.14, fontSize: 18, fontWeight: "700", color: "#C9A7FF" }} />
            {lines.map((line) => (
              <ViroText key={line} text={line} style={{ ...TEXT, flex: 0.1, fontSize: 10 }} textLineBreakMode="WordWrap" />
            ))}
            <ViroText text={card.footer} style={{ ...TEXT, flex: 0.08, fontSize: 9, color: "#9FE8D0" }} />
          </ViroFlexView>
        </ViroNode>
      </ViroARPlaneSelector>
    </ViroARScene>
  );
}
