// Runs from the law with no browser: the player's ski driven by the rival logic at a given skill, on every course a run can use,
// against 1 to 4 patrol skis at each level. Prints how each ends, to tune the chase. `node tools/chase.mjs [site]`.
import {readFileSync} from 'node:fs';
const core=readFileSync(new URL('../src/game/core.js',import.meta.url),'utf8');
const A=new Function(core+';return {SITES,PARTS,garageMod,makeWorld,runGrid,chaseStep,simStep};')();
const only=process.argv[2];
for(const id of ['river','bayou','stormhead']){
  if(only&&id!==only) continue;
  const site=A.SITES.find(s=>s.id===id);
  console.log(id);
  for(const parts of [0,1,3]) for(const skill of [.85]){
    let row=`  my parts ${parts} skill ${skill} |`;
    for(const [n,level] of [[1,0],[2,1],[3,2],[4,3]]){
      const W=A.makeWorld(site,false); W.laps=1;
      const pl=A.runGrid(W,5,0,A.garageMod(A.PARTS.map(()=>parts),null,null),n,.3+.15*level,A.garageMod(A.PARTS.map(()=>level),null,null));
      pl.ai=true; pl.skill=skill; W.go=true;
      const dt=1/120; let peak=0, end='lap', nearT=0;
      while(W.t<300&&pl.fin==null){
        W.env.t=W.t; A.simStep(W,dt); A.chaseStep(W,dt); peak=Math.max(peak,W.run.bust); if(W.run.near) nearT+=dt;
        if(W.run.bust>=100){end='BUST'; break;}
      }
      row+=` ${n}xL${level}: ${end} ${W.t.toFixed(0)}s pk${peak.toFixed(0)} near${nearT.toFixed(0)}s h${W.run.hits} c${W.run.cargo} |`;
    }
    console.log(row);
  }
}
