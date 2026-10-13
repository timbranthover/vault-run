/* Vault Run: a small hidden game. In Robert's messages, send "game".
   This file loads only then. While the game is closed, nothing of it runs.
   Everything draws into a small canvas (about 320x180) that the browser scales up,
   so it stays light on slow machines. */
(()=>{"use strict";
if(window.VKGame)return;

/* ---------- look ---------- */
const INK="#1d1d1d",PAPER="#F7F6F2",FLOOR="#EFEDE5",ENDWALL="#E9E6DD",SEAM="#E0DDD1",LINE="#CDC8B7",LAMP="#E4E1D6",DUST="#C4BCA6",RED="#E60000",MUTE="#75746B",WHITE="#FFFFFF";
const PAL={k:INK,w:WHITE,s:"#EBC8A6",n:"#2E476B",y:"#E2C06A",G:"#E9E6DD",g:"#BDB8A6",r:RED,p:"#4972AC",l:"#DCD8CB",m:"#CBD1D6",M:"#9EA8B1",t:"#D9C9A3",T:"#B9A06F",b:"#B08A5A",B:"#6E5336",c:"#F3E3B0",d:"#7C8791",Y:"#B8923A",q:"#BFD0E6",
  e:"#6E9A6A",E:"#4F7A54",v:"#A9C59A",h:"#9B7653",H:"#6B4F38",o:"#C9CCC4",O:"#979E97",u:"#EAD8AF",a:"#C49A68",f:"#2F8F4E",i:"#B98D63",j:"#F4EFE3",z:"#F0388C",
  L:"#F7907F",V:"#A50E26",P:"#93B7E3",F:"#F39A2B",A:"#FFF0B0",N:"#8A4630",U:"#B66A42",C:"#E2EEF8",W:"#3C9A5A"};
const REDUCED=matchMedia("(prefers-reduced-motion: reduce)").matches;
const TOUCH=matchMedia("(pointer: coarse)").matches;

/* ---------- tuning ---------- */
const STREAK_M=150,SLO=.75,VTR=.55,D=6,FAR=64,SPAWN=62,V0=13,VMAX=27,ACC=0.011,GRAV=760,JUMP_V=230,FALL_V=420,SLIDE_T=0.62,CLEAR=18,P0=2,WX=1.85,SIGN_UP=27,BOIL=0.16,CELL=10;
let SS=2,UC=2,CPX=1,HS=4;/* canvas pixels per world pixel, and per pixel of on-screen text */

/* ---------- zones: every 500 m the hallway changes; the vault door opens at 2,000 m, then it loops ---------- */
const ZL=500,VWALL="#D3D8DC",ZONES=[
  {n:"MAILROOM",wall:"#F7F6F2",floor:"#EFEDE5",end:"#E9E6DD",seam:"#E0DDD1",line:"#CDC8B7",lamp:"#E4E1D6",d:"mail",w:[.42,.72]},
  {n:"ARCHIVE",wall:"#F5F1E7",floor:"#EAE3D2",end:"#E3DAC5",seam:"#DCD2BB",line:"#C8BB9C",lamp:"#E9E0CA",d:"shelf",w:[.3,.75]},
  {n:"LOBBY",wall:"#F6F7F7",floor:"#EDEFF0",end:"#E2E6E9",seam:"#DADFE3",line:"#C2C9CF",lamp:"#E5E9ED",d:"art",w:[.34,.56]},
  {n:"VAULT",wall:"#EEF0F2",floor:"#E3E6E9",end:"#D8DDE1",seam:"#D1D7DC",line:"#B4BCC3",lamp:"#F0DFA6",d:"steel",w:[.5,.76]}];

/* ---------- 3x5 pixel font ---------- */
const F={A:"010101111101101",B:"110101110101110",C:"011100100100011",D:"110101101101110",E:"111100110100111",F:"111100110100100",G:"011100101101011",H:"101101111101101",I:"111010010010111",J:"001001001101010",K:"101101110101101",L:"100100100100111",M:"101111111101101",N:"110101101101101",O:"010101101101010",P:"110101110100100",Q:"010101101110011",R:"110101110101101",S:"011100010001110",T:"111010010010010",U:"101101101101111",V:"101101101101010",W:"101101111111101",X:"101101010101101",Y:"101101010010010",Z:"111001010100111",
"0":"111101101101111","1":"010110010010111","2":"110001010100111","3":"110001010001110","4":"101101111001001","5":"111100110001110","6":"011100111101111","7":"111001010010010","8":"111101111101111","9":"111101111001110",
".":"000000000000010",",":"000000000010100",":":"000010000010000","!":"010010010000010","'":"010010000000000","-":"000000111000000","+":"000010111010000",">":"100010001010100","<":"001010100010001","#":"101111101111101","?":"110001010000010","/":"001001010100100","_":"000000000000111"};

/* ---------- sprites (drawn as text; outlines are added by code, a little wobbly) ---------- */
/* the courier: white shirt, sleeves rolled, a red strap across his back to the bag at his hip; arms swing as he runs */
const TOP=["....kkkk....","...kkkkkk...","..skkkkkks..","...kkkkkk...","....kkkk....",".....ss.....",".wwrwwwwwww.","w.wrrwwwww.w","w.wwrrwwww.w","s.wwwrrwww.s","s.wwwwrrrrrs","...dddddVyr.","...dddddrrr."];
const RUN_A=["....kkkk....","...kkkkkk...","..skkkkkks..","...kkkkkk...","....kkkk....",".....ss.....",".wwrwwwwwww.","w.wrrwwwww.w","s.wwrrwwww.w","s.wwwrrwww.w","..wwwwrrrrrs","...dddddVyrs","...dddddrrr.","...dd..dd...","...kk..dd...",".......kk..."];
const RUN_B=["....kkkk....","...kkkkkk...","..skkkkkks..","...kkkkkk...","....kkkk....",".....ss.....",".wwrwwwwwww.","w.wrrwwwww.w","w.wwrrwwww.s","w.wwwrrwww.s","s.wwwwrrrrr.","s..dddddVyr.","...dddddrrr.","...dd..dd...","...dd..kk...","...kk......."];
const JUMP=["....kkkk....","...kkkkkk...","..skkkkkks..","...kkkkkk...","s...kkkk...s","w....ss....w","wwwrwwwwwwww","..wrrwwwww..","..wwrrwwww..","..wwwrrwww..","..wwwwrrrrr.","...dddddVyr.","...dddddrrr.","...dd..dd...","...kk..kk...","............"];
const IDLE=["....kkkk....","...kkkkkk...","..skkkkkks..","...kkkkkk...","....kkkk....",".....ss.....",".wwrwwwwwww.","w.wrrwwwww.w","w.wwrrwwww.w","s.wwwrrwww.s","s.wwwwrrrrrs","...dddddVyr.","...dddddrrr.","...dd..dd...","...dd..dd...","...kk..kk..."];
/* the slide: drop, skid (two frames that shake), get up */
const SLD0=["....kkkk....","...kkkkkk...","..skkkkkks..","...kkkkkk...","..wrwwwwww..","w.wrrwwwww.w","s.wwwrrrrr.s","..ddddddVyr.",".dddd..dddd.",".dd......dd.",".kk......kk."];
const SLD1=["....kkkk....","...kkkkkk...","..skkkkkks..","s..kkkkkk..s","w...wssw...w","wwwwrwwwwwww","..wwwrrwwww.","..wwwwwrrrrr","..ddddddddVy",".ddddddddddr",".MMk....kMM."];
const SLD2=["....kkkk....","...kkkkkk...","..skkkkkks..","...kkkkkk...","s...wssw...s","wwwwrwwwwwww","..wwwrrwwwww","..wwwwwrrrrr","..dddddddddV",".ddddddddddr",".MMk....kMM."];
const SLIDE=["....kkkk....","...kkkkkk...","..skkkkkks..",".wwrwwwwwww.","wwwwrrwwwwww","swwwwwrrrrws",".dddddddddd.",".dddd..dddd.",".kk......kk."];
/* facing you: on the way out of the room. The second set is after he knows: eyes on you, a flat mouth */
const mir=r=>r.split("").reverse().join(""),FH=k=>["....kkkk....","...kkkkkk...","..kkkkkkkk..",k?"...sdssds...":"...ssssss...",k?"...wksskw...":"...skssks...",k?"....sdds....":"....ssss...."];
const FRONT=k=>FH(k).concat(IDLE.slice(5).map(mir)),FWA=k=>FH(k).concat(RUN_A.slice(5).map(mir)),FWB=k=>FH(k).concat(RUN_B.slice(5).map(mir));
/* a look back over his shoulder */
const GLANCE=["....kkkk....","...kkkkkk...","...kkkkkkkk.","...kkkswks..","....kkssss.."].concat(IDLE.slice(5));
/* the filing cabinet: brass label holders, and the day's paperwork piled on top in a red folder */
const CAB=(()=>{const gap="kkkkkkkkkkkkkk",D=lab=>["GGGGGGGGGGGGGg","GGGGywwwwyGGGg","GGGGy"+lab+"yGGGg","GGGGGkkkkGGGGg","GGGGGGGGGGGGGg"];
  return["....wwwwww....","...Mwwwwwww...","..rrrrrrrrrr..","gggggggggggggg"].concat(D("MMMw"),[gap],D("MMww"),[gap],D("MMMM"),["g............g"])})();
const KEY=[".rrr.......","rr.rrrrrrrr",".rrr....r.r"];
const KEYG=KEY.map(r=>r.replace(/r/g,"z"));/* keys turn pink on the Other Side, where they count double (not gold: the vault's gold bars are gold) */
const SHADOW=["...llllllll...",".llllllllllll.","...llllllll..."];
function label(word,col){const w=word.length*4+1,rows=[];for(let r=0;r<7;r++){let s="";for(let c=0;c<w;c++){let ch="w";if(r>0&&r<6&&c>0){const i=(c-1)>>2,cc=(c-1)&3;if(cc<3&&F[word[i]]&&F[word[i]][(r-1)*3+cc]==="1")ch=col}s+=ch}rows.push(s)}return rows}
/* the vault door: a steel wheel with spokes, bolts and a brass hub; and the ring it sits in */
const disc=(N,f)=>{const c=(N-1)/2,r=[];for(let y=0;y<N;y++){let s="";for(let x=0;x<N;x++)s+=f(Math.hypot(x-c,y-c),Math.atan2(y-c,x-c),x-c,y-c);r.push(s)}return r};
const DOOR=disc(31,(d,a,x,y)=>{if(d>15.2)return".";if(d<2.6)return"y";if(d<10.5&&[0,1.0472,2.0944].some(t=>Math.abs(x*Math.sin(t)-y*Math.cos(t))<.75))return"k";
  if(Math.abs(d-12.3)<.8&&Math.abs(a/(Math.PI/6)-Math.round(a/(Math.PI/6)))<.13)return"k";return d>13.6?"M":"m"});
const RING=disc(37,d=>d>15.6&&d<=18.2?"M":".");

/* power-ups: Master Key (pulls keys in), Fast Pass (dash through anything), Shredder (survive one crash) */
const PU_MAG=[".yyyy.........","yy..yy........","y....yyyyyyyyy","yy..yy...y.y.y",".yyyy....y.y.."];
const PU_BST=["pppppppppppppp","pwwwwwwwwwwwwp","pwrwwrwwkkkkwp","pwwrwwrwwwwwwp","pwrwwrwwkkkwwp","pwwwwwwwwwwwwp","pppppppppppppp"];
const PU_SHR=["gggggggggggg","gGGGGGGGGGGg","gGGrrGGGGGGg","gGGGGGGGGGGg","gkkkkkkkkkkg",".w.w.w.w.w..",".w.w.w.w.w..",".w...w.w...."];
const grid0=(w,h,f)=>{const r=[];for(let y=0;y<h;y++){let t="";for(let x=0;x<w;x++)t+=f(x,y)||".";r.push(t)}return r};
const PU_VOX=grid0(11,11,(x,y)=>x<=7&&y>=3?((y===4&&x>=1&&x<=2)||(x===1&&y===5)?"w":"p"):y<3&&x>=3-y&&x<=10-y?"q":x>=8&&y>=11-x&&y<=18-x?"n":"");
const PU={mag:{name:"MASTER KEY",dur:9,sp:"pmag"},boost:{name:"FAST PASS",dur:4.5,sp:"pbst"},shield:{name:"SHREDDER",dur:0,sp:"pshr"},vox:{name:"OTHER SIDE",dur:20,sp:"pvox"}};

/* ---------- obstacles: three kinds in every zone, each drawn for its place.
   dodge = tall, change lane   jump = low, hop over it   slide = hangs overhead, duck under it ---------- */
const grid=(w,h,f)=>{const r=[];for(let y=0;y<h;y++){let s="";for(let x=0;x<w;x++)s+=f(x,y)||".";r.push(s)}return r};
const BOOKS=[[[2,4,"r"],[1,3,"p"],[2,4,"W"],[1,4,"n"],[2,3,"t"],[1,4,"p"],[2,4,"r"],[1,3,"c"]],[[1,4,"n"],[2,4,"c"],[2,3,"r"],[1,4,"t"],[2,4,"p"],[1,3,"n"],[2,4,"c"],[1,4,"r"]],[[2,3,"t"],[1,4,"p"],[1,4,"r"],[2,4,"F"],[2,3,"n"],[1,4,"t"],[2,4,"p"],[1,3,"c"]],[[3,4,"T"],[3,4,"t"],[2,4,"c"],[2,3,"T"],[2,4,"t"]]];
const OBS={
  /* Mailroom: pigeonhole sorting rack / mail cart / hanging mail sack */
  rack:(()=>{const C={L:["BBB","BBB","www","www"],R:["BBB","BBB","wwr","www"],A:["BBB","BBB","PPP","PPP"],K:["BBB","aaa","aTa","aaa"],Z:["BBB","BBB","zzz","www"],E:["BBB","BBB","BBB","www"]},M=[["L","K","A"],["R","L","Z"],["A","E","L"],["K","R","L"]];
    return grid(13,22,(x,y)=>{if(y===21)return[1,2,10,11].includes(x)?"B":"";if(y===0||y===20||x===0||x===12||y%5===0||x===4||x===8)return"b";return C[M[((y-1)/5)|0][x>>2]][(y-1)%5][(x-1)&3]})})(),
  cart:["...wwaaTww.PP...d","..wrwwaTaPPwrw..d","MMMMMMMMMMMMMMM.d",".ppppppppppppp.dd",".pPPPPPPPPPPPp...",".ppppppppppppp...","ddddddddddddddd..","..kk.........kk.."],
  sack:["......y......",".....TTT.....","....wPwrw....","....TTTTT....","...ccccccc...","..crrrrrrrc..",".ccwwwwwwrcc.",".ccwMwwwMwcc.",".ccwwMwMwwcc.",".tcwwwMwwwct.","..ttttttttt.."],
  /* Archive: tall bookcase / banker's boxes / colour-coded hanging files */
  bookcase:grid(14,22,(x,y)=>{if(y===21)return[1,2,11,12].includes(x)?"B":"";if(y===0||y%5===0||x===0||x===13)return"b";const sh=((y-1)/5)|0,ly=(y-1)%5;if(ly===4)return"b";
    let a=1;for(const[w,h,c]of BOOKS[sh]){if(x>=a&&x<a+w)return ly>=4-h?c:"B";a+=w}return"B"}),
  boxes:(()=>{const box=c=>["TTTTTTTT","tttkkttT","ttwww"+c+"tT","ttttttTT"],B=[[0,4,box("r")],[8,4,box("p")],[4,0,box("W")]];
    return grid(16,8,(x,y)=>{for(const[x0,y0,b]of B)if(x>=x0&&x<x0+8&&y>=y0&&y<y0+4)return b[y-y0][x-x0];return""})})(),
  files:grid(17,10,(x,y)=>{if(y===0)return"y";const i=(x-1)>>2,lx=(x-1)&3,c="rpWF"[i];if(x<1||x>15||lx===3)return"";
    if(y===1)return lx===1?"k":"";if(y===2)return(i%2?lx>=1:lx<=1)?c:"";if(y===3)return(i%2?lx===0:lx===2)?"":"w";return y===9?"k".replace("k",c):y===5&&lx===1?"w":c}),
  /* Lobby: grandfather clock in mahogany, with a moon dial / velvet rope on brass posts / chandelier with lit candles */
  clock:grid(12,22,(x,y)=>{if(y===0)return x>=3&&x<=8?"N":"";if(y===1)return x>=2&&x<=9?(x===2||x===9?"N":"U"):"";
    if(y<=10){if(x<1||x>10)return"";if(x===1||x===10)return"N";
      if(y===2)return x>=4&&x<=7?(x===4?"y":"n"):"U";if(y===3)return x>=3&&x<=8?(x===4||x===3&&0?"y":x===7?"w":"n"):"U";
      const d=Math.hypot(x-5.5,y-7.2);if(d<=3.7){if(d>2.8)return"y";if(x===5&&y>=5&&y<=7||y===7&&x>=6&&x<=7)return"k";return(x===5||x===6)&&y===4||x===3&&y===7?"M":"w"}return"U"}
    if(y<=12)return x>=3&&x<=8?(x===3||x===8?"N":"U"):"";
    if(y<=18){if(x<2||x>9)return"";if(x===2||x===9)return"N";if(x>=4&&x<=7&&y>=13&&y<=17){if(y>=15&&Math.hypot(x-5.5,y-16)<1.6)return y===15?"c":"y";return x===5||x===6?"Y":"B"}return"U"}
    if(y<=20)return x>=1&&x<=10?(y===19?"N":"U"):"";return[1,2,9,10].includes(x)?"N":""}),
  rope:grid(16,8,(x,y)=>{for(const px of[1,13]){if(x<px-1||x>px+2)continue;if(y===7)return x===px+2?"Y":"y";if(x<px||x>px+1)return"";
      if(y===0)return x===px?"A":"y";if(y===1)return x===px?"y":"Y";return x===px?"y":"Y"}
    if(x<3||x>12)return"";const yc=Math.round(1.8+3.2*(1-Math.pow((x-7.5)/5.5,2)));return y===yc?(Math.abs(x-7.5)<2.6?"L":"r"):y===yc+1?"V":""}),
  lamps:["........Y........","..F.....y.....F..","..A..F..y..F..A..","..w..A.yyy.A..w..",".yyy.w.yAy.w.yyy.","..Y.yyyyAyyyy.Y..","..YyyyyyyyyyyyY..","....YyyyYyyyY....","...C..C.y.C..C...","...q..q.C.q..q..."],
  /* Vault: steel safe / gold bars / lowered security shutter with a warning lamp */
  safe:grid(14,22,(x,y)=>{if(y===21)return[1,2,11,12].includes(x)?"k":"";if(y===0||y===20||x===0||x===13)return x===0&&(y>=4&&y<=6||y>=13&&y<=15)?"d":"M";
    const d=Math.hypot(x-6.5,y-9.5);if(d<=3.6){if(d>2.4)return"k";return x>=6&&x<=7&&y>=9&&y<=10?"y":x>=6&&x<=7&&y===7?"r":"w"}
    if(x>=4&&x<=9&&(y===15||y===16))return y===15?"y":"Y";if((x===3||x===10)&&y>=14&&y<=17)return"y";
    if([[3,3],[10,3],[3,17],[10,17]].some(([a,b])=>a===x&&b===y))return"d";if(x===1||x===12||y===1||y===19)return"d";return"m"}),
  gold:grid(14,8,(x,y)=>{const bar=(x0,x1,y0)=>x>=x0&&x<=x1?(y===y0?(x===x0+1?"w":"c"):y===y0+1?"y":"Y"):"";
    if(y<2)return x>=5&&x<=8?(y===0?(x===6?"w":"c"):"y"):"";if(y<5)return bar(2,5,2)||bar(8,11,2)||"";if(y<8){const r=bar(0,3,5)||bar(5,8,5)||bar(10,13,5);return r}return""}),
  shutter:grid(17,7,(x,y)=>{if(y<=1&&x>=7&&x<=9)return y===0&&x===8?"L":"r";if(y>=5)return((x+y)>>1)%2?"k":"y";if(x===0||x===16)return"d";return y%2?"M":x===1?"w":"m"})
};
const HP={sack:1,lamps:1,files:2,shutter:2};/* how a hanging thing is held: one rope or two poles */
const DEB={cab:[WHITE,"#BDB8A6",RED,INK],rack:["#B08A5A",WHITE,"#93B7E3",RED],bookcase:["#B08A5A",RED,"#4972AC","#3C9A5A"],clock:["#8A4630","#E2C06A",WHITE,"#B66A42"],safe:["#CBD1D6","#9EA8B1","#7C8791",WHITE],
  cart:[WHITE,"#4972AC","#93B7E3",RED],boxes:["#D9C9A3","#B9A06F",WHITE,RED],rope:[RED,"#E2C06A","#A50E26","#F7907F"],gold:["#E2C06A","#F3E3B0","#B8923A",WHITE],
  sack:["#F3E3B0",WHITE,RED,"#B9A06F"],files:[RED,"#4972AC","#3C9A5A","#F39A2B"],lamps:["#E2C06A","#F39A2B",WHITE,"#E2EEF8"],shutter:["#CBD1D6","#9EA8B1","#E2C06A",RED]};
const VAR=[["rack","cart","sack"],["bookcase","boxes","files"],["clock","rope","lamps"],["safe","gold","shutter"],["rock","log","branch"]],PCAB=[.5,.35,.3,.2,0];/* the filing cabinet turns up all through the building, less often deeper in, never in the woods */

/* ---------- the woods: past the second vault the runner breaks out of the building ----------
   Nothing announces it. On the second lap EXIT signs start to appear, the far wall glows, and the second
   vault door says EXIT. Beyond it: an open trail, endless, that runs from day into night and back. */
const BRK=ZL*8,WOODS={n:"THE WOODS",w:[.42,.75]};
const zoneOf=A=>A>=BRK?4:Math.floor(A/ZL)%4;
const pine=(W,H,tiers)=>grid(W,H,(x,y)=>{const c=(W-1)/2,tb=H-3;if(y>=tb)return Math.abs(x-c)<=1?(x>c?"H":"h"):"";
  for(let i=tiers.length-1;i>=0;i--){const[a,b,m]=tiers[i];if(y<a||y>b)continue;const f=(y-a)/(b-a),hw=Math.round(.6+f*(m-.6));if(Math.abs(x-c)>hw)continue;
    if(y===b&&(x+i)%2&&Math.abs(x-c)>1)continue;if(y>=b-1&&i<tiers.length-1)return x<c?"e":"E";return x<c-hw*.35?"v":x>c+hw*.3?"E":"e"}return""});
Object.assign(OBS,{
  /* dodge: a mossy boulder, or a pine standing right in the trail */
  rock:grid(17,18,(x,y)=>{const ins=(X,Y)=>Y<=17&&((X-8)/8.1)**2+((Y-11.5)/9.6)**2<=1&&!(Y<4&&((X-8)/5)**2+((Y-4)/3)**2>1);if(!ins(x,y))return"";
    if(!ins(x,y-1))return x%4===1?"e":"v";if(!ins(x,y-2)&&x%3)return"v";if(!ins(x+1,y)||((x-8)/8.1)>.38&&y>8||y===17)return"O";return(x*5+y*3)%13===0?"O":"o"}),
  pine:pine(15,30,[[0,8,3.4],[5,14,5],[11,20,6.4],[17,27,7.4]]),
  /* jump: a fallen log, rings on the cut end, moss on top */
  log:grid(18,8,(x,y)=>{if(y===0)return[6,7].includes(x)?"v":x>=12&&x<=14?(x===13?"w":"r"):"";if(y===1&&x===13)return"j";const d=Math.hypot(x-2.5,y-4);if(x<=5&&d<=3.4)return d<1.1?"a":d<2.2?"u":d<2.9?"a":"H";
    if(y>=1&&y<=7&&x<=17){if(x===17)return y>1&&y<7?"H":"";return y===1?(x%5===2?"v":"h"):y===7?"H":(x*3+y*7)%9===0?"H":"h"}return""}),
  /* slide: a fallen trunk caught at head height, needles hanging under it (its forked posts are drawn with it) */
  branch:grid(19,9,(x,y)=>{if(y===0)return[4,13].includes(x)?"H":"";if(y===1)return[3,4,5,12,13,14].includes(x)?"h":"";
    if(y>=2&&y<=3)return y===2?"h":(x%4===1?"H":"h");for(const cx of[3,9,15]){const d=Math.abs(x-cx);if(y>=4&&d<=Math.max(0,3-(y-4)*.7))return d<1?"E":(x+y)%2?"e":"E"}return""}),
  /* scenery beside the trail */
  oak:grid(17,21,(x,y)=>{if(y>=15)return Math.abs(x-8)<=1?(x>8?"H":"h"):y===20&&Math.abs(x-8)===2?"h":"";const b=[[8,5,6.5],[4,9,4.2],[12,9,4.4],[8,11,5.2]].some(([cx,cy,r])=>Math.hypot(x-cx,(y-cy)*1.12)<=r);
    if(!b)return"";return x<6&&y<10?"v":x>10&&y>8?"E":(x*7+y*5)%11===0?"v":"e"}),
  bush:grid(11,6,(x,y)=>{const b=[[3,3.4,3.2],[7,3,3.6]].some(([cx,cy,r])=>Math.hypot(x-cx,(y-cy)*1.4)<=r)&&y<6;if(!b)return"";return y<2?"v":x>7?"E":"e"}),
  stump:grid(7,5,(x,y)=>y===0?(x>0&&x<6?"u":""):y===1?(x===0||x===6?"h":x===3?"a":"u"):x%3===0?"H":"h"),
  deer:grid(16,11,(x,y)=>{const P=["...........H.H..","...........HiH..","..........iiiik.","...........ii...",".j.iiiiiiiiii...","jjiiiiiiiiiiii..","..iiijjjjjjii...","..ii.......ii...",".ii.........ii..","ii...........ii.","i.............i."];const c=P[y][x];return c==="."?"":c}),
  /* on the second lap, the building starts showing the way out */
  exit:label("EXIT","f")});
DEB.rock=["#C9CCC4","#979E97","#A9C59A",WHITE];DEB.pine=["#6E9A6A","#4F7A54","#9B7653","#A9C59A"];DEB.log=["#9B7653","#EAD8AF","#6B4F38","#A9C59A"];DEB.branch=["#6E9A6A","#9B7653","#4F7A54","#A9C59A"];
const mk=(w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c};
function sprite(rows,v,outline){const h=rows.length,w=rows[0].length,o=outline?1:0,c=mk(w+2*o,h+2*o),x=c.getContext("2d");
  const on=(i,j)=>i>=0&&j>=0&&i<h&&j<w&&rows[i][j]!==".";
  let sd=(v*7919+h*131+w*17)%2147483647||1;const rnd=()=>(sd=sd*16807%2147483647)/2147483647;
  for(let i=0;i<h;i++)for(let j=0;j<w;j++){const ch=rows[i][j];if(ch!=="."){x.fillStyle=PAL[ch];x.fillRect(j+o,i+o,1,1)}}
  if(o){x.fillStyle=INK;for(let i=-1;i<=h;i++)for(let j=-1;j<=w;j++){if(on(i,j))continue;
    const a=on(i-1,j)||on(i+1,j)||on(i,j-1)||on(i,j+1),b=on(i-1,j-1)||on(i-1,j+1)||on(i+1,j-1)||on(i+1,j+1);
    if(a?rnd()>.04:b&&rnd()<.35)x.fillRect(j+1,i+1,1,1)}}
  return c}
/* each sprite is kept at 1x, 2x, 4x and 8x; drawing from the nearest larger copy with smoothing keeps
   edges crisp while sizes change smoothly, so objects grow steadily instead of shimmering */
const SP={};
function lv(c){const out=[c];for(const k of[2,4,8]){const d=mk(c.width*k,c.height*k),x=d.getContext("2d");x.imageSmoothingEnabled=false;x.drawImage(c,0,0,d.width,d.height);out.push(d)}return out}
const RW={};
/* ---------- the Other Side: the same world rebuilt from blocks. Every sprite pixel becomes a small cube
   (lit top, shaded side facing the centre of the hall, a seam between cubes). Built once, straight into
   pixel memory, the first time the power-up appears; drawn exactly like the normal sprites. ---------- */
const VCH=.085,VK=4,VD=4,VXC={},TINT=[92,112,186],VB="#C9D2EA";let VX=false,VPREP=false,BGV=[],VC=null;
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),mixc=(c,t,a)=>c.map((v,i)=>Math.round(v+(t[i]-v)*a)),hexc=c=>"#"+c.map(v=>v.toString(16).padStart(2,"0")).join("");
const pk=c=>((255<<24)|(c[2]<<16)|(c[1]<<8)|c[0])>>>0;
function voxel(rows,sd){const h=rows.length,w=rows[0].length,P=VD+1,W=w*VK+2*P,H=h*VK+P+1,c=mk(W,H),x=c.getContext("2d"),im=x.createImageData(W,H),b=new Uint32Array(im.data.buffer);
  const on=(i,j)=>i>=0&&j>=0&&i<h&&j<w&&rows[i][j]!==".",T={};
  const tone=ch=>T[ch]||(T[ch]=(()=>{const c=rgb(PAL[ch]),k=ch==="k";return{f:pk(c),t:pk(mixc(c,[255,255,255],k?.3:.4)),s:pk(mixc(c,[0,0,0],k?0:.3)),e:pk(mixc(c,[0,0,0],k?0:.12))}})());
  const rect=(x0,y0,ww,hh,v)=>{for(let yy=y0;yy<y0+hh;yy++)b.fill(v,yy*W+x0,yy*W+x0+ww)};
  for(let d=VD;d>=1;d--)for(let i=0;i<h;i++)for(let j=0;j<w;j++)if(on(i,j))rect(P+j*VK+sd*d,P+i*VK-d,VK,VK,tone(rows[i][j]).s);/* sides */
  for(let i=0;i<h;i++)for(let j=0;j<w;j++)if(on(i,j)&&!on(i-1,j)){const t=tone(rows[i][j]).t;for(let d=1;d<=VD;d++)rect(P+j*VK+sd*d,P+i*VK-d,VK,1,t)}/* tops */
  for(let i=0;i<h;i++)for(let j=0;j<w;j++)if(on(i,j)){const t=tone(rows[i][j]),X=P+j*VK,Y=P+i*VK;rect(X,Y,VK,VK,t.f);rect(X,Y+VK-1,VK,1,t.e);rect(X+VK-1,Y,1,VK,t.e)}/* fronts */
  const ink=pk(rgb(INK)),o=b.slice();
  for(let y=0;y<H;y++)for(let xx=0;xx<W;xx++){const i=y*W+xx;if(!o[i]&&((xx>0&&o[i-1])||(xx<W-1&&o[i+1])||(y>0&&o[i-W])||(y<H-1&&o[i+W])))b[i]=ink}
  x.putImageData(im,0,0);
  const hf=mk(Math.ceil(W/2),Math.ceil(H/2)),hx=hf.getContext("2d");hx.imageSmoothingQuality="high";hx.drawImage(c,0,0,hf.width,hf.height);
  const qf=mk(Math.ceil(W/4),Math.ceil(H/4)),qx=qf.getContext("2d");qx.imageSmoothingQuality="high";qx.drawImage(hf,0,0,qf.width,qf.height);
  return [c,hf,qf]}
const vs=(n,sd)=>VXC[n+sd]||(VXC[n+sd]=voxel(RW[n],sd));
const sdir=l=>l<-.33?1:l>.33?-1:0;/* which side of a block you see depends on where it stands */
/* built a little at a time (about 2 ms a frame) while the power-up is still down the hall */
const VQ=[];function voxQueue(){if(VPREP)return;VPREP=true;for(let z=0;z<4;z++)for(let v=0;v<3;v++)VQ.push(()=>vbv(z,v));for(const n in RW)for(const d of/^(z\d|door|ring)$/.test(n)?[0]:[-1,0,1])VQ.push(()=>vs(n,d))}
function voxStep(ms){const t=performance.now();while(VQ.length&&performance.now()-t<ms){VQ.shift()()}}
function voxPrep(){voxQueue();voxStep(1e9)}
const ZV=ZONES.map(Z=>{const o={};for(const k in Z)o[k]=typeof Z[k]==="string"&&Z[k][0]==="#"?hexc(mixc(rgb(Z[k]),TINT,k==="line"||k==="seam"?.3:k==="floor"?.2:.16)):Z[k];return o});
const vbv=(z,v)=>{const a=BGV[z]||(BGV[z]=[]);return a[v]||(a[v]=hallway(v,ZV[z],true))},vbg=z=>[0,1,2].map(v=>vbv(z,v));
/* draw a sprite in whichever world is showing */
function vblit(set,cx,by,s){const b=set[0],k=s/VK,w=b.width*k,h=b.height*k;if(w<.3||h<.3)return;const t=s*SS;let x=cx-w/2,y=by-h;
  if(t>=4){x=Math.round(x*SS);y=Math.round(y*SS);ctx.imageSmoothingEnabled=false;ctx.drawImage(b,x/SS,y/SS,Math.round(w*SS)/SS,Math.round(h*SS)/SS);ctx.imageSmoothingEnabled=true;return}
  const e=t/VK;ctx.drawImage(set[e>.5?0:e>.25?1:2],x,y,w,h)}
function spr(n,cx,by,s,lane){if(VX&&n==="key")n="keyg";if(VX&&RW[n])vblit(vs(n,/^(z\d|door|ring)$/.test(n)?0:sdir(lane)),cx,by,s);else blit(SP[n],cx,by,s)}
function sprites(){if(SP.cab)return;const V=r=>lv(sprite(r,1,true));
  Object.assign(RW,{runA:RUN_A,runB:RUN_B,jump:JUMP,idle:IDLE,slide:SLIDE,cab:CAB,key:KEY,keyg:KEYG,door:DOOR,ring:RING,z0:label("MAILROOM","k"),z1:label("ARCHIVE","k"),z2:label("LOBBY","k"),z3:label("VAULT","r"),pmag:PU_MAG,pbst:PU_BST,pshr:PU_SHR,pvox:PU_VOX},OBS);
  Object.assign(SP,{runA:V(RUN_A),runB:V(RUN_B),jump:V(JUMP),idle:V(IDLE),slide:V(SLIDE),cab:V(CAB),key:V(KEY),keyg:V(KEYG),door:V(DOOR),ring:V(RING),z0:V(label("MAILROOM","k")),z1:V(label("ARCHIVE","k")),z2:V(label("LOBBY","k")),z3:V(label("VAULT","r")),pmag:V(PU_MAG),pbst:V(PU_BST),pshr:V(PU_SHR),pvox:V(PU_VOX),sh:lv(sprite(SHADOW,0,false))});for(const k in OBS)SP[k]=V(OBS[k]);for(const[k,v]of[["sd0",SLD0],["sd1",SLD1],["sd2",SLD2],["gl",GLANCE],["f0n",FRONT(0)],["fan",FWA(0)],["fbn",FWB(0)],["f0k",FRONT(1)],["fak",FWA(1)],["fbk",FWB(1)]]){RW[k]=v;SP[k]=V(v)}}

/* text */
const GL={};
function glyph(ch,col){const k=ch+col;if(GL[k])return GL[k];const c=mk(3,5),x=c.getContext("2d"),b=F[ch];x.fillStyle=col;if(b)for(let i=0;i<15;i++)if(b[i]==="1")x.fillRect(i%3,(i/3)|0,1,1);return GL[k]=c}
function text(x,s,px,py,sc,col){s=String(s).toUpperCase();for(let i=0;i<s.length;i++)if(s[i]!==" ")x.drawImage(glyph(s[i],col),px+i*4*sc,py,3*sc,5*sc)}
const tw=(s,sc)=>String(s).length*4*sc-sc;

/* a hand-drawn pixel line: straight, with a gentle 1px wobble */
function sline(x,x0,y0,x1,y1,seed,col=INK,amp=1){x.fillStyle=col;const dx=x1-x0,dy=y1-y0,n=Math.ceil(Math.max(Math.abs(dx),Math.abs(dy)));if(!n)return;
  const steep=Math.abs(dy)>Math.abs(dx),ph=seed*2.3,fr=.07+(seed%5)*.013;
  for(let i=0;i<=n;i++){const t=i/n,w=amp&&Math.round(Math.sin(i*fr+ph)*.75+Math.sin(i*fr*2.7+ph*1.7)*.35);let px=x0+dx*t,py=y0+dy*t;if(steep)px+=w;else py+=w;x.fillRect(Math.round(px),Math.round(py),1,1)}}

/* ---------- state ---------- */
let root=null,gc,ctx,dc,dctx,btn,raf=0,tr=0,busy=false,prevFocus=null,last=0,dirty=true,p0=null,rzT=0;
let iw=0,ih=0,CX=0,HY=0,GY=0,LW=0,HC=0,ZMIN=0,BGM=0,BG=[],cards={};
const G={state:"title",t:0,dist:0,speed:V0,keys:0,lane:0,x:0,jy:0,vy:0,slide:0,sbuf:0,jbuf:0,anim:0,objs:[],next:0,hitT:0,boil:0,boilT:0,pop:0,score:0,best:0,newBest:false,frames:0,ms:0,
  mult:1,maxMult:1,kpts:0,bonus:0,near:0,sq:0,cam:0,freeze:0,sl0:-9,passedBest:false,bestD:0,trs:{},trI:0,mag:0,boost:0,shield:0,grace:0,nextPU:0,zone:0,zprev:0,zf:9,lap:0,vk:0,vox:0,vtr:0,slo:0,fxT:9,fxIn:true};
const store=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,String(v))}catch(e){}};
G.best=+store("vk_run_best")||0;G.bestD=+store("vk_run_bestd")||0;
/* ---------- sound: the sound engine (audio.js) loads only once sound is switched on; until then nothing of it exists ---------- */
let SND=store("vk_run_sound")==="1";
const AU=()=>SND&&window.VKAudio?window.VKAudio:null,TK={state:"",zone:0,vox:false,sp:0,x:0,mult:1,slo:0,boost:false};
function loadAudio(chime){if(window.VKAudio||loadAudio.l)return;loadAudio.l=1;const s=document.createElement("script");s.src="audio.js?v=1";
  s.onload=()=>{if(SND&&window.VKAudio){VKAudio.unlock();if(chime)sfx("toggle")}};s.onerror=()=>{loadAudio.l=0;s.remove()};document.head.appendChild(s)}
