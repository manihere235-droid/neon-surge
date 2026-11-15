const CACHE = "neon-surge-v1";
const BASE = new URL("./", self.location.href).pathname;
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png"].map((p) => new URL(p, self.location.href).href);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("neon-surge-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    // Network first: a new deployment should not leave users on an old build.
    event.respondWith(fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        event.waitUntil(caches.open(CACHE).then((cache) => cache.put(req, copy)));
      }
      return res;
    }).catch(async () => (await caches.match(req)) || (await caches.match(new URL("index.html", self.location.href))) || new Response("Open Neon Surge once online to install it for offline play.", { status: 503 })));
    return;
  }
  event.respondWith(caches.match(req).then((cached) => cached || fetch(req).then((res) => {
    if (res.ok) {
      const copy = res.clone();
      event.waitUntil(caches.open(CACHE).then((cache) => cache.put(req, copy)));
    }
    return res;
  })));
});
