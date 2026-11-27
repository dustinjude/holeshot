
const $=id=>document.getElementById(id);
const cv=$('sea'), gcv=$('gl');
let ctx=cv.getContext('2d');
const el={};
for(const id of ['pos','posN','lap','lapN','time','mph','rpm','revFill','flow','flash','pauseBtn','gapA','gapB',
  'banner','banT','banH','start','result','pause','go','quit','again','swap','place','board','sum','stats','setup','resEyebrow',
  'padL','padR','hud','list','rules','panel','ride','modeS','modeT','tabR','tabC','tabS','tabH','optsMore','optsPause',
  'lvLabel','resume','restart','toSetup','garage','tabG','modeD','modeI','modeC','podBtn','cer','cerEyebrow','cerTitle','cerList','cerGo']) el[id]=$(id);
const COL={foam:'#f1fbf8',ink:'#06202a',red:'#e4392c',yellow:'#ffc62a'};
const KEY='holeshot.';
const RSTAT=[['launch','Launch',.9,1.16],['corner','Corners',.9,1.16],['chopR','Rough',.9,1.18]];
const CSTAT=[['top','Speed',.94,1.06],['acc','Accel',.8,1.2],['turn','Turn',.8,1.2],['stab','Stable',.75,1.35]];
// The tour is a season of race weekends, ending at Havasu. Each weekend is two motos on the same course: moto points add up to the
// weekend overall, and the weekend overall pays series points on the same scale.
const TOUR=[[6,false],[2,false],[9,false],[3,false],[7,false],[4,false],[8,false],[0,false]], PTS=[25,20,16,13,11,9,7,5,3,1], MOTOS=TOUR.length*2;
const PAINTS=['#fcfdfb','#16222a','#ff8a3c','#ff4fa3','#a78bfa','#38c6f4','#2de0b0','#9be23c','#c98a3e'];
const OPTS=[['ctrl','Steering',[['hold','Hold sides'],['slide','Slide']]],
  ['feel','Response',[['low','Calm'],['mid','Normal'],['high','Quick']]],
  ['aids','Rider aids',[['on','On'],['off','Off']]],
  ['sound','Sound',[['off','Off'],['on','On']]]];
const opt={ctrl:'hold',feel:'mid',aids:'on',sound:'off'};
// for each Response setting: how fast the bars move and how much lock a held side asks for; and how far the thumb slides for full lock
const FEEL={low:[2.6,.8],mid:[3.6,1],high:[5.2,1.15]}, SLIDE={low:74,mid:58,high:44}, STEP=1/120, HELP=.25;
const calm=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const finePtr=!!(window.matchMedia&&window.matchMedia('(hover:hover) and (pointer:fine)').matches);

let wd=null, site=SITES[0], rev=false, PATH=[], N=0, TURNS=[], LAND=[], LAPS=2, PROPS=[];
let bx0=0,by0=0,bx1=1,by1=1;
const sel={r:0,c:0,s:0,paint:-1};
let tab='r', gmode='single', resAction=null, quitArm=false;
// rivals: 'auto' follows the player's results along the pace scale; '0' to '3' pin it to a named level
const RIV=['auto','0','1','2','3'];
let riv='3', autoPace=.5, racePace=.5;
let tour={round:0,pts:RACERS.map(()=>0),wk:RACERS.map(()=>0),m1:null,m2:null,last:null,hist:[],r:0,c:0};
let W=0,H=0,DPR=1,hudBottom=84;
let skis=[],ais=[],pl=null,parts=[];
let mode='idle',paused=false,clock=0,countT=0,card=0,finT=0,resAt=0,flashUntil=0;
let lapSeen=0,lapStart=0,bestLap=0,rescSeen=0,landSeen=0;
let stat={vmax:0,clean:0,turns:0,off:0,rough:0};
let camX=0,camY=0,camA=0,zoom=.6,shake=0,gapT=0,tagA=null,tagB=null,idleS=0,revShown=-1,flowShown=-1,SK=1;
let QUAL=2,slowT=0,ftAvg=.016,calmT=1,acc=0,padL=false,padR=false,bothT=0,lastSide=0;
const V={ox:0,oy:0,c:1,s:0,rot:0};
const keys={left:false,right:false,lift:false}, ptrs=new Map(), inp={steer:0,dig:true,brk:0};
let stick=null;
const snd={ac:null};

function store(k,v){try{localStorage.setItem(KEY+k,String(v));}catch(e){}}
function load(k){try{return localStorage.getItem(KEY+k);}catch(e){return null;}}
function fmt(t){const m=Math.floor(t/60), s=t-m*60; return m+':'+(s<10?'0':'')+s.toFixed(1);}
function set(e,s){if(e._t!==s){e._t=s;e.textContent=s;}}
function ordinal(p){return p+(p===1?'st':p===2?'nd':p===3?'rd':'th');}
function lum(hex){const n=parseInt(hex.slice(1),16); return (.299*(n>>16)+.587*((n>>8)&255)+.114*(n&255))/255;}
function buzz(ms){try{if(navigator.vibrate) navigator.vibrate(ms);}catch(e){}}
function flash(text,cls,ms){
  set(el.flash,text);
  const c='flash on'+(cls?' '+cls:''); if(el.flash.className!==c) el.flash.className=c;
  flashUntil=clock+(ms||1400)/1000;
}
// The ski sits low on the screen with about three and a half seconds of water in view ahead of it at full speed.
function viewZoom(){return clamp(H*.72/(VMAX*3.4),.42,1.15);}
function setLive(b){
  document.body.classList.toggle('live',b);
  if(!b) el.banner.hidden=true;
}

// ---------- course, grid, modes ----------
function inLand(x,y,m){
  for(const b of LAND){const r=b.r-m, dx=x-b.x, dy=y-b.y; if(r>0&&dx*dx+dy*dy<r*r) return true;}
  return false;
}
function buildProps(){
  PROPS=[];
  if(site.shore){
    const sx=site.shore.x, y0=PATH[0].y-1500, y1=PATH[0].y+800; let q=0;
    for(let y=y0;y<y1;y+=56){
      q++;
      const x=sx+150+(hash(q,3,21)-.5)*34, ci=Math.floor(hash(q,5,21)*6);
      if(site.id==='havasu'){
        // pit tents along the sand with the tow rigs parked behind them
        if(hash(q,4,21)<.8&&inLand(x,y,40)) PROPS.push({t:0,x,y,ci,a:(hash(q,6,21)-.5)*.3,s:17});
        const xc=sx+52+(hash(q,10,21)-.5)*36;
        if(hash(q,11,21)<.5&&inLand(xc,y,40)) PROPS.push({t:3,x:xc,y,ci:Math.floor(hash(q,12,21)*6),a:(hash(q,13,21)-.5)*.5,s:1});
      }else if(hash(q,4,21)<.7&&inLand(x,y,28)) PROPS.push({t:1,x,y,ci,a:0,s:13});
      const x2=sx-130+(hash(q,7,21)-.5)*240, y2=y+22;
      if(hash(q,8,21)<.6&&inLand(x2,y2,34)) PROPS.push({t:2,x:x2,y:y2,a:0,s:24+hash(q,9,21)*14});
    }
  }
  if(site.banks||site.rocks||site.isles) LAND.forEach((b,i)=>{
    if(b.r<72||!b.top) return;
    const n=site.banks?3:site.isles?4:2;
    for(let k=0;k<n;k++){
      const a=hash(i,k,31)*TAU, d=hash(i,k,32)*(b.r-58);
      PROPS.push({t:2,x:b.x+Math.cos(a)*d,y:b.y+Math.sin(a)*d,a:0,s:(site.banks?30:site.isles?24:20)+hash(i,k,33)*14});
    }
  });
}

