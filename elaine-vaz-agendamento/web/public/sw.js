// Service worker mínimo — existe só para o navegador considerar o site
// "instalável" como app (PWA). Não faz cache nem funciona offline.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());
self.addEventListener("fetch", () => {});
