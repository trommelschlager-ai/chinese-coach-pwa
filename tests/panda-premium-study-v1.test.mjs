import assert from 'node:assert/strict';
import {test} from 'node:test';
import {recordReview,dueReviews,confirmedStory,createStudyStore} from '../assets/panda-premium-study-v1.mjs';
const DAY=86400000;
function ok(x,msg){if(!x)throw Error(msg);assert.ok(x,msg);}
function throws(fn,msg){let thrown=false;try{fn()}catch{thrown=true}ok(thrown,msg)}
test('study review intervals, persistence and explicit story confirmation',()=>{
const mem=new Map(),storage={getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,v),removeItem:k=>mem.delete(k)};
const x=createStudyStore(storage,"learner-a"),y=createStudyStore(storage,"learner-b");
const input={lessonId:"hsk2-1",wordId:"laizi",now:1000,correct:true};
ok(x.record(input)===null,"first correct");
ok(x.record({...input,correct:false}).mistakes===1,"mistake");
ok(x.due(1000).length===1,"due");
ok(x.record({...input,now:2000}).dueAt===2000+DAY,"day one");
ok(x.due(2000).length===0,"not due");
ok(x.record({...input,now:2000+DAY}).dueAt===2000+4*DAY,"three days");
ok(x.record({...input,now:2000+4*DAY,correct:false}).streak===0,"reset");
ok(y.due(8*DAY).length===0,"owner isolation");
const story={lessonId:"hsk2-1",title:"О себе",now:2000,lines:[{zh:"我工作。",py:"Wǒ gōngzuò.",ru:"Я работаю."}]};
throws(()=>x.saveStory(story),"confirmation");
throws(()=>x.saveStory({...story,confirmed:true,lines:[{zh:"我叫…",py:"Wǒ jiào …",ru:"Меня зовут"}]}),"incomplete");
ok(x.saveStory({...story,confirmed:true}).lines.length===1,"confirmed");
ok(createStudyStore(storage,"learner-a").stories()[0].lines[0].zh==="我工作。","reload");
ok(y.stories().length===0,"story isolation");
x.deleteStory("hsk2-1");ok(x.stories().length===0,"delete");x.clear();ok(x.due(8*DAY).length===0,"clear");
});
