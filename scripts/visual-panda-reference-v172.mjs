/* Approved v172 three-screen mobile QA: real controls, photos, and working HSK navigation. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
const out='qa/panda-v172';
const widths=[[320,640],[360,740],[390,844],[430,932]];
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report={screens:[],errors:[],checks:[]};
try{
 for(const [width,height] of widths){
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const p=await ctx.newPage();
  p.on('pageerror',e=>report.errors.push({width,height,error:e.message}));
  await p.goto(base+'/index.html',{waitUntil:'load'});
  await p.locator('#pg130:not([hidden]) .pg-hsk-level-list').waitFor();
  const home=await p.evaluate(()=>{
   const screen=document.querySelector('#pg130 .pg-hsk-page');
   const list=[...screen.querySelectorAll('.pg-hsk-level')];
   const bounds=screen.getBoundingClientRect();
   return {count:list.length,scrollW:screen.scrollWidth,clientW:screen.clientWidth,
     first:list[0]?.getBoundingClientRect().top,
     last:list.at(-1)?.getBoundingClientRect().bottom,
     bodyHeight:bounds.height,
     cards:list.map(e=>({height:e.getBoundingClientRect().height,icon:e.querySelector('.pg-icon')?.tagName||'',label:e.querySelector('strong')?.textContent})),
     bg:screen.querySelector('.pg-hsk-backdrop img')?.naturalWidth};
  });
  assert.equal(home.count,6,'Every reference HSK capsule must exist');
  assert(home.scrollW<=home.clientW+2,'Home overflows horizontally at '+width);
  assert(home.last<=height+6,'Six HSK cards do not fit height '+height+': '+JSON.stringify(home));
  assert(home.first>=0&&home.bg>0,'Approved panda backdrop must load');
  for(let n=1;n<=6;n++)assert.equal(home.cards[n-1].label,'HSK '+n);
  await p.screenshot({path:out+'/01-home-'+width+'.png',fullPage:true,animations:'disabled'});
  await p.locator('#pg130 a[href="./hsk1-map.html"]').click();
  await p.waitForURL('**/hsk1-map.html');
  assert.equal(await p.locator('.map-road a.node').count(),7,'HSK1 mountain map must keep seven real links');
  const map=await p.locator('.map-shell').evaluate(e=>({
    sw:e.scrollWidth,cw:e.clientWidth,
    background:getComputedStyle(e).backgroundImage,
    art:e.querySelector('.panda')?.naturalWidth,
    paths:e.querySelectorAll('.path path').length,
    stops:[...e.querySelectorAll('a.node')].map(x=>x.getAttribute('href'))
  }));
  assert(map.sw<=map.cw+3,'Map overflow on '+width);
  assert(map.background.includes('panda-hsk1-mountain-v174.webp'),'Map must use clean crop of the approved scenic artwork');
  assert(map.art>0&&map.paths===2,'Panda and mountain trail missing');
  assert.equal(new Set(map.stops).size,7,'Map cards need seven unique lesson routes');
  await p.screenshot({path:out+'/02-map-'+width+'.png',fullPage:true,animations:'disabled'});
  await p.goto(base+'/hsk1-lesson.html?lesson=1',{waitUntil:'load'});
  assert.equal(await p.locator('.lesson-step').count(),7,'Seven pink lesson capsules required');
  await p.evaluate(()=>localStorage.setItem('pg-hsk1-v3-foundations',JSON.stringify({step:3,maxStep:3})));
  await p.reload({waitUntil:'load'});
  assert.equal(await p.locator('.lesson-step.active').count(),1,'Exactly one active lesson capsule');
  assert.equal(await p.locator('.lesson-line').count(),3,'Dialogue must keep every real speech bubble');
  const dialogue=await p.evaluate(()=>{
    const shell=document.querySelector('.lesson-shell'),hero=document.querySelector('.lesson-dialogue-hero img');
    const bottom=document.querySelector('.lesson-controls').getBoundingClientRect();
    return {sw:shell.scrollWidth,cw:shell.clientWidth,
      heroOK:!!hero&&hero.complete&&hero.naturalWidth>0,
      audioButtons:document.querySelectorAll('.lesson-line button[data-play]').length,
      activeStep:document.querySelector('.lesson-step.active .step-label')?.textContent,
      footer:{bottom:bottom.bottom,height:bottom.height},
      approvedCSS:[...document.styleSheets].some(s=>s.href?.includes('panda-approved-three-screen-v172.css'))
    };
  });
  assert(dialogue.sw<=dialogue.cw+3,'Long Chinese text overflows at '+width);
  assert(dialogue.heroOK,'Approved dialogue illustration failed to load');
  assert(dialogue.audioButtons>=3,'Dialogue speech buttons should be visible');
  assert(dialogue.activeStep==='Диалог','Step 4 should show conversation');
  assert(dialogue.footer.bottom<=height+3&&dialogue.footer.height>=48,'Next button must remain visible');
  assert(dialogue.approvedCSS,'Approved visual layer not loaded in lesson');
  await p.screenshot({path:out+'/03-dialogue-'+width+'.png',fullPage:true,animations:'disabled'});
  report.screens.push({width,height,home,map,dialogue});
  report.checks.push({width,height,passed:true});
  await ctx.close();
 }
 assert.deepEqual(report.errors,[],'Browser errors in approved screens');
 report.status='passed';
 console.log('PASS Panda v172: three approved screens checked at 320/360/390/430px, six buttons, mountain map and real audio dialogue.');
}catch(e){report.status='failed';report.failure=String(e.stack||e);throw e}
finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close()}