// ---------- garage ----------
// Money comes from finishing. It buys part levels for the craft you are on; setup is free; engine, supercharger and pump wear with racing.
const CLASSES=[{name:'Stock',cap:1,pay:1},{name:'Limited',cap:2,pay:1.6},{name:'Open',cap:3,pay:2.4}];
const PURSE=[2000,1500,1150,900,750,620,520,440,380,320], SERVICE=[250,500,300];
let gar={cash:3500,cls:0,crafts:{}};
function money(n){return '$'+Math.round(n).toLocaleString('en-US');}
function myCraft(){return gmode==='tour'&&tourLive()?tour.c:sel.c;}
function build(ci){
  let b=gar.crafts[ci];
  if(!b||!Array.isArray(b.p)||b.p.length!==PARTS.length||!Array.isArray(b.s)||b.s.length!==TUNE.length||!Array.isArray(b.w)||b.w.length!==WEAR.length)
    b=gar.crafts[ci]={p:PARTS.map(()=>0),s:TUNE.map(()=>0),w:WEAR.map(()=>100)};
  if(!Array.isArray(b.d)||b.d.length!==DRAG_PARTS.length) b.d=DRAG_PARTS.map(()=>0);       // drag parts came later: older builds start with none
  return b;
}
function saveGar(){store('garage1',JSON.stringify(gar));}
function loadGar(){
  try{const g=JSON.parse(load('garage1')); if(g&&g.cash>=0&&g.cls>=0&&g.cls<CLASSES.length&&g.crafts&&typeof g.crafts==='object') gar=g;}catch(e){}
}
function playerMod(){const b=build(myCraft()), cap=CLASSES[gar.cls].cap; return garageMod(b.p.map(l=>Math.min(l,cap)),b.s,b.w);}
// the field is built to the limit of the class
function rivalMod(){const cap=CLASSES[gar.cls].cap; return garageMod(PARTS.map(()=>cap),null,null);}
function serviceCost(k,b){return SERVICE[k]+(k===1?250*b.p[3]:0);}
function garChanged(){if(mode==='idle') reset(); summary(); buildGarage();}
function buildGarage(){
  const box=el.garage, b=build(myCraft()), cap=CLASSES[gar.cls].cap;
  const E=(tag,cls,txt)=>{const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; if(tag==='button') e.type='button'; return e;};
  box.textContent='';
  const top=E('div','gtop'); top.append(E('span','eyebrow','Working on '+CRAFTS[myCraft()].name),E('span','cash',money(gar.cash))); box.appendChild(top);
  const cl=E('div','tabs three');
  CLASSES.forEach((c,i)=>{const t=E('button','tab',c.name); t.id='cls'+i; t.setAttribute('aria-pressed',String(i===gar.cls)); t.addEventListener('click',()=>{gar.cls=i; saveGar(); garChanged();}); cl.appendChild(t);});
  box.append(cl,E('p','fine',CLASSES[gar.cls].name+' class: parts count up to level '+cap+', and the whole field is built to that limit. A win against Pro rivals pays '+money(PURSE[0]*CLASSES[gar.cls].pay)+'.'));
  box.appendChild(E('div','eyebrow','Parts'));
  PARTS.forEach((p,i)=>{
    const row=E('div','grow'), l=b.p[i], left=E('div'), nm=E('b',null,p.name), pips=E('span','pips');
    for(let k=0;k<3;k++){const d=E('i'); if(k<l) d.className=k<cap?'on':'over'; pips.appendChild(d);}
    nm.appendChild(pips);
    left.append(nm,E('small',null,(p.by?p.by+'. ':'')+p.note+'.'+(l>cap?' Above the class limit: level '+l+' does not count here.':'')));
    const bt=E('button','gbtn',l>=3?'Maxed':'Level '+(l+1)+' '+money(p.cost[l])); bt.id='buy'+i; bt.disabled=l>=3||gar.cash<p.cost[l];
    bt.addEventListener('click',()=>{const n=b.p[i]; if(n<3&&gar.cash>=p.cost[n]){gar.cash-=p.cost[n]; b.p[i]=n+1; saveGar(); blip(660,.08,'square',.08); garChanged();}});
    row.append(left,bt); box.appendChild(row);
  });
  // drag parts: they only count on the strip, and the class limit does not apply to them
  box.appendChild(E('div','eyebrow','Drag parts'));
  box.appendChild(E('p','fine','Only for the drag strip. Each level is worth about two hundredths over 1,000 feet. Drag rivals run none in the quarterfinal, level 1 in the semifinal and level 2 in the final.'));
  DRAG_PARTS.forEach((p,i)=>{
    const row=E('div','grow'), l=b.d[i], left=E('div'), nm=E('b',null,p.name), pips=E('span','pips');
    for(let k=0;k<3;k++){const d=E('i'); if(k<l) d.className='on'; pips.appendChild(d);}
    nm.appendChild(pips);
    left.append(nm,E('small',null,(p.by?p.by+'. ':'')+p.note+'.'));
    const bt=E('button','gbtn',l>=3?'Maxed':'Level '+(l+1)+' '+money(p.cost[l])); bt.id='dbuy'+i; bt.disabled=l>=3||gar.cash<p.cost[l];
    bt.addEventListener('click',()=>{const n=b.d[i]; if(n<3&&gar.cash>=p.cost[n]){gar.cash-=p.cost[n]; b.d[i]=n+1; saveGar(); blip(660,.08,'square',.08); garChanged();}});
    row.append(left,bt); box.appendChild(row);
  });
  box.appendChild(E('div','eyebrow','Setup'));
  TUNE.forEach((t,i)=>{
    const row=E('div','grow'), st=E('div','steps'), ends=E('div','ends');
    row.appendChild(E('b',null,t.name)); row.appendChild(E('span'));
    for(let v=-2;v<=2;v++){
      const bt=E('button'); bt.id='tune'+i+'_'+(v+2); bt.setAttribute('aria-label',t.name+', step '+(v+3)+' of 5, from '+t.lo+' to '+t.hi); bt.setAttribute('aria-pressed',String(b.s[i]===v));
      bt.addEventListener('click',()=>{b.s[i]=v; saveGar(); garChanged();}); st.appendChild(bt);
    }
    ends.append(E('span',null,t.lo),E('span',null,t.hi)); row.append(st,ends); box.appendChild(row);
  });
  box.appendChild(E('div','eyebrow','Service'));
  WEAR.forEach((w,k)=>{
    const row=E('div','grow'), c=Math.round(b.w[k]), left=E('div'), bar=E('div','cond'), fill=E('i'), cost=serviceCost(k,b);
    left.append(E('b',null,w+' '+c+'%'),E('small',null,c<60?['Down on top speed.','Down on acceleration.','Down on launch and hookup.'][k]:['Plugs and oil.','Rebuild.','Wear ring.'][k]));
    const bt=E('button','gbtn',c>=98?'Fresh':'Service '+money(cost)); bt.id='svc'+k; bt.disabled=c>=98||gar.cash<cost;
    // working on it takes a moment
    bt.addEventListener('click',()=>{if(gar.cash<cost||b.w[k]>=98) return; bt.disabled=true; bt.textContent='Working'; blip(300,.5,'sawtooth',.05);
      setTimeout(()=>{gar.cash-=cost; b.w[k]=100; saveGar(); garChanged();},700);});
    fill.style.width=c+'%'; if(c<60) fill.className='low'; bar.appendChild(fill);
    row.append(left,bt,bar); box.appendChild(row);
  });
}

function loadSite(i,rv){
  wd=makeWorld(SITES[i],rv); site=wd.site; rev=wd.rev; PATH=wd.path; N=wd.N; TURNS=wd.turns; LAND=wd.land;
  bx0=by0=1e9; bx1=by1=-1e9;
  for(const p of PATH){if(p.x<bx0)bx0=p.x;if(p.x>bx1)bx1=p.x;if(p.y<by0)by0=p.y;if(p.y>by1)by1=p.y;}
  buildProps(); if(G.on) g3Site(); else buildArt();
  idleS=0; calmT=1;
  reset();
}
function reset(){
  cele=null; conf=[];
  if(gmode==='drag'){dragReset(); return;}
  // moto 2 of a tour weekend lines up in the order moto 1 finished
  const order=gmode==='tour'&&tour.round%2===1&&Array.isArray(tour.m1)&&tour.m1.length===RACERS.length?tour.m1:null;
  racePace=pace(); pl=gridUp(wd,sel.r,sel.c,racePace,playerMod(),rivalMod(),order); skis=wd.skis; ais=skis.filter(s=>!s.me);
  if(sel.paint>=0){pl.hull=PAINTS[sel.paint]; pl.trim=lum(pl.hull)>.6?COL.ink:'#fcfdfb';}
  for(const s of skis){s.wx=[];s.wy=[];s.wa=[];s.wnx=[];s.wny=[];s.wm=0;}
  LAPS=wd.laps; set(el.lapN,'/'+LAPS); set(el.posN,'/'+skis.length);
  parts=[]; lapSeen=0; lapStart=0; bestLap=0; rescSeen=0; finT=0;
  stat={vmax:0,clean:0,turns:0,off:0,rough:0};
  stick=null; ptrs.clear(); tagA=tagB=null; gapT=0;
  camX=pl.x; camY=pl.y; camA=PATH[(pl.idx+4)%N].h;
  landSeen=0;
  if(G.on) g3Skis(); else dressSkis();
  hudLabels();
  if(isArc()) arcadeSetup(); else objs=[];
  if(gmode==='crates'){set(el.posN,'/'+arc.total); set(el.lapN,'');}
}
function hudLabels(){const l=document.querySelectorAll('#hud .lbl'); l[0].textContent=gmode==='crates'?'Crates':'Pos'; l[1].textContent=gmode==='crates'?'Lives':'Lap';}

function pace(){return riv==='auto'?autoPace:LEVELS[+riv].pace;}
function paceName(p){return p<.31?'Easy':p<.64?'Medium':p<.89?'Hard':'Pro';}
// Auto: win and the field gets quicker, by more the easier the win; finish down the order and it eases off.
function autoAdjust(p,margin){
  const d=p===1?(margin>4?.16:margin>1.5?.1:.05):p<=3?0:p<=5?-.06:p<=7?-.11:-.16, was=autoPace;
  autoPace=clamp(autoPace+d,0,1); store('o8.pace',autoPace.toFixed(3));
  return autoPace-was;
}

// tour.round counts motos: the weekend is round/2, and an odd round means moto 2 is next
function tourLive(){return tour.round>0&&tour.round<MOTOS;}
function tStop(){return Math.min(TOUR.length-1,Math.floor(tour.round/2));}
function freshTour(){return {round:0,pts:RACERS.map(()=>0),wk:RACERS.map(()=>0),m1:null,m2:null,last:null,hist:[],r:sel.r,c:sel.c};}
function saveTour(){store('tour12',JSON.stringify(tour));}
function loadTour(){
  try{
    const t=JSON.parse(load('tour12'));
    if(t&&Array.isArray(t.pts)&&t.pts.length===RACERS.length&&Array.isArray(t.wk)&&t.wk.length===RACERS.length&&Array.isArray(t.hist)&&t.round>=0&&t.round<=MOTOS&&(t.round%2===0||Array.isArray(t.m1))&&
       t.r>=0&&t.r<RACERS.length&&t.c>=0&&t.c<CRAFTS.length) tour=t;
  }catch(e){}
}
// load the course for whatever is up next
function stage(){
  if(gmode==='drag'){loadDrag(); return;}
  if(gmode==='tour'){
    if(tour.round>=MOTOS) tour=freshTour();
    if(tour.round===0){tour.r=sel.r; tour.c=sel.c;}
    const st=TOUR[tStop()]; loadSite(st[0],st[1]);
  }else loadSite(sel.s,false);
}

