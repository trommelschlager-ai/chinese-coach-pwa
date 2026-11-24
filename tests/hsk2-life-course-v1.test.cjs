'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'hsk2-life-course.html'),'utf8');
const data=fs.readFileSync(path.join(root,'assets/hsk2-life-course-data-v1.js'),'utf8');
const app=fs.readFileSync(path.join(root,'assets/hsk2-life-course-app-v1.js'),'utf8');
const dayData=fs.readFileSync(path.join(root,'assets/hsk2-day-first-data-v1.js'),'utf8');
const dayUI=fs.readFileSync(path.join(root,'assets/hsk2-day-first-ui-v1.js'),'utf8');
const fullDay=fs.readFileSync(path.join(root,'assets/hsk2-day-topic-one-v391.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/hsk2-life-course-v1.css'),'utf8');
const errors=[],warnings=[];
const vc=new VirtualConsole();
vc.on('jsdomError',e=>errors.push(e.message));
vc.on('error',s=>errors.push(String(s)));
vc.on('warn',s=>warnings.push(String(s)));
const dom=new JSDOM(html,{url:'https://example.org/hsk2-life-course.html',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{}}});
const w=dom.window,doc=w.document;
let stoppedAudio=0;
w.PandaHsk2AudioV330={lookup:()=>null,play:()=>false,stop:()=>{stoppedAudio++}};
w.eval(data);w.eval(dayData);w.eval(fullDay);w.eval(dayUI);w.eval(app);
const topics=w.PandaLifeCourseV1.topics;
function $(selector){return doc.querySelector(selector)}
function click(selector){const b=$(selector);assert.ok(b,'Missing '+selector);assert.ok(!b.disabled,'Disabled '+selector);b.click()}
function norm(s){return String(s).replace(/[，。？！,.!?、\s]/g,'')}
assert.equal(topics.length,10);
assert.equal(topics.flatMap(t=>t.words).length,200);
assert.equal(new Set(topics.flatMap(t=>t.words.map(row=>row[0]))).size,200);
assert.ok(topics.every(t=>t.words.length===20&&t.scenes.length===3&&t.scenes.every(s=>s.length===11)));
assert.match(doc.querySelector('img[src$="hsk2-life-approved-fullscreen-v412.png"]').getAttribute('alt'),/30/);
assert.match(css,/topic-grid/);
click('[data-view="map"]');
assert.equal(doc.querySelectorAll('[data-topic]').length,10);
// Exercise the legacy engine via the same delegated mini-lesson action as the catalog.
const entry=doc.createElement('button');
entry.dataset.practiceMini='0:0';
doc.body.append(entry);
entry.click();
entry.remove();
assert.ok(doc.querySelector('.day-visual-start'),'Approved first lesson artwork is present');
click('[data-day-show-words]');
assert.equal(doc.querySelectorAll('.day-vword').length,7,'Day one must contain seven studied words');
assert.ok(doc.querySelector('.day-headword').textContent.includes('起床'),'The first focused word is 起床');
assert.ok(doc.querySelector('.day-chars').textContent.includes('chuáng'),'Correct second-tone pinyin');
click('[data-day-word="3"]');
assert.ok(doc.querySelector('[data-day-word="3"].picked'),
 'Word click must update visible selected state, selected='+[...doc.querySelectorAll('.day-vword.picked')].map(x=>x.dataset.dayWord).join(','));
