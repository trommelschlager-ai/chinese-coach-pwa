import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const origin = 'http://127.0.0.1:4173';
const output = 'qa/hsk2-speech-v559';
const lessons = [
  'about-me', 'lesson1', 'lesson3-work-study-preview', 'lesson4-hobby-preview',
  'lesson5-friends-v2', 'lesson6-yesterday-preview', 'lesson7-future-preview',
  'lesson8-shop-preview', 'lesson9-health-preview', 'lesson10-relationships-preview'
];
const pinyinMarks = {'\u0304':1, '\u0301':2, '\u030c':3, '\u0300':4};
const markedTones = pinyin => [...pinyin.normalize('NFD')].map(mark => pinyinMarks[mark]).filter(Boolean);
const browser = await chromium.launch({args:['--no-sandbox']});
const assets = new Set();
fs.mkdirSync(output, {recursive:true});

async function checkRows(page, entries, checkAudio) {
  const rows = page.locator('.pg-standard-speech-row');
  assert.equal(await rows.count(), entries.length);
  for (const [index, row] of entries.entries()) {
    const card = rows.nth(index);
    assert.equal(await card.locator('.pg-standard-cn').textContent(), row.zh);
    assert.equal(await card.locator('.pg-standard-py').textContent(), row.py);
    assert.equal(await card.locator('.pg-standard-ru').textContent(), row.ru);
    assert.deepEqual(markedTones(row.py), row.tones.filter(Boolean), row.zh);
    assert.equal(row.tones.length, row.zh.replace(/[^\p{Script=Han}]/gu, '').replaceAll('儿','').length, row.zh);
    assert.deepEqual((await card.locator('.pg-standard-tone b').allTextContents()).map(Number), row.tones);
    assert.equal(await card.locator('svg :is(path,circle)').count() >= row.tones.length, true);
    const play = card.locator('button[data-say]');
    assert.equal(await play.count(), 1, 'Missing approved audio · ' + row.zh);
    assert.equal(await play.getAttribute('data-say'), row.zh);
    assert.equal(await card.locator('[data-mic]').count(), 1);
    if (checkAudio) {
      await page.evaluate(() => { window.qaAudio = null; });
      await play.click();
      await page.waitForFunction(() => window.qaAudio?.readyState >= 2, undefined, {timeout:4000});
      const url = await page.evaluate(() => window.qaAudio.currentSrc);
      assert.match(url, /\.mp3(?:\?|$)|^data:audio\/mpeg/);
      if (url.startsWith(origin)) assets.add('.' + decodeURIComponent(url.slice(origin.length)));
    }
  }
}

