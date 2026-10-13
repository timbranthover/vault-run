/* A challenge link, /r/<code>: the standalone game page, but it unfurls into a picture of the run
   ("BRANT RAN 12,480 / CAN YOU BEAT IT?") and the game opens as a challenge against that run.
   Plain HTML from a tiny function, cached at the edge; no framework code is sent to the phone. */
import { parse, commas } from "../../lib/code.js";

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export function page(run, origin) {
  const who = run ? run.n || "A friend" : "", sc = run ? commas(run.s) : "";
  /* the line under the picture in a chat: short, and a reason to tap */
  const title = run ? (run.w ? `${who} ran ${sc} and escaped the building. Can you?` : `${who} ran ${sc}. Think you can beat it?`) : "Vault Run";
  const desc = run ? "A tiny running game. One tap to play." : "A tiny running game. Collect keys, dodge the paperwork.";
  const img = run ? `${origin}/api/card?c=${encodeURIComponent(run.code)}` : `${origin}/run-og.png`, w = run ? 1200 : 600, h = run ? 630 : 315;
  const url = run ? `${origin}/r/${run.code}` : `${origin}/run`;
  const ch = run ? `<script>window.VK_CH=${JSON.stringify({ n: run.n, s: run.s, d: run.d, w: run.w ? 1 : 0 })}</script>\n` : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<base href="/">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Vault Run">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="${w}">
<meta property="og:image:height" content="${h}">
<meta property="og:image:alt" content="${esc(run ? title : "Vault Run: a pixel runner collecting red keys down an office hallway")}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
<link rel="apple-touch-icon" href="run-icon.png">
<meta name="theme-color" content="#F7F6F2">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 11 11' shape-rendering='crispEdges'%3E%3Cpath fill='%23E60000' d='M1 3h3v1H1zM0 4h2v3H0zM3 4h8v1H3zM3 6h8v1H3zM1 7h3v1H1zM8 5h1v3H8zM10 5h1v2h-1z'/%3E%3C/svg%3E">
<style>
html,body{margin:0;height:100%;background:#F7F6F2;color:#1d1d1d;font:600 15px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
main[hidden]{display:none}main{min-height:100%;display:grid;place-items:center;padding:24px;box-sizing:border-box}
.card{background:#fff;border:2px solid #1d1d1d;box-shadow:5px 5px 0 #CDC8B7;padding:30px 34px;text-align:center;max-width:340px}
.card h1{margin:0 0 6px;font-size:30px;letter-spacing:.06em}
.card p{margin:0 0 22px;color:#75746B;font-weight:500}
.card .ch{color:#1d1d1d;font-weight:600;margin:0 0 4px}.card .ch b{display:block;font-size:30px;letter-spacing:.04em}.card .red{color:#E60000;margin:0 0 22px}
#play{font:inherit;font-size:16px;letter-spacing:.08em;background:#1d1d1d;color:#fff;border:0;padding:12px 26px;cursor:pointer;box-shadow:3px 3px 0 #CDC8B7}
#play:hover{background:#E60000}#play:focus-visible{outline:3px solid #1e4a8666;outline-offset:3px}
.card svg{display:block;margin:0 auto 14px}
</style>
<script>
/* visits and a few game moments, counted by the site's own Vercel Web Analytics; each challenge link counts as one page */
window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};
window.va("beforeSend",function(e){if(e&&e.url)e.url=e.url.replace(/\\/r\\/[^?#]*/,"/r/challenge");return e});
</script>
<script defer src="/_vercel/insights/script.js"></script>
</head>
<body>
<main hidden>
  <div class="card">
    <svg width="66" height="18" viewBox="0 0 11 3" shape-rendering="crispEdges" aria-hidden="true"><path fill="#E60000" d="M1 0h3v1H1zM0 1h2v1H0zM3 1h8v1H3zM1 2h3v1H1zM8 2h1v1H8zM10 2h1v1h-1z"/></svg>
    <h1>VAULT RUN</h1>
${run ? `    <p class="ch">${esc(who.toUpperCase())} RAN<b>${sc}</b></p>\n    <p class="red">${run.w ? "AND ESCAPED. CAN YOU?" : "CAN YOU BEAT IT?"}</p>\n    <button id="play" type="button">TAKE THE CHALLENGE</button>` : `    <p>Collect keys. Dodge the paperwork.</p>\n    <button id="play" type="button">PLAY</button>`}
  </div>
</main>
${ch}<script>
(function(){
  var btn=document.getElementById("play"),loading=false;
  window.VK_HOME=1;/* the standalone page: the game is the whole page, with its own HOW TO PLAY and INVITE buttons */
  function play(){
    if(window.VKGame)return window.VKGame.open();
    if(loading)return;loading=true;
    var s=document.createElement("script");s.src="game.js?v=1";
    s.onload=function(){loading=false;window.VKGame.open()};
    s.onerror=function(){loading=false;btn.textContent="TRY AGAIN";document.querySelector("main").hidden=false};/* the card only shows if the game could not load */
    document.head.appendChild(s);
  }
  btn.onclick=function(){play()};

  play();
})();
</script>
</body>
</html>
`;
}
export default function handler(req, res) {
  const run = parse(req.query.c), host = req.headers["x-forwarded-host"] || req.headers.host || "the-model-run.vercel.app";
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=31536000, stale-while-revalidate=604800");
  res.status(200).send(page(run, "https://" + host));
}
