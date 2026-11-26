'use strict';
const cv=document.getElementById('c');ctx=cv.getContext('2d');
let W=960;const H=540,FT=315,FB=520;
let VS=1; // CSS pixels per game unit
/* Game height is always 540 units; width follows the screen shape so it fills any screen.
   The canvas backing store uses the real device pixels, so everything stays sharp. */
function fit(){
  const iw=innerWidth,ih=innerHeight;
  W=Math.round(clamp(H*iw/ih,860,1400));
  VS=Math.min(iw/W,ih/H);
  cv.style.width=Math.round(W*VS)+'px';cv.style.height=Math.round(H*VS)+'px';
  // sharp but bounded: at most 2x device pixels and at most 2560 px wide (keeps phones/4K screens fast)
  let k=VS*Math.min(window.devicePixelRatio||1,2);
  if(W*k>2560)k=2560/W;
  cv.width=Math.round(W*k);cv.height=Math.round(H*k);
}
addEventListener('resize',fit);
function toggleFS(){try{if(!document.fullscreenElement)document.documentElement.requestFullscreen();else document.exitFullscreen();}catch(e){}}
cv.addEventListener('dblclick',toggleFS);

/* ================= INPUT ================= */
const keys={},pressed={};
addEventListener('keydown',e=>{
  if(!keys[e.code])pressed[e.code]=true;keys[e.code]=true;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Slash','Quote','Backspace'].includes(e.code))e.preventDefault();
  if(e.code==='KeyF'&&!e.repeat&&(state!=='play'||G.paused))toggleFS();
  initAudio();
});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
/* Mouse & touch for menus: each screen registers clickable boxes while it draws (hit), clicks are checked against them */
const UI={hits:[],mx:-1,my:-1,down:false};
function hit(x,y,w,h,fn,fn2){UI.hits.push({x,y,w,h,fn,fn2});}
function overBox(x,y,w,h){return UI.mx>=x&&UI.mx<=x+w&&UI.my>=y&&UI.my<=y+h;}
function toGame(e){const r=cv.getBoundingClientRect();return [(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height];}
function findHit(x,y){for(let i=UI.hits.length-1;i>=0;i--){const b=UI.hits[i];if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)return b;}return null;}
cv.addEventListener('pointerdown',e=>{
  initAudio();const [x,y]=toGame(e);UI.mx=x;UI.my=y;UI.down=true;const b=findHit(x,y);
  if(b){e.preventDefault();(e.button===2&&b.fn2?b.fn2:b.fn)();}
});
cv.addEventListener('pointermove',e=>{const [x,y]=toGame(e);UI.mx=x;UI.my=y;cv.style.cursor=findHit(x,y)?'pointer':'default';});
cv.addEventListener('pointerleave',()=>{UI.mx=UI.my=-1;cv.style.cursor='default';});
cv.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('pointerup',()=>{UI.down=false;});
const CTRL=[
  {up:['KeyW'],down:['KeyS'],left:['KeyA'],right:['KeyD'],a:['KeyJ'],k:['KeyK'],l:['KeyL'],sw:['KeyQ']},
  {up:['ArrowUp'],down:['ArrowDown'],left:['ArrowLeft'],right:['ArrowRight'],a:['Numpad1','Comma'],k:['Numpad2','Period'],l:['Numpad3','Slash'],sw:['Numpad0','Semicolon']}
];
/* Gamepads: first connected pad = P1, second = P2 */
let padState=[{},{}],padPrev=[{},{}],padCount=0;
function pollPads(){
  let list=[];
  try{list=Array.from(navigator.getGamepads?navigator.getGamepads():[]).filter(p=>p&&p.connected);}catch(e){}
  padCount=list.length;
  for(let i=0;i<2;i++){
    padPrev[i]=padState[i];
    const p=list[i],s={};
    if(p){
      const ax=p.axes[0]||0,ay=p.axes[1]||0,b=n=>!!(p.buttons[n]&&p.buttons[n].pressed);
      s.left=ax<-0.4||b(14);s.right=ax>0.4||b(15);s.up=ay<-0.4||b(12);s.down=ay>0.4||b(13);
      s.a=b(0);s.k=b(2)||b(4)||b(6);s.l=b(1)||b(5)||b(7);s.sw=b(3);s.start=b(9);s.back=b(8);s.b=b(1);
    }
    padState[i]=s;
  }
  if((!AC||AC.state!=='running')&&padState.some(s=>s&&Object.values(s).some(Boolean)))initAudio(); // gamepad players never press a key
}
const padTap=(p,b)=>!!(padState[p][b]&&!padPrev[p][b]);
const held=(p,b)=>CTRL[p][b].some(c=>keys[c])||!!padState[p][b];
const tap=(p,b)=>CTRL[p][b].some(c=>pressed[c])||padTap(p,b);
addEventListener('gamepadconnected',()=>{});
const KL={KeyW:'W',KeyA:'A',KeyS:'S',KeyD:'D',KeyJ:'J',KeyK:'K',KeyL:'L',KeyQ:'Q',Comma:',',Period:'.',Slash:'/',Semicolon:';'};
try{if(navigator.keyboard&&navigator.keyboard.getLayoutMap)navigator.keyboard.getLayoutMap().then(m=>{for(const k in KL){const v=m.get(k);if(v)KL[k]=v.toUpperCase();}}).catch(()=>{});}catch(e){}

/* ================= AUDIO ================= */
let AC=null;
/* the browser only lets sound start after the player touches something, and it may pause it later
   (gamepad-only play, phones, switching windows) — so every input tries to wake it up again */
function initAudio(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}
  if(AC&&AC.state!=='running'&&AC.resume)try{AC.resume().catch(()=>{});}catch(e){}}
for(const ev of ['pointerdown','touchend','mousedown','keydown'])addEventListener(ev,()=>initAudio(),{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')initAudio();});
function beep(f,d,type,v,slide){if(!AC||SET.vol<=0)return;v=(v||0.05)*SET.vol;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);g.gain.setValueAtTime(v||0.05,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d);}
function noise(d,v){if(!AC||SET.vol<=0)return;v=(v||0.08)*SET.vol;const n=Math.floor(AC.sampleRate*d),b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);const s=AC.createBufferSource(),g=AC.createGain();s.buffer=b;g.gain.value=v||0.08;s.connect(g);g.connect(AC.destination);s.start();}
const SFX={
  hit:()=>noise(0.07,0.06),swing:()=>beep(320,0.08,'triangle',0.04,-160),arrow:()=>beep(900,0.07,'sine',0.035,-500),
  fire:()=>beep(220,0.2,'sawtooth',0.035,-120),coin:()=>beep(1250,0.07,'square',0.025,400),hurt:()=>beep(170,0.15,'square',0.05,-80),
  boom:()=>noise(0.35,0.12),skill:()=>beep(500,0.25,'triangle',0.06,500),buy:()=>beep(700,0.12,'square',0.05,300),
  no:()=>beep(140,0.15,'square',0.05),down:()=>beep(300,0.5,'sawtooth',0.05,-250),heal:()=>beep(600,0.3,'sine',0.06,600)
};
let lastHitSnd=0,lastCoinSnd=0;

fit();

/* ================= DATA ================= */
const JOIN_EVERY=2; // a new letter joins the team every 2 levels
const ED={
  goblin:{hp:40,spd:2.1,dmg:8,range:42,atkCd:55,gold:4,look:{sc:.8,body:'#6b4a2b',dark:'#3d2a18',skin:'#7fb04a',head:'goblin',weapon:'club'}},
  skeleton:{hp:58,spd:1.6,dmg:10,range:50,atkCd:65,gold:5,look:{sc:1,body:'#d9d4c0',dark:'#bdb8a4',skin:'#e6e1cf',head:'skull',weapon:'esword',ribs:true}},
  orc:{hp:180,spd:1.15,dmg:18,range:64,atkCd:85,gold:10,look:{sc:1.35,body:'#5b3b2a',dark:'#2f2a20',skin:'#4f7a3a',head:'orc',weapon:'axe'}},
  darcher:{hp:48,spd:1.5,dmg:10,range:360,atkCd:110,gold:6,ranged:true,look:{sc:.95,body:'#4b2a5a',dark:'#2a1833',skin:'#9a8aa8',head:'dhood',weapon:'bow'}}
};
const LV=[
  {name:'المرحلة 1: المغرب',bg:0,types:['goblin','snake','goblin','skeleton','snake'],boss:'ملك الغيلان',blook:{body:'#5a3a20',dark:'#3a2410',skin:'#6fa040',weapon:'club'}},
  {name:'المرحلة 2: الجزائر',bg:1,types:['goblin','skeleton','scorpion','darcher','snake'],boss:'عملاق الرمال',blook:{body:'#8a4b22',dark:'#4a2810',skin:'#c9a26a',weapon:'hammer'}},
  {name:'المرحلة 3: تونس',bg:5,types:['snake','skeleton','bat','darcher','scorpion'],boss:'حارس الأسوار',blook:{body:'#2a4a6a',dark:'#16283a',skin:'#a0b8c8',weapon:'sword',cape:'#1f6f8b'}},
  {name:'المرحلة 4: ليبيا',bg:3,types:['scorpion','skeleton','orc','bat','darcher'],boss:'سيد الكهف',blook:{body:'#3a2d4a',dark:'#1f1828',skin:'#7d6a8f',weapon:'hammer'}},
  {name:'المرحلة 5: مصر',bg:6,types:['croc','scorpion','darcher','snake','orc'],boss:'جني الواحة',blook:{body:'#1f5a5a',dark:'#0f3030',skin:'#7fd0c0',weapon:'axe'}},
  {name:'المرحلة 6: لبنان',bg:2,types:['bat','orc','eagle','skeleton','eagle'],boss:'غول الثلج',blook:{body:'#5f7f9a',dark:'#33475a',skin:'#cfe3ef',weapon:'axe'}},
  {name:'المرحلة 7: سوريا',bg:9,types:['eagle','croc','darcher','orc','scorpion'],boss:'تاجر الظلام',blook:{body:'#5a2a5a',dark:'#2e142e',skin:'#b08aa0',weapon:'axe',cape:'#3a103a'}},
  {name:'المرحلة 8: العراق',bg:7,types:['croc','dragon','orc','eagle','darcher'],boss:'العملاق الأزرق',blook:{body:'#2a5aa0',dark:'#163060',skin:'#9fc8f0',weapon:'hammer'}},
  {name:'المرحلة 9: عُمان',bg:8,types:['eagle','croc','dragon','golem','bat'],boss:'قرصان البحر',blook:{body:'#203a4a',dark:'#101e28',skin:'#c9a27a',weapon:'sword',cape:'#8a1a1a'}},
  {name:'المرحلة 10: اليمن',bg:10,types:['dragon','golem','orc','scorpion','eagle'],boss:'غول النار',blook:{body:'#5a1a0a',dark:'#2a0a04',skin:'#ff7a3a',weapon:'axe'}},
  {name:'المرحلة 11: الربع الخالي',bg:4,types:['dragon','golem','croc','eagle','darcher'],boss:'سيد الظلام',blook:{body:'#1a1020',dark:'#0a0610',skin:'#7a2a2a',weapon:'sword',cape:'#600'}}
];

/* ================= STATE ================= */
let state='menu',G=null;
const UPK=['dmg','hp','sk','spd','arm','crit'],UPMAX=20; // shop rows: power, health, skills, speed, armour, critical
const upg=HEROES.map(()=>({dmg:0,hp:0,sk:0,spd:0,arm:0,crit:0}));
let gold=0;
const menu={sel:0,p2sel:1,mode:new URLSearchParams(location.search).get('mode')==='1'?1:0}; // mode 0 = alone, 1 = with a friend
const MAX_FIELD=4; // letters on screen at the same time; the others wait on the bench
let FOUND=[0];
try{const v=JSON.parse(localStorage.getItem('atlasFound')||'[0]');if(Array.isArray(v))FOUND=v.filter(i=>Number.isInteger(i)&&i>=0&&i<HEROES.length);}catch(e){}
if(!FOUND.includes(0))FOUND.unshift(0);FOUND.sort((a,b)=>a-b);
function discover(i){if(FOUND.includes(i))return;FOUND.push(i);FOUND.sort((a,b)=>a-b);try{localStorage.setItem('atlasFound',JSON.stringify(FOUND));}catch(e){}}
function nextLetter(have){for(let i=0;i<HEROES.length;i++)if(!have.includes(i))return i;return null;}
const shop={hero:0,row:1,from:'play'};

/* each level adds a little: 20 levels of health or power = double, 20 levels of skills = half the wait and +80% strength */
function hMax(h){return Math.round(h.def.hp*(1+0.05*upg[h.idx].hp));}
function hCrit(h){return 0.015*upg[h.idx].crit;}
function hDmg(h){const c=Math.random()<hCrit(h);if(c&&G)addText(h.x,h.y,96,'ضربة حرجة!','#ffd24a');return h.def.dmg*(1+0.05*upg[h.idx].dmg)*(h.buffT>0?1.5:1)*(c?1.8:1);}
function hCd(h,base){return Math.round(base*(1-0.025*upg[h.idx].sk));}
function hPow(h){return 1+0.04*upg[h.idx].sk;}
function hSpd(h){return h.def.spd*(1+0.015*upg[h.idx].spd);}
function hArm(h){return 1-0.015*upg[h.idx].arm;}

