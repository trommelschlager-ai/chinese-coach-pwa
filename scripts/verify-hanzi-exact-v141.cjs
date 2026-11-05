const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');
const html = fs.readFileSync('hanzi-lab.html','utf8');
const inline = [...html.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(Boolean);
const dom = new JSDOM(html,{url:'https://example.test/hanzi-lab.html',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document,played=[],spoken=[],writers=[];
w.scrollTo=()=>{};
w.Audio=class{constructor(src){this.src=src}play(){played.push(this.src);return Promise.resolve()}pause(){}};
w.speechSynthesis={getVoices:()=>[{lang:'zh-CN',name:'Mandarin',voiceURI:'test'}],addEventListener(){},cancel(){},speak(u){spoken.push(u.text)}};
w.SpeechSynthesisUtterance=function(text){this.text=text};
w.HanziWriter={create(id,hz,options){const writer={hz,cancelQuiz(){},animateCharacter(){return Promise.resolve()},hideCharacter(){return Promise.resolve()},quiz(callbacks){this.callbacks=callbacks}};writers.push(writer);queueMicrotask(()=>options.onLoadCharDataSuccess());return writer}};
w.eval(inline);
const tick=()=>new Promise(resolve=>setTimeout(resolve,35));
(async()=>{
 await new Promise(resolve=>w.addEventListener('DOMContentLoaded',resolve,{once:true}));
 w.eval(fs.readFileSync('assets/hanzi-exact-v141.js','utf8'));await tick();
 const stage=d.querySelector('#pg-hanzi-approved'),hit=name=>stage.querySelector('[data-art-hit="'+name+'"]');
 assert(stage);assert.equal(stage.dataset.dynamic,'false');
 assert(d.querySelector('.paper').closest('#pg-hanzi-approved'));
 assert(d.querySelector('.shell').inert,'Hidden original controls must not enter keyboard order');
 hit('meaning').click();await tick();assert.equal(stage.querySelector('.pg-panel-clean').hidden,false);assert(stage.querySelector('.pg-dynamic-panel').textContent.includes('мнемоника'));
 assert(hit('example-0').hidden);
 hit('words').click();await tick();assert.equal(stage.querySelectorAll('.pg-dynamic-row').length,3);assert(stage.querySelector('.pg-dynamic-panel').textContent.includes('大学'));
 hit('examples').click();await tick();assert(stage.querySelector('.pg-dynamic-panel').hidden);assert(stage.querySelector('.pg-panel-clean').hidden);
 for(const hz of ['大','人','小','一','二','三','口','日','月','木']){
  assert.equal(d.querySelector('#character').textContent,hz);assert.equal(writers.at(-1).hz,hz);
  hit('speak').click();assert(played.at(-1).includes(encodeURIComponent(hz)));
  for(let i=0;i<3;i++){hit('example-'+i).click();assert(spoken.at(-1),'Each example routes to current Mandarin text')}
  if(hz!=='大'){
   assert.equal(stage.dataset.dynamic,'true');assert.equal(stage.querySelector('.pg-dynamic-glyph').textContent,hz);
   assert.equal(stage.querySelector('.pg-dynamic-panel').hidden,false);assert.equal(stage.querySelectorAll('.pg-dynamic-row').length,3);
  }
  hit('strokes').click();await tick();assert.equal(stage.querySelector('.pg-art-stroke-paper').hidden,false);
  hit('write').click();await tick();assert.equal(d.body.dataset.writingStage,'writing');
  const callbacks=writers.at(-1).callbacks;assert(callbacks);callbacks.onMistake({totalMistakes:1});await tick();assert(stage.querySelector('.pg-art-status').textContent.includes('неверно'));
  callbacks.onCorrectStroke({strokeNum:0,strokesRemaining:0});callbacks.onComplete({totalMistakes:1});await tick();assert.equal(d.body.dataset.writingStage,'complete');
  hit('next').click();await tick();
 }
 assert.equal(d.querySelector('#character').textContent,'大');
 assert.equal(JSON.parse(w.localStorage.getItem('chinese-coach-hanzi-lab-v1')).length,10);
 console.log('PASS: exact overlay, 10 characters, 30 sentence routes, tabs, animation, quiz callbacks, progress and wraparound. Browser and real-device QA remain separate.');
 dom.window.close();
})().catch(e=>{console.error(e);dom.window.close();process.exitCode=1});
