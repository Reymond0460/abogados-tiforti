const {chromium}=require('playwright');const B=process.env.BASE||'http://localhost:8123';(async()=>{const b=await chromium.launch();const issues=[];const ok=(c,m)=>{if(!c)issues.push(m)};
for(const w of [1440,390]){const ctx=await b.newContext({viewport:{width:w,height:900},permissions:['clipboard-read','clipboard-write']});const p=await ctx.newPage();
p.on('pageerror',e=>issues.push(w+' JS '+e.message));p.on('console',m=>{if(m.type()==='error')issues.push(w+' CONSOLE '+m.text())});
await p.goto(B+'/admin/index.html');await p.fill('#login-pass','contrasena123');await p.click('#login-submit');
await p.click('#rows tr >> nth=0 >> button');
ok(await p.evaluate(()=>!!document.querySelector('.sla')),w+' sla');
if(w===390)await p.screenshot({path:(process.env.OUT||'/tmp')+'/qa-panel-ficha-1.png'});
// copiar
await p.click('button[aria-label^="Copiar correo"]');ok((await p.evaluate(()=>navigator.clipboard.readText())).includes('@'),w+' copiar');
// navegar siguiente
const t1=await p.textContent('#detail-title');await p.click('text=Siguiente →');const t2=await p.textContent('#detail-title');ok(t1!==t2,w+' siguiente');await p.click('text=← Anterior');ok((await p.textContent('#detail-title'))===t1,w+' anterior');
// tomar -> segmentado
await p.click('text=Tomar esta consulta');ok(await p.evaluate(()=>document.querySelectorAll('.seg').length===3&&document.querySelector('.seg-on').textContent==='En curso'),w+' segmentos');
await p.click('.seg >> nth=1');ok(await p.evaluate(()=>document.querySelector('.seg-on').textContent==='Esperando respuesta'),w+' espera');
await p.click('.seg >> nth=2');ok(await p.evaluate(()=>/Consulta cerrada/.test(document.querySelector('#detail-body').textContent)),w+' cerrada');
await p.click('text=Reabrir consulta');ok(await p.evaluate(()=>document.querySelectorAll('.seg').length===3),w+' reabrir');
if(w===1440)await p.screenshot({path:(process.env.OUT||'/tmp')+'/qa-panel-ficha-2.png'});
ok((await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth))<=0,w+' overflow');
await ctx.close()}
console.log(issues.length?issues.join('\n'):'SIN HALLAZGOS');await b.close()})();
