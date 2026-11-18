import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import fs from 'node:fs';
const base=process.env.PANDA_TEST_BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const errors=[];
try{
 const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,permissions:['microphone','clipboard-read','clipboard-write'],locale:'ru-RU'});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/panda-tone-lab.html',{waitUntil:'networkidle',timeout:30000});
 assert.match(await page.locator('h1').innerText(),/Китайские тоны/);
 assert.equal(await page.locator('[data-tone]').count(),2);
 assert.equal(await page.locator('[data-tone="2"]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-tone="3"]').click();
 assert.equal(await page.locator('[data-tone="3"]').getAttribute('aria-pressed'),'true');
 assert.match(await page.locator('#prompt').innerText(),/yǔ/);
 const status=page.locator('#status');
 await page.locator('#record').click();
 await status.filter({hasText:/Микрофон включён/}).waitFor({timeout:12000});
 assert.equal(await page.locator('#stop').isDisabled(),false);
 await page.waitForTimeout(1700);
 await page.locator('#stop').click();
 await status.filter({hasText:/Готово|Голоса было недостаточно/}).waitFor({timeout:15000});
 assert.equal(await page.locator('#record').isDisabled(),false);
 assert.equal(await page.locator('#copy-trace').isDisabled(),false);
 await page.locator('#copy-trace').click();
 const trace=JSON.parse(await page.evaluate(()=>navigator.clipboard.readText()));
 assert.equal(trace.tone,3);
 assert.equal(trace.syllable,'yǔ');
 assert.ok(trace.capture?.totalChecks>0,'Browser must report raw microphone sampling checks');
 assert.ok(trace.capture?.elapsedSec>=1.0,'Capture duration must not be confused with voice span');
 const c=trace.capture;
 assert.equal(c.totalChecks,c.accepted+c.silence+c.noStablePitch+c.lowClarity,'Every check must have exactly one outcome');
 assert.equal(c.accepted,trace.pitchHz.length,'Accepted F0 points must match exported curve');
 assert.ok(Number.isFinite(c.peakRms));
 assert.equal(c.thresholdRms,0.012);
 assert.ok(await page.locator('#mic-level').count()===1);
 if(c.accepted>0){
  assert.ok(c.firstPitchSec>=0 && c.lastPitchSec>=c.firstPitchSec);
  assert.ok(c.lastPitchSec<=c.elapsedSec+.15);
  assert.ok(c.firstSignalSec<=c.firstPitchSec);
  assert.ok(c.lastSignalSec>=c.lastPitchSec);
 }

 const title=await page.locator('#result .result-title').innerText();
 assert.ok(title.length>7);
 assert.ok(!/правильн.*тон|оценка:|100%/.test(title),'Do not falsely grade tones');
 fs.mkdirSync('qa/panda-tone-lab',{recursive:true});
 await page.screenshot({path:'qa/panda-tone-lab/android-393x852.png',fullPage:true});
 assert.deepEqual(errors,[],'No browser JS errors');
 console.log('PASS: Mobile Chromium 393x852, 2-tone selector, explicit mic permission, voiced/insufficient feedback, cleaned mic, pitch-capture counters and manual JSON export, no JS errors.');
 await context.close();
}finally{await browser.close()}
