// ---------- the screen ----------
// Joined into city.js at //@ui. Who is where at what hour, the pop-ups that show what a tap just did, the morning recap, the list
// of what to do next, and the five tabs (Here, Map, Hustles, People, You) plus the phone. The game itself stays in city.js and
// street.js; this only shows it.

// ---- who is where ----
// Each person keeps hours: [place, from, until, which days]. The first that fits the hour wins; nobody is in two places at once.
const SCHED={
 rosa:[["diner",6,22]],
 kow:[["diner",6,10]],
 nia:[["home",5,11,()=>S.q.nia===3],["diner",11,13,d=>d%2===0],["gym",16,18,d=>d%7===2],["bar",18,4]],
 dex:[["bar",18,21],["docks",21,4]],
 marcus:[["court",6,9],["lake",9,20]],
 sal:[["pawn",9,19],["bar",20,23,d=>d%3===0]],
 june:[["gym",6,24]],
 tommy:[["diner",6,8],["garage",8,18]]};
function where(k){if(gone(k))return null;if(hapOn("party")&&["nia","marcus","june"].includes(k))return "court";for(const [at,a,b,f] of SCHED[k]||[])if(isOpen([a,b],S.h)&&(!f||f(S.day)))return at;return null}
const present=at=>Object.keys(P).filter(k=>where(k)===at);
const moodOf=k=>stage(k)<0?"cold":pp(k).mood;
const usual=k=>{const s=(SCHED[k]||[]).find(x=>!x[3])||SCHED[k][0];return L[s[0]].n+" · "+fmtH(s[1])+"–"+fmtH(s[2])};
function talkTo(k){if(S.over||open())return;if(k==="dex")return dex();hang(k)}

// ---- what just changed ----
// A snapshot before a tap and one after: the difference becomes the pop-ups. Overnight changes go to the morning recap instead.
function snap(){const p={};for(const k in P){const q=pp(k);p[k]=[q.b,q.t,q.met]}return {cash:S.cash,heat:S.heat,rep:S.rep,f:S.cl.f,lv:Object.keys(SK).map(lvl),p,day:S.day}}
function deltas(a,b){
  const t=[],d=(x,y)=>Math.round(y-x);
  const c=d(a.cash,b.cash);if(c)t.push([c>0?"gain":"loss",(c>0?"+":"−")+$$(Math.abs(c)),"cash"]);
  const h=d(a.heat,b.heat);if(h)t.push([h>0?"heat":"cool","Heat "+(h>0?"+":"−")+Math.abs(h),"heat"]);
  const rp=d(a.rep,b.rep);if(rp)t.push([rp>0?"up":"down","Rep "+(rp>0?"+":"−")+Math.abs(rp),"rep"]);
  const f=d(a.f,b.f);if(f)t.push([f>0?"up":"down",(f>0?"+":"−")+Math.abs(f).toLocaleString()+" followers","cam"]);
  Object.keys(SK).forEach((k,i)=>{if(b.lv[i]>a.lv[i])t.push(["lvl",SK[k]+" level "+b.lv[i],"star"])});
  if(a.day!==b.day)return t;
  for(const k in P){const [b0,t0,m0]=a.p[k],[b1,t1,m1]=b.p[k];if(!m1)continue;
    if(!m0){t.push(["met","Met "+P[k].n,null,k]);continue}
    const db=d(b0,b1),dt=d(t0,t1);
    if(db||dt)t.push([db+dt>=0?"up":"down",P[k].n+(db?` · bond ${db>0?"▲":"▼"}${Math.abs(db)}`:"")+(dt?` · trust ${dt>0?"▲":"▼"}${Math.abs(dt)}`:""),null,k])}
  return t;
}
function toast(list){
  const box=$("toasts");if(!box||!list.length)return;
  for(const [cls,txt,ic,who] of list.slice(0,6)){
    const el=document.createElement("div");el.className="toast "+cls;
    el.innerHTML=(who?face(who,moodOf(who),24):ic?ico(ic):"")+"<span>"+txt+"</span>";
    box.appendChild(el);setTimeout(()=>{el.classList.add("out");setTimeout(()=>el.remove(),450)},2800);
  }
  while(box.children.length>6)box.firstChild.remove();
  sfx(list.map(x=>x[0]));
}
// Short synth sounds for money, heat and level-ups. Off with the speaker button in You.
let AC=null;
const sndOn=()=>{try{return localStorage.getItem("shc.snd")!=="0"}catch(e){return true}};
function tone(f,t0,d,type,v){if(!AC)return;const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime+t0;o.type=type||"sine";o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v||.06,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d+.05)}
function sfx(k){
  if(!AC||!sndOn())return;const has=x=>k.includes(x);
  if(has("lvl")){[523,659,784,1047].forEach((f,i)=>tone(f,i*.07,.18,"triangle",.05));return}
  if(has("gain")){tone(1319,0,.09,"square",.03);tone(1760,.07,.16,"square",.03)}
  else if(has("loss"))tone(196,0,.18,"sawtooth",.035);
  if(has("heat")){tone(740,.02,.14,"triangle",.04);tone(560,.17,.14,"triangle",.04)}
}

