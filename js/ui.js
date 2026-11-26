'use strict';
/* ================= CANVAS UI KIT =================
   One look for every in-game screen: golden framed panels, 3D buttons, ribbons, medallions, keycaps. */
const INK='#120c1c';
const FRAMES={gold:['#fff0b0','#f2b631','#8a4e0c'],blue:['#c4e8ff','#3f9cff','#16438a'],red:['#ffc0b4','#ff5b4b','#8a1a14'],
  steel:['#c8cce8','#6a7099','#2a2d4a'],green:['#d0ffb0','#4cc040','#1d6a1a']};
const BTN={gold:['#ffe680','#f5b52e','#a8620e','#3a2004'],blue:['#9ad6ff','#2f86e0','#174a94','#fff'],green:['#b4f08a','#46b83a','#1f6a1c','#fff'],
  red:['#ffa08a','#e0483a','#8a1a14','#fff'],dark:['#5a6090','#30355e','#181a36','#fff']};
const HPG=['#c6ff9a','#4cd964','#1f8a3a'],HPR=['#ffb8a8','#ff4b4b','#9a1a1a'],GOLDB=['#fff3a0','#ffc82a','#b8700a'];
const TAGC=['#3f8ff0','#e84a3a'];

function shade(hex,a){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const t=a<0?0:255,k=Math.abs(a);
  return 'rgb('+Math.round(r+(t-r)*k)+','+Math.round(g+(t-g)*k)+','+Math.round(b+(t-b)*k)+')';}
function rp(x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,Math.max(0,r));else ctx.rect(x,y,w,h);}
function vgrad(y0,y1,stops){const g=ctx.createLinearGradient(0,y0,0,y1);stops.forEach((c,i)=>g.addColorStop(i/(stops.length-1),c));return g;}
let _zel=null;
function zellige(){ // faint Moroccan star pattern, built once
  if(_zel)return _zel;
  const c=document.createElement('canvas');c.width=c.height=48;const g=c.getContext('2d');
  g.strokeStyle='#fff';g.lineWidth=1.4;g.translate(24,24);for(let k=0;k<2;k++){g.rotate(Math.PI/4);g.strokeRect(-11,-11,22,22);}
  g.setTransform(1,0,0,1,0,0);g.beginPath();for(const [a,b] of [[0,0],[48,0],[0,48],[48,48]]){g.moveTo(a-7,b);g.lineTo(a,b-7);g.lineTo(a+7,b);g.lineTo(a,b+7);g.closePath();}g.stroke();
  _zel=ctx.createPattern(c,'repeat');return _zel;
}
/* Static layers (backgrounds, the map, patterns) are drawn once into an offscreen canvas at the real
   pixel size, then copied each frame: copying is cheap, redrawing gradients and paths every frame is not. */