function hintText(){
  const air=' Off a wave, land with the bars straight.';
  if(finePtr) return 'Left and right arrows steer. The throttle is automatic. Down arrow brakes.'+air;
  return (opt.ctrl==='hold'?'Hold the left or right side of the screen to steer. Hold both sides to brake.'
    :'Slide your thumb left or right to steer. A second thumb brakes.')+air;
}
function startCountdown(){
  if(gmode==='drag'){startDrag(); return;}
  el.start.hidden=true; el.result.hidden=true; el.pause.hidden=true; paused=false; resAt=0;
  if(gmode==='tour'){stage(); saveTour();} else reset();
  mode='count'; countT=0; card=0; tileRush=3; calmT=.8;
  setLive(true);
  const what=gmode==='tour'?'Round '+(tStop()+1)+' · Moto '+(tour.round%2+1)+' · ':gmode==='items'?'Item race · ':gmode==='crates'?'Crate run · ':'';
  el.banT.textContent=what+site.name+(rev?' reverse':'')+' · '+LAPS+' laps';
  el.banH.textContent=gmode==='items'?'Drive through item boxes, then tap the item button (or up arrow) to use it. Coins add top speed.':gmode==='crates'?'Smash the crates, hit the ramps, dodge the mines. Three lives.':hintText();
  if(gmode==='crates') el.banT.textContent=what+site.name;
  el.banner.hidden=false;
  audioInit();
}
function backToSetup(){
  mode='idle'; paused=false; resAt=0; el.result.hidden=true; el.pause.hidden=true; el.start.hidden=false;
  setLive(false); stage(); refreshSetup();
}
function pauseGame(){
  if(paused||(mode!=='race'&&mode!=='count')) return;
  paused=true; stick=null; ptrs.clear(); el.pause.hidden=false; audioFrame();
}
function resumeGame(){paused=false; el.pause.hidden=true;}

function place(){
  const me=pl.lap*N+pl.idx; let p=1;
  for(const a of ais) if(a.fin!=null?(pl.fin==null||a.fin<pl.fin):(pl.fin==null&&a.lap*N+a.idx>me)) p++;
  return p;
}

function board(rows){
  el.board.textContent='';
  rows.forEach((r,i)=>{
    const li=document.createElement('li'); if(r.me) li.className='me';
    const a=document.createElement('span'); a.textContent=String(i+1);
    const b=document.createElement('span'); b.textContent=r.name;
    const sm=document.createElement('small'); sm.textContent=r.craft; b.appendChild(sm);
    const c=document.createElement('span'); c.textContent=r.val;
    if(r.extra){const x=document.createElement('small'); x.textContent=r.extra; c.appendChild(x);}
    li.append(a,b,c); el.board.appendChild(li);
  });
}
function statCells(cells){
  el.stats.textContent=''; el.stats.hidden=!cells.length;
  for(const c of cells){
    const d=document.createElement('div'), s=document.createElement('span'), b=document.createElement('b');
    s.textContent=c[0]; b.textContent=c[1]; d.append(s,b); el.stats.appendChild(d);
  }
}

function finish(){
  if(gmode==='crates'){crateFinish(true); return;}
  mode='done'; finT=pl.fin; setLive(false);
  pl.ai=true; pl.skill=.8; pl.laneT=0;                        // the rider cruises on round while the results are up
  flash('Checkered flag','',1000);
  blip(660,.5,'square',.12);
  const rows=[{ri:pl.ri,name:pl.full+' (you)',craft:pl.craft,t:finT,me:true}];
  for(const a of ais){
    // riders still on course are placed by the pace they have held so far
    const done=Math.max(1,(a.lap*N+a.idx-FRONT)*DS), left=Math.max(0,(LAPS*N-(a.lap*N+a.idx))*DS), pace=Math.max(90,done/Math.max(finT,1));
    rows.push({ri:a.ri,name:a.full,craft:a.craft,t:a.fin!=null?a.fin:finT+left/pace,me:false});
  }
  rows.sort((a,b)=>a.t-b.t);
  const p=rows.findIndex(r=>r.me)+1, inTour=gmode==='tour', moto=tour.round%2, stopNo=tStop()+1, win=rows[0].t;
  lastRows=rows;
  if(inTour){
    if(moto===0){tour.wk=RACERS.map(()=>0); tour.m1=null; tour.m2=null;}
    rows.forEach((r,i)=>{tour.wk[r.ri]+=PTS[i];});
    if(moto===0) tour.m1=rows.map(r=>r.ri);
    else{
      // the weekend overall: moto points added up, a tie going to whoever finished moto 2 ahead. It pays series points.
      tour.m2=rows.map(r=>r.ri);
      const p1=RACERS.map(()=>0), p2=RACERS.map(()=>0);
      tour.m1.forEach((ri,i)=>{p1[ri]=i+1;}); tour.m2.forEach((ri,i)=>{p2[ri]=i+1;});
      const ord=RACERS.map((r,i)=>i).sort((a,b)=>tour.wk[b]-tour.wk[a]||p2[a]-p2[b]);
      ord.forEach((ri,i)=>{tour.pts[ri]+=PTS[i];});
      tour.last={stop:tStop(),ord,wk:tour.wk.slice(),p1,p2};
      tour.hist.push(ord.indexOf(tour.r)+1);
    }
    tour.round++; saveTour();
  }
  el.place.textContent=ordinal(p);
  el.resEyebrow.textContent=(inTour?'Round '+stopNo+' · Moto '+(moto+1):'Checkered flag')+' · '+site.name+(rev?' reverse':'');
  statCells([['Best lap',bestLap>0?fmt(bestLap):'–'],['Fastest',Math.round(stat.vmax*MPH)+' mph'],['Clean buoys',stat.clean+' of '+stat.turns],['Rivals',paceName(racePace)]]);
  board(rows.map((r,i)=>({name:r.name,craft:r.craft,val:i?'+'+(r.t-win).toFixed(1):fmt(r.t),extra:inTour?'+'+PTS[i]+' pts':'',me:r.me})));
  const bk='v12.best.'+site.id+(rev?'.rev':''), best=parseFloat(load(bk)), record=!(best<=finT);
  if(record) store(bk,finT);
  let tip='';
  const margin=p===1?rows[1].t-win:win-finT;
  if(riv==='auto'){
    const d=autoAdjust(p,margin);
    tip=d>.001?' The rivals will be quicker next time.':d<-.001?' The rivals will ease off a little next time.':'';
  }else if(!inTour){
    if(p===1&&margin>4&&riv!=='3') tip=' Winning easily? Pick a tougher rival level, or Auto, under More.';
    else if(p>=6&&riv!=='0') tip=' Tough field? Pick a gentler rival level, or Auto, under More.';
  }
  if(!tip&&p>1&&stat.clean<stat.turns/2) tip=' Take the turn buoys close on the inside to build flow and carry more speed.';
  // prize money, and what the race took out of the ski
  const gb=build(myCraft()), prize=Math.round(PURSE[p-1]*CLASSES[gar.cls].pay*(.3+.7*racePace)/10)*10;
  gar.cash+=prize;
  gb.w[0]=Math.max(0,gb.w[0]-(4+.2*stat.rough)); gb.w[1]=Math.max(0,gb.w[1]-(3+1.5*gb.p[3])); gb.w[2]=Math.max(0,gb.w[2]-(3+1.2*stat.off+.1*stat.rough));
  saveGar();
  const tired=Math.min(gb.w[0],gb.w[1],gb.w[2])<60?' Your ski needs work: see the Garage.':'';
  el.sum.textContent='Your time '+fmt(finT)+'. Prize '+money(prize)+'.'+(record&&best>0?' New personal best here.':'')+tired+tip;
  el.podBtn.hidden=inTour;
  if(inTour){el.again.textContent=moto?'Weekend overall':'Weekend standings'; resAction=showWeekend; el.swap.hidden=true;}
  else{el.again.textContent='Race again'; resAction=startCountdown; el.swap.hidden=false;}
  resAt=clock+(p===1?4.4:1.1);
  if(p===1) celebrate(true);
}

