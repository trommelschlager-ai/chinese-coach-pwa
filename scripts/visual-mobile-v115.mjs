// v115: exercise the actual browser UI and store visual regression evidence.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const BASE=process.env.QA_BASE||'http://127.0.0.1:4173';
const OUT='qa/v115';
const SIZES=[[360,800],[393,852],[412,915]];
fs.mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const results=[];
const rect=async(page,selector)=>page.locator(selector).first().evaluate(e=>{
 const x=e.getBoundingClientRect();
 return {top:Math.round(x.top),bottom:Math.round(x.bottom),left:Math.round(x.left),right:Math.round(x.right),height:Math.round(x.height)};
});
async function navigateMode(page,mode){
 if(!(await page.locator('[data-game-mode="'+mode+'"]').count())){
  const back=page.locator('[data-game-back]');await back.first().click();
 }
 await page.locator('[data-game-mode="'+mode+'"]').click();
 await page.locator('.v115-game[data-mode="'+mode+'"]').waitFor();
}
async function checkLayout(page,size,mode){
 const [w,h]=size;
 const data=await page.evaluate(()=>{
  const btn=document.querySelector('[data-game-check]');
  const r=btn.getBoundingClientRect();
  const p=document.querySelector('.v115-panel').getBoundingClientRect();
  return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,
    scrollHeight:document.documentElement.scrollHeight,buttonBottom:r.bottom,buttonLeft:r.left,buttonRight:r.right,panelHeight:p.height};
 });
 assert(data.scrollWidth<=w+2,mode+' horizontal overflow at '+size+': '+JSON.stringify(data));
 assert(data.buttonLeft>=-2 && data.buttonRight<=w+2,mode+' horizontal button crop');
 assert(data.panelHeight>120 && data.panelHeight<540,mode+' panel huge/vanished');
 assert(data.buttonBottom<=h+90,mode+' check button too far below viewport '+JSON.stringify(data));
 assert.equal(await page.locator('.v115-task').count(),1);
 assert.equal(await page.locator('.v115-pinyin').count(),1);
 assert.equal(await page.locator('.v115-header').getByText(/Комбо/).count(),0);
 assert.equal(await page.locator('.v115-game').getByText('Прослушай и выбери').count(),0);
 assert.equal(await page.locator('.v115-game').getByText('Какая фраза прозвучала?').count(),0);
 assert.equal(await page.locator('.v115-game .v115-scene').count(),1);
 assert.equal(await page.locator('.v115-scene').evaluate(el=>getComputedStyle(el).backgroundImage.includes('approved-quiz-scene')),true,'The pastel artwork must be used');
 assert.equal(await page.locator('.v115-footer .audit-primary').evaluate(el=>getComputedStyle(el).minHeight.endsWith('px')),true);
 results.push({size:w+'x'+h,mode,...data});
}
try{
 for(const [width,height] of SIZES){
  const size=width+'x'+height;
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE+'/game.html?v=115',{waitUntil:'domcontentloaded'});
  await page.locator('[data-game-mode="choose"]').waitFor();
  for(const mode of ['choose','listen','build']){
   await navigateMode(page,mode);
   const btn=page.locator('[data-game-toggle-pinyin]');
   assert.equal(await btn.getAttribute('aria-pressed'),'false','Pinyin must be hidden until requested');
   if(mode==='choose'){
    assert.equal(await page.locator('.v115-scene .audit-pinyin').count(),0);
    await btn.click();assert.equal(await page.locator('.v115-scene .audit-pinyin').count(),1);
    await btn.click();assert.equal(await page.locator('.v115-scene .audit-pinyin').count(),0);
    const q=await page.locator('.v115-scene h2').textContent();
    assert(q.includes('我'),'Quiz hanzi visible');
    assert.equal(await page.locator('[data-game-option]').count(),3);
   }else if(mode==='listen'){
    assert.equal(await page.locator('.v115-game .audit-pinyin').count(),0);
    await btn.click();assert.equal(await page.locator('.audit-choice .audit-pinyin').count(),3);
    await btn.click();assert.equal(await page.locator('.audit-choice .audit-pinyin').count(),0);
    await page.locator('[data-game-play]').click();
    await page.waitForTimeout(100);
    const line=await page.locator('[data-game-audio-feedback]').textContent();
    const answer=await page.evaluate(()=>window.__gamePracticeV76.items[0].zh);
    assert(!line.includes(answer),'Listening hint reveals correct answer!');
    assert.equal(await page.locator('[data-game-option]').count(),3);
   }else{
    assert.equal(await page.locator('.audit-token small:visible').count(),0);
    await btn.click();assert((await page.locator('.audit-token small:visible').count())>0);
    await btn.click();assert.equal(await page.locator('.audit-token small:visible').count(),0);
    const original=await page.locator('.v115-scene').evaluate(el=>getComputedStyle(el).backgroundImage);
    await page.locator('[data-game-token]').first().click();
    assert.equal(await page.locator('[data-game-remove]').count(),1);
    assert.equal(await page.locator('.v115-scene').evaluate(el=>getComputedStyle(el).backgroundImage),original);
    await page.locator('[data-game-remove]').first().click();
    assert.equal(await page.locator('[data-game-remove]').count(),0);
   }
   const imgs=page.locator('.v115-panda');if(await imgs.count())await imgs.first().evaluate(el=>el.decode());
   await checkLayout(page,[width,height],mode);
   await page.screenshot({path:OUT+'/'+mode+'-'+size+'.png',fullPage:true});
   if(mode==='choose'){
    const correct=await page.locator('.v115-scene h2').textContent();
    const translation=await page.evaluate(zh=>window.__gamePracticeV76.items.find(x=>x.zh===zh)?.ru,correct);
    const response=page.locator('[data-game-option]').filter({hasText:translation});
    await response.first().click();
    await page.locator('[data-game-check]').click();
    assert.equal(await page.locator('.is-correct').count(),1);
    assert.match(await page.locator('.audit-feedback').textContent(),/Верно/);
   }
  }
  assert.deepEqual(errors,[],'Browser errors '+size+': '+errors.join(';'));
  await context.close();
 }
 fs.writeFileSync(OUT+'/results.json',JSON.stringify({version:115,at:new Date().toISOString(),results},null,2)+'\n');
 console.log('PASS v115 responsive choose, listen, build: '+JSON.stringify(results));
}finally{await browser.close()}
