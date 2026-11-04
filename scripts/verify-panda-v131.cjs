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
assert(js.includes("audioParts:['我','是','学生']"),'Example 1 must use valid individual recordings');
assert(js.includes("audioParts:['我','喜欢','中','国']"),'Example 2 must not request missing 中国 clip');
for(const [selector,dimension] of [['.pg-word-main>.pg-portrait','width:113px'],['.pg-game-prompt>.pg-portrait','width:89px'],['.pg-dialogue-scene','width:min(100%,271px)']]){
 assert(css.includes(dimension),'Original crops must not be enlarged: '+selector);
}
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
for(const suffix of ['css','js']){
 const url='./assets/panda-v130.'+suffix+'?v=131';
 assert(index.includes(url),'App must load current '+url);
 assert(sw.includes(url),'Offline shell must load current '+url);
 assert(pack.files.includes(url),'Optional offline pack must load current '+url);
}
console.log('Panda Go v131: clean speaker, natural speed, example audio coverage, crop limits, offline cache OK.');
