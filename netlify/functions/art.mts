// Side Hustle City's photographs, served. Two addresses:
//   GET /api/art                where things stand, as {on, total, ready: {picture: tag}, busy: [...], gone: [...]}
//   GET /api/art/<tag>/<name>   one picture, exactly as the image model made it
// The city does not show these directly: it asks Netlify's Image CDN for a small WebP cut from them
// (/.netlify/images?url=/api/art/...), and the CDN fetches the original from here once.
// Nothing here makes a picture or spends anything; that is artmake.mts. What they show and how they are kept is in
// ../lib/art.mts. A picture's address carries its tag, which changes whenever its prompt does, so it can be cached for good.
import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { enabled, fetchImg, manifest } from "../lib/art.mts";

const env = (k: string): string | undefined => (globalThis as any).Netlify?.env?.get(k) ?? process.env[k];
const fresh = { "cache-control": "no-store" };

export default async (req: Request, context: Context) => {
  // Site-wide, so a picture made from a deploy preview is there for the live site too. Strong consistency, so a picture can be
  // read the moment it has been written.
  const store = getStore({ name: "art", consistency: "strong" });
  const { tag, key } = context.params || {};
  try {
    if (!key) return Response.json(await manifest(store, enabled(env)), { headers: fresh });
    const img = await fetchImg(store, String(tag), String(key));
    if (!img) return new Response("no such picture", { status: 404, headers: fresh });
    return new Response(img.data, { headers: {
      "content-type": img.type,
      "cache-control": "public, max-age=31536000, immutable",
      "netlify-cdn-cache-control": "public, durable, max-age=31536000, immutable",
    } });
  } catch (e: any) {
    console.error("art failed:", e?.message || e);
    return new Response("failed", { status: 502, headers: fresh });
  }
};

export const config: Config = { path: ["/api/art", "/api/art/:tag/:key"], method: "GET" };
