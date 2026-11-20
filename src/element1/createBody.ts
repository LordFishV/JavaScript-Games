import { MeshBuilder, TransformNode, StandardMaterial, Mesh, Scene, Vector3 } from "@babylonjs/core";
import type { CelestialBody } from "./interfaces";
import { createStandardMaterial } from "../shared/createMaterial";

export interface BodyOptions {
  name: string;
  diameter: number;
  distance: number;      // The distance from whatever it orbits
  orbitSpeed: number;
  spinSpeed: number;
  parent: TransformNode; // The object it orbits (the sun's anchor or a planet's anchor)
  isStar?: boolean;
  hasClouds?: boolean;
  hasNormal?: boolean;
  hasSpecular?: boolean;
}

export default function createBody(scene: Scene, info: BodyOptions): CelestialBody {
  const orbitPivot = new TransformNode(`${info.name}Orbit`, scene);
  orbitPivot.parent = info.parent;

  const anchor = new TransformNode(`${info.name}Anchor`, scene);
  anchor.parent = orbitPivot;
  anchor.position.x = info.distance; // standing off to one side of the pivot

  const groundMesh = MeshBuilder.CreateSphere(
    info.name,
    { diameter: info.diameter, segments: 32, },
    scene
  );
  groundMesh.parent = anchor;

  // Ground Layer
  const groundMaterial: StandardMaterial = info.isStar
    ? createStandardMaterial(scene, {
        name: info.name,
        textureLocation: "assets/element1/",
        textureName: info.name,
        textureType: ".webp",
        hasEmissive: true,
      })
    : createStandardMaterial(scene, {
      name: info.name,
      textureLocation: "assets/element1/",
      textureName: info.name,
      textureType: ".webp", // Default for albedo & specular
      textureTypes: {
      normal: ".png",     // Loads earthnormal.png instead of earthnormal.webp
    },
    hasNormal: info.hasNormal,
    hasSpecular: info.hasSpecular,
  });


  groundMesh.material = groundMaterial;

    let cloudMesh;
  if (info.hasClouds) {
    cloudMesh = MeshBuilder.CreateSphere(
      `${info.name}cloud`,
      { diameter: info.diameter * 1.015, segments: 32 },
      scene
    );
    cloudMesh.parent = anchor;

    const cloudMaterial = createStandardMaterial(scene, {
      name: `${info.name}cloud`,
      textureLocation: "assets/element1/",
      textureName: `${info.name}cloud`,
      textureType: ".webp",
      hasTransparency: "RGB",
    });

    cloudMesh.material = cloudMaterial;
  }

  return {
    name: info.name,
    anchor,
    orbitPivot,
    groundMesh,
    cloudMesh, // Return it so we can animate it
    orbitSpeed: info.orbitSpeed,
    spinSpeed: info.spinSpeed,
  };
}
