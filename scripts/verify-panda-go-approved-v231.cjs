'use strict';
/* Panda Go v231: real 14-screen family and weather lessons, original voice mapping,
   no erased legacy progress. This checks DOM interactions, not Mandarin audio quality. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),vm=require('node:vm');
const source=fs.readFileSync('assets/panda-go-companion-v231.js','utf8');
const data=fs.readFileSync('assets/hsk1-foundations-data-v152.js','utf8');
const css=fs.readFileSync('assets/panda-go-approved-lessons-v231.css','utf8');
new vm.Script(source);
assert(css.includes('lesson5-scene-v233.webp'));
assert(css.includes('.app[data-step="0"] .body>h1'),'Intro should use one visual heading, not repeated titles');
assert(css.includes('min-height:143px'),'Vocabulary must be touch friendly and legible on mobile');
assert(!css.includes('filter:blur('),'Do not blur art or Chinese text');
assert(css.includes('family-cover-v235.webp'),'Lesson 6 cover must use high-resolution source');
assert(css.includes('family-people-v235.webp'),'Lesson 6 people must use high-resolution atlas');
assert(!css.includes('.app[data-lesson="6"] .footer{position:fixed;'),'Footer must reserve its height in the shared flex layout');

for(const lesson of [6,7]){
 const topic=lesson===6?'family':'weather';
 const filename=lesson===6?'hsk1-family-v231.html':'hsk1-weather-v231.html';
 const html=fs.readFileSync(filename,'utf8');
 assert(html.includes('panda-go-approved-lessons-v231.css?v='+'237'));
 assert(html.includes('panda-go-companion-v231.js?v='+(lesson===7?'246':'244')));
 assert(html.includes('owner-audio-v237.js?v=237'));
 assert(html.includes('panda-owner-lessons5-7-native-v221.js?v=221'));
 assert(css.includes('lesson'+lesson+'-scene-v233.webp'));
 const dom=new JSDOM(html,{url:'https://panda.test/chinese-coach-pwa/'+filename,runScripts:'outside-only'});
 const w=dom.window,d=w.document;
 w.eval(data);
 w.PANDA_HSK1_VOICES={
  female:new Proxy({}, {get(_,p){return './assets/hsk1-voices-v160/mock-'+String(p)+'.mp3'}}),
  male:new Proxy({}, {get(_,p){return './assets/sample/'+String(p)+'.mp3'}})
 };
 w.PANDA_HSK1_NATIVE_HUMAN_V167={};
 w.Audio=function(src){this.src=src;this.pause=()=>{};this.play=()=>Promise.resolve()};
 w.HanziWriter={create:()=>({cancelQuiz(){},pauseAnimation(){},animateCharacter(){},quiz(){}})};
 const legacy='pg-hsk1-v3-'+topic;
 const legacyContent=JSON.stringify({step:4,maxStep:4,completed:false});
 w.localStorage.setItem(legacy,legacyContent);
 w.eval(source);
 const step=()=>Number(d.getElementById('pg5-count').textContent.split(' ')[0]);
 const click=selector=>{
  const btn=d.querySelector(selector);
  assert(btn,'Missing '+selector+' on step '+step()+' lesson '+lesson);
  assert(!btn.disabled,'Disabled '+selector+' at step '+step());
  btn.click();return btn;
 };
 assert.equal(step(),1);
 assert(d.querySelector('.intro-art'),'Approved Panda cover missing');
 assert(d.querySelectorAll('.cover-milestones>div').length===3,'Approved three cover chips missing');
 assert(!d.querySelector('.lesson-steps'),'Legacy seven-step path screen must be gone');
 for(let i=1;i<=8;i++){click('#pg5-next');assert.equal(step(),i+1,'Step flow '+lesson)}
 assert.equal(d.querySelectorAll('.bubble').length,4,'Existing four-line dialogue must survive');
 click('#pg5-next');assert.equal(step(),10);
 assert(d.getElementById('pg5-next').disabled,'Listening must block progress');
 const currentTopic=w.PANDA_HSK1_FOUNDATIONS.find(x=>x.id===topic);
 for(const [hz] of currentTopic.listen.items.slice(0,4))click('[data-listen="'+hz+'"]');
 assert(!d.getElementById('pg5-next').disabled,'Four real correct answers needed');
 click('#pg5-next');assert.equal(step(),11);
 assert(d.getElementById('pg5-next').disabled,'Builder gate missing');
 for(const build of currentTopic.builds.slice(0,3)){
  for(let i=0;i<build.target.length;i++)click('[data-piece="'+i+'"]');
  click('[data-check]');
 }
 assert(!d.getElementById('pg5-next').disabled);
 click('#pg5-next');assert.equal(step(),12);assert(d.getElementById('writer'),'Hanzi exercise unavailable');
 click('#pg5-next');assert.equal(step(),13);assert(d.querySelector('[data-record]'),'Recorder buttons missing');
 click('#pg5-next');assert.equal(step(),14);
 assert(d.querySelectorAll('[data-final]').length===currentTopic.quiz.choices.length,'Final choices missing');
 click('[data-final="'+currentTopic.quiz.correct+'"]');
 assert(!d.getElementById('pg5-next').disabled,'Correct final answer must unlock completion');
 const saved=JSON.parse(w.localStorage.getItem('pg-hsk1-l'+lesson+'-v231'));
 assert(saved.done&&saved.quizPassed,'Completed lesson state not stored');
 assert(JSON.parse(w.localStorage.getItem('pg-hsk1-v3-complete')).includes(topic),'Legacy achievement missing');
 assert.equal(w.localStorage.getItem(legacy),legacyContent,'Legacy study progress overwritten');
 for(let n=13;n>=1;n--){click('#pg5-prev');assert.equal(step(),n,'Back navigation broken')}
 assert(d.querySelector('.intro-art'),'Cover unavailable when reviewing');
 dom.window.close();
 console.log('PASS approved lesson '+lesson+': 14 screens, voice buttons, 4 listens, 3 builders, handwriting, speech, legacy progress.');
}
console.log('PASS Panda Go v231: approved family/weather educational flows.');