function tourOrder(){return RACERS.map((r,i)=>i).sort((a,b)=>tour.pts[b]-tour.pts[a]||a-b);}
function craftOf(i){return CRAFTS[i===tour.r?tour.c:(i*2+1)%CRAFTS.length].name;}
// the weekend so far: after moto 1, the points it paid; after moto 2, the overall
function showWeekend(){
  el.podBtn.hidden=true; statCells([]);
  const S=SITES[TOUR[tour.last&&tour.round%2===0?tour.last.stop:tStop()][0]];
  if(tour.round%2===1){
    const p1=RACERS.map(()=>0); tour.m1.forEach((ri,i)=>{p1[ri]=i+1;});
    const ord=RACERS.map((r,i)=>i).sort((a,b)=>tour.wk[b]-tour.wk[a]||p1[a]-p1[b]), pos=ord.indexOf(tour.r)+1, slot=tour.m1.indexOf(tour.r);
    el.place.textContent=ordinal(pos);
    el.resEyebrow.textContent='Weekend after moto 1 · '+S.name;
    board(ord.map(i=>({name:RACERS[i].full+(i===tour.r?' (you)':''),craft:'Moto 1 '+ordinal(p1[i]),val:tour.wk[i]+' pts',extra:'',me:i===tour.r})));
    el.sum.textContent='Moto 2 lines up in the order moto 1 finished: you start on the '+(slot<5?'front':'back')+' row. Points from both motos add up to the weekend overall; a tie goes to moto 2.';
    el.again.textContent='Start moto 2'; resAction=startCountdown; el.swap.hidden=true;
  }else{
    const L=tour.last, pos=L.ord.indexOf(tour.r)+1;
    el.place.textContent=pos===1?'Winner':ordinal(pos);
    el.resEyebrow.textContent='Weekend overall · '+S.name;
    board(L.ord.map((i,n)=>({name:RACERS[i].full+(i===tour.r?' (you)':''),craft:'Motos '+L.p1[i]+'\u2011'+L.p2[i],val:L.wk[i]+' pts',extra:'+'+PTS[n]+' series',me:i===tour.r})));
    el.sum.textContent=(pos===1?'You won the weekend.':RACERS[L.ord[0]].full+' won the weekend. You were '+ordinal(pos)+' overall.')+' The top three go up for the award ceremony.';
    el.again.textContent='Award ceremony'; el.swap.hidden=true;
    resAction=()=>startCeremony({eyebrow:'Award ceremony · '+S.name,title:'Weekend overall',
      rows:L.ord.slice(0,3).map(i=>({ri:i,name:RACERS[i].full+(i===tour.r?' (you)':''),val:L.wk[i]+' pts'})),after:showStandings});
  }
}
function showStandings(){
  const order=tourOrder(), pos=order.indexOf(tour.r)+1, done=tour.round>=MOTOS;
  el.podBtn.hidden=true;
  el.place.textContent=done&&pos===1?'Champion':ordinal(pos);
  el.resEyebrow.textContent=done?'Final series standings':'Series standings after round '+Math.floor(tour.round/2)+' of '+TOUR.length;
  statCells([]);
  board(order.map(i=>({name:RACERS[i].full+(i===tour.r?' (you)':''),craft:craftOf(i),val:tour.pts[i]+' pts',extra:'',me:i===tour.r})));
  if(done){
    el.sum.textContent=pos===1?'You are the series champion.':RACERS[order[0]].full+' won the series. You finished '+ordinal(pos)+'.';
    el.again.textContent='Championship ceremony'; el.swap.hidden=true;
    resAction=()=>startCeremony({eyebrow:'Season finale · '+SITES[TOUR[TOUR.length-1][0]].name,title:'Series champions',
      rows:order.slice(0,3).map(i=>({ri:i,name:RACERS[i].full+(i===tour.r?' (you)':''),val:tour.pts[i]+' pts'})),after:backToSetup});
  }else{
    const st=TOUR[tStop()];
    el.sum.textContent='Next: round '+(tStop()+1)+' of '+TOUR.length+' at '+SITES[st[0]].name+', two motos.';
    el.again.textContent='Next weekend'; resAction=startCountdown; el.swap.hidden=false;
  }
}

// ---------- drag racing ----------
// A ladder of three rounds. Each run: stage lights, then all three ambers together at a moment you cannot predict, then the green
// four tenths after. Go on the green, or leave on the ambers and time it.
const ROUNDS=['Quarterfinal','Semifinal','Final'], DRAG_PAY=[700,1100,1800];
let ladder={round:0,opp:[]}, dg=null, taps=0;
function newLadder(){
  const o=RACERS.map((r,i)=>i).filter(i=>i!==sel.r);
  for(let i=o.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [o[i],o[j]]=[o[j],o[i]];}
  ladder={round:0,opp:o.slice(0,3)};
}
function loadDrag(){
  wd=makeWorld(DRAG_SITE,false); site=wd.site; rev=false; PATH=wd.path; N=wd.N; TURNS=wd.turns; LAND=wd.land;
  wd.finIdx=FRONT+Math.round(DRAG_D/DS);
  bx0=by0=1e9; bx1=by1=-1e9;
  for(const p of PATH){if(p.x<bx0)bx0=p.x;if(p.x>bx1)bx1=p.x;if(p.y<by0)by0=p.y;if(p.y>by1)by1=p.y;}
  buildProps(); if(G.on) g3Site(); else buildArt();
  idleS=0; calmT=1;
  dragReset();
}
function dragReset(){
  if(!wd||!wd.site.drag){loadDrag(); return;}
  wd.env.t=clock;
  // your ski with its drag parts; the rival rides the same build with the drag parts of its round
  const base=playerMod(), rl=ladder.round;
  pl=dragGrid(wd,sel.r,sel.c,ladder.opp[rl],dragMod(base,build(myCraft()).d),dragRT(rl,Math.random),dragMod(base,DRAG_PARTS.map(()=>rl)));
  skis=wd.skis; ais=[skis[1]]; racePace=1; wd.round=rl;
  if(sel.paint>=0){pl.hull=PAINTS[sel.paint]; pl.trim=lum(pl.hull)>.6?COL.ink:'#fcfdfb';}
  for(const s of skis){s.wx=[];s.wy=[];s.wa=[];s.wnx=[];s.wny=[];s.wm=0;}
  LAPS=1; set(el.lapN,'/1'); set(el.posN,'/2');
  parts=[]; finT=0; stat={vmax:0,clean:0,turns:0,off:0,rough:0};
  stick=null; ptrs.clear(); tagA=tagB=null; gapT=0;
  camX=pl.x; camY=pl.y; camA=PATH[(pl.idx+4)%N].h; landSeen=0;
  if(G.on) g3Skis(); else dressSkis();
}
function startDrag(){
  el.start.hidden=true; el.result.hidden=true; el.pause.hidden=true; paused=false; resAt=0;
  dragReset();
  const st=2.2+Math.random()*.4, amb=st+1+Math.random()*1.6;
  dg={tt:0,stage:st,amb,green:amb+TREE,lit:0,done:false,shown:false,tapSeen:taps,trimSeen:0,lostSeen:0};
  wd.t=-(dg.green); mode='count'; calmT=.8; keys.gas=false;
  setLive(true);
  el.banT.textContent=ROUNDS[ladder.round]+' · you vs '+RACERS[ladder.opp[ladder.round]].name;
  el.banH.textContent=(finePtr?'Press the up arrow or space':'Tap anywhere')+' on the green: the ambers come four tenths before it. Then tap each green trim light the instant it comes on.';
  el.banner.hidden=false;
  audioInit();
}
function dragUpdate(dt){
  dg.tt+=dt;
  if(mode==='count'){
    if(dg.lit<1&&dg.tt>=dg.stage){dg.lit=1; el.banner.hidden=true; blip(520,.05,'square',.05);}
    if(dg.lit<2&&dg.tt>=dg.amb){dg.lit=2; blip(440,.12,'square',.09);}
    if(dg.tt>=dg.green){mode='race'; dg.lit=3; el.banner.hidden=true; blip(880,.25,'square',.12);}
  }
  // the first touch once the stage lights are on is the launch: anything before is ignored
  const held=ptrs.size>0||!!stick||keys.gas, launch=pl.go!=null||(held&&dg.tt>=dg.stage&&!dg.done);
  const before=pl.go, tapped=taps!==dg.tapSeen; dg.tapSeen=taps;
  dragStep(wd,dt,launch,tapped&&before!=null,Math.random);
  if(pl.trims.length!==dg.trimSeen){
    dg.trimSeen=pl.trims.length; const r=pl.trims[pl.trims.length-1];
    if(pl.lost!==dg.lostSeen){dg.lostSeen=pl.lost; flash('Early tap · trim lost','bad',900); blip(160,.2,'sawtooth',.1);}
    else if(r==null){flash('Missed trim','bad',800); blip(160,.2,'sawtooth',.1);}
    else{flash((r<.17?'Perfect trim ':'Trim ')+r.toFixed(3),r<.17?'':'',800); blip(r<.17?1040:760,.08,'square',.1); buzz(10);}
  }
  if(before==null&&pl.go!=null){
    buzz(25);
    if(pl.go<0){flash('Red light','bad',1600); blip(150,.6,'sawtooth',.14);}
    else flash(pl.go.toFixed(3),'big',800);
    if(mode==='count'){mode='race'; el.banner.hidden=true;}
  }
  const o=ais[0];
  if(o.go!=null&&o.go<0&&!dg.oFoul){dg.oFoul=true; flash(o.name+' red light','',1400);}
  if(pl.v>stat.vmax) stat.vmax=pl.v;
  if(pl.lands!==landSeen){landSeen=pl.lands; shake=Math.max(shake,Math.min(4,pl.land*.06)); blip(70,.1,'sine',Math.min(.2,pl.land*.004));}
  // the run is over once both are across the line, or one is and the other is well beaten
  const a=pl.fin, b=o.fin;
  if(!dg.done&&(a!=null&&b!=null||a!=null&&wd.t>a+2||b!=null&&wd.t>b+(pl.go==null?1.5:2.5))) dragFinish();
}
function dragFinish(){
  dg.done=true; mode='done'; setLive(false); finT=pl.fin;
  const o=ais[0], pf=pl.go!=null&&pl.go<0, of=o.go<0, round=ladder.round;
  let win;
  if(pf&&of) win=pl.go>o.go;                    // both jumped it: the first to go loses
  else if(pf) win=false; else if(of) win=true;
  else if(pl.fin==null) win=false; else if(o.fin==null) win=true; else win=pl.fin<o.fin;
  const rt=pl.go, et=pl.fin!=null&&rt!=null?pl.fin-Math.max(0,rt):null, mar=pl.fin!=null&&o.fin!=null?Math.abs(o.fin-pl.fin):null;
  el.place.textContent=win?(round===2?'Winner':'Win'):pf?'Red light':'Loss';
  el.resEyebrow.textContent=ROUNDS[round]+' · Havasu Drag Strip';
  statCells([['Reaction',rt==null?'–':rt<0?'Red':rt.toFixed(3)],['1,000 ft',et==null?'–':et.toFixed(2)],['Trap',pl.trap?Math.round(pl.trap*MPH)+' mph':'–'],['Margin',mar==null?'–':mar.toFixed(3)]]);
  const tr=s=>s.trims.length?' · trims '+s.trims.map(x=>x==null?'miss':x.toFixed(2).replace(/^0/,'')).join(' '):'';
  const row=(s,me)=>({name:s.full+(me?' (you)':''),craft:'RT '+(s.go==null?'–':s.go<0?'red light':s.go.toFixed(3))+tr(s),val:s.fin!=null?s.fin.toFixed(3):'–',extra:'',me});
  board(win?[row(pl,true),row(o,false)]:[row(o,false),row(pl,true)]);
  const pay=CLASSES[gar.cls].pay, prize=Math.round((win?DRAG_PAY[round]:150)*pay/10)*10, gb=build(myCraft());
  gar.cash+=prize; gb.w[0]=Math.max(0,gb.w[0]-1.5); gb.w[1]=Math.max(0,gb.w[1]-(1+.6*gb.p[3])); gb.w[2]=Math.max(0,gb.w[2]-1.5); saveGar();
  let tip='';
  if(pf) tip=' You went '+(-rt).toFixed(3)+' before the green.';
  else if(!win&&rt!=null&&pl.trims.some(x=>x==null||x>.3)) tip=pl.lost?' Tap only when the trim light is on: an early tap costs you the next trim.':' Hit the trim lights quicker: each slow or missed one gives away speed for the rest of the run.';
  else if(!win&&rt!=null&&build(myCraft()).d.some(l=>l<ladder.round)) tip=' Your rival had more drag parts. See Drag parts in the Garage.';
  else if(!win&&rt!=null&&rt>.15) tip=' The ambers come exactly four tenths before the green: start your thumb moving on them.';
  else if(!win&&rt!=null) tip=' Close. A few hundredths sooner off the tree wins it.';
  el.sum.textContent=(win&&round===2?'You won the ladder. ':'')+'Prize '+money(prize)+'.'+tip;
  if(win&&round<2){ladder.round++; el.again.textContent='Next: '+ROUNDS[ladder.round].toLowerCase()+' vs '+RACERS[ladder.opp[ladder.round]].name; resAction=startDrag;}
  else{el.again.textContent=win?'Run the ladder again':'Start the ladder over'; resAction=()=>{newLadder(); startDrag();};}
  el.swap.hidden=false; el.podBtn.hidden=true;
  resAt=clock+1.3;
  if(win&&round===2){celebrate(false); resAt=clock+3.4;}
}
function dragHud(dt){
  const o=ais[0], t=mode==='done'?(pl.fin!=null?pl.fin:wd.t):Math.max(0,wd.t);
  set(el.pos,String(pl.dist>=o.dist?1:2)); set(el.time,t.toFixed(2)); set(el.lap,'1');
  set(el.mph,String(Math.round(pl.v*MPH)));
  set(el.rpm,(Math.round(pl.rpm/50)*50).toLocaleString('en-US')+' rpm');
  const f=clamp((pl.rpm-1200)/7700,0,1);
  if(Math.abs(f-revShown)>.004){revShown=f; el.revFill.style.transform='scaleX('+(1-f).toFixed(3)+')';}
  gapT-=dt;
  if(gapT<=0){
    gapT=.15;
    const d=(o.dist-pl.dist)/FT;
    if(mode==='race'&&(pl.go!=null||o.go!=null)) set(el.gapA,(d>0?'▲ ':'▼ ')+o.name+' '+Math.round(Math.abs(d))+' ft');
    else set(el.gapA,mode==='count'?'▲ '+o.name+' · next lane':'');
    set(el.gapB,'');
  }
}
// the tree, drawn at the top of the screen: two stage lights, three ambers, green, red. Then the trim light, mid-screen.
function dragOverlay(){
  if(!dg) return;
  dragTreeLights(); dragTrimLight();
}
function dragTreeLights(){
  const fade=mode==='count'?1:clamp(1-(wd.t-.5)/.35,0,1);
  if(fade<=0) return;
  ctx.setTransform(DPR,0,0,DPR,0,0); ctx.globalAlpha=fade;
  const x=W/2, y0=hudBottom+40, r=Math.min(16,W*.04), gap=r*2.5, pf=pl.go!=null&&pl.go<0;
  const lights=[['#fff4c0',dg.lit>=1,.65],['#fff4c0',dg.lit>=1,.65],['#ffb020',dg.lit===2,1],['#ffb020',dg.lit===2,1],['#ffb020',dg.lit===2,1],['#36e27a',dg.lit>=3&&!pf,1],['#ff3b30',pf,1]];
  ctx.fillStyle='rgba(6,20,26,.82)'; ctx.beginPath(); ctx.roundRect?ctx.roundRect(x-r*1.9,y0-r*1.6,r*3.8,gap*(lights.length-1)+r*3.2,r):ctx.rect(x-r*1.9,y0-r*1.6,r*3.8,gap*(lights.length-1)+r*3.2); ctx.fill();
  lights.forEach((L,i)=>{
    const y=y0+i*gap, rr=r*L[2];
    ctx.beginPath(); ctx.arc(x,y,rr,0,TAU);
    if(L[1]){ctx.shadowColor=L[0]; ctx.shadowBlur=rr*1.6; ctx.fillStyle=L[0];}
    else{ctx.shadowBlur=0; ctx.fillStyle='rgba(255,255,255,.1)';}
    ctx.fill(); ctx.shadowBlur=0;
  });
  ctx.globalAlpha=1;
}
function dragTrimLight(){
  if(pl.go!=null&&pl.fin==null&&mode!=='idle'){
    ctx.setTransform(DPR,0,0,DPR,0,0);
    const x=W/2, y=H*.56, R=Math.min(46,W*.12), on=pl.ton!=null;
    // three pips: how the trims went
    for(let i=0;i<TRIM_AT.length;i++){
      const r=pl.trims[i], px=x+(i-1)*26, py=y+R+26;
      ctx.beginPath(); ctx.arc(px,py,7,0,TAU);
      ctx.fillStyle=i>=pl.trims.length?'rgba(6,20,26,.5)':r==null?COL.red:r<.17?'#36e27a':COL.yellow; ctx.fill();
      ctx.lineWidth=2; ctx.strokeStyle='rgba(241,251,248,.8)'; ctx.stroke();
    }
    if(on){
      const a=wd.t-pl.ton, k=1-Math.min(1,a/TRIM_LATE);
      ctx.beginPath(); ctx.arc(x,y,R,0,TAU); ctx.fillStyle='rgba(6,20,26,.7)'; ctx.fill();
      ctx.beginPath(); ctx.arc(x,y,R*.82,0,TAU); ctx.shadowColor='#36e27a'; ctx.shadowBlur=R; ctx.fillStyle='#36e27a'; ctx.fill(); ctx.shadowBlur=0;
      // a ring that runs out: the time left to tap
      ctx.beginPath(); ctx.arc(x,y,R+5,-Math.PI/2,-Math.PI/2+TAU*k); ctx.lineWidth=5; ctx.strokeStyle='#f1fbf8'; ctx.stroke();
      ctx.font="italic 800 "+Math.round(R*.62)+"px 'Barlow Condensed','Arial Narrow',sans-serif"; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle='#06202a'; ctx.fillText('TAP',x,y+2);
    }
  }
}

