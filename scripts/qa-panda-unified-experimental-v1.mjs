import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
try{
 for(const flag of [false,true]){
  const context=await browser.newContext({viewport:{width:393,height:800},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await page.addInitScript(()=>{window.__pilotPlaying=[];const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.addEventListener('playing',()=>window.__pilotPlaying.push(this.currentSrc||this.src),{once:true});return play.apply(this,args);};});
  await page.addInitScript(()=>{class MockSpeech {start(){window.__testSpeech=this;this.onstart?.();this.onaudiostart?.();}abort(){} stop(){} }window.SpeechRecognition=MockSpeech;window.webkitSpeechRecognition=MockSpeech;});
  await page.goto(base+'/panda-voice-pilot.html'+(flag?'?semantic=1':''),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true');
  if(flag)await page.waitForFunction(()=>document.documentElement.dataset.pandaSemanticPilot==='ready');
  else assert.equal(await page.locator('html').getAttribute('data-panda-semantic-pilot'),null);
  const send=async q=>{await page.evaluate(q=>window.PandaApprovedBridge337.send(q),q);await page.waitForFunction(q=>{const h=window.PandaApprovedBridge337.snapshot().history;return h.at(-2)?.hanzi===q&&h.at(-1)?.who==='panda'},q);return page.evaluate(()=>window.PandaApprovedBridge337.snapshot());};
  const short=await send('我想休息');assert(!short.history.at(-1).analysis?.semanticPilot,'short mode never intercepted');
  await page.locator('#pg346-nonstop').click();
  await page.evaluate(()=>{window.__pilotPlaying=[];});
  const first=await send('我一回家就吃饭');if(flag){assert.equal(first.history.at(-1).hanzi,'然后呢？');assert.equal(first.history.at(-1).analysis.semanticPilot,true);assert.equal(first.history.at(-2).ru,'Как только прихожу домой, сразу ем.');assert.equal(first.audioAvailable,true);await page.waitForFunction(()=>window.__pilotPlaying.some(src=>src.includes('/panda-ai-voice-batch01-v563/PA-V563-01.mp3')),null,{timeout:10000});}else assert(!first.history.at(-1).analysis?.semanticPilot);
  for(const [q,expected] of [['吃饭','你想吃什么？'],['睡觉','你晚上几点睡觉？'],['非常好，你呢？','我也很好，谢谢！']]){const x=await send(q);assert.equal(x.history.at(-1).hanzi,expected,q);assert(x.history.at(-2).pinyin&&x.history.at(-2).ru,q);assert.equal(x.audioAvailable,true,q);}
  const travel=await send('去中国');assert.equal(travel.history.at(-1).hanzi,'你打算什么时候去？');assert.equal(travel.audioAvailable,true);assert(travel.history.at(-2).pinyin&&travel.history.at(-2).ru);const time=await send('明天');assert.equal(time.history.at(-1).hanzi,'然后呢？');
  const positive=await send('很不错');assert(!/你能说得简单一点吗/.test(positive.history.at(-1).hanzi));
  const stable=await send('你的身体怎么样');assert.equal(stable.history.at(-1).hanzi,'我身体很好。');assert(!stable.history.at(-1).analysis?.semanticPilot);
  const old=await send('我很好你呢');assert.equal(old.history.at(-1).hanzi,'我也很好，谢谢！');assert(!old.history.at(-1).analysis?.semanticPilot);
  if(flag){const decoded=await page.evaluate(async()=>{const ctx=new AudioContext();try{const paths=['./assets/panda-ai-voice-batch01-v563/PA-V563-01.mp3','./assets/panda-ai-voice-batch01-v563/PA-V563-06.mp3','./assets/panda-ai-voice-v557/PA-V556-059.mp3'];return await Promise.all(paths.map(async path=>{const response=await fetch(path);if(!response.ok)throw Error(path+' HTTP '+response.status);const buffer=await ctx.decodeAudioData(await response.arrayBuffer());return {path,duration:buffer.duration,samples:buffer.length};}));}finally{await ctx.close();}});assert.equal(decoded.length,3);for(const clip of decoded)assert(clip.duration>0&&clip.samples>0,clip.path);console.log('PASS three exact MP3 files decoded',JSON.stringify(decoded));const now=await send('你现在做什么');assert.equal(now.history.at(-1).hanzi,'我在和你聊天。');assert.equal(now.history.at(-1).analysis.semanticPilot,true);const repeat=await send('什么意思');assert.equal(repeat.history.at(-1).hanzi,now.history.at(-1).hanzi);assert.equal(repeat.history.at(-1).analysis.kind,'explain-exact');}
  // Replay the actual microphone path with a correct transcript and Android-like confidence.
  const speak=async(q,confidence)=>{await page.evaluate(()=>{window.__testSpeech=null;window.PandaApprovedBridge337.mic();});const consent=page.locator('#speech-allow');if(await consent.isVisible())await consent.click();await page.waitForFunction(()=>!!window.__testSpeech?.onresult);await page.evaluate(({q,confidence})=>{window.__testSpeech.onresult({resultIndex:0,results:[[{transcript:q,confidence}]]});},{q,confidence});return page.evaluate(()=>window.PandaApprovedBridge337.snapshot());};
  for(const [q,want] of [['我想学中文','你为什么想学中文？'],['我一回家就吃饭','然后呢？'],['你现在做什么','我在和你聊天。']]){
   for(const confidence of [.72,.93]){
    const x=await speak(q,confidence);assert.equal(x.history.at(-2).hanzi,q);assert.equal(x.history.at(-1).hanzi,want);assert(x.history.at(-2).pinyin&&x.history.at(-2).ru,q);assert.equal(x.speechSignal.toneVerified,false);if(flag)assert.equal(x.history.at(-1).analysis?.semanticPilot,true,q);
   }
  }
  const explanation=await speak('什么意思',.72);assert.equal(explanation.history.at(-1).analysis?.kind,'explain-exact');assert(explanation.history.at(-1).analysis.explanation.includes('聊天 — разговаривать'));await page.waitForFunction(()=>document.querySelector('#pg346-rows')?.textContent.includes('Значение:'));
  if(flag){
   const corrected=await send('我想中文学');
   assert.equal(corrected.history.at(-1).hanzi,'你为什么想学中文？');
   assert.equal(corrected.history.at(-2).analysis.correction.hanzi,'我想学中文。');
   assert.equal(corrected.history.at(-2).analysis.correction.inlineConversation,true);
   assert.equal(corrected.history.at(-1).analysis.toneVerified,false);
   await page.waitForFunction(()=>document.querySelector('#pg346-feedback')?.textContent.includes('我想学中文'));
   for(const [q,want] of [['因为我想去中国','你打算什么时候去？'],['什么意思','你打算什么时候去？'],['明天','你打算怎么去？'],['坐飞机','祝你旅途愉快！'],['聊聊我的一天吧','你早上吃早饭吗？'],['我吃早饭早上','你晚上几点睡觉？'],['聊聊工作吧','你今天忙吗？'],['聊聊我的一天吧','你晚上几点睡觉？'],['我睡觉晚上十点','你接下来想做什么？']]){
    const x=await send(q);assert.equal(x.history.at(-1).hanzi,want,q);assert.equal(x.history.at(-1).analysis.semanticPilot,true,q);
   }
   const spokenCorrection=await speak('我想中文学',.93);
   assert.equal(spokenCorrection.history.at(-1).hanzi,'你为什么想学中文？');
   assert.equal(spokenCorrection.history.at(-2).analysis.correction.inlineConversation,true);
   assert.equal(spokenCorrection.speechSignal.kind,'text-only');
   assert.equal(spokenCorrection.speechSignal.toneVerified,false);
   console.log('PASS reviewed inline correction, real browser history, resumed questions and topic memory');
  }
  const before=await page.evaluate(()=>JSON.stringify(window.PandaApprovedBridge337.snapshot().history));
  const unsure=await speak('我想学中文',.4);assert.equal(JSON.stringify(unsure.history),before);assert.equal(unsure.speechSignal.kind,'uncertain');
  console.log('PASS simulated ASR .72/.93, meaning explanation, low confidence confirmation',flag);
  await context.close();
 }
 const graded=await browser.newPage();await graded.goto(base+'/panda-voice-pilot.html?topic=1&semantic=1');await graded.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true');assert.equal(await graded.locator('html').getAttribute('data-panda-semantic-pilot'),null);await graded.close();
 console.log('PASS semantic pilot explicit opt-in, default/short/graded unchanged, actual history and exact registered audio');
}finally{await browser.close();}
