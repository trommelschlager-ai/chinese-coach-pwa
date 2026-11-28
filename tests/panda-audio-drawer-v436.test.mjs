import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PANDA_CLIPS} from '../assets/panda-voice-clips-v365.mjs';
import {PANDA_V411_VOICE} from '../assets/panda-voice-v411.mjs';
import {lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';
import {audioStudyLine436,STUDY_ANNOTATION_COUNT_436} from '../assets/panda-audio-study-v436.mjs';
import {availableAskGroups} from '../assets/panda-ask-catalog-v326.mjs';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const norm=s=>String(s||'').replace(/[\s。！？，?!,]/g,'');
test('all 155 approved Nov 14 recordings have exact MP3s without loading the optional voice index',()=>{
 assert.equal(PANDA_CLIPS.length,155);
 assert.equal(STUDY_ANNOTATION_COUNT_436,155);
 const roots=new Set();
 for(const clip of PANDA_CLIPS){
  assert.match(clip.src,/^\.\/assets\/panda-voice-clips-v365\/p\d{3}\.mp3$/);
  const data=fs.readFileSync(new URL('../'+clip.src.slice(2),import.meta.url));
  assert(data.length>3000,clip.src);
  assert.equal(data.subarray(0,3).toString('ascii'),'ID3',clip.src);
  const found=lookupPandaVoiceClip(clip.zh+'。');
  assert(found?.src,'No verified audio for '+clip.zh);
  assert.equal(found.start,0);
  assert.equal(found.end,null);
  assert(PANDA_CLIPS.some(c=>c.src===found.src&&norm(c.zh)===norm(clip.zh))||
    PANDA_V411_VOICE.some(c=>c.src===found.src&&norm(c.zh)===norm(clip.zh)),
   'Never substitute another phrase: '+clip.zh);
  roots.add(clip.file);
 }
 assert.equal(roots.size,10);
});
test('155 source-indexed study annotations contain Chinese, tone-marked pinyin and Russian',()=>{
 for(const clip of PANDA_CLIPS){
  const entry=audioStudyLine436(clip);
  assert.equal(entry.zh,clip.zh);
  assert(entry.pinyin?.length>5,'Missing pinyin: '+clip.zh);
  assert(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/iu.test(entry.pinyin),
   'Add tone marks for '+clip.zh+': '+entry.pinyin);
  assert(entry.ru?.length>=4,'Missing Russian: '+clip.zh);
 }
 const sample=PANDA_CLIPS.find(c=>c.zh==='你会写汉字吗');
 const text=audioStudyLine436(sample);
 assert.match(text.pinyin,/huì xiě Hànzì/);
 assert.match(text.ru,/иероглиф/i);
});
test('absent phrases remain silent instead of borrowing sound, no generated voice added',()=>{
 assert.equal(lookupPandaVoiceClip('没有录音的句子'),null);
 assert.equal(lookupPandaVoiceClip('他是学生吗？'),null);
 assert.equal(lookupPandaVoiceClip('她是老师吗？'),null);
 assert(lookupPandaVoiceClip('你会写汉字吗？')?.src.endsWith('/p006.mp3'));
 assert(lookupPandaVoiceClip('你有姐姐吗？')?.src.endsWith('/p098.mp3'));
 assert(lookupPandaVoiceClip('你有弟弟吗？')?.src.endsWith('/p100.mp3'));
 assert.equal(audioStudyLine436({zh:'不存在'}).pinyin,null);
});
test('approved, unlocked conversation questions declare exact sound truthfully',()=>{
 const topics=availableAskGroups([1,2,3,4,5,6,7],[],new Date(2026,10,17));
 let checked=0;
 for(const group of topics)for(const q of group.questions){
  assert.equal(q.hasReplyAudio,!!lookupPandaVoiceClip(q.hanzi),q.hanzi);
  assert(q.pinyin&&q.ru);
  checked++;
 }
 assert(checked>=15,'The real topic catalogue should have conversational questions');
});
test('v436 drawer renders each recording as a Chinese+pinyin+Russian play button',()=>{
 const html=read('panda-voice-pilot.html'),js=read('assets/panda-live-v346.mjs');
 assert(html.includes('panda-topic-catalog-v374.css?v=374'),'The original roomy topic menu stays active');
 assert(!html.includes('panda-topics-compact-v436.css?v=436'),'Never use the v436 shallow drawer that hides the question cards');
 assert.match(html,/src="\.\/assets\/panda-hsk2-preview-core-v1\.mjs\?v=\d+/);
 assert.match(html,/src="\.\/assets\/panda-hsk2-preview-ui-v1\.mjs\?v=\d+/);
 const activeUI=read('assets/panda-hsk2-preview-ui-v1.mjs');
 for(const selector of ['pg436-audio-zh','pg436-audio-py','pg436-audio-ru','pg436-audio-icon','pg374-question'])assert(activeUI.includes(selector),'Current drawer lost '+selector);
 assert(activeUI.includes('audioStudyLine436(clip)'));
 assert(activeUI.includes('bridge.playEntry({hanzi:clip.zh})'));
 assert(activeUI.includes('bridge.startTopicQuestion(id,q.hanzi)'));
 assert(js.includes("audioStudyLine436(clip)"));
 for(const selector of ['pg436-audio-zh','pg436-audio-py','pg436-audio-ru','pg436-audio-icon'])assert(js.includes(selector));
 assert(js.includes('bridge.playEntry({hanzi:clip.zh})'));
 assert(js.includes('bridge.startTopicQuestion(id,q.hanzi)'));
 assert(js.includes("pg374-question"));
 assert(js.includes("panda-character-clean-v349.webp"),'Approved Panda must stay unchanged');
});
test('the original roomy topic list is restored after Android usability feedback',()=>{
 const css=read('assets/panda-topic-catalog-v374.css');
 const html=read('panda-voice-pilot.html');
 assert.match(css,/max-height:min\(68%,560px\)/,'Restore the original taller list');
 assert.match(css,/overflow-y:auto/,'Questions must be scrollable');
 assert.match(css,/\.pg374-question/,'Keep selectable question cards');
 assert(!html.includes('panda-topics-compact-v436.css'),'The shallow v436 override must stay disabled');
 assert(!css.includes('pg352-mascot'),'Do not modify character');
 assert(!css.includes('pg346-speech'),'Do not modify speech bubble');
});
test('v436 offline pack and install service worker include new study metadata without bloating shell',()=>{
 const offline=JSON.parse(read('assets/offline-pack.json'));
 assert(offline.version>=436,'Panda v436 assets must remain in current or later offline pack');
 for(const file of [
  './assets/panda-audio-study-v436.mjs?v=436',
  './assets/panda-topics-compact-v436.css?v=436',
  './assets/panda-live-screen-v270.mjs?v=465',
  './assets/panda-live-v346.mjs?v=453',
  './assets/panda-live-audio.mjs?v=436'
 ])assert(offline.files.includes(file),'Missing offline asset '+file);
 for(const c of PANDA_CLIPS)assert(offline.files.some(x=>x.split('?')[0]===c.src),'Missing audio '+c.src);
 const sw=read('sw.js');
 const activeVersion=Number(sw.match(/const CACHE='chinese-coach-pwa-v(\d+)-/)?.[1]);
 assert.equal(activeVersion,offline.version,'Current SW cache version must match offline pack');
 const core=JSON.parse(sw.match(/const CORE=(\[[^\n]+\])/)[1]);
 for(const file of ['./assets/panda-audio-study-v436.mjs?v=436','./assets/panda-topics-compact-v436.css?v=436'])assert(core.includes(file));
 const art=JSON.parse(sw.match(/const CORE_ART=new Set\((\[[^\n]+\])\)/)[1]);
 // CORE is now the downloadable course pack. The install handler uses INSTALL_SHELL.
 const shell=JSON.parse(sw.match(/const INSTALL_SHELL=(\[[\s\S]*?\]);/)[1].replace(/,\s*\]/,']'));
 assert(shell.length<=205,'Keep the actual install shell bounded');
 assert.equal(new Set(shell).size,shell.length,'No duplicate install requests');
 assert(!shell.some(p=>/\.(?:mp3|ogg)(?:\?|$)/i.test(p)),'Audio belongs in the resumable course pack');
 assert(sw.includes('cache.addAll(INSTALL_SHELL.map'),'Check the actual install handler');
 assert.equal(new Set(core).size,core.length,'No duplicate precache requests');
});

test('all 165 approved recorded phrases are listed with Chinese, pinyin and Russian captions',()=>{
 const all=[...PANDA_CLIPS,...PANDA_V411_VOICE];
 assert.equal(all.length,165);
 const ui=read('assets/panda-live-v346.mjs');
 assert(ui.includes('[...PANDA_CLIPS,...PANDA_V411_VOICE]'),'All recordings must appear in the drawer');
 assert(ui.includes("PANDA_CLIPS.length+PANDA_V411_VOICE.length"),'All recordings count should be displayed');
 for(const clip of all){
  const study=audioStudyLine436(clip);
  const py=study.pinyin||clip.pinyin,ru=study.ru||clip.ru;
  assert(py&&ru,clip.zh);
  assert(lookupPandaVoiceClip(clip.zh)?.src,'No approved MP3 for '+clip.zh);
 }
});
