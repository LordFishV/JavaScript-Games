import { KeyboardEventTypes, PointerEventTypes } from "@babylonjs/core";
import type { AbstractMesh, Scene } from "@babylonjs/core";

export default function createInput(scene: Scene) {
  const keys = new Set<string>();
  const clickListeners = new Set<(mesh: AbstractMesh) => void>();

  // Listen for all key inputs for createScene.ts
  scene.onKeyboardObservable.add((info) => {
    const key = info.event.code.toLowerCase(); // Using e.code instead of e.key as it gives "KeyW" regardless of keyboard layout
    if (info.type === KeyboardEventTypes.KEYDOWN) keys.add(key);
    else if (info.type === KeyboardEventTypes.KEYUP) keys.delete(key);

    console.log(key); // leaving in code as it indicates what input key was pressed
  });

  // Listen for quick click/tap events (ignores camera drag)
  scene.onPointerObservable.add((info) => {
    if (info.type !== PointerEventTypes.POINTERTAP) return;

    const pickedMesh = info.pickInfo?.pickedMesh;
    if (!pickedMesh) return;

    for (const listener of clickListeners) {
      listener(pickedMesh);
    }
  });

  window.addEventListener("blur", () => keys.clear());

  return {
    isDown: (key: string) => keys.has(key),
    onMeshClick: (callback: (mesh: AbstractMesh) => void) => {
      clickListeners.add(callback);
      return () => clickListeners.delete(callback); // Optional unsubscribe cleanup
    },
  };
}
