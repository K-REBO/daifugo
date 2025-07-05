/**
 * Service Worker for Daifugo PWA
 * Provides offline support and caching
 */

const CACHE_NAME = 'daifugo-v1.0.0';
const STATIC_CACHE_URLS = [
  './',
  './index.html',
  './css/output.css',
  './js/main.js',
  './js/card.js',
  './manifest.json'
];

const DYNAMIC_CACHE_URLS = [
  './js/player.js',
  './js/game.js',
  './js/rules/',
  './rules/'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🎴 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('✅ Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('📱 Serving from cache:', event.request.url);
          return cachedResponse;
        }
        
        // Clone request for caching
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone response for caching
            const responseToCache = response.clone();
            
            // Cache dynamic assets
            if (shouldCache(event.request.url)) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  console.log('💾 Caching dynamic asset:', event.request.url);
                  cache.put(event.request, responseToCache);
                });
            }
            
            return response;
          })
          .catch((error) => {
            console.log('🔌 Network failed, serving offline page:', error);
            
            // Return offline fallback for HTML pages
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            
            throw error;
          });
      })
  );
});

// Helper function to determine if URL should be cached
function shouldCache(url) {
  return DYNAMIC_CACHE_URLS.some(pattern => {
    if (pattern.endsWith('/')) {
      return url.includes(pattern);
    }
    return url.includes(pattern);
  });
}

// Handle background sync for offline play data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-game-data') {
    event.waitUntil(syncGameData());
  }
});

async function syncGameData() {
  try {
    // Sync any pending game data when back online
    console.log('🔄 Syncing game data...');
    
    // Implementation for syncing offline game data
    // This would be used for multiplayer features
    
    console.log('✅ Game data synced');
  } catch (error) {
    console.error('❌ Failed to sync game data:', error);
  }
}

// Handle push notifications (for future multiplayer features)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: './assets/icons/icon-192x192.png',
    badge: './assets/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data,
    actions: [
      {
        action: 'open',
        title: 'ゲームを開く',
        icon: './assets/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: '閉じる'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});