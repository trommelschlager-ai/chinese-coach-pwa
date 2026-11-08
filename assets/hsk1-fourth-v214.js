/* Panda Go HSK1 lesson 4 (v214): weekdays.
 * Scoped CSS, 13 screens, correct tone annotation, assisted conversation.
 * Yue Tan/Shtooka recordings: full weekday assets when available.
 * Browser recognizer is not used: no unsupported tone-quality claims.
 */
(()=>{
'use strict';
const root=document.getElementById('pg3-stage'),scroll=document.getElementById('pg3-scroll');
const prev=document.getElementById('pg3-prev'),next=document.getElementById('pg3-next');
const title=document.getElementById('pg3-title'),sub=document.getElementById('pg3-subtitle');
const label=document.getElementById('pg3-label'),counter=document.getElementById('pg3-count');
const bar=document.getElementById('pg3-progress'),fill=document.getElementById('pg3-progress-fill');
const notice=document.getElementById('pg3-notice');
if(!root||!next||!prev)return;
const KEY='pg-hsk1-v214-weekdays',DONE='pg-hsk1-v3-complete';
const DAYS=[
 {id:1,hz:'星期一',py:'xīngqī yī',ru:'понедельник',short:'Пн'},
 {id:2,hz:'星期二',py:'xīngqī èr',ru:'вторник',short:'Вт'},
 {id:3,hz:'星期三',py:'xīngqī sān',ru:'среда',short:'Ср'},
 {id:4,hz:'星期四',py:'xīngqī sì',ru:'четверг',short:'Чт'},
 {id:5,hz:'星期五',py:'xīngqī wǔ',ru:'пятница',short:'Пт'},
 {id:6,hz:'星期六',py:'xīngqī liù',ru:'суббота',short:'Сб'},
 {id:7,hz:'星期日',py:'xīngqī rì',ru:'воскресенье',short:'Вс'}
];
const TIMES=[
 {hz:'今天',py:'jīntiān',ru:'сегодня'},
 {hz:'明天',py:'míngtiān',ru:'завтра'},
 {hz:'昨天',py:'zuótiān',ru:'вчера'}
];
const META=[
 ['УРОК 4 · HSK1','Дни недели','Поймём, как китайцы называют дни недели'],
 ['НОВЫЕ СЛОВА · 1/2','Понедельник — среда','Послушай три первых дня недели'],
 ['НОВЫЕ СЛОВА · 2/2','Четверг — воскресенье','Четыре слова и одно важное исключение'],
 ['ТРЕНИРОВКА СЛУХА','Узнай день недели','Сначала слушай, затем выбирай'],
 ['КИТАЙСКАЯ ГРАММАТИКА','Собери день недели','星期 + число = название дня'],
 ['ВАЖНО ЗАПОМНИТЬ','Как назвать воскресенье?','星期日 и 星期天 означают один день'],
 ['СЛОВА О ВРЕМЕНИ','Сегодня, завтра, вчера','Три полезных слова для любого разговора'],
 ['КАЛЕНДАРЬ','Вчера, сегодня и завтра','Учимся переходить от одного дня к другому'],
 ['УЧИМСЯ СПРАШИВАТЬ','Сегодня какой день?','今天星期几？ — без 吗'],
 ['МИНИ-ДИАЛОГ','Ответь собеседнику','Слушай реплику и выбирай осмысленный ответ'],
 ['СОБЕРИ ПРЕДЛОЖЕНИЕ','Скажи целую фразу','今天星期五。 — Сегодня пятница'],
 ['ПРОВЕРКА ЗНАНИЙ','Что ты запомнил?','Семь вопросов без готовых подсказок'],
 ['УРОК 4 · ЗАВЕРШЁН','Ты знаешь дни недели!','Слушай и повторяй знакомые слова']
];
const HEAR=[
 {audio:'星期二',right:'星期二',opts:['星期三','星期二','星期一'],tip:'二 èr — второй тон числа не меняет; это вторник.'},
 {audio:'星期五',right:'星期五',opts:['星期四','星期六','星期五'],tip:'五 wǔ — пятый день, пятница.'},
 {audio:'星期日',right:'星期日',opts:['星期六','星期日','星期一'],tip:'日 rì — воскресенье, не 星期七.'}
];
const BUILDS=[
 {target:['星期','三'],prompt:'Собери слово «среда»',tip:'星期 + 三 = 星期三'},
 {target:['星期','六'],prompt:'Собери слово «суббота»',tip:'星期 + 六 = 星期六'}
];
const CONTEXT=[
 {today:3,q:'На календаре среда. Какой день был вчера?',answer:2,options:[4,2,1],tip:'Перед средой 星期三 идёт вторник 星期二.'},
 {today:3,q:'Сегодня среда. Какой день будет завтра?',answer:4,options:[5,4,2],tip:'После среды 星期三 наступает четверг 星期四.'},
 {today:7,q:'Сегодня воскресенье. Какой день будет завтра?',answer:1,options:[6,1,2],tip:'После воскресенья 星期日 начинается понедельник 星期一.'}
];
const CHAT=[
 {ask:'今天星期几？',right:'今天星期五。',opts:['今天星期五。','你是老师吗？','昨天星期二。'],
  tip:'今天星期几？ — вопрос про сегодняшний день; ответ начинается с 今天.'},
 {ask:'明天星期几？',right:'明天星期六。',opts:['今天星期五。','明天星期六。','昨天星期二。'],
  tip:'明天 — завтра. В ответе также говорим 明天.'}
];
const EXAM=[
 {kind:'text',q:'Как по-китайски понедельник?',correct:'星期一',options:['星期一','星期二','星期日'],tip:'星期 + 一 (1) = понедельник.'},
 {kind:'text',q:'Как называется суббота?',correct:'星期六',options:['星期五','星期天','星期六'],tip:'星期 + 六 (6) = суббота.'},
 {kind:'text',q:'Как можно сказать «воскресенье»?',correct:'星期天',options:['星期七','星期天','星期六'],tip:'Воскресенье — 星期天 или 星期日. Не 星期七.'},
 {kind:'audio',q:'Какой день звучит?',audio:'星期四',correct:'星期四',options:['星期四','星期五','星期三'],tip:'四 sì — четвёртый тон, четверг.'},
 {kind:'text',q:'Что означает 明天?',correct:'завтра',options:['вчера','сегодня','завтра'],tip:'明天 míngtiān — завтра.'},
 {kind:'text',q:'Как правильно спросить, какой сегодня день?',correct:'今天星期几？',
  options:['今天星期几？','今天星期几吗？','昨天星期几？'],tip:'Вопросительное 几 не требует 吗.'},
 {kind:'text',q:'Если сегодня воскресенье, какой день завтра?',correct:'星期一',options:['星期六','星期一','星期三'],tip:'После воскресенья идёт понедельник.'}
];
const defaults=()=>({
 step:0,maxStep:0,done:false,heardWords:[],selected:'星期一',
 indexes:{3:0,4:0,7:0,9:0,11:0},errors:{},firstTry:0,
 audioReady:false,audioPlaying:false,tiles:[],used:[],promptIndex:0,
 lastPracticeCorrect:false,sentenceDone:false,timeViewed:[],passedSunday:false,passedQuestion:false,
});
let state=defaults();
try{
 const v=JSON.parse(localStorage.getItem(KEY)||'null');
 if(v&&typeof v==='object'){
  Object.assign(state,v);
  state.step=Number.isInteger(v.step)?Math.max(0,Math.min(12,v.step)):0;
  state.indexes=Object.assign(defaults().indexes,v.indexes||{});
  state.errors=(v.errors&&typeof v.errors==='object')?v.errors:{};
  state.heardWords=Array.isArray(v.heardWords)?v.heardWords:[];
  state.timeViewed=Array.isArray(v.timeViewed)?v.timeViewed:[];
 }
}catch{}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const native=()=>window.PANDA_HSK1_NATIVE_HUMAN_V167||{};
const clean=()=>window.PANDA_HSK1_L4_VOICE_V214||{};
const digitAudio=()=>window.PANDA_HSK1_L3_CLEAN_V213||{};
const sound=word=>clean()[word]||native()[word]||digitAudio()[word]||null;
const weekdaysA=DAYS.map(x=>x.hz);
let player=null,soundEpoch=0;
const stopSound=()=>{
 soundEpoch++;
 if(player){player.onended=null;player.onerror=null;try{player.pause()}catch{}player=null}
};
function note(message,type='info'){
 notice.textContent=message||'';
 notice.dataset.kind=type;
 notice.hidden=!message;
}
function play(word,finished){
 stopSound();
 const epoch=soundEpoch;
 let parts;
 // Every recorded phrase used in the course has an independent cleaned file.
 if(sound(word)){parts=[sound(word)]}
 else if(word==='星期天'){parts=[]} // Don't fabricate tiān from another word.
 else if(/^星期[一二三四五六]$/.test(word)){
  parts=[sound('星期'),sound(word.slice(2))];
 }else if(word==='今天星期几？'||word==='今天星期几'){
  parts=[sound('今天'),sound('星期'),sound('几')];
 }else if(word==='明天星期几？'||word==='明天星期几'){
  parts=[sound('明天'),sound('星期'),sound('几')];
 }else if(/^(今天|明天|昨天)星期[一二三四五六日]。?$/.test(word)){
  const m=word.match(/^(今天|明天|昨天)(星期[一二三四五六日])/);
  parts=m?[sound(m[1]),sound(m[2])]:[];
 }else parts=[];
 if(!parts.length||parts.some(x=>!x)){
  note('Для этой фразы ещё нет проверенной аудиозаписи.','error');
  if(finished)finished(false);
  return;
 }
 state.audioReady=false;state.audioPlaying=true;
 const end=ok=>{
  if(epoch!==soundEpoch)return;
  state.audioPlaying=false;
  if(ok)state.audioReady=true;
  player=null;
  if(finished)finished(ok);
 };
 let i=0;
 const nextPart=()=>{
  if(epoch!==soundEpoch)return;
  if(i>=parts.length){end(true);return}
  try{
   const a=new Audio(parts[i++]);player=a;a.preload='auto';a.preservesPitch=true;a.playbackRate=1;
   a.onended=nextPart;
   a.onerror=()=>{end(false);note('Запись не загрузилась. Нажми «Слушать» ещё раз.','error')};
   const p=a.play();
   if(p?.catch)p.catch(()=>{end(false);note('Браузер не запустил звук, попробуй снова.','error')});
  }catch{end(false);note('Аудио недоступно.','error')}
 };
 nextPart();
}
function audioButton(word,text='▶ Слушать',attrs=''){
 return '<button type="button" class="pg3-audio" data-audio="'+escape(word)+'" '+attrs+' aria-label="'+
 escape(text)+' '+escape(word)+'">'+escape(text)+'</button>';
}
const card=(body,klass='')=>'<section class="pg3-card '+klass+'">'+body+'</section>';
const heading=x=>'<h2 class="pg13-card-heading">'+x+'</h2>';
function dayCard(day,checked=false,active=false){
 return '<button type="button" class="pg4-day-card '+(checked?'heard ':'')+(active?'active':'')+'" data-day="'+day.hz+'">'+
 '<small>'+day.short+'</small><strong lang="zh-Hans">'+day.hz+'</strong><span>'+day.py+'</span><i>'+day.ru+'</i>'+
 (checked?'<b aria-label="Прослушано">✓</b>':'')+'</button>';
}
function intro(){
 return '<div class="pg4-intro"><img src="./assets/panda-explorer-v174.svg" alt="Панда-помощник">'+
 '<div><small>🐼 НОВЫЙ УРОК HSK1</small><h2>Семь дней — одно правило</h2><p>Ты уже знаешь китайские числа. Теперь научишься говорить о днях недели!</p></div></div>'+
 card(heading('Неделя по-китайски')+'<div class="pg4-calendar-week">'+DAYS.map(d=>
 '<div><span>'+d.short+'</span><strong lang="zh-Hans">'+(d.id===7?'日':'一二三四五六'[d.id-1])+'</strong></div>').join('')+
 '</div><p class="pg3-muted pg3-center">星期 xīngqī — основа названий дней недели.</p>')+
 card(heading('Чему научишься')+
 '<div class="pg13-goal">🎧 Слышать и называть дни недели</div>'+
 '<div class="pg13-goal">📅 Говорить о вчера, сегодня и завтра</div>'+
 '<div class="pg13-goal">💬 Спрашивать «今天星期几？»</div>'+
 '<div class="pg13-goal">🧩 Собирать настоящие предложения</div>');
}
function study(step){
 const list=step===1?DAYS.slice(0,3):DAYS.slice(3);
 const selected=list.find(d=>d.hz===state.selected)||list[0];
 const learned=list.filter(d=>state.heardWords.includes(d.hz)).length;
 return card(heading(step===1?'星期 + 一 / 二 / 三':'星期 + 四 / 五 / 六 / 日')+
 '<p class="pg3-muted">Прослушано '+learned+' из '+list.length+'. Карточка засчитывается только после окончания записи.</p>'+
 '<div class="pg4-day-grid">'+list.map(d=>dayCard(d,state.heardWords.includes(d.hz),d.hz===selected.hz)).join('')+'</div>')+
 card('<div class="pg4-selected-day"><div><strong lang="zh-Hans">'+selected.hz+'</strong><span>'+selected.py+'</span>'+
 '<small>'+selected.ru+'</small></div>'+audioButton(selected.hz,'🔊 Слушать')+'</div>'+
 (step===1?'<p class="pg3-tip"><strong>Правило:</strong> 星期 xīngqī + цифра. 星期一 — понедельник, 星期二 — вторник, 星期三 — среда.</p>':
 '<p class="pg3-tip"><strong>Исключение:</strong> воскресенье — 星期日 (xīngqī rì) или 星期天 (xīngqī tiān). Не 星期七!</p>'));
}
function choices(options,attr,labels){
 return '<div class="pg4-choices">'+options.map(x=>'<button class="pg4-choice" type="button" '+attr+'="'+escape(x)+'"'+
 (labels?.disabled?' disabled':'')+'><strong'+(/[\u3400-\u9fff]/.test(x)?' lang="zh-Hans"':'')+'>'+escape(x)+'</strong>'+
 (labels?.get?.(x)?'<small>'+escape(labels.get(x))+'</small>':'')+'</button>').join('')+'</div>';
}
function quiz(step,questions){
 const i=state.indexes[step]||0;
 if(i>=questions.length)return card(heading('✓ Все вопросы выполнены')+
 '<p class="pg3-muted pg3-center">Можно повторить ответы или перейти дальше.</p>'+
 '<button class="pg4-minor" type="button" data-replay="'+step+'">↺ Пройти ещё раз</button>');
 const q=questions[i];
 return card('<div class="pg4-question-count">Вопрос '+(i+1)+' из '+questions.length+'</div>'+
 heading(q.q||'Какой день ты слышишь?')+
 '<p class="pg3-muted pg3-center">Сначала дослушай запись, затем выбирай ответ.</p>'+
 '<div class="pg4-center">'+audioButton(q.audio,'🔊 Слушать')+'</div>'+
 choices(q.opts,'data-quiz-answer',{disabled:!state.audioReady||state.audioPlaying,
 get:x=>DAYS.find(d=>d.hz===x)?.ru||''})+
 '<p class="pg4-hint">'+(state.audioPlaying?'Запись звучит…':state.audioReady?'Выбери услышанное слово.':'Нажми «Слушать».')+'</p>');
}
function build(){
 const i=state.indexes[4]||0;
 if(i>=BUILDS.length)return card(heading('✓ Ты собираешь дни недели!')+
 '<button type="button" class="pg4-minor" data-replay="4">↺ Повторить сборку</button>');
 const q=BUILDS[i],pool=[...q.target,'四'];
 const used=state.used||[];
 const selected=state.tiles||[];
 return card('<div class="pg4-question-count">Сборка '+(i+1)+' из '+BUILDS.length+'</div>'+
 heading(q.prompt)+
 '<div class="pg4-build-slots">'+q.target.map((_,idx)=>'<div class="'+(selected[idx]?'filled':'')+'">'+
 (selected[idx]||'＿')+'</div>').join('')+'</div>'+
 '<div class="pg4-tiles">'+pool.map((x,idx)=>'<button data-tile="'+idx+'" type="button"'+(used.includes(idx)?' disabled':'')+'>'+
 x+'</button>').join('')+'</div>'+
 '<div class="pg4-build-controls"><button type="button" data-reset-tiles>↺ Сброс</button>'+
 '<button type="button" data-check-tiles'+(selected.length!==q.target.length?' disabled':'')+'>Проверить ✓</button></div>'+
 '<p class="pg4-hint">'+(state.errors['build-'+i]?'Подсказка: сначала 星期, затем номер дня.':'Без готового ответа — попробуй сам!')+'</p>');
}
function sunday(){
 return card(heading('Воскресенье — особенный день')+
 '<div class="pg4-sunday"><div><strong lang="zh-Hans">星期日</strong><span>xīngqī rì</span>'+
 audioButton('星期日','▶ Слушать')+'</div><b>=</b>'+
 '<div><strong lang="zh-Hans">星期天</strong><span>xīngqī tiān</span><small>Та же дата. Для неё пока нет отдельного голоса.</small></div></div>'+
 '<p class="pg3-tip">Оба варианта означают воскресенье. <strong>星期七</strong> не является стандартным названием дня недели.</p>')+
 card(heading('Проверь себя')+
 '<p>Как правильно назвать воскресенье?</p>'+
 choices(['星期七','星期天','星期六'],'data-sunday-answer'));
}
function words(){
 const n=state.timeViewed.length;
 return card(heading('Три слова, которые нужны каждый день')+
 '<div class="pg4-time-cards">'+TIMES.map(w=>'<button type="button" data-time="'+w.hz+'" class="'+
 (state.timeViewed.includes(w.hz)?'heard':'')+'">'+
 '<strong lang="zh-Hans">'+w.hz+'</strong><span>'+w.py+'</span><small>'+w.ru+'</small>'+
 (state.timeViewed.includes(w.hz)?'<b>✓</b>':'')+'</button>').join('')+'</div>'+
 '<p class="pg3-muted pg3-center">Прослушано '+n+' из 3. Нажми слово, чтобы услышать его.</p>')+
 card('<div class="pg4-time-example"><span>昨天</span><i>←</i><strong>今天</strong><i>→</i><span>明天</span></div>'+
 '<p class="pg3-tip">昨天 — вчера, 今天 — сегодня, 明天 — завтра. Например: 今天星期三。 — Сегодня среда.</p>');
}
function calendar(){
 const i=state.indexes[7]||0;
 if(i>=CONTEXT.length)return card(heading('✓ Ты умеешь ориентироваться в неделе')+
 '<button type="button" class="pg4-minor" data-replay="7">↺ Повторить календарь</button>');
 const q=CONTEXT[i];
 return card('<div class="pg4-question-count">Календарь '+(i+1)+' из '+CONTEXT.length+'</div>'+
 heading(q.q)+
 '<div class="pg4-calendar-week">'+DAYS.map(x=>'<div class="'+(x.id===q.today?'today':'')+'"><span>'+
 x.short+'</span><strong lang="zh-Hans">'+(x.id===7?'日':'一二三四五六'[x.id-1])+'</strong></div>').join('')+'</div>'+
 '<p class="pg3-muted pg3-center">Выделенный день — условное «сегодня» для задания.</p>'+
 choices(q.options.map(n=>DAYS[n-1].hz),'data-calendar-answer',{get:x=>DAYS.find(d=>d.hz===x)?.ru||''}));
}
function question(){
 return card(heading('Как спросить, какой сегодня день?')+
 '<div class="pg4-big-sentence" lang="zh-Hans">今天星期几？</div>'+
 '<div class="pg4-big-pinyin">Jīntiān xīngqī jǐ?</div>'+
 '<p class="pg4-big-translation">Какой сегодня день недели?</p>'+
 '<div class="pg4-center">'+audioButton('今天星期几？','▶ Слушать вопрос')+'</div>'+
 '<div class="pg4-grammar"><p><b>今天</b> — сегодня</p><p><b>星期</b> — неделя</p>'+
 '<p><b>几</b> — который по счёту?</p></div>'+
 '<p class="pg3-tip">В этом вопросе уже есть <strong>几</strong>, поэтому добавлять <strong>吗</strong> не нужно.</p>')+
 card(heading('Найди правильный вопрос')+
 choices(['今天星期几吗？','今天星期几？','明天星期几？'],'data-question-answer'));
}
function dialogue(){
 const i=state.indexes[9]||0;
 const q=CHAT[i];
 if(!q)return card(heading('✓ Диалог пройден')+
 '<div class="pg4-conversation"><div class="pg4-bubble left">今天星期几？<small>Jīntiān xīngqī jǐ?</small></div>'+
 '<div class="pg4-bubble right">今天星期五。<small>Jīntiān xīngqī wǔ.</small></div></div>'+
 '<p class="pg4-hint">Скажи ответ вслух, затем переходи дальше.</p>'+
 '<button type="button" class="pg4-minor" data-replay="9">↺ Повторить диалог</button>');
 return card(heading('Послушай собеседника')+
 '<div class="pg4-conversation"><div class="pg4-bubble left"><strong lang="zh-Hans">'+q.ask+'</strong>'+
 '<small>'+(i===0?'Jīntiān xīngqī jǐ?':'Míngtiān xīngqī jǐ?')+'</small></div></div>'+
 '<div class="pg4-center">'+audioButton(q.ask,'▶ Слушать реплику')+'</div>'+
 '<p class="pg4-hint">Ты отвечаешь. Выбери подходящую фразу:</p>'+
 choices(q.opts,'data-chat-answer',{disabled:!state.audioReady||state.audioPlaying})+
 '<p class="pg3-muted pg3-center">После ответа попробуй произнести фразу сам.</p>');
}
function sentence(){
 const target=['今天','星期','五'];const used=state.used||[];
 const options=['五','星期','今天'];
 return card(heading('Собери «Сегодня пятница»')+
 '<div class="pg4-build-slots">'+target.map((_,i)=>'<div class="'+(state.tiles[i]?'filled':'')+'">'+
 (state.tiles[i]||'＿')+'</div>').join('')+'</div>'+
 '<div class="pg4-tiles">'+options.map((x,i)=>'<button type="button" data-tile="'+i+'"'+(used.includes(i)?' disabled':'')+'>'+x+'</button>').join('')+'</div>'+
 '<div class="pg4-build-controls"><button type="button" data-reset-tiles>↺ Сброс</button>'+
 '<button type="button" data-check-tiles'+(state.tiles.length!==3?' disabled':'')+'>Проверить ✓</button></div>'+
 (state.sentenceDone?'<p class="pg4-hint">✓ 今天星期五。 — Jīntiān xīngqī wǔ. Сегодня пятница.</p>'+
 '<div class="pg4-center">'+audioButton('今天星期五。','▶ Слушать предложение')+'</div>':
 '<p class="pg4-hint">Подсказка появится, если ошибёшься.</p>'));
}
function exam(){
 const i=state.indexes[11]||0;
 if(i>=EXAM.length)return card(heading('✓ Итоговая проверка завершена')+
 '<p>Все вопросы решены. Посмотрим твой результат.</p>');
 const q=EXAM[i];
 return card('<div class="pg4-question-count">Задание '+(i+1)+' из '+EXAM.length+'</div>'+
 heading(q.q)+(q.kind==='audio'?'<div class="pg4-center">'+audioButton(q.audio,'🔊 Слушать вопрос')+'</div>':'')+
 choices(q.options,'data-exam-answer',{disabled:q.kind==='audio'&&(!state.audioReady||state.audioPlaying)})+
 '<p class="pg4-hint">'+(q.kind==='audio'?'Варианты доступны только после окончания звука.':'Выбери один верный ответ.')+'</p>');
}
function final(){
 const all=[...DAYS,{hz:'今天',py:'jīntiān',ru:'сегодня'},{hz:'明天',py:'míngtiān',ru:'завтра'},
 {hz:'昨天',py:'zuótiān',ru:'вчера'}];
 return '<div class="pg4-finish"><img src="./assets/panda-explorer-v174.svg" alt="Панда поздравляет с новым достижением">'+
 '<h2>🎉 Урок 4 завершён!</h2><p>Теперь ты знаешь дни недели и умеешь спрашивать, какой сегодня день.</p></div>'+
 card('<div class="pg13-score"><strong>'+state.firstTry+' / '+EXAM.length+'</strong>'+
 '<span>ответов с первой попытки</span></div>'+
 '<p class="pg3-muted pg3-center">Вернись к ошибкам завтра — так слова запомнятся лучше.</p>')+
 card(heading('Твой словарь с аудио')+
 '<div class="pg4-review">'+all.map(d=>'<button type="button" data-audio="'+d.hz+'">'+
 '<strong lang="zh-Hans">'+d.hz+'</strong><small>'+d.py+'</small></button>').join('')+'</div>'+
 '<p class="pg3-muted">Каждое слово можно повторять в своём темпе.</p>')+
 '<div class="pg3-finish-links"><a href="./hsk1-lesson.html?lesson=5" class="primary">Урок 5 — Даты →</a>'+
 '<a href="./hsk1-map.html">К карте HSK1</a><button data-restart type="button">↺ Пройти урок 4 ещё раз</button></div>';
}
const screens=[intro,()=>study(1),()=>study(2),()=>quiz(3,HEAR),build,sunday,words,calendar,question,dialogue,sentence,exam,final];
function ready(){
 const s=state.step;
 if(s===1)return DAYS.slice(0,3).every(d=>state.heardWords.includes(d.hz));
 if(s===2)return DAYS.slice(3).every(d=>state.heardWords.includes(d.hz));
 if(s===3)return state.indexes[3]>=HEAR.length;
 if(s===4)return state.indexes[4]>=BUILDS.length;
 if(s===5)return state.passedSunday===true;
 if(s===6)return TIMES.every(x=>state.timeViewed.includes(x.hz));
 if(s===7)return state.indexes[7]>=CONTEXT.length;
 if(s===8)return state.passedQuestion===true;
 if(s===9)return state.indexes[9]>=CHAT.length;
 if(s===10)return state.sentenceDone===true;
 if(s===11)return state.indexes[11]>=EXAM.length;
 return true;
}
function done(){
 state.done=true;
 try{
  const saved=JSON.parse(localStorage.getItem(DONE)||'[]');
  const list=Array.isArray(saved)?saved:[];
  if(!list.includes('weekdays'))list.push('weekdays');
  localStorage.setItem(DONE,JSON.stringify(list));
 }catch{}
 save();
}
function render(preserve=false){
 const pos=scroll.scrollTop;
 stopSound();
 const s=state.step;
 if(s===12&&!state.done)done();
 state.maxStep=Math.max(state.maxStep,s);
 label.textContent=META[s][0];title.textContent=META[s][1];sub.textContent=META[s][2];
 counter.textContent=(s+1)+' из '+screens.length;
 bar.setAttribute('aria-valuemax',String(screens.length));bar.setAttribute('aria-valuenow',String(s+1));
 fill.style.width=((s+1)/screens.length*100)+'%';
 root.innerHTML=screens[s]();
 note('');
 prev.disabled=s===0;next.hidden=s===12;next.disabled=!ready();
 next.textContent=s===0?'Начать урок →':s===11?'Завершить урок →':'Дальше →';
 save();
 scroll.scrollTop=preserve?pos:0;
}
function nextStep(){
 if(!ready()){note('Сначала выполни задание.','warn');return}
 if(state.step<12){
  state.step++;state.audioReady=false;state.lastPracticeCorrect=false;
  state.tiles=[];state.used=[];render();
 }
}
function checked(ok,correct,tip,key,onSuccess){
 if(!ok){
  state.errors[key]=(state.errors[key]||0)+1;
  note('Не совсем верно. '+tip,'error');
  save();return;
 }
 if(key.startsWith('exam-')&&!state.errors[key])state.firstTry++;
 state.audioReady=false;state.audioPlaying=false;
 note('✓ Верно! '+tip,'success');
 onSuccess();
}
function advanceTask(step,len){
 state.indexes[step]++;
 if(state.indexes[step]>=len){
  state.step++;state.lastPracticeCorrect=false;state.audioReady=false;
  state.tiles=[];state.used=[];render();
 }else render(true);
}
root.addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b||b.disabled)return;
 const s=state.step;
 if(b.hasAttribute('data-day')){
  const name=b.dataset.day;
  const entry=DAYS.find(x=>x.hz===name);
  if(!entry)return;
  state.selected=name;
  render(true);
  play(name,ok=>{
   if(ok&&!state.heardWords.includes(name))state.heardWords.push(name);
   const card=root.querySelector('[data-day="'+name+'"]');if(card&&ok)card.classList.add('heard');
   if(ok){
    next.disabled=!ready();
    note('✓ '+name+' прослушано. Теперь можно выбрать следующее слово.','success');
   }
   save();
  });
  return;
 }
 if(b.hasAttribute('data-audio')){
  const word=b.dataset.audio;
  // For interactive listening quizzes, only unlock after end of recording.
  const isQuestion=s===3||s===9||s===11&&EXAM[state.indexes[11]]?.kind==='audio';
  play(word,ok=>{
   if((s===1||s===2)&&ok&&DAYS.some(x=>x.hz===word)){
    if(!state.heardWords.includes(word))state.heardWords.push(word);
    root.querySelector('[data-day="'+word+'"]')?.classList.add('heard');
    next.disabled=!ready();save();
    note('✓ '+word+' прослушано.','success');
   }
   if(isQuestion&&ok)root.querySelectorAll('[data-quiz-answer],[data-chat-answer],[data-exam-answer]').forEach(x=>x.disabled=false);
   if(isQuestion&&ok)note('Теперь выбирай ответ.','success');
  });
  return;
 }
 if(b.hasAttribute('data-time')){
  const word=b.dataset.time;
  play(word,ok=>{
   if(ok&&!state.timeViewed.includes(word))state.timeViewed.push(word);
   if(ok)root.querySelector('[data-time="'+word+'"]')?.classList.add('heard');
   next.disabled=!ready();save();
  });return;
 }
 if(b.hasAttribute('data-quiz-answer')){
  const i=state.indexes[3],q=HEAR[i];if(!q||!state.audioReady||state.audioPlaying)return;
  checked(b.dataset.quizAnswer===q.right,q.right,q.tip,'hear-'+i,()=>advanceTask(3,HEAR.length));
  return;
 }
 if(b.hasAttribute('data-tile')){
  const i=Number(b.dataset.tile);
  const pool=s===4?[...BUILDS[state.indexes[4]].target,'四']:['五','星期','今天'];
  if(!Number.isInteger(i)||state.used.includes(i))return;
  state.used.push(i);state.tiles.push(pool[i]);render(true);return;
 }
 if(b.hasAttribute('data-reset-tiles')){state.tiles=[];state.used=[];render(true);return}
 if(b.hasAttribute('data-check-tiles')){
  const i=state.indexes[4],target=s===4?BUILDS[i].target:['今天','星期','五'];
  if(state.tiles.join('')!==target.join('')){
   const key=s===4?'build-'+i:'sentence';
   state.errors[key]=(state.errors[key]||0)+1;state.tiles=[];state.used=[];render(true);
   note('Попробуй ещё раз: '+(s===4?'сначала 星期, затем число.':'сначала 今天, затем 星期五.'),'error');
  }else if(s===4){state.tiles=[];state.used=[];advanceTask(4,BUILDS.length)}
  else{state.sentenceDone=true;state.tiles=[];state.used=[];render(true)}
  return;
 }
 if(b.hasAttribute('data-sunday-answer')){
  checked(b.dataset.sundayAnswer==='星期天','星期天','Воскресенье: 星期天 или 星期日, не 星期七.','sun',()=>{
   state.passedSunday=true;nextStep();
  });return;
 }
 if(b.hasAttribute('data-calendar-answer')){
  const i=state.indexes[7],q=CONTEXT[i];
  checked(b.dataset.calendarAnswer===DAYS[q.answer-1].hz,q.answer,q.tip,'calendar-'+i,()=>advanceTask(7,CONTEXT.length));
  return;
 }
 if(b.hasAttribute('data-question-answer')){
  checked(b.dataset.questionAnswer==='今天星期几？','今天星期几？','几 уже делает предложение вопросительным.','question',()=>{
   state.passedQuestion=true;nextStep();
  });return;
 }
 if(b.hasAttribute('data-chat-answer')){
  const i=state.indexes[9],q=CHAT[i];if(!q||!state.audioReady||state.audioPlaying)return;
  checked(b.dataset.chatAnswer===q.right,q.right,q.tip,'chat-'+i,()=>advanceTask(9,CHAT.length));return;
 }
 if(b.hasAttribute('data-exam-answer')){
  const i=state.indexes[11],q=EXAM[i];
  if(!q||q.kind==='audio'&&(!state.audioReady||state.audioPlaying))return;
  checked(b.dataset.examAnswer===q.correct,q.correct,q.tip,'exam-'+i,()=>advanceTask(11,EXAM.length));return;
 }
 if(b.hasAttribute('data-replay')){
  const n=Number(b.dataset.replay);state.indexes[n]=0;state.audioReady=false;
  state.tiles=[];state.used=[];render(true);return;
 }
 if(b.hasAttribute('data-restart')){
  state=defaults();
  // Achievement list is intentionally never removed by replay.
  render();return;
 }
});
prev.addEventListener('click',()=>{
 if(state.step>0){state.step--;state.audioReady=false;state.lastPracticeCorrect=false;state.tiles=[];state.used=[];render();}
});
next.addEventListener('click',nextStep);
window.addEventListener('pagehide',stopSound);
render();
})();