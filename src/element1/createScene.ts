import {
  Scene, Engine, ArcRotateCamera, Vector3, TransformNode, PointLight,
  ShadowGenerator, PhotoDome, HemisphericLight, Clamp, DirectionalLight, Color3,
  PointerEventTypes,
} from "@babylonjs/core";
import createBody from "./createBody";
import { assetUrl } from "../shared/assetUrl";
import createInput from "../shared/createInput";
import createMenu from "./createMenu";
import { orbitDays, spinHours, tidallyLocked, MAX_TIME_SCALE, START_TIME_SCALE, TWO_PI_RADIANS } from "./realTime";
import type { AudioManager } from "../element4/createAudio"; // must match the import path in createMenu.ts
import type { CelestialBody } from "./interfaces";

// Distance from the sun's centre to its surface, in scene units.
// Planet distances below are measured from the surface, so this is added to each one.
const SUN_RADIUS = 109.117;
const MAX_CAMERA_RADIUS = 900;

export default async function createScene(engine: Engine, audio: AudioManager) {
  const scene = new Scene(engine);

  // ===================================================================
  // CAMERA
  // ===================================================================
  const camera = new ArcRotateCamera("cam", -Math.PI / 2, Math.PI / 3, 200, Vector3.Zero(), scene);
  camera.lowerRadiusLimit = 0;
  camera.upperRadiusLimit = MAX_CAMERA_RADIUS;
  camera.minZ = 0.001;  // very small, so the camera can sit right next to the tiny moons
  camera.maxZ = 20000;  // large enough that the 10000-size sky dome never gets clipped
  camera.wheelDeltaPercentage = 0.01; // each notch changes the distance by 1%; replaces wheelPrecision when non-zero

  // ===================================================================
  // THE SUN
  // ===================================================================
  // Every body hangs off this root node, so you can move or scale the whole system at once
  const root = new TransformNode("solarSystem", scene);
  const sun = createBody(scene, {
    name: "sun", diameter: 218.234, distance: 0, orbitSpeed: 0, spinSpeed: spinHours(25.05 * 24), parent: root, isStar: true,  hasEmissive: true, meshResolution: 128,
  });

  // ===================================================================
  // LIGHTS
  // A single directional light points one way for the whole scene, so it can't light
  // every planet correctly. So there are two sun lights with different jobs:
  //   sunPoint : a point light at the sun's centre. Lights every body from the sun's real position.
  //   sunLight : a directional light aimed at the focused planet. It lights only that planet and its moons,
  //              and is the one that casts the shadows.
  // ===================================================================
  const sunPoint = new PointLight("sunPoint", Vector3.Zero(), scene);
  sunPoint.intensity = 1.5; // TODO: tune to taste

  const sunLight = new DirectionalLight("sunLight", new Vector3(1, 0, 0), scene); // real direction is set every frame
  sunLight.intensity = 1.5;

  // Tight shadow box around the focused planet and its moons (a small box means sharper shadows)
  sunLight.shadowFrustumSize = 60;
  sunLight.shadowMinZ = 10;
  sunLight.shadowMaxZ = 90;
  sunLight.autoCalcShadowZBounds = false; // use the values above instead of working them out

  // Faint ambient light so the night side of a planet isn't pure black
  const ambientLight = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), scene);
  ambientLight.intensity = 0.08;
  ambientLight.diffuse = new Color3(0.6, 0.7, 1.0);      // subtle cool starlight
  ambientLight.groundColor = new Color3(0.2, 0.25, 0.4); // faint bounce fill on the shadow side
  ambientLight.specular = Color3.Black();                // stops fake highlights on the dark side

  // ===================================================================
  // SKY DOME (360 degree star background)
  // ===================================================================
  new PhotoDome(
    "sky",
    assetUrl("assets/element1/sky360stars.webp"),
    { resolution: 32, size: 10000 },
    scene
  );

  // ===================================================================
  // PLANETS
  // distance = SUN_RADIUS + distance from the sun's surface. Speeds are radians per second.
  // ===================================================================
  const bodies: CelestialBody[] = [sun];

  const mercury = createBody(scene, {
    name: "mercury", diameter: 0.766, distance: SUN_RADIUS + 5.81, orbitSpeed: orbitDays(87.969), spinSpeed: spinHours(1407.6), parent: sun.anchor, meshResolution: 32,
  });
  const venus = createBody(scene, {
    name: "venus", diameter: 1.9, distance: SUN_RADIUS + 10.85, orbitSpeed: orbitDays(224.701), spinSpeed: spinHours(-5832.5), parent: sun.anchor, meshResolution: 48,
  });
  const earth = createBody(scene, {
    name: "earth", diameter: 2, distance: SUN_RADIUS + 15, orbitSpeed: orbitDays(365.256), spinSpeed: spinHours(23.9345), parent: sun.anchor, hasClouds: true, hasNormal: true, meshResolution: 48,
  });
  const mars = createBody(scene, {
    name: "mars", diameter: 1.064, distance: SUN_RADIUS + 22.85, orbitSpeed: orbitDays(686.98), spinSpeed: spinHours(24.6229), parent: sun.anchor, meshResolution: 48,
  });
  const jupiter = createBody(scene, {
    name: "jupiter", diameter: 21.946, distance: SUN_RADIUS + 78.06, orbitSpeed: orbitDays(4332.59), spinSpeed: spinHours(9.925), parent: sun.anchor, meshResolution: 64,
  });
  const saturn = createBody(scene, {
    name: "saturn", diameter: 18.28, distance: SUN_RADIUS + 143.78, orbitSpeed: orbitDays(10759.22), spinSpeed: spinHours(10.56), parent: sun.anchor,  meshResolution: 64,// published values vary a little
  });
  const uranus = createBody(scene, {
    name: "uranus", diameter: 7.962, distance: SUN_RADIUS + 287.87, orbitSpeed: orbitDays(30688.5), spinSpeed: spinHours(-17.24), parent: sun.anchor, meshResolution: 64,
  });
  const neptune = createBody(scene, {
    name: "neptune", diameter: 7.729, distance: SUN_RADIUS + 450.7, orbitSpeed: orbitDays(60182), spinSpeed: spinHours(16.11), parent: sun.anchor, meshResolution: 64,
  });

  // ===================================================================
  // MOONS
  // All moons share the "moon" texture as a placeholder. Each one is parented to its planet's
  // anchor, so it orbits the planet and travels with it around the sun.
  // Moon spin speed matches its orbit speed, so the same face always points at its planet.
  // ===================================================================

  const moon = createBody(scene, { name: "moon", diameter: 0.545, distance: 3.85, ...tidallyLocked(27.3217), parent: earth.anchor, meshResolution: 32, hasNormal: true, });

  const phobos = createBody(scene, { name: "moon", diameter: 0.004, distance: 0.62, ...tidallyLocked(0.31891), parent: mars.anchor, meshResolution: 16, hasNormal: true, });
  const deimos = createBody(scene, { name: "moon", diameter: 0.002, distance: 0.77, ...tidallyLocked(1.26244), parent: mars.anchor, meshResolution: 16, hasNormal: true, });

  const io = createBody(scene, { name: "moon", diameter: 0.572, distance: 15.2, ...tidallyLocked(1.769138), parent: jupiter.anchor, meshResolution: 32, hasNormal: true, });
  const europa = createBody(scene, { name: "moon", diameter: 0.49, distance: 17.7, ...tidallyLocked(3.551181), parent: jupiter.anchor, meshResolution: 32, hasNormal: true, });
  const ganymede = createBody(scene, { name: "moon", diameter: 0.827, distance: 21.7, ...tidallyLocked(7.154553), parent: jupiter.anchor, meshResolution: 32, hasNormal: true, });
  const callisto = createBody(scene, { name: "moon", diameter: 0.757, distance: 29.85, ...tidallyLocked(16.689017), parent: jupiter.anchor, meshResolution: 32, hasNormal: true, });

  const enceladus = createBody(scene, { name: "moon", diameter: 0.079, distance: 11.53, ...tidallyLocked(1.370218), parent: saturn.anchor, meshResolution: 16, hasNormal: true, });
  const tethys = createBody(scene, { name: "moon", diameter: 0.167, distance: 12.09, ...tidallyLocked(1.887802), parent: saturn.anchor, meshResolution: 16, hasNormal: true, });
  const dione = createBody(scene, { name: "moon", diameter: 0.176, distance: 12.92, ...tidallyLocked(2.736915), parent: saturn.anchor, meshResolution: 16,  hasNormal: true,});
  const rhea = createBody(scene, { name: "moon", diameter: 0.24, distance: 14.43, ...tidallyLocked(4.5175), parent: saturn.anchor, meshResolution: 16, hasNormal: true, });
  const titan = createBody(scene, { name: "moon", diameter: 0.808, distance: 21.39, ...tidallyLocked(15.945421), parent: saturn.anchor, meshResolution: 32, hasNormal: true, });
  const iapetus = createBody(scene, { name: "moon", diameter: 0.231, distance: 44.84, ...tidallyLocked(79.3215), parent: saturn.anchor, meshResolution: 16, hasNormal: true, });

  const miranda = createBody(scene, { name: "moon", diameter: 0.074, distance: 5.28, ...tidallyLocked(1.413479), parent: uranus.anchor, meshResolution: 16, hasNormal: true, });
  const ariel = createBody(scene, { name: "moon", diameter: 0.182, distance: 5.9, ...tidallyLocked(2.520379), parent: uranus.anchor, meshResolution: 16, hasNormal: true, });
  const umbriel = createBody(scene, { name: "moon", diameter: 0.184, distance: 6.65, ...tidallyLocked(4.144176), parent: uranus.anchor, meshResolution: 16, hasNormal: true, });
  const titania = createBody(scene, { name: "moon", diameter: 0.247, distance: 8.35, ...tidallyLocked(8.705872), parent: uranus.anchor, meshResolution: 16, hasNormal: true, });
  const oberon = createBody(scene, { name: "moon", diameter: 0.239, distance: 9.83, ...tidallyLocked(13.463234), parent: uranus.anchor, meshResolution: 16, hasNormal: true, });

  const triton = createBody(scene, { name: "moon", diameter: 0.425, distance: 7.42, ...tidallyLocked(-5.876854), parent: neptune.anchor, meshResolution: 16, hasNormal: true, }); // negative = retrograde

  // Everything that moves goes in this list, so the per-frame code can loop over it
  bodies.push(
    mercury,
    venus,
    earth, moon,
    mars, phobos, deimos,
    jupiter, io, europa, ganymede, callisto,
    saturn, enceladus, tethys, dione, rhea, titan, iapetus,
    uranus, miranda, ariel, umbriel, titania, oberon,
    neptune, triton
  );

  // ===================================================================
  // FOCUS: which planet system the shadow light is aimed at
  // ===================================================================
  let focus: CelestialBody = earth; // the system lit by the directional light at the start

  // A planet is its own host. A moon's host is the planet it orbits.
  function hostOf(body: CelestialBody): CelestialBody {
    const parentBody = bodies.find((body) => body.anchor === body.orbitPivot.parent);
    return parentBody && parentBody !== sun ? parentBody : body;
  }

  // The directional light only lights the focused planet and its moons.
  // The point light lights everything else (and skips the sun, which is emissive).
  function focusLighting() {
    const host = hostOf(focus);
    const group = bodies.filter((body) => hostOf(body) === host);
    const meshes = group.flatMap((body) => (body.cloudMesh ? [body.groundMesh, body.cloudMesh] : [body.groundMesh]));

    sunLight.includedOnlyMeshes = meshes;
    sunPoint.excludedMeshes = [...meshes, sun.groundMesh];
  }
  focusLighting();

  // TODO: axial tilt: add another TransformNode between anchor and mesh and rotate it on z
  // TODO: optional extras: orbit rings.

  // ===================================================================
  // SHADOWS
  // ===================================================================
  const shadowGenerator = new ShadowGenerator(2048, sunLight);
  shadowGenerator.usePercentageCloserFiltering = true;
  shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH;

  // Keep the linear bias tiny so small moons still cast shadows,
  // and raise normalBias just enough to remove banding on the spheres
  shadowGenerator.bias = 0.00005;
  shadowGenerator.normalBias = 0.02;

  for (const body of bodies) {
    // Skip the sun, so it doesn't block its own light
    if (!body.groundMesh || body === sun) continue;

    shadowGenerator.addShadowCaster(body.groundMesh, true);
    body.groundMesh.receiveShadows = true;
  }

  // ===================================================================
  // MENU (Start screen + HUD)
  // ===================================================================
  let started = false;

  const menu = createMenu(scene, audio, () => {
    started = true; // the menu has faded out
    camera.attachControl(true);
  });

  // ===================================================================
  // CLICK TO FOCUS A PLANET
  // ===================================================================
  const input = createInput(scene);
  let prevSunAngle: number | null = null; // where the host planet was around the sun last frame

  input.onMeshClick((pickedMesh) => {
    if (!started) return; // ignore clicks while the menu is showing

    // Match the clicked mesh back to its body. Clouds are separate meshes, so check those too.
    const clickedBody = bodies.find(
      (body) => body.groundMesh === pickedMesh || body.cloudMesh === pickedMesh
    );
    if (!clickedBody) return;

    camera.lockedTarget = clickedBody.groundMesh;
    prevSunAngle = null; // start tracking again from this target

    if (clickedBody !== sun) {
      focus = clickedBody;
      focusLighting();

      // Start on the sunlit side, with the sun behind the camera.
      // Delete these three lines if you'd rather keep your current viewing angle.
      const toSun = sun.groundMesh.getAbsolutePosition()
        .subtract(clickedBody.groundMesh.getAbsolutePosition());
      camera.alpha = Math.atan2(toSun.z, toSun.x);
      camera.beta = Math.PI / 2.2; // a little above the orbital plane
    }

    // Zoom to fit the selected body
    const radius = clickedBody.groundMesh.getBoundingInfo().boundingSphere.radiusWorld;
    focusRadius = radius;
    camera.radius = Math.max(radius * 4, radius * 1.5 + 0.005);
  });

  // ===================================================================
  // RUNS EVERY FRAME
  // ===================================================================
  let timeScale = START_TIME_SCALE;
  let paused = false;
  let savedTimeScale = START_TIME_SCALE;
  let spaceWasDown = false;

  window.addEventListener("keydown", (e) => {
    if (!started || e.code !== "Space" || e.repeat) return; // e.repeat prevents holding Space from toggling repeatedly
    e.preventDefault(); // stops Space from clicking a focused HUD button

    if (timeScale !== 0) {
      savedTimeScale = timeScale;
      timeScale = 0;
    } else {
      timeScale = savedTimeScale;
    }
  });

  scene.onBeforeRenderObservable.add(() => {
    const deltaTime = scene.getEngine().getDeltaTime() / 1000; // seconds since the last frame

        // 1. Change the time scale. A = slower, D = faster, Space = pause, R = back to real time.
    //    The step grows with the current speed, so it takes a similar time to go from 1x to 1 hour/s as from 1 day/s to 1 year/s.
    if (started) {
      const adaptiveStep = Math.max(1, Math.abs(timeScale) * 1.5) * deltaTime;
      if (input.isDown("keya")) timeScale -= adaptiveStep;  // Move backwards through time
      if (input.isDown("keyd")) timeScale += adaptiveStep;  // Move forwards through time
      if (input.isDown("keyr")) timeScale = 1;              // Set timescale to real time

      const spaceDown = input.isDown("space");              // Pause timescale
      if (spaceDown && !spaceWasDown) {
        paused = !paused;
        if (paused) {
          savedTimeScale = timeScale || 1; // fallback to 1 if already 0
          timeScale = 0;
        } else {
          timeScale = savedTimeScale;
        }
      }
      spaceWasDown = spaceDown;

      // Also unpause automatically if the user presses A, D, or R while paused:
      if (input.isDown("keya") || input.isDown("keyd") || input.isDown("keyr")) {
        paused = false;
      }

      timeScale = Clamp(timeScale, -MAX_TIME_SCALE, MAX_TIME_SCALE);
    }
    menu.setTimeScale(timeScale);

    // 2. Move every body. The angle is wrapped to one turn, because very large angles lose precision as 32-bit floats.
    for (const body of bodies) {
      const orbit = body.orbitPivot.rotation.y + body.orbitSpeed * deltaTime * timeScale;
      body.orbitPivot.rotation.y = orbit % TWO_PI_RADIANS;

      const spin = body.groundMesh.rotation.y + body.spinSpeed * deltaTime * timeScale;
      body.groundMesh.rotation.y = spin % TWO_PI_RADIANS;

      if (body.cloudMesh) {
        const clouds = body.cloudMesh.rotation.y + body.spinSpeed * 1.15 * deltaTime * timeScale;
        body.cloudMesh.rotation.y = clouds % TWO_PI_RADIANS;
      }
    }

    // 3. Aim the directional (shadow) light from the sun at the focused planet system.
    //    Matrices are refreshed first, so we read this frame's positions, not last frame's.
    const host = hostOf(focus);
    host.orbitPivot.computeWorldMatrix(true);
    host.anchor.computeWorldMatrix(true);
    host.groundMesh.computeWorldMatrix(true);

    const sunPos = sun.groundMesh.getAbsolutePosition();
    const hostPos = host.groundMesh.getAbsolutePosition();
    const dir = hostPos.subtract(sunPos).normalize();
    sunLight.direction = dir;
    sunLight.position = hostPos.subtract(dir.scale(50)); // sits 50 units back from the planet, towards the sun

    // 4. Keep the camera's view of the target steady relative to the sun.
    //    An ArcRotateCamera keeps its angle in world space, so as the planet orbits,
    //    the view would drift. Turning the camera by the planet's orbital movement stops that.
    const lockedBody = bodies.find((body) => body.groundMesh === camera.lockedTarget);
    if (lockedBody && lockedBody !== sun) {
      // refresh the locked body itself, so the camera never reads last frame's position
      lockedBody.orbitPivot.computeWorldMatrix(true);
      lockedBody.anchor.computeWorldMatrix(true);
      lockedBody.groundMesh.computeWorldMatrix(true);

      // follow the HOST planet's travel around the sun (a moon's own fast orbit would spin the view wildly)
      const rel = hostPos.subtract(sunPos);
      const angle = Math.atan2(rel.z, rel.x);

      if (prevSunAngle !== null) {
        let delta = angle - prevSunAngle;
        delta = Math.atan2(Math.sin(delta), Math.cos(delta)); // wrap to -PI..PI so there's no jump at the seam
        camera.alpha += delta;
      }
      prevSunAngle = angle;
    } else {
      prevSunAngle = null; // sun locked or nothing locked: nothing to follow
    }
    // scene.forceWireframe = true;
  });

  // Distance zoom: each wheel notch changes the gap between the camera and the planet's surface by a fixed percentage
let focusRadius = 0; // radius of the locked body; set in the click handler

camera.inputs.removeByType("ArcRotateCameraMouseWheelInput"); // remove the built-in wheel zoom

scene.onPrePointerObservable.add((info) => {
  if (info.type !== PointerEventTypes.POINTERWHEEL) return;
  const e = info.event as WheelEvent;
  e.preventDefault(); // stop the page scrolling

  const surface = focusRadius * 1.02;                // stay just above the surface
  const gap = Math.max(camera.radius - surface, 0.0001);
  const newGap = gap * Math.exp(e.deltaY * 0.001);   // deltaY > 0 zooms out, < 0 zooms in; 0.001 is the speed
  camera.radius = Clamp(surface + newGap, surface, camera.upperRadiusLimit ?? MAX_CAMERA_RADIUS);
}, PointerEventTypes.POINTERWHEEL);

  return { scene, camera, sunLight, ambientLight, bodies, shadowGenerator };
}