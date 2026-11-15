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
const city=get('hsk2-city-work.html');
const sharedSkin=get('assets/hsk2-premium-v352.css');
for(const [name,doc] of [['Lesson 1',intro],['HSK2 Journey',start],['My City',city]]){
 assert(doc.includes('hsk2-premium-v352.css'),'Premium stylesheet missing: '+name);
}
for(const rule of ['.poster-lead','.vocabulary-grid','.poster-plaque','.app.hsk2-premium-map','.app.hsk2-premium-city','.bubble .chat']){
 assert(sharedSkin.includes(rule),'Shared premium design missing: '+rule);
}

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
const lessonJs=inline(intro).at(-1);
const lessonSpec=vm.runInNewContext(lessonJs.slice(lessonJs.indexOf('const KEY='),lessonJs.indexOf('const cleanState='))+
 '\n({TOTAL,WORDS,MODEL,TOKENS})');
assert.equal(lessonSpec.TOTAL,5,'First lesson has five screens');
assert.equal(lessonSpec.WORDS.length,3,'Keep the beginner vocabulary small');
assert.deepEqual(Array.from(lessonSpec.WORDS,w=>w.zh),['叫','名字','什么']);
assert.equal(lessonSpec.MODEL.answer,'我叫米沙。');
assert.equal(lessonSpec.MODEL.aPy,'Wǒ jiào Mǐshā.');
assert.equal(lessonSpec.MODEL.question,'你叫什么名字？');
assert(!intro.includes('很高兴认识你'),'Unexplained sentence excluded from first lesson');
assert(!intro.includes('我叫安东'),'Old student example excluded');
for(const marker of ['renderPlan','renderWords','renderGrammar','renderTest','renderDialogue','什'+'么 (shénme)','data-audio','data-reveal','data-mic','canAdvance','py-hidden']){
 assert(intro.includes(marker),'Required new lesson functionality: '+marker);
}
assert(intro.includes('Точной записи пока нет')&&intro.includes('имени Миша отдельной записи'),'Never synthesize missing Misha MP3');
assert(intro.includes('hsk2-premium-v352.css'),'Lesson must load approved premium design');
checked+=23;
const startData=lessonData(start,'const stateKey=', '({WORDS,REVIEW,sections,JOURNEY,reviewStages,lessonStages})');
assert.equal(startData.JOURNEY.length,10);
for(const [i,entry] of startData.JOURNEY.entries()){assert.ok(entry[2].trim(),`Missing lesson ${i+1} grammar`);assert.ok(entry[1].trim(),`Missing lesson ${i+1} title`)}
assert.ok(start.includes('journey-map-active'),'Map scroll compatibility fix required');
assert.ok(start.includes('hsk2-introduction.html'),'First lesson must open actual course');
assert(start.includes('pg-hsk2-introduction-v3'),'Map must use current intro progress');
assert(start.includes('introCount/5*100'),'Map displays five stages');
checked+=23;
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
