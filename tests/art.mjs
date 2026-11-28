// Checks the city's photographs on the server side (netlify/lib/art.mts) without Netlify or the network: the list of pictures
// and what their prompts must and must not say, that each picture is made once and kept, that an edited picture waits for the
// one it is made from, that a lock stops two makers, that failures stop being retried, and the call to the image model.
//   npm run test:art
import {CATALOG, MOODS, tagOf, make, makeAll, manifest, fetchImg, gemini, enabled, GenError} from '../netlify/lib/art.mts';
const fail = [];
const check = (ok, what) => { if (!ok) fail.push(what); console.log((ok ? '  ok   ' : '  FAIL ') + what); };

// A stand-in for a Netlify Blobs store, with the two conditional writes the lock depends on.
class Store {
  m = new Map(); n = 0;
  put(k, data, o = {}) {
    const cur = this.m.get(k);
    if (o.onlyIfNew && cur) return {modified: false};
    if (o.onlyIfMatch !== undefined && (!cur || cur.etag !== o.onlyIfMatch)) return {modified: false};
    const etag = 'e' + ++this.n;
    this.m.set(k, {data, metadata: o.metadata || {}, etag});
    return {modified: true, etag};
  }
  async set(k, d, o) { return this.put(k, d, o); }
  async setJSON(k, d, o) { return this.put(k, JSON.stringify(d), o); }
  async get(k, o = {}) { const c = this.m.get(k); return !c ? null : o.type === 'json' ? JSON.parse(c.data) : c.data; }
  async getMetadata(k) { const c = this.m.get(k); return c ? {etag: c.etag, metadata: c.metadata} : null; }
  async getWithMetadata(k, o = {}) {
    const c = this.m.get(k); if (!c) return null;
    const data = o.type === 'json' ? JSON.parse(c.data) : o.type === 'arrayBuffer' ? c.data.buffer.slice(c.data.byteOffset, c.data.byteOffset + c.data.byteLength) : o.type === 'stream' ? new Blob([c.data]).stream() : c.data;
    return {data, etag: c.etag, metadata: c.metadata};
  }
  async delete(k) { this.m.delete(k); }
  async list({prefix = ''} = {}) { return {blobs: [...this.m.keys()].filter(k => k.startsWith(prefix)).map(key => ({key, etag: this.m.get(key).etag})), directories: []}; }
}
const bytes = s => new TextEncoder().encode(s.padEnd(3000, '.'));
// A stand-in for the image model: remembers what it was asked and answers with bytes that name the prompt.
const model = (how = {}) => {
  const g = async (spec, base) => {
    g.calls.push({spec, base});
    if (how.slow) await new Promise(r => setTimeout(r, how.slow));
    if (how.err) throw how.err;
    return {type: 'image/png', data: bytes('PIC ' + spec.p.slice(0, 40)), model: 'fake'};
  };
  g.calls = [];
  return g;
};

