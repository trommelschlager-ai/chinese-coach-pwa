'use strict';
/* Panda Go v297: consistent final navigation in all seven HSK1 lessons and properly
   aligned male/female speaker portraits with genuinely distinct audio sources. */
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8');
const style=read('assets/hsk1-finish-buttons-v296.css');
for(const [styleClass,label,expected] of [
 ['pg-end-repeat','pink','#f6bfd9'],
 ['pg-end-next','lavender','#dec9f9'],
 ['pg-end-back','light blue','#cfeaff']
]){
 assert(style.includes('.'+styleClass),'Missing '+label+' completion button');
 assert(style.includes(expected),'Wrong '+label+' completion button color');
}
assert(style.includes('flex-direction:column'),'Completion buttons must be stacked');
const pages=[
['hsk1-first-v189.html','hsk1-first-v189.js?v=300','assets/hsk1-first-v189.js','./hsk1-second-v203.html'],
['hsk1-second-v203.html','hsk1-second-v203.js?v=322','assets/hsk1-second-v203.js','./hsk1-third-v212.html'],
['hsk1-third-v212.html','hsk1-third-v213.js?v=296','assets/hsk1-third-v213.js','./hsk1-fourth-v214.html'],
['hsk1-fourth-v214.html','hsk1-fourth-v220.js?v=296','assets/hsk1-fourth-v220.js','./hsk1-fifth-v227.html'],
['hsk1-fifth-v227.html','hsk1-fifth-v227.js?v=296','assets/hsk1-fifth-v227.js','./hsk1-family-v231.html'],
['hsk1-family-v231.html','panda-go-companion-v231.js?v=296','assets/panda-go-companion-v231.js','./hsk1-weather-v231.html'],
['hsk1-weather-v231.html','panda-go-companion-v231.js?v=296','assets/panda-go-companion-v231.js','./hsk1-diagnostic.html']
];
for(const [page,version,codePath,next] of pages){
 const html=read(page),js=read(codePath);
 assert(html.includes('hsk1-finish-buttons-v296.css?v=296'),page+' missing shared completion styles');
 assert(html.includes(version),page+' not loading current navigation code');
 new vm.Script(js,{filename:codePath});
 assert(js.includes('pg-lesson-complete-actions'),page+' missing navigation group');
 assert(js.includes('pg-end-repeat')&&js.includes('pg-end-next')&&js.includes('pg-end-back'),page+' missing an action class');
 assert(js.includes(next),page+' incorrect next destination');
}
const first=read('assets/hsk1-first-v189.js');
assert(first.includes("'👩','你好！'")&&first.includes("'👩','我是学生。'"),'Panda placeholders must become human female speakers');
assert(first.includes('lesson4-dialog-v282/woman.webp')&&first.includes('lesson4-dialog-v282/man.webp'),'Human portrait assets missing');
assert(first.includes('hsk1-voices-v156/ca2a36b2097b5a6321a2.mp3?v=300'),'Second greeting must default to unprocessed male voice');
assert(!first.includes("['🐼'"),'Old panda avatar remains in first lesson dialogue');
const sound=fs.readFileSync('assets/hsk1-voices-v156/ca2a36b2097b5a6321a2.mp3');
assert(sound.length>5000,'Existing natural male dialogue MP3 is missing or unexpectedly small');
const helloHtml=read('hsk1-first-v189.html');
const d=new JSDOM(helloHtml,{url:'https://panda.test/hsk1-first-v189.html',runScripts:'outside-only'});
const w=d.window,dom=d.window.document;
const played=[];
w.Audio=function(src){this.src=src;this.pause=()=>{};this.play=()=>{played.push(src);return Promise.resolve()};};
w.PANDA_HSK1_VOICES={male:{'你好！':'./assets/old-high-voice.mp3'},female:{'你好！':'./assets/female-hello.mp3'}};
w.localStorage.setItem('pg-hsk1-v189-lesson1',JSON.stringify({step:12,verified:true,lessonVersion:295}));
w.eval(read('assets/hsk1-radicals-v295.js'));
w.eval(read('assets/hsk1-first-extras-v295.js'));
w.eval(first);
assert.equal(dom.querySelectorAll('.dialogue-line img.pg-dialogue-woman').length,2,'Both female lines should show woman avatar');
assert.equal(dom.querySelectorAll('.dialogue-line img.pg-dialogue-man').length,1,'Male line should show man avatar');
dom.querySelector('[data-role="male"]').click();
assert.equal(played.at(-1),'./assets/hsk1-voices-v156/ca2a36b2097b5a6321a2.mp3?v=300','Clicking man should play original pitch male voice');
dom.querySelector('[data-role="female"]').click();
assert.notEqual(played.at(-1),played.at(-2),'Female and male greetings must not share the same recording');
w.close();
const v=JSON.parse(read('assets/offline-pack.json'));
assert(v.version>=300&&v.files.includes('./assets/hsk1-voices-v156/ca2a36b2097b5a6321a2.mp3?v=300'));
console.log('PASS HSK1 v298: seven lesson completion colors and destinations, real female portrait, natural distinct male greeting, offline audio');
