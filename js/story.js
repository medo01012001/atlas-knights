'use strict';
/* ================= STORY =================
   The tale of the Great Book: an intro, one chapter each time you free a letter, the gate of the dark castle, and the ending.
   A slide: {w: speaker, text, cast?, fx?, bg?}
   w: a letter index | 'p' (player 1's letter) | 'n' (narrator) | 'd' (the Dark Lord) | 'h' (the Hamza) */
const STORY={slides:[],i:0,ch:0,t:0,done:null,title:'',cast:[],bg:0,voiced:false};

const MEET={ // what each letter says when you free it
  0:'الألف! كنت عارف بلي شي حد غادي يجي يفكني... يالاه نكملو الطريق مع بعض!',
  1:'شكرا! أنا النون... النقطة ديالي طاحت ليا ملي كنت كنهرب، ولكن رجعت لقيتها!',
  2:'أنا الطاء! العصا ديالي كانت مجمدة بالجليد ديال الظلام... دابا رجعات فيها النار.',
  3:'الصاد هنا! كنت كنحرس باب المدينة حتى غلبوني بالكثرة... ولكن هاد المرة ما غاديش نطيح.',
  4:'أنا الباء، الطبيب ديال الحروف. إلى تجرحتو فالطريق، أنا معاكم.',
  5:'العين! كنت كنشوف كلشي من فوق السور... وعيني عمرها ما كتغلط.',
  6:'أنا التاء! عندي جوج نقط فوق راسي... ونرميهم بجوج على جيش الظلام!',
  7:'الثاء هنا! ثلاث نقط، ثلاث ضربات... شكرا حيت فكيتيني.',
  8:'أنا الجيم، صبار بحال الجمل. حبسوني فالقفص ولكن ما عييتش... يالاه نمشيو!',
  9:'الحاء! كنت سخون بالغضب وأنا فالقفص... دابا غادي نحرق جيش الظلام.',
  10:'خفيف بحال الخيال... أنا الخاء! ما غادي يشوفوني حتى نكون حداهم.',
  11:'الدال هنا! صغير، صحيح؟ ولكن جرب تدفعني... غادي تشوف.',
  12:'أنا الذال، والنقطة ديالي من ذهب! كل عدو نطيحو كيعطيني عملة.',
  13:'الراء! بحال الريح ما كنبقاش فبلاصتي... وإلا جا الرعد، أنا اللي جبتو.',
  14:'الزاي هنا، كنحب الزوابع! اللي يقرب ليا كيدور على راسو.',
  15:'أنا السين، عندي ثلاث سنان بحال المنشار... والسيف ديالي ما كيرحمش.',
  16:'الشين! ثلاث نقط كيضويو بحال الشمس... الظلام ما كيحملش الضو ديالي.',
  17:'أنا الضاد! العربية كيسميوها «لغة الضاد» على قبلي... غادي نبقا معاكم حتى للخر.',
  18:'الظاء... كنت مخبي فالظل. دابا الظل ديالي غادي يخدم معاكم.',
  19:'الغين! حبسوني وأنا غضبان... وملي كنغضب، حتى حد ما كيوقفني.',
  20:'أنا الفاء، وقلبي كبير بحال الفيل! غادي نحط الفخوخ للظلام فالطريق.',
  21:'القاف هنا! كنضوي بحال القمر فالليل... والنقط ديالي كيدوزو من وسط الأعداء.',
  22:'الكاف! كنلعب بالكور بحال البهلوان... شوف كيفاش كتنقز من عدو لعدو!',
  23:'أنا اللام، طويل بحال السوط. اللي بعيد عليا، نجبدو لعندي.',
  24:'الميم! كنبني المنارات باش الحروف ما يتلفوش فالظلام.',
  25:'الهاء! فرحان بزاف حيت شفتكم... جبت ليكم الهدايا والقلوب.',
  26:'أنا الواو، أزرب حرف فالحروف! يالاه، شكون يسبقني؟',
  27:'الياء... آخر حرف فالحروف! دابا رجعنا كاملين، من الألف حتى للياء!'
};
/* what you learn about the Dark Lord, in the order you meet the letters (n = the new letter) */
const BEATS=[
  n=>[{w:n,text:'سمعت الحراس ديال الظلام كيتهامسو: سيد الظلام ماشي غول... هو حرف بحالنا!'},
      {w:'p',text:'حرف؟! وكيفاش شي حرف يدير هادشي فخوتو الحروف؟'}],
  n=>[{w:n,text:'شفتو فالمنام... صغير بزاف، وديما كيجلس فوق شي حرف آخر ولا تحتو.'},
      {w:'d',text:'كتقربو... ولكن عمركم ما توصلو لقلعتي!'}],
  n=>[{w:n,text:'فالمدينة كانو الشيوخ كيحكيو على حرف ما عندوش بلاصة فالكتاب الكبير... الناس نساوه.'},
      {w:'p',text:'حرف منسي...؟ يمكن هادا هو السر ديال كلشي.'}],
  n=>[{w:n,text:'لقيت هاد الورقة مقطوعة من الكتاب الكبير، مكتوب فيها: «كانت فوق الألف... وكانت كتعطيه الصوت».'},
      {w:0,text:'فوقي أنا؟! شكون هادي اللي كانت فوقي... وعلاش ما عاقلش عليها؟'}],
  n=>[{w:n,text:'شفت القلعة من فوق السور... فالقمة ديالها كاين ضو ذهبي. الدواية الذهبية تما!'},
      {w:'d',text:'تعالاو... راني كنتسناكم من شحال هادي.'}]
];
function storyIntro(){
  const none=[];
  return [
    {w:'n',cast:none,bg:0,img:'book',text:'فبلاد الأطلس، كانو الحروف عايشين فـ«الكتاب الكبير»... بيهم كتتكتب الحكايات، والأسماء، والأغاني.'},
    {w:'n',cast:none,bg:4,img:'theft',fx:'dark',text:'واحد الليلة، دخل خيال كحل للمكتبة... وسرق «الدواية الذهبية»، المداد اللي كيعطي الحياة للحروف.'},
    {w:'d',cast:none,bg:4,img:'theft',text:'من اليوم، حتى حرف ما غادي يتكتب! والبلاد كاملة غادي تنسى الكلام... ههههه!'},
    {w:'n',cast:none,bg:2,img:'scatter',text:'الحروف تفرقو فالبلدان العربية، من المغرب حتى لجزيرة العرب... وجيش الظلام حبسهم فالغابات والصحرا والجبال.'},
    {w:'n',cast:none,bg:8,img:'scatter',vid:'intro_4b',text:'وشي حروف طاروا حتى لبلدان بعيدة، فإفريقيا وآسيا... البلدان اللي وصلاتهم العربية مع الإسلام، حتى لإندونيسيا!'},
    {w:'p',bg:0,img:'dawn',vid:'intro_5',text:'آش وقع؟! الكتاب خاوي... وصحابي فين مشاو؟'},
    {w:'p',bg:0,img:'dawn',vid:'intro_6',text:'ما عنديش الاختيار. غادي نقلب عليهم واحد بواحد، ونرجع الدواية الذهبية من قلعة الظلام!'},
    {w:'n',bg:0,img:'dawn',vid:'intro_7',text:'وهكا بدات المغامرة... واللي غادي يوقع فاللخر، حتى واحد ما كان كيتسناه. ⚔'}
  ];
}
function storyMeet(i,k,place){
  const b=BEATS[Math.min(k,BEATS.length)-1];
  return withImg([{w:'n',text:'ف'+place+'، لقيتي حرف محبوس فقفص ديال الظلام... ضربتي القفل حتى تهرّس!'},{w:i,text:MEET[i]}].concat(b?b(i):[]),cageImg(place));
}
/* each land has its own picture of the broken cage (assets/story/cage_<stage>.jpg); the old shared one is the fallback */
function cageImg(place){const c=typeof COUNTRY!=='undefined'?COUNTRY.find(o=>o.c===place):null;return c&&c.pic!=null?'cage_'+c.pic:'cage';}
function storyGate(){
  return withImg([
    {w:'n',text:'قلعة الظلام... اللخر ديال الطريق. السما كحلة والريح باردة.'},
    {w:'p',text:'صحابي، كيفما وقع اليوم، غادي نرجعو الكتاب الكبير كامل!'},
    {w:'d',text:'مرحبا بيكم فداري يا الحروف... الليلة غادي تعرفو شكون أنا.'}
  ],'gate');
}
function storyEnding(){
  return withImg([
    {w:'n',fx:'dark',text:'سيد الظلام طاح... والدرع الكحل ديالو بدا كيتفرتك طرف بطرف.'},
    {w:'n',fx:'hamza',text:'ومن وسط الدخان، خرج حرف صغير بزاف... كيرعد بالخوف.'},
    {w:'h',text:'أنا... الهمزة.'},
    {w:'h',text:'ديما كنت كنجلس فوق الحروف ولا تحتهم... وحتى واحد ما عطاني بلاصة ديالي فالكتاب. حسيت براسي منسية.'},
    {w:'h',text:'قلت: إلى ما بغاونيش معاهم، حتى حرف ما غادي يتكتب!'},
    {w:'p',fx:'hamza',text:'سمحي لينا... ما كناش عارفين. ولكن الكتاب بلا بيك عمرو ما يكون كامل.'},
    {w:0,fx:'hamza',text:'أجي جلسي فوقي... ونوليو حرف واحد!'},
    {w:'n',fx:'unite',text:'الهمزة طلعات فوق الألف، وتكتب أول حرف فالكتاب الكبير: «أ»... ومنو رجعات الكلمات للبلاد.'},
    {w:'n',fx:'unite',text:'الدواية الذهبية رجعات تضوي، والحروف رجعو لدارهم... ومن داك النهار، حتى حرف ما بقا منسي. ✨ النهاية ✨'}
  ],'armor').map(sl=>sl.fx==='unite'?Object.assign(sl,{img:'unite'}):sl);
}

