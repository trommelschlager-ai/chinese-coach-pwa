import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const BASE=process.env.QA_BASE||'http://127.0.0.1:4173';
const OUT='qa/v117';
const SIZES=[[360,800],[390,844],[412,915]];
fs.mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const results=[];
async function screenshot(page,name,size){
 const info=await page.evaluate(()=>({
  viewport:innerWidth,screenWidth:screen.width,outerWidth:outerWidth,scrollWidth:document.documentElement.scrollWidth,
  scrollHeight:document.documentElement.scrollHeight,title:document.title,
  viewportMeta:document.querySelector('meta[name="viewport"]')?.content,
  stylesheets:[...document.styleSheets].map(x=>x.href?.split('/').slice(-1)[0]||'inline').slice(0,20),
  rightmost:[...document.body.querySelectorAll('*')].map(e=>({tag:e.tagName,cl:e.className?.baseVal||e.className||'',id:e.id,right:Math.round(e.getBoundingClientRect().right),width:Math.round(e.getBoundingClientRect().width)})).filter(x=>x.right>screen.width+10||x.width>screen.width+10).sort((a,b)=>b.right-a.right).slice(0,12)
 }));
 assert(info.scrollWidth<=size[0]+2,'Horizontal overflow '+name+' '+size+': '+JSON.stringify(info));
 await page.screenshot({path:OUT+'/'+name+'-'+size[0]+'.png',fullPage:true,animations:'disabled'});
 results.push({screen:name,width:size[0],height:size[1],...info});
}
async function appPage(context){
 const p=await context.newPage();
 await p.goto(BASE+'/index.html?v=117',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>typeof window.openLearningTopics==='function'&&typeof window.openPracticeChoices==='function');
 return p;
}
try{
 for(const size of SIZES){
  const [width,height]=size;
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  // Image 1: Chinese character and pinyin must be vertically adjacent.
  const page=await appPage(context);
  await page.evaluate(()=>window.go('quiz'));
  await page.locator('#quiz.page.active #quizhanzi').waitFor();
  const visualOrder=await page.evaluate(()=>{
   const ids=['quizhanzi','quizpinyin','quizplay'];
   return ids.map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,top:r.top,bottom:r.bottom}});
  });
  assert(visualOrder[1].top>=visualOrder[0].bottom-3,'Pinyin must sit below the Chinese word');
  assert(visualOrder[2].top>=visualOrder[1].bottom-3,'Audio must follow pinyin');
  assert.equal(await page.locator('#quiz .quiz-word-card h3').count(),0);
  await screenshot(page,'01-word-check',size);
  const qToggle=page.locator('#quiz-pinyin-toggle');await qToggle.click();
  assert.equal(await page.locator('#quizpinyin').isVisible(),false);
  await qToggle.click();assert.equal(await page.locator('#quizpinyin').isVisible(),true);

  // Image 2: game hub without any global step-by-step banner.
  const game=await context.newPage();await game.goto(BASE+'/game.html?v=117',{waitUntil:'domcontentloaded'});
  await game.locator('[data-game-mode="build"]').waitFor();
  assert.equal(await game.locator('#daily-study-progress').count(),0);
  await screenshot(game,'02-game-hub',size);
  await game.close();

  // Images 3–4: cleaner category overview, SVG illustrations.
  await page.evaluate(()=>window.openLearningTopics('words'));
  await page.locator('#topics .clean-category-list').waitFor();
  assert.equal(await page.locator('.clean-icon-art').count(),13);
  assert.equal(await page.locator('.clean-word-summary').count(),0);
  await screenshot(page,'03-word-categories',size);

  // Image 5: choose translation.
  await page.evaluate(()=>window.openPracticeChoices());
  await page.locator('[data-practice-mode="translation"]').click();
  await page.locator('[data-choice-ru]').first().waitFor();
  assert.equal(await page.locator('[data-choice-ru]').count(),4);
  await screenshot(page,'05-translation',size);

  // Image 6: listen and choose.
  await page.evaluate(()=>window.openPracticeChoices());
  await page.locator('[data-practice-mode="listening"]').click();
  await page.locator('[data-practice-listen]').waitFor();
  assert.equal(await page.locator('[data-choice-ru]').count(),4);
  await screenshot(page,'06-listening',size);

  // Image 7: the writing canvas remains live, not a screenshot.
  const hanzi=await context.newPage();
  await hanzi.goto(BASE+'/hanzi-lab.html?v=117',{waitUntil:'domcontentloaded'});
  await hanzi.locator('#character').waitFor();
  await hanzi.locator('#writer svg').waitFor({timeout:12000});
  assert.equal(await hanzi.locator('#practice').count(),1);
  assert.equal(await hanzi.locator('#animate').count(),1);
  await screenshot(hanzi,'07-hanzi',size);
  await hanzi.close();

  // Image 8: dialogue controls and pinyin visibility for all cards.
  await page.evaluate(()=>window.openLearningTopics('dialogues'));
  await page.locator('[data-dialog-lesson="2"]').click();
  const control=page.locator('[data-dialogue-pinyin]');
  assert.equal(await control.getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.ch110-line').count(),2);
  await screenshot(page,'08-dialogue',size);
  await control.click();
  assert.equal(await control.getAttribute('aria-pressed'),'false');
  assert(await page.locator('.ch110-dialogue').evaluate(e=>e.classList.contains('ch110-pinyin-off')));
  await page.locator('[data-110-next]').click();
  assert.equal(await page.locator('[data-dialogue-pinyin]').getAttribute('aria-pressed'),'false');
  await page.close();
  assert.deepEqual(errors,[],'Browser errors at '+width+': '+errors.join('; '));
  await context.close();
 }
 fs.writeFileSync(OUT+'/results.json',JSON.stringify({version:117,at:new Date().toISOString(),results},null,2)+'\n');
 console.log('PASS v117 real-browser responsive screens: '+results.length+' screenshots and controls.');
}finally{await browser.close()}
