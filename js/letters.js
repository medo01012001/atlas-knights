'use strict';
/* ================= LETTER HEROES (drawn with paths, cached once, never mirrored so they always read right) ================= */
const LET=(function(){
  const P=()=>new Path2D();
  const alef=P();alef.moveTo(-9,-8);alef.bezierCurveTo(-11,-40,-9,-70,-5,-94);alef.quadraticCurveTo(1,-101,7,-95);alef.bezierCurveTo(10,-70,10,-40,9,-8);alef.quadraticCurveTo(0,-2,-9,-8);
  const alefTip=P();alefTip.moveTo(-5,-94);alefTip.quadraticCurveTo(-14,-100,-12,-106);alefTip.quadraticCurveTo(-4,-104,1,-99);alefTip.closePath();
  const noon=P();noon.moveTo(-34,-62);noon.bezierCurveTo(-37,-8,37,-8,34,-62);
  const taaLoop=P();taaLoop.moveTo(-14,-16);taaLoop.bezierCurveTo(-18,-46,42,-52,38,-24);taaLoop.bezierCurveTo(36,-8,0,-6,-14,-16);
  const taaStick=P();taaStick.moveTo(-16,-22);taaStick.bezierCurveTo(-18,-52,-16,-82,-11,-104);taaStick.quadraticCurveTo(-6,-110,-1,-104);taaStick.bezierCurveTo(-4,-82,-5,-52,-2,-24);taaStick.closePath();
  const baa=P();baa.moveTo(-46,-50);baa.bezierCurveTo(-48,-22,48,-22,46,-50);
  const ain=P();ain.moveTo(14,-94);ain.bezierCurveTo(2,-106,-22,-96,-14,-78);ain.bezierCurveTo(-9,-68,6,-68,16,-70);
  ain.moveTo(14,-70);ain.bezierCurveTo(-14,-66,-34,-46,-26,-27);ain.bezierCurveTo(-18,-9,14,-11,28,-21);
  const saadLoop=P();saadLoop.ellipse(32,-52,25,16,0,0,Math.PI*2);
  const saadBowl=P();saadBowl.moveTo(12,-46);saadBowl.bezierCurveTo(8,-6,-52,-4,-56,-38);
  const saadTooth=P();saadTooth.moveTo(10,-46);saadTooth.lineTo(10,-60);
  return [
    {id:'knight',col:'#3b82e0',light:'#9cc8ff',dark:'#173a7a',box:[-22,-112,22,4],top:106,eyeY:-74,eyeX:0,cy:-50,feet:[-6,6],legTop:-10,
      parts:[{p:alef,k:'fill'},{p:alefTip,k:'fill'}]},
    {id:'archer',col:'#2fa65a',light:'#9df0b8',dark:'#145a2e',box:[-50,-76,50,0],top:104,eyeY:-21,eyeX:0,cy:-40,feet:[-10,10],legTop:-14,dot:{x:0,y:-88,r:10},
      parts:[{p:noon,k:'stroke',lw:20}]},
    {id:'mage',col:'#8b4fd6',light:'#d9b8ff',dark:'#3e1d70',box:[-26,-116,46,2],top:118,eyeY:-28,eyeX:14,cy:-50,feet:[-2,22],legTop:-10,gem:{x:-6,y:-112},
      parts:[{p:taaLoop,k:'fill'},{p:taaStick,k:'fill'}]},
    {id:'guard',col:'#e0812e',light:'#ffd09a',dark:'#7a3a0c',box:[-70,-80,66,0],top:88,eyeY:-54,eyeX:32,cy:-40,feet:[-26,-8],legTop:-10,
      parts:[{p:saadBowl,k:'stroke',lw:17},{p:saadTooth,k:'stroke',lw:12},{p:saadLoop,k:'fill'}]},
    {id:'baa',col:'#e04a6a',light:'#ffb0c0',dark:'#7a1a30',box:[-58,-64,58,-12],top:66,eyeY:-31,eyeX:0,cy:-35,feet:[-30,30],legTop:-40,dot:{x:0,y:-10,r:7},
      parts:[{p:baa,k:'stroke',lw:18}]},
    {id:'ain',col:'#d04ab0',light:'#ffb8ec',dark:'#6a1858',box:[-44,-112,42,0],top:108,eyeY:-42,eyeX:-26,cy:-58,feet:[-12,8],legTop:-12,
      parts:[{p:ain,k:'stroke',lw:16}]}
  ];
})();
const LET_R=3; // cache resolution per game unit (sharp up to ~3x zoom)
function buildLetter(L,mode){ // mode: 'n' normal, 's' silhouette
  const [x0,y0,x1,y1]=L.box,c=document.createElement('canvas');
  c.width=Math.ceil((x1-x0)*LET_R);c.height=Math.ceil((y1-y0)*LET_R);
  const g=c.getContext('2d');g.scale(LET_R,LET_R);g.translate(-x0,-y0);g.lineCap='round';g.lineJoin='round';
  const OUT=mode==='s'?'#0b0b14':'#14121e';
  for(const q of L.parts){g.strokeStyle=OUT;g.lineWidth=(q.lw||0)+6;g.stroke(q.p);}
  let fill=OUT;
  if(mode!=='s'){fill=g.createLinearGradient(0,y0,0,y1);fill.addColorStop(0,L.light);fill.addColorStop(0.45,L.col);fill.addColorStop(1,L.dark);}
  for(const q of L.parts){if(q.k==='fill'){g.fillStyle=fill;g.fill(q.p);}else{g.strokeStyle=fill;g.lineWidth=q.lw;g.stroke(q.p);}}
  if(mode!=='s'){ // soft shine
    g.save();g.translate(-1.6,-1.8);g.globalAlpha=0.35;g.strokeStyle='#fff';
    for(const q of L.parts){g.lineWidth=q.k==='fill'?2:Math.max(2,q.lw*0.22);g.stroke(q.p);}
    g.restore();
  }
  return c;
}
for(const L of LET){L.cv=buildLetter(L,'n');L.sil=buildLetter(L,'s');}

