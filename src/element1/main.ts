import "../shared/site";
import createEngine from "../shared/createEngine";
import createAudio from "../element4/createAudio"; // same path createMenu.ts and createScene.ts use
import createScene from "./createScene";

async function main() {
  const { engine } = createEngine();
  const audio = await createAudio(); // audio is created here, but stays off until a button turns it on
  const { scene } = await createScene(engine, audio);
  engine.runRenderLoop(() => scene.render());
}

main().catch(console.error);