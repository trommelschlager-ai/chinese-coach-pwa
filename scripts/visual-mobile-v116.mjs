// v115: exercise the actual browser UI and store visual regression evidence.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const BASE=process.env.QA_BASE||'http://127.0.0.1:4173';
const OUT='qa/v116';
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
 assert(data.panelHeight>(mode==='build'?40:120) && data.panelHeight<540,mode+' panel huge/vanished');
 assert(data.buttonBottom<=h-4,mode+' Check button must fit inside one phone screen '+JSON.stringify(data));
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
  await page.goto(BASE+'/game.html?v=116',{waitUntil:'domcontentloaded'});
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
    const h2=await rect(page,'.v115-scene h2'),scene=await rect(page,'.v115-scene');
    assert(h2.top>=scene.top-2&&h2.bottom<=scene.bottom+2,'Chinese prompt must not be clipped: '+JSON.stringify({h2,scene}));
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
    assert.equal(await page.locator('.v116-answer-panel').count(),1,'Upper answer block must exist');
    assert.equal(await page.locator('.v116-word-panel').count(),1,'Lower word bank must exist');
    assert.equal(await page.locator('.audit-token small:visible').count(),0);
    const numberOfParts=await page.evaluate(()=>window.__gamePracticeV76.items[0].parts.length);
    assert.equal(await page.locator('.v116-empty-slot').count(),numberOfParts,'Upper block should start with empty slots');
    await btn.click();assert((await page.locator('.audit-token small:visible').count())>0);
    await btn.click();assert.equal(await page.locator('.audit-token small:visible').count(),0);
    const original=await page.locator('.v115-scene').evaluate(el=>getComputedStyle(el).backgroundImage);
    await page.locator('[data-game-token]').first().click();
    assert.equal(await page.locator('[data-game-remove]').count(),1);
    assert.equal(await page.locator('.v116-empty-slot').count(),numberOfParts-1,'Choosing a word fills an empty upper slot');
    assert.equal(await page.locator('.v116-word-panel [data-game-token]').count(),4,'Used word removed from lower bank');
    assert.equal(await page.locator('.v115-scene').evaluate(el=>getComputedStyle(el).backgroundImage),original);
    await page.locator('[data-game-remove]').first().click();
    assert.equal(await page.locator('[data-game-remove]').count(),0);
    assert.equal(await page.locator('.v116-empty-slot').count(),numberOfParts,'Returning word restores empty slot');
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
   }else if(mode==='build'){
    // Reach the approved long tea sentence and verify all 8 tiles and 6-token answer.
    for(let step=0;step<4;step++){
     const current=await page.evaluate(i=>window.__gamePracticeV76.items[i],step);
     for(const [han] of current.parts){
      await page.evaluate(h=>{
       const tile=[...document.querySelectorAll('[data-game-token]')].find(el=>el.querySelector('strong')?.textContent===h);
       if(!tile)throw Error('No tile: '+h);tile.click();
      },han);
     }
     await page.locator('[data-game-check]').click();
     assert.match(await page.locator('.audit-feedback').textContent(),/Верно/);
     await page.locator('[data-game-check]').click();
    }
    assert.match(await page.locator('.v115-scene-text').textContent(),/чашку чая/);
    assert.equal(await page.locator('[data-game-token]').count(),8);
    assert.equal(await page.locator('.v116-empty-slot').count(),6,'Six slots for the tea sentence');
    await checkLayout(page,[width,height],mode);
    await page.screenshot({path:OUT+'/build-tea-'+size+'.png',fullPage:true});
    const sceneBefore=await page.locator('.v115-scene').evaluate(e=>getComputedStyle(e).backgroundImage);
    for(const part of (await page.evaluate(()=>window.__gamePracticeV76.items[4].parts)).slice(0,5)){
      await page.evaluate(h=>{
       const tile=[...document.querySelectorAll('[data-game-token]')].find(el=>el.querySelector('strong')?.textContent===h);
       if(!tile)throw Error('Missing tea token '+h);tile.click();
      },part[0]);
    }
    assert.equal(await page.locator('[data-game-remove]').count(),5);
    assert.equal(await page.locator('.v116-empty-slot').count(),1,'Five selected tea tokens must leave one dashed slot');
    assert.equal(await page.locator('.v116-word-panel [data-game-token]').count(),3,'Only three unused tea options remain');
    assert.equal(await page.locator('.v115-scene').evaluate(e=>getComputedStyle(e).backgroundImage),sceneBefore);
    await page.screenshot({path:OUT+'/build-tea-selected-'+size+'.png',fullPage:true});
    await page.locator('.v116-word-panel [data-game-token]').filter({hasText:'茶'}).click();
    assert.equal(await page.locator('.v116-empty-slot').count(),0);
    assert.equal(await page.locator('.v116-word-panel [data-game-token]').count(),2);
    await page.locator('[data-game-check]').click();
    assert.match(await page.locator('.audit-feedback').textContent(),/Верно/);
    assert.equal(await page.locator('.v115-footer .audit-correction').count(),0,'No duplicate full correction panel after a correct answer');
    await checkLayout(page,[width,height],mode);
    await page.screenshot({path:OUT+'/build-tea-correct-'+size+'.png',fullPage:true});
   }
  }
  assert.deepEqual(errors,[],'Browser errors '+size+': '+errors.join(';'));
  await context.close();
 }
 fs.writeFileSync(OUT+'/results.json',JSON.stringify({version:116,at:new Date().toISOString(),results},null,2)+'\n');
 console.log('PASS v116 responsive two-panel build, choose, listen: '+JSON.stringify(results));
}finally{await browser.close()}