try {
  for (const width of [360, 393, 412]) {
    let referenceArtWidth;
    for (const [index, lesson] of lessons.entries()) {
      const page = await browser.newPage({viewport:{width,height:800}, isMobile:true, hasTouch:true, serviceWorkers:'block'});
      // The same browser checks can run against a static server or a restricted local runner.
      if (process.env.QA_ROUTE_FILES === '1') {
        await page.route(origin + '/**', route => {
          const file = '.' + decodeURIComponent(new URL(route.request().url()).pathname);
          return fs.existsSync(file) && fs.statSync(file).isFile() ?
            route.fulfill({path:file}) : route.fulfill({status:404});
        });
      }
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        window.SpeechRecognition = class {
          start() { window.qaRecognition = this; }
          abort() {}
        };
        const play = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
          window.qaAudio = this;
          return play.call(this);
        };
      });
      const url = origin + '/hsk2-' + lesson + '.html';
      await page.goto(url);
      const lessonData = await page.evaluate(() => ({
        key, words, phrases, phraseTones:speechPhraseTones, defaults:blank()
      }));
      await page.evaluate(({key, defaults, words}) => localStorage.setItem(key, JSON.stringify({
        ...defaults, step:6, heardWords:words.map((_, i) => i), grammarDone:true,
        unlockedSection:2, migrationV1:true, aboutOriginalVoiceV8:true
      })), lessonData);
      page.on('response', response => {
        if (response.ok() && response.url().startsWith(origin) && /\.(?:mp3|avif|webp|png|svg|jpe?g|m?js|css)(?:\?|$)/i.test(response.url())) {
          assets.add('.' + decodeURIComponent(response.url().slice(origin.length)));
        }
      });
      await page.goto(url + '?step=6');
      assert.equal(await page.locator('#app').getAttribute('data-view'), '6');
      assert.equal(await page.locator('.pg433-tabs [aria-current="step"]').innerText(), '3\nРечь');
      assert.equal(await page.locator('.pg433-pill').textContent(), 'Шаг 3 / 5');
      assert.equal(await page.locator('.tones-hero .tag').textContent(), 'Шаг 3');
      assert.equal(await page.locator('.pg433-counter').textContent(), 'Речь');
      assert.equal(await page.locator('.practice-modes,.pg2-tone-speechlink,.l9-record-controls,.phrase-review,.progress-panel').count(), 0);
      const layout = await page.evaluate(async () => {
        const art = document.querySelector('.pg-speech-art > *');
        const src = art instanceof HTMLImageElement ? art.currentSrc : art.querySelector('image')?.getAttribute('href');
        if (!src) throw new Error('Missing speech artwork source');
        const image = new Image();
        image.src = src;
        await image.decode();
        if (location.pathname.includes('lesson9-health')) {
          assertFullSizeHealthArt(art);
        }
        function assertFullSizeHealthArt(element) {
          if (!(element instanceof HTMLImageElement) ||
              element.naturalWidth !== 320 || element.naturalHeight !== 320 ||
              Math.abs(element.clientWidth - element.parentElement.clientWidth) > 1 ||
              Math.abs(element.clientHeight - element.parentElement.clientHeight) > 1) {
            throw new Error('Health artwork must be a full-size image in its gold frame');
          }
        }
        const rect = selector => document.querySelector(selector).getBoundingClientRect();
        const a = rect('.pg-speech-art'), b = rect('.hero-message'), t = rect('.tone-tabs');
        const listing = document.querySelector('.pg-standard-list');
        const list = listing.getBoundingClientRect();
        const footer = rect('.pg433-footer');
        const workspace = document.querySelector('.pg433-content');
        const top = rect('.pg433-header').top;
        const scrollable = listing.scrollHeight > listing.clientHeight;
        const overflows = [...listing.querySelectorAll('.pg-standard-copy, .pg-standard-speech-row')].some(el => el.scrollWidth > el.clientWidth + 1);
        listing.scrollTop = listing.scrollHeight;
        const pinned = rect('.pg433-header').top === top && rect('.pg433-footer').top === footer.top && workspace.scrollTop === 0;
        listing.scrollTop = 0;
        return {
          artWidth:a.width, artHeight:a.height, gap:b.left-a.right,
          centered:Math.abs((a.top+a.bottom)-(b.top+b.bottom)) < 2,
          vertical:t.top-Math.max(a.bottom,b.bottom), footerGap:footer.top-list.bottom,
          footerBottom:footer.bottom,
          overflow:document.documentElement.scrollWidth > innerWidth || overflows,
          frames: ['.pg-speech-art', '.hero-message'].map(selector =>
            getComputedStyle(document.querySelector(selector)).borderTopColor),
          pinned, scrollable
        };
      });
      referenceArtWidth ??= layout.artWidth;
      assert(Math.abs(layout.artWidth-referenceArtWidth) < 1, JSON.stringify(layout));
      assert(Math.abs(layout.artWidth-layout.artHeight) < 1, JSON.stringify(layout));
      assert.deepEqual(layout.frames, ['rgb(237, 209, 128)', 'rgb(233, 203, 134)']);
      assert(layout.gap >= 8 && layout.gap <= 16 && layout.centered && layout.vertical >= 0, JSON.stringify(layout));
      assert(layout.pinned && layout.scrollable && !layout.overflow && layout.footerGap >= -1 &&
        Math.abs(layout.footerBottom-800) <= 1, JSON.stringify(layout));

      const label = String(index+1).padStart(2, '0');
      await page.screenshot({path:output + '/lesson-' + label + '-' + width + '.png'});
      assert.match(await page.locator('[data-tone-tab="words"]').innerText(), new RegExp('\\(' + lessonData.words.length + '\\)'));
      await checkRows(page, lessonData.words, width === 393);
      await page.locator('[data-tone-tab="phrases"]').click();
      assert.equal(await page.locator('[data-tone-tab="phrases"]').getAttribute('aria-pressed'), 'true');
      assert.match(await page.locator('[data-tone-tab="phrases"]').innerText(), new RegExp('\\(' + lessonData.phrases.length + '\\)'));
      const phrases = lessonData.phrases.map(([zh,py,ru], i) => ({zh,py,ru,tones:[...lessonData.phraseTones[i]].map(Number)}));
      await checkRows(page, phrases, width === 393);
      await page.locator('[data-mic="phrase:0"]').click();
      await page.evaluate(zh => window.qaRecognition.onresult({results:[[{transcript:zh}]],resultIndex:0}), phrases[0].zh);
      assert.match(await page.locator('#feedback').textContent(), /Тоны не оценивались/);
      await page.locator('[data-tone-tab="words"]').click();

      // Confirm the permission-error path can still finish the required speaking step.
      await page.locator('[data-mic="0"]').click();
      await page.evaluate(() => window.qaRecognition.onerror({error:'not-allowed'}));
      assert.equal(await page.locator('.pg-speech-fallback').isVisible(), true);
      if (width === 360) {
        await page.locator('[data-practice-mode="self"]').click();
        await page.locator('[data-self-spoken="0"]').click();
        await page.locator('[data-practice-mode="mic"]').click();
      }
      for (const [i, word] of lessonData.words.entries()) {
        await page.locator('[data-mic="' + i + '"]').click();
        await page.evaluate(zh => window.qaRecognition.onresult({results:[[{transcript:zh}]],resultIndex:0}), word.zh);
      }
      assert.match(await page.locator('#feedback').textContent(), /Тоны не оценивались/);
      const progress = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), lessonData.key);
      assert.equal(progress.mic.length, lessonData.words.length);
      await page.locator('#back').click();
      assert.equal(await page.locator('#app').getAttribute('data-view'), '4');
      assert.equal(await page.locator('.pg433-pill').textContent(), 'Шаг 2 / 5');
      await page.locator('#next').click();
      assert.equal(await page.locator('#app').getAttribute('data-view'), '6');
      await page.locator('#next').click();
      assert.equal(await page.locator('#app').getAttribute('data-view'), '3');
      assert.equal(await page.locator('.pg433-pill').textContent(), 'Шаг 4 / 5');
      await page.reload();
      const persisted = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), lessonData.key);
      assert.equal(persisted.mic.length, lessonData.words.length);
      assert.deepEqual(errors, []);
      await page.close();
      console.log('PASS HSK2 lesson ' + (index+1) + ' · ' + width + ' px');
    }
  }
} finally {
  fs.writeFileSync(output + '/browser-assets.json', JSON.stringify([...assets].sort(), null, 2) + '\n');
  await browser.close();
}