function letterEyes(L,o,face){
  const x=L.eyeX+face*2.5,y=L.eyeY,blink=(frame+o.i*53)%210<6;
  ctx.lineCap='round';
  if(o.down){ctx.strokeStyle='#14121e';ctx.lineWidth=2;for(const s of [-5,5]){ctx.beginPath();ctx.moveTo(x+s-3,y-2);ctx.lineTo(x+s+3,y+2);ctx.moveTo(x+s+3,y-2);ctx.lineTo(x+s-3,y+2);ctx.stroke();}return;}
  if(o.hurt>0){ctx.strokeStyle='#14121e';ctx.lineWidth=2.2;for(const s of [-5,5]){const d=s<0?1:-1;ctx.beginPath();ctx.moveTo(x+s-3*d,y-3);ctx.lineTo(x+s+3*d,y);ctx.lineTo(x+s-3*d,y+3);ctx.stroke();}
    ctx.fillStyle='#14121e';ell(x,y+9,3,2.4);ctx.fill();return;}
  for(const s of [-5,5]){
    if(blink){ctx.strokeStyle='#14121e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+s-3.5,y);ctx.lineTo(x+s+3.5,y);ctx.stroke();continue;}
    ctx.fillStyle='#fff';ell(x+s,y,4.2,5.2);ctx.fill();ctx.strokeStyle='#14121e';ctx.lineWidth=1.3;ctx.stroke();
    ctx.fillStyle='#14121e';circ(x+s+face*1.4,y+0.6,2.3);ctx.fillStyle='#fff';circ(x+s+face*1.4-0.8,y-0.6,0.8);
  }
  const angry=o.atk>=0||o.cast>=0||o.spinP>=0||o.dash;
  ctx.strokeStyle='#14121e';ctx.lineWidth=1.8;
  if(angry){for(const s of [-5,5]){ctx.beginPath();ctx.moveTo(x+s-4,y-7+(s*face>0?2:0));ctx.lineTo(x+s+4,y-7+(s*face>0?0:2));ctx.stroke();}
    ctx.fillStyle='#5a1020';ell(x+face*1.5,y+9.5,3,2.6);ctx.fill();}
  else{ctx.beginPath();ctx.arc(x+face*1,y+6.5,3.6,0.25*Math.PI,0.75*Math.PI);ctx.stroke();}
}
/* o: {i,x,y,face,sc,walk,moving,atk,flash,alpha,spinP,cast,dash,hurt,down,dotP,locked} */
function drawLetter(o){
  const L=LET[o.i],face=o.face||1,t=frame*0.06+o.i*1.7;
  ctx.save();ctx.translate(o.x,o.y);ctx.scale(o.sc,o.sc);
  if(o.alpha!=null)ctx.globalAlpha*=o.alpha;
  let rot=0,tx=0,ty=0,sx=1,sy=1,lg=0;
  if(o.down){rot=-Math.PI/2*face;ty=-4;}
  else{
    if(L.float)ty-=12+Math.sin(t*0.8)*4;
    if(o.moving){const s=Math.sin(o.walk);ty-=Math.abs(s)*(L.float?2:5);rot+=s*0.05;lg=s*6;}
    else{sy*=1+Math.sin(t)*0.025;sx*=1-Math.sin(t)*0.02;}
    if(o.atk>=0){const k=Math.sin(o.atk*Math.PI);
      if(L.id==='knight'){rot+=face*k*0.55;tx+=face*k*12;}
      else if(L.id==='archer'||L.id==='baa'){sx*=1+k*0.14;sy*=1-k*0.1;tx-=face*k*6;}
      else if(L.id==='mage'){rot-=face*k*0.2;sy*=1+k*0.08;}
      else if(L.id==='ain'){rot+=face*k*0.35;tx+=face*k*10;}
      else{tx+=face*k*16;sx*=1+k*0.13;sy*=1-k*0.12;}}
    if(o.cast>=0)rot-=face*Math.sin(o.cast*Math.PI)*0.35;
    if(o.dash){rot+=face*0.45;sx*=1.15;}
    if(o.hurt>0){const k=Math.sin(o.hurt*Math.PI);rot-=face*k*0.3;tx-=face*k*4;}
  }
  ctx.translate(tx,ty);ctx.rotate(rot);ctx.scale(sx,sy);
  if(o.spinP>=0){ctx.translate(0,L.cy);ctx.rotate(o.spinP*Math.PI*4*face);ctx.translate(0,-L.cy);}
  const [x0,y0,x1,y1]=L.box;
  if(o.locked){ctx.globalAlpha*=0.8;ctx.drawImage(L.sil,x0,y0,x1-x0,y1-y0);txt('?',(x0+x1)/2,L.cy,34,'#ffd24a');ctx.restore();return;}
  if(L.feet){
    ctx.fillStyle='#14121e';
    L.feet.forEach((fx,k)=>{const d=k?-lg:lg;ctx.fillRect(fx+d*0.5-2,L.legTop,4,L.legTop*-1-3);ell(fx+d+face*2,-3,7,4);ctx.fill();});
  }
  if(L.float&&!o.down){ctx.globalAlpha*=0.5;ctx.fillStyle=L.light;circ(-14,-6+Math.sin(t*2)*3,3);circ(12,-4+Math.cos(t*2)*3,2.5);ctx.globalAlpha/=0.5;}
  ctx.drawImage(L.cv,x0,y0,x1-x0,y1-y0);
  if(L.dot){const s=o.dotP==null?1:o.dotP;if(s>0.05){const d=L.dot;ctx.fillStyle='#14121e';circ(d.x,d.y,d.r*s+3);ctx.fillStyle=L.col;circ(d.x,d.y,d.r*s);ctx.fillStyle=L.light;circ(d.x-2.5*s,d.y-2.5*s,d.r*0.35*s);}}
  if(L.gem){const g=L.gem,k=o.atk>=0?Math.sin(o.atk*Math.PI):0,r=5+Math.sin(t*2)*1+k*5;ctx.save();ctx.globalAlpha*=0.35+k*0.4;ctx.fillStyle=L.light;circ(g.x,g.y,r*2.2);ctx.restore();
    ctx.fillStyle='#14121e';circ(g.x,g.y,r+2);ctx.fillStyle='#ffd24a';circ(g.x,g.y,r);ctx.fillStyle='#fff';circ(g.x-1.5,g.y-1.5,r*0.35);}
  if(o.flash){ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=0.7;ctx.drawImage(L.cv,x0,y0,x1-x0,y1-y0);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=o.alpha!=null?o.alpha:1;}
  letterEyes(L,o,face);
  ctx.restore();
}
function drawHeroLook(i,x,y,face,sc,o){
  o=o||{};
  drawLetter({i,x,y,face,sc:sc*0.92,walk:o.walk||0,moving:!!o.moving,atk:o.atk==null?-1:o.atk,flash:!!o.flash,alpha:o.alpha,spinP:-1,cast:-1,hurt:0,locked:!!o.locked});
}
