import {
  Scene, Engine, ArcRotateCamera, Vector3, MeshBuilder, HemisphericLight,
} from "@babylonjs/core";

export default function createScene(engine: Engine) {
  const scene = new Scene(engine);
  const camera = new ArcRotateCamera("cam", -Math.PI / 2, Math.PI / 3, 10, Vector3.Zero(), scene);
  camera.attachControl(true);
  new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
  return { scene, camera };
}