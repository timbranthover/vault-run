/* Vault Run sound. Everything is synthesised in the browser; nothing is downloaded.
   This file loads only when sound is switched on.
   Signal flow: voices -> effects / music / room-tone buses -> master -> gentle limiter -> speakers,
   with one shared reverb that the Other Side opens up. */
(()=>{"use strict";
if(window.VKAudio)return;

let C=null,OUT,LIM,SFX,MUS,DK,MF,tw=0,AMB,AF,HUM,REV,RET,NB,DH,amb=null,wind=null,drone=null,timer=0,OFF=false;
const S={state:"",zone:0,vox:false,sp:0,x:0,mult:1,slo:0,boost:false,night:0,door:0};
const mtof=m=>440*Math.pow(2,(m-69)/12),R=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.random()*a.length|0];

/* ---------- the mix ---------- */
function build(ctx){C=ctx;
  LIM=C.createDynamicsCompressor();LIM.threshold.value=-10;LIM.knee.value=6;LIM.ratio.value=8;LIM.attack.value=.002;LIM.release.value=.18;
  OUT=C.createGain();OUT.gain.value=.85;OUT.connect(LIM);LIM.connect(C.destination);
  SFX=C.createGain();SFX.connect(OUT);
  MF=C.createBiquadFilter();MF.type="lowpass";MF.frequency.value=18000;MF.Q.value=.6;
  MUS=C.createGain();MUS.gain.value=0;DK=C.createGain();MUS.connect(DK);DK.connect(MF);MF.connect(OUT);
  REV=C.createConvolver();REV.buffer=impulse(2.4,3);RET=C.createGain();RET.gain.value=.35;REV.connect(RET);RET.connect(OUT);
  NB=C.createBuffer(1,C.sampleRate*2,C.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  /* room tone: one quiet looping noise, coloured per zone */
  AF=C.createBiquadFilter();AF.type="bandpass";AF.frequency.value=500;AF.Q.value=.5;AMB=C.createGain();AMB.gain.value=0;AF.connect(AMB);AMB.connect(OUT);
  HUM=C.createGain();HUM.gain.value=0;HUM.connect(OUT);DH=C.createGain();DH.gain.value=0;DH.connect(OUT)}
function impulse(sec,decay){const sr=C.sampleRate,n=sr*sec|0,b=C.createBuffer(2,n,sr);
  for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);let lp=0;for(let i=0;i<n;i++){const t=i/n;lp+=((Math.random()*2-1)-lp)*(.35+.6*(1-t));d[i]=lp*Math.pow(1-t,decay)*Math.min(1,i/(sr*.008))}}return b}
function startLoops(t){
  amb=C.createBufferSource();amb.buffer=NB;amb.loop=true;amb.connect(AF);amb.start(t);
  for(const f of[50,100,150]){const o=C.createOscillator(),g=C.createGain();o.frequency.value=f;g.gain.value=f===50?1:f===100?.5:.2;o.connect(g);g.connect(HUM);o.start(t)}
  /* the hum behind the door in the mailroom: mains and a faint whine, nearly nothing until you're beside it */
  for(const[f,v]of[[120,1],[240,.55],[360,.25],[2960,.04]]){const o=C.createOscillator(),g=C.createGain();o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(DH);o.start(t)}}
/* the room that runs the game: fans, a low drone that beats against itself, the mains hum */
function droneOn(on,t){if(on&&!drone){const g=C.createGain();g.gain.value=.0001;g.gain.setTargetAtTime(1,t,.8);g.connect(OUT);
    const s=C.createBufferSource(),f=C.createBiquadFilter(),ng=C.createGain();s.buffer=NB;s.loop=true;f.type="bandpass";f.frequency.value=700;f.Q.value=.9;ng.gain.value=.022;s.connect(f);f.connect(ng);ng.connect(g);s.start(t);
    const os=[[55,.05],[55.6,.04],[110.3,.018],[164.8,.008],[1840,.0016]].map(([fr,v])=>{const o=C.createOscillator(),og=C.createGain();o.frequency.value=fr;og.gain.value=v;o.connect(og);og.connect(g);o.start(t);return o});
    const l=C.createOscillator(),lg=C.createGain();l.frequency.value=.09;lg.gain.value=180;l.connect(lg);lg.connect(f.frequency);l.start(t);drone={g,src:[s,l].concat(os)}}
  else if(!on&&drone){drone.g.gain.setTargetAtTime(.0001,t,.15);for(const n of drone.src)n.stop(t+.9);drone=null}}

/* ---------- voices ---------- */
function env(p,t,a,peak,d,h){p.value=0;p.setValueAtTime(.0001,t);/* silent until it starts: no stray click */p.linearRampToValueAtTime(peak,t+a);if(h)p.setValueAtTime(peak,t+a+h);p.exponentialRampToValueAtTime(.0001,t+a+(h||0)+d)}
/* 3D: on headphones a sound can sit in front, pass your ear, or circle your head (HRTF, the way 3D games do it) */
function place(m,o){const p=C.createPanner();p.panningModel="HRTF";p.distanceModel="inverse";p.refDistance=1.5;p.rolloffFactor=.5;
  const a=o.pos,b=o.pos1,t=o.pt||0,d=o.pd||.3;if(p.positionX){[p.positionX,p.positionY,p.positionZ].forEach((q,i)=>{q.setValueAtTime(a[i],t);if(b)q.linearRampToValueAtTime(b[i],t+d)});
    if(o.orbit)for(let k=1;k<=12;k++){const an=k/12*Math.PI*2*o.orbit,r=o.r||2;p.positionX.linearRampToValueAtTime(Math.sin(an)*r,t+d*k/12);p.positionZ.linearRampToValueAtTime(-Math.cos(an)*r,t+d*k/12)}}
  else p.setPosition(a[0],a[1],a[2]);m.connect(p);return p}
