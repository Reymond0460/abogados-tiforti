# NEXO Abogados · Documentación del proyecto

Última actualización: 3 de noviembre de 2026.
Estado: **prototipos navegables con datos ficticios**. No hay backend, base de datos ni servicios conectados.

> Todo lo marcado como *provisional* o *ficticio* debe confirmarse con los socios antes de usarse en producción.

---

## 1. Qué es este proyecto

Propuesta comercial de TiforTi para un estudio jurídico chileno de tres socios. Marca provisional: **NEXO Abogados** (sin verificar disponibilidad de marca, registro ni dominio).

Dos entregables:

| Entregable | Ubicación | Estado |
|---|---|---|
| Sitio público (demo) | `index.html`, `style.css`, `extras.css`, `app.js`, `i18n.js`, `assets/` | Listo para mostrar |
| Panel interno de socios (prototipo) | `admin/` | Listo para mostrar |

Cómo ejecutarlos: ver `README.md`.

---

## 2. Bitácora de solicitudes (qué se pidió y cómo se resolvió)

| N.º | Solicitud | Resolución | Estado |
|---|---|---|---|
| 1 | Continuar la versión azul del ZIP `NEXO-Abogados-propuesta-azul.zip`, sin rediseñar; HTML/CSS/JS, listo para Firebase Hosting | ZIP incorporado sin tocar el diseño; ejecutado y verificado | Hecho |
| 2 | Completar con datos ficticios los campos faltantes | Nombres, perfiles, teléfono, correo, dirección, horario y condición de primera consulta ficticios, rotulados como tales | Hecho |
| 3 | Alojar el proyecto solo en git (nada en Firebase aún) | Repositorio local con commits; sin remoto ni Firebase | Hecho (sin subir a remoto) |
| 4 | Páginas para probar en local | Servidor estático local y vista previa privada en claude.ai para el celular | Hecho |
| 5 | Panel de accesibilidad | Botón flotante: tamaño de texto (100–140 %), alto contraste, escala de grises, resaltar enlaces, fuente legible, espaciado de texto, detener animaciones, restablecer | Hecho |
| 6 | Dos idiomas, español e inglés | Selector ES/EN con banderas de Chile y EE. UU. (SVG); todo el sitio traducido | Hecho |
| 7 | Políticas de privacidad y datos; cookies si corresponde | Política de privacidad y de cookies (borrador, ES/EN). El sitio no usa cookies; solo guarda idioma y accesibilidad en el navegador, con botón para borrarlos | Hecho (falta revisión legal) |
| 8 | Verificar que todos los botones y secciones funcionen | Pruebas automáticas en escritorio y móvil, ES y EN; corregidas áreas táctiles y otros detalles | Hecho |
| 9 | Corregir texto rotado en preguntas frecuentes (iPhone) | Estilo heredado del signo «+» corregido | Hecho |
| 10 | Corregir botón «Volver al inicio» | El ancla apuntaba a la cabecera fija; ahora desplaza al tope | Hecho |
| 11 | Banderas de Chile y EE. UU. en el selector de idioma (comentario) | Hecho, compactado para móvil | Hecho |
| 12 | Que las secciones del header abran en una pestaña nueva (comentario) | Se consultó el alcance (3 opciones) y se respondió que, para esta página corta, una sola página es lo mejor; se mejoró la navegación | **Pendiente de respuesta del cliente** |
| 13 | Mejorar la experiencia de navegación y reforzar el resaltado de sección activa (comentarios) | Menú con sección activa basada en línea de lectura; margen bajo la cabecera fija | Hecho |
| 14 | Enlazar todas las referencias a TiforTi a tiforti.cl (comentario) | Tres enlaces en pestaña nueva | Hecho |
| 15 | Campo de teléfono en el formulario (comentario) | Opcional, validado, ES/EN; política actualizada | Hecho |
| 16 | Botón flotante de WhatsApp (comentario) | Hecho con número ficticio; declarado en la política de privacidad | Hecho |
| 17 | Asesoría sobre un panel admin para tres socios | Recomendación por etapas (ver sección 5) | Hecho |
| 18 | Documentar todo, tecnologías y horas/días para convertirlos en costo | Este documento y `docs/ESTIMACION.md` | Hecho |
| 19 | Primer prototipo del panel | `admin/` (ver sección 4) | Hecho |
| 21 | Seguir con la opción A (registro manual de consultas de WhatsApp/teléfono/presencial) | Botón «Registrar consulta» en el panel: formulario con nombre, contacto, canal, área, resumen breve y opción de tomarla de inmediato; queda en historial y avisos como registrada a mano | Hecho (prototipo) |
| 35 | Mejorar cada consulta recibida, específicamente en teléfonos (comentarios del 3 y 5 de noviembre) | Acción rápida en cada consulta sin tomar: plazo visible («Quedan 21 h» en verde o «Vencida hace 6 h» en rojo) y botón «Tomar» de 44 px que toma la consulta sin abrir la ficha, con aviso y «Deshacer» (8 s); también con teclado | Hecho |
| 34 | Rediseñar al 100 % la experiencia del panel en teléfonos (la versión móvil era el escritorio encogido) | Experiencia tipo app: barra inferior (Consultas, Dashboard, Equipo, Contenido, Más), barra superior compacta con título y avatar, lista de consultas en tarjetas de 3 líneas (toda la tarjeta es tocable, con franja de color por estado), filtros rápidos en chips y búsqueda con filtros plegables, botón flotante «Registrar» que se compacta al bajar, ficha y formularios a pantalla completa, menú «Más» (cuenta, avisos, ajustes, datos, herramientas de demostración, salir), área segura de iPhone y objetivos táctiles ≥ 44 px | Hecho |
| 33 | Realizar pruebas de QA para pasar a desarrollo | Suite automática reutilizable en `tests/` (13 grupos, todos pasan), auditoría con axe-core, teclado, 130 combinaciones de tamaño, idiomas, privacidad y rendimiento; 10 defectos corregidos; informe en `docs/QA.md` | Hecho |
| 32 | Por ahora no integrar la aplicación de autenticación (segundo factor) en el login | Ingreso solo con contraseña (mínimo 12 caracteres); se ocultó el código de 6 dígitos y se simplificaron las instrucciones a 2 pasos; interruptor `requireSecondFactor` en `admin/config.js` para reactivarlo; riesgo y medidas compensatorias registrados en `docs/SEGURIDAD.md` (sección 2b) | Hecho; pendiente decidir cuándo activar MFA |
| 31 | Hacer fácil e intuitiva la edición del contenido de la página por los admin | Editor guiado (maqueta de la Etapa 2): 6 secciones del sitio, campos con ayuda y contador en español e inglés lado a lado, vista previa en vivo ES/EN, borrador guardado automáticamente, confirmación con «antes → después» antes de publicar, «Volver a lo publicado» y versiones restaurables | Hecho (prototipo) |
| 30 | Tamaño de ficha que no requiera scroll | Ficha compacta de tamaño fijo con pestañas (Resumen, Notas, Historial, Reasignar); verificado sin desplazamiento en las 22 fichas y 4 pestañas en 5 tamaños de pantalla (1440×900, 1280×720, 390×844, 375×812, 360×740); listas largas muestran lo más reciente | Hecho |
| 29 | Todas las fichas con el mismo tamaño (22 consultas) | Ventana de tamaño fijo (620×600 px en escritorio; ancho completo en móvil) y navegación Anterior/Siguiente fija abajo; el registro manual, el editor y «Copiar para Excel» usan una variante más alta | Hecho |
| 28 | Mejorar la UX de la ficha de consulta | Plazo visible, contacto con «Copiar», estado con botones de un clic, reasignar e historial plegables, notas, reabrir y navegación Anterior/Siguiente | Hecho |
| 27 | Mejorar el login y las instrucciones para ingresar | Pantalla de ingreso con 3 pasos claros, foto del socio elegido, ayudas bajo cada campo, aviso de Bloq Mayús, código solo numérico, errores de formato separados de intentos fallidos, campos marcados como inválidos, «¿Problemas para ingresar?» y recuadro «Para probar este prototipo» | Hecho |
| 26 | Reforzar la seguridad del login para evitar vulneraciones y robo de información de socios y clientes | Demostración de controles en el prototipo (contraseña + segundo factor, límite de intentos con bloqueo, mensajes genéricos, cierre por inactividad, pantalla vaciada al salir, CSP) y plan de seguridad real en `docs/SEGURIDAD.md`. El prototipo no da seguridad real: la aplica el servidor | Hecho (demostración y plan) |
| 25 | Dónde ubicar el acceso al panel de los abogados (comentario) | Enlace discreto «Acceso socios» / «Partner access» en el pie del sitio público; recomendación de producción: subdominio propio `panel.` con Firebase Hosting multisitio, sin enlace destacado | Hecho (prototipo); decidir ubicación final |
| 24 | Botón para volver a la página principal desde el panel | Enlace «Volver al sitio principal» en la pantalla de ingreso y «Ver sitio principal» en la cabecera del panel | Hecho |
| 23 | En producción solo debe estar la opción de exportar a Excel (comentario cortado: «ojo hay…») | Interruptor `showCopyFallback` en `admin/config.js`; «Copiar para Excel» solo en la vista previa. Anotado en la lista de producción | Hecho; pendiente leer el resto del comentario |
| 22 | Botón para exportar clientes a Excel ordenados en filas y columnas; dashboard con gráficos de barras y de pastel del equipo | «Exportar a Excel» (.xlsx real, hoja «Consultas» y hoja «Resumen por socio», respeta los filtros) y «Copiar para Excel» (respaldo); pestaña «Dashboard» con indicadores, 2 gráficos de barras y 3 de pastel | Hecho (prototipo) |
| 20 | Pregunta (comentario): ¿cómo sabe el sistema que una consulta llegó por WhatsApp y se atiende con IA/automatización con reservas? | Respondida: hoy es solo una etiqueta en datos de ejemplo. Opciones y alcance en sección 5b; no desarrollado | Respondido, sin desarrollo |

