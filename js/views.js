// Vistas: funciones que devuelven HTML (todo dato del usuario pasa por esc()).

import { CONFIG, isConfigured } from './config.js';
import * as store from './store.js';
import { icon } from './icons.js';
import { esc, fmtNum, fmtTime, timeAgo, dayKey, parseStamp, stamp } from './util.js';
import { buildReport, reportText } from './report.js';

const { BASE, TIPO, SIZES } = store;

// Estado de la interfaz (no se guarda; solo vive mientras la app está abierta)
export const ui = {
  tab: 'registrar',
  mode: 'producir', // 'producir' | 'procesar'
  prod: null,
  size: null,
  qty: 0,
  admin: sessionStorage.getItem('pz_admin') === '1',
  repKind: 'day',
  repDate: dayKey(new Date()),
  repStock: true,
  admDate: dayKey(new Date()),
  online: navigator.onLine,
  busy: false,
  installEvt: null,
};

const diaOf = (size) => CONFIG.TAMANOS.find((t) => t.id === size)?.dia ?? 40;

// ───────────────────────── Piezas visuales ─────────────────────────
export const logo = (px = 32) =>
  `<svg width="${px}" height="${px}" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="#E0A85A"/><circle cx="24" cy="24" r="18" fill="#F6D67C"/><circle cx="17" cy="18" r="3.6" fill="#C9301A"/><circle cx="31" cy="19" r="3.6" fill="#C9301A"/><circle cx="24" cy="31" r="3.6" fill="#C9301A"/><circle cx="34" cy="30" r="1.8" fill="#2A7048"/><circle cx="13.5" cy="28" r="1.8" fill="#2A7048"/></svg>`;

/** Disco de masa: su diámetro en pantalla es proporcional al tamaño real. */
const disc = (size, scale = 1) => {
  const d = Math.round(diaOf(size) * scale);
  return `<span class="disc" style="width:${d}px;height:${d}px"></span>`;
};

const statusBadge = (m) => {
  if (m.dirty === 'NEW') return '<span class="badge badge-warn">Sin subir</span>';
  if (m.dirty === 'EDIT') return '<span class="badge badge-warn">Corrección sin subir</span>';
  if (m.dirty === 'VOID') return '<span class="badge badge-warn">Anulación sin subir</span>';
  if (store.isVoid(m)) return '<span class="badge badge-mute">Anulado</span>';
  if (String(m.estado).toUpperCase() === 'CORREGIDO') return '<span class="badge badge-ok">Corregido</span>';
  return '<span class="badge badge-ok">Subido</span>';
};

const movDesc = (m) => {
  const q = Number(m.cantidad) || 0;
  if (m.tipo === TIPO.PROD) return `Produjo <b>${fmtNum(q)}</b> × ${esc(BASE)} ${esc(m.tamano)}`;
  if (m.tipo === TIPO.PROC) return `Procesó <b>${fmtNum(q)}</b> × ${esc(m.categoria)} ${esc(m.tamano)}`;
  return `Ajuste <b>${q > 0 ? '+' : ''}${fmtNum(q)}</b> × ${esc(m.categoria)} ${esc(m.tamano)}`;
};

const fechaTime = (m) => {
  const d = parseStamp(m.fecha);
  return d ? fmtTime(d) : '--:--';
};

// ───────────────────────── Acceso ─────────────────────────
export function viewLogin() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
  return `
  <main class="min-h-screen flex flex-col justify-center max-w-md mx-auto px-5 py-10">
    <div class="flex items-center gap-3 mb-8">
      ${logo(56)}
      <div>
        <h1 class="text-3xl font-extrabold leading-none">${esc(CONFIG.APP_NAME)}</h1>
        <p class="text-carbon-500 mt-1.5">Producción e inventario de masas</p>
      </div>
    </div>
    <h2 class="text-xl font-bold mb-3">¿Quién va a registrar?</h2>
    <div class="grid grid-cols-2 gap-3">
      ${CONFIG.USUARIOS.map((u) => `<button type="button" data-act="login" data-user="${esc(u)}" class="btn btn-primary min-h-[64px] text-xl">${esc(u)}</button>`).join('')}
    </div>
    <form data-form="login-other" class="mt-6">
      <label class="label" for="other-user">Otro nombre</label>
      <div class="flex gap-2">
        <input id="other-user" name="user" class="field" maxlength="24" autocomplete="off" placeholder="Escribe tu nombre">
        <button class="btn btn-ghost" type="submit">Entrar</button>
      </div>
    </form>
    ${ios ? `<p class="mt-8 text-sm text-carbon-500 card">Para instalarla en iPhone: toca <b>Compartir</b> y luego <b>Añadir a pantalla de inicio</b>.</p>` : ''}
  </main>`;
}

