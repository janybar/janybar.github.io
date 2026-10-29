const CACHE = 'quiet-water-v17';
const ASSETS = ['./', './index.html', './style.css', './game.js', './pour-animation.js', './victory.js', './solver.js', './solver-worker.js', './fonts/NotoSans-Regular.ttf', './fonts/NotoSans-Bold.ttf', './fonts/NotoSerif-Regular.ttf', './fonts/NotoSerif-Italic.ttf'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('quiet-water-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(request).then(async response => {
    if (response.ok) {
      const copy = response.clone();
      try { await caches.open(CACHE).then(cache => cache.put(request, copy)); } catch (_) { /* The network response is still usable. */ }
    }
    return response;
  }).catch(async () => (await caches.match(request)) || (request.mode === 'navigate' ? await caches.match('./index.html') : Response.error())));
});