let _layers={},_layerN=0;
function cached(key,x,y,w,h,fn){
  const k=cv.width/W,id=key+'|'+W+'|'+cv.width;
  let c=_layers[id];
  if(!c){
    if(++_layerN>60){_layers={};_layerN=1;}
    c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(w*k));c.height=Math.max(1,Math.ceil(h*k));
    const g=c.getContext('2d'),old=ctx,hits=UI.hits.length;ctx=g;g.setTransform(k,0,0,k,-x*k,-y*k);g.direction='rtl';
    try{fn();}finally{ctx=old;UI.hits.length=hits;}
    _layers[id]=c;
  }
  ctx.drawImage(c,x,y,w,h);
}
function vignette(a){cached('vig'+a,0,0,W,H,()=>{const g=ctx.createRadialGradient(W/2,H/2,H*0.35,W/2,H/2,W*0.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,'+a+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);});}
try{document.fonts.addEventListener('loadingdone',()=>{_layers={};_layerN=0;});document.fonts.ready.then(()=>{_layers={};_layerN=0;});}catch(e){} // redraw cached text once the Arabic font is here
function zelLayer(){cached('zel',0,0,W,H,()=>{ctx.fillStyle=zellige();ctx.fillRect(0,0,W,H);});}

/* o: {frame, r, b (border), top, bot, pattern, patA, noCorners} */
function panel(x,y,w,h,o){
  o=o||{};const r=o.r||14,b=o.b||4,ir=Math.max(2,r-b);
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,.35)';rp(x+2,y+5,w,h,r);ctx.fill();
  ctx.fillStyle=INK;rp(x-3,y-3,w+6,h+6,r+3);ctx.fill();
  ctx.fillStyle=vgrad(y,y+h,o.frame||FRAMES.gold);rp(x,y,w,h,r);ctx.fill();
  ctx.fillStyle=INK;rp(x+b-1.5,y+b-1.5,w-2*b+3,h-2*b+3,ir+1);ctx.fill();
  ctx.fillStyle=vgrad(y+b,y+h-b,[o.top||'#2c3266',o.bot||'#12132c']);rp(x+b,y+b,w-2*b,h-2*b,ir);ctx.fill();
  if(o.pattern!==false){ctx.save();rp(x+b,y+b,w-2*b,h-2*b,ir);ctx.clip();ctx.globalAlpha=o.patA||0.06;zelLayer();ctx.restore();}
  ctx.fillStyle='rgba(255,255,255,.06)';rp(x+b,y+b,w-2*b,Math.min(h*0.42,44),ir);ctx.fill();
  if(!o.noCorners&&w>70&&h>70)for(const [cx,cy] of [[x+3,y+3],[x+w-3,y+3],[x+3,y+h-3],[x+w-3,y+h-3]]){star8(cx,cy,8,INK);star8(cx,cy,5.5,'#ffd24a');}
  ctx.restore();
}
/* kind: gold | blue | green | red | dark ; o: {size, glow} */
function btn(x,y,w,h,label,fn,kind,o){
  o=o||{};const c=BTN[kind||'gold'],hv=!!fn&&overBox(x,y,w,h),dn=hv&&UI.down,lip=Math.max(4,Math.round(h*0.12)),r=Math.min(14,h/2.6),oy=dn?lip-1:(hv?-1:0);
  ctx.save();
  if(o.glow){ctx.save();ctx.shadowColor='rgba(255,200,60,'+(0.55+0.35*Math.sin(frame*0.1))+')';ctx.shadowBlur=22;ctx.fillStyle=INK;rp(x-2.5,y-2.5,w+5,h+lip+5,r+2);ctx.fill();ctx.restore();}
  ctx.fillStyle='rgba(0,0,0,.35)';rp(x+2,y+lip+3,w,h,r);ctx.fill();
  ctx.fillStyle=INK;rp(x-2.5,y-2.5+oy,w+5,h+lip+5-oy,r+2);ctx.fill();
  ctx.fillStyle=c[2];rp(x,y+oy,w,h+lip-oy,r);ctx.fill();
  ctx.fillStyle=vgrad(y+oy,y+oy+h,[hv?shade(c[0],.2):c[0],hv?shade(c[1],.12):c[1]]);rp(x,y+oy,w,h,r);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.3)';rp(x+5,y+oy+3,w-10,h*0.36,Math.max(2,r-4));ctx.fill();
  const sz=o.size||Math.min(22,h*0.46);
  if(kind==='gold'||!kind)txt(label,x+w/2,y+oy+h/2+1,sz,'#ffffff','#6a3000'); // white text with a brown outline: readable on gold even when small
  else txt(label,x+w/2,y+oy+h/2+1,sz,c[3],INK);
  ctx.restore();
  if(fn)hit(x,y,w,h+lip,fn);
}
function button(x,y,w,h,label,fn,main){btn(x,y,w,h,label,fn,main?'gold':'dark');}
function ribbon(cx,cy,w,label,size,col){
  col=col||'#b8322a';const h=Math.round(size*1.75),x=cx-w/2,t=h*0.6,dk=shade(col,-.35),dd=shade(col,-.62);
  ctx.save();ctx.lineJoin='round';
  for(const s of [-1,1]){const ex=cx+s*w/2,yy=cy-h/2+h*0.3;
    ctx.beginPath();ctx.moveTo(ex-s*16,yy);ctx.lineTo(ex+s*(t+16),yy);ctx.lineTo(ex+s*(t+4),yy+h/2);ctx.lineTo(ex+s*(t+16),yy+h);ctx.lineTo(ex-s*16,yy+h);ctx.closePath();
    ctx.lineWidth=5;ctx.strokeStyle=INK;ctx.stroke();ctx.fillStyle=dk;ctx.fill();
    ctx.fillStyle=dd;ctx.beginPath();ctx.moveTo(ex,cy+h/2);ctx.lineTo(ex,yy+h);ctx.lineTo(ex-s*16,cy+h/2);ctx.closePath();ctx.fill();
  }
  rp(x,cy-h/2,w,h,4);ctx.lineWidth=5;ctx.strokeStyle=INK;ctx.stroke();
  ctx.fillStyle=vgrad(cy-h/2,cy+h/2,[shade(col,.28),col,shade(col,-.22)]);ctx.fill();
  ctx.strokeStyle='rgba(255,226,150,.6)';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.beginPath();
  ctx.moveTo(x+7,cy-h/2+4.5);ctx.lineTo(x+w-7,cy-h/2+4.5);ctx.moveTo(x+7,cy+h/2-4.5);ctx.lineTo(x+w-7,cy+h/2-4.5);ctx.stroke();ctx.setLineDash([]);
  txt(label,cx,cy+1,size,'#fff',INK);
  ctx.restore();
}
function ribbonFit(cx,cy,label,size,col,minW){const w=Math.max(minW||0,tw(label,size)+size*2.2);ribbon(cx,cy,w,label,size,col);return w;}
function sword(x,y,ang,len){
  ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(-5,-len*0.72);ctx.lineTo(0,-len*0.86);ctx.lineTo(5,-len*0.72);ctx.lineTo(5,0);ctx.closePath();
  ctx.lineWidth=4;ctx.strokeStyle=INK;ctx.stroke();const g=ctx.createLinearGradient(-5,0,5,0);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#a8b0cc');ctx.fillStyle=g;ctx.fill();
  ctx.fillStyle=INK;rp(-18,-3,36,10,5);ctx.fill();ctx.fillStyle='#f2b631';rp(-16,-1,32,6,3);ctx.fill();
  const gl=len*0.2;ctx.fillStyle=INK;ctx.fillRect(-4.5,6,9,gl+2);ctx.fillStyle='#7a3a18';ctx.fillRect(-2.5,7,5,gl);
  ctx.fillStyle=INK;circ(0,gl+10,6.5);ctx.fillStyle='#f2b631';circ(0,gl+10,4.2);
  ctx.restore();
}
function logo(cx,cy,size){
  const s='فرسان الأطلس';setFont(size);const w=ctx.measureText(s).width;
  for(const sd of [-1,1]){const sx=cx+sd*(w/2+size*0.95),sy=cy+size*0.55;sword(sx-size*0.32,sy,0.62,size*1.3);sword(sx+size*0.32,sy,-0.62,size*1.3);}
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
  ctx.lineWidth=size*0.36;ctx.strokeStyle='rgba(0,0,0,.45)';ctx.strokeText(s,cx,cy+4);
  ctx.lineWidth=size*0.3;ctx.strokeStyle=INK;ctx.strokeText(s,cx,cy);
  ctx.lineWidth=size*0.15;ctx.strokeStyle='#7a2e0a';ctx.strokeText(s,cx,cy);
  ctx.fillStyle=vgrad(cy-size*0.45,cy+size*0.45,['#fff8d0','#ffd24a','#e8860e']);ctx.fillText(s,cx,cy);
}
function medallion(x,y,r,i,o){
  o=o||{};const L=LET[i],ir=r-Math.max(3,r*0.14);
  ctx.save();
  ctx.fillStyle=INK;circ(x,y,r+2.5);
  ctx.fillStyle=vgrad(y-r,y+r,o.ring||FRAMES.gold);circ(x,y,r);
  ctx.fillStyle=INK;circ(x,y,ir+1.2);
  const g=ctx.createRadialGradient(x,y-ir*0.35,ir*0.1,x,y,ir);g.addColorStop(0,shade(L.col,.4));g.addColorStop(1,L.dark);ctx.fillStyle=g;circ(x,y,ir);
  ctx.beginPath();ctx.arc(x,y,ir,0,Math.PI*2);ctx.clip();
  drawHeroLook(i,x,y+ir*0.8,o.face||1,ir*1.75/Math.max(L.top,80),{alpha:o.dim?0.4:1});
  ctx.fillStyle='rgba(255,255,255,.14)';ell(x,y-ir*0.55,ir*0.75,ir*0.35);ctx.fill();
  ctx.restore();
}
function bar(x,y,w,h,p,cols){
  p=clamp(p,0,1);
  ctx.fillStyle=INK;rp(x-2,y-2,w+4,h+4,(h+4)/2);ctx.fill();
  ctx.fillStyle='#2a2238';rp(x,y,w,h,h/2);ctx.fill();
  if(p>0){const fw=Math.max(h,w*p);ctx.fillStyle=vgrad(y,y+h,cols);rp(x,y,fw,h,h/2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.38)';rp(x+2,y+1.2,Math.max(0,fw-4),h*0.32,h*0.16);ctx.fill();}
}
function skillChip(x,y,r,label,cd,max,col){
  ctx.fillStyle=INK;circ(x,y,r+2.5);
  if(cd>0){ctx.fillStyle='#2e2840';circ(x,y,r);ctx.fillStyle='rgba(255,255,255,.25)';ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,r,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-cd/max));ctx.closePath();ctx.fill();
    txt(label,x,y+1,r*1.1,'#a8a2c0','center',false);}
  else{const g=ctx.createRadialGradient(x,y-r*0.4,1,x,y,r);g.addColorStop(0,shade(col,.55));g.addColorStop(1,col);ctx.fillStyle=g;circ(x,y,r);
    ctx.strokeStyle='rgba(255,236,160,'+(0.45+0.4*Math.sin(frame*0.15))+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r+4.5,0,Math.PI*2);ctx.stroke();
    txt(label,x,y+1,r*1.1,'#fff',INK);}
}
function keyW(label,size){return Math.max(size*1.9,tw(label,size)+size*0.9);}
function keycap(cx,cy,label,size){
  size=size||13;const w=keyW(label,size),h=size*1.75,x=cx-w/2,y=cy-h/2;
  ctx.fillStyle=INK;rp(x-1.5,y-1.5,w+3,h+5,6);ctx.fill();
  ctx.fillStyle='#8a8fae';rp(x,y+2,w,h,5);ctx.fill();
  ctx.fillStyle=vgrad(y,y+h,['#ffffff','#d2d6ea']);rp(x,y,w,h-1,5);ctx.fill();
  txt('⁦'+label+'⁩',cx,cy,size,'#1a1830','center',false);
  return w;
}
/* items run right-to-left: a string is a label, an array is a group of keys */
function keyRow(cx,cy,items,size,col){
  size=size||13;const parts=[];
  for(const it of items){if(typeof it==='string')parts.push({t:it,w:tw(it,size)});else for(const k of it)parts.push({k,w:keyW(k,size)});}
  const gap=5,tot=parts.reduce((a,p)=>a+p.w,0)+gap*(parts.length-1);let cur=cx+tot/2;
  for(const p of parts){const c=cur-p.w/2;if(p.k!=null)keycap(c,cy,p.k,size);else txt(p.t,c,cy,size,col||'#e8e4f4','center',false);cur-=p.w+gap;}
}
function pill(cx,cy,label,col,size,tc){
  size=size||13;const w=tw(label,size)+size*1.5,h=size*1.7;
  ctx.fillStyle=INK;rp(cx-w/2-2,cy-h/2-2,w+4,h+4,h/2+2);ctx.fill();
  ctx.fillStyle=vgrad(cy-h/2,cy+h/2,[shade(col,.35),col,shade(col,-.3)]);rp(cx-w/2,cy-h/2,w,h,h/2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.25)';rp(cx-w/2+4,cy-h/2+2,w-8,h*0.34,h*0.17);ctx.fill();
  txt(label,cx,cy+1,size,tc||'#fff',tc?false:INK);
  return w;
}
function coin(x,y,r){ctx.fillStyle=INK;circ(x,y,r+2);ctx.fillStyle=vgrad(y-r,y+r,GOLDB);circ(x,y,r);
  ctx.strokeStyle='rgba(130,64,0,.6)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,r*0.62,0,Math.PI*2);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.65)';circ(x-r*0.35,y-r*0.35,r*0.22);}
