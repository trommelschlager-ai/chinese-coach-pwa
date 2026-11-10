'use strict';
/* Panda Go v240 regression: verify real script order and owner-v221 map mutation. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const weatherHtml=read('hsk1-weather-v231.html'),datesHtml=read('hsk1-fifth-v227.html');
const ordered=[
 'hsk1-voices-map-v160.js?v=160',
 'panda-weather-female-v240.js?v=240',
 'panda-owner-lessons5-7-native-v221.js?v=221',
 'panda-go-companion-v231.js?v=244'
];
let last=-1;for(const file of ordered){
 const at=weatherHtml.indexOf(file);assert(at>last,'Weather script missing or out of order: '+file);last=at;
}
const context={window:{}};
vm.runInNewContext(read('assets/hsk1-voices-map-v160.js'),context);
vm.runInNewContext(read('assets/panda-weather-female-v240.js'),context);
const frozen=context.window.PandaWeatherFemaleV240;
assert(Object.isFrozen(frozen));
assert(frozen['冷'].startsWith('./assets/hsk1-voices-v160/'));
vm.runInNewContext(read('assets/panda-owner-lessons5-7-native-v221.js'),context);
assert(context.window.PANDA_HSK1_VOICES.female['冷'].startsWith('data:audio/mpeg;base64,'),'Test must exercise real v221 mutation');
assert(frozen['冷'].startsWith('./assets/hsk1-voices-v160/'),'Owner voice override must not erase synthetic snapshot');
const companion=read('assets/panda-go-companion-v231.js');
const start=companion.indexOf('function weatherClips(hz){'),end=companion.indexOf('function resolve(hz,role=',start);
assert(start>0&&end>start);
const clips=vm.runInNewContext('(()=>{const mappings=window.PANDA_HSK1_VOICES,isFamily=false;'+companion.slice(start,end)+';return weatherClips})()',context);
const reg=JSON.parse(read('qa/v237/active-audio-registry.json')).filter(row=>row.lesson===7);
const phrases=[...new Set(reg.map(row=>row.phrase))];
for(const phrase of phrases){
 const src=clips(phrase);
 assert(src.length>0,'Missing audio after owner v221 map override: '+phrase);
 for(const file of src)assert(file.startsWith('./assets/hsk1-voices-v160/')&&fs.existsSync(file.slice(2)),'Missing packaged female MP3: '+phrase);
}
for(const phrase of ['天气','冷','热','晴','阴','风','春天','夏天','秋天'])assert(clips(phrase).length===1,'Single weather word must use one clip: '+phrase);
assert(clips('明天下雨吗？').length===2,'Two available female parts must complete this weather question');
assert(companion.includes('a.playbackRate=isFamily?1:0.86'),'Weather speech should be slowed without pitch change');
const gain=read('assets/panda-lesson-audio-v240.js');
new vm.Script(gain);
assert(datesHtml.includes('panda-lesson-audio-v240.js?v=244'));
assert(datesHtml.includes('hsk1-fifth-v227.js?v=240'));
const dates=read('assets/hsk1-fifth-v227.js');
assert(dates.includes('a.playbackRate=0.92'));
assert(dates.includes("PandaLessonAudioV240?.improve?.(a,'dates')"));
assert(!read('assets/owner-audio-v237.js').includes('"一个":'),'An unrecorded native one-ge clip must not be fabricated');
console.log('PASS v240: '+reg.length+' weather buttons across '+phrases.length+' phrases remain playable after owner v221 override; slowed speed, safe local gain for lesson 5, no false claim about 一个.');
