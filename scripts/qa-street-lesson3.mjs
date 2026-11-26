import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
const out='qa/street-lesson3';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report=[];
const correct=[0,1,2,0,1,2,0,1];
const stages=['cover',...Array(8).fill('card'),'compare',...Array(4).fill('card'),...Array(3).fill('dialogue'),...Array(8).fill('quiz'),'practice','finish'];
for(const [width,height] of [[360,640],[393,873],[412,915]]){
 const row={width,height,screens:0,checks:{},errors:[]};report.push(row);
 const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const area=p.locator('#pg-content'),next=p.locator('#next'),counter=p.locator('#counter');
 const shot=(name)=>p.screenshot({path:out+'/'+width+'-'+name+'.png',animations:'disabled'});
 const check=async(name,fn)=>{try{await fn();row.checks[name]='PASS'}catch(e){row.checks[name]='FAIL';row.errors.push(name+': '+e.message);await shot('fail-'+name.replace(/[^a-z0-9-]/gi,'-')).catch(()=>{});}};
 const layout=async()=>{const v=await p.evaluate(()=>{const a=document.querySelector('#pg-content'),f=document.querySelector('.footer'),ar=a.getBoundingClientRect(),fr=f.getBoundingClientRect();const bad=[...document.querySelectorAll('#app button,#app a')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').filter(e=>{const r=e.getBoundingClientRect();return r.left< -2||r.right>innerWidth+2||r.top< -2||r.bottom>innerHeight+2||(a.contains(e)&&(r.top<ar.top-2||r.bottom>ar.bottom+2))}).map(e=>e.textContent.trim());return{width:document.documentElement.scrollWidth,inner:innerWidth,scroll:a.scrollHeight,visible:a.clientHeight,footer:fr.bottom,h:innerHeight,bad};});assert(v.width<=v.inner+2,'horizontal overflow '+JSON.stringify(v));assert(v.scroll<=v.visible+2,'vertical overflow '+JSON.stringify(v));assert(v.footer<=v.h+2&&v.bad.length===0,'clipped controls '+JSON.stringify(v));};
 try{
 await check('menu-entry',async()=>{await p.goto(base+'/panda-street-hsk1-map.html');await p.locator('[data-act=lessons]').first().click();const link=p.locator('#dlg-content a[href*="lesson3"]');await link.waitFor();await link.click();await counter.waitFor();assert.match(p.url(),/lesson3-preview/);});
 if(!await counter.count())await p.goto(base+'/panda-street-slang-lesson3-preview.html?welcome=1');
 for(let i=0;i<stages.length;i++){
  const stage=stages[i],name=String(i+1).padStart(2,'0')+'-'+stage;
  await check(name+'-screen',async()=>{assert.equal(await p.locator('#app').getAttribute('data-stage'),stage);assert.equal(await counter.textContent(),String(i+1).padStart(2,'0')+' / '+stages.length);await layout();});
  await shot(name);row.screens++;
  if(stage==='card'){
   await check(name+'-swipe',async()=>{const swipe=async(dx)=>area.evaluate((e,dx)=>{const t=e.querySelector('.sheet');const init={pointerId:1,isPrimary:true,pointerType:'touch',clientY:100,button:0,bubbles:true};t.dispatchEvent(new PointerEvent('pointerdown',{...init,clientX:dx<0?250:70}));t.dispatchEvent(new PointerEvent('pointerup',{...init,clientX:dx<0?70:250}));},dx);await swipe(-1);assert.equal(await area.locator('.ex3 .sheet').count(),2);await layout();await shot(name+'-examples');row.screens++;for(const b of await area.locator('[data-audio]').all()){const src=await b.evaluate(el=>globalThis.PandaStreetVoiceV20261125.lookup(decodeURIComponent(el.dataset.audio),'male').src);const response=await p.request.get(new URL(src,p.url()).href);assert(response.ok()&&(await response.body()).length>100,'audio file unavailable');await b.click();}await swipe(1);assert.equal(await area.locator('.particle3').count(),1);await area.locator('[data-side="1"]').click();assert.equal(await area.locator('.ex3 .sheet').count(),2);await area.locator('[data-side="0"]').click();});
   if(await area.locator('[data-side="0"]').count())await area.locator('[data-side="0"]').click();
  }
  if(stage==='dialogue')await check(name+'-toggle',async()=>{await area.locator('[data-toggle=py]').click();assert.equal(await area.locator('.bubble .py').count(),0);await area.locator('[data-toggle=ru]').click();assert.equal(await area.locator('.bubble .ru').count(),0);await area.locator('[data-toggle=py]').click();await area.locator('[data-toggle=ru]').click();assert.equal(await area.locator('.bubble .py').count(),4);});
  if(stage==='quiz'){const q=i-stages.indexOf('quiz'),answer=correct[q];await check(name+'-quiz',async()=>{assert(await next.isDisabled());await area.locator('[data-answer="'+((answer+1)%3)+'"]').click();assert(await next.isDisabled());await area.locator('[data-answer="'+answer+'"]').click();assert(await next.isEnabled());});if(await next.isDisabled())await area.locator('[data-answer="'+answer+'"]').click();}
  if(i===2)await check('resume',async()=>{await p.goto(base+'/panda-street-slang-lesson3-preview.html');assert.equal(await counter.textContent(),'03 / '+stages.length);});
  if(i<stages.length-1){await check(name+'-next',async()=>{assert(await next.isVisible());assert(await next.isEnabled());await next.click();assert.equal(await counter.textContent(),String(i+2).padStart(2,'0')+' / '+stages.length);});if(await counter.textContent()!==String(i+2).padStart(2,'0')+' / '+stages.length)break;}
 }
 await check('score',async()=>{assert.equal(await area.locator('.hanzi').textContent(),'8/8');assert.match(await area.innerText(),/Ошибочные попытки: 8/);});
 await check('return-menu',async()=>{await p.locator('.headrow a').click();assert.match(p.url(),/panda-street-hsk1-map/);});
 await check('javascript',async()=>assert.deepEqual(errors,[]));
 }catch(e){row.errors.push(e.message);}finally{await ctx.close();}
}
await browser.close();fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));assert(report.every(r=>!r.errors.length&&r.screens===39),'Street lesson 3 QA failed or incomplete');
