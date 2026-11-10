/* Playback source disclosure; keep educational prompts and state unchanged. */
(()=>{'use strict';
 const selector='[data-say],[data-audio],[data-play],[data-tone-play],[data-study]';
 document.addEventListener('click',event=>{
  const button=event.target.closest(selector);if(!button||button.disabled)return;
  let text=button.dataset.say||button.dataset.play||button.dataset.tonePlay||button.dataset.audio||button.querySelector('strong')?.textContent||'';
  const role=button.dataset.role||'female';
  let status=document.getElementById('audio-source-status');
  if(!status){status=document.createElement('p');status.id='audio-source-status';status.setAttribute('role','status');status.style.cssText='font:12px/1.4 system-ui;text-align:center;color:#775394;margin:8px 12px';document.querySelector('.content,.pg3-scroll,.body')?.append(status)}
  if(!status)return;
  status.textContent=document.querySelector('.app[data-lesson="7"]')?'Временная единая женская синтезированная озвучка. Оригинальные записи носительницы сохранены для замены всего комплекта.':role==='male'?'Мужская роль диалога.':window.PandaOwnerAudio?.lookup(text)?'Оригинальная запись носительницы.':'Временная запись другого источника. Нужна запись носительницы.';
 },true);
})();
