// path: /sw.js

const CACHE_NAME = "habitquest-v2"; // Updated version to trigger cache refresh
const STATIC_CACHE = "static-v2";
const DYNAMIC_CACHE = "dynamic-v2";

const staticAssets = [
  "./",
  "./index.html",
  // CRITICAL FIX: Corrected paths to reference subdirectories
  "./css/style.css",
  "./js/app.js",
  "./js/db.js",
  "./js/achievements.js",
  "./js/sounds.js",
  // Remaining static assets
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./assets/avatar.png",
];

self.addEventListener("install", (event) => {
  console.log("Service Worker installing.");
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("Caching static assets");
      return cache.addAll(staticAssets).catch((err) => {
        console.error("Error caching assets:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating.");
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            console.log("Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request).then((fetchResponse) => {
          // Check if we received a valid response
          if (
            !fetchResponse ||
            fetchResponse.status !== 200 ||
            fetchResponse.type !== "basic"
          ) {
            return fetchResponse;
          }

          // Clone the response
          const responseToCache = fetchResponse.clone();

          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return fetchResponse;
        });
      })
      .catch(() => {
        // If both cache and network fail, show offline page (index.html)
        if (event.request.url.includes(".html")) {
          return caches.match("./index.html");
        }
        // General fallback for images/assets if needed
      })
  );
});

// Background sync for habit completions (logic placeholders)
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    console.log("Background sync triggered");
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log("Performing background sync");
}

// Push notifications (logic placeholders)
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || "Don't forget your quests today!",
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "open",
        title: "Open App",
      },
      {
        action: "close",
        title: "Close",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "HabitQuest", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "open") {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === "./" && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("./");
        }
      })
    );
  }
});
