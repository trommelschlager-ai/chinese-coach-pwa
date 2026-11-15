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
   const scale=Math.min(frame.clientWidth*1.12/ORIGINAL_WIDTH,frame.clientHeight*1.02/ORIGINAL_HEIGHT);
   art.style.width=(ORIGINAL_WIDTH*scale)+'px';
   art.style.height=(ORIGINAL_HEIGHT*scale)+'px';
  });
 }
 window.addEventListener('resize',function(){requestAnimationFrame(fit)},{passive:true});
 window.PandaGoApprovedV391=Object.freeze({fit:fit});
})();
