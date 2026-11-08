'use strict';
/* Regression: complete Panda Go HSK1 lesson 3 and preserve lesson 1/2 data.
   Educational safety: correct Mandarin pinyin, single native speaker numbers,
   genuine 5-number groups, stroke writing, listening and ordered composition. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const h=fs.readFileSync('hsk1-third-v212.html','utf8'),
 js=fs.readFileSync('assets/hsk1-third-v212.js','utf8'),
 css=fs.readFileSync('assets/hsk1-third-v212.css','utf8'),
 native=fs.readFileSync('assets/hsk1-native-human-map-v167.js','utf8'),
 voices=fs.readFileSync('assets/hsk1-voices-map-v160.js','utf8'),
 map=fs.readFileSync('hsk1-map.html','utf8');
assert(map.includes('data-num="3" href="./hsk1-third-v212.html"'),'Map 3 must open rebuilt numbers lesson');
assert(h.includes('assets/hsk1-third-v212.js?v=212'));
assert(h.includes('assets/hsk1-third-v212.css?v=212'));
assert(h.includes('assets/vendor/hanzi-writer.min.js'));
assert(css.includes('--gold:#f4bc54')&&css.includes('--crimson:#aa0610'),'Approved red/gold palette');
assert(css.includes('panda-explorer-v174.svg')===false,'Panda is visible in markup as SVG image, not CSS placeholder');
for(const n of ['一','二','三'])assert(fs.existsSync('assets/hanzi-data/'+n+'.json'),'Stroke data required for '+n);
const dom=new JSDOM(h,{url:'https://panda.test/hsk1-third-v212.html',runScripts:'outside-only'});
const w=dom.window,d=w.document;
w.localStorage.setItem('pg-hsk1-v203-pronouns',JSON.stringify({step:7,completed:true}));
w.localStorage.setItem('pg-hsk1-v189-lesson1',JSON.stringify({step:13,completed:true}));
w.localStorage.setItem('pg-hsk1-v3-complete',JSON.stringify(['foundations','pronouns']));
w.eval(native);w.eval(voices);
const files=w.PANDA_HSK1_NATIVE_HUMAN_V167;
for(const word of '一二三四五六七八九十'){
 const file=files[word];
 assert(file&&fs.existsSync(file.slice(2)),'Missing human female number MP3 '+word);
}
const played=[];
w.Audio=function(src){this.src=src;played.push(this);this.pause=()=>{};this.play=()=>Promise.resolve()};
const strokes=[];
w.HanziWriter={create(id,char,settings){
 strokes.push({char,settings});
 return {cancelQuiz(){},pauseAnimation(){},animateCharacter(){return Promise.resolve()},quiz({onComplete}){onComplete()}};
}};
w.eval(js);
const step=()=>Number(d.getElementById('pg3-count').textContent.split(' ')[0]);
const control=sel=>{const e=d.querySelector(sel);assert(e,'Missing control '+sel+' at step '+step());assert(!e.disabled,'Disabled control '+sel+' at step '+step());e.click();return e};
const forward=()=>control('#pg3-next');
assert.equal(step(),1);
assert(d.querySelector('.pg3-intro-numbers')?.textContent.includes('五'),'Intro first five numbers');
assert(d.querySelector('img[src="./assets/panda-explorer-v174.svg"]'),'Approved panda-like warm mascot used');
forward();
assert.equal(step(),2);
assert(d.getElementById('pg3-next').disabled,'Must open all first five number cards');
for(const char of '一二三四五')control('[data-number="'+char+'"]');
assert(!d.getElementById('pg3-next').disabled);
forward();
assert.equal(step(),3);
for(const char of '六七八九十')control('[data-number="'+char+'"]');
forward();
assert.equal(step(),4);
assert.equal(strokes[0].char,'一');
assert.equal(strokes[0].settings.acceptBackwardsStrokes,false);
control('[data-char="二"]');assert.equal(strokes.at(-1).char,'二');
control('[data-write]');
forward();
assert.equal(step(),5);
const listenTargets=['二','三','一'];
const listenChoice=['二','三','一'];
for(let i=0;i<listenTargets.length;i++){
 assert(d.getElementById('pg3-next').disabled,'Quiz must block skipping');
 assert(d.querySelector('[data-answer]').disabled,'Need audio before selecting number');
 control('[data-play="'+listenTargets[i]+'"]');
 assert(played.length>0,'Human recorded voice must play');
 control('[data-answer="'+listenChoice[i]+'"]');
}
assert.equal(step(),6,'Successful listening quiz should advance immediately');
assert(d.getElementById('pg3-stage').textContent.includes('十二'),'Teach 12');
forward();
assert.equal(step(),7);
assert(d.getElementById('pg3-stage').textContent.includes('二十'),'Teach 20');
forward();
assert.equal(step(),8);
assert(d.getElementById('pg3-next').disabled,'Cannot skip build 23');
for(const x of '二十三')control('[data-tile="'+x+'"]');
control('[data-check]');
assert(!d.getElementById('pg3-next').disabled,'Build 23 correctly unlocks Next');
forward();
assert.equal(step(),9);
const reviewTargets=['九','四','十二','二十三'];
for(const word of reviewTargets){
 control('[data-play="'+word+'"]');
 control('[data-answer="'+word+'"]');
}
assert.equal(step(),10,'Final test should open graduation');
assert(d.getElementById('pg3-stage').textContent.includes('4 из 4'),'First try score');
assert(d.getElementById('pg3-stage').textContent.includes('Урок 3 завершён'),'Graduation content');
const saved=JSON.parse(w.localStorage.getItem('pg-hsk1-v212-numbers'));
assert.equal(saved.completed,true);
assert.equal(saved.score,4);
assert.equal(saved.viewed[1].length,5);assert.equal(saved.viewed[2].length,5);
const done=JSON.parse(w.localStorage.getItem('pg-hsk1-v3-complete'));
assert(done.includes('numbers'),'Lesson 4 must unlock');
assert(done.includes('pronouns')&&done.includes('foundations'),'Prior completions retained');
assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk1-v203-pronouns')).step,7,'Lesson 2 progress unchanged');
assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk1-v189-lesson1')).step,13,'Lesson 1 progress unchanged');
assert(js.includes('yí ge píngguǒ'),'One apple should use contextual yí, not yī');
assert(js.includes("['èr shí sān','двадцать три']"),'23 correct pinyin');
assert(js.includes("['èr shí','двадцать']"),'20 correct pinyin');
dom.window.close();
console.log('PASS HSK1 lesson 3 v212: 10 complete scenes, 1–10 human audio, stroke writer 一二三, scored listening, 11/12/20/23 composition, 4/4 test, legacy progress preserved.');
