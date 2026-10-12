/* A shared run travels as a short code in the link: name, score, distance, whether it broke out, and a check
   so a mistyped or hand-edited link is simply ignored. The game builds it the same way (see shareCode in game.js). */
const SALT = "vr1|";
export function hsh(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function parse(c) {
  const m = /^([A-Z0-9_]{1,5})\.([0-9a-z]{1,6})\.([0-9a-z]{1,6})\.([wb])\.([0-9a-z]{2})$/.exec(String(c || ""));
  if (!m) return null;
  if ((hsh(SALT + m.slice(1, 5).join(".")) % 1296).toString(36).padStart(2, "0") !== m[5]) return null;
  const s = parseInt(m[2], 36), d = parseInt(m[3], 36);
  if (!(s >= 0 && s <= 5e6 && d >= 0 && d <= 2e6)) return null;
  return { n: m[1] === "_" ? "" : m[1], s, d, w: m[4] === "w", code: m[0] };
}
export const commas = v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
