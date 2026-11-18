/* Panda Tone Lab v457: browser-only F0 monitoring, NO speech uploads, no ASR or scoring. */
import {estimatePitch,analyseContour} from './panda-tone-analytics-v457.mjs?v=457';
const $=id=>document.getElementById(id);
const choices=[...document.querySelectorAll('[data-tone]')];
let tone=2,stream=null,context=null,source=null,analyser=null,clock=null,deadline=null,active=false,opening=false,frames=[];
const template2='M45 175 Q220 152 605 48',template3='M45 90 Q282 207 605 112';
function choose(n){
 if(active||opening)return;
 tone=n;for(const b of choices)b.setAttribute('aria-pressed',String(Number(b.dataset.tone)===n));
 $('prompt').textContent=n===2?'Скажи «yú» одним слогом. Не произноси перевод или длинное предложение.':'Скажи «yǔ» одним слогом. Для отдельного 3-го тона попробуй опустить и затем поднять голос.';
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
 info.className='result-text';info.textContent=result.reason;
 $('result').append(title,info);
 const s=result.stats;
 if(s){
  const p=document.createElement('p');p.className='note';
  p.textContent='Запись: '+s.duration+' с · чистых отсчётов: '+s.voicedFrames+' · изменение: '+(s.startToEndSt>0?'+':'')+s.startToEndSt+' полутонов.';
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
 await release();
 const r=analyseContour(frames);
 show(r);
 $('status').textContent=r.kind==='insufficient'?'Голоса было недостаточно для измерения. Попробуй ещё раз.':'Готово. Это подсказка по контуру, а не оценка тона.';
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
  stream=newStream;context=newContext;analyser=reader;source=input;active=true;frames=[];
  const buf=new Float32Array(reader.fftSize),t0=performance.now();
  $('record').disabled=true;$('stop').disabled=false;choices.forEach(b=>b.disabled=true);
  $('status').textContent='Говори один слог протяжно. Микрофон активен (до 3 сек.).';
  clock=setInterval(()=>{
   if(!active||!analyser||!context)return;
   analyser.getFloatTimeDomainData(buf);
   const p=estimatePitch(buf,context.sampleRate);
   if(p&&p.clarity>.78)frames.push({t:(performance.now()-t0)/1000,hz:p.hz});
  },38);
  deadline=setTimeout(stop,3100);
 }catch(error){
  newStream?.getTracks().forEach(t=>t.stop());
  try{await newContext?.close();}catch{}
  active=false;$('record').disabled=false;$('stop').disabled=true;
  $('status').textContent=error?.name==='NotAllowedError'?'Разреши микрофон в настройках Chrome и попробуй снова.':'Микрофон недоступен. Попробуй Chrome и закрой другие приложения с записью.';
 }finally{opening=false;}
});
window.addEventListener('pagehide',()=>{
 clearInterval(clock);clearTimeout(deadline);
 stream?.getTracks().forEach(t=>t.stop());
 if(context)context.close().catch(()=>{});
});
