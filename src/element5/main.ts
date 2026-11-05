import "../shared/site";
import createEngine from "../shared/createEngine";
import SceneManager from "./sceneManager";
import type { SceneName } from "./sceneManager";
import createScene1 from "./scene1/createScene";
import createScene2 from "./scene2/createScene";

const { engine } = createEngine();
const manager = new SceneManager();

const goTo = (name: SceneName) => manager.switchTo(name);

manager.add("scene1", createScene1(engine, goTo));
manager.add("scene2", createScene2(engine, goTo));
manager.switchTo("scene1");

engine.runRenderLoop(() => manager.active?.render());