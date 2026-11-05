/* Panda Go v133 — presentation only: preserve HanziWriter quiz, strokes, audio, storage. */
(()=>{
'use strict';
const next=document.getElementById('next');
const card=document.querySelector('.drawing-card');
const lexicon=document.querySelector('.pg-hanzi-lexicon');
if(!next||!card)return;
if(lexicon && lexicon.parentElement!==card)card.appendChild(lexicon);if(lexicon){lexicon.style.gridRow='4';lexicon.style.gridColumn='1 / -1';next.style.gridRow='5';}
const label=()=>{next.textContent='Следующий иероглиф ›'};
const obs=new MutationObserver(()=>{if(!next.textContent.startsWith('Следующий'))label()});
obs.observe(next,{childList:true,characterData:true,subtree:true});
label();
})();