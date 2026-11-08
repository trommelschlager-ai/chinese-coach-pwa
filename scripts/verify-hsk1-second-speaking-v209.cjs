'use strict';
/* Verify lesson-2 screen 10 never goes blank and final speaking checks 3
 * CONSECUTIVE recognized Mandarin utterances before unlocking the next word.
 * This tests speech recognition matching, not Mandarin tone contours.
 */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('hsk1-second-v203.html','utf8');
const course=fs.readFileSync('assets/hsk1-second-v203.js','utf8');
const extras=fs.readFileSync('assets/hsk1-second-extras-v204.js','utf8');
const speech=fs.readFileSync('assets/hsk1-second-speaking-v209.js','utf8');
const voices=fs.readFileSync('assets/hsk1-voices-map-v160.js','utf8');
const unified=fs.readFileSync('assets/hsk1-lesson2-audio-v208.js','utf8');
const native=fs.readFileSync('assets/hsk1-native-human-map-v167.js','utf8');
const progress=(step,done=false)=>{
 const completed=Array(12).fill(false);if(done)completed[9]=true;
 return JSON.stringify({step,completed:step===11,done:completed,index:done?{'9':2}:{},
 finalFirstTry:5,reviewing:false});
};
function make(step,done=true,enableRecognition=true){
 const dom=new JSDOM(html,{url:'https://example.test/chinese-coach-pwa/hsk1-second-v203.html',runScripts:'outside-only'});
 const w=dom.window,doc=w.document,recognitions=[];
 w.localStorage.setItem('pg-hsk1-v203-pronouns',progress(step,done));
 w.eval(voices);w.eval(native);w.eval(unified);
 const played=[];
 w.Audio=function(src){
  this.src=src;played.push(this);
  this.pause=()=>{};
  this.play=()=>{this.onplaying?.();return Promise.resolve()};
 };
 if(enableRecognition){
  class Recognition{
   constructor(){recognitions.push(this)}
   start(){this.started=true}
   stop(){this.stopped=true}
  }
  w.webkitSpeechRecognition=Recognition;
 }
 w.eval(extras);w.eval(speech);w.eval(course);
 return {w,doc,dom,played,recognitions};
}
const click=(doc,selector)=>{
 const el=doc.querySelector(selector);
 assert(el,'Missing control: '+selector);
 assert(!el.disabled,'Unexpectedly disabled: '+selector);
 el.click();
};
const recognize=(w,recognitions,words)=>{
 const x=recognitions[recognitions.length-1];
 assert(x&&x.started,'Recognizer not started');
 assert.equal(x.lang,'zh-CN');
 assert.equal(x.continuous,false);
 assert.equal(x.interimResults,false);
 const alternatives=words.map(text=>({transcript:text,confidence:.8}));
 const response={isFinal:true,length:alternatives.length};
 alternatives.forEach((item,n)=>response[n]=item);
 x.onresult({results:[response]});
};
{
 const {doc,w,dom}=make(9,true);
 assert.equal(doc.querySelector('#pg-counter').textContent,'10 / 12');
 assert(doc.querySelector('.sheet.pg3-dialogue-sheet'),'Resumed completed dialogue needs content sheet');
 assert(doc.querySelector('.pg4-scene'),'Completed dialogue screen should show the animation instead of blank background');
 assert(doc.querySelector('[data-scene-play]'),'Animated scene must remain replayable');
 assert(doc.querySelector('[data-dialogue-again]'),'Completed dialogue questions must be replayable');
 click(doc,'[data-dialogue-again]');
 assert(doc.querySelector('[data-answer]'),'Retry restores dialogue questions');
 dom.window.close();
}
{
 const {doc,w,dom,played,recognitions}=make(11,true);
 assert(doc.querySelector('#pg2-speaking-root'),'Spoken recall practice must be displayed');
 assert(doc.querySelector('[data-speak-next]').disabled,'Next word must start locked');
 assert(doc.querySelector('[data-speak-start]').disabled,'Microphone is gated until reference playback');
 assert(doc.querySelector('.pg9-hanzi').textContent==='我','First word must be 我');
 click(doc,'[data-speak-listen]');
 assert.equal(played[0].src,'./assets/hsk1-voice-unified-v208/wo.mp3');
 assert(doc.querySelector('[data-speak-start]').disabled,'Cannot start microphone over playback audio');
 played[0].onended();
 assert(!doc.querySelector('[data-speak-start]').disabled,'Finishing reference audio unlocks microphone');
 const speak=words=>{click(doc,'[data-speak-start]');recognize(w,recognitions,words)};
 speak(['我']);
 assert(doc.querySelector('[data-speak-next]').disabled);
 assert(doc.querySelector('.pg9-dots').getAttribute('aria-label').includes('1 из 3'));
 speak(['我']);
 assert(doc.querySelector('.pg9-dots').getAttribute('aria-label').includes('2 из 3'));
 speak(['你']); // One wrong attempt must reset consecutive count.
 assert(doc.querySelector('.pg9-dots').getAttribute('aria-label').includes('0 из 3'));
 assert(doc.querySelector('[data-speak-next]').disabled);
 speak(['我']);speak(['我']);speak(['我']);
 assert(doc.querySelector('.pg9-dots').getAttribute('aria-label').includes('3 из 3'));
 assert(!doc.querySelector('[data-speak-next]').disabled,'Only 3 in a row unlock Next');
 click(doc,'[data-speak-next]');
 assert(doc.querySelector('.pg9-hanzi').textContent==='你','Next word starts only after passing');
 assert(doc.querySelector('[data-speak-next]').disabled,'New word cannot be skipped');
 const saved=JSON.parse(w.localStorage.getItem('pg-hsk1-v209-speaking-check'));
 assert.equal(saved.position,1);
 assert.equal(saved.streak,0);
 assert.equal(saved.correctTotal,5);
 assert(w.PG2_SPEAKING.test.isCorrect('她',['他']),'Homophone 他/她 should not be false negative in audio');
 assert(w.PG2_SPEAKING.test.isCorrect('它',['她']),'All three tā characters are acoustically identical');
 assert(!w.PG2_SPEAKING.test.isCorrect('您',['你']),'nín and nǐ must not count as equivalent');
 assert(!w.PG2_SPEAKING.test.isCorrect('我',['你']),'Different words must be rejected');
 dom.window.close();
}
{
 const {doc,dom}=make(11,true,false);
 assert(doc.querySelector('[data-speak-start]').disabled,'Unsupported Web Speech browser must not fake score');
 assert(doc.querySelector('.pg9-warning').textContent.includes('Chrome'),'Unsupported browser must explain what to do');
 assert(doc.querySelector('[data-speak-next]').disabled,'Unsupported browser must not skip words as passed');
 dom.window.close();
}
console.log('PASS HSK1 v209: screen 10 resumed dialogue visible; voice playback+microphone gate, 3 consecutive recognized utterances, wrong reset, homophone honesty, persistence, unsupported browser fallback.');
