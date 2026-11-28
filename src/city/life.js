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
