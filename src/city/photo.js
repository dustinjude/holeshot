// ---------- photographs ----------
// Joined into city.js at //@photo. The city's places and people are drawn in code (art.js); this lays photographs over them.
// The pictures are made by an image model on the server, once each, the first time anybody's screen asks for one
// (netlify/lib/art.mts has the list, the prompts and the limits). They are kept there and fetched here through Netlify's
// Image CDN as small WebP files. Anything not made yet, not loadable, or switched off in You falls back to the drawing, so the
// city is whole with no connection at all. Nothing here can make a picture that is not on the server's list.

// ready: {picture: tag} for every picture that exists. bad: failed to load this visit. gone: the server has given up on it.
// seen: addresses that have loaded, so a re-drawn screen shows them at once instead of fading them in again.
// q: pictures waiting to be asked for; fly: asked for and awaited.
// pane: the panel being drawn (set by render in city.js); null means a dialog or a pop-up, which is always in view.
// fails: asks in a row that brought no picture; note: the server's latest failure, shown in You.
// rest: the server's list of pictures not made yet; all: the player has asked for every one of them now.
const ART={on:false,total:0,ready:{},bad:{},gone:{},seen:{},raw:{},fly:{},tries:{},q:[],pause:0,gen:0,dirty:0,down:0,hold:0,cdnFail:0,nocdn:0,kick:0,tm:0,watch:0,pane:null,fails:0,note:null,rest:[],all:0};
const artVis=()=>ART.pane==null||(ART.pane==="phone"?!!PH.open:ART.pane===$("app").dataset.tab);
// Who has a photograph: 1 means one for every mood, 0 just the one.
const SITTERS={rosa:1,nia:1,dex:1,marcus:1,sal:1,june:1,tommy:1,kow:1,reyes:0,vance:0,carol:0,ia:0,crew:0};
const photoOn=()=>{try{return localStorage.getItem("shc.photo")!=="0"}catch(e){return true}};
const artHas=k=>!!ART.ready[k]&&!ART.bad[k];
// Photographs are in play: some exist or can be made, and the player has not chosen the drawings.
const artUse=()=>photoOn()&&(ART.on||Object.keys(ART.ready).length>0);
const artClean=m=>{const o={};if(m&&typeof m==="object")for(const k in m)if(/^[a-z0-9-]{3,24}$/.test(k)&&/^[a-f0-9]{6,16}$/.test(m[k]))o[k]=m[k];return o};
const artSave=()=>{try{localStorage.setItem("shc.art",JSON.stringify(ART.ready))}catch(e){}};

// Where the pictures stand on the server: which exist, which are being made, which have been given up on. Asked for as the
// city opens and every few seconds while a picture is awaited. Until it first answers (or with no connection) the last list
// that was kept is used. Returns the answer, or null if there was none.
async function artList(){
  try{
    const r=await fetch("/api/art",{cache:"no-store"});if(!r.ok)throw 0;
    const m=await r.json();if(!m||typeof m.ready!=="object")throw 0;
    const rd=artClean(m.ready),news=Object.keys(rd).some(k=>ART.ready[k]!==rd[k])||Object.keys(ART.ready).some(k=>!rd[k]);
    for(const k in rd)if(ART.ready[k]!==rd[k])delete ART.bad[k];
    ART.on=!!m.on;ART.total=+m.total||0;ART.ready=rd;ART.note=m.note&&typeof m.note.why==="string"?m.note:null;
    ART.rest=(Array.isArray(m.rest)?m.rest:[]).filter(k=>/^[a-z0-9-]{3,24}$/.test(k));
    for(const k of Array.isArray(m.gone)?m.gone:[])ART.gone[k]=1;
    if(news){artSave();artDirty()}
    return m;
  }catch(e){return null}
}
async function artLoad(){
  try{ART.ready=artClean(JSON.parse(localStorage.getItem("shc.art")||"null"))}catch(e){}
  if(!await artList())ART.on=false;
  artDirty();
}

