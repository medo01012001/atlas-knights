'use strict';
/* Shared by every page: drawing helpers, font, settings, saved progress */
let ctx=null,frame=0;
const FONT='"Baloo Bhaijaan 2","Segoe UI",Tahoma,Arial,sans-serif';
try{if(document.fonts&&document.fonts.load){document.fonts.load('800 24px "Baloo Bhaijaan 2"');document.fonts.load('700 14px "Baloo Bhaijaan 2"');}}catch(e){}
const SET={vol:0.8,shake:1,diff:1};
try{Object.assign(SET,JSON.parse(localStorage.getItem('atlasSettings')||'{}'));}catch(e){}
function saveSet(){try{localStorage.setItem('atlasSettings',JSON.stringify(SET));}catch(e){}}
const DIFFS=[{name:'ساهلة',hp:0.75,dmg:0.7},{name:'عادية',hp:1,dmg:1},{name:'صعيبة',hp:1.3,dmg:1.3}];
function DIFF(){return DIFFS[SET.diff]||DIFFS[1];}
function loadFound(n){let F=[0];try{const v=JSON.parse(localStorage.getItem('atlasFound')||'[0]');if(Array.isArray(v))F=v.filter(i=>Number.isInteger(i)&&i>=0&&i<n);}catch(e){}if(!F.includes(0))F.unshift(0);return [...new Set(F)].sort((a,b)=>a-b);}
const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function srand(i){const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function rr(x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);ctx.fill();}
function rrS(x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);ctx.stroke();}
function circ(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function tri(a,b,c,d,e,f){ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.lineTo(e,f);ctx.closePath();ctx.fill();}
function ell(x,y,rx,ry){ctx.beginPath();ctx.ellipse(x,y,Math.max(0.1,rx),Math.max(0.1,ry),0,0,Math.PI*2);}
function setFont(size){ctx.font=(size>=22?'800 ':'700 ')+size+'px '+FONT;}
function tw(s,size){setFont(size);return ctx.measureText(s).width;}
/* stroke: false = none, a colour string = that outline colour, else dark outline */
/* align may be skipped: txt(s,x,y,size,col,'#outline') or txt(s,x,y,size,col,false) means centred text with that outline */
function txt(s,x,y,size,col,align,stroke){if(align===false||(typeof align==='string'&&!/^(left|right|center|start|end)$/.test(align))){stroke=align;align='center';}setFont(size);ctx.textAlign=align||'center';ctx.textBaseline='middle';if(stroke!==false){ctx.lineWidth=Math.max(3,size/5);ctx.strokeStyle=typeof stroke==='string'?stroke:'rgba(0,0,0,.8)';ctx.lineJoin='round';ctx.strokeText(s,x,y);}ctx.fillStyle=col;ctx.fillText(s,x,y);}
function star8(x,y,r,col){ctx.fillStyle=col;ctx.save();ctx.translate(x,y);for(let k=0;k<2;k++){ctx.rotate(Math.PI/4);ctx.fillRect(-r*0.7,-r*0.7,r*1.4,r*1.4);}ctx.restore();}
