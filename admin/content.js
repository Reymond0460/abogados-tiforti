'use strict';
/* Contenido FICTICIO del editor (maqueta de la Etapa 2). Reproduce los textos del sitio público.
   Nada de esto cambia el sitio real ni se guarda. */
window.ADMIN_CONTENT = [
  { id: 'hero', name: 'Portada', hint: 'Lo primero que ve cada visitante.', preview: 'hero', fields: [
    { key: 'hero.eyebrow', label: 'Texto pequeño sobre el titular', help: 'Una frase breve en mayúsculas.', type: 'line', max: 50, es: 'TRES SOCIOS. UNA VISIÓN COMPARTIDA.', en: 'THREE PARTNERS. ONE SHARED VISION.' },
    { key: 'hero.title', label: 'Titular', help: 'Dos frases cortas separadas por un punto.', type: 'line', max: 60, es: 'Decisiones claras. Asesoría cercana.', en: 'Clear decisions. Close counsel.' },
    { key: 'hero.desc', label: 'Descripción', help: 'Una o dos líneas que expliquen qué hace el estudio.', type: 'area', max: 140, es: 'Un equipo que escucha, comprende y acompaña cada paso de su consulta legal.', en: 'A team that listens, understands and supports every step of your legal enquiry.' },
    { key: 'hero.cta', label: 'Texto del botón principal', help: 'Verbo en infinitivo o imperativo.', type: 'line', max: 30, es: 'Solicitar una consulta', en: 'Request a consultation' }
  ] },
  { id: 'estudio', name: 'El estudio', hint: 'Presenta al estudio y su forma de trabajar.', preview: 'studio', fields: [
    { key: 'studio.title', label: 'Título de la sección', help: 'Dos frases cortas separadas por un punto.', type: 'line', max: 70, es: 'El valor de comprender. La confianza de acompañar.', en: 'The value of understanding. The trust of support.' },
    { key: 'studio.p1', label: 'Primer párrafo', help: 'Qué lo mueve: la persona detrás de cada consulta.', type: 'area', max: 220, es: 'Detrás de cada consulta hay una persona, un proyecto o una decisión que importa. Esta propuesta pone esa conversación en el centro.', en: 'Behind every enquiry there is a person, a project or a decision that matters. This proposal puts that conversation at the centre.' },
    { key: 'studio.p2', label: 'Segundo párrafo', help: 'Qué encontrará la persona en el sitio.', type: 'area', max: 220, es: 'Un espacio para presentar a los tres socios, explicar sus especialidades y facilitar el primer contacto, con información clara desde el comienzo.', en: 'A space to introduce the three partners, explain their specialties and make first contact easy, with clear information from the start.' }
  ] },
  { id: 'areas', name: 'Especialidades', hint: 'Las tres áreas que ofrece el estudio.', preview: 'areas', fields: [
    { key: 'area.civil.t', label: 'Área 1 · nombre', help: '', type: 'line', max: 40, es: 'Derecho civil', en: 'Civil law' },
    { key: 'area.civil.d', label: 'Área 1 · descripción', help: 'Una frase.', type: 'area', max: 120, es: 'Orientación para decisiones, acuerdos y situaciones que forman parte de su vida.', en: 'Guidance for decisions, agreements and situations that are part of your life.' },
    { key: 'area.laboral.t', label: 'Área 2 · nombre', help: '', type: 'line', max: 40, es: 'Derecho laboral', en: 'Labour law' },
    { key: 'area.laboral.d', label: 'Área 2 · descripción', help: 'Una frase.', type: 'area', max: 120, es: 'Una mirada clara sobre las relaciones de trabajo, sus derechos y obligaciones.', en: 'A clear view of employment relationships, your rights and obligations.' },
    { key: 'area.empresas.t', label: 'Área 3 · nombre', help: '', type: 'line', max: 40, es: 'Asesoría a empresas', en: 'Business advisory' },
    { key: 'area.empresas.d', label: 'Área 3 · descripción', help: 'Una frase.', type: 'area', max: 120, es: 'Acompañamiento jurídico para construir, gestionar y proyectar su negocio.', en: 'Legal support to build, manage and grow your business.' }
  ] },
  { id: 'equipo', name: 'Equipo', hint: 'Nombre y especialidad de cada socio. Cada socio edita su propio perfil.', preview: 'team', fields: [
    { key: 'p1.name', label: 'Socio 1 · nombre', help: 'Nombre completo, como quiere que aparezca.', type: 'line', max: 50, es: 'Andrés Vergara Muñoz', en: 'Andrés Vergara Muñoz' },
    { key: 'p1.role', label: 'Socio 1 · especialidad', help: '', type: 'line', max: 50, es: 'Derecho civil', en: 'Civil law' },
    { key: 'p2.name', label: 'Socia 2 · nombre', help: 'Nombre completo, como quiere que aparezca.', type: 'line', max: 50, es: 'Valentina Soto Araya', en: 'Valentina Soto Araya' },
    { key: 'p2.role', label: 'Socia 2 · especialidad', help: '', type: 'line', max: 50, es: 'Derecho laboral', en: 'Labour law' },
    { key: 'p3.name', label: 'Socio 3 · nombre', help: 'Nombre completo, como quiere que aparezca.', type: 'line', max: 50, es: 'Tomás Herrera Lagos', en: 'Tomás Herrera Lagos' },
    { key: 'p3.role', label: 'Socio 3 · especialidad', help: '', type: 'line', max: 50, es: 'Asesoría a empresas', en: 'Business advisory' }
  ] },
  { id: 'faq', name: 'Preguntas frecuentes', hint: 'Las cuatro preguntas que más se repiten.', preview: 'faq', fields: [
    { key: 'faq.q1', label: 'Pregunta 1', help: '', type: 'line', max: 80, es: '¿Cómo solicito una primera consulta?', en: 'How do I request a first consultation?' },
    { key: 'faq.a1', label: 'Respuesta 1', help: 'Clara y sin tecnicismos.', type: 'area', max: 300, es: 'Puede dejar sus datos y seleccionar un área de interés en el formulario. El equipo se pondría en contacto para revisar disponibilidad y condiciones.', en: 'You can leave your details and choose an area of interest in the form. The team would contact you to review availability and terms.' },
    { key: 'faq.q2', label: 'Pregunta 2', help: '', type: 'line', max: 80, es: '¿La primera consulta tiene un costo?', en: 'Does the first consultation have a cost?' },
    { key: 'faq.a2', label: 'Respuesta 2', help: 'Aquí va la condición real de la primera consulta.', type: 'area', max: 300, es: 'Para esta demostración se supone una primera conversación de 30 minutos sin costo (condición ficticia).', en: 'For this demo, a first 30-minute conversation at no cost is assumed (fictitious condition).' },
    { key: 'faq.q3', label: 'Pregunta 3', help: '', type: 'line', max: 80, es: '¿Debo enviar documentos o detalles de mi caso?', en: 'Do I need to send documents or details of my case?' },
    { key: 'faq.a3', label: 'Respuesta 3', help: '', type: 'area', max: 300, es: 'No en este primer contacto. Evite compartir información confidencial, documentos o antecedentes sensibles.', en: 'Not at this first contact. Avoid sharing confidential information, documents or sensitive details.' },
    { key: 'faq.q4', label: 'Pregunta 4', help: '', type: 'line', max: 80, es: '¿Enviar una solicitud significa contratar al estudio?', en: 'Does sending a request mean hiring the firm?' },
    { key: 'faq.a4', label: 'Respuesta 4', help: '', type: 'area', max: 300, es: 'No. Un primer contacto no constituye por sí solo una relación abogado–cliente ni la aceptación de un encargo.', en: 'No. A first contact does not by itself create an attorney–client relationship or the acceptance of a matter.' }
  ] },
  { id: 'contacto', name: 'Datos de contacto', hint: 'Dónde y cuándo encontrar al estudio. Datos ficticios.', preview: 'contact', fields: [
    { key: 'cd.addr', label: 'Dirección', help: 'Calle, número, oficina y ciudad.', type: 'line', max: 80, es: 'Av. Ejemplo 1234, oficina 56, Santiago', en: 'Av. Ejemplo 1234, office 56, Santiago, Chile' },
    { key: 'cd.phone', label: 'Teléfono', help: 'Con código de país.', type: 'line', max: 24, es: '+56 2 0000 0000', en: '+56 2 0000 0000' },
    { key: 'cd.mail', label: 'Correo', help: 'El que atiende consultas.', type: 'line', max: 60, es: 'contacto@nexo-demo.example', en: 'contacto@nexo-demo.example' },
    { key: 'cd.hours', label: 'Horario de atención', help: '', type: 'line', max: 60, es: 'Lunes a viernes, 09:00 a 18:00', en: 'Monday to Friday, 9:00 am to 6:00 pm' }
  ] }
];
