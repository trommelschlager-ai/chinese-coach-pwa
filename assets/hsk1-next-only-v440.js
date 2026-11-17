/* HSK1 forward navigation ONLY. Other controls retain their original styles and events.
   Pointer-up is observed on window, so a release outside never leaves a pressed control. */
(()=>{'use strict';
 if(!document.body.hasAttribute('data-pg-hsk1'))return;
 const selector='#pg-next,#pg3-next,#pg5-next';
 const timers=new Map(), down=new Map(), lastClick=new WeakMap();
 const disabled=b=>b.matches(':disabled,[aria-disabled="true"]');
 const control=t=>t instanceof Element?t.closest(selector):null;
 function clear(b){clearTimeout(timers.get(b));timers.delete(b);b.classList.remove('pg-next-is-pressed');}
 function press(b){clear(b);b.classList.add('pg-next-is-pressed');}
 function release(b,min=120){
  clearTimeout(timers.get(b));
  timers.set(b,setTimeout(()=>clear(b),min));
 }
 document.addEventListener('pointerdown',e=>{
  const b=control(e.target);if(!b||disabled(b)||e.button!==0)return;
  press(b);down.set(e.pointerId,{b,x:e.clientX,y:e.clientY});
 },{passive:true});
 document.addEventListener('pointermove',e=>{
  const entry=down.get(e.pointerId);
  if(entry&&Math.hypot(e.clientX-entry.x,e.clientY-entry.y)>12){clear(entry.b);down.delete(e.pointerId);}
 },{passive:true});
 window.addEventListener('pointerup',e=>{const entry=down.get(e.pointerId);if(entry){release(entry.b);down.delete(e.pointerId)}},{passive:true});
 window.addEventListener('pointercancel',e=>{const entry=down.get(e.pointerId);if(entry){clear(entry.b);down.delete(e.pointerId)}},{passive:true});
 document.addEventListener('keydown',e=>{const b=control(e.target);if(b&&!disabled(b)&&!e.repeat&&(e.key==='Enter'||e.key===' '))press(b)});
 document.addEventListener('keyup',e=>{const b=control(e.target);if(b&&(e.key==='Enter'||e.key===' '))release(b)});
 document.addEventListener('focusout',e=>{const b=control(e.target);if(b)clear(b)});
 // Guard rapid duplicate activation without changing or delaying a lesson's action.
 document.addEventListener('click',e=>{
  const b=control(e.target);if(!b||disabled(b))return;
  if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;
  const now=performance.now(),previous=lastClick.get(b);
  if(previous!==undefined&&now-previous<280){e.preventDefault();e.stopImmediatePropagation();return;}
  lastClick.set(b,now);press(b);release(b);
 },true);
 function reset(){for(const b of timers.keys())clear(b);for(const {b} of down.values())clear(b);down.clear();document.querySelectorAll('.pg-next-is-pressed').forEach(clear)}
 window.addEventListener('blur',reset);window.addEventListener('pageshow',reset);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)reset()});
})();
