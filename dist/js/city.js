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
const P={"rosa":{"n":"Rosa","role":"runs Lucky's","g":"she","treat":["Bring flowers for the counter",18],"mood":{"up":"Rosa's humming with the radio and overfilling every coffee.","flat":"Rosa's working the register with her reading glasses on.","down":"Rosa's slamming plates around. Nobody at the counter is making eye contact."},"know":["She opened Lucky's with her ex-husband. He got the boat. She got the debt.","She feeds half the block on credit and has never written a single tab down.","She wants to leave the place to somebody who'd keep the name. She's looking at you when she says it."],"cold":"Rosa sees you and turns the coffee pot upside down. \"Kitchen's closed. For you.\"","v":"Warm and bossy. Feeds people as a way of arguing with them. Short sentences, dry humor, no patience for excuses. Worries out loud about the diner."},"nia":{"n":"Nia","role":"bartender","g":"she","rom":1,"treat":["Buy her a shot",24],"mood":{"up":"Nia's dancing a little behind the bar and pretending she isn't.","flat":"Nia's wiping down the same glass, half watching the door.","down":"Nia's got her jaw set and her phone face down. She's pouring heavy."},"know":["She's been saving tips for the nursing program at the community college. Three years of it, in a coffee can.","Her little brother's in county on a possession charge. She visits every Sunday and tells her mom he's fine.","Marcus is her cousin. She taught him to drive stick in the Lucky's parking lot and has regretted it since."],"cold":"Nia sets your drink down without a word and walks to the far end of the bar.","v":"Quick, teasing, guarded. Hears everything from behind the bar and gives away very little. Swears easily. Softer when she is tired."},"dex":{"n":"Dex","role":"fence","g":"he","treat":["Bring him sunflower seeds",5],"mood":{"up":"Dex is in a good mood, which mostly means he's talking with his mouth full.","flat":"Dex is reading the paper through his glasses, shelling seeds.","down":"Dex keeps checking the door. He's switched to decaf, which is worse."},"know":["He drove a city bus for nineteen years. Says the routes are why he knows every alley.","He has a daughter in Phoenix who thinks he sells restaurant equipment.","He's scared of somebody. He won't say who, but he never does business on a Tuesday."],"cold":"Dex folds his paper. \"I don't know you. Walk.\"","v":"Low voice, careful, a little amused. Talks in sideways advice and old bus-driver stories. Never says anything he could be quoted on."},"marcus":{"n":"Marcus","role":"rival rider","g":"he","treat":["Buy him a jug of race gas",60],"mood":{"up":"Marcus is holding court on the tailgate of his truck, crew laughing at everything.","flat":"Marcus is checking his wear ring with a flashlight, earbuds in.","down":"Marcus is sitting on his ski at the bottom of the ramp, engine off, not launching."},"know":["June taught him to box when he was twelve so he'd stop fighting in parking lots.","He built his ski out of three wrecked ones. He can tell you which bolt came from which.","He's never left the state. He races because for three laps it feels like going somewhere."],"cold":"Marcus doesn't turn around. His crew does. \"You lost?\"","v":"Loud, proud, competitive, funny. Trash talk is how he says hello. Underneath it he wants to be taken seriously as a rider."},"sal":{"n":"Sal","role":"pawnbroker, lender","g":"he","treat":["Bring him an espresso",6],"mood":{"up":"Sal's counting a thick stack and whistling opera.","flat":"Sal's got the loupe in his eye, pricing somebody's bad week.","down":"Sal's on the phone, very quiet. That's when he's angriest."},"know":["Gold Line was his mother's jewelry store. He kept her name on the license.","He's never raised his own hand to anybody. He considers that a point of honor.","His nephew is supposed to take over. Sal thinks the kid is soft, and he's privately glad."],"cold":"Sal doesn't look up. \"Buying or selling. I got nothing else for you.\"","v":"Polite, precise, old-fashioned. Never raises his voice. Everything is a transaction and he says so pleasantly. Dry opera-fan wit."},"june":{"n":"June","role":"runs the Iron Den","g":"she","rom":1,"treat":["Buy the gym a new heavy bag",90],"mood":{"up":"June's shadowboxing between rounds of yelling at people. Good day.","flat":"June's taping somebody's hands, not saying much.","down":"June's sitting on the ring apron, staring at an unpaid power bill."},"know":["She went 14 and 2 as a pro. The two were the same woman. She still has the tape.","She's kept the gym free for kids under sixteen since the day she bought it.","She trains Tasha, sixteen, like a daughter. First fight's coming and June can't sleep."],"cold":"June points at the door with a focus mitt. \"Not in my gym.\"","v":"Blunt, sparing with words, a coach to the bone. Says hard things plainly and kind things almost never. Respects people who show up."},"tommy":{"n":"Tommy","role":"owns the garage","g":"he","treat":["Bring coffee and a bear claw",9],"mood":{"up":"Tommy's got the radio on the oldies station and a rare smile.","flat":"Tommy's under a hood, grunting at a seized bolt.","down":"Tommy's sitting on an upturned bucket holding his lower back."},"know":["He's rebuilt every pump and supercharger on this lake since 1979. He can hear a bad wear ring from the parking lot.","His wife did the books until she passed. He hasn't opened the ledger since.","He doesn't have kids. He's been waiting for somebody worth handing the keys to."],"cold":"Tommy wipes his hands and keeps wiping. \"We're full up. Try somewhere else.\"","v":"Gruff, tired, grumbles in shop talk. Compliments come out sideways. Goes quiet about his wife. Loves the machines more than he will say."},"kow":{"n":"Kowalski","role":"beat cop","g":"he","treat":["Pick up his coffee",4],"mood":{"up":"Kowalski's telling Rosa a joke at the counter. She's heard it.","flat":"Kowalski's doing the crossword in pen.","down":"Kowalski's stirring his coffee and not drinking it."},"know":["Twenty-two years on the same six blocks. He knows whose kid you are before you say it.","He's four years from a pension and has stopped pretending the job is what he signed up for.","He lets slip that his best source on the docks eats a lot of sunflower seeds."],"cold":"Kowalski sets his cup down. \"Sit somewhere else.\"","v":"Weary beat cop, deadpan. Has heard every story and says so. Dry, patient, not cruel. Counts the years to his pension."}};
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
// ---------- art ----------
// Joined into city.js at //@art. Everything the city draws is built here from code: small icons, a face for each person, a
// scene for each place, and the map. All of it is SVG text; nothing is loaded. The people are original designs.
// Where a photograph of a person or a place exists (photo.js), it is shown instead and the drawing here is the fallback.

// A colour a little darker (a<0) or lighter (a>0) than hex.
function shade(hex,a){
  const n=parseInt(hex.slice(1),16),f=c=>Math.round(a<0?c*(1+a):c+(255-c)*a),
   r=f(n>>16&255),g=f(n>>8&255),b=f(n&255);
  return "#"+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);
}

// ---- icons: 24 by 24, drawn in the current text colour ----
const ICO={
 bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor" stroke="none"/>',
 food:'<path d="M7 3v7a2 2 0 0 0 4 0V3M9 3v18M17 3c-2 1-3 4-3 7s1 4 3 4v7"/>',
 mood:'<circle cx="12" cy="12" r="9"/><path d="M8 14.5c1.2 1.6 2.4 2.3 4 2.3s2.8-.7 4-2.3"/><circle cx="9" cy="10" r=".6" fill="currentColor"/><circle cx="15" cy="10" r=".6" fill="currentColor"/>',
 rep:'<path d="M3 18h18l-1.5-10-4.5 4-3-6-3 6-4.5-4z" fill="currentColor" stroke="none"/>',
 heat:'<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-4 5-4 8-1-1-2-2-2-4-2 2-3 5-3 8 0 4 3 7 7 7z" fill="currentColor" stroke="none"/>',
 phone:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/>',
 pin:'<path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
 people:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-4 3-6 6.5-6s6 2 6.5 6"/><circle cx="17" cy="9" r="2.8"/><path d="M15.5 14.2c3 .2 5.2 2 5.8 5.8"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.5 4-7 8-7s7.2 2.5 8 7"/>',
 case:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 13h18"/>',
 here:'<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
 map:'<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 cash:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9v.01M18 15v.01"/>',
 sun:'<circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/>',
 moon:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="currentColor" stroke="none"/>',
 flag:'<path d="M5 22V3M5 4h12l-2.5 4L17 12H5"/>',
 alert:'<path d="M12 3v11M12 19v.5"/>',
 msg:'<path d="M4 5h16v11H9l-5 4z"/>',
 bank:'<path d="M3 9l9-5 9 5M5 9v9M10 9v9M14 9v9M19 9v9M3 20h18"/>',
 radio:'<rect x="3" y="8" width="18" height="12" rx="2"/><circle cx="15.5" cy="14" r="3"/><path d="M6 12h5M6 15h5M7 8l10-5"/>',
 cam:'<rect x="2" y="6" width="15" height="12" rx="2"/><path d="M17 10l5-3v10l-5-3z"/>',
 bike:'<circle cx="6" cy="16" r="4"/><circle cx="18" cy="16" r="4"/><path d="M6 16l4-8h5l3 8M10 8l2 8h-6M13 5h3"/>',
 wrench:'<path d="M14.5 6.5a4.5 4.5 0 0 0 5.8 5.8L13 19.6a2.4 2.4 0 0 1-3.4-3.4l7.3-7.3"/><path d="M14.5 6.5 17 4l3 3-2.5 2.5"/>',
 scale:'<path d="M12 3v18M6 21h12M4 7h16M7 7l-3 7h6zM17 7l-3 7h6z"/>',
 trophy:'<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8"/>',
 ski:'<path d="M2 15c4 0 8-1 11-4l3-3h4l-2 4c-2 4-6 6-12 6H2z"/><path d="M10 9l2-3"/>',
 bed:'<path d="M3 18v-8M3 14h18v4M21 18v-4a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="11.5" r="1.8"/>',
 back:'<path d="M15 5l-7 7 7 7"/>',
 x:'<path d="M6 6l12 12M18 6 6 18"/>',
 star:'<path d="M12 3l2.7 5.6 6.1.8-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.8z" fill="currentColor" stroke="none"/>',
 gun:'<path d="M3 9h16v4h-7l-1 2H8l-1 5H4l1-6H3z"/>',
 pill:'<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-35 12 12)"/><path d="M10 9.5l4 5"/>',
 lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
 snd:'<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>',
 mute:'<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9l5 6M21 9l-5 6"/>'};
const ico=(k,c)=>`<svg class="ico${c?" "+c:""}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICO[k]||""}</svg>`;

// ---- faces ----
// One spec per person: skin, hair style and colour, what they wear, extras. face() draws it with an expression for a mood:
// up, flat, down (worried) or cold (done with you). The rounded crop is done in CSS, so no SVG ids are needed.
const FACE={
 rosa:{sk:"#c48a5f",hr:"bun",hc:"#2a1c16",streak:1,gl:1,ear:"stud",top:"apron",tc:"#f3ede3",ac:"#c2492f",bg:"#8f3322"},
 nia:{sk:"#7b4a31",hr:"curls",hc:"#1c1310",ear:"hoop",top:"tee",tc:"#1d1d24",towel:1,bg:"#7a2a52"},
 dex:{sk:"#e2b48f",hr:"bald",hc:"#a9a7a3",fh:"mus",gl:1,top:"shirt",tc:"#3f5b4b",chain:1,bg:"#28444c",hw:19,hh:21},
 marcus:{sk:"#5b3925",hr:"fade",hc:"#151112",fh:"goatee",top:"jersey",tc:"#1e7fd6",num:"13",ear:"stud",bg:"#0c6f7c",hw:18.5},
 sal:{sk:"#d6a479",hr:"slick",hc:"#3b3632",temple:"#9b958d",top:"suit",tc:"#2b2d38",tie:"#b08a22",bg:"#8a6a17",hw:18},
 june:{sk:"#e5bf98",hr:"pony",hc:"#141414",top:"tank",tc:"#6b4a8a",scar:1,bg:"#4d3366"},
 tommy:{sk:"#e3ae94",hr:"cap",hc:"#c9c4bd",cap:"#2f5f94",fh:"beard",top:"work",tc:"#55606e",bg:"#24507d",hw:19.5},
 kow:{sk:"#efc2a4",hr:"police",hc:"#6b4a33",fh:"mus",top:"cop",tc:"#1d2c4c",bg:"#1d2c4c",hw:19},
 reyes:{sk:"#c78f66",hr:"police",hc:"#1b1411",bunb:1,top:"cop",tc:"#1d2c4c",bg:"#1d2c4c"},
 vance:{sk:"#efd2be",hr:"neat",hc:"#2a2522",top:"coat",tc:"#a5794d",bg:"#20242c",hw:17.5},
 lena:{sk:"#b78160",hr:"undercut",hc:"#191416",ear:"hoop",top:"leather",tc:"#26262b",bg:"#5a2a2c"},
 fitz:{sk:"#f2c8a6",hr:"messy",hc:"#b4532a",freck:1,top:"hoodie",tc:"#3c6a4d",bg:"#284d39"},
 carol:{sk:"#eccbb1",hr:"bob",hc:"#aaa49c",gl:0,top:"dealer",tc:"#7a1f2b",bg:"#144a2b"},
 ia:{sk:"#d8b08f",hr:"bob",hc:"#2b2321",top:"suit",tc:"#5b5e66",tie:"#2b2d38",bg:"#3b3e46"},
 crew:{sk:"#a8714d",hr:"fade",hc:"#120f0f",fh:"goatee",top:"hoodie",tc:"#2a2a30",bg:"#3a1f24"},
 you:{sk:"#c9a07e",hr:"fade",hc:"#2a211c",top:"tee",tc:"#ff3d7f",bg:"#2b2d31"}};
