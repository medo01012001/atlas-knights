'use strict';
/* ================= POWERS of the 22 font letters =================
   Each letter in js/data.js names its attack (atk), its trait (pk) and two skills (k / l: fx + numbers in o).
   The six first letters keep their own hand-written code in game.js; everything here is shared and data-driven. */
const onScr=e=>e.x>G.cam-20&&e.x<G.cam+W+20;
function powHas(pk){return !!G&&G.heroes.some(o=>!o.down&&o.def.pk===pk);}
function powHeal(o,amt){if(o.down)return;const mh=hMax(o),a=Math.min(mh-o.hp,Math.round(amt));if(a>0){o.hp+=a;part(o.x,o.y,60,'#9dffb0',4,1.5,4,26);}}
function powEff(e,eff,d){
  if(!eff||e.dead)return;
  if(eff==='slow')e.slow=Math.max(e.slow||0,220);
  else if(eff==='stun')e.stun=Math.max(e.stun,e.isBoss?18:70);
  else if(eff==='root')e.stun=Math.max(e.stun,e.isBoss?25:140);
  else if(eff==='burn'){e.burn=150;e.burnD=Math.max(1,d*0.15);}
}
/* extra damage: the Daad's aura (+15% near him) and the Ghain's rage (+30%) */
function powDmgMul(h){
  if(!G||!G.heroes)return 1;
  let m=h.rageT>0?1.3:1;
  if(G.heroes.some(o=>!o.down&&o.def.pk==='aura'&&Math.abs(o.x-h.x)<240&&Math.abs(o.y-h.y)<130))m*=1.15;
  return m;
}
/* traits that change the hits a letter takes: returns the new damage (0 = dodged) */
function powHurt(h,dmg){
  const pk=h.def.pk;
  if(pk==='dodge'&&Math.random()<0.2){addText(h.x,h.y,100,'هرب!','#b8a8ff');h.inv=12;return 0;}
  if(pk==='tough')dmg*=0.8;
  return dmg;
}

/* ---------- the normal attack ---------- */
function powAttack(h,d){
  const D=h.def,a=D.atk||{t:'slash'},L=LET[h.idx];
  if(D.pk==='berserk')d*=1+(1-h.hp/hMax(h))*0.8;
  if(h.rageT>0)h.cdA=Math.round(D.atkCd*0.55);
  if(a.t==='slash'){
    SFX.swing();
    const crit=D.pk==='crit'&&Math.random()<0.2,kb=D.pk==='knock'?15:5,w=D.pk==='wide'?58:32;let dealt=0;
    for(const e of G.enemies){
      if(e.dead)continue;
      const dx=(e.x-h.x)*h.face,er=e.isBoss?40:0;
      if(dx>-18&&dx<D.range+er&&Math.abs(e.y-h.y)<w+(e.isBoss?22:0)){
        let dd=d*(crit?2:1);
        if(D.pk==='opener'){const t=e.tagged||(e.tagged={});if(!t[h.idx]){t[h.idx]=1;dd*=2;addText(e.x,e.y,105,'x2',L.light);}}
        hurtEnemy(e,dd,h.face,kb);dealt+=dd;
      }
    }
    if(dealt&&crit){addText(h.x,h.y,115,'حرجة!','#ff6b6b');G.shake=Math.max(G.shake,3);}
    if(dealt&&D.pk==='leech')powHeal(h,dealt*0.12);
    G.fx.push({t:'slash',x:h.x+h.face*30,y:h.y,face:h.face,r:D.range>100?62:(w>40?50:42),col:crit?'#ff6b6b':L.light,life:9,max:9});
  }else if(a.t==='fire'){
    SFX.fire();G.proj.push({type:'fire',own:1,burn:true,x:h.x+h.face*26,y:h.y,z:70,vx:h.face*8,vy:0,dmg:d,life:70,r:12});
  }else{
    SFX.arrow();h.shots=(h.shots||0)+1;
    const n=a.n||1,st=D.pk==='stun3'&&h.shots%3===0?50:0;
    for(let k=0;k<n;k++){const vy=(k-(n-1)/2)*1.5;
      G.proj.push({type:'arrow',own:1,col:st?'#ffe066':(a.col||L.col),x:h.x+h.face*22,y:h.y+vy*4,z:56,vx:h.face*12,vy,dmg:d,life:60,r:10,pierce:!!a.pierce,bounce:a.bounce|0,seek:!!a.seek,stun:st});}
  }
}

