// ---------- art ----------
// Joined into city.js at //@art. Everything the city draws is built here from code: small icons, a face for each person, a
// scene for each place, and the map. All of it is SVG text; nothing is loaded. The people are original designs.

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
  return `<span class="fc${cls?" "+cls:""}" style="width:${size}px;height:${size}px"><svg viewBox="9 7 82 82" width="${size}" height="${size}" aria-hidden="true">${o.join("")}</svg></span>`;
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
