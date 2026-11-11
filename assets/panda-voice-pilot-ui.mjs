import {lookupPilotAudio} from './panda-live-audio.mjs?v=live2';
import {verifyAnswerFor} from './panda-voice-pilot-engine.mjs?v=live3';
import {selectConversation,missingConversationAudio} from './panda-live-lessons.mjs?v=live3';
import {ENVELOPES} from './panda-live-envelope.mjs?v=live2';
import {createPandaRig} from './panda-live-rig.mjs';
const conversation=selectConversation(window.location.search);
const {lines:PILOT_LINES,replies:REPLIES}=conversation;
const $=id=>document.getElementById(id);
const rig=createPandaRig($('character'),$('panda-canvas'));
const state={step:0,done:false,busy:false,active:false,recognition:null,epoch:0,audio:null,typing:false,watchdog:null,transition:null,poseTimer:null};
let audioFrame=0;
const supported=()=>!!(window.SpeechRecognition||window.webkitSpeechRecognition);
const audioFor=lookupPilotAudio;
const current=()=>state.done?REPLIES[state.branch]:PILOT_LINES[state.step];
function note(text){$('status').textContent=text}
function pose(value){clearTimeout(state.poseTimer);rig.setState(value)}
function brief(value){pose(value);state.poseTimer=setTimeout(()=>pose('idle'),value==='retry'?2600:1300)}
function clearWatchdog(){clearTimeout(state.watchdog);state.watchdog=null}
function stopAudio(){
 const a=state.audio;state.audio=null;window.cancelAnimationFrame(audioFrame);
 if(a){a.onplaying=a.onended=a.onerror=a.onpause=a.onwaiting=null;a.pause()}
 $('hear').classList.remove('playing');rig.setLevel(0);
 if($('character').dataset.state==='talking')pose('idle');
}
function stopRecognition(){
 clearWatchdog();state.epoch++;const r=state.recognition;state.recognition=null;state.active=false;
 if(r){r.onstart=r.onresult=r.onnomatch=r.onerror=r.onend=null;try{r.abort()}catch{}}
 if($('character').dataset.state==='listening')pose('idle');
}
function recovery(text){$('voice-recovery').hidden=false;note(text);refresh()}
function refresh(){
 $('conversation').hidden=state.done;$('completed').hidden=!state.done;
 $('step').textContent=state.done?'Готово':`${state.step+1} из ${PILOT_LINES.length}`;
 $('bar2').classList.toggle('on',state.done||state.step>0);
 $('mic').disabled=state.done||state.busy||!supported();
 $('mic').setAttribute('aria-pressed',String(state.active));$('mic').textContent=state.active?'■':'🎙';
 $('mic-caption').textContent=state.active?'Слушаю…':supported()?'Ответь голосом':'Ответь текстом';
 $('type-toggle').setAttribute('aria-expanded',String(state.typing));$('typing').hidden=!state.typing||state.done;
 $('send').disabled=state.busy;
 const src=audioFor(current()?.audioKey);$('hear').hidden=!src;$('hear').disabled=!src||state.busy;$('audio-note').hidden=!!src;
}
function render(){
 const line=current();$('phrase').textContent=line.hanzi||line.panda;$('pinyin').textContent=line.pinyin;$('translation').textContent=line.ru;
 refresh();
}
function play(){
 const src=audioFor(current()?.audioKey);
 if(!src){note('Запись этой фразы пока недоступна.');return}
 stopRecognition();stopAudio();refresh();
 const a=new Audio(new URL(src,document.baseURI).href);state.audio=a;a.preload='auto';
 const envelope=ENVELOPES[src];
 const valid=()=>state.audio===a;
 const animate=()=>{
  if(!valid()||a.paused||a.ended)return;
  const level=envelope?envelope.levels[Math.floor(a.currentTime/envelope.binSeconds)]||0:.5+.5*Math.sin(a.currentTime*23);
  rig.setLevel(level);audioFrame=window.requestAnimationFrame(animate);
 };
 // "playing", not "play": buffered / rejected playback never animates speech.
 a.onplaying=()=>{if(valid()){pose('talking');$('hear').classList.add('playing');note('Слушай Панду…');window.cancelAnimationFrame(audioFrame);animate()}};
 a.onwaiting=()=>{if(valid()){window.cancelAnimationFrame(audioFrame);pose('idle');$('hear').classList.remove('playing');note('Загружаю звук…')}};
 a.onpause=()=>{if(valid()){window.cancelAnimationFrame(audioFrame);pose('idle');$('hear').classList.remove('playing')}};
 a.onended=()=>{if(valid()){stopAudio();note('')}};
 a.onerror=()=>{if(valid()){stopAudio();note('MP3 не загрузился. Проверь интернет и попробуй ещё раз.')}};
 a.play().catch(error=>{if(valid()){stopAudio();note(`Звук не запустился (${error?.name||'ошибка'}). Нажми динамик ещё раз.`)}});
}
function restart(){
 clearTimeout(state.transition);stopAudio();stopRecognition();pose('idle');
 Object.assign(state,{step:0,done:false,busy:false,typing:false,branch:'short'});
 $('heard').textContent='';$('answer').value='';$('voice-recovery').hidden=true;note('');render();
 if(!supported())recovery('В этом браузере распознавание недоступно. Открой страницу в Chrome или нажми «Написать».');
}
function checkAnswer(raw){
 if(state.done||state.busy)return;
 const input=String(raw||'').trim();stopRecognition();stopAudio();
 const result=verifyAnswerFor(PILOT_LINES,state.step,input);
 $('heard').textContent=input?'Ты: '+input:'';
 if(!result.ok){
  brief('retry');note(input?'Не совсем. '+PILOT_LINES[state.step].instruction:'Не расслышала. Повтори ещё раз.');refresh();
  // Repeat the exact question clip from the same uploaded voice.
  if(audioFor(current().audioKey))state.transition=setTimeout(()=>{play();note(result.message)},3200);
  return;
 }
 clearTimeout(state.transition);brief('happy');state.busy=true;note('Верно!');refresh();
 state.transition=setTimeout(()=>{
  state.busy=false;state.step++;
  if(state.step>=PILOT_LINES.length){
   state.done=true;state.branch=result.branch||'short';
   $('final-feedback').textContent=state.branch==='asked-back'?'Ты поддержал разговор по-китайски!':'Ты ответил по-китайски!';
   try{localStorage.setItem(conversation.id===1?'pg-panda-voice-pilot-v1-last':`pg-panda-voice-lesson${conversation.id}-last`,new Date().toISOString())}catch{}
  }
  $('answer').value='';$('heard').textContent='';note('');render();
  if(audioFor(current()?.audioKey))play();
 },900);
}
function startRecognition(){
 if(state.done||state.busy)return;
 if(state.active){try{state.recognition.stop();note('Завершаю распознавание…')}catch{stopRecognition();refresh()}return}
 clearTimeout(state.transition);stopAudio();stopRecognition();
 if(window.isSecureContext===false){recovery('Микрофон требует HTTPS. Открой опубликованную страницу Panda Go.');return}
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){recovery('Распознавание в этом браузере недоступно. Открой в Chrome или используй «Написать».');return}
 let r;try{r=new Speech();r.lang='zh-CN';r.continuous=false;r.interimResults=false;r.maxAlternatives=1}
 catch{recovery('Браузер не смог создать сеанс распознавания. Используй «Написать».');return}
 state.recognition=r;const epoch=++state.epoch;state.active=true;let heard=false,failed=false;
 const valid=()=>state.recognition===r&&state.epoch===epoch&&!state.done;
 $('voice-recovery').hidden=true;note('Подключаю микрофон…');refresh();
 r.onstart=()=>{if(valid()){pose('listening');note('Слушаю…')}};
 r.onresult=e=>{if(!valid())return;const text=String(e.results?.[0]?.[0]?.transcript||'').trim();heard=!!text;checkAnswer(text)};
 r.onnomatch=()=>{if(valid()){failed=true;stopRecognition();brief('retry');recovery('Речь не распознана. Повтори или напиши ответ.')}};
 r.onerror=e=>{
  if(!valid())return;failed=true;
  const errors={
   'not-allowed':'Доступ к микрофону запрещён. Разреши микрофон в настройках сайта Chrome.',
   'service-not-allowed':'Браузер запретил службу распознавания. Попробуй Chrome.',
   'network':'Сбой сети службы распознавания. Проверь интернет или используй «Написать».',
   'no-speech':'Речь не обнаружена. Повтори ближе к микрофону.',
   'audio-capture':'Микрофон недоступен или занят другим приложением.',
   'language-not-supported':'Служба этого браузера не поддерживает китайский zh-CN.',
   'aborted':'Распознавание прервано. Можно попробовать ещё раз.'
  };
  stopRecognition();recovery(errors[e.error]||`Ошибка распознавания: ${e.error||'неизвестна'}.`);
 };
 r.onend=()=>{if(!valid())return;stopRecognition();refresh();if(!heard&&!failed)recovery('Сеанс завершён без результата. Повтори или используй «Написать».')};
 try{r.start();state.watchdog=setTimeout(()=>{if(valid()){stopRecognition();recovery('Служба распознавания не ответила за 16 секунд. Попробуй Chrome или «Написать».')}},16000)}
 catch{stopRecognition();recovery('Микрофон не запустился. Проверь разрешение сайта.')}
}
$('hear').addEventListener('click',()=>{clearTimeout(state.transition);play()});
$('mic').addEventListener('click',startRecognition);
$('type-toggle').addEventListener('click',()=>{if(state.busy)return;clearTimeout(state.transition);stopRecognition();state.typing=!state.typing;refresh();if(state.typing)$('answer').focus()});
$('typing').addEventListener('submit',e=>{e.preventDefault();clearTimeout(state.transition);checkAnswer($('answer').value)});
$('reset').addEventListener('click',restart);$('again').addEventListener('click',restart);
$('character').querySelector('img').addEventListener('error',()=>{note('Изображение Панды не загрузилось. Обнови страницу.');$('mic').disabled=true});
window.addEventListener('pagehide',event=>{clearTimeout(state.transition);clearTimeout(state.poseTimer);stopRecognition();stopAudio();if(!event.persisted)rig.dispose()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopAudio();stopRecognition();refresh()}});
if(conversation.id!==1){
 $('lesson-tag').textContent=`Урок ${conversation.id} · Диалог`;
 $('back-link').href='./hsk1-second-v203.html';
 const missing=missingConversationAudio(conversation,lookupPilotAudio);
 $('pilot-note').textContent=missing.length?`Черновик урока ${conversation.id} · не хватает ${missing.length} записей`:'Тестовая практика · единый голос';
 const vocabulary=$('words');vocabulary.replaceChildren();
 for(const item of [...(conversation.vocabulary||conversation.newWords),...(conversation.examples||[])]){
  const p=document.createElement('p');p.textContent=`${item.hanzi} — ${item.pinyin} — ${item.ru}`;vocabulary.append(p);
 }
 const note=document.createElement('p');note.textContent='Проверяется распознанный текст, а не правильность произнесённых тонов. Новые записи ещё не подключены.';vocabulary.append(note);
}
restart();

document.documentElement.dataset.pandaLiveReady='true';
