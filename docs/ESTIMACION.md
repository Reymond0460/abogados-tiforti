# NEXO Abogados · Estimación de tiempo

Última actualización: 3 de noviembre de 2026.

Este documento traduce el trabajo a **horas y días** para que TiforTi pueda convertirlo después en un valor de desarrollo. **No contiene precios.**

## Cómo leer las cifras

- Son **estimaciones de esfuerzo de referencia** para un desarrollador independiente que hace el trabajo manualmente, en rangos (mínimo a máximo).
- **Jornada:** 1 día = 8 h de trabajo; para planificar plazos se sugiere contar ~6 h productivas por día.
- Los prototipos de esta etapa se generaron con asistencia de IA dentro de una misma sesión de trabajo, por lo que **el tiempo real fue menor** que la referencia manual. No se midió con precisión. TiforTi decide qué cifra usar al cotizar.
- No incluyen: revisión legal (externa), reuniones con los socios, contenido definitivo (textos y fotos), ni costos de servicios en la nube.

---

## A. Trabajo ya realizado (prototipos)

### A1. Sitio público (demo)
| Módulo | Horas |
|---|---|
| Revisión del ZIP, ejecución, estructura del repositorio | 2 – 3 |
| Español/inglés: diccionario (~250 textos), selector con banderas, traducción de ventanas y mensajes | 8 – 12 |
| Panel de accesibilidad (7 funciones, persistencia, compatibilidad con zoom, alto contraste y móvil) | 6 – 8 |
| Contenido ficticio: perfiles, áreas, preguntas frecuentes, datos de contacto | 3 – 4 |
| Política de privacidad y de cookies (borrador ES/EN), botón para borrar preferencias | 4 – 6 |
| Funciones adicionales: teléfono, WhatsApp flotante, enlaces a tiforti.cl, sección activa del menú, «Volver al inicio» | 5 – 7 |
| Pruebas, responsive y accesibilidad (varias rondas y correcciones) | 8 – 12 |
| Vista previa privada y documentación | 2 – 3 |
| **Subtotal A1** | **38 – 55 h** |

### A2. Panel interno (prototipo)
| Módulo | Horas |
|---|---|
| Diseño de flujos y de la interfaz (consultas, roles, estados, bloqueo) | 4 – 6 |
| Estructura, inicio de sesión simulado, navegación | 3 – 4 |
| Bandeja: resumen, filtros, plazo vencido, tabla/tarjetas en móvil | 6 – 8 |
| Detalle: tomar con bloqueo, estado, reasignar con motivo, notas, historial, plazo visible, copiar contacto, navegación entre consultas, pestañas y tamaño fijo sin scroll | 14 – 18 |
| Carga del equipo | 2 – 3 |
| Avisos por correo simulados y recordatorios | 2 – 3 |
| Editor de contenido guiado (maqueta Etapa 2): secciones, campos ES/EN, vista previa, autoguardado, confirmación, versiones | 10 – 14 |
| Registro manual de consultas (opción A de WhatsApp) | 4 – 6 |
| Exportar a Excel (.xlsx, copia al portapapeles, verificación) | 6 – 8 |
| Demostración de controles de acceso (contraseña, 2.º factor, bloqueo, inactividad, CSP), mejora de la pantalla de ingreso e instrucciones, y plan de seguridad (`docs/SEGURIDAD.md`) | 8 – 12 |
| Dashboard: indicadores y 5 gráficos SVG accesibles (barras y pastel) | 8 – 12 |
| Ajustes (plazo, casilla compartida, retención) | 1 – 2 |
| Responsive y accesibilidad | 4 – 6 |
| Pruebas automáticas y correcciones | 4 – 6 |
| Rediseño UX móvil del panel: barra inferior, cabecera compacta, lista en tarjetas, chips de filtro, hoja a pantalla completa, menú «Más», botón flotante, área segura, acción rápida «Tomar» con «Deshacer», pruebas móviles | 17 – 24 |
| QA integral: suite reutilizable (13 grupos), auditoría axe-core, teclado, tamaños, idiomas, privacidad, corrección de 10 defectos e informe | 14 – 20 |
| Documentación | 2 – 3 |
| **Subtotal A2** | **109 – 155 h** |

### Total de los prototipos (A1 + A2)
| | Horas | Días de 8 h |
|---|---|---|
| **Referencia manual** | **147 – 210 h** | **≈ 19 – 27 días** |

---

## B. Trabajo para pasar a producción (aún no iniciado)

