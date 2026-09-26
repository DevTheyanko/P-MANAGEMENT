// Controlador: conecta eventos de pantalla con el store y la sincronización.

import { CONFIG, isConfigured } from './config.js';
import * as store from './store.js';
import * as sync from './sync.js';
import {
  ui, viewLogin, viewHeader, viewNav, viewRegistrar, viewInventario, viewMetas, viewReportes, viewAdmin,
  regHint, currentReport, reportCardHtml, pinForm, productForm, metaForm, ajusteForm, editQtyForm, userMenu,
} from './views.js';
import { openModal, closeModal, confirmDialog, toast, isModalOpen } from './modal.js';
import { copyText, renderPng, reportText } from './report.js';
import { sha256Hex, dayKey, cycleTheme } from './util.js';

const { BASE, TIPO } = store;
const $ = (sel) => document.querySelector(sel);
const app = () => document.getElementById('app');

// ───────────────────────── Render ─────────────────────────
const VIEWS = {
  registrar: viewRegistrar,
  inventario: viewInventario,
  metas: viewMetas,
  reportes: viewReportes,
  admin: viewAdmin,
};

function normalizeRegistrar() {
  const products = store.catalog().filter((g) => !g.base);
  if (ui.mode === 'procesar') {
    if (!products.some((p) => p.nombre === ui.prod)) ui.prod = products[0]?.nombre || null;
    const allowed = products.find((p) => p.nombre === ui.prod)?.tamanos || [];
    if (ui.size && !allowed.includes(ui.size)) ui.size = null;
  }
}

export function renderHeader() {
  const el = $('#hdr');
  if (el) el.innerHTML = viewHeader();
}
export function renderNav() {
  const el = $('#nav');
  if (el) el.innerHTML = viewNav();
}
export function renderView() {
  const el = $('#view');
  if (!el) return;
  // No destruir el campo de cantidad mientras la persona escribe
  if (ui.tab === 'registrar' && document.activeElement?.id === 'qty') {
    updateHint();
    return;
  }
  normalizeRegistrar();
  el.innerHTML = VIEWS[ui.tab]();
}

export function renderApp() {
  if (!store.get().usuario) {
    app().innerHTML = viewLogin();
    return;
  }
  if (!$('#view')) {
    app().innerHTML = `
      <header id="hdr" class="sticky top-0 z-30 bg-brand-800 text-white pt-[env(safe-area-inset-top)]"></header>
      <div class="max-w-5xl mx-auto md:flex md:items-start">
        <nav id="nav" aria-label="Secciones" class="fixed bottom-0 inset-x-0 z-30 bg-card border-t border-carbon-200 pb-[env(safe-area-inset-bottom)] md:static md:w-52 md:shrink-0 md:bg-transparent md:border-0 md:pb-0"></nav>
        <main id="view" class="flex-1 min-w-0 px-4 pt-4 pb-28 md:pb-10 md:pt-6"></main>
      </div>`;
  }
  renderHeader();
  renderNav();
  renderView();
}

function updateHint() {
  const h = $('#reg-hint');
  if (h) h.innerHTML = regHint();
}

// ───────────────────────── Sesión / admin ─────────────────────────
function login(name) {
  const n = String(name || '').trim().slice(0, 24);
  if (!n) return;
  store.setUsuario(n);
  ui.tab = 'registrar';
  renderApp();
  autoPull();
}

let pinAfter = null;
let pinKind = 'admin'; // 'login' | 'admin'
let pinTarget = '';
let pinFails = 0;
let pinLockedUntil = 0;

function askLoginPin(usuario) {
  if (!CONFIG.PINES_LOGIN_SHA256[usuario]) {
    toast(`${usuario} no tiene un PIN configurado. Pide al administrador que lo agregue en config.js.`, 'err');
    return;
  }
  pinKind = 'login';
  pinTarget = usuario;
  openModal({ title: 'Iniciar sesión', body: pinForm(usuario, 'login') });
}

function askPin(after) {
  pinAfter = after || null;
  pinKind = 'admin';
  pinTarget = store.get().usuario;
  openModal({ title: 'Modo administrador', body: pinForm(pinTarget, 'admin') });
}

