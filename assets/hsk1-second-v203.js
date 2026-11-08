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
  {q:'Как пишется «она»?',a:['你','她','他'],r:1},
  {q:'Какая пара звучит одинаково: tā?',a:['我 / 你','他 / 她','老师 / 学生'],r:1}],
 3:[{q:'Что означает 我们 (wǒmen)?',a:['вы','мы','они'],r:1},
    {q:'Как вежливо сказать «Вы» одному человеку?',a:['你们','您','我们'],r:1}],
 4:[
  {q:'Что прозвучало?',sound:'我们',a:['你们','我','我们','你'],r:2},
  {q:'Что прозвучало?',sound:'你',a:['我们','你们','我','你'],r:3},
  {q:'Что прозвучало?',sound:'你们',a:['你们','我','我们','你'],r:0},
  {q:'Что прозвучало?',sound:'我',a:['你','我们','我','你们'],r:2}],
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
  {label:'Ты студент.',tokens:['你','是','学生'],py:'Nǐ shì xuésheng.'},
  {label:'Он учитель.',tokens:['他','是','老师'],py:'Tā shì lǎoshī.'}],
 8:[
  {label:'Ты учитель?',tokens:['你','是','老师','吗'],py:'Nǐ shì lǎoshī ma?'},
  {label:'Она студентка?',tokens:['她','是','学生','吗'],py:'Tā shì xuésheng ma?'}]
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
let reviewEpoch=0,reviewDelay=0;
const index=s=>Math.max(0,Math.min(50,Number(state.index[s])||0));
const audioMap=window.PANDA_HSK1_NATIVE_HUMAN_V167||{};
const course=window.PANDA_HSK1_VOICES||{};
function fileFor(hz,role='female'){
 const text=String(hz),key=cleanText(text);
 if(text==='我是老师。')return './assets/hsk1-scene-v205/female-im-teacher-normalized.mp3';
 if(vocab[key]&&audioMap[key])return audioMap[key];
 return course[role]?.[text]||course[role]?.[key]||null;
}
function stopAudio(){
 if(audio){try{audio.pause()}catch{}audio.onended=null;audio=null}
}
function stopReview(){
 reviewEpoch++;
 if(reviewDelay){clearTimeout(reviewDelay);reviewDelay=0}
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
    player.preload='auto';player.preservesPitch=true;player.playbackRate=.9;
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
   await new Promise(done=>{reviewDelay=setTimeout(()=>{reviewDelay=0;done()},repeat===0?650:900)});
  }
 }
 if(status)status.textContent='✓ Все слова повторены два раза!';
 if(stopBtn)stopBtn.disabled=true;
}
function renderReviewList(){
 return '<section class="pg7-recap" aria-label="Словарь после второго урока">'+
 '<h2>🐼 Твой китайский словарь</h2>'+
 '<p>Ты уже знаешь эти слова и фразы. Послушай и повтори вслух. Бонусное слово 它 отмечено отдельно.</p>'+
 '<div class="pg7-review-controls"><button type="button" data-review-all>▶ Повторить всё по 2 раза</button>'+
 '<button type="button" data-review-stop disabled>■ Стоп</button></div>'+
 '<p class="pg7-review-status" data-review-status role="status">Нажми на слово или запусти весь список.</p>'+
 '<div class="pg7-review-list">'+reviewEntries.map((entry,i)=>{
  const [zh,py,ru]=entry;
  const extra=(!nativeOrTTS(zh));
  return '<div class="pg7-review-row"><div class="pg7-review-word"><strong lang="zh-Hans">'+escapeHtml(zh)+'</strong>'+
   '<span>'+escapeHtml(py)+'</span><small>'+escapeHtml(ru)+'</small></div>'+
   '<button type="button" data-review-one="'+i+'" aria-label="Прослушать и повторить '+escapeHtml(zh)+'">▶</button>'+
   (extra?'<small class="pg7-review-fallback">Системная озвучка</small>':'')+'</div>';
 }).join('')+'</div>'+
 '<p class="pg7-review-footnote">Для 您 и фразы 是的，我是老师。 пока используется системная китайская озвучка. Проверенную запись китаянки добавим отдельно.</p>'+
 '</section>';
}
function audioButton(hz,label='▶ Слушать',role='female'){
 const file=fileFor(hz,role);
 return '<button class="pg3-audio" data-audio="'+escapeHtml(hz)+'" data-role="'+escapeHtml(role)+'"'+(file?'':' disabled')+'>'+escapeHtml(label)+'</button>';
}
function feedback(message){
 if(announcement)announcement.textContent=message;
 const box=area.querySelector('[data-feedback]');
 if(box)box.textContent=message;
}
function play(hz,role='female'){
 const file=fileFor(hz,role);
 if(!file){feedback('Запись пока недоступна.');return}
 window.PG2_EXTRAS?.stopScene?.();
 stopAudio();
 try{
  const a=new Audio(file);audio=a;a.preload='auto';
  a.preservesPitch=true;
  // Native vocabulary stays unmodified at 1×. Longer existing course sentences at 0.85×.
  a.playbackRate=vocab[cleanText(hz)]?1:0.85;
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
 if(pos>=seq.length)return '<div class="pg3-success">✓ Упражнение выполнено. Можешь идти дальше.</div>';
 const q=seq[pos];
 return '<div class="pg3-question"><p class="pg3-small">Задание '+(pos+1)+' из '+seq.length+'</p>'+
 '<h2>'+escapeHtml(q.q)+'</h2>'+
 (q.sound?audioButton(q.sound,'▶ Послушать запись',q.role||'female'):'')+
 '<div class="pg3-answers">'+q.a.map((answer,i)=>
 '<button type="button" data-answer="'+i+'">'+escapeHtml(answer)+'</button>').join('')+'</div>'+
 '<p class="pg3-feedback" data-feedback role="status"></p></div>';
}
function buildBlock(step){
 const seq=builds[step],pos=index(step);
 if(pos>=seq.length)return '<div class="pg3-success">✓ Все предложения собраны.</div>';
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
  return head('УРОК 2 · ГОТОВО!','Ты уже говоришь по-китайски! 🐼','Повторим всё, что ты освоил.')+
   '<div class="sheet"><p class="pg3-success">🏆 Молодец! Второй урок завершён</p>'+
   '<p class="pg3-result">С первой попытки: <strong>'+state.finalFirstTry+' из 5</strong></p>'+
   '<p class="pg3-note">'+(state.finalWrong.length?'Ошибки разобраны и повторены.':'Отличная работа: все ответы верны с первой попытки!')+'</p>'+
   renderReviewList()+
   '<div class="pg3-finish"><button data-restart>↻ Повторить урок</button><a href="./hsk1-map.html">К карте HSK1 →</a></div></div>';
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
  '<div class="sheet">'+questionBlock(0)+'</div>',
 ()=>head('НОВЫЕ СЛОВА · 1/4','Он и она','Два иероглифа — одно произношение tā.')+
  sample('НОВОЕ',['他','她'],'他 = он, 她 = она. Оба слова звучат одинаково с первым тоном. На слух их не различают.')+
  '<div class="sheet">'+questionBlock(1)+'</div>',
 ()=>head('ПРАКТИКА','Кто есть кто?','Выбирай по значению, а не по звуку.')+
  '<div class="sheet">'+questionBlock(2)+'</div>',
 ()=>head('НОВЫЕ СЛОВА · 2/4','Мы, вы и вежливое «Вы»','Познакомимся с тремя формами обращения.')+
  sample('НОВОЕ',['我们','你们','您'],'们 (men) образует множественное число: 我们 — мы, 你们 — вы. 您 (nín) — уважительное «Вы» одному человеку, например преподавателю или старшему. Не путай 您 и 你们.')+
  '<div class="sheet">'+questionBlock(3)+'</div>',
 ()=>head('ТРЕНИРОВКА СЛУХА','Узнай слово','Отличай короткие местоимения от форм с 们.')+
  '<div class="sheet">'+questionBlock(4)+'</div>',
 ()=>head('НОВОЕ СЛОВО · 3/4','Кто ты?','老师 — учитель. Повторим связку 是.')+
  sample('НОВОЕ СЛОВО',['老师'],'是 (shì) уже знакомо: оно связывает подлежащее с существительным.')+
  '<div class="sheet"><div class="pg3-sentence">我是老师。</div>'+
  '<p class="pinyin">Wǒ shì lǎoshī.</p><p class="translation">Я учитель.</p>'+
  audioButton('我是老师。','▶ Слушать предложение')+
  '<div class="pg3-note">我 — я · 是 — являюсь · 老师 — учитель</div>'+
  questionBlock(5)+'</div>',
 ()=>head('ПРАКТИКА','Собери утверждение','Три предложения из уже знакомых слов.')+
  '<div class="sheet">'+buildBlock(6)+'</div>',
 ()=>head('НОВОЕ СЛОВО · 4/4','Как задать вопрос?','Новая частица 吗 (ma).')+
  sample('НОВОЕ',['吗'],'吗 ставится в конце предложения, произносится нейтральным тоном.')+
  '<div class="sheet"><div class="pg3-sentence">你是老师吗？</div>'+
  '<p class="pinyin">Nǐ shì lǎoshī ma?</p><p class="translation">Ты учитель?</p>'+
  audioButton('你是老师吗？','▶ Слушать вопрос','male')+
  questionBlock(7)+'</div>',
 ()=>head('ПРАКТИКА','Собери вопрос','Добавляй 吗 в конец.')+
  '<div class="sheet">'+buildBlock(8)+'</div>',
 ()=>head('МИНИ-ДИАЛОГ','Ответь собеседнику','Послушай реплику и выбери осмысленный ответ.')+
  '<div class="sheet">'+questionBlock(9)+'</div>',
 ()=>head('ПРОИЗНОШЕНИЕ','Теперь скажи сам','Послушай, повтори вслух и сравни с записью.')+
  '<div class="sheet"><div class="pg3-sentence">你是老师吗？</div>'+
  '<p class="pinyin">Nǐ shì lǎoshī ma?</p><p class="translation">Ты учитель?</p>'+
  audioButton('你是老师吗？','▶ Слушать образец','male')+
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
function render(){
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
 if(state.index[step]===builds[step].length)state.done[step]=true;
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
 if(state.step>0){state.step--;state.selected=[];render()}
});
next.addEventListener('click',advance);
area.addEventListener('click',async ev=>{
 const btn=ev.target.closest('button');
 if(!btn||btn.disabled)return;
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
    if(parts.length){if(recUrl)URL.revokeObjectURL(recUrl);recUrl=URL.createObjectURL(new Blob(parts,{type}))}
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