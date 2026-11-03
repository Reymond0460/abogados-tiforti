const {chromium}=require('playwright');const B=process.env.BASE||'http://localhost:8123';(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto(B+'/admin/index.html');await p.fill('#login-pass','contrasena123');await p.click('#login-submit');
console.log('visible con true',await p.isVisible('#copy-xlsx'),await p.isVisible('#export-xlsx'));
const p2=await b.newPage();await p2.route('**/admin/config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.ADMIN_CONFIG={showCopyFallback:false};'}));
await p2.goto(B+'/admin/index.html');await p2.fill('#login-pass','contrasena123');await p2.click('#login-submit');
console.log('visible con false',await p2.isVisible('#copy-xlsx'),await p2.isVisible('#export-xlsx'));await b.close()})();
