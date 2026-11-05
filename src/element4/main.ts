import "../shared/site";
import createEngine from "../shared/createEngine";
import createAudio from "./createAudio";
import createScene from "./createScene";

async function main() {
  const { engine } = createEngine();
  const audio = await createAudio();
  const { scene } = createScene(engine, audio);
  engine.runRenderLoop(() => scene.render());
}

main();