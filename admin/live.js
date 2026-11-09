'use strict';
/* Panel en modo «en vivo»: Firebase Authentication + Firestore (tiempo real).
   Solo se usa cuando backend.js declara NEXO_BACKEND = 'firebase'. En modo demostración no se carga nada de esto. */
window.AdminLive = (() => {
  let fb = null, me = null, unsubs = [], cb = {};
  const loadFB = () => new Promise((resolve, reject) => {
    if (window.NexoFB) return resolve(window.NexoFB);
    const s = document.createElement('script'); s.src = '../nexo-firebase.js';
    s.onload = () => resolve(window.NexoFB); s.onerror = () => reject(new Error('No se pudo cargar Firebase')); document.head.append(s);
  });
  const ms = (ts) => (ts && ts.toMillis ? ts.toMillis() : typeof ts === 'number' ? ts : Date.now());
  const entry = (e) => ({ at: e.at, who: e.quien, text: e.texto });
  const toEntry = (text) => ({ at: Date.now(), quien: me.short, texto: text });

  /* Documento de Firestore → objeto que usa la pantalla */
  function fromDoc(d) {
    const x = d.data({ serverTimestamps: 'estimate' });
    return { id: d.id, createdAt: ms(x.createdAt), name: x.nombre, email: x.email || '', phone: x.telefono || '', area: x.area, channel: x.canal, status: x.estado, owner: x.responsable || null,
      notes: (x.notas || []).map(entry), history: (x.historial || []).map(entry), manual: !!x.manual, summary: x.resumen || '', demo: !!x.demo };
  }
  const fromSocio = (d) => { const x = d.data(); return { id: d.id, name: x.nombre, short: x.corto || x.nombre.split(' ')[0], area: x.area || '', photo: '../' + (x.foto || 'assets/partner-1.jpg'), activo: x.activo !== false, orden: x.orden || 0, email: x.email || '' }; };

  async function signIn(email, password) {
    fb = await loadFB();
    await fb.setPersistence(fb.auth, fb.browserSessionPersistence);          // la sesión termina al cerrar la pestaña
    const cred = await fb.signInWithEmailAndPassword(fb.auth, email, password);
    const snap = await fb.getDoc(fb.doc(fb.db, 'socios', cred.user.uid));
    if (!snap.exists() || snap.data().activo !== true) { await fb.signOut(fb.auth); const e = new Error('sin-acceso'); e.code = 'app/sin-acceso'; throw e; }
    me = fromSocio(snap);
    fb.updateDoc(fb.doc(fb.db, 'socios', cred.user.uid), { ultimoAcceso: fb.serverTimestamp() }).catch(() => {});
    return me;
  }
  async function signOut() { stop(); me = null; if (fb) await fb.signOut(fb.auth).catch(() => {}); }

  /* Escuchas en tiempo real. Devuelve una promesa que se cumple cuando llegó la primera carga. */
  function start(handlers) {
    cb = handlers; stop();
    const first = { socios: false, consultas: false, config: false };
    return new Promise((resolve, reject) => {
      const done = (k) => { first[k] = true; if (first.socios && first.consultas && first.config) resolve(); };
      const fail = (e) => reject(e);
      unsubs.push(fb.onSnapshot(fb.collection(fb.db, 'socios'), (s) => { cb.socios(s.docs.map(fromSocio).filter((p) => p.activo).sort((a, b) => a.orden - b.orden)); done('socios'); }, fail));
      unsubs.push(fb.onSnapshot(fb.query(fb.collection(fb.db, 'consultas'), fb.orderBy('createdAt', 'desc')), (s) => { cb.consultas(s.docs.map(fromDoc), s.docChanges()); done('consultas'); }, fail));
      unsubs.push(fb.onSnapshot(fb.doc(fb.db, 'config', 'general'), (s) => { cb.config(s.exists() ? s.data() : {}); done('config'); }, fail));
      unsubs.push(fb.onSnapshot(fb.query(fb.collection(fb.db, 'auditoria'), fb.orderBy('at', 'desc'), fb.limit(60)), (s) => { cb.auditoria(s.docs.map((d) => { const x = d.data({ serverTimestamps: 'estimate' }); return { at: ms(x.at), who: x.nombre, action: x.accion, detail: x.detalle || '' }; })); }, () => {}));
    });
  }
  function stop() { unsubs.forEach((u) => { try { u(); } catch (e) { /* ignorar */ } }); unsubs = []; }

  /* Escritura con transacción: lee el documento actual, aplica el cambio y lo guarda (evita pisar cambios de otro socio). */
  async function tx(id, build) {
    const ref = fb.doc(fb.db, 'consultas', id);
    return fb.runTransaction(fb.db, async (t) => {
      const snap = await t.get(ref); if (!snap.exists()) { const e = new Error('No existe'); e.code = 'app/no-existe'; throw e; }
      const cur = snap.data(); const patch = build(cur, fromDoc(snap));
      t.update(ref, Object.assign({}, patch, { actualizadoAt: fb.serverTimestamp() })); return cur;
    });
  }
  const conflict = (msg) => { const e = new Error(msg); e.code = 'app/conflicto'; return e; };
  const nameOf = (uid, partners) => { const p = partners.find((x) => x.id === uid); return p ? p.short : 'otro socio'; };

  async function take(id, partners) {
    const ya = (cur) => conflict('Ya la tomó ' + (cur.responsableNombre || nameOf(cur.responsable, partners)) + '.');
    try {
      return await tx(id, (cur) => {
        if (cur.responsable && cur.responsable !== me.id) throw ya(cur);
        return { estado: 'tomada', responsable: me.id, responsableNombre: me.short, historial: [...cur.historial, toEntry('Tomó la consulta.')] };
      });
    } catch (e) {
      // Si otro socio la tomó justo antes, las reglas rechazan nuestra escritura: lo explicamos con claridad.
      if (e.code === 'permission-denied') { const cur = (await fb.getDoc(fb.doc(fb.db, 'consultas', id))).data(); if (cur && cur.responsable && cur.responsable !== me.id) throw ya(cur); }
      throw e;
    }
  }
  const undoTake = (id) => tx(id, (cur) => {
    if (cur.responsable !== me.id || cur.estado !== 'tomada') throw conflict('Ya no se puede deshacer.');
    return { estado: 'nueva', responsable: null, responsableNombre: null, historial: [...cur.historial, toEntry('Se deshizo la toma de la consulta.')] };
  });
  const setStatus = (id, estado, label) => tx(id, (cur) => ({ estado, historial: [...cur.historial, toEntry('Cambió el estado a «' + label + '».')] }));
  const reassign = (id, to, toShort, reason) => tx(id, (cur) => ({ responsable: to, responsableNombre: toShort, estado: cur.estado === 'nueva' ? 'tomada' : cur.estado,
    historial: [...cur.historial, toEntry('Reasignó a ' + toShort + '. Motivo: ' + reason)] }));
  const addNote = (id, text) => tx(id, (cur) => ({ notas: [...cur.notas, { at: Date.now(), quien: me.short, texto: text }], historial: [...cur.historial, toEntry('Agregó una nota interna.')] }));

  async function register(id, d) {
    const hist = [toEntry('Registró la consulta a mano (canal: ' + d.canalLabel + ').')];
    if (d.tomar) hist.push(toEntry('Tomó la consulta.'));
    const doc = { nombre: d.nombre, email: d.email, telefono: d.telefono, area: d.area, canal: d.canal, estado: d.tomar ? 'tomada' : 'nueva', responsable: d.tomar ? me.id : null,
      manual: true, idioma: 'es', createdAt: fb.serverTimestamp(), actualizadoAt: fb.serverTimestamp(), historial: hist, notas: [] };
    if (d.tomar) doc.responsableNombre = me.short;
    if (d.resumen) doc.resumen = d.resumen;
    await fb.setDoc(fb.doc(fb.db, 'consultas', id), doc);
  }
  const setSla = (h) => fb.setDoc(fb.doc(fb.db, 'config', 'general'), { slaHoras: h, actualizadoAt: fb.serverTimestamp() });
  const audit = (accion, detalle, consultaId) => {
    const d = { at: fb.serverTimestamp(), uid: me.id, nombre: me.short, accion };
    if (detalle) d.detalle = String(detalle).slice(0, 300); if (consultaId) d.consultaId = consultaId;
    return fb.setDoc(fb.doc(fb.collection(fb.db, 'auditoria')), d).catch(() => {});
  };
  async function deleteDemo() {
    const snap = await fb.getDocs(fb.query(fb.collection(fb.db, 'consultas'), fb.where('demo', '==', true)));
    let n = 0; const docs = snap.docs;
    for (let i = 0; i < docs.length; i += 400) { const b = fb.writeBatch(fb.db); docs.slice(i, i + 400).forEach((d) => { b.delete(d.ref); n++; }); await b.commit(); }
    return n;
  }

  /* Contenido del sitio (editor) */
  async function loadContent() {
    const [pub, bor] = await Promise.all([fb.getDocs(fb.collection(fb.db, 'contenido_publicado')), fb.getDocs(fb.collection(fb.db, 'contenido_borrador'))]);
    const out = { publicado: {}, borrador: {}, versiones: {}, version: {} };
    pub.forEach((d) => { out.publicado[d.id] = d.data().campos || {}; out.version[d.id] = d.data().version || 1; });
    bor.forEach((d) => { const x = d.data(); out.borrador[d.id] = x.campos || {}; out.versiones[d.id] = x.versiones || []; });
    return out;
  }
  const saveDraft = (seccion, campos, versiones) => fb.setDoc(fb.doc(fb.db, 'contenido_borrador', seccion), { campos, versiones: versiones || [], actualizadoAt: fb.serverTimestamp(), actualizadoPor: me.id });
  const publish = (seccion, campos, version) => fb.setDoc(fb.doc(fb.db, 'contenido_publicado', seccion), { campos, version, actualizadoPor: me.id, actualizadoAt: fb.serverTimestamp() });

  return { signIn, signOut, start, stop, take, undoTake, setStatus, reassign, addNote, register, setSla, audit, deleteDemo, loadContent, saveDraft, publish, get me() { return me; }, loadFB: () => loadFB().then((x) => { fb = x; return x; }) };
})();
