// ---------- Side Hustle City ----------
// The main game is a life sim, Side Hustle City (src/city), laid over this page. It is a script of its own and reaches the racing
// only through window.HS, below. While the city is on screen window.CITYON is true and nothing here runs or draws.
// The city has a garage and a tour of its own, saved apart from free play (PKEY), and one wallet: in the city, gar.cash is the
// city's money. HX holds what the city asked for when it opened the pits: prices, purse, small rider edges, and where to report.
const HX={on:false,kind:'',disc:1,svc:1,purse:1,top:1,turn:1,shop:true,done:null,exit:null,won:0,run:null,wget:()=>0,wset:()=>{}};
const PKEY=k=>HX.on?'city.'+k:k;
const pcost=(p,l)=>Math.round(p.cost[l]*HX.disc/10)*10;
// Marcus, the city's rival, only ever lines up on the drag strip, so nobody on the real roster gives up a place to him.
const MARCUS={name:'Marcus',full:'Marcus',num:13,hull:'#b3261e',trim:'#fcfdfb'};
let free=null;      // what free play had loaded, kept while the city has its own garage and tour in

function cityOn(){
  if(HX.on) return;
  saveGar(); saveTour();
  free={gar,tour,r:sel.r,c:sel.c,paint:sel.paint,riv,autoPace,gmode,ladder};
  HX.on=true;
  gar={cls:0,crafts:{}}; Object.defineProperty(gar,'cash',{get(){return HX.wget();},set(v){HX.wset(v);}}); loadGar();
  sel.r=pick(PKEY('racer'),RACERS.length,free.r); sel.c=pick(PKEY('craft'),CRAFTS.length,free.c); sel.paint=pick(PKEY('paint'),PAINTS.length,free.paint);
  tour=freshTour(); loadTour(); if(tourLive()){sel.r=tour.r; sel.c=tour.c;}
  // the city's field finds its own level
  riv='auto'; {const a=parseFloat(load(PKEY('o8.pace'))); autoPace=a>=0&&a<=1?a:.5;}
  mode='idle'; paused=false; resAt=0; el.start.hidden=true; el.result.hidden=true; el.pause.hidden=true; setLive(false);
  document.body.classList.add('city'); el.toSetup.textContent='Retire: counts as a DNF';
  window.CITYON=true;
}
function cityOff(){
  if(!HX.on) return;
  saveGar(); saveTour();
  HX.on=false; Object.assign(HX,{kind:'',disc:1,svc:1,purse:1,top:1,turn:1,shop:true,done:null,exit:null,won:0,run:null});
  gar=free.gar; tour=free.tour; sel.r=free.r; sel.c=free.c; sel.paint=free.paint; riv=free.riv; autoPace=free.autoPace; gmode=free.gmode; ladder=free.ladder; free=null;
  document.body.classList.remove('city'); document.body.classList.toggle('drag',gmode==='drag'); el.toSetup.textContent='Back to setup'; el.go.hidden=false;
  mode='idle'; paused=false; resAt=0; el.result.hidden=true; el.pause.hidden=true; el.start.hidden=false; setLive(false); hudLabels();
  window.CITYON=false; stage(); refreshSetup(); resize();
}
// the city opens the pits: c.mode is 'tour' (a race weekend), 'open' (one race), 'drag' (a run against Marcus), 'garage' (no race)
// or 'run' (a load to carry or the law to lose, c.run as in run.js), which skips the pits and goes straight to the line
function hsOpen(c){
  if(!HX.on) return;
  Object.assign(HX,{kind:c.mode,disc:c.disc||1,svc:c.svc||1,purse:c.purse==null?1:c.purse,top:c.top||1,turn:c.turn||1,shop:c.mode==='garage',done:c.done||null,exit:c.exit||null,won:0,
    run:c.mode==='run'?Object.assign({type:'drop',name:'Run',site:'river',rev:false,laps:1,cops:1,level:0,pace:.3},c.run):null});
  gmode=c.mode==='tour'?'tour':c.mode==='drag'?'drag':c.mode==='run'?'run':'single';
  el.toSetup.textContent=gmode==='run'?(HX.run.type==='chase'?'Give yourself up':'Dump the load and give up'):'Retire: counts as a DNF';
  hudLabels(); document.body.classList.toggle('drag',gmode==='drag');
  if(tourLive()){sel.r=tour.r; sel.c=tour.c;}
  if(gmode==='drag'){const o=(sel.r+1)%RACERS.length; ladder={round:clamp(c.level|0,0,2),opp:[o,o,o]};}
  tab=HX.shop?'g':tab==='g'?'c':tab;
  mode='idle'; paused=false; resAt=0; resAction=startCountdown; el.result.hidden=true; el.pause.hidden=true; el.start.hidden=false;
  window.CITYON=false; stage(); refreshSetup(); resize();
  if(gmode==='run') startCountdown();
}
// back to the city, from the pits or from a result
function hsExit(){
  if(!HX.on) return;
  cer=null; cele=null; conf=[]; el.cer.hidden=true; document.body.classList.remove('cering');
  mode='idle'; paused=false; resAt=0; el.result.hidden=true; el.pause.hidden=true; el.start.hidden=true; setLive(false); audioFrame();
  window.CITYON=true;
  const f=HX.exit; if(f) f();
}
// the city hears about a race once, when it is decided
function hsDone(res){const f=HX.done; HX.done=null; if(f) f(res);}
function weekendRes(dnf){
  const L=tour.last;
  return {kind:'tour',p:L.ord.indexOf(tour.r)+1,m:[L.p1[tour.r],L.p2[tour.r]],prize:HX.won,site:SITES[TOUR[L.stop][0]].name,
    round:Math.floor(tour.round/2),total:TOUR.length,tpos:tourOrder().indexOf(tour.r)+1,dnf};
}
// A weekend the rider was not at, or the rest of one they left: the field takes the points for every moto still to run.
function hsSkip(){
  if(tour.round>=MOTOS) return;
  if(tour.round===0){tour.r=sel.r; tour.c=sel.c;}
  do{
    const o=RACERS.map((r,i)=>i).filter(i=>i!==tour.r).sort((a,b)=>hash(a,tour.round,5)-hash(b,tour.round,5));
    tourScore(o.concat(tour.r),tour.r);
  }while(tour.round%2);
}
// Retiring from a started race. In a tour it ends the weekend; anywhere it is reported as a DNF.
function hsRetire(){
  if(!HX.on||(mode!=='race'&&mode!=='count')) return;
  if(gmode==='run'){runFinish('quit'); el.result.hidden=true;}
  else if(gmode==='tour'){
    const o=ais.slice().sort((a,b)=>(b.lap*N+b.idx)-(a.lap*N+a.idx)).map(s=>s.ri);
    tourScore(o.concat(tour.r),tour.r);
    if(tour.round%2) hsSkip();
    hsDone(weekendRes(1));
  }else hsDone({kind:gmode==='drag'?'drag':'open',p:RACERS.length,win:false,prize:0,site:site.name,dnf:1});
  hsExit();
}
window.HS={
  wallet(g,s){HX.wget=g; HX.wset=s;},
  city(on){if(on) cityOn(); else cityOff();},
  open:hsOpen,
  // what the city shows about the racing: weekends done, whether moto 2 of one is waiting, the next site, the standings, the ski
  info(){
    const ci=myCraft(), b=build(ci), live=tour.round<MOTOS;
    return {round:Math.floor(tour.round/2),mid:tour.round%2,total:TOUR.length,next:live?SITES[TOUR[tStop()][0]].name:'',
      pts:tour.pts[tour.r]||0,pos:tourOrder().indexOf(tour.r)+1,cls:CLASSES[gar.cls].name,craft:CRAFTS[ci].name,
      parts:b.p.reduce((a,c)=>a+c,0)+b.d.reduce((a,c)=>a+c,0),wear:Math.round(Math.min(b.w[0],b.w[1],b.w[2]))};
  },
  skip:hsSkip,
  newTour(){const r=tour.r, c=tour.c; tour=freshTour(); tour.r=r; tour.c=c; saveTour();},
  // lose a pink slip run and every part comes off the ski
  strip(){const b=build(myCraft()); b.p=PARTS.map(()=>0); b.d=DRAG_PARTS.map(()=>0); saveGar();},
  fresh(){const b=build(myCraft()); b.w=WEAR.map(()=>100); saveGar();},
  // a part Dex can get: the next level of something not yet maxed, at half price
  offer(){
    const b=build(myCraft()), c=PARTS.map((p,i)=>i).filter(i=>b.p[i]<3); if(!c.length) return null;
    const i=c[Math.floor(Math.random()*c.length)]; return {i,name:PARTS[i].name,level:b.p[i]+1,cost:Math.round(PARTS[i].cost[b.p[i]]*.5/10)*10};
  },
  grant(i){const b=build(myCraft()); if(b.p[i]<3){b.p[i]++; saveGar();}},
  // a new life in the city: its tour and garage start over
  resetAll(){if(!HX.on) return; tour=freshTour(); saveTour(); gar.cls=0; gar.crafts={}; saveGar(); autoPace=.5; store(PKEY('o8.pace'),'0.500');}
};
