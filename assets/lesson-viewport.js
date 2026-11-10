/* One visible-viewport contract for all seven standalone lessons.
   Footer remains in flow; only lesson content scrolls. No progress is touched. */
(()=>{'use strict';
 const root=document.documentElement;
 function fit(){
  const v=window.visualViewport;
  // During pinch zoom keep the layout stable, allowing native panning.
  if(v && Math.abs(v.scale-1)>.01)return;
  const h=Math.floor(Math.min(window.innerHeight,v?.height||window.innerHeight));
  if(h>0)root.style.setProperty('--pg-visible-height',h+'px');
 }
 fit();window.addEventListener('resize',fit,{passive:true});
 window.visualViewport?.addEventListener('resize',fit,{passive:true});
 window.visualViewport?.addEventListener('scroll',fit,{passive:true});
 window.addEventListener('pageshow',fit,{passive:true});
})();
