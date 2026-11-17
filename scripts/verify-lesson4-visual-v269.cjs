'use strict';
/* Panda Go lesson 4 v271 visual regression based on the approved screenshot.
 * The name of this test is kept for compatibility with existing CI.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const app=fs.readFileSync('assets/hsk1-fourth-v220.js','utf8');
const css=fs.readFileSync('assets/hsk1-fourth-v219.css','utf8');
const html=fs.readFileSync('hsk1-fourth-v214.html','utf8');
const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
for(const name of ['cover','celebrate','woman','man']){
 const p=(name==='man'||name==='woman'?'assets/lesson4-dialog-v282/':'assets/lesson4-v269/')+name+'.webp';
 const b=fs.readFileSync(p);
 assert(b.length>8000,'Missing/empty image '+name);
 assert.equal(b.toString('ascii',0,4),'RIFF');
 assert.equal(b.toString('ascii',8,12),'WEBP');
 assert(pack.files.includes('./'+p),'No offline asset '+name);
 assert(app.includes('./'+p),'Active screen does not use image '+name);
}
assert(html.includes('hsk1-fourth-v219.css?v=282')&&html.includes('hsk1-fourth-v220.js?v=421'),'Cache freshness');
const controls=fs.readFileSync('assets/hsk1-controls-v421.css','utf8');
assert(html.includes('hsk1-controls-v421.css?v=421'));
assert(controls.includes('[data-pg-control="primary"]')&&controls.includes('#ffdc67'),'Next is gold');
assert(controls.includes('[data-pg-control="secondary"]')&&controls.includes('#edddfb'),'Back is pale lilac');
assert(controls.includes('[data-pg-control="audio"]')&&controls.includes('#cfeeff'),'Listen is pale blue');
assert(css.includes('.pg4-people img{height:149px')&&app.includes('class="pg4-people"'),'Portraits displayed at readable sizes');
assert(app.includes('Míngtiān xīngqī jǐ?')&&app.includes('Míngtiān xīngqī liù.'),'Correct conversational pinyin');
assert(!app.includes('class="pg4-dialog-portrait"'),'No inline cropped portraits');
assert(!css.includes('lesson5-lilac-sakura-v225.svg')&&!css.includes("background:url('./lesson4-reference-v216/sakura-left.webp')"),'No background decorations');
assert(!css.includes('lesson4-dialog-v266/woman.svg'),'No old defective images');
assert(app.includes('PandaLesson4XiaoxiaoV265?.lookup(word)')&&app.includes("role==='male'"),'Voice and dialogue retained');
assert(pack.version>=271,'Cache version');
console.log('PASS Panda Go lesson 4 v271: gold next, lilac back, blue listen, unclipped characters and no floral backdrop.');
