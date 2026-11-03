# NEXO Abogados · Propuesta web de TiforTi (versión azul)

Demostración frontend estática en HTML, CSS y JavaScript nativo, sin dependencias ni paso de compilación. Nombre, fotografías, especialidades y perfiles son **ilustrativos**. No hay backend, cuentas, pagos ni recopilación de datos: el formulario solo valida, borra los campos y muestra una confirmación de prueba.

## Ejecutar
Desde esta carpeta:

    python3 -m http.server 8000

y abrir http://localhost:8000. (También funciona abriendo `index.html` directamente.)

## Estructura
- `index.html`, `style.css`, `app.js`
- `assets/`: `jost.ttf` (+ `OFL-Jost.txt`), `nexo-simbolo.svg`, `favicon.svg`, `office-nexo.jpg`, `partner-1..3.jpg`
- `assets/manrope.*`, `sans.woff2`, `serif.woff2`, `office.jpg`: restos de versiones anteriores, sin uso visual en la versión azul (se conservan por ser parte del ZIP original).

## Firebase Hosting (cuando se acuerde)
Sitio estático: esta carpeta puede usarse como `public`. No se incluyó `firebase.json` ni `projectId`. NIC Chile (dominio), Cloudflare (DNS) y Zoho Mail (correo) no se modifican.

## Identidad
Tipografía Jost (pesos 400–700); azul #0E3B83, celeste #0077B4, gris #F8F9FB, texto #6F7271, bordes #E3E6EC, tomados de la referencia pública https://www.grupodefensa.cl/ solo como guía de color y tipografía. No se usan su logo, textos, fotografías ni cifras.

## Verificación (Chromium/Playwright)
- Anchos 360, 390, 640, 768, 1024 y 1440 px: sin desplazamiento horizontal, un solo h1, fuente Jost cargada, imágenes cargadas (las de equipo con carga diferida).
- Menú móvil: abre, cierra con Escape y al elegir sección; `aria-expanded` se actualiza.
- 6 ventanas de detalle (propuesta, privacidad, 3 áreas, 3 perfiles): abren, cierran con Escape, devuelven el foco y bloquean el fondo.
- Acordeones: los 4 abren.
- Formulario: bloquea envío vacío; al completarlo borra campos, muestra `role=status` con foco y no genera solicitudes de red ni uso de localStorage/sessionStorage.
- Sin errores de JavaScript ni de consola; sin recursos externos.
- Pendiente: prueba con lector de pantalla y en dispositivos reales.

## Pendiente de aprobación por el estudio
Nombre y disponibilidad de marca/dominio, especialidades, nombres/formación/idiomas de los socios, fotografías definitivas, costo de primera consulta, respuestas de preguntas frecuentes, aviso de privacidad y datos de contacto.
