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
    // load/complete can precede decoding. A PNG is NOT visually ready until decode resolves.
    function showDecoded(){
     if(img.dataset.artDecodeStarted==='1')return;
     img.dataset.artDecodeStarted='1';
     const decoded=typeof img.decode==='function'?img.decode():Promise.resolve();
     Promise.resolve(decoded).then(function(){
      if(!img.isConnected)return;
      art.classList.add('ready');
      art.classList.remove('failed');
     }).catch(function(){
      if(!img.isConnected)return;
      if(img.complete&&img.naturalWidth>0)art.classList.add('ready');
      else{art.classList.add('failed');frame.setAttribute('aria-label','Изображение не загружено. Обнови страницу.')}
     });
    }
    if(img.complete&&img.naturalWidth>0)showDecoded();
    else if(!img.dataset.artLoadBound){
     img.dataset.artLoadBound='1';
     img.addEventListener('load',showDecoded,{once:true});
     img.addEventListener('error',function(){if(img.isConnected){art.classList.add('failed');frame.setAttribute('aria-label','Изображение не загружено. Обнови страницу.')}},{once:true});
    }
   }
   const width=img?.naturalWidth||ORIGINAL_WIDTH,height=img?.naturalHeight||ORIGINAL_HEIGHT;
   const scale=Math.min(frame.clientWidth/width,frame.clientHeight/height);
   art.style.width=(width*scale)+'px';
   art.style.height=(height*scale)+'px';
   // Account for the letterbox created by preserving the exact illustration ratio.
   // Independent sky/lake decorations fill ONLY the unused upper and lower margins.
   // Measure the rendered DOM: important legacy CSS may override inline dimensions.
   const frameBox=frame.getBoundingClientRect();
   const artBox=art.getBoundingClientRect();
   const upper=Math.max(0,Math.ceil(artBox.top-frameBox.top)+1);
   const lower=Math.max(0,Math.ceil(frameBox.bottom-artBox.bottom)+1);
   frame.style.setProperty('--pg403-top-gap',upper+'px');
   frame.style.setProperty('--pg403-bottom-gap',lower+'px');
  });
 }
 window.addEventListener('resize',function(){requestAnimationFrame(fit)},{passive:true});
 window.PandaGoApprovedV391=Object.freeze({fit:fit});
})();
