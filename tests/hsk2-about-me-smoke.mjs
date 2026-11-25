// HSK2 About Me -- browser smoke and visual tests. Run: node tests/hsk2-about-me-smoke.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';

const port = 18765;
const root = 'http://127.0.0.1:' + port + '/hsk2-about-me.html';
const output = 'assets/hsk2-about-me/screenshots';
const server = spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
const errors = [];
const check = (value,reason)=>assert.ok(value,reason);
try {
  await mkdir(output,{recursive:true});
  await delay(900);
  browser = await chromium.launch({headless:true,args:['--no-sandbox']});
  const page = await browser.newPage({viewport:{width:393,height:873},deviceScaleFactor:1});
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(root,{waitUntil:'load'});
  check(await page.locator('.pg433-tabs button').count()===5,'Must have 5 top sections');
  check(await page.locator('.pg433-tabs button:disabled').count()===4,'Other 4 sections must start locked');
  await page.locator('.about-approved-cover-start').click();
  check(await page.locator('.word-row').count()===6,'Six word cards expected');
  check(await page.locator('.word-row svg.about-illustration').count()===6,'Missing themed word illustrations');
  check(await page.locator('.word-row .tone-strokes path').count()===12,'Each syllable must have contour');
  check(await page.locator('#next').isDisabled(),'Words should block progress until all marked');
  for(let i=0;i<6;i++){
    await page.locator('.word-row [data-say]').nth(i).click();
    await page.waitForFunction(n=>window.PandaGoHSK2Preview.getProgress().heardWords.length===n,i+1,{timeout:15000});
  }
  await page.locator('#next').click();
  check((await page.locator('.about-grammar-rule').innerText()).includes('现在'),'Grammar page not reached');
  for(let i=0;i<5;i++)await page.locator('[data-gram="'+i+'"]').click();
  await page.locator('[data-gram-check]').click();
  check((await page.locator('#next').isEnabled()),'Grammar correct assembly did not unlock');
  await page.locator('#next').click();
  check(await page.locator('.pg-standard-speech-row').count()===6,'Speech practice should contain six words');
  await page.locator('.about-speech-help summary').click();
  await page.locator('.about-speech-help [data-practice-mode="self"]').click();
  for(let i=0;i<6;i++)await page.locator('[data-self-spoken="'+i+'"]').click();
  await page.locator('#next').click();
  check(await page.locator('[data-start]').count()===1,'30-task test should start here');
  await page.locator('[data-start]').click();
  let correct=0;
  const progress=()=>page.evaluate(()=>window.PandaGoHSK2Preview.getProgress());
  async function answer(word,type){
    const p=await progress();
    check(p.quizTest===type&&p.quizIndex===word,'Wrong test order: '+JSON.stringify([p.quizTest,p.quizIndex,type,word]));
    if(type===0||type===1||type===3)await page.locator('[data-choice="'+word+'"]').click();
    else if(type===2){
      await page.locator('[data-letter="0"]').click();
      await page.locator('[data-letter="1"]').click();
      await page.locator('[data-letter-check]').click();
    }else await page.locator('[data-self-quiz]').click();
    correct++;
    check(await page.locator('#next').isEnabled(),'Test '+correct+' not credited');
    await page.locator('#next').click();
  }
  for(let word=0;word<6;word++)await answer(word,0);
  await page.locator('[data-quiz-extended]').click();
  for(let word=0;word<6;word++)for(let type=1;type<5;type++)await answer(word,type);
  check((await progress()).quiz.flat().filter(Boolean).length===30,'Not all 30 questions completed');
  await page.locator('#next').click();
  for(let i=0;i<6;i++)await page.locator('[data-day="'+i+'"]').click();
  await page.locator('[data-day-check]').click();
  check(await page.locator('#next').isEnabled(),'Story assembly did not complete');
  await page.locator('#next').click();
  for(let i=0;i<3;i++)await page.locator('[data-chat="0"]').click();
  check(await page.locator('select[data-personal]').count()===5,'Own story needs 5 fields');
  await page.locator('select[data-personal="name"]').selectOption('安东');
  check((await page.locator('.about-my-lines').innerText()).includes('我叫安东。'),'Personal name selection not applied');
  await page.locator('select[data-personal="origin"]').selectOption('__custom__');
  await page.locator('[data-story-key="origin"][data-personal-custom="zh"]').fill('荷兰');
  await page.locator('[data-story-key="origin"][data-personal-custom="zh"]').press('Tab');
  await page.locator('[data-story-key="origin"][data-personal-custom="py"]').fill('Hélán');
  await page.locator('[data-story-key="origin"][data-personal-custom="py"]').press('Tab');
  check((await page.locator('.about-my-lines').innerText()).includes('我来自荷兰。'),'Custom origin not applied');
  check(await page.locator('.panda-ai-shortcut[href*="panda-voice-pilot"]').count()===1,
    'Missing real Panda AI shortcut');
  await page.locator('#next').click();
  check((await page.locator('.results').innerText()).includes('30 / 30'),'Final result must show 30 / 30');
  await page.reload();
  check((await page.evaluate(()=>window.PandaGoHSK2Preview.getProgress())).quiz.flat().filter(Boolean).length===30,
    'Progress did not survive browser reload');
  for(const width of [360,393,412]){
    await page.setViewportSize({width,height:width===360?800:width===393?873:915});
    for(const [step,name] of [[2,'words'],[4,'grammar'],[6,'tones'],[7,'dialogue']]){
      await page.goto(root+'?step='+step,{waitUntil:'load'});
      await page.locator('.pg433-content').waitFor();
      await page.waitForTimeout(160);
      if(name==='dialogue') await page.locator('.dialogue').scrollIntoViewIfNeeded();
      const dims=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,
        bottom:document.querySelector('.pg433-footer').getBoundingClientRect().bottom,
        viewport:innerHeight}));
      check(dims.scroll<=dims.width+1,'Horizontal scroll at '+width+'px '+name+': '+JSON.stringify(dims));
      check(dims.bottom<=dims.viewport+2,'Footer outside screen at '+width+'px '+name);
      await page.screenshot({path:output+'/'+name+'-'+width+'.png',animations:'disabled'});
    }
  }
  check(errors.length===0,'Page JavaScript errors: '+errors.join('; '));
  // Capture the unchanged approved reference at identical width and four corresponding lesson steps.
  // The reference is given its own isolated localStorage fixture; user-facing progress is untouched.
  const refProgress={
    step:2, quiz:Array.from({length:5},()=>Array.from({length:6},()=>({correctFirst:true,method:'choice'}))),
    missed:Array.from({length:5},()=>Array(6).fill(false)), grammar:[0,1,2,3,4],grammarDone:true,
    dayOrder:[0,1,2,3,4,5],dayShuffled:[0,1,2,3,4,5],dayDone:true,
    mic:[0,1,2,3,4,5],heardWords:[0,1,2,3,4,5],chat:[],unlockedSection:4,courseQuizCursor:null
  };
  await page.evaluate(value=>localStorage.setItem('panda-go-hsk2-lesson1-word-flow-review-v1',JSON.stringify(value)),refProgress);
  await page.setViewportSize({width:393,height:873});
  for(const [step,name] of [[2,'words'],[4,'grammar'],[6,'tones'],[7,'dialogue']]){
    await page.goto('http://127.0.0.1:'+port+'/hsk2-lesson1.html?step='+step,{waitUntil:'load'});
    await page.locator('.pg433-content').waitFor();
    if(name==='dialogue') await page.locator('.dialogue').scrollIntoViewIfNeeded();
    await page.screenshot({path:output+'/reference-'+name+'-393.png',animations:'disabled'});
  }
  console.log('PASS: 30/30 tasks, 5 tabs, 8 steps, story, persistence, SVGs, tones, mobile 360/393/412');
} finally {
  await browser?.close();
  server.kill();
}
