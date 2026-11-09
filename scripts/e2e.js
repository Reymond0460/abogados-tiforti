'use strict';
/* Construye dist para emuladores y ejecuta la prueba de punta a punta con Auth + Firestore + Hosting emulados. */
const { spawnSync } = require('child_process'); const path = require('path');
const root = path.resolve(__dirname, '..');
const run = (cmd, args) => spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
if (run(process.execPath, ['scripts/build.js', '--emulator']).status !== 0) process.exit(1);
const r = run('npx', ['firebase', 'emulators:exec', '--config', 'firebase.emulator.json', '--project', 'demo-nexo', '--only', 'auth,firestore,hosting', 'node tests/firebase/e2e.test.js']);
process.exit(r.status || 0);