// ---- what to do next ----
// Built fresh from the state on every render: race day, promises, texts, rent, Sal, a clip to post, story beats waiting
// elsewhere in the city (actions marked 2 in A()), and a nudge or two when nothing is pressing. Highest priority first.
let GL=[];
const NEEDAT={shift_diner:"diner",fix_walkin:"diner",shift_garage:"garage",see_nia:"bar",help_marcus:"garage",race:"lake",train:"gym",fight:"gym",nightrun:"docks",respray:"garage"};
function goals(){
  const g=[],I=HS.info(),today=S.day-(S.h<5?1:0),add=(pri,ic,t,s,at,who)=>g.push({pri,ic,t,s,at,who});
  if(I.round<I.total){const d=motoDay(I.round);
    if(d===S.day)add(S.h<20?100:15,"flag",(I.mid?"Moto 2 of round ":"Race day: round ")+(I.round+1),I.next+" · at the Lake by 8pm","lake");
    else if(d>S.day)add(d-S.day<=1?70:30,"flag","Round "+(I.round+1)+" on day "+d,I.next+(I.round?" · you're "+ord(I.pos)+" in the series":""),"lake")}
  for(const pr of S.proms){const a=ASK[pr.id];add(90,"msg",a.what,pr.due>today?"by tomorrow night":"by tonight",NEEDAT[a.need]||null,a.who)}
  if(S.inbox.length)add(85,"msg",S.inbox.length+(S.inbox.length>1?" texts":" text")+" waiting","open your phone","phone",ASK[S.inbox[0].id].who);
  {let nr=S.day+1;while(!rentDay(nr))nr++;const a=rentAmt();if(a){const dl=nr-S.day;add(S.cash<a?(dl<=2?95:55):22,"here","Rent "+$$(a)+" due day "+nr,S.cash>=a?"you've got it covered":"you're "+$$(a-S.cash)+" short",null)}}
  if(S.loan)add(S.loan.due-S.day<=1?92:50,"cash","Pay Sal back "+$$(S.loan.amt),"by day "+S.loan.due,"pawn","sal");
  if(S.cl.clip)add(40,"cam","Post your clip","“"+S.cl.clip.t+"”","clout");
  {const h=hap();if(h&&(h.from>h.to?S.h<h.to||S.h<24:S.h<h.to))add(hapOn(S.hap.id)?60:45,"radio",h.n,h.s,h.at)}
  const here=S.at;
  for(const k in L){if(k===here||!isOpen(L[k].o,S.h))continue;S.at=k;let acts=[];try{acts=A()}catch(e){}S.at=here;
    for(const a of acts)if(a.hot===2&&a.ok)add(75,"alert",a.n,L[k].n,k,WHO[k])}
  S.at=here;
  if(ASP[S.asp]&&g.length<5)add(20,ASP[S.asp].ic,"Aim: "+ASP[S.asp].n,ASP[S.asp].line(),ASP[S.asp].at);
  if(g.length<4){
    if(!pp("tommy").met)add(12,"wrench","Meet Tommy at the garage","he hires, and he builds your ski","garage","tommy");
    else if(!S.car&&S.cash>=1200)add(12,"ski","Buy Tommy's old truck","$1,200 · no more walking","garage");
    if(!pp("dex").met&&S.day>=2)add(10,"alert","Who's in the Low End's back booth?","after 6pm","bar","dex");
    if(!pp("nia").met)add(8,"people","Get a drink at the Low End","Nia hears everything","bar","nia");
    if(lvl("wrench")>=1&&S.tn.jobs<1&&pp("tommy").met)add(11,"wrench","Take a tuning job at Tommy's","customers pay for a reflash","garage","tommy");
  }
  return g.sort((a,b)=>b.pri-a.pri);
}
const goalBtn=(x,cls)=>{const tgt=x.at==="phone"?' data-app="msgs"':x.at==="clout"?' data-app="clout"':x.at?` data-go="${x.at}"`:"";
  return `<button class="goal${cls?" "+cls:""}"${tgt}${tgt?"":" disabled"}>${x.who?face(x.who,moodOf(x.who),30):`<i class="gi">${ico(x.ic)}</i>`}<span><b>${x.t}</b><small>${x.s}</small></span>${tgt?ico("pin","goic"):""}</button>`};

