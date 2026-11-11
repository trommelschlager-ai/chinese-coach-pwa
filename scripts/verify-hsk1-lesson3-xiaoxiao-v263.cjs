'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const m=JSON.parse(fs.readFileSync('assets/lesson3-xiaoxiao-v263/manifest.json','utf8'));
assert.equal(m.clip_count,101);
assert.deepEqual(m.clips.map(c=>c.number),Array.from({length:101},(_,n)=>n));
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('assets/lesson3-xiaoxiao-v263.js','utf8'),ctx);
const voice=ctx.window.PandaLesson3XiaoxiaoV263;
for(let n=0;n<=100;n++){
 const c=m.clips[n],path=voice.lookup(n);
 assert.equal(path,'./assets/lesson3-xiaoxiao-v263/'+String(n).padStart(3,'0')+'.mp3');
 const b=fs.readFileSync(path.slice(2));
 assert(b.length>1600);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),c.output_sha256);
}
assert.equal(voice.lookup(101),null);
const html=fs.readFileSync('hsk1-third-v212.html','utf8');
const js=fs.readFileSync('assets/hsk1-third-v213.js','utf8');
assert(html.includes('lesson3-xiaoxiao-v263.js?v=263')&&html.includes('hsk1-third-v213.js?v=263'));
assert(js.includes('PandaLesson3XiaoxiaoV263?.lookup(n)'));
assert(!js.includes('PANDA_HSK1_L3_CLEAN_V250'));
assert(!html.includes('panda-clean-audio-v250.js'));
assert(js.includes("if(n===100)return ['yì','bǎi']"));
const offline=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
for(let n=0;n<=100;n++)assert(offline.files.includes(voice.lookup(n)),'Missing offline '+n);
const sw=fs.readFileSync('sw.js','utf8');
assert(/^const CACHE='chinese-coach-pwa-v[^']+';/m.test(sw),'Versioned PWA cache is required');
assert(offline.files.includes('./assets/lesson3-xiaoxiao-v263.js?v=263'),'Lesson 3 voice mapping must remain in the offline pack');
console.log('PASS v263: all 101 real MP3 numbers 0-100 present, checksummed, mapped and offline.');
