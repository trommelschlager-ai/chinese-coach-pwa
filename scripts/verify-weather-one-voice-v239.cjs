'use strict';
/* Regression for user-requested one-voice weather lesson, no human-voice impersonation. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const get=path=>fs.readFileSync(path,'utf8');
const companion=get('assets/panda-go-companion-v231.js');
const mapping=get('assets/hsk1-voices-map-v160.js');
const ctx={window:{}};
vm.runInNewContext(mapping,ctx,{filename:'hsk1-voices-map-v160.js'});
assert(ctx.window.PANDA_HSK1_VOICES?.female,'Unified female voice map must be present');
const start=companion.indexOf('function weatherClips(hz){');
const end=companion.indexOf('\nfunction resolve(hz,role=',start);
assert(start>=0&&end>start,'Weather-only voice selection must exist');
const fn=vm.runInNewContext('(()=>{const mappings=window.PANDA_HSK1_VOICES;const isFamily=false;'+companion.slice(start,end)+';return weatherClips})()',ctx);
const weather=JSON.parse(get('qa/v237/active-audio-registry.json')).filter(x=>x.lesson===7);
const phrases=[...new Set(weather.map(x=>x.phrase))];
assert(phrases.length>=18,'Lesson 7 regression set unexpectedly shrank');
for(const phrase of phrases){
 const clips=fn(phrase);
 assert(Array.isArray(clips)&&clips.length,'Missing unified weather voice for '+phrase);
 for(const path of clips){
  assert(path.startsWith('./assets/hsk1-voices-v160/'),'Wrong female speaker source for '+phrase+': '+path);
  assert(fs.existsSync(path.replace(/^\.\//,'')),'Missing MP3 file for '+phrase);
 }
 if(phrase==='明天下雨吗？')assert(clips.length===2,'Incomplete question must use two same-voice clips');
}
assert(companion.includes('if(!isFamily)return weatherClips(hz)[0]||null;'),'Weather must not fall back to other speakers');
assert(companion.includes("const parts=isFamily?[src]:weatherClips(hz);"),'Playback must use weather-only voice parts');
assert(companion.includes("data-role=\\\"'+(isFamily?role:'female')"),'Weather dialogue must use female voice even for role A');
assert(companion.includes("if(role==='male')return mappings.male"),'Family dialogues must keep their approved speaker roles');
const weatherHtml=get('hsk1-weather-v231.html');
assert(weatherHtml.includes('panda-go-companion-v231.js?v=239'),'Weather must reload changed player after service worker update');
const familyHtml=get('hsk1-family-v231.html');
assert(familyHtml.includes('panda-go-companion-v231.js'),'Existing family player remains');
assert(get('assets/lesson-audio-source.js').includes('Временная единая женская синтезированная озвучка'),'Synthetic voice must not be labeled human');
console.log('PASS one female MeloTTS v160 voice on all '+weather.length+' active lesson 7 audio buttons / '+phrases.length+' unique phrases; no role-A male fallback.');
