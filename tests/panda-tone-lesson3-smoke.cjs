#!/usr/bin/env node
'use strict';
/* Runs without a mic or browser. Regression guard for the sole tone pilot
 * inside HSK2 lesson 3. No lesson data, audio files or progress are changed. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const asset=fs.readFileSync(path.join(root,'assets/hsk2-lesson3-tone-meter-pilot-20261122.js'),'utf8');
const page=fs.readFileSync(path.join(root,'hsk2-lesson3-work-study-preview.html'),'utf8');
const cache=page.match(/<script src="\.\/assets\/hsk2-lesson3-tone-meter-pilot-20261122\.js\?v=[^"]+"><\/script>/g)||[];
assert.equal(cache.length,1,'Lesson 3 must load exactly one pilot tone module');
assert(!page.includes('src="./assets/hsk2-lesson3-tone-meter-v6.js'),'Old tone pilot must not load');
assert(page.includes("if(step===6)window.PandaToneTrainer?.mount()"),'Tone pilot should mount only in step 6');
assert(asset.includes("const KEY='pg-hsk2-l3-tone-trainer-v1'"),'Progress key must stay unchanged');
assert(asset.includes("old.closest('.l3-tone-details')"),'Update must be scoped to tone panel');
new vm.Script(asset,{filename:'lesson3-tone-pilot.js'});

const words=[
 ['公司','gōngsī','компания'],['学校','xuéxiào','школа'],
 ['同事','tóngshì','коллега'],['同学','tóngxué','однокурсник'],
 ['电脑','diànnǎo','компьютер'],['会说','huì shuō','уметь говорить']
].map(([zh,py,ru])=>({zh,py,ru}));
const data={selected:2,reps:Array.from({length:6},()=>({
 mic:Array.from({length:5},(_,k)=>({points:Array.from({length:14},(_,i)=>[i/13,180+(i+k)]),
  seconds:.72,splitRatio:.5,quality:'both',voiceMs:540})),
 manual:0
}))};
const callbacks={},writes=[];
const localStorage={
 getItem:k=>k==='pg-hsk2-l3-tone-trainer-v1'?JSON.stringify(data):null,
 setItem:(k,v)=>writes.push({key:k,value:v})
};
const selectedButtons=['preview','analysis'].map(value=>({
 dataset:{toneView:value},disabled:false,attrs:{},
 classList:{toggle:()=>{}},
 setAttribute(k,v){this.attrs[k]=v;},
 closest:()=>({}),
}));
const strokes={1:[],2:[]},textNodes={};
function createCanvas(i){
 const ctx={strokeStyle:'',lineWidth:0,fillStyle:'',
  beginPath(){this.path=[];},moveTo(x,y){this.path.push(['M',x,y]);},
  lineTo(x,y){this.path.push(['L',x,y]);},
  stroke(){strokes[i].push({color:this.strokeStyle,path:JSON.stringify(this.path||[])})},
  setLineDash(){},clearRect(){},fillRect(){},fillText(){}
 };
 return {width:360,height:175,getContext(){return ctx}};
}
const canvases=[null,createCanvas(1),createCanvas(2)];
const panel={outerHTML:''},node={parentElement:panel,closest:()=>({}),scrollIntoView(){}};
const document={
 addEventListener(name,fn){(callbacks[name]??=[]).push(fn)},
 getElementById(id){
  if(id==='tone-trainer')return node;
  if(id==='tone-canvas-1')return canvases[1];
  if(id==='tone-canvas-2')return canvases[2];
  if(id.startsWith('tone-trend-'))return textNodes[id]??(textNodes[id]={textContent:''});
  return null;
 },
 querySelectorAll(){return selectedButtons}
};
const window={addEventListener(){}},navigator={};
const injected=asset.replace(/\}\)\(\);\s*$/,
 'window.__test={draw,normalizeChartPoints,state,setActive:x=>{active=x},setRecent:x=>{visibleAttempt=x}};})();');
assert.notEqual(injected,asset,'Could not expose test-only DSP instrumentation');
vm.runInNewContext(injected,{window,document,localStorage,navigator,performance:{now:()=>0},console,setTimeout,clearTimeout},
 {filename:'panda-tone-lesson3-smoke.cjs',timeout:5000});
const trainer=window.PandaToneTrainer;
assert.equal(trainer.total(),30,'Saved 30/30 progress must load');
const render=trainer.render(words,null,null,x=>'<section class="panel">'+x+'</section>','',()=>'<button>▶ пример</button>');
assert(render.includes('data-tone-view="preview"')&&render.includes('data-tone-view="analysis"'),'Two chart modes missing');
assert(render.includes('30 / 30'),'Progress text missing');
assert(render.includes('Сводка сохранённых попыток'),'Saved-attempt diagnostics missing');
assert(render.includes('lab-replay'),'Microphone replay missing');
assert(!render.includes('data-tone-act="manual"'),'Manual repeat at 30/30 should be hidden');

const test=window.__test;
const live=Array.from({length:24},(_,i)=>[.15+i*.027,170+2*i]);
test.setActive({word:2,samples:live});
test.draw();
const before=strokes[1].filter(x=>x.color==='#198b70').map(x=>x.path);
const frozen=test.normalizeChartPoints(live,true);
strokes[1]=[];
test.setActive(null);
test.setRecent({word:2,points:Array.from({length:24},(_,i)=>[i/23,250-i*2]),
 seconds:.67,splitRatio:.54,validParts:[true,true],previewPoints:frozen,previewSeconds:.621});
test.draw();
const after=strokes[1].filter(x=>x.color==='#198b70').map(x=>x.path);
assert.deepEqual(after,before,'Green curve changed after stop');
assert.equal(strokes[1].filter(x=>x.color==='#d97827').length,0,'Offline must not overlay green by default');
for(const fn of callbacks.click||[])fn({target:{closest:s=>s==='[data-tone-view]'?{
 dataset:{toneView:'analysis'},disabled:false,closest:()=>({})}:null}});
assert(strokes[1].some(x=>x.color==='#d97827'),'Offline chart not shown after switching');

console.log('Lesson-3 tone pilot smoke: PASS');
console.log('  - six words and saved 30/30 progress');
console.log('  - no progress reset / no duplicate microphone module');
console.log('  - preview unchanged after stop');
console.log('  - offline analysis rendered only on request');
console.log('  - replay and saved-attempt diagnostics present');
