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
    const mh=92, sc=mh/(by1-by0), mw=(bx1-bx0)*sc, mx=W-16-mw-8, my=hudBottom+8;
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
