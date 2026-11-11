import test from 'node:test';
import assert from 'node:assert/strict';
import {CONVERSATIONS} from '../assets/panda-live-lessons.mjs';
import {withPracticeGreeting} from '../assets/panda-live-greetings.mjs';
import {validatedVariants,readMistakes,noteMistake,hardestMistake,clearReviewedMistake,MISTAKES_KEY} from '../assets/panda-live-practice.mjs';
class MemoryStorage{
 constructor(){this.data=new Map()}
 getItem(k){return this.data.get(k)??null}
 setItem(k,v){this.data.set(k,v)}
}
test('variants for seven lessons are accepted by the real conversation verifier',()=>{
 for(const [index,base] of CONVERSATIONS.entries()){
  const lines=withPracticeGreeting(base,index%4).lines;
  for(let step=0;step<lines.length;step++){
   const variants=validatedVariants(index+1,step,lines);
   assert(variants.length>0,'Lesson '+(index+1)+' step '+step+' must have real variants');
  }
 }
 const lines=withPracticeGreeting(CONVERSATIONS[5],0).lines;
 assert(validatedVariants(6,1,lines).includes('我没有哥哥'));
 assert(validatedVariants(6,1,lines).includes('我有哥哥'));
 const weather=withPracticeGreeting(CONVERSATIONS[6],0).lines;
 assert(validatedVariants(7,1,weather).includes('今天下雨'));
 assert(validatedVariants(7,2,weather).includes('明天下雨'));
 assert(!validatedVariants(7,2,weather).includes('今天下雨'));
});
test('privacy-preserving mistakes, review priorities and offline fallback',()=>{
 const store=new MemoryStorage();
 assert.equal(hardestMistake(store,7),null);
 noteMistake(store,7,1);noteMistake(store,7,1);noteMistake(store,7,2);
 assert.deepEqual(readMistakes(store),[{lesson:7,step:1,count:2},{lesson:7,step:2,count:1}]);
 assert.equal(hardestMistake(store,7).step,1);
 assert.equal(clearReviewedMistake(store,7,1),1);
 assert.equal(hardestMistake(store,7).step,2);
 assert(!JSON.stringify(readMistakes(store)).includes('我'));
 assert(readMistakes({getItem(){throw Error('blocked')}}).length===0);
 assert.equal(noteMistake({setItem(){throw Error('blocked')},getItem(){return null}},1,0),1);
 store.setItem(MISTAKES_KEY,'{invalid-json');
 assert.deepEqual(readMistakes(store),[]);
});