assert.ok(stoppedAudio>=1,'Changing the selected word stops previous audio');
assert.ok(doc.querySelector('.day-tip').textContent.includes('第三')===false,'Tones shown in Russian without false characters');
// A browser reload must preserve the unfinished, genuinely selected mini-lesson state.
const savedMidLesson=w.localStorage.getItem('pg-hsk2-life-course-v1');
const parsedMidLesson=JSON.parse(savedMidLesson);
assert.equal(parsedMidLesson.resume?.day?.selected,3,'The selected vocabulary index must be written to local storage');
assert.equal(parsedMidLesson.resume?.day?.poster,false,'The intro poster should be dismissed before saving');
const reloadDom=new JSDOM(html,{url:'https://example.org/hsk2-life-course.html',runScripts:'dangerously',beforeParse(win){win.scrollTo=()=>{}}});
const reloaded=reloadDom.window;
reloaded.localStorage.setItem('pg-hsk2-life-course-v1',savedMidLesson);
reloaded.PandaHsk2AudioV330={lookup:()=>null,play:()=>false,stop:()=>{}};
reloaded.eval(data);reloaded.eval(dayData);reloaded.eval(fullDay);reloaded.eval(dayUI);reloaded.eval(app);
assert.ok(reloaded.document.querySelector('.day-pilot'),'Reload resumes an unfinished HSK2 lesson');
assert.ok(reloaded.document.querySelector('[data-day-word="3"].picked'),
 'The last studied word is restored; screen='+reloaded.document.querySelector('#screen')?.textContent.slice(0,100)+
 ' activeButtons='+[...reloaded.document.querySelectorAll('[data-day-word]')].map(x=>x.dataset.dayWord+':'+x.className).join('|')+
 ' state='+JSON.stringify(JSON.parse(reloaded.localStorage.getItem('pg-hsk2-life-course-v1'))?.resume?.day));
