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
  TransformNode,
  BodyJointParentIndex,
  Ray,
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

  let currentState = "";

  function setState(next: string) {
  if (next === currentState) return;
  console.log(next);
  currentState = next;
  // TODO: stop the old AnimationGroup, start the new one
  }


  // runs every frame
  scene.onBeforeRenderObservable.add(() => {
  const x = (input.isDown("keyd") ? 1 : 0) - (input.isDown("keya") ? 1 : 0); // Right & Left
  const z = (input.isDown("keyw") ? 1 : 0) - (input.isDown("keys") ? 1 : 0); // Forward & Back

  const forward = camera.getForwardRay().direction;   // Camera forward vector
  forward.y = 0;                                      // Flat forward vector (Don't move the player in the direction of up or down)
  forward.normalize();                                // Normalize forward vector to 1
  const right = Vector3.Cross(Vector3.Up(), forward); // Camera right vector

  // Set movement speed
  const walkSpeed = 5;
  const runSpeed = 10;

  // Movement speed and 
  const run = (input.isDown("shiftleft"))
  const currentSpeed = run ? runSpeed : walkSpeed;
  const body = player.aggregate.body;

  const current = body.getLinearVelocity();

  const direction = right.scale(x).add(forward.scale(z));
  direction.normalize();
  body.setLinearVelocity(new Vector3(direction.x * currentSpeed, current.y, direction.z * currentSpeed));

  if (direction.lengthSquared() > 0) {
    setState(run ? "run" : "walk");
    const target = Quaternion.FromEulerAngles(0, Math.atan2(direction.x, direction.z), 0);
    player.visual.rotationQuaternion = Quaternion.Slerp(
    player.visual.rotationQuaternion!, target, 0.15 // 0.15 = turn speed
    );
  }
  else{
    setState("idle"); // set idle if not moving
  }

  const origin = player.mesh.position;
  const ray = new Ray(origin, Vector3.Down(), 1.2); // slightly longer than half the capsule height
  const hit = scene.pickWithRay(ray, (m) => m !== player.mesh && !m.isDescendantOf(player.mesh));
  const grounded = hit?.hit === true;

  // Jump implementation
  const jump = (input.isDown("space"))
  const jumpForce = 10;
  if (grounded && jump) {
    body.setLinearVelocity(new Vector3(direction.x * currentSpeed, jumpForce, direction.z * currentSpeed));
    setState("jump");
  }
    // TODO: pick the animation (idle / walk / run) from the current speed


    
  });
  return { scene, camera };
}