/* ---------- the two skills: returns false when there was nothing to use it on ---------- */
function powSkill(h,s,d0){
  const o=s.o||{},L=LET[h.idx],d=d0*(o.m||1),f=h.face,col=o.col||L.light;
  h.atkT=16;h.atkMax=16;
  switch(s.fx){
    case 'nova':areaHit(h.x,h.y,o.r,d,6,e=>powEff(e,o.eff,d));ring(h.x,h.y,o.r,col,24);part(h.x,h.y,30,col,22,5,5,32);if(o.r>180)G.shake=Math.max(G.shake,6);SFX.boom();break;
    case 'blast':{const bx=h.x+f*o.dx;areaHit(bx,h.y,o.r,d,o.kb||8,e=>powEff(e,o.eff,d));ring(bx,h.y,o.r,col,18);part(bx,h.y,40,col,16,4,5,24);
      G.fx.push({t:'slash',x:h.x+f*40,y:h.y,face:f,r:66,col,life:12,max:12});G.shake=Math.max(G.shake,6);SFX.boom();break;}
    case 'spin':h.spinT=h.spinMax=36;h.atkT=0;areaHit(h.x,h.y,o.r,d,10);ring(h.x,h.y,o.r,col,18);part(h.x,h.y,40,col,14,4,4,20);break;
    case 'dash':h.dashT=o.t||16;h.inv=Math.max(h.inv,(o.t||16)+8);h.dashSet=new Set();h.dashM=o.m;h.atkT=0;break;
    case 'leap':h.leapT=h.leapMax=30;h.inv=Math.max(h.inv,32);h.leapM=o.m;break;
    case 'volley':for(let k=0;k<o.n;k++){const vy=(k-(o.n-1)/2)*1.4;
      G.proj.push({type:'arrow',own:1,col:o.col||L.col,x:h.x+f*22,y:h.y,z:50,vx:f*13,vy,dmg:d,life:70,r:11,pierce:!!o.pierce,seek:!!o.seek});}SFX.arrow();break;
    case 'wave':G.proj.push({type:'wave',own:1,x:h.x+f*30,y:h.y,z:o.ball?14:30,vx:f*(o.big?7:9),vy:0,dmg:d,life:o.big?95:70,r:o.big?46:30,pierce:true,eff:o.eff,kb:o.kb||4,col,ball:!!o.ball,big:!!o.big});SFX.skill();break;
    case 'breath':for(let k=0;k<o.n;k++)G.proj.push({type:'flame',own:1,x:h.x+f*26,y:h.y+rnd(-6,6),z:60,vx:f*rnd(7,10),vy:rnd(-1.7,1.7),dmg:d*0.5,life:Math.round(rnd(26,42)),r:16,pierce:true,burn:true});SFX.fire();break;
    case 'pull':G.zones.push({kind:'pull',x:clamp(h.x+f*(o.big?220:160),G.cam+40,G.cam+W-40),y:h.y,r:o.r,t:80,dmg:d*0.15,end:d,col:L.light});SFX.skill();break;
    case 'blink':part(h.x,h.y,50,L.light,14,3,5,24);h.x=clamp(h.x+f*o.dist,G.cam+30,G.cam+W-30);h.inv=Math.max(h.inv,30);
      areaHit(h.x,h.y,o.r,d,6,e=>powEff(e,o.eff,d));ring(h.x,h.y,o.r,L.light,22);part(h.x,h.y,50,L.light,18,4,5,28);SFX.boom();break;
    case 'quake':G.shake=Math.max(G.shake,14);SFX.boom();
      for(const e of G.enemies){if(e.dead||!onScr(e))continue;hurtEnemy(e,d,Math.sign(e.x-h.x)||1,3);e.stun=Math.max(e.stun,e.isBoss?15:65);part(e.x,e.y,8,'#a08060',6,3,5,26);}
      ring(h.x,h.y,300,'#c8a070',30);addText(h.x,h.y,115,s.name+'!',col);break;
    case 'fort':for(const q of G.heroes){if(q.down)continue;q.inv=Math.max(q.inv,180);q.shieldT=180;powHeal(q,hMax(q)*o.heal);ring(q.x,q.y,46,'#ffd28a',26);}
      SFX.heal();addText(h.x,h.y,110,s.name+'!','#ffd28a');break;
    case 'boomer':G.proj.push({type:'boomer',own:1,x:h.x+f*20,y:h.y,z:50,vx:f*12,vy:0,dmg:d,life:66,r:16,pierce:true,turn:33,col:L.light});SFX.swing();break;
    case 'strike':{let t=null,best=-1;for(const e of G.enemies){if(e.dead||!onScr(e))continue;const v=e.isBoss?1e9:e.hp;if(v>best){best=v;t=e;}}
      if(!t)return false;
      part(h.x,h.y,50,L.dark,14,3,5,22);const side=h.x<t.x?-1:1;
      h.x=clamp(t.x+side*(t.isBoss?70:44),G.cam+20,G.cam+W-20);h.y=t.y;h.face=-side;
      hurtEnemy(t,d,h.face,8);t.stun=Math.max(t.stun,t.isBoss?12:45);
      G.fx.push({t:'slash',x:h.x+h.face*30,y:h.y,face:h.face,r:60,col:'#ff6b6b',life:12,max:12});h.inv=Math.max(h.inv,30);G.shake=Math.max(G.shake,6);SFX.boom();break;}
    case 'stare':G.flashT=14;SFX.boom();G.shake=Math.max(G.shake,6);
      for(const e of G.enemies){if(e.dead||!onScr(e))continue;e.stun=Math.max(e.stun,e.isBoss?Math.round(o.stun/3):o.stun);hurtEnemy(e,d,Math.sign(e.x-h.x)||1,2);ring(e.x,e.y,36,col,20);}
      addText(h.x,h.y,115,s.name+'!',col);break;
    case 'push':areaHit(h.x,h.y,o.r,d,28,e=>{if(!e.isBoss)e.stun=Math.max(e.stun,20);});ring(h.x,h.y,o.r,'#e8f6ff',22);part(h.x,h.y,50,'#e8f6ff',30,8,4,26);SFX.skill();break;
    case 'bolt':{const list=G.enemies.filter(e=>!e.dead&&onScr(e)).sort((a,b)=>Math.abs(a.x-h.x)-Math.abs(b.x-h.x)).slice(0,o.n);
      if(!list.length)return false;
      for(const e of list){hurtEnemy(e,d,Math.sign(e.x-h.x)||1,3);e.stun=Math.max(e.stun,e.isBoss?8:25);G.fx.push({t:'bolt',x:e.x,y:e.y,z:e.isBoss?120:50,life:14,max:14});}
      SFX.boom();G.shake=Math.max(G.shake,6);break;}
    case 'tornado':G.zones.push({kind:'tornado',x:h.x+f*50,y:h.y,vx:f*3.2,r:80,t:150,dmg:d,col:'#d8e4ff'});SFX.skill();break;
    case 'meteor':{const tg=G.enemies.filter(e=>!e.dead&&onScr(e));
      for(let k=0;k<o.n;k++){const e=tg.length?tg[k%tg.length]:null,x=e?e.x+rnd(-30,30):h.x+f*rnd(120,420),y=e?e.y+rnd(-10,10):clamp(h.y+rnd(-80,80),FT,FB);
        G.zones.push({kind:'meteor',x,y,r:80,t:34+k*9,dmg:d,rock:o.kind==='rock'});}
      SFX.skill();break;}
    case 'rain':h.castT=h.castMax=30;G.zones.push({x:h.x+f*230,y:h.y,r:130,t:100,dmg:d,col:o.col});break;
    case 'chain':{let cur=null,bd=520;for(const e of G.enemies){if(e.dead||!onScr(e))continue;const dd=Math.abs(e.x-h.x)+Math.abs(e.y-h.y);if(dd<bd){bd=dd;cur=e;}}
      if(!cur)return false;
      const pts=[[h.x,h.y,60]],seen=new Set();let k=0;
      while(cur&&k<o.n){seen.add(cur);pts.push([cur.x,cur.y,cur.isBoss?90:45]);hurtEnemy(cur,d*(1-k*0.1),Math.sign(cur.x-h.x)||1,3);cur.stun=Math.max(cur.stun,cur.isBoss?6:20);k++;
        let nx=null,nd=270;for(const e of G.enemies){if(e.dead||seen.has(e))continue;const dd=Math.hypot(e.x-cur.x,(e.y-cur.y)*1.5);if(dd<nd){nd=dd;nx=e;}}cur=nx;}
      G.fx.push({t:'zap',x:0,y:0,pts,life:16,max:16});SFX.boom();break;}
    case 'light':for(const q of G.heroes){if(q.down)continue;powHeal(q,hMax(q)*o.heal);q.buffT=360;ring(q.x,q.y,44,'#fff2a0',26);part(q.x,q.y,60,'#fff2a0',8,2,4,30);}
      G.flashT=10;SFX.heal();addText(h.x,h.y,110,s.name+'!','#fff2a0');break;
    case 'vanish':h.inv=Math.max(h.inv,150);h.ghostT=150;h.kx=-f*12;part(h.x,h.y,50,'#3a2a6a',20,3,6,30);SFX.skill();addText(h.x,h.y,110,s.name+'!','#b8a8ff');break;
    case 'freeze':for(const e of G.enemies){if(e.dead||!onScr(e))continue;hurtEnemy(e,d,0,0);e.slow=Math.max(e.slow||0,320);ring(e.x,e.y,34,col,22);}
      G.darkT=50;SFX.boom();addText(h.x,h.y,115,s.name+'!',col);break;
    case 'rage':h.rageT=300;h.cdA=0;addText(h.x,h.y,110,s.name+'!','#ff5040');ring(h.x,h.y,60,'#ff5040',20);SFX.skill();break;
    case 'trap':G.zones.push({kind:'trap',x:clamp(h.x+f*70,G.cam+30,G.cam+W-30),y:h.y,r:42,t:720,dmg:d,col:L.light});SFX.coin();break;
    case 'bomb':G.proj.push({type:'bomb',own:1,noHit:true,x:h.x+f*20,y:h.y,z:70,vz:7,vx:f*7.5,vy:0,dmg:d,life:200,r:o.r,col:L.light});SFX.swing();break;
    case 'moon':for(const q of G.heroes){if(q.down)continue;powHeal(q,hMax(q)*o.heal);q.buffT=420;ring(q.x,q.y,44,'#e8f0ff',26);}SFX.heal();addText(h.x,h.y,110,s.name+'!','#e8f0ff');break;
    case 'orbit':h.orbT=o.t;h.orbN=o.n;h.orbD=d;SFX.skill();break;
    case 'lash':for(const e of G.enemies){if(e.dead)continue;const dx=(e.x-h.x)*f;if(dx>-10&&dx<o.r&&Math.abs(e.y-h.y)<34){hurtEnemy(e,d,f,0);if(!e.isBoss){e.x=h.x+f*Math.min(dx,70);e.stun=Math.max(e.stun,30);}}}
      G.fx.push({t:'lash',x:h.x,y:h.y,face:f,r:o.r,col:L.light,life:12,max:12});SFX.swing();break;
    case 'turret':G.zones.push({kind:'turret',x:clamp(h.x+f*40,G.cam+30,G.cam+W-30),y:h.y,r:0,t:o.t,max:o.t,dmg:d,col:L.light,cd:20});SFX.coin();break;
    case 'gift':{const hurt=G.heroes.filter(q=>!q.down).sort((a,b)=>a.hp/hMax(a)-b.hp/hMax(b));
      for(const q of G.heroes){if(q.down)continue;powHeal(q,hMax(q)*o.heal);ring(q.x,q.y,40,'#ffb8d8',22);}
      for(let k=0;k<3;k++){const q=hurt[k%Math.max(1,hurt.length)]||h;G.pick.push({type:'heart',x:q.x+rnd(-30,30),y:clamp(q.y+rnd(-20,20),FT,FB),z:40,vz:rnd(4,7),vx:0,t:0});}
      SFX.heal();addText(h.x,h.y,110,s.name+'!','#ffb8d8');break;}
    case 'halo':for(const q of G.heroes){if(q.down){q.down=false;q.hp=Math.round(hMax(q)*0.4);addText(q.x,q.y,100,'رجع!','#7f7');}q.inv=Math.max(q.inv,200);q.shieldT=200;ring(q.x,q.y,46,'#fff6c0',26);}
      SFX.heal();addText(h.x,h.y,110,s.name+'!','#fff6c0');break;
    case 'bloom':areaHit(h.x,h.y,o.r,d,6);for(const q of G.heroes)if(!q.down)powHeal(q,hMax(q)*o.heal);
      ring(h.x,h.y,o.r,'#ff9fd0',26);part(h.x,h.y,30,'#ffb8e0',30,6,6,40);part(h.x,h.y,20,'#7fe07f',10,4,4,30);SFX.heal();break;
    case 'doves':for(let k=0;k<o.n;k++)G.proj.push({type:'dove',own:1,x:h.x,y:h.y+rnd(-20,20),z:70,vx:f*rnd(3,6),vy:rnd(-3,3),dmg:d,life:160,r:12,seek:true,sp:7});SFX.skill();break;
  }
  return true;
}