// An <img> for a picture, cut to w by h by the Image CDN. If the CDN copy will not load, the picture as it was made is tried
// (the error listener below), and after that the drawing. The screen is rebuilt on every tap, so a picture that has loaded
// before is marked as shown from the start and decoded in step with the page: it must not blink. fade is for the scene box,
// whose pictures stay on the page and always fade in over the one before.
function artSrc(k,w,h){
  const raw="/api/art/"+ART.ready[k]+"/"+k,direct=ART.nocdn||ART.raw[k];
  return [direct?raw:"/.netlify/images?url="+encodeURIComponent(raw)+"&w="+w+"&h="+h+"&fit=cover&fm=webp&q=72",direct?"":raw];
}
function artImg(k,w,h,cls,fade){
  const [src,raw]=artSrc(k,w,h),seen=!fade&&ART.seen[src];
  return `<img class="${cls}${seen?" on":""}" src="${src}"${raw?` data-raw="${raw}"`:""} data-art="${k}" alt="" decoding="${seen?"sync":"async"}" draggable="false">`;
}
root.addEventListener("load",e=>{const t=e.target;if(t.tagName!=="IMG"||!t.dataset.art)return;
  ART.seen[t.getAttribute("src")]=1;t.classList.add("on");
  if(t.dataset.fell){ART.raw[t.dataset.art]=1;if(++ART.cdnFail>=2)ART.nocdn=1}
  // a scene picture has arrived on top of the last one: once it has faded in, take away what is underneath
  if(t.classList.contains("scene-pic")){const lay=t.parentNode;setTimeout(()=>{if(t.parentNode===lay)while(t.previousElementSibling)t.previousElementSibling.remove()},650)}},true);
root.addEventListener("error",e=>{const t=e.target;if(t.tagName!=="IMG"||!t.dataset.art)return;
  if(t.dataset.raw){const raw=t.dataset.raw;t.removeAttribute("data-raw");t.dataset.fell="1";t.src=raw;return}
  ART.bad[t.dataset.art]=1;artDirty()},true);
// A finger on the screen: hold off re-drawing until it lifts, so a tap is never lost to a picture arriving.
root.addEventListener("pointerdown",()=>{ART.down=Date.now()},true);
for(const ev of ["pointerup","pointercancel"])window.addEventListener(ev,()=>{ART.down=0},true);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)artKick()});

// Something changed (a picture arrived, or one would not load): draw the screen again at a quiet moment.
function artDirty(){
  if(ART.dirty)return;ART.dirty=1;
  const go=()=>{if(ART.down&&Date.now()-ART.down<4000||Date.now()<ART.hold)return setTimeout(go,150);ART.dirty=0;if(!host.hidden)render()};
  setTimeout(go,60);
}

