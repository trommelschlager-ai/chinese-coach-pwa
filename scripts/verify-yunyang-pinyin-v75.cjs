// V75: reject childlike default, verify every new Mandarin MP3 and preserve user-approved dialogue/audio.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{JSDOM}=require('jsdom');
const source=fs.readFileSync('assets/pronunciation-hub.js','utf8'),html=fs.readFileSync('index.html','utf8');
const curr=JSON.parse(fs.readFileSync('assets/pinyin-reading-curriculum.json','utf8'));
const stat=JSON.parse(fs.readFileSync('assets/pinyin-reading-v5/status.json','utf8'));
const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
const sw=fs.readFileSync('sw.js','utf8'),learn=fs.readFileSync('assets/learning-quality.js','utf8');
assert(stat.ready&&stat.version===75&&stat.count===190);
assert.equal(stat.voice,'zh-CN-YunyangNeural');
assert(!source.includes("new Audio('./assets/pinyin-reading-v4/'+id+'.mp3')"),'Old childlike Xiaoxuan playback must not be used');
assert(source.includes("new Audio('./assets/pinyin-reading-v5/'+id+'.mp3')"));
assert(source.includes('data-pinyin-rate="0.85" aria-pressed="true"'));
assert(source.includes("readingView='letters',readingRate=.85"),'Default pace is 0.85x');
assert(source.includes('data-pinyin-rate="0.75" aria-pressed="false"'),'Slow practice mode remains');
assert(source.includes('a.preservesPitch=true'),'Keep Mandarin F0 contour');
assert(html.includes('pronunciation-hub.js?v=75')&&sw.includes('chinese-coach-pwa-v76'));
assert(pack.version===76&&curr.clips.length===190);
assert.equal(curr.audio.voice,'zh-CN-YunyangNeural');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const clip of curr.clips){
 const old='assets/pinyin-reading-v4/'+clip.id+'.mp3',fresh='assets/pinyin-reading-v5/'+clip.id+'.mp3';
 const b=fs.readFileSync(fresh);assert(b.length>1500);
 assert(b.subarray(0,3).toString()==='ID3'||(b[0]===255&&(b[1]&224)===224),fresh);
 assert.notEqual(sha(old),sha(fresh),'New narrator reused old audio for '+clip.id);
 assert(pack.files.includes('./'+fresh),'Missing offline MP3 '+fresh);
}
assert(pack.files.includes('./assets/pinyin-reading-v5/status.json'));
assert(learn.includes("fetch('./assets/dialogue-voices-v73/status.json'"),'Do not change accepted dialogue');
assert.equal(new JSDOM(html).window.document.querySelectorAll('#launch-menu .six-menu-cards [data-choice]').length,6);
console.log('V75 passes: 190 real Yunyang MP3s, normal default speed, preserved tones, unchanged dialogues and navigation');
