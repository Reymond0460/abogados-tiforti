# Suite de QA

Pruebas automáticas del sitio público y del panel (prototipo). **No forman parte del sitio**: no se publican ni agregan dependencias a la web.

## Requisitos
- Node 18 o superior.
- Playwright con Chromium: `npm i -g playwright` y `npx playwright install chromium`.
- Para accesibilidad automática: `npm i axe-core` (o `AXE_PATH=ruta/a/axe.min.js`).

## Uso
```
node tests/run-all.js                              # levanta un servidor local solo para las pruebas
BASE=http://localhost:8000 node tests/run-all.js    # usa un servidor que ya tengas levantado
VERBOSE=1 node tests/run-all.js                     # muestra la salida completa de cada grupo
node tests/panel-ficha.test.js                      # un grupo suelto (con BASE=... si hace falta)
```
Salida: «PASA/FALLA» por grupo y un resumen. El código de salida es 0 solo si todo pasa. Las capturas y archivos generados van a `OUT` (por defecto, la carpeta temporal del sistema).

## Grupos
| Archivo | Qué comprueba |
|---|---|
| `public-funcional` | Enlaces, menú móvil, 8 ventanas, acordeones, formulario, panel de accesibilidad, idiomas, tamaños táctiles |
| `panel-funcional` | Ingreso, bandeja, ficha, avisos, equipo, ajustes, editor, restablecer |
| `panel-movil-ux` | Experiencia móvil del panel: barra inferior, cabecera compacta, tarjetas ≤ 130 px y ≥ 3 visibles, chips de filtro, ficha a pantalla completa, botón flotante, menú «Más», zonas táctiles ≥ 44 px (360, 390 y 430 px) |
| `panel-seguridad-login` | Errores de formato, bloqueo tras intentos, cierre por inactividad, limpieza de pantalla |
| `panel-ficha` / `panel-ficha-sin-scroll` | Copiar, navegar, estado; las 22 fichas × 4 pestañas × 5 tamaños de pantalla sin scroll |
| `panel-registro` | Registro manual de consultas |
| `panel-exportar-dashboard` | `.xlsx` válido, copia al portapapeles, 5 gráficos, actualización al operar |
| `panel-editor-contenido` | Editor de contenido: autoguardado, límites, confirmación, versiones |
| `panel-config` | Interruptor `showCopyFallback` |
| `a11y-axe` | axe-core (WCAG 2.2 AA y buenas prácticas) en unos 48 estados de pantalla |
| `extra` | 130 combinaciones de tamaño, teclado, idiomas, rendimiento, privacidad y movimiento reducido |

Además, `run-all.js` revisa la sintaxis de todo el JavaScript y que no haya recursos externos inesperados ni credenciales.

## Límites
Solo Chromium. No cubre Firefox, Safari, dispositivos reales ni lectores de pantalla.

## Firebase
`node tests/run-all.js --firebase` agrega las reglas de Firestore (`tests/firebase/reglas.test.js`) y la prueba de punta a punta con emuladores (`tests/firebase/e2e.test.js`). Requiere Java y descarga los emuladores la primera vez.
