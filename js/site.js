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
/* Gamepad: stick/d-pad moves focus between buttons, A clicks, B goes back */
(function(){
  let prev={};
  function step(){
    try{const p=[...(navigator.getGamepads?navigator.getGamepads():[])].find(x=>x&&x.connected);
      if(p){const b=n=>!!(p.buttons[n]&&p.buttons[n].pressed),ay=p.axes[1]||0,ax=p.axes[0]||0;
        const s={up:ay<-0.5||b(12)||ax<-0.5||b(14),down:ay>0.5||b(13)||ax>0.5||b(15),a:b(0),back:b(1)};
        const els=[...document.querySelectorAll('.btn,.toggle,input[type=range]')].filter(x=>x.offsetParent);
        let i=els.indexOf(document.activeElement);
        if(s.down&&!prev.down){i=(i+1)%els.length;els[i]&&els[i].focus();}
        if(s.up&&!prev.up){i=i<=0?els.length-1:i-1;els[i]&&els[i].focus();}
        if(s.a&&!prev.a&&document.activeElement&&document.activeElement.click)document.activeElement.click();
        if(s.back&&!prev.back&&!document.body.dataset.home)go('index.html');
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
