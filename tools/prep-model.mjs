// Turns a .glb (ski with rider) into the form the game loads: models/<name>/model.json plus tex0.jpg, tex1.jpg...
// Textures go to 1024 px JPEG and the geometry is quantized, which took the first two models from ~3.7 MB to ~1.8 MB
// with no visible change.
//
//   node tools/prep-model.mjs models-source/vanjae-116.glb vanjae-116
//
// Then map the racer to the folder in MODELS in src/game/r3.js (racer index -> 'models/<name>/') and rebuild.
// Needs network the first time: it runs @gltf-transform/cli through npx.
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync, mkdirSync, rmSync, renameSync, mkdtempSync, readdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';

const [input, name] = process.argv.slice(2);
if (!input || !name || !/^[a-z0-9-]+$/.test(name)) {
  console.error('usage: node tools/prep-model.mjs <file.glb> <name: lowercase letters, digits, dashes>');
  process.exit(1);
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(tmpdir(), 'hs-model-'));
const gt = (...a) => execFileSync('npx', ['-y', '@gltf-transform/cli@4.1.1', ...a], {stdio: ['ignore', 'pipe', 'inherit']}).toString();

gt('resize', input, join(tmp, 'a.glb'), '--width', '1024', '--height', '1024');
gt('jpeg', join(tmp, 'a.glb'), join(tmp, 'b.glb'), '--quality', '85');
gt('quantize', join(tmp, 'b.glb'), join(tmp, 'c.glb'));
mkdirSync(join(tmp, 'out'));
gt('copy', join(tmp, 'c.glb'), join(tmp, 'out', 'model.gltf'));

// one JSON file with the geometry inside it, and the textures beside it as plain JPEGs
const dir = join(tmp, 'out'), g = JSON.parse(readFileSync(join(dir, 'model.gltf'), 'utf8'));
for (const b of g.buffers) b.uri = 'data:application/octet-stream;base64,' + readFileSync(join(dir, b.uri)).toString('base64');
(g.images || []).forEach((im, k) => { renameSync(join(dir, im.uri), join(dir, `tex${k}.jpg`)); im.uri = `tex${k}.jpg`; });
const dest = join(ROOT, 'models', name);
rmSync(dest, {recursive: true, force: true}); mkdirSync(dest, {recursive: true});
writeFileSync(join(dest, 'model.json'), JSON.stringify(g));
for (const f of readdirSync(dir)) if (/^tex\d+\.jpg$/.test(f)) renameSync(join(dir, f), join(dest, f));
rmSync(tmp, {recursive: true, force: true});

const tris = g.meshes.flatMap(m => m.primitives).reduce((a, p) => a + (p.indices != null ? g.accessors[p.indices].count : g.accessors[p.attributes.POSITION].count) / 3, 0);
const size = readdirSync(dest).reduce((a, f) => a + readFileSync(join(dest, f)).length, 0);
console.log(`models/${name}/: ${Math.round(tris).toLocaleString()} triangles, ${(size / 1048576).toFixed(2)} MB`);
if (tris > 60000) console.log('That is heavy for ten skis on a phone; aim for 40,000 or fewer.');
