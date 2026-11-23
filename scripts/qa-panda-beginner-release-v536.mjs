import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
fs.mkdirSync('qa/panda-beginner-release',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [360,393,412]){
  const context=await browser.newContext({viewport:{width,height:800},isMobile:true,hasTouch:true});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/panda-voice-pilot.html',{waitUntil:'domcontentloaded'});
  await page.locator('#pg346').waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true',{timeout:15000});
  const send=async(input,answer)=>{
   await page.locator('#pg346-send').click();
   await page.locator('#pg346-input').fill(input);
   await page.locator('#pg346-send').click();
   await page.waitForFunction(expected=>document.querySelector('#pg346-rows .pg346-row:last-child .pg346-zh')?.textContent===expected,answer,{timeout:7000});
   assert.equal(await page.locator('#pg346-rows .pg346-row:last-child .pg346-zh').textContent(),answer);
  };
  await send('我爱你！','谢谢你！我很开心！你叫什么名字？');
  await send('我叫小明。','很高兴认识你！你今天怎么样？');
  await send('我很好。','太好了！你想聊什么？');
  await send('非常好！','太好了！');
  await send('休息','你今天休息吗？');
  await send('很不错，你呢？','我也很好，谢谢！');
  await send('你可以说中文','可以！我们说中文吧！');
  await send('跑步这么样','我喜欢跑步。');
  const rects=await page.evaluate(()=>{
   const history=document.querySelector('#pg346-rows'),last=history.lastElementChild,scene=document.querySelector('#pg346 .pg346-scene');
   const a=history.getBoundingClientRect(),b=last.getBoundingClientRect(),c=scene?.getBoundingClientRect();
   return {rows:history.children.length,historyBottom:a.bottom,lastTop:b.top,lastBottom:b.bottom,sceneTop:c?.top,historyTop:a.top};
  });
  assert.equal(rects.rows,3,'Three most recent chat cards remain visible');
  assert(rects.lastTop>=rects.historyTop-2 && rects.lastBottom<=rects.historyBottom+3,'Last reply clipped: '+JSON.stringify(rects));
  assert(rects.sceneTop==null || rects.sceneTop>=rects.historyBottom-3,'Panda obscures chat: '+JSON.stringify(rects));
  // Android's real keyboard cannot open in Playwright's headless mobile mode.
  // Emulate the same root flag set by visualViewport/resize and assert that
  // the panda stage keeps room while history hides, then comes back cleanly.
  const keyboard=await page.evaluate(()=>{
   const root=document.documentElement,history=document.querySelector('#pg346-rows');
   const scene=document.querySelector('#pg346 .pg346-scene');
   root.dataset.keyboard='true';
   const opened={historyDisplay:getComputedStyle(history).display,sceneHeight:scene.getBoundingClientRect().height};
   root.dataset.keyboard='false';
   return {...opened,historyRestored:getComputedStyle(history).display};
  });
  assert.equal(keyboard.historyDisplay,'none','Keyboard must not let chat push Panda into a tiny corner');
  assert(keyboard.sceneHeight>=119,'Keyboard shrinks Panda scene: '+JSON.stringify(keyboard));
  assert.notEqual(keyboard.historyRestored,'none','Chat must reappear when keyboard closes');
  await page.locator('#pg346-nonstop').click();
  await send('不好','怎么了？');
  assert(!errors.length,'JS error: '+errors.join('; '));
  await page.screenshot({path:'qa/panda-beginner-release/beginner-'+width+'.png',fullPage:false,animations:'disabled'});
  console.log('PASS Panda beginner short/nonstop '+width+'px');
  await context.close();
 }
}finally{await browser.close()}