function duck(t,depth,len){const g=DK.gain;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(depth,t+.012);g.setTargetAtTime(1,t+.04,len||.12)}
function out(n,o){let m=n;if(o.pos&&C.createPanner)m=place(m,o);else if(o.pan&&C.createStereoPanner){const p=C.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,o.pan));m.connect(p);m=p}
  m.connect(o.bus||SFX);if(o.rv){const s=C.createGain();s.gain.value=o.rv;m.connect(s);s.connect(REV)}}
/* an oscillator with an envelope, optional pitch glide, filter and vibrato */
function tone(f,t,d,o){o=o||{};const s=C.createOscillator(),g=C.createGain(),a=o.a||.003;s.type=o.w||"sine";s.frequency.setValueAtTime(f,t);
  if(o.f1)s.frequency.exponentialRampToValueAtTime(o.f1,t+(o.fd||d));if(o.det)s.detune.value=o.det;
  if(o.vib){const l=C.createOscillator(),lg=C.createGain();l.frequency.value=o.vib;lg.gain.value=o.vd||f*.02;l.connect(lg);lg.connect(s.frequency);l.start(t);l.stop(t+a+(o.h||0)+d+.05)}
  env(g.gain,t,a,o.v||.1,d,o.h);s.connect(g);let n=g;
  if(o.lp){const fl=C.createBiquadFilter();fl.type="lowpass";fl.frequency.setValueAtTime(o.lp,t);if(o.lp1)fl.frequency.exponentialRampToValueAtTime(o.lp1,t+a+d);fl.Q.value=o.q||.8;g.connect(fl);n=fl}
  out(n,o);s.start(t);s.stop(t+a+(o.h||0)+d+.05)}
/* filtered noise: air, paper, impacts, cymbals */
function noise(t,d,o){o=o||{};const s=C.createBufferSource(),fl=C.createBiquadFilter(),g=C.createGain(),a=o.a||.001;s.buffer=NB;s.playbackRate.value=o.rate||1;
  fl.type=o.ft||"bandpass";fl.frequency.setValueAtTime(o.f||1200,t);if(o.f1)fl.frequency.exponentialRampToValueAtTime(o.f1,t+a+(o.h||0)+d);fl.Q.value=o.q||1;
  env(g.gain,t,a,o.v||.1,d,o.h);s.connect(fl);fl.connect(g);out(g,o);s.start(t,Math.random()*1.6);s.stop(t+a+(o.h||0)+d+.05)}
/* a small two-operator FM voice: electric piano, bells, glass */
function fm(f,t,d,o){o=o||{};const c=C.createOscillator(),m=C.createOscillator(),mg=C.createGain(),g=C.createGain(),a=o.a||.003;
  c.frequency.value=f;m.frequency.value=f*(o.ratio||2);mg.gain.setValueAtTime(f*(o.idx||1.5),t);mg.gain.exponentialRampToValueAtTime(f*.02+.01,t+(o.md||d*.5));
  m.connect(mg);mg.connect(c.frequency);env(g.gain,t,a,o.v||.08,d,o.h);c.connect(g);out(g,o);c.start(t);m.start(t);c.stop(t+a+(o.h||0)+d+.05);m.stop(t+a+(o.h||0)+d+.05)}
const bell=(f,t,v,o)=>{o=o||{};fm(f,t,.9,{v,ratio:3.5,idx:2.2,md:.12,pan:o.pan,rv:o.rv,bus:o.bus});tone(f*2,t,.35,{v:v*.35,pan:o.pan,rv:o.rv,bus:o.bus})};
const mallet=(f,t,v,o)=>{o=o||{};tone(f,t,.42,{v,pan:o.pan,rv:o.rv,bus:o.bus});tone(f*4,t,.05,{v:v*.35,pan:o.pan,bus:o.bus});tone(f*10.2,t,.012,{v:v*.12,pan:o.pan,bus:o.bus})};
const ep=(f,t,v,o)=>{o=o||{};fm(f,t,o.d||1.1,{v,ratio:1,idx:1.3,md:.35,pan:o.pan,rv:o.rv,bus:o.bus});fm(f*1.003,t,o.d||1.1,{v:v*.5,ratio:14,idx:.3,md:.04,pan:o.pan,bus:o.bus})};
const glass=(f,t,v,o)=>{o=o||{};tone(f,t,o.d||1.2,{v,pan:o.pan,rv:o.rv||.5,bus:o.bus});tone(f*2.002,t,(o.d||1.2)*.6,{v:v*.4,pan:-(o.pan||0),rv:o.rv||.5,bus:o.bus});tone(f*3.01,t,.2,{v:v*.15,bus:o.bus})};
const pluck=(f,t,v,o)=>{o=o||{};tone(f,t,.3,{w:"triangle",v,lp:4200,lp1:500,pan:o.pan,rv:o.rv,bus:o.bus});tone(f*.5,t,.2,{w:"sine",v:v*.4,bus:o.bus})};

