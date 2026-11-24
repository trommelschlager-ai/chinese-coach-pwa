'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const base='assets/approved-course-v390/';
const images=[
 ['course-welcome.png','3a3311a6a69be01481516aa120e0948f14cb820e'],
 ['course-map.png','a1edda7fe7ea5a505dde67917492fabe5cf755f5'],
 ['day-lesson.png','3f1abb4d52428cb68e778bb2dfe74834695ee5df']
];
for(const [name,sha] of images){
 const data=fs.readFileSync(path.join(root,base,name));
 assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a','PNG exact '+name);
 assert.equal(data.readUInt32BE(16),941,'approved image width');
 assert.equal(data.readUInt32BE(20),1672,'approved image height');
 assert.equal(crypto.createHash('sha1').update(Buffer.from('blob '+data.length+'\0')).update(data).digest('hex'),sha,'exact binary approved design');
}
const html=fs.readFileSync(path.join(root,'hsk2-life-course.html'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/approved-course-v390/course-art-v391.css'),'utf8');
assert.match(html,/approved-course-v390\/course-art-v391\.css/);
assert.match(html,/hsk2-day-topic-one-v391\.js/);
assert.match(css,/\.approved-stage/);
assert.match(css,/\.poster-map-card/);
const errors=[],warnings=[],vc=new VirtualConsole();
vc.on('jsdomError',e=>errors.push(e.message));
vc.on('warn',e=>warnings.push(String(e)));
vc.on('error',e=>errors.push(String(e)));
const dom=new JSDOM(html,{url:'https://example.org/hsk2-life-course.html',runScripts:'dangerously',virtualConsole:vc});
const w=dom.window,d=w.document;
w.PandaHsk2AudioV330={lookup:()=>null,play:()=>false};
for(const f of ['hsk2-life-course-data-v1.js','hsk2-day-first-data-v1.js','hsk2-day-topic-one-v391.js','hsk2-day-first-ui-v1.js','hsk2-life-course-app-v1.js'])w.eval(fs.readFileSync(path.join(root,'assets',f),'utf8'));
function click(selector){const element=d.querySelector(selector);assert.ok(element,'Missing '+selector);assert.equal(element.disabled,false);element.click()}
assert.equal(d.querySelectorAll('img[src$="/hsk2-life-approved-fullscreen-v412.png"]').length,1);
assert.equal(d.querySelectorAll('.approved-program,.approved-start,.approved-ai-top,.poster-welcome-ai-card').length,4);
assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk2-life-course-v1')).completed.length,0);
click('.approved-program');
assert.equal(d.querySelectorAll('.poster-map-card[data-topic]').length,10);
assert.equal(d.querySelectorAll('img[src$="/course-map.png"]').length,1);
assert.equal(d.querySelectorAll('.poster-map-nav').length,5);
click('.poster-map-back');
assert.equal(d.querySelectorAll('.approved-start').length,1);
// Exercise the legacy engine via the same delegated mini-lesson action as the catalog.
const entry=d.createElement('button');
entry.dataset.practiceMini='0:0';
d.body.append(entry);
entry.click();
entry.remove();
assert.equal(d.querySelectorAll('img[src$="/day-lesson.png"]').length,1);
assert.equal(d.querySelectorAll('[data-day-show-words]').length,2);
click('.art-next');
assert.equal(d.querySelectorAll('.day-vword').length,7);
assert.ok(d.querySelector('.day-chars').textContent.includes('chuáng'));
assert.deepEqual(errors,[]);
assert.deepEqual(warnings,[]);
console.log('PASS: all 3 approved 941x1672 PNG SHA and click-through welcome -> 10-topic map -> artwork -> real first-lesson character breakdown, progress retained');
