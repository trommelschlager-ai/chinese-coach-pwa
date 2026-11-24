import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {correctPandaGrammarV2} from '../assets/panda-grammar-hsk12-v2.mjs';

const ui=fs.readFileSync(new URL('../assets/panda-live-v346.mjs',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8');
const render=ui.slice(ui.indexOf('  function renderFeedback(s){'),ui.indexOf('  function ingestSpeechSignal('));

test('actual grammatical explanation is directly visible, not hidden in details',()=>{
 assert.ok(render.length>100,'Render block found');
 assert.ok(render.includes("const why=String(wrong.why||'').trim()"));
 assert.ok(render.includes("firstSentence?'Почему: '+firstSentence"),'Rule visible in main card');
 assert.ok(render.indexOf("root.append(el('p','pg445-brief',shortRule))") < render.indexOf("const details=document.createElement('details')"),'Brief rule before collapsed details');
 assert.ok(render.includes("if(wrong.why)details.append("),'Full rule remains available');
 assert.ok(!render.includes("wrong.title||'Смотри правило"),'Generic title must not replace rule');
});

for(const [wrong,right,rule] of [
 ['他有二个妹妹','他有两个妹妹。','Для количества «два»'],
 ['她是不是医生吗','她是不是医生？','В конструкции A-不-A'],
 ['你起床八点','你八点起床。','В обычном предложении время']
]){
 test('screenshot example '+wrong+' explains why',()=>{
  const result=correctPandaGrammarV2(wrong);
  const c=result?.spoken?.correction;
  assert.equal(c?.hanzi,right);
  assert.ok(c.why.startsWith(rule),'Expected grammatical rationale');
  assert.ok(c.pinyin.length>5);
  assert.notEqual(c.why,c.title);
 });
}

test('approved visuals and disabled audio handling remain intact',()=>{
 assert.match(html,/panda-hsk2-preview-ui-v1\.mjs\?v=\d+/);
 const active=fs.readFileSync(new URL('../assets/panda-hsk2-preview-ui-v1.mjs',import.meta.url),'utf8');
 assert.ok(active.includes('sound.disabled=!clipFor(e)'));
 assert.ok(html.includes('panda-chat-corrections-v377.css?v=454'));
 assert.ok(render.includes("details.append(el('p','pg445-before'"),'Original phrase remains in Details');
 assert.ok(ui.includes('lookupPandaVoiceClip'));
 assert.ok(ui.includes('sound.disabled=!clipFor(e)'));
});
