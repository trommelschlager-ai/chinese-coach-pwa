/* HSK2 v330: only exactly matching authorized Mandarin recordings. Never synthesize or splice phonemes. */
(()=>{'use strict';
const owner=()=>window.PandaOwnerAudio;
const normalized=s=>String(s||'').replace(/[。？！!?，,\s]/g,'');
const lookup=phrase=>owner()?.lookup(phrase)||null;
let active=null;
function play(phrase,report){
 const url=lookup(phrase);
 if(!url){report?.('Для «'+phrase+'» пока нет отдельного проверенного MP3.');return false}
 try{
  if(active){active.pause();active.currentTime=0}
  const a=new Audio(url);active=a;a.preload='auto';a.playbackRate=.9;
  a.addEventListener('ended',()=>{if(active===a){active=null;report?.('Запись воспроизведена.')}},{once:true});
  a.addEventListener('error',()=>{if(active===a){active=null;report?.('Не удалось загрузить MP3.')}},{once:true});
  const promise=a.play();promise?.catch?.(()=>report?.('Нажми ещё раз и проверь разрешение звука.'));return true;
 }catch{report?.('Не удалось запустить аудио.');return false}
}
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(phrase,missing=false)=>{
 const available=!!lookup(phrase);
 return available?'<button type="button" class="hsk2-clip" data-hsk2-sound="'+esc(phrase)+'" aria-label="Слушать: '+esc(phrase)+'">🔊 Слушать</button>':
 missing?'<span class="hsk2-missing-audio" title="Запись носительницы ещё не добавлена">🎧 MP3 готовится</span>':'';
};
function bind(root=document){
 root.querySelectorAll('[data-hsk2-sound]').forEach(el=>{
  if(el.dataset.bound==='1')return;el.dataset.bound='1';
  el.addEventListener('click',()=>{
   const report=m=>{const out=root.querySelector('#audio-status')||root.querySelector('.pg-sound-hint')||root.querySelector('.hsk2-clip-status');if(out)out.textContent=m};
   play(el.dataset.hsk2Sound,report);
  });
 });
}
window.PandaHsk2AudioV330=Object.freeze({lookup,play,button,bind,normalized});
})();