function adminOn() {
  ui.admin = true;
  sessionStorage.setItem('pz_admin', '1');
}
function adminOff() {
  ui.admin = false;
  sessionStorage.removeItem('pz_admin');
  if (ui.tab === 'admin') ui.tab = 'registrar';
}

function gotoTab(tab) {
  if (tab === 'admin' && !ui.admin) {
    askPin(() => {
      ui.tab = 'admin';
      renderApp();
    });
    return;
  }
  ui.tab = tab;
  renderNav();
  renderView();
  window.scrollTo({ top: 0 });
}

// ───────────────────────── Sincronización ─────────────────────────
sync.onBusy((v) => {
  ui.busy = v;
  renderHeader();
});

async function doPull({ silent = false } = {}) {
  try {
    const r = await sync.pull();
    if (r.busy) return;
    if (!silent) {
      toast('Inventario actualizado desde el Sheet');
      if (r.skipped?.productos || r.skipped?.metas) toast('Tienes cambios de productos/metas sin subir: no se sobrescribieron.', 'warn', 5000);
    }
  } catch (e) {
    if (!silent) toast(e.message, e.code === 'offline' || e.code === 'config' ? 'warn' : 'err');
  } finally {
    renderHeader();
    renderView();
  }
}

function autoPull() {
  if (isConfigured() && navigator.onLine && store.get().usuario) doPull({ silent: true });
}

async function doPush() {
  if (ui.busy) return;
  if (store.pendingCount() === 0) {
    toast('No hay nada pendiente por subir.');
    return;
  }
  try {
    const r = await sync.push();
    if (r.busy) return;
    const parts = [];
    if (r.uploaded) parts.push(`${r.uploaded} registro${r.uploaded > 1 ? 's' : ''} subido${r.uploaded > 1 ? 's' : ''}`);
    if (r.alreadyThere) parts.push(`${r.alreadyThere} ya estaba${r.alreadyThere > 1 ? 'n' : ''} en la hoja (no se duplicó)`);
    if (r.corrected) parts.push(`${r.corrected} corregido${r.corrected > 1 ? 's' : ''}`);
    if (r.voided) parts.push(`${r.voided} anulado${r.voided > 1 ? 's' : ''}`);
    if (r.config) parts.push('configuración actualizada');
    toast(parts.length ? `Listo: ${parts.join(' · ')}.` : 'Todo está al día.', 'ok', 4500);
  } catch (e) {
    toast(e.message, e.code === 'offline' || e.code === 'config' ? 'warn' : 'err');
  } finally {
    renderHeader();
    renderView();
  }
}

// ───────────────────────── Registrar ─────────────────────────
const setQty = (n) => {
  ui.qty = Math.max(0, Math.min(99999, Math.trunc(Number(n) || 0)));
  const input = $('#qty');
  if (input) input.value = ui.qty || '';
  updateHint();
};

async function saveMov() {
  const proc = ui.mode === 'procesar';
  if (proc && !ui.prod) return toast('Elige en qué producto la conviertes.', 'warn');
  if (!ui.size) return toast('Elige un tamaño.', 'warn');
  if (!(ui.qty > 0)) return toast('Escribe una cantidad mayor a 0.', 'warn');

  if (proc) {
    const avail = store.stockOf(BASE, ui.size);
    if (ui.qty > avail) {
      const ok = await confirmDialog({
        title: 'Más de lo registrado',
        message: `Solo hay ${avail} de ${BASE} ${ui.size} registradas y quieres procesar ${ui.qty}. ¿Guardar de todos modos?`,
        ok: 'Guardar igual',
      });
      if (!ok) return;
    }
  }

  store.addMov({
    tipo: proc ? TIPO.PROC : TIPO.PROD,
    categoria: proc ? ui.prod : BASE,
    tamano: ui.size,
    cantidad: ui.qty,
  });
  navigator.vibrate?.(25);
  const q = ui.qty;
  ui.qty = 0;
  renderView();
  toast(proc ? `Guardado: ${q} × ${ui.prod} ${ui.size}` : `Guardado: ${q} × ${BASE} ${ui.size}`);
}