// ---- generic buttons ----
// Buttons drawn this render that run a function carry data-x, an index into XA. XA is rebuilt on every render.
let XA=[];const xa=fn=>{XA.push(fn);return XA.length-1};

// ---- the top bar ----
let lastCash=null;
function hud(){
  const n=dark(S.h),st=Math.ceil(S.heat/20);
  $("clock").innerHTML=ico(n?"moon":"sun","sky")+`<span>Day ${S.day} · ${fmtH(S.h)}</span>`;
  const c=$("cash");c.textContent=$$(S.cash);if(lastCash!==null&&lastCash!==S.cash){c.classList.remove("bump","drop");void c.offsetWidth;c.classList.add(S.cash>lastCash?"bump":"drop")}lastCash=S.cash;
  $("stars").innerHTML=Array.from({length:5},(_,i)=>ico("star",i<st?"on":"")).join("");$("stars").setAttribute("aria-label","Wanted level "+st+" of 5");
  const nt=S.inbox.length;$("badge").textContent=nt||"";$("phone").classList.toggle("new",!!nt);
  $("meters").innerHTML=[["Energy",S.en,"#7ff0b8","bolt"],["Food",S.food,"#ffd166","food"],["Mood",S.mood,"#8ecbff","mood"],["Rep",S.rep,"#f1efe9","rep"],["Heat",S.heat,"#ff3d7f","heat"]]
    .map(([nm,v,col,ic])=>`<div class="m${v<20&&nm!=="Heat"&&nm!=="Rep"?" low":""}${nm==="Heat"&&v>=60?" low":""}" style="--c:${col}"><span>${ico(ic)}${nm}<b>${Math.round(v)}</b></span><div class="bar"><i style="width:${v}%"></i></div></div>`).join("");
}

// ---- Here: the place you're in ----
function hereView(){
  const p=L[S.at],op=isOpen(p.o,S.h),acts=op?A():[],who=present(S.at),I=HS.info(),rd=I.round<I.total&&S.day===motoDay(I.round),all=p.o[1]-p.o[0]===24;
  render.acts=acts;
  const so={pad:S.z.pad,bed:S.home.bed,tv:S.home.tv,fridge:S.home.fridge,safe:S.home.safe,cactus:S.q.nia===3,closed:!op,race:rd&&S.at==="lake",chop:S.chop,vance:S.z.v>=1&&S.z.v<9,fight:S.at==="gym"&&S.h>=21,lost:S.q.rosa===5,party:S.at==="court"&&hapOn("party"),boat:S.at==="lake"&&hapOn("boat")};
  const hrs=all?"always open":op?(S.at==="lake"&&rd?"race day · till 8pm":"open · till "+fmtH(p.o[1])):"closed · opens "+fmtH(p.o[0]);
  const desc=S.at==="garage"&&S.gar?"Yours now. Tommy still shows up at eight out of habit. Parts are at cost.":S.at==="diner"&&S.q.rosa===5?"Sal's nephew is on the grill. The coffee got worse.":S.at==="home"&&S.z.pad?PAD[S.z.pad][3]:p.d;
  // a mood line is written for the person's own spot (Nia's is about the bar), so it shows only there
  const ow=WHO[S.at],ml=op&&ow&&who.includes(ow)&&stage(ow)>=0&&pp(ow).met?P[ow].mood[pp(ow).mood]:"";
  const last=S.log[0],nx=GL.find(x=>x.at!==S.at&&x.pri>=30);
  // The picture of the place stays on the page between redraws (sceneSync in photo.js), so one photograph can fade into the
  // next. Everything under it is rebuilt each time.
  if(!$("scene"))$("here").innerHTML=`<div class="scene" id="scene"><div id="lay"></div><div id="sceneover"></div></div><div id="herebody"></div>`;
  sceneSync(S.at,S.h,so,who.length?`<div class="whohere">${who.map(k=>`<button class="chip${pp(k).met?"":" new"}" data-who="${k}" aria-label="Talk to ${P[k].n}">${face(k,moodOf(k),50)}<b>${P[k].n}</b></button>`).join("")}</div>`:"");
  let h=`<div class="phead"><h2>${p.n}</h2><span class="hrs${op?"":" shut"}">${hrs}</span></div>`;
  if(last)h+=`<p class="story"><time>${last.t}</time>${last.x}</p>`;
  h+=`<p class="desc">${desc}${ml?` <em>${ml}</em>`:""}</p>`;
  if(nx)h+=goalBtn(nx,"next");
  h+=op?`<div class="acts">${acts.map((a,i)=>`<button class="act${a.hot?" hot":""}" data-a="${i}"${a.ok?"":" disabled"}><span>${a.n}</span><small>${a.s}</small></button>`).join("")}</div>`
   :`<p class="shutmsg">Closed right now. ${p.n} opens at ${fmtH(p.o[0])}. Head somewhere else, or go home and sleep.</p>`;
  if(S.crates)h+=`<p class="note">On you: ${S.crates} crate${S.crates>1?"s":""} of hot merchandise. Cops will care.</p>`;
  $("herebody").innerHTML=h;
}

