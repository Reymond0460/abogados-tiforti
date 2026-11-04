# NEXO Abogados · Informe de QA

Fecha: 3 de noviembre de 2026. Alcance: sitio público (demo) y panel interno (prototipo), antes de pasar a desarrollo.

## 1. Resultado general
**14 de 14 grupos de pruebas pasan** (`node tests/run-all.js`). Durante el QA se encontraron y corrigieron 10 defectos (sección 3). Quedan observaciones y límites declarados (sección 4) que no impiden pasar a desarrollo, pero deben considerarse.

## 2. Qué se probó y cómo

| Área | Cobertura | Herramienta |
|---|---|---|
| Funcional del sitio | Enlaces internos y de salida, menú móvil, 8 ventanas (X, Escape, clic fuera, foco de retorno, bloqueo de scroll), acordeones, formulario (válido, inválido, sin envío), panel de accesibilidad (7 ajustes), idioma ES/EN, WhatsApp, enlaces a tiforti.cl | Playwright (Chromium), escritorio 1440 px y móvil 390 px, ES y EN |
| Funcional del panel | Ingreso, bandeja con filtros, ficha (tomar, estado, reasignar con motivo, notas, historial, copiar, navegar), registro manual, equipo, avisos, dashboard (5 gráficos), exportar a Excel, editor de contenido, ajustes, restablecer, cierre de sesión | Playwright |
| UX móvil del panel | Barra inferior, cabecera ≤ 140 px (mide 90), tarjetas ≤ 130 px (mide 116) y ≥ 3 completas en la primera pantalla, chips de filtro, ficha a pantalla completa, botón flotante, menú «Más», zonas táctiles ≥ 44 px, textos ≥ 12 px, campo de búsqueda ≥ 16 px, área segura | Playwright con emulación táctil (360×740, 390×844, 430×932) |
| Seguridad del ingreso (demostración) | Errores de formato sin gastar intentos, mensaje genérico, bloqueo tras 5 intentos, cierre por inactividad con aviso, pantalla vaciada al salir, política de contenido sin violaciones | Playwright |
| Accesibilidad automática | WCAG 2.0/2.1/2.2 A y AA y buenas prácticas en unos 48 estados (sitio ES/EN, con panel y ventanas abiertas, alto contraste; panel en todas sus pantallas, pestañas y ventanas) | axe-core 4.14.0 |
| Teclado | 88 paradas de tabulación en el sitio, foco visible en todas, «Saltar al contenido» primero, ventanas sin trampa, flechas en las pestañas de la ficha, menú y panel con Enter/Escape | Playwright |
| Tamaños | 130 combinaciones (10 anchos de 320 a 1440 px × ES/EN × normal, fuente legible + espaciado, texto al 140 %) y 6 vistas del panel por ancho: sin desplazamiento horizontal. Ficha sin scroll: 22 fichas × 4 pestañas × 5 tamaños | Playwright |
| Idiomas | 151 claves con par ES/EN; sin texto en español visible en modo inglés; 8 ventanas revisadas en inglés | Playwright |
| Privacidad | `localStorage` solo con `nexo-lang` y `nexo-a11y`; 0 cookies; 0 peticiones distintas de GET; ningún dato del formulario ni del panel guardado en el navegador | Playwright |
| Rendimiento (local) | 11 recursos, ≈ 951 KB, carga ≈ 0,7 s, ningún recurso > 400 KB, sin recursos externos | Playwright |
| Calidad de código | Sintaxis de 9 archivos JavaScript, HTML (0 errores; 6 avisos, ver 4), sin credenciales ni recursos externos inesperados | node, html-validate 11.18 |
| Excel | `.xlsx` abierto con una librería de hojas de cálculo: hojas, columnas, filtros, encabezado fijo y fechas correctas; con filtros aplicados | Playwright + openpyxl |
| Sensibilidad de la suite | Se rompió a propósito una copia (etiqueta del formulario, botón de accesibilidad, cambio de estado al tomar): la suite falló | prueba de mutación |

