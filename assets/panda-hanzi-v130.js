/* Presentation only: the original writer owns strokes, validation and progress. */
(()=>{const next=document.getElementById('next');if(!next)return;const label=()=>{next.textContent='Следующий иероглиф ›'};const obs=new MutationObserver(()=>{if(!next.textContent.startsWith('Следующий'))label()});obs.observe(next,{childList:true,characterData:true,subtree:true});label()})();
