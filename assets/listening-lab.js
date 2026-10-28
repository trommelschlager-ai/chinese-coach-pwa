/* Mandarin listening lab v1. Human-voiced exemplars from Wikimedia Commons.
   Audio is streamed on demand; no microphone data is collected or uploaded. */
(() => {
  'use strict';
  const host = document.querySelector('#tones .practice');
  if (!host || document.getElementById('listening-lab')) return;

  const examples = [
    {tone:1,hz:'高',py:'gāo',ru:'высокий',url:'https://upload.wikimedia.org/wikipedia/commons/6/6f/Zh-g%C4%81o.ogg',page:'https://commons.wikimedia.org/wiki/File:Zh-g%C4%81o.ogg',credit:'Wei Gao, Vion Nicolas',license:'CC BY 2.0 FR'},
    {tone:2,hz:'麻',py:'má',ru:'конопля',url:'https://upload.wikimedia.org/wikipedia/commons/c/c9/Zh-m%C3%A1.ogg',page:'https://commons.wikimedia.org/wiki/File:Zh-m%C3%A1.ogg',credit:'Yue Tan',license:'CC BY-SA 3.0 US'},
    {tone:3,hz:'马',py:'mǎ',ru:'лошадь',url:'https://upload.wikimedia.org/wikipedia/commons/c/cc/Zh-m%C7%8E.ogg',page:'https://commons.wikimedia.org/wiki/File:Zh-m%C7%8E.ogg',credit:'Wei Gao, Vion Nicolas',license:'CC BY 2.0 FR'},
    {tone:4,hz:'骂',py:'mà',ru:'ругать',url:'https://upload.wikimedia.org/wikipedia/commons/1/1d/Zh-m%C3%A0.ogg',page:'https://commons.wikimedia.org/wiki/File:Zh-m%C3%A0.ogg',credit:'Yue Tan',license:'CC BY-SA 3.0 US'}
  ];
  const lab=document.createElement('section');
  lab.className='panel';
  lab.id='listening-lab';
  lab.setAttribute('aria-label','Аудирование: различение китайских тонов');
  lab.innerHTML=[
    '<div class="ear-overline">🎧 ПРАКТИКА АУДИРОВАНИЯ</div>',
    '<h2>Какой тон ты услышал?</h2>',
    '<p class="ear-description">8 вопросов. Прослушай голос носителя, а затем выбери тон. Здесь намеренно разные слова и два голоса: ориентируйся на движение интонации, не на высоту голоса собеседника.</p>',
    '<div id="ear-counter" class="ear-counter" aria-live="polite">Вопрос 1 из 8</div>',
    '<div class="ear-actions"><button type="button" id="ear-play" class="btn dark">🔊 Слушать запись</button><button type="button" id="ear-replay" class="btn soft" disabled>↻ Повторить</button></div>',
    '<div class="ear-options" role="group" aria-label="Выбери номер тона">',
      '<button type="button" data-ear-tone="1" disabled>1-й <small>—</small></button>',
      '<button type="button" data-ear-tone="2" disabled>2-й <small>↗</small></button>',
      '<button type="button" data-ear-tone="3" disabled>3-й <small>↘↗</small></button>',
      '<button type="button" data-ear-tone="4" disabled>4-й <small>↘</small></button>',
    '</div>',
    '<div id="ear-feedback" class="ear-feedback" role="status" aria-live="polite">Нажми «Слушать запись», затем выбери один из четырёх тонов.</div>',
    '<button type="button" class="btn primary ear-next" id="ear-next" hidden>Следующий вопрос →</button>',
    '<p class="ear-notice">Голоса реальных носителей; записи загружаются через интернет. Без сети используется установленный китайский голос телефона, если он доступен. Этот тест тренирует слух, а не оценивает твоё произношение.</p>',
    '<details class="ear-credits"><summary>Авторы записей и лицензии</summary><div id="ear-credit-list"></div></details>'
  ].join('');
  host.after(lab);

  const counter=lab.querySelector('#ear-counter'),feedback=lab.querySelector('#ear-feedback'),playBtn=lab.querySelector('#ear-play'),replayBtn=lab.querySelector('#ear-replay'),nextBtn=lab.querySelector('#ear-next'),choices=[...lab.querySelectorAll('[data-ear-tone]')];
  const sourceLinks=lab.querySelector('#ear-credit-list');
  examples.forEach(item=>{
    const p=document.createElement('p');
    const a=document.createElement('a');
    a.href=item.page; a.target='_blank'; a.rel='noopener noreferrer';
    a.textContent=item.py+' · '+item.hz+' — '+item.credit+' ('+item.license+')';
    p.appendChild(a);sourceLinks.appendChild(p);
  });

  let deck=[],index=0,score=0,answered=false,heard=false,currentAudio=null,playSequence=0,errors=[];
  const key='chinese-tone-ear-v1';
  function shuffled(values) {
    const out=values.slice();
    for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
    return out;
  }
  function sample(){return examples[deck[index]-1]}
  function stopAudio(){playSequence++;if(currentAudio){currentAudio.pause();currentAudio=null}}
  function lockChoices(disabled){choices.forEach(b=>b.disabled=disabled)}
  function newQuestion(){
    stopAudio();answered=false;heard=false;
    const item=sample();
    counter.textContent='Вопрос '+(index+1)+' из '+deck.length;
    feedback.textContent='Прослушай запись, затем выбери тон.';
    nextBtn.hidden=true;playBtn.disabled=false;replayBtn.disabled=true;
    choices.forEach(b=>{b.classList.remove('ear-correct','ear-wrong');b.disabled=true});
    playBtn.textContent='🔊 Слушать запись';
    // The written word and pinyin are intentionally hidden before an answer.
    lab.dataset.currentTone='';
  }
  async function playSample(){
    const token=++playSequence,item=sample();
    if(currentAudio){currentAudio.pause();currentAudio=null}
    playBtn.disabled=true;feedback.textContent='Загружаю голос носителя…';
    try{
      if(!navigator.onLine)throw new Error('offline');
      const a=new Audio(item.url);
      a.preload='auto';currentAudio=a;
      await a.play();
      if(token!==playSequence){a.pause();return}
      feedback.textContent='Запись звучит. Выбери услышанный тон.';
      heard=true;lockChoices(answered);
      replayBtn.disabled=false;
    }catch(err){
      if(token!==playSequence)return;
      // The fallback is explicitly marked as synthetic and only offered if a zh voice exists.
      const voice=typeof chineseVoice==='function'?chineseVoice():null;
      if(voice&&(navigator.onLine||voice.localService!==false)&&typeof speakChinese==='function'){
        speakChinese(item.hz,.8);
        feedback.textContent='Оригинальная запись недоступна. Включён системный китайский голос — результаты могут отличаться.';
        heard=true;lockChoices(answered);replayBtn.disabled=false;
      }else{
        feedback.textContent='Не удалось загрузить запись. Проверь интернет или установи китайский голос zh-CN и попробуй снова. Ответы пока заблокированы.';
        heard=false;lockChoices(true);
      }
    }finally{
      if(token===playSequence)playBtn.disabled=false;
    }
  }
  function choose(tone){
    if(!heard||answered)return;
    answered=true;lockChoices(true);
    const item=sample(),ok=tone===item.tone;
    if(ok)score++;else errors.push(item.tone);
    choices.forEach(b=>{
      const val=Number(b.dataset.earTone);
      if(val===item.tone)b.classList.add('ear-correct');
      else if(val===tone)b.classList.add('ear-wrong');
    });
    feedback.textContent=(ok?'✓ Верно! ':'↻ Пока неверно. ')+item.py+' · '+item.hz+' — '+item.ru+'. Это '+item.tone+'-й тон.';
    nextBtn.hidden=false;nextBtn.textContent=index+1===deck.length?'Показать результат →':'Следующий вопрос →';
  }
  function finish(){
    stopAudio();
    counter.textContent='Тренировка завершена';
    playBtn.disabled=true;replayBtn.disabled=true;lockChoices(true);nextBtn.hidden=false;
    const counts=errors.reduce((a,v)=>{a[v]=(a[v]||0)+1;return a},{});
    const hardest=Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];
    feedback.textContent='Результат: '+score+' из '+deck.length+'. '+(hardest?'Чаще всего ошибался в '+hardest+'-м тоне. Повтори его на карточках выше.':'Отлично различаешь эти четыре образца!');
    nextBtn.textContent='Пройти заново ↻';
    try{
      localStorage.setItem(key,JSON.stringify({correct:score,total:deck.length,completedAt:new Date().toISOString(),errors}));
    }catch(e){}
  }
  function start(){
    // Two trials of each tone in a randomized order.
    deck=shuffled([1,2,3,4,1,2,3,4]);
    index=0;score=0;errors=[];newQuestion();
  }
  playBtn.addEventListener('click',playSample);
  replayBtn.addEventListener('click',playSample);
  choices.forEach(b=>b.addEventListener('click',()=>choose(Number(b.dataset.earTone))));
  nextBtn.addEventListener('click',()=>{
    if(index===deck.length-1&&answered){index++;finish();return}
    if(index>=deck.length){start();return}
    if(!answered)return;
    index++;newQuestion();
  });
  start();
})();