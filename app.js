'use strict';
/* NEXO Abogados · demo estática. JavaScript nativo, sin dependencias. */
const LANGS = ['es', 'en'];
let lang = 'es';
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }
};
const t = (key) => (I18N[lang] && I18N[lang][key] !== undefined ? I18N[lang][key] : I18N.es[key]);

/* ---------- Menú móvil ---------- */
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', t(open ? 'menu.close' : 'menu.open'));
  nav.classList.toggle('is-open', open);
}
menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

/* ---------- Ventanas de detalle ---------- */
const dialog = document.querySelector('#detail-dialog');
const dialogContent = document.querySelector('#dialog-content');
let previousFocus = null;
let currentKey = null;
const portraits = { socio1: 'assets/partner-1.webp', socio2: 'assets/partner-2.webp', socio3: 'assets/partner-3.webp' };

function renderDialog(key) {
  const c = t('dlg.' + key);
  if (!c) return;
  dialogContent.replaceChildren();
  const add = (tag, text, cls) => {
    const e = document.createElement(tag);
    e.textContent = text;
    if (cls) e.className = cls;
    dialogContent.append(e);
    return e;
  };
  add('p', c.tag, 'dialog-tag');
  if (portraits[key]) {
    const img = document.createElement('img');
    img.src = portraits[key];
    img.alt = t('dlg.portrait');
    img.className = 'dialog-portrait';
    dialogContent.append(img);
  }
  add('h2', c.title).id = 'dialog-title';
  add('p', c.body);
  const addList = (items) => {
    const ul = add('ul', '');
    items.forEach((item) => { const li = document.createElement('li'); li.textContent = item; ul.append(li); });
  };
  if (c.list) addList(c.list);
  (c.sections || []).forEach((s) => {
    add('h3', s.h, 'dialog-sub');
    if (s.p) add('p', s.p);
    if (s.list) addList(s.list);
  });
  add('p', c.end);
  if (c.clear) {
    const b = add('button', c.clear, 'button button-navy');
    b.type = 'button';
    b.addEventListener('click', () => {
      try { localStorage.removeItem('nexo-lang'); localStorage.removeItem('nexo-a11y'); } catch (e) { /* sin almacenamiento */ }
      prefs = { size: 0, contrast: false, gray: false, links: false, font: false, spacing: false, motion: false };
      applyPrefs(false);
      const m = add('p', c.cleared, 'dialog-ok');
      m.setAttribute('role', 'status');
    });
  }
  if (c.cta) {
    const a = add('a', t('dlg.cta'), 'button button-navy');
    a.href = '#contacto';
    a.addEventListener('click', () => dialog.close());
  }
}
function openDialog(key) {
  if (!t('dlg.' + key)) return;
  previousFocus = document.activeElement;
  currentKey = key;
  renderDialog(key);
  document.body.classList.add('modal-open');
  dialog.showModal();
}
document.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => openDialog(b.dataset.open)));
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (e) => {
  const r = dialog.getBoundingClientRect();
  if (e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  currentKey = null;
  if (previousFocus) previousFocus.focus();
});

