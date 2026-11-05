'use strict';
/* UX móvil del panel: criterios medibles de la experiencia tipo app. */
const { chromium } = require('playwright');
const { go } = require('./lib');
const B = process.env.BASE || 'http://localhost:8123';
const issues = []; const ok = (c, m) => { if (!c) issues.push(m); };

(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[360, 740], [390, 844], [430, 932]]) {
    const t = `${w}x${h}`;
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const p = await ctx.newPage(); p.on('pageerror', (e) => issues.push(t + ' JS ' + e.message));
    await p.goto(B + '/admin/index.html'); await p.fill('#login-pass', 'contrasena123'); await p.click('#login-submit'); await p.waitForTimeout(250);

    // Estructura de app: barra inferior visible, pestañas de escritorio ocultas
    ok(await p.isVisible('.bottom-nav') && !(await p.isVisible('.tabs')), t + ' barra inferior / pestañas');
    const nav = await p.evaluate(() => [...document.querySelectorAll('.bottom-nav button')].map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
    ok(nav.length === 5 && nav.every(([ww, hh]) => ww >= 44 && hh >= 48), t + ' botones de la barra inferior < 44×48: ' + JSON.stringify(nav));
    const navBox = await p.evaluate(() => { const r = document.querySelector('.bottom-nav').getBoundingClientRect(); return { bottom: Math.round(r.bottom), top: Math.round(r.top) }; });
    ok(navBox.bottom === h, t + ' la barra inferior no queda pegada al borde: ' + navBox.bottom);

    // Cabecera compacta: banner + barra superior ≤ 140 px
    const head = await p.evaluate(() => { const r = document.querySelector('.top').getBoundingClientRect(); const b = document.querySelector('.demo-banner').getBoundingClientRect(); return Math.round(r.bottom); });
    ok(head <= 140, t + ' cabecera ocupa ' + head + ' px (máx. 140)');

    // Lista compacta: tarjetas ≤ 130 px y al menos 3 completas en la primera pantalla
    const cards = await p.evaluate(() => [...document.querySelectorAll('#rows tr')].slice(0, 8).map((e) => { const r = e.getBoundingClientRect(); return { h: Math.round(r.height), bottom: Math.round(r.bottom) }; }));
    ok(cards.every((c) => c.h <= 150), t + ' tarjetas más altas de 150 px: ' + cards.map((c) => c.h));
    const navTop = navBox.top; const visibleFull = cards.filter((c) => c.bottom <= navTop).length;
    ok(visibleFull >= (h >= 800 ? 3 : 2), t + ' solo ' + visibleFull + ' tarjetas completas en la primera pantalla');

    // Acción rápida: «Tomar» desde la tarjeta, con aviso y «Deshacer»
    const q0 = await p.evaluate(() => document.querySelectorAll('#rows tr.has-quick').length);
    ok(q0 >= 3, t + ' faltan tarjetas con acción rápida (' + q0 + ')');
    const tb = await p.evaluate(() => { const r = document.querySelector('.btn-take').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
    ok(tb[0] >= 44 && tb[1] >= 44, t + ' el botón Tomar mide ' + tb);
    ok(/Quedan|Vencida/.test(await p.textContent('#rows tr.has-quick .quick-info')), t + ' falta el plazo en la tarjeta');
    await p.tap('#rows tr.has-quick >> nth=0 >> .btn-take');
    ok(!(await p.evaluate(() => document.querySelector('#detail').open)), t + ' «Tomar» abrió la ficha en vez de tomar');
    ok((await p.evaluate(() => document.querySelectorAll('#rows tr.has-quick').length)) === q0 - 1, t + ' «Tomar» no cambió la lista');
    ok(/Tomaste la consulta/.test(await p.textContent('#toast')) && (await p.isVisible('.toast-btn')), t + ' sin aviso con «Deshacer»');
    await p.tap('.toast-btn');
    ok((await p.evaluate(() => document.querySelectorAll('#rows tr.has-quick').length)) === q0, t + ' «Deshacer» no restauró la consulta');
    await p.focus('#rows tr.has-quick >> nth=0 >> .btn-take'); await p.keyboard.press('Enter');
    ok((await p.evaluate(() => document.querySelectorAll('#rows tr.has-quick').length)) === q0 - 1, t + ' «Tomar» no responde al teclado');
    await p.tap('.toast-btn');

    // Una tarjeta entera es tocable
    await p.tap('#rows tr >> nth=1', { position: { x: 30, y: 20 } });
    ok(await p.evaluate(() => document.querySelector('#detail').open), t + ' tocar la tarjeta no abre la ficha');
    const full = await p.evaluate(() => { const r = document.querySelector('#detail').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
    ok(full[0] === w && full[1] >= h - 2, t + ' la ficha no ocupa la pantalla completa: ' + full);
    const tabs = await p.evaluate(() => [...document.querySelectorAll('#detail .tab-d, #detail .close, #detail .detail-nav .btn')].map((e) => { const r = e.getBoundingClientRect(); return Math.round(r.height); }));
    ok(tabs.every((x) => x >= 44), t + ' controles de la ficha < 44 px: ' + tabs);
    await p.keyboard.press('Escape');

    // Filtros rápidos (chips) y búsqueda
    const total = await p.evaluate(() => document.querySelectorAll('#rows tr').length);
    await p.tap('#tiles .tile >> nth=0');
    const c1 = await p.evaluate(() => document.querySelectorAll('#rows tr').length);
    ok(c1 < total && c1 > 0, t + ' el chip «Sin tomar» no filtra (' + total + '→' + c1 + ')');
    ok((await p.getAttribute('#tiles .tile >> nth=0', 'aria-pressed')) === 'true', t + ' chip sin estado activo');
    await p.tap('#tiles .tile >> nth=0');
    ok((await p.evaluate(() => document.querySelectorAll('#rows tr').length)) === total, t + ' el chip no se desactiva');
    await p.fill('#f-q', 'camila'); ok((await p.evaluate(() => document.querySelectorAll('#rows tr').length)) === 1, t + ' la búsqueda no filtra'); await p.fill('#f-q', '');
    ok(!(await p.isVisible('#f-status')), t + ' los filtros avanzados deberían estar plegados');
    await p.tap('#f-toggle'); ok(await p.isVisible('#f-status'), t + ' el botón Filtros no despliega');
    await p.selectOption('#f-status', 'cerrada'); ok(await p.isVisible('#f-badge'), t + ' sin indicador de filtros activos'); await p.selectOption('#f-status', ''); await p.tap('#f-toggle');
    const inp = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#f-q')).fontSize)); ok(inp >= 16, t + ' el campo de búsqueda mide ' + inp + ' px (iOS hace zoom bajo 16)');

    // Botón flotante: visible en Consultas, oculto en otras vistas, compacto al bajar
    ok(await p.isVisible('#fab-register'), t + ' FAB no visible');
    await p.evaluate(() => scrollTo(0, 600)); await p.waitForTimeout(300);
    ok(await p.evaluate(() => document.querySelector('#fab-register').classList.contains('fab-mini')), t + ' FAB no se compacta al bajar');
    await p.evaluate(() => scrollTo(0, 0));
    await p.tap('#fab-register'); ok(await p.evaluate(() => document.querySelector('#detail').open && /Registrar consulta/.test(document.querySelector('#detail-title').textContent)), t + ' FAB no abre el registro'); await p.keyboard.press('Escape');

    // Navegación inferior: título superior y FAB según vista
    for (const [v, title] of [['dash', 'Dashboard'], ['team', 'Equipo'], ['content', 'Contenido'], ['more', 'Más'], ['inbox', 'Consultas']]) {
      await go(p, v); ok((await p.textContent('#top-title')) === title, t + ' título superior de ' + v);
      ok((await p.getAttribute(`.bottom-nav [data-view=${v}]`, 'aria-current')) === 'page', t + ' aria-current en ' + v);
      if (v !== 'inbox') ok(!(await p.isVisible('#fab-register')), t + ' FAB visible en ' + v);
      ok((await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0, t + ' desborde en ' + v);
    }
    // Más: cuenta, secciones y herramientas
    await go(p, 'more');
    await p.selectOption('#actor-m', 'p2'); ok((await p.textContent('#more-name')).includes('Valentina'), t + ' cambiar de socio en Más');
    ok((await p.getAttribute('#avatar-img', 'src')).includes('partner-2'), t + ' el avatar no cambia');
    await p.tap('[data-go=settings]'); ok((await p.textContent('#top-title')) === 'Ajustes' && (await p.getAttribute('.bottom-nav [data-view=more]', 'aria-current')) === 'page', t + ' Ajustes desde Más');
    await go(p, 'more'); await p.tap('#avatar-btn');
    for (const id of ['#m-export', '#m-sim-new', '#m-sim-other', '#m-reset', '#m-logout']) ok(await p.isVisible(id), t + ' falta ' + id + ' en Más');
    const mh = await p.evaluate(() => [...document.querySelectorAll('#view-more button, #view-more a')].map((e) => Math.round(e.getBoundingClientRect().height)));
    ok(mh.every((x) => x >= 44), t + ' elementos de Más < 44 px: ' + mh);
    await go(p, 'inbox');

    // Editor de contenido: barra de acciones compacta, abre en español, acciones visibles
    await go(p, 'content');
    ok(await p.evaluate(() => document.querySelector('.ed-card').dataset.view === 'es'), t + ' el editor debería abrir en español en móvil');
    const bar = await p.evaluate(() => Math.round(document.querySelector('.ed-actions').getBoundingClientRect().height));
    ok(bar <= 120, t + ' barra de acciones del editor ocupa ' + bar + ' px');
    await go(p, 'inbox');

    // Textos y objetivos mínimos en la vista principal
    const tiny = await p.evaluate(() => [...document.querySelectorAll('#rows td, #tiles *, .bottom-nav span, #count')].filter((e) => e.children.length === 0 && e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < 12).map((e) => e.textContent.trim().slice(0, 15)));
    ok(tiny.length === 0, t + ' textos menores de 12 px: ' + tiny.slice(0, 4));
    const small = await p.evaluate(() => [...document.querySelectorAll('.bottom-nav button, #tiles .tile, #f-toggle, #fab-register, #avatar-btn')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 44 || r.width < 44); }).map((e) => e.className || e.id));
    ok(small.length === 0, t + ' controles principales < 44 px: ' + small);
    ok(await p.evaluate(() => /viewport-fit=cover/.test(document.querySelector('meta[name=viewport]').content)), t + ' falta viewport-fit=cover (área segura)');
    await p.screenshot({ path: (process.env.OUT || require('os').tmpdir()) + `/qa-movil-${w}.png` });
    await ctx.close();
  }
  await b.close();
  console.log(issues.length ? 'HALLAZGOS:\n- ' + issues.join('\n- ') : 'SIN HALLAZGOS');
  process.exit(issues.length ? 1 : 0);
})();
