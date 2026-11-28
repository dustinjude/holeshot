(()=>{'use strict';
//<core>
// Course units: 260 units a second is a flat-out 84 mph.
const DS=16, VMAX=260, MPH=79.8/VMAX, TAU=6.283185307, FRONT=10, BACK=6;
const A0=150, TURN_MAX=1.6, GRIP=360, KLAT=12, ALIGN=1.4, IDLE=14, BRAKE=60, BRAKE_A=90, TRAIL_DT=.07, TRAIL_LIFE=2.4;
// the water has height: GRAV pulls a ski that has left it back down, and a hop smaller than HOP is not worth calling one
const GRAV=150, HOP=24, KICK=10, WAKE_T=1.3;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const angDiff=(a,b)=>{let d=(a-b)%TAU; if(d>Math.PI)d-=TAU; else if(d<-Math.PI)d+=TAU; return d;};
function hash(i,j,k){
  let h=Math.imul(i,374761393)+Math.imul(j,668265263)+Math.imul(k,2147483647)|0;
  h=Math.imul(h^(h>>>13),1274126177);
  return ((h^(h>>>16))>>>0)/4294967296;
}

// Rider and craft numbers are multipliers on the shared ski physics.
// name is what shows on the water and in the timing strip; full goes on the results and the podium.
// Full names and race numbers for Vanjae, Vaylon, Garrett, JJ, Chris and Dustin are their real ones; the other numbers and every
// rating are placeholders.
const RACERS=[
  {name:'Vanjae',full:'Vanjae Ramgeet',num:116,launch:1.10,corner:1.06,chopR:1.00,hull:'#ff8a3c',trim:'#06202a'},
  {name:'Vaylon',full:'Vaylon Ramgeet',num:3,launch:1.00,corner:1.12,chopR:.96,hull:'#38c6f4',trim:'#fcfdfb'},
  {name:'Deven',num:27,launch:.96,corner:1.02,chopR:1.12,hull:'#9be23c',trim:'#06202a'},
  {name:'Garrett',full:'Garrett Loftin',num:114,launch:1.06,corner:.98,chopR:1.06,hull:'#a78bfa',trim:'#fcfdfb'},
  {name:'Tory',num:88,launch:1.14,corner:.96,chopR:.98,hull:'#ff4fa3',trim:'#fcfdfb'},
  {name:'Andre',num:31,launch:.98,corner:1.09,chopR:1.02,hull:'#2de0b0',trim:'#06202a'},
  {name:'JJ',full:'JJ McLean',num:45,launch:1.04,corner:1.04,chopR:.99,hull:'#fcfdfb',trim:'#e4392c'},
  {name:'GJ',num:96,launch:.94,corner:1.00,chopR:1.16,hull:'#27343b',trim:'#ffc62a'},
  {name:'Chris',full:'Chris Macclugage',num:46,launch:1.02,corner:1.01,chopR:1.05,hull:'#c98a3e',trim:'#fcfdfb'},
  {name:'Dustin',full:'Dustin Charrier',num:40,launch:1.05,corner:1.05,chopR:1.06,hull:'#1f5fd6',trim:'#ffc62a'}];
for(const r of RACERS) if(!r.full) r.full=r.name;
const CRAFTS=[
  {name:'Sea-Doo 325',top:1.00,acc:1.07,turn:1.06,stab:.97,sh:{L:21,S:18,B:7.7,bow:13,seat:14,deck:0,mark:1}},
  {name:'Sea-Doo 350',top:1.04,acc:1.12,turn:.93,stab:.8,sh:{L:22.5,S:18,B:7.8,bow:11,seat:13,deck:0,mark:2}},
  {name:'Yamaha GP1800',top:.985,acc:1.08,turn:1.18,stab:.84,sh:{L:21,S:18.4,B:7.6,bow:12,seat:11,deck:0,mark:0}},
  {name:'Yamaha FX SVHO',top:1.01,acc:1.0,turn:.96,stab:1.2,sh:{L:22.5,S:19.6,B:7.9,bow:14,seat:19,deck:4,mark:3}},
  {name:'Kawasaki Ultra',top:1.03,acc:.97,turn:.93,stab:1.32,sh:{L:23,S:19.5,B:7.8,bow:16,seat:19,deck:5.5,mark:4}}];
// ---------- the garage ----------
// Parts come in three levels. fx is what one level adds, in percent, to top speed, acceleration, launch, turning and rough-water hookup.
const PARTS=[
  {name:'ECU reflash',by:'Dean Strong',note:'Limiter off, more boost and timing, tuned to your specs',fx:[1.2,1.2,0,0,0],cost:[1200,2600,4800]},
  {name:'Intake and intercooler',note:'A cooler, denser charge',fx:[.4,1.2,0,0,0],cost:[900,2000,3800]},
  {name:'Exhaust',note:'Free-flow pipe',fx:[.6,.6,0,0,0],cost:[700,1600,3000]},
  {name:'Supercharger wheel',note:'More boost, and it wears faster',fx:[.8,1.5,0,0,0],cost:[1500,3200,6000]},
  {name:'Valve train',note:'Springs and retainers, for more revs',fx:[.6,0,0,0,0],cost:[800,1800,3400]},
  {name:'Impeller and pump',note:'Bites harder off the line',fx:[0,.8,3,0,0],cost:[700,1500,2800]},
  {name:'Intake grate',note:'Keeps the pump fed in rough water',fx:[0,0,1,0,4],cost:[400,900,1700]},
  {name:'Handling kit',note:'Sponsons, ride plate and bars',fx:[0,0,0,2.5,2],cost:[600,1400,2600]}];
// Setup costs nothing and every setting is a trade. Five positions, -2 to 2; fx is what one step toward the right-hand end does.
const TUNE=[
  {name:'Impeller pitch',lo:'Launch',hi:'Top speed',fx:[.6,-1,-2.5,0,0]},
  {name:'Sponson depth',lo:'Top speed',hi:'Turning',fx:[-.4,0,0,1.6,0]},
  {name:'Trim',lo:'Top speed',hi:'Rough water',fx:[-.4,0,0,0,3.5]}];
const WEAR=['Engine','Supercharger','Pump'], BARE=.95;
// what a build is worth: a ski with no parts is a little down on today's race pace, a full one well up on it
function garageMod(levels,setup,wear){
  const m=[BARE,1,1,1,1];
  PARTS.forEach((p,i)=>{const l=levels?levels[i]||0:0; for(let k=0;k<5;k++) m[k]*=1+p.fx[k]*l/100;});
  if(setup) TUNE.forEach((t,i)=>{const v=setup[i]||0; for(let k=0;k<5;k++) m[k]*=1+t.fx[k]*v/100;});
  if(wear){
    // a tired engine is down on top speed, a tired supercharger on acceleration, a worn pump on launch and hookup
    const d=c=>c<60?(60-c)/60*.06:0;
    m[0]*=1-d(wear[0]); m[1]*=1-d(wear[1]); m[2]*=1-1.5*d(wear[2]); m[4]*=1-d(wear[2]);
  }
  return {top:m[0],acc:m[1],launch:m[2],turn:m[3],stab:m[4]};
}
const NOMOD={top:1,acc:1,launch:1,turn:1,stab:1};

// Rival pace runs from 0 to 1. The named levels are points on that scale; Auto moves along it after every race.
const LEVELS=[{name:'Easy',pace:.12},{name:'Medium',pace:.5},{name:'Hard',pace:.78},{name:'Pro',pace:1}];
// top: straight-line speed. skill: how hard they corner. line: how far they cut to the inside of a turn.
// ease: how much a rival well ahead of the player backs off. push: how much one behind is spurred on.
function rivalSpec(p){
  p=clamp(p,0,1);
  const x=Math.max(0,p-.78)/.22;                                  // the last stretch of the scale, up to Pro, climbs more steeply
  return {top:.9+.144*p+.045*x,skill:.82+.304*p+.09*x,line:.8*p+.1*x,ease:.06*(1-p),push:.03+.03*p+.015*x,grip:1+.07*x};   // grip: at the very top of the scale they also find a little more of it than you have
}
const SITES=[
  // A closed course in the IJSBA mould: a long run to a wide first turn, then hairpins and two buoy slaloms too wide to straight-line.
  {id:'havasu',name:'Lake Havasu',sub:'Closed course off the beach. A long holeshot, four hairpins and two buoy slaloms, in a steady chop.',laps:3,chop:.6,swell:null,lane:112,
   ctrl:[[504,2970],[486,2250],[495,1575],[518,1035,1.2],[585,792,1.25],[720,711,1.25],[855,792,1.15],[909,1035],[1048,1350,.92],[752,1692,.92],[1048,2034,.92],[752,2376,.92],[909,2655],
     [972,2880],[1161,2979],[1350,2880],[1404,2655],[1404,2340],[1611,1962,.92],[1431,1584,.92],[1476,1260],[1548,1026],[1737,936],[1926,1026],[1998,1260],
     [2156,1575,.92],[1858,1917,.92],[2156,2259,.92],[1858,2601,.92],[1989,2925],[1890,3285],[1530,3465],[990,3492],[684,3420],[531,3204]],
   shore:{x:-70,y0:-600,y1:5000},
   land:[[2655,1890,150,1],[2763,2007,100,0],[1710,432,130,1],[1827,513,90,0]],
   zones:[[1260,3474,280,.6]],
   marks:[{t:'tower',x:150,y:2745},{t:'light',x:2655,y:1890}],boats:[[.5,.62,-1],[.68,.8,-1]]},
  // An offshore circuit after the AquaX enduro courses: fast legs broken by doglegs, a notch back toward the beach, surf along the shore.
  {id:'pattaya',name:'Pattaya Bay',sub:'Offshore circuit. Fast legs broken by doglegs under a rolling swell, with surf along the beach.',laps:3,chop:.5,swell:{a:.55,len:520,c:70,amp:7.5},lane:150,sweep:800,
   ctrl:[[810,3870],[774,3240],[792,2700],[1044,2295],[738,1890],[810,1350],[972,837,1.15],[1386,558,1.2],[1845,738],[2250,486],[2664,774],[2799,1260],[2754,1665],[2385,1944],[1935,1962],[1647,2124],[1557,2358],[1647,2592],
     [1935,2736],[2430,2718],[2835,2970],[2970,3465],[2565,3915],[2070,3825],[1620,4230],[1080,4320]],
   shore:{x:-140,y0:-400,y1:5600},
   land:[[1530,3375,140,1],[1656,3474,100,1],[1440,3483,85,0]],
   zones:[[792,2790,420,.4],[1602,2358,300,.3]],
   marks:[{t:'pier',x:140,y:2925,x2:560},{t:'startboat',f:.012}],boats:[[.3,.42,-1],[.74,.86,-1]]},
  // A river sprint: meanders that double back, a narrow cut, a wide lake bend and a timber bridge.
  {id:'bayou',name:'Blackwater Bayou',sub:'A river between mud banks. Flat water, tight meanders, a narrow cut and a bridge to run under.',laps:3,chop:0,swell:null,lane:110,banks:true,
   ctrl:[[600,3000],[600,2400],[570,1900],[790,1460],[450,1010],[780,500],[1380,380],[1850,680],[1700,1150,.84],[2100,1500,.84],[2600,1250],[3000,1480],[3430,1250,1.2],[3660,1750,1.25],[3380,2300,1.2],[2850,2480],[2500,2850],[2000,2550],[1620,2800],[1500,3300],[1150,3680],[780,3560]],
   land:[],marks:[{t:'bridge',f:.705}]},
  // A canyon run: a twisting squeeze between sandstone walls, out through a stone arch, then a slalom among the buttes.
  {id:'redrock',name:'Red Rock Reservoir',sub:'High-desert reservoir. A twisting canyon, a stone arch, then a slalom among the buttes in a wind chop.',laps:3,chop:.7,swell:null,lane:122,rocks:true,
   ctrl:[[720,2970],[702,2385],[810,1890,.8],[576,1440,.8],[864,1008,.8],[621,576,.8],[972,270],[1530,306],[1980,612],[1845,1080],[2250,1368],[2025,1782],[2430,2070],[2880,1917],[3204,2295],[3060,2790],[3258,3240],[2790,3510],[2340,3276],[1890,3555],[1440,3276],[1062,3537]],
   land:[],zones:[[972,270,260,.55],[3105,3015,320,.45]],
   marks:[{t:'arch',f:.262}]},
  // An ocean race off an Atlantic beach: out through the surf, a slalom offshore across a big swell, and back in with it behind you.
  {id:'daytona',name:'Daytona Beach',sub:'Atlantic surf race. Out through the break, a slalom across a big swell offshore, and back in with it behind you.',laps:3,chop:.35,ocean:true,city:true,
   swell:{a:3.02,len:640,c:85,amp:14},swell2:{a:2.2,len:330,c:55,amp:4},lane:150,sweep:900,
   ctrl:[[850,4200],[830,3500],[860,2900],[1130,2450],[830,2000],[1000,1480,1.1],[1400,1080,1.15],[2000,960,1.1],[2580,1230],[2780,1750],[2480,2150],[2960,2560],[2520,2980],[2980,3400],[2700,3850],[2150,3700],[1750,4050],[1950,4500],[1500,4800],[1000,4680]],
   shore:{x:-140,y0:-400,y1:5600},
   land:[],zones:[[870,2900,460,.3]],
   marks:[{t:'pier',x:140,y:3000,x2:560},{t:'startboat',f:.012}],boats:[[.38,.5,-1]]},
  // The biggest water of the six: a course threaded between sea stacks off a headland, with a long ocean swell and a second one crossing it.
  {id:'stormhead',name:'Stormhead Rocks',sub:'Open ocean off a headland. The biggest swell of the six, a cross sea, and a course threaded between sea stacks.',laps:3,chop:.4,ocean:true,rocks:true,
   swell:{a:2.5,len:760,c:95,amp:17},swell2:{a:.9,len:360,c:60,amp:5},lane:150,sweep:700,
   ctrl:[[800,3400],[780,2700],[950,2050],[700,1450],[1000,850],[1550,450],[2250,600],[2700,1100],[2420,1600],[2800,2100],[3300,1900],[3700,2400],[3500,3000],[3000,3300],[2500,3000],[2000,3400],[2300,3900],[1700,4150],[1200,3950]],
   land:[[1750,2050,150,1]],zones:[[2250,600,300,.25]],
   marks:[{t:'light',x:1750,y:2050}]},
  // Stadium watercross: a small pond inside a bowl of grandstands, raced at sundown under the lights. Hairpins and chicanes, no straight worth the name.
  {id:'arena',name:'Sundown Stadium',sub:'Stadium watercross at sundown. A tight pond course of hairpins and chicanes inside the grandstands.',laps:4,chop:.25,swell:null,lane:100,bowl:true,
   ctrl:[[600,2250],[600,1800],[620,1300],[700,850,1.1],[950,640,1.15],[1200,790,1.1],[1250,1150],[1060,1450,.9],[1300,1750,.9],[1560,1520],[1620,1080],[1780,720],[2060,650],[2260,860],
     [2220,1250],[2420,1600,.9],[2180,1950,.9],[2360,2280],[2120,2540],[1720,2470],[1380,2250],[1040,2470],[760,2520]],
   land:[],zones:[],marks:[{t:'startboat',f:.012}]},
  // An alpine lake: granite islands under pines, a gap between two of them, and snow on the peaks all round. Wind chop off the glacier.
  {id:'glacier',name:'Glacier Lake',sub:'Alpine lake under snowy peaks. Granite islands, a narrow gap between two of them, and an icy wind chop.',laps:3,chop:.6,swell:null,lane:130,isles:true,
   ctrl:[[700,3600],[680,2900],[760,2200],[1000,1600,.8],[860,1100,.8],[1100,560],[1700,400],[2200,700],[2350,1250],[2900,1450],[3300,1900],[3150,2500],[2600,2600,.85],[2200,2950,.85],[2500,3450],[2150,3950],[1500,4050],[1000,3900]],
   land:[[1650,1250,170,1],[1530,1420,110,0],[2700,2050,140,1],[1650,2750,190,1],[1480,2900,120,0],[1750,3350,130,1]],
   zones:[[3300,1900,320,.5]],marks:[{t:'startboat',f:.012}]},
  // A tropical lagoon: white-sand islands with palms, a reef channel, and huts on stilts over the water.
  {id:'lagoon',name:'Coral Lagoon',sub:'Turquoise lagoon between palm islands. A reef channel, huts over the water and a gentle swell.',laps:3,chop:.3,swell:{a:1.2,len:420,c:55,amp:3.5},lane:140,isles:true,sweep:700,
   ctrl:[[800,3800],[760,3100],[800,2400],[1150,1900],[900,1350],[1200,750],[1850,520],[2350,850],[2250,1400,.82],[2650,1800,.82],[3200,1700],[3500,2200],[3150,2850],[2600,3000],[2200,3450],[2550,3950],[2100,4400],[1400,4350]],
   land:[[1700,1300,180,1],[1550,1470,120,0],[2750,2450,170,1],[1600,3300,200,1],[1450,3480,130,0]],
   zones:[[3500,2200,300,.35]],marks:[{t:'huts',x:3050,y:3500},{t:'startboat',f:.012}],boats:[[.45,.6,1]]},
  // A city river loop: stone quays and parkland, a skyline on every side, and two steel bridges to run under.
  {id:'river',name:'Riverfront',sub:'A city river loop between stone quays and parkland, under two steel bridges and a skyline.',laps:3,chop:.2,swell:null,lane:115,banks:true,
   ctrl:[[650,3300],[640,2600],[520,2000],[800,1450],[640,950],[1000,450],[1700,380],[2200,700],[2250,1250,.85],[2700,1550,.85],[3250,1400],[3550,1850],[3300,2400],[2750,2500],[2450,2950],[2700,3450],[2250,3900],[1500,3850],[1050,3650]],
   land:[],marks:[{t:'bridge',f:.36,steel:true},{t:'bridge',f:.83,steel:true}]},
  // After the real Jet Around Cayman: one lap of Grand Cayman, clockwise, from Seven Mile Public Beach heading north. Calm in
  // the lee of the west coast; big swell off the north coast past Stingray City; the roughest water at East End; heavy seas
  // off Pedro on the way home. The island is flat, so it is low land and palms. Its shape is drawn freehand and the length
  // is chosen for a phone race of about three minutes, not to scale.
  {id:'cayman',name:'Jet Around Cayman',sub:'Once around Grand Cayman. Calm off Seven Mile Beach, big swell on the north coast, the roughest water at East End.',
   laps:1,chop:.3,ocean:true,lane:150,sweep:1100,
   swell:{a:2.79,len:700,c:90,amp:6},swell2:{a:2.2,len:340,c:58,amp:2.5},
   ctrl:[[650,3600],[620,2800],[650,1900],[750,1000],[1050,300],[1800,50],[2700,150],[4000,100],[5200,150],[6400,100],[8000,50],[10000,100],[12000,250],
     [14000,400],[15800,700],[17000,1300],[17600,2200],[17300,3300],[16000,3850],[14000,3950],[12000,4200],[10000,4500],[8200,4900],[6600,5450],[5600,5900],
     [4200,6050],[2800,6150],[1600,6050],[900,5400],[680,4500]],
   // the island as an outline, filled with land when the course is built; the North Sound is the bay left open on the north side
   island:[[1400,5300],[1250,4300],[1200,3200],[1250,2100],[1350,1200],[1550,750],[2050,700],[2400,1100],[2450,2000],[2550,2900],[3100,3350],[4200,3500],[5200,3350],
     [5800,2800],[5950,1800],[6150,900],[7500,650],[9500,700],[11500,850],[13500,1000],[15200,1300],[16400,1800],[16900,2400],[16600,3000],[15200,3200],[13000,3350],
     [11000,3600],[9000,3900],[7200,4300],[5800,4850],[4200,5250],[2800,5450],[1900,5450]],
   beach:{x:1250,y0:2700,y1:4500},
   land:[],zones:[[4300,150,1500,.55],[17300,2300,1700,.95],[6100,5650,1500,.7]],
   // checkpoints called out as you pass them, with the time so far
   cps:[[900,700,'West Bay'],[3800,100,'Stingray City'],[8000,50,'North Side'],[17600,2200,'East End'],[11000,4350,'Bodden Town'],[5600,5900,'Pedro'],[1600,6050,'George Town']],
   marks:[{t:'startboat',f:.012},{t:'light',x:16700,y:2400},{t:'tower',x:1320,y:3300}],boats:[[.3,.38,-1],[.86,.92,-1]]}];

function buildCourse(site,rev){
  const CTRL=rev?[site.ctrl[0]].concat(site.ctrl.slice(1).reverse()):site.ctrl, n=CTRL.length, raw=[], lane=site.lane;
  for(let i=0;i<n;i++){
    const a=CTRL[(i-1+n)%n], b=CTRL[i], c=CTRL[(i+1)%n], d=CTRL[(i+2)%n];
    for(let k=0;k<40;k++){
      const t=k/40, t2=t*t, t3=t2*t;
      raw.push({
        x:.5*(2*b[0]+(-a[0]+c[0])*t+(2*a[0]-5*b[0]+4*c[0]-d[0])*t2+(-a[0]+3*b[0]-3*c[0]+d[0])*t3),
        y:.5*(2*b[1]+(-a[1]+c[1])*t+(2*a[1]-5*b[1]+4*c[1]-d[1])*t2+(-a[1]+3*b[1]-3*c[1]+d[1])*t3),
        w:(b[2]||1)+((c[2]||1)-(b[2]||1))*t2*(3-2*t)});                        // the lane can squeeze and open out: a third number on a control point scales its width there
    }
  }
  const m=raw.length, cum=[0];
  for(let i=0;i<m;i++){const p=raw[i], q=raw[(i+1)%m]; cum.push(cum[i]+Math.hypot(q.x-p.x,q.y-p.y));}
  const L=cum[m], N=Math.round(L/DS), path=[];
  let seg=0;
  for(let j=0;j<N;j++){
    const s=j*L/N;
    while(seg<m-1&&cum[seg+1]<s) seg++;
    const p=raw[seg], q=raw[(seg+1)%m], f=(s-cum[seg])/((cum[seg+1]-cum[seg])||1);
    path.push({x:p.x+(q.x-p.x)*f, y:p.y+(q.y-p.y)*f, w:lane*(p.w+(q.w-p.w)*f), c:0});
  }
  for(let j=0;j<N;j++){
    const a=path[(j-1+N)%N], c=path[(j+1)%N], p=path[j];
    const tx=c.x-a.x, ty=c.y-a.y, l=Math.hypot(tx,ty)||1;
    p.tx=tx/l; p.ty=ty/l; p.h=Math.atan2(ty,tx);
  }
  // curvature, positive = right turn (screen y points down)
  for(let j=0;j<N;j++) path[j].k=angDiff(path[(j+1)%N].h,path[(j-1+N)%N].h)/(2*L/N);
  // corners: where the smoothed curvature peaks. Each gets a turn buoy on the inside edge of the lane.
  const ks=path.map((p,j)=>{let a=0; for(let q=-4;q<=4;q++) a+=path[(j+q+N)%N].k; return a/9;}), turns=[];
  for(let j=0;j<N;j++) path[j].ks=ks[j];
  for(let j=0;j<N;j++){
    const a=Math.abs(ks[j]); if(a<1/(site.sweep||560)) continue;
    let peak=true;
    for(let q=-14;q<=14&&peak;q++) if(q&&Math.abs(ks[(j+q+N)%N])>=a&&(Math.abs(ks[(j+q+N)%N])>a||q<0)) peak=false;
    if(!peak) continue;
    const p=path[j], right=ks[j]>0, sg=right?1:-1, d=Math.min(p.w+8,.8/a);
    turns.push({idx:j,right,k:a,x:p.x-p.ty*sg*d,y:p.y+p.tx*sg*d,wob:0});
    for(let q=-9;q<=9;q++) path[(j+q+N)%N].c=sg;
  }

  // terrain: every land mass is a cluster of round blobs, and none of it may reach into the lane
  const land=[];
  const fit=(x,y,r,top,keep)=>{
    let d2=1e18;
    for(let q=0;q<N;q+=2){const a=path[q], e=Math.hypot(a.x-x,a.y-y)-a.w; if(e<d2) d2=e;}
    const room=d2-26;
    if(room<r){if(!keep||room<30) return false; r=room;}
    land.push({x,y,r,top}); return true;
  };
  for(const b of site.land) fit(b[0],b[1],b[2],b[3],true);
  if(site.shore){
    const sh=site.shore; let q=0;
    for(let y=sh.y0;y<=sh.y1;y+=190){
      q++;
      fit(sh.x+(hash(q,1,5)-.5)*70,y,280,0,true);
      fit(sh.x-400,y+95,340,hash(q,2,5)>.5?1:0,true);
      fit(sh.x-860,y,420,1,true);
    }
  }
  if(site.banks){
    for(let j=0;j<N;j+=4) for(const sd of [-1,1]){
      const p=path[j], r=105+hash(j,sd,9)*35, off=r+p.w+34+hash(j,sd,11)*20;
      fit(p.x-p.ty*sd*off,p.y+p.tx*sd*off,r,1,false);
    }
  }
  if(site.island){
    // a big island: round blobs on a grid inside its outline, beach at the edge and higher, greener ground inland
    const poly=site.island, inside=(x,y)=>{let c=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i], b=poly[j]; if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) c=!c;} return c;};
    const edge=(x,y)=>{let d=1e18; for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[j], b=poly[i], ex=b[0]-a[0], ey=b[1]-a[1], t=clamp(((x-a[0])*ex+(y-a[1])*ey)/(ex*ex+ey*ey),0,1); d=Math.min(d,Math.hypot(a[0]+ex*t-x,a[1]+ey*t-y));} return d;};
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for(const q of poly){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1]);}
    let k=0;
    for(let y=y0;y<=y1;y+=330) for(let x=x0;x<=x1;x+=330){
      k++; const jx=x+(hash(k,1,81)-.5)*120, jy=y+(hash(k,2,81)-.5)*120; if(!inside(jx,jy)) continue;
      const e=edge(jx,jy); fit(jx,jy,Math.min(300,e+170),e>420?1:0,false);
    }
    // the coastline itself, so the island ends in a clean beach rather than a row of bumps
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const a=poly[j], b=poly[i], l=Math.hypot(b[0]-a[0],b[1]-a[1]);
      for(let t=0;t<l;t+=150) fit(a[0]+(b[0]-a[0])*t/l,a[1]+(b[1]-a[1])*t/l,170,0,false);
    }
  }
  if(site.rocks||site.isles){
    // islands: one inside each corner, then a scatter
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    for(const p of path){if(p.x<x0)x0=p.x;if(p.x>x1)x1=p.x;if(p.y<y0)y0=p.y;if(p.y>y1)y1=p.y;}
    turns.forEach((t,i)=>{
      const p=path[t.idx], sg=t.right?1:-1, r=78+hash(i,3,51)*52;
      for(let d=p.w+r+40;d<p.w+r+520;d+=36){
        const x=p.x-p.ty*sg*d, y=p.y+p.tx*sg*d;
        if(fit(x,y,r,1,false)){
          const a=hash(i,4,51)*TAU;
          fit(x+Math.cos(a)*r*.95,y+Math.sin(a)*r*.95,r*.62,0,false);
          fit(x-Math.cos(a)*r*.8,y-Math.sin(a)*r*.8,r*.5,1,false);
          break;
        }
      }
    });
    // where the lane squeezes, walls stand close on both sides: a canyon
    for(let j=0;j<N;j+=6) if(path[j].w<lane*.84) for(const sd of [-1,1]){
      const p=path[j], r=120+hash(j,sd,57)*50, off=r+p.w+30;
      fit(p.x-p.ty*sd*off,p.y+p.tx*sd*off,r,1,false);
    }
    for(let k=0;k<(site.isles?30:46);k++) fit(x0-420+hash(k,1,61)*(x1-x0+840),y0-420+hash(k,2,61)*(y1-y0+840),34+hash(k,3,61)*64,hash(k,4,61)>.45?1:0,false);
  }
  if(site.bowl){
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    for(const p of path){if(p.x-p.w<x0)x0=p.x-p.w;if(p.x+p.w>x1)x1=p.x+p.w;if(p.y-p.w<y0)y0=p.y-p.w;if(p.y+p.w>y1)y1=p.y+p.w;}
    x0-=200; y0-=200; x1+=200; y1+=200;
    const wall=(x,y)=>land.push({x,y,r:60,top:0,obj:true});
    for(let x=x0;x<=x1;x+=90){wall(x,y0-60); wall(x,y1+60);}
    for(let y=y0;y<=y1;y+=90){wall(x0-60,y); wall(x1+60,y);}
    site.bowlBox=[x0,y0,x1,y1];
  }
  const marks=(site.marks||[]).map(m=>{
    if(m.f==null) return Object.assign({idx:-1,h:0,w:0},m);
    const idx=((Math.round((rev?1-m.f:m.f)*N)%N)+N)%N, p=path[idx], o={t:m.t,idx,x:p.x,y:p.y,h:p.h,w:p.w,steel:!!m.steel};
    if(m.t==='bridge'||m.t==='arch') for(const sd of [-1,1]) land.push({x:p.x-p.ty*sd*(p.w+34),y:p.y+p.tx*sd*(p.w+34),r:20,top:0,obj:true});
    return o;
  });
  // checkpoints: the point on the course nearest each named place
  const cps=(site.cps||[]).map(c=>{let bi=0,bd=1e18; for(let j=0;j<N;j++){const d=(path[j].x-c[0])**2+(path[j].y-c[1])**2; if(d<bd){bd=d; bi=j;}} return {idx:bi,name:c[2]};});
  if(rev) cps.reverse();
  return {path,N,L,turns,land,marks,cps,zones:site.zones||[]};
}

// The water surface is a handful of travelling waves. Each is [kx, ky, speed in radians a second, height, phase, share felt by a hull]:
// the swell and the big wind chop are ridden in full, the small ripples are mostly for the eye.
function makeWaves(site){
  const w=[], c=site.chop, sw=site.swell, s2=site.swell2, add=(ang,len,spd,amp,ph,feel)=>{const k=TAU/len; w.push([Math.cos(ang)*k,Math.sin(ang)*k,k*spd,amp,ph,feel]);};
  if(sw) add(sw.a,sw.len,sw.c,sw.amp||6,0,1);
  add(.9,150,38,.5+3.4*c,1.3,.7);
  add(2.3,88,30,.35+2.4*c,4.1,.55);
  if(s2) add(s2.a,s2.len,s2.c,s2.amp,2.2,1); else add(-.6,52,24,.25+1.2*c,2.2,.2);
  return w;
}
function waveH(x,y,t,waves,felt,zones){
  let h=0;
  for(const w of waves) h+=(felt?w[5]:1)*w[3]*Math.sin(w[0]*x+w[1]*y-w[2]*t+w[4]);
  // rough patches: the same waves, standing taller round a spot
  if(zones) for(const z of zones){const dx=x-z[0], dy=y-z[1], d=(dx*dx+dy*dy)/(z[2]*z[2]); if(d<6) h*=1+z[3]*Math.exp(-d);}
  return h;
}
function makeWorld(site,rev){
  const C=buildCourse(site,rev), sw=site.swell;
  return {site,rev:!!rev,path:C.path,N:C.N,L:C.L,turns:C.turns,land:C.land,marks:C.marks,cps:C.cps,skis:[],pl:null,t:0,go:false,laps:site.laps,
    env:{chop:site.chop,swell:sw,ux:sw?Math.cos(sw.a):1,uy:sw?Math.sin(sw.a):0,t:0,waves:makeWaves(site),zones:C.zones.length?C.zones:null}};
}

function makeSki(ri,ci,me,p,grid,laneT,idx,lv,md){
  const r=RACERS[ri], c=CRAFTS[ci]; md=md||NOMOD;
  return {name:r.name,full:r.full,num:r.num,craft:c.name,hull:r.hull,trim:r.trim,sh:c.sh,ri,me,ai:!me,
    x:p.x-p.ty*grid,y:p.y+p.tx*grid,h:p.h,vx:0,vy:0,v:0,steer:0,thr:0,brk:0,slip:0,rough:0,lean:0,rpm:1800,
    z:0,vz:0,hw:null,hv0:0,air:0,kick:0,land:0,crook:0,lands:0,soft:0,wakeR:0,wakeCd:0,hops:0,
    top:VMAX*c.top*md.top*(me?1:lv.top),acc:c.acc*md.acc*(me?1:lv.top),launch:r.launch*md.launch,turn:c.turn*r.corner*md.turn*(me?1:lv.grip),stab:c.stab*r.chopR*md.stab,
    skill:me?1:lv.skill,ease:me?0:lv.ease,push:me?0:lv.push,line:me?0:lv.line,band:0,flow:0,lim:1,
    hold:me?.1:.12+Math.max(0,1.16-r.launch)*.8+Math.max(0,1-lv.skill)*.3,seed:ri*1.7,
    idx,lap:0,off:grid,out:0,wrong:0,stuck:0,resc:0,fin:null,bump:0,beach:0,tn:0,tl:0,clean:true,
    laneNow:grid,laneT,dodge:0,bobble:0,sec:-1,trail:[],trailT:0};
}

// line the field up just past the start line: five on the front row with the player, five behind
// order: optional, the riders in the order they finished the last moto; the grid is then lined up in that order,
// the front row first. Without it the player starts on the front row and the rest fill in round them.
function gridUp(W,pr,pc,pace,pm,rm,order){
  const sw=W.path[FRONT].w, k=Math.min(1,(sw-38)/147), front=[-112,56,0,112], back=[-112,-56,0,56,112], lm=W.site.lane-70, lv=rivalSpec(pace);
  let n=0;
  W.skis=[]; W.t=0; W.go=false;
  if(order){
    const slots=[[FRONT,-56],[FRONT,0],[FRONT,56],[FRONT,-112],[FRONT,112],[BACK,-56],[BACK,0],[BACK,56],[BACK,-112],[BACK,112]];
    order.forEach((i,n)=>{
      const q=slots[Math.min(n,slots.length-1)], me=i===pr;
      const s=makeSki(i,me?pc:(i*2+1)%CRAFTS.length,me,W.path[q[0]],q[1]*k,me?0:(hash(i,7,3)*2-1)*lm,q[0],lv,me?pm:rm);
      W.skis.push(s); if(me) W.pl=s;
    });
  }else RACERS.forEach((r,i)=>{
    if(i===pr){W.pl=makeSki(i,pc,true,W.path[FRONT],-56*k,0,FRONT,lv,pm); W.skis.push(W.pl); return;}
    const fr=n<4, idx=fr?FRONT:BACK, g=(fr?front[n]:back[n-4])*k;
    W.skis.push(makeSki(i,(i*2+1)%CRAFTS.length,false,W.path[idx],g,(hash(i,7,3)*2-1)*lm,idx,lv,rm));
    n++;
  });
  for(const t of W.turns) t.wob=0;
  // the first turn buoy each rider will come to
  const first=Math.max(0,W.turns.findIndex(t=>t.idx>FRONT));
  for(const s of W.skis) s.tn=first;
  return W.pl;
}

// rough water at this ski: site chop and swell, less of it for a stable hull
function roughAt(s,env){
  let r=0;
  if(env.chop){
    if(env.swell){
      const w=Math.sin(TAU*((s.x*env.ux+s.y*env.uy)-env.swell.c*env.t)/env.swell.len);
      r=w>.3?(w-.3)/.7:0;
    }else r=.5+.5*Math.sin(s.x*.021+env.t*2.1)*Math.sin(s.y*.017-env.t*1.7);
    r*=env.chop;
  }
  return clamp((r+s.wakeR)/(s.stab*s.stab),0,1);
}

function stepSki(s,dt,env){
  const r=s.rough=roughAt(s,env), sp=s.v, q=Math.min(1,sp/VMAX);
  // Riding the surface. The hull follows the water until the water drops away faster than it can fall, or a wake kicks it up:
  // then it is in the air, with no drive and little steering, until it comes down.
  const hw=waveH(s.x,s.y,env.t,env.waves,true,env.zones), hv=s.hw===null?0:clamp((hw-s.hw)/dt,-90,90), ha=s.hw===null?0:(hv-s.hv0)/dt; s.hw=hw; s.hv0=hv;
  let flying=s.air>0, landed=0;
  if(flying){
    s.vz-=GRAV*dt; s.z+=s.vz*dt; s.air+=dt;
    if(s.z<=hw){landed=Math.max(0,hv-s.vz); s.z=hw; s.vz=hv; s.air=0; flying=false; s.soft=.3;}
  }else{
    // it leaves the water when a wake kicks it up, or when it is climbing and the water under it falls away faster than it can fall: off the top of a wave
    const kick=s.kick; s.kick=0;
    if(kick>KICK&&kick>hv){s.z=hw+kick*dt; s.vz=kick; s.air=dt; flying=true; s.hops++;}
    else if(hv>HOP&&ha<-GRAV){s.z=hw; s.vz=hv; s.air=dt; flying=true; s.hops++;}
    else{s.z=hw; s.vz=hv;}
  }
  if(s.soft>0) s.soft-=dt;
  let c=Math.cos(s.h), sn=Math.sin(s.h), lat=-s.vx*sn+s.vy*c;
  // The bars turn the hull straight away, at much the same rate whatever the speed, only a little heavier flat out.
  // A hull that is sliding swings back toward the way it is going.
  const auth=flying?.3:.6+.4*Math.sqrt(s.thr);
  const w=s.steer*TURN_MAX*s.turn*auth*Math.min(1,sp/50+.3*s.thr)/(1+.45*q*q)+ALIGN*lat/Math.max(sp,80);
  s.h+=w*dt;
  c=Math.cos(s.h); sn=Math.sin(s.h);
  let fwd=s.vx*c+s.vy*sn; lat=-s.vx*sn+s.vy*c;
  // flow and the pack effect lift the top end a little; rough water and leaving the lane pull it down
  const lift=1+.015*s.flow+s.band, top=s.top*lift*(1-.1*r)*s.lim, vt=s.brk?0:IDLE+(top-IDLE)*s.thr;
  if(flying) fwd-=fwd*.05*dt;                                   // nothing drives a hull that is out of the water
  else if(fwd<vt){
    const u=fwd/top, a=A0*s.acc*lift*(fwd<s.top*.5?s.launch:1)*s.thr*(1-.25*r)*(1-u*u);
    fwd=Math.min(vt,fwd+Math.max(0,a)*dt);
  }else fwd+=(vt-fwd)*(s.lim<1?.9:.15+.25*fwd/s.top)*dt;
  if(s.brk&&fwd>0&&!flying) fwd=Math.max(0,fwd-BRAKE_A*dt);
  // Coming down costs speed, and more of it if the bars are turned or the hull is crossed up when it lands: land straight.
  if(landed>0){
    s.crook=1.4*Math.abs(s.steer)+2*Math.abs(lat)/Math.max(60,sp); s.land=landed; s.lands++;
    fwd*=1-Math.min(.14,landed*(.0004+.0014*s.crook));
  }
  // Grip pulls the ski's track round to where it points, but only so hard. Past that it slides, and a slide scrubs speed.
  const cap=flying?0:GRIP*s.turn*(1-.25*r)*(.8+.2*s.thr)*(s.soft>0?.6:1)*dt;
  lat-=clamp(lat*Math.min(1,KLAT*dt),-cap,cap);
  if(fwd>0&&!flying) fwd=Math.max(0,fwd-(.1*Math.abs(w)*fwd+.8*Math.abs(lat))*dt);
  s.vx=fwd*c-lat*sn; s.vy=fwd*sn+lat*c;
  s.x+=s.vx*dt; s.y+=s.vy*dt;
  s.v=Math.hypot(s.vx,s.vy); s.slip=lat;
  s.lean+=(clamp(w*sp/GRIP,-1,1)-s.lean)*Math.min(1,dt*8);
  const load=Math.min(1,sp/s.top);
  const rt=flying?8400:s.thr>.02?3400+2200*s.thr+2600*s.thr*load+r*650*(.5+.5*Math.sin(env.t*23+s.seed)):1800+1500*load;
  s.rpm+=(rt-s.rpm)*Math.min(1,dt*7);
}

// throttle a rider can hold now and still make the turns coming up
function planThr(s,path,N,i0,skill){
  const aLat=GRIP*s.turn*.7*skill, yaw=TURN_MAX*s.turn*.78, n=Math.min(64,10+Math.floor(s.v/5));
  let allow=1e12;
  for(let k=1;k<=n;k++){
    const kk=Math.abs(path[(i0+k)%N].k);
    if(kk<2e-4) continue;
    // the speed a corner can be taken at is set by grip, and in the tightest ones by how fast the hull can be turned
    const vy=yaw/kk, a2=Math.min(aLat/kk,vy*vy)+2*BRAKE*k*DS;
    if(a2<allow) allow=a2;
  }
  return clamp((Math.sqrt(allow)-s.v)/30+.6,0,1);
}

// where a ski is on the course: its place along the lane and how far it sits across it (positive = right of centre)
function track(s,W){
  const path=W.path, N=W.N, hi=s.out>0?8:30;
  let best=s.idx, bd=1e18;
  for(let k=-3;k<=hi;k++){
    const j=(s.idx+k+N)%N, p=path[j], d=(p.x-s.x)*(p.x-s.x)+(p.y-s.y)*(p.y-s.y);
    if(d<bd){bd=d;best=j;}
  }
  if(best<s.idx-N/2) s.lap++; else if(best>s.idx+N/2) s.lap--;
  s.idx=best;
  const p=path[best]; s.off=-(s.x-p.x)*p.ty+(s.y-p.y)*p.tx;
}
function rescue(s,W){
  const p=W.path[s.idx];
  s.x=p.x; s.y=p.y; s.h=p.h; s.vx=p.tx*70; s.vy=p.ty*70; s.v=70; s.steer=0; s.hw=null; s.air=0; s.vz=0; s.kick=0; s.off=0; s.out=0; s.wrong=0; s.stuck=0; s.trail.length=0; s.resc++;
}

// What the player's thumbs ask for, turned into bars, throttle and brake.
// inp: steer -1..1, dig (a side is either held or not), brk. cfg: aids on or off, rate the bars move at.
function playerDrive(s,W,dt,inp,cfg){
  const path=W.path, N=W.N, q=Math.min(1,s.v/VMAX);
  let want=clamp(inp.steer*cfg.lock*(inp.dig?1-.3*q:1),-1,1);
  if(cfg.aids){
    // steering aid: thumbs off, the ski lines itself up with the lane ahead, and it is eased back from the edges
    // On a straight it does that firmly, so a tap moves the ski across and then it runs true again; in a corner it only nudges, and the turning is yours.
    const n=5+Math.floor(s.v/24), a=path[(s.idx+n)%N], lane=Math.min(path[s.idx].w,a.w), e=Math.abs(s.off)/lane-.5;
    let bend=0;
    for(let k=0;k<=n+4;k+=2){const c=Math.abs(path[(s.idx+k)%N].ks); if(c>bend) bend=c;}
    const lim=.6-(.6-cfg.help)*Math.min(1,bend*380);
    const help=clamp(angDiff(a.h,s.h)*1.5-(e>0?(s.off>0?e:-e)*1.6:0),-lim,lim);
    want=clamp(want+help*(1-.75*Math.abs(inp.steer)),-1,1);
  }
  // the bars move at a limited rate, and come back to centre faster than they go to lock
  const back=Math.abs(want)<Math.abs(s.steer)||want*s.steer<0;
  const lim=cfg.rate*(back?2.2:1)*dt;
  s.steer+=clamp(want-s.steer,-lim,lim);
  s.brk=inp.brk?1:0;
  let th=inp.brk?0:1;
  // throttle aid: ease off before a turn the ski could not make flat out
  if(cfg.aids&&th){const a=planThr(s,path,N,s.idx,.92); if(a<th) th=Math.max(a,.4);}
  s.thr=th;
}

// Flow: take a turn buoy on its inside half without having left the lane and the ski carries a little more speed.
// Five steps, all lost by running off course. Returns 1 for a clean buoy, 2 for one passed wide, -1 when flow is lost.
function flowStep(s,W){
  const T=W.turns, N=W.N;
  if(!T.length) return 0;
  let lost=0;
  if(s.out>0){s.clean=false; if(s.flow){s.flow=0; lost=-1;}}
  const t=T[s.tn%T.length];
  if(s.lap*N+s.idx<s.tl*N+t.idx) return lost;
  const clean=s.clean&&(t.right?1:-1)*s.off/W.path[t.idx].w>.25;
  if(clean&&s.flow<5) s.flow++;
  s.clean=true; s.tn++; if(s.tn%T.length===0) s.tl++;
  return lost||(clean?1:2);
}

function aiDrive(s,W,dt){
  const path=W.path, N=W.N;
  // pick a side to go round a ski that is right in front
  const ch=Math.cos(s.h), sh=Math.sin(s.h);
  let side=null, near=1e9;
  for(const o of W.skis){
    if(o===s) continue;
    const dx=o.x-s.x, dy=o.y-s.y, ah=dx*ch+dy*sh, sd=-dx*sh+dy*ch;
    if(ah>8&&ah<140&&Math.abs(sd)<38&&ah<near&&o.v<s.v+20){near=ah; side=sd;}
  }
  if(side!==null) s.dodge+=((side>=0?-50:50)-s.dodge)*Math.min(1,dt*2.5); else s.dodge*=Math.exp(-.8*dt);
  // a quick rider leaves their own lane for the inside of a turn; a slow one holds station round the outside
  // each rival has a line of its own across the lane, squeezed in where the lane narrows
  const look=4+Math.floor(s.v/22), t=path[(s.idx+look)%N], lm=Math.min(t.w,path[s.idx].w,path[(s.idx+look+8)%N].w)-62, tc=path[(s.idx+look+10)%N].c*s.line;
  s.laneNow+=(s.laneT*lm/(W.site.lane-62)*(1-.7*Math.abs(tc))+tc*lm*.8-s.laneNow)*Math.min(1,dt*(tc?1.8:.7));
  const ln=clamp(s.laneNow+s.dodge,-lm,lm);
  const want=Math.atan2(t.y+t.tx*ln-s.y,t.x-t.ty*ln-s.x), tg=clamp(angDiff(want,s.h)*2.6,-1,1);
  s.steer+=clamp(tg-s.steer,-9*dt,9*dt);
  s.thr=planThr(s,path,N,s.idx,s.skill*(1+1.2*Math.max(0,s.band)));          // a rival chasing the player corners harder, as well as running a touch faster
  // the odd lazy moment
  if(s.bobble>0){s.bobble-=dt; s.thr=Math.min(s.thr,.5);}
  else{
    const sec=Math.floor(W.t);
    if(sec!==s.sec){s.sec=sec; if(sec>6&&hash(sec,s.ri,77)<.05*(1.1-s.skill)) s.bobble=.7;}
  }
}

// A bank is a glancing blow: the ski is turned to run along it. What that costs depends on how square the hit was,
// and a ski already running along a bank rides over its bumps for next to nothing.
function glance(s,nx,ny){
  const vn=s.vx*nx+s.vy*ny;
  if(vn>=0) return 0;
  const v=Math.hypot(s.vx,s.vy)||1, inc=-vn/v, rub=s.beach>0;
  let tx=s.vx-vn*nx, ty=s.vy-vn*ny, tl=Math.hypot(tx,ty);
  if(tl<v*.05){tx=-ny; ty=nx; tl=1; if(Math.cos(s.h)*tx+Math.sin(s.h)*ty<0){tx=-tx; ty=-ty;}}
  const k=v*(1-(rub?.08:.5)*inc*inc)/tl;
  s.vx=tx*k; s.vy=ty*k;
  return rub?0:inc*Math.min(1,v/200);
}
function collide(W,dt){
  const skis=W.skis, drag=Math.exp(-.4*dt);
  for(let i=0;i<skis.length;i++) for(let j=i+1;j<skis.length;j++){
    // skis rub and part: nobody is stopped by a touch
    const a=skis[i], b=skis[j], dx=b.x-a.x, dy=b.y-a.y, d2=dx*dx+dy*dy;
    if(d2<1156&&d2>1e-4){
      const d=Math.sqrt(d2), u=(34-d)/2/d;
      a.x-=dx*u; a.y-=dy*u; b.x+=dx*u; b.y+=dy*u;
      const rv=((b.vx-a.vx)*dx+(b.vy-a.vy)*dy)/d;
      if(rv<-50&&a.bump<=0&&b.bump<=0) a.bump=b.bump=.25;
    }
  }
  for(const s of skis){
    for(const g of W.turns){
      const dx=s.x-g.x, dy=s.y-g.y, d2=dx*dx+dy*dy;
      if(d2<576&&d2>1e-4){
        // a turn buoy gives way: the ski slips round it, and the speed that was going into it is partly lost
        const d=Math.sqrt(d2), nx=dx/d, ny=dy/d, vn=s.vx*nx+s.vy*ny;
        s.x=g.x+nx*24; s.y=g.y+ny*24; g.wob=1;
        if(vn<0){
          let tx=-ny, ty=nx;
          if(Math.cos(s.h)*tx+Math.sin(s.h)*ty<0){tx=-tx; ty=-ty;}
          s.vx+=-vn*(nx+.7*tx); s.vy+=-vn*(ny+.7*ty);
          if(vn<-70) s.bump=.3;
        }
      }
    }
    for(const b of W.land){
      const dx=s.x-b.x, dy=s.y-b.y, m=b.r+12;
      if(dx>m||dx<-m||dy>m||dy<-m) continue;
      const d2=dx*dx+dy*dy;
      if(d2<m*m&&d2>1e-4){
        const d=Math.sqrt(d2), nx=dx/d, ny=dy/d;
        s.x=b.x+nx*m; s.y=b.y+ny*m;
        if(glance(s,nx,ny)>.3) s.bump=.3;
        s.vx*=drag; s.vy*=drag; s.beach=.2;
        // the bow is pushed round to run along the bank instead of into it
        const ch=Math.cos(s.h), sh=Math.sin(s.h);
        if(ch*nx+sh*ny<0){
          let tx=-ny, ty=nx;
          if(ch*tx+sh*ty<0){tx=-tx; ty=-ty;}
          s.h+=angDiff(Math.atan2(ty,tx),s.h)*Math.min(1,dt*14);
        }
      }
    }
    if(s.bump>0) s.bump-=dt;
    if(s.beach>0) s.beach-=dt;
  }
}

// one tick of the whole race
function simStep(W,dt){
  const skis=W.skis, N=W.N, P=W.pl, go=W.go;
  if(go) W.t+=dt;
  const t=W.t;
  for(const s of skis) track(s,W);
  // Other riders' wakes. Running along one is rough water; crossing a fresh one kicks the hull into the air, harder the squarer it is hit.
  for(const s of skis){
    let rough=0;
    if(s.wakeCd>0) s.wakeCd-=dt;
    if(go&&s.v>70&&s.air<=0) for(const o of skis){
      if(o===s) continue;
      const tr=o.trail;
      for(let i=tr.length-6;i>=3;i-=3){
        const age=t-tr[i+2]; if(age>WAKE_T) break;
        const dx=s.x-tr[i], dy=s.y-tr[i+1];
        if(dx*dx+dy*dy>484) continue;
        const wx=tr[i+3]-tr[i-3], wy=tr[i+4]-tr[i-2], wl=Math.hypot(wx,wy)||1, cross=Math.abs(s.vx*wy-s.vy*wx)/(wl*s.v), f=1-age/WAKE_T;
        if(cross>.1){if(s.wakeCd<=0){s.kick=Math.max(s.kick,Math.min(30,10+.16*s.v*cross)*(.5+.5*f)); s.wakeCd=.5;}}
        else if(f*.4>rough) rough=f*.4;
        break;
      }
    }
    s.wakeR+=(rough-s.wakeR)*Math.min(1,dt*6);
  }
  const pa=P.lap*N+P.idx;
  for(const s of skis){
    if(s.ai){
      aiDrive(s,W,dt);
      // the pack closes up on the player: rivals behind push, and at the gentler levels rivals ahead ease a touch
      const gap=(pa-(s.lap*N+s.idx))/Math.min(N*.1,80);
      s.band=gap>0?Math.min(1,gap)*s.push:Math.max(-1,gap)*s.ease;
      if(s.fin!=null) s.thr=Math.min(s.thr,.35);
    }
    if(!go||s.hold>0){if(go) s.hold-=dt; s.thr=0; s.brk=0;}
    // outside the lane the engine is held back until the ski is on course again
    const over=Math.abs(s.off)-W.path[s.idx].w;
    s.lim=over>0?1-.5*Math.min(1,over/50):1;
    stepSki(s,dt,W.env);
    if(!go) continue;
    if(s.fin==null&&s.lap>=W.laps) s.fin=t;
    const p=W.path[s.idx];
    s.out=over>6?s.out+dt:0;
    s.wrong=s.v>40&&Math.cos(s.h)*p.tx+Math.sin(s.h)*p.ty<-.3?s.wrong+dt:0;
    s.stuck=s.v<12&&s.hold<=0&&s.thr>.2?s.stuck+dt:0;
    // nobody is left lost: a ski that stays off course, turns round or parks on a bank is put back in the lane
    if(!s.nores&&(s.out>2.6||over>360||s.wrong>1.4||s.stuck>1.6)) rescue(s,W);
    s.trailT-=dt;
    if(s.trailT<=0&&s.v>30){s.trailT=TRAIL_DT; s.trail.push(s.x-Math.cos(s.h)*20,s.y-Math.sin(s.h)*20,t);}
    while(s.trail.length&&t-s.trail[2]>TRAIL_LIFE) s.trail.splice(0,3);
  }
  collide(W,dt);
}

// ---------- drag racing ----------
const DRAGK=[4.5,2.2,.3];
// Two identical skis side by side on a straight 1,000-foot strip, from a standing start on a pro tree: the ambers light
// together and the green follows four tenths later. The race is the reaction. Once a rider goes, the ski runs flat out on its own.
// Drag parts only count on the strip. fx as for PARTS: percent per level on top speed, acceleration, launch, turning, rough water.
const DRAG_PARTS=[
  {name:'Launch control',by:'Dean Strong',note:'Holds the revs on the line, so it hooks up the instant you go',fx:[0,0,DRAGK[0],0,0],cost:[800,1800,3500]},
  {name:'Drag impeller and nozzle',note:'Steeper bite down the strip',fx:[0,DRAGK[1],0,0,0],cost:[900,2000,3800]},
  {name:'Drag ride plate',note:'Lifts the hull for less drag at the top end',fx:[DRAGK[2],0,0,0,0],cost:[700,1600,3000]}];
function dragMod(md,levels){
  const m=Object.assign({},md), k=['top','acc','launch','turn','stab'];
  DRAG_PARTS.forEach((p,i)=>{const l=levels[i]||0; k.forEach((key,j)=>{m[key]*=1+p.fx[j]*l/100;});});
  return m;
}
const FT=.4502, DRAG_D=Math.round(1000/FT), DRAG_LANE=40, TREE=.4;
const DRAG_SITE={id:'drag',name:'Havasu Drag Strip',sub:'1,000 feet, two lanes, a pro tree.',laps:1,chop:.1,swell:null,lane:150,drag:true,
  ctrl:[[600,4000],[600,3000],[600,2000],[600,1000],[600,0],[650,-700],[1000,-1050],[1350,-700],[1400,0],[1400,1000],[1400,2000],[1400,3000],[1350,4700],[1000,5050],[650,4700]],
  shore:{x:-70,y0:-1400,y1:5600},land:[],zones:[],marks:[{t:'tower',x:150,y:1620},{t:'light',x:1000,y:-1300}],boats:[[.08,.3,1]]};
// each round's rival leaves quicker: [best reaction, spread, chance of a red light]
// Trim: three times down the strip a light comes on (at these fractions of top speed). Tap it quick and the hull trims up and runs
// freer for the rest of the run: TRIM_G is the most one trim can add, for a tap inside TRIM_BEST, falling to nothing at TRIM_LATE.
const TRIM_AT=[.42,.64,.82], TRIM_G=.012, TRIM_BEST=.12, TRIM_LATE=.5;
function trimGain(rt){return rt==null||rt<0?0:TRIM_G*clamp((TRIM_LATE-rt)/(TRIM_LATE-TRIM_BEST),0,1);}
// each round's rival: how quick its trim taps are [best, spread]
const DRAG_TRIM=[[.2,.18],[.16,.14],[.13,.12]];
const DRAG_RIVAL=[[.17,.2,.03],[.08,.15,.04],[.04,.12,.06]];
function dragRT(round,rnd){const q=DRAG_RIVAL[Math.min(round,DRAG_RIVAL.length-1)]; return rnd()<q[2]?-(.01+rnd()*.05):q[0]+rnd()*q[1];}
// the two riders on the line, on the same craft with the same build
function dragGrid(W,pr,pc,orr,pm,rt,rm){
  const p=W.path[FRONT], lv=rivalSpec(1);
  W.skis=[]; W.t=0; W.go=false; W.finIdx=FRONT+Math.round(DRAG_D/DS);
  const me=makeSki(pr,pc,true,p,-DRAG_LANE,0,FRONT,lv,pm), o=makeSki(orr,pc,false,p,DRAG_LANE,0,FRONT,lv,rm||pm);
  // the rival is your equal in machine and rider: only its drag parts differ
  const q=rm||pm; o.top=me.top/pm.top*q.top; o.acc=me.acc/pm.acc*q.acc; o.launch=me.launch/pm.launch*q.launch; o.turn=me.turn; o.stab=me.stab;
  for(const s of [me,o]){s.go=null; s.lc=s.off; s.dist=0; s.trap=0; s.top0=s.top; s.acc0=s.acc; s.bst=0; s.tk=0; s.ton=null; s.trims=[]; s.lock=false; s.lost=0;}
  o.rt=rt; W.skis.push(me,o); W.pl=me;
  return me;
}
// one step of a run. W.t is the time since the green: negative before it. launch is true once the player has gone.
// tap: true on a step where the player has just tapped (after launching). rnd: the rival's trim taps.
function dragStep(W,dt,launch,tap,rnd){
  const path=W.path, N=W.N;
  W.t+=dt; W.go=W.t>=0;
  for(const s of W.skis){
    track(s,W);
    const p=path[s.idx];
    s.steer=clamp(-(s.off-s.lc)*.012-angDiff(s.h,p.h)*2.4,-1,1);          // each ski holds its own lane
    if(s.go==null&&(s.me?launch:W.t>=s.rt)) s.go=W.t;
    const on=s.go!=null&&!(s.fin!=null&&W.t>s.fin+.4);
    s.thr=on?1:0; s.brk=s.go==null?1:0; s.lim=1; s.band=0;
    // the trim light: it comes on at its speed and waits for a tap; too slow and the chance is gone
    if(s.go!=null&&s.fin==null&&s.tk<TRIM_AT.length){
      // a tap with no light on is early, and costs the next trim: no mashing
      if(s.me&&tap&&s.ton==null) s.lock=true;
      else if(s.me&&s.lock&&s.v>=TRIM_AT[s.tk]*s.top0){s.lock=false; s.lost++; s.trims.push(null); s.tk++;}
      if(s.tk<TRIM_AT.length&&s.ton==null&&s.v>=TRIM_AT[s.tk]*s.top0){s.ton=W.t; if(!s.me) s.trt=(rnd||Math.random)()*DRAG_TRIM[W.round||0][1]+DRAG_TRIM[W.round||0][0];}
      if(s.ton!=null){
        const el=W.t-s.ton, hit=s.me?tap:el>=s.trt;
        if(hit||el>=TRIM_LATE){const r=hit?el:null; s.trims.push(r); s.bst+=trimGain(r); s.tk++; s.ton=null; s.top=s.top0*(1+s.bst); s.acc=s.acc0*(1+2*s.bst);}
      }
    }
    stepSki(s,dt,W.env);
    // how far down the strip, and the moment it crosses the line
    const d=(s.lap*N+s.idx-FRONT)*DS+(s.x-p.x)*p.tx+(s.y-p.y)*p.ty;
    if(s.fin==null&&d>=DRAG_D){s.fin=W.t-(d-DRAG_D)/Math.max(1,s.v); s.trap=s.v;}
    s.dist=d;
    s.trailT-=dt;
    if(s.trailT<=0&&s.v>30){s.trailT=TRAIL_DT; s.trail.push(s.x-Math.cos(s.h)*20,s.y-Math.sin(s.h)*20,W.t);}
    while(s.trail.length&&W.t-s.trail[2]>TRAIL_LIFE) s.trail.splice(0,3);
  }
}
//</core>

const $=id=>document.getElementById(id);
const cv=$('sea'), gcv=$('gl');
let ctx=cv.getContext('2d');
const el={};
for(const id of ['pos','posN','lap','lapN','time','mph','rpm','revFill','flow','flash','pauseBtn','gapA','gapB',
  'banner','banT','banH','start','result','pause','go','quit','again','swap','place','board','sum','stats','setup','resEyebrow',
  'padL','padR','hud','list','rules','panel','ride','modeS','modeT','tabR','tabC','tabS','tabH','optsMore','optsPause',
  'lvLabel','resume','restart','toSetup','garage','tabG','modeD','modeI','modeC','podBtn','cer','cerEyebrow','cerTitle','cerList','cerGo','toCity','startEyebrow']) el[id]=$(id);
const COL={foam:'#f1fbf8',ink:'#06202a',red:'#e4392c',yellow:'#ffc62a'};
const KEY='holeshot.';
const RSTAT=[['launch','Launch',.9,1.16],['corner','Corners',.9,1.16],['chopR','Rough',.9,1.18]];
const CSTAT=[['top','Speed',.94,1.06],['acc','Accel',.8,1.2],['turn','Turn',.8,1.2],['stab','Stable',.75,1.35]];
// The tour is a season of race weekends, ending at Havasu. Each weekend is two motos on the same course: moto points add up to the
// weekend overall, and the weekend overall pays series points on the same scale.
const TOUR=[[6,false],[10,false],[2,false],[9,false],[3,false],[7,false],[4,false],[8,false],[0,false]], PTS=[25,20,16,13,11,9,7,5,3,1], MOTOS=TOUR.length*2;
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
let lapSeen=0,lapStart=0,bestLap=0,rescSeen=0,landSeen=0,cpSeen=new Set();
let stat={vmax:0,clean:0,turns:0,off:0,rough:0};
let camX=0,camY=0,camA=0,zoom=.6,shake=0,gapT=0,tagA=null,tagB=null,idleS=0,revShown=-1,flowShown=-1,SK=1;
let QUAL=2,slowT=0,ftAvg=.016,calmT=1,acc=0,padL=false,padR=false,bothT=0,lastSide=0;
const V={ox:0,oy:0,c:1,s:0,rot:0};
const keys={left:false,right:false,lift:false}, ptrs=new Map(), inp={steer:0,dig:true,brk:0};
let stick=null;
const snd={ac:null};

function store(k,v){try{localStorage.setItem(KEY+k,String(v));}catch(e){}}
function load(k){try{return localStorage.getItem(KEY+k);}catch(e){return null;}}
// "1 lap", "3 laps"
function lapsTxt(n){return n+(n===1?' lap':' laps');}
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
  if(site.beach){
    const B=site.beach; let q=0;
    for(let y=B.y0;y<B.y1;y+=52){
      q++;
      const x=B.x+80+(hash(q,3,23)-.5)*60, ci=Math.floor(hash(q,5,23)*6);
      if(inLand(x,y,30)) PROPS.push(hash(q,4,23)<.25?{t:0,x,y,ci,a:Math.PI/2+(hash(q,6,23)-.5)*.3,s:17}:{t:1,x,y,ci,a:0,s:13});
    }
  }
  if(site.banks||site.rocks||site.isles||site.island) LAND.forEach((b,i)=>{
    if(b.r<72||!b.top) return;
    const n=site.banks?3:site.isles?4:site.island?1:2;
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
function saveGar(){store(PKEY('garage1'),JSON.stringify(gar));}
function loadGar(){
  // the city's garage holds no cash of its own: its money is the city's, so only the class and the builds are read back
  try{
    const g=JSON.parse(load(PKEY('garage1')));
    if(!g||!(g.cls>=0&&g.cls<CLASSES.length)||!g.crafts||typeof g.crafts!=='object') return;
    if(HX.on){gar.cls=g.cls; gar.crafts=g.crafts;} else if(g.cash>=0) gar=g;
  }catch(e){}
}
function playerMod(){const b=build(myCraft()), cap=CLASSES[gar.cls].cap; const m=garageMod(b.p.map(l=>Math.min(l,cap)),b.s,b.w); m.top*=HX.top; m.turn*=HX.turn; return m;}
// the field is built to the limit of the class
function rivalMod(){const cap=CLASSES[gar.cls].cap; return garageMod(PARTS.map(()=>cap),null,null);}
function serviceCost(k,b){return Math.round((SERVICE[k]+(k===1?250*b.p[3]:0))*HX.svc/10)*10;}
function garChanged(){if(mode==='idle') reset(); summary(); buildGarage();}
function buildGarage(){
  const box=el.garage, b=build(myCraft()), cap=CLASSES[gar.cls].cap;
  const E=(tag,cls,txt)=>{const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; if(tag==='button') e.type='button'; return e;};
  box.textContent='';
  const top=E('div','gtop'); top.append(E('span','eyebrow','Working on '+CRAFTS[myCraft()].name),E('span','cash',money(gar.cash))); box.appendChild(top);
  const cl=E('div','tabs three');
  CLASSES.forEach((c,i)=>{const t=E('button','tab',c.name); t.id='cls'+i; t.setAttribute('aria-pressed',String(i===gar.cls)); t.addEventListener('click',()=>{gar.cls=i; saveGar(); garChanged();}); cl.appendChild(t);});
  box.append(cl,E('p','fine',CLASSES[gar.cls].name+' class: parts count up to level '+cap+', and the whole field is built to that limit. A win against Pro rivals pays '+money(PURSE[0]*CLASSES[gar.cls].pay)+'.'));
  // in the city, parts are bought at Tommy's Garage only, at whatever price the city has earned there
  box.appendChild(E('div','eyebrow',HX.shop?'Parts'+(HX.disc<1?' · '+Math.round((1-HX.disc)*100)+'% off, shop price':''):'Parts · bought and fitted at Tommy\'s Garage'));
  PARTS.forEach((p,i)=>{
    const row=E('div','grow'), l=b.p[i], left=E('div'), nm=E('b',null,p.name), pips=E('span','pips');
    for(let k=0;k<3;k++){const d=E('i'); if(k<l) d.className=k<cap?'on':'over'; pips.appendChild(d);}
    nm.appendChild(pips);
    left.append(nm,E('small',null,(p.by?p.by+'. ':'')+p.note+'.'+(l>cap?' Above the class limit: level '+l+' does not count here.':'')));
    const bt=E('button','gbtn',l>=3?'Maxed':'Level '+(l+1)+' '+money(pcost(p,l))); bt.id='buy'+i; bt.disabled=l>=3||!HX.shop||gar.cash<pcost(p,l);
    bt.addEventListener('click',()=>{const n=b.p[i]; if(n<3&&HX.shop&&gar.cash>=pcost(p,n)){gar.cash-=pcost(p,n); b.p[i]=n+1; saveGar(); blip(660,.08,'square',.08); garChanged();}});
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
    const bt=E('button','gbtn',l>=3?'Maxed':'Level '+(l+1)+' '+money(pcost(p,l))); bt.id='dbuy'+i; bt.disabled=l>=3||!HX.shop||gar.cash<pcost(p,l);
    bt.addEventListener('click',()=>{const n=b.d[i]; if(n<3&&HX.shop&&gar.cash>=pcost(p,n)){gar.cash-=pcost(p,n); b.d[i]=n+1; saveGar(); blip(660,.08,'square',.08); garChanged();}});
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
  parts=[]; lapSeen=0; lapStart=0; bestLap=0; rescSeen=0; finT=0; cpSeen=new Set();
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
  autoPace=clamp(autoPace+d,0,1); store(PKEY('o8.pace'),autoPace.toFixed(3));
  return autoPace-was;
}

// tour.round counts motos: the weekend is round/2, and an odd round means moto 2 is next
function tourLive(){return tour.round>0&&tour.round<MOTOS;}
function tStop(){return Math.min(TOUR.length-1,Math.floor(tour.round/2));}
function freshTour(){return {round:0,pts:RACERS.map(()=>0),wk:RACERS.map(()=>0),m1:null,m2:null,last:null,hist:[],r:sel.r,c:sel.c};}
function saveTour(){store(PKEY('tour13'),JSON.stringify(tour));}
function loadTour(){
  try{
    const t=JSON.parse(load(PKEY('tour13')));
    if(t&&Array.isArray(t.pts)&&t.pts.length===RACERS.length&&Array.isArray(t.wk)&&t.wk.length===RACERS.length&&Array.isArray(t.hist)&&t.round>=0&&t.round<=MOTOS&&(t.round%2===0||Array.isArray(t.m1))&&
       t.r>=0&&t.r<RACERS.length&&t.c>=0&&t.c<CRAFTS.length) tour=t;
  }catch(e){}
}
// Book one moto. ris: the racers in finishing order. out, if given, is a rider who did not finish and scores nothing.
function tourScore(ris,out){
  const moto=tour.round%2;
  if(moto===0){tour.wk=RACERS.map(()=>0); tour.m1=null; tour.m2=null;}
  ris.forEach((ri,i)=>{if(ri!==out) tour.wk[ri]+=PTS[i];});
  if(moto===0) tour.m1=ris.slice();
  else{
    // the weekend overall: moto points added up, a tie going to whoever finished moto 2 ahead. It pays series points.
    tour.m2=ris.slice();
    const p1=RACERS.map(()=>0), p2=RACERS.map(()=>0);
    tour.m1.forEach((ri,i)=>{p1[ri]=i+1;}); tour.m2.forEach((ri,i)=>{p2[ri]=i+1;});
    const ord=RACERS.map((r,i)=>i).sort((a,b)=>tour.wk[b]-tour.wk[a]||p2[a]-p2[b]);
    ord.forEach((ri,i)=>{tour.pts[ri]+=PTS[i];});
    tour.last={stop:tStop(),ord,wk:tour.wk.slice(),p1,p2};
    tour.hist.push(ord.indexOf(tour.r)+1);
  }
  tour.round++; saveTour();
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
  el.banT.textContent=what+site.name+(rev?' reverse':'')+' · '+lapsTxt(LAPS);
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
  if(inTour) tourScore(rows.map(r=>r.ri));
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
  const gb=build(myCraft()), prize=Math.round(PURSE[p-1]*CLASSES[gar.cls].pay*(.3+.7*racePace)*HX.purse/10)*10;
  gar.cash+=prize;
  gb.w[0]=Math.max(0,gb.w[0]-(4+.2*stat.rough)); gb.w[1]=Math.max(0,gb.w[1]-(3+1.5*gb.p[3])); gb.w[2]=Math.max(0,gb.w[2]-(3+1.2*stat.off+.1*stat.rough));
  saveGar();
  const tired=Math.min(gb.w[0],gb.w[1],gb.w[2])<60?' Your ski needs work: see the Garage.':'';
  el.sum.textContent='Your time '+fmt(finT)+'. Prize '+money(prize)+'.'+(record&&best>0?' New personal best here.':'')+tired+tip;
  el.podBtn.hidden=inTour;
  if(inTour){el.again.textContent=moto?'Weekend overall':'Weekend standings'; resAction=showWeekend; el.swap.hidden=true;}
  else if(HX.on){el.again.textContent='Back to the city'; resAction=hsExit; el.swap.hidden=true;}
  else{el.again.textContent='Race again'; resAction=startCountdown; el.swap.hidden=false;}
  resAt=clock+(p===1?4.4:1.1);
  if(p===1) celebrate(true);
  // the city hears about an open race at the flag, and about a weekend once moto 2 is in
  if(HX.on){
    HX.won+=prize;
    if(!inTour) hsDone({kind:'open',p,prize,site:site.name,dnf:0});
    else if(moto) hsDone(weekendRes(0));
  }
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
      rows:order.slice(0,3).map(i=>({ri:i,name:RACERS[i].full+(i===tour.r?' (you)':''),val:tour.pts[i]+' pts'})),after:HX.on?hsExit:backToSetup});
  }else{
    const st=TOUR[tStop()];
    el.sum.textContent='Next: round '+(tStop()+1)+' of '+TOUR.length+' at '+SITES[st[0]].name+', two motos.';
    el.again.textContent='Next weekend'; resAction=startCountdown; el.swap.hidden=false;
    // in the city the next weekend is five days off, and a lot can happen in five days
    if(HX.on){el.sum.textContent='Next: round '+(tStop()+1)+' of '+TOUR.length+' at '+SITES[st[0]].name+', in five days.'; el.again.textContent='Back to the city'; resAction=hsExit; el.swap.hidden=true;}
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
  if(HX.on) Object.assign(wd.skis[1],MARCUS);
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
  el.banT.textContent=(HX.on?'Grudge run':ROUNDS[ladder.round])+' · you vs '+ais[0].name;
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
  el.place.textContent=win?(round===2&&!HX.on?'Winner':'Win'):pf?'Red light':'Loss';
  el.resEyebrow.textContent=(HX.on?'Grudge run':ROUNDS[round])+' · Havasu Drag Strip';
  statCells([['Reaction',rt==null?'–':rt<0?'Red':rt.toFixed(3)],['1,000 ft',et==null?'–':et.toFixed(2)],['Trap',pl.trap?Math.round(pl.trap*MPH)+' mph':'–'],['Margin',mar==null?'–':mar.toFixed(3)]]);
  const tr=s=>s.trims.length?' · trims '+s.trims.map(x=>x==null?'miss':x.toFixed(2).replace(/^0/,'')).join(' '):'';
  const row=(s,me)=>({name:s.full+(me?' (you)':''),craft:'RT '+(s.go==null?'–':s.go<0?'red light':s.go.toFixed(3))+tr(s),val:s.fin!=null?s.fin.toFixed(3):'–',extra:'',me});
  board(win?[row(pl,true),row(o,false)]:[row(o,false),row(pl,true)]);
  const pay=CLASSES[gar.cls].pay, prize=Math.round((win?DRAG_PAY[round]:150)*pay*HX.purse/10)*10, gb=build(myCraft());
  gar.cash+=prize; gb.w[0]=Math.max(0,gb.w[0]-1.5); gb.w[1]=Math.max(0,gb.w[1]-(1+.6*gb.p[3])); gb.w[2]=Math.max(0,gb.w[2]-1.5); saveGar();
  let tip='';
  if(pf) tip=' You went '+(-rt).toFixed(3)+' before the green.';
  else if(!win&&rt!=null&&pl.trims.some(x=>x==null||x>.3)) tip=pl.lost?' Tap only when the trim light is on: an early tap costs you the next trim.':' Hit the trim lights quicker: each slow or missed one gives away speed for the rest of the run.';
  else if(!win&&rt!=null&&build(myCraft()).d.some(l=>l<ladder.round)) tip=' Your rival had more drag parts. See Drag parts in the Garage.';
  else if(!win&&rt!=null&&rt>.15) tip=' The ambers come exactly four tenths before the green: start your thumb moving on them.';
  else if(!win&&rt!=null) tip=' Close. A few hundredths sooner off the tree wins it.';
  el.sum.textContent=(win&&round===2?'You won the ladder. ':'')+'Prize '+money(prize)+'.'+tip;
  if(HX.on){
    el.sum.textContent=(win?'You beat Marcus to the line.':'Marcus takes it.')+tip;
    el.again.textContent='Back to the city'; resAction=hsExit; el.swap.hidden=true; el.podBtn.hidden=true; resAt=clock+1.3;
    hsDone({kind:'drag',win,red:pf,dnf:0}); return;
  }
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

// ---------- arcade modes ----------
// Items: a race with item boxes and coins. Crates: a solo run down the course smashing crates, jumping ramps and dodging mines.
const ITEMS={boost:{name:'Turbo',col:'#ff8a3c'},mine:{name:'Mine',col:'#e4392c'},torp:{name:'Torpedo',col:'#38c6f4'},shield:{name:'Shield',col:'#2de0b0'}};
let objs=[], arc=null;
const isArc=()=>gmode==='items'||gmode==='crates';
function lanePt(j,o){const p=PATH[((j%N)+N)%N]; return {x:p.x-p.ty*o,y:p.y+p.tx*o,p};}
function addObj(t,j,o,extra){const q=lanePt(j,o), ob=Object.assign({t,x:q.x,y:q.y,j:((j%N)+N)%N,o,h:0,alive:true,resp:0,rot:hash(j,o|0,5)*TAU},extra||{}); objs.push(ob); return ob;}
// how sharp the course is around index j
function bendAt(j,n){let k=0; for(let i=0;i<n;i++) k=Math.max(k,Math.abs(PATH[(j+i)%N].k)); return k;}
// predicted height of a ski launched off a ramp at speed v, dj path steps later
function rampArc(dj,v){const t=dj*DS/v, k=RAMP_KICK+.1*v; return Math.max(0,k*t-.5*GRAV*t*t);}
const RAMP_KICK=55;

function arcadeSetup(){
  objs=[]; arc={t:gmode,got:0,total:0,lives:3,cp:FRONT,cps:[],imm:0,hitSeen:0};
  for(const s of skis){s.top0=s.top; s.acc0=s.acc; s.coins=0; s.item=null; s.itemT=0; s.boost=0; s.spin=0; s.spinV=0; s.shield=0; s.rampCd=0; s.hits=0;}
  if(gmode==='crates'){
    // a solo run: the rivals stay at home, and one lap is the whole level
    for(const s of skis) if(!s.me&&s.g3){s.g3.visible=false; if(s.g3s) s.g3s.visible=false;}
    wd.skis=[pl]; skis=[pl]; ais=[]; wd.laps=1; LAPS=1;
    // checkpoints every fifth of a lap, or closer on a long lap, so a lost life never sends you far back
    const nc=Math.max(4,Math.floor(N/200));
    for(let c=1;c<=nc;c++) arc.cps.push(Math.round(FRONT+(N-FRONT)*c/(nc+1)));
    for(const j of arc.cps) for(const sd of [-1,1]) addObj('cp',j,sd*(PATH[j].w+6));
    const v=pl.top*.92;
    for(let j=FRONT+24;j<N-14;){
      const w=PATH[j].w, bend=bendAt(j,14), r=hash(j,3,91), inside=PATH[(j+6)%N].c;
      if(arc.cps.some(c=>j>=c-4&&j<c+14)){j+=6; continue;}
      if(bend>1/240){
        // a corner: crates on the inside line, nothing to hit
        for(let i=0;i<4;i++) addObj('crate',j+i*2,inside*w*.5);
        j+=12;
      }else if(r<.3&&bendAt(j,14)<1/380){
        // a ramp with crates hung in the air along the jump
        addObj('ramp',j,0);
        for(const dj of [5,8,11]) addObj('crate',j+dj,0,{h:Math.max(4,rampArc(dj,v)-2),air:true});
        j+=22;
      }else if(r<.47){
        // a line of crates on one side, with a mine guarding the other
        const o=(hash(j,4,91)<.5?-1:1)*w*.45;
        for(let i=0;i<4;i++) addObj('crate',j+i*2,o);
        addObj('mine',j+3,-o*.9);
        j+=15;
      }else if(r<.62){
        // a row of mines with one gap to thread
        const gap=Math.floor(hash(j,5,91)*3);
        for(let i=0;i<3;i++) if(i!==gap) addObj('mine',j,(i-1)*w*.55);
        addObj('crate',j+3,(gap-1)*w*.55);
        j+=16;
      }else{
        // a zigzag of crates across the lane
        for(let i=0;i<5;i++) addObj('crate',j+i*2,(i%2?1:-1)*w*.35);
        j+=16;
      }
    }
    arc.total=objs.filter(o=>o.t==='crate').length;
  }else{
    // three rows of item boxes and 14 coin groups a lap, or more on a long lap so they come as often as on the others
    const nb=Math.max(3,Math.floor(3*N/750)), ng=Math.max(14,Math.floor(14*N/750));
    for(let b=0;b<nb;b++){const j=Math.round(N*(nb===3?[.2,.5,.8][b]:(b+.5)/nb)), w=PATH[j].w; for(let i=0;i<5;i++) addObj('box',j,(i-2)*w*.36);}
    for(let c=0;c<ng;c++){
      const j=Math.round(FRONT+20+(N-40)*(c+.5)/ng), o=PATH[(j+4)%N].c*PATH[j].w*.4*(hash(c,2,93)<.6?1:-1);
      for(let i=0;i<3;i++) addObj('coin',j+i*2,o,{h:3});
    }
  }
  if(G.on) g3Arcade();
}
function pickItem(s){
  const order=skis.slice().sort((a,b)=>(b.lap*N+b.idx)-(a.lap*N+a.idx)), r=skis.length>1?order.indexOf(s)/(skis.length-1):1;
  const w=[['boost',.15+.35*r],['torp',.4*r],['mine',.45-.3*r],['shield',.35-.25*r]];
  let x=Math.random()*w.reduce((a,b)=>a+b[1],0);
  for(const q of w){x-=q[1]; if(x<=0) return q[0];}
  return 'boost';
}
function useItem(s){
  const it=s.item; if(!it) return; s.item=null;
  if(it==='boost'){s.boost=1.6; if(s.me){blip(980,.25,'sawtooth',.1); buzz(15);}}
  else if(it==='shield') s.shield=8;
  else if(it==='mine'){const c=Math.cos(s.h), sn=Math.sin(s.h), o={t:'mine',x:s.x-c*44,y:s.y-sn*44,j:s.idx,o:0,h:0,alive:true,resp:0,rot:0,owner:s,arm:1,life:30}; objs.push(o); if(G.on) g3Obj(o);}
  else if(it==='torp'){
    const me=s.lap*N+s.idx; let tg=null, bd=1e9;
    for(const o of skis) if(o!==s&&o.fin==null){const d=o.lap*N+o.idx-me; if(d>0&&d<bd){bd=d; tg=o;}}
    const c=Math.cos(s.h), sn=Math.sin(s.h), o={t:'torp',x:s.x+c*30,y:s.y+sn*30,h:s.h,idx:s.idx,alive:true,owner:s,target:tg,life:7,rot:0};
    objs.push(o); if(G.on) g3Obj(o);
    if(s.me) blip(500,.2,'square',.08);
  }
  if(s.me) flash(ITEMS[it].name,'',600);
}
function hitSki(s,what){
  if(s.spin>0) return;
  if(s.shield>0){s.shield=0; if(s.me) flash('Blocked','',700); return;}
  s.spin=1.1; s.vx*=.35; s.vy*=.35; s.kick=Math.max(s.kick,32); s.coins=Math.max(0,s.coins-3); s.hits++;
  if(s.me){flash(what,'bad',900); shake=Math.max(shake,4); buzz(40); blip(110,.35,'sawtooth',.14);}
}
// Slide boost: hold a hard turn at speed and a charge builds. Let go once it has passed the first mark for a short burst,
// or past the second for a longer one. Rivals take one now and then out of the tight corners.
const SLIDE_A=.6, SLIDE_B=1.2;
function slideStep(dt){
  const s=pl, hard=Math.abs(inp.steer)>.5&&s.v>120&&s.air<=0&&s.spin<=0;
  if(hard){s.slideT=(s.slideT||0)+dt; s.slideSd=Math.sign(inp.steer);}
  else if(s.slideT>0){
    if(s.slideT>=SLIDE_A){const big=s.slideT>=SLIDE_B; s.boost=Math.max(s.boost,big?.9:.5); flash(big?'Big slide boost':'Slide boost','',600); blip(big?1100:900,.15,'sawtooth',.09); buzz(12);}
    s.slideT=0;
  }
  for(const a of ais) if(a.boost<=0&&a.v>120&&Math.abs(PATH[(a.idx+2)%N].k)>1/260&&Math.random()<dt*.5*a.skill) a.boost=.5;
}
// before the physics step: what boost, coins and a spin-out do to each ski's speed
function arcadePre(dt){
  if(gmode==='items') slideStep(dt);
  for(const s of skis){
    if(s.boost>0) s.boost-=dt;
    if(s.spin>0){s.spin-=dt; s.spinV=TAU*Math.min(1,(1.1-s.spin)/.9);} else s.spinV=0;
    if(s.shield>0) s.shield-=dt;
    if(s.rampCd>0) s.rampCd-=dt;
    const m=(1+.012*s.coins)*(s.boost>0?1.3:1)*(s.spin>0?.35:1);
    s.top=s.top0*m; s.acc=s.acc0*(s.boost>0?2.2:1)*(s.spin>0?.5:1);
  }
}
// after the physics step: pickups, hits, ramps, moving objects
function arcadeStep(dt){
  if(arc.imm>0) arc.imm-=dt;
  for(const o of objs){
    if(!o.alive){if(o.resp>0&&(o.resp-=dt)<=0) o.alive=true; continue;}
    if(o.brk!=null) continue;
    if(o.t==='torp'){
      o.life-=dt; if(o.life<=0){o.alive=false; o.dead=true; continue;}
      // follow the lane, and home in once the target is close
      let best=o.idx, bd=1e18;
      for(let k=-2;k<=12;k++){const j=(o.idx+k+N)%N, p=PATH[j], d=(p.x-o.x)**2+(p.y-o.y)**2; if(d<bd){bd=d; best=j;}}
      o.idx=best;
      const tg=o.target&&o.target.fin==null?o.target:null, p=PATH[(o.idx+5)%N];
      let ax=p.x, ay=p.y;
      if(tg&&Math.hypot(tg.x-o.x,tg.y-o.y)<600){ax=tg.x; ay=tg.y;}
      o.h+=clamp(angDiff(Math.atan2(ay-o.y,ax-o.x),o.h),-4*dt,4*dt);
      const sp=VMAX*1.55; o.x+=Math.cos(o.h)*sp*dt; o.y+=Math.sin(o.h)*sp*dt;
    }
    if(o.t==='mine'&&o.life!=null){o.life-=dt; if(o.arm>0) o.arm-=dt; if(o.life<=0){o.alive=false; o.dead=true; continue;}}
    for(const s of skis){
      const dx=s.x-o.x, dy=s.y-o.y, d2=dx*dx+dy*dy, hop=s.air>0?s.z-s.hw:0;
      if(o.t==='crate'){
        if(d2<24*24&&(o.air?(s.air>0&&Math.abs(hop-o.h)<9):hop<8)){o.alive=false; o.brk=0; arc.got++; blip(620+arc.got%5*60,.06,'square',.07); if(G.on) g3Spark(o);}
      }else if(o.t==='mine'){
        if(d2<20*20&&hop<6&&!(o.owner===s&&o.arm>0)){
          if(gmode==='crates'){if(arc.imm<=0) loseLife();}
          else{hitSki(s,'Mine'); o.alive=false; o.dead=!!o.life; o.resp=o.life?0:6;}
          if(G.on) g3Boom(o);
        }
      }else if(o.t==='ramp'){
        const p=PATH[o.j], along=dx*p.tx+dy*p.ty, across=-dx*p.ty+dy*p.tx;
        if(s.air<=0&&s.rampCd<=0&&Math.abs(along)<22&&Math.abs(across)<40){s.kick=Math.max(s.kick,RAMP_KICK+.1*s.v); s.rampCd=1.5; if(s.me){blip(300,.3,'sine',.12); flash('Air!','',600);}}
      }else if(o.t==='box'){
        if(d2<22*22&&hop<8){o.alive=false; o.resp=.5; if(!s.item){s.item=pickItem(s); s.itemT=.6+Math.random()*1.8; if(s.me){flash(ITEMS[s.item].name,'',700); blip(880,.08,'square',.08);}}}
      }else if(o.t==='coin'){
        if(d2<20*20&&hop<10){o.alive=false; o.resp=8; if(s.coins<10){s.coins++; if(s.me) blip(1200,.05,'sine',.06);}}
      }else if(o.t==='torp'){
        if(s!==o.owner&&d2<22*22){hitSki(s,'Torpedo'); o.alive=false; o.dead=true; if(G.on) g3Boom(o); break;}
      }
    }
  }
  for(let i=objs.length-1;i>=0;i--) if(objs[i].dead){if(objs[i].m&&G.on) g3Drop(objs[i]); objs.splice(i,1);}
  if(gmode==='items'){
    // the rivals use what they pick up: a torpedo when someone is in range ahead, the rest after a moment
    for(const s of ais){
      if(!s.item) continue;
      s.itemT-=dt;
      if(s.itemT>0) continue;
      if(s.item==='torp'){
        const me=s.lap*N+s.idx; let near=false;
        for(const o of skis) if(o!==s){const d=o.lap*N+o.idx-me; if(d>0&&d*DS<700) near=true;}
        if(!near&&s.itemT>-5) continue;
      }
      useItem(s);
    }
  }else{
    // checkpoints
    for(const c of arc.cps) if(pl.idx>=c&&arc.cp<c&&pl.idx<c+40){arc.cp=c; flash('Checkpoint','',800); blip(760,.15,'sine',.08);}
  }
}
function loseLife(){
  arc.lives--; arc.imm=2.5;
  flash(arc.lives>0?'Mine · '+arc.lives+(arc.lives>1?' lives left':' life left'):'Out of lives','bad',1200); shake=5; buzz(60); blip(90,.5,'sawtooth',.16);
  if(arc.lives<=0){crateFinish(false); return;}
  pl.idx=arc.cp; rescue(pl,wd); pl.resc--;
}
function crateFinish(done){
  mode='done'; finT=done?pl.fin:wd.t; setLive(false); pl.ai=true; pl.skill=.8;
  const f=arc.total?arc.got/arc.total:0, medal=!done?-1:f>=.9?0:f>=.7?1:f>=.45?2:3;
  el.place.textContent=['Gold','Silver','Bronze','Finished','Out of lives'][medal<0?4:medal];
  el.resEyebrow.textContent='Crate run · '+site.name;
  statCells([['Crates',arc.got+' of '+arc.total],['Time',fmt(finT)],['Lives',String(Math.max(0,arc.lives))],['Medal',medal<0?'–':['Gold','Silver','Bronze','None'][medal]]]);
  board([]);
  const bk='crates1.'+site.id, best=parseInt(load(bk),10)||0;
  if(arc.got>best) store(bk,arc.got);
  const prize=Math.round((arc.got*15+(medal>=0&&medal<3?[800,400,200][medal]:0))*CLASSES[gar.cls].pay/10)*10;
  gar.cash+=prize; saveGar();
  el.sum.textContent=(done?'':'You ran out of lives. ')+'Prize '+money(prize)+'. Best here: '+Math.max(best,arc.got)+' crates.'+(medal>0&&done?' Gold needs 90% of the crates.':'');
  el.again.textContent='Run it again'; resAction=startCountdown; el.swap.hidden=false; el.podBtn.hidden=true;
  resAt=clock+1.1;
  if(medal===0){celebrate(false); resAt=clock+3.4;}
}
// the held item, drawn as a button at the foot of the screen; coins beside it
function itemBtn(){return {x:W/2,y:H-74,r:38};}
function arcadeOverlay(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(!G.on){
    // overhead view: the objects as simple marks
    for(const o of objs){
      if(!o.alive&&o.t!=='ramp') continue;
      const dx=o.x-camX, dy=o.y-camY, sx=V.ox+zoom*(dx*V.c-dy*V.s), sy=V.oy+zoom*(dx*V.s+dy*V.c);
      if(sx<-30||sx>W+30||sy<-30||sy>H+30) continue;
      ctx.fillStyle=o.t==='crate'?'#c98a3e':o.t==='mine'?'#1b2227':o.t==='box'?'#a78bfa':o.t==='coin'?'#ffc62a':o.t==='torp'?'#38c6f4':o.t==='cp'?'#f1fbf8':'#ffc62a';
      const r=(o.t==='ramp'?20:o.t==='coin'?4:8)*zoom*1.6;
      ctx.beginPath(); if(o.t==='crate'||o.t==='box'||o.t==='ramp') ctx.rect(sx-r,sy-r,r*2,r*2); else ctx.arc(sx,sy,r,0,TAU); ctx.fill();
    }
  }
  if(gmode==='items'&&(mode==='race'||mode==='count')){
    const b=itemBtn(), it=pl.item;
    ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,TAU); ctx.fillStyle=it?ITEMS[it].col:'rgba(6,20,26,.45)'; ctx.fill();
    ctx.lineWidth=3; ctx.strokeStyle='rgba(241,251,248,.85)'; ctx.stroke();
    ctx.font="italic 800 "+(it?17:13)+"px 'Barlow Condensed','Arial Narrow',sans-serif"; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=it?'#06202a':'rgba(241,251,248,.7)'; ctx.fillText(it?ITEMS[it].name.toUpperCase():'NO ITEM',b.x,b.y+1);
    ctx.font="700 14px 'Barlow Condensed','Arial Narrow',sans-serif"; ctx.fillStyle='#ffc62a';
    ctx.fillText('COINS '+pl.coins+'/10',b.x,b.y-b.r-14);
    // the slide charge: an arc round the button that turns orange at the first mark and red at the second
    if(pl.slideT>0){
      const k=Math.min(1,pl.slideT/SLIDE_B);
      ctx.beginPath(); ctx.arc(b.x,b.y,b.r+8,-Math.PI/2,-Math.PI/2+TAU*k); ctx.lineWidth=7;
      ctx.strokeStyle=pl.slideT>=SLIDE_B?'#e4392c':pl.slideT>=SLIDE_A?'#ff8a3c':'rgba(241,251,248,.6)'; ctx.stroke();
      if(pl.slideT>=SLIDE_A){ctx.font="italic 800 15px 'Barlow Condensed','Arial Narrow',sans-serif"; ctx.fillStyle='#ff8a3c'; ctx.fillText('LET GO TO BOOST',b.x,b.y-b.r-34);}
    }
  }
}

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
      // a named checkpoint passed: its name and the time so far
      if(wd.cps) for(let i=0;i<wd.cps.length;i++){
        const c=wd.cps[i], k=pl.lap*64+i;
        if(!cpSeen.has(k)&&pl.lap>=0&&(pl.idx-c.idx+N)%N<30){cpSeen.add(k); flash(c.name+' · '+fmt(wd.t),'',1600);}
      }
      // a one-lap race is on its last lap from the start: the white flag comes out once the field is under way
      if(LAPS===1&&!isArc()&&!cpSeen.has(-1)&&pl.lap===0&&pl.idx>FRONT+40){cpSeen.add(-1); flash('White flag · one lap','',1600);}
      // laps count up only: dropping back behind the line and crossing it again is not a lap
      if(pl.lap>lapSeen){
        const lt=wd.t-lapStart; lapStart=wd.t;
        if(!(bestLap>0)||lt<bestLap) bestLap=lt;
        if(pl.lap<LAPS) flash((pl.lap===LAPS-1?'White flag · last lap':'Lap '+(pl.lap+1)+' · '+fmt(lt)),'',1600);
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

// ---------- drawing ----------
// One sun: every shadow falls the same way across the water.
const SHX=5, SHY=7, RES=3;
const ART={
  havasu:{deep:'#145c78',shal:'#63c7c0',wet:'#b9a06c',sand:'#dcc797',top:'#bfa76f',tree:'#7d8c4c',kind:'scrub',wind:.5,glint:105,trough:72},
  pattaya:{deep:'#0c4a86',shal:'#62d2da',wet:'#cbb886',sand:'#efe1b6',top:'#4a9150',tree:'#2f7d3f',kind:'palm',wind:.9,glint:125,trough:84},
  bayou:{deep:'#26382c',shal:'#5f7150',wet:'#4b3f29',sand:'#6d5b3b',top:'#417d3d',tree:'#2a5a30',kind:'canopy',wind:.2,glint:62,trough:64},
  arena:{deep:'#123a52',shal:'#3a8a96',wet:'#5a5f66',sand:'#7a7f86',top:'#6b8f4a',tree:'#3f6b3a',kind:'canopy',wind:.3,glint:90,trough:60},
  glacier:{deep:'#0b3a4c',shal:'#4f9aa6',wet:'#545b5a',sand:'#8b8f8c',top:'#3f5f3c',tree:'#24452e',kind:'canopy',wind:.6,glint:110,trough:70},
  lagoon:{deep:'#0a6f8a',shal:'#5fe0d8',wet:'#d9c99a',sand:'#f4ecd2',top:'#5aa35a',tree:'#2f8a45',kind:'palm',wind:.4,glint:125,trough:80},
  cayman:{deep:'#0a5d86',shal:'#46d4d2',wet:'#dccb9c',sand:'#f6efd8',top:'#5d9e4f',tree:'#2f8a45',kind:'palm',wind:.6,glint:125,trough:90},
  river:{deep:'#1c4a56',shal:'#4f8f93',wet:'#8c8a84',sand:'#b8b4aa',top:'#5c8f48',tree:'#3d7440',kind:'canopy',wind:.3,glint:90,trough:64},
  redrock:{deep:'#11707b',shal:'#66cfbf',wet:'#a35b3c',sand:'#cf7c54',top:'#b6633d',tree:'#72834a',kind:'scrub',wind:.7,glint:112,trough:72}};
const TENTS=['#f4f6f3','#d8382c','#2b7fd9','#f2b824','#1f9d8a','#f07a1c'];
let art=ART.havasu, ripPat=null, sandPat=null, topPat=null, treeSpr=null, shoalSpr=null, lightCv=null;
const SPR={}, shapeSpr=[];

function mk(w,h){const c=document.createElement('canvas'); c.width=Math.max(2,Math.ceil(w)); c.height=Math.max(2,Math.ceil(h)); return c;}
function rgb(hex){const n=parseInt(hex.slice(1),16); return [n>>16,(n>>8)&255,n&255];}
function mix(a,b,t){const x=rgb(a), y=rgb(b); return 'rgb('+Math.round(x[0]+(y[0]-x[0])*t)+','+Math.round(x[1]+(y[1]-x[1])*t)+','+Math.round(x[2]+(y[2]-x[2])*t)+')';}
function shade(hex,f){return f>=0?mix(hex,'#ffffff',f):mix(hex,'#000000',-f);}
function rr(x,x0,y0,w,h,r){x.beginPath(); x.moveTo(x0+r,y0); x.arcTo(x0+w,y0,x0+w,y0+h,r); x.arcTo(x0+w,y0+h,x0,y0+h,r); x.arcTo(x0,y0+h,x0,y0,r); x.arcTo(x0,y0,x0+w,y0,r); x.closePath();}
function softDisc(col,stops){
  const c=mk(128,128), x=c.getContext('2d'), g=x.createRadialGradient(64,64,0,64,64,64), k=rgb(col);
  for(const s of stops) g.addColorStop(s[0],'rgba('+k[0]+','+k[1]+','+k[2]+','+s[1]+')');
  x.fillStyle=g; x.fillRect(0,0,128,128); return c;
}

// ----- things painted once and reused -----
function buoySprite(col){
  const c=mk(72,72), x=c.getContext('2d'), g=x.createRadialGradient(27,25,2,36,36,30);
  g.addColorStop(0,shade(col,.62)); g.addColorStop(.36,col); g.addColorStop(1,shade(col,-.52));
  x.fillStyle=g; x.beginPath(); x.arc(36,36,30,0,TAU); x.fill();
  x.lineWidth=2; x.strokeStyle='rgba(6,32,42,.45)'; x.stroke();
  x.strokeStyle='rgba(255,255,255,.2)'; x.lineWidth=3; x.beginPath(); x.arc(36,36,19,0,TAU); x.stroke();
  x.fillStyle='rgba(255,255,255,.82)'; x.beginPath(); x.ellipse(25,23,6,4,-.6,0,TAU); x.fill();
  return c;
}
function tentSprite(col){
  const c=mk(64,64), x=c.getContext('2d'), s=20, cx=28, cy=28;
  x.fillStyle='rgba(6,32,42,.3)'; x.fillRect(cx-s+6,cy-s+8,s*2,s*2);
  // four canopy faces, each catching the sun differently
  const faces=[[.2,-s,-s,s,-s],[.04,-s,-s,-s,s],[-.14,s,-s,s,s],[-.28,-s,s,s,s]];
  for(const f of faces){x.fillStyle=shade(col,f[0]); x.beginPath(); x.moveTo(cx,cy); x.lineTo(cx+f[1],cy+f[2]); x.lineTo(cx+f[3],cy+f[4]); x.closePath(); x.fill();}
  x.strokeStyle='rgba(6,32,42,.35)'; x.lineWidth=1; x.strokeRect(cx-s,cy-s,s*2,s*2);
  return c;
}
function umbSprite(col){
  const c=mk(56,56), x=c.getContext('2d'), cx=24, cy=24, r=18;
  x.fillStyle='rgba(6,32,42,.3)'; x.beginPath(); x.arc(cx+6,cy+8,r,0,TAU); x.fill();
  for(let i=0;i<8;i++){x.fillStyle=i%2?'#f6f7f4':col; x.beginPath(); x.moveTo(cx,cy); x.arc(cx,cy,r,i*TAU/8,(i+1)*TAU/8); x.closePath(); x.fill();}
  const g=x.createRadialGradient(cx-6,cy-6,2,cx,cy,r); g.addColorStop(0,'rgba(255,255,255,.3)'); g.addColorStop(1,'rgba(0,0,0,.22)');
  x.fillStyle=g; x.beginPath(); x.arc(cx,cy,r,0,TAU); x.fill();
  x.fillStyle='rgba(6,32,42,.6)'; x.beginPath(); x.arc(cx,cy,1.6,0,TAU); x.fill();
  return c;
}
function carSprite(col){
  const c=mk(64,36), x=c.getContext('2d');
  x.fillStyle='rgba(6,32,42,.3)'; rr(x,9,9,48,22,5); x.fill();
  const g=x.createLinearGradient(0,4,0,26); g.addColorStop(0,shade(col,.28)); g.addColorStop(1,shade(col,-.28));
  x.fillStyle=g; rr(x,4,4,48,22,5); x.fill();
  x.fillStyle='rgba(10,22,30,.85)'; rr(x,14,7,9,16,2); x.fill(); rr(x,36,7,7,16,2); x.fill();
  x.fillStyle=shade(col,.12); rr(x,24,7,11,16,2); x.fill();
  return c;
}
function treeSprite(kind,col){
  const c=mk(96,96), x=c.getContext('2d'), cx=40, cy=40;
  if(kind==='palm'){
    const frond=(ox,oy,a,len,fill)=>{
      x.save(); x.translate(ox,oy); x.rotate(a); x.fillStyle=fill;
      x.beginPath(); x.moveTo(0,0); x.quadraticCurveTo(len*.5,-len*.24,len,0); x.quadraticCurveTo(len*.5,len*.24,0,0); x.fill(); x.restore();
    };
    for(let i=0;i<9;i++) frond(cx+8,cy+10,i/9*TAU+hash(i,1,93)*.4,30,'rgba(6,32,42,.24)');
    for(let i=0;i<9;i++){
      const a=i/9*TAU+hash(i,1,93)*.4, len=27+hash(i,2,93)*7;
      frond(cx,cy,a,len,shade(col,-.2+hash(i,3,93)*.36));
      x.strokeStyle='rgba(6,32,42,.28)'; x.lineWidth=1; x.beginPath(); x.moveTo(cx,cy); x.lineTo(cx+Math.cos(a)*len*.9,cy+Math.sin(a)*len*.9); x.stroke();
    }
    x.fillStyle=shade(col,-.45); x.beginPath(); x.arc(cx,cy,3.2,0,TAU); x.fill();
    return c;
  }
  const scrub=kind==='scrub', n=scrub?7:10, R0=scrub?17:26;
  x.fillStyle='rgba(6,32,42,.3)'; x.beginPath(); x.arc(cx+(scrub?5:8),cy+(scrub?7:10),R0+2,0,TAU); x.fill();
  x.fillStyle=shade(col,-.3); x.beginPath(); x.arc(cx,cy,R0,0,TAU); x.fill();
  for(let i=0;i<n;i++){
    const a=i/n*TAU+hash(i,1,91), d=R0*.52, r=R0*(.4+hash(i,2,91)*.2);
    x.fillStyle=shade(col,-.14+hash(i,3,91)*.22); x.beginPath(); x.arc(cx+Math.cos(a)*d,cy+Math.sin(a)*d,r,0,TAU); x.fill();
  }
  x.globalAlpha=.7; x.fillStyle=shade(col,.26);
  for(let i=0;i<5;i++){
    const a=3.9+(hash(i,4,91)-.5)*1.7, d=R0*(.15+hash(i,5,91)*.5), r=R0*(.16+hash(i,6,91)*.14);
    x.beginPath(); x.arc(cx+Math.cos(a)*d,cy+Math.sin(a)*d,r,0,TAU); x.fill();
  }
  return c;
}
function buildSprites(){
  SPR.light=softDisc('#ffffff',[[0,1],[.35,.7],[.7,.22],[1,0]]);
  SPR.dark=softDisc('#04202a',[[0,1],[.4,.62],[.75,.2],[1,0]]);
  SPR.br=buoySprite('#e4392c'); SPR.by=buoySprite('#ffc62a'); SPR.bw=buoySprite('#eef2ef');
  SPR.tent=TENTS.map(tentSprite); SPR.umb=TENTS.map(umbSprite);
  SPR.car=['#e9ebe8','#20262b','#8f1d1d','#2a4f8a','#6b7078','#c7c2b3'].map(carSprite);
}
function rippleTile(){
  const S=384, c=mk(S,S), x=c.getContext('2d'), im=x.createImageData(S,S), d=im.data, fine=[], broad=[], dk=rgb(art.deep).map(v=>v*.4);
  let nf=0, nb=0;
  for(let i=0;i<13;i++){
    const ang=art.wind+(hash(i,1,71)-.5)*1.5, f=9+Math.floor(hash(i,2,71)*26), amp=.5+hash(i,4,71);
    fine.push([Math.round(Math.cos(ang)*f),Math.round(Math.sin(ang)*f),hash(i,3,71)*TAU,amp]); nf+=amp;
  }
  for(let i=0;i<4;i++){
    const ang=hash(i,5,71)*TAU, f=1+Math.floor(hash(i,6,71)*3);
    broad.push([Math.round(Math.cos(ang)*f),Math.round(Math.sin(ang)*f),hash(i,7,71)*TAU,1]); nb+=1;
  }
  const row=new Float32Array(S), low=new Float32Array(S);
  for(let y=0;y<S;y++){
    row.fill(0); low.fill(0);
    for(const w of fine){const py=TAU*w[1]*y/S+w[2], kx=TAU*w[0]/S; for(let i=0;i<S;i++) row[i]+=w[3]*Math.sin(kx*i+py);}
    for(const w of broad){const py=TAU*w[1]*y/S+w[2], kx=TAU*w[0]/S; for(let i=0;i<S;i++) low[i]+=Math.sin(kx*i+py);}
    for(let i=0;i<S;i++){
      // the sun only glitters where the surface is ruffled, so the sparkle comes in patches
      const h=row[i]/(nf*.5)*1.7, patch=clamp(.5+low[i]/nb*1.3,0,1), o=(y*S+i)*4;
      if(h>0){const a=Math.min(1,h); d[o]=255; d[o+1]=255; d[o+2]=255; d[o+3]=a*a*a*art.glint*(.3+.7*patch);}
      else{const a=Math.min(1,-h); d[o]=dk[0]; d[o+1]=dk[1]; d[o+2]=dk[2]; d[o+3]=a*a*art.trough*(.55+.45*(1-patch));}
    }
  }
  x.putImageData(im,0,0);
  return c;
}
function groundTile(base,amp,cell,seed){
  const S=128, c=mk(S,S), x=c.getContext('2d'), im=x.createImageData(S,S), d=im.data, b=rgb(base), n=S/cell;
  for(let j=0;j<S;j++) for(let i=0;i<S;i++){
    const u=i/cell, v=j/cell, iu=Math.floor(u), iv=Math.floor(v), fu=u-iu, fv=v-iv, su=fu*fu*(3-2*fu), sv=fv*fv*(3-2*fv);
    const p=hash(iu%n,iv%n,seed), q=hash((iu+1)%n,iv%n,seed), r=hash(iu%n,(iv+1)%n,seed), s=hash((iu+1)%n,(iv+1)%n,seed);
    const low=p+(q-p)*su+(r-p)*sv+(p-q-r+s)*su*sv, k=1+amp*((low-.5)*1.5+(hash(i,j,seed+1)-.5)*.6), o=(j*S+i)*4;
    d[o]=Math.min(255,b[0]*k); d[o+1]=Math.min(255,b[1]*k); d[o+2]=Math.min(255,b[2]*k); d[o+3]=255;
  }
  x.putImageData(im,0,0);
  return c;
}
function buildArt(){
  art=ART[site.id]||ART.havasu;
  try{
    ripPat=ctx.createPattern(rippleTile(),'repeat');
    sandPat=ctx.createPattern(groundTile(art.sand,.14,16,81),'repeat');
    topPat=ctx.createPattern(groundTile(art.top,.3,site.banks?8:16,83),'repeat');
  }catch(e){ripPat=sandPat=topPat=null;}
  // the water pales toward the land: a disc that holds its colour to the shoreline, then fades out
  shoalSpr=softDisc(art.shal,[[0,.9],[.56,.9],[.68,.56],[.84,.2],[1,0]]);
  treeSpr=treeSprite(art.kind,art.tree);
  art.foam=mix(art.shal,'#ffffff',.78);
  for(const b of LAND) b.inner=!!(site.shore&&b.x<site.shore.x-200);
  tiles.clear();
}

// ----- skis -----
function hullPath(c,sh){
  c.beginPath(); c.moveTo(sh.L,0); c.quadraticCurveTo(sh.bow,-sh.B,-6,-sh.B); c.lineTo(-sh.S,-sh.B*.84);
  c.lineTo(-sh.S,sh.B*.84); c.lineTo(-6,sh.B); c.quadraticCurveTo(sh.bow,sh.B,sh.L,0); c.closePath();
}
function shapeSprites(ci){
  if(shapeSpr[ci]) return shapeSpr[ci];
  const sh=CRAFTS[ci].sh, pad=14, w=sh.L+sh.S+pad*2, h=sh.B*2+pad*2;
  const make=paint=>{const c=mk(w*RES,h*RES), x=c.getContext('2d'); x.scale(RES,RES); x.translate(sh.S+pad,sh.B+pad); paint(x); return c;};
  const shadow=make(x=>{x.shadowColor='rgba(4,24,32,.9)'; x.shadowBlur=4*RES; x.fillStyle='rgba(4,24,32,.7)'; hullPath(x,sh); x.fill();});
  const froth=make(x=>{x.shadowColor='rgba(255,255,255,.95)'; x.shadowBlur=5*RES; x.strokeStyle='rgba(255,255,255,.9)'; x.lineWidth=3.5; x.lineJoin='round'; hullPath(x,sh); x.stroke();});
  return shapeSpr[ci]={shadow,froth,w,h,ox:sh.S+pad,oy:sh.B+pad};
}
function hullSprite(s){
  const sh=s.sh, pad=4, B=sh.B, d=B-2.3, hull=s.hull, trim=s.trim;
  const c=mk((sh.L+sh.S+pad*2)*RES,(B*2+pad*2)*RES), x=c.getContext('2d');
  x.scale(RES,RES); x.translate(sh.S+pad,B+pad); x.lineJoin='round'; x.lineCap='round';
  // jet nozzle poking out of the transom
  x.fillStyle='#161d21'; x.fillRect(-sh.S-1.6,-2.1,3,4.2); x.fillStyle='#4a545a'; x.fillRect(-sh.S-1.6,-.9,1,1.8);
  // hull: dark down the sides, brightest along the centre line, with a black rub rail
  let g=x.createLinearGradient(0,-B,0,B);
  g.addColorStop(0,shade(hull,-.46)); g.addColorStop(.17,shade(hull,-.1)); g.addColorStop(.5,shade(hull,.18)); g.addColorStop(.83,shade(hull,-.16)); g.addColorStop(1,shade(hull,-.55));
  hullPath(x,sh); x.fillStyle=g; x.fill();
  x.lineWidth=1.3; x.strokeStyle='rgba(8,20,26,.92)'; x.stroke();
  // sponsons on the rear quarters
  x.strokeStyle='#11181c'; x.lineWidth=2;
  x.beginPath(); x.moveTo(-sh.S+1.5,-B*.87); x.lineTo(-sh.S+9,-B*.95); x.moveTo(-sh.S+1.5,B*.87); x.lineTo(-sh.S+9,B*.95); x.stroke();
  // deck, set in from the rail
  x.beginPath(); x.moveTo(sh.L-4,0); x.quadraticCurveTo(sh.bow-1,-d,-6,-d); x.lineTo(-sh.S+1.5,-d*.84); x.lineTo(-sh.S+1.5,d*.84);
  x.lineTo(-6,d); x.quadraticCurveTo(sh.bow-1,d,sh.L-4,0); x.closePath();
  g=x.createLinearGradient(0,-d,0,d); g.addColorStop(0,shade(hull,-.22)); g.addColorStop(.45,shade(hull,.3)); g.addColorStop(1,shade(hull,-.34));
  x.fillStyle=g; x.fill();
  // footwells with traction mats, and the rear platform on the bigger hulls
  const x0=-sh.seat+.5, len=sh.seat+3.5, fw=d-5.4;
  x.fillStyle='#161d21';
  if(fw>.8){x.fillRect(x0,4.8,len,fw); x.fillRect(x0,-4.8-fw,len,fw);}
  if(sh.deck) x.fillRect(-sh.S+2,-d*.74,sh.deck,d*1.48);
  x.strokeStyle='rgba(255,255,255,.1)'; x.lineWidth=.35; x.beginPath();
  if(fw>.8) for(let u=x0+1.2;u<x0+len;u+=1.7){x.moveTo(u,4.9); x.lineTo(u,4.7+fw); x.moveTo(u,-4.9); x.lineTo(u,-4.7-fw);}
  if(sh.deck) for(let v=-d*.6;v<d*.7;v+=1.6){x.moveTo(-sh.S+2.2,v); x.lineTo(-sh.S+1.8+sh.deck,v);}
  x.stroke();
  // hood in the trim colour, creased down the middle
  const hb=sh.L-5.5, hw=B*.6;
  x.beginPath(); x.moveTo(hb,0); x.quadraticCurveTo(hb-7,-hw,2.5,-hw); x.lineTo(2.5,hw); x.quadraticCurveTo(hb-7,hw,hb,0); x.closePath();
  g=x.createLinearGradient(0,-hw,0,hw); g.addColorStop(0,shade(trim,-.3)); g.addColorStop(.42,shade(trim,.22)); g.addColorStop(1,shade(trim,-.42));
  x.fillStyle=g; x.fill();
  x.strokeStyle='rgba(8,20,26,.5)'; x.lineWidth=.5; x.stroke();
  x.beginPath(); x.moveTo(hb-1.5,0); x.lineTo(3.2,-hw*.42); x.moveTo(hb-1.5,0); x.lineTo(3.2,hw*.42); x.stroke();
  // a different detail on each hood so the craft can be told apart
  x.fillStyle=shade(hull,-.1);
  if(sh.mark===1){x.fillRect(7,-hw*.72,5,1.5); x.fillRect(7,hw*.72-1.5,5,1.5);}
  else if(sh.mark===2){x.fillRect(5.5,-.9,hb-11,1.8);}
  else if(sh.mark===3){x.strokeStyle='rgba(150,205,225,.85)'; x.lineWidth=1.5; x.beginPath(); x.arc(3.6,0,hw*.9,-1.05,1.05); x.stroke();}
  else if(sh.mark===4){x.fillRect(6.5,-hw*.8,1.8,hw*1.6); x.fillRect(10.5,-hw*.62,1.8,hw*1.24);}
  // sunlight along the shoulder nearer the sun
  x.strokeStyle='rgba(255,255,255,.32)'; x.lineWidth=.8;
  x.beginPath(); x.moveTo(sh.L-7,-1.4); x.quadraticCurveTo(sh.bow-2,-d+1.3,-3,-d+1.3); x.stroke();
  // seat: charcoal, with a lighter insert and stitching
  g=x.createLinearGradient(0,-4.3,0,4.3); g.addColorStop(0,'#0e1316'); g.addColorStop(.45,'#3a4349'); g.addColorStop(1,'#0b0f12');
  x.fillStyle=g; rr(x,1-sh.seat,-4.3,sh.seat,8.6,2.2); x.fill();
  x.fillStyle='rgba(255,255,255,.07)'; rr(x,2.4-sh.seat,-1.9,sh.seat-3,3.8,1.4); x.fill();
  x.strokeStyle='rgba(255,255,255,.13)'; x.lineWidth=.3; x.beginPath();
  for(let u=3.5-sh.seat;u<-.5;u+=2.6){x.moveTo(u,-3.6); x.lineTo(u,3.6);}
  x.stroke();
  // steering column, bars and grips
  x.fillStyle='#161d21'; x.beginPath(); x.ellipse(4.3,0,2.5,3.3,0,0,TAU); x.fill();
  x.strokeStyle='#20282d'; x.lineWidth=1.5; x.beginPath(); x.moveTo(4.8,-7.2); x.lineTo(4.8,7.2); x.stroke();
  x.strokeStyle='#0a0d0f'; x.lineWidth=2.3; x.beginPath(); x.moveTo(4.8,-7.4); x.lineTo(4.8,-5.6); x.moveTo(4.8,5.6); x.lineTo(4.8,7.4); x.stroke();
  x.fillStyle=shade(trim,-.05); rr(x,4,-1.5,1.8,3,.6); x.fill();
  return c;
}
function riderSprite(s){
  const c=mk(28*RES,26*RES), x=c.getContext('2d'), suit='#12181c';
  const vest=lum(s.hull)>.22?s.hull:s.trim, lid=lum(s.trim)>.4?s.trim:'#f1f3f1';
  x.scale(RES,RES); x.translate(16,13); x.lineJoin='round'; x.lineCap='round';
  // legs gripping the seat, boots in the wells
  x.fillStyle=suit;
  for(const sd of [-1,1]){
    x.beginPath(); x.ellipse(-3,sd*4.9,3.6,2,sd*.18,0,TAU); x.fill();
    x.beginPath(); x.ellipse(1.6,sd*5.9,2.2,1.5,0,0,TAU); x.fill();
  }
  // arms out to the grips
  x.strokeStyle=suit; x.lineWidth=2.5;
  x.beginPath(); x.moveTo(-5.2,-5); x.lineTo(.4,-7.4); x.lineTo(4.6,-6.9); x.moveTo(-5.2,5); x.lineTo(.4,7.4); x.lineTo(4.6,6.9); x.stroke();
  x.fillStyle='#2b3338'; x.beginPath(); x.arc(4.7,-6.9,1.5,0,TAU); x.arc(4.7,6.9,1.5,0,TAU); x.fill();
  // life vest
  let g=x.createRadialGradient(-8.2,-2.2,1,-6.5,0,7);
  g.addColorStop(0,shade(vest,.3)); g.addColorStop(.6,vest); g.addColorStop(1,shade(vest,-.42));
  x.fillStyle=g; x.beginPath(); x.ellipse(-6.5,0,4.7,6.2,0,0,TAU); x.fill();
  x.strokeStyle='rgba(8,20,26,.55)'; x.lineWidth=.5; x.stroke();
  x.fillStyle='rgba(8,20,26,.4)'; x.fillRect(-9.6,-5.2,6.2,1.3); x.fillRect(-9.6,3.9,6.2,1.3);
  x.strokeStyle='rgba(8,20,26,.5)'; x.lineWidth=.5; x.beginPath(); x.moveTo(-10.6,0); x.lineTo(-4.4,0); x.stroke();
  // helmet with a peak and a dark visor
  x.fillStyle=shade(lid,-.25); x.beginPath(); x.moveTo(-1.4,-2.9); x.lineTo(2.3,-1.1); x.lineTo(2.3,1.1); x.lineTo(-1.4,2.9); x.closePath(); x.fill();
  g=x.createRadialGradient(-4.8,-1.6,.5,-3.2,0,4.3);
  g.addColorStop(0,shade(lid,.5)); g.addColorStop(.55,lid); g.addColorStop(1,shade(lid,-.5));
  x.fillStyle=g; x.beginPath(); x.arc(-3.2,0,4,0,TAU); x.fill();
  x.strokeStyle='rgba(8,20,26,.6)'; x.lineWidth=.5; x.stroke();
  x.strokeStyle='rgba(8,16,22,.9)'; x.lineWidth=1.5; x.beginPath(); x.arc(-3.2,0,3.3,-.85,.85); x.stroke();
  x.fillStyle='rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(-4.9,-1.7,1.3,.8,-.6,0,TAU); x.fill();
  return c;
}
function dressSkis(){
  for(const s of skis){s.ci=CRAFTS.findIndex(c=>c.sh===s.sh); s.spr=hullSprite(s); s.rider=riderSprite(s);}
}
function drawSki(s){
  const sh=s.sh, sp=shapeSprites(s.ci), k=1.5*SK, f=Math.min(1,s.v/260);
  const bob=s.rough*.035*Math.sin(clock*6+s.seed), roll=s.rough*.045*Math.sin(clock*4.6+s.seed*2);
  ctx.save(); ctx.translate(s.x,s.y);
  ctx.save(); ctx.translate(SHX*SK,SHY*SK); ctx.rotate(s.h); ctx.scale(k,k);
  ctx.globalAlpha=.5; ctx.drawImage(sp.shadow,-sp.ox,-sp.oy,sp.w,sp.h); ctx.restore();
  if(s.me){
    ctx.lineWidth=1.6*SK; ctx.strokeStyle='rgba(255,255,255,.42)';
    ctx.beginPath(); ctx.arc(0,0,47*SK,0,TAU); ctx.stroke();
  }
  ctx.rotate(s.h+roll); ctx.scale(k,k);
  if(f>.08){
    // white water thrown off the hull, the jet behind it and spray peeling back off the bow
    ctx.globalAlpha=.8*f; ctx.drawImage(sp.froth,-sp.ox,-sp.oy,sp.w,sp.h);
    const len=10+30*f;
    ctx.globalAlpha=.85*f*Math.max(.3,s.thr); ctx.drawImage(SPR.light,-sh.S-len+4,-7.5,len,15);
    ctx.globalAlpha=.5*f;
    ctx.drawImage(SPR.light,sh.L*.3-10,-sh.B-8,20,11); ctx.drawImage(SPR.light,sh.L*.3-10,sh.B-3,20,11);
    ctx.globalAlpha=1;
  }
  ctx.scale(1+bob,(1+bob)*(1-.09*Math.abs(s.lean)));
  ctx.drawImage(s.spr,-(sh.S+4),-(sh.B+4),sh.L+sh.S+8,sh.B*2+8);
  // the rider hangs off the inside of the turn
  ctx.translate(0,s.lean*2.4); ctx.rotate(s.lean*.1);
  ctx.drawImage(s.rider,-16,-13,28,26);
  ctx.restore();
}

// ----- water -----
function drawDepth(R){
  // slow, soft changes in the colour of open water
  const G=900, i0=Math.floor((camX-R)/G)-1, i1=Math.ceil((camX+R)/G), j0=Math.floor((camY-R)/G)-1, j1=Math.ceil((camY+R)/G);
  for(let i=i0;i<=i1;i++) for(let j=j0;j<=j1;j++){
    const x=(i+hash(i,j,41))*G, y=(j+hash(j,i,42))*G, r=380+hash(i,j,43)*420, dark=hash(i,j,44)>.5;
    ctx.globalAlpha=dark?.2:.11; ctx.drawImage(dark?SPR.dark:SPR.light,x-r,y-r,r*2,r*2);
  }
  ctx.globalAlpha=1;
}
function landInView(R,grow){
  const vis=[];
  for(const b of LAND){const dx=b.x-camX, dy=b.y-camY, rr2=R+b.r+grow; if(dx*dx+dy*dy<rr2*rr2) vis.push(b);}
  return vis;
}
function drawShoals(R){
  for(const b of LAND){
    if(b.inner) continue;
    const q=(b.r+12)/.56, dx=b.x-camX, dy=b.y-camY, lim=R+q;
    if(dx*dx+dy*dy>lim*lim) continue;
    ctx.drawImage(shoalSpr,b.x-q,b.y-q,q*2,q*2);
  }
}
function drawSwell(R){
  const sw=site.swell; if(!sw) return;
  const ux=wd.env.ux, uy=wd.env.uy, d0=camX*ux+camY*uy, c0=-camX*uy+camY*ux, base=sw.c*wd.env.t+sw.len*.25;
  const m0=Math.floor((d0-R-base)/sw.len), m1=Math.ceil((d0+R-base)/sw.len);
  const lines=off=>{
    ctx.beginPath();
    for(let m=m0;m<=m1;m++){
      const d=base+(m+off)*sw.len, cx=ux*d-uy*c0, cy=uy*d+ux*c0;
      ctx.moveTo(cx+uy*R,cy-ux*R); ctx.lineTo(cx-uy*R,cy+ux*R);
    }
  };
  lines(.5); ctx.lineWidth=220; ctx.strokeStyle='rgba(3,18,40,.1)'; ctx.stroke();            // troughs
  lines(0); ctx.lineWidth=230; ctx.strokeStyle='rgba(255,255,255,.04)'; ctx.stroke();         // the swell's lit face
  ctx.lineWidth=110; ctx.strokeStyle='rgba(255,255,255,.06)'; ctx.stroke();
  // streaks of foam breaking along each crest, carried along with it
  const G=70, j0=Math.floor((c0-R)/G), j1=Math.ceil((c0+R)/G);
  ctx.save(); ctx.rotate(Math.atan2(uy,ux));
  for(let m=m0;m<=m1;m++){
    const d=base+m*sw.len;
    for(let j=j0;j<=j1;j++){
      const h=hash(j,m,17); if(h>.42) continue;
      const len=46+110*hash(j,m,18), th=11+9*hash(j,m,19);
      ctx.globalAlpha=.3+.9*h;
      ctx.drawImage(SPR.light,d-th/2+(hash(j,m,20)-.5)*26,j*G-len/2,th,len);
    }
  }
  ctx.restore(); ctx.globalAlpha=1;
}
function drawStill(R){
  if(!ripPat) return;
  const k=2.2, a=.83, c=Math.cos(a), sn=Math.sin(a), px=(camX*c+camY*sn)/k, py=(-camX*sn+camY*c)/k, r=R/k;
  ctx.save(); ctx.globalAlpha=.6; ctx.rotate(a); ctx.scale(k,k); ctx.fillStyle=ripPat; ctx.fillRect(px-r,py-r,r*2,r*2); ctx.restore();
}
// The shimmer is two sheets of ripples sliding over each other: a broad one painted into the still water, and this fine one drifting over it.
const RIP=typeof DOMMatrix==='function'?new DOMMatrix():null, RIP0=RIP?new DOMMatrix():null;
function drawRipples(R){
  if(!ripPat||QUAL<2||zoom<.3) return;
  const ox=clock*11, oy=clock*5;
  if(RIP&&ripPat.setTransform){
    // fill only the screen: the pattern itself carries the world's position, scale and turn
    const a=zoom*V.c, b=zoom*V.s;
    RIP.a=a; RIP.b=b; RIP.c=-b; RIP.d=a;
    RIP.e=V.ox+a*(ox-camX)-b*(oy-camY); RIP.f=V.oy+b*(ox-camX)+a*(oy-camY);
    ripPat.setTransform(RIP);
    ctx.save(); ctx.setTransform(DPR,0,0,DPR,0,0); ctx.globalAlpha=.95; ctx.fillStyle=ripPat; ctx.fillRect(0,0,W,H); ctx.restore();
    ripPat.setTransform(RIP0);
    return;
  }
  ctx.save(); ctx.globalAlpha=.95; ctx.translate(ox,oy); ctx.fillStyle=ripPat;
  ctx.fillRect(camX-ox-R,camY-oy-R,R*2,R*2); ctx.restore();
}

// ----- wakes -----
function wakeGeom(s,t){
  const tr=s.trail, n=tr.length/3, X=s.wx, Y=s.wy, A=s.wa, NX=s.wnx, NY=s.wny; let m=0;
  for(let i=0;i<n;i++){X[m]=tr[i*3]; Y[m]=tr[i*3+1]; A[m]=t-tr[i*3+2]; m++;}
  if(m&&s.v>30){X[m]=s.x-Math.cos(s.h)*20; Y[m]=s.y-Math.sin(s.h)*20; A[m]=0; m++;}
  for(let i=0;i<m;i++){
    const a=i>0?i-1:i, b=i<m-1?i+1:i, dx=X[b]-X[a], dy=Y[b]-Y[a], l=Math.hypot(dx,dy)||1;
    NX[i]=-dy/l; NY[i]=dx/l;
  }
  s.wm=m;
}
function drawWakes(R){
  const B=5, L=TRAIL_LIFE, t=wd.t, lim=(R+260)*(R+260), near=[];
  for(const s of skis){
    const dx=s.x-camX, dy=s.y-camY;
    if(dx*dx+dy*dy<lim){wakeGeom(s,t); near.push(s);}
  }
  // the V of bow wave spreading out behind, soft and faint
  for(let pass=0;pass<2;pass++) for(let b=0;b<B;b++){
    ctx.beginPath();
    for(const s of near){
      const X=s.wx, Y=s.wy, A=s.wa, NX=s.wnx, NY=s.wny;
      for(let i=0;i<s.wm-1;i++){
        if(Math.min(B-1,Math.floor((A[i]+A[i+1])/2/L*B))!==b) continue;
        const a0=12+70*A[i], a1=12+70*A[i+1];
        ctx.moveTo(X[i]+NX[i]*a0,Y[i]+NY[i]*a0); ctx.lineTo(X[i+1]+NX[i+1]*a1,Y[i+1]+NY[i+1]*a1);
        ctx.moveTo(X[i]-NX[i]*a0,Y[i]-NY[i]*a0); ctx.lineTo(X[i+1]-NX[i+1]*a1,Y[i+1]-NY[i+1]*a1);
      }
    }
    ctx.lineWidth=pass?4:13;
    ctx.strokeStyle='rgba(255,255,255,'+((pass?.11:.045)*(1-(b+.5)/B)).toFixed(3)+')'; ctx.stroke();
  }
  // churned white water: soft discs laid along the track, tight and bright at the pump, wide and thin by the end
  const lt=SPR.light;
  for(const s of near){
    const X=s.wx, Y=s.wy, A=s.wa, NX=s.wnx, NY=s.wny;
    for(let i=1;i<s.wm;i++) for(let h=0;h<2;h++){
      if(h&&A[i]>L*.4) break;
      const f=h*.5, age=A[i]+(A[i-1]-A[i])*f, u=clamp(age/L,0,1), id=Math.round((t-age)*29);
      const o=(hash(id,s.ri,5)-.5)*18*u, r=(7+30*Math.pow(u,.7))*(.85+.3*hash(id,s.ri,6));
      const x=X[i]+(X[i-1]-X[i])*f+NX[i]*o, y=Y[i]+(Y[i-1]-Y[i])*f+NY[i]*o;
      ctx.globalAlpha=.4*(1-u)*(1-u*.6);
      ctx.drawImage(lt,x-r,y-r,r*2,r*2);
    }
  }
  ctx.globalAlpha=1;
}

// ----- land -----
function drawShore(R){
  const vis=landInView(R,12);
  if(!vis.length) return;
  const ring=(grow,fill,topOnly)=>{
    ctx.fillStyle=fill;
    for(const b of vis){
      if(topOnly&&!b.top) continue;
      const r=b.r+grow; if(r<8) continue;
      ctx.beginPath(); ctx.arc(b.x,b.y,r,0,TAU); ctx.fill();
    }
  };
  // a line of foam at the edge, wet sand, dry sand, then the higher ground and the shadow it casts
  ctx.fillStyle=art.foam;
  for(const b of vis){
    if(b.inner) continue;
    ctx.beginPath(); ctx.arc(b.x,b.y,b.r+5,0,TAU); ctx.fill();
  }
  ring(1.5,art.wet,false);
  ring(-5,sandPat||art.sand,false);
  ctx.fillStyle='rgba(6,32,42,.26)';
  for(const b of vis){
    if(!b.top||b.r<46) continue;
    ctx.beginPath(); ctx.arc(b.x+SHX,b.y+SHY,b.r-35,0,TAU); ctx.fill();
  }
  ring(-38,topPat||art.top,true);
}
function drawProps(R2){
  for(const p of PROPS){
    const dx=p.x-camX, dy=p.y-camY; if(dx*dx+dy*dy>R2) continue;
    if(p.t===2){const k=p.s/30; ctx.drawImage(treeSpr,p.x-40*k,p.y-40*k,96*k,96*k); continue;}
    if(p.t===1){const k=p.s/18; ctx.drawImage(SPR.umb[p.ci],p.x-24*k,p.y-24*k,56*k,56*k); continue;}
    ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.a);
    if(p.t===0){const k=p.s/20; ctx.drawImage(SPR.tent[p.ci],-28*k,-28*k,64*k,64*k);}
    else ctx.drawImage(SPR.car[p.ci],-20,-11,46,26);
    ctx.restore();
  }
}
function drawClouds(){
  const span=(bx1-bx0)+3200;
  for(let i=0;i<2;i++){
    const r=620+i*160, x=bx0-1600+((clock*(16+i*7)+i*span*.55)%span), y=by0+(by1-by0)*(.25+.5*i)+Math.sin(clock*.03+i)*200;
    ctx.globalAlpha=.24; ctx.drawImage(SPR.dark,x-r,y-r,r*2,r*2);
  }
  ctx.globalAlpha=1;
}

// ----- the course -----
// The lane is the whole rulebook, so it has to read at a glance: a paler strip of water, a float line down each edge,
// chevrons down the middle pointing the way round, and colour on the inside of every corner.
function drawLaneMarks(R){
  const lane=site.lane, R2=(R+20)*(R+20);
  ctx.beginPath();
  for(let j=0;j<N;j+=3){const p=PATH[j]; if(j) ctx.lineTo(p.x,p.y); else ctx.moveTo(p.x,p.y);}
  ctx.closePath(); ctx.lineJoin='round';
  ctx.lineWidth=lane*2+26; ctx.strokeStyle='rgba(4,24,32,.1)'; ctx.stroke();
  ctx.lineWidth=lane*2; ctx.strokeStyle='rgba(255,255,255,.085)'; ctx.stroke();
  ctx.beginPath();
  for(let j=0;j<N;j+=5){
    const p=PATH[j], dx=p.x-camX, dy=p.y-camY; if(dx*dx+dy*dy>R2) continue;
    ctx.moveTo(p.x-p.ty*12-p.tx*6,p.y+p.tx*12-p.ty*6); ctx.lineTo(p.x+p.tx*9,p.y+p.ty*9); ctx.lineTo(p.x+p.ty*12-p.tx*6,p.y-p.tx*12-p.ty*6);
  }
  ctx.lineWidth=4.5; ctx.lineJoin='miter'; ctx.strokeStyle='rgba(255,255,255,.3)'; ctx.stroke();
  // floats: white, or red round the inside of a left turn and yellow round the inside of a right
  const fills=['rgba(6,32,42,.32)','rgba(244,248,244,.96)',COL.red,COL.yellow];
  for(let pass=0;pass<4;pass++){
    ctx.beginPath();
    for(let j=0;j<N;j+=3) for(const sd of [-1,1]){
      const p=PATH[j];
      if(1-p.ks*sd*p.w<.35) continue;                        // the inside of a very tight corner has no room for a float line
      const col=p.c===sd?(sd>0?3:2):1;
      if(pass&&col!==pass) continue;
      const x=p.x-p.ty*sd*p.w+(pass?0:2.5), y=p.y+p.tx*sd*p.w+(pass?0:3.5), dx=x-camX, dy=y-camY;
      if(dx*dx+dy*dy>R2) continue;
      const r=col>1?6.5:5;
      ctx.moveTo(x+r,y); ctx.arc(x,y,r,0,TAU);
    }
    ctx.fillStyle=fills[pass]; ctx.fill();
  }
}
function drawFinish(){
  const f=PATH[0], n=Math.round(f.w/14);
  ctx.save(); ctx.translate(f.x,f.y); ctx.rotate(f.h);
  for(let i=-n;i<n;i++) for(let r=0;r<2;r++){
    ctx.fillStyle=((i+r)&1)?'rgba(6,32,42,.7)':'rgba(244,250,247,.8)';
    ctx.fillRect(-14+r*14,i*14,14,14);
  }
  ctx.restore();
}
function drawTurnBuoy(g,R2){
  const dx=g.x-camX, dy=g.y-camY; if(dx*dx+dy*dy>R2) return;
  const r=15*SK*(1+g.wob*.2);
  ctx.globalAlpha=.5; ctx.drawImage(SPR.dark,g.x-r*1.5+SHX,g.y-r*1.5+SHY,r*3,r*3); ctx.globalAlpha=1;
  ctx.strokeStyle='rgba(255,255,255,.32)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.arc(g.x,g.y,r*1.32+1.5*Math.sin(clock*2+g.idx),0,TAU); ctx.stroke();
  ctx.drawImage(g.right?SPR.by:SPR.br,g.x-r*1.2,g.y-r*1.2,r*2.4,r*2.4);
}

function w2s(x,y){const dx=x-camX, dy=y-camY; return [V.ox+zoom*(dx*V.c-dy*V.s),V.oy+zoom*(dx*V.s+dy*V.c)];}
function tag(s,mark){
  if(!s||wd.t<3) return;
  const p=w2s(s.x,s.y), q=w2s(pl.x,pl.y), tx=mark+' '+s.name.toUpperCase();
  if(Math.hypot(p[0]-q[0],p[1]-q[1])<76) return;
  if(p[0]<10||p[0]>W-10||p[1]<hudBottom+20||p[1]>H-10) return;
  ctx.font="600 12px 'Barlow Condensed','Arial Narrow',sans-serif"; ctx.textAlign='center'; ctx.textBaseline='middle';
  const w=ctx.measureText(tx).width+12, y=p[1]-40*zoom*SK-14;
  ctx.fillStyle='rgba(6,32,42,.72)'; ctx.fillRect(p[0]-w/2,y-9,w,18);
  ctx.fillStyle=s.hull; ctx.fillRect(p[0]-w/2,y+7,w,2);
  ctx.fillStyle=COL.foam; ctx.fillText(tx,p[0],y+.5);
}
function toWorld(){ctx.translate(V.ox,V.oy); ctx.scale(zoom,zoom); ctx.rotate(V.rot); ctx.translate(-camX,-camY); ctx.lineCap='round';}

// The still parts of the scene are painted once into tiles and blitted from then on: open water and the course (a), and anything standing on land (b).
const TILE=512, TILE_MAX=28, tiles=new Map();
let TS=1.25, tileStamp=0, tileRush=0;
function paintTile(i,j){
  const sp=TILE/TS, x0=i*sp, y0=j*sp, R=sp*.707+90;
  let t=null;
  if(tiles.size>=TILE_MAX){
    // reuse the tile that has gone longest without being on screen
    let key=0, old=null;
    for(const e of tiles) if(e[1].used<tileStamp&&(!old||e[1].used<old.used)){old=e[1]; key=e[0];}
    if(old){tiles.delete(key); t=old;}
  }
  if(!t) t={a:mk(TILE,TILE),b:null,land:false,used:0};
  const main=ctx, sx=camX, sy=camY, sk=SK;
  camX=x0+sp/2; camY=y0+sp/2; SK=1;
  try{
    ctx=t.a.getContext('2d'); ctx.setTransform(TS,0,0,TS,-x0*TS,-y0*TS); ctx.lineCap='round';
    ctx.fillStyle=art.deep; ctx.fillRect(x0-1,y0-1,sp+2,sp+2);
    drawDepth(R); drawShoals(R); drawStill(R); drawLaneMarks(R); drawFinish();
    t.land=false;
    for(const b of LAND){const m=b.r+sp/2+30; if(Math.abs(b.x-camX)<m&&Math.abs(b.y-camY)<m){t.land=true; break;}}
    if(t.land){
      if(!t.b) t.b=mk(TILE,TILE);
      ctx=t.b.getContext('2d'); ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,TILE,TILE);
      ctx.setTransform(TS,0,0,TS,-x0*TS,-y0*TS);
      drawShore(R); drawProps(R*R);
    }
  }finally{ctx=main; camX=sx; camY=sy; SK=sk;}
  tiles.set((i+2048)*4096+j+2048,t);
  return t;
}
// which tiles the screen could touch, from where its four corners land in the world
function viewTiles(){
  const sp=TILE/TS; let x0=1e9, y0=1e9, x1=-1e9, y1=-1e9;
  for(let q=0;q<4;q++){
    const dx=((q&1?W:0)-V.ox)/zoom, dy=((q&2?H:0)-V.oy)/zoom, wx=dx*V.c+dy*V.s, wy=-dx*V.s+dy*V.c;
    if(wx<x0)x0=wx; if(wx>x1)x1=wx; if(wy<y0)y0=wy; if(wy>y1)y1=wy;
  }
  return [Math.floor((camX+x0-4)/sp),Math.floor((camX+x1+4)/sp),Math.floor((camY+y0-4)/sp),Math.floor((camY+y1+4)/sp)];
}
function drawTiles(layer){
  const sp=TILE/TS, v=viewTiles(), t0=performance.now(), m=sp*.71*zoom+2;
  let made=0;
  if(!layer) tileStamp++;
  for(let i=v[0];i<=v[1];i++) for(let j=v[2];j<=v[3];j++){
    // the view is turned to follow the lane, so the corners of that box are off screen: those tiles are skipped
    const dx=(i+.5)*sp-camX, dy=(j+.5)*sp-camY, sx=V.ox+zoom*(dx*V.c-dy*V.s), sy=V.oy+zoom*(dx*V.s+dy*V.c);
    if(sx<-m||sx>W+m||sy<-m||sy>H+m) continue;
    let t=tiles.get((i+2048)*4096+j+2048);
    if(!t){
      // paint what is missing, but never spend a whole frame on it
      if(layer||(made&&!tileRush&&performance.now()-t0>9)) continue;
      t=paintTile(i,j); made++;
    }
    t.used=tileStamp;
    if(!layer) ctx.drawImage(t.a,i*sp,j*sp,sp+.6,sp+.6);
    else if(t.land) ctx.drawImage(t.b,i*sp,j*sp,sp+.6,sp+.6);
  }
  if(!layer&&tileRush) tileRush--;
  if(!layer&&!made&&pl&&mode!=='idle'){
    // nothing was missing: get one tile ready further up the lane, where the camera is heading
    for(let q=10;q<=70&&!made;q+=6){
      const p=PATH[(pl.idx+q)%N], i=Math.floor(p.x/sp), j=Math.floor(p.y/sp), k=(i+2048)*4096+j+2048, t=tiles.get(k);
      if(t) t.used=tileStamp; else{paintTile(i,j).used=tileStamp; made++;}
    }
  }
}

function render(){
  const idle=mode==='idle', racing=mode==='race'||mode==='count';
  const jx=shake?Math.sin(clock*57)*shake:0, jy=shake?Math.cos(clock*49)*shake:0;
  V.rot=-(camA+Math.PI/2); V.c=Math.cos(V.rot); V.s=Math.sin(V.rot);
  V.ox=W/2+jx; V.oy=(idle?H*.5:H*.72)+jy;
  SK=clamp(.4/zoom,1,2.6);
  const R=Math.hypot(W/2,H*.75)/zoom+60, R2=R*R;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.fillStyle=art.deep; ctx.fillRect(0,0,W,H);
  ctx.save();
  toWorld();
  drawTiles(0);
  drawSwell(R);
  drawRipples(R);
  drawWakes(R);
  drawTiles(1);
  drawClouds();
  for(const p of parts){
    const dx=p.x-camX, dy=p.y-camY; if(dx*dx+dy*dy>R2) continue;
    const r=(p.r+(1-p.life)*9)*SK*1.7;
    ctx.globalAlpha=p.life*.75; ctx.drawImage(SPR.light,p.x-r,p.y-r,r*2,r*2);
  }
  ctx.globalAlpha=1;
  for(const g of TURNS) drawTurnBuoy(g,R2);
  for(const s of skis) if(!s.me) drawSki(s);
  drawSki(pl);
  ctx.restore();

  if(lightCv) ctx.drawImage(lightCv,0,0,W,H);      // low sun in one corner, the frame darkening toward the others
  if(mode==='race'&&pl.out>0){ctx.fillStyle='rgba(228,57,44,'+(.1+.06*Math.sin(clock*9)).toFixed(3)+')'; ctx.fillRect(0,0,W,H);}

  if(racing){tag(tagA,'▲'); tag(tagB,'▼');}
  if(cer) podium2D(); else hudOverlay(idle,racing);
  drawConfetti();
}
// drawn flat over either view: the course map, the slide control and the brake light
function hudOverlay(idle,racing){
  if(!idle){
    // course map, north up
    const sc=Math.min(92/(by1-by0),120/(bx1-bx0)), mh=(by1-by0)*sc, mw=(bx1-bx0)*sc, mx=W-16-mw-8, my=hudBottom+8;
    ctx.fillStyle='rgba(6,32,42,.5)'; ctx.fillRect(mx-8,my-8,mw+16,mh+16);
    ctx.beginPath();
    for(let j=0;j<=N;j+=4){const p=PATH[j%N], x=mx+(p.x-bx0)*sc, y=my+(p.y-by0)*sc; if(j) ctx.lineTo(x,y); else ctx.moveTo(x,y);}
    ctx.closePath(); ctx.lineWidth=2; ctx.lineJoin='round'; ctx.strokeStyle='rgba(241,251,248,.55)'; ctx.stroke();
    // rough patches, so you know where the water stands up
    ctx.fillStyle='rgba(241,251,248,.3)';
    for(const z of wd.env.zones||[]){ctx.beginPath(); ctx.arc(mx+(z[0]-bx0)*sc,my+(z[1]-by0)*sc,Math.max(3,z[2]*.8*sc),0,TAU); ctx.fill();}
    for(const s of skis){
      if(s.me) continue;
      ctx.fillStyle=s.hull; ctx.beginPath(); ctx.arc(mx+(s.x-bx0)*sc,my+(s.y-by0)*sc,2.4,0,TAU); ctx.fill();
    }
    const px=mx+(pl.x-bx0)*sc, py=my+(pl.y-by0)*sc;
    ctx.fillStyle=pl.hull; ctx.beginPath(); ctx.arc(px,py,3.6,0,TAU); ctx.fill();
    ctx.strokeStyle=COL.foam; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(px,py,6.5,0,TAU); ctx.stroke();
  }

  if(stick&&racing&&!paused){
    // the slide control: a short track with the thumb's knob on it
    const R0=(SLIDE[opt.feel]||SLIDE.mid)+5, kx=clamp(stick.x,stick.ox-R0,stick.ox+R0);
    ctx.lineCap='round'; ctx.lineWidth=34; ctx.strokeStyle='rgba(6,32,42,.26)';
    ctx.beginPath(); ctx.moveTo(stick.ox-R0,stick.oy); ctx.lineTo(stick.ox+R0,stick.oy); ctx.stroke();
    ctx.lineWidth=2; ctx.strokeStyle='rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.moveTo(stick.ox,stick.oy-12); ctx.lineTo(stick.ox,stick.oy+12); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.9)';
    ctx.beginPath(); ctx.arc(kx,stick.oy,20,0,TAU); ctx.fill();
  }
  if(mode==='race'&&!paused&&inp.brk){
    ctx.font="italic 800 20px 'Barlow Condensed','Arial Narrow',sans-serif"; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=COL.red; ctx.fillRect(W/2-44,H*.86-15,88,30);
    ctx.fillStyle='#fff'; ctx.fillText('BRAKE',W/2,H*.86+1);
  }
}
// ---------- the view from behind the rider ----------
// The race is still run on a flat map. Here its (x, y) become (x, z) with y up, and the camera rides low behind your ski.
// A ski model points along +x. If the 3D library or WebGL is missing, the overhead view above is used instead.
const T3=window.THREE||null, G={on:false,lastT:0,ch:0,cy:0,sw:0,cx:0,cz:0,pi:0};
const PAL3={
  havasu:{zen:'#2a74c6',hor:'#cfe2e8',deep:'#0d4868',shal:'#3aa3b0',sand:'#dcc797',wet:'#b9a06c',top:'#bfa76f',tree:'#7d8c4c',rock:'#a8835c',far:'#a98468',fog:.00024,cloud:.45,sun:[-.5,.5,-.7]},
  pattaya:{zen:'#1a6ad0',hor:'#d5eef2',deep:'#083f78',shal:'#2fb0c6',sand:'#efe1b6',wet:'#cbb886',top:'#4a9150',tree:'#2f7d3f',rock:'#7d8a70',far:'#5f9280',fog:.00022,cloud:.75,sun:[.3,.6,-.74]},
  bayou:{zen:'#7fb0c8',hor:'#e9dfc6',deep:'#1a2c22',shal:'#4e6448',sand:'#6d5b3b',wet:'#4b3f29',top:'#417d3d',tree:'#2a5a30',rock:'#5a5140',far:'#3e5a42',fog:.00042,cloud:.9,sun:[.6,.36,.71]},
  daytona:{zen:'#3d83c4',hor:'#dbe8e6',deep:'#0a4658',shal:'#3aa39c',sand:'#e6d6b0',wet:'#c2b08a',top:'#6f9a5a',tree:'#3f7d45',rock:'#7d8a70',far:'#6f9488',fog:.00026,cloud:.6,sun:[.45,.5,-.74]},
  stormhead:{zen:'#5f7f96',hor:'#cfd6d6',deep:'#0c3447',shal:'#2f7f86',sand:'#6a6f70',wet:'#4a4f52',top:'#5f7a4f',tree:'#4a6a44',rock:'#4d5257',far:'#5c6a70',fog:.00034,cloud:1,sun:[-.4,.42,-.81]},
  redrock:{zen:'#2a6cc0',hor:'#f1dcc6',deep:'#0c5f6c',shal:'#45bcae',sand:'#cf7c54',wet:'#a35b3c',top:'#c9764c',tree:'#72834a',rock:'#b6633d',far:'#b96f4e',fog:.00024,cloud:.35,sun:[-.6,.42,.68]}};
PAL3.arena={zen:'#2b2f63',hor:'#f3a66b',deep:'#123a52',shal:'#2f7f8f',sand:'#7a7f86',wet:'#5a5f66',top:'#6b8f4a',tree:'#3f6b3a',rock:'#6a6f76',far:'#4a3f5a',fog:.00032,cloud:.5,sun:[.7,.1,.7],sunCol:'#ffab66',sunI:.5,hemiI:.62};
PAL3.glacier={zen:'#2f6fb8',hor:'#dfe8ee',deep:'#0b3a4c',shal:'#3e8e9c',sand:'#8b8f8c',wet:'#545b5a',top:'#3f5f3c',tree:'#24452e',rock:'#7f8584',far:'#6f8296',fog:.00022,cloud:.4,sun:[-.4,.55,-.73],snow:[1100,760]};
PAL3.lagoon={zen:'#1d7fd6',hor:'#d8f2f4',deep:'#0a6f8a',shal:'#46d6cf',sand:'#f4ecd2',wet:'#d9c99a',top:'#5aa35a',tree:'#2f8a45',rock:'#9a9a8a',far:'#4f8f6a',fog:.0002,cloud:.55,sun:[.35,.62,-.7]};
// Grand Cayman: clear Caribbean water, white sand, a flat green island and a high sun
PAL3.cayman={zen:'#1874d2',hor:'#d6f0f4',deep:'#0a5d86',shal:'#38c9cf',sand:'#f6efd8',wet:'#dccb9c',top:'#5d9e4f',tree:'#2f8a45',rock:'#a29d8a',far:'#5f9a72',fog:.00018,cloud:.5,sun:[.25,.7,-.66]};
PAL3.river={zen:'#4c8cc8',hor:'#dde4e6',deep:'#1c4a56',shal:'#3f7f83',sand:'#b8b4aa',wet:'#8c8a84',top:'#5c8f48',tree:'#3d7440',rock:'#8a8780',far:'#8f9aa3',fog:.0003,cloud:.6,sun:[.5,.5,.7]};
const CARS=['#e8e8e4','#30363a','#a8322c','#2b5d9c','#c8c2b0','#5a6066'];
const WAVE_GLSL=`
uniform vec3 uWk[4]; uniform vec2 uWa[4]; uniform vec4 uZ[3]; uniform float uT;
float zoneG(vec2 p){float g=1.; for(int i=0;i<3;i++){vec2 d=p-uZ[i].xy; g+=uZ[i].w*exp(-dot(d,d)*uZ[i].z);} return g;}
float waveY(vec2 p){float h=0.; for(int i=0;i<4;i++) h+=uWa[i].x*sin(uWk[i].x*p.x+uWk[i].y*p.y-uWk[i].z*uT+uWa[i].y); return h*zoneG(p);}
vec2 waveG(vec2 p){vec2 g=vec2(0.); for(int i=0;i<4;i++) g+=uWk[i].xy*(uWa[i].x*cos(uWk[i].x*p.x+uWk[i].y*p.y-uWk[i].z*uT+uWa[i].y)); return g*zoneG(p);}
float waveF(vec2 p){return 1.-smoothstep(900.,2800.,distance(p,cameraPosition.xz));}
`;
const FOG_GLSL=`
uniform vec3 uHor; uniform float uFogD;
vec3 fogged(vec3 c,float d){return mix(c,uHor,1.-exp(-uFogD*uFogD*d*d));}
`;

// a little mesh builder: flat-shaded triangles, each with its own colour
function Bld(){this.p=[];this.c=[];this.xn=[];}
Bld.prototype.tri=function(a,b,c,col){
  this.p.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]);
  for(let i=0;i<3;i++) this.c.push(col.r,col.g,col.b);
};
Bld.prototype.tri3=function(a,b,c,ca,cb,cc){
  this.p.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]); this.c.push(ca.r,ca.g,ca.b,cb.r,cb.g,cb.b,cc.r,cc.g,cc.b);
};
Bld.prototype.quad=function(a,b,c,d,col){this.tri(a,b,c,col); this.tri(a,c,d,col);};
// a box that can taper: a rear rectangle at x0 and a front one at x1, centred on z = zc
Bld.prototype.wedge=function(x0,x1,w0,w1,yb0,yt0,yb1,yt1,col,zc){
  zc=zc||0;
  const a=[x0,yb0,zc-w0],b=[x0,yb0,zc+w0],c=[x0,yt0,zc+w0],d=[x0,yt0,zc-w0],e=[x1,yb1,zc-w1],f=[x1,yb1,zc+w1],g=[x1,yt1,zc+w1],h=[x1,yt1,zc-w1];
  this.quad(a,b,c,d,col); this.quad(e,f,g,h,col); this.quad(d,c,g,h,col); this.quad(a,b,f,e,col); this.quad(b,c,g,f,col); this.quad(a,d,h,e,col);
};
Bld.prototype.box=function(cx,cy,cz,sx,sy,sz,col){this.wedge(cx-sx/2,cx+sx/2,sz/2,sz/2,cy-sy/2,cy+sy/2,cy-sy/2,cy+sy/2,col,cz);};
// a bar from a to b, w across and d deep
Bld.prototype.limb=function(a,b,w,d,col){
  let ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2]; const l=Math.hypot(ux,uy,uz)||1; ux/=l;uy/=l;uz/=l;
  let sx=0,sy=0,sz=1; if(Math.abs(uz)>.9){sx=0;sy=1;sz=0;}
  const dt=sx*ux+sy*uy+sz*uz; sx-=dt*ux;sy-=dt*uy;sz-=dt*uz; const sl=Math.hypot(sx,sy,sz); sx/=sl;sy/=sl;sz/=sl;
  const tx=uy*sz-uz*sy, ty=uz*sx-ux*sz, tz=ux*sy-uy*sx, P=(o,i,j)=>[o[0]+sx*i*w/2+tx*j*d/2,o[1]+sy*i*w/2+ty*j*d/2,o[2]+sz*i*w/2+tz*j*d/2];
  const A=[P(a,-1,-1),P(a,1,-1),P(a,1,1),P(a,-1,1)], B=[P(b,-1,-1),P(b,1,-1),P(b,1,1),P(b,-1,1)];
  this.quad(A[0],A[1],A[2],A[3],col); this.quad(B[0],B[1],B[2],B[3],col);
  for(let k=0;k<4;k++) this.quad(A[k],A[(k+1)%4],B[(k+1)%4],B[k],col);
};
// any ready-made shape, moved into place
Bld.prototype.geo=function(g,col,x,y,z,sx,sy,sz){
  const s=g.index?g.toNonIndexed():g, pos=s.attributes.position;
  sx=sx||1; sy=sy||sx; sz=sz||sx;
  for(let i=0;i<pos.count;i++){this.p.push(pos.getX(i)*sx+x,pos.getY(i)*sy+y,pos.getZ(i)*sz+z); this.c.push(col.r,col.g,col.b);}
  if(s!==g) s.dispose(); g.dispose();
};
// a corner with a normal of its own, for surfaces that should catch the light as curves
Bld.prototype.sv=function(p,n,col){this.xn.push(this.p.length/3,n[0],n[1],n[2]); this.p.push(p[0],p[1],p[2]); this.c.push(col.r,col.g,col.b);};
// A skin stretched over a run of rings, each ring the same number of points. It is smooth along its length; across it, it is
// smooth too except at ring points marked hard, which stay as creases (a chine, a rub rail).
Bld.prototype.loft=function(R,col,hard,closed){
  const M=R.length, K=R[0].length, Q=closed?K:K-1, F=[];
  for(let i=0;i<M-1;i++){
    F.push([]);
    for(let k=0;k<Q;k++){
      const a=R[i][k], b=R[i][(k+1)%K], c=R[i+1][(k+1)%K], d=R[i+1][k], ex=c[0]-a[0], ey=c[1]-a[1], ez=c[2]-a[2], fx=d[0]-b[0], fy=d[1]-b[1], fz=d[2]-b[2];
      const nx=ey*fz-ez*fy, ny=ez*fx-ex*fz, nz=ex*fy-ey*fx, l=Math.hypot(nx,ny,nz)||1; F[i].push([nx/l,ny/l,nz/l]);
    }
  }
  const vn=(i,q,right)=>{
    let x=0,y=0,z=0; const kp=right?(q+1)%K:q, o=right?q+1:q-1;
    const acc=(ii,kk)=>{if(ii<0||ii>=M-1) return; if(kk<0||kk>=Q){if(!closed) return; kk=(kk+Q)%Q;} const f=F[ii][kk]; x+=f[0]; y+=f[1]; z+=f[2];};
    acc(i-1,q); acc(i,q); if(!(hard&&hard[kp])){acc(i-1,o); acc(i,o);}
    const l=Math.hypot(x,y,z)||1; return [x/l,y/l,z/l];
  };
  for(let i=0;i<M-1;i++) for(let k=0;k<Q;k++){
    const a=R[i][k], b=R[i][(k+1)%K], c=R[i+1][(k+1)%K], d=R[i+1][k], C=col(i,k), na=vn(i,k,false), nb=vn(i,k,true), nc=vn(i+1,k,true), nd=vn(i+1,k,false);
    this.sv(a,na,C); this.sv(b,nb,C); this.sv(c,nc,C); this.sv(a,na,C); this.sv(c,nc,C); this.sv(d,nd,C);
  }
};
Bld.prototype.ball=function(c,r,col,ws,hs){
  const g0=new T3.SphereGeometry(1,ws||10,hs||7), g=g0.toNonIndexed(), P=g.attributes.position;
  for(let i=0;i<P.count;i++){
    const x=P.getX(i), y=P.getY(i), z=P.getZ(i), nx=x/r[0], ny=y/r[1], nz=z/r[2], l=Math.hypot(nx,ny,nz)||1;
    this.sv([c[0]+x*r[0],c[1]+y*r[1],c[2]+z*r[2]],[nx/l,ny/l,nz/l],col);
  }
  g0.dispose(); g.dispose();
};
// a round limb from a to b, r0 thick at a and r1 at b
Bld.prototype.tube=function(a,b,r0,r1,col,n){
  n=n||7; let ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2]; const l=Math.hypot(ux,uy,uz)||1; ux/=l;uy/=l;uz/=l;
  let sx=0,sy=1,sz=0; if(Math.abs(uy)>.9){sx=1;sy=0;}
  const d=sx*ux+sy*uy+sz*uz; sx-=d*ux; sy-=d*uy; sz-=d*uz; const sl=Math.hypot(sx,sy,sz); sx/=sl;sy/=sl;sz/=sl;
  const tx=uy*sz-uz*sy, ty=uz*sx-ux*sz, tz=ux*sy-uy*sx, N=[], P=(o,q,r)=>[o[0]+q[0]*r,o[1]+q[1]*r,o[2]+q[2]*r];
  for(let i=0;i<=n;i++){const an=i/n*TAU, c=Math.cos(an), sn=Math.sin(an); N.push([sx*c+tx*sn,sy*c+ty*sn,sz*c+tz*sn]);}
  for(let i=0;i<n;i++){
    const A=P(a,N[i],r0), B=P(a,N[i+1],r0), C=P(b,N[i+1],r1), D=P(b,N[i],r1);
    this.sv(A,N[i],col); this.sv(B,N[i+1],col); this.sv(C,N[i+1],col); this.sv(A,N[i],col); this.sv(C,N[i+1],col); this.sv(D,N[i],col);
  }
};
Bld.prototype.done=function(){
  const g=new T3.BufferGeometry();
  g.setAttribute('position',new T3.Float32BufferAttribute(this.p,3)); g.setAttribute('color',new T3.Float32BufferAttribute(this.c,3));
  g.computeVertexNormals();
  const na=g.attributes.normal.array, x=this.xn;
  for(let i=0;i<x.length;i+=4){const o=x[i]*3; na[o]=x[i+1]; na[o+1]=x[i+2]; na[o+2]=x[i+3];}
  return g;
};
const C3=h=>new T3.Color(h);

// surface height as drawn: all the waves at full size, flattening out far from the camera where the water mesh is coarse
function g3H(x,z){
  const d=Math.hypot(x-G.cx,z-G.cz), f=d<900?1:d>2800?0:1-(d-900)/1900;
  return f>0?waveH(x,z,clock,wd.env.waves,false,wd.env.zones)*(f*f*(3-2*f)):0;
}

function g3Detail(){
  // fine ripples: a tile of small waves, with its slopes in red and green and its height in blue
  const n=128, c=mk(n,n), x=c.getContext('2d'), im=x.createImageData(n,n), w=[], gx=new Float32Array(n*n), gy=new Float32Array(n*n), hh=new Float32Array(n*n);
  for(let i=0;i<18;i++){
    const kx=Math.round((hash(i,1,77)-.5)*18), ky=Math.round((hash(i,2,77)-.5)*18); if(!kx&&!ky) continue;
    w.push([kx,ky,hash(i,3,77)*TAU,1/Math.pow(Math.hypot(kx,ky),.8)]);
  }
  let gm=1e-6, hm=1e-6;
  for(let j=0;j<n;j++) for(let i=0;i<n;i++){
    let a=0,b=0,h=0;
    for(const q of w){const p=TAU*(q[0]*i+q[1]*j)/n+q[2], cs=Math.cos(p)*q[3]; a+=cs*q[0]; b+=cs*q[1]; h+=Math.sin(p)*q[3];}
    gx[j*n+i]=a; gy[j*n+i]=b; hh[j*n+i]=h; gm=Math.max(gm,Math.abs(a),Math.abs(b)); hm=Math.max(hm,Math.abs(h));
  }
  for(let k=0;k<n*n;k++){im.data[k*4]=127.5+127.5*gx[k]/gm; im.data[k*4+1]=127.5+127.5*gy[k]/gm; im.data[k*4+2]=127.5+127.5*hh[k]/hm; im.data[k*4+3]=255;}
  x.putImageData(im,0,0);
  const t=new T3.CanvasTexture(c); t.wrapS=t.wrapT=T3.RepeatWrapping; return t;
}
function g3WaterGeo(){
  const rad=[0], SEG=84, pos=[], idx=[]; let r=0;
  while(r<300){r+=7; rad.push(r);}
  while(r<10000){r*=1.11; rad.push(r);}
  for(const q of rad) for(let j=0;j<SEG;j++){const a=j/SEG*TAU; pos.push(Math.cos(a)*q,0,Math.sin(a)*q);}
  for(let i=0;i<rad.length-1;i++) for(let j=0;j<SEG;j++){const a=i*SEG+j, b=i*SEG+(j+1)%SEG; idx.push(a,a+SEG,b,b,a+SEG,b+SEG);}
  const g=new T3.BufferGeometry(); g.setAttribute('position',new T3.Float32BufferAttribute(pos,3)); g.setIndex(idx); return g;
}

function g3Init(){
  if(!T3) return false;
  let r=null;
  try{r=new T3.WebGLRenderer({canvas:$('gl'),antialias:true,powerPreference:'high-performance'});}catch(e){return false;}
  G.r=r; G.scene=new T3.Scene(); G.cam=new T3.PerspectiveCamera(70,1,2,17000);
  G.fog=new T3.FogExp2(0xffffff,.00024); G.scene.fog=G.fog;
  G.hemi=new T3.HemisphereLight(0xffffff,0x7fa0aa,.66); G.sunL=new T3.DirectionalLight(0xfff2d8,.6); G.scene.add(G.hemi,G.sunL);
  G.mat=new T3.MeshLambertMaterial({vertexColors:true,side:T3.DoubleSide});
  G.matSki=new T3.MeshPhongMaterial({vertexColors:true,side:T3.DoubleSide,shininess:70,specular:0x4a4a4a});   // gelcoat
  G.matI=new T3.MeshLambertMaterial({vertexColors:true,side:T3.DoubleSide});          // for instanced props tinted one by one
  G.matF=new T3.MeshLambertMaterial({emissive:0x4a4a4a});                                                // floats
  G.matR=new T3.MeshLambertMaterial({vertexColors:true,emissive:0x4a0f0a}); G.matY=new T3.MeshLambertMaterial({vertexColors:true,emissive:0x4a3a05});
  G.matBack=new T3.MeshBasicMaterial({vertexColors:true,fog:false,side:T3.DoubleSide});
  const V3=()=>new T3.Vector3(), V2=()=>new T3.Vector2();
  const u=G.u={uT:{value:0},uWk:{value:[V3(),V3(),V3(),V3()]},uWa:{value:[V2(),V2(),V2(),V2()]},uZ:{value:[new T3.Vector4(0,0,1,0),new T3.Vector4(0,0,1,0),new T3.Vector4(0,0,1,0)]},uAmp:{value:1},uChop:{value:.2},uCloud:{value:.5},
    uDeep:{value:C3('#0d4868')},uShal:{value:C3('#3aa3b0')},uZen:{value:C3('#2a74c6')},uHor:{value:C3('#cfe2e8')},uSun:{value:V3()},uSunCol:{value:C3('#fff2d8')},
    uFogD:{value:.00024},uDet:{value:g3Detail()},uShore:{value:V2()},uPx:{value:600}};
  // water
  G.water=new T3.Mesh(g3WaterGeo(),new T3.ShaderMaterial({uniforms:u,side:T3.DoubleSide,
    vertexShader:WAVE_GLSL+`varying vec3 vW; varying float vH;
void main(){vec4 w=modelMatrix*vec4(position,1.); vH=waveY(w.xz); w.y=vH*waveF(w.xz); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:WAVE_GLSL+FOG_GLSL+`uniform vec3 uDeep,uShal,uZen,uSun,uSunCol; uniform sampler2D uDet; uniform vec2 uShore; uniform float uChop,uAmp;
varying vec3 vW; varying float vH;
void main(){
  vec3 V=cameraPosition-vW; float d=length(V); V/=d;
  float fd=waveF(vW.xz);
  vec2 g=waveG(vW.xz)*fd;
  vec3 t1=texture2D(uDet,vW.xz*.0125+vec2(uT*.045,uT*.03)).rgb;
  vec3 t2=texture2D(uDet,vW.zx*.0041+vec2(-uT*.02,uT*.013)).rgb;
  g+=((t1.rg-.5)*.5+(t2.rg-.5)*.75)*(.45+uChop);
  vec3 n=normalize(vec3(-g.x,1.,-g.y));
  float nv=max(dot(n,V),0.);
  float fres=.025+.975*pow(1.-nv,5.);
  vec3 R=reflect(-V,n); R.y=abs(R.y);
  vec3 sky=mix(uHor,uZen,pow(R.y,.5));
  float sh=uShore.y*smoothstep(560.,40.,vW.x-uShore.x);
  vec3 body=mix(uDeep,uShal,clamp(.14+.55*nv*nv+.6*sh+.03*vH*fd,0.,1.));
  vec3 col=mix(body,sky,fres*.86);
  float sd=max(dot(R,uSun),0.);
  col+=uSunCol*(pow(sd,420.)*1.+pow(sd,24.)*.08);
  float foam=smoothstep(.45,.95,vH/uAmp)*smoothstep(.5,.66,t1.b*.6+t2.b*.4)*uChop*fd;
  col=mix(col,vec3(.94,.97,.98),clamp(foam,0.,.75));
  gl_FragColor=vec4(fogged(col,d),1.);
}`}));
  G.water.frustumCulled=false; G.water.renderOrder=-5; G.scene.add(G.water);
  // sky
  G.sky=new T3.Mesh(new T3.SphereGeometry(5000,24,12),new T3.ShaderMaterial({uniforms:u,side:T3.BackSide,depthWrite:false,depthTest:false,
    vertexShader:`varying vec3 vD; void main(){vD=position; gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform vec3 uZen,uHor,uSun,uSunCol; uniform float uT,uCloud; varying vec3 vD;
float hsh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hsh(i),hsh(i+vec2(1.,0.)),f.x),mix(hsh(i+vec2(0.,1.)),hsh(i+vec2(1.,1.)),f.x),f.y);}
void main(){
  vec3 d=normalize(vD); float y=max(d.y,0.);
  vec3 col=mix(uHor,uZen,pow(y,.5));
  float s=max(dot(d,uSun),0.);
  col+=uSunCol*(pow(s,3000.)*2.+pow(s,220.)*.3+pow(s,14.)*.1);
  vec2 p=d.xz/(d.y+.16)*1.5+vec2(uT*.005,0.);
  float c=vn(p)*.55+vn(p*2.1+3.)*.28+vn(p*4.3+7.)*.17, th=.74-.24*uCloud;
  col=mix(col,vec3(1.,.99,.97),smoothstep(th,th+.16,c)*smoothstep(.01,.17,d.y)*.82);
  gl_FragColor=vec4(col,1.);
}`}));
  G.sky.frustumCulled=false; G.sky.renderOrder=-10; G.scene.add(G.sky);
  // wakes: foam ribbons laid along each ski's track, riding the same waves
  G.WMAX=10*40*12;
  {const g=new T3.BufferGeometry();
   G.wp=new Float32Array(G.WMAX*3); G.wa=new Float32Array(G.WMAX*2);
   g.setAttribute('position',new T3.BufferAttribute(G.wp,3).setUsage(T3.DynamicDrawUsage));
   g.setAttribute('aA',new T3.BufferAttribute(G.wa,2).setUsage(T3.DynamicDrawUsage));
   // Foam is drawn straight after the water and before anything else, without a depth test: it can never be cut up by a
   // wave crest poking through it, and skis, buoys and land still draw over it.
   G.wake=new T3.Mesh(g,new T3.ShaderMaterial({uniforms:u,side:T3.DoubleSide,blending:T3.CustomBlending,depthTest:false,depthWrite:false,
     vertexShader:WAVE_GLSL+`attribute vec2 aA; varying vec2 vA; varying vec3 vW;
void main(){vec4 w=vec4(position,1.); w.y=waveY(w.xz)*waveF(w.xz)+.45; vA=aA; vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w;}`,
     fragmentShader:FOG_GLSL+`uniform sampler2D uDet; varying vec2 vA; varying vec3 vW;
void main(){float n=texture2D(uDet,vW.xz*.023).b*.6+texture2D(uDet,vW.zx*.071).b*.4; float e=smoothstep(1.,.35,abs(vA.y));
  float a=vA.x*e*(.16+.84*smoothstep(.4,.62,n+.12*vA.x)); gl_FragColor=vec4(fogged(vec3(.95,.985,1.),distance(cameraPosition,vW)),a*.7);}`}));
   G.wake.frustumCulled=false; G.wake.renderOrder=-4; G.scene.add(G.wake);}
  // the way ahead: chevrons lying on the water down the middle of the lane, part of the rider aids
  {const g=new T3.BufferGeometry(); G.GN=16;
   G.gp=new Float32Array(G.GN*12*3); G.gc=new Float32Array(G.GN*12*4);
   g.setAttribute('position',new T3.BufferAttribute(G.gp,3).setUsage(T3.DynamicDrawUsage));
   g.setAttribute('aC',new T3.BufferAttribute(G.gc,4).setUsage(T3.DynamicDrawUsage));
   G.guide=new T3.Mesh(g,new T3.ShaderMaterial({uniforms:u,side:T3.DoubleSide,blending:T3.CustomBlending,depthTest:false,depthWrite:false,
     vertexShader:WAVE_GLSL+`attribute vec4 aC; varying vec4 vC;
void main(){vec4 w=vec4(position,1.); w.y=waveY(w.xz)*waveF(w.xz)+.4; vC=aC; gl_Position=projectionMatrix*viewMatrix*w;}`,
     fragmentShader:`varying vec4 vC; void main(){gl_FragColor=vC;}`}));
   G.guide.frustumCulled=false; G.guide.renderOrder=-4; G.scene.add(G.guide);}
  // spray
  G.PMAX=1300;
  {const g=new T3.BufferGeometry(), n=G.PMAX;
   G.pp=new Float32Array(n*3); G.ps=new Float32Array(n); G.pa=new Float32Array(n);
   G.pv=new Float32Array(n*3); G.pl=new Float32Array(n); G.pm=new Float32Array(n); G.pz=new Float32Array(n*2); G.pk=new Float32Array(n);
   g.setAttribute('position',new T3.BufferAttribute(G.pp,3).setUsage(T3.DynamicDrawUsage));
   g.setAttribute('aS',new T3.BufferAttribute(G.ps,1).setUsage(T3.DynamicDrawUsage));
   g.setAttribute('aA',new T3.BufferAttribute(G.pa,1).setUsage(T3.DynamicDrawUsage));
   G.spray=new T3.Points(g,new T3.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,
     vertexShader:`attribute float aS,aA; uniform float uPx; varying float vA;
void main(){vec4 mv=viewMatrix*vec4(position,1.); vA=aA; gl_PointSize=aS*uPx/max(1.,-mv.z); gl_Position=projectionMatrix*mv;}`,
     fragmentShader:`varying float vA; void main(){float r=length(gl_PointCoord-.5); gl_FragColor=vec4(.96,.985,1.,vA*smoothstep(.5,.12,r));}`}));
   G.spray.frustumCulled=false; G.spray.renderOrder=3; G.scene.add(G.spray);}
  // the finish banner's checkers
  {const c=mk(2,2), x=c.getContext('2d'); x.fillStyle='#f4f6f3'; x.fillRect(0,0,2,2); x.fillStyle='#10181c'; x.fillRect(0,0,1,1); x.fillRect(1,1,1,1);
   G.chk=new T3.CanvasTexture(c); G.chk.magFilter=T3.NearestFilter; G.chk.minFilter=T3.LinearFilter; G.chk.generateMipmaps=false; G.chk.wrapS=G.chk.wrapT=T3.RepeatWrapping;
   G.matChk=new T3.MeshBasicMaterial({map:G.chk,side:T3.DoubleSide});}
  // a soft shadow under each ski, left on the water when the ski leaves it
  {const c=mk(64,64), x=c.getContext('2d'), g=x.createRadialGradient(32,32,4,32,32,32);
   g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.55,'rgba(255,255,255,.7)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,64,64);
   G.shGeo=new T3.PlaneGeometry(1,1);
   G.shMat=new T3.MeshBasicMaterial({map:new T3.CanvasTexture(c),color:0x031c26,opacity:.34,blending:T3.CustomBlending,depthTest:false,depthWrite:false,fog:false});}
  G.shG=new T3.Group(); G.scene.add(G.shG);
  G.Y=new T3.Vector3(0,1,0);
  G.tmp=new T3.Matrix4(); G.v=V3(); G.skiG=new T3.Group(); G.scene.add(G.skiG);
  return true;
}
function g3Clear(grp){
  // a racer's own model is kept for the next race: lift it out before the rest is thrown away
  for(const k in G.mdl||{}){const o=G.mdl[k]; if(o.parent) o.parent.remove(o);}
  // so is the shape of a painted ski model, which every racer on that model shares
  for(const b of G.bases||[]) if(b&&b.mesh){for(const m of b.mesh){if(m.parent) m.parent.remove(m); m.material.dispose();} b.mesh=[];}
  if(G.rider){for(const k of G.rider.used){if(k.root.parent) k.root.parent.remove(k.root); k.mesh.material.dispose(); k.mesh.skeleton.dispose();} G.rider.used=[];}
  grp.traverse(o=>{if(o.geometry&&o.geometry!==G.shGeo&&o.geometry!==G.plGeo) o.geometry.dispose(); if(o.material&&o.material.userData.own) o.material.dispose(); if(o.isInstancedMesh) o.dispose();});
  while(grp.children.length) grp.remove(grp.children[0]);
}

// ----- the land, built once per site -----
function g3Prof(d){return d<.55?1:d<.8?1-(d-.55)/.25*.55:Math.max(-.2,.45-(d-.8)/.2*.65);}
function g3Ground(x,z){
  let h=-1;
  for(const b of LAND){const d=Math.hypot(x-b.x,z-b.y)/b.r; if(d<1){const y=b.h3*(b.butte?(d<.62?1:d<.7?.3:.22*(1-d)/.3):g3Prof(d)); if(y>h) h=y;}}
  return h;
}
function g3Mound(rim,mid,top){
  const b=new Bld(), S=14, R=[[0,1,top],[.55,1,top],[.8,.45,mid],[1,-.2,rim]];
  for(let j=0;j<S;j++){
    const a0=j/S*TAU, a1=(j+1)/S*TAU, P=(k,a)=>[Math.cos(a)*R[k][0],R[k][1],Math.sin(a)*R[k][0]];
    b.tri(P(0,a0),P(1,a0),P(1,a1),top);
    b.quad(P(1,a0),P(2,a0),P(2,a1),P(1,a1),mid); b.quad(P(2,a0),P(3,a0),P(3,a1),P(2,a1),rim);
  }
  return b.done();
}
function g3Butte(rock,talus,cap){
  const b=new Bld(), S=10, band=rock.clone().multiplyScalar(.82);
  const R=[[1,0],[.74,.2],[.68,.3],[.65,.62],[.64,.7],[.61,1]], cols=[talus,talus,rock,band,rock];
  const jit=j=>1+(hash(j%S,5,91)-.5)*.2, P=(k,j)=>{const a=j/S*TAU, q=R[k][0]*jit(j); return [Math.cos(a)*q,R[k][1],Math.sin(a)*q];};
  for(let j=0;j<S;j++){
    for(let k=0;k<R.length-1;k++) b.quad(P(k,j),P(k+1,j),P(k+1,j+1),P(k,j+1),cols[k]);
    b.tri([0,1.02,0],P(R.length-1,j),P(R.length-1,j+1),cap);
  }
  return b.done();
}
function g3Tree(kind,leaf){
  const b=new Bld(), bark=C3(kind==='palm'?'#8a7355':'#4f3d2a'), l2=leaf.clone().multiplyScalar(.82);
  if(kind==='canopy'){
    b.geo(new T3.CylinderGeometry(.06,.11,1.2,5,1,true),bark,0,.6,0);
    b.geo(new T3.IcosahedronGeometry(.62,0),leaf,0,1.55,0,1,1.3,1);
    b.geo(new T3.IcosahedronGeometry(.42,0),l2,.38,1.15,.2); b.geo(new T3.IcosahedronGeometry(.4,0),l2,-.3,1.2,-.3);
  }else if(kind==='palm'){
    b.limb([0,0,0],[.12,1.9,.05],.1,.1,bark);
    for(let i=0;i<7;i++){const a=i/7*TAU; b.limb([.12,1.9,.05],[.12+Math.cos(a)*.8,1.62,.05+Math.sin(a)*.8],.3,.05,i&1?leaf:l2);}
  }else if(kind==='pine'){
    b.geo(new T3.CylinderGeometry(.05,.09,.6,5,1,true),bark,0,.3,0);
    b.geo(new T3.ConeGeometry(.5,.9,7),l2,0,.85,0); b.geo(new T3.ConeGeometry(.4,.8,7),leaf,0,1.3,0); b.geo(new T3.ConeGeometry(.28,.7,7),leaf,0,1.75,0);
  }else{
    b.geo(new T3.IcosahedronGeometry(.45,0),leaf,0,.2,0,1,.6,1); b.geo(new T3.IcosahedronGeometry(.3,0),l2,.3,.14,.2,1,.6,1);
  }
  return b.done();
}
function g3Tent(){
  const b=new Bld(), leg=C3('#8f979b'), w=C3('#ffffff');
  for(const i of [-1,1]) for(const j of [-1,1]) b.box(i*13,9.5,j*13,1,19,1,leg);
  b.box(0,20,0,30,2.6,30,w);
  const c=[[-15,21.3,-15],[15,21.3,-15],[15,21.3,15],[-15,21.3,15]];
  for(let k=0;k<4;k++) b.tri(c[k],c[(k+1)%4],[0,29.5,0],w);
  return b.done();
}
function g3Umb(){
  const b=new Bld(); b.box(0,10,0,.8,20,.8,C3('#8f979b')); b.geo(new T3.ConeGeometry(13,5.5,8),C3('#ffffff'),0,21,0); return b.done();
}
function g3Car(){
  const b=new Bld(), w=C3('#ffffff'), gl=C3('#5d6a72'), k=C3('#2a2f33');
  b.box(0,8.5,0,46,9,19,w); b.wedge(-14,10,8.5,8.5,13,20,13,19,gl); b.box(0,3.2,0,40,3.2,20,k); return b.done();
}
// many copies of one shape, each with its own place, size and tint
function g3Many(S,geo,mat,list){
  if(!list.length){geo.dispose(); return;}
  const m=new T3.InstancedMesh(geo,mat,list.length), o=new T3.Object3D();
  list.forEach((q,i)=>{
    o.position.set(q.x,q.y,q.z); o.rotation.set(0,q.a||0,0); o.scale.set(q.sx,q.sy||q.sx,q.sz||q.sx); o.updateMatrix(); m.setMatrixAt(i,o.matrix);
    if(q.col) m.setColorAt(i,q.col);
  });
  m.frustumCulled=false; S.add(m);
}
function g3Backdrop(S,P,cx,cz,R){
  const b=new Bld(), hor=C3(P.hor), id=site.id, sx=site.shore?site.shore.x:0, cityId=id==='river'||id==='arena', snowC=C3('#f4f7fa').lerp(hor,.25);
  const n1=(a,k)=>.5+.25*Math.sin(a*3+k)+.15*Math.sin(a*7+k*2.3)+.1*Math.sin(a*13+k*5.1);
  for(let layer=0;layer<2;layer++){
    const rad=R+(layer?0:2600), M=layer?260:200, top=C3(P.far).lerp(hor,layer?.3:.58), base=top.clone().lerp(hor,.6);
    const hgt=i=>{
      const a=i/M*TAU, n=n1(a,layer*4+1), j=hash(i,layer,41);
      if(id==='havasu') return (layer?200:460)+(layer?300:400)*n+j*26;
      if(id==='redrock') return 170+Math.round(n*3+hash(Math.floor(i/5),layer,43)*.8)*(layer?150:200)+j*10;
      if(id==='bayou') return (layer?130:210)+70*n+j*40;
      if(id==='glacier') return (layer?420:650)+(layer?900:1500)*n*n+j*(layer?120:220);
      if(id==='lagoon') return Math.max(0,n-.56)*(layer?1100:2000);
      if(id==='cayman') return 0;                                  // open sea all round the island
      if(cityId) return layer?(hash(i,7,47)>.35?110+hash(i,8,47)*(id==='river'?620:380):50):(id==='arena'?150:210)+120*n;
      // sea sites: land only along one side. A beach town has low hills behind a line of towers; the open ocean has a headland.
      const w=clamp((-Math.cos(a)-.25)*3,0,1); if(w<=0) return 0;
      if(id==='stormhead') return (layer?260:420)*w*(.6+.6*n)+j*30;
      return layer?(hash(i,7,47)>.5?80+hash(i,8,47)*300:36)*w:(200+260*n)*w;
    };
    const city=(site.city||id==='pattaya'||cityId)&&layer, cc=C3('#c9d6d8').lerp(hor,.35), cb=cc.clone().lerp(hor,.5);
    for(let i=0;i<M;i++){
      const a0=i/M*TAU, a1=(i+1)/M*TAU, h0=hgt(i), h1=city?h0:hgt(i+1); if(h0<=0&&h1<=0) continue;
      const x0=cx+Math.cos(a0)*rad, z0=cz+Math.sin(a0)*rad, x1=cx+Math.cos(a1)*rad, z1=cz+Math.sin(a1)*rad;
      if(site.shore&&id!=='havasu'&&x0>sx-200) continue;
      const t=city?cc:top, q=city?cb:base, sl=P.snow?P.snow[layer]:1e9, t0=h0>sl?snowC:t, t1=h1>sl?snowC:t;
      if(P.snow&&!city){
        // a snow line: below it the rock, above it the snow
        const m0=Math.min(h0,sl), m1=Math.min(h1,sl);
        b.tri3([x0,-12,z0],[x1,-12,z1],[x1,m1,z1],q,q,t); b.tri3([x0,-12,z0],[x1,m1,z1],[x0,m0,z0],q,t,t);
        if(h0>sl||h1>sl){b.tri3([x0,m0,z0],[x1,m1,z1],[x1,h1,z1],snowC,snowC,t1); b.tri3([x0,m0,z0],[x1,h1,z1],[x0,h0,z0],snowC,t1,t0);}
      }else{b.tri3([x0,-12,z0],[x1,-12,z1],[x1,h1,z1],q,q,t); b.tri3([x0,-12,z0],[x1,h1,z1],[x0,h0,z0],q,t,t);}
    }
  }
  if(b.p.length) S.add(new T3.Mesh(b.done(),G.matBack));
}

// ----- landmarks, and the life round a course -----
// stand a thing across the lane: its own x runs from the left edge to the right, its z back down the lane
function g3Across(m,x,z,h){m.position.set(x,0,z); m.rotation.y=-Math.atan2(Math.cos(h),-Math.sin(h)); return m;}
function g3BoatGeo(hull,stripe){
  const b=new Bld(), w=C3('#f3f5f2'), gl=C3('#33424b'), dk=C3('#1c2429');
  b.wedge(-40,18,13,13,-3,8,-3,9,hull); b.wedge(18,46,13,1.5,-3,9,3,11,hull); b.wedge(-40,18,13.4,13.4,8,10,9,11,stripe); b.wedge(18,46,13.4,1.8,9,11,11,12,stripe);
  b.wedge(-16,12,9.5,8.5,10,21,10,19,w); b.wedge(-15,13,9.8,8.8,15,19,15,17.5,gl); b.wedge(-18,14,10.5,9.5,21,22.4,19,20.4,w);
  b.box(-34,12,0,8,6,16,dk); b.box(-2,28,0,.8,12,.8,dk);
  return b.done();
}
// a stadium: a wall round the pond, tiers of seats full of people, floodlight towers at the corners
function g3Bowl(S){
  const [x0,y0,x1,y1]=site.bowlBox, b=new Bld(), con=C3('#b9bdc0'), con2=C3('#8e9396'), seatA=C3('#2b5d9c'), seatB=C3('#d8382c'), wall=C3('#f4f6f3'), pad=C3('#1f6fd1');
  const people=[], shirts=TENTS.concat(['#f4f6f3','#ffc62a','#38c6f4','#ff8a3c','#30363a','#9be23c']);
  const sides=[[[x0,y0],[x1,y0],[0,-1]],[[x1,y0],[x1,y1],[1,0]],[[x1,y1],[x0,y1],[0,1]],[[x0,y1],[x0,y0],[-1,0]]];
  for(const [A,B,n] of sides){
    const L=Math.hypot(B[0]-A[0],B[1]-A[1]), ux=(B[0]-A[0])/L, uy=(B[1]-A[1])/L;
    const P=(t,d,y)=>[A[0]+ux*t+n[0]*d,y,A[1]+uy*t+n[1]*d];
    // the padded wall at the water's edge
    b.quad(P(-60,0,-4),P(L+60,0,-4),P(L+60,0,14),P(-60,0,14),pad); b.quad(P(-60,0,14),P(L+60,0,14),P(L+60,12,14),P(-60,12,14),wall);
    for(let k=0;k<10;k++){
      const d0=12+k*24, d1=d0+24, yb=14+k*13, yt=yb+13, ex=40+k*24;
      b.quad(P(-ex,d0,yb),P(L+ex,d0,yb),P(L+ex,d0,yt),P(-ex,d0,yt),con2);
      b.quad(P(-ex,d0,yt),P(L+ex,d0,yt),P(L+ex,d1,yt),P(-ex,d1,yt),k%3===2?con:(k%2?seatA:seatB));
      for(let t=-ex+10;t<L+ex-10;t+=17){
        if(hash(Math.round(t),k,77+n[0]*3+n[1])<.28) continue;
        const q=P(t,d0+12,yt);
        people.push({x:q[0],y:q[1],z:q[2],a:0,sx:1,col:C3(shirts[Math.floor(hash(Math.round(t),k,79)*shirts.length)])});
      }
    }
    // a back wall behind the top tier
    b.quad(P(-280,252,0),P(L+280,252,0),P(L+280,252,170),P(-280,252,170),con2);
  }
  S.add(new T3.Mesh(b.done(),G.mat));
  {const p=new Bld(); p.box(0,4.2,0,3.4,8.4,2.6,C3('#ffffff')); p.box(0,10.2,0,2.6,2.6,2.6,C3('#c9a184')); g3Many(S,p.done(),G.matI,people);}
  // floodlights at the four corners, lamps lit
  const pole=new Bld(), lamp=new Bld(), st=C3('#9aa3a8'), on=C3('#fff6d8');
  for(const [cx,cz] of [[x0-200,y0-200],[x1+200,y0-200],[x1+200,y1+200],[x0-200,y1+200]]){
    pole.box(cx,170,cz,10,340,10,st);
    const dx=Math.sign((x0+x1)/2-cx), dz=Math.sign((y0+y1)/2-cz);
    pole.box(cx+dx*10,345,cz+dz*10,70,40,8,st);
    for(let r=0;r<3;r++) for(let c=0;c<4;c++) lamp.box(cx+dx*16-26+c*17,333+r*12,cz+dz*16,13,9,2,on);
  }
  S.add(new T3.Mesh(pole.done(),G.mat)); S.add(new T3.Mesh(lamp.done(),new T3.MeshBasicMaterial({color:0xfff6d8,side:T3.DoubleSide})));
  // ground outside the stands
  const gm=new T3.MeshLambertMaterial({color:0x5d6b52}); gm.userData.own=true;
  for(const [cx,cz,w,h] of [[(x0+x1)/2,y0-2700,20000,5000],[(x0+x1)/2,y1+2700,20000,5000],[x0-2700,(y0+y1)/2,5000,20000],[x1+2700,(y0+y1)/2,5000,20000]]){
    const m=new T3.Mesh(new T3.PlaneGeometry(w,h),gm); m.rotation.x=-Math.PI/2; m.position.set(cx,8,cz); S.add(m);
  }
}
function g3Scenery(S,P){
  const add=(b,mat)=>{const m=new T3.Mesh(b.done(),mat||G.mat); S.add(m); return m;}, wht=C3('#f4f6f3'), red=C3(COL.red), dk=C3('#1c2429');
  G.bob=[];
  for(const m of wd.marks||[]){
    if(m.t==='bridge'){
      // a timber truss bridge: the channel runs under its main span
      const b=new Bld(), a=m.w+34, e=a+150, tim=C3(m.steel?'#e3e7ea':'#7b5b3a'), tim2=C3(m.steel?'#8f989e':'#5e4429'), pl=C3(m.steel?'#6f757a':'#8d6c47');
      b.box(0,84,0,e*2,5,46,pl);
      for(const z of [-21,21]){
        b.box(0,79,z*.7,e*2,6,6,tim2); b.box(0,95,z,e*2,2,2,tim);
        for(let x=-e;x<=e;x+=60) b.box(x,90,z,2.4,10,2.4,tim);
        b.limb([-a,86,z],[0,150,z],7,7,tim); b.limb([a,86,z],[0,150,z],7,7,tim);
        for(const k of [-.5,.5]){b.limb([a*k,86,z],[a*k,118,z],5,5,tim2); b.limb([a*k,118,z],[0,86,z],4,4,tim2);}
        b.box(0,117,z,5,62,5,tim2);
      }
      b.box(0,150,0,7,7,48,tim);
      for(const x of [-a-110,-a,a,a+110]){
        for(const z of [-16,16]) b.box(x,38,z,7,90,7,tim2);
        b.limb([x,6,-16],[x,74,16],4,4,tim); b.limb([x,6,16],[x,74,-16],4,4,tim); b.box(x,80,0,9,5,44,tim);
      }
      g3Across(add(b),m.x,m.y,m.h);
    }else if(m.t==='arch'){
      // a sandstone arch standing over the lane, a leg on each side of it
      const b=new Bld(), a=m.w+52, Hh=165, rock=C3(P.rock), band=rock.clone().multiplyScalar(.8), cap=C3(P.top), n=16, R=[];
      for(let i=0;i<=n;i++){
        const t=-.1+(Math.PI+.2)*i/n, c=Math.cos(t), sn=Math.sin(t), j=1+(hash(i,3,97)-.5)*.18, T=(30+26*Math.abs(c))*j, D=(34+16*Math.abs(c))*j;
        const ox=a*c, oy=Hh*sn, nx=c, ny=sn;                       // outward from the arch's curve
        R.push([[ox+nx*T,oy+ny*T,-D],[ox+nx*T,oy+ny*T,D],[ox-nx*T*.7,oy-ny*T*.7,D*.9],[ox-nx*T*.7,oy-ny*T*.7,-D*.9]]);
      }
      for(let i=0;i<n;i++) for(let k=0;k<4;k++){const A=R[i], B=R[i+1], col=k===0?(i>4&&i<n-5?cap:rock):k===2?band:(i&1?rock:band); b.quad(A[k],A[(k+1)%4],B[(k+1)%4],B[k],col);}
      g3Across(add(b),m.x,m.y,m.h);
    }else if(m.t==='tower'){
      // the race tower on the beach
      const b=new Bld(), y=Math.max(0,g3Ground(m.x,m.y)), st=C3('#9aa3a8');
      for(const i of [-1,1]) for(const j of [-1,1]){b.box(i*16,y+33,j*16,2,66,2,st); b.limb([i*16,y+2,j*16],[i*16,y+40,-j*16],1.2,1.2,st);}
      b.box(0,y+40,0,38,3,38,C3('#c9ced0')); b.box(0,y+67,0,44,3,44,wht); b.box(18,y+60,0,1.2,10,36,red); b.box(-18,y+46,0,1,9,34,dk);
      b.box(0,y+82,0,1.4,28,1.4,st);
      const t=add(b); t.position.set(m.x,0,m.y);
      const f=new T3.Mesh(new T3.PlaneGeometry(22,14),G.matChk); f.position.set(m.x+11,y+89,m.y); S.add(f);
    }else if(m.t==='light'){
      const b=new Bld(), y=Math.max(0,g3Ground(m.x,m.y))-1;
      b.geo(new T3.CylinderGeometry(8,13,72,12),wht,0,y+36,0); b.geo(new T3.CylinderGeometry(10.6,11.8,13,12),red,0,y+40,0);
      b.geo(new T3.CylinderGeometry(13,13,3,12),dk,0,y+73,0); b.geo(new T3.CylinderGeometry(6.5,6.5,12,8),C3('#ffe9a0'),0,y+80,0); b.geo(new T3.ConeGeometry(9.5,10,8),red,0,y+91,0);
      const t=add(b); t.position.set(m.x,0,m.y);
    }else if(m.t==='pier'){
      // a pier out from the beach with a pavilion on its head
      const b=new Bld(), L=m.x2-m.x, pl=C3('#b79a72'), pile=C3('#6b5843');
      b.box(L/2,17,0,L,3,26,pl);
      for(let x=10;x<L;x+=48) for(const z of [-10,10]) b.box(x,6,z,4,24,4,pile);
      for(const z of [-13,13]) b.box(L/2,23,z,L,1.4,1.4,wht);
      b.box(L-22,27,0,34,17,30,wht); b.box(L-22,23,0,35,6,31,C3('#2b7fd9'));
      const c=[[L-42,36,-18],[L-2,36,-18],[L-2,36,18],[L-42,36,18]]; for(let k=0;k<4;k++) b.tri(c[k],c[(k+1)%4],[L-22,48,0],C3('#d8563a'));
      const t=add(b); t.position.set(m.x,0,m.y);
    }else if(m.t==='huts'){
      // huts on stilts over the lagoon, joined by a boardwalk
      const b=new Bld(), pile=C3('#6b5843'), deck=C3('#b79a72'), wall=C3('#e9dcc0'), roof=C3('#b08a4a');
      b.box(0,14,-180,10,2,420,deck);
      for(let i=0;i<5;i++){
        const z=-360+i*90, x=i%2?-46:46;
        for(const dx of [-16,16]) for(const dz of [-16,16]) b.box(x+dx,6,z+dz,3,24,3,pile);
        b.box(x,15,z,40,3,40,deck); b.box(x,24,z,30,16,30,wall); b.box(x*.5,14.5,z,Math.abs(x),2,8,deck);
        const c=[[x-22,31,z-22],[x+22,31,z-22],[x+22,31,z+22],[x-22,31,z+22]]; for(let k=0;k<4;k++) b.tri(c[k],c[(k+1)%4],[x,46,z],roof);
      }
      for(let z=-380;z<=40;z+=40) b.box(0,6,z,3,22,3,pile);
      const t=add(b); t.position.set(m.x,0,m.y);
    }else if(m.t==='startboat'){
      // the start boat, lying off the line
      const p=PATH[m.idx], x=p.x+p.ty*(p.w+70), z=p.y-p.tx*(p.w+70), t=new T3.Mesh(g3BoatGeo(wht,C3('#e4392c')),G.mat);
      t.rotation.y=-p.h; S.add(t); G.bob.push({m:t,x,z,k:1});
      const f=new T3.Mesh(new T3.PlaneGeometry(16,10),G.matChk); f.position.set(-2,36,0); t.add(f);
    }
  }
  if(site.bowl&&site.bowlBox) g3Bowl(S);
  // boats lying off the course to watch
  const tints=[[wht,C3('#1f4f8a')],[C3('#1d2b3a'),wht],[wht,C3('#1f9d8a')],[C3('#c9ced0'),C3('#e4392c')]], geos=[];
  (site.boats||[]).forEach((r,ri)=>{
    const sd=rev?-r[2]:r[2], f0=rev?1-r[1]:r[0], f1=rev?1-r[0]:r[1];
    for(let j=Math.round(f0*N), n=0;j<f1*N;j+=17,n++){
      const p=PATH[((j%N)+N)%N], off=p.w+130+hash(j,ri,61)*110, x=p.x-p.ty*sd*off, z=p.y+p.tx*sd*off;
      if(inLand(x,z,-60)) continue;
      const k=Math.floor(hash(j,ri,62)*tints.length); if(!geos[k]) geos[k]=g3BoatGeo(tints[k][0],tints[k][1]);
      const t=new T3.Mesh(geos[k],G.mat), sc=.8+hash(j,ri,63)*.5; t.scale.set(sc,sc,sc); t.rotation.y=hash(j,ri,64)*TAU; S.add(t); G.bob.push({m:t,x,z,k:sc});
    }
  });
  // people along the water's edge near the start
  if(site.shore){
    const b=new Bld(), w=C3('#ffffff'), list=[], f=PATH[0], shirts=TENTS.concat(['#f4f6f3','#ffc62a','#38c6f4','#ff8a3c']);
    b.box(0,4.6,0,3.4,9.2,2.6,w); b.box(0,11,0,2.7,2.7,2.7,C3('#c9a184'));
    for(let i=0;i<150;i++){
      const x=site.shore.x+168+hash(i,1,83)*60, z=f.y-900+hash(i,2,83)*1500, y=g3Ground(x,z);
      if(y>1) list.push({x,y:y-.2,z,a:hash(i,3,83)*TAU,sx:.9+hash(i,4,83)*.3,col:C3(shirts[i%shirts.length])});
    }
    g3Many(S,b.done(),G.matI,list);
  }
  // the start band, stretched across the lane just ahead of the front row
  {const p=PATH[(FRONT+3)%N], b=new Bld(), w=p.w+6;
   for(const sd of [-1,1]){b.geo(new T3.CylinderGeometry(3.2,3.2,14,8),red,sd*w,5,0); b.geo(new T3.CylinderGeometry(3.4,3.4,4,8),wht,sd*w,7,0);}
   g3Across(add(b),p.x,p.y,p.h);
   G.band=new T3.Mesh(new T3.BoxGeometry(w*2,1.3,1.3),new T3.MeshBasicMaterial({color:0xfdfdf8})); G.band.material.userData.own=true;
   g3Across(G.band,p.x,p.y,p.h); S.add(G.band); G.bandT=0;}
}

function g3Site(){
  const P=G.P=PAL3[site.id]||PAL3.havasu, u=G.u;
  if(G.site){g3Clear(G.site); G.scene.remove(G.site);}
  const S=G.site=new T3.Group(); G.scene.add(S);
  u.uDeep.value.set(P.deep); u.uShal.value.set(P.shal); u.uZen.value.set(P.zen); u.uHor.value.set(P.hor);
  u.uSun.value.set(P.sun[0],P.sun[1],P.sun[2]).normalize(); u.uFogD.value=P.fog; u.uCloud.value=P.cloud; u.uChop.value=.15+site.chop;
  u.uShore.value.set(site.shore?site.shore.x+250:0,site.shore?1:0);
  G.fog.color.set(P.hor); G.fog.density=P.fog; G.r.setClearColor(G.fog.color,1);
  G.sunL.position.copy(u.uSun.value); u.uSunCol.value.set(P.sunCol||'#fff2d8'); G.sunL.color.set(P.sunCol||'#fff2d8'); G.sunL.intensity=P.sunI||.6; G.hemi.intensity=P.hemiI||.66; G.hemi.groundColor.set(P.shal).lerp(C3('#ffffff'),.35);
  const wv=wd.env.waves; let amp=0;
  for(let i=0;i<4;i++){const w=wv[i]; if(w){u.uWk.value[i].set(w[0],w[1],w[2]); u.uWa.value[i].set(w[3],w[4]); amp+=w[3];}else{u.uWk.value[i].set(0,0,0); u.uWa.value[i].set(0,0);}}
  u.uAmp.value=Math.max(1,amp);
  for(let i=0;i<3;i++){const z=(wd.env.zones||[])[i]; if(z) u.uZ.value[i].set(z[0],z[1],1/(z[2]*z[2]),z[3]); else u.uZ.value[i].set(0,0,1,0);}

  // land
  const sand=C3(P.sand), wet=C3(P.wet), top=C3(P.top), rock=C3(P.rock), mA=[], mB=[], bu=[];
  LAND.forEach((b,i)=>{
    if(b.obj){b.h3=0; b.butte=false; return;}
    b.butte=!!(site.rocks&&b.top);
    if(site.isles||site.island){b.h3=site.id==='glacier'?(b.top?16+b.r*.2:8+b.r*.08):(b.top?9+b.r*.04:4+b.r*.01); (b.top?mB:mA).push({x:b.x,y:0,z:b.y,a:hash(i,1,71)*TAU,sx:b.r,sy:b.h3}); return;}
    b.h3=b.butte?70+b.r*.9+hash(i,2,71)*50:site.rocks?12+b.r*.28:site.banks?7+hash(i,3,71)*5:b.top?15+b.r*.05:6+b.r*.012;
    const q={x:b.x,y:0,z:b.y,a:hash(i,1,71)*TAU,sx:b.r,sy:b.h3};
    (b.butte?bu:b.top?mB:mA).push(q);
  });
  const granite=site.id==='glacier';
  g3Many(S,g3Mound(wet,granite?rock:sand,site.rocks||granite?rock:sand),G.mat,mA);
  g3Many(S,g3Mound(wet,granite?rock:site.rocks||site.banks?sand:sand.clone().lerp(top,.5),top),G.mat,mB);
  g3Many(S,g3Butte(rock,sand,top),G.mat,bu);
  if(site.shore){
    // behind the beach the ground runs back to the hills
    const g=new T3.PlaneGeometry(9000,16000), m=new T3.Mesh(g,new T3.MeshLambertMaterial({color:top.clone().lerp(sand,.35)}));
    m.material.userData.own=true; m.rotation.x=-Math.PI/2; m.position.set(site.shore.x-5100,14,(by0+by1)/2); S.add(m);
  }
  // things standing on it
  const kind=site.id==='pattaya'||site.id==='lagoon'||site.id==='cayman'?'palm':site.id==='glacier'?'pine':site.banks?'canopy':'scrub', tr=[], te=[], um=[], ca=[];
  PROPS.forEach((p,i)=>{
    const y=Math.max(0,g3Ground(p.x,p.y))-.3;
    if(p.t===2) tr.push({x:p.x,y,z:p.y,a:hash(i,1,73)*TAU,sx:p.s*(kind==='canopy'?1.05:kind==='palm'?1.25:kind==='pine'?1.45:1.1)});
    else if(p.t===0) te.push({x:p.x,y,z:p.y,a:-p.a,sx:1,col:C3(TENTS[p.ci%TENTS.length])});
    else if(p.t===1) um.push({x:p.x,y,z:p.y,a:0,sx:1,col:C3(TENTS[p.ci%TENTS.length])});
    else ca.push({x:p.x,y,z:p.y,a:Math.PI/2-p.a,sx:1,col:C3(CARS[p.ci%CARS.length])});
  });
  g3Many(S,g3Tree(kind,C3(P.tree)),G.mat,tr); g3Many(S,g3Tent(),G.matI,te); g3Many(S,g3Umb(),G.matI,um); g3Many(S,g3Car(),G.matI,ca);

  // the lane: a float line down each edge, coloured round the inside of every corner
  const fl=[], red=C3(COL.red), yel=C3(COL.yellow), wht=C3('#f6f8f4');
  for(let j=0;j<N;j+=3) for(const sd of [-1,1]){
    const p=PATH[j], lane=p.w; if(1-p.ks*sd*lane<.35) continue;
    const c=p.c===sd?(sd>0?yel:red):wht;
    fl.push({x:p.x-p.ty*sd*lane,z:p.y+p.tx*sd*lane,s:c===wht?5.5:7.5,col:c});
  }
  // the drag strip: a line of floats between the two lanes, from the start to past the finish
  if(site.drag) for(let j=FRONT+2;j<wd.finIdx+40;j+=2){const p=PATH[j]; fl.push({x:p.x,z:p.y,s:4.4,col:j===wd.finIdx?red:wht});}
  G.fl=fl; G.flM=new T3.InstancedMesh(new T3.IcosahedronGeometry(1,1),G.matF,fl.length); G.flM.frustumCulled=false;
  fl.forEach((f,i)=>G.flM.setColorAt(i,f.col)); S.add(G.flM);
  // turn buoys: tall cylinders, red for a left turn and yellow for a right
  G.tb=TURNS.map(g=>{
    const b=new Bld(), c=g.right?yel:red;
    b.geo(new T3.CylinderGeometry(11,11,12,12),c,0,5,0); b.geo(new T3.CylinderGeometry(11.3,11.3,6,12),wht,0,14,0);
    b.geo(new T3.CylinderGeometry(11,11,12,12),c,0,23,0); b.geo(new T3.ConeGeometry(11,8,12),c,0,33,0);
    const m=new T3.Mesh(b.done(),g.right?G.matY:G.matR); m.position.set(g.x,0,g.y); S.add(m); return m;
  });
  // the finish: a checkered tower on each edge of the lane and a banner strung between them
  {const f=PATH[wd.finIdx||0], w=f.w+16, b=new Bld(), k=C3('#10181c');
   for(const sd of [-1,1]) for(let q=0;q<8;q++) b.geo(new T3.CylinderGeometry(7,7,8,10),(q+(sd>0?1:0))&1?k:wht,f.x-f.ty*sd*w,4+q*8,f.y+f.tx*sd*w);
   S.add(new T3.Mesh(b.done(),G.mat));
   const g=new T3.PlaneGeometry(w*2,18), uv=g.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*w*2/18,uv.getY(i));
   const m=new T3.Mesh(g,G.matChk); m.position.set(f.x,55,f.y); m.rotation.y=-Math.atan2(f.tx,-f.ty); S.add(m);}
  g3Scenery(S,P);
  g3Backdrop(S,P,(bx0+bx1)/2,(by0+by1)/2,Math.hypot(bx1-bx0,by1-by0)/2+(site.banks?1500:4600));
  G.pa.fill(0); G.ps.fill(0); G.pl.fill(0);
}

// ----- skis and riders -----
// What sets one hull apart from the next: how tall and long the cowl is, how many tiers the seat has and how long it runs,
// how much side the hull shows above the water, how deep its V is, and whether it carries mirrors.
const HULL3=[{hood:5.1,tiers:1,seatL:11,fb:0,vee:2.6,mir:0},{hood:5.6,tiers:1,seatL:12,fb:.2,vee:2.9,mir:0},{hood:6,tiers:2,seatL:14,fb:.3,vee:2.9,mir:0},
  {hood:6.3,tiers:3,seatL:17.5,fb:.5,vee:2.7,mir:1},{hood:6.8,tiers:3,seatL:17.5,fb:.9,vee:3.4,mir:1}];
// where the bars sit on a hull: the rider's hands go there
function g3Bar(sh){const K3=HULL3[sh.mark]||HULL3[1]; return [3.1,5.1+K3.fb+K3.hood+1.25];}
// The ski in two parts: paint that shines, and the fittings that do not (with the rider's legs, which stay put).
function g3SkiGeo(s){
  const sh=s.sh, K3=HULL3[sh.mark]||HULL3[1], g=new Bld(), m=new Bld();
  const hull=C3(s.hull), trim=C3(s.trim), deck=hull.clone().multiplyScalar(.88), dark=C3('#12181c'), blk=C3('#07090a'), mat=C3('#3b464d'), seatC=C3('#181e22');
  const bot=lum(s.hull)>.6?C3('#20282d'):C3('#eef1f0'), B=sh.B, L=sh.L, S=sh.S, fb=K3.fb, x0=-2;
  const U=x=>x<=x0?0:(x-x0)/(L-x0), sheer=x=>1.3*Math.pow(U(x),1.6);
  const wid=x=>x<=x0?B*(x<-S*.3?.84+.16*(x+S)/(S*.7):1):B*Math.pow(1-Math.pow(U(x),1.55),1.05);
  const deckY=x=>{const u=U(x), f=clamp(u/.16,0,1), fs=f*f*(3-2*f), gw=3.2+fb+sheer(x)+2.6*(1-Math.pow(u,2.5)); return 3.9+(gw+.45*(1-Math.pow(u,2.5))-3.9)*fs;};
  // one slice of the hull, from the keel round to the keel: chine, rub rail, gunwale, down into the footwell, across the floor and back
  const ring=x=>{
    // toward the bow the gunwale comes down to meet the rub rail and the stem rakes back under it, so the nose ends in a point
    const u=U(x), w=wid(x), sr=sheer(x), nose=1-Math.pow(u,2.5), gw=3.2+fb+sr+(1.5+1.1*clamp((x+S)/5,0,1))*nose, f=clamp(u/.16,0,1), fs=f*f*(3-2*f), fl=deckY(x), u3=u*u*u;
    const h=[[x-1.6*u3,-.4+3.1*Math.pow(u,2.2),w*.88],[x-.5*u3,2.3+fb+sr,w],[x,3.2+fb+sr,w*1.01],[x,gw,w*.93],[x,gw+.15*nose,w*(.79-.2*fs)],[x,fl,w*(.7-.3*fs)]];
    return [[x-3.2*u3,-K3.vee+(K3.vee+2.6)*Math.pow(u,2.6),0]].concat(h,[[x,fl+.5*fs*nose,0]],h.map(q=>[q[0],q[1],-q[2]]).reverse());
  };
  const xs=[-S,-S+2.5,-S*.6,-S*.3,x0].concat([.12,.25,.4,.55,.68,.8,.9,.96,1].map(u=>x0+u*(L-x0))), R=xs.map(ring);
  const aft=[bot,bot,blk,hull,hull,dark,mat,mat,dark,hull,hull,blk,bot,bot], fore=[bot,bot,blk,hull,hull,deck,deck,deck,deck,hull,hull,blk,bot,bot];
  g.loft(R,(i,k)=>{const c=(i<5?aft:fore)[k]; return (k===3||k===10)&&i<3?trim:c;},[1,1,1,1,0,1,1,0,1,1,0,1,1,1],true);
  {const a=R[0];                                                                                       // transom
   g.tri(a[0],a[1],a[2],dark); g.tri(a[0],a[2],a[12],dark); g.tri(a[0],a[12],a[13],dark);
   for(const k of [2,3,4,5]){g.tri(a[7],a[k],a[k+1],deck); g.tri(a[7],a[14-k],a[13-k],deck);}
   g.tri(a[7],a[12],a[2],deck);}
  // cowl: an arch that swells up behind the bars and runs down to the nose, with a stripe along its crown
  const cx0=2.4, cx1=L*.94, CK=8, cw=t=>Math.min(B*(.6-.4*Math.pow(t,1.15)),wid(cx0+(cx1-cx0)*t)*.8+.2);
  const chh=t=>t<.1?K3.hood*(.86+1.4*t):K3.hood*Math.pow(1-(t-.1)/.9,1.15)+.35, cby=x=>Math.min(deckY(x)-.4,5.1+fb+sheer(x)), cowl=[];
  for(let i=0;i<=10;i++){
    const t=i/10, x=cx0+(cx1-cx0)*t, w=cw(t), h=chh(t), by=cby(x), r=[];
    for(let k=0;k<=CK;k++){const an=k/CK*Math.PI, c=Math.cos(an); r.push([x,by+h*Math.pow(Math.sin(an),.7),w*Math.sign(c)*Math.pow(Math.abs(c),.75)]);}
    cowl.push(r);
  }
  g.loft(cowl,(i,k)=>(k===3||k===4)&&i>0&&i<8?trim:i>=9?deck:hull,null,false);
  {const r=cowl[0], c=[cx0,cby(cx0)+K3.hood*.45,0]; for(let k=0;k<CK;k++) m.tri(c,r[k],r[k+1],dark);}
  const topY=cby(cx0)+K3.hood, bar=g3Bar(sh), bx=bar[0], barY=bar[1];
  m.wedge(cx0+.3,cx0+3.2,1.7,1.3,topY-.3,topY+1,topY-.5,topY-.2,dark);                                   // gauge hood
  // the bars are a part of their own, so they can turn
  const hb=new Bld(); hb.tube([0,0,-4.6],[0,0,4.6],.4,.4,dark,6); hb.box(0,.05,0,1.3,1.2,3.2,trim);
  m.tube([cx0+1.6,topY-.6,0],[bx,barY-.2,0],.75,.6,dark,6);
  for(const sd of [-1,1]){
    hb.tube([0,0,sd*3.3],[0,0,sd*4.9],.62,.62,blk,6);
    if(K3.mir){m.tube([cx0+3.5,cby(cx0+3.5)+K3.hood*.6,sd*cw(.25)*.8],[cx0+2.6,topY+.4,sd*(cw(.25)+1.5)],.3,.3,dark,5); m.box(cx0+2.5,topY+.9,sd*(cw(.25)+1.9),.5,1.5,2.3,dark);}
    m.wedge(-S+1.5,-S*.45,.42,.42,-.5,.9,-.4,1,dark,sd*B*.9);                                           // sponsons
  }
  // seat: a painted pedestal with the cushion on it, stepped up toward the back on the longer hulls
  const sx0=-K3.seatL+1, sx1=1.4, pw=B*.4, n=K3.tiers, seat=[];
  g.wedge(sx0+.4,sx1,pw*.9,pw,3.9,7.4,3.9,7.4,hull);
  const seatY=x=>{const f=clamp((sx1-x)/(sx1-sx0),0,.999)*n, j=Math.floor(f), fr=f-j, e=fr<.68?0:(fr-.68)/.32; return 8.5+j*.75+(n===1?1.8:.85)*e*e*(3-2*e);};
  for(let i=0;i<=14;i++){
    const x=sx1+(sx0-sx1)*i/14, top=(i===0||i===14?7.9:seatY(x)), w=pw*(i===0?.75:i===14?.8:1), r=[];
    for(let k=0;k<=6;k++){const an=k/6*Math.PI, c=Math.cos(an); r.push([x,7.3+(top-7.3)*Math.pow(Math.sin(an),.6),w*Math.sign(c)*Math.pow(Math.abs(c),.7)]);}
    seat.push(r);
  }
  m.loft(seat,(i,k)=>k===0||k===5?mat:seatC,null,false);
  {const r=seat[14], c=[sx0,7.5,0]; for(let k=0;k<6;k++) m.tri(c,r[k],r[k+1],seatC);}
  m.box(sx0-.5,8,0,.7,.7,pw*1.7,dark);                                                                  // grab handle
  m.tube([-S-2.2,.3,0],[-S+.4,.3,0],1.15,1.6,dark,8); m.box(-S+.3,-1.7,0,3,.35,4.6,dark);               // pump and ride plate
  // the rider's boots, planted in the footwells
  const fz=B*.5;
  for(const sd of [-1,1]){m.wedge(-1.3,1.9,.8,.7,3.95,5.9,3.95,4.9,blk,sd*fz); m.box(-.6,6,sd*fz,1.7,1.5,1.5,blk);}
  return {body:g.done(),trim:m.done(),bar:hb.done(),fz,plate:[cx0+(cx1-cx0)*.3,cby(cx0+(cx1-cx0)*.3)+chh(.3)*.48,cw(.3)*.97+.14]};
}
// The rider is a jointed figure. Hips ride the seat, boots stay in the footwells and gloves stay on the grips;
// knees and elbows are worked out from those each frame, so the body can stand, lean and steer.
const RIG={hip:[-4,9.9],sh:[4.4,5.1,2.95],neck:[4.95,6.05],hj:[0,-.35,1.45],ua:3.2,fa:3,th:5.3,sn:4.7};
function g3RiderGeo(s){
  const jersey=C3(s.hull), vest=C3(s.trim), lid=lum(s.trim)<.25?C3('#f2f5f3'):vest, blk=C3('#0b1013'), dk=C3('#1b2227'), pants=C3('#20282e'), skin=C3('#2a3238');
  // torso: ovals strung along the spine, fuller in the chest, under a vest with dark side panels
  const t=new Bld(), sp=[[0,0,2.45,1.7,1.7],[1.05,1.55,2.3,1.55,1.6],[2.2,3,2.75,2.1,1.8],[3.3,4.25,3.05,2.15,1.85],[4.25,5.15,3.2,1.6,1.7],[4.8,5.85,1.5,1.1,1.1]], T=[];
  for(let i=0;i<sp.length;i++){
    const a=sp[Math.max(0,i-1)], c=sp[Math.min(sp.length-1,i+1)], dl=Math.hypot(c[0]-a[0],c[1]-a[1])||1, px=(c[1]-a[1])/dl, py=-(c[0]-a[0])/dl, q=sp[i], r=[];
    for(let k=0;k<12;k++){const an=k/12*TAU, f=Math.sin(an), d=f>0?q[3]:q[4]; r.push([q[0]+px*d*f,q[1]+py*d*f,q[2]*Math.cos(an)]);}
    T.push(r);
  }
  t.loft(T,(i,k)=>i===0?pants:i>=4?jersey:(k===11||k===0||k===5||k===6)?dk:vest,null,true);
  t.ball([RIG.sh[0]-.2,RIG.sh[1]+.1,0],[1.5,1.1,3.3],jersey,10,6);                                   // shoulders
  // head: helmet shell, chin bar, goggles, a peak and a stripe over the crown
  const h=new Bld();
  h.tube([-.15,-.5,0],[.8,.9,0],.85,.8,skin,6);
  h.ball([1.3,2,0],[2.05,1.9,1.8],lid,14,9); h.ball([2.55,1.05,0],[1.25,.92,1.38],lid,10,6); h.ball([2.72,2.1,0],[.62,.72,1.42],blk,9,6);
  h.wedge(1.9,4.6,1.6,1.25,3.25,3.6,3,3.2,jersey); h.box(1.1,3.82,0,2.7,.22,.75,jersey); h.box(.2,2.15,0,.35,.6,3.7,blk);
  // limbs, each built along its own length from the joint it hangs from
  const bone=(len,r0,r1,col,end,ec)=>{const b=new Bld(); b.ball([0,0,0],[r0*1.08,r0*1.08,r0*1.08],col,8,5); b.tube([0,0,0],[0,len,0],r0,r1,col,8); if(end) b.ball([0,len,0],[end,end,end],ec,8,5); return b.done();};
  return {torso:t.done(),head:h.done(),ua:bone(RIG.ua,1.02,.86,jersey),fa:bone(RIG.fa,.84,.68,jersey,.88,blk),th:bone(RIG.th,1.38,1.08,pants),sn:bone(RIG.sn,1.12,.82,dk,.9,blk)};
}
// two bones from a to b, bending toward the pole
function g3IK(a,b,l1,l2,px,py,pz,up,lo){
  let dx=b[0]-a[0], dy=b[1]-a[1], dz=b[2]-a[2]; const d=Math.hypot(dx,dy,dz)||1e-6, m=Math.min(d,l1+l2-.02); dx/=d; dy/=d; dz/=d;
  const al=(l1*l1-l2*l2+m*m)/(2*m), h=Math.sqrt(Math.max(0,l1*l1-al*al)), k=px*dx+py*dy+pz*dz;
  px-=k*dx; py-=k*dy; pz-=k*dz; const pl2=Math.hypot(px,py,pz)||1;
  const ex=a[0]+dx*al+px/pl2*h, ey=a[1]+dy*al+py/pl2*h, ez=a[2]+dz*al+pz/pl2*h;
  up.position.set(a[0],a[1],a[2]); up.quaternion.setFromUnitVectors(G.Y,G.v.set(ex-a[0],ey-a[1],ez-a[2]).normalize());
  lo.position.set(ex,ey,ez); lo.quaternion.setFromUnitVectors(G.Y,G.v.set(b[0]-ex,b[1]-ey,b[2]-ez).normalize());
}
function g3Pose(s,sq,near){
  if(s.model) return;                          // a model's rider is part of the model
  const R=s.rig, st=s.gy, lean=s.lean;
  // hips come up off the seat in the air and in rough water, and slide to the inside of a turn; the body leans with them
  // a winner stands up tall to celebrate
  const ch=s.cheer>0?Math.min(1,s.cheer*2,(4-s.cheer)*3):0;
  R.torso.position.set(R.hx+.9*st+.6*ch,R.hy+1.6*st+.3*s.rough*sq+1.8*ch,lean*1.6);
  R.torso.rotation.set(lean*.36*(1-ch),0,.1*st-.07*sq+.4*ch);
  R.head.rotation.set(-lean*.22,-s.steer*.3-lean*.25,.06-.05*st);
  R.bar.rotation.y=s.skinMesh?0:-s.steer*.42;     // a painted model's bars are part of the hull and do not turn
  // under a rigged rider the built body is hidden, but its joints are still worked out, near or far, to pose the rig
  for(const q of R.limbs) q.visible=near&&!R.k3;
  if(!near&&!R.k3) return;
  R.torso.updateMatrix(); R.bar.updateMatrix();
  const v=G.v, P=(m,x,y,z)=>{v.set(x,y,z).applyMatrix4(m); return [v.x,v.y,v.z];};
  for(let i=0;i<2;i++){
    const sd=i?1:-1, S=P(R.torso.matrix,RIG.sh[0],RIG.sh[1],sd*RIG.sh[2]), H=P(R.bar.matrix,0,.3,sd*R.gz), J=P(R.torso.matrix,RIG.hj[0],RIG.hj[1],sd*RIG.hj[2]);
    if(i&&ch>0){
      // the right fist punches the air
      const u=4.6+Math.sin(clock*11)*.9;
      g3IK(S,[S[0]+(H[0]-S[0])*(1-ch)+.8*ch,S[1]+(H[1]-S[1])*(1-ch)+u*ch,S[2]+(H[2]-S[2])*(1-ch)+.7*ch],RIG.ua,RIG.fa,-.3,0,1,R.ua[i],R.fa[i]);
    }else g3IK(S,H,RIG.ua,RIG.fa,-.25,.4,sd*.9,R.ua[i],R.fa[i]);
    g3IK(J,[R.fx,R.fy,sd*R.fz],RIG.th,RIG.sn,.8,.55,sd*.3,R.th[i],R.sn[i]);
  }
  if(R.k3){g3RigPose(s); if(R.bkM) R.bk.matrix.multiplyMatrices(R.torso.matrix,R.bkM);}
}
function g3Plate(n){
  const c=mk(96,60), x=c.getContext('2d');
  x.fillStyle='#fdfdf8'; x.beginPath(); x.moveTo(10,2); x.arcTo(94,2,94,58,10); x.arcTo(94,58,2,58,10); x.arcTo(2,58,2,2,10); x.arcTo(2,2,94,2,10); x.closePath(); x.fill();
  // three-digit numbers are squeezed to fit the plate rather than shrunk
  x.fillStyle='#0b1013'; x.font="italic 800 50px 'Barlow Condensed','Arial Narrow',Arial,sans-serif"; x.textAlign='center'; x.textBaseline='middle';
  const tw=x.measureText(String(n)).width, k=Math.min(1,80/Math.max(1,tw));
  x.save(); x.translate(48,33); x.scale(k,1); x.fillText(String(n),0,0); x.restore();
  const t=new T3.CanvasTexture(c); t.generateMipmaps=false; t.minFilter=T3.LinearFilter; return t;
}
function g3Skis(){
  G.skiG.traverse(o=>{if(o.material&&o.material.map&&o.material.userData.own&&!o.material.userData.cached){o.material.map.dispose();}});
  g3Clear(G.skiG);
  while(G.shG.children.length) G.shG.remove(G.shG.children[0]);
  if(!G.plGeo){G.plGeo=new T3.PlaneGeometry(1,1); G.backM=new T3.Matrix4().makeBasis(new T3.Vector3(0,0,1),new T3.Vector3(.647,.762,0),new T3.Vector3(-.762,.647,0));}
  for(const s of skis){
    s.g3s=new T3.Mesh(G.shGeo,G.shMat); s.g3s.renderOrder=-3; s.g3s.scale.set(s.sh.L+s.sh.S+8,s.sh.B*2+6,1); G.shG.add(s.g3s);
    const g=new T3.Group(), geo=g3SkiGeo(s), rg=g3RiderGeo(s), bar=g3Bar(s.sh), M=x=>new T3.Mesh(x,G.mat);
    const pm=new T3.MeshBasicMaterial({map:g3Plate(s.num)}); pm.userData.own=true;
    // hx, hy: where the hips sit; fx, fy, fz: where the feet go; gz: how far out the grips are. A painted ski model moves them to fit its own shape.
    const R=s.rig={torso:M(rg.torso),head:M(rg.head),bar:M(geo.bar),ua:[M(rg.ua),M(rg.ua)],fa:[M(rg.fa),M(rg.fa)],th:[M(rg.th),M(rg.th)],sn:[M(rg.sn),M(rg.sn)],
      fz:geo.fz,hx:RIG.hip[0],hy:RIG.hip[1],fx:-.6,fy:6.3,gz:4.15};
    R.limbs=R.ua.concat(R.fa,R.th,R.sn);
    R.head.position.set(RIG.neck[0],RIG.neck[1],0); R.torso.add(R.head); R.bar.position.set(bar[0],bar[1],0);
    const body=new T3.Mesh(geo.body,G.matSki), fit=new T3.Mesh(geo.trim,G.mat);
    g.add(body,fit,R.bar,R.torso); for(const q of R.limbs) g.add(q);
    s.hull3=[body,fit,R.bar];                    // the built ski, hidden when a painted ski model takes its place
    for(const sd of [-1,1]){const pl8=new T3.Mesh(G.plGeo,pm); pl8.scale.set(4.6,2.9,1); pl8.position.set(geo.plate[0],geo.plate[1],sd*geo.plate[2]); pl8.rotation.set(sd*-.2,sd<0?Math.PI:0,0); g.add(pl8); s.hull3.push(pl8);}
    {const bk=new T3.Mesh(G.plGeo,pm); bk.scale.set(3.5,2.5,1); bk.setRotationFromMatrix(G.backM); bk.position.set(1.95-2.2*.762,2.65+2.2*.647,0); R.torso.add(bk); R.bk=bk;}
    s.parts=g.children.slice(); s.hullBox=new T3.Box3().setFromBufferAttribute(geo.body.attributes.position);
    G.skiG.add(g); s.g3=g; s.gp=0; s.gr=0; s.gy=0; s.gl=s.lands; s.ge=0; s.skin=null; s.skinMesh=null; s.model=false;
  }
  G.ch=pl.h; G.sw=0; G.cy=0;
  g3UseModels(); g3UseBases(); g3UseRiders();
}

function g3Emit(x,y,z,vx,vy,vz,s0,s1,life,a){
  const i=G.pi=(G.pi+1)%G.PMAX, p=G.pp, v=G.pv;
  p[i*3]=x; p[i*3+1]=y; p[i*3+2]=z; v[i*3]=vx; v[i*3+1]=vy; v[i*3+2]=vz;
  G.pz[i*2]=s0; G.pz[i*2+1]=s1; G.pl[i]=1; G.pm[i]=life; G.pk[i]=a;
}
function g3Spray(dt){
  const rnd=Math.random;
  for(const s of skis){
    if(G.cer) break;
    const dx=s.x-G.cx, dz=s.y-G.cz; if(dx*dx+dz*dz>1300*1300) continue;
    const c=Math.cos(s.h), sn=Math.sin(s.h), q=Math.min(1,s.v/VMAX), y=s.g3.position.y, B=s.sh.B, S=s.sh.S;
    if(s.lands!==s.gl){
      // coming down: a sheet of water thrown out from both sides
      s.gl=s.lands; const k=clamp(s.land/40,.4,1.4);
      for(let i=0;i<44;i++){const sd=i&1?1:-1, o=40+rnd()*80, f=(rnd()-.3)*16;
        g3Emit(s.x+c*f-sn*sd*B,y+1,s.y+sn*f+c*sd*B,s.vx*.7-sn*sd*o*k,(22+rnd()*56)*k,s.vy*.7+c*sd*o*k,2.6,9,.4+rnd()*.4,.55);}
    }
    if(s.air>0||s.v<45) continue;
    s.ge+=dt;
    if(s.me){
      // your own wash: low, out to the sides, so it never hides the water ahead
      for(;s.ge>.014;s.ge-=.014){const sd=rnd()<.5?1:-1, o=26+rnd()*30, f=(rnd()-.5)*10;
        g3Emit(s.x-c*(4+f)-sn*sd*B,y+.5,s.y-sn*(4+f)+c*sd*B,s.vx*.8-sn*sd*o,8+rnd()*18*q,s.vy*.8+c*sd*o,2.2,6.5,.28+rnd()*.2,.3*q);}
    }else{
      // a rival's rooster tail
      for(;s.ge>.016;s.ge-=.016){const o=(rnd()-.5)*26;
        g3Emit(s.x-c*S,y+2,s.y-sn*S,s.vx*.5-sn*o,(44+rnd()*56)*q,s.vy*.5+c*o,5.5,21,.7+rnd()*.5,.6*q);}
    }
    const hard=Math.abs(s.lean)>.5||Math.abs(s.slip)>34;
    if(hard) for(let i=0;i<4;i++){
      // the sheet of water a hard turn throws to the outside
      const sd=s.lean>0?-1:1, o=45+rnd()*60, f=(rnd()-.6)*20;
      g3Emit(s.x+c*f-sn*sd*B,y+1,s.y+sn*f+c*sd*B,s.vx*.6-sn*sd*o,22+rnd()*40,s.vy*.6+c*sd*o,2.4,8,.35+rnd()*.3,.5);
    }
  }
  const p=G.pp, v=G.pv, n=G.PMAX;
  for(let i=0;i<n;i++){
    if(G.pl[i]<=0) continue;
    const l=G.pl[i]-=dt/G.pm[i];
    if(l<=0){G.pa[i]=0; G.ps[i]=0; continue;}
    v[i*3+1]-=150*dt; p[i*3]+=v[i*3]*dt; p[i*3+1]+=v[i*3+1]*dt; p[i*3+2]+=v[i*3+2]*dt;
    if(p[i*3+1]<0){p[i*3+1]=0; v[i*3+1]=0; v[i*3]*=.9; v[i*3+2]*=.9;}
    G.ps[i]=G.pz[i*2]+(G.pz[i*2+1]-G.pz[i*2])*(1-l); G.pa[i]=G.pk[i]*Math.min(1,l*1.6);
  }
  const g=G.spray.geometry; g.attributes.position.needsUpdate=true; g.attributes.aS.needsUpdate=true; g.attributes.aA.needsUpdate=true;
}
function g3Wakes(){
  const L=TRAIL_LIFE, t=wd.t, P=G.wp, A=G.wa; let n=0;
  for(const s of skis){
    const dx=s.x-G.cx, dz=s.y-G.cz; if(dx*dx+dz*dz>1800*1800) continue;
    wakeGeom(s,t);
    const X=s.wx, Y=s.wy, T=s.wa, NX=s.wnx, NY=s.wny;
    for(let i=0;i<s.wm-1&&n<G.WMAX-12;i++){
      const u0=clamp(T[i]/L,0,1), u1=clamp(T[i+1]/L,0,1), w0=4+30*Math.pow(u0,.6), w1=4+30*Math.pow(u1,.6), a0=Math.pow(1-u0,1.4), a1=Math.pow(1-u1,1.4);
      const q=[[X[i]+NX[i]*w0,Y[i]+NY[i]*w0,a0,1],[X[i]-NX[i]*w0,Y[i]-NY[i]*w0,a0,-1],[X[i+1]+NX[i+1]*w1,Y[i+1]+NY[i+1]*w1,a1,1],[X[i+1]-NX[i+1]*w1,Y[i+1]-NY[i+1]*w1,a1,-1],[X[i],Y[i],a0,0],[X[i+1],Y[i+1],a1,0]];
      for(const k of [0,4,2,2,4,5,4,1,5,5,1,3]){P[n*3]=q[k][0]; P[n*3+1]=0; P[n*3+2]=q[k][1]; A[n*2]=q[k][2]; A[n*2+1]=q[k][3]; n++;}
    }
  }
  const g=G.wake.geometry; g.setDrawRange(0,n); g.attributes.position.needsUpdate=true; g.attributes.aA.needsUpdate=true;
}

function g3Guide(){
  const P=G.gp, C=G.gc, g=G.guide.geometry; let n=0;
  G.guide.visible=mode==='race'&&opt.aids==='on'&&pl.out<=0&&gmode!=='drag';
  if(!G.guide.visible) return;
  for(let k=0;k<G.GN;k++){
    const j=(pl.idx+5+k*3)%N, p=PATH[j], a=.5*Math.min(1,k/2)*Math.min(1,(G.GN-k)/5), col=p.c>0?[1,.78,.16]:p.c<0?[.95,.25,.2]:[1,1,1], w=Math.min(30,p.w*.2);
    const T=[p.x+p.tx*16,p.y+p.ty*16], T2=[p.x+p.tx*4,p.y+p.ty*4];
    for(const sd of [-1,1]){
      const L=[p.x-p.ty*sd*w-p.tx*12,p.y+p.tx*sd*w-p.ty*12], L1=[L[0]+p.tx*12,L[1]+p.ty*12];
      for(const q of [T,L1,L,T,L,T2]){P[n*3]=q[0]; P[n*3+1]=0; P[n*3+2]=q[1]; C[n*4]=col[0]; C[n*4+1]=col[1]; C[n*4+2]=col[2]; C[n*4+3]=a; n++;}
    }
  }
  g.setDrawRange(0,n); g.attributes.position.needsUpdate=true; g.attributes.aC.needsUpdate=true;
}
// where a point in the world lands on the screen, or null if it is behind the camera
function g3Proj(x,y,z){
  const v=G.v.set(x,y,z).applyMatrix4(G.cam.matrixWorldInverse); if(v.z>-8) return null;
  v.applyMatrix4(G.cam.projectionMatrix); return [(v.x*.5+.5)*W,(-v.y*.5+.5)*H];
}
function g3Tag(s){
  const d=Math.hypot(s.x-pl.x,s.y-pl.y); if(d>1000||d<40) return;
  const p=g3Proj(s.x,s.g3.position.y+27,s.y); if(!p||p[0]<24||p[0]>W-24||p[1]<hudBottom+16||p[1]>H*.8) return;
  const tx=s.name.toUpperCase(), big=s===tagA;
  ctx.font="600 "+(big?13:11)+"px 'Barlow Condensed','Arial Narrow',sans-serif"; ctx.textAlign='center'; ctx.textBaseline='middle';
  const w=ctx.measureText(tx).width+12, y=p[1]-10;
  ctx.globalAlpha=clamp(1.5-d/700,.35,1);
  ctx.fillStyle='rgba(6,32,42,.72)'; ctx.fillRect(p[0]-w/2,y-9,w,18);
  ctx.fillStyle=s.hull; ctx.fillRect(p[0]-w/2,y+7,w,2);
  ctx.fillStyle=COL.foam; ctx.fillText(tx,p[0],y+.5);
  ctx.globalAlpha=1;
}
// the next turn, called early: chevrons in the buoy's colour, pointing the way round
function g3Cue(){
  if(!TURNS.length) return;
  const g=TURNS[pl.tn%TURNS.length], d=((g.idx-pl.idx+N)%N)*DS, far=Math.max(520,pl.v*3.4);
  if(d>far||d<40) return;
  const sg=g.right?1:-1, x=W/2, y=hudBottom+64, k=1-d/far, n=g.k>1/170?3:g.k>1/260?2:1;
  ctx.lineCap='round'; ctx.lineJoin='round';
  for(let pass=0;pass<2;pass++){
    ctx.lineWidth=pass?5:9; ctx.strokeStyle=pass?(g.right?COL.yellow:COL.red):'rgba(6,32,42,.55)'; ctx.globalAlpha=clamp(.35+k*1.2,0,1);
    ctx.beginPath();
    for(let i=0;i<n;i++){const cx=x+sg*(i-(n-1)/2)*20; ctx.moveTo(cx-sg*7,y-13); ctx.lineTo(cx+sg*7,y); ctx.lineTo(cx-sg*7,y+13);}
    ctx.stroke();
  }
  ctx.globalAlpha=1;
}

function render3(){
  const u=G.u, cam=G.cam, dt=clamp(clock-G.lastT,0,.1), idle=mode==='idle', racing=mode==='race'||mode==='count', q=Math.min(1,pl.v/VMAX);
  G.lastT=clock; u.uT.value=clock;
  // camera: low behind the ski, turning with it a beat late, steady while the ski rides the water under it
  G.sw+=((mode==='done'?2.5:0)-G.sw)*Math.min(1,dt*.8);
  let px,py,pz,tx,ty,tz;
  if(G.cer){
    // the ceremony: a slow drift from side to side in front of the podium
    const c=G.cer, a=c.a0+Math.sin(clock*.28)*.3, d=W<H?86:112; px=c.x+Math.cos(a)*d; pz=c.z+Math.sin(a)*d; py=W<H?17:22; tx=c.x; tz=c.z; ty=W<H?9:17; G.ch=pl.h;
  }else if(idle){
    const a=clock*.2+1; px=pl.x+Math.cos(a)*170; pz=pl.y+Math.sin(a)*170; py=64; tx=pl.x; ty=9; tz=pl.y; G.ch=pl.h;
  }else{
    const into=mode==='race'&&pl.out<=0?clamp(angDiff(PATH[(pl.idx+12)%N].h,pl.h),-.6,.6)*.5:0;
    // while a winner spins a donut the camera holds its heading, or the picture would spin with the ski
    G.ch+=angDiff(pl.h+into,G.ch)*(cele&&cele.donut&&cele.t<4?0:Math.min(1,dt*(mode==='count'?8:4.5)));
    const k=mode==='count'?1+.35*(1-Math.min(1,countT/3)):1, a=G.ch+G.sw, back=(80+10*q)*k, ah=150*Math.max(0,1-G.sw/1.3);
    // on the drag strip the camera sits behind the middle of the two lanes, so both skis are in the picture
    const dr=gmode==='drag', sh=dr?-pl.off*.85:0, cx=pl.x-Math.sin(pl.h)*sh, cz=pl.y+Math.cos(pl.h)*sh, bk=dr?back*1.25:back;
    px=cx-Math.cos(a)*bk; pz=cz-Math.sin(a)*bk; py=(dr?48:41)*k;
    tx=cx+Math.cos(G.ch)*ah; tz=cz+Math.sin(G.ch)*ah; ty=13;
  }
  G.cx=px; G.cz=pz;
  {const l=Math.hypot(tx-px,tz-pz)||1; G.fx=(tx-px)/l; G.fz=(tz-pz)/l;}
  G.cy+=(g3H(pl.x,pl.y)*.45-G.cy)*Math.min(1,dt*2.5);
  const jy=shake?Math.sin(clock*53)*shake*.5:0;
  cam.position.set(px,py+G.cy+jy,pz); cam.up.set(0,1,0); cam.lookAt(tx,ty+G.cy*.5,tz);
  if(!calm&&!idle&&!G.cer) cam.rotateZ(-pl.lean*.045+(shake?Math.sin(clock*47)*shake*.004:0));
  const fov=G.cer?(W<H?66:48):(W<H?80:54)+(idle?0:6*q);
  if(Math.abs(fov-cam.fov)>.05){cam.fov=fov; cam.updateProjectionMatrix();}
  cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
  G.sky.position.copy(cam.position); G.water.position.set(px,0,pz);
  u.uPx.value=G.r.domElement.height/(2*Math.tan(cam.fov*Math.PI/360));

  // skis ride the surface they are drawn on
  for(const s of skis){
    const c=Math.cos(s.h), sn=Math.sin(s.h), sq=Math.min(1,s.v/VMAX);
    const hf=g3H(s.x+c*13,s.y+sn*13), hb=g3H(s.x-c*13,s.y-sn*13), hr=g3H(s.x-sn*8,s.y+c*8), hl=g3H(s.x+sn*8,s.y-c*8);
    const hop=s.air>0?Math.max(0,s.z-s.hw):0, up=2.2*hop/(1+hop/30);
    let pt=Math.atan2(hf-hb,26)*.9+.03+.05*sq*s.thr;
    if(s.air>0) pt+=.07+clamp(s.vz*.005,-.1,.16);
    const rl=s.lean*.36-Math.atan2(hr-hl,16)*.8;
    s.gp+=(pt-s.gp)*Math.min(1,dt*10); s.gr+=(rl-s.gr)*Math.min(1,dt*10);
    s.g3.position.set(s.x,(hf+hb+hr+hl)/4+up-.5+s.rough*sq*Math.sin(clock*29+s.seed)*.5,s.y);
    if(!s.me){
      // a rival that comes between the camera and your ski would fill the screen: it is left out, and a marker at the foot of the screen stands in for it
      const dx=s.x-px, dz=s.y-pz, fw=dx*G.fx+dz*G.fz;
      s.g3.visible=s.g3s.visible=idle||fw>62||fw<-30; s.gs=s.g3.visible?null:(-dx*G.fz+dz*G.fx);
    }
    s.g3.rotation.set(s.gr,-s.h-(s.spinV||0),s.gp,'YZX');
    s.g3s.position.set(s.x+c*2,(hf+hb+hr+hl)/4+.2,s.y+sn*2); s.g3s.rotation.set(-Math.PI/2,0,-s.h);
    // the rider leans into the turn, sits up off the seat in the air and tucks down at speed
    s.gy+=((s.air>0||s.soft>0?1:Math.min(.6,s.rough*sq*1.2))-s.gy)*Math.min(1,dt*(s.air>0?12:5));
    g3Pose(s,sq,idle||(s.x-px)*(s.x-px)+(s.y-pz)*(s.y-pz)<520*520);
  }
  // floats and buoys bob on it
  {const m=G.tmp, fl=G.fl, e=m.elements;
   for(let i=0;i<fl.length;i++){const f=fl[i]; m.makeScale(f.s,f.s,f.s); e[12]=f.x; e[13]=g3H(f.x,f.z)+f.s*.25; e[14]=f.z; G.flM.setMatrixAt(i,m);}
   G.flM.instanceMatrix.needsUpdate=true;}
  for(const o of G.bob){o.m.position.set(o.x,g3H(o.x,o.z)*.6-1,o.z); o.m.rotation.x=Math.sin(clock*.9+o.x)*.03;}
  if(G.band){
    if(wd.go) G.bandT+=dt; else G.bandT=0;
    G.band.visible=G.bandT<.5; G.band.position.y=5-G.bandT*G.bandT*220; G.band.rotation.z=G.bandT*1.5;
  }
  TURNS.forEach((g,i)=>{const m=G.tb[i]; m.position.y=g3H(g.x,g.y)-1.5; m.rotation.z=g.wob*.45*Math.sin(clock*13); m.rotation.x=g.wob*.3*Math.cos(clock*11);});
  if(G.cer) g3CerFrame(dt);
  if(dt>0){g3Spray(dt); g3Wakes(); g3FwFrame(dt);}
  g3ArcFrame(dt);
  g3Guide();
  G.r.render(G.scene,cam);

  // what is drawn flat over the top
  ctx.setTransform(DPR,0,0,DPR,0,0); ctx.clearRect(0,0,W,H);
  if(mode==='race'&&pl.out>0){ctx.fillStyle='rgba(228,57,44,'+(.1+.06*Math.sin(clock*9)).toFixed(3)+')'; ctx.fillRect(0,0,W,H);}
  if(mode==='race'&&pl.wakeR>.05&&pl.v>80){
    // sitting in someone's wake: their spray in your face
    const a=Math.min(.15,pl.wakeR*.35)*(.7+.3*Math.sin(clock*17)), g=ctx.createLinearGradient(0,H*.3,0,H*.75);
    g.addColorStop(0,'rgba(240,250,252,0)'); g.addColorStop(.5,'rgba(240,250,252,'+a.toFixed(3)+')'); g.addColorStop(1,'rgba(240,250,252,0)');
    ctx.fillStyle=g; ctx.fillRect(0,H*.3,W,H*.45);
  }
  if(racing){
    // name the four nearest rivals in view, not the whole field
    const near=ais.filter(s=>s.g3.visible).sort((a,b)=>Math.hypot(a.x-pl.x,a.y-pl.y)-Math.hypot(b.x-pl.x,b.y-pl.y)).slice(0,4);
    for(const s of near) g3Tag(s);
    for(const s of ais){
      if(s.g3.visible) continue;
      if(s.gs==null||mode!=='race') continue;
      const x=clamp(W/2+s.gs*3.2,26,W-26), y=H-14, sd=s.gs<0?-1:1;
      ctx.fillStyle='rgba(6,32,42,.7)'; ctx.beginPath(); ctx.moveTo(x-15,y+6); ctx.lineTo(x+15,y+6); ctx.lineTo(x+sd*3,y-13); ctx.closePath(); ctx.fill();
      ctx.fillStyle=s.hull; ctx.beginPath(); ctx.moveTo(x-10,y+3); ctx.lineTo(x+10,y+3); ctx.lineTo(x+sd*2,y-8); ctx.closePath(); ctx.fill();
    }
    if(mode==='race') g3Cue();
  }
  if(G.cer) g3CerLabels(); else hudOverlay(idle,racing);
}

// ----- arcade objects: crates, mines, ramps, item boxes, coins, torpedoes, checkpoints -----
function g3ArcGeo(){
  if(G.ag) return G.ag;
  const A=G.ag={}, wood=C3('#b07a3c'), dark=C3('#6b4520'), band=C3('#d9a25a');
  {const b=new Bld(); b.box(0,0,0,14,14,14,wood); for(const y of [-6.2,6.2]) b.box(0,y,0,14.6,1.6,14.6,dark); for(const z of [-6.2,6.2]) b.box(0,0,z,14.6,14.6,1.6,band); A.crate=b.done();}
  {const b=new Bld(), m=C3('#2a3136'), sp=C3('#4a545b');
   b.ball([0,0,0],[7,7,7],m,12,8);
   for(const d of [[1,0,0],[-1,0,0],[0,1,0],[0,0,1],[0,0,-1],[.7,.7,0],[-.7,.7,0],[0,.7,.7],[0,.7,-.7]]) b.tube([d[0]*6,d[1]*6,d[2]*6],[d[0]*10.5,d[1]*10.5,d[2]*10.5],1.2,.3,sp,5);
   b.ball([0,7.2,0],[1.6,1.6,1.6],C3('#ff3b30'),6,4); A.mine=b.done();}
  {const b=new Bld(), y=C3('#ffc62a'), k=C3('#16222a'), L=48, Wd=36, Hh=13;
   // a floating ramp: a wedge rising toward the far end, striped on its lip
   b.quad([-L/2,0,-Wd],[-L/2,0,Wd],[L/2,Hh,Wd],[L/2,Hh,-Wd],C3('#d8dde0'));
   b.quad([L/2,0,-Wd],[L/2,0,Wd],[L/2,Hh,Wd],[L/2,Hh,-Wd],k);
   for(const sd of [-1,1]) b.tri([-L/2,0,sd*Wd],[L/2,0,sd*Wd],[L/2,Hh,sd*Wd],k);
   for(let i=0;i<6;i++) b.box(L/2-1.5,Hh+.4,-Wd+Wd/3*(i+.5),3,1,Wd/3-1,i%2?k:y);
   for(let i=0;i<4;i++) b.box(-L/2+L*(i+.5)/4,Hh*(i+.5)/4+.6,0,2,1,Wd*2-2,i%2?k:y);
   A.ramp=b.done();}
  A.boxM=new T3.MeshLambertMaterial({color:0xb48cff,emissive:0x5a2ac0,transparent:true,opacity:.88});
  {const b=new Bld(), w=C3('#ffffff'); b.box(0,0,0,13,13,13,w); A.box=b.done();
   const c=new Bld(), k=C3('#ffffff'); c.box(0,0,0,4,4,13.6,k); c.box(0,0,0,13.6,4,4,k); c.box(0,0,0,4,13.6,4,k); A.boxCore=c.done();}
  A.coinM=new T3.MeshLambertMaterial({color:0xffc62a,emissive:0x8a5a00});
  A.coin=new T3.CylinderGeometry(5,5,1.4,14); A.coin.rotateX(Math.PI/2);
  {const b=new Bld(), g=C3('#c9ced0'), r=C3('#e4392c'); b.tube([-12,0,0],[8,0,0],2.6,2.6,g,8); b.tube([8,0,0],[14,0,0],2.6,.4,r,8); for(const a of [0,1,2,3]){const c=Math.cos(a*Math.PI/2), s=Math.sin(a*Math.PI/2); b.box(-11,c*3.2,s*3.2,4,s?.5:2.4,c?.5:2.4,r);} A.torp=b.done();}
  {const b=new Bld(), w=C3('#f4f6f3'), bl=C3('#1f6fd1'); b.box(0,18,0,2.4,36,2.4,w); b.box(0,32,5,.6,8,10,bl); A.cp=b.done();}
  A.shield=new T3.SphereGeometry(19,16,10); A.shieldM=new T3.MeshLambertMaterial({color:0x2de0b0,emissive:0x0f6a55,transparent:true,opacity:.18,depthWrite:false});
  A.flame=new T3.ConeGeometry(3.2,16,8); A.flame.rotateZ(Math.PI/2); A.flameM=new T3.MeshBasicMaterial({color:0xffa53c,transparent:true,opacity:.85});
  return A;
}
function g3Obj(o){
  const A=g3ArcGeo(); let m;
  if(o.t==='box'){m=new T3.Group(); m.add(new T3.Mesh(A.box,A.boxM),new T3.Mesh(A.boxCore,G.mat));}
  else if(o.t==='coin') m=new T3.Mesh(A.coin,A.coinM);
  else m=new T3.Mesh(A[o.t],G.mat);
  if(o.t==='ramp'||o.t==='cp'){const p=PATH[o.j]; m.rotation.y=-p.h;}
  o.m=m; G.objG.add(m); return m;
}
function g3Drop(o){if(o.m){G.objG.remove(o.m); o.m=null;}}
function g3Arcade(){
  if(!G.objG){G.objG=new T3.Group(); G.scene.add(G.objG);}
  while(G.objG.children.length) G.objG.remove(G.objG.children[0]);
  for(const o of objs) g3Obj(o);
  // a shield bubble and a turbo flame for every ski, shown when in use
  const A=g3ArcGeo();
  for(const s of skis){
    if(!s.g3) continue;
    if(s.g3sh) s.g3.remove(s.g3sh); if(s.g3fl) s.g3.remove(s.g3fl);
    s.g3sh=new T3.Mesh(A.shield,A.shieldM); s.g3sh.position.set(0,8,0); s.g3sh.visible=false; s.g3.add(s.g3sh);
    s.g3fl=new T3.Mesh(A.flame,A.flameM); s.g3fl.position.set(-s.sh.S-10,1,0); s.g3fl.visible=false; s.g3.add(s.g3fl);
  }
}
function g3Spark(o){for(let i=0;i<10;i++) g3Emit(o.x,(o.m?o.m.position.y:4)+4,o.y,(Math.random()-.5)*90,40+Math.random()*60,(Math.random()-.5)*90,3,7,.4+Math.random()*.3,.7);}
function g3Boom(o){for(let i=0;i<28;i++){const a=Math.random()*TAU, sp=30+Math.random()*70; g3Emit(o.x,3,o.y,Math.cos(a)*sp,50+Math.random()*90,Math.sin(a)*sp,5,18,.6+Math.random()*.5,.8);} shake=Math.max(shake,2);}
function g3ArcFrame(dt){
  if(!G.objG) return;
  const on=isArc();
  G.objG.visible=on;
  if(!on) return;
  for(const o of objs){
    const m=o.m; if(!m) continue;
    const dx=o.x-G.cx, dz=o.y-G.cz, near=dx*dx+dz*dz<2600*2600;
    if(o.brk!=null){
      // a smashed crate flies up, spins and shrinks away
      o.brk+=dt; const k=o.brk/.45;
      if(k>=1){m.visible=false; continue;}
      m.visible=true; m.position.y+=60*dt; m.rotation.x+=9*dt; m.rotation.z+=7*dt; m.scale.setScalar(1-k);
      continue;
    }
    m.visible=near&&(o.alive||o.t==='ramp'||o.t==='cp');
    if(!m.visible) continue;
    const w=g3H(o.x,o.y);
    if(o.t==='crate'){const hh=o.air?2.2*o.h/(1+o.h/30):0; m.position.set(o.x,w+7+hh,o.y); m.rotation.y=o.rot+(o.air?clock*1.5:0);}
    else if(o.t==='mine'){m.position.set(o.x,w+1+Math.sin(clock*2+o.rot)*.8,o.y);}
    else if(o.t==='ramp'||o.t==='cp'){m.position.set(o.x,w*.8-(o.t==='ramp'?.5:0),o.y);}
    else if(o.t==='box'){m.position.set(o.x,w+9+Math.sin(clock*3+o.rot)*1.5,o.y); m.rotation.set(.4,clock*1.6+o.rot,.3);}
    else if(o.t==='coin'){m.position.set(o.x,w+8,o.y); m.rotation.y=clock*3+o.rot;}
    else if(o.t==='torp'){m.position.set(o.x,w+2,o.y); m.rotation.set(0,-o.h,0); if(Math.random()<.5) g3Emit(o.x-Math.cos(o.h)*14,w+1,o.y-Math.sin(o.h)*14,0,20,0,3,8,.4,.5);}
  }
  for(const s of skis){
    if(!s.g3sh) continue;
    s.g3sh.visible=s.shield>0; s.g3fl.visible=s.boost>0;
    if(s.boost>0) s.g3fl.scale.set(1+.3*Math.sin(clock*40),1,1);
  }
}

// ----- fireworks, confetti and the podium -----
function g3FwInit(){
  if(G.fw) return;
  FWC=['#ff4d3d','#ffd23a','#3ad0ff','#5dff9a','#ff5fc0','#ffffff','#b48cff','#ff9a3a'].map(h=>new T3.Color(h));
  const n=G.FMAX=1800, g=new T3.BufferGeometry();
  G.fp=new Float32Array(n*3); G.fc=new Float32Array(n*4); G.fs=new Float32Array(n); G.fq=new Float32Array(n);
  G.fv=new Float32Array(n*3); G.fL=new Float32Array(n); G.fM=new Float32Array(n); G.fK=new Uint8Array(n); G.fS=new Float32Array(n); G.fR=new Float32Array(n*3); G.fi=0;
  g.setAttribute('position',new T3.BufferAttribute(G.fp,3).setUsage(T3.DynamicDrawUsage));
  g.setAttribute('aC',new T3.BufferAttribute(G.fc,4).setUsage(T3.DynamicDrawUsage));
  g.setAttribute('aS',new T3.BufferAttribute(G.fs,1).setUsage(T3.DynamicDrawUsage));
  g.setAttribute('aQ',new T3.BufferAttribute(G.fq,1).setUsage(T3.DynamicDrawUsage));
  G.fw=new T3.Points(g,new T3.ShaderMaterial({uniforms:G.u,transparent:true,depthWrite:false,
    vertexShader:`attribute vec4 aC; attribute float aS,aQ; uniform float uPx; varying vec4 vC; varying float vQ;
void main(){vec4 mv=viewMatrix*vec4(position,1.); vC=aC; vQ=aQ; gl_PointSize=aS*uPx/max(1.,-mv.z); gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`varying vec4 vC; varying float vQ;
void main(){vec2 d=gl_PointCoord-.5; float r=length(d), a; vec3 c=vC.rgb;
 if(vQ>.5){a=step(abs(d.x),.5)*step(abs(d.y),.26);}
 else{a=smoothstep(.5,.08,r); c=mix(vec3(1.),c,smoothstep(.04,.3,r));}
 if(a<.02) discard; gl_FragColor=vec4(c,vC.a*a);}`}));
  G.fw.frustumCulled=false; G.fw.renderOrder=4; G.scene.add(G.fw);
}
let FWC=null;
// kind 0 a spark, 1 a piece of confetti, 2 a rocket that bursts when it runs out
function g3Fx(x,y,z,vx,vy,vz,size,life,col,kind){
  const i=G.fi=(G.fi+1)%G.FMAX;
  G.fp[i*3]=x; G.fp[i*3+1]=y; G.fp[i*3+2]=z; G.fv[i*3]=vx; G.fv[i*3+1]=vy; G.fv[i*3+2]=vz;
  G.fR[i*3]=col.r; G.fR[i*3+1]=col.g; G.fR[i*3+2]=col.b; G.fS[i]=size; G.fL[i]=1; G.fM[i]=life; G.fK[i]=kind; G.fq[i]=kind===1?1:0;
}
function g3Burst(x,y,z){
  const a=FWC[Math.floor(Math.random()*FWC.length)], b=FWC[Math.floor(Math.random()*FWC.length)], n=80, sp=62+Math.random()*30;
  for(let k=0;k<n;k++){
    const u=Math.random()*2-1, t=Math.random()*TAU, r=Math.sqrt(1-u*u), s=sp*(.85+Math.random()*.25);
    g3Fx(x,y,z,r*Math.cos(t)*s,u*s+8,r*Math.sin(t)*s,6+Math.random()*2.5,1.1+Math.random()*.6,k&1?a:b,0);
  }
  setTimeout(()=>blip(70+Math.random()*50,.3,'sawtooth',.05),180);
}
// a rocket up from the water: ahead of the camera, or from (x, z) when given
function g3Firework(x,z,h){
  if(!G.fw) g3FwInit();
  if(x==null){
    const d=300+Math.random()*140, l=(Math.random()-.5)*340;
    x=G.cx+G.fx*d-G.fz*l; z=G.cz+G.fz*d+G.fx*l;
  }
  g3Fx(x,0,z,(Math.random()-.5)*12,h||(165+Math.random()*35),(Math.random()-.5)*12,4,.95+Math.random()*.3,FWC[1],2);
}
function g3FwFrame(dt){
  if(!G.fw) return;
  const p=G.fp, v=G.fv, n=G.FMAX, C=G.fc, R=G.fR;
  for(let i=0;i<n;i++){
    if(G.fL[i]<=0) continue;
    const l=G.fL[i]-=dt/G.fM[i], k=G.fK[i];
    if(l<=0){
      G.fs[i]=0; C[i*4+3]=0;
      if(k===2) g3Burst(p[i*3],p[i*3+1],p[i*3+2]);
      continue;
    }
    if(k===0){v[i*3+1]-=35*dt; const f=Math.exp(-1.5*dt); v[i*3]*=f; v[i*3+1]*=f; v[i*3+2]*=f;}
    else if(k===1){v[i*3+1]-=40*dt; const f=Math.exp(-3.2*dt); v[i*3]=v[i*3]*f+Math.sin(clock*3+i)*12*dt; v[i*3+1]*=f; v[i*3+2]=v[i*3+2]*f+Math.cos(clock*2.6+i*1.7)*12*dt;}
    else{v[i*3+1]-=120*dt; if(Math.random()<.6) g3Fx(p[i*3],p[i*3+1],p[i*3+2],(Math.random()-.5)*8,-10,(Math.random()-.5)*8,2.6,.35,FWC[7],0);}
    p[i*3]+=v[i*3]*dt; p[i*3+1]+=v[i*3+1]*dt; p[i*3+2]+=v[i*3+2]*dt;
    if(k===1&&p[i*3+1]<G.fy){p[i*3+1]=G.fy; v[i*3]=v[i*3+1]=v[i*3+2]=0;}
    const fl=k===1?.55+.45*Math.abs(Math.sin(clock*7+i*1.3)):1;
    C[i*4]=R[i*3]*fl; C[i*4+1]=R[i*3+1]*fl; C[i*4+2]=R[i*3+2]*fl; C[i*4+3]=k===1?Math.min(1,l*4):Math.min(1,l*1.8);
    G.fs[i]=k===0?G.fS[i]*(.5+.5*l):G.fS[i];
  }
  const g=G.fw.geometry; g.attributes.position.needsUpdate=true; g.attributes.aC.needsUpdate=true; g.attributes.aS.needsUpdate=true; g.attributes.aQ.needsUpdate=true;
}

// The podium: a pontoon moored beside the finish line, three blocks on it, the top three standing on them with their trophies.
function g3Tex(w,h,f){const c=mk(w,h), x=c.getContext('2d'); f(x,w,h); const t=new T3.CanvasTexture(c); t.minFilter=T3.LinearFilter; t.generateMipmaps=false; return t;}
function g3Trophy(col,k){
  const b=new Bld(), c=C3(col), d=C3('#3a2a1e'), hi=C3('#fff6d8');
  b.box(0,.5*k,0,2*k,1*k,2*k,d); b.box(0,1.1*k,0,1.4*k,.25*k,1.4*k,c);
  b.tube([0,1.2*k,0],[0,2.3*k,0],.28*k,.22*k,c,8); b.ball([0,2.35*k,0],[.45*k,.25*k,.45*k],c,8,4);
  b.tube([0,2.45*k,0],[0,3*k,0],.35*k,1*k,c,10); b.tube([0,3*k,0],[0,4.1*k,0],1*k,1.2*k,c,10); b.ball([0,4.1*k,0],[1.2*k,.18*k,1.2*k],hi,10,3);
  for(const sd of [-1,1]) b.tube([0,3.9*k,sd*1.05*k],[0,3.05*k,sd*1.45*k],.16*k,.16*k,c,5);
  return new T3.Mesh(b.done(),G.matSki);
}
function g3Bottle(){
  const b=new Bld(), g=C3('#1f4a2c'), f=C3('#e2c25a');
  b.tube([0,0,0],[0,2.6,0],.5,.5,g,8); b.tube([0,2.6,0],[0,3.3,0],.5,.2,g,8); b.tube([0,3.3,0],[0,4.1,0],.2,.22,f,6);
  return new T3.Mesh(b.done(),G.matSki);
}
function g3Figure(ri){
  const r=RACERS[ri]||RACERS[0], rg=g3RiderGeo({hull:r.hull,trim:r.trim}), M=x=>new T3.Mesh(x,G.mat), F=new T3.Group();
  const R={torso:M(rg.torso),head:M(rg.head),ua:[M(rg.ua),M(rg.ua)],fa:[M(rg.fa),M(rg.fa)],th:[M(rg.th),M(rg.th)],sn:[M(rg.sn),M(rg.sn)]};
  R.head.position.set(RIG.neck[0],RIG.neck[1],0); R.torso.add(R.head); F.add(R.torso);
  for(const q of R.ua.concat(R.fa,R.th,R.sn)) F.add(q);
  F.userData.R=R; return F;
}
function g3CerStart(rows){
  g3FwInit(); g3CerEnd();
  // Moored on the course just short of the finish line, facing back down the run-in, so the camera looks at it from open lane
  // water with the finish behind it. The first spot with no land, buoy or boat between camera and pontoon is used.
  let X=null,Z=0,FX=1,FZ=0;
  const clear=(x,z)=>{
    if(inLand(x,z,-14)) return false;
    if(site.bowlBox){const b=site.bowlBox; if(x<b[0]+50||x>b[2]-50||z<b[1]+50||z>b[3]-50) return false;}
    for(const g of TURNS) if((g.x-x)*(g.x-x)+(g.y-z)*(g.y-z)<30*30) return false;
    for(const m of site.marks||[]) if(m.x!=null&&(m.x-x)*(m.x-x)+(m.y-z)*(m.y-z)<200*200) return false;
    return true;
  };
  for(const k of [16,24,32,12,40,8,48]){
    const q=PATH[(N-k)%N], fx=-Math.cos(q.h), fz=-Math.sin(q.h), sx=-fz, sz=fx; let ok=true;
    for(let d=-24;d<=112&&ok;d+=8) for(const l of d<=24?[-38,0,38]:[-28,0,28]) if(!clear(q.x+fx*d+sx*l,q.y+fz*d+sz*l)){ok=false; break;}
    if(ok){X=q.x; Z=q.y; FX=fx; FZ=fz; break;}
  }
  if(X===null){const q=PATH[(N-16)%N]; X=q.x; Z=q.y; FX=-Math.cos(q.h); FZ=-Math.sin(q.h);}
  const g=new T3.Group(), b=new Bld(), wh=C3('#eef2f0'), gy=C3('#9aa4a8'), dk=C3('#1c2a33'), bl=C3('#1f5fd6'), D=4.5;
  // the pontoon: a deck on black floats, a navy skirt, a backdrop behind the blocks
  b.box(0,D-.6,0,40,1.2,74,gy); b.box(0,D-2.2,0,40.4,2,74.4,dk);
  for(const z of [-30,-10,10,30]) b.tube([-19,0,z],[19,0,z],2.6,2.6,C3('#111'),8);
  b.box(-17,D+13,0,1.2,26,70,dk); b.box(-16.3,D+.8,0,.4,1.6,70,bl);
  const H=[9,6,4], Zs=[0,13.5,-13.5];
  for(let i=0;i<3;i++){b.box(0,D+H[i]/2,Zs[i],11,H[i],13,wh); b.box(0,D+H[i]-.35,Zs[i],11.1,.7,13.1,C3(MEDAL[i]));}
  for(const z of [-35,35]){b.tube([16,D,z],[16,D+24,z],.3,.3,gy,5);}
  g.add(new T3.Mesh(b.done(),G.mat));
  // the numbers on the blocks, the event on the backdrop, the flags on the poles
  for(let i=0;i<3;i++){
    const m=new T3.Mesh(new T3.PlaneGeometry(6,Math.min(5,H[i]-1.2)),new T3.MeshBasicMaterial({map:g3Tex(96,80,(x,w,h)=>{x.fillStyle='#eef2f0'; x.fillRect(0,0,w,h); x.fillStyle='#0b1013'; x.font="italic 800 72px 'Barlow Condensed','Arial Narrow',Arial,sans-serif"; x.textAlign='center'; x.textBaseline='middle'; x.fillText(String(i+1),w/2,h/2+4);})}));
    m.position.set(5.56,D+(H[i]-.7)/2,Zs[i]); m.rotation.y=Math.PI/2; m.userData.own=true; g.add(m);
  }
  {const m=new T3.Mesh(new T3.PlaneGeometry(68,24),new T3.MeshBasicMaterial({map:g3Tex(1024,360,(x,w,h)=>{
      x.fillStyle='#0d2a3a'; x.fillRect(0,0,w,h);
      for(let i=0;i<64;i++){x.fillStyle=i&1?'#f4f6f3':'#10181c'; x.fillRect(i*16,0,16,16); x.fillStyle=i&1?'#10181c':'#f4f6f3'; x.fillRect(i*16,16,16,16);}
      x.fillStyle='#f1fbf8'; x.textAlign='center'; x.textBaseline='middle';
      x.font="italic 800 150px 'Barlow Condensed','Arial Narrow',Arial,sans-serif"; x.fillText('HOLESHOT',w/2,h*.47);
      x.fillStyle='#ffc62a'; x.font="700 54px 'Barlow Condensed','Arial Narrow',Arial,sans-serif"; x.fillText((cer&&cer.title||'Podium').toUpperCase()+' · '+site.name.toUpperCase(),w/2,h*.8);})}));
   m.position.set(-16.3,D+13,0); m.rotation.y=Math.PI/2; m.userData.own=true; g.add(m);}
  for(const z of [-35,35]){const m=new T3.Mesh(new T3.PlaneGeometry(7,4.5),G.matChk); m.position.set(16,D+21.5,z+(z<0?3.5:-3.5)); m.rotation.y=Math.PI/2; m.userData.flag=z; g.add(m);}
  // the riders and their trophies; second and third carry a bottle each
  const figs=[];
  rows.forEach((r,i)=>{
    if(i>2) return;
    const F=g3Figure(r.ri); F.position.set(0,D+H[i],Zs[i]); g.add(F);
    const tr=g3Trophy(MEDAL[i],i?.85:1.15); g.add(tr);
    const bt=i?g3Bottle():null; if(bt) g.add(bt);
    figs.push({F,tr,bt,i,ph:i*1.9});
  });
  g.position.set(X,0,Z); g.rotation.y=-Math.atan2(FZ,FX);
  G.scene.add(g);
  G.cer={g,x:X,z:Z,a0:Math.atan2(FZ,FX),figs,D,H,Zs,fwT:.3,cfT:0};
  G.fy=0;
  G.skiG.visible=G.shG.visible=G.wake.visible=G.guide.visible=false; if(G.objG) G.objG.visible=false;
  // a first round of fireworks behind the pontoon
  for(let k=0;k<3;k++) setTimeout(()=>{if(G.cer) g3CerRocket();},k*260);
}
function g3CerRocket(){
  const c=G.cer, l=(Math.random()-.5)*160, d=70+Math.random()*90, ca=Math.cos(c.a0), sa=Math.sin(c.a0);
  g3Firework(c.x-ca*d-sa*l,c.z-sa*d+ca*l,150+Math.random()*50);
}
function g3CerEnd(){
  const c=G.cer; if(!c) return;
  c.g.traverse(o=>{if(o.material&&o.material.map&&o.userData.own){o.material.map.dispose(); o.material.dispose();} if(o.geometry&&o.geometry!==G.plGeo) o.geometry.dispose();});
  G.scene.remove(c.g); G.cer=null;
  if(G.fw){G.fL.fill(0); G.fs.fill(0); G.fc.fill(0); const g=G.fw.geometry; g.attributes.aS.needsUpdate=g.attributes.aC.needsUpdate=true;}
  G.skiG.visible=G.shG.visible=G.wake.visible=G.guide.visible=true; if(G.objG) G.objG.visible=true;
}
function g3CerFrame(dt){
  const c=G.cer, g=c.g, w=c.w||(c.w=new T3.Vector3()), v=G.v, P=(m,x,y,z)=>{v.set(x,y,z).applyMatrix4(m); return [v.x,v.y,v.z];};
  g.position.y=g3H(c.x,c.z)*.7; g.rotation.z=Math.sin(clock*.9)*.006; g.updateMatrixWorld();
  G.fy=g.position.y+c.D;
  for(const o of g.children) if(o.userData.flag) o.rotation.x=Math.sin(clock*5+o.userData.flag)*.12;
  for(const f of c.figs){
    const R=f.F.userData.R, i=f.i, t=clock*1+f.ph, hop=i===0?Math.max(0,Math.sin(clock*5.2))*.7:0;
    f.F.position.y=c.D+c.H[i]+hop;
    R.torso.position.set(0,10.1,0); R.torso.rotation.set(0,0,.66+(i===0?.06:0));
    R.head.rotation.set(0,i===1?-.35:i===2?.35:0,.12);
    R.torso.updateMatrix();
    for(let k=0;k<2;k++){
      const sd=k?1:-1, J=P(R.torso.matrix,RIG.hj[0],RIG.hj[1],sd*RIG.hj[2]);
      g3IK(J,[J[0]+.5,.9-hop,sd*2.1],RIG.th,RIG.sn,1,0,sd*.25,R.th[k],R.sn[k]);
    }
    const S=k=>P(R.torso.matrix,RIG.sh[0],RIG.sh[1],(k?1:-1)*RIG.sh[2]);
    if(i===0){
      // the winner lifts the cup over the head, again and again
      const up=4.9+Math.sin(clock*5.2)*.9;
      for(let k=0;k<2;k++){const sd=k?1:-1, s=S(k); g3IK(s,[s[0]+.9,s[1]+up,sd*1.55],RIG.ua,RIG.fa,-.2,0,sd,R.ua[k],R.fa[k]);}
      const s=S(1); f.tr.position.set(s[0]+.9,s[1]+up+.4+f.F.position.y,0); f.tr.rotation.set(Math.sin(clock*5.2)*.08,0,0);
    }else{
      // the arm away from the winner holds the trophy up; the one nearer sprays the champagne across
      const tw=i===1?-1:1, far=tw>0?0:1, near=1-far, sf=S(far), sn=S(near), sdF=far?1:-1;
      const ty=4+Math.sin(t*2.2)*.6;
      g3IK(sf,[sf[0]+1,sf[1]+ty,sdF*3.6],RIG.ua,RIG.fa,-.3,0,sdF,R.ua[far],R.fa[far]);
      f.tr.position.set(sf[0]+1,sf[1]+ty+.3+f.F.position.y,c.Zs[i]+sdF*3.6);
      const hx=sn[0]+3, hy=sn[1]+1.8+Math.sin(t*3)*.4, hz=tw*1.6;
      g3IK(sn,[hx,hy,hz],RIG.ua,RIG.fa,.2,-.6,-tw,R.ua[near],R.fa[near]);
      const dx=1.2, dy=1.5, dz=tw*1.4, dl=Math.hypot(dx,dy,dz);
      f.bt.position.set(hx,hy+f.F.position.y,c.Zs[i]+hz);
      f.bt.quaternion.setFromUnitVectors(G.Y,G.v.set(dx/dl,dy/dl,dz/dl));
      if(dt>0&&Math.sin(t*2.4)>-.2){
        for(let k=0;k<5;k++){
          const L=4.1, bx=hx+dx/dl*L, by=hy+f.F.position.y+dy/dl*L, bz=c.Zs[i]+hz+dz/dl*L, s=46+Math.random()*26;
          w.set(bx,by,bz).applyMatrix4(g.matrixWorld);
          const vx=(.25+Math.random()*.35)*s, vy=(.45+Math.random()*.4)*s, vz=tw*(.55+Math.random()*.35)*s, a=-c.a0;
          g3Emit(w.x,w.y,w.z,vx*Math.cos(a)+vz*Math.sin(a),vy,-vx*Math.sin(a)+vz*Math.cos(a),.9,3.2,.55+Math.random()*.3,.7);
        }
      }
    }
  }
  // confetti drifting down over the blocks, and more fireworks behind
  c.cfT-=dt;
  while(c.cfT<0){
    c.cfT+=.016;
    w.set(-4+Math.random()*22,c.D+34+Math.random()*10,(Math.random()-.5)*48).applyMatrix4(g.matrixWorld);
    g3Fx(w.x,w.y,w.z,(Math.random()-.5)*10,-4,(Math.random()-.5)*10,.85+Math.random()*.45,4+Math.random()*1.5,FWC[Math.floor(Math.random()*FWC.length)],1);
  }
  c.fwT-=dt; if(c.fwT<0){c.fwT=.7+Math.random()*.6; g3CerRocket();}
}
// the names over the riders' heads
function g3CerLabels(){
  const c=G.cer; if(!c||!cer) return;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  for(const f of c.figs){
    const r=cer.rows[f.i]; if(!r) continue;
    G.v.set(0,c.D+c.H[f.i]+(f.i?23:30),c.Zs[f.i]).applyMatrix4(c.g.matrixWorld);
    const q=g3Proj(G.v.x,G.v.y,G.v.z); if(!q) continue;
    const s=(RACERS[r.ri]||{name:r.name}).name.toUpperCase();
    ctx.font="700 15px 'Barlow Condensed','Arial Narrow',sans-serif"; const tw=ctx.measureText(s).width+14;
    ctx.fillStyle='rgba(6,32,42,.72)'; ctx.fillRect(q[0]-tw/2,q[1]-11,tw,22);
    ctx.fillStyle=MEDAL[f.i]; ctx.fillRect(q[0]-tw/2,q[1]+9,tw,3);
    ctx.fillStyle='#f1fbf8'; ctx.fillText(s,q[0],q[1]+1);
  }
}


// ----- racers' own 3D models -----
// Real skis, rider included, loaded from model files published beside the page. Until one arrives, or if it cannot load, the
// racer keeps the built ski. The rider in a model is part of the same piece, so it leans with the hull but does not move on its own.
// Each model is a folder holding model.json (glTF in its JSON form) and its JPEG textures.
// Empty for now: every racer rides a painted ski model with a built rider who moves (see below). The folders are still
// in models/, and adding {0:'models/vanjae-116/',2:'models/green-black/'} back brings those two fused models back.
const MODELS={};
// Images go through plain <img> decoding rather than ImageBitmap, which this loader version gets wrong on some iPhones.
function g3Load(dir){
  const L=THREE.GLTFLoader;
  return fetch(dir+'model.json').then(r=>{if(!r.ok) throw 0; return r.arrayBuffer();}).then(buf=>{
    const cib=window.createImageBitmap; let p;
    try{window.createImageBitmap=undefined; p=new Promise((ok,no)=>new L().parse(buf,dir,ok,no));}finally{window.createImageBitmap=cib;}
    return p;
  });
}
function g3Models(){
  if(G.mdl) return; G.mdl={};
  const L=window.THREE&&THREE.GLTFLoader; if(!L) return;
  g3Bases();
  // a soft sky above and dark water below for the paint and chrome to reflect
  let env=null;
  try{
    const c=mk(256,128), x=c.getContext('2d'), g=x.createLinearGradient(0,0,0,128);
    g.addColorStop(0,'#3d7fc4'); g.addColorStop(.42,'#cfe2e8'); g.addColorStop(.5,'#f4f6ee'); g.addColorStop(.56,'#3aa3b0'); g.addColorStop(1,'#0d3848');
    x.fillStyle=g; x.fillRect(0,0,256,128);
    const t=new T3.CanvasTexture(c); t.mapping=T3.EquirectangularReflectionMapping;
    const pm=new T3.PMREMGenerator(G.r); env=pm.fromEquirectangular(t).texture; pm.dispose(); t.dispose();
  }catch(e){env=null;}
  G.env=env;
  for(const k in MODELS){
    g3Load(MODELS[k]).then(gl=>{
      const o=gl.scene;
      o.traverse(m=>{
        if(!m.isMesh) return;
        const M=m.material;
        // the game draws its colours as they are stored, so the model's textures are read the same way
        for(const t of [M.map,M.emissiveMap]) if(t) t.encoding=T3.LinearEncoding;
        if(env){M.envMap=env; M.envMapIntensity=.6;}
        M.needsUpdate=true;
      });
      const box=new T3.Box3().setFromObject(o), sz=box.getSize(new T3.Vector3()), ctr=box.getCenter(new T3.Vector3());
      // the model's bow points along +z with the keel at its lowest point; the game's skis point along +x
      const w=new T3.Group(), inner=new T3.Group(); inner.add(o); o.position.set(-ctr.x,-box.min.y,-ctr.z);
      inner.rotation.y=Math.PI/2; w.add(inner); w.userData.len=Math.max(sz.z,sz.x);
      G.mdl[k]=w; g3UseModels();
    }).catch(()=>{});
  }
}
function g3UseModels(){
  if(!G.mdl) return;
  for(const s of skis){
    const w=G.mdl[s.ri]; if(!w||!s.parts) continue;
    // sized to the built hull it replaces, so wakes, spray and shadow still line up
    const b=s.hullBox, len=b.max.x-b.min.x, k=len/w.userData.len;
    w.scale.setScalar(k); w.position.set((b.max.x+b.min.x)/2,b.min.y+.4,0);
    for(const q of s.parts) q.visible=false;
    s.g3.add(w); s.model=true;
  }
}

// ----- painted ski models -----
// Three ski models, each painted afresh for every racer who rides it: the racer's colours, two raked slashes, number
// plates and name. A model's paint is stored as scattered patches, so nothing can be drawn on its flat picture. Instead
// every pixel of the picture is traced back to the spot on the hull it covers, and the new colour is chosen from where that
// spot is. The built rider rides on top and moves as before. Which model a racer gets goes by their craft.
const BASES=['models/ski-blue/','models/ski-116/','models/ski-105/'];
const BASE_OF=[0,1,1,2,2];                     // by craft mark: GP1800, Sea-Doo 325, Sea-Doo 350, FX SVHO, Ultra
const SKIN_N=1024;
function g3Bases(){
  G.bases=[]; G.skinTex={}; G.skinQ=[];
  BASES.forEach((dir,i)=>g3Load(dir).then(gl=>{
    let mesh=null; gl.scene.updateMatrixWorld(true); gl.scene.traverse(o=>{if(o.isMesh&&!mesh) mesh=o;});
    if(mesh&&mesh.material.map) g3Work({bi:i,mesh},false);
  }).catch(()=>{}));
  g3Load(RIDER).then(gl=>{G.rider=g3RiderSrc(gl.scene); g3UseRiders();}).catch(()=>{});
}
// The slow work (reading a model, painting a ski) goes through one queue, a piece at a time, so it is spread over
// several frames rather than stalling one. The player's own ski goes to the front.
function g3Work(job,first){
  G.skinQ[first?'unshift':'push'](job);
  if(!G.skinBusy){G.skinBusy=true; setTimeout(g3SkinNext,0);}
}
// An attribute as plain floats. Shrunk models store positions, normals and UVs as small integers, which are scaled back here.
function g3Arr(a){
  const n=a.count, k=a.itemSize, o=new Float32Array(n*k), arr=a.isInterleavedBufferAttribute?a.data.array:a.array;
  const sc=!a.normalized?1:arr instanceof Int8Array?1/127:arr instanceof Uint8Array?1/255:arr instanceof Int16Array?1/32767:arr instanceof Uint16Array?1/65535:1;
  const get=[a.getX,a.getY,a.getZ,a.getW];
  for(let i=0;i<n;i++) for(let j=0;j<k;j++){const v=get[j].call(a,i)*sc; o[i*k+j]=a.normalized?Math.max(-1,v):v;}
  return o;
}
function g3Base(j){
  const mesh=j.mesh, g=mesh.geometry, A=g.attributes, pos=g3Arr(A.position), uv=g3Arr(A.uv), idx=g.index?g.index.array:null;
  const v=new T3.Vector3(), M=mesh.matrixWorld, NM=new T3.Matrix3().getNormalMatrix(M);
  for(let i=0;i<pos.length;i+=3){v.set(pos[i],pos[i+1],pos[i+2]).applyMatrix4(M); pos[i]=v.x; pos[i+1]=v.y; pos[i+2]=v.z;}
  let nrm;
  if(A.normal){nrm=g3Arr(A.normal); for(let i=0;i<nrm.length;i+=3){v.set(nrm[i],nrm[i+1],nrm[i+2]).applyMatrix3(NM).normalize(); nrm[i]=v.x; nrm[i+1]=v.y; nrm[i+2]=v.z;}}
  else{const t=new T3.BufferGeometry(); t.setAttribute('position',new T3.BufferAttribute(pos,3)); if(idx) t.setIndex(new T3.BufferAttribute(idx,1)); t.computeVertexNormals(); nrm=t.attributes.normal.array;}
  const N=SKIN_N, c=mk(N,N), x=c.getContext('2d'); x.drawImage(mesh.material.map.image,0,0,N,N);
  const src=x.getImageData(0,0,N,N).data; c.width=c.height=1;
  return skinCall({type:'prep',bi:j.bi,src,pos,nrm,uv,idx,N}).then(F=>{
    // the shape in the ski's own frame: bow along +x, keel at y=0, rider's right along +z, one unit long
    const geo=new T3.BufferGeometry();
    geo.setAttribute('position',new T3.BufferAttribute(F.P,3)); geo.setAttribute('normal',new T3.BufferAttribute(F.Q,3)); geo.setAttribute('uv',new T3.BufferAttribute(uv,2));
    if(idx) geo.setIndex(new T3.BufferAttribute(idx,1));
    geo.computeBoundingSphere();
    mesh.geometry.dispose(); mesh.material.map.dispose(); mesh.material.dispose();
    G.bases[j.bi]={geo,F,mesh:[]}; g3UseBases();
  });
}
// What the paint depends on. The player's ski is painted at full size; rivals, seen from further off, at half.
function g3SkinKey(s,bi){return bi+'|'+s.hull+'|'+s.trim+'|'+s.num+'|'+s.name+'|'+(s.me?1:0);}
function g3UseBases(){
  if(!G.bases) return;
  const want={};
  for(const s of skis){
    if(!s.hull3||!s.g3||s.model) continue;
    const bi=BASE_OF[s.sh.mark]||0, B=G.bases[bi]; if(!B) continue;
    const key=g3SkinKey(s,bi); want[key]=1;
    if(s.skin===key) continue;
    const tex=G.skinTex[key];
    if(tex) g3PutBase(s,B,tex,key);
    else if(!G.skinQ.some(j=>j.key===key)) g3Work({key,bi,s},s.me);
  }
  // paint no racer in this race is using is let go once a few have built up
  const keys=Object.keys(G.skinTex);
  if(keys.length>16) for(const k of keys) if(!want[k]){G.skinTex[k].dispose(); delete G.skinTex[k];}
}
function g3SkinNext(){
  const j=G.skinQ.shift(); if(!j){G.skinBusy=false; return;}
  let p;
  try{p=j.mesh?g3Base(j):j.rider?g3RiderPaint(j):g3PaintJob(j);}catch(e){p=null;}
  Promise.resolve(p).catch(()=>{}).then(()=>{if(G.skinQ.length) setTimeout(g3SkinNext,16); else G.skinBusy=false;});
}
function g3PaintJob(j){
  const B=G.bases[j.bi], s=j.s, racer={hull:s.hull,trim:s.trim,num:s.num,name:s.name}, gl=skinGlyphs(racer);
  return skinCall({type:'paint',bi:j.bi,racer,half:!s.me,plate:gl.plate,name:gl.name}).then(r=>{
    const t=new T3.CanvasTexture(skinFinish(r)); t.flipY=false; t.encoding=T3.LinearEncoding; t.anisotropy=Math.min(4,G.r.capabilities.getMaxAnisotropy());
    G.skinTex[j.key]=t;
    for(const o of skis) if(o.hull3&&!o.model&&o.skin!==j.key&&g3SkinKey(o,j.bi)===j.key&&(BASE_OF[o.sh.mark]||0)===j.bi) g3PutBase(o,B,t,j.key);
  });
}
// The heavy part of the work runs in a worker thread, so the game keeps drawing while a model is read or a ski is painted.
// The worker is made from these same functions; where workers are not available the work runs here instead.
const SKIN_SRC="'use strict';\n"+[skinFrame,skinHsl,skinBlur,skinPrep,skinRgb,skinPaint,skinRecolour,skinDo].map(String).join('\n')+
  "\nconst P={};\nonmessage=e=>{const m=e.data; let r=null, err=null; try{r=skinDo(m,P);}catch(x){err=String(x);} postMessage({id:m.id,r,err});};";
function skinCall(m){
  if(G.skinW===undefined){
    G.skinCb={}; G.skinId=0; G.skinP={};
    try{
      G.skinW=new Worker(URL.createObjectURL(new Blob([SKIN_SRC],{type:'text/javascript'})));
      G.skinW.onmessage=e=>{const d=e.data, cb=G.skinCb[d.id]; delete G.skinCb[d.id]; if(cb) d.err?cb[1](d.err):cb[0](d.r);};
      // if the worker cannot run, everything waiting on it is done here instead
      G.skinW.onerror=()=>{const w=G.skinCb; G.skinW=null; G.skinCb={}; for(const id in w) w[id][2]();};
    }catch(e){G.skinW=null;}
  }
  const local=()=>skinDo(m,G.skinP);
  if(!G.skinW) return new Promise(ok=>ok(local()));
  return new Promise((ok,no)=>{const id=++G.skinId; G.skinCb[id]=[ok,no,()=>{try{ok(local());}catch(e){no(e);}}]; m.id=id; G.skinW.postMessage(m);});
}
// What the worker does with a message. A worker keeps each model's prep, so painting only needs the racer's details.
function skinDo(m,P){
  if(m.type==='prep'){const p=skinPrep(m.src,m.pos,m.nrm,m.uv,m.idx,m.N); P[m.bi]=p; return p.F;}
  if(m.type==='paint') return skinPaint(P[m.bi],m.racer,m.half,m.plate,m.name);
  if(m.type==='rider') return skinRecolour(m.px,m.to);
  return null;
}
function g3PutBase(s,B,tex,key){
  if(s.skinMesh&&s.skinMesh.parent) s.skinMesh.parent.remove(s.skinMesh);
  const b=s.hullBox, len=b.max.x-b.min.x, cx=(b.max.x+b.min.x)/2, y0=b.min.y+.4;
  const mat=new T3.MeshStandardMaterial({map:tex,roughness:.42,metalness:0,envMap:G.env||null,envMapIntensity:.6,side:T3.DoubleSide}); mat.userData.own=true; mat.userData.cached=true;
  const m=new T3.Mesh(B.geo,mat); m.scale.setScalar(len); m.position.set(cx,y0,0);
  s.g3.add(m); B.mesh.push(m); s.skinMesh=m; s.skin=key;
  for(const q of s.hull3) q.visible=false;
  // the rider sits on this model's seat, keeps their boots in its footwells and their hands on its grips
  const F=B.F, R=s.rig, X=x=>cx+x*len, Y=y=>y0+y*len;
  R.hx=X(F.barX-.185); R.hy=Y(F.seatTop)+1.4; R.fx=X(F.barX-.095); R.fy=Y(F.floorY)+1.6; R.fz=F.footZ*len; R.gz=F.gripZ*len;
  R.bar.position.set(X(F.barX),Y(F.barY)-1,0);
}

// Puts the model in the ski's own frame: x toward the bow, y up from the keel, z to the rider's right, length 1. Also finds
// where the rider goes: the seat, the footwells and the grips.
function skinFrame(pos,nrm){
  const n=pos.length/3, mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9];
  for(let i=0;i<n;i++) for(let k=0;k<3;k++){const v=pos[i*3+k]; if(v<mn[k]) mn[k]=v; if(v>mx[k]) mx[k]=v;}
  // the long side is the length; models arrive pointing along x or z
  const ax=mx[0]-mn[0]>=mx[2]-mn[2]?0:2, az=2-ax, len=mx[ax]-mn[ax], ca=(mx[ax]+mn[ax])/2, cz=(mx[az]+mn[az])/2;
  // the bow is the end that comes to a point: compare how wide the hull is near each end
  let wa=0, wb=0;
  for(let i=0;i<n;i++){const u=(pos[i*3+ax]-mn[ax])/len, w=Math.abs(pos[i*3+az]-cz); if(u<.08) wa=Math.max(wa,w); else if(u>.92) wb=Math.max(wb,w);}
  const dir=wb<wa?1:-1, sz=ax===0?dir:-dir, P=new Float32Array(n*3), Q=new Float32Array(n*3);
  for(let i=0;i<n;i++){
    P[i*3]=(pos[i*3+ax]-ca)/len*dir; P[i*3+1]=(pos[i*3+1]-mn[1])/len; P[i*3+2]=(pos[i*3+az]-cz)/len*sz;
    Q[i*3]=nrm[i*3+ax]*dir; Q[i*3+1]=nrm[i*3+1]; Q[i*3+2]=nrm[i*3+az]*sz;
  }
  // the outer width of the hull along its length, so plates go only on the outside skin
  const zmax=new Float32Array(41);
  for(let i=0;i<n;i++){const b=Math.max(0,Math.min(40,Math.round((P[i*3]+.5)*40))); zmax[b]=Math.max(zmax[b],Math.abs(P[i*3+2]));}
  const high=(mx[1]-mn[1])/len, wide=(mx[az]-mn[az])/len, med=a=>{a.sort((p,q)=>p-q); return a[a.length>>1];};
  // the seat: the highest broad upward-facing surface in the back half, away from the sides
  const ys=[];
  for(let i=0;i<n;i++){const x=P[i*3], y=P[i*3+1], z=P[i*3+2]; if(x>-.38&&x<-.02&&Math.abs(z)<wide*.12&&Q[i*3+1]>.8&&y<high*.9) ys.push(y);}
  ys.sort((a,b)=>a-b); const seatTop=ys[Math.floor(ys.length*.9)]||high*.7;
  // the bars: the highest points ahead of the seat, and how far out the grips reach
  let barY=0;
  for(let i=0;i<n;i++){const x=P[i*3]; if(x>-.15&&x<.3&&P[i*3+1]>barY) barY=P[i*3+1];}
  const bx=[], gz=[];
  for(let i=0;i<n;i++){const x=P[i*3], y=P[i*3+1]; if(x>-.15&&x<.3&&y>barY-high*.06){bx.push(x); gz.push(Math.abs(P[i*3+2]));}}
  const barX=med(bx)||.02, gripZ=Math.max(wide*.25,gz.sort((p,q)=>p-q)[Math.floor(gz.length*.92)]||wide*.3)*.9;
  // the footwells: flat floor either side of the seat, below it and behind the bars
  const fy=[], fz=[];
  for(let i=0;i<n;i++){const x=P[i*3], y=P[i*3+1], z=Math.abs(P[i*3+2]); if(Q[i*3+1]>.8&&x>barX-.22&&x<barX+.03&&z>wide*.12&&z<wide*.42&&y<seatTop-.04&&y>high*.15){fy.push(y); fz.push(z);}}
  const floorY=fy.length?med(fy):seatTop-high*.3, footZ=fz.length?med(fz):wide*.25;
  return {P,Q,high,wide,zmax,seatTop,seatY:seatTop-high*.1,seatX0:-.42,seatX1:.06,barX,barY,gripZ,floorY,footZ};
}
function skinHsl(r,g,b){
  r/=255; g/=255; b/=255; const mx=Math.max(r,g,b), mn=Math.min(r,g,b), l=(mx+mn)/2; let h=0, s=0;
  if(mx!==mn){const d=mx-mn; s=l>.5?d/(2-mx-mn):d/(mx+mn); h=(mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4)*60;}
  return [h,s,l];
}
// the mean of a over a square of half-width r around each pixel
function skinBlur(a,N,r){
  const S=new Float64Array((N+1)*(N+1)), o=new Float32Array(N*N);
  for(let y=0;y<N;y++){let row=0; for(let x=0;x<N;x++){row+=a[y*N+x]; S[(y+1)*(N+1)+x+1]=S[y*(N+1)+x+1]+row;}}
  for(let y=0;y<N;y++){const y0=Math.max(0,y-r), y1=Math.min(N,y+r+1);
    for(let x=0;x<N;x++){const x0=Math.max(0,x-r), x1=Math.min(N,x+r+1);
      o[y*N+x]=(S[y1*(N+1)+x1]-S[y0*(N+1)+x1]-S[y1*(N+1)+x0]+S[y0*(N+1)+x0])/((y1-y0)*(x1-x0));}}
  return o;
}
// The work shared by every racer on a model: where each pixel sits on the hull, and what the original paint was there.
// kind: 0 not used, 1 a dark fitting, 2 paint, 3 old lettering on a fitting, 5 a fitting by its place (seat, hull bottom, bars).
function skinPrep(src,pos,nrm,uv,idx,N){
  const F=skinFrame(pos,nrm), P=F.P, Q=F.Q, pm=new Float32Array(N*N*3), nm=new Float32Array(N*N*3), used=new Uint8Array(N*N);
  const tris=idx?idx.length/3:pos.length/9;
  for(let t=0;t<tris;t++){
    const a=idx?idx[t*3]:t*3, b=idx?idx[t*3+1]:t*3+1, c=idx?idx[t*3+2]:t*3+2;
    const u0=uv[a*2]*N, v0=uv[a*2+1]*N, u1=uv[b*2]*N, v1=uv[b*2+1]*N, u2=uv[c*2]*N, v2=uv[c*2+1]*N;
    const area=(u1-u0)*(v2-v0)-(u2-u0)*(v1-v0); if(Math.abs(area)<1e-9) continue;
    const x0=Math.max(0,Math.floor(Math.min(u0,u1,u2)-1)), x1=Math.min(N-1,Math.ceil(Math.max(u0,u1,u2)+1));
    const y0=Math.max(0,Math.floor(Math.min(v0,v1,v2)-1)), y1=Math.min(N-1,Math.ceil(Math.max(v0,v1,v2)+1));
    // a pixel just outside the triangle is still filled, at lower priority, so the seams between patches are covered
    const slack=1.2*Math.max(Math.hypot(u1-u0,v1-v0),Math.hypot(u2-u1,v2-v1),Math.hypot(u0-u2,v0-v2))/Math.abs(area);
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
      const px=x+.5, py=y+.5;
      let w0=((u1-px)*(v2-py)-(u2-px)*(v1-py))/area, w1=((u2-px)*(v0-py)-(u0-px)*(v2-py))/area, w2=1-w0-w1;
      const m=Math.min(w0,w1,w2), k=y*N+x, rank=m>=0?2:m>=-slack?1:0;
      if(rank<=used[k]) continue; used[k]=rank;
      if(rank===1){w0=Math.max(0,w0); w1=Math.max(0,w1); w2=Math.max(0,w2); const s=w0+w1+w2; w0/=s; w1/=s; w2/=s;}
      for(let j=0;j<3;j++){pm[k*3+j]=P[a*3+j]*w0+P[b*3+j]*w1+P[c*3+j]*w2; nm[k*3+j]=Q[a*3+j]*w0+Q[b*3+j]*w1+Q[c*3+j]*w2;}
    }
  }
  const kind=new Uint8Array(N*N), lit=new Float32Array(N*N), isK=new Float32Array(N*N), isB=new Float32Array(N*N), isU=new Float32Array(N*N);
  // Each pixel goes in a colour class: dark (0), one of twelve hues (1-12) or white (13). The commonest class is the
  // model's main paint, whose light and dark show the shading baked into the model.
  const cls=new Uint8Array(N*N), count=new Float64Array(14); let nUsed=0;
  for(let k=0;k<N*N;k++){
    if(!used[k]) continue; isU[k]=1; nUsed++;
    const hsl=skinHsl(src[k*4],src[k*4+1],src[k*4+2]), h=hsl[0], s=hsl[1], l=hsl[2]; lit[k]=l;
    const c=l<.2||(s<.22&&l<.62)?0:s>=.3?1+Math.floor(h/30)%12:l>.7?13:0;
    cls[k]=c; count[c]++; if(c===0) isK[k]=1;
  }
  // a mostly black ski has black bodywork, so dark no longer marks a fitting there
  const darkBody=count[0]/nUsed>.5;
  let main=darkBody?0:1; if(!darkBody) for(let c=1;c<14;c++) if(count[c]>count[main]) main=c;
  const ls=[]; for(let k=0;k<N*N;k+=7) if(isU[k]&&cls[k]===main) ls.push(lit[k]);
  for(let k=0;k<N*N;k++) if(isU[k]&&cls[k]===main) isB[k]=1;
  ls.sort((a,b)=>a-b); const mid=ls[ls.length>>1]||.4, r=Math.max(2,Math.round(N/100)), rL=Math.round(N/25);
  const sh=new Float32Array(N*N), shB=new Float32Array(N*N);
  for(let k=0;k<N*N;k++) if(isB[k]) shB[k]=lit[k]/mid;
  // shading is also taken from a wide neighbourhood, so old logos printed in the main colour hardly show through
  const sb=skinBlur(shB,N,r), bf=skinBlur(isB,N,r), sbL=skinBlur(shB,N,rL), bfL=skinBlur(isB,N,rL);
  // The texture is cut into patches, one piece of the ski each. A patch with any colour in it is bodywork and is painted
  // over whole, panels and logos included. A patch that is mostly dark with no colour is a fitting (seat, mats, bars,
  // bumpers) and keeps its light and dark, with any lettering on it covered.
  const lab=new Int32Array(N*N).fill(-1), stats=[], stack=[];
  for(let k0=0;k0<N*N;k0++){
    if(used[k0]!==2||lab[k0]>=0) continue;
    const id=stats.length, st={n:0,dark:0,paint:0}; stats.push(st); lab[k0]=id; stack.push(k0);
    while(stack.length){
      const k=stack.pop(); st.n++; st.dark+=isK[k]; st.paint+=cls[k]>=1&&cls[k]<=12?1:0; const x=k%N, y=(k-x)/N;
      if(x>0&&used[k-1]===2&&lab[k-1]<0){lab[k-1]=id; stack.push(k-1);}
      if(x<N-1&&used[k+1]===2&&lab[k+1]<0){lab[k+1]=id; stack.push(k+1);}
      if(y>0&&used[k-N]===2&&lab[k-N]<0){lab[k-N]=id; stack.push(k-N);}
      if(y<N-1&&used[k+N]===2&&lab[k+N]<0){lab[k+N]=id; stack.push(k+N);}
    }
  }
  // the thin border filled around each patch takes the label of the patch beside it
  for(let pass=0;pass<3;pass++) for(let k=0;k<N*N;k++){
    if(!used[k]||lab[k]>=0) continue; const x=k%N;
    for(const j of [x>0?k-1:-1,x<N-1?k+1:-1,k-N,k+N]) if(j>=0&&j<N*N&&lab[j]>=0){lab[k]=lab[j]; break;}
  }
  const fit=stats.map(st=>!darkBody&&st.paint/st.n<.04&&st.dark/st.n>.45);
  for(let k=0;k<N*N;k++){
    if(!isU[k]) continue;
    const id=lab[k];
    kind[k]=id<0||!fit[id]?2:isK[k]?1:3;
    // places on the shape that are fittings whatever colour they were: the seat, the hull bottom, the bars
    const X=pm[k*3], Y=pm[k*3+1], Z=pm[k*3+2], ny=nm[k*3+1]/(Math.hypot(nm[k*3],nm[k*3+1],nm[k*3+2])||1);
    if(Y>F.seatY&&X>F.seatX0&&X<F.seatX1&&Math.abs(Z)<F.wide*.17&&ny>.35) kind[k]=5;
    else if(ny<-.45||Y<F.high*.07||Y>F.high*.9) kind[k]=5;
    // how light or dark the original paint was here against its usual tone: the shading baked into the model, kept under the new paint
    const near=bf[k]>.02?sb[k]/bf[k]:1, far=bfL[k]>.01?sbL[k]/bfL[k]:1;
    sh[k]=Math.min(1.2,Math.max(.7,isB[k]?.55*lit[k]/mid+.3*near+.15*far:.7*near+.3*far));
  }
  const pq=new Int16Array(N*N*3), nq=new Int8Array(N*N*3), shq=new Uint8Array(N*N), lq=new Uint8Array(N*N);
  for(let i=0;i<N*N*3;i++){pq[i]=Math.round(pm[i]*30000); nq[i]=Math.round(Math.max(-1,Math.min(1,nm[i]))*127);}
  for(let k=0;k<N*N;k++){shq[k]=Math.round(sh[k]*200); lq[k]=Math.round(Math.min(1,lit[k])*255);}
  return {N,pm:pq,nm:nq,kind,sh:shq,lit:lq,high:F.high,zmax:F.zmax,F};
}
function skinRgb(hex){const v=parseInt(hex.slice(1),16); return [v>>16&255,v>>8&255,v&255];}
function skinText(w,h,draw){const c=mk(w,h), x=c.getContext('2d'); draw(x,w,h); return x.getImageData(0,0,w,h).data;}
// the racer's number and name drawn once, as plain pixels for the painter to sample
function skinGlyphs(racer){
  const FONT="italic 800 112px 'Barlow Condensed','Arial Narrow',Arial,sans-serif";
  const plate=skinText(256,128,(x,w,h)=>{
    x.fillStyle='#fff'; x.fillRect(0,0,w,h); x.fillStyle='#000'; x.font=FONT; x.textAlign='center'; x.textBaseline='middle';
    const tw=x.measureText(String(racer.num)).width, k=Math.min(1,(w-36)/Math.max(1,tw)); x.translate(w/2,h/2+6); x.scale(k,1); x.fillText(String(racer.num),0,0);});
  const name=skinText(512,64,(x,w,h)=>{
    x.fillStyle='#000'; x.fillRect(0,0,w,h); x.fillStyle='#fff'; x.font=FONT.replace('112px','58px'); x.textAlign='center'; x.textBaseline='middle';
    const t=racer.name.toUpperCase(), tw=x.measureText(t).width, k=Math.min(1,(w-16)/Math.max(1,tw)); x.translate(w/2,h/2+3); x.scale(k,1); x.fillText(t,0,0);});
  return {plate,name};
}
// the painted pixels onto a canvas; pixels no part of the hull uses take the colour beside them, so no dark line shows
// where patches meet at a distance
function skinFinish(r){
  const W=r.W, out=mk(W,W), ox=out.getContext('2d'), im=ox.createImageData(W,W); im.data.set(r.d); ox.putImageData(im,0,0);
  const pad=mk(W,W), px=pad.getContext('2d');
  px.fillStyle='rgb('+r.tail.map(Math.round).join(',')+')'; px.fillRect(0,0,W,W);
  for(const q of [[-2,0],[2,0],[0,-2],[0,2],[-1,-1],[1,1],[-1,1],[1,-1]]) px.drawImage(out,q[0],q[1]);
  px.drawImage(out,0,0); out.width=out.height=1;
  return pad;
}
// One racer's paint: hull colour with a darker tail, two raked slashes and a crown stripe in the trim colour, a number
// plate on each side and on the hood, and the name along the tail. half paints at half size, for skis seen from further off.
function skinPaint(prep,racer,half,plate,name){
  const N=prep.N, pm=prep.pm, nm=prep.nm, kind=prep.kind, sh=prep.sh, lit=prep.lit, high=prep.high, zmax=prep.zmax;
  const st=half?2:1, W=N/st, d=new Uint8ClampedArray(W*W*4);
  const hull=skinRgb(racer.hull), trim=skinRgb(racer.trim), lumH=(hull[0]*.3+hull[1]*.59+hull[2]*.11)/255;
  const tail=hull.map(v=>v*(lumH>.75?.8:.62)), ink=[11,16,19], paper=[253,253,248], PW=256, PH=128, NW=512, NH=64;
  // a rounded plate: u and v run 0..1 across it; -1 outside, else how much ink the number puts there
  const onPlate=(u,v)=>{if(u<0||u>1||v<0||v>1) return -1; const ex=Math.max(0,Math.abs(u-.5)*2-.82)/.18, ey=Math.max(0,Math.abs(v-.5)*2-.64)/.36; if(ex*ex+ey*ey>1) return -1;
    return 1-plate[(Math.min(PH-1,v*PH|0)*PW+Math.min(PW-1,u*PW|0))*4]/255;};
  for(let yy=0;yy<W;yy++) for(let xx=0;xx<W;xx++){
    const k=yy*st*N+xx*st, o=(yy*W+xx)*4, kd=kind[k]; if(!kd) continue;
    const X=pm[k*3]/30000, Y=pm[k*3+1]/30000, Z=pm[k*3+2]/30000, nx=nm[k*3], ny=nm[k*3+1], nz=nm[k*3+2], nl=Math.hypot(nx,ny,nz)||1;
    const top=ny/nl, side=nz/nl, l=lit[k]/255; let c=null, s=sh[k]/200;
    // number plates go over paint and fittings alike, so they are always whole; side plates only on the outer skin,
    // so they are not printed again on the footwell walls
    let ink0=-1;
    const outer=Math.abs(Z)>zmax[Math.max(0,Math.min(40,Math.round((X+.5)*40)))]*.55;
    if(Math.abs(side)>.35&&side*Z>0&&outer) ink0=onPlate(((X-.12)/.062*(side>0?1:-1)+1)/2,1-((Y-high*.36)/(high*.088)+1)/2);
    if(ink0<0&&top>.5&&kd!==5) ink0=onPlate((Z/.062+1)/2,1-((X-.24)/.034+1)/2);
    if(ink0>=0){c=paper.map((v,j)=>v+(ink[j]-v)*ink0); s=.85+.15*Math.min(1,s);}
    else if(kd===1||kd===5){
      // fittings keep their light and dark but lose any colour, so no old logo or trim colour is left on them
      const g=kd===5?20+l*90:14+l*140; d[o]=g; d[o+1]=g*1.04; d[o+2]=g*1.1; d[o+3]=255; continue;}
    else if(kd===3){d[o]=16; d[o+1]=20; d[o+2]=23; d[o+3]=255; continue;}
    else{
      // the slashes rake forward as they rise; ahead of them the hull colour, behind them its darker tone
      const q=X-(Y-.14)*1.15+.06;
      c=q>.1?hull:q>.075?trim:q>.055?hull:q>-.03?trim:tail;
      if(top>.6&&Math.abs(Z)<.016&&X>-.02) c=trim;                                             // crown stripe along the hood
      if(Math.abs(side)>.45&&Y>.095&&Y<.13&&X>-.44&&X<-.16){                                   // name along the tail
        const u=((X+.30)/.14*(side>0?1:-1)+1)/2, v=1-(Y-.095)/.035;
        if(u>=0&&u<=1&&name[(Math.min(NH-1,v*NH|0)*NW+Math.min(NW-1,u*NW|0))*4]>110) c=trim;
      }
    }
    for(let j=0;j<3;j++) d[o+j]=s<=1?c[j]*s:c[j]+(255-c[j])*(s-1)*.6;
    d[o+3]=255;
  }
  return {d,W,tail};
}

// ----- the rigged rider -----
// A rider model with a skeleton (Mixamo-style bone names, each bone pointing along its own +y toward its child). It takes
// the place of the built rider's body: every frame the built rider's joints are still worked out (hips on the seat, hands on
// the grips, boots in the footwells, lean, standing up, the fist in the air), and the rig's bones are turned to match,
// using the rig's own bone lengths. Each racer gets their own copy of the skeleton and their colours on the gear.
const RIDER='models/rider-fly/', K3BACK=.6;
const RIG3=['Hips','Spine02','Spine01','Spine','neck','Head','LeftArm','LeftForeArm','LeftHand','RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','RightUpLeg','RightLeg','RightFoot'];
function g3RiderSrc(scene){
  let mesh=null; scene.traverse(o=>{if(o.isSkinnedMesh&&!mesh) mesh=o;});
  if(!mesh||!mesh.material.map) return null;
  // measured in the rest pose, with the model at its own size: where the hips are and how long each limb is
  scene.updateMatrixWorld(true);
  const W={}; scene.traverse(o=>{if(o.isBone) W[o.name]=new T3.Vector3().setFromMatrixPosition(o.matrixWorld);});
  if(RIG3.some(n=>!W[n])) return null;
  const d=(a,b)=>W[a].distanceTo(W[b]);
  const leg=d('LeftUpLeg','LeftLeg')+d('LeftLeg','LeftFoot'), k=(RIG.th+RIG.sn)/leg;   // sized so its legs match the built rider's
  const M=mesh.material; for(const t of [M.map,M.emissiveMap]) if(t) t.encoding=T3.LinearEncoding;
  return {scene,mesh,k,hips:W.Hips.clone(),ua:d('LeftArm','LeftForeArm')*k,fa:d('LeftForeArm','LeftHand')*k,th:d('LeftUpLeg','LeftLeg')*k,sn:d('LeftLeg','LeftFoot')*k,
    tex:{},used:[]};
}
// A copy with its own bones, bound the way the original is, so each racer can be posed on their own.
function g3RiderCopy(src){
  const root=new T3.Group(), sc=src.scene.clone(true); root.add(sc);
  const bones={}; let mesh=null;
  sc.traverse(o=>{if(o.isBone) bones[o.name]=o; if(o.isSkinnedMesh) mesh=o;});
  const sk=src.mesh.skeleton, list=sk.bones.map(b=>bones[b.name]);
  mesh.bind(new T3.Skeleton(list,sk.boneInverses.map(m=>m.clone())),src.mesh.bindMatrix);
  mesh.frustumCulled=false;                  // posed far from how it was bound, so its bounds would be wrong
  const rest={}; for(const n in bones) rest[n]=bones[n].quaternion.clone();
  root.rotation.y=Math.PI/2;                 // the model faces +z, the ski points along +x
  root.scale.setScalar(src.k);
  return {root,mesh,bones,rest};
}
function g3RiderKey(s){return s.hull+'|'+s.trim;}
function g3UseRiders(){
  const src=G.rider; if(!src) return;
  for(const s of skis){
    const R=s.rig; if(!R||!s.g3||s.model) continue;
    if(!R.k3){
      const K=g3RiderCopy(src); R.k3=K; src.used.push(K);
      K.mesh.material=src.mesh.material.clone(); K.mesh.material.skinning=true;
      if(G.env){K.mesh.material.envMap=G.env; K.mesh.material.envMapIntensity=.6;}
      s.g3.add(K.root); R.torso.visible=false; for(const q of R.limbs) q.visible=false;
      // the back number stays: it moves off the hidden built torso and follows it from outside, a little further back to
      // sit on the rigged rider's vest
      if(R.bk){R.bk.position.x-=K3BACK; R.bk.updateMatrix(); R.bkM=R.bk.matrix.clone(); R.torso.remove(R.bk); s.g3.add(R.bk); R.bk.matrixAutoUpdate=false;}
    }
    const key=g3RiderKey(s), t=src.tex[key];
    if(t){if(R.k3.mesh.material.map!==t){R.k3.mesh.material.map=t; R.k3.mesh.material.needsUpdate=true;}}
    else if(!G.skinQ.some(j=>j.rider&&j.key===key)) g3Work({rider:true,key,hull:s.hull,trim:s.trim},s.me);
  }
}
// The racer's colours on the gear.
function g3RiderPaint(j){
  const src=G.rider, o=src.mesh.material.map, img=o.image;
  if(!src.px){const N=Math.min(1024,img.width||1024), c=mk(N,N), x=c.getContext('2d'); x.drawImage(img,0,0,N,N); src.px=x.getImageData(0,0,N,N).data; src.N=N; c.width=c.height=1;}
  return skinCall({type:'rider',px:src.px,to:skinRgb(j.hull)}).then(p=>{
    const N=src.N, c=mk(N,N), x=c.getContext('2d'), im=x.createImageData(N,N); im.data.set(p); x.putImageData(im,0,0);
    const t=new T3.CanvasTexture(c); t.flipY=o.flipY; t.encoding=T3.LinearEncoding; t.wrapS=o.wrapS; t.wrapT=o.wrapT;
    src.tex[j.key]=t; g3UseRiders();
  });
}
// The model's own bright orange becomes the racer's hull colour, keeping its light and dark.
function skinRecolour(px,to){
  const p=new Uint8ClampedArray(px);
  for(let i=0;i<p.length;i+=4){
    const hsl=skinHsl(p[i],p[i+1],p[i+2]), h=hsl[0], s=hsl[1], l=hsl[2];
    if(h>14&&h<48&&s>.55&&l>.25){const f=Math.min(1.6,l/.5); for(let q=0;q<3;q++) p[i+q]=Math.min(255,to[q]*f);}
  }
  return p;
}
// turns bone b so its +y points along d, both in the ski's own space
const RQ={a:null};
function g3Aim(K,b,d,stop){
  if(!RQ.a) RQ.a={p:new T3.Quaternion(),w:new T3.Quaternion(),r:new T3.Quaternion(),y:new T3.Vector3(),c:new T3.Vector3()};
  const Q=RQ.a; Q.p.identity();
  for(let o=b.parent;o&&o!==stop;o=o.parent) Q.p.premultiply(o.quaternion);   // the parent's turn relative to the ski
  Q.w.copy(Q.p).multiply(b.quaternion);
  Q.c.copy(Q.y.set(0,1,0)).applyQuaternion(Q.w);
  Q.r.setFromUnitVectors(Q.c,d.normalize()); Q.w.premultiply(Q.r);
  b.quaternion.copy(Q.p.invert()).multiply(Q.w);
}
// two bones from a to b with lengths l1, l2, bending toward the pole; returns the middle joint
function g3Knee(a,b,l1,l2,px,py,pz){
  let dx=b.x-a.x, dy=b.y-a.y, dz=b.z-a.z; const d=Math.hypot(dx,dy,dz)||1e-6, m=Math.min(d,l1+l2-.02); dx/=d; dy/=d; dz/=d;
  const al=(l1*l1-l2*l2+m*m)/(2*m), h=Math.sqrt(Math.max(0,l1*l1-al*al)), k=px*dx+py*dy+pz*dz;
  px-=k*dx; py-=k*dy; pz-=k*dz; const pl=Math.hypot(px,py,pz)||1;
  return new T3.Vector3(a.x+dx*al+px/pl*h,a.y+dy*al+py/pl*h,a.z+dz*al+pz/pl*h);
}
const SPINE3=[[0,0],[1.05,1.55],[2.2,3],[3.3,4.25],[4.25,5.15],[4.95,6.05]];
function g3RigPose(s){
  const R=s.rig, K=R.k3, src=G.rider, B=K.bones, g=s.g3, V=T3.Vector3;
  for(const n in B) B[n].quaternion.copy(K.rest[n]);
  // hips where the built rider's hips are
  const tq=R.torso.quaternion, hip=new V(0,-.35,0).applyQuaternion(tq).add(R.torso.position);
  K.root.position.copy(src.hips).multiplyScalar(src.k).applyAxisAngle(G.Y,Math.PI/2).negate().add(hip);
  // the back follows the built rider's spine, bend and lean included; the head turns with the built head
  const dir=(a,b)=>new V(b[0]-a[0],b[1]-a[1],0).applyQuaternion(tq);
  const sp=['Hips','Spine02','Spine01','Spine','neck'];
  for(let i=0;i<sp.length;i++) g3Aim(K,B[sp[i]],dir(SPINE3[i],SPINE3[i+1]),g);
  g3Aim(K,B.Head,new V(0,1,0).applyQuaternion(R.head.quaternion).applyQuaternion(tq),g);
  // arms and legs: from the rig's own shoulders and hips to the built rider's hands and ankles
  K.root.updateMatrixWorld(true);
  const gi=new T3.Matrix4().copy(g.matrixWorld).invert(), at=n=>new V().setFromMatrixPosition(B[n].matrixWorld).applyMatrix4(gi);
  const end=(q,len)=>new V(0,len,0).applyQuaternion(q.quaternion).add(q.position);
  for(let i=0;i<2;i++){
    const sd=i?1:-1, side=i?'Right':'Left';
    const S=at(side+'Arm'), H=end(R.fa[i],RIG.fa), E=g3Knee(S,H,src.ua,src.fa,-.25,.4,sd*.9);
    g3Aim(K,B[side+'Arm'],E.clone().sub(S),g); g3Aim(K,B[side+'ForeArm'],H.clone().sub(E),g);
    const J=at(side+'UpLeg'), A=end(R.sn[i],RIG.sn), N=g3Knee(J,A,src.th,src.sn,.8,.55,sd*.3);
    g3Aim(K,B[side+'UpLeg'],N.clone().sub(J),g); g3Aim(K,B[side+'Leg'],A.clone().sub(N),g);
  }
}
// ---------- the win celebration and the award ceremony ----------
let lastRows=null, cer=null, cele=null, conf=[], confT=0;
const MEDAL=['#e8b923','#c9ced3','#c27c3a'];
function fanfare(big){
  const notes=big?[[523,0],[659,.13],[784,.26],[1047,.42],[784,.64],[1047,.78]]:[[659,0],[784,.13],[1047,.28]];
  for(const n of notes) setTimeout(()=>blip(n[0],.24,'square',.09),n[1]*1000);
}
// A win: the rider stands up and pumps a fist, the ski spins a donut in its own spray, and fireworks go up over the water.
function celebrate(donut){
  cele={t:0,donut:!!donut,fw:.2};
  pl.cheer=4; pl.nores=true;
  flash('Winner','big',1500); fanfare(true); buzz(60);
  if(!G.on) confetti2D(160);
}
function celeStep(dt){
  cele.t+=dt;
  if(pl.cheer>0) pl.cheer-=dt;
  if(cele.donut){
    if(cele.t>.6&&cele.t<3.4){
      // full lock and a steady throttle, the hull swung round faster than it would turn on its own
      pl.ai=false; pl.steer=1; pl.thr=.55; pl.brk=0; pl.h+=2.5*dt;
    }else if(cele.t>=3.4&&!pl.ai){pl.ai=true; pl.skill=.8; pl.laneT=0;}
  }
  if(G.on&&cele.t<3.8){cele.fw-=dt; if(cele.fw<=0){cele.fw=.25+Math.random()*.2; g3Firework();}}
  if(cele.t>4.6){pl.nores=false; cele=null;}
}

// the ceremony: the top three on a podium, trophies, champagne and confetti, then on to whatever comes next
function startCeremony(o){
  cer=Object.assign({t:0},o); mode='podium'; setLive(false); resAt=0; cele=null;
  el.result.hidden=true; el.start.hidden=true; el.pause.hidden=true;
  el.cerEyebrow.textContent=o.eyebrow; el.cerTitle.textContent=o.title; el.cerList.textContent='';
  o.rows.forEach((r,i)=>{
    const li=document.createElement('li'), d=document.createElement('span'), n=document.createElement('span'), v=document.createElement('span');
    d.className='medal'; d.style.background=MEDAL[i]; d.textContent=String(i+1);
    n.textContent=r.name; v.textContent=r.val;
    if(/\(you\)/.test(r.name)) li.className='me';
    li.append(d,n,v); el.cerList.appendChild(li);
  });
  el.cer.hidden=false; document.body.classList.add('cering');
  if(G.on) g3CerStart(o.rows); else confetti2D(220);
  fanfare(true); buzz(40);
}
function endCeremony(){
  if(!cer) return;
  const a=cer.after; cer=null; el.cer.hidden=true; document.body.classList.remove('cering');
  if(G.on) g3CerEnd();
  conf=[]; mode='done'; el.result.hidden=false;
  if(a) a();
}
// the podium for a single race: the top three of the last results
function racePodium(){
  if(!lastRows) return;
  const w=lastRows[0].t;
  startCeremony({eyebrow:'Award ceremony · '+site.name,title:gmode==='items'?'Item race podium':'Race podium',
    rows:lastRows.slice(0,3).map((r,i)=>({ri:r.ri,name:r.name,val:i?'+'+(r.t-w).toFixed(1):fmt(r.t)})),after:null});
}

// Without WebGL: paper confetti drawn over the overhead view, and a flat podium.
function confetti2D(n){
  const cols=['#e4392c','#ffc62a','#38c6f4','#2de0b0','#ff4fa3','#f1fbf8','#a78bfa','#ff8a3c'];
  for(let i=0;i<n;i++) conf.push({x:Math.random()*W,y:-20-Math.random()*H*.6,vx:(Math.random()-.5)*60,vy:60+Math.random()*80,r:Math.random()*TAU,vr:(Math.random()-.5)*10,c:cols[i%cols.length],w:5+Math.random()*5,h:3+Math.random()*4,l:4+Math.random()*3});
}
function drawConfetti(){
  const dt=clamp(clock-confT,0,.05); confT=clock;
  if(!conf.length) return;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  for(let i=conf.length-1;i>=0;i--){
    const c=conf[i]; c.l-=dt; c.x+=(c.vx+Math.sin(clock*3+i)*30)*dt; c.y+=c.vy*dt; c.r+=c.vr*dt;
    if(c.l<=0||c.y>H+20){conf[i]=conf[conf.length-1]; conf.pop(); continue;}
    ctx.save(); ctx.translate(c.x,c.y); ctx.rotate(c.r); ctx.globalAlpha=Math.min(1,c.l); ctx.fillStyle=c.c; ctx.fillRect(-c.w/2,-c.h/2,c.w,c.h); ctx.restore();
  }
  ctx.globalAlpha=1;
}
function podium2D(){
  if(!cer) return;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.fillStyle='rgba(6,32,42,.45)'; ctx.fillRect(0,0,W,H);
  const cx=W/2, base=H*.52, bw=Math.min(96,W*.25), hs=[150,105,72], xs=[cx,cx-bw,cx+bw], order=[1,0,2];
  ctx.textAlign='center'; ctx.textBaseline='middle';
  for(const i of order){
    const r=cer.rows[i]; if(!r) continue;
    const x=xs[i], h=hs[i]*Math.min(1,cer.t*1.5);
    ctx.fillStyle='#fcfdfb'; ctx.fillRect(x-bw/2+3,base-h,bw-6,h);
    ctx.fillStyle=MEDAL[i]; ctx.fillRect(x-bw/2+3,base-h,bw-6,8);
    ctx.fillStyle='#06202a'; ctx.font="italic 800 38px 'Barlow Condensed','Arial Narrow',sans-serif"; ctx.fillText(String(i+1),x,base-h/2+4);
    const col=(RACERS[r.ri]||RACERS[0]).hull;
    ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x,base-h-26,16,0,TAU); ctx.fill(); ctx.strokeStyle='#fcfdfb'; ctx.lineWidth=3; ctx.stroke();
    ctx.fillStyle='#f1fbf8'; ctx.font="700 15px 'Barlow Condensed','Arial Narrow',sans-serif"; ctx.fillText(r.name.replace(' (you)','').toUpperCase(),x,base-h-56);
  }
}

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
  // a wide course is drawn smaller to fit the box, so its line is drawn thicker to stay as bold as the others
  pg.setAttribute('stroke-width',String(3*Math.max(1,sh.w/52))); pg.setAttribute('stroke-linejoin','round');
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
  el.go.textContent=dr&&HX.on?'Line up against Marcus':dr?(ladder.round?'Run the '+ROUNDS[ladder.round].toLowerCase()+' vs '+RACERS[ladder.opp[ladder.round]].name:'Start the ladder'):gmode==='items'?'Start item race':gmode==='crates'?'Start crate run':!t?'Start race':live?(tour.round%2?'Start moto 2':'Start round '+(tStop()+1)):'Start tour';
  el.quit.hidden=!live||dr||HX.on; el.quit.textContent='Abandon tour'; quitArm=false;
  // from the city the plate is the pits for one thing: a weekend, an open race, a drag run, or the garage with nothing to start
  el.go.hidden=HX.on&&HX.kind==='garage';
  el.startEyebrow.textContent=!HX.on?'Closed course · 10 riders':HX.kind==='garage'?'Tommy\'s Garage · your ski':t?'Race weekend · 10 riders':dr?'Drag strip · you against Marcus':'Open race · 10 riders';
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
      const sm=document.createElement('small'); sm.textContent='Round '+(i+1)+' · two motos · '+lapsTxt(s.laps)+' each'; l.appendChild(sm);
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
      const n=document.createElement('span'); n.className='laps'; n.textContent=lapsTxt(s.laps);
      const best=parseFloat(load('v12.best.'+s.id));
      if(best>0){const sm=document.createElement('small'); sm.textContent='Best '+fmt(best); n.appendChild(sm);}
      b.append(siteIcon(i),l,n);
      b.addEventListener('click',()=>{sel.s=i; store('site',i); press('.opt',i); loadSite(i,false); summary();});
      el.list.appendChild(b);
    });
    return;
  }
  const racer=t==='r', items=racer?RACERS:CRAFTS, stats=racer?RSTAT:CSTAT, cur=racer?sel.r:sel.c, locked=(inTour||HX.on)&&tourLive();
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
      if(racer){sel.r=i; store(PKEY('racer'),i);}else{sel.c=i; store(PKEY('craft'),i);}
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
      d.addEventListener('click',()=>{sel.paint=i; store(PKEY('paint'),i); press('.dab',i+1); if(mode==='idle') reset();});
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
  if(window.CITYON){last=ts; requestAnimationFrame(frame); return;}          // nothing runs or draws while the city is on screen
  const raw=Math.min(.1,(ts-last)/1000||.016); last=ts;
  // A device that cannot hold the frame rate loses the moving shimmer and some sharpness, a step at a time. This is watched
  // from the setup screen on, so the picture has usually settled before the first race, and the answer is remembered.
  // Nor while skis are being painted: handing a finished ski to the screen can cost a frame, which says nothing about the device.
  if(G.skinBusy) calmT=Math.max(calmT,.5);
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
  if(window.CITYON) return;
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
    else if(mode==='idle'&&el.go.hidden) return;
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
el.toSetup.addEventListener('click',()=>{if(HX.on) hsRetire(); else backToSetup();});
// from free play the button goes to the city; from the city's pits it goes back to it
el.toCity.addEventListener('click',()=>{if(HX.on) hsExit(); else if(window.CITY) window.CITY.enter();});
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
  riv=r; if(!HX.on) store('o10.riv',r); syncOpts(); if(mode==='idle') reset();
});
window.addEventListener('resize',resize);

// ---------- Side Hustle City ----------
// The main game is a life sim, Side Hustle City (src/city), laid over this page. It is a script of its own and reaches the racing
// only through window.HS, below. While the city is on screen window.CITYON is true and nothing here runs or draws.
// The city has a garage and a tour of its own, saved apart from free play (PKEY), and one wallet: in the city, gar.cash is the
// city's money. HX holds what the city asked for when it opened the pits: prices, purse, small rider edges, and where to report.
const HX={on:false,kind:'',disc:1,svc:1,purse:1,top:1,turn:1,shop:true,done:null,exit:null,won:0,wget:()=>0,wset:()=>{}};
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
  HX.on=false; Object.assign(HX,{kind:'',disc:1,svc:1,purse:1,top:1,turn:1,shop:true,done:null,exit:null,won:0});
  gar=free.gar; tour=free.tour; sel.r=free.r; sel.c=free.c; sel.paint=free.paint; riv=free.riv; autoPace=free.autoPace; gmode=free.gmode; ladder=free.ladder; free=null;
  document.body.classList.remove('city'); document.body.classList.toggle('drag',gmode==='drag'); el.toSetup.textContent='Back to setup'; el.go.hidden=false;
  mode='idle'; paused=false; resAt=0; el.result.hidden=true; el.pause.hidden=true; el.start.hidden=false; setLive(false); hudLabels();
  window.CITYON=false; stage(); refreshSetup(); resize();
}
// the city opens the pits: c.mode is 'tour' (a race weekend), 'open' (one race), 'drag' (a run against Marcus) or 'garage' (no race)
function hsOpen(c){
  if(!HX.on) return;
  Object.assign(HX,{kind:c.mode,disc:c.disc||1,svc:c.svc||1,purse:c.purse==null?1:c.purse,top:c.top||1,turn:c.turn||1,shop:c.mode==='garage',done:c.done||null,exit:c.exit||null,won:0});
  gmode=c.mode==='tour'?'tour':c.mode==='drag'?'drag':'single';
  hudLabels(); document.body.classList.toggle('drag',gmode==='drag');
  if(tourLive()){sel.r=tour.r; sel.c=tour.c;}
  if(gmode==='drag'){const o=(sel.r+1)%RACERS.length; ladder={round:clamp(c.level|0,0,2),opp:[o,o,o]};}
  tab=HX.shop?'g':tab==='g'?'c':tab;
  mode='idle'; paused=false; resAt=0; resAction=startCountdown; el.result.hidden=true; el.pause.hidden=true; el.start.hidden=false;
  window.CITYON=false; stage(); refreshSetup(); resize();
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
  if(gmode==='tour'){
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
})();
