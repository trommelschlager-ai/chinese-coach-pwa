/* Presentation only: existing lesson click/audio/microphone handlers retain ownership.
   Pointer-up is observed on window, so a release outside never leaves a pressed control. */
(()=>{'use strict';
 const map=document.body.hasAttribute('data-pg-hsk1-map');
 if(!map&&!document.body.hasAttribute('data-pg-hsk1'))return;
 const selector=map?'.hotspots a':'button,a[href],summary,[role="button"]';
 const timers=new Map(), down=new Map(), lastClick=new WeakMap();
 const disabled=b=>b.matches(':disabled,[aria-disabled="true"]');
 function paint(root){
  if(map)return;
  const nodes=[...(root.matches?.(selector)?[root]:[]),...root.querySelectorAll(selector)];
  for(const b of nodes){
   if(b.classList.contains('pg-hsk1-pink'))continue;
   b.classList.add('pg-hsk1-pink');
   const rect=b.getBoundingClientRect();
   if(b.matches('.sound-sm,.pg4-audio-icon,.app .audio')||(rect.width>0&&rect.width<=58&&Math.abs(rect.width-rect.height)<5))b.classList.add('pg-hsk1-round');
  }
 }
 if(!map){paint(document.body);new MutationObserver(records=>{
  for(const record of records)for(const n of record.addedNodes)if(n.nodeType===1)paint(n);
 }).observe(document.body,{childList:true,subtree:true});}
 const control=t=>t instanceof Element?t.closest(selector):null;
 function clear(b){clearTimeout(timers.get(b));timers.delete(b);b.classList.remove('pg-is-pressed');}
 function press(b){clear(b);b.classList.add('pg-is-pressed');}
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
 function reset(){for(const b of timers.keys())clear(b);for(const {b} of down.values())clear(b);down.clear();document.querySelectorAll('.pg-is-pressed').forEach(clear)}
 window.addEventListener('blur',reset);window.addEventListener('pageshow',reset);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)reset()});
})();
