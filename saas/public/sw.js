const CACHE = "luz-divina-v2";
const STATIC = ["/", "/dashboard", "/manifest.json"];

self.addEventListener("install", (e) =>
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC)))
);

self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
);

self.addEventListener("push", (e) => {
  const data = e.data?.json() ?? {};
  e.waitUntil(
    self.registration.showNotification(data.title ?? "Luz Divina", {
      body: data.body ?? "Não esqueça seu devocional hoje! 🙏",
      icon: "/cross-crown.svg",
      badge: "/cross-crown.svg",
      tag: "luz-divina",
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow("/dashboard"));
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("/api/")) {
    // Network first para APIs
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  } else {
    // Cache first para assets estáticos
    e.respondWith(
      caches.match(e.request).then((r) => r || fetch(e.request))
    );
  }
});
