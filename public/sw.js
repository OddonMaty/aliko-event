// Service worker d'Aliko Event : affiche les alertes de nouvelles réponses.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  event.waitUntil(
    self.registration.showNotification("Nouvelle réponse à votre invitation", {
      body: "Un invité vient de répondre. Touchez pour voir sa réponse.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "aliko-reponse",
      renotify: true,
      data: { url: "/notifications" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/notifications";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
