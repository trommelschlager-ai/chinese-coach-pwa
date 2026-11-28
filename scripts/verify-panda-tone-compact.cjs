const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
 for(const [width,height] of [[360,560],[393,640],[412,680]]){
 const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 try{
 await page.goto('http://127.0.0.1:4173/panda-hsk2-tone-sentence-pilot.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#phrase-select').options.length===11);
 for(const id of ['daily','question','sleep']){
 await page.selectOption('#phrase-select',id);
 await page.waitForFunction(id=>document.querySelector('#phrase-select').value===id&&new URL(location.href).searchParams.get('phrase')===id,id);
 const result=await page.evaluate(()=>{
 const chart=document.querySelector('#whole-chart').getBoundingClientRect();
 const details=document.querySelector('#tone-details');
 return {bottom:chart.bottom,top:chart.top,height:innerHeight,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,open:details.open,buttons:[...document.querySelectorAll('.actions button')].map(e=>{const r=e.getBoundingClientRect();return [r.x,r.y]})};
 });
 assert(result.bottom<=result.height+1,JSON.stringify({width,height,id,...result}));
 assert(result.top>=0);assert(result.scrollWidth<=result.width+1);assert(!result.open);
 assert.equal(result.buttons[0][1],result.buttons[1][1]);assert.equal(result.buttons[2][1],result.buttons[3][1]);assert(result.buttons[2][1]>result.buttons[0][1]);
 }
 await page.locator('#tone-details > summary').click();assert(await page.locator('#tone-details').evaluate(e=>e.open));
 await page.locator('#tone-details > summary').click();assert(!(await page.locator('#tone-details').evaluate(e=>e.open)));
 console.log('PASS',width,height);
 }finally{await page.close();}
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
