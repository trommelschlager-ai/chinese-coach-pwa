'use strict';
/* Active lesson-4 v269: purple buttons, direct image loading, voice preserved. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const app=fs.readFileSync('assets/hsk1-fourth-v220.js','utf8');
const css=fs.readFileSync('assets/hsk1-fourth-v219.css','utf8');
const html=fs.readFileSync('hsk1-fourth-v214.html','utf8');
const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
for(const name of ['cover','celebrate','woman','man']){
 const p='assets/lesson4-v269/'+name+'.webp';
 const b=fs.readFileSync(p);
 assert(b.length>8000,'Missing/empty image '+name);
 assert.equal(b.toString('ascii',0,4),'RIFF');
 assert.equal(b.toString('ascii',8,12),'WEBP');
 assert(pack.files.includes('./'+p),'No offline asset '+name);
 assert(app.includes('./'+p),'Active screen does not use image '+name);
}
assert(html.includes('hsk1-fourth-v219.css?v=269')&&html.includes('hsk1-fourth-v220.js?v=269'),'Cache freshness');
assert(css.includes('linear-gradient(180deg,#8949df 0%,#6e2cbd 51%,#51168c 100%)'),'Main buttons must be rich violet');
assert(css.includes('.pg4-dialog-portrait')&&app.includes('class="pg4-dialog-portrait"'),'Real img elements for dialogue');
assert(!css.includes('lesson4-dialog-v266/woman.svg'),'Do not load old defective portrait');
assert(!css.includes('.pg4-bubbles .from-f:before'),'Old background pseudoelements disabled');
assert(app.includes('PandaLesson4XiaoxiaoV265?.lookup(word)')&&app.includes("role==='male'"),'Voice and dialogue remain intact');
assert(pack.version>=269,'Cache version');
console.log('PASS Panda Go lesson 4 v269: rich purple controls, 4 present artwork assets, real portrait images, voice intact.');
