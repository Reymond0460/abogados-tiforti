const {chromium}=require('playwright');const B=process.env.BASE||'http://localhost:8123';(async()=>{const b=await chromium.launch();const issues=[];const ok=(c,m)=>{if(!c)issues.push(m)};
for(const w of [1440,390]){const p=await b.newPage({viewport:{width:w,height:900}});p.on('pageerror',e=>issues.push(w+' JS '+e.message));const reqs=[];p.on('request',r=>{if(r.method()!=='GET')reqs.push(r.method())});
await p.goto(B+'/admin/index.html');await p.fill('#login-pass','contrasena123');await p.click('#login-submit');
const n0=await p.evaluate(()=>document.querySelectorAll('#rows tr').length);
await p.click('#register');ok(await p.evaluate(()=>document.querySelector('#detail').open),w+' abre');
await p.click('#reg-form button[type=submit]');ok(await p.evaluate(()=>/nombre/i.test(document.querySelector('#reg-form .error').textContent)),w+' exige nombre');
await p.fill('#r-name','María Test');await p.click('#reg-form button[type=submit]');ok(await p.evaluate(()=>/correo o un teléfono/i.test(document.querySelector('#reg-form .error').textContent)),w+' exige contacto');
await p.fill('#r-email','mal');await p.click('#reg-form button[type=submit]');ok(await p.evaluate(()=>/formato/i.test(document.querySelector('#reg-form .error').textContent)),w+' correo invalido');
await p.fill('#r-email','');await p.fill('#r-phone','+56 9 1234 5678');await p.selectOption('#r-channel','whatsapp');await p.fill('#r-summary','Consulta por despido');
if(w===390)await p.screenshot({path:(process.env.OUT||'/tmp')+'/qa-panel-registro-1.png'});
await p.click('#reg-form button[type=submit]');
ok(await p.evaluate(()=>!document.querySelector('#detail').open),w+' cierra');
ok(await p.evaluate(n=>document.querySelectorAll('#rows tr').length===n+1,n0),w+' agrega fila');
const first=await p.evaluate(()=>document.querySelector('#rows tr').textContent);ok(first.includes('María Test')&&first.includes('WhatsApp')&&first.includes('Tomada'),w+' fila '+first);
await p.click('#rows tr >> nth=0 >> button');ok(await p.evaluate(()=>document.querySelector('#detail-body').textContent.includes('registrada a mano')&&document.querySelector('#detail-body').textContent.includes('Consulta por despido')),w+' detalle');
await p.keyboard.press('Escape');await p.click('[data-view=notices]');ok(await p.evaluate(()=>document.querySelector('#log').textContent.includes('registrada a mano')),w+' aviso');
ok((await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth))<=0,w+' overflow');ok(!reqs.length,w+' requests');
await p.close()}
console.log(issues.length?issues.join('\n'):'SIN HALLAZGOS');await b.close()})();