// ───────────────────────── Marco ─────────────────────────
const statusLine = () => {
  if (!isConfigured()) return { dot: 'bg-queso-500', text: 'Modo local · sin Google Sheets' };
  if (!ui.online) return { dot: 'bg-tomate-500', text: 'Sin conexión · guardando en el dispositivo' };
  const last = store.get().lastPull;
  return { dot: 'bg-emerald-400', text: last ? `En línea · ${timeAgo(last)}` : 'En línea · sin descargar aún' };
};

export function viewHeader() {
  const s = store.get();
  const n = store.pendingCount();
  const st = statusLine();
  const spin = ui.busy ? 'animate-spin' : '';
  return `
  <div class="max-w-5xl mx-auto px-4 pt-3 pb-3">
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5 min-w-0">
        ${logo(34)}
        <div class="min-w-0">
          <p class="font-extrabold text-lg leading-none truncate">${esc(CONFIG.APP_NAME)}</p>
          <p class="text-xs text-white/75 mt-1.5 flex items-center gap-1.5 truncate"><span class="inline-block w-2 h-2 rounded-full ${st.dot}"></span>${esc(st.text)}</p>
        </div>
      </div>
      <button type="button" data-act="user-menu" class="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/25 pl-3 pr-3.5 min-h-[40px] text-sm font-semibold shrink-0">
        ${icon('user', 'w-4 h-4')}<span class="max-w-[7rem] truncate">${esc(s.usuario)}</span>${ui.admin ? '<span class="rounded bg-queso-500 text-carbon-900 text-[11px] font-bold px-1.5 py-0.5">Admin</span>' : ''}
      </button>
    </div>
    <div class="grid grid-cols-2 gap-2.5 mt-3">
      <button type="button" data-act="pull" class="btn btn-outline-light" ${ui.busy ? 'disabled' : ''}>${icon('refresh', `w-5 h-5 ${spin}`)} Refrescar</button>
      <button type="button" data-act="push" class="btn btn-tomate" ${ui.busy ? 'disabled' : ''}>
        ${icon('upload', `w-5 h-5 ${spin}`)} Subir
        ${n ? `<span class="min-w-[1.5rem] h-6 px-1.5 rounded-full bg-white text-tomate-700 text-sm font-extrabold inline-flex items-center justify-center">${n}</span>` : ''}
      </button>
    </div>
  </div>`;
}

export const TABS = [
  { id: 'registrar', label: 'Registrar', icon: 'pen' },
  { id: 'inventario', label: 'Inventario', icon: 'box' },
  { id: 'metas', label: 'Metas', icon: 'target' },
  { id: 'reportes', label: 'Reportes', icon: 'report' },
  { id: 'admin', label: 'Admin', icon: 'lock' },
];

export function viewNav() {
  return `<ul class="grid grid-cols-5 md:grid-cols-1 md:gap-1 md:p-3 md:sticky md:top-44">
    ${TABS.map((t) => `
      <li><button type="button" data-act="tab" data-tab="${t.id}" class="navbtn ${ui.tab === t.id ? 'is-on' : ''}" ${ui.tab === t.id ? 'aria-current="page"' : ''}>
        ${icon(t.id === 'admin' && ui.admin ? 'unlock' : t.icon, 'w-6 h-6')}<span>${t.label}</span>
      </button></li>`).join('')}
  </ul>`;
}

// ───────────────────────── Registrar ─────────────────────────
export function regHint() {
  const st = store.computeStock();
  const size = ui.size;
  const q = ui.qty;
  if (!size) return `<span class="text-carbon-500">Elige un tamaño para empezar.</span>`;
  const avail = store.stockOf(BASE, size, st);
  if (ui.mode === 'producir') {
    if (!q) return `Hay <b>${fmtNum(avail)}</b> de ${esc(BASE)} ${esc(size)}.`;
    return `Se sumarán <b>${fmtNum(q)}</b> a ${esc(BASE)} ${esc(size)}: pasará de ${fmtNum(avail)} a <b>${fmtNum(avail + q)}</b>.`;
  }
  const over = q > avail;
  const line1 = `${esc(BASE)} ${esc(size)} disponible: <b class="${over ? 'text-tomate-600' : ''}">${fmtNum(avail)}</b>`;
  if (!q) return line1;
  return `${line1}<br>Se restan <b>${fmtNum(q)}</b> de ${esc(BASE)} ${esc(size)} y se suman a ${esc(ui.prod)} ${esc(size)}.${over ? '<br><span class="text-tomate-600 font-semibold">Es más de lo que hay registrado.</span>' : ''}`;
}

