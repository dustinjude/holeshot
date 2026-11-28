// ---------- side hustles ----------
// Joined into city.js at //@hustle. Three legit ways to make money on the side, and the Hustles tab that lists every way you do.
// Clout: post clips from races, runs, fights and stunt sessions, grow a following, and sign sponsors who pay every rent day as
// long as you keep their terms. Runner: delivery shifts on the app from anywhere, on foot or in the truck, with a rating to keep.
// Tuning: reflash customers' skis at Tommy's, from a safe map to a race map, and live with the ones that let go.
function freshCl(){return {f:0,best:0,last:-9,posts:0,clip:null,spon:{},warn:{},stunt:-9}}
function freshGig(){return {rate:4.6,runs:0,off:0,day:-9,shifts:0}}
function freshTn(){return {jobs:0,rep:0,day:-9,fails:0}}

// ---- Clout ----
// A clip worth posting. A better one replaces a worse one; a clip more than two days old does half as well.
// kind is where it came from, q its quality 1 to 5, t its caption, h the heat it brings (the law watches too).
function clip(kind,q,t,h){const c=S.cl.clip;if(c&&c.q>q&&S.day-c.day<=1)return;S.cl.clip={kind,q,t,h:h||0,day:S.day}}
function post(){
  const c=S.cl.clip;if(!c)return;S.cl.clip=null;
  const stale=S.day-c.day>=2?.5:1,viral=r()<.04+.025*c.q,base=[0,50,120,260,560,1200][c.q],
   g=Math.round(base*stale*Math.sqrt(1+S.cl.f/2500)*(.6+r()*.9)*(viral?6:1));
  S.cl.f+=g;S.cl.posts++;S.cl.last=S.day;S.cl.best=Math.max(S.cl.best,S.cl.f);xp("charm");
  if(g>=400)S.rep=cl(S.rep+(viral?4:1));
  log(viral?"“"+c.t+"” blows up. "+g.toLocaleString()+" new followers, and strangers know your face now.":"You post “"+c.t+"”. "+g.toLocaleString()+" new followers."+(c.h?" Harbor Patrol follows you now too.":""));
  if(c.h){S.heat=cl(S.heat+c.h);S.z.seen=1;hot()}
}
// Invented brands. need: followers to be offered the deal. pay: every rent day. ok(): the terms, checked when they pay.
const SPON=[
 {id:"wax",n:"Riptide Wax",need:1000,pay:120,req:"Post at least every five days.",ok:()=>S.day-S.cl.last<=5},
 {id:"glare",n:"Glare Optics",need:3000,pay:220,req:"Finish your last round in the top five.",ok:()=>(S.lastP||99)<=5},
 {id:"volt",n:"Volt Fuel",need:8000,pay:420,req:"Heat under 60, and no arrests.",ok:()=>S.heat<60},
 {id:"kp",n:"Kingpin Apparel",need:12000,pay:650,req:"Respect 40, with a little heat on you.",ok:()=>S.rep>=40&&S.heat>=20},
 {id:"bay",n:"Bayside Marine",need:25000,pay:1100,req:"Top three in the series, and Respect 30.",ok:()=>{const I=HS.info();return I.round>0&&I.pos<=3&&S.rep>=30}}];
