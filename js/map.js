'use strict';
/* ================= WORLD MAP & STAGE SELECT =================
   Each stage is an Arab country, from Morocco to the heart of Arabia, with a true fact to learn.
   Progress (cleared stages, gold, upgrades, team) is kept in localStorage 'atlasProg'. */

/* stage → country: lon/lat on the map, label side, icon, and the fact you learn there */
const COUNTRY=[
  {c:'المغرب',lon:-6.4,lat:31.6,ico:'🌲',lab:1,fact:'فالمغرب كاينة جامعة القرويين ففاس، بناتها فاطمة الفهرية عام 859، وهي أقدم جامعة باقا خدامة فالعالم.'},
  {c:'الجزائر',lon:2.6,lat:27.6,ico:'🏜',lab:1,fact:'الجزائر هي أكبر بلد فإفريقيا وفالعالم العربي بالمساحة، والصحرا كتغطي تقريبا 80% منها.'},
  {c:'تونس',lon:9.4,lat:34.2,ico:'🏛',lab:-1,fact:'قرطاج فتونس كانت مدينة كبيرة قبل حوالي 2800 عام، وكانت كتتاجر فالبحر الأبيض المتوسط كامل.'},
  {c:'ليبيا',lon:17.5,lat:27.2,ico:'🖐',lab:1,fact:'فجبال أكاكوس فليبيا كاينين رسومات على الصخور عمرها آلاف السنين، كتبين حيوانات كانت عايشة ملي كانت الصحرا خضرا.'},
  {c:'مصر',lon:30.2,lat:26.4,ico:'🔺',lab:1,fact:'الهرم الأكبر فالجيزة بقا أعلى بناء صنعو الإنسان أكثر من 3800 عام، والنيل من أطول الأنهار فالعالم.'},
  {c:'لبنان',lon:35.7,lat:33.9,ico:'🌲',lab:-1,dx:-12,fact:'مدينة جبيل فلبنان من أقدم المدن فالعالم، ومن تما انتاشرات الأبجدية الفينيقية اللي جات منها بزاف ديال الحروف.'},
  {c:'سوريا',lon:38.6,lat:35.4,ico:'🏺',lab:-1,dx:10,fact:'دمشق من أقدم المدن فالعالم اللي باقين الناس عايشين فيها حتى لدابا، وسوق الحميدية ديالها مشهور بزاف.'},
  {c:'العراق',lon:44,lat:32.6,ico:'📜',lab:1,fact:'فبلاد الرافدين (العراق) تخترعات الكتابة المسمارية، من أقدم الكتابات فالتاريخ، كانو كيكتبوها على ألواح ديال الطين.'},
  {c:'عُمان',lon:57,lat:21.4,ico:'⛵',lab:1,fact:'البحارة العمانيين كانو كيسافرو بالسفن الخشبية حتى لشرق إفريقيا والهند، وعمان عامرة بالقلاع والحصون القديمة.'},
  {c:'اليمن',lon:46.5,lat:15.6,ico:'🏙',lab:1,fact:'مدينة شبام فاليمن فيها عمارات طوال مبنية بالطين، عمرها مئات السنين، وكيسميوها «منهاتن الصحراء».'},
  {c:'الربع الخالي',lon:49.6,lat:20.4,ico:'🏰',lab:-1,fact:'الربع الخالي فجزيرة العرب هو أكبر صحرا ديال الرمل المتصل فالعالم... وفوسطو تخبات قلعة الظلام!'}
];

/* ---------- progress ---------- */
const PROG={cleared:0,gold:0,upg:null,intro:0,joins:{},gate:0,ending:0,team:[0]};
try{const v=JSON.parse(localStorage.getItem('atlasProg')||'null');if(v&&typeof v==='object')Object.assign(PROG,v);}catch(e){}
PROG.cleared=clamp(PROG.cleared|0,0,LV.length);
gold=Math.max(0,PROG.gold|0);
// saves from before the 20-level shop (uv<2) had 5 big steps: one old step = 4 new ones
if(Array.isArray(PROG.upg))PROG.upg.forEach((u,i)=>{if(upg[i]&&u)for(const k of UPK)upg[i][k]=clamp((u[k]|0)*(PROG.uv>=2||!['dmg','hp','sk'].includes(k)?1:4),0,UPMAX);});
PROG.uv=2;
function saveProg(){PROG.gold=gold;PROG.upg=upg;try{localStorage.setItem('atlasProg',JSON.stringify(PROG));}catch(e){}}
function team(){ // the letters you take on the field, in order (first = player 1)
  let t=(Array.isArray(PROG.team)?PROG.team:[]).filter((i,k,a)=>FOUND.includes(i)&&a.indexOf(i)===k).slice(0,MAX_FIELD);
  for(const i of FOUND)if(t.length<Math.min(MAX_FIELD,FOUND.length)&&!t.includes(i)&&!PROG.teamSet)t.push(i);
  if(!t.length)t=[FOUND[0]];
  PROG.team=t;return t;
}
menu.sel=Math.min(PROG.cleared,LV.length-1);menu.team=false;menu.tc=0;
function resetMenu(){saveProg();menu.sel=Math.min(PROG.cleared,LV.length-1);menu.team=false;state='menu';}
const unlocked=n=>n<=PROG.cleared;

