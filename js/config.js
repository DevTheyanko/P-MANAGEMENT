// =====================================================================
//  CONFIGURACIÓN — este es el ÚNICO archivo que necesitas editar.
//  Los usuarios de la app no pueden ver ni cambiar estos valores
//  desde la interfaz.
//  Guía completa en GUIA.md (paso 2 y 3).
// =====================================================================

export const CONFIG = {
  APP_NAME: 'P Management',

  // Súbelo (1.0.0 → 1.0.1) cada vez que publiques cambios: renueva la
  // caché offline del Service Worker y evita versiones viejas guardadas.
  APP_VERSION: '1.6.0',

  // Color principal de la app (botones, cabecera, selección). Cambia solo
  // este valor y toda la app se repinta con ese color, en ambos temas.
  BRAND_COLOR: '#FF0000',

  // ── Google Sheets ────────────────────────────────────────────────
  // El ID está en la URL del Sheet:
  // https://docs.google.com/spreadsheets/d/  ESTE_ES_EL_ID  /edit
  SPREADSHEET_ID: 'PEGA_AQUI_EL_ID_DE_TU_GOOGLE_SHEET',

  // Cuenta de servicio de Google Cloud (archivo JSON que descargas al
  // crear la clave). Copia SOLO estos dos campos tal cual vienen en el JSON.
  // IMPORTANTE: comparte el Google Sheet (como Editor) con client_email.
  SERVICE_ACCOUNT: {
    client_email: 'PEGA_AQUI@tu-proyecto.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\nPEGA_AQUI_TODA_LA_CLAVE\n-----END PRIVATE KEY-----\n',
  },

  // Nombres exactos de las pestañas del Sheet.
  SHEETS: {
    MOVIMIENTOS: 'MOVIMIENTOS',
    PRODUCTOS: 'PRODUCTOS',
    METAS: 'METAS',
  },

  // ── Personas ─────────────────────────────────────────────────────
  // Solo estos nombres pueden entrar (ya no se puede escribir uno libre).
  // Cada persona necesita SU PIN para entrar — lo define abajo, en PINES_LOGIN.

  USUARIOS: ['Gaston', 'Jean', 'Deibis', 'Alfredo', 'Midgalia', 'Laura'],

  // Sal única de esta instalación para proteger los PIN (ver GUIA.md, paso 4).
  // Cambiarla invalida TODOS los hashes de abajo (habría que regenerarlos).
  // Genera la tuya propia al publicar — no dejes esta de fábrica.
  PIN_SALT: '6492dbda5fcc825e9d9bfa684099d5a7',

  // PIN para ENTRAR a la app con cada nombre (obligatorio). Se guarda como
  // huella PBKDF2 (150.000 vueltas + la sal de arriba) — mucho más resistente
  // a fuerza bruta que un hash simple si alguien copia el código fuente.
  // Sin el PIN correcto no se puede usar ese nombre. Los valores de abajo
  // corresponden TODOS al PIN de ejemplo 2580 — para darle a alguien su
  // propio PIN, genera su hash como en GUIA.md (paso 4) y reemplaza su línea.
  PINES_LOGIN: {
    Gaston: '72a3158c919d5e45e5378360f7cf76e4d2856930c206e1e485a2d237551a7330',
    Jean: '72a3158c919d5e45e5378360f7cf76e4d2856930c206e1e485a2d237551a7330',
    Deibis: '72a3158c919d5e45e5378360f7cf76e4d2856930c206e1e485a2d237551a7330',
    Alfredo: '72a3158c919d5e45e5378360f7cf76e4d2856930c206e1e485a2d237551a7330',
    Midgalia: '72a3158c919d5e45e5378360f7cf76e4d2856930c206e1e485a2d237551a7330',
    Laura: '72a3158c919d5e45e5378360f7cf76e4d2856930c206e1e485a2d237551a7330',
  },

  // PIN para entrar en MODO ADMINISTRADOR una vez ya adentro de la app
  // (gestionar productos, metas, pedidos y correcciones). Puede ser igual o distinto
  // al PIN de entrada de cada persona — es un segundo candado aparte.
  PINES_ADMIN: {
    Gaston: '72a3158c919d5e45e5378360f7cf76e4d2856930c206e1e485a2d237551a7330',
    Jean: '72a3158c919d5e45e5378360f7cf76e4d2856930c206e1e485a2d237551a7330',
    Deibis: '72a3158c919d5e45e5378360f7cf76e4d2856930c206e1e485a2d237551a7330',
    Alfredo: '72a3158c919d5e45e5378360f7cf76e4d2856930c206e1e485a2d237551a7330',
    Midgalia: '72a3158c919d5e45e5378360f7cf76e4d2856930c206e1e485a2d237551a7330',
    Laura: '72a3158c919d5e45e5378360f7cf76e4d2856930c206e1e485a2d237551a7330',
  },
  // PIN para cualquiera que no esté en la lista de arriba. Ejemplo: 2580
  PIN_ADMIN_DEFECTO: '72a3158c919d5e45e5378360f7cf76e4d2856930c206e1e485a2d237551a7330',

  // ── Catálogo ─────────────────────────────────────────────────────
  BASE_NAME: 'Masa Base',

  // Tamaños disponibles. `dia` es solo el diámetro visual del disco en pantalla.
  // `peso` (gramos de masa por bollo) lo usa la pestaña Calcular.
  TAMANOS: [
    { id: 'Megas', dia: 56, forma: 'rectangulo', peso: 1000 },
    { id: '40cm', dia: 50, peso: 520 },
    { id: '33cm', dia: 44, peso: 270 },
    { id: '25cm', dia: 38, peso: 160 },
    { id: '100g', dia: 24, peso: 100 },
  ],

  // Receta base de la pestaña Calcular: gramos (o ml de agua) por cada
  // 1.000 g de harina. Cambia aquí las proporciones y se recalcula todo.
  RECETA: [
    { id: 'harina', nombre: 'Harina', base: 1000 },
    { id: 'agua', nombre: 'Agua', base: 500, unidad: 'ml' },
    { id: 'mantequilla', nombre: 'Mantequilla', base: 40 },
    { id: 'azucar', nombre: 'Azúcar', base: 40 },
    { id: 'sal', nombre: 'Sal', base: 20 },
    { id: 'levadura', nombre: 'Levadura seca', base: 6 },
  ],

  // Productos que existen desde el primer día (el admin puede agregar más
  // desde la app). Si la pestaña PRODUCTOS del Sheet ya tiene filas, se usan esas.
  PRODUCTOS_INICIALES: [
    { id: 'P-SALSA', nombre: 'Con Salsa', tamanos: ['33cm', '25cm'] },
    { id: 'P-PRIMAVERA', nombre: 'Primavera', tamanos: ['33cm', '25cm'] },
    { id: 'P-MARGARITA', nombre: 'Margarita', tamanos: ['33cm', '25cm'] },
  ],
};

// ¿Ya pegaste tus credenciales? Si no, la app funciona en "modo local"
// (guarda en el dispositivo, pero no sube al Sheet).
export const isConfigured = () =>
  !!CONFIG.SPREADSHEET_ID &&
  !CONFIG.SPREADSHEET_ID.startsWith('PEGA_AQUI') &&
  CONFIG.SERVICE_ACCOUNT.client_email.includes('@') &&
  !CONFIG.SERVICE_ACCOUNT.client_email.startsWith('PEGA_AQUI') &&
  !CONFIG.SERVICE_ACCOUNT.private_key.includes('PEGA_AQUI');
