# NEXO Abogados · Plan de seguridad

Última actualización: 3 de noviembre de 2026.

Objetivo: proteger la información de los **socios** y de las **personas que consultan**.

> **Aviso importante:** un prototipo que corre en el navegador **no entrega seguridad real**. Cualquier control que viva solo en el navegador se puede saltar. La seguridad real la aplica el **servidor** (Firebase Authentication, App Check, reglas de Firestore, Cloud Functions y cabeceras de Hosting). Lo que muestra el prototipo son demostraciones de la experiencia de usuario de esos controles.

---

## 1. Qué muestra hoy el prototipo (solo demostración)

| Control | Qué se ve en el prototipo | Quién lo aplica en producción |
|---|---|---|
| Contraseña (sin segundo factor por ahora) | Un campo de contraseña de 12+ caracteres. El segundo factor (código de 6 dígitos) queda desactivado, pero el prototipo puede reactivarlo con `requireSecondFactor: true` | Firebase Authentication (correo + contraseña). MFA pospuesto por decisión del cliente |
| Límite de intentos | Tras 5 intentos fallidos se bloquea el formulario 30 s con cuenta regresiva | Firebase Authentication (límite y bloqueo del lado servidor) + App Check |
| Mensajes que no revelan datos | «No pudimos verificar tus datos…» (no dice si falló la contraseña o el código) | Firebase Authentication |
| Cierre por inactividad | Aviso a los 14 min y cierre a los 15 min; la pantalla se vacía | Cliente + expiración de sesión en servidor |
| Cerrar sesión limpia la pantalla | Tablas, gráficos y registros se borran al salir | Cliente |
| Política de contenido (CSP) | Solo se permite código y recursos del propio sitio; sin conexiones externas | Cabeceras de Firebase Hosting |
| No indexar ni archivar | `noindex, nofollow, noarchive`, sin `referrer` | Cabeceras de Hosting + `robots` |
| Contraseña oculta con opción de mostrar | Botón «Mostrar/Ocultar» | Cliente |

Valores configurables en `admin/config.js` (`security`).

---

## 2. Controles reales que se implementarán (Etapa 1)

### 2.1 Identidad y acceso
- **Cuentas cerradas:** solo las 3 cuentas de los socios. Sin registro público. Alta y baja controladas.
- **Segundo factor: POSPUESTO por decisión del cliente (3-nov-2026)**: por ahora no se integra aplicación autenticadora. Es la medida que más reduce el riesgo de robo de cuentas, por lo que se recomienda reactivarla (TOTP o passkeys) antes de operar con consultas reales. Firebase Authentication lo soporta sin rehacer el panel.
- **Medidas compensatorias mientras no haya segundo factor:** contraseña de **mínimo 12 caracteres** (frase larga) revisada contra contraseñas filtradas, límite de intentos y bloqueo temporal en el servidor, aviso por correo ante cada inicio de sesión desde un dispositivo nuevo, sesiones cortas, cierre por inactividad, registro de auditoría con alertas, restablecimiento de acceso solo por otro socio (con registro), y lista cerrada de las 3 cuentas.
- **Contraseñas largas** (mínimo 12 caracteres) y verificación contra contraseñas filtradas; recomendar gestor de contraseñas.
- **Roles** mediante *custom claims*: `socio` (tres iguales). Un eventual rol de asistente con menos permisos.
- **Sesiones cortas** con renovación; cierre por inactividad; cierre de todas las sesiones desde el panel.
- **Aviso por correo** ante un inicio de sesión desde un dispositivo nuevo.

### 2.2 Datos
- **Reglas de Firestore** por defecto en «denegar todo»; permitir solo a cuentas con rol `socio`. Ninguna lectura de consultas desde el sitio público.
- **Escritura de consultas solo vía Cloud Function** (validación de campos, tamaños y formato en el servidor).
- **Minimización:** el formulario solo pide nombre, contacto y área; sin documentos ni antecedentes del caso.
- **Cifrado** en tránsito (HTTPS obligatorio) y en reposo (por defecto en Google Cloud).
- **Región Santiago** (`southamerica-west1`) para Firestore y Functions.
- **Respaldos** programados y prueba de restauración.
- **Retención y borrado:** plazo por definir con el abogado; borrado automático al vencer.

### 2.3 Formulario público y mensajería
- **Anti-spam / anti-bots:** Cloudflare Turnstile o Firebase App Check, más límite de envíos por IP y por correo.
- **Sin secretos en el navegador:** credenciales de Zoho en Secret Manager, accesibles solo por la función.
- **Avisos por correo** sin datos sensibles en el asunto; el detalle se ve solo dentro del panel.
- **WhatsApp:** número y reglas de uso definidos por el estudio; sin documentos por ese canal.

