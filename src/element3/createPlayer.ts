import "@babylonjs/loaders/glTF"; // registers the glTF loader for this page
import {
  LoadAssetContainerAsync,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  Quaternion,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";
import { assetUrl } from "../shared/assetUrl";

const CAPSULE_HEIGHT = 2;
const CAPSULE_RADIUS = 0.5;
const MODEL_SCALE = 1; // TODO: tune so the character matches the capsule's size

export default async function createPlayer(scene: Scene, name: string) {
  // 1. invisible capsule: this is what Havok simulates
  const holder = MeshBuilder.CreateCapsule(
    name,
    { height: CAPSULE_HEIGHT, radius: CAPSULE_RADIUS },
    scene
  );
  holder.position.y = 2; // start in the air so it isn't inside the ground
  holder.isVisible = false;

  // create the physics body BEFORE parenting the model, so the capsule
  // is sized from the capsule mesh alone
  const aggregate = new PhysicsAggregate(
    holder,
    PhysicsShapeType.CAPSULE,
    { mass: 1, friction: 0.5, restitution: 0 },
    scene
  );
  aggregate.body.setMassProperties({ inertia: Vector3.Zero() }); // stops it tipping over
  aggregate.body.setCollisionCallbackEnabled(true);

  aggregate.body.getCollisionObservable().add((event) => {
    //to react to collisions
  });

  // rotate to face the movement direction
  const visual = new TransformNode("playerVisual", scene);
  visual.parent = holder;
  visual.rotationQuaternion = Quaternion.Identity();
  visual.position.y = -CAPSULE_HEIGHT / 2; // model origin is usually at its feet
  visual.scaling.setAll(MODEL_SCALE);

  // load the model and hang it off the visual node
  const container = await LoadAssetContainerAsync(
    assetUrl("assets/element3/player.glb"),
    scene
  );
  const entries = container.instantiateModelsToScene();
  entries.rootNodes.forEach((node) => (node.parent = visual));

  // glTF loaders may start the first animation automatically, so stop them all
  entries.animationGroups.forEach((group) => group.stop());

  return { holder, visual, aggregate, animationGroups: entries.animationGroups };
}