export function viewRegistrar() {
  const proc = ui.mode === 'procesar';
  const products = store.catalog().filter((g) => !g.base);
  const group = proc ? products.find((p) => p.nombre === ui.prod) : null;
  const sizes = proc ? group?.tamanos || [] : SIZES;

  const today = dayKey(new Date());
  const recent = store
    .get()
    .movs.filter((m) => {
      const d = parseStamp(m.fecha);
      return d && dayKey(d) === today;
    })
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
    .slice(0, 6);

  return `
  <section class="space-y-4 max-w-xl">
    <div class="grid grid-cols-2 p-1 bg-carbon-100 rounded-2xl" role="group" aria-label="Tipo de registro">
      <button type="button" data-act="mode" data-mode="producir" class="seg-btn ${!proc ? 'is-on' : ''}">Producir masa</button>
      <button type="button" data-act="mode" data-mode="procesar" class="seg-btn ${proc ? 'is-on' : ''}">Procesar masa</button>
    </div>

    ${
      proc
        ? `<div class="card">
        <h3 class="h3">¿En qué la conviertes?</h3>
        ${
          products.length
            ? `<div class="flex flex-wrap gap-2">${products.map((p) => `<button type="button" data-act="pick-prod" data-prod="${esc(p.nombre)}" class="chip ${ui.prod === p.nombre ? 'is-on' : ''}">${esc(p.nombre)}</button>`).join('')}</div>`
            : '<p class="text-carbon-500">Aún no hay productos. Un administrador puede agregarlos.</p>'
        }
      </div>`
        : ''
    }

    <div class="card">
      <h3 class="h3">Tamaño</h3>
      <div class="grid grid-cols-5 gap-1">
        ${sizes.map((s) => `
          <button type="button" data-act="pick-size" data-size="${esc(s)}" class="size-btn ${ui.size === s ? 'is-on' : ''}" aria-pressed="${ui.size === s}">
            <span class="size-slot">${disc(s)}</span>
            <span class="size-lbl">${esc(s)}</span>
          </button>`).join('') || '<p class="text-carbon-500">Elige un producto primero.</p>'}
      </div>
    </div>

    <div class="card">
      <h3 class="h3">Cantidad</h3>
      <div class="flex items-stretch gap-3">
        <button type="button" data-act="qty-dec" class="step-btn" aria-label="Restar uno">${icon('minus', 'w-7 h-7')}</button>
        <input id="qty" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="0" value="${ui.qty || ''}" class="field text-center text-4xl font-extrabold tabular-nums flex-1 min-w-0" aria-label="Cantidad">
        <button type="button" data-act="qty-inc" class="step-btn" aria-label="Sumar uno">${icon('plus', 'w-7 h-7')}</button>
      </div>
      <div class="flex flex-wrap gap-1.5 mt-3">
        ${[5, 10, 50, 100].map((n) => `<button type="button" data-act="qty-add" data-n="${n}" class="chip !px-3">+${n}</button>`).join('')}
        <button type="button" data-act="qty-clear" class="chip !px-3 ml-auto text-carbon-500">Borrar</button>
      </div>
      <p id="reg-hint" class="mt-4 rounded-xl bg-carbon-50 border border-carbon-200 px-3.5 py-3 text-[15px] leading-relaxed">${regHint()}</p>
    </div>

    <button type="button" data-act="save-mov" class="btn btn-primary w-full min-h-[60px] text-lg">${icon('check', 'w-6 h-6')} ${proc ? 'Guardar procesamiento' : 'Guardar producción'}</button>
    <p class="text-sm text-carbon-500 text-center -mt-1">Se guarda en este dispositivo. Para enviarlo al Google Sheet pulsa <b>Subir</b>.</p>

    <div class="pt-2">
      <h3 class="h3">Registros de hoy</h3>
      ${
        recent.length
          ? `<ul class="space-y-2">${recent.map((m) => `
          <li class="card !p-3 flex items-center gap-3 ${store.isVoid(m) ? 'opacity-60' : ''}">
            <span class="tabular-nums text-sm text-carbon-500 w-11 shrink-0">${fechaTime(m)}</span>
            <div class="min-w-0 flex-1"><p class="text-[15px] leading-snug ${store.isVoid(m) ? 'line-through' : ''}"><b>${esc(m.usuario)}</b> · ${movDesc(m)}</p></div>
            ${statusBadge(m)}
          </li>`).join('')}</ul>`
          : '<p class="text-carbon-500">Todavía no hay registros hoy.</p>'
      }
    </div>
  </section>`;
}

