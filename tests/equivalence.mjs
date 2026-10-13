// Compare a cleanup with an explicit git baseline. No golden images to keep up to date.
// Usage: node tests/equivalence.mjs <base-commit>
// Same seed, clock, inputs and board; compare gameplay, sound events, analytics and canvas PNGs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {server} from './server.mjs';
const ref=process.argv[2];
assert(ref,'Pass the commit to compare against');
const base=execFileSync('git',['rev-parse','--verify',`${ref}^{commit}`],{encoding:'utf8'}).trim();
const read=(f,old)=>old?execFileSync('git',['show',`${base}:${f}`],{encoding:'utf8'}):fs.readFileSync(f,'utf8');
const hash=b=>createHash('sha256').update(b).digest('hex');
const bot=fs.readFileSync('tests/fairbot.js','utf8');
await new Promise(r=>server.listen(8796,r));
const browser=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});
async function run(old,opts,fps=false){
 const context=await browser.newContext(opts),p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{
  let seed=123456789,clock=100,id=0,q=new Map();
  Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  Object.defineProperty(performance,'now',{value:()=>clock});Date.now=()=>1800000000000+clock;
  window.requestAnimationFrame=f=>{q.set(++id,f);return id};window.cancelAnimationFrame=i=>q.delete(i);
  window.__tick=(ms,n)=>{for(let i=0;i<n;i++){clock+=ms;const a=[...q.values()];q.clear();for(const f of a)f(clock)}};
  window.__seed=()=>seed;window.__sfx=[];window.__events=[];window.va=(...a)=>__events.push(a);
 });
 await p.route('**/_vercel/insights/**',r=>r.fulfill({body:''}));
 await p.route('**/api/scores',r=>r.fulfill({json:{on:true,v:1,top:[{n:'TEST',s:80000}],cut:0,total:1}}));
 // Expose only internal telemetry buffers for this comparison, without shipping a new game API.
 await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:read('public/game.js',old).replace('window.VKGame={','window.__buffers=()=>[FT.length,FA.length];window.VKGame={')}));
 await p.goto(`http://localhost:8796/run${fps?'?fps':''}`);
 await p.waitForFunction(()=>window.VKGame,null,{polling:20});
 await p.evaluate(()=>__tick(1000/60,40));
 await p.waitForFunction(()=>VKGame._LB.on,null,{polling:20});
 const records=[],memory=[];
 async function snap(label){
  const v=await p.evaluate(()=>{
   VKGame._draw();const g=structuredClone(VKGame._G),r=structuredClone(VKGame._R);
   // Removed bookkeeping is deliberately excluded. Every still-referenced trail must match.
   const active=new Set(g.objs.filter(o=>o.t==='key').map(o=>String(o.tr)));
   g.trs=Object.fromEntries(Object.entries(g.trs).filter(([id])=>active.has(id)).map(([id,t])=>[id,{got:t.got,broken:t.broken}]));
   delete g.ms;delete g.frames;delete r.mg;
   return {g,r,seed:__seed(),sfx:__sfx,events:__events,png:document.querySelector('.vkg-c').toDataURL()};
  });
  records.push({label,...v,png:hash(v.png)});
 }
 const sprites=await p.evaluate(()=>Object.fromEntries(Object.entries(VKGame._SP).map(([k,imgs])=>[k,imgs.map(c=>c.toDataURL())])));
 records.push({label:'all sprite caches',hash:hash(JSON.stringify(sprites))});
 await snap('title');await p.evaluate(()=>__tick(1000/60,420));await snap('title board');
 await p.keyboard.press('h');await snap('help');await p.keyboard.press('h');await p.keyboard.press('Space');
 await p.evaluate(()=>{VKGame._G.grace=1e9});
 await p.evaluate(()=>__tick(1000/60,650));await snap('live frames and FPS telemetry');
 const buffers=await p.evaluate(()=>__buffers());
 if(!old){assert.equal(buffers[1],0,'telemetry samples released after reporting');assert.equal(buffers[0],fps?60:0,'rolling history only for FPS display')}
 // Full and partial trails: reclaiming storage must preserve streak rewards and penalties.
 for(const partial of[false,true]){
  await p.evaluate(()=>{VKGame._G.state='title'});await p.keyboard.press('Space');
  await p.evaluate(()=>{const g=VKGame._G;g.objs=Array.from({length:5},(_,i)=>({t:'key',lane:0,z:.2+i*1.5,tr:999999}));g.trs={999999:{got:0,broken:false,left:5}};g.next=1e9;g.grace=1e9;g.mult=2});
  await p.evaluate(()=>VKGame._step(1/60));
  if(partial){await p.keyboard.press('ArrowRight')}
  await p.evaluate(()=>{for(let i=0;i<180;i++)VKGame._step(1/60)});
  assert.equal(await p.evaluate(()=>VKGame._G.mult),partial?1:3);
  if(!old)assert.equal(await p.evaluate(()=>Object.keys(VKGame._G.trs).length),0,'finished trail reclaimed');
  await snap(partial?'partial trail':'full trail');
 }
 await p.evaluate(()=>{VKGame._G.state='title'});await p.keyboard.press('Space');await p.evaluate(bot);
 await p.evaluate(()=>{VKGame._G.grace=1e9});
 // A long run, with ordinary bot inputs and collision protection, checks accumulation past the woods.
 for(let i=0;i<25;i++){
  await p.evaluate(()=>{for(let j=0;j<1200;j++){VKGame._G.grace=1e9;__fair(1)}});
  assert.equal(await p.evaluate(()=>VKGame.state),'run');
  const counts=await p.evaluate(()=>({distance:Math.round(VKGame._G.dist),trails:Object.keys(VKGame._G.trs).length,keys:VKGame._G.objs.filter(o=>o.t==='key').length}));memory.push(counts);
  if(!old)assert(counts.trails<=counts.keys,'every retained trail has a key');
  await snap(`long run ${i}`);
 }
 assert(memory.at(-1).distance>10000,'long run actually passed 10 km');
 for(const d of[100,600,1100,1600,3950,4300,6600]){
  await p.evaluate(d=>{const g=VKGame._G;g.dist=d;g.zone=d>=4000?4:Math.floor(d/500)%4;g.zf=9;g.lap=Math.floor(d/2000);g.vox=0;g.vtr=0;g.brk=9},d);
  await snap(`zone at ${d}`);
 }
 await p.evaluate(()=>{const g=VKGame._G;g.zone=2;g.dist=1100;g.vox=9;VKGame._voxPrep()});await snap('Other Side');
 await p.evaluate(()=>{VKGame._G.vox=0;VKGame._room()});await p.evaluate(()=>__tick(1000/60,60));await snap('room entry');
 for(let i=0;i<2;i++){await p.keyboard.press('ArrowUp');await p.evaluate(()=>__tick(1000/60,60))}
 await p.evaluate(()=>__tick(1000/60,250));assert.equal(await p.evaluate(()=>VKGame._R.know),1);await snap('realization');
 for(let i=0;i<3;i++){await p.keyboard.press('ArrowDown');await p.evaluate(()=>__tick(1000/60,80))}
 assert.equal(await p.evaluate(()=>VKGame.state),'run');await snap('room exit');
 await p.keyboard.press('p');await snap('pause');await p.keyboard.press('p');
 await p.evaluate(()=>{const g=VKGame._G;g.grace=g.boost=g.shield=0;g.objs=[{t:'cab',v:'cab',lane:g.x,z:.2}]});
 await p.evaluate(()=>__tick(1000/60,180));await snap('game over');
 assert.deepEqual(errors,[]);await context.close();return{records,memory,buffers};
}
async function retryPages(){
 for(const path of['/run','/r/invalid']){
  const p=await browser.newPage();let attempts=0;
  await p.route('**/_vercel/insights/**',r=>r.fulfill({body:''}));
  await p.route('**/game.js*',r=>++attempts===1?r.abort():r.continue());
  await p.goto('http://localhost:8796'+path);await p.getByRole('button',{name:'TRY AGAIN'}).click();
  await p.waitForFunction(()=>window.VKGame&&VKGame.running,null,{polling:20});assert.equal(attempts,2);
  await p.evaluate(()=>VKGame.close());await p.waitForFunction(()=>VKGame.state==='closed',null,{polling:20});
  await p.evaluate(()=>VKGame.open());await p.waitForFunction(()=>VKGame.running,null,{polling:20});await p.close();
 }
 console.log('both page loaders recover from failure; close/reopen transitions pass');
}
try{
 for(const[name,opts]of[['phone',{viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true}],['desktop',{viewport:{width:1366,height:768}}]]){
  const before=await run(true,opts,name==='desktop'),after=await run(false,opts,name==='desktop');
  assert.deepEqual(after.records,before.records,`${name}: gameplay, pixels, audio events or analytics changed`);
  console.log(`${name}: ${after.records.length} identical checkpoints; ${after.memory.at(-1).distance} m: trail records ${before.memory.at(-1).trails} -> ${after.memory.at(-1).trails}; buffers ${before.buffers} -> ${after.buffers}`);
 }
 await retryPages();
}finally{await browser.close();await new Promise(r=>server.close(r))}
