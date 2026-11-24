import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {sampleTones,makeListeningRound,checkAnswer,explanations} from '../assets/panda-tone-exercises-v469.mjs';
const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const pages=['hsk1-first-v189.html','hsk1-second-v203.html','hsk1-third-v212.html','hsk1-fourth-v214.html','hsk1-fifth-v227.html','hsk1-family-v231.html','hsk1-weather-v231.html'];

test('the eight-round listening drill uses two each of the four real lesson samples',()=>{
 assert.equal(sampleTones.length,4);
 assert.deepEqual(sampleTones.map(x=>x.pinyin),['mā','má','mǎ','mà']);
 for(let i=0;i<4;i++){
  assert.equal(sampleTones[i].tone,i+1);
  assert(fs.existsSync(new URL(sampleTones[i].src.slice(2),root)),sampleTones[i].src+' missing');
 }
 for(let t=0;t<60;t++){
  const order=makeListeningRound();
  assert.equal(order.length,8);
  for(let n=0;n<4;n++)assert.equal(order.filter(v=>v===n).length,2);
 }
 assert.equal(checkAnswer(2,2),true);
 assert.equal(checkAnswer(0,1),false);
 assert.equal(explanations.length,4);
});

test('seven HSK1 lessons expose the opt-in training without altering route or progress',()=>{
 const tag='<script defer src="./assets/panda-tone-lesson-entry-v469.js?v=469"></script>';
 for(let i=0;i<pages.length;i++){
  const html=read(pages[i]);
  assert.equal((html.match(/panda-tone-lesson-entry-v469.js/g)||[]).length,1,pages[i]);
  assert(html.includes(tag),pages[i]);
  assert(html.includes('data-pg-hsk1="'+(i+1)+'"'),pages[i]);
  assert(html.includes('hsk1-map.html'),pages[i]);
 }
 const entry=read('assets/panda-tone-lesson-entry-v469.js');
 assert(entry.includes("iframe.allow='microphone; autoplay'"));
 assert(entry.includes("iframe.src='./panda-tone-exercises.html?v=469'"));
 assert(!/localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest/i.test(entry));
});

test('the HSK1 header entry opens and closes without touching lesson progress',()=>{
 const dom=new JSDOM('<!doctype html><html><head></head><body data-pg-hsk1="2"><header data-pg-hsk1-header><div class="pg-hsk1-tools"><a class="pg-hsk1-write" href="#">✍️</a><span class="pg-hsk1-count">03 / 12</span></div></header><main id="pg-content">Original lesson step</main></body></html>',{url:'https://example.com/hsk1-second-v203.html',runScripts:'outside-only'});
 const {window}=dom;
 window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new window.Event('close'));};
 window.eval(read('assets/panda-tone-lesson-entry-v469.js'));
 const link=window.document.querySelector('[data-tone-training-link]');
 assert(link,'Tone entry should exist');
 assert.equal(link.getAttribute('href'),'./panda-tone-exercises.html?v=469');
 assert.equal(window.document.getElementById('pg-content').textContent,'Original lesson step');
 assert.equal(window.document.querySelector('.pg-hsk1-count').textContent,'03 / 12');
 link.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true}));
 const dialog=window.document.querySelector('.pg-tone-training-dialog');
 assert(dialog.open);
 assert(dialog.querySelector('iframe').src.endsWith('/panda-tone-exercises.html?v=469'));
 dialog.querySelector('.pg-tone-training-close').click();
 assert.equal(dialog.open,false);
 assert.equal(dialog.querySelector('iframe'),null,'Closing the modal must stop iframe audio/mic');
 assert.equal(window.document.getElementById('pg-content').textContent,'Original lesson step');
 dom.window.close();
});

