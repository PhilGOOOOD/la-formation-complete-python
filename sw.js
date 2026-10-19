// Service worker de Code en ville : garde une copie du jeu pour l'utiliser hors connexion.
// - la page est demandée au réseau en priorité (pour recevoir les mises à jour), sinon la copie est servie ;
// - les autres fichiers (icônes, manifeste) sont servis depuis la copie.
const CACHE = 'code-en-ville-9ff0368c4927';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './maskable-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('code-en-ville-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put('./index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('./index.html', { ignoreSearch: true })),
    );
    return;
  }
  event.respondWith(caches.match(request, { ignoreSearch: true }).then((hit) => hit || fetch(request)));
});
