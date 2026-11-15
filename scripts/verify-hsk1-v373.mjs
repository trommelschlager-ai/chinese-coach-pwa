import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {chromium} from 'playwright';

const asset = 'assets/hsk1-approved-v373.png';
const png = fs.readFileSync(asset);
const expectedSha256 = '4d280e4bdd40994cbfc8e2f0ab32789dc6f856a2cdbb88f312f59eee05f03af0';
assert.equal(crypto.createHash('sha256').update(png).digest('hex'), expectedSha256, 'Approved original artwork changed');
assert.equal(png.subarray(0,8).toString('hex'), '89504e470d0a1a0a', 'File must be real PNG');
const html=fs.readFileSync('hsk1-map.html','utf8');
assert(html.includes('v373-exact-approved-art'));
assert(html.includes('pg-hsk1-path-v371'));
const routePaths=['hsk1-first-v189.html','hsk1-second-v203.html','hsk1-third-v212.html','hsk1-fourth-v214.html','hsk1-fifth-v227.html','hsk1-lesson.html?lesson=6','hsk1-lesson.html?lesson=7'];
const footerPaths=['hsk1-rhythm.html','hsk1-pronunciation.html','panda-voice-pilot.html'];
for(const path of [...routePaths,...footerPaths])assert(fs.existsSync(path.split('?')[0]),'Missing destination '+path);
fs.mkdirSync('qa/hsk1-v373',{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[];
try {
 for(const [w,h] of [[320,568],[360,640],[360,800],[393,852],[412,915]]) {
   const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:true,hasTouch:true});
   const page=await context.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:4173/hsk1-map.html',{waitUntil:'load'});
   const state=await page.evaluate(() => {
     const image=document.querySelector('img.approved');
     return {
       imageLoaded:image.complete && image.naturalWidth>0,
       imageSize:[image.naturalWidth,image.naturalHeight],
       doc:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],
       viewport:[innerWidth,innerHeight],
       lessonTargets:[...document.querySelectorAll('.lesson')].map(a => {
         const r=a.getBoundingClientRect();
         const target=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
         return {num:Number(a.dataset.num),href:a.getAttribute('href'),locked:a.classList.contains('locked'),clickable:!!target?.closest('a.lesson')};
       }),
       footerTargets:[...document.querySelectorAll('.footer-link')].map(a=>a.getAttribute('href')),
     };
   });
   assert(state.imageLoaded,'Approved image did not load at '+w+'x'+h);
   assert.deepEqual(state.imageSize,[694,1536]);
   assert(state.doc[0]<=w+1 && state.doc[1]<=h+1,'Scroll/overflow at '+w+'x'+h+' '+JSON.stringify(state));
   assert.equal(state.lessonTargets.length,7);
   assert.equal(state.lessonTargets.filter(a=>a.locked).length,6);
   for(const a of state.lessonTargets){
     assert.equal(a.href,'./'+routePaths[a.num-1]);
     assert(a.clickable,'Touch target unavailable: '+a.num);
   }
   assert.deepEqual(state.footerTargets,footerPaths.map(x=>'./'+x));
   if(w===393){
     await page.screenshot({path:'qa/hsk1-v373/android-393x852-initial.png',fullPage:true});
     await page.locator('.lesson[data-num="2"]').click({force:true});
     assert(await page.locator('.toast').isVisible());
     assert((await page.locator('.toast').innerText()).includes('Сначала заверши урок 1'));
     await page.evaluate(()=>localStorage.setItem('pg-hsk1-v3-complete','["foundations"]'));
     for(let n=0;n<=7;n++){
       await page.evaluate(v=>localStorage.setItem('pg-hsk1-path-v371',String(v)),n);
       await page.reload({waitUntil:'load'});
       for(let i=1;i<=7;i++){
         const target=page.locator('.lesson[data-num="'+i+'"]');
         assert.equal(await target.getAttribute('aria-disabled'),String(i>n+1));
         assert.equal(await target.evaluate(a=>a.classList.contains('done')),i<=n);
       }
       assert.equal(await page.evaluate(()=>localStorage.getItem('pg-hsk1-v3-complete')),'["foundations"]','Historical progress got erased');
       if(n===1)await page.screenshot({path:'qa/hsk1-v373/android-393x852-lesson2-unlocked.png',fullPage:true});
     }
   }
   console.log('PASS viewport '+w+'x'+h+'; image, no scroll, 7 touch zones, six locks, 3 footer routes');
   await context.close();
 }
 assert.deepEqual(errors,[],'Browser JS errors');
 console.log('PASS sequential 0-7, preserve old progress, approved PNG sha256 and routes');
} finally {await browser.close();}
