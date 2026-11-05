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
  scene.clearColor = new Color4(0.05, 0.1, 0.25, 1); // placeholder: replace with your own background

  const camera = new ArcRotateCamera(
    "cam1",
    -Math.PI / 2,
    Math.PI / 3,
    12,
    Vector3.Zero(),
    scene
  );
  new HemisphericLight("light1", new Vector3(0, 1, 0), scene);

  // GUI switch button (placeholder)
  createSwitchUi(scene, "Go to Scene 2", () => goTo("scene2"));

  // TODO: add your meshes, textures, lighting and shadows
  // TODO: add animation / motion
  // TODO: add physics and a player (techniques from Elements 1 to 4)
  // TODO: add game-like aspects (goal, score, collectibles, enemies...)
  // TODO: optional: switch scenes from a scene event instead of the button,
  //       e.g. when the player touches a mesh or reaches a trigger area:
  //       goTo("scene2");

  return { scene, camera };
}