'use strict';
/* Panda Go lesson 2 v211: distinct graduation, optional 6/16 ASR drills and a
   nonblocking listening dictionary. Browser recognition checks words, not tones.
*/
const assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const practiceHTML=fs.readFileSync('hsk1-second-practice.html','utf8');
const lessonHTML=fs.readFileSync('hsk1-second-v203.html','utf8');
const main=fs.readFileSync('assets/hsk1-second-v203.js','utf8');
const extras=fs.readFileSync('assets/hsk1-second-extras-v204.js','utf8');
const spoken=fs.readFileSync('assets/hsk1-second-speaking-v209.js','utf8');
const practice=fs.readFileSync('assets/hsk1-second-practice-v211.js','utf8');
const voices=fs.readFileSync('assets/hsk1-voices-map-v160.js','utf8');
const native=fs.readFileSync('assets/hsk1-native-human-map-v167.js','utf8');
const unified=fs.readFileSync('assets/hsk1-lesson2-audio-v208.js','utf8');
assert(practiceHTML.includes('hsk1-second-practice-v211.js?v=237'));
assert(practiceHTML.includes('hsk1-second-speaking-v209.js?v=237'));
assert(!lessonHTML.includes('hsk1-second-speaking-v209.js'),'Main lesson must not load microphone checkpoint');
const click=(d,s)=>{
 const item=d.querySelector(s);
 assert(item,'Control missing: '+s);
 assert(!item.disabled,'Control unexpectedly disabled: '+s);
 item.click();
};
function make(mode='quick',recognitionSupported=true,oldFull=null){
 const dom=new JSDOM(practiceHTML,{url:'https://example.test/chinese-coach-pwa/hsk1-second-practice.html?mode='+mode,runScripts:'outside-only'});
 const w=dom.window,d=w.document,heard=[],recognitions=[];
 if(oldFull)w.localStorage.setItem('pg-hsk1-v209-speaking-check',JSON.stringify(oldFull));
 w.eval(voices);w.eval(unified);
 w.Audio=function(path){this.src=path;heard.push(this);this.pause=()=>{};this.play=()=>{this.onplaying?.();return Promise.resolve()}};
 if(recognitionSupported){
  w.webkitSpeechRecognition=class MockRecognition{
   constructor(){recognitions.push(this)}
   start(){this.started=true}
   stop(){this.stopped=true}
  };
 }
 w.eval(spoken);w.eval(practice);
 return {dom,w,d,heard,recognitions};
}
function say(d,recognitions,transcript){
 click(d,'[data-speak-start]');
 const recognition=recognitions.at(-1);
 assert(recognition?.started,'Browser speech recognizer not started');
 assert.equal(recognition.lang,'zh-CN');
 const answer={isFinal:true,length:1,0:{transcript}};
 recognition.onresult({results:[answer]});
}
{
 const l=new JSDOM(lessonHTML,{url:'https://example.test/chinese-coach-pwa/hsk1-second-v203.html',runScripts:'outside-only'});
 const w=l.window,d=l.window.document;
 const done=Array(12).fill(false);done[9]=true;
 w.localStorage.setItem('pg-hsk1-v203-pronouns',JSON.stringify({step:9,done,index:{9:2}}));
 w.eval(native);w.eval(voices);w.eval(unified);
 w.Audio=function(src){this.src=src;this.pause=()=>{};this.play=()=>Promise.resolve()};
 w.eval(extras);w.eval(main);
 assert(d.querySelector('.pg4-scene'),'Resumed finished dialogue screen must never be empty');
 assert(d.querySelector('[data-scene-play]'),'Animated scene must be replayable');
 assert(d.querySelector('[data-dialogue-again]'),'Dialog practice must be repeatable');
 click(d,'[data-dialogue-again]');
 assert(d.querySelector('[data-answer]'),'Replaying restores interaction');
 l.window.close();
}
{
 const {dom,w,d,heard,recognitions}=make('quick');
 assert(d.querySelector('.pg9-hanzi')?.textContent==='我');
 assert(d.querySelector('.pg9-progress')?.textContent.includes('из 6'),'Quick drill must be six items');
 assert(d.querySelector('[data-speak-next]').disabled,'Cannot skip a word');
 assert(d.querySelector('[data-speak-start]').disabled,'Listen before speaking');
 click(d,'[data-speak-listen]');
 assert.equal(heard[0].src,'./assets/hsk1-voice-unified-v208/wo.mp3');
 assert(d.querySelector('[data-speak-start]').disabled,'Do not count the playing example as the user');
 heard[0].onended();
 assert(!d.querySelector('[data-speak-start]').disabled,'Microphone unlocked after reference ends');
 say(d,recognitions,'我');
 say(d,recognitions,'我');
 assert(d.querySelector('.pg9-dots').getAttribute('aria-label').includes('2 из 3'));
 say(d,recognitions,'你');
 assert(d.querySelector('.pg9-dots').getAttribute('aria-label').includes('0 из 3'),'Wrong word resets consecutive streak');
 assert(d.querySelector('[data-speak-next]').disabled);
 say(d,recognitions,'我');say(d,recognitions,'我');say(d,recognitions,'我');
 assert(!d.querySelector('[data-speak-next]').disabled,'Three accepted words unlock next');
 click(d,'[data-speak-next]');
 assert.equal(d.querySelector('.pg9-hanzi').textContent,'你');
 assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk1-v211-speaking-quick')).position,1,'Quick result saves separately');
 assert.equal(w.localStorage.getItem('pg-hsk1-v209-speaking-check'),null,'Quick drill never overwrites full drill');
 assert(w.PG2_SPEAKING.test.isCorrect('她',['他']),'Same sound tā must be treated as equivalent in audio');
 assert(!w.PG2_SPEAKING.test.isCorrect('您',['你']),'Respectful nín is not nǐ');
 click(d,'[data-practice-mode="listen"]');
 assert.equal(d.querySelectorAll('.pg11-dict-row').length,16,'All 16 words visible in listening dictionary');
 assert(!d.querySelector('[data-speak-start]'),'Listening mode must not require microphone');
 click(d,'[data-practice-mode="quick"]');
 assert.equal(d.querySelector('.pg9-hanzi').textContent,'你','Quick mode must restore progress');
 dom.window.close();
}
{
 const {dom,w,d}=make('full',true,{position:3,streak:2,finished:false,correctTotal:8});
 assert(d.querySelector('.pg9-progress').textContent.includes('из 16'));
 assert(d.querySelector('.pg9-hanzi').textContent==='他','Prior full-progress state must be retained');
 assert(d.querySelector('.pg9-dots').getAttribute('aria-label').includes('2 из 3'));
 click(d,'[data-practice-mode="quick"]');
 assert(d.querySelector('.pg9-progress').textContent.includes('из 6'));
 click(d,'[data-practice-mode="full"]');
 assert(d.querySelector('.pg9-hanzi').textContent==='他','Full progress persists across mode switches');
 dom.window.close();
}
{
 const {dom,d}=make('quick',false);
 assert(d.querySelector('[data-speak-start]').disabled,'Unsupported browser cannot claim voice recognition');
 assert(d.querySelector('[data-speak-next]').disabled,'Unsupported browser must not mark completed');
 assert(d.querySelector('.pg9-warning').textContent.includes('Chrome'));
 click(d,'[data-practice-mode="listen"]');
 assert.equal(d.querySelectorAll('.pg11-dict-row').length,16,'Listening available without mic recognition');
 dom.window.close();
}
console.log('PASS HSK1 lesson 2 v211: replayable two-speaker scene, short and full speech drills with separate progress, 3 consecutive ASR matches, 16-word audio dictionary without mic.');
