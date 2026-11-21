'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const moduleCode = fs.readFileSync(path.join(__dirname, '..', 'assets', 'hsk2-lesson3-tone-meter-v5.js'), 'utf8');
function load(entry = null) {
  const strokes = [];
  const labels = {};
  const canvases = [1, 2].map((number) => {
    const ctx = {
      strokeStyle: '', path: [],
      beginPath() { this.path = []; },
      moveTo(x, y) { this.path.push(['M', x, y]); },
      lineTo(x, y) { this.path.push(['L', x, y]); },
      stroke() {
        if (this.strokeStyle === '#198b70') strokes.push({number, points: this.path.slice()});
      },
      clearRect() {}, fillRect() {}, fillText() {}, setLineDash() {}
    };
    return {width: 360, height: 175, getContext: () => ctx};
  });
  const reps = Array.from({length: 6}, () => ({mic: [], manual: 0}));
  if (entry) reps[0].mic.push(entry);
  const localStorage = {
    getItem() { return JSON.stringify({selected: 0, reps}); },
    setItem() {}
  };
  const document = {
    addEventListener() {},
    getElementById(id) {
      if (id === 'tone-canvas-1') return canvases[0];
      if (id === 'tone-canvas-2') return canvases[1];
      if (id.startsWith('tone-trend-')) return labels[id] ??= {textContent: ''};
      return null;
    }
  };
  const window = {addEventListener() {}};
  vm.runInNewContext(moduleCode, {window, document, localStorage}, {timeout: 4000});
  return {math: window.PandaToneMathV2, trainer: window.PandaToneTrainer, strokes, labels};
}
function contourChanges(deltas, base = 210, begin = .04, end = .46) {
  return deltas.map((semitone, index) => [
    begin + (end - begin) * index / (deltas.length - 1),
    base * 2 ** (semitone / 12)
  ]);
}

test('saved points preserve real timing, live points normalize only once', () => {
  const {math} = load();
  const saved = [[.12, 220], [.28, 200], [.86, 160]];
  assert.equal(math.normalizeChartPoints(saved, false)[0][0], .12);
  assert.equal(math.normalizeChartPoints(saved, false).at(-1)[0], .86);
  const live = [[1.2, 220], [1.6, 200], [2.2, 160]];
  assert.ok(Math.abs(math.normalizeChartPoints(live, true)[1][0] - .4) < 1e-8);
});

test('measured pitch does not invent direction or depend on absolute voice register', () => {
  const {math} = load();
  const delta = [0, -.4, -.9, -1.5, -2.1, -2.8, -3.5];
  const fall = math.semitoneContour(contourChanges(delta), 0, .5);
  const high = math.semitoneContour(contourChanges(delta, 420), 0, .5);
  const rise = math.semitoneContour(contourChanges(delta.map(x => -x)), 0, .5);
  const flat = math.semitoneContour(contourChanges([0, .1, -.1, 0, .12, -.12, 0]), 0, .5);
  assert.ok(fall.at(-1).semitones < -2.8);
  assert.ok(rise.at(-1).semitones > 2.8);
  assert.ok(Math.abs(flat.at(-1).semitones) < .3);
  assert.ok(Math.abs(fall.at(-1).semitones - high.at(-1).semitones) < 1e-8);
});

test('unmeasured gaps use real elapsed seconds, not relative canvas width', () => {
  const {math} = load();
  assert.equal(math.isLongPitchGap(.2, .4, 1), true);
  assert.equal(math.isLongPitchGap(.2, .4, .4), false);
});

test('F0 extractor follows a synthetic 220Hz voice and rejects silence', () => {
  const {math} = load();
  const sampleRate = 44100;
  const buf = Float32Array.from({length: 4096}, (_, i) => .45 * Math.sin(2 * Math.PI * 220 * i / sampleRate));
  assert.ok(Math.abs(math.pitchOf(buf, sampleRate, null) - 220) < 3);
  assert.equal(math.pitchOf(new Float32Array(4096), sampleRate, null), null);
});

test('actual canvas trace is downward/upward without stretching saved syllables', () => {
  const first = contourChanges([0, -.4, -.9, -1.5, -2, -2.8, -3.4], 200, .07, .40);
  const second = contourChanges([0, .4, .9, 1.5, 2.2, 3, 3.5], 210, .55, .91);
  const entry = {
    points: [...first, ...second], seconds: 1, splitRatio: .5,
    splitSource: 'midpoint', quality: 'both', validParts: [true, true], voiceMs: 900
  };
  const {trainer, strokes, labels} = load(entry);
  trainer.mount();
  assert.equal(strokes.length, 2);
  const deltaY = p => p.points.at(-1)[2] - p.points[0][2];
  assert.ok(deltaY(strokes[0]) > 20);
  assert.ok(deltaY(strokes[1]) < -20);
  assert.ok(strokes[0].points[0][1] > 70);
  assert.match(labels['tone-trend-1'].textContent, /↘/);
  assert.match(labels['tone-trend-2'].textContent, /↗/);
});

test('the lesson loads the updated chart without removing prior exercises', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'hsk2-lesson3-work-study-preview.html'), 'utf8');
  assert.ok(html.includes('./assets/hsk2-lesson3-tone-meter-v5.js?v=528'));
  assert.ok(html.includes('hsk2-lesson3'));
});
