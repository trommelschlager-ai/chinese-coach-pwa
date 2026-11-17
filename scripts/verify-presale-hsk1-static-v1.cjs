'use strict';

// Static pre-sale safety net. No network, synthetic speech, or UI changes.
// This checks that directly referenced local resources and approved audio URLs
// are present. It cannot verify actual sound, tones or physical Android behavior.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const lessonPages = [
  'hsk1-map.html',
  'hsk1-first-v189.html',
  'hsk1-second-v203.html',
  'hsk1-third-v212.html',
  'hsk1-fourth-v214.html',
  'hsk1-fifth-v227.html',
  'hsk1-lesson.html', // lesson 6 and 7 redirects originate here
  'hsk1-family-v231.html',
  'hsk1-weather-v231.html',
  'hsk1-pronunciation.html',
  'panda-lesson1.html',
  'panda-voice-pilot.html'
];
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
function localRef(url) {
  if (/^(?:https?:|data:|blob:|mailto:|tel:|javascript:|#|\/\/)/i.test(url)) return null;
  const rel = decodeURIComponent(url.split(/[?#]/)[0].replace(/^\.\//, ''));
  if (!rel) return null;
  const normalized = path.normalize(rel);
  assert(!path.isAbsolute(normalized) && normalized !== '..' && !normalized.startsWith('..' + path.sep),
    'Unsafe local reference: ' + url);
  return normalized;
}
function expectAsset(rel, where) {
  const full = path.join(root, rel);
  assert(fs.existsSync(full), where + ': missing ' + rel);
  assert(fs.statSync(full).isFile(), where + ': not a file ' + rel);
}
test('all approved HSK1 lesson and Panda AI pages have their directly linked local files', () => {
  let references = 0;
  for (const page of lessonPages) {
    expectAsset(page, 'page');
    for (const match of read(page).matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)) {
      const rel = localRef(match[1]);
      if (!rel) continue;
      expectAsset(rel, page);
      references++;
    }
  }
  assert(references >= 120, 'Unexpected reduction in checked resource references: ' + references);
});
test('approved HSK1 map keeps seven distinct, navigable lesson destinations', () => {
  const map = read('hsk1-map.html');
  const found = [...map.matchAll(/<a\s+class="lesson"\s+data-num="(\d)"[^>]+href="([^"]+)"/g)];
  assert.equal(found.length, 7, 'Expected seven linked lesson cards');
  const nums = found.map(m => Number(m[1])).sort();
  assert.deepEqual(nums, [1, 2, 3, 4, 5, 6, 7]);
  for (const m of found) expectAsset(localRef(m[2]), 'lesson card ' + m[1]);
  const legacy = read('hsk1-lesson.html');
  for (const [n, target] of [['6', 'hsk1-family-v231.html'], ['7', 'hsk1-weather-v231.html']]) {
    assert(legacy.includes("get('lesson')==='" + n + "'"), 'Missing lesson ' + n + ' redirect guard');
    assert(legacy.includes("location.replace('./" + target + "')"), 'Missing lesson ' + n + ' redirect destination');
  }
});
test('Panda AI exact-recording table points to real nonempty MP3 files', () => {
  const source = read('assets/panda-live-audio.mjs');
  const refs = [...source.matchAll(/["'](\.\/assets\/[^"']+\.mp3)["']/g)].map(m => m[1]);
  assert(refs.length >= 30, 'Unexpected reduction in Panda AI legacy exact recordings');
  for (const ref of refs) {
    const rel = localRef(ref);
    expectAsset(rel, 'Panda AI recording');
    assert(fs.statSync(path.join(root, rel)).size >= 2000, 'Suspiciously small MP3: ' + rel);
  }
});
