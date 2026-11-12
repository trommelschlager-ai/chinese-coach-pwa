/* Panda Go HSK1 v263 — all 101 complete numbers from Xiaoxiao.
   Existing 14-screen curriculum and progress are preserved.
   Tones and commercial Luvvoice usage rights require final review. */
(()=>{
'use strict';
const root=document.getElementById('pg3-stage'),scroll=document.getElementById('pg3-scroll');
const prev=document.getElementById('pg3-prev'),next=document.getElementById('pg3-next');
const title=document.getElementById('pg3-title'),sub=document.getElementById('pg3-subtitle');
const label=document.getElementById('pg3-label'),counter=document.getElementById('pg3-count');
const progress=document.getElementById('pg3-progress'),progressFill=document.getElementById('pg3-progress-fill');
const notice=document.getElementById('pg3-notice');
if(!root||!next||!prev)return;
const KEY='pg-hsk1-v213-numbers',OLD='pg-hsk1-v212-numbers',DONE='pg-hsk1-v3-complete';
const DIGITS=['零','一','二','三','四','五','六','七','八','九'];
const PINYIN=['líng','yī','èr','sān','sì','wǔ','liù','qī','bā','jiǔ'];
const TONE=[2,1,4,1,4,3,4,1,1,3];
const TONE10=2;
const RU=['ноль','один','два','три','четыре','пять','шесть','семь','восемь','девять','десять'];
const ITEMS=[...DIGITS.map((z,n)=>({n,z,py:PINYIN[n],ru:RU[n]})),{n:10,z:'十',py:'shí',ru:'десять'}];
const META=[
 ['УРОК 3 · HSK1','Числа от 0 до 100','Начнём с цифр, а затем научимся составлять любые числа'],
 ['ПЕРВЫЕ ЧИСЛА','Считай от 1 до 5','Нажми каждую карточку и дослушай произношение'],
 ['ПЕРВЫЕ ЧИСЛА','Считай от 6 до 10','Послушай и запомни ещё пять чисел'],
 ['ЗВУКИ И ТОНЫ','Слушай и различай','Узнай число на слух, не подсматривая в пиньинь'],
 ['ПРОПИСЬ','Пишем пальцем','Три первых иероглифа и направление черт'],
 ['ЧИСЛА 11–19','Десять плюс единицы','Все числа от 11 до 19 строятся одинаково'],
 ['ДЕСЯТКИ 20–90','Сколько десятков?','Сначала количество десятков, затем 十'],
 ['ЧИСЛА 21–99','Десятки и единицы','Теперь ты можешь собрать любое число из двух разрядов'],
 ['НОЛЬ И СТО','Новая граница','零 — ноль, 一百 — ровно сто'],
 ['КОНСТРУКТОР','Собери числа','Используй правила без готовых подсказок'],
 ['ТРЕНИРОВКА СЛУХА','Проверь числа','Ответ выбирается только после прослушивания'],
 ['ПРАКТИКА','Числа вокруг нас','Узнай количество и число на ценнике'],
 ['ПРОВЕРКА ЗНАНИЙ','Справишься без подсказок?','Восемь разных вопросов на цифры и правила'],
 ['УРОК 3 · ЗАВЕРШЁН','Ты умеешь считать!','Открой любое число до 100 и повтори его']
];
const TWENTIES=Array.from({length:8},(_,i)=>(i+2)*10);
const TONES=[
 {n:4,options:[4,10,7],info:'四 sì — 4-й тон ↘. 十 shí — 2-й тон ↗.'},
 {n:10,options:[4,10,9],info:'十 shí — восходящий второй тон, в отличие от 四 sì.'},
 {n:6,options:[9,6,5],info:'六 liù — четвёртый тон, 五 wǔ — третий.'}
];
const TEEN=[{n:17,options:[17,70,16]},{n:19,options:[19,90,10]}];
const DECADES=[{n:30,options:[13,30,3]},{n:60,options:[16,60,6]}];
const COMPOUND=[{n:36,options:[63,36,30]},{n:75,options:[57,70,75]},{n:99,options:[90,19,99]}];
const BUILD=[23,47,68,90];
const HEAR=[{n:3,options:[3,5,9]},{n:7,options:[7,1,4]},{n:10,options:[4,10,6]},
 {n:15,options:[15,50,14]},{n:42,options:[24,42,40]},{n:86,options:[68,80,86]}];
const CONTEXT=[
 {q:'На столе три яблока. Сколько?',visual:'🍎 🍎 🍎',n:3,options:[2,3,4]},
 {q:'На ценнике написано 36. Как это по-китайски?',visual:'🏷️ 36',n:36,options:[63,36,30]},
 {q:'В коробке восемь подарков. Какое число?',visual:'🎁 🎁 🎁 🎁  🎁 🎁 🎁 🎁',n:8,options:[6,8,9]}
];
const EXAM=[
 {kind:'hanzi',q:'Как написать число 35?',n:35,options:[35,53,30],explain:'三十 — тридцать, 五 — пять → 三十五 (35).'},
 {kind:'hanzi',q:'Как выглядит число 19?',n:19,options:[90,19,91],explain:'十 (10) + 九 (9) = 十九 (19).'},
 {kind:'hanzi',q:'Как написать число 80?',n:80,options:[18,80,8],explain:'八 (8) × 十 (10) = 八十 (80).'},
 {kind:'digit',q:'Сколько это: 六十七?',n:67,options:[76,67,60],explain:'六十 — шесть десятков, 七 — семь единиц.'},
 {kind:'audio',q:'Послушай и выбери число',n:9,options:[9,7,6],explain:'九 jiǔ — девять, третий тон.'},
 {kind:'audio',q:'Послушай составное число',n:52,options:[25,52,50],explain:'五十 = 50, 二 = 2 → 五十二 (52).'},
 {kind:'digit',q:'Какое число 一百?',n:100,options:[10,100,11],explain:'一百 (yì bǎi) означает 100. Обрати внимание на тон 一.'},
 {kind:'hanzi',q:'Как написать число 0?',n:0,options:[0,10,1],explain:'零 (líng) — ноль.'}
];
function chinese(n){
 if(!Number.isInteger(n)||n<0||n>100)return '';
 if(n===100)return '一百';
 if(n<10)return DIGITS[n];
 if(n===10)return '十';
 if(n<20)return '十'+DIGITS[n%10];
 const d=Math.floor(n/10),u=n%10;
 return DIGITS[d]+'十'+(u?DIGITS[u]:'');
}
function syllables(n){
 if(n===100)return ['yì','bǎi'];
 if(n===0)return ['líng'];
 if(n<10)return [PINYIN[n]];
 if(n===10)return ['shí'];
 if(n<20)return ['shí',PINYIN[n%10]];
 const d=Math.floor(n/10),u=n%10;
 return [PINYIN[d],'shí',...(u?[PINYIN[u]]:[])];
}
const pinyin=n=>syllables(n).join(' ');
const pretty=n=>chinese(n)+' · '+pinyin(n);
const escape=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const fresh=()=>({
 step:0,maxStep:0,done:false,viewed:{"1":[],"2":[]},completedSpeech:{"1":[],"2":[]},
 selected:{1:1,2:6},phase:{3:0,5:0,6:0,7:0,9:0,10:0,11:0,12:0},
 passed:{},wrong:{},firstTry:0,heard:false,sounding:false,
 written:[],writing:'一',builder:[],builderCorrect:false,questionAnswered:false,
 choice:null,generator:36,legacyCompleted:false
});
let state=fresh();
try{
 let old=JSON.parse(localStorage.getItem(KEY)||'null');
 if(old&&typeof old==='object'){
  Object.assign(state,old);
  state.phase=Object.assign(fresh().phase,old.phase||{});
  state.step=Number.isInteger(old.step)?Math.max(0,Math.min(13,old.step)):0;
 }else{
  const legacy=JSON.parse(localStorage.getItem(OLD)||'null');
  if(legacy&&typeof legacy==='object'){
   state.legacyCompleted=legacy.completed===true;
   state.written=Array.isArray(legacy.written)?legacy.written.slice():[];
   const previousToDigit=x=>x==='十'?10:DIGITS.indexOf(x);
   state.viewed[1]=(legacy.viewed?.[1]||[]).map(previousToDigit).filter(x=>x>=1&&x<=5);
   state.viewed[2]=(legacy.viewed?.[2]||[]).map(previousToDigit).filter(x=>x>=6&&x<=10);
   // New extended material starts at the beginning. The v212 save is intact.
  }
 }
}catch{}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}};
let audio=null,requestId=0,tts=null,writer=null,writerId=0;
// Numbers use only the new single-voice Xiaoxiao clips.
function cleanStop(){
 requestId++;
 if(audio){try{audio.pause()}catch{}audio.onended=null;audio.onerror=null;audio=null}
 if(tts){tts.onstart=null;tts.onend=null;tts.onerror=null;tts=null}
 try{window.speechSynthesis?.cancel()}catch{}
}
function inform(message,kind='info'){
 notice.textContent=message||'';
 notice.hidden=!message;
 notice.dataset.kind=kind;
}
function stopWriter(){writerId++;try{writer?.cancelQuiz?.()}catch{}writer=null}
function recording(n){
 if(!Number.isInteger(n)||n<0||n>100)return null;
 return window.PandaLesson3XiaoxiaoV263?.lookup(n)||null;
}
function play(n,onEnd){
 cleanStop();
 const serial=requestId;
 state.sounding=true;state.heard=false;
 const finished=(success)=>{
  if(serial!==requestId)return;
  audio=null;tts=null;
  state.sounding=false;
  if(success)state.heard=true;
  if(typeof onEnd==='function')onEnd(success);
 };
 const file=recording(n);
 if(file){
  try{
   const player=new Audio(window.PandaAudioLevel?.[file]||file);audio=player;player.preload='auto';
   player.preservesPitch=true;player.playbackRate=1;
   player.onended=()=>finished(true);
   player.onerror=()=>{finished(false);inform('Запись не загрузилась. Попробуй снова.','error')};
   const promise=player.play();
   if(promise?.catch)promise.catch(()=>{finished(false);inform('Нажми «Слушать» ещё раз.','error')});
  }catch{finished(false);inform('Не удалось открыть аудио.','error')}
  return;
 }
 // Never fall back to noisy older composites or another synthesized voice.
 finished(false);inform('Запись недоступна. Обнови страницу урока.','error');
}
function audioButton(n,label='▶ Слушать',extra=''){
 const invalid=recording(n)===null;
 return '<button class="pg3-audio" type="button" data-audio="'+n+'" '+extra+
  ' aria-label="'+escape(label)+' — '+escape(pretty(n))+'">'+escape(label)+'</button>'+
  (n===100?'<small class="pg13-audio-note">'+(recording(100)?'yì bǎi · 4-й + 3-й тон':'Запись недоступна')+'</small>':
   invalid?'<small class="pg13-audio-note">Аудиозапись недоступна</small>':'');
}
function mainCard(body,classes=''){return '<section class="pg3-card '+classes+'">'+body+'</section>'}
function heading(text){return '<h2 class="pg13-card-heading">'+text+'</h2>'}
function basic(n,extra=''){return '<strong lang="zh-Hans">'+chinese(n)+'</strong><span>'+pinyin(n)+'</span><small>'+extra+'</small>'}
function intro(){
 const cards=[1,2,3,4,5].map(n=>'<div class="pg3-intro-num">'+basic(n,RU[n])+'</div>').join('');
 return '<div class="pg13-intro-hero"><img src="./assets/lesson-success-v233.webp" alt="Панда — помощник в изучении китайского">'+
  '<div><span class="pg13-small-kicker">HSK 1 · НОВЫЙ УРОК</span><h2>Считаем до 100!</h2><p>Не нужно учить сто новых слов: достаточно цифр и трёх простых правил.</p></div></div>'+
  mainCard('<div class="pg3-intro-numbers">'+cards+'</div><p class="pg3-muted pg3-center">Сначала числа, потом десятки и сотня.</p>')+
  mainCard(heading('После урока ты сможешь')+
    '<div class="pg13-goal">🔊 Узнавать числа от 0 до 100 на слух</div>'+
    '<div class="pg13-goal">🧩 Самостоятельно составлять двузначные числа</div>'+
    '<div class="pg13-goal">✍️ Писать простые иероглифы пальцем</div>'+
    '<div class="pg13-goal">🎯 Решать задания без подсказок</div>');
}
function study(step){
 const numbers=step===1?[1,2,3,4,5]:[6,7,8,9,10];
 const items=numbers.map(n=>{
  const checked=(state.viewed[step]||[]).includes(n);
  return '<button class="pg13-num-card '+(state.selected[step]===n?'active ':'')+(checked?'heard':'')+
   '" type="button" data-study="'+n+'"><strong lang="zh-Hans">'+chinese(n)+'</strong><span>'+pinyin(n)+
   '</span><small>'+RU[n]+'</small>'+(checked?'<b aria-label="Прослушано">✓</b>':'')+'</button>';
 }).join('');
 const n=state.selected[step];
 const count=(state.viewed[step]||[]).length;
 return mainCard(heading('Выбери число и послушай до конца')+
   '<p class="pg3-muted">Прослушано '+count+' из 5. Число отмечается только после окончания записи.</p>'+
   '<div class="pg13-study-grid">'+items+'</div>')+
   mainCard('<div class="pg13-focused"><div class="pg13-focused-number">'+basic(n,RU[n])+'</div>'+
   '<div>'+audioButton(n,'🔊 Ещё раз')+'</div></div>'+
   (step===1?'<p class="pg3-tip"><strong>一 — yī</strong> отдельно произносится первым тоном. В <b>一个苹果</b> — yí ge píngguǒ — тон меняется. Это дополнительный пример, не обязательное слово.</p>':
   '<p class="pg3-tip"><strong>Сравни:</strong> 四 sì (4) — нисходящий тон ↘, 十 shí (10) — восходящий ↗. Различай также начальные звуки s и sh.</p>')+
   '</div>');
}
function listenQuiz(step,arr){
 const finished=(state.phase[step]||0)>=arr.length;
 const idx=finished?arr.length-1:(state.phase[step]||0);
 const x=arr[idx];
 const answers=x.options.map(n=>'<button class="pg13-answer" type="button" data-answer="'+n+'" '+
  (finished||!state.heard||state.sounding?'disabled':'')+'><strong>'+((step===10||step===3)?n:chinese(n))+
  '</strong>'+(step===10||step===3?'':'<small>'+pinyin(n)+'</small>')+'</button>').join('');
 return mainCard('<div class="pg13-quiz-count">Вопрос '+(idx+1)+' из '+arr.length+'</div>'+
   heading(step===3?'Какое число звучит?':step===10?'Слушай и выбирай':'Выбери правильное число')+
   '<p class="pg3-muted pg3-center">Пока слушаешь, ответы заблокированы.</p>'+
   '<div class="pg13-audio-center">'+audioButton(x.n,'🔊 Прослушать')+'</div>'+
   '<div class="pg13-answers">'+answers+'</div>'+
   '<p class="pg13-hint">'+(finished?'✓ Задание пройдено. Нажми «Дальше».':state.sounding?'Сейчас звучит запись…':state.heard?'Теперь выбери ответ.':'Нажми «Прослушать».')+'</p>');
}
function writing(){
 const z=state.writing;
 return mainCard(heading('Письмо: 一, 二, 三')+
  '<p class="pg3-muted">Все черты сначала идут слева направо. В 二 и 三 верхняя черта пишется раньше нижней.</p>'+
  '<div class="pg3-char-buttons">'+['一','二','三'].map(x=>'<button type="button" class="'+(x===z?'active':'')+'" data-write-char="'+x+'">'+x+'</button>').join('')+'</div>'+
  '<div class="pg3-writing-square"><div id="pg3-writer" aria-label="Написание иероглифа '+z+'"></div></div>'+
  '<div class="pg3-write-buttons"><button type="button" data-animate>▶ Показать черты</button>'+
  '<button type="button" data-trace>✍️ Написать самому</button></div>'+
  '<p class="pg3-write-state" data-write-feedback>'+(state.written.includes(z)?'✓ Иероглиф уже написан.':'Посмотри анимацию, затем повтори пальцем.')+'</p>'+
  '<p class="pg3-muted pg3-center">Письмо — полезная, но необязательная тренировка.</p>','pg13-write-card');
}
function conceptCard(n){
 return '<div class="pg13-concept"><div class="pg13-big-cn" lang="zh-Hans">'+chinese(n)+'</div><div class="pg13-concept-py">'+pinyin(n)+'</div><div class="pg13-number-value">'+n+'</div>'+audioButton(n,'▶')+'</div>';
}
function rulePractice(step,arr){
 const idx=state.phase[step]||0;
 if(idx>=arr.length)return '';
 const obj=arr[idx];
 return mainCard(heading('Попробуй без подсказки: '+obj.n)+
  '<p class="pg3-muted">Как правильно написать число '+obj.n+'?</p>'+
  '<div class="pg13-answers">'+obj.options.map(n=>'<button data-rule-answer="'+n+'" type="button" class="pg13-answer">'+
    '<strong lang="zh-Hans">'+chinese(n)+'</strong><small>'+pinyin(n)+'</small></button>').join('')+'</div>','pg13-mini-practice');
}
function teen(){
 return mainCard(heading('Одно правило для всех 11–19')+
  '<div class="pg13-formula"><span>十</span><b>+</b><span>一 … 九</span><b>=</b><strong>11–19</strong></div>'+
  '<p>Десять <strong>十 shí</strong> + единицы. Для 11 не нужно ещё одно специальное слово.</p>'+
  '<div class="pg13-three-cards">'+[11,12,19].map(conceptCard).join('')+'</div>'+
  '<p class="pg3-tip">13 = 十三 (shí sān), 17 = 十七 (shí qī), 19 = 十九 (shí jiǔ).</p>')+
  rulePractice(5,TEEN);
}
function tens(){
 return mainCard(heading('Десятки: умножаем на десять')+
  '<p class="pg3-muted">二十 = 2 × 10 = 20. 三十 = 3 × 10 = 30. Аналогично до 90.</p>'+
  '<div class="pg13-tens-grid">'+TWENTIES.map(n=>'<div class="pg13-ten">'+conceptCard(n)+'</div>').join('')+'</div>'+
  '<p class="pg3-tip">Важно: 二十 читается <strong>èr shí</strong>, а не shí èr (это 12).</p>')+
  rulePractice(6,DECADES);
}
function generator(){
 const n=Math.min(99,Math.max(21,Number(state.generator)||36));
 return '<div class="pg13-generator"><label for="pg13-generate-number">Выбери любое число 21–99</label>'+
 '<div class="pg13-generator-controls"><input id="pg13-generate-number" type="number" min="21" max="99" inputmode="numeric" value="'+n+'">'+
 '<button type="button" data-generate>Показать →</button></div>'+
 '<div class="pg13-generator-result">'+n+' <span>→</span> <strong lang="zh-Hans">'+chinese(n)+'</strong>'+
 '<small>'+pinyin(n)+'</small></div>'+audioButton(n,'🔊 Слушать число')+
 '<p class="pg3-muted">Следи за тонами в пиньине.</p></div>';
}
function compound(){
 return mainCard(heading('Десятки + единицы = любое число 21–99')+
  '<div class="pg13-formula"><span>三十</span><b>+</b><span>六</span><b>=</b><strong>36</strong></div>'+
  '<p class="pg13-cn-example"><strong>三十六</strong><span>sān shí liù</span></p>'+
  '<div class="pg13-place-values"><div><strong>3</strong><small>десятка</small></div><b>+</b><div><strong>6</strong><small>единиц</small></div></div>'+
  '<p class="pg3-tip">Для 40, 50, 60… правило не меняется. Главное — порядок: десятки перед единицами.</p>')+
  mainCard(heading('Попробуй любое число')+generator())+
  rulePractice(7,COMPOUND);
}
function hundred(){
 return mainCard(heading('Две последние детали')+
  '<div class="pg13-three-cards">'+conceptCard(0)+conceptCard(100)+'</div>'+
  '<p class="pg3-tip"><strong>一百 — yì bǎi (100).</strong> Здесь 一 произносится четвёртым тоном. Нельзя воспроизводить изолированное yī вместо yì.</p>'+
  '<details class="pg13-optional"><summary>Дополнительно: 二 и 两 — оба «два»?</summary>'+
  '<p><strong>二 èr</strong> — при назывании числа 2 и в числах, например 二十 (20). '+
  '<strong>两 liǎng</strong> часто используют перед счётным словом: 两个人 (liǎng ge rén) — два человека. Пока запомни только разницу.</p></details>');
}
function builder(){
 const finished=(state.phase[9]||0)>=BUILD.length;
 const ix=finished?BUILD.length-1:(state.phase[9]||0),n=BUILD[ix];
 const correct=chinese(n).split('');
 const pool=correct.concat(n===90?['三']:['四']); // one distractor
 const placed=finished?chinese(n):(state.builder||[]).join('');
 const complete=placed===chinese(n);
 return mainCard('<div class="pg13-quiz-count">Число '+(ix+1)+' из '+BUILD.length+'</div>'+
  heading('Собери '+n+' по правилу десятков')+
  '<div class="pg13-builder-line">'+correct.map((_,i)=>'<div class="'+(finished||state.builder[i]?'filled':'')+'">'+(finished?correct[i]:(state.builder[i]||'＿'))+'</div>').join('')+'</div>'+
  '<div class="pg13-tiles">'+pool.map((z,i)=>'<button type="button" data-tile-index="'+i+'"'+(finished||state.used?.includes(i)?' disabled':'')+'>'+z+'</button>').join('')+'</div>'+
  '<div class="pg13-builder-buttons"><button data-clear-build type="button" '+(finished?'disabled':'')+'>↻ Сброс</button>'+
  '<button data-check-build type="button" '+(finished||(state.builder?.length||0)!==correct.length?'disabled':'')+'>Проверить</button></div>'+
  '<p class="pg3-muted">'+(finished?'✓ Число собрано. Нажми «Дальше».':state.wrong['build-'+ix]?'Подсказка: десятки ставим перед единицами.':'Подсказка появится только после ошибки.')+'</p>');
}
function context(){
 const finished=(state.phase[11]||0)>=CONTEXT.length;
 const idx=finished?CONTEXT.length-1:(state.phase[11]||0);
 const o=CONTEXT[idx];
 return mainCard('<div class="pg13-quiz-count">Ситуация '+(idx+1)+' из '+CONTEXT.length+'</div>'+
  heading(o.q)+'<div class="pg13-context-visual">'+o.visual+'</div>'+
  '<div class="pg13-answers">'+o.options.map(n=>'<button type="button" class="pg13-answer" data-context-answer="'+n+'" '+(finished?'disabled':'')+'>'+
    '<strong lang="zh-Hans">'+chinese(n)+'</strong><small>'+pinyin(n)+'</small></button>').join('')+'</div>'+
   (finished?'<p class="pg13-hint">✓ Задания выполнены. Нажми «Дальше».</p>':''));
}
function exam(){
 const finished=(state.phase[12]||0)>=EXAM.length;
 const idx=finished?EXAM.length-1:(state.phase[12]||0);
 const q=EXAM[idx];
 return mainCard('<div class="pg13-quiz-count">Задание '+(idx+1)+' из '+EXAM.length+'</div>'+
  heading(q.q)+
  (q.kind==='audio'?'<div class="pg13-audio-center">'+audioButton(q.n,'🔊 Слушать вопрос')+'</div>':'')+
  '<div class="pg13-answers">'+q.options.map(n=>'<button type="button" class="pg13-answer" data-exam-answer="'+n+'" '+(finished||q.kind==='audio'&&(!state.heard||state.sounding)?'disabled':'')+'>'+
   '<strong lang="'+(q.kind==='digit'?'ru':'zh-Hans')+'">'+(q.kind==='digit'?n:chinese(n))+'</strong>'+
   (q.kind==='digit'?'':'<small>'+pinyin(n)+'</small>')+'</button>').join('')+'</div>'+
  '<p class="pg13-hint">'+(finished?'✓ Проверка выполнена. Нажми «Дальше».':q.kind==='audio'?'Сначала прослушай аудио.':'Выбери один правильный ответ.')+'</p>');
}
function summary(){
 const score=Number(state.firstTry)||0,errors=Object.keys(state.wrong).filter(k=>k.startsWith('exam-'));
 return '<div class="pg13-congrats"><img src="./assets/lesson-success-v233.webp" alt="Панда поздравляет с завершением урока">'+
  '<h2>🎉 Урок 3 пройден!</h2><p>Теперь ты знаешь, как образуются любые целые числа от 0 до 100.</p></div>'+
  mainCard('<div class="pg13-score"><strong>'+score+' / '+EXAM.length+'</strong><span>правильно с первой попытки</span></div>'+
   (errors.length?'<p class="pg3-muted">Повторить стоит: '+errors.map(k=>chinese(EXAM[Number(k.split('-')[1])].n)).join(', ')+'.</p>':
   '<p class="pg3-muted">Отлично! Все ответы даны с первой попытки.</p>'))+
  mainCard(heading('🎧 Слушай числа и повторяй')+
   '<div class="pg13-recap">'+ITEMS.map(x=>'<button type="button" data-audio="'+x.n+'">'+x.z+'<small>'+x.py+'</small></button>').join('')+'</div>')+
  mainCard(heading('Проверим произвольное число')+generator())+
  '<div class="pg3-finish-links"><a class="primary" href="./hsk1-fourth-v214.html">Урок №4 →</a>'+
  '<a href="./hsk1-map.html">К карте HSK1</a><button type="button" data-restart>↻ Пройти урок №3 снова</button></div>';
}
const SCREENS=[intro,()=>study(1),()=>study(2),()=>listenQuiz(3,TONES),writing,teen,tens,compound,hundred,builder,()=>listenQuiz(10,HEAR),context,exam,summary];
function ready(){
 const s=state.step;
 if(s===1||s===2)return (state.viewed[s]||[]).length>=5;
 if(s===3)return state.phase[3]>=TONES.length;
 if(s===5)return state.phase[5]>=TEEN.length;
 if(s===6)return state.phase[6]>=DECADES.length;
 if(s===7)return state.phase[7]>=COMPOUND.length;
 if(s===9)return state.phase[9]>=BUILD.length;
 if(s===10)return state.phase[10]>=HEAR.length;
 if(s===11)return state.phase[11]>=CONTEXT.length;
 if(s===12)return state.phase[12]>=EXAM.length;
 return true;
}
function markComplete(){
 state.done=true;
 try{
  let previous=JSON.parse(localStorage.getItem(DONE)||'[]');
  if(!Array.isArray(previous))previous=[];
  if(!previous.includes('numbers'))previous.push('numbers');
  localStorage.setItem(DONE,JSON.stringify(previous));
 }catch{}
 save();
}
function refreshScreen(keepScroll=false){
 const top=scroll.scrollTop;
 cleanStop();stopWriter();
 const s=state.step;
 if(s===13&&!state.done)markComplete();
 state.maxStep=Math.max(state.maxStep,s);
 label.textContent=META[s][0];title.textContent=META[s][1];sub.textContent=META[s][2];
 counter.textContent=(s+1)+' из '+SCREENS.length;
 progress.setAttribute('aria-valuemax',String(SCREENS.length));
 progress.setAttribute('aria-valuenow',String(s+1));
 progressFill.style.width=((s+1)/SCREENS.length*100)+'%';
 root.innerHTML=SCREENS[s]();inform('');
 prev.disabled=s===0;
 next.hidden=s===13;
 next.disabled=!ready();
 next.textContent=s===0?'Начать урок →':s===12?'Завершить урок →':'Дальше →';
 if(s===4)setupWriter();
 if(keepScroll)scroll.scrollTop=top;else scroll.scrollTop=0;
 save();
}
function stepForward(){
 if(!ready()){inform('Сначала заверши задание на этом экране.','warn');return}
 if(state.step<13){state.step++;state.heard=false;refreshScreen();}
}
function chooseAnswer(key,idx,n,correct,detail,updateState=true){
 if(n!==correct){
  state.wrong[key]=(state.wrong[key]||0)+1;
  inform('Пока неверно. '+detail,'error');
  save();
  return false;
 }
 if(key.startsWith('exam-')&&!state.wrong[key])state.firstTry++;
 inform('✓ Правильно! '+detail,'success');
 if(updateState)state.phase[idx]=(state.phase[idx]||0)+1;
 state.heard=false;state.questionAnswered=true;state.passed[key]=true;
 save();return true;
}
function completeAction(step){
 const all={3:TONES.length,5:TEEN.length,6:DECADES.length,7:COMPOUND.length,9:BUILD.length,10:HEAR.length,11:CONTEXT.length,12:EXAM.length};
 if(state.phase[step]>=all[step]){
  state.step++;
  state.heard=false;refreshScreen();
 }else refreshScreen(true);
}
function setupWriter(){
 const elem=document.getElementById('pg3-writer');
 if(!elem||!window.HanziWriter)return;
 const z=state.writing,g=++writerId;
 try{
  writer=HanziWriter.create('pg3-writer',z,{
   width:Math.min(234,Math.max(145,elem.clientWidth||208)),
   height:Math.min(234,Math.max(145,elem.clientWidth||208)),
   padding:7,showCharacter:false,showOutline:true,
   strokeColor:'#85265e',drawingColor:'#a63f87',
   outlineColor:'#e6ce9e',highlightColor:'#db883a',
   strokeAnimationSpeed:1,delayBetweenStrokes:420,
   showHintAfterMisses:3,acceptBackwardsStrokes:false,
   charDataLoader:(character,onComplete,onError)=>{
    fetch('./assets/hanzi-data/'+encodeURIComponent(character)+'.json')
     .then(r=>{if(!r.ok)throw Error('No data');return r.json()})
     .then(data=>{if(g===writerId)onComplete(data)})
     .catch(err=>{if(g===writerId)onError(err)});
   }
  });
 }catch{inform('Пропись не загрузилась; можно продолжить урок.','warn')}
}
function writingInfo(text){const node=document.querySelector('[data-write-feedback]');if(node)node.textContent=text}
function handlePlay(n){
 if(state.step===3||state.step===10||state.step===12){
  // Gate audio-based question options until the SOUND ENDS, not only after press.
  play(n,success=>{
   if(!success)return;
   const buttons=root.querySelectorAll('[data-answer],[data-exam-answer]');
   const done=state.step===3?state.phase[3]>=TONES.length:state.step===10?state.phase[10]>=HEAR.length:state.step===12?state.phase[12]>=EXAM.length:false;
   if(!done){buttons.forEach(b=>b.disabled=false);inform('Теперь можно ответить.','success');}
  });
 }else play(n);
}
root.addEventListener('click',ev=>{
 const b=ev.target.closest('button');if(!b||b.disabled)return;
 const s=state.step;
 if(b.hasAttribute('data-study')){
  const n=Number(b.dataset.study);if(!Number.isInteger(n))return;
  state.selected[s]=n;
  // Paint selection without scrolling to top.
  root.querySelectorAll('[data-study]').forEach(el=>el.classList.toggle('active',Number(el.dataset.study)===n));
  root.querySelector('.pg13-focused-number').innerHTML=basic(n,RU[n]);
  const button=root.querySelector('.pg13-focused [data-audio]');if(button){button.dataset.audio=String(n);}
  play(n,success=>{
   if(!success)return;
   if(!state.viewed[s].includes(n))state.viewed[s].push(n);
   const card=root.querySelector('[data-study="'+n+'"]');if(card)card.classList.add('heard');
   next.disabled=!ready();
   save();
  });
  return;
 }
 if(b.hasAttribute('data-audio')){handlePlay(Number(b.dataset.audio));return}
 if(b.hasAttribute('data-write-char')){state.writing=b.dataset.writeChar;refreshScreen(true);return}
 if(b.hasAttribute('data-animate')){try{writer?.cancelQuiz?.();writer?.animateCharacter?.();writingInfo('Смотри движение каждой черты.')}catch{inform('Анимация недоступна.','warn')}return}
 if(b.hasAttribute('data-trace')){
  if(!writer){inform('Не удалось включить пропись.','warn');return}
  const active=state.writing,g=writerId;
  try{writer.cancelQuiz?.();writer.quiz({
   onCorrectStroke:info=>{if(g===writerId)writingInfo('Верно! Осталось '+info.strokesRemaining+' черт.')},
   onComplete:()=>{if(g!==writerId)return;if(!state.written.includes(active))state.written.push(active);save();writingInfo('✓ Ты написал '+active+' по порядку черт.')}
  })}catch{inform('Не удалось проверить написание.','warn')}
  return;
 }
 if(b.hasAttribute('data-answer')){
  const arr=s===3?TONES:HEAR;const i=state.phase[s],o=arr[i];
  if(!o||!state.heard||state.sounding)return;
  if(chooseAnswer(s+'-'+i,s,Number(b.dataset.answer),o.n,o.info||('Правильно: '+pretty(o.n))))completeAction(s);
  return;
 }
 if(b.hasAttribute('data-rule-answer')){
  const arr=s===5?TEEN:s===6?DECADES:COMPOUND,i=state.phase[s],o=arr[i];if(!o)return;
  const detail=s===5?'十 + единицы = '+o.n:s===6?'Количество десятков × 10 = '+o.n:'Десятки идут перед единицами.';
  if(chooseAnswer(s+'-'+i,s,Number(b.dataset.ruleAnswer),o.n,detail))completeAction(s);
  return;
 }
 if(b.hasAttribute('data-tile-index')){
  const i=Number(b.dataset.tileIndex);
  const n=BUILD[state.phase[9]],pool=chinese(n).split('').concat(n===90?['三']:['四']);
  if(!Number.isInteger(i)||state.used?.includes(i))return;
  state.used=Array.isArray(state.used)?state.used:[];
  state.used.push(i);state.builder.push(pool[i]);
  refreshScreen(true);return;
 }
 if(b.hasAttribute('data-clear-build')){state.builder=[];state.used=[];refreshScreen(true);return}
 if(b.hasAttribute('data-check-build')){
  const i=state.phase[9],n=BUILD[i];
  if(state.builder.join('')===chinese(n)){
   state.builder=[];state.used=[];state.phase[9]++;completeAction(9);
  }else{
   state.wrong['build-'+i]=(state.wrong['build-'+i]||0)+1;
   state.builder=[];state.used=[];refreshScreen(true);
   inform('Попробуй снова: сначала десятки, после них единицы.','error');
  }return;
 }
 if(b.hasAttribute('data-context-answer')){
  const i=state.phase[11],o=CONTEXT[i];if(!o)return;
  if(chooseAnswer('context-'+i,11,Number(b.dataset.contextAnswer),o.n,'Здесь количество '+o.n+'.'))completeAction(11);
  return;
 }
 if(b.hasAttribute('data-exam-answer')){
  const i=state.phase[12],o=EXAM[i];if(!o||o.kind==='audio'&&(!state.heard||state.sounding))return;
  if(chooseAnswer('exam-'+i,12,Number(b.dataset.examAnswer),o.n,o.explain))completeAction(12);
  return;
 }
 if(b.hasAttribute('data-generate')){
  const field=document.getElementById('pg13-generate-number');
  const n=Number(field?.value);
  if(!Number.isInteger(n)||n<21||n>99){inform('Введи целое число от 21 до 99.','error');return}
  state.generator=n;
  refreshScreen(true);return;
 }
 if(b.hasAttribute('data-replay-quiz')||b.hasAttribute('data-review-rule')){
  const n=Number(b.dataset.replayQuiz||b.dataset.reviewRule);
  state.phase[n]=0;state.heard=false;refreshScreen(true);return;
 }
 if(b.hasAttribute('data-reset-build')){state.phase[9]=0;state.builder=[];state.used=[];refreshScreen(true);return}
 if(b.hasAttribute('data-replay-context')){state.phase[11]=0;refreshScreen(true);return}
 if(b.hasAttribute('data-restart')){const keepDone=state.done;state=fresh();state.legacyCompleted=keepDone;refreshScreen();return}
});
prev.addEventListener('click',()=>{if(state.step>0){state.step--;state.heard=false;refreshScreen();}});
next.addEventListener('click',stepForward);
window.addEventListener('pagehide',()=>{cleanStop();stopWriter()});
refreshScreen();
})();