function sfx(n,a){if(window.__sfx)__sfx.push([performance.now(),n,a]);const A=AU();if(A)try{A.play(n,a)}catch(e){}}
/* floating labels: CLOSE +25, X3 STREAK, NEW BEST */
const POP=[];
function pop(t,col){POP.push({t,col,x:CX+G.x*LW,a:0,row:POP.length});if(POP.length>3)POP.shift();POP.forEach((p,i)=>p.row=i)}
const qz=z=>D/(z+D),fY=q=>HY+(GY-HY)*q,cY=q=>HY+(GY-HY-HC)*q;
const score=()=>Math.floor(G.dist/2)+G.kpts+G.bonus;
/* dust at the runner's feet: a small fixed pool, nothing allocated while running */
const PT=Array.from({length:160},()=>({life:0,t:1}));let ptI=0;
function puff(x,y,vx,vy,life,sz,streak,col){const p=PT[ptI++%PT.length];p.x=x;p.y=y;p.vx=vx;p.vy=vy;p.t=0;p.life=life;p.sz=sz;p.streak=streak;p.col=col||null}
const rr=(a,b)=>a+Math.random()*(b-a),spd=()=>(G.speed-V0)/(VMAX-V0)+(G.boost>0?.7:0);
function footfall(side){const sp=spd(),px=CX+G.x*LW,n=1+Math.round(sp*2)+(Math.random()<.5?1:0);
  for(let i=0;i<n;i++)puff(px+side*rr(2,5),GY-rr(0,2),side*rr(6,16)*(1+sp),rr(-16,4),rr(.3,.45)+sp*.1,Math.random()<.4?3:2)}
function burst(){const px=CX+G.x*LW;for(let i=0;i<8;i++){const sd=i%2?1:-1;puff(px+sd*rr(2,8),GY-1,sd*rr(16,36),rr(-14,-2),rr(.3,.45),Math.random()<.5?3:2)}}
function dust(h){const sp=spd(),px=CX+G.x*LW,ground=G.jy===0;
  if(ground&&!(G.slide>0)){const st=G.anim|0;if(st!==G.step){G.step=st;footfall(st&1?-1:1);sfx("step",st&1)}}
  if(ground&&G.slide>0&&Math.random()<h*75){const sd=Math.random()<.5?-1:1;puff(px+sd*rr(5,11),GY-rr(0,2),sd*rr(22,58),rr(-28,-6),rr(.24,.4),Math.random()<.5?3:2);if(Math.random()<.18)puff(px+sd*rr(3,8),GY-rr(2,6),sd*rr(10,30),rr(-60,-30),rr(.4,.6),2,false,WHITE)}
  if(sp>.2&&Math.random()<h*sp*16){const sd=Math.random()<.5?-1:1;puff(px+sd*rr(12,20),GY-rr(2,12),0,90+sp*110,.22,1,true)}
  if(G.boost>0&&Math.random()<h*45){const sd=Math.random()<.5?-1:1;puff(px+sd*rr(14,34),GY-rr(4,44),0,300,.16,1,true,PAL.p)}/* Fast Pass wind */
  for(const p of PT)if(p.t<p.life){p.t+=h;p.x+=p.vx*h;p.y+=p.vy*h;p.vx*=1-3*h;if(!p.streak)p.vy+=70*h}}
function drawDust(){const sp=spd();ctx.fillStyle=DUST;
  for(const p of PT){if(p.t>=p.life)continue;const k=p.t/p.life;ctx.globalAlpha=(1-k*k)*(p.streak?.7:.85);
    if(p.streak){ctx.fillStyle=p.col||LINE;ctx.fillRect(Math.round(p.x*SS)/SS,p.y,.5,4+sp*7);ctx.fillStyle=DUST}
    else{const z=p.sz*(1+k*.8),X=Math.round((p.x-z/2)*SS)/SS,Y=Math.round((p.y-z/2)*SS)/SS;ctx.fillStyle=p.col||DUST;ctx.fillRect(X,Y,z,z);
      if(VX){const u=Math.max(1/SS,Math.round(z*SS/3)/SS);ctx.fillStyle="rgba(255,255,255,.5)";ctx.fillRect(X,Y,z,u);ctx.fillStyle="rgba(0,0,0,.2)";ctx.fillRect(X+z-u,Y+u,u,z-u)}}}
  ctx.globalAlpha=1}

/* ---------- layout ---------- */
/* The canvas maps onto the screen's real (device) pixels at a whole-number ratio, and every
   world pixel is a whole number of canvas pixels, so nothing is ever resampled or blurred.
   Big, dense screens draw at 1/2 or 1/3 of device resolution (still a whole-number ratio). */
function size(){const W=innerWidth,H=innerHeight,dpr=window.devicePixelRatio||1;let f=1;
  while(W*dpr*H*dpr/(f*f)>2.2e6)f++;
  const cw=W*dpr/f,chh=H*dpr/f;SS=Math.max(1,Math.floor(Math.min(cw,chh)/180));
  iw=Math.ceil(cw/SS);ih=Math.ceil(chh/SS);
  const u=Math.max(2,Math.min(W,H)/220);CPX=dpr/f;UC=Math.max(1,Math.round(u*CPX));HS=Math.max(1,Math.round(Math.max(4,u*1.5)*CPX));
  for(const c of[gc,dc]){c.width=iw*SS;c.height=ih*SS;c.style.width=iw*SS/CPX+"px";c.style.height=ih*SS/CPX+"px"}
  ctx.imageSmoothingQuality="high";dctx.imageSmoothingEnabled=false;
  CX=iw>>1;GY=Math.round(ih*.85);
  if(ih>iw*1.2){LW=Math.round(iw*.27);HY=Math.round(Math.max(ih*.3,GY-LW*1.9))}/* phone held upright: wider lanes, shorter floor */
  else{HY=Math.round(ih*.37);LW=Math.round(Math.min(iw*.2,(GY-HY)*.78))}HC=(GY-HY)*2.4;ZMIN=D/((ih-HY)/(GY-HY))-D;BGM=Math.ceil(LW*.35)+2;
  BG=ZONES.map(Z=>[0,1,2].map(v=>hallway(v,Z)));BGV=[];VC=null;WSKY=[];WLAND=[];SHAT=null;cards={};dirty=true}
/* the still parts of the hallway, drawn once per size in three slightly different hands */
function hallway(v,Z,vx){const c=mk(iw+2*BGM,ih),x=c.getContext("2d");x.fillStyle=Z.wall;x.fillRect(0,0,c.width,ih);x.translate(BGM,0);/* wider than the screen so the camera can drift */
  const qf=qz(FAR),fx=Math.round(WX*LW*qf),fy=Math.round(fY(qf)),cy=Math.round(cY(qf));
  x.fillStyle=Z.floor;for(let y=fy;y<ih;y++){const hw=Math.ceil(WX*LW*(y-HY)/(GY-HY));x.fillRect(CX-hw,y,hw*2,1)}
  x.fillStyle=Z.end;x.fillRect(CX-fx,cy,fx*2,fy-cy);
  const r=Math.floor(Math.min(fx,(fy-cy)/2)*.55);
  if(r>=3){const oy=Math.round(fy-(fy-cy)*.42);x.fillStyle=INK;for(let j=-r-1;j<=r+1;j++)for(let i=-r-1;i<=r+1;i++)if(Math.abs(Math.hypot(i,j)-r)<.55)x.fillRect(CX+i,oy+j,1,1);x.fillRect(CX-1,oy,3,1);x.fillRect(CX,oy-1,1,3)}
  const side=(iw/2+BGM+2)/(WX*LW),qb=Math.min((ih+2-HY)/(GY-HY),side),qt=Math.min((HY+2)/(HC-(GY-HY)),side);
  for(const sg of[-1,1]){sline(x,CX+sg*fx,fy,CX+sg*WX*LW*qb,fY(qb),v*8+(sg>0?1:2));sline(x,CX+sg*fx,cy,CX+sg*WX*LW*qt,cY(qt),v*8+(sg>0?3:4))}
  if(vx){/* the Other Side: a violet glow from above, light pouring from the far end, a sheen on the floor */
    let gr=x.createLinearGradient(0,0,0,HY);gr.addColorStop(0,"rgba(112,96,214,.30)");gr.addColorStop(1,"rgba(112,96,214,0)");x.fillStyle=gr;x.fillRect(-BGM,0,iw+2*BGM,HY);
    gr=x.createLinearGradient(0,fy,0,GY);gr.addColorStop(0,"rgba(214,224,255,.75)");gr.addColorStop(1,"rgba(214,224,255,0)");x.fillStyle=gr;
    x.beginPath();x.moveTo(CX-fx,fy);x.lineTo(CX+fx,fy);x.lineTo(CX+WX*LW*qb,fY(qb));x.lineTo(CX-WX*LW*qb,fY(qb));x.fill();
    const gx=CX,gy=(fy+cy)/2,rg=Math.max(fx*3.2,8);gr=x.createRadialGradient(gx,gy,0,gx,gy,rg);gr.addColorStop(0,"rgba(255,255,255,.7)");gr.addColorStop(.35,"rgba(236,240,255,.45)");gr.addColorStop(1,"rgba(236,240,255,0)");x.fillStyle=gr;x.fillRect(gx-rg,gy-rg,rg*2,rg*2);
    const H=HC,qf2=qz(FAR);for(const k of[-1.5,-1,0,1,1.5])sline(x,CX+k*LW*qf2,fY(qf2),CX+k*LW*qb,fY(qb),1,Z.seam,0);
    for(const sg of[-1,1])for(let i=1;i<=10;i++){const h=H*VCH*i;sline(x,CX+sg*fx,fY(qf2)-h*qf2,CX+sg*WX*LW*side,fY(side)-h*side,1,Z.seam,0)}}
  sline(x,CX-fx,cy,CX+fx,cy,v*8+5);sline(x,CX-fx,fy,CX+fx,fy,v*8+6);sline(x,CX-fx,cy,CX-fx,fy,v*8+7);sline(x,CX+fx,cy,CX+fx,fy,v*8+8);
  return c}
/* ---------- the woods, drawn like the hallway: the still parts once per size (sky, ridges, a line of pines,
   the meadow and the trail), the moving parts every frame, and then the light of the hour over all of it ---------- */
