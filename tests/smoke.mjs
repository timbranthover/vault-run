// Plays the real game in a headless browser against tests/server.mjs and fails on any page error.
// Covers: the home screen, a run through every zone (with the autopilot), the Other Side, the woods,
// the slide, the board, sharing, the challenge page, and the share card image.
import { chromium } from "playwright";
import fs from "fs";
import { server } from "./server.mjs";
const PORT = 8799, BASE = `http://localhost:${PORT}`, BOT = fs.readFileSync(new URL("./bot.js", import.meta.url), "utf8");
const exe = process.env.CHROMIUM;
await new Promise(r => server.listen(PORT, r));
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
let bad = 0; const fail = m => { console.error("FAIL", m); bad++ }, ok = m => console.log("ok  ", m);
for (const [name, opts] of [["phone", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ["desktop", { viewport: { width: 1366, height: 768 } }]]) {
  const ctx = await browser.newContext(opts), pg = await ctx.newPage(), errs = [];
  pg.on("pageerror", e => errs.push(String(e)));
  await pg.route("**/_vercel/insights/**", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
  await pg.goto(`${BASE}/run`); await pg.waitForTimeout(1200);
  if (await pg.evaluate("VKGame.state") !== "title") fail(`${name}: no home screen`); else ok(`${name}: home screen`);
  await pg.keyboard.press("Space"); await pg.waitForTimeout(200); await pg.evaluate(BOT);
  for (const [d, lap, vox] of [[100, 0, 0], [600, 0, 0], [1100, 0, 0], [1600, 0, 0], [1700, 0, 9], [3950, 1, 0], [4300, 2, 0]]) {
    await pg.evaluate(([d, l, v]) => { const G = VKGame._G; G.dist = d; G.lap = l; G.vox = v; G.grace = 1e9; if (v) VKGame._voxPrep() }, [d, lap, vox]);
    await pg.waitForTimeout(1500);
  }
  await pg.evaluate("VKGame._G.grace=1e9;window.dispatchEvent(new KeyboardEvent('keydown',{code:'ArrowDown',key:'ArrowDown',bubbles:true}))"); await pg.waitForTimeout(300);
  if (!(await pg.evaluate("VKGame._G.slide>0"))) fail(`${name}: slide did not start`); else ok(`${name}: ran every zone and slid`);
  await pg.evaluate("clearInterval(window.__bot);const G=VKGame._G;G.grace=0;G.shield=0;G.objs.push({t:'cab',v:'cab',lane:Math.round(G.x),z:1.5})"); await pg.waitForTimeout(3500);
  if (await pg.evaluate("VKGame.state") !== "over") fail(`${name}: crash did not end the run`); else ok(`${name}: game over`);
  const t = await pg.evaluate("VKGame._share()"); if (!/\/r\/\S+$/.test(t)) fail(`${name}: share text has no challenge link: ${t}`); else ok(`${name}: share text`);
  const code = t.trim().split("/r/")[1];
  await pg.goto(`${BASE}/r/${code}`); await pg.waitForTimeout(1200);
  if (await pg.evaluate("VKGame.state") !== "title") fail(`${name}: challenge page did not open the game`); else ok(`${name}: challenge page`);
  const img = await pg.evaluate(c => fetch("/api/card?c=" + c).then(r => r.headers.get("content-type")), code);
  if (img !== "image/png") fail(`${name}: share card is ${img}`); else ok(`${name}: share card`);
  if (errs.length) fail(`${name}: page errors: ${errs.join(" | ")}`); else ok(`${name}: no page errors`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(bad ? `${bad} failed` : "all smoke tests passed"); process.exit(bad ? 1 : 0);
