import {SCENES,findScene,validateTurn} from './panda-conversation-v1.mjs';
const $=id=>document.getElementById(id);
const chat=$('chat'),reply=$('reply');
const completionIds={1:'foundations',2:'pronouns',3:'numbers',4:'weekdays',5:'dates',6:'family',7:'weather'};
const state={scene:null,turn:0,started:false,completed:false};
let audio=null,recognition=null,recognitionEpoch=0,recognitionActive=false;
function readJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}}
function completedLesson(lesson){
 const ids=readJSON('pg-hsk1-v3-complete',[]);
 if(Array.isArray(ids)&&ids.includes(completionIds[lesson]))return true;
 if(lesson===1){const s=readJSON('pg-hsk1-v189-lesson1',{});return s.step===14&&s.listenPassed===true;}
 if(lesson===6||lesson===7){const s=readJSON('pg-hsk1-l'+lesson+'-v231',{});return s.done===true;}
 return false;
}
function accessible(scene){return scene.id==='hello'||completedLesson(scene.lesson)}
function status(message){$('status').textContent=message}
function stopAudio(){try{audio?.pause()}catch{}audio=null}
function stopRecognition(){
 recognitionEpoch++;
 const previous=recognition;
 recognition=null;recognitionActive=false;
 if(previous){
  previous.onresult=null;previous.onerror=null;previous.onend=null;
  try{previous.abort?.()}catch{try{previous.stop?.()}catch{}}
 }
}
function microphoneError(code){
 const known={
  'not-allowed':'Доступ к микрофону запрещён. Разреши его в настройках сайта или напиши ответ.',
  'service-not-allowed':'Служба распознавания речи недоступна. Используй текстовый ответ.',
  'audio-capture':'Микрофон не найден или занят другим приложением.',
  'no-speech':'Я не услышала фразу. Нажми «Говорить» и повтори.',
  'network':'Для распознавания речи в этом браузере нужен интернет. Текстовый режим доступен.',
  'language-not-supported':'Браузер не поддерживает распознавание китайского языка.',
  'aborted':'Распознавание остановлено. Можно попробовать ещё раз.'
 };
 return known[String(code)]||'Не удалось распознать речь. Попробуй снова или ответь текстом.';
}
function message(role,text,py='',ru=''){
 const el=document.createElement('div');el.className='msg '+role;
 const main=document.createElement('strong');main.textContent=(role==='panda'?'🐼 ':'👤 ')+text;el.append(main);
 if(py){const item=document.createElement('small');item.textContent=py;el.append(item)}
 if(ru){const item=document.createElement('small');item.textContent=ru;el.append(item)}
 chat.append(el);chat.scrollTop=chat.scrollHeight;
}
function progress(){
 const scene=state.scene;
 $('turn-count').textContent=scene?'Реплика '+Math.min(state.turn+1,scene.turns.length)+' из '+scene.turns.length:'Выбери диалог';
 $('done-state').textContent=state.completed?'Пройдено ✓':'';
 $('turn-bar').style.width=scene?Math.round(100*state.turn/scene.turns.length)+'%':'0%';
}
function current(){return state.scene?.turns?.[state.turn]||null}
function audioSource(key){return key&&window.PandaOwnerAudio?.lookup(key)||null}
function updateControls(){
 const turn=current(),canAnswer=!!turn&&state.started&&!state.completed;
 const available=canAnswer&&!!audioSource(turn.audio);
 $('reply').disabled=!canAnswer;$('send').disabled=!canAnswer;
 $('hint').disabled=!canAnswer;$('hear').disabled=!available;
 const supported=!!(window.SpeechRecognition||window.webkitSpeechRecognition);
 $('mic').disabled=!canAnswer||!supported;
 $('mic').textContent=recognitionActive?'■ Остановить':'🎙 Говорить';
 $('mic').setAttribute('aria-pressed',String(recognitionActive));
 if(!window.SpeechRecognition&&!window.webkitSpeechRecognition)$('mic').title='Распознавание китайской речи недоступно в этом браузере';
 $('hear').title=available?'Слушать точную запись носительницы':'Для этой фразы ещё нет проверенной записи носительницы';
}
function showTurn(){
 stopAudio();stopRecognition();const turn=current();
 if(!turn){finish();return}
 message('panda',turn.panda,turn.pinyin,turn.meaning);
 reply.value='';progress();updateControls();
 status(audioSource(turn.audio)?'Можешь прослушать панду и ответить.':'Запись этой фразы ещё не готова. Используй пиньинь и текст; голос не подменяется.');
}
function recordScene(){
 if(!state.scene||!state.completed)return;
 const progress=readJSON('pg-panda-conversation-v1-completed',{});
 progress[state.scene.id]={completedAt:new Date().toISOString(),turns:state.scene.turns.length};
 try{localStorage.setItem('pg-panda-conversation-v1-completed',JSON.stringify(progress))}catch{}
}
function finish(){
 stopRecognition();state.completed=true;state.started=false;
 const last=state.scene?.turns?.at(-1);
 if(last?.closing)message('panda',last.closing.panda,last.closing.pinyin,last.closing.meaning);
 message('panda','Отлично! Диалог завершён. Повтори его ещё раз, чтобы отвечать увереннее.');
 recordScene();
 $('turn-bar').style.width='100%';progress();updateControls();
 status('Практика завершена. Это проверка текста/распознанных слов, не акустических тонов.');
}
function start(){
 if(!state.scene)return;
 stopRecognition();
 state.started=true;state.completed=false;state.turn=0;
 $('intro').classList.add('hidden');chat.replaceChildren();
 message('panda','Начнём короткий разговор. Отвечай по-китайски; подсказка доступна в любой момент.');
 if(state.scene.context)message('panda','Ситуация: '+state.scene.context);
 showTurn();
}
function lessonName(n){return n===1?'1':String(n)}
function renderScenes(){
 const root=$('scenes');root.replaceChildren();
 const saved=readJSON('pg-panda-conversation-v1-completed',{});
 for(const scene of SCENES){
  const allowed=accessible(scene),btn=document.createElement('button');
  btn.className='scene'+(scene.id===state.scene?.id?' active':'');
  btn.type='button';btn.dataset.scene=scene.id;btn.disabled=!allowed;
  const title=document.createElement('strong');title.textContent=(scene.bonus?'🌸 ':'💬 ')+scene.title;
  const detail=document.createElement('small');
  detail.textContent=allowed?(scene.bonus?'Дополнение после урока 1 · новые фразы объясняются':scene.description)+(saved[scene.id]?' · ✓ Пройдено':''):'🔒 Откроется после урока '+lessonName(scene.lesson);
  btn.append(title,detail);
  btn.addEventListener('click',()=>selectScene(scene.id));root.append(btn);
 }
}
function selectScene(id){
 const scene=findScene(id);if(!scene||!accessible(scene)){status('Сначала пройди соответствующий урок.');return}
 stopAudio();stopRecognition();state.scene=scene;state.turn=0;state.started=false;state.completed=false;
 renderScenes();
 chat.replaceChildren();reply.value='';progress();
 if(scene.introduce.length){
  const intro=$('intro');intro.replaceChildren();intro.classList.remove('hidden');
  const headline=document.createElement('strong');headline.textContent='🌸 Новые фразы перед разговором — их ещё не было в уроке 1';
  intro.append(headline);
  for(const line of scene.introduce){
   const item=document.createElement('div');item.className='phrase';
   const zh=document.createElement('strong');zh.textContent=line.hanzi;
   const py=document.createElement('span');py.textContent=line.pinyin;
   const ru=document.createElement('span');ru.textContent=line.meaning+'. '+line.note;
   item.append(zh,py,ru);intro.append(item);
  }
  const btn=document.createElement('button');btn.type='button';btn.className='btn primary';btn.textContent='Я прочитал(а), начнём →';btn.addEventListener('click',start);intro.append(btn);
  message('panda','Перед разговором сначала познакомься с дополнительными фразами выше.');
  status('Новый словарь не проверяется, пока ты не откроешь объяснения и не начнёшь тренировку.');
 }else start();
 updateControls();
}
function submit(text){
 if(!state.started||state.completed||!current())return;
 const response=String(text??'').trim();if(!response){status('Скажи или введи ответ.');return;}
 stopRecognition();updateControls();
 const grade=validateTurn(state.scene.id,state.turn,response);
 message('student',response);
 if(!grade.ok){
  message('panda',grade.feedback);
  status('Попробуй ещё раз. Подсказка покажет образец.');
  return;
 }
 message('panda',grade.feedback);
 state.turn++;if(state.turn>=state.scene.turns.length)finish();else showTurn();
}
$('reply-form').addEventListener('submit',event=>{
 event.preventDefault();submit(reply.value);
});
$('hint').addEventListener('click',()=>{
 const turn=current();if(turn){message('panda','💡 Пример ответа: '+turn.expected+'\n'+turn.explanation);}
});
$('repeat').addEventListener('click',()=>{if(state.scene)selectScene(state.scene.id)});
$('hear').addEventListener('click',()=>{
 const item=current(),src=audioSource(item?.audio);
 if(!src){status('Проверенной записи этой реплики пока нет.');return;}
 stopAudio();audio=new Audio(src);audio.play().catch(()=>status('Не удалось воспроизвести запись. Проверь кэш и интернет.'));
});
$('mic').addEventListener('click',()=>{
 const Ctor=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Ctor){status('Распознавание китайской речи недоступно. Используй текстовый ответ.');return;}
 if(!state.started||state.completed)return;
 if(recognitionActive&&recognition){
  try{recognition.stop();status('Заканчиваю прослушивание. Проверь появившийся текст перед отправкой.');$('mic').disabled=true;}
  catch{stopRecognition();updateControls();status('Прослушивание остановлено.');}
  return;
 }
 stopAudio();
 stopRecognition();
 const epoch=++recognitionEpoch;
 let heard=false,failed=false,instance;
 try{instance=new Ctor();instance.lang='zh-CN';instance.interimResults=false;instance.continuous=false;instance.maxAlternatives=1;}
 catch{status('Не удалось включить распознавание речи. Ответь текстом.');return;}
 recognition=instance;recognitionActive=true;
 const stillCurrent=()=>recognition===instance&&recognitionEpoch===epoch&&state.started&&!state.completed;
 instance.onresult=event=>{
  if(!stillCurrent())return;
  const transcript=String(event.results?.[0]?.[0]?.transcript||'').trim();
  if(!transcript){status('Не расслышала фразу. Повтори ещё раз.');return;}
  heard=true;reply.value=transcript;
  status('Распознано: «'+transcript+'». Проверь текст, затем нажми «Ответить». Тоны по голосу не проверялись.');
 };
 instance.onerror=event=>{
  if(!stillCurrent())return;
  failed=true;status(microphoneError(event?.error));
 };
 instance.onend=()=>{
  if(recognition!==instance||recognitionEpoch!==epoch)return;
  recognition=null;recognitionActive=false;updateControls();
  if(!heard&&!failed)status('Запись завершена, но слова не распознаны. Повтори или ответь текстом.');
 };
 updateControls();status('🎙 Слушаю. Произнеси фразу по-китайски.');
 try{instance.start()}catch{
  stopRecognition();updateControls();
  status('Не удалось запустить микрофон. Проверь разрешение и попробуй снова.');
 }
});
selectScene('hello');
