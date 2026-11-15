import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { PNG } from 'pngjs';
import { chromium } from 'playwright';

const expected = PNG.sync.read(fs.readFileSync('assets/hsk1-approved-v373.png'));
const checksum = crypto.createHash('sha256').update(fs.readFileSync('assets/hsk1-approved-v373.png')).digest('hex');
assert.equal(checksum,'4d280e4bdd40994cbfc8e2f0ab32789dc6f856a2cdbb88f312f59eee05f03af0');
const html=fs.readFileSync('hsk1-map.html','utf8');
assert(html.includes('v375-corrected-css-and-safe-layering'));
assert(!html.includes('body::before{'),'Unsafe background overlay reintroduced');
assert.match(html,/box-shadow:0 0 10px #26063750;z-index:1}/,'Artboard CSS block must close and sit above background');
fs.mkdirSync('qa/hsk1-v375',{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
try {
  for(const [w,h] of [[320,568],[360,640],[393,852],[412,915],[694,1433],[694,1536]]) {
    const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/hsk1-map.html',{waitUntil:'load'});
    await page.evaluate(()=>localStorage.setItem('pg-hsk1-path-v371','4'));
    await page.reload({waitUntil:'load'});
    const d=await page.evaluate(()=>{
      const a=document.querySelector('.artboard'),r=a.getBoundingClientRect(),im=document.querySelector('.approved');
      return {
        rect:{x:r.x,y:r.y,width:r.width,height:r.height},
        doc:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],
        viewport:[innerWidth,innerHeight],
        img:[im.naturalWidth,im.naturalHeight],
        imgStyles:[getComputedStyle(im).objectFit,getComputedStyle(im).position],
        artZ:getComputedStyle(a).zIndex,
        pseudo:getComputedStyle(document.body,'::before').content,
        background:getComputedStyle(document.body).backgroundImage,
        gates:[...document.querySelectorAll('.lesson')].map(el=>({n:Number(el.dataset.num),aria:el.getAttribute('aria-disabled'),gate:getComputedStyle(el.querySelector('.gate')).display,mark:el.querySelector('.gate').textContent,
          hit:(()=>{const r=el.getBoundingClientRect(),v=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return v?.closest('a.lesson')?.dataset.num})()})),
        footers:[...document.querySelectorAll('.footer-link')].map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,href:el.getAttribute('href')}})
      }
    });
    assert.deepEqual(d.img,[694,1536]);
    assert.deepEqual(d.imgStyles,['fill','absolute']);
    assert.equal(d.artZ,'1','Artwork must have positive z-index above any background');
    assert.equal(d.pseudo,'none','Pseudo overlay must be absent');
    assert(d.background.includes('hsk1-approved-v373.png'));
    assert(d.doc[0]<=w+1&&d.doc[1]<=h+1,'Unexpected overflow '+w+'x'+h);
    assert(d.rect.x>=-1&&d.rect.y>=-1&&d.rect.x+d.rect.width<=w+1&&d.rect.y+d.rect.height<=h+1,'Artwork outside viewport');
    for(const g of d.gates){
      assert.equal(g.aria,String(g.n>5));
      assert.equal(g.hit,String(g.n),'Incorrect tap target for lesson '+g.n);
      assert.equal(g.gate,[2,3,4,5].includes(g.n)?'grid':'none');
      if(g.n===5)assert.equal(g.mark,'▶');
      if([2,3,4].includes(g.n))assert.equal(g.mark,'✓');
    }
    const expectedFooters=['./hsk1-rhythm.html','./hsk1-pronunciation.html','./panda-voice-pilot.html'];
    for(const [i,f] of d.footers.entries()){
      assert.equal(f.href,expectedFooters[i]);
      assert(f.left>=0&&f.right<=w+1&&f.top>=0&&f.bottom<=h+1,'Footer clipped');
    }
    assert.deepEqual(errors,[]);

    const shot=await page.screenshot({fullPage:true});
    const actual=PNG.sync.read(shot);
    // Screenshot-vs-source pixel comparison outside interactive badges catches
    // the exact mobile regression where a zoomed backdrop hides the main art.
    let sum=0,n=0;
    for(const rx of [0.04,0.09,0.14,0.19,0.24])for(const ry of [0.16,0.24,0.32,0.41,0.53,0.62,0.74,0.82]){
      const sx=Math.min(actual.width-1,Math.max(0,Math.round(d.rect.x+rx*d.rect.width)));
      const sy=Math.min(actual.height-1,Math.max(0,Math.round(d.rect.y+ry*d.rect.height)));
      const ex=Math.min(expected.width-1,Math.round(rx*expected.width));
      const ey=Math.min(expected.height-1,Math.round(ry*expected.height));
      const ai=(sy*actual.width+sx)*4,ei=(ey*expected.width+ex)*4;
      for(let c=0;c<3;c++){sum+=Math.abs(actual.data[ai+c]-expected.data[ei+c]);n++;}
    }
    const meanDiff=sum/n;
    assert(meanDiff<35, 'Approved art visually hidden or cropped: mean RGB error '+meanDiff.toFixed(2)+' viewport '+w+'x'+h);
    if((w===393&&h===852)||(w===694&&h===1433))
      fs.writeFileSync('qa/hsk1-v375/mobile-'+w+'x'+h+'-saved4.png',shot);
    results.push({viewport:w+'x'+h,meanDiff:Number(meanDiff.toFixed(2)),passed:true});
    console.log('PASS v375 mobile '+w+'x'+h+'; screenshot vs original RGB error '+meanDiff.toFixed(2));
    await context.close();
  }
  // Fresh progress: only lesson 1 navigable, and clicking lesson 2 is denied.
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:4173/hsk1-map.html');
  assert.equal(await page.locator('.lesson.locked').count(),6);
  await page.locator('.lesson[data-num="2"]').click();
  assert(await page.locator('.toast').isVisible());
  await page.evaluate(()=>localStorage.setItem('pg-hsk1-v3-complete','["foundations"]'));
  for(let done=0;done<=7;done++){
    await page.evaluate(n=>localStorage.setItem('pg-hsk1-path-v371',String(n)),done);
    await page.reload();
    for(let n=1;n<=7;n++)assert.equal(await page.locator('.lesson[data-num="'+n+'"]').getAttribute('aria-disabled'),String(n>done+1));
    assert.equal(await page.evaluate(()=>localStorage.getItem('pg-hsk1-v3-complete')),'["foundations"]');
  }
  await context.close();
  fs.writeFileSync('qa/hsk1-v375/report.json',JSON.stringify({checksum,results,sequential:true,preservedHistory:true},null,2));
  console.log('PASS v375 all screen and progress checks');
}finally{await browser.close()}
