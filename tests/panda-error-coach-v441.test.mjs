import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {explainPandaAnswer441} from '../assets/panda-error-coach-v441.mjs';
import {lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const p=hanzi=>({hanzi,lesson:6});
test('desire is meaningful, not a grammar mistake, when replying about an elder sister',()=>{
 const r=explainPandaAnswer441('我要一个姐姐。',{prompt:p('你有姐姐吗？')});
 assert.equal(r?.spoken?.correction?.category,'meaning');
 assert.match(r.spoken.probable,/старшая сестра/);
 assert.equal(r.spoken.correction.hanzi,'我有一个姐姐。');
 assert.equal(r.spoken.correction.pinyin,'Wǒ yǒu yí ge jiějie.');
 assert.match(r.spoken.correction.why,/要.*有/);
 assert.match(r.spoken.correction.retry,/我没有/);
 assert(!lookupPandaVoiceClip(r.spoken.correction.hanzi),'No made-up correction MP3');
});
test('correct grammar receives no fabricated correction',()=>{
 for(const input of ['我有一个姐姐。','我没有姐姐。','我有姐姐。','我想学中文。','我有两个哥哥。','我没有妹妹。']){
  assert.equal(explainPandaAnswer441(input,{prompt:p('你有姐姐吗？')}),null,input);
 }
});
test('desire outside the matching sibling question is not marked incorrect',()=>{
 for(const text of ['你做什么工作？','你有哥哥吗？','你会写汉字吗？']){
  assert.equal(explainPandaAnswer441('我要一个姐姐。',{prompt:p(text)}),null);
 }
 assert.equal(explainPandaAnswer441('我要一个姐姐。'),null);
});
test('younger-sister meaning and yes/no alternative use exact pinyin with correct tones',()=>{
 const r=explainPandaAnswer441('我想要一个妹妹',{prompt:p('你有妹妹吗？')});
 assert.equal(r?.spoken?.correction?.category,'meaning');
 assert.equal(r.spoken.correction.pinyin,'Wǒ yǒu yí ge mèimei.');
 assert.match(r.spoken.correction.why,/yào/);
});
test('grammar correction for 没有 covers all four family nouns',()=>{
 for(const [member,py] of [['哥哥','gēge'],['姐姐','jiějie'],['弟弟','dìdi'],['妹妹','mèimei']]){
  const r=explainPandaAnswer441('我不有一个'+member+'。',{prompt:p('你有'+member+'吗？')});
  assert.equal(r.kind,'correction');
  assert.equal(r.spoken.correction.category,'grammar');
  assert.equal(r.spoken.correction.hanzi,'我没有'+member+'。');
  assert.equal(r.spoken.correction.pinyin,'Wǒ méiyǒu '+py+'.');
 }
});
test('measure word 两个, rather than 二个, is explained without tone claims',()=>{
 const r=explainPandaAnswer441('我有二个哥哥。',{prompt:p('你有哥哥吗？')});
 assert.equal(r.spoken.correction.hanzi,'我有两个哥哥。');
 assert.equal(r.spoken.correction.pinyin,'Wǒ yǒu liǎng ge gēge.');
 assert.match(r.spoken.correction.why,/两.*二/);
});
test('low-confidence browser ASR must be a suggestion, not a definitive error',()=>{
 const r=explainPandaAnswer441('我要一个姐姐',{prompt:p('你有姐姐吗'),confidence:.68});
 assert.equal(r.spoken.correction.uncertain,true);
 assert.match(r.spoken.correction.why,/Распознавание/);
 assert.match(r.message,/проверь/);
 const exact=explainPandaAnswer441('我要一个姐姐',{prompt:p('你有姐姐吗'),confidence:.91});
 assert.equal(exact.spoken.correction.uncertain,undefined);
});
test('unsupported names, ASR noise and unrelated questions are left untouched',()=>{
 for(const input of ['瑞威有一个姐姐','你有什么好朋友','我有二十个朋友','我想当老师','我没有一个姐姐']){
  assert.equal(explainPandaAnswer441(input,{prompt:p('你有姐姐吗？')}),null,input);
 }
});
test('existing Panda art and MP3 unchanged; short, nonstop and day use same tutor',()=>{
 const screen=read('assets/panda-live-screen-v270.mjs');
 const ui=read('assets/panda-live-v346.mjs');
 assert(screen.includes("explainPandaAnswer441(input,{prompt:activePrompt,confidence:state.confidence})"));
 assert(screen.includes("explainPandaAnswer441(input,{prompt:state.prompt?.line,confidence:state.confidence})"));
 assert(screen.includes("explainPandaAnswer441(input,{prompt:conversation.lines[state.step],confidence:state.confidence})"));
 assert(ui.includes('pg441-title'));
 assert(ui.includes("meaningOnly?'💬 ':'❌ '"));
 assert(ui.includes('panda-character-clean-v349.webp'));
 assert(!read('assets/panda-error-coach-v441.mjs').includes('new Audio('));
});
test('Non-Stop on Android-like screen explains text without moving to the next question',async()=>{
 const f=await liveDOM(1,{completed:['pronouns','numbers','family']});
 try{
  const b=f.w.PandaApprovedBridge337;
  assert(b.chooseTopic(6));
  assert(b.startTopicQuestion(6,'你有姐姐吗？'));
  const current=f.el('phrase').textContent;
  f.send('我要一个姐姐。');
  assert.equal(f.el('phrase').textContent,current,'Question stays until learner retries');
  const feedback=f.el('learner-feedback').textContent;
  assert.match(feedback,/要/);assert.match(feedback,/有/);
  assert.match(feedback,/我有一个姐姐/);
  const hist=b.snapshot().history;
  assert(hist.some(e=>e.who==='you'&&e.hanzi==='我要一个姐姐。'));
  assert(hist.some(e=>e.analysis?.kind==='correction-response'));
 }finally{f.close()}
});
