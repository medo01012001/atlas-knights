'use strict';
/* ================= BEASTS =================
   The creatures of the later lands: snakes and scorpions of the desert, bats of the caves, river crocodiles,
   mountain eagles, young dragons and stone giants. Each stage brings its own mix (LV[n].types in game.js),
   and every land is tougher than the one before. Flyers hover above their shadow but fight on the ground line. */
Object.assign(ED,{
  snake:{hp:34,spd:2.6,dmg:7,range:40,atkCd:45,gold:1,look:{beast:'snake',sc:1,h:34,body:'#6a9a3a',dark:'#3a5a1a',belly:'#d8d090'}},
  scorpion:{hp:70,spd:1.8,dmg:12,range:54,atkCd:60,gold:1,look:{beast:'scorpion',sc:1,h:58,body:'#b0702a',dark:'#6a3a10'}},
  bat:{hp:30,spd:2.9,dmg:7,range:40,atkCd:50,gold:1,fly:true,look:{beast:'bat',sc:1,h:40,body:'#4a3a5a',dark:'#2a1e36',eye:'#ff4040'}},
  croc:{hp:240,spd:1.2,dmg:22,range:72,atkCd:80,gold:1,look:{beast:'croc',sc:1.15,h:40,body:'#4a7a3a',dark:'#2a4a20',belly:'#c8c890'}},
  eagle:{hp:60,spd:2.6,dmg:13,range:48,atkCd:55,gold:1,fly:true,look:{beast:'eagle',sc:1,h:44,body:'#7a5030',dark:'#4a2e18',head:'#f2eee0'}},
  dragon:{hp:170,spd:1.4,dmg:16,range:380,atkCd:100,gold:1,ranged:true,fly:true,proj:'efire',look:{beast:'dragon',sc:1.1,h:60,body:'#b8322a',dark:'#6a1410',belly:'#f0b050'}},
  golem:{hp:380,spd:0.9,dmg:28,range:76,atkCd:100,gold:1,look:{sc:1.55,body:'#7a7468',dark:'#4a463e',skin:'#9a9488',head:'orc',weapon:'hammer'}}
});
/* names for the stage card on the map */
const ENAME={goblin:'العفاريت',skeleton:'الهياكل',orc:'الغيلان',darcher:'رماة الظلام',snake:'الأفاعي',scorpion:'العقارب',bat:'الخفافيش',
  croc:'التماسيح',eagle:'النسور',dragon:'التنانين',golem:'عمالقة الحجر'};

