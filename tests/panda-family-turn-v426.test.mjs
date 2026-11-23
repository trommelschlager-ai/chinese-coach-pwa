import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {continueFamilyAfterAnswer} from '../assets/panda-family-turn-v426.mjs';
import {lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';
import {availableAskGroups} from '../assets/panda-ask-catalog-v326.mjs';
import {answerLive} from '../assets/panda-live-dialogue-v272.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';

const date=new Date(2026,10,17);
const allowed=[1,2,3,4,5,6,7];
const familyPrompt={hanzi:'你有哥哥吗？',lesson:6};
const catalog=availableAskGroups(allowed,[],date);
const make=(input='我没有哥哥。',history=[])=>continueFamilyAfterAnswer({
 input,activePrompt:familyPrompt,
 result:answerLive(input,{allowed,topic:6,prompt:familyPrompt,turn:2,date,profile:{family:{},recentQuestions:['你有哥哥吗？']}}),
 allowed,questions:['你有哥哥吗？'],history,
 catalog,lookupAudio:lookupPandaVoiceClip
});
test('negative answer: no echo, real recorded acknowledgement, different family question',()=>{
 assert.equal(lookupPandaVoiceClip('好的，我明白了。')?.src,'./assets/panda-voice-clips-v365/p125.mp3');
 assert.equal(lookupPandaVoiceClip('你有姐姐吗？')?.src,'./assets/panda-voice-clips-v365/p098.mp3');
 const result=make('我没有哥哥。',[{hanzi:'你有妹妹吗？',who:'you'},{hanzi:'你有哥哥吗？',who:'panda'}]);
 assert.equal(result.kind,'answer');
 assert.equal(result.reply.hanzi,'好的，我明白了。');
 assert.equal(result.reply.pinyin,'Hǎo de, wǒ míngbai le.');
 assert.equal(result.followup?.hanzi,'你有姐姐吗？');
 assert.equal(result.followup?.pinyin,'Nǐ yǒu jiějie ma?');
 assert.notEqual(result.followup?.hanzi,familyPrompt.hanzi);
});
test('positive sibling response also progresses; locked or unknown prompt is unchanged',()=>{
 const positive=make('我有哥哥。');
 assert.equal(positive.kind,'answer');
 assert.equal(positive.reply.hanzi,'好的，我明白了。');
 const wrongPrompt=continueFamilyAfterAnswer({
  input:'我没有哥哥。',activePrompt:{hanzi:'你有妹妹吗？',lesson:6},
  result:answerLive('我没有哥哥。',{allowed,topic:6,date,prompt:familyPrompt}),
  allowed,catalog,lookupAudio:lookupPandaVoiceClip
 });
 assert.notEqual(wrongPrompt.reply?.hanzi,'好的，我明白了。');
 const locked=continueFamilyAfterAnswer({
  input:'我没有哥哥。',activePrompt:familyPrompt,
  result:answerLive('我没有哥哥。',{allowed,topic:6,date,prompt:familyPrompt}),
  allowed:[1],catalog,lookupAudio:lookupPandaVoiceClip
 });
 assert.notEqual(locked.reply?.hanzi,'好的，我明白了。');
});

test('Android late recognition after question state reset still advances via last Panda turn',()=>{
 const transcript='我没有哥哥';
 const history=[
  {who:'you',hanzi:'你有妹妹吗？'},
  {who:'panda',hanzi:'我有一个妹妹。'},
  {who:'panda',hanzi:'你有哥哥吗？'}
 ];
 const result=continueFamilyAfterAnswer({
  input:transcript,activePrompt:null,
  result:answerLive(transcript,{allowed,topic:6,turn:2,date,profile:{family:{},recentQuestions:[]}}),
  allowed,questions:['你有哥哥吗？'],history,catalog,lookupAudio:lookupPandaVoiceClip
 });
 assert.equal(result.kind,'answer');
 assert.equal(result.reply.hanzi,'好的，我明白了。');
 assert.equal(result.followup?.hanzi,'你有姐姐吗？');
 const stale=continueFamilyAfterAnswer({...{
  input:transcript,activePrompt:null,
  result:answerLive(transcript,{allowed,topic:6,date,profile:{family:{}}}),
  allowed,questions:['你有哥哥吗？'],history:[...history,{who:'you',hanzi:'你好'}],
  catalog,lookupAudio:lookupPandaVoiceClip
 }});
 assert.notEqual(stale.reply?.hanzi,'好的，我明白了。');
});
test('old questions are excluded; if no new MP3 exists do not hallucinate one',()=>{
 const result=make('我没有哥哥。',[
  {hanzi:'你有姐姐吗？',who:'panda'},{hanzi:'你有弟弟吗？',who:'panda'},
  {hanzi:'你有妹妹吗？',who:'panda'}
 ]);
 assert.equal(result.followup?.hanzi,'你家有几口人？');
 const allAsked=make('我没有哥哥。',[
  {hanzi:'你有姐姐吗？'},{hanzi:'你有弟弟吗？'},
  {hanzi:'你有妹妹吗？'},{hanzi:'你家有几口人？'}
 ]);
 assert.equal(allAsked.followup,null);
 const noVoice=continueFamilyAfterAnswer({
  input:'我没有哥哥。',activePrompt:familyPrompt,
  result:answerLive('我没有哥哥。',{allowed,topic:6,date,prompt:familyPrompt}),
  allowed,questions:[],catalog,lookupAudio:()=>null
 });
 assert.equal(noVoice.followup,null);
});
test('new topic question without relative metadata accepts negative answer for all four siblings',()=>{
 for(const relative of ['哥哥','姐姐','弟弟','妹妹']){
  const prompt={hanzi:'你有'+relative+'吗？',lesson:6};
  const input='我没有'+relative+'。';
  const raw=answerLive(input,{allowed,topic:6,prompt,date,turn:2,profile:{family:{},recentQuestions:[prompt.hanzi]}});
  assert(raw.reply,'Known sibling answer must not be blocked as off-topic for '+relative);
  const out=continueFamilyAfterAnswer({
   input,activePrompt:prompt,result:raw,allowed,
   questions:[prompt.hanzi],history:[{who:'panda',hanzi:prompt.hanzi}],
   catalog,lookupAudio:lookupPandaVoiceClip
  });
  assert.equal(out.kind,'answer');
  assert.equal(out.reply.hanzi,'好的，我明白了。');
  assert.notEqual(out.followup?.hanzi,prompt.hanzi);
 }
});
test('screen and offline course include v426 family logic with approved art intact',()=>{
 const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
 assert(read('assets/panda-hsk2-preview-core-v1.mjs').includes('continueFamilyAfterAnswer({'));
 assert(/panda-hsk2-preview-core-v1\.mjs\?v=\d+/.test(read('panda-voice-pilot.html')));
 assert(/panda-hsk2-preview-ui-v1\.mjs\?v=\d+/.test(read('panda-voice-pilot.html')));
 const pack=JSON.parse(read('assets/offline-pack.json'));
 assert(pack.files.includes('./assets/panda-family-turn-v426.mjs?v=427'));
 assert(pack.files.includes('./'+read('panda-voice-pilot.html').match(/assets\/panda-hsk2-preview-core-v1\.mjs\?v=\d+/)?.[0]));
});
test('Android-like Non-Stop third turn replies and asks a new, voiced family question',async()=>{
 const f=await liveDOM(1,{completed:['family','weekdays']});
 try {
  f.el('mode-nonstop').click();
  f.send('你有妹妹吗？');
  assert.equal(f.el('phrase').textContent,'我有一个妹妹。');
  if(typeof f.clips.at(-1)?.onended==='function')f.clips.at(-1).onended();
  await new Promise(resolve=>setTimeout(resolve,4950));
  assert.equal(f.el('phrase').textContent,'你有哥哥吗？');
  if(typeof f.clips.at(-1)?.onended==='function')f.clips.at(-1).onended();
  f.send('我没有哥哥。');
  assert.equal(f.el('phrase').textContent,'好的，我明白了。');
  assert(f.clips.at(-1)?.src.includes('p125.mp3'),'Must use existing exact Panda acknowledgement MP3');
  if(typeof f.clips.at(-1)?.onended==='function')f.clips.at(-1).onended();
  await new Promise(resolve=>setTimeout(resolve,4950));
  assert.equal(f.el('phrase').textContent,'你有姐姐吗？');
  assert.equal(f.w.PandaApprovedBridge337.snapshot().topic,6);
  assert(f.clips.at(-1)?.src.includes('p098.mp3'),'Must use existing exact sister question MP3');
 } finally {f.close();}
});


test('Android autoplay rejection pauses Non-Stop until user replays the missed Panda MP3',async()=>{
 const f=await liveDOM(1,{completed:['family','weekdays']});
 const AudioCtor=globalThis.Audio,originalPlay=AudioCtor.prototype.play;
 let rejectOnce=true;
 AudioCtor.prototype.play=function(){
  if(rejectOnce&&this.src.includes('/p125.mp3')){
   rejectOnce=false;return Promise.reject(Object.assign(new Error('autoplay denied'),{name:'NotAllowedError'}));
  }
  return originalPlay.call(this);
 };
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 try{
  f.el('mode-nonstop').click();
  f.send('你有妹妹吗？');
  if(typeof f.clips.at(-1)?.onended==='function')f.clips.at(-1).onended();
  await pause(4950);
  assert.equal(f.el('phrase').textContent,'你有哥哥吗？');
  if(typeof f.clips.at(-1)?.onended==='function')f.clips.at(-1).onended();
  f.send('我没有哥哥。');
  await pause(20);
  assert.equal(f.el('phrase').textContent,'好的，我明白了。');
  assert.match(f.el('status').textContent,/Браузер не включил звук/);
  await pause(4950);
  assert.equal(f.el('phrase').textContent,'好的，我明白了。','Never silently skip a Panda reply that did not play');
  f.w.PandaApprovedBridge337.playEntry({hanzi:'好的，我明白了。'});
  assert(f.clips.at(-1)?.src.includes('/p125.mp3'));
  if(typeof f.clips.at(-1)?.onended==='function')f.clips.at(-1).onended();
  await pause(4950);
  assert.equal(f.el('phrase').textContent,'你有姐姐吗？');
 }finally{
  AudioCtor.prototype.play=originalPlay;
  f.close();
 }
});
