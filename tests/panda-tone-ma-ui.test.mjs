import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=s=>fs.readFileSync(new URL('../'+s,import.meta.url),'utf8');
const page=read('panda-tone-ma-practice.html');
const trainer=read('assets/panda-tone-ma-pilot-v463.mjs');
const bridge=read('assets/hsk1-tone-practice-bridge-v463.js');
const lesson=read('hsk1-first-v189.html');
test('four learning cards are on one page without navigation between tones',()=>{
 const actual=[...page.matchAll(/data-tone="(\d+)"/g)].map(x=>Number(x[1]));
 assert.deepEqual(actual,[1,2,3,4]);
 for(const word of ['妈','麻','马','骂'])assert(page.includes(word));
 assert(page.includes('id="record"')&&page.includes('id="next"')&&page.includes('id="listen"'));
 assert(!/<form[\s>]/i.test(page));
});
test('existing lesson audio sources are used in an opt-in tone modal',()=>{
 for(const f of ['ma1.mp3','ma2.mp3','ma3.mp3','ma4.mp3']) {
  assert(trainer.includes(f));
  assert(fs.statSync(new URL('../assets/lesson1-xiaoxiao-v260/'+f,import.meta.url)).size>1000);
 }
 assert(lesson.includes('hsk1-tone-practice-bridge-v463.js'));
 assert(bridge.includes('MutationObserver'));
 assert(bridge.includes("frame.src='./panda-tone-ma-practice.html'"));
 assert(bridge.includes("frame.allow='microphone; autoplay'"));
});
test('browser mic resources are explicitly released and there is no automatic tone grading',()=>{
 assert(trainer.includes('getUserMedia'));
 assert(trainer.includes('getTracks().forEach(t=>t.stop())'));
 assert(trainer.includes('ctx?.close()'));
 assert(trainer.includes('analyseContour(pitchFrames)'));
 assert(trainer.includes('isSecureContext'));
 assert(trainer.includes("pagehide"));
 assert(!/fetch\s*\(|XMLHttpRequest|sendBeacon/i.test(trainer));
 assert(page.includes('не распознавание китайских слов'));
 assert(page.includes('Нет оценок'));
});
test('new JS files parse in Node without runtime execution',()=>{
 for(const rel of ['assets/panda-tone-ma-pilot-v463.mjs','assets/hsk1-tone-practice-bridge-v463.js']){
  const result=spawnSync(process.execPath,['--check',fileURLToPath(new URL('../'+rel,import.meta.url))],{encoding:'utf8'});
  assert.equal(result.status,0,rel+': '+result.stderr);
 }
});

test('lesson tone modal opens and closes without replacing the lesson contents',()=>{
 const dom=new JSDOM('<!doctype html><html><head></head><body><section id="pg-content"><p id="lesson-position">Сохранить шаг</p><div class="tone-list"><button data-tone-play="妈">Слушать</button></div></section></body></html>',{
  url:'https://example.test/chinese-coach-pwa/hsk1-first-v189.html',
  runScripts:'outside-only'
 });
 try{
  const {window:w}=dom;
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  w.eval(bridge);
  const button=w.document.querySelector('[data-panda-tone-cta]');
  assert(button,'tone trigger added beside existing cards');
  assert.equal(w.document.querySelectorAll('[data-panda-tone-cta]').length,1);
  button.click();
  const modal=w.document.querySelector('dialog.pg-tone-modal');
  assert(modal.open,'modal opened');
  const frame=modal.querySelector('iframe');
  assert(frame);
  assert(frame.src.endsWith('/panda-tone-ma-practice.html'));
  assert.equal(frame.allow,'microphone; autoplay');
  modal.querySelector('.pg-tone-close').click();
  assert.equal(modal.open,false,'modal closed');
  assert.equal(modal.querySelector('iframe'),null,'iframe removed after closing to release mic');
  assert.equal(w.document.querySelector('#lesson-position').textContent,'Сохранить шаг');
 }finally{dom.window.close();}
});

test('coaching compares measured movement with the selected tone without grading speech',()=>{
 const start=trainer.indexOf('function toneGuidance('),end=trainer.indexOf('function controls(',start);
 assert(start>=0&&end>start);
 const guide=new Function(trainer.slice(start,end)+'\nreturn toneGuidance;')();
 const insufficient={kind:'insufficient',label:'Недостаточно данных',reason:'Повтори запись'};
 const short=direction=>({...insufficient,stats:{previewOnly:true,octaveJumpCount:0},shapeHint:{direction,confidence:'exploratory',isToneGrade:false}});
 assert.match(guide({n:2},short('fall')),/плавно подними/);
 assert.match(guide({n:1},short('level')),/предварительное/);
 assert.match(guide({n:4},{kind:'level'}),/быстро опусти/);
 assert.match(guide({n:3},{kind:'fall'}),/само по себе не ошибка/);
 assert.match(guide({n:2},{kind:'rise'}),/нельзя подтвердить/);
 assert.equal(guide({n:2},{...short('rise'),stats:{previewOnly:true,octaveJumpCount:1}}),'Недостаточно данных. Повтори запись');
 assert.equal(guide({n:2},insufficient),'Недостаточно данных. Повтори запись');
 assert.equal(guide({n:2},short('uncertain')),'Недостаточно данных. Повтори запись');
});

test('capture coaching withholds tone advice when a tracking jump or several regions are present',()=>{
 const start=trainer.indexOf('function toneGuidance('),end=trainer.indexOf('function controls(',start);
 const guide=new Function(trainer.slice(start,end)+'\nreturn captureGuidance;')();
 const result={kind:'insufficient',label:'Мало данных',reason:'Повтори',stats:{previewOnly:true,octaveJumpCount:0},shapeHint:{direction:'level',confidence:'exploratory',isToneGrade:false},points:[{t:0,st:0}]};
 assert.match(guide({n:4},{...result,stats:{octaveJumpCount:1}},null,[{}]),/сбой анализатора, а не ошибка произношения/);
 assert.match(guide({n:1},result,{discardedOtherRegions:1},[]),/движение всего слога не подтверждено/);
 assert.match(guide({n:1},result,{discardedOtherRegions:0},[]),/учебную схему/);
 assert.match(guide({n:4},{kind:'insufficient',points:[]},null,[{}]),/Линия неполная/);
});

test('four expected tones by four measured contours, short and long, provide coaching without grading',async()=>{
 const {analyseContour}=await import('../assets/panda-tone-analytics-v457.mjs');
 const start=trainer.indexOf('function toneGuidance('),end=trainer.indexOf('function controls(',start);
 const guide=new Function(trainer.slice(start,end)+'\nreturn captureGuidance;')();
 const shapes={level:x=>0,rise:x=>-3+6*x,dip:x=>-5+10*Math.abs(x-.5),fall:x=>3-6*x};
 const expected=['level','rise','dip','fall'];
 const tips=[/Удерживай голос ровно/,/плавно подними/,/опусти голос, затем мягко подними/,/быстро опусти/];
 for(const duration of [.32,.72])for(const [shape,fn] of Object.entries(shapes)){
  const n=Math.round(duration/.016);
  const result=analyseContour(Array.from({length:n+1},(_,i)=>({t:i*.016,hz:220*2**(fn(i/n)/12)})));
  assert.equal(result.shapeHint?.direction||result.kind,shape);
  assert.equal(result.isToneGrade,false);
  for(let i=0;i<4;i++){
   const advice=guide({n:i+1},result,null,[]);
   if(shape===expected[i])assert.match(advice,/похоже на учебную схему/);
   else if(i===2&&shape==='fall')assert.match(advice,/само по себе не ошибка/);
   else assert.match(advice,tips[i]);
   assert.match(advice,duration<.5?/предварительное/:/нельзя подтвердить/);
  }
 }
});
test('long pitch contour with internal missing samples is not assigned a direction',async()=>{
 const {analyseContour}=await import('../assets/panda-tone-analytics-v457.mjs');
 const gap=Array.from({length:40},(_,i)=>({t:i*.016+(i>=20?.10:0),hz:220*2**((i/39*6-3)/12)}));
 const result=analyseContour(gap);
 assert.equal(result.kind,'uncertain');
 assert.equal(result.stats.gapCount,1);
 assert.equal(result.points.length,0);
 assert.equal(result.isToneGrade,false);
 const start=trainer.indexOf('function toneGuidance('),end=trainer.indexOf('function controls(',start);
 const guide=new Function(trainer.slice(start,end)+'\nreturn captureGuidance;')();
 assert.match(guide({n:2},result,null,[]),/не означает ошибку произношения/);
});
