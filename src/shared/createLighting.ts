import {
  Scene, Vector3, Mesh,
  HemisphericLight, PointLight, SpotLight, DirectionalLight, Color3,
  ShadowGenerator,
} from "@babylonjs/core";

function createPointLight(
    scene: Scene,
    position = new Vector3(5, 20, 10),
    intensity = 0.3,
    diffuse = new Color3(0.5, 1, 1),
    speculer =  new Color3(0.8, 1, 1)
) {
    const light = new PointLight(
        "pointLight",
        position,
        scene
    );
    light.position = position;
    light.intensity = intensity;
    light.diffuse = diffuse;
    light.specular = speculer;
    return light;
}

function createDirectionalLight(
    scene: Scene,
    direction = new Vector3(0.2, -1, 0.2),
    position = new Vector3(20, 40, 20),
    intensity = 0.7,
    diffuse = new Color3(1, 0, 0),
    specular = new Color3(0, 1, 0)
) {
    const light = new DirectionalLight(
        "directionalLight",
        direction,
        scene
    );
    light.position = position;
    light.intensity = intensity;
    light.diffuse = diffuse;
    light.specular = specular;
    return light;
}

function createSpotLight(scene: Scene) {
    const light = new SpotLight(
        "spotLight",
        new Vector3(1, 5, -3),
        new Vector3(0, -1, 0),
        Math.PI / 3,
        20,
        scene
    );
    light.intensity = 0.7;
    light.diffuse = new Color3(1, 0, 0);
    light.specular = new Color3(0, 1, 0);
    return light;
}

function createHemisphericLight(scene: Scene) {
    const light = new HemisphericLight(
        "hemisphericLight",
        new Vector3(1, 10, 0),
        scene
    );
    light.intensity = 0.3;
    light.diffuse = new Color3(1, 0, 0);
    light.specular = new Color3(0, 1, 0);
    light.groundColor = new Color3(0, 1, 0);
    return light;
}

function createShadows(light: DirectionalLight, sphere: Mesh, box: Mesh) {
    const shadower = new ShadowGenerator(1024, light);
    const shadowmap = shadower.getShadowMap();
    shadowmap?.renderList?.push(sphere, box);

    shadower.setDarkness(0.2);
    shadower.useBlurExponentialShadowMap = true;
    shadower.blurScale = 4;
    shadower.blurBoxOffset = 1;
    shadower.useKernelBlur = true;
    shadower.blurKernel = 64;
    shadower.bias = 0;
    return shadower;
}