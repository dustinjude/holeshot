// ---------- arcade modes ----------
// Items: a race with item boxes and coins. Crates: a solo run down the course smashing crates, jumping ramps and dodging mines.
const ITEMS={boost:{name:'Turbo',col:'#ff8a3c'},mine:{name:'Mine',col:'#e4392c'},torp:{name:'Torpedo',col:'#38c6f4'},shield:{name:'Shield',col:'#2de0b0'}};
let objs=[], arc=null;
const isArc=()=>gmode==='items'||gmode==='crates';
function lanePt(j,o){const p=PATH[((j%N)+N)%N]; return {x:p.x-p.ty*o,y:p.y+p.tx*o,p};}
function addObj(t,j,o,extra){const q=lanePt(j,o), ob=Object.assign({t,x:q.x,y:q.y,j:((j%N)+N)%N,o,h:0,alive:true,resp:0,rot:hash(j,o|0,5)*TAU},extra||{}); objs.push(ob); return ob;}
// how sharp the course is around index j
function bendAt(j,n){let k=0; for(let i=0;i<n;i++) k=Math.max(k,Math.abs(PATH[(j+i)%N].k)); return k;}
// predicted height of a ski launched off a ramp at speed v, dj path steps later
function rampArc(dj,v){const t=dj*DS/v, k=RAMP_KICK+.1*v; return Math.max(0,k*t-.5*GRAV*t*t);}
const RAMP_KICK=55;

