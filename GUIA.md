# Masas Pizzería — Guía de instalación y despliegue

App web instalable (PWA) para controlar la producción y el inventario de masas.
Funciona sin internet y guarda todo en un Google Sheet cuando tú pulsas **Subir**.

Tiempo estimado la primera vez: **30–40 minutos**. Solo se hace una vez.

---

## Qué contiene esta carpeta

| Ruta | Para qué sirve |
|---|---|
| `index.html`, `js/`, `css/`, `sw.js`, `manifest.webmanifest` | La app. No hay que compilar nada. |
| `js/config.js` | **El único archivo que editas** (Sheet, credenciales, usuarios, PIN). |
| `plantilla/Plantilla_Masas_Pizzeria.xlsx` | El Sheet con las 3 pestañas y encabezados exactos. |
| `icons/`, `fonts/`, `vendor/` | Iconos, tipografía y librería de imágenes, incluidos para que todo funcione offline. |
| `_headers`, `firebase.json`, `vercel.json` | Reglas de caché para Netlify / Cloudflare Pages / Firebase / Vercel. |
| `dev/` | Opcional: estilos fuente (Tailwind) si algún día quieres cambiar colores. |

---

## Paso 1 — Crear el Google Sheet

1. Entra a <https://drive.google.com> → **Nuevo → Hojas de cálculo de Google → Hoja de cálculo en blanco**. No subas el `.xlsx` directamente: así el documento es nativo de Google desde el inicio y evita el error "el documento no debe ser un archivo de Office".
2. Con esa hoja en blanco abierta: **Archivo → Importar → pestaña Subir** → elige `plantilla/Plantilla_Masas_Pizzeria.xlsx`.
3. Google pregunta cómo importarlo: elige **"Insertar nueva(s) hoja(s)"** (no "Reemplazar hoja de cálculo") → **Importar datos**.
4. Verás las pestañas `MOVIMIENTOS`, `PRODUCTOS`, `METAS` y `LEEME`, junto a una pestaña vacía llamada "Hoja 1". Bórrala (clic derecho en su pestaña → **Eliminar**).
5. Déjalas **vacías** y **no cambies** los nombres de las pestañas ni la fila 1 de encabezados. (`LEEME` es solo ayuda; la app no la usa.)
6. Copia el **ID del Sheet** desde la barra de direcciones:
   `https://docs.google.com/spreadsheets/d/` **`ESTE_ES_EL_ID`** `/edit`

---

## Paso 2 — Conectar con la API de Google Sheets

La app usa una **cuenta de servicio** (un "usuario robot"), así nadie tiene que iniciar sesión con Google.

### 2.1 Crear el proyecto y activar la API
1. Ve a <https://console.cloud.google.com> e inicia sesión con tu cuenta de Google.
2. Arriba, menú de proyectos → **Proyecto nuevo** → nombre: `masas-pizzeria` → **Crear**.
3. Menú ☰ → **APIs y servicios → Biblioteca**. Busca **Google Sheets API** → **Habilitar**.

### 2.2 Crear la cuenta de servicio
1. **APIs y servicios → Credenciales → Crear credenciales → Cuenta de servicio**.
2. Nombre: `masas-app` → **Crear y continuar**. No asignes roles → **Continuar → Listo**.
3. Entra a la cuenta que acabas de crear → pestaña **Claves → Agregar clave → Crear clave nueva → JSON → Crear**.
4. Se descarga un archivo `.json`. **Guárdalo en un lugar seguro**; contiene la clave privada.

### 2.3 Compartir el Sheet con la cuenta de servicio
1. Abre el archivo `.json` con un editor de texto y copia el valor de `client_email`
   (algo como `masas-app@masas-pizzeria.iam.gserviceaccount.com`).
2. En tu Google Sheet pulsa **Compartir**, pega ese correo y dale permiso de **Editor**. Desmarca "Notificar" → **Compartir**.

> Si te saltas este paso, la app mostrará "Sin permiso…" al subir.

---

## Paso 3 — Pegar los datos en `js/config.js`

Abre `js/config.js` con cualquier editor (Bloc de notas, VS Code) y cambia estas líneas:

```js
SPREADSHEET_ID: 'EL_ID_QUE_COPIASTE',

SERVICE_ACCOUNT: {
  client_email: 'masas-app@masas-pizzeria.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n',
},
```

