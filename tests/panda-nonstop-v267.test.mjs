import test from 'node:test';
import assert from 'node:assert/strict';
import {CONVERSATIONS} from '../assets/panda-live-lessons.mjs';
import {accessibleLessons,promptFor,nextPrompt,answerNonStop} from '../assets/panda-nonstop-v267.mjs';
class Storage{constructor(map){this.map=map||{}}getItem(k){return this.map[k]??null}}
test('scope is restricted to completed lessons and selected current lesson',()=>{
 const empty=new Storage({});
 assert.deepEqual(accessibleLessons(empty,1),[1]);
 assert.deepEqual(accessibleLessons(empty,6),[1,6]);
 const s=new Storage({'pg-hsk1-v3-complete':JSON.stringify(['foundations','pronouns','numbers']),'pg-hsk1-l6-v231':JSON.stringify({done:true})});
 assert.deepEqual(accessibleLessons(s,4),[1,2,3,4,6]);
 assert.deepEqual(accessibleLessons(new Storage({'pg-hsk1-v3-complete':'not-json'}),7),[1,7]);
});
test('Non-Stop prompts cycle only through available recorded topics',()=>{
 const dates=new Date(2026,10,12);
 const allowed=[1,2,6];
 const all=[];
 let idx=0;
 for(let j=0;j<7;j++){
  const n=nextPrompt(CONVERSATIONS,allowed,idx,dates);assert(n);all.push(n.line.lesson);idx=n.nextIndex;
 }
 assert.deepEqual(all,[1,2,6,1,2,6,1]);
 assert.equal(promptFor(CONVERSATIONS,4,dates).verifiedLines[1].accepted.includes('今天星期四'),true);
 assert.equal(promptFor(CONVERSATIONS,4,dates).verifiedLines[1].accepted.includes('今天星期一'),false);
});
test('Panda answers supported questions and refuses unstudied topics',()=>{
 let result=answerNonStop('你好吗？',[1],null);
 assert.equal(result.kind,'question');assert.equal(result.reply.audioKey,'很好');
 result=answerNonStop('你有哥哥吗？',[1],null);
 assert.equal(result.kind,'unknown');
 result=answerNonStop('你有哥哥吗？',[1,6],null);
 assert.equal(result.kind,'question');assert.equal(result.reply.audioKey,'我有一个哥哥');
 assert.equal(answerNonStop('你几岁？',[1,6],null).kind,'unknown');
 assert.equal(answerNonStop('未知的语法',[1,2,3],null).kind,'unknown');
});
test('after learner answers, a new prompt can continue without a terminal step',()=>{
 const current=promptFor(CONVERSATIONS,6,new Date(2026,10,12));
 assert.equal(answerNonStop('我没有哥哥，我有妹妹',[1,6],current).kind,'answer');
 assert.equal(answerNonStop('我有弟弟和妹妹',[1,6],current).kind,'statement');
 const n=nextPrompt(CONVERSATIONS,[1,6],1,new Date(2026,10,12));
 assert.equal(n.line.lesson,6);
});