### 2.4 Aplicación y cabeceras (Firebase Hosting)
Cabeceras recomendadas para el panel (ejemplo, **no** es un `firebase.json` real):

```json
{
  "headers": [{
    "source": "**",
    "headers": [
      { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "Referrer-Policy", "value": "no-referrer" },
      { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
      { "key": "X-Robots-Tag", "value": "noindex, nofollow, noarchive" }
    ]
  }]
}
```
La política exacta se ajusta cuando se conecten los servicios (dominios de Firebase, Turnstile, etc.).

- **Subdominio propio** para el panel (`panel.sudominio.cl`) con un sitio de Hosting separado del público.
- **Sin dependencias externas** de terceros en el panel (hoy no hay ninguna): reduce el riesgo de cadena de suministro.
- **Texto siempre como texto** (`textContent`), nunca HTML sin escapar, para evitar XSS. Ya se aplica en el prototipo.
- **Exportación a Excel:** los valores se guardan como texto, no como fórmulas (evita inyección de fórmulas).

### 2.5 Cloudflare / dominio
- DNSSEC activo, WAF y reglas de límite de peticiones sobre `/panel`, HTTPS estricto (Full strict).
- Registrador (NIC Chile) con bloqueo de transferencia y acceso protegido con segundo factor.
- Correo (Zoho): SPF, DKIM y DMARC configurados para evitar suplantación.

### 2.6 Operación
- **Registro de auditoría** de accesos y acciones (tomar, reasignar, exportar, cambiar contenido).
- **Alertas** de intentos fallidos repetidos, exportaciones y cambios de cuentas.
- **Actualización de dependencias** y revisión periódica de cuentas y permisos.
- **Plan de respuesta a incidentes:** quién decide, cómo se avisa a los socios y a las personas afectadas, y los plazos legales de notificación (a validar con el abogado).
- **Pruebas de seguridad** antes de salir: revisión de reglas, pruebas de acceso no autorizado y revisión del formulario.

---

## 2b. Riesgo aceptado: acceso solo con contraseña
Sin segundo factor, si una contraseña se filtra o la roban (phishing, reutilización, malware), quien la tenga podría entrar al panel y ver consultas de clientes. El estudio acepta este riesgo de forma temporal. Recomendaciones: contraseñas únicas y largas con gestor de contraseñas, no compartir cuentas, y reactivar el segundo factor al pasar a producción real.

---

## 2c. Implementado en la versión Firebase (verificado con emuladores)
- **Reglas de Firestore** (`firestore.rules`, 63 pruebas): denegar todo por defecto; el público solo puede **crear** una consulta con campos exactos, estado «nueva», sin responsable, con consentimiento y fecha del servidor; nunca leer, modificar ni borrar. Solo socios activos leen y gestionan. El historial y las notas **solo crecen**. Solo se pueden borrar consultas marcadas como demostración. Auditoría solo se agrega.
- **Autenticación real** (Firebase Auth, correo y contraseña ≥ 12 caracteres), sesión que termina al cerrar la pestaña, cierre por inactividad, bloqueo tras 5 intentos fallidos y mensajes que no revelan qué dato falló. Una cuenta sin perfil de socio no entra.
- **Control de carrera**: si dos socios toman la misma consulta, solo uno lo logra (transacción + regla).
- **Cabeceras de Hosting**: CSP estricta (sin scripts de terceros), HSTS, X-Frame-Options, no-index y sin caché en `/admin/`.
- **Datos en Santiago** (`southamerica-west1`), sin analítica ni cookies de terceros.
- **Contraseñas**: cambio y recuperación desde el panel; las iniciales son temporales.
- Pendiente (ver `docs/DESPLIEGUE.md`, sección 6): anti-spam fuerte (App Check), aviso por correo, segundo factor, respaldos y retención.

---

## 3. Qué NO resuelve el prototipo (para evitar falsas expectativas)
- No hay autenticación ni autorización reales.
- El límite de intentos se reinicia al recargar la página: en producción lo aplica el servidor.
- No hay cifrado propio de datos; la protección vendrá de la plataforma y de las reglas.
- Las cuentas, contraseñas y códigos del prototipo no protegen nada.

## 4. Responsabilidades del estudio
- Mantener el segundo factor activo en sus teléfonos; no compartir cuentas.
- Notificar de inmediato pérdida de teléfono o sospecha de acceso indebido.
- Aprobar la política de conservación y el protocolo de incidentes.

## 5. Normativa
La revisión legal debe confirmar las obligaciones aplicables (Ley N° 19.628, Ley N° 21.719 y secreto profesional del abogado). Esta documentación no sustituye esa revisión.
