// Side Hustle City, the main game: a life sim. A season of days in a city, rent, jobs, hustles, cops, and eight people whose
// bond with you and trust in you change with what you do. Racing is reached through window.HS (src/game/bridge.js): race
// weekends and open races at the Lake, the ski at Tommy's Garage, Marcus on the drag strip. The page supplies <div id="city">
// and <template id="cityT">. One save, localStorage key "shc". Everything is in this one closure on purpose: its names
// (stage, reset, render, tick, log, S, P, L) would collide with the game's.
(()=>{
// Side Hustle City. It lives in a shadow root laid over the race, so neither page's styles reach the other.
const host=document.getElementById("city"),root=host.attachShadow({mode:"open"});
root.appendChild(document.getElementById("cityT").content.cloneNode(true));
const HS=window.HS;
{const st=()=>{const t=document.documentElement.dataset.theme;if(t)host.dataset.theme=t;else delete host.dataset.theme};st();new MutationObserver(st).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]})}

const L={
home:{n:"Your place",x:60,y:55,c:"#5b6170",o:[0,24],d:"Studio over a laundromat. The radiator bangs all night."},
diner:{n:"Lucky's",x:200,y:55,c:"#c2492f",o:[6,22],d:"24 stools and one grill. Kowalski takes his coffee here before ten."},
court:{n:"Court",x:335,y:55,c:"#2f8f6b",o:[6,21],d:"Chain nets, cracked asphalt, trash talk free of charge."},
bar:{n:"The Low End",s:"Low End",x:60,y:162,c:"#8a2f5c",o:[18,4],d:"Dark, sticky, good jukebox. Dex keeps the back booth."},
pawn:{n:"Gold Line Pawn",s:"Gold Line",x:200,y:162,c:"#b08a22",o:[9,19],d:"Sal buys anything and lends to anyone. Prices drop when the heat's on you."},
garage:{n:"Tommy's Garage",s:"Tommy's",x:335,y:162,c:"#3a6ea5",o:[8,18],d:"Three bays and a test tank, forty years of two-stroke in the floor. Skis get built here."},
docks:{n:"Docks",x:60,y:262,c:"#33545e",o:[20,4],d:"Containers, fog, guys who don't give their names."},
gym:{n:"Iron Den",x:200,y:262,c:"#6b4a8a",o:[6,24],d:"Boxing gym that smells like liniment. Fight night in the basement after nine."},
lake:{n:"The Lake",x:335,y:262,c:"#0f8a9a",o:[6,20],d:"Launch ramp, pit tents, race gas in the air. The tour comes through every five days."}};
const WHO={diner:"rosa",bar:"nia",pawn:"sal",garage:"tommy",gym:"june",lake:"marcus",docks:"dex"};
// The eight people of the city: what they are, the line for each mood, what they tell you as they come to trust you, and how
// they talk. Kept in cast.json so the function that writes their live lines (netlify/functions/talk.mts) reads the same people.
const P=/*@cast*/null;
const TIES=[["rosa","tommy",1],["rosa","kow",.6],["rosa","nia",.6],["rosa","sal",-.6],["nia","marcus",.9],["marcus","june",.7],["marcus","kow",-.5],["dex","sal",.5],["dex","kow",-.4],["june","nia",.4],["tommy","marcus",.4]];
const STRAIGHT=["rosa","tommy","june","nia"],STREETP=["dex","marcus","sal"];
const STG={"-1":"Done with you",0:"Stranger",1:"Knows you",2:"Friend",3:"Close"},ROM=["","Flirting","Dating","Serious","Ex"];
const SK={drive:"Riding",wrench:"Wrenching",charm:"Charm",fight:"Fighting"};
const UP={bed:["A real bed",350,"better sleep"],fridge:["A fridge that works",250,"cheaper, bigger meals"],tv:["Big TV and a console",400,"more mood at home"],safe:["Floor safe",600,"halves what jail and muggers take"]};
const $=id=>root.getElementById(id),cl=(v,a=0,b=100)=>Math.max(a,Math.min(b,v)),r=()=>Math.random(),$$=n=>"$"+Math.round(n).toLocaleString(),pick=a=>a[Math.floor(r()*a.length)];
const mkp=()=>({b:5,t:50,cap:100,met:0,seen:1,talk:0,gift:0,know:0,mood:"flat",rom:0,sorry:-9,date:0,b0:5,t0:50,mem:[]});
const fresh=()=>{const pp={};for(const k in P)pp[k]=mkp();return {day:1,h:8,cash:200,en:80,food:70,mood:60,rep:0,heat:0,at:"home",crates:0,car:0,tune:0,coupe:0,missed:0,bribes:0,crime:0,crimes:0,pk:0,mwins:0,salt:0,tsh:0,gar:0,chop:0,loan:null,lastEv:0,niaWait:0,prom:0,free:0,fin:0,openDay:0,dragDay:0,season0:0,life:5*HS.info().total,hot:0,race:null,tourPos:0,
 sk:{drive:0,wrench:0,charm:0,fight:0},home:{bed:0,fridge:0,tv:0,safe:0},q:{dex:0,rosa:0,marcus:0,nia:0,june:0},pp,inbox:[],proms:[],done:{},pend:[],log:[],over:0,z:freshZ(),cl:freshCl(),gig:freshGig(),tn:freshTn(),asp:"",booked:0,hap:null}};
let S=fresh();
try{const o=JSON.parse(localStorage.getItem("shc"));if(o){Object.assign(S,o);const f=fresh();
  for(const k of["sk","home","q"])S[k]=Object.assign(f[k],o[k]||{});
  S.z=Object.assign(f.z,o.z||{});S.z.stash=Object.assign(freshZ().stash,(o.z||{}).stash||{});
  S.cl=Object.assign(f.cl,o.cl||{});S.gig=Object.assign(f.gig,o.gig||{});S.tn=Object.assign(f.tn,o.tn||{});
  S.pp=f.pp;for(const k in P){const p=S.pp[k];if(o.pp)Object.assign(p,o.pp[k]||{});else{const v=(o.rel||{})[k]||0,m=(o.mem||{})[k]||[];p.b=cl(8+v*2.2);p.t=cl(50+Math.min(0,v)*2);p.met=v||m.length?1:0;p.mem=m;p.seen=S.day;p.b0=p.b;p.t0=p.t}}
  if(!o.pp){const n=S.pp.nia;if(o.dating)n.rom=2;if(S.q.nia===3||S.q.nia===2)n.rom=3;if(S.q.nia===4){n.rom=4;n.t=15}if(S.q.rosa===3)S.pp.rosa.t=10;if(S.q.marcus===3)S.pp.marcus.b=70;if(S.q.marcus===2)S.pp.marcus.t=25}
  delete S.rel;delete S.mem;delete S.dating;
  for(const k of["pend","inbox","proms"])S[k]=S[k]||[];S.done=S.done||{};
  if(S.over==="garage"){S.gar=1;S.over=0}if(S.over==="time"){S.over=0;S.free=1;S.fin=1}}}catch(e){S=fresh()}
const save=()=>{try{localStorage.setItem("shc",JSON.stringify(S))}catch(e){}};
const isOpen=(o,h)=>o[0]<o[1]?h>=o[0]&&h<o[1]:h>=o[0]||h<o[1];
const fmtH=h=>{h%=24;return (h%12||12)+(h<12?"am":"pm")};
const log=t=>{S.log.unshift({t:"D"+S.day+" "+fmtH(S.h),x:t});S.log=S.log.slice(0,60)};
const lvl=k=>Math.min(5,Math.floor(S.sk[k]/3));
const xp=(k,n=1)=>{const a=lvl(k);S.sk[k]+=n;if(lvl(k)>a)log(SK[k]+" went up to level "+lvl(k)+".")};
const take=f=>{const t=Math.round(S.cash*(S.home.safe?f/2:f));S.cash-=t;return t};
const pay=b=>S.mood<20?Math.round(b*.8):b;
const ord=p=>p+(p===1?"st":p===2?"nd":p===3?"rd":"th"),motoDay=n=>S.season0+5*(n+1);
// people
const pp=k=>S.pp[k],her=k=>P[k].g==="she"?"her":"him";
const bond=(k,n)=>{pp(k).b=cl(pp(k).b+n)};
const trust=(k,n)=>{const p=pp(k);p.t=cl(p.t+n,0,p.cap);if(n<0)p.hurt=1};
const scar=(k,n,c=10)=>{const p=pp(k);p.cap=Math.max(40,p.cap-c);trust(k,-n)};
const meet=k=>{const p=pp(k);p.met=1;p.seen=S.day};
const stage=k=>{const p=pp(k);return p.t<20?-1:p.b<15?0:p.b<35?1:p.b<60?2:3};
const rem=(k,t)=>{const m=pp(k).mem;if(m[0]!==t)m.unshift(t);m.length=Math.min(m.length,4)};
function gossip(k,amt,txt){for(const [a,b,w] of TIES){const o=a===k?b:b===k?a:0;if(!o||!pp(o).met)continue;const d=amt*w;bond(o,d*.5);trust(o,d*.4);if(Math.abs(d)>=3)rem(o,"Heard "+txt)}}
const tieTxt=k=>{const g=[],b=[];for(const [a,c,w] of TIES){const o=a===k?c:c===k?a:0;if(o)(w>0?g:b).push(P[o].n)}return (g.length?"Talks to "+g.join(", ")+". ":"")+(b.length?"No love for "+b.join(", ")+".":"")};
const gone=k=>k==="kow"&&!!S.kowGone||k==="dex"&&!!S.z.dexDead;
const friends=()=>Object.keys(P).filter(k=>pp(k).met&&stage(k)>=2&&!gone(k)).length;
const income=()=>(S.gar?220+30*lvl("wrench")+(stage("tommy")>=2?60:0):0)+(S.chop?500:0)+(S.q.rosa===1?80:0)+(S.q.nia===2?150:0)+streetInc();
const rentDay=d=>d>1&&d%7===1,rentAmt=()=>{const b=PAD[S.z.pad][1];return S.q.nia===3?b/2:b};
const open=()=>$("modal").classList.contains("show"),pq=k=>{S.pend.includes(k)||S.pend.push(k)};
let MQ=[],RT=0;
// A dialog comes up from the bottom. When its title names a person (see whoOf in ui.js) it shows their face, and for one of
// the eight, where you stand with them. Texts look like texts.
function draw(t,x,ch){
  modal.cur=[t,x,ch];const k=whoOf(t),q=k&&P[k]?pp(k):null;
  const head=k?`<div class="who">${face(k,q?moodOf(k):"flat",artUse()?88:64)}<div><h3>${t}</h3>${q&&q.met?`<small>${q.rom?ROM[q.rom]:STG[stage(k)]}</small><div class="bars"><div><i style="width:${q.b}%"></i></div><div class="tr"><i style="width:${q.t}%"></i></div></div>`:q?`<small>${P[k].role}</small>`:""}</div></div>`:`<h3>${t}</h3>`;
  $("sheet").className="sheet"+(/^Text from |^Unknown number$/.test(t)?" text":"");
  $("sheet").innerHTML=`${head}<div class="body">${x}</div><div class="acts">${ch.map((c,i)=>`<button data-ch="${i}"${c[2]?" disabled":""}>${c[0]}</button>`).join("")}</div>`;
  modal.ch=ch;$("modal").classList.add("show");$("sheet").scrollTop=0}
