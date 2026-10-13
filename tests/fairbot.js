// A fair autopilot for testing: no invincibility, no deleting obstacles. It reads the rows ahead, picks a lane with a
// short lookahead, and jumps or slides with ordinary timing. If it can't get through, a person can't either.
window.__fair = function (steps, live) {
  const G = VKGame._G, key = c => window.dispatchEvent(new KeyboardEvent("keydown", { code: c, key: c, bubbles: true }));
  const H = 1 / 60;
  for (let s = 0; s < steps && VKGame._G.state === "run"; s++) {
    const v = G.speed * (G.boost > 0 ? 1.55 : 1);
    // rows ahead: obstacles grouped by distance
    const obs = G.objs.filter(o => !o.dead && (o.t === "cab" || o.t === "stack" || o.t === "sign") && o.z > -0.5 && o.z < 40).sort((a, b) => a.z - b.z);
    const rows = []; for (const o of obs) { const r = rows.find(r => Math.abs(r.z - o.z) < 1.2); if (r) r[Math.round(o.lane)] = o.t; else rows.push({ z: o.z, [Math.round(o.lane)]: o.t }) }
    const cost = (r, L) => r[L] === "cab" ? 1e6 : r[L] ? 1 : 0;
    const keyAt = L => G.objs.some(o => o.t === "key" && !o.dead && Math.round(o.lane) === L && o.z > 0 && o.z < 10) ? -0.4 : 0;
    // best lane for the next three rows (one lane per row at most)
    const R = rows.slice(0, 3); let best = Math.round(G.lane), bc = 1e9;
    if (R.length) for (const a of [-1, 0, 1]) {
      if (Math.abs(a - G.lane) > 2) continue; let c = cost(R[0], a) + Math.abs(a - G.lane) * .3 + keyAt(a);
      if (R[1]) { let m = 1e9; for (const b of [-1, 0, 1]) if (Math.abs(b - a) <= 1) { let c2 = cost(R[1], b) + Math.abs(b - a) * .3; if (R[2]) { let m3 = 1e9; for (const d of [-1, 0, 1]) if (Math.abs(d - b) <= 1) m3 = Math.min(m3, cost(R[2], d)); c2 += m3 * .5 } m = Math.min(m, c2) } c += m * .8 }
      if (c < bc) { bc = c; best = a }
    }
    if (best !== G.lane) key(best < G.lane ? "ArrowLeft" : "ArrowRight");
    // jump or slide for whatever is in this lane, timed to its arrival
    const here = obs.find(o => Math.round(o.lane) === Math.round(G.lane) && o.z > 0.2);
    if (here && Math.abs(G.x - G.lane) < .3) {
      const t = here.z / v;
      if (here.t === "stack" && G.jy === 0 && t < 0.3 && t > 0.12) key("ArrowUp");
      if (here.t === "sign" && !(G.slide > 0.12) && t < 0.32) key("ArrowDown");
    }
    if (live) break;
    VKGame._step(H);
  }
  return { state: G.state, dist: Math.round(G.dist), zone: G.zone, lap: G.lap };
};