function makeHero(i,ctrl){
  return {kind:'hero',def:HEROES[i],idx:i,ctrl,x:0,y:0,z:0,face:1,hp:1,cdA:0,cdK:0,cdL:0,atkT:0,atkMax:1,
    walk:0,moving:false,down:false,downT:0,flash:0,inv:0,buffT:0,dashT:0,spinT:0,kx:0,dashSet:null};
}
function startGame(){startStage(menu.sel);}
function startLevel(n){
  Object.assign(G,{level:n,cam:0,enemies:[],proj:[],fx:[],pick:[],zones:[],texts:[],cps:[520,1040,1560,2080],bossX:2600,end:3100,readyT:0,fightT:0,osel:0,psel:0,
    cpi:0,lock:null,queue:[],spawnT:0,boss:null,bossDone:false,doneT:0,goT:0,overT:0,paused:false,banner:{t:200,s:LV[n].name}});
  let joined=null;
  if(n>0&&n%JOIN_EVERY===0&&!PROG.joins[n]){ // a new letter appears every JOIN_EVERY levels
    PROG.joins[n]=1;
    const i=nextLetter(FOUND);
    if(i!=null){
      const p2=G.p2wait&&!G.roster.some(o=>o.ctrl===1),h=makeHero(i,p2?1:'bot');if(p2)G.p2wait=false;
      G.roster.push(h);discover(i);joined=h;
      if(G.heroes.length<MAX_FIELD){G.heroes.push(h);PROG.team=G.heroes.map(o=>o.idx);}
      else{const b=G.heroes.findIndex(o=>o.ctrl==='bot');if(b>=0){G.bench.push(G.heroes[b]);G.heroes[b]=h;}else G.bench.push(h);}
    }
  }
  for(const h of G.roster){Object.assign(h,{z:0,lz:0,down:false,cdA:0,cdK:0,cdL:0,buffT:0,dashT:0,spinT:0,castT:0,atkT:0,hurtT:0,shieldT:0,leapT:0,combo:0,shots:0,inv:60,kx:0,face:1,tgt:null,swapCd:0});h.hp=hMax(h);}
  G.heroes.forEach((h,i)=>{h.x=110+i*40;h.y=FT+25+(i%3)*75;});
  if(joined){
    G.banner.t=260;
    if(G.heroes.includes(joined)){joined.z=460;joined.inv=160;G.banner.sub='✨ حرف جديد انضم ليك: '+joined.def.name+' ✨';}
    else G.banner.sub='✨ حرف جديد: '+joined.def.name+' — كيتسناك فالاحتياط ('+KL.KeyQ+' باش تبدل) ✨';
  }
  // story: a chapter when a letter is freed, and the gate before the last level
  let slides=[],title='';
  if(joined){G.met=(G.met||0)+1;slides=storyMeet(joined.idx,G.met,COUNTRY[n].c);saveProg();title='✨ لقيتي حرف: '+joined.def.name;}
  if(n===LV.length-1&&!PROG.gate){PROG.gate=1;G.gate=true;saveProg();slides=slides.concat(storyGate());if(!title)title='🏰 قلعة الظلام';}
  state='play';
  if(slides.length)playStory(slides,()=>{state='play';},title);
}
function swapIn(h,p){ // a player swaps his letter with the first one waiting on the bench
  const i=G.heroes.indexOf(h),nh=G.bench.shift();
  Object.assign(nh,{ctrl:p,x:h.x,y:h.y,z:300,lz:0,face:h.face,inv:120,down:false,atkT:0,dashT:0,spinT:0,leapT:0,hurtT:0,castT:0,tgt:null,swapCd:frame+150});
  if(nh.hp<=0)nh.hp=Math.round(hMax(nh)*0.5);
  h.ctrl='bot';h.tgt=null;G.heroes[i]=nh;G.bench.push(h);
  ring(h.x,h.y,60,'#ffffff',18);addText(nh.x,nh.y,130,'⇄ '+nh.def.name,'#fff');SFX.skill();
}
function genWave(n,w){
  const L=LV[n],q=[],count=Math.round((5+n*1.1+w*2)*(0.62+0.12*G.heroes.length));
  for(let i=0;i<count;i++)q.push(L.types[Math.floor(Math.random()*L.types.length)]);
  if(w===3)q.push('orc');
  return q;
}
function makeEnemy(type,x,y){
  /* every land is tougher: more health, harder hits, faster and quicker to strike — and from the 3rd land some golden elites */
  const n=G.level,d=ED[type],elite=n>=2&&Math.random()<0.04+0.025*n,m=(1+0.26*n)*DIFF().hp*(elite?1.8:1);
  const look=elite?Object.assign({},d.look,{sc:d.look.sc*1.18}):d.look;
  return {kind:'enemy',type,d,look,elite,spdM:1+0.03*n,cdM:Math.max(0.6,1-0.035*n),x,y,z:0,vz:0,hp:d.hp*m,maxHp:d.hp*m,dmg:d.dmg*(1+0.17*n)*DIFF().dmg*(elite?1.3:1),face:-1,
    cd:rnd(30,80),wind:0,stun:0,slow:0,kx:0,flash:0,walk:0,moving:false,atkT:0,atkMax:1,spdJ:rnd(0.85,1.15),offY:rnd(-20,20),dead:false};
}
function spawnEnemy(type){
  const side=Math.random()<0.75?1:-1;
  const x=side>0?G.cam+W+40:G.cam-40;
  G.enemies.push(makeEnemy(type,x,rnd(FT+10,FB-10)));
}
function spawnBoss(){
  const n=G.level,L=LV[n],m=(1+0.42*n)*(0.4+0.12*G.heroes.length)*DIFF().hp;
  const look=Object.assign({sc:2.0,head:'boss'},L.blook);
  const b={kind:'enemy',type:'boss',isBoss:true,name:L.boss,d:{spd:1.3+0.12*n,range:95,gold:0},look,
    x:G.bossX+380,y:(FT+FB)/2,z:0,vz:0,hp:1400*m,maxHp:1400*m,dmg:14*(1+0.18*n)*DIFF().dmg,face:-1,cd:0,wind:0,stun:0,slow:0,kx:0,flash:0,
    walk:0,moving:false,atkT:0,atkMax:1,bs:'walk',bt:0,acd:100,dead:false};
  G.enemies.push(b);G.boss=b;
  G.banner={t:160,s:'⚠ '+L.boss+' ⚠'};SFX.boom();G.shake=8;
}

/* ================= COMBAT ================= */
function addText(x,y,z,s,col){G.texts.push({x,y,z,s,col,life:45});}
function part(x,y,z,col,n,spd,size,life){spd=spd||2;size=size||4;life=life||30;for(let i=0;i<n;i++)G.fx.push({t:'p',x,y,z,vx:rnd(-spd,spd),vy:rnd(-spd,spd)*0.3,vz:rnd(0,spd*1.5),col,size:rnd(size*0.6,size),life:rnd(life*0.6,life),max:life});}
function ring(x,y,r,col,life){life=life||20;G.fx.push({t:'ring',x,y,r,col,life,max:life});}

function hurtEnemy(e,dmg,dir,kb){
  if(e.dead)return;
  dmg=Math.max(1,Math.round(dmg*rnd(0.9,1.1)));
  e.hp-=dmg;e.flash=6;e.kx=dir*kb*(e.isBoss?0.12:1);
  if(!e.isBoss&&kb>8&&e.z<=0){e.vz=4;e.z=0.1;}
  addText(e.x+rnd(-10,10),e.y,80*e.look.sc,''+dmg,'#ffe066');
  part(e.x,e.y,40*e.look.sc,e.type==='skeleton'?'#eee':'#c22',4,2.5,4,25);
  if(frame-lastHitSnd>3){SFX.hit();lastHitSnd=frame;}
  if(e.hp<=0)killEnemy(e);
}
function killEnemy(e){
  e.dead=true;TUT.kills++;
  const n=e.isBoss?10:e.elite?3:1; // one coin for every monster (more for elites and the boss), plus the reward when the stage is won
  for(let i=0;i<n;i++)G.pick.push({type:'coin',x:e.x,y:e.y,z:20,vz:rnd(3,8),vx:rnd(-3.5,3.5),val:1,t:0});
  if(!e.isBoss&&Math.random()<0.07)G.pick.push({type:'heart',x:e.x,y:e.y,z:20,vz:5,vx:0,t:0});
  part(e.x,e.y,30,e.type==='skeleton'?'#e8e3d0':'#8a1a1a',12,3.5,5,35);
  if(e.isBoss){
    G.bossDone=true;G.shake=18;SFX.boom();
    for(let i=0;i<5;i++)ring(e.x,e.y,120+i*40,'#ffd24a',30+i*6);
    part(e.x,e.y,60,'#ffd24a',40,6,6,50);
    for(const o of G.enemies)if(!o.dead&&o!==e)killEnemy(o);
    G.banner={t:200,s:'هزمتو '+e.name+'!'};
  }
}
function meleeHit(h,range,w,dmg,kb,stun,hitSet){
  let n=0;
  for(const e of G.enemies){
    if(e.dead)continue;
    const dx=(e.x-h.x)*h.face,er=e.isBoss?40:0;
    if(dx>-18&&dx<range+er&&Math.abs(e.y-h.y)<w+(e.isBoss?22:0)){
      if(hitSet){if(hitSet.has(e))continue;hitSet.add(e);}
      hurtEnemy(e,dmg,h.face,kb);
      if(stun)e.stun=Math.max(e.stun,e.isBoss?Math.round(stun/3):stun);
      n++;
    }
  }
  return n;
}
function areaHit(x,y,r,dmg,kb,fn){
  let n=0;
  for(const e of G.enemies){
    if(e.dead)continue;
    const dx=e.x-x,dy=(e.y-y)*1.8,rr2=r+(e.isBoss?40:0);
    if(dx*dx+dy*dy<rr2*rr2){hurtEnemy(e,dmg,Math.sign(dx)||1,kb);if(fn)fn(e);n++;}
  }
  return n;
}
function hurtHero(h,dmg,dir){
  if(h.down||h.inv>0||state!=='play')return;
  if(h.def.id==='guard'&&h.face===-dir)dmg*=0.6;
  dmg*=hArm(h);
  dmg=Math.max(1,Math.round(dmg));
  h.hp-=dmg;h.flash=8;h.hurtT=26;h.kx=dir*4;h.inv=22;
  addText(h.x,h.y,80,'-'+dmg,'#ff6b6b');SFX.hurt();
  part(h.x,h.y,45,'#d33',4,2,4,20);
  if(h.hp<=0){
    h.hp=0;h.down=true;h.downT=480;SFX.down();
    addText(h.x,h.y,100,'طاح!','#ff9');
    if(G.heroes.every(o=>o.down))G.overT=100;
  }
}

