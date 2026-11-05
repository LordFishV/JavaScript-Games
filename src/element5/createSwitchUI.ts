import { AdvancedDynamicTexture, Button, Control } from "@babylonjs/gui";
import type { Scene } from "@babylonjs/core";

export default function createSwitchUi(
  scene: Scene,
  label: string,
  onClick: () => void
) {
  const ui = AdvancedDynamicTexture.CreateFullscreenUI("switchUi", true, scene);

  const button = Button.CreateSimpleButton("switchButton", label);
  button.width = "220px";
  button.height = "50px";
  button.color = "white";
  button.background = "#2b6cb0";
  button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  button.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  button.left = "-20px";
  button.top = "20px";
  button.onPointerUpObservable.add(onClick);
  ui.addControl(button);

  // TODO: add your own GUI controls here (score, instructions, menus...)

  return { ui, button };
}