//@arcade

// ---------- input ----------
function readInput(dt){
  const kS=(keys.right?1:0)-(keys.left?1:0);
  inp.brk=keys.lift?1:0;
  if(opt.ctrl==='slide'&&stick){
    // the bars follow the thumb: slide it left or right of where it landed. A second thumb is the brake.
    const dx=stick.x-stick.ox, a=Math.abs(dx)-5;
    inp.steer=a>0?clamp((dx<0?-a:a)/(SLIDE[opt.feel]||SLIDE.mid),-1,1):0; inp.dig=false;
    if(ptrs.size) inp.brk=1;
    return;
  }
  let L=keys.left, R=keys.right;
  if(opt.ctrl==='hold') for(const x of ptrs.values()){if(x<W/2)L=true;else R=true;}
  else if(ptrs.size) inp.brk=1;
  if(L!==padL){padL=L; el.padL.classList.toggle('on',L);}
  if(R!==padR){padR=R; el.padR.classList.toggle('on',R);}
  // A side held turns that way; both sides together is the brake. Thumbs that overlap for a moment while
  // swapping sides are not braking: until the overlap has lasted, the newer thumb steers.
  if(L&&R){
    bothT+=dt;
    if(bothT>.14){inp.steer=0; inp.brk=1;} else inp.steer=lastSide;
  }else{bothT=0; inp.steer=R?1:L?-1:kS;}
  inp.dig=true;
}

function spray(dt){
  for(const s of skis){
    if(s.v<90||parts.length>150) continue;
    const hard=Math.abs(s.lean)>.55||Math.abs(s.slip)>36, wet=s.rough>.45;
    if(!hard&&!wet) continue;
    if(Math.random()>dt*(hard?34:20)) continue;
    const c=Math.cos(s.h), sn=Math.sin(s.h), out=s.lean>0?-1:1, k=hard?out:(Math.random()<.5?-1:1);
    parts.push({x:s.x-c*12-sn*k*9,y:s.y-sn*12+c*k*9,vx:s.vx*.35-sn*k*70,vy:s.vy*.35+c*k*70,r:3+Math.random()*3,life:1,max:.35+Math.random()*.25});
  }
}

