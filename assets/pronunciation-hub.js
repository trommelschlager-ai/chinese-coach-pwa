/* Simplified pronunciation hub — approved variant 3.
   Existing lessons, artwork, tone grid, microphone and listening lab remain intact. */
(() => {
  'use strict';
  const page=document.getElementById('tones');
  const head=page?.querySelector('.columnhead');
  const intro=page?.querySelector('.tone-intro');
  const grid=page?.querySelector('.tonegrid');
  const lab=document.getElementById('listening-lab');
  const practice=page?.querySelector('.practice');
  const voices=document.getElementById('mandarin-voice-settings');
  if(!head||!intro||!grid||!lab||!practice||!voices||document.getElementById('pronunciation-hub'))return;

  const heading=head.querySelector('h1'),description=head.querySelector('p'),eyebrow=head.querySelector('.eyebrow');
  if(heading)heading.textContent='Китайское произношение';
  if(description)description.textContent='Выбери, что будем тренировать сегодня.';
  if(eyebrow)eyebrow.textContent='ПРОСТО · ПО ШАГАМ';

  const hub=document.createElement('section');
  hub.id='pronunciation-hub';
  hub.className='pronunciation-hub';
  hub.innerHTML=[
    '<div class="pronunciation-choices">',
      '<button type="button" class="pronunciation-choice" data-pronunciation-mode="listen">',
        '<span class="pronunciation-icon" aria-hidden="true">🎧</span>',
        '<span class="pronunciation-choice-copy"><strong>Слушать тоны</strong><small>Узнай, как звучат четыре тона</small></span>',
        '<span class="pronunciation-chevron" aria-hidden="true">›</span>',
      '</button>',
      '<button type="button" class="pronunciation-choice" data-pronunciation-mode="combinations">',
        '<span class="pronunciation-icon" aria-hidden="true">拼</span>',
        '<span class="pronunciation-choice-copy"><strong>Звукосочетания</strong><small>zh, ch, sh · z, c, s · ai, pai и другие</small></span>',
        '<span class="pronunciation-chevron" aria-hidden="true">›</span>',
      '</button>',
      '<button type="button" class="pronunciation-choice" data-pronunciation-mode="quiz">',
        '<span class="pronunciation-icon" aria-hidden="true">🧠</span>',
        '<span class="pronunciation-choice-copy"><strong>Угадать на слух</strong><small>10 вопросов · включая нейтральный тон</small></span>',
        '<span class="pronunciation-chevron" aria-hidden="true">›</span>',
      '</button>',
      '<button type="button" class="pronunciation-choice" data-pronunciation-mode="speak">',
        '<span class="pronunciation-icon" aria-hidden="true">🎙️</span>',
        '<span class="pronunciation-choice-copy"><strong>Моё произношение</strong><small>Запиши голос и сравни интонацию</small></span>',
        '<span class="pronunciation-chevron" aria-hidden="true">›</span>',
      '</button>',
    '</div>',
    '<div class="pronunciation-tools">',
      '<details id="pronunciation-settings"><summary>⚙️ Голос и скорость · образцы</summary>',
        '<div id="pronunciation-voice-slot"></div>',
        '<section class="pronunciation-voice-demos" aria-label="Сравнить настоящие голоса">',
          '<p><strong>Послушай записи носителей перед заменой голоса по умолчанию</strong></p>',
          '<p class="pronunciation-demo-note">Это короткие записи двух разных слов, а не озвучка всего курса. Для прослушивания нужен интернет.</p>',
          '<div class="pronunciation-demo-buttons">',
            '<button type="button" data-demo-voice="female">▶ Женский голос · 麻 má</button>',
            '<button type="button" data-demo-voice="male">▶ Мужской голос · 马 mǎ</button>',
            '<button type="button" data-demo-voice="system">▶ Голос телефона · 你好</button>',
          '</div>',
          '<p id="pronunciation-demo-feedback" role="status" aria-live="polite" class="pronunciation-demo-feedback"></p>',
          '<details class="pronunciation-audio-credits"><summary>Авторы и лицензии записей</summary>',
            '<p><a href="https://commons.wikimedia.org/wiki/File:Zh-m%C3%A1.ogg" target="_blank" rel="noopener noreferrer">麻 má: Yue Tan, CC BY-SA 3.0 US</a></p>',
            '<p><a href="https://commons.wikimedia.org/wiki/File:Zh-m%C7%8E.ogg" target="_blank" rel="noopener noreferrer">马 mǎ: Wei Gao / Vion Nicolas, CC BY 2.0 FR</a></p>',
          '</details>',
          '<p class="pronunciation-demo-notice">В уроках используется сохранённое MP3-аудио. Голос телефона включается только при ручном выборе образца.</p>',
        '</section>',
      '</details>',
      '<details id="pronunciation-howto"><summary>📖 Как заниматься</summary>',
        '<p>Начни со «Слушать тоны», затем попробуй «Угадать на слух». Когда почувствуешь разницу, открой «Моё произношение» и повтори слог. Проверка микрофоном приблизительная.</p>',
      '</details>',
    '</div>'
  ].join('');


  // Short beginner guide: initials, finals and full syllables are not interchangeable.
  const combinations=[
    {name:'zh · ch · sh',hint:'Похожие шипящие. Кончик языка немного загибается назад.',items:[
      ['zhi','zhī','知','знать'],['chi','chī','吃','есть'],['shi','shī','诗','стих']
    ]},
    {name:'z · c · s',hint:'Произносятся с кончиком языка ближе к передним зубам.',items:[
      ['zi','zì','字','иероглиф'],['ci','cì','次','раз'],['si','sì','四','четыре']
    ]},
    {name:'ai → pai',hint:'ai — финаль. p + ai = pai, то есть целый слог.',items:[
      ['pai','pāi','拍','хлопать'],['bai','bái','白','белый'],['mai','mǎi','买','покупать']
    ]},
    {name:'j · q · x',hint:'Мягкие согласные. Следи за отличием q от ch.',items:[
      ['ji','jī','鸡','курица'],['qi','qī','七','семь'],['xi','xī','西','запад']
    ]},
    {name:'ü',hint:'Произнеси «и» и округли губы, как для «у».',items:[
      ['nü','nǚ','女','женщина']
    ]}
  ];
  const comboSection=document.createElement('section');
  comboSection.id='pinyin-combinations';
  comboSection.className='pinyin-combinations';
  comboSection.innerHTML='<p class="pinyin-combo-intro">Китайский слог обычно складывается из начального звука и финали. Нажимай на примеры, слушай и повторяй.</p>'+
   '<div class="pinyin-combo-groups">'+combinations.map(group=>
     '<section class="pinyin-combo-group"><h3>'+group.name+'</h3><p>'+group.hint+'</p><div class="pinyin-combo-tiles">'+
     group.items.map(([id,py,hz,ru])=>
       '<button type="button" class="pinyin-combo-tile" data-pinyin-audio="'+id+'" aria-label="Послушать '+py+' — '+ru+'"><strong lang="zh-Hans">'+hz+'</strong><span>'+py+'</span><small>'+ru+'</small><span class="pinyin-combo-play" aria-hidden="true">▶</span></button>'
     ).join('')+'</div></section>'
   ).join('')+'</div>'+
   '<p class="pinyin-combo-warning"><strong>Важно:</strong> «sz» не используется как стандартное звукосочетание пиньиня. Есть отдельные z, s и слоги zi, si. А ch — одна начальная согласная из двух букв.</p>'+
   '<p class="pinyin-combo-feedback" role="status" aria-live="polite"></p>';
  const comboFeedback=comboSection.querySelector('.pinyin-combo-feedback');
  let comboAudio=null;
  function stopComboAudio(){if(comboAudio){comboAudio.pause();comboAudio=null;}comboSection.querySelectorAll('.pinyin-combo-tile').forEach(b=>b.classList.remove('playing'));}
  comboSection.querySelectorAll('[data-pinyin-audio]').forEach(button=>button.addEventListener('click',async()=>{
    stopComboAudio();
    const id=button.dataset.pinyinAudio;
    const a=new Audio('./assets/pinyin-combinations/'+id+'.mp3');
    a.preload='auto';comboAudio=a;
    button.classList.add('playing');
    comboFeedback.textContent='Звучит пример — повтори слог.';
    a.onended=()=>{if(comboAudio===a){stopComboAudio();comboFeedback.textContent='Повтори ещё раз или выбери следующий слог.';}};
    a.onerror=()=>{if(comboAudio===a){stopComboAudio();comboFeedback.textContent='Запись не загрузилась. Проверь интернет или скачай материалы в настройках.';}};
    try{await a.play();}catch{if(comboAudio===a){stopComboAudio();comboFeedback.textContent='Не получилось включить MP3. Нажми ещё раз.';}}
  }));
  window.addEventListener('learning-audio-stop',stopComboAudio);
  window.addEventListener('pagehide',stopComboAudio);

  const view=document.createElement('section');
  view.id='pronunciation-selected-view';
  view.hidden=true;
  view.innerHTML=[
    '<button type="button" class="pronunciation-back" id="pronunciation-back">← К выбору занятия</button>',
    '<h2 id="pronunciation-view-title"></h2>'
  ].join('');
  head.after(hub,view);
  const voiceSlot=hub.querySelector('#pronunciation-voice-slot');
  voiceSlot.appendChild(voices);
  const settings=hub.querySelector('#pronunciation-settings');
  const modeTitles={listen:'Слушать тоны',combinations:'Звукосочетания',quiz:'Угадать на слух',speak:'Моё произношение'};
  const sections={listen:[intro,grid],combinations:[comboSection],quiz:[lab],speak:[practice]};
  let mode=null,voiceAudio=null;

  function hide(el,hidden){el.hidden=hidden;el.classList.toggle('pronunciation-panel-hidden',hidden);}
  function stopDemo(){if(voiceAudio){voiceAudio.pause();voiceAudio=null}}
  window.addEventListener('learning-audio-stop',stopDemo);
  function show(modeName,scroll=true){
    stopDemo();stopComboAudio();
    if(!Object.prototype.hasOwnProperty.call(sections,modeName))modeName=null;
    mode=modeName;
    hide(hub,!!mode);
    hide(view,!mode);
    Object.entries(sections).forEach(([key,elements])=>elements.forEach(el=>hide(el,key!==mode)));
    if(mode){
      view.querySelector('#pronunciation-view-title').textContent=modeTitles[mode];
      const selected=sections[mode][0];
      view.insertAdjacentElement('afterend',selected);
      if(scroll)view.scrollIntoView({behavior:'smooth',block:'start'});
    }else if(scroll)head.scrollIntoView({behavior:'smooth',block:'start'});
    // The actual audio lab remains in the document; we only control visibility.
  }
  // Restore the original DOM order before showing a new section, especially
  // for listen mode's two elements, without duplicating any event handlers.
  const originalShow=show;
  function showStable(modeName,scroll=true){
    if(modeName==='listen'){
      practice.before(lab);
      lab.before(intro);
      intro.after(grid);
    }else if(modeName==='quiz'){
      practice.before(lab);
    }
    originalShow(modeName,scroll);
  }
  hub.querySelectorAll('[data-pronunciation-mode]').forEach(b=>b.addEventListener('click',()=>showStable(b.dataset.pronunciationMode)));
  view.querySelector('#pronunciation-back').onclick=()=>showStable(null);

  const recordings={
    female:'https://upload.wikimedia.org/wikipedia/commons/c/c9/Zh-m%C3%A1.ogg',
    male:'https://upload.wikimedia.org/wikipedia/commons/c/cc/Zh-m%C7%8E.ogg'
  };
  const demoFeedback=hub.querySelector('#pronunciation-demo-feedback');
  hub.querySelectorAll('[data-demo-voice]').forEach(button=>button.addEventListener('click',async()=>{
    stopDemo();
    const which=button.dataset.demoVoice;
    if(which==='system'){
      demoFeedback.textContent='Воспроизводится системный китайский голос телефона.';
      if(typeof speakChinese==='function')speakChinese('你好',.95,true);
      return;
    }
    if(!navigator.onLine){demoFeedback.textContent='Для голосов носителей подключи интернет.';return;}
    const audio=new Audio(recordings[which]);
    voiceAudio=audio;demoFeedback.textContent='Включаю образец…';
    try{await audio.play();demoFeedback.textContent=which==='female'?'Женский голос: má, второй тон.':'Мужской голос: mǎ, третий тон.';}
    catch(e){demoFeedback.textContent='Не удалось загрузить образец. Проверь подключение и попробуй ещё раз.';}
  }));
  settings.addEventListener('toggle',()=>{if(!settings.open)stopDemo()});
  document.querySelectorAll('[data-page="tones"],[data-go="tones"]').forEach(el=>el.addEventListener('click',()=>showStable(null,false)));
  window.showPronunciationMode=(name)=>showStable(name,true);
  const params=new URLSearchParams(window.location.search);
  const deepLinked=params.get('start')==='listening';
  showStable(deepLinked?'quiz':null,false);
  if(deepLinked)requestAnimationFrame(()=>view.scrollIntoView({block:'start'}));
})();