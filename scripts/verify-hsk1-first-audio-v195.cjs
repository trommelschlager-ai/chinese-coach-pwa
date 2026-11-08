'use strict';
/* Detect missing HSK1 first-lesson audio. This tests source and MP3 presence,
   not pronunciation accuracy, volume, or tone naturalness. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const window={};
const sandbox={window,console};
for(const p of [
 'assets/hsk1-voices-map-v160.js',
 'assets/hsk1-human-voice-v183.js',
 'assets/hsk1-human-voice-v184.js',
 'assets/human-audio-map.js'
]){
 assert(fs.existsSync(p),'Missing first-lesson audio map: '+p);
 vm.runInNewContext(fs.readFileSync(p,'utf8'),sandbox,{filename:p,timeout:15000});
}
const map=window.PANDA_HSK1_VOICES?.female||{};
const human=src=>typeof src==='string'&&src.startsWith('data:audio/mpeg;base64,');
const normalized=s=>String(s).replace(/[。！?!？，,\s]/g,'');
const resolve=s=>map[s]||Object.entries(map).find(([k])=>normalized(k)===normalized(s))?.[1]||null;
const required=['我','是','学生','你','你好','你好！','我是学生','我是学生。'];
let originals=0,other=0;
for(const phrase of required){
 const clip=resolve(phrase);
 assert(clip,'Missing first-lesson voice: '+phrase);
 if(human(clip)){
   const raw=Buffer.from(clip.slice('data:audio/mpeg;base64,'.length),'base64');
   assert(raw.length>1000,'Native voice too short for '+phrase);
   assert(raw.slice(0,3).toString()==='ID3'||raw[0]===255,'MP3 header invalid for '+phrase);
   originals++;
 }else{
   assert(typeof clip==='string'&&clip.startsWith('./assets/'),'Unexpected fallback path for '+phrase);
   assert(fs.existsSync(clip.slice(2)),'Missing fallback audio file for '+phrase);
   other++;
 }
}
for(const syllable of ['妈','麻','马','骂']){
 const p=window.courseHumanAudio?.[syllable];
 assert(p,'Tone demonstration '+syllable+' has no audio source');
 assert(fs.existsSync(p.replace(/^\.\//,'')),'Tone sample file missing: '+p);
}
console.log('HSK1 audio source audit PASS: '+originals+'/'+required.length+
 ' first-lesson phrases use original approved native samples; '+other+
 ' use another licensed/synthetic source; 4 separate human tone examples exist. Manual Mandarin listening QA still needed.');