console.log('The list');
const keys = Object.keys(CATALOG), places = keys.filter(k => CATALOG[k].ar === '16:9'), faces = keys.filter(k => CATALOG[k].ar === '1:1');
check(keys.length === 65 && places.length === 28 && faces.length === 37, `65 pictures: ${places.length} of places, ${faces.length} of people`);
check(['home0', 'home0f', 'home1', 'home2', 'diner', 'court', 'bar', 'pawn', 'garage', 'docks', 'gym', 'lake'].every(p => CATALOG[p + '-day'] && CATALOG[p + '-night']), 'every place, and every home, by day and by night');
check(['rosa', 'nia', 'dex', 'marcus', 'sal', 'june', 'tommy', 'kow'].every(p => ['flat', ...Object.keys(MOODS)].every(m => CATALOG[p + '-' + m])), 'each of the eight has a picture for every mood');
check(keys.every(k => !CATALOG[k].from || CATALOG[CATALOG[k].from]) && keys.every(k => /^[a-f0-9]{10}$/.test(tagOf(k))), 'every edited picture names one that exists, and every picture has a tag');
check(new Set(keys.map(tagOf)).size > 40 && tagOf('diner-night') !== tagOf('diner-day') && tagOf('rosa-up') !== tagOf('nia-up'), 'tags differ between pictures, and an edit of one person is not an edit of another');
check(keys.every(k => /^[a-z0-9-]{3,24}$/.test(k)), 'names are safe to put in an address');
// what the prompts must and must not say
const real = /vanjae|vaylon|ramgeet|garrett|loftin|mclean|macclugage|dustin|charrier|deven|tory\b|andre\b|\bgj\b/i;
const brand = /yamaha|sea-?doo|kawasaki|monster|red bull|nike|adidas|coca|pepsi|ford\b|chevy|toyota|honda/i;
const lewd = /nude|naked|lingerie|bikini|sexy|seductive|cleavage|topless|underwear/i;
check(keys.every(k => !real.test(CATALOG[k].p)), 'no racer from the real roster is in any prompt');
check(keys.every(k => !brand.test(CATALOG[k].p) && /logos/.test(CATALOG[k].p) && /watermark/.test(CATALOG[k].p)), 'no brand is named, and every prompt rules out logos and watermarks');
check(keys.every(k => !lewd.test(CATALOG[k].p)), 'nothing sexual is asked for');
const firsts = faces.filter(k => /-flat$/.test(k));
check(firsts.every(k => { const a = /\bof (\d\d)\b/.exec(CATALOG[k].p); return a && +a[1] >= 25 && /invented adult/.test(CATALOG[k].p) && /Not a real person/.test(CATALOG[k].p); }), 'every person is an invented adult with a stated age of 25 or more');
check(faces.filter(k => CATALOG[k].from).every(k => /same invented person/.test(CATALOG[k].p) && /Change only the expression/.test(CATALOG[k].p) && CATALOG[k].from === k.split('-')[0] + '-flat'), 'a mood is an edit of the same person that changes only the expression');
check(places.every(k => /nobody recognizable/.test(CATALOG[k].p)), 'no place shows a recognizable person');

console.log('Making and keeping');
let st = new Store(), g = model(), r;
r = await make('diner-day', {store: st, gen: g, on: false});
check(r.status === 503 && r.body.error === 'off' && !g.calls.length, 'switched off: nothing is made');
for (const bad of ['nope', 'constructor', '__proto__', '', '../img', undefined]) { r = await make(bad, {store: st, gen: g, on: true}); if (r.status !== 400) fail.push('made something for ' + bad); }
check(!g.calls.length && !st.m.size, 'a picture not on the list is refused');
r = await make('diner-day', {store: st, gen: g, on: true});
check(r.status === 200 && r.body.ok && r.body.made && r.body.tag === tagOf('diner-day') && g.calls.length === 1 && !g.calls[0].base && st.m.has('img/diner-day.' + tagOf('diner-day')) && ![...st.m.keys()].some(k => k.startsWith('lock/')), 'a picture is made once, kept, and its lock let go');
r = await make('diner-day', {store: st, gen: g, on: true});
const r2 = await make('diner-day', {store: st, gen: g, on: false});
check(r.body.ok && !r.body.made && r2.body.ok && g.calls.length === 1, 'asked again, it is already there: no second call to the model, even switched off');
r = await make('diner-night', {store: st, gen: g, on: true});
check(r.body.ok && r.body.made && g.calls.length === 2 && g.calls[1].base && new TextDecoder().decode(g.calls[1].base.data).startsWith('PIC A photorealistic'), 'the night picture is an edit of the day picture, which is sent with the prompt');
r = await make('rosa-up', {store: st, gen: g, on: true});
check(!r.body.ok && r.body.again && r.body.key === 'rosa-flat' && r.body.tag === tagOf('rosa-flat') && g.calls.length === 3, 'a mood asked for first makes the ordinary face and says ask again');
r = await make('rosa-up', {store: st, gen: g, on: true});
check(r.body.ok && r.body.key === 'rosa-up' && g.calls.length === 4 && g.calls[3].base, 'asked again, the mood is made from that face');
const before = g.calls.length;
r = await makeAll('home0f-night', {store: st, gen: g, on: true});
check(r.body.ok && r.body.key === 'home0f-night' && g.calls.length === before + 3 && ['home0-day', 'home0f-day', 'home0f-night'].every(k => st.m.has('img/' + k + '.' + tagOf(k))), 'a picture two edits deep is made in one go, with both pictures under it');