let WSKY=[],WLAND=[],WPEEK=null,SHAT=null,SHC=null,WSEEN=store("vk_run_woods")==="1";
const WC={sky0:"#DCE8EA",sky1:"#F5F4EC",hill0:"#DDE6D4",hill1:"#CAD8C1",tree0:"#A6BE9D",tree1:"#8CA887",grass:"#E0E8D0",path:"#EEE5D1",rut:"#E2D5BB"};
const wcol=(k,vx)=>vx?hexc(mixc(rgb(WC[k]),TINT,.22)):WC[k],hz=()=>Math.round(fY(qz(FAR)));/* the horizon sits where the far end of the hall was */
const frh=v=>{const t=Math.sin(v)*43758.5453;return t-Math.floor(t)};
function woodsSky(vx){const c=mk(iw+2*BGM,ih),x=c.getContext("2d"),H=hz(),g=x.createLinearGradient(0,0,0,H);
  g.addColorStop(0,wcol("sky0",vx));g.addColorStop(1,wcol("sky1",vx));x.fillStyle=g;x.fillRect(0,0,c.width,H+1);x.fillStyle=wcol("sky1",vx);x.fillRect(0,H+1,c.width,ih-H);
  x.fillStyle=vx?"rgba(255,255,255,.55)":"rgba(255,255,255,.8)";for(let i=0;i<Math.max(3,Math.round(c.width/90));i++){const cx=frh(i*7.3+.5)*c.width,cy=H*(.12+frh(i*3.1+.2)*.42),w=14+frh(i*5.9)*22;
    for(let j=0;j<4;j++){const ww=Math.round(w*[1,.72,.5,.3][j]),ox=Math.round(frh(i*9.1+j)*w*.3-w*.15);x.fillRect(Math.round(cx-ww/2+ox),Math.round(cy-j*2),ww,2)}}
  if(vx){const gr=x.createLinearGradient(0,0,0,H);gr.addColorStop(0,"rgba(112,96,214,.28)");gr.addColorStop(1,"rgba(112,96,214,0)");x.fillStyle=gr;x.fillRect(0,0,c.width,H)}return c}
function woodsLand(v,vx){const c=mk(iw+2*BGM,ih),x=c.getContext("2d"),H=hz(),W=c.width,K=Math.max(1,H/74),K2=1+(K-1)*.55;x.drawImage(WSKY[vx?1:0],0,0);
  if(K>1.6){x.fillStyle=wcol("hill0",vx);x.globalAlpha=.6;for(let X=0;X<W;X++){const h=Math.round((20+9*Math.sin(X*.018+.7)+5*Math.sin(X*.05+2))*K*.7);x.fillRect(X,H-h,1,h)}x.globalAlpha=1}/* tall screens see far mountains */
  x.fillStyle=wcol("hill0",vx);for(let X=0;X<W;X++){const h=Math.round((9+5*Math.sin(X*.027+1.3)+3*Math.sin(X*.071+.4))*K);x.fillRect(X,H-h,1,h)}
  x.fillStyle=wcol("hill1",vx);for(let X=0;X<W;X++){const h=Math.round((4+3*Math.sin(X*.045+2.1)+1.5*Math.sin(X*.13))*K);x.fillRect(X,H-h,1,h)}
  for(let X=-4,i=0;X<W+4;i++){const r=frh(i*12.9898),th=Math.round((5+r*9)*K2),bw=Math.max(2,Math.round(th*.36));x.fillStyle=wcol(r>.5?"tree1":"tree0",vx);
    for(let y=0;y<th;y++){const hw=Math.round(bw*y/th);x.fillRect(X-hw,H-th+y,hw*2+1,1)}X+=2+Math.round(frh(i*4.1+1)*4)}
  x.translate(BGM,0);x.fillStyle=wcol("grass",vx);x.fillRect(-BGM,H,W,ih-H);
  x.fillStyle=wcol("path",vx);for(let y=H;y<ih;y++){const hw=WX*LW*(y-HY)/(GY-HY)*.82;x.fillRect(Math.round(CX-hw),y,Math.round(hw*2),1)}
  const qf=qz(FAR),qb=Math.min((ih+2-HY)/(GY-HY),(iw/2+BGM+2)/(WX*LW));
  for(const sg of[-1,1])sline(x,CX+sg*WX*LW*qf*.82,H,CX+sg*WX*LW*qb*.82,fY(qb),v*8+(sg>0?1:2));
  return c}
/* baked a piece at a time while the runner is still inside, so breaking out never stutters */
function wprep(all,vx){const k=vx?1:0;if(!WSKY[k]){WSKY[k]=woodsSky(vx);if(!all)return}const L=WLAND[k]||(WLAND[k]=[]);for(let v=0;v<3;v++)if(!L[v]){L[v]=woodsLand(v,vx);if(!all)return}peek()}
/* what you see through the second vault door */
function peek(){if(WPEEK)return WPEEK;const N=48,c=mk(N,N),x=c.getContext("2d"),H=Math.round(N*.62),g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,"#FFFFFF");g.addColorStop(1,WC.sky1);x.fillStyle=g;x.fillRect(0,0,N,N);
  x.fillStyle=WC.hill0;for(let X=0;X<N;X++){const h=Math.round(4+2*Math.sin(X*.2));x.fillRect(X,H-h,1,h)}
  x.fillStyle=WC.tree1;for(let X=1;X<N;X+=4){const th=4+((X*7)%5);for(let y=0;y<th;y++){const hw=Math.round(1.6*y/th);x.fillRect(X-hw,H-th+y,hw*2+1,1)}}
  x.fillStyle=WC.grass;x.fillRect(0,H,N,N-H);x.fillStyle=WC.path;for(let y=H;y<N;y++){const hw=(y-H)*.9+1;x.fillRect(Math.round(N/2-hw),y,Math.round(hw*2),1)}
  const gr=x.createRadialGradient(N*.5,H-6,0,N*.5,H-6,N*.55);gr.addColorStop(0,"rgba(255,255,240,.95)");gr.addColorStop(1,"rgba(255,255,240,0)");x.fillStyle=gr;x.fillRect(0,0,N,N);return WPEEK=c}
/* the hour: day, golden hour, dusk, night, dawn, and round again. A thin wash of colour lays the hour over
   everything (one plain fill: cheap even on slow machines); stars, the moon and fireflies come after it, so they shine.
   each step: distance into the woods, wash colour, wash strength, glow along the horizon, how dark it is */
const WK=[[0,"#FFFFFF",0,0,0],[650,"#FFFFFF",0,0,0],[1250,"#FFA552",.2,.36,0],[1850,"#8A63A6",.24,.28,.25],[2450,"#121A42",.66,0,1],[3650,"#121A42",.66,0,1],[4250,"#C6979E",.16,.22,0],[4800,"#FFFFFF",0,0,0]],WCYC=4800;
const WT={wash:[255,255,255],wa:0,ga:0,night:0,sun:1,d:0};
function wphase(){const d=((G.dist-BRK)%WCYC+WCYC)%WCYC;let i=0;while(i<WK.length-2&&d>=WK[i+1][0])i++;const a=WK[i],b=WK[i+1],f=Math.min(1,(d-a[0])/(b[0]-a[0])),e=f*f*(3-2*f),l=(j)=>a[j]+(b[j]-a[j])*e;
  WT.wash=mixc(rgb(a[1]),rgb(b[1]),e);WT.wa=l(2);WT.ga=l(3);WT.night=l(4);WT.d=d;
  WT.sun=d<650?1:d<2450?1-(d-650)/1800*1.3:d<4250?-1:-.3+(d-4250)/550*1.3;return WT}

const disc2=(cx,cy,r)=>{for(let j=-r;j<=r;j++){const w=Math.round(Math.sqrt(r*r-j*j));ctx.fillRect(Math.round(cx-w),Math.round(cy+j),w*2+1,1)}};
function wbg(vx){wprep(true,vx);const x=ctx,k=vx?1:0,H=hz();wphase();x.drawImage(WLAND[k][G.boil],-BGM,0);
  /* the sun sinks behind the ridge: below a line just above the horizon it is cut off */
  if(WT.sun>-.3){const sy=H-4-Math.max(-.3,WT.sun)*H*.55,cut=H-Math.round(7*Math.max(1,H/74));if(sy-6<cut){x.save();x.beginPath();x.rect(-BGM,0,iw+2*BGM,cut);x.clip();x.fillStyle="#FFF6D6";disc2(CX+LW*1.3,sy,6);x.restore()}}
  birds();wscenery()}
function birds(){if(WT.sun<.2)return;const x=ctx,H=hz();x.fillStyle="#646B66";for(let f=0;f<2;f++){const per=iw+120,bx=((G.t*(8+f*5)+f*137)%per)-60,by=H*(.3+f*.18)+Math.sin(G.t*.7+f)*3;
  for(let i=0;i<3;i++){const X=Math.round(bx-i*7-(i&1)*2),Y=Math.round(by+i*3+(i&1)),up=((G.t*7+i+f)|0)%2;x.fillRect(X-2,Y-up,2,1);x.fillRect(X,Y,1,1);x.fillRect(X+1,Y-up,2,1)}}}
function wscenery(){const x=ctx,px=1/SS,sn=v=>Math.round(v*SS)/SS;
  x.fillStyle=WC.rut;for(let z=zs(5,2);z<FAR;z+=5){const q=qz(z),y=sn(fY(q));if(y>=ih)continue;const hw=WX*LW*q*.82,t=Math.max(px,sn(q*.9));x.fillRect(sn(CX-hw*.62),y,sn(hw*.3),t);x.fillRect(sn(CX+hw*.3),y,sn(hw*.3),t)}
  for(let z=zs(2.2,0);z<FAR-4;z+=2.2){if(z<ZMIN-1)continue;const q=qz(z),fy=fY(q),k=Math.round((G.dist+z)/2.2),w=Math.max(px,sn(q*.9));for(const sg of[-1,1]){const r=frh(k*3.7+sg*1.3);if(r<.35)continue;
    const bx=CX+sg*WX*LW*q*(.84+r*.12),h=Math.max(px,(2+r*2.5)*q*1.4);x.fillStyle=r>.8?"#C9B27C":"#93AD84";
    x.fillRect(sn(bx),sn(fy-h),w,sn(h));x.fillRect(sn(bx-q*1.6),sn(fy-h*.7),w,sn(h*.7));x.fillRect(sn(bx+q*1.6),sn(fy-h*.6),w,sn(h*.6));
    if(r>.93){x.fillStyle=k%3?"#E8B04A":"#E06A5A";const f=Math.max(px,sn(q*1.6));x.fillRect(sn(bx),sn(fy-h-q*1.4),f,f)}}}
  /* trees and bushes beside the trail, far ones first; only those on screen are drawn */
  const T=[],x0=G.cam-6,x1=G.cam+iw+6;for(let z=zs(4,1);z<FAR;z+=4){if(z<ZMIN-2)continue;const k=Math.round((G.dist+z-1)/4);for(const sg of[-1,1]){const r=frh(k*12.9898+sg*78.233),r2=frh(k*4.17+sg*9.1);if(r<.12)continue;
    const n=r<.62?"pine":r<.8?"oak":r<.93?"bush":"stump",q=qz(z),s=P0*q*(n==="pine"?1.05+r2*.55:n==="oak"?1+r2*.35:1),hw=SP[n][0].width*s*.5,X=CX+sg*(WX*LW*q*(1.06+r2*.95)+hw);
    if(X+hw<x0||X-hw>x1)continue;T.push([z,n,X,s,q,sg])}}
  for(let i=T.length-1;i>=0;i--){const[z,n,X,s,q,sg]=T[i],fy=fY(q);ctx.globalAlpha=z>FAR-16?Math.max(0,(FAR-z)/16):1;
    if(z<22)blit(SP.sh,X,fy+s,s*(n==="pine"||n==="oak"?1:.7));spr(n,X,fy,s,sg*3)}ctx.globalAlpha=1}
/* leaves drifting down, before the light; then the light of the hour, the stars, the fireflies */
function wfx(){const x=ctx,gold=WT.d>900&&WT.d<2450;for(let i=0;i<7;i++){const a=(i*.6180339)%1,b=(i*.7548777)%1,yy=((G.t*(10+b*8)+b*(ih+20))%(ih+20))-10,xx=a*iw+Math.sin(G.t*1.3+i*2.1)*9,w=((G.t*3+i)|0)%2?2:1;
    x.fillStyle=gold?(i%3?"#E0A54C":"#C9763F"):(i%3?"#A9C59A":"#6E9A6A");x.fillRect(Math.round(xx),Math.round(yy),w,1);x.fillRect(Math.round(xx),Math.round(yy)+1,1,1)}
  const H=hz(),px=1/SS;
  if(WT.wa>.005){x.save();x.setTransform(1,0,0,1,0,0);x.globalAlpha=WT.wa;x.fillStyle=hexc(WT.wash);x.fillRect(0,0,gc.width,gc.height);x.restore()}
  if(WT.ga>.005){x.fillStyle="#FFAA60";for(let i=0;i<7;i++){const k=1-Math.abs(i-4.2)/4.6;x.globalAlpha=WT.ga*k*k*.55;x.fillRect(-BGM,H-50+i*8,iw+2*BGM,8)}x.globalAlpha=1}/* a warm band along the horizon, in flat steps */
  const n=WT.night;if(n<=0)return;
  for(let i=0;i<34;i++){const a=(i*.6180339)%1,b=(i*.4142136)%1;x.globalAlpha=n*(.55+.45*Math.sin(G.t*(1.3+b*2)+i*3));x.fillStyle=i%5?"#F2EEDC":WHITE;const z=i%7?px:Math.max(px,Math.round(SS*.6)/SS);x.fillRect(Math.round(iw*(.1+a*.8)),Math.round((H-18)*b*.92+2),z,z)}
  x.globalAlpha=n;x.fillStyle="#F2EEDC";disc2(CX-iw*.27,H*.3,5);x.fillStyle="#DAD3BC";x.fillRect(Math.round(CX-iw*.27)-2,Math.round(H*.3)-1,2,2);x.fillRect(Math.round(CX-iw*.27)+1,Math.round(H*.3)+2,1,1);
  for(let i=0;i<16;i++){const b=(i*.7548777)%1,p=(G.t*.07+b)%1,sd=i%2?1:-1,X=CX+sd*(LW*1.5+p*iw*.42)+Math.sin(G.t*.9+i*1.7)*5,Y=H+(GY-H)*(.08+p*1.05)+Math.sin(G.t*1.3+i)*4,bl=.5+.5*Math.sin(G.t*2.6+i*2.3);
    x.globalAlpha=n*bl*.32;x.fillStyle="#E9F59A";x.fillRect(X-1.2,Y-1.2,2.4,2.4);x.globalAlpha=n*bl;x.fillRect(X-.4,Y-.4,.8,.8)}
  const pxl=CX+G.x*LW;x.fillStyle="#FFD68C";for(const r of[34,28,23,18,14,10,6]){x.globalAlpha=.034*n;x.beginPath();x.arc(pxl,GY-14,r,0,Math.PI*2);x.fill()}
  x.fillStyle=WHITE;for(const o of G.objs){if(o.t!=="key"||o.dead||o.z>FAR-10)continue;const q=qz(o.z),lx=CX+o.lane*LW*q,ky=fY(q)-(10+Math.sin(G.t*5+o.z)*2.5)*q-2*q;x.globalAlpha=n*(.5+.5*Math.sin(G.t*6+o.z));x.fillRect(lx-q*1.5,ky,q*3,Math.max(px,q*.5));x.fillRect(lx-q*.25,ky-q*1.25,Math.max(px,q*.5),q*3)}
  x.globalAlpha=1}
/* breaking out: the last frame of the building shatters into blocks and falls away, middle first */
function keepFrame(){const c=SHAT&&SHAT.width===gc.width&&SHAT.height===gc.height?SHAT:mk(gc.width,gc.height);c.getContext("2d").drawImage(gc,0,0);SHAT=c}/* the hall as it looks just before the door, with nothing on top */
function shat(){if(!SHAT)keepFrame();
  const cs=CELL*SS,[fx,fy]=focus(),D2=Math.hypot(iw,ih),a=[];for(let y=0;y<gc.height;y+=cs)for(let x=0;x<gc.width;x+=cs)a.push([x,y,Math.hypot((x+cs/2)/SS-fx,(y+cs/2)/SS-fy+26)/D2*.95+Math.random()*.07,rr(-70,70)*SS,rr(-90,0)*SS]);SHC=a}
function drawShat(){const x=ctx,t0=G.brk,cs=CELL*SS;x.setTransform(1,0,0,1,0,0);
  if(REDUCED){x.globalAlpha=Math.max(0,1-t0/.6);x.drawImage(SHAT,0,0);x.globalAlpha=1;return}
  for(const c of SHC){const t=t0-c[2];if(t<=0){x.drawImage(SHAT,c[0],c[1],cs,cs,c[0],c[1],cs,cs);continue}const a=t<.3?1:1-(t-.3)*2.4;if(a<=0)continue;const k=1-t*.3;
    x.globalAlpha=a;x.drawImage(SHAT,c[0],c[1],cs,cs,c[0]+c[3]*t,c[1]+c[4]*t+520*SS*t*t,cs*k,cs*k)}x.globalAlpha=1;
  if(t0<.2){x.globalAlpha=(1-t0/.2)*.8;x.fillStyle=WHITE;x.fillRect(0,0,gc.width,gc.height);x.globalAlpha=1}}
const woodsCard=()=>cards.w||(cards.w=card([["THE WOODS",3,INK,7],["YOU BROKE OUT.",1,MUTE,0]],""));
function drawWoodsCard(){const t=G.wt,a=t<.5?0:t<1?(t-.5)/.5:t<3.4?1:Math.max(0,1-(t-3.4)/.8);if(a<=0)return;const cd=woodsCard(),u=UC,w=(cd.w+4)*u,h=(cd.h+4)*u;
  ctx.globalAlpha=a;ctx.drawImage(cd.imgs[0],Math.round((gc.width-w)/2),Math.round(gc.height*.2-h/2),w,h);ctx.globalAlpha=1}
/* on the title screen, once you have been out there: now and then a leaf drifts past */
function titleLeaf(){const T=performance.now()/1000,c=T%11;if(c>5)return;const X=iw*(.15+.7*((Math.floor(T/11)*.618)%1))+Math.sin(c*2.1)*14+c*6,Y=-6+c/5*(ih+12),f=(c*3|0)%2;
  const L=f?[".aa.","aaaa",".aa.","..s."]:["..a.",".aa.","aaa.",".s.."];ctx.setTransform(SS,0,0,SS,0,0);
  for(let j=0;j<4;j++)for(let i=0;i<4;i++){const c=L[j][i];if(c===".")continue;ctx.fillStyle=c==="s"?"#8A5A33":f?"#C9763F":"#E0A54C";ctx.fillRect(Math.round(X)+i,Math.round(Y)+j,1,1)}ctx.setTransform(1,0,0,1,0,0)}
/* a white card with a sketched border and a printed shadow */
function card(lines,hint){const pad=10;let w=tw(hint,1),h=pad;for(const l of lines){w=Math.max(w,tw(l[0],l[1]));h+=5*l[1]+l[3]}const hy=h;h+=5+pad;w+=pad*2;
  const imgs=[0].map(v=>{const c=mk(w+4,h+4),x=c.getContext("2d");x.imageSmoothingEnabled=false;x.fillStyle=LINE;x.fillRect(3,3,w,h);x.fillStyle=WHITE;x.fillRect(1,1,w,h);
    sline(x,1,1,w,1,v*5+1);sline(x,1,h,w,h,v*5+2);sline(x,1,1,1,h,v*5+3);sline(x,w,1,w,h,v*5+4);
    let y=pad+1;for(const l of lines){text(x,l[0],1+Math.round((w-tw(l[0],l[1]))/2),y,l[1],l[2]);y+=5*l[1]+l[3]}return c});
  return {imgs,w,h,hint,hx:1+Math.round((w-tw(hint,1))/2),hy:hy+1}}
const titleCard=()=>{if(LB.pass)LB.passOk=1;return cards.t||(cards.t=card([["VAULT RUN",3,INK,8]].concat(LB.pass?[[LB.pass,1,RED,8]]:[],CH?[[chName()+" RAN "+commas(CH.s),2,RED,5],["CAN YOU BEAT IT?",1,INK,9]]:[],[["COLLECT KEYS. DODGE THE PAPERWORK.",1,MUTE,5],[TOUCH?"SWIPE TO MOVE, JUMP OR SLIDE":"ARROWS OR WASD TO MOVE, JUMP, SLIDE",1,MUTE,G.best?5:9]],G.best?[["BEST "+G.best,1,MUTE,9]]:[]),TOUCH?"TAP TO START":"PRESS SPACE TO START"))};
const pauseCard=()=>cards.p||(cards.p=card([["PAUSED",3,INK,9]],TOUCH?"TAP TO RESUME":"PRESS SPACE TO RESUME"));

/* ---------- the all-time board: sign it with five letters, arcade style ---------- */
const API="api/scores",KEEP=100,NL=5,GRID="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const LB={on:false,v:-1,top:[],cut:0,total:0,me:null,name:"",gx:0,gy:0,kb:!TOUCH,msg:"",busy:false,hits:[],rv:0};
/* every board carries a version; a copy older than the one already here (say, a few seconds stale from the network) is ignored,
   and the newest board is kept on this device so it shows at once next time */
function lbTake(j,keep){if(!j||!Array.isArray(j.top))return;const v=+j.v||0;if(v<LB.v)return;LB.v=v;LB.on=true;LB.top=j.top;LB.cut=j.cut||0;LB.total=j.total||0;dirty=true;
  if(keep!==false)store("vk_run_lb",JSON.stringify({v,top:j.top,cut:LB.cut,total:LB.total}))}
try{lbTake(JSON.parse(store("vk_run_lb")||"null"),false)}catch(e){}
function lbFetch(){if(lbFetch.p)return;lbFetch.p=1;const ac=window.AbortController?new AbortController():null,to=setTimeout(()=>ac&&ac.abort(),6000);
  fetch(API,{cache:"no-store",signal:ac&&ac.signal}).then(r=>r.ok?r.json():null).then(j=>{if(j&&j.on===false){LB.on=false;dirty=true}else if(j&&j.on){lbTake(j);passCheck();pqFlush()}}).catch(()=>{}).then(()=>{clearTimeout(to);lbFetch.p=0})}
/* a run that couldn't be saved is never dropped: it waits on this device and is sent the next time the board answers.
   Its run id means a run that did get through, and is sent again, is recognised and never saved twice */
const PQ=()=>{try{const a=JSON.parse(store("vk_run_pending")||"[]");return Array.isArray(a)?a:[]}catch(e){return[]}},pqSet=a=>store("vk_run_pending",JSON.stringify(a.slice(-20)));
function pqFlush(){const q=PQ();if(!q.length||pqFlush.p)return;pqFlush.p=1;const b=q[0];
  fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}).then(r=>r.json().catch(()=>null).then(j=>({ok:r.ok,j}))).then(({ok,j})=>{pqFlush.p=0;const er=j&&j.error;
    if((ok&&j&&Array.isArray(j.top))||er==="word"||er==="score"||er==="name"){pqSet(PQ().filter(e=>e.id!==b.id));if(ok){lbTake(j);if(j.saved)mineAdd(b.n,b.s);passCheck()}pqFlush()}}).catch(()=>{pqFlush.p=0})}
const lbQual=s=>LB.on&&s>0&&(LB.total<KEEP||s>LB.cut);
const lbRank=s=>1+LB.top.filter(e=>e.s>=s).length;/* ties go to whoever got there first */
/* ---------- someone passed you ----------
   The runs you signed are remembered on this device, with the top ten as you last saw it. When a newer board shows yours
   lower down (or gone), the title says who did it, until your next run. Nothing about this is sent anywhere. */
