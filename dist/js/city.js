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
 sk:{drive:0,wrench:0,charm:0,fight:0},home:{bed:0,fridge:0,tv:0,safe:0},q:{dex:0,rosa:0,marcus:0,nia:0,june:0},pp,inbox:[],proms:[],done:{},pend:[],log:[],over:0,z:freshZ()}};
let S=fresh();
try{const o=JSON.parse(localStorage.getItem("shc"));if(o){Object.assign(S,o);const f=fresh();
  for(const k of["sk","home","q"])S[k]=Object.assign(f[k],o[k]||{});
  S.z=Object.assign(f.z,o.z||{});S.z.stash=Object.assign(freshZ().stash,(o.z||{}).stash||{});
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
function draw(t,x,ch){modal.cur=[t,x,ch];$("sheet").innerHTML=`<h3>${t}</h3><div class="body">${x}</div><div class="acts">${ch.map((c,i)=>`<button data-ch="${i}"${c[2]?" disabled":""}>${c[0]}</button>`).join("")}</div>`;modal.ch=ch;$("modal").classList.add("show")}
function modal(t,x,ch,lock){
  if(S.over&&!lock)return;
  if(lock)MQ=[];else if(open()){MQ.push([t,x,ch]);return}
  draw(t,x,ch);
}
function reset(){S=fresh();HS.resetAll();MQ=[];clearInterval(RT);RT=0;$("modal").classList.remove("show");log("Day 1. $200, a studio apartment and a bare ski. Rent's due on day 8. The first race weekend is day 5.")}
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
  streetDay();
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
function phone(){
  const today=S.day-(S.h<5?1:0),ch=S.inbox.map(m=>{const a=ASK[m.id];return [(a.title||P[a.who].n)+": "+a.text.slice(0,34)+"…",()=>showAsk(m.id)]});
  modal("Phone",(S.proms.length?"<b>You promised</b><ul>"+S.proms.map(pr=>`<li>${ASK[pr.id].what} · ${pr.due>today?"by tomorrow night":"by tonight"}</li>`).join("")+"</ul>":"")+(S.inbox.length?"Waiting on a reply:":S.proms.length?"":"No new texts. Nobody needs anything. Enjoy it."),ch.concat(phoneMore(),[["Put it away",0]]));
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
      add("Sit at the counter with Rosa","1 hr",true,()=>hang("rosa"));
      if(prom("rosa_walkin"))add("Fix the walk-in cooler","2 hrs",true,()=>{tick(2);xp("wrench",2);meet("rosa");log("Bad start relay. Eleven dollars and two hours on a cold floor. It hums back to life.");did("fix_walkin")},1);
      if((pp("rosa").b>=40||S.done.rosa_deadline)&&!S.q.rosa)add("Rosa needs to talk","in the office",true,rosaStory,1);
      if(st>=3&&pp("kow").met&&!S.kowGone&&S.heat>=20&&S.day-(S.vouch||-9)>=7)add("Ask Rosa to vouch for you","Heat −15",true,()=>{S.vouch=S.day;S.heat=cl(S.heat-15);bond("rosa",-2);log("Rosa pours Kowalski a refill and talks low for five minutes. He glances at you once. \"Don't make a liar out of me,\" she says after.")});
    }
    if(S.h>=6&&S.h<10&&!S.kowGone)add("Sit next to Kowalski","1 hr",true,()=>hang("kow"));
  }
  if(at==="court"){
    add("Run pickup games","2 hrs",S.en>=25,()=>{S.en=cl(S.en-20);S.mood=cl(S.mood+15);S.rep=cl(S.rep+2);tick(2);const w=["marcus","june","nia","tommy"].filter(k=>pp(k).met&&stage(k)>=0);
      if(w.length&&r()<.35){const k=pick(w);bond(k,3);meet(k);log(P[k].n+" shows up"+(k==="tommy"?" to heckle from a lawn chair. It's the happiest you've seen him.":" and you run twos together. You two don't lose."))}
      else log(r()<.5?"You hit the game winner over some guy's outstretched hand. He won't stop talking about it. Neither will you.":"You get cooked in the post. Still fun.")});
    add("Play one-on-one for money","$50 · 1 hr",S.cash>=50&&S.en>=15,()=>{S.en=cl(S.en-15);tick(1);if(r()<.45+S.rep/250){S.cash+=50;S.rep=cl(S.rep+1);log("Game point, step-back, cash. +$50.")}else{S.cash-=50;log("He banks in a prayer from the hash mark. There goes $50.")}});
  }
  if(at==="bar"){const N=pp("nia"),fd=stage("nia")>=2&&S.drank!==S.day;
    add("Have a drink",(fd?"first one's on Nia":"$12")+" · 1 hr",fd||S.cash>=12,()=>{if(fd)S.drank=S.day;else S.cash-=12;S.mood=cl(S.mood+15);S.en=cl(S.en-8);tick(1);log("Whiskey, neat, jukebox playing something older than you are.")});
    add("Talk to Nia","1 hr",true,()=>hang("nia"));
    romActs("nia",add);
    if(N.rom===2&&N.b>=60&&!S.q.nia&&S.day>=S.niaWait)add("Nia wants to talk","serious face",true,niaStory,1);
    if(stage("nia")>=2)add("Ask Nia what she's hearing","1 hr",true,niaGossip);
    add(pp("dex").met?"Back booth: Dex":"Back booth: who's that guy?","1 hr",true,dex);
  }
  if(at==="docks")add("Find Dex by the containers","1 hr",true,dex);
  if(at==="pawn"){const fs=stage("sal")>=2,owe=fs?1300:1400;
    add("Sell crates of \"merchandise\"",S.crates+" on you",S.crates>0,()=>{let t=0;for(let i=0;i<S.crates;i++)t+=260+r()*160;t*=1+.05*lvl("charm")+(fs?.1:0);if(S.heat>50)t*=.7;t=Math.round(t);S.cash+=t;meet("sal");bond("sal",1.5);log("Sal takes "+S.crates+" crate"+(S.crates>1?"s":"")+" for "+$$(t)+(S.heat>50?". He lowballs you. \"You're hot right now, friend.\"":fs?". \"Friend price.\"":". No questions."));S.crates=0;crime(4);tick(1)});
    if(!S.loan)add("Borrow $1,000 from Sal","owe "+$$(owe)+" in 5 days",stage("sal")>=0,()=>{S.cash+=1000;S.loan={amt:owe,due:S.day+5};meet("sal");bond("sal",1);rem("sal","Lent you $1,000");log("Sal counts out ten hundreds. \"Day "+(S.day+5)+". I like you, so I'm telling you now: I'm not a patient man.\"")});
    else{
      add("Pay Sal back",$$(S.loan.amt)+" · due day "+S.loan.due,S.cash>=S.loan.amt,()=>{S.cash-=S.loan.amt;trust("sal",8);bond("sal",3);S.loan=null;rem("sal","Paid what you owed, on time");log("Sal counts it twice. \"See? Easy. Come back anytime.\"")});
      if(stage("sal")>=3&&!S.loan.ext)add("Ask Sal for another week","he likes you",true,()=>{S.loan.due+=7;S.loan.ext=1;trust("sal",-3);log("Sal sighs through his nose. \"One week. Because it's you. Don't make me regret having feelings.\"")});
    }
    add("Shoot the breeze with Sal","1 hr",true,()=>hang("sal"));
    if(S.q.rosa===5)add("Buy Rosa's note from Sal","$3,000",S.cash>=3000,()=>{S.cash-=3000;S.q.rosa=1;bond("rosa",25);trust("rosa",20);pp("rosa").mood="up";rem("rosa","Bought Lucky's back for her");gossip("rosa",12,"you bought Lucky's back from Sal");log("Sal slides the deed across. \"Sentimental. Expensive habit.\" Rosa gets her keys back and makes you a partner: $80 a day.")},1);
  }
  if(at==="garage"){const T=pp("tommy"),ts=stage("tommy"),hired=S.gar||ts>=0&&(T.b>=20||pp("rosa").b>=30||S.rep>=15),base=(S.gar?170:130)+15*lvl("wrench"),gp=S.tsh>=8||T.b>=45&&T.t>=60?6500:8000,tc=lvl("wrench")||ts>=2?1200:1500;
    add(S.gar?"Work your own bay":hired?"Wrench a shift for Tommy":"Ask Tommy for work",hired?"6 hrs · ~"+$$(base):ts<0?"not after what you did":"he doesn't know you yet",hired&&S.en>=30,()=>{const p=pay(base);S.cash+=p;S.en=cl(S.en-25);S.rep=cl(S.rep+1);S.tsh++;xp("wrench");bond("tommy",3);trust("tommy",1);tick(6);meet("tommy");log(S.gar?"A supercharger rebuild and two wear rings. "+$$(p)+", and your name's on the invoices.":"Two impeller swaps and a seized jet pump. Tommy pays "+$$(p)+" cash and says \"not bad\" like it hurts him.");did("shift_garage")});
    add("Talk shop with Tommy","1 hr",true,()=>hang("tommy"));
    if(prom("marcus_gasket"))add("Pull the supercharger on Marcus's ski","4 hrs",S.en>=25,()=>{S.en=cl(S.en-20);tick(4);xp("wrench",2);meet("marcus");log("Four hours, one snapped bolt, a lot of swearing. By the end Marcus is handing you tools before you ask.");did("help_marcus")},1);
    add("Work on your ski",ts<0&&!S.gar?"Tommy won't have you in his shop":"parts, setup, service · 1 hr",ts>=0||!!S.gar,()=>enterRace("garage"),1);
    if(!S.car)add("Buy Tommy's old truck","$1,200",S.cash>=1200,()=>{S.cash-=1200;S.car=1;log("A square-body pickup with a hitch and one working speaker. No more walking.")});
    if(!S.gar)add("Buy the garage from Tommy",ts<0?"he won't sell to you":$$(gp)+(gp<8000?" · he trusts you":""),ts>=0&&S.cash>=gp,()=>{S.cash-=gp;S.gar=1;S.rep=cl(S.rep+10);bond("tommy",10);rem("tommy","Sold you the garage");gossip("tommy",6,"Tommy sold you the garage");modal("Owner","Tommy hands you the keys and a coffee can full of stray bolts. \"Don't screw it up.\" The garage pays you every morning now. What you run out the back is your business.",[["Get to work",0]])},1);
    else add(S.chop?"Shut the chop shop down":"Run stolen skis out the back",S.chop?"stops the daily heat":"+$500/day · Heat +7/day",true,()=>{S.chop=S.chop?0:1;if(S.chop){trust("tommy",-10);rem("tommy","Knows what you run out of bay three");log("Bay three gets a tarp over the window. Skis come in at night and leave as parts. Tommy stops whistling.");crime(5)}else log("You pull the tarp down and send the night crew home. Legit again. Ish.")});
  }
  if(at==="gym"){const J=pp("june"),js=stage("june"),fr=js>=2;
    add("Hit the bags",(fr?"free":"$10")+" · 2 hrs",(fr||S.cash>=10)&&S.en>=25&&js>=0,()=>{if(!fr)S.cash-=10;S.en=cl(S.en-22);S.mood=cl(S.mood+6);xp("fight",2);bond("june",2);tick(2);meet("june");log(pick(["June holds the bag and insults your footwork for two hours.","Jab, jab, cross. Your shoulders are on fire.","June: \"Hands up. You hit like you're apologizing.\""]));did("train")});
    add("Catch up with June","1 hr",true,()=>hang("june"));
    romActs("june",add);
    if(J.rom===2&&J.b>=60&&!S.q.june&&S.day>=(S.juneWait||0))add("June wants to talk","arms crossed",true,juneStory,1);
    if(js>=3&&S.day-(S.patch||-9)>=3)add("Get patched up","June's med kit",S.en<70,()=>{S.patch=S.day;S.en=cl(S.en+40);log("June tapes your ribs and ices your hand. \"You're not as tough as you think. Nobody is.\"")});
    add("Fight night",S.h>=21?"three rounds":"after 9pm",S.h>=21&&S.en>=35&&js>=0,fightNight,1);
  }
  if(at==="lake"){const I=HS.info(),rd=I.round<I.total&&S.day===motoDay(I.round),ms=stage("marcus");
    if(rd)add(I.mid?"Race moto 2 of round "+(I.round+1):"Race round "+(I.round+1)+" of "+I.total,"at "+I.next+(I.mid?" · 3 hrs":" · two motos · 6 hrs"),S.en>=30,()=>enterRace("tour"),1);
    else if(I.round<I.total)add("Next round: day "+motoDay(I.round),"at "+I.next,false,()=>{});
    add("Run the open race",S.openDay===S.day?"one a day":"$40 fuel · 4 hrs · small purse",S.openDay!==S.day&&S.en>=30&&S.cash>=40,()=>enterRace("open"));
    add("Line up against Marcus",ms<0?"his crew won't let you near the strip":S.dragDay===S.day?"one run a day":"drag strip · 2 hrs",ms>=0&&S.dragDay!==S.day&&S.en>=15,dragMarcus);
    add("Kick it with Marcus","1 hr",true,()=>hang("marcus"));
  }
  moreActs(at,add);
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
  const f=b=>()=>{tick(2);S.en=cl(S.en-30);xp("fight",2);meet("june");if(r()<Math.min(.9,.3+.12*lvl("fight")+(stage("june")>=2?.08:0))){S.cash+=b;S.rep=cl(S.rep+5);bond("june",4);rem("june","Watched you win");log("Third round, he walks into your right hand. The basement goes nuts. +"+$$(b)+".")}else{S.cash=Math.max(0,S.cash-b);S.mood=cl(S.mood-8);rem("june","Watched you get dropped");log("You wake up looking at the ceiling lights. June's holding smelling salts. -"+$$(b)+".")}did("fight")};
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
  S.race=Object.assign({kind,day:S.day},o||{});save();
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
  modal(tour?"Round "+res.round+" of "+res.total:res.dnf?"Did not finish":"Open race",L.join(" "),[["OK",0]]);
}
function dragDone(R,res){
  const L=[];S.dragDay=S.day;tick(2);if(S.over)return;
  S.en=cl(S.en-15);xp("drive",1);meet("marcus");
  if(res.win){S.mwins++;S.rep=cl(S.rep+3);S.mood=cl(S.mood+8);if(pal())bond("marcus",1);else{S.salt++;bond("marcus",-2)}L.push("You beat Marcus down the strip.")}
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
function cityBack(){
  window.CITYON=true;host.hidden=false;tab("city");
  if(S.race){if(S.race.kind==="garage"){tick(1);meet("tommy");log("An hour on the stand at Tommy's with your ski.")}S.race=null}
  render();host.scrollTop=0;
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
  const t=take(.3);S.crates=0;S.heat=cl(S.heat-40,10);streetJail();
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
function verdict(){return moreVerdict()||verdict0()}
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
  bn?bn+(bn===1?" crosses":" cross")+" the street when you walk by.":"",...moreEpi()].filter(Boolean);
  return `<br><br>${e.join(" ")}<br><br><b>${$$(S.cash)}</b> · Respect ${S.rep} · Heat ${S.heat} · Day ${S.day}`}
