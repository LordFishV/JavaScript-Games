// Made with AI, Only effects assets (textures, models and animations not code).

import { copyFile, cp, mkdir, mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// ---------- flags ----------
const args = process.argv.slice(2);
const hasFlag = (f: string) => args.includes(f);
const flagValue = (f: string) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};

const SRC = flagValue("--src") ?? "source-art/assets"; // originals (never modified)
const OUT = flagValue("--out") ?? "public/assets";     // optimised output
const DRY = hasFlag("--dry-run");
const FORCE = hasFlag("--force");
const INIT = hasFlag("--init");
const MANIFEST = path.join(path.dirname(SRC), ".optimise-manifest.json");

const tierArg = flagValue("--tier");
const TIER = tierArg === undefined ? 5 : Number(tierArg);
if (!Number.isInteger(TIER) || TIER < 0 || TIER > 10) {
  console.error("--tier must be a whole number from 0 to 10.");
  process.exit(1);
}

// ---------- settings that follow the tier ----------
const at = <T>(values: T[]) => values[TIER] as T;
const S = {
  maxTextureSize: at([Infinity, Infinity, 8192, 4096, 4096, 2048, 2048, 2048, 1024, 1024, 512]),
  colourToWebp: TIER >= 3,
  colourQuality: at([0, 95, 92, 90, 85, 80, 75, 70, 65, 60, 50]),
  pngEffort: at([1, 1, 2, 3, 4, 5, 6, 7, 7, 7, 7]),
  dataMapMaxSize: at([Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, 2048, 1024]),
  glbTextureSize: at([Infinity, Infinity, 2048, 2048, 2048, 1024, 1024, 1024, 512, 512, 512]),
  glbWebp: TIER >= 4,
  glbSimplify: TIER >= 7,
  audioConvert: TIER >= 1,
  audioLongBitrate: at(["", "192k", "160k", "160k", "128k", "128k", "112k", "96k", "96k", "80k", "64k"]),
  audioShortBitrate: at(["", "192k", "160k", "128k", "112k", "96k", "96k", "80k", "80k", "64k", "64k"]),
  monoShort: TIER >= 3,
  shortSeconds: 10,
};

// ---------- settings you edit yourself ----------
// file names matching this are DATA maps: lossless only, never lossy-compressed
const DATA_MAP_PATTERN =
  /(normal|nrm|ordp|aor|rough|metal|occlusion|height|disp|bump|mask)|(^|[^a-z])(ao|orm)([^a-z]|$)/i;

// part of a .glb file name -> fraction of triangles to keep (used at tier 7 and above only)
// e.g. { house: 0.1 }. Never list an animated character here.
const GLB_SIMPLIFY: Record<string, number> = {};

// ---------- helpers ----------
const fmt = (n: number) =>
  n >= 1048576 ? `${(n / 1048576).toFixed(2)} MB` : `${(n / 1024).toFixed(0)} KB`;
const pad = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n));
const sizeOf = async (f: string) => (await stat(f)).size;

async function run(cmd: string[]) {
  const proc = Bun.spawn(cmd, { stdout: "pipe", stderr: "pipe" });
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { ok: code === 0, out: out.trim(), err: err.trim() };
}

const TOOLS = {
  cwebp: Bun.which("cwebp") !== null,
  optipng: Bun.which("optipng") !== null,
  ffmpeg: Bun.which("ffmpeg") !== null,
  ffprobe: Bun.which("ffprobe") !== null,
};
const MAGICK = Bun.which("magick") ? ["magick"] : Bun.which("convert") ? ["convert"] : null;
const IDENTIFY = Bun.which("magick")
  ? ["magick", "identify"]
  : Bun.which("identify")
    ? ["identify"]
    : null;

type Kind = "colour-image" | "data-image" | "glb" | "audio" | "copy";
type Candidate = { file: string; outRel: string } | null;

function classify(rel: string): Kind {
  if (TIER === 0) return "copy"; // tier 0 = copy everything unchanged
  const ext = path.extname(rel).toLowerCase();
  const name = path.basename(rel, ext);
  if (ext === ".glb") return "glb";
  if (ext === ".wav") return S.audioConvert ? "audio" : "copy";
  if (ext === ".png" || ext === ".jpg" || ext === ".jpeg") {
    return DATA_MAP_PATTERN.test(name) ? "data-image" : "colour-image";
  }
  return "copy"; // .hdr, .wasm, .mp3, .ogg, .webp, json, etc. are copied unchanged
}

// ---------- optimisers: each writes a CANDIDATE into a temp folder, never into your files ----------
async function imageWidth(file: string) {
  if (!IDENTIFY) return 0;
  const r = await run([...IDENTIFY, "-format", "%w", file]);
  return r.ok ? Number.parseInt(r.out, 10) || 0 : 0;
}

