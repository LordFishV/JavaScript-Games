import type { Scene, Camera } from "@babylonjs/core";

export type SceneName = "scene1" | "scene2";

export interface ManagedScene {
  scene: Scene;
  camera?: Camera; // optional: set this if the scene has a camera you control
}

export default class SceneManager {
  private scenes = new Map<SceneName, ManagedScene>();
  private currentName?: SceneName;

  get active(): Scene | undefined {
    return this.currentName && this.scenes.get(this.currentName)?.scene;
  }

  add(name: SceneName, managed: ManagedScene) {
    // only the active scene should listen for input
    managed.scene.detachControl();
    this.scenes.set(name, managed);
  }

  switchTo(name: SceneName) {
    const next = this.scenes.get(name);
    if (!next) throw new Error(`Unknown scene: ${name}`);

    // hand input over from the old scene to the new one
    if (this.currentName) {
      const prev = this.scenes.get(this.currentName);
      prev?.camera?.detachControl();
      prev?.scene.detachControl();
    }
    next.scene.attachControl();
    next.camera?.attachControl(true);

    this.currentName = name;

    // TODO: anything that should happen on entering a scene (reset score, play audio, etc.)
  }
}