/* ---------- every frame ---------- */
function powHeroTick(h){
  if(h.rageT>0){h.rageT--;if(frame%5===0)part(h.x,h.y,50,'#ff5040',1,1,4,16);}
  if(h.ghostT>0)h.ghostT--;
  if(h.def.pk==='regen'&&frame%60===30&&h.hp<hMax(h))powHeal(h,hMax(h)*0.015);
  if(h.orbT>0){
    h.orbT--;
    if(frame%10===0)for(let k=0;k<h.orbN;k++){const a=frame*0.11+k*Math.PI*2/h.orbN;areaHit(h.x+Math.cos(a)*72,h.y+Math.sin(a)*28,30,h.orbD*0.45,3);}
  }
}
function powTick(){if(G.darkT>0)G.darkT--;}
function powBounce(p,e){
  let nx=null,nd=320;
  for(const o of G.enemies){if(o.dead||o===e||(p.hit&&p.hit.has(o)))continue;const d=Math.hypot(o.x-e.x,(o.y-e.y)*1.5);if(d<nd){nd=d;nx=o;}}
  if(!nx)return false;
  (p.hit||(p.hit=new Set())).add(e);p.bounce--;
  const dx=nx.x-p.x,dy=nx.y-p.y,l=Math.hypot(dx,dy)||1,sp=Math.hypot(p.vx,p.vy)||12;p.vx=dx/l*sp;p.vy=dy/l*sp;p.life=Math.max(p.life,40);
  return true;
}
function powProjTick(p){
  if(p.seek){
    if(!p.tg||p.tg.dead||(p.hit&&p.hit.has(p.tg))){p.tg=null;let bd=700;for(const e of G.enemies){if(e.dead||!onScr(e)||(p.hit&&p.hit.has(e)))continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<bd){bd=d;p.tg=e;}}}
    if(p.tg){const sp=p.sp||Math.max(8,Math.hypot(p.vx,p.vy)),dx=p.tg.x-p.x,dy=p.tg.y-p.y,l=Math.hypot(dx,dy)||1;p.vx+=(dx/l*sp-p.vx)*0.14;p.vy+=(dy/l*sp-p.vy)*0.14;}
  }
  if(p.type==='boomer'&&--p.turn===0){p.vx=-p.vx;p.hit=null;}
  if(p.type==='flame'){p.vx*=0.95;p.r+=0.4;}
  if(p.type==='bomb'){
    p.z+=p.vz;p.vz-=0.45;
    if(p.z<=0){p.life=0;areaHit(p.x,p.y,p.r,p.dmg,9,e=>{e.stun=Math.max(e.stun,e.isBoss?10:40);});
      ring(p.x,p.y,p.r,'#ffb040',22);part(p.x,p.y,20,'#ffb040',22,5,6,30);part(p.x,p.y,20,'#555',10,3,6,40);G.shake=Math.max(G.shake,7);SFX.boom();}
  }
}
function powZone(z){
  z.t--;
  if(z.kind==='pull'){
    for(const e of G.enemies){if(e.dead||e.isBoss)continue;const dx=z.x-e.x,dy=z.y-e.y,d=Math.hypot(dx,dy*1.6);if(d<z.r&&d>8){e.x+=dx/d*3;e.y+=dy/d*1.6;}}
    if(z.t%10===0)areaHit(z.x,z.y,z.r*0.45,z.dmg,0);
    if(frame%2===0){const a=rnd(0,7);G.fx.push({t:'p',x:z.x+Math.cos(a)*z.r*0.6,y:z.y+Math.sin(a)*z.r*0.3,z:rnd(10,60),vx:-Math.cos(a)*3,vy:-Math.sin(a)*1.2,vz:0,col:z.col,size:4,life:18,max:18});}
    if(z.t<=0){areaHit(z.x,z.y,z.r*0.6,z.end,10);ring(z.x,z.y,z.r*0.6,z.col,22);part(z.x,z.y,30,z.col,20,5,5,30);G.shake=Math.max(G.shake,6);SFX.boom();}
  }else if(z.kind==='tornado'){
    z.x+=z.vx;
    for(const e of G.enemies){if(e.dead||e.isBoss)continue;const dx=z.x-e.x,dy=z.y-e.y;if(Math.abs(dx)<z.r&&Math.abs(dy)<z.r*0.6){e.x+=dx*0.08+z.vx*0.7;e.y+=dy*0.05;}}
    if(z.t%8===0)areaHit(z.x,z.y,z.r,z.dmg,1);
    if(z.x<G.cam-60||z.x>G.cam+W+60)z.t=0;
  }else if(z.kind==='meteor'){
    if(z.t<=0){areaHit(z.x,z.y,z.r,z.dmg,8,e=>{if(z.rock)e.stun=Math.max(e.stun,e.isBoss?8:35);else{e.burn=150;e.burnD=z.dmg*0.12;}});
      ring(z.x,z.y,z.r,z.rock?'#c8a070':'#ff9030',20);part(z.x,z.y,10,z.rock?'#a08060':'#ffb040',16,5,6,30);G.shake=Math.max(G.shake,6);SFX.boom();}
  }else if(z.kind==='trap'){
    if(G.enemies.some(e=>!e.dead&&Math.abs(e.x-z.x)<z.r+(e.isBoss?30:0)&&Math.abs(e.y-z.y)<z.r*0.7)){
      areaHit(z.x,z.y,115,z.dmg,10,e=>{e.stun=Math.max(e.stun,e.isBoss?12:50);});ring(z.x,z.y,115,z.col,22);part(z.x,z.y,10,z.col,20,5,6,30);G.shake=Math.max(G.shake,7);SFX.boom();z.t=0;}
  }else if(z.kind==='turret'){
    if(--z.cd<=0){
      let t=null,bd=470;for(const e of G.enemies){if(e.dead||!onScr(e))continue;const d=Math.hypot(e.x-z.x,e.y-z.y);if(d<bd){bd=d;t=e;}}
      if(t){const dx=t.x-z.x,dy=t.y-z.y,l=Math.hypot(dx,dy)||1;G.proj.push({type:'arrow',own:1,col:'#fff2a0',x:z.x,y:z.y,z:92,vx:dx/l*11,vy:dy/l*11,dmg:z.dmg,life:60,r:10});SFX.arrow();z.cd=26;}else z.cd=10;
    }
  }
}