console.log('One maker at a time');
st = new Store(); g = model({slow: 30});
const both = await Promise.all([make('court-day', {store: st, gen: g, on: true}), make('court-day', {store: st, gen: g, on: true})]);
check(g.calls.length === 1 && both.filter(x => x.body.ok).length === 1 && both.filter(x => x.body.wait).length === 1, 'two asks at once: one makes it, the other is told to wait');
st = new Store(); g = model();
const now = 1e12, lock = 'lock/lake-day.' + tagOf('lake-day');
await st.setJSON(lock, {t: now - 10_000});
r = await make('lake-day', {store: st, gen: g, on: true, now});
check(r.body.wait && !g.calls.length, 'a lock ten seconds old is respected');
let mf = await manifest(st, true, now);
check(mf.busy.join() === 'lake-night,lake-race,lake-boat,lake-day'.split(',').sort((a, b) => Object.keys(CATALOG).indexOf(a) - Object.keys(CATALOG).indexOf(b)).join() && !mf.gone.length, 'while it is being made, it and everything edited from it are reported busy: ' + mf.busy.join(', '));
r = await make('lake-day', {store: st, gen: g, on: true, now: now + 100_000});
check(r.body.wait && !g.calls.length, 'a lock is still respected after 100 seconds, which a slow picture can take');
r = await make('lake-day', {store: st, gen: g, on: true, now: now + 200_000});
check(r.body.ok && g.calls.length === 1 && !st.m.has(lock), 'a lock left behind by a crash is taken over once it is older than any picture takes');

console.log('When it goes wrong');
st = new Store(); g = model({err: new GenError('no picture came back: SAFETY')});
const tries = []; for (let i = 0; i < 5; i++) { r = await make('bar-night', {store: st, gen: g, on: true, now: now + i}); tries.push(r.status + (r.body.error || (r.body.wait ? 'wait' : ''))); }
check(tries.join(' ') === '200wait 200wait 410gone 410gone 410gone' && g.calls.length === 3 && ![...st.m.keys()].some(k => k.startsWith('lock/')), 'three failures and the picture is left alone: ' + tries.join(', '));
r = await make('bar-day', {store: st, gen: g, on: true, now: now + 9});
check(r.status === 410 && g.calls.length === 3, 'a picture edited from one that has failed is given up on too');
mf = await manifest(st, true, now + 10);
check(mf.gone.join() === 'bar-night,bar-day' && !mf.busy.length && !mf.ready['bar-night'], 'the list reports it, and what is edited from it, as given up on');
r = await make('bar-night', {store: st, gen: model(), on: true, now: now + 8 * 864e5});
check(r.body.ok, 'after a week it is tried again');
st = new Store(); g = model({err: new GenError('the gateway is rate-limited', true, 60)});
for (let i = 0; i < 5; i++) r = await make('gym-day', {store: st, gen: g, on: true, now: now + i});
check(r.status === 200 && r.body.wait === 60 && g.calls.length === 5 && ![...st.m.keys()].some(k => k.startsWith('fail/')), 'a busy gateway is not counted against the picture');

