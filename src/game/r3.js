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
