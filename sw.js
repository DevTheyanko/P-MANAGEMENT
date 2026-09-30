const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = `masas-${VERSION}`;

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'fonts/bricolage-grotesque-latin-wght-normal.woff2',
  'vendor/html2canvas.min.js',
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
  'generador-pin.html',
  'generador-pin.js',
];

// Si un solo archivo falla (red lenta, un recurso opcional caído, etc.) no
// debe tumbar ni colgar la instalación: eso es lo que deja la app "instalando"
// para siempre en algunos Android. Los críticos se reintentan una vez; el
// resto se ignora si falla. Todo el paso tiene además un tope de 4 s.
const CRITICAL = new Set(['./', 'index.html', 'manifest.webmanifest', 'css/app.css', 'js/app.js', 'js/boot-theme.js', 'js/theme.js', 'js/ui.js', 'js/views.js', 'js/config.js']);

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const work = Promise.allSettled(
        SHELL.map(async (url) => {
          const req = new Request(url, { cache: 'reload' });
          try {
            let res = await fetch(req);
            if (!res.ok) throw new Error(String(res.status));
            await cache.put(url, res);
          } catch (e) {
            if (!CRITICAL.has(url)) return; // no crítico: seguimos sin él
            try {
              const res = await fetch(req); // un reintento para los críticos
              if (res.ok) await cache.put(url, res);
            } catch (e2) {
              console.warn('No se pudo precargar', url, e2);
            }
          }
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
