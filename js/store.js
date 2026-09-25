// Estado de la app + persistencia local (localStorage) + reglas de inventario.
// Todo lo que el usuario registra vive aquí primero; la hoja de cálculo
// solo se toca cuando se pulsa "Subir" (sync.js).

import { CONFIG } from './config.js';
import { uuid, stamp, dayKey, parseStamp } from './util.js';

const KEY = 'pz_state_v1';

export const BASE = CONFIG.BASE_NAME;
export const TIPO = { PROD: 'PRODUCCION_BASE', PROC: 'PROCESAMIENTO', AJUSTE: 'AJUSTE_ADMIN' };
export const SIZES = CONFIG.TAMANOS.map((t) => t.id);

/** Clave de una combinación producto+tamaño. También es lo que va en METAS.Tamaño_Producto */
export const keyOf = (cat, size) => `${cat} - ${size}`;
export const labelOf = (cat, size) => `${cat} ${size}`;

const defaults = () => ({
  v: 1,
  usuario: null,
  // movs: { id, fecha, usuario, tipo, categoria, tamano, cantidad, estado, dirty }
  //   dirty: 'NEW' (falta subir) | 'EDIT' | 'VOID' (cambios sobre algo ya subido) | null
  movs: [],
  productos: CONFIG.PRODUCTOS_INICIALES.map((p) => ({ id: p.id, nombre: p.nombre, tamanos: [...p.tamanos] })),
  prodDirty: false,
  metas: [], // { fecha, clave, cantidad }
  metasDirty: false,
  lastPull: null,
  lastPush: null,
});

let state = defaults();
const listeners = new Set();

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...defaults(), ...JSON.parse(raw) };
  } catch (e) {
    console.warn('No se pudo leer el estado local', e);
  }
  return state;
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error('No se pudo guardar en el dispositivo', e);
  }
}

export function commit() {
  save();
  listeners.forEach((fn) => fn());
}

export const get = () => state;
export const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));

// ───────────────────────── Usuario ─────────────────────────
export function setUsuario(name) {
  state.usuario = name || null;
  commit();
}

// ───────────────────────── Movimientos ─────────────────────────
export const isVoid = (m) => String(m.estado || '').toUpperCase() === 'ANULADO';

export function addMov({ tipo, categoria, tamano, cantidad }) {
  const m = {
    id: uuid(), // ← identificador único: es lo que evita duplicados al sincronizar
    fecha: stamp(),
    usuario: state.usuario || 'Sin nombre',
    tipo,
    categoria,
    tamano,
    cantidad: Math.trunc(cantidad),
    estado: 'PENDIENTE',
    dirty: 'NEW',
  };
  state.movs.push(m);
  commit();
  return m;
}

export function editMov(id, cantidad) {
  const m = state.movs.find((x) => x.id === id);
  if (!m || isVoid(m)) return;
  m.cantidad = Math.trunc(cantidad);
  if (m.dirty !== 'NEW') m.dirty = 'EDIT';
  commit();
}

/** Pendiente → se elimina localmente. Ya subido → se marca ANULADO (queda el rastro en la hoja). */
export function removeMov(id) {
  const i = state.movs.findIndex((x) => x.id === id);
  if (i < 0) return;
  const m = state.movs[i];
  if (m.dirty === 'NEW') {
    state.movs.splice(i, 1);
  } else {
    m.estado = 'ANULADO';
    m.dirty = 'VOID';
  }
  commit();
}

export const pendingMovs = () => state.movs.filter((m) => m.dirty);
export const pendingCount = () =>
  pendingMovs().length + (state.prodDirty ? 1 : 0) + (state.metasDirty ? 1 : 0);

// ───────────────────────── Inventario ─────────────────────────
/** Cada movimiento produce 1 o 2 efectos [categoria, tamaño, delta]. */
export function effects(m) {
  const q = Number(m.cantidad) || 0;
  switch (m.tipo) {
    case TIPO.PROD:
      return [[BASE, m.tamano, q]];
    case TIPO.PROC: // doble movimiento automático: resta masa base, suma producto
      return [[BASE, m.tamano, -q], [m.categoria, m.tamano, q]];
    case TIPO.AJUSTE:
      return [[m.categoria, m.tamano, q]];
    default:
      return [];
  }
}

export function computeStock(movs = state.movs) {
  const map = new Map();
  for (const m of movs) {
    if (isVoid(m)) continue;
    for (const [c, s, d] of effects(m)) {
      const k = keyOf(c, s);
      map.set(k, (map.get(k) || 0) + d);
    }
  }
  return map;
}

export const stockOf = (cat, size, stock = computeStock()) => stock.get(keyOf(cat, size)) || 0;