/* ---------- drawing ---------- */
function powDrawZone(z){ // on the ground, under everyone
  const sx=z.x-G.cam;
  if(z.kind==='pull'){const p=1-z.t/80;ctx.save();ctx.translate(sx,z.y);ctx.scale(1,0.45);ctx.rotate(frame*0.2);
    for(let k=0;k<3;k++){ctx.strokeStyle='rgba(40,10,70,'+(0.5-k*0.12)+')';ctx.lineWidth=6-k*1.5;ctx.beginPath();ctx.arc(0,0,z.r*(0.25+k*0.22)*(1-p*0.3),k,k+4.2);ctx.stroke();}
    ctx.fillStyle='rgba(10,0,20,.8)';circ(0,0,z.r*0.14);ctx.restore();}
  else if(z.kind==='meteor'){const p=clamp(1-z.t/30,0,1);ctx.fillStyle='rgba(0,0,0,'+(0.12+p*0.25)+')';ell(sx,z.y,z.r*(0.4+p*0.6),z.r*(0.4+p*0.6)/1.8);ctx.fill();
    ctx.strokeStyle=z.rock?'rgba(200,160,110,.6)':'rgba(255,120,40,.6)';ctx.lineWidth=2;ell(sx,z.y,z.r,z.r/1.8);ctx.stroke();}
  else if(z.kind==='trap'){ctx.fillStyle='#14121e';ell(sx,z.y,24,9);ctx.fill();ctx.fillStyle='#6a6a7a';ell(sx,z.y,20,7);ctx.fill();
    ctx.fillStyle='#d8d8e8';for(let k=0;k<7;k++){const a=k/7*Math.PI*2;tri(sx+Math.cos(a)*18,z.y+Math.sin(a)*6,sx+Math.cos(a+0.25)*14,z.y+Math.sin(a+0.25)*5-1,sx+Math.cos(a)*12,z.y+Math.sin(a)*4-9);}
    if(frame%40<20){ctx.fillStyle='#ff4040';circ(sx,z.y-2,3);}}
}
function powDrawZoneTall(z){ // things that stand up: towers, tornadoes, falling rocks
  const sx=z.x-G.cam;
  if(z.kind==='tornado'){const a=Math.min(1,z.t/20);ctx.globalAlpha=0.75*a;
    for(let k=0;k<7;k++){const y=z.y-k*16,w=14+k*7,o=Math.sin(frame*0.3+k)*6;ctx.strokeStyle=k%2?'#ffffff':'#c8d8f0';ctx.lineWidth=4;ell(sx+o,y,w,w*0.28);ctx.stroke();}
    ctx.globalAlpha=1;}
  else if(z.kind==='meteor'&&z.t<=30&&z.t>0){const zz=z.t*15,x=sx+z.t*3,y=z.y-zz;
    ctx.fillStyle=z.rock?'rgba(200,160,110,.3)':'rgba(255,140,40,.35)';circ(x+6,y-10,22);
    ctx.fillStyle='#14121e';circ(x,y,16);ctx.fillStyle=z.rock?'#8a6a4a':'#ff7a20';circ(x,y,13);ctx.fillStyle=z.rock?'#b8946a':'#ffe080';circ(x-4,y-4,5);}
  else if(z.kind==='turret'){const a=Math.min(1,z.t/30),y=z.y;ctx.globalAlpha=a;
    ctx.fillStyle='rgba(0,0,0,.3)';ell(sx,y,22,7);ctx.fill();
    ctx.fillStyle='#14121e';ctx.beginPath();ctx.moveTo(sx-19,y);ctx.lineTo(sx-12,y-84);ctx.lineTo(sx+12,y-84);ctx.lineTo(sx+19,y);ctx.closePath();ctx.fill();
    for(let k=0;k<4;k++){ctx.fillStyle=k%2?'#e84a4a':'#f4f0e8';const y0=y-3-k*20,w0=16-k*1.7;ctx.beginPath();ctx.moveTo(sx-w0,y0);ctx.lineTo(sx-w0+1.6,y0-18);ctx.lineTo(sx+w0-1.6,y0-18);ctx.lineTo(sx+w0,y0);ctx.closePath();ctx.fill();}
    ctx.fillStyle='#14121e';rr(sx-14,y-100,28,18,4);ctx.fillStyle='#fff2a0';rr(sx-11,y-97,22,12,3);
    ctx.fillStyle='rgba(255,240,150,'+(0.25+0.15*Math.sin(frame*0.2))+')';circ(sx,y-91,22);ctx.globalAlpha=1;}
}
function powDrawProj(p,sx,sy){
  const d=Math.sign(p.vx)||1;
  if(p.type==='wave'){
    if(p.ball){const r=14+(1-p.life/70)*10;ctx.fillStyle='#14121e';circ(sx,sy-r+10,r+3);ctx.fillStyle=p.col;circ(sx,sy-r+10,r);ctx.fillStyle='#ffffff';circ(sx-r*0.3,sy-r*1.3+10,r*0.3);return;}
    ctx.save();ctx.translate(sx,sy-(p.big?30:10));ctx.globalAlpha=Math.min(1,p.life/15);
    const R=p.big?62:42;ctx.strokeStyle='#14121e';ctx.lineWidth=p.big?16:12;ctx.beginPath();ctx.arc(-d*R*0.6,0,R,-1.1,1.1);if(d<0){ctx.beginPath();ctx.arc(R*0.6,0,R,Math.PI-1.1,Math.PI+1.1);}ctx.stroke();
    ctx.strokeStyle=p.col;ctx.lineWidth=p.big?11:8;ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2.5;ctx.stroke();ctx.restore();
  }else if(p.type==='flame'){const a=Math.max(0,p.life/40);ctx.globalAlpha=Math.min(1,a*1.6);ctx.fillStyle='rgba(255,120,30,.45)';circ(sx,sy,p.r);ctx.fillStyle='#ffb040';circ(sx,sy,p.r*0.6);ctx.fillStyle='#fff0a0';circ(sx,sy,p.r*0.25);ctx.globalAlpha=1;}
  else if(p.type==='boomer'){ctx.save();ctx.translate(sx,sy);ctx.rotate(frame*0.5);ctx.fillStyle='#14121e';ctx.fillRect(-15,-4,30,8);ctx.fillStyle='#dfe6f0';ctx.fillRect(-13,-2.5,20,5);ctx.fillStyle=p.col;ctx.fillRect(7,-3,6,6);ctx.restore();}
  else if(p.type==='bomb'){ctx.fillStyle='#14121e';circ(sx,sy,12);ctx.fillStyle='#3a3a4a';circ(sx,sy,10);ctx.fillStyle='#888';circ(sx-3,sy-3,3);ctx.strokeStyle='#c8a060';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx+5,sy-8);ctx.lineTo(sx+9,sy-14);ctx.stroke();ctx.fillStyle=frame%6<3?'#ffe060':'#ff6020';circ(sx+9,sy-15,3);}
  else if(p.type==='dove'){const fl=Math.sin(frame*0.6+p.x*0.1)*6,dd=p.vx>=0?1:-1;ctx.fillStyle='#14121e';ell(sx,sy,10,6);ctx.fill();ctx.fillStyle='#ffffff';ell(sx,sy,8,4.5);ctx.fill();
    ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx-6,sy-fl);ctx.lineTo(sx,sy-1);ctx.lineTo(sx+6,sy-fl);ctx.stroke();ctx.fillStyle='#ffb040';tri(sx+dd*8,sy-1,sx+dd*12,sy,sx+dd*8,sy+1.5);}
}
function powDrawFx(f,sx,a){
  if(f.t==='zap'){const P=f.pts;ctx.lineJoin='round';
    for(const [lw,c] of [[7,'rgba(255,200,60,.5)'],[2.5,'#fff8c0']]){ctx.strokeStyle=c;ctx.lineWidth=lw;ctx.beginPath();
      for(let k=0;k<P.length;k++){const x=P[k][0]-G.cam,y=P[k][1]-P[k][2];if(!k){ctx.moveTo(x,y);continue;}const [px,py]=[P[k-1][0]-G.cam,P[k-1][1]-P[k-1][2]];
        for(let s=1;s<=4;s++){const t=s/4;ctx.lineTo(px+(x-px)*t+(s<4?rnd(-8,8):0),py+(y-py)*t+(s<4?rnd(-8,8):0));}}
      ctx.stroke();}}
  else if(f.t==='lash'){const p=1-a,len=f.r*Math.min(1,p*2.2),y=f.y-50;ctx.strokeStyle='#14121e';ctx.lineWidth=7;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(sx,y);ctx.quadraticCurveTo(sx+f.face*len*0.5,y-30*(1-p),sx+f.face*len,y+8);ctx.stroke();ctx.strokeStyle=f.col;ctx.lineWidth=4;ctx.stroke();}
}
function powDrawHero(h,sx,sy){
  if(h.rageT>0){ctx.strokeStyle='rgba(255,70,40,'+(0.4+0.3*Math.sin(frame*0.4))+')';ctx.lineWidth=3;ell(sx,h.y,32,10);ctx.stroke();}
  if(h.orbT>0)for(let k=0;k<h.orbN;k++){const an=frame*0.11+k*Math.PI*2/h.orbN,ox=sx+Math.cos(an)*72,oy=h.y+Math.sin(an)*28-40,c=['#ffb040','#6ab0ff','#ff6b6b','#9dff8a'][k%4];
    ctx.globalAlpha=Math.min(1,h.orbT/30);ctx.fillStyle='#14121e';circ(ox,oy,10);ctx.fillStyle=c;circ(ox,oy,8);ctx.fillStyle='#fff';circ(ox-2.5,oy-2.5,2.5);ctx.globalAlpha=1;}
}
function powDrawOver(){if(G.darkT>0){ctx.fillStyle='rgba(16,6,40,'+(Math.min(1,G.darkT/20)*0.45)+')';ctx.fillRect(-20,-20,W+40,H+40);}}