/* ================= HERO ACTIONS ================= */
function heroAttack(h){
  h.cdA=h.def.atkCd;h.atkT=h.atkMax=(h.def.id==='knight'?20:h.def.id==='ain'?10:16);
  const d=hDmg(h);
  switch(h.def.id){
    case 'knight':{SFX.swing();h.combo=(h.combo||0)+1;const big=h.combo%3===0; // trait: every 3rd hit is double
      if(meleeHit(h,h.def.range+(big?12:0),32,d*(big?2:1),big?10:5)&&big)addText(h.x,h.y,115,'x2','#9cc8ff');
      G.fx.push({t:'slash',x:h.x+h.face*30,y:h.y,face:h.face,r:big?54:42,col:big?'#9cc8ff':'#fff',life:9,max:9});break;}
    case 'ain':{SFX.swing();const crit=Math.random()<0.25; // trait: 25% critical hit
      if(meleeHit(h,h.def.range,30,d*(crit?2:1),crit?8:3)&&crit){addText(h.x,h.y,115,'حرجة!','#ff6b6b');G.shake=Math.max(G.shake,3);}
      G.fx.push({t:'slash',x:h.x+h.face*28,y:h.y,face:h.face,r:36,col:crit?'#ff6b6b':'#ffc8e8',life:7,max:7});break;}
    case 'guard':SFX.swing();if(meleeHit(h,h.def.range,34,d,7))G.shake=Math.max(G.shake,3);G.fx.push({t:'slash',x:h.x+h.face*32,y:h.y,face:h.face,r:46,col:'#ffcc88',life:9,max:9});break;
    case 'archer':{SFX.arrow();h.shots=(h.shots||0)+1;const g=h.shots%4===0; // trait: every 4th dot is golden and pierces
      G.proj.push({type:'arrow',own:1,x:h.x+h.face*22,y:h.y,z:60,vx:h.face*13,vy:0,dmg:d*(g?1.4:1),life:60,r:10,gold:g,pierce:g});break;}
    case 'mage':SFX.fire();G.proj.push({type:'fire',own:1,burn:true,x:h.x+h.face*26,y:h.y,z:70,vx:h.face*8,vy:0,dmg:d,life:70,r:12});break;
    case 'baa':SFX.arrow();G.proj.push({type:'arrow',own:1,col:LET[4].col,x:h.x+h.face*22,y:h.y,z:10,vx:h.face*11,vy:0,dmg:d,life:60,r:10});break;
  }
}
function skillK(h){
  h.cdK=hCd(h,h.def.k.cd);const d=hDmg(h)*hPow(h);SFX.skill();
  switch(h.def.id){
    case 'knight':h.spinT=h.spinMax=36;h.atkT=0;areaHit(h.x,h.y,115,d*2,10);ring(h.x,h.y,115,'#9fd0ff',18);part(h.x,h.y,40,'#cfe8ff',14,4,4,20);break;
    case 'archer':h.atkT=16;h.atkMax=16;for(const vy of [-2.2,0,2.2])G.proj.push({type:'arrow',own:1,x:h.x+h.face*22,y:h.y,z:46,vx:h.face*14,vy,dmg:d*1.4,life:60,r:10,pierce:true,gold:true});break;
    case 'mage':h.atkT=16;h.atkMax=16;areaHit(h.x,h.y,165,d*1.2,6,e=>{e.slow=220;});ring(h.x,h.y,165,'#7fe0ff',24);part(h.x,h.y,30,'#bff4ff',24,5,5,35);break;
    case 'baa':h.atkT=16;h.atkMax=16;
      for(const o of G.heroes){if(o.down)continue;const mh=hMax(o);o.hp=Math.min(mh,o.hp+Math.round(mh*0.25*hPow(h)));ring(o.x,o.y,40,'#9df0b8',24);part(o.x,o.y,50,'#9df0b8',8,2,4,30);}
      SFX.heal();addText(h.x,h.y,100,'بلسم الشفاء!','#9df0b8');break;
    case 'ain':h.leapT=h.leapMax=30;h.inv=Math.max(h.inv,32);break;
    case 'guard':h.atkT=16;h.atkMax=16;meleeHit(h,125,42,d*1.6,15,80);G.shake=Math.max(G.shake,7);ring(h.x+h.face*60,h.y,70,'#ffd28a',16);SFX.boom();break;
  }
}
function skillL(h){
  h.cdL=hCd(h,h.def.l.cd);const d=hDmg(h)*hPow(h);SFX.skill();
  switch(h.def.id){
    case 'knight':h.dashT=16;h.inv=24;h.dashSet=new Set();break;
    case 'archer':h.atkT=16;h.atkMax=16;h.castT=h.castMax=30;G.zones.push({x:h.x+h.face*230,y:h.y,r:130,t:100,dmg:d*0.9});break;
    case 'mage':{
      h.atkT=16;h.atkMax=16;
      const list=G.enemies.filter(e=>!e.dead&&Math.abs(e.x-h.x)<560).sort((a,b)=>Math.abs(a.x-h.x)-Math.abs(b.x-h.x)).slice(0,4);
      for(const e of list){hurtEnemy(e,d*3,Math.sign(e.x-h.x)||1,3);e.stun=Math.max(e.stun,e.isBoss?8:25);G.fx.push({t:'bolt',x:e.x,y:e.y,z:e.isBoss?120:50,life:14,max:14});}
      if(list.length){SFX.boom();G.shake=Math.max(G.shake,6);}
      break;}
    case 'baa':h.atkT=16;h.atkMax=16;
      for(const o of G.heroes){o.inv=Math.max(o.inv,200);o.shieldT=200;ring(o.x,o.y,46,'#8fe0ff',26);}
      SFX.heal();addText(h.x,h.y,110,'درع الباء!','#8fe0ff');break;
    case 'ain':{h.atkT=16;h.atkMax=16;G.flashT=14;SFX.boom();G.shake=Math.max(G.shake,6);
      for(const e of G.enemies){if(e.dead||e.x<G.cam-20||e.x>G.cam+W+20)continue;e.stun=Math.max(e.stun,e.isBoss?45:130);hurtEnemy(e,d*1.6,Math.sign(e.x-h.x)||1,2);ring(e.x,e.y,36,'#ff8ad0',20);}
      addText(h.x,h.y,115,'نظرة العين!','#ff8ad0');break;}
    case 'guard':
      for(const o of G.heroes){
        if(o.down){o.down=false;o.hp=Math.round(hMax(o)*0.35);o.inv=90;addText(o.x,o.y,100,'رجع!','#7f7');}
        else o.hp=Math.min(hMax(o),o.hp+Math.round(hMax(o)*0.3));
        o.buffT=360;ring(o.x,o.y,40,'#ffd24a',25);
      }
      ring(h.x,h.y,200,'#ffd24a',30);SFX.heal();addText(h.x,h.y,110,'صرخة الحرب!','#ffd24a');
      break;
  }
}

/* ================= INPUT -> HERO ================= */
function playerInput(p){
  return {mx:(held(p,'right')?1:0)-(held(p,'left')?1:0),my:(held(p,'down')?1:0)-(held(p,'up')?1:0),a:held(p,'a'),k:held(p,'k'),l:held(p,'l')};
}
function aliveHeroes(){return G.heroes.filter(h=>!h.down);}
function nearestEnemy(h,maxd){
  let best=null,bd=maxd;
  for(const e of G.enemies){if(e.dead)continue;if(e.x<G.cam-70||e.x>G.cam+W+70)continue;const d=Math.abs(e.x-h.x)+Math.abs(e.y-h.y)*1.5;if(d<bd){bd=d;best=e;}}
  return best;
}
function countNear(x,y,r){let n=0;for(const e of G.enemies){if(e.dead)continue;const dx=e.x-x,dy=(e.y-y)*1.8;if(dx*dx+dy*dy<r*r)n+=e.isBoss?3:1;}return n;}
function botTarget(h){
  let best=null,bs=1e9;const melee=h.def.type==='melee';
  for(const e of G.enemies){
    if(e.dead||e.x<G.cam-40||e.x>G.cam+W+40)continue;
    const dx=e.x-h.x,dy=e.y-h.y;let sc=Math.abs(dx)+Math.abs(dy)*1.5;
    if(!melee&&e.d.ranged)sc*=0.6;              // shooters go for enemy archers first
    if(melee&&e.hp<e.maxHp*0.3)sc*=0.75;        // finish weak enemies
    if(e.isBoss)sc*=0.9;
    for(const o of G.heroes)if(o!==h&&!o.down&&o.hp<hMax(o)*0.45&&Math.abs(e.x-o.x)<100&&Math.abs(e.y-o.y)<40)sc*=0.5; // protect hurt friends
    for(const o of G.heroes)if(o!==h&&o.tgt===e&&!e.isBoss)sc+=70; // don't all crowd the same enemy
    if(e===h.tgt)sc*=0.8;                        // keep focus
    if(sc<bs){bs=sc;best=e;}
  }
  return best;
}
function botInput(h){
  const inp={mx:0,my:0,a:false,k:false,l:false,faceTo:0};
  const id=h.def.id,mh=hMax(h),slot=G.heroes.indexOf(h);
  // support powers work even with no enemy around
  if(id==='guard'&&h.cdL<=0&&G.heroes.some(o=>o.down||o.hp<hMax(o)*0.35))inp.l=true;
  if(id==='baa'&&h.cdK<=0&&G.heroes.some(o=>!o.down&&o.hp<hMax(o)*0.6))inp.k=true;
  // dodge enemy arrows / orbs coming at me
  let dodge=0;
  for(const p of G.proj){if(p.own)continue;const dx=p.x-h.x;if(Math.sign(dx)===-Math.sign(p.vx)&&Math.abs(dx)<170&&Math.abs(p.y-h.y)<26){dodge=p.y>=h.y?-1:1;break;}}
  // grab a heart when hurt
  if(h.hp<mh*0.55){
    const hr=G.pick.find(c=>c.type==='heart'&&Math.abs(c.x-h.x)<380);
    if(hr){inp.mx=Math.abs(hr.x-h.x)>8?Math.sign(hr.x-h.x):0;inp.my=dodge||(Math.abs(hr.y-h.y)>8?Math.sign(hr.y-h.y):0);return inp;}
  }
  const e=botTarget(h);h.tgt=e;
  if(!e){ // no enemy: keep formation near the team, melee in front, shooters behind, and keep moving forward
    const lead=G.heroes.find(o=>o.ctrl!=='bot'&&!o.down)||G.heroes.find(o=>!o.down);
    if(lead&&lead!==h){
      const tx=lead.x+(h.def.type==='melee'?40:-70)-slot*12,ty=clamp(lead.y+[-60,60,-110,110][slot%4],FT,FB);
      if(Math.abs(tx-h.x)>25)inp.mx=Math.sign(tx-h.x);
      if(Math.abs(ty-h.y)>15)inp.my=Math.sign(ty-h.y);
    }else inp.mx=1;
    if(dodge)inp.my=dodge;
    return inp;
  }
  const dx=e.x-h.x,dy=e.y-h.y,adx=Math.abs(dx),dir=Math.sign(dx)||1;
  // boss attacks: get out of the way
  if(e.isBoss&&(e.bs==='slam')&&Math.hypot(dx,dy*1.8)<200){inp.mx=-dir;inp.my=dy>0?-1:1;return inp;}
  if(e.isBoss&&e.bs==='charge'&&Math.abs(dy)<45){inp.my=dy>0?-1:1;}
  // low health: step back toward friends unless a heal is coming
  const healer=G.heroes.some(o=>o!==h&&!o.down&&(o.def.id==='baa'&&o.cdK<=0||o.def.id==='guard'&&o.cdL<=0));
  if(h.hp<mh*0.28&&!healer&&!e.isBoss){
    inp.mx=-dir;inp.my=dodge||(Math.abs(dy)<40?(dy>0?-1:1):0);
    if(h.def.type!=='melee'&&Math.abs(dy)<24&&adx<h.def.range){inp.a=true;inp.faceTo=dir;inp.mx=-dir;}
    return inp;
  }
  if(h.def.type==='melee'){
    const want=h.def.range*0.65+(e.isBoss?35:0),side=h.x<e.x?-1:1;
    const tx=e.x+side*want,ty=e.y+((slot%3)-1)*12;     // attack from my own side, a bit offset from friends
    if(Math.abs(tx-h.x)>6)inp.mx=Math.sign(tx-h.x);
    if(Math.abs(ty-h.y)>8)inp.my=Math.sign(ty-h.y);
    if(adx<h.def.range+(e.isBoss?35:0)&&Math.abs(dy)<28){inp.faceTo=dir;inp.a=true;}
  }else{
    const near=nearestEnemyDist(h),want=260;
    if(near<150)inp.mx=-Math.sign(nearestEnemyDx(h))||-dir;   // kite away from whoever is too close
    else if(adx<want-70)inp.mx=-dir;else if(adx>want+90)inp.mx=dir;
    if(Math.abs(dy)>8)inp.my=Math.sign(dy);
    if(Math.abs(dy)<24&&adx<h.def.range){inp.a=true;inp.faceTo=dir;}
  }
  if(dodge)inp.my=dodge;
  const near=countNear(h.x,h.y,130);
  if(id==='knight'){if(h.cdK<=0&&near>=2)inp.k=true;if(h.cdL<=0&&adx<220&&Math.abs(dy)<22&&countNear(h.x+dir*110,h.y,110)>=2){inp.l=true;inp.faceTo=dir;}}
  if(id==='archer'){if(h.cdK<=0&&inp.a&&countNear(h.x+dir*200,h.y,160)>=2)inp.k=true;if(h.cdL<=0&&countNear(h.x+dir*230,h.y,130)>=3){inp.l=true;inp.faceTo=dir;}}
  if(id==='mage'){if(h.cdK<=0&&countNear(h.x,h.y,160)>=2)inp.k=true;if(h.cdL<=0&&(G.enemies.length>=3||e.isBoss))inp.l=true;}
  if(id==='guard'){if(h.cdK<=0&&inp.a&&(near>=2||e.isBoss))inp.k=true;}
  if(id==='baa'){if(h.cdL<=0&&(e.isBoss||countNear(h.x,h.y,220)>=4)&&G.heroes.some(o=>!o.down&&o.hp<hMax(o)*0.5))inp.l=true;}
  if(id==='ain'){if(h.cdK<=0&&adx>110&&adx<260&&Math.abs(dy)<30){inp.k=true;inp.faceTo=dir;}if(h.cdL<=0&&(countNear(h.x,h.y,420)>=4||e.isBoss&&e.bs!=='rest'))inp.l=true;}
  return inp;
}
function nearestEnemyDist(h){let b=1e9;for(const e of G.enemies){if(e.dead)continue;const d=Math.hypot(e.x-h.x,(e.y-h.y)*1.5);if(d<b)b=d;}return b;}
function nearestEnemyDx(h){let b=1e9,r=0;for(const e of G.enemies){if(e.dead)continue;const d=Math.hypot(e.x-h.x,(e.y-h.y)*1.5);if(d<b){b=d;r=e.x-h.x;}}return r;}
function updHero(h){
  if(h.flash>0)h.flash--;if(h.hurtT>0)h.hurtT--;if(h.inv>0)h.inv--;if(h.buffT>0)h.buffT--;if(h.spinT>0)h.spinT--;if(h.castT>0)h.castT--;if(h.shieldT>0)h.shieldT--;
  if(h.kx){h.x+=h.kx;h.kx*=0.8;if(Math.abs(h.kx)<0.2)h.kx=0;}
  if(h.z>0){h.z=Math.max(0,h.z-10);if(h.z===0){ring(h.x,h.y,90,LET[h.idx].light,26);part(h.x,h.y,10,LET[h.idx].col,18,4,5,30);G.shake=Math.max(G.shake,7);SFX.boom();}return;}
  if(h.down){
    if(--h.downT<=0&&aliveHeroes().length){h.down=false;h.hp=Math.round(hMax(h)*0.4);h.inv=120;addText(h.x,h.y,100,'رجع!','#7f7');}
    h.x=clamp(h.x,G.cam+20,G.cam+W-20);return;
  }
  if(h.def.id==='baa'&&frame%60===0){ // trait: heals nearby letters a little every second
    for(const o of G.heroes){if(o.down||Math.hypot(o.x-h.x,(o.y-h.y)*1.5)>180)continue;const mh=hMax(o);if(o.hp<mh){o.hp=Math.min(mh,o.hp+Math.ceil(mh*0.025));part(o.x,o.y,60,'#9df0b8',2,1,4,25);}}
  }
  if(h.leapT>0){
    h.leapT--;const pr=1-h.leapT/h.leapMax;h.lz=Math.sin(pr*Math.PI)*95;h.x+=h.face*6.5;h.moving=false;
    if(h.leapT===0){h.lz=0;areaHit(h.x,h.y,115,hDmg(h)*2.4*hPow(h),8,e=>{e.stun=Math.max(e.stun,e.isBoss?10:50);});
      ring(h.x,h.y,115,'#ff8ad0',22);part(h.x,h.y,8,'#ffc8e8',16,4,5,26);G.shake=Math.max(G.shake,8);SFX.boom();}
    h.y=clamp(h.y,FT,FB);h.x=clamp(h.x,G.cam+20,G.cam+W-20);return;
  }
  const inp=h.ctrl==='bot'?botInput(h):playerInput(h.ctrl);
  h.cdA--;h.cdK--;h.cdL--;if(h.atkT>0)h.atkT--;
  if(h.dashT>0){
    h.dashT--;h.x+=h.face*10;h.moving=true;h.walk+=0.5;
    meleeHit(h,45,32,hDmg(h)*2.5*hPow(h),7,0,h.dashSet);
    if(frame%2===0)part(h.x-h.face*10,h.y,40,'#9fd0ff',2,1,5,15);
  }else{
    const sp=hSpd(h)*(h.atkT>0&&h.def.type==='melee'?0.35:1)*(h.buffT>0?1.15:1)*(G.lock===null&&!G.enemies.length?1.3:1);
    if(G.readyT>0){inp.a=inp.k=inp.l=false;}
    let mx=inp.mx,my=inp.my;if(mx&&my){mx*=0.75;my*=0.75;}
    h.x+=mx*sp;h.y+=my*sp*0.75;
    if(inp.mx)h.face=inp.mx>0?1:-1;
    if(inp.faceTo)h.face=inp.faceTo;
    h.moving=!!(inp.mx||inp.my);if(h.moving)h.walk+=0.28;
    if(inp.a&&h.cdA<=0&&h.spinT<=0)heroAttack(h);
    if(inp.k&&h.cdK<=0)skillK(h);
    if(inp.l&&h.cdL<=0)skillL(h);
  }
  h.y=clamp(h.y,FT,FB);h.x=clamp(h.x,G.cam+20,G.cam+W-20);
}

