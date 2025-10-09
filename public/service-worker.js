// Service Worker para PWA - Inventario de Bar
const CACHE_NAME = 'inventario-bar-v1.0.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/manifest.json',
  '/favicon.ico'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache abierto');
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})));
      })
      .catch((error) => {
        console.log('❌ Error al cachear:', error);
      })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interceptar peticiones (Fetch)
self.addEventListener('fetch', (event) => {
  // Solo cachear peticiones GET
  if (event.request.method !== 'GET') return;
  
  // No cachear peticiones a Firebase
  if (event.request.url.includes('firebasestorage.googleapis.com') ||
      event.request.url.includes('firebaseio.com') ||
      event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - devolver respuesta del cache
        if (response) {
          return response;
        }

        // Clone la petición
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Verificar respuesta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone la respuesta
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Si falla, mostrar página offline (opcional)
          return caches.match('/');
        });
      })
  );
});