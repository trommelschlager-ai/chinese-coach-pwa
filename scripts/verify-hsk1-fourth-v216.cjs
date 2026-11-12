'use strict';
/* Panda Go HSK1 lesson 4 v215 regression.
 * Validates content, 13 real screens, replay, wrong-answer scoring, speech end
 * gating, 4-stroke writing, calendar boundaries, 2-role chat and legacy
 * progress. Real MP3 noise, native-tone quality & visual Android QA are NOT
 * verified by these mocks.
 */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('hsk1-fourth-v214.html','utf8');
const app=fs.readFileSync('assets/hsk1-fourth-v220.js','utf8');
const css=fs.readFileSync('assets/hsk1-fourth-v219.css','utf8');
const native=fs.readFileSync('assets/hsk1-native-human-map-v167.js','utf8');
const voice=fs.readFileSync('assets/hsk1-weekdays-audio-map-v214.js','utf8');
const xiaoxiao=fs.readFileSync('assets/lesson4-xiaoxiao-v265.js','utf8');
const map=fs.readFileSync('hsk1-map.html','utf8');
assert(html.includes('hsk1-fourth-v219.css?v=282'));
assert(html.includes('hsk1-fourth-v220.js?v=282'));
assert(html.includes('panda-clean-audio-v250.js?v=250'),'Improved woman clips not loaded');
assert(!html.includes('hsk1-third-v212.css'),'Lesson 4 should not depend on lesson 3 CSS');
assert(!html.includes('hsk1-third-v213.css'),'Lesson 4 styles should be standalone');
assert(html.includes('hanzi-writer.min.js'),'Stroke-writing library required');
assert(fs.existsSync('assets/panda-guide-v215.svg'));
const mascot=fs.readFileSync('assets/panda-guide-v215.svg','utf8');
assert(mascot.includes('наушниках')&&!mascot.includes('соломенной')&&!mascot.includes('рюкзак'));
assert(css.includes('.pg4-final-score')&&css.includes('.pg4-sunday-pair'));
assert(!css.includes('lesson5-lilac-sakura-v225.svg')&&!css.includes("background:url('./lesson4-reference-v216/sakura-left.webp')"),'Remove decorative lesson backgrounds');
assert(css.includes('background:linear-gradient(180deg,#ff929e,#f16c83)'),'Play buttons must be light coral');
assert(css.includes('color:#20202a'),'Back button must be white with dark text');
assert(css.includes('background:linear-gradient(180deg,#bb8af0'),'Next button should use brighter purple');
assert(app.includes('pg4-dialog-pinyin')&&app.includes('Девушка спрашивает'),'New dialogue layout should retain live text and pinyin');
assert(!app.includes('pg4-dialog-portrait'),'No cropped inline face overlays');
assert(map.includes('data-num="4" href="./hsk1-fourth-v214.html"'));
assert(!app.includes('speechSynthesis.speak('),'No random system TTS');
assert(app.includes('二 èr — четвёртый тон'),'Erroneous 2nd-tone label must be removed');
assert(!app.includes('二 èr — второй тон'));
assert(app.includes('星期日')&&app.includes('星期天'));
assert(app.includes('今天是星期五。'),'link previous lesson 是');
assert(app.includes('acceptBackwardsStrokes:false'),'Writing stroke order must be checked');
const dom=new JSDOM(html,{url:'https://panda.test/chinese-coach-pwa/hsk1-fourth-v214.html',runScripts:'outside-only'});
const w=dom.window,d=w.document;
const previous={
  v214:JSON.stringify({step:12,done:true,firstTry:5,heardWords:[]}),
  lesson2:JSON.stringify({step:8,completed:true}),
  lesson3:JSON.stringify({step:13,done:true}),
  done:JSON.stringify(['foundations','pronouns','numbers','weekdays'])
};
w.localStorage.setItem('pg-hsk1-v214-weekdays',previous.v214);
w.localStorage.setItem('pg-hsk1-v203-pronouns',previous.lesson2);
w.localStorage.setItem('pg-hsk1-v213-numbers',previous.lesson3);
w.localStorage.setItem('pg-hsk1-v3-complete',previous.done);
w.eval(native);w.eval(voice);w.eval(xiaoxiao);w.PANDA_HSK1_VOICES={male:{'明天星期六。':'./assets/hsk1-voices-v156/ecb56237b96af780f69e.mp3'}};
const played=[],utt=[];
w.Audio=function(file){
 this.src=file;this.pause=()=>{};this.play=()=>{played.push(this);return Promise.resolve()};
};
w.speechSynthesis={cancel(){},getVoices(){return [{name:'Microsoft Yunxi',lang:'zh-CN'},{name:'Microsoft Xiaoxiao',lang:'zh-CN'}]},speak(u){utt.push(u);u.onend?.()}};
w.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
const strokes=[];
w.HanziWriter={create(id,character,options){
 strokes.push({character,options});
 return {cancelQuiz(){},animateCharacter(){},quiz({onComplete}){onComplete()}};
}};
w.eval(app);
const step=()=>Number(d.getElementById('pg3-count').textContent.split(' ')[0]);
const click=sel=>{
 const b=d.querySelector(sel);
 assert(b,'Missing '+sel+' on screen '+step());
 assert(!b.disabled,'Disabled '+sel+' on screen '+step());
 b.click();return b;
};
const play=(word)=>{
 click('[data-play="'+word+'"]');
 const rec=played.at(-1);
 assert(rec,'No audio played '+word);
 assert(rec.src.includes('.mp3'),'Unexpected recorded audio '+word);
 assert.equal(typeof rec.onended,'function');
 rec.onended();
};
const next=()=>click('#pg3-next');
assert.equal(step(),1,'Old lesson completion should not skip new curriculum');
assert(d.querySelector('img[src="./assets/lesson4-v269/cover.webp"]'),'Approved raster mascot');
assert(d.querySelector('.pg4-cover h2')?.textContent.includes('Дни недели'),'Approved intro must introduce weekdays');
next();assert.equal(step(),2);
for(const word of ['星期一','星期二','星期三']){
 click('[data-learn="'+word+'"]');
 assert(d.getElementById('pg3-next').disabled,'Do not skip before all three recordings finish');
 played.at(-1).onended();
}
next();assert.equal(step(),3);
for(const word of ['星期四','星期五','星期六']){click('[data-learn="'+word+'"]');played.at(-1).onended();}
next();assert.equal(step(),4);
assert(d.getElementById('pg3-stage').textContent.includes('星期天'));
assert(d.getElementById('pg3-stage').textContent.includes('星期日'));
click('[data-sun-answer="星期七"]');assert(!d.getElementById('pg3-next').disabled);
next();assert.equal(step(),5);
const seven=[
 ['星期一','星期一'],['星期二','星期二'],['星期三','星期三'],
 ['星期四','星期四'],['星期五','星期五'],['星期六','星期六'],
 ['星期日','星期日']
];
for(let i=0;i<seven.length;i++){
 const [audio,right]=seven[i];
 assert(d.querySelector('[data-listening-answer]').disabled,'Audio gate must wait for completion');
 play(audio);
 click('[data-listening-answer="'+right+'"]');
 assert(d.querySelector('.pg4-feedback.correct'),'Correct answer should retain readable feedback');
 click('[data-next-item]');
}
assert.equal(step(),6);
for(const word of ['今天','明天','昨天']){click('[data-time="'+word+'"]');played.at(-1).onended()}
next();assert.equal(step(),7);
assert(d.getElementById('pg3-stage').textContent.includes('今天是星期五。'));
click('[data-grammar-answer="今天星期几？"]');next();assert.equal(step(),8);
for(const answer of ['星期天','星期四','星期一','星期五']){
 click('[data-calendar-answer="'+answer+'"]');click('[data-next-item]');
}
assert.equal(step(),9);
assert.equal(strokes.at(-1)?.character,'日');
assert.equal(strokes.at(-1)?.options.acceptBackwardsStrokes,false);
click('[data-trace]');next();assert.equal(step(),10);
assert(d.querySelector('img[src="./assets/lesson4-dialog-v282/man.webp"]'),'Male character in dialogue');
assert(d.querySelector('img[src="./assets/lesson4-dialog-v282/woman.webp"]'),'Female character in dialogue');
for(const answer of ['明天星期六。']){
 assert.equal(d.querySelectorAll('.pg4-dialog-actions button').length,1,'Dialogue must have one listen/pause control');
 click('[data-dialogue-toggle]');const questionPlayer=played.at(-1);
 assert(d.querySelector('[data-dialogue-toggle]').textContent.includes('Пауза'),'Playing button becomes Pause');
 click('[data-dialogue-toggle]');assert(d.querySelector('[data-dialogue-toggle]').textContent.includes('Продолжить'),'Pause must work');
 click('[data-dialogue-toggle]');assert(d.querySelector('[data-dialogue-toggle]').textContent.includes('Пауза'),'Resume must work');
 questionPlayer.onended();assert(d.querySelector('.from-m.active'),'Reply highlights visible dialogue bubble');
 assert(played.at(-1).src.includes('hsk1-voices-v156/ecb56237'),'Male avatar must use actual male recording');
 played.at(-1).onended();assert(d.querySelector('[data-dialogue-toggle]').textContent.includes('Слушать'),'Replay restored after dialogue ends');
 assert.equal(utt.length,0,'Dialogue never falls back to TTS');
 click('[data-dialog-answer="'+answer+'"]');
 // Regression: previously the completed counter was incorrectly used as dialogue index.
 const beforeReplay=played.length;
 click('[data-dialogue-toggle]');
 assert.equal(played.length,beforeReplay+1,'Completed dialogue must restart the female question');
 assert.equal(played.at(-1).src,'./assets/lesson4-xiaoxiao-v265/015.mp3','Replay must use Xiaoxiao');
 played.at(-1).onended();
 assert(played.at(-1).src.includes('hsk1-voices-v156/ecb56237'),'Replay must continue with the male voice');
 played.at(-1).onended();
 click('[data-next-item]');
}
assert.equal(step(),11);
const targets=[['今天','星期','五'],['明天','星期','六'],['昨天','星期','二']];
for(const parts of targets){
 for(const x of parts){
  const tile=Array.from(d.querySelectorAll('[data-tile]')).find(el=>!el.disabled&&el.textContent.trim()===x);
  assert(tile,'Tile missing '+x+' at step '+step());
  tile.click();
 }
 click('[data-check-tiles]');
 assert(d.querySelector('.pg4-feedback.correct'),'Completed sentence must be celebrated before moving');
 click('[data-next-item]');
}
assert.equal(step(),12);
const answers=[
 '星期一','星期六','星期天 и 星期日','星期四','завтра',
 '今天星期几？','星期一','вчера','星期二','明天星期六。'
];
for(let i=0;i<answers.length;i++){
 if(i===3)play('星期四');
 if(i===8)play('星期二');
 // Deliberately miss exam questions 1 and 4 to test score and review.
 const wrong=i===0?'星期二':i===3?'星期三':null;
 click('[data-exam-answer="'+(wrong||answers[i])+'"]');
 if(wrong)assert(d.querySelector('.pg4-feedback.incorrect'),'Exam must show wrong feedback and lock answer');
 if(i===3){play('星期四');assert([...d.querySelectorAll('[data-exam-answer]')].every(b=>b.disabled),'Replaying exam audio must preserve locked answers');}
 click('[data-next-item]');
}
assert.equal(step(),13);
assert(d.querySelector('.pg4-final-score')?.textContent.includes('8 / 10'));
assert(d.querySelector('.pg4-mistakes')?.textContent.includes('Что повторить: 2'));
assert(d.getElementById('pg3-stage').textContent.includes('Прошлый результат версии v214: 5 из 7'));
assert(d.querySelector('.pg4-dictionary')&&d.querySelectorAll('.pg4-dict-line').length>=15);
assert(d.querySelector('a[href="./hsk1-lesson.html?lesson=5"]'));
const saved=JSON.parse(w.localStorage.getItem('pg-hsk1-v215-weekdays'));
assert.equal(saved.done,true);
assert.equal(saved.legacyScore,5);
assert.equal(saved.examAnswers[0].correct,false);
assert.equal(saved.examAnswers[3].correct,false);
assert.equal(w.localStorage.getItem('pg-hsk1-v214-weekdays'),previous.v214,'Old fourth lesson progress untouched');
assert.equal(w.localStorage.getItem('pg-hsk1-v203-pronouns'),previous.lesson2);
assert.equal(w.localStorage.getItem('pg-hsk1-v213-numbers'),previous.lesson3);
assert.deepEqual(JSON.parse(w.localStorage.getItem('pg-hsk1-v3-complete')),JSON.parse(previous.done));
// Audio normalization and replay safety are behavior, not just source assertions.
assert(played.every(p=>p.volume>0&&p.volume<=1),'Per-file levels remain valid');
assert.equal(utt.length,0,'No system voice is used anywhere in the full lesson');
assert.equal(d.getElementById('pg3-next').hidden,false,'Result keeps persistent map navigation');
click('[data-review-mistakes]');
assert.equal(step(),12);
for(const answer of ['星期一','星期四']){
 if(answer==='星期四')play('星期四');
 click('[data-exam-answer="'+answer+'"]');click('[data-next-item]');
}
assert.equal(step(),13);
assert(d.querySelector('.pg4-final-score')?.textContent.includes('8 / 10'),'Retake must preserve original first-try score');
click('[data-restart]');assert.equal(step(),1);
assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk1-v215-weekdays')).legacyDone,true);
// Existing v215 learners resume their current screen and retain prior answers.
const resume=new JSDOM(html,{url:'https://resume.test/',runScripts:'outside-only'});
resume.window.localStorage.setItem('pg-hsk1-v215-weekdays',JSON.stringify({step:5,maxStep:8,heardTimes:['今天'],examAnswers:{0:{correct:false,given:'星期二'}}}));
resume.window.eval(app);
assert(resume.window.document.querySelector('#pg3-count').textContent.startsWith('6 /'),'Existing fourth lesson position resumes');
assert.deepEqual(JSON.parse(resume.window.localStorage.getItem('pg-hsk1-v215-weekdays')).heardTimes,['今天']);
resume.window.close();
dom.window.close();
console.log('PASS HSK1 lesson4 v216: fully integrated 13-screen responsive standalone weekday course, 7 listening items, Sunday, tone corrections, calendar, 日 handwriting, 2-role dialogue, 3 compositions, 10-question final, targeted error review, legacy progress.');
