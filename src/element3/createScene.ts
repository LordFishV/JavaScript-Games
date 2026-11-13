import {
  Scene,
  Engine,
  ArcRotateCamera,
  Vector3,
  MeshBuilder,
  HemisphericLight,
  PhysicsAggregate,
  PhysicsShapeType,
  Quaternion,
  Ray,
} from "@babylonjs/core";
import createPhysics from "./createPhysics";
import createInput from "./createInput";
import createPlayer from "./createPlayer";
import createPhysicsObject from "./createPhysicsObject";

// ---------- tuning values ----------
const WALK_SPEED = 5;
const RUN_SPEED = 10;
const JUMP_SPEED = 10;
const TURN_SPEED = 0.15; // how quickly the character turns to face the movement direction
const GROUND_RAY_LENGTH = 1.2; // slightly longer than half the capsule height
const BOX_LIFT = new Vector3(0, 1, 0);

type PlayerState = "idle" | "walk" | "run" | "jump" | "falling";

function pickState(grounded: boolean, moving: boolean, run: boolean, yVelocity: number): PlayerState {
  if (!grounded) return yVelocity > 0 ? "jump" : "falling";
  if (moving) return run ? "run" : "walk";
  return "idle";
}

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

  // ---------- physics objects ----------
  const boxes = [
    createPhysicsObject(scene, { name: "box1", mass: 1 }),
    createPhysicsObject(scene, { name: "box2", mass: 0.5 }),
    createPhysicsObject(scene, { name: "box3", mass: 10 }),
  ];

  // ---------- player state ----------
  let currentState: PlayerState | "" = "";
  function setState(next: PlayerState) {
    if (next === currentState) return;
    console.log(next);
    currentState = next;
    // TODO: stop the old AnimationGroup, start the new one
  }

  const groundRay = new Ray(Vector3.Zero(), Vector3.Down(), GROUND_RAY_LENGTH);

  // ---------- runs every frame ----------
  scene.onBeforeRenderObservable.add(() => {
    // direction, relative to the camera
    const x = (input.isDown("keyd") ? 1 : 0) - (input.isDown("keya") ? 1 : 0);
    const z = (input.isDown("keyw") ? 1 : 0) - (input.isDown("keys") ? 1 : 0);

    const forward = camera.getForwardRay().direction;
    forward.y = 0; // keep movement flat
    forward.normalize();
    const right = Vector3.Cross(Vector3.Up(), forward);

    const direction = right.scale(x).add(forward.scale(z)).normalize();
    const moving = direction.lengthSquared() > 0;

    // movement
    const run = input.isDown("shiftleft");
    const speed = run ? RUN_SPEED : WALK_SPEED;
    const body = player.aggregate.body;
    const velocity = body.getLinearVelocity();

    body.setLinearVelocity(
      new Vector3(direction.x * speed, velocity.y, direction.z * speed)
    );

    // ground check (ray from the player, ignoring the player's own meshes)
    groundRay.origin.copyFrom(player.mesh.position);
    const hit = scene.pickWithRay(
      groundRay,
      (m) => m !== player.mesh && !m.isDescendantOf(player.mesh)
    );
    const grounded = hit?.hit === true;

    // jump
    const jumped = grounded && input.isDown("space");
    if (jumped) {
      body.setLinearVelocity(
        new Vector3(direction.x * speed, JUMP_SPEED, direction.z * speed)
      );
    }

    // turn the visual to face the direction of travel
    if (moving) {
      const target = Quaternion.FromEulerAngles(0, Math.atan2(direction.x, direction.z), 0);
      player.visual.rotationQuaternion = Quaternion.Slerp(
        player.visual.rotationQuaternion!, target, TURN_SPEED
      );
    }

    // pick the state once, after everything above has been decided
    setState(
      pickState(grounded && !jumped, moving, run, jumped ? JUMP_SPEED : velocity.y)
    );

    // E: push the boxes up, F: freeze them in place
    if (input.isDown("keye")) {
      for (const box of boxes) {
        box.aggregate.body.applyImpulse(BOX_LIFT, box.mesh.getAbsolutePosition());
      }
    }
    if (input.isDown("keyf")) {
      for (const box of boxes) {
        box.aggregate.body.setLinearVelocity(Vector3.Zero());
        box.aggregate.body.setAngularVelocity(Vector3.Zero());
      }
    }
  });

  return { scene, camera };
}