const MINE=()=>{try{const a=JSON.parse(store("vk_run_mine")||"[]");return Array.isArray(a)?a:[]}catch(e){return[]}};
function mineAdd(n,s){if(n)store("vk_run_mine",JSON.stringify(MINE().filter(e=>!(e[0]===n&&e[1]===s)).concat([[n,s]]).slice(-40)))}
const isMine=(m,e)=>m.some(x=>x[0]===e.n&&x[1]===e.s),myRank=(m,top)=>{for(let i=0;i<top.length;i++)if(isMine(m,top[i]))return i+1;return 0};
function seenSet(){store("vk_run_seen",JSON.stringify(LB.top.slice(0,10).map(e=>[e.n,e.s])));LB.passOk=0}
function passCheck(){if(!LB.on||!LB.top.length)return;
  /* from before this was remembered: scores on the board under the name signed on this device count as yours */
  if(store("vk_run_mine")===null){const nm=store("vk_run_name")||"";store("vk_run_mine",JSON.stringify(nm?LB.top.filter(e=>e.n===nm).map(e=>[e.n,e.s]):[]))}
  let seen=null;try{seen=JSON.parse(store("vk_run_seen")||"null")}catch(e){}if(!Array.isArray(seen))return seenSet();
  const m=MINE(),top=LB.top.slice(0,10),old=seen.map(([n,s])=>({n,s})),was=myRank(m,old),now=myRank(m,top);
  if(!was||now&&now<=was){if(LB.pass){LB.pass="";cards.t=null;dirty=true}return seenSet()}
  const who=top.slice(0,now?now-1:10).filter(e=>!isMine(m,e)&&!old.some(o=>o.n===e.n&&o.s===e.s)),nm=who.length?who[0].n+(who.length>1?" +"+(who.length-1):""):"";
  const msg=now?(nm?nm+" PASSED YOU. YOU'RE NO. "+now:"YOU SLIPPED TO NO. "+now):(nm?nm+" BUMPED YOU OFF THE TOP 10":"YOU SLIPPED OUT OF THE TOP 10");
  if(msg!==LB.pass){LB.pass=msg;cards.t=null;dirty=true}}
/* ---------- a handful of moments per visit, counted by the site's analytics if the page loaded it (run.html and the challenge page do) ---------- */
function track(n,d){try{if(window.va)window.va("event",d?{name:n,data:d}:{name:n})}catch(e){}}
let RUNS=0;
/* frame pacing: add ?fps to the page address to see it live; once a visit, after ten seconds of running, the typical rate is counted */
const FPSM=/[?&]fps\b/.test(location.search),FT=[],FA=[];let FPS1=0;
function fpsNote(dt){FT.push(dt);if(FT.length>60)FT.shift();if(FPS1)return;FA.push(dt);
  if(FA.length>=600){FPS1=1;const a=FA.sort((x,y)=>x-y),b=v=>String(Math.min(120,Math.round(1/v/5)*5));track("fps",{typical:b(a[a.length>>1]),worst5pct:b(a[Math.floor(a.length*.95)]),device:TOUCH?"phone":"desktop"})}}
function drawFps(){if(!FT.length)return;const s=Math.round(FT.length/FT.reduce((a,b)=>a+b,0))+" FPS",k=Math.max(1,Math.round(HS*.6));text(ctx,s,HS*3,gc.height-HS*6,k,RED)}
function lbNext(){if(G.auto)toBoard();else if(lbQual(G.score))toName();else nameSkip()}
/* once you've signed the board, later runs that make it are signed for you the moment they end,
   so the card can offer RUN AGAIN straight away (the save carries on in the background, and is queued if it can't get through) */
function autoSave(){const n=(store("vk_run_name")||"").replace(/[^A-Z0-9]/g,"").slice(0,NL),s=G.score,rid=G.rid;if(!n||!lbQual(s))return false;
  const body={n,s,ms:Math.round(G.t*1000),k:G.keys,id:rid,w:G.woods?1:0},keep=()=>pqSet(PQ().filter(e=>e.id!==body.id).concat([body]));LB.me={n,s,w:body.w,rank:0,saved:false,q:1};
  fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).then(r=>r.json().catch(()=>null).then(j=>({ok:r.ok,j}))).then(({ok,j})=>{
    if(ok&&j&&Array.isArray(j.top)){lbTake(j);if(j.saved){mineAdd(n,s);track("signed",{rank:j.rank<=10?"top 10":"board"})}passCheck();if(G.rid===rid&&G.state==="over")LB.me={n,s,w:body.w,rank:j.rank||0,saved:!!j.saved};dirty=true}
    else{const er=j&&j.error;if(er!=="word"&&er!=="score")keep()}}).catch(keep);return true}
function toName(){G.ph="name";LB.name=(store("vk_run_name")||"").replace(/[^A-Z0-9]/g,"").slice(0,NL);LB.gy=LB.name?4:0;LB.gx=LB.name?7:0;LB.msg="";LB.busy=false;dirty=true}
function toBoard(){G.ph="board";LB.rv=performance.now();dirty=true}
function nameSkip(){LB.me={n:"",s:G.score,rank:0,saved:false};toBoard()}
function nameIn(c){if(LB.busy)return;if(LB.name.length<NL){LB.name+=c;sfx("key",{i:LB.name.length-1,m:1})}LB.msg="";dirty=true}
function nameDel(){if(LB.busy)return;LB.name=LB.name.slice(0,-1);LB.msg="";dirty=true}
function namePress(){const r=LB.gy,c=LB.gx;if(r<4)nameIn(GRID[r*9+c]);else if(c<3)nameDel();else if(c<6)nameSkip();else lbSubmit()}
function nameMove(dx,dy){LB.kb=true;if(dy){LB.gy=(LB.gy+dy+5)%5;if(LB.gy===4)LB.gx=Math.floor(LB.gx/3)*3+1}if(dx)LB.gx=LB.gy===4?((Math.floor(LB.gx/3)+dx+3)%3)*3+1:(LB.gx+dx+9)%9;dirty=true}
function nameKey(e){const k=e.key;if(e.ctrlKey||e.metaKey||e.altKey)return false;
  if(/^[a-z0-9]$/i.test(k)){nameIn(k.toUpperCase());return true}
  if(k==="Backspace"||k==="Delete"){nameDel();return true}if(k==="Enter"){lbSubmit();return true}if(k==="Escape"){nameSkip();return true}
  if(k===" "){namePress();return true}if(k==="Tab")return true;
  const m={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[k];if(m){nameMove(m[0],m[1]);return true}return false}
function nameTap(cx,cy){const r=gc.getBoundingClientRect(),k=gc.width/(r.width||1),x=(cx-r.left)*k,y=(cy-r.top)*k;
  for(const h of LB.hits)if(x>=h.x&&x<h.x+h.w&&y>=h.y&&y<h.y+h.h){LB.kb=false;h.a();return}}
function lbSubmit(){if(LB.busy)return;if(!LB.name){LB.msg="ENTER A NAME FIRST";dirty=true;return}LB.busy=true;LB.msg="SAVING...";dirty=true;const n=LB.name,s=G.score;
  /* the run's own id means pressing OK again after a lost reply can never sign the same run twice */
  const ac=window.AbortController?new AbortController():null,to=setTimeout(()=>ac&&ac.abort(),10000);
  const body={n,s,ms:Math.round(G.t*1000),k:G.keys,id:G.rid,w:G.woods?1:0},keep=()=>{pqSet(PQ().filter(e=>e.id!==body.id).concat([body]));store("vk_run_name",n);LB.busy=false;
    LB.me={n,s,w:body.w,rank:0,saved:false,q:1};if(G.state==="over"&&G.ph==="name"){toBoard();sfx("toggle")}dirty=true};/* the board didn't answer: keep the run, send it later */
  fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),signal:ac&&ac.signal}).finally(()=>clearTimeout(to))
    .then(r=>r.json().catch(()=>null).then(j=>({ok:r.ok,j}))).then(({ok,j})=>{LB.busy=false;
      if(ok&&j&&Array.isArray(j.top)){store("vk_run_name",n);lbTake(j);LB.me={n,s,w:G.woods?1:0,rank:j.rank||0,saved:!!j.saved};if(j.saved){mineAdd(n,s);track("signed",{rank:j.rank<=10?"top 10":"board"})}passCheck();
        if(G.state==="over"&&G.ph==="name"){toBoard();sfx(j.rank<=10?"best":"toggle")}}
      else{const er=j&&j.error;if(er!=="word"&&er!=="score")return keep();LB.msg=er==="word"?"PICK ANOTHER NAME":"THAT RUN DIDN'T ADD UP";if(er==="word")LB.name="";dirty=true}})
    .catch(keep)}
/* ---------- sharing: one line and a link that opens as a challenge ----------
   The link carries the run in a short code; it unfurls into a picture of the score and the route, and opens the game
   as a challenge against it (see pages/api/r.js and card.js, which read the same code). */
const SITE="https://the-model-run.vercel.app",commas=v=>String(v).replace(/\B(?=(\d{3})+(?!\d))/g,",");
const hsh=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
function shareCode(n,sc,d,w){const b=[n||"_",sc.toString(36),Math.round(d).toString(36),w?"w":"b"].join(".");return b+"."+(hsh("vr1|"+b)%1296).toString(36).padStart(2,"0")}
/* the run this page was opened to beat, if any */
const CH=(()=>{const c=window.VK_CH;if(!c||!(c.s>=0))return null;const n=String(c.n||"").replace(/[^A-Z0-9]/g,"").slice(0,5),s=Math.round(c.s),me=(store("vk_run_name")||"").replace(/[^A-Z0-9]/g,"");
  if(n?n===me:s===(+store("vk_run_best")||-1))return null;/* your own link, opened from the group chat: just the game */return{n,s,d:Math.round(c.d)||0}})();
const chName=()=>CH.n||"YOUR FRIEND";
const shareName=()=>((LB.me&&LB.me.saved&&LB.me.n)||store("vk_run_name")||"").replace(/[^A-Z0-9]/g,"").slice(0,5);
function shareText(){const sc=G.score,link=(location.protocol==="https:"?location.origin:SITE)+"/r/"+shareCode(shareName(),sc,G.dist,G.woods);
  /* one line: the picture under the link does the bragging (score, route, the pines if you got out) */
  const line=CH&&sc>CH.s&&CH.n?"Just passed "+CH.n+"'s "+commas(CH.s)+" in Vault Run \u{1F3C6}":G.woods?"Just ran "+commas(sc)+" in Vault Run and escaped \u{1F332}":"Just ran "+commas(sc)+" in Vault Run.";
  return line+" Beat that \u{1F447}\n"+link}
/* on a phone, the share sheet (straight into a message); on a computer, the clipboard.
   The sheet gets the line and the link on one line: Messages turns the link into its preview, and a line break
   before it would be left behind as an empty line */
const SH={msg:"",t:0};
function shared(m){SH.msg=m;SH.t=performance.now();dirty=true}
function legacyCopy(t){const a=document.createElement("textarea");a.value=t;a.setAttribute("readonly","");a.style.cssText="position:fixed;left:-9999px;top:0;opacity:0";document.body.appendChild(a);a.select();let ok=false;try{ok=document.execCommand("copy")}catch(e){}a.remove();if(root)root.focus({preventScroll:true});return ok}
function doShare(){const t=shareText();sfx("toggle");track("shared",{via:TOUCH&&navigator.share?"share sheet":"copy"});
  const copy=()=>{const fb=()=>shared(legacyCopy(t)?"COPIED. PASTE IT IN ANY CHAT":"COULDN'T COPY");
    try{if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(()=>shared("COPIED. PASTE IT IN ANY CHAT"),fb);return}}catch(e){}fb()};
  if(TOUCH&&navigator.share){navigator.share({text:t.replace("\n"," ")}).then(()=>shared("SENT"),e=>{if(!(e&&e.name==="AbortError"))copy()});return}
  copy()}
function shareTap(cx,cy){const h=LB.shareHit;if(!h)return false;const r=gc.getBoundingClientRect(),k=gc.width/(r.width||1),x=(cx-r.left)*k,y=(cy-r.top)*k;
  if(x>=h.x&&x<h.x+h.w&&y>=h.y&&y<h.y+h.h){doShare();return true}return false}
const chResult=()=>{const df=G.score-CH.s;return df>0?["YOU BEAT "+chName()+" BY "+commas(df),RED]:df<0?[chName()+" WINS BY "+commas(-df),MUTE]:["DEAD HEAT WITH "+chName(),INK]};
/* the same white card, sized for the board; laid out in text pixels and drawn at a scale that fits the screen */
const PNL={};
function panel(w,h){const k=w+"x"+h;if(PNL[k])return PNL[k];const c=mk(w+4,h+4),x=c.getContext("2d");x.imageSmoothingEnabled=false;x.fillStyle=LINE;x.fillRect(3,3,w,h);x.fillStyle=WHITE;x.fillRect(1,1,w,h);
  sline(x,1,1,w,1,11);sline(x,1,h,w,h,12);sline(x,1,1,1,h,13);sline(x,w,1,w,h,14);return PNL[k]=c}
let LAYUP=0;
function lay(w,h){const hs=Math.max(h,179),u=Math.max(1,Math.min(UC*2,Math.floor(gc.width*.94/(w+4)),Math.floor(gc.height*.9/(hs+4))));/* one scale for every board screen */
  let y=Math.round((gc.height-(h+4)*u)/2);if(LAYUP)y=Math.max(Math.round(gc.height*.02),Math.min(y,Math.round((GY-40)*SS)-(h+4)*u));/* on the home screen, clear of the runner */
  return{u,x:Math.round((gc.width-(w+4)*u)/2),y}}
function pen(w,h){const L=lay(w,h),u=L.u;ctx.drawImage(panel(w,h),L.x,L.y,(w+4)*u,(h+4)*u);
  const X=t=>L.x+t*u,Y=t=>L.y+t*u,T=(s,tx,ty,sc,col)=>text(ctx,s,X(tx),Y(ty),sc*u,col);
  return{u,X,Y,T,C:(s,ty,sc,col)=>T(s,Math.round((w+4-tw(s,sc))/2),ty,sc,col),R:(tx,ty,tw2,th,col)=>{ctx.fillStyle=col;ctx.fillRect(X(tx),Y(ty),tw2*u,th*u)}}}
/* the mark of a run that broke out: a tiny pine after the name */
function treeMark(R,x,y){const P=["..e..",".eee.","..e..",".eee.","eEeEe","..h..","..h.."];for(let j=0;j<7;j++)for(let i=0;i<5;i++){const c=P[j][i];if(c!==".")R(x+i,y+j,1,1,PAL[c])}}
const blinkOn=()=>performance.now()/1000*2%1<.62;
function drawName(){const w=170,h=179,P=pen(w,h),{u,X,Y,T,C,R}=P,rk=lbRank(G.score),bl=blinkOn();LB.hits=[];
  C(rk<=10?"NEW HIGH SCORE":"YOU MADE THE BOARD",10,2,RED);
  C("SCORE "+G.score+(rk<=10?"   RANK "+rk:"   TOP "+KEEP),24,1,MUTE);
  const sp=20,sx=Math.round((w+4-(NL*sp-8))/2),sy=36;
  for(let i=0;i<NL;i++){const ch=LB.name[i],x0=sx+i*sp,cur=i===LB.name.length&&!LB.busy;if(ch)T(ch,x0,sy,4,INK);
    R(x0,sy+23,12,2,cur?(bl?RED:LINE):ch?INK:LINE)}
  C(LB.msg||(TOUCH?"TAP THE LETTERS, THEN OK":"TYPE YOUR NAME, THEN PRESS ENTER"),67,1,LB.msg&&!LB.busy?RED:MUTE);
  const cs=16,gx0=Math.round((w+4-(9*cs-1))/2),gy0=79;
  for(let r=0;r<4;r++)for(let c=0;c<9;c++){const ch=GRID[r*9+c],x0=gx0+c*cs,y0=gy0+r*cs,sel=LB.kb&&LB.gy===r&&LB.gx===c;
    R(x0,y0,15,15,sel?INK:PAPER);T(ch,x0+5,y0+3,2,sel?WHITE:INK);LB.hits.push({x:X(x0),y:Y(y0),w:cs*u,h:cs*u,a:()=>{LB.gx=c;LB.gy=r;nameIn(ch)}})}
  const by=gy0+4*cs+3,bw=47,lab=["DEL","SKIP","OK"],fn=[nameDel,nameSkip,lbSubmit];
  for(let i=0;i<3;i++){const x0=gx0+i*(bw+1),sel=LB.kb&&LB.gy===4&&Math.floor(LB.gx/3)===i,ok=i===2;
    R(x0,by,bw,15,sel?INK:ok?RED:INK);if(!sel&&!ok)R(x0+1,by+1,bw-2,13,WHITE);T(lab[i],x0+Math.round((bw-tw(lab[i],2))/2),by+3,2,sel||ok?WHITE:INK);
    LB.hits.push({x:X(x0),y:Y(by),w:bw*u,h:15*u,a:()=>{LB.gy=4;LB.gx=i*3+1;fn[i]()}})}
  if(!TOUCH)C("ARROWS AND SPACE WORK TOO   ESC TO SKIP",h-11,1,MUTE)}
function drawBoard(att){const w=170,top=LB.top.slice(0,10),me=att?null:LB.me,R0=top.length,mine=me&&me.saved&&me.rank>=1&&me.rank<=R0&&top[me.rank-1]&&top[me.rank-1].n===me.n&&top[me.rank-1].s===me.s?me.rank-1:-1;
  const extra=!!me&&mine<0,sh=!att,res=sh&&CH,h=38+(R0?R0*13:24)+(extra?22:0)+(res?12:0)+(sh?22:0)+16,P=pen(w,h),{u,X,Y,T,C,R}=P,bl=blinkOn(),el=performance.now()-LB.rv;
  C("HIGH SCORES",9,2,INK);const kw=13,kx=Math.round((w+4-tw("HIGH SCORES",2))/2);for(const kx2 of[kx-kw-5,kx+tw("HIGH SCORES",2)+5])ctx.drawImage(SP.key[0],X(kx2),Y(11),kw*u,5*u);
  C(att?"ALL TIME. CAN YOU BEAT THEM?":"ALL TIME",23,1,MUTE);
  if(!R0){C(LB.on?"NO SCORES YET":"BOARD OFFLINE",40,2,MUTE);C(LB.on?"BE THE FIRST ON THE WALL":"YOUR RUN STILL COUNTS",54,1,MUTE)}
  for(let i=0;i<R0;i++){if(!att&&el<i*70){dirty=true;break}const e=top[i],y=36+i*13,me1=i===mine,col=me1?(bl?RED:INK):i===0?RED:INK,rs=(i+1)+".";
    if(me1&&bl)T(">",8,y,2,RED);T(rs,40-tw(rs,2),y,2,col);T(e.n,50,y,2,col);if(e.w)treeMark(R,50+tw(e.n,2)+4,y+1);const ss=String(e.s);T(ss,w-12-tw(ss,2),y,2,col)}
  if(extra&&(att||el>=R0*70)){const y=36+(R0?R0*13:24)+4;for(let x=14;x<w-8;x+=4)R(x,y,1,1,LINE);const y2=y+6;
    if(me.saved){const rs=(me.rank>KEEP?KEEP+"+":me.rank)+".",col=bl?RED:INK;T(rs,40-tw(rs,2),y2,2,col);T(me.n,50,y2,2,col);if(me.w)treeMark(R,50+tw(me.n,2)+4,y2+1);T(String(me.s),w-12-tw(String(me.s),2),y2,2,col)}
    else{T(me.q?"SAVING":"YOUR RUN",18,y2,2,MUTE);T(String(me.s),w-12-tw(String(me.s),2),y2,2,MUTE)}}
  LB.shareHit=null;
  if(sh){let y=h-16-22-(res?12:0);if(res){const[t,c]=chResult();C(t,y+2,1,c);y+=12}/* then the button that turns a finished run into a challenge */
    const on=SH.msg&&performance.now()-SH.t<2600,lab=on?SH.msg:"CHALLENGE FRIENDS",ls=tw(lab,2)<=144?2:1,bw=150,bx=Math.round((w+4-bw)/2),by=y+2;
    R(bx,by,bw,16,on?INK:RED);T(lab,bx+Math.round((bw-tw(lab,ls))/2),by+(ls===2?3:5),ls,WHITE);LB.shareHit={x:X(bx),y:Y(by),w:bw*u,h:16*u};if(on)dirty=true}
  if(blinkOn())C(att?(TOUCH?"TAP TO START":"PRESS SPACE TO START"):(TOUCH?"TAP ANYWHERE ELSE TO RUN AGAIN":"SPACE RUN AGAIN   C SHARE   ESC LEAVE"),h-10,1,INK)}

/* ---------- game ---------- */
function start(){LB.me=null;SHAT=null;if(LB.passOk){LB.pass="";seenSet();cards.t=null}
  RUNS++;if(RUNS===1)track("play",{from:CH?"challenge link":"direct",device:TOUCH?"phone":"desktop"});else if(RUNS===5||RUNS===20)track("runs "+RUNS+"+");
  Object.assign(G,{state:"run",ph:"card",rid:Math.random().toString(36).slice(2,10),t:0,dist:0,speed:V0,keys:0,lane:0,x:0,jy:0,vy:0,slide:0,sbuf:0,jbuf:0,anim:0,next:-36,pop:0,step:0,mult:1,maxMult:1,kpts:0,bonus:0,near:0,sq:0,freeze:0,sl0:-9,passedBest:false,trs:{},mag:0,boost:0,shield:0,grace:0,nextPU:rr(150,230),zone:0,zprev:0,zf:9,lap:0,vk:0,vox:0,vtr:0,slo:0,fxT:9,woods:0,beatCh:0,brk:9,wt:9,snap:0,deer:0,ck:0,lk:0,pq:[],pn:0,il:[],rmUsed:0,fin:0,lb10:LB.on&&LB.top.length>=10?LB.top[9].s:0,lb1:LB.on&&LB.top.length?LB.top[0].s:0,mk10:0,mk1:0,mkD10:0,mkD1:0});G.objs.length=0;POP.length=0;for(const p of PT)p.t=p.life=0;
  while(G.next<=0){row(SPAWN+G.next);G.next+=gap()}sfx("start");dirty=true}
const gap=()=>Math.max(8,G.speed*.6)+Math.random()*6;
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
/* ---------- room signatures: now and then, a short run of two or three rows that belongs to the room you're in ----------
   Most of the hall stays random. These just give each room a feel of its own, and are never easier than a random row:
   every row has at least two things in it. Read left lane / middle / right, one row per beat.
   C = something tall to go round   J = something low to jump   S = something hanging to slide under   . = clear
   k = keys in a clear lane   j / s = keys over a jump / under a slide
   tests/fair.mjs checks each can always be got through moving one lane per beat, and that the hall is no sparser than
   pure random. Tier 0 from the start, tier 1 past 900 m or from the second lap. */
const SETS=[
  /* MAILROOM: weaving between cabinets and carts */
  [[0,"weave",["CCk","CkC","kCC"]],[0,"weave back",["kCC","CkC","CCk"]],[0,"carts",["JJC","CJJ"]],[1,"sorting",["C.C","CJC","CSC"]]],
  /* ARCHIVE: jump and slide in rhythm */
  [[0,"hurdle and duck",["JJJ","SSS"]],[0,"shelving",["CJC","SkS"]],[1,"stacks",["CSC","CJC","CSC"]],[1,"paper trail",["sJC","sJC"]]],
  /* LOBBY: columns and ropes, read ahead */
  [[0,"colonnade",["C.C","CJC",".CC"]],[0,"velvet ropes",["JJ.",".JJ","J.J"]],[1,"concierge",["CC.","C.C",".CC"]],[1,"chandeliers",["SSS","SjS"]]],
  /* VAULT: short and sharp */
  [[0,"bars",["JJJ","CkC"]],[1,"lasers",["CJS","SCJ"]],[1,"gauntlet",["CJS","SCJ","JSC"]],[1,"lockdown",["CCJ","CJC","JCC"]]],
  /* THE WOODS: fallen trees and a slalom through the pines */
  [[0,"deadfall",["JJJ","SSS"]],[0,"pines",["CC.","C.C",".CC"]],[1,"thicket",["CJC","CSC"]],[1,"windfall",["JJJ","SSS","JJJ"]]]];
const setChance=()=>G.noSets||G.dist<160?0:G.lap?.11:G.dist<900?.07:.09;/* a signature starts on about 1 row in 12, so roughly 1 row in 6 is part of one */
function setPiece(Zi){const tier=G.lap||G.dist>900?1:0,pool=SETS[Zi].filter(e=>e[0]<=tier);if(!pool.length)return null;
  /* never the same one twice in a row */let e;for(let i=0;i<4;i++){e=pool[Math.random()*pool.length|0];if(e[1]!==G.pn)break}G.pn=e[1];return e[2].slice()}
function placeRow(r,z,Zi){
  for(let i=0;i<3;i++){const c=r[i],L=i-1;if(c===".")continue;
    if(c==="k"||c==="j"||c==="s"){const id=++G.trI;G.trs[id]={got:0,broken:false};for(let k=0;k<5;k++)G.objs.push({t:"key",lane:L,z:z-1+k*1.5,tr:id});if(c==="k")continue}
    const t=c==="C"?"cab":c==="J"||c==="j"?"stack":"sign";
    G.objs.push({t,v:t==="cab"?(Math.random()<PCAB[Zi]?"cab":Zi===4&&Math.random()<.5?"pine":VAR[Zi][0]):VAR[Zi][t==="stack"?1:2],lane:L,z})}}