const signed=()=>SPON.filter(s=>S.cl.spon[s.id]);
function sign(s){S.cl.spon[s.id]=S.day;S.cl.warn[s.id]=0;log(s.n+" sends a contract and a box of free stuff. "+$$(s.pay)+" every rent day. "+s.req)}
// Every rent day each sponsor pays if you're keeping their terms. Miss once and they hold the money; twice and they drop you.
function sponsorWeek(){
  for(const s of SPON){if(!S.cl.spon[s.id])continue;
    if(s.ok()){S.cash+=s.pay;S.cl.warn[s.id]=0;log(s.n+" pays "+$$(s.pay)+" for the week.")}
    else if(S.cl.warn[s.id]){delete S.cl.spon[s.id];S.cl.warn[s.id]=0;log(s.n+" drops you. “"+s.req+"” was the deal.")}
    else{S.cl.warn[s.id]=1;log(s.n+" holds this week's "+$$(s.pay)+". "+s.req)}}
}
function cloutDay(){if(S.day-S.cl.last>=4&&S.cl.f>0)S.cl.f=Math.round(S.cl.f*.97);if(rentDay(S.day))sponsorWeek()}
// a mugshot ends the clean-living deal on the spot
function arrested(){if(S.cl.spon.volt){delete S.cl.spon.volt;log("Volt Fuel saw the mugshot. Morals clause. You're dropped.")}}
// a stunt session at the Lake, for the camera
function stunt(){
  S.cash-=20;S.cl.stunt=S.day;tick(2);if(S.over)return;S.en=cl(S.en-20);xp("drive");const W=lvl("drive");
  if(r()<.2-.025*W){S.en=cl(S.en-15);S.mood=cl(S.mood-8);clip("stunt",2,"Wipeout off the wake at the Lake");log("You catch an edge at forty and the lake slaps you flat. It looks great on camera, at least.")}
  else{const q=Math.min(5,1+Math.floor(W/2)+(r()<.35?1:0)),t=pick(["Barrel roll off the wake","Submarine and back up","A wheelie the length of the beach","Jumping the ramp boat's wake twice","A 360 at full lock"]);
    clip("stunt",q,t);S.mood=cl(S.mood+8);log(t+". You got it on camera. "+["","Meh.","Not bad.","That's a good one.","That's the one.","That's going to do numbers."][q])}
}
function cloutCard(full){
  const C=S.cl,c=C.clip,on=signed(),best=SPON.filter(s=>!C.spon[s.id]);
  let x=`<div class="big"><b>${C.f.toLocaleString()}</b><small>followers${C.posts?" · "+C.posts+" post"+(C.posts>1?"s":"")+(C.last>0?" · last on day "+C.last:""):""}</small></div>`;
  x+=c?`<div class="clip">${ico("cam")}<span><b>“${c.t}”</b><small>${"★".repeat(c.q)+"☆".repeat(5-c.q)}${S.day-c.day>=2?" · going stale":""}${c.h?" · the law watches this too":""}</small></span></div><div class="row2"><button class="act hot" data-x="${xa(post)}"><span>Post it</span>${c.h?`<small>Heat +${c.h}</small>`:""}</button><button class="act" data-x="${xa(()=>{S.cl.clip=null})}"><span>Scrap it</span></button></div>`
   :`<p class="empty">Nothing to post. Race, run, fight, or film a stunt session at the Lake.</p>`;
  if(full||on.length||best.some(s=>C.f>=s.need))x+=`<h4>Sponsors</h4>`+on.map(s=>`<div class="spon">${ico("star")}<span><b>${s.n} · ${$$(s.pay)}/week</b><small>${s.req}${C.warn[s.id]?" · <em>holding this week's pay</em>":""}</small></span></div>`).join("");
  // deals you can sign show everywhere; the ones still out of reach only in the app
  x+=best.filter(s=>full||C.f>=s.need&&on.length<3).map(s=>{const can=C.f>=s.need&&on.length<3;return `<div class="spon${can?"":" locked"}">${ico(can?"star":"lock")}<span><b>${s.n} · ${$$(s.pay)}/week</b><small>${can?s.req:C.f<s.need?"at "+s.need.toLocaleString()+" followers":"three deals at a time"}</small></span>${can?`<button class="mini" data-x="${xa(()=>sign(s))}">Sign</button>`:""}</div>`}).join("");
  return x;
}

