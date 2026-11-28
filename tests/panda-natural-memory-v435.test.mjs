import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mergePandaFacts435,knowsAnswer435,refineFollowup435} from '../assets/panda-natural-memory-v435.mjs';
import {availableAskGroups} from '../assets/panda-ask-catalog-v326.mjs';
import {lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';

const allowed=[1,2,3,4,5,6,7];
const catalog=availableAskGroups(allowed,[],new Date(2026,10,17));
const original=(hanzi,lesson)=>({hanzi,lesson});
const select=(followup,profile,options={})=>refineFollowup435({
 followup,profile,allowed:options.allowed||allowed,
 questions:options.questions||[],history:options.history||[],
 catalog:options.catalog||catalog,
 lookupAudio:options.lookupAudio||lookupPandaVoiceClip
});

test('family correction clears stale age but retains unrelated personal memory',()=>{
 const before={family:{妹妹:true,哥哥:false},siblingAges:{妹妹:8},
  name:'小明',followupOffset:3};
 const after=mergePandaFacts435(before,{
  known:true,topic:6,family:{absent:'妹妹',present:[]}
 });
 assert.equal(after.family.妹妹,false);
 assert.equal(after.family.哥哥,false);
 assert.equal(after.siblingAges.妹妹,undefined);
 assert.equal(after.name,'小明');
 assert.equal(after.followupOffset,3);
 assert.equal(before.siblingAges.妹妹,8,'memory update must not mutate the original');
});
test('the learner can revise an earlier negative answer without losing other facts',()=>{
 const before={family:{哥哥:false}};
 const after=mergePandaFacts435(before,{
  known:true,topic:6,family:{absent:null,present:['哥哥']}
 });
 assert.equal(after.family.哥哥,true);
});
test('known sibling age establishes sibling existence',()=>{
 const next=mergePandaFacts435({family:{}},{
  known:true,topic:6,fact:{relative:'妹妹',relativeAge:8}
 });
 assert.equal(next.family.妹妹,true);
 assert.equal(next.siblingAges.妹妹,8);
});
test('unrecognized or corrected microphone text never overwrites memory',()=>{
 const base={family:{姐姐:true},siblingAges:{姐姐:9}};
 const unknown=mergePandaFacts435(base,{known:false,family:{absent:'姐姐',present:[]}});
 const corrected=mergePandaFacts435(base,{known:true,correction:{why:'invalid'},family:{absent:'姐姐',present:[]}});
 assert.strictEqual(unknown,base);
 assert.strictEqual(corrected,base);
});
test('learner name and profession are remembered, no obsolete questions',()=>{
 const profile={name:'小明',profession:'厨师',role:'学生',subject:'我'};
 assert(knowsAnswer435('你叫什么名字？',profile));
 assert(knowsAnswer435('你是老师吗？',profile));
 assert(knowsAnswer435('你做什么工作？',profile));
 assert(!knowsAnswer435('你有弟弟吗？',profile));
});
test('negative sibling answer prevents a contradictory sibling age question',()=>{
 const profile={family:{哥哥:false,妹妹:true},siblingAges:{}};
 assert(knowsAnswer435('你哥哥几岁？',profile));
 assert(!knowsAnswer435('你妹妹几岁？',profile));
});
test('preserves a useful approved current question without rewriting it',()=>{
 const current=original('你妹妹几岁？',6);
 const answer=select(current,{family:{妹妹:true}});
 assert.strictEqual(answer,current);
});
test('replaces a repeated absent-brother question with verified sister-age MP3',()=>{
 const profile={family:{哥哥:false,妹妹:true}};
 const next=select(original('你有哥哥吗？',6),profile);
 assert.equal(next?.hanzi,'你妹妹几岁？');
 assert.equal(next?.intent,'relative-age');
 assert.equal(next?.relative,'妹妹');
 assert.equal(next?.lesson,6);
 assert(lookupPandaVoiceClip(next.hanzi)?.src.endsWith('p110.mp3'));
});
test('replaces an already-known sibling age question with an unanswered sibling question',()=>{
 const profile={family:{妹妹:true,哥哥:undefined},siblingAges:{妹妹:8}};
 const next=select(original('你妹妹几岁？',6),profile);
 assert(next);
 assert.equal(next?.hanzi,'你有哥哥吗？');
 assert(lookupPandaVoiceClip(next.hanzi));
});
test('does not repeat an old question recorded in conversation history',()=>{
 const profile={family:{哥哥:false,妹妹:true},siblingAges:{}};
 const history=[{who:'panda',hanzi:'你妹妹几岁？'}];
 const next=select(original('你有哥哥吗？',6),profile,{history});
 assert.notEqual(next?.hanzi,'你妹妹几岁？');
});
test('locked lesson, missing MP3, and all-known family cannot create fake audio',()=>{
 const profile={family:{哥哥:false,姐姐:false,弟弟:false,妹妹:true},
  siblingAges:{妹妹:8},familySize:4};
 const f=original('你有哥哥吗？',6);
 assert.equal(select(f,profile),null);
 assert.equal(select(f,profile,{allowed:[1,2,3]}),null);
 assert.equal(select(f,{family:{哥哥:false,妹妹:true}},{lookupAudio:()=>null}),null);
});
test('age question requires learned numbers, including when sister is known',()=>{
 const p={family:{哥哥:false,妹妹:true}};
 const next=select(original('你有哥哥吗？',6),p,{allowed:[6]});
 assert.notEqual(next?.hanzi,'你妹妹几岁？');
 assert.notEqual(next?.intent,'relative-age');
});
test('name is not asked a second time when it was already given',()=>{
 const p={name:'小明'};
 const next=select(original('你叫什么名字？',2),p);
 assert.notEqual(next?.hanzi,'你叫什么名字？');
 if(next)assert(lookupPandaVoiceClip(next.hanzi)?.src);
});
test('known available weekday is not asked a second time',()=>{
 const p={freeDay:'星期六'};
 const next=select(original('你星期几有空？',4),p);
 assert.notEqual(next?.hanzi,'你星期几有空？');
 if(next)assert(lookupPandaVoiceClip(next.hanzi));
});
test('v435 uses existing audio, offline module, and unchanged approved character',()=>{
 const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const screen=read('assets/panda-live-screen-v270.mjs');
 assert(screen.includes('mergePandaFacts435(state.profile,spoken)'));
 assert(screen.includes('followup=refineFollowup435({'));
 assert(read('assets/panda-live-v346.mjs').includes('panda-character-clean-v349.webp'));
 const html=read('panda-voice-pilot.html'),live=read('assets/panda-hsk2-preview-core-v1.mjs'),ui=read('assets/panda-hsk2-preview-ui-v1.mjs');
 assert.match(html,/src="\.\/assets\/panda-hsk2-preview-core-v1\.mjs\?v=\d+/);
 assert(live.includes('mergePandaFacts435(state.profile,spoken)'));
 assert(live.includes('followup=refineFollowup435({'));
 assert(ui.includes('panda-character-clean-v349.webp'));
 const offline=JSON.parse(read('assets/offline-pack.json'));
 assert(offline.files.includes('./assets/panda-natural-memory-v435.mjs?v=435'));
});
test('Android-like live dialogue still accepts voiced family answer',async()=>{
 const f=await liveDOM(1,{completed:['numbers','family']});
 try{
  const bridge=f.w.PandaApprovedBridge337;
  assert(bridge.chooseTopic(6));
  assert(bridge.startTopicQuestion(6,'你有妹妹吗？'));
  f.send('我有妹妹。');
  const phrase=f.el('phrase').textContent;
  assert(['好的，我明白了。','谢谢你告诉我。'].includes(phrase));
  assert(f.clips.at(-1)?.src?.endsWith('.mp3'));
 }finally{f.close()}
});
