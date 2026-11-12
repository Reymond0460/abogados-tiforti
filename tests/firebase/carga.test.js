'use strict';
/* Prueba de carga de la base de datos contra el EMULADOR (no toca producción).
   Ejecutar: npm run test:carga */
const fs = require('fs'); const path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, collection, serverTimestamp } = require('firebase/firestore');
const N_OK = 500, N_BAD = 300, N_READ = 300;
const pub = (extra = {}) => Object.assign({ nombre: 'María Cliente', email: 'maria@example.com', telefono: '+56 9 1234 5678', area: 'civil', canal: 'formulario', estado: 'nueva', responsable: null, manual: false, idioma: 'es', consentimiento: { aceptado: true, version: 'v1-2026-11' }, createdAt: serverTimestamp(), actualizadoAt: serverTimestamp(), historial: [{ at: Date.now(), quien: 'Sistema', texto: 'Consulta recibida por formulario web.' }], notas: [] }, extra);
const settle = async (ps) => { const r = await Promise.allSettled(ps); return { ok: r.filter(x => x.status === 'fulfilled').length, no: r.filter(x => x.status === 'rejected').length }; };
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'demo-nexo', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8') } });
  const anon = env.unauthenticatedContext().firestore();
  const id = (p, i) => 'C-' + p + String(i).padStart(8, '0');
  const fails = [];
  let t = Date.now();
  const a = await settle(Array.from({ length: N_OK }, (_, i) => setDoc(doc(anon, 'consultas/' + id('A', i)), pub({ nombre: 'Carga ' + i }))));
  const tA = Date.now() - t;
  console.log(`Envíos válidos simultáneos: ${a.ok}/${N_OK} aceptados en ${tA} ms`); if (a.ok !== N_OK) fails.push('envíos válidos rechazados');
  t = Date.now();
  const bad = [i => pub({ admin: true }), i => pub({ estado: 'tomada' }), i => pub({ responsable: 's1' }), i => pub({ nombre: 'x'.repeat(5000) }), i => pub({ consentimiento: { aceptado: false, version: 'v1' } })];
  const b = await settle(Array.from({ length: N_BAD }, (_, i) => setDoc(doc(anon, 'consultas/' + id('B', i)), bad[i % bad.length](i))));
  console.log(`Envíos maliciosos/inválidos: ${b.no}/${N_BAD} rechazados en ${Date.now() - t} ms`); if (b.no !== N_BAD) fails.push('hubo envíos inválidos aceptados');
  t = Date.now();
  const r = await settle([...Array.from({ length: N_READ / 2 }, (_, i) => getDoc(doc(anon, 'consultas/' + id('A', i)))), ...Array.from({ length: N_READ / 2 }, () => getDocs(collection(anon, 'consultas')))]);
  console.log(`Lecturas anónimas de consultas: ${r.no}/${N_READ} bloqueadas en ${Date.now() - t} ms`); if (r.no !== N_READ) fails.push('lecturas anónimas permitidas');
  let n = 0; await env.withSecurityRulesDisabled(async c => { n = (await getDocs(collection(c.firestore(), 'consultas'))).size; });
  console.log(`Documentos guardados: ${n} (esperado ${N_OK})`); if (n !== N_OK) fails.push('cantidad de documentos inesperada');
  await env.cleanup();
  console.log(fails.length ? 'FALLAS: ' + fails.join('; ') : 'SIN HALLAZGOS');
  process.exit(fails.length ? 1 : 0);
})();