// ---------- frame ----------
const CFG={aids:true,rate:3.6,lock:1,help:HELP};
function update(dt){
  {const f=FEEL[opt.feel]||FEEL.mid; CFG.aids=opt.aids==='on'; CFG.rate=f[0]; CFG.lock=f[1];}
  clock+=dt; wd.env.t=clock;
  if(flashUntil&&clock>flashUntil){el.flash.className='flash';flashUntil=0;}
  if(resAt&&clock>=resAt){resAt=0; if(mode==='done') el.result.hidden=false;}
  readInput(dt);
  if(cele) celeStep(dt);
  if(gmode==='drag'){if(mode!=='idle') dragUpdate(dt);}
  else{
  if(mode==='count'){
    // three, two, one at a steady beat, then everyone goes
    countT+=dt;
    // as on a real line: the 2 card, the 1 card, then the band goes
    if(card<1&&countT>=.7){card=1; flash('2','big',800); blip(440,.12,'square',.1);}
    if(card<2&&countT>=1.8){card=2; flash('1','big',800); blip(440,.12,'square',.1);}
    if(countT>=3){
      mode='race'; wd.go=true; el.banner.hidden=true;
      flash('Go','big',650); blip(880,.35,'square',.14); buzz(30);
    }
  }
  if(mode==='podium'){if(cer) cer.t+=dt;}
  else if(mode!=='idle'){
    if(isArc()&&mode==='race') arcadePre(dt);
    if(mode==='race') playerDrive(pl,wd,dt,inp,CFG);
    else if(mode==='count'){pl.steer=0; pl.thr=0; pl.brk=0;}
    simStep(wd,dt);
    if(isArc()&&mode==='race') arcadeStep(dt);
    if(mode==='race'){
      if(pl.v>stat.vmax) stat.vmax=pl.v;
      const f=flowStep(pl,wd);
      if(f>0){
        stat.turns++;
        if(f===1){
          stat.clean++; blip(700+pl.flow*90,.07,'sine',.07); buzz(8);
          if(pl.flow>flowShown) flash(pl.flow===5?'Full flow':'Flow '+pl.flow,'',pl.flow===5?900:550);
        }
      }else if(f<0) blip(200,.2,'sawtooth',.1);
      if(pl.out>0){if(pl.out<=dt*1.5) stat.off++; flash('Off course','bad',300);}
      if(pl.resc!==rescSeen){rescSeen=pl.resc; flash('Back on course','',1100);}
      if(pl.lap!==lapSeen){
        if(pl.lap>lapSeen){
          const lt=wd.t-lapStart; lapStart=wd.t;
          if(!(bestLap>0)||lt<bestLap) bestLap=lt;
          if(pl.lap<LAPS) flash((pl.lap===LAPS-1?'White flag · last lap':'Lap '+(pl.lap+1)+' · '+fmt(lt)),'',1600);
        }
        lapSeen=pl.lap;
      }
      if(pl.bump>.27){shake=Math.max(shake,2.2); blip(90,.12,'sine',.2);}
      if(pl.lands!==landSeen){
        // back on the water: a thump, and a warning if the bars were turned when it came down
        landSeen=pl.lands; shake=Math.max(shake,Math.min(5,pl.land*.07)); blip(70,.1,'sine',Math.min(.22,pl.land*.004));
        if(pl.land>18&&pl.crook>.7){stat.rough++; flash('Rough landing','bad',700); buzz(18);}
      }
      if(pl.fin!=null) finish();
    }
    if(!G.on) spray(dt);
  }
  }

  for(let i=parts.length-1;i>=0;i--){
    const p=parts[i]; p.life-=dt/p.max; p.x+=p.vx*dt; p.y+=p.vy*dt;
    if(p.life<=0){parts[i]=parts[parts.length-1];parts.pop();}
  }
  for(const g of TURNS) if(g.wob>0) g.wob=Math.max(0,g.wob-dt*2.5);
  shake=calm?0:Math.max(0,shake-dt*22);

  // Camera. The view follows the course, not the bars: the lane ahead always runs up the screen, so left is left and
  // right is right, and a tap on the bars turns the ski without swinging the whole picture.
  const zr=viewZoom(); let zt;
  if(mode==='idle'){
    idleS=(idleS+dt*4)%N;
    const i=Math.floor(idleS), p=PATH[i], f=Math.min(1,dt*2);
    camX+=(p.x-camX)*f; camY+=(p.y-camY)*f; camA+=angDiff(PATH[(i+10)%N].h,camA)*Math.min(1,dt*.9); zt=zr*.8;
  }else{
    const a=PATH[(pl.idx+2+Math.round(pl.v*.4/DS))%N].h, f=Math.min(1,dt*16);
    camA+=angDiff(a,camA)*Math.min(1,dt*2.5);
    camX+=(pl.x-camX)*f; camY+=(pl.y-camY)*f;
    zt=zr*(mode==='count'?.92:1-.04*pl.v/VMAX);
  }
  zoom+=(zt-zoom)*Math.min(1,dt*1.5);
  hud(dt);
}

function hud(dt){
  if(gmode==='drag'){dragHud(dt); return;}
  if(gmode==='crates'){set(el.pos,String(arc?arc.got:0)); set(el.lap,String(arc?Math.max(0,arc.lives):3)); set(el.time,fmt(mode==='done'?finT:mode==='race'?wd.t:0)); set(el.mph,String(Math.round(pl.v*MPH))); set(el.gapA,''); set(el.gapB,''); return;}
  const racing=mode==='race', t=mode==='done'?finT:racing?wd.t:0;
  set(el.pos,String(racing||mode==='done'?place():1));
  set(el.time,fmt(t));
  set(el.lap,String(clamp(pl.lap+1,1,LAPS)));
  set(el.mph,String(Math.round(pl.v*MPH)));
  set(el.rpm,(Math.round(pl.rpm/50)*50).toLocaleString('en-US')+' rpm');
  const f=clamp((pl.rpm-1200)/7700,0,1);
  if(Math.abs(f-revShown)>.004){revShown=f; el.revFill.style.transform='scaleX('+(1-f).toFixed(3)+')';}
  if(pl.flow!==flowShown){
    flowShown=pl.flow;
    for(let i=0;i<5;i++) el.flow.children[i+1].className=i<pl.flow?'on':'';
  }
  gapT-=dt;
  if(gapT<=0){
    gapT=.25; tagA=tagB=null;
    if(racing){
      const me=pl.lap*N+pl.idx, sp=Math.max(110,pl.v); let ad=1e12, bd=1e12;
      for(const s of ais){
        const d=(s.fin!=null?1e9:s.lap*N+s.idx)-me;
        if(d>0&&d<ad){ad=d;tagA=s;}
        if(d<=0&&-d<bd){bd=-d;tagB=s;}
      }
      set(el.gapA,tagA?'▲ '+tagA.name+(ad<1e8?' '+(ad*DS/sp).toFixed(1):''):'▲ Leading');
      set(el.gapB,tagB?'▼ '+tagB.name+' '+(bd*DS/sp).toFixed(1):'');
    }else{set(el.gapA,''); set(el.gapB,'');}
  }
}

//@draw
//@r3
//@party

function resize(){
  // level 3 draws at the screen's full pixel density (3 on recent iPhones); a device that cannot hold the frame rate steps down
  DPR=Math.min(QUAL>2?3:QUAL>1?2:QUAL?1.5:G.on?1:1.1,window.devicePixelRatio||1);
  W=cv.clientWidth||window.innerWidth||390; H=cv.clientHeight||window.innerHeight||700;
  cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR);
  const r=el.hud.getBoundingClientRect(); hudBottom=(r&&r.bottom>20?r.bottom:98)-16;
  if(G.on){G.r.setPixelRatio(DPR); G.r.setSize(W,H,false); G.cam.aspect=W/H; G.cam.updateProjectionMatrix(); return;}
  // sunlight and vignette are smooth, so they are painted small and stretched over the frame
  {const w=Math.ceil(W/3), h=Math.ceil(H/3), c=mk(w,h), x=c.getContext('2d');
   let g=x.createRadialGradient(w*.1,-h*.06,0,w*.1,-h*.06,Math.hypot(w,h)*.85);
   g.addColorStop(0,'rgba(255,243,212,.26)'); g.addColorStop(.4,'rgba(255,243,212,.07)'); g.addColorStop(1,'rgba(255,243,212,0)');
   x.fillStyle=g; x.fillRect(0,0,w,h);
   g=x.createRadialGradient(w/2,h*.6,Math.min(w,h)*.35,w/2,h*.6,Math.hypot(w,h)*.72);
   g.addColorStop(0,'rgba(6,32,42,0)'); g.addColorStop(1,'rgba(6,32,42,.4)');
   x.fillStyle=g; x.fillRect(0,0,w,h); lightCv=c;}
  // tiles are painted at about the sharpness the race camera shows them
  const ts=clamp(viewZoom()*DPR,.8,1.5);
  if(Math.abs(ts-TS)>.01){TS=ts; tiles.clear();}
}