function row(z){const A=G.dist+z,ga=A-Math.round(A/ZL)*ZL;if(A>ZL/2&&A<BRK+20&&ga>-6&&ga<10)return;/* nothing in or just behind a doorway */
  if(A>BRK-14&&A<BRK+75){if(A>BRK+12&&Math.random()<.7){const L=[-1,0,1][Math.random()*3|0],id=++G.trI;G.trs[id]={got:0,broken:false};for(let i=0;i<5;i++)G.objs.push({t:"key",lane:L,z:z-1+i*1.5,tr:id})}return}/* the way out is clear: just keys to follow */
  const Zi=zoneOf(A);
  if(!G.pq.length&&Math.random()<setChance()){const q=setPiece(Zi);if(q)G.pq=q}
  if(G.pq.length){placeRow(G.pq.shift(),z,Zi);return}
  const W=Zi===4?WOODS.w:ZONES[Zi].w,early=G.dist<120,r=Math.random(),n=early?(r<.6?1:2):(r<.38?1:r<.84?2:3);
  const lanes=shuffle([-1,0,1]).slice(0,n);
  const types=lanes.map(()=>{const q=Math.random();return G.dist<50?(q<.6?"cab":"stack"):q<W[0]?"cab":q<W[1]?"stack":"sign"});
  if(n===3&&types.every(t=>t==="cab"))types[Math.random()*3|0]=Math.random()<.5?"stack":"sign";
  lanes.forEach((L,i)=>{const t=types[i];G.objs.push({t,v:t==="cab"?(Math.random()<PCAB[Zi]?"cab":Zi===4&&Math.random()<.5?"pine":VAR[Zi][0]):VAR[Zi][t==="stack"?1:2],lane:L,z})});
  const free=[-1,0,1].filter(L=>!lanes.includes(L));
  if(free.length&&G.dist>G.nextPU&&!G.objs.some(o=>o.t==="pu")){const L=free.splice(Math.random()*free.length|0,1)[0];const k=pickPU();if(k==="vox")voxQueue();G.objs.push({t:"pu",k,lane:L,z});G.nextPU=G.dist+rr(220,360)}
  if(free.length&&Math.random()<.6){const L=free[Math.random()*free.length|0],id=++G.trI;G.trs[id]={got:0,broken:false};for(let i=0;i<5;i++)G.objs.push({t:"key",lane:L,z:z-1+i*1.5,tr:id})}}
/* five keys in a row raise the multiplier; breaking a row you started lowers it */
function gotKey(o){o.dead=1;G.lk=G.dist;G.keys++;G.pop=.3;G.kpts+=10*G.mult*(G.vox>0?2:1);const tr=G.trs[o.tr];let n=0;
  if(tr){n=++tr.got;if(n===5&&!tr.broken&&G.mult<5){G.mult++;G.maxMult=Math.max(G.maxMult,G.mult);pop("X"+G.mult+" STREAK",RED);sfx("trail",G.mult)}}
  sfx("key",{i:Math.max(0,n-1),m:G.mult})}
/* power-ups never repeat one that is already running */
function pickPU(){const a=[];if(!(G.mag>0))a.push("mag","mag");if(!G.shield)a.push("shield","shield");if(!(G.boost>0))a.push("boost");if(G.dist>300&&!(G.vox>0)&&!(G.boost>0))a.push("vox");return a.length?a[Math.random()*a.length|0]:"mag"}
function gotPU(o){o.dead=1;G.pop=.3;const k=o.k;if(k==="shield")G.shield=1;else G[k]=PU[k].dur;pop(PU[k].name,RED);if(k!=="vox")sfx("pu",k);if(k==="vox"){voxPrep();G.vtr=VTR;VC=wave(true);fountain(true);G.fxT=0;G.fxIn=true;if(!REDUCED)G.slo=SLO;pop("KEYS X2",INK);sfx("vox")}if(k==="boost")G.grace=0}
/* paper flies when an obstacle is shredded or run through */
function smash(o){o.dead=1;const x0=CX+o.lane*LW,y0=GY-(o.t==="sign"?SIGN_UP+6:12),C=DEB[o.v]||[WHITE,PAL.p,LINE,WHITE];
  for(let i=0;i<14;i++)puff(x0+rr(-12,12),y0+rr(-8,8),rr(-60,60),rr(-110,-30),rr(.5,.85),Math.random()<.5?3:2,false,C[i&3]);sfx("smash")}
function nearMiss(s){G.near++;const b=25*G.mult;G.bonus+=b;pop("CLOSE +"+b,INK);sfx("near",s)}
function update(h){
  G.t+=h;G.speed=Math.min(VMAX,V0+G.dist*ACC);const dz=G.speed*(G.boost>0?1.55:1)*h;G.dist+=dz;G.anim+=dz*.45;
  for(const o of G.objs){o.z-=dz;if(o.t==="deer"){o.lane+=o.dir*h*3.2;if(o.lane*o.dir>3.4)o.dead=1}}
  G.next-=dz;while(G.next<=0){const n0=G.objs.length;row(SPAWN+G.next);doorClear(n0);G.next+=gap()}
  G.x+=(G.lane-G.x)*Math.min(1,h*18);G.cam+=(G.x*LW*.28-G.cam)*Math.min(1,h*6);G.sq*=Math.max(0,1-h*11);
  if(G.jbuf>0)G.jbuf-=h;
  if(G.jy>0){G.vy-=GRAV*h;G.jy+=G.vy*h;if(G.jy<=0){G.jy=0;G.vy=0;burst();G.sq=-1;sfx("land");if(G.sbuf){G.sbuf=0;G.slide=SLIDE_T;G.sl0=G.t}}}
  if(G.jy===0&&G.jbuf>0){G.jbuf=0;G.slide=0;G.vy=JUMP_V;G.jy=.01;G.sq=1;sfx("jump")}
  if(G.slide>0)G.slide-=h;
  if(G.pop>0)G.pop-=h;
  if(G.boost>0){G.boost-=h;if(G.boost<=0){G.boost=0;G.grace=1.2;sfx("boostEnd")}}/* a moment to find your feet after a Fast Pass */
  if(G.grace>0)G.grace-=h;
  if(G.vox>0){G.vox-=h;if(G.vox<=0){G.vox=0;G.vtr=VTR;VC=wave(false);fountain(false);G.fxT=0;G.fxIn=false;if(!REDUCED)G.slo=SLO*.55;sfx("voxout")}}if(G.fxT<9)G.fxT+=h;if(G.vtr>0)G.vtr=Math.max(0,G.vtr-h);/* 20 s on the Other Side */
  if(G.mag>0){G.mag-=h;for(const o of G.objs)if(o.t==="key"&&!o.dead&&o.z<16&&o.z>-1)o.lane+=(G.x-o.lane)*Math.min(1,h*7)}
  dust(h);
  for(const o of G.objs){if(o.dead||o.t==="deer"||Math.abs(G.x-o.lane)>(o.t==="key"||o.t==="pu"?.55:G.boost>0||G.grace>0?.8:.42))continue;/* when charging through, clear anything you brush */
    if(o.t==="key"){if(Math.abs(o.z)<.8)gotKey(o);continue}
    if(o.t==="pu"){if(Math.abs(o.z)<.8)gotPU(o);continue}
    if(Math.abs(o.z)>.45)continue;
    if(o.t==="cab"||(o.t==="stack"&&G.jy<CLEAR)||(o.t==="sign"&&!(G.slide>0&&G.jy===0))){
      if(G.boost>0||G.grace>0){smash(o);continue}
      if(G.shield){G.shield=0;G.grace=1;G.freeze=.08;smash(o);sfx("shred");pop("SHREDDED",INK);continue}
      return hit()}}
  /* things just behind the runner: close calls, and key rows that were started but not finished */
  for(const o of G.objs){if(o.dead||o.passed||o.t==="deer"||o.z>(o.t==="key"?-.8:-.5))continue;o.passed=1;
    if(o.t==="key"){const tr=G.trs[o.tr];if(tr&&tr.got&&!tr.broken){tr.broken=true;if(G.mult>1)G.mult--}continue}
    if(o.t==="pu"||G.boost>0||G.grace>0)continue;
    const d=Math.abs(G.x-o.lane);if((d>=.42&&d<.85)||(d<.42&&((o.t==="stack"&&G.jy<CLEAR+9)||(o.t==="sign"&&G.t-G.sl0<.2))))nearMiss(Math.sign(o.lane-G.x)||1)}
  const zi=zoneOf(G.dist);if(zi!==G.zone){G.zprev=G.zone;G.zone=zi;G.zf=0;
    if(zi===4)breakout();
    else if(zi===0){G.lap++;const b=500*G.mult;G.bonus+=b;pop("VAULT OPEN +"+b,RED);sfx("vaultOpen");const px=CX+G.x*LW;for(let i=0;i<18;i++)puff(px+rr(-30,30),GY-rr(10,60),rr(-70,70),rr(-120,-20),rr(.6,1),3,false,i%3?PAL.y:WHITE)}
    else{pop(ZONES[zi].n,INK);sfx("zone",zi)}}
  if(G.zf<9)G.zf+=h;
  {const k=Math.floor(G.dist/ZL)+1,z=k*ZL-G.dist;if(k%4===0&&k*ZL<=BRK&&z<30&&G.vk!==k){G.vk=k;sfx("vault")}}
  if(G.lap===1&&G.ck<3&&G.dist>[3560,3760,3905][G.ck]){G.ck++;sfx("crack",G.ck)}/* the far wall gives, a little more each time */
  if(G.zone===4){if(G.brk<2)G.brk+=h;if(G.wt<5)G.wt+=h;if(G.dist>G.deer){G.deer=G.dist+rr(520,900);const sd=Math.random()<.5?-1:1;G.objs.push({t:"deer",lane:-sd*3.2,dir:sd,z:30+rr(0,10)});sfx("deer",sd)}}
  /* a streak has to be kept up: go too long without a key and it slips a step (skipping rows can't bank it) */
  if(G.mult>1&&G.dist-G.lk>STREAK_M){G.mult--;G.lk=G.dist;pop("STREAK X"+G.mult,MUTE);sfx("boostEnd")}
  if(!G.passedBest&&G.bestD>40&&G.dist>G.bestD){G.passedBest=true;pop("NEW BEST",RED);sfx("best")}
  if(CH&&!G.beatCh&&score()>CH.s){G.beatCh=1;pop("YOU BEAT "+chName()+"!",RED);sfx("best")}
  lbMarks()
  let j=0;for(const o of G.objs)if(o.z>ZMIN-1.5&&!o.dead)G.objs[j++]=o;G.objs.length=j}
/* through the second vault door and out of the building */
function breakout(){G.zf=9;G.woods=1;G.lap++;G.brk=0;G.wt=0;G.snap=1;G.deer=BRK+rr(260,420);const b=1000*G.mult;G.bonus+=b;pop("BROKE OUT +"+b,RED);
  if(!REDUCED)G.slo=SLO;sfx("breakout");if(!track.esc){track.esc=1;track("escaped")}if(!WSEEN){WSEEN=true;store("vk_run_woods",1)}wprep(true,G.vox>0);
  const px=CX+G.x*LW;for(let i=0;i<30;i++)puff(px+rr(-40,40),GY-rr(6,70),rr(-120,120),rr(-170,-30),rr(.7,1.2),Math.random()<.5?4:3,false,[VWALL,WHITE,"#9EA8B1",INK][i&3])}
function hit(){G.state="over";G.ph="card";G.hitT=0;G.ovs=0;lbFetch();G.freeze=.11;sfx("hit");if(TOUCH&&navigator.vibrate)try{navigator.vibrate(35)}catch(e){}
  if(G.dist>G.bestD){G.bestD=G.dist;store("vk_run_bestd",Math.round(G.dist))}
  for(const o of G.objs)o.z+=1.4;/* bounce back so what you hit stays in view */G.score=score();G.newBest=G.score>G.best;
  if(G.newBest){G.best=G.score;store("vk_run_best",G.best)}
  G.auto=autoSave();const again=TOUCH?"TAP TO RUN AGAIN":"SPACE TO RUN AGAIN";
  cards.t=null;cards.o=card([["GAME OVER",3,INK,8],["SCORE "+G.score,2,INK,6],["KEYS "+G.keys+"   STREAK X"+G.maxMult+"   CLOSE "+G.near,1,MUTE,5],[G.woods?"ESCAPED. "+Math.round(G.dist-BRK)+" M INTO THE WOODS":G.lap?"VAULTS OPENED "+G.lap:G.zone?"REACHED THE "+ZONES[G.zone].n:"THE ARCHIVE STARTS AT 500 M",1,MUTE,5],[G.newBest?"NEW BEST":"BEST "+G.best,1,G.newBest?RED:MUTE,CH?5:9]].concat(CH?[chResult().concat([9])].map(([t,c,g])=>[t,1,c,g]):[]),LB.on&&lbQual(G.score)&&!G.auto?(TOUCH?"TAP TO SIGN THE HIGH SCORES":"SPACE TO SIGN THE HIGH SCORES"):again);dirty=true}

/* ---------- drawing ---------- */
function blit(set,cx,by,s,snap){const b=set[0],w=b.width*s,h=b.height*s;if(w<.3||h<.3)return;const t=s*SS;
  let x=cx-w/2,y=by-h;
  /* anything big enough is drawn pixel-exact on whole canvas pixels (crisp); only small, distant
     objects use smoothed copies, which keeps them from shimmering as they grow */
  if(snap||t>=5){x=Math.round(x*SS);y=Math.round(y*SS);ctx.imageSmoothingEnabled=false;ctx.drawImage(b,x/SS,y/SS,Math.round(w*SS)/SS,Math.round(h*SS)/SS);ctx.imageSmoothingEnabled=true;return}
  ctx.drawImage(set[t>3.5?3:t>1.75?2:t>.9?1:0],x,y,w,h)}
/* the runner: pixel-exact, with a little squash and stretch */
function blitXY(set,cx,by,sx,sy){const b=set[0],w=Math.round(b.width*sx*SS),h=Math.round(b.height*sy*SS),x=Math.round(cx*SS-w/2),y=Math.round(by*SS)-h;
  ctx.imageSmoothingEnabled=false;ctx.drawImage(b,x/SS,y/SS,w/SS,h/SS);ctx.imageSmoothingEnabled=true}
/* a small red flag and floor line where your best run ended */
function bestFlag(){if(G.state==="title"||G.bestD<40)return;const z=G.bestD-G.dist;if(z<ZMIN-1||z>FAR)return;const q=qz(z),fy=fY(q),hw=WX*LW*q,px=1/SS;
  ctx.globalAlpha=z>FAR-16?Math.max(0,(FAR-z)/16):1;ctx.fillStyle=RED;const seg=LW*.16*q,th=Math.max(px,Math.round(q*SS*.6)/SS);
  for(let xx=-hw;xx<hw;xx+=seg*2)ctx.fillRect(Math.round((CX+xx)*SS)/SS,Math.round(fy*SS)/SS,Math.min(seg,hw-xx),th);
  const fx=CX-hw*.92,pole=34*q;ctx.fillStyle=INK;ctx.fillRect(Math.round(fx*SS)/SS,fy-pole,Math.max(px,q*.8),pole);
  ctx.fillStyle=RED;for(let i=0;i<4;i++)ctx.fillRect(Math.round(fx*SS)/SS+q*.8,fy-pole+i*2*q,(9-i*2.2)*q,2*q);ctx.globalAlpha=1}
/* ---------- where the high scores are ----------
   The board ranks scores, the hall is laid out in metres, so each marker stands where you will pass that score if you
   simply keep running (every 2 m is a point); keys get you there sooner. It appears once it is within sight and stays put.
   TOP 10: a dark gantry and a dashed line. NO. 1: a gold sign over a checkered finish line, and confetti when you take it. */
function lbMarks(){const sc=score();
  for(const k of[10,1]){const thr=G["lb"+k];if(!thr||G["mk"+k])continue;const need=thr+1-sc;
    if(need<=0){G["mk"+k]=1;if(k===1){pop("YOU'RE NO. 1!",RED);sfx("best");confetti(90);track("took no. 1")}else{pop("TOP 10!",RED);sfx("best");confetti(28);track("made top 10")}continue}
    if(!G["mkD"+k]&&need*2<FAR-6)G["mkD"+k]=G.dist+need*2}}
function confetti(n){const C=[RED,"#E2C06A","#4972AC",WHITE,"#6E9A6A","#F0388C"];
  for(let i=0;i<n;i++)puff(CX+rr(-iw*.55,iw*.55),rr(-20,ih*.35),rr(-60,60),rr(-40,80),rr(1.2,2.2),Math.random()<.5?3:2,false,C[i%C.length])}
function drawMarks(){for(const k of[10,1]){const d=G["mkD"+k];if(!d||G["mk"+k]||G.state==="title")continue;const z=d-G.dist;if(z<ZMIN-1||z>FAR)continue;
    const q=qz(z),fy=fY(q),hw=WX*LW*q,px=1/SS,one=k===1,top=fy-62*q,pw=Math.max(px,q*2.2),sn=v=>Math.round(v*SS)/SS;
    ctx.globalAlpha=z>FAR-16?Math.max(0,(FAR-z)/16):1;
    /* the line on the floor: dashed for the top 10, a two-row checkered finish line for #1 */
    const cw=LW*.12*q,th=Math.max(px,sn(q*(one?1.6:1)));
    for(let r=0;r<(one?2:1);r++)for(let i=0,xx=-hw;xx<hw;xx+=cw,i++){if(!one&&i%2)continue;ctx.fillStyle=one?((i+r)%2?WHITE:INK):INK;ctx.fillRect(sn(CX+xx),sn(fy-r*th),Math.min(cw,hw-xx),th)}
    /* the gantry: two posts and a bar over the hall, the sign in the middle */
    ctx.fillStyle=INK;for(const sg of[-1,1])ctx.fillRect(sn(CX+sg*hw*.96-pw/2),top,pw,fy-top);ctx.fillRect(sn(CX-hw*.96),top,sn(hw*1.92),pw*1.5);
    const lab=one?"NO. 1":"TOP 10",sc=Math.max(1,Math.round(q*3*SS))/SS,w=tw(lab,sc)+sc*6,h=sc*11,x0=sn(CX-w/2),y0=sn(top-h*.5);
    ctx.fillStyle=INK;ctx.fillRect(x0-sc,y0-sc,w+sc*2,h+sc*2);ctx.fillStyle=one?"#E2C06A":INK;ctx.fillRect(x0,y0,w,h);
    ctx.imageSmoothingEnabled=false;text(ctx,lab,x0+sc*3,y0+sc*3,sc,one?INK:WHITE);ctx.imageSmoothingEnabled=true}
  ctx.globalAlpha=1}
/* where the run you were sent ended: a blue flag with their name, on the other side of the hall from yours */
function rivalFlag(){if(!CH||G.state==="title"||CH.d<40)return;const z=CH.d-G.dist;if(z<ZMIN-1||z>FAR)return;const q=qz(z),fy=fY(q),hw=WX*LW*q,px=1/SS,B=PAL.p;
  ctx.globalAlpha=z>FAR-16?Math.max(0,(FAR-z)/16):1;ctx.fillStyle=B;const seg=LW*.16*q,th=Math.max(px,Math.round(q*SS*.6)/SS);
  for(let xx=-hw+seg;xx<hw;xx+=seg*2)ctx.fillRect(Math.round((CX+xx)*SS)/SS,Math.round(fy*SS)/SS,Math.min(seg,hw-xx),th);
  const fx=CX+hw*.92,pole=46*q;ctx.fillStyle=INK;ctx.fillRect(Math.round(fx*SS)/SS,fy-pole,Math.max(px,q*1.1),pole);
  ctx.fillStyle=B;for(let i=0;i<5;i++)ctx.fillRect(Math.round(fx*SS)/SS-(14-i*2.8)*q,fy-pole+i*2.4*q,(14-i*2.8)*q,2.4*q);
  const sc=Math.max(1,Math.round(q*1.6*SS))/SS;if(q>.25){const nm=chName(),tx=fx-tw(nm,sc)-q*2,ty=fy-pole-7*sc;ctx.imageSmoothingEnabled=false;ctx.fillStyle=WHITE;ctx.fillRect(tx-sc,ty-sc,tw(nm,sc)+sc*2,7*sc);text(ctx,nm,tx,ty,sc,B);ctx.imageSmoothingEnabled=true}
  ctx.globalAlpha=1}
function drawPops(){for(const p of POP){const k=p.a/.9,hs=HS,w=tw(p.t,hs),bw=Math.max(1,hs>>1),X=Math.round((gc.width-w)/2),Y=Math.round(gc.height*.1+p.row*hs*11-k*hs*3);/* top centre, clear of the lanes */
  ctx.globalAlpha=k>.6?Math.max(0,(1-k)/.4):1;ctx.fillStyle=LINE;ctx.fillRect(X-hs*2+bw*2,Y-hs*2+bw*2,w+hs*4,hs*9);ctx.fillStyle=INK;ctx.fillRect(X-hs*2,Y-hs*2,w+hs*4,hs*9);
  ctx.fillStyle=WHITE;ctx.fillRect(X-hs*2+bw,Y-hs*2+bw,w+hs*4-bw*2,hs*9-bw*2);text(ctx,p.t,X,Y,hs,p.col)}ctx.globalAlpha=1}
const zs=(P,off)=>Math.ceil((ZMIN-1+G.dist-off)/P)*P-G.dist+off;
/* the moving parts of the hallway: thin lines that glide a screen pixel at a time */
/* a flat shape on a side wall, between two depths and two heights */
function wq(sg,za,zb,h1,h2){za=Math.max(za,ZMIN-1);if(zb<=za)return;const qa=qz(za),qb=qz(zb),xa=CX+sg*WX*LW*qa,xb=CX+sg*WX*LW*qb,fa=fY(qa),fb=fY(qb);
  ctx.beginPath();ctx.moveTo(xa,fa-h1*qa);ctx.lineTo(xa,fa-h2*qa);ctx.lineTo(xb,fb-h2*qb);ctx.lineTo(xb,fb-h1*qb);ctx.fill()}
/* each zone dresses its walls: mail slots, archive shelves, framed art, steel bands */
const BOX=["#D9C9A3","#EFE8D6","#CDB98E"],ART=[RED,"#4972AC","#E2C06A"];
function decor(Z){const H=HC,d=Z.d,fr=v=>{const t=Math.sin(v)*43758.5453;return t-Math.floor(t)};
  for(let z=zs(7,0);z<FAR-6;z+=7){if(z+7<ZMIN-1)continue;const k=Math.round((G.dist+z)/7);ctx.globalAlpha=z>FAR-22?Math.max(0,(FAR-6-z)/16):1;
    for(const sg of[-1,1]){
      if(d==="mail"){ctx.fillStyle=Z.seam;wq(sg,z+1,z+6,H*.2,H*.42);/* pigeonholes, some with letters in them */
        for(let i=0;i<3;i++)for(let j=0;j<2;j++){const r=fr(k*7.1+i*3.3+j*5.7+sg);if(r<.45)continue;const a=z+1+i*5/3+.25+r*.2,h=H*(.2+j*.11);ctx.fillStyle=r>.8?"#F3E3B0":WHITE;wq(sg,a,a+.9,h+1.2,h+H*(.045+.03*r))}
        ctx.fillStyle=Z.line;for(let i=0;i<=3;i++){const a=z+1+i*5/3;wq(sg,a-.06,a+.06,H*.2,H*.42)}wq(sg,z+1,z+6,H*.31,H*.31+1.2);wq(sg,z+1,z+6,H*.2,H*.2+1.2);wq(sg,z+1,z+6,H*.42-1.2,H*.42)}
      else if(d==="shelf"){for(const h of[.1,.3,.5]){ctx.fillStyle=Z.line;wq(sg,z,z+7,H*h,H*h+1.6);
        for(let j=0;j<3;j++){const r=fr(k*12.9+j*78.2+sg*3.1+h*91);if(r>.75)continue;const a=z+.4+j*2.2+r*.6,w=.7+r*.9;ctx.fillStyle=BOX[(j+k)%3];wq(sg,a,a+w,H*h+1.6,H*(h+.07+.08*r))}}}
      else if(d==="art"){ctx.fillStyle=Z.line;wq(sg,z,z+7,H*.1,H*.1+1.2);if(k%2)continue;ctx.fillStyle=INK;wq(sg,z+2,z+5,H*.2,H*.48);ctx.fillStyle=WHITE;wq(sg,z+2.12,z+4.88,H*.2+1.4,H*.48-1.4);
        ctx.fillStyle=ART[(k/2|0)%3];wq(sg,z+2.4,z+3.5,H*.25,H*.37);ctx.fillStyle=INK;wq(sg,z+3.8,z+4.5,H*.39,H*.43)}
      else{ctx.fillStyle=Z.line;wq(sg,z,z+7,H*.12,H*.12+2);wq(sg,z,z+7,H*.5,H*.5+2);wq(sg,z+3.5,z+3.58,0,H*.8);ctx.fillStyle=PAL.M;for(let i=0;i<4;i++){const a=z+.6+i*1.75;wq(sg,a,a+.14,H*.31,H*.31+1.6)}}}}
  ctx.globalAlpha=1}