// ───────────────────────── Inventario ─────────────────────────
const tile = (cat, size, q) => `
  <div class="tile ${q < 0 ? 'tile-neg' : q === 0 ? 'tile-zero' : ''}">
    <div class="flex items-center gap-2 text-carbon-700">
      <span class="inline-flex w-7 justify-center">${disc(size, 0.5)}</span><span class="text-sm font-semibold">${esc(size)}</span>
    </div>
    <p class="text-3xl font-extrabold tabular-nums mt-1.5">${fmtNum(q)}</p>
    ${q < 0 ? '<p class="text-xs font-semibold text-tomate-600 mt-0.5">Negativo: revisa registros</p>' : ''}
  </div>`;

export function viewInventario() {
  const st = store.computeStock();
  const s = store.get();
  const pend = store.pendingMovs().length;
  const known = new Set(store.combos().map((c) => c.key));
  const extras = [...st.entries()].filter(([k, q]) => !known.has(k) && q !== 0);

  return `
  <section class="space-y-6">
    <div>
      <h2 class="h2">Inventario actual</h2>
      <p class="text-carbon-500 text-[15px]">Descargado ${esc(timeAgo(s.lastPull))}.${pend ? ` Incluye <b class="text-carbon-900">${pend}</b> registro${pend > 1 ? 's' : ''} sin subir.` : ''}</p>
    </div>
    ${store
      .catalog()
      .map((g) => `
      <div>
        <h3 class="h3">${esc(g.nombre)}</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          ${g.tamanos.map((sz) => tile(g.nombre, sz, store.stockOf(g.nombre, sz, st))).join('')}
        </div>
      </div>`).join('')}
    ${
      extras.length
        ? `<div><h3 class="h3">Otros (productos ya eliminados)</h3><div class="grid grid-cols-2 sm:grid-cols-3 gap-3">${extras
            .map(([k, q]) => `<div class="tile"><p class="text-sm font-semibold text-carbon-700">${esc(k)}</p><p class="text-3xl font-extrabold tabular-nums mt-1.5">${fmtNum(q)}</p></div>`)
            .join('')}</div></div>`
        : ''
    }
  </section>`;
}

// ───────────────────────── Metas ─────────────────────────
const claveLabel = (clave) => clave.replace(/ - (?=[^-]+$)/, ' ');
const claveSize = (clave) => clave.split(' - ').pop();

export function viewMetas() {
  const st = store.computeStock();
  const metas = [...store.get().metas].sort((a, b) => a.clave.localeCompare(b.clave, 'es'));

  const cards = metas
    .map((m) => {
      const q = st.get(m.clave) || 0;
      const diff = m.cantidad - q;
      const done = diff <= 0;
      const pct = Math.max(0, Math.min(100, Math.round((q / m.cantidad) * 100)));
      const size = claveSize(m.clave);
      return `
      <article class="card">
        <div class="flex items-start gap-3">
          <span class="inline-flex w-9 justify-center pt-1">${SIZES.includes(size) ? disc(size, 0.6) : ''}</span>
          <div class="min-w-0 flex-1">
            <h3 class="font-bold text-lg leading-tight">${esc(claveLabel(m.clave))}</h3>
            <p class="text-carbon-500 text-sm">Meta fijada el ${esc(m.fecha)}</p>
          </div>
          ${
            ui.admin
              ? `<div class="flex -mr-2 -mt-1">
              <button type="button" class="icon-btn" data-act="meta-edit" data-clave="${esc(m.clave)}" aria-label="Editar meta">${icon('edit', 'w-5 h-5')}</button>
              <button type="button" class="icon-btn" data-act="meta-del" data-clave="${esc(m.clave)}" aria-label="Quitar meta">${icon('trash', 'w-5 h-5')}</button>
            </div>`
              : ''
          }
        </div>
        <div class="flex items-end justify-between mt-3">
          <p><span class="text-4xl font-extrabold tabular-nums">${fmtNum(q)}</span><span class="text-carbon-500 text-lg"> / ${fmtNum(m.cantidad)}</span></p>
          <p class="font-bold ${done ? 'text-horno-700' : 'text-tomate-600'}">${done ? (diff === 0 ? 'Meta cumplida' : `Excedente +${fmtNum(-diff)}`) : `Faltan ${fmtNum(diff)}`}</p>
        </div>
        <div class="h-3 rounded-full bg-carbon-100 mt-2 overflow-hidden" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
          <div class="h-full rounded-full ${done ? 'bg-horno-600' : 'bg-tomate-500'}" style="width:${pct}%"></div>
        </div>
      </article>`;
    })
    .join('');

  const pendingNote = store.get().metasDirty ? '<p class="text-sm font-semibold text-tomate-700 bg-tomate-100 rounded-xl px-3 py-2">Hay metas sin subir. Pulsa Subir para guardarlas en el Sheet.</p>' : '';

  return `
  <section class="space-y-4 max-w-2xl">
    <div class="flex items-end justify-between gap-3">
      <div>
        <h2 class="h2">Metas de stock</h2>
        <p class="text-carbon-500 text-[15px]">Cuántas masas debe haber frente a las que hay.</p>
      </div>
      ${ui.admin ? `<button type="button" data-act="meta-new" class="btn btn-primary btn-sm shrink-0">${icon('plus', 'w-4 h-4')} Nueva meta</button>` : ''}
    </div>
    ${pendingNote}
    ${cards || `<div class="card text-center py-8"><p class="font-semibold">Aún no hay metas.</p><p class="text-carbon-500 mt-1">${ui.admin ? 'Toca “Nueva meta” para definir cuántas masas necesitas.' : 'Un administrador puede definirlas.'}</p></div>`}
  </section>`;
}

