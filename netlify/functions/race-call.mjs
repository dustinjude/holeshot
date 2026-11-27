// The booth call on the results screen. The game sends the facts of the race that just finished; this asks Claude for a
// two- or three-sentence call in a race announcer's voice and sends the text back.
// The API key lives only in Netlify's environment (ANTHROPIC_API_KEY), never in the game or the repo.
// The function takes race facts only, not free text, so it can't be used as a general chatbot on your credits.

const MODEL = 'claude-haiku-5-5';
const MAX_BODY = 4000;                 // bytes: a race's facts are well under this
const PER_MIN = 6;                     // calls per minute from one address; a race takes longer than that
const hits = new Map();                // address -> recent call times, kept per function instance

// Only the game's own pages may call this: the live site, its deploy previews and branch deploys, and local testing.
const ORIGIN_OK = /^https:\/\/([a-z0-9-]+--)?holeshotgame\.netlify\.app$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

// Text from the game is cut short and kept to letters, digits and simple punctuation before it goes into the prompt.
const txt = (v, n = 40) => String(v ?? '').replace(/[^\p{L}\p{N} .,'()#:+\-]/gu, '').slice(0, n).trim();
const num = (v, lo, hi) => { const x = Number(v); return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : null; };

const SYSTEM = `You are the booth announcer for Holeshot, a closed-course jet ski racing game. Write the call for the race that just finished: two or three sentences, under 60 words, in an excited but believable race-announcer voice.
Use only the facts you are given. Do not invent passes, crashes, wipeouts, quotes or anything else that is not in them.
The riders are real people and friends of the player, so keep it good-natured: no insults, no profanity, nothing about anyone's personal life.
The player is marked (you). Talk about them in the third person by name, like a real announcer would.
Plain text only: no emoji, no hashtags, no quotation marks around the whole thing.`;

function facts(b) {
  const field = Array.isArray(b.field) ? b.field.slice(0, 10) : [];
  const lines = [
    `Mode: ${txt(b.mode, 20) || 'race'}${b.moto ? `, tour round ${num(b.round, 1, 20)} moto ${num(b.moto, 1, 2)}` : ''}`,
    `Course: ${txt(b.site)}${b.reverse ? ' (run in reverse)' : ''}`,
    `Rival level: ${txt(b.rivals, 12)}`,
    'Finishing order (gap to the winner in seconds):',
    ...field.map((r, i) => `${i + 1}. ${txt(r.name, 50)}${r.craft ? ' on a ' + txt(r.craft, 24) : ''}${i ? ' +' + (num(r.gap, 0, 999) ?? 0).toFixed(1) : ''}`),
    `The player finished ${num(b.place, 1, 10)} of ${field.length || 10}.`,
    `Player's race time ${txt(b.time, 10)}, best lap ${txt(b.bestLap, 10)}, top speed ${num(b.mph, 0, 120)} mph.`,
    `Turn buoys taken clean on the inside: ${num(b.clean, 0, 999)} of ${num(b.turns, 0, 999)}. Times off course: ${num(b.off, 0, 999)}.`,
  ];
  return lines.join('\n');
}

export default async (req, context) => {
  const origin = req.headers.get('origin') || '';
  const cors = ORIGIN_OK.test(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } });
  if (req.method !== 'POST') return new Response('POST only', { status: 405, headers: cors });
  if (!ORIGIN_OK.test(origin)) return new Response('Not allowed', { status: 403 });

  // a simple per-address limit; each function instance keeps its own count
  const ip = context?.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown', now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 60000);
  if (recent.length >= PER_MIN) return new Response('Slow down', { status: 429, headers: cors });
  recent.push(now); hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return new Response('Not set up', { status: 503, headers: cors });

  const raw = await req.text();
  if (raw.length > MAX_BODY) return new Response('Too big', { status: 413, headers: cors });
  let body;
  try { body = JSON.parse(raw); } catch { return new Response('Bad request', { status: 400, headers: cors }); }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 200, system: SYSTEM, messages: [{ role: 'user', content: facts(body) }] }),
      signal: AbortSignal.timeout(9000),
    });
    if (!r.ok) { console.error('Claude API', r.status, (await r.text()).slice(0, 300)); return new Response('Upstream error', { status: 502, headers: cors }); }
    const data = await r.json();
    const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join(' ').trim().slice(0, 600);
    return Response.json({ text }, { headers: { ...cors, 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('race-call', e?.name, e?.message);
    return new Response('Upstream error', { status: 502, headers: cors });
  }
};

export const config = { path: '/api/race-call' };