/* build the team for stage n (or just for the shop) */
function buildTeam(n){
  const t=team(),roster=[],heroes=[];let gift=null;
  t.forEach((i,k)=>{const h=makeHero(i,k===0?0:(k===1&&menu.mode===1?1:'bot'));roster.push(h);heroes.push(h);});
  if(menu.mode===1&&heroes.length===1){ // a friend but only one letter: the friend gets a brand-new one
    const i=nextLetter(FOUND);
    if(i!=null){gift=i;discover(i);PROG.team=t.concat(i);const h=makeHero(i,1);roster.push(h);heroes.push(h);}
  }
  const bench=FOUND.filter(i=>!roster.some(h=>h.idx===i)).map(i=>makeHero(i,'bot'));
  G={level:n,roster:roster.concat(bench),heroes,bench,joins:PROG.joins,p2wait:false,enemies:[],proj:[],fx:[],pick:[],zones:[],texts:[],cam:0,shake:0,met:FOUND.length-1,gate:!!PROG.gate};
  return gift;
}
function startStage(n){
  if(!unlocked(n)){SFX.no();return;}
  SFX.buy();
  const gift=buildTeam(n);
  let slides=[],intro=!PROG.intro;
  if(intro){PROG.intro=1;slides=storyIntro();}
  if(gift!=null){G.met=FOUND.length-1;slides=slides.concat(storyMeet(gift,G.met,COUNTRY[n].c));PROG.joins[0]=1;}
  saveProg();
  if(slides.length)playStory(slides,()=>startLevel(n),intro?'📖 حكاية الكتاب الكبير':'✨ لقيتي حرف: '+HEROES[gift].name);
  else startLevel(n);
}
function stageCleared(){
  const n=G.level,first=n>=PROG.cleared;
  PROG.cleared=Math.max(PROG.cleared,n+1);
  const b=first?25+n*10:8+n*3;gold+=b;G.bonus=b; // the stage's reward: a small purse, less when you play it again
  G.fact=COUNTRY[n];
  saveProg();
  if(n>=LV.length-1){
    if(!PROG.ending){PROG.ending=1;saveProg();playStory(storyEnding(),()=>{state='win';},'📖 النهاية');}else state='win';
  }else{shop.from='play';shop.hero=0;shop.row=1;state='shop';}
}
function openShop(){buildTeam(menu.sel);shop.from='map';shop.hero=0;shop.row=1;state='shop';}

/* ---------- input ---------- */
function updMenu(){
  if(menu.team){updTeam();return;}
  const n=LV.length;
  if(tap(0,'up')||tap(0,'left')){menu.sel=(menu.sel+n-1)%n;SFX.coin();} // the road runs west → east on the map
  if(tap(0,'down')||tap(0,'right')){menu.sel=(menu.sel+1)%n;SFX.coin();}
  if(tap(1,'a')&&menu.mode===0){menu.mode=1;SFX.coin();}
  if(tap(1,'k')&&menu.mode===1){menu.mode=0;SFX.no();}
  if(tap(0,'sw')||pressed.KeyT){menu.team=true;menu.tc=0;SFX.coin();}
  else if(tap(0,'k')||pressed.KeyH){openShop();SFX.coin();}
  else if(pressed.Enter||pressed.NumpadEnter||pressed.Space||tap(0,'a'))startStage(menu.sel);
  else if(pressed.Escape)goHome();
}
function teamToggle(i){
  const t=team();PROG.teamSet=1;
  if(t.includes(i)){if(t.length>1)PROG.team=t.filter(x=>x!==i);else SFX.no();}
  else if(t.length<MAX_FIELD)PROG.team=t.concat(i);
  else{SFX.no();return;}
  SFX.coin();saveProg();
}
function teamFront(k){const t=team();if(k<=0||k>=t.length)return;[t[k-1],t[k]]=[t[k],t[k-1]];PROG.team=t;PROG.teamSet=1;SFX.coin();saveProg();}
function updTeam(){
  const n=FOUND.length;menu.tc=clamp(menu.tc,0,n-1);
  if(tap(0,'right'))menu.tc=(menu.tc+n-1)%n;if(tap(0,'left'))menu.tc=(menu.tc+1)%n;
  if(tap(0,'a')||pressed.Space)teamToggle(FOUND[menu.tc]);
  if(tap(0,'k')){const k=team().indexOf(FOUND[menu.tc]);if(k>0)teamFront(k);}
  if(pressed.Escape||pressed.Enter||pressed.NumpadEnter||tap(0,'sw')||pressed.KeyT){menu.team=false;SFX.coin();}
}

