import test from 'node:test';
import assert from 'node:assert/strict';
import {interpretExtendedGrammar} from '../assets/panda-unified-extended-v2.mjs';
test('extended grammar examples',()=>{for(const [q,i] of [["我对音乐感兴趣。","express-interest"],["你对中文感兴趣吗？","ask-interest"],["我对电影不太感兴趣","express-interest"],["你想喝茶还是咖啡？","ask-choice"],["我想喝茶或者咖啡","express-options"],["我去过中国","express-experience"],["我没去过上海","express-experience"],["你吃过中国菜吗？","ask-experience"],["我从北京到上海","express-route"]])assert.equal(interpretExtendedGrammar(q)?.intent,i,q);});
test('unsupported and incomplete grammar stays unhandled',()=>{for(const q of ["我对火星感兴趣","我对音乐","我想喝茶还是咖啡","你想喝茶或者咖啡","你想喝茶还是米饭","我去过","你没去过中国吗","我从北京到北京","我从北京到","我去过中国。我喜欢中文","他对音乐感兴趣吗"])assert.equal(interpretExtendedGrammar(q),null,q);});
test('96 interest combinations preserve subject target and negation',()=>{let n=0;for(const subject of ['我','他','她','我们'])for(const target of ['音乐','中文','电影','运动','历史','旅行'])for(const mod of ['','很','不','不太']){const q=subject+'对'+target+mod+'感兴趣',x=interpretExtendedGrammar(q);assert.equal(x?.target,target,q);assert.equal(x.subject,subject);assert.equal(x.negated,mod.startsWith('不'));n++;}assert.equal(n,96);});
