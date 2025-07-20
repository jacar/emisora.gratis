const CACHE_NAME = 'radio-gratis-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.css',
  '/favicon.svg',
  '/logo.svg',
  '/logo-dark.svg',
  '/site.webmanifest',
  // Puedes agregar más recursos estáticos aquí si los tienes
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .catch(() => {})
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  // Estrategia: network first para la API de radio-browser, cache first para recursos estáticos
  if (url.includes('radio-browser.info')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Opcional: cachear la respuesta de la API si es válida
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request).catch(() => {
            // Si falla el fetch, retornar una respuesta por defecto
            return new Response('Offline', { status: 503, statusText: 'Offline' });
          });
        })
    );
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 