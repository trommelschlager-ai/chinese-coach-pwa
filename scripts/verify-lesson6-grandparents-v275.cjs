'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {JSDOM}=require('jsdom');
const root='assets/lesson6-grandparents-v275';
const meta=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
const phrases=['爷爷','奶奶','外公','外婆','这是我爷爷。','这是我奶奶。','这是我外公。','这是我外婆。'];
assert.equal(meta.clips.length,8);
for(let i=0;i<8;i++){
 const x=meta.clips[i],bytes=fs.readFileSync(root+'/'+x.file);
 assert.equal(x.hanzi,phrases[i]);assert.equal(bytes.length,x.bytes);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),x.sha256);
}
const page=fs.readFileSync('hsk1-family-v231.html','utf8');
assert(page.includes('lesson6-grandparents-v275.js?v=275'));
assert(page.includes('panda-go-companion-v231.js?v=276'));
assert(page.indexOf('lesson6-grandparents-v275.js?v=275')<page.indexOf('panda-go-companion-v231.js?v=276'));
const css=fs.readFileSync('assets/panda-go-approved-lessons-v231.css','utf8');
assert(css.includes('pg6-grandparents-grid')&&css.includes('data-lesson="6"'));
const js=fs.readFileSync('assets/panda-go-companion-v231.js','utf8');
const data=fs.readFileSync('assets/hsk1-foundations-data-v152.js','utf8');
const map=fs.readFileSync('assets/lesson6-grandparents-v275.js','utf8');
const v274=fs.readFileSync('assets/lesson6-xiaoxiao-v274.js','utf8');
const dom=new JSDOM(page,{url:'https://panda.test/hsk1-family-v231.html',runScripts:'outside-only'});
const w=dom.window,d=w.document;w.eval(data);
w.PANDA_HSK1_VOICES={
 male:new Proxy({},{get(_,key){return './assets/male/'+String(key)+'.mp3'}}),
 female:new Proxy({},{get(_,key){return './assets/female/'+String(key)+'.mp3'}})
};
let played=[];
w.Audio=function(src){played.push(src);this.src=src;this.pause=()=>{};this.play=()=>Promise.resolve();};
w.HanziWriter={create:()=>({cancelQuiz(){},pauseAnimation(){},animateCharacter(){},quiz(){}})};
w.eval(v274);w.eval(map);w.eval(js);
const step=()=>Number(d.getElementById('pg5-count').textContent.split(' ')[0]);
const next=()=>{const el=d.querySelector('#pg5-next');assert(!el.disabled);el.click()};
const press=selector=>{const el=d.querySelector(selector);assert(el,selector);assert(!el.disabled,selector);el.click()};
assert.equal(step(),1);
next();assert.equal(step(),2);
assert.equal(d.querySelectorAll('.pg6-grandparent-card').length,4,'Four grandparent cards');
for(const hz of phrases.slice(0,4)){
 const card=[...d.querySelectorAll('.pg6-grandparent-card')].find(x=>x.dataset.grandparent===hz);
 assert(card,'Missing card '+hz);
 press('[data-play="'+hz+'"]');
 assert.equal(played.at(-1),w.PandaLesson6GrandparentsV275.lookup(hz),'Audio mismatch '+hz);
}
for(let i=3;i<=8;i++)next();
assert.equal(step(),8);
assert.equal(d.querySelectorAll('.pg6-grandparent-phrase').length,4,'Four example phrases');
for(const hz of phrases.slice(4)){
 press('[data-play="'+hz+'"]');
 assert.equal(played.at(-1),w.PandaLesson6GrandparentsV275.lookup(hz),'Sentence mismatch '+hz);
}
next();assert.equal(step(),9);
press('[data-play="这是你妈妈吗？"]');
assert(played.at(-1).startsWith('./assets/male/'),'Male role must stay male');
const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
assert(pack.version>=275);
for(const v of meta.clips)assert(pack.files.includes('./'+root+'/'+v.file));
console.log('PASS lesson 6 v275: 8 Xiaoxiao clips, live family cards, example audio, male dialogue and offline cache');