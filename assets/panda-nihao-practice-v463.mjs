/* 你好 guided practice v463.
 * Approved Panda voice sample (exact 你好) + on-device mic only.
 * No ASR, backend upload, storage, or automatic tone grades.
 */
import {lookupPandaVoiceClip} from './panda-live-audio.mjs?v=451';
import {estimatePitch,analyseContour,findOctaveDiscontinuities,semitones} from './panda-tone-analytics-v457.mjs?v=462';
const $=id=>document.getElementById(id);
const stages=[
 {hanzi:'你',pinyin:'ní ↗',type:'rising',note:'Внутри 你好 первый слог читается ní с подъёмом. Если сказать отдельно 你, это nǐ (третий тон).',reference:'M42 178 Q280 159 581 48'},
 {hanzi:'好',pinyin:'hǎo · низкий тон',type:'third',note:'Произнеси hǎo низко. В связной речи третий тон не обязан заметно подниматься к концу.',reference:'M42 86 Q245 186 581 126'},
 {hanzi:'你好',pinyin:'ní hǎo',type:'pair',note:'Скажи приветствие целиком: ní (подъём) + hǎo (низко). Сначала послушай запись Панды.',reference:'M42 160 Q158 55 280 82 Q410 175 581 136'}
];
let stage=0,active=false,opening=false,stream=null,audioContext=null,input=null,analyser=null,timer=null,deadline=null,recorder=null,voiceChunks=[],voiceUrl=null,frames=[],metrics=null,lastTrace=null,referenceAudio=null;
const selector=[...document.querySelectorAll('[data-stage]')];
function clearMyPlayback(){
 const player=$('playback');
 player.pause();player.hidden=true;player.removeAttribute('src');player.load();
 if(voiceUrl){URL.revokeObjectURL(voiceUrl);voiceUrl=null;}
}
function select(i){
 if(active||opening)return;
 stage=i;clearMyPlayback();lastTrace=null;$('copy-data').disabled=true;
 selector.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.stage)===stage)));
 const s=stages[i];
 $('step-hanzi').textContent=s.hanzi;
 $('step-pinyin').textContent=s.pinyin;
 $('tip').textContent=s.note;
 $('reference').setAttribute('d',s.reference);
 $('measured').setAttribute('d','');
 $('feedback').textContent=i===2?'Слушай 你好 и повторяй целиком. Мы покажем запись, но не будем оценивать два тона одним алгоритмом.':'Произнеси выбранный слог примерно 0,7–1,2 секунды.';
 $('status').textContent='Нажми «Записать». Микрофон выключится автоматически через 3 секунды.';
 $('level').textContent='Звук обрабатывается только на устройстве.';
}
selector.forEach(b=>b.addEventListener('click',()=>select(Number(b.dataset.stage))));
$('listen').addEventListener('click',async()=>{
 const clip=lookupPandaVoiceClip('你好');
 if(!clip?.src){$('audio-status').textContent='Точная запись 你好 пока недоступна.';return;}
 try{
  if(referenceAudio){referenceAudio.pause();referenceAudio.currentTime=0;}
  referenceAudio=new Audio(new URL(clip.src,document.baseURI).href);
  $('audio-status').textContent='Воспроизвожу утверждённую запись Панды.';
  await referenceAudio.play();
 }catch{
  $('audio-status').textContent='Chrome не разрешил звук. Нажми 🔊 ещё раз.';
 }
});
function calculateRawContour(pts){
 if(pts.length<12)return '';
 const jumps=findOctaveDiscontinuities(pts);
 if(jumps.length)return '';
 const hz=pts.map(x=>x.hz).sort((a,b)=>a-b);
 const mid=hz[Math.floor(hz.length/2)];
 const duration=Math.max(.01,pts.at(-1).t-pts[0].t);
 return pts.map((p,i)=>{
   const x=42+(p.t-pts[0].t)*539/duration;
   const y=Math.max(32,Math.min(189,111-17*semitones(p.hz,mid)));
   const separate=i===0||p.t-pts[i-1].t>.16;
   return (separate?'M':'L')+x.toFixed(1)+' '+y.toFixed(1);
 }).join(' ');
}
async function release(){
 clearInterval(timer);clearTimeout(deadline);timer=null;deadline=null;
 try{if(recorder&&recorder.state!=='inactive')recorder.stop();}catch{}
 try{input?.disconnect();}catch{}
 try{analyser?.disconnect();}catch{}
 stream?.getTracks().forEach(t=>t.stop());
 stream=null;input=null;analyser=null;recorder=null;
 try{await audioContext?.close();}catch{}
 audioContext=null;
}
function displayResult(contour){
 let message;
 if(stage===2){
  const jumps=findOctaveDiscontinuities(frames).length;
  $('measured').setAttribute('d',calculateRawContour(frames));
  message=jumps?'Частота голоса местами скачет почти вдвое — график скрыт. Послушай свою запись и запись Панды.':'Прослушай свою запись и сравни с Пандой: ní hǎo. График всей фразы не разделяет слоги и не оценивает тоны.';
 }else{
  $('measured').setAttribute('d',contour.points?.length?contour.points.map((p,i)=>{const x=42+(p.t/(contour.points.at(-1).t||1))*539,y=Math.max(32,Math.min(189,111-17*p.st));return (i===0?'M':'L')+x.toFixed(1)+' '+y.toFixed(1);}).join(' '):'');
  if(contour.kind==='insufficient')message='Обнаружено слишком мало устойчивого голоса. Произнеси один слог чуть протяжнее и попробуй снова.';
  else if(contour.kind==='uncertain')message='Измерение неоднозначно: частота может скакать из-за микрофона. По этому графику нельзя оценить тон.';
  else if(stage===0&&contour.kind==='rise')message='Видно восходящее движение, похожее на ní в составе 你好. Но качество китайского звука по одной кривой не проверяется.';
  else if(stage===1&&(contour.kind==='fall'||contour.kind==='dip'))message='Видно низкое/нисходящее движение, допустимое для третьего тона hǎo в речи. Это не автоматическая оценка произношения.';
  else message='График получен. Сравни движение с учебным пунктиром и повтори. Панда пока не оценивает правильность тона.';
 }
 $('feedback').textContent=message;
}
async function stop(){
 if(!active)return;
 active=false;
 $('record').disabled=false;$('stop').disabled=true;
 selector.forEach(b=>b.disabled=false);
 const result=stage===2?null:analyseContour(frames);
 const first=frames.length?frames[0].t:0;
 lastTrace={
  phrase:stage===2?'你好':stages[stage].hanzi,
  spokenPinyin:stage===0?'ní (перед hǎo)':stage===1?'hǎo':'ní hǎo',
  stage:stage+1,
  mode:stage===2?'whole-phrase-no-tone-grade':'single-syllable-contour-only',
  kind:result?.kind||'not-graded',
  capture:metrics?{elapsedSec:+((performance.now()-metrics.started)/1000).toFixed(2),total:metrics.total,voiced:frames.length,quiet:metrics.quiet,unstable:metrics.unstable,octaveJumps:findOctaveDiscontinuities(frames).length}:null,
  pitchHz:frames.map(x=>({t:+(x.t-first).toFixed(3),hz:+x.hz.toFixed(1)}))
 };
 displayResult(result);
 $('copy-data').disabled=false;
 await release();
 $('level').textContent='Микрофон выключен. Запись остаётся только в этом браузере.';
 $('status').textContent='Готово. Сравни произношение с записью Панды. Автоматической оценки тонов нет.';
 frames=[];
}
$('stop').addEventListener('click',stop);
$('record').addEventListener('click',async()=>{
 if(active||opening)return;
 if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){
  $('status').textContent='Для записи открой страницу по HTTPS в Chrome.';return;
 }
 opening=true;$('record').disabled=true;
 let pendingStream=null,pendingContext=null;
 try{
  pendingStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context)throw new Error('Web Audio unsupported');
  pendingContext=new Context();await pendingContext.resume();
  stream=pendingStream;audioContext=pendingContext;
  analyser=audioContext.createAnalyser();analyser.fftSize=4096;
  input=audioContext.createMediaStreamSource(stream);input.connect(analyser);
  clearMyPlayback();lastTrace=null;$('copy-data').disabled=true;
  voiceChunks=[];recorder=null;
  if(typeof MediaRecorder!=='undefined'){
   try{
    const options=MediaRecorder.isTypeSupported('audio/webm;codecs=opus')?{mimeType:'audio/webm;codecs=opus'}:undefined;
    recorder=new MediaRecorder(stream,options);
    recorder.addEventListener('dataavailable',e=>{if(e.data?.size>0)voiceChunks.push(e.data);});
    recorder.addEventListener('stop',()=>{
     if(!voiceChunks.length)return;
     const blob=new Blob(voiceChunks,{type:recorder?.mimeType||'audio/webm'});
     voiceUrl=URL.createObjectURL(blob);
     $('playback').src=voiceUrl;$('playback').hidden=false;
     voiceChunks=[];
    },{once:true});
    recorder.start();
   }catch{recorder=null;}
  }
  active=true;frames=[];
  const firstTick=performance.now();
  metrics={started:firstTick,total:0,quiet:0,unstable:0};
  const buf=new Float32Array(analyser.fftSize);
  selector.forEach(b=>b.disabled=true);
  $('stop').disabled=false;$('record').disabled=true;
  $('status').textContent='Микрофон включён! Произнеси выбранный слог или фразу, затем дождись окончания 3 секунд.';
  $('level').textContent='Слушаю…';
  timer=setInterval(()=>{
    if(!active||!analyser||!audioContext)return;
    analyser.getFloatTimeDomainData(buf);
    metrics.total++;
    let e=0;for(let i=0;i<buf.length;i+=4)e+=buf[i]*buf[i];
    const rms=Math.sqrt(e/(buf.length/4));
    if(metrics.total%6===0)$('level').textContent=rms<.012?'Слабый сигнал. Говори чуть ближе к микрофону.':'Сигнал слышен.';
    if(rms<.012){metrics.quiet++;return;}
    const p=estimatePitch(buf,audioContext.sampleRate);
    if(!p||p.clarity<=.78){metrics.unstable++;return;}
    frames.push({t:(performance.now()-firstTick)/1000,hz:p.hz});
  },28);
  deadline=setTimeout(stop,3100);
 }catch(err){
  pendingStream?.getTracks().forEach(t=>t.stop());
  try{await pendingContext?.close();}catch{}
  $('status').textContent=err?.name==='NotAllowedError'?'Разреши микрофон для Chrome.':'Микрофон не удалось запустить. Попробуй Chrome.';
  $('record').disabled=false;$('stop').disabled=true;
 }finally{opening=false;}
});
$('copy-data').addEventListener('click',async()=>{
 if(!lastTrace)return;
 try{
  await navigator.clipboard.writeText(JSON.stringify(lastTrace));
  $('status').textContent='Измеренные точки скопированы без аудио.';
 }catch{
  $('status').textContent='Не получилось скопировать. Можешь прислать скриншот.';
 }
});
window.addEventListener('pagehide',()=>{
 clearInterval(timer);clearTimeout(deadline);
 try{if(recorder&&recorder.state!=='inactive')recorder.stop();}catch{}
 stream?.getTracks().forEach(t=>t.stop());
 try{audioContext?.close();}catch{}
 referenceAudio?.pause();
 if(voiceUrl)URL.revokeObjectURL(voiceUrl);
});
