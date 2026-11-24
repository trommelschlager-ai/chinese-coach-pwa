import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import fs from 'node:fs';
const base=process.env.QA_BASE||'http://127.0.0.1:4173',out='qa/street-native-standard';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
const expected=['cover',...Array(4).fill('phrase'),'dialogue','tone',...Array(4).fill('phrase'),'grammar',...Array(3).fill('build'),...Array(4).fill('phrase'),'dialogue','dialogue',...Array(5).fill('listen'),...Array(3).fill('record'),'finish','ai'];
const orders={1:[[2,3,1,0],[1,2,0],[2,1,0]],2:[[3,2,0,1],[2,1,0],[1,2,0]]};let count=0;
try{for(const [width,height] of [[360,640],[393,873],[412,915]]){
 const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,permissions:['microphone']});
 for(const n of [1,2]){const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/panda-street-slang-lesson'+n+'-preview.html?welcome=1');await page.locator('#pg-content[data-stage]').waitFor();
 for(let k=0;k<expected.length;k++){const stage=expected[k],area=page.locator('#pg-content');assert.equal(await area.getAttribute('data-stage'),stage);assert.equal(await page.locator('#pg-counter').textContent(),String(k+1).padStart(2,'0')+' / '+expected.length);
 const layout=await page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();return{w:document.documentElement.scrollWidth,h:innerHeight,b:r('#pg-footer').bottom,ct:r('#pg-content').top,cb:r('#pg-content').bottom,ft:r('#pg-footer').top,hb:r('[data-pg-hsk1-header]').bottom}});
 assert(layout.w<=width+2&&layout.b<=height+2&&layout.cb<=layout.ft+2&&layout.hb<=layout.ct+2,'Layout '+n+'/'+k+'/'+width);
 if(stage==='build'){const i=Number(await area.getAttribute('data-item'));assert(await page.locator('#pg-next').isDisabled());await page.locator('#verify').click();assert(await page.locator('#pg-next').isDisabled());for(const j of orders[n][i])await page.locator('[data-add="'+j+'"]').click();await page.locator('#verify').click();assert(await page.locator('#pg-next').isEnabled());}
 if(stage==='listen'){const i=Number(await area.getAttribute('data-item')),a=page.locator('[data-say]');if(await a.isEnabled()){await a.click();await page.locator('[data-answer]:enabled').first().waitFor();const correct=[0,1,2,6,7][i];await page.locator('[data-answer="'+correct+'"]').click();assert(await page.locator('#pg-next').isEnabled());}else assert(await page.locator('#pg-next').isEnabled());}
 if(stage==='record'&&Number(await area.getAttribute('data-item'))===0){await page.locator('#record-start').click();await page.locator('#record-stop').waitFor();await page.waitForTimeout(700);await page.locator('#record-stop').click();await page.locator('#record-listen').waitFor();}
 if([0,1,5,6,11,12,19,21,26,29,30].includes(k))await page.screenshot({path:out+'/'+n+'-'+width+'-'+(k+1)+'.png',animations:'disabled'});
 count++;if(k<expected.length-1){await page.waitForTimeout(320);await page.locator('#pg-next').click();await page.waitForFunction(c=>document.querySelector('#pg-counter').textContent===c,String(k+2).padStart(2,'0')+' / '+expected.length);}}
 assert.deepEqual(errors,[]);await page.close();}await ctx.close();}assert.equal(count,186);console.log('PASS '+count+' screens');}finally{await browser.close();}
