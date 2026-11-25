import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {respondToNaturalStatement} from '../assets/panda-natural-statements-v544.mjs';
import {lookupApprovedPandaVoice} from '../assets/panda-approved-voice-registry-v516.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const core=read('../assets/panda-hsk2-preview-core-v1.mjs');
const html=read('../panda-voice-pilot.html');
const preview=read('../panda-ai-hsk2-preview.html');
const pack=JSON.parse(read('../assets/offline-pack.json'));
const sw=read('../sw.js');

test('four Android-screenshot Mandarin inputs have reviewed contextual answers and approved MP3 keys',()=>{
 const cases=[
  ['我是老师。','你是老师！你在哪儿工作？','PA-001.mp3'],
  ['我不是老师。','明白了。你做什么工作？','PA-008.mp3'],
  ['我在看电影。','你在看什么电影？','PA-005.mp3'],
  ['很无聊。','我们聊聊天吧！你喜欢看电影吗？','PA-006.mp3']
 ];
 for(const [input,expected,clipFile] of cases){
  const out=respondToNaturalStatement(input);
  assert(out,'Missing recognized input: '+input);
  assert.equal(out.reply.hanzi,expected,input);
  assert.equal(out.spoken.toneVerified,false,'Never infer acoustic tones from text');
  assert(out.spoken.pinyin,'Missing tone-marked pinyin: '+input);
  assert(lookupApprovedPandaVoice(out.reply.hanzi)?.src.endsWith('/'+clipFile),
   'Missing approved exact MP3 for '+input);
 }
});

test('default beginner entry is natural in both tabs; explicit scored HSK2 still separate',()=>{
 assert(core.includes("return {kind:'hsk2',id:101,beginnerGreeting:true};"));
 assert(core.includes("entry.beginnerGreeting&&hsk2.id===101"));
 assert(core.includes("if(mode==='nonstop'&&entry.beginnerGreeting&&hsk2.id===101)"));
 assert(core.includes("hsk2.openChat=true;state.mode='nonstop'"));
 assert(core.includes("if(hsk2.openChat&&mode==='short')"));
 assert(core.includes("if(hsk2){submitHSK2(input);return;}"));
 assert(core.includes("if(((hsk2&&(hsk2.openChat||(entry.beginnerGreeting&&hsk2.id===101)))||(!hsk2&&state.mode==='nonstop'))&&!state.dayMode)"));
 assert(core.includes("if(state.dayMode){"));
});

test('v550 is loaded on both Panda AI pages and versioned by PWA service worker',()=>{
 assert(pack.version>=550);
 const active=html.match(/panda-hsk2-preview-core-v1\.mjs\?v=\d+/)?.[0];
 assert(active,'Locate active Panda core from the actual HTML');
 for(const page of [html,preview])assert(page.includes(active),'The same core must load in both Panda pages');
 assert(sw.includes("const CACHE='chinese-coach-pwa-v"+pack.version+"-"));
 assert(sw.includes(active));
 assert(pack.files.includes('./assets/'+active));
 assert(html.includes('panda-hsk2-preview-ui-v1.mjs?v=546'));
});
