'use strict';
/* Editor de contenido del sitio (maqueta de la Etapa 2). Datos ficticios en memoria; no cambia el sitio público. */
window.AdminEditor = (() => {
  const RAW = JSON.stringify(window.ADMIN_CONTENT);
  let ctx = { toast() {}, who: () => 'Socio', partnerPhoto: () => '', live: null, audit: null };
  let pubVersion = {}, saveTimer = null;
  let sections, current = 'hero', langView = 'both', prevLang = 'es', versions = {};
  const $ = (s, r = document) => r.querySelector(s);
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v === false || v == null) return;
      if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v);
    });
    kids.flat().forEach((c) => { if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); });
    return e;
  }
  const put = (el, ...n) => el.replaceChildren(...n.filter(Boolean));
  const sec = (id) => sections.find((s) => s.id === id);
  const changed = (f) => f.es !== f.pes || f.en !== f.pen;
  const changes = (s) => s.fields.filter(changed);
  const get = (key) => { for (const s of sections) { const f = s.fields.find((x) => x.key === key); if (f) return f; } return null; };
  const mapCampos = (s) => Object.fromEntries(s.fields.map((f) => [f.key, { es: f.es, en: f.en }]));
  function scheduleSave(s) {
    if (!ctx.live) return; clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { ctx.live.saveDraft(s.id, mapCampos(s), versions[s.id]).catch(() => ctx.toast('No se pudo guardar el borrador. Revisa tu conexión.', true)); }, 900);
  }
  /* Modo en vivo: carga lo publicado y los borradores guardados en Firestore */
  function hydrate(c) {
    sections.forEach((s) => {
      s.fields.forEach((f) => {
        const p = (c.publicado[s.id] || {})[f.key], b = (c.borrador[s.id] || {})[f.key];
        if (p) { f.pes = p.es; f.pen = p.en; }
        f.es = b ? b.es : f.pes; f.en = b ? b.en : f.pen;
      });
      versions[s.id] = c.versiones[s.id] && c.versiones[s.id].length ? c.versiones[s.id] : [{ at: Date.now(), who: 'Carga inicial', n: s.fields.length, snap: mapCampos(s) }];
      pubVersion[s.id] = c.version[s.id] || 1;
    });
    if ($('#editor-root') && $('#editor-root').children.length) render();
  }
  const short = (t) => (t.length > 60 ? t.slice(0, 57) + '…' : t);

  function reset() {
    sections = JSON.parse(RAW).map((s) => { s.fields.forEach((f) => { f.pes = f.es; f.pen = f.en; }); return s; });
    versions = {}; sections.forEach((s) => { versions[s.id] = [{ at: Date.now() - 6 * 86400000, who: 'Andrés', n: s.fields.length, snap: Object.fromEntries(s.fields.map((f) => [f.key, { es: f.es, en: f.en }])) }]; });
    current = 'hero'; langView = window.matchMedia && window.matchMedia('(max-width: 820px)').matches ? 'es' : 'both';
  }
  reset();

  /* ---------- Vista previa ---------- */
  function preview(s, lang) {
    const v = (key) => { const f = get(key); return f ? f[lang] : ''; };
    const two = (t) => { const i = t.indexOf('. '); return i > 0 ? [t.slice(0, i + 1), t.slice(i + 2)] : [t, '']; };
    const map = {
      hero: () => { const [a, b] = two(v('hero.title')); return h('div', { class: 'pv pv-hero' }, h('p', { class: 'pv-eyebrow' }, v('hero.eyebrow')), h('p', { class: 'pv-h1' }, a, b ? h('br') : null, b ? h('em', {}, b) : null), h('p', { class: 'pv-desc' }, v('hero.desc')), h('span', { class: 'pv-btn' }, v('hero.cta'))); },
      studio: () => { const [a, b] = two(v('studio.title')); return h('div', { class: 'pv pv-studio' }, h('p', { class: 'pv-h2' }, a, b ? h('br') : null, b ? h('em', {}, b) : null), h('p', {}, v('studio.p1')), h('p', {}, v('studio.p2'))); },
      areas: () => h('div', { class: 'pv pv-areas' }, ...['civil', 'laboral', 'empresas'].map((k, i) => h('div', { class: 'pv-row' }, h('span', { class: 'pv-num' }, '0' + (i + 1)), h('strong', {}, v('area.' + k + '.t')), h('span', {}, v('area.' + k + '.d'))))),
      team: () => h('div', { class: 'pv pv-team' }, ...[1, 2, 3].map((n) => h('div', { class: 'pv-card' }, h('img', { src: ctx.partnerPhoto(n - 1), alt: '', width: 64, height: 64 }), h('strong', {}, v('p' + n + '.name')), h('span', {}, v('p' + n + '.role'))))),
      faq: () => h('div', { class: 'pv pv-faq' }, ...[1, 2, 3, 4].map((n) => h('div', { class: 'pv-q' }, h('strong', {}, v('faq.q' + n)), h('p', {}, v('faq.a' + n))))),
      contact: () => h('div', { class: 'pv pv-contact' }, ...[['Oficina', 'cd.addr'], ['Teléfono', 'cd.phone'], ['Correo', 'cd.mail'], ['Horario', 'cd.hours']].map(([l, k]) => h('div', { class: 'pv-row2' }, h('span', {}, l), h('strong', {}, v(k)))))
    };
    return map[s.preview]();
  }

  /* ---------- Render ---------- */
  function statusOf(s) { const n = changes(s).length; return n ? { text: n + (n === 1 ? ' cambio sin publicar' : ' cambios sin publicar'), cls: 'pill-espera' } : { text: 'Publicado', cls: 'pill-cerrada' }; }
  function refreshMeta() {
    const s = sec(current), n = changes(s).length;
    document.querySelectorAll('.ed-nav button').forEach((b) => { const x = sec(b.dataset.id), st = statusOf(x); const p = b.querySelector('.pill'); p.textContent = st.text; p.className = 'pill ' + st.cls; });
    const stat = $('#ed-status');
    if (stat && !stat.dataset.lock) { stat.textContent = n ? 'Borrador guardado automáticamente. Aún no está publicado.' : 'Todo lo que ves está publicado.'; stat.className = 'ed-status' + (n ? ' ed-draft' : ' ed-ok'); }
    $('#ed-publish').disabled = !n; $('#ed-revert').disabled = !n;
    const pv = $('#ed-preview'); if (pv) put(pv, preview(s, prevLang));
    s.fields.forEach((f) => ['es', 'en'].forEach((l) => { const c = $('#cnt-' + f.key.replace(/\W/g, '_') + '-' + l); if (c) { c.textContent = f[l].length + ' / ' + f.max; c.classList.toggle('cnt-over', f[l].length > f.max); } }));
  }
  function field(f) {
    const id = (l) => 'f-' + f.key.replace(/\W/g, '_') + '-' + l;
    const col = (l, name) => {
      const input = f.type === 'area' ? h('textarea', { id: id(l), rows: 3, 'aria-describedby': 'cnt-' + f.key.replace(/\W/g, '_') + '-' + l }) : h('input', { id: id(l), 'aria-describedby': 'cnt-' + f.key.replace(/\W/g, '_') + '-' + l });
      input.value = f[l]; if (f.type !== 'area') input.setAttribute('type', 'text');
      input.addEventListener('input', () => { f[l] = input.value; input.removeAttribute('aria-invalid'); const st = $('#ed-status'); if (st) { delete st.dataset.lock; } refreshMeta(); scheduleSave(sec(current)); });
      return h('div', { class: 'ed-col', 'data-l': l }, h('label', { for: id(l) }, name), input, h('span', { class: 'cnt', id: 'cnt-' + f.key.replace(/\W/g, '_') + '-' + l }, f[l].length + ' / ' + f.max));
    };
    return h('fieldset', { class: 'ed-field' }, h('legend', {}, f.label), f.help ? h('p', { class: 'field-help' }, f.help) : null, h('div', { class: 'ed-cols' }, col('es', 'Español'), col('en', 'English')));
  }
  function render() {
    const root = $('#editor-root'); if (!root) return;
    const s = sec(current);
    const nav = h('nav', { class: 'ed-nav', 'aria-label': 'Secciones del sitio' }, ...sections.map((x) => { const st = statusOf(x); return h('button', { type: 'button', 'data-id': x.id, 'aria-current': x.id === current ? 'true' : null, onclick: () => { current = x.id; render(); $('#ed-title').focus(); } }, h('span', { class: 'ed-nav-n' }, x.name), h('span', { class: 'pill ' + st.cls }, st.text)); }));
    const toggle = h('div', { class: 'ed-lang', role: 'group', 'aria-label': 'Idiomas que se muestran' }, ...[['both', 'Ambos'], ['es', 'Español'], ['en', 'English']].map(([k, t]) => h('button', { type: 'button', class: 'seg' + (langView === k ? ' seg-on' : ''), 'aria-pressed': String(langView === k), onclick: () => { langView = k; render(); } }, t)));
    const pvTabs = h('div', { class: 'ed-lang', role: 'group', 'aria-label': 'Idioma de la vista previa' }, ...[['es', 'Español'], ['en', 'English']].map(([k, t]) => h('button', { type: 'button', class: 'seg' + (prevLang === k ? ' seg-on' : ''), 'aria-pressed': String(prevLang === k), onclick: () => { prevLang = k; refreshMeta(); document.querySelectorAll('.pvtabs .seg').forEach((b, i) => { const on = ['es', 'en'][i] === prevLang; b.classList.toggle('seg-on', on); b.setAttribute('aria-pressed', String(on)); }); } }, t)));
    const hist = versions[s.id];
    const editor = h('section', { class: 'ed-card', 'data-view': langView, 'aria-labelledby': 'ed-title' },
      h('div', { class: 'ed-head' }, h('div', {}, h('h2', { id: 'ed-title', tabindex: '-1' }, s.name), h('p', { class: 'muted' }, s.hint)), toggle),
      ...s.fields.map(field),
      h('details', { class: 'fold' }, h('summary', {}, 'Versiones publicadas (' + hist.length + ')'),
        h('ul', { class: 'versions' }, ...hist.slice().reverse().slice(0, 4).map((v, i) => h('li', {}, h('span', {}, new Date(v.at).toLocaleDateString('es-CL', { dateStyle: 'medium' }) + ' · ' + v.who + ' · ' + v.n + (v.n === 1 ? ' texto' : ' textos')),
          h('button', { class: 'btn btn-secondary btn-sm', type: 'button', 'aria-label': 'Restaurar la versión del ' + new Date(v.at).toLocaleDateString('es-CL'), onclick: () => restore(s, v) }, 'Restaurar'))))),
      h('div', { class: 'ed-actions' }, h('p', { id: 'ed-status', class: 'ed-status', role: 'status' }),
        h('div', { class: 'row-btns' }, h('button', { class: 'btn btn-primary', id: 'ed-publish', type: 'button', onclick: askPublish }, 'Publicar cambios'), h('button', { class: 'btn btn-secondary', id: 'ed-revert', type: 'button', onclick: revert }, 'Volver a lo publicado'))));
    const pv = h('aside', { class: 'ed-preview-card', 'aria-label': 'Vista previa' }, h('h3', {}, 'Así se verá en el sitio'), h('div', { class: 'pvtabs' }, pvTabs), h('div', { id: 'ed-preview' }), h('p', { class: 'fine' }, 'Vista aproximada. El sitio público no cambia en esta maqueta.'));
    put(root, nav, editor, pv);
    refreshMeta();
  }

  /* ---------- Acciones ---------- */
  function revert() { const s = sec(current); changes(s).forEach((f) => { f.es = f.pes; f.en = f.pen; }); scheduleSave(s); ctx.toast('Se volvió a lo publicado en «' + s.name + '».'); render(); }
  function restore(s, v) { s.fields.forEach((f) => { if (v.snap[f.key]) { f.es = v.snap[f.key].es; f.en = v.snap[f.key].en; } }); scheduleSave(s); ctx.toast('Versión restaurada como borrador. Revisa y publica si es lo que quieres.'); render(); }
  function validate(s) {
    for (const f of s.fields) for (const l of ['es', 'en']) {
      const el = $('#f-' + f.key.replace(/\W/g, '_') + '-' + l), name = l === 'es' ? 'español' : 'inglés';
      if (!f[l].trim()) return { el, msg: 'Falta el texto en ' + name + ' de «' + f.label + '». El sitio tiene dos idiomas, completa ambos.' };
      if (f[l].length > f.max) return { el, msg: 'El texto en ' + name + ' de «' + f.label + '» supera los ' + f.max + ' caracteres. Acórtalo para que se vea bien.' };
    }
    return null;
  }
  function askPublish() {
    const s = sec(current), bad = validate(s), st = $('#ed-status');
    if (bad) { st.dataset.lock = '1'; st.textContent = bad.msg; st.className = 'ed-status ed-error'; if (bad.el) { bad.el.setAttribute('aria-invalid', 'true'); bad.el.focus(); } return; }
    const list = changes(s), dlg = $('#confirm-dialog');
    put($('#confirm-list'), ...list.map((f) => h('li', {}, h('strong', {}, f.label), ['es', 'en'].filter((l) => f[l] !== (l === 'es' ? f.pes : f.pen)).map((l) => h('span', { class: 'diff' }, h('span', { class: 'diff-l' }, l === 'es' ? 'Español' : 'English'), h('span', { class: 'diff-old' }, short(l === 'es' ? f.pes : f.pen)), h('span', { class: 'diff-new' }, short(f[l])))))));
    $('#confirm-title').textContent = '¿Publicar ' + list.length + (list.length === 1 ? ' cambio' : ' cambios') + ' en «' + s.name + '»?';
    $('#confirm-ok').onclick = () => { dlg.close(); publish(s); };
    dlg.showModal(); $('#confirm-ok').focus();
  }
  async function publish(s) {
    const n = changes(s).length;
    if (ctx.live) {
      try { await ctx.live.publish(s.id, mapCampos(s), (pubVersion[s.id] || 1) + 1); } catch (err) { ctx.toast('No se pudo publicar. Revisa tu conexión y tus permisos.', true); return; }
      pubVersion[s.id] = (pubVersion[s.id] || 1) + 1;
    }
    versions[s.id].push({ at: Date.now(), who: ctx.who(), n, snap: Object.fromEntries(s.fields.map((f) => [f.key, { es: f.es, en: f.en }])) });
    if (versions[s.id].length > 8) versions[s.id].shift();
    s.fields.forEach((f) => { f.pes = f.es; f.pen = f.en; });
    if (ctx.live) { clearTimeout(saveTimer); ctx.live.saveDraft(s.id, mapCampos(s), versions[s.id]).catch(() => {}); if (ctx.audit) ctx.audit('contenido.publicar', s.name); }
    ctx.toast(ctx.live ? 'Publicado «' + s.name + '». Ya se ve en el sitio.' : 'Publicado «' + s.name + '» (simulado). El sitio público no cambió.'); render();
    const st = $('#ed-status'); if (st) { st.dataset.lock = '1'; st.textContent = 'Publicado ahora por ' + ctx.who() + '.'; st.className = 'ed-status ed-ok'; setTimeout(() => { if (st) delete st.dataset.lock; }, 100); }
  }
  $('#confirm-cancel') && $('#confirm-cancel').addEventListener('click', () => $('#confirm-dialog').close());
  return { render, reset, hydrate, setCtx: (c) => { ctx = Object.assign(ctx, c); }, count: () => sections.reduce((a, s) => a + changes(s).length, 0) };
})();
