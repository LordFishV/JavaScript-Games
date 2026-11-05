import "../shared/site";
import createEngine from "../shared/createEngine";
import createStartScene from "./createStartScene";
import createRunScene from "./createRunScene";

const { engine } = createEngine();
const startScene = createStartScene(engine);
createRunScene(startScene);
engine.runRenderLoop(() => startScene.scene.render());