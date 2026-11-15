import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {chromium} from 'playwright';
const html=fs.readFileSync('hsk1-map.html','utf8');
assert(html.includes('v376-no-duplicate-edges-press-feedback'));
assert(!html.includes('body::before{'));
assert(!html.includes('center center/cover no-repeat'));
const checksum=crypto.createHash('sha256').update(fs.readFileSync('assets/hsk1-approved-v373.png')).digest('hex');
assert.equal(checksum,'4d280e4bdd40994cbfc8e2f0ab32789dc6f856a2cdbb88f312f59eee05f03af0');
fs.mkdirSync('qa/hsk1-v376',{recursive:true});
const browser=await chromium.launch({headless:true});
const urls=['./hsk1-rhythm.html','./hsk1-pronunciation.html','./panda-voice-pilot.html'];
try {
 for(const [w,h] of [[320,568],[360,640],[393,852],[412,915],[694,1433]]) {
   const context=await browser.newContext({viewport:{width:w,height:h},isMobile:true,hasTouch:true});
   const page=await context.newPage();
   const jsErrors=[];page.on('pageerror',e=>jsErrors.push(e.message));
   await page.goto('http://127.0.0.1:4173/hsk1-map.html',{waitUntil:'load'});
   const d=await page.evaluate(()=>{
     const art=document.querySelector('.artboard').getBoundingClientRect();
     const approved=document.querySelector('img.approved');
     return {
       w:innerWidth,h:innerHeight,scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],
       art:[art.x,art.y,art.width,art.height],image:[approved.naturalWidth,approved.naturalHeight],
       bodyBg:getComputedStyle(document.body).backgroundImage,
       targets:[...document.querySelectorAll('.hotspots a')].map(a=>{
        const r=a.getBoundingClientRect();
        return {label:a.getAttribute('aria-label'),tap:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.closest('a')===a,rect:[r.left,r.top,r.right,r.bottom]};
       })
     }
   });
   assert.deepEqual(d.image,[694,1536]);
   assert(d.bodyBg.includes('linear-gradient')&&!d.bodyBg.includes('url('),'Duplicated background visible');
   assert(d.scroll[0]<=w+1&&d.scroll[1]<=h+1,'Overflow at '+w+'x'+h);
   assert.equal(d.targets.length,12);
   for(const a of d.targets){assert(a.tap,'Click target broken: '+a.label);assert(a.rect[0]>=-1&&a.rect[1]>=-1&&a.rect[2]<=w+1&&a.rect[3]<=h+1)}
   assert.deepEqual(jsErrors,[]);
   if(w===393){
     await page.screenshot({path:'qa/hsk1-v376/393x852-initial.png'});
     const button=page.locator('.lesson[data-num="1"]');
     await button.dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch',isPrimary:true});
     assert(await button.evaluate(a=>a.classList.contains('is-pressed')),'No visual press state');
     await page.waitForTimeout(160);
     const opacity=Number(await button.evaluate(a=>getComputedStyle(a,'::after').opacity));
     assert(opacity>0.95,'Press highlight invisible, opacity '+opacity);
     await button.dispatchEvent('pointerup',{pointerId:1,pointerType:'touch',isPrimary:true});
     await page.waitForTimeout(250);
     assert(!(await button.evaluate(a=>a.classList.contains('is-pressed'))));
     await page.locator('.lesson[data-num="2"]').click({force:true});
     assert(await page.locator('.toast').isVisible(),'No locked-lesson toast');
     await page.evaluate(()=>{localStorage.setItem('pg-hsk1-v3-complete','["foundations"]');localStorage.setItem('pg-hsk1-path-v371','4')});
     await page.reload();
     for(let n=1;n<=7;n++){
       const a=page.locator('.lesson[data-num="'+n+'"]');
       assert.equal(await a.getAttribute('aria-disabled'),String(n>5));
       assert.equal(await a.evaluate(x=>x.classList.contains('done')),n<=4);
     }
     assert.equal(await page.evaluate(()=>localStorage.getItem('pg-hsk1-v3-complete')),'["foundations"]');
     await page.screenshot({path:'qa/hsk1-v376/393x852-progress4.png'});
     const fourth=page.locator('.lesson[data-num="4"]');
     await fourth.click();
     await page.waitForURL('**/hsk1-fourth-v214.html',{timeout:12000});
     await page.goBack();
     await page.waitForTimeout(300);
     assert.equal(await page.locator('.lesson').count(),7);
   }
   console.log('PASS '+w+'x'+h+' intact PNG, no duplicate edges, 12 valid targets, no scrolling');
   await context.close();
 }
 console.log('PASS v376 button press and release, navigation, locked feedback, and preserved progress');
}finally{await browser.close()}