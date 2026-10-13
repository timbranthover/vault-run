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
  // the room: in through the door in the mailroom, to the desk, and back out to the same run
  await pg.evaluate("clearInterval(window.__bot);const G=VKGame._G;G.lap=0;G.zone=0;G.vox=0;G.dist=420;G.lane=-1;G.x=-1;G.jy=0;G.grace=1e9;G.objs=G.objs.filter(o=>o.t==='key')");
  await pg.waitForFunction("440-VKGame._G.dist<2", null, { timeout: 8000, polling: 10 }); await pg.keyboard.press("ArrowLeft"); await pg.waitForTimeout(300);
  if (await pg.evaluate("VKGame.state") !== "room") fail(`${name}: the door did not open`);
  else { for (const k of ["ArrowUp", "ArrowUp"]) { await pg.keyboard.press(k); await pg.waitForTimeout(900) } await pg.waitForTimeout(4200);
    const know = await pg.evaluate("VKGame._R.know"); for (let i = 0; i < 3; i++) { await pg.keyboard.press("ArrowDown"); await pg.waitForTimeout(1100) } await pg.waitForTimeout(600);
    const back = await pg.evaluate("[VKGame.state,VKGame._G.objs.some(o=>o.z<12&&(o.t==='cab'||o.t==='stack'||o.t==='sign'))]");
    if (!know) fail(`${name}: no realization at the desk`); else if (back[0] !== "run" || back[1]) fail(`${name}: did not return safely to the run`); else ok(`${name}: the room, in and out`) }
  await pg.evaluate("clearInterval(window.__bot);const G=VKGame._G;G.grace=0;G.shield=0;G.boost=0;G.objs.push({t:'cab',v:'cab',lane:Math.round(G.x),z:1.5})"); await pg.waitForTimeout(3500);
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
