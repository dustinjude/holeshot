// Plays Side Hustle City and its way into the racing in a phone-sized headless Chrome: the city on load and its five tabs,
// free play and back, the garage, an open race, a drag run against Marcus, a whole race weekend, a retirement, a missed
// weekend, a run from the law, talking in your own words, the phone, the hustles, and the morning recap.
// Time is driven with the test hooks, so it does not depend on the frame rate. Screenshots go to tests/out/.
//   npm install && npx playwright install chromium   (once)        npm run test:city
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {serve} from '../serve.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'tests', 'out');
mkdirSync(OUT, {recursive: true});
execFileSync(process.execPath, [join(ROOT, 'build.mjs'), '--test'], {stdio: 'inherit'});
const server = await serve('dist-test', 8766);
const browser = await chromium.launch({
  executablePath: process.env.CHROME || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', ...(process.getuid?.() === 0 ? ['--no-sandbox'] : [])],
});
const fail = [];
const check = (ok, what) => { if (!ok) fail.push(what); console.log((ok ? '  ok   ' : '  FAIL ') + what); };
try {
  const page = await browser.newPage({viewport: {width: 440, height: 956}, deviceScaleFactor: 2, hasTouch: true, isMobile: true});
  page.on('pageerror', e => fail.push('page error: ' + e.message));
  const hs = () => page.evaluate(() => window.__hs.state());
  // what the city shows: its clock, cash, open dialog, the actions on offer, the newest log lines
  const city = () => page.evaluate(() => {
    const h = document.getElementById('city'), r = h.shadowRoot, m = r.getElementById('modal');
    return {hidden: h.hidden, clock: r.getElementById('clock').textContent, cash: r.getElementById('cash').textContent,
      modal: m.classList.contains('show') ? r.querySelector('#sheet h3').textContent + ': ' + r.querySelector('#sheet .body').textContent : null,
      acts: [...r.querySelectorAll('[data-a]')].map(b => b.textContent + (b.disabled ? ' (x)' : '')),
      log: [...r.querySelectorAll('#log p')].slice(0, 6).map(p => p.textContent), wide: h.scrollWidth > h.clientWidth};
  });
  // press a city button by part of its text, or a place on the map by its key
  const press = text => page.evaluate(t => {
    const r = document.getElementById('city').shadowRoot;
    const b = [...r.querySelectorAll('button')].find(x => x.textContent.includes(t) && !x.disabled);
    if (b) b.click(); return !!b;
  }, text);
  const closeModals = async () => { for (let i = 0; i < 6 && (await city()).modal; i++) await page.evaluate(() => { const b = [...document.getElementById('city').shadowRoot.querySelectorAll('[data-ch]:not([disabled])')]; b[b.length - 1].click(); }); };
  // talk to whoever is here, by tapping their face
  const who = k => page.evaluate(k => { const b = document.getElementById('city').shadowRoot.querySelector(`[data-who="${k}"]`); if (b) b.click(); return !!b; }, k);
  const tabTo = k => page.evaluate(k => document.getElementById('city').shadowRoot.querySelector(`#tabs [data-tab="${k}"]`).click(), k);
  const goTo = async key => { await page.evaluate(k => document.getElementById('city').shadowRoot.querySelector(`[data-go="${k}"]`).dispatchEvent(new MouseEvent('click', {bubbles: true})), key); await closeModals(); };
  const save = patch => page.evaluate(p => { const s = JSON.parse(localStorage.getItem('shc')); Object.assign(s, p); localStorage.setItem('shc', JSON.stringify(s)); }, patch);
  const run = sec => page.evaluate(s => window.__hs.run(s), sec);
  // start whatever the pits are set for and let the ski ride itself to the result
  const race = async () => {
    await page.click('#go'); await run(4); await page.evaluate(() => window.__hs.auto());
    for (let i = 0; i < 400 && (await hs()).mode !== 'done'; i++) await run(1);
    await run(6);
  };
  const again = () => page.evaluate(() => { const b = document.getElementById('again'); const t = b.textContent; b.click(); return t; });

  await page.goto('http://localhost:8766/');
  await page.waitForFunction(() => window.__hs && window.CITY);
  console.log('The app opens in the city');
  let s = await hs(), c = await city();
  check(s.city && s.cityOn && !c.hidden, 'city is on screen and the race is idle');
  check(/Adults only/.test(c.modal || ''), 'it asks for 18 or older first');
  await press('Just the racing'); s = await hs();
  check(!s.city && (await city()).hidden, 'saying no leaves the racing, with the city put away');
  await page.click('#toCity'); c = await city();
  check(!c.hidden && /Adults only/.test(c.modal || ''), 'coming back asks again');
  await press("I'm 18 or older"); c = await city();
  check(/Day 1/.test(c.modal || ''), 'then the first-day note shows');
  check(c.cash === '$200', 'a new life starts with $200');
  await press("Let's go");
  await page.screenshot({path: join(OUT, 'city.png')});
  check(await page.evaluate(() => { const r = document.getElementById('city').shadowRoot, b = r.querySelector('[data-a]').getBoundingClientRect(); return b.bottom < innerHeight - 70; }), 'the first thing to do is on screen without scrolling');
  for (const k of ['map', 'hustle', 'people', 'you']) {
    await tabTo(k);
    check(await page.evaluate(k => { const r = document.getElementById('city').shadowRoot, v = e => !!e && e.offsetParent !== null; return v(r.querySelector('.pane-' + k)) && !v(r.querySelector('.pane-here')) && v(r.getElementById('clock')); }, k), 'the ' + k + ' tab shows its panel under the top bar');
    await page.screenshot({path: join(OUT, 'city-' + k + '.png')});
  }
  await tabTo('here');
  check(!(await city()).wide, 'the city does not scroll sideways at 440 wide');

  console.log('Free play and back');
  await press('Free play'); s = await hs();
  check(!s.city && !s.cityOn && s.cash === 3500 && s.tour === 0, 'free play has its own garage money and tour');
  check(await page.isVisible('#modes') && await page.isVisible('#go'), 'free play shows the mode tabs and a start button');
  await page.screenshot({path: join(OUT, 'free-play.png')});
  await page.click('#toCity'); s = await hs();
  check(s.city && s.cityOn && !(await city()).hidden, 'back in the city');

  console.log("Tommy's Garage");
  await goTo('garage'); c = await city(); await press('Work on your ski'); s = await hs();
  // the walk there can turn up a street event that changes the money, so compare with what the city shows
  check(s.kind === 'garage' && !s.cityOn && '$' + s.cash.toLocaleString('en-US') === c.cash, 'the garage opens on the city wallet: ' + c.cash);
  check(!(await page.isVisible('#go')) && !(await page.isVisible('#modes')), 'no start button and no mode tabs in the garage');
  check(await page.evaluate(() => /Tommy/.test(document.getElementById('startEyebrow').textContent) && !document.getElementById('garage').hidden), 'the plate is on the Garage tab');
  await page.screenshot({path: join(OUT, 'garage.png')});
  await page.click('#toCity'); c = await city();
  check(/Day 1 · 10am/.test(c.clock), 'an hour at the garage: ' + c.clock);

  console.log('Open race');
  await goTo('lake'); c = await city();
  check(c.acts.some(a => /Next round: day 5/.test(a)) && c.acts.some(a => /Line up against Marcus/.test(a)), 'the Lake lists the next round and Marcus: ' + c.acts.join(' | '));
  await press('Run the open race'); s = await hs();
  check(s.kind === 'open' && s.gmode === 'single' && !(await page.isVisible('#modes')), 'open race pits');
  await race(); s = await hs();
  check(s.mode === 'done', 'the race finished');
  await page.screenshot({path: join(OUT, 'open-result.png')});
  check(await again() === 'Back to the city', 'the result leads back to the city');
  c = await city();
  check(/Open race at/.test(c.modal || '') && /Day 1 · 3pm/.test(c.clock), 'the city has the result and four hours have gone: ' + c.clock + ' ' + c.cash);
  await closeModals();

  console.log('Drag run against Marcus');
  await save({en: 90}); await page.reload(); await page.waitForFunction(() => window.__hs && window.CITY);
  await press('Line up against Marcus'); c = await city();
  check(/drag strip/i.test(c.modal || ''), 'Marcus is waiting at the strip');
  await press('Run him for nothing'); s = await hs();
  check(s.kind === 'drag' && s.gmode === 'drag', 'drag pits');
  check(await page.evaluate(() => document.getElementById('go').textContent) === 'Line up against Marcus', 'the start button names Marcus');
  await page.click('#go'); await run(1);
  check(await page.evaluate(() => /Marcus/.test(document.getElementById('banT').textContent)), 'the other lane is Marcus');
  for (let i = 0; i < 60 && (await hs()).mode !== 'done'; i++) await run(1);
  await run(3); await page.screenshot({path: join(OUT, 'drag-result.png')});
  check(await again() === 'Back to the city', 'the run leads back to the city');
  c = await city();
  check(/You lose|You win/.test(c.modal || ''), 'the city has the run: ' + (c.modal || '').slice(0, 60));
  await closeModals();

  console.log('A race weekend');
  await save({day: 5, h: 10, en: 95, at: 'lake'}); await page.reload(); await page.waitForFunction(() => window.__hs && window.CITY);
  await closeModals(); c = await city();
  check(c.acts.some(a => /Race round 1 of 9/.test(a)), 'race day offers round 1: ' + c.acts[0]);
  await press('Race round 1'); s = await hs();
  check(s.kind === 'tour' && s.gmode === 'tour' && s.tour === 0, 'weekend pits');
  await race();
  check(await again() === 'Weekend standings', 'moto 1 leads to the weekend standings');
  check(await again() === 'Start moto 2', 'then to moto 2');
  await run(4); await page.evaluate(() => window.__hs.auto());
  for (let i = 0; i < 400 && (await hs()).mode !== 'done'; i++) await run(1);
  await run(6);
  check(await again() === 'Weekend overall', 'moto 2 leads to the weekend overall');
  check(await again() === 'Award ceremony', 'then the award ceremony');
  await run(2); await page.screenshot({path: join(OUT, 'ceremony.png')});
  await page.click('#cerGo');
  check(await again() === 'Back to the city', 'the standings lead back to the city');
  s = await hs(); c = await city();
  check(s.tour === 2 && s.cityOn, 'two motos are booked');
  check(/Round 1 of 9/.test(c.modal || '') && /Day 5 · 4pm/.test(c.clock), 'the city has the weekend and six hours have gone: ' + c.clock);
  console.log('    ' + c.modal);
  await closeModals();

  console.log('Retiring from a weekend');
  await save({day: 10, h: 10, en: 95, at: 'lake'}); await page.reload(); await page.waitForFunction(() => window.__hs && window.CITY);
  await closeModals(); await press('Race round 2'); await page.click('#go'); await run(6);
  await page.click('#pauseBtn');
  check(!(await page.isVisible('#restart')), 'no restart in the city');
  check(await page.evaluate(() => { const b = document.getElementById('toSetup'), t = b.textContent; b.click(); return t; }) === 'Retire: counts as a DNF', 'the way out is to retire');
  s = await hs(); c = await city();
  check(s.tour === 4 && /retired from round 2/.test(c.modal || ''), 'retiring ends the weekend: ' + (c.modal || '').slice(0, 70));
  await closeModals();

  console.log('Missing a weekend');
  await save({day: 15, h: 22, en: 60, at: 'home'}); await page.reload(); await page.waitForFunction(() => window.__hs && window.CITY);
  await closeModals(); await press('Sleep'); await closeModals();
  s = await hs(); c = await city();
  check(s.tour === 6 && c.log.some(l => /missed round 3/.test(l)), 'a missed weekend is scored without you');

  console.log('Free play is untouched');
  await press('Free play'); s = await hs();
  check(!s.city && s.tour === 0 && s.cash === 3500, 'free play still has $3,500 and a fresh tour');
  await page.click('#modeT'); s = await hs();
  check(s.gmode === 'tour' && s.tour === 0, 'the free tour is its own');
  await page.click('#modeS'); await race(); s = await hs();
  check(s.mode === 'done' && s.cash > 3500 && await page.evaluate(() => document.getElementById('again').textContent) === 'Race again', 'a free race pays into the free garage and offers another');
  await page.evaluate(() => document.getElementById('swap').click());
  check(await page.isVisible('#start') && await page.isVisible('#restart') === false, 'back at the free play setup');
  await page.click('#toCity'); c = await city();
  check((await hs()).city && !c.hidden, 'and back in the city, with its own money: ' + c.cash);

  console.log('A run from the law');
  const setUp = patch => page.evaluate(p => { const s = JSON.parse(localStorage.getItem('shc')); Object.assign(s, p.top); for (const k in p.pp || {}) Object.assign(s.pp[k], p.pp[k]); localStorage.setItem('shc', JSON.stringify(s)); }, patch);
  const fresh = async () => { await page.reload(); await page.waitForFunction(() => window.__hs && window.CITY); await closeModals(); };
  await setUp({top: {day: 18, h: 20, en: 80, at: 'bar', heat: 45, over: 0}, pp: {dex: {met: 1, b: 40, t: 55, seen: 18}}}); await fresh();
  check(await page.evaluate(() => !!document.getElementById('city').shadowRoot.querySelector('[data-who="dex"]')) && !(await page.evaluate(() => !!document.getElementById('city').shadowRoot.querySelector('[data-who="rosa"]'))), 'at the Low End at 8pm Dex is in the booth and Rosa is not');
  await who('dex'); c = await city();
  check(/Run a package/.test(await page.evaluate(() => document.getElementById('city').shadowRoot.getElementById('sheet').textContent)), 'Dex has a package to move');
  await press('Run a package'); await press('Run it up the river'); s = await hs();
  check(s.kind === 'run' && s.gmode === 'run' && s.mode === 'count' && s.run && s.run.cops === 2 && (await city()).hidden, 'the river run goes straight to the line, with two patrol skis at three stars: ' + JSON.stringify(s.run));
  await run(4); await page.evaluate(() => window.__hs.auto());
  for (let i = 0; i < 12; i++) await run(1);
  await page.waitForTimeout(700); await page.screenshot({path: join(OUT, 'run.png')});
  for (let i = 0; i < 300 && (await hs()).mode !== 'done'; i++) await run(1);
  await run(3); s = await hs();
  check(s.mode === 'done' && await again() === 'Back to the city', 'the run ends and leads back to the city: law ' + Math.round(s.run.bust) + '%, load ' + s.run.cargo + '%');
  c = await city();
  check(!c.hidden && /Delivered|County|In the river/.test(c.modal || ''), 'the city has the outcome: ' + (c.modal || '').slice(0, 100));
  await closeModals();
  await setUp({top: {day: 19, h: 20, en: 80, at: 'docks', heat: 70, over: 0}}); await fresh();
  await page.evaluate(() => { const r = document.getElementById('city').shadowRoot; r.querySelector('[data-go="lake"]').dispatchEvent(new MouseEvent('click', {bubbles: true})); });
  // a stop by the law can be answered on the water, when one happens
  c = await city();
  if (/Red and blue/.test(c.modal || '')) { await press('Run for the water'); s = await hs(); check(s.kind === 'run' && s.run.cops >= 3, 'a getaway from a stop starts a chase: ' + JSON.stringify(s.run)); await page.click('#pauseBtn').catch(() => {}); await page.evaluate(() => document.getElementById('toSetup').click()); c = await city(); check(!c.hidden, 'giving yourself up comes back to the city: ' + (c.modal || '').slice(0, 60)); }
  await closeModals();

  console.log('In your own words');
  await page.route('**/api/talk', r => r.fulfill({json: {say: "Rough one. Sit down, I'll pour.", bond: 2, trust: 1, mood: 'up', note: 'Asked how her night was <b>'}}));
  await setUp({top: {day: 20, h: 20, en: 80, at: 'bar', heat: 0, over: 0}, pp: {nia: {met: 1, b: 30, t: 50, seen: 20, mem: []}}}); await fresh();
  const sheet = () => page.evaluate(() => document.getElementById('city').shadowRoot.getElementById('sheet').textContent);
  const type = v => page.evaluate(v => { document.getElementById('city').shadowRoot.getElementById('say').value = v; }, v);
  await who('nia'); check(/Nia/.test((await city()).modal || '') && await page.evaluate(() => !!document.getElementById('city').shadowRoot.querySelector('#sheet .who .fc')), 'tapping Nia opens a conversation with her face on it');
  check(await press('Say something in your own words'), 'Nia can be spoken to in your own words');
  await type('Rough night?'); await press('Say it');
  await page.waitForFunction(() => /Sit down/.test(document.getElementById('city').shadowRoot.getElementById('sheet').textContent), null, {timeout: 5000});
  check(/Rough night\?/.test(await sheet()) && /I'll pour/.test(await sheet()), 'her reply comes back under what you said');
  let nia = await page.evaluate(() => JSON.parse(localStorage.getItem('shc')).pp.nia);
  check(nia.mood === 'up' && nia.b > 30 && nia.mem[0] === 'Asked how her night was &lt;b&gt;', 'bond, mood and memory took it, with markup made safe: bond ' + nia.b + ', remembers "' + nia.mem[0] + '"');
  await page.screenshot({path: join(OUT, 'talk.png')});
  await press('Leave it there');
  await page.unroute('**/api/talk'); await page.route('**/api/talk', r => r.fulfill({status: 503, json: {error: 'off'}}));
  await who('nia'); await press('Say something in your own words'); await type('Still there?'); await press('Say it');
  await page.waitForFunction(() => /doesn't catch that/.test(document.getElementById('city').shadowRoot.getElementById('sheet').textContent), null, {timeout: 5000});
  await press('OK'); await who('nia');
  check(!/in your own words/.test(await sheet()), 'with the function off the option goes away and the scripted choices remain');
  await closeModals(); await page.unroute('**/api/talk');

  console.log('The phone, the hustles, the recap');
  await setUp({top: {day: 21, h: 14, en: 80, at: 'garage', heat: 10, over: 0, cash: 900, inbox: [{id: 'rosa_cover', day: 21}], sk: {drive: 3, wrench: 6, charm: 0, fight: 0}, cl: {f: 1200, clip: {kind: 'race', q: 4, t: 'Round 4 at Bayou: 2nd', h: 0, day: 21}, spon: {}, warn: {}, stunt: -9, last: 19, posts: 2, best: 1200}}, pp: {tommy: {met: 1, b: 40, t: 60, seen: 21}, rosa: {met: 1, b: 30, t: 55, seen: 21}}}); await fresh();
  await page.click('#city >> css=#phone').catch(() => page.evaluate(() => document.getElementById('city').shadowRoot.getElementById('phone').click()));
  check(await page.evaluate(() => !document.getElementById('city').shadowRoot.getElementById('phoneui').hidden), 'the phone opens');
  await page.evaluate(() => document.getElementById('city').shadowRoot.querySelector('[data-app="msgs"]').click());
  check(await page.evaluate(() => /Cook walked out/.test(document.getElementById('city').shadowRoot.getElementById('pscreen').textContent)), 'Messages has Rosa\'s text');
  await page.screenshot({path: join(OUT, 'phone.png')});
  await page.evaluate(() => document.getElementById('city').shadowRoot.querySelector('[data-ask]').click());
  check(/Text from Rosa/.test((await city()).modal || ''), 'tapping it opens the text to answer');
  await press("Can't. Sorry."); await page.evaluate(() => document.getElementById('city').shadowRoot.querySelector('[data-pclose]').click());
  await tabTo('hustle');
  let f0 = await page.evaluate(() => JSON.parse(localStorage.getItem('shc')).cl.f);
  check(await press('Post it'), 'Hustles offers the clip to post');
  let cl1 = await page.evaluate(() => JSON.parse(localStorage.getItem('shc')).cl);
  check(cl1.f > f0 && !cl1.clip && await page.evaluate(() => [...document.getElementById('city').shadowRoot.querySelectorAll('.toast')].some(t => /followers/.test(t.textContent))), 'posting it brings followers, with a pop-up: ' + f0 + ' to ' + cl1.f);
  check(await press('Sign'), 'past a thousand followers a sponsor will sign you');
  await tabTo('here');
  check((await city()).acts.some(a => /Take a tuning job/.test(a) && !/\(x\)/.test(a)), 'Tommy has tuning work once you can turn a wrench');
  await press('Take a tuning job'); check(/Tuning job/.test((await city()).modal || ''), 'a customer brings a ski'); await press('Mild map');
  check((await city()).log.some(l => /idles like a sewing machine/.test(l)), 'a mild map is safe money');
  await tabTo('hustle'); let c0 = (await city()).cash; await press('Start a shift'); await closeModals();
  check((await page.evaluate(() => JSON.parse(localStorage.getItem('shc')).gig.runs)) > 0, 'a Runner shift does deliveries: ' + c0 + ' to ' + (await city()).cash);
  await tabTo('here'); await goTo('home'); await press('Sleep');
  c = await city(); for (let i = 0; i < 6 && c.modal && !/^Day \d+/.test(c.modal); i++) { await page.evaluate(() => { const b = [...document.getElementById('city').shadowRoot.querySelectorAll('[data-ch]:not([disabled])')]; b[b.length - 1].click(); }); c = await city(); }
  check(/^Day \d+/.test(c.modal || '') && /Money/.test(c.modal), 'waking up brings the recap: ' + (c.modal || '').slice(0, 80));
  await page.screenshot({path: join(OUT, 'recap.png')});
  await closeModals();

  console.log('A smaller phone');
  await save({day: 17, h: 10, en: 80, at: 'garage'}); await page.setViewportSize({width: 390, height: 780});
  await page.reload(); await page.waitForFunction(() => window.__hs && window.CITY); await closeModals();
  check(!(await city()).wide, 'the city does not scroll sideways at 390 wide');
  await page.screenshot({path: join(OUT, 'city-390.png')});
  check(await press('Work on your ski') && (await hs()).kind === 'garage', 'the garage opens at 390 wide');
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) && await page.isVisible('#toCity'), 'the pits fit at 390 wide, with the way back in view');
  await page.screenshot({path: join(OUT, 'garage-390.png')});
  await page.click('#toCity');
  // after runs from the law, free play still lines up a full field with its own labels
  await press('Free play'); await page.click('#modeS'); await page.click('#go'); await run(4); s = await hs();
  check(s.gmode === 'single' && s.mode === 'race' && !s.run && await page.evaluate(() => document.querySelector('#hud .lbl').textContent === 'Pos' && document.getElementById('posN').textContent === '/10'), 'free play after a run: ten riders, position and lap on the strip');
} finally {
  await browser.close();
  server.close();
}
if (fail.length) { console.error('FAILED\n- ' + fail.join('\n- ')); process.exit(1); }
console.log('OK. Screenshots in tests/out/');
