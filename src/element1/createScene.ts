import {
  Scene, Engine, ArcRotateCamera, Vector3, TransformNode, PointLight,
  ShadowGenerator, PhotoDome, HemisphericLight, Clamp, DirectionalLight,
  AbstractMesh, Color3,
} from "@babylonjs/core";
import createBody from "./createBody";
import { assetUrl } from "../shared/assetUrl";
import createInput from "../shared/createInput";
import type { CelestialBody } from "./interfaces";

export default async function createScene(engine: Engine) {
  const scene = new Scene(engine);
  // ---------- camera ----------
  const camera = new ArcRotateCamera("cam", -Math.PI / 2, Math.PI / 3, 200, Vector3.Zero(), scene);
  camera.attachControl(true);
  camera.lowerRadiusLimit = 0;
  camera.upperRadiusLimit = 900;
  camera.minZ = 0.001;
  camera.maxZ = 20000; // Ensures the 10000-size skyDome never clips either


  // ---------- the sun ----------
  const root = new TransformNode("solarSystem", scene);
  const sun = createBody(scene, {
  name: "sun", diameter: 218.234, distance: 0, orbitSpeed: 0, spinSpeed: 0.039, parent: root, isStar: true,
});

  // ---------- sun point light: lights every body from the sun's real position ----------
  const sunPoint = new PointLight("sunPoint", Vector3.Zero(), scene);
  sunPoint.intensity = 1.5; // TODO: tune to match the old look

  // Give sunLight a non-zero initial direction
  const sunLight = new DirectionalLight("sunLight", new Vector3(1, 0, 0), scene);
  sunLight.intensity = 1.5;

  // Tighten the shadow frustum around the focused planet + its moons (e.g., 100x100 units)
  sunLight.shadowFrustumSize = 60;
  sunLight.shadowMinZ = 10;
  sunLight.shadowMaxZ = 90;        
  sunLight.autoCalcShadowZBounds = false;

  // ---------- ambient Light ----------
  const ambientLight = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), scene);
  ambientLight.intensity = 0.08;
  ambientLight.diffuse = new Color3(0.6, 0.7, 1.0);      // Subtle cool starlight
  ambientLight.groundColor = new Color3(0.2, 0.25, 0.4); // Faint bounce fill on shadow side
  ambientLight.specular = Color3.Black();                // Prevent fake ambient highlights on the dark side


