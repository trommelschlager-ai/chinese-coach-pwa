'use strict';
/* Panda Go HSK1 pronunciation v242: DOM, real clip existence, map routing and tone practice. */
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('hsk1-pronunciation.html','utf8');
const js=fs.readFileSync('assets/hsk1-pronunciation-v242.js','utf8');
const css=fs.readFileSync('assets/hsk1-pronunciation-v242.css','utf8');
const data=JSON.parse(fs.readFileSync('assets/pinyin-reading-curriculum.json','utf8'));
assert.equal(data.clips.length,190,'190 corpus MP3 examples must exist');
assert.equal(data.rules.length,21,'21 pronunciation rules required');
assert(css.includes('lesson5-lilac-sakura-v225.svg'),'Approved scenery missing');
assert(css.includes('panda-go-approved-lesson5-v231.svg'),'Approved Panda Go mascot missing');
assert(/13 сложных сочетаний/.test(html),'Intro should state its intended scope');
for(const c of data.clips){
 assert(/^p\d{3}$/.test(c.id),'Bad sample id '+c.id);
 assert(fs.existsSync('assets/pinyin-reading-v4/'+c.id+'.mp3'),'Missing MP3 '+c.id);
}
const combos=['zi','ci','si','zhi','chi','shi','ji','qi','xi','pai','bai','mai','nü'];
for(const unit of combos)assert(fs.existsSync('assets/pinyin-combinations/'+unit+'.mp3'),'Missing recorded combo '+unit);
const map=fs.readFileSync('hsk1-map.html','utf8');
assert(map.includes('href="./hsk1-pronunciation.html"'),'Checkpoint not linked from map');
assert.equal((map.match(/class="node(?: current)?"/g)||[]).length,7,'Existing seven lessons must remain');
assert(map.includes('hsk1-pronunciation-entry-v242.css?v=242'),'Map must load checkpoint style');
const l1=fs.readFileSync('assets/hsk1-first-v189.js','utf8');
assert(l1.includes('Четыре тона'),'Lesson 1 four tone page required');
assert(l1.includes('class="pg-pronunciation-inline"'),'Optional bridge after four tones missing');
const page=new JSDOM(html,{url:'https://example.test/chinese-coach-pwa/hsk1-pronunciation.html',runScripts:'outside-only'});
const w=page.window,d=w.document,tracks=[];
w.fetch=async()=>({ok:true,json:async()=>data});
w.Audio=function(src){
 this.src=src;this.pause=()=>{};this.play=()=>{tracks.push(src);return Promise.resolve()};
};
w.eval(js);
async function tick(){await new Promise(resolve=>setImmediate(resolve))}
function click(q){const b=d.querySelector(q);assert(b,'Missing control '+q);assert(!b.disabled,'Disabled control '+q);b.click();return b}
async function run(){
 await tick();
 assert.equal(d.querySelectorAll('[data-combo]').length,13,'All 13 original combinations should be interactive');
 click('[data-combo="zi"]');
 await tick();
 assert(tracks.some(x=>/pinyin-combinations\/zi\.mp3$/.test(x)),'Original recorded zi must play');
 assert(/1 из 203/.test(d.getElementById('pr-progress').textContent),'Progress must record listening');
 click('[data-group="back"]');
 assert.equal(d.querySelectorAll('[data-combo]').length,3,'Zh/ch/sh group should include exactly three cards');
 click('[data-mode="syllables"]');
 assert.equal(d.querySelectorAll('.sound-card [data-audio-id]').length,12,'Large reading list must be paged');
 click('[data-show-more]');
 assert.equal(d.querySelectorAll('.sound-card [data-audio-id]').length,24,'Load-more should expand content');
 let input=d.getElementById('syllable-search');input.value='xiǎo';input.dispatchEvent(new w.Event('input',{bubbles:true}));
 assert(d.querySelectorAll('.sound-card [data-audio-id]').length>0,'Pinyin search should find xiao');
 input.value='';input.dispatchEvent(new w.Event('input',{bubbles:true}));
 click('[data-letter="Z"]');
 assert(d.querySelectorAll('.sound-card [data-audio-id]').length>0,'Alphabet filter should work');
 click('[data-letter="Все"]');
 let more=0;while(d.querySelector('[data-show-more]')&&more++<30)click('[data-show-more]');
 assert.equal(d.querySelectorAll('.sound-card [data-audio-id]').length,190,'All 190 MP3 must be accessible');
 click('[data-audio-id="p001"]');
 await tick();
 assert(tracks.includes('./assets/pinyin-reading-v4/p001.mp3'),'Female-sample player should use correct existing file');
 click('[data-mode="tones"]');
 assert.equal(d.querySelectorAll('.rule').length,5,'Initially show concise rule list');
 click('[data-rules-more]');
 assert.equal(d.querySelectorAll('.rule').length,21,'All 21 rules must be accessible');
 click('[data-quiz="mā"]');
 assert(d.getElementById('quiz-feedback').textContent.includes('Верно'),'Tone quiz should advance after a correct answer');
 click('[data-quiz-next]');
 assert(d.getElementById('quiz-feedback').textContent.includes('Выбери'),'Next question should restart quiz');
 assert(d.querySelector('#record-start')&&!d.querySelector('#record-replay').disabled===false,'Recording controls should exist');
 const keys=Object.keys(w.localStorage);
 assert(keys.every(k=>!k.startsWith('pg-hsk1-v3-')),'Pronunciation tracking must not overwrite course progress');
 assert(keys.includes('pg-hsk1-pronunciation-v242'),'Practice progress must use its own key');
 console.log('PASS Panda Go pronunciation v242: 13 recorded combos, 190 MP3, 21 rules, search, 4-tone quiz, standalone progress, route and lesson-1 bridge.');
}
run().catch(err=>{console.error(err);process.exitCode=1}).finally(()=>page.window.close());
