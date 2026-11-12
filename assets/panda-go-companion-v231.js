/* Panda Go HSK1 · lessons 6 and 7 · approved 14-screen pastel learning experience v231.
 * Original HSK1 curriculum and licensed voices; old seven-step saved progress is untouched.
 * No voice cloning, fabricated tone accuracy or automatic recording evaluation.
 */
(()=>{
'use strict';
const shell=document.querySelector('.app[data-lesson]');
if(!shell)return;
const lesson=Number(shell.dataset.lesson);
const topic=(window.PANDA_HSK1_FOUNDATIONS||[]).find(t=>t.id===(lesson===6?'family':'weather'));
if(!topic)return;
const isFamily=lesson===6,TOPIC=topic.id,TOTAL=14;
const stage=document.getElementById('pg5-stage'),prev=document.getElementById('pg5-prev'),next=document.getElementById('pg5-next');
const title=document.getElementById('pg5-title'),sub=document.getElementById('pg5-subtitle'),label=document.getElementById('pg5-kicker');
const count=document.getElementById('pg5-count'),bar=document.getElementById('pg5-fill'),scroll=document.getElementById('pg5-scroll'),notice=document.getElementById('pg5-status');
if(!stage||!prev||!next||!title)return;
const KEY='pg-hsk1-l'+lesson+'-v231',LEGACY='pg-hsk1-v3-'+TOPIC,DONE='pg-hsk1-v3-complete';
const words=topic.words.slice();
const grandparents=Object.freeze([
 ['爷爷','yéye','дедушка по отцу','yeye'],
 ['奶奶','nǎinai','бабушка по отцу','nainai'],
 ['外公','wàigōng','дедушка по матери','waigong'],
 ['外婆','wàipó','бабушка по матери','waipo']
]);
const grandparentExamples=Object.freeze([
 ['这是我爷爷。','Zhè shì wǒ yéye.','Это мой дедушка по отцу.'],
 ['这是我奶奶。','Zhè shì wǒ nǎinai.','Это моя бабушка по отцу.'],
 ['这是我外公。','Zhè shì wǒ wàigōng.','Это мой дедушка по матери.'],
 ['这是我外婆。','Zhè shì wǒ wàipó.','Это моя бабушка по матери.']
]);
const titles=isFamily?[
 ['УРОК 6 · HSK1','Моя семья','Назови родных людей по-китайски'],
 ['НОВЫЕ СЛОВА','Родители, бабушки и дедушки','Семья по отцовской и материнской линии'],
 ['НОВЫЕ СЛОВА','Братья, сёстры и семья','Старшие, младшие и слово 家'],
 ['НОВЫЕ СЛОВА','Мой, есть и нет','Научись говорить, кто у тебя есть'],
 ['ПРОИЗНОШЕНИЕ','Четыре тона: mā, má, mǎ, mà','Слушай и различай настоящие китайские тоны'],
 ['ПРАВИЛО','Старший и младший','Возраст родственника важен в китайских словах'],
 ['ПРАВИЛО','Мой, есть и нет','我的 · 有 · 没有'],
 ['СЛОВА И ПРИМЕРЫ','Расскажи о семье','Повтори знакомые предложения'],
 ['ДИАЛОГ','Это твоя мама?','Четыре короткие реплики'],
 ['АУДИОПРАКТИКА','Услышь правильный тон','Слушай и выбирай иероглиф'],
 ['КОНСТРУКТОР','Собери предложение','Расскажи, кто есть в семье'],
 ['ПРОПИСЬ','Напиши 家','Тренируй порядок черт'],
 ['ГОВОРИ САМ','Расскажи о семье','Повторяй и сравнивай свой голос'],
 ['ПОВТОРЕНИЕ','Отлично! Моя семья','Закрепляем важные слова']
]:[
 ['УРОК 7 · HSK1','Погода','Научись описывать погоду и времена года'],
 ['НОВЫЕ СЛОВА','Какая погода?','Погода, холодно, жарко, солнечно'],
 ['НОВЫЕ СЛОВА','Осадки и ветер','Облачно, дождь, снег, ветер'],
 ['ДОПОЛНИТЕЛЬНО','Времена года','Послушай четыре слова — учить их наизусть пока необязательно'],
 ['ПРОИЗНОШЕНИЕ','Тоны погоды','Слушай важные сочетания'],
 ['ПРАВИЛО','Сегодня холодно','今天很冷 — без 是'],
 ['ПРАВИЛО','Дождь и вопрос о погоде','下雨 и 怎么样'],
 ['СЛОВА И ПРИМЕРЫ','Учимся о погоде','Повтори короткие предложения'],
 ['ДИАЛОГ','Какая сегодня погода?','Четыре короткие реплики'],
 ['АУДИОПРАКТИКА','Услышь слово','Слушай и выбирай значение'],
 ['КОНСТРУКТОР','Собери прогноз','Составляй фразы о погоде'],
 ['ПРОПИСЬ','Напиши 天','Тренируй порядок черт'],
 ['ГОВОРИ САМ','Скажи о погоде','Сравни свой голос с образцом'],
 ['ПОВТОРЕНИЕ','Отлично! Погода','Закрепляем полезные слова']
];
const listening=(topic.listen?.items||[]).slice(0,4);
const builds=(topic.builds||[topic.build]).slice(0,3);
const defaultState=()=>({step:0,maxStep:0,listen:0,built:0,chosen:[],used:[],quizPassed:false,done:false});
let state=defaultState();
try{
 const raw=JSON.parse(localStorage.getItem(KEY)||'null');
 if(raw&&typeof raw==='object'){
  state.step=Number.isInteger(raw.step)?Math.min(13,Math.max(0,raw.step)):0;
  state.maxStep=Number.isInteger(raw.maxStep)?Math.min(13,Math.max(state.step,raw.maxStep)):state.step;
  state.listen=Number.isInteger(raw.listen)?Math.min(listening.length,Math.max(0,raw.listen)):0;
  state.built=Number.isInteger(raw.built)?Math.min(builds.length,Math.max(0,raw.built)):0;
  state.chosen=Array.isArray(raw.chosen)?raw.chosen.filter(x=>typeof x==='string').slice(0,5):[];
  state.used=Array.isArray(raw.used)?raw.used.filter(Number.isInteger).slice(0,5):[];
  state.quizPassed=raw.quizPassed===true;state.done=raw.done===true;
 }else{
  const prior=JSON.parse(localStorage.getItem(LEGACY)||'null');
  const completed=Array.isArray(JSON.parse(localStorage.getItem(DONE)||'[]'))&&JSON.parse(localStorage.getItem(DONE)||'[]').includes(TOPIC);
  // Preserve old progress in its original key, and never falsely skip new lessons.
  if(completed||prior?.completed===true){state.done=true;state.quizPassed=true}
 }
}catch{}
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let audio=null,serial=0,writer=null,media=null,stream=null,micUrl=null,chunks=[],listenReady=false;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
function done(){
 state.done=true;state.quizPassed=true;save();
 try{
  const old=JSON.parse(localStorage.getItem(DONE)||'[]');const arr=Array.isArray(old)?old:[];
  if(!arr.includes(TOPIC))arr.push(TOPIC);
  localStorage.setItem(DONE,JSON.stringify(arr));
 }catch{}
}
function say(message,kind=''){notice.textContent=message;notice.className='result '+kind;notice.hidden=!message}
function stopAudio(){serial++;try{audio?.pause();audio.currentTime=0}catch{}audio=null;stage.querySelectorAll('[aria-busy]').forEach(b=>b.removeAttribute('aria-busy'))}
const mappings=window.PANDA_HSK1_VOICES||{},human=window.PANDA_HSK1_NATIVE_HUMAN_V167||{};
/* v247: Lesson 7 prefers original authorized female speaker recordings.
 * Do not fall back to synthetic voices. Lesson 6 remains unchanged.
 */
function familyOriginalParts(hz,role='female'){
 if(!isFamily||role!=='female')return null;
 const pair=hz==='是，这是我妈妈。'?['是','这是我妈妈。']:
            hz==='有，我有一个妹妹。'?['有','我有一个妹妹。']:null;
 if(!pair)return null;
 const parts=pair.map(x=>window.PandaOwnerAudio?.lookup(x)||null);
 return parts.every(Boolean)?parts:null;
}
function weatherClips(hz){
 if(isFamily)return null;
 // Lesson 7: only the approved Xiaoxiao clips. Do not mix earlier voices.
 const updated=window.PandaLesson7XiaoxiaoV277?.lookup(hz);
 return updated?[updated]:[];
}
function resolve(hz,role='female'){
 if(!isFamily){
  if(role==='male'){const plain=String(hz).replace(/[。！？!?]\s*$/,'');return mappings.male?.[hz]||mappings.male?.[plain]||null;}
  return weatherClips(hz)[0]||null;
 }
 // Preserve the original male actor: never substitute Xiaoxiao for male role A.
 if(role==='male'){const bare=String(hz).replace(/[。！？!?]\s*$/,'');return mappings.male?.[hz]||mappings.male?.[bare]||null;}
 const newlyRecorded=window.PandaLesson6GrandparentsV275?.lookup(hz)||window.PandaLesson6XiaoxiaoV274?.lookup(hz);
 if(newlyRecorded)return newlyRecorded;
 const plain=String(hz).replace(/[。！？!?]\s*$/,'');
 const composed=familyOriginalParts(hz,role);if(composed)return composed[0];
 const original=role==='female'&&window.PandaOwnerAudio?.lookup(hz);if(original)return original;
 if(role==='male')return mappings.male?.[hz]||mappings.male?.[plain]||null;
 const f=mappings.female||{};
 const primary=f[hz]||f[plain]||null;
 const owner=typeof primary==='string'&&(primary.startsWith('data:audio/mpeg;base64,')||primary.includes('native-owner-v200/'))?primary:null;
 return owner||human[hz]||human[plain]||primary||
  (window.courseNaturalAudio||{})[hz]||(window.courseNaturalAudio||{})[plain]||
  (window.courseHumanAudio||{})[hz]||null;
}
function play(hz,role='female',onComplete=null){
 if(media?.state==='recording'){say('Останови запись перед прослушиванием образца.','bad');onComplete?.(false);return}
 const src=resolve(hz,role);
 if(!src){say('Для этой фразы пока нет доступной записи.','bad');onComplete?.(false);return}
 stopAudio();const token=serial;
 const lesson6New=isFamily&&role!=='male'&&!!(window.PandaLesson6GrandparentsV275?.lookup(hz)||window.PandaLesson6XiaoxiaoV274?.lookup(hz));
 const parts=isFamily?(lesson6New?[src]:(familyOriginalParts(hz,role)||[src])):(role==='male'?[src]:weatherClips(hz));
 const button=[...stage.querySelectorAll('[data-play]')].find(x=>x.dataset.play===hz);
 button?.setAttribute('aria-busy','true');
 let index=0;
 function playNext(){
  if(token!==serial)return;
  const clip=parts[index++];
  if(!clip){audio=null;button?.removeAttribute('aria-busy');onComplete?.(true);return}
  try{
   const a=new Audio(window.PandaAudioLevel?.[clip]||clip);audio=a;a.preload='auto';a.preservesPitch=true;const newWeather=!isFamily&&clip.includes('lesson7-xiaoxiao-v277/')||!isFamily&&clip.includes('lesson4-xiaoxiao-v265/');a.playbackRate=(isFamily||newWeather||role==='male')?1:0.85; // preserve original tempo for Xiaoxiao and male actor
   if(!isFamily && !newWeather && !clip.includes('panda-native-clean-v249/') && (clip.startsWith('data:audio/')||window.PandaLessonAudioV240?.isPriority?.(hz)))window.PandaLessonAudioV240?.improve?.(a,'weather',hz);
   a.onended=()=>{if(token!==serial)return;playNext()};
   a.onerror=()=>{if(token!==serial)return;audio=null;button?.removeAttribute('aria-busy');say('Аудио не загрузилось. Попробуй снова.','bad');onComplete?.(false)};
   Promise.resolve(a.play()).catch(()=>{if(token===serial){audio=null;button?.removeAttribute('aria-busy');say('Нажми кнопку звука ещё раз.','bad');onComplete?.(false)}});
  }catch{if(token===serial){audio=null;button?.removeAttribute('aria-busy');say('Не удалось включить звук.','bad');onComplete?.(false)}}
 }
 playNext();
}
function playBtn(hz,role='female'){
 const available=!!resolve(hz,role);
 return '<button type="button" class="audio" data-play="'+esc(hz)+'" data-role="'+role+'"'+(!available?' disabled title="Запись пока отсутствует"':'')+' aria-label="'+(available?'Слушать ':'Нет записи: ')+esc(hz)+'">🔊</button>';
}
const symbols=isFamily?{'妈妈':'👩','爸爸':'👨','哥哥':'👦','姐姐':'👩‍🎓','弟弟':'🧒','妹妹':'👧','家':'🏠','我的':'💗','有':'✅','没有':'❌','一个':'☝️'}:{'天气':'🌤️','冷':'❄️','热':'☀️','晴':'🌞','阴':'☁️','下雨':'🌧️','下雪':'🌨️','风':'💨','春天':'🌸','夏天':'🌻','秋天':'🍁','冬天':'⛄'};
function word(w){
 const icon=symbols[w[0]]||'🌸';
 return '<div class="word"><div><small class="word-emoji" aria-hidden="true">'+icon+'</small><strong lang="zh-Hans">'+esc(w[0])+'</strong><span class="py">'+esc(w[1])+'</span><span class="ru">'+esc(w[2])+'</span></div>'+playBtn(w[0])+'</div>';
}
function card(body,cls=''){return '<section class="card '+cls+'">'+body+'</section>'}
function cover(){
 const lead=isFamily?'Узнай, как называют родных людей по-китайски!':'Научись говорить о погоде на китайском!';
 const chips=isFamily?[['妈妈','мама'],['爸爸','папа'],['妹妹','младшая сестра']]:[['晴','ясно'],['下雨','дождь'],['下雪','снег']];
 return '<div class="intro"><div class="intro-copy"><span class="pg5-kicker">HSK 1 · УРОК '+lesson+'</span><strong>'+esc(topic.name)+'</strong><p>'+lead+'</p></div><div class="intro-art" role="img" aria-label="Панда Panda Go в наушниках"></div></div>'+
 '<div class="cover-milestones">'+chips.map(([zh,ru])=>'<div><strong lang="zh-Hans">'+zh+'</strong><small>'+ru+'</small></div>').join('')+'</div>'+
 '<p class="cover-caption">'+(isFamily?'11 слов · семья · диалоги и практика':'12 слов · погода · времена года')+'</p>'+
 '<div class="cover-note">🌸 <strong>'+(isFamily?'我的家 · 我有一个妹妹。':'今天天气怎么样？')+'</strong></div>';
}
// Keep paternal portraits from v276, but load the corrected maternal portraits from v277.
function grandparentPhoto(slug){
 return './assets/lesson6-photos-'+((slug==='waigong'||slug==='waipo')?'v277':'v276')+'/'+slug+'.webp';
}
function grandparentCards(){
 return '<h2 class="pg6-grandparents-heading">Бабушки и дедушки</h2>'+
 '<p class="pg6-grandparents-hint">Слова по папиной и маминой линии отличаются.</p>'+
 '<div class="pg6-grandparents-grid">'+grandparents.map(([hz,py,ru,slug],i)=>
 '<div class="pg6-grandparent-card" data-grandparent="'+esc(hz)+'">'+
 '<img class="pg6-grandparent-photo" src="'+grandparentPhoto(slug)+'" width="390" height="390" loading="eager" decoding="async" alt="Портрет: '+esc(ru)+'">'+
 '<span class="pg6-grandparent-side">'+(i<2?'По папиной линии':'По маминой линии')+'</span>'+
 '<strong lang="zh-Hans">'+esc(hz)+'</strong><span class="py">'+esc(py)+'</span>'+
 '<span class="ru">'+esc(ru)+'</span>'+playBtn(hz)+'</div>').join('')+'</div>';
}
function familyParentsAndGrandparents(){
 return card('<h2>Мама и папа</h2><div class="grid two">'+words.slice(0,2).map(word).join('')+
 '</div>'+grandparentCards())+
 '<p class="small center">По-китайски родственников по маминой и папиной линии называют разными словами.</p>';
}
function vocab(slice,optional=false){return card('<div class="grid two">'+words.slice(...slice).map(word).join('')+'</div>')+
 '<p class="small center">'+(optional?'Дополнительные слова: послушай времена года. Запоминать все четыре сейчас необязательно.':'🔊 Нажимай на значок и повторяй слова вслух.')+'</p>'}
function tone(){
 const examples=isFamily?['妈','麻','马','骂']:['天气','冷','热','下雨'];
 const meaning=isFamily?['mā · первый','má · второй','mǎ · третий','mà · четвёртый']:['tiānqì · 1-й, 4-й','lěng · третий','rè · четвёртый','xià yǔ · 4-й, 3-й'];
 return card('<h2>Слушай и повторяй</h2><div class="grid two">'+examples.map((z,i)=>
 '<div class="example"><strong lang="zh-Hans">'+esc(z)+'</strong><span class="ru">'+esc(meaning[i])+'</span><div class="buttons">'+playBtn(z)+'</div></div>').join('')+'</div>')+
 card('<h2>Обрати внимание</h2>'+topic.pronunciation.map(x=>'<div class="rule-card">'+esc(x)+'</div>').join(''));
}
function rule(range){
 return topic.rules.slice(...range).map(([head,ex,hz,py,ru])=>
  card('<h2>'+esc(head)+'</h2><div class="rule-card">'+esc(ex)+'</div>'+
  '<div class="example"><strong lang="zh-Hans">'+esc(hz)+'</strong><span class="py">'+esc(py)+'</span><span class="ru">'+esc(ru)+'</span><div class="buttons">'+playBtn(hz)+'</div></div>')).join('');
}
function examples(){
 const a=isFamily?[
 ['我有一个妹妹。','Wǒ yǒu yí ge mèimei.','У меня есть младшая сестра.'],
 ['这是我爸爸。','Zhè shì wǒ bàba.','Это мой папа.'],
 ['我没有哥哥。','Wǒ méiyǒu gēge.','У меня нет старшего брата.']
 ]:[
 ['今天很冷。','Jīntiān hěn lěng.','Сегодня холодно.'],
 ['明天下雨。','Míngtiān xià yǔ.','Завтра будет дождь.'],
 ['今天天气怎么样？','Jīntiān tiānqì zěnmeyàng?','Какая сегодня погода?']
 ];
 return card('<h2>Слушай короткие фразы</h2>'+a.map(([zh,py,ru])=>
  '<div class="example"><strong lang="zh-Hans">'+esc(zh)+'</strong><span class="py">'+esc(py)+'</span><span class="ru">'+esc(ru)+'</span><div class="buttons">'+playBtn(zh)+'</div></div>').join('')+
  (isFamily?'<h2 class="pg6-grandparents-heading">Представляем бабушек и дедушек</h2>'+
  '<div class="pg6-grandparent-examples">'+grandparentExamples.map(([zh,py,ru],i)=>
  '<div class="pg6-grandparent-phrase">'+
  '<img class="pg6-phrase-photo" src="'+grandparentPhoto(grandparents[i][3])+'" width="390" height="390" loading="lazy" decoding="async" alt="'+esc(grandparents[i][2])+'">'+
  '<div class="pg6-phrase-copy"><strong lang="zh-Hans">'+esc(zh)+'</strong>'+
  '<span class="py">'+esc(py)+'</span><span class="ru">'+esc(ru)+'</span></div>'+playBtn(zh)+'</div>').join('')+'</div>':''));
}
function dialogue(){
 return card('<h2>Послушай разговор</h2><div class="dialogue">'+topic.dialogue.map(([who,zh,py,ru])=>
 '<div class="bubble"><span class="small">'+(who==='А'?'А':'Б')+'</span><strong lang="zh-Hans">'+esc(zh)+'</strong><small>'+esc(py)+'</small><span class="ru">'+esc(ru)+'</span>'+playBtn(zh,who==='А'?'male':'female')+'</div>').join('')+'</div>');
}
function listen(){
 const i=state.listen,finished=i>=listening.length,item=listening[Math.min(i,listening.length-1)];
 const choices=listening.map(([zh,ru])=>[zh,ru]);
 return card('<h2>Слушай и выбирай</h2><p class="small center">Задание '+Math.min(i+1,listening.length)+' из '+listening.length+'</p>'+
 '<div class="buttons">'+playBtn(item[0])+'</div>'+
 '<div class="grid two">'+choices.map(([zh,ru])=>'<button type="button" class="card-choice" data-listen="'+esc(zh)+'"'+(finished||!listenReady?' disabled':'')+'><strong lang="zh-Hans">'+esc(zh)+'</strong><small>'+esc(ru)+'</small></button>').join('')+'</div>'+
 (finished?'<p class="result good">✓ Все ответы верны! Можешь пройти снова.</p><div class="buttons"><button class="soft primary" type="button" data-repeat-listen>↻ Пройти заново</button></div>':'<p class="small center" id="pg67-listen-hint">'+(listenReady?'Выбирай ответ, можно переслушать.':'Нажми 🔊, чтобы включить звук и открыть ответы.')+'</p>'));
}
function builder(){
 const i=state.built,finished=i>=builds.length,rule=builds[Math.min(i,builds.length-1)];
 if(!rule)return card('<p>Задания завершены!</p>');
 const pieces=rule.target;
 const chosen=state.chosen;
 return card('<h2>'+esc(rule.prompt)+'</h2><p class="small center">Фраза '+Math.min(i+1,builds.length)+' из '+builds.length+'</p>'+
 '<div class="assemble">'+pieces.map((_,j)=>'<div class="unit" style="display:grid;place-items:center">'+esc(chosen[j]||'＿')+'</div>').join('')+'</div>'+
 '<div class="assemble">'+pieces.map((_,j)=>{const idx=(j+Math.ceil(pieces.length/2))%pieces.length;return '<button type="button" class="unit" data-piece="'+idx+'"'+(finished||state.used.includes(idx)?' disabled':'')+'>'+esc(pieces[idx])+'</button>'}).join('')+'</div>'+
 (finished?'<div class="buttons"><button type="button" class="soft primary" data-repeat-builder>↻ Пройти заново</button></div>':'<div class="buttons"><button type="button" class="soft" data-clear>Сброс</button><button type="button" class="soft primary" data-check>Проверить</button></div>')+
 (finished?'<p class="result good">✓ Ты составил три предложения! Можешь повторить, не теряя прогресс урока.</p>':'<p class="small center">Нажми на слова в правильном порядке.</p>'));
}
function writing(){
 const char=isFamily?'家':'天';
 return card('<h2>Пропись '+char+'</h2><div class="write-grid"><div id="writer" role="img" aria-label="Порядок черт иероглифа '+char+'"></div></div>'+
 '<div class="buttons"><button type="button" class="soft" data-animate>▶ Показать черты</button><button type="button" class="soft primary" data-write>✍️ Написать самому</button></div>'+
 '<p class="small center">Задание на пропись необязательное. Нажми «Дальше», когда готов.</p>');
}
function speaking(){
 const z=topic.speech;
 return card('<h2>Повтори вслух</h2><div class="speech-card"><strong lang="zh-Hans">'+esc(z.hz)+'</strong><p>'+esc(z.py)+'</p><p>'+esc(z.ru)+'</p></div>'+
 '<div class="buttons">'+playBtn(z.hz)+'<button type="button" class="soft" data-record>🎙 Записать</button><button type="button" class="soft" data-stop disabled>■ Стоп</button><button type="button" class="soft" data-replay disabled>▶ Оригинал</button><button type="button" class="soft" data-replay-filter disabled>✨ С фильтром</button></div>'+
 '<p class="small center">Во время записи образец останавливается, чтобы уменьшить эхо. Если эхо остаётся, надень наушники. Автоматической проверки тонов здесь нет.</p>')+
 card('<div class="rule-card">'+esc(z.tip||'Повтори фразу вслух.')+'</div>');
}
function summary(){
 const c=topic.quiz;
 return '<div class="intro"><div class="intro-copy"><span class="pg5-kicker">HSK 1 · УРОК '+lesson+'</span><strong>Отлично! 🌸</strong><p>'+(isFamily?'Ты научился говорить о своей семье.':'Ты научился говорить о погоде.')+'</p></div><div class="intro-art" role="img" aria-label="Панда поздравляет"></div></div>'+
 card('<h2>Последняя проверка</h2><p>'+esc(c.question)+'</p><div class="grid">'+c.choices.map((answer,i)=>
 '<button type="button" class="card-choice '+(state.quizPassed&&i===c.correct?'correct':'')+'" data-final="'+i+'"'+(state.quizPassed?' disabled':'')+'>'+esc(answer)+'</button>').join('')+'</div>'+
 (state.quizPassed?'<p class="result good">✓ Верно! Можно завершить урок.</p>':'<p class="small center">Выбери правильный ответ, чтобы завершить урок.</p>'))+
 card('<h2>Повторение</h2><div class="grid two">'+(isFamily?words.slice(0,4):[words[0],words[1],words[5],words[6]]).map(word).join('')+
 '</div>'+(isFamily?'<h2 class="pg6-grandparents-heading">Бабушки и дедушки</h2>'+
 '<div class="pg6-grandparent-review">'+grandparents.map(([zh,py,ru,slug])=>
 '<div><img class="pg6-review-photo" src="'+grandparentPhoto(slug)+'" width="390" height="390" loading="lazy" decoding="async" alt="'+esc(ru)+'">'+
 '<span class="pg6-review-copy"><b lang="zh-Hans">'+esc(zh)+'</b><small>'+esc(py)+' · '+esc(ru)+'</small></span>'+playBtn(zh)+'</div>').join('')+'</div>':''))+
 (state.done?'<div class="pg-lesson-complete-actions"><button type="button" class="pg-end-repeat" data-restart-lesson>↻ Повторить урок</button><a class="pg-end-next" href="'+(isFamily?'./hsk1-weather-v231.html':'./hsk1-diagnostic.html')+'">'+(isFamily?'Следующий урок →':'Итоговый тест HSK 1 →')+'</a><a class="pg-end-back" href="./hsk1-map.html">Назад к Урокам</a></div>':'');
}
const screens=[
 cover,
 ()=>isFamily?familyParentsAndGrandparents():vocab([0,4]),
 ()=>isFamily?vocab([2,7]):vocab([4,8]),
 ()=>isFamily?vocab([7,11]):vocab([8,12],!isFamily),
 tone,
 ()=>rule([0,1]),
 ()=>rule([1,4]),
 examples,
 dialogue,
 listen,
 builder,
 writing,
 speaking,
 summary
];
function stopWriter(){try{writer?.cancelQuiz?.();writer?.pauseAnimation?.()}catch{}writer=null}
function prepareWriter(){
 const el=document.getElementById('writer');if(!el)return;
 const ch=isFamily?'家':'天';
 if(!window.HanziWriter){el.textContent=ch;el.style.fontSize='87px';return}
 try{
  writer=window.HanziWriter.create('writer',ch,{width:220,height:220,padding:12,showOutline:true,showCharacter:false,
   strokeColor:'#795aa2',outlineColor:'#dfd0e8',highlightColor:'#df9ac9',drawingColor:'#a273c0',
   delayBetweenStrokes:240,strokeAnimationSpeed:1.15,acceptBackwardsStrokes:false});
  writer.animateCharacter();
 }catch{el.textContent=ch;el.style.fontSize='87px'}
}
function refresh(){
 if(media?.state==='recording')media.stop();
 stopAudio();stopWriter();listenReady=false;const n=state.step;
 shell.dataset.step=String(n);state.maxStep=Math.max(state.maxStep,n);
 const [k,h,d]=titles[n];label.textContent=k;title.textContent=h;sub.textContent=d;
 document.title='Урок '+lesson+' · '+h+' — Panda Go';
 count.textContent=(n+1)+' из '+TOTAL;bar.style.width=((n+1)/TOTAL*100)+'%';
 stage.innerHTML=screens[n]();window.PandaLessonVisuals?.decorate(stage,lesson,n);say('');
 prev.disabled=n===0;
 next.disabled=(n===9&&state.listen<listening.length)||(n===10&&state.built<builds.length)||(n===13&&!state.quizPassed);
 next.textContent=n===0?'Начать урок →':n===13?'✓ Завершить урок':'Дальше →';
 scroll.scrollTop=0;save();recorderButtons();
 if(n===11)prepareWriter();
}
function advance(dir){
 if(dir===1&&next.disabled)return;
 if(dir<0&&state.step===0)return;
 if(dir===1&&state.step===13){done();location.assign(lesson===6?'./hsk1-weather-v231.html':'./hsk1-map.html');return}
 state.step=Math.min(13,Math.max(0,state.step+dir));refresh();
}
function recorderButtons(){
 const start=stage.querySelector('[data-record]'),stop=stage.querySelector('[data-stop]'),replay=stage.querySelector('[data-replay]'),filtered=stage.querySelector('[data-replay-filter]');
 if(start)start.disabled=media?.state==='recording';
 if(stop)stop.disabled=media?.state!=='recording';
 if(replay)replay.disabled=!micUrl;
 if(filtered)filtered.disabled=!micUrl;
}
async function record(){
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){say('Микрофон не поддерживается этим браузером.','bad');return}
 try{
  if(media?.state==='recording')return;
  stopAudio();
  await new Promise(resolve=>setTimeout(resolve,180));
  if(state.step!==12)return;
  stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:{ideal:true},noiseSuppression:{ideal:true},autoGainControl:{ideal:true},channelCount:{ideal:1}}});
  chunks=[];media=new MediaRecorder(stream);
  media.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
  media.onstop=()=>{
   if(micUrl)URL.revokeObjectURL(micUrl);
   if(chunks.length){const raw=new Blob(chunks,{type:media.mimeType||'audio/webm'});micUrl=URL.createObjectURL(raw);window.PANDA_MIC_V236?.enhance?.(raw,micUrl,()=>micUrl,url=>{micUrl=url})}else micUrl=null;
   stream?.getTracks().forEach(t=>t.stop());stream=null;
   recorderButtons();say(micUrl?'Запись готова. Послушай свой голос.':'Пустая запись.',micUrl?'good':'bad');
  };
  media.start();recorderButtons();say('Запись идёт…');
 }catch{say('Разреши доступ к микрофону и попробуй снова.','bad')}
}
stage.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.hasAttribute('data-play')){
  const question=state.step===9&&listening[state.listen]?.[0]===b.dataset.play;
  if(question){
   listenReady=true;
   stage.querySelectorAll('[data-listen]').forEach(el=>el.disabled=false);
   const h=stage.querySelector('#pg67-listen-hint');if(h)h.textContent='Слушай и выбирай. Можно переслушать.';
   play(b.dataset.play,b.dataset.role||'female');
  }else play(b.dataset.play,b.dataset.role||'female');
  return;
 }
 if(b.hasAttribute('data-restart-lesson')){
  // Keep achievements in pg-hsk1-v3-complete and start a fresh local attempt.
  stopAudio();stopWriter();if(media?.state==='recording')media.stop();
  if(micUrl){URL.revokeObjectURL(micUrl);micUrl=null}
  state=defaultState();save();refresh();return;
 }
 if(b.hasAttribute('data-repeat-listen')){state.listen=0;listenReady=false;save();refresh();say('Аудирование начато заново.','good');return}
 if(b.hasAttribute('data-listen')){
  const item=listening[state.listen];
  if(!listenReady)return;
  if(item&&b.dataset.listen===item[0]){state.listen++;save();refresh();say('✓ Верно!','good')}
  else say('Пока неверно. Прослушай ещё раз.','bad');
  return;
 }
 if(b.hasAttribute('data-piece')){
  const i=Number(b.dataset.piece),pieces=builds[state.built]?.target||[];
  if(!Number.isInteger(i)||state.used.includes(i)||state.chosen.length>=pieces.length)return;
  state.used.push(i);state.chosen.push(pieces[i]);save();refresh();return;
 }
 if(b.hasAttribute('data-repeat-builder')){
  // Repeat all three phrases without deleting course completion or later progress.
  state.built=0;state.chosen=[];state.used=[];save();refresh();
  say('Начинаем заново: собери первую фразу.','good');return;
 }
 if(b.hasAttribute('data-clear')){state.chosen=[];state.used=[];save();refresh();return}
 if(b.hasAttribute('data-check')){
  const item=builds[state.built];if(!item)return;
  if(state.chosen.join('')===item.target.join('')){
   state.built++;state.chosen=[];state.used=[];save();refresh();say('✓ Правильно!','good');
  }else say('Проверь порядок слов.','bad');
  return;
 }
 if(b.hasAttribute('data-animate')){try{writer?.animateCharacter?.()}catch{}return}
 if(b.hasAttribute('data-write')){try{writer?.quiz?.({onComplete:()=>say('✓ Отлично!','good')})}catch{say('Пропись недоступна.','bad')}return}
 if(b.hasAttribute('data-record')){record();return}
 if(b.hasAttribute('data-stop')){if(media?.state==='recording')media.stop();return}
 if(b.hasAttribute('data-replay-filter')&&micUrl){
  const filtered=window.PANDA_MIC_V236?.processedUrl?.(micUrl);
  if(!filtered){say('Обработка не готова или не нужна. Послушай оригинал.');return}
  stopAudio();try{audio=new Audio(filtered);audio.play().catch(()=>say('Обработанная запись не воспроизводится.','bad'))}catch{say('Ошибка обработки.','bad')}return;
 }
 if(b.hasAttribute('data-replay')&&micUrl){
  stopAudio();try{audio=new Audio(micUrl);audio.play().catch(()=>say('Не удалось воспроизвести запись.','bad'))}catch{}return;
 }
 if(b.hasAttribute('data-final')){
  if(Number(b.dataset.final)===topic.quiz.correct){state.quizPassed=true;done();refresh();say('✓ Отлично, правильный ответ!','good')}
  else say('Не совсем. Вспомни правило и попробуй снова.','bad');
 }
});
prev.addEventListener('click',()=>advance(-1));
next.addEventListener('click',()=>advance(1));
window.addEventListener('pagehide',()=>{
 stopAudio();stopWriter();if(media?.state==='recording')media.stop();
 stream?.getTracks().forEach(t=>t.stop());if(micUrl)URL.revokeObjectURL(micUrl);
});
refresh();
})();