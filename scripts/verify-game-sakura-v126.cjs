/* Regression: decorative petals never alter the approved hub or game controls. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('game.html','utf8');
const js=fs.readFileSync('assets/game-sakura-petals-v126.js','utf8');
assert(html.includes('<script src="./assets/game-sakura-petals-v126.js?v=1"></script>'));
const shell='<div class="game-shell"><div class="approved-art-hub restored-hub">'+
'<img class="approved-art-image" src="./assets/game-approved-menu-v87-original.png" alt="">'+
'<h1>Игровая практика</h1><div class="restore-hub-stats">🔥 0 ⭐ 0</div>'+
'<button class="approved-hit" data-game-mode="build">Собери фразу</button>'+
'<button class="approved-hit" data-game-mode="choose">Выбери ответ</button>'+
'<button class="approved-hit" data-game-mode="listen">Слушай и выбирай</button>'+
'<button class="approved-hit" data-game-results>Результаты</button></div></div>';
const dom=new JSDOM('<!doctype html><html><head></head><body><main id="topics">'+shell+'</main></body></html>',{
 url:'https://example.test/chinese-coach-pwa/game.html',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document,root=d.getElementById('topics');
w.eval(js);
const layer=d.querySelector('.panda-sakura-layer');
assert(layer,'Hub contains petals');
assert.equal(layer.childElementCount,15,'Only fifteen decorative petals');
assert.equal(layer.getAttribute('aria-hidden'),'true');
assert.equal(layer.getAttribute('role'),'presentation');
assert.equal(layer.querySelectorAll('.panda-sakura-float svg').length,15);
assert(js.includes('prefers-reduced-motion:reduce'),'Honours reduced-motion preference');
const style=d.querySelector('style[data-panda-sakura]');
assert(style&&style.textContent.includes('pointer-events:none!important'));
assert(style.textContent.includes('infinite both'),'Petals keep falling');
assert(style.textContent.includes('26cqh')&&style.textContent.includes('122cqh'),'Visible movement down screen');
assert.equal(d.querySelectorAll('.approved-hit').length,4,'No controls removed');
let clicks=0;
root.addEventListener('click',e=>{if(e.target.closest('[data-game-mode]'))clicks++});
d.querySelector('[data-game-mode="build"]').click();
assert.equal(clicks,1,'Buttons still receive clicks');
const wait=()=>new Promise(r=>setTimeout(r,0));
(async()=>{
 // Simulate game engine navigation to a question: no overlay should remain.
 root.innerHTML='<div class="question-screen"><button data-game-check>Проверить</button></div>';
 await wait();
 assert.equal(d.querySelectorAll('.panda-sakura-layer').length,0,'No petals on question screen');
 root.innerHTML=shell;
 await wait();
 assert.equal(d.querySelectorAll('.panda-sakura-layer').length,1,'Reattaches when going back to hub');
 assert.equal(d.querySelectorAll('.panda-sakura-float').length,15,'No duplicated petals');
 assert.equal(d.querySelectorAll('style[data-panda-sakura]').length,1,'No duplicate styles');
 assert.equal(d.querySelectorAll('[data-game-mode]').length,3,'Three game modes preserved');
 w.close();
 console.log('Game sakura v126 OK: petals are decorative, loop, respect reduced motion, leave controls and questions intact.');
})().catch(e=>{console.error(e);process.exitCode=1;w.close()});
