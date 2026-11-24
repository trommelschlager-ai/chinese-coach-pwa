import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const css=read('../assets/panda-ai-chat-readable-v551.css');
const old=read('../assets/panda-ai-approved-layout-v547.css');
const ui=read('../assets/panda-hsk2-preview-ui-v1.mjs');
const html=read('../panda-voice-pilot.html');
const mirror=read('../panda-ai-hsk2-preview.html');
const sw=read('../sw.js');
const pack=JSON.parse(read('../assets/offline-pack.json'));

test('long Hanzi/pinyin/translation rows grow instead of being three equal-height clipped slots',()=>{
 assert(old.includes('grid-template-rows:repeat(3,minmax(0,1fr))!important'));
 assert(old.includes('height:100%!important;max-height:100%!important'));
 assert(css.includes('grid-template-rows:none!important'));
 assert(css.includes('display:flex!important'));
 assert(css.includes('overflow-y:auto!important'));
 assert(css.includes('height:auto!important'));
 assert(css.includes('max-height:none!important'));
 assert(css.includes('overflow:visible!important'));
 assert(css.includes('grid-template-rows:auto auto!important'));
 assert(css.includes('line-height:1.3!important'),'Pinyin tone marks need sufficient line height');
 assert(css.includes('.pg346-row.pg506-long .pg346-ru'),'Long Russian translation must have its own row');
 assert(ui.includes("row.classList.add('pg506-long')"));
 assert(ui.includes('requestAnimationFrame(revealLatest)'),'New replies must be reachable by scrolling');
});
test('fixed height history strip and keyboard-hiding rule protect approved Panda and stone',()=>{
 assert(css.includes('flex:0 0 clamp(156px,22dvh,200px)!important'));
 assert(css.includes('max-height:clamp(156px,22dvh,200px)!important'));
 assert(css.includes(':root[data-keyboard="true"]'));
 assert(css.includes('display:none!important'));
 assert(css.includes(':not([data-day-scenario="ready"])'),'My Day scenario must not be restyled');
 for(const forbidden of ['.pg352-mascot','.pg346-panda','.pg346-scene','.pg346-nav','.pg346-header']){
  assert(!css.includes(forbidden),'Visual regression risk: '+forbidden);
 }
 assert(old.includes('top:var(--pa-panda-top)'));
});
test('both Panda AI pages load readable CSS AFTER approved art, with fresh SW cache v551',()=>{
 const file='./assets/panda-ai-chat-readable-v551.css?v=551';
 assert(pack.version>=551,'Readable chat must remain enabled after subsequent releases');
 for(const page of [html,mirror]){
  const approved=page.indexOf('panda-ai-approved-layout-v547.css?v=547');
  const readable=page.indexOf(file.slice(2));
  assert(approved>=0&&readable>approved,'New CSS must override legacy fixed rows');
 }
 assert(pack.files.includes(file));
 assert(sw.includes(file));
 assert(sw.includes("const CACHE='chinese-coach-pwa-v"+pack.version+"-"));
});
