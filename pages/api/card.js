/* The picture a shared link unfurls into: the run being bragged about, filling the whole preview, drawn in the
   game's own 3x5 pixel font. Made on demand in a few milliseconds, then cached for good at the edge (a code
   always draws the same picture). No storage is touched. */
import zlib from "zlib";
import { parse, commas } from "../../lib/code.js";

const F = {A:"010101111101101",B:"110101110101110",C:"011100100100011",D:"110101101101110",E:"111100110100111",F:"111100110100100",G:"011100101101011",H:"101101111101101",I:"111010010010111",J:"001001001101010",K:"101101110101101",L:"100100100100111",M:"101111111101101",N:"110101101101101",O:"010101101101010",P:"110101110100100",Q:"010101101110011",R:"110101110101101",S:"011100010001110",T:"111010010010010",U:"101101101101111",V:"101101101101010",W:"101101111111101",X:"101101010101101",Y:"101101010010010",Z:"111001010100111",
  "0":"111101101101111","1":"010110010010111","2":"110001010100111","3":"110001010001110","4":"101101111001001","5":"111100110001110","6":"011100111101111","7":"111001010010010","8":"111101111101111","9":"111101111001110",
  ".":"000000000000010",",":"000000000010100","?":"110001010000010","!":"010010010000010"};
const C = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const INK = C("#1D1D1D"), RED = C("#E60000"), MUTE = C("#75746B"), LINE = C("#CDC8B7"), PAPER = C("#F7F6F2"), WHITE = C("#FFFFFF");
/* the route strip: one block per 500 m, coloured like the place it passed through */
const ZC = [C("#9EA8B1"), C("#B08A5A"), C("#4972AC"), C("#E2C06A")], DAY = C("#6E9A6A"), NIGHT = C("#2E476B");
const W = 600, H = 315, BRK = 4000;

function crcTable() { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; }
const CRC = crcTable(), crc = b => { let c = -1; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(t, d) { const l = Buffer.alloc(4), tc = Buffer.concat([Buffer.from(t, "latin1"), d]), cr = Buffer.alloc(4); l.writeUInt32BE(d.length); cr.writeUInt32BE(crc(tc)); return Buffer.concat([l, tc, cr]); }
function png(px, w, h, k) { /* k: whole-pixel upscale, so it stays crisp at 1200 x 630 */
  const W2 = w * k, H2 = h * k, raw = Buffer.alloc((W2 * 3 + 1) * H2);
  for (let y = 0; y < H2; y++) { const o = y * (W2 * 3 + 1), sy = (y / k) | 0; raw[o] = 0; for (let x = 0; x < W2; x++) px.copy(raw, o + 1 + x * 3, (sy * w + ((x / k) | 0)) * 3, (sy * w + ((x / k) | 0)) * 3 + 3); }
  const hd = Buffer.alloc(13); hd.writeUInt32BE(W2, 0); hd.writeUInt32BE(H2, 4); hd[8] = 8; hd[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", hd), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}
export function draw(run) {
  /* the whole picture is the score: a big white card in the game's style, nothing else competing for the eye */
  const px = Buffer.alloc(W * H * 3);
  const rect = (x, y, w, h, c) => { x = Math.round(x); y = Math.round(y); for (let j = Math.max(0, y); j < Math.min(H, y + h); j++) for (let i = Math.max(0, x); i < Math.min(W, x + w); i++) { const o = (j * W + i) * 3; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; } };
  const tw = (s, k) => s.length * 4 * k - k;
  const text = (s, x, y, k, c) => { for (let n = 0; n < s.length; n++) { const g = F[s[n]]; if (g) for (let i = 0; i < 15; i++) if (g[i] === "1") rect(x + n * 4 * k + (i % 3) * k, y + ((i / 3) | 0) * k, k, k, c); } };
  const mid = W / 2, ctr = (s, y, k, c) => text(s, Math.round(mid - tw(s, k) / 2), y, k, c);
  const art = (rows, x, y, k, pal) => rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== ".") rect(x + i * k, y + j * k, k, k, pal[ch]); }));
  const KEY = [".###.......", "##.########", ".###....#.#"], PINE = ["..e..", ".eee.", "..e..", ".eee.", "eEeEe", "..h..", "..h.."];
  const GP = { e: C("#6E9A6A"), E: C("#4F7A54"), h: C("#9B7653") };
  rect(0, 0, W, H, PAPER);
  rect(16, 16, W - 26, H - 26, LINE); rect(10, 10, W - 26, H - 26, INK); rect(13, 13, W - 32, H - 32, WHITE);
  /* the woods: a line of pines along the bottom, for runs that broke out (a hint for those who never have) */
  if (run.w) for (let x = 22; x < W - 40; x += 26) art(PINE, x + (x * 7 % 9), H - 22 - 7 * 4 - (x * 13 % 3) * 2, 4, GP);
  else for (let x = 40, i = 0; x < W - 70; x += 60, i++) art(KEY, x, H - 48 + Math.round(Math.sin(i * 1.3) * 4), 3, { "#": RED }); /* the trail of keys from the hallway */
  /* header: the red key and the name of the game */
  const hk = 3, hw = 11 * hk + 8 + tw("VAULT RUN", 2), hx = Math.round(mid - hw / 2);
  art(KEY, hx, 32, hk, { "#": RED }); text("VAULT RUN", hx + 11 * hk + 8, 32, 2, INK);
  ctr((run.n || "A FRIEND") + " RAN", 66, 4, MUTE);
  const sc = commas(run.s), k = Math.min(14, Math.floor(540 / (sc.length * 4 - 1)));
  ctr(sc, 96 + Math.round((14 - k) * 2.5), k, INK);
  ctr(run.w ? "AND ESCAPED. CAN YOU?" : "CAN YOU BEAT IT?", 186, 4, RED);
  /* the route: 500 m a block, building then woods (day or night), ending where it crashed */
  const segs = []; for (let a = 0; a <= run.d; a += 500) { if (a >= BRK) { const t = ((a + 250 - BRK) % 4800 + 4800) % 4800; segs.push(t > 2000 && t < 4000 ? NIGHT : DAY); } else segs.push(ZC[Math.floor(a / 500) % 4]); }
  let show = segs; if (segs.length > 26) { const head = segs.slice(0, 8), tail = segs.slice(8), out = []; for (let i = 0; i < 18; i++) out.push(tail[Math.floor(i * tail.length / 18)]); show = head.concat(out); }
  const bw = Math.min(18, Math.floor(400 / show.length)) - 3, total = show.length * (bw + 3) + 12, rx = Math.round(mid - total / 2), ry = run.w ? 222 : 232;
  show.forEach((c, i) => rect(rx + i * (bw + 3), ry, bw, 10, c));
  const ex = rx + show.length * (bw + 3) + 2; for (let i = 0; i < 5; i++) { rect(ex + i * 2, ry + i * 2, 2, 2, RED); rect(ex + 8 - i * 2, ry + i * 2, 2, 2, RED); }
  return png(px, W, H, 2);
}
export default function handler(req, res) {
  const run = parse(req.query.c);
  if (!run) { res.setHeader("Cache-Control", "public, s-maxage=3600"); res.writeHead(302, { Location: "/run-og.png" }); return res.end(); }
  const b = draw(run);
  res.setHeader("Content-Type", "image/png"); res.setHeader("Content-Length", b.length);
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=31536000, immutable");
  res.end(b);
}
