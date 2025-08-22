const CACHE_NAME = 'dashboard-apps-v4';
const urlsToCache = [
  '/hiit-timer.html',
  '/hiit-timer.css',
  '/hiit-timer.js',
  '/checklist.html',
  '/checklist.css',
  '/checklist.js',
  '/photo-to-pdf.html',
  '/photo-to-pdf.css',
  '/photo-to-pdf.js',
  '/game/index.html',
  '/game/world.html',
  '/libs/tesseract.min.js',
  '/libs/pdf-lib.min.js',
  '/styles.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});