/* v151: protect the three HSK screens, lesson progression, legacy data and MP3 paths. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8');
const site=read('index.html'),map=read('hsk1-map.html'),lesson=read('start-chinese.html'),style=read('assets/hsk-approved-three-screens-v151.css'),main=read('assets/panda-v130.js'),guided=read('assets/guided-introduction.js');
for(const [name,html] of [['index',site],['map',map],['lesson',lesson]])assert(html.includes('hsk-approved-three-screens-v151.css?v=151'),name+' must use approved stylesheet');
assert(site.includes('panda-v130.js?v=172'),'Home version must be bumped');
assert(lesson.includes('guided-introduction.js?v=151'),'Guided script version must be bumped');
assert(/<progress max="7"/.test(lesson),'Progress consists of seven steps');
assert(lesson.includes('id="lesson-step-list"'),'Guided step list must be visible');
assert(main.includes('panda-go-home-v136-clean.png'),'Previously approved home art must be retained');
assert(main.includes('href="./hsk1-map.html"'),'HSK 1 opens the map');
assert(main.includes('pg-hsk-unavailable'),'Unfinished levels must not act as completed courses');
assert(map.includes('data-num="7" href="./hsk1-lesson.html?lesson=7"'),'Approved seventh topic opens its new lesson');
assert(style.includes('object-fit:cover')&&!style.includes('image-rendering:pixelated'),'No pixelated or stretched image styling');
const voice={},voiceScript=read('assets/guided-voice-v1506.js');
const vm=require('node:vm');vm.runInNewContext(voiceScript,{window:voice});
const v=voice.courseGuidedAudio;
assert(v&&Object.keys(v).length>22,'Existing unified lesson voice map is required');
for(const [phrase,file] of Object.entries(v))assert(fs.existsSync(file.replace(/^\.\//,'')),'Missing recorded MP3 for '+phrase);
function openLesson(n=1,legacyValue=null){
 const dom=new JSDOM(lesson,{url:'https://panda.test/start-chinese.html?lesson='+n,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.scrollTo=()=>{};w.Audio=function(src){this.src=src;this.play=()=>Promise.resolve();this.pause=()=>{}};
 if(legacyValue!==null)w.localStorage.setItem('pg-intro-step',String(legacyValue));
 w.eval(voiceScript);w.eval(guided);
 return dom;
}
for(let n=1;n<=4;n++){
 const dom=openLesson(n),w=dom.window,d=w.document,click=s=>{const el=d.querySelector(s);assert(el,'Missing '+s+' lesson '+n);assert(!el.disabled,'Disabled '+s+' lesson '+n);el.click()};
 assert.equal(d.querySelectorAll('.lesson-step-row').length,7,'Seven interactive steps on lesson '+n);
 assert.equal(d.querySelector('progress').max,7);
 click('#next');assert(d.querySelector('.lesson-tone-grid'),'Tone step reachable');
 click('#next');assert(d.querySelector('.card'),'Example cards reachable');
 click('#next');assert.equal(d.querySelectorAll('[data-line]').length,n===4?2:3,'Dialogue lines must match MP3 map');
 assert(d.querySelector('.lesson-dialogue-play'),'The dialogue has a Play control');
 const bubbles=[...d.querySelectorAll('[data-line] [lang="zh-Hans"]')].map(e=>e.textContent);
 for(const b of bubbles)assert(v[b],'No unified MP3 for '+b);
 click('#next');assert(d.querySelector('#next').disabled,'Assembly cannot be skipped');
 const total=d.querySelectorAll('#content [data-piece]').length;assert(total>=3);
 for(let i=0;i<total;i++)click('#content [data-piece="'+i+'"]');
 click('#content [data-check-build]');assert(!d.querySelector('#next').disabled,'Correct assembly unlocks next');
 click('#next');click('#next');click('#next');
 assert.equal(w.localStorage.getItem('pg-hsk1-v2-lesson-'+n),'7');
 assert(JSON.parse(w.localStorage.getItem('pg-hsk1-completed-v1')).includes(n));
 dom.window.close();
}
{
 const dom=openLesson(1,6),d=dom.window.document;
 assert(d.querySelector('#step').textContent.includes('завершён'),'Previously finished legacy lesson is preserved');
 dom.window.close();
}
const sw=read('sw.js'),pack=JSON.parse(read('assets/offline-pack.json'));
for(const url of ['./assets/hsk-approved-three-screens-v151.css?v=151','./assets/guided-introduction.js?v=151','./assets/panda-v130.js?v=152']){
 assert(site.includes(url)||lesson.includes(url)||map.includes(url),'Page must request '+url);
 assert(sw.includes(url),'Offline shell must cache '+url);
 assert(pack.files.includes(url),'Offline bundle must include '+url);
}
console.log('Panda Go v151: six HSK levels, seven steps in four lessons, MP3 coverage, progress migration, assets and cache verified.');
