/* Panda Go HSK 1 — four-tone PRACTICE PILOT.
 * Local F0 contour visualization, NOT speech recognition or a tone grade.
 * Original lesson MP3s are played unchanged.
 */
import {estimatePitch, analyseContour} from './panda-tone-analytics-v457.mjs?v=463';
import {analyseRecordedBlob} from './panda-tone-recording-analysis-v465.mjs?v=465';
const $=id=>document.getElementById(id);
const tones=[
 {n:1,hz:'妈',py:'mā',src:'./assets/lesson1-xiaoxiao-v260/ma1.mp3',reference:'M30 62H332'},
 {n:2,hz:'麻',py:'má',src:'./assets/lesson1-xiaoxiao-v260/ma2.mp3',reference:'M30 109Q192 98 332 32'},
 {n:3,hz:'马',py:'mǎ',src:'./assets/lesson1-xiaoxiao-v260/ma3.mp3',reference:'M30 51Q174 133 332 63'},
 {n:4,hz:'骂',py:'mà',src:'./assets/lesson1-xiaoxiao-v260/ma4.mp3',reference:'M30 30Q178 45 332 111'}
];
const buttons=[...document.querySelectorAll('[data-tone]')];
let selected=0,playing=null,stream=null,audioCtx=null,analyser=null,source=null,interval=null,deadline=null,active=false,opening=false,stopping=false,frames=[],counts=null,recorder=null,recordedChunks=[],recordedUrl=null,recordedAudio=null;
function silencePlayback(){
 if(playing){try{playing.pause();playing.currentTime=0;}catch{}playing=null;}
}
function discardRecordedAudio(){
 try{recordedAudio?.pause();}catch{}
 recordedAudio=null;
 if(recordedUrl){URL.revokeObjectURL(recordedUrl);recordedUrl=null;}
 const replay=$('replay');
 replay.disabled=true;replay.textContent='🔊 Послушать свой голос';
 $('recording-message').textContent='После произношения можно прослушать именно свою запись.';
}
function discardActiveCapture(){
 if(recorder?.state==='recording'){try{recorder.stop();}catch{}}
 recorder=null;recordedChunks=[];
}
async function finalizeCapture(){
 const current=recorder;
 if(!current)return null;
 if(current.state!=='inactive'){
  await new Promise(resolve=>{
   let settled=false,timeout=null;
   const done=()=>{if(settled)return;settled=true;clearTimeout(timeout);resolve();};
   current.addEventListener('stop',done,{once:true});
   timeout=setTimeout(done,1500);
   try{current.stop();}catch{done();}
  });
 }
 if(recorder!==current)return null;
 recorder=null;
 const chunks=recordedChunks.splice(0);
 if(!chunks.length){$('recording-message').textContent='Звук не сохранился. Попробуй записать ещё раз.';return null;}
 const blob=new Blob(chunks,{type:current.mimeType||chunks[0].type||'audio/webm'});
 if(blob.size<=128){$('recording-message').textContent='Запись получилась пустой. Попробуй ещё раз.';return null;}
 recordedUrl=URL.createObjectURL(blob);
 $('replay').disabled=false;
 $('recording-message').textContent='🎧 Твой голос записан. Нажми «Послушать свой голос».';
 return blob;
}
function updateTone(index){
 if(active||opening||stopping)return;
 silencePlayback();discardRecordedAudio();
 selected=(index+tones.length)%tones.length;
 const s=tones[selected];
 $('target-hanzi').textContent=s.hz;
 $('target-pinyin').textContent=s.py;
 $('ref-path').setAttribute('d',s.reference);
 $('your-path').setAttribute('d','');
 $('result').textContent='После произношения здесь появится результат наблюдения.';
 $('status').textContent='Выбран '+s.py+'. Нажми «Слушать образец», затем «Произнести».';
 buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected)));
}
buttons.forEach((b,i)=>b.addEventListener('click',()=>updateTone(i)));
$('next').addEventListener('click',()=>updateTone(selected+1));
$('listen').addEventListener('click',async()=>{
 if(active||opening)return;
 silencePlayback();
 const s=tones[selected];
 try{
  const clip=new Audio(s.src);playing=clip;clip.preload='auto';
  clip.onended=()=>{if(playing===clip)playing=null;};
  clip.onerror=()=>{$('status').textContent='Не удалось воспроизвести '+s.py+'. Проверь аудиофайл.';};
  await clip.play();
  $('status').textContent='Прослушан образец '+s.py+'. Теперь произнеси сам.';
 }catch{
  $('status').textContent='Браузер не смог включить аудио. Нажми «Слушать» ещё раз.';
 }
});
function plot(points){
 if(!points||points.length<2)return '';
 const tmax=points.at(-1).t||1;
 return points.map((p,i)=>{
  const x=30+302*p.t/tmax,y=Math.max(25,Math.min(117,70-13*p.st));
  return (i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1);
 }).join(' ');
}
function toneGuidance(s,result){
 const kind=result.kind;
 if(kind==='insufficient'||kind==='uncertain')return result.label+'. '+result.reason;
 if(s.n===1&&kind==='level')return 'Высота голоса почти ровная — это характерно для первого тона. Это не подтверждение правильности слога.';
 if(s.n===2&&kind==='rise')return 'Голос повышается — движение похоже на второй тон. Звук самого слога ещё не проверен.';
 if(s.n===3&&kind==='dip')return 'Виден спад и последующий подъём — возможный вариант третьего тона в изоляции.';
 if(s.n===3&&kind==='fall')return 'Виден нисходящий/низкий участок: третий тон бывает таким в связной речи; это не ошибка сама по себе.';
 if(s.n===4&&kind==='fall')return 'Высота голоса снижается — движение похоже на четвёртый тон. Это ещё не оценка произношения.';
 return result.label+'. Контур отличается от учебной схемы. Повтори слог спокойно; одной кривой недостаточно, чтобы признать тон ошибочным.';
}
function controls(recording){
 $('record').textContent=recording?'■ Стоп':'🎙 Произнести';
 $('listen').disabled=recording;
 $('replay').disabled=recording||!recordedUrl;
 $('next').disabled=recording;
 buttons.forEach(b=>b.disabled=recording);
}
async function release(){
 clearInterval(interval);clearTimeout(deadline);
 interval=deadline=null;
 try{source?.disconnect();}catch{}
 try{analyser?.disconnect();}catch{}
 stream?.getTracks().forEach(t=>t.stop());
 stream=null;source=null;analyser=null;
 const ctx=audioCtx;audioCtx=null;
 try{await ctx?.close();}catch{}
}
async function stop(){
 if(!active||stopping)return;
 stopping=true;active=false;
 $('record').disabled=true;
 clearInterval(interval);clearTimeout(deadline);
 $('status').textContent='Обрабатываю запись — проверяю весь слог, а не отдельные мгновения…';
 let blob=null,offline=null;
 try{
  blob=await finalizeCapture();
 }catch{}
 await release();
 if(blob){
  try{
   offline=await analyseRecordedBlob(blob,{
    estimatePitch,analyseContour,
    AudioContextClass:window.AudioContext||window.webkitAudioContext
   });
  }catch{
   // If Chrome cannot decode a MediaRecorder format, keep the live F0 samples.
   $('recording-message').textContent='🎧 Запись можно послушать. Детальный анализ файла недоступен на этом устройстве.';
  }
 }
 const pitchFrames=offline?.frames?.length>frames.length?offline.frames:frames;
 const result=analyseContour(pitchFrames);
 $('your-path').setAttribute('d',plot(result.points));
 $('result').textContent=toneGuidance(tones[selected],result);
 const sound=offline?.signal;
 const hasSound=Boolean(sound?.hasAudibleSignal||(counts?.heard||0)>0);
 if(result.kind==='insufficient'){
  $('status').textContent=hasSound
   ?'Голос записан, но контур короткий или неустойчивый. Это НЕ значит, что ты неправильно сказал «'+tones[selected].py+'».'
   :'Во время попытки измеренный сигнал был слишком слабым или отсутствовал. Нажми «Послушать свой голос».';
 }else{
  $('status').textContent='Контур получен. Это измерение высоты голоса, а не оценка правильности китайского тона.';
 }
 $('mic-level-label').textContent=sound
  ?'🎤 Запись: '+sound.soundFrames+' звуковых кадров, '+sound.pitchFrames+' точек высоты голоса. '+(sound.hasAudibleSignal?'Звук есть.':'Звук не подтверждён.')
  :counts?.heard
   ?'🎤 Микрофон уловил звук: '+counts.heard+' измерений, высота определена в '+counts.voiced+'.'
   :'🎤 Данных микрофона для анализа недостаточно.';
 frames=[];counts=null;
 controls(false);$('record').disabled=false;stopping=false;
}
async function start(){
 if(opening||active||stopping)return;
 if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){
  $('status').textContent='Микрофон работает только по HTTPS в браузере с поддержкой записи.';
  return;
 }
 opening=true;discardRecordedAudio();controls(true);silencePlayback();
 $('status').textContent='Запрашиваю доступ к микрофону…';
 let newStream=null,newCtx=null;
 try{
  newStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:true},video:false});
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx)throw Error('AudioContext unavailable');
  newCtx=new AudioCtx();
  await newCtx.resume();
  const reader=newCtx.createAnalyser();reader.fftSize=4096;reader.smoothingTimeConstant=0;
  const input=newCtx.createMediaStreamSource(newStream);input.connect(reader);
  stream=newStream;audioCtx=newCtx;analyser=reader;source=input;
  active=true;frames=[];counts={readings:0,voiced:0,silent:0,heard:0,peakRms:0};
  recorder=null;recordedChunks=[];
  if(typeof MediaRecorder!=='undefined'){
   try{
    const capture=new MediaRecorder(newStream);
    capture.ondataavailable=e=>{if(e.data?.size>0)recordedChunks.push(e.data);};
    capture.start();
    recorder=capture;
   }catch{$('recording-message').textContent='Прослушивание записи недоступно. График всё ещё работает.';}
  }else $('recording-message').textContent='Браузер не поддерживает сохранение своего голоса. График доступен.';
  $('mic-level-fill').style.width='0%';
  $('mic-level-label').textContent='Жду звук от микрофона…';
  const buffer=new Float32Array(reader.fftSize),t0=performance.now();
  $('status').textContent='Произнеси «'+tones[selected].py+'» около секунды. Запись завершится автоматически.';
  interval=setInterval(()=>{
   if(!active||!analyser||!audioCtx)return;
   analyser.getFloatTimeDomainData(buffer);
   counts.readings++;
   let sq=0;for(let i=0;i<buffer.length;i+=4)sq+=buffer[i]*buffer[i];
   const rms=Math.sqrt(sq/(buffer.length/4));
   counts.peakRms=Math.max(counts.peakRms,rms);
   if(counts.readings%4===0){
    $('mic-level-fill').style.width=Math.round(Math.min(100,100*Math.sqrt(rms/.20)))+'%';
    $('mic-level-label').textContent=rms>=.006?'🎤 Микрофон получает звук':'🎤 Сигнал пока слабый';
   }
   if(rms<.006){counts.silent++;return;}
   counts.heard++;
   const p=estimatePitch(buffer,audioCtx.sampleRate);
   if(!p||p.clarity<=.78)return;
   counts.voiced++;
   frames.push({t:(performance.now()-t0)/1000,hz:p.hz,clarity:p.clarity});
  },28);
  deadline=setTimeout(()=>{void stop();},3100);
 }catch(e){
  try{newStream?.getTracks().forEach(t=>t.stop());}catch{}
  try{await newCtx?.close();}catch{}
  active=false;discardActiveCapture();
  controls(false);
  $('status').textContent=e?.name==='NotAllowedError'
   ?'Разреши микрофон для этого сайта в Chrome и попробуй снова.'
   :'Микрофон недоступен. Открой в Chrome, закрой другие приложения с записью.';
 }finally{opening=false;}
}
$('record').addEventListener('click',()=>{if(active)void stop();else void start();});
$('replay').addEventListener('click',async()=>{
 if(active||opening||stopping||!recordedUrl)return;
 if(recordedAudio&&!recordedAudio.paused){
  recordedAudio.pause();$('replay').textContent='🔊 Послушать свой голос';return;
 }
 if(!recordedAudio){
  recordedAudio=new Audio(recordedUrl);
  recordedAudio.onended=()=>{$('replay').textContent='🔊 Послушать свой голос';};
  recordedAudio.onerror=()=>{$('recording-message').textContent='Не удалось воспроизвести запись на этом устройстве.';};
 }
 try{
  recordedAudio.currentTime=0;
  await recordedAudio.play();
  $('replay').textContent='■ Остановить мой голос';
 }catch{$('recording-message').textContent='Не удалось воспроизвести запись. Проверь громкость телефона и попробуй ещё раз.';}
});
function shutdown(){
 silencePlayback();
 active=false;
 discardActiveCapture();discardRecordedAudio();
 void release();
}
window.addEventListener('message',e=>{
 if(e.origin===location.origin&&e.data==='panda-tone-modal-close')shutdown();
});
window.addEventListener('pagehide',shutdown);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&active){void stop();}});
updateTone(0);
