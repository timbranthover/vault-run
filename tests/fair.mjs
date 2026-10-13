// Is the hallway fair, and no easier than it was? Three checks:
// 1. Every room signature can always be got through moving at most one lane per beat, and every row has two things in it.
// 2. With signatures on, the hall is at least as full as pure random rows (the game must never get easier).
// 3. A fair autopilot (tests/fairbot.js: no invincibility, no cheating) plays whole runs and should reach the woods.
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
  for (const r of rows) if (r.length !== 3 || /[^CJS.kjs]/.test(r) || r.replace(/[.k]/g, "").length < 2) { console.error(`FAIL set "${name}": bad or sparse row "${r}"`); bad++ }
  let reach = new Set([-1, 0, 1].filter(L => pass(rows[0], L)));
  for (let i = 1; i < rows.length && reach.size; i++) { const nx = new Set(); for (const a of reach) for (const b of [a - 1, a, a + 1]) if (b >= -1 && b <= 1 && pass(rows[i], b)) nx.add(b); reach = nx }
  if (!reach.size) { console.error(`FAIL set "${name}" (room ${zi}) can't be got through`); bad++ }
}));
console.log(`${SETS.flat().length} room signatures checked`);
// 2. how full is the hall? Count obstacles per 100 m through all four rooms, with and without signatures
await pg.evaluate("window.requestAnimationFrame=()=>0");
const density = async noSets => { let n = 0, d = 0;
  for (let i = 0; i < 6; i++) n += await pg.evaluate(`(()=>{VKGame._G.state='title';window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true}));
    const G=VKGame._G;G.noSets=${noSets};const seen=new Set();let c=0;
    while(G.state==='run'&&G.dist<3900){G.grace=1e9;G.shield=0;G.boost=0;VKGame._step(1/60);for(const o of G.objs)if((o.t==='cab'||o.t==='stack'||o.t==='sign')&&!seen.has(o)&&G.dist>200){seen.add(o);c++}}
    G.noSets=0;return c})()`);
  return n / (6 * 37) };
const base = await density(1), withSets = await density(0);
console.log(`obstacles per 100 m: random only ${base.toFixed(1)}, with signatures ${withSets.toFixed(1)}`);
if (withSets < base * .98) { console.error("FAIL room signatures make the hall sparser than random"); bad++ }
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
