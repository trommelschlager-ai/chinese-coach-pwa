/* Real browser acceptance coverage for the v130 presentation, run by GitHub Actions. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const BASE=process.env.QA_BASE||'http://127.0.0.1:4173';
const OUT='qa/v130/browser';
const sizes=[[360,640],[390,720],[412,915]];
fs.mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let activePage;
const report={version:130,at:new Date().toISOString(),captures:[],checks:[],errors:[],layoutFailures:[]};
async function ready(page){await page.locator('#pg130:not([hidden])').waitFor();await page.locator('#pg130 img').evaluateAll(images=>Promise.all(images.map(img=>img.decode().catch(()=>{}))));}
async function capture(page,name,size,hanzi=false){
 const screen=page.locator(hanzi?'#pg-hanzi-approved':'#pg130 .pg-screen');
 await screen.waitFor();
 const metrics=await screen.evaluate(el=>{
  const r=el.getBoundingClientRect();return {width:r.width,height:r.height,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,font:getComputedStyle(el).fontFamily,
   missingImages:[...el.querySelectorAll('img')].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src),
   heading:el.querySelector('h1')?.textContent,
   actions:[...el.querySelectorAll('button,a')].filter(x=>x.getBoundingClientRect().width&&x.getBoundingClientRect().height).map(x=>{const b=x.getBoundingClientRect();return {text:x.getAttribute('aria-label')||x.textContent.trim(),left:b.left-r.left,right:b.right-r.left,top:b.top-r.top,bottom:b.bottom-r.top}})};
 });
 if(metrics.scrollWidth>metrics.clientWidth+2)report.layoutFailures.push({name,size,kind:'horizontal overflow',metrics});
 if(metrics.missingImages.length)report.layoutFailures.push({name,size,kind:'missing images',metrics});
 if(!hanzi&&metrics.scrollHeight>metrics.clientHeight+2)report.layoutFailures.push({name,size,kind:'vertical overflow',metrics});
 const box=await screen.boundingBox();
 await page.screenshot({path:`${OUT}/${name}-${size[0]}.png`,clip:box,animations:'disabled'});
 report.captures.push({name,viewport:size,density:1,...metrics});
}
async function button(page,selector){const b=page.locator('#pg130 '+selector);await b.click();await ready(page)}
async function rootBack(page){await button(page,'.pg-back')}
try{
 for(const size of sizes){
  const [width,height]=size;
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  context.on('page',p=>p.on('pageerror',e=>report.errors.push({width,message:e.message})));
  const page=await context.newPage();activePage=page;
  page.on('console',message=>{if(message.type()==='error')report.errors.push({width,message:message.text()})});
  await page.goto(BASE+'/index.html',{waitUntil:'load'});
  // Panda Go v145 mounts the modern shell directly; legacy Start is covered.
  await ready(page);
  await capture(page,'01-home',size);
  // HSK 1: seven-step navigation with actual tone, dialogue and assembly checks.
  const guided=await context.newPage();
  await guided.goto(BASE+'/hsk1-map.html',{waitUntil:'load'});
  assert.equal(await guided.locator('.map-road .node').count(),7,'Seven lesson stops');
  assert.equal(await guided.locator('.map-road a.node').count(),4,'Four available lessons');
  await guided.screenshot({path:`${OUT}/01a-hsk-map-${width}.png`,fullPage:true,animations:'disabled'});
  await guided.locator('.map-road a.node[data-num="1"]').click();
  assert.equal(await guided.locator('#lesson-step-list .lesson-step-row').count(),7,'Seven steps visible');
  assert.equal(await guided.locator('#content .word').count(),3,'Three original word cards');
  await guided.screenshot({path:`${OUT}/01b-hsk-words-${width}.png`,fullPage:true,animations:'disabled'});
  await guided.locator('#next').click(); // tones
  assert((await guided.locator('#content').textContent()).includes('Третий тон'),'Tone exercise works');
  await guided.locator('#next').click(); // examples
  await guided.locator('#next').click(); // dialogue
  assert.equal(await guided.locator('#content [data-line]').count(),3,'Three visible dialogue turns');
  assert.equal(await guided.locator('#content .lesson-dialogue-play').count(),1,'Illustrated player exists');
  await guided.screenshot({path:`${OUT}/01c-hsk-dialogue-${width}.png`,fullPage:true,animations:'disabled'});
  await guided.locator('#next').click(); // assembly
  assert(await guided.locator('#next').isDisabled(),'Assembly step cannot be skipped');
  for (const i of [0,1,2]) await guided.locator('#content [data-piece="'+i+'"]').click();
  await guided.locator('#content [data-check-build]').click();
  assert(await guided.locator('#next').isEnabled(),'Correct order unlocks continuation');
  await guided.locator('#next').click(); // speak
  await guided.locator('#next').click(); // review
  await guided.locator('#next').click(); // completion
  assert((await guided.evaluate(()=>JSON.parse(localStorage.getItem('pg-hsk1-completed-v1')))).includes(1),'Legacy completion retained');
  assert.equal(await guided.evaluate(()=>localStorage.getItem('pg-hsk1-v2-lesson-1')),'7','Seven-step progress saved');
  await guided.goto(BASE+'/hsk1-map.html',{waitUntil:'load'});
  assert((await guided.locator('[data-status="1"]').textContent()).includes('Пройден'),'Map shows completion');
  report.checks.push({width,check:'seven HSK steps, tones, dialogue, assembly and progress',passed:true});
  await guided.close();
  // HSK 1 opens the guided map; advanced levels are visible but not fake-playable.
  assert.equal(await page.locator('#pg130 .pg-hsk-level').count(),6);
  assert.equal(await page.locator('#pg130 .pg-hsk-level[href="./hsk1-map.html"]').count(),1);
  assert.equal(await page.locator('#pg130 .pg-hsk-unavailable').count(),5);
  assert.equal(await page.locator('#pg130 .pg-hsk-backdrop img').count(),1);
  await page.evaluate(()=>window.__panda130.show('learn'));await ready(page);
  await capture(page,'02-learn',size);
  assert.equal(await page.locator('#pg130 [data-action=learn-go]').count(),1,'Learn Next Go is present');
  await button(page,'[data-route=tones]');await capture(page,'09-tones',size);
  await button(page,'[data-action=tone][data-value="1"]');
  assert.equal(await page.locator('#pg130 .pg-tone[aria-pressed=true] strong').textContent(),'má');
  const audio=await page.evaluate(()=>new Promise(resolve=>{const audios=performance.getEntriesByType('resource').filter(x=>x.name.includes('.mp3'));resolve(audios.map(x=>x.name))}));
  report.checks.push({width,check:'tone recording requests',resources:audio});
  await rootBack(page);await button(page,'[data-route=words]');await capture(page,'10-words',size);
  await button(page,'[data-action=known]');
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('chinese-coach-basic-known-v1'))),['我']);
  assert.equal(await page.locator('#pg130 .pg-pagination').count(),0,'No obsolete word pagination');
  assert.equal(await page.locator('#pg130 .pg-word-footer [data-route=word-topics]').count(),0,'Old All Topics footer removed');
  assert.equal(await page.locator('#pg130 .pg-heading.compact>.pg-icon').count(),0,'No four-diamond logo');
  assert.equal(await page.locator('#pg130 .pg-pinyin-toggle').count(),1,'Pink Pinyin toggle present');
  assert.equal(await page.locator('#pg130 .pg-approved-go').count(),1,'Next Go button present');
  await button(page,'[data-action=pinyin]');assert.equal(await page.locator('#pg130 .pg-pinyin').count(),0);
  await page.reload({waitUntil:'load'});await ready(page);assert.equal(await page.locator('#pg130 .pg-pinyin').count(),0,'Pinyin persists through reload');
  await button(page,'[data-action=pinyin]');
  await button(page,'[data-action=word-go]');assert.equal(await page.locator('#pg130 .pg-hanzi').textContent(),'你');
  await button(page,'[data-action=word-filter][data-value="g07"]');
  assert.equal(await page.locator('#pg130 .pg-hanzi').textContent(),'妈妈');
  assert.equal(await page.locator('#pg130 .pg-example').count(),3,'Mother has three actual examples');
  await capture(page,'10a-mother-examples',size);
  await button(page,'[data-action=word-go]');
  assert.equal(await page.locator('#pg130 .pg-hanzi').textContent(),'爸爸');
  assert.equal(await page.locator('#pg130 .pg-example').count(),3,'Father has three actual examples');
  assert((await page.locator('#pg130 .pg-portrait').getAttribute('src')).includes('meaning-man.webp'));
  await capture(page,'10b-father-examples',size);
  await button(page,'[data-action=word-filter][data-value="all"]');
  for(let n=0;n<7;n++)await button(page,'[data-action=word-go]');
  assert.equal(await page.locator('#pg130 .pg-hanzi').textContent(),'你们');
  assert.equal(await page.locator('#pg130 .pg-example').count(),3,'Plural you has three actual examples');
  await capture(page,'10c-plural-you-examples',size);
  await rootBack(page);await button(page,'[data-route=dialogues]');await capture(page,'12-dialogues',size);
  assert.equal(await page.locator('#pg130 [data-action=dialog-go]').count(),1,'Dialogues have Next Go');
  assert.equal(await page.locator('#pg130 [data-dialog-line]').count(),6,'Full first dialogue remains visible');
  await button(page,'[data-action=dialog-tab][data-value="1"]');
  assert.equal(await page.locator('#pg130 [data-dialog-line]').count(),5,'Second dialogue has all five lines');
  assert((await page.locator('#pg130 .pg-bubble strong').first().textContent()).includes('哪国人'));
  await page.goBack();await ready(page);assert.equal(await page.locator('#pg130 h1').textContent(),'Учиться','Browser Back restores study menu');
  await page.locator('#pg130 [data-route=hanzi]').click();
  await page.locator('#writer svg').waitFor();
  await page.waitForFunction(()=>document.querySelector('#feedback')?.textContent.includes('Теперь твоя очередь'),null,{timeout:20000});
  await capture(page,'11-hanzi',size,true);
  assert((await page.locator('#writer svg path').count())>0,'Live stroke paths');
  const approved=await page.locator('#pg-hanzi-approved').boundingBox();
  assert(Math.abs(approved.width-width)<2,'Exact approved Hanzi artwork fills the phone width');
  assert(await page.locator('#pg-hanzi-approved [data-art-hit=next]').isVisible(),'Approved Go еще action is accessible');
  await page.locator('[data-art-hit=next]').click();await page.waitForFunction(()=>document.querySelector('#character').textContent==='人');
  await page.locator('[data-art-hit=back]').click();await ready(page);
  // Return from the approved Hanzi scene to Learn, then open Training via the route API.
  // The raster home has no old menu card linking directly to Training.
  await page.evaluate(()=>window.__panda130.show('training'));await ready(page);
  await capture(page,'03-training',size);
  await button(page,'[data-route=practice]');await capture(page,'04-practice',size);
  await button(page,'[data-action=answer][data-value="0"]');await button(page,'[data-action=question-check]');
  assert((await page.locator('#pg130 .pg-feedback').textContent()).includes('Верно'));
  await button(page,'[data-action=question-next]');assert.equal(await page.locator('#pg130 [role=progressbar]').getAttribute('aria-valuenow'),'1');
  await rootBack(page);await button(page,'[data-route=quiz]');await capture(page,'05-quiz',size);
  await button(page,'[data-action=answer][data-value="1"]');await button(page,'[data-action=question-check]');
  assert.equal(await page.locator('#pg130 [data-action=answer]:disabled').count(),4);
  await rootBack(page);await button(page,'[data-route=games]');await capture(page,'06-games',size);
  await button(page,'[data-route=build]');await capture(page,'07-build-initial',size);
  for(const id of [0,1,2])await button(page,`[data-action=token-add][data-value="${id}"]`);
  await capture(page,'07-build',size);
  assert.equal(await page.locator('#pg130 .pg-token-pool button').count(),2,'Two distractors remain; selected tokens leave no empty placeholders');
  await button(page,'[data-action=token-return][data-value="2"]');assert(await page.locator('#pg130 [data-action=game-check]').isDisabled());
  await button(page,'[data-action=token-add][data-value="2"]');
  for(let index=0;index<5;index++){
   if(index>0){const needed=Number(await page.locator('#pg130 .pg-answer-box').getAttribute('data-required'));const ids=await page.locator('#pg130 [data-action=token-add]').evaluateAll((bs,n)=>bs.map(b=>Number(b.dataset.value)).filter(id=>id<n).sort((a,b)=>a-b),needed);for(const id of ids)await button(page,`[data-action=token-add][data-value="${id}"]`)}
   const nextControl=await page.locator('#pg130 [data-action=game-check]').boundingBox();assert(nextControl.y+nextControl.height<=height+1,'Phrase check action must remain visible');
   await button(page,'[data-action=game-check]');assert((await page.locator('#pg130 .pg-feedback').textContent()).includes('Верно'));
   assert(await page.locator('#pg130 [data-action=game-reset]').isDisabled());await button(page,'[data-action=game-next]');
  }
  await capture(page,'08-result',size);
  assert((await page.locator('#pg130').textContent()).includes('5 из 5'));
  assert.equal(await page.evaluate(()=>window.courseProgress.readGame().points),10);
  await page.reload({waitUntil:'load'});await ready(page);assert.equal(await page.evaluate(()=>window.courseProgress.readGame().points),10,'Result reload must not grant rewards twice');
  await page.goto(BASE+'/game.html',{waitUntil:'load'});await ready(page);assert.equal(await page.locator('#pg130 h1').textContent(),'Игровая практика','Saved game links open the new UI');
  await rootBack(page);await page.reload({waitUntil:'load'});await ready(page);assert.equal(await page.locator('#pg130 h1').textContent(),'Тренироваться','Hash route takes precedence after redirect/reload');
  report.checks.push({width,check:'navigation, persistence, answer verification, Hanzi, tokens, scoring, direct game links',passed:true});
  await context.close();
 }
 assert.deepEqual(report.errors,[],'Browser runtime/console errors');
 assert.deepEqual(report.layoutFailures,[],'Every approved screen must fit its mobile viewport');
 report.result='passed';
 console.log(`PASS v130: ${report.captures.length} captures across ${sizes.length} mobile sizes, real UI flows, persistence and scoring.`);
}catch(error){report.result='failed';report.failure=String(error.stack||error);if(activePage&&!activePage.isClosed()){report.failureUrl=activePage.url();report.failureDOM=await activePage.locator('body').innerText().catch(()=>'?');await activePage.screenshot({path:OUT+'/failure.png',fullPage:true}).catch(()=>{})}throw error}
finally{fs.writeFileSync(OUT+'/results.json',JSON.stringify(report,null,2)+'\n');await browser.close()}
