/* HSK1 voice release QA: 138 exact-role MP3 paths, no cross-gender mismatches. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const path=require('node:path');
const mapFile='assets/hsk1-voices-map-v159.js',manifest='assets/hsk1-voices-v156/manifest.json';
const femaleManifestFile='assets/hsk1-voices-v159/manifest.json';
assert(fs.existsSync(femaleManifestFile),'Approved Xiaoni female recordings are not generated');
const femaleManifest=JSON.parse(fs.readFileSync(femaleManifestFile,'utf8'));
assert.equal(femaleManifest.speaker,'zf_xiaoni');
assert.equal(femaleManifest.license,'Apache-2.0');
assert.equal(femaleManifest.total_files,123);
assert.equal(femaleManifest.human_tone_audit_complete,false);
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
  assert(abs.startsWith(role==='female'?'assets/hsk1-voices-v159/':'assets/hsk1-voices-v156/'),where+': incorrect speaker audio path '+loc);
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
assert(html.indexOf('hsk1-voices-map-v159.js')<html.indexOf('hsk1-foundations-v152.js'),'Role map must load before player');
const source=fs.readFileSync('assets/hsk1-foundations-v152.js','utf8');
assert(source.includes('roleForDialogue')&&source.includes("data-speaker"),'Player must preserve role-specific playback');
assert(source.includes('FEMALE_KOKORO_RATE=1.0'),'Approved Xiaoni voice must play at natural speed');
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
 for(const el of [...d.querySelectorAll('script[src]')]){
  const f=new URL(el.src).pathname.replace('/chinese-coach-pwa/','');
  assert(fs.existsSync(f),'Missing script '+f);
  w.eval(fs.readFileSync(f,'utf8'));
 }
 const rows=[...d.querySelectorAll('[data-dialog-row]')];
 assert.equal(rows.length,topic.dialogue.length,'Dialogue lines preserved for '+topic.id);
 assert(!d.querySelector('[data-dialog-all]').disabled,'Full dialogue playback enabled for '+topic.id);
 for(let row=0;row<rows.length;row++){
  const [who,hz]=topic.dialogue[row],role=who==='А'?'male':'female';
  const btn=rows[row].querySelector('button[data-play]');
  assert(btn&&!btn.disabled,'Dialogue line unavailable: '+topic.id+' row '+row);
  assert.equal(btn.dataset.speaker,role,'Incorrect role on '+topic.id+' row '+row);
  btn.click();
  assert.equal(calls[calls.length-1],voices[role][hz],'Wrong voice in '+topic.id+' row '+row);
  assert.equal(played[played.length-1].playbackRate,1,
   'Incorrect speech pacing in '+topic.id+' row '+row);
 }
 if(i===0){
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
console.log('Panda Go v159: '+wanted.size+' verified role-specific clips, 123 approved Xiaoni recordings at natural tempo, unchanged male + native 日, seven complete dialogues.');
