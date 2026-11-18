/* Panda Go HSK 1 — four-tone PRACTICE PILOT.
 * Local F0 contour visualization, NOT speech recognition or a tone grade.
 * Original lesson MP3s are played unchanged.
 */
import {estimatePitch, analyseContour} from './panda-tone-analytics-v457.mjs?v=462';
const $=id=>document.getElementById(id);
const tones=[
 {n:1,hz:'妈',py:'mā',src:'./assets/lesson1-xiaoxiao-v260/ma1.mp3',reference:'M30 62H332'},
 {n:2,hz:'麻',py:'má',src:'./assets/lesson1-xiaoxiao-v260/ma2.mp3',reference:'M30 109Q192 98 332 32'},
 {n:3,hz:'马',py:'mǎ',src:'./assets/lesson1-xiaoxiao-v260/ma3.mp3',reference:'M30 51Q174 133 332 63'},
 {n:4,hz:'骂',py:'mà',src:'./assets/lesson1-xiaoxiao-v260/ma4.mp3',reference:'M30 30Q178 45 332 111'}
];
const buttons=[...document.querySelectorAll('[data-tone]')];
let selected=0,playing=null,stream=null,audioCtx=null,analyser=null,source=null,interval=null,deadline=null,active=false,opening=false,frames=[],counts=null;
function silencePlayback(){
 if(playing){try{playing.pause();playing.currentTime=0;}catch{}playing=null;}
}
function updateTone(index){
 if(active||opening)return;
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
 if(!active)return;
 active=false;controls(false);
 await release();
 const result=analyseContour(frames);
 $('your-path').setAttribute('d',plot(result.points));
 $('result').textContent=toneGuidance(tones[selected],result);
 if(result.kind==='insufficient'){
  $('status').textContent='Не хватило устойчивого голоса. Попробуй ещё раз чуть протяжнее, в тишине.';
 } else {
  $('status').textContent='График получен. Это описание движения голоса, а не оценка правильности.';
 }
 frames=[];counts=null;
}
async function start(){
 if(opening||active)return;
 if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){
  $('status').textContent='Микрофон работает только по HTTPS в браузере с поддержкой записи.';
  return;
 }
 opening=true;controls(true);silencePlayback();
 $('status').textContent='Запрашиваю доступ к микрофону…';
 let newStream=null,newCtx=null;
 try{
  newStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx)throw Error('AudioContext unavailable');
  newCtx=new AudioCtx();
  await newCtx.resume();
  const reader=newCtx.createAnalyser();reader.fftSize=4096;reader.smoothingTimeConstant=0;
  const input=newCtx.createMediaStreamSource(newStream);input.connect(reader);
  stream=newStream;audioCtx=newCtx;analyser=reader;source=input;
  active=true;frames=[];counts={readings:0,voiced:0,silent:0};
  const buffer=new Float32Array(reader.fftSize),t0=performance.now();
  $('status').textContent='Произнеси «'+tones[selected].py+'» около секунды. Запись завершится автоматически.';
  interval=setInterval(()=>{
   if(!active||!analyser||!audioCtx)return;
   analyser.getFloatTimeDomainData(buffer);
   counts.readings++;
   let sq=0;for(let i=0;i<buffer.length;i+=4)sq+=buffer[i]*buffer[i];
   if(Math.sqrt(sq/(buffer.length/4))<.012){counts.silent++;return;}
   const p=estimatePitch(buffer,audioCtx.sampleRate);
   if(!p||p.clarity<=.78)return;
   counts.voiced++;
   frames.push({t:(performance.now()-t0)/1000,hz:p.hz,clarity:p.clarity});
  },28);
  deadline=setTimeout(()=>{void stop();},3100);
 }catch(e){
  try{newStream?.getTracks().forEach(t=>t.stop());}catch{}
  try{await newCtx?.close();}catch{}
  active=false;
  controls(false);
  $('status').textContent=e?.name==='NotAllowedError'
   ?'Разреши микрофон для этого сайта в Chrome и попробуй снова.'
   :'Микрофон недоступен. Открой в Chrome, закрой другие приложения с записью.';
 }finally{opening=false;}
}
$('record').addEventListener('click',()=>{if(active)void stop();else void start();});
window.addEventListener('message',e=>{
 if(e.origin===location.origin&&e.data==='panda-tone-modal-close'){silencePlayback();void release();}
});
window.addEventListener('pagehide',()=>{silencePlayback();void release();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&active){void stop();}});
updateTone(0);
