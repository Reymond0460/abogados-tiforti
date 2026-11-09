# NEXO Abogados · Despliegue en Firebase

Última actualización: 9 de noviembre de 2026.

Sitio público + panel de socios sobre **Firebase Hosting, Authentication y Firestore** (plan gratuito Spark; no requiere tarjeta ni Cloud Functions).

## 1. Qué incluye
| Parte | Cómo funciona |
|---|---|
| **Sitio público** (`/`) | Español/inglés, accesibilidad, WhatsApp. El formulario guarda la consulta en Firestore. Los textos que editan los socios se leen de Firestore (`contenido_publicado`). |
| **Panel de socios** (`/admin/`) | Inicio de sesión real (correo y contraseña), consultas en tiempo real, tomar con control de carrera, estado, reasignar con motivo, notas, historial que solo crece, registro manual, exportar a Excel, dashboard, editor de contenido con borrador y publicación, actividad (auditoría), cambio y recuperación de contraseña, móvil tipo app. |
| **Perfiles** | 3 socios (`socios/{uid}`), todos con el mismo nivel. Las altas y bajas se hacen desde la consola o el script, nunca desde el navegador. |
| **Clientes** | Cada solicitud es un documento en `consultas`. Solo los socios activos pueden leerlas. |
| **Seguridad** | Reglas de Firestore (63 pruebas), cabeceras de Hosting (CSP, HSTS, no-index del panel), sesión que termina al cerrar la pestaña, cierre por inactividad. Detalle en `docs/SEGURIDAD.md`. |

## 2. Desplegar con un solo comando (en tu computador)
Requisitos: Node 18+ y una cuenta de Google con permiso para crear proyectos.
```
git clone https://github.com/Reymond0460/abogados-tiforti
cd abogados-tiforti
npm install
node scripts/provision.js --emails socio1@estudio.cl,socio2@estudio.cl,socio3@estudio.cl
```
El script abre tu navegador para autorizar la CLI (donde ya tienes la sesión) y luego: crea el proyecto y la app web, crea Firestore en **Santiago (southamerica-west1)**, genera `firebase-config.json`, construye `dist/`, despliega Hosting y reglas, crea las 3 cuentas con **contraseñas temporales** (se imprimen una sola vez), los perfiles, el contenido inicial y las consultas de demostración.

Opciones: `--project <id>` (usar un proyecto existente o elegir el ID), `--sin-demo` (no cargar consultas de demostración), `--region <región>`.

### Paso manual único: activar Authentication
En un proyecto nuevo, Firebase exige un clic que no se puede automatizar. Si el script termina con el aviso «Falta activar Authentication»:
1. Abre `https://console.firebase.google.com/project/<ID>/authentication`.
2. «Comenzar» → «Correo electrónico/contraseña» → Habilitar (solo la primera casilla) → Guardar.
3. Vuelve a ejecutar el mismo comando (es seguro repetirlo).

## 3. Después de desplegar
- [ ] Entrar a `/admin/` con cada socio y **cambiar la contraseña** (Ajustes → Cambiar mi contraseña, mínimo 12 caracteres).
- [ ] Si usaste los correos de ejemplo (`@nexo-demo.example`), reemplázalos por los reales en Authentication → Usuarios y en Firestore `socios/{uid}.email`.
- [ ] Ajustes → «Eliminar consultas de demostración» antes de recibir consultas reales (las reales no se pueden borrar desde el panel).
- [ ] Reemplazar datos ficticios (WhatsApp, teléfono, dirección, textos legales) desde el editor de contenido y el código (`app.js`, `i18n.js`).
- [ ] Revisión legal de la política de privacidad (hoy es borrador) y definir plazo de conservación.
- [ ] Dominio propio: Hosting → «Agregar dominio personalizado»; el DNS se administra en Cloudflare (NIC Chile sigue como registrador).
- [ ] Decidir cuándo activar el segundo factor (hoy pospuesto por el cliente).

## 4. Actualizar el sitio
```
npm run build
npx firebase deploy --only hosting          # solo el sitio
npx firebase deploy --only firestore        # solo reglas e índices
npx firebase hosting:rollback               # volver a la versión anterior
```

## 5. Pruebas
- `node tests/run-all.js` → pruebas del modo demostración (14 grupos).
- `node tests/run-all.js --firebase` → además reglas de Firestore y la prueba de punta a punta con emuladores (requiere Java y descarga los emuladores).
- `npm run test:e2e` / `npm run test:rules` por separado.

## 6. Qué NO incluye esta etapa (pendiente)
| Pendiente | Por qué | Cómo se resuelve |
|---|---|---|
| **Aviso por correo** de cada consulta nueva y recordatorio a las 24 h | Requiere Cloud Functions (plan Blaze) y credenciales de Zoho en Secret Manager | Etapa siguiente; hoy la bandeja se actualiza en tiempo real y muestra aviso en pantalla |
| **Anti-spam fuerte** del formulario | Hoy: campo trampa, límite por navegador y validación estricta en las reglas. Un atacante decidido puede enviar solicitudes automatizadas | Activar Firebase App Check (reCAPTCHA) o Turnstile con una función |
| **Bloquear registros de cuentas** | Cualquiera puede crear una cuenta en Firebase Auth, pero sin perfil de socio no ve nada | Identity Platform (requiere Blaze) para deshabilitar el auto-registro |
| **Segundo factor** | Pospuesto por decisión del cliente | `requireSecondFactor` + MFA de Firebase |
| **Respaldos / recuperación a un punto en el tiempo** | Requiere Blaze | Activar al pasar a producción real |
| **Retención y borrado automático** | Plazo por definir con el abogado | Función programada o proceso manual |
