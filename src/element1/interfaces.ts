import type {
  Scene,
  Mesh,
  HemisphericLight,
  PointLight,
  SpotLight,
  DirectionalLight,
  Camera,
  ShadowGenerator,
  TransformNode,
  ArcRotateCamera,
} from "@babylonjs/core";

export interface SceneData {
  scene: Scene;
  box: Mesh;
  lightBulb: PointLight;
  lightDirectional?: DirectionalLight;
  lightSpot: SpotLight;
  lightHemispheric: HemisphericLight;
  sphere: Mesh;
  ground: Mesh;
  camera: Camera;
  shadowGenerator: ShadowGenerator;
}


export interface CelestialBody {
  name: string;
  anchor: TransformNode;     // moons attach here
  orbitPivot: TransformNode; // rotating this makes the body orbit its parent
  groundMesh: Mesh;          // rotating this makes the body spin
  cloudMesh?: Mesh;          // Optional cloud layer
  orbitSpeed: number;        // radians per second
  spinSpeed: number;         // radians per second
}

export interface SolarSystemData {
  scene: Scene;
  camera: ArcRotateCamera;
  sunLight: PointLight;
  bodies: CelestialBody[];
  shadowGenerator: ShadowGenerator;
}