// ---------- setup plate ----------
function miniBar(v,lo,hi){
  const bar=document.createElement('span'); bar.className='bar';
  const fill=document.createElement('b'); fill.style.width=Math.round(clamp((v-lo)/(hi-lo),.05,1)*100)+'%';
  bar.appendChild(fill); return bar;
}
function summary(){
  const r=RACERS[sel.r], c=CRAFTS[sel.c];
  const where=gmode==='drag'?'Drag strip, 1,000 ft':gmode==='crates'?SITES[sel.s].name+' crate run':gmode==='items'?SITES[sel.s].name+' item race':gmode==='tour'?'Tour, round '+(tStop()+1)+' of '+TOUR.length+', moto '+(tour.round%2+1):SITES[sel.s].name;
  set(el.setup,r.full+' #'+r.num+' · '+c.name+' · '+where+' · '+CLASSES[gar.cls].name+' class · '+money(gar.cash));
  // what this rider on this craft adds up to
  el.ride.textContent='';
  const gm=playerMod();
  for(const m of [['Speed',c.top*gm.top,.88,1.12],['Launch',c.acc*r.launch*gm.acc*gm.launch,.7,1.6],['Turning',c.turn*r.corner*gm.turn,.8,1.45],['Rough water',c.stab*r.chopR*gm.stab,.76,1.85]]){
    const d=document.createElement('div'), s=document.createElement('span'); s.textContent=m[0];
    d.append(s,miniBar(m[1],m[2],m[3])); el.ride.appendChild(d);
  }
}
function press(sel0,i){
  const opts=el.list.querySelectorAll(sel0);
  for(let j=0;j<opts.length;j++) opts[j].setAttribute('aria-pressed',String(j===i));
}
function craftIcon(sh){
  const NS='http://www.w3.org/2000/svg', svg=document.createElementNS(NS,'svg'), B=sh.B, b=(B*.84).toFixed(1);
  svg.setAttribute('viewBox','-25 -13 54 26'); svg.setAttribute('class','cf'); svg.setAttribute('aria-hidden','true');
  const p=document.createElementNS(NS,'path');
  p.setAttribute('d','M'+sh.L+' 0Q'+sh.bow+' '+(-B)+' -6 '+(-B)+'L'+(-sh.S)+' -'+b+'L'+(-sh.S)+' '+b+'L-6 '+B+'Q'+sh.bow+' '+B+' '+sh.L+' 0Z');
  p.setAttribute('fill','currentColor');
  const r=document.createElementNS(NS,'rect');
  r.setAttribute('x',String(1-sh.seat)); r.setAttribute('y','-4'); r.setAttribute('width',String(sh.seat)); r.setAttribute('height','8');
  svg.append(p,r); return svg;
}
const siteShapes=[];
// a thumbnail of the course for the site list
function siteIcon(i){
  if(!siteShapes[i]){
    const C=buildCourse(SITES[i],false); let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    for(const p of C.path){if(p.x<x0)x0=p.x;if(p.x>x1)x1=p.x;if(p.y<y0)y0=p.y;if(p.y>y1)y1=p.y;}
    const k=46/(y1-y0), pts=[];
    for(let j=0;j<C.N;j+=5){const p=C.path[j]; pts.push(((p.x-x0)*k+3).toFixed(1)+','+((p.y-y0)*k+3).toFixed(1));}
    siteShapes[i]={pts:pts.join(' '),w:Math.ceil((x1-x0)*k+6)};
  }
  const NS='http://www.w3.org/2000/svg', svg=document.createElementNS(NS,'svg'), sh=siteShapes[i];
  svg.setAttribute('viewBox','0 0 '+sh.w+' 52'); svg.setAttribute('class','ci'); svg.setAttribute('aria-hidden','true');
  const pg=document.createElementNS(NS,'polygon');
  pg.setAttribute('points',sh.pts); pg.setAttribute('fill','none'); pg.setAttribute('stroke','currentColor');
  pg.setAttribute('stroke-width','3'); pg.setAttribute('stroke-linejoin','round');
  svg.appendChild(pg); return svg;
}
function syncOpts(){
  const bs=document.querySelectorAll('[data-k]');
  for(let i=0;i<bs.length;i++) bs[i].setAttribute('aria-pressed',String(opt[bs[i].getAttribute('data-k')]===bs[i].getAttribute('data-v')));
  for(const r of RIV) $('rv'+r).setAttribute('aria-pressed',String(r===riv));
  el.lvLabel.textContent=riv==='auto'?'Rivals: Auto, now at '+paceName(autoPace)+' pace':'Rivals: '+LEVELS[+riv].name;
  document.body.classList.toggle('pads',opt.ctrl==='hold');
}
function setOpt(k,v){
  opt[k]=v; store('o8.'+k,v);
  if(k==='ctrl'){stick=null; ptrs.clear();}
  if(k==='sound'&&v==='on'){audioInit(); try{if(snd.ac) snd.ac.resume();}catch(e){}}
  syncOpts();
}
function buildOpts(box,pre){
  for(const o of OPTS){
    const row=document.createElement('div'); row.className='orow';
    const lab=document.createElement('div'); lab.className='eyebrow'; lab.textContent=o[1];
    const seg=document.createElement('div'); seg.className='tabs '+(o[2].length===3?'three':'two');
    o[2].forEach(c=>{
      const b=document.createElement('button'); b.type='button'; b.className='tab'; b.id=pre+o[0]+c[0];
      b.setAttribute('data-k',o[0]); b.setAttribute('data-v',c[0]); b.textContent=c[1];
      b.addEventListener('click',()=>setOpt(o[0],c[0]));
      seg.appendChild(b);
    });
    row.append(lab,seg); box.appendChild(row);
  }
}
function refreshSetup(){
  const t=gmode==='tour', live=t&&tourLive();
  const dr=gmode==='drag';
  el.modeS.setAttribute('aria-pressed',String(gmode==='single')); el.modeT.setAttribute('aria-pressed',String(t)); el.modeD.setAttribute('aria-pressed',String(dr)); el.modeI.setAttribute('aria-pressed',String(gmode==='items')); el.modeC.setAttribute('aria-pressed',String(gmode==='crates'));
  el.tabS.textContent=t?'Stops':'Site'; el.tabS.disabled=dr;
  el.go.textContent=dr?(ladder.round?'Run the '+ROUNDS[ladder.round].toLowerCase()+' vs '+RACERS[ladder.opp[ladder.round]].name:'Start the ladder'):gmode==='items'?'Start item race':gmode==='crates'?'Start crate run':!t?'Start race':live?(tour.round%2?'Start moto 2':'Start round '+(tStop()+1)):'Start tour';
  el.quit.hidden=!live||dr; el.quit.textContent='Abandon tour'; quitArm=false;
  syncOpts(); summary(); showTab(tab);
}
function setMode(m){
  gmode=m; store('mode',m); hudLabels(); document.body.classList.toggle('drag',m==='drag');
  if(m==='tour'&&tourLive()){sel.r=tour.r; sel.c=tour.c;}
  stage(); refreshSetup();
}
function showTab(t){
  if(gmode==='drag'&&t==='s') t='r';
  tab=t;
  for(const k of ['R','C','G','S','H']) el['tab'+k].setAttribute('aria-pressed',String(k.toLowerCase()===t));
  el.rules.hidden=t!=='h'; el.list.hidden=t==='h'||t==='g'; el.garage.hidden=t!=='g';
  if(t==='g'){buildGarage(); el.panel.scrollTop=0; return;}
  el.list.textContent=''; el.list.className='list'+(t==='c'?' craft':''); el.panel.scrollTop=0;
  if(t==='h') return;
  const inTour=gmode==='tour';
  if(t==='s'&&inTour){
    const cur=Math.floor(tour.round/2);
    TOUR.forEach((st,i)=>{
      const s=SITES[st[0]], d=document.createElement('div'); d.className='opt site'+(i===cur?' cur':'');
      const l=document.createElement('span'); l.textContent=s.name;
      const sm=document.createElement('small'); sm.textContent='Round '+(i+1)+' · two motos · '+s.laps+' laps each'; l.appendChild(sm);
      const n=document.createElement('span'); n.className='laps'; n.textContent=i<cur?(tour.hist[i]?ordinal(tour.hist[i])+' overall':'Done'):i===cur?(tour.round%2?'Moto 2 next':'Next'):'';
      d.append(siteIcon(st[0]),l,n); el.list.appendChild(d);
    });
    if(tour.round>0){
      const p=document.createElement('p'); p.className='fine';
      p.textContent='You are '+ordinal(tourOrder().indexOf(tour.r)+1)+' with '+tour.pts[tour.r]+' points.';
      el.list.appendChild(p);
    }
    return;
  }
  if(t==='s'){
    SITES.forEach((s,i)=>{
      const b=document.createElement('button'); b.type='button'; b.className='opt site'; b.id='optS'+i;
      b.setAttribute('aria-pressed',String(i===sel.s));
      const l=document.createElement('span'); l.textContent=s.name;
      const d=document.createElement('small'); d.textContent=s.sub; l.appendChild(d);
      const n=document.createElement('span'); n.className='laps'; n.textContent=s.laps+' laps';
      const best=parseFloat(load('v12.best.'+s.id));
      if(best>0){const sm=document.createElement('small'); sm.textContent='Best '+fmt(best); n.appendChild(sm);}
      b.append(siteIcon(i),l,n);
      b.addEventListener('click',()=>{sel.s=i; store('site',i); press('.opt',i); loadSite(i,false); summary();});
      el.list.appendChild(b);
    });
    return;
  }
  const racer=t==='r', items=racer?RACERS:CRAFTS, stats=racer?RSTAT:CSTAT, cur=racer?sel.r:sel.c, locked=inTour&&tourLive();
  el.list.style.setProperty('--k',String(stats.length));
  if(locked){
    const p=document.createElement('p'); p.className='fine'; p.textContent='Racer and craft are locked until this tour ends.';
    el.list.appendChild(p);
  }
  const head=document.createElement('div'); head.className='cols';
  head.appendChild(document.createElement('span'));
  for(const st of stats){const s=document.createElement('span'); s.textContent=st[1]; head.appendChild(s);}
  el.list.appendChild(head);
  items.forEach((it,i)=>{
    const b=document.createElement('button'); b.type='button'; b.className='opt'; b.id='opt'+t.toUpperCase()+i;
    b.setAttribute('aria-pressed',String(i===cur)); b.disabled=locked;
    const nm=document.createElement('span'); nm.className='nm';
    if(racer){const sw=document.createElement('i'); sw.className='sw'; sw.style.background=it.hull; nm.appendChild(sw);}
    else nm.appendChild(craftIcon(it.sh));
    nm.appendChild(document.createTextNode(it.name));
    b.appendChild(nm);
    for(const st of stats) b.appendChild(miniBar(it[st[0]],st[2],st[3]));
    b.addEventListener('click',()=>{
      if(racer){sel.r=i; store('racer',i);}else{sel.c=i; store('craft',i);}
      press('.opt',i); summary(); if(mode==='idle') reset();
    });
    el.list.appendChild(b);
  });
  if(!racer){
    // paint for your own hull; the first dab keeps the racer's own colours
    const row=document.createElement('div'); row.className='paint';
    const lab=document.createElement('span'); lab.className='eyebrow'; lab.textContent='Paint'; row.appendChild(lab);
    for(let i=-1;i<PAINTS.length;i++){
      const d=document.createElement('button'); d.type='button'; d.className='dab'; d.id='paint'+(i+1);
      d.setAttribute('aria-pressed',String(i===sel.paint));
      if(i<0){d.textContent='Own'; d.setAttribute('aria-label','Racer colours');}
      else{d.style.background=PAINTS[i]; d.setAttribute('aria-label','Paint '+(i+1));}
      d.addEventListener('click',()=>{sel.paint=i; store('paint',i); press('.dab',i+1); if(mode==='idle') reset();});
      row.appendChild(d);
    }
    el.list.appendChild(row);
  }
}

