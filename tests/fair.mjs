// Is the hallway fair? Two checks:
// 1. Every set piece can always be got through moving at most one lane per beat (and none is a wall of tall things).
// 2. A fair autopilot (tests/fairbot.js: no invincibility, no cheating) plays whole runs and should reach the woods.
import { chromium } from "playwright";
import fs from "fs";
import { server } from "./server.mjs";
const PORT = 8798, RUNS = +process.env.RUNS || 12, BOT = fs.readFileSync(new URL("./fairbot.js", import.meta.url), "utf8");
await new Promise(r => server.listen(PORT, r));
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const pg = await browser.newPage({ viewport: { width: 390, height: 844 } });
await pg.route("**/_vercel/insights/**", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
await pg.goto(`http://localhost:${PORT}/run`); await pg.waitForTimeout(800);
let bad = 0;
// 1. static check of every set piece
const SETS = await pg.evaluate("VKGame._SETS");
const pass = (r, L) => r[L + 1] !== "C";
SETS.forEach((room, zi) => room.forEach(([tier, name, rows]) => {
  for (const r of rows) if (r.length !== 3 || /[^CJS.kjs]/.test(r)) { console.error(`FAIL set "${name}": bad row "${r}"`); bad++ }
  let reach = new Set([-1, 0, 1].filter(L => pass(rows[0], L)));
  for (let i = 1; i < rows.length && reach.size; i++) { const nx = new Set(); for (const a of reach) for (const b of [a - 1, a, a + 1]) if (b >= -1 && b <= 1 && pass(rows[i], b)) nx.add(b); reach = nx }
  if (!reach.size) { console.error(`FAIL set "${name}" (room ${zi}) can't be got through`); bad++ }
}));
console.log(`${SETS.flat().length} set pieces checked`);
// 2. fair autopilot
await pg.evaluate(BOT); const res = [];
for (let i = 0; i < RUNS; i++) {
  await pg.evaluate("VKGame._G.state='title';window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true}))");
  await pg.evaluate("window.cancelAnimationFrame&&0;window.requestAnimationFrame=()=>0;const G=VKGame._G;G.next=0");
  let r; for (let k = 0; k < 40; k++) { r = await pg.evaluate("__fair(1200)"); if (r.state !== "run" || r.dist > 4300) break }
  res.push(r.dist); console.log(`run ${i + 1}: ${r.state === "run" ? "still running" : "crashed"} at ${r.dist} m (room ${r.zone}, lap ${r.lap})`);
}
const reached = res.filter(d => d >= 4000).length;
console.log(`fair autopilot reached the woods in ${reached} of ${RUNS} runs`);
if (reached < Math.ceil(RUNS * .5)) { console.error("FAIL the fair autopilot rarely gets through: the hallway may be unfair"); bad++ }
await browser.close(); server.close(); process.exit(bad ? 1 : 0);
