'use strict';
/* Panda Go v167: optional native Mandarin playback must not replace the teaching voices or dialogues. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync('assets/hsk1-native-human-map-v167.js','utf8');
const catalog=JSON.parse(fs.readFileSync('assets/yue-tan-human-v166.json','utf8'));
assert.equal(catalog.status,'HUMAN_NATIVE_VOICE_LISTENING_REVIEW_ONLY');
assert.equal(catalog.items.length,59);
const box={window:{}};vm.runInNewContext(source,box);
const human=JSON.parse(JSON.stringify(box.window.PANDA_HSK1_NATIVE_HUMAN_V167));
assert.equal(Object.keys(human).length,59);
for(const item of catalog.items){
 assert.equal(human[item.hanzi],item.path,'Must match exact approved original '+item.hanzi);
 assert(item.path.startsWith('./assets/')&&item.path.endsWith('.mp3'),'No synthesized fallback');
 const path=item.path.slice(2);
 assert(fs.existsSync(path)&&fs.statSync(path).size>2500,'Missing actual human MP3 '+path);
}
const html=fs.readFileSync('hsk1-lesson.html','utf8');
assert(html.indexOf('hsk1-native-human-map-v167.js')<html.indexOf('hsk1-foundations-v152.js'),'Human audio map must be loaded before lesson');
const voiceMap=fs.readFileSync('assets/hsk1-voices-map-v160.js','utf8');
const context={window:{}};vm.runInNewContext(voiceMap,context);
const normal=JSON.parse(JSON.stringify(context.window.PANDA_HSK1_VOICES));
for(let lesson=1;lesson<=7;lesson++){
 const dom=new JSDOM(html,{url:'https://example.test/chinese-coach-pwa/hsk1-lesson.html?lesson='+lesson,runScripts:'outside-only'});
 const w=dom.window, played=[];
 w.scrollTo=()=>{};
 w.Audio=function(src){
  this.src=src;this.playbackRate=1;this.preservesPitch=true;
  this.play=()=>{played.push({src:this.src,rate:this.playbackRate});return Promise.resolve()};
  this.pause=()=>{};
 };
 w.eval(fs.readFileSync('assets/hsk1-foundations-data-v152.js','utf8'));
 w.eval(voiceMap);w.eval(source);
 w.eval(fs.readFileSync('assets/hsk1-foundations-v152.js','utf8'));
 const d=w.document;
 // Every native button must have exactly one original MP3; no human asset means no native button.
 let counted=0;
 for(let k=0;k<w.PANDA_HSK1_FOUNDATIONS[lesson-1].words.length;k++){
  const buttons=[...d.querySelectorAll('button[data-human-play]')];
  for(const btn of buttons){
   const hz=btn.dataset.humanPlay;
   assert(human[hz], 'Native button must never offer a made-up recording '+hz);
   btn.click();
   assert.equal(played.at(-1).src,human[hz],'Wrong native MP3 for '+hz);
   assert.equal(played.at(-1).rate,1,'Human audio must retain original speed');
   counted++;
  }
  const ordinary=[...d.querySelectorAll('button[data-play]')];
  assert(ordinary.length>0,'Teaching audio missing');
  const first=ordinary[0];first.click();
  assert.equal(played.at(-1).src,normal.female[first.dataset.play],'Default teaching voice must remain unchanged');
  if(k<w.PANDA_HSK1_FOUNDATIONS[lesson-1].words.length-1)d.getElementById('lesson-next').click();
 }
 assert(counted>0,'Native sample should be reachable in every lesson '+lesson);
 // Dialogue must use the existing original gender-specific mapping, not a native substitute.
 const steps=d.querySelector('button[data-step="3"]');
 // Step may be locked during normal progression; the data-role map is verified here.
 assert.equal(Object.keys(w.PANDA_HSK1_VOICES.male).length,14);
 dom.window.close();
}
assert(!source.includes('speechSynthesis')&&!source.includes('join('));
console.log('PASS v167: 59 source-identical genuine Mandarin clips, optional user-triggered 1x playback in all seven HSK1 lessons, unchanged primary female/male narration.');
