import {
  StandardMaterial,
  PBRMaterial,
  Texture,
  Scene,
  Color3,
  GlowLayer,
} from "@babylonjs/core";
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
  textureType: FileType;
  textureTypes?: Partial<Record<TextureType, FileType>>;
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
  emissiveColor?: Color3;
  emissiveIntensity?: number;
  hasTransparency?: TransparencyType;
}

export function ensureGlowLayer(scene: Scene, blurKernelSize = 32, intensity = 1.0): GlowLayer {
  let glowLayer = scene.getGlowLayerByName("glow") as GlowLayer | null;

  if (!glowLayer) {
    glowLayer = new GlowLayer("glow", scene, {
      blurKernelSize,
      mainTextureFixedSize: 256, // Optional: lowers resolution for a softer/wider bloom and better FPS
    });
  } else {
    glowLayer.blurKernelSize = blurKernelSize;
  }

  glowLayer.intensity = intensity;
  return glowLayer;
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

  // ---------- albedo ----------
  standardMaterial.diffuseTexture = diffuseTexture;

  // ---------- transparency ----------
  if (info.hasTransparency === "RGBA") {
    standardMaterial.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
    diffuseTexture.hasAlpha = true;
    standardMaterial.useAlphaFromDiffuseTexture = true;
  } else if (info.hasTransparency === "RGB") {
    standardMaterial.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
    diffuseTexture.getAlphaFromRGB = true;
    standardMaterial.opacityTexture = diffuseTexture;
  }

  // ---------- normal ----------
  if (info.hasNormal) {
    standardMaterial.bumpTexture = getTexture(scene, info, "normal");
    standardMaterial.bumpTexture.level = 1.0;
  }

  // ---------- specular ----------
  if (info.hasSpecular) {
    standardMaterial.specularTexture = getTexture(scene, info, "specular");
    standardMaterial.specularColor = new Color3(0.6, 0.6, 0.6);
    standardMaterial.specularPower = 32;
  } else {
    standardMaterial.specularColor = Color3.Black();
  }

// ---------- emissive ----------
if (info.hasEmissive || info.hasEmissiveTexture) {
  ensureGlowLayer(scene);

  if (info.hasEmissiveTexture) {
    standardMaterial.emissiveColor = info.emissiveColor ?? Color3.White();
    const emissiveTex = getTexture(scene, info, "emissive");
    emissiveTex.level = info.emissiveIntensity ?? 1.0;
    standardMaterial.emissiveTexture = emissiveTex;
  } else {
    // Reuse diffuseTexture so surface details show through instead of flat white
    standardMaterial.emissiveTexture = diffuseTexture;
    standardMaterial.emissiveColor = info.emissiveColor ?? new Color3(0.4, 0.4, 0.4);
    diffuseTexture.level = info.emissiveIntensity ?? 1.0;
  }
}

  // ---------- cull back faces ----------
  standardMaterial.backFaceCulling = true;
  return standardMaterial;
}

export function createPbrMaterial(scene: Scene, info: MaterialOptions): PBRMaterial {
  const pbrMaterial = new PBRMaterial(`${info.name}material`, scene);
  const albedoTexture = getTexture(scene, info, info.diffuseSuffix ?? "albedo");

  // ---------- albedo ----------
  pbrMaterial.albedoTexture = albedoTexture;

  // ---------- specular ----------
  pbrMaterial.specularIntensity = 0;

  // ---------- transparency ----------
  if (info.hasTransparency === "RGBA") {
    pbrMaterial.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
    albedoTexture.hasAlpha = true;
    pbrMaterial.useAlphaFromAlbedoTexture = true;
  } else if (info.hasTransparency === "RGB") {
    pbrMaterial.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
    albedoTexture.getAlphaFromRGB = true;
    pbrMaterial.opacityTexture = albedoTexture;
  }

  // ---------- normal ----------
  if (info.hasNormal) {
    pbrMaterial.bumpTexture = getTexture(scene, info, "normal");
    pbrMaterial.bumpTexture.level = 1.0;
  }

  // ---------- roughness ----------
  if (info.hasPackedTexture) {
    pbrMaterial.roughness = 1.0;
    pbrMaterial.useRoughnessFromMetallicTextureAlpha = false;
    pbrMaterial.useRoughnessFromMetallicTextureGreen = info.hasRoughness ?? true;
    pbrMaterial.useAmbientOcclusionFromMetallicTextureRed = info.hasAmbientOcclusion ?? true;

    // ---------- metallic ----------
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

  // ---------- displacement ----------
  if (info.hasDisplacement && pbrMaterial.bumpTexture) {
    pbrMaterial.useParallax = true;
    pbrMaterial.useParallaxOcclusion = true;
    pbrMaterial.parallaxScaleBias = 0.05;
  }

// ---------- emissive ----------
if (info.hasEmissive || info.hasEmissiveTexture) {
  ensureGlowLayer(scene);

  if (info.hasEmissiveTexture) {
    pbrMaterial.emissiveColor = info.emissiveColor ?? Color3.White();
    pbrMaterial.emissiveIntensity = info.emissiveIntensity ?? 1.0;
    pbrMaterial.emissiveTexture = getTexture(scene, info, "emissive");
  } else {
    // Reuse albedoTexture so surface details show through instead of flat white
    pbrMaterial.emissiveTexture = albedoTexture;
    pbrMaterial.emissiveColor = info.emissiveColor ?? Color3.White();
    pbrMaterial.emissiveIntensity = info.emissiveIntensity ?? 0.35;
  }
}

  return pbrMaterial;
}
