// autopilot for tests and the preview video: steers to a lane with nothing tall ahead, jumps logs, slides under branches
window.__bot=setInterval(()=>{const G=VKGame._G;if(VKGame.state!=="run")return;
  const obs=G.objs.filter(o=>!o.dead&&(o.t==="cab"||o.t==="stack"||o.t==="sign")&&o.z>-.4&&o.z<18);
  const key=c=>window.dispatchEvent(new KeyboardEvent("keydown",{code:c,key:c,bubbles:true}));
  const danger=(L,zmax)=>obs.filter(o=>Math.round(o.lane)===L&&o.z<zmax);
  const cost=L=>danger(L,16).reduce((a,o)=>a+(o.t==="cab"?100/(o.z+1):8/(o.z+1)),0)+Math.abs(L-G.lane)*.6-(G.objs.some(o=>o.t==="key"&&!o.dead&&Math.round(o.lane)===L&&o.z<14&&o.z>0)?2:0);
  const best=[-1,0,1].filter(L=>Math.abs(L-G.lane)<=1).sort((a,b)=>cost(a)-cost(b))[0];
  if(best!==G.lane&&Math.abs(G.x-G.lane)<.25)key(best<G.lane?"ArrowLeft":"ArrowRight");
  for(const o of [...danger(Math.floor(G.x+.5),6.5),...danger(Math.ceil(G.x-.5),6.5)]){if(o.z<.25)continue;if(o.t==="stack"&&G.jy===0&&o.z<6&&o.z>3.6)key("ArrowUp");if(o.t==="sign"&&!(G.slide>0)&&o.z<4.5)key("ArrowDown");if(o.t==="cab"&&o.z<1.1)o.dead=1}
},20);
