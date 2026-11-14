import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const dir='qa/panda-reference';fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[],report=[];
try{
 for(const [width,height] of [[360,760],[384,850],[400,800],[430,930]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await context.addInitScript(()=>{
   localStorage.setItem('pg-hsk1-v3-complete','[1,2,3,4,5,6,7]');
   window.__speech=[];window.SpeechRecognition=class{constructor(){window.__speech.push(this)}start(){this.onstart?.()}abort(){}stop(){this.onend?.()}};
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/panda-voice-pilot.html');await page.locator('#pg346').waitFor();
  assert.equal(await page.locator('#pg346').count(),1);
  const check=async(label)=>{
   const g=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,
    controls:['pg346-short','pg346-nonstop','pg346-py','pg346-history','pg346-topics-btn','pg346-input','pg346-send','pg346-mic'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return{id,x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}}),
    panda:(()=>{const p=document.querySelector('.pg346-panda'),r=p.getBoundingClientRect();return {ratio:r.width/r.height,intrinsic:p.naturalWidth/p.naturalHeight,fit:getComputedStyle(p).objectFit}})()}));
   assert(g.scrollWidth<=g.width+1,JSON.stringify(g));assert(g.controls.every(r=>r.width>0&&r.height>0&&r.x>=0&&r.y>=0&&r.right<=g.width+1&&r.bottom<=g.height+1),JSON.stringify(g));
   assert(Math.abs(g.panda.ratio-g.panda.intrinsic)<.02,JSON.stringify(g.panda));assert.equal(g.panda.fit,'contain');report.push({label,...g});
  };
  await check('initial');assert.equal(await page.locator('.pg346-row').count(),1);
  await page.screenshot({path:`${dir}/${width}x${height}-initial.png`});
  // Render actual bridge-shaped histories without inventing persistent conversation turns.
  await page.evaluate(()=>{window.__snapshot=window.PandaApprovedBridge337.snapshot});
  for(const count of [1,2,3]){
   await page.evaluate(count=>{const b=window.PandaApprovedBridge337;b.snapshot=()=>({...window.__snapshot(),history:Array.from({length:count},(_,i)=>({who:i%2?'you':'panda',hanzi:i%2?'我叫安东。':'你好！',pinyin:i%2?'Wǒ jiào Āndōng.':'Nǐ hǎo!',ru:i%2?'Меня зовут Антон.':'Привет!'}))});document.getElementById('status').textContent='qa '+count},count);
   await page.waitForFunction(count=>document.querySelectorAll('.pg346-row').length===count,count);await check('history-'+count);
   await page.screenshot({path:`${dir}/${width}x${height}-history-${count}.png`});
  }
  await page.evaluate(()=>{window.PandaApprovedBridge337.snapshot=window.__snapshot;document.getElementById('status').textContent=''});
  await page.locator('#pg346-nonstop').click();await page.locator('#pg346-input').fill('你好吗？');await page.locator('#pg346-send').click();
  await page.waitForFunction(()=>document.querySelector('.pg346-main-zh').textContent===document.getElementById('phrase').textContent);
  assert.match(await page.locator('.pg346-main-zh').textContent(),/很好/);
  await page.locator('#pg346-speed').click();assert.match(await page.locator('#pg346-speed').textContent(),/0,8/);
  await page.locator('#pg346-hear').click();await page.waitForFunction(()=>document.getElementById('character').dataset.state==='talking');
  await page.locator('#pg346-py').click();assert.equal(await page.locator('#pg346').getAttribute('data-py'),'false');await page.locator('#pg346-py').click();
  assert(!(await page.locator('#pg346-topics').isVisible()));await page.locator('#pg346-topics-btn').click();assert(await page.locator('.pg346-topic-list button').count()>0);await page.locator('.pg346-topic-list button').last().click();assert(!(await page.locator('#pg346-topics').isVisible()));
  await page.locator('#pg346-history').click();assert(await page.locator('#history-dialog').isVisible());await page.locator('[data-close="history-dialog"]').click();
  await page.locator('#pg346-mic').click();await page.locator('#speech-allow').click();await page.evaluate(()=>window.__speech.at(-1).onresult({results:[[{transcript:'晚上好',confidence:1}]]}));await page.waitForFunction(()=>document.querySelector('.pg346-main-zh').textContent==='晚上好！');
  await page.evaluate(()=>{const b=window.PandaApprovedBridge337;b.snapshot=()=>({...window.__snapshot(),current:{hanzi:'这是一个很长的中文句子。'.repeat(12),pinyin:'Zhè shì yí ge hěn cháng de Zhōngwén jùzi.',ru:'Длинный русский перевод предложения. '.repeat(15)},history:[{who:'you',hanzi:'你好。'.repeat(25),pinyin:'Nǐ hǎo. '.repeat(25),ru:'Длинный перевод. '.repeat(30)}]});document.getElementById('status').textContent='qa long'});
  await page.waitForFunction(()=>document.querySelector('.pg346-main-zh').textContent.length>100);await check('long');await page.screenshot({path:`${dir}/${width}x${height}-long.png`});
  await page.setViewportSize({width,height:430});await page.locator('#pg346-input').focus();await check('keyboard-space-simulation');await page.screenshot({path:`${dir}/${width}-keyboard-simulation.png`});
  await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(`${dir}/report.json`,JSON.stringify({report,errors,physicalAndroid:false,visualMatch:false,reason:'Clean approved landscape source is missing; draft only.'},null,2));
 console.log(`PASS: ${report.length} geometry checks; history, audio playback, mode, topics, pinyin, speed and mocked microphone. Physical Android and visual match are NOT verified.`);
}finally{await browser.close()}