/* ---------- music: a small band that plays a different tune in each part of the building ---------- */
/* chords: r = bass root, n = four chord tones (MIDI). arp/bass tokens per 16th: number or null. */
const _=null;
const TH={
  title:{bpm:84,ch:[{r:36,n:[60,64,67,71]},{r:33,n:[57,60,64,67]},{r:29,n:[57,60,64,65]},{r:31,n:[59,62,65,67]}],
    pad:.045,bass:[0,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],arp:[_,_,_,_,_,_,_,_,2,_,_,_,_,_,_,_],voice:"glass",oct:12,av:.035},
  mail:{bpm:118,ch:[{r:36,n:[60,64,67,71]},{r:33,n:[57,60,64,67]},{r:29,n:[57,60,64,65]},{r:31,n:[59,62,65,67]}],
    bass:[0,_,_,0,_,_,7,_,0,_,_,12,_,_,7,_],arp:[0,_,2,_,1,_,3,_,2,_,4,_,3,_,1,_],voice:"mallet",oct:12,av:.06,
    k:"x.......x.......",s:"....x.......x...",h:"..x...x...x...x.",h16:"x.x.x.x.x.x.x.x."},
  archive:{bpm:92,swing:.16,ch:[{r:33,n:[57,60,64,71]},{r:29,n:[57,60,64,65]},{r:38,n:[57,60,62,65]},{r:28,n:[56,59,62,64]}],
    pad:.03,bass:[0,_,_,_,_,_,_,7,_,_,0,_,_,_,_,_],arp:[_,_,0,_,_,_,2,_,_,_,1,_,_,_,3,_],voice:"ep",oct:0,av:.06,
    k:"x......x..x.....",s:"....x.......x...",h:"x.x.x.x.x.x.x.x.",hv:.5,h16:"xxxxxxxxxxxxxxxx"},
  lobby:{bpm:108,ch:[{r:29,n:[57,60,64,71]},{r:28,n:[55,59,62,64]},{r:26,n:[57,60,62,65]},{r:36,n:[55,59,64,67]}],
    bass:[0,_,_,_,4,_,_,_,7,_,_,_,9,_,_,_],arp:["c",_,_,1,_,_,"c",_,_,2,_,_,3,_,1,_],voice:"ep",oct:0,av:.055,
    k:"x.........x.....",s:"....x.......x...",h:"..x...x...x...xx",hv:.7,h16:"x.xxx.xxx.xxx.xx"},
  vault:{bpm:124,ch:[{r:38,n:[57,62,65,69]},{r:34,n:[58,62,65,70]},{r:31,n:[55,58,62,67]},{r:33,n:[57,61,64,69]}],
    bass:[0,0,_,0,0,_,0,_,0,0,_,0,0,_,7,_],arp:[0,_,_,1,_,_,2,_,0,_,_,1,_,3,_,2],voice:"pluck",oct:0,av:.06,
    k:"x..x..x.x..x..x.",s:"....x.......x..x",h:"x.x.x.x.x.x.x.x.",h16:"xxxxxxxxxxxxxxxx",tom:1},
  other:{bpm:118,ch:[{r:40,n:[64,68,71,75]},{r:37,n:[61,64,68,71]},{r:33,n:[61,64,68,71]},{r:35,n:[63,66,68,71]}],
    pad:.085,bass:[0,_,_,_,_,_,_,_,0,_,_,_,_,_,7,_],arp:[0,1,2,3,4,3,2,1,0,1,2,3,5,3,2,1],voice:"glass",oct:12,av:.1,
    k:"x.......x.......",s:"",h:"..x...x...x...x.",hv:.4,rv:.45},
  /* out in the woods: a picked guitar in G, brushed drums that rest at night */
  woods:{bpm:96,swing:.1,ch:[{r:31,n:[55,59,62,67]},{r:28,n:[55,59,64,67]},{r:36,n:[55,60,64,67]},{r:38,n:[54,57,62,66]}],
    pad:.022,bass:[0,_,_,_,_,_,7,_,0,_,_,_,12,_,7,_],arp:[0,_,2,1,_,3,2,_,0,_,2,1,_,3,4,_],voice:"pluck",oct:0,av:.075,rv:.22,
    k:"x.......x.......",s:"....x.......x...",h:"..x...x...x...x.",hv:.45,h16:"x.x.x.x.x.x.x.xx",soft:1}};
const MUSIC=["mail","archive","lobby","vault","woods"];
const M={cur:null,want:null,next:0,step:0,bar:0,vol:.36,int:0};
function bpm(th){return th.bpm*(M.cur==="title"||M.cur==="other"?1:1+.08*S.sp)}
function musicTo(name,now){M.want=name;if(now||!M.cur){M.cur=name;M.step=0;M.bar=0;if(C)M.next=Math.max(M.next,C.currentTime+.05)}}
function sched(ahead){if(!M.cur)return;const end=C.currentTime+ahead;
  while(M.next<end){const th=TH[M.cur],sd=60/bpm(th)/4,i=M.step%16;
    if(i===0&&M.want!==M.cur){M.cur=M.want;M.bar=0;if(!M.cur)return;continue}
    playStep(TH[M.cur],i,M.next+(i&1?(th.swing||0)*sd:0),sd);M.next+=sd;M.step++;if(M.step%16===0)M.bar++}}