// ---- Map ----
let TRAVEL=null;
function mapView(){
  mapBase();
  const n=dark(S.h),I=HS.info(),rd=I.round<I.total&&S.day===motoDay(I.round),gl=GL,hot={},st=Math.ceil(S.heat/20);
  for(const x of gl)if(x.at&&L[x.at]&&!hot[x.at]&&x.pri>=30)hot[x.at]=x;
  let svg=MAPBASE+(n?`<rect width="400" height="560" fill="#050817" opacity=".4"/>`+MAPNITE:"");
  for(const k in L){const [x,y]=MXY[k],op=isOpen(L[k].o,S.h),all=L[k].o[1]-L[k].o[0]===24;
    const s=all?"always open":k==="lake"&&rd&&op?"race day":op?"open · till "+fmtH(L[k].o[1]):"opens "+fmtH(L[k].o[0]);
    svg+=`<g class="loc${op?"":" shut"}" data-go="${k}" role="button" tabindex="0" aria-label="Go to ${L[k].n}${op?"":", closed"}">${mapPlace(k,L[k].c)}<rect x="${x-56}" y="${y-46}" width="112" height="98" fill="#000" opacity="0"/>`
      +`<rect x="${x-48}" y="${y+12}" width="96" height="27" rx="6" fill="#0b0c10" opacity=".92" stroke="${k===S.at?"#ff3d7f":L[k].c}" stroke-width="${k===S.at?2:1}"/><text x="${x}" y="${y+24.5}" text-anchor="middle" class="nm">${L[k].s||L[k].n}</text><text x="${x}" y="${y+34.5}" text-anchor="middle" class="st">${s}</text></g>`}
  if(n&&st>=2)svg+=`<g aria-hidden="true"><rect x="-8" y="-4.5" width="16" height="9" rx="2.5" fill="#eef1f6"/><rect x="-3.5" y="-5.5" width="7" height="3"><animate attributeName="fill" values="#ff2b3b;#2b6bff" dur=".45s" repeatCount="indefinite" calcMode="discrete"/></rect><animateMotion dur="${30-st*4}s" repeatCount="indefinite" rotate="auto" path="M133 0V420H267V150H400M400 150H267V290H0H133V0"/></g>`;
  if(st>=3)svg+=`<g aria-hidden="true"><path d="M-10 0h18l4-5h-24z" fill="#e8ecf2"/><rect x="-2" y="-9" width="5" height="4"><animate attributeName="fill" values="#ff2b3b;#2b6bff" dur=".45s" repeatCount="indefinite" calcMode="discrete"/></rect><animateMotion dur="22s" repeatCount="indefinite" path="M30 520Q140 470 250 530T380 512Q260 560 30 520z"/></g>`;
  const from=TRAVEL?TRAVEL.from:S.at,[fx,fy]=MXY[from];
  svg+=`<g id="me" style="transform:translate(${fx-38}px,${fy-38}px)" aria-hidden="true"><circle r="11" fill="#ff3d7f" opacity=".3"><animate attributeName="r" values="9;16;9" dur="1.6s" repeatCount="indefinite"/></circle><circle r="8" fill="#ff3d7f" stroke="#fff" stroke-width="2.5"/><circle r="3" fill="#fff"/></g>`;
  $("map").innerHTML=svg;
  // faces of whoever is at each place, and a marker where something is waiting
  let ov="";
  for(const k in L){const [x,y]=MXY[k],w=present(k),n2=w.length;
    w.forEach((p,i)=>{ov+=`<span class="mf${pp(p).met?"":" new"}" style="left:${((x+6-(n2-1)*12+i*24)/4).toFixed(2)}%;top:${((y-12)/5.6).toFixed(2)}%">${face(p,moodOf(p),26)}</span>`});
    if(hot[k])ov+=`<span class="mk" style="left:${((x+44)/4).toFixed(2)}%;top:${((y-38)/5.6).toFixed(2)}%">${ico(hot[k].ic==="flag"?"flag":"alert")}</span>`}
  $("mapover").innerHTML=ov;
  $("mapgoals").innerHTML=(gl.length?`<h3>Next up</h3>`+gl.slice(0,6).map(x=>goalBtn(x)).join(""):"")+`<p class="note">Tap a place to go there. ${S.car?"You've got the truck, so it's quick.":"Walking takes an hour. Tommy's old truck would fix that."}${n?" The cops are out after dark.":""}</p>`;
  if(TRAVEL){const t=TRAVEL;TRAVEL=null;travel(t.from,t.to)}
}
// The marker walks the streets from one place to the next: out to the nearest road, along it, round the corner, and in.
function travel(a,b){
  const me=$("me");if(!me)return;
  const [ax,ay]=MXY[a],[bx,by]=MXY[b],ra=MROW[a],rb=MROW[b],below=[150,290,420,420],above=[150,150,290,420];
  const ya=rb>ra?below[ra]:rb<ra?above[ra]:below[ra],yb=rb>ra?above[rb]:rb<ra?below[rb]:ya;
  const cx=ROADX.reduce((m,c)=>Math.abs(ax-c)+Math.abs(bx-c)<Math.abs(ax-m)+Math.abs(bx-m)?c:m,ROADX[0]);
  const pts=[[ax-38,ay-38],[ax,ya],[cx,ya],[cx,yb],[bx,yb],[bx-38,by-38]].filter((p,i,arr)=>!i||p[0]!==arr[i-1][0]||p[1]!==arr[i-1][1]);
  let len=0;const seg=[0];for(let i=1;i<pts.length;i++){len+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(len)}
  const end=()=>{me.style.transform=`translate(${bx-38}px,${by-38}px)`};
  if(!me.animate||matchMedia("(prefers-reduced-motion: reduce)").matches||len<1)return end();
  const dur=Math.min(1100,350+len*1.6);ART.hold=Date.now()+dur+100;
  const an=me.animate(pts.map((p,i)=>({transform:`translate(${p[0]}px,${p[1]}px)`,offset:len?seg[i]/len:i/(pts.length-1)})),{duration:dur,easing:"ease-in-out"});
  an.onfinish=end;
}

