import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {estimatePitch, analyseContour, findOctaveDiscontinuities, semitones} from '../assets/panda-tone-analytics-v457.mjs';

// Synthetic contours test the F0 math; they cannot validate real Mandarin speech.
const contour = (fn, n = 36, step = .035) =>
  Array.from({length: n}, (_, i) => ({t: i * step, hz: fn(i / (n - 1)), clarity: .99}));
function shape(name, points, expected) {
  const result = analyseContour(points);
  assert.equal(result.kind, expected, name + ': ' + result.label);
  assert.equal(result.isToneGrade, false, name + ': NEVER certify a Mandarin tone from F0 alone');
  assert(result.stats?.voicedFrames >= 16);
  assert(result.stats?.duration >= .5);
}

test('pitch conversion: one octave is twelve semitones', () => {
  assert(Math.abs(semitones(440, 220) - 12) < 1e-9);
  assert(Math.abs(semitones(220, 440) + 12) < 1e-9);
});
test('flat F0 contour', () => shape('flat', contour(() => 205), 'level'));
test('rising F0 contour', () => shape('rise', contour(u => 155 + 85 * u), 'rise'));
test('dipping F0 contour', () => shape('dip', contour(u => u < .54 ? 220 - 88 * u / .54 : 132 + 78 * (u - .54) / .46), 'dip'));
test('falling F0 contour', () => shape('fall', contour(u => 270 - 100 * u), 'fall'));
test('short/empty speech is insufficient and cannot be scored', () => {
  for (const points of [[], contour(() => 210, 9), contour(u => 200 + 20 * u, 12, .03)]) {
    const result = analyseContour(points);
    assert.equal(result.kind, 'insufficient');
    assert.equal(result.isToneGrade, false);
  }
});
test('short but stable recording shows a partial line without any grade', () => {
  const sample = contour(u => 185 + 28*u, 12, .028);
  const result=analyseContour(sample);
  assert.equal(result.kind, 'insufficient');
  assert.equal(result.isToneGrade, false);
  assert.equal(result.points.length, 12);
  assert.equal(result.stats.previewOnly, true);
});
test('short discontinuous recording never paints a misleading connected line', () => {
  const sample=contour(() => 200, 11, .028);
  sample[10].t+=.11;
  const result=analyseContour(sample);
  assert.equal(result.kind, 'insufficient');
  assert.equal(result.isToneGrade, false);
  assert.equal(result.points.length,0);
});
test('octave-tracking jumps produce uncertainty, never a false grade', () => {
  const points = contour(() => 190);
  points[18].hz = 380;
  assert(findOctaveDiscontinuities(points).length > 0);
  const result = analyseContour(points);
  assert.equal(result.kind, 'uncertain');
  assert.equal(result.isToneGrade, false);
});
test('invalid pitch samples cannot fabricate a tone', () => {
  const result = analyseContour(Array.from({length: 30}, (_, i) => ({t: i * .04, hz: i % 2 ? NaN : 0})));
  assert.equal(result.kind, 'insufficient');
  assert.equal(result.isToneGrade, false);
});
test('pure 220 Hz signal can be tracked', () => {
  const rate = 48000, expected = 220;
  const signal = Float32Array.from({length: 4096}, (_, i) => .24 * Math.sin(2 * Math.PI * expected * i / rate));
  const result = estimatePitch(signal, rate);
  assert(result, 'a clean periodic signal must yield pitch');
  assert(Math.abs(result.hz - expected) < expected * .06, 'estimated F0: ' + result.hz);
  assert(result.clarity > .78);
});
test('silence is not pitch', () => assert.equal(estimatePitch(new Float32Array(4096), 48000), null));
test('pilot continues to describe contour analysis rather than tone grading', () => {
  const html = fs.readFileSync(fileURLToPath(new URL('../panda-tone-lab.html', import.meta.url)), 'utf8');
  const ui = fs.readFileSync(fileURLToPath(new URL('../assets/panda-tone-lab-ui-v457.mjs', import.meta.url)), 'utf8');
  assert(html.includes('panda-tone-lab-ui-v457.mjs'));
  assert(ui.includes('analyseContour'));
  assert(ui.includes('getUserMedia'));
  assert(ui.includes('NO speech uploads, no ASR or scoring'));
});
