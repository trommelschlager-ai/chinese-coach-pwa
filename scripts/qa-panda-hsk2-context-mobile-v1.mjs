// Actual mobile-size Chromium smoke for Panda AI: the user-facing chat, not a mock model.
// All Mandarin expectations are hand-reviewed and already asserted at the core level.
// Browser speech microphone itself is deliberately not asserted here.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const base=process.env.QA_BASE||'http://127.0.0.1:4173';
fs.mkdirSync('qa/panda-context-v1',{recursive:true});
const checks=[
 ['今天你有没有空？','Jīntiān nǐ yǒu méiyǒu kòng?','今天我有空，可以聊聊天。','есть время'],
 ['现在我很忙。','Xiànzài wǒ hěn máng.','好的，那你先忙吧。','очень занят'],
 ['今天我休息。','Jīntiān wǒ xiūxi.','那你今天想做什么？','Сегодня я отдыхаю'],
 ['现在我休息。','Xiànzài wǒ xiūxi.','那你想聊聊天吗？','Сейчас я отдыхаю'],
 ['工作','gōngzuò','你想聊聊工作吗？','Работа; работать'],
 ['我今天不工作。','Wǒ jīntiān bù gōngzuò.','那你今天想做什么？','Сегодня я не работаю']
];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [360,393,412]){
  const context=await browser.newContext({viewport:{width,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto(base+'/panda-voice-pilot.html',{waitUntil:'domcontentloaded'});
  await page.locator('#pg346').waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true',{timeout:15000});
  await page.locator('#pg346-nonstop').click();
  assert.equal(await page.locator('#pg346-nonstop').getAttribute('aria-pressed'),'true');
  for(const [learner,pinyin,reply,russian] of checks){
   await page.locator('#pg346-send').click();
   await page.locator('#pg346-input').fill(learner);
   await page.locator('#pg346-send').click();
   const rows=page.locator('#pg346-rows .pg346-row');
   await page.waitForFunction(expected=>document.querySelector('#pg346-rows .pg346-row:last-child .pg346-zh')?.textContent===expected,reply,{timeout:5000});
   assert.equal(await rows.last().locator('.pg346-zh').textContent(),reply,'Wrong Panda answer: '+learner);
   if(reply==='今天我有空，可以聊聊天。') assert.equal(await rows.last().locator('.pg346-py').textContent(),'Jīntiān wǒ yǒu kòng, kěyǐ liáoliao tiān.');
   if(reply==='那你想聊聊天吗？') assert.equal(await rows.last().locator('.pg346-py').textContent(),'Nà nǐ xiǎng liáoliao tiān ma?');
   if(reply==='你想聊聊工作吗？') assert.equal(await rows.last().locator('.pg346-py').textContent(),'Nǐ xiǎng liáoliao gōngzuò ma?');
   assert.equal(await rows.nth((await rows.count())-2).locator('.pg346-zh').textContent(),learner);
   assert.equal(await rows.nth((await rows.count())-2).locator('.pg346-py').textContent(),pinyin);
   assert((await rows.nth((await rows.count())-2).locator('.pg346-ru').innerText()).includes(russian),'Missing reviewed Russian for '+learner);
   assert.equal(await page.locator('.pg500-example').count(),0,'Sample cards must not be chat messages');
   assert.equal(await page.locator('#pg346-hear').isDisabled(),false,'The five exact user MP3s must activate the Panda playback button');
   assert.equal(await rows.last().locator('.pg346-row-audio').isDisabled(),false,'Panda history clip should also be playable');
  }
  // Regression: preserve learner context across an actual three-turn chat.
  // Previous test ends with 我今天不工作 -> 那你今天想做什么？.
  // The next two turns must stay on the same film topic, not ask to speak simpler.
  await page.locator('#pg346-send').click();
  await page.locator('#pg346-input').fill('我想看电影。');
  await page.locator('#pg346-send').click();
  const movieRows=page.locator('#pg346-rows .pg346-row');
  await page.waitForFunction(()=>document.querySelector('#pg346-rows .pg346-row:last-child .pg346-zh')?.textContent==='你想看什么电影？',null,{timeout:5000});
  assert.equal(await movieRows.last().locator('.pg346-py').textContent(),'Nǐ xiǎng kàn shénme diànyǐng?');
  assert.equal(await movieRows.nth((await movieRows.count())-2).locator('.pg346-zh').textContent(),'我想看电影。');
  assert.equal(await movieRows.nth((await movieRows.count())-2).locator('.pg346-py').textContent(),'Wǒ xiǎng kàn diànyǐng.');
  assert((await movieRows.nth((await movieRows.count())-2).locator('.pg346-ru').textContent()).includes('Я хочу посмотреть фильм'));
  assert.equal(await page.locator('#pg346-hear').isDisabled(),true,'Do not invent a voice for an unrecorded follow-up');
  await page.screenshot({path:'qa/panda-context-v1/panda-'+width+'-movie-followup.png',fullPage:false,animations:'disabled'});

  await page.locator('#pg346-send').click();
  await page.locator('#pg346-input').fill('我想看喜剧片。');
  await page.locator('#pg346-send').click();
  await page.waitForFunction(()=>document.querySelector('#pg346-rows .pg346-row:last-child .pg346-zh')?.textContent==='我喜欢喜剧片。',null,{timeout:5000});
  assert.equal(await movieRows.last().locator('.pg346-py').textContent(),'Wǒ xǐhuan xǐjùpiàn.');
  assert.equal(await movieRows.nth((await movieRows.count())-2).locator('.pg346-py').textContent(),'Wǒ xiǎng kàn xǐjùpiàn.');
  assert((await movieRows.nth((await movieRows.count())-2).locator('.pg346-ru').textContent()).includes('посмотреть комедию'));
  assert.equal(await page.locator('#pg346-hear').isDisabled(),false,'Use existing Xiaoxiao MP3 for a known genre');
  assert.equal(await movieRows.last().locator('.pg346-row-audio').isDisabled(),false);
  // Real MP3 playback, not merely a clickable audio icon. Browser click is a user gesture.
  await page.locator('#pg346-rows .pg346-row').last().locator('.pg346-row-audio').click();
  await page.waitForFunction(()=>document.querySelector('#pg346')?.dataset.pose==='talking',null,{timeout:7000});
  assert.equal(await page.locator('.pg346-panda').count(),1,'Approved Panda image must remain present');
  const image=await page.locator('.pg346-panda').evaluate(img=>({loaded:img.complete&&img.naturalWidth>0,ratio:img.naturalWidth/img.naturalHeight}));
  assert.equal(image.loaded,true,'Original Panda visual must be loaded');
  assert(!errors.length,'Browser JS errors: '+JSON.stringify(errors));
  await page.screenshot({path:'qa/panda-context-v1/panda-'+width+'-after-five-phrases.png',fullPage:false,animations:'disabled'});
  // Why-comedies must be a meaningful fourth movie turn, not a false speech error.
  await page.locator('#pg346-send').click();
  await page.locator('#pg346-input').fill('你为什么喜欢喜剧片？');
  await page.locator('#pg346-send').click();
  await page.waitForFunction(()=>document.querySelector('#pg346-rows .pg346-row:last-child .pg346-zh')?.textContent==='因为喜剧片很好笑。',null,{timeout:8000});
  const whyRows=page.locator('#pg346-rows .pg346-row');
  assert.equal(await whyRows.last().locator('.pg346-py').textContent(),'Yīnwèi xǐjùpiàn hěn hǎoxiào.');
  assert.equal(await whyRows.last().locator('.pg346-ru').textContent(),'Потому что комедии очень смешные.');
  assert.equal(await whyRows.nth((await whyRows.count())-2).locator('.pg346-py').textContent(),'Nǐ wèishénme xǐhuan xǐjùpiàn?');
  assert.equal(await whyRows.nth((await whyRows.count())-2).locator('.pg346-ru').textContent(),'Почему тебе нравятся комедии?');
  assert.equal(await page.locator('#pg346-hear').isDisabled(),true,'No unapproved Xiaoxiao voice for new reason reply');
  await page.screenshot({path:'qa/panda-context-v1/panda-'+width+'-movie-why-reason.png',fullPage:false,animations:'disabled'});
  console.log('PASS mobile browser '+width+'px: 5 learner turns + 4-step movie chat + translations + approved Panda intact');
  await context.close();
 }
} finally {await browser.close()}
