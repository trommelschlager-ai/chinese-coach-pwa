'use strict';
/* HSK1 v291: restart finished lesson 5, 6 or 7 without wiping course achievements. */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const curriculum=fs.readFileSync('assets/hsk1-foundations-data-v152.js','utf8');
for(const lesson of [5,6,7]){
 const page=lesson===5?'hsk1-fifth-v227.html':lesson===6?'hsk1-family-v231.html':'hsk1-weather-v231.html';
 const src=lesson===5?'assets/hsk1-fifth-v227.js':'assets/panda-go-companion-v231.js';
 const dom=new JSDOM(fs.readFileSync(page,'utf8'),{url:'https://panda.test/chinese-coach-pwa/'+page,runScripts:'outside-only'});
 const win=dom.window,doc=win.document;
 win.eval(curriculum);
 win.PANDA_HSK1_VOICES={female:{},male:{}};
 win.HanziWriter={create:()=>({cancelQuiz(){},pauseAnimation(){}})};
 win.Audio=function(){this.play=()=>Promise.resolve();this.pause=()=>{}};
 const legacy=['pronouns','dates','family','weather'];
 win.localStorage.setItem('pg-hsk1-v3-complete',JSON.stringify(legacy));
 const key=lesson===5?'pg-hsk1-l5-v227':'pg-hsk1-l'+lesson+'-v231';
 win.localStorage.setItem(key,JSON.stringify({step:13,maxStep:13,listen:lesson===5?3:4,built:3,quizPassed:true,done:true}));
 win.eval(fs.readFileSync(src,'utf8'));
 const counter=doc.getElementById('pg5-count');
 assert.equal(counter.textContent,'14 из 14');
 const again=doc.querySelector('[data-restart-lesson]');
 assert(again,'Completed lesson '+lesson+' must offer full replay');
 again.click();
 const saved=JSON.parse(win.localStorage.getItem(key));
 assert.equal(saved.step,0);
 assert.equal(saved.done,false,'New attempt must start as unfinished');
 assert.equal(saved.quizPassed,false,'Review exam must be answerable again');
 assert.equal(saved.listen,0,'Listening quiz resets');
 assert.equal(saved.built,0,'Constructor resets');
 assert.deepEqual(JSON.parse(win.localStorage.getItem('pg-hsk1-v3-complete')),legacy,'Achievements must survive replay');
 assert.equal(counter.textContent,'1 из 14');
 assert(doc.getElementById('pg5-next')?.disabled===false,'Restarted lesson should be ready to begin');
 win.close();
 console.log('PASS complete replay lesson '+lesson+': fresh attempt, legacy achievements unchanged');
}
