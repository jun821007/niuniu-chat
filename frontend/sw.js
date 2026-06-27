const CACHE_NAME = "niuniu-chat-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon.svg",
  "https://telegram.org/js/telegram-web-app.js",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS).catch(function () {
        /* 離線快取失敗不阻擋安裝 */
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      var fetched = fetch(event.request).then(function (response) {
        if (response && response.status === 200 && response.type === "basic") {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function () {
        return cached;
      });
      return cached || fetched;
    })
  );
});
