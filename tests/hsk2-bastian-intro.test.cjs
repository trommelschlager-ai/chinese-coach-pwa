'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'hsk2-bastian-intro.html'),'utf8');
const vc=new VirtualConsole(),issues=[];
vc.on('jsdomError',e=>issues.push(e.message));
const dom=new JSDOM(html,{
 url:'https://example.test/hsk2-bastian-intro.html',
 runScripts:'dangerously',
 virtualConsole:vc,
 beforeParse(win){win.scrollTo=()=>{}}
});
const doc=dom.window.document,$=sel=>doc.querySelector(sel);
const click=sel=>{const b=$(sel);assert.ok(b,'Missing: '+sel);assert.equal(b.disabled,false,'Disabled: '+sel);b.click()};
assert.match(doc.title,/Бастианом/);
assert.equal(doc.querySelectorAll('.phrase').length,4,'Intro must show exactly four phrases');
for(const value of ['你好，我叫巴斯蒂安。','我二十五岁。','我住在莫斯科。','我是工程师。','Bāsīdì','Mòsīkē','gōngchéngshī']){
 assert.ok(doc.body.textContent.includes(value),'Missing '+value);
}
assert.ok($('img[src="./assets/bastian-approved-v1.avif"]'),'Must use approved reference portrait, not a substitute');
assert.match(doc.querySelector('.section').textContent,/我叫/);
assert.match(doc.querySelectorAll('.section')[1].textContent,/4-й тон/);
assert.equal($('practice').hidden,true);
click('#start');
assert.equal($('practice').hidden,false);
assert.match($('#step-title').textContent,/Слова/);
assert.equal(doc.querySelectorAll('.word').length,10);
click('#next');
assert.match($('#step-title').textContent,/Пиньинь/);
assert.match($('#step-content').textContent,/nǐ hǎo → ní hǎo/);
click('#next');
assert.match($('#step-title').textContent,/Грамматика/);
assert.match($('#step-content').textContent,/住在/);
click('#next');
assert.match($('#step-title').textContent,/Практика/);
assert.equal($('#next').disabled,true,'Cannot pass uncompleted quiz');
assert.equal(doc.querySelectorAll('.q').length,4);
click('[data-answer="0:0"]');
assert.equal($('#next').disabled,true,'Wrong answer must not unlock next');
click('[data-answer="0:1"]');
for(let i=1;i<4;i++)click('[data-answer="'+i+':1"]');
assert.equal($('#next').disabled,false,'Four correct answers should unlock completion');
click('#next');
assert.match($('#step-title').textContent,/Отлично/);
assert.equal(JSON.parse(dom.window.localStorage.getItem('pg-bastian-intro-v1')).complete,true);
click('#restart');
assert.match($('#step-title').textContent,/Слова/);
assert.equal(JSON.parse(dom.window.localStorage.getItem('pg-bastian-intro-v1')).complete,false);
assert.deepEqual(issues,[],'No browser script errors');
console.log('PASS: Bastian approved lesson · layout, grammar, pinyin, tones, quiz gating, replay, persistence');
