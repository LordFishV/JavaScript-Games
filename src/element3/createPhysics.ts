import HavokPhysics from "@babylonjs/havok";
import { HavokPlugin, Vector3 } from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";
import { assetUrl } from "../shared/assetUrl";

export default async function createPhysics(scene: Scene) {
  // tell Havok where the wasm file is
  const havok = await HavokPhysics({
    locateFile: () => assetUrl("HavokPhysics.wasm"),
  });
  scene.enablePhysics(new Vector3(0, -9.81, 0), new HavokPlugin(true, havok));
}