// shrinks an image to a maximum size (never enlarges). Returns the new file, or the input if nothing changed.
async function maybeResize(input: string, maxSize: number, tmp: string) {
  if (!MAGICK || !Number.isFinite(maxSize)) return { file: input, resized: false };
  if ((await imageWidth(input)) <= maxSize) return { file: input, resized: false };
  const resized = path.join(tmp, "resized.png");
  const size = `${maxSize}x${maxSize}>`; // ">" = only ever shrink
  const ok = (await run([...MAGICK, input, "-resize", size, resized])).ok;
  return ok ? { file: resized, resized: true } : { file: input, resized: false };
}

async function colourImage(src: string, rel: string, tmp: string): Promise<Candidate> {
  const ext = path.extname(rel).toLowerCase();
  const base = rel.slice(0, -ext.length);
  const { file: input } = await maybeResize(src, S.maxTextureSize, tmp);

  if (S.colourToWebp && TOOLS.cwebp) {
    const out = path.join(tmp, "out.webp");
    const r = await run(["cwebp", "-quiet", "-q", String(S.colourQuality), input, "-o", out]);
    if (r.ok) return { file: out, outRel: `${base}.webp` };
  }

  if (ext === ".png" && TOOLS.optipng) {
    const out = path.join(tmp, "out.png");
    await copyFile(input, out);
    if ((await run(["optipng", "-quiet", `-o${S.pngEffort}`, out])).ok) return { file: out, outRel: rel };
  }
  return null;
}

async function dataImage(src: string, rel: string, tmp: string): Promise<Candidate> {
  // lossless recompression, plus an optional resize at the highest tiers
  if (path.extname(rel).toLowerCase() !== ".png") return null;
  const { file: input, resized } = await maybeResize(src, S.dataMapMaxSize, tmp);
  const out = path.join(tmp, "out.png");
  await copyFile(input, out);
  const ok = TOOLS.optipng ? (await run(["optipng", "-quiet", `-o${S.pngEffort}`, out])).ok : false;
  return ok || resized ? { file: out, outRel: rel } : null;
}

async function glb(src: string, rel: string, tmp: string): Promise<Candidate> {
  const step = async (name: string, input: string, extra: string[] = []) => {
    const output = path.join(tmp, `${name}.glb`);
    const r = await run(["bunx", "@gltf-transform/cli", name, input, output, ...extra]);
    if (!r.ok) throw new Error(`${name}: ${r.err.split("\n")[0]}`);
    return output;
  };

  const ratio = Object.entries(GLB_SIMPLIFY).find(([key]) =>
    rel.toLowerCase().includes(key.toLowerCase())
  )?.[1];

  let current = await step("prune", src);
  current = await step("dedup", current);
  if (S.glbSimplify && ratio !== undefined) {
    current = await step("weld", current);
    current = await step("simplify", current, ["--ratio", String(ratio), "--error", "0.01"]);
  }
  if (Number.isFinite(S.glbTextureSize)) {
    const s = String(S.glbTextureSize);
    current = await step("resize", current, ["--width", s, "--height", s]);
  }
  if (S.glbWebp) current = await step("webp", current);
  return { file: current, outRel: rel };
}

async function audio(src: string, rel: string, tmp: string): Promise<Candidate> {
  if (!TOOLS.ffmpeg) return null;
  let seconds = 0;
  if (TOOLS.ffprobe) {
    const r = await run([
      "ffprobe", "-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", src,
    ]);
    seconds = Number.parseFloat(r.out) || 0;
  }
  const short = seconds > 0 && seconds <= S.shortSeconds;
  const out = path.join(tmp, "out.mp3");
  const r = await run([
    "ffmpeg", "-y", "-loglevel", "error", "-i", src,
    ...(short && S.monoShort ? ["-ac", "1"] : []),
    "-c:a", "libmp3lame", "-b:a", short ? S.audioShortBitrate : S.audioLongBitrate,
    out,
  ]);
  return r.ok ? { file: out, outRel: rel.replace(/\.wav$/i, ".mp3") } : null;
}

// ---------- main ----------
type Manifest = Record<string, { mtimeMs: number; size: number; outRel: string; tier: number }>;
type Row = { rel: string; outRel: string; before: number; after: number; action: string };