function beastHover(e){return e.d.fly?46+Math.sin(frame*0.09+e.x*0.05)*6:0;}
function drawBeast(e,sx,sy){
  const L=e.look,F=e.flash>0,c=k=>F?'#ffffff':k,atk=e.atkT>0?1-e.atkT/e.atkMax:-1,wind=e.wind>0,w=e.walk||0;
  ctx.save();ctx.translate(sx,sy-beastHover(e));ctx.scale(e.face*L.sc,L.sc);
  ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle=INK;ctx.lineWidth=3;
  const blob=(x,y,rx,ry,col,rot)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,rot||0,0,Math.PI*2);ctx.fillStyle=c(col);ctx.fill();ctx.stroke();};
  const eye=(x,y,r,col)=>{ctx.fillStyle=col||'#fff';circ(x,y,r);ctx.fillStyle=INK;circ(x+r*0.3,y,r*0.55);};
  switch(L.beast){
    case 'snake':{
      const lift=wind?-14:atk>=0?-6:0,lunge=atk>=0?Math.sin(atk*Math.PI)*16:0;
      ctx.lineWidth=17;ctx.strokeStyle=INK;const path=()=>{ctx.beginPath();for(let k=0;k<=12;k++){const x=-42+k*5.5+(k>8?lunge*(k-8)/4:0),y=-8+Math.sin(w*1.4+k*0.8)*5*(1-k/14)+(k>8?lift*(k-8)/4:0);k?ctx.lineTo(x,y):ctx.moveTo(x,y);}};
      path();ctx.stroke();ctx.lineWidth=12;ctx.strokeStyle=c(L.body);path();ctx.stroke();
      ctx.lineWidth=3;ctx.strokeStyle=c(L.dark);ctx.setLineDash([4,6]);path();ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=INK;const hx=24+lunge,hy=-10+lift;blob(hx,hy,11,8,L.body);eye(hx+3,hy-3,2.8,'#ffe040');
      if(wind||atk>=0){ctx.strokeStyle='#e0303a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(hx+10,hy+2);ctx.lineTo(hx+19,hy+2);ctx.lineTo(hx+22,hy-1);ctx.moveTo(hx+19,hy+2);ctx.lineTo(hx+22,hy+5);ctx.stroke();}
      break;}
    case 'scorpion':{
      const st=atk>=0?Math.sin(atk*Math.PI):wind?-0.3:0;
      ctx.lineWidth=2.5;for(let k=0;k<3;k++){const lx=-10+k*9,ph=Math.sin(w*2+k*1.7)*4;ctx.beginPath();ctx.moveTo(lx,-12);ctx.lineTo(lx-6+ph,-4);ctx.lineTo(lx-9+ph,2);ctx.stroke();ctx.beginPath();ctx.moveTo(lx+2,-12);ctx.lineTo(lx+8-ph,-4);ctx.lineTo(lx+11-ph,2);ctx.stroke();}
      ctx.lineWidth=3;
      for(let k=0;k<4;k++)blob(-14+k*9,-14,8,7,k%2?L.body:L.dark);
      // pincers
      for(const dy of [-4,4]){ctx.beginPath();ctx.moveTo(18,-14+dy);ctx.lineTo(28,-18+dy);ctx.lineWidth=4;ctx.stroke();ctx.lineWidth=3;blob(32,-18+dy,6,4.5,L.body);}
      // tail arcs over the back and stabs forward when it strikes
      let tx=-18,ty=-16;ctx.lineWidth=3;
      for(let k=0;k<5;k++){const a=-Math.PI/2-0.5+k*0.42+st*0.45*k;tx+=Math.cos(a)*8;ty+=Math.sin(a)*8;blob(tx,ty,5.5-k*0.4,5-k*0.4,k%2?L.dark:L.body);}
      ctx.fillStyle=c('#2a1a10');tri(tx+2,ty-4,tx+12,ty+2,tx+2,ty+4);
      eye(22,-18,2,'#ff5030');
      break;}
    case 'bat':{
      const fl=Math.sin(frame*0.5+e.x)*(wind?0.4:1),dive=atk>=0?Math.sin(atk*Math.PI)*16:0;
      ctx.translate(dive*0.6,dive);
      for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(s*14,-26-fl*14);ctx.lineTo(s*30,-20-fl*18);ctx.lineTo(s*24,-10-fl*8);ctx.lineTo(s*16,-12-fl*6);ctx.lineTo(s*8,-6);ctx.closePath();ctx.fillStyle=c(L.dark);ctx.fill();ctx.stroke();}
      blob(0,-12,10,11,L.body);ctx.fillStyle=c(L.body);tri(-7,-20,-3,-30,-1,-20);tri(7,-20,3,-30,1,-20);
      eye(-3,-14,2.4,L.eye);eye(4,-14,2.4,L.eye);ctx.fillStyle='#fff';tri(-2,-6,0,-2,1,-6);
      break;}
    case 'croc':{
      const jaw=atk>=0?Math.sin(atk*Math.PI)*0.55:wind?0.35:0;
      ctx.beginPath();ctx.moveTo(-34,-10);ctx.quadraticCurveTo(-58,-8+Math.sin(w)*4,-70,-4+Math.sin(w)*6);ctx.lineTo(-34,-2);ctx.closePath();ctx.fillStyle=c(L.body);ctx.fill();ctx.stroke();
      for(const lx of [-24,14]){const ph=Math.sin(w*1.2+lx)*4;ctx.fillStyle=c(L.dark);ctx.fillRect(lx+ph-4,-6,8,8);ctx.strokeRect(lx+ph-4,-6,8,8);}
      blob(-8,-12,30,11,L.body);ctx.fillStyle=c(L.belly);ctx.beginPath();ctx.ellipse(-8,-5,24,4,0,0,Math.PI);ctx.fill();
      ctx.fillStyle=c(L.dark);for(let k=0;k<6;k++)tri(-30+k*9,-21,-26+k*9,-28,-22+k*9,-21);
      // jaws
      ctx.save();ctx.translate(20,-14);ctx.rotate(-jaw);ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(32,-3);ctx.lineTo(34,2);ctx.lineTo(0,3);ctx.closePath();ctx.fillStyle=c(L.body);ctx.fill();ctx.stroke();
      ctx.fillStyle='#fff';for(let k=0;k<4;k++)tri(8+k*6,3,11+k*6,7,14+k*6,3);ctx.restore();
      ctx.save();ctx.translate(20,-12);ctx.rotate(jaw*0.4);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(30,2);ctx.lineTo(30,6);ctx.lineTo(0,8);ctx.closePath();ctx.fillStyle=c(L.dark);ctx.fill();ctx.stroke();ctx.restore();
      eye(24,-22,3.2,'#ffd040');
      break;}
    case 'eagle':{
      const fl=Math.sin(frame*0.32+e.x)*(wind?0.2:1),dive=atk>=0?Math.sin(atk*Math.PI)*22:wind?-8:0;
      ctx.translate(dive*0.7,dive);
      for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(-4,-16);ctx.quadraticCurveTo(s*10-6,-34-fl*16,s*36-6,-30-fl*20);ctx.lineTo(s*28-6,-22-fl*10);ctx.lineTo(s*20-6,-20-fl*8);ctx.lineTo(s*12-4,-12);ctx.closePath();ctx.fillStyle=c(s<0?L.dark:L.body);ctx.fill();ctx.stroke();}
      ctx.fillStyle=c(L.dark);tri(-14,-16,-28,-12,-14,-8);ctx.stroke();
      blob(-2,-14,14,9,L.body);blob(13,-22,8,7,L.head);
      ctx.fillStyle=c('#f0b020');ctx.beginPath();ctx.moveTo(19,-25);ctx.quadraticCurveTo(28,-24,26,-16);ctx.lineTo(20,-19);ctx.closePath();ctx.fill();ctx.stroke();
      eye(14,-24,2.2,'#ffd040');
      ctx.strokeStyle=c('#f0b020');ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(2,atk>=0?2:-1);ctx.moveTo(-6,-6);ctx.lineTo(-5,atk>=0?2:-1);ctx.stroke();
      break;}
    case 'dragon':{
      const fl=Math.sin(frame*0.22+e.x),mouth=wind?0.4:atk>=0?0.3:0.05;
      ctx.beginPath();ctx.moveTo(-18,-20);ctx.quadraticCurveTo(-40,-14,-50,-26+Math.sin(w+frame*0.05)*6);ctx.lineTo(-56,-22);ctx.lineTo(-48,-32);ctx.lineTo(-44,-24);ctx.quadraticCurveTo(-34,-22,-18,-28);ctx.closePath();ctx.fillStyle=c(L.body);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(-6,-34);ctx.lineTo(-26,-62-fl*14);ctx.lineTo(-34,-46-fl*10);ctx.lineTo(-30,-36);ctx.lineTo(-20,-30);ctx.closePath();ctx.fillStyle=c(L.dark);ctx.fill();ctx.stroke(); // back wing
      blob(-6,-26,20,13,L.body);ctx.fillStyle=c(L.belly);ctx.beginPath();ctx.ellipse(-4,-18,15,5,0,0,Math.PI);ctx.fill();
      ctx.lineWidth=9;ctx.strokeStyle=INK;ctx.beginPath();ctx.moveTo(8,-32);ctx.quadraticCurveTo(16,-46,22,-48);ctx.stroke();ctx.lineWidth=6;ctx.strokeStyle=c(L.body);ctx.stroke();ctx.lineWidth=3;ctx.strokeStyle=INK;
      ctx.save();ctx.translate(24,-50);
      ctx.fillStyle=c('#f2e6c0');tri(-6,-6,-14,-16,-2,-8);
      ctx.beginPath();ctx.moveTo(-6,-7);ctx.lineTo(10,-6);ctx.lineTo(16,-2);ctx.lineTo(4,1);ctx.lineTo(-6,4);ctx.closePath();ctx.fillStyle=c(L.body);ctx.fill();ctx.stroke();
      ctx.rotate(mouth);ctx.beginPath();ctx.moveTo(-4,2);ctx.lineTo(14,2);ctx.lineTo(4,7);ctx.closePath();ctx.fillStyle=c(L.dark);ctx.fill();ctx.stroke();ctx.rotate(-mouth);
      eye(2,-3,2.4,'#ffe040');
      if(wind){ctx.fillStyle='rgba(255,170,40,'+(0.5+0.4*Math.sin(frame*0.8))+')';circ(18,0,5+Math.random()*3);}
      ctx.restore();
      ctx.beginPath();ctx.moveTo(-2,-36);ctx.lineTo(10,-66-fl*16);ctx.lineTo(18,-52-fl*12);ctx.lineTo(16,-40);ctx.lineTo(6,-34);ctx.closePath();ctx.fillStyle=c(L.body);ctx.fill();ctx.stroke(); // front wing
      ctx.strokeStyle=c(L.dark);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-10,-16);ctx.lineTo(-12,-8);ctx.moveTo(2,-16);ctx.lineTo(2,-8);ctx.stroke();
      break;}
  }
  ctx.restore();
  if(e.elite){ctx.strokeStyle='rgba(255,210,74,'+(0.5+0.3*Math.sin(frame*0.15))+')';ctx.lineWidth=2;ell(sx,e.y,22*L.sc,8*L.sc);ctx.stroke();}
}
/* the dragon's fireball, drawn by drawProj */
function drawEfire(p,sx,sy){
  for(let k=3;k>=1;k--){ctx.fillStyle='rgba(255,'+(90+k*30)+',30,'+(0.15*(4-k))+')';circ(sx-p.vx*k*1.4,sy,10-k);}
  ctx.fillStyle='rgba(255,120,30,.4)';circ(sx,sy,14);ctx.fillStyle='#ff5a1a';circ(sx,sy,9);ctx.fillStyle='#ffe080';circ(sx,sy,4.5);
}

