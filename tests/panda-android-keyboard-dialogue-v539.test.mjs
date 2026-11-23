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
  const pack=JSON.parse(source('../assets/offline-pack.json'));
  assert(html.includes('panda-hsk2-preview-v506.css?v='+pack.version),'HTML loads current CSS release');
  assert(html.includes('panda-approved-soft-v500.js?v='+pack.version),'HTML loads current Android geometry JS');
  assert.match(html,/panda-hsk2-preview-core-v1\.mjs\?v=546/);
  assert.match(html,/panda-hsk2-preview-ui-v1\.mjs\?v=546/);
});

test('Panda and stone hold pre-keyboard pixel dimensions instead of shrinking',()=>{
  const js=source('../assets/panda-approved-soft-v500.js');
  const css=source('../assets/panda-hsk2-preview-v506.css');
  assert.match(js,/function rememberPandaGeometry\(/);
  assert.match(js,/--pg540-panda-width/);
  assert.match(js,/--pg545-panda-height/);
  assert.match(css,/height:var\(--pg545-panda-height/);
  assert.match(css,/max-height:none!important/);
  assert.match(js,/--pg540-stone-width/);
  assert.match(css,/width:var\(--pg540-panda-width/);
  assert.match(css,/width:var\(--pg540-stone-width/);
});

test('Filled input is sent by the FIRST airplane tap',()=>{
  const js=source('../assets/panda-approved-soft-v500.js');
  const ui=source('../assets/panda-hsk2-preview-ui-v1.mjs');
  assert.match(js,/if\(!input.value.trim\(\)\&\&!opened\(\)\)/);
  assert.match(ui,/bridge.send\(value\);sync\(\);stage.dataset.composerOpen='false'/);
  assert.doesNotMatch(js,/if\(!opened\(\)\)\{\s*event.preventDefault/);
});

test('v545 assets and SW cached together to avoid stale Android scripts',()=>{
  const html=source('../panda-voice-pilot.html');
  const worker=source('../sw.js');
  const pack=JSON.parse(source('../assets/offline-pack.json'));
  assert(pack.version>=545,'Panda Android fixes must not roll back');
  assert(worker.includes("const CACHE='chinese-coach-pwa-v"+pack.version+"-"),'SW and offline pack must agree');
  for(const asset of ['panda-hsk2-preview-v506.css?v='+pack.version,'panda-hsk2-preview-ui-v1.mjs?v=546','panda-approved-soft-v500.js?v='+pack.version]){
    assert(html.includes(asset));
    assert(pack.files.some(f=>f.endsWith(asset)));
    assert(worker.includes(asset));
  }
});
