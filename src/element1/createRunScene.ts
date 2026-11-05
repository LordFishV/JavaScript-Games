import { Vector3, Quaternion } from "@babylonjs/core";
import type { SceneData } from "./interfaces";

// rotate box
let boxAngle = 0;
const boxSpeed = 0.01;
const boxAxis = new Vector3(1, 1, 0).normalize(); // tilted so the spin is easy to see

// move light in ellipse and cycle luma
let lightAngle = 0;
const lightSpeed = 0.005;
const lightXpos = 1;
const lightZpos = 5;

// vertical oscillation of meshes
let verticalAngle = 0;
const verticalSpeed = 0.006;
const verticalRangeY = 0.3;
const boxPositionY = 4;
const spherePositionY = 1.5;

export default function createRunScene(runScene: SceneData) {
  runScene.scene.onBeforeRenderObservable.add(() => {
    // rotate box
    boxAngle += boxSpeed;
    runScene.box.rotationQuaternion = Quaternion.RotationAxis(
      boxAxis,
      boxAngle * 2 * Math.PI
    );

    // move light in ellipse and cycle luma (0 to 0.7, never negative)
    runScene.lightSpot.position = new Vector3(
      lightXpos + 8 * Math.sin(lightAngle * 2 * Math.PI),
      20,
      lightZpos + 10 * Math.cos(lightAngle * 2 * Math.PI)
    );
    runScene.lightSpot.intensity =
      0.35 * (1 + Math.sin(lightAngle * 2 * Math.PI));
    lightAngle += lightSpeed;

    // vertical oscillation of meshes
    runScene.box.position.y =
      boxPositionY + verticalRangeY * Math.sin(verticalAngle * 2 * Math.PI);
    runScene.sphere.position.y =
      spherePositionY - verticalRangeY * Math.sin(verticalAngle * 2 * Math.PI);
    verticalAngle += verticalSpeed;
  });
}