console.log('Serving');
st = new Store(); g = model();
await make('diner-day', {store: st, gen: g, on: true}); await make('nia-flat', {store: st, gen: g, on: true});
await st.set('img/diner-day.0000000000', bytes('old'), {}); await st.set('img/junk', bytes('x'), {}); await st.set('img/constructor.abc', bytes('x'), {});
const m = await manifest(st, true);
check(m.on === true && m.total === 65 && Object.keys(m.ready).sort().join() === 'diner-day,nia-flat' && m.ready['diner-day'] === tagOf('diner-day') && !m.busy.length && !m.gone.length, 'the list of what exists holds only pictures with their current tag');
const hit = await fetchImg(st, tagOf('nia-flat'), 'nia-flat');
check(hit && hit.type === 'image/png' && (await new Response(hit.data).text()).startsWith('PIC A photorealistic head'), 'a picture is served with its type');
check(await fetchImg(st, '0000000000', 'diner-day') === null && await fetchImg(st, tagOf('rosa-flat'), 'rosa-flat') === null && await fetchImg(st, 'abc', 'constructor') === null, 'an old tag, a picture not made yet and a made-up name all get nothing');

console.log('The call to the image model');
const env = o => k => o[k];
const E = {GOOGLE_GEMINI_BASE_URL: 'https://gw.example/gemini', GEMINI_API_KEY: 'k'};
check(enabled(env(E)) && !enabled(env({...E, HS_ART: 'off'})) && !enabled(env({...E, HS_ART: 'OFF'})) && !enabled(env({GEMINI_API_KEY: 'k'})) && !enabled(env({})), 'making needs the gateway, and HS_ART=off stops it');
const png = Buffer.from(bytes('IMAGE')).toString('base64');
const good = parts => new Response(JSON.stringify({candidates: [{content: {parts}}]}), {status: 200});
const net = answers => { const f = async (url, init) => { f.calls.push({url, init, body: JSON.parse(init.body)}); const a = answers[Math.min(f.calls.length - 1, answers.length - 1)]; return typeof a === 'function' ? a() : a; }; f.calls = []; return f; };
let f = net([() => good([{thought: true, inlineData: {mimeType: 'image/png', data: Buffer.from(bytes('SKETCH')).toString('base64')}}, {text: 'here'}, {inlineData: {mimeType: 'image/jpeg', data: png}}])]);
let img = await gemini(env(E), f)(CATALOG['diner-day']);
let c = f.calls[0];
check((await (async () => { const f2 = net([() => good([{inlineData: {mimeType: 'image/png', data: png}}])]); await gemini(env({...E, GOOGLE_GEMINI_BASE_URL: 'https://gw.example/gemini/'}), f2)(CATALOG['diner-day']); return f2.calls[0].url; })()) === c.url, 'a gateway address that ends in a slash gives the same request');
check(c.url === 'https://gw.example/gemini/v1beta/models/gemini-3.1-flash-image:generateContent' && c.init.headers['x-goog-api-key'] === 'k' && c.init.method === 'POST', 'it asks the gateway, with the gateway\'s key, for the first model on the list');
check(c.body.generationConfig.responseModalities.join() === 'IMAGE' && c.body.generationConfig.imageConfig.aspectRatio === '16:9' && c.body.contents[0].parts.length === 1 && c.body.contents[0].parts[0].text === CATALOG['diner-day'].p, 'a wide picture, pictures only, and the prompt as written');
check(img.type === 'image/jpeg' && new TextDecoder().decode(img.data).startsWith('IMAGE') && img.model === 'gemini-3.1-flash-image', 'the picture is the last part that is not a sketch');
f = net([() => good([{inlineData: {mimeType: 'image/png', data: png}}])]);
await gemini(env(E), f)(CATALOG['rosa-up'], {type: 'image/png', data: bytes('BASE')});
c = f.calls[0].body.contents[0].parts;
check(c.length === 2 && c[0].inlineData.mimeType === 'image/png' && Buffer.from(c[0].inlineData.data, 'base64').toString().startsWith('BASE') && /Change only the expression/.test(c[1].text) && f.calls[0].body.generationConfig.imageConfig.aspectRatio === '1:1', 'an edit sends the first picture ahead of the words, square');
f = net([() => new Response('{"error":{"message":"model not found"}}', {status: 404}), () => good([{inlineData: {mimeType: 'image/png', data: png}}])]);
let gen = gemini(env(E), f);
img = await gen(CATALOG['diner-day']); await gen(CATALOG['court-day']);
check(img.model === 'gemini-2.5-flash-image' && f.calls.length === 3 && /gemini-2\.5-flash-image/.test(f.calls[2].url), 'a model the gateway does not have is skipped, and stays skipped');
f = net([() => good([{inlineData: {mimeType: 'image/png', data: png}}])]);
await gemini(env({...E, HS_ART_MODEL: 'gemini-3-pro-image'}), f)(CATALOG['diner-day']);
check(/models\/gemini-3-pro-image:/.test(f.calls[0].url), 'HS_ART_MODEL goes first');
f = net([() => new Response('{"error":{"message":"unknown field imageConfig"}}', {status: 400}), () => good([{inlineData: {mimeType: 'image/png', data: png}}])]);
img = await gemini(env(E), f)(CATALOG['diner-day']);
check(f.calls.length === 2 && !f.calls[1].body.generationConfig.imageConfig && f.calls[1].body.generationConfig.responseModalities.join() === 'TEXT,IMAGE' && img.model === 'gemini-3.1-flash-image', 'a model that refuses the shape setting is asked again in the plainest form');
const threw = async (answers, spec = CATALOG['diner-day']) => { try { await gemini(env(E), net(answers))(spec); return null; } catch (e) { return e; } };
let e = await threw([() => new Response('slow down', {status: 429})]);
check(e instanceof GenError && e.soft && e.wait === 60, 'a rate limit is a soft failure');
e = await threw([() => new Response(JSON.stringify({promptFeedback: {blockReason: 'SAFETY'}}), {status: 200})]);
check(e instanceof GenError && !e.soft && /SAFETY/.test(e.message), 'a refused prompt is a hard failure that says why');
e = await threw([() => good([{text: 'I cannot draw that'}])]);
check(e instanceof GenError && !e.soft, 'an answer with no picture in it is a hard failure');
e = await threw([() => { throw Object.assign(new Error('timed out'), {name: 'TimeoutError'}); }]);
check(e instanceof GenError && e.soft, 'no answer at all is a soft failure');

