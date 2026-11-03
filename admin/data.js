'use strict';
/* Datos FICTICIOS del prototipo del panel. Nada de esto es real ni se guarda. */
window.ADMIN_DATA = (() => {
  const H = 3600 * 1000;
  const now = Date.now();
  const ago = (hours) => now - hours * H;
  const partners = [
    { id: 'p1', name: 'Andrés Vergara Muñoz', short: 'Andrés', area: 'civil', photo: '../assets/partner-1.jpg' },
    { id: 'p2', name: 'Valentina Soto Araya', short: 'Valentina', area: 'laboral', photo: '../assets/partner-2.jpg' },
    { id: 'p3', name: 'Tomás Herrera Lagos', short: 'Tomás', area: 'empresas', photo: '../assets/partner-3.jpg' }
  ];
  const mk = (id, hours, name, email, phone, area, channel, status, owner, extra = {}) => ({
    id, createdAt: ago(hours), name, email, phone, area, channel, status, owner,
    notes: extra.notes || [],
    history: [{ at: ago(hours), who: 'Sistema', text: 'Consulta recibida por ' + (channel === 'whatsapp' ? 'WhatsApp' : 'formulario web') + '.' }].concat(extra.history || [])
  });
  const consultations = [
    mk('C-1042', 1.5, 'Camila Fuentes', 'camila.f@example.com', '+56 9 1111 2222', 'laboral', 'formulario', 'nueva', null),
    mk('C-1041', 3, 'Rodrigo Pizarro', 'rpizarro@example.com', '', 'civil', 'formulario', 'nueva', null),
    mk('C-1040', 7, 'Constructora Ejemplo SpA', 'contacto@example.com', '+56 2 3333 4444', 'empresas', 'whatsapp', 'nueva', null),
    mk('C-1039', 30, 'Javiera Núñez', 'jnunez@example.com', '+56 9 5555 6666', 'orientacion', 'formulario', 'nueva', null),
    mk('C-1038', 52, 'Marcelo Araya', 'marcelo.a@example.com', '+56 9 7777 8888', 'civil', 'formulario', 'nueva', null),
    mk('C-1037', 20, 'Patricia Muñoz', 'pmunoz@example.com', '+56 9 2222 3333', 'laboral', 'formulario', 'tomada', 'p2',
      { history: [{ at: ago(18), who: 'Valentina', text: 'Tomó la consulta.' }], notes: [{ at: ago(17), who: 'Valentina', text: 'Se llamará mañana a las 10:00 (nota de ejemplo).' }] }),
    mk('C-1036', 26, 'Distribuidora Sur Ltda.', 'admin@example.com', '+56 2 4444 5555', 'empresas', 'formulario', 'espera', 'p3',
      { history: [{ at: ago(24), who: 'Tomás', text: 'Tomó la consulta.' }, { at: ago(10), who: 'Tomás', text: 'Cambió el estado a «Esperando respuesta».' }] }),
    mk('C-1035', 70, 'Felipe Contreras', 'felipe.c@example.com', '+56 9 6666 7777', 'civil', 'whatsapp', 'tomada', 'p1',
      { history: [{ at: ago(68), who: 'Andrés', text: 'Tomó la consulta.' }] }),
    mk('C-1034', 96, 'Sofía Alvarado', 'sofia.a@example.com', '', 'civil', 'formulario', 'cerrada', 'p1',
      { history: [{ at: ago(94), who: 'Andrés', text: 'Tomó la consulta.' }, { at: ago(60), who: 'Andrés', text: 'Cerró la consulta.' }] }),
    mk('C-1033', 120, 'Inversiones Ejemplo S.A.', 'info@example.com', '+56 2 8888 9999', 'empresas', 'formulario', 'cerrada', 'p3',
      { history: [{ at: ago(118), who: 'Tomás', text: 'Tomó la consulta.' }, { at: ago(90), who: 'Tomás', text: 'Cerró la consulta.' }] })
  ];
  const content = [
    { key: 'hero.title', label: 'Portada · titular', es: 'Decisiones claras. Asesoría cercana.', en: 'Clear decisions. Close counsel.', status: 'publicado' },
    { key: 'hero.desc', label: 'Portada · descripción', es: 'Un equipo que escucha, comprende y acompaña cada paso de su consulta legal.', en: 'A team that listens, understands and supports every step of your legal enquiry.', status: 'publicado' },
    { key: 'p1.role', label: 'Socio 01 · especialidad', es: 'Derecho civil', en: 'Civil law', status: 'publicado' },
    { key: 'faq.a2', label: 'FAQ · costo de la primera consulta', es: 'Primera conversación de 30 minutos sin costo (ficticio).', en: 'First 30-minute conversation at no cost (fictitious).', status: 'borrador' }
  ];
  return { partners, consultations, content, now };
})();
