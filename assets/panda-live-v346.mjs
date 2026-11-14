/* Panda AI v346. Clean responsive user-approved screen.
   Only the presentation changes: no modifications to the established HSK/audio/speech engine. */
import {lookupPandaVoiceClip} from './panda-live-audio.mjs?v=336';
const bridge=window.PandaApprovedBridge337;
if (!bridge) {
  console.error('Panda AI v346: conversation engine unavailable; keeping original screen');
} else {
  const ns='http://www.w3.org/2000/svg';
  const icons={
    chat:'<path d="M21 11.5c0 4.5-4.5 8-10 8a12 12 0 0 1-4-.7L2 21l1.5-4.2A8 8 0 0 1 1 11.5C1 7 5.5 4 11 4s10 3 10 7.5Z"/><path d="M7 11h.01m4 0h.01m4 0h.01"/>',
    infinity:'<path d="M6.5 8C2 8 2 16 6.5 16c4.5 0 6.5-8 11-8 4.5 0 4.5 8 0 8-4.5 0-6.5-8-11-8Z"/>',
    history:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
    home:'<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',
    book:'<path d="M12 6c-4-3-8-2-10-2v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-2 0-6-1-10 2Z"/><path d="M12 6v15"/>',
    game:'<path d="M6 9h12c3 0 5 2 5 6 0 2-1 4-3 4-2 0-3-3-5-3H9c-2 0-3 3-5 3-2 0-3-2-3-4 0-4 2-6 5-6Z"/><path d="M8 12v5m-2-3h4m7-1h.01m3 2h.01"/>',
    person:'<circle cx="12" cy="7" r="4"/><path d="M4 22c0-5 3-8 8-8s8 3 8 8"/>',
    send:'<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
    mic:'<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4m-5 0h10"/>',
    layers:'<path d="m12 2 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5"/>'
  };
  function icon(name){return `<svg viewBox="0 0 24 24" xmlns="${ns}" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round">${icons[name]||icons.chat}</svg>`}
  const stage=document.createElement('section');stage.id='pg346';stage.dataset.py='true';stage.dataset.ru='true';stage.dataset.listening='false';stage.setAttribute('aria-label','Pоговори с Пандой — Panda AI');
  stage.innerHTML=`
    <header class="pg346-header">
      <a class="pg346-back" href="./panda-lesson1.html" aria-label="Назад к уроку">← Назад</a>
      <div class="pg346-modes" role="group" aria-label="Режим разговора">
        <button class="pg346-mode" id="pg346-short" type="button" aria-pressed="true">${icon('chat')} Краткие диалоги</button>
        <button class="pg346-mode" id="pg346-nonstop" type="button" aria-pressed="false">${icon('infinity')} Non-Stop диалоги</button>
      </div>
      <div class="pg346-tools">
        <span class="pg346-title">${icon('chat')} Диалог с Пандой</span>
        <div class="pg346-misc"><button class="pg346-toggle" id="pg346-py" type="button" aria-pressed="true" aria-label="Показать или скрыть пиньинь">汉 Пиньинь</button><button class="pg346-toggle pg346-ru-toggle" id="pg346-ru" type="button" aria-pressed="true" aria-label="Показать или скрыть перевод">RU</button></div>
        <button class="pg346-history-btn" id="pg346-history" type="button">${icon('history')} История</button>
      </div>
    </header>
    <div class="pg346-history" id="pg346-rows" aria-label="Последние три реплики" aria-live="polite"></div>
    <section class="pg346-scene" aria-label="Панда в китайском пейзаже">
      <img class="pg346-panda" src="./assets/panda-character-v346.svg?v=346" alt="Панда с открытыми глазами, цветком, фиолетовыми наушниками и шарфом" decoding="async" draggable="false">
      <img class="pg346-sakura" src="./assets/panda-sakura-v346.svg?v=346" alt="" aria-hidden="true" decoding="async" draggable="false">
      <div class="pg346-speech" aria-label="Текущая фраза Панды" aria-live="polite">
        <strong class="pg346-main-zh">你好！</strong>
        <span class="pg346-main-py">Nǐ hǎo!</span>
        <span class="pg346-main-ru">Привет!</span>
        <div class="pg346-speech-controls"><button id="pg346-hear" type="button" aria-label="Слушать">🔊</button><button id="pg346-speed" type="button" aria-label="Изменить скорость">1× ▾</button><button id="pg346-play" type="button" aria-label="Воспроизвести ещё раз">▶</button></div>
        <button type="button" class="pg346-repeat" id="pg346-repeat">↻ Повтори</button>
      </div>
      <div class="pg346-live" id="pg346-live" data-active="false" aria-live="polite"></div>
      <div class="pg346-feedback" id="pg346-feedback" hidden aria-live="polite"></div>
      <button id="pg346-topics-btn" type="button" class="pg346-all-topics" aria-label="Все темы — выбрать урок" aria-expanded="false" aria-controls="pg346-topics">${icon('layers')}<span>Все<br>темы</span></button>
      <div class="pg346-topic-menu" id="pg346-topics" hidden><div class="pg346-topic-menu-title">Все темы HSK 1 <button id="pg346-topics-close" type="button" aria-label="Закрыть">×</button></div><div class="pg346-topic-list"></div></div>
    </section>
    <div class="pg346-composer"><form class="pg346-form" id="pg346-form"><input id="pg346-input" class="pg346-input" name="message" maxlength="160" autocomplete="off" placeholder="Напиши по-китайски…" enterkeyhint="send" aria-label="Напиши по-китайски"></form><button class="pg346-send" id="pg346-send" type="button" aria-label="Отправить">${icon('send')}</button><button class="pg346-mic" id="pg346-mic" type="button" aria-label="Ответить голосом" aria-pressed="false">${icon('mic')}</button></div>
    <nav class="pg346-nav" aria-label="Разделы Panda Go">
      <a href="./index.html#panda/home">${icon('home')}<span>Главная</span></a>
      <a href="./hsk1-map.html">${icon('book')}<span>Уроки</span></a>
      <a href="./game.html">${icon('game')}<span>Тренажёр</span></a>
      <a href="./panda-voice-pilot.html" aria-current="page">${icon('chat')}<span>Panda AI</span></a>
      <a href="./index.html#panda/settings">${icon('person')}<span>Профиль</span></a>
    </nav>`;
  const $=selector=>stage.querySelector(selector),el=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!=null)e.textContent=value;return e};
  // Dialogs must remain visible even though the legacy main is kept for its engine.
  document.querySelectorAll('main > dialog').forEach(dialog=>document.body.append(dialog));
  document.body.append(stage);document.body.classList.add('panda-clean-ready');
  let lastRows='',lastPhrase='',lastTopics='',lastFeedback='',showPy=true,showRu=true,historyAudio=null;
  const stopHistoryAudio=()=>{if(historyAudio){historyAudio.pause();historyAudio=null;}};
  function clipFor(entry){return lookupPandaVoiceClip(entry?.hanzi||entry?.panda)||lookupPandaVoiceClip(entry?.audioKey)}
  function playHistory(entry){const part=clipFor(entry);if(!part){bridge.note('🔇 Для этой фразы нет MP3-записи');return}stopHistoryAudio();bridge.stopPlayback();const a=new Audio(new URL(part.src,document.baseURI).href);historyAudio=a;a.playbackRate=bridge.snapshot().slow?.8:1;const start=Number(part.start)||0,end=Number.isFinite(part.end)?Number(part.end):null;a.onloadedmetadata=()=>{if(historyAudio===a)try{a.currentTime=start}catch{}};a.ontimeupdate=()=>{if(historyAudio===a&&end!==null&&a.currentTime>=end-.025)stopHistoryAudio()};a.onended=()=>{if(historyAudio===a)historyAudio=null};a.onerror=()=>{if(historyAudio===a){stopHistoryAudio();bridge.note('Звуковой файл не загрузился')}};a.play().catch(()=>{if(historyAudio===a){stopHistoryAudio();bridge.note('Браузер заблокировал звук. Нажми динамик ещё раз')}})}
  function renderRows(rows){const root=$('#pg346-rows');root.replaceChildren();for(const e of rows.slice(-3)){
    const row=el('article','pg346-row');const av=el('span','pg346-avatar');if(e.who==='you')av.textContent='👤';else{const img=document.createElement('img');img.src='./assets/panda-character-v346.svg?v=346';img.alt='Панда';av.append(img)}
    const text=el('div','pg346-text');text.append(el('div','pg346-zh',e.hanzi||''),el('div','pg346-py',e.pinyin||''));
    const translation=el('div','pg346-ru',e.ru||e.analysis?.probable||'Перевод пока не подтверждён');
    const sound=el('button','pg346-row-audio','🔊');sound.type='button';sound.disabled=!clipFor(e);sound.setAttribute('aria-label',sound.disabled?'Для этой фразы нет MP3':'Слушать эту реплику');sound.addEventListener('click',()=>playHistory(e));
    row.append(av,text,translation,sound);root.append(row);
  }}
  const topicsFallback=['Основы и приветствие','Местоимения','Числа и время','Дни недели','Месяцы и даты','Семья','Погода'];
  function renderTopics(s){const key=s.allowed.join(',')+'|'+s.topic;if(key===lastTopics)return;lastTopics=key;const grid=$('.pg346-topic-list');grid.replaceChildren();const options=new Map([...document.querySelectorAll('#lesson-select option')].map(o=>[Number(o.value),o.textContent.replace(/^\d+\.\s*/,'')]));for(let id=1;id<=7;id++){const b=el('button','',`${id}. ${options.get(id)||topicsFallback[id-1]}`);b.type='button';b.disabled=!s.allowed.includes(id);b.setAttribute('aria-current',String(id===s.topic));if(b.disabled)b.title='Сначала пройди урок '+id;b.addEventListener('click',()=>{if(bridge.chooseTopic(id)){closeTopics();sync()}});grid.append(b)}}
  function renderFeedback(s){const last=s.history.slice().reverse().find(x=>x.who==='you');const wrong=last?.analysis?.correction,unknown=last&&!last.ru&&!last.analysis?.probable;const root=$('#pg346-feedback');const active=!!wrong||!!unknown;const key=[last?.hanzi,wrong?.hanzi,s.feedback,active].join('|');if(key===lastFeedback)return;lastFeedback=key;root.hidden=!active;root.replaceChildren();if(!active)return;root.append(el('strong','',`Ты сказал: ${last.hanzi}`));if(wrong){root.append(el('p','',`✅ Правильно: ${wrong.hanzi}${wrong.pinyin?' · '+wrong.pinyin:''}`));if(wrong.ru)root.append(el('p','',wrong.ru));if(wrong.why)root.append(el('p','',wrong.why))}else{root.append(el('p','',last.analysis?.probable||'Полный смысл не подтверждён. Попробуй уточнить'))}}
  function sync(){const s=bridge.snapshot();stage.dataset.listening=String(s.active);$('#pg346-mic').setAttribute('aria-pressed',String(s.active));$('#pg346-short').setAttribute('aria-pressed',String(s.mode==='short'));$('#pg346-nonstop').setAttribute('aria-pressed',String(s.mode==='nonstop'));
    const a=s.current||{},phrase=[a.hanzi,a.panda,a.pinyin,a.ru,s.slow,s.audioAvailable].join('|');if(phrase!==lastPhrase){lastPhrase=phrase;$('.pg346-main-zh').textContent=a.hanzi||a.panda||'你好！';$('.pg346-main-py').textContent=a.pinyin||'';$('.pg346-main-ru').textContent=a.ru||'';$('#pg346-hear').disabled=!s.audioAvailable;$('#pg346-play').disabled=!s.audioAvailable;$('#pg346-repeat').disabled=!s.audioAvailable}
    $('#pg346-speed').textContent=s.slow?'0,8× ▾':'1× ▾';const rows=JSON.stringify(s.history.map(e=>[e.who,e.hanzi,e.pinyin,e.ru]));if(rows!==lastRows){lastRows=rows;renderRows(s.history)}
    renderFeedback(s);renderTopics(s);const live=$('#pg346-live');live.dataset.active=String(s.active||s.pose==='talking');live.textContent=s.active?'🎙 Слушаю…':s.pose==='talking'?'🔊 Панда говорит':'';
    const back=document.getElementById('back-link');if(back)$('a.pg346-back').href=back.href;
  }
  function closeTopics(){$('#pg346-topics').hidden=true;$('#pg346-topics-btn').setAttribute('aria-expanded','false')}
  function toggleTopics(){const pop=$('#pg346-topics');pop.hidden=!pop.hidden;$('#pg346-topics-btn').setAttribute('aria-expanded',String(!pop.hidden));if(!pop.hidden){renderTopics(bridge.snapshot());$('#pg346-topics-close').focus()}}
  function send(){const inp=$('#pg346-input');const value=inp.value.trim();if(!value){inp.focus();return}stopHistoryAudio();inp.value='';bridge.send(value);sync()}
  function toggle(which){if(which==='py'){showPy=!showPy;stage.dataset.py=String(showPy);$('#pg346-py').setAttribute('aria-pressed',String(showPy))}else{showRu=!showRu;stage.dataset.ru=String(showRu);$('#pg346-ru').setAttribute('aria-pressed',String(showRu))}}
  $('#pg346-form').addEventListener('submit',e=>{e.preventDefault();send()});$('#pg346-send').addEventListener('click',send);$('#pg346-mic').addEventListener('click',()=>{stopHistoryAudio();bridge.mic();sync()});
  $('#pg346-short').addEventListener('click',()=>{stopHistoryAudio();bridge.setMode('short');sync()});$('#pg346-nonstop').addEventListener('click',()=>{stopHistoryAudio();bridge.setMode('nonstop');sync()});
  $('#pg346-py').addEventListener('click',()=>toggle('py'));$('#pg346-ru').addEventListener('click',()=>toggle('ru'));
  $('#pg346-history').addEventListener('click',()=>{stopHistoryAudio();document.getElementById('history-open')?.click()});
  $('#pg346-hear').addEventListener('click',()=>{stopHistoryAudio();bridge.play();sync()});$('#pg346-play').addEventListener('click',()=>{stopHistoryAudio();bridge.play();sync()});$('#pg346-repeat').addEventListener('click',()=>{stopHistoryAudio();bridge.play();sync()});$('#pg346-speed').addEventListener('click',()=>{bridge.toggleSpeed();sync()});
  $('#pg346-topics-btn').addEventListener('click',toggleTopics);$('#pg346-topics-close').addEventListener('click',closeTopics);stage.addEventListener('click',e=>{if(!$('#pg346-topics').hidden&&!e.target.closest('#pg346-topics,#pg346-topics-btn'))closeTopics()});stage.addEventListener('keydown',e=>{if(e.key==='Escape')closeTopics()});
  const core=document.querySelector('main');if(core){let pending=false;new MutationObserver(()=>{if(!pending&&!document.hidden){pending=true;requestAnimationFrame(()=>{pending=false;sync()})}}).observe(core,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-state','aria-pressed','disabled']})}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopHistoryAudio();else sync()});window.addEventListener('pagehide',stopHistoryAudio);
  sync();document.documentElement.dataset.pandaCleanVersion='346';
}
