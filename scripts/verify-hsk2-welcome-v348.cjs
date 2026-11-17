/* Panda Go HSK2: validate the currently approved entry and 10-theme welcome route.
 * The old #map DOM controller is legacy; it now redirects to the real life course.
 * This test does not claim Android visual or audio-tone validation.
 */
'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const old=fs.readFileSync('hsk2-start.html','utf8');
const page=fs.readFileSync('hsk2-life-course.html','utf8');
const courseJs=fs.readFileSync('assets/hsk2-life-course-data-v1.js','utf8');
const appJs=fs.readFileSync('assets/hsk2-life-course-app-v1.js','utf8');
assert.match(old,/location\.replace\(['"]\.\/hsk2-life-course\.html\?view=map['"]\)/,
 'Legacy HSK2 map entry must redirect to the current life-course map');
assert.match(page,/Моя жизнь на китайском/,'Current course title must stay visible');
assert(page.includes('hsk2-approved-20261117/home.jpg'),'Approved Nov 17 home poster must preload');
assert(page.includes('hsk2-approved-20261117/lesson1.jpg'),'Approved lesson 1 poster must preload');
assert(page.includes('hsk2-approved-20261117.css?v=432'),'New approved artwork stylesheet must load');
assert.match(page,/course-map\.png/,'Approved illustrated roadmap must remain');
assert.match(page,/hsk2-life-course-app-v1\.js\?v=\d+/,'Course controller must be cache-versioned');
assert.match(appJs,/view:'welcome'/,'First visit starts with approved welcome view');
assert.match(appJs,/\bfunction store\(/,'Course progress must persist locally');
const ctx={window:{}};
vm.runInNewContext(courseJs,ctx);
const topics=ctx.window.PandaLifeCourseV1.topics;
assert.equal(topics.length,10);
assert.equal(topics.reduce((n,t)=>n+t.scenes.length,0),30);
assert.equal(topics.reduce((n,t)=>n+t.words.length,0),200);
assert(topics.every(t=>t.words.length===20&&t.scenes.length===3));
console.log('PASS HSK2 v432: approved entry to 10 themes, 30 mini-lessons and 200 vocabulary entries.');
