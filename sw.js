// Service Worker — la versión llega por la URL (sw.js?v=APP_VERSION) desde config.js.
// Estrategia:
//  • Archivos de la app (HTML/JS/CSS): RED PRIMERO (siempre lo más nuevo);
//    si no hay internet o tarda más de 6 s → copia guardada.
//  • Fuentes, iconos y librerías fijas: caché primero (cambian solo con la versión).
//  • Google (Sheets/OAuth) y cualquier otro dominio: NO se toca. Los datos
//    nunca se cachean, así el inventario siempre se refresca al momento.

const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = `masas-${VERSION}`;

// Si agregas un archivo nuevo a la app, añádelo aquí para que funcione sin internet.
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'fonts/bricolage-grotesque-latin-wght-normal.woff2',
  'vendor/html2canvas.min.js',
  'js/app.js',
  'js/config.js',
  'js/icons.js',
  'js/modal.js',
  'js/report.js',
  'js/sheets.js',
  'js/store.js',
  'js/sync.js',
  'js/ui.js',
  'js/util.js',
  'js/views.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Si un solo archivo falla (red lenta, un recurso opcional caído, etc.)
      // no debe tumbar la instalación entera: eso es lo que deja la app
      // "instalando" para siempre en algunos Android. Los críticos (HTML/JS/CSS)
      // sí se reintentan una vez; el resto se ignora si falla.
      const critical = new Set(['./', 'index.html', 'manifest.webmanifest', 'css/app.css', 'js/app.js', 'js/ui.js', 'js/views.js', 'js/config.js']);
      const results = await Promise.allSettled(
        SHELL.map(async (url) => {
          const req = new Request(url, { cache: 'reload' });
          let res;
          try {
            res = await fetch(req);
            if (!res.ok) throw new Error(String(res.status));
          } catch (e) {
            if (!critical.has(url)) return; // no crítico: seguimos sin él
            res = await fetch(req); // un reintento para los críticos
          }
          if (res.ok) await cache.put(url, res);
        }),
      );
      results.forEach((r, i) => {
        if (r.status === 'rejected') console.warn('No se pudo precargar', SHELL[i], r.reason);
      });
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('masas-') && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Google APIs, etc.
  if (url.pathname.endsWith('/sw.js')) return;

  const fixed = /\/(fonts|icons|vendor)\//.test(url.pathname);
  event.respondWith(fixed ? cacheFirst(req) : networkFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(req, { cache: 'no-store', signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok && res.type === 'basic') cache.put(req, res.clone());
    return res;
  } catch {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') {
      const shell = await cache.match('index.html');
      if (shell) return shell;
    }
    return new Response('Sin conexión', { status: 503, statusText: 'Offline' });
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}
