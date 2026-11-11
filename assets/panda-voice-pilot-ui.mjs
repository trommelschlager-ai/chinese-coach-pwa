import {PILOT_LINES,verifyPilotAnswer} from './panda-voice-pilot-engine.mjs';
const $=id=>document.getElementById(id);
const log=$('log'),input=$('answer');
let index=0,done=false,audio=null,recognition=null,recognitionEpoch=0,recognitionActive=false;
function status(text){$('status').textContent=text}
function add(role,text,py='',meaning=''){
 const el=document.createElement('div');el.className='bubble '+role;
 const heading=document.createElement('strong');heading.textContent=(role==='panda'?'🐼 ':'👤 ')+text;el.append(heading);
 if(py){const small=document.createElement('small');small.textContent=py;el.append(small)}
 if(meaning){const small=document.createElement('small');small.textContent=meaning;el.append(small)}
 log.append(el);log.scrollTop=log.scrollHeight;
}
function stopAudio(){try{audio?.pause();audio.currentTime=0}catch{}audio=null}
function stopRecognition(){
 recognitionEpoch++;
 const last=recognition;recognition=null;recognitionActive=false;
 if(last){last.onresult=null;last.onerror=null;last.onend=null;try{last.abort?.()}catch{try{last.stop?.()}catch{}}}
}
function refresh(){
 const ready=!done,available=ready&&!!window.PandaOwnerAudio?.lookup(PILOT_LINES[index]?.audioKey);
 $('hear').disabled=!available;$('hint').disabled=!ready;
 $('send').disabled=!ready;input.disabled=!ready;
 const speech=!!(window.SpeechRecognition||window.webkitSpeechRecognition);
 $('mic').disabled=!ready||!speech;
 $('mic').textContent=recognitionActive?'■ Остановить':'🎙 Говорить';
 $('mic').setAttribute('aria-pressed',String(recognitionActive));
 $('mic').title=speech?'Сказать фразу по-китайски':'Распознавание китайской речи не поддерживается этим браузером';
 $('step').textContent=done?'Готово!':(index+1)+' / '+PILOT_LINES.length;
 $('bar').style.width=(100*(done?PILOT_LINES.length:index)/PILOT_LINES.length)+'%';
}
function prompt(){
 stopAudio();stopRecognition();input.value='';
 const line=PILOT_LINES[index];
 if(!line){finish();return}
 add('panda',line.panda,line.pinyin,line.ru);
 refresh();
 status(window.PandaOwnerAudio?.lookup(line.audioKey)?line.instruction+' Нажми «Слушать панду» для образца.':line.instruction+' Запись пока не загрузилась.');
}
function finish(){
 stopAudio();stopRecognition();done=true;
 add('panda','Отлично! Обе фразы верные.','', 'Диалог можно повторять сколько угодно раз.');
 try{localStorage.setItem('pg-panda-voice-pilot-v1-last',new Date().toISOString())}catch{}
 refresh();status('Диалог завершён. Ты правильно назвал(а) фразы, но тоны голоса отдельно не проверялись.');
}
function restart(){
 stopAudio();stopRecognition();index=0;done=false;log.replaceChildren();
 add('panda','Привет! Я помогу тебе произнести две фразы из первого урока.','', 'Нажми 🔊 и повтори вслух, затем подтверди текст.');
 prompt();
}
$('form').addEventListener('submit',event=>{
 event.preventDefault();if(done)return;
 const value=input.value.trim();if(!value){status('Скажи или напиши ответ.');return;}
 stopRecognition();refresh();
 const result=verifyPilotAnswer(index,value);
 add('student',value);
 add('panda',result.message);
 if(!result.ok){status('Послушай образец ещё раз или воспользуйся подсказкой.');return;}
 index++;prompt();
});
$('reset').addEventListener('click',restart);
$('hint').addEventListener('click',()=>{
 if(done)return;
 const line=PILOT_LINES[index];
 add('panda','💡 '+line.instruction+' Образец: '+line.panda+' — '+line.pinyin);
});
$('hear').addEventListener('click',()=>{
 if(done)return;
 const src=window.PandaOwnerAudio?.lookup(PILOT_LINES[index].audioKey);
 if(!src){status('Проверенной аудиозаписи нет. Печатный ответ доступен.');return;}
 stopAudio();stopRecognition();refresh();
 try{audio=new Audio(src);audio.preload='auto';audio.play().catch(()=>status('Запись не воспроизвелась. Попробуй ещё раз или проверь интернет.'))}
 catch{status('Не удалось запустить аудио. Попробуй ещё раз.')}
});
function micError(code){
 const errors={
  'not-allowed':'Доступ к микрофону запрещён. Разреши микрофон для сайта или используй текст.',
  'service-not-allowed':'Сервис распознавания недоступен. Можешь написать ответ.',
  'audio-capture':'Микрофон недоступен или занят другим приложением.',
  'network':'Распознаванию речи в браузере нужен интернет. Текст работает без него.',
  'no-speech':'Не услышала китайскую фразу. Попробуй ещё раз.',
  'language-not-supported':'Этот браузер не распознаёт китайскую речь.',
  'aborted':'Прослушивание остановлено.'
 };
 return errors[String(code)]||'Не получилось распознать речь. Повтори или ответь текстом.';
}
$('mic').addEventListener('click',()=>{
 if(done)return;
 const Ctor=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Ctor){status('Этот браузер не поддерживает распознавание китайской речи. Введи ответ текстом.');return;}
 if(recognitionActive&&recognition){
  try{recognition.stop();$('mic').disabled=true;status('Заканчиваю запись. Проверь распознанный текст.')}
  catch{stopRecognition();refresh();status('Остановлено.');}
  return;
 }
 stopAudio();stopRecognition();
 const epoch=++recognitionEpoch;
 let instance,heard=false,failed=false;
 try{
  instance=new Ctor();instance.lang='zh-CN';instance.continuous=false;
  instance.interimResults=false;instance.maxAlternatives=1;
 }catch{status('Микрофон не запустился. Попробуй текстовый ответ.');return;}
 recognition=instance;recognitionActive=true;
 const valid=()=>recognition===instance&&recognitionEpoch===epoch&&!done;
 instance.onresult=event=>{
  if(!valid())return;
  const text=String(event.results?.[0]?.[0]?.transcript||'').trim();
  if(!text){status('Фраза не распознана. Попробуй ещё раз.');return;}
  heard=true;input.value=text;
  status('Распознано: «'+text+'». Проверь слова и нажми «Ответить». Правильность тонов по голосу не оценена.');
 };
 instance.onerror=event=>{if(!valid())return;failed=true;status(micError(event?.error))};
 instance.onend=()=>{
  if(recognition!==instance||epoch!==recognitionEpoch)return;
  recognition=null;recognitionActive=false;refresh();
  if(!heard&&!failed)status('Запись завершена, но фраза не распознана. Попробуй ещё раз или напиши ответ.');
 };
 refresh();status('🎙 Слушаю! Говори по-китайски.');
 try{instance.start()}catch{stopRecognition();refresh();status('Не удалось запустить микрофон. Проверь разрешение браузера.')}
});
restart();
