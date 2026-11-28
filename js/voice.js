'use strict';
/* ================= VOICES, GUIDE & NATURE SOUNDS =================
   - Voices: the story is read aloud with the browser's Arabic voice (best: Edge, Android, iPhone).
     Each speaker gets its own pitch; with no Arabic voice the letters "babble" in little beeps instead.
   - Guide: in the first stage a narrator shows how to play, step by step, once.
   - Nature: soft wind, birds, sea, crickets… made live with WebAudio, never music. */

/* ---------- voices ---------- */
const VOICE={ar:[],female:null,male:null,on:false};
function loadVoices(){
  try{
    const all=speechSynthesis.getVoices(),ar=all.filter(v=>/^ar/i.test(v.lang));
    const rank=v=>(/ar-MA/i.test(v.lang)?0:/ar-(DZ|TN|LY|EG)/i.test(v.lang)?1:2)+(/natural|online/i.test(v.name)?0:0.5);
    ar.sort((a,b)=>rank(a)-rank(b));
    VOICE.ar=ar;
    VOICE.female=ar.find(v=>/mouna|salma|zariyah|hoda|amina|fatima|laila|female|sana|rana|shakir/i.test(v.name)&&!/shakir/i.test(v.name))||ar[0]||null;
    VOICE.male=ar.find(v=>/jamal|hamed|naayf|shakir|bassel|omar|taim|male|maged|tarik/i.test(v.name))||ar[1]||ar[0]||null;
  }catch(e){}
}
try{loadVoices();speechSynthesis.onvoiceschanged=loadVoices;}catch(e){}
const hasVoice=()=>!!(SET.voice&&VOICE.ar.length&&window.speechSynthesis);
/* who: 'n' narrator | 'd' Dark Lord | 'h' Hamza | 0..5 a letter */
const VPROF={n:{v:'female',p:1,r:0.95},d:{v:'male',p:0.15,r:0.82},h:{v:'female',p:1.85,r:1.05},
  0:{v:'male',p:1.05,r:1},1:{v:'female',p:1.3,r:1.05},2:{v:'male',p:0.8,r:0.95},3:{v:'male',p:0.6,r:0.92},4:{v:'female',p:1.45,r:1.02},5:{v:'female',p:1.1,r:1.08}};