/* ---------- the map ---------- */
const LAND=[ // simplified coastlines (lon, lat): Africa + Arabia + the Levant, then Europe's edges
  [[9,0],[9,2],[9,4],[5,6],[0,5.5],[-5,5],[-8,4.5],[-11,7],[-13,9],[-15,11],[-17,14.5],[-16.5,19],[-17,21],[-15,24],[-13,27.5],[-10,29.5],[-9.8,31.5],[-8.5,33.3],[-6.5,34.5],[-5.9,35.8],
   [-2,35.1],[0,35.9],[3,36.8],[6,37],[9,37.3],[10.3,36.8],[11,35.5],[10,34.3],[10.5,33.5],[12,33],[15,32.3],[15.5,31],[19,30.3],[20,31.5],[20,32.5],[22,32.9],[25,31.7],[29,30.9],[32,31.3],[34.3,31.3],
   [34.9,32.5],[35.5,34],[36,35],[35.9,36.6],[36.2,36.9],[34.5,36.8],[32.5,36.1],[30.5,36.6],[29,36.6],[27.3,37],[26.5,38.4],[26.2,39.5],[26.5,40.3],[26,42],[70,42],
   [70,25.2],[61.5,25.2],[58.8,25.6],[57.3,25.8],[56.4,27.1],[54.5,26.6],[52,27.8],[50.8,28.9],[50.1,30.1],[48.8,30.2],[48,29.6],[48.5,28.2],[49.6,26.9],[50.2,26],[50.8,25.4],[50.8,24.8],[51.3,26.1],[51.6,25.3],[51.6,24.6],[52,24],[53.5,24.1],[54.6,24.3],[55.6,25.4],[56.1,26.2],[56.4,24.8],[57.2,23.9],[58.6,23.6],[59.8,22.5],[59.3,21.3],[58.5,20.4],[57.8,19],[56.6,18.4],[55.3,17.6],[54,16.9],[52.2,15.7],[50,15],[48,14],[45,13],[43.5,12.7],
   [42.8,14.8],[42.6,16.5],[41.5,18.5],[40,20.5],[39.1,21.5],[38.3,23.8],[37.2,25],[35.6,27.6],[34.8,28.8],[34.9,29.5],[34.25,27.75],[32.6,29.9],[33,28.2],[34.2,26.3],[35.5,24],[37.2,21],[37.4,18.8],[38.6,18],[39.7,15.4],[41.6,13.5],[43.3,11.6],[44.6,10.4],[47,11.1],[51.2,11.8],[51,10],[49.5,7],[48,4.5],[46,2],[43,0]],
  [[-9.3,42],[-8.8,40],[-9.4,38.8],[-8.8,37],[-7.4,37.2],[-6.3,36.8],[-5.6,36],[-4.4,36.7],[-2.1,36.7],[-0.7,37.6],[0.2,38.8],[-0.3,39.5],[0.9,41],[3.2,42]],
  [[10.5,42.2],[12.5,41.4],[14,40.8],[15.6,40],[15.6,38.2],[16.1,38],[16.6,39],[17.2,39.4],[16.6,40.2],[18.5,40.1],[17,41],[16,41.9],[15.5,42.2]],
  [[12.4,38.1],[15.6,38.3],[15.1,36.7]],
  [[8.4,41],[9.8,41],[9.6,39.1],[8.4,39]],
  [[19.4,42.2],[19.4,40.4],[20.2,39.6],[21.1,38.3],[21.7,36.8],[22.6,36.4],[23.2,37.3],[23.9,38],[22.8,39.5],[22.6,40.5],[23.9,40.3],[26,40.8],[26.2,42.2]],
  [[23.5,35.5],[26.3,35.2],[24,35.1]],
  [[32.3,35.1],[33,35.4],[34.5,35.6],[33.9,34.9],[33,34.6]]
];
const CASPIAN=[[49,42.2],[50,40.4],[49.2,39.1],[48.9,38],[49.5,37.4],[51,36.7],[53.9,36.9],[53.9,38.9],[53.2,39.3],[53,40.6],[52.6,42.2]];
const NILE=[[31.2,30.4],[31.3,27.5],[32.7,25.7],[32.9,24],[31.5,22],[30.5,19.5],[32.5,15.6],[32.6,12]];
const EUPHRATES=[[38.2,36.6],[40.2,35],[43.3,32.6],[46.4,31],[48,30.4]];
let MP={x:0,y:0,s:1};
function mapXY(lon,lat){return [MP.x+(lon+18)*MP.s,MP.y+(40-lat)*MP.s*1.12];}
function mapPath(pts,close){ctx.beginPath();pts.forEach(([lo,la],k)=>{const [x,y]=mapXY(lo,la);k?ctx.lineTo(x,y):ctx.moveTo(x,y);});if(close!==false)ctx.closePath();}
function drawMap(x,y,w,h){
  const s=Math.min(w/80,h/(32*1.12));MP={s,x:x+(w-80*s)/2,y:y+(h-32*1.12*s)/2};
  cached('map|'+[x,y,w,h].map(Math.round).join(','),x,y,w,h,()=>{
  ctx.save();rp(x,y,w,h,10);ctx.clip();
  // sea
  ctx.fillStyle=vgrad(y,y+h,['#3d86b4','#2a6a96','#1f557c']);ctx.fillRect(x,y,w,h);
  ctx.strokeStyle='rgba(255,255,255,.13)';ctx.lineWidth=1.5;
  for(let k=0;k<40;k++){const wx=x+srand(k*3.1)*w,wy=y+srand(k*7.7)*h,o=0;ctx.beginPath();ctx.moveTo(wx-8+o,wy);ctx.quadraticCurveTo(wx+o,wy-4,wx+8+o,wy);ctx.stroke();}
  // land: shadow, coast glow, sand
  ctx.save();ctx.translate(2,4);ctx.fillStyle='rgba(0,0,0,.25)';for(const p of LAND){mapPath(p);ctx.fill();}ctx.restore();
  ctx.strokeStyle='rgba(190,235,255,.35)';ctx.lineWidth=7;for(const p of LAND){mapPath(p);ctx.stroke();}
  for(const p of LAND){mapPath(p);ctx.fillStyle=vgrad(y,y+h,['#f2dcaa','#e6c487','#d7aa66']);ctx.fill();ctx.strokeStyle='#7a5222';ctx.lineWidth=2;ctx.stroke();}
  ctx.save();for(const p of LAND.slice(1)){mapPath(p);ctx.fillStyle='rgba(60,40,70,.28)';ctx.fill();}ctx.restore(); // Europe: not on our road
  mapPath(CASPIAN);ctx.fillStyle='#2f77a6';ctx.fill();ctx.strokeStyle='#7a5222';ctx.lineWidth=2;ctx.stroke();
  ctx.strokeStyle='#3a8cc0';ctx.lineWidth=2.4;ctx.lineJoin='round';mapPath(NILE,false);ctx.stroke();mapPath(EUPHRATES,false);ctx.stroke();
  // decorations: mountains, dunes, palms
  const mt=(lo,la,sz)=>{const [mx,my]=mapXY(lo,la);ctx.fillStyle='#9a7448';tri(mx-sz,my,mx,my-sz*1.2,mx+sz,my);ctx.fillStyle='#fff6e0';tri(mx-sz*0.35,my-sz*0.78,mx,my-sz*1.2,mx+sz*0.35,my-sz*0.78);};
  const dune=(lo,la)=>{const [dx,dy]=mapXY(lo,la);ctx.strokeStyle='rgba(150,100,40,.55)';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(dx,dy+6,9,Math.PI*1.15,Math.PI*1.85);ctx.stroke();ctx.beginPath();ctx.arc(dx+10,dy+9,7,Math.PI*1.15,Math.PI*1.85);ctx.stroke();};
  const palm=(lo,la)=>{const [px,py]=mapXY(lo,la);ctx.strokeStyle='#7a5222';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,py);ctx.quadraticCurveTo(px+2,py-6,px,py-11);ctx.stroke();ctx.fillStyle='#4f8a3a';for(const a of [-2.6,-1.9,-1.2,-0.5])ell(px+Math.cos(a)*5,py-11+Math.sin(a)*2.5,5,1.8),ctx.fill();};
  mt(-7,31,s*0.9);mt(-4.5,32.4,s*0.75);mt(-2.6,31.8,s*0.6);mt(5,36,s*0.55);mt(8.8,23.6,s*0.7);mt(36.2,34.4,s*0.5);mt(44,17,s*0.6);mt(57.4,23.3,s*0.5);
  for(const [lo,la] of [[-2,25],[6,30],[11,22],[22,25],[25,20],[42,25],[52,22],[54,19.4],[46.5,21],[13,28]])dune(lo,la);
  for(const [lo,la] of [[30.8,28.5],[32.2,24.5],[25.6,29.2],[10.2,31.5],[-5,29.2],[44.4,30.4]])palm(lo,la);
  // sea names
  ctx.globalAlpha=0.7;txt('المحيط الأطلسي',...mapXY(-13,19),11,'#d6efff','center',false);txt('البحر الأبيض المتوسط',...mapXY(19,34.6),11,'#d6efff','center',false);
  ctx.save();ctx.translate(...mapXY(38.6,21));ctx.rotate(1.0);txt('البحر الأحمر',0,0,10,'#d6efff','center',false);ctx.restore();
  txt('بحر العرب',...mapXY(57.5,14.6),11,'#d6efff','center',false);ctx.globalAlpha=1;
  // compass
  {const [cx,cy]=mapXY(-13,10),r=s*2.2;ctx.fillStyle='rgba(255,240,200,.85)';star8(cx,cy,r,'rgba(255,240,200,.8)');ctx.fillStyle='#b8322a';tri(cx-r*0.28,cy,cx,cy-r*1.25,cx+r*0.28,cy);ctx.fillStyle='#f2dcaa';tri(cx-r*0.28,cy,cx,cy+r*1.25,cx+r*0.28,cy);txt('ش',cx,cy-r*1.6,11,'#fff','center');}
  ctx.restore();});
  ctx.save();rp(x,y,w,h,10);ctx.clip();
  // the road between countries
  const P=COUNTRY.map(o=>mapXY(o.lon,o.lat));
  for(let k=0;k<P.length-1;k++){
    const [ax,ay]=P[k],[bx,by]=P[k+1],done=k+1<=PROG.cleared,mx=(ax+bx)/2,my=(ay+by)/2-Math.hypot(bx-ax,by-ay)*0.18;
    ctx.setLineDash(done?[]:[6,6]);ctx.lineDashOffset=-frame*0.4;ctx.lineCap='round';
    ctx.strokeStyle=INK;ctx.lineWidth=done?6:4.5;ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo(mx,my,bx,by);ctx.stroke();
    ctx.strokeStyle=done?'#ffd24a':'rgba(255,248,220,.75)';ctx.lineWidth=done?3:2;ctx.stroke();
  }
  ctx.setLineDash([]);
  // the country nodes
  COUNTRY.forEach((o,k)=>{
    const [nx,ny]=P[k],sel=menu.sel===k,open=unlocked(k),done=k<PROG.cleared,cur=open&&!done,r=sel?14:11,boss=k===LV.length-1;
    if(sel){ctx.fillStyle='rgba(255,220,90,'+(0.25+0.15*Math.sin(frame*0.12))+')';circ(nx,ny,r+10);}
    ctx.fillStyle=INK;circ(nx,ny,r+3);
    ctx.fillStyle=vgrad(ny-r,ny+r,done?FRAMES.green:cur?FRAMES.gold:boss?FRAMES.red:FRAMES.steel);circ(nx,ny,r);
    txt(open?(done?'✓':''+(k+1)):'🔒',nx,ny+1,open?(sel?15:12):(sel?12:10),'#fff',INK);
    const lab=o.c,ly=ny+o.lab*(r+12),lx=nx+(o.dx||0);
    txt(lab,lx,ly,sel?14:12,sel?'#ffe680':(open?'#ffffff':'#c8c4d8'),'center',INK);
    hit(nx-r-4,ny-r-4,2*r+8,2*r+8,()=>{if(menu.sel!==k){menu.sel=k;SFX.coin();}else startStage(k);});
  });
  // your leader stands on the chosen country
  {const [nx,ny]=P[menu.sel],i=team()[0],bob=Math.abs(Math.sin(frame*0.1))*5;
    ctx.fillStyle='rgba(0,0,0,.3)';ell(nx,ny-15,10,3);ctx.fill();drawHeroLook(i,nx,ny-16-bob,1,0.42,{});}
  ctx.restore();
  ctx.strokeStyle=INK;ctx.lineWidth=3;rp(x,y,w,h,10);ctx.stroke();
  // controls reminder
  const k=KL,hint=padCount?'🎮  A ابدا  •  Y الفريق  •  X الحانوت  •  B رجوع  •  المانيطة 2: A يدخل صاحبك':'⌨  '+k.KeyW+k.KeyS+' ختار  •  Enter ابدا  •  '+k.KeyQ+' الفريق  •  '+k.KeyK+' الحانوت  •  Esc رجوع';
  setFont(11);const hw=ctx.measureText(hint).width+24;ctx.fillStyle='rgba(10,8,24,.72)';rp(x+w/2-hw/2,y+h-26,hw,20,10);ctx.fill();txt(hint,x+w/2,y+h-16,11,'#e8e6f6','center',false);
}

