'use strict';
/* Lesson1 v295: test four user-requested changes as actual DOM interactions. */
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('hsk1-first-v189.html','utf8');
const read=x=>fs.readFileSync(x,'utf8');
const radical=read('assets/hsk1-radicals-v295.js');
const extras=read('assets/hsk1-first-extras-v295.js');
const main=read('assets/hsk1-first-v189.js');
for(const [p,s] of [['radicals',radical],['extras',extras],['lesson1',main]])new vm.Script(s,{filename:p});
assert(html.indexOf('hsk1-radicals-v295.js')<html.indexOf('hsk1-first-extras-v295.js'));
assert(html.indexOf('hsk1-first-extras-v295.js')<html.indexOf('hsk1-first-v189.js'));
assert(html.includes('aria-valuemax="16"'));
assert(read('hsk1-map.html').includes('16 экранов'));
const make=(saved)=>{
 const dom=new JSDOM(html,{url:'https://panda.test/chinese-coach-pwa/hsk1-first-v189.html',runScripts:'outside-only'});
 const w=dom.window;const played=[];
 w.Audio=function(src){this.src=src;this.pause=()=>{};this.play=()=>{played.push(src);return Promise.resolve();}};
 w.PANDA_HSK1_VOICES={female:{'你好！':'./assets/female-hello.mp3'},male:{'你好！':'./assets/hsk1-voices-v156/ca2a36b2097b5a6321a2.mp3'}};
 if(saved)w.localStorage.setItem('pg-hsk1-v189-lesson1',JSON.stringify(saved));
 w.eval(radical);w.eval(extras);w.eval(main);
 return {w,dom,d:w.document,played};
};
{
 const {w,d,dom}=make();
 assert.equal(w.PANDA_HSK1_RADICALS_V295.all.length,214);
 assert.equal(w.PANDA_HSK1_RADICALS_V295.all[37].hz,'女');
 assert.equal(w.PANDA_HSK1_RADICALS_V295.all[38].hz,'子');
 d.querySelector('#pg-next').click();d.querySelector('#pg-next').click();
 assert(d.querySelectorAll('[data-radical]').length===2,'Teach only two parts of 好 up front');
 assert(d.querySelector('.pg-all-radicals'),'Complete catalog should appear below 好');
 assert.equal(d.querySelectorAll('[data-catalog-select]').length,18,'Radicals paginated on phones');
 let input=d.getElementById('pg-radical-search');input.value='вода';input.dispatchEvent(new w.Event('input',{bubbles:true}));
 assert([...d.querySelectorAll('[data-catalog-select]')].some(x=>x.textContent.includes('水')),'Find water radical by Russian word');
 input.value='';input.dispatchEvent(new w.Event('input',{bubbles:true}));
 d.querySelector('[data-catalog-page="1"]').click();
 assert(d.querySelector('[data-catalog-select="19"]'),'Second page must contain more keys');
 for(let n=0;n<3;n++)d.querySelector('#pg-next').click();
 assert(d.querySelector('.big-hanzi').textContent==='是','Arrive at 是 before grammar');
 d.querySelector('#pg-next').click();
 assert(d.querySelector('.pg-shi-grammar'),'Grammar page inserted directly after 是');
 assert(d.querySelector('.pg-shi-grammar').textContent.includes('I am a student'));
 assert(d.querySelector('.pg-shi-grammar').textContent.includes('Я студент'));
 assert(d.getElementById('pg-counter').textContent.includes('/ 16'));
 d.querySelector('#pg-next').click();
 assert(d.querySelector('.pg-pronunciation-frame'),'All sound recordings must be embedded in the 4-tone screen');
 assert(d.querySelector('.pg-pronunciation-frame').src.includes('hsk1-pronunciation.html?embedded=1'));
 dom.window.close();
}
{
 const {w,d,dom,played}=make({step:11,lessonVersion:195,verified:true});
 assert(d.getElementById('pg-counter').textContent.includes('13 / 16'),'Legacy 12th screen moves to 13th, preserving location');
 const male=d.querySelector('.dialogue-line:nth-child(2) [data-role="male"]');
 assert(male&&!male.disabled,'Second 你好 should have male recorded audio');
 assert(d.querySelector('.dialogue-line:nth-child(2) img.pg-dialogue-man'),'Second greeting should show actual male portrait');
 male.click();
 assert.equal(played.at(-1),'./assets/hsk1-voices-v156/ca2a36b2097b5a6321a2.mp3','Male 你好 must not use female Xiaoxiao clip');
 const female=d.querySelector('.dialogue-line:first-child [data-role="female"]');female.click();
 assert.notEqual(played.at(-1),'./assets/hsk1-voices-v156/ca2a36b2097b5a6321a2.mp3');
 assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk1-v189-lesson1')).lessonVersion,295);
 dom.window.close();
}
{
 const {w,d,dom}=make({step:14,lessonVersion:195,verified:true,listenPassed:true});
 assert(d.getElementById('pg-counter').textContent.includes('16 / 16'),'Old fully completed lesson should remain finished');
 assert(w.localStorage.getItem('pg-hsk1-v189-lesson1').includes('"lessonVersion":295'));
 dom.window.close();
}
const embed=read('hsk1-pronunciation.html');
assert(embed.includes("get('embedded')==='1'")&&embed.includes('.pg-embedded-pronunciation .topbar'));
assert(embed.includes('hsk1-pronunciation-v244.js?v=250'),'Existing 203 sound trainer reused, not replaced with new recordings');
console.log('PASS lesson1 v295: 214 radicals, search and paging, sound library, 是 grammar, male 你好, migrated 15-screen progress');
