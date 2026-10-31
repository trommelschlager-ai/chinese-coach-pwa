// V74: softer Pinyin voice with 190 genuine new MP3s; dialogue v73 remains untouched.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const status=JSON.parse(fs.readFileSync('assets/pinyin-reading-v4/status.json','utf8'));
const curriculum=JSON.parse(fs.readFileSync('assets/pinyin-reading-curriculum.json','utf8'));
const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
const pron=fs.readFileSync('assets/pronunciation-hub.js','utf8'),html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
const dialogue=fs.readFileSync('assets/learning-quality.js','utf8');
const digest=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
assert(status.ready&&status.version===74&&status.count===190);
assert(status.voice==='zh-CN-XiaoxuanNeural','Must use approved softer female voice');
assert(pron.includes("new Audio('./assets/pinyin-reading-v4/'+id+'.mp3')"));
assert(pron.includes('"zh-CN-XiaoxuanNeural"'));
assert(pron.includes('a.preservesPitch=true'),'Mandarin pitch contour must not be pitch-shifted');
assert(html.includes('pronunciation-hub.js?v=74'),'Client must load updated player');
assert(sw.includes("chinese-coach-pwa-v74"),'New service worker cache version');
assert(pack.version===74);
assert(curriculum.clips.length===190);
for(const c of curriculum.clips){const file='assets/pinyin-reading-v4/'+c.id+'.mp3';const previous='assets/pinyin-reading-v3/'+c.id+'.mp3';const buf=fs.readFileSync(file);assert(buf.length>1500,'Missing MP3 '+file);assert(buf.toString('ascii',0,3)==='ID3'||buf[0]===255&&((buf[1]&224)===224));assert.notEqual(digest(file),digest(previous),'Audio not newly generated: '+c.id);assert(pack.files.includes('./'+file),'Missing offline '+file);}
assert(pack.files.includes('./assets/pinyin-reading-v4/status.json'));
assert(dialogue.includes("fetch('./assets/dialogue-voices-v73/status.json'"),'Do not change accepted dialogue voice');
console.log('V74: all 190 new Xiaoxuan MP3 files, native pitch preservation, and accepted dialogue voice untouched.');
