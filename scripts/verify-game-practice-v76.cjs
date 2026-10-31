// V76 acceptance: ten real Chinese phrases, game modes, recorded audio and actual progress.
const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8'),pack=JSON.parse(read('assets/offline-pack.json'));
const html=read('index.html'),clean=read('assets/clean-learning-sections.js'),js=read('assets/game-practice-v76.js');
assert(html.includes('game-practice-v76.js?v=77')&&html.includes('game-practice-v76.css?v=77'));
assert(html.includes('data-choice="6"')&&html.includes("window.openGamePractice?.()"),'Game must have a separate home-menu button');
assert(!clean.includes('data-open-game'),'No duplicate game button inside old Practice');
assert(html.includes('game-polish-v77.css?v=77'),'New illustrated CSS must load');
assert(pack.version===78);
assert(html.includes('game-immersive-v78.css?v=78'),'Approved immersive game style must load');
assert(pack.files.includes('./assets/game-immersive-v78.css'),'New game styling must work offline');
for(const p of ['./assets/game-practice-v76.js','./assets/game-practice-v76.css','./assets/game-practice-entry-v76.css','./assets/game-panda-v76.svg','./assets/game-polish-v77.css','./assets/game-landscape-v77.svg'])assert(pack.files.includes(p),'Game missing offline: '+p);
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
assert(node.querySelector('[data-game-toggle-pinyin]'),'Show Pinyin control must appear in listening');
assert.equal(node.querySelectorAll('.game-choice-pinyin').length,0,'Listening Pinyin hidden by default');
node.querySelector('[data-game-option]').click();
assert.equal(node.querySelectorAll('.game-choice-pinyin').length,0,'Choosing option does not reveal Pinyin');
node.querySelector('[data-game-toggle-pinyin]').click();
assert.equal(node.querySelectorAll('.game-choice-pinyin').length,3,'Only a button press reveals Pinyin');
node.querySelector('[data-game-toggle-pinyin]').click();
assert.equal(node.querySelectorAll('.game-choice-pinyin').length,0,'Button hides Pinyin');
node.querySelector('[data-game-check]').click();node.querySelector('[data-game-check]').click();
assert.equal(node.querySelectorAll('.game-choice-pinyin').length,0,'Next question hides Pinyin again');
node.querySelector('[data-game-back]').click();node.querySelector('[data-game-mode="build"]').click();
assert(node.querySelector('.game-token small')?.textContent,'Pinyin remains in phrase cards');
node.querySelector('[data-game-back]').click();node.querySelector('[data-game-mode="choose"]').click();
assert(node.querySelector('.game-prompt small')?.textContent,'Pinyin remains visible in translation mode');
console.log('V76 game passed: ten phrase assemblies, translation check, dialogue MP3, three modes, score persistence.');