function scenery(){const x=ctx,Z=(VX?ZV:ZONES)[G.zone],px=1/SS,sn=v=>Math.round(v*SS)/SS,th=Math.max(px,Math.round(SS*.5)/SS),wd=q=>Math.max(px,sn(th*Math.min(1.6,q)));
  if(VX)vblocks(Z,sn,th);decor(Z);if(!VX)drawDoor(Z);const SP2=VX||Z.d==="art"?2.5:5;
  x.fillStyle=Z.seam;for(let z=zs(SP2,2);z<FAR;z+=SP2){const q=qz(z),y=sn(fY(q));if(y>=ih)continue;const hw=WX*LW*q;x.fillRect(sn(CX-hw),y,sn(hw*2),wd(q))}
  x.fillStyle=Z.line;for(let z=zs(4,0);z<FAR;z+=4){const za=Math.max(z,ZMIN-.2),zb=z+1.8;if(zb<=za)continue;const qa=qz(za),qb=qz(zb),ya=fY(qa),yb=fY(qb);
    for(const sg of[-1,1]){const xa=CX+sg*LW*.5*qa,xb=CX+sg*LW*.5*qb,wa=th*.8*qa,wb=th*.8*qb;x.beginPath();x.moveTo(xa-wa,ya);x.lineTo(xa+wa,ya);x.lineTo(xb+wb,yb);x.lineTo(xb-wb,yb);x.fill()}}
  for(let z=zs(7,0);z<FAR;z+=7){const q=qz(z),hw=WX*LW*q;if(hw>CX+BGM)continue;const yf=sn(fY(q)),yc=Math.max(0,sn(cY(q))),w=wd(q*1.3);x.fillRect(sn(CX-hw)-w,yc,w,yf-yc);x.fillRect(sn(CX+hw),yc,w,yf-yc)}
  x.fillStyle=Z.lamp;for(let z=zs(7,3.5);z<FAR;z+=7){const q=qz(z),y=sn(cY(q));if(y<0)continue;const hw=LW*.35*q;x.fillRect(sn(CX-hw),y,sn(hw*2),Math.max(px,sn(q*1.5)))}
  if(G.lap===1)omens(sn);if(!G.lap&&G.zone===0)exitHint(sn)}
/* the first hint that there is a way out: in the mailroom, an EXIT sign hangs at the far end of the hall. It never gets
   any closer however far you run, and before the archive it flickers and goes dark. Nothing else ever mentions it. */
function exitHint(sn){const d=G.dist;if(G.state!=="run"||d<170||d>395)return;let a=Math.min(1,(d-170)/40);
  if(d>350&&frh(Math.floor(G.t*14))<(d-350)/45)return;/* dying flicker */
  const z=36,q=qz(z),s=P0*q*2.4,b=SP.exit[0],top=Math.max(0,cY(q)),y=top+10*q+b.height*s,px=1/SS;
  ctx.globalAlpha=a;ctx.fillStyle=INK;for(const sg of[-1,1])ctx.fillRect(sn(CX+sg*b.width*s*.3),top,Math.max(px,q*.6),y-b.height*s-top);const gw=b.width*s*1.5,gh=b.height*s*1.8;if(ROOMSEEN){ctx.globalAlpha=a*.3;blit(SP.exit,CX,y,s);ctx.globalAlpha=1;return}/* once he knows, the sign is dark */ctx.globalAlpha=a*(.16+.06*Math.sin(G.t*5));ctx.fillStyle=PAL.f;ctx.fillRect(sn(CX-gw/2),sn(y-b.height*s/2-gh/2),gw,gh);ctx.globalAlpha=a;blit(SP.exit,CX,y,s);ctx.globalAlpha=1}
/* the second time round, the building starts to show the way out: EXIT signs, and light at the far end */
function omens(sn){const H=HC,px=1/SS;
  for(let z=zs(19,6);z<FAR-4;z+=19){if(z<ZMIN-1)continue;const k=Math.round((G.dist+z-6)/19),zn=zoneOf(G.dist+z);if(zn===4||zn!==3&&frh(k*.917)<.45)continue;
    if(zn===3&&frh(k*3.1+Math.floor(G.t*5))<.07)continue;/* the vault's signs flicker */
    const sg=k%2?1:-1,q=qz(z),s=P0*q*.8,b=SP.exit[0],w=b.width*s,wx=CX+sg*WX*LW*q,X=wx-sg*(w/2+2.5*q),y=fY(q)-H*.6*q;
    ctx.globalAlpha=z>FAR-20?Math.max(0,(FAR-4-z)/16):1;ctx.fillStyle=INK;const ex=X+sg*w/2;ctx.fillRect(Math.min(wx,ex),y-b.height*s*.55,Math.abs(wx-ex),Math.max(px,q*.8));blit(SP.exit,X,y,s)}
  ctx.globalAlpha=1;
  if(G.zone===3){const p=Math.max(0,Math.min(1,(G.dist-3500)/440)),qf=qz(FAR),fx=WX*LW*qf,fy=fY(qf),cy=cY(qf),wh=fy-cy;if(p<=0)return;/* daylight through cracks in the far wall */
    ctx.fillStyle="#FFF7D8";ctx.globalAlpha=.25+.6*p;const cx=CX,ln=(x0,y0,x1,y1)=>{const n=Math.ceil(Math.max(Math.abs(x1-x0),Math.abs(y1-y0))*SS);for(let i=0;i<=n;i++){const t=i/n;ctx.fillRect(sn(x0+(x1-x0)*t),sn(y0+(y1-y0)*t),px*Math.max(1,Math.round(SS*.5)),px*Math.max(1,Math.round(SS*.5)))}};
    ln(cx,cy+wh*.12,cx-fx*.12,cy+wh*.45);ln(cx-fx*.12,cy+wh*.45,cx+fx*.08,cy+wh*.7);ln(cx+fx*.08,cy+wh*.7,cx-fx*.05,fy);if(p>.4){ln(cx-fx*.12,cy+wh*.45,cx-fx*.55,cy+wh*.38);ln(cx+fx*.08,cy+wh*.7,cx+fx*.5,cy+wh*.82)}
    ctx.globalAlpha=1}}
/* the Other Side: square floor tiles and walls laid in courses of blocks, joints staggered */
function vblocks(Z,sn,th){const x=ctx,H=HC,CH=VCH,px=1/SS;
  x.fillStyle="rgba(40,52,110,.06)";for(let z=zs(2.5,2);z<34;z+=2.5){const za=Math.max(z,ZMIN-.2),zb=z+2.5,qa=qz(za),qb=qz(zb),ya=fY(qa),yb=fY(qb),r=Math.round((G.dist+z-2)/2.5)&1;
    x.beginPath();for(let c=-3;c<3;c++){if(((c+3)&1)!==r)continue;const k0=c<-2?-1.85:c<-1?-1.5:c<0?-1:c<1?0:c<2?1:1.5,k1=c<-2?-1.5:c<-1?-1:c<0?0:c<1?1:c<2?1.5:1.85;
      x.moveTo(CX+k0*LW*qa,ya);x.lineTo(CX+k1*LW*qa,ya);x.lineTo(CX+k1*LW*qb,yb);x.lineTo(CX+k0*LW*qb,yb);x.closePath()}x.fill()}
  x.fillStyle=Z.seam;
  for(let z=zs(1.75,0);z<40;z+=1.75){const q=qz(z),j=Math.round((G.dist+z)/1.75),w=Math.max(px,sn(q*.8)),fy=fY(q);
    for(const sg of[-1,1]){const X=sn(CX+sg*WX*LW*q)-(sg<0?0:w);for(let i=(j&1);i<10;i+=2){const y0=fy-H*CH*(i+1)*q,y1=fy-H*CH*i*q;x.fillRect(X,sn(y0),w,sn(y1-y0))}}}}
/* the doorway into each zone, and the round vault door every 2,000 m */
const CRK=(()=>{let sd=7;const r=()=>(sd=sd*16807%2147483647)/2147483647,a=[];for(let i=0;i<10;i++){let an=i/10*Math.PI*2+r()*.5,len=1;const p=[[Math.cos(an),Math.sin(an)]];for(let j=0;j<5;j++){an+=(r()-.5)*.9;len+=.16+r()*.24;p.push([Math.cos(an)*len,Math.sin(an)*len])}a.push(p)}return a})();
function drawBreakGate(o){const z=o.z,q=qz(z),fy=fY(q),top=Math.max(cY(q),-60),hw=WX*LW*q+1,s=1.75*LW*q/16.9,R=16.9*s,cy=fy-R*.62,t=Math.min(1,Math.max(0,(30-z)/14)),e=t*t*(3-2*t),near=Math.min(1,Math.max(0,(52-z)/44)),x=ctx;
  x.globalAlpha=z>FAR-16?Math.max(0,(FAR-z)/16):1;x.save();x.beginPath();x.rect(CX-hw,top,hw*2,fy-top);x.clip();
  x.save();x.beginPath();x.arc(CX,cy,R,0,Math.PI*2);x.clip();x.imageSmoothingEnabled=false;x.drawImage(peek(),CX-R,cy-R,R*2,R*2);x.imageSmoothingEnabled=true;x.restore();
  x.fillStyle=VX?ZV[3].end:VWALL;x.beginPath();x.rect(CX-hw,top,hw*2,fy-top);x.arc(CX,cy,R,0,Math.PI*2);x.fill("evenodd");
  const n=Math.ceil(CRK.length*near);x.lineJoin="miter";for(let i=0;i<n;i++){const P=CRK[i];x.beginPath();P.forEach(([a,b],j)=>{const X=CX+a*R*1.02,Y=cy+b*R*1.02;j?x.lineTo(X,Y):x.moveTo(X,Y)});
    x.strokeStyle=INK;x.lineWidth=Math.max(1/SS,q*1.3);x.stroke();x.strokeStyle="rgba(255,250,224,"+(.35+.6*near).toFixed(2)+")";x.lineWidth=Math.max(1/SS,q*.55);x.stroke()}
  if(e<1){x.strokeStyle="rgba(255,250,224,"+(.8*near*(1-e)).toFixed(2)+")";x.lineWidth=Math.max(1/SS,q*1.1);x.beginPath();x.arc(CX,cy,R*.94,0,Math.PI*2);x.stroke()}
  spr("ring",CX,cy+19.5*s,s,0);spr("door",CX+e*2.1*R,cy+16.5*s,s,0);x.restore();
  if(e>0){x.globalAlpha*=.22*e;x.fillStyle="#FFF9E0";for(const k of[-1,-.35,.4,1]){x.beginPath();x.moveTo(CX+k*R*.4,cy-R*.3);x.lineTo(CX+k*R*.62,cy+R*.3);x.lineTo(CX+k*R*2.4,fy+R);x.lineTo(CX+k*R*1.4,fy+R);x.fill()}}
  x.globalAlpha=z>FAR-16?Math.max(0,(FAR-z)/16):1;spr("exit",CX,cy-R-5*q,P0*q*1.25,0);x.globalAlpha=1}
function drawGate(o){if(o.k*ZL===BRK)return drawBreakGate(o);const z=o.z,q=qz(z),fy=fY(q),top=Math.max(cY(q),-60),hw=WX*LW*q+1,sn=v=>Math.round(v*SS)/SS;ctx.globalAlpha=z>FAR-16?Math.max(0,(FAR-z)/16):1;
  if(o.k%4===0){const s=1.75*LW*q/16.9,R=16.9*s,cy=fy-R*.62,t=Math.min(1,Math.max(0,(30-z)/14)),e=t*t*(3-2*t);
    ctx.save();ctx.beginPath();ctx.rect(CX-hw,top,hw*2,fy-top);ctx.clip();
    ctx.fillStyle=VX?ZV[3].end:VWALL;ctx.beginPath();ctx.rect(CX-hw,top,hw*2,fy-top);ctx.arc(CX,cy,R,0,Math.PI*2);ctx.fill("evenodd");
    spr("ring",CX,cy+19.5*s,s,0);spr("door",CX+e*2.1*R,cy+16.5*s,s,0);ctx.restore();
    spr("z3",CX,cy-R-5*q,P0*q*1.2,0)}
  else{const ow=1.62*LW*q,oh=Math.min(HC*.72,84)*q,ot=sn(fy-oh),th=Math.max(1/SS,sn(q*.9)),L=sn(CX-ow),Rr=sn(CX+ow);
    ctx.fillStyle=(VX?ZV:ZONES)[o.k%4].end;ctx.fillRect(CX-hw,top,L-(CX-hw),fy-top);ctx.fillRect(Rr,top,CX+hw-Rr,fy-top);ctx.fillRect(L,top,Rr-L,ot-top);
    ctx.fillStyle=INK;ctx.fillRect(L-th,ot-th,th,fy-ot+th);ctx.fillRect(Rr,ot-th,th,fy-ot+th);ctx.fillRect(L-th,ot-th,Rr-L+th*2,th);
    spr("z"+o.k%4,CX,ot-5*q,P0*q*1.1,0)}
  ctx.globalAlpha=1}
function drawObj(o){if(o.t==="gate")return drawGate(o);const q=qz(o.z),s=P0*q,lx=CX+o.lane*LW*q,fy=fY(q);
  ctx.globalAlpha=o.z>FAR-16?Math.max(0,(FAR-o.z)/16):1;
  if(o.t==="key"){blit(SP.sh,lx,fy+s,s*.5);spr("key",lx,fy-(10+Math.sin(G.t*5+o.z)*2.5)*q,s,o.lane)}
  else if(o.t==="pu"){const img=SP[PU[o.k].sp],b=img[0],by=fy-(13+Math.sin(G.t*4+o.z)*2)*q,cy=by-b.height*s*.65;
    blit(SP.sh,lx,fy+s,s*.7);if(o.k==="vox"){const f=.3+.7*Math.abs(Math.cos(G.t*3));ctx.save();ctx.translate(lx,0);ctx.scale(f,1);spr("pvox",0,by,s*1.3,0);ctx.restore()}else spr(PU[o.k].sp,lx,by,s*1.3,o.lane);
    /* red corner marks that breathe, so a power-up reads as special from far away */
    const e=1+Math.sin(G.t*7)*.12,w=(b.width*s*.65+4*q)*e,hh=(b.height*s*.65+4*q)*e,L=3.5*q,c=Math.max(1/SS,Math.round(q*.9*SS)/SS),sn=v=>Math.round(v*SS)/SS;ctx.fillStyle=RED;
    for(const[sx,sy]of[[-1,-1],[1,-1],[-1,1],[1,1]]){const X=sn(lx+sx*w),Y=sn(cy+sy*hh);ctx.fillRect(sx<0?X:X-L,sy<0?Y:Y-c,L,c);ctx.fillRect(sx<0?X:X-c,sy<0?Y:Y-L,c,L)}}
  else if(o.t==="deer"){const hop=Math.abs(Math.sin(o.lane*1.9))*9*q;blit(SP.sh,lx,fy+s,s*.8);ctx.save();ctx.translate(lx,0);ctx.scale(o.dir<0?-1:1,1);spr("deer",0,fy-hop,s,0);ctx.restore()}
  else if(o.t==="sign"){const img=SP[o.v],by=fy-SIGN_UP*q,top=by-img[0].height*s,yc=Math.max(0,cY(q)),lw=Math.max(.5,q);
    if(o.v==="branch"){const hw=img[0].width*s*.36,pw=Math.max(.5,q*1.6),ph=fy-by+3*q;for(const sg of[-1,1]){ctx.fillStyle=INK;ctx.fillRect(lx+sg*hw-pw/2-lw*.5,by-3*q,pw+lw,ph);ctx.fillStyle=PAL.H;ctx.fillRect(lx+sg*hw-pw/2,by-3*q,pw,ph)}}
    else if(top>yc){ctx.fillStyle=INK;if(HP[o.v]===1)ctx.fillRect(lx-lw/2,yc,lw,top-yc);else{const hw=img[0].width*s*.32;ctx.fillRect(lx-hw,yc,lw,top-yc);ctx.fillRect(lx+hw-lw,yc,lw,top-yc)}}spr(o.v,lx,by,s,o.lane)}
  else{blit(SP.sh,lx,fy+s*1.5,s*1.1);spr(o.v||o.t,lx,fy,s,o.lane)}
  ctx.globalAlpha=1}
function drawPlayer(){if(G.noPl)return;const tg=G.state==="title"&&titleGl(),px=CX+G.x*LW+(tg&&((performance.now()/45)|0)%3===0?(((performance.now()/90)|0)%2?.6:-.6):0);
  blit(SP.sh,px,GY+3,P0*Math.max(.45,1-G.jy/70));
  if(G.state!=="title")drawDust();
  if(G.state==="over"&&G.hitT<.7&&((G.hitT*14)|0)%2)return;
  const nm=G.state==="title"?(tg?"gl":"idle"):G.slide>0&&G.jy===0?(SLIDE_T-G.slide<.07||G.slide<.1?"sd0":((G.t*18)|0)&1?"sd1":"sd2"):G.jy>0?"jump":(G.anim|0)&1?"runA":"runB",img=VX?vs(nm,sdir(G.x)):SP[nm],vk=VX?VK:1;
  const bob=G.state==="run"&&G.jy===0&&!(G.slide>0)&&((G.anim|0)&1)?1:0;
  const skid=G.slide>0&&G.jy===0&&SLIDE_T-G.slide>=.07&&G.slide>=.1,sq=G.sq,ax=P0*(1-.12*sq)/vk,ay=P0*(1+.16*sq)/vk,by=GY-G.jy-bob+(skid?1:0);
  if(skid&&G.state!=="title"){const e=SLIDE_T-G.slide,L=Math.min(16,(e-.07)*70),sn=v=>Math.round(v*SS)/SS;ctx.fillStyle=DUST;/* scrape marks on the floor behind the shoes */
    for(const sd of[-1,1])for(let i=0;i<3;i++){ctx.globalAlpha=.55-i*.17;ctx.fillRect(sn(px+sd*4.5-.6),sn(GY+2+i*L/3),Math.max(1/SS,sn(1.2)),sn(L/3))}ctx.globalAlpha=1}
  const blink=G.state==="run"&&G.grace>0&&((G.t*16)|0)%2;if(blink)ctx.globalAlpha=.35;
  if(G.state==="run"&&Math.abs(G.lane-G.x)>.05){const d=Math.sign(G.lane-G.x);ctx.globalAlpha=.22;blitXY(img,px-d*LW*.12,by,ax,ay);ctx.globalAlpha=.1;blitXY(img,px-d*LW*.24,by,ax,ay);ctx.globalAlpha=blink?.35:1}
  blitXY(img,px,by,ax,ay);ctx.globalAlpha=1;
  /* a ring of blue paper bits while the Shredder is ready */
  const sn=v=>Math.round(v*SS)/SS,dot=(x,y,c,z)=>{ctx.fillStyle=c;ctx.fillRect(sn(x-z/2),sn(y-z/2),z,z)};
  if(G.shield&&G.state!=="over")for(let i=0;i<8;i++){const a=G.t*2.2+i*Math.PI/4;dot(px+Math.cos(a)*19,by-15+Math.sin(a)*6,PAL.p,i%2?2:3)}
  if(G.pop>0){const r=Math.round((.3-G.pop)*40)+5,cx=Math.round(px),cy=GY-Math.round(G.jy)-50;ctx.fillStyle=RED;ctx.fillRect(cx-r-1,cy,2,2);ctx.fillRect(cx+r-1,cy,2,2);ctx.fillRect(cx-1,cy-r,2,2)}}
/* score and keys, sized for the screen rather than the hallway */
function hud(){const s=String(G.state==="over"?G.score:score()),hs=HS,m=Math.round(hs*3.5),kp=Math.round(hs*.9);
  text(ctx,s,m,m,hs,INK);const kx=m+tw(s,hs)+hs*3;ctx.drawImage((G.vox>0?SP.keyg:SP.key)[0],kx,m+Math.round((5*hs-5*kp)/2),13*kp,5*kp);const cx2=kx+13*kp+hs*2;text(ctx,String(G.keys),cx2,m,hs,INK);if(G.mult>1)text(ctx,"X"+G.mult,cx2+tw(String(G.keys),hs)+hs*3,m,hs,G.dist-G.lk>STREAK_M-45&&((G.t*7)|0)%2?MUTE:RED);/* blinks while it is about to slip */
  const tgt=CH&&!G.beatCh&&G.state!=="over";if(tgt)text(ctx,"BEAT "+chName()+" "+commas(CH.s),m,m+hs*7,Math.max(1,Math.round(hs*.6)),MUTE);/* the score to beat, until you do */
  let y=m+hs*(tgt?11:8);for(const k of["mag","boost","shield","vox"]){const on=k==="shield"?G.shield:G[k]>0;if(!on)continue;const b=SP[PU[k].sp][0],ic=Math.max(1,Math.round(hs*.75));
    ctx.drawImage(b,m,y,b.width*ic,b.height*ic);if(k!=="shield"){const bx=m+b.width*ic+hs*2,bw=hs*18,bh=Math.max(2,hs),by=y+Math.round((b.height*ic-bh)/2);
      ctx.fillStyle=LINE;ctx.fillRect(bx,by,bw,bh);ctx.fillStyle=G[k]<1.5&&((G.t*8)|0)%2?RED:k==="vox"?PAL.p:INK;ctx.fillRect(bx,by,Math.round(bw*G[k]/PU[k].dur),bh)}y+=b.height*ic+hs*2}}
/* ---------- the title screen ----------
   The ready card, then the top ten, each for its full turn from the moment the title appears (never a flash of either),
   swapping with a quick card flip. Once you touch it (a swipe, a key), it stays on the ready card. */
const TCY=11.5,TSW=6.5,TTR=.36,HOME=!!window.VK_HOME,HT={open:0},HB={live:false,hits:[]},TB={msg:"",t:0};
function tPhase(){if(!(LB.on&&LB.top.length)||G.tHold||HT.open)return{b:0,p:1};const e=(performance.now()-(G.tt||0))/1000,ph=e%TCY;
  if(ph>=TSW)return{b:1,p:Math.min(1,(ph-TSW)/TTR)};return{b:0,p:e<TCY?1:Math.min(1,ph/TTR)}}
function titleUI(b,live){HB.live=false;if(b){LAYUP=1;drawBoard(true);LAYUP=0}else{drawCard(titleCard());if(HOME)homeBtns(live)}}
function flipUI(T){const p=T.p,a=p<.5,k=a?1-p*2:p*2-1,b=a?!T.b:T.b,sy=k*k*(3-2*k),cy=gc.height*(b?.5:.37);if(sy<.03)return;
  ctx.save();ctx.setTransform(1,0,0,sy,0,Math.round(cy*(1-sy)));titleUI(b,false);ctx.restore();ctx.setTransform(1,0,0,1,0,0)}
/* standalone page only (the hidden copy in the app shows just the card): HOW TO PLAY and INVITE, under the card */
function homeBtns(live){const cd=titleCard(),u=UC,h=(cd.h+4)*u,y=Math.round(gc.height*.37-h/2)+h+u*7,L=["HOW TO PLAY",TB.msg&&performance.now()-TB.t<2600?TB.msg:"INVITE"],gap=6*u,bh=15*u;
  const W=L.map(l=>Math.max(62*u,tw(l,u)+14*u));let x=Math.round((gc.width-(W[0]+W[1]+gap))/2);HB.hits=[];
  L.forEach((l,i)=>{const w=W[i],red=i===1;ctx.fillStyle=LINE;ctx.fillRect(x+2*u,y+2*u,w,bh);ctx.fillStyle=INK;ctx.fillRect(x,y,w,bh);ctx.fillStyle=red?RED:WHITE;ctx.fillRect(x+u,y+u,w-2*u,bh-2*u);
    text(ctx,l,x+Math.round((w-tw(l,u))/2),y+5*u,u,red?WHITE:INK);HB.hits.push({x,y,w,h:bh,a:i?doInvite:openHelp});x+=w+gap});HB.live=live}
