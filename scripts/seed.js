'use strict';
/* Carga inicial de datos con el SDK de administración (omite las reglas, por eso solo se usa desde aquí).
   Crea: cuentas de los 3 socios, perfiles, contenido publicado, configuración y consultas de DEMOSTRACIÓN (marcadas demo: true).
   Uso: node scripts/seed.js --emulator
        node scripts/seed.js --project <id> [--sin-demo] [--refresh-token <ruta.json>]   (producción)  */
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto'), os = require('os');
const { initializeApp } = require('firebase-admin/app'); const { getFirestore, Timestamp } = require('firebase-admin/firestore'); const { getAuth } = require('firebase-admin/auth');

const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };
const emulator = process.argv.includes('--emulator'), sinDemo = process.argv.includes('--sin-demo');
const ROOT = path.resolve(__dirname, '..');

function load(file) { const sb = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sb); return sb.window; }
const DATA = load('admin/data.js').ADMIN_DATA, CONTENT = load('admin/content.js').ADMIN_CONTENT;

const SOCIOS = [
  { id: 'p1', nombre: 'Andrés Vergara Muñoz', corto: 'Andrés', area: 'civil', foto: 'assets/partner-1.webp', email: process.env.SOCIO1_EMAIL || 'andres@nexo-demo.example' },
  { id: 'p2', nombre: 'Valentina Soto Araya', corto: 'Valentina', area: 'laboral', foto: 'assets/partner-2.webp', email: process.env.SOCIO2_EMAIL || 'valentina@nexo-demo.example' },
  { id: 'p3', nombre: 'Tomás Herrera Lagos', corto: 'Tomás', area: 'empresas', foto: 'assets/partner-3.webp', email: process.env.SOCIO3_EMAIL || 'tomas@nexo-demo.example' }
];
const pass = () => crypto.randomBytes(12).toString('base64url') + '-9a';

(async () => {
  let projectId = 'demo-nexo';
  if (emulator) { process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'; process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'; initializeApp({ projectId }); }
  else {
    projectId = arg('--project'); if (!projectId) throw new Error('Falta --project <id>');
    const tokFile = arg('--refresh-token') || path.join(os.homedir(), '.config/configstore/firebase-tools.json');
    const j = JSON.parse(fs.readFileSync(tokFile, 'utf8')); const rt = (j.tokens && j.tokens.refresh_token) || j.refresh_token;
    // Credenciales de usuario (las de «firebase login») como credenciales por defecto de Google, en un archivo temporal que se borra al terminar.
    const adc = path.join(os.tmpdir(), 'nexo-adc-' + process.pid + '.json');
    fs.writeFileSync(adc, JSON.stringify({ type: 'authorized_user', client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com', client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi', refresh_token: rt, quota_project_id: projectId }), { mode: 0o600 });
    process.on('exit', () => { try { fs.unlinkSync(adc); } catch (e) { /* ya borrado */ } });
    process.env.GOOGLE_APPLICATION_CREDENTIALS = adc; process.env.GOOGLE_CLOUD_QUOTA_PROJECT = projectId;
    initializeApp({ projectId });
  }
  const auth = getAuth(), db = getFirestore(), TS = Timestamp;
  const creds = [];

  // 1) Cuentas y perfiles de los socios
  const uid = {};
  for (const [i, s] of SOCIOS.entries()) {
    const password = emulator ? 'Contrasena-Segura-' + (i + 1) : pass();
    let user; try { user = await auth.getUserByEmail(s.email); } catch (e) { user = await auth.createUser({ email: s.email, password, emailVerified: true, displayName: s.nombre }); creds.push({ email: s.email, password }); }
    uid[s.id] = user.uid;
    await db.doc('socios/' + user.uid).set({ nombre: s.nombre, corto: s.corto, area: s.area, foto: s.foto, email: s.email, activo: true, rol: 'socio', orden: i + 1, ultimoAcceso: null }, { merge: true });
  }
  // 2) Configuración y contenido publicado (los textos actuales del sitio)
  await db.doc('config/general').set({ slaHoras: 24, actualizadoAt: TS.now() }, { merge: true });
  for (const s of CONTENT) {
    const campos = Object.fromEntries(s.fields.map((f) => [f.key, { es: f.es, en: f.en }]));
    await db.doc('contenido_publicado/' + s.id).set({ campos, version: 1, actualizadoPor: uid.p1, actualizadoAt: TS.now() });
  }
  // 3) Consultas de demostración
  if (!sinDemo) {
    const batch = db.batch(); let n = 0;
    for (const c of DATA.consultations) {
      const owner = c.owner ? uid[c.owner] : null, ownerP = c.owner ? SOCIOS.find((s) => s.id === c.owner) : null;
      const doc = { nombre: c.name, email: c.email || '', telefono: c.phone || '', area: c.area, canal: c.channel, estado: c.status, responsable: owner, responsableNombre: ownerP ? ownerP.corto : null,
        manual: !!c.manual, demo: true, idioma: 'es', consentimiento: { aceptado: true, version: 'demo' }, createdAt: TS.fromMillis(c.createdAt), actualizadoAt: TS.now(),
        historial: c.history.map((e) => ({ at: e.at, quien: e.who, texto: e.text })), notas: c.notes.map((e) => ({ at: e.at, quien: e.who, texto: e.text })) };
      batch.set(db.doc('consultas/' + c.id), doc); n++;
    }
    await batch.commit(); console.log(`Consultas de demostración cargadas: ${n}`);
  }
  console.log(`Proyecto: ${projectId}. Socios: ${SOCIOS.length}. Secciones de contenido: ${CONTENT.length}.`);
  if (creds.length) { console.log('\nCUENTAS NUEVAS (contraseñas temporales: cámbialas al ingresar y guárdalas en un gestor):'); creds.forEach((c) => console.log(`  ${c.email}  ${c.password}`)); }
  process.exit(0);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
