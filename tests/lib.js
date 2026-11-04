'use strict';
/* Ayudas compartidas: en escritorio el panel usa pestañas y botones en cabecera;
   en móvil usa barra inferior, botón flotante, menú «Más» y filtros plegables. */
const isMobile = (p) => ((p.viewportSize() || { width: 1440 }).width <= 820);

async function go(p, view) {
  if (!isMobile(p)) return p.click(`.tabs [data-view=${view}]`);
  if (['inbox', 'dash', 'team', 'content', 'more'].includes(view)) return p.click(`.bottom-nav [data-view=${view}]`);
  await p.click('.bottom-nav [data-view=more]');
  return p.click(`#view-more [data-go=${view}]`);
}

const DESKTOP = { register: '#register', export: '#export-xlsx', copy: '#copy-xlsx', simnew: '#sim-new', simother: '#sim-other', reset: '#reset', logout: '#logout' };
const MORE = { export: '#m-export', copy: '#m-copy', simnew: '#m-sim-new', simother: '#m-sim-other', reset: '#m-reset', logout: '#m-logout' };
async function act(p, name) {
  if (!isMobile(p)) return p.click(DESKTOP[name]);
  if (name === 'register') { await go(p, 'inbox'); return p.click('#fab-register'); }
  await go(p, 'more');
  const r = await p.click(MORE[name]);
  if (name !== 'logout') await go(p, 'inbox');
  return r;
}

async function filters(p) {
  if (isMobile(p) && (await p.getAttribute('#f-toggle', 'aria-expanded')) !== 'true') await p.click('#f-toggle');
  return p;
}
module.exports = { go, act, filters, isMobile };