const ENDS={evicted:["Evicted","Two missed rents and nobody close enough to call. Your stuff's on the curb in contractor bags. A guy is already carrying off your TV."],
 raid:["Locked up","6 a.m. They kick in the door. Turns out the city remembered everything. Dex's name never comes up. Yours does, a lot."]};
function end(k){S.over=k;save();modal(ENDS[k][0],ENDS[k][1]+epi(),[["Start a new life",reset]],1)}
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
 v3(){if(S.z.v!==2||S.z.dexDead)return;modal("Pier 4","The cold storage is exactly as cold as it sounds. Vance is smaller than you pictured, in a good coat, eating an orange. \"You're careful. I like careful. Dex isn't careful. Dex is a habit this city has.\" He offers you a segment. \"Tuesday night. Tell him you've got a buyer who'll only meet on the pier. Ten thousand, and what he was doing becomes what you're doing.\"",[
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
    if(!z.big&&S.rep>=30&&S.day>=18&&(stage("sal")>=2||S.q.dex===2||z.v===6||z.v===9))add("The Second Wind","the big one · a casino boat, three miles out",S.cash>=500&&S.en>=30,bigScore,1);
    if(z.v===4)add("Pier 4",S.day>=z.hitDay?"end it with Vance":"they're watching for you · day "+z.hitDay,S.day>=z.hitDay,pier4,1);
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
  if(k===S.at||S.over||open())return;S.at=k;tick(S.car?0:1);log((S.car?"You drive to ":"You walk to ")+L[k].n+".");
  const now=S.day*24+S.h;
  if(!S.over&&now-S.lastEv>=6&&r()<.3){S.lastEv=now;pick(STREET)()}
  else if(S.h>=20||S.h<5)copRoll(.5);
  render();
}
function render(){
  while(!open()&&!S.over&&S.pend.length){const [k,a]=S.pend.shift().split(":");EV[k]&&EV[k](a)}
  save();
  $("clock").textContent="Day "+S.day+" · "+fmtH(S.h);$("cash").textContent=$$(S.cash);
  const st=Math.ceil(S.heat/20);$("stars").textContent="★".repeat(st)+"☆".repeat(5-st);
  const I=HS.info(),rdToday=I.round<I.total&&S.day===motoDay(I.round);
  let nr=S.day+1;while(!rentDay(nr))nr++;$("rent").textContent=(rdToday?"Race day · ":"")+(rentAmt()?"Rent "+$$(rentAmt())+" due day "+nr+(S.missed?" · 1 missed":""):"No rent: the house is yours");
  const nt=S.inbox.length+S.proms.length;$("phone").textContent="Phone"+(nt?" · "+nt:"");$("phone").className="ph"+(S.inbox.length?" new":"");
  $("meters").innerHTML=[["Energy",S.en,"#7ff0b8"],["Food",S.food,"#ffd166"],["Mood",S.mood,"#8ecbff"],["Rep",S.rep,"#ffffff"],["Heat",S.heat,"#ff3d7f"]].map(([n,v,c])=>`<div class="m"><span>${n}<b style="font:inherit">${Math.round(v)}</b></span><div class="bar"><i style="width:${v}%;background:${c}"></i></div></div>`).join("");
  const night=S.h>=20||S.h<6;
  const roads=`<rect x="0" y="100" width="400" height="16" fill="var(--road)"/><rect x="0" y="208" width="400" height="16" fill="var(--road)"/><rect x="128" y="0" width="16" height="300" fill="var(--road)"/><rect x="258" y="0" width="16" height="300" fill="var(--road)"/>`+[108,216].map(y=>`<line x1="0" y1="${y}" x2="400" y2="${y}" stroke="#ffd166" stroke-dasharray="8 8" stroke-width="1.5" opacity=".6"/>`).join("");
  const locs=Object.entries(L).map(([k,l])=>{const op=isOpen(l.o,S.h),all=l.o[1]-l.o[0]===24;return `<g class="loc" tabindex="0" role="button" aria-label="Go to ${l.n}" data-go="${k}" opacity="${op?1:.5}"><rect x="${l.x-56}" y="${l.y-30}" width="112" height="60" rx="8" fill="${l.c}" stroke="${k===S.at?"#fff":"#0005"}" stroke-width="${k===S.at?3:1}"/><rect x="${l.x-56}" y="${l.y+18}" width="112" height="12" fill="#0003"/><text x="${l.x}" y="${l.y+2}" text-anchor="middle">${l.s||l.n}</text><text class="hrs" x="${l.x}" y="${l.y+27}" text-anchor="middle">${k==="lake"&&rdToday&&op?"race day · until 8pm":all?"always open":(op?"open":"closed")+" · "+fmtH(l.o[0])+"–"+fmtH(l.o[1])}</text></g>`}).join("");
  const p=L[S.at];
  $("map").innerHTML=roads+`<rect width="400" height="300" fill="#070b24" opacity="${night?.38:0}" pointer-events="none"/>`+locs+`<g id="me" style="transform:translate(${p.x+44}px,${p.y-22}px)"><circle r="11" fill="#ff3d7f" stroke="#fff" stroke-width="3"/><circle r="4" fill="#fff"/></g>`;
  const op=isOpen(p.o,S.h),acts=op?A():[],w=WHO[S.at],ml=op&&w&&!gone(w)&&stage(w)>=0?P[w].mood[pp(w).mood]:"";
  $("here").innerHTML=(S.log.length?`<p class="last"><time>${S.log[0].t}</time>${S.log[0].x}</p>`:"")+`<h2>${p.n}</h2><p class="desc">${S.at==="garage"&&S.gar?"Yours now. Tommy still shows up at eight out of habit. Parts are at cost.":S.at==="diner"&&S.q.rosa===5?"Sal's nephew is on the grill. The coffee got worse.":S.at==="home"&&S.z.pad?PAD[S.z.pad][3]:p.d}</p>${ml?`<p class="desc mood">${ml}</p>`:""}<div class="acts">${op?acts.map((a,i)=>`<button data-a="${i}"${a.ok?"":" disabled"}${a.hot?' class="hot"':""}>${a.n}<small>${a.s}</small></button>`).join(""):`<p>Closed right now. Opens at ${fmtH(p.o[0])}. Tap somewhere else on the map, or head home and sleep.</p>`}</div>${S.crates?`<p class="note">On you: ${S.crates} crate${S.crates>1?"s":""} of hot merchandise. Cops will care.</p>`:""}`;
  render.acts=acts;
  const own=Object.keys(UP).filter(k=>S.home[k]).map(k=>({bed:"bed",fridge:"fridge",tv:"TV",safe:"safe"})[k]),inc=income(),today=S.day-(S.h<5?1:0);
  $("you").innerHTML=S.proms.map(pr=>`<div class="row"><span>Promised</span><b>${ASK[pr.id].what} · ${pr.due>today?"tomorrow":"today"}</b></div>`).join("")
   +Object.entries(SK).map(([k,n])=>`<div class="row"><span>${n}</span><b class="pips" aria-label="level ${lvl(k)} of 5">${"●".repeat(lvl(k))+"○".repeat(5-lvl(k))}</b></div>`).join("")
   +`<div class="row"><span>Ride</span><b>${S.car?"Old pickup":"On foot"}</b></div>`
   +`<div class="row"><span>Ski</span><b>${I.craft} · ${I.cls} · ${I.parts} part level${I.parts===1?"":"s"}${I.wear<60?" · needs service":""}</b></div>`
   +`<div class="row"><span>Series</span><b>${I.round>=I.total?"Finished "+ord(S.tourPos||I.pos):(I.round?ord(I.pos)+" on "+I.pts+" pts · ":"")+(I.mid?"moto 2 of ":"")+"round "+(I.round+1)+" on day "+motoDay(I.round)}</b></div>`
   +`<div class="row"><span>Place</span><b>${S.z.pad?PAD[S.z.pad][0]:own.length?"Studio with "+own.join(", "):"Mattress on the floor"}${S.q.nia===3?", and Nia":""}${S.bag?", and Dex's bag":""}</b></div>`
   +(inc?`<div class="row"><span>Daily take</span><b>${$$(inc)}${S.chop?" · chop shop running":""}</b></div>`:"")
   +(S.loan?`<div class="row"><span>Owed to Sal</span><b>${$$(S.loan.amt)} by day ${S.loan.due}</b></div>`:"")
   +(S.oweDay?`<div class="row"><span>Nia owes you</span><b>$200</b></div>`:"")+moreYou();
  const ar=(a,b)=>a-b>=1?" ▲":b-a>=1?" ▼":"";
  $("people").innerHTML=Object.keys(P).map(k=>{const q=pp(k),c=P[k];
    if(k==="kow"&&S.kowGone)return `<div class="p"><b>Kowalski<span>transferred out</span></b></div>`;
    if(k==="dex"&&S.z.dexDead)return `<div class="p"><b>Dex<span>dead · pulled out of the harbor off Pier 4</span></b></div>`;
    if(!q.met)return `<div class="p"><b>${c.n}<span>${c.role} · hasn't met you</span></b></div>`;
    const sg=stage(k),away=S.day-q.seen,lab=q.rom?ROM[q.rom]+(sg<0?" · done with you":""):STG[sg];
    return `<details class="p" data-p="${k}"${S.openP===k?" open":""}><summary><b>${c.n}<span>${lab}</span></b><div class="bars"><div><i style="width:${q.b}%"></i></div><div class="tr"><i style="width:${q.t}%"></i></div></div><small>Bond ${Math.round(q.b)}${ar(q.b,q.b0)} · Trust ${Math.round(q.t)}${ar(q.t,q.t0)}${q.cap<100?" (max "+q.cap+")":""}${away>=3?" · not seen in "+away+" days":""}</small></summary><ul><li>${c.role[0].toUpperCase()+c.role.slice(1)}. ${tieTxt(k)}</li>${c.know.slice(0,q.know).map(x=>`<li><b>You know:</b> ${x}</li>`).join("")}${q.mem.map(x=>`<li><b>Remembers:</b> ${x}</li>`).join("")}</ul></details>`}).join("");
  $("log").innerHTML=S.log.map(l=>`<p><time>${l.t}</time>${l.x}</p>`).join("");
}
root.addEventListener("click",e=>{
  const t=e.target;
  const c=t.closest("[data-ch]");
  if(c){$("modal").classList.remove("show");const f=modal.ch[+c.dataset.ch][1];f&&f();if(!open()&&MQ.length&&!S.over)draw(...MQ.shift());return render()}
  if(open())return;
  const tb=t.closest("#tabs [data-tab]");if(tb)return tab(tb.dataset.tab);
  if(t.closest("#phone"))return phone();
  const g=t.closest("[data-go]");if(g)return go(g.dataset.go);
  const a=t.closest("[data-a]");if(a&&!S.over){render.acts[+a.dataset.a].fn();return render()}
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
// on a phone the foot of the screen switches between the city, the people, you and the log
function tab(k){$("wrap").dataset.tab=k;for(const b of root.querySelectorAll("#tabs [data-tab]"))b.setAttribute("aria-pressed",String(b.dataset.tab===k));host.scrollTop=0}
HS.city(true);host.hidden=false;if(!adult())gate();
{const I=HS.info();$("tag").textContent="$200, a studio apartment, a bare ski and "+I.total+" race weekends. One season to get fast, get paid, or get locked up. Adults only: crime, violence, drugs, strong language."}
const first=!S.log.length;if(first)log("Day 1. $200, a studio apartment and a bare ski. Rent's due on day 8. The first race weekend is day 5.");
render();
if(first)modal("Day 1","New city, $200, a bare ski, rent due on day 8. Tap the map to get around.<ul><li>There is a race weekend every five days, starting day 5: two motos, at the Lake. Pick your rider and ski in the pits before the first one. The ski gets built at Tommy's Garage, out of the same money you live on.</li><li>Everybody here has good days and bad days. Read the room before you crack a joke.</li><li>Bond is how close you are. Trust is whether they believe you. They move separately, and people talk to each other.</li><li>Your phone will buzz. Saying yes is a promise.</li><li>Not everything here is legal. Heat is how hard the law is looking: the more stars, the more of them come after you, on the street and on the water.</li><li>In a conversation you can pick what to say, or say it in your own words.</li></ul>",[["Let's go",0]]);
if(S.over)end(S.over);

})();