/* one sixteenth note of the band; layers come in as the run heats up */
function playStep(th,i,t,sd){const ch=th.ch[M.bar%th.ch.length],hum=()=>R(-.004,.004),lvl=M.int,b=MUS,rv=th.rv||.12;
  t+=hum();
  if(i===0&&th.pad)for(const n of ch.n)for(const dt of[-7,7])tone(mtof(n),t,sd*16*.9,{w:"sawtooth",det:dt,v:th.pad,a:sd*4,lp:1100,bus:b,rv:.35,pan:dt/14});
  const bt=th.bass[i];if(bt!==null&&bt!==undefined){const f=mtof(ch.r+bt);tone(f,t,sd*1.7,{w:"triangle",v:.16,lp:700,bus:b});tone(f*.5,t,sd*1.4,{v:.12,bus:b})}
  if(lvl>=1||M.cur==="title"||M.cur==="other"){const a=th.arp[i];if(a!==null&&a!==undefined){const v=th.av*R(.85,1.1),pan=((i%4)-1.5)*.18;
    if(a==="c")for(const n of ch.n)ep(mtof(n+th.oct),t,v*.55,{bus:b,rv,d:.5});
    else{const f=mtof(ch.n[a%4]+12*(a/4|0)+th.oct);const V=th.voice;(V==="mallet"?mallet:V==="ep"?ep:V==="pluck"?pluck:glass)(f,t,v,{bus:b,rv,pan})}}}
  const hush=th.soft&&S.night>.6;/* the woods at night: no drums, just the guitar and the crickets */
  if(th.k&&th.k[i]==="x"&&!hush){if(th.tom&&i%8!==0)tone(110,t,.16,{f1:70,v:.16,bus:b});else{tone(140,t,.2,{f1:42,fd:.09,v:.34,bus:b});noise(t,.012,{ft:"highpass",f:3000,v:.03,bus:b})}}
  if(th.s&&th.s[i]==="x"&&!hush){if(th.soft)noise(t,.16,{f:2600,q:.6,v:.06,bus:b,rv:.25});/* a brush, not a snare */else{noise(t,.12,{f:1900,q:.8,v:.11,bus:b,rv:.2});tone(190,t,.05,{f1:160,v:.05,bus:b})}}
  const hp=lvl>=2&&th.h16?th.h16:th.h;if(hp&&hp[i]==="x"&&(lvl>=1||M.cur==="other"))noise(t,i%4===2?.05:.022,{ft:"highpass",f:7500,v:(i%4===2?.05:.03)*(th.hv||1),bus:b,pan:.25})}

/* ---------- footsteps: every floor sounds like what it is ---------- */
function step(side,t){const p=side?.14:-.14,z=S.vox?9:S.zone,v=.55+.45*S.sp;
  if(z===4){noise(t,.045,{f:R(2100,2900),q:.9,v:.05*v,pan:p});noise(t,.04,{ft:"lowpass",f:600,v:.05*v,pan:p});noise(t+R(.005,.02),.012,{ft:"highpass",f:R(3500,5000),v:.025*v,pan:p});return}/* leaves and dirt */
  if(z===9){const ch=TH.other.ch[M.bar%4],n=ch.n[(Math.random()*4)|0]+24;tone(mtof(n),t,.12,{v:.018*v,pan:p,rv:.4});noise(t,.02,{ft:"highpass",f:6000,v:.02*v,pan:p});return}
  if(z===0){noise(t,.035,{f:R(2200,2800),q:1.2,v:.05*v,pan:p});tone(R(110,130),t,.05,{f1:70,v:.05*v,pan:p})}/* vinyl tile */
  else if(z===1){noise(t,.05,{ft:"lowpass",f:R(700,900),v:.09*v,pan:p});tone(90,t,.06,{f1:55,v:.05*v,pan:p})}/* carpet */
  else if(z===2){noise(t,.025,{ft:"highpass",f:R(2600,3400),v:.06*v,pan:p,rv:.25});tone(R(1800,2100),t,.015,{v:.012*v,pan:p,rv:.2})}/* marble */
  else{noise(t,.03,{f:R(1500,1900),q:2,v:.05*v,pan:p});tone(R(1180,1240),t,.09,{v:.016*v,pan:p});tone(R(1720,1790),t,.07,{v:.011*v,pan:p})}}/* steel plate */
/* the chord the band is on, so pickups always sit in key */
function chordNow(){const th=TH[M.cur||MUSIC[S.zone]]||TH.mail;return th.ch[M.bar%th.ch.length]}
function paper(t,n,v,pan){for(let i=0;i<n;i++)noise(t+R(0,.22),R(.015,.04),{ft:"highpass",f:R(2500,5000),v:v*R(.5,1),pan:(pan||0)+R(-.3,.3)})}
function swell(t,d,up,v){noise(t,d,{ft:"bandpass",f:up?400:5000,f1:up?5000:400,q:.7,a:up?d*.9:.005,v:v||.12,rv:.4})}