/* ---------- the stage-select screen ---------- */
function drawMenu(){
  cached('menubg',0,0,W,H,()=>{ctx.fillStyle=vgrad(0,H,['#241a46','#151230','#0c0a1e']);ctx.fillRect(0,0,W,H);ctx.globalAlpha=0.05;ctx.fillStyle=zellige();ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;});
  // header
  btn(14,10,44,38,'🏠',goHome,'dark',{size:18});
  btn(66,10,44,38,'⛶',toggleFS,'dark',{size:18});
  coinPill(174,29,gold);
  ribbonFit(W/2,30,'🗺 رحلة الحروف فبلاد العرب',20,'#b8322a',320);
  pill(W-90,29,'🏆 '+PROG.cleared+' من '+LV.length,'#3a3f78',14);
  const LW=Math.min(270,Math.max(230,W*0.24)),top=62,mh=300;
  // stage list (right)
  const lx=W-LW-14;panel(lx,top,LW,mh,{frame:FRAMES.gold,r:14});
  txt('المراحل',lx+LW/2,top+20,16,'#ffd24a');
  const rh=23.6;
  for(let k=0;k<LV.length;k++){
    const ry=top+34+k*rh,rx=lx+10,rw=LW-20,sel=menu.sel===k,open=unlocked(k),done=k<PROG.cleared,hv=overBox(rx,ry,rw,rh-2);
    ctx.fillStyle=sel?'rgba(255,210,74,.28)':hv?'rgba(255,255,255,.1)':(k%2?'rgba(0,0,0,.18)':'rgba(0,0,0,.08)');rp(rx,ry,rw,rh-2,6);ctx.fill();
    if(sel){ctx.strokeStyle='#ffd24a';ctx.lineWidth=2;ctx.stroke();}
    ctx.fillStyle=INK;circ(rx+rw-12,ry+rh/2-1,9.5);ctx.fillStyle=done?'#46b83a':open?'#f5b52e':'#4a4e70';circ(rx+rw-12,ry+rh/2-1,8);
    txt(''+(k+1),rx+rw-12,ry+rh/2,10,'#fff',INK);
    txt(COUNTRY[k].ico+'  '+COUNTRY[k].c,rx+rw-28,ry+rh/2,13,open?'#fff':'#8a88a6','right',false);
    if(done)txt('✓',rx+14,ry+rh/2,14,'#7dff6a','center',INK);
    else if(open)pill(rx+24,ry+rh/2-1,'جديد','#c0392b',9);
    else txt('🔒',rx+14,ry+rh/2,11,'#fff','center',false);
    hit(rx,ry,rw,rh-2,()=>{if(menu.sel!==k){menu.sel=k;SFX.coin();}});
  }
  // map (left)
  const mx=14,mw=lx-mx-12;
  panel(mx,top,mw,mh,{frame:FRAMES.gold,r:14,pattern:false});
  drawMap(mx+8,top+8,mw-16,mh-16);
  // stage info (bottom right)
  const by=top+mh+12,bh=H-by-10,iw=Math.round((W-28)*0.54),ix=W-14-iw;
  panel(ix,by,iw,bh,{frame:FRAMES.blue,r:14});
  const n=menu.sel,L=LV[n],C=COUNTRY[n],open=unlocked(n);
  const tw_=Math.min(170,iw*0.32),th=tw_*0.6,tx=ix+iw-tw_-14,ty=by+14;
  cached('thumb'+L.bg+'|'+Math.round(tw_),tx,ty,tw_,th,()=>{rp(tx,ty,tw_,th,8);ctx.clip();ctx.translate(tx,ty);ctx.scale(tw_/W,th/H);drawBG(L.bg,0);});
  if(!open){ctx.fillStyle='rgba(10,8,24,.65)';rp(tx,ty,tw_,th,8);ctx.fill();txt('🔒',tx+tw_/2,ty+th/2,26,'#fff','center',false);}
  ctx.strokeStyle=INK;ctx.lineWidth=2.5;rp(tx,ty,tw_,th,8);ctx.stroke();
  txt('المرحلة '+(n+1),tx+tw_/2,ty+th+14,12,'#bfe0ff','center',false);
  if(open&&n<PROG.cleared)pill(tx+tw_/2,ty+th+34,'✓ تربحات','#2f8a2a',11);
  const ax=tx-14,aw=ax-ix-14;
  txt(C.ico+' '+C.c,ax,by+24,22,'#ffe680','right');
  const mons=[...new Set(L.types)].slice(0,3).map(t=>ENAME[t]).join('، ');
  txt('👹 '+L.boss,ax,by+52,13,'#ffb8a8','right',false);
  txt('🐾 '+mons,ax-tw('👹 '+L.boss,13)-18,by+52,12,'#ffd8a0','right',false);
  if(open){
    txt('💡 واش كتعرف؟',ax,by+76,14,'#7fd6ff','right',false);
    wrapLines(C.fact,aw,13).slice(0,3).forEach((s,k)=>txt(s,ax,by+98+k*19,13,'#eef0ff','right',false));
  }else txt('ربح المرحلة اللي قبل باش تحل هاد البلاد وتعرف السر ديالها.',ax,by+86,13,'#a8a6c8','right',false);
  if(n>0&&n%JOIN_EVERY===0&&!PROG.joins[n]&&nextLetter(FOUND)!=null)pill(ix+70,by+24,'🔓 حرف جديد كيتسناك!','#8a3ab8',11);
  // team (bottom left)
  const pw=ix-14-12,px=14;
  panel(px,by,pw,bh,{frame:FRAMES.gold,r:14});
  const t=team();
  txt('الفريق',px+pw-18,by+20,15,'#ffd24a','right');
  const slot=Math.min(60,(pw-150)/4);
  for(let k=0;k<MAX_FIELD;k++){
    const sx=px+pw-30-slot/2-k*slot,sy=by+62,i=t[k];
    if(i!=null){medallion(sx,sy,slot*0.4,i,{ring:k===0?FRAMES.blue:(k===1&&menu.mode===1?FRAMES.red:FRAMES.gold)});
      pill(sx,sy+slot*0.4+8,k===0?'P1':(k===1&&menu.mode===1?'P2':'BOT'),k===0?TAGC[0]:(k===1&&menu.mode===1?TAGC[1]:'#6a6f90'),9);}
    else{ctx.fillStyle='rgba(0,0,0,.35)';circ(sx,sy,slot*0.36);ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(sx,sy,slot*0.36,0,7);ctx.stroke();ctx.setLineDash([]);
      txt(k<FOUND.length?'+':'?',sx,sy,16,'rgba(255,255,255,.35)','center',false);}
  }
  hit(px+pw-30-slot*4,by+30,slot*4+20,slot,()=>{menu.team=true;SFX.coin();});
  const bx=px+14,bw=Math.min(150,pw-slot*4-60);
  btn(bx,by+14,bw,30,menu.mode===1?'👥 مع صاحبي':'👤 بوحدي',()=>{menu.mode^=1;SFX.coin();},menu.mode===1?'red':'blue',{size:14});
  btn(bx,by+54,bw/2-4,30,'👥 الفريق',()=>{menu.team=true;menu.tc=0;SFX.coin();},'dark',{size:13});
  btn(bx+bw/2+4,by+54,bw/2-4,30,'🛒 الحانوت',openShop,'dark',{size:13});
  btn(px+14,by+bh-56,pw-28,44,open?'⚔ ابدا المرحلة '+(n+1):'🔒 مازال مسدودة',()=>startStage(n),open?'gold':'dark',{size:21,glow:open});
  if(menu.team)drawTeam();
}
function drawTeam(){
  ctx.fillStyle='rgba(6,4,16,.72)';ctx.fillRect(0,0,W,H);
  hit(0,0,W,H,()=>{}); // block clicks behind
  const n=FOUND.length,cw=124,pw=Math.max(520,Math.min(W-40,n*(cw+12)+60)),ph=408,px=W/2-pw/2,py=H/2-ph/2+8;
  panel(px,py,pw,ph,{frame:FRAMES.gold});
  ribbonFit(W/2,py+2,'👥 نظم الفريق ديالك',22,'#2f6fd0',300);
  const t=team();
  txt('فالشاشة كيدخلو حتى '+MAX_FIELD+' حروف، والباقيين كيتسناو فالاحتياط (تبدلهم بـ '+KL.KeyQ+' وسط اللعب).',W/2,py+46,13,'#d8d6ee','center',false);
  // team order
  for(let k=0;k<MAX_FIELD;k++){
    const sx=W/2+(1.5-k)*84,sy=py+104,i=t[k];
    ctx.fillStyle='rgba(0,0,0,.3)';rp(sx-38,sy-36,76,86,10);ctx.fill();
    txt(k===0?'القائد':''+(k+1),sx,sy-26,11,'#ffd24a','center',false);
    if(i!=null){medallion(sx,sy+6,26,i,{ring:k===0?FRAMES.blue:FRAMES.gold});txt(HEROES[i].name,sx,sy+42,12,'#fff');
      if(k>0){const ax=sx+38,hv=overBox(ax-12,sy-4,24,22);txt('⇨',ax,sy+6,hv?20:16,hv?'#ffe680':'#c8c4dc','center');hit(ax-12,sy-6,24,24,()=>teamFront(k));}}
  }
  // all letters
  const row=py+190;
  FOUND.forEach((i,k)=>{
    const x=W/2+((n-1)/2-k)*(cw+12)-cw/2,inT=t.indexOf(i),sel=menu.tc===k,hv=overBox(x,row,cw,130);
    panel(x,row-(hv?2:0),cw,130,{frame:inT>=0?(inT===0?FRAMES.blue:FRAMES.green):FRAMES.steel,r:12,noCorners:true});
    if(sel){ctx.strokeStyle='#fff';ctx.lineWidth=2.5;rp(x-5,row-5,cw+10,140,14);ctx.stroke();}
    medallion(x+cw/2,row+40,26,i,{dim:inT<0});
    txt(HEROES[i].name,x+cw/2,row+80,15,'#fff');
    pill(x+cw/2,row+106,inT>=0?(inT===0?'⭐ القائد':'✓ فالفريق'):'احتياط',inT>=0?(inT===0?'#2f6fd0':'#2f8a2a'):'#5a5e80',10);
    hit(x,row,cw,130,()=>{menu.tc=k;teamToggle(i);});
  });
  txt('كليك على حرف باش تزيدو ولا تحيدو • ⇨ باش تقدمو • '+KL.KeyJ+' زيد/حيد • '+KL.KeyK+' قدّم',W/2,py+ph-66,12,'#c8c4dc','center',false);
  btn(W/2-90,py+ph-44,180,36,'✔ صافي',()=>{menu.team=false;SFX.coin();},'green',{size:17});
}

// loading: the font, then the story pictures (so no chapter waits for them), with the bar on the loading screen
(function(){
  const L=window.LOADER||{set(){},done(){}},keys=['book','theft','scatter','dawn','cage','gate','armor','unite'];
  L.set(0.5);
  let n=0;const step=()=>{n++;L.set(0.6+0.4*n/keys.length);if(n>=keys.length)L.done();};
  const pics=()=>keys.forEach(k=>{storyImg(k);const im=STORY_IMG[k];
    if(im.complete&&im.naturalWidth)step();else{im.addEventListener('load',step,{once:true});im.addEventListener('error',step,{once:true});}});
  const fonts=document.fonts&&document.fonts.load?Promise.race([document.fonts.load('800 20px "Baloo Bhaijaan 2"'),new Promise(r=>setTimeout(r,2500))]):Promise.resolve();
  fonts.catch(()=>{}).then(()=>{L.set(0.6);_layers={};_layerN=0;pics();});
})();

requestAnimationFrame(loop);
