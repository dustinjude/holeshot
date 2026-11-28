// Side Hustle City's photographs: what each one shows, and the making and keeping of them.
//
// The city's places and people were drawn in code (src/city/art.js). This gives each of them a photograph instead. The
// pictures are made by an image model through Netlify's AI Gateway, which supplies the credentials, so there is no key in
// this repo. Each picture is made once, the first time a player's screen asks for it, kept in Netlify Blobs, and from then
// on served like any other image. The drawn art stays as the fallback for anything not made yet.
//
// Guard rails, because making a picture spends the site owner's credits:
// - only the pictures listed in CATALOG can be made, and each is made once: the list is the whole bill
// - a lock stops two visitors paying for the same picture at the same moment
// - the making runs in a background function, which may take minutes, so a slow picture is never paid for and then lost
//   to a time limit
// - a picture that fails three times is left alone for a week, so a broken prompt cannot be retried forever
// - HS_ART=off stops all making; pictures already kept are still served
// - every person is an invented adult, described here and nowhere else; no real people, no brands, nothing sexual
//
// Both functions (art.mts serves, artmake.mts makes) and the test (tests/art.mjs) use this file. The store and the image
// model are passed in, so the logic runs in the test without Netlify or the network.
import { createHash } from "node:crypto";

export type Spec = { ar: "16:9" | "1:1"; p: string; from?: string };

// ---- how every picture should look ----
const LOOK = "A photorealistic documentary photograph that could pass for a real photo taken on location: full-frame camera, 28mm lens, eye level, natural available light, true-to-life color, deep shadows, fine film grain. Not a render and not an illustration.";
const WORLD = "The setting is an invented, gritty, working-class American waterfront city in a warm climate, present day, a little run down.";
const RULES = "Wide 16:9 frame with the subject across the middle. No people close to the camera and nobody recognizable: at most small, distant figures. No brand names, logos, license plates or watermarks, and no readable text other than a sign named here.";
const PLOOK = "A photorealistic head-and-shoulders portrait photograph of an invented adult character from a crime drama. Not a real person and not a lookalike of anyone famous. Full-frame camera, 85mm lens at f/2: the face is sharp and the background is soft. Natural light, real skin texture with pores and small flaws, no beauty retouching.";
const PRULES = "Square frame. The head is centered with the eyes about two fifths of the way down, both shoulders in frame, looking straight into the lens. No hands in frame. No text, logos, name tags or watermarks.";

const place = (what: string, light: string): Spec => ({ ar: "16:9", p: `${LOOK} ${WORLD} ${what} ${light} ${RULES}` });
// The same place seen again: later in the day, or with something going on. Made by editing the first picture, so the room,
// the street and the camera stay where they were.
const again = (from: string, change: string): Spec => ({ ar: "16:9", from, p: `Edit this photograph. Keep the same place, the same camera position and framing, and every fixed thing exactly where it is. ${change} Keep it photorealistic, like a second photo taken from the same spot. ${RULES}` });

