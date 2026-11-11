// Chromium mobile-viewport smoke QA. This emulates Android UI,
// but does NOT test physical microphone hardware or tone acoustics.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const BASE=process.env.QA_BASE||'http://127.0.0.1:4173';
const OUT='qa/panda-talk-mobile';
fs.mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const widths=[360,390,412],results=[];
try{
 for(const width of widths){
  const context=await browser.newContext({
   viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,
   locale:'ru-RU'
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
   window.__pandaRecognizers=[];
   class MockSpeechRecognition{
    constructor(){window.__pandaRecognizers.push(this)}
    start(){this.started=true}
    stop(){this.stopped=true;this.onend?.()}
    abort(){this.aborted=true;this.onend?.()}
   }
   window.webkitSpeechRecognition=MockSpeechRecognition;
  });
  await page.goto(BASE+'/panda-talk.html',{waitUntil:'load'});
  await page.locator('[data-scene="hello"]').waitFor();
  assert.equal(await page.locator('[data-scene]').count(),8);
  const metrics=await page.evaluate(()=>({
   width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
   firstPrompt:document.querySelector('#chat')?.textContent||''
  }));
  assert(metrics.scrollWidth<=width+2,'Horizontal overflow at '+width+': '+JSON.stringify(metrics));
  assert(metrics.firstPrompt.includes('你好'),'First dialogue should load');
  const paths=await page.evaluate(()=>({
   hello:window.PandaOwnerAudio?.lookup('你好'),
   student:window.PandaOwnerAudio?.lookup('我是学生')
  }));
  assert(paths.hello?.endsWith('.mp3')&&paths.student?.endsWith('.mp3'));
  for(const [key,path] of Object.entries(paths)){
   const url=new URL(path,BASE+'/');
   const response=await page.request.get(url.href);
   assert.equal(response.status(),200,key+' audio missing');
   const bytes=await response.body();
   assert(bytes.length>1000,key+' audio too small');
  }
  assert(await page.locator('#hear').isEnabled());
  await page.locator('#hear').click();
  await page.locator('#mic').click();
  assert.equal(await page.locator('#mic').getAttribute('aria-pressed'),'true');
  await page.evaluate(()=>{
   const rec=window.__pandaRecognizers.at(-1);
   rec.onresult?.({results:[[{transcript:'你好！'}]]});
   rec.onend?.();
  });
  assert.equal(await page.locator('#reply').inputValue(),'你好！');
  await page.locator('#send').click();
  assert((await page.locator('#chat').textContent()).includes('我是学生。'));
  assert(await page.locator('#hear').isEnabled());
  await page.locator('#hear').click();
  await page.locator('#mic').click();
  await page.evaluate(()=>{
   const rec=window.__pandaRecognizers.at(-1);
   rec.onresult?.({results:[[{transcript:'我是学生'}]]});
   rec.onend?.();
  });
  await page.locator('#send').click();
  assert((await page.locator('#chat').textContent()).includes('Диалог завершён'));
  assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('pg-panda-conversation-v1-completed')))).hello.turns,2);
  assert.deepEqual(errors,[],'Browser JS errors');
  await page.screenshot({path:OUT+'/android-'+width+'.png',fullPage:true,animations:'disabled'});
  results.push({width,...metrics,success:true,audio:paths});
  await context.close();
 }
 fs.writeFileSync(OUT+'/report.json',JSON.stringify({
  note:'Chromium mobile viewport + mocked SpeechRecognition, not physical Android mic or tonal pronunciation QA',
  results
 },null,2)+'\n');
 console.log('PASS Panda conversation mobile Chromium widths '+widths.join(', '));
}finally{await browser.close()}
