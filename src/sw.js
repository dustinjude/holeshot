// Offline support. build.mjs fills in VERSION (a hash of the build) and FILES (everything in dist/), so an installed
// copy updates itself when a new build is published. Fonts are cached the first time they load.
const VERSION = '__VERSION__';
const FILES = __FILES__;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(hit => hit || fetch(e.request).then(r => {
    if (r && (r.ok || r.type === 'opaque') && /fonts\.(googleapis|gstatic)\.com/.test(e.request.url)) {
      const c = r.clone(); caches.open(VERSION).then(x => x.put(e.request, c));
    }
    return r;
  }).catch(() => caches.match('index.html'))));
});
