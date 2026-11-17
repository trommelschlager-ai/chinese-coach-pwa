import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {PANDA_V411_VOICE} from '../assets/panda-voice-v411.mjs';
import {lookupPandaVoiceClip,lookupPilotAudio} from '../assets/panda-live-audio.mjs';
import {chooseAudibleFollowup} from '../assets/panda-audible-followup-v412.mjs';
import {availableAskGroups} from '../assets/panda-ask-catalog-v326.mjs';

// SHA-256 hashes of the ten original user-supplied MP3 clips.
// This catches accidental swaps, mislabeled exports, and corrupt/truncated uploads.
const EXPECTED_SHA256=Object.freeze([
  '3387af68c491e038950a35eb519047eaa9b0b30f37104c6f0e16cbcd03aebd6a',
  '9f13eeb722395f538a3624a2c0fbef532a247777657918772b38833c0e3754b3',
  'c65c9af0dc259259c6ed2b2d331f7b2fe365b28d603f2647eed835ba77efb265',
  '75df86d23b94a5e9ecddafe20e3e9a55f924259d59b49f09ff3cce14af8d9f32',
  '71af20e32e0a5b0cb94e3e001e6db5713254ded772a479dbcd791a079b3996ef',
  '1f5caa478ac3be6df17367b84ee6dbccf500dd541022e1609720f9f845ce6a0d',
  '0e11a0ba8d9cebfa330ebd8ea9d5c8d430bf2d42567b159709037d3d3ff0acfd',
  '687600ba912818677c5082d2dae263c1a58c3e9a869b0df40f54dd7d4b06852f',
  '0aacfa6fc7c331855580579f543b0e5fa87dc3128af42d7a0c647913a2228465',
  '43b4c3c86fe99794ff60e58734a7c590682e6ad580f5e50df560884adb69358f'
]);
test('Nov 16 Mandarin voice: ten authentic, exact phrase-mapped clips',()=>{
 assert.equal(PANDA_V411_VOICE.length,EXPECTED_SHA256.length);
 const seen=new Set();
 for(const [i,item] of PANDA_V411_VOICE.entries()){
  assert(!seen.has(item.zh),'Duplicate phrase: '+item.zh);
  seen.add(item.zh);
  assert.equal(item.src,`./assets/panda-voice-clips-v411/p${156+i}.mp3`);
  const path=new URL('../'+item.src.slice(2),import.meta.url);
  assert(fs.existsSync(path),'Missing user audio: '+item.src);
  const bytes=fs.readFileSync(path);
  assert(bytes.length>3000,'Empty or truncated MP3: '+item.src);
  assert.equal(bytes.subarray(0,3).toString('ascii'),'ID3','Invalid MP3 header: '+item.src);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),EXPECTED_SHA256[i],'Wrong/modified source audio: '+item.src);
  const audio=lookupPandaVoiceClip(item.zh+'。');
  assert.equal(audio?.src,item.src);
  assert.equal(audio?.start,0);
  assert.equal(audio?.end,null);
  assert.equal(audio?.source,'user-luvvoice-nov16-cut');
  assert.equal(lookupPilotAudio(item.zh),item.src);
  assert(item.pinyin,'Missing written pinyin');
  assert(item.ru,'Missing Russian translation');
 }
});
test('Existing approved Panda clips remain available and no fake fallback',()=>{
 for(const phrase of ['你好！','你好吗？','很好！','你做什么工作？']){
  const audio=lookupPandaVoiceClip(phrase);
  assert(audio?.src&&audio.src.endsWith('.mp3'),phrase);
  assert.notEqual(audio.source,'user-luvvoice-nov16-cut',phrase);
 }
 assert.equal(lookupPandaVoiceClip('这不是录音的句子。'),null);
});

// The visible speech buttons in history used an older module import cache key.
// Keep them on the same exact v411 audio source as the main Panda player.
test('visible history and main Panda player use the same v411 audio module',()=>{
 const ui=fs.readFileSync(new URL('../assets/panda-live-v346.mjs',import.meta.url),'utf8');
 const screen=fs.readFileSync(new URL('../assets/panda-live-screen-v270.mjs',import.meta.url),'utf8');
 assert(ui.includes("import {lookupPandaVoiceClip} from './panda-live-audio.mjs?v=411';"),'History must load v411 voice, not stale v366');
 assert(screen.includes("import {lookupPilotAudio,lookupPandaVoiceClip} from './panda-live-audio.mjs?v=411';"),'Main player must load v411 voice');
 assert(ui.includes('sound.disabled=!clipFor(e)'),'Keep history disabled only when exact audio really is missing');
 const reply=lookupPandaVoiceClip('我星期六有空。');
 assert.equal(reply?.src,'./assets/panda-voice-clips-v411/p160.mp3');
 assert.equal(reply?.source,'user-luvvoice-nov16-cut');
 assert(fs.existsSync(new URL('../'+reply.src,import.meta.url)),'History clip p160 missing');
});

