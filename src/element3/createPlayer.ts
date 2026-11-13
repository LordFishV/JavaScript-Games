import {
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  Quaternion,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";

export default function createPlayer(scene: Scene) {
  // TODO: replace this capsule with your animated character model
  //       (load a rigged .glb with LoadAssetContainerAsync, as in Element 2,
  //       and keep the physics capsule as the invisible collider)
  const mesh = MeshBuilder.CreateCapsule("player", { height: 2, radius: 0.5 }, scene);
  mesh.position.y = 2;

  const aggregate = new PhysicsAggregate(
    mesh,
    PhysicsShapeType.CAPSULE,
    { mass: 1, friction: 0.5, restitution: 0 },
    scene
  );

  aggregate.body.setMassProperties({ inertia: Vector3.Zero() });

  aggregate.body.setCollisionCallbackEnabled(true);
  aggregate.body.getCollisionObservable();

const visual = new TransformNode("playerVisual", scene);
  visual.parent = mesh;
  visual.rotationQuaternion = Quaternion.Identity();

  return { mesh, visual, aggregate };
}