---

## 3. Decisiones tomadas (todas PROVISIONALES)

Los socios indicaron que **ninguna es oficial todavía**; se documentan para poder cambiarlas.

| Tema | Decisión provisional | Dónde se refleja |
|---|---|---|
| Volumen esperado | ~30 consultas al mes | Dimensionamiento de costos |
| Atención | Los tres socios atienden en simultáneo | «Tomar consulta» con bloqueo |
| Plazo para tomar una consulta nueva | **1 día (24 h)** | Marca «vencida» y recordatorio; configurable en Ajustes |
| Reparto de la carga | Cada socio elige y distribuye (no hay asignación automática por especialidad) | Cualquier socio puede tomar o reasignar, con motivo |
| Avisos por correo | **Casilla compartida** (Zoho, p. ej. `consultas@…`) **y** correo de cada socio | Registro de avisos simulados |
| Conservación de datos | **Por definir** con el abogado que revise la política | Ajustes: «Por definir» |
| Edición de textos por los socios | **Próximamente** (Etapa 2) | Maqueta en la pestaña «Contenido» |
| Segundo factor (app autenticadora) | **Pospuesto**: por ahora solo contraseña | `requireSecondFactor: false` en `admin/config.js` |
| Panel en el mismo sitio | Ruta `/admin`, sin indexar | `admin/` con `noindex` |