const PLACES: Record<string, Spec> = {
  // home: the studio bare, the studio once there is furniture in it, the one-bedroom, the house on the lake
  "home0-day": place("Inside a cheap studio apartment above a laundromat: a bare mattress with a rumpled gray blanket on a scuffed wooden floor, two plastic milk crates used as a table with a takeout box on top, a duffel bag, an old cast-iron radiator under a tall window with bent blinds, stained plaster walls and a bare bulb on a cord. Through the window, flat rooftops and power lines.", "Late-morning sun slants through the blinds and stripes the floor."),
  "home0-night": again("home0-day", "Make it night: the bare bulb is on and warm, orange streetlight comes through the blinds, and the rooftops outside are dark with a few lit windows."),
  "home0f-day": again("home0-day", "The tenant has made some money. Replace the mattress on the floor with a real bed on a simple wooden frame with a blue blanket, and add a small flat television on a low stand, a white refrigerator in the corner and a floor lamp. The radiator, window, walls and floor stay as they are."),
  "home0f-night": again("home0f-day", "Make it night: the floor lamp is on and warm, the television glows blue, orange streetlight comes through the blinds, and the rooftops outside are dark with a few lit windows."),
  "home1-day": place("Inside a modest one-bedroom apartment over a corner store: a worn burgundy sofa, a low coffee table, a patterned rug, a tall potted plant, a bookshelf, and a big window that looks down on a fenced asphalt basketball court across the street. Clean and lived in, nothing fancy.", "Soft afternoon light fills the room."),
  "home1-night": again("home1-day", "Make it night: a table lamp is on and warm, and the window shows the court below under one floodlight and dark buildings with a few lit windows."),
  "home2-day": place("The view from the covered back deck of a small lake house: two wooden deck chairs, a railing, steps down to a private wooden dock running out into calm blue water, a jet ski under a gray cover tied beside the dock, and low brown hills on the far shore under a big sky.", "Bright, clear midday sun."),
  "home2-night": again("home2-day", "Make it night: a full moon over the hills lays a path of light on black water, one warm deck light is on, and a small lamp burns at the end of the dock."),

  "diner-day": place("Inside a small old American diner called Lucky's: a long counter with a row of red vinyl stools on chrome posts, a pass-through window to the grill, a glass pie case, two coffee pots on a burner, a black-and-white checkerboard floor, booths along big front windows, and a red neon sign on the wall behind the counter that reads LUCKY'S.", "Bright morning sun pours in through the front windows."),
  "diner-night": again("diner-day", "Make it night: the front windows are black with a few street lights in them, warm pendant lamps glow over the counter, and the red neon sign lights the wall."),

  "court-day": place("An outdoor public basketball court in a city neighborhood: cracked asphalt with faded painted lines, a steel pole and backboard with a chain net, a tall chain-link fence, a bench, and low stucco apartment blocks and power lines behind.", "Hard afternoon sun and short shadows."),
  "court-night": again("court-day", "Make it night: one tall floodlight throws a hard pool of light on the empty court, the apartment windows behind are lit, and the sky is black."),
  "court-party": again("court-night", "A block party has taken over the court: strings of warm bulbs run across the fence, a pickup truck with big speakers on its bed is parked at the edge, smoke rises from a barrel grill, and a crowd dances and stands around, seen from behind and from a distance so that no face can be made out."),

  // the bar is seen open at night first; by day it is shut
  "bar-night": place("Inside a dark neighborhood dive bar called the Low End: a long scarred wooden bar with worn stools, shelves of bottles lit from below, an old jukebox glowing in the corner, a pool table at the back, red vinyl booths, and a pink neon sign on the wall that reads THE LOW END.", "Moody and hazy, lit only by neon and a few warm lamps."),
  "bar-day": again("bar-night", "It is the middle of the day and the bar is shut: the neon and the lamps are off, stools stand upside down on the bar, a mop and bucket are on the floor, and hard daylight comes in through the propped-open front door with dust hanging in it. Nobody is there."),

  "pawn-day": place("Inside a cramped pawn shop called Gold Line Pawn: glass display counters full of watches and gold jewelry, electric guitars hanging in a row on the wall, shelves of power tools and old stereos, a brass scale and a jeweler's loupe on the counter, a barred cashier's window, and gold lettering on the back wall that reads GOLD LINE PAWN.", "Fluorescent tubes overhead and daylight from a barred front window."),
  "pawn-night": again("pawn-day", "Make it night, after closing: the overhead lights are off, one desk lamp and a small security monitor glow behind the counter, steel shutters are down over the front window, and the display cases are dark."),

  "garage-day": place("Inside a small marine repair garage called Tommy's: three bays with the roll-up doors open to bright daylight, a sit-down jet ski with a plain unmarked hull and its engine cover off on a work stand in the middle bay, red tool chests, a cluttered workbench, a steel water test tank, an oil-stained concrete floor, and a hand-painted sign on the back wall that reads TOMMY'S.", "Daylight floods in through the open doors."),
  "garage-night": again("garage-day", "Make it night, after closing: the roll-up doors are shut, one fluorescent tube over the workbench is on, and the rest of the shop is in shadow."),

  // the docks are seen at night first, when they are working; by day they are empty
  "docks-night": place("A small freight dock at night: stacked steel shipping containers in faded colors, a yellow gantry crane, a corrugated cold-storage warehouse on the pier, wooden pilings, wet concrete, coiled rope and black water. Empty and a little menacing.", "Sodium lamps glow orange in a light fog."),
  "docks-day": again("docks-night", "Make it the middle of the day: flat hard sunlight, heat haze over the concrete, the lamps off, the water gray-green, and nobody around."),

  "gym-day": place("Inside an old boxing gym called the Iron Den: a ring with red and white ropes, heavy bags hanging on chains, a speed bag, cracked mirrors, a rack of gloves, worn mats, and brick walls with big hand-painted letters that read IRON DEN.", "Dusty daylight from high windows and a few fluorescent tubes."),
  "gym-night": again("gym-day", "Make it night: the high windows are black and the room is lit by fluorescent tubes, hard and a little green."),
  "gym-fight": place("The basement of a boxing gym on fight night: a boxing ring under one hard overhead light, a packed crowd in shadow pressed around it and seen from behind so that no face can be made out, hands in the air, haze hanging in the light. The ring is empty between bouts.", "Everything outside the ring light falls off into darkness."),

  "lake-day": place("A concrete boat launch ramp on a wide lake: a floating dock beside the ramp, an old pickup truck with an empty jet ski trailer backed down to the water, a line of orange racing buoys laid out across the water, low brown hills on the far shore and a big sky.", "Bright, clear late-morning sun and glitter on the water."),
  "lake-night": again("lake-day", "Make it night: moonlight on calm black water, one lamp on a pole at the top of the ramp, the truck gone, nobody there."),
  "lake-race": again("lake-day", "It is race day: pop-up canopy tents in bright colors line the shore, strings of pennant flags run between poles, jet skis sit on stands at the waterline, a checkered flag hangs from a pole, more buoys mark out a course, and a crowd watches from the shore, small and distant."),
  "lake-boat": again("lake-day", "A boat show has set up: new speedboats and jet skis sit on trailers along the shore under white tents, strings of flags run overhead, and families walk between them, small and distant."),
};

