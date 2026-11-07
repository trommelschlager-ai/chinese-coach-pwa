/* HSK1 voice release QA: 138 exact-role MP3 paths, no cross-gender mismatches. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const path=require('node:path');
const mapFile='assets/hsk1-voices-map-v160.js',manifest='assets/hsk1-voices-v156/manifest.json';
const femaleManifestFile='assets/hsk1-voices-v160/manifest.json';
assert(fs.existsSync(femaleManifestFile),'New Chinese MeloTTS recordings have not been generated');
const femaleManifest=JSON.parse(fs.readFileSync(femaleManifestFile,'utf8'));
assert.equal(femaleManifest.voice,'MeloTTS-ZH');
assert.equal(femaleManifest.engine,'myshell-ai/MeloTTS');
assert.equal(femaleManifest.license,'MIT');
assert.equal(femaleManifest.total_files,123);
assert.equal(femaleManifest.all_utterance_tones_verified,false);
assert(femaleManifest.files.some(x=>x.text==='妈妈'&&x.pinyin_reference==='māma'),'Critical māma pronunciation clip missing');
assert(fs.existsSync(mapFile),'No rendered two-speaker audio map. Do not ship ungenerated voice bundle.');
assert(fs.existsSync(manifest),'No reviewed Kokoro voice metadata');
const metadata=JSON.parse(fs.readFileSync(manifest,'utf8'));
assert(metadata.total_files>=125&&metadata.total_files<=300);
assert.deepEqual(metadata.voices,{female:'zf_xiaoxiao',male:'zm_yunjian'});
assert.equal(metadata.model_license,'Apache-2.0');
assert.equal(metadata.all_utterance_tones_native_reviewed,false,'Do not claim phonetic QA without human review');
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(mapFile,'utf8'),ctx);
const voices=JSON.parse(JSON.stringify(ctx.window.PANDA_HSK1_VOICES));
assert.equal(Object.keys(voices.female).length,metadata.role_counts.female);
assert.equal(Object.keys(voices.male).length,metadata.role_counts.male);
assert.equal(voices.female['日'],'./assets/hsk1-voice-corrections-v157/ri-native-yue-tan.mp3');
const topicCtx={window:{}};
vm.runInNewContext(fs.readFileSync('assets/hsk1-foundations-data-v152.js','utf8'),topicCtx);
const topics=JSON.parse(JSON.stringify(topicCtx.window.PANDA_HSK1_FOUNDATIONS));
const wanted=new Set();
function demand(role,hz,where){
 const loc=voices[role]?.[hz];
 assert(loc,where+': no '+role+' Mandarin recording for '+hz);
 const abs=loc.replace(/^\.\//,'');
 const nativeRi='assets/hsk1-voice-corrections-v157/ri-native-yue-tan.mp3';
 if(role==='female'&&hz==='日'){
  assert.equal(abs,nativeRi,'日 must use licensed native 4th-tone pronunciation');
 } else {
  assert(abs.startsWith(role==='female'?'assets/hsk1-voices-v160/':'assets/hsk1-voices-v156/'),where+': incorrect speaker audio path '+loc);
 }
 assert(fs.existsSync(abs),where+': missing binary '+abs);
 assert(fs.statSync(abs).size>=1200,where+': MP3 too short '+abs);
 const head=fs.readFileSync(abs).subarray(0,3);
 assert(head.toString()==='ID3'||head[0]===255,where+': not MP3 '+abs);
 wanted.add(role+'|'+hz);
 return loc;
}
for(const t of topics){
 for(const word of t.words)demand('female',word[0],t.id+'.words');
 for(const rule of t.rules)demand('female',rule[2],t.id+'.rule');
 for(const build of t.builds||[t.build])demand('female',build.target.join(''),t.id+'.build');
 demand('female',t.speech.hz,t.id+'.speech');
 for(const line of t.dialogue)demand(line[0]==='А'?'male':'female',line[1],t.id+'.dialogue');
}
assert.equal(wanted.size,metadata.total_files,'Every binary should correspond to an active course phrase');
const html=fs.readFileSync('hsk1-lesson.html','utf8');
assert(html.indexOf('hsk1-voices-map-v160.js')<html.indexOf('hsk1-foundations-v152.js'),'Role map must load before player');
const source=fs.readFileSync('assets/hsk1-foundations-v152.js','utf8');
assert(source.includes('roleForDialogue')&&source.includes("data-speaker"),'Player must preserve role-specific playback');
assert(source.includes('FEMALE_SPEED_KEY=\'pg-hsk1-female-speed-v161\''),'Speech speed must persist separately from progress');
assert(source.includes('preservesPitch=true'),'Pitch preservation required when slowing down');
assert(html.includes('hsk1-female-voice-speed'),'Voice-speed control must be visible on mobile');
for(let i=0;i<topics.length;i++){
 const topic=topics[i];
 const dom=new JSDOM(html,{url:'https://example.test/chinese-coach-pwa/hsk1-lesson.html?lesson='+(i+1),runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,d=w.document;
 w.scrollTo=()=>{};
 const calls=[],played=[];
 w.Audio=function(src){
  calls.push(src);played.push(this);this.pause=()=>{};this.play=()=>Promise.resolve();this.src=src;
  this.playbackRate=1;this.preservesPitch=true;
 };
 w.localStorage.setItem('pg-hsk1-v3-'+topic.id,JSON.stringify({step:3,maxStep:3}));
 // Simulate the user's previous preference on a separate lesson.
 if(i===1)w.localStorage.setItem('pg-hsk1-female-speed-v161','0.75');
 for(const el of [...d.querySelectorAll('script[src]')]){
  const f=new URL(el.src).pathname.replace('/chinese-coach-pwa/','');
  assert(fs.existsSync(f),'Missing script '+f);
  w.eval(fs.readFileSync(f,'utf8'));
 }
 const control=d.getElementById('hsk1-female-voice-speed');
 assert(control,'Speed selector absent in lesson '+topic.id);
 const defaultSpeed=i===1?0.75:0.85;
 assert.equal(Number(control.value),defaultSpeed,'Persisted / default learning speed mismatch');
 const rows=[...d.querySelectorAll('[data-dialog-row]')];
 assert.equal(rows.length,1,'Exactly one dialogue card visible for '+topic.id);
 assert(!d.querySelector('[data-dialog-all]').disabled,'Full dialogue playback enabled for '+topic.id);
 for(let row=0;row<topic.dialogue.length;row++){
  const [who,hz]=topic.dialogue[row],role=who==='А'?'male':'female';
  const active=d.querySelector('[data-dialog-row]');
  assert(active&&Number(active.dataset.dialogRow)===row,'Dialogue progress must expose row '+row);
  const btn=active.querySelector('button[data-play]');
  assert(btn&&!btn.disabled,'Dialogue line unavailable: '+topic.id+' row '+row);
  assert.equal(btn.dataset.speaker,role,'Incorrect role on '+topic.id+' row '+row);
  btn.click();
  assert.equal(calls[calls.length-1],voices[role][hz],'Wrong voice in '+topic.id+' row '+row);
  assert.equal(played[played.length-1].playbackRate,role==='female'?defaultSpeed:1,
   'Female slow mode must not modify male speaker in '+topic.id+' row '+row);
  assert.equal(played[played.length-1].preservesPitch,true,'Chinese pitch must be preserved');
  if(row<topic.dialogue.length-1){
   const forward=d.querySelector('[data-dialogue-next]');
   assert(forward,'Next dialogue card missing in '+topic.id);
   forward.click();
  }
 }
 if(i===0){
  // Return to the female reply, because only one dialogue line is visible.
  while(d.querySelector('[data-dialogue-prev]'))d.querySelector('[data-dialogue-prev]').click();
  d.querySelector('[data-dialogue-next]').click();
  const femaleRow=d.querySelector('[data-dialog-row]');
  assert(femaleRow?.querySelector('[data-speaker="female"]'),'Need a female dialogue line for speed test');
  const control=d.getElementById('hsk1-female-voice-speed');
  control.value='0.75';control.dispatchEvent(new w.Event('change',{bubbles:true}));
  assert.equal(w.localStorage.getItem('pg-hsk1-female-speed-v161'),'0.75');
  femaleRow.querySelector('button[data-play]').click();
  assert.equal(played[played.length-1].playbackRate,0.75,'Slow mode must play female at 0.75x');
  control.value='1';control.dispatchEvent(new w.Event('change',{bubbles:true}));
  assert.equal(played[played.length-1].playbackRate,1,'Changing to original speed should apply immediately');
  control.value='0.85';control.dispatchEvent(new w.Event('change',{bubbles:true}));
  assert.equal(w.localStorage.getItem('pg-hsk1-female-speed-v161'),'0.85');
  // Reach the last vocabulary page to check that native 日 replaces synthetic 日.
  d.querySelector('[data-step="0"]').click();
  while(d.querySelector('[data-word-next]'))d.querySelector('[data-word-next]').click();
  const ri=d.querySelector('button[data-play="日"]');
  assert(ri&&!ri.disabled,'Native 日 vocabulary playback missing');
  ri.click();
  assert.equal(calls[calls.length-1],voices.female['日']);
  assert.equal(played[played.length-1].playbackRate,1,'Human native 日 sample must play unmodified');
 }
 w.close();
}
const allMP3=metadata.files.map(x=>x.file);
assert.equal(new Set(allMP3).size,allMP3.length,'Duplicate generated file IDs');
console.log('Panda Go v161: '+wanted.size+' exact audio files, 0.85x female default and 0.75x/1.0x saved speed choices, male and human tone clips unchanged.');
