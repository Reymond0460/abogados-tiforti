# NEXO Abogados · Propuesta web de TiforTi (versión azul)

Demostración frontend estática en HTML, CSS y JavaScript nativo, sin dependencias ni paso de compilación. Nombre, fotografías, especialidades y perfiles son **ilustrativos**. No hay backend, cuentas, pagos ni recopilación de datos: el formulario solo valida, borra los campos y muestra una confirmación de prueba.

## Ejecutar
Desde esta carpeta:

    python3 -m http.server 8000

y abrir http://localhost:8000. (También funciona abriendo `index.html` directamente.)

## Estructura
- `index.html`, `style.css` (diseño original), `extras.css` (selector de idioma, panel de accesibilidad, datos de contacto), `app.js`, `i18n.js` (textos ES/EN)
- `assets/`: `jost.ttf` (+ `OFL-Jost.txt`), `nexo-simbolo.svg`, `favicon.svg`, `office-nexo.jpg`, `partner-1..3.jpg`
- `assets/manrope.*`, `sans.woff2`, `serif.woff2`, `office.jpg`: restos de versiones anteriores, sin uso visual en la versión azul (se conservan por ser parte del ZIP original).

## Novedades de esta versión
- **Español / inglés**: selector ES | EN en la cabecera. Todos los textos, ventanas, formulario y mensajes están en `i18n.js`; para cambiar un texto se edita ahí.
- **Panel de accesibilidad** (botón inferior izquierdo): tamaño de texto (100–140 %), alto contraste, escala de grises, resaltar enlaces, fuente legible, espaciado de texto, detener animaciones y restablecer. Nota: no se pudo consultar el panel de tiforti.cl (su página no lo expone), por lo que las opciones son un conjunto estándar.
- **Contenido ficticio** para los campos pendientes: nombres, formación y experiencia de los socios, dirección, teléfono, correo, horario y condición de la primera consulta. Todo está rotulado como ficticio.
- Idioma y preferencias de accesibilidad se guardan solo en `localStorage` del navegador (nada del formulario). La política de privacidad y la de cookies lo indican.

## Panel interno (prototipo)
Abrir `admin/index.html` (por ejemplo http://localhost:8000/admin/). Inicio de sesión simulado: elegir un socio y escribir cualquier código de 6 dígitos. Datos ficticios en memoria; no usa red, Firebase ni correo. Incluye bandeja de consultas con plazo de 24 h, tomar con bloqueo, reasignar con motivo, notas e historial, carga del equipo, avisos simulados, maqueta de edición de contenido (Etapa 2) y ajustes.

## Documentación
- `docs/DOCUMENTACION.md`: bitácora de solicitudes, decisiones provisionales, tecnologías, qué se desarrolló, pendientes.
- `docs/ESTIMACION.md`: horas y días por módulo, para convertir luego en valor de desarrollo.

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
(Hoy todo es ficticio y debe reemplazarse.) Nombre y disponibilidad de marca/dominio, especialidades, nombres/formación/idiomas de los socios, fotografías definitivas, costo de primera consulta, respuestas de preguntas frecuentes, aviso de privacidad y datos de contacto.