function coinPill(x,y,n,anchor){
  const s=''+n,size=18,h=30,w=tw(s,size)+50,lx=anchor==='center'?x-w/2:x;
  ctx.fillStyle=INK;rp(lx-2,y-h/2-2,w+4,h+4,h/2+2);ctx.fill();ctx.fillStyle='rgba(22,18,40,.9)';rp(lx,y-h/2,w,h,h/2);ctx.fill();
  coin(lx+h/2,y,11);txt(s,lx+h+(w-h)/2-3,y+1,size,'#ffd24a');return w;
}
function diamond(x,y,r,col){ctx.beginPath();ctx.moveTo(x,y-r-2);ctx.lineTo(x+r+2,y);ctx.lineTo(x,y+r+2);ctx.lineTo(x-r-2,y);ctx.closePath();ctx.fillStyle=INK;ctx.fill();
  ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath();ctx.fillStyle=col;ctx.fill();}
function heroFrame(h){return h.ctrl===0?FRAMES.blue:h.ctrl===1?FRAMES.red:FRAMES.steel;}
function heroTagCol(h){return h.ctrl===0?TAGC[0]:h.ctrl===1?TAGC[1]:'#8a8fb0';}

/* ================= SCREENS ================= */
function drawHeroTag(h,sx,sy,L){
  const ty=sy-(h.down?44:L.top+(L.float?16:6)),mh=hMax(h);
  pill(sx,ty-3,tagTxt(h),heroTagCol(h),9);
  bar(sx-20,ty+9,40,5,h.hp/mh,h.hp/mh>0.35?HPG:HPR);
  if(h.down)txt(''+Math.ceil(h.downT/60),sx,ty-22,16,'#ffe680');
}
function drawHUD(){
  const n=G.heroes.length,w=Math.min(290,(W-40)/Math.max(4,n)-8),tot=w*n+8*(n-1);
  G.heroes.forEach((h,i)=>{
    const x=W/2+tot/2-(i+1)*w-i*8,y=8,hh=60,mh=hMax(h),fr=heroFrame(h);
    panel(x,y,w,hh,{frame:fr,r:12,b:3,noCorners:true,patA:0.05});
    medallion(x+w-31,y+hh/2,23,h.idx,{dim:h.down,ring:fr});
    txt(h.def.name,x+w-62,y+16,15,'#fff','right');
    pill(x+24,y+15,tagTxt(h),heroTagCol(h),10);
    const bw=w-76,bx=x+10,by=y+29;
    bar(bx,by,bw,11,h.hp/mh,h.hp/mh>0.35?HPG:HPR);
    txt(Math.ceil(h.hp)+'/'+mh,bx+bw/2,by+6,9,'#fff',INK);
    skillChip(x+19,y+49,7.5,'K',h.cdK,hCd(h,h.def.k.cd),LET[h.idx].col);
    skillChip(x+43,y+49,7.5,'L',h.cdL,hCd(h,h.def.l.cd),LET[h.idx].col);
    if(h.buffT>0)txt('⚔×1.5',x+w*0.47,y+49,11,'#ffd24a','center',INK);
    if(h.down)txt('طايح... '+Math.ceil(h.downT/60),x+w*0.62,y+49,12,'#ffe680','center',INK);
  });
  coinPill(12,88,gold);
  {const nm=LV[G.level].name,lw=tw(nm,14)+21;pill(W-14-lw/2,88,nm,'#3a3f78',14);}
  const prog=clamp(G.cam/(G.end-W),0,1);
  bar(W/2-110,84,220,9,prog,GOLDB);
  for(const cp of G.cps.concat([G.bossX])){const px=W/2-110+220*clamp((cp-W/2)/(G.end-W),0,1);ctx.fillStyle=INK;circ(px,88.5,4.5);ctx.fillStyle='#fff';circ(px,88.5,2.8);}
  txt('💀',W/2+128,89,14,'#fff',false);
  if(G.bench.length){
    const hp=G.roster.some(h=>h.ctrl===1),pw=Math.max(hp?150:96,20+G.bench.length*46);
    panel(10,110,pw,84,{frame:FRAMES.steel,r:12,b:3,noCorners:true});
    G.bench.forEach((b,k)=>medallion(34+k*46,138,19,b.idx,{dim:b.down,ring:FRAMES.steel}));
    keyRow(10+pw/2,176,hp?['⇄',[KL.KeyQ],'/',['Num 0']]:['⇄',[KL.KeyQ],'بدل'],10);
  }
  if(G.goT>0&&G.lock===null&&Math.floor(G.goT/15)%2===0){
    const ax=W-110,ay=H/2-40;ctx.save();ctx.translate(ax,ay);ctx.beginPath();
    ctx.moveTo(-44,-15);ctx.lineTo(8,-15);ctx.lineTo(8,-32);ctx.lineTo(48,0);ctx.lineTo(8,32);ctx.lineTo(8,15);ctx.lineTo(-44,15);ctx.closePath();
    ctx.lineWidth=6;ctx.lineJoin='round';ctx.strokeStyle=INK;ctx.stroke();ctx.fillStyle=vgrad(-32,32,GOLDB);ctx.fill();ctx.restore();
    txt('GO',ax-12,ay+1,20,'#3a2004',false);
  }
  if(G.boss&&!G.bossDone){
    const b=G.boss,bw=Math.min(560,W-220),bx=W/2-bw/2,by=H-26;
    panel(bx-12,by-10,bw+24,32,{frame:FRAMES.red,r:10,b:3,noCorners:true,pattern:false,top:'#2a0e14',bot:'#14060a'});
    bar(bx,by,bw,12,b.hp/b.maxHp,['#ffb0a0','#ff3a2a','#8a0f0f']);
    ribbonFit(W/2,by-24,'👹 '+b.name,14,'#7a1f4a',160);
  }
  if(G.banner.t>0){
    const a=Math.min(1,G.banner.t/30);ctx.globalAlpha=a;
    ribbonFit(W/2,H/2-84,G.banner.s,30,'#b8322a',300);
    if(G.banner.sub&&G.banner.t<200)pill(W/2,H/2-30,G.banner.sub,'#2a8a52',18);
    ctx.globalAlpha=1;
  }
  // get ready… then fight!
  if(G.readyT>0&&!G.paused&&G.intro)drawIntro(Math.ceil(G.readyT/40));
  else if(G.readyT>0&&!G.paused){const k=Math.ceil(G.readyT/40),p=1-(G.readyT%40)/40,sc=1+0.25*(1-Math.min(1,p*3));
    ctx.save();ctx.translate(W/2,H/2+30);ctx.scale(sc,sc);txt(G.boss&&!G.bossDone?'⚠ استعدو للبوس!':'⚠ استعدو!',0,-34,26,'#ffd24a',INK);txt(''+k,0,22,58,'#ffffff',INK);ctx.restore();}
  if(G.fightT>0){const a=Math.min(1,G.fightT/20),sc=1+0.6*(1-G.fightT/50);ctx.save();ctx.globalAlpha=a;ctx.translate(W/2,H/2-30);ctx.scale(sc,sc);txt('⚔ قاتلو!',0,0,52,'#ff6a4a',INK);ctx.restore();}
  if(G.paused){
    ctx.fillStyle='rgba(8,6,20,.7)';ctx.fillRect(0,0,W,H);
    const pw=480,ph=244,px=W/2-pw/2,py=H/2-122;
    panel(px,py,pw,ph);ribbonFit(W/2,py+4,'⏸ واقف',26,'#2f6fd0',220);
    txt(LV[G.level].name,W/2,py+62,16,'#e6e2f4','center',false);
    btn(W/2+10,py+92,200,48,'▶ كمل',()=>{G.paused=false;},'gold');
    btn(W/2-210,py+92,200,48,'🗺 الخريطة',resetMenu,'dark');
    btn(W/2-60,py+150,120,34,'⚙ الصوت',sndOpen,'dark',{size:14});
    txt(padCount?'🎮 Start ولا B باش تكمل  —  Select للخريطة':'Esc باش تكمل  —  Backspace للخريطة',W/2,py+210,13,'#bdb8d6','center',false);
  }
}
function drawShop(){
  const bgN=LV[G.level].bg;
  cached('shopbg'+bgN,0,0,W,H,()=>{drawBG(bgN,0);ctx.fillStyle='rgba(8,6,20,.7)';ctx.fillRect(0,0,W,H);vignette(0.5);});
  const N=G.roster.length;shop.hero=clamp(shop.hero|0,0,N-1);
  const hr=G.roster[shop.hero],li=hr.idx,D=HEROES[li],L=LET[li],u=upg[li],bench=G.bench.includes(hr),row=shop.row|0;
  // header
  ribbonFit(W/2,30,'⚒ تطوير الحروف',22,'#b8322a',280);
  coinPill(66,30,gold);
  const fromMap=shop.from==='map';
  if(!fromMap&&G.fact){pill(W-110,22,'✅ ربحتي '+G.fact.c,'#2f8a2a',12);if(G.bonus)pill(W-110,48,'🎁 مكافأة: +'+G.bonus,'#c8800e',11);}
  const top=66,ch=392;
  // ---- hero card (right) ----
  const pw=Math.min(340,Math.round(W*0.36)),px=W-14-pw;
  panel(px,top,pw,ch,{frame:FRAMES.gold,r:14});
  const wx=px+16,wy=top+16,ww=pw-32,wh=178;
  cached('shopwin'+bgN+'|'+ww,wx,wy,ww,wh,()=>{rp(wx,wy,ww,wh,10);ctx.clip();ctx.translate(wx,wy);ctx.scale(ww/W*1.6,wh/H*1.6);ctx.translate(-W*0.1,-H*0.32);drawBG(bgN,0);});
  ctx.save();rp(wx,wy,ww,wh,10);ctx.clip();
  ctx.fillStyle='rgba(0,0,0,.35)';ell(wx+ww/2,wy+wh-20,48,11);ctx.fill();
  const t=frame%140,atk=t<16?t/16:-1;
  drawHeroLook(li,wx+ww/2,wy+wh-22,1,1.05,{atk});
  ctx.restore();
  ctx.strokeStyle=INK;ctx.lineWidth=3;rp(wx,wy,ww,wh,10);ctx.stroke();
  // banner in the letter's colour + who controls it
  ctx.fillStyle=INK;ctx.fillRect(wx+ww-38,wy-3,28,44);ctx.fillStyle=L.col;ctx.beginPath();ctx.moveTo(wx+ww-36,wy);ctx.lineTo(wx+ww-12,wy);ctx.lineTo(wx+ww-12,wy+38);ctx.lineTo(wx+ww-24,wy+30);ctx.lineTo(wx+ww-36,wy+38);ctx.closePath();ctx.fill();
  pill(wx+34,wy+16,bench?'احتياط':tagTxt(hr),bench?'#6a6f90':heroTagCol(hr),10);
  // arrows to the other letters
  if(N>1){
    const ay=wy+wh/2,arrow=(ax,lab,d)=>{const hv=overBox(ax-20,ay-20,40,40);ctx.fillStyle=INK;circ(ax,ay,20);ctx.fillStyle=vgrad(ay-18,ay+18,hv?['#fff8c0','#ffd84a']:GOLDB);circ(ax,ay,17.5);
      txt(lab,ax,ay+1,18,'#fff','#6a3000');hit(ax-20,ay-20,40,40,()=>{shop.hero=(shop.hero+d+N)%N;SFX.coin();});};
    arrow(wx-4,'◀',1);arrow(wx+ww+4,'▶',-1);
    for(let k=0;k<N;k++){const dx=wx+ww/2+((N-1)/2-k)*16;ctx.fillStyle=INK;circ(dx,wy+wh+12,5.5);ctx.fillStyle=k===shop.hero?'#ffd24a':'#4a4e70';circ(dx,wy+wh+12,4);}
  }
  // name, level, numbers
  const iy=wy+wh+26,lvl=1+UPK.reduce((a,k)=>a+u[k],0);
  ctx.fillStyle='rgba(0,0,0,.28)';rp(wx,iy,ww,ch-(iy-top)-16,10);ctx.fill();
  txt(D.name,wx+ww-12,iy+22,22,'#fff','right');
  txt((D.type==='melee'?'⚔ من قريب':'🏹 من بعيد'),wx+ww-12,iy+48,12,'#c8c4dc','right',false);
  txt('مستوى '+lvl,wx+56,iy+22,18,'#ffd24a');
  const pc=v=>(Math.round(v*10)/10)+'%';
  const lines=[['❤',Math.round(D.hp*(1+0.05*u.hp)),'+'+Math.round(D.hp*0.05),1],['⚔',Math.round(D.dmg*(1+0.05*u.dmg)*10)/10,'+'+(Math.round(D.dmg*0.5)/10),0],['✨','+'+4*u.sk+'%','+4%',2],
    ['👟','+'+pc(1.5*u.spd),'+1.5%',3],['🛡','-'+pc(1.5*u.arm),'-1.5%',4],['🎯',pc(1.5*u.crit),'+1.5%',5]];
  lines.forEach(([ic,v,plus,r],k)=>{const col=k%2,ly=iy+74+Math.floor(k/2)*25,cx0=col?wx+ww/2-6:wx+ww-6;
    txt(ic,cx0-14,ly,14,'#fff','center',false);txt(''+v,cx0-30,ly,15,'#fff','right');
    if(row===r&&u[UPK[r]]<UPMAX)txt(plus,cx0-30-tw(''+v,15)-8,ly,13,'#7dff6a','right');});
  // ---- upgrades (left) ----
  const lx=14,lw=px-lx-14;
  panel(lx,top,lw,ch,{frame:FRAMES.gold,r:14});
  const sec=(y,label)=>{txt(label,lx+lw-20,y,16,'#ffd24a','right');setFont(16);const w=ctx.measureText(label).width;ctx.strokeStyle='rgba(255,210,74,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(lx+20,y);ctx.lineTo(lx+lw-30-w,y);ctx.stroke();};
  sec(top+20,'القدرات');
  const rowsD=[['❤','الصحة','#e8404a',1],['⚔','القوة','#c86a10',0],['✨','المهارات','#2a8ad0',2],['👟','السرعة','#3aa04a',3],['🛡','الدرع','#5a7ab0',4],['🎯','الضربة الحرجة','#c8322a',5]]; // last = shopBuy row
  const bW=Math.min(110,lw*0.22),rh=36;
  rowsD.forEach(([ic,nm,col,r],k)=>{
    const key=UPK[r],y=top+36+k*(rh+5),lv=u[key],cost=upCost(lv),sel=row===r,max=lv>=UPMAX,ok=gold>=cost;
    ctx.fillStyle=sel?'rgba(255,210,74,.16)':'rgba(0,0,0,.25)';rp(lx+14,y,lw-28,rh,9);ctx.fill();
    if(sel){ctx.strokeStyle='#ffd24a';ctx.lineWidth=2.5;ctx.stroke();}
    hit(lx+14,y,lw-28-bW-10,rh,()=>{shop.row=r;});
    const ix=lx+lw-14-38;ctx.fillStyle=INK;rp(ix,y+3,30,30,7);ctx.fill();ctx.fillStyle=vgrad(y+5,y+31,['#fff0c8','#d8b070']);rp(ix+2,y+5,26,26,6);ctx.fill();
    txt(ic,ix+15,y+18,15,col,false);
    const bx=lx+14+bW+18,bw=ix-12-bx,segW=bw/UPMAX;
    txt(nm,ix-8,y+10,12,'#fff','right',false);
    txt(UPMAX+' / '+lv,bx,y+10,11,max?'#7dff6a':'#c8c4dc','left',false);
    ctx.fillStyle=INK;rp(bx-2,y+19,bw+4,13,4);ctx.fill();
    for(let q=0;q<UPMAX;q++){const sx=bx+bw-(q+1)*segW;ctx.fillStyle=q<lv?vgrad(y+21,y+30,q%5===4?['#fff8c0','#ffcf3a']:GOLDB):'#3a3450';rp(sx+0.8,y+21,segW-1.6,9,2);ctx.fill();}
    const btx=lx+22,bty=y+5;
    if(max)btn(btx,bty,bW,26,'MAX ✔',null,'green',{size:13});
    else{btn(btx,bty,bW,26,'',()=>{shop.row=r;shopBuy(shop.hero,r);},ok?'gold':'dark');
      coin(btx+bW/2+tw(''+cost,14)/2+4,bty+13,7);txt(''+cost,btx+bW/2-7,bty+14,14,ok?'#fff':'#9a96b0',ok?'#6a3000':INK);}
  });
  const sy=top+36+6*(rh+5)+12;
  sec(sy,'المهارات');
  [[KL.KeyK,D.k.name,D.kd],[KL.KeyL,D.l.name,D.ld]].forEach(([key,nm,ds],k)=>{
    const y=sy+12+k*40;
    ctx.fillStyle='rgba(0,0,0,.25)';rp(lx+14,y,lw-28,36,9);ctx.fill();
    keycap(lx+lw-14-22,y+18,key,13);
    txt(nm,lx+lw-50,y+11,13,'#bfe0ff','right',false);
    txt(wrapLines(ds,lw-150,11)[0],lx+lw-50,y+27,11,'#c8c4dc','right',false);
    txt('✨ +'+4*u.sk+'%',lx+30,y+18,12,'#7fd6ff','left',false);
  });
  // ---- bottom ----
  const sel3=row===6;
  btn(W/2-10-210,466,210,44,'🗺 الخريطة',resetMenu,'dark',{size:19});
  btn(W/2+10,466,240,44,fromMap?'⚔ ابدا المرحلة '+(menu.sel+1):'➜ المرحلة الجاية',shopNext,sel3?'green':'gold',{size:20,glow:sel3});
  txt(padCount?'🎮 ◀▶ بدل الحرف  •  ▲▼ ختار  •  A شري  •  B الخريطة':'⌨ '+KL.KeyA+'/'+KL.KeyD+' بدل الحرف  •  '+KL.KeyW+'/'+KL.KeyS+' ختار  •  '+KL.KeyJ+' شري  •  Enter كمل  •  Esc الخريطة',W/2,528,12,'#c8c4dc','center',false);
}
function drawOver(){
  drawPlay();
  ctx.fillStyle='rgba(40,0,12,.62)';ctx.fillRect(0,0,W,H);vignette(0.6);
  const pw=500,ph=222,px=W/2-pw/2,py=H/2-100;
  panel(px,py,pw,ph,{frame:FRAMES.red,top:'#3a1426',bot:'#1a0812'});
  ribbonFit(W/2,py+4,'💀 خسرتو!',30,'#b8322a',240);
  txt('الحروف طاحو كاملين... ولكن المغامرة باقا',W/2,py+66,16,'#f0dce4','center',false);
  btn(W/2+10,py+100,210,50,'↻ عاود المرحلة',()=>startLevel(G.level),'gold');
  btn(W/2-220,py+100,210,50,'🗺 الخريطة',resetMenu,'dark');
  txt('Enter = عاود     Esc = الخريطة',W/2,py+188,13,'#c8b0bc','center',false);
}
function drawWin(){
  drawBG(4,frame*0.5);
  ctx.fillStyle='rgba(10,6,24,.5)';ctx.fillRect(0,0,W,H);
  ctx.save();ctx.translate(W/2,260);ctx.rotate(frame*0.003);ctx.fillStyle='rgba(255,220,120,.08)';
  for(let r=0;r<16;r++){ctx.rotate(Math.PI/8);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(W,-80);ctx.lineTo(W,80);ctx.closePath();ctx.fill();}ctx.restore();
  vignette(0.55);
  ribbonFit(W/2,72,'🏆 مبروك! ربحتو اللعبة 🏆',30,'#c8800e',380);
  pill(W/2,126,'الكتاب الكبير رجع كامل... والهمزة رجعات للعائلة','#3a3f78',16);
  const RL=G.roster.map(h=>h.idx),NH=RL.length,st=Math.min(150,(W-60)/NH);
  for(let k=0;k<NH;k++){
    const i=RL[k],x=W/2+((NH-1)/2-k)*st,jump=Math.abs(Math.sin(frame*0.1+i))*30,py=392;
    ctx.fillStyle=INK;ctx.fillRect(x-34,py-2,68,24);ell(x,py+22,34,10);ctx.fill();
    ctx.fillStyle=vgrad(py,py+22,['#e8d6b0','#9a8058']);ctx.fillRect(x-31,py,62,22);ell(x,py+22,31,8);ctx.fill();
    ctx.fillStyle=INK;ell(x,py,34,11);ctx.fill();ctx.fillStyle='#fff0c8';ell(x,py,31,8.5);ctx.fill();
    drawHeroLook(i,x,py-jump,1,Math.min(1.25,st/115),{atk:(frame+i*20)%60<16?((frame+i*20)%60)/16:-1});
  }
  coinPill(W/2,446,gold,'center');
  btn(W/2-120,472,240,46,'🗺 رجوع للخريطة',resetMenu,'gold',{glow:true});
}