function modal(t,x,ch,lock){
  if(S.over&&!lock)return;
  if(lock)MQ=[];else if(open()){MQ.push([t,x,ch]);return}
  draw(t,x,ch);
}
function reset(){S=fresh();HS.resetAll();MQ=[];clearInterval(RT);RT=0;PH.open=0;TRAVEL=null;lastCash=null;$("modal").classList.remove("show");log("Day 1. $200, a studio apartment and a bare ski. Rent's due on day 8. The first race weekend is day 5.")}
function hot(){if(S.heat<100||S.over)return;const K=pp("kow");if(!S.tipped&&!S.kowGone&&K.b>=35&&K.t>=55){S.tipped=1;S.heat=88;pq("tip")}else if(!S.z.raided)raid();else end("raid")}
function crime(h){
  S.heat=cl(S.heat+h);S.crime=1;S.crimes++;
  if(S.q.nia===1){S.q.nia=4;pq("niaBust")}
  hot();
}
// time
function newDay(){
  if(!S.crime)S.heat=cl(S.heat-4);S.crime=0;
  const inc=income();if(S.chop){S.heat=cl(S.heat+7);S.crime=1}if(S.q.nia===2)S.heat=cl(S.heat+3);
  if(inc){S.cash+=inc;log("Overnight take: "+$$(inc)+".")}
  hot();if(S.over)return;
  if(RAIDED){RAIDED=0;return}     // a raid took the week, and ran its own days
  motoCheck();
  if(rentDay(S.day)&&rentAmt()){const a=rentAmt();
    if(S.cash>=a){S.cash-=a;log("Rent's paid. "+$$(a)+" gone like that.")}
    else{S.missed++;log("Couldn't make rent. Landlord taped a notice to your door.");
      if(S.missed>=2){const h=["nia","rosa","tommy","june","marcus"].find(k=>pp(k).met&&stage(k)>=3);if(h&&!S.couch){S.couch=1;S.missed=1;bond(h,-3);pq("couch:"+h)}else return end("evicted")}}}
  if(S.loan&&S.day>S.loan.due){
    if(S.cash>=S.loan.amt){S.cash-=S.loan.amt;S.loan=null;trust("sal",-3);rem("sal","Had to send guys to collect");log("Sal's guys collect at your door. Paid in full. They take a beer from your fridge on the way out.")}
    else{S.loan.amt=S.loan.amt-S.cash+200;S.cash=0;S.en=cl(S.en-30);S.mood=cl(S.mood-20);scar("sal",10,5);rem("sal","You paid late");log("Sal's guys empty your pockets and break a finger for the trouble. You still owe "+$$(S.loan.amt)+".")}}
  for(const k in P){const p=pp(k);if(!p.met)continue;const away=S.day-p.seen;
    if(p.rom===2||p.rom===3){if(away>=2)bond(k,-3);if(away===3)pq("nag:"+k);if(away>=6)pq("dump:"+k)}
    else if(away>=3&&p.b>20)bond(k,-1.5);
    if(!p.hurt)trust(k,1);p.hurt=0;
    if(S.heat>=60&&STRAIGHT.includes(k)&&!(k==="nia"&&S.q.nia===2))trust(k,-2);
    if(S.rep>=40&&STREETP.includes(k))bond(k,.5);
    const x=r(),dn=k==="rosa"&&(!S.q.rosa&&S.day>=14||S.q.rosa===5)?.6:.25;
    p.mood=x<dn?"down":x<dn+.45?"flat":"up";p.talk=0;p.gift=0;p.sayB=0;p.sayT=0;p.b0=p.b;p.t0=p.t}
  if(S.day===16&&pp("rosa").met&&!S.q.rosa)queueAsk("rosa_deadline");
  if(S.day===20&&!S.q.rosa){S.q.rosa=5;pq("salTakes")}
  for(const [f,e] of [["bag","bagPickup"],["oweDay","niaPays"],["examDay","niaExam"],["tashaDay","tasha"],["fake","fakeName"],["revenge","dexRevenge"],["covered","tommyFinds"]])if(S[f]&&S.day>=S[f])pq(e);
  if(S.snitch&&S.day>=S.snitch.day)pq("snitchOut");
  if(S.q.nia===1&&S.day-S.prom>=5)pq("niaMove");
  const D=pp("dex"),M=pp("marcus");
  if(D.met&&!S.z.dexDead&&D.t<30&&!S.dexRat&&S.heat>=40){S.dexRat=1;S.heat=cl(S.heat+20);log(S.ci?"Dex has been talking to Kowalski about you. You'd know that notebook anywhere.":"Somebody's been talking. The cops know where you sleep now.")}
  if(S.q.marcus!==3&&M.met&&(M.t<30||S.salt>=3&&stage("marcus")<2)&&r()<.25){S.salt=0;pq("jumped")}
  if(pp("nia").rom>=2&&pp("nia").rom<4&&pp("june").rom>=2&&pp("june").rom<4&&r()<.25)pq("caught");
  if(S.chop&&S.heat>=60&&r()<.4)pq("inspect");
  if(S.day>(S.life||45)&&!S.free&&!S.fin){S.fin=1;pq("finale")}
  streetDay();cloutDay();hapRoll();
  pq("recap");
}
function dawn(){
  S.proms=S.proms.filter(pr=>{if(pr.due>=S.day)return 1;const a=ASK[pr.id];scar(a.who,10,4);bond(a.who,-5);rem(a.who,"You said you'd be there and you weren't");log(P[a.who].n+" waited on you. You never showed.");return 0});
  S.inbox=S.inbox.filter(m=>{if(m.day>=S.day)return 1;const w=ASK[m.id].who;bond(w,-2);rem(w,"Left on read");return 0});
}
function morning(){
  if(S.inbox.length+S.proms.length>=3)return;
  const id=Object.keys(ASK).sort(()=>r()-.5).find(id=>{const a=ASK[id],d=S.done[id];return !a.manual&&pp(a.who).met&&!gone(a.who)&&stage(a.who)>=0&&(a.once?!d:!d||S.day-d>=4)&&!S.proms.some(x=>x.id===id)&&a.when()});
  if(id)queueAsk(id);
}
function tick(n,sleep){
  for(let i=0;i<n&&!S.over;i++){
    S.h++;if(S.h===24){S.h=0;S.day++;newDay();if(S.over)break}
    if(S.h===5)dawn();if(S.h===8){streetMorning();morning()}
    S.food=cl(S.food-(sleep?2:4));S.en=cl(S.en+(sleep?12:-3));
    if(S.food<=0)S.mood=cl(S.mood-3);
  }
  if(!S.over&&S.en<=0){S.at="home";S.en=30;S.mood=cl(S.mood-20);tick(6,1);log("You blacked out from exhaustion and woke up on your own floor. Somehow.")}
}
// texts and promises
const ASK={
rosa_cover:{who:"rosa",when:()=>S.q.rosa<3&&r()<.3,text:"Cook walked out mid-shift. Can you cover the line today?",need:"shift_diner",what:"Cover the line at Lucky's",win:()=>{S.cash+=40;log("Rosa tucks an extra $40 in your apron. \"Shut up and take it.\"")}},
rosa_walkin:{who:"rosa",once:1,when:()=>S.q.rosa<3&&lvl("wrench")>=1&&stage("rosa")>=1,text:"Walk-in cooler died and the inspector comes the day after tomorrow. Tommy says you can turn a wrench. Please.",need:"fix_walkin",due:1,what:"Fix Rosa's walk-in cooler",win:()=>gossip("rosa",8,"you saved Lucky's from the health inspector")},
rosa_deadline:{who:"rosa",manual:1,text:"Sal says the 20th or he changes the locks. I'm not asking for anything. I just needed somebody to know.",opts:()=>[["\"I'm coming by.\"",0]]},
tommy_open:{who:"tommy",when:()=>!S.gar&&S.tsh>=2&&r()<.3,text:"Back's out. Open the shop for me today? Key's under the mat. Don't tell anybody that.",need:"shift_garage",what:"Open Tommy's shop",win:()=>trust("tommy",6)},
nia_slow:{who:"nia",when:()=>stage("nia")>=1&&pp("nia").rom!==4&&r()<.3,text:"Dead in here tonight. Come keep me company?",need:"see_nia",what:"Keep Nia company at the bar"},
nia_bro:{who:"nia",once:1,when:()=>pp("nia").know>=2&&pp("nia").b>=35,text:"Weird ask. Can you put $200 on my brother's commissary? I get paid Friday.",opts:()=>[
  ["Send it ($200)",()=>{S.cash-=200;S.oweDay=S.day+4;bond("nia",6);trust("nia",8);rem("nia","You fronted $200 for her brother");log("Sent. Nia: \"I owe you. Literally.\"")},S.cash<200],
  ["Send it and tell her to forget the money",()=>{S.cash-=200;bond("nia",12);trust("nia",10);rem("nia","Looked after her brother and wouldn't take it back");gossip("nia",6,"you looked out for Nia's brother");log("Nia doesn't answer for an hour. Then: \"Okay. Who raised you?\"")},S.cash<200],
  ["\"I'm tapped out.\"",()=>{bond("nia",-2);log("Nia: \"No, yeah. Forget I asked.\"")}]]},
nia_exam:{who:"nia",once:1,when:()=>S.day>=9&&stage("nia")>=2,text:"Entrance exam for the nursing program is the day after tomorrow. Quiz me tonight? I'm losing it.",need:"see_nia",what:"Quiz Nia before her exam",on:()=>{S.examDay=S.day+2},win:()=>{S.study=1;log("Flash cards on the bar until close. She knows it cold. She doesn't believe you.")}},
marcus_gasket:{who:"marcus",once:1,when:()=>S.day>=4&&lvl("wrench")>=1&&S.q.marcus<2,text:"Supercharger let go in practice. Tommy says you're decent. Help me pull it tomorrow? I'd owe you.",need:"help_marcus",due:1,what:"Help Marcus at Tommy's Garage",win:()=>{bond("marcus",12);gossip("marcus",5,"you spent a day wrenching on Marcus's ski")}},
marcus_crew:{who:"marcus",once:1,when:()=>stage("marcus")>=2,text:"Out-of-town crew at the ramp today talking reckless. Come race. Open race, the strip, I don't care which.",need:"race",what:"Race at the Lake alongside Marcus's crew",win:()=>{S.cash+=300;S.rep=cl(S.rep+5);log("The out-of-towners go home quiet. Marcus hands you $300 from the pot.")}},
dex_bag:{who:"dex",once:1,when:()=>S.day>=3&&stage("dex")>=1,text:"Need you to hold a bag for two days. Don't open it. Three hundred when I pick it up.",opts:()=>[
  ["\"Bring it by.\"",()=>{S.bag=S.day+2;trust("dex",4);log("A gym bag shows up under your sink. It's heavier than clothes.")}],
  ["\"Not in my house.\"",()=>bond("dex",-2)]]},
june_spar:{who:"june",once:1,when:()=>lvl("fight")>=1,text:"My kid Tasha fights Saturday. I need somebody to spar her who won't hurt her or baby her. Tomorrow.",need:"train",due:1,what:"Spar with Tasha at the Iron Den",on:()=>{S.tashaDay=S.day+3},win:()=>{S.spar=1;log("Tasha tags you clean twice. June pretends not to smile.")}},
june_card:{who:"june",once:1,when:()=>lvl("fight")>=2&&stage("june")>=2,text:"Lost my main event. You're on the card tonight if you want it. Double purse.",need:"fight",what:"Fight on June's card tonight",win:()=>{S.cash+=200;log("June hands you a $200 purse on top. \"You showed up. That's most of it.\"")}},
sal_collect:{who:"sal",once:1,when:()=>S.day>=6&&pp("tommy").met,text:"Got a guy two weeks late on six hundred. Go remind him. Three hundred for you.",opts:()=>[["\"Who is it?\"",salCollect],["\"Not my line of work.\"",()=>bond("sal",-2)]]},
kow_name:{who:"kow",once:1,title:"Unknown number",when:()=>S.day>=7&&(S.heat>=30||S.bribes>0)&&!S.kowGone,text:"It's Kowalski. Somebody's boosting skis and trailers off the ramp and you hear things. Give me a name and your problems get smaller.",opts:()=>[
  ["Give him Marcus",()=>{S.heat=cl(S.heat-30);bond("kow",8);trust("kow",12);S.snitch={who:"marcus",day:S.day+2};log("You type one word. Your heat drops by morning. Your stomach doesn't.")},!pp("marcus").met],
  ["Give him Dex",()=>{bond("kow",2);S.ci=1;log("Kowalski: \"Dex? Dex is mine, genius.\" So that's how Dex stays out of jail.")},!pp("dex").met],
  ["Give him a name you made up",()=>{S.heat=cl(S.heat-15);S.fake=S.day+3;log("\"Ricky Delgado.\" There is no Ricky Delgado. Yet.")}],
  ["\"I don't hear anything.\"",()=>{trust("kow",-3);S.rep=cl(S.rep+2);log("Kowalski: \"Suit yourself.\"")}]]},
kow_ia:{who:"kow",once:1,must:1,raw:1,title:"Gray suit",when:()=>S.bribes>=2&&S.day>=12&&!S.kowGone,text:"A woman in a gray suit sits down across from you and orders nothing. Internal Affairs. She knows about the envelopes. She wants Kowalski, not you.",opts:()=>[
  ["Tell her everything",()=>{S.kowGone=1;S.heat=cl(S.heat-30);S.rep=cl(S.rep-10);gossip("kow",-8,"you gave Kowalski up to Internal Affairs");log("Kowalski's desk is empty by Friday. The new guy, Reyes, doesn't take coffee from anybody.")}],
  ["\"Never met the man.\"",()=>{bond("kow",15);trust("kow",20);S.kowOwes=1;rem("kow","IA asked about him and you said nothing");log("She leaves a card. Kowalski finds you that night. \"I heard you didn't say a word. I won't forget it.\"")}],
  ["\"What's it worth?\"",()=>{S.cash+=1000;S.kowGone=1;S.rep=cl(S.rep-15);S.heat=cl(S.heat-20);gossip("kow",-10,"you sold Kowalski to Internal Affairs for a grand");log("A thousand dollars in a plain envelope, which is funny if you think about it. Kowalski's gone by Friday.")}]]}};
