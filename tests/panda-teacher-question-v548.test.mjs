import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {lookupApprovedPandaVoice} from '../assets/panda-approved-voice-registry-v516.mjs';

const source=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('the THREE earlier Luvvoice teacher clips exist and have exact distinct text',()=>{
 for(const [zh,suffix] of [
  ['你是老师吗？','p01.mp3'],
  ['我也是老师。','p02.mp3'],
  ['我是老师。','p03.mp3'],
 ]){
  const clip=lookupApprovedPandaVoice(zh);
  assert(clip, 'Missing approved voice for '+zh);
  assert.equal(clip.src,'./assets/panda-live-voice-v3/'+suffix);
  const path=new URL('../'+clip.src.replace(/^\.\//,''),import.meta.url);
  assert(statSync(path).size>1000,'Teacher voice MP3 must not be empty: '+suffix);
 }
});

test('PA-001 is reserved for learner statement 我是老师 and is NOT the answer to teacher question',()=>{
 const clip=lookupApprovedPandaVoice('你是老师！你在哪儿工作？');
 assert(clip?.src.endsWith('/PA-001.mp3'));
 assert.notEqual(clip.src,lookupApprovedPandaVoice('我是老师。')?.src);
});

test('both free and short dialogue recognize 你是老师吗 without falling through to 我没听懂',()=>{
 const core=source('../assets/panda-hsk2-preview-core-v1.mjs');
 assert.match(core,/teacherQuestion==='你是老师吗'\|\|teacherQuestion==='你是老师'/);
 assert.match(core,/if\(!hsk2&&!state\.dayMode\)/);
 assert.match(core,/learner\(input,\{/);
 assert.match(core,/hanzi:'我是老师。',pinyin:'Wǒ shì lǎoshī\.',ru:'Я учитель\.'/);
 assert.match(core,/say\(teacherReply,!!lookupPandaVoiceClip\(teacherReply\.hanzi\)\)/);
 const begin=core.indexOf("teacherQuestion==='你是老师吗'");
 assert(begin>0);
 const natural=core.indexOf('const natural=respondToNaturalStatement');
 const nonstop=core.indexOf("if(state.mode==='nonstop'){",begin);
 assert(begin<natural&&begin<nonstop,'Teacher question must be handled before generic fallback and both modes');
});

test('Panda AI pages and offline SW use v548 teacher-question handler; approved natural audio remains v546',()=>{
 const html=source('../panda-voice-pilot.html'),hsk2=source('../panda-ai-hsk2-preview.html');
 const sw=source('../sw.js'),pack=JSON.parse(source('../assets/offline-pack.json'));
 assert.equal(pack.version,548);
 assert.match(sw,/const CACHE='chinese-coach-pwa-v548-/);
 for(const page of [html,hsk2])assert(page.includes('panda-hsk2-preview-core-v1.mjs?v=548'));
 assert(sw.includes('panda-hsk2-preview-core-v1.mjs?v=548'));
 assert(pack.files.includes('./assets/panda-hsk2-preview-core-v1.mjs?v=548'));
 assert(html.includes('panda-hsk2-preview-ui-v1.mjs?v=546'));
 assert(sw.includes('panda-ai-natural-voice-batch01-v546.mjs?v=546'));
});