/* ---------- the bots: when to use each kind of power ---------- */
const POW_USE={nova:'near',spin:'near',bloom:'near',push:'near',orbit:'near',quake:'many',stare:'many',freeze:'many',bolt:'many',meteor:'many',chain:'any',
  blast:'front',wave:'front',breath:'front',volley:'front',boomer:'front',lash:'front',pull:'front',tornado:'front',rain:'front',bomb:'front',trap:'front',
  dash:'line',leap:'gap',blink:'gap',strike:'any',doves:'any',turret:'fight',rage:'fight',vanish:'danger',fort:'save',halo:'save',light:'mend',moon:'mend',gift:'mend'};
function powBotSupport(h,inp){ // works even with no enemy around
  for(const w of ['k','l']){
    const s=h.def[w];if(!s||!s.fx||h['cd'+w.toUpperCase()]>0)continue;const u=POW_USE[s.fx];
    if(u==='save'&&G.heroes.some(o=>o.down||o.hp<hMax(o)*0.35))inp[w]=true;
    if(u==='mend'&&G.heroes.some(o=>!o.down&&o.hp<hMax(o)*0.55))inp[w]=true;
  }
}
function powBot(h,inp,e,dir,adx,dy){
  const ahead=countNear(h.x+dir*170,h.y,170),near=countNear(h.x,h.y,(h.def.k.o&&h.def.k.o.r)||150),onS=G.enemies.filter(o=>!o.dead&&onScr(o)).length;
  for(const w of ['k','l']){
    const s=h.def[w];if(!s||!s.fx||h['cd'+w.toUpperCase()]>0)continue;const u=POW_USE[s.fx],r=(s.o&&s.o.r)||150;let go=false,face=false;
    if(u==='near')go=countNear(h.x,h.y,r)>=2||(e.isBoss&&Math.hypot(e.x-h.x,(e.y-h.y)*1.8)<r+30);
    else if(u==='many')go=onS>=3||e.isBoss;
    else if(u==='front'){go=ahead>=2||(e.isBoss&&adx<420&&Math.abs(dy)<40)||(adx<360&&Math.abs(dy)<30&&e.elite);face=true;}
    else if(u==='line'){go=adx<260&&Math.abs(dy)<24&&(ahead>=1);face=true;}
    else if(u==='gap'){go=adx>110&&adx<270&&Math.abs(dy)<30;face=true;}
    else if(u==='any')go=e.isBoss||e.elite||onS>=2;
    else if(u==='fight')go=e.isBoss||countNear(h.x,h.y,260)>=2;
    else if(u==='danger')go=h.hp<hMax(h)*0.4&&nearestEnemyDist(h)<130;
    if(go){inp[w]=true;if(face)inp.faceTo=dir;}
  }
}
