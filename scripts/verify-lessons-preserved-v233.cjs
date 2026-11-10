'use strict';
const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const visual=fs.readFileSync('assets/lesson-visuals-v233.js','utf8');
const scripts=['assets/hsk1-foundations-data-v152.js','assets/hsk1-voices-map-v160.js','assets/hsk1-native-human-map-v167.js','assets/native-owner-v200.js','assets/panda-owner-lessons5-7-native-v221.js'];
const source=file=>fs.readFileSync(file,'utf8'),baseline=file=>cp.execFileSync('git',['show','HEAD:'+file],{maxBuffer:20e6}).toString();
let audioCount=0,disabledCount=0;
for(const lesson of [5,6,7]){
 const html=lesson===5?'hsk1-fifth-v227.html':lesson===6?'hsk1-family-v231.html':'hsk1-weather-v231.html';
 const js=lesson===5?'assets/hsk1-fifth-v227.js':'assets/panda-go-companion-v231.js';
 const key=lesson===5?'pg-hsk1-l5-v227':'pg-hsk1-l'+lesson+'-v231';
 for(let step=0;step<14;step++){
  const snapshots=[];
  for(const changed of [false,true]){
   const dom=new JSDOM(source(html),{url:'https://panda.test/'+html,runScripts:'outside-only'}),w=dom.window,d=w.document;
   const legacy=JSON.stringify({step:4,done:true});w.localStorage.setItem('pg-hsk1-v3-complete',JSON.stringify(['greetings']));w.localStorage.setItem('pg-hsk1-v3-dates',legacy);
   w.localStorage.setItem(key,JSON.stringify({step,maxStep:step,heard:{},listen:0,built:0,chosen:[],used:[],quizPassed:false,done:false}));
   let played=[];w.Audio=function(src){this.src=src;this.pause=()=>{};this.play=()=>{played.push(src);return Promise.resolve()}};
   w.HanziWriter={create:()=>({animateCharacter(){},cancelQuiz(){},pauseAnimation(){},quiz(){}})};
   for(const f of scripts)w.eval(source(f));if(changed)w.eval(visual);w.eval(changed?source(js):baseline(js));
   const stage=d.getElementById('pg5-stage');
   assert.equal(d.querySelector('.app').dataset.step,String(step));
   const buttons=[...stage.querySelectorAll('[data-play]')];
   const text=stage.cloneNode(true);text.querySelectorAll('.word-emoji,.word-art,.scene-ribbon').forEach(x=>x.remove());
   snapshots.push({text:text.textContent.replace(/\s+/g,' ').trim(),audio:buttons.map(x=>[x.dataset.play,x.dataset.role,x.disabled]),saved:w.localStorage.getItem(key)});
   for(const b of buttons){if(b.disabled){if(changed)disabledCount++;continue}b.click();if(changed)audioCount++}
   for(const file of played){if(file.startsWith('data:'))continue;const path=file.split('?')[0].replace(/^\.\//,'');assert(fs.existsSync(path),'Missing audio '+file);assert(fs.statSync(path).size>0)}
   assert.equal(w.localStorage.getItem('pg-hsk1-v3-dates'),legacy,'Existing legacy progress changed');
   dom.window.close();
  }
  assert.deepEqual(snapshots[1],snapshots[0],`Curriculum/audio/progress changed: lesson ${lesson} step ${step+1}`);
 }
 console.log(`PASS lesson ${lesson}: all 14 screens preserve complete text, audio mappings and saved state`);
}
console.log(`PASS ${audioCount} enabled audio buttons resolve original playable files. Existing unavailable buttons: ${disabledCount}.`);
