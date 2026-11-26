'use strict';
/* ================= THE GATE =================
   Between scenes (map → stage, stage → shop, shop → map…) a Moroccan double door closes over the screen.
   While it is shut the next scene gets built and warmed up behind it, and the door shows something worth
   reading: a fact about the country, a line from the story, or a tip on how to play. Then it opens again.
   The player can skip it (A / Enter / click) once it has closed. */
const GATE={on:false,t:0,ph:0,fn:null,card:null,hold:0,skip:false,ltr:0};
const GATE_CLOSE=18,GATE_OPEN=20;
const GATE_TIPS=[
  'كل حرف عندو جوج مهارات قويين: K و L... جربهم ملي يكثرو عليك الأعداء.',
  'بدّل الحرف بـ Q وسط المعركة إلى نقصات ليه الصحة، والحرف اللي ارتاح كيرجع ليه شوية.',
  'القلوب اللي كيطيحو من الأعداء كيرجعو الصحة... ما تخليهمش يضيعو!',
  'كل ما دوزتي جزء من المرحلة، كتزاد ليك شوية ديال الصحة.',
  'البوس كيوجد الضربة الكبيرة ديالو... بعد عليه، ومن بعد ضربو ملي يرتاح.',
  'الفلوس كتشري بيهم الصحة والقوة والمهارات فالحانوت. طور الحرف اللي كتلعب بيه بزاف.',
  'تقدر تلعب مع صاحبك فنفس الجهاز: واحد بالكلافيي والآخر بالأسهم، ولا جوج مانيطات.',
  'المانيطة خدامة فكلشي: A باش تختار، B باش ترجع، Y باش تبدل الحرف.',
  'رجع للمراحل اللي دوزتي باش تجمع فلوس كثر وتولي أقوى.',
  'كل حرف جديد كتفكو كيزيد معاك فالفرقة... ختار شكون يلعب من زر الفرقة فالخريطة.'
];
function gatePick(a){return a[Math.floor(Math.random()*a.length)];}
/* story lines the player has already seen (no spoilers) */
function gateStory(){
  const out=[];
  if(PROG.intro){const s=storyIntro();for(const k of [0,1,3])out.push({who:'n',text:s[k].text});}
  for(const i of FOUND)if(i!==0&&MEET[i])out.push({who:i,text:MEET[i]});
  return out;
}
function gateCard(kind,n){
  if(kind==='stage'&&COUNTRY[n]){const c=COUNTRY[n];return {type:'fact',ico:c.ico,title:'المرحلة '+(n+1)+': '+c.c,text:c.fact,tip:gatePick(GATE_TIPS)};}
  const r=Math.random(),st=gateStory();
  if(kind!=='clear'&&st.length&&r<0.35){const s=gatePick(st);return {type:'story',title:'📖 من الحكاية',text:s.text,who:s.who};}
  if(r<0.7){const k=Math.floor(Math.random()*Math.max(1,Math.min(COUNTRY.length,PROG.cleared+1))),c=COUNTRY[k];
    return {type:'fact',ico:c.ico,title:'هل كنتي عارف؟ — '+c.c,text:c.fact};}
  return {type:'tip',title:'💡 كيفاش تلعب',text:gatePick(GATE_TIPS)};
}
function gate(fn,kind,n){
  if(GATE.on||(window.LOADER&&LOADER.on)){fn();return;}
  stopVoice();
  const card=gateCard(kind,n);
  Object.assign(GATE,{on:true,t:0,ph:0,fn,card,skip:false,ltr:gatePick(FOUND.length?FOUND:[0]),
    hold:Math.round(Math.min(420,Math.max(150,card.text.length*3.2)))});
  beep(110,0.5,'triangle',0.035,-40); // the old door creaks
}
/* called from update(); returns true while the gate owns the screen */
function gateTick(){
  if(!GATE.on)return false;
  GATE.t++;
  const skip=GATE.skip||pressed.Enter||pressed.NumpadEnter||pressed.Space||pressed.Escape||tap(0,'a')||tap(1,'a')||padTap(0,'b');
  GATE.skip=false;
  if(GATE.ph===0&&GATE.t>=GATE_CLOSE){ // shut: build the next scene behind the door
    noise(0.12,0.09);GATE.ph=1;GATE.t=0;const f=GATE.fn;GATE.fn=null;
    try{f&&f();}catch(e){console.error(e);}
  }else if(GATE.ph===1&&(GATE.t>=GATE.hold||(skip&&GATE.t>24))){GATE.ph=2;GATE.t=0;beep(140,0.4,'triangle',0.03,60);}
  else if(GATE.ph===2&&GATE.t>=GATE_OPEN){GATE.on=false;}
  return true;
}
const easeIO=x=>x<0.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
function drawDoor(s){ // s=-1 left door, 1 right door, drawn closed
  const x0=s<0?0:W/2,w=W/2;
  cached('door'+s,x0,0,w,H,()=>{
    ctx.fillStyle=vgrad(0,H,['#1f4256','#163246','#0d1e2c']);ctx.fillRect(x0,0,w,H);
    ctx.save();ctx.globalAlpha=0.22;ctx.fillStyle=zellige();ctx.fillRect(x0,0,w,H);ctx.restore();
    ctx.fillStyle='rgba(0,0,0,.18)';for(let x=x0+w/6;x<x0+w;x+=w/6)ctx.fillRect(x,0,2,H); // planks
    // carved arch panel with a gold frame
    const px=x0+34,pw=w-68,py=70,ph=H-130,r=pw/2;
    const arch=()=>{ctx.beginPath();ctx.moveTo(px,py+ph);ctx.lineTo(px,py+r);ctx.arc(px+r,py+r,r,Math.PI,0);ctx.lineTo(px+pw,py+ph);ctx.closePath();};
    ctx.lineWidth=12;ctx.strokeStyle=INK;arch();ctx.stroke();ctx.lineWidth=7;ctx.strokeStyle='#e0a32c';arch();ctx.stroke();
    ctx.lineWidth=2;ctx.strokeStyle='#fff0b0';arch();ctx.stroke();
    ctx.save();arch();ctx.clip();ctx.fillStyle='rgba(8,18,28,.35)';ctx.fillRect(px,py,pw,ph);
    ctx.globalAlpha=0.35;ctx.fillStyle=zellige();ctx.fillRect(px,py,pw,ph);ctx.restore();
    // studs along the edges
    for(let y=26;y<H;y+=44)for(const x of [x0+14,x0+w-14]){ctx.fillStyle=INK;circ(x,y,6);ctx.fillStyle=vgrad(y-5,y+5,FRAMES.gold);circ(x,y,4.5);}
    // the iron ring knocker near the middle
    const kx=s<0?x0+w-60:x0+60,ky=H*0.56;
    ctx.fillStyle=INK;circ(kx,ky-26,11);ctx.fillStyle=vgrad(ky-36,ky-16,FRAMES.gold);circ(kx,ky-26,8);
    ctx.lineWidth=9;ctx.strokeStyle=INK;ctx.beginPath();ctx.arc(kx,ky,22,0,Math.PI*2);ctx.stroke();
    ctx.lineWidth=5;ctx.strokeStyle='#e0a32c';ctx.beginPath();ctx.arc(kx,ky,22,0,Math.PI*2);ctx.stroke();
    // the seam
    ctx.fillStyle=INK;ctx.fillRect(s<0?x0+w-4:x0,0,4,H);
  });
}
function drawGate(){
  const g=GATE,p=g.ph===0?easeIO(Math.min(1,g.t/GATE_CLOSE)):g.ph===1?1:1-easeIO(Math.min(1,g.t/GATE_OPEN));
  ctx.save();ctx.fillStyle='rgba(6,4,14,'+(0.45*p)+')';ctx.fillRect(0,0,W,H);
  for(const s of [-1,1]){ctx.save();ctx.translate(s*(1-p)*W/2,0);drawDoor(s);ctx.restore();}
  if(g.ph===1||(g.ph===2&&p>0.85)){
    const a=g.ph===1?Math.min(1,g.t/14):Math.max(0,(p-0.85)/0.15);
    ctx.globalAlpha=a;hit(0,0,W,H,()=>{GATE.skip=true;});
    gateContent(g.card);
  }
  ctx.restore();
}
function gateContent(c){
  const cx=W/2,t=frame;
  // the golden seal with a hopping letter
  const sy=118;
  ctx.save();ctx.translate(cx,sy);
  for(const k of [0,1]){ctx.save();ctx.rotate((k?-1:1)*t*0.02+k*Math.PI/4);ctx.fillStyle=INK;rr(-50,-50,100,100,12);
    ctx.fillStyle=vgrad(-46,46,['#fff3a0','#f2b631','#a8620e']);rr(-46,-46,92,92,10);ctx.restore();}
  ctx.fillStyle=INK;circ(0,0,40);const bg=ctx.createRadialGradient(0,-12,4,0,0,38);bg.addColorStop(0,'#4a8ff0');bg.addColorStop(1,'#173a7a');ctx.fillStyle=bg;circ(0,0,37);
  ctx.restore();
  const hop=Math.abs(Math.sin(t*0.11))*10,sq=1+Math.sin(t*0.22)*0.05;
  ctx.save();ctx.beginPath();ctx.arc(cx,sy,37,0,Math.PI*2);ctx.clip();
  drawLetter({i:GATE.ltr,x:cx,y:sy+26-hop,face:1,sc:0.4*sq,walk:0,moving:false,atk:-1,flash:false,spinP:-1,cast:-1,hurt:0});ctx.restore();
  if(c.ico)txt(c.ico,cx+58,sy-44,26,'#fff',false);
  // the card
  const pw=Math.min(W-90,760),px=cx-pw/2,py=196,maxW=pw-70,lines=wrapLines(c.text,maxW,21),lh=31;
  const tipL=c.tip?wrapLines('💡 '+c.tip,maxW,16):[],ph=Math.max(150,62+lines.length*lh+(tipL.length?tipL.length*24+18:0));
  panel(px,py,pw,ph,{frame:c.type==='story'?FRAMES.blue:FRAMES.gold,r:16,b:4,top:'#2a2f62',bot:'#14163a'});
  ribbonFit(cx,py,c.title,17,c.type==='story'?'#3a5ab0':c.type==='tip'?'#2f8a4a':'#b8322a',240);
  let y=py+50;
  if(c.type==='story'&&c.who!=null){const nm=c.who==='n'?'الراوي':HEROES[c.who].name;txt('— '+nm,px+pw-34,y-6,15,'#9cc8ff','right');y+=20;}
  for(const ln of lines){txt(ln,px+pw-35,y,21,c.type==='story'?'#f3e6c4':'#ffffff','right',INK);y+=lh;}
  if(tipL.length){y+=4;ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(px+30,y-14,pw-60,2);y+=8;for(const ln of tipL){txt(ln,px+pw-35,y,16,'#ffe08a','right',INK);y+=24;}}
  // progress bar + continue hint
  const by=Math.min(H-34,py+ph+34),bw=Math.min(300,pw-120),k=GATE.ph===1?Math.min(1,GATE.t/GATE.hold):1;
  ctx.fillStyle=INK;rr(cx-bw/2-3,by-8,bw+6,16,8);ctx.fillStyle='#1e1a38';rr(cx-bw/2,by-5,bw,10,5);
  ctx.fillStyle=vgrad(by-5,by+5,['#fff3a0','#f2b631']);rr(cx+bw/2-bw*k,by-5,Math.max(10,bw*k),10,5);
  if(GATE.ph===1&&GATE.t>24&&Math.floor(frame/25)%2===0)txt((padCount?'A':'Enter')+' ◀ كمل',cx,by+24,15,'#ffd24a',INK);
}

/* wrap the scene changes so each one goes through the gate */
(function(){
  const wrap=(name,kind,ok)=>{const f=window[name];window[name]=function(...a){
    if(GATE.on||(ok&&!ok(...a)))return f.apply(this,a);gate(()=>f.apply(this,a),kind,a[0]);};};
  wrap('startStage','stage',n=>unlocked(n));
  wrap('openShop','shop');
  wrap('stageCleared','clear');
  wrap('resetMenu','map',()=>state!=='menu');
})();