function withImg(slides,img){return slides.map(sl=>Object.assign({img},sl));}
/* scene pictures (assets/story/*.jpg, made with Google Flow); while one is missing the game draws its own background */
const STORY_IMG={};
function storyImg(k){
  if(!k)return null;
  let im=STORY_IMG[k];
  if(!im){im=STORY_IMG[k]=new Image();im.onerror=()=>{im.bad=true;};im.src='assets/story/'+k+'.jpg';}
  return im.complete&&!im.bad&&im.naturalWidth?im:null;
}
function drawCover(im,t){ // fill the screen, with a slow camera push-in
  const z=1.04+Math.min(1,t/600)*0.06,s=Math.max(W/im.naturalWidth,H/im.naturalHeight)*z,w=im.naturalWidth*s,h=im.naturalHeight*s;
  ctx.drawImage(im,(W-w)/2,(H-h)/2-t*0.02,w,h);
}

/* ---------- engine ---------- */
function playStory(slides,done,title){
  if(!slides||!slides.length){done&&done();return;}
  for(const sl of slides)storyImg(sl.img); // start loading the pictures
  preloadLines(slides); // and the recorded voices
  Object.assign(STORY,{slides,i:0,ch:0,t:0,done,title:title||'',cast:G?storyCast():[],bg:G?LV[G.level].bg:0});
  state='story';
}
/* who stands on the stage: the letters on the field, plus the newest one (the ending shows everybody) */
function storyCast(){const c=G.heroes.map(h=>h.idx),last=G.roster[G.roster.length-1];if(last&&!c.includes(last.idx))c.push(last.idx);return slidesAll()?G.roster.map(h=>h.idx):c.slice(0,6);}
function slidesAll(){return STORY.slides.some(sl=>sl.fx==='unite');}
function storyNext(){
  const s=STORY.slides[STORY.i];
  if(s&&STORY.ch<s.text.length){STORY.ch=s.text.length;return;}
  STORY.i++;STORY.ch=0;STORY.t=0;stopVoice();SFX.coin();
  if(STORY.i>=STORY.slides.length)storyEnd();
}
function storyEnd(){stopVoice();const d=STORY.done;STORY.done=null;STORY.slides=[];if(d)d();}
function updStory(){
  const s=STORY.slides[STORY.i];if(!s){storyEnd();return;}
  if(STORY.t===0){const w=spIdx(s.w);STORY.voiced=sayLine(s.text,w!=null?w:s.w);}
  STORY.t++;
  const before=Math.floor(STORY.ch);STORY.ch=Math.min(s.text.length,STORY.ch+0.85);
  if(!STORY.voiced&&Math.floor(STORY.ch)!==before&&before%3===0&&s.text[before]!==' '){const w=spIdx(s.w);babble(w!=null?w:s.w);}
  if(pressed.Enter||pressed.NumpadEnter||pressed.Space||tap(0,'a')||tap(1,'a'))storyNext();
  else if(pressed.Escape)storyEnd();
}
function spIdx(w){return w==='p'?(G&&G.roster[0]?G.roster[0].idx:0):(typeof w==='number'?w:null);}
function spName(w){const i=spIdx(w);return i!=null?HEROES[i].name:w==='d'?'سيد الظلام':w==='h'?'الهمزة':'';}
function wrapLines(s,maxW,size){setFont(size);const out=[];let cur='';for(const w of s.split(' ')){const t=cur?cur+' '+w:w;if(cur&&ctx.measureText(t).width>maxW){out.push(cur);cur=w;}else cur=t;}if(cur)out.push(cur);return out;}

