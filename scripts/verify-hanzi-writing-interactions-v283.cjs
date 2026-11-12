'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('hanzi-writing.html','utf8');
const script=fs.readFileSync('assets/hanzi-writing-v283.js','utf8');
const curriculum=JSON.parse(fs.readFileSync('assets/hanzi-writing-curriculum-v283.json','utf8'));
const dom=new JSDOM(html,{url:'https://panda.test/chinese-coach-pwa/hanzi-writing.html?lesson=6',runScripts:'outside-only'});
const w=dom.window,d=w.document;
let instances=[],requests=[];
w.fetch=async url=>{
 requests.push(url);
 if(url.includes('hanzi-writing-curriculum'))return {ok:true,json:async()=>curriculum};
 const char=decodeURIComponent(url.split('/').at(-1).replace('.json',''));
 const data=JSON.parse(fs.readFileSync('assets/hanzi-data/'+char+'.json','utf8'));
 return {ok:true,json:async()=>data};
};
w.HanziWriter={
 create(id,ch,options){
  const inst={ch,cancelled:false,
   cancelQuiz(){this.cancelled=true;},
   pauseAnimation(){},
   animateCharacter(){return Promise.resolve();},
   quiz(callbacks){
    callbacks.onCorrectStroke?.({strokesRemaining:1});
    callbacks.onComplete?.();
   }
  };
  assert.equal(id,'writing-canvas');
  assert.equal(typeof options.charDataLoader,'function');
  instances.push(inst);
  options.charDataLoader(ch,()=>{},err=>{throw err});
  return inst;
 }
};
const flush=()=>new Promise(resolve=>setTimeout(resolve,20));
(async()=>{
 w.eval(script);
 await flush();
 assert.equal(d.querySelectorAll('[data-lesson]').length,7);
 assert.equal(d.querySelectorAll('[data-character-index]').length,curriculum.lessons[5].characters.length);
 assert.equal(d.getElementById('writing-selected-hanzi').textContent,'妈');
 assert(d.getElementById('writing-back').href.endsWith('/hsk1-family-v231.html'));
 const oldLessonState=w.localStorage.getItem('pg-hsk1-l6-v231');
 d.getElementById('writing-demo').click();await flush();
 assert(d.getElementById('writing-status').textContent.includes('Писать'));
 d.getElementById('writing-write').click();await flush();
 assert(d.getElementById('writing-status').textContent.includes('написан правильно'));
 const saved=JSON.parse(w.localStorage.getItem('pg-hanzi-writing-v283'));
 assert.equal(saved['6:妈'],true);
 assert(d.querySelector('.writing-char-btn.done'));
 assert.equal(w.localStorage.getItem('pg-hsk1-l6-v231'),oldLessonState,'Lesson progress must not be changed');
 d.getElementById('writing-next').click();await flush();
 assert.equal(d.getElementById('writing-selected-hanzi').textContent,'爸');
 d.querySelector('[data-lesson="7"]').click();await flush();
 assert.equal(d.getElementById('writing-selected-hanzi').textContent,'天');
 assert(d.getElementById('writing-lesson-name').textContent.includes('Погода'));
 d.querySelector('[data-character-index="4"]').click();await flush();
 assert.equal(d.getElementById('writing-selected-hanzi').textContent,'晴');
 d.getElementById('writing-reset').click();await flush();
 assert(d.getElementById('writing-status').textContent.includes('Поле очищено'));
 assert(requests.some(x=>x.includes('hanzi-data/')));
 assert(instances.length>=4);
 dom.window.close();
 console.log('PASS Hanzi studio v283 interactive QA: tabs, writing, completed progress, strokes, back navigation, reset');
})().catch(err=>{console.error(err);process.exit(1)});
