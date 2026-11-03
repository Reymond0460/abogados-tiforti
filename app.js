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
const portraits = { socio1: 'assets/partner-1.jpg', socio2: 'assets/partner-2.jpg', socio3: 'assets/partner-3.jpg' };

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
  const ul = add('ul', '');
  c.list.forEach((item) => { const li = document.createElement('li'); li.textContent = item; ul.append(li); });
  add('p', c.end);
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
let statusShown = false;
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  form.reset();
  statusShown = true;
  status.hidden = false;
  status.textContent = t('form.ok');
  status.focus();
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
  if (statusShown) status.textContent = t('form.ok');
  if (currentKey) renderDialog(currentKey);
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
const savedLang = store.get('nexo-lang');
applyLang(LANGS.includes(savedLang) ? savedLang : 'es', false);
applyPrefs(false);