// ---- Runner: deliveries on the app ----
function runnerCard(){
  const G=S.gig,night=S.h>=20||S.h<5,off=G.off>S.day;
  return `<div class="big"><b>★ ${G.rate.toFixed(2)}</b><small>${G.runs} deliveries · ${S.car?"in the truck":"on a borrowed bike"}${G.rate>=4.85?" · priority pay":""}</small></div>`
   +(off?`<p class="empty">The app deactivated you until day ${G.off}. Rating under 3.8.</p>`:`<button class="act${night?" hot":""}" data-x="${xa(shiftRun)}"${S.en<20?" disabled":""}><span>Start a shift</span><small>3 hrs · ${S.car?"3":"2"} runs${night?" · late surge":""}${S.en<20?" · too tired":""}</small></button>`)
   +`<p class="note">Any time, from anywhere. Keep your rating over 4.85 for priority pay; under 3.8 and you're off the app. Tired, hungry drivers get bad reviews.</p>`;
}
// One random thing that happens on a shift. when(): whether it can happen now.
const GIG=[
 {fn:()=>{S.cash+=40;S.gig.rate=Math.min(5,S.gig.rate+.05);log("A guy in a bathrobe tips $40 on a $12 order and calls you a legend.")}},
 {fn:()=>{S.gig.rate=Math.max(3,S.gig.rate-.25);log("The address is a parking garage. The customer gives you one star and a paragraph.")}},
 {fn:()=>{S.en=cl(S.en-10);log("A pit bull named Princess chases you two blocks. You win. Barely.")}},
 {when:()=>pp("rosa").met&&isOpen(L.diner.o,S.h)&&stage("rosa")>=0,fn:()=>{S.food=cl(S.food+15);bond("rosa",2);log("One pickup is at Lucky's. Rosa throws in a slice of pie \"for the driver\" and watches you eat it.")}},
 {when:()=>pp("marcus").met&&stage("marcus")>=0,fn:()=>{bond("marcus",1);log("You deliver wings to Marcus's crew at the ramp. He tips in trash talk, and then, grudgingly, five bucks.");S.cash+=5}},
 {when:()=>(S.h>=20||S.h<5)&&pp("dex").met&&!S.z.dexDead,fn:()=>modal("Off the app","Your last drop is a motel. The guy at the door doesn't want his food. He wants a shoebox carried across town, off the app, for $150. \"Dex says you're reliable.\"",[
   ["Take the box",()=>{S.cash+=150;bond("dex",2);log("Nobody stops you. The guy at the other end doesn't say thank you either.");crime(8);copRoll(.8)}],["Stick to food",()=>log("You leave the box on the step and the guy shuts the door on you.")]])},
 {when:()=>S.car,fn:()=>modal("Truck trouble","The old pickup coughs, shudders, and dies at a green light. Somebody behind you leans on the horn like that helps.",[
   [lvl("wrench")?"Fix it yourself · Wrenching "+lvl("wrench"):"Fix it yourself (need Wrenching 1)",()=>{tick(1);xp("wrench");log("Corroded battery terminal. A pocketknife and a soda fixes it. You finish the run.")},!lvl("wrench")],
   ["Call a tow · $60",()=>{S.cash=Math.max(0,S.cash-60);S.gig.rate=Math.max(3,S.gig.rate-.1);log("The tow costs $60 and the late order costs you a star.")}]])},
 {when:()=>(S.h>=20||S.h<5)&&S.heat>=40,fn:()=>copRoll(1.2)}];
function shiftRun(){
  const G=S.gig;if(G.off>S.day||S.en<20)return;
  // about what a diner shift pays by the hour in the truck, less on the bike; the late surge and a good rating pay more
  const night=S.h>=20||S.h<5,n=S.car?3:2,each=(S.car?16:11)*(night?1.35:1)*(G.rate>=4.85?1.2:1);
  let pay=0;for(let i=0;i<n;i++)pay+=Math.round(each+r()*(S.car?10:8));
  S.cash+=pay;S.en=cl(S.en-15);G.runs+=n;G.shifts++;G.day=S.day;
  G.rate=Math.min(5,Math.max(3,G.rate+(S.en<25||S.food<20?-.15:.03)));
  log((S.car?"Three runs in the truck":"Two runs on a borrowed bike")+(night?" on the late surge":"")+". "+$$(pay)+" after the app takes its cut.");
  tick(3);if(S.over)return;
  if(r()<.42){const e=GIG.filter(e=>!e.when||e.when());pick(e).fn()}
  if(G.rate<3.8){G.off=S.day+2;G.rate=4.2;log("Runner deactivates you for two days. \"Our drivers are the heart of our community.\"")}
}

