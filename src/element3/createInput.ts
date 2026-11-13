import { KeyboardEventTypes } from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";

export default function createInput(scene: Scene) {
  const keys = new Set<string>();

  // Liston for all key inputs for createScene.ts
  scene.onKeyboardObservable.add((info) => {
    const key = info.event.code.toLowerCase(); // Using e.code instead of e.key as it gives "KeyW" regardless of keyboard layout
    if (info.type === KeyboardEventTypes.KEYDOWN) keys.add(key);
    else if (info.type === KeyboardEventTypes.KEYUP) keys.delete(key);

      //console.log(key); // leaving in code as it indecates what input key was pressed
  });

  window.addEventListener("blur", () => keys.clear());

  return { isDown: (key: string) => keys.has(key) };
}