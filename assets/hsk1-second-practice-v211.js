/* Panda Go — optional HSK1 lesson 2 review and pronunciation practice.
 * Independent of lesson completion: reading/listening is always available.
 * Speech recognition explicitly reports text matching, never Mandarin tone scores.
 */
(()=>{
'use strict';
const root=document.getElementById('pg-content');
const speech=window.PG2_SPEAKING;
if(!root||!speech)return;
const params=new URLSearchParams(location.search);
let mode=['quick','full','listen'].includes(params.get('mode'))?params.get('mode'):'quick';
let playback=null,tts=null;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function stopSound(){
 if(playback){try{playback.pause()}catch{}playback.onended=null;playback.onerror=null;playback=null}
 if(tts){tts.onend=null;tts.onerror=null;tts=null}
 try{window.speechSynthesis?.cancel()}catch{}
}
function playDict(word){
 stopSound();
 const status=root.querySelector('[data-listen-status]');
 const note=text=>{if(status)status.textContent=text};
 const file=speech.audioFor(word);
 if(file){
  try{
   playback=new Audio(file);
   playback.preload='auto';playback.preservesPitch=true;playback.playbackRate=1;
   playback.onerror=()=>note('Не удалось воспроизвести запись. Попробуй ещё раз.');
   Promise.resolve(playback.play()).then(()=>note('Слушаем «'+word+'».')).catch(()=>note('Нажми ▶ ещё раз.'));
  }catch{note('Аудио недоступно на этом устройстве.')}
 }else if(window.speechSynthesis&&window.SpeechSynthesisUtterance){
  try{
   const u=new SpeechSynthesisUtterance(word);tts=u;
   u.lang='zh-CN';u.rate=.85;u.pitch=1;
   const chinese=(window.speechSynthesis.getVoices?.()||[]).filter(v=>/^zh[-_]/i.test(v.lang||''));
   u.voice=chinese.find(v=>/female|woman|xiaoxiao|tingting|huihui/i.test(v.name||''))||chinese[0]||null;
   u.onstart=()=>note('Временная системная китайская озвучка для «'+word+'».');
   u.onerror=()=>note('Системная китайская озвучка недоступна.');
   window.speechSynthesis.speak(u);
  }catch{note('Нет записи этого выражения и системной озвучки.')}
 }else note('Для этого выражения пока нет доступного аудио.');
}
function dictionary(){
 const rows=speech.getItems().map(([zh,py,ru])=>{
  const needsSystem=!speech.audioFor(zh);
  return '<div class="pg11-dict-row"><div class="pg11-dict-text"><strong lang="zh-Hans">'+esc(zh)+'</strong>'+
   '<span>'+esc(py)+'</span><small>'+esc(ru)+'</small></div>'+
   '<button type="button" data-dict-play="'+esc(zh)+'" aria-label="Слушать '+esc(zh)+'">▶</button>'+
   (needsSystem?'<small class="pg11-dict-fallback">Системный голос</small>':'')+
   '</div>';
 }).join('');
 return '<div class="sheet pg11-dict-sheet"><h2>Твой словарь · 16 пунктов</h2>'+
  '<p class="pg11-muted">Слушай и повторяй в удобном темпе. Здесь нет обязательной проверки микрофоном.</p>'+
  '<p class="pg11-status" role="status" data-listen-status>Выбери слово и нажми ▶.</p>'+
  '<div class="pg11-dict-list">'+rows+'</div>'+
  '<p class="pg11-muted">Некоторые выражения пока озвучиваются системным китайским голосом. Он может отличаться от голоса носительницы.</p></div>';
}
function button(label,value){
 const active=mode===value;
 return '<button type="button" data-practice-mode="'+value+'" aria-pressed="'+active+'" class="'+(active?'active':'')+'">'+label+'</button>';
}
function render(){
 stopSound();
 if(mode==='listen')speech.cleanup();
 else speech.setMode(mode);
 const title=mode==='listen'?'Словарь и повторение':mode==='quick'?'Говори по-китайски':'Полная практика';
 document.title=title+' · Panda Go';
 root.innerHTML='<p class="screen-eyebrow">HSK1 · УРОК 2 · ПОВТОРЕНИЕ</p>'+
  '<h1 class="screen-title">'+title+'</h1>'+
  '<p class="screen-sub">Выбери удобный формат и занимайся в своём темпе.</p>'+
  '<nav class="pg11-mode-selector" aria-label="Режим тренировки">'+
  button('🎤 6 ключевых', 'quick')+button('🗣 Все 16','full')+button('🎧 Словарь','listen')+'</nav>'+
  (mode==='listen'?dictionary():'<div class="sheet pg11-speaking-sheet">'+speech.render()+'</div>')+
  '<p class="pg11-outro">Слушание и распознавание текста помогают тренироваться, но не гарантируют правильность китайских тонов.</p>';
 const next=new URL(location.href);
 next.searchParams.set('mode',mode);
 history.replaceState(null,'',next.pathname+next.search);
 const counter=document.getElementById('pg-practice-counter');
 if(counter)counter.textContent=mode==='quick'?'6 слов':mode==='full'?'16 слов':'Словарь';
 root.scrollTop=0;
}
root.addEventListener('click',event=>{
 const target=event.target.closest('button');if(!target||target.disabled)return;
 if(target.hasAttribute('data-practice-mode')){
  const choice=target.dataset.practiceMode;
  if(choice===mode)return;
  mode=choice;render();return;
 }
 if(target.hasAttribute('data-dict-play')){playDict(target.dataset.dictPlay);return}
});
window.addEventListener('pagehide',()=>{stopSound();speech.cleanup()});
render();
})();