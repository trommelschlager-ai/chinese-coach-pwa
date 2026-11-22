/* Deep HSK 2 cross-lesson page QA. Browser-only unlock shim is applied
 * in isolated Playwright context for screenshot access to gated lesson stages.
 * This NEVER alters production lessons, saved student data or course rules. */
const { chromium } = require('playwright');
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
const URL_BASE=process.env.HSK2_QA_BASE||'http://127.0.0.1:8765';
const OUT=path.join(process.env.HSK2_QA_OUT||'qa-artifacts/hsk2','deep');
fs.mkdirSync(OUT,{recursive:true});
const lessons=[
 'hsk2-about-me.html','hsk2-lesson1.html','hsk2-lesson3-work-study-preview.html',
 'hsk2-lesson4-hobby-preview.html','hsk2-lesson5-friends-v2.html',
 'hsk2-lesson6-yesterday-preview.html','hsk2-lesson7-future-preview.html',
 'hsk2-lesson8-shop-preview.html','hsk2-lesson9-health-preview.html',
 'hsk2-lesson10-relationships-preview.html'
];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const failures=[],results=[];
 try{
 for(let i=0;i<lessons.length;i++){
   const context=await browser.newContext({viewport:{width:393,height:873},
    deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
   const page=await context.newPage();const pageErrors=[];
   page.on('pageerror',e=>pageErrors.push(String(e)));
   try{
     await page.goto(URL_BASE+'/'+lessons[i],{waitUntil:'domcontentloaded',timeout:30000});
     await page.waitForFunction(()=>!!window.PandaGoHSK2Preview&&document.querySelector('#app')?.dataset.view==='1',null,{timeout:12000});
     for(const step of [3,4,5,6,7,8]){
       const before=pageErrors.length;
       await page.evaluate(s=>{
         // Test-only bypass for access to all layouts; preserve original app rules.
         if(typeof window.canOpenStep==='function') window.canOpenStep=()=>true;
         window.PandaGoHSK2Preview.goToStep(s);
       },step);
       await page.waitForFunction(s=>document.querySelector('#app')?.dataset.view===String(s),step,{timeout:9000});
       await page.waitForTimeout(75);
       const state=await page.evaluate(()=>{
         const header=document.querySelector('#pg433 .pg433-header');
         const footer=document.querySelector('#pg433 .pg433-footer');
         const content=document.querySelector('#pg433 .pg433-content');
         const tabs=document.querySelectorAll('#pg433 .pg433-tabs button');
         return {headerHeight:header?.getBoundingClientRect().height,
           footerHeight:footer?.getBoundingClientRect().height,
           tabs:tabs.length,contentText:(content?.textContent||'').trim().length,
           overflowX:document.documentElement.scrollWidth>innerWidth+3,
           contentVisible:!!content&&content.getBoundingClientRect().height>100,
           footerVisible:!!footer&&footer.getBoundingClientRect().height>30};
       });
       assert.equal(state.tabs,5,'five-tab reference');
       assert.ok(state.contentText>10,'empty lesson page');
       assert.ok(state.contentVisible,'content panel not visible');
       assert.ok(state.footerVisible,'footer panel not visible');
       assert.ok(!state.overflowX,'horizontal page overflow');
       if(pageErrors.length>before) throw new Error('pageerror: '+pageErrors.slice(before).join('/'));
       await page.screenshot({path:path.join(OUT,'lesson-'+(i+1)+'-step-'+step+'.png'),fullPage:true});
       results.push({lesson:i+1,step,state});
     }
   }catch(e){
     failures.push({lesson:i+1,error:String(e),pageErrors});
     await page.screenshot({path:path.join(OUT,'FAIL-lesson-'+(i+1)+'.png'),fullPage:true}).catch(()=>{});
   }finally{await page.close();await context.close()}
 }
 }finally{await browser.close()}
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({passed:results.length,total:60,failures,results},null,2));
 console.log('Deep HSK2: '+results.length+'/60 steps passed. Failures: '+failures.length);
 failures.forEach(e=>console.error(e));
 if(failures.length) process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
