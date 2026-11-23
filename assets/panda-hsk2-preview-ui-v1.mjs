/* Panda AI v346. Clean responsive user-approved screen.
   Only the presentation changes: no modifications to the established HSK/audio/speech engine. */
import {lookupPandaVoiceClip} from './panda-hsk2-preview-audio-v1.mjs?v=524';
import {HSK2_TOPICS} from './panda-hsk2-brain-data-v1.mjs';
import {PANDA_CLIPS} from './panda-voice-clips-v365.mjs?v=365';
import {PANDA_V411_VOICE} from './panda-voice-v411.mjs?v=411';
import {audioStudyLine436} from './panda-audio-study-v436.mjs?v=436';
import {createPandaMouth} from './panda-live-face-v354.mjs?v=354';
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
    layers:'<path d="M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01"/>',
    graduation:'<path d="m2 9 10-5 10 5-10 5-10-5Zm4 2v5c3 3 9 3 12 0v-5m4-2v7"/>'
  };
  function icon(name){return `<svg viewBox="0 0 24 24" xmlns="${ns}" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round">${icons[name]||icons.chat}</svg>`}
  const stage=document.createElement('section');stage.id='pg346';stage.dataset.py='true';stage.dataset.ru='true';stage.dataset.listening='false';stage.dataset.headphones='idle';stage.setAttribute('aria-label','Pоговори с Пандой — Panda AI');
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
      <svg class="pg352-rocks" viewBox="0 0 620 170" aria-hidden="true" focusable="false">
        <defs><linearGradient id="pg352-rock-side" x1="0" y1="0" x2=".1" y2="1"><stop stop-color="#eee8d9"/><stop offset=".5" stop-color="#b7baaa"/><stop offset="1" stop-color="#729998"/></linearGradient><linearGradient id="pg352-rock-top" x1="0" y1="0" x2=".5" y2="1"><stop stop-color="#fff6df"/><stop offset=".55" stop-color="#dfdbc9"/><stop offset="1" stop-color="#afbbac"/></linearGradient><radialGradient id="pg352-moss"><stop stop-color="#9ce55a"/><stop offset="1" stop-color="#387f35"/></radialGradient></defs>
        <ellipse cx="300" cy="139" rx="295" ry="27" fill="#0064a2" opacity=".21"/>
        <path d="M47 87C83 58 130 59 177 49C226 23 268 36 303 34C359 22 391 42 435 44C493 39 541 55 575 76L583 105C573 132 515 141 447 136L246 143C149 143 91 131 51 113Z" fill="url(#pg352-rock-side)" stroke="#819b93" stroke-width="3"/>
        <path d="M47 86C94 60 133 61 177 51C228 33 272 40 303 37C351 28 388 43 434 47C496 45 548 59 575 77C569 100 510 117 452 113L240 116C159 115 87 110 47 86Z" fill="url(#pg352-rock-top)" stroke="#fff4df" stroke-width="3"/>
        <path d="M80 93L102 112L115 131M155 58L170 82L165 113M238 40L251 78L242 114M320 37L315 78L333 115M417 44L414 83L429 114M510 58L496 96L517 124M559 78L550 103L557 126" fill="none" stroke="#829a94" stroke-width="4" opacity=".64"/>
        <path d="M99 84L125 81M191 66L215 71M276 55L305 59M360 64L393 63M451 86L481 82" stroke="#fffaf0" stroke-width="4" stroke-linecap="round" opacity=".8"/>
        <path d="M5 120C31 103 55 97 82 101C122 92 155 104 186 121L176 147C125 168 55 167 12 150Z" fill="url(#pg352-rock-side)" stroke="#9eaa9c" stroke-width="3"/>
        <path d="M5 120C53 99 116 94 183 120C149 142 43 139 5 120Z" fill="url(#pg352-rock-top)" stroke="#fff6e6" stroke-width="3"/>
        <path d="M49 107L61 135M101 102L111 137M146 110L154 140" fill="none" stroke="#90a399" stroke-width="3" opacity=".7"/>
        <path d="M19 139Q14 113 6 103M20 139Q30 104 39 107M22 139Q40 115 50 119M531 125Q527 101 519 92M537 125Q544 93 556 95M540 130Q562 102 581 109" fill="none" stroke="#3b8a3d" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="24" cy="129" rx="17" ry="7" fill="url(#pg352-moss)"/><ellipse cx="542" cy="124" rx="22" ry="7" fill="url(#pg352-moss)"/>
        <circle cx="25" cy="110" r="6" fill="#fff2eb"/><circle cx="25" cy="110" r="2" fill="#ecb74d"/><circle cx="566" cy="104" r="5" fill="#fbe8f8"/><circle cx="566" cy="104" r="2" fill="#eca953"/>
      </svg>
      <div class="pg364-ground-shadow" aria-hidden="true"></div>
      <div class="pg352-mascot"><img class="pg346-panda" src="./assets/panda-character-clean-v349.webp?v=349" alt="Панда с открытыми глазами, цветком, фиолетовыми наушниками и шарфом" decoding="async" draggable="false"><canvas class="pg353-face-canvas" aria-hidden="true"></canvas><svg class="pg352-ear-effects" viewBox="0 0 1200 1320" preserveAspectRatio="none" aria-hidden="true" focusable="false"><ellipse cx="214" cy="515" rx="113" ry="149" transform="rotate(11 214 515)"/><ellipse cx="992" cy="413" rx="79" ry="135" transform="rotate(11 992 413)"/></svg></div>
      <img class="pg346-sakura" src="./assets/panda-sakura-v346.svg?v=346" alt="" aria-hidden="true" decoding="async" draggable="false">
      <div class="pg354-petals" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="pg346-speech" aria-label="Текущая фраза Панды" aria-live="polite">
        <strong class="pg346-main-zh">你好！</strong>
        <span class="pg346-main-py">Nǐ hǎo!</span>
        <span class="pg346-main-ru">Привет!</span><aside class="pg350-welcome" role="note" aria-label="Подсказка для начала разговора"><strong>🐼 Начало диалога</strong><span>Выбери тему или задай вопрос по-китайски.</span></aside>
        <div class="pg346-speech-controls"><button id="pg346-hear" type="button" aria-label="Слушать">🔊</button><button id="pg346-speed" type="button" aria-label="Изменить скорость">1× ▾</button><button id="pg346-play" type="button" aria-label="Воспроизвести ещё раз">▶</button></div>
        <button type="button" class="pg346-repeat" id="pg346-repeat">↻ Повтори</button>
        <small class="pg357-audio-note" id="pg357-audio-note" hidden>🔇 Для этой фразы нет точной MP3-записи.</small>
      </div>
      <div class="pg346-live" id="pg346-live" data-active="false" aria-live="polite"></div>
      <div class="pg346-feedback" id="pg346-feedback" hidden aria-live="polite"></div>
      <div class="pg346-status" id="pg346-status" hidden role="status" aria-live="polite"></div>
      <div class="pg346-topic-menu" id="pg346-topics" hidden>
  <div class="pg346-topic-menu-title">
   <button class="pg374-back" id="pg374-topics-back" type="button" hidden aria-label="Назад к списку тем">‹</button>
   <span id="pg374-topics-title">Все темы</span>
   <button id="pg346-topics-close" type="button" aria-label="Закрыть">×</button>
  </div>
  <p class="pg374-tip" id="pg374-topics-tip">Выбери тему, затем вопрос для разговора.</p>
  <div class="pg346-topic-list"></div>
  <div class="pg374-topic-details" id="pg374-topic-details" hidden></div>
 </div>
    </section>
    <div class="pg346-side-rail" role="group" aria-label="Быстрые действия">
      <button id="pg346-topics-btn" type="button" class="pg346-all-topics" aria-label="Все темы — выбрать урок" aria-expanded="false" aria-controls="pg346-topics">${icon('layers')}<span>Все<br>темы</span></button>
    </div>
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

  // The legacy microphone recovery controls were hidden with the legacy <main>.
  // Reuse their existing handlers in a real, accessible modal, only after STT
  // fails. Never alter the approved mascot, landscape or regular chat layout.
  const micRecovery=document.getElementById('speech-recovery');
  const micHelp=document.createElement('dialog');
  micHelp.id='pg407-mic-help';
  micHelp.setAttribute('aria-label','Помощь с распознаванием речи');
  const micHelpTitle=el('strong','pg407-mic-title','🎙 Помощь с микрофоном');
  const micClose=el('button','pg407-mic-close','Закрыть');
  micClose.type='button';
  micClose.setAttribute('aria-label','Закрыть помощь с микрофоном');
  const micHelpHeader=el('div','pg407-mic-head');
  micHelpHeader.append(micHelpTitle,micClose);
  micHelp.append(micHelpHeader);
  if(micRecovery)micHelp.append(micRecovery);
  document.body.append(micHelp);
  micClose.addEventListener('click',()=>micHelp.close());
  micHelp.addEventListener('click',event=>{
    if(event.target===micHelp)micHelp.close();
  });
  const micHelpBtn=el('button','pg407-help-button','Помощь с микрофоном');
  micHelpBtn.type='button';
  micHelpBtn.setAttribute('aria-label','Открыть помощь с микрофоном и ссылку на Chrome');
  micHelpBtn.addEventListener('click',()=>{
    if(!micRecovery?.hidden&&!micHelp.open)micHelp.showModal();
  });

  const dayReturnHref=()=>{
    const params=new URLSearchParams(location.search);
    const mini=/^[0-2]$/.test(params.get('mini')||'')?params.get('mini'):'0';
    if(params.get('from')==='hsk2-lesson1')return './hsk2-lesson1.html?step=8';
    // Return the pupil to the last HSK2 lesson screen, never the topic map.
    return './hsk2-life-course.html?from=hsk2-life-course&return=done&mini='+mini+'&v=420';
  };
  // Course 2 deep-link: reuse the REAL Panda AI voice/text/chat UI, not a mock.
  if(new URLSearchParams(location.search).get('practice')==='day'){
    const title=stage.querySelector('.pg346-title');
    if(title)title.textContent='🌅 Мой день';
    const back=stage.querySelector('.pg346-back');
    if(back){back.href=dayReturnHref();back.textContent='← К уроку';}
    // The first play on a new page may be blocked by Android autoplay policy.
    // A prominent real button provides the required user gesture for that SAME recorded line.
    const dayListen=stage.querySelector('#pg346-repeat');
    if(dayListen){
      dayListen.textContent='🔊 Слушать вопрос Панды';
      dayListen.setAttribute('aria-label','Нажми, чтобы Панда произнесла текущий вопрос');
      dayListen.classList.add('pg398-day-listen');
    }
  }
  let historyAudio=null;
  const liveMouth=createPandaMouth($('.pg352-mascot'),()=>{
    if(historyAudio&&!historyAudio.paused&&!historyAudio.ended)
      return .45+.33*Math.sin(historyAudio.currentTime*19)+.2*Math.sin(historyAudio.currentTime*12);
    return bridge.getAudioLevel?.() ?? NaN;
  });
  let lastRows='',lastPhrase='',lastTopics='',lastFeedback='',showPy=true,showRu=true;
  let lastSpeechSignalId=0,effectTimer=0,headsetResult='idle',assessmentUntil=0,assessmentText='';
  const stopHistoryAudio=()=>{if(historyAudio){const previous=historyAudio;historyAudio=null;previous.pause();}};
  function clipFor(entry){return lookupPandaVoiceClip(entry?.hanzi||entry?.panda)||lookupPandaVoiceClip(entry?.audioKey)}
  // History shares the main player: stops recognition, pending replies and prior audio.
  function playHistory(entry){stopHistoryAudio();bridge.playEntry(entry);sync()}

  const chatHistory=$('#pg346-rows');
  function revealLatest(){chatHistory.scrollTop=chatHistory.scrollHeight;}
  new ResizeObserver(revealLatest).observe(chatHistory);
  function renderRows(rows){const root=$('#pg346-rows');root.replaceChildren();for(const e of rows.slice(-3)){
    const example=e.who==='example'||e.analysis?.kind==='correction-response';
    const row=el('article','pg346-row'+(example?' pg445-example-row':''));
    if(Array.from(e.hanzi||'').length>17||(e.pinyin||'').length>60||(e.ru||'').length>80)row.classList.add('pg506-long');
    const av=el('span','pg346-avatar');
    if(example){av.textContent='💡';av.setAttribute('aria-label','Учебный пример, а не реплика Панды');}
    else if(e.who==='you')av.textContent='👤';
    else{const img=document.createElement('img');img.src='./assets/panda-character-clean-v349.webp?v=349';img.alt='Панда';av.append(img)}
    const text=el('div','pg346-text');
    if(example)text.append(el('div','pg445-example-label','Правильный пример'));
    text.append(el('div','pg346-zh',e.hanzi||''),el('div','pg346-py',e.pinyin||''));
    const translation=el('div','pg346-ru',e.ru||e.analysis?.probable||'Перевод пока не подтверждён');
    if(e.analysis?.kind==='calendar-complete'&&e.analysis.summary){
     translation.append(el('div','pg406-finish',e.analysis.summary));
    }
    const sound=el('button','pg346-row-audio','🔊');sound.type='button';sound.disabled=!clipFor(e);sound.setAttribute('aria-label',sound.disabled?'Для этой фразы нет MP3':'Слушать эту реплику');sound.addEventListener('click',()=>playHistory(e));
    row.append(av,text,translation,sound);root.append(row);
  }requestAnimationFrame(revealLatest);}
  const topicsFallback=['Приветствия','Учёба и знакомство','Числа','Дни недели','Даты','Семья','Погода'];
  // All ten 14 November Luvvoice source files are available for audio practice.
  // Only answer-engine-verified entries appear as conversational questions.
  const corpusTopicByFile=Object.freeze({
   '20261114-BWLSNa.mp3':1,'20261114-bsPFJr.mp3':1,'20261114-d9kQmz.mp3':1,
   '20261114-APqUx9.mp3':2,'20261114-W6Okix.mp3':2,'20261114-47SW44.mp3':2,
   '20261114-K0Uh5q.mp3':2,'20261114-FMAH9S.mp3':3,
   '20261114-M7EwcW.mp3':6,'20261114-7JVWfV.mp3':8
  });
  function topicGroup(level){
   const section=el('section','pg346-topic-group');
   const title=el('h3','pg346-topic-group-title');
   title.innerHTML=icon('graduation');
   title.append(level);
   const grid=el('div','pg346-topic-grid');
   section.append(title,grid);
   return {section,grid};
  }
  let catalogueTopic=null;
  function renderTopics(s){
   const key=s.allowed.join(',')+'|'+s.topic;
   if(key===lastTopics)return;lastTopics=key;
   const list=$('.pg346-topic-list');
   const hsk1=topicGroup('HSK1'),hsk2=topicGroup('HSK2');
   list.replaceChildren(hsk1.section,hsk2.section);
   for(const id of [7,6,4,3,2,5,1]){
    const name=topicsFallback[id-1],count=bridge.topicQuestions(id).length;
    const audioCount=PANDA_CLIPS.filter(c=>corpusTopicByFile[c.file]===id).length;
    const b=el('button','',name);b.type='button';
    b.disabled=!s.allowed.includes(id);b.setAttribute('aria-current',String(id===s.topic));
    b.setAttribute('aria-label',name+', '+count+' вопросов'+(audioCount?', '+audioCount+' аудиофраз':''));
    if(b.disabled)b.title='Сначала пройди урок '+id;
    b.addEventListener('click',()=>showTopicDetails(id));
    hsk1.grid.append(b);
   }
   for(const t of HSK2_TOPICS){const b=el('button','',(t.id-100)+'. '+t.name);b.type='button';b.setAttribute('aria-current',String(t.id===s.topic));b.addEventListener('click',()=>showTopicDetails(t.id));hsk2.grid.append(b);}
   // HSK2 "My day" recordings can be studied as audio here without
   // wrongly claiming that HSK2 free-form dialogue is unlocked.
   const day=el('button','pg374-day-entry','🎧 Мой день · '+PANDA_CLIPS.filter(c=>corpusTopicByFile[c.file]===8).length+' записей');
   day.type='button';day.addEventListener('click',()=>showTopicDetails(8));
   list.append(day);
   const allAudio=el('button','pg374-day-entry','🎧 Все записи · '+(PANDA_CLIPS.length+PANDA_V411_VOICE.length));
   allAudio.type='button';allAudio.addEventListener('click',()=>showTopicDetails(9));list.append(allAudio);
  }
  function showTopicDetails(id){
   catalogueTopic=id;
   const detail=$('#pg374-topic-details');detail.replaceChildren();detail.hidden=false;
   $('.pg346-topic-list').hidden=true;$('#pg374-topics-back').hidden=false;
   $('#pg374-topics-title').textContent=id===9?'Все записи · '+(PANDA_CLIPS.length+PANDA_V411_VOICE.length):id===8?'Мой день · записи':(HSK2_TOPICS.find(t=>t.id===id)?.name||topicsFallback[id-1]);
   $('#pg374-topics-tip').textContent=id===9
     ?'Все 165 проверенных MP3, включая последние 10 записей v411. Нажми фразу, чтобы прослушать и увидеть пиньинь и перевод.'
     :id===8
     ?'Нажми запись, посмотри пиньинь и перевод. Практику HSK2 начни из урока «Мой день».'
     :'Можно начать своими словами или выбрать готовый вопрос. Ниже доступны проверенные аудиозаписи.';
   if(id!==8&&id!==9){
    const own=el('button','pg374-question');
    own.type='button';
    own.append(el('strong','pg374-zh','✍️ Начать со своей фразы'),el('span','pg374-ru','Пиши или говори по-китайски на выбранную тему'));
    own.addEventListener('click',()=>{
      if(bridge.openTopicForChat(id)){
       stopHistoryAudio();closeTopics();$('#pg346-input').value='';sync();$('#pg346-input').focus();
      }
    });
    detail.append(own);
    const questions=bridge.topicQuestions(id);
    detail.append(el('h3','pg374-section-title','💬 Вопросы для разговора · '+questions.length));
    if(!questions.length)detail.append(el('p','pg374-muted','Проверенных вопросов по этой теме пока нет.'));
    for(const q of questions){
     const btn=el('button','pg374-question');btn.type='button';
     btn.append(el('strong','pg374-zh',q.hanzi),el('span','pg374-py',q.pinyin),el('span','pg374-ru',q.ru));
     btn.append(el('small','pg374-hint',q.hasReplyAudio?'🔊 Панда задаст вопрос':'🔇 Вопрос пока без MP3'));
     btn.addEventListener('click',()=>{
      if(bridge.startTopicQuestion(id,q.hanzi)){
       stopHistoryAudio();closeTopics();$('#pg346-input').value='';sync();
      }
     });
     detail.append(btn);
    }
   }
   const audioPhrases=id===9?[...PANDA_CLIPS,...PANDA_V411_VOICE]:PANDA_CLIPS.filter(c=>corpusTopicByFile[c.file]===id);
   if(audioPhrases.length){
    const section=document.createElement('details');section.className='pg374-audio-section';
    const summary=el('summary','','🎧 Загруженные аудиофразы · '+audioPhrases.length);
    const description=el('p','pg374-muted','Нажми фразу, чтобы прослушать. Это аудиопрактика, а не обещание свободного ответа Панды.');
    section.append(summary,description);
    for(const clip of audioPhrases){
     const annotated=audioStudyLine436(clip);
     const annotatedPinyin=annotated.pinyin||clip.pinyin;
     const annotatedRussian=annotated.ru||clip.ru;
     const btn=el('button','pg374-audio-phrase');btn.type='button';
     const content=el('span','pg436-audio-copy');
     content.append(
      el('span','pg436-audio-zh',clip.zh),
      el('span','pg436-audio-py',annotatedPinyin||'Пиньинь уточняется'),
      el('span','pg436-audio-ru',annotatedRussian||'Перевод уточняется')
     );
     btn.append(el('span','pg436-audio-icon','▶'),content);
     btn.setAttribute('aria-label','Прослушать '+clip.zh+(annotatedRussian?' — '+annotatedRussian:''));
     btn.addEventListener('click',()=>{stopHistoryAudio();bridge.playEntry({hanzi:clip.zh});sync()});
     section.append(btn);
    }
    detail.append(section);
    if(id===8||id===9)section.open=true;
   }
   detail.scrollTop=0;$('#pg346-topics').scrollTop=0;
  }
  function showTopicList(){
   catalogueTopic=null;$('#pg374-topic-details').replaceChildren();$('#pg374-topic-details').hidden=true;
   $('.pg346-topic-list').hidden=false;$('#pg374-topics-back').hidden=true;
   $('#pg374-topics-title').textContent='Все темы';
   $('#pg374-topics-tip').textContent='Выбери тему: можно начать со своей фразы или готового вопроса.';
   $('.pg346-topic-list').scrollTop=0;
  }
  function renderFeedback(s){
    const last=s.history.slice().reverse().find(x=>x.who==='you');
    const wrong=last?.analysis?.correction;
    // A valid answer with a different meaning is not a grammar error.
    // Audio/ASR gives only a transcript, NOT a reliable tone assessment.
    const root=$('#pg346-feedback'),active=!!wrong;
    const key=[last?.hanzi,wrong?.hanzi,wrong?.why,wrong?.retry,s.feedback,active].join('|');
    if(key===lastFeedback)return;
    lastFeedback=key;root.hidden=!active;root.replaceChildren();
    if(!active)return;
    const meaningOnly=wrong.category==='meaning';
    root.dataset.kind=meaningOnly?'meaning':'grammar';
    const heading=el('strong','pg445-heading',
      meaningOnly?'🐼 Другой смысл — не ошибка грамматики':'🐼 Панда объясняет ошибку');
    root.append(heading);
    if(wrong.uncertain)root.append(el('p','pg441-uncertain',
      '⚠️ Браузер мог ослышаться. Сначала проверь распознанный текст.'));
    // The learner's original sentence already appears in chat history.
    // Keep the main card short enough to read WITHOUT scrolling on Android.
    root.append(el('p','pg445-after',
      (meaningOnly?'💡 Пример ответа: ':'✅ ')+wrong.hanzi));
    // The actual verified rule must be visible without tapping "Подробнее".
    // A technical title alone is not an explanation for a learner.
    const why=String(wrong.why||'').trim();
    let firstSentence=why.match(/^.*?[.!?](?:\s|$)/u)?.[0]?.trim()||why;
    // Reviewed short explanations for the two cases that overflowed in Android.
    // All other grammar rules retain their first verified sentence verbatim.
    if(!meaningOnly&&!wrong.uncertain){
      if(/В конструкции A-不-A или 有没有/.test(why))
        firstSentence='Повтор глагола уже образует вопрос — 吗 не нужна.';
      else if(/В обычном предложении время действия ставится перед глаголом/.test(why))
        firstSentence='Время ставят перед действием: сначала часы, затем глагол.';
    }
    const shortRule=meaningOnly?'要 (yào) — хотеть; 有 (yǒu) — иметь.':
      firstSentence?'Почему: '+firstSentence:(wrong.title||'Правило требует уточнения.');
    root.append(el('p','pg445-brief',shortRule));
    const details=document.createElement('details');details.className='pg445-details';
    const trigger=document.createElement('summary');trigger.textContent='Подробнее — объяснение и перевод';
    details.append(trigger);
    details.append(el('p','pg445-before',
      (meaningOnly?'💬 Твой ответ: ':'❌ Твоя фраза: ')+(last.hanzi||'')));
    if(wrong.pinyin)details.append(el('p','pg445-pinyin','Пиньинь: '+wrong.pinyin));
    if(wrong.label)details.append(el('p','pg445-label',wrong.label));
    details.append(el('p','pg445-meaning','Сказано: '+(last.analysis?.probable||'Смысл уточняется')));
    if(wrong.ru)details.append(el('p','pg445-translation','Пример: '+wrong.ru));
    if(wrong.why)details.append(el('p','pg445-why','Почему: '+wrong.why));
    if(wrong.retry)details.append(el('p','pg445-retry','🎙 '+wrong.retry));
    root.append(details);
  }
  function ingestSpeechSignal(signal,previousSnapshot){
    if(!signal||signal.id===lastSpeechSignalId)return;
    lastSpeechSignalId=signal.id;clearTimeout(effectTimer);
    if(signal.kind==='uncertain'&&signal.text){
      // The active visible composer, not the hidden legacy input, must receive the editable transcript.
      const visibleInput=$('#pg346-input');visibleInput.value=signal.text;visibleInput.focus();
    }
    // A browser ASR transcript is NOT acoustic tone assessment; never award green for text alone.
    const tonesChecked=signal.kind==='verified-tones'&&signal.toneVerified===true&&signal.contentVerified===true&&signal.confidence>=.85;
    if(tonesChecked){headsetResult='correct';assessmentText='✅ 太棒了！ Произношение и тоны проверены.';}
    else if(signal.kind==='content-error'&&signal.confidence>=.85){
      headsetResult='error';assessmentText='再说一遍！ Повтори ещё раз. Тоны не проверены.';
      // If the corrected phrase has an existing clip, replay only that approved recording.
      if(signal.correctionHanzi&&clipFor({hanzi:signal.correctionHanzi})&&previousSnapshot.pose!=='talking')playHistory({hanzi:signal.correctionHanzi});
    }else{headsetResult='idle';assessmentText=signal.kind==='uncertain'
      ?'Речь распознана неуверенно. Повтори ещё раз.'
      :'Фраза распознана по тексту. Китайские тоны не проверены.';}
    assessmentUntil=Date.now()+2300;
    effectTimer=setTimeout(()=>{headsetResult='idle';assessmentUntil=0;sync()},2300);
  }
  function sync(){const s=bridge.snapshot();ingestSpeechSignal(s.speechSignal,s);
    const historySpeaking=!!(historyAudio&&!historyAudio.paused&&!historyAudio.ended);
    const pandaSpeaking=historySpeaking||s.pose==='talking'||stage.dataset.dayTalking==='true';
    stage.dataset.listening=String(s.active);stage.dataset.welcome=String(s.history.length<=1);
    stage.dataset.pose=s.active?'listening':pandaSpeaking?'talking':'idle';
    liveMouth.setTalking(!s.active&&pandaSpeaking);
    stage.dataset.headphones=s.active?'listening':headsetResult;$('#pg346-mic').setAttribute('aria-pressed',String(s.active));$('#pg346-mic').setAttribute('aria-label',s.active?'Микрофон включён. Говори по-китайски.':'Ответить Панде голосом');$('#pg346-short').setAttribute('aria-pressed',String(s.mode==='short'));$('#pg346-nonstop').setAttribute('aria-pressed',String(s.mode==='nonstop'));
    const a=s.current||{},phrase=[a.hanzi,a.panda,a.pinyin,a.ru,s.slow,s.audioAvailable].join('|');if(phrase!==lastPhrase){lastPhrase=phrase;$('.pg346-main-zh').textContent=a.hanzi||a.panda||'你好！';$('.pg346-main-py').textContent=a.pinyin||'';$('.pg346-main-ru').textContent=a.ru||'';$('#pg346-hear').disabled=!s.audioAvailable;$('#pg346-play').disabled=!s.audioAvailable;$('#pg346-repeat').disabled=!s.audioAvailable;$('#pg357-audio-note').hidden=!!s.audioAvailable}
    $('#pg346-speed').textContent=s.slow?'0,8× ▾':'1× ▾';const rows=JSON.stringify(s.history.map(e=>[e.who,e.hanzi,e.pinyin,e.ru]));if(rows!==lastRows){lastRows=rows;renderRows(s.history)}
    renderFeedback(s);renderTopics(s);
    const warning=$('#pg346-status');
    const status=s.status||'';
    const autoplayBlocked=status.startsWith('Браузер не включил звук автоматически');
    const problem=!autoplayBlocked&&/(микрофон|распознаван|распознано|неуверенно|исправь текст|разреши|доступ|Chrome|запись не|запись пока|звуковой файл|браузер.*звук|mp3|фрагмент|учебный пример)/i.test(status);
    const needsMicHelp=!!micRecovery&&!micRecovery.hidden;
    warning.hidden=!problem;
    warning.textContent=problem?status:'';
    if(problem&&needsMicHelp)warning.append(micHelpBtn);
    if(!needsMicHelp&&micHelp.open)micHelp.close();
    const live=$('#pg346-live');const showingAssessment=Date.now()<assessmentUntil;
    live.classList.toggle('pg352-assessment',!s.active&&!pandaSpeaking&&showingAssessment);
    live.dataset.active=String(s.active||pandaSpeaking||showingAssessment);
    live.textContent=s.active?(/Речь закончилась|Завершаю распознавание/.test(s.status||'')?'⏳ Распознаю речь…':'🎙 Слушаю китайскую речь…'):pandaSpeaking?'🔊 Панда говорит':showingAssessment?assessmentText:'';
    const back=document.getElementById('back-link');if(back)$('a.pg346-back').href=back.href;
  }
  function closeTopics(){stage.dataset.topicsOpen='false';$('#pg346-topics').hidden=true;$('#pg346-topics-btn').setAttribute('aria-expanded','false');showTopicList()}
  let lastTopicsToggle=-Infinity;
  function toggleTopics(){
   const now=performance.now();
   if(now-lastTopicsToggle<300)return;
   lastTopicsToggle=now;
   const pop=$('#pg346-topics');pop.hidden=!pop.hidden;stage.dataset.topicsOpen=String(!pop.hidden);$('#pg346-topics-btn').setAttribute('aria-expanded',String(!pop.hidden));if(!pop.hidden){showTopicList();renderTopics(bridge.snapshot());$('#pg346-topics-close').focus()}}
  function send(){const inp=$('#pg346-input');const value=inp.value.trim();if(!value){inp.focus();return}stopHistoryAudio();closeTopics();inp.value='';bridge.send(value);sync()}
  function toggle(which){if(which==='py'){showPy=!showPy;stage.dataset.py=String(showPy);$('#pg346-py').setAttribute('aria-pressed',String(showPy))}else{showRu=!showRu;stage.dataset.ru=String(showRu);$('#pg346-ru').setAttribute('aria-pressed',String(showRu))}}
  $('#pg346-form').addEventListener('submit',e=>{e.preventDefault();send()});$('#pg346-send').addEventListener('click',send);$('#pg346-mic').addEventListener('click',()=>{stopHistoryAudio();bridge.mic();sync()});
  $('#pg346-short').addEventListener('click',()=>{stopHistoryAudio();bridge.setMode('short');sync()});$('#pg346-nonstop').addEventListener('click',()=>{stopHistoryAudio();bridge.setMode('nonstop');sync()});
  $('#pg346-py').addEventListener('click',()=>toggle('py'));$('#pg346-ru').addEventListener('click',()=>toggle('ru'));
  $('#pg346-history').addEventListener('click',()=>{stopHistoryAudio();document.getElementById('history-open')?.click()});
  $('#pg346-hear').addEventListener('click',()=>{stopHistoryAudio();bridge.play();sync()});$('#pg346-play').addEventListener('click',()=>{stopHistoryAudio();bridge.play();sync()});$('#pg346-repeat').addEventListener('click',()=>{stopHistoryAudio();bridge.play();sync()});$('#pg346-speed').addEventListener('click',()=>{bridge.toggleSpeed();sync()});
  $('#pg346-topics-btn').addEventListener('click',toggleTopics);$('#pg346-topics-close').addEventListener('click',closeTopics);$('#pg374-topics-back').addEventListener('click',showTopicList);stage.addEventListener('click',e=>{if(!$('#pg346-topics').hidden&&!e.target.closest('#pg346-topics,#pg346-topics-btn'))closeTopics()});stage.addEventListener('keydown',e=>{if(e.key==='Escape')closeTopics()});
  const core=document.querySelector('main');if(core){let pending=false;new MutationObserver(()=>{if(!pending&&!document.hidden){pending=true;requestAnimationFrame(()=>{pending=false;sync()})}}).observe(core,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-state','aria-pressed','disabled']})}
  // HSK2 My Day uses its own reviewed audio player; animate the SAME approved mouth rig.
  if(new URLSearchParams(location.search).get('scenario')==='hsk2-my-day'){
    const daySpeakingObserver=new MutationObserver(()=>sync());
    daySpeakingObserver.observe(stage,{attributes:true,attributeFilter:['data-day-talking']});
    window.addEventListener('pagehide',()=>daySpeakingObserver.disconnect(),{once:true});
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopHistoryAudio();liveMouth.setTalking(false)}else sync()});window.addEventListener('pagehide',()=>{stopHistoryAudio();liveMouth.dispose()});
  sync();document.documentElement.dataset.pandaCleanVersion='365';document.documentElement.classList.remove('panda-booting');document.documentElement.dataset.pandaUiReady='true';
}
