import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const BASE=process.env.QA_BASE||'http://127.0.0.1:4173';
const OUT='qa/v118';
const SIZES=[[360,800],[390,844],[412,915]];
fs.mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const results=[];
async function screenshot(page,name,size){
 const info=await page.evaluate(()=>({
  viewport:innerWidth,screenWidth:screen.width,outerWidth:outerWidth,scrollWidth:document.documentElement.scrollWidth,
  scrollHeight:document.documentElement.scrollHeight,title:document.title,
  viewportMeta:document.querySelector('meta[name="viewport"]')?.content,
  hubDebug:(()=>{const x=document.querySelector('.approved-art-image');if(!x)return null;const p=x.parentElement, root=document.querySelector('#topics');return {style:getComputedStyle(x).width, cssMax:getComputedStyle(x).maxWidth, imageAttr:x.getAttribute('width'), parentStyle:getComputedStyle(p).width, parentClient:p.clientWidth, rootStyle:getComputedStyle(root).width, bodyMargin:getComputedStyle(document.body).margin, documentClient:document.documentElement.clientWidth};})(),
  stylesheets:[...document.styleSheets].map(x=>x.href?.split('/').slice(-1)[0]||'inline').slice(0,20),
  rightmost:[...document.body.querySelectorAll('*')].map(e=>({tag:e.tagName,cl:e.className?.baseVal||e.className||'',id:e.id,right:Math.round(e.getBoundingClientRect().right),width:Math.round(e.getBoundingClientRect().width)})).filter(x=>x.right>screen.width+10||x.width>screen.width+10).sort((a,b)=>b.right-a.right).slice(0,12)
 }));
 assert(info.scrollWidth<=size[0]+2,'Horizontal overflow '+name+' '+size+': '+JSON.stringify(info));
 await page.screenshot({path:OUT+'/'+name+'-'+size[0]+'.png',fullPage:true,animations:'disabled'});
 results.push({screen:name,width:size[0],height:size[1],...info});
}
async function appPage(context){
 const p=await context.newPage();
 await p.goto(BASE+'/index.html?v=118',{waitUntil:'domcontentloaded'});
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
  if(width===360){
   const clips=await page.evaluate(async()=>{
    const results=[];
    const audioContext=new (window.AudioContext||window.webkitAudioContext)();
    for(const text of ['我','你','喜欢','明白','中国','你好','面条','谢谢']){
      const src=window.__simpleSectionPreview.getFile(text);
      if(!src)throw Error('No audio for '+text);
      const res=await fetch(src,{cache:'no-store'});
      if(!res.ok)throw Error(text+': MP3 HTTP '+res.status);
      const bytes=await res.arrayBuffer();
      const decoded=await audioContext.decodeAudioData(bytes.slice(0));
      const values=decoded.getChannelData(0);
      const stride=Math.max(1,Math.floor(values.length/12000));
      let sum=0,peak=0,n=0;
      for(let i=0;i<values.length;i+=stride){const v=values[i];sum+=v*v;peak=Math.max(peak,Math.abs(v));n++}
      results.push({word:text,source:src,duration:Math.round(decoded.duration*100)/100,
        rms:Math.sqrt(sum/n),peak,bytes:bytes.byteLength,sampleRate:decoded.sampleRate});
    }
    await audioContext.close();
    return results;
   });
   for(const clip of clips){
    assert(clip.duration>=0.15&&clip.duration<8,'Unusual clip length: '+JSON.stringify(clip));
    assert(clip.rms>0.0005&&clip.peak>0.003,'Missing audible signal: '+JSON.stringify(clip));
   }
   fs.writeFileSync(OUT+'/audio-samples.json',JSON.stringify({note:'Objective MP3 decode and signal only; not a human review of accent, noise or commercial rights',clips},null,2)+'\n');
  }
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
  await game.waitForLoadState('load');
  await game.locator('.approved-art-image').evaluate(img=>img.decode());
  await game.waitForFunction(()=>getComputedStyle(document.body).marginLeft==='0px');
  assert.equal(await game.locator('#daily-study-progress').count(),0);
  const hero=await game.locator('.approved-art-image').boundingBox();
  assert(hero.height>=height-8,'Approved game screen must fill the viewport, no lower empty strip: '+JSON.stringify(hero));
  await screenshot(game,'02-game-hub',size);
  await game.close();

  // Images 3–4: cleaner category overview, SVG illustrations.
  await page.evaluate(()=>window.openLearningTopics('words'));
  await page.locator('#topics .clean-category-list').waitFor();
  assert.equal(await page.locator('.clean-icon-art').count(),13);
  assert.equal(await page.locator('[data-clean-category]:visible').count(),8,'First screen must show exactly eight categories');
  assert.equal(await page.locator('.clean-word-summary').count(),0);
  assert(await page.locator('#topics').evaluate(el=>getComputedStyle(el).backgroundImage.includes('approved-quiz-scene')),'Vocabulary should retain the approved scenic background');
  await screenshot(page,'03-word-categories',size);
  await page.locator('[data-clean-more]').click();
  assert.equal(await page.locator('[data-clean-category]:visible').count(),13,'Expanding must reveal all vocabulary topics');
  await page.locator('[data-clean-category="g01"]').click();
  assert((await page.locator('.clean-word-card').count())>=10);
  await screenshot(page,'04-word-detail',size);

  // Image 5: choose translation.
  await page.evaluate(()=>window.openPracticeChoices());
  await page.locator('[data-practice-mode="translation"]').click();
  await page.locator('[data-choice-ru]').first().waitFor();
  assert.equal(await page.locator('[data-choice-ru]').count(),4);
  assert.equal(await page.locator('.clean-choice-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),2,'Translation choices must be a two-column grid');
  assert(await page.locator('#topics').evaluate(el=>getComputedStyle(el).backgroundImage.includes('approved-quiz-scene')),'Translation should retain the approved scenic background');
  await screenshot(page,'05-translation',size);

  // Image 6: listen and choose.
  await page.evaluate(()=>window.openPracticeChoices());
  await page.locator('[data-practice-mode="listening"]').click();
  await page.locator('[data-practice-listen]').waitFor();
  assert.equal(await page.locator('[data-choice-ru]').count(),4);
  assert.equal(await page.locator('.clean-choice-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),2,'Listening choices must be a two-column grid');
  await screenshot(page,'06-listening',size);

  // Image 7: the writing canvas remains live, not a screenshot.
  const hanzi=await context.newPage();
  await hanzi.goto(BASE+'/hanzi-lab.html?v=117',{waitUntil:'domcontentloaded'});
  await hanzi.locator('#character').waitFor();
  await hanzi.locator('#writer svg').waitFor({timeout:12000});
  assert.equal(await hanzi.locator('#practice').count(),1);
  assert.equal(await hanzi.locator('#animate').count(),1);
  assert(await hanzi.locator('body').evaluate(el=>getComputedStyle(el).backgroundImage.includes('approved-quiz-scene')),'Hanzi writing should show the approved scenic background');
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
 fs.writeFileSync(OUT+'/results.json',JSON.stringify({version:118,at:new Date().toISOString(),results},null,2)+'\n');
 console.log('PASS v118 real-browser responsive screens: '+results.length+' screenshots and controls.');
}finally{await browser.close()}