function arcadeSetup(){
  objs=[]; arc={t:gmode,got:0,total:0,lives:3,cp:FRONT,cps:[],imm:0,hitSeen:0};
  for(const s of skis){s.top0=s.top; s.acc0=s.acc; s.coins=0; s.item=null; s.itemT=0; s.boost=0; s.spin=0; s.spinV=0; s.shield=0; s.rampCd=0; s.hits=0;}
  if(gmode==='crates'){
    // a solo run: the rivals stay at home, and one lap is the whole level
    for(const s of skis) if(!s.me&&s.g3){s.g3.visible=false; if(s.g3s) s.g3s.visible=false;}
    wd.skis=[pl]; skis=[pl]; ais=[]; wd.laps=1; LAPS=1;
    // checkpoints every fifth of a lap, or closer on a long lap, so a lost life never sends you far back
    const nc=Math.max(4,Math.floor(N/200));
    for(let c=1;c<=nc;c++) arc.cps.push(Math.round(FRONT+(N-FRONT)*c/(nc+1)));
    for(const j of arc.cps) for(const sd of [-1,1]) addObj('cp',j,sd*(PATH[j].w+6));
    const v=pl.top*.92;
    for(let j=FRONT+24;j<N-14;){
      const w=PATH[j].w, bend=bendAt(j,14), r=hash(j,3,91), inside=PATH[(j+6)%N].c;
      if(arc.cps.some(c=>j>=c-4&&j<c+14)){j+=6; continue;}
      if(bend>1/240){
        // a corner: crates on the inside line, nothing to hit
        for(let i=0;i<4;i++) addObj('crate',j+i*2,inside*w*.5);
        j+=12;
      }else if(r<.3&&bendAt(j,14)<1/380){
        // a ramp with crates hung in the air along the jump
        addObj('ramp',j,0);
        for(const dj of [5,8,11]) addObj('crate',j+dj,0,{h:Math.max(4,rampArc(dj,v)-2),air:true});
        j+=22;
      }else if(r<.47){
        // a line of crates on one side, with a mine guarding the other
        const o=(hash(j,4,91)<.5?-1:1)*w*.45;
        for(let i=0;i<4;i++) addObj('crate',j+i*2,o);
        addObj('mine',j+3,-o*.9);
        j+=15;
      }else if(r<.62){
        // a row of mines with one gap to thread
        const gap=Math.floor(hash(j,5,91)*3);
        for(let i=0;i<3;i++) if(i!==gap) addObj('mine',j,(i-1)*w*.55);
        addObj('crate',j+3,(gap-1)*w*.55);
        j+=16;
      }else{
        // a zigzag of crates across the lane
        for(let i=0;i<5;i++) addObj('crate',j+i*2,(i%2?1:-1)*w*.35);
        j+=16;
      }
    }
    arc.total=objs.filter(o=>o.t==='crate').length;
  }else{
    // three rows of item boxes and 14 coin groups a lap, or more on a long lap so they come as often as on the others
    const nb=Math.max(3,Math.floor(3*N/750)), ng=Math.max(14,Math.floor(14*N/750));
    for(let b=0;b<nb;b++){const j=Math.round(N*(nb===3?[.2,.5,.8][b]:(b+.5)/nb)), w=PATH[j].w; for(let i=0;i<5;i++) addObj('box',j,(i-2)*w*.36);}
    for(let c=0;c<ng;c++){
      const j=Math.round(FRONT+20+(N-40)*(c+.5)/ng), o=PATH[(j+4)%N].c*PATH[j].w*.4*(hash(c,2,93)<.6?1:-1);
      for(let i=0;i<3;i++) addObj('coin',j+i*2,o,{h:3});
    }
  }
  if(G.on) g3Arcade();
}
function pickItem(s){
  const order=skis.slice().sort((a,b)=>(b.lap*N+b.idx)-(a.lap*N+a.idx)), r=skis.length>1?order.indexOf(s)/(skis.length-1):1;
  const w=[['boost',.15+.35*r],['torp',.4*r],['mine',.45-.3*r],['shield',.35-.25*r]];
  let x=Math.random()*w.reduce((a,b)=>a+b[1],0);
  for(const q of w){x-=q[1]; if(x<=0) return q[0];}
  return 'boost';
}
function useItem(s){
  const it=s.item; if(!it) return; s.item=null;
  if(it==='boost'){s.boost=1.6; if(s.me){blip(980,.25,'sawtooth',.1); buzz(15);}}
  else if(it==='shield') s.shield=8;
  else if(it==='mine'){const c=Math.cos(s.h), sn=Math.sin(s.h), o={t:'mine',x:s.x-c*44,y:s.y-sn*44,j:s.idx,o:0,h:0,alive:true,resp:0,rot:0,owner:s,arm:1,life:30}; objs.push(o); if(G.on) g3Obj(o);}
  else if(it==='torp'){
    const me=s.lap*N+s.idx; let tg=null, bd=1e9;
    for(const o of skis) if(o!==s&&o.fin==null){const d=o.lap*N+o.idx-me; if(d>0&&d<bd){bd=d; tg=o;}}
    const c=Math.cos(s.h), sn=Math.sin(s.h), o={t:'torp',x:s.x+c*30,y:s.y+sn*30,h:s.h,idx:s.idx,alive:true,owner:s,target:tg,life:7,rot:0};
    objs.push(o); if(G.on) g3Obj(o);
    if(s.me) blip(500,.2,'square',.08);
  }
  if(s.me) flash(ITEMS[it].name,'',600);
}
function hitSki(s,what){
  if(s.spin>0) return;
  if(s.shield>0){s.shield=0; if(s.me) flash('Blocked','',700); return;}
  s.spin=1.1; s.vx*=.35; s.vy*=.35; s.kick=Math.max(s.kick,32); s.coins=Math.max(0,s.coins-3); s.hits++;
  if(s.me){flash(what,'bad',900); shake=Math.max(shake,4); buzz(40); blip(110,.35,'sawtooth',.14);}
}
// Slide boost: hold a hard turn at speed and a charge builds. Let go once it has passed the first mark for a short burst,
// or past the second for a longer one. Rivals take one now and then out of the tight corners.
const SLIDE_A=.6, SLIDE_B=1.2;
function slideStep(dt){
  const s=pl, hard=Math.abs(inp.steer)>.5&&s.v>120&&s.air<=0&&s.spin<=0;
  if(hard){s.slideT=(s.slideT||0)+dt; s.slideSd=Math.sign(inp.steer);}
  else if(s.slideT>0){
    if(s.slideT>=SLIDE_A){const big=s.slideT>=SLIDE_B; s.boost=Math.max(s.boost,big?.9:.5); flash(big?'Big slide boost':'Slide boost','',600); blip(big?1100:900,.15,'sawtooth',.09); buzz(12);}
    s.slideT=0;
  }
  for(const a of ais) if(a.boost<=0&&a.v>120&&Math.abs(PATH[(a.idx+2)%N].k)>1/260&&Math.random()<dt*.5*a.skill) a.boost=.5;
}
// before the physics step: what boost, coins and a spin-out do to each ski's speed
function arcadePre(dt){
  if(gmode==='items') slideStep(dt);
  for(const s of skis){
    if(s.boost>0) s.boost-=dt;
    if(s.spin>0){s.spin-=dt; s.spinV=TAU*Math.min(1,(1.1-s.spin)/.9);} else s.spinV=0;
    if(s.shield>0) s.shield-=dt;
    if(s.rampCd>0) s.rampCd-=dt;
    const m=(1+.012*s.coins)*(s.boost>0?1.3:1)*(s.spin>0?.35:1);
    s.top=s.top0*m; s.acc=s.acc0*(s.boost>0?2.2:1)*(s.spin>0?.5:1);
  }
}
// after the physics step: pickups, hits, ramps, moving objects
function arcadeStep(dt){
  if(arc.imm>0) arc.imm-=dt;
  for(const o of objs){
    if(!o.alive){if(o.resp>0&&(o.resp-=dt)<=0) o.alive=true; continue;}
    if(o.brk!=null) continue;
    if(o.t==='torp'){
      o.life-=dt; if(o.life<=0){o.alive=false; o.dead=true; continue;}
      // follow the lane, and home in once the target is close
      let best=o.idx, bd=1e18;
      for(let k=-2;k<=12;k++){const j=(o.idx+k+N)%N, p=PATH[j], d=(p.x-o.x)**2+(p.y-o.y)**2; if(d<bd){bd=d; best=j;}}
      o.idx=best;
      const tg=o.target&&o.target.fin==null?o.target:null, p=PATH[(o.idx+5)%N];
      let ax=p.x, ay=p.y;
      if(tg&&Math.hypot(tg.x-o.x,tg.y-o.y)<600){ax=tg.x; ay=tg.y;}
      o.h+=clamp(angDiff(Math.atan2(ay-o.y,ax-o.x),o.h),-4*dt,4*dt);
      const sp=VMAX*1.55; o.x+=Math.cos(o.h)*sp*dt; o.y+=Math.sin(o.h)*sp*dt;
    }
    if(o.t==='mine'&&o.life!=null){o.life-=dt; if(o.arm>0) o.arm-=dt; if(o.life<=0){o.alive=false; o.dead=true; continue;}}
    for(const s of skis){
      const dx=s.x-o.x, dy=s.y-o.y, d2=dx*dx+dy*dy, hop=s.air>0?s.z-s.hw:0;
      if(o.t==='crate'){
        if(d2<24*24&&(o.air?(s.air>0&&Math.abs(hop-o.h)<9):hop<8)){o.alive=false; o.brk=0; arc.got++; blip(620+arc.got%5*60,.06,'square',.07); if(G.on) g3Spark(o);}
      }else if(o.t==='mine'){
        if(d2<20*20&&hop<6&&!(o.owner===s&&o.arm>0)){
          if(gmode==='crates'){if(arc.imm<=0) loseLife();}
          else{hitSki(s,'Mine'); o.alive=false; o.dead=!!o.life; o.resp=o.life?0:6;}
          if(G.on) g3Boom(o);
        }
      }else if(o.t==='ramp'){
        const p=PATH[o.j], along=dx*p.tx+dy*p.ty, across=-dx*p.ty+dy*p.tx;
        if(s.air<=0&&s.rampCd<=0&&Math.abs(along)<22&&Math.abs(across)<40){s.kick=Math.max(s.kick,RAMP_KICK+.1*s.v); s.rampCd=1.5; if(s.me){blip(300,.3,'sine',.12); flash('Air!','',600);}}
      }else if(o.t==='box'){
        if(d2<22*22&&hop<8){o.alive=false; o.resp=.5; if(!s.item){s.item=pickItem(s); s.itemT=.6+Math.random()*1.8; if(s.me){flash(ITEMS[s.item].name,'',700); blip(880,.08,'square',.08);}}}
      }else if(o.t==='coin'){
        if(d2<20*20&&hop<10){o.alive=false; o.resp=8; if(s.coins<10){s.coins++; if(s.me) blip(1200,.05,'sine',.06);}}
      }else if(o.t==='torp'){
        if(s!==o.owner&&d2<22*22){hitSki(s,'Torpedo'); o.alive=false; o.dead=true; if(G.on) g3Boom(o); break;}
      }
    }
  }
  for(let i=objs.length-1;i>=0;i--) if(objs[i].dead){if(objs[i].m&&G.on) g3Drop(objs[i]); objs.splice(i,1);}
  if(gmode==='items'){
    // the rivals use what they pick up: a torpedo when someone is in range ahead, the rest after a moment
    for(const s of ais){
      if(!s.item) continue;
      s.itemT-=dt;
      if(s.itemT>0) continue;
      if(s.item==='torp'){
        const me=s.lap*N+s.idx; let near=false;
        for(const o of skis) if(o!==s){const d=o.lap*N+o.idx-me; if(d>0&&d*DS<700) near=true;}
        if(!near&&s.itemT>-5) continue;
      }
      useItem(s);
    }
  }else{
    // checkpoints
    for(const c of arc.cps) if(pl.idx>=c&&arc.cp<c&&pl.idx<c+40){arc.cp=c; flash('Checkpoint','',800); blip(760,.15,'sine',.08);}
  }
}
function loseLife(){
  arc.lives--; arc.imm=2.5;
  flash(arc.lives>0?'Mine · '+arc.lives+(arc.lives>1?' lives left':' life left'):'Out of lives','bad',1200); shake=5; buzz(60); blip(90,.5,'sawtooth',.16);
  if(arc.lives<=0){crateFinish(false); return;}
  pl.idx=arc.cp; rescue(pl,wd); pl.resc--;
}
function crateFinish(done){
  mode='done'; finT=done?pl.fin:wd.t; setLive(false); pl.ai=true; pl.skill=.8;
  const f=arc.total?arc.got/arc.total:0, medal=!done?-1:f>=.9?0:f>=.7?1:f>=.45?2:3;
  el.place.textContent=['Gold','Silver','Bronze','Finished','Out of lives'][medal<0?4:medal];
  el.resEyebrow.textContent='Crate run · '+site.name;
  statCells([['Crates',arc.got+' of '+arc.total],['Time',fmt(finT)],['Lives',String(Math.max(0,arc.lives))],['Medal',medal<0?'–':['Gold','Silver','Bronze','None'][medal]]]);
  board([]);
  const bk='crates1.'+site.id, best=parseInt(load(bk),10)||0;
  if(arc.got>best) store(bk,arc.got);
  const prize=Math.round((arc.got*15+(medal>=0&&medal<3?[800,400,200][medal]:0))*CLASSES[gar.cls].pay/10)*10;
  gar.cash+=prize; saveGar();
  el.sum.textContent=(done?'':'You ran out of lives. ')+'Prize '+money(prize)+'. Best here: '+Math.max(best,arc.got)+' crates.'+(medal>0&&done?' Gold needs 90% of the crates.':'');
  el.again.textContent='Run it again'; resAction=startCountdown; el.swap.hidden=false; el.podBtn.hidden=true;
  resAt=clock+1.1;
  if(medal===0){celebrate(false); resAt=clock+3.4;}
}
// the held item, drawn as a button at the foot of the screen; coins beside it
function itemBtn(){return {x:W/2,y:H-74,r:38};}
function arcadeOverlay(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(!G.on){
    // overhead view: the objects as simple marks
    for(const o of objs){
      if(!o.alive&&o.t!=='ramp') continue;
      const dx=o.x-camX, dy=o.y-camY, sx=V.ox+zoom*(dx*V.c-dy*V.s), sy=V.oy+zoom*(dx*V.s+dy*V.c);
      if(sx<-30||sx>W+30||sy<-30||sy>H+30) continue;
      ctx.fillStyle=o.t==='crate'?'#c98a3e':o.t==='mine'?'#1b2227':o.t==='box'?'#a78bfa':o.t==='coin'?'#ffc62a':o.t==='torp'?'#38c6f4':o.t==='cp'?'#f1fbf8':'#ffc62a';
      const r=(o.t==='ramp'?20:o.t==='coin'?4:8)*zoom*1.6;
      ctx.beginPath(); if(o.t==='crate'||o.t==='box'||o.t==='ramp') ctx.rect(sx-r,sy-r,r*2,r*2); else ctx.arc(sx,sy,r,0,TAU); ctx.fill();
    }
  }
  if(gmode==='items'&&(mode==='race'||mode==='count')){
    const b=itemBtn(), it=pl.item;
    ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,TAU); ctx.fillStyle=it?ITEMS[it].col:'rgba(6,20,26,.45)'; ctx.fill();
    ctx.lineWidth=3; ctx.strokeStyle='rgba(241,251,248,.85)'; ctx.stroke();
    ctx.font="italic 800 "+(it?17:13)+"px 'Barlow Condensed','Arial Narrow',sans-serif"; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=it?'#06202a':'rgba(241,251,248,.7)'; ctx.fillText(it?ITEMS[it].name.toUpperCase():'NO ITEM',b.x,b.y+1);
    ctx.font="700 14px 'Barlow Condensed','Arial Narrow',sans-serif"; ctx.fillStyle='#ffc62a';
    ctx.fillText('COINS '+pl.coins+'/10',b.x,b.y-b.r-14);
    // the slide charge: an arc round the button that turns orange at the first mark and red at the second
    if(pl.slideT>0){
      const k=Math.min(1,pl.slideT/SLIDE_B);
      ctx.beginPath(); ctx.arc(b.x,b.y,b.r+8,-Math.PI/2,-Math.PI/2+TAU*k); ctx.lineWidth=7;
      ctx.strokeStyle=pl.slideT>=SLIDE_B?'#e4392c':pl.slideT>=SLIDE_A?'#ff8a3c':'rgba(241,251,248,.6)'; ctx.stroke();
      if(pl.slideT>=SLIDE_A){ctx.font="italic 800 15px 'Barlow Condensed','Arial Narrow',sans-serif"; ctx.fillStyle='#ff8a3c'; ctx.fillText('LET GO TO BOOST',b.x,b.y-b.r-34);}
    }
  }
}
