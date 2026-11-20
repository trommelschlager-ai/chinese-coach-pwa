/* Panda Go HSK2 · Урок 3 · v2: относительные кривые высоты голоса по двум приблизительно разделённым слогам. */
(function(){
'use strict';
const KEY='pg-hsk2-l3-tone-trainer-v1';
const TONES=[[1,1],[2,4],[2,4],[2,2],[4,3],[4,1]];
const SYLLABLES=[['gōng','sī'],['xué','xiào'],['tóng','shì'],['tóng','xué'],['diàn','nǎo'],['huì','shuō']];
const SPLIT_MIN=.25,SPLIT_MAX=.75;
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
      seconds:finite(t.seconds)?Math.max(0,Math.min(8,t.seconds)):0,
      splitRatio:finite(t.splitRatio)?Math.max(SPLIT_MIN,Math.min(SPLIT_MAX,t.splitRatio)):.5,
      splitSource:['pause','energy','manual','midpoint'].includes(t.splitSource)?t.splitSource:'midpoint'
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
 const syllables=SYLLABLES[i];
 const ratio=last?.splitRatio??.5;
 const splitLabel=({pause:'по паузе в речи',energy:'по снижению громкости',manual:'вручную',midpoint:'примерно посередине'})[last?.splitSource||'midpoint'];
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
  '<div class="tone-graph-pair">'+[0,1].map(n=>
    '<div class="tone-syllable-graph"><h3 class="tone-syllable-title">'+esc(w.zh.charAt(n))+
    ' · '+syllables[n]+' <span>тон '+TONES[i][n]+'</span></h3>'+
    '<canvas id="tone-canvas-'+(n+1)+'" role="img" aria-label="Изменение высоты голоса, слог '+(n+1)+', '+syllables[n]+'" width="360" height="175"></canvas>'+
    '<p id="tone-trend-'+(n+1)+'" class="tone-trend">Нажми «Записать произношение».</p></div>').join('')+'</div>'+
  '<div class="tone-split-control">'+
    '<label for="tone-split">Примерная граница между слогами: <strong id="tone-split-value">'+Math.round(ratio*100)+'%</strong></label>'+
    '<input type="range" id="tone-split" min="25" max="75" step="1" value="'+Math.round(ratio*100)+'" '+(!last||active?'disabled':'')+
    ' aria-label="Поправить границу между первым и вторым слогом">'+
    '<p id="tone-split-hint" class="hint">Разделение '+esc(splitLabel)+'. Если граница ошибочна — передвинь ползунок после записи.</p>'+
  '</div>'+
  '<div class="tone-legend"><span class="tone-legend-target">Пунктир — образец тонов</span><span class="tone-legend-user">Зелёная — твой голос</span></div>'+
  '<div id="tone-status" class="tone-status" role="status" aria-live="polite">'+esc(note)+'</div>'+
  '<div class="btnrow tone-actions"><button id="tone-record" class="primary" type="button" data-tone-act="record" '+(count(i)>=LIMIT?'disabled':'')+'>'+
    '🎙 Записать произношение</button>'+
  '<button type="button" class="action" data-tone-act="manual" '+(count(i)>=LIMIT?'disabled':'')+'>✓ Повторил без микрофона</button></div>'+
  '<div class="tone-aux"><button class="action" type="button" data-tone-act="clear">↻ Сбросить повторы слова</button></div>'+
  '<p class="hint">Разреши доступ к микрофону. Фоновый шум мешает измерению. Анализ идёт на устройстве: звук не отправляется на сервер и не сохраняется. '+
  'Линии показывают только измеренную высоту голоса. Разделение на два слога <b>приблизительное</b>, без распознавания звуков речи и автоматического выставления оценок за китайские тоны. '+
  'Научная проверка точности потребует выравнивания слогов и эталонных записей носителя.</p>'+
  (last?'<p class="hint">Последнее измерение: '+last.seconds.toFixed(1)+' с · '+last.points.length+' измерений высоты голоса.</p>':'')+
  ttsNote+'</div>'
 );
}
function median(a){const b=a.slice().sort((x,y)=>x-y),n=b.length;return n?b[Math.floor(n/2)]:0}