/** Todas las combinaciones válidas: masa base × tamaños, y cada producto × sus tamaños. */
export function catalog() {
  const groups = [{ nombre: BASE, tamanos: [...SIZES], base: true }];
  for (const p of state.productos) {
    groups.push({ id: p.id, nombre: p.nombre, tamanos: SIZES.filter((s) => p.tamanos.includes(s)), base: false });
  }
  return groups;
}

export function combos() {
  return catalog().flatMap((g) => g.tamanos.map((s) => ({ cat: g.nombre, size: s, key: keyOf(g.nombre, s) })));
}

// ───────────────────────── Productos ─────────────────────────
export function saveProducto({ id, nombre, tamanos }) {
  const clean = { nombre: nombre.trim(), tamanos: SIZES.filter((s) => tamanos.includes(s)) };
  if (id) {
    const p = state.productos.find((x) => x.id === id);
    if (p) {
      // quitar metas de tamaños que ya no aplican a este producto
      const before = state.metas.length;
      state.metas = state.metas.filter((m) => !m.clave.startsWith(`${p.nombre} - `) || clean.tamanos.some((s) => m.clave === keyOf(p.nombre, s)));
      if (state.metas.length !== before) state.metasDirty = true;
      Object.assign(p, clean);
    }
  } else {
    state.productos.push({ id: 'P-' + uuid().slice(0, 8).toUpperCase(), ...clean });
  }
  state.prodDirty = true;
  commit();
}

export function deleteProducto(id) {
  const p = state.productos.find((x) => x.id === id);
  if (p) {
    const before = state.metas.length;
    state.metas = state.metas.filter((m) => !m.clave.startsWith(`${p.nombre} - `));
    if (state.metas.length !== before) state.metasDirty = true;
  }
  state.productos = state.productos.filter((x) => x.id !== id);
  state.prodDirty = true;
  commit();
}

// ───────────────────────── Metas ─────────────────────────
export function setMeta(clave, cantidad) {
  state.metas = state.metas.filter((m) => m.clave !== clave);
  if (cantidad > 0) state.metas.push({ fecha: dayKey(new Date()), clave, cantidad: Math.trunc(cantidad) });
  state.metasDirty = true;
  commit();
}

export const metaOf = (clave) => state.metas.find((m) => m.clave === clave)?.cantidad ?? 0;

// ───────────────────────── Sincronización (llamado por sync.js) ─────────────────────────
export function markSynced(ids) {
  const set = new Set(ids);
  for (const m of state.movs) {
    if (set.has(m.id)) {
      m.dirty = null;
      m.estado = 'SINCRONIZADO';
    }
  }
  commit();
}

export function clearDirty(ids) {
  const set = new Set(ids);
  for (const m of state.movs) if (set.has(m.id)) m.dirty = null;
  commit();
}

export function dropLocal(ids) {
  const set = new Set(ids);
  state.movs = state.movs.filter((m) => !set.has(m.id));
  commit();
}

export function clearConfigDirty({ productos, metas }) {
  if (productos) state.prodDirty = false;
  if (metas) state.metasDirty = false;
  commit();
}

/**
 * Fusiona lo descargado de la hoja con lo local.
 * - La hoja manda para todo lo ya subido.
 * - Se conservan los registros locales pendientes (aún no subidos).
 * - Se conservan ediciones/anulaciones locales pendientes de subir.
 * - Productos y metas con cambios locales sin subir NO se sobrescriben.
 */
export function applyRemote({ movs, productos, metas }) {
  const remoteIds = new Set(movs.map((m) => m.id));
  const localById = new Map(state.movs.map((m) => [m.id, m]));

  const merged = movs.map((r) => {
    const l = localById.get(r.id);
    if (l && (l.dirty === 'EDIT' || l.dirty === 'VOID')) {
      return { ...r, cantidad: l.cantidad, estado: l.estado, dirty: l.dirty };
    }
    return { ...r, dirty: null };
  });
  for (const l of state.movs) {
    if (l.dirty === 'NEW' && !remoteIds.has(l.id)) merged.push(l);
  }
  merged.sort((a, b) => (parseStamp(a.fecha)?.getTime() || 0) - (parseStamp(b.fecha)?.getTime() || 0));
  state.movs = merged;

  const skipped = { productos: state.prodDirty, metas: state.metasDirty };
  if (!state.prodDirty && productos.length) state.productos = productos;
  if (!state.metasDirty) state.metas = metas;

  state.lastPull = new Date().toISOString();
  commit();
  return skipped;
}

export function setLastPush() {
  state.lastPush = new Date().toISOString();
  commit();
}
