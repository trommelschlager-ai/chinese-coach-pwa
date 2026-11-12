'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const data=JSON.parse(fs.readFileSync('assets/hsk1-diagnostic-v287-data.json','utf8'));
const code=fs.readFileSync('assets/hsk1-diagnostic-v287.js','utf8');
const html=fs.readFileSync('hsk1-diagnostic.html','utf8');
new vm.Script(code);
assert.equal(data.version,287);
assert.equal(data.questions.length,21);
assert.deepEqual(Array.from({length:7},(_,i)=>data.questions.filter(q=>q.lesson===i+1).length),Array(7).fill(3));
for(const q of data.questions){
 assert(q.prompt&&q.explain);
 if(q.kind==='audio'){assert(q.choices.length>=3);assert(fs.statSync(q.audio.slice(2)).size>3000,'missing clip '+q.audio)}
 if(q.kind==='choice')assert(q.correct>=0&&q.correct<q.choices.length);
 if(q.kind==='build')assert(q.target.length>=2);
}
assert(fs.readFileSync('hsk1-map.html','utf8').includes('hsk1-diagnostic.html'));
const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
for(const path of ['./hsk1-diagnostic.html','./assets/hsk1-diagnostic-v287.js?v=287','./assets/hsk1-diagnostic-v287.css?v=287','./assets/hsk1-diagnostic-v287-data.json',...data.questions.filter(q=>q.audio).map(q=>q.audio)])assert(pack.files.includes(path),'not in offline '+path);
const dom=new JSDOM(html,{url:'https://panda.test/hsk1-diagnostic.html',runScripts:'outside-only'});
const w=dom.window,d=w.document;
w.fetch=async()=>({ok:true,json:async()=>data});
w.Audio=function(src){this.src=src;this.pause=()=>{};this.play=()=>{this.onended?.();return Promise.resolve()}};
w.localStorage.setItem('pg-hsk1-l6-v231','existing');
w.eval(code);
function click(selector){const x=d.querySelector(selector);assert(x,'missing '+selector);assert(!x.disabled,'disabled '+selector);x.click()}
(async()=>{
 await new Promise(r=>setTimeout(r,25));
 for(let i=0;i<21;i++){
  const q=data.questions[i];
  if(q.kind==='audio'){assert(d.querySelector('[data-answer]').disabled,'audio gate');click('[data-audio]')}
  if(q.kind==='build'){
   for(let n=0;n<q.target.length;n++)click('[data-pick="'+n+'"]');
   click('[data-check]');
  }else{
   if(i===0){click('[data-answer="1"]');assert(d.getElementById('pg-exam-next').disabled)}
   click('[data-answer="'+q.correct+'"]');
  }
  assert(!d.getElementById('pg-exam-next').disabled,'must unlock '+i);
  click('#pg-exam-next');
 }
 assert(d.querySelector('.pg-exam-score').textContent.includes('20 / 21'));
 click('[data-review]');
 click('[data-answer="0"]');
 click('#pg-exam-next');
 assert(d.querySelector('.pg-exam-score').textContent.includes('20 / 21'),'preserve first-try score');
 assert.equal(w.localStorage.getItem('pg-hsk1-l6-v231'),'existing');
 dom.window.close();
 console.log('PASS diagnostic HSK1: 21 tasks, seven audios, locked listening, mistake replay and preserved progress');
})().catch(e=>{console.error(e);process.exit(1)});
