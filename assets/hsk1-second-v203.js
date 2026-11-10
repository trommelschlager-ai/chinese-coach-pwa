/* Panda Go — HSK1 lesson 2 v203: six new words, two sentence patterns,
   early retrieval practice and spaced review. Separate key preserves v3/v202 progress.
   Vocabulary: one pre-existing licensed Yue Tan speaker; dialogues: existing course voices. */
(()=>{
'use strict';
const area=document.getElementById('pg-content'),next=document.getElementById('pg-next'),
 back=document.getElementById('pg-back'),counter=document.getElementById('pg-counter'),
 progress=document.getElementById('pg-progress'),fill=document.getElementById('pg-progress-fill'),
 announcement=document.getElementById('pg-announcement');
if(!area||!next||!back||!counter||!fill)return;
const KEY='pg-hsk1-v203-pronouns', COMPLETE='pg-hsk1-v3-complete',TOTAL=12;
const vocab={
 '我':['wǒ','я','повторение'],'你':['nǐ','ты','повторение'],
 '他':['tā','он','новое'],'她':['tā','она','новое'],
 '我们':['wǒmen','мы','новое'],'你们':['nǐmen','вы (несколько)','новое'],
 '老师':['lǎoshī','учитель','новое'],'吗':['ma','вопросительная частица','новое'],
 '学生':['xuésheng','студент','повторение'],'是':['shì','быть / являться','повторение'],
 '您':['nín','Вы — уважительно к одному человеку','новое'],
 '它':['tā','оно (бонус)','дополнительно'],
 '你好':['nǐ hǎo','привет / здравствуйте','повторение']
};
const newWords=['他','她','我们','你们','老师','吗','您'];
const prompts={
 0:[{q:'Вспомни: какое слово означает «ты»?',a:['我','你','是'],r:1}],
 1:[{q:'Выбери иероглиф «она».',a:['他','她','我'],r:1}],
 2:[
  {q:'Как пишется «он»?',a:['她','我','他'],r:2},
  {q:'Как пишется «она»?',a:['你','她','他'],r:1}],
 3:[{q:'Что означает 我们 (wǒmen)?',a:['вы','мы','они'],r:1},
    {q:'Как обратиться к учителю уважительно?',a:['你们','您','我们'],r:1}],
 4:[
  {q:'Что прозвучало?',sound:'我们',a:['你们','我','我们','你'],r:2},
  {q:'Что прозвучало?',sound:'你',a:['我们','你们','我','你'],r:3},
  {q:'Что прозвучало?',sound:'你们',a:['你们','我','我们','你'],r:0}],
 5:[{q:'Что означает 我是老师。?',sound:'我是老师。',a:['Я учитель.','Я студент.','Ты учитель?'],r:0}],
 7:[{q:'Где ставится 吗 (ma) в вопросе?',a:['В начале','После подлежащего','В конце'],r:2}],
 9:[
  {q:'Тебя спрашивают «你是老师吗？». Как ответить «Я учитель»?',sound:'你是老师吗？',role:'male',a:['我是老师。','你是老师吗？','我是学生。'],r:0},
  {q:'Ты услышал «我是老师。». Как спросить «Ты учитель?»',sound:'我是老师。',a:['我是老师。','你是老师吗？','老师是你。'],r:1}],
 11:[
  {q:'Что значит 你们 (nǐmen)?',a:['вы (несколько человек)','ты','мы'],r:0},
  {q:'Выбери слово «она».',a:['它','他','她'],r:2},
  {q:'Как сказать «Я учитель»?',a:['我是老师。','我老师是。','是我老师。'],r:0},
  {q:'Как спросить «Ты учитель?»',a:['你吗是老师？','你是老师吗？','吗你是老师？'],r:1},
  {q:'Послушай: какое слово звучит?',sound:'我们',a:['你们','我们','我'],r:1}]
};
const builds={
 6:[
  {label:'Я учитель.',tokens:['我','是','老师'],py:'Wǒ shì lǎoshī.'},
  {label:'Он учитель.',tokens:['他','是','老师'],py:'Tā shì lǎoshī.'}],
 8:[
  {label:'Ты учитель?',tokens:['你','是','老师','吗'],py:'Nǐ shì lǎoshī ma?'}]
};
const reviewEntries=[
 ['我','wǒ','я'],['你','nǐ','ты'],['您','nín','Вы — вежливо к одному'],
 ['他','tā','он'],['她','tā','она'],['它','tā','оно · бонус'],
 ['我们','wǒmen','мы'],['你们','nǐmen','вы — несколько'],
 ['你好','nǐ hǎo','привет / здравствуйте'],
 ['是','shì','быть / являться'],['老师','lǎoshī','учитель'],
 ['学生','xuésheng','студент'],['吗','ma','вопросительная частица'],
 ['你是老师吗？','Nǐ shì lǎoshī ma?','Ты учитель?'],
 ['我是老师。','Wǒ shì lǎoshī.','Я учитель.'],
 ['是的，我是老师。','Shì de, wǒ shì lǎoshī.','Да, я учитель.']
];
const cleanText=s=>String(s).replace(/[。！？，?!,\s]/g,'');
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defaults=()=>({step:0,done:Array(TOTAL).fill(false),index:{},attempts:{},
 mistakes:[],finalFirstTry:0,finalWrong:[],reviewIndex:0,reviewing:false,
 selected:[],heard:false,spoken:false,completed:false});
let state=defaults();
try{
 const raw=JSON.parse(localStorage.getItem(KEY)||'null');
 if(raw&&typeof raw==='object'){
  state.step=Number.isInteger(raw.step)?Math.min(TOTAL-1,Math.max(0,raw.step)):0;
  state.done=Array.from({length:TOTAL},(_,i)=>raw.done?.[i]===true);
  state.index=(raw.index&&typeof raw.index==='object'&&!Array.isArray(raw.index))?raw.index:{};
  state.attempts=(raw.attempts&&typeof raw.attempts==='object'&&!Array.isArray(raw.attempts))?raw.attempts:{};
  state.finalFirstTry=Number.isInteger(raw.finalFirstTry)?Math.max(0,Math.min(5,raw.finalFirstTry)):0;
  state.finalWrong=Array.isArray(raw.finalWrong)?[...new Set(raw.finalWrong.filter(i=>Number.isInteger(i)&&i>=0&&i<5))]:[];
  state.reviewIndex=Number.isInteger(raw.reviewIndex)?Math.max(0,Math.min(5,raw.reviewIndex)):0;
  state.reviewing=raw.reviewing===true;
  state.selected=Array.isArray(raw.selected)?raw.selected.filter(i=>Number.isInteger(i)&&i>=0&&i<4):[];
  state.heard=raw.heard===true;state.spoken=raw.spoken===true;state.completed=raw.completed===true;
 }
}catch{}
let audio=null,recorder=null,stream=null,recUrl=null,micBusy=false,recordChunks=[];
let reviewEpoch=0,reviewDelay=0,reviewResume=null;
const index=s=>Math.max(0,Math.min(50,Number(state.index[s])||0));
const audioMap=window.PANDA_HSK1_NATIVE_HUMAN_V167||{};
const unified=window.PANDA_HSK1_L2_ONE_VOICE_V208||{};
const course=window.PANDA_HSK1_VOICES||{};
function fileFor(hz,role='female'){
 const text=String(hz),key=cleanText(text);
 // The animated dialogue on screen 10 retains its two speakers.
 if(state.step===9){
  if(role==='female'&&text==='我是老师。')
   return './assets/hsk1-scene-v205/female-im-teacher-normalized.mp3';
  return course[role]?.[text]||course[role]?.[key]||unified[text]||null;
 }
 // Every available regular word and example uses the same human Yue Tan speaker.
 if(unified[text])return unified[text];
 if(unified[key])return unified[key];
 // A few words absent from that recording have an openly labeled fallback.
 if(vocab[key]&&audioMap[key])return audioMap[key];
 return course[role]?.[text]||course[role]?.[key]||null;
}
function stopAudio(){
 if(audio){try{audio.pause()}catch{}audio.onended=null;audio=null}
}
function stopReview(){
 reviewEpoch++;
 if(reviewDelay){clearTimeout(reviewDelay);reviewDelay=0;if(reviewResume){const resolve=reviewResume;reviewResume=null;resolve()}}
 stopAudio();
 try{window.speechSynthesis?.cancel()}catch{}
 const status=area.querySelector('[data-review-status]');
 if(status)status.textContent='Повторение остановлено.';
}
function nativeOrTTS(text){
 return fileFor(text,'female')||null;
}
function playReviewEntry(entry,epoch){
 return new Promise(resolve=>{
  if(epoch!==reviewEpoch){resolve();return}
  const [hanzi]=entry,file=nativeOrTTS(hanzi);
  let done=false;
  const complete=()=>{
   if(done)return;done=true;
   if(audio===player)audio=null;
   resolve();
  };
  let player=null;
  if(file){
   try{
    player=new Audio(file);audio=player;
    player.preload='auto';player.preservesPitch=true;player.playbackRate=unified[hanzi]?1:.9;
    player.onended=complete;player.onerror=complete;
    const attempt=player.play();
    if(attempt&&typeof attempt.catch==='function')attempt.catch(complete);
   }catch{complete()}
  }else if(window.speechSynthesis&&window.SpeechSynthesisUtterance){
   try{
    const utterance=new SpeechSynthesisUtterance(hanzi);
    utterance.lang='zh-CN';utterance.rate=.83;utterance.pitch=1;
    const voices=window.speechSynthesis.getVoices?.()||[];
    const chinese=voices.filter(v=>/^zh[-_]/i.test(v.lang||''));
    const preferred=chinese.find(v=>/female|woman|xiaoxiao|tingting|huihui|meijia|xiaoyi/i.test(v.name||''))||chinese[0];
    if(preferred)utterance.voice=preferred;
    utterance.onend=complete;utterance.onerror=complete;
    window.speechSynthesis.speak(utterance);
   }catch{complete()}
  }else{complete()}
 });
}
async function playReviewAll(){
 stopReview();
 const epoch=reviewEpoch;
 const status=area.querySelector('[data-review-status]');
 const stopBtn=area.querySelector('[data-review-stop]');
 if(stopBtn)stopBtn.disabled=false;
 for(let i=0;i<reviewEntries.length;i++){
  for(let repeat=0;repeat<2;repeat++){
   if(epoch!==reviewEpoch)return;
   if(status)status.textContent='Слушаем '+(i+1)+' / '+reviewEntries.length+': '+reviewEntries[i][0]+' · повтор '+(repeat+1)+' из 2';
   await playReviewEntry(reviewEntries[i],epoch);
   if(epoch!==reviewEpoch)return;
   await new Promise(done=>{reviewResume=done;reviewDelay=setTimeout(()=>{reviewDelay=0;reviewResume=null;done()},repeat===0?650:900)});
  }
 }
 if(status)status.textContent='✓ Все слова повторены два раза!';
 if(stopBtn)stopBtn.disabled=true;
}
function renderReviewList(){
 return window.PG2_SPEAKING?.render?.()||
  '<p>Тренировка произношения недоступна. Перезагрузи страницу.</p>';
}
function audioButton(hz,label='▶ Слушать',role='female'){
 const file=fileFor(hz,role),fallback=hz==='您';
 return '<button class="pg3-audio" data-audio="'+escapeHtml(hz)+'" data-role="'+escapeHtml(role)+'"'+(file||fallback?'':' disabled')+'>'+escapeHtml(label)+'</button>';
}
function feedback(message){
 if(announcement)announcement.textContent=message;
 const box=area.querySelector('[data-feedback]');
 if(box)box.textContent=message;
}
function play(hz,role='female'){
 const file=fileFor(hz,role);
 if(!file){
  if(hz==='您'){
   stopReview();
   const epoch=reviewEpoch;
   feedback('Слушаем 您: временная системная китайская озвучка.');
   playReviewEntry([hz],epoch);
  }else feedback('Запись пока недоступна.');
  return;
 }
 window.PG2_EXTRAS?.stopScene?.();
 stopAudio();
 try{
  const a=new Audio(file);audio=a;a.preload='auto';
  a.preservesPitch=true;
  // Do not slow already prepared same-speaker recordings: preserve natural pitches and tones.
  a.playbackRate=unified[hz]||unified[cleanText(hz)]?1:(vocab[cleanText(hz)]?1:0.9);
  a.onerror=()=>{if(audio===a)feedback('Запись не загрузилась. Проверь интернет.')};
  a.onended=()=>{if(audio===a)audio=null};
  a.onplaying=()=>{
   if(state.step===10&&cleanText(hz)==='你是老师吗'){
    state.heard=true;save();const confirm=area.querySelector('[data-spoken]');if(confirm)confirm.disabled=false;
   }
  };
  Promise.resolve(a.play()).catch(()=>feedback('Нажми «Слушать» ещё раз.'));
  save();
 }catch{feedback('Не удалось включить аудио.')}
}
function save(){
 try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}
}
function head(section,title,sub=''){
 return '<p class="screen-eyebrow">'+escapeHtml(section)+'</p>'+
 '<h1 class="screen-title">'+escapeHtml(title)+'</h1>'+
 (sub?'<p class="screen-sub">'+escapeHtml(sub)+'</p>':'');
}
function word(hz){
 const [py,ru,status]=vocab[hz];
 return '<article class="pg3-word"><strong lang="zh-Hans">'+hz+'</strong>'+
 '<span class="pg3-py">'+escapeHtml(py)+'</span><span class="pg3-ru">'+escapeHtml(ru)+'</span>'+
 audioButton(hz,'▶ Слушать')+'</article>';
}
function questionBlock(step){
 const seq=prompts[step],pos=index(step);
 if(pos>=seq.length)return '';
 const q=seq[pos];
 return '<div class="pg3-question"><p class="pg3-small">Задание '+(pos+1)+' из '+seq.length+'</p>'+
 '<h2>'+escapeHtml(q.q)+'</h2>'+
 (q.sound?audioButton(q.sound,'▶ Послушать запись',q.role||'female'):'')+
 '<div class="pg3-answers">'+q.a.map((answer,i)=>
 '<button type="button" data-answer="'+i+'">'+escapeHtml(answer)+'</button>').join('')+'</div>'+
 '<p class="pg3-feedback" data-feedback role="status"></p></div>';
}
function practiceSheet(step){
 const sequence=prompts[step]||[];
 return index(step)>=sequence.length?'':'<div class="sheet">'+questionBlock(step)+'</div>';
}
function buildSheet(step){
 const sequence=builds[step]||[];
 return index(step)>=sequence.length?'':'<div class="sheet">'+buildBlock(step)+'</div>';
}
function buildBlock(step){
 const seq=builds[step],pos=index(step);
 if(pos>=seq.length)return '';
 const current=seq[pos],selected=state.selected.filter(i=>i<current.tokens.length);
 const available=current.tokens.map((x,i)=>({x,i})).filter(o=>!selected.includes(o.i)).reverse();
 return '<div class="pg3-question"><p class="pg3-small">Предложение '+(pos+1)+' из '+seq.length+'</p>'+
 '<h2>'+escapeHtml(current.label)+'</h2>'+
 '<div class="pg3-built">'+(selected.length?selected.map((i,k)=>
 '<button class="pg3-token chosen" data-remove="'+k+'">'+current.tokens[i]+' ×</button>').join(''):
 '<span>Нажми слова в правильном порядке</span>')+'</div>'+
 '<div class="pg3-tokens">'+available.map(o=>'<button class="pg3-token" data-add="'+o.i+'">'+o.x+'</button>').join('')+'</div>'+
 '<button class="pg3-main" data-check-build>Проверить ✓</button><p data-feedback role="status" class="pg3-feedback"></p></div>';
}
function sample(title,items,extra=''){
 return '<div class="sheet soft"><span class="sheet-label">'+escapeHtml(title)+'</span>'+
 '<div class="pg3-grid">'+items.map(word).join('')+'</div>'+
 (extra?'<p class="pg3-note">'+escapeHtml(extra)+'</p>':'')+'</div>';
}
function renderFinal(){
 if(state.completed){
  return head('УРОК 2 · ПРОЙДЕН','Ты уже говоришь по-китайски! 🐼','Теперь ты умеешь говорить о себе и задавать простые вопросы.')+
   '<div class="sheet pg11-final-sheet">'+
   '<div class="pg11-result">🏆 <strong>'+state.finalFirstTry+' из 5</strong><span>правильно с первой попытки</span></div>'+
   '<div class="pg11-skills"><h2>Что ты уже умеешь</h2>'+
   '<p><strong lang="zh-Hans">我是老师。</strong> <span>Я учитель.</span></p>'+
   '<p><strong lang="zh-Hans">你是老师吗？</strong> <span>Ты учитель?</span></p>'+
   '<p><strong lang="zh-Hans">您</strong> <span>Вежливое «Вы»</span></p></div>'+
   '<h2 class="pg11-choose">Как будем закреплять?</h2>'+
   '<div class="pg11-actions">'+
   '<a class="pg11-primary" href="./hsk1-second-practice.html?mode=quick">🎤 Быстрая практика · 6 слов</a>'+
   '<a href="./hsk1-second-practice.html?mode=listen">🎧 Словарь и прослушивание</a>'+
   '<a href="./hsk1-second-practice.html?mode=full">🗣 Полная тренировка · 16 пунктов</a>'+
   '<a href="./hsk1-lesson.html?lesson=3">Следующий урок · HSK1 →</a>'+
   '</div><p class="pg11-reminder">💡 Завтра повтори слова ещё раз — это поможет лучше их запомнить.</p>'+
   '<div class="pg3-finish"><button data-restart>↻ Пройти урок заново</button><a href="./hsk1-map.html">К карте HSK1</a></div></div>';
 }
 if(index(11)>=5&&(!state.finalWrong.length||state.reviewIndex>=state.finalWrong.length)){
  state.done[11]=true;
  return head('ИТОГ','Проверка окончена!')+
   '<div class="sheet"><h2 class="pg3-result">С первой попытки: '+state.finalFirstTry+' из 5</h2>'+
   '<p class="pg3-note">'+(state.finalWrong.length?'Ошибочные ответы ты уже повторил.':'Все ответы верны с первой попытки.')+'</p>'+
   '<button class="pg3-main" data-finish>✓ Завершить урок</button></div>';
 }
 if(index(11)>=5&&state.finalWrong.length){
  state.reviewing=true;
  const wrong=state.finalWrong[state.reviewIndex];
  const q=prompts[11][wrong];
  return head('ПОВТОРЕНИЕ ОШИБОК','Закрепим трудное','Задание '+(state.reviewIndex+1)+' из '+state.finalWrong.length)+
   '<div class="sheet"><div class="pg3-question"><h2>'+escapeHtml(q.q)+'</h2>'+
   (q.sound?audioButton(q.sound,'▶ Послушать'):'')+
   '<div class="pg3-answers">'+q.a.map((opt,i)=>'<button data-review-answer="'+i+'">'+escapeHtml(opt)+'</button>').join('')+'</div>'+
   '<p class="pg3-feedback" data-feedback role="status"></p></div></div>';
 }
 return head('ПРОВЕРКА','Что ты запомнил?','Пять коротких заданий, затем повторение ошибок.')+
 '<div class="sheet">'+questionBlock(11)+'</div>';
}
const screens=[
 ()=>head('УРОК 2 · HSK1','Вспомним знакомое','Сначала повторим 我 и 你, потом добавим новые слова.')+
  sample('ПОВТОРЕНИЕ',['我','你'],'Вспомни знакомые слова из первого урока.')+
  practiceSheet(0),
 ()=>head('НОВЫЕ СЛОВА · 1/4','Он и она','Два иероглифа — одно произношение tā.')+
  sample('НОВОЕ',['他','她'],'他 — он, 她 — она. Оба произносятся tā (1-й тон). Различаем по иероглифу, а не на слух.')+
  practiceSheet(1),
 ()=>head('ПРАКТИКА','Кто есть кто?','Выбирай по значению, а не по звуку.')+
  practiceSheet(2),
 ()=>head('НОВЫЕ СЛОВА · 2/4','Мы, вы и вежливое «Вы»','Познакомимся с тремя формами обращения.')+
  sample('НОВОЕ',['我们','你们','您'],'我们 — мы; 你们 — вы, несколько человек. 您 (nín, 2-й тон ↗) — вежливое «Вы» одному человеку; 你 (nǐ, 3-й тон) — «ты».\nУчителю можно сказать: 您好！Nín hǎo! — Здравствуйте!')+
  practiceSheet(3),
 ()=>head('ТРЕНИРОВКА СЛУХА','Узнай слово','Отличай короткие местоимения от форм с 们.')+
  practiceSheet(4),
 ()=>head('НОВОЕ СЛОВО · 3/4','Кто ты?','老师 — учитель. Повторим связку 是.')+
  sample('НОВОЕ СЛОВО',['老师'],'是 (shì) уже знакомо: оно связывает подлежащее с существительным.')+
  '<div class="sheet"><div class="pg3-sentence">我是老师。</div>'+
  '<p class="pinyin">Wǒ shì lǎoshī.</p><p class="translation">Я учитель.</p>'+
  audioButton('我是老师。','▶ Слушать предложение')+
  '<div class="pg3-note">我 — я · 是 — являюсь · 老师 — учитель</div>'+
  questionBlock(5)+'</div>',
 ()=>head('ПРАКТИКА','Собери утверждение','Три предложения из уже знакомых слов.')+
  buildSheet(6),
 ()=>head('НОВОЕ СЛОВО · 4/4','Как задать вопрос?','Новая частица 吗 (ma).')+
  sample('НОВОЕ',['吗'],'吗 ставится в конце предложения, произносится нейтральным тоном.')+
  '<div class="sheet"><div class="pg3-sentence">你是老师吗？</div>'+
  '<p class="pinyin">Nǐ shì lǎoshī ma?</p><p class="translation">Ты учитель?</p>'+
  audioButton('你是老师吗？','▶ Слушать вопрос','female')+
  questionBlock(7)+'</div>',
 ()=>head('ПРАКТИКА','Собери вопрос','Добавляй 吗 в конец.')+
  buildSheet(8),
 ()=>head('МИНИ-ДИАЛОГ','Ответь собеседнику','Послушай реплику, попробуй ответить вслух и выбери правильную фразу.')+
  '<div class="sheet pg3-dialogue-sheet">'+questionBlock(9)+
  (index(9)>=prompts[9].length?'<div class="pg3-dialogue-repeat"><p>🎙 Твоя очередь: скажи вслух «我是老师。» — «Я учитель».</p><button type="button" data-dialogue-again>↻ Ответить ещё раз</button></div>':'')+
  '</div>',
 ()=>head('ПРОИЗНОШЕНИЕ','Теперь скажи сам','Послушай, повтори вслух и сравни с записью.')+
  '<div class="sheet"><div class="pg3-sentence">你是老师吗？</div>'+
  '<p class="pinyin">Nǐ shì lǎoshī ma?</p><p class="translation">Ты учитель?</p>'+
  audioButton('你是老师吗？','▶ Слушать образец','female')+
  '<div class="pg3-recorder">'+
  '<button data-record-start'+(micBusy?' disabled':'')+'>🎙 Записать</button>'+
  '<button data-record-stop'+(micBusy?'':' disabled')+'>■ Стоп</button>'+
  (recUrl?'<button data-record-play>▶ Мой голос</button>':'')+'</div>'+
  '<p class="pg3-note">Запись необязательна. Сравнение произношения выполняется на слух — автоматической проверки тонов здесь нет.</p>'+
  '<button class="pg3-main" data-spoken'+(state.heard&&!state.spoken?'':' disabled')+'>'+
  (state.spoken?'✓ Повторил вслух':'Я произнёс фразу ✓')+'</button>'+
  '<p class="pg3-feedback" data-feedback role="status"></p></div>',
 renderFinal
];
function safeStopMic(){
 if(recorder?.state==='recording'){try{recorder.onstop=null;recorder.stop()}catch{}}
 if(stream){for(const t of stream.getTracks())t.stop()}
 stream=null;recorder=null;micBusy=false;
}
const AUTO_ADVANCE_DRILLS=new Set([2,4,6,8]);
function skipCompletedDrills(){
 while(state.step>=0&&state.step<TOTAL-1&&AUTO_ADVANCE_DRILLS.has(state.step)&&state.done[state.step])state.step++;
}
function render(){
 skipCompletedDrills();
 if(state.step!==11||!state.completed)window.PG2_SPEAKING?.cleanup?.();
 stopReview();
 window.PG2_EXTRAS?.beforeRender?.();
 stopAudio();
 if(state.step!==10&&micBusy)safeStopMic();
 const p=state.step;
 counter.textContent=String(p+1).padStart(2,'0')+' / 12';
 progress.setAttribute('aria-valuemax','12');
 progress.setAttribute('aria-valuenow',String(p+1));
 fill.style.width=(100*(p+1)/TOTAL)+'%';
 area.innerHTML=screens[p]();
 window.PG2_EXTRAS?.afterRender?.(p,area);
 if(p===11&&state.completed)window.PG2_SPEAKING?.afterRender?.();
 area.scrollTop=0;
 back.disabled=p===0;
 next.hidden=p===11;
 next.disabled=!state.done[p]||p===11;
 next.textContent=p===10?'К проверке →':'Дальше →';
 save();
}
function advance(){
 if(!state.done[state.step]){feedback('Сначала выполни задание.');return}
 if(state.step<TOTAL-1){state.step++;state.selected=[];render()}
}
function applyAnswer(step,choice){
 const seq=prompts[step],pos=index(step),q=seq?.[pos];
 if(!q)return;
 const key=step+'-'+pos;
 if(choice===q.r){
  if(step===11&&!state.attempts[key])state.finalFirstTry++;
  state.index[step]=pos+1;
  if(step!==11&&pos+1===seq.length)state.done[step]=true;
  if(step===11&&pos+1===seq.length&&state.finalWrong.length===0)state.done[11]=true;
  if(step!==11&&AUTO_ADVANCE_DRILLS.has(step)&&state.done[step]){state.step++;state.selected=[]}
  render();return;
 }
 state.attempts[key]=(state.attempts[key]||0)+1;
 if(step===11&&!state.finalWrong.includes(pos))state.finalWrong.push(pos);
 save();
 feedback(state.attempts[key]>1?'Пока неверно. Пересмотри слова и попробуй снова.':'Попробуй ещё раз. Сначала вспомни значение каждого слова.');
}
function applyBuild(step){
 const pos=index(step),obj=builds[step]?.[pos];
 if(!obj)return;
 const good=state.selected.length===obj.tokens.length&&state.selected.every((i,k)=>i===k);
 if(!good){feedback('Проверь порядок: кто + 是 + профессия'+(step===8?' + 吗':'')+'.');return}
 state.index[step]=pos+1;
 state.selected=[];
 if(state.index[step]===builds[step].length){state.done[step]=true;if(AUTO_ADVANCE_DRILLS.has(step)){state.step++;state.selected=[]}}
 render();
}
function finish(){
 if(!state.done[11])return;
 state.completed=true;save();
 // Preserve old lesson history and unlock HSK1 lesson 3 for the existing map.
 try{
  let list=JSON.parse(localStorage.getItem(COMPLETE)||'[]');
  if(!Array.isArray(list))list=[];
  if(!list.includes('pronouns'))list.push('pronouns');
  localStorage.setItem(COMPLETE,JSON.stringify(list));
 }catch{}
 render();
}
back.addEventListener('click',()=>{
 if(state.step>0){
  state.step--;
  while(state.step>0&&AUTO_ADVANCE_DRILLS.has(state.step)&&state.done[state.step])state.step--;
  state.selected=[];render();
 }
});
next.addEventListener('click',advance);
area.addEventListener('click',async ev=>{
 const btn=ev.target.closest('button');
 if(!btn||btn.disabled)return;
 if(btn.hasAttribute('data-dialogue-again')){state.index[9]=0;state.done[9]=false;render();return}
 if(btn.hasAttribute('data-review-all')){playReviewAll();return}
 if(btn.hasAttribute('data-review-stop')){stopReview();btn.disabled=true;return}
 if(btn.hasAttribute('data-review-one')){
  const i=Number(btn.dataset.reviewOne);
  if(!Number.isInteger(i)||i<0||i>=reviewEntries.length)return;
  stopReview();
  const epoch=reviewEpoch;
  const status=area.querySelector('[data-review-status]');
  if(status)status.textContent='Слушай и повторяй: '+reviewEntries[i][0];
  await playReviewEntry(reviewEntries[i],epoch);
  if(epoch===reviewEpoch&&status)status.textContent='✓ Повтори вслух: '+reviewEntries[i][0];
  return;
 }
 if(btn.hasAttribute('data-audio')){play(btn.dataset.audio,btn.dataset.role||'female');return}
 if(btn.hasAttribute('data-answer')){applyAnswer(state.step,Number(btn.dataset.answer));return}
 if(btn.hasAttribute('data-add')){
  const current=builds[state.step]?.[index(state.step)];
  const id=Number(btn.dataset.add);
  if(current&&id>=0&&id<current.tokens.length&&!state.selected.includes(id)){
   state.selected.push(id);render();
  }
  return;
 }
 if(btn.hasAttribute('data-remove')){
  state.selected.splice(Number(btn.dataset.remove),1);render();return;
 }
 if(btn.hasAttribute('data-check-build')){applyBuild(state.step);return}
 if(btn.hasAttribute('data-review-answer')){
  const id=state.finalWrong[state.reviewIndex],q=prompts[11][id];
  if(Number(btn.dataset.reviewAnswer)===q.r){
   state.reviewIndex++;
   if(state.reviewIndex>=state.finalWrong.length)state.done[11]=true;
   render();
  }else feedback('Пока неверно. Вспомни правило и попробуй ещё раз.');
  return;
 }
 if(btn.hasAttribute('data-spoken')){
  if(!state.heard){feedback('Сначала прослушай образец.');return}
  state.spoken=true;state.done[10]=true;render();return;
 }
 if(btn.hasAttribute('data-finish')){finish();return}
 if(btn.hasAttribute('data-restart')){
  state=defaults();if(recUrl)URL.revokeObjectURL(recUrl);recUrl=null;render();return;
 }
 if(btn.hasAttribute('data-record-start')){
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){
   feedback('Микрофон недоступен. Повтори вслух и нажми «Я произнёс фразу».');return;
  }
  try{
   safeStopMic();
   stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
   const formats=['audio/webm;codecs=opus','audio/mp4','audio/webm'];
   const mime=formats.find(m=>MediaRecorder.isTypeSupported(m));
   recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);
   const type=recorder.mimeType||'audio/webm';recordChunks=[];
   recorder.ondataavailable=e=>{if(e.data?.size)recordChunks.push(e.data)};
   recorder.onstop=()=>{
    const parts=recordChunks.slice();
    if(parts.length){if(recUrl)URL.revokeObjectURL(recUrl);const raw=new Blob(parts,{type});recUrl=URL.createObjectURL(raw);window.PANDA_MIC_V236?.enhance?.(raw,recUrl,()=>recUrl,url=>{recUrl=url})}
    if(stream){for(const track of stream.getTracks())track.stop();stream=null}
    recorder=null;micBusy=false;render();
   };
   recorder.start();micBusy=true;render();
  }catch{safeStopMic();feedback('Не удалось записать. Разреши микрофон либо повтори вслух.')}
  return;
 }
 if(btn.hasAttribute('data-record-stop')){
  if(recorder?.state==='recording')recorder.stop();return;
 }
 if(btn.hasAttribute('data-record-play')&&recUrl){
  stopAudio();try{audio=new Audio(recUrl);Promise.resolve(audio.play()).catch(()=>feedback('Не удалось воспроизвести свою запись.'))}catch{feedback('Запись недоступна.')}return;
 }
});
window.addEventListener('pagehide',()=>{
 stopReview();stopAudio();safeStopMic();
 if(recUrl)URL.revokeObjectURL(recUrl);
});
render();
})();