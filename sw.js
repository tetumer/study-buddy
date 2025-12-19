// sw.js
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("studybuddy-cache").then(cache => {
      return cache.addAll([
        "index.html",
        "style.css",
        "script.js",
        "icon.png"
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

// Basic offline fetch
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});

// Listen for timer start messages
self.addEventListener("message", event => {
  if (event.data && event.data.type === "START_TIMER") {
    const { subject, durationMs } = event.data;
    setTimeout(() => {
      self.registration.showNotification("Study Buddy", {
        body: `⏰ Your ${subject} session has ended.`,
        icon: "icon.png",
        requireInteraction: true
      });
    }, durationMs);
  }
});
