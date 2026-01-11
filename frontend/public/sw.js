const CACHE_NAME = 'gosky-v1';
const STATIC_CACHE = 'gosky-static-v1';
const DYNAMIC_CACHE = 'gosky-dynamic-v1';

// Önbelleğe alınacak statik dosyalar
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/images/paragliding.webp',
    '/images/gyrocopter.webp',
    '/images/balloon.webp'
];

// Install: Statik dosyaları önbelleğe al
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('Service Worker: Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: Eski önbellekleri temizle
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch: Cache-first stratejisi
self.addEventListener('fetch', (event) => {
    // API isteklerini önbelleğe alma
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    return response;
                })
                .catch(() => {
                    return new Response(JSON.stringify({ error: 'Çevrimdışı' }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
        return;
    }

    // Statik dosyalar için cache-first
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then((response) => {
                // Geçerli bir response değilse önbelleğe alma
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Dinamik önbelleğe ekle
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE).then((cache) => {
                    cache.put(event.request, responseClone);
                });

                return response;
            });
        })
    );
});

// Push bildirimleri
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};

    const options = {
        body: data.body || 'Yeni bir bildiriminiz var',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'GoSkyTurkey', options)
    );
});

// Bildirime tıklama
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
