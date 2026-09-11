const CACHE_NAME = "daily-timeline-v2";

const APP_FILES = [
"./",
"./index.html",
"./style.css",
"./app.js",
"./manifest.json"
];

self.addEventListener("install", (event) => {
event.waitUntil(
caches.open(CACHE_NAME).then((cache) => {
return cache.addAll(APP_FILES);
})
);


self.skipWaiting();


});

self.addEventListener("activate", (event) => {
event.waitUntil(
caches.keys().then((cacheNames) => {
return Promise.all(
cacheNames
.filter((cacheName) => cacheName !== CACHE_NAME)
.map((cacheName) => caches.delete(cacheName))
);
})
);


self.clients.claim();


});

self.addEventListener("fetch", (event) => {
if (event.request.method !== "GET") {
return;
}


event.respondWith(
    fetch(event.request)
        .then((networkResponse) => {
            if (
                networkResponse &&
                networkResponse.status === 200 &&
                networkResponse.type === "basic"
            ) {
                const responseClone = networkResponse.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
            }

            return networkResponse;
        })
        .catch(() => {
            return caches.match(event.request);
        })
);

});