/* ---- recorded lines (assets/voice/<id>.mp3, made with Google AI Studio). assets/voice/list.txt lists the ready ones ---- */
for(let i=6;i<HEROES.length;i++)VPROF[i]={v:i%2?'female':'male',p:0.75+((i*37)%60)/100,r:0.95+((i*13)%14)/100}; // the 22 new letters
const CLIP={ready:null,cache:{},cur:null,map:null};
try{fetch('assets/voice/list.txt?v=13').then(r=>r.ok?r.text():'').then(t=>{CLIP.ready=new Set(t.split(/\s+/).filter(Boolean));}).catch(()=>{CLIP.ready=new Set();});}catch(e){CLIP.ready=new Set();}
/* every spoken line with its id and speaker — also the source of the voice script */
function voiceLines(){
  const L=[],add=(id,w,text)=>L.push({id,w,text});
  storyIntro().forEach((sl,k)=>add(sl.vid||'intro_'+(k+1),sl.w,sl.text));
  (typeof COUNTRY!=='undefined'?COUNTRY:[]).forEach((c,k)=>add(c.v?'cage_'+c.v:'cage_x'+(k+1),'n',storyMeet(0,0,c.c)[0].text));
  for(const i in MEET)add('meet_'+i,+i,MEET[i]);
  BEATS.forEach((f,k)=>f(9).forEach((sl,j)=>add('beat_'+(k+1)+'abc'[j],sl.w===9?'f':sl.w,sl.text)));
  storyGate().forEach((sl,k)=>add('gate_'+(k+1),sl.w,sl.text));
  storyEnding().forEach((sl,k)=>add('end_'+(k+1),sl.w,sl.text));
  TUT_STEPS.forEach((st,k)=>add('tut_'+(k+1),'n',st.say));
  add('tut_shop','n',TUT_SHOP);
  return L;
}
function clipId(text){
  if(!CLIP.map){CLIP.map={};try{for(const l of voiceLines())CLIP.map[l.text]=l.id;}catch(e){}}
  return CLIP.map[text];
}
function clipFor(id){
  if(!id||!CLIP.ready||!CLIP.ready.has(id))return null;
  let a=CLIP.cache[id];
  if(!a){a=CLIP.cache[id]=new Audio('assets/voice/'+id+'.mp3');a.preload='auto';a.onerror=()=>{a.bad=true;};}
  return a.bad?null:a;
}
function preloadLines(slides){for(const sl of slides)clipFor(clipId(sl.text));}
/* say a line: recorded clip → browser Arabic voice → nothing (the caller then babbles). true when it is voiced */
function sayLine(text,who){
  stopVoice();
  if(!SET.voice||SET.vol<=0)return false;
  const a=clipFor(clipId(text));
  if(a){try{a.currentTime=0;a.volume=Math.min(1,SET.vol*1.1);const p=a.play();if(p&&p.catch)p.catch(()=>{});CLIP.cur=a;return true;}catch(e){}}
  return speak(text,who);
}
function speak(text,who){
  if(!hasVoice())return false;
  try{
    const pr=VPROF[who]||VPROF.n,u=new SpeechSynthesisUtterance(cleanSay(text));
    u.voice=VOICE[pr.v]||VOICE.ar[0];u.lang=u.voice?u.voice.lang:'ar';
    u.pitch=pr.p;u.rate=pr.r;u.volume=Math.min(1,0.4+SET.vol*0.7);
    speechSynthesis.speak(u);VOICE.on=true;return true;
  }catch(e){return false;}
}
function stopVoice(){
  if(CLIP.cur){try{CLIP.cur.pause();}catch(e){}CLIP.cur=null;}
  try{if(VOICE.on)speechSynthesis.cancel();}catch(e){}VOICE.on=false;
}
function cleanSay(s){return s.replace(/[\u{1F300}-\u{1FAFF}☀-➿️⚔✨⏭«»]/gu,'').replace(/\.\.\./g,'، ').trim();}
/* babble: a short beep per syllable, in the speaker's own pitch (used when there is no Arabic voice) */
const BABBLE={n:620,d:180,h:1250,f:700,0:520,1:760,2:430,3:330,4:880,5:680};
function babble(who){beep((BABBLE[who]||600)*(0.92+Math.random()*0.16),0.035,who==='d'?'sawtooth':'square',0.012);}

