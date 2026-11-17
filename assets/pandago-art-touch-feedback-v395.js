/* Panda Go v395 · tactile feedback for controls drawn inside approved posters.
 * Does not intercept navigation, alter audio, replace art, or fake quiz results.
 * The animation stays visible briefly even if the destination rerenders.
 */
(function(){
 'use strict';
 const SELECTOR=[
  '#poster .bs394-next',
  '#poster .bs394-bar button',
  '#poster .bs394-bar a',
  '#poster .bs394-plane .screen-hotspot',
  '#poster .bs396-crop .screen-hotspot',
  '#app .approved-art .approved-hotspot',
  '#app .day-pilot button',
  '#app .day-done button',
  '#app .day-ai-panel a',
  '#day-fixed-actions button'
 ].join(',');
 let lastPointerAt=0;
 function getControl(target){
  if(!target || typeof target.closest!=='function')return null;
  const el=target.closest(SELECTOR);
  if(!el || el.matches(':disabled') || el.getAttribute('aria-disabled')==='true')return null;
  // v417: a second yellow pulse obscures buttons drawn in the approved HSK2 poster.
  if(el.closest('.pg415-art-screen,.pg415-ai-screen'))return null;
  return el;
 }
 function activate(el,x,y){
  if(!el)return;
  el.classList.add('pg395-active');
  const box=el.getBoundingClientRect();
  const px=Number.isFinite(x)&&x>0?x:box.left+box.width/2;
  const py=Number.isFinite(y)&&y>0?y:box.top+box.height/2;
  const circle=document.createElement('span');
  circle.className='pg395-pulse';
  circle.setAttribute('aria-hidden','true');
  circle.style.left=px+'px';circle.style.top=py+'px';
  document.body.appendChild(circle);
  window.setTimeout(()=>{el.classList.remove('pg395-active');circle.remove()},490);
 }
 document.addEventListener('pointerdown',function(event){
  const el=getControl(event.target);
  if(!el)return;
  lastPointerAt=Date.now();
  activate(el,event.clientX,event.clientY);
 },{capture:true,passive:true});
 document.addEventListener('keydown',function(event){
  if(event.key!=='Enter'&&event.key!==' ')return;
  const el=getControl(event.target);
  if(el)activate(el);
 },{capture:true});
 // Synthetic click for keyboard/assistive interactions gets the same feedback.
 document.addEventListener('click',function(event){
  if(event.detail===0 && Date.now()-lastPointerAt>100){
   const el=getControl(event.target);
   if(el)activate(el);
  }
 },{capture:true});
})();