function queueAsk(id){const a=ASK[id];S.done[id]=S.day;S.inbox.push({id,day:S.day});pq("ask:"+id);a.on&&a.on();if(!a.raw)log("Text from "+(a.title||P[a.who].n)+".")}
function showAsk(id){
  const a=ASK[id],c=P[a.who],out=()=>{S.inbox=S.inbox.filter(x=>x.id!==id)};if(!S.inbox.some(x=>x.id===id))return;
  const ch=a.opts?a.opts().map(o=>[o[0],()=>{out();o[1]&&o[1]()},o[2]]):
   [["\"I'll be there.\"",()=>{out();S.proms.push({id,due:S.day+(a.due||0)});log("You told "+c.n+" you'd be there"+(a.due?" tomorrow.":" today."))}],
    ["\"Can't. Sorry.\"",()=>{out();bond(a.who,-2);rem(a.who,"You said no, but you said it straight")}]];
  if(!a.must)ch.push(["Reply later",0]);
  modal(a.title||"Text from "+c.n,(a.raw?a.text:"\""+a.text+"\"")+(a.opts?"":"<p class=\"note\">Say yes and it's a promise. Breaking one costs a lot more than saying no.</p>"),ch);
}
function did(need){
  for(const m of S.inbox.concat(S.proms)){const a=ASK[m.id];if(a.need!==need)continue;const pr=S.proms.includes(m);
    S.inbox=S.inbox.filter(x=>x!==m);S.proms=S.proms.filter(x=>x!==m);
    bond(a.who,pr?8:6);trust(a.who,pr?7:4);rem(a.who,"You showed up when "+P[a.who].g+" asked");log("You came through for "+P[a.who].n+".");a.win&&a.win()}
}
// hanging out
function hang(k,free){
  const p=pp(k),c=P[k];if(!free)tick(1);if(S.over)return;meet(k);if(k==="nia")did("see_nia");
  if(stage(k)<0)return modal(c.n,c.cold,[["Try to make it right",()=>amends(k)]].concat(sayOn()?[["Say something in your own words",()=>sayOpen(k)]]:[],[["Leave",0]]));
  const ch=[["Ask how "+c.g+"'s really doing",()=>talk(k,"listen")],["Joke around",()=>talk(k,"joke")]];
  if(sayOn())ch.push(["Say something in your own words",()=>sayOpen(k)]);
  if(c.rom&&p.rom<2||p.rom===4)ch.push(["Flirt",()=>talk(k,"flirt")]);
  if(!p.gift)ch.push([c.treat[0]+" · $"+c.treat[1],()=>{S.cash-=c.treat[1];p.gift=1;bond(k,p.mood==="down"?6:4);log(c.treat[0]+". "+c.n+(p.mood==="down"?" needed that more than "+c.g+" lets on.":" pretends it's no big deal."))},S.cash<c.treat[1]]);
  if(p.t<45)ch.push(["Try to make it right",()=>amends(k)]);
  modal(c.n,c.mood[p.mood]+(S.heat>=50&&STRAIGHT.includes(k)?" "+c.n+" lowers "+(c.g==="she"?"her":"his")+" voice. \"People have been asking about you.\"":""),ch.concat([["Leave it there",0]]));
}
function talk(k,how){
  const p=pp(k),c=P[k],m=p.mood,ch=lvl("charm")>=4?2:lvl("charm")>=2?1:0;xp("charm");
  if(p.talk++){bond(k,1);return log(c.n+" has had about enough of you for one day. In a nice way.")}
  if(how==="flirt"){
    if(p.rom===4){if(p.t>=50&&p.b>=45&&!p.back){p.back=1;p.rom=1;return log(c.n+" looks at you for a long time. \"One more. That's all you get.\"")}return log(c.n+": \"Don't.\"")}
    if(m==="down")return log("Not the night for it. "+c.n+" barely hears you.");
    if(p.b<28){bond(k,1);return log(c.n+": \"Does that work on other people?\"")}
    bond(k,3+ch);if(!p.rom){p.rom=1;return log(c.n+" holds the look a second longer than necessary. Something just changed.")}
    return log(c.n+" gives it right back. You lose the exchange and don't mind.")}
  if(how==="joke"){if(m==="down"){bond(k,-3);return log(c.n+" just looks at you. Read the room.")}bond(k,(m==="up"?7:4)+ch);return log(m==="up"?"You get "+c.n+" laughing hard enough to draw looks.":"That gets a smirk out of "+c.n+".")}
  bond(k,(m==="down"?7:m==="flat"?4:2)+ch);trust(k,m==="down"?3:1);
  const i=p.know;
  if(i<3&&p.b>=[18,38,60][i]){
    if(p.t>=[30,45,60][i]){p.know++;bond(k,3);if(k==="kow"&&i===2)S.ci=1;return modal(c.n,c.know[i],[["Good to know",0]])}
    return log(c.n+" starts to say something, then changes the subject. Not yet.")}
  log(m==="down"?c.n+" talks for a while. You mostly nod. It was the right call.":m==="flat"?c.n+" shrugs, then tells you about the week anyway.":c.n+"'s in too good a mood to get deep. Fair.");
}
function amends(k){const p=pp(k),c=P[k];
  modal(c.n,"Trust is "+Math.round(p.t)+". The most it can ever be again is "+p.cap+". Some things heal. Some leave a mark.",[
   ["Apologize. No excuses.",()=>{if(S.day-p.sorry<3)return log(c.n+": \"You said that already.\" Words wear out.");p.sorry=S.day;trust(k,6+2*lvl("charm"));p.hurt=0;log(c.n+" hears you out. Doesn't say it's okay. Doesn't leave, either.")}],
   ["Put money behind it · $200",()=>{S.cash-=200;trust(k,10);bond(k,2);p.hurt=0;log(c.n+" takes the envelope. \"This doesn't fix it. It's a start.\"")},S.cash<200],
   ["Not today",0]]);
}
function romActs(k,add){const p=pp(k),c=P[k];
  if(p.rom===1&&p.b>=40)add("Ask "+c.n+" out","$60 · 5 hrs",S.cash>=60,()=>{S.cash-=60;p.rom=2;bond(k,8);S.mood=cl(S.mood+30);rem(k,"First date, her place after");tick(5);meet(k);
    modal("Late night",k==="nia"?"Late dinner, too many drinks, a cab back to her place. Morning comes with coffee and a note on the pillow: \"Don't be a stranger.\"":"She takes you to a taco truck behind the gym and out-eats you. Later, her place: fight posters and a cat named Sugar Ray. Morning comes with coffee and \"Don't be late to training.\"",[["Not planning on it",0]])},1);
  if(p.rom===2||p.rom===3)add("Take "+c.n+" out","pick a plan",true,()=>{
    const f=(cost,hrs,b,txt,sleep)=>()=>{const first=p.date!==S.day;S.cash-=cost;if(first){bond(k,b+(p.mood==="down"&&sleep?3:0));trust(k,1)}S.mood=cl(S.mood+(first?15:5));tick(hrs,sleep);p.date=S.day;meet(k);if(k==="nia")did("see_nia");log(txt)};
    modal("A night with "+c.n,c.mood[p.mood],[
     ["Walk the pier · free · 3 hrs",f(0,3,5,c.n+" steals your jacket by the second bench. You let her.")],
     ["Dinner and drinks · $60 · 4 hrs",f(60,4,9,"Corner table, two hours, one dessert, two forks. "+c.n+" laughs with her whole face."),S.cash<60],
     ["Stay in at her place · $30 · 8 hrs",f(30,8,6,"Takeout and a bad movie. You wake up at "+c.n+"'s place. She stole all the blankets again.",1),S.cash<30],
     ["Another night",0]])});
}
function niaMove(){S.q.nia=3;pp("nia").rom=3;S.mood=cl(S.mood+20);bond("nia",6);meet("nia");rem("nia","Moved in with you");log("Nia moves in with four boxes and a cactus. Rent's $200 now. The cactus has a name.")}
function niaStory(){
  if(S.heat>=25||S.crimes>=5)modal("Nia","\"I know what you do at night. Half this bar knows. So what is this, exactly?\"",[
   ["\"I'm done with it. I promise.\"",()=>{S.q.nia=1;S.prom=S.day;bond("nia",6);trust("nia",5);rem("nia","You promised to go straight");log("She studies your face for a long time. \"Okay. Don't make me stupid for believing you.\"")}],
   ["\"Come in on it with me.\"",()=>{S.q.nia=2;pp("nia").rom=3;bond("nia",4);rem("nia","Went into business with you");log("Nia starts moving merchandise through the bar's back room. $150 a day, and a little more heat on both of you.")}],
   ["\"It's complicated.\"",()=>{bond("nia",-6);trust("nia",-4);S.niaWait=S.day+2;log("\"It always is.\" She goes back to work.")}]]);
  else modal("Nia","\"My lease is up. Your place is terrible. I'm thinking I move in and we split the rent anyway.\"",[
   ["\"Do it.\"",niaMove],["\"Not yet.\"",()=>{bond("nia",-3);S.niaWait=S.day+3;log("\"Sure. No rush.\" There's a little rush.")}]]);
}
function juneStory(){const p=pp("june");
  modal("June",S.dove?"\"I know you took that dive. Everybody knows. I don't build anything with people who lie down for money. So which are you?\"":"\"I don't do halfway. Gym, fights, people. So are you in my corner or just passing through?\"",[
   [S.dove?"\"Never again. I'm in your corner.\"":"\"I'm in your corner.\"",()=>{S.q.june=1;p.rom=3;bond("june",8);trust("june",6);rem("june","You said you're in her corner");log("June nods once, like you made weight. \"Then you're family. Family trains at six.\"")}],
   ["\"Let's keep it light.\"",()=>{bond("june",-6);S.juneWait=S.day+3;log("\"Light.\" She says it like a word in another language.")}]]);
}
function niaGossip(){
  tick(1);meet("nia");const w={up:"flying",flat:"fine",down:"having a rough one"},h=[],
   l=Object.keys(P).filter(k=>k!=="nia"&&pp(k).met&&!(k==="kow"&&S.kowGone)).map(k=>P[k].n+" is "+w[pp(k).mood]);
  if(!S.q.rosa&&S.day<20)h.push("Sal's telling people he'll own Lucky's by the 20th.");
  if(pp("dex").met&&pp("dex").t<35)h.push("Dex has been asking where you live.");
  if(S.salt>=2&&stage("marcus")<2)h.push("Marcus's crew is tired of you beating him. Watch your back.");
  if(S.heat>=60)h.push("Two plainclothes were in here last night. They knew your name.");
  modal("What Nia's hearing","\"Bartenders hear everything.\" "+(l.join(". ")||"It's been a quiet week")+"."+(h.length?"<br><br>"+h.join(" "):""),[["Thanks",0]]);
}
function rosaStory(){const can=lvl("charm")>=2||S.rep>=25;
  modal("Rosa","She shuts the office door. She borrowed from Sal to keep Lucky's open. She's $2,000 behind and he's talking about taking the place on the 20th.",[
   ["Pay it off for her ($2,000)",()=>{S.cash-=2000;S.q.rosa=1;bond("rosa",20);trust("rosa",15);bond("sal",2);rem("rosa","Paid off Sal for her");rem("sal","Got Rosa's money from you");gossip("rosa",10,"you paid off Rosa's debt to Sal");log("Rosa cries, then yells at you for making her cry. You're a partner in Lucky's now: $80 a day.")},S.cash<2000],
   [can?"Lean on Sal for her":"Lean on Sal (need Charm 2 or Respect 25)",()=>{S.q.rosa=2;bond("rosa",12);trust("rosa",10);trust("sal",-6);bond("sal",-3);rem("rosa","You got Sal off her back");rem("sal","You talked him down on Rosa's debt");gossip("rosa",6,"you backed Sal down for Rosa");log("You have a quiet word with Sal. He cuts the debt in half and gives her a year. \"You've got a mouth on you.\"")},!can],
   ["Tell Sal you'll collect it for him",()=>{S.cash+=500;S.q.rosa=3;scar("rosa",50,35);bond("rosa",-40);bond("sal",8);trust("sal",6);S.rep=cl(S.rep-5);rem("rosa","Sold her out to Sal");rem("sal","You collected on Rosa for him");gossip("rosa",-14,"you emptied Rosa's register for Sal");log("Sal pays you $500 to empty her register. Rosa watches you do it and says nothing. That's worse.");crime(10)}],
   ["Stay out of it",0]]);
}
function salCollect(){
  modal("Sal","\"Tommy. From the garage. Six hundred, two weeks late. He's old, so be polite. But be clear.\"",[
   ["Collect from Tommy",()=>{S.cash+=300;bond("sal",8);trust("sal",8);scar("tommy",30,15);bond("tommy",-15);rem("tommy","You shook him down for Sal");rem("sal","You collected from Tommy");gossip("tommy",-10,"you leaned on Tommy for Sal");log("Tommy counts it out of the register without looking at you. \"Rosa said you were a good kid.\"");crime(5)}],
   ["Pay Tommy's $600 yourself",()=>{S.cash-=600;bond("sal",3);trust("sal",4);S.covered=S.day+2;rem("sal","You paid another man's debt");log("Sal takes your money and squints. \"You're either a saint or an idiot. I don't lend to either.\"")},S.cash<600],
   ["Warn Tommy and tell Sal no",()=>{bond("tommy",8);trust("tommy",10);bond("sal",-5);trust("sal",-8);rem("tommy","You warned him about Sal");rem("sal","You went around him to Tommy");log("Tommy goes pale, then nods. \"I'll handle it. Thanks for not being that guy.\"")}]]);
}
function openBag(){
  modal("Dex's bag","Two grand in rubber bands. Under it, a notebook: dates, license plates, and a badge number in the margin. You've seen that badge number on a flashlight.",[
   ["Zip it back up",()=>{S.ci=1;log("You put everything back exactly how it was. So Dex and Kowalski talk. Good to know.")}],
   ["Take the $2,000",()=>{S.cash+=2000;S.bag=0;S.ci=1;S.revenge=S.day+2;scar("dex",45,30);bond("dex",-25);rem("dex","You robbed the bag he trusted you with");log("You count it twice. It's still a terrible idea. It's also two thousand dollars.")}]]);
}
// places
function A(){const a=[],add=(n,s,ok,fn,hot)=>a.push({n,s,ok,fn,hot}),at=S.at,H=S.home,prom=id=>S.proms.some(x=>x.id===id);
  if(at==="home"){
    add("Sleep","8 hrs",true,()=>{tick(8,1);if(S.q.nia===3)meet("nia");S.mood=cl(S.mood+5+(H.bed?10:0)+(S.q.nia===3?5:0)+[0,4,10][S.z.pad]);log(H.bed?"Eight hours in a real bed. You wake up human.":"You sleep like the dead. The radiator wins again.")});
    const c=H.fridge?4:6;
    add(H.fridge?"Cook a real meal":"Cook ramen","$"+c+" · 1 hr",S.cash>=c,()=>{S.cash-=c;S.food=cl(S.food+(H.fridge?55:35));tick(1);log(H.fridge?"Chicken, rice, hot sauce. You're basically a chef.":"Ramen with a sad egg. It hits.")});
    add(H.tv?"Game on the big screen":"Lay low, play video games","3 hrs",true,()=>{S.mood=cl(S.mood+(H.tv?22:12));S.heat=cl(S.heat-3);tick(3);log("Three hours, zero progress, great mood.")});
    if(S.q.nia===3)add("Night in with Nia","3 hrs",true,()=>{const p=pp("nia");if(p.date!==S.day)bond("nia",4);S.mood=cl(S.mood+12);tick(3);p.date=S.day;meet("nia");did("see_nia");log("Nia picks the movie. You pick wrong on purpose so she can complain.")});
    if(S.bag)add("Open Dex's bag","he said don't",true,openBag);
    const left=Object.entries(UP).filter(([k])=>!H[k]);
    if(left.length)add("Fix up the place","furniture",true,()=>modal("Fix up the place","Milk crates and a mattress on the floor. It could be better.",left.map(([k,u])=>[u[0]+" · "+$$(u[1])+" · "+u[2],()=>{S.cash-=u[1];H[k]=1;S.mood=cl(S.mood+8);log("Bought: "+u[0].toLowerCase()+". The place looks less like a crime scene.")},S.cash<u[1]]).concat([["Later",0]])));
  }
  if(at==="diner"){const st=stage("rosa"),lost=S.q.rosa===5;
    if(st<0)add("Rosa won't serve you","try to make it right",true,()=>hang("rosa"));
    else{
      const free=st>=2&&S.ate!==S.day&&!lost,pr=lost?18:14;
      add(free?"Eat on the house":"Eat the special",(free?"Rosa insists":"$"+pr)+" · 1 hr",free||S.cash>=pr,()=>{if(free)S.ate=S.day;else S.cash-=pr;S.food=cl(S.food+60);S.mood=cl(S.mood+5);tick(1);log(free?"Rosa slides a plate over before you sit down. \"You look thin. Eat.\"":"Meatloaf, gravy, coffee that could strip paint.")});
      if(!lost)add("Work a shift on the line","6 hrs · ~$90",S.en>=30,()=>{const p=pay(90);S.cash+=p;S.en=cl(S.en-25);bond("rosa",3);trust("rosa",1);tick(6);meet("rosa");log("Six hours on the grill. "+$$(p)+" in your pocket and you smell like onions.");did("shift_diner")});
      if(prom("rosa_walkin"))add("Fix the walk-in cooler","2 hrs",true,()=>{tick(2);xp("wrench",2);meet("rosa");log("Bad start relay. Eleven dollars and two hours on a cold floor. It hums back to life.");did("fix_walkin")},1);
      if((pp("rosa").b>=40||S.done.rosa_deadline)&&!S.q.rosa)add("Rosa needs to talk","in the office",true,rosaStory,2);
      if(st>=3&&pp("kow").met&&!S.kowGone&&S.heat>=20&&S.day-(S.vouch||-9)>=7)add("Ask Rosa to vouch for you","Heat −15",true,()=>{S.vouch=S.day;S.heat=cl(S.heat-15);bond("rosa",-2);log("Rosa pours Kowalski a refill and talks low for five minutes. He glances at you once. \"Don't make a liar out of me,\" she says after.")});
    }
  }
  if(at==="court"){
    add("Run pickup games","2 hrs",S.en>=25,()=>{S.en=cl(S.en-20);S.mood=cl(S.mood+15);S.rep=cl(S.rep+2);tick(2);const w=["marcus","june","nia","tommy"].filter(k=>pp(k).met&&stage(k)>=0);
      if(w.length&&r()<.35){const k=pick(w);bond(k,3);meet(k);log(P[k].n+" shows up"+(k==="tommy"?" to heckle from a lawn chair. It's the happiest you've seen him.":" and you run twos together. You two don't lose."))}
      else if(r()<.5){clip("court",1,"Game winner at the court");log("You hit the game winner over some guy's outstretched hand. He won't stop talking about it. Neither will you.")}else log("You get cooked in the post. Still fun.")});
    add("Play one-on-one for money","$50 · 1 hr",S.cash>=50&&S.en>=15,()=>{S.en=cl(S.en-15);tick(1);if(r()<.45+S.rep/250){S.cash+=50;S.rep=cl(S.rep+1);log("Game point, step-back, cash. +$50.")}else{S.cash-=50;log("He banks in a prayer from the hash mark. There goes $50.")}});
  }
  if(at==="bar"){const N=pp("nia"),fd=stage("nia")>=2&&S.drank!==S.day;
    add("Have a drink",(fd?"first one's on Nia":"$12")+" · 1 hr",fd||S.cash>=12,()=>{if(fd)S.drank=S.day;else S.cash-=12;S.mood=cl(S.mood+15);S.en=cl(S.en-8);tick(1);log("Whiskey, neat, jukebox playing something older than you are.")});
    romActs("nia",add);
    if(N.rom===2&&N.b>=60&&!S.q.nia&&S.day>=S.niaWait)add("Nia wants to talk","serious face",true,niaStory,2);
    if(stage("nia")>=2)add("Ask Nia what she's hearing","1 hr",true,niaGossip);
  }
  if(at==="pawn"){const fs=stage("sal")>=2,owe=fs?1300:1400;
    add("Sell crates of \"merchandise\"",S.crates+" on you",S.crates>0,()=>{let t=0;for(let i=0;i<S.crates;i++)t+=260+r()*160;t*=1+.05*lvl("charm")+(fs?.1:0)+(hapOn("sale")?.25:0);if(S.heat>50)t*=.7;t=Math.round(t);S.cash+=t;meet("sal");bond("sal",1.5);log("Sal takes "+S.crates+" crate"+(S.crates>1?"s":"")+" for "+$$(t)+(S.heat>50?". He lowballs you. \"You're hot right now, friend.\"":fs?". \"Friend price.\"":". No questions."));S.crates=0;crime(4);tick(1)});
    if(!S.loan)add("Borrow $1,000 from Sal","owe "+$$(owe)+" in 5 days",stage("sal")>=0,()=>{S.cash+=1000;S.loan={amt:owe,due:S.day+5};meet("sal");bond("sal",1);rem("sal","Lent you $1,000");log("Sal counts out ten hundreds. \"Day "+(S.day+5)+". I like you, so I'm telling you now: I'm not a patient man.\"")});
    else{
      add("Pay Sal back",$$(S.loan.amt)+" · due day "+S.loan.due,S.cash>=S.loan.amt,()=>{S.cash-=S.loan.amt;trust("sal",8);bond("sal",3);S.loan=null;rem("sal","Paid what you owed, on time");log("Sal counts it twice. \"See? Easy. Come back anytime.\"")});
      if(stage("sal")>=3&&!S.loan.ext)add("Ask Sal for another week","he likes you",true,()=>{S.loan.due+=7;S.loan.ext=1;trust("sal",-3);log("Sal sighs through his nose. \"One week. Because it's you. Don't make me regret having feelings.\"")});
    }
    if(S.q.rosa===5)add("Buy Rosa's note from Sal","$3,000",S.cash>=3000,()=>{S.cash-=3000;S.q.rosa=1;bond("rosa",25);trust("rosa",20);pp("rosa").mood="up";rem("rosa","Bought Lucky's back for her");gossip("rosa",12,"you bought Lucky's back from Sal");log("Sal slides the deed across. \"Sentimental. Expensive habit.\" Rosa gets her keys back and makes you a partner: $80 a day.")},2);
  }
  if(at==="garage"){const T=pp("tommy"),ts=stage("tommy"),hired=S.gar||ts>=0&&(T.b>=20||pp("rosa").b>=30||S.rep>=15),base=(S.gar?170:130)+15*lvl("wrench"),gp=S.tsh>=8||T.b>=45&&T.t>=60?6500:8000,tc=lvl("wrench")||ts>=2?1200:1500;
    add(S.gar?"Work your own bay":hired?"Wrench a shift for Tommy":"Ask Tommy for work",hired?"6 hrs · ~"+$$(base):ts<0?"not after what you did":"he doesn't know you yet",hired&&S.en>=30,()=>{const p=pay(base);S.cash+=p;S.en=cl(S.en-25);S.rep=cl(S.rep+1);S.tsh++;xp("wrench");bond("tommy",3);trust("tommy",1);tick(6);meet("tommy");log(S.gar?"A supercharger rebuild and two wear rings. "+$$(p)+", and your name's on the invoices.":"Two impeller swaps and a seized jet pump. Tommy pays "+$$(p)+" cash and says \"not bad\" like it hurts him.");did("shift_garage")});
    if(prom("marcus_gasket"))add("Pull the supercharger on Marcus's ski","4 hrs",S.en>=25,()=>{S.en=cl(S.en-20);tick(4);xp("wrench",2);meet("marcus");log("Four hours, one snapped bolt, a lot of swearing. By the end Marcus is handing you tools before you ask.");did("help_marcus")},1);
    add("Work on your ski",ts<0&&!S.gar?"Tommy won't have you in his shop":"parts, setup, service · 1 hr",ts>=0||!!S.gar,()=>enterRace("garage"),1);
    if(!S.car)add("Buy Tommy's old truck","$1,200",S.cash>=1200,()=>{S.cash-=1200;S.car=1;log("A square-body pickup with a hitch and one working speaker. No more walking.")});
    if(!S.gar)add("Buy the garage from Tommy",ts<0?"he won't sell to you":$$(gp)+(gp<8000?" · he trusts you":""),ts>=0&&S.cash>=gp,()=>{S.cash-=gp;S.gar=1;S.rep=cl(S.rep+10);bond("tommy",10);rem("tommy","Sold you the garage");gossip("tommy",6,"Tommy sold you the garage");modal("Owner","Tommy hands you the keys and a coffee can full of stray bolts. \"Don't screw it up.\" The garage pays you every morning now. What you run out the back is your business.",[["Get to work",0]])},1);
    else add(S.chop?"Shut the chop shop down":"Run stolen skis out the back",S.chop?"stops the daily heat":"+$500/day · Heat +7/day",true,()=>{S.chop=S.chop?0:1;if(S.chop){trust("tommy",-10);rem("tommy","Knows what you run out of bay three");log("Bay three gets a tarp over the window. Skis come in at night and leave as parts. Tommy stops whistling.");crime(5)}else log("You pull the tarp down and send the night crew home. Legit again. Ish.")});
  }
  if(at==="gym"){const J=pp("june"),js=stage("june"),fr=js>=2;
    add("Hit the bags",(fr?"free":"$10")+" · 2 hrs",(fr||S.cash>=10)&&S.en>=25&&js>=0,()=>{if(!fr)S.cash-=10;S.en=cl(S.en-22);S.mood=cl(S.mood+6);xp("fight",2);bond("june",2);tick(2);meet("june");log(pick(["June holds the bag and insults your footwork for two hours.","Jab, jab, cross. Your shoulders are on fire.","June: \"Hands up. You hit like you're apologizing.\""]));did("train")});
    romActs("june",add);
    if(J.rom===2&&J.b>=60&&!S.q.june&&S.day>=(S.juneWait||0))add("June wants to talk","arms crossed",true,juneStory,2);
    if(js>=3&&S.day-(S.patch||-9)>=3)add("Get patched up","June's med kit",S.en<70,()=>{S.patch=S.day;S.en=cl(S.en+40);log("June tapes your ribs and ices your hand. \"You're not as tough as you think. Nobody is.\"")});
    add("Fight night",S.h>=21?"three rounds":"after 9pm",S.h>=21&&S.en>=35&&js>=0,fightNight,1);
  }
  if(at==="lake"){const I=HS.info(),rd=I.round<I.total&&S.day===motoDay(I.round),ms=stage("marcus");
    if(rd)add(I.mid?"Race moto 2 of round "+(I.round+1):"Race round "+(I.round+1)+" of "+I.total,"at "+I.next+(I.mid?" · 3 hrs":" · two motos · 6 hrs"),S.en>=30,()=>enterRace("tour"),1);
    else if(I.round<I.total)add("Next round: day "+motoDay(I.round),"at "+I.next,false,()=>{});
    add("Run the open race",S.openDay===S.day?"one a day":"$40 fuel · 4 hrs · small purse",S.openDay!==S.day&&S.en>=30&&S.cash>=40,()=>enterRace("open"));
    const mh=where("marcus")==="lake";
    add("Line up against Marcus",ms<0?"his crew won't let you near the strip":S.dragDay===S.day?"one run a day":!mh?"he's not at the ramp right now":"drag strip · 2 hrs",ms>=0&&mh&&S.dragDay!==S.day&&S.en>=15,dragMarcus);
  }
  moreActs(at,add);hustleActs(at,add);hapActs(at,add);
  return a}
