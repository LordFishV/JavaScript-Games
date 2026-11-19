// Made with AI, Only effects assets (textures, models and animations not code).

import { copyFile, mkdir, mkdtemp, readdir, rm, stat } from "node:fs/promises";
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
const OUT = flagValue("--out") ?? "public/assets";     // output
const DRY = hasFlag("--dry-run");
const FORCE = hasFlag("--force");
const AI_FLAG = hasFlag("--ai"); // optional AI upscaler, see notes
const MANIFEST = path.join(path.dirname(SRC), ".quality-manifest.json");

const tierArg = flagValue("--tier");
const TIER = tierArg === undefined ? 5 : Number(tierArg);
if (!Number.isInteger(TIER) || TIER < 0 || TIER > 10) {
  console.error("--tier must be a whole number from 0 to 10.");
  process.exit(1);
}
const MAX_SIDE = Number(flagValue("--max") ?? 4096);
if (!Number.isFinite(MAX_SIDE) || MAX_SIDE < 256) {
  console.error("--max must be a number of pixels, for example 4096.");
  process.exit(1);
}

// ---------- settings that follow the tier ----------
const at = <T>(values: T[]) => values[TIER] as T;
const Q = {
  colourScale: at([1, 1, 1, 1.5, 1.5, 2, 2, 2, 3, 4, 4]),
  dataScale: at([1, 1, 1, 1, 1.5, 1.5, 2, 2, 2, 2, 2]),
  sharpen: at([0, 0.2, 0.3, 0.3, 0.4, 0.5, 0.5, 0.6, 0.7, 0.8, 1.0]),
  webpLossless: TIER >= 6,
  webpQuality: 95,
  smoothHeight: TIER >= 7,
  normaliseAudio: TIER >= 6,
  ai: AI_FLAG && TIER >= 6,
};

// file names matching this are DATA maps: never sharpened, never lossy
const DATA_MAP_PATTERN =
  /(normal|nrm|ordp|aor|rough|metal|occlusion|height|disp|bump|mask)|(^|[^a-z])(ao|orm)([^a-z]|$)/i;
const HEIGHT_PATTERN = /height|disp/i;

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
  ffmpeg: Bun.which("ffmpeg") !== null,
  realesrgan: Bun.which("realesrgan-ncnn-vulkan") !== null,
};
const MAGICK = Bun.which("magick") ? ["magick"] : Bun.which("convert") ? ["convert"] : null;
const IDENTIFY = Bun.which("magick")
  ? ["magick", "identify"]
  : Bun.which("identify")
    ? ["identify"]
    : null;

type Kind = "colour-image" | "data-image" | "audio" | "copy";
type Candidate = { file: string; outRel: string } | null;
type Dims = { w: number; h: number };

const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".webp"];

function classify(rel: string): Kind {
  if (TIER === 0) return "copy"; // tier 0 = copy everything unchanged
  const ext = path.extname(rel).toLowerCase();
  const name = path.basename(rel, ext);
  if (ext === ".wav") return "audio";
  if (IMAGE_EXTS.includes(ext)) return DATA_MAP_PATTERN.test(name) ? "data-image" : "colour-image";
  return "copy"; // .glb, .hdr, .wasm, .mp3, .ogg, json, etc. are copied unchanged
}

async function dims(file: string): Promise<Dims | null> {
  if (!IDENTIFY) return null;
  const r = await run([...IDENTIFY, "-format", "%w %h ", file]);
  if (!r.ok) return null;
  const [w, h] = r.out.split(/\s+/).map(Number);
  return w && h ? { w, h } : null;
}

// how big to make an image: never shrinks, never exceeds the size cap
function plan(d: Dims, factor: number): Dims | null {
  const side = Math.max(d.w, d.h);
  const scale = Math.min(side * factor, MAX_SIDE) / side;
  if (scale < 1.02) return null;
  return { w: Math.round(d.w * scale), h: Math.round(d.h * scale) };
}

