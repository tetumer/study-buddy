// sw.js

// Install: cache core files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("studybuddy-cache").then(cache =>
      cache.addAll([
        "index.html",
        "style.css",
        "main.js",
        "icon.png"
      ])
    )
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

// Cache-first fetch
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});

// Listen for messages from the page
self.addEventListener("message", event => {
  const data = event.data || {};
  if (data.type === "START_TIMER") {
    const { subject, targetTime } = data;
    const delay = Math.max(0, targetTime - Date.now());

    // Best-effort scheduling (short timers only)
    setTimeout(() => {
      self.registration.showNotification("Study Buddy", {
        body: `⏰ Your ${subject} session has ended.`,
        icon: "icon.png",
        requireInteraction: true
      });
    }, delay);
  } else if (data.type === "CANCEL_TIMER") {
    // No-op here, but you could clearTimeout if you track it
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      const client = clients.find(c => c.url.includes("index.html")) || clients[0];
      if (client) return client.focus();
      return self.clients.openWindow("index.html");
    })
  );
});
