/* Panda Go HSK2 · Урок 3 · тональный тренажёр. Только локальный анализ микрофона. */
(function(){
'use strict';
const KEY='pg-hsk2-l3-tone-trainer-v1';
const TONES=[[1,1],[2,4],[2,4],[2,2],[4,3],[4,1]];
const LIMIT=5;
let state={selected:0,reps:Array.from({length:6},()=>({mic:[],manual:0}))};
let active=null, seq=0, memo=null, note='Нажми «Записать произношение», скажи слово и посмотри на зелёную линию.';
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function readState(){
 try{
  const old=JSON.parse(localStorage.getItem(KEY)||'null');
  if(!old||typeof old!=='object')return;
  state.selected=Number.isInteger(old.selected)&&old.selected>=0&&old.selected<6?old.selected:0;
  if(Array.isArray(old.reps))for(let i=0;i<6;i++){
   const item=old.reps[i]||{},mic=Array.isArray(item.mic)?item.mic.slice(0,LIMIT):[];
   const clean=mic.filter(t=>t&&Array.isArray(t.points)&&t.points.length>=8).map(t=>({
      points:t.points.slice(0,100).filter(p=>Array.isArray(p)&&p.length===2&&p.every(finite)&&p[0]>=0&&p[0]<=1&&p[1]>=55&&p[1]<=650),
      seconds:finite(t.seconds)?Math.max(0,Math.min(8,t.seconds)):0
   })).filter(t=>t.points.length>=8);
   state.reps[i]={mic:clean,manual:Math.min(LIMIT-clean.length,Math.max(0,Number.isInteger(item.manual)?item.manual:0))};
  }
 }catch{}
}
readState();
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
function count(i){const r=state.reps[i];return Math.min(LIMIT,r.mic.length+r.manual)}
function total(){return state.reps.reduce((sum,r,i)=>sum+count(i),0)}
function progressText(){return total()+' / 30'}
function micCount(){return state.reps.reduce((sum,r)=>sum+r.mic.length,0)}
function tr(tones){return tones.map(x=>['','1 — ровный','2 — восходящий','3 — нисходяще-восходящий','4 — нисходящий'][x])}
function esc(x){return String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function render(words,art,heading,panel,ttsNote){
 memo={words,art,heading,panel,ttsNote};
 const i=state.selected,w=words[i],r=state.reps[i];
 const rows=words.map((word,index)=>{
  const n=count(index),selected=index===i;
  return '<div class="tone-word'+(selected?' tone-chosen':'')+'">'+
    '<div class="tone-word-words"><div class="cn" lang="zh-Hans">'+word.zh+'</div><div class="py">'+word.py+'</div>'+
    '<div class="ru">'+word.ru+' · '+word.tones+'</div></div>'+
    '<div class="tone-word-action"><span class="tone-count" aria-label="Повторений '+n+' из пяти">'+
    (n===5?'✓ ':'')+n+' / 5</span><button type="button" class="action" data-tone-act="select" data-i="'+index+'" aria-pressed="'+selected+'">'+
    (selected?'Выбрано':'Тренировать')+'</button></div></div>';
 }).join('');
 const last=r.mic.length?r.mic[r.mic.length-1]:null;
 const bullets=Array.from({length:LIMIT},(_,k)=>'<span class="tone-bullet'+(k<count(i)?' done':'')+'">'+(k<count(i)?'✓':(k+1))+'</span>').join('');
 return panel(
  heading('Произношение и тоны','Шаг 4 / 8 · Каждый из 6 слов повтори 5 раз. Это тренировка памяти и контуров тонов.')+
  art(5)+
  '<p>Нажми «Тренировать» напротив слова. При записи с микрофона появится линия <b>реальной высоты твоего голоса</b>. Сравни её с пунктирным образцом.</p>'+
  '<div class="tone-overall"><strong>Повторения: '+progressText()+'</strong><span>С микрофоном: '+micCount()+'</span></div>'+
  '<div class="meter"><i style="width:'+(total()/30*100)+'%"></i></div>'+ 
  '<div class="tone-jump-wrap"><button class="action" type="button" data-tone-act="jump">📈 Открыть шкалу тонов ↓</button></div>'+
  rows+
  '<p class="hint">Пять отметок подтверждают повторения, но не означают, что все тоны произнесены правильно.</p>'
 )+
 panel(
  '<div id="tone-trainer" class="tone-trainer"><div class="eyebrow">🎙 Тренировка слова '+(i+1)+' / 6</div>'+
  '<div class="tone-title"><div><div class="cn" lang="zh-Hans">'+w.zh+'</div><div class="py">'+w.py+'</div><div class="ru">'+w.ru+'</div></div>'+
  '<div class="tone-dots" aria-label="Количество повторений">'+bullets+'</div></div>'+
  '<p class="hint">'+esc(tr(TONES[i]).join('; '))+'. Образец — схема высоты тонов, не запись носителя.</p>'+
  '<canvas id="tone-canvas" role="img" aria-label="График высоты голоса: пунктир — примерные контуры двух тонов, зелёная линия — измеренный голос" width="420" height="220"></canvas>'+
  '<div class="tone-legend"><span class="tone-legend-target">Пунктир — образец тонов</span><span class="tone-legend-user">Зелёная — твой голос</span></div>'+
  '<div id="tone-status" class="tone-status" role="status" aria-live="polite">'+esc(note)+'</div>'+
  '<div class="btnrow tone-actions"><button id="tone-record" class="primary" type="button" data-tone-act="record" '+(count(i)>=LIMIT?'disabled':'')+'>'+
    '🎙 Записать произношение</button>'+
  '<button type="button" class="action" data-tone-act="manual" '+(count(i)>=LIMIT?'disabled':'')+'>✓ Повторил без микрофона</button></div>'+
  '<div class="tone-aux"><button class="action" type="button" data-tone-act="clear">↻ Сбросить повторы слова</button></div>'+
  '<p class="hint">Разреши доступ к микрофону. Фоновый шум мешает измерению. Анализ идёт на устройстве: звук не отправляется на сервер и не сохраняется. '+
  'Линия показывает только высоту голоса: она <b>не распознаёт китайские слоги и не ставит оценку точности тонов</b>. '+
  'Граница двух слогов в эталоне условная; для точной проверки нужна проверенная запись носителя и речевая модель.</p>'+
  (last?'<p class="hint">Последнее измерение: '+last.seconds.toFixed(1)+' с · '+last.points.length+' измерений высоты голоса.</p>':'')+
  ttsNote+'</div>'
 );
}
function median(a){const b=a.slice().sort((x,y)=>x-y),n=b.length;return n?b[Math.floor(n/2)]:0}
function draw(){
 const canvas=document.getElementById('tone-canvas');if(!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const w=canvas.width,h=canvas.height,padL=45,padR=18,padT=22,padB=29;
 const pw=w-padL-padR,ph=h-padT-padB;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#fffaff';ctx.fillRect(0,0,w,h);
 ctx.font='16px system-ui';ctx.fillStyle='#765477';ctx.textBaseline='middle';
 for(let k=0;k<5;k++){
   const y=padT+ph*k/4;
   ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(w-padR,y);
   ctx.strokeStyle='#ecd3ed';ctx.lineWidth=1;ctx.setLineDash([]);ctx.stroke();
 }
 ctx.fillText('↑',15,padT+5);ctx.fillText('↓',15,h-padB-5);
 const xmid=padL+pw/2;
 ctx.beginPath();ctx.moveTo(xmid,padT);ctx.lineTo(xmid,padT+ph);
 ctx.setLineDash([4,5]);ctx.strokeStyle='#dbbfdc';ctx.stroke();
 ctx.setLineDash([]);ctx.fillStyle='#803d83';ctx.textAlign='center';
 ctx.fillText('слог 1',padL+pw/4,h-11);ctx.fillText('слог 2',padL+3*pw/4,h-11);
 ctx.textAlign='left';
 // Контур условный; он не вычислен из записи носителя.
 const shapes={1:[.26,.26],2:[.72,.20],3:[.57,.82,.40],4:[.17,.84]};
 const tones=TONES[state.selected];
 ctx.lineWidth=4;ctx.strokeStyle='#9d50ca';ctx.setLineDash([12,7]);
 for(let syll=0;syll<2;syll++){
  const shape=shapes[tones[syll]];
  ctx.beginPath();
  for(let k=0;k<=44;k++){
   const u=k/44,v=u*(shape.length-1),ind=Math.min(shape.length-2,Math.floor(v));
   const val=shape[ind]+(shape[ind+1]-shape[ind])*(v-ind);
   const x=padL+pw*(syll+u)/2,y=padT+ph*val;
   if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.stroke();
 }
 ctx.setLineDash([]);
 const take=active?.word===state.selected?active.samples:state.reps[state.selected].mic.at(-1)?.points||[];
 if(take.length<2)return;
 const hz=take.map(x=>x[1]).filter(finite),mid=median(hz);if(!mid)return;
 const first=take[0][0],last=take[take.length-1][0],span=Math.max(.001,last-first);
 ctx.strokeStyle='#198b70';ctx.lineWidth=4;ctx.beginPath();
 for(let k=0;k<take.length;k++){
  const x=padL+pw*.98*(take[k][0]-first)/span;
  const semis=12*Math.log2(take[k][1]/mid);
  const y=padT+ph*Math.max(.08,Math.min(.92,.5-semis/16));
  if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
 }
 ctx.stroke();
}
function mount(){draw();syncControls()}
function status(message){note=message;const el=document.getElementById('tone-status');if(el)el.textContent=message}
function syncControls(){
 const btn=document.getElementById('tone-record');if(!btn)return;
 const running=active&&active.word===state.selected;
 btn.textContent=running?'■ Закончить запись':'🎙 Записать произношение';
 btn.disabled=!running&&count(state.selected)>=LIMIT;
}
function update(){
 if(!memo)return;
 const root=document.getElementById('content');if(!root||!document.getElementById('tone-trainer'))return;
 const scroll=root.scrollTop;
 root.innerHTML=render(memo.words,memo.art,memo.heading,memo.panel,memo.ttsNote);
 root.scrollTop=scroll;mount();
}
function pitchOf(buf,rate,previous){
 let rms=0;for(let i=0;i<buf.length;i+=4)rms+=buf[i]*buf[i];
 rms=Math.sqrt(rms/(buf.length/4));if(rms<.012)return null;
 const min=Math.floor(rate/480),max=Math.min(Math.floor(rate/80),900);
 const n=1480,end=buf.length-n-max;
 let best=0,lagBest=0;
 for(let lag=min;lag<=max;lag+=2){
  let dot=0,e1=0,e2=0;
  for(let k=0;k<n;k+=3){
   const a=buf[end+k],b=buf[end+k+lag];
   dot+=a*b;e1+=a*a;e2+=b*b;
  }
  const corr=dot/Math.sqrt(Math.max(1e-9,e1*e2));
  if(corr>best){best=corr;lagBest=lag}
 }
 if(best<.72||!lagBest)return null;
 let hz=rate/lagBest;
 if(previous){
  if(hz>previous*1.85&&hz/2>=75)hz/=2;
  else if(hz<previous*.54&&hz*2<500)hz*=2;
 }
 if(hz<75||hz>510)return null;
 return hz;
}
function cleanup(rec){
 if(!rec)return;
 if(rec.raf)cancelAnimationFrame(rec.raf);
 try{rec.source?.disconnect()}catch{}
 try{rec.stream?.getTracks().forEach(t=>t.stop())}catch{}
 try{rec.ctx?.close()}catch{}
}
function stop(countTake){
 seq++;
 const rec=active;active=null;
 if(!rec){syncControls();return}
 cleanup(rec);
 if(countTake&&rec.word===state.selected){
  const pts=rec.samples;const duration=pts.length>1?pts[pts.length-1][0]-pts[0][0]:0;
  if(pts.length>=8&&duration>=.28){
   const r=state.reps[rec.word];
   if(count(rec.word)<LIMIT){r.mic.push({points:pts.slice(-100).map(p=>[(p[0]-pts[0][0])/Math.max(.001,duration),p[1]]),seconds:duration});
    note='✓ Высота голоса измерена. Повтор '+count(rec.word)+' из 5. Сравни форму зелёной линии с пунктиром; правильность тонов не подтверждена.';persist();
   }
  }else note='Не удалось измерить устойчивую высоту голоса. Говори ближе к микрофону, без шума, и повтори попытку.';
 }else if(rec)note='Запись остановлена. Этот дубль не засчитан.';
 update();syncControls();
}
function tick(rec){
 if(active!==rec)return;
 const now=performance.now(),elapsed=now-rec.started;
 if(elapsed>7600){stop(true);return}
 if(now-rec.lastTick>65){
  rec.lastTick=now;rec.analyser.getFloatTimeDomainData(rec.buffer);
  const last=rec.samples.length?rec.samples[rec.samples.length-1][1]:null;
  const hz=pitchOf(rec.buffer,rec.ctx.sampleRate,last);
  if(hz){
    rec.samples.push([elapsed/1000,hz]);rec.lastVoice=now;
    if(rec.samples.length>100)rec.samples.shift();
    if(rec.samples.length%3===0)draw();
  }
 }
 if(rec.lastVoice&&now-rec.lastVoice>950&&rec.samples.length>=8){stop(true);return}
 rec.raf=requestAnimationFrame(()=>tick(rec));
}
async function start(){
 if(active){stop(true);return}
 if(count(state.selected)>=LIMIT){status('Для этого слова пять повторений уже выполнены.');return}
 if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){
  status('Микрофон недоступен. Открой урок через HTTPS на GitHub Pages в Chrome и разреши доступ к микрофону.');return;
 }
 const turn=++seq,word=state.selected;status('Запрашиваю доступ к микрофону…');
 try{
  const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:true,autoGainControl:true}});
  if(turn!==seq||word!==state.selected){stream.getTracks().forEach(t=>t.stop());return}
  const C=window.AudioContext||window.webkitAudioContext;
  if(!C){stream.getTracks().forEach(t=>t.stop());status('Этот браузер не поддерживает обработку звука.');return}
  const ctx=new C();await ctx.resume();
  if(turn!==seq){stream.getTracks().forEach(t=>t.stop());ctx.close();return}
  const source=ctx.createMediaStreamSource(stream),analyser=ctx.createAnalyser();
  analyser.fftSize=4096;analyser.smoothingTimeConstant=0;source.connect(analyser);
  const rec={stream,ctx,source,analyser,buffer:new Float32Array(analyser.fftSize),word,samples:[],lastTick:0,lastVoice:0,started:performance.now(),raf:0};
  active=rec;status('🎙 Говори сейчас. Линия будет строиться в реальном времени. Чтобы закончить — нажми кнопку ещё раз.');
  syncControls();tick(rec);
 }catch(error){
  if(turn!==seq)return;
  const denied=error?.name==='NotAllowedError'||error?.name==='PermissionDeniedError';
  status(denied?'Микрофон запрещён в браузере. Разреши доступ к микрофону в настройках сайта.':
    'Не удалось открыть микрофон. Проверь разрешения и попробуй ещё раз.');
 }
}
function manual(){
 if(active){status('Сначала закончи запись с микрофона.');return}
 const r=state.reps[state.selected];if(count(state.selected)>=LIMIT)return;
 r.manual++;persist();note='Самостоятельное повторение '+count(state.selected)+' / 5 отмечено. Это не проверка высоты голоса и тонов.';update();
}
function choose(i){
 if(!Number.isInteger(i)||i<0||i>5)return;
 if(active)stop(false);
 state.selected=i;persist();
 note='Теперь произнеси '+(memo?.words[i]?.zh||'выбранное слово')+'. Потребуется до пяти повторений.';
 update();
 const e=document.getElementById('tone-trainer');e?.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function resetWord(){
 if(active)stop(false);
 if(!window.confirm('Сбросить пять повторений только выбранного слова?'))return;
 state.reps[state.selected]={mic:[],manual:0};persist();note='Повторы слова сброшены.';update();
}
function reset(){if(active)stop(false);state={selected:0,reps:Array.from({length:6},()=>({mic:[],manual:0}))};persist()}
document.addEventListener('click',event=>{
 const btn=event.target.closest('[data-tone-act]');if(!btn||btn.disabled)return;
 const action=btn.dataset.toneAct;
 if(action==='select')choose(Number(btn.dataset.i));
 else if(action==='record')start();
 else if(action==='manual')manual();
 else if(action==='clear')resetWord();
 else if(action==='jump')document.getElementById('tone-trainer')?.scrollIntoView({block:'nearest',behavior:'smooth'});
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)stop(false)});
window.addEventListener('pagehide',()=>{if(active)stop(false)});
window.PandaToneTrainer={render,mount,stop:()=>{if(active)stop(false)},reset,progressText,total};
})();