function dex(){
  if(S.z.dexDead)return noDex();
  tick(1);const D=pp("dex");
  if(!D.met){meet("dex");bond("dex",3);rem("dex","Met you, sized you up");return modal("Dex","Gold chain, reading glasses, eating sunflower seeds. \"You look broke. Broke's good. Broke people listen.\" He's got crates: electronics, no paperwork. $150 each, and Sal pays double.",[["Buy a crate ($150)",()=>buyCrate(150),S.cash<150],["Not today",0]])}
  meet("dex");
  if(stage("dex")<0)return modal("Dex",P.dex.cold,[["Try to make it right",()=>amends("dex")],["Leave",0]]);
  const big=D.b>=45&&D.t>=40&&S.pk>=2&&!S.q.dex,cp=stage("dex")>=3?120:150,ch=[];
  if(big&&S.at==="docks")ch.push(["The warehouse job",heist]);
  if(D.b>=20)ch.push(["Run a package for him ($400)",pickupHow]);
  if(D.b>=12)ch.push(["Ask about product",product]);
  const hp=HS.offer();
  if(hp)ch.push(["Hot "+hp.name.toLowerCase()+", level "+hp.level+" · "+$$(hp.cost),()=>{S.cash-=hp.cost;HS.grant(hp.i);S.hot++;bond("dex",3);log("Dex: \"Fell off a trailer in Parker.\" The "+hp.name.toLowerCase()+" is real and half price. Don't let tech inspection look too close.");crime(8)},S.cash<hp.cost]);
  ch.push(["Buy a crate ("+$$(cp)+")",()=>buyCrate(cp),S.cash<cp||S.crates>=3],["Just talk",()=>hang("dex",1)],["Not today",0]);
  modal("Dex",P.dex.mood[D.mood]+" "+(S.q.dex===3?"\"We don't talk about the warehouse.\"":big?(S.at==="docks"?"\"I've got something bigger. Warehouse 9. Tonight. You in?\"":"\"I've got something bigger than crates. Find me at the docks after dark.\""):D.b>=20?"\"I got a package needs moving across town. Four hundred. Don't open it, don't get pulled over.\"":"\"Back for more? Smart. Or dumb. Same thing in this business.\""),ch);
}
function buyCrate(cp){S.cash-=cp;S.crates++;bond("dex",4);if(S.crates===1)rem("dex","Bought merchandise");log("You walk out with a crate of something heavy. Don't look at it.");crime(6);copRoll(S.ci?.4:.6)}
function pickup(){
  tick(2);S.pk++;bond("dex",5);trust("dex",3);rem("dex","Moved a package for him");crime(15);
  if(r()<.25)return modal("It goes sideways","The buyer counts the money twice, then pulls a knife. \"Actually, I'm keeping this and the package.\"",[["Hand it over",()=>{log("You walk away with nothing but your teeth. Dex won't be happy.");scar("dex",12,5);rem("dex","Lost his package")}],["Swing first · Fighting "+lvl("fight"),()=>{S.en=cl(S.en-30);xp("fight");if(r()<.4+.1*lvl("fight")){S.cash+=400;S.rep=cl(S.rep+6);log("You drop him with one shot and walk off with the cash. Hands won't stop shaking.")}else{const t=take(.2);log("Bad idea. Split lip, bruised ribs, and he takes "+$$(t)+" off you.")}crime(8)}]]);
  S.cash+=400;log("Package delivered. Nobody looked at you. $400.");copRoll(S.ci?.5:1);
}
function heist(){const mk=stage("marcus")>=3?.12:0;
  modal("The warehouse job","Dex nods at Warehouse 9. \"Customs seized a truckload of game consoles. One guard, one gate, twenty minutes.\""+(mk?" Marcus is idling at the curb with his lights off. \"I'm just here for the driving.\"":"")+" How do you get in?",[
  ["Talk your way past the guard · Charm "+lvl("charm"),()=>heist2("charm",.4+.11*lvl("charm")+mk)],
  ["Put the guard down · Fighting "+lvl("fight"),()=>heist2("fight",.4+.11*lvl("fight")+mk)],
  [S.car?"Ram the gate · Driving "+lvl("drive"):"Ram the gate (need a truck)",()=>heist2("drive",.45+.1*lvl("drive")+mk),!S.car],
  ["Walk away",0]])}
