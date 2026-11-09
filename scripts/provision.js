'use strict';
/* NEXO Abogados · aprovisionamiento completo en Firebase con UN comando.
   Hace, en orden y de forma repetible (se puede volver a ejecutar sin romper nada):
     1. Inicia sesión en Firebase (se abre tu navegador, donde ya tienes la sesión).
     2. Crea el proyecto Firebase (o usa el indicado) y una app web.
     3. Crea la base Firestore en Santiago de Chile (southamerica-west1).
     4. Genera firebase-config.json, construye el sitio y despliega Hosting + reglas de Firestore.
     5. Crea las cuentas de los 3 socios, sus perfiles, el contenido inicial y las consultas de demostración.
   Uso:  node scripts/provision.js [--project <id>] [--sin-demo] [--emails a@x.cl,b@x.cl,c@x.cl] [--region southamerica-west1]  */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };
const has = (n) => process.argv.includes(n);
const CLI = path.join(ROOT, 'node_modules/firebase-tools/lib/bin/firebase.js');
const say = (m) => console.log('\n▶ ' + m);
const die = (m, code = 1) => { console.error('\n✖ ' + m); process.exit(code); };

if (!fs.existsSync(CLI)) die('Faltan las dependencias. Ejecuta primero: npm install');
const fb = (args, o = {}) => spawnSync(process.execPath, [CLI, ...args], Object.assign({ cwd: ROOT, encoding: 'utf8' }, o));
const fbJson = (args) => { const r = fb([...args, '--json']); try { return JSON.parse(r.stdout); } catch (e) { return { status: 'error', error: (r.stdout || '') + (r.stderr || '') }; } };

/* 1. Sesión */
say('1/6  Sesión de Firebase');
const who = fb(['login:list']); const out = (who.stdout || '') + (who.stderr || '');
if (!/@/.test(out)) { console.log('Se abrirá tu navegador para autorizar la CLI de Firebase…'); const r = fb(['login'], { stdio: 'inherit' }); if (r.status !== 0) die('No se pudo iniciar sesión en Firebase.'); } else console.log('Sesión encontrada: ' + out.split('\n').find((l) => /@/.test(l)).trim());

/* 2. Proyecto */
say('2/6  Proyecto Firebase');
let id = arg('--project');
const rcPath = path.join(ROOT, '.firebaserc');
if (!id && fs.existsSync(rcPath)) { try { id = JSON.parse(fs.readFileSync(rcPath, 'utf8')).projects.default; } catch (e) { /* ignorar */ } }
if (!id) id = 'nexo-abogados-' + crypto.randomBytes(2).toString('hex');
if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(id)) die('ID de proyecto inválido (6-30 caracteres: minúsculas, números y guiones): ' + id);
const list = fbJson(['projects:list']); const exists = (list.result || []).some((p) => p.projectId === id);
if (!exists) { console.log('Creando el proyecto «' + id + '» (puede tardar un minuto)…'); const r = fb(['projects:create', id, '--display-name', 'NEXO Abogados'], { stdio: 'inherit' }); if (r.status !== 0) die('No se pudo crear el proyecto. Si el ID ya existe en el mundo, prueba con otro: --project <otro-id>'); } else console.log('Proyecto existente: ' + id);
fs.writeFileSync(rcPath, JSON.stringify({ projects: { default: id } }, null, 2) + '\n');

/* 3. App web + configuración */
say('3/6  App web');
let apps = fbJson(['apps:list', 'WEB', '--project', id]); let app = (apps.result || []).find((a) => a.displayName === 'NEXO Abogados') || (apps.result || [])[0];
if (!app) { const r = fb(['apps:create', 'WEB', 'NEXO Abogados', '--project', id], { stdio: 'inherit' }); if (r.status !== 0) die('No se pudo crear la app web.'); apps = fbJson(['apps:list', 'WEB', '--project', id]); app = (apps.result || [])[0]; }
if (!app) die('No se encontró la app web del proyecto.');
const sdk = fbJson(['apps:sdkconfig', 'WEB', app.appId, '--project', id]);
const raw = JSON.stringify(sdk.result || sdk);
const pick = (k) => { const m = raw.match(new RegExp('\\\\?"?' + k + '\\\\?"?\\s*:\\s*\\\\?"([^"\\\\]+)')); return m ? m[1] : undefined; };
const cfg = {}; ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'].forEach((k) => { const v = pick(k); if (v) cfg[k] = v; });
if (!cfg.apiKey || !cfg.projectId) die('No se pudo leer la configuración web: ' + raw.slice(0, 300));
fs.writeFileSync(path.join(ROOT, 'firebase-config.json'), JSON.stringify(cfg, null, 2) + '\n');
console.log('Configuración guardada en firebase-config.json (es pública: no contiene secretos).');

/* 4. Firestore */
say('4/6  Base de datos Firestore (' + (arg('--region') || 'southamerica-west1') + ')');
const dbs = fbJson(['firestore:databases:list', '--project', id]); const hasDb = JSON.stringify(dbs).includes('/databases/(default)');
if (!hasDb) { const r = fb(['firestore:databases:create', '(default)', '--location', arg('--region') || 'southamerica-west1', '--project', id], { stdio: 'inherit' }); if (r.status !== 0) die('No se pudo crear Firestore. Revísalo en https://console.firebase.google.com/project/' + id + '/firestore'); } else console.log('La base de datos ya existe.');

/* 5. Construir y desplegar */
say('5/6  Construir y desplegar (Hosting + reglas de seguridad)');
let r = spawnSync(process.execPath, [path.join(ROOT, 'scripts/build.js')], { cwd: ROOT, stdio: 'inherit' }); if (r.status !== 0) die('Falló la construcción del sitio.');
r = fb(['deploy', '--only', 'firestore,hosting', '--project', id], { stdio: 'inherit' }); if (r.status !== 0) die('Falló el despliegue.');

/* 6. Cuentas y datos iniciales */
say('6/6  Cuentas de los socios, perfiles y datos iniciales');
const env = Object.assign({}, process.env); (arg('--emails') || '').split(',').filter(Boolean).forEach((e, i) => { env['SOCIO' + (i + 1) + '_EMAIL'] = e.trim(); });
const sargs = [path.join(ROOT, 'scripts/seed.js'), '--project', id]; if (has('--sin-demo')) sargs.push('--sin-demo');
const s = spawnSync(process.execPath, sargs, { cwd: ROOT, env, encoding: 'utf8' });
process.stdout.write(s.stdout || '');
if (s.status !== 0) {
  const msg = (s.stderr || '') + (s.stdout || '');
  if (/configuration-not-found|CONFIGURATION_NOT_FOUND|no configuration corresponding/i.test(msg)) {
    console.error(`\n⚠ Falta activar Authentication (un solo clic, no se puede hacer desde la línea de comandos):
   1) Abre https://console.firebase.google.com/project/${id}/authentication
   2) Pulsa «Comenzar» → «Correo electrónico/contraseña» → Habilitar (solo la primera opción) → Guardar.
   3) Vuelve a ejecutar:  node scripts/provision.js --project ${id}   (es seguro repetirlo)`);
    process.exit(2);
  }
  die('Falló la carga inicial:\n' + msg);
}
console.log(`
✔ Listo.
   Sitio público:   https://${id}.web.app
   Panel de socios: https://${id}.web.app/admin/
   Consola:         https://console.firebase.google.com/project/${id}/overview
Siguientes pasos: cambia las contraseñas temporales (Ajustes → Cambiar mi contraseña), reemplaza los correos de los socios en Authentication si usaste los de ejemplo, y revisa docs/DESPLIEGUE.md.`);
