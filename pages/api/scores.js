/* Vault Run: the all-time board.
   One small JSON file in Vercel Blob holds the top 100 runs. Views are answered from memory and the edge
   cache (see board() below); writing only happens when a run actually makes the board. Every write is
   conditional (ETag), so two people finishing at the same moment can't erase each other, and each
   board carries a version so a browser always keeps the newest one it has seen. */
import { get, head, put } from "@vercel/blob";

const PATH = "vault-run/board.json", KEEP = 100, SHOW = 10;
/* names are five arcade characters; a short list keeps the obvious ones off the wall */
const BAD = /(FUCK|FUK|FCK|SHIT|CUNT|DICK|PUSSY|TWAT|SLUT|WHORE|FAGG|NIGG|NIGA|NAZI|PENIS|VAGIN|JIZZ|PORN|KKK|HITLR|HITLE|RETARD|CHINK|BITCH|BTCH|WANK)/;
const BAD_WHOLE = new Set(["ASS", "ASSES", "FAG", "FAGS", "COCK", "COCKS", "RAPE", "RAPED", "RAPER", "CUM", "CUMS", "TITS", "TIT", "SEX", "ANUS", "ANAL", "SPIC", "KIKE", "GOOK", "PISS", "SHT", "DIK", "DICKS", "BOOBS", "HOE", "HOES", "PUSS", "SLUTS", "WHORE"]);
let ACCESS = null;

/* how this project reaches its store: newer stores connect by store ID (Vercel signs each request itself),
   older ones by a read-write key; either works, under whatever name Vercel gave it */
const ENV = process.env, KEYS = Object.keys(ENV);
const TOKEN = ENV.BLOB_READ_WRITE_TOKEN || Object.values(ENV).find(v => typeof v === "string" && v.startsWith("vercel_blob_rw_"));
const SK = KEYS.find(k => /STORE_ID$/.test(k) && /^store_/i.test(String(ENV[k]))), SID = ENV.BLOB_STORE_ID || (SK ? ENV[SK] : "");
const AUTH = TOKEN ? { token: TOKEN } : SID ? { storeId: SID } : {};
const on = () => !!(TOKEN || SID);
const clean = b => (Array.isArray(b) ? b : []).filter(e => e && typeof e.n === "string" && Number.isFinite(e.s)).slice(0, KEEP);
const order = (a, b) => b.s - a.s || a.t - b.t; /* ties go to whoever got there first */

async function access() {
  if (ACCESS) return ACCESS;
  try { const h = await head(PATH, AUTH); return (ACCESS = /\.private\./.test(h.url) ? "private" : "public"); }
  catch (e) { if (!/not.?found|does not exist/i.test(String(e && (e.name + e.message)))) throw e; }
  /* first run ever: the store's own setting decides which kind of write it accepts */
  for (const a of ["private", "public"]) {
    try { await put(PATH, JSON.stringify({ top: [] }), { ...AUTH, access: a, addRandomSuffix: false, allowOverwrite: false, contentType: "application/json", cacheControlMaxAge: 60 }); return (ACCESS = a); }
    catch (e) { if (/exist|precondition/i.test(String(e && (e.name + e.message)))) return access(); }
  }
  throw new Error("blob store not reachable");
}

