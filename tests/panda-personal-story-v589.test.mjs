import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {understandDayAnswer,getDayCorrectionLine} from '../assets/panda-hsk2-day-understanding-v1.mjs';
const source=fs.readFileSync(new URL('../assets/panda-hsk2-my-day-scenario-v1.mjs',import.meta.url),'utf8');
const start=source.indexOf('const PERSONAL_STORY_KEY'),end=source.indexOf('function init(stage)',start);
assert(start>=0&&end>start);
const storyNorm=s=>String(s||'').normalize('NFC').replace(/[。？！!?，,.\s、]/gu,'');
const {personalStoryLines,readPersonalStory}=new Function('norm','getDayCorrectionLine',source.slice(start,end)+'\nreturn {personalStoryLines,readPersonalStory}')(storyNorm,getDayCorrectionLine);
test('preserves actual weekend and approximate time',()=>{
 const a=understandDayAnswer('周末八点左右',0);
 assert.equal(a.value,'我周末八点左右起床。');
 const [row]=personalStoryLines([a.value]);
 assert.match(row[1],/zhōumò.*zuǒyòu/);
 assert.match(row[2],/выходных.*примерно/);
});
test('negative breakfast remains negative, skipped answers are absent',()=>{
 const a=understandDayAnswer('不吃',2);
 const rows=personalStoryLines([null,null,a.value,null,null]);
 assert.equal(rows.length,1);
 assert.equal(rows[0][0],'我早上不吃早饭。');
 assert.match(rows[0][2],/не завтракаю/);
});
test('accepted short activity becomes first person, without extra facts',()=>{
 const a=understandDayAnswer('喝咖啡',1);
 const [row]=personalStoryLines([a.value]);
 assert.equal(row[0],'我起床以后喝咖啡。');
 assert.match(row[1],/hē kāfēi/);
});
test('unknown content is preserved without invented translation',()=>{
 const [row]=personalStoryLines(['我早上吃面条。']);
 assert.equal(row[0],'我早上吃面条。');
 assert.equal(row[1],'');
 assert.match(row[2],/пока не проверены/);
});
test('local story can be read; damaged or oversized storage is rejected',()=>{
 const values=['我不上班。'];
 assert.deepEqual(readPersonalStory({getItem:()=>JSON.stringify(values)}),values);
 assert.deepEqual(readPersonalStory({getItem:()=>'{broken'}),[]);
 assert.deepEqual(readPersonalStory({getItem:()=>JSON.stringify(Array(6).fill('我不上班。'))}),[]);
 assert.deepEqual(readPersonalStory(null),[]);
});

test('supports three morning activities and retains their order',()=>{
 const a=understandDayAnswer('起床以后洗澡然后跑步再喝茶',1);
 assert.equal(a.kind,'accepted');
 const [row]=personalStoryLines([a.value]);
 assert.equal(row[0],'我起床以后洗澡然后跑步再喝茶。');
 assert.match(row[1],/xǐzǎo ránhòu pǎobù zài hē chá/);
 assert.match(row[2],/душ затем бегаю потом пью чай/);
});
test('retains frequency and negation instead of guessing',()=>{
 for(const [input,expected] of [['我从来不吃早饭','никогда не завтракаю'],['我有时候吃早饭','иногда завтракаю'],['我很少吃早饭','редко завтракаю']]){
  const a=understandDayAnswer(input,2);
  assert.equal(a.kind,'accepted');
  assert.match(personalStoryLines([a.value])[0][2],new RegExp(expected));
 }
});
test('unsupported negative morning activity is not mistranslated',()=>{
 const [row]=personalStoryLines(['我起床以后不跑步。']);
 assert.equal(row[0],'我起床以后不跑步。');
 assert.equal(row[1],'');
});
test('story window is scoped and only shown after results or on request',()=>{
 assert(source.includes("document.createElement('dialog');personal.className='pg-personal-dialog'"));
 assert(source.includes("personalOpen.hidden=!['ready','results'].includes(phase)||!rows.length"));
 assert(source.includes("personal.showModal()"));
 assert(source.includes("grid-template-columns:44px minmax(0,1fr) 44px"));
});
