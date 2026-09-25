// Vistas: funciones que devuelven HTML (todo dato del usuario pasa por esc()).

import { CONFIG, isConfigured } from './config.js';
import * as store from './store.js';
import { icon } from './icons.js';
import { esc, fmtNum, fmtTime, timeAgo, dayKey, parseStamp, stamp, getTheme } from './util.js';
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
const LOGO_PATHS = '<path fill="#FF0000" d="M-43.04,996.64c0-330.484,0-660.968,0-991.68c362.88,0,725.76,0,1088.64,0 c-0.03,3.357-0.086,6.714-0.086,10.071c-0.004,323.81-0.004,647.62-0.006,971.429c0,2.4,0,4.8-0.063,7.199 c-0.024,0.921-0.224,1.838-0.349,2.793c-2.699,0.83-5.265,0.492-7.788,0.493c-307.011,0.016-614.023,0.015-921.034,0.015 c-51.035,0-102.07,0.004-153.106-0.013C-38.9,996.945-40.97,996.746-43.04,996.64z M582.153,249.72 c2.478-1.491,4.823-2.855,7.123-4.293c37.828-23.64,75.663-47.268,113.466-70.948c15.175-9.506,30.283-19.12,45.396-28.725 c1.573-1,3.403-1.754,4.401-3.378c-1.367-3.632-1.341-3.681-4.157-5.804c-5.747-4.333-11.512-8.641-17.303-12.915 c-16.547-12.211-34.344-22.202-53.401-29.932c-24.99-10.136-50.912-15.763-77.936-16.025c-15.195-0.147-30.39-0.399-45.585-0.44 c-36.312-0.099-72.625-0.181-108.938-0.119c-28.473,0.048-56.945,0.369-85.418,0.473c-12.251,0.045-24.205,1.863-35.867,5.535 c-38.911,12.252-71.467,45.842-82.867,85.407c-4.15,14.403-5.776,29.13-5.776,44.08c0.001,30.395-0.041,60.79-0.052,91.185 c-0.025,68.309-0.043,136.618-0.055,204.927c0,2.078-0.059,4.172,0.161,6.232c1.327,12.458,15.539,16.006,22.726,9.852 c1.457-1.248,2.936-2.477,4.31-3.813c3.67-3.569,7.286-7.193,10.927-10.791c36.166-35.742,78.957-58.184,129.71-64.701 c2.997-0.385,6.007-1.031,8.878-1.963c4.954-1.607,8.13-5.069,8.926-10.293c0.504-3.307,0.807-6.677,0.819-10.021 c0.065-18.237,0.004-36.474,0-54.711c-0.009-41.113-0.012-82.227-0.002-123.34c0-1.579,0.152-3.159,0.224-4.573 c1.965-1.478,3.947-1.118,5.823-1.119c36.314-0.021,72.629-0.103,108.942,0.033c12.879,0.048,25.44,2.276,37.454,7.139 C576.593,247.697,579.154,248.595,582.153,249.72z M781.664,543.68c-1.595-1.622-3.643-2.188-5.487-3.046 c-47.515-22.1-95.043-44.17-142.571-66.24c-10.578-4.912-21.225-9.682-31.711-14.782c-2.93-1.425-5.424-1.457-8.13,0.008 c-2.107,1.141-4.24,2.239-6.296,3.465c-9.273,5.529-19.137,9.563-29.714,11.779c-8.797,1.843-17.698,2.526-26.686,2.505 c-31.353-0.074-62.707-0.138-94.06-0.033c-13.121,0.044-26.169,1.136-39.113,3.527c-19.487,3.6-38.017,9.877-55.371,19.437 c-30.136,16.602-54.511,39.525-73.702,67.996c-17.008,25.232-27.229,53.08-31.467,83.152c-1.677,11.896-2.2,23.872-2.195,35.886 c0.024,64.947-0.011,129.894-0.013,194.841c0,2.077,0.007,4.169,0.235,6.23c1.031,9.322,5.902,13.654,15.32,13.445 c4.147-0.092,8.292-0.523,12.424-0.936c14.404-1.439,28.318-4.974,41.703-10.411c46.52-18.897,79.753-51.665,100.6-97.133 c10.754-23.455,15.661-48.265,16.049-73.994c0.201-13.274,0.208-26.552,0.237-39.828c0.025-11.358-0.062-22.715-0.053-34.073 c0.001-1.882-0.308-3.862,1.02-5.651c2.725-0.939,5.624-0.562,8.47-0.563c46.231-0.027,92.461-0.002,138.692-0.038 c7.035-0.006,14.071-0.226,21.105-0.409c14.107-0.367,28.05-2.261,41.811-5.235c49.096-10.611,92.139-32.919,128.812-67.324 c6.062-5.687,11.871-11.644,17.773-17.5C780.736,547.374,781.661,545.745,781.664,543.68z M848.223,356.406 c-0.108-3.197-0.115-6.401-0.344-9.589c-0.64-8.929-1.06-17.89-2.134-26.769c-1.845-15.251-5.078-30.249-9.295-45.031 c-11.181-39.196-29.392-74.882-53.674-107.532c-1.615-2.172-3.449-4.208-5.358-6.13c-4.709-4.742-10.602-6.513-17.497-3.007 c-2.56,1.302-5.09,2.682-7.529,4.195c-4.482,2.781-8.858,5.733-13.328,8.535c-92.916,58.249-185.839,116.486-278.759,174.729 c-1.625,1.019-3.254,2.036-4.825,3.134c-2.265,1.582-4.025,3.625-5.321,6.077c-3.147,5.959-2.227,11.025,2.878,15.452 c2.559,2.219,5.522,3.766,8.583,5.192c94.984,44.275,189.956,88.572,284.932,132.864c10.858,5.064,21.691,10.185,32.601,15.136 c3.325,1.509,6.81,2.743,10.326,3.732c5.12,1.439,9.558-0.18,12.925-4.159c2.048-2.419,3.79-5.147,5.357-7.912 c2.284-4.029,4.323-8.2,6.406-12.341c12.711-25.265,22.03-51.727,27.858-79.404c2.803-13.314,4.738-26.773,5.642-40.34 C848.263,374.317,849.013,365.369,848.223,356.406z"/> <path fill="#FFFFFF" d="M-43.04,996.64c2.07,0.106,4.14,0.305,6.209,0.305c51.035,0.017,102.07,0.013,153.106,0.013 c307.011,0,614.023,0.001,921.034-0.015c2.523,0,5.089,0.337,7.788-0.493c0.124-0.955,0.324-1.871,0.349-2.793 c0.063-2.398,0.063-4.799,0.063-7.199c0.002-323.81,0.002-647.62,0.006-971.429c0-3.357,0.056-6.714,0.086-10.071 c0.32,0,0.64,0,0.96,0c0,330.804,0,661.608,0,992.526c-363.2,0-726.4,0-1089.6,0C-43.04,997.28-43.04,996.96-43.04,996.64z"/> <path fill="#FFFFFF" d="M582.153,249.72c-2.999-1.126-5.56-2.024-8.073-3.041c-12.014-4.863-24.575-7.091-37.454-7.139 c-36.314-0.136-72.628-0.054-108.942-0.033c-1.876,0.001-3.858-0.359-5.823,1.119c-0.072,1.414-0.224,2.994-0.224,4.573 c-0.009,41.113-0.006,82.227,0.002,123.34c0.004,18.237,0.065,36.474,0,54.711c-0.012,3.343-0.316,6.714-0.819,10.021 c-0.796,5.225-3.972,8.686-8.926,10.293c-2.872,0.932-5.881,1.578-8.878,1.963c-50.753,6.517-93.544,28.959-129.71,64.701 c-3.641,3.598-7.257,7.222-10.927,10.791c-1.374,1.336-2.853,2.565-4.31,3.813c-7.187,6.154-21.399,2.606-22.726-9.852 c-0.219-2.06-0.161-4.154-0.161-6.232c0.013-68.309,0.031-136.618,0.055-204.927c0.011-30.395,0.054-60.79,0.052-91.185 c-0.001-14.95,1.626-29.678,5.776-44.08c11.401-39.565,43.956-73.155,82.867-85.407c11.662-3.672,23.616-5.491,35.867-5.535 c28.473-0.104,56.945-0.425,85.418-0.473c36.313-0.062,72.625,0.02,108.938,0.119c15.195,0.042,30.39,0.293,45.585,0.44 c27.024,0.262,52.945,5.888,77.936,16.025c19.058,7.73,36.855,17.721,53.401,29.932c5.791,4.273,11.556,8.582,17.303,12.915 c2.816,2.123,2.79,2.173,4.157,5.804c-0.998,1.624-2.828,2.378-4.401,3.378c-15.113,9.606-30.221,19.219-45.396,28.725 c-37.802,23.68-75.638,47.308-113.466,70.948C586.976,246.865,584.631,248.229,582.153,249.72z"/> <path fill="#FFFFFF" d="M781.664,543.68c-0.003,2.065-0.928,3.694-2.317,5.072c-5.902,5.856-11.711,11.813-17.773,17.5 c-36.673,34.405-79.716,56.712-128.812,67.324c-13.761,2.974-27.703,4.868-41.811,5.235c-7.034,0.183-14.07,0.403-21.105,0.409 c-46.231,0.036-92.461,0.011-138.692,0.038c-2.846,0.002-5.745-0.375-8.47,0.563c-1.328,1.788-1.019,3.768-1.02,5.651 c-0.009,11.358,0.078,22.715,0.053,34.073c-0.029,13.276-0.037,26.554-0.237,39.828c-0.389,25.729-5.296,50.539-16.049,73.994 c-20.847,45.468-54.081,78.236-100.6,97.133c-13.385,5.437-27.299,8.972-41.703,10.411c-4.132,0.413-8.278,0.844-12.424,0.936 c-9.418,0.21-14.289-4.123-15.32-13.445c-0.228-2.06-0.235-4.152-0.235-6.23c0.002-64.947,0.036-129.894,0.013-194.841 c-0.004-12.014,0.518-23.99,2.195-35.886c4.239-30.072,14.46-57.919,31.467-83.152c19.191-28.471,43.566-51.394,73.702-67.996 c17.354-9.56,35.884-15.838,55.371-19.437c12.943-2.391,25.992-3.483,39.113-3.527c31.353-0.105,62.707-0.041,94.06,0.033 c8.988,0.021,17.889-0.662,26.686-2.505c10.577-2.216,20.441-6.249,29.714-11.779c2.056-1.226,4.19-2.324,6.296-3.465 c2.706-1.465,5.2-1.433,8.13-0.008c10.486,5.1,21.133,9.87,31.711,14.782c47.528,22.07,95.056,44.141,142.571,66.24 C778.021,541.492,780.068,542.058,781.664,543.68z"/> <path fill="#FFFFFF" d="M848.223,356.406c0.791,8.963,0.04,17.912-0.555,26.833c-0.904,13.567-2.839,27.026-5.642,40.34 c-5.828,27.677-15.147,54.139-27.858,79.404c-2.083,4.141-4.122,8.312-6.406,12.341c-1.568,2.766-3.31,5.493-5.357,7.912 c-3.367,3.978-7.805,5.598-12.925,4.159c-3.516-0.988-7.001-2.223-10.326-3.732c-10.91-4.951-21.743-10.072-32.601-15.136 c-94.975-44.292-189.948-88.59-284.932-132.864c-3.06-1.426-6.024-2.973-8.583-5.192c-5.105-4.428-6.025-9.494-2.878-15.452 c1.295-2.453,3.056-4.495,5.321-6.077c1.571-1.098,3.2-2.116,4.825-3.134c92.919-58.243,185.843-116.481,278.759-174.729 c4.47-2.802,8.845-5.754,13.328-8.535c2.439-1.513,4.969-2.894,7.529-4.195c6.895-3.506,12.788-1.735,17.497,3.007 c1.91,1.923,3.743,3.958,5.358,6.13c24.282,32.65,42.492,68.336,53.674,107.532c4.217,14.782,7.45,29.78,9.295,45.031 c1.074,8.88,1.495,17.84,2.134,26.769C848.107,350.005,848.115,353.209,848.223,356.406z M732.87,471.889 c1.033-1.921,1.845-3.276,2.507-4.701c0.942-2.029,1.795-4.101,2.65-6.169c12.54-30.361,19.103-61.955,19.382-94.813 c0.155-18.3-1.935-36.386-5.587-54.308c-6.294-30.889-17.898-59.639-34.647-86.327c-0.679-1.082-1.384-2.16-2.196-3.142 c-1.221-1.477-2.523-1.812-4.26-0.966c-1.72,0.838-3.361,1.85-4.988,2.865c-17.366,10.834-34.723,21.681-52.08,32.529 c-52.478,32.799-104.955,65.599-157.426,98.41c-1.606,1.004-3.391,1.796-4.642,3.426c0.339,0.418,0.551,0.929,0.922,1.102 C572.394,397.141,652.336,434.372,732.87,471.889z M759.546,483.798c8.31,4.413,16.907,8.847,25.709,12.163 c2.065-0.799,2.658-2.379,3.524-3.689c5.502-8.324,9.428-17.414,12.897-26.722c5.768-15.474,9.739-31.427,12.869-47.621 c3.437-17.783,5.364-35.732,6.149-53.805c0.717-16.52-0.748-32.899-3.465-49.203c-4.361-26.175-11.937-51.338-23.119-75.412 c-7.568-16.294-16.643-31.703-27.083-46.313c-1.094-1.53-2.036-3.241-3.715-4.076c-6.682,2.511-21.981,12.562-25.352,16.7 c1.543,2.835,3.09,5.8,4.748,8.702c8.978,15.718,16.729,32.011,23.128,48.95c9.264,24.522,15.252,49.811,17.541,75.923 c1.174,13.392,1.388,26.81,0.53,40.266c-1.175,18.415-4.012,36.531-8.513,54.408c-3.754,14.907-8.643,29.437-14.364,43.697 C760.327,479.517,759.26,481.195,759.546,483.798z"/> <path fill="#FF0000" d="M732.87,471.889c-80.534-37.517-160.476-74.748-240.364-112.094 c-0.371-0.173-0.583-0.685-0.922-1.102c1.25-1.63,3.035-2.422,4.642-3.426c52.471-32.81,104.948-65.61,157.426-98.41 c17.357-10.848,34.714-21.695,52.08-32.529c1.626-1.015,3.268-2.027,4.988-2.865c1.737-0.846,3.038-0.511,4.26,0.966 c0.812,0.982,1.517,2.06,2.196,3.142c16.749,26.688,28.353,55.438,34.647,86.327c3.652,17.922,5.742,36.008,5.587,54.308 c-0.279,32.858-6.842,64.452-19.382,94.813c-0.854,2.069-1.707,4.14-2.65,6.169C734.715,468.613,733.903,469.968,732.87,471.889z M685.503,265.923c-19.223-0.524-34.827,16.066-34.881,34.659c-0.046,15.909,13.118,34.177,34.867,34.401 c20.175,0.208,34.307-17.016,34.389-34.143C719.981,279.483,702.691,265.504,685.503,265.923z M697.528,433.389 c18.089,0.517,35.667-15.354,35.751-35.699c0.074-17.793-13.744-35.186-35.349-35.331c-20.087-0.135-36.133,14.885-36.133,35.045 C661.796,422.044,681.748,433.686,697.528,433.389z M597.381,319.454c-17.918-0.709-35.51,13.456-35.667,35.299 c-0.146,20.405,16.471,35.723,35.067,35.686c19.441-0.038,36.046-15.027,36.222-35.169 C633.195,333.444,615.751,318.938,597.381,319.454z"/> <path fill="#FF0000" d="M759.546,483.798c-0.286-2.603,0.781-4.28,1.483-6.031c5.721-14.26,10.61-28.79,14.364-43.697 c4.501-17.877,7.339-35.993,8.513-54.408c0.858-13.456,0.644-26.874-0.53-40.266c-2.289-26.112-8.277-51.401-17.541-75.923 c-6.399-16.939-14.149-33.232-23.128-48.95c-1.658-2.902-3.205-5.867-4.748-8.702c3.371-4.138,18.669-14.189,25.352-16.7 c1.679,0.835,2.622,2.546,3.715,4.076c10.44,14.611,19.515,30.019,27.083,46.313c11.182,24.074,18.757,49.237,23.119,75.412 c2.716,16.304,4.182,32.682,3.465,49.203c-0.784,18.072-2.712,36.022-6.149,53.805c-3.13,16.194-7.101,32.147-12.869,47.621 c-3.47,9.308-7.395,18.397-12.897,26.722c-0.866,1.31-1.459,2.891-3.524,3.689C776.453,492.645,767.856,488.21,759.546,483.798z"/> <path fill="#FFFFFF" d="M685.503,265.923c17.188-0.42,34.478,13.56,34.375,34.918 c-0.082,17.127-14.214,34.351-34.389,34.143c-21.749-0.225-34.914-18.492-34.867-34.401 C650.677,281.99,666.28,265.4,685.503,265.923z"/> <path fill="#FFFFFF" d="M697.528,433.389c-15.78,0.297-35.733-11.345-35.732-35.985 c0.001-20.16,16.047-35.181,36.133-35.045c21.606,0.146,35.423,17.538,35.349,35.331 C733.195,418.035,715.617,433.906,697.528,433.389z M697.493,366.734c-18.561-0.409-31.042,15.235-31.133,30.915 c-0.089,15.191,11.263,31.289,30.729,31.388c19.098,0.097,31.656-15.165,31.65-31.62 C728.732,382.321,717.087,366.437,697.493,366.734z"/> <path fill="#FFFFFF" d="M597.381,319.454c18.369-0.517,35.813,13.99,35.623,35.816 c-0.176,20.143-16.781,35.131-36.222,35.169c-18.596,0.037-35.213-15.281-35.067-35.686 C561.871,332.91,579.464,318.745,597.381,319.454z M596.903,323.729c-16.81,0.023-30.953,13.946-30.888,30.828 c0.073,18.877,14.44,31.317,31.765,31.351c14.798,0.029,30.672-10.758,30.747-31.778 C628.588,336.976,614.603,323.705,596.903,323.729z"/> <path fill="#FF0000" d="M697.493,366.734c19.594-0.297,31.239,15.587,31.245,30.684c0.007,16.455-12.552,31.717-31.65,31.62 c-19.466-0.099-30.817-16.197-30.729-31.388C666.451,381.969,678.932,366.324,697.493,366.734z"/> <path fill="#FF0000" d="M596.903,323.729c17.7-0.024,31.685,13.247,31.624,30.401 c-0.075,21.019-15.949,31.807-30.747,31.778c-17.325-0.034-31.692-12.474-31.765-31.351 C565.95,337.675,580.093,323.752,596.903,323.729z"/>';

