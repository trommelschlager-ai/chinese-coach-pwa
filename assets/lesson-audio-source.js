/* Playback source disclosure; keep educational prompts and state unchanged. */
(()=>{'use strict';
 const selector='[data-say],[data-audio],[data-play],[data-tone-play],[data-study]';
 document.addEventListener('click',event=>{
  const button=event.target.closest(selector);if(!button||button.disabled)return;
  // Hide debug voice credits on all screens of the completed lessons 5 and 7.
  const lessonNumber=document.querySelector('.app')?.dataset.lesson;
  if(lessonNumber==='5'||lessonNumber==='7'){
   document.getElementById('audio-source-status')?.remove();return;
  }
  let text=button.dataset.say||button.dataset.play||button.dataset.tonePlay||button.dataset.audio||button.querySelector('strong')?.textContent||'';
  const role=button.dataset.role||'female';
  let status=document.getElementById('audio-source-status');
  if(!status){status=document.createElement('p');status.id='audio-source-status';status.setAttribute('role','status');status.style.cssText='font:12px/1.4 system-ui;text-align:center;color:#775394;margin:8px 12px';document.querySelector('.content,.pg3-scroll,.body')?.append(status)}
  if(!status)return;
  const lesson=document.querySelector('.app')?.dataset.lesson;
  const fromNative=!!window.PandaOwnerAudio?.lookup(text);
  const recovered=!!window.PandaNativeRecoveredV246?.lookup(text);
  const nativeMap=window.PANDA_HSK1_VOICES?.female||{};
  const phrase=String(text).replace(/[。！？!?]\\s*$/,'');
  const fromInline=String(nativeMap[text]||nativeMap[phrase]||'').startsWith('data:audio/mpeg;base64,');
  const isOwner=recovered||fromNative||fromInline;
  status.textContent=lesson==='7'
   ?(isOwner?'Звук v246 · оригинальный женский голос китаянки · скорость 85%.':'Нужна запись носительницы: оригинал пока не найден.')
   :lesson==='5'
   ?('Звук v246 · скорость 86%. '+(isOwner?'Оригинальная запись китаянки.':'Временный источник: нужен оригинал носительницы.'))
   :role==='male'?'Мужская роль диалога.':fromNative?'Оригинальная запись носительницы.':'Временная запись другого источника. Нужна запись носительницы.';
 },true);
})();
