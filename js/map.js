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
  {c:'الحبشة',lon:42.1,lat:9.3,ico:'🕌',lab:1,fact:'أول هجرة فالإسلام كانت للحبشة، ملي الصحابة مشاو عند النجاشي، الملك العادل. ومدينة هرر فيها أكثر من 80 مسجد.'},
  {c:'الصومال',lon:45.3,lat:2.0,ico:'🐪',lab:1,fact:'الصومال عندها أطول ساحل فإفريقيا كاملة، والعربية لغة رسمية فيها مع اللغة الصومالية.'},
  {c:'زنجبار',lon:39.2,lat:-6.2,ico:'🌴',lab:1,fact:'اللغة السواحيلية فيها بزاف ديال الكلمات جاية من العربية، بحال «كيتابو» (كتاب) و«صلا» (صلاة). وزنجبار مشهورة بالقرنفل والتوابل.'},
  {c:'تشاد',lon:15.0,lat:12.1,ico:'🏞',lab:-1,fact:'فتشاد العربية لغة رسمية مع الفرنسية، وبحيرة تشاد كانت من أكبر البحيرات فإفريقيا.'},
  {c:'نيجيريا',lon:8.5,lat:12.0,ico:'🌳',lab:1,fact:'فشمال نيجيريا، الناس كانو كيكتبو لغة الهوسا بالحروف العربية، وكيسميو هاد الكتابة «العجمي».'},
  {c:'مالي',lon:-3.0,lat:16.8,ico:'📚',lab:-1,fact:'فمدينة تمبكتو فمالي كاينين مئات الآلاف ديال المخطوطات القديمة مكتوبة بالعربية، فيها الطب والفلك والحساب.'},
  {c:'السنغال',lon:-16.4,lat:14.7,ico:'🌊',lab:1,fact:'فالسنغال كاين مسجد طوبى الكبير، والناس كانو كيكتبو لغة الولوف بالحروف العربية من مئات السنين.'},
  {c:'تركيا',lon:32.8,lat:39.9,ico:'🕌',lab:-1,fact:'اللغة التركية كانت كتتكتب بالحروف العربية حتى لعام 1928، وفإسطنبول كاين المسجد الأزرق المشهور.'},
  {c:'أذربيجان',lon:49.4,lat:40.4,ico:'🔥',lab:-1,dx:14,fact:'كيسميو أذربيجان «أرض النار»، حيت كاينين فيها نيران كتشعل بوحدها من الأرض بسبب الغاز اللي تحتها.'},
  {c:'إيران',lon:51.7,lat:32.6,ico:'🌹',lab:1,fact:'اللغة الفارسية كتتكتب بالحروف العربية، وزادو عليها أربعة ديال الحروف: پ چ ژ گ.'},
  {c:'أوزبكستان',lon:66.9,lat:39.6,ico:'🕌',lab:-1,fact:'سمرقند وبخارى كانو على طريق الحرير، ومن بخارى جا الإمام البخاري، وقريب منها تزاد ابن سينا اللي كتب كتاب كبير فالطب.'},
  {c:'أفغانستان',lon:69.2,lat:34.5,ico:'⛰',lab:1,fact:'فأفغانستان لغة البشتو ولغة الداري بجوج كيتكتبو بالحروف العربية.'},
  {c:'باكستان',lon:74.3,lat:31.5,ico:'🕌',lab:1,fact:'لغة الأردو فباكستان كتتكتب بالحروف العربية، وفمدينة لاهور كاين مسجد بادشاهي، من أكبر المساجد فالعالم.'},
  {c:'بنغلاديش',lon:90.4,lat:23.8,ico:'🚣',lab:-1,fact:'العاصمة دكا فبنغلاديش كيسميوها «مدينة المساجد» حيت فيها آلاف المساجد.'},
  {c:'المالديف',lon:73.5,lat:4.2,ico:'🏝',lab:1,fact:'المالديف فيها أكثر من 1000 جزيرة صغيرة، والكتابة ديالهم «الثانا» بعض الحروف ديالها جات من الأرقام العربية.'},
  {c:'ماليزيا',lon:101.7,lat:3.1,ico:'🌿',lab:-1,fact:'لغة الملايو كانت كتتكتب بالحروف العربية، وكيسميو هاد الكتابة «جاوي»، وباقا كتبان حتى لدابا فالمساجد والفلوس.'},
  {c:'إندونيسيا',lon:106.8,lat:-6.2,ico:'🌋',lab:-1,fact:'إندونيسيا هي أكبر بلد مسلم فالعالم بعدد الناس، والإسلام وصلها مع التجار اللي كانو كيسافرو فالبحر.'},
  {c:'الربع الخالي',lon:49.6,lat:20.4,ico:'🏰',lab:-1,v:11,pic:10,fact:'الربع الخالي فجزيرة العرب هو أكبر صحرا ديال الرمل المتصل فالعالم... وفوسطو تخبات قلعة الظلام!'}
];
COUNTRY.forEach((c,k)=>{if(k<10){c.v=k+1;c.pic=k;}}); // the first ten lands keep their recorded voice and cage picture

