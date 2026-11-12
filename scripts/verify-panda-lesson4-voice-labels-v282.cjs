'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const page=fs.readFileSync('hsk1-fourth-v214.html','utf8');
const js=fs.readFileSync('assets/hsk1-fourth-v220.js','utf8');
const css=fs.readFileSync('assets/hsk1-fourth-v219.css','utf8');
const helper=fs.readFileSync('assets/lesson-audio-source.js','utf8');
const offline=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
const lessons=['hsk1-first-v189.html','hsk1-second-v203.html','hsk1-third-v212.html','hsk1-fourth-v214.html','hsk1-fifth-v227.html','hsk1-family-v231.html','hsk1-weather-v231.html'];
for(const path of lessons){
 const html=fs.readFileSync(path,'utf8');
 assert(html.includes('lesson-audio-source.js?v=282'),'Old helper in '+path);
 assert(!html.includes('Оригинальная запись носительницы'),'Voice debug text in '+path);
}
assert(!helper.includes("document.addEventListener('click'"),'Debug voice caption listener must not be installed');
assert(!helper.includes('Xiaoxiao · единый синтезированный голос'),'Narrator debug caption remains');
assert(!helper.includes('Оригинальная запись носительницы'),'Original recording debug caption remains');
for(const who of ['man','woman']){
 const p='assets/lesson4-dialog-v282/'+who+'.webp',img=fs.readFileSync(p);
 assert(img.length>20000,'Portrait empty '+who);
 assert.equal(img.toString('ascii',0,4),'RIFF');
 assert.equal(img.toString('ascii',8,12),'WEBP');
 assert(js.includes('./'+p),'Portrait unused '+who);
 assert(offline.files.includes('./'+p),'Portrait not indexed offline '+who);
}
assert(css.includes('.pg4-people img{height:149px'),'Portrait size not updated');
assert(page.includes('hsk1-fourth-v220.js?v=282')&&page.includes('hsk1-fourth-v219.css?v=282'),'Cache version missing');
assert(!js.includes('Все 25 слов и фраз записаны голосом Xiaoxiao.'));
assert(!js.includes('Цельная запись 今天是星期五。 озвучена тем же голосом Xiaoxiao.'));
assert(!fs.readFileSync('hsk1-third-v212.html','utf8').includes('Озвучка 0–100: Xiaoxiao'));
assert(js.includes("role==='male'")&&js.includes('function toggleConversation()'),'Dialogue playback changed');
assert(offline.version>=282,'Offline pack version too old');
console.log('PASS v282 portraits, no technical audio captions in active HSK1 lessons, playback unchanged.');
