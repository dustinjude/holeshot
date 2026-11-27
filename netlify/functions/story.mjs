// The rest of Holeshot's Claude writing, served at /api/story: the race preview on the start screen, the crew chief in
// the garage, Watercraft Weekly after each tour weekend and the season finale, and the announcer's call at the
// championship ceremony. The game sends a kind and that kind's facts; this asks Claude and sends the text back.
// The API key lives only in Netlify's environment (ANTHROPIC_API_KEY), never in the game or the repo.
// Each kind takes structured facts only, no free text, so it can't be used as a general chatbot on your credits.

const MODEL = 'claude-haiku-5-5';
const MAX_BODY = 8000;                 // bytes: the largest kind, the crew chief's garage, is well under this
const PER_MIN = 8;                     // calls per minute from one address
const hits = new Map();                // address -> recent call times, kept per function instance

// Only the game's own pages may call this: the live site, its deploy previews and branch deploys, and local testing.
const ORIGIN_OK = /^https:\/\/([a-z0-9-]+--)?holeshotgame\.netlify\.app$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

// Text from the game is cut short and kept to letters, digits and simple punctuation before it goes into a prompt.
const txt = (v, n = 40) => String(v ?? '').replace(/[^\p{L}\p{N} .,'()#:+\-$%]/gu, '').slice(0, n).trim();
const num = (v, lo = 0, hi = 99999) => { const x = Number(v); return Number.isFinite(x) ? Math.round(Math.min(hi, Math.max(lo, x))) : 0; };
const list = (v, n) => (Array.isArray(v) ? v.slice(0, n) : []);

// The riders are real people and friends of the player, and every rating in the game is a placeholder.
const FRIENDS = `The riders are real people and friends of the player, so keep it good-natured: no insults, no profanity, nothing about anyone's personal life, and never put words in a rider's mouth.
Use only the facts you are given. Do not invent results, crashes, quotes, records or anything else that is not in them.
Plain text only: no markdown, no emoji, no hashtags.`;
const order = (rows, unit) => list(rows, 10).map((r, i) => `  ${i + 1}. ${txt(r.n, 40)}${r.you ? ' (you)' : ''}${r.v != null ? ` ${num(r.v)} ${unit}` : ''}${r.x ? ` (${txt(r.x, 40)})` : ''}`);

const KINDS = {
  // The announcer setting up the race from the start screen.
  intro: {
    max: 200,
    system: `You are the race announcer for Holeshot, a closed-course jet ski racing game. Before the start, set the scene in two or three sentences, under 70 words: the course and its water, what is at stake, and a nod to the player's ride. ${FRIENDS}`,
    facts(b) {
      return [`${txt(b.what, 60)} at ${txt(b.site)}${b.rev ? ', run in reverse' : ''}: ${num(b.laps, 1, 9)} laps. ${txt(b.water, 160)}`,
        `The player rides as ${txt(b.you)} on a ${txt(b.craft, 24)}, ${txt(b.cls, 10)} class. Rivals: ${txt(b.level, 10)}.`,
        `The field: ${list(b.field, 10).map((n) => txt(n)).join(', ')}.`,
        ...(list(b.series, 10).length ? ['Series points so far:', ...order(b.series, 'pts')] : [])].join('\n');
    },
  },
  // The crew chief reading the player's garage and last race.
  crew: {
    max: 300,
    system: `You are the crew chief in Holeshot, a jet ski racing game, talking to your rider between races. In the first person, in three to five sentences, say what to do next with the money they have: which part to buy, which setting to change or what to service, and why, based on the last race and the next course. Recommend only parts, settings and services listed in the facts, and only what the cash covers; say so if it is better to save. Parts above the class limit do not count, and wear below 60% costs speed.
Plain text only: no markdown, no emoji. Use only the facts you are given.`,
    facts(b) {
      return [`Craft: ${txt(b.craft, 24)}. Class: ${txt(b.cls, 10)}, parts count up to level ${num(b.cap, 1, 3)}. Cash: $${num(b.cash, 0, 999999)}.`,
        'Parts (level of 3, what one level adds, next level cost):', ...list(b.parts, 12).map((p) => `  ${txt(p.n)}${p.by ? ` by ${txt(p.by, 24)}` : ''}: level ${num(p.l, 0, 3)}; ${txt(p.note, 80)}; ${p.cost ? `next level $${num(p.cost)}` : 'maxed'}`),
        'Setup (free, five steps from -2 to +2):', ...list(b.setup, 6).map((s) => `  ${txt(s.n)}: ${num(s.v, -2, 2) > 0 ? '+' : ''}${num(s.v, -2, 2)} (toward ${txt(s.lo, 20)} at -2, ${txt(s.hi, 20)} at +2)`),
        'Condition:', ...list(b.wear, 4).map((w) => `  ${txt(w.n, 20)}: ${num(w.c, 0, 100)}%, service $${num(w.cost)}`),
        b.last ? `Last race: ${txt(b.last.site)}, finished ${num(b.last.place, 1, 10)} of 10, best lap ${txt(b.last.lap, 10)}, top speed ${num(b.last.mph, 0, 120)} mph, clean buoys ${num(b.last.clean)} of ${num(b.last.turns)}, off course ${num(b.last.off)} times, rough-water hits ${num(b.last.rough)}.` : 'No race run yet.',
        `Next course: ${txt(b.next, 40)}. ${txt(b.water, 160)}`].join('\n');
    },
  },
  // Watercraft Weekly: the magazine page after a tour weekend, or the season finale issue.
  mag: {
    max: 600,
    system: `You write Watercraft Weekly, the magazine of the Holeshot jet ski racing tour in a racing game. Write a headline on its own line, then two or three short sections, each a short heading on its own line and a short paragraph, about 200 words in all: the weekend's result and how the two motos went, the series points battle, and what is next. If it is the season finale, cover the champion and the season instead. ${FRIENDS}`,
    facts(b) {
      return [b.final ? 'Season finale issue: the series is over.' : `After round ${num(b.round, 1, 20)} of ${num(b.of, 1, 20)} at ${txt(b.site)}.`,
        ...(list(b.weekend, 10).length ? ['Weekend overall (points, moto finishes):', ...order(b.weekend, 'pts')] : []),
        'Series standings:', ...order(b.series, 'pts'),
        b.next ? `Next: round ${num(b.round, 0, 20) + 1} at ${txt(b.next)}.` : '',
        list(b.hist, 12).length ? `The player's weekend finishes so far: ${list(b.hist, 12).map((x) => num(x, 1, 10)).join(', ')}.` : ''].filter(Boolean).join('\n');
    },
  },
  // The announcer's call at the championship ceremony.
  champ: {
    max: 200,
    system: `You are the race announcer for Holeshot, a jet ski racing game, calling the championship podium at the end of the season. Two or three sentences, under 60 words, celebrating the champion and the top three. ${FRIENDS}`,
    facts(b) {
      return ['Final series standings:', ...order(b.series, 'pts'), list(b.hist, 12).length ? `The player's weekend finishes this season: ${list(b.hist, 12).map((x) => num(x, 1, 10)).join(', ')}.` : ''].filter(Boolean).join('\n');
    },
  },
};

export default async (req, context) => {
  const origin = req.headers.get('origin') || '';
  const cors = ORIGIN_OK.test(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } });
  if (req.method !== 'POST') return new Response('POST only', { status: 405, headers: cors });
  if (!ORIGIN_OK.test(origin)) return new Response('Not allowed', { status: 403 });

  // a simple per-address limit; each function instance keeps its own count
  const ip = context?.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown', now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60000);
  if (recent.length >= PER_MIN) return new Response('Slow down', { status: 429, headers: cors });
  recent.push(now); hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return new Response('Not set up', { status: 503, headers: cors });

  const raw = await req.text();
  if (raw.length > MAX_BODY) return new Response('Too big', { status: 413, headers: cors });
  let body;
  try { body = JSON.parse(raw); } catch { return new Response('Bad request', { status: 400, headers: cors }); }
  const K = Object.hasOwn(KINDS, body?.kind) ? KINDS[body.kind] : null;
  if (!K || typeof body.facts !== 'object' || !body.facts) return new Response('Unknown kind', { status: 400, headers: cors });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: K.max, system: K.system, messages: [{ role: 'user', content: K.facts(body.facts) }] }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) { console.error('Claude API', r.status, (await r.text()).slice(0, 300)); return new Response('Upstream error', { status: 502, headers: cors }); }
    const data = await r.json();
    const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim().slice(0, 2000);
    return Response.json({ text }, { headers: { ...cors, 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('story', body.kind, e?.name, e?.message);
    return new Response('Upstream error', { status: 502, headers: cors });
  }
};

export const config = { path: '/api/story' };
