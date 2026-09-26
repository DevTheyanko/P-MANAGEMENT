// =====================================================================
//  CONFIGURACIÓN — este es el ÚNICO archivo que necesitas editar.
//  Los usuarios de la app no pueden ver ni cambiar estos valores
//  desde la interfaz.
//  Guía completa en GUIA.md (paso 2 y 3).
// =====================================================================

export const CONFIG = {
  APP_NAME: 'Masas Pizzería',

  // Súbelo (1.0.0 → 1.0.1) cada vez que publiques cambios: renueva la
  // caché offline del Service Worker y evita versiones viejas guardadas.
  APP_VERSION: '1.2.0',
  // ── Google Sheets ────────────────────────────────────────────────
  // El ID está en la URL del Sheet:
  // https://docs.google.com/spreadsheets/d/  ESTE_ES_EL_ID  /edit
  SPREADSHEET_ID: '1wRLsrW2Bi3GqgizUzD2QHh90doExn6jEmBFv5uy5POc',

  // Cuenta de servicio de Google Cloud (archivo JSON que descargas al
  // crear la clave). Copia SOLO estos dos campos tal cual vienen en el JSON.
  // IMPORTANTE: comparte el Google Sheet (como Editor) con client_email.
  SERVICE_ACCOUNT: {
    client_email: 'masas-app@masas-pizzeria.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDDUK0sYd+s4GTW\n9o6RdQo7MDw5JVA5THpN/Hh7Aj/A7eZQ+4OW4aWaviARPF5jzMcb5NcmCw4WcaCR\n/nIFXWc74cnXFCkvDncqhQuxS8PUmXhte1e8t6N8EItoZxw+W8TVnHVjCmLJuij4\naom5Q2VmQR2CCFfMGvWm+mDltNTfnFAoT/ynthd4O/+XYBZgRMzkgEIfARqpD5so\nNYdhlmGsW3oHIaM0jeW3OXQxEO3Ut6p1l1oUZNTI9PEhkuyEekoRAcYj/OJrFrTn\nZFr3VbfkdNae90cFW1dzeQM/CH7DBxTVjMxsvHmSWKlnhW3180nXLULkkO3FcZJX\ni7BaIVpFAgMBAAECggEAAxyicwi+K77JgdlHd+Qm/RQYKYrsJnWO+fYcpKJqX0m1\nt92XVkyTEGOYwYg2MsiHoEH69uVfMewD3xTwPnX4rUNm2AaUtLtkxP3TVrL6fu/R\nCOGEX4KHgsmwBuz5o2QKlKKxBhpwwikKpRFBeierkmpVgjBdgb1+OM0CxTYmhseA\nz4a47fI7I6ivOj0svFle8823zglDtzG90FB7LyX+Pnj0UZ4iRyhAvZDplEjj0QVA\nmdP0gHBshXTJovJJqH+f3XlHHuh7chAVMjCqirO7S5Mm1q6RWxIGyGDTfqg3+OSv\nh1wdopFMTKW1XmkkLGbeIAsECXZInScg2hPlh6q7UQKBgQDv2TySBCdu+gthJDIk\nwidNKRtJSszB7P5MA3IET+THKLfmhjuYCHD26YzCzPuhu6Zf1Z+utW3IFu8qh5Bs\nWE0Y175KfndNLBr1yGtPok49TOy+n7MSG4TVvGI7H4BZ+sHcoATCS+zF7Od8eBko\nEIZzY5G7z38DwQ87PV7ZYuGkCQKBgQDQd7mx0eVtjl+jVM1aN+S1bDP+KQ7GDOct\ntHGVjDxwG6M3/vghVG+pljpyvfysbnO9LppNAX29flaT9QciHrRbKjD9gEV3M5Nx\nvklSbGBFw5gCoFOFS7sqS0S93vVgdEKqFIU4qnNi6p6RtmCQ3gTg2jfYhovzOgRw\nOQF/6hFrXQKBgQDVU5BuBsfUCw3n/ruiuhUeqfsc+yyXJ2Ue0smsUCsZgHvgy29h\nz9A5rIyIDq2YskBOaMC4MaJNHyjl2OF5nCgmem1D8KvHtfzcsr/PenrARxUijwRE\njLlfKUjtcR1F6qRWyPSyo7kaaZWSvXcSjXAoXV0XgHxmKGaVuAYOr8YlkQKBgFM5\nuRTYqzOVx3C5hlIiRlh3njo1wgQnWpPQmhgOKILJRdwxGnaT8xBNPYBZgOqGHgbE\n+C0OD1j7ey0OgY6Jm49ZxL0v3Iu+N3sNcNBLHBQ+Bg3mW/G3Tj2QVx1GScf8IjEs\niBMbWX2AFVYu7VZojKIH/IuhC3ZLD0KOP58Fn3axAoGAb8Zj90oTqtC8PPhvsmgO\ngcViAZhC3QuNIJXeC/0WRZ4baHACxWKTiioairi1R7WvUXaksNbYBLHF91EakRWm\ntupcMSlQRDZvC7mhtyyQrJOdKiqNzFuw2c667Xxlv7yMATfJplirR5kaWLpC8PH8\nA/f/rm9biaz72TFOUsBG9ZE=\n-----END PRIVATE KEY-----\n',
  },
  // Nombres exactos de las pestañas del Sheet.
  SHEETS: {
    MOVIMIENTOS: 'MOVIMIENTOS',
    PRODUCTOS: 'PRODUCTOS',
    METAS: 'METAS',
  },

  // ── Personas ─────────────────────────────────────────────────────
  // Solo estos nombres pueden entrar (ya no se puede escribir uno libre).
  // Cada persona necesita SU PIN para entrar — lo define abajo, en PINES_LOGIN_SHA256.
  USUARIOS: ['Gaston', 'Jean', 'Deibis', 'Alfredo', 'Midgalia', 'Laura'],

  // PIN para ENTRAR a la app con cada nombre (obligatorio), guardado como
  // huella SHA-256 (no en texto plano). Sin el PIN correcto no se puede
  // usar ese nombre. Los valores de abajo corresponden TODOS al PIN de
  // ejemplo 2580 — para darle a alguien su propio PIN, genera su hash
  // como en GUIA.md (paso 4) y reemplaza solo su línea.
  PINES_LOGIN_SHA256: {
    Gaston: 'ed946f65d2c785d90e827c5ffd879ce3b49c68d4c88013074176a7e73bc58bcf',
    Jean: 'ed946f65d2c785d90e827c5ffd879ce3b49c68d4c88013074176a7e73bc58bcf',
    Deibis: 'ed946f65d2c785d90e827c5ffd879ce3b49c68d4c88013074176a7e73bc58bcf',
    Alfredo: 'ed946f65d2c785d90e827c5ffd879ce3b49c68d4c88013074176a7e73bc58bcf',
    Midgalia: 'ed946f65d2c785d90e827c5ffd879ce3b49c68d4c88013074176a7e73bc58bcf',
    Laura: 'ed946f65d2c785d90e827c5ffd879ce3b49c68d4c88013074176a7e73bc58bcf',
  },

  // PIN para entrar en MODO ADMINISTRADOR una vez ya adentro de la app
  // (gestionar productos, metas y ajustes). Puede ser igual o distinto
  // al PIN de entrada de cada persona — es un segundo candado aparte.
  PINES_ADMIN_SHA256: {
    Gaston: 'ed946f65d2c785d90e827c5ffd879ce3b49c68d4c88013074176a7e73bc58bcf',
    Jean: 'ed946f65d2c785d90e827c5ffd879ce3b49c68d4c88013074176a7e73bc58bcf',
    Deibis: 'ed946f65d2c785d90e827c5ffd879ce3b49c68d4c88013074176a7e73bc58bcf',
    Alfredo: 'ed946f65d2c785d90e827c5ffd879ce3b49c68d4c88013074176a7e73bc58bcf',
    Midgalia: 'ed946f65d2c785d90e827c5ffd879ce3b49c68d4c88013074176a7e73bc58bcf',
    Laura: 'ed946f65d2c785d90e827c5ffd879ce3b49c68d4c88013074176a7e73bc58bcf',
  },
  // PIN para cualquiera que no esté en la lista de arriba. Ejemplo: 2580
  PIN_ADMIN_DEFECTO_SHA256: 'ed946f65d2c785d90e827c5ffd879ce3b49c68d4c88013074176a7e73bc58bcf',

  // ── Catálogo ─────────────────────────────────────────────────────
  BASE_NAME: 'Masa Base',

  // Tamaños disponibles. `dia` es solo el diámetro visual del disco en pantalla.
  TAMANOS: [
    { id: 'Megas', dia: 56 },
    { id: '40cm', dia: 50 },
    { id: '33cm', dia: 44 },
    { id: '25cm', dia: 38 },
    { id: '100g', dia: 24 },
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
