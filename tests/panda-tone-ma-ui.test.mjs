import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=s=>fs.readFileSync(new URL('../'+s,import.meta.url),'utf8');
const page=read('panda-tone-ma-practice.html');
const trainer=read('assets/panda-tone-ma-pilot-v463.mjs');
const bridge=read('assets/hsk1-tone-practice-bridge-v463.js');
const lesson=read('hsk1-first-v189.html');
test('four learning cards are on one page without navigation between tones',()=>{
 const actual=[...page.matchAll(/data-tone="(\d+)"/g)].map(x=>Number(x[1]));
 assert.deepEqual(actual,[1,2,3,4]);
 for(const word of ['妈','麻','马','骂'])assert(page.includes(word));
 assert(page.includes('id="record"')&&page.includes('id="next"')&&page.includes('id="listen"'));
 assert(!/<form[\s>]/i.test(page));
});
test('existing lesson audio sources are used in an opt-in tone modal',()=>{
 for(const f of ['ma1.mp3','ma2.mp3','ma3.mp3','ma4.mp3']) {
  assert(trainer.includes(f));
  assert(fs.statSync(new URL('../assets/lesson1-xiaoxiao-v260/'+f,import.meta.url)).size>1000);
 }
 assert(lesson.includes('hsk1-tone-practice-bridge-v463.js'));
 assert(bridge.includes('MutationObserver'));
 assert(bridge.includes("frame.src='./panda-tone-ma-practice.html'"));
 assert(bridge.includes("frame.allow='microphone; autoplay'"));
});
test('browser mic resources are explicitly released and there is no automatic tone grading',()=>{
 assert(trainer.includes('getUserMedia'));
 assert(trainer.includes('getTracks().forEach(t=>t.stop())'));
 assert(trainer.includes('ctx?.close()'));
 assert(trainer.includes('analyseContour(frames)'));
 assert(trainer.includes('isSecureContext'));
 assert(trainer.includes("pagehide"));
 assert(!/fetch\s*\(|XMLHttpRequest|sendBeacon/i.test(trainer));
 assert(page.includes('не распознавание китайских слов'));
 assert(page.includes('Нет оценок'));
});
test('new JS files parse in Node without runtime execution',()=>{
 for(const rel of ['assets/panda-tone-ma-pilot-v463.mjs','assets/hsk1-tone-practice-bridge-v463.js']){
  const result=spawnSync(process.execPath,['--check',fileURLToPath(new URL('../'+rel,import.meta.url))],{encoding:'utf8'});
  assert.equal(result.status,0,rel+': '+result.stderr);
 }
});
