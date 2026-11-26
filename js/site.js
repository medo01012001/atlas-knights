'use strict';
/* Shared by the HTML pages (home, letters, how-to, settings): sounds, page transitions, keyboard/gamepad navigation, letter portraits */
let _ac=null;
function uiSnd(f,d,slide){
  try{if(SET.vol<=0)return;_ac=_ac||new (window.AudioContext||window.webkitAudioContext)();
    const t=_ac.currentTime,o=_ac.createOscillator(),g=_ac.createGain();o.type='square';o.frequency.setValueAtTime(f,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(f+slide,t+d);g.gain.setValueAtTime(0.035*SET.vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
    o.connect(g);g.connect(_ac.destination);o.start(t);o.stop(t+d);}catch(e){}
}
const clickSnd=()=>uiSnd(700,0.1,300),hoverSnd=()=>uiSnd(1250,0.04,200);
function go(url){clickSnd();document.body.classList.add('leaving');setTimeout(()=>{location.href=url;},230);}
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href]');
  if(a&&!a.target&&/\.html(\?|$)/.test(a.getAttribute('href'))){e.preventDefault();go(a.getAttribute('href'));return;}
  if(e.target.closest('.btn'))clickSnd();
});
document.addEventListener('mouseover',e=>{const b=e.target.closest('.btn');if(b&&!b.contains(e.relatedTarget))hoverSnd();});
/* Esc (or gamepad B) = back to home */
addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.body.dataset.home){const m=document.querySelector('.modal:not(.hide)');if(m){m.classList.add('hide');return;}go('index.html');}});
/* Gamepad: stick/d-pad moves focus between buttons (by direction), A clicks, B goes back,
   left/right change a focused slider, the right stick scrolls, Start plays from home */
(function(){
  let prev={},rep={},used=false;
  const sel='.btn,.toggle,input[type=range]';
  function pick(dir){
    const els=[...document.querySelectorAll(sel)].filter(x=>x.offsetParent&&!x.closest('.modal.hide')),m=document.querySelector('.modal:not(.hide)');
    const list=m?els.filter(x=>m.contains(x)):els;if(!list.length)return;
    const c0=curEl();
    if(!list.includes(c0)){const ae=document.activeElement;focusEl(list.includes(ae)?ae:list[0]);return;}
    const cur=c0,r=cur.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let best=null,bs=1e9;
    for(const e of list){if(e===cur)continue;const q=e.getBoundingClientRect(),dx=q.left+q.width/2-cx,dy=q.top+q.height/2-cy;
      const main=dir==='up'?-dy:dir==='down'?dy:dir==='left'?-dx:dx,side=dir==='up'||dir==='down'?Math.abs(dx):Math.abs(dy);
      if(main<4)continue;const sc=main+side*2.2;if(sc<bs){bs=sc;best=e;}}
    if(!best){const i=list.indexOf(cur);best=dir==='up'||dir==='left'?list[(i+list.length-1)%list.length]:list[(i+1)%list.length];}
    focusEl(best);hoverSnd();
  }
  function curEl(){const pf=document.querySelector('.padfocus'),m=document.querySelector('.modal:not(.hide)');return pf&&pf.offsetParent&&(!m||m.contains(pf))?pf:document.activeElement;}
  function focusEl(e){document.querySelectorAll('.padfocus').forEach(x=>x.classList.remove('padfocus'));e.classList.add('padfocus');e.focus({preventScroll:true});e.scrollIntoView({block:'nearest',behavior:'smooth'});}
  function slide(e,d){const st=+e.step||1;e.value=Math.min(+e.max,Math.max(+e.min,+e.value+d*st));e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}
  addEventListener('mousemove',()=>{if(used){used=false;document.body.classList.remove('pad');}});
  function step(){
    try{const p=[...(navigator.getGamepads?navigator.getGamepads():[])].find(x=>x&&x.connected);
      if(p){const b=n=>!!(p.buttons[n]&&p.buttons[n].pressed),ay=p.axes[1]||0,ax=p.axes[0]||0,ry=p.axes[3]||0;
        const s={up:ay<-0.5||b(12),down:ay>0.5||b(13),left:ax<-0.5||b(14),right:ax>0.5||b(15),a:b(0),back:b(1)||b(8),start:b(9)};
        const now=performance.now();
        for(const d of ['up','down','left','right']){
          let fire=false;if(s[d]&&!prev[d]){fire=true;rep[d]=now+380;}else if(s[d]&&now>rep[d]){fire=true;rep[d]=now+120;}
          if(!fire)continue;
          if(!used){used=true;document.body.classList.add('pad');}
          const ae=curEl();
          if(ae&&ae.type==='range'&&(d==='left'||d==='right'))slide(ae,d==='right'?1:-1);else pick(d);
        }
        if(Math.abs(ry)>0.25)scrollBy(0,ry*14);
        if(s.a&&!prev.a){const ae=curEl();if(ae&&ae.matches&&ae.matches(sel)&&ae.click){used=true;document.body.classList.add('pad');ae.click();}}
        if(s.back&&!prev.back){const m=document.querySelector('.modal:not(.hide)');if(m)m.classList.add('hide');else if(!document.body.dataset.home)go('index.html');}
        if(s.start&&!prev.start&&document.body.dataset.home)go('game.html?mode=0');
        prev=s;}}catch(e){}
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
})();

/* Animated letter portrait on a <canvas>: draws with the same code as the game */
const PORTRAITS=[];
function portrait(cv,i,o){
  o=o||{};const P={cv,i,o,g:cv.getContext('2d'),hover:false,atkF:-99};
  cv.addEventListener('pointerenter',()=>{P.hover=true;});cv.addEventListener('pointerleave',()=>{P.hover=false;});
  cv.addEventListener('pointerdown',()=>{P.atkF=frame;uiSnd(420,0.1,-200);});
  PORTRAITS.push(P);return P;
}
function sizePortrait(P){
  const r=P.cv.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));
  if(P.cv.width!==w||P.cv.height!==h){P.cv.width=w;P.cv.height=h;}
  return [r.width,r.height,d];
}
function drawPortraits(){
  for(const P of PORTRAITS){
    const [w,h,d]=sizePortrait(P);if(!w)continue;
    ctx=P.g;ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);ctx.direction='rtl';
    const L=LET[P.i],sc=P.o.sc||Math.min(h*0.78/120,w/150),bx=w/2,by=h-(P.o.base||16);
    ctx.fillStyle='rgba(0,0,0,.3)';ell(bx,by,30*sc+10,8*sc+3);ctx.fill();
    const t=frame-P.atkF,auto=P.o.auto?((frame+P.i*37)%150):999;
    let atk=-1;if(t>=0&&t<16)atk=t/16;else if(P.hover&&frame%70<16)atk=(frame%70)/16;else if(auto<16)atk=auto/16;
    const walk=P.o.walk?frame*0.2:0;
    drawLetter({i:P.i,x:bx,y:by,face:P.o.face||1,sc:sc*0.92,walk,moving:!!P.o.walk,atk,flash:t>=0&&t<5,spinP:-1,cast:-1,hurt:0});
  }
}
function siteLoop(){frame++;drawPortraits();requestAnimationFrame(siteLoop);}
requestAnimationFrame(siteLoop);
const FOUND_LIST=loadFound(HEROES.length);
