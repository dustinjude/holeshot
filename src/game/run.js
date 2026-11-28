// ---------- runs from the law ----------
// A run is reached only from the city (HS.open with mode 'run'): a lap of a course with a load on the ski, or with nothing to
// lose but the law, while patrol skis hunt the player. core.js decides it (runGrid, chaseStep); this is what the player
// sees and hears, and what the city is told. HX.run is what the city asked for:
// {type:'drop' or 'chase', name, site, rev, laps, cops, level (their parts, 0 to 3), pace}.
let runSeen={hits:0,near:0,warn:0,sir:0,hi:false};
function runBegin(){runSeen={hits:0,near:0,warn:0,sir:0,hi:false};}
// One step of a run, after the sim has moved. True once it is over.
function runTick(dt){
  const R=wd.run, q=HX.run;
  chaseStep(wd,dt);
  if(R.hits!==runSeen.hits){runSeen.hits=R.hits; flash('Rammed','bad',650); buzz(30); shake=Math.max(shake,4); blip(110,.18,'sawtooth',.2);}
  if(!!R.near!==!!runSeen.near){runSeen.near=R.near; if(R.near&&R.bust<45) flash('Patrol on you','bad',700);}
  const w=R.bust>=75?2:R.bust>=45?1:0;
  if(w>runSeen.warn) flash(w===2?'They nearly have you':'They are closing in','bad',900);
  runSeen.warn=w;
  // a two-tone siren, louder the closer the nearest patrol ski is
  runSeen.sir-=dt;
  if(R.dist<520&&runSeen.sir<=0){runSeen.sir=.36; runSeen.hi=!runSeen.hi; blip(runSeen.hi?740:560,.3,'triangle',.02+.07*(1-R.dist/520));}
  if(R.bust>=100){runFinish('bust'); return true;}
  if(q.type==='chase'&&R.clear>=6){runFinish('lost'); return true;}
  return false;
}
// how: 'made' (the lap is done), 'lost' (nobody left in sight), 'bust' (they have you) or 'quit' (the rider gave it up)
function runFinish(how){
  const R=wd.run, q=HX.run, ok=how==='made'||how==='lost', drop=q.type!=='chase';
  mode='done'; finT=wd.t; setLive(false);
  for(const s of ais){s.hunt=false; s.laneT=0;}
  if(ok){pl.ai=true; pl.skill=.8; pl.laneT=0;} else{pl.thr=0; pl.brk=1; pl.steer=0;}
  flash(ok?(how==='lost'?'Lost them':drop?'Delivered':'Got away'):'Busted',ok?'':'bad',1200);
  blip(ok?660:150,.5,'square',.12);
  el.place.textContent=ok?(how==='lost'?'Clean away':drop?'Delivered':'Got away'):'Busted';
  el.resEyebrow.textContent=(q.name||'Run')+' · '+site.name;
  statCells([['Time',fmt(finT)],[drop?'Load intact':'Rammed',drop?Math.round(R.cargo)+'%':R.hits+(R.hits===1?' time':' times')],['Patrols',String(ais.length)],['Fastest',Math.round(stat.vmax*MPH)+' mph']]);
  board([]);
  // a run is hard on the ski: every ram and every rough landing tells
  const gb=build(myCraft());
  gb.w[0]=Math.max(0,gb.w[0]-(3+.2*stat.rough)); gb.w[1]=Math.max(0,gb.w[1]-(2+gb.p[3])); gb.w[2]=Math.max(0,gb.w[2]-(2+1.5*R.hits+stat.off));
  saveGar();
  el.sum.textContent=ok?(drop?(R.cargo>=95?'Not a mark on the load.':R.cargo>=60?'The load took some knocks. It will pay less.':'Most of the load is in the water.')
      :(how==='lost'?'Nobody behind you. They will be looking for somebody else tonight.':'You made the slip with them still behind you. They saw the ski.'))
    :'They have you, the ski and whatever was on it.';
  el.again.textContent='Back to the city'; resAction=hsExit; el.swap.hidden=true; el.podBtn.hidden=true;
  resAt=clock+1.1;
  hsDone({kind:'run',ok,how,cargo:Math.round(R.cargo),hits:R.hits,t:finT,site:site.name});
}
function runHud(){
  const R=wd.run, racing=mode==='race', t=mode==='done'?finT:racing?wd.t:0, drop=HX.run.type!=='chase';
  set(el.pos,Math.round(R.bust)+'%'); set(el.lap,drop?Math.round(R.cargo)+'%':String(ais.length));
  set(el.time,fmt(t)); set(el.mph,String(Math.round(pl.v*MPH)));
  set(el.rpm,(Math.round(pl.rpm/50)*50).toLocaleString('en-US')+' rpm');
  const f=clamp((pl.rpm-1200)/7700,0,1);
  if(Math.abs(f-revShown)>.004){revShown=f; el.revFill.style.transform='scaleX('+(1-f).toFixed(3)+')';}
  if(pl.flow!==flowShown){flowShown=pl.flow; for(let i=0;i<5;i++) el.flow.children[i+1].className=i<pl.flow?'on':'';}
  set(el.gapA,racing?(R.dist<1e8?'▼ Patrol '+Math.max(0,Math.round((R.dist-34)/26))+' lengths':''):'');
  set(el.gapB,racing?Math.max(0,Math.round((LAPS*N-(pl.lap*N+pl.idx))*DS/260))+' to go':'');
}
// the gauge that decides it, under the top strip: amber while it creeps, red and blue while a patrol ski is on the player
function runOverlay(){
  const R=wd.run; if(!R||mode==='done') return;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  // it sits between the pause button and the course map
  const w=Math.min(200,W-224), x=70, y=hudBottom+10, on=R.near>0, lit=Math.floor(clock*6)%2;
  ctx.fillStyle='rgba(6,32,42,.6)'; ctx.fillRect(x-3,y-3,w+6,16);
  ctx.fillStyle=on?(lit?'#e4392c':'#2f6fe4'):'#f1b53c'; ctx.fillRect(x,y,w*R.bust/100,10);
  ctx.font="800 12px 'Barlow Condensed','Arial Narrow',sans-serif"; ctx.textAlign='left'; ctx.textBaseline='top';
  ctx.fillStyle='#fff'; ctx.fillText(on?'PATROL ON YOU':'THE LAW',x,y+16);
  // a patrol ski that is behind or alongside cannot be seen from the saddle: a marker low on the screen shows which side it is on,
  // bigger the closer it is
  if(R.dist<420&&R.ah<30){
    const mx=W/2+clamp(R.sd/90,-1,1)*(W/2-46), my=H*.76, r=9+10*(1-R.dist/420);
    ctx.fillStyle=lit?'#e4392c':'#2f6fe4'; ctx.beginPath(); ctx.moveTo(mx-r,my-r); ctx.lineTo(mx+r,my-r); ctx.lineTo(mx,my+r*.7); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.9)'; ctx.lineWidth=2; ctx.stroke();
  }
  if(on){
    // the lights wash the edges of the screen
    const g=ctx.createLinearGradient(0,0,W,0), a=lit?'228,57,44':'47,111,228', b=lit?'47,111,228':'228,57,44';
    g.addColorStop(0,'rgba('+a+',.34)'); g.addColorStop(.16,'rgba('+a+',0)'); g.addColorStop(.84,'rgba('+b+',0)'); g.addColorStop(1,'rgba('+b+',.34)');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  }
}
