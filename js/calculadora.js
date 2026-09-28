// Calculadora de masa: por unidades de pizza o por kilos de harina.

import { CONFIG } from './config.js';
import { esc } from './util.js';
import { icon } from './icons.js';
import { openModal, toast } from './modal.js';
import { copyText } from './report.js';

const RECETA = CONFIG.RECETA;
const HARINA_BASE = RECETA.find((r) => r.id === 'harina').base;
const TOTAL_BASE = RECETA.reduce((a, r) => a + r.base, 0);

const first = CONFIG.TAMANOS.find((t) => t.id === '33cm') || CONFIG.TAMANOS[0];
const calc = { mode: 'pizzas', size: first.id, peso: first.peso, qty: 10, kg: '3' };

const num = (v) => {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const nf = (n, d = 0) => new Intl.NumberFormat('es', { maximumFractionDigits: d }).format(n);

function fmtG(g, unit = 'g') {
  if (unit === 'ml') return g >= 1000 ? `${nf(g / 1000, 2)} L` : `${nf(g)} ml`;
  if (g >= 10000) return `${nf(g / 1000, 2)} kg`;
  return `${nf(g, g < 100 ? 1 : 0)} g`;
}

const disc = (id) => {
  const t = CONFIG.TAMANOS.find((x) => x.id === id);
  const d = Math.round((t?.dia ?? 40) * 1);
  if (t?.forma === 'rectangulo') return `<span class="disc disc-rect" style="width:${Math.round(d * 0.8)}px;height:${Math.round(d * 1.34)}px"></span>`;
  return `<span class="disc" style="width:${d}px;height:${d}px"></span>`;
};

function compute() {
  const peso = calc.peso;
  const kg = calc.mode === 'flour' ? num(calc.kg) : 0;
  const total = calc.mode === 'pizzas' ? calc.qty * peso : kg * TOTAL_BASE;
  const factor = total / TOTAL_BASE;
  const items = RECETA.map((r) => ({ ...r, valor: r.base * factor }));
  const flour = items.find((i) => i.id === 'harina').valor;
  let rend = null;
  if (calc.mode === 'flour') {
    const n = peso > 0 ? Math.floor(total / peso + 1e-9) : 0;
    rend = { n, sobrante: peso > 0 ? total - n * peso : 0, exacto: n > 0 ? total / n : 0 };
  }
  return { total, items, flour, rend };
}

function outHtml() {
  const { total, items, flour, rend } = compute();
  const yieldHtml = rend
    ? `<div class="card">
        <h3 class="h3">Rendimiento</h3>
        <p><span class="text-4xl font-extrabold tabular-nums">${nf(rend.n)}</span> <span class="text-carbon-500 text-lg">pizza${rend.n === 1 ? '' : 's'} de ${nf(calc.peso)} g</span></p>
        <p class="text-[15px] text-carbon-700 mt-1">Sobrante de masa: <b>${nf(rend.sobrante)} g</b></p>
        <p class="calc-note rounded-xl px-3.5 py-3 text-[15px] leading-relaxed mt-3">${
          rend.n > 0
            ? `Si cortas los bollos de <b>${nf(rend.exacto, 1)} g</b> en vez de ${nf(calc.peso)} g, salen exactamente ${nf(rend.n)} sin sobrante.`
            : `Sube la harina para completar una pizza de ${nf(calc.peso)} g.`
        }</p>
      </div>`
    : '';
  return `
    <div class="calc-total rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3">
      <span class="font-bold">Masa total</span>
      <span class="text-3xl font-extrabold tabular-nums">${total > 0 ? fmtG(total) : '0 g'}</span>
    </div>
    ${yieldHtml}
    <div>
      <h3 class="h3">Ingredientes</h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        ${items
          .map((i) => {
            const pct = flour > 0 ? (i.valor / flour) * 100 : (i.base / HARINA_BASE) * 100;
            return `<div class="tile ${i.valor > 0 ? '' : 'tile-zero'}">
              <p class="text-sm font-semibold text-carbon-700">${esc(i.nombre)}</p>
              <p class="text-2xl font-extrabold tabular-nums mt-1">${i.valor > 0 ? fmtG(i.valor, i.unidad) : `0 ${i.unidad || 'g'}`}</p>
              <p class="text-xs text-carbon-500 mt-0.5">${i.id === 'harina' ? (flour > 0 ? `${nf(flour / 1000, 2)} kg` : '0 kg') : `${nf(pct, 1)}%`}</p>
            </div>`;
          })
          .join('')}
      </div>
    </div>`;
}

export function updateCalcOut() {
  const el = document.getElementById('calc-out');
  if (el) el.innerHTML = outHtml();
}

export function viewCalculadora() {
  const byPizza = calc.mode === 'pizzas';
  return `
  <section class="space-y-4 max-w-xl">
    <div>
      <h2 class="h2">Calculadora de masa</h2>
      <p class="text-carbon-500 text-[15px]">Cuánto pesar de cada ingrediente para tu amasada.</p>
    </div>

    <div class="grid grid-cols-2 p-1 bg-carbon-100 rounded-2xl" role="group" aria-label="Calcular por">
      <button type="button" data-act="calc-mode" data-mode="pizzas" class="seg-btn ${byPizza ? 'is-on' : ''}">Por pizzas</button>
      <button type="button" data-act="calc-mode" data-mode="flour" class="seg-btn ${!byPizza ? 'is-on' : ''}">Por harina</button>
    </div>

    <div class="card">
      <h3 class="h3">Tamaño del bollo</h3>
      <div class="grid grid-cols-5 gap-1">
        ${CONFIG.TAMANOS.map(
          (t) => `<button type="button" data-act="calc-size" data-size="${esc(t.id)}" class="size-btn ${calc.size === t.id ? 'is-on' : ''}" aria-pressed="${calc.size === t.id}">
            <span class="size-slot">${disc(t.id)}</span>
            <span class="size-lbl">${esc(t.id)}</span>
            <span class="text-xs text-carbon-500 tabular-nums">${nf(t.peso)} g</span>
          </button>`,
        ).join('')}
      </div>
      <label class="label mt-4" for="calc-peso">Peso por bollo (g)</label>
      <input id="calc-peso" type="text" inputmode="numeric" autocomplete="off" value="${calc.peso || ''}" class="field font-bold tabular-nums">
    </div>

    <div class="card">
      ${
        byPizza
          ? `<h3 class="h3">¿Cuántas pizzas?</h3>
      <div class="flex items-stretch gap-3">
        <button type="button" data-act="calc-qty-dec" class="step-btn" aria-label="Restar uno">${icon('minus', 'w-7 h-7')}</button>
        <input id="calc-qty" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="0" value="${calc.qty || ''}" class="field text-center text-4xl font-extrabold tabular-nums flex-1 min-w-0" aria-label="Cantidad de pizzas">
        <button type="button" data-act="calc-qty-inc" class="step-btn" aria-label="Sumar uno">${icon('plus', 'w-7 h-7')}</button>
      </div>
      <div class="flex flex-wrap gap-1.5 mt-3">
        ${[5, 10, 50].map((n) => `<button type="button" data-act="calc-qty-add" data-n="${n}" class="chip !px-3">+${n}</button>`).join('')}
        <button type="button" data-act="calc-clear" class="chip !px-3 ml-auto text-carbon-500">Borrar</button>
      </div>`
          : `<h3 class="h3">Kilos de harina</h3>
      <input id="calc-kg" type="text" inputmode="decimal" autocomplete="off" placeholder="0" value="${esc(calc.kg)}" class="field text-center text-4xl font-extrabold tabular-nums w-full" aria-label="Kilos de harina">
      <div class="flex flex-wrap gap-1.5 mt-3">
        ${[1, 5, 10].map((n) => `<button type="button" data-act="calc-kg-add" data-n="${n}" class="chip !px-3">+${n} kg</button>`).join('')}
        <button type="button" data-act="calc-clear" class="chip !px-3 ml-auto text-carbon-500">Borrar</button>
      </div>`
      }
    </div>

    <div id="calc-out" class="space-y-4">${outHtml()}</div>

    <div class="grid grid-cols-2 gap-3">
      <button type="button" data-act="calc-copy" class="btn btn-primary">${icon('copy', 'w-5 h-5')} Copiar receta</button>
      <button type="button" data-act="calc-base" class="btn btn-ghost">Fórmula base</button>
    </div>
  </section>`;
}

function recipeText() {
  const { total, items, rend } = compute();
  const lines = [`Receta de masa - ${CONFIG.APP_NAME}`, '------------------------------'];
  if (calc.mode === 'pizzas') lines.push(`Objetivo: ${nf(calc.qty)} pizzas de ${nf(calc.peso)} g (${calc.size || 'a medida'})`);
  else lines.push(`Harina base: ${calc.kg || 0} kg (${nf(rend.n)} pizzas de ${nf(calc.peso)} g)`);
  lines.push(`Masa total: ${fmtG(total)}`, '', 'Ingredientes:');
  items.forEach((i) => lines.push(`- ${i.nombre}: ${i.valor > 0 ? fmtG(i.valor, i.unidad) : '0'}`));
  return lines.join('\n');
}

function baseModal() {
  const rows = RECETA.map(
    (r) => `<div class="flex justify-between py-2 border-b border-carbon-200"><span>${esc(r.nombre)}</span><b class="tabular-nums">${nf(r.base)} ${r.unidad || 'g'} <span class="text-carbon-500 font-medium">(${nf((r.base / HARINA_BASE) * 100, 1)}%)</span></b></div>`,
  ).join('');
  openModal({
    title: 'Fórmula base',
    body: `<p class="text-carbon-500 text-[15px] mb-2">Proporciones por cada ${nf(HARINA_BASE)} g de harina.</p>${rows}
      <div class="flex justify-between pt-3 font-extrabold"><span>Masa total</span><span class="tabular-nums">${nf(TOTAL_BASE)} g</span></div>`,
  });
}

export async function calcClick(act, d, rerender) {
  switch (act) {
    case 'calc-mode':
      calc.mode = d.mode;
      return rerender();
    case 'calc-size': {
      const t = CONFIG.TAMANOS.find((x) => x.id === d.size);
      calc.size = t.id;
      calc.peso = t.peso;
      return rerender();
    }
    case 'calc-qty-inc':
    case 'calc-qty-dec':
    case 'calc-qty-add': {
      const delta = act === 'calc-qty-inc' ? 1 : act === 'calc-qty-dec' ? -1 : Number(d.n);
      calc.qty = Math.max(0, Math.min(99999, calc.qty + delta));
      const el = document.getElementById('calc-qty');
      if (el) el.value = calc.qty || '';
      return updateCalcOut();
    }
    case 'calc-kg-add':
      calc.kg = String(Math.round((num(calc.kg) + Number(d.n)) * 100) / 100);
      document.getElementById('calc-kg').value = calc.kg;
      return updateCalcOut();
    case 'calc-clear': {
      calc.qty = 0;
      calc.kg = '';
      const el = document.getElementById(calc.mode === 'pizzas' ? 'calc-qty' : 'calc-kg');
      if (el) el.value = '';
      return updateCalcOut();
    }
    case 'calc-copy': {
      const ok = await copyText(recipeText());
      toast(ok ? 'Receta copiada.' : 'No se pudo copiar.', ok ? 'ok' : 'err');
      return;
    }
    case 'calc-base':
      return baseModal();
    default:
  }
}

export function calcInput(t) {
  if (t.id === 'calc-qty') {
    t.value = t.value.replace(/\D/g, '').slice(0, 5);
    calc.qty = Number(t.value) || 0;
  } else if (t.id === 'calc-peso') {
    t.value = t.value.replace(/\D/g, '').slice(0, 5);
    calc.peso = Number(t.value) || 0;
    const match = CONFIG.TAMANOS.find((x) => x.peso === calc.peso && x.id === calc.size);
    if (!match) {
      calc.size = null;
      document.querySelectorAll('[data-act="calc-size"]').forEach((b) => {
        b.classList.remove('is-on');
        b.setAttribute('aria-pressed', 'false');
      });
    }
  } else if (t.id === 'calc-kg') {
    t.value = t.value.replace(/[^\d.,]/g, '').replace(/([.,].*?)[.,]/g, '$1').slice(0, 7);
    calc.kg = t.value;
  }
  updateCalcOut();
}
