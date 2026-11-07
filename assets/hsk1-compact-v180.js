/* Panda Go v180 — compact study controls. The three approved entry screens
   and the native seven-step lesson engine remain unchanged. */
(() => {
 'use strict';
 const study=document.getElementById('lesson-study');
 const header=study?.querySelector('.pg-stage-head');
 if(!study||!header)return;
 const feedback=document.getElementById('lesson-feedback');
 const controls=study.querySelector('.lesson-controls');
 if(feedback&&controls)study.insertBefore(feedback,controls);
 const voice=document.createElement('button');
 voice.type='button';
 voice.className='pg-stage-voice';
 voice.textContent='🎧';
 voice.setAttribute('aria-label','Настройки скорости озвучки');
 voice.setAttribute('aria-controls','hsk1-female-voice-speed');
 voice.setAttribute('aria-expanded','false');
 header.appendChild(voice);
 const close=()=>{
  document.body.classList.remove('pg-voice-open');
  voice.setAttribute('aria-expanded','false');
 };
 voice.addEventListener('click',()=>{
  const opened=document.body.classList.toggle('pg-voice-open');
  voice.setAttribute('aria-expanded',String(opened));
  if(opened)document.getElementById('hsk1-female-voice-speed')?.focus({preventScroll:true});
 });
 document.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
 study.addEventListener('click',event=>{
  if(document.body.classList.contains('pg-voice-open')&&!event.target.closest('.pg-stage-voice,.hsk1-speech-speed'))close();
 });
 controls?.addEventListener('click',close);
 document.getElementById('pg-stage-back')?.addEventListener('click',close);
 const stage=document.getElementById('stage-content');
 // Keep the learner on the newly rendered task instead of the scrolled-out
 // position from an older long-format card group.
 let previous=stage?.firstElementChild;
 const observer=new MutationObserver(()=>{
  if(!window.document?.body){observer.disconnect();return}
  if(stage?.firstElementChild!==previous){
   previous=stage?.firstElementChild;
   const pane=document.getElementById('lesson-body');
   if(pane)pane.scrollTop=0;
  }
 });
 if(stage)observer.observe(stage,{childList:true});
 window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
})();