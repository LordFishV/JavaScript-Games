import "../shared/site";
import createEngine from "../shared/createEngine";
import createEnvironmentScene from "./createEnvironmentScene";

const { engine } = createEngine();
const { scene } = createEnvironmentScene(engine);
engine.runRenderLoop(() => scene.render());