function heist2(k,p){
  tick(2);xp(k,2);
  if(r()<p)return modal("Inside","Pallets of consoles, shrink-wrapped, stacked to the ceiling. Dex is already grinning.",[
   ["Grab a few pallets and go · $2,500 · Heat +20",()=>haul(2500,20,.92)],
   ["Load the whole truck · $6,000 · Heat +40",()=>haul(6000,40,.6+.05*lvl("drive"))]]);
  S.q.dex=3;scar("dex",10,5);bond("dex",-8);rem("dex","The warehouse job went bad");
  modal("Blown","The guard's on the radio before you clear the gate. Floodlights. Dex is already gone.",[
   ["Run",()=>{if(r()<.4+.1*lvl("drive")){log("You go over the fence and don't stop running for a mile.");crime(20)}else jail()}],
   ["Go off the end of the pier on the ski · you ride it",()=>getaway("river")],["Hands up",jail]]);
}
function haul(c,h,p){
  if(r()<p){S.cash+=c;S.q.dex=2;S.rep=cl(S.rep+10);bond("dex",12);trust("dex",8);if(pp("sal").met)bond("sal",3);rem("dex","Pulled the warehouse job with you");log("Clean. "+$$(c)+" for one night's work. Dex: \"You ever want to do this full time, say the word.\"");news("Customs officials say a truckload of seized game consoles is missing from Warehouse 9.");crime(h)}
  else{S.q.dex=3;scar("dex",10,5);rem("dex","You got greedy at the warehouse");log("The truck's too heavy and too slow. Sirens. You dump the load on the highway and run.");crime(h);if(!S.over&&r()<.5)jail()}
}
function fightNight(){const J=pp("june");meet("june");
  const dbl=hapOn("card")?2:1,f=b0=>()=>{const b=b0*dbl;tick(2);S.en=cl(S.en-30);xp("fight",2);meet("june");if(r()<Math.min(.9,.3+.12*lvl("fight")+(stage("june")>=2?.08:0))){S.cash+=b;S.rep=cl(S.rep+5);bond("june",4);rem("june","Watched you win");clip("fight",3,"Third-round knockout in the Iron Den basement");log("Third round, he walks into your right hand. The basement goes nuts. +"+$$(b)+".")}else{S.cash=Math.max(0,S.cash-b);S.mood=cl(S.mood-8);rem("june","Watched you get dropped");log("You wake up looking at the ceiling lights. June's holding smelling salts. -"+$$(b)+".")}did("fight")};
  modal("Fight night","Basement of the Iron Den. Folding chairs, cigar smoke, cash in a bucket. June: \"Bet on yourself or go home.\" Your Fighting is level "+lvl("fight")+(stage("june")>=2?", and June's working your corner.":"."),[["Bet $100 on yourself",f(100),S.cash<100],["Bet $300 on yourself",f(300),S.cash<300],
   [S.rep>=10?"Take a dive for $350":"Take a dive (nobody pays a nobody to lose)",()=>{tick(2);S.en=cl(S.en-20);S.cash+=350;S.rep=cl(S.rep-8);S.dove=1;scar("june",20,10);rem("june","Knows you took a dive");gossip("june",-4,"you took a dive at the Iron Den");
     if(S.q.june===1){S.q.june=2;J.rom=4;bond("june",-25);log("You go down in the second. June watches from the corner you promised to be in. She's gone before you get up.")}
     else log("You go down in the second from a punch that wouldn't break an egg. $350. June won't look at you.");crime(4)},S.rep<10],["Not tonight",0]]);
}
const pal=()=>stage("marcus")>=2;
// A race weekend every five days. Miss the day and the rest of the field shares the points.
function motoCheck(){
  let I=HS.info(),g=0;
  if(I.round>=I.total&&S.day>motoDay(I.total-1)){S.season0=motoDay(I.total-1);HS.newTour();I=HS.info();log("A new season is posted at the ramp. Round 1 is on day "+motoDay(0)+".")}
  while(I.round<I.total&&S.day>motoDay(I.round)&&g++<12){log("You missed "+(I.mid?"moto 2 of ":"")+"round "+(I.round+1)+" at "+I.next+". No points.");S.rep=cl(S.rep-2);HS.skip();I=HS.info();if(I.round>=I.total)S.tourPos=I.pos}
  if(I.round<I.total&&S.day===motoDay(I.round)){log("Race day. Round "+(I.round+1)+" at "+I.next+". Be at the Lake before 8pm.");pq("raceday")}
}
// Marcus only ever races you one on one, on the drag strip, and he bolts on more parts each time you beat him twice.
function dragMarcus(){
  const ms=stage("marcus"),lv=Math.min(2,Math.floor(S.mwins/2)),ch=[["Run him for nothing",()=>enterRace("drag",{bet:0,level:lv})]];meet("marcus");
  for(const b of [100,300,1000])ch.push(["Bet "+$$(b)+" on yourself",()=>enterRace("drag",{bet:b,level:lv}),S.cash<b]);
  if(S.mwins>=2&&!S.q.marcus)ch.push(["Pink slips: his build against yours",()=>enterRace("drag",{pinks:1,level:2})]);
  ch.push(["Back out",0]);
  modal("The drag strip","A thousand feet of flat water past the ramp and a tree of lights on a barge. Marcus is already staged. \""+(ms>=2?"Loser buys breakfast. Want to make it interesting?":S.mwins>=2&&!S.q.marcus?"You think you're quick? Put your whole build on it.":S.salt?"You want another one? Fine.":"New face. Put your money where your pump is.")+"\""+(lv?" He has bolted on more drag parts since you last beat him.":""),ch);
}
// kind: tour (a race weekend), open (one race), drag (a run against Marcus) or garage. The race page takes over until it reports back.
function enterRace(kind,o){
  if(kind==="tour"){
    if(pp("tommy").met&&stage("tommy")>=3){HS.fresh();log("Tommy went through your ski last night. Fresh plugs, fresh wear ring, no charge.")}
    if(S.hot&&r()<.25*S.hot){S.hot=0;S.cash=Math.max(0,S.cash-500);S.rep=cl(S.rep-5);log("Tech inspection finds a serial number that isn't yours. $500 fine, and everybody in the pits watched.");crime(8);if(S.over)return}
  }
  S.race=Object.assign({kind,day:S.day},o||{});PRE=snap();save();
  HS.open({mode:kind,level:S.race.level||0,disc:S.gar?.75:pp("tommy").met&&stage("tommy")>=2?.85:1,svc:Math.max(.5,1-.1*lvl("wrench")),purse:kind==="tour"?1:kind==="open"?.3:0,
    turn:1+.008*lvl("drive"),top:S.en<40?.98:1,done:raceDone,exit:cityBack});
  host.hidden=true;
}
function raceDone(res){
  const R=S.race||{kind:"open"},tour=res.kind==="tour",L=[];
  S.race=null;
  if(res.kind==="drag")return dragDone(R,res);
  if(!tour){S.openDay=S.day;S.cash=Math.max(0,S.cash-40)}
  tick(tour?6:4);if(S.over)return;
  S.en=cl(S.en-(tour?40:30));S.mood=cl(S.mood+(res.dnf?-10:res.p<=3?15:res.p>=8?-6:4));
  if(!res.dnf)S.rep=cl(S.rep+Math.round([8,5,3,2,1,0,0,0,0,0][res.p-1]*(tour?1.5:.5)));
  xp("drive",!res.dnf&&res.p<=3?3:2);
  L.push(tour?(res.dnf?"You retired from round "+res.round+" at "+res.site+". The field took the points.":"Round "+res.round+" at "+res.site+": "+ord(res.m[0])+" and "+ord(res.m[1])+" in the motos, "+ord(res.p)+" overall. Prize money "+$$(res.prize)+".")
    :res.dnf?"You retired from the race. No money.":"Open race at "+res.site+": "+ord(res.p)+" of 10. Prize "+$$(res.prize)+".");
  if(tour&&!res.dnf){
    if(S.q.rosa===1){S.cash+=100;L.push("Lucky's pays you $100 for the sticker on your hull.")}
    const N=pp("nia"),T=pp("tommy");
    if(N.rom===2||N.rom===3){bond("nia",res.p<=3?4:2);meet("nia");L.push(res.p<=3?"Nia was on the beach, loud enough to hear over ten engines.":"Nia was on the beach. \"You looked good out there. Mostly.\"")}
    if(T.met&&stage("tommy")>=2&&res.p<=3){bond("tommy",3);L.push("Tommy nods at the trophy like he built it. He sort of did.")}
  }
  if(tour){
    if(res.round>=res.total){S.tourPos=res.tpos;L.push("That was the last round. You finish the series "+ord(res.tpos)+"."+(res.tpos===1?" Champion.":""));if(res.tpos===1){S.rep=cl(S.rep+15);for(const k in P)if(pp(k).met)bond(k,3)}}
    else L.push("Series standing: "+ord(res.tpos)+". Round "+(res.round+1)+" is on day "+motoDay(res.round)+".");
  }
  for(const l of L)log(l);
  did("race");
  if(tour&&!res.dnf)S.lastP=res.p;
  if(!res.dnf)clip("race",res.p===1?5:res.p<=3?4:res.p<=5?3:res.p<=8?2:1,(tour?"Round "+res.round+" at "+res.site:"Open race at "+res.site)+": "+ord(res.p));
  else if(r()<.4)clip("crash",3,"The wipeout at "+res.site);
  modal(tour?"Round "+res.round+" of "+res.total:res.dnf?"Did not finish":"Open race",L.join(" "),[["OK",0]]);
}
function dragDone(R,res){
  const L=[];S.dragDay=S.day;tick(2);if(S.over)return;
  S.en=cl(S.en-15);xp("drive",1);meet("marcus");
  if(res.win){S.mwins++;S.rep=cl(S.rep+3);S.mood=cl(S.mood+8);clip("drag",R.pinks?5:3,R.pinks?"Won Marcus's ski on a pink slip":"Beat Marcus down the strip");if(pal())bond("marcus",1);else{S.salt++;bond("marcus",-2)}L.push("You beat Marcus down the strip.")}
  else{bond("marcus",2);S.mood=cl(S.mood-4);L.push(res.dnf?"You pulled out of the run. Marcus calls that a win.":res.red?"You left before the green. Red light. Marcus takes it.":"Marcus beat you down the strip.")}
  if(R.bet){
    if(res.win){S.cash+=R.bet;rem("marcus","Lost "+$$(R.bet)+" to you on the strip");L.push("He pays out "+$$(R.bet)+" without a word.")}
    else{S.cash=Math.max(0,S.cash-R.bet);rem("marcus","Took "+$$(R.bet)+" off you on the strip");L.push("He counts your "+$$(R.bet)+" slowly, right in front of you.")}
  }
  for(const l of L)log(l);
  did("race");
  modal(res.win?"You win":"You lose",L.join(" "),[["OK",0]]);
  if(R.pinks){
    if(res.win)modal("Pink slips","You take him by a ski length with his whole crew watching. Marcus kills his engine and holds out the lanyard. He built that ski out of three wrecked ones.",[
      ["Keep his ski",()=>{S.cash+=4000;S.q.marcus=2;scar("marcus",35,20);bond("marcus",-20);rem("marcus","You took the ski he built");gossip("marcus",-8,"you took Marcus's ski on a pink slip");log("You sell Marcus's ski to Sal by lunch. $4,000. Marcus watches the trailer leave.")}],
      ["Toss the lanyard back",()=>{S.q.marcus=3;bond("marcus",35);trust("marcus",20);S.rep=cl(S.rep+10);rem("marcus","You won his ski and gave it back");gossip("marcus",8,"you beat Marcus for his ski and handed it back");log("\"Keep it. I just wanted to know.\" Marcus stares at you. \"I owe you one.\" He means it.")}]]);
    else{HS.strip();S.q.marcus=4;bond("marcus",4);rem("marcus","Runs your parts now");log("Lost the pink slip run. Every part you bought leaves in Marcus's truck.");
      modal("Pink slips","Marcus gets you at the line. His crew has your ski on a stand before you're out of your vest. Every part you bought leaves in his truck. Tommy lends you the bare hull back.",[["Damn",0]])}
  }
}
let PRE=null;
function cityBack(){
  window.CITYON=true;host.hidden=false;tab("here");
  if(S.race){if(S.race.kind==="garage"){tick(1);meet("tommy");log("An hour on the stand at Tommy's with your ski.")}S.race=null}
  render();host.scrollTop=0;if(PRE){toast(deltas(PRE,snap()));PRE=null}
}
function copRoll(m){
  if(S.over)return;const K=pp("kow"),gone=S.kowGone,night=S.h>=20||S.h<5,p=Math.min(.45,S.heat/220*(night?1.3:1)*m*(gone?1.1:1-K.t/300));
  if(r()>=p)return;if(!gone)meet("kow");
  const price=200+S.bribes*150,ch=[["Comply",()=>{
    if(searched())return;
    if(S.crates){S.crates=0;S.cash=Math.max(0,S.cash-300);if(!gone){trust("kow",-4);rem("kow","Found stolen goods on you")}log("He finds the crates. $300 fine, crates gone, and he writes your name down slowly.");crime(10)}
    else{if(!gone){trust("kow",4);bond("kow",2);rem("kow","You were clean and polite")}log(gone?"Reyes runs your name twice and lets you go without a word.":"He searches everything. Finds gum. Lets you go.")}
    if(S.heat>=80)jail()}]];
  if(!gone)ch.push(["Bribe him ("+$$(price)+")",()=>{if(r()<.3-.05*lvl("charm")){scar("kow",12,6);rem("kow","Tried to bribe him");log("\"Are you trying to bribe me?\" He's insulted. Your heat skyrockets.");crime(20)}else{S.cash-=price;S.bribes++;S.heat=cl(S.heat-15);bond("kow",3);trust("kow",-2);rem("kow","Took "+$$(price)+" from you");log("He pockets it without looking. \"Get home safe.\" Next time it'll cost more.")}},S.cash<price]);
  ch.push([S.car?"Floor it":"Run for it",()=>{xp("drive",S.car?2:0);if(r()<.25+.15*Math.min(S.car,2)+.06*lvl("drive")+(pal()?.15:0)){S.rep=cl(S.rep+4);if(!gone){trust("kow",-8);rem("kow","You ran from him")}log(stage("marcus")>=2&&S.car?"Marcus's crew boxes the cruiser in at the light. You're gone.":"You lose him in the rail yard. You can't stop laughing.");crime(15)}else{if(!gone)rem("kow","Caught you running");jail()}}]);
  if(S.at==="docks"||S.at==="lake")ch.push(["Run for the water · you ride it",()=>getaway(S.at==="lake"?"havasu":"river")]);
  modal("Red and blue",(gone?"Officer Reyes":"Officer Kowalski")+" lights you up with the flashlight. "+(gone?"\"License. Slowly.\"":K.t<35?"\"Look who it is. Again.\"":stage("kow")>=2?"\"It's you. Tell me I'm not going to find anything.\"":"\"Evening. Know why I stopped you?\""),ch);
}
function jail(){
  if(S.over)return;
  if(S.kowOwes&&!S.kowGone){S.kowOwes=0;S.heat=cl(S.heat-20);S.crates=0;return modal("Kowalski","He walks you to the cruiser, opens the back door, then closes it again. \"IA asked about me. You said nothing. This is me saying nothing.\" He gets in alone. \"That's us even.\"",[["Breathe",0]])}
  const t=take(.3);S.crates=0;S.heat=cl(S.heat-40,10);streetJail();arrested();S.booked=1;
  for(const k of STRAIGHT)if(pp(k).met&&!(k==="nia"&&S.q.nia===2)){trust(k,pp(k).rom>=2?-12:-6);rem(k,"You did three days in county")}
  if(S.bag){S.bag=0;scar("dex",20,8);rem("dex","Cops took his bag out of your place")}
  for(let i=0;i<3&&!S.over;i++){S.day++;newDay()}if(S.over)return;dawn();S.h=9;S.at="home";
  for(const k of["nia","june"])if((pp(k).rom===2||pp(k).rom===3)&&pp(k).t<30)pq("dump:"+k);
  log("Three days in county. Bail cost "+$$(t)+".");modal("County","Three days, one phone call, a bologna sandwich. Bail eats "+$$(t)+". Whatever you promised anybody this week, you missed it.",[["Walk out",0]]);
}
const STREET=[
 ()=>modal("On the sidewalk","A fat wallet on the curb. Driver's license, family photo, $120.",[["Return it",()=>{S.rep=cl(S.rep+3);S.mood=cl(S.mood+8);S.cash+=40;log("The guy tears up and presses $40 on you. Feels better than it should.")}],["Keep the cash",()=>{S.cash+=120;S.mood=cl(S.mood-4);log("$120 richer. You drop the wallet in a mailbox, which is basically returning it.")}]]),
 ()=>modal("Alley dice","Five guys, one wall, a pile of twenties. \"You in or you watching?\"",[["Throw $50",()=>{if(r()<.47){S.cash+=50;S.rep=cl(S.rep+1);log("Seven. Then seven again. You leave before your luck does. +$50.")}else{S.cash-=50;log("Snake eyes. The whole alley laughs. -$50.")}},S.cash<50],["Keep walking",0]]),
 ()=>modal("Psst","A guy opens his jacket. \"Rolex. Real. Eighty bucks, I gotta leave town.\"",[["Buy it ($80)",()=>{S.cash-=80;if(r()<.3){S.cash+=450;log("Sal puts it under the loupe and whistles. It's real. He gives you $450.")}else log("The second hand falls off before you reach the corner.")},S.cash<80],["Pass",0]]),
 ()=>modal("Open window","A parked sedan, window down, laptop bag on the seat. Nobody around.",[["Grab it",()=>{S.cash+=220;log("Sal gives you $220 for it, no questions. Somebody's having a bad day.");crime(8);copRoll(1.2)}],["Not your business",()=>{S.mood=cl(S.mood+2)}]]),
 ()=>modal("Stranded","A woman with her hood up and steam pouring out. \"You know anything about cars?\"",[[lvl("wrench")?"Fix it · Wrenching "+lvl("wrench"):"Fix it (need Wrenching 1)",()=>{tick(1);S.cash+=60;S.rep=cl(S.rep+3);xp("wrench");log("Split radiator hose. You fix it with tape and a prayer. She gives you $60 and tells everyone.")},!lvl("wrench")],["Wish her luck",0]])];
