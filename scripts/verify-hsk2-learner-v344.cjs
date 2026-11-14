/* Run: node scripts/verify-hsk2-learner-v344.cjs
 * Structural, content, pinyin and learner-answer regression checks.
 * Does not claim Android screenshot, audio listening or acoustic-tone validation.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const get=file=>fs.readFileSync(path.join(root,file),'utf8');
const intro=get('hsk2-introduction.html');
const start=get('hsk2-start.html');
const bridge=get('hsk1-hsk2-bridge.html');
const inline=html=>[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
let checked=0;
for(const [name,html] of [['HSK2 map',start],['Self-introduction',intro],['HSK1-HSK2 bridge',bridge]]){
 const scripts=inline(html);
 assert.ok(scripts.length>0,name+' has inline scripts');
 for(const js of scripts){new vm.Script(js,{filename:name});checked++}
}
function lessonData(html,ending,expression){
 const js=inline(html).at(-1);
 const first=js.indexOf('const WORDS=[');
 const last=js.indexOf(ending,first);
 assert.ok(first>=0&&last>first,'Lesson data source found');
 return vm.runInNewContext(js.slice(first,last)+'\n'+expression);
}
const introData=lessonData(intro,'const key=', '({WORDS,steps})');
const introSteps=introData.steps;
assert.equal(introSteps.length,12);
assert.equal(introSteps[0].kind,'model-dialogue');
assert.equal(introSteps[0].items.length,4,'Beginner dialogue is short');
assert.equal(introSteps[3].kind,'words');
assert.equal(introSteps[3].title,'Где ты живёшь?');
assert.deepEqual(Array.from(introSteps[3].items,x=>x[0]),['住','在','哪儿','莫斯科']);
assert.equal(introSteps[4].kind,'structure');
assert.equal(introSteps[7].formula,'我 + 今年 + ЧИСЛО + 岁');
assert.equal(introSteps[9].kind,'guided-practice');
assert.equal(introSteps[10].kind,'dialogue-practice');
assert.equal(introSteps[11].kind,'finish');
assert.ok(intro.includes("s.title==='Говорим своё имя'"),'Name mic attached to displayed title');
assert.ok(intro.includes("state.introLayoutVersion!==344"),'Legacy progress migration installed');
checked+=13;
const startData=lessonData(start,'const stateKey=', '({WORDS,REVIEW,sections,reviewStages,lessonStages})');
assert.equal(startData.reviewStages.length,8);
assert.equal(startData.lessonStages.length,9);
assert.equal(startData.sections.filter(x=>x[2]==='ready').length,1);
assert.ok(start.includes('reviewDone*100/reviewStages.length'));
assert.ok(start.includes('lessonDone*100/lessonStages.length'));
checked+=5;
const startJs=inline(start).at(-1);
const m=startJs.match(/const nextBlocked=[\s\S]*?;\n \$\('screen'\)/);
assert.ok(m,'Next button gating source found');
const gateCode=m[0].slice(0,m[0].lastIndexOf("\n $('screen')"));
const gate=(stage,answers={},build=[],code='lesson:1',answered)=>vm.runInNewContext(gateCode+'\nnextBlocked',{
 s:stage,state:{answers,build},code,answered
});
assert.equal(gate({kind:'doublequiz',items:[{answer:0},{answer:1}]},{'lesson:1:a':0,'lesson:1:b':0}),true,'Wrong second choice blocks navigation');
assert.equal(gate({kind:'doublequiz',items:[{answer:0},{answer:1}]},{'lesson:1:a':0,'lesson:1:b':1}),false,'Correct answers enable navigation');
assert.equal(gate({kind:'quiz',answer:1},{},[],'review:7',0),true,'Incorrect quiz blocks navigation');
assert.equal(gate({kind:'quiz',answer:1},{},[],'review:7',1),false,'Correct quiz enables navigation');
checked+=4;
const scope={window:{}};
vm.runInNewContext(get('assets/hsk2-user-voice/phrase-index-v332.js'),scope);
vm.runInNewContext(get('assets/hsk2-audio-v330.js'),scope);
const a=scope.window.PandaHsk2AudioV330;
for(const phrase of ['你好','你叫什么名字','我叫熊猫','我住在中国','住','在','我是熊猫老师','我今年三岁了','你做什么工作'])
{assert.ok(a.lookup(phrase),'Approved exact audio missing: '+phrase);checked++}
assert.equal(a.lookup('我住在莫斯科'),null,'No invented substitute audio');
checked++;
const brainScope={window:{}};
vm.runInNewContext(get('assets/panda-brain-v341.js'),brainScope);
const brain=brainScope.window.PandaBrainV341;
for(const [slot,text,ok] of [[0,'你好',true],[1,'我叫克里斯蒂安',true],[2,'我是厨师',true],[2,'我没有工作',true],[3,'我今年二十五岁',true],[4,'我住在北京',true],[2,'我是苹果',false],[4,'我住在香蕉',false]]){
 assert.equal(brain.assess(slot,text).ok,ok,text);checked++;
}
console.log('HSK2 learner v344: '+checked+' source, flow, sound-map and answer checks passed. Device and listening checks remain manual.');
