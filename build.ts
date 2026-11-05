import { Glob } from "bun";
import { cp, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });

const entrypoints = [...new Glob("**/index.html").scanSync("src")].map(
  (p) => `src/${p}`
);

const result = await Bun.build({ entrypoints, outdir: "dist", minify: true });
if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}
await cp("public", "dist", { recursive: true });