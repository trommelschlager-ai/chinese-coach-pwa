'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const intro=read('hsk2-introduction.html'),start=read('hsk2-start.html');
const src=(intro.match(/<script>([\s\S]*?)<\/script>/)||[])[1];
assert(src,'intro script');
new vm.Script(src);
assert((intro.match(/data:image\/webp;base64,/g)||[]).length===2,'approved backgrounds remain');
assert(intro.includes('--lilac:#d9a7ed'),'approved palette');
for(const word of ['叫','名字','住','在','工作','医生','老师']){
 assert(src.includes(word),'required word '+word);
}
for(const q of ['你叫什么名字？','你住在哪儿？','你做什么工作？'])assert(src.includes(q),'question '+q);
assert(src.includes("我叫安娜。")&&src.includes("Wǒ jiào Ānnà."),'name with exact pinyin');
assert(src.includes("我住在北京。")&&src.includes("Wǒ zhù zài Běijīng."),'city with exact pinyin');
assert(src.includes("我是医生。")&&src.includes("Wǒ shì yīshēng."),'job with exact pinyin');
assert(src.includes("const profileReady="),'personalized introduction');
assert(src.includes('data-field="name"')&&src.includes('data-field="city"'),'editable name/city');
assert(src.includes("if(s.kind==='profile'?!profileReady():disabled)"),'profile next gate responds to field changes');
assert(src.includes('data-answer')&&src.includes('data-token'),'interactive exercises');
assert(src.includes('completed=true')&&src.includes("hsk2-start.html#lesson"),'next lesson transition');
assert(start.includes('href="./hsk2-introduction.html"'),'map routes to introduction');
assert(start.includes("location.href='./hsk2-introduction.html'"),'HSK1 review leads to intro');
assert(!intro.includes('speechSynthesis.speak'),'no unapproved synthetic voice');
console.log('HSK 2 self-introduction: lesson, Mandarin text, progression, design and JS syntax OK');
