// Whole races with no browser: every course, both directions, rivals at pace 0, 0.5 and 1, ten skis each, the player's
// ski driven by the rival logic. `node tools/sim.mjs` for all courses, `node tools/sim.mjs arena` for one.
// A healthy course shows 0 rescues, 0 DNF and 0 offCourseSteps at every pace.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const core=readFileSync(new URL('../src/game/core.js',import.meta.url),'utf8');
export const A=new Function(core+';return {SITES,RACERS,CRAFTS,LEVELS,rivalSpec,waveH,makeWorld,gridUp,simStep,playerDrive,flowStep,planThr,angDiff,clamp,DS,MPH,VMAX};')();
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  const only=process.argv[2];
  for(const site of A.SITES){
    if(only&&site.id!==only) continue;
    for(const rev of [false,true]){
      const W0=A.makeWorld(site,rev);
      if(!rev) console.log(`${site.id}: lap ${(W0.L).toFixed(0)} units, ${W0.turns.length} turns, ${W0.land.length} land blobs, tightest radius ${(1/Math.max(...W0.path.map(p=>Math.abs(p.k)))).toFixed(0)}`);
      for(const lv of [0,.5,1]){
        const W=A.makeWorld(site,rev), pl=A.gridUp(W,0,0,lv); pl.ai=true; pl.skill=.9; W.go=true;
        const dt=1/120; let out=0, beach=0, bump=0, steps=0, air=0, maxz=0, land=0;
        while(W.t<400&&W.skis.some(s=>s.fin==null)){
          W.env.t=W.t; A.simStep(W,dt); steps++;
          for(const s of W.skis){if(s.out>0)out++; if(s.beach>0)beach++; if(s.bump>.2)bump++; if(s.air>0){air++; maxz=Math.max(maxz,s.z-s.hw);} if(s.land>0){land=Math.max(land,s.land); s.land=0;}}
        }
        const o=W.skis.slice().sort((a,b)=>(a.fin??999)-(b.fin??999));
        const resc=W.skis.reduce((a,s)=>a+s.resc,0);
        console.log(`  ${rev?'rev':'fwd'} pace ${lv} | bot P${o.indexOf(pl)+1} ${pl.fin?pl.fin.toFixed(1):'DNF'} | field ${o[0].fin?.toFixed(1)}..${o[o.length-1].fin?.toFixed(1)??'DNF'} | offCourseSteps ${out} rescues ${resc} bankSteps ${beach} bumpSteps ${bump} | hops ${W.skis.reduce((a,s)=>a+s.hops,0)} airShare ${(air/steps/W.skis.length*100).toFixed(1)}% highest ${maxz.toFixed(1)} hardestLanding ${land.toFixed(0)} | DNF ${W.skis.filter(s=>s.fin==null).length}`);
      }
    }
  }
}
