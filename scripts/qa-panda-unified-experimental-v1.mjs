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
  await page.goto(base+'/panda-voice-pilot.html'+(flag?'':'?semantic=0'),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true');
  if(flag)await page.waitForFunction(()=>document.documentElement.dataset.pandaSemanticPilot==='ready');
  else assert.equal(await page.locator('html').getAttribute('data-panda-semantic-pilot'),null);
  const send=async q=>{await page.evaluate(q=>window.PandaApprovedBridge337.send(q),q);await page.waitForFunction(q=>{const h=window.PandaApprovedBridge337.snapshot().history;return h.at(-2)?.hanzi===q&&h.at(-1)?.who==='panda'},q);return page.evaluate(()=>window.PandaApprovedBridge337.snapshot());};
  const short=await send('我想休息');assert(!short.history.at(-1).analysis?.semanticPilot,'short mode never intercepted');
  await page.locator('#pg346-nonstop').click();
  await page.evaluate(()=>{window.__pilotPlaying=[];});
  const first=await send('我一回家就吃饭');if(flag){assert.equal(first.history.at(-1).hanzi,'然后呢？');assert.equal(first.history.at(-1).analysis.semanticPilot,true);assert.equal(first.history.at(-2).ru,'Как только прихожу домой, сразу ем.');assert.equal(first.audioAvailable,true);await page.waitForFunction(()=>window.__pilotPlaying.some(src=>src.includes('/panda-ai-voice-batch01-v563/PA-V563-01.mp3')),null,{timeout:10000});}else assert(!first.history.at(-1).analysis?.semanticPilot);
  for(const [q,expected] of [['吃饭','你想吃什么？'],['睡觉','你晚上几点睡觉？'],['非常好，你呢？','我也很好，谢谢！']]){const x=await send(q);assert.equal(x.history.at(-1).hanzi,expected,q);assert(x.history.at(-2).pinyin&&x.history.at(-2).ru,q);assert.equal(x.audioAvailable,true,q);}
  if(flag){
   for(const [q,a] of [['请问，银行在哪里？','银行在学校旁边。'],['那公园呢？','公园在医院后面。'],['公园离医院远吗？','不远，很近。'],['去机场要多久？','需要一个小时。']]){
    const x=await send(q);assert.equal(x.history.at(-1).hanzi,a,q);assert(x.history.at(-2).pinyin&&x.history.at(-2).ru,q);assert.equal(x.audioAvailable,true,q);
   }
   await page.evaluate(()=>window.PandaApprovedBridge337.setMode('short'));await page.evaluate(()=>window.PandaApprovedBridge337.setMode('nonstop'));
  }
  const travel=await send('去中国');assert.equal(travel.history.at(-1).hanzi,'你打算什么时候去？');assert.equal(travel.audioAvailable,true);assert(travel.history.at(-2).pinyin&&travel.history.at(-2).ru);const time=await send('明天');assert.equal(time.history.at(-1).hanzi,'然后呢？');
  for(const q of ['我先刷牙然后吃早饭','我先刷牙再吃早饭']){const x=await send(q);assert.equal(x.history.at(-1).hanzi,'你早上吃什么？',q);assert.equal(x.audioAvailable,true,q);}
  if(flag){
   const start=await send('聊聊中文吧');assert.equal(start.history.at(-1).hanzi,'你为什么想学中文？');
   for(const [q,kind] of [['我没听清楚','repeat-exact'],['你能再说一遍吗','repeat-exact'],['这句话是什么意思','explain-exact']]){
    const x=await send(q);assert.equal(x.history.at(-1).hanzi,start.history.at(-1).hanzi,q);assert.equal(x.history.at(-1).analysis?.kind,kind,q);assert(x.history.at(-2).pinyin&&x.history.at(-2).ru,q);assert.equal(x.audioAvailable,true,q);
   }
   const resumed=await send('因为我想去中国');assert.equal(resumed.history.at(-1).hanzi,'你打算什么时候去？');
   await page.evaluate(()=>window.PandaApprovedBridge337.setMode('short'));await page.evaluate(()=>window.PandaApprovedBridge337.setMode('nonstop'));
  }
  const positive=await send('很不错');assert(!/你能说得简单一点吗/.test(positive.history.at(-1).hanzi));
  for(const [q,expected] of [['我没有姐姐','明白了。你家有几口人？'],['三口人','你有兄弟姐妹吗？'],['我没有兄弟姐妹','谢谢你告诉我。你喜欢做什么？']]){const x=await send(q);assert.equal(x.history.at(-1).hanzi,expected,q);assert(!x.history.at(-1).analysis?.semanticPilot,'legacy family sequence remains intact: '+q);}
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
   // A new conversation starts at the greeting, not at a travel prompt.
   await page.evaluate(()=>window.PandaApprovedBridge337.setMode('short'));
   await page.evaluate(()=>window.PandaApprovedBridge337.setMode('nonstop'));
   await page.evaluate(()=>{window.__pilotPlaying=[];});
   const independent=await send('我打算坐飞机');
   assert.equal(independent.history.at(-1).hanzi,'祝你旅途愉快！');
   assert.equal(independent.audioAvailable,true);
   assert(independent.history.at(-2).pinyin&&independent.history.at(-2).ru);
   await page.waitForFunction(()=>window.__pilotPlaying.some(src=>src.includes('PA-V556-058.mp3')));
   const clips=await page.evaluate(async()=>{
    const audio=new AudioContext();
    try{return await Promise.all(['./assets/hsk2-lesson7-voice/l7_26.mp3','./assets/panda-ai-voice-v557/PA-V556-052.mp3','./assets/panda-ai-voice-v557/PA-V556-053.mp3','./assets/panda-ai-voice-v557/PA-V556-058.mp3','./assets/panda-clarification-voice-20261122/clarify07.mp3'].map(async path=>{
     const r=await fetch(path);if(!r.ok)throw Error(path+' HTTP '+r.status);const b=await audio.decodeAudioData(await r.arrayBuffer());return {path,duration:b.duration};
    }));}finally{await audio.close();}
   });
   assert.equal(clips.length,5);assert(clips.every(c=>c.duration>0));
   console.log('PASS fresh-chat transport plan and five decoded travel/clarification clips');
   // Every formerly silent learner line must have an enabled button and exact playback.
   const learnerAudio=async(raw,id)=>{
    await send(raw);
    const row=page.locator('#pg346-rows .pg346-row').filter({has:page.locator('.pg346-zh',{hasText:raw})}).last();
    const button=row.locator('.pg346-row-audio');await button.waitFor({state:'visible'});assert(await button.isEnabled(),raw);
    await page.evaluate(()=>{window.__pilotPlaying=[];});await button.click();
    await page.waitForFunction(id=>window.__pilotPlaying.some(src=>src.includes(id+'.mp3')),id);
   };
   await learnerAudio('你来选话题吧','PA-TRAVEL-01');
   await send('我想学中文');await send('因为我想去中国');
   await learnerAudio('什么意思','PA-TRAVEL-02');
   await learnerAudio('什么时候去中国','PA-TRAVEL-03');
   await learnerAudio('我下个月去中国','PA-TRAVEL-04');
   await learnerAudio('我打算坐飞机','PA-TRAVEL-05');
   console.log('PASS all five formerly silent learner reply buttons play exact uploaded MP3');
   const corrected=await send('我想中文学');
   assert.equal(corrected.history.at(-1).hanzi,'你为什么想学中文？');
   assert.equal(corrected.history.at(-2).analysis.correction.hanzi,'我想学中文。');
   assert.equal(corrected.history.at(-2).analysis.correction.inlineConversation,true);
   assert.equal(corrected.history.at(-1).analysis.toneVerified,false);
   await page.waitForFunction(()=>document.querySelector('#pg346-feedback')?.textContent.includes('我想学中文'));
   for(const [q,want] of [['因为我想去中国','你打算什么时候去？'],['什么意思','你打算什么时候去？'],['什么时候去中国','你打算什么时候去？'],['我下个月去中国','你打算怎么去？'],['我打算坐飞机','祝你旅途愉快！'],['聊聊我的一天吧','你早上吃早饭吗？'],['我吃早饭早上','你晚上几点睡觉？'],['聊聊工作吧','你今天忙吗？'],['聊聊我的一天吧','你晚上几点睡觉？'],['我睡觉晚上十点','你接下来想做什么？']]){
    const x=await send(q);assert.equal(x.history.at(-1).hanzi,want,q);assert.equal(x.history.at(-1).analysis.semanticPilot,true,q);
   }
   // Exercise new composed forms on the actual live page.
   await page.evaluate(()=>window.PandaApprovedBridge337.setMode('short'));
   await page.evaluate(()=>window.PandaApprovedBridge337.setMode('nonstop'));
   for(const [q,want] of [['聊聊我的一天吧','你早上吃早饭吗？'],['我早上一般不吃早饭','你晚上几点睡觉？'],['我晚上十一点半睡觉','你接下来想做什么？'],['聊聊工作吧','你今天忙吗？'],['我今天非常忙','你几点去上班？'],['我早上七点半去上班','你接下来想做什么？'],['我觉得中文很难','你想练习什么？'],['我想练习声调','没关系，我们慢慢来。']]){
    const x=await send(q);assert.equal(x.history.at(-1).hanzi,want,q);assert.equal(x.history.at(-1).analysis.semanticPilot,true,q);assert(x.history.at(-2).pinyin&&x.history.at(-2).ru,q);assert.equal(x.audioAvailable,true,q);
   }
   await page.waitForFunction(()=>window.__pilotPlaying.some(src=>src.includes('/panda-voice-clips-v365/p127.mp3')));
   console.log('PASS composed daily/work answers and recorded study-difficulty conversation');
   // Simulate a transient error on the exact recorded travel question.
   // Use native Audio for the second attempt and assert actual playback.
   await page.evaluate(()=>{
    const NativeAudio=window.Audio;window.__travelRetry=[];
    window.Audio=function(src){
     const a=new NativeAudio(src);
     if(String(src).includes('PA-V556-052.mp3')){
      window.__travelRetry.push(String(src));
      if(window.__travelRetry.length===1){
       a.play=()=>{queueMicrotask(()=>a.onerror?.(new Event('error')));return Promise.resolve();};
      }
     }
     return a;
    };
    window.Audio.prototype=NativeAudio.prototype;
    window.__pilotPlaying=[];
   });
   await send('我想学中文');await send('因为我想去中国');
   await page.waitForFunction(()=>window.__travelRetry.length===2&&window.__pilotPlaying.some(src=>src.includes('PA-V556-052.mp3')));
   assert.equal(await page.evaluate(()=>new Set(window.__travelRetry).size),1);
   console.log('PASS one exact audio retry after injected media error');
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
 // The actual course-map button opens the plain, now enabled Panda AI entry.
 const menu=await browser.newPage({viewport:{width:393,height:800},isMobile:true,hasTouch:true});
 await menu.goto(base+'/hsk1-map.html');const ai=menu.locator('a[aria-label="Panda AI"]');await ai.click();await menu.waitForFunction(()=>document.documentElement.dataset.pandaSemanticPilot==='ready');await menu.locator('#pg346-nonstop').click();await menu.evaluate(()=>window.PandaApprovedBridge337.send('我打算坐飞机'));await menu.waitForFunction(()=>window.PandaApprovedBridge337.snapshot().history.at(-1)?.hanzi==='祝你旅途愉快！');await menu.close();
 console.log('PASS ordinary course-menu Panda AI link activates reviewed free chat');
 const graded=await browser.newPage();await graded.goto(base+'/panda-voice-pilot.html?topic=1&semantic=1');await graded.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true');assert.equal(await graded.locator('html').getAttribute('data-panda-semantic-pilot'),null);await graded.close();
 const street=await browser.newPage({viewport:{width:393,height:800},isMobile:true,hasTouch:true});
 await street.addInitScript(()=>{window.__streetAudio=[];const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.__streetAudio.push(this.src);return play.apply(this,args);};});
 await street.goto(base+'/panda-street-ai-preview.html');await street.waitForFunction(()=>document.querySelector('[data-brain-state="full"]'));
 await street.locator('#nonstop').click();
 await street.locator('#entry').fill('我觉得中文很难');await street.locator('#submit').click();await street.waitForFunction(()=>document.querySelector('#live-panda')?.textContent.includes('你想练习什么'));
 await street.locator('#send').click();await street.locator('#entry').fill('我想练习声调');await street.locator('#submit').click();await street.waitForFunction(()=>document.querySelector('#live-panda')?.textContent.includes('没关系，我们慢慢来'));await street.waitForFunction(()=>window.__streetAudio.some(s=>s.includes('/panda-street-voice-v20261125/27.mp3')));
 // Owner-approved repeat-and-resume dialogue must work in Street as well.
 for(const [q,expected] of [
  ['我想学中文','你为什么想学中文？'],
  ['我没听清楚。','你为什么想学中文？'],
  ['因为我想去中国。','你打算什么时候去？']
 ]){
  await street.evaluate(()=>{window.__streetAudio=[];});
  await street.locator('#send').click();await street.locator('#entry').fill(q);await street.locator('#submit').click();
  await street.waitForFunction(({q,expected})=>{
   const last=JSON.parse(sessionStorage.getItem('panda-street-v7-log')||'[]').at(-1);
   return last?.user===q&&last?.panda?.zh===expected&&!!last.userInfo?.py&&!!last.userInfo?.ru&&document.querySelector('#live-panda .zh')?.textContent===expected;
  },{q,expected});
  const clip=await street.evaluate(expected=>window.PandaStreetVoiceV20261125.lookup(expected,'male'),expected);
  const expectedFile=expected==='你为什么想学中文？'?'54.mp3':'55.mp3';
  assert.equal(clip?.src,'./assets/panda-street-voice-v20261125/'+expectedFile);
  await street.waitForFunction(file=>window.__streetAudio.some(s=>s.endsWith('/'+file)),expectedFile);
 }
 console.log('PASS Street repeat previous question and resume the China travel chain');
 const newAudio=await street.evaluate(async()=>{
  const manifest=await fetch('./assets/panda-ai-voice-20261127/manifest.json').then(r=>r.json());
  const paths=[...manifest.clips.map(x=>x.src),'./assets/panda-street-voice-v20261125/54.mp3','./assets/panda-street-voice-v20261125/55.mp3'];
  const ctx=new AudioContext(),durations=[];
  try{for(const path of paths){const r=await fetch(path);if(!r.ok)throw Error(path+' HTTP '+r.status);const b=await ctx.decodeAudioData(await r.arrayBuffer());durations.push(b.duration);}return durations;}finally{await ctx.close();}
 });
 assert.equal(newAudio.length,60);assert(newAudio.every(x=>Number.isFinite(x)&&x>0));
 console.log('PASS decoded every newly imported MP3 in Chromium');
 assert((await street.evaluate(()=>window.__streetAudio)).every(s=>s.includes('/panda-street-voice-v20261125/')),'Street must never request Panda AI female recordings');await street.close();
 console.log('PASS Street shared semantic context and exact male-only playback; explicit rollback, short and graded preserved');
}finally{await browser.close();}
