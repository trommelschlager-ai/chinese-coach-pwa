/* Panda Go sakura v126 — decoration ONLY on the existing Game Practice hub.
   The approved background image, clickable areas, audio and progress are unchanged. */
(()=>{
 'use strict';
 const root=document.getElementById('topics');
 if(!root||window.__pandaSakuraV126)return;
 window.__pandaSakuraV126=true;

 const css=[
 '#topics .approved-art-hub.panda-sakura-enabled{isolation:isolate}',
 '#topics .approved-art-hub .panda-sakura-layer{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none!important;touch-action:none!important;user-select:none!important;contain:paint;container-type:size}',
 '#topics .approved-art-hub .panda-sakura-float{position:absolute;top:-9%;display:block;pointer-events:none!important;height:auto;aspect-ratio:1;opacity:0;will-change:transform,opacity;animation:panda-sakura-fall var(--duration) linear var(--delay) infinite both;filter:drop-shadow(0 2px 3px #732b8540)}',
 '#topics .approved-art-hub .panda-sakura-float svg{display:block;width:100%;height:100%;overflow:visible}',
 '#topics .approved-art-hub .panda-sakura-float.is-near{filter:drop-shadow(0 3px 5px #7d27705c)}',
 '#topics .approved-art-hub .restore-hub-stats{position:absolute;z-index:2}',
 '#topics .approved-art-hub .approved-hit{z-index:3}',
 '@keyframes panda-sakura-fall{',
 '0%{transform:translate3d(0,-25px,0) rotate(var(--spin0));opacity:0}',
 '6%{opacity:var(--alpha)}',
 '23%{transform:translate3d(var(--x1),26cqh,0) rotate(var(--spin1));opacity:var(--alpha)}',
 '47%{transform:translate3d(var(--x2),55cqh,0) rotate(var(--spin2));opacity:var(--alpha)}',
 '74%{transform:translate3d(var(--x3),86cqh,0) rotate(var(--spin3));opacity:var(--alpha)}',
 '94%{opacity:var(--alpha)}',
 '100%{transform:translate3d(var(--x4),122cqh,0) rotate(var(--spin4));opacity:0}',
 '}',
 '#topics .panda-sakura-layer.is-paused .panda-sakura-float{animation-play-state:paused}',
 '@media(prefers-reduced-motion:reduce){#topics .panda-sakura-layer{display:none!important}#topics .panda-sakura-float{animation:none!important}}'
 ].join('\n');
 const style=document.createElement('style');
 style.dataset.pandaSakura='v126';
 style.textContent=css;
 document.head.append(style);

 // Four distinct sakura silhouettes: long, heart-notched, lilac, five-petal flower.
 const shapes=[
 '<path d="M7 47C15 26 30 8 57 7c-3 22-17 41-42 47L7 47Z" fill="var(--petal)" stroke="var(--rim)" stroke-width="1.5"/><path d="M11 47C26 34 37 25 51 13" fill="none" stroke="#fff6" stroke-width="2" stroke-linecap="round"/>',
 '<path d="M32 57C15 45 5 32 8 21 11 11 20 10 28 15l4 6 4-6C44 10 53 11 56 21c3 11-7 24-24 36Z" fill="var(--petal)" stroke="var(--rim)" stroke-width="1.6"/><path d="M32 50V24" fill="none" stroke="#fff7" stroke-width="2.5" stroke-linecap="round"/>',
 '<path d="M8 51C21 25 41 13 57 8c-4 24-19 39-49 43Z" fill="var(--petal)" stroke="var(--rim)" stroke-width="1.5"/><path d="M12 48 51 15" fill="none" stroke="#fff9" stroke-width="1.8"/>',
 '<g fill="var(--petal)" stroke="var(--rim)" stroke-width="1.2"><ellipse cx="32" cy="20" rx="10" ry="15"/><ellipse cx="44" cy="29" rx="10" ry="15" transform="rotate(70 44 29)"/><ellipse cx="39" cy="45" rx="10" ry="15" transform="rotate(145 39 45)"/><ellipse cx="23" cy="45" rx="10" ry="15" transform="rotate(215 23 45)"/><ellipse cx="20" cy="29" rx="10" ry="15" transform="rotate(290 20 29)"/></g><circle cx="32" cy="34" r="5" fill="#ffe59b"/><circle cx="32" cy="34" r="2.4" fill="#e6a955"/>'
 ];
 const palettes=[
 ['#f79acb','#ffdef1'],['#e78ef4','#f8d2ff'],
 ['#ffc1dc','#fff0f7'],['#be83ed','#ead2ff'],
 ['#f18abe','#ffdaef'],['#d9a2f8','#f6e3ff']
 ];
 let seed=126041;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const petals=Array.from({length:15},(_,i)=>{
  const type=i%5===0?3:i%3;
  const [colour,rim]=palettes[(i*5+2)%palettes.length];
  const size=type===3?18+Math.round(random()*12):19+Math.round(random()*18);
  const drift=-34+random()*72,sway=12+random()*27;
  const duration=10.8+random()*8,delay=-(i/15*duration+random()*1.2);
  const spin=-75+random()*150;
  return {type,colour,rim,size,position:4+random()*90,drift,sway,duration,delay,spin,alpha:0.67+random()*0.25};
 });
 function makePetal(p,i){
  const node=document.createElement('span');
  node.className='panda-sakura-float'+(p.size>=30?' is-near':'');
  const values={
   '--duration':p.duration.toFixed(2)+'s','--delay':p.delay.toFixed(2)+'s',
   '--petal':p.colour,'--rim':p.rim,
   '--x1':(p.drift*.33+p.sway).toFixed(1)+'px',
   '--x2':(p.drift*.65-p.sway).toFixed(1)+'px',
   '--x3':(p.drift*.82+p.sway*.55).toFixed(1)+'px',
   '--x4':p.drift.toFixed(1)+'px',
   '--spin0':p.spin.toFixed(1)+'deg','--spin1':(p.spin+70).toFixed(1)+'deg',
   '--spin2':(p.spin+20).toFixed(1)+'deg','--spin3':(p.spin+160).toFixed(1)+'deg',
   '--spin4':(p.spin+200).toFixed(1)+'deg','--alpha':p.alpha.toFixed(2)
  };
  node.style.left=p.position.toFixed(1)+'%';
  node.style.width=p.size+'px';
  for(const [k,v] of Object.entries(values))node.style.setProperty(k,v);
  node.innerHTML='<svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">'+shapes[p.type]+'</svg>';
  node.dataset.petal=String(i+1);
  return node;
 }
 let layer=null;
 function install(){
  const hub=root.querySelector('.approved-art-hub.restored-hub');
  if(!hub){layer=null;return}
  const existing=hub.querySelector('.panda-sakura-layer');
  if(existing){layer=existing;return}
  const art=hub.querySelector('.approved-art-image');
  if(!art)return;
  const element=document.createElement('div');
  element.className='panda-sakura-layer';
  element.setAttribute('aria-hidden','true');
  element.setAttribute('role','presentation');
  element.append(...petals.map(makePetal));
  art.insertAdjacentElement('afterend',element);
  hub.classList.add('panda-sakura-enabled');
  layer=element;
  setPause();
 }
 function setPause(){if(layer)layer.classList.toggle('is-paused',document.hidden)}
 install();
 // Game engine replaces root's child when switching screens; only reattach to the hub.
 const observer=new MutationObserver(install);
 observer.observe(root,{childList:true});
 document.addEventListener('visibilitychange',setPause);
 window.__pandaSakuraQA={getCount:()=>layer&&layer.isConnected?layer.children.length:0};
})();