function face(k,m,size,cls){
  // a photograph if there is one; one that has still to load fades in over the drawing
  const ph=photoFace(k,m||"flat",size);
  if(ph&&!ART.fresh)return `<span class="fc pic${cls?" "+cls:""}" style="width:${size}px;height:${size}px">${ph}</span>`;
  const f=FACE[k]||FACE.you,s=f.sk,sd=shade(s,-.16),dk=shade(s,-.34),h=f.hc,hd=shade(h,-.25),hw=f.hw||18,hh=f.hh||22,
   lip=shade(s,-.42),o=[];
  o.push(`<rect width="100" height="100" fill="${f.bg}"/><circle cx="50" cy="40" r="34" fill="#fff" opacity=".07"/>`);
  // hair that sits behind the head
  if(f.hr==="curls")o.push(`<g fill="${h}">${[[33,35,11],[40,25,11.5],[50,22,12.5],[60,25,11.5],[67,35,11],[30,47,9],[70,47,9],[33,57,7],[67,57,7]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>`);
  if(f.hr==="pony")o.push(`<path d="M63 28c13 0 17 16 11 33-2-10-6-17-13-22z" fill="${h}"/>`);
  if(f.hr==="bob")o.push(`<path d="M29 46c-2-17 8-27 21-27s23 10 21 27l1 17c-6 3-12 4-14 0V40H43v23c-3 4-9 3-15 0z" fill="${h}"/>`);
  if(f.hr==="bun")o.push(`<circle cx="50" cy="19" r="8" fill="${h}"/>`);
  // shoulders and clothes
  const torso=`M8 100C10 85 24 77 37 75h26c13 2 27 10 29 25z`;
  if(f.top==="tank"){o.push(`<path d="${torso}" fill="${sd}"/><path d="M35 77h5q10 9 20 0h5l3 23H32z" fill="${f.tc}"/>`)}
  else o.push(`<path d="${torso}" fill="${f.tc}"/>`);
  if(f.top==="apron")o.push(`<path d="M39 79h22l2 21H37z" fill="${f.ac}"/><path d="M39 79l-5-4M61 79l5-4" stroke="${f.ac}" stroke-width="2.4"/>`);
  if(f.top==="jersey")o.push(`<path d="M8 100C10 88 18 81 27 78l4 22z M92 100C90 88 82 81 73 78l-4 22z" fill="#fff" opacity=".9"/><text x="37" y="89" text-anchor="middle" font-family="Bungee,sans-serif" font-size="9" fill="#fff">${f.num||""}</text>`);
  if(f.top==="suit"||f.top==="coat"){
    o.push(f.top==="coat"?`<path d="M41 66h18l1 12H40z" fill="#16161a"/>`:`<path d="M43 75l7 14 7-14z" fill="#f2f0ec"/><path d="M48.6 80h2.8l1.2 13-2.6 3.5-2.6-3.5z" fill="${f.tie}"/>`);
    o.push(`<path d="M38 75l12 24M62 75 50 99" stroke="${shade(f.tc,-.35)}" stroke-width="2.2" fill="none"/>`);
  }
  if(f.top==="shirt")o.push(`<path d="M42 75l8 9 8-9" fill="${sd}"/><path d="M42 75l8 9 8-9" stroke="${shade(f.tc,-.3)}" stroke-width="1.6" fill="none"/>`);
  if(f.top==="work")o.push(`<path d="M41 75l9 7 9-7" stroke="${shade(f.tc,-.35)}" stroke-width="2.2" fill="none"/><ellipse cx="36" cy="88" rx="7" ry="4" fill="#f1ede6"/><path d="M32 88h8" stroke="#c0392b" stroke-width="1.2"/>`);
  if(f.top==="cop")o.push(`<path d="M41 75l9 7 9-7" stroke="#0e1628" stroke-width="2.2" fill="none"/><path d="M33 84l4-2 4 2-.5 5-3.5 3-3.5-3z" fill="#e2b33f"/><path d="M57 86h12" stroke="#8aa0c8" stroke-width="2.2"/>`);
  if(f.top==="leather")o.push(`<path d="M50 78v22" stroke="#9a9aa2" stroke-width="1.4"/><path d="M37 75l8 10 5-7 5 7 8-10" stroke="#0c0c0f" stroke-width="2.2" fill="none"/>`);
  if(f.top==="hoodie")o.push(`<path d="M34 77q16 14 32 0" stroke="${shade(f.tc,-.3)}" stroke-width="4" fill="none"/><path d="M45 86v8M55 86v8" stroke="#eee" stroke-width="1.6"/>`);
  if(f.top==="dealer")o.push(`<path d="M41 75l9 25 9-25z" fill="#f4f2ee"/><path d="M44 79l6 3 6-3-1 5-5-2-5 2z" fill="#111"/>`);
  if(f.top==="tee")o.push(`<path d="M41 75q9 7 18 0" stroke="${shade(f.tc,-.35)}" stroke-width="2.2" fill="none"/>`);
  if(f.towel)o.push(`<path d="M17 92q6-15 19-17l4 4q-12 4-15 17z" fill="#f1efea"/><path d="M21 87q6-8 15-10" stroke="#c0392b" stroke-width="1.6" fill="none"/>`);
  if(f.chain)o.push(`<path d="M39 76q11 15 22 0" stroke="#e6b83c" stroke-width="2.2" fill="none"/><circle cx="50" cy="86" r="2.2" fill="#e6b83c"/>`);
  // neck, head, ears
  o.push(`<path d="M42 58v17q8 6 16 0V58z" fill="${sd}"/>`);
  if(f.top==="coat")o.push(`<path d="M41 68h18l1 10H40z" fill="#16161a"/>`);
  o.push(`<ellipse cx="${50-hw-1}" cy="47" rx="3.6" ry="5" fill="${sd}"/><ellipse cx="${50+hw+1}" cy="47" rx="3.6" ry="5" fill="${sd}"/>`);
  o.push(`<ellipse cx="50" cy="45" rx="${hw}" ry="${hh}" fill="${s}"/>`);
  if(f.freck)o.push(`<g fill="${shade(s,-.3)}" opacity=".7">${[[40,52],[43,54],[38,55],[60,52],[57,54],[62,55]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r=".8"/>`).join("")}</g>`);
  // hair on top of the head
  const cap=(y1,y2)=>`M${50-hw-1} ${y1}C${50-hw-1} 26 41 ${y2} 50 ${y2}s${hw+1} 7 ${hw+1} ${y1-23}C${44+hw} 33 57 30 50 30S${55-hw} 33 ${50-hw-1} ${y1}z`;
  if(f.hr==="bun")o.push(`<path d="M31 45C29 28 39 21 50 21s21 7 19 24c-3-9-9-14-19-14s-16 5-19 14z" fill="${h}"/>`+(f.streak?`<path d="M44 22q-5 4-7 12" stroke="#b9b3ab" stroke-width="2.4" fill="none"/>`:""));
  if(f.hr==="curls")o.push(`<path d="M32 40q4-12 18-13t18 13q-7-6-18-6t-18 6z" fill="${h}"/>`);
  if(f.hr==="bald")o.push(`<path d="M${50-hw} 50c-1-9 1-14 4-17l2 9c-2 2-3 5-3 8z M${50+hw} 50c1-9-1-14-4-17l-2 9c2 2 3 5 3 8z" fill="${h}"/><path d="M44 26q6-2 12 0" stroke="${shade(s,.25)}" stroke-width="2" fill="none" opacity=".7"/>`);
  if(f.hr==="fade")o.push(`<path d="M${51-hw} 42C${51-hw} 29 41 23 50 23s${hw-1} 6 ${hw-1} 19c-4-8-10-11-${hw-1}-11s-14 3-${hw-1} 11z" fill="${h}"/>`);
  if(f.hr==="slick")o.push(`<path d="M${50-hw-1} 44C${50-hw-2} 27 40 21 50 21s${hw+2} 6 ${hw+1} 23c-2-9-8-15-${hw+1}-16s-15 7-${hw+1} 16z" fill="${h}"/><path d="M42 25q8-3 16 1" stroke="${shade(h,.35)}" stroke-width="1.6" fill="none"/>`+(f.temple?`<path d="M${50-hw} 44q0-6 3-9l1 9z M${50+hw} 44q0-6-3-9l-1 9z" fill="${f.temple}"/>`:""));
  if(f.hr==="pony")o.push(`<path d="M31 44C30 28 39 22 50 22s20 6 19 22c-3-8-10-13-19-13s-16 5-19 13z" fill="${h}"/><path d="M57 24q-8 3-12 9" stroke="${shade(h,.3)}" stroke-width="1.4" fill="none"/>`);
  if(f.hr==="bob")o.push(`<path d="M31 42C31 27 40 22 50 22s19 5 19 20q-6-9-21-10-11 1-17 10z" fill="${h}"/>`);
  if(f.hr==="neat")o.push(`<path d="M${50-hw} 41C${50-hw} 28 41 23 50 23s${hw} 5 ${hw} 18c-3-6-8-10-14-10l-3 1-2-1c-7 0-11 4-${hw-6} 10z" fill="${h}"/><path d="M45 25l-1 7" stroke="${shade(h,.3)}" stroke-width="1.2"/>`);
  if(f.hr==="undercut")o.push(`<path d="M32 43C30 27 41 20 52 21s17 7 16 16c-6-6-14-8-23-6-6 2-10 6-13 12z" fill="${h}"/><path d="M60 33q5 2 8 10" stroke="${shade(s,-.25)}" stroke-width="3" opacity=".5" fill="none"/>`);
  if(f.hr==="messy")o.push(`<path d="M31 42l1-9 4 3 1-9 5 5 3-9 4 7 4-8 3 8 5-6 1 9 4-3 1 12c-4-6-10-10-18-10s-14 4-18 10z" fill="${h}"/>`);
  if(f.hr==="cap"){o.push(`<path d="M${50-hw} 44q-2-7 2-10M${50+hw} 44q2-7-2-10" stroke="${h}" stroke-width="3.4" fill="none"/>`);
    o.push(`<path d="M30 37C30 24 39 17 50 17s20 7 20 20z" fill="${f.cap}"/><path d="M38 21q12-6 24 0l1 15H37z" fill="${shade(f.cap,.55)}"/><path d="M27 37q23 6 46 0l2 4q-25 9-50 0z" fill="${shade(f.cap,-.35)}"/>`)}
  if(f.hr==="police"){
    o.push(f.bunb?`<path d="M${50-hw-1} 52q-2-12 3-17l3 2q-3 6-2 15zM${50+hw+1} 52q2-12-3-17l-3 2q3 6 2 15z" fill="${h}"/>`
      :`<path d="M${50-hw} 41q0-6 4-8M${50+hw} 41q0-6-4-8" stroke="${h}" stroke-width="3" fill="none"/>`);
    o.push(`<path d="M28 34c2-10 11-15 22-15s20 5 22 15z" fill="#1b2846"/><path d="M28 33h44v5H28z" fill="#0b0f1a"/><path d="M30 38q20 7 40 0l1 2q-21 11-42 0z" fill="#06080d"/><path d="M46 23l4-2 4 2-.6 5-3.4 2-3.4-2z" fill="#e2b33f"/>`)}
  // the face itself
  const ey=47,mo=m||"flat";
  o.push(`<g fill="#17171b"><ellipse cx="43" cy="${ey}" rx="2.1" ry="${mo==="cold"?1.6:2.5}"/><ellipse cx="57" cy="${ey}" rx="2.1" ry="${mo==="cold"?1.6:2.5}"/></g><circle cx="43.7" cy="${ey-.9}" r=".6" fill="#fff"/><circle cx="57.7" cy="${ey-.9}" r=".6" fill="#fff"/>`);
  const br={up:["M38 40.5Q42.5 37.8 47 39.8","M53 39.8Q57.5 37.8 62 40.5"],flat:["M38 40.6L47 40","M53 40L62 40.6"],
   down:["M38 41.2L47 38.8","M53 38.8L62 41.2"],cold:["M38 38.6L47 41.6","M53 41.6L62 38.6"]}[mo]||[];
  const bc=f.hr==="bald"||f.hr==="police"&&!f.bunb?shade(f.hc,-.1):hd;
  o.push(`<g stroke="${bc}" stroke-width="2.3" stroke-linecap="round" fill="none"><path d="${br[0]}"/><path d="${br[1]}"/></g>`);
  if(f.scar)o.push(`<path d="M59 37.5l3 4.5" stroke="${shade(s,.35)}" stroke-width="1.2"/>`);
  o.push(`<path d="M50 48.5q-2.4 5.6.6 6.8" stroke="${dk}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`);
  if(f.fh==="beard")o.push(`<path d="M${51-hw} 47c1 16 9 21 18 21s17-5 18-21c-3 8-9 12-18 12s-15-4-18-12z" fill="${h}"/>`);
  if(f.fh==="goatee")o.push(`<path d="M46 64q4 5 8 0-4 2-8 0z" fill="${h}"/><path d="M44.5 57.4q5.5-2 11 0" stroke="${h}" stroke-width="1.4" fill="none"/>`);
  const mouth={up:`<path d="M43.5 59Q50 66 56.5 59Q50 61.5 43.5 59z" fill="${lip}"/><path d="M45.5 59.6q4.5 1.3 9 0" stroke="#fff" stroke-width="1.1" opacity=".8" fill="none"/>`,
   flat:`<path d="M44.5 60.6Q50 61.6 55.5 60.6" stroke="${lip}" stroke-width="2" stroke-linecap="round" fill="none"/>`,
   down:`<path d="M44.5 62.4Q50 58.6 55.5 62.4" stroke="${lip}" stroke-width="2" stroke-linecap="round" fill="none"/>`,
   cold:`<path d="M44 61.4L56 60.2" stroke="${lip}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`}[mo];
  o.push(mouth);
  if(f.fh==="mus")o.push(`<path d="M42.5 56.5Q50 52.3 57.5 56.5Q50 58.6 42.5 56.5z" fill="${h}"/>`);
  if(f.fh==="beard")o.push(`<path d="M42.5 56.5Q50 52.3 57.5 56.5Q50 58.6 42.5 56.5z" fill="${h}"/>`);
  if(f.gl)o.push(`<g stroke="#26262a" stroke-width="1.4" fill="#ffffff22"><rect x="36.5" y="46" width="11" height="6.5" rx="2.4"/><rect x="52.5" y="46" width="11" height="6.5" rx="2.4"/></g><path d="M47.5 48.4q2.5-1.6 5 0" stroke="#26262a" stroke-width="1.3" fill="none"/>`);
  if(f.ear==="hoop")o.push(`<g stroke="#e6b83c" stroke-width="1.6" fill="none"><circle cx="${50-hw-1}" cy="56" r="3.2"/><circle cx="${50+hw+1}" cy="56" r="3.2"/></g>`);
  if(f.ear==="stud")o.push(`<g fill="#e6b83c"><circle cx="${50-hw-1}" cy="52" r="1.3"/><circle cx="${50+hw+1}" cy="52" r="1.3"/></g>`);
  return `<span class="fc${ph?" pic":""}${cls?" "+cls:""}" style="width:${size}px;height:${size}px"><svg viewBox="9 7 82 82" width="${size}" height="${size}" aria-hidden="true">${o.join("")}</svg>${ph}</span>`;
}

