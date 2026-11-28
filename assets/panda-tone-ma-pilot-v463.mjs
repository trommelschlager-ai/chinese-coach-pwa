/* Panda Go HSK 1 — four-tone PRACTICE PILOT.
 * Local F0 contour visualization, NOT speech recognition or a tone grade.
 * Original lesson MP3s are played unchanged.
 */
import {estimatePitch, analyseContour} from './panda-tone-analytics-v457.mjs?v=468';
import {analyseRecordedBlob} from './panda-tone-recording-analysis-v465.mjs?v=467';
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
 $('ref-path').setAttribute('d',referenceForTone(selected));
 $('your-path').setAttribute('d','');
 $('segment-info').textContent='Новая попытка ещё не записана.';
 $('result').textContent='После произношения здесь появится результат наблюдения.';
 $('status').textContent='Выбран '+s.py+'. Нажми «Слушать образец», затем «Произнести».';
 buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected)));
}
buttons.forEach((b,i)=>b.addEventListener('click',()=>updateTone(i)));
$('next').addEventListener('click',()=>updateTone(selected+1));
$('listen').addEventListener('click',async()=>{
 if(active||opening||stopping)return;
 try{recordedAudio?.pause();}catch{}
 $('replay').textContent='🔊 Послушать свой голос';
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
const PLOT_SECONDS=1.2; // do not stretch 0.2s of voice to the width of a 1.2s axis
function referenceForTone(index,seconds=.4){
 const span=Math.max(.22,Math.min(1.2,Number.isFinite(seconds)?seconds:.4));
 const end=30+302*span/1.2,mid=30+(end-30)*.53;
 const x=n=>n.toFixed(1);
 if(index===0)return 'M30 70H'+x(end);
 if(index===1)return 'M30 101Q'+x(mid)+' 87 '+x(end)+' 43';
 if(index===2)return 'M30 59Q'+x(mid)+' 125 '+x(end)+' 68';
 return 'M30 44Q'+x(mid)+' 65 '+x(end)+' 108';
}
function plot(points){
 if(!points||points.length<2)return '';
 const first=points[0].t;
 return points.map((p,i)=>{
  const elapsed=Math.max(0,p.t-first);
  const x=30+302*Math.min(1,elapsed/PLOT_SECONDS);
  const y=Math.max(25,Math.min(117,70-13*p.st));
  return (i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1);
 }).join(' ');
}
function toneGuidance(s,result){
 const measured=result.kind;
 const short=measured==='insufficient'&&result.stats?.previewOnly===true&&result.stats?.octaveJumpCount===0&&result.shapeHint?.confidence==='exploratory'&&result.shapeHint?.isToneGrade===false;
 const kind=short?result.shapeHint.direction:measured;
 if(!['level','rise','dip','fall'].includes(kind))return result.label+'. '+result.reason;
 const observation={level:'Высота почти ровная.',rise:'Высота повышается.',dip:'Высота снижается, затем повышается.',fall:'Высота снижается.'}[kind];
 const practice={1:'Удерживай голос ровно в комфортной верхней части своего диапазона.',2:'Начни со средней высоты и плавно подними голос к концу.',3:'Для отдельного mǎ опусти голос, затем мягко подними. В связной речи подъём часто отсутствует.',4:'Начни выше и быстро опусти голос, не усиливая громкость.'}[s.n];
 const expected={1:'level',2:'rise',3:'dip',4:'fall'}[s.n];
 const comparison=kind===expected?'Движение похоже на учебную схему.':s.n===3&&kind==='fall'?'Нисходящий участок возможен у третьего тона; отсутствие подъёма само по себе не ошибка.':'Попробуй другое движение: '+practice;
 const caution=short?'Короткий слог: наблюдение предварительное.':'По высоте нельзя подтвердить правильность слога или тона.';
 return observation+' '+comparison+' '+caution;
}
function captureGuidance(s,result,sound,partialPreview){
 if(result.stats?.octaveJumpCount>0)
  return 'Обнаружен резкий скачок измеренной частоты. Это может быть сбой анализатора, а не ошибка произношения. '+(partialPreview.length?'Показан только устойчивый фрагмент. ':'')+'Послушай запись или повтори естественным голосом.';
 if(result.stats?.gapCount>0)
  return 'В измерениях высоты есть пропуски. Это не означает ошибку произношения. '+(partialPreview.length?'Показан только устойчивый фрагмент. ':'')+'Послушай запись или повтори естественным голосом.';
 if(sound?.discardedOtherRegions>0)
  return 'Обнаружено несколько отдельных звуковых участков. Анализатор выделил только один из них; движение всего слога не подтверждено. Для слов и предложений используй тренировку свободной фразы.';
 // Match the conservative fallback proportion already used for reference plots.
 // Keep measured points visible, but do not coach from a fallback-heavy trace.
 if(sound?.pitchFrames>0&&sound.fallbackPitchFrames/sound.pitchFrames>.4)
  return 'Высота измерена частично резервным методом ('+Math.round(100*sound.fallbackPitchFrames/sound.pitchFrames)+'% точек). Движение тона пока не подтверждено. Это не означает ошибку произношения. Послушай свою запись и образец.';
 if(partialPreview.length&&!result.points?.length)
  return 'Часть высоты голоса измерена. Линия неполная, оценивать китайский тон пока нельзя.';
 return toneGuidance(s,result);
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
 // Prefer the exact decoded recording with silence trimmed. Only fall back to
 // live samples when the saved recording cannot be decoded on this device.
 const pitchFrames=offline?.available?offline.frames:frames;
 const result=analyseContour(pitchFrames);
 const partialPreview=(result.kind==='insufficient'||result.kind==='uncertain')?offline?.preview||[]:[];
 const displayPoints=result.points?.length?result.points:partialPreview;
 $('your-path').setAttribute('d',plot(displayPoints));
 const sound=offline?.signal;
 $('result').textContent=captureGuidance(tones[selected],result,sound,partialPreview);
 $('ref-path').setAttribute('d',referenceForTone(selected,sound?.syllableDurationSec));
 $('segment-info').textContent=sound?.syllableDurationSec
  ?'Найден звуковой фрагмент: '+sound.syllableDurationSec.toFixed(2)+' с. График использует реальную шкалу времени 0–1,2 с.'
  :'Продолжительность произнесённого слога пока не определена.';
 const hasSound=Boolean(sound?.hasAudibleSignal||(counts?.heard||0)>0);
 if(result.kind==='insufficient'){
  $('status').textContent=hasSound
   ?'Голос записан. Короткий слог — нормально. Измерение не означает, что слово произнесено правильно или неправильно.'
   :'Во время попытки измеренный сигнал был слишком слабым или отсутствовал. Нажми «Послушать свой голос».';
 }else{
  $('status').textContent='Контур получен. Это измерение высоты голоса, а не оценка правильности китайского тона.';
 }
 $('mic-level-label').textContent=sound
  ?'🎤 Записан звук: '+sound.soundFrames+' кадров, '+sound.pitchFrames+' точек высоты ('+sound.fallbackPitchFrames+' уточнены резервным методом). '+(sound.hasAudibleSignal?'Голос обнаружен.':'Звук не подтверждён.')
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
  $('status').textContent='Произнеси «'+tones[selected].py+'» как обычно, коротко. Запись завершится автоматически.';
  interval=setInterval(()=>{
   if(!active||!analyser||!audioCtx)return;
   analyser.getFloatTimeDomainData(buffer);
   counts.readings++;
   let sq=0;for(let i=0;i<buffer.length;i+=4)sq+=buffer[i]*buffer[i];
   const rms=Math.sqrt(sq/(buffer.length/4));
   counts.peakRms=Math.max(counts.peakRms,rms);
   if(counts.readings%4===0){
    $('mic-level-fill').style.width=Math.round(Math.min(100,100*Math.sqrt(rms/.20)))+'%';
    $('mic-level-label').textContent=rms>=.006
     ?'🎤 Звук поступает в микрофон'
     :counts.heard>=2
       ?'🎤 Голос уже был обнаружен. Проверяю запись…'
       :'🎤 Жду голосовой сигнал';
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
 silencePlayback();
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