Datos ficticios en uso: nombres de los socios, perfiles, teléfono `+56 9 0000 0000` (también en WhatsApp), correos `@nexo-demo.example`, dirección, horario y la condición «primera consulta de 30 minutos sin costo».

---

## 4. Qué se desarrolló

### 4.1 Sitio público (demo)
- Estructura de una sola página con anclas: franja superior, cabecera fija, portada, principios, estudio, especialidades, equipo, proceso, preguntas frecuentes, contacto y pie.
- Español e inglés (`i18n.js`), con idioma recordado en el navegador.
- Panel de accesibilidad (`extras.css` + `app.js`).
- Formulario de demostración: nombre, correo, teléfono (opcional), área, aceptación de privacidad. Valida y muestra confirmación; **no envía ni guarda datos**.
- Ocho ventanas de detalle (`dialog`): propuesta, privacidad, cookies, tres áreas, tres perfiles.
- Botón flotante de WhatsApp, enlaces a tiforti.cl, menú con sección activa, «Volver al inicio».
- Accesibilidad: `lang`, un solo `h1`, enlace para saltar, foco visible, teclado, `prefers-reduced-motion`, áreas táctiles ≥ 24 px, campos ≥ 16 px.

### 4.2 Panel interno (prototipo) — `admin/`
Pantallas:
1. **Inicio de sesión simulado** (elegir socio + contraseña de 12+ caracteres; la contraseña `incorrecta123` simula una equivocada). El segundo factor está desactivado por decisión del cliente.
2. **Consultas**: resumen (sin tomar, vencidas, en curso, cerradas), filtros (texto, estado, área, responsable), tabla que en móvil se vuelve tarjetas.
3. **Detalle de consulta**: datos, **tomar** (con bloqueo si otro socio ya la tomó), cambiar estado, **reasignar con motivo obligatorio**, notas internas, historial.
4. **Carga del equipo**: consultas en curso y cerradas por socio.
5. **Avisos por correo (simulados)**: registro de lo que se enviaría a la casilla compartida y a los socios; recordatorios de consultas vencidas.
6. **Contenido (maqueta de Etapa 2)**: editor guiado por secciones del sitio (Portada, El estudio, Especialidades, Equipo, Preguntas frecuentes, Datos de contacto) con campos en ES/EN, límites de caracteres, vista previa en vivo, autoguardado de borrador, confirmación antes de publicar y versiones restaurables (simulado).
7. **Ajustes**: plazo (24 h por defecto), casilla compartida y retención «por definir».

