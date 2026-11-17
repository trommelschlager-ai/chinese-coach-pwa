import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.PANDA_TEST_BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
fs.mkdirSync('qa/hsk2-v414-six-screens',{recursive:true});
const sizes=[{width:360,height:800},{width:393,height:852},{width:412,height:915}];
try{
 for(const size of sizes){
  const tag=size.width+'x'+size.height;
  const errors=[];
  const context=await browser.newContext({viewport:size,deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:'ru-RU'});
  const page=await context.newPage();
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto(base+'/hsk2-life-course.html?start=1&v=414',{waitUntil:'domcontentloaded'});
  await page.locator('.pg414-vocab-row').first().waitFor();
  const scan=async name=>{
   const info=await page.evaluate(()=>{
    const root=document.getElementById('app');
    const w=document.documentElement.clientWidth;
    const main=document.querySelector('#screen');
    const footer=document.querySelector('#day-fixed-actions');
    const head=document.querySelector('.pg414-hero');
    const panel=document.querySelector('.pg414-panel');
    const rect=n=>n?(({x,y,width,height,bottom,right})=>({x,y,width,height,bottom,right}))(n.getBoundingClientRect()):null;
    return {width:w,scrollWidth:document.documentElement.scrollWidth,mainWidth:main.scrollWidth,mainClientWidth:main.clientWidth,
      head:rect(head),panel:rect(panel),footer:rect(footer),bg:getComputedStyle(root).backgroundImage};
   });
   assert.ok(info.head&&info.panel&&info.footer,'Header, content and footer present '+name);
   assert.ok(info.scrollWidth<=size.width+1,'No horizontal viewport overflow '+name+' '+JSON.stringify(info));
   assert.ok(info.mainWidth<=info.mainClientWidth+2,'No horizontal course overflow '+name+' '+JSON.stringify(info));
   assert.ok(info.panel.width>size.width*.85,'Content panel fills width '+name);
   assert.match(info.bg,/linear-gradient/);
   console.log('METRICS '+name+' '+tag+' '+JSON.stringify(info));
   await page.screenshot({path:'qa/hsk2-v414-six-screens/'+tag+'-'+name+'.png',fullPage:false});
  };
  assert.equal(await page.locator('.pg414-vocab-row').count(),7);
  await scan('01-words');
  const wordBounds=await page.locator('.pg414-vocab-row').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().bottom));
  assert.ok(Math.max(...wordBounds)<size.height-60,'All seven words above fixed footer on '+tag+' '+JSON.stringify(wordBounds));
  await page.locator('[data-day-next]').click();
  await page.locator('.pg414-rule').waitFor();
  await scan('02-rule');
  await page.locator('[data-day-next]').click();
  await page.locator('.pg414-speech-row').first().waitFor();
  assert.equal(await page.locator('.pg414-speech-row').count(),7);
  await scan('03-speech');
  await page.locator('[data-day-next]').click();
  await page.locator('.pg414-test').waitFor();
  assert.equal(await page.locator('.pg414-question').count(),7);
  await scan('04-test');
  await page.locator('[data-day-quiz="0:1"]').click();
  await page.locator('[data-day-quiz="1:0"]').click();
  for(let i=0;i<3;i++){
   await page.locator('[data-day-pair-left="'+i+'"]').click();
   await page.locator('[data-day-pair-right="'+i+'"]').click();
  }
  await page.locator('[data-day-listen="0"]').click();
  for(let i=0;i<4;i++)await page.locator('[data-day-token="'+i+'"]').click();
  await page.locator('[data-day-fill="0"]').click();
  await page.locator('[data-day-truth="true"]').click();
  assert.match(await page.locator('.pg414-test .pg414-progress').innerText(),/7\/7/);
  await page.locator('[data-day-next]').click();
  await page.locator('.pg414-example-large').first().waitFor();
  await scan('05-examples');
  await page.locator('[data-day-next]').click();
  await page.locator('.pg414-ai').waitFor();
  assert.match(await page.locator('.day-ai-panel a').getAttribute('href'),/practice=day&mini=0/);
  await page.locator('#pg414-ai-input').fill('我每天七点起床');
  await page.locator('[data-pg414-send]').click();
  await page.locator('#pg414-ai-feedback').filter({hasText:'Теперь ответь на второй вопрос'}).waitFor({timeout:8000});
  await page.locator('#pg414-ai-input').fill('我早上洗脸');
  await page.locator('[data-pg414-send]').click();
  await page.locator('#pg414-ai-feedback').filter({hasText:'Два ответа подходят'}).waitFor({timeout:8000});
  await page.screenshot({path:'qa/hsk2-v414-six-screens/'+tag+'-06-panda-ai.png',fullPage:false});
  assert.deepEqual(errors,[],'No JS errors on '+tag);
  console.log('PASS HSK2 six actual screens Android '+tag);
  await context.close();
 }
}finally{await browser.close()}