// ---- scenes: one picture for each place, lit for the hour ----
// 400 by 150. The sky follows the clock; after dark the place dims and only its lights, signs and screens stay bright; a closed
// place goes dark behind a sign. Ids in a scene carry a counter so two scenes on one page never share them.
const dark=h=>h>=20||h<6;
let SCN=0;
function skyAt(h){return h<5||h>=21?["#060918","#1b1d48"]:h<7?["#2a2458","#e48a5c"]:h<17?["#3f8fe0","#bfe0ff"]:h<19?["#4b3584","#ff9560"]:["#17163c","#5a3a7c"]}
// a deterministic random for scenery, so nothing moves between frames
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
// a row of buildings standing on y0 between x0 and x1, no taller than top allows, with lit windows after dark
function skyline(y0,col,seed,h,x0=0,x1=400,top=-1e9){
  const q=rng(seed),o=[],lit=dark(h);let x=x0;
  while(x<x1-4){const w=Math.min(14+q()*30,x1-x),ht=Math.min(14+q()*44,y0-top),y=y0-ht;
    o.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${(ht+2).toFixed(1)}" fill="${col}"/>`);
    if(lit)for(let wy=y+5;wy<y0-4;wy+=7)for(let wx=x+3;wx<x+w-3;wx+=6)if(q()<.3)o.push(`<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="2.4" height="3" fill="#ffd47a" opacity="${(.5+q()*.5).toFixed(2)}"/>`);
    x+=w+1+q()*3}
  return o.join("");
}
// a ski seen side-on, bow to the right, standing on y. s scales it; c is the hull colour.
const skiSide=(x,y,s,c)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M-40 0h64q12 0 18-8l4-6h-10q-6 4-14 4H-34q-6 0-6 6z" fill="${c}"/><path d="M-40 0h62q10 0 16-6" stroke="#00000040" stroke-width="2" fill="none"/><path d="M-30-10q2-6 8-6h22q4 0 4 4v2z" fill="#1d2028"/><path d="M8-12l6-12h8" stroke="#d9dde3" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M-36-4h52" stroke="#ffffff55" stroke-width="1.4"/></g>`;
function scene(k,h,o){
  o=o||{};const n=dark(h),u="sc"+(++SCN),p=[],g=[],[ska,skb]=skyAt(h);
  const SKY=`url(#${u}k)`,WATER=`url(#${u}w)`,GLOW=`filter="url(#${u}g)"`;
  const neon=(x,y,t,c,sz)=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="Bungee,sans-serif" font-size="${sz}" fill="${c}" ${GLOW}>${t}</text>`;
  const lamp=(x,y,c,r)=>`<circle cx="${x}" cy="${y}" r="${(r||28)*(n?1:.6)}" fill="url(#${u}${c||"y"})"/><circle cx="${x}" cy="${y}" r="3" fill="#fff6dc"/>`;
  const stars=seed=>{if(!n)return "";const q=rng(seed);let t="";for(let i=0;i<26;i++)t+=`<circle cx="${(q()*400).toFixed(0)}" cy="${(q()*60).toFixed(0)}" r="${(.4+q()*.8).toFixed(1)}" fill="#fff" opacity="${(.3+q()*.6).toFixed(2)}"/>`;return t};
  // a window onto the street: sky, a few stars after dark, and the buildings across the road
  const win=(x,y,w,hh,seed)=>{const q=rng(seed+99);let st="";if(n)for(let i=0;i<8;i++)st+=`<circle cx="${(x+6+q()*(w-12)).toFixed(0)}" cy="${(y+4+q()*hh*.4).toFixed(0)}" r=".8" fill="#fff" opacity=".7"/>`;
    return `<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="${SKY}"/>${st}${skyline(y+hh,"#0e1220",seed,h,x,x+w,y+hh*.3)}<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="none" stroke="#1a1b21" stroke-width="5"/><path d="M${x+w/2} ${y}v${hh}M${x} ${y+hh/2}h${w}" stroke="#1a1b21" stroke-width="3"/>`};
  const inside=k==="home"&&o.pad!==2||k==="diner"||k==="bar"||k==="gym";
  if(k==="home"){
    if(o.pad===2){
      p.push(`<rect width="400" height="150" fill="${SKY}"/>${stars(7)}<path d="M0 78q60-18 120-6t130-4 150 8v12H0z" fill="${n?"#141a2c":"#5d6b52"}"/><rect y="86" width="400" height="64" fill="${WATER}"/>`);
      p.push(`<path d="M250 112h130v6H250z" fill="#6b4a2e"/>${[262,300,340,374].map(x=>`<rect x="${x}" y="114" width="4" height="22" fill="#4a3220"/>`).join("")}${skiSide(300,112,.55,o.hull||"#ff3d7f")}`);
      p.push(`<rect width="400" height="12" fill="#2a2522"/><rect width="12" height="150" fill="#2a2522"/><rect x="194" width="8" height="150" fill="#2a2522"/><rect x="388" width="12" height="150" fill="#2a2522"/>`);
      p.push(`<rect y="128" width="400" height="22" fill="#6e4e36"/><path d="M30 104h120a10 10 0 0 1 10 10v16H20v-16a10 10 0 0 1 10-10z" fill="#3e5a6e"/><rect x="40" y="96" width="100" height="14" rx="6" fill="#4a6a80"/>`);
      if(n)g.push(lamp(176,40,"y",34),`<circle cx="330" cy="30" r="8" fill="#f4f1de"/><path d="M310 98h40M318 106h24" stroke="#f4f1de" stroke-width="1.4" opacity=".5"/>`);
    }else{
      const nice=o.pad===1;
      p.push(`<rect width="400" height="150" fill="${nice?"#4b4560":"#363a45"}"/><rect y="118" width="400" height="32" fill="${nice?"#5a4030":"#2b241f"}"/>${[40,110,180,250,320].map(x=>`<path d="M${x} 118v32" stroke="#00000033"/>`).join("")}`);
      p.push(win(240,14,132,82,nice?11:3));
      if(!nice)p.push(`<g fill="#7a7f88">${[0,1,2,3,4,5,6,7,8].map(i=>`<rect x="${252+i*12}" y="100" width="8" height="26" rx="3"/>`).join("")}</g><rect x="248" y="122" width="110" height="5" fill="#5d6169"/>`);
      if(o.cactus)p.push(`<rect x="342" y="88" width="14" height="10" fill="#b5653a"/><path d="M349 88v-14m0 6h-5v-5m5 9h5v-6" stroke="#3f8f4f" stroke-width="4" stroke-linecap="round" fill="none"/>`);
      if(nice)p.push(`<path d="M24 98h150a10 10 0 0 1 10 10v22H14v-22a10 10 0 0 1 10-10z" fill="#7a3b4a"/><rect x="30" y="86" width="136" height="16" rx="7" fill="#8f4a5b"/><rect x="196" y="130" width="170" height="8" rx="4" fill="#2f6b6f" opacity=".7"/><path d="M380 118c0-14 8-20 8-34m0 34c0-12-6-18-10-26" stroke="#3f8f4f" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="374" y="116" width="20" height="14" fill="#c46a3a"/>`);
      else if(o.bed)p.push(`<rect x="22" y="92" width="10" height="44" fill="#5a3a28"/><rect x="26" y="106" width="170" height="24" rx="4" fill="#e4dfd3"/><rect x="80" y="104" width="116" height="26" rx="5" fill="#3d6aa3"/><rect x="34" y="100" width="40" height="12" rx="5" fill="#f4f1ea"/><rect x="26" y="128" width="170" height="8" fill="#5a3a28"/>`);
      else p.push(`<rect x="28" y="116" width="160" height="16" rx="5" fill="#d9d3c5"/><rect x="84" y="112" width="104" height="18" rx="6" fill="#3d6aa3"/><rect x="34" y="110" width="38" height="10" rx="4" fill="#efebe2"/>`);
      if(o.tv){p.push(`<rect x="198" y="102" width="36" height="20" fill="#4a3a30"/><rect x="194" y="64" width="44" height="34" rx="3" fill="#101216"/>`);g.push(`<rect x="198" y="68" width="36" height="26" fill="${n?"#6fdcff":"#2c4a66"}"/>`+(n?lamp(216,82,"c",44):""))}
      else p.push(`<rect x="200" y="104" width="30" height="20" fill="#2f6fa5"/><rect x="202" y="86" width="26" height="18" fill="#b5442f"/><path d="M200 114h30M202 95h26" stroke="#00000044"/>`);
      if(o.fridge)p.push(`<rect x="376" y="40" width="30" height="96" rx="3" fill="#dcdcdc"/><path d="M376 78h30" stroke="#a9a9a9"/>`);
      if(o.safe)p.push(`<rect x="200" y="124" width="26" height="14" fill="#2a2d33"/><circle cx="213" cy="131" r="3" fill="#8a8f98"/>`);
      if(n)g.push(`<path d="M120 0v20" stroke="#222" stroke-width="1.5"/>`+lamp(120,26,"y",40));
    }
  }
  if(k==="diner"){
    p.push(`<rect width="400" height="150" fill="#efe1c4"/><rect y="66" width="400" height="44" fill="#b5402a"/><path d="M0 66h400" stroke="#fff" stroke-width="4" stroke-dasharray="10 10"/>`);
    p.push(`<rect x="14" y="10" width="120" height="48" rx="4" fill="#2a1d18"/><rect x="18" y="14" width="112" height="40" fill="${SKY}"/><rect x="160" y="10" width="226" height="44" rx="6" fill="#20160f"/>`);
    if(!o.closed)g.push(neon(74,44,"OPEN","#ff3b3b",14));g.push(neon(273,42,"LUCKY'S",o.lost?"#9a8f86":"#ff5a3c",24));
    p.push(`<rect y="96" width="400" height="8" fill="#e8e3da"/><rect y="104" width="400" height="18" fill="#8a2c20"/>`);
    p.push(`<rect x="40" y="78" width="22" height="18" rx="3" fill="#3a2a22"/><rect x="44" y="70" width="14" height="10" fill="#6a3d22"/><path d="M100 96h60v-16q-30-14-60 0z" fill="#ffffff66" stroke="#e8e3da"/><circle cx="118" cy="88" r="7" fill="#e7a33b"/><circle cx="140" cy="88" r="7" fill="#c75a3a"/>`);
    let ch="";for(let i=0;i<20;i++)for(let j=0;j<2;j++)if((i+j)%2)ch+=`<rect x="${i*20}" y="${122+j*14}" width="20" height="14"/>`;
    p.push(`<rect y="122" width="400" height="28" fill="#f2f0ea"/><g fill="#1c1c1f">${ch}</g>`);
    p.push(`<g>${[50,110,170,230,290,350].map(x=>`<rect x="${x-2}" y="124" width="4" height="22" fill="#9a9ea6"/><ellipse cx="${x}" cy="124" rx="11" ry="4" fill="#c2392b"/>`).join("")}</g>`);
    p.push([90,200,310].map(x=>`<path d="M${x} 0v8" stroke="#333" stroke-width="1.5"/><path d="M${x-9} 16q9-10 18 0z" fill="#d9a03a"/>`).join(""));
    if(!o.closed)g.push([90,200,310].map(x=>lamp(x,17,"y",24)).join(""));
  }
  if(k==="court"){
    p.push(`<rect width="400" height="150" fill="${SKY}"/>${stars(5)}${skyline(96,n?"#121826":"#7f8fa8",21,h)}<rect y="96" width="400" height="54" fill="#3d4048"/>`);
    p.push(`<path d="M0 132q100-22 200 0" stroke="#e8e8e8" stroke-width="2" fill="none" opacity=".7"/><path d="M60 150l40-30M250 140l30 6 20-12" stroke="#2a2c31" stroke-width="1.4"/>`);
    p.push(`<g stroke="#a3a9b2" stroke-width=".8" opacity=".45">${Array.from({length:44},(_,i)=>`<path d="M${i*12-60} 112l60-80M${i*12} 112l-60-80"/>`).join("")}</g><path d="M0 32h400M0 112h400" stroke="#8c929b" stroke-width="2.4"/>${[0,100,200,300,400].map(x=>`<path d="M${x} 28v86" stroke="#6b7078" stroke-width="4"/>`).join("")}`);
    p.push(`<path d="M318 140V60" stroke="#5c6169" stroke-width="6"/><rect x="286" y="34" width="64" height="40" rx="2" fill="#f2f2f2" stroke="#c9c9c9"/><rect x="306" y="48" width="24" height="18" fill="none" stroke="#d6392b" stroke-width="2.4"/><path d="M304 70h28" stroke="#e8792e" stroke-width="3"/><path d="M306 71l4 14M318 71v15M330 71l-4 14M308 78h20" stroke="#cfd3d8" stroke-width="1"/>`);
    p.push(`<path d="M40 150V30h18" stroke="#55595f" stroke-width="4" fill="none"/>`);
    if(n)g.push(lamp(58,34,"y",44));
    // a block party: string lights over the fence, speakers on a pickup bed, a crowd
    if(o.party){p.push(`<rect x="196" y="98" width="70" height="26" rx="3" fill="#3a5a8a"/><rect x="204" y="80" width="18" height="22" fill="#111"/><rect x="226" y="84" width="16" height="18" fill="#111"/><circle cx="213" cy="91" r="5" fill="#333"/><circle cx="234" cy="93" r="4" fill="#333"/><g fill="#0b0b10">${Array.from({length:15},(_,i)=>`<circle cx="${10+i*27}" cy="${128+(i%3)*3}" r="8"/><rect x="${2+i*27}" y="${134+(i%3)*3}" width="16" height="20" rx="6"/>`).join("")}</g>`);
      g.push(`<path d="M0 30q50 18 100 0t100 0 100 0 100 0" stroke="#333" fill="none"/>`+Array.from({length:20},(_,i)=>{const x=i*21+5,y=30+9*Math.sin((x%100)/100*Math.PI);return `<circle cx="${x}" cy="${y.toFixed(1)}" r="2.6" fill="${["#ffd166","#ff3d7f","#2de2e6"][i%3]}" ${GLOW}/>`}).join(""))}
  }
  if(k==="bar"){
    p.push(`<rect width="400" height="150" fill="#1a1220"/>${[0,1,2,3,4,5,6,7,8,9].map(i=>`<path d="M${i*44} 0v150" stroke="#ffffff07" stroke-width="2"/>`).join("")}<rect x="96" y="10" width="208" height="38" rx="6" fill="#0c070f"/>`);
    g.push(neon(200,38,"THE LOW END",o.closed?"#5a3a55":"#ff3df0",20));
    p.push(`<rect x="118" y="56" width="164" height="4" fill="#3a2a25"/><rect x="118" y="78" width="164" height="4" fill="#3a2a25"/>${Array.from({length:18},(_,i)=>{const c=["#3f7f5f","#a8552f","#d9b44a","#6b2a4a","#2f5f8f"][i%5];return `<rect x="${122+i*9}" y="${i%2?62:64}" width="5" height="${i%2?16:14}" rx="1.5" fill="${c}"/><rect x="${122+((i+7)%18)*9}" y="${84+(i%3)}" width="5" height="${12-(i%3)}" rx="1.5" fill="${c}"/>`}).join("")}`);
    p.push(`<rect y="100" width="400" height="10" fill="#6b3f28"/><rect y="110" width="400" height="40" fill="#3b2219"/>${[150,200,250].map(x=>`<rect x="${x-2}" y="118" width="4" height="32" fill="#22252b"/><ellipse cx="${x}" cy="118" rx="10" ry="3.5" fill="#7a1f3d"/>`).join("")}`);
    p.push(`<path d="M20 140V70a30 30 0 0 1 60 0v70z" fill="#2a1a14"/><path d="M330 150V84h70v66z" fill="#5a1f2c"/><rect x="330" y="80" width="70" height="10" rx="4" fill="#6e2737"/>`);
    if(!o.closed)g.push(`<path d="M28 72a22 22 0 0 1 44 0" stroke="#ff9a3c" stroke-width="3" fill="none" ${GLOW}/><path d="M33 74a17 17 0 0 1 34 0" stroke="#3de2ff" stroke-width="3" fill="none" ${GLOW}/><rect x="32" y="88" width="36" height="20" rx="3" fill="#ffcf6a" opacity=".85"/>`+lamp(365,22,"p",34)+lamp(200,96,"y",30));
  }
  if(k==="pawn"){
    let br="";for(let i=0;i<120;i++)br+=`<path d="M${(i%20)*20+(Math.floor(i/20)%2?10:0)} ${26+Math.floor(i/20)*16}v8"/>`;
    p.push(`<rect width="400" height="40" fill="${SKY}"/>${stars(9)}<rect y="18" width="400" height="132" fill="#5a382d"/><g stroke="#00000030" stroke-width="1">${Array.from({length:16},(_,i)=>`<path d="M0 ${26+i*8}h400"/>`).join("")}${br}</g><rect x="50" y="24" width="300" height="34" rx="4" fill="#0e0d0b"/>`);
    g.push(neon(200,50,"GOLD LINE PAWN",o.closed?"#6b5a2a":"#f4c542",19));
    p.push(`<rect x="34" y="66" width="220" height="70" fill="${n?"#1b2230":"#26303d"}"/><path d="M60 128c-6-14 0-26 12-24l18-30 4 2-16 30c10 6 6 22-6 24-6 1-10 0-12-2z" fill="#b8742f"/><circle cx="140" cy="100" r="9" fill="none" stroke="#e6c24a" stroke-width="3"/><circle cx="168" cy="96" r="7" fill="none" stroke="#c9ccd1" stroke-width="3"/><rect x="190" y="84" width="46" height="34" rx="3" fill="#121418"/><rect x="194" y="88" width="38" height="26" fill="#2b4a66"/>`);
    p.push(`<g stroke="#15161a" stroke-width="3">${Array.from({length:12},(_,i)=>`<path d="M${42+i*18} 66v70"/>`).join("")}</g><rect x="34" y="66" width="220" height="70" fill="none" stroke="#2b2017" stroke-width="5"/>`);
    p.push(`<rect x="274" y="70" width="60" height="80" fill="#1d1612"/><rect x="282" y="78" width="44" height="30" fill="#3a4a5a"/><text x="304" y="126" text-anchor="middle" font-family="Bungee,sans-serif" font-size="8" fill="#ff4a3a">WE BUY GOLD</text><rect y="140" width="400" height="10" fill="#4a4d55"/>`);
    if(n&&!o.closed)g.push(`<rect x="282" y="78" width="44" height="30" fill="#ffcf7a" opacity=".55"/>`);
  }
  if(k==="garage"){
    p.push(`<rect width="400" height="40" fill="${SKY}"/>${stars(13)}<rect y="20" width="400" height="130" fill="#2c313c"/><rect x="100" y="26" width="200" height="30" rx="4" fill="#123257"/><text x="200" y="66" text-anchor="middle" font-family="Archivo,sans-serif" font-weight="800" font-size="7.5" letter-spacing="3" fill="#9bb7d6">MARINE · SERVICE · PARTS</text>`);
    g.push(neon(200,49,"TOMMY'S",o.closed?"#2a4a6a":"#5ab4ff",22));
    const shut=x=>`<rect x="${x}" y="70" width="100" height="70" fill="#59606c"/>${Array.from({length:9},(_,i)=>`<path d="M${x} ${74+i*7.5}h100" stroke="#3e444e" stroke-width="1.6"/>`).join("")}`;
    p.push(shut(22)+(o.chop?`<rect x="278" y="70" width="100" height="70" fill="#1d1f24"/><path d="M278 70l100 70M378 70l-100 70" stroke="#3a3d44" stroke-width="2"/>`:shut(278)));
    p.push(o.closed?shut(150):`<rect x="150" y="70" width="100" height="70" fill="#3b4250"/><path d="M162 126h76" stroke="#1d2028" stroke-width="4"/><path d="M172 126v-8M228 126v-8" stroke="#1d2028" stroke-width="3"/>${skiSide(198,116,.9,o.hull||"#ff3d7f")}`);
    p.push(`<rect y="140" width="400" height="10" fill="#4b4e55"/><ellipse cx="80" cy="145" rx="26" ry="3" fill="#00000055"/>${[0,1,2].map(i=>`<ellipse cx="12" cy="${132-i*10}" rx="11" ry="5" fill="#16171b" stroke="#2c2e33" stroke-width="2"/>`).join("")}`);
    if(!o.closed)g.push(`<rect x="150" y="70" width="100" height="5" fill="#e8f4ff" opacity=".85"/>`+(n?lamp(200,76,"c",40):""));
  }
  if(k==="docks"){
    p.push(`<rect width="400" height="150" fill="${SKY}"/>${stars(17)}<rect y="96" width="400" height="54" fill="${WATER}"/><g stroke="#ffffff22" stroke-width="1.2">${Array.from({length:9},(_,i)=>`<path d="M${(i*53)%380} ${108+(i%4)*9}h${18+(i%3)*8}"/>`).join("")}</g>`);
    const box=(x,y,w,c)=>`<rect x="${x}" y="${y}" width="${w}" height="18" fill="${c}"/>${Array.from({length:Math.floor(w/5)},(_,i)=>`<path d="M${x+3+i*5} ${y+2}v14" stroke="#00000033"/>`).join("")}`;
    p.push(box(8,78,70,"#b5442f")+box(80,78,60,"#2f6fa5")+box(142,78,64,"#d9a03a")+box(20,60,64,"#3f7f5f")+box(86,60,70,"#8a3f6b")+box(40,42,62,"#2f6fa5"));
    if(o.vance)p.push(`<rect x="214" y="48" width="70" height="48" fill="#3c434d"/><text x="249" y="64" text-anchor="middle" font-family="Archivo,sans-serif" font-weight="800" font-size="7" fill="#d8dde4">PIER 4</text><text x="249" y="73" text-anchor="middle" font-family="Archivo,sans-serif" font-size="5.5" fill="#aab2bd">COLD STORAGE</text>`);
    p.push(`<path d="M300 96V30h8v66M372 96V30h8v66M292 30h100v-8H292zM300 22l40-14 40 14" stroke="#c9b13a" stroke-width="3" fill="none"/><path d="M338 30v26" stroke="#9aa0a8" stroke-width="1.5"/><rect x="330" y="56" width="16" height="10" fill="#d9a03a"/>`);
    p.push(`<rect y="94" width="400" height="6" fill="#4a3a2c"/>${[20,90,160,230,300,370].map(x=>`<rect x="${x}" y="96" width="5" height="20" fill="#2e241b"/>`).join("")}<path d="M250 94V40" stroke="#3a3d44" stroke-width="3"/>`);
    g.push(lamp(250,40,"y",40));
    if(n)g.push(`<rect y="72" width="400" height="36" fill="#cfd8e6" opacity=".07"/>`);
  }
  if(k==="gym"){
    let br="";for(let i=0;i<180;i++)br+=`<path d="M${(i%20)*20+(Math.floor(i/20)%2?10:0)} ${Math.floor(i/20)*16}v8"/>`;
    p.push(`<rect width="400" height="150" fill="#4a2e2a"/><g stroke="#00000030">${Array.from({length:18},(_,i)=>`<path d="M0 ${i*8}h400"/>`).join("")}${br}</g><text x="18" y="56" font-family="Bungee,sans-serif" font-size="26" fill="#a67fd6" opacity=".9">IRON</text><text x="18" y="86" font-family="Bungee,sans-serif" font-size="26" fill="#a67fd6" opacity=".9">DEN</text>`);
    p.push([140,184,228].map((x,i)=>`<path d="M${x} 6v28" stroke="#888" stroke-width="1.5"/><rect x="${x-11}" y="34" width="22" height="60" rx="9" fill="${["#b3262b","#202226","#b3262b"][i]}"/><rect x="${x-11}" y="44" width="22" height="4" fill="#00000040"/>`).join(""));
    p.push(`<rect y="120" width="400" height="30" fill="#2b2d33"/><path d="M260 150V64" stroke="#d9d9d9" stroke-width="6"/><path d="M260 76l140 18M260 108l140 18" stroke-width="3" stroke="#c0392b"/><path d="M260 92l140 18" stroke="#eee" stroke-width="3"/>`);
    if(o.fight)p.push(`<rect y="96" width="400" height="54" fill="#000" opacity=".35"/><g fill="#0b0b0d">${Array.from({length:16},(_,i)=>`<circle cx="${12+i*25}" cy="${128+(i%2)*4}" r="9"/><rect x="${3+i*25}" y="${134+(i%2)*4}" width="18" height="20" rx="6"/>`).join("")}</g>`);
    if(!o.closed)g.push(`<path d="M20 6h160M220 6h160" stroke="#eef4ff" stroke-width="4" opacity=".9"/>`+(n?lamp(100,8,"c",50)+lamp(300,8,"c",50):"")+(o.fight?`<rect width="400" height="150" fill="#d6c7a8" opacity=".08"/>`:""));
  }
  if(k==="lake"){
    p.push(`<rect width="400" height="150" fill="${SKY}"/>${stars(23)}<path d="M0 82l40-16 30 8 50-22 40 18 40-10 50 20 40-14 50 16 60-6v26H0z" fill="${n?"#1a1830":"#8a5e4a"}"/><path d="M0 88l60-8 70 6 80-10 90 10 100-4v10H0z" fill="${n?"#141226":"#6e4a3c"}"/><rect y="90" width="400" height="60" fill="${WATER}"/>`);
    p.push(`<path d="M0 150V110l120 40z" fill="#9a9a96"/><path d="M0 118l90 32" stroke="#7a7a76" stroke-width="2"/>`);
    p.push([[24,"#ff3d7f"],[66,"#2f8fe0"],[108,"#f4c542"]].map(([x,c])=>`<path d="M${x-18} 90l18-16 18 16z" fill="${c}"/><path d="M${x} 74v-8" stroke="#ddd"/>`).join(""));
    p.push(`<g fill="#ff7a2e">${[[170,112],[250,104],[330,118],[290,134]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3.4"/>`).join("")}</g>${skiSide(226,126,.62,o.hull||"#ff3d7f")}<path d="M170 128q10-6 24-3" stroke="#e8f7ff" stroke-width="2" fill="none" opacity=".7"/>`);
    if(o.boat){p.push(`<rect x="130" y="58" width="160" height="30" fill="#f2f2f2"/><path d="M130 58l20-14h120l20 14z" fill="#e8e8e8"/><rect x="126" y="40" width="168" height="16" rx="3" fill="#123257"/><text x="210" y="52" text-anchor="middle" font-family="Bungee,sans-serif" font-size="11" fill="#fff">BOAT SHOW</text>`+skiSide(170,86,.32,"#2f8fe0")+skiSide(250,86,.32,"#f4c542"))}
    if(o.race){p.push(`<g>${Array.from({length:14},(_,i)=>`<path d="M${130+i*19} 48l9 6-9 6z" fill="${["#ff3d7f","#ffd166","#2de2e6"][i%3]}"/>`).join("")}<path d="M128 48h270" stroke="#ddd"/></g><rect x="150" y="16" width="120" height="22" rx="4" fill="#111"/>`);g.push(neon(210,33,"RACE DAY","#ffd166",14))}
    if(n)g.push(`<circle cx="320" cy="26" r="9" fill="#f4f1de"/><path d="M300 100h40M310 108h22M316 116h10" stroke="#f4f1de" stroke-width="1.4" opacity=".5"/>`);
  }
  // after dark the room dims (more indoors, where the lights are off) and only what glows stays bright
  const dim=o.closed?.62:n?(inside?.4:.28):h<7||h>=18?.12:0;
  if(dim)p.push(`<rect width="400" height="150" fill="#05071a" opacity="${dim}"/>`);
  if(o.closed)g.push(`<rect x="140" y="58" width="120" height="34" rx="5" fill="#16171c" stroke="#ff3d7f" stroke-width="2"/>`+neon(200,81,"CLOSED","#ff3d7f",16));
  const rad=(id,c)=>`<radialGradient id="${u}${id}"><stop offset="0" stop-color="${c}" stop-opacity=".55"/><stop offset=".35" stop-color="${c}" stop-opacity=".22"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
  const defs=`<defs><linearGradient id="${u}k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ska}"/><stop offset="1" stop-color="${skb}"/></linearGradient>
<linearGradient id="${u}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${n?"#0d2236":"#1f7c94"}"/><stop offset="1" stop-color="${n?"#050b14":"#0b3f52"}"/></linearGradient>
${rad("y","#ffd27a")}${rad("c","#bfe8ff")}${rad("p","#ff7ac8")}<filter id="${u}g" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="${n?2.6:1.2}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
  return `<svg class="scene-art" viewBox="0 0 400 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${defs}${p.join("")}${g.join("")}</svg>`;
}

