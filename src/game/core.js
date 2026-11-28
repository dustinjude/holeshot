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
