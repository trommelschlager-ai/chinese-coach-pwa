/* Panda Go v131 — no silent fallback to a different speaker when a clean native clip exists. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const js=fs.readFileSync('assets/panda-v130.js','utf8');
const css=fs.readFileSync('assets/panda-v130.css','utf8');
const mapCode=fs.readFileSync('assets/human-audio-map.js','utf8');
const scope={window:{}};
vm.runInNewContext(mapCode,scope);
const human=scope.window.courseHumanAudio;
for(const word of ['我','是','学生','喜欢','中','国','明白','找','给','拿','知道']){
 assert(human[word],word+' missing preferred speaker MP3');
 assert(fs.existsSync(human[word].replace(/^\.\//,'')),word+' MP3 missing from repository');
}
assert(js.includes('window.courseHumanAudio?.[key]&&window.__pandaGameSpeech130'),'Preferred clean speaker is not used in the v130 shell');
assert.equal((js.match(/audio\.playbackRate=1;/g)||[]).length,2,'Single-word and sequence MP3s must retain natural speed');
const examples={window:{}};vm.runInNewContext(fs.readFileSync('assets/word-examples-v144.js','utf8'),examples);
assert(examples.window.PANDA_WORD_EXAMPLES.filter(e=>e.hz.includes('我')).length>=3,'At least three complete recorded sentences for 我');
for(const e of examples.window.PANDA_WORD_EXAMPLES)assert(fs.existsSync(e.file.replace('./','')),'Complete example recording exists');
// Small source crops cannot be repaired by shrinking them: retain the approved composition.
assert(css.includes('#pg130 .pg-game-prompt{display:grid;grid-template-columns:31% 1fr'),'The approved portrait proportion must remain intact');
assert(css.includes('#pg130 .pg-dialogue-scene{height:auto;aspect-ratio:271/155'),'The approved dialogue composition must remain intact');
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
for(const suffix of ['css','js']){
 const pattern=new RegExp('\\./assets/panda-v130\\.'+suffix+'\\?v=\\d+');
 const url=index.match(pattern)?.[0];
 assert(url,'App must load versioned Panda '+suffix);
 assert(sw.includes(url),'Offline shell must use current '+url);
 assert(pack.files.includes(url),'Optional offline pack must use current '+url);
}
console.log('Panda Go v131: clean speaker, natural speed, example audio coverage, approved layout, offline cache OK.');
