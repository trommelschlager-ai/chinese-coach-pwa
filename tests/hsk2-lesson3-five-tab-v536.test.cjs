'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const page=read('hsk2-lesson3-work-study-preview.html');

test('lesson 3 follows the approved lesson 1 five-section navigation',()=>{
 const sections=["Слова","Правило","Речь","Тест","Примеры"];
 sections.forEach(section=>assert(page.includes("{name:'"+section+"'"),'Missing '+section));
 assert(page.includes('const courseSteps = [1,2,4,6,3,5,7,8]'));
 assert(page.includes('hsk2-lesson1-approved-merged-v460.css'));
});

test('the lesson teaches its own six words with precise pinyin and examples',()=>{
 [
  ["公司","gōngsī"],["学校","xuéxiào"],["同事","tóngshì"],
  ["同学","tóngxué"],["电脑","diànnǎo"],["会说","huì shuō"]
 ].forEach(([zh,py])=>assert(page.includes("zh:'"+zh+"',py:'"+py+"'"),zh));
 assert(page.includes("const courseQuiz = words.flatMap"));
 assert(page.includes("const tokens = ['我','在','公司','工作','。']"));
 assert(page.includes('我在公司工作。'));
 assert(page.includes('我会说中文。'));
 assert(!page.includes('const key = \'panda-go-hsk2-about-me-v1\''));
});

test('the approved accurate pitch graph is still connected and unlimited',()=>{
 assert(page.includes('hsk2-lesson3-tone-meter-v5.js?v=529'));
 assert(page.includes('window.PandaToneTrainer?.render(words,'));
 assert(page.includes('window.PandaToneTrainer?.mount()'));
 const tone=read('assets/hsk2-lesson3-tone-meter-v5.js');
 assert(tone.includes('btn.disabled=false'));
 assert(!tone.includes("if(count(state.selected)>=LIMIT){status('Для этого слова пять"));
});

test('student progress is migrated and incorrect audio is not reused',()=>{
 assert(page.includes("legacy?.done||{}"));
 assert(page.includes('state.quiz[t][i]'));
 assert(page.includes('readProgress(courseProgressKey)'));
 const matcher=page.match(/const clips = new Map\(\[([\s\S]*?)\]\.map/);
 assert(matcher,'Clip mapping missing');
 assert(matcher[1].includes('我在公司工作。'));
 assert(!matcher[1].includes('来自'));
 assert(!matcher[1].includes('学习中文。'));
});

test('both the new preview and live path contain syntactically valid lesson code',()=>{
 for(const file of ['hsk2-lesson3-work-study-preview.html','hsk2-lesson3-standard-v536.html']){
  const h=read(file);
  const scripts=[...h.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
   .filter(m=>!m[1].includes('src='));
  assert(scripts.length>=2,'Missing scripts in '+file);
  for(const m of scripts)assert.doesNotThrow(()=>new vm.Script(m[2]),'Syntax '+file);
 }
});
