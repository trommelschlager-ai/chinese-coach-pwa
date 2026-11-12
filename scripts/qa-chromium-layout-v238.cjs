'use strict';
/* Panda Go v238: inspect rendered Chromium geometry rather than jsdom-only CSS.
 * Designed to run on GitHub Actions using preinstalled Google Chrome.
 * This is not a substitute for testing on a physical Android device.
 */
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const puppeteer=require('puppeteer-core');
const ROOT=process.cwd();
const OUT='qa/v237/browser-results.json';
const SHOTS='qa/v237/browser-screenshots';
const LESSONS=[
 {file:'hsk1-first-v189.html',key:'pg-hsk1-v189-lesson1',steps:16},
 {file:'hsk1-second-v203.html',key:'pg-hsk1-v203-pronouns',steps:12},
 {file:'hsk1-third-v212.html',key:'pg-hsk1-v213-numbers',steps:14},
 {file:'hsk1-fourth-v214.html',key:'pg-hsk1-v215-weekdays',steps:13},
 {file:'hsk1-fifth-v227.html',key:'pg-hsk1-l5-v227',steps:14},
 {file:'hsk1-family-v231.html',key:'pg-hsk1-l6-v231',steps:14},
 {file:'hsk1-weather-v231.html',key:'pg-hsk1-l7-v231',steps:14}
];
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.woff':'font/woff','.woff2':'font/woff2','.ico':'image/x-icon'};
const server=http.createServer((req,res)=>{
 let pathname;
 try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);res.end();return}
 const full=path.resolve(ROOT,'.'+pathname);
 if(!full.startsWith(ROOT+path.sep)&&full!==ROOT){res.writeHead(403);res.end();return}
 fs.readFile(full,(error,buf)=>{
  if(error){res.writeHead(404);res.end('Not found: '+pathname);return}
  res.writeHead(200,{'content-type':TYPES[path.extname(full)]||'application/octet-stream','cache-control':'no-cache'});
  res.end(buf);
 });
});
const round=n=>Math.round(n*10)/10;
async function evaluateLayout(page,lesson,screen,width,height,errors){
 return page.evaluate(({lesson,screen,width,height,errors})=>{
  const issues=[];
  const footer=document.querySelector('footer');
  const root=document.querySelector('.app,.pg3-app,.pg4-app,.lesson-app,.pg2-app,main');
  if(!footer||!root){issues.push('Footer or root missing');return {lesson,screen,width,height,issues}}
  const footerR=footer.getBoundingClientRect();
  if(footerR.top<-1||footerR.bottom>window.innerHeight+1)issues.push('Footer outside viewport: '+JSON.stringify({top:footerR.top,bottom:footerR.bottom,height:window.innerHeight}));
  for(const btn of footer.querySelectorAll('button')){
   const style=getComputedStyle(btn);
   if(style.display==='none'||style.visibility==='hidden')continue;
   const rect=btn.getBoundingClientRect();
   if(rect.height<55.9)issues.push('Navigation button too short: '+(btn.id||btn.textContent.trim())+' '+rect.height.toFixed(1));
   if(rect.left<-.5||rect.right>window.innerWidth+.5||rect.top<-.5||rect.bottom>window.innerHeight+.5)issues.push('Navigation button clipped: '+(btn.id||btn.textContent.trim()));
   if(rect.width>0&&rect.height>0){
    const hit=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
    if(hit!==btn&&!btn.contains(hit))issues.push('Navigation button covered: '+(btn.id||btn.textContent.trim())+' by '+(hit?.tagName||'none'));
   }
  }
  const content=document.querySelector('.content,.pg3-scroll,.body,.pg4-scroll,#pg3-scroll,#pg5-scroll');
  if(content){
   const r=content.getBoundingClientRect();
   if(r.bottom>footerR.top+2)issues.push('Scroll content overlaps footer by '+(r.bottom-footerR.top).toFixed(1)+'px');
   if(content.scrollWidth>content.clientWidth+3)issues.push('Horizontal overflow inside scroll content');
  }
  if(document.documentElement.scrollWidth>window.innerWidth+3)issues.push('Horizontal page overflow');
  const counter=document.querySelector('#pg-counter,#pg3-count,#pg5-count');
  const actualStep=Number(counter?.textContent?.match(/\d+/)?.[0]);
  if(Number.isFinite(actualStep)&&actualStep!==screen)issues.push('Restored screen mismatch: expected '+screen+', found '+actualStep);
  for(const img of document.images){
   const rect=img.getBoundingClientRect();
   if(rect.width>30&&rect.height>30&&img.complete&&img.naturalWidth===0)issues.push('Missing image: '+img.getAttribute('src'));
  }
  if(lesson===3&&screen===1){
   const img=document.querySelector('img[src*="lesson-success-v233.webp"]');
   if(!img||!img.naturalWidth||img.naturalWidth<100)issues.push('Lesson 3 panda image missing or failed to load');
  }
  if(errors.length)issues.push(...errors.map(x=>'Page script error: '+x));
  return {lesson,screen,width,height,viewportHeight:window.innerHeight,footerTop:+footerR.top.toFixed(1),footerBottom:+footerR.bottom.toFixed(1),issues};
 },{lesson,screen,width,height,errors});
}
async function main(){
 fs.mkdirSync(SHOTS,{recursive:true});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const port=server.address().port;
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(f=>fs.existsSync(f)),headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
 const rows=[];
 try{
  for(let l=0;l<LESSONS.length;l++){
   const lesson=LESSONS[l];
   const page=await browser.newPage();
   await page.setBypassServiceWorker(true);
   let errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   for(const [width,height] of [[320,568],[320,780],[360,568],[360,780],[393,568],[393,780],[412,568],[412,780],[430,568],[430,780]]){
    await page.setViewport({width,height,deviceScaleFactor:1,isMobile:true,hasTouch:true});
    try{
     // The preceding 393px pass restores the last screen; clear only the QA tab's state.
     if((width===412||width===430)&&height===568)await page.evaluate(key=>localStorage.removeItem(key),lesson.key);
     await page.goto('http://127.0.0.1:'+port+'/'+lesson.file,{waitUntil:'networkidle2',timeout:45000});
     await page.evaluate(()=>document.fonts?.ready);
     let row=await evaluateLayout(page,l+1,1,width,height,errors);
     rows.push(row);
     if(width===393&&height===780){
      await page.screenshot({path:path.join(SHOTS,'lesson-'+(l+1)+'-cover.png')});
      for(let screen=1;screen<lesson.steps;screen++){
       errors=[];
       await page.evaluate(({key,step,steps,lessonNumber})=>{
        const seed={step,maxStep:steps-1,lessonVersion:lessonNumber===1?295:237,done:lessonNumber===2?Array(steps).fill(false):false,viewed:{1:[],2:[]},completedSpeech:{1:[],2:[]},selected:{1:1,2:6}};
        localStorage.setItem(key,JSON.stringify(seed));
       },{key:lesson.key,step:screen,steps:lesson.steps,lessonNumber:l+1});
       await page.reload({waitUntil:'networkidle2',timeout:45000});
       await page.evaluate(()=>document.fonts?.ready);
       row=await evaluateLayout(page,l+1,screen+1,width,height,errors);
       rows.push(row);
       if([3,5,6,lesson.steps-1].includes(screen))await page.screenshot({path:path.join(SHOTS,'lesson-'+(l+1)+'-screen-'+(screen+1)+'.png')});
      }
     }
     errors=[];
    }catch(e){rows.push({lesson:l+1,screen:0,width,height,issues:['QA navigation exception: '+String(e.message||e)]});errors=[]}
   }
   await page.close();
  }
   // HSK1 approved map: actual tap targets and visual reference at phone sizes.
   const mapPage=await browser.newPage();
   await mapPage.setBypassServiceWorker(true);
   for(const [width,height] of [[360,780],[393,780],[412,780],[430,780]]){
    await mapPage.setViewport({width,height,deviceScaleFactor:1,isMobile:true,hasTouch:true});
    await mapPage.goto('http://127.0.0.1:'+port+'/hsk1-map.html',{waitUntil:'networkidle2',timeout:45000});
    await mapPage.evaluate(()=>document.fonts?.ready);
    const mapRow=await mapPage.evaluate(({width,height})=>{
      const issues=[], rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
      const lessons=[...document.querySelectorAll('nav.map-road a.node')];
      const buttons=[...document.querySelectorAll('nav.pg-map-actions a')];
      if(lessons.length!==7)issues.push('Expected 7 lesson buttons; got '+lessons.length);
      if(buttons.length!==3)issues.push('Expected 3 lower practice buttons; got '+buttons.length);
      if(document.documentElement.scrollWidth>innerWidth+2)issues.push('Horizontal map overflow');
      for(const item of [...lessons,...buttons]){
        const r=item.getBoundingClientRect();
        if(r.width<44||r.height<44)issues.push('Tap target too small: '+(item.getAttribute('aria-label')||item.textContent.trim()));
        if(r.left<0||r.right>innerWidth+1||r.top<0||r.bottom>innerHeight+2)issues.push('Tap target outside screen: '+(item.getAttribute('aria-label')||item.textContent.trim()));
        const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
        if(hit!==item&&!item.contains(hit))issues.push('Map item covered: '+(item.getAttribute('aria-label')||item.textContent.trim()));
      }
      const ai=document.querySelector('.pg-ai-figure');
      if(!ai||!ai.naturalWidth)issues.push('Panda AI artwork missing');
      const first=lessons[0],last=lessons[6];
      if(first&&last&&rect(first).y>=rect(last).y)issues.push('Seven lessons out of order');
      const output={lesson:'map',screen:1,width,height,issues,header:rect(document.querySelector('.pg-map-heading')),first:rect(first),last:rect(last),footer:rect(document.querySelector('.pg-map-actions'))};
      return output;
    },{width,height});
    rows.push(mapRow);
    await mapPage.screenshot({path:path.join(SHOTS,'hsk1-approved-map-'+width+'.png')});
   }
   await mapPage.close();
   // Verify final HSK1 diagnostic at all supported Android viewport widths.
   const examPage=await browser.newPage();await examPage.setBypassServiceWorker(true);
   for(const [width,height] of [[360,780],[393,780],[412,780],[430,780]]){
    await examPage.setViewport({width,height,deviceScaleFactor:1,isMobile:true,hasTouch:true});
    await examPage.goto('http://127.0.0.1:'+port+'/hsk1-diagnostic.html',{waitUntil:'networkidle2',timeout:45000});
    await examPage.waitForSelector('.pg-exam-card',{timeout:15000});
    const examRow=await examPage.evaluate(({width,height})=>{
     const issues=[];
     if(document.documentElement.scrollWidth>innerWidth+1)issues.push('Horizontal diagnostic overflow');
     const buttons=[...document.querySelectorAll('#pg-exam-body button,#pg-exam-next,#pg-exam-prev')];
     if(!buttons.length)issues.push('Diagnostic buttons missing');
     for(const button of buttons){
      const r=button.getBoundingClientRect();
      if(r.height<44)issues.push('Diagnostic tap target too short: '+button.textContent);
      if(r.left<0||r.right>innerWidth+1)issues.push('Diagnostic button outside viewport: '+button.textContent);
     }
     if(!document.getElementById('pg-exam-next').disabled)issues.push('Diagnostic must lock until answered');
     const foot=document.querySelector('.pg-exam-footer')?.getBoundingClientRect();
     if(!foot||foot.bottom>innerHeight+2)issues.push('Diagnostic footer off screen');
     return {lesson:'diagnostic',screen:1,width,height,issues};
    },{width,height});
    rows.push(examRow);
    if(width===393)await examPage.screenshot({path:path.join(SHOTS,'hsk1-diagnostic-393.png')});
   }
   await examPage.close();
 }finally{await browser.close();await new Promise(r=>server.close(r))}
 const failures=rows.filter(r=>r.issues.length);
 const results={version:238,engine:'headless Chromium (actual rendered DOM, not jsdom)',tested_at:new Date().toISOString(),checks:rows.length,passed:rows.length-failures.length,failed:failures.length,failures,limitations:['Not a physical Android test','Does not assess audio tone or subjective sound quality','All screens checked at 393x780, all covers at 320/360/393/412/430 and two heights; diagnostic checked at four widths']};
 fs.writeFileSync(OUT,JSON.stringify(results,null,2)+'\n');
 console.log('PANDA GO browser QA:',rows.length,'checks,',failures.length,'failures');
 for(const r of failures.slice(0,35))console.log(JSON.stringify(r));
 if(failures.length)process.exitCode=1;
}
main().catch(err=>{console.error(err);process.exitCode=1;server.close()});
