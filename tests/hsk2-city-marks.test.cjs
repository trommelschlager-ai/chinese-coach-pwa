'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'../hsk2-city-marks-prototype-v1.html'),'utf8');
const errors=[];
const virtualConsole=new VirtualConsole();
virtualConsole.on('jsdomError',err=>errors.push(err.message));
const dom=new JSDOM(html,{url:'https://example.test/hsk2-city-marks.html',runScripts:'dangerously',virtualConsole});
const doc=dom.window.document;
const $=selector=>doc.querySelector(selector);
function click(selector){const item=$(selector);assert.ok(item,'Missing '+selector);assert.equal(item.disabled,false,'Disabled '+selector);item.click()}
assert.match(doc.title,/Маркс/);
assert.match(doc.body.textContent,/Курс 2/);
assert.ok($('.hero .boy img[src$="marks-city-avatar-v1.svg"]'),'Original Marks avatar missing');
click('[data-nav="lessons"]');
assert.equal(doc.querySelectorAll('.lesson-tile').length,10);
assert.match($('[data-lesson="1"]').className,/locked/,'Second lesson must be locked before first lesson');
click('[data-nav="home"]');
click('[data-action="continue"]');
const solutions=[
 ['这里','很','漂亮'],['我','住','在','这里'],['我','在','公司','工作'],
 ['我','每天','七点','起床'],['她','是','我的','邻居'],
 ['我','想','喝','一杯','茶'],['这个','多少','钱'],['我','坐','地铁','去','公司'],
 ['我','喜欢','在','公园','散步'],['我们','明天','见面']
];
for(let i=0;i<10;i++){
 assert.match($('main').textContent,new RegExp('Урок '+(i+1)+' из 10'));
 click('[data-action="next"]'); // word list -> grammar
 click('[data-action="next"]'); // grammar -> dialogue
 click('[data-action="next"]'); // dialogue -> quiz
 assert.equal($('[data-action="next"]').disabled,true,'Quiz must require answer');
 click('[data-pick="0"]');
 assert.equal($('[data-action="next"]').disabled,false,'Correct answer should unlock Next');
 click('[data-action="next"]'); // quiz -> build
 assert.equal($('[data-action="next"]').disabled,true,'Builder must require correct phrase');
 for(const token of solutions[i]){
  const tile=Array.from(doc.querySelectorAll('[data-tile]:not(:disabled)')).find(el=>el.textContent===token);
  assert.ok(tile,'Missing word '+token+' in lesson '+(i+1));
  tile.click();
 }
 assert.equal($('[data-action="next"]').disabled,false,'Correct build should unlock Next in '+(i+1));
 click('[data-action="next"]'); // award
 assert.match($('main').textContent,/Урок пройден!/);
 assert.match($('#coins').textContent,new RegExp(String((i+1)*150)));
 assert.match($('#xp').textContent,new RegExp(String((i+1)*50)));
 click('[data-action="forward"]');
}
assert.match($('#stars').textContent,/10\/10/);
click('[data-nav="lessons"]');
click('[data-lesson="0"]');
for(let k=0;k<3;k++)click('[data-action="next"]');
click('[data-pick="0"]');
click('[data-action="next"]');
for(const token of solutions[0]){
 const tile=Array.from(doc.querySelectorAll('[data-tile]:not(:disabled)')).find(el=>el.textContent===token);
 assert.ok(tile);tile.click();
}
click('[data-action="next"]');
assert.match($('#coins').textContent,/1500/,'Replay must not duplicate coins');
assert.match($('#xp').textContent,/500/,'Replay must not duplicate XP');
assert.ok(JSON.parse(dom.window.localStorage.getItem('pg-course2-my-city-marks-v1')).completed.length===10);
assert.deepEqual(errors,[],'No browser script errors');
console.log('PASS: Course 2 · Marks: ten lessons, unlocking, quiz, builder, replay, XP and local storage');
