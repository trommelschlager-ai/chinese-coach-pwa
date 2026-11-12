'use strict';
/* Panda Go v236: verify source priority and device-local microphone enhancements. */
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const helper=read('assets/panda-mic-v236.js');
new vm.Script(helper);
assert(helper.includes('audio/wav'),'Safe microphone normalization must produce WAV');
assert(helper.includes('getUrl()!==currentUrl'),'Older mic take must never replace newer recording');
assert(helper.includes('Math.min(1.35,'),'Processed microphone recording must cap gain at 1.35x');
assert(helper.includes('processedByRaw.set(currentUrl,newUrl)')&&helper.includes('processedUrl'),'Raw recording must remain available for A/B comparison');
const lesson4=read('assets/hsk1-fourth-v220.js');
assert(lesson4.includes('PandaCleanAudioV250?.lookup(word)')&&lesson4.includes("role==='male'"),'Prefer v250 original woman and explicit male role');
assert(!lesson4.includes('Для 星期天 нужна цельная запись'),'Outdated Sunday notice must be removed');
assert(read('assets/panda-owner-l4-native-v221.js').includes('"星期天": "009"'));
const numbers=read('assets/hsk1-third-v213.js');
assert(numbers.includes('PandaLesson3XiaoxiaoV263?.lookup(n)'),'Numbers 0–100 must use new Xiaoxiao recordings');
assert(fs.existsSync('assets/lesson3-xiaoxiao-v263/100.mp3'),'Complete Xiaoxiao yì bǎi file missing');
assert(read('assets/hsk1-voices-map-v160.js').includes('"一百"'));
assert(read('assets/panda-go-companion-v231.js').includes('()=>isFamily?vocab([7,11]):vocab([8,12],!isFamily)'),'Keep all 11 family words and weather seasons optional');
for(const [page,source] of [
 ['hsk1-second-v203.html','hsk1-second-v203.js'],
 ['hsk1-fourth-v214.html','hsk1-fourth-v220.js'],
 ['hsk1-fifth-v227.html','hsk1-fifth-v227.js'],
 ['hsk1-family-v231.html','panda-go-companion-v231.js'],
 ['hsk1-weather-v231.html','panda-go-companion-v231.js']
]){
 const html=read(page),js=read('assets/'+source);
 assert(/panda-mic-v236\.js\?v=(237|289)/.test(html),page+' missing mic helper');
 assert(html.indexOf('panda-mic-v236.js')<html.indexOf(source),'Mic helper must load before lesson');
 assert(js.includes('PANDA_MIC_V236?.enhance?.'),source+' missing local playback gain');
 new vm.Script(js);
}
assert(read('assets/hsk1-first-v189.js').includes('async function levelRecording(blob)'),'Retain lesson 1 recorder correction');
console.log('PASS Panda Go v236: lesson 1 old mic normalization retained, 2 and 4-7 local volume leveling, stable 100 audio, latest L4 owner voice, optional seasons.');
