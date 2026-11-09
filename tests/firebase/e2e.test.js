'use strict';
/* Prueba de punta a punta con los emuladores de Firebase (Hosting + Auth + Firestore).
   Ejecutar con: npm run test:e2e */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const path = require('path');
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'; process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
const { initializeApp } = require('firebase-admin/app'); const { getFirestore, Timestamp } = require('firebase-admin/firestore'); const { getAuth } = require('firebase-admin/auth');
initializeApp({ projectId: 'demo-nexo' });
const adb = getFirestore(), aauth = getAuth();
const BASE = 'http://127.0.0.1:5000';
const issues = []; const ok = (c, m) => { if (!c) issues.push(m); }; const log = (...a) => console.log(...a);
const until = async (fn, ms = 8000) => { const t0 = Date.now(); for (;;) { const v = await fn(); if (v) return v; if (Date.now() - t0 > ms) return null; await new Promise((r) => setTimeout(r, 150)); } };
const consultas = async () => (await adb.collection('consultas').get()).docs.map((d) => Object.assign({ id: d.id }, d.data()));
const PASS = { 'andres@nexo-demo.example': 'Contrasena-Segura-1', 'valentina@nexo-demo.example': 'Contrasena-Segura-2' };

async function login(page, email, pass) {
  await page.goto(BASE + '/admin/'); await page.waitForSelector('#login-email'); await page.fill('#login-email', email); await page.fill('#login-pass', pass); await page.click('#login-submit');
}
async function panel(b, email, vp) {
  const ctx = await b.newContext({ viewport: vp || { width: 1440, height: 900 }, hasTouch: !!(vp && vp.width < 700), isMobile: !!(vp && vp.width < 700) }); const page = await ctx.newPage();
  const errs = []; page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); page.on('pageerror', (e) => errs.push('JS ' + e.message));
  await login(page, email, PASS[email]); await page.waitForSelector('#app:not([hidden])', { timeout: 15000 }); await page.waitForSelector('#rows tr', { timeout: 15000 });
  return { ctx, page, errs };
}