const EV={
 ask:id=>showAsk(id),
 raceday(){const I=HS.info();if(I.round<I.total&&S.day===motoDay(I.round))modal("Race day","Round "+(I.round+1)+" of "+I.total+" is today, at "+I.next+": two motos. Be at the Lake before 8pm with some energy left. Miss it and the rest of the field shares the points.",[["Got it",0]])},
 niaMove(){if(S.q.nia===1)modal("Nia","Five days and you kept your word. She shows up at your door with boxes. \"Don't make it weird.\"",[["Make it a little weird",niaMove]])},
 niaBust(){const p=pp("nia");p.rom=4;scar("nia",35,25);bond("nia",-20);S.mood=cl(S.mood-30);rem("nia","You lied to her face");modal("Nia","She heard. Of course she heard. \"You looked me in the eye.\" She's gone before you find a sentence.",[["Damn",0]])},
 nag(k){const p=pp(k);if(p.rom!==2&&p.rom!==3)return;p.mood="down";modal("Text from "+P[k].n,"\"So are we doing this or not? Three days. I'm not mad. I'm keeping count.\"",[["Go see her",0]])},
 dump(k){const p=pp(k);if(p.rom!==2&&p.rom!==3)return;const lived=k==="nia"&&S.q.nia===3;p.rom=4;scar(k,10,10);bond(k,-20);S.mood=cl(S.mood-20);if(k==="nia"&&(S.q.nia===3||S.q.nia===1))S.q.nia=0;rem(k,"You weren't there when it counted");
  modal(P[k].n,"A long text. The short version: she's done waiting on somebody who doesn't show up."+(lived?" Her boxes are gone when you get home. So is the cactus.":""),[["Damn",0]])},
 caught(){const ok=k=>pp(k).rom===2||pp(k).rom===3;if(!ok("nia")||!ok("june"))return;
  const out=k=>{pp(k).rom=4;scar(k,30,20);bond(k,-25);if(k==="nia"&&(S.q.nia===3||S.q.nia===1))S.q.nia=0},
   drop=(k,o)=>()=>{out(k);rem(k,"You were seeing "+P[o].n+" the whole time");scar(o,15,10);rem(o,"Found out about "+P[k].n+" and stayed anyway");log(P[k].n+" leaves without slamming the door, which is worse. "+P[o].n+" stays. For now.")};
  modal("Both of them","Nia and June are standing in your doorway, together. Turns out Nia does kickboxing at the Iron Den on Tuesdays, and people talk between rounds.",[["\"Nia. It's Nia.\"",drop("june","nia")],["\"June. It's June.\"",drop("nia","june")],
   ["Say nothing",()=>{for(const k of["nia","june"]){out(k);rem(k,"You couldn't even pick")}S.mood=cl(S.mood-25);gossip("nia",-6,"you two-timed Nia and June");log("They leave together. You hear them laughing on the stairs. It's not a nice laugh.")}]])},
 salTakes(){const R=pp("rosa");R.mood="down";if(R.b>=40){trust("rosa",-8);rem("rosa","You knew about Sal and stayed out of it")}modal("Lucky's","Sal changed the locks at Lucky's overnight. Rosa's still there, waiting tables in her own diner. His nephew's on the grill. The special costs more and tastes like it knows.",[["Damn",0]])},
 bagPickup(){if(!S.bag)return;S.bag=0;S.cash+=300;bond("dex",8);trust("dex",10);rem("dex","You held his bag and never touched it");log("Dex picks up the bag, weighs it in one hand, and nods. $300. \"You'd be surprised how many people can't do nothing for two days.\"")},
 niaPays(){if(!S.oweDay)return;S.oweDay=0;const p=pp("nia");if(p.t>=40&&p.rom!==4){S.cash+=200;bond("nia",3);log("Nia slides $200 across the bar in a napkin. The napkin says \"thank you\" in eyeliner.")}else log("Friday comes and goes. Nia doesn't mention the $200. You don't either.")},
 niaExam(){if(!S.examDay)return;S.examDay=0;const p=pp("nia"),ok=r()<(S.study?.9:.45);p.mood=ok?"up":"down";if(ok){S.nurse=1;bond("nia",S.study?8:2)}
  modal("Nia",ok?(S.study?"She got in. She calls you before she calls her mother. \"You quizzed me on the one thing they asked. I'm buying you a steak.\"":"She got in. You hear it from somebody else first. Nia tells you two days later, like it's nothing."):"She missed it by four points. The coffee can goes back on the shelf. \"There's a spring session,\" she says, to the bar more than to you.",[["OK",0]])},
 tasha(){if(!S.tashaDay)return;S.tashaDay=0;const ok=r()<(S.spar?.85:.4);pp("june").mood=ok?"up":"down";if(ok&&S.spar)bond("june",8);log(ok?"Tasha wins her first fight by decision. June hugs "+(S.spar?"you, which nobody has ever seen her do.":"everyone in the building except you."):"Tasha loses a close one. June's at the gym until 2 a.m. hitting the bag herself.")},
 snitchOut(){if(!S.snitch)return;const k=S.snitch.who,c=P[k];S.snitch=null;pp(k).mood="down";
  if(r()<.55){scar(k,60,45);bond(k,-35);rem(k,"Knows you gave his name to Kowalski");S.rep=cl(S.rep-15);gossip(k,-12,"you gave "+c.n+" to the cops");modal("Word gets out",c.n+" made bail this morning. Somebody at the precinct talks, and now everybody at the ramp knows who gave Kowalski the name. Nobody says anything to you. That's the message.",[["Damn",0]])}
  else log(c.n+" spends a night in holding and never finds out who put him there. You know, though.")},
 fakeName(){if(!S.fake)return;S.fake=0;if(S.kowGone)return;if(r()<.6){scar("kow",20,10);log("Kowalski spent three days looking for a Ricky Delgado who doesn't exist. He's not laughing.");crime(20)}else{trust("kow",10);bond("kow",5);log("Somehow there IS a Ricky Delgado. He had warrants. Kowalski thinks you're connected.")}},
 dexRevenge(){if(!S.revenge)return;S.revenge=0;modal("Company","Dex doesn't come himself. Two men you've never seen are sitting on your bed when you get home. One of them is holding your toothbrush.",[
  ["Give back what you've got",()=>{const t=Math.min(S.cash,2000);S.cash-=t;S.en=cl(S.en-20);trust("dex",6);log("They take "+$$(t)+" and the toothbrush. \"Dex says you're even. Dex is nicer than me.\"")}],
  ["Swing first · Fighting "+lvl("fight"),()=>{xp("fight",2);if(r()<.2+.12*lvl("fight")){S.rep=cl(S.rep+8);S.revenge=S.day+5;log("It's ugly and it's loud and at the end you're the one standing. They leave. They'll be back with more of them.")}else{const t=Math.min(S.cash,2500);S.cash-=t;S.en=cl(S.en-50);S.mood=cl(S.mood-20);log("You wake up on the floor. They took "+$$(t)+". Your ribs took the rest.")}}]])},
 tommyFinds(){if(!S.covered)return;S.covered=0;bond("tommy",15);trust("tommy",15);rem("tommy","Paid his debt to Sal and never said a word");gossip("tommy",6,"you quietly covered Tommy's debt");log("Tommy puts a coffee in front of you without a word. Then: \"Sal told me what you did. I'm not good at this. Thank you.\"")},
 tip(){modal("Text from Kowalski","\"Warrant's on a desk downtown. You've got until I finish this coffee to become very boring. This is the only one of these you get.\"",[["Go quiet",0]])},
 couch(k){modal(P[k].n,"Your stuff's in contractor bags on the curb. "+P[k].n+" pulls up before the rain does and talks to your landlord for ten minutes. You get one more month. \"Don't thank me. Pay your rent.\"",[["Thank "+her(k)+" anyway",0]])},
 jumped(){modal("Jumped","Marcus's crew catches you behind the pawn shop. Four of them, one of you.",[
  ["Swing first · Fighting "+lvl("fight"),()=>{xp("fight");if(r()<.25+.13*lvl("fight")){S.rep=cl(S.rep+8);bond("marcus",5);rem("marcus","His crew lost a fight to you");log("You drop two of them and the other two rethink their evening.")}else{const t=take(.25);S.en=cl(S.en-30);log("You get one good shot in. Then the sidewalk. They take "+$$(t)+".")}}],
  ["Hand over the wallet",()=>{const t=take(.2);log("They take "+$$(t)+" and your dignity.")}]])},
 inspect(){const g=S.kowGone,ch=[["Shut the chop shop down",()=>{S.chop=0;S.heat=cl(S.heat-10);log("You send the night crew home while he watches. He nods and leaves.")}],["\"Come back with a warrant.\"",()=>{if(!g){trust("kow",-8);rem("kow","You told him to get a warrant")}log("He smiles. \"I will.\"");crime(15)}]];
  if(!g)ch.unshift(["Pay him off ($1,000)",()=>{S.cash-=1000;S.bribes++;S.heat=cl(S.heat-20);bond("kow",3);rem("kow","On your payroll now");log("He leaves $1,000 heavier. \"I'll swing by next month.\"")},S.cash<1000]);
  modal("Inspection",(g?"Reyes":"Kowalski")+" walks through your garage with a coffee, counting skis with no hull numbers. \"Busy shop.\"",ch)},
 finale(){const v=verdict();modal(v[0],v[1]+epi(),[["Keep living here",()=>{S.free=1;log("The season's done. The city's still here. So are you.")}],["Start a new life",reset]])}};
