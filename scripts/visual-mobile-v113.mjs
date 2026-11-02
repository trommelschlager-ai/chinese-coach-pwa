// Browser-level, screenshot-producing QA on the *actual* frontend, not static mockups.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const BASE=process.env.QA_BASE||'http://127.0.0.1:4173';
const OUT='qa/v113';
const sizes=[[360,800],[393,852],[412,915]];
fs.mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const findings=[];
function record(size,mode,measurement){findings.push({size,mode,...measurement})}
async function inspect(page,mode,size){
 const data=await page.evaluate(()=>{
  const b=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {top:Math.round(r.top),bottom:Math.round(r.bottom),left:Math.round(r.left),right:Math.round(r.right),height:Math.round(r.height)}};
  return {innerWidth,innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,
   stage:b('.restore-stage, .ch110-build-screen'),choices:b('.audit-choices'),question:b('.audit-prompt, .ch110-prompt'),
   bank:b('.audit-bank'),check:b('[data-game-check]')};
 });
 assert(data.scrollWidth<=data.innerWidth+3,mode+' horizontal overflow at '+size+': '+JSON.stringify(data));
 assert(data.check?.right<=data.innerWidth+3&&data.check?.left>=-3,mode+' Check button horizontal clipping');
 assert(data.scrollHeight<=(data.innerHeight*1.45),mode+' unreasonable vertical scrolling '+JSON.stringify(data));
 if(mode==='choose'){
   assert(data.choices&&data.choices.height<320,'Translation answers are too tall: '+JSON.stringify(data));
 }else if(mode==='build'){
   assert(data.bank&&data.bank.height<310,'Builder has excessively stretched word bank: '+JSON.stringify(data));
 }
 record(size,mode,data);
}
try{
 for(const [width,height] of sizes){
  const size=width+'x'+height;
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto(BASE+'/game.html?v=113',{waitUntil:'domcontentloaded'});
  await page.locator('[data-game-mode="choose"]').waitFor({timeout:12000});
  await page.locator('[data-game-mode="choose"]').click();
  await page.locator('.restore-task-title').waitFor();
  assert.equal(await page.locator('[data-game-option]').count(),3);
  const question=await page.locator('.audit-prompt h2').textContent();
  const correct=(await page.evaluate(zh=>window.__gamePracticeV76.items.find(x=>x.zh===zh)?.ru,question));
  assert(correct,'Quiz question maps to unchanged HSK vocabulary');
  await page.evaluate(correct=>{
   const wrong=[...document.querySelectorAll('[data-game-option]')].find(x=>!x.textContent.includes(correct));
   if(!wrong)throw Error('Expected a wrong-answer choice');wrong.click();
  },correct);
  await page.locator('[data-game-check]').click();
  assert.equal(await page.locator('.is-correct').count(),1,'One clearly highlighted correct answer');
  assert.equal(await page.locator('.is-wrong').count(),1,'Incorrect choice highlighted');
  assert.equal(await page.locator('.audit-correction').count(),0,'No duplicate giant correction block');
  assert.match(await page.locator('.audit-feedback').textContent(),/Правильный перевод выделен/);
  await inspect(page,'choose',size);
  await page.screenshot({path:OUT+'/choose-'+size+'.png',fullPage:true});
  // Go back, select build, reach the 6-token tea sentence, then select 5 of 6 tokens.
  await page.locator('[data-game-back]').click();
  await page.locator('[data-game-mode="build"]').click();
  for(let index=0;index<4;index++){
   const current=await page.evaluate(()=>window.__gamePracticeV76.items[Number(document.querySelector('.ch110-game-status span').textContent.match(/\d+/)[0])-1]);
   assert(current,'Known phrase at '+index);
   for(const [han] of current.parts){
    await page.evaluate(h=>{
     const tile=[...document.querySelectorAll('[data-game-token]')].find(x=>x.querySelector('strong')?.textContent===h);
     if(!tile)throw Error('Missing phrase tile '+h);tile.click();
    },han);
   }
   await page.locator('[data-game-check]').click();
   assert.match(await page.locator('.audit-feedback').textContent(),/Верно/);
   await page.locator('[data-game-check]').click();
  }
  const tea=await page.evaluate(()=>window.__gamePracticeV76.items[4]);
  assert.equal(tea.id,'tea');
  const bgBefore=await page.locator('.ch110-build-screen').evaluate(e=>getComputedStyle(e,'::before').backgroundImage);
  for(const [han] of tea.parts.slice(0,5)){
   await page.evaluate(h=>{
    const tile=[...document.querySelectorAll('[data-game-token]')].find(x=>x.querySelector('strong')?.textContent===h);
    if(!tile)throw Error('Missing tea tile '+h);tile.click();
   },han);
  }
  assert.equal(await page.locator('[data-game-remove]').count(),5,'Five selected tiles are removable');
  const bgAfter=await page.locator('.ch110-build-screen').evaluate(e=>getComputedStyle(e,'::before').backgroundImage);
  assert.equal(bgAfter,bgBefore,'Background stable while selecting tiles');
  await inspect(page,'build',size);
  await page.screenshot({path:OUT+'/build-'+size+'.png',fullPage:true});
  // Independent approved dialogue page, with exact female and male MP3s.
  await page.goto(BASE+'/index.html?v=113',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.openLearningTopics==='function');
  await page.locator('#launch-start').click();
  await page.locator('#launch-all').click();
  await page.evaluate(()=>window.openLearningTopics('dialogues'));
  await page.locator('[data-dialog-lesson="2"]').click();
  assert.equal(await page.locator('.ch110-line').count(),2);
  await page.screenshot({path:OUT+'/dialogue-'+size+'.png',fullPage:true});
  assert.equal(await page.locator('.ch110-person-name').first().textContent(),'Она · 1');
  assert.equal(await page.locator('.ch110-person-name').nth(1).textContent(),'Он · 2');
  const mp3Info=await page.evaluate(async()=>{
    const urls=['./assets/dialogue-greetings-v113/l2-01-a.mp3','./assets/dialogue-greetings-v113/l2-02-b.mp3'];
    return Promise.all(urls.map(async url=>{
      const r=await fetch(url,{cache:'no-store'});return {url,status:r.status,bytes:(await r.arrayBuffer()).byteLength}
    }));
  });
  assert(mp3Info.every(x=>x.status===200&&x.bytes>2000),'Both exact Mandarin MP3s must load');
  await page.locator('[data-dialogue-line="0"]').click();
  await page.waitForTimeout(300);
  await page.locator('[data-dialogue-line="1"]').click();
  await page.waitForTimeout(300);
  record(size,'dialogue',{mp3Info,first:'female 你好',second:'male 哈喽',pageErrors});
  assert(!pageErrors.length,'Browser JS errors: '+pageErrors.join(' | '));
  await context.close();
 }
 const report={version:113,testedAt:new Date().toISOString(),sizes,findings,method:'Playwright Chromium rendering actual index.html and game.html on localhost; full-page PNGs'};
 fs.writeFileSync(OUT+'/results.json',JSON.stringify(report,null,2)+'\n');
 console.log('MOBILE_QA_PASS: '+JSON.stringify(findings));
}finally{await browser.close()}