function voiceRms(buf){
 let sum=0,n=0;
 for(let i=0;i<buf.length;i+=4){const v=buf[i];sum+=v*v;n++}
 return Math.sqrt(sum/Math.max(1,n));
}
function estimateSplit(rawPoints,levels){
 if(!rawPoints||rawPoints.length<8)return {ratio:.5,source:'midpoint'};
 const from=rawPoints[0][0],to=rawPoints[rawPoints.length-1][0],span=to-from;
 if(span<=.001)return {ratio:.5,source:'midpoint'};
 // Explicit pause in voiced-pitch observations around the center is the strongest available hint.
 let gap=0,at=.5;
 for(let i=1;i<rawPoints.length;i++){
  const t1=(rawPoints[i-1][0]-from)/span,t2=(rawPoints[i][0]-from)/span;
  const center=(t1+t2)/2,g=t2-t1;
  if(center>.32&&center<.68&&g>gap){gap=g;at=center}
 }
 if(gap>=.16&&gap*span>=.13)return {ratio:Math.max(SPLIT_MIN,Math.min(SPLIT_MAX,at)),source:'pause'};
 // Look for a smoothed valley in the short-term energy envelope.
 const e=(levels||[]).filter(x=>Array.isArray(x)&&finite(x[0])&&finite(x[1])&&x[0]>=from&&x[0]<=to);
 const valid=e.filter(x=>x[1]>.009).map(x=>x[1]);
 if(e.length>=9&&valid.length>=6){
  const normal=median(valid),candidates=[];
  for(let i=2;i<e.length-2;i++){
   const ratio=(e[i][0]-from)/span;
   if(ratio<.34||ratio>.66)continue;
   const smooth=(e[i-1][1]+e[i][1]+e[i+1][1])/3;
   candidates.push({ratio,value:smooth});
  }
  candidates.sort((a,b)=>a.value-b.value);
  if(candidates.length&&candidates[0].value<normal*.70){
   return {ratio:candidates[0].ratio,source:'energy'};
  }
 }
 return {ratio:.5,source:'midpoint'};
}
function observedTrend(points,segmentFrom,segmentTo){
 const pts=points.filter(p=>p[0]>=segmentFrom&&p[0]<=segmentTo&&finite(p[1])&&p[1]>0);
 if(pts.length<5)return 'Недостаточно устойчивых измерений для этого слога.';
 const first=pts[0][0],last=pts[pts.length-1][0];
 if(last-first<.12)return 'Слишком короткий участок для описания изменения высоты.';
 const quart=Math.max(2,Math.floor(pts.length/4));
 const from=median(pts.slice(0,quart).map(p=>p[1]));
 const to=median(pts.slice(-quart).map(p=>p[1]));
 const semis=12*Math.log2(to/from);
 if(!finite(semis))return 'Невозможно надёжно описать изменение высоты.';
 if(semis>1.45)return 'Измерено: высота в целом повышалась ↗';
 if(semis< -1.45)return 'Измерено: высота в целом понижалась ↘';
 const center=median(pts.slice(Math.floor(pts.length*.38),Math.max(Math.floor(pts.length*.38)+1,Math.ceil(pts.length*.65))).map(p=>p[1]));
 const midDelta=12*Math.log2(center/Math.sqrt(from*to));
 if(midDelta< -1.35)return 'Измерено: высота снижалась в середине и затем повышалась ↘↗';
 return 'Измерено: высота оставалась относительно ровной →';
}
function draw(){
 const take=active?.word===state.selected?active.samples:state.reps[state.selected].mic.at(-1)?.points||[];
 const split=active?.word===state.selected?.5:(state.reps[state.selected].mic.at(-1)?.splitRatio??.5);
 const first=take[0]?.[0]??0,last=take[take.length-1]?.[0]??1,span=Math.max(.001,last-first);
 const normalized=take.map(p=>[(p[0]-first)/span,p[1]]).filter(p=>finite(p[0])&&finite(p[1])&&p[1]>0);
 const hz=normalized.map(p=>p[1]),baseline=median(hz)||200;
 const shapes={1:[.26,.26],2:[.72,.20],3:[.57,.82,.40],4:[.17,.84]};
 for(let syll=0;syll<2;syll++){
  const canvas=document.getElementById('tone-canvas-'+(syll+1));if(!canvas)continue;
  const ctx=canvas.getContext('2d');if(!ctx)continue;
  const w=canvas.width,h=canvas.height,l=30,r=12,t=15,b=23,plotW=w-l-r,plotH=h-t-b;
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#fffaff';ctx.fillRect(0,0,w,h);
  ctx.font='13px system-ui';ctx.textBaseline='middle';
  for(let k=0;k<=4;k++){
   const y=t+plotH*k/4;
   ctx.beginPath();ctx.moveTo(l,y);ctx.lineTo(w-r,y);
   ctx.strokeStyle='#ecd3ed';ctx.lineWidth=1;ctx.setLineDash([]);ctx.stroke();
  }
  ctx.fillStyle='#85558d';ctx.fillText('↑',8,t+6);ctx.fillText('↓',8,t+plotH-5);
  const shape=shapes[TONES[state.selected][syll]];
  ctx.beginPath();ctx.strokeStyle='#9d50ca';ctx.setLineDash([9,6]);ctx.lineWidth=4;
  for(let k=0;k<=54;k++){
   const u=k/54,v=u*(shape.length-1),j=Math.min(shape.length-2,Math.floor(v));
   const level=shape[j]+(shape[j+1]-shape[j])*(v-j);
   const x=l+u*plotW,y=t+level*plotH;
   if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.stroke();ctx.setLineDash([]);
  const segmentFrom=syll===0?0:split,segmentTo=syll===0?split:1;
  const selected=normalized.filter(p=>p[0]>=segmentFrom&&p[0]<=segmentTo);
  const trend=document.getElementById('tone-trend-'+(syll+1));
  if(trend)trend.textContent=observedTrend(normalized,segmentFrom,segmentTo);
  if(selected.length<2)continue;
  ctx.beginPath();ctx.strokeStyle='#198b70';ctx.lineWidth=3.5;
  let painted=0;
  for(const p of selected){
   const x=l+plotW*(p[0]-segmentFrom)/Math.max(.001,segmentTo-segmentFrom);
   const semis=12*Math.log2(p[1]/baseline),val=Math.max(.07,Math.min(.93,.50-semis/16));
   const y=t+plotH*val;
   if(painted===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
   painted++;
  }
  ctx.stroke();
 }
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
 // CMNDF (YIN-style) autocorrelation difference: less sensitive to dominant harmonics
 // than selecting the strongest uncorrected autocorrelation peak.
 if(!buf||buf.length<2800||!finite(rate)||rate<8000)return null;
 if(voiceRms(buf)<.014)return null;
 const minLag=Math.max(20,Math.floor(rate/530)),maxLag=Math.min(800,Math.floor(rate/78),Math.floor(buf.length*.30));
 if(maxLag<=minLag)return null;
 const count=Math.min(1150,buf.length-maxLag-10),start=buf.length-count-maxLag;
 const diffs=new Float64Array(maxLag+2);
 for(let lag=1;lag<=maxLag;lag++){
  let diff=0;
  for(let k=0;k<count;k+=3){
   const delta=buf[start+k]-buf[start+k+lag];diff+=delta*delta;
  }
  diffs[lag]=diff;
 }
 const c=new Float64Array(maxLag+2);
 let sum=0;
 for(let lag=1;lag<=maxLag;lag++){
  sum+=diffs[lag];
  c[lag]=sum>1e-12?diffs[lag]*lag/sum:1;
 }
 let best=0,bestValue=1;
 // Select first convincing local minimum, avoiding overtone confusion.
 for(let lag=minLag+1;lag<maxLag-2;lag++){
  if(c[lag]<.22&&c[lag]<=c[lag-1]&&c[lag]<=c[lag+1]){best=lag;bestValue=c[lag];break}
  if(c[lag]<bestValue){bestValue=c[lag];best=lag}
 }
 if(!best||bestValue>.29)return null;
 let lag=best;
 if(best>minLag&&best<maxLag-1){
  const a=c[best-1],b=c[best],d=c[best+1],denom=a-2*b+d;
  if(Math.abs(denom)>1e-8)lag+=Math.max(-1,Math.min(1,.5*(a-d)/denom));
 }
 let hz=rate/lag;
 if(previous&&finite(previous)){
  if(hz>previous*1.8&&hz/2>=78)hz/=2;
  else if(hz<previous*.55&&hz*2<=530)hz*=2;
  if(Math.abs(12*Math.log2(hz/previous))>6.5)return null; // Reject likely octave glitch.
 }
 return finite(hz)&&hz>=78&&hz<=530?hz:null;
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
  const pts=rec.samples,duration=pts.length>1?pts[pts.length-1][0]-pts[0][0]:0;
  if(pts.length>=12&&duration>=.42){
   const r=state.reps[rec.word];
   if(count(rec.word)<LIMIT){
    const boundary=estimateSplit(pts,rec.levels);
    const saved=pts.slice(-120),first=saved[0][0],last=saved[saved.length-1][0],span=Math.max(.001,last-first);
    // Convert the boundary into the same saved time window as the normalized contour.
    const absolute=pts[0][0]+boundary.ratio*duration;
    const ratio=Math.max(SPLIT_MIN,Math.min(SPLIT_MAX,(absolute-first)/span));
    r.mic.push({points:saved.map(p=>[(p[0]-first)/span,p[1]]),seconds:duration,
      splitRatio:ratio,splitSource:boundary.source});
    note='✓ Голос измерен. Повтор '+count(rec.word)+' из 5. Показаны два предположительных слога. Если нужно, передвинь границу между ними.';persist();
   }
  }else note='Для разделения на два слога недостаточно устойчивого голоса. Скажи оба слога чётко и повтори попытку.';
 }else if(rec)note='Запись остановлена. Этот дубль не засчитан.';
 update();syncControls();
}


function tick(rec){
 if(active!==rec)return;
 const now=performance.now(),elapsed=now-rec.started;
 if(elapsed>8000){stop(true);return}
 if(now-rec.lastTick>=65){
  rec.lastTick=now;
  rec.analyser.getFloatTimeDomainData(rec.buffer);
  const rms=voiceRms(rec.buffer);
  rec.levels.push([elapsed/1000,rms]);
  if(rec.levels.length>180)rec.levels.shift();
  const lastHz=rec.samples.length?rec.samples[rec.samples.length-1][1]:null;
  let hz=pitchOf(rec.buffer,rec.ctx.sampleRate,lastHz);
  if(hz){
    const prev=rec.samples.slice(-3).map(x=>x[1]);
    if(prev.length>=2)hz=median([...prev,hz]);
    rec.samples.push([elapsed/1000,hz]);
    rec.lastVoice=now;
    if(rec.samples.length>150)rec.samples.shift();
  }
  if(rec.samples.length%2===0)draw();
 }
 // A pause helps identify a boundary. Leave enough silence for the next syllable.
 if(rec.lastVoice&&now-rec.lastVoice>1450&&rec.samples.length>=12){stop(true);return}
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
  const rec={stream,ctx,source,analyser,buffer:new Float32Array(analyser.fftSize),word,samples:[],levels:[],lastTick:0,lastVoice:0,started:performance.now(),raf:0};
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
document.addEventListener('input',event=>{
 const el=event.target;
 if(el?.id!=='tone-split'||active)return;
 const last=state.reps[state.selected].mic.at(-1);
 if(!last)return;
 const pct=Number(el.value);
 if(!finite(pct)||pct<25||pct>75)return;
 last.splitRatio=pct/100;last.splitSource='manual';persist();
 const label=document.getElementById('tone-split-value');
 if(label)label.textContent=pct+'%';
 const hint=document.getElementById('tone-split-hint');
 if(hint)hint.textContent='Граница вручную. Это не распознавание слогов.';
 draw();
});
window.PandaToneTrainer={render,mount,stop:()=>{if(active)stop(false)},reset,progressText,total};
window.PandaToneMathV2={pitchOf,estimateSplit,observedTrend};
})();
