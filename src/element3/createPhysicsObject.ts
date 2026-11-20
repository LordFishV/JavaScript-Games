import { MeshBuilder, PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";
import { createPbrMaterial } from "../shared/createMaterial";

export interface PhysicsObjectOptions {
  name: string;
  mass: number;
  friction?: number;
  restitution?: number;
}

export default function createPhysicsObject(
  scene: Scene,
  textureLocation: string,
  info: PhysicsObjectOptions,
) {
  const mesh = MeshBuilder.CreateBox(info.name, { size: 1 }, scene);
  // start above the ground so it falls (y of at least 2 avoids spawning inside the ground)
  mesh.position.set(Math.random() * 10, 2 + Math.random() * 8, Math.random() * 10);

  const mat = createPbrMaterial(scene, {
    name: info.name,
    textureLocation, // Uses "assets/element3/" passed from createScene
    textureName: info.name,
    textureType: ".webp",
    textureTypes: {
      normal: ".png",
    }
  });

  mesh.material = mat;

  const aggregate = new PhysicsAggregate(
    mesh,
    PhysicsShapeType.BOX,
    { mass: info.mass, friction: info.friction, restitution: info.restitution },
    scene
  );

  aggregate.body.setCollisionCallbackEnabled(true);
  aggregate.body.getCollisionObservable().add((event) => {
    // TODO: react to collisions
  });

  return { mesh, aggregate };
}