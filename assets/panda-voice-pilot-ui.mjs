import {PILOT_LINES,REPLIES,verifyPilotAnswer} from './panda-voice-pilot-engine.mjs';
const $=id=>document.getElementById(id);
const state={step:0,done:false,active:false,recognition:null,epoch:0,audio:null,typing:false,lastAnswer:''};
function note(text){$('status').textContent=text}
function stopAudio(){
 try{state.audio?.pause();state.audio.currentTime=0}catch{}
 state.audio=null;
 $('character').classList.remove('speaking');
}
function stopRecognition(){
 state.epoch++;
 const prev=state.recognition;
 state.recognition=null;state.active=false;
 if(prev){
  prev.onresult=null;prev.onerror=null;prev.onend=null;
  try{prev.abort?.()}catch{try{prev.stop?.()}catch{}}
 }
}
function current(){return PILOT_LINES[state.step]||null}
function speechSupported(){return !!(window.SpeechRecognition||window.webkitSpeechRecognition)}
function audioFor(key){return key&&window.PandaOwnerAudio?.lookup(key)||null}
function setPanda(line){
 $('phrase').textContent=line.hanzi||line.panda;
 $('pinyin').textContent=line.pinyin;
 $('translation').textContent=line.ru;
 const audio=audioFor(line.audioKey);
 $('hear').disabled=!audio;
 $('audio-note').hidden=!!audio;
}
function refresh(){
 const step=current(),complete=state.done;
 $('conversation').hidden=complete;
 $('completed').hidden=!complete;
 $('step').textContent=complete?'Готово':(state.step+1)+' из '+PILOT_LINES.length;
 $('bar1').classList.toggle('on',true);
 $('bar2').classList.toggle('on',complete||state.step>0);
 $('hear').disabled=!audioFor(complete?'':step?.audioKey);
 $('mic').disabled=complete||!speechSupported();
 $('mic').setAttribute('aria-pressed',String(state.active));
 $('mic').textContent=state.active?'■':'🎙';
 $('mic-caption').textContent=state.active?'Слушаю…':speechSupported()?'Ответь голосом':'Ответь текстом';
 $('type-toggle').setAttribute('aria-expanded',String(state.typing));
 $('typing').hidden=!state.typing||complete;
}
function showStep(){
 stopAudio();stopRecognition();
 const line=current();
 if(!line){finish('short');return}
 setPanda(line);
 $('heard').textContent='';
 $('answer').value='';
 note(!speechSupported()?'Микрофон недоступен — нажми «Написать».':'');
 refresh();
}
function finish(branch){
 stopAudio();stopRecognition();
 const response=REPLIES[branch]||REPLIES.short;
 state.done=true;
 setPanda(response);
 $('final-feedback').textContent=branch==='asked-back'?'🎉 Настоящий диалог!':'🎉 Отлично! Ты ответил по-китайски.';
 try{localStorage.setItem('pg-panda-voice-pilot-v1-last',new Date().toISOString())}catch{}
 refresh();
}
function restart(){
 stopAudio();stopRecognition();
 state.step=0;state.done=false;state.typing=false;state.lastAnswer='';
 showStep();
}
function checkAnswer(raw){
 if(state.done)return;
 const input=String(raw||'').trim();
 if(!input){note('Не расслышала. Повтори ещё раз.');return}
 const result=verifyPilotAnswer(state.step,input);
 stopRecognition();
 if(!result.ok){
  $('heard').textContent='👤 '+input;
  note('Попробуй ещё раз. Подсказка внизу.');
  refresh();return;
 }
 state.lastAnswer=input;
 state.step++;
 if(state.step>=PILOT_LINES.length){
  finish(result.branch);
 }else{
  showStep();
 }
}
$('hear').addEventListener('click',()=>{
 const line=state.done?null:current();
 const src=audioFor(line?.audioKey);
 if(!src){note('Для этой фразы запись носительницы ещё готовится.');return}
 stopRecognition();refresh();stopAudio();
 try{
  const a=new Audio(src);a.preload='auto';state.audio=a;
  a.onplay=()=>$('character').classList.add('speaking');
  a.onended=()=>{$('character').classList.remove('speaking');if(state.audio===a)state.audio=null};
  a.onerror=()=>{stopAudio();note('Звук не загрузился. Попробуй ещё раз.')};
  a.play().catch(()=>{stopAudio();note('Для звука нажми 🔊 ещё раз.')});
 }catch{stopAudio();note('Не удалось воспроизвести звук.')}
});
$('mic').addEventListener('click',()=>{
 if(state.done)return;
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){note('На этом устройстве нет распознавания речи. Нажми «Написать».');return}
 if(state.active&&state.recognition){
  try{state.recognition.stop();$('mic').disabled=true;note('Завершаю запись…')}
  catch{stopRecognition();refresh()}
  return;
 }
 stopAudio();stopRecognition();
 const epoch=++state.epoch;
 let recognition,heard=false,failed=false;
 try{
  recognition=new Speech();
  recognition.lang='zh-CN';
  recognition.continuous=false;
  recognition.interimResults=false;
  recognition.maxAlternatives=1;
 }catch{note('Не удалось включить микрофон. Можно написать ответ.');return}
 state.recognition=recognition;
 state.active=true;
 refresh();
 const valid=()=>state.recognition===recognition&&state.epoch===epoch&&!state.done;
 recognition.onresult=event=>{
  if(!valid())return;
  const text=String(event.results?.[0]?.[0]?.transcript||'').trim();
  heard=!!text;
  checkAnswer(text);
 };
 recognition.onerror=event=>{
  if(!valid())return;
  failed=true;
  const errors={
   'not-allowed':'Разреши микрофон для сайта или нажми «Написать».',
   'network':'Для распознавания нужен интернет. Можно написать ответ.',
   'no-speech':'Не расслышала. Скажи ещё раз.',
   'audio-capture':'Микрофон занят или недоступен.',
   'service-not-allowed':'Распознавание недоступно. Напиши ответ.'
  };
  note(errors[event?.error]||'Не удалось распознать фразу. Повтори.');
 };
 recognition.onend=()=>{
  if(!valid())return;
  state.recognition=null;state.active=false;
  refresh();
  if(!heard&&!failed)note('Не расслышала. Попробуй ещё раз.');
 };
 note('Говори по-китайски…');
 try{recognition.start()}
 catch{stopRecognition();refresh();note('Микрофон не запустился. Проверь разрешения.')}
});
$('type-toggle').addEventListener('click',()=>{
 if(state.done)return;
 state.typing=!state.typing;refresh();
 if(state.typing)$('answer').focus();
});
$('typing').addEventListener('submit',event=>{
 event.preventDefault();
 const answer=$('answer').value;
 checkAnswer(answer);
 if(!state.done)$('answer').value='';
});
$('reset').addEventListener('click',restart);
$('again').addEventListener('click',restart);
$('character').querySelector('img').addEventListener('error',event=>{
 event.currentTarget.hidden=true;
 $('character').querySelector('.panda-face').style.display='grid';
});
restart();
