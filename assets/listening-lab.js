/* Mandarin listening lab v1. Human-voiced exemplars from Wikimedia Commons.
   Audio is streamed on demand; no microphone data is collected or uploaded. */
(() => {
  'use strict';
  const host = document.querySelector('#tones .practice');
  if (!host || document.getElementById('listening-lab')) return;

  const examples = [{"tone":1,"hz":"高","py":"gāo","ru":"высокий","url":"./assets/course-human/cmn-高.mp3","page":"https://github.com/hugolpz/audio-cmn","credit":"Yue Tan","license":"CC BY-SA 3.0 US"},{"tone":1,"hz":"三","py":"sān","ru":"три","url":"./assets/course-human/cmn-三.mp3","page":"https://github.com/hugolpz/audio-cmn","credit":"Yue Tan","license":"CC BY-SA 3.0 US"},{"tone":1,"hz":"喝","py":"hē","ru":"пить","url":"./assets/course-human/cmn-喝.mp3","page":"https://github.com/hugolpz/audio-cmn","credit":"Yue Tan","license":"CC BY-SA 3.0 US"},{"tone":2,"hz":"麻","py":"má","ru":"конопля","url":"./assets/course-human/cmn-麻.mp3","page":"https://github.com/hugolpz/audio-cmn","credit":"Yue Tan","license":"CC BY-SA 3.0 US"},{"tone":2,"hz":"人","py":"rén","ru":"человек","url":"./assets/course-human/cmn-人.mp3","page":"https://github.com/hugolpz/audio-cmn","credit":"Yue Tan","license":"CC BY-SA 3.0 US"},{"tone":2,"hz":"茶","py":"chá","ru":"чай","url":"./assets/course-human/cmn-茶.mp3","page":"https://github.com/hugolpz/audio-cmn","credit":"Yue Tan","license":"CC BY-SA 3.0 US"},{"tone":3,"hz":"马","py":"mǎ","ru":"лошадь","url":"./assets/course-human/cmn-马.mp3","page":"https://github.com/hugolpz/audio-cmn","credit":"Yue Tan","license":"CC BY-SA 3.0 US"},{"tone":3,"hz":"五","py":"wǔ","ru":"пять","url":"./assets/course-human/cmn-五.mp3","page":"https://github.com/hugolpz/audio-cmn","credit":"Yue Tan","license":"CC BY-SA 3.0 US"},{"tone":3,"hz":"水","py":"shuǐ","ru":"вода","url":"./assets/course-human/cmn-水.mp3","page":"https://github.com/hugolpz/audio-cmn","credit":"Yue Tan","license":"CC BY-SA 3.0 US"},{"tone":4,"hz":"骂","py":"mà","ru":"ругать","url":"./assets/course-human/cmn-骂.mp3","page":"https://github.com/hugolpz/audio-cmn","credit":"Yue Tan","license":"CC BY-SA 3.0 US"},{"tone":4,"hz":"四","py":"sì","ru":"четыре","url":"./assets/course-human/cmn-四.mp3","page":"https://github.com/hugolpz/audio-cmn","credit":"Yue Tan","license":"CC BY-SA 3.0 US"},{"tone":4,"hz":"大","py":"dà","ru":"большой","url":"./assets/hanzi-human/cmn-大.mp3","page":"https://github.com/hugolpz/audio-cmn","credit":"Yue Tan","license":"CC BY-SA 3.0 US"},{"tone":5,"hz":"谢谢","py":"xièxie","ru":"спасибо","url":"./assets/course-human/cmn-谢谢.mp3","page":"https://github.com/hugolpz/audio-cmn","credit":"Yue Tan","license":"CC BY-SA 3.0 US"},{"tone":5,"hz":"名字","py":"míngzi","ru":"имя","url":"./assets/course-human/cmn-名字.mp3","page":"https://github.com/hugolpz/audio-cmn","credit":"Yue Tan","license":"CC BY-SA 3.0 US"}];
  const lab=document.createElement('section');
  lab.className='panel';
  lab.id='listening-lab';
  lab.setAttribute('aria-label','Аудирование: различение китайских тонов');
  lab.innerHTML=[
    '<div class="ear-overline">🎧 ПРАКТИКА АУДИРОВАНИЯ</div>',
    '<h2>Какой тон ты услышал?</h2>',
    '<p class="ear-description">10 вопросов: четыре тона и нейтральный. Сначала прослушай запись. Если слышишь два слога, оцени тон второго. Затем выбери ответ.</p>',
    '<div id="ear-counter" class="ear-counter" aria-live="polite">Вопрос 1 из 10</div>',
    '<div class="ear-actions"><button type="button" id="ear-play" class="btn dark">🔊 Слушать запись</button><button type="button" id="ear-replay" class="btn soft" disabled>↻ Повторить</button></div>',
    '<div class="ear-options" role="group" aria-label="Выбери номер тона">',
      '<button type="button" data-ear-tone="1" disabled>1-й <small>—</small></button>',
      '<button type="button" data-ear-tone="2" disabled>2-й <small>↗</small></button>',
      '<button type="button" data-ear-tone="3" disabled>3-й <small>↘↗</small></button>',
      '<button type="button" data-ear-tone="4" disabled>4-й <small>↘</small></button>',
      '<button type="button" data-ear-tone="5" disabled>Нейтр. <small>·</small></button>',
    '</div>',
    '<div id="ear-feedback" class="ear-feedback" role="status" aria-live="polite">Нажми «Слушать запись», затем выбери тон. В двухсложном слове слушай второй слог.</div>',
    '<button type="button" class="btn primary ear-next" id="ear-next" hidden>Следующий вопрос →</button>',
    '<p class="ear-notice">Локальные записи носителя. Для работы без сети скачай материалы в настройках. Если запись недоступна, упражнение предложит повторить загрузку, а не заменит голос на телефонный. Этот тест тренирует слух, а не оценивает произношение.</p>',
    '<details class="ear-credits"><summary>Авторы записей и лицензии</summary><div id="ear-credit-list"></div></details>'
  ].join('');
  host.before(lab);

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
  const key='chinese-tone-ear-v2';
  function shuffled(values) {
    const out=values.slice();
    for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
    return out;
  }
  function sample(){return examples[deck[index]]}
  function stopAudio(){playSequence++;if(currentAudio){currentAudio.pause();currentAudio=null}}
  window.addEventListener('learning-audio-stop',stopAudio);
  function lockChoices(disabled){choices.forEach(b=>b.disabled=disabled)}
  function newQuestion(){
    stopAudio();answered=false;heard=false;
    const item=sample();
    counter.textContent='Вопрос '+(index+1)+' из '+deck.length;
    feedback.textContent='Прослушай запись. Если слога два — оцени последний.';
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
      const a=new Audio(item.url);
      a.preload='auto';currentAudio=a;
      await Promise.race([a.play(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),10000))]);
      if(token!==playSequence){a.pause();return}
      feedback.textContent='Запись звучит. Выбери тон услышанного слога.';
      heard=true;lockChoices(answered);
      replayBtn.disabled=false;
    }catch(err){
      currentAudio?.pause();
      if(token!==playSequence)return;
      // Never substitute synthetic speech in a listening test: it changes the tone evidence.
      feedback.textContent='Запись не загрузилась. Подключи интернет или скачай материалы, затем нажми «Слушать запись» ещё раз.';
      heard=false;lockChoices(true);replayBtn.disabled=true;
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
    feedback.textContent=(ok?'✓ Верно! ':'↻ Пока неверно. ')+item.py+' · '+item.hz+' — '+item.ru+'. '+(item.tone===5?'Последний слог — нейтральный тон.':'Это '+item.tone+'-й тон.');
    nextBtn.hidden=false;nextBtn.textContent=index+1===deck.length?'Показать результат →':'Следующий вопрос →';
  }
  function finish(){
    stopAudio();
    counter.textContent='Тренировка завершена';
    playBtn.disabled=true;replayBtn.disabled=true;lockChoices(true);nextBtn.hidden=false;
    const counts=errors.reduce((a,v)=>{a[v]=(a[v]||0)+1;return a},{});
    const hardest=Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];
    feedback.textContent='Результат: '+score+' из '+deck.length+'. '+(hardest?'Чаще всего ошибался: '+(hardest==='5'?'нейтральный тон':hardest+'-й тон')+'. Повтори записи.':'Отлично различаешь изученные тоны!');
    nextBtn.textContent='Пройти заново ↻';
    try{
      localStorage.setItem(key,JSON.stringify({correct:score,total:deck.length,completedAt:new Date().toISOString(),errors}));
    }catch(e){}
  }
  function start(){
    // Two trials of each of the four lexical tones plus neutral tone.
    deck=shuffled([1,2,3,4,5].flatMap(tone=>shuffled(examples.map((v,i)=>v.tone===tone?i:-1).filter(i=>i>=0)).slice(0,2)));
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