function verdict(){return aimVerdict()||moreVerdict()||verdict0()}
function verdict0(){return S.tourPos===1?["Champion","A whole season, and your name is at the top of the sheet at Havasu. Whatever else you did to get here, nobody can say you didn't earn that part."]
 :S.gar&&S.chop?["Kingpin of bay three","A season in and you own a garage that never has the same ski twice. The money's unreal. So is the list of people who want it."]
 :S.gar?["Legit","Your name's on the sign. Grease under your nails, taxes filed, nobody looking for you. You did it the hard way. Mostly."]
 :S.cash>=5000&&S.heat<40?["Clean-ish","A season in, money in the bank, nobody looking for you. Boring. Beautiful."]
 :S.rep>=40&&S.heat>=50?["Street legend","Everybody knows your name, including every cop in the precinct. It's a great run. It won't be a long one."]
 :friends()>=5?["Known and liked","A season in and you're still broke-ish, but you can't walk two blocks without somebody yelling your name. There are worse ways to be poor."]
 :["Still hustling","A whole season. Not rich, not locked up. The city shrugs and keeps going. So do you."]}
function epi(){const q=S.q,N=pp("nia"),J=pp("june"),fr=friends(),bn=Object.keys(P).filter(k=>pp(k).met&&stage(k)<0).length,e=[
  q.nia===3?"Nia's cactus is on your windowsill.":q.nia===2?"Nia runs the back room at the Low End. You two don't talk about feelings, just margins.":N.rom===4?"Nia switched to day shifts so she wouldn't have to see you.":N.rom>=2?"You and Nia are still figuring it out.":"",
  S.nurse?"Nia starts the nursing program in the fall.":"",
  q.rosa===1?"Lucky's named a sandwich after you. It's not good.":q.rosa===2?"Rosa's still open. You eat free.":q.rosa===3?"Rosa crosses the street when she sees you coming.":q.rosa===5?"Lucky's belongs to Sal now. Rosa waits tables in it.":"",
  q.marcus===3?"Marcus calls you family.":q.marcus===2?"Marcus is building another ski. He has a long memory.":q.marcus===4?"Marcus runs your old parts on his ski. He waves.":stage("marcus")>=2?"Marcus saves you a spot at the line.":"",
  q.dex===2?"Dex has a bigger job lined up.":q.dex===3?"Dex found a new driver.":"",
  J.rom===3?"June put your name on a locker.":J.rom===4?"June took your photo off the gym wall.":stage("june")>=3?"June has you coaching the Saturday kids.":"",
  pp("tommy").met&&stage("tommy")<0?"Tommy would rather sell to a tire chain than to you.":S.gar&&stage("tommy")>=2?"Tommy comes in at eight every morning to tell you you're doing it wrong.":"",
  S.kowGone?"Officer Reyes knows your plate by heart.":stage("kow")>=2?"Kowalski nods at you over his coffee. From him, that's a lot.":"",
  S.loan?"You still owe Sal "+$$(S.loan.amt)+". He hasn't forgotten.":"",
  S.tourPos>1?"You finished the series "+ord(S.tourPos)+".":"",
  fr?fr+(fr===1?" person":" people")+" in this city would pick up at 3 a.m. for you.":"Nobody in this city would pick up at 3 a.m. for you.",
  bn?bn+(bn===1?" crosses":" cross")+" the street when you walk by.":"",...moreEpi(),aimEpi()].filter(Boolean);
  return `<br><br>${e.join(" ")}<br><br><b>${$$(S.cash)}</b> · Respect ${S.rep} · Heat ${S.heat} · Day ${S.day}`}
