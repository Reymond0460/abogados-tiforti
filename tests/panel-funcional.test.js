const {go,act,filters}=require('./lib');
const {chromium}=require('playwright');const B=process.env.BASE||'http://localhost:8123';const issues=[];const ok=(c,m)=>{if(!c)issues.push(m)};
(async()=>{const b=await chromium.launch();
for(const w of [1440,390]){const tag=''+w;const p=await b.newPage({viewport:{width:w,height:900}});
p.on('pageerror',e=>issues.push(tag+' JSERR '+e.message));p.on('console',m=>{if(m.type()==='error')issues.push(tag+' CONSOLE '+m.text())});
p.on('response',r=>{if(r.status()>=400)issues.push(tag+' HTTP '+r.status()+' '+r.url())});
const reqs=[];p.on('request',r=>{if(!r.url().startsWith(B))issues.push(tag+' EXT '+r.url());reqs.push(r.method())});
await p.goto(B+'/admin/index.html');await p.waitForLoadState('networkidle');
await p.click('#login-submit');ok(!(await p.evaluate(()=>document.querySelector('#login-error').hidden)),tag+' login sin codigo');
await p.fill('#login-pass','contrasena123');await p.click('#login-submit');ok(await p.evaluate(()=>document.querySelector('#login').hidden&&!document.querySelector('#app').hidden),tag+' login');
if(w===1440)await p.screenshot({path:(process.env.OUT||'/tmp')+'/qa-panel-funcional-1.png',fullPage:true});else await p.screenshot({path:(process.env.OUT||'/tmp')+'/qa-panel-funcional-2.png',fullPage:true});
ok((await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth))<=0,tag+' overflow inbox');
// tomar consulta
const rows0=await p.evaluate(()=>document.querySelectorAll('#rows tr').length);
await p.click('#rows tr >> nth=0 >> button');ok(await p.evaluate(()=>document.querySelector('#detail').open),tag+' detalle');
await p.click('text=Tomar esta consulta');ok((await p.textContent('.pill')).includes('Tomada'),tag+' tomar');
// simular otro socio toma otra, abrir y probar bloqueo
await p.click('.close');ok(await p.evaluate(()=>document.activeElement.tagName==='BUTTON'),tag+' foco vuelve');
await p.click('#rows tr >> nth=1 >> button');
await p.evaluate(()=>{});// abrir la 2da (sin tomar) y simular conflicto
await p.click('.close');
// conflicto: abrir consulta sin tomar, luego otro la toma (simOther toma la primera 'nueva' sin dueño)
await (await filters(p),p).selectOption('#f-status','nueva');const first=await p.textContent('#rows tr >> nth=0 >> td');await p.click('#rows tr >> nth=0 >> button');
await p.evaluate(()=>{document.querySelector('#sim-other').click()}); // click via JS (detras del modal)
ok(await p.evaluate(()=>!!document.querySelector('.lock')),tag+' bloqueo tras toma de otro');
await p.click('.close');
// reasignar sin motivo
await (await filters(p),p).selectOption('#f-status','');await (await filters(p),p).selectOption('#f-owner','p1');
await p.click('#rows tr >> nth=0 >> button');
await p.click('[role=tab]:has-text("Reasignar")');await p.click('button.btn:text-is("Reasignar")');
ok(await p.evaluate(()=>/motivo/i.test(document.querySelector('#toast').textContent)),tag+' reasignar exige motivo');
await p.fill('#d-reason','Equilibrar carga');await p.click('button.btn:text-is("Reasignar")');
ok(await p.evaluate(()=>/reasignada/i.test(document.querySelector('#toast').textContent)),tag+' reasignar');
await p.click('[role=tab]:has-text("Notas")');await p.fill('#d-note','Nota de prueba');await p.click('text=Agregar nota');ok(await p.evaluate(()=>document.querySelector('.notes')?.textContent.includes('Nota de prueba')),tag+' nota');
await p.keyboard.press('Escape');ok(!(await p.evaluate(()=>document.querySelector('#detail').open)),tag+' esc');
await (await filters(p),p).selectOption('#f-owner','');
// simular nueva + avisos
await act(p,'simnew');await go(p,'notices');ok(await p.evaluate(()=>document.querySelectorAll('#log li').length>=1),tag+' aviso nueva');
ok(await p.evaluate(()=>[...document.querySelectorAll('#log li')].some(l=>l.textContent.includes('Nueva consulta')&&l.textContent.includes('consultas@nexo-demo.example'))),tag+' casilla compartida');
await p.click('#send-reminders');
await go(p,'team');ok(await p.evaluate(()=>document.querySelectorAll('.team-card').length)===3,tag+' equipo');
await go(p,'content');await p.fill('#f-hero_title-es','Titular nuevo de prueba');ok(await p.evaluate(()=>document.querySelector('#ed-preview').textContent.includes('Titular nuevo')),tag+' editor vista previa');
await go(p,'settings');await p.fill('#s-sla','2');await p.click('text=Aplicar plazo');
await go(p,'inbox');ok(await p.evaluate(()=>document.querySelector('.tile-late')!==null),tag+' sla cambia vencidas');
await act(p,'reset');ok(await p.evaluate(()=>document.querySelectorAll('#rows tr').length)===rows0,tag+' reset');
ok((await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth))<=0,tag+' overflow final');
ok(!reqs.some(m=>m!=='GET'),tag+' requests no GET');
await act(p,'logout');ok(await p.evaluate(()=>!document.querySelector('#login').hidden),tag+' logout');
await p.close()}
console.log(issues.length?issues.join('\n'):'SIN HALLAZGOS');await b.close()})();