**Exportar a Excel:** genera un archivo `.xlsx` sin librerías externas, con encabezado fijo, filtros automáticos, anchos de columna, fechas reales y una segunda hoja con el resumen por socio. Exporta lo que muestran los filtros de la bandeja. Los textos se guardan como texto (no como fórmulas) para evitar inyección de fórmulas. «Copiar para Excel» deja la tabla en el portapapeles (separada por tabuladores) para pegarla en la celda A1. Nota: en la vista previa de claude.ai las descargas están bloqueadas por el visor; la descarga funciona al abrir el panel localmente o alojado.

**Dashboard:** indicadores (recibidas, cerradas, tiempo medio hasta tomar, tomadas dentro del plazo, vencidas), carga por socio (barras apiladas), recibidas en los últimos 7 días (barras) y gráficos de pastel por área, estado y canal. Gráficos en SVG propio, con leyenda numérica y texto alternativo. Se recalculan al operar el panel.

**Registro manual (opción A):** el botón «Registrar consulta» permite ingresar consultas que llegan por WhatsApp, teléfono o en persona. Exige nombre y al menos un correo o teléfono, advierte no registrar datos sensibles, permite tomarla de inmediato y deja constancia en el historial y en los avisos.

Herramientas de demostración: «Simular consulta nueva», «Simular que otro socio toma una» (para ver el bloqueo), «Restablecer datos» y selector «Actuando como».

Limitaciones del prototipo (a propósito): datos en memoria que se pierden al recargar; sin red, sin Firebase, sin correos reales, sin autenticación real.

---

## 5. Tecnologías

### En uso hoy
| Capa | Tecnología |
|---|---|
| Frontend | HTML, CSS y JavaScript nativo (sin frameworks ni dependencias) |
| Tipografía | Jost (variable, local, licencia OFL) |
| Iconos y banderas | SVG en línea |
| Gráficos y Excel | SVG propio (`admin/charts.js`) y generador de `.xlsx` propio (`admin/export.js`), sin librerías |
| Pruebas | Playwright con Chromium (escritorio y móvil); verificación del `.xlsx` con openpyxl |
| Control de versiones | git (local) |
| Vista previa | Artifact privado de claude.ai |

### Propuestas para producción (aún no creadas)
| Necesidad | Tecnología |
|---|---|
| Hosting | Firebase Hosting |
| Autenticación | Firebase Authentication con segundo factor y lista cerrada de 3 cuentas |
| Base de datos | Firestore (región Santiago, `southamerica-west1`) con reglas estrictas |
| Recepción del formulario | Cloud Functions (validación, límite de envíos) |
| Anti-spam | Cloudflare Turnstile o Firebase App Check |
| Correo | Zoho Mail (casilla compartida + correo de cada socio); credenciales en Secret Manager, nunca en el navegador |
| Recordatorio de 24 h | Función programada (Cloud Scheduler) |
| Dominio / DNS | NIC Chile (registrador) y Cloudflare (DNS) |

Requisito: las Cloud Functions necesitan el plan **Blaze** de Firebase (pago por uso). Con ~30 consultas al mes el uso esperado es mínimo; verificar precios vigentes y configurar una alerta de presupuesto.

---

## 5b. WhatsApp: estado actual y opciones (no desarrollado)

**Hoy:** el botón flotante solo abre un chat (`wa.me`) con un número ficticio. En el panel, la etiqueta «WhatsApp» de algunas consultas es **solo dato de ejemplo**. El sistema no sabe lo que ocurre dentro de WhatsApp, y **no hay ninguna IA ni automatización**; tampoco se está entrenando nada.