// ───────────────────────── Reportes ─────────────────────────
async function makePng() {
  const model = currentReport();
  const blob = await renderPng(reportCardHtml(model));
  return { blob, name: `reporte-produccion-${ui.repDate}.png` };
}

async function repPng() {
  try {
    toast('Generando imagen…', 'ok', 1200);
    const { blob, name } = await makePng();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    toast('Imagen descargada.');
  } catch (e) {
    toast('No se pudo crear la imagen: ' + e.message, 'err');
  }
}

async function repShare() {
  try {
    const { blob, name } = await makePng();
    const file = new File([blob], name, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: currentReport().title });
    else toast('Este dispositivo no permite compartir imágenes. Usa “Descargar imagen”.', 'warn');
  } catch (e) {
    if (e.name !== 'AbortError') toast('No se pudo compartir: ' + e.message, 'err');
  }
}

// ───────────────────────── Admin ─────────────────────────
const requireAdmin = () => {
  if (ui.admin) return true;
  askPin();
  return false;
};

const showFormError = (msg) => {
  const el = $('#form-error') || $('#pin-error');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
};

const comboByKey = (key) => store.combos().find((c) => c.key === key);

// ───────────────────────── Eventos ─────────────────────────
async function onClick(e) {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  const d = el.dataset;

  switch (act) {
    case 'modal-backdrop':
      if (e.target === el && !d.locked) closeModal();
      return;
    case 'modal-close':
      return closeModal();
    case 'login':
      return askLoginPin(d.user);
    case 'tab':
      return gotoTab(d.tab);

    // Registrar
    case 'mode':
      ui.mode = d.mode;
      ui.size = null;
      renderView();
      return;
    case 'pick-prod':
      ui.prod = d.prod;
      renderView();
      return;
    case 'pick-size':
      ui.size = d.size;
      renderView();
      return;
    case 'qty-inc':
      return setQty(ui.qty + 1);
    case 'qty-dec':
      return setQty(ui.qty - 1);
    case 'qty-add':
      return setQty(ui.qty + Number(d.n));
    case 'qty-clear':
      return setQty(0);
    case 'save-mov':
      return saveMov();

    // Sincronización
    case 'pull':
      return doPull();
    case 'push':
      return doPush();

    // Reportes
    case 'rep-kind':
      ui.repKind = d.kind;
      renderView();
      return;
    case 'rep-copy': {
      const ok = await copyText(reportText(currentReport()));
      toast(ok ? 'Texto copiado. Pégalo en WhatsApp.' : 'No se pudo copiar. Abre “Ver el texto” y cópialo a mano.', ok ? 'ok' : 'err');
      return;
    }
    case 'rep-png':
      return repPng();
    case 'rep-share':
      return repShare();

    // Sesión
    case 'user-menu':
      openModal({ title: 'Tu sesión', body: userMenu() });
      return;
    case 'switch-user':
      closeModal();
      adminOff();
      store.setUsuario(null);
      ui.qty = 0;
      app().innerHTML = viewLogin();
      return;
    case 'admin-on':
      closeModal();
      askPin(() => renderApp());
      return;
    case 'admin-off':
      closeModal();
      adminOff();
      renderApp();
      toast('Saliste del modo administrador.');
      return;
    case 'theme-cycle':
      cycleTheme();
      openModal({ title: 'Tu sesión', body: userMenu() });
      return;
    case 'install':
      if (ui.installEvt) {
        ui.installEvt.prompt();
        await ui.installEvt.userChoice.catch(() => {});
        ui.installEvt = null;
        closeModal();
      }
      return;

    // Admin: productos
    case 'prod-new':
      if (!requireAdmin()) return;
      openModal({ title: 'Nuevo producto', body: productForm() });
      return;
    case 'prod-edit': {
      if (!requireAdmin()) return;
      const p = store.get().productos.find((x) => x.id === d.id);
      if (!p) return;
      const used = store.get().movs.some((m) => m.categoria === p.nombre);
      openModal({ title: 'Editar producto', body: productForm(p, used) });
      return;
    }
    case 'prod-del': {
      if (!requireAdmin()) return;
      const p = store.get().productos.find((x) => x.id === d.id);
      if (!p) return;
      const ok = await confirmDialog({
        title: `¿Eliminar “${p.nombre}”?`,
        message: 'Deja de aparecer para registrar. El historial de movimientos se conserva y sus metas se quitan.',
        ok: 'Eliminar',
        danger: true,
      });
      if (ok) {
        store.deleteProducto(p.id);
        toast('Producto eliminado. Pulsa Subir para guardarlo en el Sheet.');
      }
      return;
    }

    // Admin: metas
    case 'meta-new':
      if (!requireAdmin()) return;
      openModal({ title: 'Nueva meta', body: metaForm() });
      return;
    case 'meta-edit':
      if (!requireAdmin()) return;
      openModal({ title: 'Editar meta', body: metaForm(d.clave) });
      return;
    case 'meta-del': {
      if (!requireAdmin()) return;
      const ok = await confirmDialog({ title: '¿Quitar esta meta?', message: d.clave.replace(/ - (?=[^-]+$)/, ' '), ok: 'Quitar', danger: true });
      if (ok) {
        store.setMeta(d.clave, 0);
        toast('Meta quitada. Pulsa Subir para guardarlo en el Sheet.');
      }
      return;
    }

    // Admin: ajustes y registros
    case 'ajuste-new':
      if (!requireAdmin()) return;
      openModal({ title: 'Ajustar inventario', body: ajusteForm() });
      return;
    case 'adm-today':
      ui.admDate = dayKey(new Date());
      renderView();
      return;
    case 'adm-all':
      ui.admDate = '';
      renderView();
      return;
    case 'mov-edit': {
      if (!requireAdmin()) return;
      const m = store.get().movs.find((x) => x.id === d.id);
      if (m) openModal({ title: 'Corregir cantidad', body: editQtyForm(m) });
      return;
    }
    case 'mov-del': {
      if (!requireAdmin()) return;
      const m = store.get().movs.find((x) => x.id === d.id);
      if (!m) return;
      const pending = m.dirty === 'NEW';
      const ok = await confirmDialog({
        title: pending ? '¿Eliminar este registro?' : '¿Anular este registro?',
        message: pending
          ? 'Todavía no se ha subido: se borra de este dispositivo.'
          : 'Quedará marcado como ANULADO en el Sheet y dejará de contar en el inventario (se aplica al pulsar Subir).',
        ok: pending ? 'Eliminar' : 'Anular',
        danger: true,
      });
      if (ok) {
        store.removeMov(m.id);
        toast(pending ? 'Registro eliminado.' : 'Anulado. Pulsa Subir para reflejarlo en el Sheet.');
      }
      return;
    }
    default:
  }
}