// ---- asking for pictures ----
// Every picture a screen would like and does not have goes on the list with a priority; the newest screen's wants go first.
// Two are asked for at a time. The server takes the request and makes the picture in its own time, so after asking, the city
// looks at the server's list every few seconds until the picture is there. Nothing is asked for until the player has said
// they are an adult, while the city is hidden behind a race, or with the drawings chosen.
function artWant(k,p){
  if(!ART.on||ART.ready[k]||ART.gone[k]||ART.fly[k]||!photoOn())return;
  let x=ART.q.find(y=>y.k===k);
  if(!x){x={k,p,t:0,g:ART.gen};ART.q.push(x)}
  else if(x.g!==ART.gen){x.g=ART.gen;x.p=p}else if(p>x.p)x.p=p;
  artKick();
}
function artKick(){if(ART.kick)return;ART.kick=1;setTimeout(()=>{ART.kick=0;artPump()},0)}
function artPump(){
  if(!ART.on||!photoOn()||!adult()||document.hidden||host.hidden||navigator.onLine===false)return;
  const now=Date.now(),later=ms=>{clearTimeout(ART.tm);ART.tm=setTimeout(artPump,Math.max(200,ms))};
  if(now<ART.pause)return later(ART.pause-now);
  while(Object.keys(ART.fly).length<2){
    const c=ART.q.filter(x=>x.t<=now).sort((a,b)=>(b.g===ART.gen?1000:0)+b.p-(a.g===ART.gen?1000:0)-a.p)[0];
    if(!c){const nx=Math.min(...ART.q.map(x=>x.t));if(isFinite(nx))later(nx-now);return}
    ART.q.splice(ART.q.indexOf(c),1);artAsk(c);
  }
}
// Ask again later, a little later each time, but not for ever: a picture that will not come is left for the next visit.
function artBack(c,sec){if((ART.tries[c.k]||0)<6){c.t=Date.now()+sec*1000;ART.q.push(c)}else ART.gone[c.k]=1}
async function artAsk(c){
  const now=Date.now();ART.fly[c.k]={c,idle:now};ART.tries[c.k]=(ART.tries[c.k]||0)+1;
  let st=0;
  try{st=(await fetch("/api/art-make",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({key:c.k})})).status}catch(e){}
  if(st===202||st===200)return artWatch();
  // not taken: too many asks, no connection, or no such function on this host
  delete ART.fly[c.k];ART.pause=Date.now()+(st===429?60000:30000);artBack(c,45);artPump();
}
function artWatch(){if(!ART.watch)ART.watch=setTimeout(artPoll,4000)}
async function artPoll(){
  ART.watch=0;
  if(!Object.keys(ART.fly).length)return;
  const m=await artList(),now=Date.now();
  for(const k of Object.keys(ART.fly)){
    const f=ART.fly[k];
    if(ART.ready[k]){delete ART.fly[k];ART.fails=0}
    else if(m&&(m.gone||[]).includes(k)){ART.gone[k]=1;delete ART.fly[k]}
    else if(m&&(m.busy||[]).includes(k))f.idle=now;
    else if(now-f.idle>20000){   // nobody is making it and it is not there: the try failed
      delete ART.fly[k];artBack(f.c,20*ART.tries[k]);
      // several in a row means something is wrong at the server's end, not with one picture: stop asking for a while
      if(++ART.fails>=4)ART.pause=now+Math.min(30,5*(ART.fails-3))*60000;
    }
  }
  if(m&&!m.on){ART.on=false;ART.q=[];ART.fly={}}
  if(!m)ART.pause=now+30000;
  if(Object.keys(ART.fly).length)artWatch();
  artPump();
}