/* ---------- Formulario de demostración ---------- */
const form = document.querySelector('#contact-form');
const status = document.querySelector('#form-status');
let statusFn = null;
const LIVE = window.NEXO_BACKEND === 'firebase';
const POLICY_VERSION = 'v1-2026-11';
let fbReady = null;
function loadFB() {
  if (!fbReady) fbReady = new Promise((resolve, reject) => {
    const s = document.createElement('script'); s.src = 'nexo-firebase.js';
    s.onload = () => resolve(window.NexoFB); s.onerror = () => reject(new Error('No se pudo cargar Firebase'));
    document.head.append(s);
  });
  return fbReady;
}
function showStatus(fn, isError) {
  statusFn = fn; status.hidden = false; status.setAttribute('role', isError ? 'alert' : 'status'); status.textContent = fn(); status.focus();
}
const newId = () => 'C-' + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).toUpperCase().replace(/[^0-9A-Z]/g, '').padEnd(4, '0').slice(0, 4);
let lastSend = 0;
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  if (!LIVE) { form.reset(); showStatus(() => t('form.ok')); return; }
  if (form.elements.website && form.elements.website.value) { form.reset(); showStatus(() => t('form.ok').replace('{id}', '—')); return; } // trampa anti-bots
  if (Date.now() - lastSend < 30000) { showStatus(() => t('form.wait'), true); return; }
  const btn = form.querySelector('.submit-button'); btn.disabled = true;
  showStatus(() => t('form.sending'));
  try {
    const fb = await loadFB(); const id = newId();
    await fb.crearConsulta(id, { nombre: form.elements.nombre.value.trim(), email: form.elements.correo.value.trim(), telefono: (form.elements.telefono.value || '').trim(), area: form.elements.area.value, idioma: lang, version: POLICY_VERSION });
    lastSend = Date.now(); form.reset(); showStatus(() => t('form.ok').replace('{id}', id));
  } catch (err) { showStatus(() => t('form.err'), true); } finally { btn.disabled = false; }
});

/* ---------- Idioma ---------- */
function applyLang(next, save) {
  lang = LANGS.includes(next) ? next : 'es';
  document.documentElement.lang = lang === 'es' ? 'es-CL' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':');
      el.setAttribute(attr, t(key));
    });
  });
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  menuButton.setAttribute('aria-label', t(menuButton.getAttribute('aria-expanded') === 'true' ? 'menu.close' : 'menu.open'));
  if (statusFn) status.textContent = statusFn();
  if (currentKey) renderDialog(currentKey);
  const wa = document.querySelector('#wa-fab');
  if (wa) wa.href = 'https://wa.me/56900000000?text=' + encodeURIComponent(t('wa.msg'));
  updateA11yLabels();
  if (save) store.set('nexo-lang', lang);
}
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => applyLang(b.dataset.lang, true)));

/* ---------- Panel de accesibilidad ---------- */
const root = document.documentElement;
const fab = document.querySelector('#a11y-toggle');
const panel = document.querySelector('#a11y-panel');
const sizeOut = document.querySelector('#a11y-size-out');
const SIZES = [100, 112, 125, 140];
const FLAGS = ['contrast', 'gray', 'links', 'font', 'spacing', 'motion'];
let prefs = { size: 0, contrast: false, gray: false, links: false, font: false, spacing: false, motion: false };
try { Object.assign(prefs, JSON.parse(store.get('nexo-a11y') || '{}')); } catch (e) { /* ignorar */ }
prefs.size = Math.min(Math.max(parseInt(prefs.size, 10) || 0, 0), SIZES.length - 1);

function updateA11yLabels() {
  sizeOut.textContent = SIZES[prefs.size] + '%';
  document.querySelector('#a11y-dec').disabled = prefs.size === 0;
  document.querySelector('#a11y-inc').disabled = prefs.size === SIZES.length - 1;
}
function applyPrefs(save) {
  SIZES.forEach((_, i) => root.classList.toggle('a11y-size-' + i, i === prefs.size && i > 0));
  FLAGS.forEach((f) => root.classList.toggle('a11y-' + f, !!prefs[f]));
  panel.querySelectorAll('[data-a11y]').forEach((b) => b.setAttribute('aria-pressed', String(!!prefs[b.dataset.a11y])));
  updateA11yLabels();
  if (save) store.set('nexo-a11y', JSON.stringify(prefs));
}
function setPanel(open) {
  panel.hidden = !open;
  fab.setAttribute('aria-expanded', String(open));
}
fab.addEventListener('click', () => {
  const open = panel.hidden;
  setPanel(open);
  if (open) panel.querySelector('#a11y-close').focus();
});
document.querySelector('#a11y-close').addEventListener('click', () => { setPanel(false); fab.focus(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !panel.hidden && !dialog.open) { setPanel(false); fab.focus(); }
});
document.addEventListener('click', (e) => {
  if (!panel.hidden && !panel.contains(e.target) && !fab.contains(e.target)) setPanel(false);
});
document.querySelector('#a11y-dec').addEventListener('click', () => { prefs.size = Math.max(prefs.size - 1, 0); applyPrefs(true); });
document.querySelector('#a11y-inc').addEventListener('click', () => { prefs.size = Math.min(prefs.size + 1, SIZES.length - 1); applyPrefs(true); });
panel.querySelectorAll('[data-a11y]').forEach((b) => b.addEventListener('click', () => { prefs[b.dataset.a11y] = !prefs[b.dataset.a11y]; applyPrefs(true); }));
document.querySelector('#a11y-reset').addEventListener('click', () => {
  prefs = { size: 0, contrast: false, gray: false, links: false, font: false, spacing: false, motion: false };
  applyPrefs(true);
});

