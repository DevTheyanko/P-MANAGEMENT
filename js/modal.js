import { esc } from './util.js';
import { icon } from './icons.js';

const root = () => document.getElementById('modal-root');
let onClose = null;

/** Abre una hoja modal. `body` es HTML ya escapado. Devuelve el elemento del panel. */
export function openModal({ title, body, dismissible = true, onDismiss = null }) {
  closeModal();
  const el = root();
  onClose = onDismiss;
  el.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 p-0 sm:p-4" data-act="modal-backdrop" ${dismissible ? '' : 'data-locked="1"'}>
      <div role="dialog" aria-modal="true" aria-label="${esc(title)}"
           class="w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-card rounded-t-3xl sm:rounded-2xl shadow-2xl pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div class="flex items-center justify-between gap-3 px-5 pt-5 pb-2">
          <h2 class="text-xl font-bold leading-tight">${esc(title)}</h2>
          ${dismissible ? `<button type="button" data-act="modal-close" class="icon-btn -mr-2" aria-label="Cerrar">${icon('x')}</button>` : ''}
        </div>
        <div class="px-5 pb-4">${body}</div>
      </div>
    </div>`;
  document.body.classList.add('overflow-hidden');
  const first = el.querySelector('input:not([type=hidden]), select, textarea, [data-autofocus]');
  setTimeout(() => first?.focus(), 30);
  return el.firstElementChild;
}

export function closeModal() {
  const el = root();
  if (!el || !el.firstChild) return;
  el.innerHTML = '';
  document.body.classList.remove('overflow-hidden');
  const cb = onClose;
  onClose = null;
  cb?.();
}

export const isModalOpen = () => !!root()?.firstChild;

/** Pregunta Sí/No. Devuelve una promesa<boolean>. */
export function confirmDialog({ title, message, ok = 'Aceptar', cancel = 'Cancelar', danger = false }) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (v) => {
      if (settled) return;
      settled = true;
      closeModal();
      resolve(v);
    };
    const panel = openModal({
      title,
      body: `
        <p class="text-carbon-700 mb-5">${esc(message)}</p>
        <div class="grid grid-cols-2 gap-3">
          <button type="button" class="btn btn-ghost" data-confirm="0">${esc(cancel)}</button>
          <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm="1" data-autofocus>${esc(ok)}</button>
        </div>`,
      onDismiss: () => done(false),
    });
    panel.querySelectorAll('[data-confirm]').forEach((b) => b.addEventListener('click', () => done(b.dataset.confirm === '1')));
  });
}

// ───────────────────────── Toasts ─────────────────────────
export function toast(message, kind = 'ok', ms = 3200) {
  const host = document.getElementById('toast-root');
  if (!host) return;
  const el = document.createElement('div');
  const tone = { ok: 'bg-brand-800 text-white', warn: 'bg-queso-500 text-gray-900', err: 'bg-tomate-600 text-white' }[kind] || 'bg-brand-800 text-white';
  el.className = `${tone} pointer-events-auto rounded-xl px-4 py-3 text-[15px] font-medium shadow-lg max-w-md mx-auto`;
  el.setAttribute('role', kind === 'err' ? 'alert' : 'status');
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => el.remove(), kind === 'err' ? Math.max(ms, 6000) : ms);
}
