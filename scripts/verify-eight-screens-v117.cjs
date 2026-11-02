// Regression checks for the user-approved eight-screen cleanup (v117).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8');
const dom=new JSDOM(html,{url:'https://example.test/chinese-coach-pwa/#menu',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;
w.scrollTo=()=>{};
w.HTMLElement.prototype.scrollIntoView=()=>{};
w.matchMedia=()=>({matches:true});
w.URL.createObjectURL=()=>{};
w.speechSynthesis={getVoices:()=>[],cancel(){},speak(utterance){utterance.onend?.()}};
w.SpeechSynthesisUtterance=function(text){this.text=text};
w.Audio=function(){this.play=()=>{this.onended?.();return Promise.resolve()};this.pause=()=>this.onpause?.()};
const scripts=[...d.scripts].map(s=>s.src?fs.readFileSync(decodeURI(new URL(s.src).pathname.replace('/chinese-coach-pwa/','')),'utf8'):s.textContent).join('\n').replace("'use strict';",'');
w.eval(scripts);

// Photo 1: No redundant prompt, correct DOM order, next action remains reachable.
const quiz=d.getElementById('quiz');
assert(!quiz.textContent.includes('Что означает это слово?'));
const kids=[...quiz.querySelector('.quiz-word-card').children];
assert(kids.indexOf(d.getElementById('quizhanzi'))<kids.indexOf(d.getElementById('quizpinyin')));
assert(kids.indexOf(d.getElementById('quizpinyin'))<kids.indexOf(d.getElementById('quizplay')));
assert.equal(d.getElementById('nextq').textContent,'Дальше');
let toggle=d.getElementById('quiz-pinyin-toggle');
toggle.click();
assert.equal(toggle.getAttribute('aria-pressed'),'false');
assert(d.getElementById('quizpinyin').hidden);
assert.equal(w.localStorage.getItem('chinese-coach-show-pinyin'),'false');
toggle.click();
assert.equal(toggle.getAttribute('aria-pressed'),'true');
assert(!d.getElementById('quizpinyin').hidden);
assert.equal(w.localStorage.getItem('chinese-coach-show-pinyin'),'true');
d.querySelector('#quizopts button').click();
assert.equal(d.getElementById('nextq').textContent,'Дальше');

// Photo 2: Daily-study progress exists ONLY inside the home menu, never above games.
const daily=d.getElementById('daily-study-progress');
assert(daily);
assert(d.getElementById('launch-menu').contains(daily));
assert.notEqual(d.body.firstElementChild,daily);

// Photos 3-4: Vocabulary starts at search, no lengthy banner, all groups remain.
w.openLearningTopics('words');
assert.equal(d.querySelectorAll('[data-clean-category]').length,13);
assert(d.querySelector('#clean-word-search'));
assert(!d.querySelector('.clean-word-summary'));
assert(!d.querySelector('.clean-section-head p'));
assert(d.querySelector('[data-clean-category="g02"] .clean-category-icon').textContent.includes('🧭'));

// Photos 5-6: real answer/listen buttons, no repeating explanation banner.
w.openPracticeChoices();
d.querySelector('[data-practice-mode="translation"]').click();
assert(!d.querySelector('.clean-section-head p'));
assert.equal(d.querySelectorAll('[data-choice-ru]').length,4);
d.querySelector('[data-choice-ru]').click();
assert(d.querySelector('.clean-practice-feedback').textContent);
w.openPracticeChoices();
d.querySelector('[data-practice-mode="listening"]').click();
assert(d.querySelector('[data-practice-listen]'));
assert(d.querySelector('[data-practice-next]'));

// Photo 8: Pinyin visibility persists across paginated dialogues.
w.openLearningTopics('dialogues');
d.querySelector('[data-dialog-lesson="2"]').click();
let button=d.querySelector('[data-dialogue-pinyin]');
assert(button);
assert.equal(button.getAttribute('aria-pressed'),'true');
const before=d.querySelectorAll('.ch110-line').length;
button.click();
assert.equal(button.getAttribute('aria-pressed'),'false');
assert(d.querySelector('.ch110-dialogue').classList.contains('ch110-pinyin-off'));
assert.equal(w.localStorage.getItem('chinese-coach-show-pinyin'),'false');
d.querySelector('[data-110-next]').click();
assert(d.querySelector('.ch110-dialogue').classList.contains('ch110-pinyin-off'));
assert.equal(d.querySelectorAll('.ch110-line').length,before);
assert(d.querySelector('[data-dialogue-line]'));
d.querySelector('[data-dialogue-pinyin]').click();
assert(!d.querySelector('.ch110-dialogue').classList.contains('ch110-pinyin-off'));

// Photo 7: live writing canvas and stroke controls must still exist.
const hanzi=fs.readFileSync('hanzi-lab.html','utf8');
for(const id of ['writer','practice','animate','retry','next','character-tabs'])assert(hanzi.includes('id="'+id+'"'),id);
assert(hanzi.includes('HanziWriter.create('));
assert(hanzi.includes('class="visually-hidden"'));
assert(hanzi.indexOf('class="character-picker"')>hanzi.indexOf('id="writer"'));

// Versioned script and cache references must match.
const sw=fs.readFileSync('sw.js','utf8');
assert(sw.includes('chinese-coach-pwa-v117'));
for(const file of ['index.html','game.html'])assert(fs.readFileSync(file,'utf8').includes('approved-mobile-v112.css?v=117'));
console.log('v117 checks passed: quiz/pinyin, compact words, listening/translation, daily banner, dialogues and live writing.');
w.close();
