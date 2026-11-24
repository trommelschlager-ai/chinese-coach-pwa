import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

// Actual Chromium layout metrics, not just substring assertions.
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
fs.mkdirSync('qa/panda-chat-readable-v551',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [360,393,412]){
  const context=await browser.newContext({viewport:{width,height:800},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/panda-voice-pilot.html?qa=chat-readable-v551',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#pg346')?.dataset.paLayout==='v547',{timeout:15000});
  await page.waitForSelector('#pg346-rows');
  const result=await page.evaluate(()=>{
   const stage=document.querySelector('#pg346');
   const history=stage.querySelector('#pg346-rows');
   const panda=stage.querySelector('.pg352-mascot').getBoundingClientRect();
   const historyHeight=history.getBoundingClientRect().height;
   const samples=[
    {zh:'我不是老师。',py:'Wǒ bú shì lǎoshī.',ru:'Я не учитель.',long:false},
    {zh:'我没听懂。你可以再说一遍，或者换一种说法吗？',py:'Wǒ méi tīng dǒng. Nǐ kěyǐ zài shuō yí biàn, huòzhě huàn yì zhǒng shuōfǎ ma?',ru:'Я не поняла. Можешь повторить или сказать по-другому?',long:true},
    {zh:'你可以用简单一点的中文说吗？',py:'Nǐ kěyǐ yòng jiǎndān yìdiǎn de Zhōngwén shuō ma?',ru:'Можешь сказать на более простом китайском?',long:true}
   ];
   history.replaceChildren();
   for(const sample of samples){
    const row=document.createElement('article');
    row.className='pg346-row'+(sample.long?' pg506-long':'');
    const avatar=document.createElement('span');
    avatar.className='pg346-avatar';avatar.textContent='🐼';
    const text=document.createElement('div');text.className='pg346-text';
    const zh=document.createElement('div');zh.className='pg346-zh';zh.textContent=sample.zh;
    const py=document.createElement('div');py.className='pg346-py';py.textContent=sample.py;
    text.append(zh,py);
    const ru=document.createElement('div');ru.className='pg346-ru';ru.textContent=sample.ru;
    const audio=document.createElement('button');audio.className='pg346-row-audio';audio.textContent='›';
    row.append(avatar,text,ru,audio);history.append(row);
   }
   history.scrollTop=history.scrollHeight;
   const rows=[...history.querySelectorAll('.pg346-row')].map(row=>{
    const text=row.querySelector('.pg346-text'),ru=row.querySelector('.pg346-ru');
    const zh=row.querySelector('.pg346-zh'),py=row.querySelector('.pg346-py');
    return {
     height:row.clientHeight,scrollHeight:row.scrollHeight,
     textHeight:text.clientHeight,textScrollHeight:text.scrollHeight,
     ruHeight:ru.clientHeight,ruScrollHeight:ru.scrollHeight,
     zhHeight:zh.clientHeight,zhScrollHeight:zh.scrollHeight,
     pyHeight:py.clientHeight,pyScrollHeight:py.scrollHeight,
     textOverflow:getComputedStyle(text).overflowY,
     ruOverflow:getComputedStyle(ru).overflowY,
     bottom:row.getBoundingClientRect().bottom
    };
   });
   const rec=history.getBoundingClientRect(),after=stage.querySelector('.pg352-mascot').getBoundingClientRect();
   const scrolled={clientHeight:history.clientHeight,scrollHeight:history.scrollHeight,scrollTop:history.scrollTop,
    display:getComputedStyle(history).display,overflow:getComputedStyle(history).overflowY};
   document.documentElement.dataset.keyboard='true';
   const hiddenWithKeyboard=getComputedStyle(history).display==='none';
   document.documentElement.dataset.keyboard='false';
   return {pandaBefore:[panda.x,panda.y,panda.width,panda.height],pandaAfter:[after.x,after.y,after.width,after.height],
    historyHeight,historyAfter:history.getBoundingClientRect().height,historyBottom:rec.bottom,rows,scrolled,hiddenWithKeyboard};
  });
  assert.equal(result.rows.length,3);
  assert.equal(result.scrolled.display,'flex','Three forced 1fr rows still active: '+JSON.stringify(result));
  assert.equal(result.scrolled.overflow,'auto','History must be the scroll container');
  assert(result.scrolled.scrollHeight>result.scrolled.clientHeight,'Long cards must expand instead of being squashed');
  assert(result.scrolled.scrollTop>10,'Latest reply not scroll-reachable');
  assert(Math.abs(result.historyHeight-result.historyAfter)<2,'History strip moved');
  for(let i=0;i<4;i++)
   assert(Math.abs(result.pandaBefore[i]-result.pandaAfter[i])<1,'Approved Panda geometry changed');
  for(const row of result.rows){
   assert(row.scrollHeight<=row.height+3,'Whole card clipped: '+JSON.stringify(row));
   assert(row.textScrollHeight<=row.textHeight+3,'Hanzi/pinyin clipped: '+JSON.stringify(row));
   assert(row.ruScrollHeight<=row.ruHeight+3,'Russian translation clipped: '+JSON.stringify(row));
   assert(row.pyScrollHeight<=row.pyHeight+3,'Tone-marked pinyin clipped: '+JSON.stringify(row));
   assert(row.textOverflow==='visible','Text still hides its own scrollbar');
   assert(row.ruOverflow==='visible','Russian translation still hides its own scrollbar');
  }
  assert(result.rows[1].height>result.rows[0].height,'Long reply did not get more vertical room');
  assert(result.hiddenWithKeyboard,'Chat history must hide during Android keyboard input');
  assert.deepEqual(errors,[],'Panda runtime errors');
  await page.screenshot({path:'qa/panda-chat-readable-v551/long-rows-'+width+'.png',animations:'disabled',fullPage:false});
  console.log('PASS Panda readable dialogue v551 '+width+'px',JSON.stringify({heights:result.rows.map(x=>x.height),scrollHeight:result.scrolled.scrollHeight}));
  await context.close();
 }
}finally{await browser.close()}
