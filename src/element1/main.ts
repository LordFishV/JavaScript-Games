import "../shared/site";
import createEngine from "../shared/createEngine";
import createStartScene from "./createStartScene";
import createRunScene from "./createRunScene";

function bootBabylon() {
  // Double rAF guarantees the browser paints the navbar & completes the View Transition first
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const { engine } = createEngine();
      const startScene = createStartScene(engine);
      createRunScene(startScene);
      engine.runRenderLoop(() => startScene.scene.render());
    });
  });
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", bootBabylon);
} else {
  bootBabylon();
}