/* ---------- the how-to-play guide (stage 1, first time) ---------- */
const TUT={step:-1,t:0,said:-1,x0:0,kills:0,shop:false,ended:false};
const TUT_SHOP='هادا هو الحانوت! بالفلوس اللي جمعتي، طور الصحة والقوة والمهارات ديال الحروف ديالك.';
function tutKeys(){
  const k=KL,pad=padCount>0;
  return {move:pad?'الستيك':k.KeyW+' '+k.KeyA+' '+k.KeyS+' '+k.KeyD,hit:pad?'A':k.KeyJ,k1:pad?'X':k.KeyK,k2:pad?'B':k.KeyL,sw:pad?'Y':k.KeyQ,next:pad?'A':'Enter'};
}
const TUT_STEPS=[
  {txt:K=>'🚶 تحرك بـ '+K.move+' باش تمشي لقدام',say:'مرحبا بيك يا البطل! تحرك باش تمشي لقدام.',done:h=>Math.abs(h.x-TUT.x0)>140||TUT.t>900},
  {txt:K=>'⚔ ضرب الأعداء بـ '+K.hit,say:'هاهوما الأعداء جاو! ضربهم.',when:()=>G.enemies.some(e=>!e.dead),done:()=>TUT.kills>=2||TUT.t>900},
  {txt:K=>'✨ عندك جوج مهارات قويين: '+K.k1+' و '+K.k2,say:'زوين! دابا جرب المهارات ديالك، راهم قويين بزاف.',done:h=>h.cdK>0||h.cdL>0||TUT.t>720},
  {txt:()=>'❤ القلوب كيرجعو الصحة، و🪙 الفلوس كتشري بيهم القوة',say:'جمع القلوب باش ترجع الصحة، وجمع الفلوس باش تشري القوة من الحانوت.',done:()=>TUT.t>420},
  {txt:()=>'➜ تبع السهم باش تزيد لقدام',say:'مزيان! تبع السهم باش تكمل الطريق.',when:()=>G.goT>0,done:()=>TUT.t>300},
  {txt:()=>'👹 البوس! بعد من الضربة الكبيرة ديالو، وضربو ملي يرتاح',say:'رد البال! هادا هو البوس. بعد من الضربة ديالو، وضربو ملي يرتاح.',when:()=>!!G.boss,done:()=>TUT.t>420}
];
function tutActive(){return state==='play'&&G&&G.level===0&&!PROG.tut&&TUT.step>=0;}
function tutStart(){if(!PROG.tut&&G&&G.level===0&&!TUT.ended){TUT.step=0;TUT.t=0;TUT.said=-1;TUT.kills=0;const h=G.heroes[0];TUT.x0=h?h.x:0;}}
function tutTick(){
  if(state==='shop'&&!PROG.tutShop&&G&&G.level===0&&!TUT.shop){TUT.shop=true;TUT.shopT=0;sayLine(TUT_SHOP,'n');}
  if(state==='shop'&&TUT.shop&&!PROG.tutShop){TUT.shopT++;if(TUT.shopT>600){PROG.tutShop=1;saveProg();}}
  if(state==='play'&&G&&G.level===0&&!PROG.tut&&TUT.step<0)tutStart();
  if(!tutActive()||G.paused)return;
  const s=TUT_STEPS[TUT.step],h=G.heroes.find(o=>o.ctrl===0)||G.heroes[0];if(!s||!h)return;
  if(s.when&&!s.when()){TUT.t=0;return;}
  if(TUT.said!==TUT.step){TUT.said=TUT.step;TUT.t=0;if(!sayLine(s.say,'n'))for(let i=0;i<4;i++)setTimeout(()=>babble('n'),i*70);}
  TUT.t++;
  if(TUT.t>40&&s.done(h)){TUT.step++;TUT.t=0;if(TUT.step>=TUT_STEPS.length){TUT.step=-1;TUT.ended=true;PROG.tut=1;saveProg();}}
}
function drawTut(){
  if(state==='play'&&G.paused)return;
  let msg=null;
  if(tutActive()){const s=TUT_STEPS[TUT.step];if(s&&(!s.when||s.when()))msg=s.txt(tutKeys());}
  else if(state==='shop'&&TUT.shop&&!PROG.tutShop)msg='🛒 طور الحروف بالفلوس: كليك على الثمن ولا '+tutKeys().hit+' باش تشري';
  if(!msg)return;
  const a=Math.min(1,TUT.t/20||1),w=Math.min(W-40,tw(msg,17)+110),x=W/2-w/2,y=state==='shop'?H-118:H-74,hh=50;
  ctx.save();ctx.globalAlpha=state==='shop'?1:a;
  panel(x,y,w,hh,{frame:FRAMES.gold,r:14,b:3,noCorners:true,top:'#2c3266',bot:'#1a1c44'});
  ctx.fillStyle=INK;circ(x+w-28,y+hh/2,21);ctx.fillStyle=vgrad(y+5,y+hh-5,['#fff3a0','#f2b631']);circ(x+w-28,y+hh/2,18);
  txt('📖',x+w-28,y+hh/2+1,18,'#fff',false);
  txt(msg,x+w-56,y+hh/2+1,17,'#ffffff','right');
  ctx.restore();
}