- **`private_key`**: copia el valor del JSON **tal cual**, con los `\n` escritos como texto (barra invertida + n). No los conviertas en saltos de línea reales. Debe quedar en **una sola línea** entre comillas simples.
- **`USUARIOS`**: los nombres que salen al abrir la app (por defecto `Jean` y `Alfredo`). Quien no esté en la lista puede escribir su nombre.
- **`PRODUCTOS_INICIALES`**: se usan solo mientras la pestaña `PRODUCTOS` esté vacía. Después el admin gestiona todo desde la app.

Guarda el archivo.

---

## Paso 4 — Cambiar el PIN de administrador

El PIN de ejemplo es **`1234`**. Cámbialo antes de publicar.

El PIN no se guarda en texto plano, sino como huella SHA-256. Para generar la de tu PIN nuevo, usa una de estas opciones:

**Opción A — en el navegador (cualquier sistema).** Abre cualquier página, pulsa F12 → pestaña **Consola**, pega esto cambiando `4821` por tu PIN y pulsa Enter:

```js
crypto.subtle.digest('SHA-256', new TextEncoder().encode('4821'))
  .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join('')))
```

**Opción B — terminal (Linux/Mac).**

```bash
echo -n "4821" | sha256sum
```

Copia el texto de 64 caracteres y pégalo en `ADMIN_PIN_SHA256` dentro de `js/config.js`.
Tras 5 intentos fallidos la app bloquea el acceso admin durante 30 segundos.

---

## Paso 5 — Probar en tu computadora

La app necesita servirse por `http://localhost` (abrir `index.html` con doble clic **no** funciona, por los módulos y el Service Worker). Desde la carpeta del proyecto:

```bash
python3 -m http.server 8080
```

y abre <http://localhost:8080>. Si no tienes Python: `npx serve .`.

Prueba rápida: entra como Jean → registra una producción → pulsa **Subir** → revisa que aparezca una fila en `MOVIMIENTOS`.

---

## Paso 6 — Publicarla en internet (HTTPS obligatorio para instalar)

Elige **una** opción; las tres son gratuitas para este uso.

### Opción A — Netlify (la más simple)
1. Entra a <https://app.netlify.com/drop>.
2. Arrastra la **carpeta completa** del proyecto. Te da una URL `https://algo.netlify.app`.
3. Para cambios futuros: **Deploys → arrastra de nuevo la carpeta**.

### Opción B — Cloudflare Pages
1. <https://dash.cloudflare.com> → **Workers y Pages → Crear → Pages → Carga directa**.
2. Sube la carpeta. El archivo `_headers` ya viene configurado.

### Opción C — Firebase Hosting
```bash
npm i -g firebase-tools
firebase login
firebase init hosting     # public directory: .   |  single-page app: No
firebase deploy
```
El `firebase.json` incluido ya excluye `dev/` y `GUIA.md`.

### Opción D — Vercel

El `vercel.json` incluido ya trae las cabeceras de caché correctas (`sw.js` sin caché, `js/`/`css/` sin caché, `icons/`/`fonts/`/`vendor/` con caché larga). Dos formas de subirlo:

**CLI (la más directa):**
```bash
npm i -g vercel
cd masas-pizzeria-pwa      # la carpeta del proyecto
vercel                     # primera vez: pregunta cuenta/proyecto, responde con los valores por defecto
vercel --prod              # publica la URL final
```
Cuando pregunte por el *framework preset*, elige **Other** (es HTML/JS puro, sin build). Cuando pregunte por el *output directory*, deja `.` (la raíz).

**Panel web:**
1. Sube la carpeta a un repositorio de GitHub (o usa `vercel` desde la CLI, que no necesita Git).
2. En <https://vercel.com/new>, importa el repositorio.
3. Framework Preset: **Other**. Build Command: (vacío). Output Directory: `.` (raíz).
4. **Deploy**.

Para publicar una actualización después de cambiar `js/config.js` u otro archivo: `vercel --prod` de nuevo (o vuelve a hacer push si usas Git).

Comparte la URL solo con quienes van a usar la app.

---

## Paso 7 — Instalarla en cada dispositivo

Abre la URL una vez **con internet** (así se guarda para uso offline) y luego:

| Dispositivo | Cómo instalar |
|---|---|
| **Android (Chrome)** | Menú ⋮ → **Instalar aplicación** (o el botón "Instalar" del menú de usuario dentro de la app). |
| **iPhone / iPad (Safari)** | Botón **Compartir** ⬆️ → **Añadir a pantalla de inicio**. Debe ser Safari. |
| **Windows / Mac / Linux (Chrome o Edge)** | Icono de instalar en la barra de direcciones → **Instalar**. |

