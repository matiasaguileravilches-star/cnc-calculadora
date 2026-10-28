/**
 * Service worker: guarda la app en el celular para usarla sin internet.
 * Al publicar una versión nueva, sube VERSION para que los celulares se actualicen.
 */
const VERSION = '1.2.0';
const CACHE = `cnc-${VERSION}`;
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Primero la red (para recibir actualizaciones); sin conexión, la copia guardada.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  // La página se pide siempre revalidando con el servidor, para no quedar con una versión vieja.
  const pedido = e.request.mode === 'navigate' ? fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(e.request);
  e.respondWith(
    pedido
      .then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)).catch(() => {}); return r; })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html'))),
  );
});