// ───────────────────────── Reportes ─────────────────────────
const parseDateInput = (v) => {
  const [y, m, d] = String(v).split('-').map(Number);
  return y ? new Date(y, m - 1, d) : new Date();
};

export const currentReport = () => buildReport(store.get(), ui.repKind, parseDateInput(ui.repDate), { includeStock: ui.repStock });

/** Tarjeta usada tanto en pantalla como para la imagen PNG (colores explícitos para html2canvas). */
export function reportCardHtml(model) {
  const glyph = { [TIPO.PROD]: ['+', '#1F5A3A'], [TIPO.PROC]: ['⟳', '#C9301A'], [TIPO.AJUSTE]: ['±', '#8A6A00'] };
  return `
  <div class="report-card bg-white text-carbon-900 rounded-2xl overflow-hidden border border-carbon-200" style="font-family:'Bricolage Grotesque',system-ui,sans-serif">
    <div class="bg-horno-800 text-white px-5 py-4 flex items-center gap-3">
      ${logo(40)}
      <div class="min-w-0">
        <p class="text-sm" style="opacity:.75">${esc(CONFIG.APP_NAME)}</p>
        <p class="text-lg font-extrabold leading-tight">${esc(model.title)}</p>
      </div>
    </div>
    <div class="px-5 py-4 space-y-4">
      ${
        model.empty
          ? '<p class="text-carbon-500 py-2">Sin movimientos en este periodo.</p>'
          : model.users
              .map((u) => `
          <div>
            <p class="font-extrabold text-lg mb-1.5">${esc(u.usuario)}</p>
            <ul class="space-y-1.5">
              ${u.items.map((it) => {
                const [g, c] = glyph[it.tipo] || ['•', '#3B413D'];
                return `<li class="text-[16px]"><b style="display:inline-block;width:22px;text-align:center;color:${c};font-weight:800">${g}</b> ${esc(it.text)}</li>`;
              }).join('')}
            </ul>
          </div>`).join('')
      }
      ${
        model.sumProd || model.sumProc
          ? `<div class="border-t border-carbon-200 pt-3 flex flex-wrap gap-x-6 gap-y-1 text-[15px]">
          ${model.sumProd ? `<p>Total producido <b class="text-lg">${fmtNum(model.sumProd)}</b></p>` : ''}
          ${model.sumProc ? `<p>Total procesado <b class="text-lg">${fmtNum(model.sumProc)}</b></p>` : ''}
        </div>`
          : ''
      }
      ${
        model.stock.length
          ? `<div class="border-t border-carbon-200 pt-3">
          <p class="font-extrabold mb-1.5">Inventario actual</p>
          <ul class="space-y-1 text-[15px]">
            ${model.stock.map((s) => {
              const diff = s.meta ? s.meta - s.qty : 0;
              const note = !s.meta ? '' : diff > 0 ? `<span style="color:#C9301A;font-weight:700"> faltan ${diff} (meta ${s.meta})</span>` : `<span style="color:#1F5A3A;font-weight:700"> meta ${s.meta} cumplida</span>`;
              return `<li class="flex justify-between gap-3"><span>${esc(s.label)}</span><span><b>${fmtNum(s.qty)}</b>${note}</span></li>`;
            }).join('')}
          </ul>
        </div>`
          : ''
      }
    </div>
    <div class="px-5 py-2.5 bg-carbon-50 text-xs text-carbon-500">Generado ${esc(stamp(new Date()).slice(0, 16))}</div>
  </div>`;
}

