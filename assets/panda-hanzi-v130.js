/* Panda Go v135 — presentation only, HanziWriter still controls the canvas. */
(()=>{
'use strict';
const next=document.getElementById('next');
const card=document.querySelector('.drawing-card');
const lexicon=document.querySelector('.pg-hanzi-lexicon');
if(!next||!card)return;
if(lexicon&&lexicon.parentElement!==card)card.appendChild(lexicon);
if(lexicon){lexicon.style.gridRow='4';lexicon.style.gridColumn='1 / -1';}
next.style.gridRow='5';
const label=()=>{if(!next.textContent.startsWith('Следующий'))next.textContent='Следующий иероглиф ❯';};
const obs=new MutationObserver(label);
obs.observe(next,{childList:true,characterData:true,subtree:true});
label();
/* Light-weight blossoms; decoration cannot intercept drawing or buttons. */
const layer=document.createElement('div');
layer.className='pg-hanzi-petals';
layer.setAttribute('aria-hidden','true');
for(let i=0;i<13;i++){
 const el=document.createElement('i');
 el.style.setProperty('--x',((i*37+9)%100)+'%');
 el.style.setProperty('--delay',(-i*1.65)+'s');
 el.style.setProperty('--dur',(10+(i%6)*1.9)+'s');
 el.style.setProperty('--drift',((i*19)%85-42)+'px');
 layer.appendChild(el);
}
document.body.appendChild(layer);
})();