/* ---------- nature sounds ----------
   No wind any more: each land has its own sound — birds singing in the green places, rain in the snowy
   mountains, the crackle and rumble of fire at the volcano, waves and gulls by the sea, drips in the cave,
   crickets at the night oasis. All soft, under the game, and they follow the volume and the 🌿 switch. */
const AMB={g:null,layers:{},theme:'',next:0,t:0};
function ambInit(){
  if(AMB.g||!AC)return;
  try{
    const len=AC.sampleRate*3,mk=f=>{const b=AC.createBuffer(1,len,AC.sampleRate),d=b.getChannelData(0);f(d);return b;};
    const brown=mk(d=>{let l=0;for(let i=0;i<len;i++){l=(l+0.02*(Math.random()*2-1))/1.02;d[i]=l*3.5;}});
    const white=mk(d=>{for(let i=0;i<len;i++)d[i]=Math.random()*2-1;});
    AMB.g=AC.createGain();AMB.g.gain.value=0;AMB.g.connect(AC.destination);
    const layer=(buf,type,f,q)=>{const s=AC.createBufferSource();s.buffer=buf;s.loop=true;s.start(0,Math.random()*2);
      const fl=AC.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q||0.7;const g=AC.createGain();g.gain.value=0;
      s.connect(fl);fl.connect(g);g.connect(AMB.g);return {f:fl,g};};
    AMB.layers.sea=layer(brown,'bandpass',500,0.6);
    AMB.layers.rain=layer(white,'bandpass',2600,0.5);
    AMB.layers.fire=layer(brown,'lowpass',260);
  }catch(e){AMB.g=null;}
}
/* bg number -> what you hear there (0 forest, 1 desert, 2 snow, 3 cave, 4 empty quarter, 5 medina, 6 night oasis, 7 blue city, 8 sea, 9 market, 10 volcano) */
const AMBT={
  map:{birds:0.6},story:{birds:0.4},win:{birds:1},
  0:{birds:1,forest:1},1:{hawk:1},2:{rain:1},3:{drips:1},4:{hawk:0.5},
  5:{birds:0.5},6:{crickets:1},7:{birds:0.7},8:{sea:1,gulls:1},9:{birds:0.4},10:{fire:1}
};
function ambTheme(){
  if(state==='menu')return 'map';
  if(state==='story'){const s=STORY.slides[STORY.i];return s&&s.bg!=null&&!s.img?s.bg:'story';}
  if(state==='win')return 'win';
  return G?LV[G.level].bg:'map';
}
function ambTick(){
  if(!AC)return;ambInit();if(!AMB.g)return;
  const T=AC.currentTime,th=ambTheme(),P=AMBT[th]||AMBT.map,on=SET.amb?1:0,quiet=(state==='play'&&G&&G.paused)||SNDUI.open?0.5:1,Ly=AMB.layers;
  AMB.g.gain.setTargetAtTime(0.16*SET.vol*on*quiet,T,0.6);
  if(th!==AMB.theme){AMB.theme=th;
    Ly.sea.g.gain.setTargetAtTime(P.sea?0.5:0,T,1.5);Ly.rain.g.gain.setTargetAtTime(P.rain?0.32:0,T,1.5);Ly.fire.g.gain.setTargetAtTime(P.fire?0.9:0,T,1.5);}
  if(++AMB.t%40===0){
    if(P.sea){Ly.sea.f.frequency.setTargetAtTime(350+Math.random()*450,T,1.6);Ly.sea.g.gain.setTargetAtTime(0.25+0.45*(0.5+0.5*Math.sin(T*0.8)),T,1.4);}
    if(P.rain){Ly.rain.g.gain.setTargetAtTime(0.24+Math.random()*0.14,T,2);Ly.rain.f.frequency.setTargetAtTime(2200+Math.random()*900,T,2);}
    if(P.fire)Ly.fire.g.gain.setTargetAtTime(0.7+Math.random()*0.4,T,0.8);
  }
  if(!on||SET.vol<=0)return;
  const v=0.02*SET.vol;
  // quick details that keep going: raindrops and fire crackles
  if(P.rain&&Math.random()<0.25)chirp(2400+Math.random()*2400,v*0.35,0.02,-900);
  if(P.fire&&Math.random()<0.12){const n=1+(Math.random()*3|0);for(let i=0;i<n;i++)setTimeout(()=>crackle(v*2.2),i*(30+Math.random()*70));}
  if(frame<AMB.next)return;
  AMB.next=frame+(P.forest?35:60)+Math.random()*(P.forest?120:240);
  if(P.birds&&Math.random()<P.birds)birdSong(v*(P.forest?1.1:0.9));
  if(P.forest&&Math.random()<0.35)setTimeout(()=>birdSong(v*0.6),300+Math.random()*700); // a second bird answers further away
  if(P.hawk&&Math.random()<0.18*P.hawk)chirp(1700,v*0.7,0.6,-700);
  if(P.gulls&&Math.random()<0.35)chirp(1400,v*0.8,0.35,-500);
  if(P.crickets){for(let i=0;i<6;i++)setTimeout(()=>beepAmb(4600,0.025,v*0.5),i*55);}
  if(P.drips&&Math.random()<0.6)chirp(900+Math.random()*700,v*1.2,0.08,-400);
}
/* a few kinds of little songs so the forest does not repeat itself */
function birdSong(v){
  const k=Math.random()*4|0,f=2000+Math.random()*1800;
  if(k===0){const n=3+(Math.random()*4|0);for(let i=0;i<n;i++)setTimeout(()=>chirp(f*(0.92+Math.random()*0.16),v,0.06),i*70);}            // quick trill
  else if(k===1){chirp(f*0.8,v,0.22,f*0.5);setTimeout(()=>chirp(f*1.1,v,0.18,-f*0.4),260);}                                          // two-note whistle
  else if(k===2){for(let i=0;i<2;i++)setTimeout(()=>chirp(f,v,0.09,f*0.3),i*150);setTimeout(()=>chirp(f*1.25,v,0.25,-f*0.6),330);}  // tee-tee-tuu
  else{const n=5+(Math.random()*4|0);for(let i=0;i<n;i++)setTimeout(()=>chirp(f*(1+i*0.04),v*0.8,0.035,f*0.2),i*45);}                // rising chatter
}
/* one dry pop of burning wood */
function crackle(v){if(!AC||!AMB.g)return;const n=Math.floor(AC.sampleRate*0.015),b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);
  for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);const s=AC.createBufferSource(),g=AC.createGain(),f=AC.createBiquadFilter();
  f.type='highpass';f.frequency.value=1200+Math.random()*1500;g.gain.value=v*8;s.buffer=b;s.connect(f);f.connect(g);g.connect(AMB.g);s.start();}

