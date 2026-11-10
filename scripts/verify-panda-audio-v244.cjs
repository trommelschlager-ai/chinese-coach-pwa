'use strict';
/* Actual original-speaker route regression. Does not claim listening QA. */
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const owner=read('assets/owner-audio-v237.js');
const src=read('assets/panda-go-companion-v231.js');
const context={window:{}};vm.runInNewContext(owner,context);
const a=src.indexOf('function familyOriginalParts('),b=src.indexOf('function weatherClips(',a);
assert(a>0&&b>a,'Native-family audio routing absent');
const native=vm.runInNewContext('(()=>{const isFamily=true;'+src.slice(a,b)+';return familyOriginalParts})()',context);
for(const [phrase,parts] of [['是，这是我妈妈。',['是','这是我妈妈。']],['有，我有一个妹妹。',['有','我有一个妹妹。']]]){
 const actual=native(phrase,'female');
 assert(actual&&actual.length===2,'Expected two original clips for '+phrase);
 assert.deepEqual(Array.from(actual),parts.map(x=>context.window.PandaOwnerAudio.lookup(x)));
 for(const f of actual)assert(f.startsWith('./assets/owner-clean-v237/')&&fs.existsSync(f.slice(2)),'Missing approved voice file: '+f);
 assert(native(phrase,'male')===null,'Male dialogue role must not be overwritten');
}
assert(native('一个','female')===null,'Do not pretend complete original exists for yí ge');
assert(src.includes('familyOriginalParts(hz,role)||[src]'),'Player should actually use original parts');
for(const f of ['hsk1-family-v231.html','hsk1-weather-v231.html'])
 assert(read(f).includes('panda-go-companion-v231.js?v=244'),f+' must load latest player');
const gain=read('assets/panda-lesson-audio-v240.js');new vm.Script(gain);
assert(gain.includes('source.connect(gain);gain.connect(compressor);compressor.connect(ctx.destination);'),'Limit peaks after gain, not before');
assert(read('hsk1-fifth-v227.html').includes('panda-lesson-audio-v240.js?v=244'));
const queue=JSON.parse(read('qa/v244/audio-recording-queue.json'));
assert(queue.totalFlaggedUniqueActivePhrases===63);
const rows=Object.values(queue.perLesson).flat();
assert(rows.filter(x=>x.lesson===6&&x.status==='new_native_composite_v244').length===2);
assert(rows.some(x=>x.lesson===6&&x.hanzi==='一个'&&x.pinyin==='yí ge'));
assert(rows.some(x=>x.lesson===5&&x.hanzi==='一月'&&x.pinyin==='yī yuè'));
assert(rows.some(x=>x.lesson===2&&x.hanzi==='您'&&x.status==='system_voice_pending_native'));
assert(rows.filter(x=>x.pinyinSource==='not_verified_require_speaker').length>=1);
console.log('PASS Panda Go v244: 2 female original composite replies, unchanged male roles, peak limiter, corrected recording queue');
