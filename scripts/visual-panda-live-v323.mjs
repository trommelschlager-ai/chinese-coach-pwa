// Panda Go: visible approved Panda AI/mobile-layout smoke test.
// Legacy conversation markup is deliberately hidden under the approved v353 screen.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
const out='qa/panda-live-v323';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const summary={screens:[],results:[],errors:[]};
try{
 for(const [width,height] of [[360,640],[360,800],[390,720],[393,852],[412,915]]){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await ctx.newPage();
  page.on('pageerror',error=>summary.errors.push({width,message:error.message}));
  let res=await page.goto(base+'/index.html',{waitUntil:'load'});
  assert.equal(res?.status(),200);
  await page.locator('#pg130:not([hidden])').waitFor();
  const home=page.locator('#pg130 .pg-six-approved');
  await home.waitFor({state:'visible'});
  await page.waitForFunction(async()=>{const image=new Image();image.src='./assets/panda-home-approved-six-20261127.png';try{await image.decode();return image.naturalWidth===1024&&image.naturalHeight===1536}catch{return false}});
  const hits=home.locator('.pg-six-hit');
  assert.equal(await hits.count(),6,'Six approved home hotspots');
  assert.deepEqual(await hits.evaluateAll(els=>els.map(e=>e.getAttribute('href'))),['./hsk1-map.html','./hsk2-life-course.html?view=welcome','./panda-street-hsk1-map.html',null,'./panda-voice-pilot.html','./panda-street-ai-preview.html']);
  const layout=await home.evaluate(el=>{
   const art=el.querySelector('.pg-six-stage').getBoundingClientRect();
   const footer=el.querySelector('.pg-six-footer').getBoundingClientRect();
   const images=[...el.querySelectorAll('svg image')];
   const targets=[...el.querySelectorAll('.pg-six-hit')].map(e=>{
    const r=e.getBoundingClientRect();
    const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    return {fits:r.left>=art.left-1&&r.right<=art.right+1&&r.top>=art.top-1&&r.bottom<=art.bottom+1,clickable:e===top||e.contains(top),width:r.width,height:r.height};
   });
   return {artFits:art.left>=-1&&art.top>=-1&&art.right<=innerWidth+1&&art.bottom<=innerHeight+1,fullHeight:Math.abs(art.height-innerHeight)<=2,footerFits:Math.abs(footer.bottom-art.bottom)<=2,noScroll:el.scrollHeight<=el.clientHeight+2&&document.documentElement.scrollWidth<=innerWidth+2,originalArtwork:images.length===8&&images.every(i=>i.getAttribute('href')==='./assets/panda-home-approved-six-20261127.png'),targets,petals:document.querySelectorAll('#pg130 .pg-sakura-petal').length};
  });
  assert(layout.artFits&&layout.fullHeight&&layout.footerFits&&layout.noScroll&&layout.originalArtwork&&layout.targets.every(x=>x.fits&&x.clickable&&x.width>44&&x.height>44),JSON.stringify(layout));
  assert.equal(layout.petals,18,'Existing falling petals retained');
  await page.screenshot({path:out+'/approved-six-home-'+width+'.png',animations:'disabled'});
  await hits.nth(3).click();
  assert(await home.locator('.pg-six-note').isVisible(),'Fourth level notice must be visible after tap');
  for(const [i,destination] of [[0,'hsk1-map.html'],[1,'hsk2-life-course.html'],[2,'panda-street-hsk1-map.html'],[4,'panda-voice-pilot.html'],[5,'panda-street-ai-preview.html']]){
   if(i>0){await page.goto(base+'/index.html',{waitUntil:'load'});await home.waitFor();}
   await Promise.all([page.waitForURL(u=>u.pathname.endsWith('/'+destination)),hits.nth(i).click()]);
  }
  res=await page.goto(base+'/hsk1-map.html',{waitUntil:'load'});
  assert.equal(res?.status(),200);
  assert.equal(await page.locator('.hotspots a.lesson').count(),7,'Seven approved lesson hotspots');
  res=await page.goto(base+'/panda-voice-pilot.html?lesson=1',{waitUntil:'load'});
  assert.equal(res?.status(),200);
  await page.locator('#pg346').waitFor();
  await page.locator('#pg346[data-pa-layout="v547"]').waitFor();
  assert.equal(await page.locator('#pg346-topics').isVisible(),false);
  const panda=page.locator('.pg352-mascot .pg346-panda');
  assert(await panda.isVisible());
  // The approved portrait remains the sizing reference. The visible face
  // canvas replaces its pixels only after successful initialization.
  await page.waitForFunction(()=>document.querySelector('.pg352-mascot')?.dataset.faceReady==='true');
  const face=await page.locator('.pg353-face-canvas').evaluate(cv=>{
   const img=cv.parentElement.querySelector('.pg346-panda');
   const style=getComputedStyle(cv),p=getComputedStyle(img);
   const a=cv.getBoundingClientRect(),b=img.getBoundingClientRect();
   const pixels=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
   let opaque=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>100)opaque++;
   return {visible:style.display!=='none'&&style.visibility==='visible'&&Number(style.opacity)===1,
    originalLoaded:img.complete&&img.naturalWidth>0,originalOpacity:p.opacity,opaque,
    aligned:['x','y','width','height'].every(k=>Math.abs(a[k]-b[k])<1.5)};
  });
  assert(face.visible&&face.originalLoaded&&face.originalOpacity==='0'&&face.opaque>200&&face.aligned,JSON.stringify(face));
  assert.equal(await page.locator('.pg352-rocks').isVisible(),false);
  const dims=await page.evaluate(()=>{
   const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
   return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,stage:rect('#pg346'),mascot:rect('.pg352-mascot'),composer:rect('.pg346-composer'),nav:rect('.pg346-nav')};
  });
  assert(dims.scrollWidth<=dims.viewport+2,'No horizontal scrolling');
  assert(dims.mascot.left>=dims.stage.left-2&&dims.mascot.right<=dims.stage.right+2,'Panda fits approved stage');
  assert(dims.mascot.top>=dims.stage.top&&dims.mascot.bottom<=dims.composer.bottom,'Panda fits above footer');
  assert.match(await page.locator('.pg346-scene').evaluate(el=>getComputedStyle(el,'::before').backgroundImage),/panda-exact-stone-v361/);
  assert(dims.composer.bottom<=dims.nav.top+6,'Composer stays above navigation');
  await page.screenshot({path:out+'/approved-scene-'+width+'.png',animations:'disabled'});
  await page.locator('#pg346-nonstop').click();
  assert.equal(await page.locator('#pg346-nonstop').getAttribute('aria-pressed'),'true');
  const input=page.locator('#pg346-input');
  // v500+ deliberately collapses the composer until the plane is tapped.
  // Exercise the same visible controls as an Android learner, never force-fill.
  const send=page.locator('#pg346-send');
  async function sendChinese(message){
   if(!(await input.isVisible()))await send.click();
   await input.waitFor({state:'visible'});
   assert(await input.isEditable(),'Chinese composer must be editable after opening');
   await input.fill(message);
   await send.click();
  }
  await sendChinese('你好');
  await page.waitForFunction(()=>document.querySelector('.pg346-main-zh')?.textContent==='你好！');
  assert((await page.locator('#pg346-rows').textContent()).includes('你好'));
  await sendChinese('你好吗？');
  await page.waitForFunction(()=>document.querySelector('.pg346-main-zh')?.textContent==='很好！');
  summary.results.push({width,case:'short Mandarin dialogue',reply:await page.locator('.pg346-main-zh').textContent()});
  await page.locator('#pg346-topics-btn').click();
  assert(await page.locator('#pg346-topics').isVisible(),'Topic list opens only when tapped');
  const topics=await page.locator('#pg346-topics .pg346-topic-list button').allTextContents();
  assert(topics.length>=7,'All seven original topics retained; extra HSK2 practice topics may be added');
  assert.equal(new Set(topics.map(s=>s.trim())).size,topics.length,'Visible topic entries must remain distinct');
  await page.locator('#pg346-topics-close').click();
  assert(!(await page.locator('#pg346-topics').isVisible()));
  await page.locator('.pg346-nav #pg346-history').click();
  assert(await page.locator('#history-dialog').isVisible());
  await page.locator('[data-close="history-dialog"]').click();
  await page.screenshot({path:out+'/approved-dialog-'+width+'.png',animations:'disabled'});
  summary.screens.push({width,height,dims});
  await ctx.close();
 }
 assert.deepEqual(summary.errors,[],'No browser runtime errors');
 summary.result='passed';
 console.log('PASS Panda v352: approved scene, closed menu, Chinese dialog, seven topics, history, rocks and responsive 360/390/393/412px mobile layouts.');
}catch(error){summary.result='failed';summary.failure=String(error.stack||error);throw error}
finally{fs.writeFileSync(out+'/report.json',JSON.stringify(summary,null,2));await browser.close()}
