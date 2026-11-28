import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import '../assets/panda-street-voice-v20261125.js';
import '../assets/panda-street-lesson3.js';
import {createStreetBrain} from '../assets/panda-street-shared-brain-v1.mjs';

const voice = globalThis.PandaStreetVoiceV20261125;
const lesson = globalThis.PandaStreetLesson3;
const lines = lesson.words.map(([zh, py, ru]) => ({zh, py, ru}));

test('all 27 lesson lines resolve to unique, byte-exact clip files', () => {
  const paths = new Set();
  for (const [index, {zh}] of lines.entries()) {
    const clip = voice.lookup(zh, 'male');
    assert.equal(clip.file, String(index + 1).padStart(2, '0') + '.mp3');
    assert.equal(voice.byText(zh), clip);
    assert.equal(voice.lookup(zh, 'female'), null);
    const bytes = readFileSync(new URL('../' + clip.src, import.meta.url));
    assert.equal(bytes.length, clip.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), clip.sha256);
    paths.add(clip.src);
  }
  assert.equal(paths.size, 27);
});

test('the lesson entry point and Street brain share the same audio', () => {
  const practiceDialogs = lesson.dialogs.map(dialogue => dialogue.map(i => lines[i]));
  const brain = createStreetBrain({storage: null, practiceDialogs, lookupMale: voice.lookup});
  assert.equal(brain.start('nonstop').zh, lines[17].zh);
  const turn = brain.answer('不太忙，你呢？');
  assert.equal(turn.panda.zh, lines[19].zh);
  assert.equal(voice.lookup(turn.panda.zh), voice.byText(lines[19].zh));
  assert.equal(turn.toneVerified, false);
  assert.equal(brain.answer('这个怎么用啊？').panda.zh, lines[22].zh);
  assert.equal(brain.answer('哎，你去哪儿呀？').panda.zh, lines[24].zh);
  assert.equal(createStreetBrain({storage: null}).start().zh, '哈喽！最近怎么样？');
});
