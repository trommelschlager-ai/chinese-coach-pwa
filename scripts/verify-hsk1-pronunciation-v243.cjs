'use strict';
/* Panda Go HSK1 pronunciation v243: compact page rendering, original audio and saved state. */
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('hsk1-pronunciation.html','utf8');
const js=fs.readFileSync('assets/hsk1-pronunciation-v243.js','utf8');
const css=fs.readFileSync('assets/hsk1-pronunciation-v243.css','utf8');
const data=JSON.parse(fs.readFileSync('assets/pinyin-reading-curriculum.json','utf8'));
assert.equal(data.clips.length,190,'190 corpus MP3 examples must exist');
assert.equal(data.rules.length,21,'21 pronunciation rules required');
assert(css.includes('lesson5-lilac-sakura-v225.svg'),'Approved scenery missing');
assert(css.includes('panda-go-approved-lesson5-v231.svg'),'Approved Panda Go mascot missing');
assert(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'),'Compact two-column grid required');
assert(css.includes('height:100dvh'),'Full-height screen, internal scroll required');
assert(html.includes('59 элементов пиньиня'),'Correct metric wording required');
assert(!html.includes('59 сочетаний'),'Do not mislabel pinyin elements');
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
 assert.equal(d.querySelectorAll('#trainer-content [data-combo]').length,13,'All 13 original combinations should be interactive');
 click('[data-combo="zi"]');
 await tick();
 assert(tracks.some(x=>/pinyin-combinations\/zi\.mp3$/.test(x)),'Original recorded zi must play');
 assert(/1 из 203/.test(d.getElementById('pr-progress').textContent),'Progress must record listening');
 click('[data-group="back"]');
 assert.equal(d.querySelectorAll('#trainer-content [data-combo]').length,3,'Zh/ch/sh group should include exactly three cards');
 click('[data-mode="syllables"]');
 assert.equal(d.querySelectorAll('.sound-card [data-audio-id]').length,12,'Large reading list must be paged');
 const firstPage=[...d.querySelectorAll('.sound-card [data-audio-id]')].map(x=>x.dataset.audioId);
 click('[data-page-next]');
 const secondPage=[...d.querySelectorAll('.sound-card [data-audio-id]')].map(x=>x.dataset.audioId);
 assert.equal(secondPage.length,12,'Next page should have 12 sound examples');
 assert(firstPage.every(x=>!secondPage.includes(x)),'Pagination must REPLACE tiles, not stretch page');
 let input=d.getElementById('syllable-search');input.value='xiǎo';input.dispatchEvent(new w.Event('input',{bubbles:true}));
 assert(d.querySelectorAll('.sound-card [data-audio-id]').length>0,'Pinyin search should find xiao');
 input.value='';input.dispatchEvent(new w.Event('input',{bubbles:true}));
 click('[data-letter="Z"]');
 assert(d.querySelectorAll('.sound-card [data-audio-id]').length>0,'Alphabet filter should work');
 click('[data-letter="Все"]');
 const collected=new Set();
 let loops=0;
 do{
   [...d.querySelectorAll('.sound-card [data-audio-id]')].forEach(x=>collected.add(x.dataset.audioId));
   const next=d.querySelector('[data-page-next]');
   if(!next||next.disabled)break;
   click('[data-page-next]');
 }while(++loops<30);
 assert.equal(collected.size,190,'Pagination must expose every one of the 190 MP3s');
 assert(d.querySelectorAll('.sound-card [data-audio-id]').length<=12,'Never render more than 12 cards per page');
 click('[data-letter="A"]');
 assert(d.querySelectorAll('.sound-card [data-audio-id]').length>0,'Letter A should still work');
 click('[data-audio-id="p001"]');
 await tick();
 assert(tracks.includes('./assets/pinyin-reading-v4/p001.mp3'),'Female-sample player should use correct existing file');
 click('[data-mode="tones"]');
 assert.equal(d.querySelectorAll('.rule').length,1,'One rule per screen prevents long scrolling');
 for(let i=0;i<20;i++)click('[data-rule-next]');
 assert(d.querySelector('.page-label')?.textContent.includes('21 / 21'),'All 21 rules must be reachable');
 assert.equal(d.querySelectorAll('.rule').length,1,'Rules must be paged, not stacked');
 click('[data-quiz="mā"]');
 assert(d.getElementById('quiz-feedback').textContent.includes('Верно'),'Tone quiz should advance after a correct answer');
 click('[data-quiz-next]');
 assert(d.getElementById('quiz-feedback').textContent.includes('Выбери'),'Next question should restart quiz');
 assert(d.querySelector('#record-start')&&d.querySelector('#record-replay').disabled,'Recorder must be preserved');
 click('#footer-next');
 assert(d.querySelector('#practice-dialog').open,'Bottom action must open voice-practice sheet');
 assert(d.querySelector('#practice-play').dataset.audioId,'Tone training sheet must have an audio sample');
 click('#practice-next');
 click('#practice-close');
 assert(!d.querySelector('#practice-dialog').open,'Practice sheet must close');
 const keys=Object.keys(w.localStorage);
 assert(keys.every(k=>!k.startsWith('pg-hsk1-v3-')),'Pronunciation tracking must not overwrite course progress');
 assert(keys.includes('pg-hsk1-pronunciation-v242'),'Practice progress must use its own key');
 console.log('PASS Panda Go pronunciation v243: compact two-column audio, paged 190 clips and 21 rules, tone quiz, working mic sheet, progress and HSK 1 route.');
}
run().catch(err=>{console.error(err);process.exitCode=1}).finally(()=>page.window.close());

