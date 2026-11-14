import test from 'node:test';
import assert from 'node:assert/strict';
import {ASK_CANDIDATES,availableAskGroups} from '../assets/panda-ask-catalog-v326.mjs';
import {answerLive} from '../assets/panda-live-dialogue-v272.mjs';

const date=new Date('2026-11-14T12:00:00');
const all=[1,2,3,4,5,6,7];

test('catalog follows the exact seven supported course topics, no new subject introduced',()=>{
 assert.deepEqual(ASK_CANDIDATES.map(g=>g.title),[
  'Основы и приветствие','Местоимения и представление','Числа','Дни недели',
  'Даты и месяцы','Семья','Погода'
 ]);
});

test('only current and completed lesson ids appear; never leak unstudied topics',()=>{
 const only=availableAskGroups([1],[],date);
 assert.deepEqual(only.map(g=>g.lesson),[1]);
 const some=availableAskGroups([1,4,6],[],date);
 assert.deepEqual(some.map(g=>g.lesson),[1,4,6]);
 assert.deepEqual(availableAskGroups([999,-1],[],date),[]);
 for(const g of some)assert(g.questions.length>=2,'Must have verified choices '+g.title);
});

test('each visible question has the same reviewed reply, pinyin and Russian translation as Panda Brain',()=>{
 const groups=availableAskGroups(all,[],date);
 assert.equal(groups.length,7);
 for(const group of groups){
  assert(group.questions.length>=2,group.title+' should have two or more supported questions');
  for(const q of group.questions){
   const r=answerLive(q.hanzi,{allowed:all,topic:group.lesson,curriculum:[],date,turn:1,profile:{family:{},recentQuestions:[]}});
   assert.equal(r.kind,'question',q.hanzi);
   assert(r.reply,q.hanzi);
   assert.equal(q.pinyin,r.spoken.pinyin,q.hanzi);
   assert.equal(q.ru,r.spoken.translation,q.hanzi);
   assert(q.pinyin&&q.ru,'Never display invented or missing translations');
  }
 }
});

test('family screenshot is in lesson 6 but is not shown under a locked family lesson',()=>{
 const allGroups=availableAskGroups(all,[],date);
 const family=allGroups.find(g=>g.lesson===6);
 const sister=family.questions.find(q=>q.hanzi==='你姐姐怎么样？');
 assert(sister,'Family wellbeing should be discoverable');
 assert.equal(sister.pinyin,'Nǐ jiějie zěnmeyàng?');
 assert.equal(sister.ru,'Как поживает твоя старшая сестра?');
 assert(!availableAskGroups([1],[],date).some(g=>g.lesson===6));
});

test('weather questions are genuine supported scripted scenarios not false forecasts',()=>{
 const g=availableAskGroups(all,[],date).find(g=>g.lesson===7);
 const q=g.questions.find(x=>x.hanzi==='今天天气怎么样？');
 assert(q);
 const response=answerLive(q.hanzi,{allowed:all,topic:7,curriculum:[],date});
 assert.match(response.reply.context,/не настоящий прогноз/i);
});
