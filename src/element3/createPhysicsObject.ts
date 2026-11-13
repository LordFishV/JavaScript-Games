import { MeshBuilder, PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";

export interface PhysicsObjectOptions {
  name: string;
  mass: number;
  friction?: number;
  restitution?: number;
}

export default function createPhysicsObject(
  scene: Scene,
  { name, mass, friction = 0.5, restitution = 0.2 }: PhysicsObjectOptions
) {
  const mesh = MeshBuilder.CreateBox(name, { size: 1 }, scene);
  // start above the ground so it falls (y of at least 2 avoids spawning inside the ground)
  mesh.position.set(Math.random() * 10, 2 + Math.random() * 8, Math.random() * 10);

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