// ---- which picture ----
// The pictures a place would like at this hour, best first.
function sceneKeys(k,h,o){
  const n=dark(h),t=n?"-night":"-day";
  if(k==="home")return [(o.pad===2?"home2":o.pad===1?"home1":(!!o.bed+!!o.tv+!!o.fridge>=2?"home0f":"home0"))+t];
  if(k==="bar")return [o.closed&&!n?"bar-day":"bar-night"];   // a bar with no windows looks the same whenever it is open
  if(k==="court"&&o.party)return ["court-party","court"+t];
  if(k==="gym"&&o.fight&&!o.closed)return ["gym-fight","gym-night"];
  if(k==="lake"&&!n&&!o.closed&&(o.race||o.boat))return [o.race?"lake-race":"lake-boat","lake-day"];
  return [k+t];
}
// The photograph the scene box should show, or null for the drawing: {k: the picture, fx: " asnight" when a day picture is
// standing in for the night, tint: the light of the hour laid over it}.
function photoPick(k,h,o){
  if(!artUse())return null;
  const want=sceneKeys(k,h,o),n=dark(h);
  want.forEach((x,i)=>artWant(x,(artVis()?100:50)-i*5));
  let use=want.find(artHas),fx="";
  if(!use){   // until the night picture exists, the day picture darkened; the bar and the docks, first seen at night, lend their night picture to the day
    const alt=want[want.length-1].replace(/-(day|night)$/,(m,t)=>t==="day"?"-night":"-day"),day=/-day$/.test(alt);
    if(artHas(alt)&&(day||k==="bar"||k==="docks")){use=alt;if(n&&day)fx=" asnight"}
  }
  if(!use)return null;
  return {k:use,fx,tint:fx?"night":!/-day$|-race$|-boat$/.test(use)||k==="bar"?"":h===6?"dawn":h===18?"gold":h===19?"dusk":""};
}
// Brings the scene box (#scene, which stays on the page while the rest of Here is rebuilt) up to date. A new photograph is
// laid over whatever is showing and fades in once it has loaded, so one place dissolves into the next and day into night;
// what was underneath is removed when the fade is over (the load listener above). With no photograph the drawing is shown.
// over is what sits on top of the picture: the faces of who is here.
function sceneSync(k,h,o,over){
  const box=$("scene"),lay=$("lay"),p=photoPick(k,h,o);
  box.className="scene"+(p?" pic"+(o.closed?" shut":""):artUse()?" tall":"");
  if(!p)lay.innerHTML=scene(k,h,o);
  else{
    let top=lay.lastElementChild;const id=p.k+p.fx+ART.ready[p.k];
    if(!top||top.dataset.id!==id){
      if(top&&top.tagName==="IMG"&&!top.classList.contains("on")){top.remove();top=lay.lastElementChild}   // one that never arrived
      if(!top||top.tagName!=="IMG")lay.innerHTML=scene(k,h,o);   // nothing photographed to dissolve from: start from this place's drawing
      lay.insertAdjacentHTML("beforeend",artImg(p.k,1200,675,"scene-pic"+p.fx,1));
      lay.lastElementChild.dataset.id=id;
    }
  }
  $("sceneover").innerHTML=(p&&p.tint?`<i class="tint ${p.tint}"></i>`:"")+(p&&o.closed?`<b class="shuttag">Closed</b>`:"")
   +(photoWait(k,h,o)?`<span class="making">${ico("cam")}photo on its way</span>`:"")+over;
}
// True while the photograph a place wants at this hour is still to come, for the note on the scene.
function photoWait(k,h,o){const w=sceneKeys(k,h,o)[0];return photoOn()&&ART.on&&ART.fails<4&&!ART.ready[w]&&!ART.gone[w]}
// A person's photograph for a mood, or "" for the drawing. Until the mood's own picture exists their ordinary one stands in.
// A picture that has not loaded yet fades in over something: their ordinary photograph if that has loaded, otherwise the
// drawing, which face() puts underneath when ART.fresh is set.
function photoFace(k,m,size){
  ART.fresh=false;
  if(!artUse()||!SITTERS.hasOwnProperty(k))return "";
  const flat=k+"-flat",want=SITTERS[k]&&m&&m!=="flat"?k+"-"+m:flat;
  artWant(want,artVis()?80:30);
  const use=artHas(want)?want:artHas(flat)?flat:"";
  if(!use)return "";
  const px=size<=34?96:256,seen=x=>!!ART.seen[artSrc(x,px,px)[0]];   // two sizes only, so a face loaded for one spot is ready for the next
  if(seen(use))return artImg(use,px,px,"");
  if(use!==flat&&artHas(flat)&&seen(flat))return artImg(flat,px,px,"")+artImg(use,px,px,"");
  ART.fresh=true;
  return artImg(use,px,px,"");
}
// Called as each screen is drawn. The everyday pictures (every place by day and night, everyone's ordinary face) are asked for
// quietly behind whatever is on screen, so the city fills in during the first few minutes anyone plays it.
function artFrame(){
  ART.gen++;
  if(!ART.on||!photoOn())return;
  const so={pad:S.z.pad,bed:S.home.bed,tv:S.home.tv,fridge:S.home.fridge};
  for(const k in L)for(const h of [12,23])for(const x of sceneKeys(k,h,k==="home"?so:{closed:k==="bar"&&h===12}))artWant(x,k===S.at?30:10);
  for(const k in SITTERS)artWant(k+"-flat",SITTERS[k]?20:5);
  if(ART.all)ART.rest.forEach((k,i)=>artWant(k,4-i/100));   // the player asked for all of them: the rest follow, in the server's order
}

