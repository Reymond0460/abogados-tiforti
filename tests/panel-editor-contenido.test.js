const {go,act,filters}=require('./lib');
const {chromium}=require('playwright');const B=process.env.BASE||'http://localhost:8123';(async()=>{const b=await chromium.launch();const issues=[];const ok=(c,m)=>{if(!c)issues.push(m)};
for(const w of [1440,390]){const t=''+w;const p=await b.newPage({viewport:{width:w,height:900}});p.on('pageerror',e=>issues.push(t+' JS '+e.message));p.on('console',m=>{if(m.type()==='error')issues.push(t+' CONSOLE '+m.text())});
const reqs=[];p.on('request',r=>{if(r.method()!=='GET')reqs.push(r.method())});
await p.goto(B+'/admin/index.html');await p.fill('#login-pass','contrasena123');await p.click('#login-submit');
await go(p,'content');await p.click('.ed-lang >> nth=0 >> button >> nth=0');
ok(await p.evaluate(()=>document.querySelectorAll('.ed-nav button').length)===6,t+' 6 secciones');
ok(await p.evaluate(()=>document.querySelectorAll('.ed-field').length)===4,t+' 4 campos portada');
const title='#f-hero_title-es';
await p.fill(title,'Decisiones simples. Atención humana.');
ok(await p.evaluate(()=>/1 cambio sin publicar/.test(document.querySelector('.ed-nav button[aria-current=true]').textContent)),t+' pill cambios');
ok(await p.evaluate(()=>document.querySelector('#ed-preview').textContent.includes('Atención humana')),t+' preview');
ok(await p.evaluate(()=>/automáticamente/.test(document.querySelector('#ed-status').textContent)),t+' autoguardado');
ok(await p.evaluate(()=>!document.querySelector('#ed-publish').disabled),t+' publicar habilitado');
// cambia de sección y vuelve: el borrador se conserva
await p.click('.ed-nav button >> nth=1');await p.click('.ed-nav button >> nth=0');ok((await p.inputValue(title))==='Decisiones simples. Atención humana.',t+' borrador conservado');
// excede el máximo
await p.fill(title,'x'.repeat(70));ok(await p.evaluate(()=>document.querySelector('#cnt-hero_title-es').classList.contains('cnt-over')),t+' contador');
await p.click('#ed-publish');ok(await p.evaluate(()=>/supera los 60/.test(document.querySelector('#ed-status').textContent)&&document.querySelector('#f-hero_title-es').getAttribute('aria-invalid')==='true'),t+' error maximo');
ok(!(await p.evaluate(()=>document.querySelector('#confirm-dialog').open)),t+' no abre confirm con error');
// falta inglés
await p.fill(title,'Decisiones simples. Atención humana.');await p.fill('#f-hero_title-en','');await p.click('#ed-publish');ok(await p.evaluate(()=>/Falta el texto en inglés/.test(document.querySelector('#ed-status').textContent)),t+' falta ingles');
await p.fill('#f-hero_title-en','Simple decisions. Human care.');
// confirmar
await p.click('#ed-publish');ok(await p.evaluate(()=>document.querySelector('#confirm-dialog').open&&document.querySelectorAll('#confirm-list li').length===1&&document.querySelector('#confirm-list').textContent.includes('Español')&&document.querySelector('#confirm-list').textContent.includes('English')),t+' confirm lista');
await p.click('#confirm-cancel');ok(!(await p.evaluate(()=>document.querySelector('#confirm-dialog').open)),t+' cancelar');
await p.click('#ed-publish');await p.click('#confirm-ok');
ok(await p.evaluate(()=>/Publicado/.test(document.querySelector('.ed-nav button[aria-current=true] .pill').textContent)&&document.querySelector('#ed-publish').disabled),t+' publicado');
ok(await p.evaluate(()=>/Versiones publicadas \(2\)/.test(document.querySelector('.ed-card summary').textContent)),t+' version nueva');
// volver a lo publicado
await p.fill(title,'Otro titular. Prueba.');await p.click('#ed-revert');ok((await p.inputValue(title))==='Decisiones simples. Atención humana.',t+' revertir');
// restaurar versión inicial
await p.click('.ed-card summary');await p.click('.versions li >> nth=-1 >> button');ok((await p.inputValue(title))==='Decisiones claras. Asesoría cercana.',t+' restaurar');
// idioma
await p.click('.ed-lang >> nth=0 >> button >> nth=1');ok(await p.evaluate(()=>getComputedStyle(document.querySelector('#f-hero_title-en')).display==='none'||document.querySelector('#f-hero_title-en').offsetParent===null),t+' ocultar ingles');
// vista previa en inglés
await p.click('.pvtabs button >> nth=1');ok(await p.evaluate(()=>/Close counsel|Simple decisions/.test(document.querySelector('#ed-preview').textContent)),t+' preview en');
// todas las secciones renderizan vista previa
for(let i=0;i<6;i++){await p.click(`.ed-nav button >> nth=${i}`);ok(await p.evaluate(()=>document.querySelector('#ed-preview').children.length>0),t+' preview sec '+i);}
ok((await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth))<=0,t+' overflow');
await p.click('.ed-nav button >> nth=0');await p.screenshot({path:`${process.env.OUT||'/tmp'}/ed-${w}.png`,fullPage:true});
ok(!reqs.length,t+' requests');
await p.close()}
console.log(issues.length?issues.join('\n'):'SIN HALLAZGOS');await b.close()})();
