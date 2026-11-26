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
const CLIP={ready:null,cache:{},cur:null,map:null};
try{fetch('assets/voice/list.txt?v=13').then(r=>r.ok?r.text():'').then(t=>{CLIP.ready=new Set(t.split(/\s+/).filter(Boolean));}).catch(()=>{CLIP.ready=new Set();});}catch(e){CLIP.ready=new Set();}
/* every spoken line with its id and speaker — also the source of the voice script */
function voiceLines(){
  const L=[],add=(id,w,text)=>L.push({id,w,text});
  storyIntro().forEach((sl,k)=>add('intro_'+(k+1),sl.w,sl.text));
  (typeof COUNTRY!=='undefined'?COUNTRY:[]).forEach((c,k)=>add('cage_'+(k+1),'n',storyMeet(0,0,c.c)[0].text));
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

/* ---------- nature sounds ---------- */
const AMB={g:null,wind:null,wf:null,sea:null,sf:null,theme:'',next:0,t:0};
function ambInit(){
  if(AMB.g||!AC)return;
  try{
    const len=AC.sampleRate*3,buf=AC.createBuffer(1,len,AC.sampleRate),d=buf.getChannelData(0);
    let last=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;last=(last+0.02*w)/1.02;d[i]=last*3.5;} // brown noise: soft and deep
    const src=()=>{const s=AC.createBufferSource();s.buffer=buf;s.loop=true;s.start(0,Math.random()*2);return s;};
    AMB.g=AC.createGain();AMB.g.gain.value=0;AMB.g.connect(AC.destination);
    AMB.wf=AC.createBiquadFilter();AMB.wf.type='lowpass';AMB.wf.frequency.value=500;AMB.wind=AC.createGain();AMB.wind.gain.value=0;
    src().connect(AMB.wf);AMB.wf.connect(AMB.wind);AMB.wind.connect(AMB.g);
    AMB.sf=AC.createBiquadFilter();AMB.sf.type='bandpass';AMB.sf.frequency.value=500;AMB.sf.Q.value=0.6;AMB.sea=AC.createGain();AMB.sea.gain.value=0;
    src().connect(AMB.sf);AMB.sf.connect(AMB.sea);AMB.sea.connect(AMB.g);
  }catch(e){AMB.g=null;}
}
/* per place: wind level & tone, sea, and little details (birds, crickets, drips, crackles) */
const AMBT={
  map:{w:0.5,f:420,birds:0.5},story:{w:0.45,f:360},win:{w:0.3,f:500,birds:1},
  0:{w:0.45,f:520,birds:1},1:{w:0.8,f:750,gust:1},2:{w:0.9,f:420,gust:1},3:{w:0.35,f:220,drips:1},4:{w:0.75,f:260,gust:1},
  5:{w:0.4,f:560,birds:0.6},6:{w:0.35,f:400,crickets:1},7:{w:0.4,f:600,birds:0.7},8:{w:0.35,f:500,sea:1,gulls:1},9:{w:0.35,f:600,birds:0.4},10:{w:0.5,f:180,crackle:1}
};
function ambTheme(){
  if(state==='menu')return 'map';
  if(state==='story'){const s=STORY.slides[STORY.i];return s&&s.bg!=null&&!s.img?s.bg:'story';}
  if(state==='win')return 'win';
  return G?LV[G.level].bg:'map';
}
function ambTick(){
  if(!AC)return;ambInit();if(!AMB.g)return;
  const T=AC.currentTime,th=ambTheme(),P=AMBT[th]||AMBT.map,on=SET.amb?1:0,quiet=(state==='play'&&G&&G.paused)?0.5:1;
  AMB.g.gain.setTargetAtTime(0.16*SET.vol*on*quiet,T,0.6);
  if(th!==AMB.theme){AMB.theme=th;AMB.wf.frequency.setTargetAtTime(P.f,T,1);AMB.sea.gain.setTargetAtTime(P.sea?0.5:0,T,1.5);}
  if(++AMB.t%40===0){ // the wind breathes: slow random swells, and gusts in the open places
    const g=P.w*(0.55+Math.random()*0.45)*(P.gust&&Math.random()<0.15?1.7:1);
    AMB.wind.gain.setTargetAtTime(g,T,1.2);
    if(P.sea)AMB.sf.frequency.setTargetAtTime(350+Math.random()*450,T,1.6),AMB.sea.gain.setTargetAtTime(0.25+0.45*(0.5+0.5*Math.sin(T*0.8)),T,1.4);
  }
  if(!on||frame<AMB.next)return;
  AMB.next=frame+60+Math.random()*240;
  const v=0.02*SET.vol;
  if(P.birds&&Math.random()<P.birds){const f=2200+Math.random()*1800,n=2+(Math.random()*3|0);for(let i=0;i<n;i++)setTimeout(()=>chirp(f*(0.9+Math.random()*0.25),v),i*(90+Math.random()*60));}
  if(P.gulls&&Math.random()<0.35)chirp(1400,v*0.8,0.35,-500);
  if(P.crickets){for(let i=0;i<6;i++)setTimeout(()=>beepAmb(4600,0.025,v*0.5),i*55);}
  if(P.drips&&Math.random()<0.6)chirp(900+Math.random()*700,v*1.2,0.08,-400);
  if(P.crackle){for(let i=0;i<3+(Math.random()*4|0);i++)setTimeout(()=>noise(0.02,v*1.5),i*(40+Math.random()*90));}
}
function chirp(f,v,d,slide){if(!AC)return;d=d||0.07;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type='sine';
  o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(80,f+(slide!=null?slide:f*0.35)),t+d);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(g);g.connect(AMB.g||AC.destination);o.start(t);o.stop(t+d+0.02);}
function beepAmb(f,d,v){chirp(f,v,d,0.01);}
