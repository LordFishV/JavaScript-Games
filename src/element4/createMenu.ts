import {
  AdvancedDynamicTexture,
  Button,
  Control,
  Rectangle,
  StackPanel,
  TextBlock,
} from "@babylonjs/gui";
import type { Scene } from "@babylonjs/core";
import type { AudioManager } from "./createAudio";

export interface Menu {
  setScore(score: number): void;
}

export default function createMenu(
  scene: Scene,
  audio: AudioManager,
  onStart: () => void
): Menu {
  const engine = scene.getEngine();
  const audioButtons: Button[] = [];

  // ---------- helpers ----------
  function makeButton(name: string, label: string, width = "220px") {
    const button = Button.CreateSimpleButton(name, label);
    button.width = width;
    button.height = "50px";
    button.color = "white";
    button.background = "#2b6cb0";
    button.cornerRadius = 8;
    button.thickness = 1;
    button.fontSize = 20;
    button.paddingTop = "12px";
    return button;
  }

  const audioLabel = () => `Audio: ${audio.enabled ? "On" : "Off"}`;

  function refreshAudioLabels() {
    for (const b of audioButtons) {
      if (b.textBlock) b.textBlock.text = audioLabel();
    }
  }

  function makeAudioButton(name: string, width?: string) {
    const button = makeButton(name, audioLabel(), width);
    button.onPointerUpObservable.add(async () => {
      await audio.toggle();
      refreshAudioLabels();
      audio.playSfx("click"); // only audible once audio is on
    });
    audioButtons.push(button);
    return button;
  }

  // fade a control's alpha to 0 or 1 over `ms` milliseconds
  function fade(control: Control, to: 0 | 1, ms: number, done?: () => void) {
    const observer = scene.onBeforeRenderObservable.add(() => {
      const step = engine.getDeltaTime() / ms;
      control.alpha =
        to === 1
          ? Math.min(1, control.alpha + step)
          : Math.max(0, control.alpha - step);
      if (control.alpha === to) {
        scene.onBeforeRenderObservable.remove(observer);
        done?.();
      }
    });
  }

  // ---------- HUD (shown during play) ----------
  const hudUi = AdvancedDynamicTexture.CreateFullscreenUI("hudUi", true, scene);
  const hudRoot = new Rectangle("hudRoot");
  hudRoot.width = "100%";
  hudRoot.height = "100%";
  hudRoot.thickness = 0;
  hudRoot.isVisible = false;
  hudUi.addControl(hudRoot);

  const scoreText = new TextBlock("score", "Score: 0");
  scoreText.color = "white";
  scoreText.fontSize = 28;
  scoreText.width = "300px";
  scoreText.height = "40px";
  scoreText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  scoreText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  scoreText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  scoreText.left = "20px";
  scoreText.top = "20px";
  hudRoot.addControl(scoreText);

  const hudAudioButton = makeAudioButton("hudAudio", "160px");
  hudAudioButton.height = "40px";
  hudAudioButton.fontSize = 16;
  hudAudioButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  hudAudioButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  hudAudioButton.left = "-20px";
  hudAudioButton.top = "20px";
  hudRoot.addControl(hudAudioButton);

  // ---------- main menu ----------
  const menuUi = AdvancedDynamicTexture.CreateFullscreenUI("menuUi", true, scene);

  const backdrop = new Rectangle("backdrop");
  backdrop.width = "100%";
  backdrop.height = "100%";
  backdrop.thickness = 0;
  backdrop.background = "rgba(10, 15, 30, 0.85)";
  backdrop.isPointerBlocker = true; // clicks must not reach the scene underneath
  menuUi.addControl(backdrop);

  const panel = new StackPanel("menuPanel");
  panel.width = "320px";
  backdrop.addControl(panel);

  const title = new TextBlock("title", "Element 4: GUI Demo");
  title.color = "white";
  title.fontSize = 36;
  title.height = "80px";
  panel.addControl(title);

  const startButton = makeButton("start", "Start");
  startButton.onPointerUpObservable.add(() => {
    audio.playSfx("click");
    startButton.isEnabled = false; // avoid double clicks during the fade
    fade(backdrop, 0, 500, () => {
      menuUi.dispose();
      hudRoot.alpha = 0;
      hudRoot.isVisible = true;
      fade(hudRoot, 1, 400);
      onStart();
    });
  });
  panel.addControl(startButton);

  panel.addControl(makeAudioButton("menuAudio"));

  // ---------- public API ----------
  return {
    setScore(score: number) {
      scoreText.text = `Score: ${score}`;
      scoreText.color = "gold"; // brief flash so the change is visible
      setTimeout(() => (scoreText.color = "white"), 200);
    },
  };
}