// ---- tuning jobs at Tommy's ----
const CUST=[["A dentist","a brand-new 300-horse three-seater","Make it fast. I don't care what it costs."],
 ["A kid who saved for two years","a ten-year-old stand-up","Whatever you can get out of it. Please don't blow it up."],
 ["An out-of-town racer","a race-prepped hull","I've got a final Saturday. I need everything."],
 ["A charter captain","one of his rentals","Make it stop bogging. I lose money every day it's down."],
 ["A guy in a very nice watch","a supercharged cruiser","My neighbor's is faster. Fix that."],
 ["The woman who runs the marina café","a well-kept two-seater","Something with a little more snap."]];
function tuneJob(){
  const W=lvl("wrench"),c=pick(CUST),b=(S.gar?1.3:1)*(1+.04*Math.min(10,S.tn.rep)),$p=v=>$$(Math.round(v*b/10)*10);S.tn.day=S.day;
  modal("Tuning job",c[0]+" rolls in with "+c[1]+". \""+c[2]+"\""+(S.tn.rep>=5?" Word's out that you're the one to see.":"")+"<p class=\"note\">The hotter the map, the more it pays and the more likely it lets go on the first pull.</p>",[
   ["Mild map · "+$p(120)+" · safe",()=>tuneDo(0,b)],
   [W>=2?"Hot map · "+$p(260):"Hot map (need Wrenching 2)",()=>tuneDo(1,b),W<2],
   [W>=4?"Race map · "+$p(520):"Race map (need Wrenching 4)",()=>tuneDo(2,b),W<4],
   ["Talk them out of it",()=>{S.rep=cl(S.rep+1);tick(1);log("You talk them out of it. They leave happier than if you'd taken their money, and that gets around.")}]]);
}
function tuneDo(lv,b){
  const W=lvl("wrench"),pay=Math.round([120,260,520][lv]*b/10)*10,risk=lv===0?0:lv===1?Math.max(.06,.3-.07*(W-2)):Math.max(.1,.36-.08*(W-4));
  tick(3);if(S.over)return;S.en=cl(S.en-15);xp("wrench",lv+1);S.tn.jobs++;
  if(r()<risk){const cost=[0,150,400][lv];S.cash=Math.max(0,S.cash-cost);S.tn.fails++;S.tn.rep=Math.max(0,S.tn.rep-2);S.rep=cl(S.rep-2);
    log("Two clean passes, then the knock sensor lights up and it lays down in the middle of the lake. You eat "+$$(cost)+" in parts, and the customer tells everybody at the ramp.")}
  else{S.cash+=pay;S.tn.rep++;S.rep=cl(S.rep+lv);if(!S.gar&&stage("tommy")>=0)bond("tommy",1);
    log(["It pulls clean and idles like a sewing machine.","Fourteen hundred more rpm and it still idles. The customer laughs out loud on the test pass.","It comes out of the hole like it's been shot. The customer can't stop grinning."][lv]+" "+$$(pay)+"."+([5,10].includes(S.tn.rep)?" Word's getting around: people are asking for you by name.":""))}
}

// ---- what each place adds for the hustles ----
function hustleActs(at,add){
  if(at==="garage"){const ok=S.gar||stage("tommy")>=1&&lvl("wrench")>=1;
    add("Take a tuning job",!ok?(lvl("wrench")<1?"need Wrenching 1":"Tommy has to know you better"):S.tn.day===S.day?"one a day":"reflash a customer's ski · 3 hrs",ok&&S.tn.day!==S.day&&S.en>=20,tuneJob)}
  if(at==="lake")add("Film a stunt session",S.cl.stunt===S.day?"one a day":"$20 fuel · 2 hrs · for Clout",S.cl.stunt!==S.day&&S.en>=25&&S.cash>=20,stunt);
}

