'use strict';
/* Verify source integrity, current routes and all 25 callable female study clips. */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const crypto=require('node:crypto');
const root='assets/lesson4-xiaoxiao-v265';
const m=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
const expected=['星期','星期一','星期二','星期三','星期四','星期五','星期六','星期天','星期日','今天','明天','昨天','几','日','今天星期几？','明天星期几？','今天星期五。','明天星期六。','昨天星期二。','今天星期三。','今天星期一。','今天是星期五。','你星期几有空？','我星期六有空。','我们星期六一起去看电影吧！'];
assert.equal(m.version,265);assert.equal(m.clips.length,25);
const context={window:{}};
vm.runInNewContext(fs.readFileSync('assets/lesson4-xiaoxiao-v265.js','utf8'),context);
const voice=context.window.PandaLesson4XiaoxiaoV265;
assert(voice);assert.equal(Object.keys(voice.clips).length,25);
for(let i=0;i<expected.length;i++){
 const text=expected[i],clip=m.clips[i];
 assert.equal(clip.index,i);assert.equal(clip.text,text);
 const file=root+'/'+String(i).padStart(3,'0')+'.mp3';
 const data=fs.readFileSync(file);
 assert(data.length>1800,`Empty recording ${text}`);
 assert.equal(data.length,clip.bytes,`Size mismatch ${text}`);
 assert.equal(crypto.createHash('sha256').update(data).digest('hex'),clip.sha256);
 assert.equal(voice.lookup(text),'./'+file,`Missing Xiaoxiao mapping ${text}`);
}
assert.equal(voice.lookup('星期天。'),voice.lookup('星期天'));
assert.equal(voice.lookup('今天星期几'),voice.lookup('今天星期几？'));
assert.equal(voice.lookup('今天星期五。'),voice.lookup('今天星期五'));
const html=fs.readFileSync('hsk1-fourth-v214.html','utf8');
const script=fs.readFileSync('assets/hsk1-fourth-v220.js','utf8');
const cards=fs.readFileSync('hsk1-l4-cards.html','utf8');
assert(html.includes('lesson4-xiaoxiao-v265.js?v=265'));
assert(html.indexOf('lesson4-xiaoxiao-v265.js?v=265')<html.indexOf('hsk1-fourth-v220.js?v=266'), 'Map must load before lesson');
assert(script.includes('PandaLesson4XiaoxiaoV265?.lookup(word)||window.PandaCleanAudioV250'), 'Female voice must prefer Xiaoxiao');
assert(script.includes("role==='male'"),'Male dialogue source must be preserved');
assert(cards.includes('lesson4-xiaoxiao-v265.js?v=265')&&cards.includes('PandaLesson4XiaoxiaoV265?.lookup(word)||owner[word]'), 'All 25 revision cards must use Xiaoxiao');
const offline=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
assert(offline.version>=265,'Offline pack version must not be older than the 25 Xiaoxiao recordings');
for(const phrase of expected){assert(offline.files.includes(voice.lookup(phrase)),`Missing offline ${phrase}`)}
assert(/^const CACHE='chinese-coach-pwa-v\d+[^']*';/m.test(fs.readFileSync('sw.js','utf8')),'Versioned cache required');
assert(fs.existsSync('assets/lesson4-dialog-v266/woman.svg')&&fs.existsSync('assets/lesson4-dialog-v266/man.svg'),'Sharp dialogue portraits missing');
console.log('PASS: 25/25 Xiaoxiao lesson-4 audio files, hashes, active page, card review, male dialogue preserved, offline pack');
