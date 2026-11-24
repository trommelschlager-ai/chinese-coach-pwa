import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {enrichConversation430} from '../assets/panda-conversation-memory-v430.mjs';
import {lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';
import {availableAskGroups} from '../assets/panda-ask-catalog-v326.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';

const unlocked=[1,2,3,4,5,6,7],day=new Date(2026,10,17);
const catalog=availableAskGroups(unlocked,[],day);
const recorded=lookupPandaVoiceClip;
const spoken=(member,present)=>({known:true,topic:6,
 family:{present:present?[member]:[],absent:present?null:member}});
function reply(member,present,profile={family:{}},asked=[],history=[]){
 const active='你有'+member+'吗？';
 return enrichConversation430({
  input:'我'+(present?'有':'没有')+member+'。',
  activePrompt:{hanzi:active,lesson:6},
  result:{kind:'answer',lesson:6,reply:{hanzi:'好的，我明白了。'},
   spoken:spoken(member,present)},
  profile,allowed:unlocked,questions:[active,...asked],history,catalog,lookupAudio:recorded
 });
}
test('v430 exactly matches existing recorded questions and no synthetic MP3',()=>{
 assert.equal(lookupPandaVoiceClip('你妹妹几岁？')?.src,'./assets/panda-voice-clips-v365/p110.mp3');
 assert.equal(lookupPandaVoiceClip('你哥哥几岁？')?.src,'./assets/panda-voice-clips-v365/p108.mp3');
 assert.equal(lookupPandaVoiceClip('谢谢你告诉我。')?.src,'./assets/panda-voice-clips-v365/p124.mp3');
 assert.equal(lookupPandaVoiceClip('你姐姐几岁？'),null);
});
test('after yes to younger sister, age follow-up is natural, recorded and HSK3 unlocked',()=>{
 const x=reply('妹妹',true,{family:{姐姐:true}});
 assert.equal(x.followup?.hanzi,'你妹妹几岁？');
 assert.equal(x.followup?.intent,'relative-age');
 assert.equal(x.followup?.relative,'妹妹');
 assert.equal(x.followup?.lesson,6);
});
test('no questions about a sibling absent or with known age',()=>{
 const absent=reply('哥哥',false,{family:{姐姐:true,弟弟:false}},[],[
  {who:'panda',hanzi:'你有姐姐吗？'}
 ]);
 assert.notEqual(absent.followup?.hanzi,'你哥哥几岁？');
 assert.notEqual(absent.followup?.hanzi,'你有弟弟吗？');
 const known=reply('妹妹',true,{family:{妹妹:true},siblingAges:{妹妹:8}});
 assert.notEqual(known.followup?.hanzi,'你妹妹几岁？');
});
test('repeated questions excluded even across history and memory',()=>{
 const history=['你有姐姐吗？','你有妹妹吗？','你有哥哥吗？','你有弟弟吗？','你妹妹几岁？','你家有几口人？'].map(hanzi=>({who:'panda',hanzi}));
 const x=reply('妹妹',true,{family:{姐姐:true,哥哥:false,弟弟:false,妹妹:true},siblingAges:{妹妹:8}},[],history);
 assert.equal(x.followup,null);
});
test('sister without approved age voice gets supported sibling question, not invented age clip',()=>{
 const x=reply('姐姐',true);
 assert.equal(x.followup?.hanzi,'你有妹妹吗？');
});
test('unlocked numbers required for an age follow-up',()=>{
 const active={hanzi:'你有妹妹吗？',lesson:6};
 const x=enrichConversation430({input:'我有妹妹。',activePrompt:active,
 result:{kind:'answer',reply:{hanzi:'好的，我明白了。'},spoken:spoken('妹妹',true)},
 profile:{family:{}},allowed:[6],questions:[active.hanzi],history:[],catalog,lookupAudio:recorded});
 assert.notEqual(x.followup?.hanzi,'你妹妹几岁？');
});
test('no unrelated answer is rewritten as a reply to a sibling question',()=>{
 const x=enrichConversation430({input:'我有妹妹。',activePrompt:{hanzi:'你有哥哥吗？'},
 result:{kind:'statement',reply:{hanzi:'谢谢！'},spoken:spoken('妹妹',true)},
 allowed:unlocked,catalog,lookupAudio:recorded});
 assert.equal(x.kind,'statement');
 assert.equal(x.reply.hanzi,'谢谢！');
});
test('varied acknowledgements use only existing identical female Panda recordings',()=>{
 const x=reply('妹妹',false,{family:{}},[],[{who:'panda',hanzi:'好的，我明白了。'}]);
 assert.equal(x.reply.hanzi,'谢谢你告诉我。');
 assert.equal(recorded(x.reply.hanzi)?.src,'./assets/panda-voice-clips-v365/p124.mp3');
});
test('known family count is acknowledged and repeated size question is avoided',()=>{
 const x=enrichConversation430({input:'我家有四口人。',
 activePrompt:{hanzi:'你家有几口人？',lesson:6},
 result:{kind:'statement',reply:{hanzi:'谢谢！'},spoken:{known:true,topic:6,fact:{familySize:4}}},
 profile:{family:{姐姐:true,妹妹:true,哥哥:false,弟弟:false},siblingAges:{妹妹:8}},
 allowed:unlocked,questions:['你家有几口人？','你妹妹几岁？'],
 history:[],catalog,lookupAudio:recorded});
 assert.equal(x.kind,'answer');
 assert.notEqual(x.followup?.hanzi,'你家有几口人？');
});
test('v430 integrated without changing approved Panda artwork or lesson audio',()=>{
 const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
 const screen=read('assets/panda-hsk2-preview-core-v1.mjs');
 assert(screen.includes('enrichConversation430({'));
 assert(screen.includes('state.profile'));
 assert(/panda-hsk2-preview-core-v1\.mjs\?v=\d+/.test(read('panda-voice-pilot.html')));
 assert(read('assets/offline-pack.json').includes('panda-conversation-memory-v430.mjs?v=430'));
 assert(read('assets/panda-live-v346.mjs').includes('panda-character-clean-v349.webp'));
});
test('Android-like family question asks voiced age instead of cycling after yes',async()=>{
 const f=await liveDOM(1,{completed:['family','numbers','weekdays']});
 try{
  const bridge=f.w.PandaApprovedBridge337;
  assert(bridge.chooseTopic(6));
  assert(bridge.startTopicQuestion(6,'你有妹妹吗？'));
  f.send('我有妹妹。');
  assert.equal(f.el('phrase').textContent,'好的，我明白了。');
  if(typeof f.clips.at(-1)?.onended==='function')f.clips.at(-1).onended();
  await new Promise(resolve=>setTimeout(resolve,4950));
  assert.equal(f.el('phrase').textContent,'你妹妹几岁？');
  assert(f.clips.at(-1)?.src.includes('/p110.mp3'));
 }finally{f.close()}
});
