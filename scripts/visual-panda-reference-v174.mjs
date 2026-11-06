import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
const out='qa/panda-v174';
const sizes=[[320,640],[360,740],[390,844],[430,932]];
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report={screens:[],errors:[]};
try{
 for(const [width,height] of sizes){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await ctx.newPage();
  page.on('pageerror',err=>report.errors.push({width,height,error:err.message}));
  await page.goto(base+'/index.html',{waitUntil:'load'});
  await page.locator('#pg130:not([hidden]) .pg-hsk-level-list').waitFor();
  await page.locator('#pg130 .pg-hsk-backdrop img').evaluate(img=>img.decode());
  const home=await page.evaluate(()=>{
   const root=document.querySelector('#pg130 .pg-hsk-page');
   const cards=[...root.querySelectorAll('.pg-hsk-level')];
   const box=el=>{const a=el.getBoundingClientRect();return {x:a.x,y:a.y,width:a.width,height:a.height,right:a.right,bottom:a.bottom}};
   return {docW:document.documentElement.scrollWidth,
     root:box(root),cards:cards.map(box),labels:cards.map(x=>x.querySelector('strong').textContent),
     icons:[...root.querySelectorAll('.pg-hsk-level img')].map(img=>({ok:img.complete&&img.naturalWidth>0,src:img.getAttribute('src')})),
     heroSrc:root.querySelector('.pg-hsk-backdrop img')?.getAttribute('src'),
     goldBorder:getComputedStyle(cards[0]).borderColor,
     backdrop:root.querySelector('.pg-hsk-backdrop img')?.naturalWidth
   };
  });
  assert.equal(home.cards.length,6,'Need six real, clickable HSK level entries');
  assert.deepEqual(home.labels,['HSK 1','HSK 2','HSK 3','HSK 4','HSK 5','HSK 6']);
  assert(home.heroSrc.endsWith('panda-go-hero-clean-v174.webp')&&home.backdrop>0,'Clean panda artwork must load');
  assert(home.icons.length===3&&home.icons.every(x=>x.ok),'Three detailed approved pictograms must load');
  assert(home.cards.every(c=>c.x>=-3&&c.right<=width+3),'HSK cards overflow '+width);
  assert(home.cards.at(-1).bottom<=height+4,'Last HSK card clipped at '+width+'x'+height+': '+home.cards.at(-1).bottom);
  await page.screenshot({path:out+'/01-home-'+width+'x'+height+'.png',fullPage:true,animations:'disabled'});
  await page.locator('#pg130 a[href="./hsk1-map.html"]').click();
  await page.waitForURL('**/hsk1-map.html');
  const map=await page.evaluate(()=>{
   const root=document.querySelector('.map-shell'),stairs=root.querySelector('.pg-stone-stairs'),panda=root.querySelector('.panda');
   const rect=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
   return {docW:document.documentElement.scrollWidth,root:rect(root),
     scenic:getComputedStyle(root).backgroundImage,
     stairs:stairs&&{loaded:stairs.complete&&stairs.naturalWidth>0,box:rect(stairs)},
     panda:panda&&{loaded:panda.complete&&panda.naturalWidth>0,box:rect(panda)},
     cards:[...root.querySelectorAll('.node')].map(x=>({...rect(x),num:x.dataset.num,label:x.querySelector('strong')?.textContent,locked:x.classList.contains('locked')})),
     heading:root.querySelector('.map-title h1').textContent};
  });
  assert.equal(map.heading,'HSK 1');
  assert.equal(map.cards.length,7,'Seven real lessons should show');
  assert(map.stairs?.loaded&&map.panda?.loaded,'Stairs and explorer panda should render');
  assert(map.scenic.includes('panda-hsk1-mountain-v174.webp'),'Mountain backdrop not installed');
  assert(map.cards.every(c=>c.x>=-2&&c.right<=width+3&&c.bottom<=height+3),'Lesson cards clipped at '+width+' '+JSON.stringify(map.cards));
  assert(map.cards.some(c=>c.locked),'Future lessons should display locks');
  await page.screenshot({path:out+'/02-map-'+width+'x'+height+'.png',fullPage:true,animations:'disabled'});
  await page.locator('.node[data-num="1"]').click();
  await page.waitForURL('**/hsk1-lesson.html?lesson=1');
  assert.equal(await page.locator('.lesson-step').count(),7,'Lesson remains fully functional');
  report.screens.push({width,height,home,map});
  await ctx.close();
 }
 assert.deepEqual(report.errors,[],'Browser JS errors on approved HSK screens');
 console.log('PASS v174: 6 responsive glossy HSK levels, 3 image stickers, 7 compact lessons, vivid mountain art, 3D steps, explorer and working HSK1 route at 320-430px.');
}catch(e){report.failure=String(e.stack||e);throw e}
finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close()}
