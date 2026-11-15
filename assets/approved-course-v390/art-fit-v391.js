/* Panda Go v391: use the three approved 941x1672 assets without stretching.
   Hotspots are positioned on the image's own coordinate plane, not screen %.
   Progress numbers are real overlays replacing the static 0/3 in the illustration. */
(function(){
 'use strict';
 const ORIGINAL_WIDTH=941,ORIGINAL_HEIGHT=1672;
 function fit(){
  document.querySelectorAll('.approved-stage').forEach(function(frame){
   const art=frame.querySelector('.approved-art');
   if(!art||!frame.clientWidth||!frame.clientHeight)return;
   const img=art.querySelector('img');
   if(img){
    if(img.complete&&img.naturalWidth>0)art.classList.add('ready');
    else if(!img.dataset.artLoadBound){
     img.dataset.artLoadBound='1';
     img.addEventListener('load',function(){art.classList.add('ready')},{once:true});
     img.addEventListener('error',function(){art.classList.add('failed');frame.setAttribute('aria-label','Изображение не загружено. Обнови страницу.')},{once:true});
    }
   }
   const scale=Math.min(frame.clientWidth*1.12/ORIGINAL_WIDTH,frame.clientHeight*1.02/ORIGINAL_HEIGHT);
   art.style.width=(ORIGINAL_WIDTH*scale)+'px';
   art.style.height=(ORIGINAL_HEIGHT*scale)+'px';
  });
 }
 window.addEventListener('resize',function(){requestAnimationFrame(fit)},{passive:true});
 window.PandaGoApprovedV391=Object.freeze({fit:fit});
})();
