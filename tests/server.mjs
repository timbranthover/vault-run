// A local stand-in for the live site: serves public/, the challenge pages and the share card from pages/api,
// and keeps an in-memory leaderboard instead of Vercel Blob. `npm run serve`, then open http://localhost:8787/run
// GET /fail?n=3 makes the next three score saves fail, to exercise the save queue.
import http from "http"; import fs from "fs"; import path from "path"; import url from "url";
const ROOT = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const rH = (await import(path.join(ROOT, "pages/api/r.js"))).default, cH = (await import(path.join(ROOT, "pages/api/card.js"))).default;
const PORT = +process.env.PORT || 8787;
let FAIL = 0; const board = { on: true, v: 1, top: [{ n: "BRANT", s: 81864, w: 1 }, { n: "BRANT", s: 61112 }, { n: "C0NN", s: 4957 }], cut: 0, total: 3 };
const TYPES = { ".js": "application/javascript", ".html": "text/html; charset=utf-8", ".png": "image/png", ".json": "application/json" };
const wrap = res => { res.status = c => (res.statusCode = c, res); res.json = j => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(j)); }; res.send = b => res.end(b); return res; };
export const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); wrap(res);
  if (u.pathname.startsWith("/r/")) return rH({ query: { c: u.pathname.slice(3) }, headers: { host: req.headers.host } }, res);
  if (u.pathname === "/api/card") return cH({ query: { c: u.searchParams.get("c") } }, res);
  if (u.pathname === "/fail") { FAIL = +u.searchParams.get("n"); return res.json({ FAIL }); }
  if (u.pathname === "/api/scores") {
    if (req.method !== "POST") return res.json(board);
    if (FAIL > 0) { FAIL--; res.statusCode = 503; return res.json({ error: "down", on: true }); }
    let b = ""; req.on("data", d => b += d); req.on("end", () => { const j = JSON.parse(b);
      board.top.push({ n: j.n, s: j.s, ...(j.w ? { w: 1 } : {}) }); board.top.sort((a, c) => c.s - a.s); board.total++; board.v++;
      res.json({ ...board, rank: board.top.findIndex(e => e.n === j.n && e.s === j.s) + 1, saved: true }) });
    return;
  }
  const f = path.join(ROOT, "public", u.pathname === "/" || u.pathname === "/run" ? "run.html" : path.normalize(u.pathname));
  if (!f.startsWith(path.join(ROOT, "public"))) { res.statusCode = 403; return res.end(); }
  fs.readFile(f, (e, d) => { if (e) { res.statusCode = 404; return res.end("not found"); } res.setHeader("Content-Type", TYPES[path.extname(f)] || "application/octet-stream"); res.end(d) });
});
if (import.meta.url === url.pathToFileURL(process.argv[1]).href) server.listen(PORT, () => console.log(`Vault Run on http://localhost:${PORT}/run`));