export function viewReportes() {
  const model = currentReport();
  const canShare = !!(navigator.canShare && navigator.share);
  return `
  <section class="space-y-4 max-w-2xl">
    <div>
      <h2 class="h2">Resumen y reportes</h2>
      <p class="text-carbon-500 text-[15px]">Elige el periodo y envíalo por WhatsApp.</p>
    </div>
    <div class="card space-y-3">
      <div class="grid grid-cols-3 p-1 bg-carbon-100 rounded-2xl" role="group" aria-label="Periodo">
        ${[['day', 'Día'], ['week', 'Semana'], ['month', 'Mes']].map(([k, l]) => `<button type="button" data-act="rep-kind" data-kind="${k}" class="seg-btn ${ui.repKind === k ? 'is-on' : ''}">${l}</button>`).join('')}
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <label class="flex-1 min-w-[10rem]"><span class="label">Fecha de referencia</span><input type="date" id="rep-date" class="field" value="${esc(ui.repDate)}"></label>
        <label class="flex items-center gap-2.5 min-h-[52px] mt-5 font-semibold"><input type="checkbox" id="rep-stock" class="w-5 h-5 accent-[#1F5A3A]" ${ui.repStock ? 'checked' : ''}> Incluir inventario</label>
      </div>
    </div>

    <div id="report-preview">${reportCardHtml(model)}</div>

    <div class="grid sm:grid-cols-2 gap-3">
      <button type="button" data-act="rep-copy" class="btn btn-primary">${icon('copy')} Copiar texto para WhatsApp</button>
      <button type="button" data-act="rep-png" class="btn btn-ghost">${icon('image')} Descargar imagen PNG</button>
      ${canShare ? `<button type="button" data-act="rep-share" class="btn btn-ghost sm:col-span-2">${icon('share')} Compartir imagen…</button>` : ''}
    </div>

    <details class="card">
      <summary class="font-bold cursor-pointer select-none">Ver el texto que se copiará</summary>
      <pre class="mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed font-sans">${esc(reportText(model))}</pre>
    </details>
  </section>`;
}

