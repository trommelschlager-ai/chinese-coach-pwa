'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm'),assert=require('node:assert/strict');
const root='assets/lesson5-xiaoxiao-v272';
const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
const expected=['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月','年','月','号','二零二六年十一月六日','今天十一月六号。'];
assert.equal(manifest.clips.length,17);
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync('assets/lesson5-xiaoxiao-v272.js','utf8'),sandbox);
const x=sandbox.window.PandaLesson5XiaoxiaoV272;assert(x);
for(let i=0;i<17;i++){
 const clip=manifest.clips[i],expectedText=expected[i];
 assert.equal(clip.index,i);
 assert.equal(clip.hanzi,expectedText);
 const path=root+'/'+clip.file;
 const data=fs.readFileSync(path);
 assert(data.length>4500,'Audio too short '+expectedText);
 assert.equal(data.length,clip.bytes);
 assert.equal(crypto.createHash('sha256').update(data).digest('hex'),clip.sha256);
 assert.equal(x.lookup(expectedText),'./'+path);
}
for(const [hz,path] of Object.entries(manifest.sharedFromLesson4)){
 assert.equal(x.lookup(hz),path);
 assert(fs.existsSync(path.slice(2)),hz+' shared audio file missing');
}
assert.equal(x.lookup('今天十一月六号'),x.lookup('今天十一月六号。'),'Punctuation normalization');
const male=fs.readFileSync('assets/hsk1-voices-map-v160.js','utf8');
for(const text of manifest.dialogueMale)assert(male.includes('"'+text+'"'),'Missing historical male line '+text);
const js=fs.readFileSync('assets/hsk1-fifth-v227.js','utf8');
const html=fs.readFileSync('hsk1-fifth-v227.html','utf8');
assert(html.includes('lesson5-xiaoxiao-v272.js?v=272')&&html.includes('hsk1-fifth-v227.js?v=273'),'Page must load the new map and script');
assert(html.indexOf('lesson5-xiaoxiao-v272.js?v=272')<html.indexOf('hsk1-fifth-v227.js?v=273'),'Correct map order');
assert(js.includes('window.PandaLesson5XiaoxiaoV272?.lookup(hz)'),'Use current narrator as priority');
assert(js.includes("path.includes('lesson5-xiaoxiao-v272/')||path.includes('lesson4-xiaoxiao-v265/')"),'Avoid second slowdown of recorded Xiaoxiao clips');
assert(js.includes("if(role==='male')return window.PANDA_HSK1_VOICES?.male?.[hz]||null;"),'Male role must stay male');
const offline=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
assert(offline.version>=272);
for(const phrase of expected){
 assert(offline.files.includes(x.lookup(phrase)),'Audio not cached '+phrase);
}
console.log('PASS lesson 5 v272: 17 individually cut Xiaoxiao clips, 3 reused narrator clips, male role, offline cache');
