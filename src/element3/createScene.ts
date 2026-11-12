import {
  Scene,
  Engine,
  ArcRotateCamera,
  Vector3,
  MeshBuilder,
  HemisphericLight,
  PhysicsAggregate,
  PhysicsShapeType,
} from "@babylonjs/core";
import createPhysics from "./createPhysics";
import createInput from "./createInput";
import createPlayer from "./createPlayer";

export default async function createScene(engine: Engine) {
  const scene = new Scene(engine);
  await createPhysics(scene); // must finish before any PhysicsAggregate is created

  const camera = new ArcRotateCamera(
    "cam", -Math.PI / 2, Math.PI / 3, 15, Vector3.Zero(), scene
  );
  new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  // ground: mass 0 = static (never moves)
  const ground = MeshBuilder.CreateGround("ground", { width: 40, height: 40 }, scene);
  new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, scene);

  const input = createInput(scene);
  const player = createPlayer(scene);
  camera.lockedTarget = player.mesh; // camera follows the player
  camera.attachControl(true);

  // TODO: objects for the player to interact with. Dynamic bodies (mass > 0)
  //       get pushed around and fall; static bodies (mass 0) stay put:
  //       const box = MeshBuilder.CreateBox("box", { size: 1 }, scene);
  //       new PhysicsAggregate(box, PhysicsShapeType.BOX, { mass: 1 }, scene);

  // runs every frame
  scene.onBeforeRenderObservable.add(() => {
    // TODO: movement. Read keys with input.isDown("w") / "a" / "s" / "d" / " ",
    //       then move the player. Two common approaches:
    //       - set velocity:  player.aggregate.body.setLinearVelocity(new Vector3(vx, vy, vz))
    //         (keep the current y velocity so gravity still works)
    //       - apply forces: player.aggregate.body.applyForce(...)
    // TODO: rotate the player to face the direction of travel
    // TODO: pick the animation (idle / walk / run) from the current speed
    // TODO: jumping (only when standing on the ground)
  });

  // TODO: react to collisions, e.g. with player.aggregate.body.setCollisionCallbackEnabled(true)
  //       and the body's getCollisionObservable()

  return { scene, camera };
}