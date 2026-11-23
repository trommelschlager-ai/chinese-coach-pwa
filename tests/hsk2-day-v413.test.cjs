'use strict';
/* Compatibility regression for the original interactive HSK2 day engine.
 * The current course welcome CTA deliberately opens hsk2-about-me.html;
 * v414 and v433 wrap this engine in other approved screens. Test the engine
 * directly without requiring its retired welcome-page markup or device TTS.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('hsk2-life-course.html','utf8');
for(const script of [
 'hsk2-day-first-ui-v1.js','hsk2-six-screens-v414.js',
 'hsk2-exact-overlay-v415.js','hsk2-storyboard-v439.js'
 ]) assert(html.includes(script),'Current HSK2 course must preserve '+script);
const live=fs.readFileSync('assets/hsk2-life-course-app-v1.js','utf8');
assert.match(live,/function openFirstLesson\(step\)\s*\{[\s\S]*?hsk2-about-me\.html/,
 'Welcome CTA still opens the current approved first lesson');
const dom=new JSDOM('<!doctype html><html><body><main id="screen"></main></body></html>',{
 url:'https://panda.test/hsk2-life-course.html',runScripts:'outside-only'});
const w=dom.window,d=w.document;
for(const file of [
 'assets/hsk2-life-course-data-v1.js',
 'assets/hsk2-day-first-data-v1.js',
 'assets/hsk2-day-topic-one-v391.js',
 'assets/hsk2-day-first-ui-v1.js'
 ])w.eval(fs.readFileSync(file,'utf8'));
assert.equal(w.PandaGoDayModulesV391.length,3,'Three day mini-lessons remain defined');
assert.deepEqual(Array.from(w.PandaGoDayModulesV391,x=>x.words.length),[7,7,6]);
let played=0,spoken=[],completed=0;
w.PandaHsk2AudioV330={lookup(zh){return zh==='我起床以后洗脸'?'sample.mp3':null},
 play(){played++;return true},stop(){}};
const ui=w.PandaGoDayFirstUIV1;
assert(ui&&typeof ui.render==='function'&&typeof ui.handle==='function');
const state={view:'lesson',topic:0,mini:0,stage:0,showPy:true,day:ui.makeState(0)};
const ctx={sound(zh){
 const available=!!w.PandaHsk2AudioV330.lookup(zh);
 return available?'<button class="audio" data-sound="'+zh+'">🔊</button>':
  '<span class="audio hsk2-no-mp3" role="status">MP3 нет</span>';
}};
const api={
 render(){d.getElementById('screen').innerHTML=ui.render(state,ctx)},
 go(v){throw Error('Unexpected navigation: '+v)},
 deviceSound(zh){spoken.push(zh)},
 complete(){completed++}
};
function click(selector){
 const button=d.querySelector(selector);
 assert(button,'Missing real v413 control '+selector+' at stage '+state.stage);
 assert(!button.disabled,'Disabled '+selector);
 const handled=ui.handle(button,state,api);
 assert.equal(handled,true,'Active handler must handle '+selector);
}
api.render();
assert(d.querySelector('.day-visual-start img[src="./assets/approved-course-v390/day-lesson.png"]'),
 'Original approved v413 image stays in its own fallback module');
click('[data-day-poster-audio]');
assert.deepEqual(spoken,['起床'],'The original poster audio requests exactly 起床');
click('[data-day-show-words]');
assert.equal(d.querySelectorAll('.day-vword').length,7);
assert(d.querySelector('.day-headword').textContent.includes('起床'));
assert(d.querySelector('.day-recorded-example [data-sound="我起床以后洗脸"]'),
 'Existing sentence MP3 must not be mislabelled as a standalone-word recording');
click('[data-day-next]');
assert.equal(state.stage,1);
assert.match(d.querySelector('.day-formula').textContent,/七点/);
click('[data-day-next]');
assert.equal(state.stage,2);
assert.equal(d.querySelectorAll('.day-attempts>div').length,5);
click('[data-day-speech-word="4"]');
assert.match(d.querySelector('.day-speechhero .hsk2-no-mp3').textContent,/MP3 нет/,
 'Unknown standalone audio must show an honest unavailable status');
assert.equal(played,0,'Missing MP3 must not play a replacement');
assert.deepEqual(spoken,['起床'],'No additional speech request for unavailable audio');
click('[data-day-next]');
assert.equal(state.stage,3);
assert.equal(d.querySelectorAll('.day-question').length,2);
const first=w.PandaGoDayModulesV391[0];
for(let i=0;i<2;i++)click('[data-day-quiz="'+i+':'+first.quiz[i].answer+'"]');
for(let i=0;i<first.builder.length;i++)click('[data-day-token="'+i+'"]');
click('[data-day-next]');
assert.equal(state.stage,4,'Completion requires the correct quiz and ordered sentence');
assert.equal(d.querySelectorAll('.day-dialogue').length,4);
click('[data-day-next]');
assert.equal(completed,1,'Original engine still signals completion once');
dom.window.close();
console.log('PASS HSK2 v413 compatibility: 7/7/6 words, original fallback art, honest exact MP3, 5 stages, quiz gate and completion. Production HSK2 v433 is tested separately.');
