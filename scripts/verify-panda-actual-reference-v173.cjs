'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8');
const home=read('index.html'),map=read('hsk1-map.html'),js=read('assets/panda-v130.js');
const css=read('assets/panda-reference-corrections-v173.css');
const sw=read('sw.js'),pack=JSON.parse(read('assets/offline-pack.json'));
const hero='assets/panda-go-panda-only-v173.webp',scenery='assets/panda-hsk1-landscape-clean-v173.webp';
for(const p of [hero,scenery]){
 const bytes=fs.readFileSync(p);
 assert.equal(bytes.toString('ascii',0,4),'RIFF',p+' should be actual WebP');
 assert.equal(bytes.toString('ascii',8,12),'WEBP',p+' should be actual WebP');
 assert(bytes.length>30000&&bytes.length<1900000,p+' unexpected size '+bytes.length);
}
assert(home.includes('panda-reference-corrections-v173.css?v=173'));
assert(map.includes('panda-reference-corrections-v173.css?v=173'));
assert(home.includes('panda-v130.js?v=173'),'HTML must reload updated cropped panda hero');
assert(home.includes('panda-go-panda-only-v173.webp'),'HTML should preload clean approved hero');
assert(js.includes('panda-go-panda-only-v173.webp'),'Home uses real cropped approved art');
assert(!js.includes('<img src="./assets/panda-go-home-v136-clean.png"'),'Home must not use raster with baked extra button');
assert(css.includes('panda-hsk1-landscape-clean-v173.webp'),'Remove giant panda from scenic background');
assert(css.includes('height:100dvh!important'),'Full height mobile map required');
assert(css.includes('.map-shell .node[data-num="7"]')&&css.includes('.map-shell .node[data-num="1"]'));
assert(css.includes('#pg130 .pg-hsk-page .pg-hsk-level-list'),'Real HSK buttons must be above the cropped hero');
const lessonMap=new JSDOM(map,{url:'https://panda.test/hsk1-map.html',runScripts:'outside-only'});
const stage=map.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];assert(stage,'Map progress logic missing');
function mount(keys={},completed=[]){
 const dom=new JSDOM(map,{url:'https://panda.test/hsk1-map.html',runScripts:'outside-only'});
 for(const [id,state] of Object.entries(keys))dom.window.localStorage.setItem('pg-hsk1-v3-'+id,JSON.stringify(state));
 dom.window.localStorage.setItem('pg-hsk1-v3-complete',JSON.stringify(completed));
 dom.window.eval(stage);
 return dom;
}
{
 const dom=mount({foundations:{step:2,maxStep:2}});
 const d=dom.window.document;
 assert.equal(d.querySelectorAll('a.node').length,7,'All seven real lesson links must exist');
 assert.equal(d.querySelectorAll('.node.locked').length,6,'Next 6 lessons must look locked while first is incomplete');
 assert(d.querySelector('.node[data-num="1"]').classList.contains('current'),'Current lesson should remain visible');
 assert(d.querySelector('.node[data-num="7"]').getAttribute('aria-disabled')==='true');
 const lock=d.querySelector('.node[data-num="7"]');
 const click=new dom.window.MouseEvent('click',{bubbles:true,cancelable:true});
 assert.equal(lock.dispatchEvent(click),false,'Locked future lesson should reject navigation');
 assert.equal(dom.window.localStorage.getItem('pg-hsk1-v3-foundations'),JSON.stringify({step:2,maxStep:2}),'Do not overwrite progress');
 dom.window.close();
}
{
 const dom=mount({foundations:{step:6,maxStep:6,completed:true}},['foundations']);
 const d=dom.window.document;
 assert(d.querySelector('.node[data-num="1"]').classList.contains('done'),'Completed first lesson stays open');
 assert(d.querySelector('.node[data-num="2"]').classList.contains('current'),'Next lesson must unlock');
 assert.equal(d.querySelectorAll('.node.locked').length,5);
 dom.window.close();
}
{
 const all=['foundations','pronouns','numbers','weekdays','dates','family','weather'];
 const dom=mount({},all);
 assert.equal(dom.window.document.querySelectorAll('.node.locked').length,0,'Completed topics must always stay accessible');
 dom.window.close();
}
const core=JSON.parse(sw.match(/const CORE=(\[[^\n]+\])/)[1]);
assert(core.length<=131,'Mobile offline precache budget must not increase');
for(const s of ['./assets/panda-go-panda-only-v173.webp','./assets/panda-hsk1-landscape-clean-v173.webp',
 './assets/panda-reference-corrections-v173.css?v=173','./assets/panda-v130.js?v=173'])
 assert(core.includes(s),'Missing critical offline asset '+s);
assert(pack.version===173,'Full offline pack must be up to date');
for(const s of ['./assets/panda-go-panda-only-v173.webp','./assets/panda-hsk1-landscape-clean-v173.webp',
 './assets/panda-reference-corrections-v173.css?v=173','./assets/panda-v130.js?v=173'])
 assert(pack.files.includes(s),'Full course download missing '+s);
console.log('PASS v173: baked-in extra button removed by approved image crop; 7 viewport-sized lesson stops and correct saved-progress locks; 131-file offline budget.');
