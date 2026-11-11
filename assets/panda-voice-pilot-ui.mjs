import {PILOT_LINES,verifyPilotAnswer} from './panda-voice-pilot-engine.mjs';
const $=id=>document.getElementById(id);
const state={step:0,done:false,active:false,recognition:null,epoch:0,audio:null,typing:false};
function note(message){$('status').textContent=message}
function stopAudio(){try{state.audio?.pause();state.audio.currentTime=0}catch{}state.audio=null}
function stopRecognition(){
 state.epoch++;
 const old=state.recognition;state.recognition=null;state.active=false;
 if(old){old.onresult=null;old.onerror=null;old.onend=null;
  try{old.abort?.()}catch{try{old.stop?.()}catch{}}
 }
}
function current(){return PILOT_LINES[state.step]||null}
function speechSupported(){return !!(window.SpeechRecognition||window.webkitSpeechRecognition)}
function refresh(){
 const line=current(),complete=state.done;
 $('conversation').hidden=complete;$('completed').hidden=!complete;
 $('step').textContent=complete?'Готово':(state.step+1)+' из '+PILOT_LINES.length;
 $('bar1').classList.toggle('on',true);
 $('bar2').classList.toggle('on',complete||state.step>0);
 $('hear').disabled=complete||!window.PandaOwnerAudio?.lookup(line?.audioKey);
 $('mic').disabled=complete||!speechSupported();
 $('mic').setAttribute('aria-pressed',String(state.active));
 $('mic').textContent=state.active?'■':'🎙';
 $('mic-caption').textContent=state.active?'Слушаю…':speechSupported()?'Нажми и говори':'Используй клавиатуру';
 $('type-toggle').setAttribute('aria-expanded',String(state.typing));
 $('typing').hidden=!state.typing||complete;
}
function showStep(ack=''){
 stopAudio();stopRecognition();
 const line=current();
 if(!line){finish();return}
 $('phrase').textContent=line.panda;
 $('pinyin').textContent=line.pinyin;
 $('translation').textContent=line.ru;
 $('heard').textContent=ack;
 $('answer').value='';
 note(!speechSupported()?'Микрофон недоступен. Нажми «Написать».':'');
 refresh();
}
function finish(){
 stopAudio();stopRecognition();
 state.done=true;
 try{localStorage.setItem('pg-panda-voice-pilot-v1-last',new Date().toISOString())}catch{}
 refresh();
}
function restart(){
 stopAudio();stopRecognition();
 state.step=0;state.done=false;state.typing=false;
 showStep();
}
function checkAnswer(raw){
 if(state.done)return;
 const value=String(raw||'').trim();
 if(!value){note('Ответ не распознан. Попробуй ещё раз.');return}
 const result=verifyPilotAnswer(state.step,value);
 stopRecognition();
 if(!result.ok){
  $('heard').textContent='👤 '+value;
  note('Не совсем. Послушай ещё раз и повтори.');
  refresh();return;
 }
 const acknowledged='✅ '+value;
 state.step++;
 if(state.step>=PILOT_LINES.length){finish();return}
 showStep(acknowledged);
}
$('hear').addEventListener('click',()=>{
 const key=current()?.audioKey,source=window.PandaOwnerAudio?.lookup(key);
 if(!source){note('Запись сейчас недоступна.');return}
 stopRecognition();refresh();stopAudio();
 try{
  state.audio=new Audio(source);state.audio.preload='auto';
  state.audio.play().catch(()=>note('Не удалось включить звук. Попробуй ещё раз.'));
 }catch{note('Не удалось включить звук.')}
});
$('mic').addEventListener('click',()=>{
 if(state.done)return;
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){note('Нажми «Написать» и введи ответ.');return}
 if(state.active&&state.recognition){
  try{state.recognition.stop();$('mic').disabled=true;note('Заканчиваю прослушивание…')}
  catch{stopRecognition();refresh()}
  return;
 }
 stopAudio();stopRecognition();
 const epoch=++state.epoch;
 let recog,heard=false,error=false;
 try{
  recog=new Speech();
  recog.lang='zh-CN';recog.continuous=false;recog.interimResults=false;recog.maxAlternatives=1;
 }catch{note('Микрофон недоступен. Ответь текстом.');return}
 state.recognition=recog;state.active=true;refresh();
 const valid=()=>recog===state.recognition&&epoch===state.epoch&&!state.done;
 recog.onresult=event=>{
  if(!valid())return;
  const transcript=String(event.results?.[0]?.[0]?.transcript||'').trim();
  heard=true;
  checkAnswer(transcript);
 };
 recog.onerror=event=>{
  if(!valid())return;
  error=true;
  const errors={
   'not-allowed':'Разреши доступ к микрофону или нажми «Написать».',
   'network':'Для распознавания нужен интернет. Можно написать ответ.',
   'no-speech':'Не расслышала. Нажми микрофон ещё раз.',
   'audio-capture':'Микрофон недоступен. Можно написать ответ.',
   'service-not-allowed':'Распознавание недоступно. Можно написать ответ.'
  };
  note(errors[event?.error]||'Не получилось распознать речь. Попробуй ещё раз.');
 };
 recog.onend=()=>{
  if(!valid())return;
  state.recognition=null;state.active=false;refresh();
  if(!heard&&!error)note('Не расслышала. Попробуй ещё раз.');
 };
 note('Говори по-китайски…');
 try{recog.start()}catch{stopRecognition();refresh();note('Микрофон не запустился. Попробуй «Написать».')}
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
 if(!state.done&&state.typing)$('answer').value='';
});
$('reset').addEventListener('click',restart);
$('again').addEventListener('click',restart);
restart();