// ---------- processors: each writes a CANDIDATE into a temp folder, never into your files ----------
async function colourImage(src: string, rel: string, tmp: string): Promise<Candidate> {
  if (!MAGICK || !TOOLS.cwebp) return null;
  const ext = path.extname(rel).toLowerCase();
  const d = await dims(src);
  const target = d ? plan(d, Q.colourScale) : null;

  // an existing lossy WebP with nothing to change is left alone (re-encoding would only lose quality)
  if (!target && Q.sharpen === 0 && ext === ".webp") return null;

  const prepared = path.join(tmp, "prepared.png");
  let done = false;

  // optional AI upscaler (only with --ai at tier 6+, and only if installed)
  if (target && Q.ai && TOOLS.realesrgan) {
    const png = path.join(tmp, "in.png");
    const ai = path.join(tmp, "ai.png");
    if (
      (await run([...MAGICK, src, png])).ok &&
      (await run(["realesrgan-ncnn-vulkan", "-i", png, "-o", ai, "-n", "realesrgan-x4plus", "-s", "4"])).ok
    ) {
      done = (await run([...MAGICK, ai, "-filter", "Lanczos", "-resize", `${target.w}x${target.h}!`, prepared])).ok;
    }
  }

  if (!done) {
    const ops = [
      ...(target ? ["-filter", "Lanczos", "-resize", `${target.w}x${target.h}!`] : []),
      ...(Q.sharpen > 0 ? ["-unsharp", `0x0.8+${Q.sharpen}+0.02`] : []),
    ];
    const r = await run([...MAGICK, src, ...ops, prepared]);
    if (!r.ok) throw new Error(`ImageMagick: ${r.err.split("\n")[0]}`);
  }

  const out = path.join(tmp, "out.webp");
  const enc = Q.webpLossless ? ["-lossless", "-z", "6"] : ["-q", String(Q.webpQuality), "-alpha_q", "100"];
  const r = await run(["cwebp", "-quiet", ...enc, prepared, "-o", out]);
  return r.ok ? { file: out, outRel: `${rel.slice(0, -ext.length)}.webp` } : null;
}

async function dataImage(src: string, rel: string, tmp: string): Promise<Candidate> {
  if (!MAGICK) return null;
  const ext = path.extname(rel).toLowerCase();
  const base = path.basename(rel, ext);
  const d = await dims(src);
  const target = d ? plan(d, Q.dataScale) : null;
  const smooth = Q.smoothHeight && HEIGHT_PATTERN.test(base);
  if (!target && !smooth) return null; // nothing to do: the data stays exactly as it is

  const prepared = path.join(tmp, "prepared.png");
  const ops = [
    ...(target ? ["-filter", "Mitchell", "-resize", `${target.w}x${target.h}!`] : []), // smooth filter, no ringing
    ...(smooth ? ["-blur", "0x0.7"] : []), // softens the stepped look of 8-bit height values
  ];
  const r = await run([...MAGICK, src, ...ops, prepared]);
  if (!r.ok) throw new Error(`ImageMagick: ${r.err.split("\n")[0]}`);

  if (ext === ".webp") {
    if (!TOOLS.cwebp) return null;
    const out = path.join(tmp, "out.webp");
    const w = await run(["cwebp", "-quiet", "-lossless", "-z", "6", prepared, "-o", out]);
    return w.ok ? { file: out, outRel: rel } : null; // data maps are only ever stored losslessly
  }
  const outRel = ext === ".png" ? rel : `${rel.slice(0, -ext.length)}.png`;
  return { file: prepared, outRel };
}

async function audio(src: string, rel: string, tmp: string): Promise<Candidate> {
  if (!Q.normaliseAudio || !TOOLS.ffmpeg) return null; // lossless WAV is left alone below tier 6
  const out = path.join(tmp, "out.wav");
  const r = await run([
    "ffmpeg", "-y", "-loglevel", "error", "-i", src,
    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
    "-ar", "48000", "-c:a", "pcm_s16le", // loudnorm resamples to a very high rate, so set it back
    out,
  ]);
  return r.ok ? { file: out, outRel: rel } : null;
}

// ---------- main ----------
type Manifest = Record<string, {
  mtimeMs: number; size: number; outRel: string; tier: number; max: number; ai: boolean;
  outSize: number; outMtimeMs: number;
}>;
type Row = {
  rel: string; outRel: string; before: number; after: number;
  dim: string; gpu: number; action: string;
};