reloadDom.window.close();
click('[data-day-next]'); // 2: grammar
assert.ok(doc.querySelector('.day-formula').textContent.includes('七点'));
assert.ok(doc.querySelector('.day-tip').textContent.includes('měitiān'));
click('[data-day-next]'); // 3: five-time speech practice
assert.equal(doc.querySelectorAll('.day-attempts>div').length,5);
assert.ok(doc.querySelector('[data-day-record]')||doc.querySelector('.day-tip'),'Speech step remains interactive');
click('[data-day-next]'); // 4: test
assert.equal(doc.querySelectorAll('.day-question').length,2);
click('[data-day-quiz="0:1"]');
click('[data-day-quiz="1:0"]');
for(const k of [0,1,2,3])click('[data-day-token="'+k+'"]');
assert.ok(!doc.querySelector('[data-day-next]').disabled,'Quiz and builder must pass');
click('[data-day-next]'); // 5: examples
assert.equal(doc.querySelectorAll('.day-dialogue').length,4);
click('[data-day-next]'); // finish, microphone must be optional
assert.match(doc.querySelector('#screen').textContent,/Мини-урок(?: \d+)? пройден!/);
assert.match(doc.querySelector('.day-ai-panel a').getAttribute('href'),/practice=day&mini=0/);
assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk2-life-course-v1')).completed.length,1);
click('[data-next-mini]'); // second mini-lesson uses same real 5-stage learning system
const dayTopics=w.PandaGoDayModulesV391;
assert.equal(dayTopics.length,3);
assert.equal(dayTopics[1].words.length,7);
assert.equal(doc.querySelectorAll('.day-vword').length,7);
for(let i=0;i<2;i++)click('[data-day-next]'); // grammar, speech
assert.equal(doc.querySelectorAll('.day-attempts>div').length,5);
click('[data-day-next]'); // test
assert.equal(doc.querySelectorAll('.day-question').length,2,'Second mini-lesson has quiz questions');
click('[data-day-quiz="0:1"]');click('[data-day-quiz="1:0"]');
for(let i=0;i<5;i++)click('[data-day-token="'+i+'"]');
assert.equal(doc.querySelector('[data-day-next]').disabled,false,'Second mini builder complete');
click('[data-day-next]'); // examples
assert.equal(doc.querySelectorAll('.day-dialogue').length,4);
click('[data-day-next]'); // done
assert.match(doc.querySelector('.day-ai-panel a').getAttribute('href'),/mini=1/);
assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk2-life-course-v1')).completed.length,2);
click('[data-next-mini]'); // third mini
assert.equal(doc.querySelectorAll('.day-vword').length,6);
for(let i=0;i<2;i++)click('[data-day-next]'); // grammar, speech
assert.equal(doc.querySelectorAll('.day-attempts>div').length,5);
click('[data-day-next]'); // test
click('[data-day-quiz="0:0"]');click('[data-day-quiz="1:0"]');
for(let i=0;i<4;i++)click('[data-day-token="'+i+'"]');
assert.equal(doc.querySelector('[data-day-next]').disabled,false,'Third mini builder complete');
click('[data-day-next]'); // examples
assert.equal(doc.querySelectorAll('.day-dialogue').length,4);
click('[data-day-next]'); // finish
assert.match(doc.querySelector('.day-ai-panel a').getAttribute('href'),/mini=2/);
assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk2-life-course-v1')).completed.length,3);
click('[data-next-mini]'); // Other nine themes unaffected
for(let lesson=3;lesson<30;lesson++){
 const t=Math.floor(lesson/3),m=lesson%3,scene=topics[t].scenes[m];
 const expectedWords=m===2?6:7;
 assert.equal(doc.querySelectorAll('.word-card').length,expectedWords,'Mini '+lesson+' word count');
 assert.equal(doc.querySelectorAll('.word-card .audio.unavailable,.word-card .audio.approved-voice').length,expectedWords,'Each word has an honest unavailable state or an approved recording');
 click('[data-step-next]');
 assert.ok(doc.querySelector('.gram').textContent.includes(scene[2]),'Grammar missing example in mini '+lesson);
 click('[data-step-next]');
 assert.equal(doc.querySelectorAll('.exercise').length,2);
 const word=topics[t].words[m===0?2:m===1?9:16];
 let opts=Array.from(doc.querySelectorAll('[data-quiz-word]'));
 let b=opts.find(e=>e.textContent===word[2]);
 assert.ok(b,'Missing word option: '+word[2]+' in mini '+lesson);
 b.click();
 opts=Array.from(doc.querySelectorAll('[data-quiz-sentence]'));
 b=opts.find(e=>e.textContent===scene[4]);
 assert.ok(b,'Missing sentence option: '+scene[4]);
 b.click();
 assert.ok(!doc.querySelector('[data-step-next]').disabled,'Correct quiz should enable next');
 click('[data-step-next]');
 const tiles=Array.from(doc.querySelectorAll('[data-token]')).map(e=>({key:Number(e.dataset.token),text:e.textContent}));
 const target=norm(scene[2]);
 function solve(prefix,unused,result){
  if(prefix===target&&unused.length===0)return result;
  for(let i=0;i<unused.length;i++){
   const candidate=unused[i],newPrefix=prefix+candidate.text;
   if(target.startsWith(newPrefix)){
    const answer=solve(newPrefix,unused.filter((_,j)=>j!==i),result.concat(candidate.key));
    if(answer)return answer;
   }
  }
  return null;
 }
 const order=solve('',tiles,[]);
 assert.ok(order,'No builder solution for mini '+lesson+' '+scene[2]);
 for(const k of order)click('[data-token="'+k+'"]');
 assert.ok(!doc.querySelector('[data-step-next]').disabled,'Correct builder should enable next in lesson '+lesson);
 click('[data-step-next]');
 assert.match(doc.querySelector('#screen').textContent,/Мини-урок(?: \d+)? пройден!/);
 assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk2-life-course-v1')).completed.length,lesson+1);
 click('[data-next-mini]');
}
assert.equal(doc.querySelectorAll('.exam-question').length,10);
for(let t=0;t<10;t++){
 const question=doc.querySelectorAll('.exam-question')[t];
 const choice=Array.from(question.querySelectorAll('[data-exam-choice]')).find(e=>e.textContent===topics[t].scenes[0][4]);
 assert.ok(choice,'Missing final choice '+t);
 choice.click();
}
assert.match(doc.querySelector('#screen').textContent,/10 из 10/);
click('[data-exam-finish]');
assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk2-life-course-v1')).completed.length,30);
assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk2-life-course-v1')).examPassed,true);

click('[data-nav="tones"]');
assert.equal(doc.querySelectorAll('.tone-card').length,4,'All four tones must be explained');
assert.match(doc.querySelector('.tone-rules').textContent,/ní hǎo/,'Third-tone sandhi explanation required');
assert.match(doc.querySelector('.tone-rules').textContent,/bú shì/,'不 sandhi explanation required');
click('[data-tone-answer="4"]');
assert.match(doc.querySelector('.tones').textContent,/Верно, четвёртый тон/);
assert.ok(doc.querySelector('[data-nav="tones"]'),'Tone navigation missing');
assert.deepEqual(warnings,[],'Builders must match all lesson sentences');
assert.deepEqual(errors,[],'No browser JS errors');
console.log('PASS: Panda Go course · 10 themes · 200 words · 30 mini-lessons completed · 60 quizzes · 30 builders · final 10/10 · local storage');
