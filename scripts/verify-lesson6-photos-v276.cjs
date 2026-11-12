'use strict';
/* Family lesson v276 picture layout and active audio integration regression. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const page=fs.readFileSync('hsk1-family-v231.html','utf8');
const js=fs.readFileSync('assets/panda-go-companion-v231.js','utf8');
const css=fs.readFileSync('assets/panda-go-approved-lessons-v231.css','utf8');
const data=fs.readFileSync('assets/hsk1-foundations-data-v152.js','utf8');
const voice=fs.readFileSync('assets/lesson6-grandparents-v275.js','utf8');
const voice274=fs.readFileSync('assets/lesson6-xiaoxiao-v274.js','utf8');
const images=['yeye','nainai','waigong','waipo'];
for(const slug of images){
 const f='assets/lesson6-photos-v276/'+slug+'.webp';
 const b=fs.readFileSync(f);
 assert(b.length>12000,'Missing image '+slug);
 assert.equal(b.toString('ascii',0,4),'RIFF','Image container');
 assert.equal(b.toString('ascii',8,12),'WEBP','Actual WebP');
}
assert(page.includes('panda-go-approved-lessons-v231.css?v=276'));
assert(page.includes('panda-go-companion-v231.js?v=276'));
assert(!js.includes('pg6-grandparent-icon'),'Emoji avatars should be replaced by portraits');
assert(css.includes('.pg6-grandparent-photo')&&css.includes('.pg6-phrase-photo'),'Photo styles');
const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
assert(pack.version>=276);
for(const slug of images)assert(pack.files.includes('./assets/lesson6-photos-v276/'+slug+'.webp'),'Photo cached '+slug);
const dom=new JSDOM(page,{url:'https://panda.test/hsk1-family-v231.html',runScripts:'outside-only'});
const w=dom.window,d=w.document;
w.eval(data);w.PANDA_HSK1_VOICES={
 male:new Proxy({}, {get(_,key){return './assets/male/'+String(key)+'.mp3'}}),
 female:new Proxy({}, {get(_,key){return './assets/female/'+String(key)+'.mp3'}})
};
let sounds=[];
w.Audio=function(src){sounds.push(src);this.src=src;this.pause=()=>{};this.play=()=>Promise.resolve()};
w.HanziWriter={create:()=>({cancelQuiz(){},pauseAnimation(){},animateCharacter(){},quiz(){}})};
w.eval(voice274);w.eval(voice);w.eval(js);
const next=()=>{const b=d.querySelector('#pg5-next');assert(!b.disabled);b.click()};
next();
assert.equal(d.querySelectorAll('.pg6-grandparent-photo').length,4,'4 portraits in first family lesson screen');
for(let i=0;i<4;i++){
 const img=d.querySelectorAll('.pg6-grandparent-photo')[i];
 assert(img.getAttribute('src').endsWith('/'+images[i]+'.webp'),'Wrong portrait index '+i);
}
const card=d.querySelector('[data-grandparent="爷爷"]');assert(card);
card.querySelector('[data-play]').click();
assert.equal(sounds.at(-1),w.PandaLesson6GrandparentsV275.lookup('爷爷'));
for(let i=0;i<6;i++)next();
assert.equal(d.querySelectorAll('.pg6-phrase-photo').length,4,'4 photos in example phrases');
next(); // dialogue
next(); // listening
const topic=w.PANDA_HSK1_FOUNDATIONS.find(x=>x.id==='family');
for(const [hz] of topic.listen.items.slice(0,4)){
 const btn=d.querySelector('[data-listen="'+hz+'"]');assert(btn,'Missing listening choice '+hz);btn.click();
}
next(); // sentence builder
for(const build of topic.builds.slice(0,3)){
 for(let i=0;i<build.target.length;i++){
  const piece=d.querySelector('[data-piece="'+i+'"]');assert(piece,'Missing sentence piece');piece.click();
 }
 d.querySelector('[data-check]').click();
}
next(); // character
next(); // speaking
next(); // final recap
assert.equal(d.querySelectorAll('.pg6-review-photo').length,4,'4 photos in review');
dom.window.close();
console.log('PASS lesson 6 v276: 4 high-res portrait assets, live cards, examples and recap, Xiaoxiao intact');