// ---- the map ----
// 400 by 560, three rows of blocks above the water. The streets, blocks and filler buildings never change, so they are drawn
// once (MAPBASE); the lit windows and street lamps once more for the night (MAPNITE). Places, people and markers are laid on top
// by the city each time it renders.
const MXY={home:[66,78],diner:[200,78],court:[334,78],bar:[66,220],pawn:[200,220],garage:[334,220],docks:[86,478],gym:[200,356],lake:[318,478]};
const MROW={home:0,diner:0,court:0,bar:1,pawn:1,garage:1,gym:2,docks:3,lake:3};
const ROADY=[150,290,420],ROADX=[133,267];
let MAPBASE="",MAPNITE="";
function mapBase(){
  if(MAPBASE)return;
  const q=rng(40),o=[],nite=[],blocks=[[8,14,117,128],[142,14,117,128],[276,14,116,128],[8,158,117,124],[142,158,117,124],[276,158,116,124],[8,298,117,114],[142,298,117,114],[276,298,116,114]];
  o.push(`<defs><linearGradient id="mpW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f3346"/><stop offset="1" stop-color="#061722"/></linearGradient>
<radialGradient id="mpL"><stop offset="0" stop-color="#ffd27a" stop-opacity=".5"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>`);
  o.push(`<rect width="400" height="560" fill="#121419"/>`);
  o.push(`<path d="M0 432q50-6 100 0t100 2 100-4 100 2v128H0z" fill="url(#mpW)"/><g stroke="#ffffff14" stroke-width="1.2">${Array.from({length:16},()=>{const x=q()*370,y=448+q()*100;return `<path d="M${x.toFixed(0)} ${y.toFixed(0)}h${(10+q()*24).toFixed(0)}"/>`}).join("")}</g>`);
  // the blocks and the plain buildings that fill them, leaving room in the middle of each for its place
  blocks.forEach(([x,y,w,h],i)=>{
    o.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#1b1e25"/>`);
    if(i===2||i===8)return;
    const keep=[x+w/2-44,y+h/2-40,88,74];
    for(let t=0;t<14;t++){const bw=14+q()*26,bh=14+q()*26,bx=x+4+q()*(w-bw-8),by=y+4+q()*(h-bh-8);
      if(bx<keep[0]+keep[2]&&bx+bw>keep[0]&&by<keep[1]+keep[3]&&by+bh>keep[1])continue;
      if(i===6){o.push(`<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${(bw*1.3).toFixed(1)}" height="9" fill="${["#9a3a2a","#2a5a8a","#b08a2a","#2f6f4f","#7a3a5f"][t%5]}"/>`);continue}
      const c=["#262a33","#2b2f38","#23262e","#2e323c"][t%4];o.push(`<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="2" fill="${c}"/><rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="3" fill="#ffffff0d"/>`);
      for(let wy=by+5;wy<by+bh-3;wy+=5)for(let wx=bx+3;wx<bx+bw-3;wx+=5)if(q()<.35)nite.push(`<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="2" height="2" fill="#ffd47a" opacity="${(.45+q()*.5).toFixed(2)}"/>`)}
  });
  // the park by the lake and the yard by the docks
  o.push(`<rect x="276" y="298" width="116" height="114" rx="6" fill="#18261d"/>${Array.from({length:16},()=>`<circle cx="${(284+q()*100).toFixed(0)}" cy="${(306+q()*96).toFixed(0)}" r="${(5+q()*5).toFixed(1)}" fill="${q()<.5?"#21402b":"#1d3726"}"/>`).join("")}`);
  // streets with their centre lines, then the shore road
  for(const y of ROADY)o.push(`<rect x="0" y="${y-8}" width="400" height="16" fill="#2c3038"/><path d="M0 ${y}h400" stroke="#d9b44a" stroke-width="1" stroke-dasharray="7 7" opacity=".45"/>`);
  for(const x of ROADX)o.push(`<rect x="${x-8}" y="0" width="16" height="428" fill="#2c3038"/><path d="M${x} 0v428" stroke="#d9b44a" stroke-width="1" stroke-dasharray="7 7" opacity=".45"/>`);
  for(const x of ROADX)for(const y of ROADY)o.push(`<rect x="${x-8}" y="${y-8}" width="16" height="16" fill="#2c3038"/>`);
  // the piers off the docks, and the ramp and buoys at the lake
  o.push(`<g fill="#4a3a2c">${[24,62,100,138].map(x=>`<rect x="${x}" y="426" width="10" height="64"/>`).join("")}<rect x="20" y="486" width="132" height="8"/></g>`);
  o.push(`<path d="M290 426l50 0 14 40h-50z" fill="#6f6f6c"/><g fill="#ff7a2e">${[[300,500],[340,512],[372,494],[356,530],[318,528]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.6"/>`).join("")}</g>`);
  for(const [x,y] of [[60,150],[200,150],[340,150],[60,290],[200,290],[340,290],[60,420],[200,420],[340,420],[133,80],[267,80],[133,220],[267,220],[133,356],[267,356]])
    nite.push(`<circle cx="${x}" cy="${y}" r="16" fill="url(#mpL)"/><circle cx="${x}" cy="${y}" r="1.6" fill="#fff4cf"/>`);
  MAPBASE=o.join("");MAPNITE=nite.join("");
}
// The building or ground each place stands on, in its colour.
function mapPlace(k,c){
  const [x,y]=MXY[k];
  if(k==="court")return `<rect x="${x-46}" y="${y-38}" width="92" height="64" rx="3" fill="#25553f"/><rect x="${x-40}" y="${y-32}" width="80" height="52" fill="none" stroke="#e6e6e6" stroke-width="1.2" opacity=".7"/><path d="M${x} ${y-32}v52" stroke="#e6e6e6" stroke-width="1" opacity=".6"/><circle cx="${x}" cy="${y-6}" r="9" fill="none" stroke="#e6e6e6" stroke-width="1" opacity=".6"/>`;
  if(k==="docks")return `<g>${[[30,430,"#b5442f"],[62,432,"#2f6fa5"],[94,430,"#d9a03a"],[46,446,"#3f7f5f"]].map(([a,b,cc])=>`<rect x="${a}" y="${b}" width="28" height="10" fill="${cc}"/>`).join("")}</g><rect x="${x-56}" y="${y-34}" width="112" height="8" fill="none"/>`;
  if(k==="lake")return `<g>${[[296,404,"#ff3d7f"],[322,404,"#2f8fe0"],[348,404,"#f4c542"]].map(([a,b,cc])=>`<path d="M${a-10} ${b}l10-10 10 10z" fill="${cc}"/>`).join("")}</g>`;
  return `<rect x="${x-44}" y="${y-36}" width="88" height="62" rx="4" fill="${shade(c,-.25)}"/><rect x="${x-44}" y="${y-36}" width="88" height="10" rx="4" fill="${c}"/><rect x="${x-36}" y="${y-20}" width="72" height="30" fill="#00000026"/>`;
}
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
   +photoCard()+sec("Street log",`<div class="log" id="log">${S.log.map(l=>`<p><time>${l.t}</time>${l.x}</p>`).join("")}</div>`)
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
// ---------- the shape of a season ----------
// Joined into city.js at //@life. Two things that give a season direction and make days different from each other.
// An aim, picked on day 1 and changeable any time from You: what you came here to do. It is tracked all season, shows up in
// what's next, and if you get there the season ends on it. And happenings: most days something is on somewhere in the city
// (a block party, a boat show, a stacked fight card, checkpoints, Sal paying top dollar), announced in the morning.

// prog(): 0 to 1, how close you are. line(): where you stand, in a few words. done(): whether you made it. at: where to go.
const ASP={
 champ:{n:"Champion",d:"Win the series at Havasu.",ic:"trophy",at:"lake",
  prog:()=>{const I=HS.info();return I.round>=I.total?(S.tourPos===1?1:.5):Math.min(.95,I.round/I.total*(I.pos===1?1:I.pos<=3?.7:.4))},
  line:()=>{const I=HS.info();return I.round>=I.total?"series over · "+ord(S.tourPos||I.pos):I.round?ord(I.pos)+" in the series after "+I.round+" of "+I.total+" rounds":"first round on day "+motoDay(0)},
  done:()=>S.tourPos===1,win:"You came to win the series and you won it. The sheet at Havasu has your name at the top, and the city that watched you do it will be telling the story wrong for years."},
 king:{n:"Kingpin",d:"Run something on the street, and finish with $20,000.",ic:"alert",at:"bar",
  prog:()=>(runs()?.5:0)+Math.min(.5,S.cash/40000),line:()=>(runs()?"you run something · ":"you don't run anything yet · ")+$$(S.cash)+" of $20,000",
  done:()=>runs()&&S.cash>=20000,win:"You came to run something and you run it. Twenty grand in a shoebox and a corner of this city that answers to you. Sleep light."},
 legit:{n:"Legit",d:"Own the garage, and finish clean: never booked, heat under 20.",ic:"wrench",at:"garage",
  prog:()=>(S.gar?.6:Math.min(.5,S.cash/16000))+(S.booked?0:.2)+(S.heat<20?.2:0),line:()=>(S.gar?"the garage is yours":$$(S.cash)+" toward the garage")+(S.booked?" · you've been booked":" · clean record")+" · heat "+Math.round(S.heat),
  done:()=>S.gar&&!S.booked&&S.heat<20,win:"Your name's on the sign at the garage, your record's clean, and nobody in a uniform knows your face. You did it the hard way, on purpose."},
 fame:{n:"Famous",d:"50,000 followers and three sponsors.",ic:"cam",at:"lake",
  prog:()=>Math.min(1,S.cl.f/50000*.7+signed().length/3*.3),line:()=>S.cl.f.toLocaleString()+" followers · "+signed().length+" of 3 sponsors",
  done:()=>S.cl.f>=50000&&signed().length>=3,win:"Fifty thousand people watch everything you do, and three companies pay you for it. You'd better keep doing interesting things."},
 fam:{n:"Family",d:"Four friends who'd pick up at 3 a.m., and someone to come home to.",ic:"people",at:null,
  prog:()=>Math.min(1,Math.min(4,friends())/4*.6+(home2()?.4:0)),line:()=>Math.min(4,friends())+" of 4 friends · "+(S.q.nia===3?"Nia lives with you":S.q.june===1?"you're in June's corner":"nobody to come home to yet"),
  done:()=>friends()>=4&&home2(),win:"You came here alone. Now four people would pick up at 3 a.m., and somebody leaves the light on for you."}};
const runs=()=>!!(S.chop||S.z.docks||S.z.v===6||S.q.nia===2),home2=()=>S.q.nia===3||S.q.june===1;
function aimPick(){
  modal("What are you here for?","Pick what you came to this city to do. It shapes what's next and how the season ends. You can change it any time from You.",
    Object.entries(ASP).map(([k,a])=>[a.n+" · "+a.d,()=>{S.asp=k;log("Your aim: "+a.n+". "+a.d)}]).concat([["Just living · no aim",()=>{S.asp="none"}]]));
}
function aimCard(){
  const a=ASP[S.asp];
  if(!a)return `<section class="card aim"><h3>${ico("flag")}Your aim<small>none</small></h3><p class="note">You're just living. Pick something and the city will point you at it.</p><button class="go" data-x="${xa(aimPick)}">${ico("flag")}Pick an aim</button></section>`;
  const p=Math.max(0,Math.min(1,a.prog()));
  return `<section class="card aim"><h3>${ico(a.ic)}${a.n}<small>${Math.round(p*100)}%</small></h3><p class="note" style="margin:0 0 8px">${a.d}</p><div class="pbar"><i style="width:${(p*100).toFixed(0)}%"></i></div><p class="note" style="margin-top:6px">${a.line()}</p><button class="go" data-x="${xa(aimPick)}">${ico("flag")}Change your aim</button></section>`;
}
function aimVerdict(){const a=ASP[S.asp];return a&&a.done()?[a.n,a.win]:null}
function aimEpi(){const a=ASP[S.asp];return a&&!a.done()?"You came here to be "+a.n.toLowerCase()+". You didn't get there this time.":""}

