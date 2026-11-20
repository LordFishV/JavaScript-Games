import { StandardMaterial, PBRMaterial, Texture, Scene, Color3 } from "@babylonjs/core";
import { assetUrl } from "./assetUrl";

export type TransparencyType = "RGBA" | "RGB";

export type FileType =
  | ".webp"
  | ".png"
  | ".jpg"
  | ".jpeg"
  | ".ktx2"
  | ".dds"
  | ".exr" 
  | ".hdr"
  | (string & {});

export type TextureType =
  | "albedo"
  | "normal"
  | "specular"
  | "emissive"
  | "ambient-occlusion"
  | "roughness"
  | "metallic"
  | "displacement"
  | "aor"
  | "orm"
  | "ordp";

export interface MaterialOptions {
  name: string;
  textureLocation: string;
  textureName: string;
  textureType: FileType; // Default file extension for all textures
  textureTypes?: Partial<Record<TextureType, FileType>>; // Per-texture extension overrides
  diffuseSuffix?: TextureType | "";
  hasNormal?: boolean;
  hasSpecular?: boolean;
  hasMetallic?: boolean;
  hasRoughness?: boolean;
  hasAmbientOcclusion?: boolean;
  hasDisplacement?: boolean;
  hasPackedTexture?: boolean;
  hasEmissive?: boolean;
  hasEmissiveTexture?: boolean;
  hasTransparency?: TransparencyType;
}

function getTexture(scene: Scene, info: MaterialOptions, suffix: TextureType | ""): Texture {
  const lookupKey: TextureType = suffix === "" ? "albedo" : suffix;
  const rawExt = info.textureTypes?.[lookupKey] ?? info.textureType;
  const ext = rawExt.startsWith(".") ? rawExt : `.${rawExt}`;

  return new Texture(
    assetUrl(`${info.textureLocation}${info.textureName}${suffix}${ext}`),
    scene
  );
}

export function createStandardMaterial(scene: Scene, info: MaterialOptions): StandardMaterial {
  const standardMaterial = new StandardMaterial(`${info.name}ground`, scene);
  const diffuseTexture = getTexture(scene, info, info.diffuseSuffix ?? "albedo");
  standardMaterial.diffuseTexture = diffuseTexture;

  if (info.hasTransparency === "RGBA") {
    standardMaterial.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
    diffuseTexture.hasAlpha = true;
    standardMaterial.useAlphaFromDiffuseTexture = true;
  } else if (info.hasTransparency === "RGB") {
    standardMaterial.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
    diffuseTexture.getAlphaFromRGB = true;
    standardMaterial.opacityTexture = diffuseTexture;
  }

  if (info.hasNormal) {
    standardMaterial.bumpTexture = getTexture(scene, info, "normal");
    standardMaterial.bumpTexture.level = 1.0;
  }

  if (info.hasSpecular) {
    standardMaterial.specularTexture = getTexture(scene, info, "specular");
    standardMaterial.specularColor = new Color3(0.6, 0.6, 0.6);
    standardMaterial.specularPower = 32;
  } else {
    standardMaterial.specularColor = Color3.Black();
  }

  if (info.hasEmissive || info.hasEmissiveTexture) {
    standardMaterial.emissiveColor = Color3.White();
    if (info.hasEmissiveTexture) {
      standardMaterial.emissiveTexture = getTexture(scene, info, "emissive");
    }
  }

  standardMaterial.backFaceCulling = true;
  return standardMaterial;
}

export function createPbrMaterial(scene: Scene, info: MaterialOptions): PBRMaterial {
  const pbrMaterial = new PBRMaterial(`${info.name}material`, scene);
  const albedoTexture = getTexture(scene, info, info.diffuseSuffix ?? "albedo");
  pbrMaterial.albedoTexture = albedoTexture;
  pbrMaterial.specularIntensity = 0;

  if (info.hasTransparency === "RGBA") {
    pbrMaterial.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
    albedoTexture.hasAlpha = true;
    pbrMaterial.useAlphaFromAlbedoTexture = true;
  } else if (info.hasTransparency === "RGB") {
    pbrMaterial.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
    albedoTexture.getAlphaFromRGB = true;
    pbrMaterial.opacityTexture = albedoTexture;
  }

  if (info.hasNormal) {
    pbrMaterial.bumpTexture = getTexture(scene, info, "normal");
    pbrMaterial.bumpTexture.level = 1.0;
  }

  if (info.hasPackedTexture) {
    pbrMaterial.roughness = 1.0;
    pbrMaterial.useRoughnessFromMetallicTextureAlpha = false;
    pbrMaterial.useRoughnessFromMetallicTextureGreen = info.hasRoughness ?? true;
    pbrMaterial.useAmbientOcclusionFromMetallicTextureRed = info.hasAmbientOcclusion ?? true;

    if (info.hasMetallic) {
      pbrMaterial.metallic = 1.0;
      pbrMaterial.metallicTexture = getTexture(scene, info, "orm");
      pbrMaterial.useMetallnessFromMetallicTextureBlue = true;
    } else {
      pbrMaterial.metallic = 0.0;
      pbrMaterial.metallicTexture = getTexture(scene, info, "aor");
      pbrMaterial.useMetallnessFromMetallicTextureBlue = false;
    }
  }

  if (info.hasDisplacement && pbrMaterial.bumpTexture) {
    pbrMaterial.useParallax = true;
    pbrMaterial.useParallaxOcclusion = true;
    pbrMaterial.parallaxScaleBias = 0.05;
  }

  if (info.hasEmissive || info.hasEmissiveTexture) {
    pbrMaterial.emissiveColor = Color3.White();
    if (info.hasEmissiveTexture) {
      pbrMaterial.emissiveTexture = getTexture(scene, info, "emissive");
    }
  }

  return pbrMaterial;
}