// ───────────────────────── Admin ─────────────────────────
export function viewAdmin() {
  if (!ui.admin) {
    return `<section class="max-w-md"><div class="card text-center py-10 space-y-4">
      ${icon('lock', 'w-10 h-10 mx-auto text-carbon-500')}
      <p class="font-bold text-lg">Solo para administradores</p>
      <button type="button" data-act="admin-on" class="btn btn-primary mx-auto">Ingresar PIN</button>
    </div></section>`;
  }
  const s = store.get();
  const products = s.productos;
  const day = ui.admDate;
  const list = s.movs
    .filter((m) => {
      if (!day) return true;
      const d = parseStamp(m.fecha);
      return d && dayKey(d) === day;
    })
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
    .slice(0, 60);

  return `
  <section class="space-y-6 max-w-2xl">
    <div>
      <h2 class="h2">Administración</h2>
      <p class="text-carbon-500 text-[15px]">Productos, correcciones y ajustes. Los cambios se suben con el botón Subir.</p>
    </div>

    <div class="card">
      <div class="flex items-center justify-between gap-3 mb-3">
        <h3 class="h3 !mb-0">Productos</h3>
        <button type="button" data-act="prod-new" class="btn btn-primary btn-sm">${icon('plus', 'w-4 h-4')} Agregar</button>
      </div>
      ${s.prodDirty ? '<p class="text-sm font-semibold text-tomate-700 bg-tomate-100 rounded-xl px-3 py-2 mb-3">Cambios en productos sin subir.</p>' : ''}
      ${
        products.length
          ? `<ul class="divide-y divide-carbon-100">${products.map((p) => `
          <li class="py-2.5 flex items-center gap-3">
            <div class="min-w-0 flex-1">
              <p class="font-bold">${esc(p.nombre)}</p>
              <p class="text-sm text-carbon-500">${p.tamanos.length ? p.tamanos.map(esc).join(' · ') : 'Sin tamaños'}</p>
            </div>
            <button type="button" class="icon-btn" data-act="prod-edit" data-id="${esc(p.id)}" aria-label="Editar ${esc(p.nombre)}">${icon('edit')}</button>
            <button type="button" class="icon-btn" data-act="prod-del" data-id="${esc(p.id)}" aria-label="Eliminar ${esc(p.nombre)}">${icon('trash')}</button>
          </li>`).join('')}</ul>`
          : '<p class="text-carbon-500">No hay productos.</p>'
      }
    </div>

    <div class="card">
      <h3 class="h3">Ajustar inventario</h3>
      <p class="text-carbon-500 text-[15px] mb-3">Suma o resta unidades a cualquier producto (por ejemplo, masa vendida, merma o conteo físico).</p>
      <button type="button" data-act="ajuste-new" class="btn btn-ghost w-full">${icon('sliders')} Nuevo ajuste</button>
    </div>

    <div class="card">
      <h3 class="h3">Registros</h3>
      <div class="flex items-center gap-2 mb-3">
        <input type="date" id="adm-date" class="field !min-h-[44px] !text-base min-w-0 flex-1" value="${esc(day)}" aria-label="Filtrar por fecha">
        <button type="button" data-act="adm-today" class="chip shrink-0">Hoy</button>
        <button type="button" data-act="adm-all" class="chip shrink-0">Todos</button>
      </div>
      ${
        list.length
          ? `<ul class="space-y-2">${list.map((m) => `
          <li class="rounded-xl border border-carbon-200 p-3 ${store.isVoid(m) ? 'opacity-60' : ''}">
            <div class="flex items-start gap-2">
              <div class="min-w-0 flex-1">
                <p class="text-[15px] leading-snug ${store.isVoid(m) ? 'line-through' : ''}"><b>${esc(m.usuario)}</b> · ${movDesc(m)}</p>
                <p class="text-xs text-carbon-500 mt-1">${esc(String(m.fecha).slice(0, 16))} · ${esc(m.tipo)}</p>
              </div>
              ${statusBadge(m)}
            </div>
            ${
              store.isVoid(m)
                ? ''
                : `<div class="flex gap-2 mt-2.5">
                <button type="button" class="btn btn-ghost btn-sm flex-1" data-act="mov-edit" data-id="${esc(m.id)}">${icon('edit', 'w-4 h-4')} Corregir</button>
                <button type="button" class="btn btn-ghost btn-sm flex-1 !text-tomate-700" data-act="mov-del" data-id="${esc(m.id)}">${icon('trash', 'w-4 h-4')} ${m.dirty === 'NEW' ? 'Eliminar' : 'Anular'}</button>
              </div>`
            }
          </li>`).join('')}</ul>`
          : '<p class="text-carbon-500">No hay registros en esta fecha.</p>'
      }
    </div>

    <div class="flex flex-col sm:flex-row gap-3">
      <button type="button" data-act="admin-off" class="btn btn-ghost flex-1">${icon('lock')} Salir del modo admin</button>
    </div>
    <p class="text-xs text-carbon-500">Versión ${esc(CONFIG.APP_VERSION)} · ${isConfigured() ? 'Conectada a Google Sheets' : 'Modo local (sin Google Sheets)'}</p>
  </section>`;
}

// ───────────────────────── Formularios (dentro de modales) ─────────────────────────
export const pinForm = () => `
  <form data-form="pin" class="space-y-4">
    <p class="text-carbon-500">Escribe el PIN de administrador.</p>
    <input name="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="12" class="field text-center text-3xl font-bold tracking-[0.4em]" aria-label="PIN" required>
    <p id="pin-error" class="text-tomate-600 font-semibold text-sm hidden" role="alert"></p>
    <button class="btn btn-primary w-full" type="submit">Entrar</button>
  </form>`;

export const productForm = (p = null, nameLocked = false) => `
  <form data-form="producto" class="space-y-4">
    <input type="hidden" name="id" value="${esc(p?.id || '')}">
    <label class="block"><span class="label">Nombre del producto</span>
      <input name="nombre" class="field ${nameLocked ? 'bg-carbon-100 text-carbon-500' : ''}" required maxlength="30" autocomplete="off" ${nameLocked ? 'readonly' : ''} value="${esc(p?.nombre || '')}" placeholder="Ej. Cuatro Quesos">
      ${nameLocked ? '<span class="block text-sm text-carbon-500 mt-1.5">No se puede renombrar: ya tiene registros en el historial.</span>' : ''}</label>
    <fieldset>
      <legend class="label">Tamaños en los que se puede hacer</legend>
      <div class="flex flex-wrap gap-2">
        ${SIZES.map((sz) => {
          const on = p ? p.tamanos.includes(sz) : ['33cm', '25cm'].includes(sz);
          return `<label class="cursor-pointer"><input type="checkbox" name="tamanos" value="${esc(sz)}" class="peer sr-only" ${on ? 'checked' : ''}><span class="chip peer-checked:bg-horno-700 peer-checked:border-horno-700 peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2">${esc(sz)}</span></label>`;
        }).join('')}
      </div>
    </fieldset>
    <p id="form-error" class="text-tomate-600 font-semibold text-sm hidden" role="alert"></p>
    <button class="btn btn-primary w-full" type="submit">Guardar producto</button>
  </form>`;

