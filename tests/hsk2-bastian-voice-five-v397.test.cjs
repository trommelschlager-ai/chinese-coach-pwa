'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'hsk2-bastian-intro.html'),'utf8');
const voice=fs.readFileSync(path.join(root,'assets/bastian-voice-five-v397.js'),'utf8');
const vc=new VirtualConsole(),errors=[];
vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(html,{url:'https://example.test/hsk2-bastian-intro.html',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{}}});
const w=dom.window,doc=w.document;
let recognitions=0,instance;
class FakeChineseSpeech{
 constructor(){instance=this;this.maxAlternatives=0;this.lang='';}
 start(){recognitions++;}
 abort(){}
 deliver(zh){
  this.onresult?.({results:[[{transcript:zh}]]});
  this.onend?.();
 }
 fail(error){this.onerror?.({error});this.onend?.()}
}
w.SpeechRecognition=FakeChineseSpeech;
w.eval(voice);
const $=q=>doc.querySelector(q);
const click=q=>{const b=$(q);assert.ok(b,'Missing '+q);assert.ok(!b.disabled,'Disabled '+q);b.click()};
click('#start');
assert.match($('#step-title').textContent,/Слова/);
click('#next');
assert.match($('#step-title').textContent,/2 · Произношение 5 раз/);
assert.equal(doc.querySelectorAll('.pg397-tile').length,10);
assert.equal(doc.querySelectorAll('.pg397-dot').length,50);
assert.equal(doc.querySelectorAll('.pg397-dot.ok,.pg397-dot.bad').length,0);
assert.equal($('#next').disabled,true);
assert.equal($('#toggle-py').hidden,false);
assert.equal(doc.querySelectorAll('.pg397-pinyin').length,10);
click('#toggle-py');assert.equal(doc.querySelectorAll('.pg397-pinyin').length,0);
click('#toggle-py');assert.equal(doc.querySelectorAll('.pg397-pinyin').length,10);
click('[data-voice-record]');
assert.equal(recognitions,0,'No mic access before explicit consent');
assert.ok($('.pg397-consent'));
click('[data-voice-allow]');
assert.equal(recognitions,1);
assert.equal(instance.lang,'zh-CN');
assert.equal(instance.maxAlternatives,3);
const names=['你好','我','叫','巴斯蒂安','二十五','岁','住在','莫斯科','是','工程师'];
for(let i=0;i<50;i++){
 const target=names[Math.floor(i/5)];
 if(i>0)click('[data-voice-record]');
 instance.deliver(i===1?'谢谢':target);
 const total=JSON.parse(w.localStorage.getItem('pg-bastian-intro-v1')).voice397.attempts.reduce((n,a)=>n+a.length,0);
 assert.equal(total,i+1,'Record one genuine result for each response');
}
assert.equal(recognitions,50);
assert.equal(doc.querySelectorAll('.pg397-dot.ok').length,49);
assert.equal(doc.querySelectorAll('.pg397-dot.bad').length,1);
assert.match($('.pg397-summary').textContent,/49 из 50/);
assert.equal($('#next').disabled,false,'50 attempts should unlock grammar');
const after=JSON.parse(w.localStorage.getItem('pg-bastian-intro-v1'));
assert.equal(after.voice397.attempts.length,10);
assert.ok(after.voice397.attempts.every(x=>x.length===5));
assert.equal(after.voice397.attempts[0][1].ok,false);
click('#next');
assert.match($('#step-title').textContent,/Грамматика/);
assert.ok(!$('#step-content').textContent.includes('Проверяется распознанное слово'));
assert.deepEqual(errors,[]);
dom.window.close();
console.log('PASS: real 10×5 attempt results, one wrong/49 correct, mic consent, stage two, pinyin toggle, persistence and transition');