// ---- the Hustles tab ----
function hustleView(){
  const I=HS.info(),inc=income(),D=pp("dex"),card=(ic,t,sub,x,go)=>`<section class="card hc"><h3>${ico(ic)}${t}${sub?`<small>${sub}</small>`:""}</h3>${x}${go?`<button class="go" data-go="${go[0]}">${ico("pin")}${go[1]}</button>`:""}</section>`;
  const tn=S.gar||stage("tommy")>=1&&lvl("wrench")>=1;
  let x=`<h2>Hustles</h2><p class="key">${inc?"Coming in every morning: "+$$(inc)+". ":""}Every way you make money, legit or not.</p>`;
  x+=card("trophy","Racing",I.round>=I.total?"season over":"round "+(I.round+1)+" of "+I.total,
    `<div class="row"><span>Series</span><b>${I.round?ord(I.pos)+" on "+I.pts+" pts":"no rounds yet"}</b></div><div class="row"><span>Next</span><b>${I.round<I.total?I.next+", day "+motoDay(I.round):"new season soon"}</b></div><div class="row"><span>Your ski</span><b>${I.craft} · ${I.parts} part level${I.parts===1?"":"s"}${I.wear<60?" · needs service":""}</b></div>`,["lake","Go to the Lake"]);
  x+=card("cam","Clout",S.cl.f?S.cl.f.toLocaleString()+" followers":"post clips, land sponsors",cloutCard(0)+`<button class="go" data-app="clout">${ico("phone")}Open Clout</button>`);
  x+=card("bike","Runner","deliveries on the app",runnerCard());
  x+=card("wrench","Tuning",S.tn.jobs?S.tn.jobs+" jobs · rep "+S.tn.rep:"reflash customers' skis",
    tn?`<p class="note">One job a day at ${S.gar?"your":"Tommy's"} garage. Mild maps are safe money; hot and race maps pay more and sometimes let go.${S.gar?" Your own shop pays 30% more.":""}</p>`:`<p class="note">${lvl("wrench")<1?"You need Wrenching 1 first: work shifts at Tommy's.":"Tommy has to know you better before he lets you near a customer's ski."}</p>`,["garage","Go to Tommy's"]);
  x+=card("case","Shifts","steady money",`<div class="row"><span>Lucky's, on the line</span><b>~$90 · 6 hrs</b></div><div class="row"><span>${S.gar?"Your own bay":"Tommy's, on the tools"}</span><b>~${$$((S.gar?170:130)+15*lvl("wrench"))} · 6 hrs</b></div><div class="row"><span>Fight night, the Iron Den</span><b>after 9pm</b></div><div class="row"><span>Open race, the Lake</span><b>once a day</b></div>`);
  if(D.met&&!S.z.dexDead)x+=card("alert","The street","Dex, after dark",`<div class="row"><span>Crates to Sal</span><b>${S.crates?S.crates+" on you":"$150 from Dex"}</b></div><div class="row"><span>Product</span><b>${held()?held()+" on you":"buy from Dex, sell where it's busy"}</b></div><div class="row"><span>Packages and night runs</span><b>${D.b>=20?"he'll give you work":"he doesn't trust you yet"}</b></div><p class="note">More money, more heat. Heat brings the law, on the street and on the water.</p>`,[where("dex")||"bar","Find Dex"]);
  else if(!D.met&&!S.z.dexDead)x+=card("alert","The street","",`<p class="note">There's a guy in the back booth at the Low End after six, eating sunflower seeds. People say he can get anything.</p>`,["bar","Go to the Low End"]);
  $("hustle").innerHTML=x;
}