/* ---------- every sound in the game ---------- */
const P={
  door:()=>{const t=now();noise(t,.7,{f:320,f1:760,q:7,a:.25,v:.05});tone(70,t+.55,.18,{f1:45,v:.2});noise(t+.55,.06,{ft:"lowpass",f:900,v:.12})},
  doorOut:()=>{const t=now();tone(68,t,.2,{f1:40,v:.18});noise(t,.05,{ft:"lowpass",f:800,v:.1})},
  relay:c=>{const t=now(),p=[-.6,.6,0,0][c]||0;noise(t,.012,{ft:"highpass",f:4000,v:.09,pan:p});tone(1400+c*90,t,.025,{v:.018,pan:p});tone(90,t+.004,.04,{f1:60,v:.06,pan:p})},
  rstep:x=>{const t=now();tone(95,t,.07,{f1:60,v:.08,pan:(x||0)*.3});noise(t,.03,{ft:"lowpass",f:600,v:.05,pan:(x||0)*.3})},
  replay:n=>{const t=now(),k=Math.min(90,Math.max(12,n|0));for(let i=0;i<k;i++){const u=i/k,tt=t+3.2*(1-Math.pow(1-u,1.6));noise(tt,.008,{ft:"highpass",f:R(3000,5500),v:.05*(.4+u),pan:R(-.8,.8)})}
    tone(55,t,3.2,{f1:82,a:2.6,v:.07,rv:.5})},
  know:()=>{const t=now();tone(41,t,3,{a:.4,v:.16,h:1});tone(61.7,t+.2,3,{a:.8,v:.06,h:.8,rv:.6});bell(mtof(69),t+.3,.025,{rv:.9});bell(mtof(64),t+1.6,.018,{rv:.9})},
  wait:()=>{const t=now();tone(880,t,.12,{v:.02,rv:.5});tone(880,t+.5,.12,{v:.012,rv:.5})},
  step:a=>step(a,now()),
  jump:()=>{const t=now();noise(t,.18,{f:500,f1:1900,q:.9,v:.16,pan:S.x*.3});tone(170,t,.12,{f1:360,v:.06,pan:S.x*.3})},
  land:()=>{const t=now();tone(115,t,.13,{f1:45,v:.22});step(0,t);step(1,t+.012)},
  slide:()=>{const t=now();noise(t,.32,{ft:"lowpass",f:2600,f1:300,v:.17,pan:S.x*.3});if(S.zone===3&&!S.vox)noise(t,.25,{f:3200,q:6,v:.02})},
  lane:d=>{const t=now();noise(t,.09,{f:900,f1:2400,q:1.1,a:.06,v:.2,pos:[d*.2,0,-.8],pos1:[d*1.8,0,.3],pt:t,pd:.15})},
  key:a=>{const t=now(),ch=chordNow(),i=a.i,n=ch.n[i%4]+24+(i>=4?12:0),f=mtof(n),pos=[S.x*1.2,.4,-1.2],pt=t;/* each key in a row climbs the chord the band is playing,
    a short pure ping just above the tune; the band leans back for a moment so it never smears */
    duck(t,.62,.1);
    if(S.vox){tone(f,t,.45,{v:.05,rv:.45,pos,pt});tone(f*2,t,.18,{v:.014,rv:.4,pos,pt});tone(f*3,t,.05,{v:.006})}
    else{tone(f,t,.22,{v:.055,rv:.08,pos,pt});tone(f*2,t,.07,{v:.012,pos,pt});noise(t,.008,{ft:"highpass",f:7000,v:.02,pos,pt})}},
  trail:m=>{const t=now(),ch=chordNow();duck(t,.55,.25);[0,1,2,3].forEach(j=>mallet(mtof(ch.n[j]+24),t+j*.045,.08,{pan:(j-1.5)*.25,rv:.25}));noise(t+.18,.6,{ft:"highpass",f:7000,v:.05,rv:.3})},
  near:s=>{const t=now(),o={pos:[s*1.5,.2,-3.5],pos1:[s*1.5,.2,3],pt:t,pd:.3};noise(t,.2,{f:2600,f1:600,q:1.1,a:.13,v:.4,...o});tone(200,t,.16,{f1:110,a:.12,v:.07,...o})},/* it rushes past your ear, front to behind */
  hit:()=>{const t=now();tone(105,t,.65,{f1:32,v:.5});noise(t,.28,{ft:"lowpass",f:4500,f1:700,v:.38});noise(t,.06,{ft:"highpass",f:2000,v:.2});paper(t+.03,8,.07);tapeStop(t)},
  smash:()=>{const t=now();noise(t,.14,{ft:"lowpass",f:3500,f1:900,v:.36,pos:[0,0,-1.5],pos1:[0,.5,2],pt:t,pd:.2});tone(230,t,.1,{f1:120,v:.14});paper(t,6,.09)},
  shred:()=>{const t=now();const o=C.createOscillator(),g=C.createGain(),am=C.createOscillator(),ag=C.createGain();o.type="sawtooth";o.frequency.value=62;am.frequency.value=38;ag.gain.value=.08;
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.09,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.35);am.connect(ag);ag.connect(g.gain);o.connect(g);out(g,{});o.start(t);am.start(t);o.stop(t+.4);am.stop(t+.4);paper(t,10,.08)},
  pu:k=>{const t=now(),ch=chordNow();[0,2,3].forEach((j,i)=>bell(mtof(ch.n[j]+24),t+i*.05,.035,{rv:.2}));
    if(k==="mag"){tone(220,t+.05,.5,{f1:660,v:.06,vib:9,vd:25,rv:.2});tone(1320,t+.4,.5,{v:.03,rv:.4})}
    else if(k==="boost"){noise(t,.6,{f:300,f1:3800,q:.8,a:.15,v:.17,pos:[0,0,-6],pos1:[0,.3,3],pt:t,pd:.7});tone(110,t,.5,{w:"sawtooth",f1:440,v:.04,lp:900})}
    else if(k==="shield"){noise(t+.05,.18,{f:2600,q:3,v:.06});tone(330,t+.05,.12,{w:"square",v:.025,lp:1500});tone(495,t+.14,.18,{w:"square",v:.025,lp:1500})}},
  boostEnd:()=>{const t=now();noise(t,.45,{f:3000,f1:300,q:.8,v:.18,pos:[0,0,2],pos1:[0,0,-4],pt:t,pd:.45})},
  vox:()=>{const t=now();swell(t,.38,true,.14);noise(t,1.3,{ft:"highpass",f:5000,a:.3,v:.07,pos:[0,.6,-2],pt:t,pd:1.3,orbit:1,r:2});tone(80,t+.3,.9,{f1:40,v:.3});const ch=TH.other.ch[0];
    ch.n.forEach((n,j)=>glass(mtof(n+12),t+.32+j*.035,.05,{pan:(j-1.5)*.4,rv:.7,d:2}));noise(t+.32,1.2,{ft:"highpass",f:8000,v:.035,rv:.6})},
  voxout:()=>{const t=now();swell(t,.3,false,.1);noise(t,.7,{ft:"highpass",f:5000,a:.1,v:.05,pos:[0,.6,-2],pt:t,pd:.7,orbit:-1,r:2});const ch=chordNow();[3,2,1,0].forEach((j,i)=>glass(mtof(ch.n[j]+12),t+i*.04,.035,{rv:.5,d:.8}));tone(60,t,.35,{f1:140,v:.12})},
  zone:z=>{const t=now();noise(t,.6,{ft:"lowpass",f:300,f1:3200,a:.2,v:.11,pos:[0,1.4,-5],pos1:[0,1.4,3],pt:t,pd:.6});/* the doorway passes over your head */const ch=TH[MUSIC[z]].ch[0];mallet(mtof(ch.n[0]+12),t+.18,.05,{rv:.3});mallet(mtof(ch.n[2]+12),t+.3,.05,{rv:.3})},
  /* the far wall gives, a little more each time: a crack from up ahead */
  crack:n=>{const t=now(),o={pos:[R(-1,1),.6,-9],pt:t},k=.6+.25*(n||1);noise(t,.035,{ft:"highpass",f:2400,v:.22*k,...o});tone(95,t,.18,{f1:48,v:.12*k,...o});for(let i=0;i<2+n*2;i++)noise(t+.04+R(0,.4),R(.01,.03),{f:R(900,2600),q:1.5,v:.05*k,...o})},
  /* breaking out: a boom, the wall coming down around you, then open air and birds */
  breakout:()=>{const t=now();duck(t,.05,.9);tone(55,t,1.3,{f1:26,v:.3});noise(t,.95,{ft:"lowpass",f:3200,f1:260,v:.26});noise(t,.05,{ft:"highpass",f:1800,v:.16});
    for(let i=0;i<22;i++){const a=R(0,6.28),r=R(1.2,3.5);noise(t+.05+R(0,1),R(.015,.05),{f:R(700,2600),q:1.4,v:R(.018,.045),pos:[Math.sin(a)*r,R(-.5,1),-Math.cos(a)*r],pt:t})}
    fm(70,t+.08,1.4,{ratio:2.76,idx:3,md:.5,v:.045});const ch=TH.woods.ch[0];ch.n.forEach((n,j)=>glass(mtof(n+12),t+.75+j*.06,.045,{pan:(j-1.5)*.4,rv:.7,d:2.2}));
    noise(t+.6,1.6,{ft:"bandpass",f:600,f1:900,q:.5,a:.8,v:.05,rv:.5});for(let i=0;i<4;i++)chirp(t+1+i*.35+R(0,.2));
    M.cur=M.want="woods";M.step=0;M.bar=0;M.next=t+1.35;MUS.gain.cancelScheduledValues(t);MUS.gain.setValueAtTime(MUS.gain.value,t);MUS.gain.linearRampToValueAtTime(.0001,t+.25);MUS.gain.setTargetAtTime(M.vol,t+1.3,.2)},
  deer:d=>{const t=now();for(let i=0;i<6;i++)noise(t+i*.11+R(0,.02),.03,{ft:"lowpass",f:900,v:.05,pos:[-d*4+d*i*1.5,0,-8],pt:t})},
  vault:()=>{const t=now();tone(41,t,1.6,{w:"sawtooth",a:1,v:.08,lp:140});noise(t,1.5,{ft:"lowpass",f:120,f1:500,a:1.1,v:.1,pos:[0,0,-9],pos1:[0,0,-1.5],pt:t,pd:1.5});tone(310,t+.6,.8,{f1:280,v:.02,vib:5,vd:4})},
  vaultOpen:()=>{const t=now();for(let i=0;i<3;i++){tone(75,t+i*.17,.2,{f1:40,v:.3});noise(t+i*.17,.12,{ft:"lowpass",f:900,v:.18})}
    for(let i=0;i<6;i++)tone(R(2200,3200),t+.5+i*.03,.04,{v:.02});const ch=TH.mail.ch[0];ch.n.forEach((n,j)=>ep(mtof(n+12),t+.62+j*.03,.05,{rv:.5,d:1.6}));
    [0,1,2,3].forEach(j=>bell(mtof(ch.n[j]+24),t+.9+j*.07,.04,{rv:.4}))},
  best:()=>{const t=now(),ch=chordNow();[0,1,2,3,0].forEach((j,i)=>mallet(mtof(ch.n[j]+12+(i===4?12:0)),t+i*.07,.06,{rv:.3}));noise(t+.3,.8,{ft:"highpass",f:7000,v:.035,rv:.4})},
  start:()=>{const t=now();noise(t,.3,{ft:"lowpass",f:400,f1:4000,a:.1,v:.07});mallet(mtof(67),t+.08,.06);mallet(mtof(72),t+.2,.07,{rv:.2})},
  over:nb=>{const t=now()+.05;if(nb){[60,64,67,72,76].forEach((n,i)=>mallet(mtof(n+12),t+i*.09,.06,{rv:.35}));noise(t+.4,1,{ft:"highpass",f:7000,v:.04,rv:.5})}
    else [67,63,60].forEach((n,i)=>ep(mtof(n),t+i*.16,.06,{rv:.3,d:i===2?1.4:.6}))},
  pause:()=>{const t=now();tone(660,t,.1,{f1:440,v:.1,w:"triangle"})},
  resume:()=>{const t=now();tone(440,t,.1,{f1:660,v:.1,w:"triangle"})},
  toggle:()=>{const t=now();bell(mtof(84),t,.05,{rv:.2});bell(mtof(91),t+.08,.04,{rv:.2})},
  open:()=>{const t=now();for(let i=0;i<14;i++)tone(R(1800,3600),t+i*.022,.025,{v:.035,pan:R(-.6,.6)});noise(t,.35,{ft:"lowpass",f:500,f1:3000,v:.09})},
  close:()=>{const t=now();for(let i=0;i<12;i++)tone(R(1400,2800),t+i*.02,.025,{v:.035,pan:R(-.6,.6)});noise(t,.3,{ft:"lowpass",f:3000,f1:400,v:.09})}};
