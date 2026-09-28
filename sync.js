// Sincronización manual. Garantía de "cero duplicados":
//  1) cada registro tiene un UUID generado al crearlo;
//  2) antes de subir se lee la columna ID_Transaccion de la hoja;
//  3) solo se agregan los UUID que la hoja todavía no tiene;
//  4) un candado (busy) ignora pulsaciones repetidas del botón.
// Si se corta internet justo después de que Google guardó, la siguiente
// subida ve el UUID en la hoja y solo lo marca como sincronizado.

import { isConfigured } from './config.js';
import * as store from './store.js';
import * as sheets from './sheets.js';

let busy = false;
const listeners = new Set();
export const isBusy = () => busy;
export const onBusy = (fn) => (listeners.add(fn), () => listeners.delete(fn));
const setBusy = (v) => {
  busy = v;
  listeners.forEach((fn) => fn(v));
};

function precheck() {
  if (!isConfigured()) {
    throw new sheets.SheetsError('config', 'Falta configurar js/config.js (Spreadsheet ID y credenciales). Mientras tanto la app guarda todo en este dispositivo.');
  }
  if (!navigator.onLine) throw new sheets.SheetsError('offline', 'Sin conexión. Tus registros siguen guardados en el dispositivo.');
}

/** Descargar: hoja → dispositivo. */
export async function pull() {
  precheck();
  if (busy) return { busy: true };
  setBusy(true);
  try {
    const remote = await sheets.pullAll();
    const skipped = store.applyRemote(remote);
    return { skipped };
  } finally {
    setBusy(false);
  }
}

/** Subir: dispositivo → hoja. Devuelve un resumen para mostrar al usuario. */
export async function push() {
  precheck();
  if (busy) return { busy: true };
  setBusy(true);
  try {
    const s = store.get();
    const dirty = store.pendingMovs();
    const summary = { uploaded: 0, alreadyThere: 0, corrected: 0, voided: 0, config: 0 };

    if (dirty.length) {
      const rows = await sheets.getIdRows(); // id → fila

      // 1) Registros nuevos
      const news = dirty.filter((m) => m.dirty === 'NEW');
      const already = news.filter((m) => rows.has(m.id));
      const fresh = news.filter((m) => !rows.has(m.id));
      if (fresh.length) await sheets.appendMovs(fresh);
      store.markSynced([...already, ...fresh].map((m) => m.id));
      summary.uploaded = fresh.length;
      summary.alreadyThere = already.length;

      // 2) Correcciones y anulaciones de registros ya subidos
      const changes = dirty.filter((m) => m.dirty === 'EDIT' || m.dirty === 'VOID');
      if (changes.length) {
        const updates = [];
        const gone = [];
        for (const m of changes) {
          const row = rows.get(m.id);
          if (!row) gone.push(m.id); // alguien lo borró a mano de la hoja
          else updates.push({ row, cantidad: m.cantidad, estado: m.dirty === 'VOID' ? 'ANULADO' : 'CORREGIDO' });
        }
        if (updates.length) await sheets.updateMovs(updates);
        summary.corrected = changes.filter((m) => m.dirty === 'EDIT' && !gone.includes(m.id)).length;
        summary.voided = changes.filter((m) => m.dirty === 'VOID' && !gone.includes(m.id)).length;
        store.clearDirty(changes.filter((m) => !gone.includes(m.id)).map((m) => m.id));
        store.dropLocal(gone);
      }
    }

    // 3) Configuración (productos / metas) — reemplazo completo, gana lo último subido
    const doProd = s.prodDirty;
    const doMetas = s.metasDirty;
    if (doProd) await sheets.writeProductos(s.productos);
    if (doMetas) await sheets.writeMetas(s.metas);
    if (doProd || doMetas) {
      store.clearConfigDirty({ productos: doProd, metas: doMetas });
      summary.config = Number(doProd) + Number(doMetas);
    }

    store.setLastPush();

    // 4) Reconciliar: bajar el estado real de la hoja
    try {
      store.applyRemote(await sheets.pullAll());
    } catch {
      /* la subida ya salió bien; el refresco puede repetirse a mano */
    }
    return summary;
  } finally {
    setBusy(false);
  }
}
