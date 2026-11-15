import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import fs from 'node:fs';
import crypto from 'node:crypto';

const html=fs.readFileSync('hsk1-map.html','utf8');
assert(html.includes('v377-soft-button-shadows'));
assert(!html.includes('body::before{'));
assert(!html.includes('background:#5f367d url('));
const approvedSha=crypto.createHash('sha256').update(fs.readFileSync('assets/hsk1-approved-v373.png')).digest('hex');
assert.equal(approvedSha,'4d280e4bdd40994cbfc8e2f0ab32789dc6f856a2cdbb88f312f59eee05f03af0');
fs.mkdirSync('qa/hsk1-v377',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const [w,h] of [[320,568],[360,800],[393,852],[412,915],[694,1433]]){
  const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:true,hasTouch:true});
  const page=await ctx.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/hsk1-map.html',{waitUntil:'load'});
  const data=await page.evaluate(()=>{
    const image=document.querySelector('img.approved'), art=document.querySelector('.artboard');
    const target=a=>{const r=a.getBoundingClientRect();return document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.closest('a')===a};
    const shadow=a=>getComputedStyle(a).boxShadow;
    return {
      dimensions:[document.documentElement.scrollWidth,document.documentElement.scrollHeight,innerWidth,innerHeight],
      image:[image.naturalWidth,image.naturalHeight],
      background:getComputedStyle(document.body).backgroundImage,
      links:[...document.querySelectorAll('.hotspots a')].map(a=>({hit:target(a),shadow:shadow(a)})),
      locked:[...document.querySelectorAll('.lesson')].filter(x=>x.classList.contains('locked')).length,
      footer:[...document.querySelectorAll('.footer-link')].map(a=>a.getAttribute('href')),
      gateShadow:shadow(document.querySelector('.lesson .gate')),
    };
  });
  assert.deepEqual(data.image,[694,1536]);
  assert(data.background.includes('linear-gradient')&&!data.background.includes('url('));
  assert(data.dimensions[0]<=w+1&&data.dimensions[1]<=h+1,'Overflow: '+w+'x'+h);
  assert.equal(data.links.length,12);assert.equal(data.locked,6);
  for(const t of data.links){assert(t.hit,'Broken tap target');assert(t.shadow.includes('rgba')&&!t.shadow.includes('none'),'Missing soft shadow')}
  assert(data.gateShadow.includes('rgba'));
  assert.deepEqual(data.footer,['./hsk1-rhythm.html','./hsk1-pronunciation.html','./panda-voice-pilot.html']);
  if(w===393){
    await page.screenshot({path:'qa/hsk1-v377/android-393x852.png'});
    const link=page.locator('.lesson[data-num="1"]');
    await link.dispatchEvent('pointerdown',{pointerType:'touch',isPrimary:true});
    assert(await link.evaluate(a=>a.classList.contains('is-pressed')));
    await page.waitForTimeout(145);
    assert(Number(await link.evaluate(a=>getComputedStyle(a,'::after').opacity))>0.9);
    await link.dispatchEvent('pointerup',{pointerType:'touch',isPrimary:true});
    await page.locator('.lesson[data-num="2"]').click({force:true});
    assert(await page.locator('.toast').isVisible());
    await page.evaluate(()=>{localStorage.setItem('pg-hsk1-path-v371','4');localStorage.setItem('pg-hsk1-v3-complete','["foundations"]')});
    await page.reload();
    for(let n=1;n<=7;n++)assert.equal(await page.locator('.lesson[data-num="'+n+'"]').getAttribute('aria-disabled'),String(n>5));
    assert.equal(await page.evaluate(()=>localStorage.getItem('pg-hsk1-v3-complete')),'["foundations"]');
    await page.screenshot({path:'qa/hsk1-v377/android-393x852-progress4.png'});
  }
  assert.deepEqual(errors,[]);
  console.log('PASS v377 '+w+'x'+h+' image, shadows, 12 targets, no scroll, progress');
  await ctx.close();
 }
}finally{await browser.close()}