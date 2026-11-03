'use strict';
/* Prototipo del panel NEXO. JavaScript nativo; datos ficticios en memoria.
   No usa fetch, cookies, localStorage ni Firebase. */
(() => {
  const H = 3600 * 1000;
  const RAW = JSON.stringify(ADMIN_DATA);
  let db, actor, sla = 24, view = 'inbox', log = [], seq = 1043;
  const AREAS = { civil: 'Derecho civil', laboral: 'Derecho laboral', empresas: 'Asesoría a empresas', orientacion: 'Necesita orientación' };
  const STATUS = { nueva: 'Nueva', tomada: 'Tomada', espera: 'Esperando respuesta', cerrada: 'Cerrada' };
  const CHANNELS = { formulario: 'Formulario web', whatsapp: 'WhatsApp', telefono: 'Teléfono', presencial: 'Presencial', otro: 'Otro canal' };
  const SHARED = 'consultas@nexo-demo.example';

  const put = (el, ...nodes) => el.replaceChildren(...nodes.filter(Boolean));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v === false || v == null) return;
      if (k === 'class') e.className = v; else if (k === 'style') e.style.cssText = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
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
      h('td', { 'data-label': 'Recibida' }, ago(c.createdAt), c.channel !== 'formulario' ? h('span', { class: 'chip' }, CHANNELS[c.channel] || c.channel) : null),
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
  function renderOwnerFilter() {
    const sel = $('#f-owner'), cur = sel.value;
    sel.replaceChildren(h('option', { value: '' }, 'Todos'), h('option', { value: 'none' }, 'Sin asignar'), ...db.partners.map((p) => h('option', { value: p.id }, p.short)));
    sel.value = cur;
  }
  function renderAll() { renderDashboard(); renderTiles(); renderRows(); renderTeam(); renderLog(); if ($('#detail').open && openId) renderDetail(openId); }

  /* ---------- Detalle ---------- */
  let openId = null, opener = null;
  function openDetail(id, from) { openId = id; opener = from; activeTab = 'resumen'; sizeDetail(false); renderDetail(id); $('#detail').showModal(); $('#detail-title').focus(); }
  function closeDetail() { $('#detail').close(); }
  function copyText(text, what) {
    const done = () => toast(what + ' copiado.');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => toast('No se pudo copiar. Selecciona el texto y cópialo a mano.', true));
    else toast('No se pudo copiar. Selecciona el texto y cópialo a mano.', true);
  }
  const fullDate = (ts) => new Date(ts).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
  const hoursLabel = (ms) => { const m = Math.round(Math.abs(ms) / 60000); return m < 60 ? m + ' min' : m < 2880 ? Math.round(m / 60) + ' h' : Math.round(m / 1440) + ' d'; };
  function slaLine(c) {
    if (c.status === 'nueva' && !c.owner) {
      const left = sla * H - age(c.createdAt);
      return left >= 0 ? h('p', { class: 'sla sla-ok' }, 'Plazo para tomarla: quedan ' + hoursLabel(left) + ' (de ' + sla + ' h).') : h('p', { class: 'sla sla-late' }, 'Plazo vencido hace ' + hoursLabel(left) + '. Conviene tomarla hoy.');
    }
    const t = tookAt(c);
    if (t) { const w = t - c.createdAt, okSla = w <= sla * H; return h('p', { class: 'sla ' + (okSla ? 'sla-ok' : 'sla-late') }, 'Se tomó ' + hoursLabel(w) + ' después de recibirla (' + (okSla ? 'dentro' : 'fuera') + ' del plazo de ' + sla + ' h).'); }
    return null;
  }
  let activeTab = 'resumen';
  const TABS = [['resumen', 'Resumen'], ['notas', 'Notas'], ['historial', 'Historial'], ['reasignar', 'Reasignar']];
  function sizeDetail(tall) { $('#detail').classList.toggle('detail-tall', !!tall); }
  function renderDetail(id) {
    const c = find(id), body = $('#detail-body');
    const lockedBy = c.owner && c.owner !== actor ? partner(c.owner) : null, mine = c.owner === actor, own = c.owner ? partner(c.owner) : null;
    const list = filtered().map((x) => x.id), idx = list.indexOf(id);
    const seg = (st, label) => h('button', { type: 'button', class: 'seg' + (c.status === st ? ' seg-on' : ''), 'aria-pressed': String(c.status === st), onclick: () => setStatus(c.id, st) }, label);
    const contact = (label, value, what) => h('div', { class: 'contact-row' }, h('span', { class: 'c-l' }, label), h('span', { class: 'c-v' }, value || 'No indicado'),
      value ? h('button', { class: 'btn btn-secondary btn-sm', type: 'button', 'aria-label': 'Copiar ' + what + ' de ' + c.name, onclick: () => copyText(value, what[0].toUpperCase() + what.slice(1)) }, 'Copiar') : null);

    const panels = {
      resumen: [slaLine(c),
        h('div', { class: 'contact' }, contact('Correo', c.email, 'correo'), contact('Teléfono', c.phone, 'teléfono'), c.summary ? h('div', { class: 'contact-row' }, h('span', { class: 'c-l' }, 'Resumen'), h('span', { class: 'c-v' }, c.summary)) : null),
        lockedBy ? h('p', { class: 'lock', role: 'status' }, 'La tomó ' + lockedBy.name + '. Puedes reasignarla en la pestaña «Reasignar».') : null,
        !c.owner && c.status !== 'cerrada' ? h('div', { class: 'primary-action' }, h('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: () => take(c.id) }, 'Tomar esta consulta'), h('p', { class: 'fine' }, 'Quedará a tu nombre y los otros socios la verán como tomada.')) : null,
        c.owner && c.status !== 'cerrada' ? h('div', { class: 'block' }, h('p', { class: 'mini-h' }, 'Estado'), h('div', { class: 'segs', role: 'group', 'aria-label': 'Estado de la consulta' }, seg('tomada', 'En curso'), seg('espera', 'Esperando respuesta'), seg('cerrada', 'Cerrar consulta'))) : null,
        c.status === 'cerrada' ? h('div', { class: 'block' }, h('p', { class: 'muted' }, 'Consulta cerrada.'), h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => setStatus(c.id, 'tomada') }, 'Reabrir consulta')) : null],
      notas: [h('label', { for: 'd-note', class: 'mini-h' }, 'Nueva nota interna'), h('textarea', { id: 'd-note', rows: 2, maxlength: 400, placeholder: 'Escribe una nota para el equipo' }),
        h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => addNote(c.id, $('#d-note').value) }, 'Agregar nota'),
        c.notes.length ? h('ul', { class: 'notes' }, ...c.notes.slice().reverse().slice(0, 4).map((n) => h('li', {}, h('strong', {}, n.who), ' · ' + ago(n.at), h('span', { class: 'sub' }, n.text)))) : h('p', { class: 'muted' }, 'Aún no hay notas.'),
        c.notes.length > 4 ? h('p', { class: 'fine' }, 'Se muestran las 4 más recientes de ' + c.notes.length + '.') : null],
      historial: [h('ol', { class: 'history' }, ...c.history.slice().reverse().slice(0, 6).map((x) => h('li', {}, h('strong', {}, x.who), ' · ' + ago(x.at), h('span', { class: 'sub' }, x.text)))),
        c.history.length > 6 ? h('p', { class: 'fine' }, 'Se muestran los 6 movimientos más recientes de ' + c.history.length + '.') : null],
      reasignar: c.status === 'cerrada' ? [h('p', { class: 'muted' }, 'Una consulta cerrada no se reasigna. Reábrela primero desde «Resumen».')] : [
        h('label', { for: 'd-to', class: 'mini-h' }, 'Reasignar a'), h('select', { id: 'd-to' }, ...db.partners.filter((p) => p.id !== c.owner).map((p) => h('option', { value: p.id }, p.name))),
        h('label', { for: 'd-reason', class: 'mini-h' }, 'Motivo (obligatorio)'), h('input', { id: 'd-reason', maxlength: 120, placeholder: 'Por qué se reasigna' }),
        h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => { reassign(c.id, $('#d-to').value, $('#d-reason').value); } }, 'Reasignar')]
    };
    const tabs = h('div', { class: 'tabs-d', role: 'tablist', 'aria-label': 'Secciones de la consulta' }, ...TABS.map(([k, label]) => h('button', {
      type: 'button', role: 'tab', id: 'tab-' + k, 'aria-selected': String(activeTab === k), 'aria-controls': 'panel-d', tabindex: activeTab === k ? '0' : '-1', class: 'tab-d' + (activeTab === k ? ' tab-d-on' : ''),
      onclick: () => { activeTab = k; renderDetail(id); $('#tab-' + k).focus(); },
      onkeydown: (e) => { const n = TABS.findIndex(([x]) => x === activeTab); let m = null; if (e.key === 'ArrowRight') m = (n + 1) % TABS.length; else if (e.key === 'ArrowLeft') m = (n + TABS.length - 1) % TABS.length; if (m !== null) { e.preventDefault(); activeTab = TABS[m][0]; renderDetail(id); $('#tab-' + activeTab).focus(); } } }, label)));
    const navBar = h('div', { class: 'detail-nav' }, h('button', { class: 'btn btn-ghost', type: 'button', disabled: idx <= 0, onclick: () => gotoDetail(list[idx - 1]) }, '← Anterior'),
      h('span', { class: 'muted' }, idx >= 0 ? (idx + 1) + ' de ' + list.length : ''),
      h('button', { class: 'btn btn-ghost', type: 'button', disabled: idx < 0 || idx >= list.length - 1, onclick: () => gotoDetail(list[idx + 1]) }, 'Siguiente →'));
    put(body,
      h('button', { class: 'close', type: 'button', 'aria-label': 'Cerrar ventana', onclick: closeDetail }, '✕'),
      h('p', { class: 'eyebrow' }, c.id + ' · ' + AREAS[c.area]),
      h('h2', { id: 'detail-title', tabindex: '-1' }, c.name),
      h('div', { class: 'meta' }, pill(c),
        own ? h('span', { class: 'owner-chip' }, h('img', { src: own.photo, alt: '', width: 24, height: 24 }), mine ? 'Tú (' + own.short + ')' : own.short) : h('span', { class: 'muted' }, 'Sin responsable'),
        h('span', { class: 'muted' }, CHANNELS[c.channel] + (c.manual ? ' · registrada a mano' : '') + ' · ' + fullDate(c.createdAt))),
      tabs,
      h('div', { class: 'detail-scroll', id: 'panel-d', role: 'tabpanel', 'aria-labelledby': 'tab-' + activeTab }, ...panels[activeTab].filter(Boolean)),
      navBar);
  }
  function gotoDetail(id) { if (!id) return; openId = id; renderDetail(id); $('#detail-title').focus(); const sc = $('#detail .detail-scroll'); if (sc) sc.scrollTop = 0; }

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
    toast('Consulta reasignada a ' + pname(to) + '.'); activeTab = 'resumen'; renderAll();
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


  /* ---------- Registro manual (opción A) ---------- */
  function openRegister(from) {
    opener = from; openId = null; sizeDetail(true);
    const f = h('form', { id: 'reg-form', novalidate: true });
    const err = h('p', { class: 'error', role: 'alert', hidden: true });
    const sel = (id, opts) => h('select', { id }, ...opts.map(([v, t]) => h('option', { value: v }, t)));
    f.append(
      h('label', { for: 'r-name' }, 'Nombre de la persona'), h('input', { id: 'r-name', maxlength: 100, autocomplete: 'off' }),
      h('label', { for: 'r-email' }, 'Correo (opcional si hay teléfono)'), h('input', { id: 'r-email', type: 'email', maxlength: 180, autocomplete: 'off' }),
      h('label', { for: 'r-phone' }, 'Teléfono o WhatsApp (opcional si hay correo)'), h('input', { id: 'r-phone', type: 'tel', inputmode: 'tel', maxlength: 20, pattern: '[0-9+()\\-\\s]{7,20}', autocomplete: 'off' }),
      h('label', { for: 'r-channel' }, 'Por dónde llegó'), sel('r-channel', [['whatsapp', 'WhatsApp'], ['telefono', 'Teléfono'], ['presencial', 'Presencial'], ['otro', 'Otro canal']]),
      h('label', { for: 'r-area' }, 'Área de interés'), sel('r-area', Object.entries(AREAS)),
      h('label', { for: 'r-summary' }, 'Resumen breve (opcional)'), h('textarea', { id: 'r-summary', rows: 3, maxlength: 300 }),
      h('p', { class: 'fine' }, 'No registres antecedentes sensibles ni datos del caso: solo lo necesario para contactar a la persona.'),
      h('label', { class: 'check', for: 'r-take' }, h('input', { id: 'r-take', type: 'checkbox', checked: true }), ' Tomarla yo ahora (' + pname(actor) + ')'),
      err,
      h('div', { class: 'row-btns' }, h('button', { class: 'btn btn-primary', type: 'submit' }, 'Registrar consulta'), h('button', { class: 'btn btn-secondary', type: 'button', onclick: closeDetail }, 'Cancelar')));
    put($('#detail-body'), h('button', { class: 'close', type: 'button', 'aria-label': 'Cerrar ventana', onclick: closeDetail }, '✕'),
      h('p', { class: 'eyebrow' }, 'REGISTRO MANUAL'), h('h2', { id: 'detail-title', tabindex: '-1' }, 'Registrar consulta'),
      h('p', { class: 'muted' }, 'Para consultas que llegan por WhatsApp, teléfono o en persona y que el sistema no recibe solo.'), f);
    f.addEventListener('input', () => { err.hidden = true; });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#r-name').value.trim(), email = $('#r-email').value.trim(), phone = $('#r-phone').value.trim();
      const fail = (m, el) => { err.textContent = m; err.hidden = false; el.focus(); };
      if (!name) return fail('Escribe el nombre de la persona.', $('#r-name'));
      if (!email && !phone) return fail('Indica un correo o un teléfono para poder contactarla.', $('#r-phone'));
      if (email && !$('#r-email').checkValidity()) return fail('El correo no tiene un formato válido.', $('#r-email'));
      if (phone && !$('#r-phone').checkValidity()) return fail('Usa solo números, espacios, +, paréntesis o guiones en el teléfono.', $('#r-phone'));
      const ch = $('#r-channel').value, take = $('#r-take').checked;
      const c = { id: 'C-' + seq++, createdAt: Date.now(), name, email, phone, area: $('#r-area').value, channel: ch, manual: true, summary: $('#r-summary').value.trim(),
        status: take ? 'tomada' : 'nueva', owner: take ? actor : null, notes: [],
        history: [{ at: Date.now(), who: pname(actor), text: 'Registró la consulta a mano (canal: ' + CHANNELS[ch] + ').' }] };
      if (take) c.history.push({ at: Date.now(), who: pname(actor), text: 'Tomó la consulta.' });
      db.consultations.unshift(c);
      notify('Consulta ' + c.id + ' registrada a mano (' + CHANNELS[ch] + ')', allRecipients());
      opener = null; closeDetail(); toast('Consulta ' + c.id + ' registrada' + (take ? ' y tomada por ti.' : ' y dejada sin tomar.')); renderAll(); show('inbox'); $('#rows tr button') && $('#rows tr button').focus();
    });
    $('#detail').showModal(); $('#detail-title').focus();
  }

  /* ---------- Dashboard ---------- */
  const COL = window.AdminCharts.COLORS;
  function legend(id, items, total) {
    put($(id), ...items.map((it) => h('li', {}, h('span', { class: 'sw', style: 'background:' + it.color, 'aria-hidden': 'true' }), h('span', { class: 'lg-l' }, it.label), h('strong', {}, String(it.value)), total ? h('span', { class: 'lg-p' }, Math.round((it.value / total) * 100) + ' %') : null)));
  }
  function tookAt(c) { const e = c.history.find((x) => /^Tomó la consulta/.test(x.text)); return e ? e.at : null; }
  function renderDashboard() {
    const all = db.consultations, n = all.length;
    const took = all.map((c) => ({ c, t: tookAt(c) })).filter((x) => x.t);
    const waits = took.map((x) => (x.t - x.c.createdAt) / H);
    const avg = waits.length ? waits.reduce((a, b) => a + b, 0) / waits.length : 0;
    const inSla = waits.length ? Math.round((waits.filter((w) => w <= sla).length / waits.length) * 100) : 0;
    const closed = all.filter((c) => c.status === 'cerrada').length;
    const kpis = [['Recibidas', String(n)], ['Cerradas', String(closed) + (n ? ' (' + Math.round((closed / n) * 100) + ' %)' : '')], ['Tiempo medio hasta tomar', avg.toFixed(1).replace('.', ',') + ' h'], ['Tomadas dentro del plazo (' + sla + ' h)', inSla + ' %'], ['Vencidas hoy', String(all.filter(overdue).length)]];
    put($('#dash-kpis'), ...kpis.map(([l, v], i) => h('li', { class: 'tile' + (i === 4 && v !== '0' ? ' tile-late' : '') }, h('span', { class: 'tile-n' }, v), h('span', { class: 'tile-l' }, l))));

    const load = db.partners.map((p) => ({ open: all.filter((c) => c.owner === p.id && c.status !== 'cerrada').length, done: all.filter((c) => c.owner === p.id && c.status === 'cerrada').length }));
    const ls = [{ name: 'En curso', color: COL[1], values: load.map((x) => x.open) }, { name: 'Cerradas', color: COL[0], values: load.map((x) => x.done) }];
    put($('#ch-load'), window.AdminCharts.bars({ labels: db.partners.map((p) => p.short), series: ls, label: 'Barras apiladas por socio: ' + db.partners.map((p, i) => p.short + ' ' + load[i].open + ' en curso y ' + load[i].done + ' cerradas').join('; ') }));
    legend('#lg-load', ls.map((s) => ({ label: s.name, value: s.values.reduce((a, b) => a + b, 0), color: s.color })));

    const days = [], day0 = new Date(); day0.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) { const d = new Date(day0); d.setDate(d.getDate() - i); days.push({ d, n: 0 }); }
    all.forEach((c) => { const x = days.find((q) => c.createdAt >= q.d.getTime() && c.createdAt < q.d.getTime() + 86400000); if (x) x.n++; });
    put($('#ch-days'), window.AdminCharts.bars({ labels: days.map((x) => x.d.toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', '')), series: [{ name: 'Recibidas', color: COL[1], values: days.map((x) => x.n) }], label: 'Barras de consultas recibidas por día en los últimos 7 días: ' + days.map((x) => x.n).join(', ') }));
    legend('#lg-days', [{ label: 'Recibidas en 7 días', value: days.reduce((a, x) => a + x.n, 0), color: COL[1] }]);

    const pie = (id, lg, entries, name) => {
      const items = entries.map(([label, value], i) => ({ label, value, color: COL[i % COL.length] })), total = items.reduce((a, x) => a + x.value, 0);
      put($(id), window.AdminCharts.donut({ items, label: 'Gráfico de pastel ' + name + ': ' + items.filter((x) => x.value).map((x) => x.label + ' ' + x.value).join(', ') }));
      legend(lg, items, total);
    };
    pie('#ch-area', '#lg-area', Object.entries(AREAS).map(([k, v]) => [v, all.filter((c) => c.area === k).length]), 'por área');
    pie('#ch-status', '#lg-status', [['Sin tomar', all.filter((c) => c.status === 'nueva').length], ['Tomadas', all.filter((c) => c.status === 'tomada').length], ['Esperando respuesta', all.filter((c) => c.status === 'espera').length], ['Cerradas', closed]], 'por estado');
    pie('#ch-channel', '#lg-channel', Object.entries(CHANNELS).map(([k, v]) => [v, all.filter((c) => c.channel === k).length]), 'por canal');
  }

  /* ---------- Exportar a Excel ---------- */
  function exportSheets() {
    const list = filtered();
    const consultasSheet = { name: 'Consultas', headers: ['N.º', 'Recibida', 'Nombre', 'Correo', 'Teléfono', 'Área', 'Canal', 'Estado', 'Responsable', 'Vencida sin tomar', 'Registrada a mano', 'Resumen'],
      widths: [10, 18, 28, 30, 18, 22, 16, 22, 16, 16, 16, 40],
      rows: list.map((c) => [c.id, { date: c.createdAt }, c.name, c.email, c.phone || '', AREAS[c.area], CHANNELS[c.channel] || c.channel, STATUS[c.status], pname(c.owner), overdue(c) ? 'Sí' : 'No', c.manual ? 'Sí' : 'No', c.summary || '']) };
    const resumen = { name: 'Resumen por socio', headers: ['Socio', 'En curso', 'Cerradas', 'Total'], widths: [26, 12, 12, 12],
      rows: db.partners.map((p) => { const mine = list.filter((c) => c.owner === p.id); const open = mine.filter((c) => c.status !== 'cerrada').length; return [p.name, open, mine.length - open, mine.length]; }).concat([['Sin asignar', 0, 0, list.filter((c) => !c.owner).length]]) };
    return { list, sheets: [consultasSheet, resumen] };
  }
  function exportXlsx() {
    const { list, sheets } = exportSheets();
    if (!list.length) { toast('No hay consultas para exportar con estos filtros.', true); return; }
    const d = new Date(), p = (x) => String(x).padStart(2, '0'), name = 'consultas-nexo-' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '.xlsx';
    const url = URL.createObjectURL(window.AdminExport.toXlsx(sheets));
    const a = h('a', { href: url, download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('Exportadas ' + list.length + ' consultas a ' + name + '. Si no se descarga (por ejemplo, en la vista previa), usa «Copiar para Excel».');
  }
  function copyForExcel(from) {
    const { list, sheets } = exportSheets();
    if (!list.length) { toast('No hay consultas para copiar con estos filtros.', true); return; }
    const tsv = window.AdminExport.toTSV(sheets[0]);
    const manual = () => {
      opener = from; openId = null; sizeDetail(true);
      const ta = h('textarea', { id: 'tsv', rows: 8, readonly: true, 'aria-label': 'Tabla para copiar' }); ta.value = tsv;
      put($('#detail-body'), h('button', { class: 'close', type: 'button', 'aria-label': 'Cerrar ventana', onclick: closeDetail }, '✕'), h('p', { class: 'eyebrow' }, 'COPIAR PARA EXCEL'), h('h2', { id: 'detail-title', tabindex: '-1' }, 'Copia la tabla'),
        h('p', { class: 'muted' }, 'Selecciona todo, copia (Ctrl+C o Cmd+C) y pega en la celda A1 de una hoja de Excel.'), ta);
      $('#detail').showModal(); ta.focus(); ta.select();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(tsv).then(() => toast(list.length + ' consultas copiadas. Pégalas en la celda A1 de Excel.'), manual); else manual();
  }

  /* ---------- Navegación y arranque ---------- */
  function show(v) {
    view = v; $$('.view').forEach((s) => { s.hidden = s.id !== 'view-' + v; });
    $$('.tabs button').forEach((b) => { if (b.dataset.view === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    if (v === 'content') window.AdminEditor.render();
    $('#main').focus({ preventScroll: true });
  }
  function init() {
    db = JSON.parse(RAW); log = []; seq = 1043; sla = 24; $('#s-sla').value = 24;
    window.AdminEditor.reset(); renderOwnerFilter(); renderAll(); if (view === 'content') window.AdminEditor.render();
  }
  function fillActors() {
    const opts = () => db.partners.map((p) => h('option', { value: p.id }, p.name));
    $('#login-partner').replaceChildren(...opts()); $('#actor').replaceChildren(...opts());
  }
  db = JSON.parse(RAW); fillActors();
  window.AdminEditor.setCtx({ toast, who: () => pname(actor), partnerPhoto: (i) => db.partners[i].photo });
  init();

  /* ---------- Acceso: demostración de controles ---------- */
  const SEC = Object.assign({ maxAttempts: 5, lockSeconds: 30, sessionMinutes: 15, warnSeconds: 60 }, (window.ADMIN_CONFIG || {}).security);
  let attempts = 0, lockTimer = null, idleTimer = null, warnTimer = null, tickTimer = null;
  const loginErr = $('#login-error'), loginMsg = $('#login-msg'), submit = $('#login-submit');
  function lockLogin() {
    let left = SEC.lockSeconds; submit.disabled = true;
    const show = () => { loginErr.textContent = 'Demasiados intentos. Por seguridad, espera ' + left + ' s para volver a intentarlo.'; loginErr.hidden = false; };
    show(); clearInterval(lockTimer);
    lockTimer = setInterval(() => { left--; if (left <= 0) { clearInterval(lockTimer); attempts = 0; submit.disabled = false; loginErr.hidden = true; loginMsg.textContent = 'Ya puedes intentarlo de nuevo.'; loginMsg.hidden = false; } else show(); }, 1000);
  }
  const avatar = $('#login-avatar'), sel = $('#login-partner'), passIn = $('#login-pass'), codeIn = $('#login-code');
  const setAvatar = () => { const p = partner(sel.value); if (p) avatar.src = p.photo; };
  sel.addEventListener('change', setAvatar); setAvatar();
  codeIn.addEventListener('input', () => { codeIn.value = codeIn.value.replace(/\D/g, '').slice(0, 6); codeIn.removeAttribute('aria-invalid'); });
  passIn.addEventListener('input', () => passIn.removeAttribute('aria-invalid'));
  const caps = (e) => { if (e.getModifierState) $('#caps-warn').hidden = !e.getModifierState('CapsLock'); };
  passIn.addEventListener('keydown', caps); passIn.addEventListener('keyup', caps); passIn.addEventListener('blur', () => { $('#caps-warn').hidden = true; });
  setTimeout(() => { if (!$('#login').hidden) passIn.focus({ preventScroll: true }); }, 0);
  $('#pass-toggle').addEventListener('click', (e) => { const i = $('#login-pass'), show = i.type === 'password'; i.type = show ? 'text' : 'password'; e.currentTarget.textContent = show ? 'Ocultar' : 'Mostrar'; e.currentTarget.setAttribute('aria-pressed', String(show)); e.currentTarget.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña'); });
  $('#login-form').addEventListener('submit', (e) => {
    e.preventDefault(); if (submit.disabled) return;
    loginMsg.hidden = true;
    const pass = $('#login-pass').value, code = $('#login-code').value.trim();
    passIn.removeAttribute('aria-invalid'); codeIn.removeAttribute('aria-invalid');
    const fmtErr = (m, el) => { loginErr.textContent = m; loginErr.hidden = false; el.setAttribute('aria-invalid', 'true'); el.focus(); };
    if (pass.length < 8) return fmtErr('Escribe tu contraseña (mínimo 8 caracteres).', passIn);
    if (!/^\d{6}$/.test(code)) return fmtErr('El código tiene 6 dígitos. Revisa tu aplicación autenticadora.', codeIn);
    const valid = code !== '000000';
    if (!valid) {
      attempts++;
      $('#login-code').value = '';
      if (attempts >= SEC.maxAttempts) { $('#login-pass').value = ''; lockLogin(); return; }
      loginErr.textContent = 'No pudimos verificar tus datos. Revisa la contraseña y el código, y vuelve a intentarlo. Te quedan ' + (SEC.maxAttempts - attempts) + (SEC.maxAttempts - attempts === 1 ? ' intento.' : ' intentos.'); loginErr.hidden = false; codeIn.setAttribute('aria-invalid', 'true'); codeIn.focus(); return;
    }
    attempts = 0; loginErr.hidden = true; actor = $('#login-partner').value; $('#actor').value = actor;
    $('#login-pass').value = ''; $('#login-code').value = ''; $('#login-pass').type = 'password'; $('#pass-toggle').textContent = 'Mostrar'; $('#pass-toggle').setAttribute('aria-pressed', 'false');
    $('#login').hidden = true; $('#app').hidden = false; renderAll(); show('inbox'); $('#main').focus(); startSession();
  });
  /* Cierre de sesión (manual o por inactividad): se vacía la información de la pantalla. */
  function endSession(reason) {
    clearTimeout(idleTimer); clearTimeout(warnTimer); clearInterval(tickTimer);
    if ($('#session-dialog').open) $('#session-dialog').close();
    if ($('#detail').open) $('#detail').close();
    ['#rows', '#tiles', '#team-grid', '#log', '#editor-root', '#dash-kpis', '#ch-load', '#ch-days', '#ch-area', '#ch-status', '#ch-channel'].forEach((s) => $(s).replaceChildren());
    $('#app').hidden = true; $('#login').hidden = false;
    loginMsg.textContent = reason || 'Cerraste sesión.'; loginMsg.hidden = false; $('#login-pass').focus();
  }
  function startSession() {
    const reset = () => {
      if ($('#session-dialog').open) return;
      clearTimeout(idleTimer); clearTimeout(warnTimer);
      warnTimer = setTimeout(warn, Math.max(1, SEC.sessionMinutes * 60 - SEC.warnSeconds) * 1000);
    };
    startSession.reset = reset; reset();
  }
  function warn() {
    let left = SEC.warnSeconds; const text = $('#session-text'), dlg2 = $('#session-dialog');
    const paint = () => { text.textContent = 'Por seguridad, tu sesión se cerrará por inactividad en ' + left + ' s.'; };
    paint(); if ($('#detail').open) $('#detail').close(); dlg2.showModal(); $('#session-keep').focus();
    clearInterval(tickTimer); tickTimer = setInterval(() => { left--; if (left <= 0) { clearInterval(tickTimer); endSession('Tu sesión se cerró por inactividad.'); } else paint(); }, 1000);
  }
  $('#session-keep').addEventListener('click', () => { clearInterval(tickTimer); $('#session-dialog').close(); startSession.reset(); toast('Sesión mantenida.'); });
  $('#session-out').addEventListener('click', () => endSession('Cerraste sesión.'));
  $('#session-dialog').addEventListener('cancel', (e) => e.preventDefault());
  ['click', 'keydown', 'pointerdown', 'touchstart'].forEach((ev) => document.addEventListener(ev, () => { if (!$('#app').hidden && startSession.reset) startSession.reset(); }, { passive: true }));
  $('#logout').addEventListener('click', () => endSession('Cerraste sesión.'));
  $('#actor').addEventListener('change', (e) => { actor = e.target.value; toast('Ahora actúas como ' + partner(actor).name + '.'); renderAll(); });
  $$('.tabs button').forEach((b) => b.addEventListener('click', () => show(b.dataset.view)));
  $('#filters').addEventListener('input', renderRows); $('#filters').addEventListener('submit', (e) => e.preventDefault());
  $('#export-xlsx').addEventListener('click', exportXlsx); $('#copy-xlsx').addEventListener('click', (e) => copyForExcel(e.currentTarget)); $('#register').addEventListener('click', (e) => openRegister(e.currentTarget)); $('#sim-new').addEventListener('click', simNew); $('#sim-other').addEventListener('click', simOther);
  $('#reset').addEventListener('click', () => { init(); closeDetail(); toast('Datos de ejemplo restablecidos.'); });
  $('#send-reminders').addEventListener('click', sendReminders);
  $('#settings-form').addEventListener('submit', (e) => {
    e.preventDefault(); const v = parseInt($('#s-sla').value, 10), m = $('#settings-msg');
    if (!(v >= 1 && v <= 168)) { m.textContent = 'Usa un plazo entre 1 y 168 horas.'; m.hidden = false; return; }
    sla = v; m.textContent = 'Plazo aplicado: ' + sla + ' h (solo en esta sesión de prueba).'; m.hidden = false; renderAll();
  });
  $('#copy-xlsx').hidden = !(window.ADMIN_CONFIG && window.ADMIN_CONFIG.showCopyFallback);
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
