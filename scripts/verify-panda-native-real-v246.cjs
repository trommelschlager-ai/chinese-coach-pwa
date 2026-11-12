'use strict';
/* Native human voice regression v246: evaluate the ACTUAL source bundles, not a mocked map. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const context=vm.createContext({window:{courseNaturalAudio:{},courseHumanAudio:{}},document:{createElement:()=>({canPlayType:()=> 'probably'})}});
for(const file of [
 'assets/hsk1-voices-map-v160.js',
 'assets/hsk1-human-voice-v183.js',
 'assets/hsk1-human-voice-v184.js',
 'assets/panda-native-recovered-v246.js',
 'assets/native-owner-v200.js',
 'assets/panda-owner-lessons5-7-native-v221.js',
 'assets/owner-audio-v237.js'
])vm.runInContext(read(file),context,{filename:file,timeout:20000});
const w=context.window;
assert(w.PandaNativeRecoveredV246?.available>=40,'Recovered too few real authorized woman recordings: '+w.PandaNativeRecoveredV246?.available);
const native=hz=>w.PandaNativeRecoveredV246.lookup(hz)||w.PandaOwnerAudio?.lookup(hz)||(
  (v=>typeof v==='string'&&(v.startsWith('data:audio/mpeg;base64,')||v.startsWith('./assets/native-owner-v200/'))?v:null)(
    w.PANDA_HSK1_VOICES.female[hz]||w.PANDA_HSK1_VOICES.female[String(hz).replace(/[。！？!?]\s*$/,'')]
  ));
function checkApproved(hz,src){
 assert(src,'No native Mandarin speaker for '+hz);
 assert(src.startsWith('data:audio/mpeg;base64,')||src.startsWith('./assets/owner-clean-v237/')||src.startsWith('./assets/native-owner-v200/'),
  'Non-native fallback was selected for '+hz+': '+src.slice(0,95));
 if(src.startsWith('data:audio/mpeg;base64,'))assert(src.length>1000,'Tiny native audio payload for '+hz);
 else assert(fs.existsSync(src.replace(/^\.\//,'')),'Broken native file: '+src);
}
const monthNames='一月 二月 三月 四月 五月 六月 七月 八月 九月 十月 十一月 十二月'.split(' ');
for(const name of monthNames)checkApproved(name,native(name));
const companion=read('assets/panda-go-companion-v231.js');
// Lesson 7 was upgraded from archived native samples to Xiaoxiao-only v278.
vm.runInContext(read('assets/lesson7-xiaoxiao-v277.js'),context,{filename:'lesson7-xiaoxiao-v277.js'});
const start=companion.indexOf('function weatherClips(hz){'),end=companion.indexOf('function resolve(hz,role=',start);
assert(start>0&&end>start,'Weather resolver unavailable');
const weatherFn=vm.runInContext('(()=>{const isFamily=false,mappings=window.PANDA_HSK1_VOICES;'+companion.slice(start,end)+';return weatherClips})()',context);
// Lesson 5 intentionally uses the newer Xiaoxiao voice map; v246 still audits the archived original recordings.
vm.runInContext(read('assets/lesson5-xiaoxiao-v272.js'),context,{filename:'lesson5-xiaoxiao-v272.js'});
const dates=read('assets/hsk1-fifth-v227.js');
const first=dates.indexOf('function voice(hz,role='),last=dates.indexOf('function play(hz,role=',first);
assert(first>0&&last>first,'Date resolver unavailable');
const datesFn=vm.runInContext('(()=>{'+dates.slice(first,last)+';return voice})()',context);
const active=JSON.parse(read('qa/v237/active-audio-registry.json'));
const count={};
for(const lesson of [5,7]){
 let rows=active.filter(x=>x.lesson===lesson);
 const seen=new Set();
 for(const row of rows){
  const hz=row.phrase;
  if(seen.has(hz))continue;seen.add(hz);
  if(lesson===5){
   const role=row.role==='male'?'male':'female';
   const file=datesFn(hz,role);
   assert(file,'Lesson 5 is missing audio for '+hz);
   if(role==='male'){
    assert.equal(file,w.PANDA_HSK1_VOICES.male[hz],'Lesson 5 must preserve the mapped male role for '+hz);
    assert(file.startsWith('data:audio/mpeg;base64,')||file.startsWith('./assets/hsk1-voices-v156/'),'Unexpected male voice source for '+hz);
   }else{
    assert(file.startsWith('./assets/lesson5-xiaoxiao-v272/')||file.startsWith('./assets/lesson4-xiaoxiao-v265/'),
      'Lesson 5 must use the new Xiaoxiao voice: '+hz+' '+file);
   }
   if(file.startsWith('data:audio/mpeg;base64,')) assert(file.length>1000,'Embedded male narration is empty: '+hz);
   else assert(fs.existsSync(file.startsWith('./')?file.slice(2):file),'Lesson 5 media missing: '+hz);
  }else{
   const clips=weatherFn(hz);
   assert(clips.length===1,'All weather playback must use ONE complete original phrase: '+hz);
   assert(clips[0].startsWith('./assets/lesson7-xiaoxiao-v277/')||clips[0].startsWith('./assets/lesson4-xiaoxiao-v265/'),
     'Weather voice must be Xiaoxiao v278: '+hz);
   assert(fs.existsSync(clips[0].slice(2)),'Missing Xiaoxiao weather file: '+clips[0]);
  }
 }
 count[lesson]={buttons:rows.length,unique:seen.size};
}
assert(companion.includes("a.playbackRate=(isFamily||newWeather||role==='male')?1:0.85"),'Xiaoxiao and male dialogue must retain natural voice tempo');
assert(!companion.slice(start,end).includes('hsk1-voices-v160'),'Do not silently switch weather back to synthetic v160');
const weatherHtml=read('hsk1-weather-v231.html'),dateHtml=read('hsk1-fifth-v227.html');
for(const html of [weatherHtml,dateHtml]){
 for(const script of ['hsk1-human-voice-v183.js?v=186','hsk1-human-voice-v184.js?v=186','panda-native-recovered-v246.js?v=246']){
  assert(html.includes(script),'Missing authorized-speaker script '+script);
 }
 assert(html.indexOf('hsk1-human-voice-v183.js')<html.indexOf('panda-native-recovered-v246.js'),'Owner snapshot load order');
 assert(html.indexOf('panda-native-recovered-v246.js')<html.indexOf('panda-owner-lessons5-7-native-v221.js'),'Capture original before override');
}
assert(/panda-go-companion-v231\.js\?v=\d+/.test(weatherHtml),'Latest weather companion script must load');
assert(dateHtml.includes('hsk1-fifth-v227.js?v=289'));
assert(dateHtml.includes('lesson5-xiaoxiao-v272.js?v=272'));

assert(!read('assets/lesson-audio-source.js').includes('Звук v246'),'Voice/version debug captions must not be shown to learners');
console.log('PASS Panda Go v246: '+monthNames.length+' native months, '+count[5].unique+' active date phrases ('+count[5].buttons+' buttons), '+count[7].unique+' Xiaoxiao weather phrases ('+count[7].buttons+' buttons). Recovered '+w.PandaNativeRecoveredV246.available+' source clips.');
