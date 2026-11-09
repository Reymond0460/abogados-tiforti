'use strict';
/* Pruebas de las reglas de seguridad de Firestore (emulador). Ejecutar con: npm run test:rules */
const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc, serverTimestamp, query, limit } = require('firebase/firestore');

const results = []; const fails = [];
async function t(name, fn) { try { await fn(); results.push(name); } catch (e) { fails.push(name + ' → ' + (e.message || e).toString().split('\n')[0]); } }
const ok = (p) => assertSucceeds(p); const no = (p) => assertFails(p);

(async () => {
  const env = await initializeTestEnvironment({ projectId: 'demo-nexo', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: 8080 } });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'socios/s1'), { nombre: 'Socio Uno', corto: 'Uno', activo: true, rol: 'socio', ultimoAcceso: null });
    await setDoc(doc(db, 'socios/s2'), { nombre: 'Socio Dos', corto: 'Dos', activo: true, rol: 'socio', ultimoAcceso: null });
    await setDoc(doc(db, 'socios/s3'), { nombre: 'Socio Baja', corto: 'Baja', activo: false, rol: 'socio', ultimoAcceso: null });
    await setDoc(doc(db, 'consultas/C-EXISTE001'), { nombre: 'Ana Prueba', email: 'ana@example.com', telefono: '', area: 'civil', canal: 'formulario', estado: 'nueva', responsable: null, manual: false, idioma: 'es', consentimiento: { aceptado: true, version: 'v1' }, createdAt: new Date(), actualizadoAt: new Date(), historial: [{ at: 1, quien: 'Sistema', texto: 'Consulta recibida.' }], notas: [] });
    await setDoc(doc(db, 'consultas/C-DEMO00001'), { nombre: 'Demo Cliente', email: 'demo@example.com', telefono: '', area: 'laboral', canal: 'formulario', estado: 'nueva', responsable: null, manual: false, demo: true, idioma: 'es', consentimiento: { aceptado: true, version: 'v1' }, createdAt: new Date(), actualizadoAt: new Date(), historial: [{ at: 1, quien: 'Sistema', texto: 'Consulta recibida.' }], notas: [] });
    await setDoc(doc(db, 'contenido_publicado/hero'), { campos: { 'hero.title': { es: 'Hola', en: 'Hello' } }, version: 1, actualizadoPor: 's1', actualizadoAt: new Date() });
    await setDoc(doc(db, 'contenido_borrador/hero'), { campos: {} });
  });

  const anon = env.unauthenticatedContext().firestore();
  const extraño = env.authenticatedContext('x1').firestore();
  const baja = env.authenticatedContext('s3').firestore();
  const s1 = env.authenticatedContext('s1').firestore();
  const s2 = env.authenticatedContext('s2').firestore();

  const pub = (extra = {}) => Object.assign({ nombre: 'María Cliente', email: 'maria@example.com', telefono: '+56 9 1234 5678', area: 'civil', canal: 'formulario', estado: 'nueva', responsable: null, manual: false, idioma: 'es', consentimiento: { aceptado: true, version: 'v1-2026-11' }, createdAt: serverTimestamp(), actualizadoAt: serverTimestamp(), historial: [{ at: Date.now(), quien: 'Sistema', texto: 'Consulta recibida por formulario web.' }], notas: [] }, extra);
  const manual = (extra = {}) => Object.assign({ nombre: 'Pedro WhatsApp', email: '', telefono: '+56 9 7777 8888', area: 'laboral', canal: 'whatsapp', estado: 'nueva', responsable: null, manual: true, idioma: 'es', resumen: 'Consulta breve', createdAt: serverTimestamp(), actualizadoAt: serverTimestamp(), historial: [{ at: Date.now(), quien: 'Socio Uno', texto: 'Registró la consulta a mano.' }], notas: [] }, extra);
  const ref = (db, id) => doc(db, 'consultas/' + id);

  // ---- Público (sin sesión) ----
  await t('público: puede crear una consulta válida', () => ok(setDoc(ref(anon, 'C-ABCD12345'), pub())));
  await t('público: puede crear solo con teléfono', () => ok(setDoc(ref(anon, 'C-ABCD12346'), pub({ email: '' }))));
  await t('público: NO puede crear con campo extra', () => no(setDoc(ref(anon, 'C-ABCD12347'), pub({ admin: true }))));
  await t('público: NO puede crear ya «tomada»', () => no(setDoc(ref(anon, 'C-ABCD12348'), pub({ estado: 'tomada' }))));
  await t('público: NO puede crear con responsable', () => no(setDoc(ref(anon, 'C-ABCD12349'), pub({ responsable: 's1' }))));
  await t('público: NO puede crear con canal distinto de formulario', () => no(setDoc(ref(anon, 'C-ABCD12350'), pub({ canal: 'whatsapp' }))));
  await t('público: NO puede crear con correo inválido', () => no(setDoc(ref(anon, 'C-ABCD12351'), pub({ email: 'no-es-correo' }))));
  await t('público: NO puede crear sin correo ni teléfono', () => no(setDoc(ref(anon, 'C-ABCD12352'), pub({ email: '', telefono: '' }))));
  await t('público: NO puede crear con teléfono inválido', () => no(setDoc(ref(anon, 'C-ABCD12353'), pub({ telefono: 'abc' }))));
  await t('público: NO puede crear sin consentimiento', () => no(setDoc(ref(anon, 'C-ABCD12354'), pub({ consentimiento: { aceptado: false, version: 'v1' } }))));
  await t('público: NO puede crear con nombre de 1 letra', () => no(setDoc(ref(anon, 'C-ABCD12355'), pub({ nombre: 'A' }))));
  await t('público: NO puede crear con nombre de 101 letras', () => no(setDoc(ref(anon, 'C-ABCD12356'), pub({ nombre: 'x'.repeat(101) }))));
  await t('público: NO puede crear con área inválida', () => no(setDoc(ref(anon, 'C-ABCD12357'), pub({ area: 'penal' }))));
  await t('público: NO puede crear con identificador inválido', () => no(setDoc(ref(anon, 'abc'), pub())));
  await t('público: NO puede fijar la fecha desde el cliente', () => no(setDoc(ref(anon, 'C-ABCD12358'), pub({ createdAt: new Date('2020-01-01') }))));
  await t('público: NO puede crear con historial de 2 entradas', () => no(setDoc(ref(anon, 'C-ABCD12359'), pub({ historial: [{ at: 1, quien: 'Sistema', texto: 'a' }, { at: 2, quien: 'Sistema', texto: 'b' }] }))));
  await t('público: NO puede crear con notas', () => no(setDoc(ref(anon, 'C-ABCD12360'), pub({ notas: [{ at: 1, quien: 'x', texto: 'y' }] }))));
  await t('público: NO puede sobrescribir una consulta existente', () => no(setDoc(ref(anon, 'C-EXISTE001'), pub())));
  await t('público: NO puede leer una consulta', () => no(getDoc(ref(anon, 'C-EXISTE001'))));
  await t('público: NO puede listar consultas', () => no(getDocs(query(collection(anon, 'consultas'), limit(5)))));
  await t('público: NO puede modificar una consulta', () => no(updateDoc(ref(anon, 'C-EXISTE001'), { estado: 'cerrada' })));
  await t('público: NO puede borrar una consulta', () => no(deleteDoc(ref(anon, 'C-DEMO00001'))));
  await t('público: puede leer contenido publicado', () => ok(getDoc(doc(anon, 'contenido_publicado/hero'))));
  await t('público: NO puede escribir contenido publicado', () => no(setDoc(doc(anon, 'contenido_publicado/hero'), { campos: {}, version: 2, actualizadoPor: 'x', actualizadoAt: serverTimestamp() })));
  await t('público: NO puede leer borradores', () => no(getDoc(doc(anon, 'contenido_borrador/hero'))));
  await t('público: NO puede leer socios', () => no(getDoc(doc(anon, 'socios/s1'))));
  await t('público: NO puede leer configuración ni auditoría', async () => { await no(getDoc(doc(anon, 'config/general'))); await no(getDocs(collection(anon, 'auditoria'))); });
  await t('público: colección desconocida denegada', () => no(setDoc(doc(anon, 'cualquiera/x'), { a: 1 })));

  // ---- Cuenta sin permisos ----
  await t('cuenta no registrada como socio: NO lee consultas', () => no(getDoc(ref(extraño, 'C-EXISTE001'))));
  await t('cuenta no registrada: NO registra consultas manuales', () => no(setDoc(ref(extraño, 'C-MANUAL0001'), manual())));
  await t('cuenta no registrada: NO modifica consultas', () => no(updateDoc(ref(extraño, 'C-EXISTE001'), { estado: 'cerrada' })));
  await t('socio dado de baja: NO lee consultas', () => no(getDoc(ref(baja, 'C-EXISTE001'))));
  await t('socio dado de baja: NO escribe contenido', () => no(setDoc(doc(baja, 'contenido_borrador/x'), { a: 1 })));

  // ---- Socio activo ----
  await t('socio: lee consultas', () => ok(getDoc(ref(s1, 'C-EXISTE001'))));
  await t('socio: lista consultas', () => ok(getDocs(query(collection(s1, 'consultas'), limit(5)))));
  await t('socio: registra consulta manual', () => ok(setDoc(ref(s1, 'C-MANUAL0002'), manual())));
  await t('socio: NO registra «formulario» como manual', () => no(setDoc(ref(s1, 'C-MANUAL0003'), manual({ canal: 'formulario' }))));
  await t('socio: NO registra a nombre de otro responsable', () => no(setDoc(ref(s1, 'C-MANUAL0004'), manual({ estado: 'tomada', responsable: 's2' }))));
  const tomar = (extra = {}) => Object.assign({ estado: 'tomada', responsable: 's1', responsableNombre: 'Socio Uno', actualizadoAt: serverTimestamp(), historial: [{ at: 1, quien: 'Sistema', texto: 'Consulta recibida.' }, { at: 2, quien: 'Socio Uno', texto: 'Tomó la consulta.' }] }, extra);
  await t('socio: toma una consulta', () => ok(updateDoc(ref(s1, 'C-EXISTE001'), tomar())));
  await t('socio: NO cambia el nombre del cliente', () => no(updateDoc(ref(s1, 'C-EXISTE001'), tomar({ nombre: 'Otro' }))));
  await t('socio: NO cambia el correo del cliente', () => no(updateDoc(ref(s1, 'C-EXISTE001'), tomar({ email: 'otro@example.com' }))));
  await t('socio: NO cambia la fecha de recepción', () => no(updateDoc(ref(s1, 'C-EXISTE001'), tomar({ createdAt: new Date() }))));
  await t('socio: NO acorta el historial', () => no(updateDoc(ref(s1, 'C-EXISTE001'), tomar({ historial: [{ at: 1, quien: 'Sistema', texto: 'Consulta recibida.' }] }))));
  await t('socio: NO reescribe entradas anteriores del historial', () => no(updateDoc(ref(s1, 'C-EXISTE001'), tomar({ historial: [{ at: 1, quien: 'Sistema', texto: 'ALTERADO' }, { at: 2, quien: 'x', texto: 'y' }, { at: 3, quien: 'x', texto: 'z' }] }))));
  await t('socio: NO usa un estado inválido', () => no(updateDoc(ref(s1, 'C-EXISTE001'), tomar({ estado: 'borrado' }))));
  await t('socio: NO asigna a un socio inexistente', () => no(updateDoc(ref(s1, 'C-EXISTE001'), tomar({ responsable: 'fantasma' }))));
  await t('socio: reasigna a otro socio (historial crece)', () => ok(updateDoc(ref(s1, 'C-EXISTE001'), tomar({ responsable: 's2', responsableNombre: 'Socio Dos', historial: [{ at: 1, quien: 'Sistema', texto: 'Consulta recibida.' }, { at: 2, quien: 'Socio Uno', texto: 'Tomó la consulta.' }, { at: 3, quien: 'Socio Uno', texto: 'Reasignó a Socio Dos.' }] }))));
  await t('socio: agrega una nota (las notas solo crecen)', () => ok(updateDoc(ref(s2, 'C-EXISTE001'), { notas: [{ at: 5, quien: 'Socio Dos', texto: 'Llamar mañana.' }], historial: [{ at: 1, quien: 'Sistema', texto: 'Consulta recibida.' }, { at: 2, quien: 'Socio Uno', texto: 'Tomó la consulta.' }, { at: 3, quien: 'Socio Uno', texto: 'Reasignó a Socio Dos.' }, { at: 6, quien: 'Socio Dos', texto: 'Agregó una nota.' }], estado: 'tomada', responsable: 's2', actualizadoAt: serverTimestamp() })));
  await t('socio: NO borra notas', () => no(updateDoc(ref(s2, 'C-EXISTE001'), { notas: [], historial: [{ at: 1, quien: 'Sistema', texto: 'Consulta recibida.' }, { at: 2, quien: 'Socio Uno', texto: 'Tomó la consulta.' }, { at: 3, quien: 'Socio Uno', texto: 'Reasignó a Socio Dos.' }, { at: 6, quien: 'Socio Dos', texto: 'Agregó una nota.' }, { at: 7, quien: 'x', texto: 'y' }], estado: 'tomada', responsable: 's2', actualizadoAt: serverTimestamp() })));
  await t('socio: NO borra una consulta real', () => no(deleteDoc(ref(s1, 'C-EXISTE001'))));
  await t('socio: SÍ borra una consulta de demostración', () => ok(deleteDoc(ref(s1, 'C-DEMO00001'))));

  const pubDoc = (extra = {}) => Object.assign({ campos: { 'hero.title': { es: 'Nuevo', en: 'New' } }, version: 2, actualizadoPor: 's1', actualizadoAt: serverTimestamp() }, extra);
  await t('socio: publica contenido', () => ok(setDoc(doc(s1, 'contenido_publicado/hero'), pubDoc())));
  await t('socio: NO publica a nombre de otro', () => no(setDoc(doc(s1, 'contenido_publicado/hero'), pubDoc({ actualizadoPor: 's2' }))));
  await t('socio: NO publica con campos extra', () => no(setDoc(doc(s1, 'contenido_publicado/hero'), pubDoc({ extra: 1 }))));
  await t('socio: lee y escribe borradores', async () => { await ok(setDoc(doc(s1, 'contenido_borrador/hero'), { campos: { a: 1 } })); await ok(getDoc(doc(s1, 'contenido_borrador/hero'))); });
  await t('socio: ajusta el plazo (SLA) entre 1 y 168 h', async () => { await ok(setDoc(doc(s1, 'config/general'), { slaHoras: 24, actualizadoAt: serverTimestamp() })); await no(setDoc(doc(s1, 'config/general'), { slaHoras: 500, actualizadoAt: serverTimestamp() })); await no(setDoc(doc(s1, 'config/otro'), { slaHoras: 24, actualizadoAt: serverTimestamp() })); });
  const aud = (extra = {}) => Object.assign({ at: serverTimestamp(), uid: 's1', nombre: 'Socio Uno', accion: 'consulta.tomar', detalle: 'C-EXISTE001', consultaId: 'C-EXISTE001' }, extra);
  await t('socio: agrega auditoría', () => ok(setDoc(doc(s1, 'auditoria/a1'), aud())));
  await t('socio: NO falsifica la auditoría (uid ajeno)', () => no(setDoc(doc(s1, 'auditoria/a2'), aud({ uid: 's2' }))));
  await t('socio: NO modifica ni borra auditoría', async () => { await no(updateDoc(doc(s1, 'auditoria/a1'), { accion: 'x' })); await no(deleteDoc(doc(s1, 'auditoria/a1'))); });
  await t('socio: lee la auditoría', () => ok(getDocs(collection(s1, 'auditoria'))));
  await t('socios: cada uno lee su perfil y el de los demás', async () => { await ok(getDoc(doc(s1, 'socios/s1'))); await ok(getDoc(doc(s1, 'socios/s2'))); });
  await t('socios: actualiza solo su «ultimoAcceso»', async () => { await ok(updateDoc(doc(s1, 'socios/s1'), { ultimoAcceso: serverTimestamp() })); await no(updateDoc(doc(s1, 'socios/s1'), { activo: false })); await no(updateDoc(doc(s1, 'socios/s1'), { rol: 'admin' })); await no(updateDoc(doc(s1, 'socios/s2'), { ultimoAcceso: serverTimestamp() })); });
  await t('socios: nadie crea ni borra perfiles desde el cliente', async () => { await no(setDoc(doc(s1, 'socios/s9'), { nombre: 'Intruso', activo: true })); await no(deleteDoc(doc(s1, 'socios/s2'))); });

  await env.cleanup();
  console.log(`Reglas de Firestore: ${results.length} comprobaciones pasan, ${fails.length} fallan.`);
  if (fails.length) { console.log('FALLAN:\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('SIN HALLAZGOS');
})();