export const logo = (px = 32) =>
  `<span class="inline-block shrink-0 overflow-hidden" style="width:${px}px;height:${px}px;border-radius:${Math.round(px * 0.22)}px"><svg width="${px}" height="${px}" viewBox="0 0 1000 1000" aria-hidden="true">${LOGO_PATHS}</svg></span>`;

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
  const line1 = `${esc(BASE)} ${esc(size)} disponible: <b class="${over ? 'text-tomate-text' : ''}">${fmtNum(avail)}</b>`;
  if (!q) return line1;
  return `${line1}<br>Se restan <b>${fmtNum(q)}</b> de ${esc(BASE)} ${esc(size)} y se suman a ${esc(ui.prod)} ${esc(size)}.${over ? '<br><span class="text-tomate-text font-semibold">Es más de lo que hay registrado.</span>' : ''}`;
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
    ${q < 0 ? '<p class="text-xs font-semibold text-tomate-text mt-0.5">Negativo: revisa registros</p>' : ''}
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
          <p class="font-bold ${done ? 'text-success-text' : 'text-tomate-text'}">${done ? (diff === 0 ? 'Meta cumplida' : `Excedente +${fmtNum(-diff)}`) : `Faltan ${fmtNum(diff)}`}</p>
        </div>
        <div class="h-3 rounded-full bg-carbon-100 mt-2 overflow-hidden" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
          <div class="h-full rounded-full ${done ? 'bg-success-600' : 'bg-tomate-500'}" style="width:${pct}%"></div>
        </div>
      </article>`;
    })
    .join('');

  const pendingNote = store.get().metasDirty ? '<p class="text-sm font-semibold text-tomate-text bg-tomate-tint rounded-xl px-3 py-2">Hay metas sin subir. Pulsa Subir para guardarlas en el Sheet.</p>' : '';

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
  <div class="report-card bg-white text-gray-900 rounded-2xl overflow-hidden border border-gray-200" style="font-family:'Bricolage Grotesque',system-ui,sans-serif">
    <div class="bg-brand-800 text-white px-5 py-4 flex items-center gap-3">
      ${logo(40)}
      <div class="min-w-0">
        <p class="text-sm" style="opacity:.75">${esc(CONFIG.APP_NAME)}</p>
        <p class="text-lg font-extrabold leading-tight">${esc(model.title)}</p>
      </div>
    </div>
    <div class="px-5 py-4 space-y-4">
      ${
        model.empty
          ? '<p class="text-gray-500 py-2">Sin movimientos en este periodo.</p>'
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
          ? `<div class="border-t border-gray-200 pt-3 flex flex-wrap gap-x-6 gap-y-1 text-[15px]">
          ${model.sumProd ? `<p>Total producido <b class="text-lg">${fmtNum(model.sumProd)}</b></p>` : ''}
          ${model.sumProc ? `<p>Total procesado <b class="text-lg">${fmtNum(model.sumProc)}</b></p>` : ''}
        </div>`
          : ''
      }
      ${
        model.stock.length
          ? `<div class="border-t border-gray-200 pt-3">
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
    <div class="px-5 py-2.5 bg-gray-50 text-xs text-gray-500">Generado ${esc(stamp(new Date()).slice(0, 16))}</div>
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
      ${s.prodDirty ? '<p class="text-sm font-semibold text-tomate-text bg-tomate-tint rounded-xl px-3 py-2 mb-3">Cambios en productos sin subir.</p>' : ''}
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
                <button type="button" class="btn btn-ghost btn-sm flex-1 !text-tomate-text" data-act="mov-del" data-id="${esc(m.id)}">${icon('trash', 'w-4 h-4')} ${m.dirty === 'NEW' ? 'Eliminar' : 'Anular'}</button>
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
    <p id="pin-error" class="text-tomate-text font-semibold text-sm hidden" role="alert"></p>
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
          return `<label class="cursor-pointer"><input type="checkbox" name="tamanos" value="${esc(sz)}" class="peer sr-only" ${on ? 'checked' : ''}><span class="chip peer-checked:bg-brand-700 peer-checked:border-brand-700 peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2">${esc(sz)}</span></label>`;
        }).join('')}
      </div>
    </fieldset>
    <p id="form-error" class="text-tomate-text font-semibold text-sm hidden" role="alert"></p>
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
    <p id="form-error" class="text-tomate-text font-semibold text-sm hidden" role="alert"></p>
    <button class="btn btn-primary w-full" type="submit">Guardar meta</button>
  </form>`;

export const ajusteForm = () => `
  <form data-form="ajuste" class="space-y-4">
    <label class="block"><span class="label">¿A qué producto?</span>
      <select name="clave" class="field">${comboOptions('')}</select></label>
    <div class="grid grid-cols-2 gap-2" role="group" aria-label="Sumar o restar">
      <label class="cursor-pointer"><input type="radio" name="signo" value="1" class="peer sr-only" checked><span class="chip w-full peer-checked:bg-brand-700 peer-checked:border-brand-700 peer-checked:text-white">Sumar (+)</span></label>
      <label class="cursor-pointer"><input type="radio" name="signo" value="-1" class="peer sr-only"><span class="chip w-full peer-checked:bg-tomate-600 peer-checked:border-tomate-600 peer-checked:text-white">Restar (−)</span></label>
    </div>
    <label class="block"><span class="label">Cantidad</span>
      <input name="cantidad" type="number" inputmode="numeric" min="1" step="1" class="field" required placeholder="Ej. 12"></label>
    <p id="form-error" class="text-tomate-text font-semibold text-sm hidden" role="alert"></p>
    <button class="btn btn-primary w-full" type="submit">Registrar ajuste</button>
  </form>`;

export const editQtyForm = (m) => `
  <form data-form="edit-qty" class="space-y-4">
    <input type="hidden" name="id" value="${esc(m.id)}">
    <p class="text-carbon-700">${esc(m.usuario)} · ${movDesc(m)}</p>
    <label class="block"><span class="label">Cantidad correcta</span>
      <input name="cantidad" type="number" step="1" ${m.tipo === TIPO.AJUSTE ? '' : 'min="1"'} class="field" required value="${esc(m.cantidad)}"></label>
    <p id="form-error" class="text-tomate-text font-semibold text-sm hidden" role="alert"></p>
    <button class="btn btn-primary w-full" type="submit">Guardar corrección</button>
  </form>`;

export const userMenu = () => {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const theme = getTheme();
  const themeLbl = { system: 'Automático (según el dispositivo)', light: 'Claro', dark: 'Oscuro' }[theme];
  const themeIcon = { system: 'monitor', light: 'sun', dark: 'moon' }[theme];
  return `
  <div class="space-y-3">
    <p class="text-carbon-500">Sesión de <b class="text-carbon-900">${esc(store.get().usuario)}</b></p>
    <button type="button" data-act="switch-user" class="btn btn-ghost w-full">${icon('logout')} Cambiar de usuario</button>
    ${ui.admin ? `<button type="button" data-act="admin-off" class="btn btn-ghost w-full">${icon('lock')} Salir del modo admin</button>` : `<button type="button" data-act="admin-on" class="btn btn-ghost w-full">${icon('unlock')} Modo administrador</button>`}
    <button type="button" data-act="theme-cycle" class="btn btn-ghost w-full">${icon(themeIcon)} Tema: ${themeLbl}</button>
    ${ui.installEvt && !standalone ? `<button type="button" data-act="install" class="btn btn-primary w-full">${icon('download')} Instalar la app</button>` : ''}
    ${ios && !standalone ? '<p class="text-sm text-carbon-500 card">iPhone: toca <b>Compartir</b> y luego <b>Añadir a pantalla de inicio</b> para instalarla.</p>' : ''}
    <p class="text-xs text-carbon-500 pt-1">Versión ${esc(CONFIG.APP_VERSION)}</p>
  </div>`;
};
