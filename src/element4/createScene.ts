import {
  Scene,
  Engine,
  ArcRotateCamera,
  Vector3,
  MeshBuilder,
  HemisphericLight,
  PointerEventTypes,
} from "@babylonjs/core";
import type { AudioManager } from "./createAudio";
import createMenu from "./createMenu";

export default function createScene(engine: Engine, audio: AudioManager) {
  const scene = new Scene(engine);

  const camera = new ArcRotateCamera(
    "cam", -Math.PI / 2, Math.PI / 3, 12, Vector3.Zero(), scene
  );
  new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  MeshBuilder.CreateGround("ground", { width: 12, height: 12 }, scene);

  // collectibles
  for (let i = 0; i < 5; i++) {
    const coin = MeshBuilder.CreateSphere("coin" + i, { diameter: 1 }, scene);
    coin.position.set(i * 2 - 4, 0.5, 0);
    coin.metadata = { collectible: true };
  }

  let started = false;
  let score = 0;

  const menu = createMenu(scene, audio, () => {
    started = true;
    camera.attachControl(true); // camera only moves once the game starts
  });

  // scene event -> GUI change + sound effect
  scene.onPointerObservable.add((info) => {
    if (!started || info.type !== PointerEventTypes.POINTERPICK) return;
    const mesh = info.pickInfo?.pickedMesh;
    if (mesh?.metadata?.collectible) {
      mesh.dispose();
      score += 1;
      menu.setScore(score);
      audio.playSfx("collect");
    }
  });

  return { scene, camera };
}