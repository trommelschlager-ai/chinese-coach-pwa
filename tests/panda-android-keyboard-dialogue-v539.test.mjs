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
  assert.match(html,/panda-hsk2-preview-v506\.css\?v=544/);
  assert.match(html,/panda-hsk2-preview-core-v1\.mjs\?v=543/);
  assert.match(html,/panda-hsk2-preview-ui-v1\.mjs\?v=544/);
});

test('Panda remains visible: preserve original and show loaded static copy',()=>{
  const js=source('../assets/panda-approved-soft-v500.js');
  const css=source('../assets/panda-hsk2-preview-v506.css');
  const ui=source('../assets/panda-hsk2-preview-ui-v1.mjs');
  assert.match(js,/const frozen=word\('img','pg542-frozen-panda',''\)/);
  assert.match(js,/layer\.append\(back,frozen,front\)/);
  assert.match(js,/stage\.dataset\.pandaStatic='true'/);
  assert.match(js,/if\(!frozen\.naturalWidth\|\|!frozen\.naturalHeight\)return/);
  assert.doesNotMatch(js,/layer\.append\(stoneBack,mascot,stoneFront\)/);
  assert.match(css,/\.pg542-frozen-panda/);
  assert.match(css,/width:var\(--pg542-panda-w\)/);
  assert.match(css,/top:var\(--pg542-panda-y\)/);
  assert.match(css,/\.pg542-static-stone/);
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

test('v542 visible Panda and SW cached together to avoid stale Android scripts',()=>{
  const html=source('../panda-voice-pilot.html');
  const worker=source('../sw.js');
  const pack=JSON.parse(source('../assets/offline-pack.json'));
  assert.equal(pack.version,544);
  assert(source('../panda-ai-hsk2-preview.html').includes('panda-approved-soft-v500.js?v=544'));
  assert(source('../panda-ai-hsk2-preview.html').includes('panda-hsk2-preview-v506.css?v=544'));
  assert.match(worker,/const CACHE='chinese-coach-pwa-v544-/);
  for(const asset of ['panda-hsk2-preview-v506.css?v=544','panda-hsk2-preview-ui-v1.mjs?v=544','panda-approved-soft-v500.js?v=544']){
    assert(html.includes(asset));
    assert(pack.files.some(f=>f.endsWith(asset)));
    assert(worker.includes(asset));
  }
});

test('v543 conversation layout cannot shift Panda when chat cards grow',()=>{
 const js=source('../assets/panda-approved-soft-v500.js');
 const css=source('../assets/panda-hsk2-preview-v506.css');
 assert.match(js,/const designWidth=Math.min\(pr.width\*\.61,335\)/);
 assert.match(js,/const designStoneTop=pr.height\*\.705/);
 assert.match(css,/flex:0 0 clamp\(185px,29dvh,255px\)!important/);
 assert.match(css,/max-height:clamp\(105px,21dvh,164px\)!important/);
 assert.match(css,/overflow-y:auto!important/);
});

test('v543 mic guidance is not a persistent warning over the mascot',()=>{
 const ui=source('../assets/panda-hsk2-preview-ui-v1.mjs');
 const css=source('../assets/panda-hsk2-preview-v506.css');
 assert.match(ui,/const problem=!autoplayBlocked&&\/\(не удалось\|ошибка/);
 assert.doesNotMatch(ui,/const problem=!autoplayBlocked&&\/\(микрофон\|/);
 assert.match(css,/#pg346 #pg346-status:not\(\[hidden\]\)/);
 assert.match(css,/top:calc\(clamp\(61px,7\.4dvh,77px\)/);
});

test('v543 responds to recognized learner question and laughter',()=>{
 const core=source('../assets/panda-hsk2-preview-core-v1.mjs');
 assert.match(core,/said==='你是老师吗'/);
 assert.match(core,/hanzi:'是，我是你的中文老师。'/);
 assert.match(core,/pinyin:'Nǐ shì lǎoshī ma\?'/);
 assert.match(core,/\['哈哈','哈哈哈','呵呵'\]/);
 assert.match(core,/hanzi:'哈哈，我们继续吧！'/);
});

test('v544 right shortcuts contain only Topics and Lessons',()=>{
  const soft=source('../assets/panda-approved-soft-v500.js');
  const css=source('../assets/panda-hsk2-preview-v506.css');
  const ui=source('../assets/panda-hsk2-preview-ui-v1.mjs');
  assert.match(soft,/const book=sideButton\('pg500-side-book'/);
  assert.doesNotMatch(soft,/const game=sideButton\('pg500-side-game'/);
  assert.doesNotMatch(soft,/rail\.prepend\(game\)/);
  assert.match(ui,/class="pg346-all-topics"/);
  assert.match(ui,/<a href="\.\/game\.html">/); // Trainer remains on the bottom nav
  assert.match(css,/#pg346 \.pg346-side-rail > \.pg500-side-game \{\s*display:none!important;/);
});

test('v544 does not show enormous default clarification in dialogue cards',()=>{
  const ui=source('../assets/panda-hsk2-preview-ui-v1.mjs');
  assert.match(ui,/obsoleteLongClarification='我没听懂。你可以再说一遍，或者换一种说法吗？'/);
  assert.match(ui,/rows\.filter\(e=>e\.hanzi!==obsoleteLongClarification\)\.slice\(-3\)/);
});
