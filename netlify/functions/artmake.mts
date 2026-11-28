// Side Hustle City's photographs, made. POST /api/art-make with {"key": "<picture>"} makes that picture if nobody has yet,
// through Netlify's AI Gateway, and keeps it. This is the only place that spends credits on pictures, so it is its own function
// with its own limit: only pictures on the list can be made, each once (see ../lib/art.mts for the list and the rest of the
// guard rails).
//
// It is a background function: the city gets "202 Accepted" at once and the work goes on for as long as the image model
// takes, which a function that has to answer within 60 seconds could not promise. The city finds out how it went by asking
// /api/art (art.mts) which pictures exist, are being made, or have been given up on.
import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { enabled, gemini, makeAll } from "../lib/art.mts";
import type { Gen } from "../lib/art.mts";

const env = (k: string): string | undefined => (globalThis as any).Netlify?.env?.get(k) ?? process.env[k];
let gen: Gen | undefined;   // kept between calls so it remembers which model the gateway has

// Reads the request and does the work. Returns a word for the log and the test; the caller never sees it.
export async function ask(req: Request, d: { store: () => any; gen: () => Gen; on: boolean }): Promise<string> {
  // only this site's own pages may ask
  const origin = req.headers.get("origin");
  if (origin) { try { if (new URL(origin).host !== new URL(req.url).host) return "forbidden"; } catch { return "forbidden"; } }
  let key: unknown;
  try { const t = await req.text(); if (t.length > 200) return "too long"; key = JSON.parse(t)?.key; } catch { return "bad json"; }
  if (typeof key !== "string") return "bad json";
  const r = await makeAll(key, { store: d.store(), gen: d.gen(), on: d.on });
  return r.body.ok ? (r.body.made ? "made" : "there") : String(r.body.error || (r.body.wait ? "wait" : "again"));
}

export default async (req: Request) => {
  // Nothing may be thrown from here: Netlify runs a background function again if it fails, and the work must not be paid for twice.
  try {
    const how = await ask(req, { store: () => getStore({ name: "art", consistency: "strong" }), gen: () => (gen = gen || gemini(env)), on: enabled(env) });
    if (how !== "made" && how !== "there") console.log("artmake:", how);
  } catch (e: any) { console.error("artmake failed:", e?.message || e); }
};

// A screen asks for two at a time and waits a few seconds on each, so this is more than one player can use. What it guards is
// the function being hammered; what can be spent is already capped by the list.
export const config: Config = {
  path: "/api/art-make",
  method: "POST",
  background: true,
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 60 },
};
