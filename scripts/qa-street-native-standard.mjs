import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import fs from 'node:fs';
import '../assets/panda-street-lesson3.js';
const base=process.env.QA_BASE||'http://127.0.0.1:4173',out='qa/street-native-standard';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM,args:['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
const standard=['cover',...Array(4).fill('phrase'),'dialogue','tone',...Array(4).fill('phrase'),'grammar',...Array(3).fill('build'),...Array(4).fill('phrase'),'dialogue','dialogue',...Array(5).fill('listen'),...Array(3).fill('record'),'finish','ai'];
async function checkLesson3Audio(page){
 const files=await page.evaluate(async()=>{
  const context=new AudioContext();
  try{
   return await Promise.all(PandaStreetLesson3.words.map(async ([zh])=>{
    const {src,sha256}=PandaStreetVoiceV20261125.lookup(zh);
    const response=await fetch(src);
    if(!response.ok)throw Error(src+' '+response.status);
    const bytes=await response.arrayBuffer();
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    if(Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('')!==sha256)
     throw Error('Unexpected SHA-256 for '+src);
    if(!(await context.decodeAudioData(bytes)).duration)throw Error('Empty audio '+src);
    return src;
   }));
  }finally{await context.close()}
 });
 assert.equal(new Set(files).size,27);
}

const orders={1:[[2,3,1,0],[1,2,0],[2,1,0]],2:[[3,2,0,1],[2,1,0],[1,2,0]],3:globalThis.PandaStreetLesson3.builds.map(build=>build[2])};let count=0;
try{for(const [width,height] of [[360,640],[393,873],[412,915]]){
 const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,permissions:['microphone']});
 for(const n of [3]){
 const expected=n===3?[...standard.slice(0,19),...Array(6).fill('phrase'),...standard.slice(19)]:standard;
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/panda-street-slang-lesson'+n+'-preview.html?welcome=1');await page.locator('#pg-content[data-stage]').waitFor();
 if(n===3&&width===393)await checkLesson3Audio(page);
 for(let k=0;k<expected.length;k++){const stage=expected[k],area=page.locator('#pg-content');assert.equal(await area.getAttribute('data-stage'),stage);assert.equal(await page.locator('#pg-counter').textContent(),String(k+1).padStart(2,'0')+' / '+expected.length);
 const layout=await page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();return{w:document.documentElement.scrollWidth,h:innerHeight,b:r('#pg-footer').bottom,ct:r('#pg-content').top,cb:r('#pg-content').bottom,ft:r('#pg-footer').top,hb:r('[data-pg-hsk1-header]').bottom}});
 assert(layout.w<=width+2&&layout.b<=height+2&&layout.cb<=layout.ft+2&&layout.hb<=layout.ct+2,'Layout '+n+'/'+k+'/'+width);
 if(stage==='build'){const i=Number(await area.getAttribute('data-item'));assert(await page.locator('#pg-next').isDisabled());await page.locator('#verify').click();assert(await page.locator('#pg-next').isDisabled());for(const j of orders[n][i])await page.locator('[data-add="'+j+'"]').click();await page.locator('#verify').click();assert(await page.locator('#pg-next').isEnabled());}
 if(stage==='listen'){const i=Number(await area.getAttribute('data-item')),a=page.locator('[data-say]');if(await a.isEnabled()){await a.click();await page.locator('[data-answer]:enabled').first().waitFor();const correct=({1:[0,1,2,6,7],2:[0,2,7,9,11],3:globalThis.PandaStreetLesson3.listen})[n][i];const wrong=page.locator('[data-answer]:not([data-answer="'+correct+'"])').first();await wrong.click();assert(await page.locator('#pg-next').isDisabled());await page.locator('[data-answer="'+correct+'"]').click();assert(await page.locator('#pg-next').isEnabled());}else assert(await page.locator('#pg-next').isEnabled());}
 if(stage==='record'&&Number(await area.getAttribute('data-item'))===0){await page.locator('#record-start').click();await page.locator('#record-stop').waitFor();await page.waitForTimeout(700);await page.locator('#record-stop').click();await page.locator('#record-listen').waitFor();}
 if([0,1,5,6,11,12,19,21,26,29,30].includes(k))await page.screenshot({path:out+'/'+n+'-'+width+'-'+(k+1)+'.png',animations:'disabled'});
 count++;if(k<expected.length-1){await page.waitForTimeout(320);await page.locator('#pg-next').click();await page.waitForFunction(c=>document.querySelector('#pg-counter').textContent===c,String(k+2).padStart(2,'0')+' / '+expected.length);}}
 assert.deepEqual(errors,[]);assert.equal(await page.locator('a.street-pink-link').getAttribute('href'),'./panda-street-ai-preview.html'+(n===3?'?lesson=3':''));if(n===3&&width===393){
  await page.addInitScript(()=>{
   window.played=[];
   const play=HTMLMediaElement.prototype.play;
   HTMLMediaElement.prototype.play=function(){
    this.addEventListener('playing',()=>window.played.push(this.currentSrc),{once:true});
    return play.call(this);
   };
  });
  await page.locator('a.street-pink-link').click();
  await page.waitForFunction(()=>document.querySelector('#stage').dataset.brainState==='full');
  await page.locator('#nonstop').click();
  await page.waitForFunction(()=>window.played.some(url=>url.endsWith('/lesson3-20261127/18.mp3')));
  await page.locator('#entry').fill('不太忙，你呢？');
  await page.locator('#submit').click();
  await page.waitForFunction(()=>window.played.some(url=>url.endsWith('/lesson3-20261127/20.mp3')));
  assert.equal(await page.locator('#live-panda .zh').textContent(),'我也不忙。那我们走吧！');
  assert.deepEqual(errors,[]);
 }
 await page.close();}await ctx.close();}assert.equal(count,111);console.log('PASS '+count+' screens');}finally{await browser.close();}