test('Non-Stop automatic follow-up stays audible and within the unlocked weekday topic',()=>{
 const available=availableAskGroups([1,4],[],new Date(2026,10,17));
 const unrecorded={hanzi:'明天星期几？',pinyin:'Míngtiān xīngqī jǐ?',ru:'Завтра какой день недели?',lesson:4};
 assert.equal(lookupPandaVoiceClip(unrecorded.hanzi),null,'Never manufacture a tomorrow-weekday recording');
 const next=chooseAudibleFollowup(unrecorded,available,['你星期几有空？'],lookupPandaVoiceClip,'你星期几有空？');
 assert(next,'An existing same-topic recorded question must replace a silent automatic follow-up');
 assert.equal(next.lesson,4);
 assert.notEqual(next.hanzi,unrecorded.hanzi);
 assert.notEqual(next.hanzi,'你星期几有空？','Do not echo the just-asked learner question');
 assert(lookupPandaVoiceClip(next.hanzi)?.src?.endsWith('.mp3'),'Replacement must have a real exact MP3');
 assert.equal(next.audioKey,next.hanzi);
 const source=fs.readFileSync(new URL('../assets/panda-live-screen-v270.mjs',import.meta.url),'utf8');
 assert(source.includes('followup=chooseAudibleFollowup('),'Auto follow-up gate must run in the actual Panda engine');
});

test('Non-Stop audible follow-up safely stops when no recorded candidate remains',()=>{
 const silent={hanzi:'明天星期几？',lesson:4};
 const exhausted=[{lesson:4,questions:[{hanzi:'今天星期几？',lesson:4,pinyin:'Jīntiān xīngqī jǐ?',ru:'Сегодня какой день?'}]}];
 assert.equal(chooseAudibleFollowup(silent,exhausted,['今天星期几？'],lookupPandaVoiceClip),null);
 const recorded={hanzi:'你星期几有空？',lesson:4,audioKey:'你星期几有空'};
 assert.equal(chooseAudibleFollowup(recorded,[],[],lookupPandaVoiceClip),recorded,
   'An already recorded prompt must remain unchanged');
});

test('Availability dialog never pivots to an unrelated weekday question after the reply',()=>{
 const groups=availableAskGroups([1,4],[],new Date(2026,10,17));
 const candidates=groups.find(g=>g.lesson===4)?.questions||[];
 assert(candidates.length>0);
 const today=lookupPandaVoiceClip('你今天有空吗？');
 assert.equal(today?.src,'./assets/panda-voice-clips-v411/p164.mp3');
 const silent={hanzi:'明天星期几？',pinyin:'Míngtiān xīngqī jǐ?',ru:'Завтра какой день?',lesson:4};
 const second=chooseAudibleFollowup(silent,groups,['你星期几有空？'],lookupPandaVoiceClip,'你星期几有空？');
 assert.equal(second?.hanzi,'你今天有空吗？','First new same-topic follow-up must be recorded');
 const exhausted=chooseAudibleFollowup(silent,groups,['你星期几有空？','你今天有空吗？'],lookupPandaVoiceClip,'你今天有空吗？');
 assert(!exhausted||exhausted.hanzi.includes('有空'),'Do not suddenly ask which weekday tomorrow is');
 assert.notEqual(exhausted?.hanzi,'明天星期几？');
 // Even a recorded but unrelated candidate must be rejected when the topic is free time.
 const recordedWrong={hanzi:'今天星期几？',lesson:4,audioKey:'今天星期几'};
 const guarded=chooseAudibleFollowup(recordedWrong,groups,['你星期几有空？','你今天有空吗？'],lookupPandaVoiceClip,'你今天有空吗？');
 assert(!guarded||guarded.hanzi.includes('有空'),'Preselected recorded weekday must not bypass topic matching');
 const screen=fs.readFileSync(new URL('../assets/panda-live-screen-v270.mjs',import.meta.url),'utf8');
 assert(screen.includes("if(/^(?:你星期几有空|你今天有空吗)$/.test(normalize(input)))"),'Both availability questions must use the guard');
 assert(screen.includes("if(normalize(input)==='我今天有空'&&normalize(activePrompt?.hanzi"),'Incorrect answer to the weekday prompt should get explicit feedback');
});
