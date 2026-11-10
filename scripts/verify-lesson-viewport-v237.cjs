'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),{JSDOM}=require('jsdom');
const pages=['hsk1-first-v189.html','hsk1-second-v203.html','hsk1-third-v212.html','hsk1-fourth-v214.html','hsk1-fifth-v227.html','hsk1-family-v231.html','hsk1-weather-v231.html'];
for(const width of [320,360,393,430])for(const height of [568,640,780,900])for(const page of pages){
 const dom=new JSDOM(fs.readFileSync(page,'utf8'),{url:'https://panda.test/'+page,runScripts:'outside-only'}),w=dom.window;
 let resize,scroll;Object.defineProperty(w,'innerWidth',{value:width});Object.defineProperty(w,'innerHeight',{value:height});
 w.visualViewport={height:height-28,scale:1,addEventListener(type,fn){if(type==='resize')resize=fn;else if(type==='scroll')scroll=fn}};
 w.eval(fs.readFileSync('assets/lesson-viewport.js','utf8'));
 assert.equal(w.document.documentElement.style.getPropertyValue('--pg-visible-height'),height-28+'px');
 w.visualViewport.height=height-250;resize();assert.equal(w.document.documentElement.style.getPropertyValue('--pg-visible-height'),height-250+'px');
 w.visualViewport.scale=2;w.visualViewport.height=200;scroll();assert.equal(w.document.documentElement.style.getPropertyValue('--pg-visible-height'),height-250+'px');
 assert(w.document.querySelector('footer'),'Footer missing');assert(w.document.querySelector('script[src*="owner-audio-v237"]'),'Owner routing missing');w.close();
}
for(const path of ['hsk1-first-v189.css','hsk1-third-v212.css','hsk1-fourth-v219.css','panda-go-approved-lessons-v231.css']){
 const css=fs.readFileSync('assets/'+path,'utf8');assert(css.includes('var(--pg-visible-height,100svh)'));assert(css.includes('min-height:56px'));assert(css.includes('safe-area-inset-bottom'));
}
assert(!fs.readFileSync('assets/panda-go-approved-lessons-v231.css','utf8').includes('position:fixed'));
console.log('PASS 112 viewport scenarios: widths 320/360/393/430, viewport resizing, pinch zoom stability, 7 lesson shells, in-flow footer contract. DOM tests do not prove Android rendering.');