/* ================= ENEMIES ================= */
function nearestHero(e){
  let best=null,bd=1e9;
  for(const h of G.heroes){if(h.down)continue;const d=Math.abs(h.x-e.x)+Math.abs(h.y-e.y)*1.5;if(d<bd){bd=d;best=h;}}
  return best;
}
function enemyStrike(e){
  e.atkT=12;e.atkMax=12;
  if(e.d.ranged){const f=e.d.proj==='efire';f?SFX.fire():SFX.arrow();G.proj.push({type:f?'efire':'earrow',own:0,x:e.x+e.face*(f?34:18),y:e.y,z:f?96:44,vx:e.face*(f?6:7),vy:0,dmg:e.dmg,life:130,r:f?12:8});return;}
  SFX.swing();
  for(const h of G.heroes){if(h.down)continue;const dx=(h.x-e.x)*e.face;if(dx>-10&&dx<e.d.range+12&&Math.abs(h.y-e.y)<28)hurtHero(h,e.dmg,e.face);}
}
function updEnemy(e){
  if(e.flash>0)e.flash--;if(e.atkT>0)e.atkT--;
  if(e.kx){e.x+=e.kx;e.kx*=0.82;if(Math.abs(e.kx)<0.2)e.kx=0;}
  if(e.z>0){e.z+=e.vz;e.vz-=0.6;if(e.z<=0){e.z=0;e.vz=0;}}
  e.moving=false;
  if(e.slow>0){e.slow--;if(frame%10===0)part(e.x,e.y,50,'#bff4ff',1,0.5,3,20);}
  if(e.burn>0){e.burn--;if(frame%4===0)part(e.x,e.y,45,'#ff8a20',1,0.6,4,18);if(e.burn%25===0){hurtEnemy(e,e.burnD,0,0);if(e.dead)return;}}
  if(e.stun>0){e.stun--;return;}
  if(e.isBoss){if(G.readyT>0){const tx=G.lock+W*0.22;e.face=-1;if(Math.abs(e.x-tx)>4){e.x+=Math.sign(tx-e.x)*2.2;e.moving=true;e.walk+=0.12;}return;}updBoss(e);return;}
  const t=nearestHero(e);if(!t)return;
  const sp=e.d.spd*e.spdJ*(e.spdM||1)*(e.slow>0?0.45:1);
  e.cd--;
  if(e.wind>0){e.wind--;if(e.wind===0)enemyStrike(e);return;}
  const dx=t.x-e.x,dy=t.y-e.y;
  e.face=dx>0?1:-1;
  let mx=0,my=0;
  if(e.d.ranged){
    const adx=Math.abs(dx);
    if(adx<200)mx=-Math.sign(dx);else if(adx>320)mx=Math.sign(dx);
    if(Math.abs(dy)>8)my=Math.sign(dy);
    if(Math.abs(dy)<30&&adx<e.d.range&&e.cd<=0&&!G.readyT){e.wind=28;e.cd=e.d.atkCd*(e.cdM||1);}
  }else{
    if(Math.abs(dx)<e.d.range&&Math.abs(dy)<22){if(e.cd<=0&&!G.readyT){e.wind=24;e.cd=e.d.atkCd*(e.cdM||1);}}
    else{
      const tx=t.x-Math.sign(dx||1)*e.d.range*0.7,ty=t.y+e.offY*0.3;
      if(Math.abs(tx-e.x)>4)mx=Math.sign(tx-e.x);
      if(Math.abs(ty-e.y)>4)my=Math.sign(ty-e.y);
    }
  }
  if(!e.entered){mx=e.x<G.cam+W/2?1:-1;}
  e.x+=mx*sp;e.y+=my*sp*0.7;
  if(mx||my){e.moving=true;e.walk+=0.22*e.spdJ;}
  e.y=clamp(e.y,FT,FB);
  if(!e.entered&&e.x>G.cam+30&&e.x<G.cam+W-30)e.entered=true;
  e.x=e.entered?clamp(e.x,G.cam+25,G.cam+W-25):clamp(e.x,G.cam-80,G.cam+W+80);
}
function updBoss(b){
  const t=nearestHero(b);if(!t)return;
  const dx=t.x-b.x,dy=t.y-b.y,enraged=b.hp<b.maxHp/2;
  b.acd-=enraged?2:1;
  const sp=b.d.spd*(b.slow>0?0.5:1)*(enraged?1.3:1);
  switch(b.bs){
    case 'walk':
      b.face=dx>0?1:-1;
      if(Math.abs(dx)>85){b.x+=Math.sign(dx)*sp;b.moving=true;}
      if(Math.abs(dy)>6){b.y+=Math.sign(dy)*sp*0.6;b.moving=true;}
      if(b.moving)b.walk+=0.12;
      if(b.acd<=0){
        const opts=['slam','charge'];if(G.level>=1)opts.push('orbs');if(G.level>=2)opts.push('summon');
        let c=opts[Math.floor(Math.random()*opts.length)];
        if(Math.abs(dx)<150&&Math.random()<0.5)c='slam';
        b.bs=c;b.bt=c==='slam'?50:c==='charge'?40:c==='orbs'?40:50;
        if(c==='charge'){b.cdir=dx>0?1:-1;b.face=b.cdir;b.cy=t.y;}
      }
      break;
    case 'slam':
      if(--b.bt<=0){
        G.shake=12;SFX.boom();ring(b.x,b.y,160,'#ff7040',22);part(b.x+b.face*40,b.y,5,'#a08060',20,5,6,30);
        for(const h of G.heroes){if(h.down)continue;const ddx=h.x-b.x,ddy=(h.y-b.y)*1.8;if(ddx*ddx+ddy*ddy<160*160)hurtHero(h,b.dmg*1.6,Math.sign(ddx)||1);}
        b.atkT=14;b.atkMax=14;b.bs='rest';b.bt=40;b.acd=rnd(80,130);
      }
      break;
    case 'charge':
      if(--b.bt<=0){b.bs='charging';b.bt=50;b.hitSet=new Set();SFX.skill();}
      break;
    case 'charging':
      b.x+=b.cdir*11;b.y+=clamp(b.cy-b.y,-2,2);b.walk+=0.5;b.moving=true;
      if(frame%2===0)part(b.x-b.cdir*30,b.y,10,'#a08060',2,1.5,6,20);
      for(const h of G.heroes){if(h.down||b.hitSet.has(h))continue;if(Math.abs(h.x-b.x)<60&&Math.abs(h.y-b.y)<38){b.hitSet.add(h);hurtHero(h,b.dmg*1.3,b.cdir);h.kx=b.cdir*10;}}
      if(--b.bt<=0||b.x<G.cam+70||b.x>G.cam+W-70){b.x=clamp(b.x,G.cam+70,G.cam+W-70);b.bs='rest';b.bt=55;b.acd=rnd(70,120);G.shake=7;SFX.hit();}
      break;
    case 'orbs':
      if(--b.bt<=0){
        b.face=dx>0?1:-1;SFX.fire();
        for(let i=-2;i<=2;i++)G.proj.push({type:'orb',own:0,x:b.x+b.face*50,y:b.y,z:90,vx:b.face*6,vy:i*1.3,dmg:b.dmg*0.8,life:140,r:12});
        b.atkT=14;b.atkMax=14;b.bs='rest';b.bt=30;b.acd=rnd(80,120);
      }
      break;
    case 'summon':
      if(--b.bt<=0){
        for(let i=0;i<3;i++){const e=makeEnemy(LV[G.level].types[i%LV[G.level].types.length],clamp(b.x+rnd(-140,140),G.cam+40,G.cam+W-40),rnd(FT+10,FB-10));G.enemies.push(e);part(e.x,e.y,20,'#b070ff',12,3,5,30);}
        SFX.skill();b.bs='rest';b.bt=40;b.acd=rnd(130,180);
      }
      break;
    case 'rest':if(--b.bt<=0)b.bs='walk';break;
  }
  if(b.slow>0)b.slow--;
  b.y=clamp(b.y,FT,FB);b.x=clamp(b.x,G.cam-40,G.cam+W+400);
}

