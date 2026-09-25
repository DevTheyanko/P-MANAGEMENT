/** Tailwind se compila UNA vez y el resultado (css/app.css) ya viene en el proyecto.
 *  Solo necesitas esto si quieres cambiar colores/estilos. Ver dev/README.md */
const rv = (name) => `rgb(var(${name}) / <alpha-value>)`;

module.exports = {
  content: ['../index.html', '../js/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Grises de la app (fondo, texto, bordes). Cambian solos entre tema claro/oscuro.
        carbon: { 50: rv('--carbon-50'), 100: rv('--carbon-100'), 200: rv('--carbon-200'), 300: rv('--carbon-300'), 500: rv('--carbon-500'), 700: rv('--carbon-700'), 900: rv('--carbon-900') },
        // Superficie de tarjetas/paneles (blanco en claro, gris oscuro en oscuro).
        card: rv('--card'),
        // Rojo de marca. 600-900 son fijos (botones, cabecera); text/tint se adaptan al tema.
        brand: { 50: '#FFF1F0', 100: '#FFDAD6', 600: '#FF0000', 700: '#E00000', 800: '#C10000', 900: '#970000', text: rv('--brand-text'), tint: rv('--brand-tint') },
        // Aviso / negativo / pendiente (salsa de tomate).
        tomate: { 100: '#FBE3DD', 500: '#DB3E24', 600: '#C9301A', 700: '#A82614', text: rv('--tomate-text'), tint: rv('--tomate-tint') },
        // Éxito / al día (verde albahaca).
        success: { 600: '#2A7048', text: rv('--success-text'), tint: rv('--success-tint') },
        // Queso (foco de accesibilidad) y masa (discos de tamaño): decorativos, fijos.
        queso: { 500: '#EFB22B' },
        masa: { 100: '#F8EFD8', 200: '#F1DFB8', 300: '#E7CB94', 400: '#D9B072' },
      },
    },
  },
  plugins: [],
};