/* ---------- the sound window (gear button) ----------
   Opens over any screen: volume up/down, mute, story voices on/off, nature sounds on/off. Saved like the settings page. */
const SNDUI={open:false,row:0};
function sndOpen(){SNDUI.open=true;SNDUI.row=0;if(state==='play'&&G)G.paused=true;}
function sndVol(d){SET.vol=clamp(Math.round((SET.vol+d)*10)/10,0,1);if(SET.vol>0)SET.pvol=SET.vol;sndApply();}
function sndMute(){if(SET.vol>0){SET.pvol=SET.vol;SET.vol=0;}else SET.vol=SET.pvol>0?SET.pvol:0.8;sndApply();}
function sndApply(){saveSet();if(CLIP.cur)try{CLIP.cur.volume=Math.min(1,SET.vol*1.1);}catch(e){}if(SET.vol<=0||!SET.voice)stopVoice();initAudio();beep(880,0.06,'square',0.04);}
function sndToggle(k){SET[k]=SET[k]?0:1;sndApply();}
/* called from update(); while the window is open it takes the keys */
function sndTick(){
  if(!SNDUI.open)return false;
  const up=tap(0,'up')||pressed.ArrowUp,dn=tap(0,'down')||pressed.ArrowDown,lf=tap(0,'left')||pressed.ArrowLeft,rt=tap(0,'right')||pressed.ArrowRight;
  if(up)SNDUI.row=(SNDUI.row+4)%5;if(dn)SNDUI.row=(SNDUI.row+1)%5;
  if(SNDUI.row===0&&(lf||rt))sndVol(rt?0.1:-0.1);
  if(tap(0,'a')||pressed.Enter||pressed.Space){if(SNDUI.row===1)sndMute();else if(SNDUI.row===2)sndToggle('voice');else if(SNDUI.row===3)sndToggle('amb');else if(SNDUI.row===4)SNDUI.open=false;}
  if(pressed.Escape||padTap(0,'b')||padTap(0,'start'))SNDUI.open=false;
  return true;
}
function gearBtn(x,y){btn(x,y,44,38,SET.vol>0?'⚙':'🔇',sndOpen,'dark',{size:18});}
function drawSndUI(){
  if(!SNDUI.open)return;
  ctx.fillStyle='rgba(8,6,20,.72)';ctx.fillRect(0,0,W,H);hit(0,0,W,H,()=>{});
  const pw=Math.min(520,W-40),ph=330,px=W/2-pw/2,py=H/2-ph/2;
  panel(px,py,pw,ph,{frame:FRAMES.gold,r:16});ribbonFit(W/2,py+4,'⚙ الصوت',24,'#2f6fd0',220);
  const rows=[['🔊','الصوت'],['🔇','كتم الصوت'],['🗣','أصوات الحكاية'],['🌿','أصوات الطبيعة']];
  rows.forEach(([ic,nm],k)=>{
    const y=py+50+k*56,sel=SNDUI.row===k,rx=px+20,rw=pw-40;
    ctx.fillStyle=sel?'rgba(255,210,74,.16)':'rgba(0,0,0,.25)';rp(rx,y,rw,46,10);ctx.fill();if(sel){ctx.strokeStyle='#ffd24a';ctx.lineWidth=2.5;ctx.stroke();}
    hit(rx,y,rw,46,()=>{SNDUI.row=k;});
    txt(ic,rx+rw-24,y+24,20,'#fff',false);txt(nm,rx+rw-48,y+24,17,'#fff','right');
    if(k===0){
      const bw=Math.min(200,rw-250),bx=rx+60;
      btn(rx+8,y+7,44,32,'−',()=>{SNDUI.row=0;sndVol(-0.1);},'dark',{size:20});
      btn(bx+bw+10,y+7,44,32,'+',()=>{SNDUI.row=0;sndVol(0.1);},'gold',{size:20});
      for(let q=0;q<10;q++){const sx=bx+q*(bw/10);ctx.fillStyle=q<Math.round(SET.vol*10)?vgrad(y+14,y+32,GOLDB):'#3a3450';rp(sx+2,y+14,bw/10-4,18,3);ctx.fill();}
      txt(Math.round(SET.vol*100)+'%',bx+bw+84,y+24,15,'#ffd24a');
    }else{
      const on=k===1?SET.vol<=0:k===2?!!SET.voice:!!SET.amb;
      btn(rx+8,y+7,120,32,on?'✔ مشعول':'✖ مطفي',()=>{SNDUI.row=k;k===1?sndMute():sndToggle(k===2?'voice':'amb');},on?'green':'dark',{size:15});
    }
  });
  const sel4=SNDUI.row===4;
  btn(W/2-90,py+ph-58,180,44,'✔ مزيان',()=>{SNDUI.open=false;},sel4?'green':'gold',{size:18,glow:sel4});
}
function chirp(f,v,d,slide){if(!AC)return;d=d||0.07;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type='sine';
  o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(80,f+(slide!=null?slide:f*0.35)),t+d);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(g);g.connect(AMB.g||AC.destination);o.start(t);o.stop(t+d+0.02);}
function beepAmb(f,d,v){chirp(f,v,d,0.01);}