/* ---------- progress ---------- */
const PROG={cleared:0,gold:0,upg:null,intro:0,joins:{},gate:0,ending:0,team:[0]};
try{const v=JSON.parse(localStorage.getItem('atlasProg')||'null');if(v&&typeof v==='object')Object.assign(PROG,v);}catch(e){}
if(!PROG.lands){ // saves from the 11-land journey: the castle was land 11, now the journey goes on to 28
  if((PROG.cleared|0)>=11)PROG.cleared=10;
  if(PROG.joins)delete PROG.joins[10];
  PROG.lands=LV.length;
}
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
  const tc=menu.tcols||n;if(tap(0,'up')&&menu.tc>=tc)menu.tc-=tc;if(tap(0,'down')&&menu.tc+tc<n)menu.tc+=tc;
  if(tap(0,'a')||pressed.Space)teamToggle(FOUND[menu.tc]);
  if(tap(0,'k')){const k=team().indexOf(FOUND[menu.tc]);if(k>0)teamFront(k);}
  if(pressed.Escape||pressed.Enter||pressed.NumpadEnter||tap(0,'sw')||pressed.KeyT){menu.team=false;SFX.coin();}
}

/* ---------- the map ---------- */
/* simplified coastlines (lon, lat), from the Atlantic to Indonesia: the big one is Africa + Asia, LAND_OFF is Europe (not on our road) */
const LAND=[
  [[13,-12],[13.2,-9],[12.3,-6],[11.2,-3.9],[9.3,-1],[9.4,1],[9.8,3],[9,4],[8.5,4.5],[6,4.3],[5,5.6],[3,6.4],[1,6],[-1,5],[-2.5,4.9],[-5,5.1],[-7.5,4.4],[-9.5,5.4],[-11.5,6.9],[-13.2,8.5],[-13.6,9.5],[-15,10.8],[-16.7,12.4],[-17.5,14.7],[-16.6,16],[-16.3,19],
   [-17,21],[-15,24],[-13,27.5],[-10,29.5],[-9.8,31.5],[-8.5,33.3],[-6.5,34.5],[-5.9,35.8],
   [-2,35.1],[0,35.9],[3,36.8],[6,37],[9,37.3],[10.3,36.8],[11,35.5],[10,34.3],[10.5,33.5],[12,33],[15,32.3],[15.5,31],[19,30.3],[20,31.5],[20,32.5],[22,32.9],[25,31.7],[29,30.9],[32,31.3],[34.3,31.3],
   [34.9,32.5],[35.5,34],[36,35],[35.9,36.6],[36.2,36.9],[34.5,36.8],[32.5,36.1],[30.5,36.6],[29,36.6],[27.3,37],[26.5,38.4],[26.2,39.5],[26.5,40.3],[26,41],[26,47],
   [125,47],[121.5,40.5],[122,37],[120.5,34],[122,31],[121,28],[119.5,25.5],[117,23.5],[114,22.3],[111,21.5],[108.5,21.6],[106.5,20],[105.8,19],[106.5,17.5],[108.5,15.5],[109.3,12],[107.5,10.5],[105,8.6],[104.8,10.4],
   [103.5,10.5],[102.5,12.2],[100.9,13.4],[100,13],[99.2,10.5],[100.3,7],[101.3,6.9],[102.3,6.1],[103.4,4.8],[103.4,3],[104.2,1.4],[103.5,1.3],[102.5,2],[101.3,2.9],[100.6,4.3],[100.3,5.5],[100.1,6.5],[98.6,8],[98.3,9],[98.5,10.9],[98.6,13],[97.8,15],[97.5,16.5],
   [96.5,16.6],[95.4,15.7],[94.3,16],[94.6,18],[94,19.3],[92.4,20.7],[92,21.5],[91.8,22.4],[90.6,22],[89.5,21.8],[88,21.6],[86.9,20.7],[86.5,19.9],[85,19.2],[84,18],[82.3,16.7],[81.2,15.9],[80.3,15.5],[80.1,13],[79.8,11],[79.3,10.2],[78.2,8.9],[77.5,8.1],
   [76.5,8.9],[75.9,11],[74.8,12.9],[74.1,15],[73.4,16.5],[72.8,19],[72.8,21],[72.5,21.8],[70.4,20.9],[69,22.4],[68.4,23.6],[67.4,24.2],[66.6,25.4],[64.5,25.2],
   [61.5,25.2],[58.8,25.6],[57.3,25.8],[56.4,27.1],[54.5,26.6],[52,27.8],[50.8,28.9],[50.1,30.1],[48.8,30.2],[48,29.6],[48.5,28.2],[49.6,26.9],[50.2,26],[50.8,25.4],[50.8,24.8],[51.3,26.1],[51.6,25.3],[51.6,24.6],[52,24],[53.5,24.1],[54.6,24.3],[55.6,25.4],[56.1,26.2],[56.4,24.8],[57.2,23.9],[58.6,23.6],[59.8,22.5],[59.3,21.3],[58.5,20.4],[57.8,19],[56.6,18.4],[55.3,17.6],[54,16.9],[52.2,15.7],[50,15],[48,14],[45,13],[43.5,12.7],
   [42.8,14.8],[42.6,16.5],[41.5,18.5],[40,20.5],[39.1,21.5],[38.3,23.8],[37.2,25],[35.6,27.6],[34.8,28.8],[34.9,29.5],[34.25,27.75],[32.6,29.9],[33,28.2],[34.2,26.3],[35.5,24],[37.2,21],[37.4,18.8],[38.6,18],[39.7,15.4],[41.6,13.5],[43.3,11.6],[44.6,10.4],[47,11.1],[51.2,11.8],[51,10],[49.5,7],[48,4.5],[46,2],[43,0],
   [41.5,-1.7],[40.2,-2.8],[39.3,-4.6],[39,-6.5],[39.5,-8],[39.7,-10],[40.3,-12]],
  [[79.9,9.8],[80.8,9.3],[81.9,7.5],[81.6,6.4],[80.6,5.9],[80,6.6],[79.7,8.2]],
  [[95.3,5.6],[97.5,5.2],[100.4,2.2],[103.8,-1],[106,-3],[105.8,-5.8],[104.5,-5.9],[102.3,-4],[101,-2.2],[99,0.2],[98.6,1.7],[97,3.2]],
  [[105.2,-6.8],[106,-5.9],[108.3,-6.2],[110.4,-6.9],[112.6,-6.9],[114.4,-7.7],[114.6,-8.7],[112,-8.3],[110,-8.1],[108,-7.7],[106.4,-7.4]],
  [[109,1.5],[109.6,-1],[110.2,-3],[114.6,-4.1],[116.5,-3],[116,-1],[117.9,1],[118.9,5],[117.2,7],[115.3,5],[113,3.2],[111.3,2.3]],
  [[108.6,19.2],[110,20.1],[111,19.6],[110.3,18.4],[109.2,18.3]],
  [[39.2,-5.7],[39.5,-5.9],[39.5,-6.5],[39.3,-6.4]]
];
const LAND_OFF=[
  [[-2,47],[-1.2,45.5],[-1.8,43.4],[-8,43.7],[-9.3,43.2],[-8.8,40],[-9.4,38.8],[-8.8,37],[-7.4,37.2],[-6.3,36.8],[-5.6,36],[-4.4,36.7],[-2.1,36.7],[-0.7,37.6],[0.2,38.8],[-0.3,39.5],[0.9,41],[3.2,42],[3.1,43],[4,43.5],[6,43.1],[7.5,43.8],[8.8,44.4],[10.2,43.9],
   [10.5,42.9],[11.1,42.4],[12.5,41.4],[14,40.8],[15.6,40],[15.6,38.2],[16.1,38],[16.6,39],[17.2,39.4],[16.6,40.2],[18.5,40.1],[17,41],[16,41.9],[14,42.6],[13.6,43.6],[12.3,44.4],[12.4,45.4],[13.7,45.6],[14.5,45.2],[15.5,43.9],[17.5,43],[19.4,42],[19.4,40.4],[20.2,39.6],[21.1,38.3],
   [21.7,36.8],[22.6,36.4],[23.2,37.3],[23.9,38],[22.8,39.5],[22.6,40.5],[23.9,40.3],[26,40.8],[26,47]],
  [[12.4,38.1],[15.6,38.3],[15.1,36.7]],
  [[8.4,41],[9.8,41],[9.6,39.1],[8.4,39]],
  [[23.5,35.5],[26.3,35.2],[24,35.1]],
  [[32.3,35.1],[33,35.4],[34.5,35.6],[33.9,34.9],[33,34.6]]
];
const WATER=[ // seas and lakes inside the land
  [[49,47],[49,44.5],[50.3,43],[49.5,41],[49.2,39.1],[48.9,38],[49.5,37.4],[51,36.7],[53.9,36.9],[53.9,38.9],[53.2,39.3],[53,40.6],[52.6,42.2],[52,44],[53,46],[52,47]],
  [[28,41.5],[29,41.2],[31,41.1],[33,42],[35,42],[36.5,41.3],[38,41],[40,41],[41.5,41.6],[41.6,42.6],[40,43.5],[38,44.5],[37,45.2],[34,44.5],[33,44.9],[32,46],[30.5,46.5],[29.7,45.3],[28.6,44],[27.7,42.6]],
  [[31.8,-1],[33,0.3],[34,-0.3],[33.8,-2.5],[32.5,-2.8],[31.6,-1.8]],
  [[13.6,13.6],[14.6,13.9],[15,13],[14.2,12.6]]
];
const RIVERS=[
  [[31.2,30.4],[31.3,27.5],[32.7,25.7],[32.9,24],[31.5,22],[30.5,19.5],[32.5,15.6],[32.6,12],[33,9.5]],
  [[38.2,36.6],[40.2,35],[43.3,32.6],[46.4,31],[48,30.4]],
  [[-10.5,10.5],[-8,12.5],[-5,14.5],[-3,16.8],[0,16.5],[1.5,13.5],[3.5,11.5],[5.5,9],[6.5,6],[6.3,4.5]],
  [[73,35.5],[72,33],[71,30],[69,27],[68,25],[67.6,24.2]],
  [[78,30],[80,27],[83,25.5],[86,25.3],[88,24],[90.5,22.8]]
];
const WB={lon0:-20,lon1:118,lat0:44,lat1:-11}; // the edges of the whole world map
let MP={x:0,y:0,s:1},MCAM=null;
function mapXY(lon,lat){return [MP.x+(lon-WB.lon0)*MP.s,MP.y+(WB.lat0-lat)*MP.s*1.12];}
function mapPath(pts,close){ctx.beginPath();pts.forEach(([lo,la],k)=>{const [x,y]=mapXY(lo,la);k?ctx.lineTo(x,y):ctx.moveTo(x,y);});if(close!==false)ctx.closePath();}
/* the whole world is painted once into its own picture, then the map window slides over it */
function worldPic(s){
  const k=cv.width/W,id='world|'+s.toFixed(2)+'|'+cv.width;
  let c=_layers[id];
  if(!c){
    const ww=(WB.lon1-WB.lon0)*s,wh=(WB.lat0-WB.lat1)*s*1.12;
    c=document.createElement('canvas');c.width=Math.ceil(ww*k);c.height=Math.ceil(wh*k);
    const g=c.getContext('2d'),old=ctx,oldMP=MP;ctx=g;g.setTransform(k,0,0,k,0,0);g.direction='rtl';MP={x:0,y:0,s};
    try{paintWorld(ww,wh,s);}finally{ctx=old;MP=oldMP;}
    if(++_layerN>60){_layers={};_layerN=1;}
    _layers[id]=c;
  }
  return c;
}
function paintWorld(w,h,s){
  ctx.fillStyle=vgrad(0,h,['#3d86b4','#2a6a96','#1f557c']);ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='rgba(255,255,255,.13)';ctx.lineWidth=1.5;
  for(let k=0;k<170;k++){const wx=srand(k*3.1)*w,wy=srand(k*7.7)*h;ctx.beginPath();ctx.moveTo(wx-8,wy);ctx.quadraticCurveTo(wx,wy-4,wx+8,wy);ctx.stroke();}
  const all=LAND.concat(LAND_OFF);
  ctx.save();ctx.translate(2,4);ctx.fillStyle='rgba(0,0,0,.25)';for(const p of all){mapPath(p);ctx.fill();}ctx.restore();
  ctx.strokeStyle='rgba(190,235,255,.35)';ctx.lineWidth=7;for(const p of all){mapPath(p);ctx.stroke();}
  const sand=vgrad(0,h,['#f2dcaa','#e6c487','#d7aa66']);
  for(const p of all){mapPath(p);ctx.fillStyle=sand;ctx.fill();ctx.strokeStyle='#7a5222';ctx.lineWidth=2;ctx.stroke();}
  for(const p of LAND_OFF){mapPath(p);ctx.fillStyle='rgba(60,40,70,.28)';ctx.fill();} // Europe: not on our road
  // green lands near the equator (forests of Africa and Asia)
  ctx.save();mapPath(LAND[0]);ctx.clip();ctx.fillStyle='rgba(90,150,60,.22)';
  for(const [lo,la,r] of [[-8,8,5],[8,6,6],[22,2,9],[30,-6,7],[100,10,7],[104,20,6],[90,25,4],[84,27,3]]){const [cx,cy]=mapXY(lo,la);ell(cx,cy,r*s,r*s*0.8);ctx.fill();}
  ctx.restore();
  ctx.save();ctx.fillStyle='rgba(90,150,60,.22)';for(const p of LAND.slice(2,5)){mapPath(p);ctx.fill();}ctx.restore();
  for(const p of WATER){mapPath(p);ctx.fillStyle='#2f77a6';ctx.fill();ctx.strokeStyle='#7a5222';ctx.lineWidth=2;ctx.stroke();}
  ctx.strokeStyle='#3a8cc0';ctx.lineWidth=2.4;ctx.lineJoin='round';for(const r of RIVERS){mapPath(r,false);ctx.stroke();}
  // decorations: mountains, dunes, palms, little islands
  const mt=(lo,la,sz)=>{const [mx,my]=mapXY(lo,la);ctx.fillStyle='#9a7448';tri(mx-sz,my,mx,my-sz*1.2,mx+sz,my);ctx.fillStyle='#fff6e0';tri(mx-sz*0.35,my-sz*0.78,mx,my-sz*1.2,mx+sz*0.35,my-sz*0.78);};
  const dune=(lo,la)=>{const [dx,dy]=mapXY(lo,la);ctx.strokeStyle='rgba(150,100,40,.55)';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(dx,dy+6,9,Math.PI*1.15,Math.PI*1.85);ctx.stroke();ctx.beginPath();ctx.arc(dx+10,dy+9,7,Math.PI*1.15,Math.PI*1.85);ctx.stroke();};
  const palm=(lo,la)=>{const [px,py]=mapXY(lo,la);ctx.strokeStyle='#7a5222';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,py);ctx.quadraticCurveTo(px+2,py-6,px,py-11);ctx.stroke();ctx.fillStyle='#4f8a3a';for(const a of [-2.6,-1.9,-1.2,-0.5])ell(px+Math.cos(a)*5,py-11+Math.sin(a)*2.5,5,1.8),ctx.fill();};
  for(const [lo,la,k] of [[-7,31,0.9],[-4.5,32.4,0.75],[-2.6,31.8,0.6],[5,36,0.55],[8.8,23.6,0.7],[36.2,34.4,0.5],[44,17,0.6],[57.4,23.3,0.5],[38.5,10.5,0.8],[40,8.5,0.6],[44,42.6,0.7],[47,41.6,0.55],[50,32,0.6],[53,29.5,0.5],
    [70,35.6,0.8],[73,36.2,0.7],[78,32.5,0.8],[82,30.5,0.9],[86,28.6,0.9],[90,28.4,0.7],[59,37.5,0.5],[35,38.5,0.5],[40,39.5,0.6],[112.5,-7.6,0.45],[101,0.5,0.45]])mt(lo,la,s*k);
  for(const [lo,la] of [[-2,25],[6,30],[11,22],[22,25],[25,20],[42,25],[52,22],[54,19.4],[46.5,21],[13,28],[-2,20],[5,18],[18,18],[-10,22],[30,20],[60,40.5],[64,42],[71,27]])dune(lo,la);
  for(const [lo,la] of [[30.8,28.5],[32.2,24.5],[25.6,29.2],[10.2,31.5],[-5,29.2],[44.4,30.4],[39,-4.8],[45,3.5],[-16,14],[101.6,4],[106.5,-6.5],[90.3,23],[8,10.5],[-3.5,16]])palm(lo,la);
  ctx.fillStyle='#e6c487';ctx.strokeStyle='#7a5222';ctx.lineWidth=1.2;for(const [lo,la] of [[73.3,6.6],[73.5,5.2],[73.2,4],[73.5,2.6],[73.1,1],[72.8,-0.6]]){const [ix,iy]=mapXY(lo,la);circ(ix,iy,2.6);ctx.stroke();}
  // sea names
  ctx.globalAlpha=0.7;
  for(const [n,lo,la,sz] of [['المحيط الأطلسي',-13,19,11],['البحر الأبيض المتوسط',19,34.6,11],['بحر العرب',62,14.5,11],['المحيط الهندي',72,-5,12],['خليج البنغال',88.5,15,10],['البحر الأسود',34.5,43.3,10],['خليج غينيا',3,2.5,10]])
    txt(n,...mapXY(lo,la),sz,'#d6efff','center',false);
  ctx.save();ctx.translate(...mapXY(38.6,21));ctx.rotate(1.0);txt('البحر الأحمر',0,0,10,'#d6efff','center',false);ctx.restore();
  ctx.globalAlpha=1;
}
function drawMap(x,y,w,h){
  const s=Math.round(w/58*4)/4,vw=w/s,vh=h/(s*1.12),C=COUNTRY[menu.sel]; // about 58° of the world at once: the window follows the land you pick
  const tx=clamp(C.lon,WB.lon0+vw/2,WB.lon1-vw/2),ty=clamp(C.lat,WB.lat1+vh/2,WB.lat0-vh/2);
  if(!MCAM||MCAM.s!==s)MCAM={lon:tx,lat:ty,s};
  MCAM.lon+=(tx-MCAM.lon)*0.12;MCAM.lat+=(ty-MCAM.lat)*0.12;
  MP={s,x:x+w/2-(MCAM.lon-WB.lon0)*s,y:y+h/2-(WB.lat0-MCAM.lat)*s*1.12};
  const pic=worldPic(s);
  ctx.save();rp(x,y,w,h,10);ctx.clip();
  ctx.drawImage(pic,MP.x,MP.y,(WB.lon1-WB.lon0)*s,(WB.lat0-WB.lat1)*s*1.12);
  // the road between the lands
  const P=COUNTRY.map(o=>mapXY(o.lon,o.lat)),inView=([px,py],m)=>px>x-m&&px<x+w+m&&py>y-m&&py<y+h+m;
  for(let k=0;k<P.length-1;k++){
    const [ax,ay]=P[k],[bx,by]=P[k+1],done=k+1<=PROG.cleared,L=Math.hypot(bx-ax,by-ay),mx=(ax+bx)/2,my=(ay+by)/2-Math.min(70,L*0.18);
    const far=Math.hypot(COUNTRY[k+1].lon-COUNTRY[k].lon,COUNTRY[k+1].lat-COUNTRY[k].lat)>25; // long trips (across the sea) stay faint unless you stand on them
    ctx.globalAlpha=far&&menu.sel!==k&&menu.sel!==k+1?0.3:1;
    ctx.setLineDash(done?[]:[6,6]);ctx.lineDashOffset=-frame*0.4;ctx.lineCap='round';
    ctx.strokeStyle=INK;ctx.lineWidth=done?6:4.5;ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo(mx,my,bx,by);ctx.stroke();
    ctx.strokeStyle=done?'#ffd24a':'rgba(255,248,220,.75)';ctx.lineWidth=done?3:2;ctx.stroke();
  }
  ctx.globalAlpha=1;ctx.setLineDash([]);
  // the land nodes
  COUNTRY.forEach((o,k)=>{
    const [nx,ny]=P[k];if(!inView(P[k],60))return;
    const sel=menu.sel===k,open=unlocked(k),done=k<PROG.cleared,cur=open&&!done,r=sel?14:11,boss=k===LV.length-1;
    if(sel){ctx.fillStyle='rgba(255,220,90,'+(0.25+0.15*Math.sin(frame*0.12))+')';circ(nx,ny,r+10);}
    ctx.fillStyle=INK;circ(nx,ny,r+3);
    ctx.fillStyle=vgrad(ny-r,ny+r,done?FRAMES.green:cur?FRAMES.gold:boss?FRAMES.red:FRAMES.steel);circ(nx,ny,r);
    txt(open?(done?'✓':''+(k+1)):'🔒',nx,ny+1,open?(sel?15:12):(sel?12:10),'#fff',INK);
    const ly=ny+o.lab*(r+12),lx=nx+(o.dx||0);
    txt(o.c,lx,ly,sel?14:12,sel?'#ffe680':(open?'#ffffff':'#c8c4d8'),'center',INK);
    if(nx>x+r&&nx<x+w-r&&ny>y+r&&ny<y+h-r)hit(nx-r-4,ny-r-4,2*r+8,2*r+8,()=>{if(menu.sel!==k){menu.sel=k;SFX.coin();}else startStage(k);});
  });
  // your leader stands on the chosen land
  {const [nx,ny]=P[menu.sel],i=team()[0],bob=Math.abs(Math.sin(frame*0.1))*5;
    ctx.fillStyle='rgba(0,0,0,.3)';ell(nx,ny-15,10,3);ctx.fill();drawHeroLook(i,nx,ny-16-bob,1,0.42,{});}
  // compass
  {const cx=x+30,cy=y+h-52,r=s*2.2;star8(cx,cy,r,'rgba(255,240,200,.8)');ctx.fillStyle='#b8322a';tri(cx-r*0.28,cy,cx,cy-r*1.25,cx+r*0.28,cy);ctx.fillStyle='#f2dcaa';tri(cx-r*0.28,cy,cx,cy+r*1.25,cx+r*0.28,cy);txt('ش',cx,cy-r*1.6,11,'#fff','center');}
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
  ribbonFit(W/2,30,'🗺 رحلة الحروف عبر العالم',20,'#b8322a',320);
  pill(W-90,29,'🏆 '+PROG.cleared+' من '+LV.length,'#3a3f78',14);
  const LW=Math.min(270,Math.max(230,W*0.24)),top=62,mh=300;
  // stage list (right)
  const lx=W-LW-14;panel(lx,top,LW,mh,{frame:FRAMES.gold,r:14});
  txt('المراحل',lx+LW/2,top+20,16,'#ffd24a');
  const rh=23.6,VR=11,k0=clamp(menu.sel-5,0,LV.length-VR); // 11 rows at a time: the list follows the selected land
  if(k0>0)txt('▲',lx+22,top+20,12,'#ffd24a','center',false);
  if(k0+VR<LV.length)txt('▼',lx+22,top+mh-10,12,'#ffd24a','center',false);
  for(let k=k0;k<k0+VR;k++){
    const ry=top+34+(k-k0)*rh,rx=lx+10,rw=LW-20,sel=menu.sel===k,open=unlocked(k),done=k<PROG.cleared,hv=overBox(rx,ry,rw,rh-2);
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
  const n=FOUND.length,cols=n>7?Math.min(14,Math.ceil(n/Math.ceil(n/14))):n,rows=Math.ceil(n/cols),big=n<=7,pw=big?Math.max(520,n*136+60):W-40,ph=408,px=W/2-pw/2,py=H/2-ph/2+8;
  const gap=big?12:6,cw=big?124:Math.min(124,Math.floor((pw-40)/cols)-gap),chh=big?130:(rows>1?74:120);menu.tcols=cols;
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
  const row0=py+(big?190:166);
  FOUND.forEach((i,k)=>{
    const c=k%cols,rw=Math.floor(k/cols),inRow=Math.min(cols,n-rw*cols),row=row0+rw*(chh+6);
    const x=W/2+((inRow-1)/2-c)*(cw+gap)-cw/2,inT=t.indexOf(i),sel=menu.tc===k,hv=overBox(x,row,cw,chh);
    panel(x,row-(hv?2:0),cw,chh,{frame:inT>=0?(inT===0?FRAMES.blue:FRAMES.green):FRAMES.steel,r:big?12:9,noCorners:true});
    if(sel){ctx.strokeStyle='#fff';ctx.lineWidth=2.5;rp(x-4,row-4,cw+8,chh+8,12);ctx.stroke();}
    if(big){medallion(x+cw/2,row+40,26,i,{dim:inT<0});txt(HEROES[i].name,x+cw/2,row+80,15,'#fff');
      pill(x+cw/2,row+106,inT>=0?(inT===0?'⭐ القائد':'✓ فالفريق'):'احتياط',inT>=0?(inT===0?'#2f6fd0':'#2f8a2a'):'#5a5e80',10);}
    else{const r=Math.min(22,cw*0.36);medallion(x+cw/2,row+6+r,r,i,{dim:inT<0});txt(HEROES[i].name,x+cw/2,row+chh-13,cw<64?11:13,'#fff');
      if(inT>=0)txt(inT===0?'⭐':'✓',x+cw-9,row+10,11,inT===0?'#9cc8ff':'#7dff6a','center',INK);}
    hit(x,row,cw,chh,()=>{menu.tc=k;teamToggle(i);});
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
