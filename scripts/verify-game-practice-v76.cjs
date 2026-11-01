// V76 acceptance: ten real Chinese phrases, game modes, recorded audio and actual progress.
const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8'),pack=JSON.parse(read('assets/offline-pack.json'));
const html=read('index.html'),clean=read('assets/clean-learning-sections.js'),js=read('assets/game-practice-v76.js');
assert(html.includes('game-practice-v76.js?v=77')&&html.includes('game-practice-v76.css?v=77'));
assert(html.includes('data-choice="6"')&&html.includes("window.location.assign('./game.html')"),'Game must open isolated screen');
const game=read('game.html');
assert(game.includes('approved-v95.css?v=97'),'Approved live game artwork stylesheet loaded');
const approvedCss=read('assets/approved-v95.css');
assert(approvedCss.includes('ap-v95-choice')&&approvedCss.includes('ap-v95-build-prompt'),'Both approved interactive layouts styled');
assert(js.includes('positions.filter(id=>!session.selected.includes(id))'),'Selected tiles must be removed from the DOM grid');
assert(approvedCss.includes('#topics .ap-v95-build .ap-v95-bank{')&&approvedCss.includes('background:#f9eefa!important'),'Opaque bank hides baked-in empty squares');
assert(approvedCss.includes('top:60.45%!important')&&approvedCss.includes('background:#fcf4ff!important'),'Opaque translation cards hide baked-in duplicate labels');
assert(approvedCss.includes('background:linear-gradient(145deg,#fffaff 0%,#fff4ff 55%,#f4e6f7 100%)!important'),'Dynamic question card must be opaque to avoid printed duplicate text');
assert(swCache(read('sw.js'))==='chinese-coach-pwa-v97','PWA cache bumped to v96 for old screenshots');
function swCache(source){return source.match(/const CACHE='([^']+)'/)?.[1]}
assert(js.includes('function renderApprovedV95')&&js.includes('session.mode===\'build\'||session.mode===\'choose\''),'Approved layouts active for both modes');
for(const art of ['approved-choose-v95.webp','approved-build-v95.webp']){assert(fs.statSync('assets/'+art).size>50000,'Missing approved artwork');assert(pack.files.includes('./assets/'+art),'Approved artwork not in offline package')}
assert(game.includes('game-standalone-v80.css?v=88')&&game.includes('game-practice-v76.js?v=97'),'Game keeps working controls in its own page');
assert(js.includes('game-panda-v80.webp')&&pack.files.includes('./assets/game-panda-v80.webp'),'Polished painted panda is bundled');
assert(!game.includes('lessons-backdrop.webp'),'No old menu picture with printed text');
assert(read('assets/game-standalone-v80.css').includes('chinese-painting-daily.webp'),'Clean Chinese landscape loads');
assert(pack.files.includes('./game.html')&&pack.files.includes('./assets/game-standalone-v80.css'),'New game available in offline package');
assert(!clean.includes('data-open-game'),'No duplicate game button inside old Practice');
assert(html.includes('game-polish-v77.css?v=77'),'New illustrated CSS must load');
assert(pack.version===79);
assert(html.includes('game-immersive-v78.css?v=79'),'Approved immersive game style must load');
assert(pack.files.includes('./assets/game-immersive-v78.css'),'New game styling must work offline');
for(const p of ['./assets/game-practice-v76.js','./assets/game-practice-v76.css','./assets/game-practice-entry-v76.css','./assets/game-panda-v76.svg','./assets/game-polish-v77.css','./assets/game-landscape-v77.svg'])assert(pack.files.includes(p),'Game missing offline: '+p);
assert(game.includes('human-audio-map.js?v=90')&&!game.includes('basic-word-audio-map.js?v=66'),'Use only one Mandarin word-voice corpus in the game');
assert(!js.includes('new SpeechSynthesisUtterance')&&js.includes('window.courseHumanAudio?.[part]'),'No device TTS for game tokens');
assert(game.includes('game-crisp-build-choose-v89.css?v=94'),'Crisp new game backgrounds included');
assert(read('assets/game-crisp-build-choose-v89.css').includes('game-scene-build-v94.webp')&&read('assets/game-crisp-build-choose-v89.css').includes('game-scene-choose-v94.webp'),'Both sharp backgrounds are actively referenced');
for(const scene of ['game-scene-build-v94.webp','game-scene-choose-v94.webp']){assert(fs.statSync('assets/'+scene).size>100000,'Portrait photo must be high-resolution');assert(pack.files.includes('./assets/'+scene),'Portrait photo missing offline: '+scene);}
assert(js.includes('speakCardWord(word)'),'Selecting Chinese tokens must trigger instant pronunciation');
assert(read('assets/game-standalone-v80.css').includes('-webkit-text-stroke:1.8px #261330'),'Outlined white Chinese game headings required');
assert(game.includes('game-approved-layout-v85.css?v=87'),'Approved high-resolution art layout is connected');
assert(js.includes('game-approved-menu-v87-original.png')&&js.includes('approved-hit-build'),'Approved artwork interaction targets are ready');
const dom=new JSDOM('<!doctype html><div id="topics"></div>',{url:'https://example.test/',runScripts:'outside-only'});
const w=dom.window,node=w.document.querySelector('#topics'),played=[];
w.Audio=function(src){played.push(src);this.pause=()=>{};this.play=()=>Promise.resolve()};
w.courseHumanAudio={'我':'./assets/course-human/cmn-我.mp3','你':'./assets/course-human/cmn-你.mp3','叫':'./assets/course-human/cmn-叫.mp3','吗':'./assets/course-human/cmn-吗.mp3'};
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
assert(node.querySelector('.ap-v95-token small, .game-token small')?.textContent,'Pinyin remains in phrase cards');
node.querySelector('[data-game-back]').click();node.querySelector('[data-game-mode="choose"]').click();
assert(node.querySelector('.ap-v95-choose-prompt small, .game-prompt small')?.textContent,'Pinyin remains visible in translation mode');
console.log('V76 game passed: ten phrase assemblies, translation check, dialogue MP3, three modes, score persistence.');