// ---- People ----
function peopleView(){
  const ar=(a,b)=>a-b>=1?" ▲":b-a>=1?" ▼":"";
  $("people").innerHTML=`<h2>People</h2><p class="key"><i class="dot"></i>Bond: how close you are. <i class="dot t"></i>Trust: whether they believe you.</p>`+Object.keys(P).map(k=>{const q=pp(k),c=P[k],w=where(k);
    if(k==="kow"&&S.kowGone)return `<div class="pc gone">${face(k,"flat",52,"gray")}<div><b>Kowalski</b><small>transferred out · Reyes has his beat</small></div></div>`;
    if(k==="dex"&&S.z.dexDead)return `<div class="pc gone">${face(k,"flat",52,"gray")}<div><b>Dex</b><small>dead · pulled out of the harbor off Pier 4</small></div></div>`;
    if(!q.met)return `<div class="pc unmet">${face(k,"flat",52,"dim")}<div><b>${c.n}</b><small>${c.role} · hasn't met you</small><small class="at">${ico("pin")}usually ${usual(k)}</small></div></div>`;
    const sg=stage(k),away=S.day-q.seen,lab=q.rom?ROM[q.rom]+(sg<0?" · done with you":""):STG[sg];
    return `<details class="pc" data-p="${k}"${S.openP===k?" open":""}><summary>${face(k,moodOf(k),52)}<div><b>${c.n}<span>${lab}</span></b>
<div class="bars"><div><i style="width:${q.b}%"></i></div><div class="tr"><i style="width:${q.t}%"></i></div></div>
<small>Bond ${Math.round(q.b)}${ar(q.b,q.b0)} · Trust ${Math.round(q.t)}${ar(q.t,q.t0)}${q.cap<100?" (max "+q.cap+")":""}${away>=3?" · not seen in "+away+" days":""}</small>
<small class="at">${ico("pin")}${w?"now at "+L[w].n:"not around right now"}</small></div></summary>
<ul><li>${c.role[0].toUpperCase()+c.role.slice(1)}. ${tieTxt(k)} Usually ${usual(k)}.</li>${c.know.slice(0,q.know).map(x=>`<li><b>You know:</b> ${x}</li>`).join("")}${q.mem.map(x=>`<li><b>Remembers:</b> ${x}</li>`).join("")}</ul>
${w&&w!==S.at?`<button class="go" data-go="${w}">${ico("pin")}Go to ${L[w].n}</button>`:""}</details>`}).join("");
}

