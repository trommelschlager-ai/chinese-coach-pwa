// Chromium regression tests. Reduced viewports simulate keyboard space;
// FakeSpeech exercises lifecycle events, not a physical Android microphone/IME.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const BASE=process.env.QA_BASE||'http://127.0.0.1:4173';
const DIR='qa/panda-voice-pilot';fs.mkdirSync(DIR,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report=[],errors=[];
async function ready(page){await page.locator('html[data-panda-live-ready=true]').waitFor()}
async function send(page,text){await page.locator('#message').fill(text);await page.locator('#send').click()}
async function geometry(page){
 await page.waitForFunction(()=>Math.abs(document.querySelector('main').getBoundingClientRect().height-(visualViewport?.height||innerHeight))<2);
 return await page.evaluate(()=>{
  const card=document.querySelector('.card').getBoundingClientRect();
  return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,
   cardOverflow:document.querySelector('.card').scrollHeight-document.querySelector('.card').clientHeight,
   controls:['mic','message','send','hint','mode-short','mode-nonstop'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,visible:r.width>0&&r.height>0&&r.x>=0&&r.right<=innerWidth+1&&r.y>=0&&r.bottom<=innerHeight+1&&(id.startsWith('mode-')||r.bottom<=card.bottom+1)}})};
 });
}
try{
 for(const width of [360,393,412,430]){
  const context=await browser.newContext({viewport:{width,height:825},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await context.addInitScript(()=>{
   window.__speech=[];window.SpeechRecognition=class{constructor(){window.__speech.push(this)}start(){this.onstart?.()}abort(){}stop(){this.onend?.()}};
   localStorage.setItem('qa-sentinel','keep');
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'/panda-voice-pilot.html');await ready(page);
  assert(await page.locator('.panda-picture').evaluate(img=>img.naturalWidth>0));
  await page.locator('#hear').click();await page.waitForFunction(()=>document.querySelector('#character').dataset.state==='talking');
  for(const mode of ['short','nonstop']){
   await page.locator('#mode-'+mode).click();
   if(mode==='nonstop'){
    for(const [text,reply] of [['你好','你好！'],['你好呀','你好！'],['你好啊','你好！'],['早上好','早上好！'],['中午好','中午好！'],['下午好','下午好！'],['晚上好！','晚上好！'],['你好吗？','很好！']]){await send(page,text);assert.equal(await page.locator('#phrase').textContent(),reply)}
    await send(page,'谢谢');assert.equal(await page.locator('#mode-nonstop').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#phrase').textContent(),'不客气！');assert(await page.locator('#audio-note').isVisible());
    await send(page,'你好吗？');
   }
   for(const hint of [false,true]){
    if((await page.locator('#hint').getAttribute('aria-expanded'))!==String(hint))await page.locator('#hint').click();
    for(const height of [568,640,740,825,915,400,320]){
     await page.setViewportSize({width,height});const m=await geometry(page);
     assert(m.scrollWidth<=width+1&&m.scrollHeight<=height+1,JSON.stringify(m));assert(m.cardOverflow<2,JSON.stringify(m));assert(m.controls.every(c=>c.visible),JSON.stringify(m));report.push({mode,hint,...m});
    }
   }
   await page.setViewportSize({width,height:825});await page.locator('#hint').click();
   if(mode==='nonstop')await send(page,'你好吗？');
   await page.screenshot({path:DIR+'/'+mode+'-'+width+'.png',fullPage:false,animations:'disabled'});
  }
  await page.locator('#speed-toggle').click();assert.equal(await page.locator('#speed-toggle').getAttribute('aria-pressed'),'true');await page.locator('#speed-toggle').click();
  await page.locator('#mic').click();assert(await page.locator('#speech-dialog').isVisible());assert.equal(await page.evaluate(()=>window.__speech.length),0);await page.locator('#speech-allow').click();
  await page.evaluate(()=>window.__speech.at(-1).onresult({results:[[{transcript:'晚上好',confidence:.4}]]}));assert.equal(await page.locator('#phrase').textContent(),'晚上好！');assert((await page.locator('#status').textContent()).includes('неуверенно'));
  await page.locator('#mode-short').click();await page.locator('#reset').click();await send(page,'你好');await send(page,'我很好');assert.equal(await page.locator('#step').textContent(),'Диалог завершён');
  assert(await page.evaluate(()=>localStorage.getItem('pg-panda-voice-pilot-v1-last')));assert.equal(await page.evaluate(()=>localStorage.getItem('qa-sentinel')),'keep');
  const dayNames=['日','一','二','三','四','五','六'];const day=await page.evaluate(()=>new Date().getDay());
  for(const {id,answers,final} of [
   {id:2,answers:['你好','我是老师'],final:'我也是老师。'},
   {id:2,answers:['你好','不是，我是学生'],final:'我是老师。'},
   {id:3,answers:['你好','我44岁'],final:'我三岁。'},
   {id:4,answers:['你好','今天星期'+dayNames[day]],final:day===1?'明天星期二。':'谢谢！'},
   {id:5,answers:['你好','今天是3月5号'],final:'明天三月六号。'},
   {id:6,answers:['你好','我没有哥哥，我有妹妹'],final:'谢谢！'},
   {id:7,answers:['你好','今天很冷','明天下雨'],final:'谢谢！'}
  ]){
   await page.locator('#lesson-select').selectOption(String(id));
   for(const answer of answers)await send(page,answer);
   assert.equal(await page.locator('#phrase').textContent(),final);assert.equal(await page.locator('#step').textContent(),'Диалог завершён');
   if(id===4)assert((await page.locator('#exercise-banner').textContent()).includes('твоего телефона'));
   if(id===5)assert((await page.locator('#exercise-banner').textContent()).includes('Учебная сценка'));
  }
  await page.locator('#lesson-select').selectOption('6');await page.locator('#mode-nonstop').click();await send(page,'我有妹妹');assert((await page.locator('#recent').textContent()).includes('младшая сестра'));assert((await page.locator('#phrase').textContent()).includes('妹妹'));
  await send(page,'我没有哥哥，我有妹妹');assert((await page.locator('#recent').textContent()).includes('Wǒ méiyǒu gēge, wǒ yǒu mèimei.'));await send(page,'你有哥哥吗');assert.equal(await page.locator('#phrase').textContent(),'我有一个哥哥。');
  await send(page,'今天天气怎么样');assert((await page.locator('#status').textContent()).includes('урока 7'));
  for(let i=0;i<12;i++)await send(page,'你好吗？');assert.equal(await page.locator('#recent article').count(),2);await page.locator('#history-open').click();assert(await page.locator('#history-dialog').isVisible());assert((await page.locator('#history article').count())>12);await page.locator('[data-close="history-dialog"]').click();
  await page.locator('#finish').click();assert.equal(await page.locator('#mode-short').getAttribute('aria-pressed'),'true');
  await page.evaluate(()=>localStorage.setItem('pg-hsk1-v3-complete',JSON.stringify(['foundations','pronouns','numbers','weekdays','dates','family','weather'])));
  await page.goto(BASE+'/panda-voice-pilot.html?lesson=1');await ready(page);await page.locator('#mode-nonstop').click();
  for(const [q,answer] of [['今天天气怎么样','今天很冷。'],['你有妹妹吗','我有一个妹妹。'],['你几岁','我三岁。']]){await send(page,q);assert.equal(await page.locator('#phrase').textContent(),answer)}
  await send(page,'今天星期几');assert((await page.locator('#phrase').textContent()).includes('星期'+dayNames[day]));
  await send(page,'今天几月几号');assert((await page.locator('#exercise-banner').textContent()).includes('календарю устройства'));
  // v302: end-to-end text questions use the existing chat, not a new screen.
  await send(page,'妹妹是什么意思？');
  assert.equal(await page.locator('#phrase').textContent(),'妹妹');
  assert((await page.locator('#pinyin').textContent()).includes('mèimei'));
  assert((await page.locator('#learner-feedback').textContent()).includes('существительное'));
  await send(page,'用春天造句');
  assert.equal(await page.locator('#phrase').textContent(),'春天天气很好。');
  assert((await page.locator('#translation').textContent()).includes('Весной'));
  await send(page,'水是什么意思？');
  assert((await page.locator('#status').textContent()).includes('пока нет в словаре'));
  // Additional question and reply pairs across the approved seven-lesson knowledge base.
  for(const [question,expected] of [
   ['你有爷爷吗','有，我有爷爷。'],
   ['这个月有多少天',null],
   ['十后面是几','十一。'],
   ['他是学生吗','是，他是学生。'],
   ['今天下雪吗','今天不下雪。']
  ]){
    await send(page,question);
    if(expected)assert.equal(await page.locator('#phrase').textContent(),expected,question);
    else assert((await page.locator('#phrase').textContent()).includes('这个月有'),question);
  }
  await send(page,'我有妹妹');assert((await page.locator('#status').textContent()).includes('запомнила'));
  await send(page,'今天天气怎么样');if(!(await page.locator('#status').textContent()).includes('Панда продолжит'))await send(page,'今天天气怎么样');await page.waitForFunction(()=>document.querySelector('#phrase').textContent!=='今天很冷。'&&document.querySelector('#recent').textContent.includes('Панда'),null,{timeout:12000});
  await send(page,'我不有妹妹');assert((await page.locator('#learner-feedback').textContent()).includes('我没有妹妹'));assert((await page.locator('#recent').textContent()).includes('我不有妹妹'));
  for(const hint of [false,true]){
   if((await page.locator('#hint').getAttribute('aria-expanded'))!==String(hint))await page.locator('#hint').click();
   for(const height of [568,640,740,825,915,400,320]){await page.setViewportSize({width,height});const m=await geometry(page);assert(m.controls.every(c=>c.visible),JSON.stringify(m));assert(m.cardOverflow<2,JSON.stringify(m));report.push({mode:'correction',hint,...m})}
  }
  await page.setViewportSize({width,height:825});await page.locator('#hint').click();
  const bubble=await page.locator('.speech').evaluate(el=>{const r=el.getBoundingClientRect(),p=el.querySelector('#phrase').getBoundingClientRect();return {top:r.top,phraseTop:p.top,bottom:r.bottom}});assert(bubble.phraseTop>=bubble.top&&bubble.phraseTop<bubble.bottom,'First Chinese line must remain reachable from the start');
  await page.screenshot({path:DIR+'/correction-'+width+'.png',fullPage:false,animations:'disabled'});

  // v306: explanatory card must be short, word-specific and never overlap the next prompt.
  await send(page,'HSK 2');assert.equal(await page.locator('#phrase').textContent(),'我学习中文。');
  await send(page,'中文是什么意思？');assert.equal(await page.locator('#phrase').textContent(),'中文');
  assert((await page.locator('#pinyin').textContent()).includes('Zhōngwén'));
  assert(!(await page.locator('#audio-note').isVisible()),'Existing B06 recording should be playable');
  assert(await page.locator('.listen-controls').isVisible(),'Show speaker when B06 recording is available');
  const cardText=await page.locator('#learner-feedback').textContent();
  assert(cardText.includes('Тоны: 1 + 2')&&cardText.includes('我学习中文'),'Missing compact lexical explanation');
  assert(!cardText.includes('我很忙'),'Unrelated rule leaked into 中文 explanation');
  await page.waitForFunction(()=>document.querySelector('#phrase').textContent==='你学习中文吗？',null,{timeout:13000});
  assert(!(await page.locator('#learner-feedback').isVisible()),'Old vocabulary explanation survived new question');
  assert(!(await page.locator('#audio-note').isVisible()),'The recorded B01 question should be playable');
  assert(await page.locator('.listen-controls').isVisible(),'The question must show its real B01 playback controls');
  const speechFit=await page.locator('.speech').evaluate(el=>{
   const b=el.getBoundingClientRect(),e=[...el.querySelectorAll('#phrase,#pinyin,#translation,#audio-note')].filter(x=>!x.hidden).map(x=>x.getBoundingClientRect());
   return {overflow:el.scrollHeight-el.clientHeight,bottom:b.bottom,children:e.map(x=>({top:x.top,bottom:x.bottom}))};
  });
  assert(speechFit.overflow<=2&&speechFit.children.every(x=>x.bottom<=speechFit.bottom+1),JSON.stringify(speechFit));
  await send(page,'学习中文');assert.equal(await page.locator('#phrase').textContent(),'我学习中文。');
  assert((await page.locator('#learner-feedback').textContent()).includes('правильное словосочетание'),'Never flag 学习中文 as ungrammatical');
  assert((await page.locator('#learner-feedback').textContent()).includes('我'),'Teach a full first-person sentence');
  assert(!(await page.locator('#audio-note').isVisible()),'A real B02 recording must play');
  assert(await page.locator('#hear').isEnabled(),'B02 recording must enable Listen');
  const b02=await page.evaluate(async()=>{const mod=await import('./assets/panda-live-audio.mjs?v=307');return mod.lookupPilotAudio('我学习中文')});
  assert(b02.endsWith('/B02.mp3'),'Wrong voice for corrected sentence');
  await send(page,'你忙吗？');assert.equal(await page.locator('#phrase').textContent(),'我不忙。');
  await send(page,'我是忙');assert((await page.locator('#learner-feedback').textContent()).includes('我很忙'));
  // v319: short valid beginner phrases become complete first-person examples.
  await send(page,'很忙');assert.equal(await page.locator('#phrase').textContent(),'我很忙。');
  assert((await page.locator('#learner-feedback').textContent()).includes('правильная краткая фраза'));
  assert(await page.locator('#hear').isEnabled(),'Use existing recorded B04 instead of new TTS');
  await send(page,'不忙');assert.equal(await page.locator('#phrase').textContent(),'我不忙。');
  assert(await page.locator('#hear').isEnabled(),'Use existing recorded B05');
  await send(page,'是学生');assert.equal(await page.locator('#phrase').textContent(),'我是学生。');
  assert((await page.locator('#learner-feedback').textContent()).includes('добавь 我'));
  await send(page,'有妹妹');assert.equal(await page.locator('#phrase').textContent(),'我有妹妹。');
  assert((await page.locator('#learner-feedback').textContent()).includes('Для рассказа о своей семье добавь 我'),'The family phrase needs a contextual first-person hint');

  const sources=await page.evaluate(async()=>Object.values((await import('./assets/panda-live-audio.mjs')).PILOT_AUDIO));
  for(const src of sources){const response=await page.request.get(new URL(src,BASE+'/').href);assert.equal(response.status(),200,src);assert((await response.body()).length>1000,src)}
  await context.close();
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(DIR+'/qa-report.json',JSON.stringify({note:'Chromium mobile viewports, simulated SpeechRecognition, reduced-height keyboard-space checks. Physical Android microphone and keyboard not tested.',results:report,errors},null,2)+'\n');
 console.log('Panda Live v270: '+report.length+' layout checks, all dialogue scenarios and 23 MP3 URLs PASS');
}finally{await browser.close()}