// ---- the people ----
// Each is invented, and an adult with a stated age. who is what the camera sees; face is how they look when nothing much is
// going on; behind is what is out of focus at their back. The eight people of the city (those in cast.json) also get a picture
// for each of the other three moods, made by editing the first so the face stays the same person.
type Sitter = { who: string; g: "her" | "him"; face?: string; behind: string; moods?: boolean };
const PEOPLE: Record<string, Sitter> = {
  rosa: { g: "her", moods: true, who: "a woman of 58 with warm brown skin, dark hair with one gray streak pulled back in a bun, reading glasses, small gold stud earrings, and a cream apron over a red blouse", face: "level and no-nonsense, with the hint of a dry half-smile", behind: "the counter and red stools of a diner in warm light" },
  nia: { g: "her", moods: true, who: "a Black woman of 28 with a full head of natural dark curls, gold hoop earrings, a black T-shirt and a white bar towel over one shoulder", behind: "a dim bar with pink and amber neon" },
  dex: { g: "him", moods: true, who: "a white man of 58, bald on top with short gray hair at the sides, a gray mustache, wire-rimmed glasses, a dark green button-up shirt open at the collar and a thin gold chain", behind: "the back booth of a dim bar" },
  marcus: { g: "him", moods: true, who: "a Black man of 25 with a short fade haircut, a goatee and one small stud earring, wearing a blue long-sleeved race jersey with white shoulders and no lettering", behind: "a boat ramp and a lake in bright sun" },
  sal: { g: "him", moods: true, who: "a man of 62 with olive skin, slicked-back dark hair going gray at the temples, clean-shaven, in a charcoal suit, white shirt and dark gold tie", behind: "the shelves of a pawn shop" },
  june: { g: "her", moods: true, who: "a woman of 41 with a lean, strong boxer's build, straight black hair in a tight ponytail and a thin old scar through her left eyebrow, wearing a purple athletic tank top", behind: "a boxing gym with heavy bags" },
  tommy: { g: "him", moods: true, who: "a white man of 68 with a weathered face and a gray beard, a faded plain blue ball cap, and a gray mechanic's work shirt with a red shop rag over one shoulder", behind: "a marine repair garage" },
  kow: { g: "him", moods: true, who: "a white man of 51 with a tired, decent face and a brown mustache, wearing a dark navy police uniform shirt and a peaked police cap with a plain metal badge that has no words on it", behind: "a city street in morning light" },
  reyes: { g: "her", who: "a Latina woman of 34 with dark hair in a low bun under a peaked police cap with a plain metal badge that has no words on it, wearing a dark navy police uniform shirt", face: "stern and by the book", behind: "a city street at dusk with red and blue lights" },
  vance: { g: "him", who: "a pale white man of 48 with neat dark hair, clean-shaven, wearing a camel overcoat over a black turtleneck", face: "calm and cold, faintly amused", behind: "a foggy freight dock at dusk" },
  carol: { g: "her", who: "a white woman of 61 with a gray bob haircut, wearing a white dress shirt, a black bow tie and a burgundy vest, the clothes of a card dealer", face: "stony, giving nothing away", behind: "a dim back room and a green felt card table" },
  ia: { g: "her", who: "a woman of 45 with a dark chin-length bob, wearing a gray suit jacket, a white shirt and a dark tie", face: "guarded and professional", behind: "a plain gray office" },
  // the crew is nobody in particular: a hood, a streetlight, and most of the face left in shadow
  crew: { g: "him", who: "a man of 27 in a dark hoodie with the hood up, lit from above by one streetlight so that hard shadow hides most of his face and only the jaw, the mouth and a glint of the eyes catch the light", face: "set and unfriendly", behind: "a city alley at night" },
};
export const MOODS: Record<string, string> = {
  up: "a warm, easy smile that reaches the eyes, as if a friend has just walked in",
  down: "worried and worn out: brow drawn, lips pressed together, tired eyes",
  cold: "cold and unwelcoming: a hard flat stare, jaw set, no trace of a smile",
};