/* ================= GAME UPDATE ================= */
function humans(){return G.heroes.filter(h=>h.ctrl!=='bot'&&!h.down);}
function updPlay(){
  if(pressed.Escape||pressed.KeyP){G.paused=!G.paused;G.psel=0;}
  if(G.paused){ // pause menu: arrows / D-pad pick a button (0 continue, 1 map, 2 sound), A or Enter presses it
    if(pressed.Backspace){resetMenu();return;}
    for(const p of [0,1]){
      if(tap(p,'right')&&G.psel!==2){G.psel=0;SFX.coin();}
      if(tap(p,'left')&&G.psel!==2){G.psel=1;SFX.coin();}
      if(tap(p,'down')&&G.psel!==2){G.pprev=G.psel|0;G.psel=2;SFX.coin();}
      if(tap(p,'up')&&G.psel===2){G.psel=G.pprev|0;SFX.coin();}
      if(tap(p,'a')||(p===0&&(pressed.Enter||pressed.NumpadEnter))){const k=G.psel|0;if(k===0)G.paused=false;else if(k===1)resetMenu();else sndOpen();return;}
    }
    return;
  }
  if(G.banner.t>0)G.banner.t--;
  if(G.goT>0)G.goT--;
  if(G.flashT>0)G.flashT--;
  for(const p of [0,1]){
    if(!tap(p,'sw'))continue;
    const h=G.heroes.find(o=>o.ctrl===p);
    if(h&&G.bench.length&&h.z<=0&&frame>=(h.swapCd||0))swapIn(h,p);else if(h&&!G.bench.length)addText(h.x,h.y,120,'ماكاين حتى حرف فالاحتياط','#ccc');
  }
  if(frame%60===0)for(const b of G.bench){if(!b.down)b.hp=Math.min(hMax(b),b.hp+Math.ceil(hMax(b)*0.03));}
  if(tap(1,'a')&&!G.roster.some(h=>h.ctrl===1)){
    const b=G.heroes.find(h=>h.ctrl==='bot');
    if(b){b.ctrl=1;addText(b.x,b.y,110,'P2 دخل!','#ff9b9b');SFX.coin();}
    else if(!G.p2wait){G.p2wait=true;const h=G.heroes[0];addText(h.x,h.y,120,'P2 غادي يدخل مع الحرف الجاي','#ff9b9b');SFX.coin();}
  }

  for(const h of G.heroes)updHero(h);
  for(const e of G.enemies)if(!e.dead)updEnemy(e);
  // separation
  const es=G.enemies;
  for(let i=0;i<es.length;i++)for(let j=i+1;j<es.length;j++){
    const a=es[i],b=es[j];if(a.isBoss||b.isBoss||a.dead||b.dead)continue;
    const dx=b.x-a.x,dy=b.y-a.y;
    if(Math.abs(dx)<26&&Math.abs(dy)<16){const s=dy>=0?1:-1;a.y-=s*0.8;b.y+=s*0.8;const s2=dx>=0?1:-1;a.x-=s2*0.5;b.x+=s2*0.5;}
  }
  // projectiles
  for(const p of G.proj){
    p.x+=p.vx;p.y+=p.vy;p.life--;
    if(p.y<FT-5||p.y>FB+5)p.vy=0;
    if(p.type==='fire'&&frame%2===0)part(p.x,p.y,p.z,'#ffa040',1,0.6,5,16);
    if(p.type==='orb'&&frame%3===0)part(p.x,p.y,p.z,'#c050ff',1,0.5,5,16);
    if(p.own){
      for(const e of G.enemies){
        if(e.dead||(p.hit&&p.hit.has(e)))continue;
        const bx=e.isBoss?40:16,by=e.isBoss?45:24;
        if(Math.abs(e.x-p.x)<p.r+bx&&Math.abs(e.y-p.y)<by){
          hurtEnemy(e,p.dmg,Math.sign(p.vx)||1,p.type==='fire'?5:3);if(p.burn){e.burn=150;e.burnD=p.dmg*0.12;}
          if(p.type==='fire'){areaHit(p.x,p.y,60,p.dmg*0.5,4);ring(p.x,p.y,60,'#ff9030',16);part(p.x,p.y,p.z,'#ffb040',10,3,5,22);p.life=0;break;}
          if(p.pierce){(p.hit||(p.hit=new Set())).add(e);}else{p.life=0;break;}
        }
      }
    }else{
      for(const h of G.heroes){if(h.down)continue;if(Math.abs(h.x-p.x)<p.r+14&&Math.abs(h.y-p.y)<22){hurtHero(h,p.dmg,Math.sign(p.vx)||1);p.life=0;break;}}
    }
    if(p.x<G.cam-60||p.x>G.cam+W+60)p.life=0;
  }
  G.proj=G.proj.filter(p=>p.life>0);
  // zones
  for(const z of G.zones){
    z.t--;if(z.t%10===0)areaHit(z.x,z.y,z.r,z.dmg,1);
    for(let k=0;k<2;k++)G.fx.push({t:'rain',x:z.x+rnd(-z.r,z.r),y:z.y+rnd(-z.r*0.4,z.r*0.4),z:rnd(150,220),life:16,max:16});
  }
  G.zones=G.zones.filter(z=>z.t>0);
  G.enemies=G.enemies.filter(e=>!e.dead);
  // pickups
  for(const c of G.pick){
    c.t++;
    if(c.z>0||c.vz>0){c.z+=c.vz;c.vz-=0.5;if(c.z<0){c.z=0;c.vz=c.vz<-2?-c.vz*0.45:0;}}
    c.x+=c.vx;c.vx*=0.9;
    let best=null,bd=1e9;for(const h of G.heroes){if(h.down)continue;const d=Math.hypot(h.x-c.x,h.y-c.y);if(d<bd){bd=d;best=h;}}
    if(best&&c.t>25){
      if(bd<150||G.lock===null&&c.t>90){c.x+=(best.x-c.x)/bd*7;c.y+=(best.y-c.y)/bd*7;}
      if(bd<24){
        c.got=true;
        if(c.type==='coin'){gold+=c.val;if(frame-lastCoinSnd>2){SFX.coin();lastCoinSnd=frame;}}
        else{const mh=hMax(best);best.hp=Math.min(mh,best.hp+Math.round(mh*0.3));SFX.heal();addText(best.x,best.y,90,'+صحة','#7f7');}
      }
    }
  }
  G.pick=G.pick.filter(c=>!c.got);
  // fx
  for(const f of G.fx){
    f.life--;
    if(f.t==='p'){f.x+=f.vx;f.y+=f.vy;f.z+=f.vz;f.vz-=0.18;if(f.z<0){f.z=0;f.vx*=0.6;f.vz=0;}}
    if(f.t==='rain')f.z-=13;
  }
  G.fx=G.fx.filter(f=>f.life>0&&(f.t!=='rain'||f.z>0));
  for(const t of G.texts){t.life--;t.z+=1;}
  G.texts=G.texts.filter(t=>t.life>0);

  // waves
  const hs=humans(),act=hs.length?hs:aliveHeroes();
  const maxX=act.length?Math.max(...act.map(h=>h.x)):G.cam+W/2;
  if(G.lock===null){
    if(G.cpi<G.cps.length&&maxX>G.cps[G.cpi]-150){G.lock=G.cps[G.cpi];G.queue=genWave(G.level,G.cpi);G.cpi++;G.spawnT=10;G.readyT=120;G.intro=waveIntro(G.queue);if(G.intro){G.readyT=230;G.banner.t=0;}}
    else if(G.cpi>=G.cps.length&&!G.boss&&maxX>G.bossX-150){G.lock=G.bossX;G.queue=[];spawnBoss();G.readyT=130;}
  }
  if(G.queue.length){if(--G.spawnT<=0&&G.enemies.length<6+G.level){spawnEnemy(G.queue.shift());G.spawnT=G.readyT>0?8:35;}}
  if(G.readyT>0&&--G.readyT===0){G.fightT=50;SFX.skill();G.shake=Math.max(G.shake,4);} // ⚔ fight!
  if(G.fightT>0)G.fightT--;
  if(!G.readyT)G.intro=null;
  if(G.lock!==null&&!G.queue.length&&!G.enemies.length){
    if(G.boss){if(G.bossDone&&!G.doneT){G.doneT=1;}}
    else{
      G.lock=null;G.goT=150;
      for(const h of G.heroes)if(h.down){h.down=false;h.hp=Math.round(hMax(h)*0.5);h.inv=90;addText(h.x,h.y,100,'رجع!','#7f7');}
        else{ // every step forward in the stage gives back a little health
          const m=hMax(h),add=Math.min(m-h.hp,Math.max(5,Math.round(m*0.08)));
          if(add>0){h.hp+=add;addText(h.x,h.y,110,'+'+add+' ❤','#7dff8a');part(h.x,h.y,50,'#9dffb0',8,2,4,28);}
        }
      for(const b of G.bench)if(!b.down)b.hp=Math.min(hMax(b),b.hp+Math.round(hMax(b)*0.08));
      if(G.heroes.some(h=>!h.down))SFX.coin();
    }
  }
  if(G.doneT>0){
    G.doneT++;
    if(G.doneT===60)G.banner={t:200,s:'ربحتو المرحلة!'};
    if(G.doneT>230){
      for(const c of G.pick)if(c.type==='coin')gold+=c.val;
      G.pick=[];
      stageCleared();
      return;
    }
  }
  // camera
  const avg=act.length?act.reduce((s,h)=>s+h.x,0)/act.length:G.cam+W/2;
  let target=avg-W*0.4;
  const nextStop=G.cpi<G.cps.length?G.cps[G.cpi]:G.bossX;
  if(G.lock!==null)target=G.lock-W/2;else target=Math.min(target,nextStop-W/2);
  target=clamp(target,0,G.end-W);
  if(target>G.cam)G.cam+=Math.min(8,(target-G.cam)*0.12+0.5);
  if(G.cam>target&&G.lock===null&&target>=G.cam-1)G.cam=target;
  // game over
  if(G.overT>0){if(--G.overT<=0&&G.heroes.every(h=>h.down))state='over';else if(!G.heroes.every(h=>h.down))G.overT=0;}
}

/* ================= MENU / SHOP / END ================= */
function goHome(){location.href='index.html';}
function upCost(lv){return Math.round(12*Math.pow(1.25,lv));} // each level costs a quarter more than the last: 12, 15, 19 ... 833
function shopBuy(c,r){
  const key=UPK[r],u=upg[G.roster[c].idx],lv=u[key];
  if(lv>=UPMAX||gold<upCost(lv)){SFX.no();}else{gold-=upCost(lv);u[key]++;SFX.buy();saveProg();}
}
function updShop(){
  const N=G.roster.length;shop.hero=clamp(shop.hero|0,0,N-1);
  for(const p of [0,1]){
    if(tap(p,'left')){shop.hero=(shop.hero+1)%N;SFX.coin();} // letters run right-to-left
    if(tap(p,'right')){shop.hero=(shop.hero+N-1)%N;SFX.coin();}
    const ui=[1,0,2,3,4,5,6],n=ui.length,k=Math.max(0,ui.indexOf(shop.row|0)); // screen order: health, power, skills, speed, armour, critical, then the next button
    if(tap(p,'up')){shop.row=ui[(k+n-1)%n];SFX.coin();}
    if(tap(p,'down')){shop.row=ui[(k+1)%n];SFX.coin();}
    if(tap(p,'a')){if(shop.row===6){shopNext();return;}shopBuy(shop.hero,shop.row);}
  }
  if(pressed.Enter||pressed.NumpadEnter)shopNext();
  else if(pressed.Escape)resetMenu();
}
function shopNext(){if(shop.from==='map')startStage(menu.sel);else{menu.sel=Math.min(G.level+1,LV.length-1);startStage(menu.sel);}}
function updEnd(){
  if(state==='over'){ // game over: arrows / D-pad pick retry or map, A or Enter presses it
    for(const p of [0,1]){if(tap(p,'right')){G.osel=0;SFX.coin();}if(tap(p,'left')){G.osel=1;SFX.coin();}
      if(tap(p,'a')){if(G.osel===1)resetMenu();else startLevel(G.level);return;}}
    if(pressed.Enter||pressed.NumpadEnter){if(G.osel===1)resetMenu();else startLevel(G.level);}
    else if(pressed.Escape)resetMenu();
  }else if(pressed.Enter||pressed.NumpadEnter||pressed.Escape)resetMenu();
}

