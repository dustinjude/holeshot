// Offline support. build.mjs fills in VERSION (a hash of the build) and FILES (everything in dist/), so an installed
// copy updates itself when a new build is published. Fonts are cached the first time they load.
// The city's photographs are kept in a cache of their own (ART) that outlives new builds: a picture's address changes
// whenever the picture does, so a kept copy is never out of date.
const VERSION = '__VERSION__';
const FILES = __FILES__;
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