---

## Uso diario

- **Registrar**: elige *Producir* o *Procesar*, el tamaño, la cantidad y pulsa Guardar. Se guarda en el teléfono al instante, con o sin internet.
  - *Producir* suma a la Masa Base.
  - *Procesar* resta de la Masa Base y suma al producto (Con Salsa, Primavera, Margarita…), en el mismo tamaño.
- **Subir**: envía al Sheet lo pendiente. Es manual y seguro pulsarlo varias veces: cada registro tiene un ID único y **nunca se duplica**, ni siquiera si se corta el internet a mitad de la subida.
- **Refrescar**: baja lo más reciente del Sheet (lo que registraron otros dispositivos).
- **Reportes**: día, semana o mes. **Copiar texto para WhatsApp** deja el mensaje listo para pegar; **Descargar imagen PNG** guarda una tarjeta para compartir (en el teléfono también aparece **Compartir imagen…**).
- **Admin** (con PIN): productos y tamaños permitidos, metas por día, ajustes de inventario (merma, conteo físico), y corregir o anular registros. Los cambios de admin también viajan con **Subir**.
- Los registros anulados no se borran del Sheet: quedan marcados `ANULADO` y dejan de contar.

---

## Publicar una actualización sin que se quede la versión vieja

1. En `js/config.js` sube la versión: `APP_VERSION: '1.0.1'`.
2. Vuelve a subir la carpeta al hosting.
3. La próxima vez que se abra la app con internet aparece un aviso para actualizar. Nunca se pierde lo que estaba pendiente de subir.

---

## Seguridad — léelo una vez

- La clave de la cuenta de servicio va dentro de `config.js`, tal como se pidió. Eso significa que **cualquier persona que tenga la URL y sepa abrir las herramientas del navegador podría copiarla**.
- El daño posible está acotado: esa cuenta **solo tiene acceso al Sheet que le compartiste**, nada más de tu cuenta de Google.
- Recomendaciones: crea una cuenta de servicio **solo para esta app**, no compartas con ella ningún otro archivo, no publiques la URL en redes, y confía en **Archivo → Historial de versiones** del Sheet para deshacer cualquier cambio no deseado.
- El PIN de admin es una barrera para evitar errores del personal, **no** seguridad fuerte, por el mismo motivo.
- Si sospechas que la clave se filtró: en Google Cloud, cuenta de servicio → **Claves** → elimina la clave, crea otra y actualiza `config.js`.

---

## Problemas frecuentes

| Mensaje / síntoma | Causa y solución |
|---|---|
| "Sin permiso. Comparte el Google Sheet…" / "Activa Google Sheets API…" | No compartiste el Sheet con `client_email` como **Editor** (Paso 2.3), o la Sheets API no está habilitada (Paso 2.1). |
| "No se encontró el Google Sheet" | `SPREADSHEET_ID` mal copiado. Debe ser solo el ID, sin la URL completa. |
| "Ese archivo sigue siendo un Excel (.xlsx)" / "must not be an Office file" | El `SPREADSHEET_ID` apunta a un archivo Office, o a la vista de compatibilidad de uno (misma URL, no convertido). Solución más segura: crea una hoja de Google en blanco y usa **Archivo → Importar → Insertar nueva(s) hoja(s)** para meterle la plantilla (Paso 1), en vez de "Abrir con / Guardar como". Usa el ID de esa hoja nueva. |
| "Faltan pestañas en el Sheet" | Cambiaste el nombre de una pestaña. Deben llamarse exactamente `MOVIMIENTOS`, `PRODUCTOS` y `METAS`. |
| "La clave privada de config.js no es válida" / "Google rechazó las credenciales" | `private_key` mal pegada (faltan los `\n`, quedó cortada, o tiene saltos de línea reales), la clave fue eliminada, o la hora del dispositivo está muy desfasada. |
| La app dice "Modo local · sin Google Sheets" | `config.js` todavía tiene los textos `PEGA_AQUI…`. |
| No aparece el botón Instalar | Debe estar en HTTPS (no `http://`) y haberse abierto al menos una vez con internet. En iPhone, usa Safari. |
| Sigo viendo la versión anterior | Subiste cambios sin cambiar `APP_VERSION`. Súbela (Paso "Publicar una actualización") y recarga. |
| Inventario negativo | Se procesó más masa base de la registrada. Registra la producción faltante o haz un *Ajuste* desde Admin. |

---

Hecho con HTML, JavaScript y Tailwind. Sin frameworks ni servidores propios.
