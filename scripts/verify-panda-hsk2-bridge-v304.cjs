'use strict';
// Public Panda HSK1-to-HSK2 bridge, no paid course unlock.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
(async()=>{
 const sandbox={window:{}};vm.runInNewContext(fs.readFileSync('assets/hsk1-foundations-data-v152.js','utf8'),sandbox);
 const curriculum=sandbox.window.PANDA_HSK1_FOUNDATIONS,allowed=[1,2,3,4,5,6,7];
 const {answerHsk2Bridge,HSK2_BRIDGE_WORDS}=await import('../assets/panda-hsk2-bridge-v304.mjs?v=306');
 const {answerLive}=await import('../assets/panda-live-dialogue-v272.mjs?v=306');
 const {lookupPilotAudio}=await import('../assets/panda-live-audio.mjs?v=live6');
 const opts={allowed,topic:1,curriculum,date:new Date(2026,10,13),profile:{}};
 assert.deepEqual(HSK2_BRIDGE_WORDS,['中文','学习','忙','很']);
 const words=[['中文','Zhōngwén'],['学习','xuéxí'],['忙','máng'],['很','hěn']];
 for(const [word,py] of words){
  for(const query of [word+'是什么意思？','Что значит '+word+'?']){
   const r=answerLive(query,opts);
   assert.equal(r.kind,'explanation',query);assert.equal(r.reply.hanzi,word);
   assert.equal(r.reply.pinyin,py);assert(r.explanation.includes('Тоны:'));
   assert(r.followup&&r.followup.isContextual,'Missing contextual follow-up');
   assert.equal(r.reply.audioKey,word,'Bridge vocabulary must use a recorded clip: '+word);
   assert.equal(r.wordCard?.hanzi,word,'No structured word card');
   assert(r.wordCard?.example?.pinyin&&r.wordCard?.tones,'Missing sample or tones');
   if(['中文','学习'].includes(word))assert(!r.explanation.includes('我很忙'),'Unrelated grammar in '+word);
   assert(r.spoken.known,'Question lost');
  }
  const example=answerLive('用'+word+'造句',opts);
  assert.equal(example.kind,'explanation');assert(example.reply.pinyin&&example.reply.ru);
  assert.equal(example.reply.audioKey,['中文','学习'].includes(word)?'我学习中文':'我很忙');
 }
 for(const [query,zh] of [
  ['你学习中文吗？','我学习中文。'],['你忙吗？','我不忙。'],
  ['我学习中文。','很好！'],['我很忙。','很好！'],['我不忙。','很好！']
 ]){
  const r=answerLive(query,opts);assert.equal(r.reply?.hanzi,zh,query);
  assert(r.spoken.known&&r.spoken.pinyin&&r.spoken.translation,query);
  if(r.reply.audioKey)assert(lookupPilotAudio(r.reply.audioKey),'Clip does not exist');
  assert(r.followup&&r.followup.lesson===1,'Follow-up missing for '+query);
 }
 const study=answerLive('我学习中文。',{...opts,prompt:{intent:'hsk2-bridge-study',lesson:1,hanzi:'你学习中文吗？'}});
 for(const prompt of [null,{intent:'hsk2-bridge-study',lesson:1,hanzi:'你学习中文吗？'}]){
  const coached=answerLive('学习中文',{...opts,prompt});
  assert.equal(coached.kind,'coaching','Valid verb phrase must be coached, not marked as grammatical error');
  assert.equal(coached.spoken.known,true);
  assert.equal(coached.reply.hanzi,'我学习中文。');
  assert.equal(coached.reply.pinyin,'Wǒ xuéxí Zhōngwén.');
  assert.equal(coached.reply.audioKey,'我学习中文');
  assert(lookupPilotAudio(coached.reply.audioKey)?.endsWith('/B02.mp3'),'Full sentence must use the original B02 recording');
  assert(coached.explanation.includes('правильное словосочетание'));
  assert(coached.explanation.includes('我'));
  assert(!coached.spoken.correction,'Do not report a valid verb phrase as an error');
 }
 const bridgePhrases=['你学习中文吗','我学习中文','你忙吗','我很忙','我不忙','中文','学习','忙','你为什么学习中文','因为我喜欢中文'];
 for(const [index,hanzi] of bridgePhrases.entries()){
  const path=lookupPilotAudio(hanzi);
  assert(path?.endsWith('/B'+String(index+1).padStart(2,'0')+'.mp3'),'Missing native batch phrase: '+hanzi);
  const bytes=fs.readFileSync(path.replace(/^\.\//,''));
  assert(bytes.length>3000,'Empty recording: '+hanzi);
  assert(bytes[0]===255&&(bytes[1]&0xe0)===0xe0,'Invalid MPEG frame: '+hanzi);
 }

 assert.equal(study.kind,'answer');
 const busy=answerLive('我很忙。',{...opts,prompt:{intent:'hsk2-bridge-busy',lesson:1,hanzi:'你忙吗？'}});
 assert.equal(busy.kind,'answer');
 for(const wrong of ['我是忙','我是很忙']){
  const r=answerLive(wrong,opts);assert.equal(r.kind,'correction',wrong);
  assert.equal(r.spoken.correction.hanzi,'我很忙。');assert(r.spoken.probable);
 }
 const intro=answerLive('HSK 2',opts);
 assert.equal(intro.kind,'explanation');assert(intro.explanation.includes('пока не открыты'));
 assert.equal(answerHsk2Bridge('爱好是什么意思？'),null,'Paid content must not unlock');
 const locked=answerLive('爱好是什么意思？',opts);
 assert(!locked.reply,'Unapproved HSK2 word was leaked through HSK1');
 const old=answerLive('妹妹是什么意思？',{...opts,topic:6});
 assert.equal(old.reply?.hanzi,'妹妹','Old HSK1 word handling changed');
 assert.equal(answerLive('我不有妹妹',opts).kind,'correction','Old correction was changed');
 const seed=JSON.parse(fs.readFileSync('assets/panda-hsk2-seed-v303.json','utf8'));
 assert.equal(seed.state,'draft_content_only_not_enabled');
 assert.equal(seed.sections.length,7);
 assert.equal(seed.sections.reduce((n,s)=>n+s.vocabulary.length,0),40);
 for(const p of ['assets/panda-live-dialogue-v272.mjs','assets/panda-live-screen-v270.mjs','panda-voice-pilot.html']){
  assert(!fs.readFileSync(p,'utf8').includes('panda-hsk2-seed-v303.json'),'Draft premium seed leaked into live app: '+p);
 }
 const page=fs.readFileSync('panda-voice-pilot.html','utf8');
 assert(page.includes('panda-live-screen-v270.mjs?v=323'));
 assert(page.includes('panda-voice-pilot.css?v=318'));
 assert(page.includes('Запись носительницы готовится'));
 assert(fs.readFileSync('assets/panda-voice-pilot.css','utf8').includes('max-height:100%;overflow:hidden'),'Speech still scrolls');
 assert(page.includes('<span class="release">v323</span>'),'Stale v302 release badge must be removed');
 for(const id of ['mode-short','mode-nonstop','mic','history-dialog','speech-dialog'])
  assert(page.includes('id="'+id+'"'),'Existing control deleted: '+id);
 const offline=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
 for(const p of [
  './assets/panda-hsk2-bridge-v304.mjs?v=307',
  './assets/panda-live-dialogue-v272.mjs?v=323',
  './assets/panda-live-screen-v270.mjs?v=323',
  './assets/panda-hsk1-questions-v281.mjs?v=319',
  './panda-voice-pilot.html?v=323'
 ])assert(offline.files.includes(p),'Offline material missing: '+p);
 const latest={
  'panda-voice-pilot.html':'323',
  'assets/panda-live-screen-v270.mjs':'323',
  'assets/panda-live-dialogue-v272.mjs':'323',
  'assets/panda-hsk1-questions-v281.mjs':'319'
 };
 for(const url of offline.files){
  const p=url.replace(/^\.\//,'').split('?')[0],version=/[?&]v=([^&]+)/.exec(url)?.[1];
  if(latest[p]&&version)assert.equal(version,latest[p],'Stale Panda entry: '+url);
 }
 console.log('PASS Panda AI v318: 4 bridge words, 8 lexical questions, 4 examples, two-way dialogues, old HSK1 regressions, offline paths, no premium leak.');
})().catch(err=>{console.error(err);process.exitCode=1});
