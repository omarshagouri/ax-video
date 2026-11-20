// Ensure every animation is self-contained and cleanly named, including additions.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const folder = join(root, "Animations");
const files = readdirSync(folder);
const named = files.filter((name) => /^VA_LF_\d{3}\.tsx$/.test(name)).sort();

assert(named.length >= 20, "The original twenty animations must stay available");
assert.deepEqual(named, Array.from({ length: named.length }, (_, i) =>
  `VA_LF_${String(i + 1).padStart(3, "0")}.tsx`));
assert.deepEqual(files.filter((name) => name.endsWith(".tsx")).sort(), named);

for (const name of named) {
  const id = name.slice(0, -4);
  const contents = readFileSync(join(folder, name), "utf8");
  assert(contents.includes(`id: "${id}"`), `${name}: missing exact ID`);
  assert.match(contents, /export const animation = /, `${name}: missing configuration`);
  assert.match(contents, /export const \w+Schema\s*=/, `${name}: missing schema`);
  assert.match(contents, /\bbackground:\s*"[^\"]+"/, `${name}: missing background`);
  assert.match(contents, /\/\*\* INPUTS:/, `${name}: missing input explanation`);
  assert.match(contents, /\/\*\* VISUAL:/, `${name}: missing visual explanation`);
  // Optional publisher-name policy can be supplied by CI without embedding names here.
  const forbidden = process.env.FORBIDDEN_PUBLIC_NAME;
  if (forbidden) assert(!contents.toLowerCase().includes(forbidden.toLowerCase()), `${name}: publisher name found`);
}

console.log(`PASS: ${named.length} named, documented, independently configured animation files`);
