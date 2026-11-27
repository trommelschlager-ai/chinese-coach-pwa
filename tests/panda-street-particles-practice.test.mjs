import test from 'node:test';
import assert from 'node:assert/strict';
import {createStreetParticlePractice} from '../assets/panda-street-particles-practice-v1.mjs';
test('four contextual turns and next prompt',()=>{const p=createStreetParticlePractice();assert.equal(p.start().zh,'你今天忙吗？');for(const [i,input] of ['不太忙，你呢？','好啊！','我们聊工作吧！','嗯，好。'].entries()){const a=p.answer(input);assert.equal(a.kind,'answer');assert.match(a.message,/тоны по аудио не оценивались/i);if(i<3){assert.equal(p.nextQuestion().zh,a.nextQuestion.zh);}else{assert.equal(a.nextQuestion,null);assert.equal(p.getState().done,true);}}});
test('unknown answer does not become false grammar correction',()=>{const p=createStreetParticlePractice();p.start();assert.equal(p.answer('今天有点事').kind,'clarify');assert.equal(p.getState().step,1);assert.equal(p.answer('你忙嘛？').kind,'correction');assert.equal(p.answer('你呢？').kind,'answer');});
test('restart and hints',()=>{const p=createStreetParticlePractice();p.start();p.answer('你呢');p.nextQuestion();assert.equal(p.hint().zh,'好呀！');p.start();assert.equal(p.getState().step,1);assert.equal(p.hint().zh,'不太忙，你呢？');});
