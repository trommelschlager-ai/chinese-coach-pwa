'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const {JSDOM}=require('jsdom');
// On pull requests compare protected lessons with the actual approved base
// branch, not a stale v421 archive snapshot. CI passes the PR base SHA.
const base=process.env.PANDA_APPROVED_BASE_SHA||cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.match(base,/^[a-f0-9]{40}$/,'Approved reference must be a concrete commit SHA');
const pages=['hsk1-first-v189.html','hsk1-second-v203.html','hsk1-third-v212.html','hsk1-fourth-v214.html','hsk1-fifth-v227.html','hsk1-family-v231.html','hsk1-weather-v231.html'];
function stripAllowed(html){return html.replace(/<header\b[\s\S]*?<\/header>/,'').replace(/\s*<link rel="stylesheet" href="\.\/assets\/hsk1-headers-v421.css\?v=421">/,'').replace(/ data-pg-hsk1="[1-7]"/,'').replace(/ pg-hsk1-progress/g,'').replace(/>\s+</g,'><')}
for(const [i,p] of pages.entries()){
 const html=fs.readFileSync(p,'utf8'),d=new JSDOM(html).window.document;
 assert.equal(d.querySelectorAll('[data-pg-hsk1-header]').length,1);
 assert.equal(d.querySelector('.pg-hsk1-brand strong').textContent,'Panda Go');
 assert.equal(d.querySelector('.pg-hsk1-brand small').textContent,'Китайский с нуля');
 assert.equal(d.querySelector('.pg-hsk1-write').getAttribute('href'),'./hanzi-writing.html?lesson='+(i+1));
 assert.equal(d.querySelector('.pg-hsk1-back').getAttribute('href'),'./hsk1-map.html');
 assert(!d.querySelector('header img.pg4-logo'));
 assert.equal(d.querySelectorAll('.pg-hsk1-progress').length,1);
 if(i>=4){
  const original=cp.execFileSync('git',['show',base+':'+p],{encoding:'utf8'});
  assert.equal(stripAllowed(html),stripAllowed(original),'Only header/progress changed in '+p);
  assert(!html.includes('hsk1-controls-v421'),'No button overrides loaded in '+p);
 }
 d.defaultView.close();
}
const offline=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
for(const url of ['./assets/hsk1-headers-v421.css?v=421','./assets/hsk1-controls-v421.css?v=421','./assets/hsk1-controls-v421.js?v=421','./assets/hsk1-fourth-v220.js?v=421'])assert(offline.files.includes(url),'Offline update includes '+url);
// Real dynamic controls acquire colors; their action attributes and disabled flags survive.
(async()=>{
 const dom=new JSDOM('<body data-pg-hsk1="4"><div id="stage"></div></body>',{runScripts:'outside-only'}),w=dom.window,d=w.document;
 w.eval(fs.readFileSync('assets/hsk1-controls-v421.js','utf8'));
 d.getElementById('stage').innerHTML='<button data-next-item disabled>Дальше</button><button data-play="星期一">Слушать</button><button data-repeat="7">Повторить</button><button data-tile="0">星期</button>';
 await new Promise(resolve=>w.setTimeout(resolve,0));
 assert.equal(d.querySelector('[data-next-item]').dataset.pgControl,'primary');
 assert(d.querySelector('[data-next-item]').disabled);
 assert.equal(d.querySelector('[data-play]').dataset.pgControl,'audio');
 assert.equal(d.querySelector('[data-play]').dataset.play,'星期一');
 assert.equal(d.querySelector('[data-repeat]').dataset.pgControl,'secondary');
 assert(!d.querySelector('[data-tile]').hasAttribute('data-pg-control'),'Preserve vocabulary/tile composition');
 w.close();
 for(const path of ['hsk1-map.html','hsk1-lesson.html','assets/panda-go-approved-lessons-v231.css','assets/hsk1-fifth-v227.js','assets/panda-go-companion-v231.js']){
  const original=cp.execFileSync('git',['show',base+':'+path],{encoding:'utf8'});
  assert.equal(fs.readFileSync(path,'utf8'),original,'Protected file unchanged: '+path);
 }
 console.log('PASS v421: seven uniform scoped headers, lesson 5–7 unchanged versus approved '+base.slice(0,10)+', dynamic semantic buttons preserve actions and disabled state.');
})().catch(err=>{console.error(err);process.exitCode=1});
