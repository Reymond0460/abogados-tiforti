const {chromium}=require('playwright');const B=process.env.BASE||'http://localhost:8123';(async()=>{const b=await chromium.launch();const bad=[];
for(const [w,h] of [[1440,900],[1280,720],[390,844],[375,812],[360,740]]){const p=await b.newPage({viewport:{width:w,height:h}});
await p.goto(B+'/admin/index.html');await p.fill('#login-pass','contrasena123');await p.click('#login-submit');
await p.click('#rows tr >> nth=0 >> button');const n=await p.evaluate(()=>document.querySelectorAll('#rows tr').length);const dims=new Set();
for(let i=0;i<n;i++){for(const t of ['Resumen','Notas','Historial','Reasignar']){await p.click(`[role=tab]:has-text("${t}")`);
 const r=await p.evaluate(()=>{const d=document.querySelector('#detail');const s=document.querySelector('.detail-scroll');const db=document.querySelector('#detail-body');return {dh:Math.round(d.getBoundingClientRect().height),dw:Math.round(d.getBoundingClientRect().width),sc:s.scrollHeight-s.clientHeight,bo:db.scrollHeight-db.clientHeight}});
 dims.add(r.dw+'x'+r.dh);if(r.sc>1||r.bo>1)bad.push(`${w}x${h} ficha ${i+1} pestaña ${t}: scroll interno ${r.sc}/${r.bo}`);}
 await p.click('[role=tab]:has-text("Resumen")');if(i<n-1)await p.click('text=Siguiente →');}
console.log(w+'x'+h,'tamaños:',[...dims].join(' '));await p.close()}
console.log(bad.length?bad.slice(0,12).join('\n')+(bad.length>12?'\n... '+bad.length+' en total':''):'SIN SCROLL EN NINGUNA PESTAÑA');await b.close()})();