// ---------- Sky Dome ----------
const skyDome = new PhotoDome(
    "sky",
    assetUrl("assets/element1/sky360stars.webp"),
    { resolution: 32, size: 10000 },
    scene
  );
  
  // ---------- planets and moons ----------
  const bodies = [sun];

  const mercury = createBody(scene, {
    name: "mercury", diameter: 0.766, distance: 109.117 + 5.81, orbitSpeed: 1.246, spinSpeed: 0.017, parent: sun.anchor,
  });
  const venus = createBody(scene, {
    name: "venus", diameter: 1.9, distance: 109.117 + 10.85, orbitSpeed: 0.488, spinSpeed: -0.004, parent: sun.anchor,
  });
  const earth = createBody(scene, {
    name: "earth", diameter: 2, distance: 109.117 + 15, orbitSpeed: 0.3, spinSpeed: 1, parent: sun.anchor, hasClouds: true, hasNormal: true,
  });
  const mars = createBody(scene, {
    name: "mars", diameter: 1.064, distance: 109.117 + 22.85, orbitSpeed: 0.16, spinSpeed: 0.972, parent: sun.anchor,
  });
  const jupiter = createBody(scene, {
    name: "jupiter", diameter: 21.946, distance: 109.117 + 78.06, orbitSpeed: 0.025, spinSpeed: 2.412, parent: sun.anchor,
  });
  const saturn = createBody(scene, {
    name: "saturn", diameter: 18.28, distance: 109.117 + 143.78, orbitSpeed: 0.01, spinSpeed: 2.246, parent: sun.anchor,
  });
  const uranus = createBody(scene, {
    name: "uranus", diameter: 7.962, distance: 109.117 + 287.87, orbitSpeed: 0.004, spinSpeed: -1.388, parent: sun.anchor,
  });
  const neptune = createBody(scene, {
    name: "neptune", diameter: 7.729, distance: 109.117 + 450.7, orbitSpeed: 0.002, spinSpeed: 1.486, parent: sun.anchor,
  });



  // All moons share the same texture as a placeholder
  // Earth
  const moon = createBody(scene, {
    name: "moon", diameter: 0.545, distance: 3.85, orbitSpeed: 4.011, spinSpeed: 4.011, parent: earth.anchor,
  });

  // Mars (planet radius = 0.532)
  const phobos = createBody(scene, {
    name: "moon", diameter: 0.004, distance: 0.62, orbitSpeed: 343.609, spinSpeed: 343.609, parent: mars.anchor,
  });
  const deimos = createBody(scene, {
    name: "moon", diameter: 0.002, distance: 0.77, orbitSpeed: 86.759, spinSpeed: 86.759, parent: mars.anchor,
  });

  // Jupiter (planet radius = 10.973)
  const io = createBody(scene, {
    name: "moon", diameter: 0.572, distance: 15.2, orbitSpeed: 61.943, spinSpeed: 61.943, parent: jupiter.anchor,
  });
  const europa = createBody(scene, {
    name: "moon", diameter: 0.49, distance: 17.7, orbitSpeed: 30.858, spinSpeed: 30.858, parent: jupiter.anchor,
  });
  const ganymede = createBody(scene, {
    name: "moon", diameter: 0.827, distance: 21.7, orbitSpeed: 15.315, spinSpeed: 15.315, parent: jupiter.anchor,
  });
  const callisto = createBody(scene, {
    name: "moon", diameter: 0.757, distance: 29.85, orbitSpeed: 6.566, spinSpeed: 6.566, parent: jupiter.anchor,
  });

  // Saturn (planet radius = 9.14)
  const enceladus = createBody(scene, {
    name: "moon", diameter: 0.079, distance: 11.53, orbitSpeed: 79.983, spinSpeed: 79.983, parent: saturn.anchor,
  });
  const tethys = createBody(scene, {
    name: "moon", diameter: 0.167, distance: 12.09, orbitSpeed: 58.039, spinSpeed: 58.039, parent: saturn.anchor,
  });
  const dione = createBody(scene, {
    name: "moon", diameter: 0.176, distance: 12.92, orbitSpeed: 40.035, spinSpeed: 40.035, parent: saturn.anchor,
  });
  const rhea = createBody(scene, {
    name: "moon", diameter: 0.24, distance: 14.43, orbitSpeed: 24.253, spinSpeed: 24.253, parent: saturn.anchor,
  });
  const titan = createBody(scene, {
    name: "moon", diameter: 0.808, distance: 21.39, orbitSpeed: 6.872, spinSpeed: 6.872, parent: saturn.anchor,
  });
  const iapetus = createBody(scene, {
    name: "moon", diameter: 0.231, distance: 44.84, orbitSpeed: 1.381, spinSpeed: 1.381, parent: saturn.anchor,
  });

  // Uranus (planet radius = 3.981)
  const miranda = createBody(scene, {
    name: "moon", diameter: 0.074, distance: 5.28, orbitSpeed: 77.549, spinSpeed: 77.549, parent: uranus.anchor,
  });
  const ariel = createBody(scene, {
    name: "moon", diameter: 0.182, distance: 5.9, orbitSpeed: 43.483, spinSpeed: 43.483, parent: uranus.anchor,
  });
  const umbriel = createBody(scene, {
    name: "moon", diameter: 0.184, distance: 6.65, orbitSpeed: 26.442, spinSpeed: 26.442, parent: uranus.anchor,
  });
  const titania = createBody(scene, {
    name: "moon", diameter: 0.247, distance: 8.35, orbitSpeed: 12.586, spinSpeed: 12.586, parent: uranus.anchor,
  });
  const oberon = createBody(scene, {
    name: "moon", diameter: 0.239, distance: 9.83, orbitSpeed: 8.139, spinSpeed: 8.139, parent: uranus.anchor,
  });

  // Neptune (planet radius = 3.865)
  const triton = createBody(scene, {
    name: "moon", diameter: 0.425, distance: 7.42, orbitSpeed: -18.645, spinSpeed: -18.645, parent: neptune.anchor,
  });

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

  // ---------- focus: which planet system the shadow light is aimed at ----------
  let focus: CelestialBody = earth;

  // a planet is its own host, a moon's host is the planet it orbits
  function hostOf(body: CelestialBody): CelestialBody {
    const parentBody = bodies.find((b) => b.anchor === body.orbitPivot.parent);
    return parentBody && parentBody !== sun ? parentBody : body;
  }

  // the directional light only lights the focused planet and its moons;
  // the point light lights everything else
  function focusLighting() {
    const host = hostOf(focus);
    const group = bodies.filter((b) => hostOf(b) === host);
    const meshes = group.flatMap((b) => (b.cloudMesh ? [b.groundMesh, b.cloudMesh] : [b.groundMesh]));

    sunLight.includedOnlyMeshes = meshes;
    sunPoint.excludedMeshes = [...meshes, sun.groundMesh]; // the sun is emissive, so no light on it
  }
  focusLighting();

  // TODO: axial tilt: add another TransformNode between anchor and mesh and rotate it on z
  // TODO: optional extras: orbit rings, a GlowLayer on the sun

  // ---------- shadows ----------
  const shadowGenerator = new ShadowGenerator(2048, sunLight);
  shadowGenerator.usePercentageCloserFiltering = true;
  shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH;

  // Keep linear bias tiny so small moons still cast shadows,
  // and increase normalBias just enough to eliminate sphere surface banding:
  shadowGenerator.bias = 0.00005;
  shadowGenerator.normalBias = 0.02;

  for (const body of bodies) {
    // Skip the Sun so it doesn't block its own light
    if (!body.groundMesh || body === sun) continue;

    shadowGenerator.addShadowCaster(body.groundMesh, true);
    body.groundMesh.receiveShadows = true;
  }

  let prevSunAngle: number | null = null; // the host planet's angle around the sun last frame

  // ---------- planet lockon ----------
  const input = createInput(scene);
  // Map meshes back to their body (handles child meshes like clouds/rings too)
  input.onMeshClick((pickedMesh) => {
  const clickedBody = bodies.find(
    (b) => b.groundMesh === pickedMesh || b.cloudMesh === pickedMesh
  );
  if (!clickedBody) return;

  camera.lockedTarget = clickedBody.groundMesh;
  prevSunAngle = null; // start tracking again from this target

  if (clickedBody !== sun) {
    focus = clickedBody;
    focusLighting();

    // optional: start on the sunlit side, with the sun behind the camera
    const toSun = sun.groundMesh.getAbsolutePosition()
      .subtract(clickedBody.groundMesh.getAbsolutePosition());
    camera.alpha = Math.atan2(toSun.z, toSun.x);
    camera.beta = Math.PI / 2.2; // a little above the orbital plane
  }

  const radius = clickedBody.groundMesh.getBoundingInfo().boundingSphere.radiusWorld;
  camera.radius = Math.max(radius * 3, 5);
});

  let timeScale = 1;

  // ---------- runs every frame ----------
  scene.onBeforeRenderObservable.add(() => {
    const deltaTime = scene.getEngine().getDeltaTime() / 1000;

    // 1. Update timeScale
    const adaptiveStep = Math.max(0.05, Math.abs(timeScale) * 1.5) * deltaTime;
    if (input.isDown("keya")) timeScale -= adaptiveStep;
    if (input.isDown("keyd")) timeScale += adaptiveStep;
    timeScale = Clamp(timeScale, -100, 100);

    // 2. Rotate all bodies
    for (const body of bodies) {
      body.orbitPivot.rotation.y += body.orbitSpeed * deltaTime * timeScale;
      body.groundMesh.rotation.y += body.spinSpeed * deltaTime * timeScale;
      if (body.cloudMesh) {
        body.cloudMesh.rotation.y += body.spinSpeed * 1.15 * deltaTime * timeScale;
      }
    }

    // 3. Aim the directional (shadow) light from the sun at the focused planet system
    const host = hostOf(focus);
    host.orbitPivot.computeWorldMatrix(true);
    host.anchor.computeWorldMatrix(true);
    host.groundMesh.computeWorldMatrix(true);

    const sunPos = sun.groundMesh.getAbsolutePosition();
    const hostPos = host.groundMesh.getAbsolutePosition();
    const dir = hostPos.subtract(sunPos).normalize();
    sunLight.direction = dir;
    sunLight.position = hostPos.subtract(dir.scale(50));

    // 4. Keep the camera's view of the target steady relative to the sun
    const lockedBody = bodies.find((b) => b.groundMesh === camera.lockedTarget);
    if (lockedBody && lockedBody !== sun) {
      // refresh the locked body itself, so the camera never reads last frame's position
      lockedBody.orbitPivot.computeWorldMatrix(true);
      lockedBody.anchor.computeWorldMatrix(true);
      lockedBody.groundMesh.computeWorldMatrix(true);

      // follow the HOST planet's travel around the sun (a moon's own fast orbit would make this spin wildly)
      const rel = host.groundMesh.getAbsolutePosition().subtract(sunPos);
      const angle = Math.atan2(rel.z, rel.x);

      if (prevSunAngle !== null) {
        let delta = angle - prevSunAngle;
        delta = Math.atan2(Math.sin(delta), Math.cos(delta)); // wrap to -PI..PI
        camera.alpha += delta;
      }
      prevSunAngle = angle;
    } else {
      prevSunAngle = null; // sun locked or nothing locked: nothing to follow
    }
  });

  return { scene, camera, sunLight, ambientLight, bodies, shadowGenerator };
}