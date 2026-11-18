import {chromium} from 'playwright';
import fs from 'node:fs';
const base=process.env.PANDA_TEST_BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:'ru-RU'});
 const page=await context.newPage();
 const errors=[];const failed=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',req=>failed.push({url:req.url(),failure:req.failure()}));
 await page.goto(base+'/hsk2-life-course.html?view=map',{waitUntil:'networkidle',timeout:30000});
 await page.waitForTimeout(750);
 const state=await page.evaluate(()=>{
  const map=document.querySelector('.pg433-map');
  const img=document.querySelector('.pg433-map .pg433-map-card[data-topic="0"]');
  const screen=document.querySelector('#screen');
  const app=document.querySelector('#app');
  const info=el=>{if(!el)return null;const cs=getComputedStyle(el),r=el.getBoundingClientRect();return {tag:el.tagName,cls:el.className,display:cs.display,visibility:cs.visibility,opacity:cs.opacity,rect:{x:r.x,y:r.y,w:r.width,h:r.height},hidden:el.hidden,outer:el.outerHTML.slice(0,450)}};
  return {url:location.href,ready:document.readyState,body:document.body.className,app:info(app),screen:info(screen),map:info(map),image:info(img),cards:document.querySelectorAll('.pg433-map .pg433-map-card[data-topic]').length,mainHtml:screen?.innerHTML.slice(0,900),activeTexts:document.body.innerText.slice(0,850),images:[...document.images].slice(0,9).map(x=>({src:x.getAttribute('src'),complete:x.complete,w:x.naturalWidth,h:x.naturalHeight}))};
 });
 fs.mkdirSync('qa/panda-voice-pilot',{recursive:true});
 await page.screenshot({path:'qa/panda-voice-pilot/hsk2-map-diagnostic-v456.png',fullPage:false});
 console.log('PANDA_HSK2_MAP_DIAGNOSTIC_BEGIN');
 console.log(JSON.stringify({...state,errors,failed},null,2));
 console.log('PANDA_HSK2_MAP_DIAGNOSTIC_END');
 if(state.cards!==10||!state.map||!(state.map.rect.w>200&&state.map.rect.h>200)||errors.length)process.exitCode=1;
 await context.close();
}finally{await browser.close()}