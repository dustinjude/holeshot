// Offline support. build.mjs fills in VERSION (a hash of the build) and FILES (everything in dist/), so an installed
// copy updates itself when a new build is published. Fonts are cached the first time they load.
// The city's photographs are kept in a cache of their own (ART) that outlives new builds: a picture's address changes
// whenever the picture does, so a kept copy is never out of date.
const VERSION = "holeshot-7bb460e9fd";
const FILES = ["./","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","js/GLTFLoader.js","js/city.js","js/game.js","js/three.min.js","manifest.webmanifest","models/green-black/model.json","models/green-black/tex0.jpg","models/green-black/tex1.jpg","models/green-black/tex2.jpg","models/rider-fly/model.json","models/rider-fly/tex0.jpg","models/rider-fly/tex1.jpg","models/rider-fly/tex2.jpg","models/ski-105/model.json","models/ski-105/tex0.jpg","models/ski-116/model.json","models/ski-116/tex0.jpg","models/ski-blue/model.json","models/ski-blue/tex0.jpg","models/vanjae-116/model.json","models/vanjae-116/tex0.jpg","models/vanjae-116/tex1.jpg","models/vanjae-116/tex2.jpg"];
const ART = 'holeshot-art-1';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== ART).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin === location.origin) {
    // a photograph: the kept copy if there is one, else fetch it and keep it. These are matched on the whole address,
    // because every picture shares the Image CDN's one path and differs only after the question mark.
    if (u.pathname === '/.netlify/images' || /^\/api\/art\/[^/]+\/[^/]+$/.test(u.pathname)) {
      e.respondWith(caches.open(ART).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => {
        if (r.ok) c.put(e.request, r.clone());
        return r;
      }))));
      return;
    }
    if (u.pathname.startsWith('/api/')) return;   // live answers: never from a cache, and never the page in their place
  }
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(hit => hit || fetch(e.request).then(r => {
    if (r && (r.ok || r.type === 'opaque') && /fonts\.(googleapis|gstatic)\.com/.test(e.request.url)) {
      const c = r.clone(); caches.open(VERSION).then(x => x.put(e.request, c));
    }
    return r;
  }).catch(() => caches.match('index.html'))));
});