// ---- happenings ----
// One a day at most, rolled overnight. from and to: the hours it's on. at: where.
const HAP={
 party:{n:"Block party at the court",s:"5pm to 9pm · everybody's going",at:"court",from:17,to:21},
 boat:{n:"Boat show at the Lake",s:"10am to 6pm · booth work and good footage",at:"lake",from:10,to:18},
 card:{n:"Fight night's stacked",s:"the Iron Den after 9pm · purses double",at:"gym",from:21,to:24},
 check:{n:"Police checkpoints on the bridges",s:"after dark · careful what you carry",at:null,from:20,to:5},
 sale:{n:"Sal's paying top dollar",s:"Gold Line, 9am to 7pm · a quarter more for crates",at:"pawn",from:9,to:19}};
const hap=id=>S.hap&&S.hap.day===S.day&&(!id||S.hap.id===id)?HAP[S.hap.id]:null;
const hapOn=id=>{const h=hap(id);return !!h&&isOpen([h.from,h.to],S.h)};
function hapRoll(){S.hap=r()<.45?{id:pick(Object.keys(HAP)),day:S.day}:null}
// what a happening adds to a place's list of things to do
function hapActs(at,add){
  if(at==="court"&&hapOn("party"))add("Hit the block party","$10 · 3 hrs · everybody's here",S.cash>=10&&S.en>=20,()=>{
    S.cash-=10;tick(3);if(S.over)return;S.mood=cl(S.mood+22);S.en=cl(S.en-15);S.rep=cl(S.rep+3);S.food=cl(S.food+25);
    const w=present("court").filter(k=>pp(k).met&&stage(k)>=0);for(const k of w){bond(k,3);meet(k)}
    if(r()<.5)clip("party",2,"The dance-off at the block party");
    log("Speakers on a pickup bed, a grill nobody's in charge of, and a dance-off you will not be discussing."+(w.length?" "+w.map(k=>P[k].n).join(" and ")+" "+(w.length>1?"are":"is")+" there.":""))},2);
  if(at==="lake"&&hapOn("boat"))add("Work the boat show booth","4 hrs · ~$150 · good footage",S.en>=25,()=>{
    tick(4);if(S.over)return;const p=pay(130+Math.round(r()*40));S.cash+=p;S.en=cl(S.en-20);S.rep=cl(S.rep+1);xp("charm");
    clip("boat",r()<.4?3:2,"Behind the scenes at the boat show");
    log("Four hours in a booth telling dentists which three-seater to buy. "+$$(p)+", sunburn, and some decent footage.")},2);
}
// a stop is likelier at night when the checkpoints are up
const hapCops=()=>hapOn("check")?2.2:1;
// ---------- the street ----------
// Joined into city.js at //@street, so it shares the city's closure. What it adds: runs on the water with Harbor Patrol behind
// you (the racing side plays them, through HS.open with mode "run"), product to buy and move, a wanted level that sends more
// patrol skis, a lawyer, somewhere better to live, a back-room card game, a gun, and Vance, who wants the docks. Its state is S.z.
function freshZ(){return {stash:{green:0,pills:0,powder:0},sold:{d:0},habit:0,usedDay:-9,crash:0,pad:0,piece:0,drew:0,seen:0,v:0,vDay:0,vRuns:0,vStall:0,vanHit:0,hitDay:0,
  dexDead:0,ledger:0,docks:0,news:[],nightDay:0,vanceDay:0,salDay:0,strayDay:-9,lawyer:-9,det:-9,big:0,raided:0}}
const PAD=[["Studio over the laundromat",400,0,""],["One-bedroom by the court",750,1500,"A one-bedroom over the bodega. Doors that lock, a closet with a false back, a view of the court."],
  ["House on the lake",0,28000,"Two bedrooms on the water and a dock of your own. Nobody watches you launch."]];
const stars=()=>Math.ceil(S.heat/20);
const streetInc=()=>S.z.v===6?300:S.z.v===9&&S.z.docks?250:0;
const news=t=>{const n=S.z.news;if(t&&!n.includes(t)){n.push(t);if(n.length>3)n.shift()}};

// --- runs on the water ---
// How hard the law comes: more patrol skis, on better machines, the higher the wanted level. A ski they have seen counts as a
// star until it is resprayed, and a dock of your own means one fewer of them is there when you launch.
function lawFor(x){
  const s=Math.min(5,stars()+(x||0)+(S.z.seen?1:0)),w=s<=1?[1,0]:s===2?[2,0]:s===3?[2,1]:s===4?[3,2]:[4,3];
  return {cops:Math.max(1,w[0]-(S.z.pad===2?1:0)),level:w[1]};
}
let RUN=null,bjIn=0;
// o: {type:"drop" or "chase", name, site, rev, extra (stars added for this job), done(res)}. The race page takes over until it reports.
function waterRun(o){
  const w=lawFor(o.extra);if(o.decoy)w.cops=Math.max(1,w.cops-1);RUN=o;S.race={kind:"run",day:S.day};save();
  HS.open({mode:"run",run:{type:o.type,name:o.name,site:o.site,rev:!!o.rev,laps:1,cops:w.cops,level:w.level,pace:.3+.15*w.level},turn:1+.008*lvl("drive"),top:S.en<40?.98:1,done:runDone,exit:cityBack});
  host.hidden=true;
}
function runDone(res){
  const o=RUN;RUN=null;S.race=null;tick(2);if(S.over)return;
  S.en=cl(S.en-20);xp("drive",res.ok?2:1);if(res.hits||!res.ok)S.z.seen=1;
  if(o)o.done(res);
}
function busted(why){
  S.cash=Math.max(0,S.cash-300);
  log("Harbor Patrol has you face down on their swim deck. $300 to get the ski out of impound."+(why?" "+why:""));
  news("Harbor Patrol made an arrest on the water last night after a chase. A jet ski was impounded.");jail();
}
function pickupHow(){
  modal("Dex's package","\"Across town. Four hundred. Don't open it, don't get pulled over.\" By road it's a coin flip who's watching. By water it's you, the river, and whoever Harbor Patrol has out"+(stars()>=3?", and at "+stars()+" stars that's a few of them":"")+".",[
   ["Drive it across town · 2 hrs",pickup],
   ["Run it up the river on the ski · you ride it",()=>waterRun({type:"drop",name:"Dex's package",site:"river",done:pkgDone}),S.en<15],
   ["Not today",0]]);
}
function pkgDone(res){
  S.pk++;
  if(res.ok){
    const good=res.cargo>=60,p=Math.round(400*Math.max(.4,res.cargo/100)/10)*10+(res.cargo>=95?150:0);
    S.cash+=p;bond("dex",good?6:2);trust("dex",good?4:-2);rem("dex",good?"Ran his package up the river":"Delivered his package soaked");
    if(res.hits)news("Harbor Patrol chased a jet ski up the river last night and lost it under the Fourth Street bridge.");
    crime(res.hits?10:5);
    modal("Delivered",(res.cargo>=95?"Dry, sealed, on time. The buyer counts out the four hundred and Dex adds a hundred and fifty on top. \"Nobody's ever brought one in clean by water.\"":good?"The box has a wet corner and a dent. The buyer pays, minus a conversation.":"What's left of the package rattles. The buyer pays for what's left. Dex is going to hear about it.")+" You clear "+$$(p)+".",[["OK",0]]);
  }else if(res.how==="quit"){
    scar("dex",12,5);rem("dex","Dumped his package in the river");crime(6);
    modal("In the river","You cut the bungee and let the river have it. Nobody can charge you with a box they can't find. Dex can't sell one either.",[["Swim home",0]]);
  }else{scar("dex",12,5);rem("dex","Lost his package to the Harbor Patrol");busted()}
}
function getaway(site){
  waterRun({type:"chase",name:"Getaway",site,done:res=>{
    if(!res.ok){if(!S.kowGone)rem("kow","Harbor Patrol fished you out");return busted()}
    const clean=res.how==="lost";S.rep=cl(S.rep+(clean?6:3));
    if(!S.kowGone){trust("kow",-8);rem("kow","You outran the Harbor Patrol")}
    if(clean){S.heat=cl(S.heat-8);S.z.seen=0}else crime(8);
    clip("chase",5,clean?"Lost Harbor Patrol up the river":"Outran Harbor Patrol to the slip",12);
    news("A jet ski outran Harbor Patrol "+(site==="havasu"?"across the lake":"up the river")+" last night. Police are asking for video.");
    modal(clean?"Clean away":"Got away",clean?"You kill the engine under the rail bridge and drift. Sirens go past, then further past, then nothing. You sit in the dark laughing like an idiot.":"You run it up the slip with the lights still behind you and you're over the fence before they tie off. They didn't get you. They got a good look at the ski.",[["Breathe",0]]);
  }});
}
function nightRun(boss){
  const v=boss==="vance",site=["bayou","stormhead","lagoon"][S.day%3],pay=v?1800:900+(stage("dex")>=3?300:0);
  waterRun({type:"drop",name:v?"Vance's load":"Night run",site,rev:S.day%2===1,extra:1,done:res=>{
    S.z[v?"vanceDay":"nightDay"]=S.day;
    if(res.ok){
      const p=Math.round(pay*Math.max(.3,res.cargo/100)/10)*10;S.cash+=p;S.rep=cl(S.rep+3);
      if(v){S.z.vRuns++;if(!S.z.dexDead){bond("dex",-6);rem("dex","Heard you're riding for Vance")}}else{bond("dex",5);trust("dex",3);rem("dex","Brought a load in off the boat");did("nightrun")}
      crime(res.hits?16:9);
      modal("Load's in",(v?"A man with a clipboard and no expression checks the seals in the cold storage on Pier 4. ":"Dex is waiting on the mud with a hand truck and the lights off. ")+(res.cargo>=95?"Every seal intact. ":res.cargo>=60?"A couple of cases took water. ":"Half of it's on the bottom. ")+$$(p)+" in an envelope.",[["OK",0]]);
    }else if(res.how==="quit"){
      if(v){S.z.vStall++;log("You dumped Vance's load. He doesn't yell. He writes something down.")}else{scar("dex",10,4);log("You dumped the load in the dark. Dex takes it better than you expected, which is to say badly.")}
      crime(6);
    }else{if(!v)scar("dex",8,4);busted(v?"Nobody from Pier 4 comes to bail you out.":"")}
  }});
}