## 3. Defectos encontrados durante este QA (corregidos)
| N.º | Defecto | Corrección |
|---|---|---|
| 1 | Casilla de privacidad: el enlace «política de privacidad» estaba dentro de la `label` (control interactivo anidado, etiqueta asociada a dos controles) | Etiqueta solo con el texto; enlace fuera de ella |
| 2 | Campos sin atributo `type` (nombre, ajustes, código) | `type="text"` |
| 3 | Filtros de la bandeja como `form` sin botón de envío | Pasaron a `div role="search"` |
| 4 | Título vacío en el diálogo de confirmación del editor | Texto por defecto |
| 5 | Contrastes bajo 4,5:1: iconos 01/02/03 de principios (3,76), textos grises y eyebrow de contacto sobre azul claro (4,37 y 4,4), texto del botón de WhatsApp (4,3) | Colores ajustados (en modo normal; alto contraste intacto) |
| 6 | Nombre accesible sin el texto visible: logo, botones ES/EN, A−/A+ | Etiquetas ajustadas |
| 7 | Contenido fuera de «landmarks»: franja superior, botón de WhatsApp, aviso del prototipo; pantalla de ingreso sin `main` | Regiones, `aside` y `role="main"` |
| 8 | Desborde de 20 px a 768 px con «Fuente legible» + «Espaciado de texto» | Cabecera compactada en ese caso |
| 9 | Desborde de 18 px a 320 px (cabecera) | Cabecera compactada bajo 340 px |
| 10 | Enlace vertical «NEXO · UNA PROPUESTA DE TIFORTI» de 14 px de ancho (área táctil < 24 px) | Relleno hasta ≥ 24 px |

Defectos de rondas anteriores ya corregidos y con prueba: ancla «Volver al inicio» sin efecto, texto rotado en preguntas frecuentes (iPhone), ventana de detalle oscura, fichas de distinto tamaño, pantalla de ingreso sin ocultar, texto «null» en el detalle, pérdida de foco al cerrar una consulta.

## 4. Observaciones y límites (no corregidos)
1. **Solo se probó en Chromium.** No hay pruebas en Safari (iPhone/Mac), Firefox, Edge ni dispositivos reales. Hubo dos errores solo visibles en iPhone en rondas anteriores: se recomienda una pasada en iPhone y Android antes de cada entrega.
2. **Sin lector de pantalla** (NVDA, VoiceOver, TalkBack). axe-core detecta una parte de los problemas, no todos.
3. **Avisos de HTML heredados del diseño original:** 6 avisos por `h3` y `p` dentro de `button` en las filas de especialidades. Funciona, pero conviene rehacer esa fila con `article` + enlace/botón en desarrollo.
4. **La vista previa de claude.ai** bloquea descargas: la descarga del `.xlsx` solo se prueba en local. «Copiar para Excel» existe solo para la vista previa.
5. **Datos y reglas ficticios**: nombres, contacto, número de WhatsApp, plazo de 24 h, textos legales (borrador sin revisión legal).
6. **La seguridad del panel es una demostración.** No hay autenticación real: ver `docs/SEGURIDAD.md`. El segundo factor está pospuesto por decisión del cliente.
7. **Rendimiento medido en local.** Falta medir con red real y Lighthouse sobre el hosting definitivo.
8. **Resolución 320 px** queda fuera del rango pedido (360–1440 px) y hoy no desborda, pero no se probaron todas las combinaciones de ajustes de accesibilidad en ese ancho.

## 5. Lista para pasar a desarrollo
**Antes de construir**
- [ ] Decidir el alcance de la Etapa 1 y quién aprueba los textos (ver `docs/DOCUMENTACION.md`).
- [ ] Revisión legal de la política de privacidad y cookies.
- [ ] Definir proyecto Firebase, dominio y cuentas (NIC Chile, Cloudflare, Zoho).
- [ ] Decidir cuándo activar el segundo factor (recomendado antes de recibir consultas reales).

**Durante el desarrollo**
- [ ] Reemplazar datos ficticios, número de WhatsApp y herramientas de demostración (lista en `docs/DOCUMENTACION.md`, sección 8b).
- [ ] Conectar las pruebas a un entorno de prueba con Firebase (emulador) y agregar pruebas de reglas de Firestore.
- [ ] Mantener `node tests/run-all.js` en verde en cada cambio (integrable a CI).
- [ ] Pasada manual en iPhone y Android, y con lector de pantalla.

## 6. Cómo repetir las pruebas
Ver `tests/README.md`.