/* ================= DRAW: CHARACTERS ================= */
function wAngle(o){
  const w=o.weapon;
  if(o.spin)return o.spinP*Math.PI*4;
  if(o.wind)return w==='bow'?-0.05:-2.3;
  if(o.atk>=0){if(w==='bow')return -0.05;if(w==='staff')return -0.5+Math.sin(o.atk*Math.PI)*0.5;return -2.0+o.atk*3.3;}
  const b=o.moving?Math.sin(o.walk)*0.15:Math.sin(frame*0.05)*0.05;
  if(w==='bow')return 0.6+b;if(w==='staff')return -0.9+b;return 0.9+b;
}
function drawWeapon(o,c){
  switch(o.weapon){
    case 'sword':ctx.fillStyle=c('#6b4423');ctx.fillRect(-2,-2,10,4);ctx.fillStyle=c('#e0b030');ctx.fillRect(8,-7,3,14);
      ctx.fillStyle=c('#e3eaf2');ctx.beginPath();ctx.moveTo(11,-3);ctx.lineTo(40,-3);ctx.lineTo(47,0);ctx.lineTo(40,3);ctx.lineTo(11,3);ctx.fill();break;
    case 'esword':ctx.fillStyle=c('#5a4030');ctx.fillRect(-2,-2,9,4);ctx.fillStyle=c('#7a7060');ctx.fillRect(7,-5,3,10);
      ctx.fillStyle=c('#a89f8a');ctx.beginPath();ctx.moveTo(10,-3);ctx.lineTo(32,-2);ctx.lineTo(36,1);ctx.lineTo(10,3);ctx.fill();break;
    case 'hammer':ctx.fillStyle=c('#6b4423');ctx.fillRect(-2,-2.5,38,5);ctx.fillStyle=c('#8d98a3');rr(30,-11,14,22,3);ctx.fillStyle=c('#6d7883');ctx.fillRect(30,-2,14,4);break;
    case 'club':ctx.fillStyle=c('#7a5230');ctx.beginPath();ctx.moveTo(0,-2);ctx.lineTo(28,-6);ctx.lineTo(31,0);ctx.lineTo(28,6);ctx.lineTo(0,2);ctx.fill();
      ctx.fillStyle=c('#5a3a20');circ(22,-3,1.5);circ(25,3,1.5);break;
    case 'axe':ctx.fillStyle=c('#6b4423');ctx.fillRect(-2,-2,36,4);ctx.fillStyle=c('#9aa4ad');ctx.beginPath();ctx.moveTo(24,-2);ctx.lineTo(34,-16);ctx.quadraticCurveTo(44,-2,34,13);ctx.lineTo(24,2);ctx.fill();break;
    case 'bow':{
      ctx.strokeStyle=c('#7a4a1f');ctx.lineWidth=3;ctx.beginPath();ctx.arc(4,0,18,-1.2,1.2);ctx.stroke();
      const ex=4+18*Math.cos(1.2),ey=18*Math.sin(1.2),pull=(o.atk>=0&&o.atk<0.5)||o.wind?-6:ex;
      ctx.strokeStyle='#eee';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ex,-ey);ctx.lineTo(pull,0);ctx.lineTo(ex,ey);ctx.stroke();
      if((o.atk>=0&&o.atk<0.5)||o.wind){ctx.strokeStyle='#d8c090';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(26,0);ctx.stroke();}
      break;}
    case 'staff':ctx.fillStyle=c('#6b4423');ctx.fillRect(-6,-2,46,4);
      ctx.globalAlpha*=0.35;ctx.fillStyle='#e0a0ff';circ(44,0,11+Math.sin(frame*0.2)*2);ctx.globalAlpha/=0.35;
      ctx.fillStyle=c('#c77dff');circ(44,0,6);ctx.fillStyle='#fff';circ(42,-2,2);break;
  }
}
function drawHead(o,c){
  const h=o.head;
  const eye=(col,r)=>{ctx.fillStyle=col||'#111';circ(5,-63,r||1.8);};
  switch(h){
    case 'helm':
      ctx.fillStyle=c('#b8c2cc');ctx.beginPath();ctx.arc(0,-63,12.5,Math.PI,0);ctx.lineTo(12.5,-57);ctx.lineTo(-12.5,-57);ctx.fill();
      ctx.fillStyle=c('#8a96a3');ctx.fillRect(-12.5,-60,25,3);ctx.fillStyle='#222';ctx.fillRect(3,-65,9,2.5);
      ctx.fillStyle=c('#d63a3a');ctx.beginPath();ctx.moveTo(-2,-75);ctx.quadraticCurveTo(-18,-84,-22,-66);ctx.quadraticCurveTo(-12,-75,-2,-72);ctx.fill();break;
    case 'hood':
      ctx.fillStyle=c('#256e38');ctx.beginPath();ctx.arc(0,-63,13.5,Math.PI*0.55,Math.PI*1.95);ctx.closePath();ctx.fill();
      tri(-9,-72,-24,-56,-8,-55);eye();break;
    case 'wizard':
      ctx.fillStyle=c('#eee');tri(-3,-58,12,-58,5,-42);
      ctx.fillStyle=c('#5a2a9a');tri(-13,-70,13,-70,-8,-104);ctx.fillRect(-17,-72,34,4);
      ctx.fillStyle=c('#ffd24a');circ(-1,-82,2);eye();break;
    case 'guard':
      ctx.fillStyle=c('#4a2e18');tri(-5,-56,12,-58,4,-46);
      ctx.fillStyle=c('#c8a040');ctx.beginPath();ctx.arc(0,-64,12.5,Math.PI,0);ctx.fill();ctx.fillRect(-12.5,-65,25,3);
      ctx.fillRect(7,-66,2.5,9);ctx.fillStyle=c('#a33');tri(-3,-76,3,-76,0,-84);eye();break;
    case 'goblin':
      ctx.fillStyle=c(o.skin);tri(-6,-66,-24,-74,-5,-58);tri(8,-60,14,-61,9,-56);
      ctx.fillStyle='#ffe040';circ(5,-64,2.8);ctx.fillStyle='#000';circ(6,-64,1.2);
      ctx.fillStyle='#2a1a0a';ctx.fillRect(2,-56,8,1.5);break;
    case 'skull':
      ctx.fillStyle='#111';circ(5,-64,3.4);circ(-2,-64,2.6);ctx.fillRect(1,-58,8,2);
      ctx.fillStyle=c('#e6e1cf');for(let i=0;i<4;i++)ctx.fillRect(1+i*2,-58,1,2);break;
    case 'orc':
      ctx.fillStyle='#ff3a2a';circ(5,-64,1.8);ctx.fillStyle='#1a2a10';ctx.fillRect(1,-68,10,2);
      ctx.fillStyle=c('#fff');tri(5,-55,7,-61,9,-55);tri(-1,-55,1,-60,3,-55);break;
    case 'dhood':
      ctx.fillStyle=c('#3a1f48');circ(0,-63,13.5);tri(-6,-74,-22,-56,-6,-54);
      ctx.fillStyle='#120a18';circ(4,-62,7.5);ctx.fillStyle='#ff3030';circ(6,-63,1.6);circ(2,-63,1.4);break;
    case 'boss':
      ctx.fillStyle=c('#e8dcc0');ctx.beginPath();ctx.moveTo(-8,-70);ctx.quadraticCurveTo(-20,-76,-16,-92);ctx.quadraticCurveTo(-12,-80,-3,-73);ctx.fill();
      ctx.beginPath();ctx.moveTo(6,-71);ctx.quadraticCurveTo(14,-80,8,-94);ctx.quadraticCurveTo(18,-82,11,-68);ctx.fill();
      ctx.fillStyle=c('#ffcc33');ctx.fillRect(-8,-77,16,4);tri(-8,-77,-4,-77,-6,-83);tri(-2,-77,2,-77,0,-85);tri(4,-77,8,-77,6,-83);
      ctx.fillStyle='#ff2a1a';circ(5,-64,2.2);ctx.fillStyle='#200';ctx.fillRect(1,-57,9,2);break;
  }
}
function drawChar(o){
  ctx.save();
  ctx.translate(o.x,o.y);if(o.rot)ctx.rotate(o.rot);
  ctx.scale(o.face*o.sc,o.sc);
  if(o.alpha!=null)ctx.globalAlpha=o.alpha;
  const F=o.flash,c=col=>F?'#ffffff':col;
  const lg=o.moving?Math.sin(o.walk)*7:0;
  if(o.cape){ctx.fillStyle=c(o.cape);ctx.beginPath();ctx.moveTo(-9,-50);ctx.lineTo(6,-50);ctx.lineTo(-6-Math.abs(lg)*0.4,-12);ctx.lineTo(-22-Math.abs(lg)*0.6,-16);ctx.closePath();ctx.fill();}
  ctx.fillStyle=c(o.dark);rr(-9+lg*0.6,-25,7,24,2);rr(2-lg*0.6,-25,7,24,2);
  ctx.fillStyle=c('#3a2a1f');rr(-10+lg*0.6,-5,10,5,2);rr(1-lg*0.6,-5,10,5,2);
  ctx.fillStyle=c(o.body);rr(-12,-53,24,31,6);
  if(o.robe){ctx.fillStyle=c(o.body);ctx.beginPath();ctx.moveTo(-12,-30);ctx.lineTo(12,-30);ctx.lineTo(16+lg*0.3,-4);ctx.lineTo(-16+lg*0.3,-4);ctx.closePath();ctx.fill();ctx.fillStyle=c('#ffd24a');ctx.fillRect(-15,-8,31,3);}
  if(o.ribs){ctx.fillStyle='#8a8574';for(let i=0;i<4;i++)ctx.fillRect(-8,-48+i*6,16,2);}
  ctx.fillStyle=c(o.dark);ctx.fillRect(-12,-28,24,4);
  if(o.head==='helm'||o.head==='guard'){ctx.fillStyle=c('#e0b030');ctx.fillRect(-2,-28,4,4);}
  ctx.fillStyle=c(o.skin);circ(0,-63,11);
  if(o.head!=='skull'&&o.head!=='dhood'&&o.head!=='goblin'&&o.head!=='orc'&&o.head!=='boss'){}
  drawHead(o,c);
  ctx.save();ctx.translate(4,-46);ctx.rotate(wAngle(o));
  ctx.fillStyle=c(o.skin);circ(0,0,4);
  drawWeapon(o,c);ctx.restore();
  if(o.shield){ctx.fillStyle=c(o.shield);rr(6,-52,11,26,4);ctx.strokeStyle=c('#e0b030');ctx.lineWidth=1.5;rrS(6,-52,11,26,4);star8(11.5,-39,3.2,c('#f2e6c8'));}
  ctx.restore();
}
function shadow(x,y,r){ctx.fillStyle='rgba(0,0,0,.28)';ell(x,y,r,r*0.32);ctx.fill();}
function tagCol(h){return h.ctrl===0?'#4da3ff':h.ctrl===1?'#ff5b5b':'#b8b8b8';}
function tagTxt(h){return h.ctrl===0?'P1':h.ctrl===1?'P2':'BOT';}
function drawHero(h){
  const sx=h.x-G.cam,sy=h.y-h.z-(h.lz||0),L=LET[h.idx];
  shadow(sx,h.y,L.id==='guard'||L.id==='baa'?30:20);
  if(h.buffT>0){ctx.strokeStyle='rgba(255,210,74,'+(0.4+0.3*Math.sin(frame*0.3))+')';ctx.lineWidth=3;ell(sx,h.y,30,9);ctx.stroke();}
  let alpha=null;
  if(h.down)alpha=0.6;else if(h.inv>0&&h.z<=0&&frame%8<4)alpha=0.55;
  const dotP=(h.def.id==='archer'||h.def.id==='baa')&&h.cdA>0?clamp(1-h.cdA/(h.def.atkCd*0.8),0,1):1;
  drawLetter({i:h.idx,x:sx,y:sy,face:h.face,sc:1,walk:h.walk,moving:h.moving,atk:h.atkT>0?1-h.atkT/h.atkMax:-1,flash:h.flash>0,alpha,
    spinP:h.spinT>0?1-h.spinT/(h.spinMax||24):-1,cast:h.castT>0?1-h.castT/h.castMax:-1,dash:h.dashT>0,hurt:h.hurtT>0?1-h.hurtT/26:0,down:h.down,dotP});
  if(h.spinT>0){ctx.strokeStyle='rgba(160,210,255,.6)';ctx.lineWidth=4;ell(sx,sy-45,58,22);ctx.stroke();}
  if(h.shieldT>0){const a=Math.min(1,h.shieldT/30);ctx.fillStyle='rgba(140,220,255,'+0.12*a+')';ell(sx,sy-L.top/2,L.top/2+16,L.top/2+16);ctx.fill();ctx.strokeStyle='rgba(140,220,255,'+0.7*a+')';ctx.lineWidth=2.5;ctx.stroke();}
  if(h.z>0)return;
  drawHeroTag(h,sx,sy,L);
}
function drawEnemy(e){
  const L=e.look,sx=e.x-G.cam,sy=e.y-e.z;
  shadow(sx,e.y,16*L.sc);
  if(e.isBoss){
    if(e.bs==='slam'){const p=1-e.bt/50;ctx.fillStyle='rgba(255,60,30,'+(0.12+p*0.25)+')';ell(sx,e.y,160*p,160*p/1.8);ctx.fill();ctx.strokeStyle='rgba(255,80,40,.8)';ctx.lineWidth=2;ell(sx,e.y,160,160/1.8);ctx.stroke();}
    if(e.bs==='charge'){ctx.fillStyle='rgba(255,60,30,.22)';const x0=sx,x1=e.cdir>0?W:0;ctx.fillRect(Math.min(x0,x1),e.y-34,Math.abs(x1-x0),68);}
    if(e.hp<e.maxHp/2){ctx.fillStyle='rgba(255,40,20,'+(0.15+0.1*Math.sin(frame*0.2))+')';ell(sx,e.y,60,20);ctx.fill();}
  }
  const wind=e.wind>0||(e.isBoss&&(e.bs==='slam'||e.bs==='orbs'||e.bs==='summon'||e.bs==='charge'));
  if(e.elite&&!L.beast){ctx.strokeStyle='rgba(255,210,74,'+(0.5+0.3*Math.sin(frame*0.15))+')';ctx.lineWidth=2;ell(sx,e.y,22*L.sc,8*L.sc);ctx.stroke();}
  if(L.beast)drawBeast(e,sx,sy);
  else drawChar(Object.assign({},L,{x:sx,y:sy,face:e.face,walk:e.walk,moving:e.moving,atk:e.atkT>0?1-e.atkT/e.atkMax:-1,wind,flash:e.flash>0}));
  const top=sy-(L.h||80)*L.sc-(e.isBoss?20:0)-(L.beast?beastHover(e):0);
  if(e.elite)txt('★',sx,top-14,13,'#ffd24a');
  if(e.stun>0){for(let i=0;i<3;i++){const a=frame*0.15+i*2.1;txt('★',sx+Math.cos(a)*14,top+2+Math.sin(a)*4,12,'#ffe066','center',false);}}
  if(e.wind>0&&!e.isBoss)txt('!',sx,top-4,18,'#ff4040');
  if(!e.isBoss&&e.hp<e.maxHp){ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(sx-16,top+8,32,4);ctx.fillStyle='#ff5040';ctx.fillRect(sx-16,top+8,32*Math.max(0,e.hp/e.maxHp),4);}
  if(e.slow>0){ctx.fillStyle='rgba(120,220,255,.25)';ell(sx,e.y,18*L.sc,7*L.sc);ctx.fill();}
}
function drawProj(p){
  const sx=p.x-G.cam,sy=p.y-p.z;
  ctx.fillStyle='rgba(0,0,0,.2)';ell(sx,p.y,8,3);ctx.fill();
  const d=Math.sign(p.vx)||1;
  if(p.type==='arrow'){ // the Noon's dot
    const c=p.col||(p.gold?'#ffd24a':LET[1].col);
    for(let k=3;k>=1;k--){ctx.globalAlpha=0.18*(4-k);ctx.fillStyle=c;circ(sx-p.vx*k*1.1,sy-p.vy*k*0.7,7-k);}
    ctx.globalAlpha=1;ctx.fillStyle='#14121e';circ(sx,sy,9);ctx.fillStyle=c;circ(sx,sy,6.5);ctx.fillStyle='#fff';circ(sx-2,sy-2,2);
  }else if(p.type==='earrow'){
    ctx.save();ctx.translate(sx,sy);ctx.rotate(Math.atan2(p.vy*0.6,p.vx));
    ctx.strokeStyle=p.type==='earrow'?'#6a4a7a':(p.gold?'#ffd24a':'#c8a060');ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(10,0);ctx.stroke();
    ctx.fillStyle=p.type==='earrow'?'#d040ff':'#ddd';tri(10,-4,17,0,10,4);ctx.fillStyle='#fff';ctx.fillRect(-15,-3,4,6);ctx.restore();
  }else if(p.type==='fire'){
    ctx.fillStyle='rgba(255,140,40,.35)';circ(sx,sy,15);ctx.fillStyle='#ff8a20';circ(sx,sy,9);ctx.fillStyle='#ffe080';circ(sx+d*2,sy,5);
  }else if(p.type==='efire'){drawEfire(p,sx,sy);
  }else if(p.type==='orb'){
    ctx.fillStyle='rgba(190,60,255,.35)';circ(sx,sy,16);ctx.fillStyle='#9a20e0';circ(sx,sy,10);ctx.fillStyle='#f0c0ff';circ(sx,sy,4);
  }
}
function drawPick(c){
  const sx=c.x-G.cam,sy=c.y-c.z-8;
  ctx.fillStyle='rgba(0,0,0,.25)';ell(sx,c.y,7,2.5);ctx.fill();
  if(c.type==='coin'){const w=Math.abs(Math.cos(frame*0.12+c.x))*6+1.5;ctx.fillStyle='#b8860b';ell(sx,sy,w+1,7);ctx.fill();ctx.fillStyle='#ffd24a';ell(sx,sy,w,6);ctx.fill();}
  else{ctx.fillStyle='#ff3b5c';circ(sx-4,sy-2,5);circ(sx+4,sy-2,5);tri(sx-9,sy,sx+9,sy,sx,sy+9);}
}
function drawFx(f){
  const sx=f.x-G.cam,a=Math.max(0,f.life/f.max);
  ctx.globalAlpha=a;
  if(f.t==='p'){ctx.fillStyle=f.col;ctx.fillRect(sx-f.size/2,f.y-f.z-f.size/2,f.size,f.size);}
  else if(f.t==='ring'){const r=f.r*(1-a*0.7);ctx.strokeStyle=f.col;ctx.lineWidth=4*a+1;ell(sx,f.y,r,r/1.8);ctx.stroke();}
  else if(f.t==='slash'){ctx.strokeStyle=f.col;ctx.lineWidth=5*a+1;ctx.beginPath();const st=f.face>0?-1.3:Math.PI+1.3,en=f.face>0?1.0:Math.PI-1.0;ctx.arc(sx-f.face*14,f.y-45,f.r,st,en,f.face<0);ctx.stroke();}
  else if(f.t==='bolt'){ctx.strokeStyle='#e8f8ff';ctx.lineWidth=3;ctx.beginPath();let x=sx+rnd(-20,20),y=0;ctx.moveTo(x,y);const ty=f.y-f.z;while(y<ty){y+=rnd(18,34);x+=rnd(-14,14);ctx.lineTo(x,Math.min(y,ty));}ctx.stroke();ctx.strokeStyle='rgba(120,200,255,.6)';ctx.lineWidth=8;ctx.stroke();ctx.fillStyle='rgba(200,240,255,.6)';circ(sx,ty,18*a);}
  else if(f.t==='rain'){ctx.fillStyle='#14121e';circ(sx,f.y-f.z,5);ctx.fillStyle=LET[1].col;circ(sx,f.y-f.z,3.4);}
  ctx.globalAlpha=1;
}

