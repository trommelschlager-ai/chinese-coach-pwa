// Audio coverage and source consistency regression for launch preparation.
// Verifies files, not subjective voice quality or commercial licensing.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const root='assets/';
const context=vm.createContext({window:{}});
for(const name of ['basic-word-audio-map.js','study-audio-map.js','human-audio-map.js','dialogue-voices-map.js']){
  vm.runInContext(fs.readFileSync(root+name,'utf8'),context,{filename:name});
}
const maps=context.window;
const app=fs.readFileSync(root+'clean-learning-sections.js','utf8');
const match=app.match(/const courseCategories=(\[[\s\S]*?\]);\nconst allWords=/);
assert(match,'Basic-word category data must be readable');
const groups=JSON.parse(match[1]);
const words=groups.flatMap(g=>g.words);
assert.equal(words.length,193,'Basic vocabulary must retain all 193 entries');
const allKeys=new Set();
const sources={dedicated:0,pinyin:0,study:0,human:0};
const missing=[];
function fileExists(src,hz){
 assert(src.startsWith('./assets/'),hz+': unsupported audio URL '+src);
 assert(fs.existsSync(src.substring(2)),hz+': missing MP3 '+src);
 assert(src.endsWith('.mp3'),hz+': uncompressed or unexpected format');
}
for(const w of words){
 assert(!allKeys.has(w.hz),'Duplicate word '+w.hz);allKeys.add(w.hz);
 const ordered=[
   ['dedicated',maps.basicWordAudio?.[w.hz]],
   ['pinyin',maps.basicPinyinAudio?.[w.hz]],
   ['study',maps.courseNaturalAudio?.[w.hz]],
   ['human',maps.courseHumanAudio?.[w.hz]]
 ];
 const match=ordered.find(([,v])=>!!v);
 if(!match){missing.push(w.hz);continue}
 sources[match[0]]++;
 fileExists(match[1],w.hz);
}
assert.deepEqual(missing,[],'No base word should silently lack MP3');
assert(sources.dedicated>=100,'Prefer dedicated recordings for most basic words');
assert(app.indexOf('window.basicWordAudio?.[hz]')<app.indexOf('window.courseHumanAudio?.[key]'),
 'Playback must prioritize the dedicated vocabulary recordings');
const dialogues=Object.entries(maps.dialogueVoiceAudio||{});
assert.equal(dialogues.length,25,'All 25 dialogue audio-map entries retained');
for(const [id,file] of dialogues)fileExists(file,'dialogue '+id);
for(const path of [
 'assets/dialogue-greetings-v113/l2-01-a.mp3',
 'assets/dialogue-greetings-v113/l2-02-b.mp3'
])assert(fs.existsSync(path),'Missing greeting override '+path);
console.log('v118 audio coverage OK. 193/193 MP3 paths: '+JSON.stringify(sources)+'; 25/25 legacy dialogue mappings; 2 greeting overrides. Mixed voice sources and preview-only licenses STILL REQUIRE review.');
