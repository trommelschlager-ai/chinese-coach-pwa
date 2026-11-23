import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {friendlyIntroduction} from '../assets/panda-everyday-meaning-v515.mjs';

const source=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('Panda responds to the learner name instead of introducing itself as Misha',()=>{
  const m=friendlyIntroduction('我叫米沙。','name');
  assert.deepEqual(m.spoken,['Wǒ jiào Mǐshā.','Меня зовут Миша.']);
  assert.equal(m.reply[0],'很高兴认识你！你今天怎么样？');
  assert.notEqual(m.reply[0],'我叫米沙。');
  const a=friendlyIntroduction('我叫安东。','name');
  assert.deepEqual(a.spoken,['Wǒ jiào Āndōng.','Меня зовут Антон.']);
});

test('Non-Stop can interpret a standalone name and a request to repeat',()=>{
  const core=source('../assets/panda-hsk2-preview-core-v1.mjs');
  assert.match(core,/standaloneName=state\.mode==='nonstop'/);
  assert.match(core,/friendlyIntroduction\(input,standaloneName\?'name':friendlyStage\)/);
  assert.match(core,/normalize\(input\)==='什么'/);
  assert.match(core,/learner\(input,\{known:true,pinyin:'Shénme\?',translation:'Что\?'\}\)/);
  assert.match(core,/say\(previousQuestion,!!lookupPandaVoiceClip\(questionText\)\)/);
});

test('Android keyboard reserves space for Panda instead of showing all chat rows',()=>{
  const css=source('../assets/panda-hsk2-preview-v506.css');
  assert.match(css,/:root\[data-keyboard="true"\] #pg346:not\(\[data-day-scenario="ready"\]\) \.pg346-history\s*\{\s*display:none!important/);
  assert.match(css,/:root\[data-keyboard="true"\] #pg346:not\(\[data-day-scenario="ready"\]\) \.pg346-scene\s*\{\s*flex:1 1 0!important;/);
});

test('Unverified translation is not shown as a learner-facing placeholder',()=>{
  const ui=source('../assets/panda-hsk2-preview-ui-v1.mjs');
  const core=source('../assets/panda-hsk2-preview-core-v1.mjs');
  assert.match(ui,/if\(!translationText\)translation\.hidden=true/);
  assert.doesNotMatch(ui,/Перевод пока не подтверждён/);
  assert.doesNotMatch(core,/Точный перевод пока не подтверждён/);
});

test('Main HTML busts stale Android CSS and JS caches',()=>{
  const html=source('../panda-voice-pilot.html');
  assert.match(html,/panda-hsk2-preview-v506\.css\?v=541/);
  assert.match(html,/panda-hsk2-preview-core-v1\.mjs\?v=539/);
  assert.match(html,/panda-hsk2-preview-ui-v1\.mjs\?v=541/);
});

test('The same approved Panda and stone are anchored to the stage for all dialogue',()=>{
  const js=source('../assets/panda-approved-soft-v500.js');
  const css=source('../assets/panda-hsk2-preview-v506.css');
  const ui=source('../assets/panda-hsk2-preview-ui-v1.mjs');
  assert.match(js,/stage\.dataset\.pandaStatic='true'/);
  assert.match(js,/layer\.append\(stoneBack,mascot,stoneFront\)/);
  assert.match(js,/if\(geometryFrozen\|\|!mascot/);
  assert.match(css,/\.pg541-static-layer/);
  assert.match(css,/top:var\(--pg541-panda-y\)/);
  assert.match(css,/left:var\(--pg541-panda-x\)/);
  assert.match(css,/width:var\(--pg541-panda-w\)/);
  assert.match(css,/top:var\(--pg541-stone-y\)/);
  assert.match(css,/\.pg353-face-canvas/);
  assert.match(css,/\.pg352-ear-effects/);
  assert.match(css,/animation:none!important/);
  assert.match(ui,/liveMouth\.setTalking\(false\)/);
  assert.doesNotMatch(ui,/liveMouth\.setTalking\(!s\.active&&pandaSpeaking\)/);
});

test('Filled input is sent by the FIRST airplane tap',()=>{
  const js=source('../assets/panda-approved-soft-v500.js');
  const ui=source('../assets/panda-hsk2-preview-ui-v1.mjs');
  assert.match(js,/if\(!input.value.trim\(\)\&\&!opened\(\)\)/);
  assert.match(ui,/bridge.send\(value\);sync\(\);stage.dataset.composerOpen='false'/);
  assert.doesNotMatch(js,/if\(!opened\(\)\)\{\s*event.preventDefault/);
});

test('v541 static Panda and SW cached together to avoid stale Android scripts',()=>{
  const html=source('../panda-voice-pilot.html');
  const worker=source('../sw.js');
  const pack=JSON.parse(source('../assets/offline-pack.json'));
  assert.equal(pack.version,541);
  assert(source('../panda-ai-hsk2-preview.html').includes('panda-approved-soft-v500.js?v=541'));
  assert(source('../panda-ai-hsk2-preview.html').includes('panda-hsk2-preview-v506.css?v=541'));
  assert.match(worker,/const CACHE='chinese-coach-pwa-v541-/);
  for(const asset of ['panda-hsk2-preview-v506.css?v=541','panda-hsk2-preview-ui-v1.mjs?v=541','panda-approved-soft-v500.js?v=541']){
    assert(html.includes(asset));
    assert(pack.files.some(f=>f.endsWith(asset)));
    assert(worker.includes(asset));
  }
});
