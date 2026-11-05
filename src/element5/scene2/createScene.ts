import {
  Scene,
  Engine,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  Color4,
} from "@babylonjs/core";
import createSwitchUi from "../createSwitchUi";
import type { SceneName } from "../sceneManager";

export default function createScene(
  engine: Engine,
  goTo: (name: SceneName) => void
) {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.25, 0.08, 0.08, 1); // placeholder: different colour from scene 1

  const camera = new ArcRotateCamera(
    "cam2",
    -Math.PI / 2,
    Math.PI / 3,
    12,
    Vector3.Zero(),
    scene
  );
  new HemisphericLight("light2", new Vector3(0, 1, 0), scene);

  // GUI switch button (placeholder)
  createSwitchUi(scene, "Back to Scene 1", () => goTo("scene1"));

  // TODO: add this scene's content. It should look and play differently from scene 1
  // TODO: use the techniques explored in the module (see the TODOs in scene 1)

  return { scene, camera };
}