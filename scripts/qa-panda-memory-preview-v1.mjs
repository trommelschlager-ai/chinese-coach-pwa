// Panda Memory preview smoke: real browser, opt-in, approved MP3, offline reload.
// Uses panda.localhost to exercise production-style Service Worker fetch fallback.
// The approved MP3 is fulfilled from this repository so the test needs no cloud traffic.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox','--host-resolver-rules=MAP panda.localhost 127.0.0.1']});
try {
  const context=await browser.newContext({
    viewport:{width:393,height:852},isMobile:true,hasTouch:true,serviceWorkers:'allow'
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',err=>errors.push(String(err)));
  await page.route('https://trommelschlager-ai.github.io/chinese-coach-pwa/assets/panda-context-voice-20261122/chat03.mp3',
    route=>route.fulfill({
      status:200,
      path:'assets/panda-context-voice-20261122/chat03.mp3',
      contentType:'audio/mpeg',
      headers:{'access-control-allow-origin':'*','cache-control':'no-store'}
    }));
  await page.goto('http://panda.localhost:4173/panda-memory-preview.html',{waitUntil:'domcontentloaded'});
  await page.locator('#save').click();
  await page.waitForFunction(()=>document.querySelector('#saveStatus')?.textContent.includes('Сначала включи согласие'));
  assert.equal(await page.locator('#listen').isDisabled(),true);

  await page.locator('#consent').check();
  await page.locator('#save').click();
  await page.waitForFunction(()=>document.querySelector('#saveStatus')?.textContent.includes('Сохранено на телефоне'),null,{timeout:12000});
  assert.match(await page.locator('#saveStatus').textContent(),/MP3 Xiaoxiao/);
  await page.locator('#recall').click();
  assert.equal(await page.locator('#result .zh').textContent(),'我喜欢喜剧片。');
  assert.equal(await page.locator('#result .py').textContent(),'Wǒ xǐhuan xǐjùpiàn.');
  assert.equal(await page.locator('#result .ru').textContent(),'Я люблю комедии.');
  assert.equal(await page.locator('#listen').isDisabled(),false);

  await page.locator('#prepare').click();
  await page.waitForFunction(()=>document.querySelector('#saveStatus')?.textContent.includes('Экран и код подготовлены для офлайна'),null,{timeout:40000});
  assert.equal(await page.evaluate(()=>!!navigator.serviceWorker.controller),true,'Service Worker should control preview');

  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:12000});
  await page.waitForFunction(()=>document.querySelector('#network')?.textContent.includes('Без интернета'),null,{timeout:9000});
  await page.locator('#query').fill('我想看喜剧片！');
  await page.locator('#recall').click();
  assert.equal(await page.locator('#result .zh').textContent(),'我喜欢喜剧片。');
  assert.equal(await page.locator('#listen').isDisabled(),false);

  await page.locator('#listen').click();
  await page.waitForFunction(()=>/Играет сохранённая запись Xiaoxiao/.test(document.querySelector('#testStatus')?.textContent||''),null,{timeout:7000});

  await page.locator('#delete').click();
  await page.waitForFunction(()=>document.querySelector('#saveStatus')?.textContent.includes('ещё не сохранена'));
  await page.locator('#recall').click();
  assert.equal(await page.locator('#listen').isDisabled(),true);
  assert.match(await page.locator('#testStatus').textContent(),/пока нет/);
  assert.deepEqual(errors,[],'JavaScript errors in Panda Memory preview');
  console.log('PASS Panda Memory preview: consent, true MP3 save, offline reload, offline playback, deletion on 393px mobile Chromium');
  await context.close();
} finally { await browser.close(); }
