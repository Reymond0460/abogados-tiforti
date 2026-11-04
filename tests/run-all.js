'use strict';
/* Ejecuta toda la suite de QA. Requisitos: Node 18+, Playwright con Chromium instalado
   (npm i -g playwright && npx playwright install chromium) y, para accesibilidad automática,
   axe-core (npm i axe-core; o indicar AXE_PATH=ruta/a/axe.min.js).
   Uso:  node tests/run-all.js            (levanta un servidor estático local solo para las pruebas)
         BASE=http://localhost:8000 node tests/run-all.js   (usa un servidor ya levantado)  */
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const { spawn, spawnSync } = require('child_process');
const run = (file, env) => new Promise((resolve) => { const c = spawn(process.execPath, [file], { env }); let out = ''; const t = setTimeout(() => c.kill(), 600000); c.stdout.on('data', (d) => { out += d; }); c.stderr.on('data', (d) => { out += d; }); c.on('close', (code) => { clearTimeout(t); resolve({ status: code, out }); }); });

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8' };
const TESTS = [
  ['Sitio público · funcional (menú, ventanas, formulario, accesibilidad, idiomas)', 'public-funcional.test.js', /SIN HALLAZGOS/],
  ['Panel · funcional (bandeja, ficha, avisos, ajustes, editor, restablecer)', 'panel-funcional.test.js', /SIN HALLAZGOS/],
  ['Panel · seguridad del ingreso (bloqueo, inactividad, limpieza)', 'panel-seguridad-login.test.js', /SIN HALLAZGOS/],
  ['Panel · UX móvil (barra inferior, lista compacta, filtros, ficha a pantalla completa, zonas táctiles)', 'panel-movil-ux.test.js', /SIN HALLAZGOS/],
  ['Panel · ficha de consulta (copiar, navegar, estado, reabrir)', 'panel-ficha.test.js', /SIN HALLAZGOS/],
  ['Panel · ficha sin scroll (22 fichas × 4 pestañas × 5 pantallas)', 'panel-ficha-sin-scroll.test.js', /SIN SCROLL EN NINGUNA PESTAÑA/],
  ['Panel · registro manual de consultas', 'panel-registro.test.js', /SIN HALLAZGOS/],
  ['Panel · exportar a Excel y dashboard', 'panel-exportar-dashboard.test.js', /SIN HALLAZGOS/],
  ['Panel · editor de contenido', 'panel-editor-contenido.test.js', /SIN HALLAZGOS/],
  ['Panel · interruptor de configuración', 'panel-config.test.js', /visible con true true true[\s\S]*visible con false false true/],
  ['Accesibilidad automática (axe-core, WCAG 2.2 AA)', 'a11y-axe.test.js', /SIN VIOLACIONES AXE/],
  ['Extra · teclado, tamaños, idiomas, rendimiento, privacidad', 'extra.test.js', /SIN HALLAZGOS/]
];

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('no encontrado'); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
    }).listen(0, '127.0.0.1', () => resolve(srv));
  });
}

(async () => {
  let srv = null, base = process.env.BASE;
  if (!base) { srv = await serve(); base = 'http://127.0.0.1:' + srv.address().port; }
  const env = Object.assign({}, process.env, { BASE: base, OUT: process.env.OUT || os.tmpdir() });
  const results = [];

  // 1) Revisión estática: sintaxis de JavaScript
  const jsFiles = ['app.js', 'i18n.js'].concat(fs.readdirSync(path.join(ROOT, 'admin')).filter((f) => f.endsWith('.js')).map((f) => 'admin/' + f));
  const bad = jsFiles.filter((f) => spawnSync(process.execPath, ['--check', path.join(ROOT, f)]).status !== 0);
  results.push(['Revisión estática · sintaxis de ' + jsFiles.length + ' archivos JavaScript', bad.length === 0, bad.join(', ')]);

  // 2) Revisión estática: sin recursos externos ni secretos en el código del sitio
  const code = ['index.html', 'style.css', 'extras.css', 'app.js', 'i18n.js'].concat(fs.readdirSync(path.join(ROOT, 'admin')).filter((f) => /\.(js|css|html)$/.test(f)).map((f) => 'admin/' + f));
  const ext = []; const secrets = [];
  code.forEach((f) => { const t = fs.readFileSync(path.join(ROOT, f), 'utf8'); (t.match(/(?:src|href)=["']https?:\/\/[^"']+/g) || []).forEach((m) => { if (!/tiforti\.cl|wa\.me|claude\.ai/.test(m)) ext.push(f + ': ' + m); }); if (/AIza[0-9A-Za-z_-]{20,}|firebaseConfig|apiKey\s*[:=]\s*["'][^"']{8,}/.test(t)) secrets.push(f); });
  results.push(['Revisión estática · sin recursos externos inesperados ni credenciales', ext.length === 0 && secrets.length === 0, ext.concat(secrets).join('; ')]);

  // 3) Pruebas de navegador
  for (const [name, file, pass] of TESTS) {
    const t0 = Date.now();
    const r = await run(path.join(__dirname, file), env);
    const out = r.out;
    const okRun = r.status === 0 && pass.test(out);
    results.push([name, okRun, okRun ? '' : out.split('\n').filter(Boolean).slice(0, 8).join('\n    '), ((Date.now() - t0) / 1000).toFixed(0) + ' s', out]);
    if (process.env.VERBOSE) console.log('\n--- ' + name + '\n' + out);
  }
  if (srv) srv.close();

  console.log('\nRESULTADO DE QA\n' + '='.repeat(60));
  results.forEach(([n, ok, det, t]) => console.log((ok ? 'PASA   ' : 'FALLA  ') + n + (t ? '  (' + t + ')' : '') + (ok ? '' : '\n    ' + det)));
  const fails = results.filter((r) => !r[1]).length;
  console.log('='.repeat(60) + '\n' + (results.length - fails) + ' de ' + results.length + ' grupos pasan.' + (fails ? ' ' + fails + ' fallan.' : ''));
  process.exit(fails ? 1 : 0);
})();
