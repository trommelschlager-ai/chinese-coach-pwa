/* Panda Go v127: approved v3 menu + continuous Sakura, navigation-only enhancement.
   Preserve original lesson menu, course progress, audio, game and offline system. */
(()=>{
'use strict';
const menu=document.getElementById('launch-menu');
if(!menu||menu.dataset.pandaV3==='1')return;
const backing=menu.querySelector('.six-screen-content');
const originalCards=backing?.querySelector('.six-menu-cards');
if(!originalCards||originalCards.querySelectorAll('[data-choice]').length!==7||!originalCards.querySelector('.six-travel'))return;
menu.dataset.pandaV3='1';
const view=document.createElement('div');view.className='panda-v3-view';
view.innerHTML=`
<img class="panda-v3-art" src="./assets/menu-v3-approved.webp" width="941" height="1672" alt="" aria-hidden="true" decoding="async">
<div class="panda-v3-petals" aria-hidden="true"></div>
<div class="panda-v3-live-stats" aria-label="Твой игровой прогресс"><span>🔥 Серия: <b data-v3-streak>0 дней</b></span><span>⭐ <b data-v3-points>0</b> очков</span></div>
<span class="panda-v3-lesson-counter" data-v3-step>0 из 5</span>
<div class="panda-v3-lesson-meter" aria-hidden="true"><span data-v3-meter></span></div>
<button type="button" class="panda-v3-hit panda-v3-back" data-v3-action="back" aria-label="К обложке"></button>
<button type="button" class="panda-v3-hit panda-v3-start" data-v3-action="start" aria-label="Начать занятие сегодня"></button>
<button type="button" class="panda-v3-hit panda-v3-learn" data-v3-action="learn" aria-label="Учиться: звуки, слова, иероглифы, диалоги"></button>
<button type="button" class="panda-v3-hit panda-v3-practice" data-v3-action="practice" aria-label="Тренировка, игры и тест"></button>
<button type="button" class="panda-v3-hit panda-v3-travel" data-v3-action="travel" aria-label="Путешествие по Китаю"></button>
<div class="panda-v3-overlay" hidden><div class="panda-v3-panel" role="dialog" aria-modal="true" aria-label="Выбери направление"><button class="panda-v3-close" type="button" data-v3-close>✕ Закрыть</button><h2 data-v3-title></h2><div data-v3-links></div></div></div>`;
menu.append(view);
menu.classList.add('panda-v3-active');

// Same real falling petal approach as the previously approved Game Practice.
const palettes=[['#f79acb','#ffe3f3'],['#d49af4','#f6dcff'],['#ffc1e2','#fff1fb'],['#ae7ae3','#ead5ff'],['#f392c7','#ffe0f2']];
const shapes=[
 '<path d="M8 52Q16 28 55 10Q53 37 8 52Z" fill="var(--color)" stroke="var(--edge)" stroke-width="1.7"/><path d="M15 47 49 16" stroke="#fff7" stroke-width="2" fill="none"/>',
 '<path d="M32 58C15 43 5 28 12 17 18 9 26 13 32 22 38 13 46 9 52 17c7 11-3 26-20 41Z" fill="var(--color)" stroke="var(--edge)" stroke-width="1.7"/>',
 '<path d="M9 52C18 22 35 15 56 8 50 35 34 49 9 52Z" fill="var(--color)" stroke="var(--edge)" stroke-width="1.7"/>',
 '<g fill="var(--color)" stroke="var(--edge)" stroke-width="1"><ellipse cx="32" cy="20" rx="10" ry="15"/><ellipse cx="44" cy="29" rx="10" ry="15" transform="rotate(70 44 29)"/><ellipse cx="39" cy="45" rx="10" ry="15" transform="rotate(145 39 45)"/><ellipse cx="24" cy="45" rx="10" ry="15" transform="rotate(215 24 45)"/><ellipse cx="20" cy="29" rx="10" ry="15" transform="rotate(290 20 29)"/></g><circle cx="32" cy="34" r="5" fill="#ffe8af"/>'
];
let seed=311031;function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
const petals=view.querySelector('.panda-v3-petals');
for(let i=0;i<16;i++){
 const el=document.createElement('span'),type=i%6===0?3:i%3,size=18+Math.round(random()*19);
 const duration=11+random()*7,drift=-40+random()*80,sway=12+random()*27,angle=-100+random()*200;
 el.className='panda-v3-petal';el.style.left=(4+random()*91).toFixed(1)+'%';
 const values={
 '--size':size+'px','--time':duration.toFixed(2)+'s','--delay':(-random()*duration).toFixed(2)+'s',
 '--color':palettes[i%5][0],'--edge':palettes[i%5][1],'--alpha':(.72+random()*.21).toFixed(2),
 '--x1':(drift*.3+sway).toFixed(1)+'px','--x2':(drift*.62-sway).toFixed(1)+'px',
 '--x3':(drift*.83+sway*.8).toFixed(1)+'px','--x4':drift.toFixed(1)+'px',
 '--angle0':angle.toFixed(1)+'deg','--angle1':(angle+65).toFixed(1)+'deg',
 '--angle2':(angle+135).toFixed(1)+'deg','--angle3':(angle+210).toFixed(1)+'deg',
 '--angle4':(angle+280).toFixed(1)+'deg'
 };
 for(const [k,v] of Object.entries(values))el.style.setProperty(k,v);
 el.innerHTML='<svg aria-hidden="true" viewBox="0 0 64 64">'+shapes[type]+'</svg>';
 petals.append(el);
}
function progress(){
 const s=window.courseProgress?.readGame?.()||{streak:0,points:0};
 const st=Math.max(0,Number(s.streak)||0),points=Math.max(0,Number(s.points)||0);
 const word=st%10===1&&st%100!==11?'день':st%10>=2&&st%10<=4&&(st%100<12||st%100>14)?'дня':'дней';
 view.querySelector('[data-v3-streak]').textContent=st+' '+word;
 view.querySelector('[data-v3-points]').textContent=String(points);
 let step=0;
 try{const v=JSON.parse(localStorage.getItem('chinese-coach-daily-v98')||'null');
  const d=new Date(),today=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  if(v?.day===today&&Number.isInteger(v.step))step=Math.max(0,Math.min(5,v.step));
 }catch{}
 view.querySelector('[data-v3-step]').textContent=step+' из 5';
 view.querySelector('[data-v3-meter]').style.width=(step/5*100)+'%';
}
const overlay=view.querySelector('.panda-v3-overlay');
function closeMenu(){overlay.hidden=true;view.querySelectorAll('.panda-v3-hit').forEach(b=>b.tabIndex=0)}
const options={
 learn:[['🎧 Звуки и тоны',0],['📚 Базовые слова',1],['✍️ Пишем иероглифы',2],['💬 Диалоги',3]],
 practice:[['🧠 Практика',4],['✅ Тест',5],['🎮 Игровая практика',6]]
};
function openMenu(kind){
 const links=view.querySelector('[data-v3-links]');links.replaceChildren();
 view.querySelector('[data-v3-title]').textContent=kind==='learn'?'Учиться':'Тренироваться';
 for(const [label,n] of options[kind]){
  const b=document.createElement('button');b.type='button';b.textContent=label;
  b.onclick=()=>{closeMenu();const target=originalCards.querySelector('[data-choice="'+n+'"]');if(target)target.click()};
  links.append(b);
 }
 overlay.hidden=false;view.querySelectorAll('.panda-v3-hit').forEach(b=>b.tabIndex=-1);
 view.querySelector('.panda-v3-close').focus({preventScroll:true});
}
view.addEventListener('click',e=>{
 if(e.target===overlay||e.target.closest('[data-v3-close]')){closeMenu();return}
 const b=e.target.closest('[data-v3-action]');if(!b)return;
 switch(b.dataset.v3Action){
  case 'back':document.getElementById('launch-back')?.click();return;
  case 'start':{
   const daily=menu.querySelector('.daily-start');
   if(daily)daily.click();else document.getElementById('launch-all')?.click();
   return;
  }
  case 'learn':case 'practice':openMenu(b.dataset.v3Action);return;
  case 'travel':menu.querySelector('.six-card.six-travel')?.click();return;
 }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden){closeMenu();e.stopPropagation()}});
window.addEventListener('game-progress-restored',progress);
window.addEventListener('daily-progress-restored',progress);
window.addEventListener('focus',progress);
new MutationObserver(()=>{if(!menu.hidden)progress()}).observe(menu,{attributes:true,attributeFilter:['hidden']});
progress();
window.__pandaV3QA={getPetals:()=>petals.childElementCount,refresh:progress,open:openMenu};
})();