const ENDS={evicted:["Evicted","Two missed rents and nobody close enough to call. Your stuff's on the curb in contractor bags. A guy is already carrying off your TV."],
 raid:["Locked up","6 a.m. They kick in the door. Turns out the city remembered everything. Dex's name never comes up. Yours does, a lot."]};
function end(k){S.over=k;save();modal(ENDS[k][0],ENDS[k][1]+epi(),[["Start a new life",reset]],1)}
//@art
//@photo
//@ui
//@hustle
//@life
//@street
//@talk
function go(k){
  if(k===S.at){tab("here");return}
  if(S.over||open())return;const from=S.at,onMap=$("app").dataset.tab==="map";
  S.at=k;tick(S.car?0:1);log((S.car?"You drive to ":"You walk to ")+L[k].n+".");
  const now=S.day*24+S.h;
  if(!S.over&&now-S.lastEv>=6&&r()<.3){S.lastEv=now;pick(STREET)()}
  else if(S.h>=20||S.h<5)copRoll(.5*hapCops());
  TRAVEL={from,to:k};render();
  if(onMap)setTimeout(()=>{if($("app").dataset.tab==="map")tab("here")},900);else tab("here");
}
function render(){
  while(!open()&&!S.over&&S.pend.length){const [k,a]=S.pend.shift().split(":");EV[k]&&EV[k](a)}
  save();if(!S.d0)S.d0=snap();
  XA=[];artFrame();GL=goals();hud();
  // ART.pane tells photo.js which panel is being drawn, so pictures on the panel in view are asked for first
  for(const [k,f] of [["here",hereView],["map",mapView],["hustle",hustleView],["people",peopleView],["you",youView],["phone",phoneView]]){ART.pane=k;f()}
  ART.pane=null;
}
// Every tap that does something is wrapped in a snapshot, so what it changed can pop up (toast, ui.js).
const did1=fn=>{const a=snap();fn();render();toast(deltas(a,snap()))};
root.addEventListener("click",e=>{
  const t=e.target;
  if(!AC)try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(err){}
  const c=t.closest("[data-ch]");
  if(c){$("modal").classList.remove("show");const f=modal.ch[+c.dataset.ch][1];return did1(()=>{f&&f();if(!open()&&MQ.length&&!S.over)draw(...MQ.shift())})}
  if(open())return;
  const tb=t.closest("#tabs [data-tab]");if(tb)return tab(tb.dataset.tab);
  if(t.closest("#phone")){phone();return render()}
  if(t.closest("[data-aim]"))return did1(aimPick);
  if(t.closest("[data-pclose]")||t===$("phoneui")){PH.open=0;return render()}
  if(t.closest("[data-pback]")){PH.app=null;return render()}
  const ap=t.closest("[data-app]");if(ap){const id=ap.dataset.app;if(id==="map"){PH.open=0;tab("map")}else{PH.open=1;PH.app=id}return render()}
  const as=t.closest("[data-ask]");if(as)return did1(()=>showAsk(as.dataset.ask));
  const g=t.closest("[data-go]");if(g){PH.open=0;return did1(()=>go(g.dataset.go))}
  if(S.over)return;
  const w=t.closest("[data-who]");if(w)return did1(()=>talkTo(w.dataset.who));
  const a=t.closest("[data-a]");if(a)return did1(()=>render.acts[+a.dataset.a].fn());
  const x=t.closest("[data-x]");if(x)return did1(()=>XA[+x.dataset.x]());
  if(t.closest("#snd")){try{localStorage.setItem("shc.snd",sndOn()?"0":"1")}catch(err){}return render()}
  if(t.closest("#reset")){reset();render()}
  if(t.closest("#free"))CITY.leave();
});
root.addEventListener("toggle",e=>{const d=e.target;if(d.dataset&&d.dataset.p){if(d.open)S.openP=d.dataset.p;else if(S.openP===d.dataset.p)S.openP=""}},true);
root.addEventListener("keydown",e=>{const g=e.target.closest&&e.target.closest("[data-go]");if(g&&(e.key==="Enter"||e.key===" ")){e.preventDefault();go(g.dataset.go)}});
HS.wallet(()=>S.cash,v=>{S.cash=Math.max(0,Math.round(v));save()});
if(S.race)S.race=null;
// The app opens in the city. Free play (the race menu on its own, with its own garage and tour) is a button away, and comes back here.
const CITY=window.CITY={enter(){HS.city(true);host.hidden=false;render();host.scrollTop=0;if(!adult())gate()},leave(){host.hidden=true;HS.city(false)}};
// The city is written for adults. It asks once; saying no leaves the racing, which is for everybody.
const adult=()=>{try{return localStorage.getItem("shc.adult")==="1"}catch(e){return true}};
function gate(){
  if(open()&&modal.cur&&modal.cur[0]!=="Adults only")MQ.unshift(modal.cur);
  draw("Adults only","Side Hustle City is a crime story for adults: violence, drugs, strong language, and sex that cuts away. The racing on its own is for everybody.",[["I'm 18 or older",()=>{try{localStorage.setItem("shc.adult","1")}catch(e){}}],["Just the racing",()=>CITY.leave()]]);
}
HS.city(true);host.hidden=false;if(!adult())gate();
for(const i of root.querySelectorAll("#tabs [data-i]"))i.outerHTML=ico(i.dataset.i);$("phico").outerHTML=ico("phone");
const first=!S.log.length;if(first)log("Day 1. $200, a studio apartment and a bare ski. Rent's due on day 8. The first race weekend is day 5.");
artLoad();render();
if(!first&&!S.asp&&!S.over)aimPick();
if(first)modal("Day 1","New city, $200, a bare ski, and rent due on day 8.<ul><li><b>Here</b> is where you are and what you can do. Tap a face to talk. <b>Map</b> gets you around. <b>Hustles</b> is every way to make money. <b>People</b> are the eight who'll remember what you do.</li><li>A race weekend every five days, starting day 5, at the Lake. Your ski gets built at Tommy's Garage out of the same money you live on.</li><li>Bond is how close you are. Trust is whether they believe you. They move separately, and people talk.</li><li>Your phone buzzes. Saying yes is a promise.</li><li>Not everything here is legal. Heat brings the law, on the street and on the water.</li></ul>",[["Let's go",0]]);
if(first)aimPick();
if(S.over)end(S.over);

})();