// ---- You ----
function youView(){
  const I=HS.info(),inc=income(),today=S.day-(S.h<5?1:0),own=Object.keys(UP).filter(k=>S.home[k]).map(k=>({bed:"bed",fridge:"fridge",tv:"TV",safe:"safe"})[k]);
  const row=(a,b)=>`<div class="row"><span>${a}</span><b>${b}</b></div>`,sec=(t,x)=>`<section class="card"><h3>${t}</h3>${x}</section>`;
  let nr=S.day+1;while(!rentDay(nr))nr++;
  $("you").innerHTML=`<div class="youtop"><h2>Side Hustle<br>Holeshot</h2><button id="snd" aria-label="Sound ${sndOn()?"on":"off"}">${ico(sndOn()?"snd":"mute")}</button></div>`
   +aimCard()+sec("Money",row("Cash",$$(S.cash))+(inc?row("Daily take",$$(inc)+(S.chop?" · chop shop running":"")):"")+(rentAmt()?row("Rent",$$(rentAmt())+" due day "+nr+(S.missed?" · 1 missed":"")):row("Rent","none: the house is yours"))
     +(S.loan?row("Owed to Sal",$$(S.loan.amt)+" by day "+S.loan.due):"")+(S.oweDay?row("Nia owes you","$200"):"")+sponsorRows())
   +(S.proms.length?sec("You promised",S.proms.map(pr=>row(ASK[pr.id].what,pr.due>today?"tomorrow":"today")).join("")):"")
   +sec("Skills",Object.entries(SK).map(([k,n])=>`<div class="row"><span>${n}</span><b class="pips" aria-label="level ${lvl(k)} of 5">${"●".repeat(lvl(k))+"○".repeat(5-lvl(k))}</b></div>`).join(""))
   +sec("Your life",row("Ride",S.car?"Old pickup":"On foot")+row("Ski",I.craft+" · "+I.cls+" · "+I.parts+" part level"+(I.parts===1?"":"s")+(I.wear<60?" · needs service":""))
     +row("Series",I.round>=I.total?"Finished "+ord(S.tourPos||I.pos):(I.round?ord(I.pos)+" on "+I.pts+" pts · ":"")+(I.mid?"moto 2 of ":"")+"round "+(I.round+1)+" on day "+motoDay(I.round))
     +row("Place",(S.z.pad?PAD[S.z.pad][0]:own.length?"Studio with "+own.join(", "):"Mattress on the floor")+(S.q.nia===3?", and Nia":"")+(S.bag?", and Dex's bag":""))+moreYou())
   +sec("Street log",`<div class="log" id="log">${S.log.map(l=>`<p><time>${l.t}</time>${l.x}</p>`).join("")}</div>`)+photoCard()
   +`<div class="youbtns"><button id="free">${ico("ski")}Free play <small>race, tour, drag, items, crates</small></button><button id="reset">${ico("x")}Start a new life <small>wipes save</small></button></div>`;
}

