'use strict';
/* Ayudas para llamar APIs de Google con la sesión de la CLI de Firebase (refresh token guardado por «firebase login»). */
const fs = require('fs'), path = require('path'), os = require('os');
const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com', CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'; // cliente público de firebase-tools

function refreshToken() {
  const f = path.join(os.homedir(), '.config/configstore/firebase-tools.json'); const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  return (j.tokens && j.tokens.refresh_token) || j.refresh_token;
}
async function accessToken() {
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: refreshToken(), grant_type: 'refresh_token' }) });
  const j = await r.json(); if (!j.access_token) throw new Error('No se pudo obtener el token: ' + JSON.stringify(j).slice(0, 200)); return j.access_token;
}
async function call(method, url, body) {
  const t = await accessToken();
  const r = await fetch(url, { method, headers: { authorization: 'Bearer ' + t, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text(); let j; try { j = JSON.parse(text); } catch (e) { j = { raw: text }; }
  return { status: r.status, body: j };
}
/* Habilita APIs (idempotente) y espera a que queden activas. */
async function enableServices(project, services) {
  const r = await call('POST', `https://serviceusage.googleapis.com/v1/projects/${project}/services:batchEnable`, { serviceIds: services });
  if (r.status >= 400) throw new Error('No se pudieron habilitar las APIs: ' + JSON.stringify(r.body).slice(0, 300));
  for (let i = 0; i < 40; i++) {
    const s = await Promise.all(services.map((x) => call('GET', `https://serviceusage.googleapis.com/v1/projects/${project}/services/${x}`)));
    if (s.every((x) => x.body.state === 'ENABLED')) return; await new Promise((res) => setTimeout(res, 3000));
  }
  throw new Error('Las APIs no quedaron activas a tiempo; espera unos minutos y reintenta.');
}
module.exports = { accessToken, call, enableServices };
