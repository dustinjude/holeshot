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
