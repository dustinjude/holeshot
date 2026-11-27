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
