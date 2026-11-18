/* Panda Tone Lab v462: browser-only F0 monitoring, NO speech uploads, no ASR or scoring. */
import {estimatePitch,analyseContour} from './panda-tone-analytics-v457.mjs?v=462';
const $=id=>document.getElementById(id);
const choices=[...document.querySelectorAll('[data-tone]')];
let tone=2,stream=null,context=null,source=null,analyser=null,clock=null,deadline=null,active=false,opening=false,frames=[],lastDiagnostic=null,diagnostic=null;
const template2='M45 175 Q220 152 605 48',template3='M45 90 Q282 207 605 112';
function choose(n){
 if(active||opening)return;
 lastDiagnostic=null;$('copy-trace').disabled=true;
 tone=n;for(const b of choices)b.setAttribute('aria-pressed',String(Number(b.dataset.tone)===n));
 $('prompt').textContent=n===2?'Скажи «yú» одним слогом, протянув голос около 0,7–1,2 с.':'Скажи «yǔ» около 0,7–1,2 с: для отдельного 3-го тона попробуй опустить, затем поднять голос.';
 $('ref-path').setAttribute('d',n===2?template2:template3);
 $('your-path').setAttribute('d','');
 $('result').replaceChildren();
 const title=document.createElement('div'),tip=document.createElement('div');
 title.className='result-title';title.textContent='Готово к записи';
 tip.className='result-text';tip.textContent='Схема — ориентир, а не эталон индивидуальной высоты голоса.';
 $('result').append(title,tip);
}
choices.forEach(b=>b.addEventListener('click',()=>choose(Number(b.dataset.tone))));
function path(points){
 if(!points||points.length<2)return '';
 const last=points.at(-1).t||1;
 return points.map((p,i)=>{
  const x=45+560*p.t/last,y=Math.max(36,Math.min(194,111-17*p.st));
  return (i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1);
 }).join(' ');
}
function show(result){
 $('your-path').setAttribute('d',path(result.points));
 $('result').replaceChildren();
 const title=document.createElement('div'),info=document.createElement('div');
 title.className='result-title';title.textContent=result.label;
 info.className='result-text';
 let guidance=result.reason;
 if(result.kind==='rise'&&tone===3){
  guidance='В записи виден подъём, но он может быть только концом 3-го тона. Нельзя заключать, что ты произнёс yǔ неправильно; повтори отдельный слог и сравни несколько попыток.';
 }else if(result.kind==='fall'&&tone===3){
  guidance='Панда уловила нисходящий участок yǔ, но подъём не зафиксирован. Низкое/нисходящее произношение 3-го тона тоже встречается; попробуй более протяжный слог и сравни графики. Это не оценка ошибки.';
 }else if(result.kind==='rise'&&tone===2){
  guidance='Подъём похож на движение 2-го тона yú, но правильность всего слога по графику не определяется.';
 }else if(result.kind==='dip'&&tone===3){
  guidance='Видны снижение и подъём — один из вариантов 3-го тона yǔ в изоляции. Проверка качества самого звука ещё нужна.';
 }else if(result.kind==='dip'&&tone===2){
  guidance='Ты выбрал 2-й тон, но кривая показывает снижение и подъём. Попробуй yú плавно повышающимся голосом. Это не автоматическая оценка тона.';
 }
 info.textContent=guidance;
 $('result').append(title,info);
 const s=result.stats;
 if(s){
  const p=document.createElement('p');p.className='note';
  p.textContent='Голосовой фрагмент: '+s.duration+' с · чистых отсчётов: '+s.voicedFrames+(Number.isFinite(s.startToEndSt)?' · изменение: '+(s.startToEndSt>0?'+':'')+s.startToEndSt+' полутонов.':'. Данных пока мало.')+(s.octaveJumpCount>0?' Возможные ошибки октавы: '+s.octaveJumpCount+'.':'');
  $('result').append(p);
 }
}
async function release(){
 clearInterval(clock);clearTimeout(deadline);clock=null;deadline=null;
 try{source?.disconnect();}catch{}
 try{analyser?.disconnect();}catch{}
 stream?.getTracks().forEach(t=>t.stop());stream=null;source=null;analyser=null;
 try{await context?.close();}catch{}
 context=null;
}
async function stop(){
 if(!active)return;
 active=false;$('record').disabled=false;$('stop').disabled=true;
 choices.forEach(b=>b.disabled=false);
 const elapsed=diagnostic?Math.max(0,(performance.now()-diagnostic.startedAt)/1000):0;
 await release();
 const r=analyseContour(frames);
 const t0=frames.length?frames[0].t:0;
 lastDiagnostic={tone,syllable:tone===2?'yú':'yǔ',kind:r.kind,stats:r.stats||null,
  capture:diagnostic?{
   elapsedSec:+elapsed.toFixed(2),totalChecks:diagnostic.totalChecks,accepted:diagnostic.accepted,
   silence:diagnostic.silence,noStablePitch:diagnostic.noStablePitch,lowClarity:diagnostic.lowClarity,
   peakRms:+diagnostic.peakRms.toFixed(4),thresholdRms:0.012,
   firstSignalSec:diagnostic.firstSignalSec,lastSignalSec:diagnostic.lastSignalSec,
   firstPitchSec:diagnostic.firstPitchSec,lastPitchSec:diagnostic.lastPitchSec
  }:null,
  pitchHz:frames.map(x=>({t:+(x.t-t0).toFixed(3),hz:+x.hz.toFixed(1),clarity:+x.clarity.toFixed(2)}))};
 $('copy-trace').disabled=!(diagnostic?.totalChecks);
 show(r);
 if(r.kind==='insufficient'&&diagnostic?.totalChecks){
  const counts=document.createElement('p');counts.className='note';
  counts.textContent='Из '+diagnostic.totalChecks+' замеров: '+diagnostic.accepted+' точек высоты, '+
   diagnostic.silence+' тихих, '+diagnostic.noStablePitch+' без устойчивой частоты, '+
   diagnostic.lowClarity+' неуверенных. Длительность записи: '+elapsed.toFixed(2)+' с.'+
   (diagnostic.firstPitchSec!==null?' Высота голоса найдена с '+diagnostic.firstPitchSec.toFixed(2)+' до '+diagnostic.lastPitchSec.toFixed(2)+' с.':'');
  $('result').append(counts);
 }
 $('status').textContent=r.kind==='insufficient'?'Голоса было недостаточно для измерения. Попробуй ещё раз.':'Готово. Это подсказка по контуру, а не оценка тона.';
 $('mic-level').textContent='Запись завершена. Уровень сигнала показывается только во время записи.';
 frames=[];
}
$('stop').addEventListener('click',stop);
$('record').addEventListener('click',async()=>{
 if(active||opening)return;
 if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){
  $('status').textContent='Микрофон доступен только по HTTPS в поддерживаемом браузере.';return;
 }
 opening=true;$('record').disabled=true;$('status').textContent='Запрашиваю разрешение на микрофон…';
 let newStream=null,newContext=null;
 try{
  newStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx)throw new Error('AudioContext unavailable');
  newContext=new AudioCtx();await newContext.resume();
  const reader=newContext.createAnalyser();reader.fftSize=4096;reader.smoothingTimeConstant=0;
  const input=newContext.createMediaStreamSource(newStream);input.connect(reader);
  stream=newStream;context=newContext;analyser=reader;source=input;active=true;frames=[];lastDiagnostic=null;$('copy-trace').disabled=true;
  const buf=new Float32Array(reader.fftSize),t0=performance.now();
  diagnostic={startedAt:t0,totalChecks:0,accepted:0,silence:0,noStablePitch:0,lowClarity:0,peakRms:0,
  firstSignalSec:null,lastSignalSec:null,firstPitchSec:null,lastPitchSec:null};
  $('record').disabled=true;$('stop').disabled=false;choices.forEach(b=>b.disabled=true);
  $('status').textContent='Микрофон включён. Говори около секунды и дождись автоматического завершения (3 с).';
  $('mic-level').textContent='Жду звук…';
  clock=setInterval(()=>{
   if(!active||!analyser||!context)return;
   analyser.getFloatTimeDomainData(buf);
   diagnostic.totalChecks++;
   const nowSec=(performance.now()-t0)/1000;
   // Independent energy meter lets us separate quiet frames from unstable pitch estimates.
   // No raw sound or waveform is kept, only aggregate counts.
   let energy=0,samples=0;
   for(let i=0;i<buf.length;i+=4){energy+=buf[i]*buf[i];samples++;}
   const rms=Math.sqrt(energy/samples);
   diagnostic.peakRms=Math.max(diagnostic.peakRms,rms);
   if(diagnostic.totalChecks%5===0){
    $('mic-level').textContent=rms<.012?'Сигнал тихий: говори ближе к микрофону.':'Сигнал слышен: продолжай произносить слог.';
   }
   if(rms<.012){diagnostic.silence++;return;}
   if(diagnostic.firstSignalSec===null)diagnostic.firstSignalSec=+nowSec.toFixed(3);
   diagnostic.lastSignalSec=+nowSec.toFixed(3);
   const p=estimatePitch(buf,context.sampleRate);
   if(!p){diagnostic.noStablePitch++;return;}
   if(p.clarity<=.78){diagnostic.lowClarity++;return;}
   diagnostic.accepted++;
   if(diagnostic.firstPitchSec===null)diagnostic.firstPitchSec=+nowSec.toFixed(3);
   diagnostic.lastPitchSec=+nowSec.toFixed(3);
   frames.push({t:nowSec,hz:p.hz,clarity:p.clarity});
  },28);
  deadline=setTimeout(stop,3100);
 }catch(error){
  newStream?.getTracks().forEach(t=>t.stop());
  try{await newContext?.close();}catch{}
  active=false;$('record').disabled=false;$('stop').disabled=true;
  $('status').textContent=error?.name==='NotAllowedError'?'Разреши микрофон в настройках Chrome и попробуй снова.':'Микрофон недоступен. Попробуй Chrome и закрой другие приложения с записью.';
   $('mic-level').textContent='Нет сигнала с микрофона.';
 }finally{opening=false;}
});
// Export pitch/time numbers only, by an explicit user click. Never export raw sound.
$('copy-trace').addEventListener('click',async()=>{
 if(!lastDiagnostic)return;
 try{
  if(!navigator.clipboard?.writeText)throw new Error('Clipboard not available');
  await navigator.clipboard.writeText(JSON.stringify(lastDiagnostic));
  $('status').textContent='Данные высоты голоса скопированы (без звука). Можешь прислать их для диагностики.';
 }catch{
  $('status').textContent='Не удалось скопировать автоматически. В Chrome разреши буфер обмена или пришли скриншот.';
 }
});
window.addEventListener('pagehide',()=>{
 clearInterval(clock);clearTimeout(deadline);
 stream?.getTracks().forEach(t=>t.stop());
 if(context)context.close().catch(()=>{});
});