function onInput(e) {
  const t = e.target;
  if (t.id === 'qty') {
    t.value = t.value.replace(/\D/g, '').slice(0, 5);
    ui.qty = Number(t.value) || 0;
    updateHint();
  }
}

function onChange(e) {
  const t = e.target;
  if (t.id === 'rep-date') {
    ui.repDate = t.value || dayKey(new Date());
    renderView();
  } else if (t.id === 'rep-stock') {
    ui.repStock = t.checked;
    renderView();
  } else if (t.id === 'adm-date') {
    ui.admDate = t.value;
    renderView();
  }
}

async function onSubmit(e) {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  const fd = new FormData(form);
  const kind = form.dataset.form;

  if (kind === 'pin') {
    const err = $('#pin-error');
    const fail = (msg) => {
      err.textContent = msg;
      err.classList.remove('hidden');
      form.pin.value = '';
      form.pin.focus();
    };
    if (Date.now() < pinLockedUntil) return fail(`Demasiados intentos. Espera ${Math.ceil((pinLockedUntil - Date.now()) / 1000)} s.`);
    let hash;
    try {
      hash = await sha256Hex(String(fd.get('pin')).trim());
    } catch {
      return fail('Este navegador necesita HTTPS para validar el PIN.');
    }
    const expected =
      pinKind === 'login' ? CONFIG.PINES_LOGIN_SHA256[pinTarget] : CONFIG.PINES_ADMIN_SHA256[pinTarget] || CONFIG.PIN_ADMIN_DEFECTO_SHA256;
    if (hash === expected) {
      pinFails = 0;
      closeModal();
      if (pinKind === 'login') {
        login(pinTarget);
      } else {
        adminOn();
        const next = pinAfter;
        pinAfter = null;
        next ? next() : renderApp();
        toast('Modo administrador activado.');
      }
    } else {
      pinFails += 1;
      if (pinFails >= 5) {
        pinFails = 0;
        pinLockedUntil = Date.now() + 30_000;
        return fail('Demasiados intentos. Espera 30 s.');
      }
      fail('PIN incorrecto.');
    }
    return;
  }

  if (!ui.admin) return; // los demás formularios son solo de administrador

  if (kind === 'producto') {
    const id = String(fd.get('id') || '');
    const nombre = String(fd.get('nombre') || '').trim();
    const tamanos = fd.getAll('tamanos');
    if (!nombre) return showFormError('Escribe el nombre del producto.');
    if (nombre.toLowerCase() === BASE.toLowerCase()) return showFormError(`“${BASE}” ya existe como masa base.`);
    if (/ - /.test(nombre)) return showFormError('El nombre no puede contener “ - ”.');
    if (store.get().productos.some((p) => p.id !== id && p.nombre.toLowerCase() === nombre.toLowerCase())) return showFormError('Ya existe un producto con ese nombre.');
    if (!tamanos.length) return showFormError('Elige al menos un tamaño.');
    store.saveProducto({ id, nombre, tamanos });
    closeModal();
    toast('Producto guardado. Pulsa Subir para enviarlo al Sheet.');
    return;
  }

  if (kind === 'meta') {
    const cantidad = Number(fd.get('cantidad'));
    if (!Number.isInteger(cantidad) || cantidad < 1) return showFormError('Escribe una cantidad entera mayor a 0.');
    store.setMeta(String(fd.get('clave')), cantidad);
    closeModal();
    toast('Meta guardada. Pulsa Subir para enviarla al Sheet.');
    return;
  }

  if (kind === 'ajuste') {
    const c = comboByKey(String(fd.get('clave')));
    const n = Number(fd.get('cantidad'));
    if (!c) return showFormError('Elige un producto.');
    if (!Number.isInteger(n) || n < 1) return showFormError('Escribe una cantidad entera mayor a 0.');
    store.addMov({ tipo: TIPO.AJUSTE, categoria: c.cat, tamano: c.size, cantidad: n * Number(fd.get('signo')) });
    closeModal();
    toast('Ajuste registrado. Pulsa Subir para enviarlo al Sheet.');
    return;
  }

  if (kind === 'edit-qty') {
    const m = store.get().movs.find((x) => x.id === fd.get('id'));
    const n = Number(fd.get('cantidad'));
    if (!m) return closeModal();
    if (!Number.isInteger(n) || n === 0 || (m.tipo !== TIPO.AJUSTE && n < 0)) return showFormError('Escribe una cantidad entera válida.');
    store.editMov(m.id, n);
    closeModal();
    toast('Corregido. Pulsa Subir para reflejarlo en el Sheet.');
  }
}

// ───────────────────────── Arranque ─────────────────────────
export function initUI() {
  store.load();
  document.addEventListener('click', onClick);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onChange);
  document.addEventListener('submit', onSubmit);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isModalOpen()) closeModal();
  });

  store.subscribe(() => {
    if (!store.get().usuario) return;
    renderHeader();
    renderView();
  });

  window.addEventListener('online', () => {
    ui.online = true;
    renderHeader();
    toast('Conexión recuperada. Tus registros pendientes se suben con el botón Subir.', 'ok', 4500);
  });
  window.addEventListener('offline', () => {
    ui.online = false;
    renderHeader();
    toast('Sin conexión: todo se guarda en el dispositivo.', 'warn');
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const last = store.get().lastPull ? new Date(store.get().lastPull).getTime() : 0;
    if (Date.now() - last > 2 * 60_000) autoPull();
  });

  renderApp();
  autoPull();
}