// --- product ---
// Three things to buy from Dex and sell where people are having a good time. Prices move every day and each spot only wants so much.
// b: base price a unit. h: heat a unit.
const GOODS={green:{n:"Green",u:"bag",b:40,h:.5},pills:{n:"Pills",u:"strip",b:110,h:.9},powder:{n:"Powder",u:"gram",b:320,h:1.5}};
const SPOTS={bar:["the back hallway of the Low End",1.15],court:["the far baseline",.92],lake:["the pits",1.25],gym:["the alley behind the Iron Den",1],docks:["the container rows",.8]};
const hs2=(a,b)=>{const x=Math.sin(a*127.1+b*311.7)*43758.5453;return x-Math.floor(x)};
const held=()=>S.z.stash.green+S.z.stash.pills+S.z.stash.powder,room=()=>(S.car?30:12)+(S.home.safe?10:0)+(S.z.pad?10:0)-held();
const buyPx=k=>Math.round(GOODS[k].b*(.5+.3*hs2(S.day,k.length))*(stage("dex")>=3?.9:1)/5)*5;
function sellPx(k,at){const I=HS.info(),rd=at==="lake"&&I.round<I.total&&S.day===motoDay(I.round);return Math.round(GOODS[k].b*SPOTS[at][1]*(.9+.5*hs2(S.day*3+at.length,k.length*7))*(rd?1.5:1)*(1+.04*lvl("charm"))/5)*5}
const want=at=>{if(S.z.sold.d!==S.day)S.z.sold={d:S.day};return 5+Math.floor(5*hs2(S.day,at.length*13))-(S.z.sold[at]||0)};
const units=(n,k)=>n+" "+GOODS[k].u+(n>1?"s":"");
function product(){
  const D=pp("dex"),ch=[],ok=k=>k==="green"||k==="pills"&&D.t>=45||k==="powder"&&stage("dex")>=2&&S.rep>=15;
  for(const k in GOODS){const g=GOODS[k],p=buyPx(k);if(!ok(k))continue;
    for(const n of [1,5])ch.push([g.n+": "+units(n,k)+" · "+$$(p*n),()=>{S.cash-=p*n;S.z.stash[k]+=n;bond("dex",.4*n);log("Dex palms you "+units(n,k)+" of "+g.n.toLowerCase()+" in a seed bag. "+$$(p*n)+".");crime(Math.ceil(n*g.h));if(!S.over)product()},S.cash<p*n||room()<n])}
  ch.push(["That's enough",0]);
  modal("Product","\"Crates are for civilians.\" Dex doesn't look up. \"This moves faster. Buy here, sell where people are having a good time. Prices change every day. Don't carry more than you can swallow.\" "+(ok("powder")?"":ok("pills")?"He won't front you powder yet. ":"He's only offering green until he trusts you. ")+"You're holding "+held()+", with room for "+Math.max(0,room())+" more.",ch);
}
function sell(at){
  const w=want(at),ch=[];
  for(const k in GOODS){const n=Math.min(S.z.stash[k],Math.max(0,w));if(n<1)continue;const p=sellPx(k,at);ch.push(["Sell "+units(n,k)+" of "+GOODS[k].n.toLowerCase()+" · "+$$(p)+" each",()=>sold(at,k,n,p)])}
  ch.push(["Keep it in your pocket",0]);
  modal("Moving product","You post up in "+SPOTS[at][0]+". "+(w>=7?"It's a thirsty crowd today.":w>=4?"There's some interest.":w>0?"Slow day. A couple of takers.":"Nobody's buying. You've sold this spot out for today."),ch);
}
function sold(at,k,n,p){
  const w=WHO[at];
  S.z.stash[k]-=n;S.z.sold[at]=(S.z.sold[at]||0)+n;S.cash+=n*p;tick(1);if(n>=4)S.rep=cl(S.rep+1);
  log("You move "+units(n,k)+" of "+GOODS[k].n.toLowerCase()+" in "+SPOTS[at][0]+" for "+$$(n*p)+".");
  if(w&&STRAIGHT.includes(w)&&pp(w).met&&!(w==="nia"&&S.q.nia===2)&&r()<.3){
    scar(w,14,6);bond(w,-6);rem(w,"Caught you dealing "+(at==="gym"?"behind her gym":"in her bar"));
    log(P[w].n+" sees the hand-off. "+(w==="june"?"\"Kids train here.\" She says it very quietly.":pp("nia").know>=2?"\"My brother's doing eighteen months for less than what's in your pocket.\" She goes to the other end of the bar and stays there.":"She doesn't say anything. She just wipes down the bar where you were sitting."));
  }
  if(S.z.v>=1&&S.z.v<=5&&at!=="bar"&&r()<.2)pq("corner");
  crime(Math.ceil(n*GOODS[k].h)+2);copRoll(.8);
}
function useStash(){
  const st=S.z.stash,ch=[],use=(k,f)=>()=>{st[k]--;S.z.usedDay=S.day;f()};
  if(st.green)ch.push(["Smoke a little green · 2 hrs",use("green",()=>{S.mood=cl(S.mood+18);S.food=cl(S.food-12);S.z.habit+=.5;tick(2);log("The radiator stops being annoying and starts being percussion. You eat cereal out of the box.")})]);
  if(st.pills)ch.push(["Take a pill",use("pills",()=>{S.en=cl(S.en+30);S.mood=cl(S.mood+5);S.z.habit+=1;log("Twenty minutes later nothing hurts, including the things that should.")})]);
  if(st.powder)ch.push(["Do a line",use("powder",()=>{S.en=cl(S.en+45);S.mood=cl(S.mood+12);S.z.habit+=2;S.z.crash=1;log("Everything gets very clear and very fast and you have several excellent ideas. Tomorrow will want a word.")})]);
  ch.push(["Leave it alone",0]);
  modal("The stash","It's sitting right there. It would take the edge off."+(S.z.habit>=6?" You've been taking the edge off a lot.":""),ch);
}
// a stop by the law with product or the piece on you. True when it has dealt with the stop.
function searched(){
  const n=held(),z=S.z,g=S.kowGone;if(!n&&!z.piece)return 0;
  z.stash={green:0,pills:0,powder:0};
  if(z.piece){z.piece=0;log("He finds the snub-nose before he finds anything else. The cuffs are on before you finish the sentence.");crime(20);if(!g){scar("kow",15,8);rem("kow","Found a gun on you")}jail();return 1}
  if(n>=8){log("He finds "+n+" of whatever you want to call it. That isn't personal use and you both know it.");crime(15);if(!g)rem("kow","Found weight on you");jail();return 1}
  S.cash=Math.max(0,S.cash-200);if(!g){trust("kow",-5);rem("kow","Found product on you")}
  log("He finds what's in your sock, pours it down a storm drain and writes you a $200 ticket for something else. \"That's the last favor.\"");crime(8);return 1;
}
function streetJail(){const z=S.z;z.stash={green:0,pills:0,powder:0};z.piece=0}
// The first time the heat boils over they come through the door, and it costs a week, half the money and everything on you.
// There is one deal. The second raid is the end (hot() in city.js).
let RAIDED=0;
function raid(){
  const t=take(.5),z=S.z;z.raided=1;S.crates=0;S.chop=0;S.bag=0;streetJail();S.heat=30;
  for(const k of STRAIGHT)if(pp(k).met&&!(k==="nia"&&S.q.nia===2)){trust(k,-10);rem(k,"Watched them walk you out in cuffs at 6 a.m.")}
  for(let i=0;i<7&&!S.over;i++){S.day++;newDay()}
  RAIDED=1;if(S.over)return;
  dawn();S.h=9;S.at="home";
  news("Police say a dawn raid on an apartment over a laundromat ended a months-long investigation. One arrest.");
  log("Raided. Seven days in county and "+$$(t)+" gone. Pike got you probation. There won't be a second deal.");
  modal("6 a.m.","They come through the door before the radiator wakes up. Everything you were holding is evidence now. Seven days in county, a judge who has heard it all, and Dolores Pike trading half your money for the word probation. \"That was the one,\" she says on the courthouse steps. \"There isn't another.\"",[["Walk out",0]]);
}

// --- the law, the lawyer, the morning radio ---
function phoneMore(){
  const c=250*Math.max(1,stars());
  return S.heat>=20?[["Call Dolores Pike, attorney · "+$$(c),()=>{S.cash-=c;S.z.lawyer=S.day;S.heat=cl(S.heat-20);log("Pike makes two calls and a paralegal loses a file. \"You're a hobby of theirs now, not a case. Keep it that way.\" Heat −20.")},S.cash<c||S.day-S.z.lawyer<3]]:[];
}
function streetMorning(){
  const z=S.z;
  if(z.news.length)log("Radio: "+z.news.shift());
  if(z.crash){z.crash=0;S.en=cl(S.en-25);S.mood=cl(S.mood-15);log("Last night's powder sends the bill. Your skull feels two sizes too small.")}
  else if(z.habit>=6&&z.usedDay<S.day-1){S.mood=cl(S.mood-10);log("Your hands want something your wallet shouldn't buy. It's a long morning.")}
}
function streetDay(){
  const z=S.z,D=pp("dex");
  if(z.habit>0&&z.usedDay<S.day-1)z.habit=Math.max(0,z.habit-.5);
  if(z.v===6){S.heat=cl(S.heat+4);S.crime=1}       // Vance's lieutenant: a cut of the docks, and the heat that comes with it
  if(!z.v&&S.day>=8&&D.met&&!z.dexDead){z.v=1;z.vDay=S.day;pq("v1")}
  else if(z.v===1&&S.day>=z.vDay+3)pq("v2");
  else if(z.v===2&&z.vStall>=2){z.v=4;z.vanHit=S.day+1;z.hitDay=S.day;log("Word comes back from Pier 4: Vance has decided you're unreliable. He has a policy for unreliable.")}
  else if(z.v===2&&z.vRuns>=2&&S.day>=z.vDay+2)pq("v3");
  else if(z.v===3&&S.day>=z.vDay+5)pq("v3b");
  if(z.v===4&&z.vanHit&&S.day>=z.vanHit){z.vanHit=0;pq("vHit")}
  if((z.v===1||z.v===3||z.v===5)&&S.day>=30&&!z.dexDead)pq("vEnd");
  if(S.heat>=60&&S.day-z.det>=4&&r()<.3){z.det=S.day;pq("dets")}
}

// --- somewhere better to live ---
function movePad(){
  const n=S.z.pad+1,p=PAD[n];
  modal("Move somewhere better",n===1?"A one-bedroom over the bodega, across from the court. Doors that lock. A closet you could hide things in. $1,500 to move in, then $750 a week.":"Two bedrooms on the water with its own dock. No landlord, no neighbors, nobody watching you launch at night. $28,000, cash, and Sal knows a guy who won't ask where it came from.",[
   [(n===1?"Sign the lease · ":"Buy it · ")+$$(p[2]),()=>{S.cash-=p[2];S.z.pad=n;S.mood=cl(S.mood+20);S.missed=0;
     for(const k of["nia","june"])if(pp(k).rom>=2&&pp(k).rom<4)bond(k,5);
     log(n===1?"You carry everything you own up one flight in two trips. It echoes. You love it.":"You sit on your own dock with your feet in the water until the sun's gone. Nobody can tape a notice to this door.")},S.cash<p[2]],
   ["Not yet",0]]);
}

// --- work from Sal ---
function salWork(){
  S.z.salDay=S.day;meet("sal");
  if((S.gar||S.day%2===0)&&S.pk>=1)return modal("Sal","\"Guy who owes me keeps a brand-new supercharged three-seater on a lift at the marina. I don't want his money anymore. I want him to walk out on his dock and feel something.\" He slides a bolt cutter across the counter. \"Twelve hundred when it's in "+(S.gar?"your bay three":"my nephew's storage unit")+". Harbor Patrol watches that marina.\"",[
    ["Cut it loose and ride it out · you ride it",()=>waterRun({type:"drop",name:"The marina job",site:"lagoon",extra:1,done:res=>{
      if(res.ok){
        const p=Math.round(1200*Math.max(.4,res.cargo/100)/10)*10;S.cash+=p;bond("sal",5);trust("sal",4);S.rep=cl(S.rep+4);rem("sal","Stole a ski off a lift for him");
        news("A jet ski was cut from its lift at Harbor Point Marina overnight. The owner is offering a reward.");crime(14);
        modal("The marina job",(res.cargo>=90?"Not a scratch on it. ":"It's got some new scars. ")+"Sal counts out "+$$(p)+" and looks happier than money usually makes him. \"He called me this morning. Crying. I said, that's terrible.\"",[["OK",0]]);
      }else if(res.how==="quit"){bond("sal",-3);crime(6);log("You bail off the stolen ski and let it idle into the mangroves. Sal: \"So he gets it back. Wonderful.\"")}
      else{trust("sal",-4);busted("Grand theft, watercraft.")}
    }}),S.en<20],
    ["\"Find somebody else.\"",()=>bond("sal",-1)]]);
  const who=pick(["A bookie on Delancey","A roofer with a gambling thing","A guy who sells hot tubs","A dentist, believe it or not"]),c=lvl("charm"),f=lvl("fight");
  modal("Sal","\"Collections. "+who+", eleven hundred, five weeks late. Three hundred for you if he pays. I don't need to know how.\"",[
   ["Talk him into it · Charm "+c,()=>{tick(2);xp("charm");if(r()<.4+.11*c){S.cash+=300;bond("sal",3);trust("sal",3);log("You explain compound interest and what Sal's nephew does for fun. He pays in twenties. +$300.")}else{bond("sal",-1);log("He cries, then he lies, then he's gone out the back. Sal: \"So you had a nice chat.\"")}}],
   ["Lean on him · Fighting "+f,()=>{tick(2);xp("fight");if(r()<.45+.11*f){S.cash+=300;S.rep=cl(S.rep+2);bond("sal",4);trust("sal",3);log("One hand on his collar, one on the edge of his desk. He finds the money fast. +$300.");crime(8)}else{S.en=cl(S.en-25);log("He's bigger than Sal said and he played college ball. You leave with a ringing ear and no money.");crime(4)}}],
   ["\"Not today.\"",0]]);
}

// --- the Low End after dark ---
function bjTable(){
  modal("The back room","Green felt stapled to a door on sawhorses, and a dealer named Carol who has never once smiled. Dealer stands on 17, blackjack pays three to two, and nobody saw anybody here.",
    [25,100,500].map(b=>["Bet "+$$(b),()=>bjHand(b),S.cash<b]).concat([["Walk away",bjOut]]));
}
function bjOut(){if(S.cash!==bjIn)log("You leave the back room "+(S.cash>bjIn?"up "+$$(S.cash-bjIn):"down "+$$(bjIn-S.cash))+".")}
function bjHand(bet){
  const card=()=>Math.min(10,Math.floor(r()*13)+1),tot=h=>{const t=h.reduce((a,b)=>a+b,0);return h.includes(1)&&t<=11?t+10:t},sh=h=>h.map(v=>v===1?"A":v).join(" · ");
  const me=[card(),card()],dl=[card(),card()];let stake=bet;S.cash-=bet;
  const fin=()=>{
    const a=tot(me);if(a<=21)while(tot(dl)<17)dl.push(card());
    const b=tot(dl),nat=a===21&&me.length===2&&!(b===21&&dl.length===2),w=a>21?-1:nat||b>21||a>b?1:a===b?0:-1,win=w>0?Math.round(stake*(nat?2.5:2)):w===0?stake:0;
    S.cash+=win;S.mood=cl(S.mood+(w>0?4:w<0?-3:0));
    modal(w>0?(nat?"Blackjack":"You win"):w===0?"Push":a>21?"Bust":"House wins","You: "+sh(me)+" ("+a+"). Carol: "+sh(dl)+" ("+b+"). "+(w>0?"She pushes "+$$(win)+" across without looking up.":w===0?"She slides your "+$$(stake)+" back.":"She takes your "+$$(stake)+" like it was always hers."),[["Another hand",bjTable,S.cash<25],["Cash out",bjOut]]);
  };
  const turn=()=>{
    if(tot(me)>=21)return fin();
    modal("Blackjack · "+$$(stake)+" on it","You: "+sh(me)+" ("+tot(me)+"). Carol shows "+(dl[0]===1?"A":dl[0])+".",[["Hit",()=>{me.push(card());turn()}],["Stand",fin],["Double down",()=>{S.cash-=bet;stake+=bet;me.push(card());fin()},me.length>2||S.cash<bet]]);
  };
  turn();
}
function robGame(){
  modal("The back room","Carol's dealing. Eleven men, maybe four grand on the felt, and a guy on the door who's mostly decorative. This is Nia's bar. Everybody in that room knows your face.",[
   ["Mask up and do it",()=>{
     const N=pp("nia");tick(1);
     if(r()<.55+.08*lvl("fight")){const t=1800+Math.round(r()*14)*100;S.cash+=t;S.rep=cl(S.rep+8);log("\"Hands on the felt.\" Nobody's a hero over cards. You back out the fire door with "+$$(t)+" in a bar towel.");crime(30)}
     else{S.en=cl(S.en-40);S.z.piece=0;log("The decorative guy on the door isn't. You come to in the alley without the piece, the mask, or one of your teeth.");crime(15)}
     if(N.met){scar("nia",30,20);bond("nia",-15);rem("nia","Somebody robbed the game in her bar. She knows your walk.");gossip("nia",-8,"the back-room game got robbed and it was you")}
     news("Police say a card game was robbed at gunpoint in a bar on Low Street. Nobody present would describe the gunman.")}],
   ["Think better of it",0]]);
}
function stranger(){
  const w=pick([["a welder with a laugh you can hear from across the room","a third-floor walk-up with a welding mask on the coat hook"],["a touring drummer who's gone tomorrow","a motel room with a kick drum in the bathtub"],["a paralegal who rides a motorcycle and doesn't ask what you do","a loft with one chair and four hundred books"]]);
  modal("Last call","Two a.m. logic. You've been talking to "+w[0]+" for three rounds and neither of you has looked at the door.",[
   ["Leave together",()=>{
     S.z.strayDay=S.day;S.cash=Math.max(0,S.cash-20);S.mood=cl(S.mood+25);tick(7,1);S.en=cl(S.en-10);
     log("The cab ride is short. You wake up in "+w[1]+", coffee already going, no last names exchanged. Nobody's sorry.");
     for(const k of["nia","june"])if((pp(k).rom===2||pp(k).rom===3)&&r()<(k==="nia"?.5:.3)){scar(k,25,15);bond(k,-15);rem(k,"Heard who you left the bar with");pq("strayed:"+k)}}],
   ["Call it a night",()=>{S.mood=cl(S.mood+3);log("You tip well and walk home alone, which is its own kind of smart.")}]]);
}
// Showing the gun ends most arguments. Now and then it goes off.
function drew(txt,after){
  S.z.drew++;
  if(r()<.15){log(txt+" Then your hand does something on its own and the shot takes out a window. Everybody runs, including you.");news("Shots fired on Low Street overnight. No injuries reported. Police are canvassing.");for(const k of STRAIGHT)if(pp(k).met)trust(k,-6);crime(35)}
  else{log(txt);crime(12)}
  if(after&&!S.over)after();
}

