/* Browser smoke checks for the current Panda v145 shell.
   The v119 standalone game and audio checks remain, but the retired hidden
   #quiz/#topics screens are not confused with the current approved UI. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const BASE=process.env.QA_BASE||'http://127.0.0.1:4173';
const OUT='qa/v119';
const SIZES=[[360,800],[390,844],[412,915]];
fs.mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const results=[];
async function screenshot(page,name,size){
 const info=await page.evaluate(()=>({
  viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
  screenWidth:screen.width,title:document.title,
  route:document.querySelector('#pg130 .pg-screen')?.dataset.route||'standalone'
 }));
 assert(info.scrollWidth<=size[0]+2,'Horizontal overflow '+name+' '+JSON.stringify(info));
 await page.screenshot({path:OUT+'/'+name+'-'+size[0]+'.png',fullPage:true,animations:'disabled'});
 results.push({screen:name,width:size[0],height:size[1],...info});
}
async function appPage(context){
 const p=await context.newPage();
 await p.goto(BASE+'/index.html',{waitUntil:'load'});
 await p.locator('#pg130:not([hidden]) .pg-screen').waitFor();
 await p.waitForFunction(()=>typeof window.__panda130?.show==='function'&&typeof window.__simpleSectionPreview?.getFile==='function');
 return p;
}
async function checkAudioClips(page){
 const clips=await page.evaluate(async()=>{
  const results=[];
  const audioContext=new (window.AudioContext||window.webkitAudioContext)();
  try {
   for(const word of ['我','你','喜欢','明白','中国','你好','面条','谢谢']){
    const src=window.__simpleSectionPreview.getFile(word);
    if(!src)throw Error('No recorded audio for '+word);
    const res=await fetch(src,{cache:'no-store'});
    if(!res.ok)throw Error(word+': MP3 HTTP '+res.status);
    const bytes=await res.arrayBuffer();
    const decoded=await audioContext.decodeAudioData(bytes.slice(0));
    const values=decoded.getChannelData(0);
    const stride=Math.max(1,Math.floor(values.length/12000));
    let sum=0,peak=0,n=0;
    for(let i=0;i<values.length;i+=stride){const v=values[i];sum+=v*v;peak=Math.max(peak,Math.abs(v));n++}
    results.push({word,source:src,duration:Math.round(decoded.duration*100)/100,
     rms:Math.sqrt(sum/n),peak,bytes:bytes.byteLength,sampleRate:decoded.sampleRate});
   }
  }finally{await audioContext.close()}
  return results;
 });
 for(const c of clips){
  assert(c.duration>=0.15&&c.duration<8,'Unusual recorded clip duration: '+JSON.stringify(c));
  assert(c.rms>0.0005&&c.peak>0.003,'MP3 contains no audible signal: '+JSON.stringify(c));
 }
 fs.writeFileSync(OUT+'/audio-samples.json',JSON.stringify({
  note:'Objective MP3 decoding and signal only, not a human review of Mandarin accents, noise or commercial licensing',clips
 },null,2)+'\n');
}
try{
 for(const size of SIZES){
  const [width,height]=size;
  const context=await browser.newContext({
   viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'
  });
  const errors=[];
  context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  const page=await appPage(context);
  if(width===360)await checkAudioClips(page);

  // The word card has visible hanzi and its exact toned pinyin.
  await page.evaluate(()=>window.__panda130.show('words'));
  await page.locator('#pg130 .pg-hanzi').waitFor();
  assert.equal((await page.locator('#pg130 .pg-hanzi').textContent()).trim(),'我');
  assert.equal((await page.locator('#pg130 .pg-pinyin').textContent()).trim(),'wǒ');
  await screenshot(page,'01-word-card',size);
  await page.locator('#pg130 [data-action=pinyin]').click();
  assert.equal(await page.locator('#pg130 .pg-pinyin').count(),0,'Pinyin toggle hides annotations');
  await page.reload({waitUntil:'load'});
  await page.locator('#pg130:not([hidden])').waitFor();
  await page.evaluate(()=>window.__panda130.show('words'));
  assert.equal(await page.locator('#pg130 .pg-pinyin').count(),0,'Pinyin preference survives reload');
  await page.locator('#pg130 [data-action=pinyin]').click();

  // Quiz uses the current interactive shell, never the retired hidden #quiz.
  await page.evaluate(()=>window.__panda130.show('quiz'));
  await page.locator('#pg130 .pg-question').waitFor();
  assert.equal(await page.locator('#pg130 [data-action=answer]').count(),4);
  await screenshot(page,'02-quiz',size);
  await page.locator('#pg130 [data-action=answer]').first().click();
  await page.locator('#pg130 [data-action=question-check]').click();
  assert.equal(await page.locator('#pg130 [data-action=answer]:disabled').count(),4);

  // Both sides of a real conversation remain visible throughout playback.
  await page.evaluate(()=>window.__panda130.show('dialogues'));
  await page.locator('#pg130 [data-dialog-line]').first().waitFor();
  assert.equal(await page.locator('#pg130 [data-dialog-line]').count(),6);
  await screenshot(page,'03-full-dialogue',size);
  await page.locator('#pg130 [data-action=dialog-tab][data-value="1"]').click();
  assert.equal(await page.locator('#pg130 [data-dialog-line]').count(),5);
  await screenshot(page,'04-next-dialogue',size);

  // Keep the retired, independently reachable standalone game healthy.
  const game=await context.newPage();
  await game.goto(BASE+'/game.html?legacy=1',{waitUntil:'load'});
  await game.locator('[data-game-mode="build"]').waitFor();
  await game.locator('.approved-art-image').evaluate(img=>img.decode());
  const hero=await game.locator('.approved-art-image').boundingBox();
  assert(Math.abs(hero.width/hero.height-864/1536)<.015,
   'Legacy approved game art must preserve 864:1536 aspect ratio');
  const hot=game.locator('.approved-hit-build');
  await hot.dispatchEvent('pointerdown',{bubbles:true});
  assert(await hot.evaluate(el=>el.classList.contains('is-pressed')),'Button presses give tactile feedback');
  await hot.dispatchEvent('pointerup',{bubbles:true});
  await screenshot(game,'05-legacy-game',size);
  await game.close();

  // Standalone Hanzi must use the approved raster and an operable SVG writer.
  const hanzi=await context.newPage();
  await hanzi.goto(BASE+'/hanzi-lab.html',{waitUntil:'load'});
  await hanzi.locator('#pg-hanzi-approved').waitFor();
  await hanzi.locator('#writer svg path').first().waitFor({timeout:20000});
  assert.equal(await hanzi.locator('[data-art-hit="next"]').count(),1,'Go еще button stays mounted');
  assert.equal(await hanzi.locator('#practice').count(),1,'Original writing control is retained');
  await screenshot(hanzi,'06-hanzi',size);
  await hanzi.close();
  await page.close();
  assert.deepEqual(errors,[],'Browser JS errors at '+width+': '+errors.join('; '));
  await context.close();
 }
 fs.writeFileSync(OUT+'/results.json',JSON.stringify({version:146,at:new Date().toISOString(),results},null,2)+'\n');
 console.log('PASS v146 browser smoke: '+results.length+' screenshots; modern lessons, MP3 decode, legacy game and live writing.');
}finally{await browser.close()}