let T0=0;const now=()=>OFF?T0:C.currentTime+.01;

/* the woods around you: birds by day; crickets and now and then an owl by night */
function chirp(t){const a=R(0,6.28),r=R(2,5),pos=[Math.sin(a)*r,R(.5,3),-Math.cos(a)*r],f=R(2600,4200),n=2+(Math.random()*3|0);
  for(let i=0;i<n;i++){const tt=t+i*R(.07,.11);tone(f*R(.95,1.1),tt,.05,{f1:f*R(1.2,1.4),fd:.045,v:.02,pos,pt:tt})}}
function crickets(t){const sd=Math.random()<.5?-1:1,pos=[sd*R(2,4),0,R(-3,1)];for(let i=0;i<3;i++)noise(t+i*.07,.03,{f:4600,q:9,v:.016,pos,pt:t})}
function owl(t){const pos=[R(-5,5),2.5,-7];tone(392,t,.28,{f1:370,v:.045,vib:6,vd:3,pos,pt:t,rv:.4});tone(370,t+.42,.42,{f1:345,v:.04,vib:6,vd:3,pos,pt:t+.42,rv:.4})}
/* on the Other Side small chimes ring out all around you: above, behind, off to one side */
function twinkle(t){const ch=TH.other.ch[M.bar%4],n=ch.n[(Math.random()*4)|0]+24+(Math.random()<.4?12:0),a=R(0,Math.PI*2),r=R(1.5,3.5),pos=[Math.sin(a)*r,R(-.2,1.8),-Math.cos(a)*r];
  tone(mtof(n),t,.6,{v:.018,rv:.5,pos,pt:t});tone(mtof(n)*2.01,t,.25,{v:.006,pos,pt:t})}
