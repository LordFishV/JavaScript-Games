import {
  Scene,
  Engine,
  ArcRotateCamera,
  Vector3,
  MeshBuilder,
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
import "@babylonjs/loaders/glTF"; // registers the glTF loader, still required
import { LoadAssetContainerAsync, TransformNode } from "@babylonjs/core";

export default function createEnvironmentScene(engine: Engine) {
  const scene = new Scene(engine);

  // 360-degree background image (equirectangular panorama, 2:1 ratio)
  new PhotoDome(
    "sky",
    assetUrl("assets/element2/sky360.hdr"),
    { resolution: 32, size: 1000 },
    scene
  );


  // ---------- Camera controlls (Mouse and Keyboard)

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
  // Colour map from Gaea: one texture covering the whole terrain
  terrainMat.diffuseTexture = new Texture(assetUrl("assets/element2/colour.webp"), scene);
  // Normal map from Gaea: adds fine surface detail to the lighting
  terrainMat.bumpTexture = new Texture(assetUrl("assets/element2/normalmap.webp"), scene);
  terrainMat.invertNormalMapX = true;
  terrainMat.invertNormalMapY = true;
  terrainMat.specularColor = Color3.Black();


  // ---------- Greate the ground using the heightmap found in assets/element2.

  const terrain = MeshBuilder.CreateGroundFromHeightMap(
    "terrain",
    assetUrl("assets/element2/heightmap.png"),
    {
      width: 50,           // Width of terrain in world (x)
      height: 50,          // Height of terrain in world (z)
      subdivisions: 100,    // Grid resolution (Increases the poly conts that make up the terain)
      minHeight: 0,         // Height for black pixels
      maxHeight: 32,        // Height for white pixels
      onReady: (ground) => 
      {
        scatterObject(scene, ground, "assets/element2/tree.glb", "tree", 900);
        scatterObject(scene, ground, "assets/element2/horse.glb", "horse", 100, true);
        scatterObject(scene, ground, "assets/element2/house.glb", "house", 50, true, 75);
      }
    },
    scene
  );
  terrain.material = terrainMat;

  return { scene, camera, terrain };
}

// ---------- Spawn srea of all objects in level (not including terrain) 

// Returns the world-space area trees may spawn in, kept away from the edges
function getSpawnArea(terrain: GroundMesh) {
  terrain.computeWorldMatrix(true); // make sure any scaling is applied first
  const { minimumWorld: min, maximumWorld: max } =
    terrain.getBoundingInfo().boundingBox;

  const marginX = (max.x - min.x) * 0.1; // keep 10% in from each edge
  const marginZ = (max.z - min.z) * 0.1;

  return {
    minX: min.x + marginX,
    maxX: max.x - marginX,
    minZ: min.z + marginZ,
    maxZ: max.z - marginZ,
  };
}

const randomBetween = (a: number, b: number) => a + Math.random() * (b - a);


// ---------- Scatter objects on the terrain

async function scatterObject(
  scene: Scene,
  terrain: GroundMesh,
  assetLocation: string,
  name: string,
  count: number,
  conformToNormal = false,
  scale = 400 // increases the scale of the object.
) {
  const container = await LoadAssetContainerAsync(assetUrl(assetLocation), scene);

  const area = getSpawnArea(terrain);
  const sizeFactor = (area.maxX - area.minX) / scale;

  for (let i = 0; i < count; i++) {
    const xPosition = randomBetween(area.minX, area.maxX);
    const zPosition = randomBetween(area.minZ, area.maxZ);

    const entries = container.instantiateModelsToScene();

    const visual = new TransformNode(`${name}${i}`, scene); // ${name}${i} gives all objects numbers at the end of the name.
    entries.rootNodes.forEach((node) => (node.parent = visual));

    visual.position.set(xPosition, terrain.getHeightAtCoordinates(xPosition, zPosition), zPosition);
    visual.rotation.y += (Math.random() * Math.PI * 2);
    if (conformToNormal)
    {visual.rotation = terrain.getNormalAtCoordinates(xPosition, zPosition);}

    visual.scaling.setAll((0.8 + Math.random() * 0.4) * sizeFactor);
  }
}

// place a mesh object onto the serface of the terrain
function place(mesh: AbstractMesh, terrain: GroundMesh, xPosition: number, zPosition: number) {
  const yPosition = terrain.getHeightAtCoordinates(xPosition, zPosition);
  mesh.position.set(xPosition, yPosition + 1, zPosition);
}