// Rescans docs/references/ and rewrites the picture list in index.html.
// Captions come from the "What it is" column of docs/references/CREDITS.md, if present.
// Run from anywhere: node tools/mood-board/update.mjs
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const refs = join(here, "../../docs/references");
const page = join(here, "index.html");

const files = readdirSync(refs)
  .filter((f) => /\.(jpe?g|png|gif|webp|avif|svg)$/i.test(f))
  .sort((a, b) => a.localeCompare(b));

// Table rows look like: | `file.jpg` | What it is | Source | License |
const captions = {};
const credits = join(refs, "CREDITS.md");
if (existsSync(credits)) {
  for (const line of readFileSync(credits, "utf8").split("\n")) {
    const m = line.match(/^\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|/);
    if (m) captions[m[1]] = m[2];
  }
}

const list = files
  .map((file) => "  " + JSON.stringify({ file, caption: captions[file] || "" }))
  .join(",\n");

const html = readFileSync(page, "utf8");
const updated = html.replace(
  /\/\* IMAGES:START \*\/[\s\S]*?\/\* IMAGES:END \*\//,
  `/* IMAGES:START */\nconst IMAGES = [\n${list}\n];\n/* IMAGES:END */`
);
writeFileSync(page, updated);
console.log(`Mood board now shows ${files.length} picture${files.length === 1 ? "" : "s"}.`);
