import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TOPICS,TASKS,grade,answerLessonQuestion} from '../assets/panda-lesson1-engine.mjs';

test('lesson 1 inventory is exactly 25 curated review questions in five sections',()=>{
 assert.equal(TASKS.length,25);
 assert.deepEqual(Object.fromEntries(TOPICS.map(t=>[t.id,TASKS.filter(x=>x.topic===t.id).length])),{dialog:2,vocab:6,writing:4,tones:10,listening:3});
 assert.equal(new Set(TASKS.map(x=>x.id)).size,TASKS.length);
 for(const item of TASKS){
  assert(item.prompt&&item.correct&&item.hint&&item.answers.length>0,item.id);
  assert.equal(grade(item,item.answers[0]).ok,true,'Must accept intended answer: '+item.id);
  assert.equal(grade(item,'неправильный ответ').ok,false,'Must reject nonsense: '+item.id);
 }
});
test('Mandarin and pinyin checking is strict about tones and full sentences',()=>{
 const item=id=>TASKS.find(x=>x.id===id);
 assert(grade(item('d1'),'你好！').ok);
 assert(grade(item('d1'),'nǐ hǎo').ok);
 assert(grade(item('d1'),'ní hǎo').ok);
 assert(!grade(item('d1'),'ni hao').ok);
 assert(grade(item('d2'),'我是学生。').ok);
 assert(grade(item('d2'),'wo3 shi4 xue2sheng').ok);
 assert(!grade(item('d2'),'学生').ok);
 assert(!grade(item('d2'),'xue2sheng').ok);
 assert(grade(item('w4'),'шесть').ok);
 assert(grade(item('t5'),'3 3').ok);
 assert(grade(item('t5'),'nǐ hǎo').ok);
 assert(!grade(item('t5'),'ní hǎo').ok);
 assert(grade(item('t6'),'ní hǎo').ok);
 assert(grade(item('t6'),'2, 3').ok);
 assert(!grade(item('t6'),'nǐ hǎo').ok);
 assert(grade(item('t4'),'нейтральный').ok);
 assert(!grade(item('t4'),'первый').ok);
});
test('fixed tutor explains lesson topics without leaking beyond HSK 1',()=>{
 const queries=[
 ['你好','你好'],
 ['Почему 你好 произносится не так?','ní hǎo'],
 ['Как переводится 学生?','ученик'],
 ['Какой ключ у 好?','女'],
 ['Сколько черт у 好?','шесть'],
 ['Сколько тонов в китайском?','четыре'],
 ['Какой тон у 是?','четвёртый'],
 ['Что такое иероглиф?','письменности'],
 ['Что такое пиньинь?','латинскими'],
 ['Какой порядок слов в 我是学生?','подлежащее']
 ];
 for(const [input,expected] of queries){
  const result=answerLessonQuestion(input);
  assert(result.toLowerCase().includes(expected.toLowerCase()),'Query '+input+' => '+result);
 }
 assert(answerLessonQuestion('Как выехать в Китай?').includes('только по уроку 1'));
});
test('existing first lesson remains untouched; standalone beta only adds a card',()=>{
 const page=readFileSync(new URL('../panda-lesson1.html',import.meta.url),'utf8');
 const map=readFileSync(new URL('../hsk1-map.html',import.meta.url),'utf8');
 const first=readFileSync(new URL('../hsk1-first-v189.html',import.meta.url),'utf8');
 assert(page.includes('Panda AI')&&page.includes('panda-lesson1-ui.mjs'));
 assert(page.includes('owner-audio-v237.js'));
 assert(map.includes('href="./panda-lesson1.html"'));
 assert(map.includes('href="./hsk1-first-v189.html"'));
 assert(first.includes('hsk1-first-v189.js?v=242'));
 for(const forbidden of ['OPENAI_API_KEY','api.openai.com','turnstile','fetch(']){
  assert(!readFileSync(new URL('../assets/panda-lesson1-ui.mjs',import.meta.url),'utf8').includes(forbidden));
  assert(!readFileSync(new URL('../assets/panda-lesson1-engine.mjs',import.meta.url),'utf8').includes(forbidden));
 }
});
test('audio uses already licensed, owner-supplied exact lesson word recordings',()=>{
 const source=readFileSync(new URL('../assets/owner-audio-v237.js',import.meta.url),'utf8');
 for(const word of ['我','是','学生']){
  assert(TASKS.find(x=>x.topic==='listening'&&x.audio===word));
  assert(source.includes('"'+word+'": "./assets/owner-clean-v237/'));
 }
});
