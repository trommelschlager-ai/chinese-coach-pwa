/* Focused acceptance checks in the repository's existing GitHub Chromium workflow. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
import sharp from 'sharp';
const BASE=process.env.QA_BASE||'http://127.0.0.1:4173';
const OUT='qa/hanzi-v141';fs.mkdirSync(OUT,{recursive:true});
const report={checks:[],captures:[],errors:[],audio:[],limitations:['Chromium mobile emulation, not a physical Android device.','Recorded playback is checked through media events; no human listening test.']};
const browser=await chromium.launch({headless:true});
let page;
async function capture(name){const path=`${OUT}/${name}.png`;await page.screenshot({path,fullPage:true});report.captures.push(path)}
async function layout(width,height){
 const metrics=await page.evaluate(()=>{
  const stage=document.querySelector('#pg-hanzi-approved'),r=stage.getBoundingClientRect();
  return {width:r.width,height:r.height,scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,
   buttons:[...stage.querySelectorAll('.pg-hit:not([hidden])')].map(el=>{const b=el.getBoundingClientRect();return {name:el.dataset.artHit,x:b.x-r.x,y:b.y-r.y,w:b.width,h:b.height}}),
   meaning:(()=>{const el=stage.querySelector('.pg-dynamic-meaning:not([hidden])');return el?{height:el.clientHeight,scrollHeight:el.scrollHeight}:null})(),
   rows:[...stage.querySelectorAll('.pg-dynamic-row')].map(el=>({scrollHeight:el.scrollHeight,height:el.clientHeight,text:el.textContent})),
   paper:document.querySelector('.pg-art-stroke-paper').getBoundingClientRect().toJSON()};
 });
 assert(metrics.scrollWidth<=width+1,'No horizontal overflow');assert(Math.abs(metrics.width-width)<1,'Artwork fills mobile width');
 assert(Math.abs(metrics.height-width*1536/864)<1,'Source aspect ratio is preserved');
 if(metrics.meaning)assert(metrics.meaning.scrollHeight<=metrics.meaning.height+1,'Meaning stays in its badge');
 for(const b of metrics.buttons){assert(b.x>=-1&&b.x+b.w<=width+1,'Button within width: '+b.name);assert(b.y>=-1&&b.y+b.h<=metrics.height+1,'Button within artwork: '+b.name)}
 report.checks.push({width,height,layout:metrics});
}
async function tap(name){await page.locator(`[data-art-hit="${name}"]`).click();}
async function draw(hz){
 const data=JSON.parse(fs.readFileSync(`assets/hanzi-data/${hz}.json`,'utf8'));
 const cdp=await page.context().newCDPSession(page);
 const send=async median=>{
  const pts=await page.locator('#writer svg g').first().evaluate((el,points)=>{const m=el.getScreenCTM();return points.map(([x,y])=>({x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f}))},median);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...pts[0],id:1}]});
  for(let i=1;i<pts.length;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...pts[i],id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 };
 if(hz==='大'){
   await send(data.medians[1]);
   await page.waitForFunction(()=>document.querySelector('#feedback').classList.contains('bad'));
   report.checks.push({hz,wrongStrokeOrderRejected:true});
 }
 for(const median of data.medians)await send(median);
 await page.waitForFunction(()=>document.body.dataset.writingStage==='complete',null,{timeout:15000});
 await cdp.detach();report.checks.push({hz,correctTouchStrokes:true});
}
try{
 for(const [width,height] of [[360,560],[360,800],[393,852],[412,740],[430,932]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  page=await context.newPage();
  await page.addInitScript(()=>{window.__qaMedia=[];const native=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){const entry={src:this.src,played:false,error:null};window.__qaMedia.push(entry);const result=native.call(this);result?.then(()=>entry.played=true).catch(e=>entry.error=e.message);return result;};});
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
  await page.goto(BASE+'/hanzi-lab.html',{waitUntil:'networkidle'});
  await page.locator('#pg-hanzi-approved').waitFor();
  await page.waitForFunction(()=>!document.querySelector('[data-art-hit=write]').disabled);
  await layout(width,height);await capture(`initial-${width}-${height}`);
  const stagePath=`${OUT}/reference-state-${width}-${height}.png`;
  await page.locator('#pg-hanzi-approved').screenshot({path:stagePath});
  const actual=await sharp(stagePath).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const expected=await sharp('assets/hanzi-approved-v141.png').resize(actual.info.width,actual.info.height).removeAlpha().raw().toBuffer();
  let error=0;for(let i=0;i<expected.length;i++)error+=Math.abs(expected[i]-actual.data[i]);
  const mae=error/expected.length;assert(mae<8,'Initial reference image MAE '+mae);report.checks.push({width,height,initialReferenceMAE:mae});
  await tap('meaning');await page.locator('.pg-dynamic-explanation').waitFor();await capture(`meaning-${width}-${height}`);
  await tap('words');assert.equal(await page.locator('.pg-dynamic-row').count(),3);await capture(`words-${width}-${height}`);
  await tap('examples');
  await tap('speak');
  await page.waitForFunction(()=>window.__qaMedia.some(x=>x.played&&decodeURIComponent(x.src).includes('cmn-大.mp3')));
  const audioRequests=await page.evaluate(()=>window.__qaMedia.filter(x=>x.played).map(x=>x.src));
  assert(audioRequests.some(s=>decodeURIComponent(s).includes('大')),'Correct character recording requested');report.audio.push({hz:'大',audioRequests});
  for(let n=0;n<3;n++){
    const phrase=await page.locator('#pg-hanzi-lexicon-list .pg-lexicon-entry strong').nth(n).textContent();
    await tap('example-'+n);
    await page.waitForFunction(text=>window.__qaMedia.some(x=>x.played&&x.src.endsWith(window.PANDA_HANZI_PHRASE_AUDIO[text])),phrase);
  }

  await tap('strokes');await page.locator('.pg-art-stroke-paper:not([hidden])').waitFor();
  await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('Теперь твоя очередь'));
  await capture(`strokes-${width}-${height}`);
  await tap('write');await page.waitForFunction(()=>document.body.dataset.writingStage==='writing');
  if(width===393){await draw('大');await capture('completed-da-393')}
  await tap('next');await page.waitForFunction(()=>document.querySelector('#character').textContent==='人');
  await page.waitForFunction(()=>!document.querySelector('[data-art-hit=write]').disabled);
  assert.equal(await page.locator('#pg-hanzi-approved').getAttribute('data-dynamic'),'true');
  assert.equal(await page.locator('.pg-dynamic-glyph').textContent(),'人');
  await layout(width,height);await capture(`ren-${width}-${height}`);
  await tap('strokes');await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('Теперь твоя очередь'));
  await tap('write');await page.waitForFunction(()=>document.body.dataset.writingStage==='writing');
  if(width===393){await draw('人');await capture('completed-ren-393');const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('chinese-coach-hanzi-lab-v1')));assert(saved.includes('大')&&saved.includes('人'));}
  await tap('next');await page.waitForFunction(()=>document.querySelector('#character').textContent==='小');
  if(width===393){
    for(let k=0;k<10;k++){
      const hz=await page.locator('#character').textContent();
      for(const tabName of ['examples','words']){
        await tap(tabName);await page.locator('.pg-lexicon-entry').first().waitFor({state:'attached'});
        for(let n=0;n<3;n++){
          const phrase=await page.locator('#pg-hanzi-lexicon-list .pg-lexicon-entry strong').nth(n).textContent();
          const before=await page.evaluate(()=>window.__qaMedia.length);
          await tap('example-'+n);
          await page.waitForFunction(({phrase,before})=>window.__qaMedia.slice(before).some(x=>x.played&&x.src.endsWith(window.PANDA_HANZI_PHRASE_AUDIO[phrase])),{phrase,before});
          report.audio.push({hz,phrase,played:true});
        }
        await layout(width,height);await capture(`all-${hz}-${tabName}-393`);
      }
      await tap('examples');await tap('next');
    }
  }
  await tap('back');await page.waitForURL('**/index.html#panda/learn');
  report.checks.push({width,height,backNavigation:true});await context.close();
 }
 assert.deepEqual(report.errors,[]);report.result='passed';
}catch(e){report.result='failed';report.failure=String(e.stack||e);if(page&&!page.isClosed()){await capture('failure').catch(()=>{});report.failureDOM=await page.locator('body').innerText().catch(()=>'?');}process.exitCode=1}
finally{fs.writeFileSync(`${OUT}/results.json`,JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report,null,2))}