async function main() {
  if (path.resolve(SRC) === path.resolve(OUT)) {
    console.error("The source and output folders must be different.");
    process.exit(1);
  }

  if (INIT) {
    if (existsSync(SRC)) {
      console.error(`${SRC} already exists, so --init does nothing. Your originals are safe.`);
      process.exit(1);
    }
    await mkdir(path.dirname(SRC), { recursive: true });
    await cp(OUT, SRC, { recursive: true });
    console.log(`Copied ${OUT} to ${SRC}. Those are now your originals.`);
    console.log("Next: bun run optimise --dry-run, then bun run optimise");
    return;
  }

  if (!existsSync(SRC)) {
    console.error(`No originals folder at ${SRC}.`);
    console.error("Run  bun run optimise --init  once to copy your current assets there.");
    process.exit(1);
  }

  console.log(`Optimisation tier ${TIER} of 10${TIER === 5 && tierArg === undefined ? " (default)" : ""}`);

  const missing = Object.entries(TOOLS).filter(([, ok]) => !ok).map(([name]) => name);
  if (!MAGICK) missing.push("imagemagick");
  if (missing.length) console.warn(`Missing tools (those file types are copied unchanged): ${missing.join(", ")}\n`);

  const manifest: Manifest = existsSync(MANIFEST) ? await Bun.file(MANIFEST).json() : {};

  const files: string[] = [];
  for (const entry of await readdir(SRC, { recursive: true })) {
    if ((await stat(path.join(SRC, entry))).isFile()) files.push(entry);
  }
  files.sort();

  const tmpRoot = await mkdtemp(path.join(tmpdir(), "optimise-"));
  const rows: Row[] = [];
  const claimed = new Map<string, string>(); // output path -> original that wrote it
  const staleCandidates = new Set<string>();
  let skipped = 0;

  for (const rel of files) {
    const src = path.join(SRC, rel);
    const info = await stat(src);
    const kind = classify(rel);
    const prev = manifest[rel];

    if (!FORCE && prev && prev.mtimeMs === info.mtimeMs && prev.size === info.size &&
        prev.tier === TIER && existsSync(path.join(OUT, prev.outRel))) {
      skipped++;
      continue;
    }
    if (DRY) {
      console.log(`[dry run] ${pad(rel, 50)} ${kind}`);
      continue;
    }

    const tmp = await mkdtemp(path.join(tmpRoot, "job-"));
    let candidate: Candidate = null;
    let failure = "";
    try {
      if (kind === "colour-image") candidate = await colourImage(src, rel, tmp);
      else if (kind === "data-image") candidate = await dataImage(src, rel, tmp);
      else if (kind === "glb") candidate = await glb(src, rel, tmp);
      else if (kind === "audio") candidate = await audio(src, rel, tmp);
    } catch (e) {
      failure = `failed (${(e as Error).message})`;
    }

    // only use the optimised file if it is genuinely smaller
    let chosen = src;
    let outRel = rel;
    let action = kind === "copy" ? "copied unchanged" : failure || "copied (tool missing or failed)";
    if (candidate) {
      if ((await sizeOf(candidate.file)) < info.size) {
        chosen = candidate.file;
        outRel = candidate.outRel;
        action = "optimised";
      } else {
        action = "kept original (not smaller)";
      }
    }

    // two originals must never write to the same output file
    const owner = claimed.get(outRel);
    if (owner) {
      console.warn(`Skipped ${rel}: it would overwrite the output of ${owner}. Remove one of the two originals.`);
      await rm(tmp, { recursive: true, force: true });
      continue;
    }
    claimed.set(outRel, rel);

    const dest = path.join(OUT, outRel);
    await mkdir(path.dirname(dest), { recursive: true });
    await copyFile(chosen, dest);

    rows.push({ rel, outRel, before: info.size, after: await sizeOf(dest), action });
    manifest[rel] = { mtimeMs: info.mtimeMs, size: info.size, outRel, tier: TIER };

    // remember outputs from earlier runs or earlier names that may now be stale
    if (prev && prev.outRel !== outRel) staleCandidates.add(prev.outRel);
    if (outRel !== rel) staleCandidates.add(rel);

    await rm(tmp, { recursive: true, force: true }); // only our own temp files
  }

  await rm(tmpRoot, { recursive: true, force: true });
  if (DRY) return;
  await Bun.write(MANIFEST, JSON.stringify(manifest, null, 2));

  // ---------- report ----------
  console.log(`\n${pad("file", 46)} ${pad("before", 10)} ${pad("after", 10)} result`);
  for (const r of rows) {
    console.log(`${pad(r.outRel, 46)} ${pad(fmt(r.before), 10)} ${pad(fmt(r.after), 10)} ${r.action}`);
  }
  const before = rows.reduce((n, r) => n + r.before, 0);
  const after = rows.reduce((n, r) => n + r.after, 0);
  console.log(`\nProcessed ${rows.length} file(s), skipped ${skipped} unchanged.`);
  console.log(`Total: ${fmt(before)} -> ${fmt(after)} (saved ${fmt(before - after)})`);

  const renamed = rows.filter((r) => r.outRel !== r.rel);
  if (renamed.length) {
    console.log("\nFile names changed. Update these paths in your code:");
    for (const r of renamed) console.log(`  ${r.rel}  ->  ${r.outRel}`);
  }

  // outputs from earlier runs that nothing writes to any more (never deleted automatically)
  const liveOutputs = new Set(Object.values(manifest).map((m) => m.outRel));
  const stale = [...staleCandidates].filter(
    (p) => !liveOutputs.has(p) && existsSync(path.join(OUT, p))
  );
  if (stale.length) {
    console.log("\nOld versions are still in the output folder (nothing was deleted). Remove them yourself once the paths are updated:");
    for (const p of stale) console.log(`  ${path.join(OUT, p)}`);
  }
}

await main();