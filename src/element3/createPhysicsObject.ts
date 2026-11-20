import { MeshBuilder, PBRMaterial, PhysicsAggregate, PhysicsShapeType, Texture } from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";
import { assetUrl } from "../shared/assetUrl";

export interface PhysicsObjectOptions {
  name: string;
  mass: number;
  friction?: number;
  restitution?: number;
}

export default function createPhysicsObject(
  scene: Scene, textureLocation: string, textureName: string, textureType: string,
  { name, mass, friction = 0.5, restitution = 0.2 }: PhysicsObjectOptions
) {
  const mesh = MeshBuilder.CreateBox(name, { size: 1 }, scene);
  // start above the ground so it falls (y of at least 2 avoids spawning inside the ground)
  mesh.position.set(Math.random() * 10, 2 + Math.random() * 8, Math.random() * 10);

  const mat = new PBRMaterial("physics", scene);
  mat.albedoTexture = new Texture(assetUrl(`${textureLocation}${textureName}albedo${textureType}`));
  mat.bumpTexture = new Texture(assetUrl(`${textureLocation}${textureName}normal${textureType}`));
  mat.metallicTexture = new Texture(assetUrl(`${textureLocation}${textureName}aor${textureType}`));
  mat.useAmbientOcclusionFromMetallicTextureRed;
  mat.useRoughnessFromMetallicTextureGreen;
  mat.metallic = 1;
  console.log(mat.albedoTexture);

  mesh.material = mat;

  const aggregate = new PhysicsAggregate(
    mesh,
    PhysicsShapeType.BOX,
    { mass, friction, restitution },
    scene
  );

  aggregate.body.setCollisionCallbackEnabled(true);
  aggregate.body.getCollisionObservable().add((event) => {
    // TODO: react to collisions (change colour, play a sound, update the GUI...)
    // Log one event first to see what it contains, then remove the log:
    // console.log(event);
  });

  return { mesh, aggregate };
}