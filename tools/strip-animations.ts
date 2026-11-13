// File is for removing animations from glb files, these files are non player files so assets that are static on screen.

import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune } from "@gltf-transform/functions";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("Usage: bun tools/strip-animations.ts <input.glb> <output.glb>");
  process.exit(1);
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);

const animations = doc.getRoot().listAnimations();
console.log(`Removing ${animations.length} animation(s)`);
animations.forEach((a) => a.dispose());

await doc.transform(prune());
await io.write(output, doc);