const comboOptions = (selected) =>
  store
    .catalog()
    .map((g) => `<optgroup label="${esc(g.nombre)}">${g.tamanos.map((sz) => {
      const k = store.keyOf(g.nombre, sz);
      return `<option value="${esc(k)}" ${k === selected ? 'selected' : ''}>${esc(g.nombre)} ${esc(sz)}</option>`;
    }).join('')}</optgroup>`)
    .join('');

export const metaForm = (clave = '') => `
  <form data-form="meta" class="space-y-4">
    <label class="block"><span class="label">Tipo de masa</span>
      <select name="clave" class="field">${comboOptions(clave)}</select></label>
    <label class="block"><span class="label">Cantidad requerida</span>
      <input name="cantidad" type="number" inputmode="numeric" min="1" step="1" class="field" required value="${clave ? esc(store.metaOf(clave)) : ''}" placeholder="Ej. 150"></label>
    <p id="form-error" class="text-tomate-600 font-semibold text-sm hidden" role="alert"></p>
    <button class="btn btn-primary w-full" type="submit">Guardar meta</button>
  </form>`;

export const ajusteForm = () => `
  <form data-form="ajuste" class="space-y-4">
    <label class="block"><span class="label">¿A qué producto?</span>
      <select name="clave" class="field">${comboOptions('')}</select></label>
    <div class="grid grid-cols-2 gap-2" role="group" aria-label="Sumar o restar">
      <label class="cursor-pointer"><input type="radio" name="signo" value="1" class="peer sr-only" checked><span class="chip w-full peer-checked:bg-horno-700 peer-checked:border-horno-700 peer-checked:text-white">Sumar (+)</span></label>
      <label class="cursor-pointer"><input type="radio" name="signo" value="-1" class="peer sr-only"><span class="chip w-full peer-checked:bg-tomate-600 peer-checked:border-tomate-600 peer-checked:text-white">Restar (−)</span></label>
    </div>
    <label class="block"><span class="label">Cantidad</span>
      <input name="cantidad" type="number" inputmode="numeric" min="1" step="1" class="field" required placeholder="Ej. 12"></label>
    <p id="form-error" class="text-tomate-600 font-semibold text-sm hidden" role="alert"></p>
    <button class="btn btn-primary w-full" type="submit">Registrar ajuste</button>
  </form>`;

export const editQtyForm = (m) => `
  <form data-form="edit-qty" class="space-y-4">
    <input type="hidden" name="id" value="${esc(m.id)}">
    <p class="text-carbon-700">${esc(m.usuario)} · ${movDesc(m)}</p>
    <label class="block"><span class="label">Cantidad correcta</span>
      <input name="cantidad" type="number" step="1" ${m.tipo === TIPO.AJUSTE ? '' : 'min="1"'} class="field" required value="${esc(m.cantidad)}"></label>
    <p id="form-error" class="text-tomate-600 font-semibold text-sm hidden" role="alert"></p>
    <button class="btn btn-primary w-full" type="submit">Guardar corrección</button>
  </form>`;

export const userMenu = () => {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  return `
  <div class="space-y-3">
    <p class="text-carbon-500">Sesión de <b class="text-carbon-900">${esc(store.get().usuario)}</b></p>
    <button type="button" data-act="switch-user" class="btn btn-ghost w-full">${icon('logout')} Cambiar de usuario</button>
    ${ui.admin ? `<button type="button" data-act="admin-off" class="btn btn-ghost w-full">${icon('lock')} Salir del modo admin</button>` : `<button type="button" data-act="admin-on" class="btn btn-ghost w-full">${icon('unlock')} Modo administrador</button>`}
    ${ui.installEvt && !standalone ? `<button type="button" data-act="install" class="btn btn-primary w-full">${icon('download')} Instalar la app</button>` : ''}
    ${ios && !standalone ? '<p class="text-sm text-carbon-500 card">iPhone: toca <b>Compartir</b> y luego <b>Añadir a pantalla de inicio</b> para instalarla.</p>' : ''}
    <p class="text-xs text-carbon-500 pt-1">Versión ${esc(CONFIG.APP_VERSION)}</p>
  </div>`;
};