export const CATALOG: Record<string, Spec> = { ...PLACES };
for (const [k, s] of Object.entries(PEOPLE)) {
  CATALOG[k + "-flat"] = { ar: "1:1", p: `${PLOOK} The subject is ${s.who}. Expression: ${s.face || "neutral and watchful, mouth closed"}. Behind ${s.g}, out of focus: ${s.behind}. ${PRULES}` };
  if (s.moods) for (const [m, look] of Object.entries(MOODS))
    CATALOG[k + "-" + m] = { ar: "1:1", from: k + "-flat", p: `Edit this portrait. It must stay the same invented person: the same face, age, skin, hair, clothes, background, framing and light. Change only the expression: ${look}. Keep it photorealistic, like the next frame from the same camera. ${PRULES}` };
}

// A picture's tag is a short hash of everything that decides what it looks like: its own words and, for an edited picture,
// the tag of the one it was made from. Change a prompt and the tag changes, so the old picture is simply never asked for
// again and no cache has to be cleared. VER changes every tag at once.
const VER = "1";
const TAGS: Record<string, string> = {};
export function tagOf(key: string): string {
  if (!Object.hasOwn(CATALOG, key)) throw new Error("no such picture: " + key);
  if (TAGS[key]) return TAGS[key];
  const s = CATALOG[key];
  return (TAGS[key] = createHash("sha256").update([VER, s.ar, s.p, s.from ? tagOf(s.from) : ""].join("|")).digest("hex").slice(0, 10));
}
const idOf = (key: string) => key + "." + tagOf(key);

