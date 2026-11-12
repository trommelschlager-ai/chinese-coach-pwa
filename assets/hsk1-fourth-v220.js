/* Panda Go HSK1 · Lesson 4 v219: remove redundant content, compact audio icons, no empty finished exercise screens.
   Pure client-side, no resets of other lessons. Same licensed native female reference pack;
   No device TTS: missing whole recordings are explicitly identified.
   Native-tone assessment is never claimed for microphone recordings.
*/
(()=>{
'use strict';
const stage=document.getElementById('pg3-stage'),viewport=document.getElementById('pg3-scroll');
const back=document.getElementById('pg3-prev'),forward=document.getElementById('pg3-next');
const heading=document.getElementById('pg3-title'),subtitle=document.getElementById('pg3-subtitle');
const sectionLabel=document.getElementById('pg3-label'),pageCount=document.getElementById('pg3-count');
const progress=document.getElementById('pg3-progress'),fill=document.getElementById('pg3-progress-fill');
const notice=document.getElementById('pg3-notice');
if(!stage||!back||!forward)return;
const VERSION='pg-hsk1-v215-weekdays',PREV_VERSION='pg-hsk1-v214-weekdays',DONE='pg-hsk1-v3-complete',TOTAL=13;
const DAYS=[
 {n:1,zh:'星期一',py:'xīngqī yī',ru:'понедельник',short:'Пн',tail:'一'},
 {n:2,zh:'星期二',py:'xīngqī èr',ru:'вторник',short:'Вт',tail:'二'},
 {n:3,zh:'星期三',py:'xīngqī sān',ru:'среда',short:'Ср',tail:'三'},
 {n:4,zh:'星期四',py:'xīngqī sì',ru:'четверг',short:'Чт',tail:'四'},
 {n:5,zh:'星期五',py:'xīngqī wǔ',ru:'пятница',short:'Пт',tail:'五'},
 {n:6,zh:'星期六',py:'xīngqī liù',ru:'суббота',short:'Сб',tail:'六'},
 {n:7,zh:'星期天',py:'xīngqī tiān',ru:'воскресенье',short:'Вс',tail:'天'}
];
const TIMES=[
 {zh:'今天',py:'jīntiān',ru:'сегодня'},
 {zh:'明天',py:'míngtiān',ru:'завтра'},
 {zh:'昨天',py:'zuótiān',ru:'вчера'}
];
const GLOSS={
 '星期':'xīngqī — неделя (в названии дня)','几':'jǐ — какой по счёту?',
 '是':'shì — быть, являться','星期天':'xīngqī tiān — воскресенье',
 '星期日':'xīngqī rì — воскресенье (другой вариант)',
 '今天星期几？':'Jīntiān xīngqī jǐ? — Какой сегодня день недели?',
 '明天星期几？':'Míngtiān xīngqī jǐ? — Какой завтра день недели?',
 '昨天星期几？':'Zuótiān xīngqī jǐ? — Какой вчера был день недели?',
 '今天星期五。':'Jīntiān xīngqī wǔ. — Сегодня пятница.',
 '明天星期六。':'Míngtiān xīngqī liù. — Завтра суббота.',
 '昨天星期二。':'Zuótiān xīngqī èr. — Вчера был вторник.'
};
const SECTIONS=[
 ['УРОК 4 · HSK1','Дни недели','Семь дней, одно понятное правило'],
 ['НОВЫЕ СЛОВА','星期 и первые дни','Изучаем понедельник, вторник и среду'],
 ['НОВЫЕ СЛОВА','Четверг, пятница, суббота','Послушай каждое слово полностью'],
 ['ГРАММАТИКА','Как сказать «воскресенье»?','Два правильных варианта, не 星期七'],
 ['СЛУХ И ТОНЫ','Узнай семь дней','Сначала дослушай слово, потом отвечай'],
 ['НОВЫЕ СЛОВА','Вчера, сегодня, завтра','Три слова для повседневного общения'],
 ['ВОПРОС И ОТВЕТ','今天星期几？','Научись спрашивать и отвечать'],
 ['ИНТЕРАКТИВНЫЙ КАЛЕНДАРЬ','Какой день будет?','Переход от сегодня к вчера и завтра'],
 ['ПРАКТИКА ПИСЬМА','Напиши 日','Четыре черты — пальцем на экране'],
 ['МИНИ-ДИАЛОГ','Поговори о неделе','Две роли и самостоятельный ответ'],
 ['СОСТАВЬ ФРАЗУ','Скажи целое предложение','Собери три фразы из знакомых слов'],
 ['ПРОВЕРКА БЕЗ ПОДСКАЗОК','Что ты запомнил?','10 разных вопросов и точная оценка'],
 ['УРОК 4 · ПРОЙДЕН','Отличная работа!','Твой результат, ошибки и аудиословарь']
];
const LEARN_AUDIO=DAYS.slice(0,6).map(d=>d.zh);
const LISTEN=[
 {audio:'星期一',correct:'星期一',choices:['星期一','星期二','星期三'],explain:'星期一 xīngqī yī — понедельник. 一 — первый тон.'},
 {audio:'星期二',correct:'星期二',choices:['星期三','星期二','星期四'],explain:'二 èr — четвёртый тон ↘, не второй. 星期二 — вторник.'},
 {audio:'星期三',correct:'星期三',choices:['星期四','星期一','星期三'],explain:'星期三 — среда, 三 sān — первый тон.'},
 {audio:'星期四',correct:'星期四',choices:['星期四','星期十','星期五'],explain:'四 sì — четвёртый тон ↘; 十 shí — второй ↗.'},
 {audio:'星期五',correct:'星期五',choices:['星期六','星期五','星期二'],explain:'五 wǔ — третий тон.'},
 {audio:'星期六',correct:'星期六',choices:['星期日','星期三','星期六'],explain:'六 liù — четвёртый тон; 星期六 — суббота.'},
 {audio:'星期日',correct:'星期日',choices:['星期六','星期日','星期三'],explain:'星期日 xīngqī rì — воскресенье. Разговорный синоним — 星期天.'}
];
const CALENDAR=[
 {today:1,ask:'Вчера',correct:7,choices:[6,7,2],explain:'Перед понедельником было воскресенье.'},
 {today:3,ask:'Завтра',correct:4,choices:[4,2,5],explain:'После среды — четверг.'},
 {today:7,ask:'Завтра',correct:1,choices:[6,1,2],explain:'После воскресенья снова понедельник.'},
 {today:6,ask:'Вчера',correct:5,choices:[4,7,5],explain:'Перед субботой была пятница.'}
];
const DIALOG=[
 {female:'明天星期几？',male:'明天星期六。',correct:'明天星期六。',
 choices:['明天星期六。','今天星期五。'],explain:'明天 — завтра. Ответ: 明天星期六。'}
];
const BUILDS=[
 {prompt:'Собери «Сегодня пятница»',target:['今天','星期','五'],pool:['五','今天','星期'],audio:'今天星期五。'},
 {prompt:'Собери «Завтра суббота»',target:['明天','星期','六'],pool:['星期','六','明天'],audio:'明天星期六。'},
 {prompt:'Собери «Вчера был вторник»',target:['昨天','星期','二'],pool:['二','星期','昨天'],audio:'昨天星期二。'}
];
const EXAM=[
 {kind:'pick',q:'Как написать «понедельник»?',options:['星期一','星期二','星期三'],right:'星期一',explain:'星期一 xīngqī yī — понедельник.'},
 {kind:'pick',q:'Как написать «суббота»?',options:['星期五','星期六','星期天'],right:'星期六',explain:'星期六 xīngqī liù — суббота.'},
 {kind:'pick',q:'Какие два слова обозначают воскресенье?',options:['星期天 и 星期日','星期六 и 星期日','星期天 и 星期七'],right:'星期天 и 星期日',explain:'Оба правильных слова — 星期天 и 星期日.'},
 {kind:'audio',q:'Какой день ты услышал?',audio:'星期四',options:['星期三','星期五','星期四'],right:'星期四',explain:'星期四 xīngqī sì — четверг, четвёртый тон.'},
 {kind:'meaning',q:'Что означает 明天?',options:['завтра','вчера','сегодня'],right:'завтра',explain:'明天 míngtiān — завтра.'},
 {kind:'pick',q:'Как правильно спросить о сегодняшнем дне?',options:['今天星期几吗？','昨天星期几？','今天星期几？'],right:'今天星期几？',explain:'Сегодня — 今天, вопросительное слово 几. Частица 吗 не нужна.'},
 {kind:'reason',q:'Сегодня воскресенье. Что будет завтра?',options:['星期一','星期二','星期六'],right:'星期一',explain:'После воскресенья наступает понедельник — 星期一.'},
 {kind:'meaning',q:'Что означает 昨天?',options:['завтра','вчера','сегодня'],right:'вчера',explain:'昨天 zuótiān — вчера.'},
 {kind:'audio',q:'Послушай и выбери слово',audio:'星期二',options:['星期四','星期二','星期三'],right:'星期二',explain:'星期二 xīngqī èr — вторник; èr имеет четвёртый тон.'},
 {kind:'reason',q:'Составь ответ на «明天星期几？»',options:['明天星期六。','昨天星期六。','今天星期几？'],right:'明天星期六。',explain:'В ответе о завтрашнем дне используется 明天.'}
];
const allWords=[
 {zh:'星期',py:'xīngqī',ru:'неделя; основа названий дней'},
 ...DAYS.slice(0,6).map(d=>({zh:d.zh,py:d.py,ru:d.ru})),
 {zh:'星期日',py:'xīngqī rì',ru:'воскресенье'},
 {zh:'星期天',py:'xīngqī tiān',ru:'воскресенье (разговорный вариант)'},
 ...TIMES,
 {zh:'几',py:'jǐ',ru:'сколько; какой по счёту'},
 {zh:'日',py:'rì',ru:'день; солнце'},
 {zh:'今天星期几？',py:'Jīntiān xīngqī jǐ?',ru:'Какой сегодня день недели?'},
 {zh:'明天星期几？',py:'Míngtiān xīngqī jǐ?',ru:'Какой завтра день недели?'},
 {zh:'今天星期五。',py:'Jīntiān xīngqī wǔ.',ru:'Сегодня пятница.'},
 {zh:'明天星期六。',py:'Míngtiān xīngqī liù.',ru:'Завтра суббота.'},
 {zh:'昨天星期二。',py:'Zuótiān xīngqī èr.',ru:'Вчера был вторник.'},
 {zh:'今天星期三。',py:'Jīntiān xīngqī sān.',ru:'Сегодня среда.'},
 {zh:'今天星期一。',py:'Jīntiān xīngqī yī.',ru:'Сегодня понедельник.'},
 {zh:'今天是星期五。',py:'Jīntiān shì xīngqī wǔ.',ru:'Сегодня пятница (с 是).'},
 {zh:'你星期几有空？',py:'Nǐ xīngqī jǐ yǒu kòng?',ru:'В какой день недели ты свободен?'},
 {zh:'我星期六有空。',py:'Wǒ xīngqī liù yǒu kòng.',ru:'Я свободен в субботу.'},
 {zh:'我们星期六一起去看电影吧！',py:'Wǒmen xīngqī liù yìqǐ qù kàn diànyǐng ba!',ru:'Давай вместе сходим в кино в субботу!'}
];
const newState=()=>({
 step:0,maxStep:0,done:false,legacyDone:false,legacyScore:null,heard:[],heardTimes:[],sundayPassed:false,grammarPassed:false,
 ix:{4:0,7:0,9:0,10:0,11:0},answered:null,wrong:{},examAnswers:{},reviewAnswers:{},reviewMode:false,reviewIndices:[],
 focus:'星期一',writing:'日',written:[],tiles:[],used:[],sentenceDone:[],showPinyin:false,listenReady:false
});
let state=newState();
try{
 const saved=JSON.parse(localStorage.getItem(VERSION)||'null');
 if(saved&&typeof saved==='object'){
  state=Object.assign(newState(),saved);
  state.ix=Object.assign(newState().ix,saved.ix||{});
  state.step=Math.max(0,Math.min(TOTAL-1,Math.floor(Number(state.step)||0)));
  for(const k of ['heard','heardTimes','written','tiles','used','sentenceDone','reviewIndices'])if(!Array.isArray(state[k]))state[k]=newState()[k];
  for(const k of ['wrong','examAnswers','reviewAnswers'])if(!state[k]||typeof state[k]!=='object')state[k]={};
  for(const [k,limit] of [[4,LISTEN.length],[7,CALENDAR.length],[9,DIALOG.length],[10,BUILDS.length],[11,EXAM.length]])state.ix[k]=Math.min(limit,Math.max(0,Math.floor(Number(state.ix[k])||0)));
 }else{
  const old=JSON.parse(localStorage.getItem(PREV_VERSION)||'null');
  if(old&&typeof old==='object'){
   state.legacyDone=old.done===true;
   state.legacyScore=Number.isInteger(old.firstTry)?old.firstTry:null;
   state.heard=Array.isArray(old.heardWords)?old.heardWords.filter(x=>LEARN_AUDIO.includes(x)):[];
   state.heardTimes=Array.isArray(old.timeViewed)?old.timeViewed.filter(x=>TIMES.some(y=>y.zh===x)):[];
   // Curriculum changed; start the new questions from the beginning, keep the old completion.
  }
 }
}catch{}
const save=()=>{try{localStorage.setItem(VERSION,JSON.stringify(state))}catch{}};
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ownerMap=Object.freeze({
 '今天':'./assets/lesson4-owner-review-v217/owner-15.mp3',
 '今天星期五。':'./assets/lesson4-owner-review-v217/owner-21.mp3',
 '今天是星期五。':'./assets/lesson4-owner-review-v217/owner-22.mp3'
});
const fileMap=()=>window.PANDA_HSK1_L4_VOICE_V214||{};
const nativeMap=()=>window.PANDA_HSK1_NATIVE_HUMAN_V167||{};
const fileFor=(word,role='female')=>role==='male'
 ? (window.PANDA_HSK1_VOICES?.male?.[word]||null)
 : (window.PandaLesson4XiaoxiaoV265?.lookup(word)||window.PandaCleanAudioV250?.lookup(word)||window.PandaCleanAudioV249?.lookup(word)||window.PandaOwnerAudio?.lookup(word)||fileMap()[word]||ownerMap[word]||nativeMap()[word]||null);
const AUDIO_LEVELS={"./assets/lesson4-owner-review-v217/owner-15.mp3":0.88,"./assets/lesson4-owner-review-v217/owner-21.mp3":0.88,"./assets/lesson4-owner-review-v217/owner-22.mp3":0.88,"./assets/hsk1-weekdays-clean-v214/001.mp3": 0.7834, "./assets/hsk1-weekdays-clean-v214/002.mp3": 0.9661, "./assets/hsk1-weekdays-clean-v214/003.mp3": 0.9716, "./assets/hsk1-weekdays-clean-v214/004.mp3": 0.8861, "./assets/hsk1-weekdays-clean-v214/005.mp3": 0.8008, "./assets/hsk1-weekdays-clean-v214/006.mp3": 1, "./assets/hsk1-weekdays-clean-v214/007.mp3": 0.9258, "./assets/hsk1-weekdays-clean-v214/008.mp3": 0.673, "./assets/hsk1-weekdays-clean-v214/009.mp3": 0.6331, "./assets/hsk1-weekdays-clean-v214/010.mp3": 0.9761, "./assets/hsk1-weekdays-clean-v214/011.mp3": 0.858, "./assets/hsk1-weekdays-clean-v214/012.mp3": 0.8366, "./assets/hsk1-weekdays-clean-v214/013.mp3": 0.7943, "./assets/hsk1-weekdays-clean-v214/014.mp3": 0.8511, "./assets/hsk1-weekdays-clean-v214/015.mp3": 0.9863, "./assets/hsk1-weekdays-clean-v214/016.mp3": 0.874, "./assets/hsk1-weekdays-clean-v214/017.mp3": 0.7825, "./assets/yue-tan-human-v166/094_92611b3bbea1298a77d4.mp3": 0.6434, "./assets/yue-tan-human-v166/050_e2e4b1164ea07e93d0a4.mp3": 0.9539, "./assets/hsk1-voice-corrections-v157/ri-native-yue-tan.mp3": 0.6124};
let audio=null,epoch=0,dialoguePlayback='idle',writer=null,writerEpoch=0,recorder=null,recStream=null,micBlobURL=null;
function soundStop(){
 epoch++;
 dialoguePlayback='idle';
 if(audio){audio.onended=null;audio.onerror=null;try{audio.pause()}catch{}audio=null}
}
function micStop(preserve=false){
 if(recorder&&recorder.state!=='inactive')try{recorder.stop()}catch{}
 recorder=null;
 if(recStream){for(const track of recStream.getTracks())track.stop();recStream=null}
 if(!preserve&&micBlobURL){try{URL.revokeObjectURL(micBlobURL)}catch{}micBlobURL=null}
}
function writerStop(){writerEpoch++;try{writer?.cancelQuiz?.()}catch{}writer=null}
function message(text='',kind='info'){
 notice.textContent=text;notice.hidden=!text;notice.dataset.kind=kind;
}
function play(word,callback,role='female'){
 soundStop();
 const serial=epoch;
 const file=fileFor(word,role);
 if(file){
  try{
   const player=new Audio(window.PandaAudioLevel?.[file]||file);audio=player;player.preload='auto';player.preservesPitch=true;player.playbackRate=role==='male'?0.92:1;player.volume=window.PandaAudioLevel?.[file]?1:(AUDIO_LEVELS[file]??1);
   player.onended=()=>{if(serial===epoch){audio=null;callback?.(true)}};
   player.onerror=()=>{if(serial===epoch){audio=null;message('Аудиофайл не загрузился — повтори попытку.','error');callback?.(false)}};
   const p=player.play();if(p?.catch)p.catch(()=>{if(serial===epoch){audio=null;message('Браузер заблокировал звук. Нажми ещё раз.','error');callback?.(false)}});
   return;
  }catch{message('Не удалось воспроизвести запись.','error')}
 }
 message('Нужна цельная запись носительницы для «'+word+'». Системный голос не используется.','error');callback?.(false);
}
const audioButton=(word,label='▶ Слушать',additional='')=>!fileFor(word)?'<span class="pg4-missing-audio" role="note">🔇 Запись готовится</span>':'<button type="button" class="pg4-audio" data-play="'+esc(word)+'" '+additional+' aria-label="Слушать '+esc(word)+'"><img src="./assets/vendor/icons/volume-2.svg" alt="">'+esc(label.replace(/^[▶🔊]+\s*/u,''))+'</button>';
const compactAudioButton=(word)=>fileFor(word)
 ? '<button type="button" class="pg4-audio-icon" data-play="'+esc(word)+'" aria-label="Прослушать '+esc(word)+'" title="Прослушать фразу"><img src="./assets/vendor/icons/volume-2.svg" alt=""></button>'
 : '<span class="pg4-missing-audio" role="note">🔇 Запись готовится</span>';
const audioCredits="<details class=\"pg13-credit\"><summary>Об аудио</summary><p>Все 25 слов и фраз словаря урока 4 записаны единым голосом Xiaoxiao. Мужская реплика в диалоге оставлена отдельной. Резервные записи Yue Tan / Shtooka (<a href=\"https://creativecommons.org/licenses/by-sa/3.0/us/\" target=\"_blank\" rel=\"noopener noreferrer\">CC BY-SA 3.0 US</a>). Часть исторических файлов собрана из фрагментов. Системная озвучка не используется.</p></details>";
const card=(body,cls='')=>'<section class="pg4-card '+cls+'">'+body+'</section>';
const h=(title)=>'<h2 class="pg4-card-title">'+title+'</h2>';
function scrollNew(){viewport.scrollTop=0}
function progressText(){const n=state.step+1;pageCount.textContent=n+' / '+TOTAL;progress.setAttribute('aria-valuenow',String(n));progress.setAttribute('aria-valuemax',String(TOTAL));fill.style.width=(n/TOTAL*100)+'%'}
function intro(){
 // The approved Panda Go panda and lesson artwork remain unchanged.
 return '<div class="pg4-cover"><img src="./assets/lesson4-reference-v216/hero.webp" alt="Панда в наушниках у озера с китайской пагодой"><div><b>Урок 4</b><h2>Дни недели</h2><span lang="zh-Hans">星期 · xīngqī</span></div></div>';
}
function study(step){
 const list=step===1?DAYS.slice(0,3):DAYS.slice(3,6);
 const focused=list.find(x=>x.zh===state.focus)||list[0];
 return card(h(step===1?'星期 + номер дня':'Ещё три дня недели')+
  (step===1?'<p class="pg4-info">Сначала прослушай основу: '+audioButton('星期','▶ 星期')+'</p>':'')+
  '<p class="pg4-info" id="pg4-learn-progress">Прослушано '+list.filter(x=>state.heard.includes(x.zh)).length+' из 3</p>'+
  '<div class="pg4-study-grid">'+list.map(x=>
   '<button class="pg4-study '+(state.heard.includes(x.zh)?'heard ':'')+(focused.zh===x.zh?'selected':'')+
   '" type="button" data-learn="'+x.zh+'"><img class="pg4-calendar-icon" src="./assets/lesson4-reference-v216/calendar-'+x.n+'.webp" alt=""><strong lang="zh-Hans">'+x.zh+'</strong><span>'+x.py+'</span><small>'+x.ru+'</small>'+
   (state.heard.includes(x.zh)?'<i>✓</i>':'')+'</button>').join('')+'</div>');
}
function sunday(){
 return card(h('У воскресенья два названия')+
 '<div class="pg4-sunday-pair"><div><strong lang="zh-Hans">星期天</strong><span>xīngqī tiān</span><small>Обычно в разговоре</small>'+
 audioButton('星期天')+'</div><b>=</b><div><strong lang="zh-Hans">星期日</strong><span>xīngqī rì</span><small>Также правильно</small>'+
 audioButton('星期日','▶ Слушать')+'</div></div>'+
 '<p class="pg4-info">星期天 и 星期日 — правильные варианты воскресенья. Прослушай оба и сравни.</p>')+
 card(h('Проверь себя')+
 '<p>Какой вариант <b>неправильный</b>?</p>'+
 choices(['星期天','星期七','星期日'],'sun-answer',true)+
 (state.sundayPassed?'<p class="pg4-success">✓ Верно: 星期七 не используется для воскресенья.</p>':''));
}
function choices(arr,action,allowPinyin=false,disabled=false){
 return '<div class="pg4-choices">'+arr.map(v=>{
   const word=DAYS.find(x=>x.zh===v);
   return '<button type="button" class="pg4-choice" data-'+action+'="'+esc(v)+'"'+(disabled?' disabled':'')+
   '><strong lang="zh-Hans">'+esc(v)+'</strong>'+
   (allowPinyin&&word&&state.showPinyin?'<small>'+word.py+'</small>':'')+'</button>';
 }).join('')+'</div>';
}
function displayFeedback(){
 const f=state.answered;if(!f||f.step!==state.step)return '';
 return '<div class="pg4-feedback '+(f.correct?'correct':'incorrect')+'">'+
 '<strong>'+(f.correct?'✓ Правильно':'✗ Пока неверно')+'</strong>'+
 '<p>'+esc(f.explain)+'</p>'+(f.correct||state.step===11?'<button type="button" data-next-item>Следующий вопрос →</button>':'<span>Выбери другой ответ и попробуй снова.</span>')+'</div>';
}
function quiz(step,arr,kind){
 const i=state.ix[step]||0;
 if(i>=arr.length)return card(h('✓ Все задания выполнены')+
 '<button class="pg4-audio" type="button" data-repeat="'+step+'">↺ Повторить вопросы</button>');
 const x=arr[i];
 const locked=state.answered?.step===step&&(state.answered.correct||step===11);
 const audioRequired=kind==='audio'||x.kind==='audio';
 const soundWord=x.audio||'';
 return card('<div class="pg4-question-progress">Вопрос '+(i+1)+' / '+arr.length+'</div>'+
 h(kind==='audio'?'Что ты услышал?':x.q||'Выбери подходящий ответ')+
 (audioRequired?'<div class="pg4-audio-center">'+audioButton(soundWord,'🔊 Слушать')+'</div>'+
 '<p class="pg4-info" id="pg4-listen-tip">Сначала дослушай запись, затем выбирай.</p>':'')+
 (kind==='audio'?'<div class="pg4-inline-toggle"><button type="button" data-pinyin>'+
 (state.showPinyin?'Скрыть пиньинь':'Показать пиньинь')+'</button></div>':'')+
 choices(x.choices||x.options,kind==='audio'?'listening-answer':step===11?'exam-answer':'practice-answer',kind==='audio',
 locked||(audioRequired&&!state.listenReady))+
 displayFeedback()+
 (step===11?'<p class="pg4-info">В экзамене учитывается только первая попытка. Ответ менять нельзя.</p>':''));
}
function timeWords(){
 return card(h('Сегодня · завтра · вчера')+
 '<div class="pg4-time-grid">'+TIMES.map(x=>'<button type="button" data-time="'+x.zh+'" class="'+(state.heardTimes.includes(x.zh)?'heard':'')+'">'+
 '<strong lang="zh-Hans">'+x.zh+'</strong><span>'+x.py+'</span><small>'+x.ru+'</small></button>').join('')+'</div>'+
 '<p class="pg4-info">Сначала послушай каждое слово. Галочка появится после окончания записи.</p>')+
 card('<div class="pg4-dayline"><span>昨天</span><i>←</i><b>今天</b><i>→</i><span>明天</span></div>'+
 '<div class="pg4-example"><strong lang="zh-Hans">今天星期三。</strong><span>Jīntiān xīngqī sān.</span><small>Сегодня среда.</small>'+audioButton('今天星期三。')+'</div>');
}
function grammar(){
 return card(h('Главный вопрос урока')+
 '<div class="pg4-big-zh" lang="zh-Hans">今天星期几？</div><div class="pg4-py">Jīntiān xīngqī jǐ?</div>'+
 '<p class="pg4-translation">Какой сегодня день недели?</p>'+
 '<div class="pg4-audio-center">'+audioButton('今天星期几？','▶ Слушать вопрос')+'</div>'+
 '<div class="pg4-breakdown"><div><b>今天</b><span>сегодня</span></div>'+
 '<div><b>星期</b><span>неделя</span></div><div><b>几</b><span>какой по счёту</span></div></div>'+
 '<p class="pg4-info"><b>几 jǐ — третий тон.</b> Вопрос уже содержит 几, поэтому 吗 не добавляем.</p>')+
 card(h('Свяжем со вторым уроком')+
 '<div class="pg4-model-phrases"><p><strong>今天星期五。</strong> — Сегодня пятница.<br><span class="pg4-pinyin-inline">Jīntiān xīngqī wǔ.</span></p>'+compactAudioButton('今天星期五。')+'<p>'+
 '<strong>今天是星期五。</strong> — Сегодня пятница.<br><span class="pg4-pinyin-inline">Jīntiān shì xīngqī wǔ.</span></p>'+compactAudioButton('今天是星期五。')+'</div>'+
 '<p class="pg4-info">Оба варианта допустимы. Ты уже знаешь 是 (shì).</p><p class="pg4-info">Цельная запись 今天是星期五。 озвучена тем же голосом Xiaoxiao.</p>'+
 '<p>Какой вопрос написан верно?</p>'+
 choices(['今天星期几吗？','今天星期几？','明天星期几？'],'grammar-answer')+
 (state.grammarPassed?'<p class="pg4-success">✓ Верно! Вопрос 几 не требует 吗.</p>':''));
}
function calendar(){
 const i=state.ix[7]||0;
 if(i>=CALENDAR.length)return ''; // Completed questions redirect to handwriting in screen().
 const data=CALENDAR[i],today=DAYS[data.today-1];
 return card('<div class="pg4-question-progress">Ситуация '+(i+1)+' из '+CALENDAR.length+'</div>'+
 h('Сегодня — '+today.ru)+
 '<div class="pg4-calendar">'+DAYS.map(d=>
 '<div class="'+(d.n===today.n?'today':'')+'"><span>'+d.short+'</span><strong lang="zh-Hans">'+d.tail+'</strong></div>').join('')+'</div>'+
 '<p class="pg4-ask">Назови день: <strong>'+data.ask.toLowerCase()+'</strong></p>'+
 choices(data.choices.map(n=>DAYS[n-1].zh),'calendar-answer',true,state.answered?.step===7&&state.answered.correct)+
 displayFeedback());
}
function handwriting(){
 return card(h('日 rì — день, солнце')+
 '<div class="pg4-audio-center">'+audioButton('日')+'</div>'+
 '<p class="pg4-info">Иероглиф состоит из четырёх черт. Сначала посмотри последовательность, затем попробуй написать пальцем.</p>'+
 '<div class="pg4-writing-area"><div id="pg4-writer" aria-label="Пропись иероглифа 日"></div></div>'+
 '<div class="pg4-write-actions"><button data-demo type="button">▶ Показать черты</button>'+
 '<button data-trace type="button">✍️ Написать</button></div>'+
 '<p id="pg4-writing-result" class="pg4-info">'+(state.written.includes('日')?'✓ Иероглиф уже написан правильно.':'Письмо необязательно для перехода дальше.')+'</p>');
}
function dialogue(){
 const d=DIALOG[0];
 const locked=(state.ix[9]||0)>=DIALOG.length||(state.answered?.step===9&&state.answered.correct);
 return card('<div class="pg4-question-progress">Короткий диалог — вопрос и ответ</div>'+
 '<div class="pg4-people">'+
 '<div><img src="./assets/lesson4-dialog-v266/woman.svg" alt="Девушка — женский голос"><span>Девушка · вопрос</span></div>'+
 '<div><img src="./assets/lesson4-dialog-v266/man.svg" alt="Парень — мужской голос"><span>Парень · ответ</span></div></div>'+
 '<div class="pg4-bubbles"><div class="from-f"><strong lang="zh-Hans">'+d.female+'</strong>'+
 '<small>'+GLOSS[d.female]+'</small></div>'+
 '<div class="from-m" id="pg4-male-preview"><strong lang="zh-Hans">'+d.male+'</strong><small>'+GLOSS[d.male]+'</small></div></div>'+
 '<div class="pg4-dialog-actions"><button type="button" class="pg4-audio" data-dialogue-toggle aria-pressed="false">▶ Слушать</button></div>'+
 '<p class="pg4-info">Девушка спрашивает, парень отвечает. Послушай и повтори.</p>'+
 '<p class="pg4-info">Выбери правильный ответ:</p>'+
 choices(d.choices,'dialog-answer',false,locked)+displayFeedback());
}
function practicalPhrases(){
 const phrases=[
  ['你星期几有空？','Nǐ xīngqī jǐ yǒu kòng?','В какой день недели ты свободен?'],
  ['我星期六有空。','Wǒ xīngqī liù yǒu kòng.','Я свободен в субботу.'],
  ['我们星期六一起去看电影吧！','Wǒmen xīngqī liù yìqǐ qù kàn diànyǐng ba!','Давай в субботу сходим в кино!']
 ];
 return '<details class="pg4-practical"><summary>Полезные фразы для планов</summary><p class="pg4-info">Дополнительно: новые слова 有空 (yǒu kòng) — быть свободным, 一起 (yìqǐ) — вместе, 看电影 (kàn diànyǐng) — смотреть кино. Нажми на динамик, чтобы послушать каждую фразу.</p>'+phrases.map(x=>'<div class="pg4-phrase"><strong lang="zh-Hans">'+x[0]+'</strong><span>'+x[1]+'</span><small>'+x[2]+'</small></div>').join('')+'</details>';
}
function sentence(){
 const i=state.ix[10]||0;
 if(i>=BUILDS.length)return ''; // Completed questions redirect to the exam in screen().
 const d=BUILDS[i];const locked=state.answered?.step===10&&state.answered.correct;
 return card('<div class="pg4-question-progress">Фраза '+(i+1)+' из '+BUILDS.length+'</div>'+
 h(d.prompt)+
 '<div class="pg4-build-slots">'+d.target.map((_,j)=>'<div class="'+(state.tiles[j]?'filled':'')+'">'+(state.tiles[j]||'＿')+'</div>').join('')+'</div>'+
 '<div class="pg4-tiles">'+d.pool.map((x,j)=>'<button data-tile="'+j+'" type="button"'+(state.used.includes(j)||locked?' disabled':'')+'>'+x+'</button>').join('')+'</div>'+
 (locked?'<div class="pg4-example"><strong lang="zh-Hans">'+d.target.join('')+'。</strong>'+audioButton(d.audio,'🔊 Слушать')+'</div>':'')+
 '<div class="pg4-build-controls"><button type="button" data-reset-tiles'+(locked?' disabled':'')+'>↺ Сброс</button>'+
 '<button type="button" data-check-tiles'+(state.tiles.length!==3||locked?' disabled':'')+'>Проверить ✓</button></div>'+
 displayFeedback());
}
function score(){
 const answered=Object.values(state.examAnswers);
 return answered.filter(v=>v.correct).length;
}
function final(){
 const missed=EXAM.map((e,i)=>({...e,index:i,record:state.examAnswers[i]})).filter(x=>x.record&&!x.record.correct);
 const percent=Math.round(score()/EXAM.length*100);
 const hard=new Set(Object.keys(state.wrong).filter(k=>k.startsWith('4-')).map(k=>LISTEN[Number(k.split('-')[1])]?.audio));
 missed.forEach(x=>hard.add(x.audio||x.right));
 const hardWords=allWords.filter(w=>hard.has(w.zh));
 return '<div class="pg4-final-top"><img src="./assets/lesson4-reference-v216/celebrate.webp" alt="Панда Panda Go поздравляет">'+
 '<div>'+
 '<p>Ты изучил дни недели и вопросы о вчера, сегодня и завтра.</p></div></div>'+
 card('<div class="pg4-final-score"><strong>'+score()+' / '+EXAM.length+'</strong><span>с первой попытки · '+percent+'%</span></div>'+
 (state.legacyScore!==null?'<p class="pg4-info">Прошлый результат версии v214: '+state.legacyScore+' из 7 сохранён в истории.</p>':'')+
 (missed.length?'<div class="pg4-mistakes"><h3>Что повторить: '+missed.length+'</h3>'+
 missed.map(x=>'<div><strong>'+(x.index+1)+'. '+esc(x.q)+'</strong>'+
 '<small>Твой ответ: '+esc(x.record.given)+'</small><small>Правильно: '+esc(x.right)+'</small></div>').join('')+
 '<button type="button" data-review-mistakes>↺ Повторить мои ошибки</button></div>':
 '<p class="pg4-success">✓ Все ответы с первой попытки. Отлично!</p>')+
 '<div class="pg4-final-nav"><a href="./hsk1-l4-cards.html">🎴 Повторить карточки урока 4 →</a><a href="./hsk1-lesson.html?lesson=5">Перейти к уроку №5 →</a>'+
 '<a href="./hsk1-map.html">К карте HSK1</a></div>')+
 (hardWords.length?card(h('Трудные слова — повтори ещё раз')+hardWords.map(x=>'<div class="pg4-dict-line"><div><strong lang="zh-Hans">'+x.zh+'</strong><span>'+x.py+'</span><small>'+x.ru+'</small></div>'+audioButton(x.zh)+'</div>').join('')):'')+
 card('<details class="pg4-dictionary"><summary>🎧 Весь словарь — '+allWords.length+' слов и фраз</summary>'+
 '<p class="pg4-info">Все 25 слов и фраз записаны голосом Xiaoxiao.</p>'+
 allWords.map(x=>'<div class="pg4-dict-line"><div><strong lang="zh-Hans">'+esc(x.zh)+'</strong><span>'+esc(x.py)+'</span><small>'+esc(x.ru)+'</small></div>'+
 audioButton(x.zh,'▶')+'</div>').join('')+'</details>')+
 '<button type="button" data-restart class="pg4-restart">↺ Повторить весь урок №4</button>'+audioCredits;
}
const screens=[intro,()=>study(1),()=>study(2),sunday,()=>quiz(4,LISTEN,'audio'),timeWords,grammar,calendar,handwriting,dialogue,sentence,()=>quiz(11,examSet(),'exam'),final];
function examSet(){return state.reviewMode?state.reviewIndices.map(i=>EXAM[i]):EXAM}
function ready(){
 const step=state.step;
 if(step===1)return DAYS.slice(0,3).every(d=>state.heard.includes(d.zh));
 if(step===2)return DAYS.slice(3,6).every(d=>state.heard.includes(d.zh));
 if(step===3)return state.sundayPassed;
 if(step===4)return state.ix[4]>=LISTEN.length;
 if(step===5)return TIMES.every(w=>state.heardTimes.includes(w.zh));
 if(step===6)return state.grammarPassed;
 if(step===7)return state.ix[7]>=CALENDAR.length;
 if(step===9)return state.ix[9]>=DIALOG.length;
 if(step===10)return state.ix[10]>=BUILDS.length;
 if(step===11)return state.ix[11]>=examSet().length;
 return true;
}
function complete(){
 state.done=true;
 try{
  const previous=JSON.parse(localStorage.getItem(DONE)||'[]');
  const arr=Array.isArray(previous)?previous:[];
  if(!arr.includes('weekdays'))arr.push('weekdays');
  localStorage.setItem(DONE,JSON.stringify(arr));
 }catch{}
 save();
}
function screen(keep=false){
 // Skip empty completion-only screens, preserving the listening exams and saved results.
 const completedPage=n=>(n===4&&state.ix[4]>=LISTEN.length)||
 (n===7&&state.ix[7]>=CALENDAR.length)||
 (n===10&&state.ix[10]>=BUILDS.length)||
 (n===11&&state.ix[11]>=examSet().length);
 while(state.step<12&&completedPage(state.step)){state.step++;keep=false}
 const pos=viewport.scrollTop;
 soundStop();writerStop();if(!keep)micStop(true);
 const s=state.step;if(s===12&&!state.done)complete();
 state.maxStep=Math.max(state.maxStep,s);
 heading.textContent=SECTIONS[s][1];subtitle.textContent=SECTIONS[s][2];
 sectionLabel.textContent=SECTIONS[s][0];
 progressText();
 document.querySelector('.pg4-app').dataset.step=String(s);
 stage.innerHTML=screens[s]();message();
 back.disabled=false;back.textContent=s===0?'← Карта':'← Назад';forward.hidden=false;forward.disabled=!ready();
 forward.textContent=s===12?'К карте HSK1 →':s===0?'Начать →':s===11?'Завершить →':'Дальше →';
 if(s===8)initWriter();
 save();viewport.scrollTop=keep?pos:0;
}
function nextScreen(){
 if(state.step===12){location.href='./hsk1-map.html';return}
 if(!ready()){message('Заверши это задание, затем продолжай.','error');return}
 if(state.step<12){state.step++;state.answered=null;state.listenReady=false;state.tiles=[];state.used=[];screen()}
}
function onLearn(word){
 const record=DAYS.find(d=>d.zh===word);if(!record)return;
 state.focus=word;
 stage.querySelectorAll('[data-learn]').forEach(el=>el.classList.toggle('selected',el.dataset.learn===word));
 const focused=stage.querySelector('.pg4-focus');
 if(focused)focused.innerHTML='<div><strong lang="zh-Hans">'+record.zh+'</strong><span>'+record.py+'</span><small>'+record.ru+'</small></div>'+
 audioButton(word,'🔊 Ещё раз');
 play(word,ok=>{
  if(!ok)return;
  if(!state.heard.includes(word))state.heard.push(word);
  const el=stage.querySelector('[data-learn="'+word+'"]');if(el)el.classList.add('heard');
  const list=state.step===1?DAYS.slice(0,3):DAYS.slice(3,6);
  const p=stage.querySelector('#pg4-learn-progress');
  if(p)p.textContent='Прослушано '+list.filter(x=>state.heard.includes(x.zh)).length+' из 3';
  forward.disabled=!ready();save();
 });
}
function recordAnswer(right,selected,explain,kind){
 const s=state.step,idx=state.ix[s]||0;
 if(state.answered?.step===s&&(state.answered.correct||s===11))return;
 const correct=selected===right;
 if(s===11){
  const actualIndex=state.reviewMode?state.reviewIndices[idx]:idx;
  const registry=state.reviewMode?state.reviewAnswers:state.examAnswers;
  if(!registry[actualIndex])registry[actualIndex]={correct,given:selected,right};
 }else if(!correct){
  const key=s+'-'+idx;state.wrong[key]=(state.wrong[key]||0)+1;
 }
 state.answered={step:s,correct,explain,selected,kind};
 if(correct&&s===11&&state.reviewMode){/* Review never alters original score */}
 if(s===11)state.listenReady=false;
 save();screen(true);
}
function afterItem(){
 const s=state.step;
 if(s===4||s===7||s===9||s===10||s===11){
  state.ix[s]++;state.answered=null;state.listenReady=false;
  state.tiles=[];state.used=[];
  if(state.ix[s]>=(s===4?LISTEN.length:s===7?CALENDAR.length:s===9?DIALOG.length:s===10?BUILDS.length:examSet().length)){
   state.step++;if(state.step===12)complete();
  }
  screen();
 }
}
function initWriter(){
 const node=document.getElementById('pg4-writer');
 if(!node||!window.HanziWriter){message('Пропись может быть недоступна. Можно продолжить урок.');return}
 const generation=++writerEpoch;
 try{
  writer=HanziWriter.create('pg4-writer','日',{
   width:Math.min(235,Math.max(160,node.clientWidth||215)),height:Math.min(235,Math.max(160,node.clientWidth||215)),
   padding:9,showCharacter:false,showOutline:true,strokeColor:'#8c478e',radicalColor:'#8c478e',
   outlineColor:'#e0c1d5',drawingColor:'#b65db6',highlightColor:'#e5a662',strokeAnimationSpeed:1,
   delayBetweenStrokes:450,showHintAfterMisses:3,acceptBackwardsStrokes:false,
   charDataLoader:(char,onComplete,onError)=>fetch('./assets/hanzi-data/'+encodeURIComponent(char)+'.json')
    .then(r=>{if(!r.ok)throw Error('No stroke data');return r.json()})
    .then(data=>{if(generation===writerEpoch)onComplete(data)})
    .catch(err=>{if(generation===writerEpoch)onError(err)})
  });
 }catch{message('Пропись недоступна, упражнение можно пропустить.','error')}
}
function setWrite(text){const el=stage.querySelector('#pg4-writing-result');if(el)el.textContent=text}
function updateDialogueButton(){
 const btn=stage.querySelector('[data-dialogue-toggle]');if(!btn)return;
 btn.textContent=dialoguePlayback==='playing'?'⏸ Пауза':dialoguePlayback==='paused'?'▶ Продолжить':'▶ Слушать';
 btn.setAttribute('aria-pressed',dialoguePlayback==='playing'?'true':'false');
}
function playConversation(){
 if(state.step!==9)return;
 // The dialogue card always shows DIALOG[0], even when the exercise is complete.
 // State ix[9] is a completion counter, NOT the index of the visible dialogue.
 // A finished user must still be able to replay both voices after returning here.
 const d=DIALOG[0];
 if(!d){message('Диалог пока недоступен.','error');return}
 const left=stage.querySelector('.from-f'),right=stage.querySelector('.from-m');
 left?.classList.add('active');right?.classList.remove('active');message('');
 play(d.female,ok=>{
  if(!ok){left?.classList.remove('active');dialoguePlayback='idle';updateDialogueButton();return}
  left?.classList.remove('active');right?.classList.add('active');
  if(!fileFor(d.male,'male')){
   message('Мужская реплика временно недоступна.','error');
   dialoguePlayback='idle';updateDialogueButton();return;
  }
  dialoguePlayback='playing';updateDialogueButton();
  play(d.male,maleOK=>{
   right?.classList.remove('active');dialoguePlayback='idle';updateDialogueButton();
   if(!maleOK)message('Не удалось воспроизвести мужскую реплику. Нажми «Слушать» ещё раз.','error');
  },'male');
  dialoguePlayback='playing';updateDialogueButton();
 });
 dialoguePlayback='playing';updateDialogueButton();
}
function toggleConversation(){
 if(state.step!==9)return;
 if(dialoguePlayback==='playing'&&audio){
  try{audio.pause();dialoguePlayback='paused';updateDialogueButton()}catch{message('Не удалось приостановить звук.','error')}
  return;
 }
 if(dialoguePlayback==='paused'&&audio){
  try{
   const p=audio.play();dialoguePlayback='playing';updateDialogueButton();
   if(p?.catch)p.catch(()=>{dialoguePlayback='paused';updateDialogueButton();message('Нажми «Продолжить» ещё раз.','error')});
  }catch{message('Не удалось продолжить звук.','error')}
  return;
 }
 playConversation();
}
function playQuestion(word){
 state.listenReady=false;
 stage.querySelectorAll('[data-listening-answer],[data-exam-answer]').forEach(el=>el.disabled=true);
 play(word,ok=>{
  if(ok&&stage.contains(document.querySelector('[data-listening-answer], [data-exam-answer]'))){
   state.listenReady=true;
   const locked=state.answered?.step===state.step&&(state.answered.correct||state.step===11);
   stage.querySelectorAll('[data-listening-answer],[data-exam-answer]').forEach(el=>el.disabled=!!locked);
   const hint=stage.querySelector('#pg4-listen-tip');if(hint)hint.textContent='Запись завершена. Выбери ответ.';
  }
 });
}
function makeMicRecording(){
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){setMic('Запись микрофона не поддерживается здесь. Повтори фразу вслух.');return}
 if(recorder&&recorder.state==='recording')return;
 micStop();
 navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}})
 .then(stream=>{
  if(state.step!==9){stream.getTracks().forEach(t=>t.stop());return}
  recStream=stream;
  const chunks=[];
  recorder=new MediaRecorder(stream);
  recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
  recorder.onstop=()=>{
   stream.getTracks().forEach(t=>t.stop());recStream=null;
   if(chunks.length){
    if(micBlobURL)URL.revokeObjectURL(micBlobURL);
    const raw=new Blob(chunks,{type:recorder?.mimeType||'audio/webm'});micBlobURL=URL.createObjectURL(raw);window.PANDA_MIC_V236?.enhance?.(raw,micBlobURL,()=>micBlobURL,url=>{micBlobURL=url});
    setMic('Запись готова. Можно прослушать себя и сравнить с образцом.');
   }else setMic('Звук не записался.');
  };
  recorder.start();setMic('🔴 Идёт запись. Произнеси фразу и нажми «Завершить запись».');
 }).catch(()=>setMic('Нет доступа к микрофону. Произнеси фразу вслух без записи.'));
}
function setMic(text){const el=stage.querySelector('#pg4-mic-status');if(el)el.textContent=text}
stage.addEventListener('click',ev=>{
 const btn=ev.target.closest('button');if(!btn||btn.disabled)return;
 const step=state.step;
 if(btn.hasAttribute('data-learn')){onLearn(btn.dataset.learn);return}
 if(btn.hasAttribute('data-time')){
  const word=btn.dataset.time;
  play(word,ok=>{
   if(!ok)return;
   if(!state.heardTimes.includes(word))state.heardTimes.push(word);
   btn.classList.add('heard');forward.disabled=!ready();save();
  });return;
 }
 if(btn.hasAttribute('data-play')){
  const word=btn.dataset.play;
  const requiresListen=step===4||step===11&&examSet()[state.ix[11]]?.kind==='audio';
  if(requiresListen)playQuestion(word);
  else play(word);return;
 }
 if(btn.hasAttribute('data-sun-answer')){
  const x=btn.dataset.sunAnswer;
  if(x==='星期七'){state.sundayPassed=true;screen(true);message('✓ Правильно! Воскресенье — 星期天 или 星期日.','success')}
  else message('Оба варианта '+x+' — правильные. Выбери неправильное название.','error');
  forward.disabled=!ready();save();return;
 }
 if(btn.hasAttribute('data-grammar-answer')){
  const x=btn.dataset.grammarAnswer;
  if(x==='今天星期几？'){state.grammarPassed=true;screen(true);message('✓ 几 уже делает фразу вопросительной.','success')}
  else message(x.includes('吗')?'Вопрос с 几 уже вопросительный: 吗 не нужна.':'明天 — завтра. Здесь спрашиваем про сегодня: 今天.','error');
  forward.disabled=!ready();save();return;
 }
 if(btn.hasAttribute('data-pinyin')){
  state.showPinyin=!state.showPinyin;screen(true);return;
 }
 if(btn.hasAttribute('data-listening-answer')){
  if(!state.listenReady)return;
  const q=LISTEN[state.ix[4]];
  if(q)recordAnswer(q.correct,btn.dataset.listeningAnswer,q.explain,'audio');
  return;
 }
 if(btn.hasAttribute('data-calendar-answer')){
  const q=CALENDAR[state.ix[7]];
  if(q){const correct=DAYS[q.correct-1].zh;recordAnswer(correct,btn.dataset.calendarAnswer,q.explain,'calendar')}
  return;
 }
 if(btn.hasAttribute('data-dialog-answer')){
  const q=DIALOG[state.ix[9]];
  if(q)recordAnswer(q.correct,btn.dataset.dialogAnswer,q.explain,'dialogue');
  return;
 }
 if(btn.hasAttribute('data-tile')){
  const q=BUILDS[state.ix[10]],i=Number(btn.dataset.tile);
  if(!q||!Number.isInteger(i)||state.used.includes(i))return;
  state.used.push(i);state.tiles.push(q.pool[i]);screen(true);return;
 }
 if(btn.hasAttribute('data-reset-tiles')){
  state.tiles=[];state.used=[];screen(true);return;
 }
 if(btn.hasAttribute('data-check-tiles')){
  const q=BUILDS[state.ix[10]];
  if(!q)return;
  const ok=state.tiles.join('')===q.target.join('');
  if(ok){
   state.answered={step:10,correct:true,explain:q.target.join('')+'。 — предложение собрано верно.'};
  }else{
   state.wrong['sentence-'+state.ix[10]]=(state.wrong['sentence-'+state.ix[10]]||0)+1;
   state.tiles=[];state.used=[];state.answered={step:10,correct:false,explain:'Сначала 今天/明天/昨天, затем 星期 и номер дня.'};
  }
  screen(true);return;
 }
 if(btn.hasAttribute('data-exam-answer')){
  const q=examSet()[state.ix[11]];
  if(!q)return;
  if(q.kind==='audio'&&!state.listenReady)return;
  recordAnswer(q.right,btn.dataset.examAnswer,q.explain,'exam');return;
 }
 if(btn.hasAttribute('data-next-item')){afterItem();return}
 if(btn.hasAttribute('data-repeat')){
  const n=Number(btn.dataset.repeat);state.ix[n]=0;state.answered=null;state.listenReady=false;
  state.tiles=[];state.used=[];screen(true);return;
 }
 if(btn.hasAttribute('data-demo')){
  try{writer?.cancelQuiz?.();writer?.animateCharacter?.();setWrite('Следи за порядком четырёх черт: сверху вниз; нижняя горизонтальная — последняя.')}catch{message('Анимация не запустилась.','error')}
  return;
 }
 if(btn.hasAttribute('data-trace')){
  if(!writer){message('Пропись недоступна на этом устройстве.','error');return}
  const current=writerEpoch;
  try{writer.cancelQuiz?.();writer.quiz({
   onCorrectStroke:info=>{if(current===writerEpoch)setWrite('Верно! Осталось черт: '+info.strokesRemaining)},
   onComplete:()=>{if(current===writerEpoch){if(!state.written.includes('日'))state.written.push('日');save();setWrite('✓ 日 написан правильно!')}}});}
  catch{message('Не удалось включить проверку черт.','error')}
  return;
 }
 if(btn.hasAttribute('data-dialogue-toggle')){toggleConversation();return}
  if(btn.hasAttribute('data-mic-record')){makeMicRecording();return}
 if(btn.hasAttribute('data-mic-stop')){if(recorder?.state==='recording')recorder.stop();return}
 if(btn.hasAttribute('data-mic-play')){
  if(!micBlobURL){setMic('Сначала запиши свой голос.');return}
  soundStop();try{audio=new Audio(window.PandaAudioLevel?.[micBlobURL]||micBlobURL);audio.play().catch(()=>setMic('Не удалось воспроизвести запись.'))}catch{}
  return;
 }
 if(btn.hasAttribute('data-review-mistakes')){
  const indexes=EXAM.map((x,i)=>i).filter(i=>state.examAnswers[i]?.correct===false);
  if(!indexes.length)return;
  state.reviewMode=true;state.reviewIndices=indexes;state.reviewAnswers={};
  state.ix[11]=0;state.step=11;state.answered=null;state.listenReady=false;screen();return;
 }
 if(btn.hasAttribute('data-restart')){
  const previousDone=state.done||state.legacyDone,previousScore=state.legacyScore;
  state=newState();state.legacyDone=previousDone;state.legacyScore=previousScore;screen();return;
 }
});
back.addEventListener('click',()=>{
 if(state.step===0){location.href='./hsk1-map.html';return}
 let previous=state.step-1;
 // On back navigation skip all previously completed exercise placeholders.
 const completedPage=n=>(n===4&&state.ix[4]>=LISTEN.length)||
 (n===7&&state.ix[7]>=CALENDAR.length)||
 (n===10&&state.ix[10]>=BUILDS.length)||
 (n===11&&state.ix[11]>=examSet().length);
 while(previous>0&&completedPage(previous))previous--;
 state.step=previous;state.answered=null;state.listenReady=false;state.tiles=[];state.used=[];screen()
});
forward.addEventListener('click',nextScreen);
window.addEventListener('pagehide',()=>{soundStop();writerStop();micStop()});

screen();
})();
