import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune } from "@gltf-transform/functions";

const [input, output, ...keep] = process.argv.slice(2);
if (!input || !output || keep.length === 0) {
  console.error("Usage: bun tools/keep-animations.ts <in.glb> <out.glb> <name> [name...]");
  process.exit(1);
}

// exact names only (ignores upper/lower case, so "run" matches "Run" but not "Run_Backwards")
const wanted = new Set(keep.map((name) => name.trim().toLowerCase()));
const matched = new Set<string>();

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);

for (const animation of doc.getRoot().listAnimations()) {
  const name = animation.getName();
  const key = name.trim().toLowerCase();

  if (wanted.has(key)) {
    console.log(`Keeping:  ${name}`);
    matched.add(key);
  } else {
    console.log(`Removing: ${name}`);
    animation.dispose();
  }
}

// warn about any requested name that did not match a clip
for (const name of wanted) {
  if (!matched.has(name)) console.warn(`No exact match for: ${name}`);
}

await doc.transform(prune());
await io.write(output, doc);