'use strict';
/* Prototipo del panel NEXO. JavaScript nativo; datos ficticios en memoria.
   No usa fetch, cookies, localStorage ni Firebase. */
(() => {
  const H = 3600 * 1000;
  const RAW = JSON.stringify(ADMIN_DATA);
  let db, actor, sla = 24, view = 'inbox', log = [], seq = 1043;
  const LIVE = window.NEXO_BACKEND === 'firebase', L = window.AdminLive;
  const EMPTY = () => ({ partners: [], consultations: [], content: [] });
  const newId = () => 'C-' + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).toUpperCase().replace(/[^0-9A-Z]/g, '').padEnd(4, '0').slice(0, 4);
  const ACCIONES = { 'sesion.inicio': 'Inició sesión', 'consulta.tomar': 'Tomó una consulta', 'consulta.deshacer_toma': 'Deshizo la toma de una consulta', 'consulta.estado': 'Cambió el estado de una consulta', 'consulta.reasignar': 'Reasignó una consulta', 'consulta.nota': 'Agregó una nota', 'consulta.registrar': 'Registró una consulta a mano', 'config.sla': 'Cambió el plazo para tomar consultas', 'datos.exportar': 'Exportó datos a Excel', 'contenido.publicar': 'Publicó contenido del sitio', 'demo.eliminar': 'Eliminó consultas de demostración' };
  function liveError(e) {
    if (e && e.code === 'app/conflicto') return e.message;
    if (e && e.code === 'permission-denied') return 'No tienes permiso para esta acción.';
    return 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.';
  }
  async function liveRun(fn, okMsg, action, id, detail) {
    try { await fn(); if (okMsg) toast(okMsg); if (action) L.audit(action, detail || id, id); return true; } catch (e) { toast(liveError(e), true); return false; }
  }
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

  function toast(msg, isError, action) {
    const t = $('#toast'); t.replaceChildren(document.createTextNode(msg)); t.hidden = false; t.className = 'toast' + (isError ? ' toast-error' : '') + (action ? ' toast-action' : '');
    if (action) { const b = h('button', { type: 'button', class: 'toast-btn', onclick: () => { t.hidden = true; clearTimeout(toast.t); action.onClick(); } }, action.label); t.append(b); }
    clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, action ? 8000 : 4500);
  }
  function slaText(c) { const left = sla * H - age(c.createdAt); const m = Math.round(Math.abs(left) / 60000); const t = m < 60 ? m + ' min' : m < 2880 ? Math.round(m / 60) + ' h' : Math.round(m / 1440) + ' d'; return left >= 0 ? 'Quedan ' + t : 'Vencida hace ' + t; }
  function pill(c) {
    if (overdue(c)) return h('span', { class: 'pill pill-late' }, 'Vencida · sin tomar');
    return h('span', { class: 'pill pill-' + c.status }, STATUS[c.status]);
  }
  function notify(subject, recipients) { log.push({ at: Date.now(), subject, to: recipients }); }
  const allRecipients = () => [SHARED].concat(db.partners.map((p) => p.short.toLowerCase() + '@nexo-demo.example'));

  /* ---------- Render ---------- */
  function renderTiles() {
    const open = db.consultations.filter((c) => c.status !== 'cerrada');
    const cur = $('#f-status').value;
    const tiles = [
      ['Sin tomar', db.consultations.filter((c) => c.status === 'nueva' && !c.owner).length, '', 'nueva'],
      ['Vencidas (+' + sla + ' h)', db.consultations.filter(overdue).length, 'late', 'vencida'],
      ['En curso', open.filter((c) => c.owner).length, '', 'curso'],
      ['Cerradas', db.consultations.filter((c) => c.status === 'cerrada').length, '', 'cerrada']
    ];
    $('#tiles').replaceChildren(...tiles.map(([l, n, k, f]) => h('li', {}, h('button', { type: 'button', class: 'tile ' + (k && n ? 'tile-' + k : ''), 'aria-pressed': String(cur === f), 'aria-label': n + ' ' + l + (cur === f ? '. Filtro activo, pulsa para quitarlo.' : '. Pulsa para filtrar.'),
      onclick: () => { $('#f-status').value = cur === f ? '' : f; renderRows(); renderTiles(); } }, h('span', { class: 'tile-n' }, String(n)), ' ', h('span', { class: 'tile-l' }, l)))));
    const sin = tiles[0][1] + 0, bn = $('#bn-badge'); if (bn) { bn.hidden = sin === 0; bn.textContent = String(sin); bn.setAttribute('aria-label', sin + ' sin tomar'); }
  }
  function filtered() {
    const q = $('#f-q').value.trim().toLowerCase(), st = $('#f-status').value, ar = $('#f-area').value, ow = $('#f-owner').value;
    return db.consultations.filter((c) => {
      if (q && !(c.name + ' ' + c.email + ' ' + c.id + ' ' + c.phone).toLowerCase().includes(q)) return false;
      if (st === 'vencida' ? !overdue(c) : st === 'curso' ? !(c.owner && c.status !== 'cerrada') : st && c.status !== st) return false;
      if (ar && c.area !== ar) return false;
      if (ow === 'none' ? c.owner : ow && c.owner !== ow) return false;
      return true;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }
  function renderRows() {
    const list = filtered();
    $('#rows').replaceChildren(...list.map((c) => h('tr', { class: (overdue(c) ? 'row-late ' : '') + 'row-s-' + c.status + (!c.owner && c.status === 'nueva' ? ' has-quick' : '') },
      h('td', { 'data-label': 'N.º' }, c.id),
      h('td', { 'data-label': 'Recibida' }, ago(c.createdAt), c.channel !== 'formulario' ? h('span', { class: 'chip' }, CHANNELS[c.channel] || c.channel) : null),
      h('td', { 'data-label': 'Persona' }, h('div', { class: 'cell-person' }, h('strong', {}, c.name, c.demo ? h('span', { class: 'chip' }, 'Demo') : null), h('span', { class: 'sub' }, c.email))),
      h('td', { 'data-label': 'Área' }, AREAS[c.area]),
      h('td', { 'data-label': 'Estado' }, pill(c)),
      h('td', { 'data-label': 'Responsable' }, pname(c.owner)),
      h('td', { class: 'td-action' }, h('button', { class: 'btn btn-secondary', type: 'button', 'aria-label': 'Abrir consulta ' + c.id + ' de ' + c.name, onclick: (e) => openDetail(c.id, e.currentTarget) }, 'Abrir')),
      !c.owner && c.status === 'nueva' ? h('td', { class: 'td-quick' }, h('span', { class: 'quick-info ' + (overdue(c) ? 'q-late' : 'q-ok') }, c.id + ' · ' + slaText(c)),
        h('span', { class: 'btn btn-primary btn-take', role: 'button', tabindex: '0', 'aria-label': 'Tomar la consulta ' + c.id + ' de ' + c.name, onclick: (e) => { e.stopPropagation(); takeQuick(c.id); }, onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); takeQuick(c.id); } } }, 'Tomar')) : null)));
    $('#empty').hidden = list.length > 0;
    $('#table').hidden = list.length === 0;
    $('#count').textContent = list.length + (list.length === 1 ? ' consulta' : ' consultas');
    const nf = ['#f-status', '#f-area', '#f-owner'].filter((s) => $(s).value).length; const fb = $('#f-badge'); if (fb) { fb.hidden = nf === 0; fb.textContent = String(nf); }
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
    $('#log').replaceChildren(...log.map((l) => h('li', {}, h('strong', {}, l.subject), h('span', { class: 'sub' }, l.to ? 'Para: ' + l.to.join(', ') : 'Por ' + l.who), h('span', { class: 'sub' }, new Date(l.at).toLocaleString('es-CL')))));
    $('#log-empty').hidden = log.length > 0;
  }
  function renderOwnerFilter() {
    const sel = $('#f-owner'), cur = sel.value;
    sel.replaceChildren(h('option', { value: '' }, 'Todos'), h('option', { value: 'none' }, 'Sin asignar'), ...db.partners.map((p) => h('option', { value: p.id }, p.short)));
    sel.value = cur;
  }
  function renderAll() { renderDashboard(); renderTiles(); renderRows(); renderTeam(); renderLog(); if ($('#detail').open && openId && !(document.activeElement && /^(TEXTAREA|INPUT|SELECT)$/.test(document.activeElement.tagName) && $('#detail').contains(document.activeElement))) renderDetail(openId); }

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
        lockedBy ? h('p', { class: 'lock', role: 'status' }, 'La tomó ' + lockedBy.name + '. Puedes reasignarla en la pestaña «Reasignar».') : null,
        !c.owner && c.status !== 'cerrada' ? h('div', { class: 'primary-action' }, h('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: () => take(c.id) }, 'Tomar esta consulta'), h('p', { class: 'fine' }, 'Quedará a tu nombre y los otros socios la verán como tomada.')) : null,
        c.owner && c.status !== 'cerrada' ? h('div', { class: 'block' }, h('p', { class: 'mini-h' }, 'Estado'), h('div', { class: 'segs', role: 'group', 'aria-label': 'Estado de la consulta' }, seg('tomada', 'En curso'), seg('espera', 'Esperando respuesta'), seg('cerrada', 'Cerrar consulta'))) : null,
        c.status === 'cerrada' ? h('div', { class: 'block' }, h('p', { class: 'muted' }, 'Consulta cerrada.'), h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => setStatus(c.id, 'tomada') }, 'Reabrir consulta')) : null,
        h('div', { class: 'contact' }, contact('Correo', c.email, 'correo'), contact('Teléfono', c.phone, 'teléfono'), c.summary ? h('div', { class: 'contact-row' }, h('span', { class: 'c-l' }, 'Resumen'), h('span', { class: 'c-v' }, c.summary)) : null)],
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
    if (LIVE) return liveRun(() => L.take(id, db.partners), 'Consulta ' + id + ' tomada.', 'consulta.tomar', id);
    const c = find(id);
    if (c.owner && c.owner !== actor) { toast('Ya la tomó ' + pname(c.owner) + '. No se puede tomar dos veces.', true); renderAll(); return; }
    c.owner = actor; c.status = 'tomada'; hist(c, 'Tomó la consulta.'); toast('Consulta ' + id + ' tomada.'); renderAll();
  }
  async function takeQuick(id) {
    if (LIVE) {
      if (!(await liveRun(() => L.take(id, db.partners), null, 'consulta.tomar', id))) return;
      toast('Tomaste la consulta ' + id + '.', false, { label: 'Deshacer', onClick: () => liveRun(() => L.undoTake(id), 'Se deshizo: la consulta volvió a «Sin tomar».', 'consulta.deshacer_toma', id) }); return;
    }
    const c = find(id);
    if (c.owner && c.owner !== actor) { toast('Ya la tomó ' + pname(c.owner) + '. No se puede tomar dos veces.', true); renderAll(); return; }
    take(id);
    toast('Tomaste la consulta ' + id + '.', false, { label: 'Deshacer', onClick: () => { const x = find(id); if (x.owner === actor && x.status === 'tomada') { x.owner = null; x.status = 'nueva'; x.history.pop(); hist(x, 'Se deshizo la toma de la consulta.'); toast('Se deshizo: la consulta volvió a «Sin tomar».'); renderAll(); } } });
  }
  function setStatus(id, st) { if (LIVE) return liveRun(() => L.setStatus(id, st, STATUS[st]), 'Estado actualizado.', 'consulta.estado', id, STATUS[st]); const c = find(id); c.status = st; hist(c, 'Cambió el estado a «' + STATUS[st] + '».'); toast('Estado actualizado.'); renderAll(); }
  function reassign(id, to, reason) {
    if (reason.trim().length < 3) { toast('Indica un motivo para reasignar.', true); $('#d-reason').focus(); return; }
    if (LIVE) { activeTab = 'resumen'; return liveRun(() => L.reassign(id, to, pname(to), reason.trim()), 'Consulta reasignada a ' + pname(to) + '.', 'consulta.reasignar', id, 'a ' + pname(to)); }
    const c = find(id); const prev = pname(c.owner); c.owner = to; if (c.status === 'nueva') c.status = 'tomada';
    hist(c, 'Reasignó de ' + prev + ' a ' + pname(to) + '. Motivo: ' + reason.trim()); notify('Consulta ' + id + ' reasignada a ' + pname(to), [SHARED, partner(to).short.toLowerCase() + '@nexo-demo.example']);
    toast('Consulta reasignada a ' + pname(to) + '.'); activeTab = 'resumen'; renderAll();
  }
  function addNote(id, text) {
    if (!text.trim()) { toast('Escribe la nota antes de agregarla.', true); $('#d-note').focus(); return; }
    if (LIVE) return liveRun(() => L.addNote(id, text.trim()), 'Nota agregada.', 'consulta.nota', id);
    const c = find(id); c.notes.push({ at: Date.now(), who: pname(actor), text: text.trim() }); hist(c, 'Agregó una nota interna.'); toast('Nota agregada.'); renderAll();
  }
  function simNew() {
    if (LIVE) return;
    const names = ['Nicolás Rivas', 'Daniela Paredes', 'Comercial Andes SpA', 'Héctor Mella'], areas = Object.keys(AREAS);
    const n = names[seq % names.length], area = areas[seq % areas.length];
    const c = { id: 'C-' + seq++, createdAt: Date.now(), name: n, email: 'contacto' + seq + '@example.com', phone: '+56 9 0000 ' + String(1000 + seq), area, channel: 'formulario', status: 'nueva', owner: null, notes: [], history: [{ at: Date.now(), who: 'Sistema', text: 'Consulta recibida por formulario web.' }] };
    db.consultations.unshift(c); notify('Nueva consulta ' + c.id + ' · ' + AREAS[area], allRecipients()); toast('Llegó la consulta ' + c.id + '. Se avisó a la casilla compartida y a los tres socios.'); renderAll();
  }
  function simOther() {
    if (LIVE) return;
    const c = db.consultations.find((x) => x.status === 'nueva' && !x.owner);
    if (!c) { toast('No hay consultas sin tomar para simular.', true); return; }
    const other = db.partners.find((p) => p.id !== actor); c.owner = other.id; c.status = 'tomada'; hist(c, 'Tomó la consulta.', other.short);
    toast(other.short + ' acaba de tomar ' + c.id + '. Si la tenías abierta, ahora aparece bloqueada.'); renderAll();
  }
  function sendReminders() {
    if (LIVE) return;
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
      h('label', { for: 'r-phone' }, 'Teléfono o WhatsApp (opcional si hay correo)'), h('input', { id: 'r-phone', type: 'tel', inputmode: 'tel', maxlength: 20, pattern: '[0-9+\\(\\)\\-\\s]{7,20}', autocomplete: 'off' }),
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
      if (LIVE) {
        const id = newId(); const btn = f.querySelector('[type=submit]'); btn.disabled = true;
        liveRun(() => L.register(id, { nombre: name, email, telefono: phone, area: $('#r-area').value, canal: ch, canalLabel: CHANNELS[ch], tomar: take, resumen: $('#r-summary').value.trim() }), 'Consulta ' + id + ' registrada' + (take ? ' y tomada por ti.' : ' y dejada sin tomar.'), 'consulta.registrar', id, CHANNELS[ch])
          .then((okk) => { btn.disabled = false; if (okk) { opener = null; closeDetail(); show('inbox'); } });
        return;
      }
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
    const kpis = [['Recibidas', String(n)], ['Cerradas' + (n ? ' · ' + Math.round((closed / n) * 100) + ' %' : ''), String(closed)], ['Tiempo medio hasta tomar', avg.toFixed(1).replace('.', ',') + ' h'], ['Tomadas dentro del plazo (' + sla + ' h)', inSla + ' %'], ['Vencidas hoy', String(all.filter(overdue).length)]];
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
    if (LIVE) L.audit('datos.exportar', list.length + ' consultas');
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
  const TITLES = { inbox: 'Consultas', dash: 'Dashboard', team: 'Equipo', notices: 'Avisos', content: 'Contenido', settings: 'Ajustes', more: 'Más' };
  function show(v) {
    view = v; $$('.view').forEach((s) => { s.hidden = s.id !== 'view-' + v; });
    $$('.tabs button').forEach((b) => { if (b.dataset.view === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    const bnKey = ['notices', 'settings'].includes(v) ? 'more' : v;
    $$('.bottom-nav button').forEach((b) => { if (b.dataset.view === bnKey) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    $('#top-title').textContent = TITLES[v] || ''; $('#fab-register').hidden = v !== 'inbox';
    if (v === 'content') window.AdminEditor.render();
    if (v === 'more') renderMore();
    window.scrollTo(0, 0);
    $('#main').focus({ preventScroll: true });
  }
  function renderMore() { const p = partner(actor); if (!p) return; $('#more-avatar').src = p.photo; $('#more-name').textContent = p.name; $('#actor-m').value = actor; $('#m-copy').parentElement.hidden = !!$('#copy-xlsx').hidden; }
  function init() {
    db = LIVE ? EMPTY() : JSON.parse(RAW); log = []; seq = 1043; sla = 24; $('#s-sla').value = 24;
    window.AdminEditor.reset(); renderOwnerFilter(); renderAll(); if (view === 'content') window.AdminEditor.render();
  }
  function fillActors() {
    const opts = () => db.partners.map((p) => h('option', { value: p.id }, p.name));
    $('#login-partner').replaceChildren(...opts()); $('#actor').replaceChildren(...opts()); $('#actor-m').replaceChildren(...opts());
  }
  db = LIVE ? EMPTY() : JSON.parse(RAW); if (!LIVE) fillActors();
  window.AdminEditor.setCtx({ toast, who: () => pname(actor), partnerPhoto: (i) => (db.partners[i] || {}).photo || '' });
  init();

  /* ---------- Modo en vivo: elementos según el modo ---------- */
  document.querySelectorAll('.mock-only').forEach((el) => { el.hidden = LIVE; });
  document.querySelectorAll('.live-only').forEach((el) => { el.hidden = !LIVE; });
  if (LIVE) {
    $('#login-email').required = true;
    const tab = document.querySelector('.tabs [data-view=notices]'); if (tab) tab.textContent = 'Actividad';
    const go = document.querySelector('#view-more [data-go=notices] span'); if (go) go.textContent = 'Actividad';
    $('#t-notices').textContent = 'Actividad reciente';
    const np = $('#view-notices > p.muted'); if (np) np.textContent = 'Registro de lo que hacen los socios en el panel (últimos 60 movimientos). El aviso por correo de cada consulta nueva se activará con el servicio de correo del estudio.';
    $('#log-empty').textContent = 'Aún no hay actividad registrada.';
    window.AdminEditor.setCtx({ audit: (a, d) => L.audit(a, d) });
  }

  /* ---------- Acceso: demostración de controles ---------- */
  const SEC = Object.assign({ maxAttempts: 5, lockSeconds: 30, sessionMinutes: 15, warnSeconds: 60, requireSecondFactor: false, minPassword: 12 }, (window.ADMIN_CONFIG || {}).security);
  document.querySelectorAll('.mfa-only').forEach((el) => { el.hidden = !SEC.requireSecondFactor; });
  document.querySelectorAll('.nomfa-only').forEach((el) => { el.hidden = SEC.requireSecondFactor; });
  document.querySelectorAll('.min-pass').forEach((el) => { el.textContent = String(SEC.minPassword); });
  $('#login-code').required = !!SEC.requireSecondFactor; $('#login-pass').minLength = SEC.minPassword;
  $('#pass-help').textContent = 'Mínimo ' + SEC.minPassword + ' caracteres. Mejor una frase larga que solo tú conozcas.';
  $('#login-title').nextElementSibling.textContent = SEC.requireSecondFactor ? 'Acceso exclusivo para los socios del estudio.' : 'Acceso exclusivo para los socios del estudio. Ingresa con tu contraseña.';
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
    passIn.removeAttribute('aria-invalid'); codeIn.removeAttribute('aria-invalid'); $('#login-email').removeAttribute('aria-invalid');
    const fmtErr = (m, el) => { loginErr.textContent = m; loginErr.hidden = false; el.setAttribute('aria-invalid', 'true'); el.focus(); };
    if (pass.length < SEC.minPassword) return fmtErr('Escribe tu contraseña (mínimo ' + SEC.minPassword + ' caracteres).', passIn);
    if (SEC.requireSecondFactor && !/^\d{6}$/.test(code)) return fmtErr('El código tiene 6 dígitos. Revisa tu aplicación autenticadora.', codeIn);
    if (LIVE) { liveLogin(); return; }
    const valid = SEC.requireSecondFactor ? code !== '000000' : pass !== 'incorrecta123';
    if (!valid) {
      attempts++;
      codeIn.value = '';
      if (attempts >= SEC.maxAttempts) { passIn.value = ''; lockLogin(); return; }
      loginErr.textContent = 'No pudimos verificar tus datos. Revisa ' + (SEC.requireSecondFactor ? 'la contraseña y el código' : 'tu contraseña') + ' y vuelve a intentarlo. Te quedan ' + (SEC.maxAttempts - attempts) + (SEC.maxAttempts - attempts === 1 ? ' intento.' : ' intentos.'); loginErr.hidden = false; (SEC.requireSecondFactor ? codeIn : passIn).setAttribute('aria-invalid', 'true'); (SEC.requireSecondFactor ? codeIn : passIn).focus(); return;
    }
    attempts = 0; loginErr.hidden = true; actor = $('#login-partner').value; $('#actor').value = actor; $('#actor-m').value = actor; $('#avatar-img').src = partner(actor).photo;
    $('#login-pass').value = ''; $('#login-code').value = ''; $('#login-pass').type = 'password'; $('#pass-toggle').textContent = 'Mostrar'; $('#pass-toggle').setAttribute('aria-pressed', 'false');
    $('#login').hidden = true; $('#app').hidden = false; renderAll(); show('inbox'); $('#main').focus(); startSession();
  });
  async function liveLogin() {
    const emailIn = $('#login-email'), email = emailIn.value.trim(), pass = $('#login-pass').value;
    if (!email || !emailIn.checkValidity()) { loginErr.textContent = 'Escribe tu correo.'; loginErr.hidden = false; emailIn.setAttribute('aria-invalid', 'true'); emailIn.focus(); return; }
    submit.disabled = true; loginMsg.textContent = 'Verificando…'; loginMsg.hidden = false; loginErr.hidden = true;
    try {
      const me = await L.signIn(email, pass);
      actor = me.id;
      let ready = false;
      await L.start({
        socios: (list) => { db.partners = list; renderOwnerFilter(); const p = partner(actor); if (p) { $('#avatar-img').src = p.photo; } if (ready) renderAll(); },
        consultas: (list, changes) => {
          db.consultations = list;
          if (ready) changes.filter((c) => c.type === 'added' && !c.doc.metadata.hasPendingWrites).forEach((c) => toast('Llegó una consulta nueva: ' + c.doc.id + '.'));
          renderAll();
        },
        config: (cfg) => { sla = cfg.slaHoras || 24; $('#s-sla').value = sla; if (ready) renderAll(); },
        auditoria: (list) => { log = list.map((x) => ({ at: x.at, subject: (ACCIONES[x.action] || x.action) + (x.detail ? ': ' + x.detail : ''), who: x.who })); renderLog(); }
      });
      ready = true;
      window.AdminEditor.setCtx({ live: { saveDraft: L.saveDraft, publish: L.publish } });
      L.loadContent().then((c) => window.AdminEditor.hydrate(c)).catch(() => {});
      attempts = 0; loginMsg.hidden = true;
      $('#login-pass').value = ''; $('#login-pass').type = 'password'; $('#pass-toggle').textContent = 'Mostrar'; $('#pass-toggle').setAttribute('aria-pressed', 'false');
      $('#login').hidden = true; $('#app').hidden = false; renderAll(); show('inbox'); $('#main').focus(); startSession(); L.audit('sesion.inicio');
    } catch (e) {
      loginMsg.hidden = true; passIn.value = '';
      if (e.code === 'app/sin-acceso') loginErr.textContent = 'Tu cuenta no tiene acceso al panel. Pide a otro socio que revise tu alta.';
      else if (e.code === 'auth/too-many-requests') loginErr.textContent = 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
      else if (e.code === 'auth/network-request-failed') loginErr.textContent = 'No hay conexión. Revisa tu internet e inténtalo de nuevo.';
      else { attempts++; loginErr.textContent = 'No pudimos verificar tus datos. Revisa tu correo y contraseña, y vuelve a intentarlo. Te quedan ' + Math.max(0, SEC.maxAttempts - attempts) + ' intentos.'; if (attempts >= SEC.maxAttempts) { loginErr.hidden = false; submit.disabled = false; lockLogin(); return; } }
      loginErr.hidden = false; passIn.setAttribute('aria-invalid', 'true'); passIn.focus();
    } finally { if (!submit.disabled || !lockTimer) submit.disabled = false; }
  }
  /* Cierre de sesión (manual o por inactividad): se vacía la información de la pantalla. */
  function endSession(reason) {
    clearTimeout(idleTimer); clearTimeout(warnTimer); clearInterval(tickTimer);
    if ($('#session-dialog').open) $('#session-dialog').close();
    if ($('#detail').open) $('#detail').close();
    if (LIVE) { L.signOut(); db = EMPTY(); log = []; }
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
  const setActor = (id) => { actor = id; $('#actor').value = id; $('#actor-m').value = id; $('#avatar-img').src = partner(id).photo; toast('Ahora actúas como ' + partner(id).name + '.'); renderAll(); if (view === 'more') renderMore(); };
  $('#actor').addEventListener('change', (e) => setActor(e.target.value));
  $('#actor-m').addEventListener('change', (e) => setActor(e.target.value));
  $('#avatar-btn').addEventListener('click', () => show('more'));
  $$('[data-go]').forEach((b) => b.addEventListener('click', () => show(b.dataset.go)));
  $('#fab-register').addEventListener('click', (e) => openRegister(e.currentTarget));
  window.addEventListener('scroll', () => { $('#fab-register').classList.toggle('fab-mini', window.scrollY > 140); }, { passive: true });
  $('#m-export').addEventListener('click', () => $('#export-xlsx').click()); $('#m-copy').addEventListener('click', () => $('#copy-xlsx').click());
  $('#m-sim-new').addEventListener('click', () => $('#sim-new').click()); $('#m-sim-other').addEventListener('click', () => $('#sim-other').click()); $('#m-reset').addEventListener('click', () => $('#reset').click());
  $('#m-logout').addEventListener('click', () => endSession('Cerraste sesión.'));
  $('#f-toggle').addEventListener('click', (e) => { const open = $('#filters').classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', String(open)); });
  $$('.tabs button, .bottom-nav button').forEach((b) => b.addEventListener('click', () => show(b.dataset.view)));
  $('#filters').addEventListener('input', renderRows);
  $('#export-xlsx').addEventListener('click', exportXlsx); $('#copy-xlsx').addEventListener('click', (e) => copyForExcel(e.currentTarget)); $('#register').addEventListener('click', (e) => openRegister(e.currentTarget)); $('#sim-new').addEventListener('click', simNew); $('#sim-other').addEventListener('click', simOther);
  $('#reset').addEventListener('click', () => { init(); closeDetail(); toast('Datos de ejemplo restablecidos.'); });
  $('#send-reminders').addEventListener('click', sendReminders);
  $('#settings-form').addEventListener('submit', (e) => {
    e.preventDefault(); const v = parseInt($('#s-sla').value, 10), m = $('#settings-msg');
    if (!(v >= 1 && v <= 168)) { m.textContent = 'Usa un plazo entre 1 y 168 horas.'; m.hidden = false; return; }
    if (LIVE) { liveRun(() => L.setSla(v), null, 'config.sla', null, v + ' h').then((okk) => { if (okk) { m.textContent = 'Plazo guardado: ' + v + ' h.'; m.hidden = false; } }); return; }
    sla = v; m.textContent = 'Plazo aplicado: ' + sla + ' h (solo en esta sesión de prueba).'; m.hidden = false; renderAll();
  });
  let delArm = false;
  if (LIVE) $('#del-demo').addEventListener('click', async (e) => {
    const b = e.currentTarget;
    if (!delArm) { delArm = true; b.textContent = '¿Seguro? Pulsa de nuevo para eliminar'; setTimeout(() => { delArm = false; b.textContent = 'Eliminar consultas de demostración'; }, 6000); return; }
    delArm = false; b.textContent = 'Eliminar consultas de demostración'; b.disabled = true;
    try { const n = await L.deleteDemo(); $('#del-msg').textContent = n + ' consulta(s) de demostración eliminadas.'; $('#del-msg').hidden = false; L.audit('demo.eliminar', String(n)); } catch (err) { toast(liveError(err), true); } finally { b.disabled = false; }
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
