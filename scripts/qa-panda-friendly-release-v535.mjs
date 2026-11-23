import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
fs.mkdirSync('qa/panda-friendly-release',{recursive:true});
try{
 for(const width of [360,393,412]){
  const ctx=await browser.newContext({viewport:{width,height:800},isMobile:true,hasTouch:true});
  const page=await ctx.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/panda-voice-pilot.html',{waitUntil:'domcontentloaded'});
  await page.locator('#pg346').waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true',{timeout:15000});
  assert.equal(await page.locator('#pg346-short').getAttribute('aria-pressed'),'true');
  for(const [input,expected] of [
   ['我爱你！','谢谢你！我很开心！你叫什么名字？'],
   ['我叫小明。','很高兴认识你！你今天怎么样？'],
   ['我很好。','太好了！你想聊什么？']
  ]){
   await page.locator('#pg346-send').click();
   await page.locator('#pg346-input').fill(input);
   await page.locator('#pg346-send').click();
   await page.waitForFunction(t=>document.querySelector('#pg346-rows .pg346-row:last-child .pg346-zh')?.textContent===t,expected,{timeout:8000});
  }
  const stats=await page.evaluate(()=>{
   const history=document.querySelector('#pg346-rows');
   const last=history.lastElementChild;
   const hr=history.getBoundingClientRect(),lr=last.getBoundingClientRect();
   const scene=document.querySelector('#pg346 .pg346-scene');
   const sr=scene?.getBoundingClientRect();
   return {rows:history.children.length,historyTop:hr.top,historyBottom:hr.bottom,lastTop:lr.top,lastBottom:lr.bottom,sceneTop:sr?.top,scrollable:history.scrollHeight>=history.clientHeight,overflow:getComputedStyle(history).overflowY};
  });
  assert.equal(stats.rows,3,'Three most recent chat cards must remain in history');
  assert(stats.lastTop>=stats.historyTop-2 && stats.lastBottom<=stats.historyBottom+3,'Last reply is clipped by history window: '+JSON.stringify(stats));
  assert(stats.sceneTop===undefined || stats.sceneTop>=stats.historyBottom-3,'History overlaps approved Panda character scene: '+JSON.stringify(stats));
  assert(!errors.length,'Browser JS errors: '+errors.join('; '));
  await page.screenshot({path:'qa/panda-friendly-release/friendly-'+width+'.png',fullPage:false,animations:'disabled'});
  console.log('PASS Panda friendly chat '+width+'px '+JSON.stringify(stats));
  await ctx.close();
 }
}finally{await browser.close()}