test('a real eight-round listening session and four shape questions score answers, not microphone',async()=>{
 const dom=new JSDOM(read('panda-tone-exercises.html'),{url:'https://example.com/panda-tone-exercises.html',runScripts:'outside-only'});
 const prev={document:globalThis.document,window:globalThis.window,Audio:globalThis.Audio};
 let lastSrc='';
 class AudioMock{constructor(src){this.src=src;lastSrc=src;}play(){return Promise.resolve();}pause(){}}
 globalThis.document=dom.window.document;
 globalThis.window=dom.window;
 globalThis.Audio=AudioMock;
 try{
  await import('../assets/panda-tone-exercises-v469.mjs?dom-v469');
  for(let i=0;i<8;i++){
   dom.window.document.getElementById('hear-play').click();
   await Promise.resolve();await Promise.resolve();
   const correct=sampleTones.findIndex(x=>x.src===lastSrc);
   assert(correct>=0,'Original MP3 must be played');
   dom.window.document.querySelector('[data-hear="'+correct+'"]').click();
   assert.match(dom.window.document.getElementById('hear-feedback').textContent,/Верно/);
   dom.window.document.getElementById('hear-next').click();
  }
  assert.match(dom.window.document.getElementById('hear-feedback').textContent,/8 из 8/);
  for(let i=0;i<4;i++){
   const pinyin=dom.window.document.getElementById('shape-prompt').textContent;
   const correct=sampleTones.findIndex(x=>x.pinyin===pinyin);
   assert(correct>=0);
   dom.window.document.querySelector('[data-shape="'+correct+'"]').click();
   assert.match(dom.window.document.getElementById('shape-feedback').textContent,/Верно/);
   dom.window.document.getElementById('shape-next').click();
  }
  assert.match(dom.window.document.getElementById('shape-feedback').textContent,/4 из 4/);
  assert.equal(dom.window.document.querySelector('.go.primary').getAttribute('href'),'./panda-tone-ma-practice.html?v=468');
  assert.match(dom.window.document.body.textContent,/Нет оценок|Без оценок/);
 }finally{
  globalThis.document=prev.document;globalThis.window=prev.window;globalThis.Audio=prev.Audio;
  dom.window.close();
 }
});

test('connected-speech drill teaches reviewed examples and neutral tone, not voice scores',async()=>{
 const {contextToneExamples,checkContextTone}=await import('../assets/panda-tone-exercises-v469.mjs');
 assert.deepEqual(contextToneExamples.map(x=>x.answer),[2,2,2,2,4,4,2,0,0,0]);
 assert.equal(checkContextTone(0,3),false);
 assert.equal(checkContextTone(7,0),true);
 assert.equal(checkContextTone(8,0),true);
 assert.equal(checkContextTone(9,0),true);
 assert.equal(checkContextTone(10,0),false);
 assert.equal(checkContextTone(0,'2'),false);
 const dom=new JSDOM(read('panda-tone-exercises.html'),{url:'https://example.com/panda-tone-exercises.html',runScripts:'outside-only'});
 const prev={document:globalThis.document,window:globalThis.window};
 globalThis.document=dom.window.document;globalThis.window=dom.window;
 try{
  await import('../assets/panda-tone-exercises-v469.mjs?context-tone');
  const doc=dom.window.document;
  for(const item of contextToneExamples){
   assert.equal(doc.getElementById('context-prompt').textContent,item.zh);
   doc.querySelector('[data-context-tone="'+item.answer+'"]').click();
   assert.match(doc.getElementById('context-feedback').textContent,/Верно/);
   doc.getElementById('context-next').click();
  }
  assert.match(doc.getElementById('context-feedback').textContent,/10 из 10/);
  doc.getElementById('context-restart').click();
  assert.equal(doc.getElementById('context-count').textContent,'0 / 10');
 }finally{globalThis.document=prev.document;globalThis.window=prev.window;dom.window.close();}
});

test('Panda AI tone practice pauses dialogue before opening an opt-in local microphone',()=>{
 const core=read('assets/panda-hsk2-preview-core-v1.mjs');
 const ui=read('assets/panda-hsk2-preview-ui-v1.mjs');
 assert(core.includes('pauseForTonePractice:()=>{cancelFollowup();stopRecognition();stopAudio();}'));
 assert(ui.includes('id="pg-tone-practice"'));
 assert(ui.includes("stopHistoryAudio();bridge.pauseForTonePractice();closeTopics();sync();"));
 assert(ui.includes("frame.src='./panda-tone-exercises.html?v=469'"));
 assert(ui.includes("frame.allow='microphone; autoplay'"));
 assert(ui.includes("frame.remove();dialog.remove();toneDialog=null"));
 assert(ui.includes("if(specialToneScenario||typeof bridge.pauseForTonePractice!=='function')toneEntry.hidden=true"));
 assert(core.includes('contentVerified:false,toneVerified:false'));
});
