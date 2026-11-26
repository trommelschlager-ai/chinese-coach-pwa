import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const flag of [false,true]){
  const context=await browser.newContext({viewport:{width:393,height:800},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await page.goto(base+'/panda-voice-pilot.html'+(flag?'?semantic=1':''),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true');
  if(flag)await page.waitForFunction(()=>document.documentElement.dataset.pandaSemanticPilot==='ready');
  else assert.equal(await page.locator('html').getAttribute('data-panda-semantic-pilot'),null);
  const send=async q=>{await page.evaluate(q=>window.PandaApprovedBridge337.send(q),q);await page.waitForFunction(q=>{const h=window.PandaApprovedBridge337.snapshot().history;return h.at(-2)?.hanzi===q&&h.at(-1)?.who==='panda'},q);return page.evaluate(()=>window.PandaApprovedBridge337.snapshot());};
  const short=await send('我想休息');assert(!short.history.at(-1).analysis?.semanticPilot,'short mode never intercepted');
  await page.locator('#pg346-nonstop').click();
  const first=await send('我一回家就吃饭');if(flag){assert.equal(first.history.at(-1).hanzi,'然后呢？');assert.equal(first.history.at(-1).analysis.semanticPilot,true);assert.equal(first.history.at(-2).ru,'Как только прихожу домой, сразу ем.');assert.equal(first.audioAvailable,true);}else assert(!first.history.at(-1).analysis?.semanticPilot);
  const stable=await send('你的身体怎么样');assert.equal(stable.history.at(-1).hanzi,'我身体很好。');assert(!stable.history.at(-1).analysis?.semanticPilot);
  const old=await send('我很好你呢');assert.equal(old.history.at(-1).hanzi,'我也很好，谢谢！');assert(!old.history.at(-1).analysis?.semanticPilot);
  if(flag){const now=await send('你现在做什么');assert.equal(now.history.at(-1).hanzi,'我在和你聊天。');assert.equal(now.history.at(-1).analysis.semanticPilot,true);const repeat=await send('什么意思');assert.equal(repeat.history.at(-1).hanzi,now.history.at(-1).hanzi);assert.equal(repeat.history.at(-1).analysis.kind,'explain-exact');}
  await context.close();
 }
 const graded=await browser.newPage();await graded.goto(base+'/panda-voice-pilot.html?topic=1&semantic=1');await graded.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true');assert.equal(await graded.locator('html').getAttribute('data-panda-semantic-pilot'),null);await graded.close();
 console.log('PASS semantic pilot explicit opt-in, default/short/graded unchanged, actual history and exact registered audio');
}finally{await browser.close();}
