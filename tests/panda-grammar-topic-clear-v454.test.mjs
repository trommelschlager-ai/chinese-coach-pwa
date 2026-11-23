import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const css=read('assets/panda-chat-corrections-v377.css');
const btnCss=read('assets/panda-live-v346.css');
const html=read('panda-voice-pilot.html');
const sw=read('sw.js');
const pack=JSON.parse(read('assets/offline-pack.json'));

test('v454 feedback leaves topic button unobstructed on mobile even when details open',()=>{
 const rule=css.slice(css.indexOf('/* v454:'));
 assert.ok(rule.startsWith('/* v454:'),'Final CSS override exists');
 assert.match(rule,/#pg346 \.pg346-feedback:not\(\[hidden\]\):has\(\.pg445-details\[open\]\)/);
 assert.match(rule,/box-sizing:border-box;/);
 assert.match(rule,/left:3%;/);
 assert.match(rule,/width:65%;/);
 assert.match(btnCss,/#pg346 \.pg346-all-topics\{position:absolute;z-index:6;right:4\.5%;bottom:6%;width:min\(24%,108px\)/);
 // Compare right edge of the closed/open grammar card with the topic button's left edge.
 for(const viewWidth of [320,360,375,390,414,480,694,768]){
   const cardRight=viewWidth*(.03+.65);
   const topicLeft=viewWidth*(1-.045)-Math.min(viewWidth*.24,108);
   assert.ok(topicLeft-cardRight>=6,'Feedback touches topics button at width '+viewWidth);
 }
});
test('rule readability and full explanation stay in place',()=>{
 const ui=read('assets/panda-live-v346.mjs');
 assert.ok(ui.includes('Повтор глагола уже образует вопрос — 吗 не нужна.'));
 assert.ok(ui.includes('Время ставят перед действием: сначала часы, затем глагол.'));
 assert.ok(ui.includes("root.append(el('p','pg445-brief',shortRule))"));
 assert.ok(ui.includes("details.append(el('p','pg445-before'"));
 assert.ok(ui.includes("if(wrong.why)details.append("));
 assert.ok(css.includes('max-height:calc(98% - 6px)'));
});
test('42 approved MP3 and Android v454 publication references are preserved',()=>{
 assert.ok(html.includes('panda-chat-corrections-v377.css?v=454'));
 assert.match(html,/panda-hsk2-preview-ui-v1\.mjs\?v=\d+/, 'Current approved UI must load');
 assert.match(html,/panda-hsk2-preview-core-v1\.mjs\?v=\d+/, 'Current Panda dialogue must load');
 assert.match(sw,/chinese-coach-pwa-v\d+/, 'Versioned service worker cache must remain');
 assert.ok(sw.includes('panda-chat-corrections-v377.css?v=454'));
 assert.ok(pack.version>=454,'The offline pack must not roll back an approved release');
 assert.ok(pack.files.includes('./assets/panda-chat-corrections-v377.css?v=454'));
 assert.ok(pack.files.some(x=>/^\.\/assets\/panda-hsk2-preview-core-v1\.mjs\?v=\d+$/.test(x)), 'Current core available in the offline pack');
 assert.equal(pack.files.filter(s=>/^\.\/assets\/panda-grammar-voice-v451\/g\d{3}\.mp3$/.test(s)).length,42);
 for(const [zh,file] of [
  ['他有两个妹妹。','g001.mp3'],
  ['她是不是医生？','g002.mp3'],
  ['你八点起床。','g003.mp3']]){
   assert.ok(lookupPandaVoiceClip(zh)?.src.endsWith(file), 'Voice lost: '+zh);
 }
});