/* ================= DRAW: BACKGROUNDS ================= */
function layer(cam,f,spacing,fn){const off=cam*f,i0=Math.floor(off/spacing)-1,i1=i0+Math.ceil(W/spacing)+2;for(let i=i0;i<=i1;i++)fn(i*spacing-off,i,srand(i*7.3+f*100));}
function skyGrad(a,b){const g=ctx.createLinearGradient(0,0,0,FT);g.addColorStop(0,a);g.addColorStop(1,b);ctx.fillStyle=g;ctx.fillRect(0,0,W,FT);}
function floorBand(top,base,edge,cam,deco){
  ctx.fillStyle=base;ctx.fillRect(0,top,W,H-top);
  ctx.fillStyle=edge;ctx.fillRect(0,top,W,8);
  layer(cam,1,70,(x,i,r)=>{deco(x,i,r);});
}
function drawBG(t,cam){
  const gtop=FT-45;
  if(t===0){
    skyGrad('#7cc4f0','#d8f0ff');
    ctx.fillStyle='#fff8d0';circ(780,70,34);
    layer(cam,0.1,260,(x,i,r)=>{ctx.fillStyle='rgba(255,255,255,.8)';const y=50+r*60;circ(x,y,20);circ(x+22,y-8,24);circ(x+46,y,18);});
    layer(cam,0.2,240,(x,i,r)=>{ctx.fillStyle='#7da7a0';tri(x-170,gtop,x+20+r*40,gtop-120-r*60,x+220,gtop);});
    layer(cam,0.45,110,(x,i,r)=>{const hh=70+r*50;ctx.fillStyle='#3e6b3a';for(let k=0;k<4;k++){const w=40-k*8;ctx.fillRect(x-w,gtop-hh*0.25-k*hh*0.22,w*2,10);}ctx.fillStyle='#5a3e22';ctx.fillRect(x-3,gtop-hh*0.25,6,hh*0.25);ctx.fillStyle='#2f5a2e';tri(x-44,gtop-hh*0.2,x+44,gtop-hh*0.2,x,gtop-hh);});
    floorBand(gtop,'#6a9a44','#4f8034',cam,(x,i,r)=>{ctx.fillStyle='#9b7f55';ctx.fillRect(x,FT+40+r*30,40,6);ctx.fillStyle='#4f8034';tri(x+r*60,gtop+30+r*200,x+6+r*60,gtop+18+r*200,x+12+r*60,gtop+30+r*200);if(r>0.7){ctx.fillStyle='#ff6b8a';circ(x+30,gtop+60+r*150,3);}});
  }else if(t===1){
    skyGrad('#f7a64a','#ffe2a8');
    ctx.fillStyle='#fff3c0';circ(200,80,40);
    layer(cam,0.15,300,(x,i,r)=>{ctx.fillStyle='#e8b070';ctx.beginPath();ctx.ellipse(x,gtop,200,60+r*40,0,Math.PI,0);ctx.fill();});
    layer(cam,0.4,170,(x,i,r)=>{
      if(r<0.35){ctx.fillStyle='#6b4a2a';ctx.fillRect(x-3,gtop-90,6,90);ctx.fillStyle='#3e7a30';for(let k=0;k<5;k++){ctx.save();ctx.translate(x,gtop-90);ctx.rotate(-2.6+k*0.55);ctx.beginPath();ctx.ellipse(22,0,26,6,0,0,Math.PI*2);ctx.fill();ctx.restore();}return;}
      const w=70+r*50,hh=90+r*80;ctx.fillStyle='#c2703d';ctx.fillRect(x-w/2,gtop-hh,w,hh);
      for(let k=0;k<w/12;k++)ctx.fillRect(x-w/2+k*12,gtop-hh-8,7,8);
      ctx.fillStyle='#7a3a1a';rr(x-8,gtop-30,16,30,8);ctx.fillRect(x-w/2+12,gtop-hh+22,8,12);ctx.fillRect(x+w/2-20,gtop-hh+22,8,12);
      ctx.fillStyle='#e8c070';ctx.fillRect(x-w/2,gtop-hh+48,w,4);
    });
    floorBand(gtop,'#d9b36c','#c49a52',cam,(x,i,r)=>{ctx.fillStyle='#c49a52';ctx.beginPath();ctx.ellipse(x+r*40,gtop+40+r*170,24,4,0,0,Math.PI*2);ctx.fill();if(r>0.85){ctx.fillStyle='#8a7a5a';circ(x+20,gtop+90+r*80,5);}});
  }else if(t===2){
    skyGrad('#9cc0dc','#e6f0f6');
    layer(cam,0.12,330,(x,i,r)=>{const hh=170+r*70;ctx.fillStyle='#7d8ea3';tri(x-220,gtop,x,gtop-hh,x+220,gtop);ctx.fillStyle='#fff';tri(x-55,gtop-hh+hh*0.25,x,gtop-hh,x+55,gtop-hh+hh*0.25);});
    layer(cam,0.45,95,(x,i,r)=>{const hh=60+r*50;ctx.fillStyle='#2d4a3e';tri(x-28,gtop,x+28,gtop,x,gtop-hh);ctx.fillStyle='#f4f8fb';tri(x-10,gtop-hh*0.7,x+10,gtop-hh*0.7,x,gtop-hh);});
    floorBand(gtop,'#e8eef3','#cfdbe4',cam,(x,i,r)=>{ctx.fillStyle='#b8c6d2';ctx.fillRect(x,gtop+50+r*160,30+r*20,3);if(r>0.8){ctx.fillStyle='#8896a3';ctx.beginPath();ctx.ellipse(x+30,gtop+80+r*90,9,5,0,0,Math.PI*2);ctx.fill();}});
    for(let k=0;k<30;k++){const sx=((k*97+frame*(0.5+k%3*0.3))%W),sy=((k*53+frame*(1+k%4*0.4))%H);ctx.fillStyle='rgba(255,255,255,.8)';circ(W-sx,sy,1.5+k%2);}
  }else if(t===3){
    skyGrad('#14111c','#2a2338');
    layer(cam,0.2,140,(x,i,r)=>{ctx.fillStyle='#231d30';ctx.fillRect(x-25,0,50+r*30,gtop);ctx.fillStyle='#1a1524';tri(x-30,0,x+30,0,x,50+r*80);});
    layer(cam,0.5,120,(x,i,r)=>{ctx.fillStyle='#3a3050';tri(x-18,0,x+18,0,x,40+r*90);if(r>0.5){ctx.fillStyle='rgba(80,230,255,'+(0.5+0.3*Math.sin(frame*0.05+i))+')';tri(x-8,gtop,x+8,gtop,x+2,gtop-30-r*20);tri(x+6,gtop,x+18,gtop,x+14,gtop-18);}});
    floorBand(gtop,'#3a3348','#2c263a',cam,(x,i,r)=>{ctx.fillStyle='#2c263a';ctx.beginPath();ctx.ellipse(x+r*30,gtop+40+r*170,16,6,0,0,Math.PI*2);ctx.fill();});
  }else if(t===5){ // old medina at dusk
    skyGrad('#3a3f7a','#f0a070');
    ctx.fillStyle='#ffe0a0';circ(150,90,30);
    layer(cam,0.12,230,(x,i,r)=>{const hh=110+r*60;ctx.fillStyle='#c9b8a8';ctx.fillRect(x-70,gtop-hh,140,hh);ctx.fillStyle='#b8a594';ctx.fillRect(x-18,gtop-hh-80-r*30,36,80+r*30);ctx.fillRect(x-24,gtop-hh-90-r*30,48,10);ctx.fillStyle='#2e8a5a';tri(x-18,gtop-hh-90-r*30,x+18,gtop-hh-90-r*30,x,gtop-hh-112-r*30);ctx.fillStyle='#ffd27a';circ(x,gtop-hh-118-r*30,3);});
    layer(cam,0.45,160,(x,i,r)=>{ctx.fillStyle='#e8dccb';ctx.fillRect(x-80,gtop-120,160,120);ctx.fillStyle='#1f5f8b';ctx.beginPath();ctx.moveTo(x-30,gtop);ctx.lineTo(x-30,gtop-60);ctx.arc(x,gtop-60,30,Math.PI,0);ctx.lineTo(x+30,gtop);ctx.fill();
      for(let k=0;k<8;k++){ctx.fillStyle=k%2?'#2a7f5f':'#1f5f8b';ctx.fillRect(x-80+k*20,gtop-118,20,10);}
      const fl=0.6+0.3*Math.sin(frame*0.08+i);ctx.fillStyle='rgba(255,190,90,'+fl*0.35+')';circ(x+58,gtop-78,14);ctx.fillStyle='#c98a2a';ctx.fillRect(x+53,gtop-86,10,14);ctx.fillStyle='#ffe090';ctx.fillRect(x+55,gtop-83,6,8);});
    floorBand(gtop,'#d8cbb8','#b9a990',cam,(x,i,r)=>{for(let k=0;k<3;k++){const y=gtop+30+k*70+(i%2)*35;ctx.fillStyle=(i+k)%2?'#2a7f5f':'#1f5f8b';ctx.save();ctx.translate(x+35,y);ctx.rotate(Math.PI/4);ctx.fillRect(-8,-8,16,16);ctx.restore();star8(x+35,y,4,'#f2e6c8');}});
  }else if(t===6){ // oasis at night
    skyGrad('#0d1430','#2a3a6a');
    for(let k=0;k<40;k++){ctx.fillStyle='rgba(255,255,255,'+(0.4+0.4*Math.sin(frame*0.05+k))+')';circ((k*137)%W,(k*71)%(FT-60),1.2);}
    ctx.fillStyle='#f4f0d8';circ(W-170,80,36);ctx.fillStyle='#0d1430';circ(W-156,72,32);
    layer(cam,0.15,320,(x,i,r)=>{ctx.fillStyle='#24305a';ctx.beginPath();ctx.ellipse(x,gtop,220,70+r*40,0,Math.PI,0);ctx.fill();});
    layer(cam,0.45,150,(x,i,r)=>{if(r<0.5){ctx.fillStyle='rgba(120,200,255,.22)';ctx.beginPath();ctx.ellipse(x,gtop-4,60,8,0,0,Math.PI*2);ctx.fill();return;}
      const hh=80+r*50;ctx.strokeStyle='#3a2a20';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x,gtop);ctx.quadraticCurveTo(x+10,gtop-hh/2,x+4,gtop-hh);ctx.stroke();
      ctx.fillStyle='#1d4a3a';for(let k=0;k<6;k++){ctx.save();ctx.translate(x+4,gtop-hh);ctx.rotate(-2.8+k*0.62);ctx.beginPath();ctx.ellipse(24,0,28,6,0,0,Math.PI*2);ctx.fill();ctx.restore();}});
    floorBand(gtop,'#5a5a7a','#48486a',cam,(x,i,r)=>{ctx.fillStyle='#48486a';ctx.beginPath();ctx.ellipse(x+r*40,gtop+40+r*170,24,4,0,0,Math.PI*2);ctx.fill();if(r>0.88){ctx.fillStyle='rgba(140,220,255,.5)';circ(x+20,gtop+90+r*80,2);}});
  }else if(t===7){ // the blue city
    skyGrad('#8ec9f0','#e8f6ff');
    layer(cam,0.12,300,(x,i,r)=>{ctx.fillStyle='#6a9a8a';tri(x-200,gtop,x+r*30,gtop-150-r*50,x+210,gtop);});
    layer(cam,0.42,120,(x,i,r)=>{const hh=80+r*70,w=90+r*30;ctx.fillStyle=r>0.5?'#3f7fd0':'#6aa8ec';ctx.fillRect(x-w/2,gtop-hh,w,hh);ctx.fillStyle='#fff';ctx.fillRect(x-w/2,gtop-hh,w,5);
      ctx.fillStyle='#1f4f9a';rr(x-9,gtop-34,18,34,9);ctx.fillRect(x-w/2+12,gtop-hh+20,12,14);ctx.fillRect(x+w/2-24,gtop-hh+20,12,14);
      if(r>0.6){ctx.fillStyle='#e05a8a';circ(x+w/2-18,gtop-hh+42,5);circ(x+w/2-10,gtop-hh+46,4);ctx.fillStyle='#3a8a3a';circ(x+w/2-14,gtop-hh+50,4);}});
    floorBand(gtop,'#9cc4ec','#7aaee0',cam,(x,i,r)=>{ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;ctx.strokeRect(x,gtop+20+(i%3)*60,70,60);});
  }else if(t===8){ // sea walls by the ocean
    skyGrad('#6ab0e0','#f6e6c8');
    ctx.fillStyle='#2a7ab0';ctx.fillRect(0,gtop-75,W,75);
    ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=2;for(let k=0;k<12;k++){const wx=(k*97-cam*0.3+frame*0.4)%(W+80)-40;const wy=gtop-65+(k%4)*16;ctx.beginPath();ctx.moveTo(wx,wy);ctx.quadraticCurveTo(wx+10,wy-4,wx+20,wy);ctx.stroke();}
    layer(cam,0.1,260,(x,i,r)=>{ctx.strokeStyle='#fff';ctx.lineWidth=2;const y=60+r*60+Math.sin(frame*0.05+i)*5;ctx.beginPath();ctx.moveTo(x-8,y);ctx.quadraticCurveTo(x-4,y-5,x,y);ctx.quadraticCurveTo(x+4,y-5,x+8,y);ctx.stroke();});
    layer(cam,0.45,200,(x,i,r)=>{ctx.fillStyle='#c8a878';ctx.fillRect(x-100,gtop-60,200,60);for(let k=0;k<8;k++)ctx.fillRect(x-100+k*26,gtop-72,16,12);
      ctx.fillStyle='#a88858';ctx.fillRect(x-100,gtop-30,200,4);if(r>0.4){ctx.fillStyle='#2a2a2a';ctx.fillRect(x-10,gtop-42,34,9);circ(x-10,gtop-37,9);}});
    floorBand(gtop,'#e8d0a0','#d4b880',cam,(x,i,r)=>{if(r>0.6){ctx.fillStyle='#f4e4d0';ctx.beginPath();ctx.ellipse(x+20,gtop+50+r*150,6,4,0.4,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#d4b880';ctx.beginPath();ctx.ellipse(x+r*40,gtop+40+r*170,22,3,0,0,Math.PI*2);ctx.fill();});
  }else if(t===9){ // big covered market
    skyGrad('#5a2a1a','#c8742a');
    layer(cam,0.15,180,(x,i,r)=>{ctx.fillStyle='#4a2414';ctx.fillRect(x-90,40,180,gtop-40);ctx.fillStyle='#2a140a';ctx.beginPath();ctx.moveTo(x-40,gtop);ctx.lineTo(x-40,gtop-90);ctx.arc(x,gtop-90,40,Math.PI,0);ctx.lineTo(x+40,gtop);ctx.fill();});
    layer(cam,0.45,140,(x,i,r)=>{const cols=['#c0392b','#e0a020','#2a7f5f','#8e44ad'],c=cols[((i%4)+4)%4];
      for(let k=0;k<5;k++){ctx.fillStyle=k%2?'#f2e6c8':c;ctx.fillRect(x-60+k*24,gtop-112,24,22);}
      ctx.fillStyle='#b5651d';ell(x-30,gtop-14,14,14);ctx.fill();ell(x,gtop-18,12,18);ctx.fill();ctx.fillStyle='#8a4a14';ctx.fillRect(x-6,gtop-38,12,6);
      const fl=0.6+0.3*Math.sin(frame*0.08+i);ctx.fillStyle='rgba(255,200,90,'+fl*0.4+')';circ(x+40,gtop-130,14);ctx.fillStyle='#d4a020';ctx.fillRect(x+36,gtop-138,8,14);});
    floorBand(gtop,'#b8603a','#9a4a2a',cam,(x,i,r)=>{ctx.strokeStyle='#9a4a2a';ctx.lineWidth=2;ctx.strokeRect(x,gtop+10+(i%2)*40,70,40);ctx.strokeRect(x,gtop+130+(i%2)*40,70,40);});
  }else if(t===10){ // fire mountain
    skyGrad('#3a0a0a','#a8301a');
    layer(cam,0.1,500,(x,i,r)=>{ctx.fillStyle='#2a0e0e';tri(x-260,gtop,x-40,gtop-200,x+180,gtop);ctx.fillStyle='rgba(255,120,40,'+(0.5+0.3*Math.sin(frame*0.06+i))+')';tri(x-62,gtop-188,x-18,gtop-188,x-40,gtop-110);});
    layer(cam,0.45,130,(x,i,r)=>{ctx.fillStyle='#3a1a14';tri(x-50,gtop,x+r*20,gtop-60-r*60,x+50,gtop);});
    for(let k=0;k<25;k++){ctx.fillStyle='rgba(255,'+(120+k*4)+',40,.8)';circ((k*113+frame*0.7*(1+k%3))%W,H-((k*67+frame*(1+k%4*0.5))%H),2);}
    floorBand(gtop,'#2e1c18','#1e100c',cam,(x,i,r)=>{if(r>0.45){ctx.strokeStyle='rgba(255,'+(90+Math.floor(60*Math.sin(frame*0.05+i)))+',30,.85)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,gtop+30+r*120);ctx.lineTo(x+20,gtop+40+r*120);ctx.lineTo(x+36,gtop+32+r*120);ctx.stroke();}});
  }else{
    skyGrad('#2a0f2e','#7a1f2a');
    ctx.fillStyle='#ff5a3a';circ(760,90,46);ctx.fillStyle='rgba(42,15,46,.5)';circ(776,82,40);
    layer(cam,0.15,280,(x,i,r)=>{const hh=140+r*80;ctx.fillStyle='#1a0a1c';ctx.fillRect(x-60,gtop-hh,120,hh);for(let k=0;k<6;k++)ctx.fillRect(x-60+k*22,gtop-hh-12,12,12);ctx.fillRect(x-20,gtop-hh-60,40,60);tri(x-26,gtop-hh-60,x+26,gtop-hh-60,x,gtop-hh-100);ctx.fillStyle='#ffb040';ctx.fillRect(x-4,gtop-hh-40,8,12);});
    layer(cam,0.5,150,(x,i,r)=>{ctx.fillStyle='#3a2a2a';ctx.fillRect(x-4,gtop-70,8,70);const fl=Math.sin(frame*0.3+i)*3;ctx.fillStyle='#ff8a20';tri(x-7,gtop-70,x+7,gtop-70,x,gtop-92+fl);ctx.fillStyle='#ffe080';tri(x-3,gtop-70,x+3,gtop-70,x,gtop-82+fl);});
    floorBand(gtop,'#3b2b2b','#2a1e1e',cam,(x,i,r)=>{ctx.strokeStyle='#2a1e1e';ctx.lineWidth=2;ctx.strokeRect(x,gtop+20+(i%3)*60,70,60);});
  }
}

/* ================= DRAW: SCREENS ================= */
function drawPlay(){
  const sk=G.shake*SET.shake,sx=sk>0?rnd(-sk,sk):0,sy=sk>0?rnd(-sk,sk):0;
  G.shake*=0.88;if(G.shake<0.5)G.shake=0;
  ctx.save();ctx.translate(sx,sy);
  drawBG(LV[G.level].bg,G.cam);
  for(const z of G.zones){const zx=z.x-G.cam;ctx.fillStyle='rgba(255,220,120,.14)';ell(zx,z.y,z.r,z.r/1.8);ctx.fill();ctx.strokeStyle='rgba(255,220,120,.5)';ctx.lineWidth=2;ctx.stroke();}
  const list=[];
  for(const c of G.pick)list.push({y:c.y,f:()=>drawPick(c)});
  for(const h of G.heroes)list.push({y:h.y+(h.down?-50:0),f:()=>drawHero(h)});
  for(const e of G.enemies)list.push({y:e.y,f:()=>drawEnemy(e)});
  for(const p of G.proj)list.push({y:p.y,f:()=>drawProj(p)});
  list.sort((a,b)=>a.y-b.y);
  for(const d of list)d.f();
  for(const f of G.fx)drawFx(f);
  if(G.flashT>0){ctx.fillStyle='rgba(255,200,240,'+(G.flashT/28)+')';ctx.fillRect(-20,-20,W+40,H+40);}
  for(const t of G.texts){ctx.globalAlpha=Math.min(1,t.life/20);txt(t.s,t.x-G.cam,t.y-t.z,16,t.col);ctx.globalAlpha=1;}
  ctx.restore();
  drawHUD();
}
/* HUD, menu, shop and end screens live in js/ui.js */

/* ================= LOOP ================= */
function update(){
  pollPads();
  if(window.LOADER&&LOADER.on){for(const k in pressed)delete pressed[k];frame++;return;} // no input behind the loading screen
  if(gateTick()||sndTick()){try{ambTick();}catch(e){}for(const k in pressed)delete pressed[k];frame++;return;} // the door between scenes
  for(let p=0;p<2;p++){
    if(padTap(p,'start')){if(state==='play')pressed.Escape=true;else pressed.Enter=true;}
    if(padTap(p,'back')){if(state==='play'&&G.paused)pressed.Backspace=true;else pressed.Escape=true;}
    if(padTap(p,'b')){if(state==='play'){if(G.paused)G.paused=false;}else if(state!=='story')pressed.Escape=true;} // B = back in every menu
    if(padTap(p,'a')&&state==='win')pressed.Enter=true;
  }
  if(state==='menu')updMenu();
  else if(state==='play')updPlay();
  else if(state==='shop')updShop();
  else if(state==='story')updStory();
  else updEnd();
  try{tutTick();ambTick();}catch(e){}
  for(const k in pressed)delete pressed[k];
  frame++;
}
function draw(){
  const k=cv.width/W;
  ctx.setTransform(k,0,0,k,0,0);ctx.direction='rtl';
  ctx.clearRect(0,0,W,H);
  UI.hits.length=0;
  if(state==='menu')drawMenu();
  else if(state==='play')drawPlay();
  else if(state==='shop')drawShop();
  else if(state==='over')drawOver();
  else if(state==='story')drawStory();
  else drawWin();
  if(state==='play'||state==='shop')drawTut();
  const gateOn=typeof GATE!=='undefined'&&GATE.on; // gate.js loads last
  if(!gateOn&&!SNDUI.open){ // the gear that opens the sound window
    if(state==='menu')gearBtn(118,10);else if(state==='play'&&!G.paused)gearBtn(12,108);else if(state==='shop')gearBtn(14,11);}
  drawSndUI();
  if(gateOn)drawGate();
}
let last=performance.now(),acc=0;
function loop(now){
  acc+=Math.min(100,now-last);last=now;
  requestAnimationFrame(loop); // scheduled first: an error below can never stop the game
  try{
    let steps=0;
    while(acc>=1000/60&&steps<4){update();acc-=1000/60;steps++;}
    if(steps>=4)acc=0; // a slow device skips time instead of piling up work
    draw();
  }catch(e){console.error(e);}
}
// the loop starts at the end of map.js, once every script is loaded