// ---- the image model ----
export type Img = { type: string; data: Uint8Array; model?: string };
export type Gen = (spec: Spec, base?: Img) => Promise<Img>;
// Thrown by a Gen. soft means the attempt cost nothing and says nothing about the prompt (the gateway was busy, away, or
// refused the request outright), so it is not counted against the picture. What is counted is an answer that was paid for
// and had no picture in it.
export class GenError extends Error {
  soft: boolean; wait: number;
  constructor(msg: string, soft = false, wait = 0) { super(msg); this.soft = soft; this.wait = wait; }
}

// Models the gateway serves that make pictures, best first. HS_ART_MODEL puts another at the front.
export const MODELS = ["gemini-3.1-flash-image", "gemini-2.5-flash-image"];
type Env = (k: string) => string | undefined;
export const gateway = (env: Env) => !!(env("GOOGLE_GEMINI_BASE_URL") && env("GEMINI_API_KEY"));
export const enabled = (env: Env) => gateway(env) && (env("HS_ART") || "").toLowerCase() !== "off";

// Asks Gemini for one picture. With a base picture it is an edit of that picture. This is the request Google's own SDK
// sends (the address under GOOGLE_GEMINI_BASE_URL, the key in x-goog-api-key, the same JSON), written out with fetch so the
// function carries no SDK and the test can stand in for the network.
export function gemini(env: Env, fetchFn: typeof fetch = fetch): Gen {
  const models = [...new Set([env("HS_ART_MODEL"), ...MODELS].filter(Boolean))] as string[];
  let at = 0, looked = false;   // at: the model in use; it moves on if the gateway does not have one
  // Models come and go. If none on the list is served any more, ask the gateway once which picture models it has now.
  const more = async (): Promise<boolean> => {
    if (looked) return false;
    looked = true;
    try {
      const r = await fetchFn("https://api.netlify.com/api/v1/ai-gateway/providers/detailed");
      const found = [...new Set((await r.text()).match(/gemini-[a-z0-9.-]*image[a-z0-9.-]*/g) || [])].filter(m => !models.includes(m));
      found.sort((a, b) => +/pro/.test(a) - +/pro/.test(b));   // the dearer "pro" models last
      models.push(...found);
      return found.length > 0;
    } catch { return false; }
  };
  return async (spec, base) => {
    const parts: any[] = [];
    if (base) parts.push({ inlineData: { mimeType: base.type, data: Buffer.from(base.data).toString("base64") } });
    parts.push({ text: spec.p });
    // How the picture's shape and size are asked for, from the full form down to the plainest, for a model that refuses one:
    // 2 names the shape and the size (1K: about a thousand pixels on the short side), 1 the shape only, 0 neither (the prompt
    // names the shape too) and allows words beside the picture.
    const form = (level: number) => level === 2 ? { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: spec.ar, imageSize: "1K" } }
      : level === 1 ? { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: spec.ar } } : { responseModalities: ["TEXT", "IMAGE"] };
    const ask = (model: string, level: number) => fetchFn(`${(env("GOOGLE_GEMINI_BASE_URL") || "").replace(/\/+$/, "")}/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": env("GEMINI_API_KEY") || "" },
      body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: form(level) }),
      signal: AbortSignal.timeout(120_000),   // generous: this runs in a background function, which has minutes
    });
    let r: Response, level = 2;
    for (;;) {
      try { r = await ask(models[at], level); }
      catch (e: any) { throw new GenError("no answer from the gateway: " + (e?.name || e?.message || e), true, 30); }
      if (r.ok) break;
      const why = (await r.text().catch(() => "")).slice(0, 300);
      if (r.status === 429) throw new GenError("the gateway is rate-limited", true, 60);
      if (r.status === 404 && (at < models.length - 1 || await more())) { at++; level = 2; continue; }   // not a model this gateway has
      if (r.status === 400 && level > 0) { level--; continue; }   // perhaps a model without that setting: ask more plainly
      if (r.status === 400 && at < models.length - 1) { at++; level = 2; continue; }
      // refused or broken before any picture was made: nothing was spent, so try again later rather than count it
      throw new GenError(`gateway ${r.status} from ${models[at]}: ${why}`, true, r.status === 400 || r.status === 404 ? 600 : 120);
    }
    const j: any = await r.json().catch(() => null), c = j?.candidates?.[0];
    // a model that thinks may send sketches first; the picture is the last part that is not a thought
    const pic = (c?.content?.parts || []).filter((p: any) => (p.inlineData || p.inline_data)?.data && !p.thought).pop();
    const d = pic && (pic.inlineData || pic.inline_data);
    if (!d) throw new GenError("no picture came back: " + (j?.promptFeedback?.blockReason || c?.finishReason || "empty"));
    const data = new Uint8Array(Buffer.from(d.data, "base64"));
    if (data.length < 2000) throw new GenError("the picture that came back is too small to be one");
    return { type: d.mimeType || d.mime_type || "image/png", data, model: models[at] };
  };
}

// ---- keeping them ----
// store is a Netlify Blobs store (or the test's stand-in). Pictures are kept under img/, locks under lock/, and a note of
// failed attempts under fail/, each named by picture and tag.
const LOCK_MS = 150_000;         // longer than one picture is allowed to take, so a lock left by a crash clears itself
const STRIKES = 3, REST_MS = 7 * 864e5;
type Out = { status: number; body: Record<string, unknown> };
const out = (status: number, body: Record<string, unknown>): Out => ({ status, body });

// Where things stand: ready is every picture that exists, as {picture: tag}; rest is every one that does not; busy is those
// being made right now (a picture counts as busy while the one it is edited from is being made); gone is those that have
// failed too often, and anything edited from them; note is the latest failure. The city asks for this as it opens, and
// every few seconds while it is waiting for a picture.
export async function manifest(store: any, on: boolean, now = Date.now()): Promise<Record<string, unknown>> {
  const ready: Record<string, string> = {}, locked: string[] = [], failed: string[] = [];
  const { blobs } = await store.list();   // pictures, locks and failure notes together: a few hundred short names at most
  for (const b of blobs) {
    const name = String(b.key), slash = name.indexOf("/"), dot = name.lastIndexOf("."), key = name.slice(slash + 1, dot);
    if (slash < 0 || dot < slash || !Object.hasOwn(CATALOG, key) || tagOf(key) !== name.slice(dot + 1)) continue;
    const kind = name.slice(0, slash);
    if (kind === "img") ready[key] = tagOf(key); else if (kind === "lock") locked.push(key); else if (kind === "fail") failed.push(key);
  }
  const live = new Set<string>(), dead = new Set<string>();
  for (const key of locked) { const l = await store.get("lock/" + idOf(key), { type: "json" }); if (l && now - (l.t || 0) < LOCK_MS) live.add(key); }
  for (const key of failed) { const f = await store.get("fail/" + idOf(key), { type: "json" }); if (f && f.n >= STRIKES && now - f.t < REST_MS) dead.add(key); }
  const up = (key: string, set: Set<string>): boolean => set.has(key) || (!!CATALOG[key].from && up(CATALOG[key].from as string, set));
  const rest = Object.keys(CATALOG).filter(k => !ready[k]);
  const note = await store.get("note", { type: "json" });   // the latest failure, if it is from the last hour
  // rest is every picture not made yet, in the order they should be made (a picture after the one it is edited from)
  return { on, total: Object.keys(CATALOG).length, ready, rest, busy: rest.filter(k => up(k, live)), gone: rest.filter(k => up(k, dead)),
    ...(note && now - note.t < 36e5 ? { note: { key: String(note.key), why: String(note.why), ago: Math.round((now - note.t) / 1000) } } : {}) };
}

// One picture, for the address /api/art/<tag>/<picture>. Null if there is no such picture or it has not been made.
export async function fetchImg(store: any, tag: string, key: string): Promise<{ data: ReadableStream; type: string } | null> {
  if (!Object.hasOwn(CATALOG, key) || tagOf(key) !== tag) return null;
  const hit = await store.getWithMetadata("img/" + idOf(key), { type: "stream" });
  return hit ? { data: hit.data, type: String(hit.metadata?.type || "image/png") } : null;
}

// Makes one picture if it has not been made. What it answers:
//   {ok:true, key, tag}            it exists now (made is true if this call made it)
//   {ok:false, again:true, ...}    the picture it is edited from had to be made first and now exists (key and tag are that one's)
//   {ok:false, wait:seconds}       someone else is making it, or the gateway is busy
//   {error:"gone"}                 it has failed too often; leave it alone
//   {error:"off"}                  making is switched off
// makeAll below is what the function calls: it keeps going until the picture asked for exists or cannot be made.
export async function make(key: string, d: { store: any; gen: Gen; on: boolean; now?: number }): Promise<Out> {
  if (typeof key !== "string" || !Object.hasOwn(CATALOG, key)) return out(400, { error: "unknown picture" });
  const { store } = d, now = d.now ?? Date.now(), spec = CATALOG[key], tag = tagOf(key), id = idOf(key);
  if (await store.getMetadata("img/" + id)) return out(200, { ok: true, key, tag });
  if (!d.on) return out(503, { error: "off" });
  let base: Img | undefined;
  if (spec.from) {
    const got = await store.getWithMetadata("img/" + idOf(spec.from), { type: "arrayBuffer" });
    if (!got) {   // make the picture this one is edited from, and let the city ask again for this one
      const r = await make(spec.from, d);
      return r.body.ok ? out(200, { ok: false, again: true, key: r.body.key, tag: r.body.tag }) : r;
    }
    base = { type: String(got.metadata?.type || "image/png"), data: new Uint8Array(got.data) };
  }
  const fail = await store.get("fail/" + id, { type: "json" });
  if (fail && fail.n >= STRIKES && now - fail.t < REST_MS) return out(410, { error: "gone" });
  // one maker at a time: the lock is taken only if nobody holds it, or if the holder is long past the time a function may run
  const mine = { t: now };
  let took = (await store.setJSON("lock/" + id, mine, { onlyIfNew: true })).modified;
  if (!took) {
    const cur = await store.getWithMetadata("lock/" + id, { type: "json" });
    if (cur && now - (cur.data?.t || 0) < LOCK_MS) return out(200, { ok: false, wait: 8 });
    took = cur ? (await store.setJSON("lock/" + id, mine, { onlyIfMatch: cur.etag })).modified : (await store.setJSON("lock/" + id, mine, { onlyIfNew: true })).modified;
    if (!took) return out(200, { ok: false, wait: 8 });
  }
  try {
    const img = await d.gen(spec, base);
    const bytes = img.data.buffer.slice(img.data.byteOffset, img.data.byteOffset + img.data.byteLength) as ArrayBuffer;   // Blobs takes an ArrayBuffer
    await store.set("img/" + id, bytes, { metadata: { type: img.type, model: img.model || "", at: new Date(now).toISOString() }, onlyIfNew: true });
    return out(200, { ok: true, key, tag, made: true });
  } catch (e: any) {
    const soft = e instanceof GenError && e.soft;
    console.error("art: " + key + " failed:", e?.message || e);
    // the latest failure is kept where the list of pictures can show it, so a fault can be read without the function logs
    await store.setJSON("note", { t: now, key, why: String(e?.message || e).slice(0, 200) }).catch(() => {});
    if (soft) return out(200, { ok: false, wait: e.wait || 60 });
    const n = fail && now - fail.t < REST_MS ? fail.n + 1 : 1;
    await store.setJSON("fail/" + id, { n, t: now, why: String(e?.message || e).slice(0, 200) });
    return n >= STRIKES ? out(410, { error: "gone" }) : out(200, { ok: false, wait: 20 * n });
  } finally {
    await store.delete("lock/" + id).catch(() => {});
  }
}

// Makes a picture and, first, whatever it is edited from (two edits deep at most).
export async function makeAll(key: string, d: { store: any; gen: Gen; on: boolean; now?: number }): Promise<Out> {
  let r = await make(key, d);
  for (let i = 0; i < 3 && r.body.again; i++) r = await make(key, d);
  return r;
}
