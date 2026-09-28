// Reportes por día / semana / mes → texto para WhatsApp e imagen PNG.

import { BASE, TIPO, SIZES, isVoid, computeStock, combos, keyOf, metaOf } from './store.js';
import {
  addDays, weekStart, startOfDay, fmtDay, fmtDayShort, MESES_LARGO, parseStamp,
} from './util.js';

// "Con Salsa" → "Salsa" (se lee mejor en el reporte)
const short = (nombre) => nombre.replace(/^con\s+/i, '');
const sizeIdx = (s) => {
  const i = SIZES.indexOf(s);
  return i < 0 ? 99 : i;
};

export function periodRange(kind, ref) {
  const d = startOfDay(ref);
  if (kind === 'week') {
    const from = weekStart(d);
    const last = addDays(from, 6);
    return { from, to: addDays(from, 7), title: `REPORTE DE PRODUCCIÓN - SEMANA ${fmtDayShort(from)} al ${fmtDay(last)}` };
  }
  if (kind === 'month') {
    const from = new Date(d.getFullYear(), d.getMonth(), 1);
    return {
      from,
      to: new Date(d.getFullYear(), d.getMonth() + 1, 1),
      title: `REPORTE DE PRODUCCIÓN - ${MESES_LARGO[d.getMonth()].toUpperCase()} ${d.getFullYear()}`,
    };
  }
  return { from: d, to: addDays(d, 1), title: `REPORTE DE PRODUCCIÓN - ${fmtDay(d)}` };
}

export function buildReport(state, kind, ref, { includeStock = true } = {}) {
  const { from, to, title } = periodRange(kind, ref);
  const inRange = state.movs.filter((m) => {
    if (isVoid(m)) return false;
    const d = parseStamp(m.fecha);
    return d && d >= from && d < to;
  });

  // usuario → items
  const byUser = new Map();
  const totProd = new Map(); // tamaño → qty
  const totProc = new Map(); // "Producto tamaño" → qty
  for (const m of inRange) {
    const u = m.usuario || 'Sin nombre';
    if (!byUser.has(u)) byUser.set(u, new Map());
    const items = byUser.get(u);
    const k = `${m.tipo}|${m.categoria}|${m.tamano}`;
    const it = items.get(k) || { tipo: m.tipo, categoria: m.categoria, tamano: m.tamano, qty: 0 };
    it.qty += Number(m.cantidad) || 0;
    items.set(k, it);

    if (m.tipo === TIPO.PROD) totProd.set(m.tamano, (totProd.get(m.tamano) || 0) + (Number(m.cantidad) || 0));
    if (m.tipo === TIPO.PROC) {
      const key = `${short(m.categoria)} ${m.tamano}`;
      totProc.set(key, (totProc.get(key) || 0) + (Number(m.cantidad) || 0));
    }
  }

  const order = { [TIPO.PROD]: 0, [TIPO.PROC]: 1, [TIPO.AJUSTE]: 2 };
  const users = [...byUser.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'es'))
    .map(([usuario, map]) => ({
      usuario,
      items: [...map.values()]
        .sort((a, b) => order[a.tipo] - order[b.tipo] || sizeIdx(a.tamano) - sizeIdx(b.tamano) || a.categoria.localeCompare(b.categoria))
        .map((it) => ({ ...it, text: itemText(it) })),
    }));

  const prodList = [...totProd.entries()].sort((a, b) => sizeIdx(a[0]) - sizeIdx(b[0])).map(([size, qty]) => ({ label: `Masas ${size}`, qty }));
  const procList = [...totProc.entries()].map(([label, qty]) => ({ label, qty }));

  // Inventario actual (siempre el acumulado real, no solo el periodo)
  const stock = [];
  if (includeStock) {
    const st = computeStock(state.movs);
    const seen = new Set();
    for (const c of combos()) {
      seen.add(c.key);
      pushStock(stock, c.cat, c.size, st.get(c.key) || 0);
    }
    for (const [k, q] of st) if (!seen.has(k) && q) pushStock(stock, k, '', q);
  }

  return {
    title,
    from,
    to,
    users,
    totalProd: prodList,
    totalProc: procList,
    sumProd: prodList.reduce((a, x) => a + x.qty, 0),
    sumProc: procList.reduce((a, x) => a + x.qty, 0),
    stock,
    empty: users.length === 0,
  };
}

function pushStock(list, cat, size, qty) {
  const key = size ? keyOf(cat, size) : cat;
  const meta = metaOf(key);
  if (!qty && !meta) return;
  const label = size ? `${cat === BASE ? 'Masas' : short(cat)} ${size}` : cat;
  list.push({ label, qty, meta });
}

function itemText(it) {
  const name = it.categoria === BASE ? 'Masas' : short(it.categoria);
  if (it.tipo === TIPO.AJUSTE) return `Ajuste ${name} ${it.tamano}: ${it.qty > 0 ? '+' : ''}${it.qty}`;
  return `${it.qty}x ${name} ${it.tamano}`;
}

const ICON = { [TIPO.PROD]: '➕', [TIPO.PROC]: '🔄', [TIPO.AJUSTE]: '🛠️' };

export function reportText(model) {
  const L = [`🍕 *${model.title}*`, ''];
  if (model.empty) {
    L.push('_Sin movimientos en este periodo._');
  } else {
    for (const u of model.users) {
      L.push(`👤 *${u.usuario}:*`);
      for (const it of u.items) L.push(`   ${ICON[it.tipo] || '•'} ${it.text}`);
      L.push('');
    }
    if (model.sumProd) L.push(`📦 *Total producido:* ${model.sumProd}`);
    if (model.sumProc) L.push(`🔄 *Total procesado:* ${model.sumProc}`);
  }
  if (model.stock.length) {
    L.push('', '📊 *INVENTARIO ACTUAL*');
    for (const s of model.stock) L.push(`   • ${s.label}: ${s.qty}${metaSuffix(s)}`);
  }
  return L.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function metaSuffix(s) {
  if (!s.meta) return '';
  const diff = s.meta - s.qty;
  return diff > 0 ? ` ⚠️ faltan ${diff} (meta ${s.meta})` : ` ✅ meta ${s.meta}${diff < 0 ? ` (+${-diff})` : ''}`;
}

// ───────────────────────── Exportar ─────────────────────────
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch { /* noop */ }
    ta.remove();
    return ok;
  }
}

let h2cPromise;
function loadHtml2canvas() {
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  h2cPromise ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'vendor/html2canvas.min.js';
    s.onload = () => resolve(window.html2canvas);
    s.onerror = () => reject(new Error('No se pudo cargar html2canvas'));
    document.head.appendChild(s);
  });
  return h2cPromise;
}

/** Renderiza el HTML de la tarjeta fuera de pantalla y devuelve un Blob PNG. */
export async function renderPng(cardHtml) {
  const h2c = await loadHtml2canvas();
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:480px;pointer-events:none';
  host.innerHTML = cardHtml;
  document.body.appendChild(host);
  try {
    await document.fonts?.ready;
    const canvas = await h2c(host.firstElementChild, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
    return await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('No se generó la imagen'))), 'image/png'));
  } finally {
    host.remove();
  }
}
