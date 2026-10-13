// Conservative cap detection: synthetic timings test the inference, not an iOS battery API.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../public/game.js',import.meta.url),'utf8');
const factory=new Function(src.slice(src.indexOf('function frameCapMonitor('),src.indexOf('const CAP=frameCapMonitor('))+';return frameCapMonitor')();
function scenario(enabled=true){const m=factory(enabled);let t=100;return {m,feed(ms,n=240,mode='idle',visible=true){for(let i=0;i<n;i++){t+=typeof ms==='function'?ms(i):ms;m.sample(t,mode,visible)}}}}
for(const hz of [60,120]){const s=scenario();s.feed(1000/hz,1000);assert.equal(s.m.show,false,`${hz} FPS must not prompt`)}
let s=scenario();s.feed(1000/30,120);assert.equal(s.m.show,false,'short samples need more evidence');s.feed(i=>1000/30+(i%2?.8:-.8),120);assert.equal(s.m.show,true,'steady 30 FPS qualifies');s.feed(1000/60,300);assert.equal(s.m.show,false,'recovery clears the hint');
s=scenario();s.feed(i=>[16,50,20,47][i%4]);assert.equal(s.m.show,false,'uneven 30-ish FPS is not a cap');
s=scenario();s.feed(1000/30,240,'run');assert.equal(s.m.show,false,'slow gameplay alone is not enough');s.feed(1000/30,240);assert.equal(s.m.show,true);s.feed(1000/60,400,'run');assert.equal(s.m.show,false,'gameplay can establish recovery');
s=scenario();s.feed(1000/30,240,'idle',false);assert.equal(s.m.show,false,'background samples ignored');s.feed(1000/30,120);assert.equal(s.m.show,false,'return needs a fresh window');
s=scenario();s.feed(1000/30,240);s.m.reset();assert.equal(s.m.show,false,'visibility reset clears stale evidence');s.feed(1000/30,240);s.m.dismiss();s.feed(1000/30,300);s.m.reset();s.feed(1000/30,300);assert.equal(s.m.show,false,'dismissal survives resets for this visit');
s=scenario();s.feed(i=>i%50===0?250:1000/30,600);assert.equal(s.m.show,false,'repeated long stalls never qualify');
s=scenario(false);s.feed(1000/30,300);assert.equal(s.m.show,false,'non-iPhone disabled');
console.log('frame-cap timing checks passed');