/* ---------- drawing ---------- */
function drawHamza(x,y,sc,o){
  o=o||{};ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);
  ctx.font='800 160px '+FONT;ctx.direction='ltr';ctx.textAlign='left';ctx.textBaseline='alphabetic';
  const m=ctx.measureText('ء'),l=m.actualBoundingBoxLeft||0,r=m.actualBoundingBoxRight||60,a=m.actualBoundingBoxAscent||80,d=m.actualBoundingBoxDescent||0,gh=a+d;
  const dx=-(r-l)/2,dy=-d;
  ctx.lineJoin='round';ctx.lineWidth=12;ctx.strokeStyle=INK;ctx.strokeText('ء',dx,dy);
  ctx.fillStyle=vgrad(-gh,0,['#e6d2ff','#8a5ae0','#3e1d80']);ctx.fillText('ء',dx,dy);
  const ey=-gh*0.62;
  for(const s of [-9,9]){ctx.fillStyle='#fff';ell(s,ey,6,7.5);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=INK;circ(s+1,ey+1.5,3.2);}
  ctx.strokeStyle=INK;ctx.lineWidth=2.4;
  if(o.happy){ctx.beginPath();ctx.arc(0,ey+9,5,0.15*Math.PI,0.85*Math.PI);ctx.stroke();}
  else{for(const s of [-9,9]){ctx.beginPath();ctx.moveTo(s-6,ey-9+(s<0?-3:0));ctx.lineTo(s+6,ey-9+(s<0?0:-3));ctx.stroke();}
    ctx.beginPath();ctx.arc(0,ey+14,4.5,1.15*Math.PI,1.85*Math.PI);ctx.stroke();}
  ctx.restore();
}
function drawShadowLord(x,y){
  const t=frame*0.05;ctx.save();
  for(let k=0;k<8;k++){const a=k/8*Math.PI*2+t*0.5,r=52+Math.sin(t*2+k)*9,cx=x+Math.cos(a)*40,cy=y-120+Math.sin(a)*50;
    const g=ctx.createRadialGradient(cx,cy,2,cx,cy,r);g.addColorStop(0,'rgba(46,10,46,.9)');g.addColorStop(1,'rgba(20,4,24,0)');ctx.fillStyle=g;circ(cx,cy,r);}
  const g=ctx.createRadialGradient(x,y-120,10,x,y-120,96);g.addColorStop(0,'rgba(8,2,12,.97)');g.addColorStop(1,'rgba(8,2,12,0)');ctx.fillStyle=g;circ(x,y-120,96);
  ctx.shadowColor='#ff2a2a';ctx.shadowBlur=20;ctx.fillStyle='rgba(255,60,60,'+(0.75+0.25*Math.sin(t*3))+')';
  for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(x+s*40,y-136);ctx.lineTo(x+s*10,y-126);ctx.lineTo(x+s*36,y-118);ctx.closePath();ctx.fill();}
  ctx.restore();
}
function storyBadge(x,y,r,w){
  ctx.fillStyle=INK;circ(x,y,r+2.5);ctx.fillStyle=vgrad(y-r,y+r,w==='d'?FRAMES.red:FRAMES.steel);circ(x,y,r);
  const ir=r*0.86;ctx.fillStyle=INK;circ(x,y,ir+1.2);
  const g=ctx.createRadialGradient(x,y,1,x,y,ir);g.addColorStop(0,w==='d'?'#4a1030':w==='h'?'#5a3a9a':'#5a4a2a');g.addColorStop(1,'#0c0612');ctx.fillStyle=g;circ(x,y,ir);
  if(w==='d'){ctx.save();ctx.shadowColor='#f22';ctx.shadowBlur=10;ctx.fillStyle='#ff4040';for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(x+s*ir*0.55,y-ir*0.2);ctx.lineTo(x+s*ir*0.12,y-ir*0.05);ctx.lineTo(x+s*ir*0.5,y+ir*0.08);ctx.closePath();ctx.fill();}ctx.restore();}
  else if(w==='h'){ctx.save();ctx.beginPath();ctx.arc(x,y,ir,0,Math.PI*2);ctx.clip();drawHamza(x,y+ir*0.6,ir/62);ctx.restore();}
  else txt('📜',x,y+2,r*0.9,'#fff',false);
}
function drawUnite(){
  const cx=W/2,by=372;
  ctx.save();ctx.translate(cx,by-90);ctx.rotate(frame*0.004);ctx.fillStyle='rgba(255,220,120,.12)';
  for(let r=0;r<12;r++){ctx.rotate(Math.PI/6);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(W,-70);ctx.lineTo(W,70);ctx.closePath();ctx.fill();}ctx.restore();
  const g=ctx.createRadialGradient(cx,by-90,10,cx,by-90,170);g.addColorStop(0,'rgba(255,230,150,.55)');g.addColorStop(1,'rgba(255,230,150,0)');ctx.fillStyle=g;circ(cx,by-90,170);
  ctx.fillStyle='rgba(0,0,0,.3)';ell(cx,by,40,10);ctx.fill();
  drawLetter({i:0,x:cx,y:by,face:1,sc:1.5,walk:0,moving:false,atk:-1,flash:false,spinP:-1,cast:-1,hurt:0});
  const top=by-LET[0].top*1.5-6,drop=Math.max(0,70-STORY.t*2.2);
  drawHamza(cx-4,top-drop+Math.sin(frame*0.08)*2,0.42,{happy:true});
}
function drawStory(){
  const s=STORY.slides[STORY.i];if(!s)return;
  const im=storyImg(s.img);
  if(im)drawCover(im,STORY.t);else drawBG(s.bg!=null?s.bg:STORY.bg,STORY.t*0.25+STORY.i*160);
  ctx.fillStyle=vgrad(0,H,im?['rgba(8,6,20,.35)','rgba(8,6,20,0)','rgba(8,6,20,.8)']:['rgba(8,6,20,.55)','rgba(8,6,20,.2)','rgba(8,6,20,.85)']);ctx.fillRect(0,0,W,H);
  if(s.w==='d'||s.fx==='dark'){ctx.fillStyle='rgba(70,0,40,'+(0.25+0.08*Math.sin(frame*0.1))+')';ctx.fillRect(0,0,W,H);}
  vignette(0.6);
  hit(0,0,W,H,storyNext);
  if(STORY.title)ribbonFit(W/2,34,STORY.title,18,'#b8322a',260);
  const sp=spIdx(s.w),cast=s.cast||STORY.cast;
  if(s.fx==='unite'){
    drawUnite();
    const U=cast.filter(i=>i!==0),many=U.length>8; // all the letters around the Alef: two rows when there are many
    U.map((i,k)=>{const side=k%2?1:-1,j=Math.floor(k/2),back=many&&j%2===1,col=many?Math.floor(j/2):j;return {i,k,side,back,x:W/2+side*(many?150+col*46+(back?23:0):170+col*80),y:back?330:372};})
      .sort((a,b)=>a.y-b.y).forEach(o=>{const bob=Math.abs(Math.sin(frame*0.12+o.k))*12;
      drawLetter({i:o.i,x:o.x,y:o.y-bob,face:-o.side,sc:many?(o.back?0.55:0.64):0.85,walk:0,moving:false,atk:-1,flash:false,spinP:-1,cast:-1,hurt:0});});
  }else{
    const n=cast.length,gap=n>1?Math.min(95,(W*0.5-110)/(n-1)):0;
    cast.forEach((i,k)=>{
      const me=i===sp,x=110+k*gap,bob=me?Math.abs(Math.sin(frame*0.1))*6:0,atk=me&&STORY.t<16?STORY.t/16:-1;
      ctx.fillStyle='rgba(0,0,0,.3)';ell(x,372,26,7);ctx.fill();
      drawLetter({i,x,y:372-bob,face:1,sc:me?1.05:0.85,walk:0,moving:false,atk,flash:false,spinP:-1,cast:-1,hurt:0,alpha:me||sp==null?1:0.6});
    });
    if((s.w==='d'||s.fx==='dark')&&!(im&&s.img==='theft'))drawShadowLord(W-190,380); // the theft picture already shows him
    if(s.w==='h'||s.fx==='hamza')drawHamza(W-200,378+Math.sin(frame*0.1)*3,0.6);
  }
  // dialogue box
  const bx=30,bw=W-60,by=400,bh=126,hasPic=s.w!=='n';
  panel(bx,by,bw,bh,{r:16,frame:s.w==='d'?FRAMES.red:s.w==='n'?FRAMES.steel:s.w==='h'?FRAMES.blue:FRAMES.gold,top:s.w==='d'?'#2e0e1e':'#262a5a',bot:'#10112a'});
  if(sp!=null)medallion(bx+bw-58,by+bh/2+4,40,sp);else storyBadge(bx+bw-58,by+bh/2+4,38,s.w);
  if(hasPic)ribbonFit(bx+bw-150,by-2,spName(s.w),15,sp!=null?LET[sp].col:s.w==='d'?'#6a1a4a':'#5a3ab0',120);
  const right=bx+bw-118,maxW=right-(bx+34),lines=wrapLines(s.text,maxW,19);
  let left=Math.floor(STORY.ch);
  lines.forEach((ln,k)=>{if(left<=0)return;const part=ln.slice(0,left);left-=ln.length+1;
    txt(part,right,by+36+k*29,19,s.w==='n'?'#f3e6c4':'#ffffff','right',INK);});
  if(STORY.ch>=s.text.length&&Math.floor(frame/20)%2===0)txt('◀ كمل',bx+60,by+bh-20,14,'#ffd24a','center',INK);
  // progress dots
  const nS=STORY.slides.length;for(let k=0;k<nS;k++){ctx.fillStyle=INK;circ(W/2+((nS-1)/2-k)*14,by+bh-12,4.5);ctx.fillStyle=k===STORY.i?'#ffd24a':k<STORY.i?'#a08a50':'#3a3450';circ(W/2+((nS-1)/2-k)*14,by+bh-12,3);}
  btn(14,12,118,36,'تخطى ⏭',storyEnd,'dark',{size:15});
}
