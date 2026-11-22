/* HSK2 mobile visual smoke test for PR #161.
 * Browser screenshots + basic interaction check. Not a voice/tone quality test.
 */
const { chromium }=require('playwright');
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
const URL_BASE=process.env.HSK2_QA_BASE||'http://127.0.0.1:8765';
const OUT=process.env.HSK2_QA_OUT||'qa-artifacts/hsk2';
fs.mkdirSync(OUT,{recursive:true});
const pages=[
 'hsk2-about-me.html','hsk2-lesson1.html','hsk2-lesson3-work-study-preview.html',
 'hsk2-lesson4-hobby-preview.html','hsk2-lesson5-friends-v2.html',
 'hsk2-lesson6-yesterday-preview.html','hsk2-lesson7-future-preview.html',
 'hsk2-lesson8-shop-preview.html','hsk2-lesson9-health-preview.html',
 'hsk2-lesson10-relationships-preview.html'
];
const sizes=[{width:360,height:800},{width:393,height:873},{width:412,height:915}];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const report=[], errors=[];
 try{
 for(const size of sizes){
  const context=await browser.newContext({viewport:size,deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  for(let i=0;i<pages.length;i++){
   const page=await context.newPage();
   const consoleErrors=[];
   page.on('pageerror',e=>consoleErrors.push(String(e)));
   try{
    await page.goto(URL_BASE+'/'+pages[i],{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.querySelector('#app')?.dataset.view==='1',{timeout:20000});
    await page.waitForTimeout(350);
    if(i){
     await page.waitForSelector('#pg433 .pg-ref-cover',{timeout:8000});
     const cover=page.locator('#pg433 .pg-ref-cover');
     const tileCount=await cover.locator('.pg-ref-tile').count();
     assert.equal(tileCount,6,'six section buttons required');
     const check=await cover.evaluate(el=>{
       const rect=el.getBoundingClientRect();
       const image=el.querySelector('.pg-ref-art img');
       const art=image.getBoundingClientRect();
       const root=document.documentElement;
       return {coverWidth:rect.width,coverHeight:rect.height,screenWidth:innerWidth,
         imageLoaded:image.complete&&image.naturalWidth>0,imageWidth:image.naturalWidth,
         imageHeight:image.naturalHeight,objectFit:getComputedStyle(image).objectFit,
         artWidth:art.width,artHeight:art.height,
         overflowX:root.scrollWidth>root.clientWidth+3,
         missingTexts:[...el.querySelectorAll('h1,.pg-ref-summary p,.pg-ref-tile-label')]
           .filter(node=>node.getBoundingClientRect().width===0||node.getBoundingClientRect().height===0)
           .map(node=>node.textContent.trim().slice(0,30))};
     });
     assert.ok(check.imageLoaded,'cover theme image did not load');
     assert.equal(check.objectFit,'cover','cover artwork should use uniform crop, never fill');
     assert.ok(!check.overflowX,'horizontal page overflow');
     assert.ok(check.missingTexts.length===0,'text element missing layout');
     await page.screenshot({path:path.join(OUT,'lesson-'+(i+1)+'-cover-'+size.width+'.png'),fullPage:true});
     await cover.locator('.pg-ref-start').click();
     await page.waitForFunction(()=>document.querySelector('#app')?.dataset.view==='2',{timeout:12000});
     const tabs=await page.locator('#pg433 .pg433-tabs button').count();
     assert.equal(tabs,5,'interior should have 5 tabs');
     const footerVisible=await page.locator('#pg433 .pg433-footer').isVisible();
     assert.ok(footerVisible,'interior footer missing');
     await page.screenshot({path:path.join(OUT,'lesson-'+(i+1)+'-words-'+size.width+'.png'),fullPage:true});
     report.push({lesson:i+1,viewport:size,cover:check,tabCount:tabs,footerVisible,pageErrors:consoleErrors});
    }else{
     assert.ok(await page.locator('#pg433 .about-approved-cover-shell').count()>0,'approved lesson 1 cover must remain');
     await page.screenshot({path:path.join(OUT,'lesson-1-cover-'+size.width+'.png'),fullPage:true});
     report.push({lesson:1,viewport:size,reference:true,pageErrors:consoleErrors});
    }
    if(consoleErrors.length) throw new Error('JS page errors: '+consoleErrors.slice(0,2).join(' / '));
   }catch(e){
     errors.push({lesson:i+1,viewport:size,error:String(e),pageErrors:consoleErrors});
     await page.screenshot({path:path.join(OUT,'FAIL-lesson-'+(i+1)+'-'+size.width+'.png'),fullPage:true}).catch(()=>{});
   }finally{await page.close()}
  }
  await context.close();
 }
 }finally{await browser.close()}
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({ok:errors.length===0,checks:report.length,errors,results:report},null,2));
 console.log('HSK2 Visual QA:',report.length,'passes,',errors.length,'failures');
 if(errors.length){for(const e of errors) console.error(e);process.exitCode=1}
})().catch(err=>{console.error(err);process.exitCode=1});
