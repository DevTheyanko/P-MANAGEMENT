// Cliente mínimo de la API v4 de Google Sheets (REST).
// Autenticación: cuenta de servicio → JWT firmado en el navegador con WebCrypto
// → token OAuth de 1 hora. Nadie inicia sesión en Google; la app entra sola.

import { CONFIG } from './config.js';
import { parseStamp, serialToStamp, dayKey } from './util.js';

const API = 'https://sheets.googleapis.com/v4/spreadsheets';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

const S = CONFIG.SHEETS;
const enc = encodeURIComponent;

export class SheetsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code; // 'offline' | 'auth' | 'perm' | 'notfound' | 'range' | 'quota' | 'http'
  }
}

// ───────────────────────── Token (JWT RS256) ─────────────────────────
let tokenCache = { token: null, exp: 0 };

const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlStr = (s) => b64url(new TextEncoder().encode(s));

async function importPrivateKey(pem) {
  const body = pem
    .replace(/\\n/g, '\n')
    .replace(/-----[^-]+-----/g, '')
    .replace(/\s+/g, '');
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey('pkcs8', der.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}

async function getToken() {
  if (tokenCache.token && Date.now() < tokenCache.exp - 60_000) return tokenCache.token;

  const { client_email, private_key } = CONFIG.SERVICE_ACCOUNT;
  const iat = Math.floor(Date.now() / 1000) - 30; // margen por relojes desajustados
  const claim = { iss: client_email, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + 3600 };
  const unsigned = `${b64urlStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64urlStr(JSON.stringify(claim))}`;

  let jwt;
  try {
    const key = await importPrivateKey(private_key);
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
    jwt = `${unsigned}.${b64url(sig)}`;
  } catch (e) {
    throw new SheetsError('auth', 'La clave privada de config.js no es válida. Cópiala completa desde el JSON de Google.');
  }

  let res;
  try {
    res = await fetch(TOKEN_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
    });
  } catch {
    throw new SheetsError('offline', 'No se pudo conectar con Google. Revisa tu internet.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const why = data.error_description || data.error || res.status;
    const clock = /iat|exp|time/i.test(String(why)) ? ' Revisa que la fecha y hora del teléfono sean correctas.' : '';
    throw new SheetsError('auth', `Google rechazó las credenciales (${why}).${clock}`);
  }
  tokenCache = { token: data.access_token, exp: Date.now() + (data.expires_in || 3600) * 1000 };
  return tokenCache.token;
}

// ───────────────────────── Llamadas ─────────────────────────
async function toError(res) {
  const data = await res.json().catch(() => ({}));
  const msg = data?.error?.message || '';
  if (res.status === 403) {
    if (/has not been used|is disabled/i.test(msg)) {
      return new SheetsError('perm', 'Activa "Google Sheets API" en tu proyecto de Google Cloud.');
    }
    return new SheetsError('perm', `Sin permiso. Comparte el Google Sheet como Editor con ${CONFIG.SERVICE_ACCOUNT.client_email}`);
  }
  if (res.status === 404) return new SheetsError('notfound', 'No se encontró el Google Sheet. Revisa SPREADSHEET_ID en config.js.');
  if (res.status === 400 && /must not be an Office file|not supported for this document/i.test(msg)) {
    return new SheetsError(
      'range',
      'Ese archivo sigue siendo un Excel (.xlsx) en Drive. Ábrelo y usa Archivo → Guardar como hoja de cálculo de Google, luego usa el ID de esa copia nueva en SPREADSHEET_ID.'
    );
  }
  if (res.status === 400 && /parse range|not found/i.test(msg)) {
    return new SheetsError('range', 'Faltan pestañas en el Sheet: deben llamarse MOVIMIENTOS, PRODUCTOS y METAS.');
  }
  if (res.status === 429) return new SheetsError('quota', 'Google pidió esperar (límite de uso). Intenta de nuevo en un minuto.');
  return new SheetsError('http', `Error de Google (${res.status}). ${msg}`.trim());
}

async function api(path, { method = 'GET', body, retry = true } = {}) {
  if (/^https?:\/\//i.test(CONFIG.SPREADSHEET_ID) || CONFIG.SPREADSHEET_ID.includes('docs.google.com')) {
    throw new SheetsError(
      'http',
      'SPREADSHEET_ID en config.js tiene la URL completa en vez del ID. Deja solo la parte entre "/d/" y "/edit".'
    );
  }
  const token = await getToken();
  let res;
  try {
    res = await fetch(`${API}/${CONFIG.SPREADSHEET_ID}${path}`, {
      method,
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new SheetsError('offline', 'No se pudo conectar con Google. Revisa tu internet.');
  }
  if (res.status === 401 && retry) {
    tokenCache = { token: null, exp: 0 };
    return api(path, { method, body, retry: false });
  }
  if (!res.ok) throw await toError(res);
  return res.json();
}

// ───────────────────────── Lectura ─────────────────────────
const num = (v) => {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
const txt = (v) => (v === undefined || v === null ? '' : String(v).trim());

const fechaTxt = (v) => (typeof v === 'number' ? serialToStamp(v) : txt(v));

/** Descarga las 3 pestañas en una sola petición. */
export async function pullAll() {
  const q = [`${S.MOVIMIENTOS}!A2:H`, `${S.PRODUCTOS}!A2:C`, `${S.METAS}!A2:C`].map((r) => `ranges=${enc(r)}`).join('&');
  const data = await api(`/values:batchGet?${q}&valueRenderOption=UNFORMATTED_VALUE`);
  const [mv, pr, me] = (data.valueRanges || []).map((v) => v.values || []);

  const movs = mv
    .filter((r) => txt(r[0]))
    .map((r) => ({
      id: txt(r[0]),
      fecha: fechaTxt(r[1]),
      usuario: txt(r[2]),
      tipo: txt(r[3]),
      categoria: txt(r[4]),
      tamano: txt(r[5]),
      cantidad: num(r[6]),
      estado: txt(r[7]) || 'SINCRONIZADO',
    }));

  const productos = pr
    .filter((r) => txt(r[1]))
    .map((r) => ({
      id: txt(r[0]) || 'P-' + txt(r[1]).toUpperCase().replace(/\W+/g, ''),
      nombre: txt(r[1]),
      tamanos: txt(r[2]).split(/[,;|]/).map((s) => s.trim()).filter(Boolean),
    }));

  const metas = me
    .filter((r) => txt(r[1]) && num(r[2]) > 0)
    .map((r) => {
      const f = typeof r[0] === 'number' ? parseStamp(r[0]) : parseStamp(txt(r[0]));
      return { fecha: f ? dayKey(f) : txt(r[0]), clave: txt(r[1]), cantidad: num(r[2]) };
    });

  return { movs, productos, metas };
}

/** Mapa id → número de fila (para editar/anular y para detectar duplicados). */
export async function getIdRows() {
  const data = await api(`/values/${enc(`${S.MOVIMIENTOS}!A2:A`)}?valueRenderOption=UNFORMATTED_VALUE`);
  const map = new Map();
  (data.values || []).forEach((r, i) => {
    const id = txt(r[0]);
    if (id && !map.has(id)) map.set(id, i + 2);
  });
  return map;
}

// ───────────────────────── Escritura ─────────────────────────
export const movRow = (m) => [m.id, m.fecha, m.usuario, m.tipo, m.categoria, m.tamano, m.cantidad, 'SINCRONIZADO'];

/** Agrega filas al final de MOVIMIENTOS en UNA sola petición (todo o nada). */
export async function appendMovs(list) {
  if (!list.length) return;
  await api(`/values/${enc(`${S.MOVIMIENTOS}!A:H`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    body: { values: list.map(movRow) },
  });
}

/** items: [{ row, cantidad, estado }] → corrige columnas G (Cantidad) y H (Estado_Sincro). */
export async function updateMovs(items) {
  if (!items.length) return;
  const data = items.map((it) => ({
    range: `${S.MOVIMIENTOS}!G${it.row}:H${it.row}`,
    values: [[it.cantidad, it.estado]],
  }));
  await api('/values:batchUpdate', { method: 'POST', body: { valueInputOption: 'RAW', data } });
}

/** Reemplaza el contenido (sin encabezado) de una pestaña con una sola actualización atómica. */
async function writeTable(name, lastCol, rows) {
  const cur = await api(`/values/${enc(`${name}!A2:${lastCol}`)}?valueRenderOption=UNFORMATTED_VALUE`);
  const n = Math.max((cur.values || []).length, rows.length);
  if (n === 0) return;
  const width = lastCol.charCodeAt(0) - 64;
  const padded = rows.slice();
  while (padded.length < n) padded.push(Array(width).fill(''));
  await api('/values:batchUpdate', {
    method: 'POST',
    body: { valueInputOption: 'RAW', data: [{ range: `${name}!A2:${lastCol}${n + 1}`, values: padded }] },
  });
}

export const writeProductos = (list) =>
  writeTable(S.PRODUCTOS, 'C', list.map((p) => [p.id, p.nombre, p.tamanos.join(',')]));

export const writeMetas = (list) =>
  writeTable(S.METAS, 'C', list.map((m) => [m.fecha, m.clave, m.cantidad]));