// ---- the phone ----
// A phone laid over the city: Messages, Clout, Runner, Bank, News, and a lawyer when the heat is on. PH.app is the open app.
const PH={open:0,app:null};
function phone(){PH.open=1;PH.app=null}
function phoneView(){
  const box=$("phoneui");box.hidden=!PH.open;if(!PH.open)return;
  const head=(t)=>`<div class="pnav"><button data-pback aria-label="Back">${ico("back")}</button><b>${t}</b><span></span></div>`;
  let x="";
  if(!PH.app){
    const apps=[["msgs","Messages","msg","#2fbf71",S.inbox.length],["clout","Clout","cam","#ff3d7f",S.cl.clip?1:0],["runner","Runner","bike","#ffb020",0],["bank","Bank","bank","#3a9ad9",0],["news","News","radio","#8a5cf6",S.z.news.length],["map","Map","map","#22a6a6",0]];
    if(S.heat>=20)apps.push(["pike","Pike, Esq.","scale","#b08a22",0]);
    x=`<div class="pclock">${fmtH(S.h)}<small>Day ${S.day}</small></div><div class="apps">${apps.map(([id,n,ic,c,b])=>`<button data-app="${id}"><i style="background:${c}">${ico(ic)}</i><span>${n}</span>${b?`<em>${b}</em>`:""}</button>`).join("")}</div>`;
  }else if(PH.app==="msgs"){
    const today=S.day-(S.h<5?1:0);
    x=head("Messages")+(S.inbox.length?S.inbox.map(m=>{const a=ASK[m.id];return `<button class="thread" data-ask="${m.id}">${a.title&&a.title!=="Text from "+P[a.who].n?`<span class="fc anon" style="width:40px;height:40px">?</span>`:face(a.who,moodOf(a.who),40)}<span><b>${a.title||P[a.who].n}</b><small>${a.raw?a.text:"“"+a.text+"”"}</small></span><em>reply</em></button>`}).join(""):`<p class="empty">No new texts. Nobody needs anything. Enjoy it.</p>`)
      +(S.proms.length?`<h4>You promised</h4>`+S.proms.map(pr=>{const a=ASK[pr.id],at=NEEDAT[a.need];return `<div class="thread">${face(a.who,moodOf(a.who),40)}<span><b>${a.what}</b><small>${pr.due>today?"by tomorrow night":"by tonight"}${at?" · "+L[at].n:""}</small></span>${at?`<button class="mini" data-go="${at}">Go</button>`:""}</div>`}).join(""):"");
  }else if(PH.app==="bank"){
    const inc=income(),parts=[[S.gar,"Garage",220+30*lvl("wrench")+(stage("tommy")>=2?60:0)],[S.chop,"Chop shop",500],[S.q.rosa===1,"Lucky's, your cut",80],[S.q.nia===2,"Nia's back room",150],[S.z.v===6,"Vance's docks",300],[S.z.v===9&&S.z.docks,"The docks",250]].filter(p=>p[0]);
    let nr=S.day+1;while(!rentDay(nr))nr++;
    x=head("Bank")+`<div class="bal"><small>Balance</small><b>${$$(S.cash)}</b></div>`
      +`<h4>Coming in every morning</h4>`+(parts.length?parts.map(p=>`<div class="row"><span>${p[1]}</span><b class="pos">+${$$(p[2])}</b></div>`).join(""):`<p class="empty">Nothing yet. Own something.</p>`)+sponsorRows()
      +`<h4>Going out</h4>`+(rentAmt()?`<div class="row"><span>Rent, day ${nr}</span><b class="neg">−${$$(rentAmt())}</b></div>`:"")+(S.loan?`<div class="row"><span>Sal, day ${S.loan.due}</span><b class="neg">−${$$(S.loan.amt)}</b></div>`:"")
      +`<h4>Recent</h4>`+S.log.filter(l=>/\$\d/.test(l.x)).slice(0,8).map(l=>`<p class="ln"><time>${l.t}</time>${l.x}</p>`).join("");
  }else if(PH.app==="news"){
    const past=S.log.filter(l=>/^Radio: /.test(l.x)).slice(0,8);
    x=head("News")+(S.z.news.length?`<h4>Breaking</h4>`+S.z.news.map(t=>`<p class="ln hl">${t}</p>`).join(""):"")+(past.length?`<h4>Earlier</h4>`+past.map(l=>`<p class="ln"><time>${l.t}</time>${l.x.slice(7)}</p>`).join(""):"")+(!S.z.news.length&&!past.length?`<p class="empty">Weather, a water main, a high school game. Nothing about you. Keep it that way.</p>`:"");
  }else if(PH.app==="pike"){
    x=head("Pike, Esq.")+`<p class="empty">Dolores Pike, attorney. Answers on the second ring, bills from the first.</p>`+phoneMore().map(c=>`<button class="act" data-x="${xa(c[1])}"${c[2]?" disabled":""}><span>${c[0]}</span></button>`).join("")+(phoneMore().length?"":`<p class="empty">“You're not interesting enough to need me yet.”</p>`);
  }else if(PH.app==="clout")x=head("Clout")+cloutCard(1);
  else if(PH.app==="runner")x=head("Runner")+runnerCard(1);
  $("pscreen").innerHTML=x;
}
function sponsorRows(){const on=SPON.filter(s=>S.cl.spon[s.id]);return on.map(s=>`<div class="row"><span>${s.n}, weekly</span><b class="pos">+${$$(s.pay)}</b></div>`).join("")}

