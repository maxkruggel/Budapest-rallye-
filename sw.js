/* =========================================================
   Service Worker: Offline-Fähigkeit + Benachrichtigungs-Basis
   Strategie: network-first mit Cache-Fallback (nie veraltete
   App-Dateien, aber alles – inkl. Erzähler-MP3s – läuft offline,
   sobald es einmal geladen wurde).
   ========================================================= */

const CACHE = 'br-cache-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // Karten-Tiles etc. nicht anfassen

  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && res.ok) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    } catch (err) {
      const hit = await caches.match(req);
      if (hit) return hit;
      throw err;
    }
  })());
});

/* Tap auf eine Benachrichtigung: App in den Vordergrund holen */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (wins.length) return wins[0].focus();
    return self.clients.openWindow('.');
  })());
});
