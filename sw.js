const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = `masas-${VERSION}`;

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'css/calc.css',
  'fonts/bricolage-grotesque-latin-wght-normal.woff2',
  'js/app.js',
  'js/calculadora.js',
  'js/boot-theme.js',
  'js/config.js',
  'js/icons.js',
  'js/modal.js',
  'js/report.js',
  'js/sheets.js',
  'js/store.js',
  'js/sync.js',
  'js/theme.js',
  'js/ui.js',
  'js/util.js',
  'js/views.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-192.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const work = Promise.allSettled(
        SHELL.map(async (url) => {
          try {
            const res = await fetch(new Request(url, { cache: 'reload' }));
            if (res.ok) await cache.put(url, res);
          } catch (e) {}
        }),
      );
      await Promise.race([work, new Promise((r) => setTimeout(r, 4000))]);
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
    const res = await fetch(req.mode === 'navigate' ? req.url : req, { cache: 'no-store', signal: ctrl.signal });
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
