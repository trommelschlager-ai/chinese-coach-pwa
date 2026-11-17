'use strict';
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,'assets/hsk2-day-upgrades-v441.js'),'utf8');
const html=fs.readFileSync(path.join(root,'hsk2-life-course.html'),'utf8');
const app=fs.readFileSync(path.join(root,'assets/hsk2-life-course-app-v1.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/hsk2-day-upgrades-v441.css'),'utf8');
assert(html.includes('hsk2-day-upgrades-v441.js?v=441'));
assert(html.includes('hsk2-day-upgrades-v441.css?v=441'));
assert(css.includes('#app #pg433 .pg441-wrap'));
assert(css.includes('.pg441-history'));
assert(app.includes('pg441DialogHistory'),'Chat must survive page refresh');
assert(app.includes('pg441Preset'),'Timeline time choice must survive page refresh');
let delegated=0, paints=0;
const legacy={
 makeState(mini){return {pg433Page:0,pg433Preview:false,pgApprovedCover:false}},
 render(){return '<section id="pg433"><main class="pg433-content"><h2>Existing approved lesson</h2></main><footer>Existing nav</footer></section>'},
 handle(){delegated++;return false},next(){},cancel(){}
};
const doc={addEventListener(){},querySelector(){return {value:'我每天七点起床。'}}};
const win={PandaGoDayFirstUIV1:legacy,PandaGoDayModulesV391:[{},{},{}],PandaHsk2AudioV330:{lookup:()=>null}};
vm.runInNewContext(code,{window:win,document:doc});
const api={render(){paints++}};
const upgrade=win.PandaGoDayFirstUIV1;
const day=upgrade.makeState(0),state={topic:0,mini:0,stage:4,day};
assert.equal(day.pg441DialogStep,0);
day.pg433Page=10;
let markup=upgrade.render(state,{});
assert(markup.includes('Existing approved lesson'));
assert(markup.includes('Мой распорядок по времени'));
assert(!markup.includes('pg441-steps')); // Collapsed by default, no overloaded lesson.
upgrade.handle({dataset:{pg441Timeline:''}},state,api);
markup=upgrade.render(state,{});
assert(markup.includes('07:00'));
assert(markup.includes('我早上七点起床。'));
assert(markup.includes('07:30'));
upgrade.handle({dataset:{pg441Preset:'2'}},state,api);
markup=upgrade.render(state,{});
assert(markup.includes('我早上八点起床。'));
assert(!markup.includes('我早上七点起床。'));
for(const m of [1,2]){
 const d=upgrade.makeState(m),s={topic:0,mini:m,stage:4,day:d};d.pg433Page=10;
 upgrade.handle({dataset:{pg441Timeline:''}},s,api);
 let t=upgrade.render(s,{});
 assert(t.includes(m===1?'我早上八点上班。':'我晚上七点吃晚饭。'));
}
day.pg433Page=11;
markup=upgrade.render(state,{});
assert(markup.includes('Разговор с Пандой'));
assert(!markup.includes('pg441-answerrow')); // Conversation opt-in.
upgrade.handle({dataset:{pg441Dialog:''}},state,api);
markup=upgrade.render(state,{});
assert(markup.includes('你每天几点起床？'));
assert(markup.includes('id="pg441-answer"'));
assert(markup.includes('disabled aria-label="Распознавание речи не поддерживается"'));
upgrade.handle({dataset:{pg441Choice:'我晚上看书。'}},state,api);
assert.equal(day.pg441DialogStep,0);
assert(day.pg441Feedback.includes('Укажи время'));
upgrade.handle({dataset:{pg441Choice:'我每天七点起床。'}},state,api);
assert.equal(day.pg441DialogStep,1);
assert.equal(day.pg441DialogHistory.length,2);
markup=upgrade.render(state,{});
assert(markup.includes('你起床以后做什么？'));
assert(markup.includes('你七点起床，很好！'));
upgrade.handle({dataset:{pg441Choice:'我先洗脸，再刷牙。'}},state,api);
assert.equal(day.pg441DialogStep,2);
upgrade.handle({dataset:{pg441Choice:'我每天吃早饭。'}},state,api);
assert.equal(day.pg441DialogStep,3);
assert(upgrade.render(state,{}).includes('Три ответа приняты'));
upgrade.handle({dataset:{pg441Restart:''}},state,api);
assert.equal(day.pg441DialogStep,0);
assert.equal(day.pg441DialogHistory.length,0);
for(const m of [1,2]){
 const d=upgrade.makeState(m),s={topic:0,mini:m,stage:4,day:d};d.pg433Page=11;
 upgrade.handle({dataset:{pg441Dialog:''}},s,api);
 assert(upgrade.render(s,{}).includes(m===1?'你早上先做什么？':'你晚上常常做什么？'));
 const answers=m===1?['我先刷牙，再吃早饭。','我早上八点上班。','我下午五点下班。']:['我晚上常常看书。','我晚上十一点睡觉。','我吃晚饭以后看书。'];
 for(const x of answers)upgrade.handle({dataset:{pg441Choice:x}},s,api);
 assert.equal(d.pg441DialogStep,3);
}
state.topic=1;
assert(!upgrade.render(state,{}).includes('pg441-timeline'));
upgrade.handle({dataset:{}},state,api);assert.equal(delegated,1);
assert(paints>5);
console.log('PASS HSK2 v441: original lesson intact, timeline x3, adaptive 3-turn dialogues x3, mistakes, accessible text fallback, no fabricated audio');
