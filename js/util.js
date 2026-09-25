// Utilidades pequeñas y sin dependencias.

export const uuid = () => {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  // Fallback para contextos no seguros (http en red local)
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

const p2 = (n) => String(n).padStart(2, '0');

export const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
export const MESES_LARGO = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** "2026-09-24 10:32:05" en hora local del dispositivo */
export const stamp = (d = new Date()) =>
  `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;

/** "2026-09-24" */
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

/** Convierte lo que venga de la hoja (texto ISO, dd/mm/aaaa o número serial) a Date local. */
export function parseStamp(v) {
  if (v instanceof Date) return v;
  if (typeof v === 'number') return parseStamp(serialToStamp(v));
  const s = String(v ?? '').trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  return null;
}

/** Número serial de Google Sheets → "aaaa-mm-dd hh:mm:ss" */
export function serialToStamp(n) {
  const d = new Date(Math.round((n - 25569) * 86400000));
  return `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())}`;
}

export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** Lunes de la semana de `d` */
export const weekStart = (d) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));

/** "24/SEP/2026" */
export const fmtDay = (d) => `${p2(d.getDate())}/${MESES[d.getMonth()]}/${d.getFullYear()}`;
/** "24/SEP" */
export const fmtDayShort = (d) => `${p2(d.getDate())}/${MESES[d.getMonth()]}`;
/** "10:32" */
export const fmtTime = (d) => `${p2(d.getHours())}:${p2(d.getMinutes())}`;

export const fmtNum = (n) => new Intl.NumberFormat('es').format(n);

export function timeAgo(iso) {
  if (!iso) return 'nunca';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 45) return 'hace un momento';
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  return `hace ${Math.round(s / 86400)} d`;
}

export const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ───────────────────────── Tema claro / oscuro ─────────────────────────
const THEME_KEY = 'pz_theme';

/** 'light' | 'dark' | 'system' (system = sigue las preferencias del dispositivo). */
export function getTheme() {
  const t = localStorage.getItem(THEME_KEY);
  return t === 'light' || t === 'dark' ? t : 'system';
}

export function applyTheme(theme) {
  if (theme === 'light' || theme === 'dark') {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
  } else {
    localStorage.removeItem(THEME_KEY);
    document.documentElement.removeAttribute('data-theme');
  }
}

export function cycleTheme() {
  const next = { system: 'light', light: 'dark', dark: 'system' }[getTheme()];
  applyTheme(next);
  return next;
}
