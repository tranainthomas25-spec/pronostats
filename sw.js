const CACHE = 'pronostats-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Fichiers de l'appli : affichés depuis le cache, puis rafraîchis en arrière-plan.
// Les données (Google) passent toujours par le réseau.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const memeSite = url.origin === location.origin;
  const polices = url.host.endsWith('fonts.googleapis.com') || url.host.endsWith('fonts.gstatic.com');
  if (!memeSite && !polices) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const enCache = await c.match(req);
    const reseau = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => enCache);
    return enCache || reseau;
  }));
});
