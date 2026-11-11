'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
(async()=>{
 const env={window:{}};vm.runInNewContext(fs.readFileSync('assets/hsk1-foundations-data-v152.js','utf8'),env);
 const topics=env.window.PANDA_HSK1_FOUNDATIONS;
 const {answerCurriculumQuestion:ask}=await import('../assets/panda-curriculum-tutor.mjs');
 assert.equal(topics.length,7);
 assert.equal(topics.reduce((x,t)=>x+t.words.length,0),86);
 for(let i=1;i<=7;i++){
  const t=topics[i-1],w=t.words[0],a=ask('Как переводится '+w[0]+'?',i,topics);
  assert(a.includes(w[1]),'Word '+w[0]+' in lesson '+i+' '+a);
  assert(ask('Покажи диалог',i,topics).includes(t.dialogue[0][1]));
  assert(ask('Объясни грамматику',i,topics).includes(t.rules[0][0]));
 }
 assert(ask('Как переводится 你们?',2,topics).includes('nǐmen'));
 assert(ask('Как переводится 妈妈?',6,topics).includes('māma'));
 assert(ask('Как переводится 妈妈?',2,topics).includes('нет проверенного ответа'));
 assert(ask('Что такое космонавтика?',7,topics).includes('нет проверенного ответа'));
 const html=fs.readFileSync('panda-lesson1.html','utf8'),ui=fs.readFileSync('assets/panda-lesson1-ui.mjs','utf8');
 assert(html.includes('id="ask-lesson"')&&html.includes('hsk1-foundations-data-v152.js'));
 assert(ui.includes('answerCurriculumQuestion')&&ui.includes('lessonSelect.value'));
 assert(!/fetch\(|openai|api\.key/i.test(fs.readFileSync('assets/panda-curriculum-tutor.mjs','utf8')));
 console.log('PASS free Panda AI: 7 lessons, 86 word entries, grammar and dialogues, strict lesson scope');
})().catch(e=>{console.error(e);process.exitCode=1});
