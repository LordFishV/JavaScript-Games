import "../shared/site";
import createEngine from "../shared/createEngine";
import createScene from "./createScene";

async function main() {
  const { engine } = createEngine();
  const { scene } = await createScene(engine); // async: Havok loads first
  engine.runRenderLoop(() => scene.render());
}

main().catch(console.error);