// --- Vance ---
// S.z.v: 0 not begun, 1 Dex has warned you, 2 riding for Vance, 3 you turned him down, 4 at war, 5 you stayed out of it,
// 6 you gave him Dex and hold the docks for him, 7 Dex died without you, 9 Vance is gone.
function noDex(){
  tick(1);
  if(S.z.v===6)return modal("The back booth","Nobody sits in Dex's booth. His crates come to you now, at cost, off the back of a Pier 4 truck.",[["Take a crate ($90)",()=>buyCrate(90),S.cash<90||S.crates>=3],["Leave",0]]);
  modal("The back booth","Nobody sits in Dex's booth. There's a bag of sunflower seeds on the table that nobody will throw away.",[["Leave",0]]);
}
function pier4(){
  const z=S.z,K=pp("kow"),allies=["marcus","sal","june"].filter(k=>pp(k).met&&stage(k)>=2),nm=allies.map(k=>P[k].n).join(" and ");
  if(!z.ledger)return modal("Pier 4","Dex has the layout on a napkin. \"Office is up the stairs at the back of the cold storage. The ledger's a green hardback. He's old-fashioned. One man on the door at night. You come and go by water or you don't go.\"",[
    ["Go in for the ledger · you ride it out",()=>{
      tick(1);
      if(r()<.45+.1*Math.max(lvl("charm"),lvl("fight"))+(z.piece?.1:0))waterRun({type:"chase",name:"The ledger",site:"stormhead",extra:1,done:res=>{
        if(res.ok){z.ledger=1;S.rep=cl(S.rep+5);crime(12);modal("The ledger","Green hardback, like he said. Dates, weights, and a column of payments to a Sgt. Brandt, Harbor Patrol. Dex turns the pages like scripture. \"Now we decide who reads it.\"",[["OK",0]])}
        else if(res.how==="quit"){z.hitDay=S.day+2;log("You give it up in open water and the ledger goes down with your nerve. The man on the door will be two men now.")}
        else{z.hitDay=S.day+3;busted("The sergeant who books you looks at the ledger for a long time before it goes missing.")}
      }});
      else{const t=take(.15);z.hitDay=S.day+2;S.en=cl(S.en-30);log("The man on the door isn't alone. You go back in the water without the ledger, "+$$(t)+" lighter, ears ringing.");crime(10)}
    },S.en<25],
    ["Not tonight",0]]);
  modal("Pier 4","You have the ledger. "+(nm?nm+" will stand with you if you ask. ":"Nobody's standing with you on this one. ")+"How does Vance leave town?",[
   [S.kowGone?"Take it to the cops (Reyes won't see you)":K.t<50?"Take it to Kowalski (he doesn't trust you enough)":"Hand the ledger to Kowalski",()=>{
     z.v=9;z.docks=0;S.heat=cl(S.heat-30);bond("kow",15);trust("kow",15);S.rep=cl(S.rep-6);bond("dex",6);rem("kow","You handed him Vance and a dirty sergeant");
     news("Federal agents raided a cold-storage facility on Pier 4 this morning. A Harbor Patrol sergeant has been placed on leave.");
     modal("By the book","Kowalski reads three pages standing up and then sits down. \"Brandt. Son of a bitch.\" The raid's on the radio by Thursday. Vance is in a federal van, and the street has decided you talk to cops, because you do. Dex keeps his booth.",[["OK",0]])},S.kowGone||K.t<50],
   ["Burn the cold storage"+(nm?" with "+nm:" alone"),()=>{
     tick(3);xp("fight",2);
     if(r()<.3+.1*lvl("fight")+.14*allies.length+(z.piece?.1:0)){
       z.v=9;z.docks=1;S.rep=cl(S.rep+20);bond("dex",20);trust("dex",12);for(const k of allies){bond(k,8);rem(k,"Stood with you on Pier 4")}rem("dex","You ran Vance out of town");
       news("Fire crews fought a three-alarm fire at a cold-storage warehouse on Pier 4 overnight. The owner could not be reached.");crime(35);
       modal("Pier 4","It goes up faster than anybody planned. Vance's people come out coughing with their hands open and "+(allies.includes("marcus")?"Marcus's crew is":"you are")+" waiting on the pier. Vance himself is already on the highway, in the good coat. Dex watches it burn with his glasses reflecting orange. \"Docks are ours. You're in for a cut.\"",[["Watch it burn",0]]);
     }else{const t=take(.3);z.hitDay=S.day+3;S.en=cl(S.en-50);S.mood=cl(S.mood-20);for(const k of allies)bond(k,-4);log("They were waiting. Somebody talked. You get out through the water "+$$(t)+" lighter with a burn up one arm. Vance is still on Pier 4.");crime(20)}}],
   ["Not tonight",0]]);
}
Object.assign(EV,{
 v1(){modal("Dex","Dex has stopped shelling seeds, which is how you know. \"Guy named Vance bought the cold storage on Pier 4. From up the coast. Pays cash, brings his own people, and his own people carry.\" He folds the paper wrong. \"He does his business Tuesdays. So I don't.\"",[["\"What does he want?\"",()=>log("Dex: \"What does anybody want. All of it.\"")]])},
 v2(){if(S.z.v!==1)return;S.z.vDay=S.day;modal("Unknown number","\"You ride for the seed-eater. I've watched you do it. I pay double and I don't make you hold bags under your sink. Pier 4, after dark. V\"",[
   ["\"What's the job?\"",()=>{S.z.v=2;log("Vance: \"Loads off a boat. Same as you do now, for a man who can afford you.\" The docks have a second employer.")}],
   ["\"I ride for Dex.\"",()=>{S.z.v=3;bond("dex",8);trust("dex",8);rem("dex","Vance came for you and you said no");log("No reply. Dex hears about it by lunch and buys you a coffee, which for Dex is a parade.")}],
   ["Show Dex the text",()=>{S.z.v=3;S.cash+=200;bond("dex",10);trust("dex",12);rem("dex","Showed him Vance's text");log("Dex reads it twice and hands your phone back with $200 under it. \"Now I know he's hiring. That's worth something.\"")},pp("dex").t<20],
   ["Leave him on read",()=>{S.z.v=3;log("You don't answer. The typing dots appear once, and stop.")}]])},
 v3(){if(S.z.v!==2||S.z.dexDead)return;modal("Vance","The cold storage is exactly as cold as it sounds. Vance is smaller than you pictured, in a good coat, eating an orange. \"You're careful. I like careful. Dex isn't careful. Dex is a habit this city has.\" He offers you a segment. \"Tuesday night. Tell him you've got a buyer who'll only meet on the pier. Ten thousand, and what he was doing becomes what you're doing.\"",[
   ["Walk Dex onto the pier",()=>{
     const z=S.z;z.v=6;z.dexDead=1;S.cash+=10000;S.rep=cl(S.rep+12);S.mood=cl(S.mood-25);S.bag=0;S.revenge=0;
     if(!S.kowGone){scar("kow",25,15);rem("kow","His best source walked onto Pier 4 with you and didn't walk off")}
     for(const k of["nia","sal","marcus"])if(pp(k).met){trust(k,-10);rem(k,"Dex kept that booth for years. Then he met you.")}
     news("A man's body was recovered from the water off Pier 4 this morning. Police have not released a name.");crime(25);
     modal("Tuesday","Dex comes because you asked him to. He's wearing the reading glasses. He looks at the men, then at you, and he doesn't look surprised. He looks tired. \"Nineteen years I drove a bus,\" he says. \"Never once hit anybody.\" You're back at the truck before the sound carries. The envelope is thick. His daughter in Phoenix still thinks he sold restaurant equipment.",[["Drive",0]])}],
   ["Warn Dex",()=>{const z=S.z;z.v=4;z.vanHit=S.day+2;z.hitDay=S.day+1;bond("dex",15);trust("dex",18);rem("dex","Vance paid you to walk him onto the pier. You told him instead.");gossip("dex",8,"Vance tried to buy you and you warned Dex");log("You tell Dex all of it. He takes his glasses off and cleans them for a long time. \"Then it's him or us. I'd rather it was him.\"")}],
   ["\"Let me think about it.\"",()=>{S.z.vStall++;S.z.vDay=S.day;log("Vance finishes the orange. \"Think fast. Tuesday comes every week.\"")}]])},
 v3b(){if(S.z.v!==3||S.z.dexDead)return;modal("Dex","Dex finds you. He doesn't find people. \"He's got men on my containers and a Harbor Patrol sergeant eating out of his hand. I'm getting squeezed out of a business I started with a bus pass.\" He looks old. \"There's a ledger in the office on Pier 4. Names, payments, the sergeant. Help me end this.\"",[
   ["\"I'm in.\"",()=>{const z=S.z;z.v=4;z.hitDay=S.day;bond("dex",10);trust("dex",10);rem("dex","Asked for help against Vance and got it");log("\"Find me at the docks.\" He almost smiles. \"Bring whoever still likes you.\"")}],
   ["\"Not my fight.\"",()=>{S.z.v=5;bond("dex",-8);trust("dex",-6);rem("dex","Asked for help against Vance and got nothing");log("Dex nods like he's adding it up. \"No. I guess it isn't.\"")}]])},
 vEnd(){const z=S.z;if(z.dexDead||z.v===4||z.v===9)return;z.dexDead=1;z.v=7;S.bag=0;S.revenge=0;S.mood=cl(S.mood-15);
   news("A man's body was recovered from the water off Pier 4 this morning. Police have not released a name.");
   if(pp("nia").met)rem("nia","Dex is dead. She keeps his booth empty.");
   modal("Pier 4","They pull Dex out of the harbor on a Wednesday, reading glasses still in his shirt pocket. The back booth at the Low End stays empty and nobody sits in it. Vance's people run the containers now, and they don't sell to you. You knew it was coming. Maybe you could have done something. Maybe.",[["Damn",0]])},
 vHit(){modal("A van","A white van with no plates has been outside your place since before you woke up. Two men get out when you do. One of them is holding a framing hammer like he's on his way to work.",[
   ["Swing first · Fighting "+lvl("fight"),()=>{xp("fight",2);if(r()<.25+.12*lvl("fight")){S.rep=cl(S.rep+8);log("It's fast and ugly and it ends with the hammer in the storm drain and the van leaving without one of its mirrors.")}else{const t=take(.3);S.en=cl(S.en-45);S.mood=cl(S.mood-15);log("You get the first one. The second one has the hammer. You wake up short "+$$(t)+" with a hand that doesn't close right.")}}],
   [S.z.piece?"Show them the piece":"Show them the piece (you don't own one)",()=>drew("The one with the hammer does the math and gets back in the van."),!S.z.piece],
   ["Run",()=>{if(r()<.5+.08*lvl("drive"))log("Over the fence, through the laundromat, out the back. You hear the van idle for an hour.");else{const t=take(.2);S.en=cl(S.en-30);log("They're faster than they look. "+$$(t)+" lighter and a cracked rib.")}}]])},
 corner(){modal("Wrong corner","Three kids in new sneakers box you in. \"This is a Pier 4 corner now. You sell here, you pay here.\" The one talking can't be twenty.",[
   ["Pay the tax ($150)",()=>{S.cash-=150;log("You pay. They let you go like they're doing you a favor.")},S.cash<150],
   ["Tell them who you are",()=>{if(S.rep>=30||S.z.v===2){S.rep=cl(S.rep+2);log("They've heard the name. They back up a step. \"Our mistake.\"")}else{const t=take(.15);S.en=cl(S.en-20);log("They haven't heard of you. They take "+$$(t)+" to remember you by.")}}],
   ["Swing · Fighting "+lvl("fight"),()=>{xp("fight");if(r()<.3+.13*lvl("fight")){S.rep=cl(S.rep+5);log("The talker goes down and the other two discover somewhere else to be.");crime(6)}else{const t=take(.2);S.en=cl(S.en-30);log("Three on one goes how three on one goes. You're out "+$$(t)+".")}}]])},
 dets(){const c=lvl("charm");modal("Two detectives","A knock at eight a.m. that isn't your landlord. Two detectives, one coffee each, none for you. \"Just a conversation. You can have it here or downtown.\"",[
   ["\"Talk to my lawyer.\" · $400",()=>{S.cash-=400;S.heat=cl(S.heat-10);log("Dolores Pike arrives in eleven minutes, still chewing. The conversation ends. Heat −10.")},S.cash<400],
   ["Talk your way through it · Charm "+c,()=>{xp("charm");if(r()<.35+.12*c){S.heat=cl(S.heat-15);log("You give them forty minutes of nothing, warmly. They leave thinking you're an idiot. Perfect.")}else{const k=pick(STREETP.filter(k=>pp(k).met&&!gone(k)));if(k){trust(k,-8);rem(k,"Your name and theirs came up in the same interview")}log("You talk too much. Somewhere in there you said a name you shouldn't have.");crime(10)}}],
   ["Go out the window",()=>{if(r()<.4+.08*lvl("drive")){S.rep=cl(S.rep+3);log("Fire escape, dumpster, alley. You hear one of them say \"Really?\"");crime(10)}else jail()}]])},
 strayed(k){const p=pp(k);if(p.rom!==2&&p.rom!==3)return;modal(P[k].n,k==="nia"?"\"I pour the drinks in that bar. I watched you leave.\" She isn't crying. She's past that already.":"\"Somebody at the Low End saw you leave with a stranger.\" June's taping her own hands. \"I don't ask twice. Is it true?\"",[
   ["Tell the truth",()=>{trust(k,6);log(P[k].n+": \"At least you didn't lie.\" That's all you get. It's more than you earned.")}],
   ["Deny it",()=>{if(r()<.35)return log(P[k].n+" lets it go. For now.");p.rom=4;scar(k,20,15);bond(k,-20);if(k==="nia"&&(S.q.nia===3||S.q.nia===1))S.q.nia=0;log(P[k].n+": \"So you'll lie to my face too.\" That's the end of that.")}]])}});
