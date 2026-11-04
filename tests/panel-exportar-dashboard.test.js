const {go,act,filters}=require('./lib');
const {chromium}=require('playwright');const B=process.env.BASE||'http://localhost:8123';const fs=require('fs');(async()=>{const b=await chromium.launch();const issues=[];const ok=(c,m)=>{if(!c)issues.push(m)};
for(const w of [1440,390]){const ctx=await b.newContext({viewport:{width:w,height:900},acceptDownloads:true,permissions:['clipboard-read','clipboard-write']});const p=await ctx.newPage();
p.on('pageerror',e=>issues.push(w+' JS '+e.message));p.on('console',m=>{if(m.type()==='error')issues.push(w+' CONSOLE '+m.text())});
await p.goto(B+'/admin/index.html');await p.fill('#login-pass','contrasena123');await p.click('#login-submit');
// export
const [dl]=await Promise.all([p.waitForEvent('download'),act(p,'export')]);ok(/consultas-nexo-\d{4}-\d{2}-\d{2}\.xlsx/.test(dl.suggestedFilename()),w+' nombre '+dl.suggestedFilename());
if(w===1440)await dl.saveAs((process.env.OUT||'/tmp')+'/qa-export.xlsx');
// el archivo es un .xlsx válido (ZIP con las partes mínimas)
if(w===1440){const buf=fs.readFileSync((process.env.OUT||'/tmp')+'/qa-export.xlsx');const txt=buf.toString('latin1');ok(buf[0]===0x50&&buf[1]===0x4B,w+' xlsx no es ZIP');ok(['[Content_Types].xml','xl/workbook.xml','xl/worksheets/sheet1.xml','xl/styles.xml'].every(n=>txt.includes(n)),w+' xlsx sin partes');}
// filtrado: area laboral
await (await filters(p),p).selectOption('#f-area','laboral');const [dl2]=await Promise.all([p.waitForEvent('download'),act(p,'export')]);await dl2.saveAs((process.env.OUT||'/tmp')+'/qa-export-lab.xlsx');await (await filters(p),p).selectOption('#f-area','');
// copiar
await act(p,'copy');await p.waitForTimeout(300);const clip=await p.evaluate(()=>navigator.clipboard.readText());ok(clip.split('\n').length===23&&clip.split('\n')[0].split('\t').length===12,w+' tsv '+clip.split('\n').length);
// dashboard
await go(p,'dash');await p.waitForTimeout(200);
ok(await p.evaluate(()=>document.querySelectorAll('#view-dash svg.chart').length)===5,w+' 5 graficos');
ok(await p.evaluate(()=>[...document.querySelectorAll('#view-dash svg.chart')].every(s=>s.getAttribute('aria-label').length>20)),w+' aria');
ok((await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth))<=0,w+' overflow');
await p.screenshot({path:`${process.env.OUT||'/tmp'}/dash-${w}.png`,fullPage:true});
// dashboard se actualiza al tomar
const before=await p.evaluate(()=>document.querySelector('#dash-kpis li:nth-child(2) .tile-n').textContent);
await go(p,'inbox');await p.click('#rows tr >> nth=0 >> button');await p.click('text=Tomar esta consulta');await p.keyboard.press('Escape');
await go(p,'dash');const lg=await p.evaluate(()=>document.querySelector('#lg-load').textContent);ok(lg.includes('En curso'),w+' leyenda');
await ctx.close()}
console.log(issues.length?issues.join('\n'):'SIN HALLAZGOS');await b.close()})();
