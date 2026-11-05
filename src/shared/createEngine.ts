import { Engine } from "@babylonjs/core";

export default function createEngine(canvasId = "renderCanvas") {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  const engine = new Engine(canvas, true, {}, true);
  window.addEventListener("resize", () => engine.resize());
  return { canvas, engine };
}