/* ---------- Inicio ---------- */
/* ---------- Modo en vivo: textos legales reales y contenido publicado por los socios ---------- */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const twoLines = (s) => { const i = s.indexOf('. '); return i > 0 ? esc(s.slice(0, i + 1)) + '<br><em>' + esc(s.slice(i + 2)) + '</em>' : esc(s); };
const KEYMAP = { 'cd.addr': 'cd.addr.v', 'cd.hours': 'cd.hours.v', 'cd.phone': 'cd.phone.v', 'cd.mail': 'cd.mail.v' };
const HTMLKEYS = { 'hero.title': 1, 'studio.title': 1 };
function applyContent(secciones) {
  const campos = Object.assign({}, ...Object.values(secciones));
  LANGS.forEach((l) => Object.entries(campos).forEach(([key, v]) => {
    const val = v && typeof v[l] === 'string' ? v[l].slice(0, 400) : null; if (!val) return;
    const tk = KEYMAP[key] || key;
    I18N[l][tk] = HTMLKEYS[key] ? twoLines(val) : val;
    const m = key.match(/^p([123])\.name$/); if (m && I18N[l]['dlg.socio' + m[1]]) I18N[l]['dlg.socio' + m[1]].title = val;
    const a2 = key.match(/^area\.(civil|laboral|empresas)\.t$/); if (a2 && I18N[l]['dlg.' + a2[1]]) I18N[l]['dlg.' + a2[1]].title = val;
  }));
}
if (LIVE) {
  LANGS.forEach((l) => Object.assign(I18N[l], I18N_LIVE[l]));
  loadFB().then((fb) => fb.cargarContenido()).then((c) => { applyContent(c); applyLang(lang, false); }).catch(() => { /* se mantienen los textos por defecto */ });
}
const savedLang = store.get('nexo-lang');
applyLang(LANGS.includes(savedLang) ? savedLang : 'es', false);
applyPrefs(false);

/* ---------- Volver al inicio ----------
   #inicio es la cabecera fija (sticky): el navegador la considera ya visible y no desplaza. */
document.querySelectorAll('a[href="#inicio"]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-motion');
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  document.querySelector('.brand').focus({ preventScroll: true });
}));

/* ---------- Sección activa en el menú ----------
   La sección actual es la última (de TODAS las de la página) cuyo borde superior ya pasó
   la línea de lectura; solo se resalta si tiene enlace en el menú. */
(() => {
  const links = [...nav.querySelectorAll('a[href^="#"]')].filter((a) => a.getAttribute('href').length > 1);
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const sections = [...document.querySelectorAll('main section[id], main .section, main section.hero')];
  const header = document.querySelector('.header');
  let ticking = false;
  const update = () => {
    ticking = false;
    const line = header.getBoundingClientRect().bottom + window.innerHeight * 0.2;
    let current = null;
    sections.forEach((s) => { if (s.getBoundingClientRect().top <= line) current = s; });
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) current = document.querySelector('#contacto');
    const target = current && current.id ? byId.get(current.id) : null;
    links.forEach((a) => { if (a === target) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
})();
