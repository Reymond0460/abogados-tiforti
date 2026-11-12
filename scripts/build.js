'use strict';
/* Genera dist/ (lo que se publica en Firebase Hosting).
   Uso: node scripts/build.js            → producción (lee firebase-config.json)
        node scripts/build.js --emulator → pruebas locales con emuladores (proyecto demo-nexo) */
const fs = require('fs'), path = require('path');
const esbuild = require('esbuild');
const ROOT = path.resolve(__dirname, '..'), DIST = path.join(ROOT, 'dist');
const emulator = process.argv.includes('--emulator');

fs.rmSync(DIST, { recursive: true, force: true }); fs.mkdirSync(DIST, { recursive: true });
const copy = (rel) => { const d = path.join(DIST, rel); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(path.join(ROOT, rel), d); };

['index.html', 'style.css', 'extras.css', 'app.js', 'i18n.js'].forEach(copy);
['jost.ttf', 'OFL-Jost.txt', 'favicon.svg', 'nexo-simbolo.svg', 'office-nexo.webp', 'partner-1.webp', 'partner-2.webp', 'partner-3.webp'].forEach((f) => copy('assets/' + f));
['index.html', 'admin.css', 'admin.js', 'charts.js', 'config.js', 'content.js', 'editor.js', 'export.js', 'live.js'].forEach((f) => copy('admin/' + f));

// El panel real no lleva datos ficticios: se publica un data.js vacío.
fs.writeFileSync(path.join(DIST, 'admin/data.js'), "'use strict';\nwindow.ADMIN_DATA = { partners: [], consultations: [], content: [], now: Date.now() };\n");
// Herramientas de demostración fuera y sin «Copiar para Excel» (solo sirve en la vista previa de claude.ai).
fs.writeFileSync(path.join(DIST, 'admin/config.js'), fs.readFileSync(path.join(ROOT, 'admin/config.js'), 'utf8').replace('showCopyFallback: true', 'showCopyFallback: false'));

let config;
if (emulator) {
  config = { apiKey: 'fake-api-key', authDomain: 'localhost', projectId: 'demo-nexo', appId: '1:000:web:000' };
} else {
  const f = path.join(ROOT, 'firebase-config.json');
  if (!fs.existsSync(f)) { console.error('Falta firebase-config.json (configuración web del proyecto Firebase).'); process.exit(1); }
  config = JSON.parse(fs.readFileSync(f, 'utf8'));
}
const emu = emulator ? "window.FIREBASE_EMULATORS = { auth: 'http://127.0.0.1:9099', firestore: { host: '127.0.0.1', port: 8080 } };\n" : '';
fs.writeFileSync(path.join(DIST, 'backend.js'), `'use strict';\nwindow.NEXO_BACKEND = 'firebase';\nwindow.FIREBASE_CONFIG = ${JSON.stringify(config)};\n${emu}`);

esbuild.buildSync({ entryPoints: [path.join(ROOT, 'src/fb.js')], bundle: true, minify: true, format: 'iife', target: ['es2019'], outfile: path.join(DIST, 'nexo-firebase.js'), legalComments: 'none' });
fs.writeFileSync(path.join(DIST, 'robots.txt'), 'User-agent: *\nDisallow: /admin/\n');
const size = fs.statSync(path.join(DIST, 'nexo-firebase.js')).size;
console.log(`dist/ listo (${emulator ? 'emuladores' : 'producción'}). nexo-firebase.js: ${(size / 1024).toFixed(0)} KB`);
