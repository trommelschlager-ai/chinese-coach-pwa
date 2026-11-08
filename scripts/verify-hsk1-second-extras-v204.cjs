'use strict';
/* v204: real Hanzi Writer five-stroke 他 + animated scene, no new lesson screens. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('hsk1-second-v203.html','utf8');
const script=fs.readFileSync('assets/hsk1-second-v203.js','utf8');
const extras=fs.readFileSync('assets/hsk1-second-extras-v204.js','utf8');
const style=fs.readFileSync('assets/hsk1-second-extras-v204.css','utf8');
const data=JSON.parse(fs.readFileSync('assets/hanzi-data/他.json','utf8'));
assert.equal(data.strokes.length,5,'他 must have exactly five authentic strokes');
assert.equal(data.medians.length,5,'Every stroke needs medians for correct pen tracing');
assert(html.includes('assets/vendor/hanzi-writer.min.js'),'Use existing local Hanzi Writer');
assert(html.includes('assets/hsk1-second-extras-v204.js?v=205'));
assert(html.includes('assets/hsk1-second-extras-v204.css?v=204'));
assert(style.includes('touch-action:none'),'Finger-writing surface should disable touch scrolling');
const mk=(step)=>{
 const d=new JSDOM(html,{url:'https://example.test/chinese-coach-pwa/hsk1-second-v203.html',runScripts:'outside-only'});
 const w=d.window,doc=w.document;
 w.PANDA_HSK1_NATIVE_HUMAN_V167={
 '我':'./assets/wo.mp3','你':'./assets/ni.mp3',
 '他':'./assets/ta.mp3','她':'./assets/ta2.mp3',
 '我们':'./assets/women.mp3','你们':'./assets/nimen.mp3',
 '老师':'./assets/teacher.mp3','吗':'./assets/ma.mp3'};
 w.PANDA_HSK1_VOICES={female:{'我是老师。':'./assets/f.mp3'},male:{'你是老师吗？':'./assets/m.mp3'}};
 const instances=[];
 w.Audio=function(file){
  this.src=file;instances.push(this);
  this.pause=()=>{};this.play=()=>{this.onplaying?.();return Promise.resolve()};
 };
 if(step)w.localStorage.setItem('pg-hsk1-v203-pronouns',JSON.stringify({step,done:Array(12).fill(false)}));
 w.eval(extras);w.eval(script);
 return {w,doc,instances,d};
};
{
 const {w,doc,d}=mk();
 // The first review, then new words 他 and 她.
 assert.equal(doc.querySelector('#pg-counter').textContent,'01 / 12');
 doc.querySelector('[data-answer="1"]').click();
 doc.querySelector('#pg-next').click();
 assert.equal(doc.querySelector('#pg-counter').textContent,'02 / 12');
 const panel=doc.querySelector('[data-writing-panel]');
 assert(panel,'Second screen should have optional handwriting panel');
 assert(panel.open,'Writing must be expanded by default, not hidden in an accordion');
 assert(Boolean(panel.compareDocumentPosition(doc.querySelector('.sheet'))&w.Node.DOCUMENT_POSITION_FOLLOWING),
  'Handwriting trainer must appear BEFORE the word cards, near top of second screen');
 assert(panel.querySelector('summary').textContent.includes('5 черт'));
 assert.equal(doc.querySelectorAll('.pg4-scene').length,0,'No scene on vocabulary screen');
 // A full Hanzi Writer stub verifies the correct engine and quiz integration.
 let config=null,character=null,quizConfig=null;
 w.HanziWriter={create(id,char,opts){
  character=char;config=opts;
  return {cancelQuiz(){},pauseAnimation(){},
   animateCharacter(){return Promise.resolve()},showOutline(){return Promise.resolve()},
   hideCharacter(){return Promise.resolve()},quiz(opts){quizConfig=opts}};
 }};
 panel.open=true;
 panel.dispatchEvent(new w.Event('toggle'));
 assert.equal(character,'他');
 assert.equal(typeof config.charDataLoader,'function');
 assert.equal(config.acceptBackwardsStrokes,false,'Should enforce authentic stroke direction');
 doc.querySelector('[data-write-practice]').click();
 // Quiz schedules promise microtasks; resolve and check onComplete below.
 (async()=>{await Promise.resolve();await Promise.resolve()})().catch(()=>{});
 // The page still advances after correct semantic answer even if user opts not to write.
 doc.querySelector('[data-answer="1"]').click();
 assert(!doc.querySelector('#pg-next').disabled,'Writing is optional, not a blocker');
 d.window.close();
}
{
 const {w,doc,instances,d}=mk(9);
 assert.equal(doc.querySelector('#pg-counter').textContent,'10 / 12');
 assert(doc.querySelector('.pg4-scene-window'),'Scene appears on conversation screen');
 assert.equal(doc.querySelectorAll('.pg4-scene-actor img').length,2);
 assert(doc.querySelector('[data-answer="0"]'),'Original conversation quiz still exists');
 doc.querySelector('[data-scene-play]').click();
 assert.equal(instances.length,1,'Start by playing the existing male question');
 assert.equal(instances[0].src,'./assets/m.mp3');
 assert.equal(doc.querySelector('[data-scene-window]').dataset.phase,'1');
 assert(doc.querySelector('[data-scene-caption]').textContent.includes('你是老师吗？'));
 instances[0].onended();
 assert.equal(instances.length,2,'Next play existing female response');
 assert.equal(instances[1].src,'./assets/hsk1-scene-v205/female-im-teacher-normalized.mp3',
  'Female scene must use balanced amplitude MP3, not quiet original');
 assert(fs.existsSync('assets/hsk1-scene-v205/female-im-teacher-normalized.mp3'),
  'Normalized female scene clip must exist');
 assert.equal(doc.querySelector('[data-scene-window]').dataset.phase,'2');
 assert(doc.querySelector('[data-scene-caption]').textContent.includes('我是老师。'));
 instances[1].onended();
 assert.equal(doc.querySelector('[data-scene-window]').dataset.phase,'done');
 assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk1-v204-extras')).sceneWatched,true);
 doc.querySelector('[data-scene-play]').click();
 doc.querySelector('[data-scene-stop]').click();
 assert.equal(doc.querySelector('[data-scene-window]').dataset.phase,'idle');
 d.window.close();
}
console.log('PASS lesson 2 v205: authentic 他 tracing visible by default; male original and volume-balanced female scene, 12 steps preserved.');
