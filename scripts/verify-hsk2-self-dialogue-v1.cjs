'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const intro=fs.readFileSync(path.join(root,'hsk2-introduction.html'),'utf8');
const start=fs.readFileSync(path.join(root,'hsk2-start.html'),'utf8');
const script=(intro.match(/<script>([\s\S]*?)<\/script>/)||[])[1];
assert(script,'lesson inline JS not found');
new vm.Script(script);
assert(intro.includes('--lilac:#d9a7ed'),'approved pastel style missing');
assert.equal((intro.match(/data:image\/webp;base64,/g)||[]).length,2,'approved header assets changed');
assert(start.includes('href="./hsk2-introduction.html"'),'lesson not linked from map');
assert(start.includes("location.href='./hsk2-introduction.html'"),'HSK1 review does not lead to intro');
assert(intro.includes('recog.lang=\'zh-CN\''),'speech recognition not Chinese');
assert(intro.includes('Проверяем только текст'),'tone-scoring disclaimer missing');
assert(!intro.includes('speechSynthesis.speak'),'unapproved synthetic speech detected');
assert(intro.includes('Я живу в Москве.')&&intro.includes('Wǒ zhù zài Mòsīkē.'),'Moscow example missing');
const els=new Map();
function element(name){
 if(!els.has(name))els.set(name,{
  innerHTML:'',textContent:'',href:'',disabled:false,value:'',classList:{toggle(){}},
  addEventListener(){},setAttribute(){},getAttribute(){return '#map'},
  querySelectorAll(){return []},querySelector(){return element('button')}
 });
 return els.get(name);
}
const window={};
const ctx={
 window,document:{getElementById:element,querySelector:element,querySelectorAll:()=>[]},
 localStorage:{getItem:()=>null,setItem(){}},
 location:{href:''}
};
vm.runInNewContext(script,ctx,{timeout:1500});
const grade=window.PandaGoHsk2IntroCheck?.gradeIntroAnswer;
assert.equal(typeof grade,'function');
const accept=[
 [0,'我叫安娜。'],[0,'我的名字叫小明。'],
 [1,'我住在莫斯科。'],[1,'北京'],
 [2,'我是医生。'],[2,'我是一名工程师。'],[2,'我没有工作。'],[2,'我是学生。']
];
const reject=[
 [0,'我是医生。'],[0,'你叫什么名字？'],[0,'叫安娜'],
 [1,'我在莫斯科。'],[1,'你住在哪儿？'],[1,'我住在老师。'],
 [2,'我在莫斯科工作。'],[2,'你做什么工作？'],[2,'我是在莫斯科。']
];
for(const [q,s] of accept)assert.equal(grade(q,s).ok,true,'should accept q'+q+' '+s);
for(const [q,s] of reject)assert.equal(grade(q,s).ok,false,'should reject q'+q+' '+s);
assert(intro.includes("kind:'dialogue-practice'"),'guided practice stage missing');
assert(intro.includes('data-dialogue-check')&&intro.includes('data-dialogue-hint'),'practice input missing');
assert(intro.includes('data-dialogue-forward'),'practice navigation missing');
assert(intro.includes('localStorage.setItem(key'),'progress missing');
console.log('HSK 2 self-introduction QA: 17 answer variants, syntax, design, voice gate and navigation passed');