// ---------- sound ----------
function audioInit(){
  if(snd.ac||opt.sound!=='on') return;
  try{
    const AC=window.AudioContext||window.webkitAudioContext, ac=new AC();
    const master=ac.createGain(); master.gain.value=.5; master.connect(ac.destination);
    const o1=ac.createOscillator(), o2=ac.createOscillator(), lp=ac.createBiquadFilter(), eg=ac.createGain();
    o1.type='sawtooth'; o2.type='square'; lp.type='lowpass'; lp.frequency.value=600; eg.gain.value=0;
    o1.connect(lp); o2.connect(lp); lp.connect(eg); eg.connect(master); o1.start(); o2.start();
    const len=ac.sampleRate, buf=ac.createBuffer(1,len,ac.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
    const ns=ac.createBufferSource(); ns.buffer=buf; ns.loop=true;
    const bp=ac.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=1800; bp.Q.value=.6;
    const wg=ac.createGain(); wg.gain.value=0;
    ns.connect(bp); bp.connect(wg); wg.connect(master); ns.start();
    snd.ac=ac; snd.master=master; snd.o1=o1; snd.o2=o2; snd.lp=lp; snd.eg=eg; snd.wg=wg;
  }catch(e){snd.ac=null;}
}
function audioFrame(){
  if(!snd.ac) return;
  try{
    const t=snd.ac.currentTime, live=opt.sound==='on'&&!paused&&(mode==='race'||mode==='count'), f=pl.rpm/60*1.5;
    snd.o1.frequency.setTargetAtTime(f,t,.04); snd.o2.frequency.setTargetAtTime(f*.5,t,.04);
    snd.lp.frequency.setTargetAtTime(350+pl.rpm*.18,t,.05);
    snd.eg.gain.setTargetAtTime(live?.05+.07*pl.thr:0,t,.06);
    snd.wg.gain.setTargetAtTime(live?.06*Math.min(1,pl.v/VMAX)*(1+pl.rough):0,t,.1);
  }catch(e){}
}
function blip(freq,dur,type,vol){
  if(!snd.ac||opt.sound!=='on') return;
  try{
    const ac=snd.ac, t=ac.currentTime, o=ac.createOscillator(), g=ac.createGain();
    o.type=type||'sine'; o.frequency.value=freq;
    g.gain.setValueAtTime(vol||.2,t); g.gain.exponentialRampToValueAtTime(.001,t+dur);
    o.connect(g); g.connect(snd.master); o.start(t); o.stop(t+dur+.02);
  }catch(e){}
}

// ---------- loop and listeners ----------
let last=0;
function frame(ts){
  const raw=Math.min(.1,(ts-last)/1000||.016); last=ts;
  // A device that cannot hold the frame rate loses the moving shimmer and some sharpness, a step at a time. This is watched
  // from the setup screen on, so the picture has usually settled before the first race, and the answer is remembered.
  if(QUAL>0&&!paused){
    if(calmT>0) calmT-=raw;                      // a course that has just loaded is still painting its tiles: not a fair sample
    else{
      ftAvg+=(raw-ftAvg)*.05;
      slowT=ftAvg>(mode==='race'?.022:.02)?slowT+raw:0;
      if(slowT>1.1){QUAL--; slowT=0; ftAvg=.016; calmT=.7; store(G.on?'o17.q':'o8.q',QUAL); resize();}
    }
  }
  if(!paused){
    // the race always advances in the same small steps, so the ski handles the same at any frame rate
    acc+=raw; let n=0;
    while(acc>=STEP&&n<12){update(STEP); acc-=STEP; n++;}
    if(acc>=STEP) acc=0;
    audioFrame();
  }
  if(G.on) render3(); else render();
  if(gmode==='drag'&&mode!=='idle') dragOverlay();
  if(isArc()&&mode!=='idle') arcadeOverlay();
  requestAnimationFrame(frame);
}
function key(e,d){
  const k=e.key;
  if(k==='ArrowLeft'||k==='a'||k==='A'){keys.left=d; if(d) lastSide=-1;}
  else if(k==='ArrowRight'||k==='d'||k==='D'){keys.right=d; if(d) lastSide=1;}
  else if(k==='ArrowDown'||k==='s'||k==='S') keys.lift=d;
  else if(gmode==='items'&&(k==='ArrowUp'||k==='w'||k==='W'||k===' ')){if(d&&!e.repeat&&mode==='race') useItem(pl); if(mode==='race'||mode==='count'){e.preventDefault(); return;}}
  else if(k==='ArrowUp'||k==='w'||k==='W'||(k===' '&&gmode==='drag'&&(mode==='count'||mode==='race'))){if(d&&!e.repeat&&!keys.gas) taps++; keys.gas=d;}
  else if(d&&(k==='p'||k==='P'||k==='Escape')){if(paused) resumeGame(); else pauseGame(); return;}
  else if(d&&(k===' '||k==='Enter')){
    if(e.target&&e.target.tagName==='BUTTON') return;
    if(mode==='podium'){e.preventDefault(); endCeremony();}
    else if(mode==='idle'||mode==='done'){e.preventDefault(); if(mode==='done'&&resAction) resAction(); else startCountdown();}
    return;
  }else return;
  e.preventDefault();
}
window.addEventListener('keydown',e=>key(e,true));
window.addEventListener('keyup',e=>key(e,false));
window.addEventListener('blur',()=>{keys.left=keys.right=keys.lift=keys.gas=false; ptrs.clear(); stick=null;});
document.addEventListener('visibilitychange',()=>{if(document.hidden) pauseGame();});
cv.addEventListener('pointerdown',e=>{
  if(gmode==='items'&&mode==='race'){const b=itemBtn(); if(Math.hypot(e.clientX-b.x,e.clientY-b.y)<b.r+10){useItem(pl); e.preventDefault(); return;}}
  if(mode==='race'||mode==='count'){
    taps++;
    if(opt.ctrl==='slide'&&!stick) stick={id:e.pointerId,ox:e.clientX,oy:e.clientY,x:e.clientX};
    else{ptrs.set(e.pointerId,e.clientX); lastSide=e.clientX<W/2?-1:1;}
  }
  try{cv.setPointerCapture(e.pointerId);}catch(err){}
  e.preventDefault();
});
cv.addEventListener('pointermove',e=>{
  if(stick&&e.pointerId===stick.id){
    stick.x=e.clientX;
    // the track follows a thumb that slides past its end, so coming back steers at once
    const R=(SLIDE[opt.feel]||SLIDE.mid)+5, dx=stick.x-stick.ox;
    if(dx>R) stick.ox=stick.x-R; else if(dx<-R) stick.ox=stick.x+R;
  }else if(ptrs.has(e.pointerId)) ptrs.set(e.pointerId,e.clientX);
});
for(const t of ['pointerup','pointercancel','lostpointercapture']) cv.addEventListener(t,e=>{
  if(stick&&e.pointerId===stick.id) stick=null;
  ptrs.delete(e.pointerId);
});
cv.addEventListener('contextmenu',e=>e.preventDefault());
el.go.addEventListener('click',startCountdown);
el.again.addEventListener('click',()=>resAction());
el.swap.addEventListener('click',backToSetup);
el.podBtn.addEventListener('click',racePodium);
el.cerGo.addEventListener('click',endCeremony);
el.pauseBtn.addEventListener('click',pauseGame);
el.resume.addEventListener('click',resumeGame);
el.restart.addEventListener('click',startCountdown);
el.toSetup.addEventListener('click',backToSetup);
el.modeS.addEventListener('click',()=>setMode('single'));
el.modeT.addEventListener('click',()=>setMode('tour'));
el.modeD.addEventListener('click',()=>setMode('drag'));
el.modeI.addEventListener('click',()=>setMode('items'));
el.modeC.addEventListener('click',()=>setMode('crates'));
el.quit.addEventListener('click',()=>{
  if(!quitArm){quitArm=true; el.quit.textContent='Tap again to abandon'; return;}
  tour=freshTour(); saveTour(); stage(); refreshSetup();
});
for(const k of ['r','c','g','s','h']) el['tab'+k.toUpperCase()].addEventListener('click',()=>showTab(k));
for(const r of RIV) $('rv'+r).addEventListener('click',()=>{
  riv=r; store('o10.riv',r); syncOpts(); if(mode==='idle') reset();
});
window.addEventListener('resize',resize);

const pick=(k,n,dflt)=>{const v=parseInt(load(k),10); return v>=0&&v<n?v:dflt;};
sel.r=pick('racer',RACERS.length,RACERS.length-1);   // a new player rides as Dustin
sel.c=pick('craft',CRAFTS.length,0); sel.s=pick('site',SITES.length,0);
sel.paint=pick('paint',PAINTS.length,-1);
{const r=load('o10.riv'), a=parseFloat(load('o8.pace')); if(RIV.indexOf(r)>=0) riv=r; if(a>=0&&a<=1) autoPace=a;}
for(const o of OPTS){const v=load('o8.'+o[0]); if(o[2].some(c=>c[0]===v)) opt[o[0]]=v;}
loadTour(); loadGar();
{const m=load('mode'); gmode=['tour','drag','items','crates'].indexOf(m)>=0?m:'single';}
document.body.classList.toggle('drag',gmode==='drag'); newLadder();
if(gmode==='tour'&&tourLive()){sel.r=tour.r; sel.c=tour.c;}
buildOpts(el.optsMore,'m'); buildOpts(el.optsPause,'p');
resAction=startCountdown;
G.on=g3Init(); gcv.hidden=!G.on; if(G.on) g3Models(); QUAL=G.on?pick('o17.q',4,3):pick('o8.q',3,2);
if(!G.on) buildSprites();
resize(); stage(); refreshSetup(); resize();
requestAnimationFrame(frame);
