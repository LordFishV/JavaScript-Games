import type { SceneData } from "./interfaces";

import {
  Scene,
  ArcRotateCamera,
  Vector3,
  MeshBuilder,
  Mesh,
  StandardMaterial,
  HemisphericLight,
  PointLight,
  SpotLight,
  DirectionalLight,
  Color3,
  ShadowGenerator,
  Engine,
} from "@babylonjs/core";

function createBox(scene: Scene) {
  const box = MeshBuilder.CreateBox("box", {}, scene);
  box.position.y = 0.51;
  return box;
}

function createPointLight(scene: Scene) {
  const light = new PointLight("pointLight", new Vector3(-1, 1, 0), scene);
  light.position = new Vector3(5, 20, 10);
  light.intensity = 0.3;
  light.diffuse = new Color3(0.5, 1, 1);
  light.specular = new Color3(0.8, 1, 1);
  return light;
}

function createDirectionalLight(scene: Scene) {
  const light = new DirectionalLight(
    "directionalLight",
    new Vector3(0.2, -1, 0.2),
    scene
  );
  light.position = new Vector3(20, 40, 20);
  light.intensity = 0.7;
  light.diffuse = new Color3(1, 0, 0);
  light.specular = new Color3(0, 1, 0);
  return light;
}

function createSpotLight(scene: Scene) {
  const light = new SpotLight(
    "spotLight",
    new Vector3(1, 5, -3),
    new Vector3(0, -1, 0),
    Math.PI / 3,
    20,
    scene
  );
  light.intensity = 0.7;
  light.diffuse = new Color3(1, 0, 0);
  light.specular = new Color3(0, 1, 0);
  return light;
}

function createHemisphericLight(scene: Scene) {
  const light = new HemisphericLight(
    "hemisphericLight",
    new Vector3(1, 10, 0),
    scene
  );
  light.intensity = 0.3;
  light.diffuse = new Color3(1, 0, 0);
  light.specular = new Color3(0, 1, 0);
  light.groundColor = new Color3(0, 1, 0);
  return light;
}

function createShadows(light: DirectionalLight, sphere: Mesh, box: Mesh) {
  const shadower = new ShadowGenerator(1024, light);
  const shadowmap = shadower.getShadowMap();
  shadowmap?.renderList?.push(sphere, box);

  shadower.setDarkness(0.2);
  shadower.useBlurExponentialShadowMap = true;
  shadower.blurScale = 4;
  shadower.blurBoxOffset = 1;
  shadower.useKernelBlur = true;
  shadower.blurKernel = 64;
  shadower.bias = 0;
  return shadower;
}

function createSphere(scene: Scene) {
  const sphere = MeshBuilder.CreateSphere(
    "sphere",
    { diameter: 2, segments: 32 },
    scene
  );
  sphere.position.y = 1.5;
  return sphere;
}

function createGround(scene: Scene) {
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: 6, height: 6 },
    scene
  );
  const groundMaterial = new StandardMaterial("groundMaterial", scene);
  groundMaterial.backFaceCulling = false;
  ground.material = groundMaterial;
  ground.receiveShadows = true;
  return ground;
}

function createArcRotateCamera(scene: Scene) {
  const camAlpha = -Math.PI / 2;
  const camBeta = Math.PI / 2.5;
  const camDist = 10;
  const camTarget = new Vector3(0, 0, 0);
  const camera = new ArcRotateCamera(
    "camera1",
    camAlpha,
    camBeta,
    camDist,
    camTarget,
    scene
  );
  camera.attachControl(true);
  return camera;
}

export default function createStartScene(engine: Engine): SceneData {
  const scene = new Scene(engine);
  const box = createBox(scene);
  const lightBulb = createPointLight(scene);
  const lightDirectional = createDirectionalLight(scene);
  const lightSpot = createSpotLight(scene);
  const lightHemispheric = createHemisphericLight(scene);
  const sphere = createSphere(scene);
  const ground = createGround(scene);
  const camera = createArcRotateCamera(scene);
  const shadowGenerator = createShadows(lightDirectional, sphere, box);

  return {
    scene,
    box,
    lightBulb,
    lightDirectional,
    lightSpot,
    lightHemispheric,
    sphere,
    ground,
    camera,
    shadowGenerator,
  };
}