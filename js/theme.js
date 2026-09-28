// ───────────────────────── Color de marca personalizable ─────────────────────────
// A partir de UN solo color (CONFIG.BRAND_COLOR, p. ej. '#FF0000') se calculan
// automáticamente los tonos que usa toda la app (botones, selección, textos e
// hints sobre tarjeta clara/oscura), variando solo la luminosidad y conservando
// el matiz (tono) elegido. Así, cambiar un color en config.js repinta la app entera.

function hexToRgb(hex) {
  let h = String(hex || '').replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) return [255, 0, 0]; // rojo de respaldo si el valor es inválido
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToRgbTriplet(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return `${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)}`;
}

/** Aplica CONFIG.BRAND_COLOR como color de marca de toda la app. */
export function applyBrandColor(hex) {
  const [r, g, b] = hexToRgb(hex);
  const [h, s] = rgbToHsl(r, g, b);
  const at = (l) => hslToRgbTriplet(h, s, l);
  const root = document.documentElement.style;
  root.setProperty('--brand-600', at(50));
  root.setProperty('--brand-700', at(44));
  root.setProperty('--brand-800', at(38));
  root.setProperty('--brand-900', at(29));
  root.setProperty('--brand-50', at(97));
  root.setProperty('--brand-100', at(93));
  root.setProperty('--brand-text-light', at(38));
  root.setProperty('--brand-text-dark', at(68));
  root.setProperty('--brand-tint-light', at(97));
  root.setProperty('--brand-tint-dark', at(11));
}