/* ---------- following the game ---------- */
function tapeStop(t){M.want=null;M.cur=null;MF.frequency.cancelScheduledValues(t);MF.frequency.setValueAtTime(MF.frequency.value,t);MF.frequency.exponentialRampToValueAtTime(160,t+.7);
  MUS.gain.cancelScheduledValues(t);MUS.gain.setValueAtTime(MUS.gain.value,t);MUS.gain.linearRampToValueAtTime(.0001,t+.8)}
function musicLevel(v,t,tc){MUS.gain.cancelScheduledValues(t);MUS.gain.setTargetAtTime(v,t,tc||.15)}
function filt(f,t,tc){MF.frequency.cancelScheduledValues(t);MF.frequency.setTargetAtTime(f,t,tc||.1)}
const AMBZ=[[480,.4,.012,0],[260,.3,.016,0],[1300,.25,.009,0],[180,.6,.016,.012],[700,.35,.014,0]];/* the last: wind in the trees */
function room(t){const a=S.vox?[7000,.4,.006,0]:AMBZ[S.zone];AF.type=S.vox?"highpass":"bandpass";AF.frequency.setTargetAtTime(a[0],t,.5);AF.Q.setTargetAtTime(a[1],t,.5);
  AMB.gain.setTargetAtTime(S.state==="room"?0:S.state==="run"||S.state==="title"?a[2]:a[2]*.4,t,.6);HUM.gain.setTargetAtTime(S.state==="run"?a[3]:0,t,.6)}
