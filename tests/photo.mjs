// Plays Side Hustle City with photographs, in a phone-sized headless Chrome, against a stand-in for the server: a list of
// which pictures exist, a maker that takes a moment, and a labelled placeholder for every picture. It checks that the right
// picture is asked for and shown for each place, hour and mood, that the drawing stands in for anything missing or broken,
// that the player can switch photographs off, and that the offline cache keeps pictures apart. It never reaches the network,
// so it says nothing about what the real pictures look like.   npm run test:photo
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {serve} from '../serve.mjs';
import {CATALOG} from '../netlify/lib/art.mts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'tests', 'out');
mkdirSync(OUT, {recursive: true});
execFileSync(process.execPath, [join(ROOT, 'build.mjs'), '--test'], {stdio: 'inherit'});
const server = await serve('dist-test', 8767);
const browser = await chromium.launch({
  executablePath: process.env.CHROME || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', ...(process.getuid?.() === 0 ? ['--no-sandbox'] : [])],
});
const fail = [];
const check = (ok, what) => { if (!ok) fail.push(what); console.log((ok ? '  ok   ' : '  FAIL ') + what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- the stand-in server ----
const ALL = Object.keys(CATALOG);
const tagFor = k => 'ab' + [...k].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7).toString(16).padStart(8, '0');
const everything = () => Object.fromEntries(ALL.map(k => [k, tagFor(k)]));
// ready: what exists. dead: pictures whose files will not load. hold: pictures the maker never finishes. nocdn: the resizing
// service is down. slow: how long making takes. broken: the maker takes every request and makes nothing.
const art = {on: true, ready: {}, busy: new Set(), gone: [], posts: [], peak: 0, lists: 0, dead: new Set(), hold: new Set(), nocdn: false, slow: 1200, cdn: 0, raw: 0, broken: false, note: null};
const isPlace = k => CATALOG[k]?.ar === '16:9';
const hue = k => [...k].reduce((a, ch) => (a * 17 + ch.charCodeAt(0)) % 360, 0);
const picture = k => isPlace(k)
  ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue(k)},55%,${/night|fight/.test(k) ? 14 : 62}%)"/><stop offset="1" stop-color="hsl(${(hue(k) + 40) % 360},45%,${/night|fight/.test(k) ? 6 : 34}%)"/></linearGradient></defs><rect width="1200" height="675" fill="url(#g)"/><rect y="470" width="1200" height="205" fill="#0006"/><text x="600" y="350" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="88" fill="#fff">${k}</text></svg>`
  : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" fill="hsl(${hue(k)},40%,30%)"/><circle cx="96" cy="80" r="44" fill="hsl(${hue(k.split('-')[0])},45%,62%)"/><rect x="30" y="132" width="132" height="70" rx="34" fill="hsl(${hue(k.split('-')[0])},45%,45%)"/><text x="96" y="186" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="22" fill="#fff">${k.split('-')[1]}</text></svg>`;
async function mock(page) {
  await page.route(u => u.pathname === '/api/art', r => { art.lists++; r.fulfill({json: {on: art.on, total: ALL.length, ready: art.ready, rest: ALL.filter(k => !art.ready[k]), busy: [...art.busy], gone: art.gone, ...(art.note ? {note: art.note} : {})}}); });
  await page.route(u => u.pathname === '/api/art-make', r => {
    const k = JSON.parse(r.request().postData()).key;
    art.posts.push(k); if (art.broken) return r.fulfill({status: 202, body: ''});
    art.busy.add(k); art.peak = Math.max(art.peak, art.busy.size);
    if (!art.hold.has(k)) setTimeout(() => { art.busy.delete(k); if (ALL.includes(k) && !art.gone.includes(k)) { const from = CATALOG[k].from; if (from && !art.ready[from]) art.ready[from] = tagFor(from); art.ready[k] = tagFor(k); } }, art.slow);
    r.fulfill({status: 202, body: ''});
  });
  await page.route(u => u.pathname === '/.netlify/images', r => {
    const k = new URL(r.request().url()).searchParams.get('url').split('/').pop(); art.cdn++;
    if (art.nocdn || art.dead.has(k) || !art.ready[k]) return r.fulfill({status: 404, body: 'no'});
    r.fulfill({contentType: 'image/svg+xml', body: picture(k)});
  });
  await page.route(u => /^\/api\/art\/[a-f0-9]+\/[a-z0-9-]+$/.test(u.pathname), r => {
    const k = new URL(r.request().url()).pathname.split('/').pop(); art.raw++;
    if (art.dead.has(k) || !art.ready[k]) return r.fulfill({status: 404, body: 'no'});
    r.fulfill({contentType: 'image/svg+xml', body: picture(k)});
  });
}

try {
  const page = await browser.newPage({viewport: {width: 440, height: 956}, deviceScaleFactor: 2, hasTouch: true, isMobile: true});
  page.on('pageerror', e => fail.push('page error: ' + e.message));
  await page.addInitScript(() => { try { localStorage.setItem('shc.adult', '1'); } catch (e) {} });
  await mock(page);
  // what the city is showing
  const view = () => page.evaluate(() => {
    const h = document.getElementById('city'), r = h.shadowRoot, sc = r.querySelector('.scene'), pic = [...sc.querySelectorAll('img.scene-pic')].pop(), b = sc.getBoundingClientRect(), act = r.querySelector('[data-a]');
    const faces = sel => [...r.querySelectorAll(sel)].map(f => { const i = [...f.querySelectorAll('img')].pop(); return i ? i.dataset.art + (i.classList.contains('on') ? '' : ' (not shown)') : 'drawn'; });
    return {scene: pic ? pic.dataset.art : null, shown: !!pic && pic.classList.contains('on') && pic.naturalWidth > 0, src: pic ? pic.getAttribute('src') : '', cls: sc.className + (pic ? ' / ' + pic.className : ''),
      drawn: !!sc.querySelector('svg.scene-art') && !pic, layers: sc.querySelectorAll('#lay > *').length, making: !!sc.querySelector('.making'), ratio: +(b.width / b.height).toFixed(2), tint: (sc.querySelector('.tint') || {}).className || '', shut: !!sc.querySelector('.shuttag'),
      chips: faces('.whohere .fc'), people: faces('.pane-people .fc'), fold: act ? act.getBoundingClientRect().bottom < innerHeight - 70 : null,
      wide: h.scrollWidth > h.clientWidth, modal: r.getElementById('modal').classList.contains('show') ? r.querySelector('#sheet h3').textContent : null};
  });
  const press = text => page.evaluate(t => { const r = document.getElementById('city').shadowRoot, b = [...r.querySelectorAll('button')].find(x => x.textContent.includes(t) && !x.disabled); if (b) b.click(); return !!b; }, text);
  const closeModals = async () => { for (let i = 0; i < 6 && (await view()).modal; i++) await page.evaluate(() => { const b = [...document.getElementById('city').shadowRoot.querySelectorAll('[data-ch]:not([disabled])')]; b[b.length - 1].click(); }); };
  const tabTo = k => page.evaluate(k => document.getElementById('city').shadowRoot.querySelector(`#tabs [data-tab="${k}"]`).click(), k);
  // change the saved game, load it, and wait for the pictures on screen to settle
  const setUp = async (top, pp) => {
    await page.evaluate(([top, pp]) => { const s = JSON.parse(localStorage.getItem('shc')); Object.assign(s, top); for (const k in pp || {}) Object.assign(s.pp[k], pp[k]); if (top.z) s.z = Object.assign(JSON.parse(localStorage.getItem('shc')).z, top.z); if (top.home) s.home = top.home; localStorage.setItem('shc', JSON.stringify(s)); }, [top, pp]);
    await page.reload(); await page.waitForFunction(() => window.__hs && window.CITY); await closeModals(); await sleep(450);
  };
  const met = {met: 1, b: 40, t: 60, seen: 9, mood: 'flat'};

  console.log('A city with no photographs yet');
  await page.goto('http://localhost:8767/');
  await page.waitForFunction(() => window.__hs && window.CITY);
  await closeModals(); await press('Champion'); await closeModals(); await sleep(400);
  let v = await view();
  check(v.drawn && !v.scene && Math.abs(v.ratio - 16 / 9) < .03 && v.making, 'before its photograph exists a place is drawn, in the box the photograph will fill (' + v.ratio + '), with a note that it is coming');
  check(v.fold === true, 'the first thing to do is still on screen without scrolling');
  await page.screenshot({path: join(OUT, 'photo-first.png')});
  await sleep(1000);
  check(art.posts[0] === 'home0-day' && art.posts.length === 2 && art.peak <= 2, 'the place on screen is asked for first, and two pictures at a time: ' + art.posts.join(', '));
  await page.waitForFunction(() => { const i = document.getElementById('city').shadowRoot.querySelector('img.scene-pic'); return i && i.classList.contains('on'); }, null, {timeout: 15000});
  await sleep(900); v = await view();
  check(v.layers === 1, 'the drawing underneath is taken away once the photograph has faded in');
  check(v.scene === 'home0-day' && v.shown && !v.drawn && !v.making && /\/\.netlify\/images\?url=%2Fapi%2Fart%2F[a-f0-9]+%2Fhome0-day&w=1200&h=675&fit=cover&fm=webp/.test(v.src), 'once made it replaces the drawing, fetched through the Image CDN: ' + v.src.slice(0, 70));
  check(art.lists >= 2, 'the city found out by asking the server what exists');
  await sleep(9000);
  const wanted = new Set(art.posts);
  check(art.peak <= 2 && ['home0-night', 'diner-day', 'diner-night', 'lake-day', 'docks-night', 'bar-day', 'rosa-flat', 'vance-flat'].some(k => wanted.has(k)) && ![...wanted].some(k => /-(up|down|cold)$|party|fight|race|boat|home1|home2|home0f/.test(k)), 'then the everyday pictures are asked for quietly, never more than two at once, and none that are not needed yet: ' + art.posts.length + ' so far');
  check(art.posts.length === wanted.size, 'nothing is asked for twice');
  check(await page.evaluate(() => { const m = JSON.parse(localStorage.getItem('shc.art') || '{}'); return !!m['home0-day']; }), 'the list is kept for the next visit');

  console.log('A city with every photograph');
  art.ready = everything(); art.posts = [];
  await setUp({day: 9, h: 9, at: 'diner', en: 80}, {rosa: {...met, mood: 'up'}, kow: {...met, mood: 'down'}});
  v = await view();
  check(v.scene === 'diner-day' && v.shown && !v.tint && !v.shut, 'the diner at nine in the morning: ' + v.scene);
  check(v.chips.join() === 'rosa-up,kow-down', 'the people there have photographs that match their moods: ' + v.chips.join(', '));
  check(v.people.length === 8 && v.people.every(p => p !== 'drawn' && !/not shown/.test(p)), 'every face in People is a photograph: ' + v.people.join(' '));
  check(v.fold === true && !v.wide, 'the first thing to do is on screen, and nothing scrolls sideways');
  await page.screenshot({path: join(OUT, 'photo-here.png')});
  check(art.posts.length === 0, 'with everything made, nothing is asked for');
  await page.evaluate(() => document.getElementById('city').shadowRoot.querySelector('[data-who="rosa"]').click()); await sleep(300);
  check(await page.evaluate(() => { const i = [...document.getElementById('city').shadowRoot.querySelectorAll('#sheet .who .fc img')].pop(); return !!i && i.dataset.art === 'rosa-up' && i.classList.contains('on'); }), 'a conversation shows her photograph');
  await page.screenshot({path: join(OUT, 'photo-talk.png')});
  await closeModals();
  // walking somewhere: the same scene box stays on the page and the new place's picture comes in over the old one
  await page.evaluate(() => { document.getElementById('city').shadowRoot.getElementById('scene').dataset.mark = 'kept'; });
  // (no street event on the way: the city rolls for one with Math.random)
  await page.evaluate(() => { const real = Math.random; Math.random = () => .99; document.getElementById('city').shadowRoot.querySelector('[data-go="court"]').dispatchEvent(new MouseEvent('click', {bubbles: true})); Math.random = real; });
  const mid = await page.evaluate(() => { const r = document.getElementById('city').shadowRoot, sc = r.getElementById('scene'); return {kept: sc.dataset.mark === 'kept', arts: [...sc.querySelectorAll('img.scene-pic')].map(i => i.dataset.art)}; });
  await closeModals(); await sleep(1100); v = await view();
  check(mid.kept && mid.arts.join() === 'diner-day,court-day' && v.scene === 'court-day' && v.shown && v.layers === 1, 'walking to the court, the court\'s picture comes in over the diner\'s and then stands alone: ' + mid.arts.join(' over '));
  await tabTo('people'); await sleep(200); await page.screenshot({path: join(OUT, 'photo-people.png')});
  await tabTo('map'); await sleep(200);
  check(await page.evaluate(() => [...document.getElementById('city').shadowRoot.querySelectorAll('.mapover .fc')].every(f => f.querySelector('img'))), 'the faces on the map are photographs');
  await page.screenshot({path: join(OUT, 'photo-map.png')});
  const at = async (top, pp) => { await setUp({day: 9, en: 80, ...top}, pp); return view(); };
  v = await at({h: 23, at: 'pawn'});
  check(v.scene === 'pawn-night' && v.shut && /shut/.test(v.cls), 'the pawn shop at eleven at night is its night picture, marked closed');
  await page.screenshot({path: join(OUT, 'photo-closed.png')});
  v = await at({h: 19, at: 'lake'}); check(v.scene === 'lake-day' && /dusk/.test(v.tint), 'the lake at seven in the evening is the day picture in dusk light');
  v = await at({h: 6, at: 'court'}); check(v.scene === 'court-day' && /dawn/.test(v.tint), 'the court at six in the morning has dawn light');
  v = await at({h: 12, at: 'bar'}); check(v.scene === 'bar-day' && v.shut, 'the bar at noon is the shut bar');
  v = await at({h: 19, at: 'bar'}); check(v.scene === 'bar-night' && !v.shut && !v.tint, 'the bar once it opens is the bar at night, with no evening tint on a room without windows');
  v = await at({h: 22, at: 'gym'}); check(v.scene === 'gym-fight', 'the gym after nine is fight night');
  v = await at({h: 18, at: 'court', hap: {id: 'party', day: 9}}); check(v.scene === 'court-party' && !v.tint, 'a block party has its own picture');
  v = await at({h: 12, at: 'lake', hap: {id: 'boat', day: 9}}); check(v.scene === 'lake-boat', 'so does the boat show');
  v = await at({h: 21, at: 'docks', hap: null}); check(v.scene === 'docks-night', 'the docks at night');
  v = await at({h: 14, at: 'home'}); check(v.scene === 'home0-day', 'home with nothing in it is the bare studio');
  v = await at({h: 14, at: 'home', home: {bed: 1, tv: 1, fridge: 0, safe: 0}}); check(v.scene === 'home0f-day', 'with a bed and a television it is the furnished studio');
  v = await at({h: 22, at: 'home', z: {pad: 1}}); check(v.scene === 'home1-night', 'the one-bedroom at night');
  v = await at({h: 14, at: 'home', z: {pad: 2}}); check(v.scene === 'home2-day', 'the house on the lake');
  await page.screenshot({path: join(OUT, 'photo-home.png')});
  v = await at({h: 10, at: 'diner', z: {pad: 0}, home: {bed: 0, tv: 0, fridge: 0, safe: 0}}, {rosa: {...met, t: 5}});
  check(v.chips[0] === 'rosa-cold', 'someone who is done with you looks it: ' + v.chips[0]);

  console.log('When a picture is missing or will not load');
  delete art.ready['rosa-up']; delete art.ready['court-night']; art.posts = []; art.hold = new Set(['rosa-up', 'court-night']);
  v = await at({h: 10, at: 'diner'}, {rosa: {...met, mood: 'up'}});
  check(v.chips[0] === 'rosa-flat' && art.posts.includes('rosa-up'), 'a mood not made yet shows her ordinary photograph and asks for the mood');
  v = await at({h: 22, at: 'court'});
  check(v.scene === 'court-day' && /asnight/.test(v.cls) && /night/.test(v.tint) && v.making && art.posts.includes('court-night'), 'a night not made yet shows the day picture darkened, and asks for the night');
  art.hold = new Set(); art.busy.delete('court-night'); art.ready['court-night'] = tagFor('court-night');
  await page.waitForFunction(() => { const i = [...document.getElementById('city').shadowRoot.querySelectorAll('img.scene-pic')].pop(); return i && i.dataset.art === 'court-night' && i.classList.contains('on'); }, null, {timeout: 15000});
  await sleep(900); v = await view();
  check(v.scene === 'court-night' && v.layers === 1 && !/asnight/.test(v.cls) && !v.tint && !v.making, 'and dissolves to the night picture when it arrives, leaving one picture in the box');
  art.ready = everything(); art.busy.clear(); art.dead = new Set(['diner-day', 'kow-flat']);
  v = await at({h: 9, at: 'diner'}, {rosa: {...met, mood: 'flat'}, kow: {...met, mood: 'flat'}});
  await sleep(600); v = await view();
  check(v.drawn && !v.scene && v.chips.join() === 'rosa-flat,drawn', 'pictures that will not load fall back to the drawings, one by one: scene drawn, ' + v.chips.join(', '));
  art.dead = new Set(); art.nocdn = true; art.raw = 0;
  v = await at({h: 10, at: 'diner'}); await sleep(700); v = await view();
  check(v.scene === 'diner-day' && v.shown && art.raw > 0 && /^\/api\/art\/[a-f0-9]+\/diner-day$/.test(v.src), 'with the Image CDN down the picture is shown as it was made: ' + v.src);
  art.nocdn = false;
  art.gone = ['gym-day', 'gym-night', 'gym-fight']; for (const k of art.gone) delete art.ready[k]; art.posts = [];
  v = await at({h: 10, at: 'gym'}); await sleep(6000); v = await view();
  check(v.drawn && !art.posts.some(k => /^gym/.test(k)) && !v.making, 'a picture the server has given up on is left drawn and never asked for');
  art.gone = []; art.ready = {}; art.posts = []; art.broken = true; art.note = {key: 'diner-day', why: 'gateway 400 from gemini-3.1-flash-image: <b>bad</b>', ago: 5};
  v = await at({h: 10, at: 'diner'}); await sleep(26000);
  const tried = art.posts.length;
  check(tried >= 2 && tried <= 4 && (await view()).drawn, 'a maker that takes requests and makes nothing is asked a few times: ' + art.posts.join(', '));
  await sleep(52000);
  check(art.posts.length >= 4 && art.posts.length <= 6, 'and after four tries in a row came to nothing, asking stops for a while (' + art.posts.length + ' asks in 80 seconds)');
  const after = art.posts.length; await sleep(12000);
  check(art.posts.length === after, 'no more asks while it waits');
  await tabTo('you'); await sleep(200);
  check(await page.evaluate(() => { const p = [...document.getElementById('city').shadowRoot.querySelectorAll('.pane-you p.note')].find(x => /didn't come through/.test(x.textContent)); return !!p && /\(gateway 400 from gemini-3\.1-flash-image: <b>bad<\/b>\)/.test(p.textContent) && !p.querySelector('b'); }), 'You says why, with the server\'s words shown as text');
  await tabTo('here');
  art.broken = false; art.note = null; art.ready = everything(); art.posts = [];

  console.log('The player\'s switch');
  v = await at({h: 10, at: 'diner'}, {rosa: met});
  await tabTo('you'); await sleep(150);
  check(await page.evaluate(() => /All 65 photos are made/.test(document.getElementById('city').shadowRoot.querySelector('.pane-you').textContent)), 'You says how many photographs exist');
  await press('See all'); await sleep(500);
  check(await page.evaluate(() => { const r = document.getElementById('city').shadowRoot; return r.querySelectorAll('#sheet .wall figure').length === 65 && [...r.querySelectorAll('#sheet .wall:not(.faces) img')].every(i => i.naturalWidth > 0); }), 'and shows all of them on one sheet');
  await page.screenshot({path: join(OUT, 'photo-wall.png')});
  await closeModals(); art.posts = []; delete art.ready['sal-up'];
  await press('Drawn'); await sleep(300); await tabTo('here'); v = await view();
  check(v.drawn && !v.scene && Math.abs(v.ratio - 400 / 150) < .05 && v.chips.every(c => c === 'drawn') && v.people.every(c => c === 'drawn'), 'Drawn puts the whole city back to drawings, in the old shape');
  check(await page.evaluate(() => localStorage.getItem('shc.photo')) === '0', 'and the choice is kept');
  await setUp({h: 10, at: 'pawn'}, {sal: {...met, mood: 'up'}}); await sleep(5000);
  check(art.posts.length === 0 && (await view()).drawn, 'with drawings chosen nothing is asked for, even after a reload');
  await tabTo('you'); await press('Photos'); await sleep(400); await tabTo('here'); v = await view();
  check(v.scene === 'pawn-day' && v.chips[0] === 'sal-flat', 'Photos brings them back');
  await sleep(1500);
  check(art.posts.includes('sal-up'), 'and asking starts again');
  art.on = false; art.ready = {'diner-day': tagFor('diner-day'), 'rosa-flat': tagFor('rosa-flat')}; art.posts = [];
  v = await at({h: 9, at: 'diner'}, {rosa: met, kow: met}); await sleep(5000); v = await view();
  check(v.scene === 'diner-day' && v.chips.join() === 'rosa-flat,drawn' && art.posts.length === 0, 'with making switched off, what exists is shown and nothing is asked for');
  art.on = true; art.ready = {}; art.posts = []; art.slow = 150;
  v = await at({h: 10, at: 'diner'}, {rosa: met, kow: met}); await tabTo('you'); await sleep(300);
  check(await press('Make the rest now'), 'You offers to make every photograph now');
  await page.waitForFunction(() => /All 65 photos are made/.test(document.getElementById('city').shadowRoot.querySelector('.pane-you').textContent), null, {timeout: 240000});
  check(Object.keys(art.ready).length === 65 && art.peak <= 2 && new Set(art.posts).size === art.posts.length, 'and it makes all 65, two at a time, each asked for once (' + art.posts.length + ' asks)');
  art.slow = 1200; art.ready = everything();

  console.log('A smaller phone');
  await page.setViewportSize({width: 390, height: 780});
  v = await at({h: 10, at: 'diner'}, {rosa: {...met, mood: 'up'}, kow: met});
  check(v.scene === 'diner-day' && !v.wide && v.fold === true, 'at 390 by 780 the photograph fits, nothing scrolls sideways, and the first thing to do is on screen');
  await page.screenshot({path: join(OUT, 'photo-390.png')});

  console.log('The offline cache');
  // sw.js run with stand-ins for the browser's caches and network: two pictures share the Image CDN's path and must not be mixed up
  const store = new Map(), hits = [];
  const cache = {match: async q => store.get(q.url), put: async (q, r) => { store.set(q.url, r); }};
  const self2 = {listeners: {}, addEventListener(n, f) { this.listeners[n] = f; }, skipWaiting() {}, clients: {claim() {}}};
  const caches2 = {open: async () => cache, match: async () => undefined, keys: async () => [], delete: async () => true};
  const fetch2 = async q => { hits.push(q.url); return {ok: !/missing/.test(q.url), url: q.url, clone() { return this; }}; };
  new Function('self', 'caches', 'fetch', 'location', readFileSync(join(ROOT, 'dist-test', 'sw.js'), 'utf8'))(self2, caches2, fetch2, {origin: 'https://x.test'});
  const get = async url => { let out = 'untouched'; self2.listeners.fetch({request: {method: 'GET', url}, respondWith(p) { out = p; }}); return out === 'untouched' ? out : (await out).url; };
  const A = 'https://x.test/.netlify/images?url=%2Fapi%2Fart%2Fab12%2Fdiner-day&w=1200', B = 'https://x.test/.netlify/images?url=%2Fapi%2Fart%2Fcd34%2Frosa-up&w=192';
  const got = [await get(A), await get(B), await get(A), await get(B)];
  check(got[0] === A && got[1] === B && got[2] === A && got[3] === B && hits.length === 2, 'two pictures at the same path are kept apart, and the second look comes from the cache');
  check(await get('https://x.test/api/art') === 'untouched' && await get('https://x.test/api/art/ab12/diner-day') !== 'untouched', 'the list of pictures is never cached; a picture itself is');
  await get('https://x.test/.netlify/images?url=missing'); await get('https://x.test/.netlify/images?url=missing');
  check(hits.filter(h => /missing/.test(h)).length === 2, 'a picture that failed to load is not kept');
} finally {
  await browser.close();
  server.close();
}
if (fail.length) { console.error('FAILED\n- ' + fail.join('\n- ')); process.exit(1); }
console.log('OK. Screenshots in tests/out/');
