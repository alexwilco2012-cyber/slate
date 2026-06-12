/* Slate — offline cache. Cache-first for the app shell. */
const CACHE = 'slate-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-maskable.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const cachePut = res => {
    if (res.ok && (new URL(e.request.url).origin === location.origin || e.request.url.includes('fonts.g'))) {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
    }
    return res;
  };
  // Documents: network-first so updates land, cache as offline fallback
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(fetch(e.request).then(cachePut).catch(() => caches.match(e.request).then(h => h || caches.match('./index.html'))));
    return;
  }
  // Everything else: cache-first
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(cachePut).catch(() => caches.match('./index.html'))));
});
