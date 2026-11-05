import "../shared/site";
import createEngine from "../shared/createEngine";
import createScene from "./createScene";

const { engine } = createEngine();
const { scene } = createScene(engine);
engine.runRenderLoop(() => scene.render());