/* Panda Go HSK1 pronunciation trainer v242. Audio is played only after user interaction. */
(() => {
  'use strict';
  const root=document.getElementById('pronunciation-app');
  if(!root)return;
  const content=document.getElementById('trainer-content');
  const progress=document.getElementById('pr-progress');
  const fill=document.getElementById('pr-fill');
  const footerNext=document.getElementById('footer-next');
  const state={mode:'combos',comboGroup:'all',letter:'Все',search:'',limit:12,shownRules:5,rate:0.85,heard:new Set(),quizIndex:0,quizCorrect:false};
  const key='pg-hsk1-pronunciation-v242';
  let corpus=null,player=null,recording=null,stream=null,micUrl=null,chunks=[];
  const special=[
    ['zi','zì','字','иероглиф','Передний z, необычная i'],
    ['ci','cí','词','слово','Передний c с придыханием'],
    ['si','sì','四','четыре','Передний s, необычная i'],
    ['zhi','zhī','知','знать','Язык загнут назад'],
    ['chi','chī','吃','есть','Задний ch с придыханием'],
    ['shi','shì','是','быть','Задний sh, особенная i'],
    ['ji','jī','鸡','курица','Переднеязычный j'],
    ['qi','qī','七','семь','Сильный выдох при q'],
    ['xi','xī','西','запад','Мягкий щелевой x'],
    ['pai','pāi','拍','хлопать','p с придыханием'],
    ['bai','bái','白','белый','b без сильного придыхания'],
    ['mai','mǎi','买','покупать','m и дифтонг ai'],
    ['nü','nǚ','女','женщина','ü с округлёнными губами']
  ];
  const groups=[
    ['all','Все 13'],['front','zi · ci · si'],['back','zhi · chi · shi'],
    ['soft','ji · qi · xi'],['ai','pai · bai · mai'],['umlaut','nü']
  ];
  const families={front:['zi','ci','si'],back:['zhi','chi','shi'],soft:['ji','qi','xi'],ai:['pai','bai','mai'],umlaut:['nü']};
  const quiz=[
    {id:'p031',answer:'mā'}, {id:'p076',answer:'má'},
    {id:'p077',answer:'mǎ'}, {id:'p078',answer:'mà'}
  ];
  const opts=['mā','má','mǎ','mà'];
  function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function normalize(x){return String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ü/g,'u').trim()}
  function safeStored(){
    try{const v=JSON.parse(localStorage.getItem(key)||'{}');if(Array.isArray(v.heard))return v.heard.filter(x=>/^(p\d{3}|c:(?:zi|ci|si|zhi|chi|shi|ji|qi|xi|pai|bai|mai|nü))$/.test(x)).slice(0,203)}catch{}
    return [];
  }
  state.heard=new Set(safeStored());
  function save(){
    try{localStorage.setItem(key,JSON.stringify({heard:[...state.heard],updatedAt:Date.now()}))}catch{}
  }
  function paintProgress(){
    const total=203,n=state.heard.size;progress.textContent=n+' из '+total+' записей прослушано';
    fill.style.width=(Math.min(n,total)/total*100)+'%';
  }
  function audioButtons(){
    return content.querySelectorAll('[data-audio-id],[data-combo]');
  }
  function clipPath(id){return /^p\d{3}$/.test(id)?'./assets/pinyin-reading-v4/'+id+'.mp3':null}
  function comboPath(c){return /^(zi|ci|si|zhi|chi|shi|ji|qi|xi|pai|bai|mai|nü)$/.test(c)?'./assets/pinyin-combinations/'+encodeURIComponent(c)+'.mp3':null}
  function cancelAudio(){
    if(player){try{player.pause();player.currentTime=0}catch{}player=null}
    audioButtons().forEach(b=>b.classList.remove('playing'));
  }
  function markHeard(id,btn){
    if(state.heard.has(id))return;
    state.heard.add(id);save();paintProgress();
    btn.closest('.sound-card')?.classList.add('listened');
  }
  function playTrack(btn){
    const id=btn.dataset.audioId,combo=btn.dataset.combo;
    const src=id?clipPath(id):comboPath(combo);
    if(!src)return;
    const trackKey=id||'c:'+combo;
    cancelAudio();
    const a=new Audio(src);player=a;
    a.preload='auto';a.playbackRate=state.rate;
    try{a.preservesPitch=true;a.mozPreservesPitch=true;a.webkitPreservesPitch=true}catch{}
    btn.classList.add('playing');
    a.onended=()=>{if(player===a){btn.classList.remove('playing');player=null}};
    a.onerror=()=>{if(player===a){btn.classList.remove('playing');player=null;notice('Не удалось открыть звук. Проверь подключение или офлайн-пакет.')}};
    try{
      const result=a.play();
      if(result&&typeof result.then==='function')result.then(()=>markHeard(trackKey,btn)).catch(()=>{if(player===a){btn.classList.remove('playing');player=null;notice('Браузер не разрешил воспроизведение. Нажми ещё раз.')}});
      else markHeard(trackKey,btn);
    }catch{btn.classList.remove('playing');notice('Звук не включился. Нажми ещё раз.')}
  }
  function notice(t){
    let feedback=document.getElementById('trainer-feedback');
    if(!feedback){feedback=document.createElement('p');feedback.className='feedback';feedback.id='trainer-feedback';content.append(feedback)}
    feedback.textContent=t;
  }
  function audioBtn(id,label,cls){
    return '<button type="button" class="'+(cls||'audio')+'" data-audio-id="'+esc(id)+'" aria-label="Слушать '+esc(label)+'">🔊 <span class="visually-hidden">Слушать</span></button>';
  }
  function comboBtn(unit,label){
    return '<button type="button" class="audio" data-combo="'+esc(unit)+'" aria-label="Слушать '+esc(label)+'">🔊</button>';
  }
  function specialCard(t){
    const unit=t[0],key='c:'+unit;
    return '<article class="sound-card'+(state.heard.has(key)?' listened':'')+'">'+
      '<span class="hint">'+esc(unit)+'</span><strong lang="zh-Hans">'+esc(t[2])+'</strong>'+
      '<span class="py">'+esc(t[1])+'</span><span class="ru">'+esc(t[3])+'</span>'+
      comboBtn(unit,t[1])+'</article>';
  }
  function comboMarkup(){
    const chosen=state.comboGroup==='all'?special:special.filter(t=>families[state.comboGroup]?.includes(t[0]));
    const explanation=state.comboGroup==='back'||state.comboGroup==='front'?'В этих слогах буква i НЕ звучит как обычная русская «и».':
      state.comboGroup==='umlaut'?'Для ü округли губы, как для «у», сохраняя положение языка для «и».':
      'Слушай слог целиком. Сравнивай придыхание, положение языка и тон.';
    return '<section class="panel"><div class="panel-header"><h2 class="panel-heading">Сложные сочетания</h2><span class="count-bubble">13 звуков</span></div>'+
     '<p class="panel-sub">Выбери группу, нажми 🔊 и повтори. Каждый пример — один целый слог.</p>'+
     '<div class="group-picker" role="group" aria-label="Группы сочетаний">'+groups.map(g=>'<button type="button" class="group-pill'+(g[0]===state.comboGroup?' active':'')+'" data-group="'+g[0]+'">'+g[1]+'</button>').join('')+'</div>'+
     '<div class="syllable-grid">'+chosen.map(specialCard).join('')+'</div>'+
     '<p class="note">💡 '+esc(explanation)+'</p></section>';
  }
  function itemsForLetter(){
    if(!corpus)return [];
    const term=normalize(state.search);
    let items=[];
    if(state.letter==='Все'){
      items=corpus.clips.map(c=>({id:c.id,hz:c.text,py:c.pinyin,ru:corpus.ru.get(c.id)||'Пример слога',unit:corpus.units.get(c.id)||''}));
    }else{
      const group=corpus.groups.find(g=>g.letter.toUpperCase()===state.letter);
      items=(group?.items||[]).map(c=>({id:c.id,hz:c.hz,py:c.py,ru:c.ru,unit:c.unit}));
      items=items.filter((c,i)=>items.findIndex(t=>t.id===c.id)===i);
    }
    if(term)items=items.filter(c=>normalize([c.py,c.hz,c.ru,c.unit].join(' ')).includes(term));
    return items;
  }
  function syllableCard(x){
    return '<article class="sound-card'+(state.heard.has(x.id)?' listened':'')+'">'+
      '<span class="hint">'+esc(x.unit||'слог')+'</span><strong lang="zh-Hans">'+esc(x.hz)+'</strong>'+
      '<span class="py">'+esc(x.py)+'</span><span class="ru">'+esc(x.ru)+'</span>'+audioBtn(x.id,x.py)+'</article>';
  }
  function syllableResults(){
    const list=itemsForLetter(),visible=list.slice(0,state.limit);
    return '<div class="toolbar"><span id="syllable-count">Найдено: '+list.length+'</span>'+
       '<label for="reading-speed">Скорость: <select id="reading-speed" aria-label="Скорость воспроизведения"><option value="0.85"'+(state.rate===0.85?' selected':'')+'>0,85×</option><option value="1"'+(state.rate===1?' selected':'')+'>1×</option></select></label></div>'+
       '<div id="syllable-results" class="syllable-grid">'+(visible.length?visible.map(syllableCard).join(''):'<p class="note">Ничего не найдено. Попробуй другую букву или слог.</p>')+'</div>'+
       (visible.length<list.length?'<button type="button" data-show-more class="more">Показать ещё · '+(list.length-visible.length)+'</button>':'');
  }
  function syllablesMarkup(){
    return '<section class="panel"><div class="panel-header"><h2 class="panel-heading">Чтение слогов</h2><span class="count-bubble">190 MP3</span></div>'+
     '<p class="panel-sub">Полный справочник с примерами. Сначала слушай, затем повторяй с правильным тоном.</p>'+
     '<input id="syllable-search" class="search-input" type="search" placeholder="Найди слог: xiao, sh, ü, 好…" value="'+esc(state.search)+'" aria-label="Поиск по пиньиню, иероглифу и переводу">'+
     '<div class="alphabet" role="group" aria-label="Буква справочника">'+['Все',...corpus.groups.map(x=>x.letter.toUpperCase())].map(x=>'<button type="button" data-letter="'+esc(x)+'" class="letter-pill'+(state.letter===x?' active':'')+'">'+esc(x)+'</button>').join('')+'</div>'+
     '<div id="syllable-results-wrap">'+syllableResults()+'</div>'+
     '<p class="note">Обозначение сверху показывает изучаемую часть пиньиня. В аудио всегда звучит целый слог или пример, не отдельная буква.</p></section>';
  }
  function updateSyllables(){
    const wrap=document.getElementById('syllable-results-wrap');if(wrap)wrap.innerHTML=syllableResults();
  }
  function toneRule(r,i){
    return '<article class="rule"><h3>'+esc(r.title.replace(/^\d+\.\s*/,''))+'</h3><p>'+esc(r.detail)+'</p>'+
      '<div class="rule-examples">'+r.items.map(x=>'<button type="button" class="mini-audio" data-audio-id="'+esc(x.id)+'" aria-label="Слушать '+esc(x.py)+'"><strong>'+esc(x.py)+'</strong> 🔊</button>').join('')+'</div></article>';
  }
  function quizMarkup(){
    const q=quiz[state.quizIndex%quiz.length];
    return '<section class="quiz"><h3>🎧 Угадай тон на слух</h3><p>Послушай слово 妈 / 麻 / 马 / 骂 и выбери правильный пиньинь.</p>'+
      '<div class="rule-examples">'+audioBtn(q.id,'звук тонов','mini-audio')+'</div>'+
      '<div class="choices">'+opts.map(o=>'<button type="button" data-quiz="'+esc(o)+'"'+(state.quizCorrect?' disabled':'')+' class="'+(state.quizCorrect&&o===q.answer?'correct':'')+'">'+esc(o)+'</button>').join('')+'</div>'+
      '<p id="quiz-feedback" class="feedback" role="status">'+(state.quizCorrect?'✓ Верно, тон определён!':'Выбери ответ после прослушивания.')+'</p>'+
      (state.quizCorrect?'<button type="button" data-quiz-next class="action">Следующий звук →</button>':'')+'</section>';
  }
  function tonesMarkup(){
    return '<section class="panel"><div class="panel-header"><h2 class="panel-heading">Тоны и правила</h2><span class="count-bubble">21 правило</span></div>'+
      '<p class="panel-sub">Почему 你好 звучит как ní hǎo, а 不是 — bú shì? Тренируй правила на настоящих примерах.</p>'+
      corpus.rules.slice(0,state.shownRules).map(toneRule).join('')+
      (state.shownRules<corpus.rules.length?'<button type="button" data-rules-more class="more">Показать остальные правила · '+(corpus.rules.length-state.shownRules)+'</button>':'')+
      quizMarkup()+'</section>';
  }
  function render(){
    cancelAudio();
    document.querySelectorAll('.section').forEach(b=>{const active=b.dataset.mode===state.mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
    if(!corpus)return;
    content.innerHTML=state.mode==='combos'?comboMarkup():state.mode==='syllables'?syllablesMarkup():tonesMarkup();
    footerNext.textContent=state.mode==='combos'?'К чтению слогов →':state.mode==='syllables'?'К тонам и правилам →':'Вернуться к сочетаниям →';
    paintProgress();
  }
  function setMode(mode){
    if(!['combos','syllables','tones'].includes(mode))return;
    state.mode=mode;state.limit=12;state.search='';
    render();
    document.querySelector('.sections')?.scrollIntoView?.({block:'nearest',behavior:'smooth'});
  }
  root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.mode){setMode(b.dataset.mode);return}
    if(b.dataset.audioId||b.dataset.combo){playTrack(b);return}
    if(b.dataset.group){state.comboGroup=b.dataset.group;render();return}
    if(b.dataset.letter){state.letter=b.dataset.letter;state.limit=12;document.querySelectorAll('.letter-pill').forEach(x=>x.classList.toggle('active',x===b));updateSyllables();return}
    if(b.hasAttribute('data-show-more')){state.limit+=12;updateSyllables();return}
    if(b.hasAttribute('data-rules-more')){state.shownRules=corpus.rules.length;render();return}
    if(b.dataset.quiz){const q=quiz[state.quizIndex%quiz.length];const feedback=document.getElementById('quiz-feedback');
      if(b.dataset.quiz===q.answer){state.quizCorrect=true;render()}else{b.classList.add('wrong');if(feedback)feedback.textContent='Пока неверно. Прослушай ещё раз и сравни направление тона.'}return}
    if(b.hasAttribute('data-quiz-next')){state.quizIndex++;state.quizCorrect=false;render();return}
  });
  root.addEventListener('input',e=>{
    if(e.target.id==='syllable-search'){state.search=e.target.value;state.limit=12;updateSyllables()}
  });
  root.addEventListener('change',e=>{
    if(e.target.id==='reading-speed'){state.rate=Number(e.target.value)===1?1:0.85}
  });
  footerNext.addEventListener('click',()=>{
    const ix=['combos','syllables','tones'].indexOf(state.mode);
    setMode(['combos','syllables','tones'][(ix+1)%3]);
  });
  const recordStart=document.getElementById('record-start'),
        recordStop=document.getElementById('record-stop'),
        recordReplay=document.getElementById('record-replay'),
        recFeedback=document.getElementById('rec-feedback');
  function recorderState(){
    recordStart.disabled=!!recording&&recording.state==='recording';
    recordStop.disabled=!recording||recording.state!=='recording';
    recordReplay.disabled=!micUrl;
  }
  function releaseStream(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}}
  recordStart.addEventListener('click',async()=>{
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){recFeedback.textContent='Запись недоступна в этом браузере.';return}
    try{
      cancelAudio();stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      if(micUrl){URL.revokeObjectURL(micUrl);micUrl=null}
      chunks=[];recording=new MediaRecorder(stream);
      recording.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
      recording.onstop=()=>{
        micUrl=chunks.length?URL.createObjectURL(new Blob(chunks,{type:recording.mimeType||'audio/webm'})):null;
        releaseStream();recorderState();recFeedback.textContent=micUrl?'Запись готова. Сравни свой голос с примером выше.':'Звук не записался.';
      };
      recording.start();recorderState();recFeedback.textContent='Идёт запись. Повтори звук или фразу.';
    }catch{releaseStream();recorderState();recFeedback.textContent='Для записи разреши доступ к микрофону.'}
  });
  recordStop.addEventListener('click',()=>{if(recording?.state==='recording')recording.stop()});
  recordReplay.addEventListener('click',()=>{if(micUrl){cancelAudio();const a=new Audio(micUrl);player=a;a.play().catch(()=>{recFeedback.textContent='Не удалось прослушать запись.'})}});
  window.addEventListener('pagehide',()=>{cancelAudio();if(recording?.state==='recording')recording.stop();releaseStream();if(micUrl)URL.revokeObjectURL(micUrl)});
  paintProgress();
  fetch('./assets/pinyin-reading-curriculum.json',{cache:'default'})
    .then(r=>{if(!r.ok)throw Error('curriculum unavailable');return r.json()})
    .then(d=>{
      if(!Array.isArray(d.groups)||!Array.isArray(d.rules)||!Array.isArray(d.clips)||d.clips.length!==190)throw Error('invalid curriculum');
      const ru=new Map(),units=new Map();
      d.groups.forEach(g=>(g.items||[]).forEach(x=>{if(!ru.has(x.id))ru.set(x.id,x.ru);if(!units.has(x.id))units.set(x.id,x.unit)}));
      corpus={groups:d.groups,rules:d.rules,clips:d.clips,ru,units};render();
    })
    .catch(()=>{content.innerHTML='<section class="panel"><h2 class="panel-heading">Не удалось загрузить справочник</h2><p class="panel-sub">Проверь интернет или сохрани офлайн-пакет, затем открой тренажёр ещё раз.</p><button type="button" class="more" data-retry>Повторить загрузку</button></section>';
       content.querySelector('[data-retry]')?.addEventListener('click',()=>location.reload())});
})();