// ---- the player's side of it ----
function photoSet(on){try{localStorage.setItem("shc.photo",on?"1":"0")}catch(e){}if(on)artKick();else{ART.q=[];ART.all=0}}
// Make every picture now instead of as each is first needed. It lasts until the page is closed.
function photoAll(){ART.all=1;ART.fails=0;ART.pause=0;ART.tries={};artKick()}
const ARTNAME={home0:"Your studio, bare",home0f:"Your studio, furnished",home1:"The one-bedroom",home2:"The lake house"};
function artLabel(k){
  const [a,b]=k.split("-"),what={day:"day",night:"night",flat:"",up:"happy",down:"worried",cold:"cold",party:"block party",fight:"fight night",race:"race day",boat:"boat show"}[b]||b;
  const who=ARTNAME[a]||(L[a]&&L[a].n)||(P[a]&&P[a].n)||({reyes:"Reyes",vance:"Vance",carol:"Carol",ia:"Internal Affairs",crew:"A crew"})[a]||a;
  return who+(what?" · "+what:"");
}
// Every photograph made so far, on one sheet.
function photoWall(){
  const ks=Object.keys(ART.ready).filter(artHas),pl=ks.filter(k=>!/-(flat|up|down|cold)$/.test(k)),pe=ks.filter(k=>/-(flat|up|down|cold)$/.test(k));
  modal("Photos",`<div class="wall">${pl.map(k=>`<figure>${artImg(k,480,270,"")}<figcaption>${artLabel(k)}</figcaption></figure>`).join("")}</div>`
   +`<div class="wall faces">${pe.map(k=>`<figure><span class="fc pic" style="width:76px;height:76px">${artImg(k,256,256,"")}</span><figcaption>${artLabel(k)}</figcaption></figure>`).join("")}</div>`,[["Close",0]]);
}
function photoCard(){
  const n=Object.keys(ART.ready).length,on=photoOn();
  const say=!on?"The drawn city. Switch to Photos for the real thing."
   :ART.on?(n>=ART.total?"All "+n+" photos are made.":ART.all?n+" of "+ART.total+" photos made. Making the rest now: keep the game open, about "+Math.max(1,Math.ceil((ART.total-n)/6))+" minutes."
     :n+" of "+ART.total+" photos made. The rest are made as you play: each takes a few seconds, once, and is kept for everyone.")
   :n?n+" photos. New ones can't be made right now, so anything missing is drawn.":"Photos need the live site and a connection. Until then the city is drawn.";
  return `<section class="card"><h3>${ico("cam")}Pictures<small>${on&&(ART.on||n)?"photos":"drawn"}</small></h3>
<div class="seg"><button data-x="${xa(()=>photoSet(1))}" aria-pressed="${on}">Photos</button><button data-x="${xa(()=>photoSet(0))}" aria-pressed="${!on}">Drawn</button></div>
<p class="note">${say}</p>${on&&ART.on&&ART.note&&ART.note.ago<900&&n<ART.total?`<p class="note">The last one didn't come through (${esc(ART.note.why.slice(0,110))}). It will be tried again.</p>`:""}${on&&n?`<button class="go" data-x="${xa(photoWall)}">${ico("cam")}See all ${n}</button>`:""}${on&&ART.on&&n<ART.total&&!ART.all?` <button class="go" data-x="${xa(photoAll)}">${ico("bolt")}Make the rest now</button>`:""}</section>`;
}
