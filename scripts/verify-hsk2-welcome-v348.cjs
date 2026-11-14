/* Run: node scripts/verify-hsk2-welcome-v348.cjs
 * Verify the actual beginner HSK2 onboarding route and first-screen content.
 * This structural interaction test does not replace checking Android rendering.
 */
'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('hsk2-start.html','utf8');
const inline=html.match(/<script>([\s\S]*?)<\/script>/);
assert(inline,'HSK2 entry must have script');
new Function(inline[1]);
const build=seen=>{
 const dom=new JSDOM(html,{url:'https://panda-go.example/hsk2-start.html#map',runScripts:'outside-only'});
 const w=dom.window;
 if(seen)w.localStorage.setItem('pg-hsk2-course-welcome-v1','1');
 w.eval(inline[1]);
 return dom;
};
let dom=build(false);
let d=dom.window.document;
const screen=()=>d.querySelector('#screen');
assert(d.querySelector('.app.welcome-view'),'First visit to #map must show course study plan');
assert.equal(d.querySelector('#course-welcome-footer').hidden,false);
assert(screen().textContent.includes('В этом курсе ты научишься'));
for(const goal of ['Говорить по-китайски','Понимать на слух','Строить предложения','Различать тоны'])assert(screen().textContent.includes(goal),goal);
for(const step of ['2–3 новых слова','Грамматика','Тоны и слух','Предложения','Разговор и тест'])assert(screen().textContent.includes(step),step);
for(const tone of ['mā','má','mǎ','mà'])assert(screen().textContent.includes(tone),'Missing tone '+tone);
assert(screen().textContent.includes('не точность тонов'),'No false acoustic-tone promise');
assert.equal(d.querySelectorAll('.pg-welcome-goal').length,4);
assert.equal(d.querySelectorAll('.pg-welcome-plan-step').length,5);
d.querySelector('#course-welcome-start').click();
assert.equal(dom.window.localStorage.getItem('pg-hsk2-course-welcome-v1'),'1');
assert(!d.querySelector('.app.welcome-view'),'Starting the course must reveal the map');
assert(d.querySelector('.journey-road'),'Course map should be visible');
assert(d.querySelector('#course-welcome-footer').hidden,'Introduction button hidden after starting');
assert(d.querySelector('a[href="#welcome"]'),'Course plan must remain available from map');
dom.window.location.hash='#welcome';
dom.window.dispatchEvent(new dom.window.Event('hashchange'));
assert(d.querySelector('.app.welcome-view'),'Course plan must be reopenable');
dom.window.close();
dom=build(true);d=dom.window.document;
assert(!d.querySelector('.app.welcome-view'),'Returning student should go directly to the map');
assert(d.querySelector('.journey-road'),'Returning student should see journey roadmap');
dom.window.close();
console.log('PASS HSK2 welcome: first-launch plan, 4 outcomes, 5 learning stages, correct tone labels, honest mic note, start CTA, map navigation, revisiting and saved preference.');
