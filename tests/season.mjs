// Plays whole seasons of Side Hustle City with a bot, in headless Chrome, to catch crashes and dead ends and to see how the money
// and the heat run. The racing is stubbed: a race, a drag run or a run from the law reports a random result at once, so a
// season takes a second. Two bots: "random" presses anything, "sane" also sleeps, eats, works and turns up on race day.
//   npm run test:season            (12 seasons of each bot)        node tests/season.mjs 40   (more seasons)
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {serve} from '../serve.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SEASONS = parseInt(process.argv[2], 10) || 12;
execFileSync(process.execPath, [join(ROOT, 'build.mjs'), '--test'], {stdio: 'inherit'});
const server = await serve('dist-test', 8767);
const browser = await chromium.launch({
  executablePath: process.env.CHROME || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', ...(process.getuid?.() === 0 ? ['--no-sandbox'] : [])],
});
const fail = [];
try {
  const page = await browser.newPage({viewport: {width: 440, height: 956}, hasTouch: true, isMobile: true});
  page.on('pageerror', e => fail.push('page error: ' + e.message));
  await page.addInitScript(() => { try { localStorage.setItem('shc.adult', '1'); } catch (e) {} });
  await page.goto('http://localhost:8767/');
  await page.waitForFunction(() => window.__hs && window.CITY);
  // one season, played inside the page. Returns what happened.
  const play = (seed, sane, skill, keep) => page.evaluate(([seed, sane, skill, keep]) => {
    let a = seed >>> 0;
    const rnd = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const real = Math.random; Math.random = rnd;
    const HS = window.HS, open0 = HS.open, host = document.getElementById('city'), R = host.shadowRoot;
    const $ = id => R.getElementById(id), S = () => JSON.parse(localStorage.getItem('shc'));
    const seen = {acts: new Set(), modals: new Set()}, runs = {n: 0, ok: 0};
    // the racing, decided by a coin weighted by how good a rider this bot is
    HS.open = c => {
      const good = rnd() < skill;
      if (c.mode === 'tour') {
        const I0 = HS.info(); HS.skip(); const I = HS.info(), p = good ? 1 + Math.floor(rnd() * 3) : 4 + Math.floor(rnd() * 7), prize = [1400, 900, 600, 400, 300, 200, 150, 100, 60, 40][p - 1] * 2 * c.purse;
        window.__hs.pay(prize); c.done({kind: 'tour', p, m: [p, p], prize, site: I0.next, round: I.round, total: I.total, tpos: p, dnf: 0});
      } else if (c.mode === 'open') { const p = good ? 1 + Math.floor(rnd() * 3) : 4 + Math.floor(rnd() * 7), prize = Math.round([1400, 900, 600, 400, 300, 200, 150, 100, 60, 40][p - 1] * c.purse); window.__hs.pay(prize); c.done({kind: 'open', p, prize, site: 'the Lake', dnf: 0}); }
      else if (c.mode === 'drag') c.done({kind: 'drag', win: good, red: false, dnf: 0});
      else if (c.mode === 'run') { runs.n++; const ok = rnd() < .45 + .45 * skill; if (ok) runs.ok++; c.done({kind: 'run', ok, how: ok ? (rnd() < .3 ? 'lost' : 'made') : (rnd() < .2 ? 'quit' : 'bust'), cargo: Math.round(40 + 60 * rnd()), hits: Math.floor(rnd() * 5), t: 50, site: 'the river'}); }
      c.exit();
    };
    const click = b => b.dispatchEvent(new MouseEvent('click', {bubbles: true}));
    // close whatever dialog the last season left open, then start a new life
    for (let i = 0; i < 30 && $('modal').classList.contains('show'); i++) { const ch = [...$('sheet').querySelectorAll('[data-ch]')].filter(b => !b.disabled); click(ch[ch.length - 1]); }
    if (!keep) $('reset').click();
    const out = {days: 0, end: '', stuck: 0, steps: 0, cashAt: {}, heatMax: 0};
    const pickOf = l => l[Math.floor(rnd() * l.length)];
    let idle = 0, lastDay = 0;
    for (; out.steps < 60000; out.steps++) {
      const s = S();
      if (s.over) { out.end = s.over; break; }
      if (s.day !== lastDay) { lastDay = s.day; out.heatMax = Math.max(out.heatMax, s.heat); if (s.day % 5 === 0) out.cashAt[s.day] = s.cash; }
      if (s.day > 46 && !$('modal').classList.contains('show')) { out.end = 'season'; out.final = s; break; }
      if ($('modal').classList.contains('show')) {
        const h = $('sheet').querySelector('h3').textContent; seen.modals.add(h);
        const ch = [...$('sheet').querySelectorAll('[data-ch]')].filter(b => !b.disabled && !/Start a new life/.test(b.textContent));
        if (!ch.length) { out.stuck = 'modal with no way out: ' + h; break; }
        click(pickOf(ch)); idle = 0; continue;
      }
      const acts = [...R.querySelectorAll('[data-a]')].filter(b => !b.disabled), by = t => acts.find(b => b.textContent.includes(t));
      const go = k => click(R.querySelector('[data-go="' + k + '"]'));
      let b = null;
      if (sane) {
        const I = HS.info(), raceDay = I.round < I.total && s.day === s.season0 + 5 * (I.round + 1) && s.h >= 6 && s.h < 19;
        if (s.en < 28) { if (s.at !== 'home') { go('home'); continue; } b = by('Sleep'); }
        else if (s.food < 30) { if (s.at !== 'home') { go('home'); continue; } b = by('Cook'); }
        else if (raceDay) { if (s.at !== 'lake') { go('lake'); continue; } b = by('Race '); }
        else if (s.h >= 8 && s.h < 12 && rnd() < .7) { const w = s.gar || s.tsh ? 'garage' : 'diner'; if (s.at !== w) { go(w); continue; } b = by('shift') || by('Work your own bay') || by('Ask Tommy for work'); }
      }
      if (!b) {
        if (!acts.length || rnd() < .22) { const l = [...R.querySelectorAll('[data-go]')]; go(pickOf(l).dataset.go); if (++idle > 400) { out.stuck = 'nothing to do at ' + s.at + ' day ' + s.day + ' ' + s.h + 'h'; break; } continue; }
        b = pickOf(acts);
      }
      seen.acts.add(b.textContent.replace(/[\d$,.]+/g, '#').slice(0, 40)); idle = 0; click(b);
    }
    const f = out.final || S();
    out.days = f.day; out.sum = {cash: f.cash, heat: f.heat, rep: f.rep, v: f.z.v, pad: f.z.pad, dexDead: f.z.dexDead, gar: f.gar, friends: Object.values(f.pp).filter(p => p.met && p.t >= 20 && p.b >= 35).length};
    delete out.final;
    out.acts = [...seen.acts]; out.modals = [...seen.modals]; out.runs = runs;
    HS.open = open0; Math.random = real;
    return out;
  }, [seed, sane, skill, keep]);
  const acts = new Set(), modals = new Set();
  // "street": a random bot dropped deep into the game, known to everyone, armed and holding, at some point in the Vance story
  const deep = async i => {
    await page.evaluate(i => {
      const R = document.getElementById('city').shadowRoot;
      for (let n = 0; n < 30 && R.getElementById('modal').classList.contains('show'); n++) { const ch = [...R.querySelectorAll('#sheet [data-ch]')].filter(b => !b.disabled); ch[ch.length - 1].click(); }
      R.getElementById('reset').click();
      const s = JSON.parse(localStorage.getItem('shc'));
      Object.assign(s, {cash: 6000, rep: 35, pk: 3, day: 9, h: 18, car: 1, season0: 5, sk: {drive: 9, wrench: 6, charm: 9, fight: 9}});
      for (const k in s.pp) Object.assign(s.pp[k], {met: 1, b: 55, t: 65, seen: 9, b0: 55, t0: 65});
      Object.assign(s.z, {piece: 1, stash: {green: 5, pills: 5, powder: 3}, v: [0, 2, 3, 4, 4, 1][i % 6], vDay: 9, vRuns: i % 6 === 1 ? 2 : 0, ledger: i % 6 === 4 ? 1 : 0, hitDay: 9});
      localStorage.setItem('shc', JSON.stringify(s));
    }, i);
    await page.reload(); await page.waitForFunction(() => window.__hs && window.CITY);
  };
  for (const [name, sane, skill, street] of [['random', false, .5], ['sane, average rider', true, .4], ['sane, good rider', true, .8], ['street', false, .6, true]]) {
    const ends = {}, cash = [], heat = [], vs = {}, at = {};
    let runs = 0, runsOk = 0, stuck = 0;
    for (let i = 0; i < SEASONS; i++) {
      if (street) await deep(i);
      const o = await play(1000 + i * 7919, sane, skill, !!street);
      ends[o.end || 'cut off'] = (ends[o.end || 'cut off'] || 0) + 1;
      if (o.stuck) { stuck++; fail.push(name + ' seed ' + i + ': ' + o.stuck); }
      if (!o.end) fail.push(name + ' seed ' + i + ': did not finish in ' + o.steps + ' steps (day ' + o.days + ')');
      if (o.end === 'season') { cash.push(o.sum.cash); heat.push(o.sum.heat); }
      vs[o.sum.v] = (vs[o.sum.v] || 0) + 1; runs += o.runs.n; runsOk += o.runs.ok;
      for (const d in o.cashAt) (at[d] = at[d] || []).push(o.cashAt[d]);
      o.acts.forEach(a => acts.add(a)); o.modals.forEach(m => modals.add(m));
    }
    const med = l => l.length ? l.slice().sort((a, b) => a - b)[Math.floor(l.length / 2)] : '-';
    console.log(`${name}: ${SEASONS} seasons | endings ${JSON.stringify(ends)} | median cash at the end $${med(cash)}, heat ${med(heat)} | cash by day ${Object.keys(at).map(d => d + ':$' + med(at[d])).join(' ')} | Vance ${JSON.stringify(vs)} | water runs ${runs} (${runsOk} ok)`);
  }
  console.log(`${acts.size} different actions pressed, ${modals.size} different dialogs seen`);
  if (process.argv.includes('--list')) console.log([...modals].sort().join(' | '));
} finally { await browser.close(); server.close(); }
if (fail.length) { console.log('FAILED:\n  ' + [...new Set(fail)].slice(0, 30).join('\n  ')); process.exit(1); }
console.log('OK');