| Opción | Cómo sabría el sistema que llegó por WhatsApp | Alcance |
|---|---|---|
| A. Registro manual | Un socio pulsa «Registrar consulta» en el panel y la ingresa | **Hecho en el prototipo**; no automatiza |
| B. WhatsApp Business Platform (API Cloud de Meta) | Un *webhook* (Cloud Function) recibe cada mensaje y crea la consulta con canal «WhatsApp», avisa y la deja «sin tomar» | Requiere número dedicado y cuenta verificada en Meta; condiciones y costos de Meta |
| C. Agente de IA sobre B | La IA conversa, recopila datos y propone horarios de consulta | Requiere B, un modelo de lenguaje, reglas estrictas (no dar asesoría jurídica, derivar urgencias y datos sensibles a una persona, traspaso a un socio), calendario/agenda real y revisión legal de privacidad y consentimiento |

Recomendación: A como primer paso, B cuando el volumen lo justifique y C solo tras definir con los socios qué puede y qué no puede responder una IA. Las horas orientativas están en `docs/ESTIMACION.md`, sección B3 (opcional, fuera de la cotización base).

---

## 6. Estructura del repositorio

```
index.html, style.css, extras.css, app.js, i18n.js   Sitio público
assets/                                             Fuente Jost, imágenes, SVG
admin/                                              Panel (prototipo)
  index.html, admin.css, admin.js, data.js, export.js, charts.js, content.js, editor.js, config.js
docs/                                               Documentación (DOCUMENTACION, ESTIMACION, SEGURIDAD, QA)
tests/                                              Suite de QA automática (no forma parte del sitio)
README.md                                           Cómo ejecutar
```

Los archivos `assets/manrope.*`, `sans.woff2`, `serif.woff2` y `office.jpg` son restos de versiones anteriores del ZIP, sin uso visual.

---

## 7. Verificación realizada

- Sitio público y panel: Chromium a 1440 px y 390 px; sin errores de JavaScript, sin recursos externos, sin desbordamiento horizontal.
- Sitio: enlaces, menú móvil, ocho ventanas (cierre con X, Escape y clic fuera, retorno del foco), acordeones, formulario (válido, inválido, sin envío), panel de accesibilidad, idiomas.
- Panel: inicio de sesión simulado, tomar con bloqueo, reasignar con motivo, notas, filtros, avisos, editor de contenido, plazo configurable, restablecer.
- **Pendiente:** pruebas con lector de pantalla, en dispositivos reales (iPhone/Android) y en Safari/Firefox.

---

## 8. Pendientes y puntos de aprobación

**Del cliente (socios)**
- Nombres reales, formación, experiencia, especialidades e idiomas de cada socio; fotografías propias.
- Dirección, teléfono, correos, horario y número real de WhatsApp.
- Condiciones y costo de la primera consulta; textos de preguntas frecuentes.
- Nombre definitivo y verificación de marca/dominio.
- Plazo de respuesta, reglas de reparto, destinatarios de avisos y **plazo de conservación** de datos (hoy provisionales).
- Respuesta sobre abrir secciones del header en pestaña nueva (comentario 12).

**Legal**
- Revisión de la política de privacidad y cookies por un abogado, incluida la Ley 19.628 y la Ley 21.719 (no verificadas contra fuente oficial en esta etapa).
- Definir responsable del tratamiento, bases de licitud, transferencias internacionales (Firebase/Google, Cloudflare, Zoho, WhatsApp/Meta) y manejo de derechos de los titulares.

**Técnico (antes de producción)**
- Reemplazar el número ficticio de WhatsApp (en `index.html` y `app.js`).
- Crear proyecto Firebase solo cuando se acuerde (no se ha creado ninguno ni se ha inventado un `projectId`).
- Subir el repositorio a un remoto cuando se decida.

---

## 8b. Lista para pasar a producción (panel)
- **Solo «Exportar a Excel»:** «Copiar para Excel» existe únicamente porque la vista previa de claude.ai bloquea descargas. Antes de producción, poner `showCopyFallback: false` en `admin/config.js` (o eliminar el botón y su código). Pedido del cliente (comentario 23; el mensaje llegó cortado, pendiente confirmar el resto).
- Quitar las herramientas de demostración («Simular consulta nueva», «Simular que otro socio toma una», «Restablecer datos», selector «Actuando como») y el aviso de prototipo.
- Reemplazar el inicio de sesión simulado por Firebase Authentication con segundo factor, App Check y las demás medidas de `docs/SEGURIDAD.md`.
- Reemplazar `data.js` por datos reales de Firestore.

---

## 9. Principios que se mantienen
- Sin dependencias ni migración a React/Vue/Tailwind.
- Sin secretos ni credenciales en el navegador.
- Sin datos reales en el prototipo.
- No inventar credenciales, resultados ni clientes de los abogados.
