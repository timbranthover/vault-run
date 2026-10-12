// Fast checks that need no browser: every script parses, and the game stays small (it has to run on slow machines).
import fs from "fs";
const fail = m => { console.error("FAIL", m); process.exitCode = 1 };
for (const f of ["public/game.js", "public/audio.js"]) { try { new Function(fs.readFileSync(f, "utf8")) } catch (e) { fail(`${f} does not parse: ${e.message}`) } }
const BUDGET = { "public/game.js": 140_000, "public/audio.js": 40_000, "public/run.html": 8_000 };
for (const [f, max] of Object.entries(BUDGET)) { const n = fs.statSync(f).size; console.log(`${f} ${n} bytes (budget ${max})`); if (n > max) fail(`${f} is over its size budget`) }
const src = fs.readFileSync("public/game.js", "utf8");
if (/\\u[0-9a-fA-F]{4}/.test(src)) fail("public/game.js uses \\uXXXX escapes; write the character itself or \\u{...}");
for (const f of ["public/game.js", "public/run.html", "pages/api/r.js", "pages/api/card.js"]) if (/\bUBS\b|wealth management/i.test(fs.readFileSync(f, "utf8"))) fail(`${f} names a real firm`);
if (!process.exitCode) console.log("checks ok");
