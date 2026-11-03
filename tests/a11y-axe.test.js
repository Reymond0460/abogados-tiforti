const {chromium}=require('playwright');const B=process.env.BASE||'http://localhost:8123';const fs=require('fs');
const AXE=fs.readFileSync(process.env.AXE_PATH||require.resolve('axe-core/axe.min.js'),'utf8');
const all=[];
async function scan(p,name){await p.evaluate(AXE);const r=await p.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}}));
 for(const v of r.violations)all.push({name,id:v.id,impact:v.impact,help:v.help,n:v.nodes.length,ex:v.nodes.slice(0,2).map(x=>x.target.join(' ')+' :: '+(x.failureSummary||'').split('\n')[1])});
 return r.violations.length}
(async()=>{const b=await chromium.launch();
for(const [w,h] of [[1440,900],[390,844]]){
 for(const lang of ['es','en']){const p=await b.newPage({viewport:{width:w,height:h}});await p.goto(B+'/index.html');await p.waitForLoadState('networkidle');if(lang==='en')await p.click('[data-lang=en]');
  await p.evaluate(()=>document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager'));await p.waitForTimeout(500);
  await scan(p,`sitio ${w} ${lang}`);
  await p.click('#a11y-toggle');await scan(p,`sitio ${w} ${lang} panel accesibilidad`);await p.keyboard.press('Escape');
  await p.click('[data-open=civil] >> nth=0');await scan(p,`sitio ${w} ${lang} ventana área`);await p.keyboard.press('Escape');
  await p.click('[data-open=socio1] >> nth=0');await scan(p,`sitio ${w} ${lang} ventana socio`);await p.keyboard.press('Escape');
  await p.click('footer [data-open=privacy]');await scan(p,`sitio ${w} ${lang} privacidad`);await p.keyboard.press('Escape');
  await p.close()}
 // alto contraste
 {const p=await b.newPage({viewport:{width:w,height:h}});await p.goto(B+'/index.html');await p.evaluate(()=>document.documentElement.classList.add('a11y-contrast'));await scan(p,`sitio ${w} alto contraste`);await p.close()}
 // admin
 const p=await b.newPage({viewport:{width:w,height:h}});await p.goto(B+'/admin/index.html');await p.waitForLoadState('networkidle');
 await scan(p,`admin ${w} ingreso`);
 await p.fill('#login-pass','contrasena123');await p.click('#login-submit');
 await scan(p,`admin ${w} consultas`);
 await p.click('#rows tr >> nth=0 >> button');for(const t of ['Resumen','Notas','Historial','Reasignar']){await p.click(`[role=tab]:has-text("${t}")`);await scan(p,`admin ${w} ficha ${t}`)}await p.keyboard.press('Escape');
 await p.click('#register');await scan(p,`admin ${w} registrar`);await p.keyboard.press('Escape');
 for(const v of ['dash','team','notices','content','settings']){await p.click(`[data-view=${v}]`);await scan(p,`admin ${w} ${v}`)}
 await p.click('[data-view=content]');await p.fill('#f-hero_title-es','Nuevo titular de prueba. Segunda frase.');await p.click('#ed-publish');await scan(p,`admin ${w} confirmar publicación`);await p.close()}
await b.close();
const by={};all.forEach(v=>{const k=v.id;(by[k]=by[k]||{impact:v.impact,help:v.help,where:new Set(),n:0,ex:v.ex});by[k].where.add(v.name);by[k].n+=v.n});
const out=Object.entries(by).map(([id,v])=>({id,impact:v.impact,help:v.help,pantallas:v.where.size,nodos:v.n,ejemplo:v.ex,donde:[...v.where].slice(0,4)}));
fs.writeFileSync((process.env.OUT||'/tmp')+'/axe-result.json',JSON.stringify(out,null,1));
console.log(out.length?out.map(o=>`${o.impact.toUpperCase()} ${o.id} (${o.pantallas} pantallas, ${o.nodos} nodos): ${o.help}\n   ej: ${o.ejemplo[0]}\n   en: ${o.donde.join(' | ')}`).join('\n'):'SIN VIOLACIONES AXE');})();
