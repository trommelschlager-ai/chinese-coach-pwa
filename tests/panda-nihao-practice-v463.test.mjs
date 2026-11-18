import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';
const html=fs.readFileSync(new URL('../panda-nihao-practice.html',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../assets/panda-nihao-practice-v463.mjs',import.meta.url),'utf8');

test('written and spoken Mandarin sandhi correctly distinguish nǐ hǎo and ní hǎo',()=>{
 assert.match(html,/你好/);
 assert.match(html,/nǐ hǎo/);
 assert.match(html,/ní hǎo/);
 assert.match(html,/3 \+ 3 → 2 \+ 3/);
 assert.ok(ui.includes("hanzi:'你',pinyin:'ní ↗'"));
 assert.ok(ui.includes("hanzi:'好',pinyin:'hǎo · низкий тон'"));
 assert.ok(ui.includes("hanzi:'你好',pinyin:'ní hǎo'"));
 assert.ok(ui.includes('отдельно 你, это nǐ'),'Never teach isolated 你 as second tone');
});

test('only exact previously approved Panda clip plays 你好',()=>{
 const sample=lookupPandaVoiceClip('你好');
 assert.ok(sample?.src?.startsWith('./assets/'));
 assert.ok(sample.src.endsWith('.mp3'));
 assert.ok(ui.includes("lookupPandaVoiceClip('你好')"));
 assert.ok(ui.includes('new Audio(new URL(clip.src,document.baseURI).href)'));
 assert.ok(!ui.includes('speechSynthesis'));
});

test('third step is whole two-syllable greeting WITHOUT false automatic tone assessment',()=>{
 assert.ok(ui.includes("stage===2?'你好'"));
 assert.ok(ui.includes("mode:stage===2?'whole-phrase-no-tone-grade'"));
 assert.ok(ui.includes("const result=stage===2?null:analyseContour(frames)")||ui.includes("const result=stage===2?null:analyseContour(frames)"),'Whole phrase cannot be treated as a single tone');
 assert.ok(ui.includes('findOctaveDiscontinuities(frames)'));
 assert.ok(html.includes('не разделяет тоны автоматически'));
 assert.ok(!ui.includes('gradeTone'));
});

test('microphone stays local and user can replay their own short recording',()=>{
 for(const required of [
  'navigator.mediaDevices.getUserMedia','audioContext.createMediaStreamSource(stream)',
  'getFloatTimeDomainData','MediaRecorder(stream','URL.createObjectURL(blob)',
  'getTracks().forEach(t=>t.stop())','URL.revokeObjectURL(voiceUrl)',
  "navigator.clipboard.writeText(JSON.stringify(lastTrace))"]){
  assert.ok(ui.includes(required),required);
 }
 for(const forbidden of ['fetch(', 'XMLHttpRequest','WebSocket','localStorage','sessionStorage','speechSynthesis']){
  assert.ok(!ui.includes(forbidden),'Unexpected upload/storage/fake audio '+forbidden);
 }
 assert.ok(html.includes('panda-nihao-practice-v463.mjs?v=463'));
 assert.ok(html.includes('panda-character-clean-v349.webp'));
});
