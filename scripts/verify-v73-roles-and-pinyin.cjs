// V73 voice audit: no reuse of old pinyin and no gender mismatch for Anna / Xiaoming.
const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8'),curr=JSON.parse(read('assets/pinyin-reading-curriculum.json')),plan=JSON.parse(read('assets/dialogue-voice-plan.json'));
const ps=JSON.parse(read('assets/pinyin-reading-v4/status.json')),ds=JSON.parse(read('assets/dialogue-voices-v73/status.json')),pack=JSON.parse(read('assets/offline-pack.json'));
const learn=read('assets/learning-quality.js'),sections=read('assets/clean-learning-sections.js'),pron=read('assets/pronunciation-hub.js'),html=read('index.html'),sw=read('sw.js');
assert.equal(ps.count,190);assert.equal(ps.voice,'zh-CN-XiaoxuanNeural');
assert.equal(ds.count,25);assert.deepEqual(ds.role_override,{lesson:2,A:'male',B:'female'});
const anna=plan.entries.find(e=>e.lesson===2&&e.line===4),xiao=plan.entries.find(e=>e.lesson===2&&e.line===5);
assert.equal(anna.text,'我叫安娜。你呢？');assert.equal(anna.speaker,'B');
assert.equal(xiao.text,'我叫小明。');assert.equal(xiao.speaker,'A');
assert(sections.includes("id===2?who==='B':who==='A'"),'Avatar genders must invert for lesson 2');
assert(sections.includes('Анна — женский голос · Сяомин — мужской голос'));
assert(learn.includes("status.role_override?.lesson===2"),'Validate audio pack role correction');
assert(learn.includes("lessonId===2||"),'Single dialogue line always uses corrected cast');
assert(learn.includes("lesson.id===2||"),'Full dialogue always uses corrected cast');
assert(pron.includes('./assets/pinyin-reading-v4/'),'All 190 examples must use new softer audio');
assert(html.includes('pronunciation-hub.js?v=74'));
assert(sw.includes('chinese-coach-pwa-v74'));assert.equal(pack.version,74);
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const sample of curr.clips){let p='assets/pinyin-reading-v4/'+sample.id+'.mp3';assert(fs.statSync(p).size>1500);assert.notEqual(digest(p),digest(sample.file));assert(pack.files.includes('./'+p));}
for(const line of plan.entries){let p=line.file.replace('dialogue-voices/','dialogue-voices-v73/');assert(fs.statSync(p).size>1500);assert(pack.files.includes('./'+p));}
assert.equal(new JSDOM(html).window.document.querySelectorAll('#launch-menu .six-menu-cards [data-choice]').length,6);
console.log('V73 voice review passed: 190 new Pinyin recordings, 25 dialogue MP3s and fixed Anna/Xiaoming gender.');
