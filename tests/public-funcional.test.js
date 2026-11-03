const {chromium}=require('playwright');const B=process.env.BASE||'http://localhost:8123';
const issues=[];const ok=(c,m)=>{if(!c)issues.push(m)};
(async()=>{const b=await chromium.launch();
for(const [w,lang] of [[1440,'es'],[1440,'en'],[390,'es'],[390,'en']]){
 const tag=`${w}/${lang}`;const p=await b.newPage({viewport:{width:w,height:844}});
 p.on('pageerror',e=>issues.push(tag+' JSERR '+e.message));
 p.on('console',m=>{if(m.type()==='error')issues.push(tag+' CONSOLE '+m.text())});
 p.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon.ico'))issues.push(tag+' HTTP '+r.status()+' '+r.url())});
 await p.goto(B+'/index.html');await p.waitForLoadState('networkidle');
 if(lang==='en')await p.click('[data-lang=en]');
 const missing=await p.evaluate(()=>{const miss=[];document.querySelectorAll('[data-i18n],[data-i18n-html]').forEach(e=>{const k=e.dataset.i18n||e.dataset.i18nHtml;if(I18N.en[k]===undefined||I18N.es[k]===undefined)miss.push(k)});document.querySelectorAll('[data-i18n-attr]').forEach(e=>e.dataset.i18nAttr.split(',').forEach(x=>{const k=x.split(':')[1];if(I18N.en[k]===undefined||I18N.es[k]===undefined)miss.push(k)}));return miss});
 ok(!missing.length,tag+' missing keys '+missing);
 const anchors=await p.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')));
 for(const h of new Set(anchors)){const ex=await p.evaluate(h=>h==='#'||!!document.querySelector(h),h);ok(ex,tag+' broken anchor '+h)}
 for(const h of ['#estudio','#areas','#equipo','#contacto','#proceso','#inicio']){
  if(w<800)await p.click('.menu-toggle');
  const link=await p.$(`a[href="${h}"]:visible`);
  if(link){await link.click();await p.waitForTimeout(800);
   const top=await p.evaluate(h=>document.querySelector(h).getBoundingClientRect().top,h);ok(top<400&&top>-300,tag+' anchor '+h+' top='+Math.round(top));
   if(w<800&&link&&await link.evaluate(e=>!!e.closest('#main-nav')))ok(await p.getAttribute('.menu-toggle','aria-expanded')==='false',tag+' menu not closed after '+h);}
  else if(w<800){await p.keyboard.press('Escape')}
 }
 const keys=await p.evaluate(()=>[...new Set([...document.querySelectorAll('[data-open]')].map(e=>e.dataset.open))]);
 for(const k of keys){
  const btns=await p.$$(`[data-open="${k}"]`);
  for(const btn of btns){await btn.scrollIntoViewIfNeeded();await btn.click();
   const st=await p.evaluate(()=>({open:document.querySelector('#detail-dialog').open,lock:document.body.classList.contains('modal-open'),h:document.querySelector('#dialog-title')?.textContent,fits:(()=>{const r=document.querySelector('#detail-dialog').getBoundingClientRect();return r.bottom<=innerHeight+1&&r.right<=innerWidth+1})()}));
   ok(st.open&&st.lock&&st.h,tag+' dialog '+k+' '+JSON.stringify(st));ok(st.fits,tag+' dialog '+k+' overflows viewport');
   await p.click('.dialog-close');ok(!(await p.evaluate(()=>document.querySelector('#detail-dialog').open)),tag+' X no cierra '+k);
   ok(await p.evaluate(el=>document.activeElement===el,btn),tag+' focus no vuelve '+k);
   await btn.click();await p.keyboard.press('Escape');ok(!(await p.evaluate(()=>document.querySelector('#detail-dialog').open)),tag+' Esc no cierra '+k);
   await btn.click();await p.mouse.click(3,3);ok(!(await p.evaluate(()=>document.querySelector('#detail-dialog').open)),tag+' fuera no cierra '+k);
   await p.waitForTimeout(120);ok(!(await p.evaluate(()=>document.body.classList.contains('modal-open'))),tag+' scroll lock persiste '+k);
  }
  await btns[0].scrollIntoViewIfNeeded();await btns[0].click();const c=await p.$('#dialog-content a.button');
  if(c){await c.click();await p.waitForTimeout(800);ok(!(await p.evaluate(()=>document.querySelector('#detail-dialog').open)),tag+' CTA no cierra '+k);ok(await p.evaluate(()=>document.querySelector('#contacto').getBoundingClientRect().top<500),tag+' CTA no navega '+k);}
  else await p.keyboard.press('Escape');
 }
 const sums=await p.$$('details summary');for(const s of sums){await s.scrollIntoViewIfNeeded();await s.click();}
 ok((await p.$$('details[open]')).length===4,tag+' faq');
 await p.evaluate(()=>document.querySelector('#contact-form').scrollIntoView());
 await p.click('.submit-button');ok(await p.evaluate(()=>document.querySelector('#form-status').hidden),tag+' form envio vacio');
 await p.fill('#nombre','Ana');await p.fill('#contacto-dato','malcorreo');await p.check('.check-label input');await p.selectOption('#area','civil');await p.click('.submit-button');
 ok(await p.evaluate(()=>document.querySelector('#form-status').hidden),tag+' correo invalido aceptado');
 await p.fill('#contacto-dato','a@b.cl');
 const reqs=[];p.on('request',r=>reqs.push(r.url()));await p.click('.submit-button');
 const f=await p.evaluate(()=>({h:document.querySelector('#form-status').hidden,foc:document.activeElement.id,n:document.querySelector('#nombre').value,c:document.querySelector('.check-label input').checked,sel:document.querySelector('#area').value,ls:Object.keys(localStorage)}));
 ok(!f.h&&f.foc==='form-status'&&!f.n&&!f.c&&!f.sel,tag+' form '+JSON.stringify(f));ok(!reqs.length,tag+' form hizo requests '+reqs);
 await p.click('#a11y-toggle');ok(await p.getAttribute('#a11y-toggle','aria-expanded')==='true',tag+' panel no abre');
 ok(await p.evaluate(()=>document.activeElement.id==='a11y-close'),tag+' panel sin foco');
 for(const fl of ['contrast','gray','links','font','spacing','motion']){await p.click(`[data-a11y=${fl}]`);ok(await p.evaluate(x=>document.documentElement.classList.contains('a11y-'+x),fl),tag+' flag '+fl);ok(await p.getAttribute(`[data-a11y=${fl}]`,'aria-pressed')==='true',tag+' pressed '+fl);
   ok((await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth))<=0,tag+' overflow con '+fl);}
 await p.click('#a11y-inc');await p.click('#a11y-inc');await p.click('#a11y-inc');ok(await p.evaluate(()=>document.querySelector('#a11y-inc').disabled),tag+' inc no deshabilita');
 ok((await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth))<=0,tag+' overflow max');
 await p.click('#a11y-dec');await p.click('#a11y-reset');ok(await p.evaluate(()=>!/a11y/.test(document.documentElement.className)),tag+' reset');
 await p.keyboard.press('Escape');ok(await p.evaluate(()=>document.querySelector('#a11y-panel').hidden),tag+' Esc panel');ok(await p.evaluate(()=>document.activeElement.id==='a11y-toggle'),tag+' foco vuelve fab');
 await p.click('[data-lang='+(lang==='es'?'en':'es')+']');await p.click('[data-lang='+lang+']');
 if(w<800){await p.evaluate(()=>scrollTo(0,0));await p.click('.menu-toggle');ok(await p.getAttribute('.menu-toggle','aria-expanded')==='true',tag+' menu');await p.keyboard.press('Escape');ok(await p.getAttribute('.menu-toggle','aria-expanded')==='false',tag+' menu esc');}
 await p.evaluate(()=>scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(500);
 ok((await p.evaluate(()=>[...document.images].filter(i=>!i.naturalWidth).length))===0,tag+' imgs rotas');ok(await p.evaluate(()=>document.fonts.check('600 16px Jost')),tag+' font');
 const small=await p.evaluate(()=>[...document.querySelectorAll('button,a,summary,input,select')].filter(e=>{const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return r.width>0&&cs.visibility!=='hidden'&&(r.height<24||r.width<24)&&!e.closest('dialog:not([open])')&&e.className!=='skip-link'}).map(e=>(e.className||e.tagName)+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height)));
 ok(!small.length,tag+' targets<24: '+small.join(' | '));
 await p.close();}
console.log(issues.length?issues.join('\n'):'SIN HALLAZGOS');await b.close()})();
