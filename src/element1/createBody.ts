import { MeshBuilder, TransformNode, StandardMaterial, Texture, Color3, Mesh } from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";
import type { CelestialBody } from "./interfaces";
import { assetUrl } from "../shared/assetUrl";

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

  const groundMesh = MeshBuilder.CreateSphere(info.name, { diameter: info.diameter, segments: 32 }, scene);
  groundMesh.parent = anchor;
    // Ground Layer
    const groundMat = new StandardMaterial(`${info.name}ground`, scene);
    const diffuse = new Texture(assetUrl(`assets/element1/${info.name}albedo.webp`), scene);
    const normal = new Texture(assetUrl(`assets/element1/${info.name}normal.png`), scene);
    const specular = new Texture(assetUrl(`assets/element1/${info.name}specular.png`), scene);


  if (info.isStar) {
    groundMat.emissiveTexture = diffuse;
    groundMat.disableLighting = true;
    groundMat.specularColor = Color3.Black();
  } else {
    groundMat.diffuseTexture = diffuse;

    // 1. Normal / Bump Map (adds mountain/terrain relief)
    if (info.hasNormal) {
      groundMat.bumpTexture = normal;
      groundMat.bumpTexture.level = 1.0; // Increase or decrease (e.g., 0.5 to 2.0) to tune bump depth
    }

    // 2. Specular Map (makes oceans shine while keeping land matte)
    if (info.hasSpecular) {
      groundMat.specularTexture = specular;
      groundMat.specularColor = new Color3(0.6, 0.6, 0.6); // Controls overall shine brightness
      groundMat.specularPower = 32; // Higher = tighter, sharper sun glint on oceans
    } else {
      groundMat.specularColor = Color3.Black(); // Keep matte for planets without a specular map
    }
  }

  groundMesh.material = groundMat;

    let cloudMesh: Mesh | undefined;

    if (info.hasClouds) {
      cloudMesh = MeshBuilder.CreateSphere(`&{info.name}clouds`,
        { diameter: info.diameter * 1.015, segments: 32 },
        scene);
      cloudMesh.parent = anchor;

      const cloudMat = new StandardMaterial(`${info.name}CloudMat`, scene);
      const cloudTex = new Texture(assetUrl(`assets/element1/${info.name}cloud.webp`), scene);
      cloudTex.getAlphaFromRGB = true

      cloudMat.diffuseTexture = cloudTex;
      cloudMat.opacityTexture = cloudTex;

      cloudMat.specularColor = Color3.Black(); // Prevents shiny plastic-looking clouds
      cloudMesh.material = cloudMat;
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