/* the home screen's floor: the long shadow of someone in a hat, coming up from behind and reaching for you */
const PURS=["                      #  #  #           ", "                      #  #  #  #        ", "                      ## ## ## #        ", "                       #########        ", "         ###           #########        ", "        #####           ########  #     ", "      #########          ####### ##     ", "        #####             #######       ", "        #####              #####        ", "         ###               #####        ", "    ############           ######       ", "  ################       ########       ", " ###################################    ", "####################################### ", "########################################"];
function pursuer(){const W=40,H=PURS.length,room=ih-GY-6;if(room<8)return;const c=Math.min(iw*.86/W,room/H),x0=CX-W*c/2,y0=ih-H*c,sn=v=>Math.round(v*SS)/SS;
  ctx.save();ctx.setTransform(SS,0,0,SS,0,0);ctx.fillStyle="rgba(29,29,29,.14)";for(let j=0;j<H;j++){const r=PURS[j];let i=0;while(i<W){if(r[i]!=="#"){i++;continue}let k=i;while(k<W&&r[k]==="#")k++;ctx.fillRect(sn(x0+i*c),sn(y0+j*c),sn(x0+k*c)-sn(x0+i*c),sn(y0+(j+1)*c)-sn(y0+j*c));i=k}}ctx.restore()}
function homeTap(cx,cy){if(!HB.live)return false;const r=gc.getBoundingClientRect(),k=gc.width/(r.width||1),x=(cx-r.left)*k,y=(cy-r.top)*k;
  for(const h of HB.hits)if(x>=h.x&&x<h.x+h.w&&y>=h.y&&y<h.y+h.h){h.a();return true}return false}
/* standalone page: back to the home screen from a run or the board */
function goHome(){LB.me=null;SHAT=null;Object.assign(G,{state:"title",ph:"card",tt:performance.now(),tHold:0,dist:0,lane:0,x:0,jy:0,slide:0,cam:0,sq:0,freeze:0,mag:0,boost:0,shield:0,grace:0,vox:0,vtr:0,slo:0,fxT:9,zone:0,zprev:0,zf:9,lap:0,woods:0,brk:9,wt:9});
  G.objs.length=0;POP.length=0;cards.t=null;SNAP=null;lbFetch();sfx("toggle");dirty=true}
let XS=null;function homeX(){const t=G.state==="title";if(XS===t)return;XS=t;btn.style.display=t?"none":"";sbtn.style.right=t?"12px":""}
function openHelp(){HT.open=1;G.tHold=1;sfx("toggle");track("how to play");dirty=true}
/* a short card: the three moves, the four power-ups, and keys; nothing about what lies beyond the vault */
function drawHelp(){const w=170,M=[[SP.cab,TOUCH?"SWIPE LEFT OR RIGHT":"LEFT OR RIGHT","CHANGE LANES TO DODGE"],[SP.boxes,TOUCH?"SWIPE UP":"UP","JUMP OVER LOW THINGS"],[SP.files,TOUCH?"SWIPE DOWN":"DOWN","DUCK UNDER HANGING THINGS"]],
  U=[[SP.pmag,"MASTER KEY","PULLS KEYS TO YOU"],[SP.pbst,"FAST PASS","CHARGE THROUGH ANYTHING"],[SP.pshr,"SHREDDER","SURVIVES ONE CRASH"],[SP.pvox,"OTHER SIDE","KEYS COUNT DOUBLE"]],K=[SP.key,"KEYS","A FULL ROW BUILDS A STREAK"];
  const h=36+M.length*17+14+U.length*17+8+17+16,P=pen(w,h),{u,X,Y,T,C,R}=P;
  C("HOW TO PLAY",9,2,INK);let y=27;
  const row=([img,a,b],y)=>{const c=img[0],k=Math.min(26/c.width,13/c.height),iw2=Math.round(c.width*k),ih2=Math.round(c.height*k);ctx.imageSmoothingEnabled=false;
    ctx.drawImage(c,X(26-iw2/2),Y(y+7-ih2/2),iw2*u,ih2*u);T(a,46,y+1,1,INK);T(b,46,y+8,1,MUTE)};
  for(const m of M){row(m,y);y+=17}for(let x=14;x<w-8;x+=4)R(x,y+3,1,1,LINE);C("POWER-UPS",y+8,1,RED);y+=16;
  for(const m of U){row(m,y);y+=17}for(let x=14;x<w-8;x+=4)R(x,y+3,1,1,LINE);y+=8;row(K,y);
  if(blinkOn())C(TOUCH?"TAP TO CLOSE":"ANY KEY TO CLOSE",h-10,1,INK)}
/* invite before you've even run: your best as a challenge if you have one, otherwise just the game */
function inviteText(){const b=G.best||0,o=location.protocol==="https:"?location.origin:SITE;
  return b>0?"Try this game. My best is "+commas(b)+".\n"+o+"/r/"+shareCode(shareName(),b,G.bestD||0,(G.bestD||0)>=BRK):"Try this game.\n"+o+"/run"}
function doInvite(cb){const t=inviteText();sfx("toggle");track("invited",{has:G.best?"a score":"no score yet"});
  const done=m=>{TB.msg=m;TB.t=performance.now();dirty=true;if(typeof cb==="function")cb(m)},copy=()=>{const fb=()=>done(legacyCopy(t)?"COPIED":"COULDN'T COPY");
    try{if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(()=>done("COPIED"),fb);return}}catch(e){}fb()};
  if(TOUCH&&navigator.share){navigator.share({text:t.replace("\n"," ")}).then(()=>done("SENT"),e=>{if(!(e&&e.name==="AbortError"))copy()});return}copy()}
function drawCard(cd){const u=UC,w=(cd.w+4)*u,h=(cd.h+4)*u,x0=Math.round((gc.width-w)/2),y0=Math.round(gc.height*.37-h/2);ctx.drawImage(cd.imgs[0],x0,y0,w,h);
  if(performance.now()/1000*1.5%1<.68)text(ctx,cd.hint,x0+cd.hx*u,y0+cd.hy*u,u,INK)}
/* little cubes drifting up through the air on the Other Side */
const MC=[VB,"#FFFFFF","#E2C06A","#A9B8E8"];
function motes(){const x=ctx,px=1/SS;for(let i=0;i<16;i++){const a=(i*.6180339)%1,b=(i*.7548777)%1,sp=6+b*10,yy=ih+6-((G.t*sp+b*(ih+12))%(ih+12)),xx=a*iw+Math.sin(G.t*.8+i*1.7)*6,sz=1.4+b*1.8,X=Math.round(xx*SS)/SS,Y=Math.round(yy*SS)/SS;
    x.globalAlpha=.5+.3*Math.sin(G.t*2+i);x.fillStyle=MC[i&3];x.fillRect(X,Y,sz,sz);x.fillStyle="rgba(255,255,255,.75)";x.fillRect(X,Y,sz,Math.max(px,Math.round(sz*SS/3)/SS))}x.globalAlpha=1}
/* crossing over: a fountain of cubes from the runner and a quick flash; the new world spreads out from them */
function fountain(inn){const px=CX+G.x*LW,C=inn?[PAL.y,VB,WHITE,PAL.p]:[WHITE,LINE,PAPER,VB];
  for(let i=0;i<26;i++)puff(px+rr(-8,8),GY-rr(8,34),rr(-95,95),rr(-190,-50),rr(.8,1.25),Math.random()<.5?4:3,false,C[i&3])}
function burstFx(sx){if(G.fxT>.22)return;const x=ctx;x.globalAlpha=(1-G.fxT/.22)*(G.fxIn?.6:.4);x.fillStyle=G.fxIn?"#F4F6FF":WHITE;x.fillRect(0,0,gc.width,gc.height);x.globalAlpha=1}
/* a slow sheen that sweeps across the Other Side every few seconds, like light across glass */
function shine(){const x=ctx,ph=(G.t%5)/5;if(ph>.18)return;const W=gc.width,H=gc.height,p=ph/.18,c=-.35*W+p*(1.7*W),w=W*.09,sl=H*.45;
  x.globalAlpha=.22*Math.sin(Math.PI*p);x.fillStyle=WHITE;x.beginPath();x.moveTo(c-w,H);x.lineTo(c+w,H);x.lineTo(c+w+sl,0);x.lineTo(c-w+sl,0);x.fill();
  x.globalAlpha=.4*Math.sin(Math.PI*p);x.beginPath();const t=Math.max(UC,w*.08),c2=c+w*1.6;x.moveTo(c2,H);x.lineTo(c2+t,H);x.lineTo(c2+t+sl,0);x.lineTo(c2+sl,0);x.fill();x.globalAlpha=1}
/* the hallway and everything in it, in one world or the other */
function zoom(){if(REDUCED||G.fxT>=.6)return 1;return 1+(G.fxIn?.075:.045)*Math.sin(Math.PI*G.fxT/.6)}
const focus=()=>[CX+G.x*LW,GY-22];
function world(vx,sx,sy){const x=ctx;VX=vx;const z=zoom(),e=Math.round((sx-G.cam)*SS);
  if(z===1)x.setTransform(SS,0,0,SS,e,sy*SS);else{const[f,g]=focus();x.setTransform(SS*z,0,0,SS*z,e+SS*f*(1-z),sy*SS+SS*g*(1-z))}x.imageSmoothingEnabled=false;const B=z=>vx?vbv(z,G.boil):BG[z][G.boil];
  const W4=G.zone===4;if(W4)wbg(vx);else{x.drawImage(B(G.zone),-BGM,0);if(G.zf<.45){x.globalAlpha=1-G.zf/.45;x.drawImage(B(G.zprev),-BGM,0);x.globalAlpha=1}scenery()}bestFlag();if(!W4){rivalFlag();drawMarks()}
  const k=Math.floor(G.dist/ZL)+1,L=G.objs.slice();if(!W4)for(const kk of[k-1,k]){const z=kk*ZL-G.dist;if(kk>0&&kk*ZL<=BRK&&z>ZMIN-1&&z<FAR)L.push({t:"gate",k:kk,z})}
  L.sort((a,b)=>b.z-a.z);let pl=false;x.imageSmoothingEnabled=true;
  for(const o of L){if(!pl&&o.z<0){drawPlayer();pl=true}drawObj(o)}if(!pl)drawPlayer();if(W4){wfx();rivalFlag();drawMarks()}/* out in the woods it goes over the light of the hour, so it shows at night */if(vx)motes();VX=false}
function draw(){const t0=performance.now(),x=ctx;let sx=0,sy=0;if(G.state==="room"){drawRoom();if(HOME&&btn)homeX();G.frames++;G.ms+=performance.now()-t0;return}if(G.snap){G.snap=0;shat()}
  if(G.state==="over"&&G.hitT<.3){const a=(.3-G.hitT)*12;sx=Math.round((Math.random()-.5)*a);sy=Math.round((Math.random()-.5)*a)}
  x.setTransform(1,0,0,1,0,0);if(sx||sy){x.fillStyle=PAPER;x.fillRect(0,0,gc.width,gc.height)}
  const V=G.vox>0;
  if(G.vtr>0&&VC){const p=1-G.vtr/VTR;
    if(REDUCED)world(p>.5?V:!V,sx,sy);/* no flipping blocks when motion is reduced: a clean cut halfway */
    else{world(!V,sx,sy);const thr=p*1.2,cs=CELL*SS,cA=V?PAPER:VB,cB=V?VB:PAPER;x.save();x.setTransform(1,0,0,1,0,0);x.beginPath();for(const c of VC)if(c[2]<thr-.12)x.rect(c[0],c[1],cs,cs);x.clip();world(V,sx,sy);x.restore();
      x.setTransform(1,0,0,1,0,0);for(const c of VC){const ph=(thr-c[2])/.12;if(ph<=0||ph>=1)continue;const hh=Math.max(UC,Math.round(cs*Math.abs(Math.cos(ph*Math.PI)))),yy=c[1]+((cs-hh)>>1);
        x.fillStyle=INK;x.fillRect(c[0],yy,cs,hh);if(hh>UC*2){x.fillStyle=ph<.5?cA:cB;x.fillRect(c[0]+UC,yy+UC,cs-UC*2,hh-UC*2);if(hh>UC*4){x.fillStyle="rgba(255,255,255,.8)";x.fillRect(c[0]+UC,yy+UC,cs-UC*2,UC);x.fillStyle="rgba(30,40,90,.22)";x.fillRect(c[0]+UC,yy+hh-UC*2,cs-UC*2,UC)}}}}}
  else world(V,sx,sy);
  x.setTransform(1,0,0,1,0,0);x.imageSmoothingEnabled=false;
  if(G.zone===4&&SHAT&&G.brk<1.8&&G.state!=="title")drawShat();else if(G.zone===3&&G.lap===1&&G.dist>BRK-5&&G.state==="run")keepFrame();
  if(G.state==="title"&&WSEEN)titleLeaf();
  if(!REDUCED&&G.fxT<.8)burstFx(sx);
  if(V&&!(G.vtr>0)&&!REDUCED)shine();
  if(G.fin>0&&G.state==="run"){x.fillStyle="rgba(5,6,8,"+Math.min(1,G.fin/.8)+")";x.fillRect(0,0,gc.width,gc.height)}/* back from the room */
  if(G.freeze>0){x.globalAlpha=G.freeze/.11*.5;x.fillStyle=WHITE;x.fillRect(0,0,gc.width,gc.height);x.globalAlpha=1}/* hit flash */
  if(G.zone===4&&G.wt<4.3&&G.state!=="title")drawWoodsCard();
  drawPops();if(G.state!=="title")hud();
  if(HOME&&btn)homeX();
  if(G.state==="title"){pursuer();const T=tPhase();if(T.p<1)flipUI(T);else titleUI(T.b,true);if(HT.open)drawHelp()}
  else if(G.state==="over"&&G.ph==="name")drawName();else if(G.state==="over"&&G.ph==="board")drawBoard(false);
  else{const cd=G.state==="pause"?pauseCard():G.state==="over"&&G.hitT>.45?cards.o:null;if(cd)drawCard(cd)}
  if(FPSM)drawFps();
  G.frames++;G.ms+=performance.now()-t0}

/* ---------- the room that runs the game ----------
   In the mailroom there is a door, left a little open, that blends into the wall. Push him into it (left, when he's already
   in the left lane) and the run stops. Inside: server racks, a desk of monitors, and one screen as big as the far wall
   showing the hall he was just in. He walks with the same moves he runs with (up and down to walk, left and right to step),
   and every input lands on the monitors as it happens. At the desk the whole run plays back, every move of it, and he
   understands. Then he walks out (keep pressing down) and the run carries on exactly where it was. No words but one line,
   no score while you're in there, and nothing is counted anywhere. */
const DOOR_A=440,RXW=2.45,RZB=4.9,RZR=[.35,1.75,3.1],RDK=3.6,ROOM={bg:"#121519",floor:"#1A1E23",grid:"#232930",wall:"#15191D",rack:"#22282F",unit:"#2B323A",face:"#191D22"};
let ROOMSEEN=store("vk_run_room")==="1",SNAP=null;const R={};
const doorZ=()=>DOOR_A-G.dist,doorOn=()=>!G.lap&&!G.rmUsed&&G.state==="run";
function doorNear(){const z=doorZ();return doorOn()&&G.jy<20&&z>-2.2&&z<4.8}
/* keep the left lane clear for a few metres either side of the door, so getting in is about noticing it, not dodging */
function doorClear(n0){if(G.lap||G.rmUsed)return;for(let i=G.objs.length-1;i>=n0;i--){const o=G.objs[i],a=G.dist+o.z;if((o.t==="cab"||o.t==="stack"||o.t==="sign")&&o.lane===-1&&a>DOOR_A-16&&a<DOOR_A+5)G.objs.splice(i,1)}}
/* the door, on the left wall: the same paint as the wall, a thin frame, and a cold sliver of light where it's left open */
function drawDoor(Z){if(G.lap||G.zone)return;const z=doorZ();if(z<ZMIN-2||z>FAR-4)return;const H=HC,a=z,b=z+2.3,sg=-1,top=H*.4,fa=z>FAR-20?Math.max(0,(FAR-4-z)/16):1;
  ctx.globalAlpha=fa;ctx.fillStyle=Z.line;wq(sg,a-.14,b+.14,0,top+2.2);ctx.fillStyle="#E9E6DD";wq(sg,a,b,0,top);ctx.fillStyle="#DEDACF";wq(sg,a+.12,b-.12,H*.05,H*.17);wq(sg,a+.12,b-.12,H*.22,top-H*.04);
  ctx.fillStyle=Z.line;wq(sg,b-.36,b-.24,H*.18,H*.2);/* the handle */
  if(!G.rmUsed){const f=.6+.3*Math.sin(G.t*7.3)*Math.sin(G.t*2.1);ctx.fillStyle=INK;wq(sg,a-.03,a+.3,.4,top-.4);/* left open a crack, cold light inside */
    ctx.globalAlpha=fa*f;ctx.fillStyle="#9CC2EE";wq(sg,a+.04,a+.2,1,top-1);
    ctx.globalAlpha=fa*f*.6;ctx.fillStyle="#8FB4E6";const qa=qz(Math.max(a-.4,ZMIN-1)),qb=qz(a+1.6),xa=CX-WX*LW*qa,xb=CX-WX*LW*qb;ctx.beginPath();ctx.moveTo(xa,fY(qa));ctx.lineTo(xa+LW*.95*qa,fY(qa));ctx.lineTo(xb,fY(qb));ctx.fill()}/* light spilling across the floor */
  ctx.globalAlpha=1}
/* how close the door is, for its hum */
const doorHum=()=>{if(!doorOn())return 0;const z=doorZ();return z<-3||z>34?0:Math.pow(1-Math.abs(z)/34,2)};
function snapHall(){const c=mk(gc.width,gc.height),o=ctx;ctx=c.getContext("2d");ctx.imageSmoothingQuality="high";G.noPl=1;
  try{world(G.vox>0,0,0);ctx.setTransform(1,0,0,1,0,0);hud()}catch(e){}G.noPl=0;ctx=o;return c}
function enterRoom(){SNAP=snapHall();G.rmUsed=1;G.state="room";Object.assign(R,{t:0,l:0,r:0,rx:0,rz:-.9,face:0,walk:0,last:0,rep:-1,know:0,gl:0,out:-1,ml:G.lane,mx:G.lane,mj:0,ms:0,mg:0,flash:-9,seen:G.il.length,wait:0});
  POP.length=0;sfx("door");dirty=true}
function exitRoom(){G.state="run";G.objs=G.objs.filter(o=>!(o.z<26&&(o.t==="cab"||o.t==="stack"||o.t==="sign")));G.lane=-1;G.x=-1;G.fin=.8;G.slide=0;G.jy=0;G.vy=0;SNAP=null;sfx("doorOut");dirty=true}
function roomAct(a){if(a==="pause"||R.out>=0)return;const c=a==="left"?0:a==="right"?1:a==="down"?3:a==="up"||a==="go"?2:-1;if(c<0)return;
  G.il.push(c);if(G.il.length>600)G.il.shift();R.last=R.t;R.flash=R.t;R.wait=0;R.gl=0;sfx("relay",c);
  /* the runner on the big screen does what you tell it, too */
  if(c===0)R.ml=Math.max(-1,R.ml-1);else if(c===1)R.ml=Math.min(1,R.ml+1);else if(c===2&&!R.mj)R.mj=.001;else if(c===3)R.ms=.6;
  if(c===0)R.l=Math.max(-1,R.l-1);else if(c===1)R.l=Math.min(1,R.l+1);
  else if(c===2){R.face=0;if(R.r<2)R.r++}
  else{R.face=1;if(R.r>0)R.r--;else if(Math.abs(R.rz-RZR[0])<.2)R.out=0}}
function roomUpdate(dt){R.t+=dt;const tz=R.out>=0?-1.6:RZR[R.r],sp=1.9*dt,ox=R.rx,oz=R.rz;
  R.rx+=Math.max(-sp*1.2,Math.min(sp*1.2,R.l-R.rx));R.rz+=Math.max(-sp,Math.min(sp,tz-R.rz));const mv=Math.abs(R.rx-ox)+Math.abs(R.rz-oz)>1e-4;
  if(mv){R.walk+=dt;if((R.walk*4.2|0)!==((R.walk-dt)*4.2|0))sfx("rstep",R.rx)}
  R.mx+=(R.ml-R.mx)*Math.min(1,dt*14);if(R.mj>0){R.mj+=dt;if(R.mj>.6)R.mj=0}if(R.ms>0)R.ms-=dt;
  if(R.out>=0){R.out+=dt;if(R.out>.95)exitRoom();return}
  /* standing at the desk for the first time: the whole run plays back on the monitors */
  if(R.r===2&&R.rep<0&&Math.abs(R.rz-RZR[2])<.05){R.rep=0;sfx("replay",G.il.length)}
  if(R.rep>=0&&!R.know){R.rep+=dt;if(R.rep>3.4){R.know=1;R.gl=1.9;if(!ROOMSEEN){ROOMSEEN=true;store("vk_run_room",1)}sfx("know")}}
  if(R.gl>0)R.gl-=dt;
  if(!R.wait&&R.t-R.last>6){R.wait=1;sfx("wait")}}
/* a side wall of the room, like wq for the hall */
function rq(sg,za,zb,h1,h2){za=Math.max(za,ZMIN-1);if(zb<=za)return;const qa=qz(za),qb=qz(zb),xa=CX+sg*RXW*LW*qa,xb=CX+sg*RXW*LW*qb,fa=fY(qa),fb=fY(qb);
  ctx.beginPath();ctx.moveTo(xa,fa-h1*qa);ctx.lineTo(xa,fa-h2*qa);ctx.lineTo(xb,fb-h2*qb);ctx.lineTo(xb,fb-h1*qb);ctx.fill()}
/* tiny arrows: left, right, up, down */
function arrow(c,x,y,s,col){ctx.fillStyle=col;const m=c===0?[[0,0,1,0,0],[0,1,1,0,0],[1,1,1,1,1],[0,1,1,0,0],[0,0,1,0,0]]:c===1?[[0,0,1,0,0],[0,0,1,1,0],[1,1,1,1,1],[0,0,1,1,0],[0,0,1,0,0]]:c===2?[[0,0,1,0,0],[0,1,1,1,0],[1,0,1,0,1],[0,0,1,0,0],[0,0,1,0,0]]:[[0,0,1,0,0],[0,0,1,0,0],[1,0,1,0,1],[0,1,1,1,0],[0,0,1,0,0]];
  for(let j=0;j<5;j++)for(let i=0;i<5;i++)if(m[j][i])ctx.fillRect(x+i*s,y+j*s,s,s)}