// ---- the morning recap ----
// Shown once a new day starts: what yesterday did to your money, heat and people, the radio, and what's on today.
EV.recap=()=>{
  const a=S.d0||snap(),b=snap();S.d0=b;if(S.over)return;
  const L2=[],dc=Math.round(b.cash-a.cash),dh=Math.round(b.heat-a.heat),df=Math.round(b.f-a.f);
  L2.push(`<div class="rc money"><span>Money</span><b>${$$(a.cash)} → ${$$(b.cash)}</b><em class="${dc>=0?"pos":"neg"}">${dc>=0?"+":"−"}${$$(Math.abs(dc))}</em></div>`);
  if(dh)L2.push(`<div class="rc"><span>Heat</span><b>${Math.round(a.heat)} → ${Math.round(b.heat)}</b><em class="${dh>0?"neg":"pos"}">${dh>0?"+":"−"}${Math.abs(dh)}</em></div>`);
  if(df)L2.push(`<div class="rc"><span>Followers</span><b>${b.f.toLocaleString()}</b><em class="${df>0?"pos":"neg"}">${df>0?"+":"−"}${Math.abs(df).toLocaleString()}</em></div>`);
  Object.keys(SK).forEach((k,i)=>{if(b.lv[i]>a.lv[i])L2.push(`<div class="rc"><span>${SK[k]}</span><b>level ${b.lv[i]}</b><em class="pos">up</em></div>`)});
  const ppl=Object.keys(P).filter(k=>b.p[k][2]&&a.p[k]&&(Math.abs(b.p[k][0]-a.p[k][0])>=2||Math.abs(b.p[k][1]-a.p[k][1])>=2));
  if(ppl.length)L2.push(`<div class="rcp">${ppl.map(k=>{const db=Math.round(b.p[k][0]-a.p[k][0]),dt=Math.round(b.p[k][1]-a.p[k][1]);return `<span>${face(k,moodOf(k),34)}<small class="${db+dt>=0?"pos":"neg"}">${db+dt>=0?"▲":"▼"}</small></span>`}).join("")}</div>`);
  const nw=S.z.news.shift();if(nw)log("Radio: "+nw);
  const g=goals().slice(0,3),hp=hap();
  modal("Day "+S.day,`<div class="recap">${L2.join("")}${nw?`<p class="radio">${ico("radio")}${nw}</p>`:""}${hp?`<p class="radio hap">${ico("star")}<span><b>${hp.n}</b> · ${hp.s}</span></p>`:""}${g.length?`<h4>Today</h4>`+g.map(x=>`<div class="rg">${x.who?face(x.who,moodOf(x.who),26):ico(x.ic)}<span><b>${x.t}</b><small>${x.s}</small></span></div>`).join(""):""}</div>`,[["Get going",0]]);
};

// ---- tabs ----
function tab(k){$("app").dataset.tab=k;for(const b of root.querySelectorAll("#tabs [data-tab]"))b.setAttribute("aria-pressed",String(b.dataset.tab===k));host.scrollTop=0}
// who a dialog is about, from its title, so the sheet can show their face
const WHOT={"Red and blue":()=>S.kowGone?"reyes":"kow","Gray suit":"ia","Two detectives":"ia","Company":"crew","Jumped":"crew","Wrong corner":"crew","A van":"crew","The back room":"carol","Blackjack":"carol","The drag strip":"marcus","Pink slips":"marcus","Inspection":()=>S.kowGone?"reyes":"kow","Vance":"vance","Kowalski":"kow","Text from Kowalski":"kow"};
function whoOf(t){for(const k in P)if(t===P[k].n||t==="Text from "+P[k].n)return k;const w=WHOT[t.split(" · ")[0]];return typeof w==="function"?w():w||null}
