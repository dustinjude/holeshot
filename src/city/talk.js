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
