/* Panda Go HSK1 v171: inspect real mobile layouts before enabling on main. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
const out='qa/hsk1-v171';
const sizes=[[320,640],[360,740],[390,844],[430,932],[740,390]];
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report={screens:[],checks:[],errors:[]};
try{
 for(const [width,height] of sizes){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await ctx.newPage();
  page.on('pageerror',e=>report.errors.push({width,height,error:e.message}));
  await page.goto(base+'/hsk1-lesson.html?lesson=1',{waitUntil:'load'});
  assert.equal(await page.locator('.lesson-step').count(),7,'Preserve seven steps');
  assert.equal(await page.locator('.lesson-word').count(),4,'Preserve four words per page');
  const metrics=await page.evaluate(()=>{
   const nav=document.querySelector('.lesson-controls'),shell=document.querySelector('.lesson-shell');
   const back=document.querySelector('.lesson-controls #lesson-prev'),next=document.querySelector('#lesson-next');
   const rn=nav.getBoundingClientRect(),rr=next.getBoundingClientRect();
   const native=[...document.querySelectorAll('.lesson-audio-native')].map(e=>e.getBoundingClientRect()).map(x=>({w:x.width,h:x.height}));
   return {width:innerWidth,height:innerHeight,docWidth:document.documentElement.scrollWidth,
     shellWidth:shell.scrollWidth,clientWidth:shell.clientWidth,position:getComputedStyle(nav).position,
     footer:{x:rn.x,y:rn.y,width:rn.width,height:rn.height,bottom:rn.bottom},
     next:{x:rr.x,y:rr.y,width:rr.width,height:rr.height},
     native,speed:!!document.querySelector('#hsk1-female-voice-speed'),
     background:getComputedStyle(shell).backgroundImage,backHeight:back.getBoundingClientRect().height};
  });
  assert(metrics.docWidth<=width+3,'Document overflows '+width+': '+JSON.stringify(metrics));
  assert(metrics.shellWidth<=metrics.clientWidth+3,'Lesson shell overflows '+width);
  assert.equal(metrics.position,'fixed','Next/Back controls must stay on-screen');
  assert(metrics.footer.y>=-2&&metrics.footer.bottom<=height+2,'Footer off-screen at '+width+'×'+height);
  assert(metrics.next.width>=100&&metrics.next.height>=44,'Next button is too small');
  assert(metrics.backHeight>=44,'Back button is too small');
  assert(metrics.native.every(x=>x.w>=43&&x.h>=43),'Native audio touch targets under 44px');
  assert(metrics.speed,'Existing female speed control must remain');
  assert(metrics.background.includes('approved-panda-lake-v112.webp'),'Approved background replaced');
  await page.screenshot({path:out+'/lesson1-words-'+width+'x'+height+'.png',fullPage:true,animations:'disabled'});
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  await page.waitForTimeout(60);
  const overlap=await page.evaluate(()=>{
   const footer=document.querySelector('.lesson-controls').getBoundingClientRect();
   const fineprint=document.querySelector('.lesson-fineprint').getBoundingClientRect();
   return {footerTop:footer.top,fineprintBottom:fineprint.bottom};
  });
  assert(overlap.fineprintBottom<=overlap.footerTop+3,'Bottom note is covered by footer at '+width+': '+JSON.stringify(overlap));
  await page.evaluate(()=>localStorage.setItem('pg-hsk1-v3-foundations',JSON.stringify({step:3,maxStep:3})));
  await page.reload({waitUntil:'load'});
  assert.equal(await page.locator('.lesson-line').count(),3,'All visible conversation lines should remain');
  const dialogue=await page.evaluate(()=>({
   docWidth:document.documentElement.scrollWidth,
   clipped:[...document.querySelectorAll('.lesson-line')].map(e=>{
    const r=e.getBoundingClientRect(),a=e.querySelector('.lesson-audio-label')?.getBoundingClientRect();
    return {rowWidth:r.width, audioRight:a?.right, rowRight:r.right};
   })
  }));
  assert(dialogue.docWidth<=width+3,'Dialogue overflows viewport '+width);
  assert(dialogue.clipped.every(x=>!x.audioRight||x.audioRight<=x.rowRight+3),
   'Dialogue audio controls stick out of the right edge at '+width+': '+JSON.stringify(dialogue.clipped));
  await page.screenshot({path:out+'/lesson1-dialogue-'+width+'x'+height+'.png',fullPage:true,animations:'disabled'});
  report.screens.push({width,height,metrics,overlap,dialogue});
  report.checks.push({width,height,ok:true});
  await ctx.close();
 }
 assert.deepEqual(report.errors,[],'JS errors in mobile lesson');
 report.result='passed';
 console.log('PASS v171 browser QA: 320/360/390/430px portrait and landscape, fixed Next, sound targets, no clipping or footer overlap, approved art preserved.');
}catch(e){report.result='failed';report.failure=String(e.stack||e);throw e}
finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close()}
