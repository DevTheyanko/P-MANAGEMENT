import { CONFIG } from './config.js';
import { ui } from './views.js';
import { initUI, renderHeader } from './ui.js';
import { applyBrandColor } from './theme.js';

applyBrandColor(CONFIG.BRAND_COLOR);
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  ui.installEvt = e;
});
window.addEventListener('appinstalled', () => {
  ui.installEvt = null;
});
function showUpdateBanner() {
  if (document.getElementById('update-banner')) return;
  const b = document.createElement('div');
  b.id = 'update-banner';
  b.className = 'fixed top-0 inset-x-0 z-[70] bg-queso-500 text-gray-900 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-center justify-center gap-3 font-semibold';
  b.innerHTML = '<span>Hay una versión nueva de la app.</span><button type="button" class="rounded-lg bg-gray-900 text-white px-3 py-1.5 text-sm font-bold">Recargar</button>';
  b.querySelector('button').addEventListener('click', () => location.reload());
  document.body.appendChild(b);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const hadController = !!navigator.serviceWorker.controller;
      const reg = await navigator.serviceWorker.register(`/sw.js?v=${encodeURIComponent(CONFIG.APP_VERSION)}`, {
        scope: '/',
        updateViaCache: 'none',
      });
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hadController) showUpdateBanner();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    } catch (e) {
      console.warn('Service Worker no disponible:', e);
    }
  });
}

initUI();
renderHeader();

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !document.getElementById('modal-root')?.firstChild) {
    document.body.classList.remove('overflow-hidden');
  }
});

const setHdrH = () => {
  const h = document.getElementById('hdr');
  if (h) document.documentElement.style.setProperty('--hdr-h', h.offsetHeight + 'px');
};
new ResizeObserver(setHdrH).observe(document.body);
window.addEventListener('resize', setHdrH);
new MutationObserver(setHdrH).observe(document.getElementById('app'), { childList: true, subtree: true });
setHdrH();
