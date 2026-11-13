'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'hsk2-introduction.html'),'utf8');
const oldMap=fs.readFileSync(path.join(root,'assets/panda-hsk1-voice-v280.mjs'),'utf8');
const js=(html.match(/<script>([\s\S]*?)<\/script>/)||[])[1];
assert(js,'lesson script missing');new vm.Script(js);
const exact={
  '我':'assets/lesson1-xiaoxiao-v260/wo.mp3',
  '老师':'assets/panda-lesson2-xiaoxiao-v261/laoshi.mp3',
  '我是老师':'assets/panda-lesson2-xiaoxiao-v261/woshilaoshi.mp3'
};
const match=js.match(/const APPROVED_HSK2_REUSE=Object\.freeze\(\{([\s\S]*?)\}\);/);
assert(match,'verified clip allowlist not found');
const pairs=[...match[1].matchAll(/'([^']+)':'([^']+)'/g)].map(m=>[m[1],m[2]]);
assert.equal(pairs.length,Object.keys(exact).length,'unexpected voice clips introduced');
for(const [phrase,asset] of pairs){
 assert.equal(asset,exact[phrase],'unreviewed phrase or audio source');
 assert(oldMap.includes('"'+phrase+'": "./'+asset+'"'),'source is not the approved HSK1 map');
 const full=path.join(root,asset);
 assert(fs.existsSync(full),'MP3 missing '+asset);
 assert(fs.statSync(full).size>2000,'MP3 empty '+asset);
}
for(const missing of ['住','在','住在','莫斯科','我住在莫斯科','我叫安娜','你叫什么名字','你住在哪儿','你做什么工作']){
 assert(!pairs.some(([p])=>p===missing),'audio falsely marked present: '+missing);
}
assert(js.includes('const clipButton=phrase=>matchingAudio(phrase)?'),'audio buttons must require exact matches');
assert(js.includes("data-audio="),'audio button has no input key');
assert(js.includes("new Audio(url)"),'manual playback not wired');
assert(js.includes("audio.addEventListener('error'"),'loading failure feedback missing');
assert(js.includes("playApprovedAudio(btn.dataset.audio)"),'button listeners missing');
assert(!/speechSynthesis\.speak\s*\(/.test(js),'unapproved robotic voice detected');
assert(js.includes('location.hostname'),'preview/main audio routing missing');
assert(html.includes('id="audio-status"'),'status announcements missing');
assert(html.includes('Запись готовится'),'unrecorded full phrase incorrectly shown as playable');
console.log('PASS: 3 existing exact MP3, no invented recordings, error feedback and audio controls');
