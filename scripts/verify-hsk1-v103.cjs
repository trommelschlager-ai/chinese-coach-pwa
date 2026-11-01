// Verify additive HSK 1 roadmap and a working route to existing dictionary categories.
const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8');
const audit=JSON.parse(read('assets/hsk1-audit-v103.json'));
assert.equal(audit.hsk1_forms,300);
assert.equal(audit.covered_hsk1_forms+audit.missing_hsk1_forms,300);
assert.equal(audit.covered_hsk1_forms,141);
assert.equal(audit.basic_word_forms,193);
const html=read('index.html');
assert(html.includes('./assets/hsk1-roadmap-v103.js?v=103'));
assert(html.includes('./assets/hsk1-roadmap-v103.css?v=103'));
assert(html.indexOf('clean-learning-sections.js?v=98')<html.indexOf('hsk1-roadmap-v103.js?v=103'),'Load after existing topic router');
assert(read('sw.js').includes('./assets/hsk1-roadmap-v103.js?v=103'));
assert(read('sw.js').includes('./assets/hsk1-roadmap-v103.css?v=103'));
assert(read('assets/offline-pack.json').includes('./assets/hsk1-roadmap-v103.js'));
const d=new JSDOM('<!doctype html><main id="topics"></main>',{url:'https://example.test/',runScripts:'outside-only'});
const w=d.window,page=w.document.querySelector('#topics'),calls=[];let selected='';
w.openLearningTopics=kind=>{
 calls.push(kind);
 page.dataset.topicKind=kind||'course';
 page.innerHTML=kind==='words'?'<button data-clean-category="g07">Family</button>':
 '<div class="topic-grid"><button data-topic-lesson="1">Lesson 1</button></div>';
 if(kind==='words')page.querySelector('[data-clean-category="g07"]').addEventListener('click',()=>selected='g07');
};
w.eval(read('assets/hsk1-roadmap-v103.js'));
w.openLearningTopics('course');
assert.equal(page.querySelectorAll('[data-topic-lesson]').length,1,'Original lesson not replaced');
assert.equal(page.querySelectorAll('[data-hsk1-topic]').length,10,'Existing topics are mapped as supplementary practice');
assert.match(page.textContent,/141 из 300/);
const family=page.querySelector('[data-hsk1-topic="g07"]');assert(family);
family.click();assert.equal(calls.at(-1),'words');assert.equal(selected,'g07','Family card opens actual existing family vocabulary');
w.openLearningTopics('course');assert.equal(page.querySelectorAll('.hsk1-roadmap').length,1,'No duplicate roadmap');
w.openLearningTopics('dialogues');assert(!page.querySelector('.hsk1-roadmap'),'Other sections remain untouched');
console.log('HSK 1 v103 roadmap: 141/300 factual audit, ten existing categories, old lessons and navigation preserved.');
d.window.close();
