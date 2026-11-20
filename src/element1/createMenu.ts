import {
  AdvancedDynamicTexture,
  Button,
  Control,
  Rectangle,
  StackPanel,
  TextBlock,
} from "@babylonjs/gui";
import { MAX_TIME_SCALE } from "./realTime";
import type { Scene } from "@babylonjs/core";
import type { AudioManager } from "../element4/createAudio"; // must match the import path in createScene.ts

// What createMenu hands back to the scene. The scene calls these to update the GUI;
// the menu never reads or changes the simulation itself.
export interface Menu {
  setTimeScale(value: number): void;
}

export default function createMenu(
  scene: Scene,
  audio: AudioManager,
  onStart: () => void // called once the menu has faded out; the scene decides what "start" means
): Menu {
  const engine = scene.getEngine();

  // Every audio toggle button (menu and HUD) goes in here so their labels stay in sync
  const audioButtons: Button[] = [];

  // ===================================================================
  // 1. HELPERS
  // ===================================================================

  // One place to style every button
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

  // One place to style every piece of left-aligned text
  function makeText(name: string, text: string, size: number, height: string) {
    const t = new TextBlock(name, text);
    t.color = "white";
    t.fontSize = size;
    t.height = height;
    t.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    return t;
  }

  // Audio starts off, so the label has to follow the real state
  const audioLabel = () => `Audio: ${audio.enabled ? "On" : "Off"}`;

  function refreshAudioLabels() {
    for (const b of audioButtons) {
      if (b.textBlock) b.textBlock.text = audioLabel();
    }
  }

  // A button that toggles audio. Browsers only allow audio after a click,
  // which is why audio.toggle() is called from a button press.
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

  // Fade a control's alpha to 0 or 1 over `ms` milliseconds.
  // It runs on delta time, so it takes the same time no matter the FPS.
  function fade(control: Control, to: 0 | 1, ms: number, done?: () => void) {
    const observer = scene.onBeforeRenderObservable.add(() => {
      const step = engine.getDeltaTime() / ms;
      control.alpha =
        to === 1
          ? Math.min(1, control.alpha + step)
          : Math.max(0, control.alpha - step);

      if (control.alpha === to) {
        scene.onBeforeRenderObservable.remove(observer); // stop running once the fade is done
        done?.();
      }
    });
  }

  // ===================================================================
  // 2. HUD (shown during play)
  //    Created BEFORE the menu so the menu is drawn on top of it.
  // ===================================================================
  const hudUi = AdvancedDynamicTexture.CreateFullscreenUI("hudUi", true, scene);

  const hudRoot = new Rectangle("hudRoot");
  hudRoot.width = "100%";
  hudRoot.height = "100%";
  hudRoot.thickness = 0;
  hudRoot.isVisible = false; // hidden until Start is pressed
  hudUi.addControl(hudRoot);

  // ---------- time readout (top left) ----------
  const timePanel = new StackPanel("timePanel"); // stacks its children vertically
  timePanel.width = "260px";
  timePanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  timePanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  timePanel.left = "20px";
  timePanel.top = "20px";
  hudRoot.addControl(timePanel);

  const speedText = makeText("speedText", "Time: 1.0x", 28, "38px"); // the signed value
  const directionText = makeText("directionText", ">> Forward", 20, "28px"); // forward / reverse / paused
  timePanel.addControl(speedText);
  timePanel.addControl(directionText);

  // Bar: the centre means "stopped". The fill grows right for forward and left for reverse.
  const BAR_HALF = 120; // half the track width in pixels

  const barHolder = new Rectangle("barHolder");
  barHolder.width = "240px";
  barHolder.height = "24px";
  barHolder.thickness = 0;
  timePanel.addControl(barHolder);

  const track = new Rectangle("track"); // the faint line behind the fill
  track.width = "240px";
  track.height = "10px";
  track.thickness = 0;
  track.background = "rgba(255, 255, 255, 0.2)";
  barHolder.addControl(track);

  const fill = new Rectangle("fill"); // the coloured part that grows
  fill.height = "10px";
  fill.width = "0px";
  fill.thickness = 0;
  track.addControl(fill);

  const centreTick = new Rectangle("centreTick"); // marks the "stopped" position
  centreTick.width = "2px";
  centreTick.height = "18px";
  centreTick.thickness = 0;
  centreTick.background = "white";
  barHolder.addControl(centreTick);

  const hint = makeText("hint", "A: slower / reverse    D: faster", 14, "22px");
  hint.color = "rgba(255, 255, 255, 0.6)";
  timePanel.addControl(hint);

  // TODO: add a "selected planet" readout and a "click a planet to focus" hint here

  // ---------- audio button (top right) ----------
  const hudAudioButton = makeAudioButton("hudAudio", "160px");
  hudAudioButton.height = "40px";
  hudAudioButton.fontSize = 16;
  hudAudioButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  hudAudioButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  hudAudioButton.left = "-20px"; // negative = in from the right edge
  hudAudioButton.top = "20px";
  hudRoot.addControl(hudAudioButton);

  // Updates the readout. Called by the scene every frame, so it returns early
  // unless the displayed text would actually change.
  let lastLabel = "";

    // Turns a number of simulated seconds per second into something readable: "1.0 day / s"
  const UNITS: [number, string][] = [
    [31557600, "yr"], [2629800, "month"], [604800, "wk"],
    [86400, "day"], [3600, "hr"], [60, "min"], [1, "s"],
  ];

  function formatRate(value: number) {
    const a = Math.abs(value);
    const [size, name] = UNITS.find(([s]) => a >= s) ?? [1, "s"];
    const n = a / size;
    return `${n >= 10 ? n.toFixed(0) : n.toFixed(1)} ${name} / s`;
  }

  function setTimeScale(value: number) {
    const paused = Math.abs(value) < 0.5;
    const direction = paused ? "Paused" : value > 0 ? "Forward" : "Reverse";
    const isRealTime = Math.abs(Math.abs(value) - 1) < 0.05;
    const rate = isRealTime ? "Real time" : formatRate(value);

    // only touch the GUI when the displayed text would actually change
    const label = `${paused ? "paused" : rate}|${direction}`;
    if (label === lastLabel) return;
    lastLabel = label;

    const colour = paused ? "#9ca3af" : value > 0 ? "#4ade80" : "#fb923c";
    speedText.text = paused ? "Paused" : `${value < 0 ? "-" : ""}${rate}`;
    directionText.text = `${paused ? "||" : value > 0 ? ">>" : "<<"} ${direction}`;
    directionText.color = colour;

    // log scale: the range is now 1 to 320,000,000
    const magnitude = Math.log10(1 + Math.abs(value)) / Math.log10(1 + MAX_TIME_SCALE);
    const width = magnitude * BAR_HALF;
    fill.width = `${width}px`;
    fill.left = `${(Math.sign(value) * width) / 2}px`;
    fill.background = colour;
  }

  // ===================================================================
  // 3. MAIN MENU (shown first)
  // ===================================================================
  const menuUi = AdvancedDynamicTexture.CreateFullscreenUI("menuUi", true, scene);

  const backdrop = new Rectangle("backdrop"); // dark overlay covering the whole screen
  backdrop.width = "100%";
  backdrop.height = "100%";
  backdrop.thickness = 0;
  backdrop.background = "rgba(10, 15, 30, 0.85)";
  backdrop.isPointerBlocker = true; // clicks must not reach the 3D scene underneath
  menuUi.addControl(backdrop);

  const panel = new StackPanel("menuPanel"); // the column of title and buttons
  panel.width = "400px";
  backdrop.addControl(panel);

  const title = new TextBlock("title", "Solar System"); // TODO: your own title
  title.color = "white";
  title.fontSize = 36;
  title.height = "80px";
  panel.addControl(title);

  const startButton = makeButton("start", "Start");
  startButton.onPointerUpObservable.add(() => {
    audio.playSfx("click");
    startButton.isEnabled = false; // stops double clicks during the fade

    // fade the menu out, then remove it, fade the HUD in, and tell the scene to start
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

  // ===================================================================
  // 4. PUBLIC API
  // ===================================================================
  return { setTimeScale };
}