async function main() {
  if (path.resolve(SRC) === path.resolve(OUT)) {
    console.error("The source and output folders must be different.");
    process.exit(1);
  }
  if (!existsSync(SRC)) {
    console.error(`No originals folder at ${SRC}.`);
    console.error("Put your original (highest-quality) assets there, or run  bun run optimise --init  once.");
    process.exit(1);
  }

  console.log(`Quality tier ${TIER} of 10${TIER === 5 && tierArg === undefined ? " (default)" : ""}`);
  console.log(`Size cap: ${MAX_SIDE}px on the longest side (change with --max)`);
  if (Q.ai && !TOOLS.realesrgan) console.warn("--ai was given but realesrgan-ncnn-vulkan is not installed, so normal upscaling is used.");

  const missing: string[] = [];
  if (!MAGICK) missing.push("imagemagick");
  if (!TOOLS.cwebp) missing.push("cwebp");
  if (!TOOLS.ffmpeg) missing.push("ffmpeg");
  if (missing.length) console.warn(`Missing tools (those file types are copied unchanged): ${missing.join(", ")}\n`);

  const manifest: Manifest = existsSync(MANIFEST) ? await Bun.file(MANIFEST).json() : {};

  const files: string[] = [];
  for (const entry of await readdir(SRC, { recursive: true })) {
    if ((await stat(path.join(SRC, entry))).isFile()) files.push(entry);
  }
  files.sort();

  const tmpRoot = await mkdtemp(path.join(tmpdir(), "quality-"));
  const rows: Row[] = [];
  const claimed = new Map<string, string>(); // output path -> original that wrote it
  const staleCandidates = new Set<string>();
  let skipped = 0;

  for (const rel of files) {
    const src = path.join(SRC, rel);
    const info = await stat(src);
    const kind = classify(rel);
    const prev = manifest[rel];

    // skip files that are already done, unless something else (like the optimiser) has since replaced the output
    if (!FORCE && prev && prev.mtimeMs === info.mtimeMs && prev.size === info.size &&
        prev.tier === TIER && prev.max === MAX_SIDE && prev.ai === Q.ai) {
      const outPath = path.join(OUT, prev.outRel);
      if (existsSync(outPath)) {
        const o = await stat(outPath);
        if (o.size === prev.outSize && o.mtimeMs === prev.outMtimeMs) {
          skipped++;
          continue;
        }
      }
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
      else if (kind === "audio") candidate = await audio(src, rel, tmp);
    } catch (e) {
      failure = `failed (${(e as Error).message})`;
    }

    let chosen = src;
    let outRel = rel;
    let action = kind === "copy" ? "copied unchanged" : failure || "copied unchanged (nothing to improve)";
    if (candidate) {
      chosen = candidate.file;
      outRel = candidate.outRel;
      action = "improved";
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

    // size on disk, pixel size and an estimate of GPU memory (RGBA plus mipmaps)
    let dim = "";
    let gpu = 0;
    if (IMAGE_EXTS.includes(path.extname(outRel).toLowerCase())) {
      const d = await dims(dest);
      if (d) {
        dim = `${d.w}x${d.h}`;
        gpu = d.w * d.h * 4 * 1.33;
      }
    }

    const outStat = await stat(dest);
    rows.push({ rel, outRel, before: info.size, after: outStat.size, dim, gpu, action });
    manifest[rel] = {
      mtimeMs: info.mtimeMs, size: info.size, outRel, tier: TIER, max: MAX_SIDE, ai: Q.ai,
      outSize: outStat.size, outMtimeMs: outStat.mtimeMs,
    };

    if (prev && prev.outRel !== outRel) staleCandidates.add(prev.outRel);
    if (outRel !== rel) staleCandidates.add(rel);

    await rm(tmp, { recursive: true, force: true }); // only our own temp files
  }

  await rm(tmpRoot, { recursive: true, force: true });
  if (DRY) return;
  await Bun.write(MANIFEST, JSON.stringify(manifest, null, 2));

  // ---------- report ----------
  console.log(`\n${pad("file", 38)} ${pad("before", 9)} ${pad("after", 9)} ${pad("pixels", 10)} ${pad("GPU est.", 9)} result`);
  for (const r of rows) {
    console.log(
      `${pad(r.outRel, 38)} ${pad(fmt(r.before), 9)} ${pad(fmt(r.after), 9)} ${pad(r.dim, 10)} ${pad(r.gpu ? fmt(r.gpu) : "", 9)} ${r.action}`
    );
  }
  const before = rows.reduce((n, r) => n + r.before, 0);
  const after = rows.reduce((n, r) => n + r.after, 0);
  const gpu = rows.reduce((n, r) => n + r.gpu, 0);
  console.log(`\nProcessed ${rows.length} file(s), skipped ${skipped} unchanged.`);
  console.log(`Total on disk: ${fmt(before)} -> ${fmt(after)}`);
  console.log(`Estimated GPU memory for all the textures above (if every one were loaded at once): ${fmt(gpu)}`);

  const renamed = rows.filter((r) => r.outRel !== r.rel);
  if (renamed.length) {
    console.log("\nFile names changed. Update these paths in your code:");
    for (const r of renamed) console.log(`  ${r.rel}  ->  ${r.outRel}`);
  }

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