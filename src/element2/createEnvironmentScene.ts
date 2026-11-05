import {
  Scene,
  Engine,
  ArcRotateCamera,
  Vector3,
  MeshBuilder,
  Mesh,
  GroundMesh,
  AbstractMesh,
  StandardMaterial,
  Texture,
  Color3,
  HemisphericLight,
  DirectionalLight,
  PhotoDome,
} from "@babylonjs/core";
import { assetUrl } from "../shared/assetUrl";

export default function createEnvironmentScene(engine: Engine) {
  const scene = new Scene(engine);

  // 360-degree background image (equirectangular panorama, 2:1 ratio)
  new PhotoDome(
    "sky",
    assetUrl("assets/element2/sky360.jpg"),
    { resolution: 32, size: 1000 },
    scene
  );

  // Constrained camera
  const camera = new ArcRotateCamera(
    "cam",
    -Math.PI / 2,
    Math.PI / 3,
    40,
    new Vector3(0, 2, 0),
    scene
  );
  camera.attachControl(true);
  camera.lowerRadiusLimit = 15;
  camera.upperRadiusLimit = 60;
  camera.lowerBetaLimit = 0.2;
  camera.upperBetaLimit = Math.PI / 2 - 0.05; // can't go below the horizon
  camera.panningSensibility = 0; // disables panning

  // Lighting
  const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.5;
  const sun = new DirectionalLight("sun", new Vector3(-1, -2, -1), scene);
  sun.intensity = 0.8;

  // Textured terrain from a greyscale heightmap
  const terrainMat = new StandardMaterial("terrainMat", scene);
  const grass = new Texture(assetUrl("assets/element2/grass.jpg"), scene);
  grass.uScale = 20;
  grass.vScale = 20;
  terrainMat.diffuseTexture = grass;
  terrainMat.specularColor = Color3.Black();

  const terrain = MeshBuilder.CreateGroundFromHeightMap(
    "terrain",
    assetUrl("assets/element2/heightmap.png"),
    {
      width: 100,
      height: 100,
      subdivisions: 100,
      minHeight: 0,
      maxHeight: 8,
      onReady: (ground) => populate(scene, ground), // heights exist once this fires
    },
    scene
  );
  terrain.material = terrainMat;

  return { scene, camera, terrain };
}

function populate(scene: Scene, terrain: GroundMesh) {
  const mat = new StandardMaterial("propMat", scene);
  mat.diffuseTexture = new Texture(assetUrl("assets/element2/rock.jpg"), scene);

  // Individual mesh + clone + instances
  const base = MeshBuilder.CreateBox("base", { size: 2 }, scene);
  base.material = mat;
  place(base, terrain, 0, 0);

  const clone = base.clone("clone"); // independent copy
  place(clone, terrain, 10, 5);

  for (let i = 0; i < 20; i++) {
    const inst = base.createInstance("inst" + i); // cheap, shares geometry
    place(inst, terrain, Math.random() * 80 - 40, Math.random() * 80 - 40);
  }

  // Mesh merging: combine pieces into one mesh (one draw call)
  const pieces: Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const wall = MeshBuilder.CreateBox(
      "wall" + i,
      { width: 2, height: 3, depth: 0.5 },
      scene
    );
    wall.material = mat;
    wall.position.set(-20 + i * 2, terrain.getHeightAtCoordinates(-20 + i * 2, -20) + 1.5, -20);
    pieces.push(wall);
  }
  const merged = Mesh.MergeMeshes(pieces, true, true); // disposes the originals
  if (merged) merged.name = "mergedWall";
}

// Sit a mesh on the terrain surface
function place(mesh: AbstractMesh, terrain: GroundMesh, x: number, z: number) {
  const y = terrain.getHeightAtCoordinates(x, z);
  mesh.position.set(x, y + 1, z);
}