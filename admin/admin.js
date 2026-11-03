'use strict';
/* Prototipo del panel NEXO. JavaScript nativo; datos ficticios en memoria.
   No usa fetch, cookies, localStorage ni Firebase. */
(() => {
  const H = 3600 * 1000;
  const RAW = JSON.stringify(ADMIN_DATA);
  let db, actor, sla = 24, view = 'inbox', log = [], seq = 1043;
  const AREAS = { civil: 'Derecho civil', laboral: 'Derecho laboral', empresas: 'Asesoría a empresas', orientacion: 'Necesita orientación' };
  const STATUS = { nueva: 'Nueva', tomada: 'Tomada', espera: 'Esperando respuesta', cerrada: 'Cerrada' };
  const SHARED = 'consultas@nexo-demo.example';

  const put = (el, ...nodes) => el.replaceChildren(...nodes.filter(Boolean));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v === false || v == null) return;
      if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    });
    kids.flat().forEach((c) => { if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); });
    return e;
  }
  const partner = (id) => db.partners.find((p) => p.id === id);
  const pname = (id) => (id ? partner(id).short : 'Sin asignar');
  const age = (ts) => Date.now() - ts;
  const ago = (ts) => { const hrs = Math.floor(age(ts) / H); if (hrs < 1) return 'hace minutos'; if (hrs < 48) return 'hace ' + hrs + ' h'; return 'hace ' + Math.floor(hrs / 24) + ' d'; };
  const overdue = (c) => c.status === 'nueva' && !c.owner && age(c.createdAt) > sla * H;
  const find = (id) => db.consultations.find((c) => c.id === id);
  const hist = (c, text, who) => c.history.push({ at: Date.now(), who: who || pname(actor), text });

  function toast(msg, isError) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false; t.className = 'toast' + (isError ? ' toast-error' : '');
    clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 4500);
  }
  function pill(c) {
    if (overdue(c)) return h('span', { class: 'pill pill-late' }, 'Vencida · sin tomar');
    return h('span', { class: 'pill pill-' + c.status }, STATUS[c.status]);
  }
  function notify(subject, recipients) { log.push({ at: Date.now(), subject, to: recipients }); }
  const allRecipients = () => [SHARED].concat(db.partners.map((p) => p.short.toLowerCase() + '@nexo-demo.example'));

  /* ---------- Render ---------- */
  function renderTiles() {
    const open = db.consultations.filter((c) => c.status !== 'cerrada');
    const tiles = [
      ['Sin tomar', db.consultations.filter((c) => c.status === 'nueva' && !c.owner).length, ''],
      ['Vencidas (+' + sla + ' h)', db.consultations.filter(overdue).length, 'late'],
      ['En curso', open.filter((c) => c.owner).length, ''],
      ['Cerradas', db.consultations.filter((c) => c.status === 'cerrada').length, '']
    ];
    $('#tiles').replaceChildren(...tiles.map(([l, n, k]) => h('li', { class: 'tile ' + (k && n ? 'tile-' + k : '') }, h('span', { class: 'tile-n' }, String(n)), h('span', { class: 'tile-l' }, l))));
  }
  function filtered() {
    const q = $('#f-q').value.trim().toLowerCase(), st = $('#f-status').value, ar = $('#f-area').value, ow = $('#f-owner').value;
    return db.consultations.filter((c) => {
      if (q && !(c.name + ' ' + c.email + ' ' + c.id + ' ' + c.phone).toLowerCase().includes(q)) return false;
      if (st === 'vencida' ? !overdue(c) : st && c.status !== st) return false;
      if (ar && c.area !== ar) return false;
      if (ow === 'none' ? c.owner : ow && c.owner !== ow) return false;
      return true;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }
  function renderRows() {
    const list = filtered();
    $('#rows').replaceChildren(...list.map((c) => h('tr', { class: overdue(c) ? 'row-late' : '' },
      h('td', { 'data-label': 'N.º' }, c.id),
      h('td', { 'data-label': 'Recibida' }, ago(c.createdAt), c.channel === 'whatsapp' ? h('span', { class: 'chip' }, 'WhatsApp') : null),
      h('td', { 'data-label': 'Persona' }, h('div', { class: 'cell-person' }, h('strong', {}, c.name), h('span', { class: 'sub' }, c.email))),
      h('td', { 'data-label': 'Área' }, AREAS[c.area]),
      h('td', { 'data-label': 'Estado' }, pill(c)),
      h('td', { 'data-label': 'Responsable' }, pname(c.owner)),
      h('td', { class: 'td-action' }, h('button', { class: 'btn btn-secondary', type: 'button', 'aria-label': 'Abrir consulta ' + c.id + ' de ' + c.name, onclick: (e) => openDetail(c.id, e.currentTarget) }, 'Abrir')))));
    $('#empty').hidden = list.length > 0;
    $('#table').hidden = list.length === 0;
    $('#count').textContent = list.length + (list.length === 1 ? ' consulta' : ' consultas');
  }
  function renderTeam() {
    $('#team-grid').replaceChildren(...db.partners.map((p) => {
      const mine = db.consultations.filter((c) => c.owner === p.id && c.status !== 'cerrada');
      const done = db.consultations.filter((c) => c.owner === p.id && c.status === 'cerrada').length;
      return h('article', { class: 'team-card' }, h('img', { src: p.photo, alt: '', width: 72, height: 72 }),
        h('h2', {}, p.name), h('p', { class: 'muted' }, 'Especialidad: ' + AREAS[p.area] + ' (ficticia)'),
        h('p', { class: 'big' }, String(mine.length), h('span', {}, ' en curso')), h('p', { class: 'muted' }, done + ' cerradas'),
        h('meter', { min: 0, max: 8, value: Math.min(mine.length, 8), 'aria-label': 'Carga de ' + p.short }, String(mine.length)));
    }));
    const n = db.consultations.filter((c) => !c.owner && c.status === 'nueva').length;
    $('#unassigned-text').textContent = n ? n + ' consultas esperan que un socio las tome. Se muestran en «Consultas» con el filtro «Todos».' : 'No hay consultas sin tomar.';
  }
  function renderLog() {
    $('#log').replaceChildren(...log.map((l) => h('li', {}, h('strong', {}, l.subject), h('span', { class: 'sub' }, 'Para: ' + l.to.join(', ')), h('span', { class: 'sub' }, new Date(l.at).toLocaleTimeString('es-CL')))));
    $('#log-empty').hidden = log.length > 0;
  }
  function renderContent() {
    $('#content-list').replaceChildren(...db.content.map((it) => h('li', {},
      h('div', {}, h('strong', {}, it.label), h('span', { class: 'sub' }, 'ES: ' + it.es), h('span', { class: 'sub' }, 'EN: ' + it.en)),
      h('span', { class: 'pill pill-' + (it.status === 'publicado' ? 'cerrada' : 'espera') }, it.status === 'publicado' ? 'Publicado' : 'Borrador'),
      h('button', { class: 'btn btn-secondary', type: 'button', 'aria-label': 'Editar ' + it.label, onclick: (e) => openEditor(it.key, e.currentTarget) }, 'Editar'))));
  }
  function renderOwnerFilter() {
    const sel = $('#f-owner'), cur = sel.value;
    sel.replaceChildren(h('option', { value: '' }, 'Todos'), h('option', { value: 'none' }, 'Sin asignar'), ...db.partners.map((p) => h('option', { value: p.id }, p.short)));
    sel.value = cur;
  }
  function renderAll() { renderTiles(); renderRows(); renderTeam(); renderLog(); renderContent(); if ($('#detail').open && openId) renderDetail(openId); }

  /* ---------- Detalle ---------- */
  let openId = null, opener = null;
  function openDetail(id, from) { openId = id; opener = from; renderDetail(id); $('#detail').showModal(); $('#detail-title').focus(); }
  function closeDetail() { $('#detail').close(); }
  function renderDetail(id) {
    const c = find(id), body = $('#detail-body');
    const lockedBy = c.owner && c.owner !== actor ? partner(c.owner) : null;
    const reassignSel = h('select', { id: 'd-to' }, ...db.partners.filter((p) => p.id !== c.owner).map((p) => h('option', { value: p.id }, p.name)));
    const reason = h('input', { id: 'd-reason', maxlength: 120, placeholder: 'Motivo (obligatorio)' });
    const noteIn = h('textarea', { id: 'd-note', rows: 3, maxlength: 400, placeholder: 'Nota interna' });
    const statusSel = h('select', { id: 'd-status' }, ...Object.entries(STATUS).filter(([k]) => k !== 'nueva').map(([k, v]) => h('option', { value: k, selected: c.status === k }, v)));
    put(body,
      h('button', { class: 'close', type: 'button', 'aria-label': 'Cerrar ventana', onclick: closeDetail }, '✕'),
      h('p', { class: 'eyebrow' }, c.id + ' · ' + AREAS[c.area]),
      h('h2', { id: 'detail-title', tabindex: '-1' }, c.name),
      h('p', {}, pill(c), ' ', h('span', { class: 'muted' }, 'Recibida ' + ago(c.createdAt) + ' por ' + (c.channel === 'whatsapp' ? 'WhatsApp' : 'formulario') + ' · Responsable: ' + pname(c.owner))),
      h('dl', { class: 'facts' }, h('dt', {}, 'Correo'), h('dd', {}, c.email), h('dt', {}, 'Teléfono'), h('dd', {}, c.phone || 'No indicado')),
      lockedBy ? h('p', { class: 'lock', role: 'status' }, 'Esta consulta la tomó ' + lockedBy.name + '. Puedes reasignarla indicando un motivo.') : null,
      !c.owner && c.status !== 'cerrada' ? h('button', { class: 'btn btn-primary', type: 'button', onclick: () => take(c.id) }, 'Tomar esta consulta') : null,
      c.owner && c.status !== 'cerrada' ? h('div', { class: 'block' }, h('label', { for: 'd-status' }, 'Estado'), statusSel,
        h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => setStatus(c.id, statusSel.value) }, 'Guardar estado')) : null,
      c.status !== 'cerrada' ? h('div', { class: 'block' }, h('label', { for: 'd-to' }, 'Reasignar a'), reassignSel, h('label', { for: 'd-reason' }, 'Motivo'), reason,
        h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => reassign(c.id, reassignSel.value, reason.value) }, 'Reasignar')) : null,
      h('div', { class: 'block' }, h('label', { for: 'd-note' }, 'Notas internas'), noteIn,
        h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => addNote(c.id, noteIn.value) }, 'Agregar nota'),
        h('ul', { class: 'notes' }, ...c.notes.map((n) => h('li', {}, h('strong', {}, n.who), ' · ' + ago(n.at), h('span', { class: 'sub' }, n.text))))),
      h('h3', {}, 'Historial'),
      h('ol', { class: 'history' }, ...c.history.slice().reverse().map((x) => h('li', {}, h('strong', {}, x.who), ' · ' + ago(x.at), h('span', { class: 'sub' }, x.text))))
    );
  }

  /* ---------- Acciones ---------- */
  function take(id) {
    const c = find(id);
    if (c.owner && c.owner !== actor) { toast('Ya la tomó ' + pname(c.owner) + '. No se puede tomar dos veces.', true); renderAll(); return; }
    c.owner = actor; c.status = 'tomada'; hist(c, 'Tomó la consulta.'); toast('Consulta ' + id + ' tomada.'); renderAll();
  }
  function setStatus(id, st) { const c = find(id); c.status = st; hist(c, 'Cambió el estado a «' + STATUS[st] + '».'); toast('Estado actualizado.'); renderAll(); }
  function reassign(id, to, reason) {
    if (reason.trim().length < 3) { toast('Indica un motivo para reasignar.', true); $('#d-reason').focus(); return; }
    const c = find(id); const prev = pname(c.owner); c.owner = to; if (c.status === 'nueva') c.status = 'tomada';
    hist(c, 'Reasignó de ' + prev + ' a ' + pname(to) + '. Motivo: ' + reason.trim()); notify('Consulta ' + id + ' reasignada a ' + pname(to), [SHARED, partner(to).short.toLowerCase() + '@nexo-demo.example']);
    toast('Consulta reasignada a ' + pname(to) + '.'); renderAll();
  }
  function addNote(id, text) {
    if (!text.trim()) { toast('Escribe la nota antes de agregarla.', true); $('#d-note').focus(); return; }
    const c = find(id); c.notes.push({ at: Date.now(), who: pname(actor), text: text.trim() }); hist(c, 'Agregó una nota interna.'); toast('Nota agregada.'); renderAll();
  }
  function simNew() {
    const names = ['Nicolás Rivas', 'Daniela Paredes', 'Comercial Andes SpA', 'Héctor Mella'], areas = Object.keys(AREAS);
    const n = names[seq % names.length], area = areas[seq % areas.length];
    const c = { id: 'C-' + seq++, createdAt: Date.now(), name: n, email: 'contacto' + seq + '@example.com', phone: '+56 9 0000 ' + String(1000 + seq), area, channel: 'formulario', status: 'nueva', owner: null, notes: [], history: [{ at: Date.now(), who: 'Sistema', text: 'Consulta recibida por formulario web.' }] };
    db.consultations.unshift(c); notify('Nueva consulta ' + c.id + ' · ' + AREAS[area], allRecipients()); toast('Llegó la consulta ' + c.id + '. Se avisó a la casilla compartida y a los tres socios.'); renderAll();
  }
  function simOther() {
    const c = db.consultations.find((x) => x.status === 'nueva' && !x.owner);
    if (!c) { toast('No hay consultas sin tomar para simular.', true); return; }
    const other = db.partners.find((p) => p.id !== actor); c.owner = other.id; c.status = 'tomada'; hist(c, 'Tomó la consulta.', other.short);
    toast(other.short + ' acaba de tomar ' + c.id + '. Si la tenías abierta, ahora aparece bloqueada.'); renderAll();
  }
  function sendReminders() {
    const late = db.consultations.filter(overdue);
    if (!late.length) { toast('No hay consultas vencidas.'); return; }
    late.forEach((c) => notify('Recordatorio: ' + c.id + ' lleva más de ' + sla + ' h sin tomar', allRecipients()));
    toast(late.length + ' recordatorio(s) registrados.'); renderAll();
  }

  /* ---------- Editor de contenido (maqueta Etapa 2) ---------- */
  function openEditor(key, from) {
    const it = db.content.find((x) => x.key === key); opener = from; openId = null;
    const es = h('textarea', { id: 'e-es', rows: 3 }), en = h('textarea', { id: 'e-en', rows: 3 }); es.value = it.es; en.value = it.en;
    $('#detail-body').replaceChildren(
      h('button', { class: 'close', type: 'button', 'aria-label': 'Cerrar ventana', onclick: closeDetail }, '✕'),
      h('p', { class: 'eyebrow' }, 'CONTENIDO · MAQUETA'), h('h2', { id: 'detail-title', tabindex: '-1' }, it.label),
      h('label', { for: 'e-es' }, 'Español'), es, h('label', { for: 'e-en' }, 'English'), en,
      h('p', { class: 'fine' }, 'En la versión real, publicar actualizará el sitio y se guardará el historial de versiones.'),
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => { it.es = es.value; it.en = en.value; it.status = 'borrador'; renderContent(); closeDetail(); toast('Borrador guardado.'); } }, 'Guardar borrador'),
        h('button', { class: 'btn btn-primary', type: 'button', onclick: () => { it.es = es.value; it.en = en.value; it.status = 'publicado'; renderContent(); closeDetail(); toast('Publicado (simulado). El sitio público no cambió.'); } }, 'Publicar')));
    $('#detail').showModal(); $('#detail-title').focus();
  }

  /* ---------- Navegación y arranque ---------- */
  function show(v) {
    view = v; $$('.view').forEach((s) => { s.hidden = s.id !== 'view-' + v; });
    $$('.tabs button').forEach((b) => { if (b.dataset.view === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    $('#main').focus({ preventScroll: true });
  }
  function init() {
    db = JSON.parse(RAW); log = []; seq = 1043; sla = 24; $('#s-sla').value = 24;
    renderOwnerFilter(); renderAll();
  }
  function fillActors() {
    const opts = () => db.partners.map((p) => h('option', { value: p.id }, p.name));
    $('#login-partner').replaceChildren(...opts()); $('#actor').replaceChildren(...opts());
  }
  db = JSON.parse(RAW); fillActors(); init();

  $('#login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = $('#login-code').value.trim(), err = $('#login-error');
    if (!/^\d{6}$/.test(code)) { err.textContent = 'Ingresa un código de 6 dígitos (en el prototipo sirve cualquiera).'; err.hidden = false; $('#login-code').focus(); return; }
    err.hidden = true; actor = $('#login-partner').value; $('#actor').value = actor; $('#login-code').value = '';
    $('#login').hidden = true; $('#app').hidden = false; show('inbox'); $('#main').focus();
  });
  $('#logout').addEventListener('click', () => { $('#app').hidden = true; $('#login').hidden = false; $('#login-code').focus(); });
  $('#actor').addEventListener('change', (e) => { actor = e.target.value; toast('Ahora actúas como ' + partner(actor).name + '.'); renderAll(); });
  $$('.tabs button').forEach((b) => b.addEventListener('click', () => show(b.dataset.view)));
  $('#filters').addEventListener('input', renderRows); $('#filters').addEventListener('submit', (e) => e.preventDefault());
  $('#sim-new').addEventListener('click', simNew); $('#sim-other').addEventListener('click', simOther);
  $('#reset').addEventListener('click', () => { init(); closeDetail(); toast('Datos de ejemplo restablecidos.'); });
  $('#send-reminders').addEventListener('click', sendReminders);
  $('#settings-form').addEventListener('submit', (e) => {
    e.preventDefault(); const v = parseInt($('#s-sla').value, 10), m = $('#settings-msg');
    if (!(v >= 1 && v <= 168)) { m.textContent = 'Usa un plazo entre 1 y 168 horas.'; m.hidden = false; return; }
    sla = v; m.textContent = 'Plazo aplicado: ' + sla + ' h (solo en esta sesión de prueba).'; m.hidden = false; renderAll();
  });
  const dlg = $('#detail');
  dlg.addEventListener('click', (e) => { const r = dlg.getBoundingClientRect(); if (e.target === dlg && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) closeDetail(); });
  dlg.addEventListener('close', () => {
    openId = null;
    let target = opener;
    if (opener && !document.contains(opener)) { const l = opener.getAttribute('aria-label'); target = l ? [...document.querySelectorAll('button[aria-label]')].find((b) => b.getAttribute('aria-label') === l) : null; }
    (target || $('#main')).focus();
  });
  setInterval(() => { if ($('#app').hidden === false) { renderTiles(); renderRows(); } }, 60000);
})();
