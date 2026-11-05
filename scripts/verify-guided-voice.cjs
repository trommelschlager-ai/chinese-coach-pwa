const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');

for (const lesson of [1, 2, 3, 4]) {
  const dom = new JSDOM(fs.readFileSync('start-chinese.html', 'utf8'), {
    url: 'https://example.test/start-chinese.html?lesson=' + lesson,
    runScripts: 'outside-only',
  });
  const window = dom.window;
  window.scrollTo = () => {};
  const played = [];
  window.Audio = function (file) {
    assert(file?.startsWith('./assets/guided-voice-v1506/'), 'All playback must use the unified voice');
    assert(fs.existsSync(file), 'Recording exists');
    this.play = () => { played.push(file); return Promise.resolve(); };
    this.pause = () => {};
  };
  window.eval(fs.readFileSync('assets/guided-voice-v1506.js', 'utf8'));
  window.eval(fs.readFileSync('assets/guided-introduction.js', 'utf8'));
  const document = window.document;
  const next = document.getElementById('next');
  next.click();
  const wordButtons = [...document.querySelectorAll('[data-word]')];
  for (const button of wordButtons) button.click();
  assert.equal(played.length, wordButtons.length, 'Every word has audio');
  if (lesson === 4) {
    assert.equal(played.at(-1), window.courseGuidedAudio['北京'], 'Beijing now has its own recording');
  }
  next.click();
  next.click();
  const lineButtons = [...document.querySelectorAll('[data-listen]')];
  for (const button of lineButtons) button.click();
  assert.equal(played.length, wordButtons.length + lineButtons.length, 'Every dialogue line has audio');
  next.click();
  document.querySelector('[data-answer=no]').click();
  assert(next.disabled);
  document.querySelector('[data-answer=yes]').click();
  assert(!next.disabled);
  next.click();
  next.click();
  assert(document.querySelector('h1').textContent.includes('завершён'));
  window.close();
}
const html = fs.readFileSync('start-chinese.html', 'utf8');
assert(!html.includes('human-audio-map.js'), 'Guided page no longer loads mixed recording maps');
const metadata = JSON.parse(fs.readFileSync('assets/guided-voice-v1506/status.json'));
assert.equal(metadata.voice, 'zh-CN-XiaoxiaoNeural');
assert.equal(Object.keys(metadata.entries).length, 27);
console.log('Four guided lessons: unified voice, 27 recordings, all playback buttons and completion passed.');
