const CACHE_NAME = 'pulse-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  // Skip caching and interception for API requests
  if (e.request.url.includes('/api/')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((response) => {
        // Cache new successful GET requests for static assets
        if (e.request.method === 'GET' && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // Fail-safe offline fallback if required
      });
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Handle incoming background Web Push notifications
self.addEventListener('push', (e) => {
  let data = { title: 'New Notification', body: '' };
  try {
    data = e.data.json();
  } catch (err) {
    if (e.data) {
      data = { title: 'Pulse Message', body: e.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      teamId: data.teamId,
      channelId: data.channelId
    }
  };

  e.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle clicking on background notification banner
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const clickAction = e.notification.data || {};
  
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and redirect
      for (const client of clientList) {
        if ('focus' in client) {
          if (clickAction.teamId) {
            // We can send a message to the client to update active team/channel
            client.postMessage({
              type: 'NAVIGATE_TO',
              teamId: clickAction.teamId,
              channelId: clickAction.channelId
            });
          }
          return client.focus();
        }
      }
      // If no window is open, open a new one with navigation parameters
      if (clients.openWindow) {
        let url = '/';
        if (clickAction.teamId) {
          url = `/?team=${clickAction.teamId}&channel=${clickAction.channelId}`;
        }
        return clients.openWindow(url);
      }
    })
  );
});
