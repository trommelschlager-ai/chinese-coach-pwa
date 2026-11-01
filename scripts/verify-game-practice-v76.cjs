const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8'),js=read('assets/game-practice-v76.js');
const dom=new JSDOM('<!doctype html><div id="topics"></div>',{url:'https://example.test/',runScripts:'outside-only'});
const w=dom.window,node=w.document.querySelector('#topics'),played=[];
w.Audio=function(src){played.push(src);this.pause=()=>{};this.play=()=>Promise.resolve()};
w.courseHumanAudio={'我':'./assets/course-human/cmn-我.mp3','你':'./assets/course-human/cmn-你.mp3','叫':'./assets/course-human/cmn-叫.mp3','吗':'./assets/course-human/cmn-吗.mp3'};
w.eval(read('assets/progress-store-v98.js'));w.eval(js);
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
  if(k===0&&han==='我')assert(played.includes('./assets/course-human/cmn-我.mp3'),'Tap on 我 must play Mandarin recording');
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
assert.equal(played.at(-1),'./assets/dialogue-voices-v73/'+api.items[0].audio);
assert.equal(node.querySelectorAll('[data-game-option]').length,3);
assert(node.querySelector('[data-game-toggle-pinyin]'),'Show Pinyin control must appear in listening');
assert.equal(node.querySelectorAll('.original-listen-py').length,0,'Listening Pinyin hidden by default');
node.querySelector('[data-game-option]').click();
assert.equal(node.querySelectorAll('.original-listen-py').length,0,'Choosing option does not reveal Pinyin');
node.querySelector('[data-game-toggle-pinyin]').click();
assert.equal(node.querySelectorAll('.original-listen-py').length,3,'Only a button press reveals Pinyin');
node.querySelector('[data-game-toggle-pinyin]').click();
assert.equal(node.querySelectorAll('.original-listen-py').length,0,'Button hides Pinyin');
node.querySelector('[data-game-check]').click();node.querySelector('[data-game-check]').click();
assert.equal(node.querySelectorAll('.original-listen-py').length,0,'Next question hides Pinyin again');
node.querySelector('[data-game-back]').click();node.querySelector('[data-game-mode="build"]').click();
assert(node.querySelector('.audit-token small')?.textContent,'Pinyin remains in phrase cards');
node.querySelector('[data-game-back]').click();node.querySelector('[data-game-mode="choose"]').click();
assert(node.querySelector('.audit-prompt .audit-pinyin')?.textContent,'Pinyin remains visible in translation mode');

// All ten questions in both choice modes, one deliberate error and retry-only review.
node.querySelector('[data-game-back]').click();
for(const mode of ['choose','listen']){
 node.querySelector('[data-game-mode="'+mode+'"]').click();
 for(let k=0;k<10;k++){
  const q=api.items[k];
  if(mode==='listen'){
   assert.equal(node.querySelectorAll('.original-listen-py').length,0);
   node.querySelector('[data-game-toggle-pinyin]').click();
   assert.equal(node.querySelectorAll('.original-listen-py').length,3);
  }
  [...node.querySelectorAll('[data-game-option]')].find(b=>k===0?!b.textContent.includes(q.ru):b.textContent.includes(q.ru)).click();
  node.querySelector('[data-game-check]').click();
  assert(node.textContent.includes(k===0?'Неверно':'Верно!'));
  assert(node.querySelector('.is-correct'));
  if(k===0)assert(node.querySelector('.is-wrong'));
  node.querySelector('[data-game-check]').click();
 }
 assert(node.textContent.includes('9 из 10'));
 const points=api.getStats().points;
 node.querySelector('[data-game-retry-errors]').click();
 assert(node.textContent.includes('1 из 1'));
 [...node.querySelectorAll('[data-game-option]')].find(b=>b.textContent.includes(api.items[0].ru)).click();
 node.querySelector('[data-game-check]').click();node.querySelector('[data-game-check]').click();
 assert.equal(api.getStats().points,points,'Review must not duplicate points');
 node.querySelector('[data-game-hub]').click();
}
node.querySelector('[data-game-mode="build"]').click();
for(let i=0;i<3;i++)node.querySelector('[data-game-token]').click();
assert.equal(node.querySelectorAll('[data-game-remove]').length,3);
node.querySelector('[data-game-token]').click();
assert.equal(node.querySelectorAll('[data-game-remove]').length,3,'No invisible fourth token');
assert(node.textContent.includes('Все места заполнены'));
node.querySelector('[data-game-remove]').click();assert.equal(node.querySelectorAll('[data-game-remove]').length,2);
node.querySelector('[data-game-clear]').click();assert.equal(node.querySelectorAll('[data-game-remove]').length,0);
assert.equal(node.querySelectorAll('[data-game-token]').length,5,'Clear restores entire bank');
const stats=api.getStats();
assert.deepEqual(JSON.parse(w.localStorage.getItem(w.courseProgress.gameKey)),JSON.parse(JSON.stringify(stats)));
assert.throws(()=>w.courseProgress.normalizeGame({points:-1},true));
console.log('V98 game verified: all 30 questions, correct/wrong feedback, hidden pinyin, clear/remove/capacity, errors-only review and progress.');
