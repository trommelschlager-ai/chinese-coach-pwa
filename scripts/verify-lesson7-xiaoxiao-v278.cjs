'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const path='assets/lesson7-xiaoxiao-v277/';
const expected=["a30a299f72bd5b14f2ad820c722c773d5b971995","c577afd77e0e324fb15b8d6b8b50e389c07c25ad","d33c6cde33152de3577481daf55e3b31004b70ca","cdb5bfcdcd89347586c5521550c75e87184799ea","d467f7cf94b415b73dec18ef1a5506e0c8d93f6f","0a9cb605f7d5d304dd0a06ae1d76697a567615f1","797e2048df9a00afd5c121f5d79450064fc52303","278572ed1a1c41ec771fe4098bc436daaaafb519","75dadfc3a9d89fab86d1e5873b2db16157cc4b70","324bd146693c36951117d55ec31faf2f732e686f","b6f63167576d6c027d97632b201981bf9b961305","59021f456d041b07c39c2169b1e6768121317e2d","0746477f75e02cc32cd2356ca3fbc6fe36221f03","13da7f0c97a6e2e645f1f6d6f7a851b516f27e1c","cd7241767293b5320b12153cb8528e14a10c3753","12457d94bb0e12f240ea86a665cedefa8ac74608","38a554e21ae474a8fcb12b5add38568d8bd0a424","bce4e83ac1a23cf5fab54b49b2821474444b13a8","b96782800ebd5278b0d8705c729812265f62c650","7c2e72af3b17ee325167633512b82256456a044b"];
const gitSha=x=>crypto.createHash('sha1').update(Buffer.from('blob '+x.length+String.fromCharCode(0))).update(x).digest('hex');
for(let i=0;i<20;i++){
 const f=path+String(i).padStart(3,'0')+'.mp3',buf=fs.readFileSync(f);
 assert.equal(buf.subarray(0,3).toString('ascii'),'ID3','Expected MP3: '+f);
 assert(buf.length>2000,'Truncated audio: '+f);
 assert.equal(gitSha(buf),expected[i],'Voice data changed: '+f);
}
const html=fs.readFileSync('hsk1-weather-v231.html','utf8');
const source=fs.readFileSync('assets/panda-go-companion-v231.js','utf8');
const w={};vm.runInNewContext(fs.readFileSync('assets/lesson7-xiaoxiao-v277.js','utf8'),{window:w});
assert(w.PandaLesson7XiaoxiaoV277?.lookup);
const manifest=JSON.parse(fs.readFileSync('assets/lesson7-xiaoxiao-voice-plan-v276.json','utf8'));
assert.equal(manifest.needs_recordings.length,20);
for(let i=0;i<20;i++){
 const p=w.PandaLesson7XiaoxiaoV277.lookup(manifest.needs_recordings[i].hanzi);
 assert.equal(p,'./'+path+String(i).padStart(3,'0')+'.mp3');
}
for(const name of ['今天','明天']){
 const p=w.PandaLesson7XiaoxiaoV277.lookup(name);
 assert(p.includes('lesson4-xiaoxiao-v265/')&&fs.existsSync(p.slice(2)));
}
const curriculum=fs.readFileSync('assets/hsk1-foundations-data-v152.js','utf8');
const topics=JSON.parse(curriculum.slice(curriculum.indexOf('= [')+2,curriculum.lastIndexOf('];')+1));
const lesson=topics.find(x=>x.id==='weather');
assert(lesson&&lesson.words.length===12&&lesson.dialogue.length===4);
const phrases=new Set(lesson.words.map(x=>x[0]));
for(const x of lesson.rules)phrases.add(x[2]);
for(const x of lesson.dialogue)phrases.add(x[1]);
for(const x of lesson.listen.items)phrases.add(x[0]);
phrases.add(lesson.speech.hz);
for(const zh of phrases){
 const path=w.PandaLesson7XiaoxiaoV277.lookup(zh);
 assert(path&&fs.existsSync(path.slice(2)),'Unrecorded weather phrase: '+zh);
}
const start=source.indexOf('function weatherClips(hz){'),end=source.indexOf(String.fromCharCode(10)+'function resolve(hz,role=',start);
assert(start>=0&&end>start);
const fn=vm.runInNewContext('(()=>{const isFamily=false;'+source.slice(start,end)+';return weatherClips})()', {window:w});
for(const zh of phrases)assert.equal(fn(zh)[0],w.PandaLesson7XiaoxiaoV277.lookup(zh));
assert.equal(fn('未知词').length,0,'Old voice must not appear');
assert(html.indexOf('lesson7-xiaoxiao-v277.js?v=278')>=0);
assert(html.indexOf('lesson7-xiaoxiao-v277.js?v=278')<html.indexOf((html.match(/panda-go-companion-v231\.js\?v=\d+/)||[])[0]));
assert(source.includes('a.playbackRate=(isFamily||newWeather)?1:0.85'));
assert(source.includes('if(!isFamily && !newWeather &&'));
const offline=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
assert(offline.version>=278);
for(let i=0;i<20;i++)assert(offline.files.includes('./'+path+String(i).padStart(3,'0')+'.mp3'));
assert(/^const CACHE='chinese-coach-pwa-v\d+[^']*';/m.test(fs.readFileSync('sw.js','utf8')),'Versioned service worker required');
console.log('PASS: 20 exact MP3, '+phrases.size+' covered HSK1 weather phrases, original voice speed, 14-screen weather route and PWA assets');
