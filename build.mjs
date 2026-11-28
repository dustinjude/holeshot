// Assembles the game into dist/: a plain static folder that any https host can serve and that installs to a phone's
// home screen. No dependencies: `node build.mjs`. With --test it writes dist-test/ instead, with a few test hooks
// exposed on window.__hs (see tests/smoke.mjs).
import {readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join, relative, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const TEST = process.argv.includes('--test');
const OUT = join(ROOT, TEST ? 'dist-test' : 'dist');
const src = p => join(ROOT, 'src', p);
const read = p => readFileSync(p, 'utf8');
const trim = s => s.replace(/\n+$/, '');

// The game is one script in one strict-mode scope. core.js goes first; shell.js holds one marker line for each other
// part, which is inserted there. Top-level consts are initialised in this order, so keep it.
let shell = read(src('game/shell.js'));
for (const k of ['draw', 'arcade', 'r3', 'party', 'run', 'bridge']) {
  const mark = '//@' + k;
  if (shell.split(mark).length !== 2) throw new Error(`src/game/shell.js needs exactly one "${mark}" line`);
  shell = shell.replace(mark, () => trim(read(src(`game/${k}.js`))));
}
let game = "(()=>{'use strict';\n" + trim(read(src('game/core.js'))) + '\n' + trim(shell) + '\n})();\n';
if (TEST) {
  // hooks for tests only: read the state, let the player's ski drive itself, run the sim faster than real time
  const hooks = ";window.__hs={state:()=>({mode,gmode,site:site.id,place:place(),lap:pl.lap,laps:LAPS,quality:QUAL,dpr:DPR," +
    "models:skis.filter(s=>s.model).map(s=>s.ri),gl:!!G.on,city:HX.on,cityOn:!!window.CITYON,kind:HX.kind,tour:tour.round,cash:gar.cash,run:wd.run?{bust:wd.run.bust,cargo:wd.run.cargo,hits:wd.run.hits,cops:ais.length}:null}),auto:()=>{pl.ai=true;pl.skill=.9;}," +
    "run:sec=>{for(let i=0;i<sec*120&&!paused;i++)update(1/120);},pay:n=>{gar.cash+=n;}};\n";
  game = game.replace(/\}\)\(\);\n$/, () => hooks + '})();\n');
}
new Function(game);   // parses only: a syntax error stops the build here instead of on a phone

// Side Hustle City is a script of its own, so its names stay out of the game's scope. Its styles and markup go into a
// <template> in the page, which the script copies into a shadow root.
let city = trim(read(src('city/city.js'))) + '\n';
for (const k of ['art', 'ui', 'hustle', 'life', 'street', 'talk']) {
  const mark = '//@' + k;
  if (city.split(mark).length !== 2) throw new Error(`src/city/city.js needs exactly one "${mark}" line`);
  city = city.replace(mark, () => trim(read(src(`city/${k}.js`))));
}
if (city.split('/*@cast*/null').length !== 2) throw new Error('src/city/city.js needs exactly one /*@cast*/null');
city = city.replace('/*@cast*/null', () => JSON.stringify(JSON.parse(read(src('city/cast.json')))));
new Function(city);

let html = read(src('index.html'));
if (html.split('/*@css*/').length !== 2) throw new Error('src/index.html needs exactly one /*@css*/');
html = html.replace('/*@css*/', () => trim(read(src('style.css'))));
for (const [mark, file] of [['/*@citycss*/', 'city/city.css'], ['<!--@city-->', 'city/city.html']]) {
  if (html.split(mark).length !== 2) throw new Error(`src/index.html needs exactly one ${mark}`);
  html = html.replace(mark, () => trim(read(src(file))));
}

rmSync(OUT, {recursive: true, force: true});
mkdirSync(join(OUT, 'js'), {recursive: true});
writeFileSync(join(OUT, 'index.html'), html);
writeFileSync(join(OUT, 'js/game.js'), game);
writeFileSync(join(OUT, 'js/city.js'), city);
cpSync(join(ROOT, 'vendor/three.min.js'), join(OUT, 'js/three.min.js'));
cpSync(join(ROOT, 'vendor/GLTFLoader.js'), join(OUT, 'js/GLTFLoader.js'));
cpSync(src('manifest.webmanifest'), join(OUT, 'manifest.webmanifest'));
cpSync(src('icons'), join(OUT, 'icons'), {recursive: true});
cpSync(join(ROOT, 'models'), join(OUT, 'models'), {recursive: true});

// The offline cache lists every file and is named from a hash of their contents, so an installed copy picks up a
// new build by itself.
const files = [];
(function walk(d) {
  for (const f of readdirSync(d).sort()) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p); else files.push(relative(OUT, p).split('\\').join('/'));
  }
})(OUT);
const h = createHash('sha256');
for (const f of files) h.update(f).update(readFileSync(join(OUT, f)));
const version = 'holeshot-' + h.digest('hex').slice(0, 10);
let sw = read(src('sw.js'));
sw = sw.replace("'__VERSION__'", () => JSON.stringify(version)).replace('__FILES__', () => JSON.stringify(['./', ...files]));
writeFileSync(join(OUT, 'sw.js'), sw);

const kb = n => (n / 1024).toFixed(0) + ' KB';
const total = files.reduce((a, f) => a + statSync(join(OUT, f)).size, 0);
console.log(`built ${relative(ROOT, OUT)}/ (${files.length + 1} files, ${kb(total)}), game.js ${kb(game.length)}, cache ${version}`);
