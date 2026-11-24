import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {liveDOM} from './panda-live-dom-fixture.mjs';
import {explainPandaAnswer441} from '../assets/panda-error-coach-v441.mjs';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('approved UI shows short correction first, details are optional and accessible',()=>{
 const ui=read('assets/panda-live-v346.mjs');
 const css=read('assets/panda-chat-corrections-v377.css');
 assert(ui.includes("document.createElement('details')"));
 assert(ui.includes("document.createElement('summary')"));
 assert(ui.includes('Подробнее — объяснение и перевод'));
 assert(ui.includes("wrong.category==='meaning'"));
 assert(ui.includes("pg445-brief"));
 assert(ui.includes("pg445-after"));
 assert(css.includes('pg445-details summary'));
 assert(css.includes('max-height:35%'));
 // The native details element starts closed unless explicitly opened.
 assert(!ui.includes('details.open=true'));
});

test('grammar versus meaning: a meaningful wish is not labeled as an error',()=>{
 const answer=explainPandaAnswer441('我要一个姐姐。',{prompt:{hanzi:'你有姐姐吗？'}});
 assert.equal(answer.spoken.correction.category,'meaning');
 assert.equal(answer.spoken.correction.hanzi,'我有一个姐姐。');
 assert.match(answer.spoken.correction.why,/要.*有/);
 const ui=read('assets/panda-live-v346.mjs');
 assert(ui.includes('Другой смысл — не ошибка грамматики'));
 assert(ui.includes('Панда объясняет ошибку'));
});

test('correct example is a separate speaker in real chat history',async()=>{
 const f=await liveDOM(1,{completed:['pronouns','numbers','family']});
 try{
  const bridge=f.w.PandaApprovedBridge337;
  assert(bridge.chooseTopic(6));
  assert(bridge.startTopicQuestion(6,'你有姐姐吗？'));
  const prompt=f.el('phrase').textContent;
  f.send('我要一个姐姐。');
  assert.equal(f.el('phrase').textContent,prompt,'Allow learner retry; do not advance');
  const history=bridge.snapshot().history;
  const learner=history.find(h=>h.who==='you'&&h.hanzi==='我要一个姐姐。');
  const example=history.find(h=>h.who==='example');
  assert(learner,'Original learner message preserved');
  assert(example,'Proposed answer is an example, not a Panda message');
  assert.equal(example.hanzi,'我有一个姐姐。');
  assert.equal(example.analysis.kind,'correction-response');
  assert(!history.some(h=>h.who==='panda'&&h.hanzi==='我有一个姐姐。'));
  assert.match(f.el('learner-feedback').textContent,/有/);
 }finally{f.close()}
});

test('approved visual chat clearly labels example and does not show a Panda avatar for it',()=>{
 const ui=read('assets/panda-live-v346.mjs');
 assert(ui.includes("e.who==='example'||e.analysis?.kind==='correction-response'"));
 assert(ui.includes("av.textContent='💡'"));
 assert(ui.includes("'Учебный пример, а не реплика Панды'"));
 assert(ui.includes("pg445-example-label','Правильный пример'"));
 assert(ui.includes("pg445-example-row"));
 const hiddenHistory=read('assets/panda-live-screen-v270.mjs');
 assert(hiddenHistory.includes("entry.who==='example'?'💡 Правильный пример: ':'Панда: '"));
});

test('teacher feedback is text-only, approved Panda image and MP3 remain untouched',()=>{
 const ui=read('assets/panda-live-v346.mjs');
 assert(ui.includes('panda-character-clean-v349.webp'));
 assert(!read('assets/panda-error-coach-v441.mjs').includes('new Audio('));
 const screen=read('assets/panda-live-screen-v270.mjs');
 assert(screen.includes("record('example',c.hanzi,c.pinyin,c.ru"));
 assert(screen.includes("explainPandaAnswer441(input,{prompt:activePrompt,confidence:state.confidence})"));
});

test('current Android entry loads approved teacher UI and its actual versioned modules',()=>{
 const html=read('panda-voice-pilot.html');
 const offline=JSON.parse(read('assets/offline-pack.json'));
 assert(offline.version>=546);
 const active=[
  html.match(/\.\/assets\/panda-hsk2-preview-core-v1\.mjs\?v=\d+/)?.[0],
  html.match(/\.\/assets\/panda-hsk2-preview-ui-v1\.mjs\?v=\d+/)?.[0],
  html.match(/\.\/assets\/panda-chat-corrections-v377\.css\?v=\d+/)?.[0],
  html.match(/\.\/assets\/panda-ai-approved-layout-v547\.css\?v=\d+/)?.[0]
 ];
 for(const asset of active){
  assert(asset,'Missing current Panda asset in HTML');
  assert(offline.files.includes(asset),'Missing active offline Panda asset '+asset);
 }
 assert(!/<script[^>]+src="[^"]*panda-live-screen-v270\.mjs/.test(html),
  'Retired screen must never override the active Panda AI screen');
 const newCore=read('assets/panda-hsk2-preview-core-v1.mjs');
 assert(newCore.includes('explainPandaAnswer441'),'Current Panda must use teacher correction logic');
});

test('PWA precaches the actual current Panda AI code, not an obsolete script version',()=>{
 const sw=read('sw.js'),pack=JSON.parse(read('assets/offline-pack.json'));
 const html=read('panda-voice-pilot.html');
 const cacheNum=Number(sw.match(/const CACHE='chinese-coach-pwa-v(\d+)-/)?.[1]);
 assert.equal(cacheNum,pack.version);
 const core=JSON.parse(sw.match(/const CORE=(\[[^\n]+\])/)[1]);
 const required=[
  html.match(/\.\/assets\/panda-hsk2-preview-core-v1\.mjs\?v=\d+/)?.[0],
  html.match(/\.\/assets\/panda-hsk2-preview-ui-v1\.mjs\?v=\d+/)?.[0],
  html.match(/\.\/assets\/panda-chat-corrections-v377\.css\?v=\d+/)?.[0],
  html.match(/\.\/assets\/panda-ai-approved-layout-v547\.css\?v=\d+/)?.[0]
 ];
 for(const asset of required)assert(core.includes(asset),'Missing active app-shell cache asset '+asset);
 assert.equal(core.filter(x=>x.startsWith('./assets/panda-hsk2-preview-core-v1.mjs?v=')).length,1,
   'Only the current active Panda core must be precached');
 assert.equal(new Set(core).size,core.length,'Service worker must not precache duplicates');
});
