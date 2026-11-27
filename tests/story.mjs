// Claude's writing in Holeshot, with the functions stubbed (no API key needed): the race preview on the start screen,
// the crew chief in the garage, Watercraft Weekly after the weekend and at the season finale, and the championship
// call under the podium. The tour starts on its very last moto so one race reaches the end of the season.
//   npm test first (it installs what this needs), then: node tests/story.mjs
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
const server = await serve('dist-test', 8767);
const browser = await chromium.launch({executablePath: process.env.CHROME || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', ...(process.getuid?.() === 0 ? ['--no-sandbox'] : [])]});
const fail = [], sent = [], check = (ok, what) => { console.log((ok ? 'ok   ' : 'FAIL ') + what); if (!ok) fail.push(what); };
try {
  const page = await browser.newPage({viewport: {width: 440, height: 956}, deviceScaleFactor: 3, hasTouch: true, isMobile: true});
  page.on('pageerror', e => fail.push('page error: ' + e.message));
  await page.route('**/api/story', async r => { const b = JSON.parse(r.request().postData()); sent.push(b); await new Promise(x => setTimeout(x, 300));
    await r.fulfill({json: {text: `Stand-in ${b.kind} headline\nShort heading\nA stand-in paragraph for ${b.kind}.`}}); });
  await page.route('**/api/race-call', r => r.fulfill({json: {text: 'A stand-in booth call.'}}));
  // the last weekend of a tour, moto 1 already run: Dustin (9) is second in the series
  await page.addInitScript(() => {
    const pts = [180, 120, 90, 100, 60, 70, 40, 30, 20, 150], m1 = [9, 0, 3, 1, 2, 5, 4, 6, 7, 8], wk = Array(10).fill(0), P = [25, 20, 16, 13, 11, 9, 7, 5, 3, 1];
    m1.forEach((ri, i) => { wk[ri] = P[i]; });
    localStorage.setItem('holeshot.mode', 'tour');
    localStorage.setItem('holeshot.tour12', JSON.stringify({round: 15, pts, wk, m1, m2: null, last: null, hist: [3, 2, 1, 4, 2, 5, 1], r: 9, c: 0}));
  });
  await page.goto('http://localhost:8767/');
  await page.waitForFunction(() => window.__hs && window.__hs.state().gl, null, {timeout: 20000});
  const story = (kind) => page.evaluate(k => [...document.querySelectorAll('.story')].some(e => e.innerText.includes('stand-in paragraph for ' + k)), kind);

  // the race preview
  const pv = page.locator('#preview button');
  check(await pv.isVisible(), 'start screen shows "Preview the race"');
  await pv.click(); await page.waitForTimeout(600);
  check(await story('intro'), 'the preview appears');
  const intro = sent.find(b => b.kind === 'intro');
  check(intro && intro.facts.series.length === 10 && /round 8/i.test(intro.facts.what) && intro.facts.field.length === 9, 'preview facts: tour round 8, series points, the other nine riders');
  await page.screenshot({path: join(OUT, 'story-preview.png')});

  // the crew chief, and a fresh button once the build changes
  await page.click('#tabG'); await page.waitForTimeout(200);
  await page.locator('#garage .storybox button').click(); await page.waitForTimeout(600);
  check(await story('crew'), 'the crew chief answers in the garage');
  const crew = sent.find(b => b.kind === 'crew');
  check(crew && crew.facts.parts.length >= 8 && crew.facts.setup.length === 3 && crew.facts.wear.length === 3 && crew.facts.cash > 0, 'crew facts: parts, setup, wear and cash');
  await page.screenshot({path: join(OUT, 'story-crew.png')});
  await page.click('#tune0_4'); await page.waitForTimeout(200);
  check(await page.locator('#garage .storybox button').isVisible(), 'a changed setup gives a fresh crew chief button');
  await page.click('#tabR');

  // race moto 2, then the weekend overall with the magazine
  await page.click('#go');
  await page.waitForFunction(() => window.__hs.state().mode === 'race', null, {timeout: 15000});
  await page.evaluate(() => window.__hs.auto());
  for (let i = 0; i < 400 && (await page.evaluate(() => window.__hs.state().mode)) !== 'done'; i++) await page.evaluate(() => window.__hs.run(1));
  await page.evaluate(() => window.__hs.run(6));
  check(await page.locator('#extra button').count() === 0, 'no magazine on the moto results');
  await page.click('#again'); await page.waitForTimeout(300);
  const mag = page.locator('#extra button');
  check(await mag.isVisible() && /Watercraft Weekly/i.test(await mag.innerText()), 'weekend overall shows "Read Watercraft Weekly"');
  await mag.click(); await page.waitForTimeout(600);
  check(await story('mag'), 'the magazine appears');
  const m = sent.find(b => b.kind === 'mag');
  check(m && !m.facts.final && m.facts.round === 8 && m.facts.weekend.length === 10 && m.facts.series.length === 10, 'magazine facts: round 8, weekend overall and series');
  check(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), 'nothing scrolls sideways');
  await page.screenshot({path: join(OUT, 'story-mag.png')});

  // award ceremony, then the final standings with the season finale issue, then the championship call
  await page.click('#again'); await page.waitForTimeout(400);
  await page.click('#cerGo'); await page.waitForTimeout(400);
  const fin = page.locator('#extra button');
  check(await fin.isVisible() && /season finale/i.test(await fin.innerText()), 'final standings show the season finale issue');
  await fin.click(); await page.waitForTimeout(600);
  check(sent.some(b => b.kind === 'mag' && b.facts.final), 'the finale issue is asked for as the final one');
  await page.click('#again'); await page.waitForTimeout(900);
  check(await page.locator('#cerCall').isVisible(), 'the championship call shows under the podium');
  check(sent.some(b => b.kind === 'champ' && b.facts.series.length === 10), 'the championship call gets the final standings');
  await page.screenshot({path: join(OUT, 'story-champ.png')});
  console.log('kinds sent:', sent.map(b => b.kind).join(','));
} finally {
  await browser.close();
  server.close();
}
if (fail.length) { console.error('FAILED\n- ' + fail.join('\n- ')); process.exit(1); }
console.log('OK. Screenshots in tests/out/');
