'use strict';
/* Static regression test for the writing studio and its seven lesson entry points. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {Script}=require('node:vm');
const meta=JSON.parse(fs.readFileSync('assets/hanzi-writing-curriculum-v283.json','utf8'));
assert.equal(meta.version,283);
assert.equal(meta.lessons.length,7);
const pages=['hsk1-first-v189.html','hsk1-second-v203.html','hsk1-third-v212.html',
 'hsk1-fourth-v214.html','hsk1-fifth-v227.html','hsk1-family-v231.html','hsk1-weather-v231.html'];
const all=new Set();
for(let i=0;i<7;i++){
 const lesson=meta.lessons[i];assert.equal(lesson.id,i+1);
 assert(lesson.characters.length>=11,'Too few characters in lesson '+(i+1));
 for(const item of lesson.characters){
  assert.equal(item.length,3,'Character,pinyin,meaning required');
  const [ch,py,ru]=item;
  assert(/^\p{Script=Han}$/u.test(ch),'Use single Han characters: '+ch);
  assert(py&&ru,'Missing pinyin/meaning: '+ch);
  all.add(ch);
 }
 const page=fs.readFileSync(pages[i],'utf8');
 assert(page.includes('hanzi-writing.html?lesson='+(i+1)),'No entry point lesson '+(i+1));
 assert(page.includes('hanzi-writing-shortcut-v283.css?v=283'));
}
for(const char of all){
 const file='assets/hanzi-data/'+char+'.json';
 assert(fs.existsSync(file),'Missing local stroke data for '+char);
 const obj=JSON.parse(fs.readFileSync(file,'utf8'));
 assert(obj.strokes?.length>0&&obj.medians?.length===obj.strokes.length);
}
const html=fs.readFileSync('hanzi-writing.html','utf8');
assert(html.includes('hanzi-writer.min.js')&&html.includes('hanzi-writing-v283.js?v=283'));
const code=fs.readFileSync('assets/hanzi-writing-v283.js','utf8');
new Script(code);
assert(code.includes('HanziWriter.create')&&code.includes('onCorrectStroke')&&code.includes('onComplete'));
assert(code.includes('localStorage')&&code.includes('touch'));
const map=fs.readFileSync('hsk1-map.html','utf8');
assert(map.includes('hanzi-writing.html?lesson=1'),'No writing shortcut on the HSK map');
console.log('PASS Panda Go writing v283: '+all.size+' offline Hanzi, 7 entry points, touch+feedback+progress');
