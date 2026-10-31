// V76 acceptance: ten real Chinese phrases, game modes, recorded audio and actual progress.
const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8'),pack=JSON.parse(read('assets/offline-pack.json'));
const html=read('index.html'),clean=read('assets/clean-learning-sections.js'),js=read('assets/game-practice-v76.js');
assert(html.includes('game-practice-v76.js?v=76')&&html.includes('game-practice-v76.css?v=76'));
assert(clean.includes('data-open-game'),'New game must be reachable from existing Practice');
assert(pack.version===76);
for(const p of ['./assets/game-practice-v76.js','./assets/game-practice-v76.css','./assets/game-practice-entry-v76.css','./assets/game-panda-v76.svg'])assert(pack.files.includes(p),'Game missing offline: '+p);
const dom=new JSDOM('<!doctype html><div id="topics"></div>',{url:'https://example.test/',runScripts:'outside-only'});
const w=dom.window,node=w.document.querySelector('#topics'),played=[];
w.Audio=function(src){played.push(src);this.pause=()=>{};this.play=()=>Promise.resolve()};
w.eval(js);
const api=w.__gamePracticeV76;
assert.equal(api.items.length,10);assert.equal(Object.keys(api.modes).length,3);
for(const q of api.items){
 assert(fs.statSync('assets/dialogue-voices-v73/'+q.audio).size>2000,'Recorded dialogue missing for '+q.id);
 assert(q.parts.length>=3);
 assert.equal(q.parts.map(t=>t[0]).join(''),q.zh.replace(/[！!。．，,？?\s]/g,''),'Wrong Mandarin order '+q.id);
}
api.open();assert.equal(node.querySelectorAll('[data-game-mode]').length,3);
node.querySelector('[data-game-mode="build"]').click();
for(let k=0;k<10;k++){
 const q=api.items[k];
 for(const [han] of q.parts){
  const tile=[...node.querySelectorAll('[data-game-token]:not(:disabled)')].find(b=>b.querySelector('strong')?.textContent===han);
  assert(tile,'Missing tile '+han+' in Q'+k);tile.click();
 }
 node.querySelector('[data-game-check]').click();
 assert(node.textContent.includes('Верно!'),'Correct phrase rejected: '+q.id);
 node.querySelector('[data-game-check]').click();
}
assert(node.textContent.includes('10 из 10'));assert.equal(api.getStats().completed,1);
assert.equal(api.getStats().points,100);
node.querySelector('[data-game-hub]').click();
node.querySelector('[data-game-mode="choose"]').click();
node.querySelector('[data-game-check]').click();assert(node.textContent.includes('Выбери один ответ.'));
const correct=[...node.querySelectorAll('[data-game-option]')].find(b=>b.textContent.includes(api.items[0].ru));
assert(correct);correct.click();node.querySelector('[data-game-check]').click();
assert(node.textContent.includes('Верно!'));
node.querySelector('[data-game-back]').click();
node.querySelector('[data-game-mode="listen"]').click();
node.querySelector('[data-game-play]').click();
assert.equal(played[0],'./assets/dialogue-voices-v73/'+api.items[0].audio);
assert.equal(node.querySelectorAll('[data-game-option]').length,3);
console.log('V76 game passed: ten phrase assemblies, translation check, dialogue MP3, three modes, score persistence.');