/* ---------- meet the monster ----------
   The first time a kind of monster shows up, the get-ready moment shows a card with it: its look, its name
   and how to deal with it. Seen kinds are remembered in PROG.seen so it only happens once. */
const ENOTE={goblin:'صغار وزربانين... كيجيو بزاف مرة وحدة.',skeleton:'عظام بالسيف، كيضربو وكيرجعو لور.',
  orc:'كبير وثقيل وضربتو كتوجع. بعد منو ملي يرفع الشاقور.',darcher:'كيرميو النبل من بعيد... سير ليهم نيشان.',
  snake:'زربانة وقريبة من الأرض، كتعض وكتهرب.',scorpion:'الديل ديالها فيه السم... رد البال ملي يترفع.',
  bat:'كيطيرو ويتهزو بزاف. الضربة ديالهم خفيفة ولكن كثار.',croc:'جلدو قاسح وفمو كبير... ما تبقاش قدامو.',
  eagle:'كينزل عليك من السما بالمخالب ديالو.',dragon:'كيطير وكيبزق النار من بعيد. ضربو قبل ما يبزق.',
  golem:'عملاق ديال الحجر: بطيء، ولكن ضربتو كتطيح.'};
const EONE={goblin:'عفريت',skeleton:'هيكل عظمي',orc:'غول',darcher:'رامي الظلام',snake:'أفعى',scorpion:'عقرب',bat:'خفاش',croc:'تمساح',eagle:'نسر',dragon:'تنين',golem:'عملاق الحجر'};
function waveIntro(queue){
  if(typeof PROG!=='object')return null;
  PROG.seen=PROG.seen||{};
  const t=queue.find(q=>!PROG.seen[q]);if(!t)return null;
  PROG.seen[t]=1;try{saveProg();}catch(e){}
  return {type:t,t:0};
}
function drawIntro(k){
  const I=G.intro;if(!I)return;I.t++;
  const a=Math.min(1,I.t/14),pw=Math.min(560,W-60),ph=170,px=W/2-pw/2,py=H/2-130+(1-a)*30;
  ctx.save();ctx.globalAlpha=a;
  panel(px,py,pw,ph,{frame:FRAMES.red,r:16,top:'#3a1830',bot:'#1a0a18'});
  ribbonFit(W/2,py+2,'👀 وحش جديد!',18,'#b8322a',200);
  // the monster on a little stage, facing the reader
  const d=ED[I.type],fake={kind:'enemy',type:I.type,d,look:d.look,x:0,y:0,z:0,face:1,walk:frame*0.2,moving:true,atkT:0,atkMax:1,wind:Math.floor(frame/50)%3===0?1:0,flash:false};
  const sx=px+110,sy=py+ph-28,sc=Math.min(1.5,1.25/Math.max(0.8,d.look.sc));
  ctx.fillStyle='rgba(0,0,0,.3)';ell(sx,sy,56,13);ctx.fill();
  ctx.save();ctx.translate(sx,sy);ctx.scale(sc,sc);
  if(d.look.beast){fake.x=0;drawBeast(fake,0,0);}else drawChar(Object.assign({},d.look,{x:0,y:0,face:1,walk:fake.walk,moving:true,atk:-1,wind:fake.wind,flash:false}));
  ctx.restore();
  const tx=px+pw-28;
  txt(EONE[I.type]||I.type,tx,py+46,26,'#ffe680','right');
  wrapLines(ENOTE[I.type]||'',pw-230,15).slice(0,3).forEach((l,j)=>txt(l,tx,py+82+j*22,15,'#f3e6e0','right',false));
  txt('⚠ استعدو! '+k,tx,py+ph-20,16,'#ffd24a','right');
  ctx.restore();
}
