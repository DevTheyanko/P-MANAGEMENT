/** Tailwind se compila UNA vez y el resultado (css/app.css) ya viene en el proyecto.
 *  Solo necesitas esto si quieres cambiar colores/estilos. Ver dev/README.md */
module.exports = {
  content: ['../index.html', '../js/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        // verde albahaca / horno
        horno: { 50: '#EEF5F0', 100: '#DCEBE1', 600: '#2A7048', 700: '#1F5A3A', 800: '#1B3A2B', 900: '#12261D' },
        // salsa de tomate
        tomate: { 100: '#FBE3DD', 500: '#DB3E24', 600: '#C9301A', 700: '#A82614' },
        // queso
        queso: { 500: '#EFB22B' },
        // masa
        masa: { 100: '#F8EFD8', 200: '#F1DFB8', 300: '#E7CB94', 400: '#D9B072' },
        // grises con un toque verdoso
        carbon: { 50: '#F3F5F2', 100: '#E8ECE8', 200: '#D8DDD9', 300: '#B9C0BB', 500: '#68706A', 700: '#3B413D', 900: '#181B19' },
      },
    },
  },
  plugins: [],
};
