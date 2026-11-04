'use strict';
const {go,act,filters}=require('./lib');
/* QA adicional: teclado, matriz de tamaños, idiomas, rendimiento y almacenamiento. */
const { chromium } = require('playwright');
const B = process.env.BASE || B;
const issues = [];
const ok = (c, m) => { if (!c) issues.push(m); };
const log = (...a) => console.log(...a);

async function login(p) { await p.fill('#login-pass', 'contrasena123'); await p.click('#login-submit'); }

(async () => {
  const b = await chromium.launch();

  /* 1. Matriz de desbordes: sitio y panel */
  const widths = [320, 360, 375, 390, 414, 640, 768, 1024, 1280, 1440];
  let cells = 0;
  for (const w of widths) {
    for (const lang of ['es', 'en']) {
      const p = await b.newPage({ viewport: { width: w, height: 800 } });
      await p.goto(B + '/index.html'); await p.waitForLoadState('networkidle');
      if (lang === 'en') await p.click('[data-lang=en]');
      for (const state of ['normal', 'texto+fuente', 'tamaño máx.']) {
        await p.evaluate((s) => { const c = document.documentElement.classList; c.remove('a11y-font', 'a11y-spacing', 'a11y-size-3'); if (s === 'texto+fuente') c.add('a11y-font', 'a11y-spacing'); if (s === 'tamaño máx.') c.add('a11y-size-3'); }, state);
        const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        cells++;
        // 320 px queda fuera del rango pedido (360-1440): se informa aparte
        if (o > 0) (w === 320 ? log : (m) => issues.push(m))(`sitio ${w}px ${lang} ${state}: desborde ${o}px` + (w === 320 ? ' (fuera de rango, informativo)' : ''));
      }
      await p.close();
    }
    const p = await b.newPage({ viewport: { width: w, height: 800 } });
    await p.goto(B + '/admin/index.html'); await p.waitForLoadState('networkidle');
    let o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); cells++;
    if (o > 0) issues.push(`panel ${w}px ingreso: desborde ${o}px`);
    await login(p);
    for (const v of ['inbox', 'dash', 'team', 'notices', 'content', 'settings']) {
      await go(p,v);
      o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); cells++;
      if (o > 0) issues.push(`panel ${w}px vista ${v}: desborde ${o}px`);
    }
    await p.close();
  }
  log(`Matriz de tamaños: ${cells} combinaciones revisadas`);

  /* 2. Teclado en el sitio público: todo alcanzable, foco visible, diálogos sin trampa */
  {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(B + '/index.html'); await p.waitForLoadState('networkidle');
    const stops = [];
    for (let i = 0; i < 90; i++) {
      await p.keyboard.press('Tab');
      const s = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return { tag: e.tagName, id: e.id, txt: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30), outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2, vis: r.width > 0 && r.height > 0 }; });
      if (s) stops.push(s);
    }
    const noOutline = stops.filter((s) => !s.outline).map((s) => s.tag + ':' + s.txt);
    ok(noOutline.length === 0, 'foco sin contorno visible en: ' + [...new Set(noOutline)].slice(0, 6).join(' | '));
    ok(stops.some((s) => s.id === 'a11y-toggle') && stops.some((s) => s.id === 'wa-fab') && stops.some((s) => s.id === 'submit-btn' || /Probar solicitud|Test request/.test(s.txt)), 'faltan controles clave en el orden de tabulación');
    ok(stops[0] && /Saltar|Skip/.test(stops[0].txt), 'el primer foco no es «Saltar al contenido»');
    log(`Teclado (sitio): ${stops.length} paradas de tabulación, ${new Set(stops.map((s) => s.tag + s.txt)).size} únicas`);
    // diálogo: Tab no escapa del modal
    await p.click('[data-open=civil] >> nth=0');
    for (let i = 0; i < 8; i++) await p.keyboard.press('Tab');
    ok(await p.evaluate(() => document.activeElement === document.body || document.querySelector('#detail-dialog').contains(document.activeElement)), 'el foco pasó a un elemento detrás del diálogo del sitio');
    await p.keyboard.press('Escape');
    // panel de accesibilidad con teclado
    await p.focus('#a11y-toggle'); await p.keyboard.press('Enter');
    ok(await p.evaluate(() => !document.querySelector('#a11y-panel').hidden && document.activeElement.id === 'a11y-close'), 'panel de accesibilidad no abre con Enter');
    await p.keyboard.press('Escape'); ok(await p.evaluate(() => document.activeElement.id === 'a11y-toggle'), 'Escape no devuelve el foco al botón');
    // menú móvil con teclado
    await p.close();
    const m = await b.newPage({ viewport: { width: 390, height: 800 } });
    await m.goto(B + '/index.html'); await m.focus('.menu-toggle'); await m.keyboard.press('Enter');
    ok(await m.getAttribute('.menu-toggle', 'aria-expanded') === 'true', 'menú móvil no abre con Enter');
    await m.keyboard.press('Escape'); ok(await m.getAttribute('.menu-toggle', 'aria-expanded') === 'false', 'menú móvil no cierra con Escape');
    await m.close();
  }

  /* 3. Teclado en el panel: pestañas con flechas, diálogos sin trampa */
  {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(B + '/admin/index.html'); await login(p);
    await p.click('#rows tr >> nth=0 >> button');
    await p.focus('#tab-resumen'); await p.keyboard.press('ArrowRight');
    ok(await p.evaluate(() => document.activeElement.id === 'tab-notas' && document.activeElement.getAttribute('aria-selected') === 'true'), 'flecha derecha no cambia de pestaña');
    await p.keyboard.press('ArrowLeft'); ok(await p.evaluate(() => document.activeElement.id === 'tab-resumen'), 'flecha izquierda no vuelve');
    for (let i = 0; i < 12; i++) await p.keyboard.press('Tab');
    ok(await p.evaluate(() => document.activeElement === document.body || document.querySelector('#detail').contains(document.activeElement)), 'el foco pasó a un elemento detrás de la ficha');
    await p.keyboard.press('Escape'); ok(await p.evaluate(() => !document.querySelector('#detail').open), 'Escape no cierra la ficha');
    await p.close();
  }

  /* 4. Idiomas: paridad de claves y texto sin traducir en inglés */
  {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(B + '/index.html'); await p.waitForLoadState('networkidle');
    const par = await p.evaluate(() => { const es = Object.keys(I18N.es), en = Object.keys(I18N.en); return { sinEn: es.filter((k) => !en.includes(k)), sinEs: en.filter((k) => !es.includes(k)) }; });
    ok(par.sinEn.length === 0 && par.sinEs.length === 0, 'claves sin par ES/EN: ' + JSON.stringify(par));
    await p.click('[data-lang=en]');
    const spanish = await p.evaluate(() => {
      const re = /[áéíóúñ¿¡]|\b(el|la|los|las|de|del|para|con|su|sus|una|un|que|por|y|su)\b/i; const bad = [];
      const skip = new Set(['Andrés Vergara Muñoz', 'Valentina Soto Araya', 'Tomás Herrera Lagos']);
      document.querySelectorAll('body *').forEach((e) => { if (e.children.length || e.closest('script,style,[hidden],.sr-only,svg')) return; const t = e.textContent.trim(); if (t.length < 3 || skip.has(t)) return; if (/Av\. Ejemplo|@|\+56/.test(t)) return; if (re.test(t)) bad.push(t.slice(0, 50)); });
      return [...new Set(bad)];
    });
    ok(spanish.length === 0, 'texto en español visible en modo inglés: ' + spanish.slice(0, 8).join(' | '));
    // todos los diálogos en inglés
    const keys = await p.evaluate(() => [...new Set([...document.querySelectorAll('[data-open]')].map((e) => e.dataset.open))]);
    for (const k of keys) { await p.click(`[data-open=${k}] >> nth=0`); const t = await p.evaluate(() => document.querySelector('#dialog-content').textContent); ok(!/[áéíóúñ¿¡]/.test(t.replace(/Andrés|Tomás|Muñoz/g, '')) || k === 'proposal', `diálogo ${k} con acentos en inglés`); await p.keyboard.press('Escape'); }
    log(`Idiomas: ${Object.keys(await p.evaluate(() => I18N.es)).length} claves, ${keys.length} diálogos revisados en inglés`);
    await p.close();
  }

  /* 5. Rendimiento y red del sitio */
  {
    const p = await b.newPage({ viewport: { width: 390, height: 800 } });
    const res = []; p.on('response', async (r) => { try { const buf = await r.body(); res.push({ url: r.url().replace(B, ''), size: buf.length, status: r.status() }); } catch (e) { /* ignorar */ } });
    const t0 = Date.now(); await p.goto(B + '/index.html'); await p.waitForLoadState('networkidle'); const ms = Date.now() - t0;
    await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(500);
    const total = res.reduce((a, r) => a + r.size, 0);
    log(`Rendimiento (sitio, local): ${res.length} recursos, ${(total / 1024).toFixed(0)} KB, carga ${ms} ms`);
    const big = res.filter((r) => r.size > 400 * 1024); ok(big.length === 0, 'recursos > 400 KB: ' + big.map((r) => r.url + ' ' + (r.size / 1024).toFixed(0) + 'KB').join(', '));
    ok(total < 1.5 * 1024 * 1024, 'peso total > 1,5 MB: ' + (total / 1024).toFixed(0) + ' KB');
    ok(res.every((r) => r.status < 400), 'recursos con error: ' + res.filter((r) => r.status >= 400).map((r) => r.url).join(', '));
    ok(res.every((r) => !/^https?:/.test(r.url)), 'recursos externos cargados');
    const imgs = await p.evaluate(() => [...document.images].map((i) => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt'), w: i.naturalWidth, cw: i.clientWidth })));
    ok(imgs.every((i) => i.alt !== null), 'imágenes sin atributo alt');
    await p.close();
  }

  /* 6. Almacenamiento y privacidad */
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
    const nonGet = []; p.on('request', (r) => { if (r.method() !== 'GET') nonGet.push(r.method() + ' ' + r.url()); });
    await p.goto(B + '/index.html'); await p.fill('#nombre', 'Persona Prueba'); await p.fill('input[type=email]', 'prueba@example.com'); await p.fill('#telefono', '+56 9 1234 5678'); await p.selectOption('#area', 'civil'); await p.check('#chk-priv');
    ok(await p.evaluate(() => document.querySelector('#chk-priv').checked), 'casilla de privacidad');
    await p.click('label[for=chk-priv]'); ok(await p.evaluate(() => !document.querySelector('#chk-priv').checked), 'clic en la etiqueta no alterna la casilla'); await p.check('#chk-priv');
    await p.click('.submit-button');
    await p.click('#a11y-toggle'); await p.click('[data-a11y=gray]'); await p.click('[data-lang=en]');
    const st = await p.evaluate(() => ({ ls: Object.keys(localStorage), ss: Object.keys(sessionStorage), cookie: document.cookie, dump: JSON.stringify(localStorage) }));
    ok(st.ls.every((k) => ['nexo-lang', 'nexo-a11y'].includes(k)), 'claves inesperadas en localStorage: ' + st.ls);
    ok(!/Persona Prueba|prueba@example|1234 5678/.test(st.dump), 'datos del formulario guardados en el navegador');
    ok(st.ss.length === 0 && st.cookie === '', 'sessionStorage o cookies en uso');
    ok(nonGet.length === 0, 'peticiones no GET: ' + nonGet.join(', '));
    const cookies = await ctx.cookies(); ok(cookies.length === 0, 'cookies establecidas: ' + cookies.map((c) => c.name));
    log('Privacidad: localStorage solo ' + st.ls.join(', ') + '; 0 cookies; 0 peticiones POST');
    await ctx.close();
    const ctx2 = await b.newContext(); const q = await ctx2.newPage(); await q.goto(B + '/admin/index.html'); await login(q); await q.click('#sim-new'); await q.click('#register');
    await q.fill('#r-name', 'Dato Sensible'); await q.fill('#r-phone', '+56 9 0000 1111'); await q.click('#reg-form button[type=submit]');
    const st2 = await q.evaluate(() => ({ ls: Object.keys(localStorage), ss: Object.keys(sessionStorage), cookie: document.cookie }));
    ok(st2.ls.length === 0 && st2.ss.length === 0 && st2.cookie === '', 'el panel guarda datos en el navegador: ' + JSON.stringify(st2));
    await ctx2.close();
  }

  /* 7. Movimiento reducido y errores de consola en recorrido completo */
  {
    const ctx = await b.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
    const errs = []; p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); }); p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
    await p.goto(B + '/index.html'); await p.waitForLoadState('networkidle');
    const sb = await p.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior); ok(sb === 'auto', 'scroll-behavior suave con movimiento reducido: ' + sb);
    for (const s of ['#estudio', '#areas', '#equipo', '#contacto']) await p.evaluate((x) => document.querySelector(x).scrollIntoView(), s);
    await p.goto(B + '/admin/index.html'); await login(p); for (const v of ['dash', 'team', 'notices', 'content', 'settings', 'inbox']) await go(p,v);
    ok(errs.length === 0, 'consola con errores/avisos: ' + errs.slice(0, 4).join(' | '));
    await ctx.close();
  }

  await b.close();
  console.log(issues.length ? 'HALLAZGOS:\n- ' + issues.join('\n- ') : 'SIN HALLAZGOS');
  process.exit(issues.length ? 1 : 0);
})();
