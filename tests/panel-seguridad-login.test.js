const {go,act,filters}=require('./lib');
const {chromium}=require('playwright');const B=process.env.BASE||'http://localhost:8123';(async()=>{const b=await chromium.launch();const issues=[];const ok=(c,m)=>{if(!c)issues.push(m)};
const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();
p.on('console',m=>{if(m.type()==='error')issues.push('CONSOLE '+m.text())});p.on('pageerror',e=>issues.push('JS '+e.message));
await p.route('**/admin/config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.ADMIN_CONFIG={showCopyFallback:true,security:{maxAttempts:3,lockSeconds:2,sessionMinutes:0.07,warnSeconds:3}};'}));
await p.goto(B+'/admin/index.html');await p.waitForLoadState('networkidle');
// 000000 falla y no revela cual dato
await p.fill('#login-pass','incorrecta123');await p.click('#login-submit');
ok(await p.evaluate(()=>/No pudimos verificar/.test(document.querySelector('#login-error').textContent)&&/Te quedan 2 intentos/.test(document.querySelector('#login-error').textContent)),'mensaje generico');
ok(await p.evaluate(()=>document.querySelector('#login-code').value===''),'limpia codigo');
// contraseña corta: error de formato que NO cuenta como intento
await p.fill('#login-pass','corta');await p.click('#login-submit');ok(await p.evaluate(()=>/mínimo 12/.test(document.querySelector('#login-error').textContent)&&document.querySelector('#login-pass').getAttribute('aria-invalid')==='true'),'formato contraseña');
await p.fill('#login-pass','incorrecta123');await p.click('#login-submit');
// tercer intento: bloqueo
await p.fill('#login-pass','incorrecta123');await p.click('#login-submit');
ok(await p.evaluate(()=>document.querySelector('#login-submit').disabled&&/Demasiados intentos/.test(document.querySelector('#login-error').textContent)),'bloqueo');
ok(await p.evaluate(()=>document.querySelector('#login-pass').value===''),'limpia contraseña');
// durante el bloqueo, aunque sea correcto no entra
await p.fill('#login-pass','contrasena123');await p.evaluate(()=>document.querySelector('#login-form').requestSubmit());
ok(await p.evaluate(()=>!document.querySelector('#login').hidden),'no entra durante bloqueo');
await p.waitForFunction(()=>!document.querySelector('#login-submit').disabled,null,{timeout:6000});
// toggle mostrar
await p.fill('#login-pass','contrasena123');await p.click('#pass-toggle');ok(await p.evaluate(()=>document.querySelector('#login-pass').type==='text'),'mostrar');await p.click('#pass-toggle');
await p.click('#login-submit');
ok(await p.evaluate(()=>!document.querySelector('#app').hidden&&document.querySelectorAll('#rows tr').length>0),'entra');
// inactividad: aviso y cierre
await p.waitForSelector('#session-dialog[open]',{timeout:5000});ok(true);
await p.waitForFunction(()=>document.querySelector('#app').hidden,null,{timeout:8000});
ok(await p.evaluate(()=>/inactividad/.test(document.querySelector('#login-msg').textContent)&&document.querySelectorAll('#rows tr').length===0),'cierra y limpia');
// seguir conectado
await p.fill('#login-pass','contrasena123');await p.click('#login-submit');
await p.waitForSelector('#session-dialog[open]',{timeout:5000});await p.click('#session-keep');ok(await p.evaluate(()=>!document.querySelector('#app').hidden&&!document.querySelector('#session-dialog').open),'seguir conectado');
// salir manual
await act(p,'logout');ok(await p.evaluate(()=>document.querySelectorAll('#rows tr').length===0&&!document.querySelector('#login').hidden),'logout limpia');
console.log(issues.length?issues.join('\n'):'SIN HALLAZGOS');await b.close()})();