function windOn(on,t){if(on&&!wind){const s=C.createBufferSource(),f=C.createBiquadFilter(),g=C.createGain();s.buffer=NB;s.loop=true;f.type="bandpass";f.frequency.value=1100;f.Q.value=.6;g.gain.value=.0001;
    g.gain.setTargetAtTime(.07,t,.1);s.connect(f);f.connect(g);g.connect(SFX);s.start(t);wind={s,g,f}}
  else if(!on&&wind){wind.g.gain.setTargetAtTime(.0001,t,.08);wind.s.stop(t+.5);wind=null}}
function tick(s){if(!C||OFF)return;const t=C.currentTime,prev=S.state,pz=S.zone,pv=S.vox;Object.assign(S,s);
  if(S.state!==prev){
    if(S.state==="run"&&prev==="pause"){filt(18000,t,.08);musicLevel(M.vol,t)}
    else if(S.state==="run"){MF.frequency.cancelScheduledValues(t);MF.frequency.setValueAtTime(18000,t);musicTo(S.vox?"other":MUSIC[S.zone],true);musicLevel(M.vol,t,.05)}
    else if(S.state==="pause"){filt(650,t,.08);musicLevel(M.vol*.55,t)}
    else if(S.state==="title"){MF.frequency.setValueAtTime(18000,t);musicTo("title",true);musicLevel(M.vol*.8,t,.4)}
    else if(S.state==="room")tapeStop(t);
    droneOn(S.state==="room",t);
    room(t)}
  DH.gain.setTargetAtTime(S.state==="run"?S.door*.05:0,t,.12);
  if(S.state==="run"){
    if(S.vox!==pv){musicTo(S.vox?"other":MUSIC[S.zone],true);RET.gain.setTargetAtTime(S.vox?.75:.35,t,.3);room(t)}
    else if(S.zone!==pz){musicTo(MUSIC[S.zone]);room(t)}
    M.int=S.sp>.45||S.mult>=3?2:1;
    if(S.vox&&t>tw){tw=t+R(.5,1.1);twinkle(t+.02)}
    else if(S.zone===4&&!S.vox&&t>tw){if(S.night<.5){tw=t+R(1.4,3.6);chirp(t+.02)}else{tw=t+R(.8,1.5);crickets(t+.02);if(Math.random()<.06)owl(t+.3)}}
    if(S.slo>0)filt(1400,t,.05);else if(MF.frequency.value<17000&&prev==="run")filt(18000,t,.15);
    windOn(S.boost,t)}
  else windOn(false,t)}

/* ---------- plumbing ---------- */
function ensure(){if(C)return true;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;let c;try{c=new AC({latencyHint:"interactive"})}catch(e){try{c=new AC()}catch(e2){return false}}build(c)
  startLoops(C.currentTime);timer=setInterval(()=>{if(C.state==="running")sched(.15)},25);return true}
window.VKAudio={
  play(n,a){if(!ensure()||C.state!=="running")return;try{P[n]&&P[n](a)}catch(e){}},
  tick,
  unlock(){if(ensure()&&C.state!=="running")C.resume()},
  suspend(){if(C&&C.state==="running"){windOn(false,C.currentTime);C.suspend()}},
  /* for rendering previews offline: play a sound at a given time, or the band for a stretch */
  _offline(ctx){OFF=true;build(ctx);startLoops(0);MUS.gain.value=M.vol;return{
    at(t,n,a){T0=t;P[n]&&P[n](a)},set(o){Object.assign(S,o)},
    music(name,t0,t1,o){Object.assign(S,o||{});M.cur=M.want=name;M.step=0;M.bar=0;M.next=t0;M.int=(o&&o.int)||1;
      while(M.next<t1&&M.cur){const th=TH[M.cur],sd=60/bpm(th)/4,i=M.step%16;playStep(th,i,M.next+(i&1?(th.swing||0)*sd:0),sd);M.next+=sd;M.step++;if(M.step%16===0)M.bar++}},
    raw:{tone,noise,glass,bell,mallet,ep,fm,pluck},tape(t){tapeStop(t)},tw(t){twinkle(t)},wd(t,k){k==="b"?chirp(t):k==="c"?crickets(t):owl(t)},rev(v){RET.gain.value=v},amb(o){Object.assign(S,o);room(0)},drone(on,t){droneOn(on,t)},dh(v,t){DH.gain.setValueAtTime(v,t)}}}};
})();