const hh=v=>{const t=Math.sin(v*12.9898)*43758.5453;return t-Math.floor(t)};
function drawRoom(){const x=ctx,t=R.t,H=HC,px=1/SS,sn=v=>Math.round(v*SS)/SS;x.setTransform(SS,0,0,SS,0,0);x.imageSmoothingEnabled=false;
  const qb=qz(RZB),bx=RXW*LW*qb,by0=cY(qb),by1=fY(qb);
  x.fillStyle=ROOM.bg;x.fillRect(0,0,iw,ih);
  /* on a phone held upright the room is framed closer, so the screen and him fill it */const pz=ih>iw*1.2?1.22:1;if(pz>1)x.setTransform(SS*pz,0,0,SS*pz,SS*CX*(1-pz),SS*(ih*.42-(by0+by1)/2*pz));
  /* floor, with a grid that runs to the far wall */
  x.fillStyle=ROOM.floor;x.beginPath();const qn=qz(ZMIN-1);x.moveTo(CX-bx,by1);x.lineTo(CX+bx,by1);x.lineTo(CX+RXW*LW*qn,fY(qn));x.lineTo(CX-RXW*LW*qn,fY(qn));x.fill();
  x.fillStyle=ROOM.grid;for(let z=Math.ceil(ZMIN);z<RZB;z+=.8){const q=qz(z);x.fillRect(CX-RXW*LW*q,sn(fY(q)),RXW*LW*q*2,px)}
  for(let k=-2;k<=2;k++){const l=k*RXW/2.5;x.beginPath();x.moveTo(CX+l*LW*qb,by1);x.lineTo(CX+l*LW*qn+px,fY(qn));x.lineTo(CX+l*LW*qn-px,fY(qn));x.fill()}
  /* the far wall is one screen, showing the hall he was just in */
  x.fillStyle=ROOM.wall;x.fillRect(CX-bx,by0,bx*2,by1-by0);
  const sw=bx*2*.94,sh0=(by1-by0)*.86,sxl=CX-sw/2,syt=by0+(by1-by0)*.05;x.fillStyle=INK;x.fillRect(sxl-2,syt-2,sw+4,sh0+4);
  const fl=R.rep>=0&&!R.know?(hh(t*30|0)<.3?.55:1):hh(t*9|0)<.04?.8:1;
  if(SNAP){const ca=sw/sh0,cw=Math.min(iw,ih*ca),ch=cw/ca,cx0=CX-cw/2,cy0=Math.max(0,Math.min(ih-ch,GY-ch*.8)),k=sw/cw;
    x.imageSmoothingEnabled=true;x.globalAlpha=fl;x.drawImage(SNAP,cx0*SS,cy0*SS,cw*SS,ch*SS,sxl,syt,sw,sh0);x.globalAlpha=1;
    /* the runner on the screen, doing what you do */
    const mjy=R.mj>0?Math.sin(R.mj/.6*Math.PI)*34:0,nm=R.gl>0?"gl":R.ms>0?"slide":R.mj>0?"jump":((t*8)|0)&1?"runA":"runB",mxp=sxl+(CX+R.mx*LW-cx0)*k,myp=syt+(GY-mjy-cy0)*k;
    x.save();x.beginPath();x.rect(sxl,syt,sw,sh0);x.clip();blit(SP.sh,mxp,syt+(GY+3-cy0)*k,P0*k);blit(SP[nm],mxp,myp,P0*k);
    x.fillStyle="rgba(14,30,70,.42)";x.fillRect(sxl,syt,sw,sh0);x.fillStyle="rgba(90,150,255,.1)";x.fillRect(sxl,syt,sw,sh0);x.fillStyle="rgba(0,0,0,.22)";for(let y=syt;y<syt+sh0;y+=2)x.fillRect(sxl,y,sw,px*Math.max(1,SS/2));
    const ry=syt+((t*.25)%1)*sh0;x.fillStyle="rgba(255,255,255,.05)";x.fillRect(sxl,ry,sw,sh0*.06);x.restore()}
  /* ceiling and its cable trays */
  x.fillStyle="#0E1114";x.beginPath();x.moveTo(CX-bx,by0);x.lineTo(CX+bx,by0);const qt=Math.min(qn,(HY+2)/(HC-(GY-HY)));x.lineTo(CX+RXW*LW*qt,cY(qt));x.lineTo(CX-RXW*LW*qt,cY(qt));x.fill();
  x.fillStyle="#1D2227";for(const l of[-1.5,1.5]){x.beginPath();x.moveTo(CX+l*LW*qb-1,by0);x.lineTo(CX+l*LW*qb+1,by0);x.lineTo(CX+l*LW*qt+2,cY(qt));x.lineTo(CX+l*LW*qt-2,cY(qt));x.fill()}
  /* server racks down both walls, every light doing its own thing */
  for(const sg of[-1,1]){x.fillStyle=ROOM.wall;rq(sg,ZMIN-1,RZB,0,H*1.02);
    for(let k=0;k<4;k++){const za=.15+k*1.18,zb=za+1.05;x.fillStyle=ROOM.rack;rq(sg,za,zb,0,H*.62);x.fillStyle=ROOM.face;rq(sg,za+.07,zb-.07,H*.03,H*.6);
      for(let u=0;u<13;u++){const h1=H*(.05+u*.042);x.fillStyle=ROOM.unit;rq(sg,za+.07,zb-.07,h1,h1+px*1.2);
        for(let c=0;c<5;c++){const r=hh(k*91+u*7+c*3+sg*.5),rate=1+r*5,on=hh(r*77+((t*rate)|0))>(r>.8?.2:.55);if(!on)continue;
          x.fillStyle=r<.55?"#3CDC78":r<.75?"#F0B43C":r<.85?"#5AA0FF":RED;const a=za+.18+c*.15+r*.04;rq(sg,a,a+.06,h1+H*.012,h1+H*.022)}}}
    x.fillStyle="#0B0D10";for(let k=0;k<5;k++){const z=.1+k*1.18;rq(sg,z,z+.05,H*.62,H*1.02)}}
  /* the desk and its monitors */
  const qd=qz(RDK),qd2=qz(RDK+.6),dw=RXW*.92,dh=H*.11;
  x.fillStyle="#262C33";x.beginPath();x.moveTo(CX-dw*LW*qd,fY(qd)-dh*qd);x.lineTo(CX+dw*LW*qd,fY(qd)-dh*qd);x.lineTo(CX+dw*LW*qd2,fY(qd2)-dh*qd2);x.lineTo(CX-dw*LW*qd2,fY(qd2)-dh*qd2);x.fill();
  x.fillStyle="#1B2025";x.fillRect(CX-dw*LW*qd,fY(qd)-dh*qd,dw*LW*qd*2,dh*qd);x.fillStyle="#30373F";x.fillRect(CX-dw*LW*qd,fY(qd)-dh*qd,dw*LW*qd*2,px*1.5);
  const zm=RDK+.32,qm=qz(zm),mw=LW*.62*qm,mh=H*.085*qm,my=fY(qm)-dh*qm-mh-H*.012*qm,s1=Math.max(px,Math.round(mh/9*SS)/SS);
  const LOG=G.il,n=LOG.length,rp=R.rep>=0&&!R.know?Math.min(1,R.rep/3.2):1,shown=Math.floor(n*rp);
  [-1.55,-.78,.78,1.55].forEach((l,i)=>{const mx=CX+l*LW*qm-mw/2;x.fillStyle=INK;x.fillRect(mx-px*2,my-px*2,mw+px*4,mh+px*4);x.fillRect(CX+l*LW*qm-px*2,my+mh,px*4,H*.012*qm+px);
    x.fillStyle="#0B1A12";x.fillRect(mx,my,mw,mh);const g=R.t-R.flash<.18?"#E8FFF0":"#3CDC78";
    if(i<2){/* the inputs, newest at the bottom; at the desk the whole run scrolls past */const rows=Math.max(1,Math.floor((mh-s1)/(s1*7))),cols=Math.max(1,Math.floor((mw-s1)/(s1*7))),per=rows*cols,end=i===0?shown:Math.max(0,shown-per);
      for(let j=0;j<per;j++){const idx=end-per+j+(i===0?0:0);if(idx<0||idx>=n)continue;const cc=j%cols,rr=j/cols|0;arrow(LOG[idx],mx+s1+cc*s1*7,my+s1+rr*s1*7,s1,idx>=n-1&&R.t-R.flash<.3?"#E8FFF0":idx>=R.seen?"#9CFFC0":"#2E9E5A")}}
    else if(i===2){const v=String(Math.min(n,shown)).padStart(4,"0");text(x,v,mx+(mw-tw(v,s1))/2,my+(mh-5*s1)/2,s1,g)}
    else{x.fillStyle="#3CDC78";for(let k2=0;k2<mw/px/2;k2++){const yy=Math.sin(k2*.5+t*6)*Math.sin(k2*.13+t)*(R.t-R.flash<.4?1:.35);x.fillRect(mx+k2*px*2,my+mh/2+yy*mh*.4,px*2,px)}}});
  x.fillStyle="#2A3036";x.fillRect(CX-LW*.45*qm,fY(qm)-dh*qm-px*2,LW*.9*qm,px*2);/* keyboard */
  /* the glow of the big screen over the floor and the desk */
  const gr=x.createLinearGradient(0,by1,0,ih);gr.addColorStop(0,"rgba(120,170,240,.13)");gr.addColorStop(1,"rgba(120,170,240,0)");x.fillStyle=gr;x.fillRect(CX-bx*1.6,by1,bx*3.2,ih-by1);
  /* him */
  const q=qz(R.rz),rx=CX+R.rx*LW*q+(R.know&&R.gl<=0&&R.out<0&&hh((t*20)|0)<.12?(hh(t)<.5?-px:px):0),ry=fY(q),moving=Math.abs(R.l-R.rx)>.02||Math.abs((R.out>=0?-1.6:RZR[R.r])-R.rz)>.02;
  const fr=R.face||R.out>=0,kn=R.know?"k":"n",nm=R.gl>0&&!moving?"gl":fr?(moving?(((R.walk*4.2)|0)&1?"fa"+kn:"fb"+kn):"f0"+kn):moving?(((R.walk*4.2)|0)&1?"runA":"runB"):"idle";
  blit(SP.sh,rx,ry+P0*q,P0*q);blit(SP[nm],rx,ry-(moving&&((R.walk*4.2|0)&1)?q:0),P0*q);
  /* one line, only if you leave him standing there */
  if(R.wait&&R.out<0&&((t*1.6)|0)%2===0){const s=Math.max(1,Math.round(sw/120*SS)/SS),m="WAITING FOR INPUT",w=tw(m,s);x.fillStyle="rgba(0,0,0,.55)";x.fillRect(CX-w/2-s*3,syt+sh0*.42-s*3,w+s*6+s*4,s*11);text(x,m,CX-w/2,syt+sh0*.42,s,"#E8F0FF");x.fillStyle="#E8F0FF";x.fillRect(CX+w/2+s*2,syt+sh0*.42,s*3,s*5)}
  /* in and out through the dark */
  const fa=R.out>=0?Math.min(1,R.out/.85):Math.max(0,1-R.t/.9);if(fa>0){x.setTransform(1,0,0,1,0,0);x.fillStyle="rgba(5,6,8,"+fa+")";x.fillRect(0,0,gc.width,gc.height)}
  x.setTransform(1,0,0,1,0,0)}
/* on the title screen, once you've been in: now and then he looks back at you, and can't quite keep still */
const titleGl=(e)=>{if(!ROOMSEEN||G.state!=="title")return false;const p=performance.now()/1000%9;return p>5.6+(e||0)&&p<7.4-(e||0)};
/* ---------- loop: draws every frame while running, otherwise only when something changes ---------- */
function frame(t){raf=requestAnimationFrame(frame);if(VQ.length&&G.state==="run")voxStep(2);if(G.state==="run"&&G.zone!==4&&G.dist>BRK-600)wprep(false,false);
  if(G.state==="title"&&(WSEEN&&performance.now()/1000%11<5.1||titleGl(-.1)||tPhase().p<1||TB.msg&&performance.now()-TB.t<2700))dirty=true;const dt=last?Math.min(.05,(t-last)/1000):0;last=t;if(G.state==="run"&&dt>0)fpsNote(dt);
  G.boilT+=dt;if(G.boilT>=BOIL){G.boilT%=BOIL;G.boil=(G.boil+1)%3;dirty=true}
  if(G.state==="room"){roomUpdate(dt);dirty=true}
  else if(G.state==="run"&&G.freeze>0){G.freeze-=dt;dirty=true}
  else if(G.state==="run"){let d2=dt;if(G.slo>0){const k=G.slo/SLO;G.slo=Math.max(0,G.slo-dt);d2=dt*(.28+.72*(1-k)*(1-k))}/* time slows as you cross over, then catches up */
    if(G.fin>0)G.fin-=dt;const n=Math.max(1,Math.ceil(d2/.017)),h=d2/n;for(let i=0;i<n&&G.state==="run";i++)update(h);dirty=true}
  else if(G.state==="over"){if(G.freeze>0)G.freeze-=dt;else G.hitT+=dt;if(G.hitT<.8)dirty=true;if(!G.ovs&&G.hitT>.45){G.ovs=1;sfx("over",G.newBest)}if(G.ph==="card"&&G.hitT>1.9)lbNext()}
  if(G.state!=="pause"&&POP.length){for(const p of POP)p.a+=dt;while(POP.length&&POP[0].a>.9)POP.shift();POP.forEach((p,i)=>p.row=i);dirty=true}
  if(SND&&window.VKAudio){TK.state=G.state;TK.zone=G.zone;TK.vox=G.vox>0;TK.sp=Math.min(1,Math.max(0,(G.speed-V0)/(VMAX-V0)));TK.x=G.x;TK.mult=G.mult;TK.slo=G.slo;TK.boost=G.boost>0;TK.night=G.zone===4?WT.night:0;TK.door=doorHum();VKAudio.tick(TK)}/* the music follows the run */
  if(dirty){dirty=false;draw()}}

/* ---------- input ---------- */
function act(a){if(busy)return;if(HT.open){HT.open=0;dirty=true;return}if(a==="help"||a==="invite"){if(G.state==="title"&&HOME)(a==="help"?openHelp:doInvite)();return}
  if(G.state==="title"&&(a==="left"||a==="right"||a==="down")){G.tHold=1;dirty=true}if(a==="close"){if(!HOME)close();else if(G.state!=="title")goHome();return}if(a==="sound")return toggleSound();if(a==="share"){if(G.state==="over"&&G.ph!=="name"&&G.hitT>.6)doShare();return}if(SND){loadAudio();const A=AU();if(A)A.unlock()}
  if(G.state==="room")return roomAct(a);
  if(G.state==="title"){if(a==="go"||a==="up")start();return}
  if(G.state==="over"){if(G.ph==="name"){if(a==="go")namePress();else if(a==="left")nameMove(-1,0);else if(a==="right")nameMove(1,0);else if(a==="up")nameMove(0,-1);else if(a==="down")nameMove(0,1);return}
    if((a==="go"||a==="up")&&G.hitT>.6){if(G.ph==="card"&&LB.on&&lbQual(G.score)&&!G.auto)lbNext();else start()}return}
  if(G.state==="pause"){if(a==="go"||a==="up"||a==="pause"){G.state="run";sfx("resume");dirty=true}return}
  if(a==="pause"){G.state="pause";sfx("pause");dirty=true}
  else if(a==="left"){if(G.il)G.il.push(0);if(G.lane>-1){G.lane--;sfx("lane",-1)}else if(doorNear())enterRoom()}
  else if(a==="right"){if(G.il)G.il.push(1);if(G.lane<1){G.lane++;sfx("lane",1)}}
  else if(a==="up"||a==="go"){if(G.il)G.il.push(2);G.jbuf=.14}
  else if(a==="down"){if(G.il)G.il.push(3);if(G.jy>0){G.vy=-FALL_V;G.sbuf=1}else{if(!(G.slide>0)){G.sq=-.35;sfx("slide");burst()}G.slide=SLIDE_T;G.sl0=G.t;G.jbuf=0}}}
const KEYS={ArrowLeft:"left",KeyA:"left",ArrowRight:"right",KeyD:"right",ArrowUp:"up",KeyW:"up",Space:"go",Enter:"go",ArrowDown:"down",KeyS:"down",Escape:"close",KeyP:"pause",KeyM:"sound",KeyC:"share",KeyH:"help",KeyI:"invite"};
function onKey(e){if(G.state==="over"&&G.ph==="name"&&!busy&&nameKey(e)){e.preventDefault();e.stopPropagation();return}if(HT.open&&!e.repeat){e.preventDefault();e.stopPropagation();HT.open=0;dirty=true;return}const a=KEYS[e.code]||(e.key==="Escape"?"close":null);e.stopPropagation();if(a||e.key==="Tab")e.preventDefault();if(!a||(e.repeat&&a!=="close"))return;act(a)}
function onDown(e){if(e.target.closest&&e.target.closest("button"))return;p0={x:e.clientX,y:e.clientY,done:false,home:HB.live};e.preventDefault()}
function onMove(e){if(!p0||p0.done)return;const dx=e.clientX-p0.x,dy=e.clientY-p0.y;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;p0.done=true;act(Math.abs(dx)>Math.abs(dy)?(dx<0?"left":"right"):(dy<0?"up":"down"))}
function onUp(){if(p0&&!p0.done){if(HT.open){HT.open=0;dirty=true}else if(G.state==="title"&&!busy&&p0.home&&homeTap(p0.x,p0.y)){}else if(G.state==="over"&&G.ph==="name"&&!busy)nameTap(p0.x,p0.y);else if(!(G.state==="over"&&G.ph==="board"&&!busy&&shareTap(p0.x,p0.y)))act("go")}p0=null}
const stop=e=>e.preventDefault();
function onBlur(){if(G.state==="run"){G.state="pause";dirty=true}}
function onVis(){if(document.hidden)onBlur()}
function onResize(){clearTimeout(rzT);rzT=setTimeout(()=>{if(root&&!busy)size()},120)}
function listen(on){const f=on?"addEventListener":"removeEventListener";
  window[f]("keydown",onKey,true);window[f]("resize",onResize);window[f]("blur",onBlur);document[f]("visibilitychange",onVis);
  root[f]("pointerdown",onDown);root[f]("pointermove",onMove);root[f]("pointerup",onUp);root[f]("pointercancel",onUp);
  root[f]("wheel",stop,{passive:false});root[f]("touchmove",stop,{passive:false})}

/* ---------- open and close: the screen breaks into blocks between app and game ---------- */
const CSS=`.vkg{position:fixed;inset:0;z-index:90;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;outline:0}
.vkg canvas{position:absolute;left:0;top:0;image-rendering:crisp-edges;image-rendering:pixelated}
.vkg-c{visibility:hidden}.vkg.on .vkg-c{visibility:visible}.vkg-d{display:none;pointer-events:none}
.vkg-x{position:absolute;top:calc(12px + env(safe-area-inset-top,0px));right:12px;width:44px;height:44px;border:2px solid ${INK};border-radius:4px;background:#fff;box-shadow:3px 3px 0 ${LINE};display:grid;place-items:center;cursor:pointer;padding:0;visibility:hidden}
html.vkg-lock{overflow:hidden!important;scrollbar-gutter:auto!important}
.vkg-s{right:68px}.vkg.on .vkg-x{visibility:visible}.vkg-x:hover{background:${PAPER}}.vkg-x:focus-visible{outline:3px solid #1e4a8666;outline-offset:2px}`;
const px7=(r,c)=>`<svg width="16" height="14" viewBox="0 0 8 7" shape-rendering="crispEdges" aria-hidden="true"><path fill="${c||INK}" d="${r.map(([x,y,w,h])=>`M${x} ${y}h${w}v${h}h-${w}z`).join("")}"/></svg>`;
const SPK=[[0,2,2,3],[2,1,1,5],[3,0,1,7]],SON=px7(SPK.concat([[5,2,1,3],[6,1,1,1],[6,5,1,1],[7,2,1,3]])),SOFF=px7(SPK.concat([[5,2,1,1],[7,2,1,1],[6,3,1,1],[5,4,1,1],[7,4,1,1]]),MUTE);
let sbtn=null;
function toggleSound(){SND=!SND;store("vk_run_sound",SND?1:0);paintSound();if(SND){if(window.VKAudio){VKAudio.unlock();sfx("toggle")}else loadAudio(true)}else if(window.VKAudio)VKAudio.suspend()}
function paintSound(){if(!sbtn)return;sbtn.innerHTML=SND?SON:SOFF;sbtn.setAttribute("aria-pressed",SND);sbtn.setAttribute("aria-label",SND?"Sound on":"Sound off")}
const XSVG=`<svg width="14" height="14" viewBox="0 0 7 7" shape-rendering="crispEdges" aria-hidden="true"><path fill="${INK}" d="${[0,1,2,3,4,5,6].map(i=>`M${i} ${i}h1v1h-1zM${6-i} ${i}h1v1h-1z`).join("")}"/></svg>`;
function wave(inn){const cw=Math.ceil(iw/CELL),ch=Math.ceil(ih/CELL),[f,g]=focus(),fx=(f-G.cam)/CELL,fy=g/CELL,a=[];let m=0;
  for(let j=0;j<ch;j++)for(let i=0;i<cw;i++){const d=Math.hypot(i+.5-fx,(j+.5-fy)*1.25);m=Math.max(m,d);a.push([i*CELL*SS,j*CELL*SS,d])}
  for(const c of a){const k=c[2]/m;c[2]=(inn?k:1-k)+Math.random()*.05}return a}
function cells(){const cw=Math.ceil(iw/CELL),ch=Math.ceil(ih/CELL),R=Math.hypot(cw/2,ch/2),a=[];
  for(let j=0;j<ch;j++)for(let i=0;i<cw;i++)a.push([i*CELL*SS,j*CELL*SS,Math.hypot(i+.5-cw/2,j+.5-ch/2)/R+Math.random()*.3]);return a.sort((p,q)=>p[2]-q[2])}
function blocks(list,dur,each,done){let k=0;const t0=performance.now();
  const step=t=>{const p=Math.min(1,(t-t0)/dur),m=Math.round(list.length*p*p*(3-2*p));while(k<m)each(list[k++]);if(p<1)tr=requestAnimationFrame(step);else{tr=0;done()}};tr=requestAnimationFrame(step)}
function shown(){dc.style.display="none";root.classList.add("on");document.documentElement.classList.add("vkg-lock");/* hide the page scrollbar under the game */busy=false;root.focus({preventScroll:true});last=0;dirty=true;raf=requestAnimationFrame(frame)}
function open(){if(root||busy)return;busy=true;prevFocus=document.activeElement;sprites();
  if(!document.getElementById("vkg-css")){const st=document.createElement("style");st.id="vkg-css";st.textContent=CSS;document.head.appendChild(st)}
  root=document.createElement("div");root.className="vkg";root.tabIndex=-1;root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");root.setAttribute("aria-label","Vault Run, a small hidden game. Press Escape to go back.");
  gc=mk(1,1);gc.className="vkg-c";ctx=gc.getContext("2d",{alpha:false,desynchronized:true});dc=mk(1,1);dc.className="vkg-d";dctx=dc.getContext("2d");
  btn=document.createElement("button");btn.type="button";btn.className="vkg-x";btn.setAttribute("aria-label","Close the game");btn.innerHTML=XSVG;btn.onclick=()=>act("close");
  sbtn=document.createElement("button");sbtn.type="button";sbtn.className="vkg-x vkg-s";sbtn.title="Sound (M)";sbtn.onclick=()=>{act("sound");root.focus({preventScroll:true})};paintSound();
  XS=null;/* standalone: the X goes home, and hides on the home screen (see homeX) */
  root.append(gc,dc,sbtn,btn);document.body.appendChild(root);
  G.state="title";G.ph="card";G.tt=performance.now();G.tHold=0;lbFetch();G.objs.length=0;G.dist=0;G.lane=0;G.x=0;G.jy=0;G.slide=0;G.cam=0;G.sq=0;G.freeze=0;G.mag=G.boost=G.shield=G.grace=G.vox=G.vtr=G.slo=0;G.fxT=9;G.zone=0;G.zf=9;POP.length=0;size();draw();listen(true);if(SND){loadAudio();const A=AU();if(A){A.unlock();sfx("open")}}
  if(REDUCED)return shown();
  dc.style.display="block";blocks(cells(),300,c=>dctx.drawImage(gc,c[0],c[1],CELL*SS,CELL*SS,c[0],c[1],CELL*SS,CELL*SS),shown)}
function close(){if(!root||busy)return;busy=true;cancelAnimationFrame(raf);raf=0;sfx("close");
  const done=()=>{document.documentElement.classList.remove("vkg-lock");listen(false);root.remove();root=gc=ctx=dc=dctx=btn=sbtn=null;if(window.VKAudio)setTimeout(()=>{if(!root)VKAudio.suspend()},450);BG=[];cards={};G.objs.length=0;G.state="title";HT.open=0;p0=null;busy=false;
    if(prevFocus&&prevFocus.isConnected&&prevFocus.focus)prevFocus.focus({preventScroll:true});prevFocus=null};
  if(REDUCED)return done();
  dctx.clearRect(0,0,dc.width,dc.height);dctx.drawImage(gc,0,0);dc.style.display="block";root.classList.remove("on");document.documentElement.classList.remove("vkg-lock");
  blocks(cells(),240,c=>dctx.clearRect(c[0],c[1],CELL*SS,CELL*SS),done)}

window.VKGame={open,close,get running(){return !!raf},get state(){return root?G.state:"closed"},stats:()=>({frames:G.frames,ms:G.ms,iw,ih}),_G:G,_draw:()=>draw(),_pop:pop,_SP:SP,_sprites:sprites,_voxPrep:voxPrep,_cells:()=>{VC=wave(true)},_LB:LB,_share:()=>shareText(),_CH:CH,help(){if(!root)open();HT.open=1;G.tHold=1;dirty=true},invite:cb=>doInvite(cb),_invite:()=>inviteText(),_SETS:SETS,_step:h=>update(h),_R:R,_room:()=>enterRoom()};
})();
