import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const base=process.env.PANDA_TEST_BASE||'http://127.0.0.1:4173';
const dir='qa/hsk2-panda-return-v420';
fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const [mini,width] of [360,393,412].entries()){
  const context=await browser.newContext({viewport:{width,height:852},isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const completion='/hsk2-life-course.html?from=hsk2-life-course&return=done&mini='+mini;
  await page.goto(base+completion);
  const done=page.locator('.pg433-done');
  const chapter=await done.locator('.pg433-pill').innerText();
  assert.match(chapter,new RegExp('Мини-урок '+(mini+1)));
  await done.locator('.pg433-ai-link').click();
  await page.waitForURL(/panda-voice-pilot\.html/);
  assert.equal(new URL(page.url()).searchParams.get('mini'),String(mini));
  const chat=page.locator('#pg346');
  await page.waitForFunction(()=>document.querySelector("#pg346")?.dataset.paLayout==="v547");
  const send=chat.locator('#pg346-send');
  const input=chat.locator('#pg346-input');
  assert.equal(await chat.locator('.pg346-composer input').count(),1);
  assert.equal(await send.locator('svg').count(),1);
  await send.click();
  await input.fill('我每天七点起床。');
  await send.click();
  await page.waitForFunction(()=>document.querySelector('#pg346-input').value==='');
  await chat.locator('#pg346-rows .pg346-zh').filter({hasText:'我每天七点起床'}).first().waitFor({state:'attached'});
  if(mini===0){
   await chat.locator('.pg346-main-zh').filter({hasText:'你起床以后做什么？'}).waitFor({state:'attached'});
  }
  await page.screenshot({path:dir+'/'+width+'-panda.png'});
  await chat.locator('a.pg346-back').click();
  await page.waitForURL(url=>url.pathname.endsWith('/hsk2-life-course.html')&&url.searchParams.get('mini')===String(mini));
  assert.equal(await done.locator('.pg433-pill').innerText(),chapter);
  assert.equal(await page.locator('.pg433-map').count(),0);
  await page.screenshot({path:dir+'/'+width+'-returned.png'});
  assert.deepEqual(errors,[]);
  await context.close();
 }
 const standard=await browser.newPage();
 await standard.goto(base+'/panda-voice-pilot.html?lesson=1');
 await standard.locator('a.pg346-back').waitFor();
 assert.match(await standard.locator('a.pg346-back').getAttribute('href'),/panda-lesson1\.html/);
}finally{await browser.close()}
console.log('PASS HSK2 Panda AI composer, all three exact mini-lesson returns and HSK1 back link');
