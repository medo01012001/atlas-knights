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
function vignette(a){const g=ctx.createRadialGradient(W/2,H/2,H*0.35,W/2,H/2,W*0.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,'+a+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}

/* o: {frame, r, b (border), top, bot, pattern, patA, noCorners} */
function panel(x,y,w,h,o){
  o=o||{};const r=o.r||14,b=o.b||4,ir=Math.max(2,r-b);
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,.35)';rp(x+2,y+5,w,h,r);ctx.fill();
  ctx.fillStyle=INK;rp(x-3,y-3,w+6,h+6,r+3);ctx.fill();
  ctx.fillStyle=vgrad(y,y+h,o.frame||FRAMES.gold);rp(x,y,w,h,r);ctx.fill();
  ctx.fillStyle=INK;rp(x+b-1.5,y+b-1.5,w-2*b+3,h-2*b+3,ir+1);ctx.fill();
  ctx.fillStyle=vgrad(y+b,y+h-b,[o.top||'#2c3266',o.bot||'#12132c']);rp(x+b,y+b,w-2*b,h-2*b,ir);ctx.fill();
  if(o.pattern!==false){ctx.save();rp(x+b,y+b,w-2*b,h-2*b,ir);ctx.clip();ctx.globalAlpha=o.patA||0.06;ctx.fillStyle=zellige();ctx.fillRect(x,y,w,h);ctx.restore();}
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
  if(G.paused){
    ctx.fillStyle='rgba(8,6,20,.7)';ctx.fillRect(0,0,W,H);
    const pw=480,ph=214,px=W/2-pw/2,py=H/2-110;
    panel(px,py,pw,ph);ribbonFit(W/2,py+4,'⏸ واقف',26,'#2f6fd0',220);
    txt(LV[G.level].name,W/2,py+62,16,'#e6e2f4','center',false);
    btn(W/2+10,py+92,200,48,'▶ كمل',()=>{G.paused=false;},'gold');
    btn(W/2-210,py+92,200,48,'☰ القائمة',()=>{state='menu';resetMenu();},'dark');
    txt('Esc باش تكمل  —  Backspace للقائمة',W/2,py+180,13,'#bdb8d6','center',false);
  }
}
function drawMenu(){
  drawBG(0,frame*0.6);
  ctx.fillStyle=vgrad(0,H,['rgba(10,6,24,.6)','rgba(10,6,24,.2)','rgba(10,6,24,.75)']);ctx.fillRect(0,0,W,H);
  vignette(0.55);
  btn(14,12,46,40,'🏠',goHome,'dark',{size:19});
  btn(W-60,12,46,40,'⛶',toggleFS,'dark',{size:19});
  logo(W/2,42,40);
  const F=FOUND,NH=F.length;
  ribbonFit(W/2,92,NH===1?'ابدا المغامرة بالألف... وشوف شنو كيتسناك فالطريق':'ختار الحرف لي غادي تبدا بيه',15,'#b8322a',340);
  const step=Math.min(215,(W-20)/NH),cw=Math.min(200,step-14),y=118,hh=244;
  for(let k=0;k<NH;k++){
    const i=F[k],L=LET[i],H_=HEROES[i],cx=W/2+((NH-1)/2-k)*step,x=cx-cw/2;
    const s1=menu.sel===k,s2=menu.mode===1&&NH>1&&menu.p2sel%NH===k,hv=overBox(x,y,cw,hh),yy=y-((s1||s2)?4:(hv?2:0));
    if(s1||s2){ctx.save();ctx.shadowColor=s1?'#4da3ff':'#ff5b5b';ctx.shadowBlur=26;ctx.fillStyle=INK;rp(x,yy,cw,hh,16);ctx.fill();ctx.restore();}
    panel(x,yy,cw,hh,{frame:s1&&s2?FRAMES.gold:s1?FRAMES.blue:s2?FRAMES.red:(hv?FRAMES.gold:FRAMES.steel),r:16});
    hit(x,y,cw,hh,()=>{menu.sel=k;if(menu.mode===1&&menu.p2sel%NH===k)menu.p2sel=(k+1)%NH;SFX.coin();},()=>{if(menu.mode===1&&NH>1&&k!==menu.sel){menu.p2sel=k;SFX.coin();}});
    const wx=x+10,wy=yy+10,ww=cw-20,wh=120,gy=wy+wh*0.62;
    ctx.save();rp(wx,wy,ww,wh,10);ctx.clip();
    const g=ctx.createRadialGradient(cx,gy,4,cx,gy,ww*0.8);g.addColorStop(0,shade(L.col,.3));g.addColorStop(0.55,L.dark);g.addColorStop(1,'#0c0a18');ctx.fillStyle=g;ctx.fillRect(wx,wy,ww,wh);
    ctx.globalAlpha=0.1;ctx.fillStyle='#fff';for(let r=0;r<8;r++){const a=r*Math.PI/4+frame*0.004;ctx.beginPath();ctx.moveTo(cx,gy);ctx.arc(cx,gy,ww,a,a+0.2);ctx.closePath();ctx.fill();}ctx.globalAlpha=1;
    ctx.fillStyle=INK;ell(cx,wy+wh-11,ww*0.36,10);ctx.fill();ctx.fillStyle=vgrad(wy+wh-20,wy+wh-2,['#6a6490','#2a2440']);ell(cx,wy+wh-12,ww*0.34,8);ctx.fill();
    const atk=s1&&(frame%120)<16?(frame%120)/16:-1;
    drawHeroLook(i,cx,wy+wh-13,1,Math.min(0.95,ww/150*0.95),{atk});
    ctx.restore();
    ctx.strokeStyle=INK;ctx.lineWidth=2.5;rp(wx,wy,ww,wh,10);ctx.stroke();
    ribbon(cx,yy+144,cw-8,H_.name,16,L.col);
    txt(H_.desc,cx,yy+172,12,'#e6e2f4','center',false);
    ctx.fillStyle='rgba(255,210,74,.13)';rp(x+10,yy+183,cw-20,20,6);ctx.fill();
    txt('✦ '+H_.pas,cx,yy+193,11,'#ffd24a','center',false);
    keyRow(cx,yy+214,[[KL.KeyK],H_.k.name],10,'#bfe0ff');
    keyRow(cx,yy+232,[[KL.KeyL],H_.l.name],10,'#bfe0ff');
    if(s1)pill(x+24,yy+14,'P1',TAGC[0],11);
    if(s2)pill(x+cw-24,yy+14,'P2',TAGC[1],11);
  }
  const bw=180,by=374;
  [['👤 بوحدي',0],['👥 مع صاحبي',1]].forEach(([t,m],k)=>{const bx=W/2+(k?-bw-6:6),on=menu.mode===m;
    btn(bx,by,bw,34,t,()=>{if(menu.mode!==m){menu.mode=m;SFX.coin();}},on?'blue':'dark',{size:16});});
  btn(W/2-150,422,300,46,'▶ ابدا اللعب',()=>{SFX.buy();startGame();},'gold',{size:24,glow:true});
  panel(30,482,W-60,52,{frame:FRAMES.steel,noCorners:true,r:12,b:3,top:'#1e2246',bot:'#121330'});
  const k=KL,row=['🔵 اللاعب 1:',[k.KeyW,k.KeyA,k.KeyS,k.KeyD],'حركة','•',[k.KeyJ],'ضربة','•',[k.KeyK,k.KeyL],'مهارات'];
  if(NH>1)row.push('•',[k.KeyQ],'بدل');
  row.push('•',['Esc'],'رجوع');
  keyRow(W/2,497,row,11);
  const p2t=menu.mode===0?'🔴 '+k.KeyW+'/'+k.KeyS+' ولا ضربة اللاعب 2 باش تلعب مع صاحبك':
    (NH>1?'🔴 اللاعب 2: الأسهم و ⁦'+k.Comma+' '+k.Period+' '+k.Slash+'⁩ — كيختار بالأسهم ولا بالكليك اليمين':'🎁 صاحبك غادي يبدا بحرف جديد — كيلعب بالأسهم و ⁦'+k.Comma+' '+k.Period+' '+k.Slash+'⁩');
  txt(p2t+'     🎮 '+(padCount?padCount+' مانيطة متصلة':'المانيطة خدامة حتى هي'),W/2,520,12,'#cfd0e8','center',false);
}
function drawShop(){
  drawBG(LV[G.level].bg,0);
  ctx.fillStyle='rgba(8,6,20,.62)';ctx.fillRect(0,0,W,H);vignette(0.5);
  ribbonFit(W/2,34,'🛒 الحانوت',26,'#b8322a',260);
  coinPill(W/2,76,gold,'center');
  const rows=['⚔ القوة','❤ الصحة','✨ المهارات'];
  const ps=[0];if(G.heroes.some(h=>h.ctrl===1))ps.push(1);
  const cards=G.roster.length,step=Math.min(225,(W-30)/Math.max(cards,2)),w=step-14;
  for(let c=0;c<cards;c++){
    const x=W/2+(cards/2-c-1)*step+7,hr=G.roster[c],li=hr.idx,bench=G.bench.includes(hr);
    panel(x,96,w,346,{frame:bench?FRAMES.steel:(hr.ctrl===0||hr.ctrl===1?heroFrame(hr):FRAMES.gold),r:14});
    medallion(x+w/2,136,30,li,{dim:bench,ring:FRAMES.gold});
    txt(HEROES[li].name,x+w/2,182,18,'#fff');
    if(bench)pill(x+w/2,204,'احتياط','#6a6f90',10);else pill(x+w/2,204,tagTxt(hr),heroTagCol(hr),10);
    for(let r=0;r<3;r++){
      const key=['dmg','hp','sk'][r],lv=upg[li][key],by=224+r*70,bx=x+10,bww=w-20,hv=overBox(bx,by,bww,60),cost=upCost(lv);
      ctx.fillStyle=hv?'rgba(255,255,255,.16)':'rgba(0,0,0,.3)';rp(bx,by,bww,60,10);ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=1.5;ctx.stroke();
      hit(bx,by,bww,60,()=>{shop.cur[0].c=c;shop.cur[0].r=r;shopBuy(c,r);});
      txt(rows[r],x+w/2,by+13,13,'#fff','center',false);
      for(let s=0;s<5;s++)diamond(x+w/2+32-s*16,by+31,5.5,s<lv?'#ffd24a':'#3a3450');
      if(lv>=5)pill(x+w/2,by+48,'MAX','#3aa04a',10);
      else{const ok=gold>=cost,cw2=tw(''+cost,13);coin(x+w/2+cw2/2+4,by+48,6);txt(''+cost,x+w/2-6,by+48,13,ok?'#ffd24a':'#8a86a0','center',false);}
      ps.forEach(p=>{const cu=shop.cur[p];if(cu.c===c&&cu.r===r){ctx.strokeStyle=p===0?'#6ab4ff':'#ff6b5b';ctx.lineWidth=3;rp(bx-p*4,by-p*4,bww+p*8,60+p*8,10);ctx.stroke();}});
    }
  }
  const sel=ps.some(p=>shop.cur[p].r===3);
  btn(W/2-150,454,300,46,'➜ المرحلة الجاية',()=>startLevel(G.level+1),sel?'green':'gold',{size:22,glow:sel});
  txt('تحرك بالأسهم/'+KL.KeyW+KL.KeyA+KL.KeyS+KL.KeyD+' ولا المانيطة — الضربة (A) ولا الكليك باش تشري — Enter ولا Start باش تكمل',W/2,524,13,'#c8c4dc','center',false);
}
function drawOver(){
  drawPlay();
  ctx.fillStyle='rgba(40,0,12,.62)';ctx.fillRect(0,0,W,H);vignette(0.6);
  const pw=500,ph=222,px=W/2-pw/2,py=H/2-100;
  panel(px,py,pw,ph,{frame:FRAMES.red,top:'#3a1426',bot:'#1a0812'});
  ribbonFit(W/2,py+4,'💀 خسرتو!',30,'#b8322a',240);
  txt('الحروف طاحو كاملين... ولكن المغامرة باقا',W/2,py+66,16,'#f0dce4','center',false);
  btn(W/2+10,py+100,210,50,'↻ عاود المرحلة',()=>startLevel(G.level),'gold');
  btn(W/2-220,py+100,210,50,'☰ القائمة',()=>{state='menu';resetMenu();},'dark');
  txt('Enter = عاود     Esc = القائمة',W/2,py+188,13,'#c8b0bc','center',false);
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
  btn(W/2-120,472,240,46,'☰ رجوع للقائمة',()=>{state='menu';resetMenu();},'gold',{glow:true});
}
