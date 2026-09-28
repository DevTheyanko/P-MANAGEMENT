// Aplica el tema guardado antes de pintar, para que no haya parpadeo.
// Va en un archivo aparte (no en línea) para poder usar una CSP estricta.
try {
  var t = localStorage.getItem('pz_theme');
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
