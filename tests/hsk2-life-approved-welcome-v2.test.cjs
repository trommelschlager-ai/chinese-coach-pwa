'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const prefix='assets/hsk2-life-landing-approved-v1/';
const images=[
 ['01_header_panda.png',220,'9024a203440795a6033ec4b81b8c5dc3576f92cb'],
 ['02_course_and_ai.png',130,'2306f79347cb9d1719fe74e5631f8cffd3ff9ae7'],
 ['03_proverb.png',130,'31d973a1c03ae1440b9b24c05183dc8c03ac8c60'],
 ['04_course_numbers.png',158,'234ced398011423fe2aa90d965dd821b49ca6915'],
 ['05_grammar_tests_speech.png',446,'df11821980753c0bd7c5636d682fe1661b9d69a6'],
 ['06_outcomes.png',221,'ac0eaaf5c2909308712b29b31dae754f799e14ed'],
 ['07_actions_and_lake.png',231,'d996864eef6c3768644c2a13bd28eeb1e4ab6ec0']
];
let sum=0;
for(const [name,height,sha] of images){
 const image=fs.readFileSync(path.join(root,prefix,name));
 assert.equal(image.subarray(0,8).toString('hex'),'89504e470d0a1a0a','PNG magic: '+name);
 assert.equal(image.readUInt32BE(16),1024,'Original width preserved: '+name);
 assert.equal(image.readUInt32BE(20),height,'Original segment height: '+name);
 sum+=height;
 const gitSHA=crypto.createHash('sha1').update(Buffer.from('blob '+image.length+'\0')).update(image).digest('hex');
 assert.equal(gitSHA,sha,'The shipped binary must be the exact approved crop: '+name);
}
assert.equal(sum,1536,'The seven segments must exactly cover the approved 1024×1536 poster');
const html=fs.readFileSync(path.join(root,'hsk2-life-course.html'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/hsk2-life-approved-welcome-v2.css'),'utf8');
const app=fs.readFileSync(path.join(root,'assets/hsk2-life-course-app-v1.js'),'utf8');
const data=fs.readFileSync(path.join(root,'assets/hsk2-life-course-data-v1.js'),'utf8');
assert.match(html,/hsk2-life-approved-welcome-v2\.css/);
assert.match(css,/object-fit:contain/);
assert.doesNotMatch(css,/object-fit:fill/,'Do not stretch approved design');
assert.match(css,/\.approved-hotspot:focus-visible/);
let errors=[],warnings=[];
let vc=new VirtualConsole();
vc.on('jsdomError',e=>errors.push(e.message));
vc.on('error',s=>errors.push(s));
vc.on('warn',s=>warnings.push(s));
let dom=new JSDOM(html,{url:'https://example.test/hsk2-life-course.html',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{}}});
let w=dom.window,d=w.document;
w.PandaHsk2AudioV330={lookup:()=>null,play:()=>false};
w.eval(data);w.eval(app);
let slices=Array.from(d.querySelectorAll('.approved-slice'));
assert.equal(slices.length,7,'Show all seven original poster fragments');
assert.deepEqual(slices.map(x=>x.getAttribute('height')),images.map(x=>String(x[1])));
assert.deepEqual(slices.map(x=>x.getAttribute('src')),images.map(x=>'./'+prefix+x[0]));
assert.ok(d.querySelector('#app').classList.contains('show-approved-welcome'));
const originalProgress=JSON.parse(w.localStorage.getItem('pg-hsk2-life-course-v1')).completed;
assert.deepEqual(originalProgress,[],'No forced progress reset or invented completion');
assert.equal(d.querySelectorAll('.approved-hotspot').length,4,'Program, Start and two Panda AI hotspots');
const ai=Array.from(d.querySelectorAll('a.approved-hotspot'));
assert.equal(ai.length,2);
assert.ok(ai.every(x=>x.getAttribute('href')==='./panda-voice-pilot.html'));
function click(s){let e=d.querySelector(s);assert.ok(e,'Missing control '+s);assert.equal(e.disabled,false);e.click()}
click('.approved-program');
assert.equal(d.querySelectorAll('.topic-card').length,10,'Program opens ten themes');
assert.ok(!d.querySelector('#app').classList.contains('show-approved-welcome'),'Normal lesson UI restored after navigation');
click('[data-nav="welcome"]');
assert.equal(d.querySelectorAll('.approved-slice').length,7);
click('.approved-start');
assert.equal(d.querySelectorAll('.word-card').length,7,'Start opens the first mini-lesson');
assert.equal(d.querySelector('.lesson-head h1').textContent.includes('Мой распорядок дня'),true);
assert.deepEqual(errors,[],'No JavaScript errors on poster navigation');
assert.deepEqual(warnings,[],'No course grammar consistency warnings');
console.log('PASS: 7 exact PNG assets · 1024×1536 · 4 hotspots · map 10 topics · first mini-lesson · progress preserved');
