import { KeyboardEventTypes } from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";

export default function createInput(scene: Scene) {
  const keys = new Set<string>();

  scene.onKeyboardObservable.add((info) => {
    const key = info.event.key.toLowerCase();
    if (info.type === KeyboardEventTypes.KEYDOWN) keys.add(key);
    else if (info.type === KeyboardEventTypes.KEYUP) keys.delete(key);
  });

  return { isDown: (key: string) => keys.has(key) };
}