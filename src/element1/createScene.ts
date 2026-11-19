import {
  Scene, Engine, ArcRotateCamera, Vector3, TransformNode, PointLight, ShadowGenerator, PhotoDome, HemisphericLight,
} from "@babylonjs/core";
import createBody from "./createBody";
import { assetUrl } from "../shared/assetUrl";
import createInput from "../element3/createInput";

export default async function createScene(engine: Engine) {
  const scene = new Scene(engine);

  const camera = new ArcRotateCamera("cam", -Math.PI / 2, Math.PI / 3, 60, Vector3.Zero(), scene);
  camera.attachControl(true);
  camera.lowerRadiusLimit = 50;
  camera.upperRadiusLimit = 900;

  // ---------- the sun ----------
  const root = new TransformNode("solarSystem", scene);
    const sun = createBody(scene, {
    name: "sun", diameter: 218.234, distance: 0, orbitSpeed: 0, spinSpeed: 0.039, parent: root, isStar: true,
  });

  const sunLight = new PointLight("sunLight", Vector3.Zero(), scene);
  sunLight.intensity = 1;

  // ---------- ambient Light ----------
  const ambientLight = new HemisphericLight(
      "hemisphericLight",
      new Vector3(1, 10, 0),
      scene
  );
  ambientLight.intensity = 0.05;

// ---------- Sky Dome ----------
const skyDome = new PhotoDome(
    "sky",
    assetUrl("assets/element1/sky360stars.webp"),
    { resolution: 32, size: 2000 },
    scene
  );
  
  // ---------- planets and moons ----------
  const bodies = [sun];

  // placeholder planet and moon to prove the hierarchy works: replace and extend these
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

  // Earth
  const moon = createBody(scene, {
    name: "moon", diameter: 0.545, distance: 3.85, orbitSpeed: 4.011, spinSpeed: 4.011, parent: earth.anchor,
  });

  // Mars (planet radius = 0.532)
  const phobos = createBody(scene, {
    name: "phobos", diameter: 0.004, distance: 0.62, orbitSpeed: 343.609, spinSpeed: 343.609, parent: mars.anchor,
  });
  const deimos = createBody(scene, {
    name: "deimos", diameter: 0.002, distance: 0.77, orbitSpeed: 86.759, spinSpeed: 86.759, parent: mars.anchor,
  });

  // Jupiter (planet radius = 10.973)
  const io = createBody(scene, {
    name: "io", diameter: 0.572, distance: 15.2, orbitSpeed: 61.943, spinSpeed: 61.943, parent: jupiter.anchor,
  });
  const europa = createBody(scene, {
    name: "europa", diameter: 0.49, distance: 17.7, orbitSpeed: 30.858, spinSpeed: 30.858, parent: jupiter.anchor,
  });
  const ganymede = createBody(scene, {
    name: "ganymede", diameter: 0.827, distance: 21.7, orbitSpeed: 15.315, spinSpeed: 15.315, parent: jupiter.anchor,
  });
  const callisto = createBody(scene, {
    name: "callisto", diameter: 0.757, distance: 29.85, orbitSpeed: 6.566, spinSpeed: 6.566, parent: jupiter.anchor,
  });

  // Saturn (planet radius = 9.14)
  const enceladus = createBody(scene, {
    name: "enceladus", diameter: 0.079, distance: 11.53, orbitSpeed: 79.983, spinSpeed: 79.983, parent: saturn.anchor,
  });
  const tethys = createBody(scene, {
    name: "tethys", diameter: 0.167, distance: 12.09, orbitSpeed: 58.039, spinSpeed: 58.039, parent: saturn.anchor,
  });
  const dione = createBody(scene, {
    name: "dione", diameter: 0.176, distance: 12.92, orbitSpeed: 40.035, spinSpeed: 40.035, parent: saturn.anchor,
  });
  const rhea = createBody(scene, {
    name: "rhea", diameter: 0.24, distance: 14.43, orbitSpeed: 24.253, spinSpeed: 24.253, parent: saturn.anchor,
  });
  const titan = createBody(scene, {
    name: "titan", diameter: 0.808, distance: 21.39, orbitSpeed: 6.872, spinSpeed: 6.872, parent: saturn.anchor,
  });
  const iapetus = createBody(scene, {
    name: "iapetus", diameter: 0.231, distance: 44.84, orbitSpeed: 1.381, spinSpeed: 1.381, parent: saturn.anchor,
  });

  // Uranus (planet radius = 3.981)
  const miranda = createBody(scene, {
    name: "miranda", diameter: 0.074, distance: 5.28, orbitSpeed: 77.549, spinSpeed: 77.549, parent: uranus.anchor,
  });
  const ariel = createBody(scene, {
    name: "ariel", diameter: 0.182, distance: 5.9, orbitSpeed: 43.483, spinSpeed: 43.483, parent: uranus.anchor,
  });
  const umbriel = createBody(scene, {
    name: "umbriel", diameter: 0.184, distance: 6.65, orbitSpeed: 26.442, spinSpeed: 26.442, parent: uranus.anchor,
  });
  const titania = createBody(scene, {
    name: "titania", diameter: 0.247, distance: 8.35, orbitSpeed: 12.586, spinSpeed: 12.586, parent: uranus.anchor,
  });
  const oberon = createBody(scene, {
    name: "oberon", diameter: 0.239, distance: 9.83, orbitSpeed: 8.139, spinSpeed: 8.139, parent: uranus.anchor,
  });

  // Neptune (planet radius = 3.865)
  const triton = createBody(scene, {
    name: "triton", diameter: 0.425, distance: 7.42, orbitSpeed: -18.645, spinSpeed: -18.645, parent: neptune.anchor,
  });

  bodies.push(
    mercury, venus,
    earth, moon,
    mars, phobos, deimos,
    jupiter, io, europa, ganymede, callisto,
    saturn, enceladus, tethys, dione, rhea, titan, iapetus,
    uranus, miranda, ariel, umbriel, titania, oberon,
    neptune, triton
  );

  // TODO: axial tilt: add another TransformNode between anchor and mesh and rotate it on z
  // TODO: optional extras: orbit rings, a GlowLayer on the sun

  const input = createInput(scene);

  // ---------- shadows ----------
  const shadowGenerator = new ShadowGenerator(1024, sunLight);
  // TODO: shadowGenerator.addShadowCaster(planetMesh) for each planet and moon (NOT the sun)
  // TODO: planetMesh.receiveShadows = true for each body that should show shadows

  // ---------- runs every frame ----------
  scene.onBeforeRenderObservable.add(() => {
    input.isDown("");

    const dt = scene.getEngine().getDeltaTime() / 1000; // seconds since the last frame

    for (const body of bodies) {
  body.orbitPivot.rotation.y += body.orbitSpeed * dt;
  body.groundMesh.rotation.y += body.spinSpeed * dt;
  
  if (body.cloudMesh) {
    body.cloudMesh.rotation.y += (body.spinSpeed * 1.15) * dt;
  }
}

  });
  return { scene, camera, sunLight, ambientLight, bodies, shadowGenerator };
  // TODO: optional: move the light's intensity, or react to keys to speed up and slow down time
}