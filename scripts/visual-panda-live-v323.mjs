// Panda Go v323: real Chromium smoke for the screenshots that failed in production.
// This does not download or require the experimental local AI from draft PR #81.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
const out='qa/panda-live-v323';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const summary={screens:[],results:[],errors:[]};
try {
 for(const [width,height] of [[360,640],[390,720],[412,915]]){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await ctx.newPage();
  page.on('pageerror',error=>summary.errors.push({width,message:error.message}));
  let res=await page.goto(base+'/index.html',{waitUntil:'load'});
  assert.equal(res?.status(),200);
  await page.locator('#pg130:not([hidden])').waitFor();
  assert.equal(await page.locator('#pg130 .pg-hsk-level').count(),2,'Approved home has HSK 1 and HSK 2');
  res=await page.goto(base+'/hsk1-map.html',{waitUntil:'load'});
  assert.equal(res?.status(),200);
  assert.equal(await page.locator('.map-road a.node').count(),7,'All seven lesson entries remain visible');
  res=await page.goto(base+'/panda-voice-pilot.html?lesson=1',{waitUntil:'load'});
  assert.equal(res?.status(),200);
  await page.waitForFunction(()=>document.documentElement.dataset.pandaLiveReady==='true');
  assert.match(await page.locator('footer .release').textContent(),/v326/);
  await page.locator('#mode-nonstop').click();
  assert.equal(await page.locator('#mode-nonstop').getAttribute('aria-pressed'),'true');
  // The compact guide opens without changing the original page height.
  await page.locator('#ask-panda-open').click();
  assert(await page.locator('#ask-panda-dialog').isVisible());
  assert.equal(await page.locator('#ask-panda-topics .ask-panda-topic').count(),1,'Only lesson 1 is available to a fresh learner');
  const hello=page.locator('#ask-panda-topics .ask-panda-question').filter({hasText:'你好吗？'}).first();
  assert(await hello.isVisible(),'Verified beginner question should be suggested');
  assert.match(await hello.textContent(),/Nǐ hǎo ma/);
  await hello.click();
  assert(!(await page.locator('#ask-panda-dialog').isVisible()));
  assert.equal(await page.locator('#message').inputValue(),'你好吗？');
  assert.equal(await page.locator('#mode-nonstop').getAttribute('aria-pressed'),'true');
  const entry=page.locator('#message');
  await entry.fill('你姐姐怎么样？');
  await page.locator('#send').click();
  await page.waitForFunction(()=>document.querySelector('#phrase')?.textContent==='我没有姐姐。');
  assert.equal(await page.locator('#pinyin').textContent(),'Wǒ méiyǒu jiějie.');
  assert.match(await page.locator('#recent').textContent(),/Как поживает твоя старшая сестра/);
  summary.results.push({width,case:'你姐姐怎么样',response:await page.locator('#phrase').textContent()});
  await page.screenshot({path:out+'/family-'+width+'.png',animations:'disabled'});
  await entry.fill('今天今天怎么样');
  await page.locator('#send').click();
  await page.waitForFunction(()=>!document.querySelector('#learner-feedback')?.hidden);
  assert.match(await page.locator('#learner-feedback').textContent(),/你今天怎么样/);
  assert.match(await page.locator('#status').textContent(),/повторено/);
  summary.results.push({width,case:'duplicate-jintian',feedback:await page.locator('#learner-feedback').textContent()});
  await page.screenshot({path:out+'/correction-'+width+'.png',animations:'disabled'});
  // Completing all seven lessons should show all topics, including the recent
  // family-wellbeing regression. Choosing an item fills chat but doesn't auto-send.
  await page.evaluate(()=>localStorage.setItem('pg-hsk1-v3-complete',JSON.stringify(['foundations','pronouns','numbers','weekdays','dates','family','weather'])));
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>document.documentElement.dataset.pandaLiveReady==='true');
  await page.locator('#ask-panda-open').click();
  assert.equal(await page.locator('#ask-panda-topics .ask-panda-topic').count(),7,'All completed lessons must appear');
  const familyTopic=page.locator('#ask-panda-topics .ask-panda-topic').nth(5);
  await familyTopic.locator('summary').click();
  const sister=familyTopic.locator('.ask-panda-question').filter({hasText:'你姐姐怎么样？'});
  assert.equal(await sister.count(),1);
  assert.match(await sister.textContent(),/Nǐ jiějie zěnmeyàng/);
  await sister.click();
  assert.equal(await page.locator('#message').inputValue(),'你姐姐怎么样？');
  assert.equal(await page.locator('#mode-nonstop').getAttribute('aria-pressed'),'true');
  await page.screenshot({path:out+'/ask-guide-'+width+'.png',animations:'disabled'});
  const nav=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  assert(nav.scroll<=nav.viewport+2,'Panda AI page must not scroll horizontally');
  summary.screens.push({width,height,nav});
  await ctx.close();
 }
 assert.deepEqual(summary.errors,[],'Browser runtime errors in Panda AI');
 summary.result='passed';
 console.log('PASS Panda v326: verified lesson question guide, HSK1 progress gating and family dialogue at 360/390/412px.');
} catch(error){summary.result='failed';summary.failure=String(error.stack||error);throw error}
finally{fs.writeFileSync(out+'/report.json',JSON.stringify(summary,null,2));await browser.close()}