async function load() {
  const a = await access();
  /* private reads skip the CDN; public ones get a cache-busting query so a write is seen at once */
  const target = a === "private" ? PATH : (await head(PATH, AUTH)).url + "?v=" + Date.now();
  const r = await get(target, { ...AUTH, access: a, useCache: false });
  if (!r || r.statusCode !== 200) return { top: [], u: 0, etag: null };
  /* a board that can't be read is never treated as empty, so it can never be written over */
  const j = JSON.parse(await new Response(r.stream).text());
  /* once the board passes about 1 KB the store sends it compressed and marks its tag weak (W/"..."); a write
     only accepts the plain tag, and the value inside is the same, so the mark is dropped */
  return { top: clean(j.top).sort(order), u: +j.u || 0, etag: String(r.blob.etag || "").replace(/^W\//, "") || null };
}

/* u is the board's version: the time of its last change, so a browser never swaps a newer board for an older copy */
async function save(top, u, etag) {
  const a = await access();
  const w = await put(PATH, JSON.stringify({ u, top }), { ...AUTH, access: a, addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 60, ...(etag ? { ifMatch: etag } : { allowOverwrite: false }) });
  return String((w && w.etag) || "").replace(/^W\//, "") || null;
}

/* The store's free allowance is 10,000 reads and 2,000 writes a month, and if either ran out the store would refuse
   saves too. So views never cost more than the allowance can bear, however many runs people play:
   - each server keeps the last board it saw and answers views from it; its own saves update it at once, so a score
     saved through the same server shows instantly, and one saved elsewhere within about 30 seconds;
   - it reads the store at most every 30 seconds, every 2 minutes after a busy hour, every 30 minutes after a very busy
     day: at most about 300 reads a day, under the month's allowance even if people never stop playing;
   - the edge cache in front answers repeat views for a few seconds without waking the server at all.
   Saves start from that copy; if someone else changed the board meanwhile the store refuses the write, and only then
   is the board read again (a save always may read). Nothing can be lost that way. */
let MEM = null;
const READS = [];
function gap() {
  const now = Date.now(); while (READS.length && now - READS[0] > 864e5) READS.shift();
  let hour = 0; for (let i = READS.length - 1; i >= 0 && now - READS[i] < 36e5; i--) hour++;
  return READS.length >= 250 ? 30 * 60e3 : hour >= 40 ? 2 * 60e3 : 30e3;
}
async function board(fresh) {
  if (!fresh && MEM && Date.now() - MEM.at < gap()) return MEM;
  try { const b = await load(); READS.push(Date.now()); return (MEM = { ...b, at: Date.now() }); }
  catch (e) { if (!fresh && MEM) return MEM; throw e; } /* the store unreachable: keep showing the last board */
}

const view = (top, u, extra) => ({ on: true, v: u, top: top.slice(0, SHOW).map(e => (e.w ? { n: e.n, s: e.s, w: 1 } : { n: e.n, s: e.s })), cut: top.length >= KEEP ? top[KEEP - 1].s : 0, total: top.length, ...extra });

/* a run can't score faster than the game allows; generous, so honest runs are never refused */
function plausible(s, ms, k) {
  if (!Number.isInteger(s) || s < 0 || s > 5e6) return false;
  if (!Number.isFinite(ms) || ms < 0) return false;
  const sec = ms / 1000;
  return s <= 60 + sec * 260 + (Number.isFinite(k) ? k : 0) * 120;
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (!on()) { res.setHeader("Cache-Control", "s-maxage=30"); return res.status(200).json({ on: false }); }
  try {
    if (req.method === "GET") {
      const { top, u } = await board(false);
      res.setHeader("Cache-Control", "public, s-maxage=3, stale-while-revalidate=10");
      return res.status(200).json(view(top, u));
    }
    if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ error: "method" }); }
    res.setHeader("Cache-Control", "no-store");
    let b = req.body;
    if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = {}; } }
    b = b || {};
    const n = String(b.n || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5), s = Number(b.s), ms = Number(b.ms), k = Number(b.k);
    const id = String(b.id || "").replace(/[^a-z0-9]/g, "").slice(0, 12);
    /* a run that broke out into the woods went 4,000 m at least: half that in points, and well over a minute */
    const w = b.w === 1 && s >= 2000 && ms >= 90000 ? 1 : 0;
    if (!n) return res.status(400).json({ error: "name" });
    if (BAD.test(n) || BAD_WHOLE.has(n)) return res.status(400).json({ error: "word" });
    if (!plausible(s, ms, k)) return res.status(400).json({ error: "score" });
    for (let tries = 0; tries < 6; tries++) {
      /* writes are the scarcer allowance, so a save checks the board first unless this server's copy is a few seconds old */
      const { top, u, etag } = await board(tries > 0 || !MEM || Date.now() - MEM.at > 10e3);
      /* the same run sent twice (a retry after a lost reply) is answered, not saved again */
      const dup = id ? top.findIndex(e => e.id === id) : -1;
      if (dup >= 0) return res.status(200).json(view(top, u, { rank: dup + 1, saved: true }));
      const t = Date.now(), row = { n, s, t, ...(id ? { id } : {}), ...(w ? { w } : {}) };
      const rank = 1 + top.filter(e => e.s > s || (e.s === s && e.t < t)).length;
      if (rank > KEEP) return res.status(200).json(view(top, u, { rank, saved: false }));
      const next = top.concat([row]).sort(order).slice(0, KEEP);
      const nu = Math.max(t, u + 1);
      try { const tag = await save(next, nu, etag); MEM = { top: next, u: nu, etag: tag, at: tag ? Date.now() : 0 }; return res.status(200).json(view(next, nu, { rank, saved: true })); }
      catch (e) { if (!/precondition|etag|412|exist/i.test(String(e && (e.name + e.message)))) throw e; await new Promise(r => setTimeout(r, 150 + tries * 150 + Math.random() * 300)); }
    }
    console.error("scores busy: six writes in a row lost to a newer board");/* never silent again */
    return res.status(503).json({ error: "busy" });
  } catch (e) {
    console.error("scores", e && e.message);
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).json({ on: true, error: "down" });
  }
}