### B1. Etapa 1 · Consultas reales
| Módulo | Horas |
|---|---|
| Proyecto Firebase (Hosting, Auth, Firestore, Functions), entornos, alertas de presupuesto | 4 – 6 |
| Autenticación: lista cerrada de 3 cuentas, contraseña robusta, roles (segundo factor pospuesto; activarlo después suma ≈ 3 – 5 h) | 5 – 7 |
| Reglas de seguridad de Firestore y sus pruebas | 6 – 8 |
| Función de recepción del formulario: validación, anti-spam (Turnstile/App Check), límite de envíos | 10 – 14 |
| Correo con Zoho: casilla compartida, correos de socios, plantillas, secretos | 6 – 8 |
| Bandeja conectada a Firestore en tiempo real; «tomar» con transacción | 12 – 16 |
| Dashboard y exportación conectados a datos reales (consultas agregadas, permisos) | 6 – 8 |
| Endurecimiento de seguridad: App Check, cabeceras de Hosting, auditoría y alertas, revisión de cuentas, pruebas de acceso no autorizado | 10 – 16 |
| Recordatorio programado a las 24 h | 4 – 6 |
| Historial y registro de auditoría | 4 – 6 |
| Conectar el formulario del sitio público | 4 – 6 |
| Dominio, DNS (Cloudflare/NIC) y despliegue | 4 – 6 |
| Pruebas de extremo a extremo y revisión de seguridad | 10 – 14 |
| Documentación y capacitación a los socios | 4 – 6 |
| **Subtotal B1** | **89 – 127 h** |

### B2. Etapa 2 · Edición de textos por los socios
| Módulo | Horas |
|---|---|
| Modelo de datos y paso de los textos a Firestore, con respaldo local | 10 – 14 |
| Editor con borrador, publicación y versiones (ES/EN); la interfaz ya existe en el prototipo, aquí se conecta a datos reales | 12 – 18 |
| Permisos (cada socio su perfil; textos generales aprobados) | 4 – 6 |
| El sitio público lee el contenido publicado | 6 – 8 |
| Pruebas | 6 – 8 |
| Documentación | 2 – 3 |
| **Subtotal B2** | **40 – 57 h** |

### B3. Opcional · WhatsApp (fuera de la cotización base)
| Módulo | Horas |
|---|---|
| A. Registro manual de consultas de WhatsApp en el panel (ya incluido en el prototipo A2; en producción solo falta conectarlo a Firestore, dentro de B1) | — |
| B. WhatsApp Business Platform: cuenta y número en Meta, webhook, creación automática de consultas, deduplicación, avisos, plantillas de mensaje | 20 – 30 |
| C. Agente de IA: diseño de reglas y conversación, modelo de lenguaje, traspaso a humano, reserva de horas (requiere agenda real), pruebas con casos de riesgo | 40 – 70 |

Notas: C depende de B y de una agenda real (hoy no incluida). Meta y el proveedor del modelo cobran por uso; verificar precios vigentes. Estas cifras son muy preliminares y requieren definir antes el alcance con los socios.

### Resumen de producción (B1 + B2)
| | Horas | Días de 8 h |
|---|---|---|
| B1 (consultas reales) | 89 – 127 | ≈ 11 – 16 |
| B2 (edición de textos) | 40 – 57 | ≈ 5 – 7 |
| Contingencia sugerida (15 %) | 20 – 28 | ≈ 3 – 4 |
| **Total B** | **149 – 212 h** | **≈ 19 – 27 días** |

---

## C. Plazos orientativos (calendario)

Con ~6 h productivas diarias y dedicación completa:

| Fase | Duración aproximada |
|---|---|
| Prototipos (A) | Ya entregados |
| Etapa 1 (B1) | 3 – 4 semanas |
| Etapa 2 (B2) | 2 – 3 semanas |

Los plazos reales dependen de que los socios entreguen a tiempo contenido definitivo, decisiones y aprobaciones, y de la revisión legal.

---

## D. Costos recurrentes a verificar (no incluidos en las horas)

- **Firebase (plan Blaze)**: con ~30 consultas al mes se espera un uso mínimo; verificar precios vigentes y fijar una alerta de presupuesto.
- **Cloudflare**: DNS y Turnstile (verificar plan).
- **Zoho Mail**: ya contratado por el cliente (verificar licencias para la casilla compartida).
- **NIC Chile**: renovación del dominio.
- **Mantención**: horas mensuales para actualizaciones, respaldo y soporte (por definir).

---

## E. Supuestos y riesgos que mueven la estimación

1. Alcance cerrado a lo descrito: sin documentos de clientes, agenda, cobros ni pasarela de pago.
2. Los tres socios tienen el mismo nivel de permisos.
3. Las decisiones provisionales (plazo, reparto, avisos, conservación) pueden cambiar y alterar horas.
4. La política de privacidad exigirá ajustes tras la revisión legal (conservación, derechos del titular).
5. Si piden integraciones adicionales (WhatsApp Business API, calendario, CRM), se estiman aparte.
6. Cambios de diseño del sitio público después de la aprobación se estiman aparte.
