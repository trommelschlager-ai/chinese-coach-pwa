/* v322 mobile route smoke: validates the seven CURRENT HSK1 pages, not retired v152 flows.
 * This script deliberately does not modify lessons, artwork, student progress or voices.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const base=process.env.QA_BASE||'http://127.0.0.1:4173';
const out='qa/hsk1-v152';
const sizes=[[360,640],[390,720],[412,915]];
const expected={
 1:'./hsk1-first-v189.html',
 2:'./hsk1-second-v203.html',
 3:'./hsk1-third-v212.html',
 4:'./hsk1-fourth-v214.html',
 5:'./hsk1-fifth-v227.html',
 6:'./hsk1-lesson.html?lesson=6',
 7:'./hsk1-lesson.html?lesson=7'
};
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report={version:322,screenshots:[],errors:[],checks:[],layoutWarnings:[]};
try{
 for(const [width,height] of sizes){
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await ctx.newPage();
  page.on('pageerror',e=>report.errors.push({width,page:new URL(page.url()).pathname,error:e.message}));
  const map=await page.goto(base+'/hsk1-map.html',{waitUntil:'load'});
  assert.equal(map?.status(),200,'HSK1 map must load');
  const nodes=page.locator('.map-road a.node');
  assert.equal(await nodes.count(),7,'Exactly seven selectable lesson routes');
  const routes=await nodes.evaluateAll(anchors=>anchors.map(a=>({lesson:Number(a.dataset.num),href:new URL(a.href).pathname+new URL(a.href).search,text:a.textContent.trim()})));
  const seen=new Set();
  for(const route of routes){
   assert(Number.isInteger(route.lesson)&&route.lesson>=1&&route.lesson<=7,'Valid lesson number');
   assert(!seen.has(route.lesson),'No duplicate lesson stop');seen.add(route.lesson);
   const target=new URL(expected[route.lesson],base+'/hsk1-map.html');
   assert.equal(route.href,target.pathname+target.search,'Map route '+route.lesson+' must point to current lesson');
  }
  const mapOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert(mapOverflow<=2,'HSK1 map has horizontal page overflow on '+width+'px: '+mapOverflow);
  await page.screenshot({path:out+'/01-map-'+width+'.png',fullPage:true,animations:'disabled'});
  report.screenshots.push({name:'map',width,height,lessonStops:routes.length});
  for(const lesson of [1,2,3,4,5,6,7]){
   const target=new URL(expected[lesson],base+'/hsk1-map.html');
   const response=await page.goto(target.href,{waitUntil:'load'});
   assert.equal(response?.status(),200,'Lesson '+lesson+' must return HTTP 200');
   const diagnostics=await page.evaluate(()=>{
    const root=document.documentElement;
    const title=document.title.trim();
    const bodyText=document.body?.innerText.trim()||'';
    const visibleImages=[...document.images].filter(img=>{const rect=img.getBoundingClientRect();return rect.width>5&&rect.height>5&&rect.bottom>0&&rect.top<innerHeight});
    return {title,bodyLength:bodyText.length,pageWidth:root.scrollWidth,viewportWidth:root.clientWidth,
     brokenImages:visibleImages.filter(img=>img.complete&&img.naturalWidth===0).map(img=>img.src)};
   });
   assert(diagnostics.title.length>0,'Lesson '+lesson+' has a document title');
   assert(diagnostics.bodyLength>35,'Lesson '+lesson+' appears blank');
   assert.equal(diagnostics.brokenImages.length,0,'Lesson '+lesson+' has broken on-screen images');
   const overflow=diagnostics.pageWidth-diagnostics.viewportWidth;
   if(overflow>2)report.layoutWarnings.push({lesson,width,overflow});
   report.checks.push({lesson,width,href:target.pathname+target.search,status:response.status(),...diagnostics});
   await page.screenshot({path:out+'/lesson-'+lesson+'-'+width+'.png',animations:'disabled'});
  }
  const panda=await page.goto(base+'/panda-voice-pilot.html?lesson=1',{waitUntil:'load'});
  assert.equal(panda?.status(),200,'Panda AI page must load');
  await page.waitForFunction(()=>document.documentElement.dataset.pandaLiveReady==='true',{timeout:15000});
  assert(await page.locator('#mode-short').isVisible(),'Original short conversation is preserved');
  assert(await page.locator('#mode-nonstop').isVisible(),'Original nonstop conversation is preserved');
  assert(await page.locator('#mic').isVisible(),'Original microphone is preserved');
  await page.locator('#study-open').click();
  assert.equal(await page.locator('#panda-local-ai-settings').count(),1,'Optional local AI settings exist in the original study dialog');
  assert.equal(await page.locator('#panda-local-ai-start').count(),1,'Opt-in download button exists');
  // No auto load: the model starts only after a deliberate user click.
  assert.equal(await page.locator('#panda-local-ai-settings[open]').count(),0);
  await page.locator('#study-dialog [data-close]').first().click();
  await page.screenshot({path:out+'/panda-ai-'+width+'.png',animations:'disabled'});
  report.checks.push({width,panda:'ready',localAi:'present but opt-in'});
  await ctx.close();
 }
 assert.deepEqual(report.errors,[],'Unexpected browser JavaScript errors');
 report.result='passed';
 console.log('PASS Panda Go v322 mobile routes: seven current HSK1 destinations plus Panda AI opt-in on 360/390/412px; '+report.layoutWarnings.length+' lesson overflow warnings recorded for separate design review.');
}catch(e){report.result='failed';report.failure=String(e.stack||e);throw e}
finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close()}
