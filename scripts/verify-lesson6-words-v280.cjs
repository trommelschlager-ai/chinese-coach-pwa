'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('hsk1-family-v231.html','utf8');
const visual=fs.readFileSync('assets/lesson-visuals-v233.js','utf8');
const data=fs.readFileSync('assets/hsk1-foundations-data-v152.js','utf8');
const app=fs.readFileSync('assets/panda-go-companion-v231.js','utf8');
const css=fs.readFileSync('assets/panda-go-approved-lessons-v231.css','utf8');
const offline=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
const map={'有':'you','没有':'meiyou','一个':'yige'};
for(const [hz,n] of Object.entries(map)){
 const path='assets/lesson6-words-v280/'+n+'.webp',buf=fs.readFileSync(path);
 assert(buf.length>1000,'No image '+hz);
 assert.equal(buf.toString('ascii',0,4),'RIFF');
 assert.equal(buf.toString('ascii',8,12),'WEBP');
 assert(offline.files.includes('./'+path),'Missing offline '+hz);
 assert(visual.includes("'"+hz+"':'"+n+"'"),'Missing mapping '+hz);
}
assert(html.includes('lesson-visuals-v233.js?v=280')&&html.includes('panda-go-approved-lessons-v231.css?v=280'));
assert(css.includes('.word-art.pg6-word-photo'));
const dom=new JSDOM(html,{url:'https://panda.test/hsk1-family-v231.html',runScripts:'outside-only'});
const w=dom.window,d=w.document;
w.eval(data);w.PANDA_HSK1_VOICES={female:new Proxy({},{get(_,p){return './assets/f/'+String(p)+'.mp3'}}),male:new Proxy({},{get(_,p){return './assets/m/'+String(p)+'.mp3'}})};
w.Audio=function(src){this.src=src;this.pause=()=>{};this.play=()=>Promise.resolve();};
w.HanziWriter={create:()=>({cancelQuiz(){},pauseAnimation(){},animateCharacter(){},quiz(){}})};
w.eval(visual);w.eval(app);
for(let i=0;i<3;i++)d.querySelector('#pg5-next').click();
assert(d.getElementById('pg5-count').textContent.includes('4 из 14'));
for(const [hz,n] of Object.entries(map)){
 const card=[...d.querySelectorAll('.word')].find(x=>x.querySelector('strong')?.textContent===hz);assert(card,'Missing card '+hz);
 assert.equal(card.querySelector('.pg6-word-photo')?.getAttribute('src'),'./assets/lesson6-words-v280/'+n+'.webp');
 assert(card.querySelector('button[data-play="'+hz+'"]'),'Sound missing '+hz);
}
dom.window.close();
console.log('PASS lesson 6 v280: three approved word images, working buttons, offline cache and layout.');
