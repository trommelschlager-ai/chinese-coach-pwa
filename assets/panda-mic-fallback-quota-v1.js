/* Panda AI isolated microphone recovery for the quota test page.
   Browser Web Speech network failures cannot be fixed by permission prompts.
   Offer direct Chrome and Gboard dictation without altering Panda voice or AI quota.
*/
(function () {
  'use strict';
  const style=document.createElement('style');
  style.textContent=[
    '#pq-mic-fallback{position:fixed;z-index:1000000;left:12px;right:12px;bottom:calc(76px + env(safe-area-inset-bottom,0px));max-width:580px;margin:0 auto;padding:12px 14px;background:#fffaf1;color:#322641;border:2px solid #f1d6a4;border-radius:18px;box-shadow:0 8px 32px #26103f77;font:13px/1.45 system-ui}',
    '#pq-mic-fallback[hidden]{display:none!important}',
    '#pq-mic-fallback strong{display:block;font-size:14px;margin:0 0 4px}',
    '#pq-mic-fallback p{margin:0 0 7px;color:#53465a}',
    '#pq-mic-fallback .pq-actions{display:flex;gap:7px;flex-wrap:wrap}',
    '#pq-mic-fallback button{cursor:pointer;border:0;border-radius:11px;background:#6545b1;color:white;font:700 12px/1.3 system-ui;padding:9px 10px;min-height:38px}',
    '#pq-mic-fallback button.pq-secondary{background:#eee5f8;color:#513883}',
    '#pq-mic-fallback .pq-hint{font-size:11px;color:#7c5671;margin-top:6px}',
    '@media(max-height:650px){#pq-mic-fallback{bottom:12px}}'
  ].join('');
  document.head.appendChild(style);
  const root=document.createElement('aside');
  root.id='pq-mic-fallback';root.hidden=true;root.setAttribute('role','status');
  root.innerHTML=[
    '<strong>🎙 Распознавание речи недоступно в этом браузере</strong>',
    '<p>Панда не получила китайскую речь от браузерной службы. Это не означает, что микрофон телефона сломан.</p>',
    '<div class="pq-actions">',
      '<button id="pq-keyboard-voice" type="button">🎤 Диктовка клавиатуры</button>',
      '<button id="pq-copy-chrome" class="pq-secondary" type="button">📋 Ссылка для Chrome</button>',
      '<button id="pq-dismiss" class="pq-secondary" type="button">✕</button>',
    '</div>',
    '<div id="pq-mic-hint" class="pq-hint">Диктовка: нажми кнопку, затем значок 🎤 на клавиатуре Gboard. Выбери китайский язык.</div>'
  ].join('');
  document.body.appendChild(root);
  const $=id=>root.querySelector('#'+id);
  $('pq-dismiss').addEventListener('click',()=>{root.hidden=true;});
  $('pq-keyboard-voice').addEventListener('click',()=>{
    root.hidden=true;
    const input=document.getElementById('pg346-input')||document.getElementById('message');
    if(input){
      input.focus();
      try{input.scrollIntoView({block:'nearest',behavior:'smooth'});}catch{}
      const msg='Используй 🎤 на появившейся клавиатуре (Gboard), выбери китайский язык и произнеси фразу. Затем нажми ➤.';
      const display=document.getElementById('pg346-status');
      if(display){display.hidden=false;display.textContent=msg;}
    }
  });
  $('pq-copy-chrome').addEventListener('click',async()=>{
    const current=new URL(location.href);
    const addr=current.toString();
    try {
      await navigator.clipboard.writeText(addr);
      $('pq-mic-hint').textContent='✅ Ссылка скопирована. Открой приложение Chrome отдельно и вставь адрес в строку. Не открывай его через встроенный браузер ChatGPT.';
    } catch {
      $('pq-mic-hint').textContent='Открой Chrome отдельно и введи адрес страницы: '+addr;
    }
  });
  const isNetError=text=>/не отвечает через эту сеть|служба распознавания|распознавание китайской речи.*недоступно|браузер запретил службу/i.test(text);
  function connect(){
    const status=document.getElementById('pg346-status');
    if(!status)return false;
    const update=()=>{
      if(isNetError(status.textContent||''))root.hidden=false;
    };
    new MutationObserver(update).observe(status,{subtree:true,childList:true,characterData:true});
    update();
    // This page differs from the main application; preserve the exact testing URL.
    const recLink=document.getElementById('speech-chrome');
    if(recLink)recLink.href=location.href;
    return true;
  }
  if(!connect()){
    const observer=new MutationObserver(()=>{if(connect())observer.disconnect();});
    observer.observe(document.body,{childList:true,subtree:true});
  }
})();