// With the piece on you, being cornered has one more answer.
{const j0=EV.jumped,d0=EV.dexRevenge;
 EV.jumped=()=>{if(!S.z.piece)return j0();modal("Jumped","Marcus's crew catches you behind the pawn shop. Four of them, one of you, and Sal's snub-nose in your waistband.",[
   ["Show them the piece",()=>drew("They look at it, then at each other, then at the long walk back to the truck. Nobody says anything clever.",()=>{S.rep=cl(S.rep+6);scar("marcus",12,6);rem("marcus","You pulled a gun on his crew")})],["Leave it where it is",j0]])};
 EV.dexRevenge=()=>{if(S.z.dexDead||!S.revenge)return;if(!S.z.piece)return d0();modal("Company","Two men you've never seen are sitting on your bed. One of them is holding your toothbrush. Neither of them has seen what's in your waistband.",[
   ["Come in with the piece up",()=>{S.revenge=0;drew("They put the toothbrush down very slowly and leave by the door they came in.",()=>{scar("dex",15,8);rem("dex","You pulled a gun on his people")})}],["Leave it where it is",d0]])}}
// --- the big one ---
// A gambling boat anchored past the limit. One try. Crew take a cut and shift the odds; the way out is a run with the bag.
function bigScore(){
  const go=(lena,fitz)=>()=>{
    const cut=1-(lena?.2:0)-(fitz?.2:0),who=(lena&&fitz?"Lena and Fitz":lena?"Lena":fitz?"Fitz":"nobody"),
     how=(k,p,txt)=>[txt+" · "+SK[k]+" "+lvl(k),()=>{
       S.cash-=500;tick(3);xp(k,2);
       if(r()>=p+(lena&&k!=="charm"?.14:0)+(fitz?.05:0)){
         S.z.big=1;S.en=cl(S.en-40);S.mood=cl(S.mood-15);news("Security on the gaming vessel Second Wind detained a group overnight. The Coast Guard is investigating.");crime(25);
         if(S.over)return;
         return modal("Blown","A pit boss with a radio makes you before you're past the roulette wheel. "+(lena?"Lena puts two of them through a blackjack table buying you the rail. ":"")+"You go over the side into black water with nothing but the $500 you already spent."+(r()<.5?"":" A patrol boat is waiting where you come up."),[["Swim",()=>{if(r()<.45)jail()}]])}
       waterRun({type:"drop",name:"The Second Wind",site:"stormhead",extra:3,decoy:fitz,done:res=>{
         if(res.ok){
           const p=Math.round(14000*Math.max(.35,res.cargo/100)*cut/100)*100;S.z.big=2;S.cash+=p;S.rep=cl(S.rep+15);S.mood=cl(S.mood+25);
           for(const k of["sal","dex","marcus"])if(pp(k).met&&!gone(k)){bond(k,5);rem(k,"Knows who took the Second Wind")}
           news("The gaming vessel Second Wind was robbed overnight by "+(lena||fitz?"a crew":"a lone thief")+" who escaped by jet ski. The owners decline to say how much was taken.");crime(40);
           if(S.over)return;
           modal("The Second Wind",(res.cargo>=90?"The bag comes ashore dry. ":"Some of it's floating in the bay for the gulls. ")+(cut<1?"You split it on the hood of the truck by flashlight, "+who+" counting out loud. ":"You count it alone, twice. ")+"Your end is "+$$(p)+". For about a minute nobody says anything, and then everybody's laughing too loud.",[["Count it again",0]]);
         }else if(res.how==="quit"){S.z.big=1;crime(20);log("You let the bag go in open water and it sinks like it never happened. "+(cut<1?who+" won't be calling you again.":"Nobody knows but you."))}
         else{S.z.big=1;busted("They found the bag. Pike says not to say anything to anybody, including her.")}
       }})},S.cash<500];
    modal("The Second Wind","Going in with "+who+". How do you get to the cage?",[
      how("charm",.4+.1*lvl("charm"),"Deal yourself in and walk it out the service door"),
      how("wrench",.4+.1*lvl("wrench"),"Kill the generator and take it in the dark"),
      [S.z.piece?"Come over the stern rail with the piece · Fighting "+lvl("fight"):"Come over the stern rail (you'd need a piece)",how("fight",.42+.1*lvl("fight"),"")[1],!S.z.piece||S.cash<500],
      ["Not tonight",0]])};
  modal("The Second Wind","A gambling boat anchored three miles out, where nobody's laws quite reach. Friday nights the cage holds more cash than Gold Line sees in a year. It costs $500 in gear to try, and you get one try. Who's coming? Each of them takes a fifth.",[
   ["Lena and Fitz · muscle, and a tender to draw one patrol off",go(1,1)],
   ["Lena · she hits like a closing door",go(1,0)],
   ["Fitz · he runs a decoy on the way out",go(0,1)],
   ["Alone · nobody to pay, nobody to save you",go(0,0)],
   ["Walk away",0]]);
}
function moreVerdict(){
  const z=S.z;
  return z.v===6?["Vance's man","A season in, the docks answer to you, and you answer to a man who eats oranges in a freezer. The money has never been better. Nobody shells seeds in the back booth."]
   :z.big===2&&z.pad===2?["Made","You took a casino off the water and bought a house on it. Everybody knows and nobody can prove it. That's the whole trick."]
   :z.v===9&&z.docks?["The docks are yours","Vance is a story people tell now. You get a cut of every container, and Dex buys the coffee. It only cost a warehouse."]:null;
}
function moreEpi(){
  const z=S.z;
  return [z.v===6?"Dex is dead and you hold his corner of the docks for Vance. The money's good. You don't sit in the back booth.":z.v===7?"Dex is dead. You weren't there.":z.v===9?(z.docks?"Vance is gone. The docks pay you a cut and Dex buys the coffee.":"Vance is in federal custody. So is a Harbor Patrol sergeant. The street knows who made the call."):z.v===4?"You and Vance aren't finished.":"",
    z.pad===2?"You own a house on the lake, with a dock.":z.pad===1?"You've got a one-bedroom with doors that lock.":"",z.habit>=6?"You've got a habit you keep calling a hobby.":"",
    z.big===2?"The Second Wind sails with twice the security now.":"",z.raided?"You're on probation, and one bad night from finishing the sentence.":""];
}
function moreYou(){
  const z=S.z,st=z.stash,row=(a,b)=>"<div class=\"row\"><span>"+a+"</span><b>"+b+"</b></div>";
  return (held()?row("Holding",Object.keys(GOODS).filter(k=>st[k]).map(k=>st[k]+" "+GOODS[k].n.toLowerCase()).join(", ")):"")+(z.piece?row("Carrying","Snub-nose, no serial"):"")+(z.seen?row("Harbor Patrol","Knows your ski"):"")+(z.habit>=6?row("Habit","It has hold of you"):"");
}
// what each place adds to its list of things to do
function moreActs(at,add){
  const z=S.z,night=S.h>=20||S.h<5,late=S.h>=21||S.h<4,D=pp("dex");
  if(at==="home"){
    if(held())add("Dip into the stash",held()+" on you",true,useStash);
    if(z.pad<2)add("Move somewhere better",PAD[z.pad+1][0],true,movePad);
  }
  if(SPOTS[at]&&held())add("Move product",held()+" on you · "+(want(at)>0?"buyers around":"sold out here today"),want(at)>0,()=>sell(at));
  if(at==="docks"){
    if(!z.dexDead&&D.met&&D.b>=30&&S.pk>=1&&stage("dex")>=0)add("Night run for Dex",z.nightDay===S.day?"one a night":night?"a load off the boat · you ride it":"after 8pm",night&&z.nightDay!==S.day&&S.en>=20,()=>nightRun("dex"),1);
    if(z.v===2||z.v===6)add("Run a load for Vance",z.vanceDay===S.day?"one a night":night?"$1,800 · you ride it":"after 8pm",night&&z.vanceDay!==S.day&&S.en>=20,()=>nightRun("vance"),1);
    if(!z.big&&S.rep>=30&&S.day>=18&&(stage("sal")>=2||S.q.dex===2||z.v===6||z.v===9))add("The Second Wind","the big one · a casino boat, three miles out",S.cash>=500&&S.en>=30,bigScore,2);
    if(z.v===4)add("Pier 4",S.day>=z.hitDay?"end it with Vance":"they're watching for you · day "+z.hitDay,S.day>=z.hitDay,pier4,2);
  }
  if(at==="pawn"){const ss=stage("sal");
    if(!z.piece)add("Buy a piece from Sal",ss>=1?"$600 · no serial number":"he doesn't sell those to strangers",ss>=1&&S.cash>=600,()=>{S.cash-=600;z.piece=1;trust("sal",2);log("Sal sets a snub-nose on a velvet ring tray like it's an engagement. \"I never sold you this. Don't make me read about it.\"");crime(3)});
    if(ss>=1||S.rep>=10)add("Ask Sal about work",z.salDay===S.day?"nothing else today":"collections, the marina",z.salDay!==S.day,salWork);
  }
  if(at==="bar"){
    add("Sit in on the back-room game",late?"blackjack · $25 and up":"the cards come out at 9pm",late&&S.cash>=25,()=>{tick(1);bjIn=S.cash;bjTable()});
    if(z.piece&&late)add("Rob the back-room game","the piece does the talking",true,robGame);
    if(late)add("Close the bar down with a stranger",S.day-z.strayDay<3?"not tonight":"see where it goes",S.day-z.strayDay>=3&&S.mood>=35,stranger);
  }
  if(at==="garage"&&z.seen)add("Respray the ski","$250 · Harbor Patrol knows the old colours",S.cash>=250&&(stage("tommy")>=0||!!S.gar),()=>{S.cash-=250;z.seen=0;S.heat=cl(S.heat-6);tick(2);log("Two hours with a spray gun and a roll of tape. Different ski. Same idiot riding it.");did("respray")});
}
Object.assign(ASK,{
 dex_run:{who:"dex",when:()=>!S.z.dexDead&&pp("dex").b>=30&&S.pk>=1&&r()<.3,text:"Boat's sitting off the point tonight and my regular rider's in county. Bring it in for me? After dark, at the docks.",need:"nightrun",what:"Bring Dex's load in off the boat tonight"},
 marcus_ramp:{who:"marcus",when:()=>!!S.z.seen&&stage("marcus")>=1&&r()<.5,text:"Harbor Patrol's been parked on the ramp all week because of YOUR ski. Paint the damn thing before they start checking everybody's numbers.",need:"respray",due:1,what:"Respray your ski so the patrol leaves the ramp",win:()=>{S.rep=cl(S.rep+2);log("Marcus looks the new paint over. \"Ugly. Good. Nobody'll remember it.\"")}}});
// ---------- in your own words ----------
// Joined into city.js at //@talk. Any of the eight can be spoken to in the player's own words: the line goes to the site's
// /api/talk function (netlify/functions/talk.mts), Claude writes the reply in character, and it comes back with small changes to
// bond, trust and mood, and sometimes something the character will remember. Without a connection, or with the function
// switched off, the option goes away and the scripted choices are all there is.
// visit: lines in one conversation. day: lines in one day. What a day of talk can move for one person is capped as well.
const SAY={url:"/api/talk",visit:6,day:40,cap:6,off:0,seq:0};
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"})[c]);
const sayOn=()=>!SAY.off&&navigator.onLine!==false&&typeof fetch==="function";
// what else is true in the city, as keys the function knows the sentences for
function sayFlags(){
  const z=S.z,f=[];
  if(z.dexDead)f.push("dex_dead");if(z.v===6)f.push("dex_sold");if(z.v>=1&&z.v<=6)f.push("vance_here");if(z.v===9)f.push("vance_gone");
  if(S.kowGone)f.push("kow_gone");if(S.q.rosa===5)f.push("lucky_sal");if(S.q.rosa===1||S.q.rosa===2)f.push("lucky_saved");
  if(S.gar)f.push("owns_garage");if(S.chop)f.push("chop_shop");f.push(S.tourPos===1?"champion":"racer");
  if(S.heat>=60)f.push("hot");if(z.piece&&z.drew)f.push("armed");if(z.pad===2)f.push("lake_house");
  return f.slice(0,8);
}
function sayOpen(k,hist){
  const p=pp(k),c=P[k];hist=hist||[];
  const left=Math.min(SAY.visit-hist.length/2,SAY.day-(S.said&&S.said.d===S.day?S.said.n:0));
  const lines=hist.length?hist.slice(-4).map(h=>"<p class=\"say"+(h.r==="me"?" me":"")+"\"><b>"+(h.r==="me"?"You":c.n)+"</b>"+esc(h.t)+"</p>").join(""):"<p>"+(stage(k)<0?c.cold:c.mood[p.mood])+"</p>";
  modal(c.n,lines+(left>0?"<input id=\"say\" type=\"text\" maxlength=\"200\" autocomplete=\"off\" enterkeyhint=\"send\" placeholder=\"Say something to "+c.n+"\"><p class=\"note\">What you type is sent to an AI model, which writes "+c.n+"'s reply.</p>":"<p class=\"note\">"+c.n+" has things to do.</p>"),
    (left>0?[["Say it",()=>saySend(k,hist)]]:[]).concat([["Leave it there",0]]));
}
function saySend(k,hist){
  const c=P[k],p=pp(k),el=$("say"),t=(el?el.value:"").trim().slice(0,200);
  if(!t)return sayOpen(k,hist);
  const my=++SAY.seq,ctl=typeof AbortController==="function"?new AbortController():null,to=setTimeout(()=>ctl&&ctl.abort(),15000);
  modal(c.n,"<p class=\"say me\"><b>You</b>"+esc(t)+"</p><p class=\"note\">"+c.n+" thinks about that.</p>",[["Never mind",()=>{SAY.seq++}]]);
  fetch(SAY.url,{method:"POST",headers:{"content-type":"application/json"},signal:ctl?ctl.signal:undefined,
    body:JSON.stringify({who:k,say:t,at:S.at,hour:S.h,day:S.day,mood:p.mood,stage:stage(k),rom:p.rom,know:p.know,bond:Math.round(p.b),trust:Math.round(p.t),rep:Math.round(S.rep),mem:p.mem,flags:sayFlags(),hist})})
   .then(r=>r.ok?r.json():Promise.reject(r.status))
   .then(o=>{clearTimeout(to);if(my===SAY.seq)sayLand(k,hist,t,o)})
   .catch(e=>{clearTimeout(to);if(my!==SAY.seq)return;if(e===404||e===403||e===503)SAY.off=1;sayFail(k)});
}
function sayLand(k,hist,t,o){
  const p=pp(k),c=P[k],say=String(o&&o.say||"").slice(0,420);
  if(!say||S.over)return sayFail(k);
  const d=S.said&&S.said.d===S.day?S.said:(S.said={d:S.day,n:0});d.n++;
  // what one day of talk can move is capped, so flattery cannot be farmed
  const lim=(v,sum)=>cl(cl(Math.round(+v)||0,-3,3),-SAY.cap-sum,SAY.cap-sum),gb=lim(o.bond,p.sayB||0),gt=lim(o.trust,p.sayT||0);
  p.sayB=(p.sayB||0)+gb;p.sayT=(p.sayT||0)+gt;bond(k,gb);trust(k,gt);meet(k);
  if(o.mood==="up"||o.mood==="flat"||o.mood==="down")p.mood=o.mood;
  if(o.note)rem(k,esc(String(o.note).slice(0,90)));
  if(!hist.length)xp("charm");
  log(c.n+": "+esc(say));
  $("modal").classList.remove("show");sayOpen(k,hist.concat([{r:"me",t},{r:"them",t:say}]));render();
}
function sayFail(k){
  $("modal").classList.remove("show");
  modal(P[k].n,P[k].n+" doesn't catch that.<p class=\"note\">Talking in your own words needs a connection, and the live lines may be switched off. The usual choices still work.</p>",[["OK",0]]);render();
}
root.addEventListener("keydown",e=>{if(e.target&&e.target.id==="say"&&e.key==="Enter"){e.preventDefault();const b=$("sheet").querySelector("[data-ch]");if(b)b.click()}});
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
