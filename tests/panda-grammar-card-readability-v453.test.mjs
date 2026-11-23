import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {correctPandaGrammarV2} from '../assets/panda-grammar-hsk12-v2.mjs';
import {lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ui=read('assets/panda-live-v346.mjs');
const css=read('assets/panda-chat-corrections-v377.css');
const html=read('panda-voice-pilot.html');
const sw=read('sw.js');
const pack=JSON.parse(read('assets/offline-pack.json'));
const render=ui.slice(ui.indexOf('  function renderFeedback(s){'),ui.indexOf('  function ingestSpeechSignal('));

test('short corrected line and why are above the closed details button',()=>{
 assert.ok(render.length>100);
 const right=render.indexOf("root.append(el('p','pg445-after'");
 const why=render.indexOf("root.append(el('p','pg445-brief',shortRule))");
 const details=render.indexOf("const details=document.createElement('details')");
 assert.ok(right>=0&&why>right&&details>why,'Correct phrase and short rule must appear without opening Details');
 assert.ok(!render.slice(0,details).includes("root.append(el('p','pg445-pinyin'"),'Pinyin belongs in detailed explanation');
 assert.ok(render.includes("details.append(el('p','pg445-before'"),'Original phrase retained within details');
 assert.ok(render.includes("if(wrong.pinyin)details.append("),'Pinyin retained in details');
 assert.ok(render.includes("if(wrong.ru)details.append("),'Translation retained in details');
 assert.ok(render.includes("if(wrong.why)details.append("),'Full rule retained in details');
 assert.ok(render.includes("if(wrong.uncertain)root.append("),'ASR uncertainty is visible');
 assert.ok(render.includes("meaningOnly?'💡 Пример ответа: ':'✅ '"),'Do not mislabel meaning differences as grammar errors');
});

test('concise rule is reviewed for the two Android screenshots and contains no clipped ellipsis',()=>{
 assert.ok(render.includes("Повтор глагола уже образует вопрос — 吗 не нужна."));
 assert.ok(render.includes("Время ставят перед действием: сначала часы, затем глагол."));
 for(const [input,right,expected] of [
  ['她是不是医生吗','她是不是医生？',/A-不-A/u],
  ['你起床八点','你八点起床。',/время действия/u]
 ]){
   const c=correctPandaGrammarV2(input)?.spoken?.correction;
   assert.equal(c?.hanzi,right);
   assert.match(c.why,expected);
   assert.ok(lookupPandaVoiceClip(c.hanzi)?.src.includes('panda-grammar-voice-v451'));
 }
});

test('feedback CSS permits compact card to grow inside scene without hard 35% height cap',()=>{
 assert.ok(css.includes('/* v453:'));
 assert.ok(css.includes('max-height:calc(97% - 12px)'));
 assert.ok(css.includes('width:84%'));
 assert.ok(css.includes('#pg346 .pg346-feedback:not([hidden]):has(.pg445-details[open])'));
 assert.ok(css.includes('overflow-wrap:anywhere'));
 assert.ok(css.includes('max-height:calc(97% - 8px)'), 'Small-viewport override must defeat old 32% restriction');
});

test('approved Panda design, auto-speaking grammar and 42 MP3 remain intact',()=>{
 assert.ok(html.includes('panda-chat-corrections-v377.css?v=454'));
 assert.match(html,/panda-hsk2-preview-ui-v1\.mjs\?v=\d+/, 'Active approved Panda UI');
 assert.match(html,/panda-hsk2-preview-core-v1\.mjs\?v=\d+/, 'Active Panda correction engine');
 assert.match(sw,/chinese-coach-pwa-v\d+/, 'Versioned offline cache');
 assert.ok(pack.version>=454,'Approved offline version must not regress');
 assert.equal(pack.files.filter(x=>/panda-grammar-voice-v451\/g\d{3}\.mp3/.test(x)).length,42);
 assert.ok(ui.includes('lookupPandaVoiceClip'));
 assert.ok(ui.includes('sound.disabled=!clipFor(e)'));
 const activeCore=read('assets/panda-hsk2-preview-core-v1.mjs');
 const activeUI=read('assets/panda-hsk2-preview-ui-v1.mjs');
 assert.ok(activeCore.includes("if(verifiedClip)play({hanzi:c.hanzi,audioKey:c.hanzi})"));
 assert.ok(activeUI.includes("root.append(el('p','pg445-brief',shortRule))"));
 assert.ok(activeUI.includes("if(wrong.why)details.append("));
});