console.log('The functions');
const a = await import('../netlify/functions/art.mts'), b = await import('../netlify/functions/artmake.mts');
check(a.config.path.join() === '/api/art,/api/art/:tag/:key' && a.config.method === 'GET' && typeof a.default === 'function', 'art.mts answers GET /api/art and /api/art/<tag>/<picture>');
check(b.config.path === '/api/art-make' && b.config.method === 'POST' && b.config.background === true && b.config.rateLimit.windowLimit <= 60 && typeof b.default === 'function', 'artmake.mts answers POST /api/art-make in the background, with a limit per visitor');
st = new Store(); g = model();
const post = (body, headers = {}) => b.ask(new Request('https://x.test/api/art-make', {method: 'POST', headers, body}), {store: () => st, gen: () => g, on: true});
const said = [await post('{"key":"diner-day"}', {origin: 'https://evil.test'}), await post('x'.repeat(500)), await post('{"key":5}'), await post('not json'), await post('{"key":"nope"}')];
check(said.join() === 'forbidden,too long,bad json,bad json,unknown picture' && !g.calls.length && !st.m.size, 'another site, a long body, a body that is not a name and a name not on the list all make nothing: ' + said.join(', '));
const made = [await post('{"key":"june-cold"}', {origin: 'https://x.test'}), await post('{"key":"june-cold"}')];
check(made.join() === 'made,there' && g.calls.length === 2 && st.m.has('img/june-cold.' + tagOf('june-cold')) && st.m.has('img/june-flat.' + tagOf('june-flat')), 'one ask from the site itself makes the face and then the mood; a second ask finds it there');
let threwOut = false; try { await b.default(new Request('https://x.test/api/art-make', {method: 'POST', body: '{"key":"diner-day"}'})); } catch (err) { threwOut = true; }
check(!threwOut, 'the function itself never throws, so Netlify has no reason to run it twice');

if (fail.length) { console.log('FAILED\n' + fail.join('\n')); process.exit(1); }
console.log('OK');
