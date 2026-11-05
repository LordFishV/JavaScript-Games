import { CreateAudioEngineAsync, CreateSoundAsync } from "@babylonjs/core";
import type { StaticSound } from "@babylonjs/core";
import { assetUrl } from "../shared/assetUrl";

export type SfxName = "click" | "collect";
const SFX_NAMES: SfxName[] = ["click", "collect"];

export interface AudioManager {
  readonly enabled: boolean;
  setEnabled(on: boolean): Promise<void>;
  toggle(): Promise<boolean>;
  playSfx(name: SfxName): void;
}

export default async function createAudio(): Promise<AudioManager> {
  // Load everything up front. Nothing plays until audio is enabled.
  const engine = await CreateAudioEngineAsync();

  const music = await CreateSoundAsync(
    "ambient",
    assetUrl("assets/element4/ambient.wav"),
    { loop: true, volume: 0.4 }
  );

  const sfx = new Map<SfxName, StaticSound>();
  for (const name of SFX_NAMES) {
    sfx.set(
      name,
      await CreateSoundAsync(name, assetUrl(`assets/element4/${name}.wav`))
    );
  }

  let enabled = false;

  async function setEnabled(on: boolean) {
    if (on) {
      // must be triggered by a click: browsers block audio until the user interacts
      await engine.unlockAsync();
      music.play();
    } else {
      music.stop();
    }
    enabled = on;
  }

  return {
    get enabled() {
      return enabled;
    },
    setEnabled,
    async toggle() {
      await setEnabled(!enabled);
      return enabled;
    },
    playSfx(name) {
      if (enabled) sfx.get(name)?.play();
    },
  };
}