'use strict';
/* Configuración del panel.
   showCopyFallback: muestra «Copiar para Excel». Solo sirve en la VISTA PREVIA de claude.ai, donde el visor bloquea
   las descargas. EN PRODUCCIÓN DEBE ESTAR EN false: queda únicamente «Exportar a Excel». */
window.ADMIN_CONFIG = {
  showCopyFallback: true,
  /* Demostración de los controles de acceso. En producción los aplica el SERVIDOR (Firebase Authentication,
     App Check, reglas de Firestore); estos valores solo muestran la experiencia de usuario. */
  security: { maxAttempts: 5, lockSeconds: 30, sessionMinutes: 15, warnSeconds: 60,
    /* Decisión actual del cliente: por ahora NO se integra app autenticadora (segundo factor).
       Para reactivarlo: requireSecondFactor: true (y minPassword: 8 si se desea). */
    requireSecondFactor: false, minPassword: 12 }
};
