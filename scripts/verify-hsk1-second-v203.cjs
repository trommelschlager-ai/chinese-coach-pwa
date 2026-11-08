'use strict';
/* Regression: new HSK1 lesson 2, 12 practice-led screens, save/restore and native voice. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('hsk1-second-v203.html','utf8');
const js=fs.readFileSync('assets/hsk1-second-v203.js','utf8');
const css=fs.readFileSync('assets/hsk1-second-v203.css','utf8');
const map=fs.readFileSync('hsk1-map.html','utf8');
const native=fs.readFileSync('assets/hsk1-native-human-map-v167.js','utf8');
const voices=fs.readFileSync('assets/hsk1-voices-map-v160.js','utf8');
assert(html.includes('hsk1-first-v189.css?v=194'),'Keep first lesson approved visual style');
assert(html.includes('hsk1-second-v203.js?v=207'),'Second lesson JS version');
assert(html.includes('hsk1-second-v203.css?v=207'),'Second lesson CSS version');
assert(map.includes('data-num="2" href="./hsk1-second-v203.html"'),'Map must open new lesson');
assert(css.includes('.pg3-word')&&css.includes('.pg3-answers'),'Mobile practice layout');
assert(!js.includes('不是'), 'Move negative sentence grammar to later lesson');
assert(!js.includes('他们'), 'Extra third-person plural moves to future lesson');
const d=new JSDOM(html,{url:'https://example.test/chinese-coach-pwa/hsk1-second-v203.html',runScripts:'outside-only'});
const w=d.window,doc=w.document;
w.eval(native);w.eval(voices);
const lessonWords=['我','你','他','她','我们','你们','老师','吗','学生','是'];
for(const hz of lessonWords){
 const file=w.PANDA_HSK1_NATIVE_HUMAN_V167[hz];
 assert(file&&fs.existsSync(file.slice(2)),'Missing licensed native clip '+hz);
}
for(const phrase of ['我是老师。','你是老师吗？']){
 assert(w.PANDA_HSK1_VOICES.female[phrase],'Missing female sample '+phrase);
}
assert(w.PANDA_HSK1_VOICES.male['你是老师吗？'],'Missing male dialogue sample');
w.Audio=function(src){this.src=src;this.pause=()=>{};this.play=()=>{this.onplaying?.();return Promise.resolve()}};
w.localStorage.setItem('pg-hsk1-v3-pronouns',JSON.stringify({step:5,completed:false,wordIndex:9}));
w.localStorage.setItem('pg-hsk1-v202-pronouns-preview',JSON.stringify({step:12,listenIndex:4}));
w.eval(js);
const step=()=>Number(doc.getElementById('pg-counter').textContent.split('/')[0]);
const click=(selector)=>{
 const el=doc.querySelector(selector);
 assert(el,'Missing control '+selector+' at step '+step());
 el.click();
};
const answer=(i)=>click('[data-answer="'+i+'"]');
const proceed=()=>{
 assert(!doc.getElementById('pg-next').disabled,'Next should unlock at '+step());
 doc.getElementById('pg-next').click();
};
assert.equal(step(),1);
assert(doc.getElementById('pg-next').disabled,'Cannot skip initial review');
answer(1);proceed(); // step 2: he/she
answer(1);proceed(); // step 3: distinguish
for(const a of [2,1,1])answer(a);
proceed(); // step 4: plural
answer(1);answer(1);proceed(); // step 5 listening: plural and respectful singular 您
assert(doc.querySelector('[data-audio="我们"]'),'Must have actual listening sample');
for(const a of [2,3,0,2])answer(a);
proceed(); // step 6 example
answer(0);proceed(); // step 7 3 builds
for(let exercise=0;exercise<3;exercise++){
 assert(doc.getElementById('pg-next').disabled,'Cannot skip sentence build');
 for(const i of [0,1,2])click('[data-add="'+i+'"]');
 click('[data-check-build]');
}
proceed(); // step 8 particle
answer(2);proceed(); // step 9 2 questions build
for(let exercise=0;exercise<2;exercise++){
 for(const i of [0,1,2,3])click('[data-add="'+i+'"]');
 click('[data-check-build]');
}
proceed(); // step 10 conversation
for(const a of [0,1])answer(a);
proceed(); // step 11 speak
assert(doc.getElementById('pg-next').disabled,'Speaking requires listen and confirm');
assert(doc.querySelector('[data-spoken]').disabled,'Speak confirmation initially disabled');
click('[data-audio="你是老师吗？"]');
assert(!doc.querySelector('[data-spoken]').disabled,'Real audio playback unlocks speaking confirmation');
click('[data-spoken]');proceed(); // step 12 final
assert.equal(step(),12);
answer(1); // intentionally wrong first attempt
assert(doc.getElementById('pg-next').hidden,'Final step uses a Finish button rather than skipping');
for(const a of [0,2,0,1,1])answer(a);
assert(doc.querySelector('[data-review-answer]'),'Missed questions must be repeated');
click('[data-review-answer="0"]');
assert(doc.querySelector('[data-finish]'),'Complete after correct review of mistakes');
click('[data-finish]');
assert(doc.getElementById('pg-content').textContent.includes('Ты уже говоришь по-китайски'),'Completion page shown');
assert.equal(doc.querySelectorAll('[data-review-one]').length,16,'Review includes 16 single words and phrases');
assert(doc.getElementById('pg-content').textContent.includes('您'),'Polite pronoun must be visible in recap');
assert(doc.getElementById('pg-content').textContent.includes('是的，我是老师。'),'Full positive reply should be included');
assert(doc.querySelector('[data-review-all]'),'Two-repeat listening action must be present');
assert(doc.querySelector('[data-review-stop]'),'Review must be stoppable');
const progress=JSON.parse(w.localStorage.getItem('pg-hsk1-v203-pronouns'));
assert.equal(progress.completed,true);
assert.equal(progress.finalFirstTry,4,'One missed first attempt');
assert.equal(progress.finalWrong.length,1,'Only the mistaken question should require review');
const legacy=JSON.parse(w.localStorage.getItem('pg-hsk1-v3-pronouns'));
assert.equal(legacy.step,5,'Old second lesson progress must remain unchanged');
assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk1-v202-pronouns-preview')).step,12,'v202 preview must not be lost');
assert(JSON.parse(w.localStorage.getItem('pg-hsk1-v3-complete')).includes('pronouns'),'Next HSK1 lesson unlocked');
d.window.close();
console.log('PASS HSK1 v207: 12 screens, respectful singular 您, 16 bilingual audio-review entries, speaking practice, mistake replay, legacy progress preserved.');
