// Browser-level release gate: type through the actual visible composer, not a test-only bridge.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
const dir='qa/panda-dialogue-v556';
fs.mkdirSync(dir,{recursive:true});
const fixtures=['work','introduction','family','everyday'].map(topic=>{
 const source=fs.readFileSync(new URL('../tests/panda-'+topic+'-dialogue-v556.test.mjs',import.meta.url),'utf8');
 const start=source.indexOf('const chains=')+13,end=source.indexOf(';\nfor(',start);
 return {topic,chains:JSON.parse(source.slice(start,end))};
});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[];
try{
 for(const [width,mode] of [[360,'short'],[393,'short'],[393,'nonstop'],[412,'nonstop']]){
  const context=await browser.newContext({viewport:{width,height:800},isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const snap=()=>page.evaluate(()=>window.PandaApprovedBridge337.snapshot());
  const send=async(input,answer)=>{
   try{
    const composer=page.locator('#pg346-input'),button=page.locator('#pg346-send');
    if(!await composer.isVisible())await button.click();
    await composer.fill(input);
    await button.click();
    await page.waitForFunction(({input,answer})=>{
     const h=window.PandaApprovedBridge337?.snapshot().history;
     return h?.at(-2)?.who==='you'&&h.at(-2).hanzi===input&&h.at(-1)?.who==='panda'&&h.at(-1).hanzi===answer;
    },{input,answer},{timeout:7000});
    const h=(await snap()).history;
    assert(h.at(-2).pinyin&&h.at(-2).ru,input+' lacks verified learner text');
    assert(h.at(-1).pinyin&&h.at(-1).ru,answer+' lacks model text');
    const visible=page.locator('#pg346-rows .pg346-row:last-child .pg346-zh');
    await visible.waitFor({state:'visible'});
    assert.equal(await visible.textContent(),answer);
    assert.equal(await composer.inputValue(),'');
   }catch(e){
    console.error('DIALOGUE_UI_FAIL',JSON.stringify({width,mode,input,expected:answer,actual:await snap().catch(()=>null),errors}));
    throw e;
   }
  };
  try{
   await page.goto(base+'/panda-voice-pilot.html',{waitUntil:'domcontentloaded'});
   await page.locator('#pg346').waitFor({state:'visible',timeout:15000});
   await page.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true');
   if(mode==='nonstop')await page.locator('#pg346-nonstop').click();
   assert.equal((await snap()).mode,mode);
   // User-reported screenshot failures must pass before any new feature is accepted.
   for(const [input,answer] of [['很无聊','我们聊聊天吧！你喜欢看电影吗？'],['我不是老师','明白了。你做什么工作？'],['我是老师','你是老师！你在哪儿工作？']]){
    await send(input,answer);
    assert.equal((await snap()).audioAvailable,true,'Exact approved MP3 must be available: '+answer);
   }
   let turns=3,chains=0;
   for(const {topic,chains:group} of fixtures){
    for(const chain of group){
     for(const [input,answer] of chain){await send(input,answer);turns++;}
     chains++;
    }
    console.log('PASS real composer '+width+' '+mode+' '+topic);
   }
   assert.equal(errors.length,0,errors.join('; '));
   await page.screenshot({path:dir+'/dialogues-'+width+'-'+mode+'.png',animations:'disabled'});
   results.push({width,mode,turns,chains,result:'pass'});
  }finally{await context.close();}
 }
}finally{
 fs.writeFileSync(dir+'/browser-dialogue-results.json',JSON.stringify(results,null,2));
 await browser.close();
}
console.log('PASS all browser dialogue groups',JSON.stringify(results));
