// Drive RAF timestamps, not battery state. Screenshots are the real canvas UI.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
import {server} from './server.mjs';
const out=process.env.CAP_SCREENSHOTS;
if(out)fs.mkdirSync(out,{recursive:true});
await new Promise(r=>server.listen(8797,r));
const browser=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});
const iphone='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
async function page(opts){
 const ctx=await browser.newContext(opts),p=await ctx.newPage();
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));p.errors=errors;
 await p.route('**/_vercel/insights/**',r=>r.fulfill({body:''}));
 await p.addInitScript(()=>{let clock=100,id=0,q=new Map();Object.defineProperty(performance,'now',{value:()=>clock});window.requestAnimationFrame=f=>{q.set(++id,f);return id};window.cancelAnimationFrame=id=>q.delete(id);window.__tick=(ms,n)=>{for(let i=0;i<n;i++){clock+=ms;const todo=[...q.values()];q.clear();for(const f of todo)f(clock)}}});
 if(process.env.BASELINE_GAME)await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(process.env.BASELINE_GAME,'utf8')}));
 await p.goto('http://localhost:8797/run');await p.waitForFunction(()=>window.VKGame&&document.querySelector('.vkg'),null,{polling:20});
 await p.evaluate(()=>__tick(1000/60,40));await p.keyboard.press('ArrowLeft');
 return p;
}
const tick=(p,ms,n)=>p.evaluate(([ms,n])=>__tick(ms,n),[ms,n]);
const snap=async(p,name)=>{if(out)await p.screenshot({path:`${out}/${name}.png`})};
try{
 const p=await page({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,userAgent:iphone});
 await tick(p,1000/30,210);
 if(process.env.BASELINE_GAME){await snap(p,'phone-before');const d=await page({viewport:{width:1366,height:768}});await tick(d,1000/30,210);await snap(d,'desktop-before');console.log('baseline screenshots captured');}
 else{
 const hint=p.locator('.vkg-power');assert.equal(await hint.isVisible(),true,'iPhone cap hint visible');await snap(p,'phone-after');
 const box=await hint.boundingBox();assert(box.x>=0&&box.x+box.width<=390&&box.y+box.height<=844,'footer fits phone');
 await p.keyboard.press('Space');await tick(p,1000/30,1);assert.equal(await hint.isVisible(),false,'hidden during play');
 await p.evaluate(()=>{VKGame._G.grace=1e9;VKGame._room()});await tick(p,1000/30,1);assert.equal(await hint.isVisible(),false,'hidden in room');
 await p.keyboard.press('Escape');await tick(p,1000/30,210);assert.equal(await hint.isVisible(),true);await p.keyboard.press('h');await tick(p,1000/30,1);assert.equal(await hint.isVisible(),false,'hidden in help');await p.keyboard.press('h');await tick(p,1000/30,1);
 // Results footer, including a full high-score panel.
 await p.keyboard.press('Space');await p.evaluate(()=>{const G=VKGame._G;G.grace=G.shield=G.boost=0;G.objs=[{t:'cab',v:'cab',lane:0,z:1.5}]});await tick(p,1000/30,80);assert.equal(await p.evaluate(()=>VKGame.state),'over');await p.evaluate(()=>{VKGame._LB.top=Array.from({length:10},(_,i)=>({n:'TEST'+i,s:9000-i*100}));VKGame._G.ph='board';VKGame._draw()});await tick(p,1000/30,30);assert.equal(await hint.isVisible(),true);await snap(p,'phone-results');
 await p.evaluate(()=>{VKGame._G.ph='name';VKGame._draw()});await tick(p,1000/30,1);assert.equal(await hint.isVisible(),false,'hidden on initials entry');
 await p.evaluate(()=>{VKGame._G.ph='board'});await p.keyboard.press('Escape');await tick(p,1000/30,210);await tick(p,1000/60,300);assert.equal(await hint.isVisible(),false,'60 FPS recovery hides hint');await tick(p,1000/30,300);assert.equal(await hint.isVisible(),true);
 await p.getByRole('button',{name:'Dismiss performance tip'}).click();await tick(p,1000/30,300);assert.equal(await hint.isVisible(),false,'dismissal sticks');assert.equal(await p.evaluate(()=>VKGame.state),'title','dismiss must not start game');
 const small=await page({viewport:{width:320,height:568},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:iphone});await tick(small,1000/30,240);assert.equal(await small.locator('.vkg-power').isVisible(),false,'short view stays uncluttered');
 const desktop=await page({viewport:{width:1366,height:768}});await tick(desktop,1000/30,240);assert.equal(await desktop.locator('.vkg-power').count(),0,'desktop never prompts');await snap(desktop,'desktop-after');
 const android=await page({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'});await tick(android,1000/30,240);assert.equal(await android.locator('.vkg-power').count(),0,'Android never prompts');
 for(const pg of[p,small,desktop,android])assert.deepEqual(pg.errors,[]);
 console.log('frame-cap browser checks passed');
 }
}finally{await browser.close();await new Promise(r=>server.close(r))}
