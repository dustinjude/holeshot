// Plays the game in a phone-sized headless Chrome: loads, checks both models arrive, races a few seconds, then lets the
// player's ski finish a whole race by itself, and fails on any page error. Screenshots go to tests/out/.
//   npm install && npx playwright install chromium   (once)
//   npm test
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
const server = await serve('dist-test', 8765);
// software WebGL, so the 3D view renders on any machine; its frame rate says nothing about a phone's
const browser = await chromium.launch({
  executablePath: process.env.CHROME || undefined,                 // optional: point at an installed Chrome instead
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', ...(process.getuid?.() === 0 ? ['--no-sandbox'] : [])],
});
const fail = [];
try {
  // iPhone Pro Max size
  const page = await browser.newPage({viewport: {width: 440, height: 956}, deviceScaleFactor: 3, hasTouch: true, isMobile: true});
  page.on('pageerror', e => fail.push('page error: ' + e.message));
  const st = () => page.evaluate(() => window.__hs.state());
  await page.goto('http://localhost:8765/');
  await page.waitForFunction(() => window.__hs && window.__hs.state().models.length >= 2, null, {timeout: 20000})
    .catch(() => fail.push('models did not load'));
  // the app opens in Side Hustle City: this test is about the racing, so it steps out to free play first
  await page.evaluate(() => window.CITY && window.CITY.leave());
  let s = await st();
  console.log('loaded:', JSON.stringify(s));
  if (!s.gl) fail.push('no WebGL: the 3D view did not start');
  await page.screenshot({path: join(OUT, 'setup.png')});
  await page.click('#go');
  await page.waitForFunction(() => window.__hs.state().mode === 'race', null, {timeout: 15000});
  await page.waitForTimeout(3000);
  await page.screenshot({path: join(OUT, 'race.png')});
  await page.evaluate(() => window.__hs.auto());
  for (let i = 0; i < 400 && (await st()).mode !== 'done'; i++) await page.evaluate(() => window.__hs.run(1));
  s = await st();
  console.log('after the race:', JSON.stringify(s));
  if (s.mode !== 'done') fail.push('the race did not finish');
  await page.evaluate(() => window.__hs.run(5));
  await page.screenshot({path: join(OUT, 'results.png')});
  const over = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (over) fail.push('the page scrolls sideways');
} finally {
  await browser.close();
  server.close();
}
if (fail.length) { console.error('FAILED\n- ' + fail.join('\n- ')); process.exit(1); }
console.log('OK. Screenshots in tests/out/');
