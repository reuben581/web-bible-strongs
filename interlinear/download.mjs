// download_pdfs.mjs
// Node 18+ (uses global fetch). Run: node download.mjs --start 0 --end 5 --min 1000 --max 3000 --out downloads

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const args = Object.fromEntries(
    process.argv.slice(2).reduce((acc, arg) => {
      const m = arg.match(/^--([^=]+)=(.*)$/);
      if (m) acc.push([m[1], m[2]]);
      else if (arg.startsWith("--")) acc.push([arg.slice(2), "true"]);
      return acc;
    }, [])
  );

  const required = ["start", "end"];
  for (const k of required) {
    if (!(k in args)) {
      console.error(`Missing --${k}. Usage example:
  node download.mjs --start 0 --end 5 --min 1000 --max 3000 --out pdfs
`);
      process.exit(1);
    }
  }

  const start = Number(args.start);
  const end = Number(args.end);
  const min = args.min !== undefined ? Number(args.min) : 1200;
  const max = args.max !== undefined ? Number(args.max) : 3200;
  const out = args.out || "downloads";
  const force = args.force === "true" || args.force === "1";
  const retries = args.retries !== undefined ? Number(args.retries) : 3;
  const timeoutMs = args.timeout !== undefined ? Number(args.timeout) : 30000;

  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start) {
    console.error(`Invalid --start/--end. They must be integers with end >= start.`);
    process.exit(1);
  }
  if (!(min >= 0 && max >= min)) {
    console.error(`Invalid --min/--max. Ensure 0 <= min <= max.`);
    process.exit(1);
  }
  return { start, end, min, max, out, force, retries, timeoutMs };
}

function randDelay(min, max) {
  const delta = max - min;
  return min + Math.floor(Math.random() * (delta + 1));
}

async function readJsonArray(filePath) {
  const buf = await fsp.readFile(filePath);
  const data = JSON.parse(buf.toString());
  if (!Array.isArray(data)) throw new Error("files.json must contain a JSON array of URLs.");
  return data;
}

function filenameFromUrl(u, fallbackPrefix = "file") {
  try {
    const url = new URL(u);
    const base = path.basename(url.pathname) || `${fallbackPrefix}.pdf`;
    // Ensure .pdf extension
    return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
  } catch {
    // If not a valid URL
    return `${fallbackPrefix}.pdf`;
  }
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function fetchWithTimeout(url, opts = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function downloadOne(url, destPath, { retries, timeoutMs }) {
  let attempt = 0;
  let lastErr;
  while (attempt <= retries) {
    try {
      const res = await fetchWithTimeout(url, { redirect: "follow" }, timeoutMs);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      // Try to extract filename from Content-Disposition if present
      let finalDest = destPath;
      const cd = res.headers.get("content-disposition");
      if (cd) {
        const m = cd.match(/filename\*?=(?:UTF-8''|")?([^";\n]+)/i);
        if (m) {
          const suggested = decodeURIComponent(m[1].replace(/"/g, ""));
          if (suggested) {
            const safe = suggested.replace(/[\/\\?%*:|"<>]/g, "_");
            finalDest = path.join(path.dirname(destPath), safe);
          }
        }
      }

      await pipeline(res.body, fs.createWriteStream(finalDest));
      return finalDest;
    } catch (err) {
      lastErr = err;
      attempt++;
      if (attempt <= retries) {
        const backoff = 500 * attempt + Math.floor(Math.random() * 500);
        console.warn(`Retry ${attempt}/${retries} for ${url} in ${backoff}ms due to: ${err}`);
        await sleep(backoff);
      }
    }
  }
  throw lastErr;
}

async function main() {
  const { start, end, min, max, out, force, retries, timeoutMs } = parseArgs();
  const filesPath = path.join(__dirname, "chapters.json");
  const urls = await readJsonArray(filesPath);

  if (start >= urls.length) {
    console.error(`--start (${start}) is >= array length (${urls.length}).`);
    process.exit(1);
  }
  const last = Math.min(end, urls.length - 1);
  const slice = urls.slice(start, last + 1);

  await ensureDir(out);

  console.log(
    `Downloading ${slice.length} file(s) [indices ${start}..${last}] to "${out}" with ${min}-${max}ms random delays`
  );

  for (let i = 0; i < slice.length; i++) {
    const idx = start + i;
    const url = slice[i];
    const name = filenameFromUrl(url, `file_${idx}`);
    const dest = path.join(out, name);

    if (!force) {
      try {
        const stat = await fsp.stat(dest);
        if (stat.size > 0) {
          console.log(`[${i + 1}/${slice.length}] Skipping (exists): ${name}`);
          const wait = randDelay(min, max);
          await sleep(wait);
          continue;
        }
      } catch {
        // not exists -> proceed
      }
    }

    console.log(`[${i + 1}/${slice.length}] Downloading: ${url}`);
    try {
      const savedAs = await downloadOne(url, dest, { retries, timeoutMs });
      console.log(`    ✓ Saved: ${path.relative(process.cwd(), savedAs)}`);
    } catch (err) {
      console.error(`    ✗ Failed: ${url}\n      Reason: ${err?.message || err}`);
    }

    const wait = randDelay(min, max);
    console.log(`    …waiting ${wait}ms before next download`);
    await sleep(wait);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