(async () => {
  execFileSync(process.execPath, [path.join(__dirname, '../../scripts/seed.js'), '--emulator'], { stdio: 'inherit' });
  const b = await chromium.launch();
  const uidOf = async (email) => (await aauth.getUserByEmail(email)).uid;
  const u1 = await uidOf('andres@nexo-demo.example'), u2 = await uidOf('valentina@nexo-demo.example');

  /* ===== 1. Sitio público ===== */
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
    const errs = []; p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', (e) => errs.push('JS ' + e.message));
    await p.goto(BASE + '/index.html'); await p.waitForLoadState('load');
    ok(await p.evaluate(() => window.NEXO_BACKEND === 'firebase'), 'el sitio no está en modo firebase');
    // contenido publicado se refleja
    const hero = (await adb.doc('contenido_publicado/hero').get()).data(); hero.campos['hero.title'] = { es: 'Titular en vivo. Desde Firestore.', en: 'Live headline. From Firestore.' };
    await adb.doc('contenido_publicado/hero').set(hero); await p.reload(); await p.waitForLoadState('load');
    await until(async () => /Titular en vivo/.test(await p.textContent('h1')), 6000); ok(/Titular en vivo/.test(await p.textContent('h1')), 'el contenido publicado no llegó al sitio (ES)');
    await p.click('[data-lang=en]'); ok(/Live headline/.test(await p.textContent('h1')), 'el contenido publicado no llegó al sitio (EN)');
    await p.click('[data-lang=es]');
    // textos en vivo (ya no dice «demostración»)
    ok(!/No envía ni guarda/.test(await p.textContent('#contacto')), 'el formulario sigue diciendo que no guarda datos');
    // formulario inválido (sin contacto)
    await p.fill('#nombre', 'Persona Prueba'); await p.selectOption('#area', 'laboral'); await p.check('#chk-priv'); await p.click('.submit-button');
    ok((await p.evaluate(() => document.querySelector('#form-status').hidden)), 'el formulario aceptó sin correo ni teléfono');
    // envío válido
    const antes = (await consultas()).length;
    await p.fill('#contacto-dato', 'cliente.real@example.com'); await p.fill('#telefono', '+56 9 1234 5678'); await p.click('.submit-button');
    await p.waitForFunction(() => /código de seguimiento es C-/.test(document.querySelector('#form-status').textContent), null, { timeout: 15000 });
    const cod = (await p.textContent('#form-status')).match(/C-[0-9A-Z]+/)[0];
    const d = (await adb.doc('consultas/' + cod).get()).data(); ok(!!d, 'la consulta no quedó en Firestore');
    if (d) { ok(d.estado === 'nueva' && d.responsable === null && d.canal === 'formulario' && d.consentimiento.aceptado === true && d.nombre === 'Persona Prueba' && d.area === 'laboral' && d.manual === false, 'datos de la consulta incorrectos: ' + JSON.stringify(d)); ok(d.createdAt && d.historial.length === 1, 'sin fecha del servidor o historial inicial'); }
    ok(await p.evaluate(() => document.querySelector('#nombre').value === ''), 'el formulario no se limpió');
    // límite de envíos
    await p.fill('#nombre', 'Otra Persona'); await p.fill('#contacto-dato', 'otra@example.com'); await p.selectOption('#area', 'civil'); await p.check('#chk-priv'); await p.click('.submit-button');
    await p.waitForFunction(() => /Espere unos segundos/.test(document.querySelector('#form-status').textContent), null, { timeout: 5000 }).catch(() => {});
    ok(/Espere unos segundos/.test(await p.textContent('#form-status')), 'no limita envíos seguidos'); ok((await consultas()).length === antes + 1, 'se creó una consulta de más');
    // campo trampa
    const ctx2 = await b.newContext(); const p2 = await ctx2.newPage(); await p2.goto(BASE + '/index.html'); await p2.waitForLoadState('load');
    await p2.fill('#nombre', 'Bot Malo'); await p2.fill('#contacto-dato', 'bot@example.com'); await p2.selectOption('#area', 'civil'); await p2.check('#chk-priv');
    await p2.evaluate(() => { document.querySelector('input[name=website]').value = 'http://spam.example'; }); const n0 = (await consultas()).length; await p2.click('.submit-button'); await p2.waitForTimeout(1200);
    ok((await consultas()).length === n0, 'el campo trampa no detuvo al bot');
    ok(errs.filter((e) => !/favicon/.test(e)).length === 0, 'errores de consola en el sitio: ' + errs.slice(0, 3).join(' | '));
    // el público no puede leer
    const r = await p2.evaluate(async () => { try { await window.NexoFB.getDocs(window.NexoFB.collection(window.NexoFB.db, 'consultas')); return 'LEYÓ'; } catch (e) { return e.code; } });
    ok(r === 'permission-denied', 'el público pudo leer consultas: ' + r);
    const r2 = await p2.evaluate(async () => { try { await window.NexoFB.getDocs(window.NexoFB.collection(window.NexoFB.db, 'socios')); return 'LEYÓ'; } catch (e) { return e.code; } }); ok(r2 === 'permission-denied', 'el público pudo leer socios: ' + r2);
    await ctx.close(); await ctx2.close(); log('Sitio público: formulario real, límite, trampa y lectura bloqueada comprobados');
    globalThis.__cod = cod;
  }

  /* ===== 2. Panel: acceso ===== */
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
    await login(p, 'andres@nexo-demo.example', 'contrasena-incorrecta-123'); await p.waitForSelector('#login-error:not([hidden])');
    ok(/No pudimos verificar/.test(await p.textContent('#login-error')) && /intentos/.test(await p.textContent('#login-error')), 'mensaje de error de acceso');
    ok(await p.isVisible('#login'), 'el panel se abrió con contraseña incorrecta');
    await p.fill('#login-email', 'nadie@nexo-demo.example'); await p.fill('#login-pass', 'cualquier-contrasena-1'); await p.click('#login-submit'); await p.waitForTimeout(800);
    ok(/No pudimos verificar/.test(await p.textContent('#login-error')), 'usuario inexistente revela información');
    // cuenta válida pero sin perfil de socio
    await aauth.createUser({ email: 'intruso@nexo-demo.example', password: 'Intruso-Contrasena-1', emailVerified: true }).catch(() => {});
    await p.fill('#login-email', 'intruso@nexo-demo.example'); await p.fill('#login-pass', 'Intruso-Contrasena-1'); await p.click('#login-submit');
    await p.waitForFunction(() => /no tiene acceso/.test(document.querySelector('#login-error').textContent), null, { timeout: 8000 }).catch(() => {});
    ok(/no tiene acceso/.test(await p.textContent('#login-error')) && await p.isVisible('#login'), 'una cuenta sin perfil de socio entró al panel');
    ok(!(await p.evaluate(() => !!window.NexoFB.auth.currentUser)), 'la cuenta sin acceso quedó con la sesión abierta');
    // bloqueo tras 5 intentos fallidos
    for (let i = 0; i < 5; i++) { await p.fill('#login-email', 'andres@nexo-demo.example'); await p.fill('#login-pass', 'mala-contrasena-' + i + '-xx'); await p.waitForFunction(() => !document.querySelector('#login-submit').disabled, null, { timeout: 8000 }).catch(() => {}); if (!(await p.$eval('#login-submit', (e) => e.disabled))) await p.click('#login-submit'); await p.waitForTimeout(500); }
    ok(await p.$eval('#login-submit', (e) => e.disabled) || /Demasiados/.test(await p.textContent('#login-error')), 'sin bloqueo tras intentos fallidos');
    await ctx.close(); log('Acceso: error genérico, cuenta sin perfil rechazada y bloqueo por intentos comprobados');
  }

  /* ===== 3. Panel: operación de un socio (escritorio) ===== */
  const s1 = await panel(b, 'andres@nexo-demo.example', null); const P = s1.page; const cod = globalThis.__cod;
  {
    const total = await P.evaluate(() => document.querySelectorAll('#rows tr').length); ok(total === 23, 'debería listar 22 de demostración + 1 real: ' + total);
    ok(await P.evaluate(() => document.querySelectorAll('#rows tr .chip').length > 0), 'sin etiqueta Demo');
    ok(!(await P.isVisible('#sim-new')) && !(await P.isVisible('#reset')), 'herramientas de demostración visibles en el panel real');
    ok((await P.textContent('.tabs [data-view=notices]')) === 'Actividad', 'pestaña Actividad');
    // abrir la consulta real (la más reciente, arriba)
    await P.fill('#f-q', cod); await P.waitForFunction(() => document.querySelectorAll('#rows tr').length === 1);
    await P.click('#rows tr >> button'); await P.click('text=Tomar esta consulta');
    let doc = await until(async () => { const d = (await adb.doc('consultas/' + cod).get()).data(); return d.responsable === u1 ? d : null; });
    ok(doc && doc.estado === 'tomada' && doc.historial.length === 2 && doc.historial[1].texto.includes('Tomó'), 'tomar no guardó: ' + JSON.stringify(doc && doc.historial));
    await P.click('.seg >> nth=1'); doc = await until(async () => { const d = (await adb.doc('consultas/' + cod).get()).data(); return d.estado === 'espera' ? d : null; }); ok(!!doc, 'cambio de estado no guardado');
    await P.click('[role=tab]:has-text("Notas")'); await P.fill('#d-note', 'Nota de prueba e2e'); await P.click('text=Agregar nota');
    doc = await until(async () => { const d = (await adb.doc('consultas/' + cod).get()).data(); return d.notas.length === 1 ? d : null; }); ok(doc && doc.notas[0].texto === 'Nota de prueba e2e', 'nota no guardada');
    await P.click('[role=tab]:has-text("Reasignar")'); await P.selectOption('#d-to', u2); await P.fill('#d-reason', 'Equilibrar carga'); await P.click('button.btn:text-is("Reasignar")');
    doc = await until(async () => { const d = (await adb.doc('consultas/' + cod).get()).data(); return d.responsable === u2 ? d : null; });
    ok(doc && /Reasignó a Valentina/.test(doc.historial[doc.historial.length - 1].texto) && doc.historial.length >= 5, 'reasignación no guardada');
    ok(doc && doc.historial[0].texto.includes('recibida') || (doc && doc.historial[0].quien === 'Sistema'), 'se perdió el historial inicial');
    await P.keyboard.press('Escape'); await P.fill('#f-q', '');
    // registro manual
    await P.click('#register'); await P.fill('#r-name', 'Pedro WhatsApp'); await P.fill('#r-phone', '+56 9 7777 8888'); await P.selectOption('#r-channel', 'whatsapp'); await P.fill('#r-summary', 'Consulta breve'); await P.click('#reg-form button[type=submit]');
    const man = await until(async () => (await consultas()).find((c) => c.nombre === 'Pedro WhatsApp')); ok(man && man.manual === true && man.canal === 'whatsapp' && man.responsable === u1 && man.estado === 'tomada', 'registro manual no guardado');
    // plazo
    await P.click('.tabs [data-view=settings]'); await P.fill('#s-sla', '12'); await P.click('text=Aplicar plazo'); const cfg = await until(async () => { const d = (await adb.doc('config/general').get()).data(); return d.slaHoras === 12 ? d : null; }); ok(!!cfg, 'plazo no guardado');
    // exportar
    await P.click('.tabs [data-view=inbox]'); const [dl] = await Promise.all([P.waitForEvent('download'), P.click('#export-xlsx')]); ok(/\.xlsx$/.test(dl.suggestedFilename()), 'exportación');
    // dashboard
    await P.click('.tabs [data-view=dash]'); ok((await P.$$('#view-dash svg.chart')).length === 5, 'dashboard sin 5 gráficos');
    // actividad (auditoría)
    await P.click('.tabs [data-view=notices]'); const nAud = await until(async () => (await adb.collection('auditoria').get()).size >= 6 ? true : null); ok(!!nAud, 'auditoría con pocos registros');
    ok(await P.evaluate(() => /Tomó una consulta|Registró/.test(document.querySelector('#log').textContent)), 'la actividad no se ve en el panel');
    // editor de contenido: autoguardado y publicación
    await P.click('.tabs [data-view=content]'); await P.click('.ed-lang >> nth=0 >> button >> nth=0');
    await P.fill('#f-hero_title-es', 'Editado desde el panel. Y publicado.'); await P.fill('#f-hero_title-en', 'Edited from the panel. And published.');
    const bor = await until(async () => { const d = (await adb.doc('contenido_borrador/hero').get()).data(); return d && d.campos['hero.title'] && /Editado desde/.test(d.campos['hero.title'].es) ? d : null; }); ok(!!bor, 'el borrador no se autoguardó');
    ok(/Editado desde/.test(JSON.stringify((await adb.doc('contenido_publicado/hero').get()).data())) === false, 'el borrador se publicó solo');
    await P.click('#ed-publish'); await P.click('#confirm-ok');
    const pubd = await until(async () => { const d = (await adb.doc('contenido_publicado/hero').get()).data(); return /Editado desde/.test(d.campos['hero.title'].es) ? d : null; }); ok(pubd && pubd.version === 2 && pubd.actualizadoPor === u1, 'la publicación no llegó a Firestore');
    const pc = await b.newContext(); const pp = await pc.newPage(); await pp.goto(BASE + '/index.html'); await pp.waitForLoadState('load'); await until(async () => /Editado desde/.test(await pp.textContent('h1')), 6000); ok(/Editado desde/.test(await pp.textContent('h1')), 'lo publicado no aparece en el sitio'); await pc.close();
    log('Operación del socio: tomar, estado, notas, reasignar, registro manual, plazo, exportar, dashboard, actividad y publicar contenido comprobados');
  }

  /* ===== 3b. Cambio y recuperación de contraseña ===== */
  {
    const x = await panel(b, 'tomas@nexo-demo.example', null).catch(() => null);
    PASS['tomas@nexo-demo.example'] = 'Contrasena-Segura-3';
    const y = x || await panel(b, 'tomas@nexo-demo.example', null); const q = y.page;
    await q.click('.tabs [data-view=settings]'); await q.fill('#pw-old', 'Contrasena-Segura-3'); await q.fill('#pw-new', 'corta'); await q.fill('#pw-new2', 'corta'); await q.click('#pw-form button[type=submit]');
    ok(/al menos 12/.test(await q.textContent('#pw-err')), 'acepta contraseña corta');
    await q.fill('#pw-new', 'Nueva-Contrasena-Larga-7'); await q.fill('#pw-new2', 'Nueva-Contrasena-Larga-7'); await q.fill('#pw-old', 'incorrecta-actual-1'); await q.click('#pw-form button[type=submit]');
    await q.waitForFunction(() => !document.querySelector('#pw-err').hidden, null, { timeout: 8000 }).catch(() => {}); ok(/actual no es correcta/.test(await q.textContent('#pw-err')), 'acepta una contraseña actual incorrecta');
    await q.fill('#pw-old', 'Contrasena-Segura-3'); await q.click('#pw-form button[type=submit]'); await q.waitForFunction(() => !document.querySelector('#pw-msg').hidden, null, { timeout: 8000 }).catch(() => {}); ok(/Contraseña cambiada/.test(await q.textContent('#pw-msg')), 'no cambió la contraseña');
    await q.click('#logout'); await y.ctx.close();
    const c2 = await b.newContext(); const q2 = await c2.newPage(); await login(q2, 'tomas@nexo-demo.example', 'Contrasena-Segura-3'); await q2.waitForSelector('#login-error:not([hidden])', { timeout: 8000 }); ok(await q2.isVisible('#login'), 'la contraseña anterior sigue funcionando');
    await q2.fill('#login-pass', 'Nueva-Contrasena-Larga-7'); await q2.click('#login-submit'); await q2.waitForSelector('#app:not([hidden])', { timeout: 15000 }).catch(() => {}); ok(await q2.isVisible('#app'), 'no entra con la contraseña nueva');
    await q2.click('#logout'); await q2.fill('#login-email', 'tomas@nexo-demo.example'); await q2.click('#forgot'); await q2.waitForFunction(() => /recibirás instrucciones/.test(document.querySelector('#login-msg').textContent), null, { timeout: 8000 }).catch(() => {}); ok(/recibirás instrucciones/.test(await q2.textContent('#login-msg')), 'recuperar contraseña sin mensaje'); await c2.close();
    log('Contraseña: validaciones, cambio, rechazo de la anterior y recuperación comprobados');
  }

  /* ===== 4. Concurrencia: dos socios toman la misma consulta ===== */
  {
    const id = 'C-CONCURR01'; await adb.doc('consultas/' + id).set({ nombre: 'Carrera de Dos', email: 'c@example.com', telefono: '', area: 'civil', canal: 'formulario', estado: 'nueva', responsable: null, manual: false, idioma: 'es', consentimiento: { aceptado: true, version: 'v' }, createdAt: Timestamp.now(), actualizadoAt: Timestamp.now(), historial: [{ at: Date.now(), quien: 'Sistema', texto: 'Consulta recibida.' }], notas: [] });
    const a = await panel(b, 'andres@nexo-demo.example', null), c = await panel(b, 'valentina@nexo-demo.example', null);
    for (const x of [a, c]) { await x.page.fill('#f-q', 'Carrera de Dos'); await x.page.waitForFunction(() => document.querySelectorAll('#rows tr').length === 1); await x.page.click('#rows tr >> button'); await x.page.waitForSelector('text=Tomar esta consulta'); }
    await Promise.all([a.page.click('text=Tomar esta consulta'), c.page.click('text=Tomar esta consulta')]); await a.page.waitForTimeout(1500);
    const fin = (await adb.doc('consultas/' + id).get()).data(); ok([u1, u2].includes(fin.responsable), 'nadie tomó la consulta'); ok(fin.historial.filter((h) => /Tomó la consulta/.test(h.texto)).length === 1, 'las dos tomas quedaron registradas: ' + JSON.stringify(fin.historial.map((h) => h.texto)));
    const toasts = await Promise.all([a.page.textContent('#toast'), c.page.textContent('#toast')]); ok(toasts.filter((t) => /Ya la tomó/.test(t)).length === 1, 'exactamente un socio debía ver «Ya la tomó»: ' + toasts.join(' / '));
    await a.ctx.close(); await c.ctx.close(); log('Concurrencia: solo un socio logra tomar la misma consulta');
  }

  /* ===== 5. Móvil: tomar con un toque y deshacer ===== */
  {
    const m = await panel(b, 'valentina@nexo-demo.example', { width: 390, height: 844 }); const mp = m.page;
    ok(await mp.isVisible('.bottom-nav'), 'sin barra inferior en móvil'); const nTake = await mp.evaluate(() => document.querySelectorAll('.btn-take').length); ok(nTake >= 1, 'sin botón Tomar en móvil');
    const before = (await consultas()).filter((c) => c.estado === 'nueva' && !c.responsable).length;
    await mp.tap('.btn-take >> nth=0'); await until(async () => (await consultas()).filter((c) => c.estado === 'nueva' && !c.responsable).length === before - 1 ? true : null); ok((await consultas()).filter((c) => c.estado === 'nueva' && !c.responsable).length === before - 1, 'tomar con un toque no guardó');
    await mp.tap('.toast-btn'); await until(async () => (await consultas()).filter((c) => c.estado === 'nueva' && !c.responsable).length === before ? true : null); ok((await consultas()).filter((c) => c.estado === 'nueva' && !c.responsable).length === before, 'deshacer no restauró');
    ok((await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0, 'desborde en móvil');
    ok(m.errs.filter((e) => !/favicon/.test(e)).length === 0, 'errores de consola en móvil: ' + m.errs.slice(0, 2).join(' | ')); await m.ctx.close(); log('Móvil: tomar con un toque y deshacer comprobados');
  }

  /* ===== 6. Limpieza de demostración y cierre de sesión ===== */
  {
    await P.click('.tabs [data-view=settings]'); await P.click('#del-demo'); await P.click('#del-demo');
    await until(async () => (await consultas()).filter((c) => c.demo).length === 0 ? true : null);
    const rest = await consultas(); ok(rest.filter((c) => c.demo).length === 0, 'quedaron consultas de demostración'); ok(rest.some((c) => c.id === cod), 'se borró una consulta real'); ok(rest.length >= 3, 'se borraron consultas reales');
    ok(s1.errs.filter((e) => !/favicon/.test(e)).length === 0, 'errores de consola en el panel: ' + s1.errs.slice(0, 3).join(' | '));
    await P.click('#logout'); ok(await P.isVisible('#login') && (await P.evaluate(() => document.querySelectorAll('#rows tr').length === 0)), 'cerrar sesión no vació la pantalla'); ok(!(await P.evaluate(() => !!window.NexoFB.auth.currentUser)), 'la sesión de Firebase sigue abierta');
    log('Demostración eliminada (las consultas reales se conservan) y sesión cerrada');
  }
  await b.close();
  console.log(issues.length ? 'HALLAZGOS:\n- ' + issues.join('\n- ') : 'SIN HALLAZGOS');
  process.exit(issues.length ? 1 : 0);
})().catch((e) => { console.error('ERROR e2e:', e); process.exit(1); });
