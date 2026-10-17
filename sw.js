// Service worker - CCLS Semences. Incrémentez CACHE_VERSION à chaque mise à jour des fichiers.
const CACHE_VERSION = "ccls-semences-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./lib/bootstrap.min.css",
  "./lib/xlsx.full.min.js",
  "./lib/fa/css/all.min.css",
  "./lib/fa/webfonts/fa-solid-900.woff2",
  "./lib/fa/webfonts/fa-regular-400.woff2",
  "./lib/fa/webfonts/fa-brands-400.woff2",
  "./lib/fa/webfonts/fa-v4compatibility.woff2",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord pour la page (pour recevoir les mises à jour), cache en secours hors ligne.
// Cache d'abord pour le reste.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put("./index.html", copy));
        return res;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }

  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
      return res;
    })));
  }
  // Ressources externes (image de fond): laissées au navigateur, ignorées hors ligne.
});
