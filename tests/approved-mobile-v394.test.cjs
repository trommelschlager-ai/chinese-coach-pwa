const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');
const read=f=>fs.readFileSync(f,'utf8');
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(read('hsk2-bastian-intro.html'),{url:'https://example.org/hsk2-bastian-intro.html',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.ResizeObserver=class{observe(){}}}});
const w=dom.window,d=w.document,played=[];
w.PandaHsk2AudioV330={lookup:()=>({file:'test.mp3'}),play:s=>played.push(s)};
w.eval(read('assets/bastian-split-v394.js'));
assert.equal(d.querySelectorAll('.bs394-page').length,2);
assert.equal(d.querySelectorAll('.bs394-page img[src$="bastian-approved-reference-v5.jpg"]').length,2);
for(let i=0;i<4;i++)d.querySelector('.bs394-page [data-audio-ref="'+i+'"]').click();
assert.deepEqual(played,['你好，我叫巴斯蒂安。','我二十五岁。','我住在莫斯科。','我是工程师。']);
d.querySelector('.bs394-page .bs394-next').click();assert.equal(d.querySelectorAll('.bs394-page')[1].hidden,false);
for(const term of ['住','在','岁','工程师'])d.querySelector('.bs394-page [data-term="'+term+'"]').click();
assert.deepEqual(played.slice(-4),['住','在','岁','工程师']);
assert.equal(d.querySelectorAll('#start').length,1,'Cloned art must not duplicate start id');
d.querySelector('.bs394-page [data-step-link="0"]').click();assert.equal(d.querySelector('#practice').hidden,false);
assert.equal(d.querySelectorAll('.word').length,10);
assert.deepEqual(errors,[]);
// Exercise fit using actual image dimensions and realistic available viewports.
for(const [width,height] of [[393,760],[360,640],[412,840],[393,600]]){
 const stage=d.createElement('div');stage.className='approved-stage';stage.innerHTML='<div class="approved-art"><img></div>';d.body.append(stage);
 Object.defineProperties(stage,{clientWidth:{value:width},clientHeight:{value:height}});
 const img=stage.querySelector('img');Object.defineProperties(img,{naturalWidth:{value:941},naturalHeight:{value:1672},complete:{value:true}});
 w.eval(read('assets/approved-course-v390/art-fit-v391.js'));w.PandaGoApprovedV391.fit();
 const art=stage.firstChild,a=parseFloat(art.style.width),b=parseFloat(art.style.height);
 assert.ok(a<=width+.01&&b<=height+.01);assert.ok(Math.abs(a/b-941/1672)<.00001);stage.remove();
}
// Every precached shell path must exist or SW installation would fail atomically.
const vm=require('node:vm');const context={self:{addEventListener(){},registration:{scope:'https://example.org/'}},URL,Set};
vm.runInNewContext(read('sw.js')+';globalThis.paths=INSTALL_SHELL;',context);
for(const f of context.paths)assert.ok(fs.existsSync(f.split('?')[0]),'Missing precache '+f);
console.log('PASS: original two slices, 4 phrase + 4 term audio bindings, practice, proportional map fit at 4 sizes, PWA shell paths. DOM/layout calculations only; no Android rendering claimed.');
w.close();
