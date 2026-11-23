/* Panda Go HSK2 Lesson 3 tone-only pilot. Engine synced from panda-tone-test-lab.html. Main course and speech recognition unchanged. */
/* Panda Go HSK2 · Урок 3 · v5: readable local semitone contours, short-syllable sampling, partial attempts retained. */
(function(){
'use strict';
const KEY='pg-hsk2-l3-tone-trainer-v1'; // Preserve existing lesson-3 progress
 let replayUrl='',replayWord=-1,replayAudio=null,replayToken=0;
 function clearReplay(){if(replayAudio){replayAudio.pause();replayAudio=null;}if(replayUrl){URL.revokeObjectURL(replayUrl);replayUrl='';}replayWord=-1;}
 function captureReplay(rec){
  if(typeof MediaRecorder==='undefined')return false;
  try{
   const type=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(x=>MediaRecorder.isTypeSupported?.(x));
   const recorder=type?new MediaRecorder(rec.stream,{mimeType:type}):new MediaRecorder(rec.stream);
   const chunks=[];
   recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
   recorder.onstop=()=>{
    if(!rec.keepReplay||rec.token!==replayToken||!chunks.length)return;
    const blob=new Blob(chunks,{type:recorder.mimeType||chunks[0].type});
    if(blob.size<300)return;
    clearReplay();replayUrl=URL.createObjectURL(blob);replayWord=rec.word;
    const b=document.getElementById('lab-replay');
    if(b&&state.selected===rec.word)b.disabled=false;
   };
   recorder.onerror=()=>{rec.keepReplay=false;};
   recorder.start(250);rec.recorder=recorder;
   return true;
  }catch{return false;}
 }

const TONES=[[1,1],[2,4],[2,4],[2,2],[4,3],[4,1]];
const SYLLABLES=[['gōng','sī'],['xué','xiào'],['tóng','shì'],['tóng','xué'],['diàn','nǎo'],['huì','shuō']];
const SPLIT_MIN=.25,SPLIT_MAX=.75;
const LIMIT=5;
let state={selected:0,reps:Array.from({length:6},()=>({mic:[],manual:0}))};
let active=null, seq=0, memo=null, visibleAttempt=null, chartView='preview', note='Выбери слово и нажми «Записать голос».';
const finite=n=>typeof n==='number'&&Number.isFinite(n);

function readState(){
 try{
  const old=JSON.parse(localStorage.getItem(KEY)||'null');
  if(!old||typeof old!=='object')return;
  state.selected=Number.isInteger(old.selected)&&old.selected>=0&&old.selected<6?old.selected:0;
  if(!Array.isArray(old.reps))return;
  for(let i=0;i<6;i++){
   const item=old.reps[i]||{},inputs=Array.isArray(item.mic)?item.mic.slice(0,LIMIT):[];
   const mic=inputs.filter(t=>t&&typeof t==='object'&&Array.isArray(t.points)).map(t=>{
    const points=t.points.slice(-120).filter(p=>Array.isArray(p)&&p.length===2&&p.every(finite)&&p[0]>=0&&p[0]<=1&&p[1]>=55&&p[1]<=650);
    const quality=['both','partial','unmeasured','legacy'].includes(t.quality)?t.quality:'legacy';
    return {points,seconds:finite(t.seconds)?Math.min(8,Math.max(0,t.seconds)):0,
      splitRatio:finite(t.splitRatio)?Math.min(SPLIT_MAX,Math.max(SPLIT_MIN,t.splitRatio)):.5,
      splitSource:['pause','energy','manual','midpoint','uncertain'].includes(t.splitSource)?t.splitSource:'midpoint',
       splitWarning:typeof t.splitWarning==='string'?t.splitWarning.slice(0,200):'',
      quality,validParts:Array.isArray(t.validParts)&&t.validParts.length===2?t.validParts.map(Boolean):[false,false],
      previewPoints:Array.isArray(t.previewPoints)?t.previewPoints.slice(-150).filter(p=>Array.isArray(p)&&p.length===2&&p.every(finite)&&p[0]>=0&&p[0]<=1&&p[1]>=70&&p[1]<=600):[],
      previewSeconds:finite(t.previewSeconds)?Math.min(8,Math.max(.1,t.previewSeconds)):0,
      offline:t.offline&&typeof t.offline==='object'?t.offline:null,
      evidence:Array.isArray(t.evidence)&&t.evidence.length===2?t.evidence:null,
      voiceMs:finite(t.voiceMs)?Math.max(0,Math.min(8000,t.voiceMs)):0,
      signal:t.signal&&typeof t.signal==='object'?{frames:Number(t.signal.frames)||0,voicedFrames:Number(t.signal.voicedFrames)||0,peak:Number(t.signal.peak)||0,p95:Number(t.signal.p95)||0,seconds:Number(t.signal.seconds)||0,rawF0:Number(t.signal.rawF0)||0,threshold:.023,speech:t.signal.speech&&typeof t.signal.speech==='object'?t.signal.speech:null}:null,
      recordedAt:finite(t.recordedAt)&&t.recordedAt>0?t.recordedAt:null,
      attemptId:typeof t.attemptId==='string'?t.attemptId.slice(0,80):null,
      stats:t.stats&&typeof t.stats==='object'?{yin:Math.max(0,Number(t.stats.yin)||0),fallback:Math.max(0,Number(t.stats.fallback)||0),none:Math.max(0,Number(t.stats.none)||0)}:null,
      levels:Array.isArray(t.levels)?t.levels.slice(-180).filter(p=>Array.isArray(p)&&p.length===2&&p.every(finite)&&p[0]>=0&&p[0]<=1&&p[1]>=0&&p[1]<=1):[]};
   }).filter(t=>t.points.length>=2||(t.quality==='unmeasured'&&t.voiceMs>=250));
   state.reps[i]={mic,manual:Math.max(0,Math.min(LIMIT-mic.length,Number.isInteger(item.manual)?item.manual:0))};
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
function diagnosticSummary(){
 const words=memo?.words||[];
 const names=['公司','学校','同事','同学','电脑','会说'];
 const rows=['Panda Go · HSK 2 · Урок 3 · диагностика накопленных попыток',
  'Повторений: '+total()+'/30 (это НЕ оценка произношения)',
  'Записей с микрофона: '+micCount()+'; отметок вручную: '+state.reps.reduce((n,r)=>n+r.manual,0),
  'Достаточно F0 — значит пригодно для дальнейшего анализа, но НЕ правильный тон.',''];
 for(let i=0;i<6;i++){
  const item=state.reps[i],n=item.mic.length;
  let both=0,partial=0,unmeasured=0;
  const latest=item.mic.at(-1),latestInfo=[];
  for(const attempt of item.mic){
   const split=finite(attempt.splitRatio)?attempt.splitRatio:.5;
   const seconds=finite(attempt.seconds)?attempt.seconds:0;
   const pts=attempt.points||[];
   const a=contourEvidence(pts,0,split,seconds),b=contourEvidence(pts,split,1,seconds);
   const hasWarning=Boolean(attempt.splitWarning)||Boolean(attempt.signal?.speech?.ambiguous);
   if(a.usable&&b.usable&&!hasWarning&&attempt.quality==='both')both++;
   else if(pts.length>=2)partial++;
   else unmeasured++;
  }
  if(latest){
   const split=finite(latest.splitRatio)?latest.splitRatio:.5;
   const sec=finite(latest.seconds)?latest.seconds:0;
   for(const [j,a,b] of [[1,0,split],[2,split,1]]){
    const evidence=contourEvidence(latest.points||[],a,b,sec);
    const reasons=[];
    if(evidence.points<7)reasons.push('F0 '+evidence.points+'/7');
    if(evidence.duration<.14)reasons.push('короткий голос '+Math.round(evidence.duration*1000)+'мс');
    if(evidence.maxGap>.13)reasons.push('разрыв F0');
    if(evidence.jump)reasons.push('скачок F0');
    latestInfo.push('слог '+j+': '+(reasons.length?reasons.join(', '):'данных по F0 достаточно'));
   }
  }
  rows.push((names[i]+' '+(words[i]?.py||'')+': записей '+n+', вручную '+item.manual+
   '; F0 достаточно для двух слогов '+both+', частично '+partial+', без F0 '+unmeasured));
  if(latestInfo.length)rows.push('  Последняя запись: '+latestInfo.join(' · ')+(latest.splitWarning?' · ⚠ ненадёжная граница':''));
 }
 rows.push('', 'Данные берутся из сохранённых попыток на ЭТОМ устройстве. Звуковые файлы не передаются и не сохраняются в отчёте.');
 return rows.join('\n');
}
function esc(x){return String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function render(words,art,heading,panel,ttsNote,listenButton){
 memo={words,art,heading,panel,ttsNote,listenButton};
 const i=state.selected,w=words[i],r=state.reps[i];
 const last=(visibleAttempt?.word===i ? visibleAttempt : (r.mic.length?r.mic[r.mic.length-1]:null));
 const syllables=SYLLABLES[i];
 const ratio=last?.splitRatio??.5;
 const splitLabel=({pause:'по паузе',energy:'по снижению громкости',manual:'вручную',midpoint:'примерно посередине',uncertain:'⚠ ненадёжная автоматическая граница, условно 50%'})[last?.splitSource||'midpoint'];
 const done=count(i),busy=active&&active.word===i;
 return panel(
  '<div id="tone-trainer" class="tone-trainer tone-compact">'+
   '<div class="tone-compact-head"><strong>🎙 Тоны · пробная проверка</strong><span>'+progressText()+' повторений</span></div>'+
   '<div class="tone-quick-select" role="group" aria-label="Выбери слово для тренировки">'+words.map((word,index)=>
    '<button type="button" class="action'+(index===i?' selected':'')+'" data-tone-act="select" data-i="'+index+'" aria-pressed="'+(index===i)+'">'+
     word.zh+'<small>'+count(index)+'/5</small></button>').join('')+'</div>'+
   '<div class="tone-compact-word"><div><strong class="cn" lang="zh-Hans">'+w.zh+'</strong> '+
    '<span class="py">'+w.py+'</span> <span class="ru">'+w.ru+'</span></div>'+
    '<span class="tone-current-count">'+done+' / 5</span></div>'+
   '<div class="tone-graph-pair">'+[0,1].map(n=>
    '<div class="tone-syllable-graph"><div class="tone-syllable-title">'+esc(w.zh.charAt(n))+
    ' · '+syllables[n]+' <span>тон '+TONES[i][n]+'</span></div>'+
    '<canvas id="tone-canvas-'+(n+1)+'" role="img" aria-label="Высота голоса для слога '+(n+1)+', '+syllables[n]+'" width="360" height="175"></canvas>'+
    '<p id="tone-trend-'+(n+1)+'" class="tone-trend">После записи появится твоя линия.</p></div>').join('')+'</div>'+
   '<div class="tone-legend"><span class="tone-legend-target">Пунктир — схема тона</span></div>'+
   '<div class="tone-view-picker" role="group" aria-label="Выбор отображения кривой">'+
    '<button type="button" class="action" data-tone-view="preview" aria-pressed="true">🟢 Как при записи</button>'+
    '<button type="button" class="action" data-tone-view="analysis" aria-pressed="false">🟠 Анализ после «Стоп»</button></div>'+
   '<div id="tone-status" class="tone-status" role="status" aria-live="polite">'+esc(note)+'</div>'+
   '<div class="btnrow tone-actions">'+(typeof listenButton==='function'?listenButton(w.zh):'')+'<button id="tone-record" class="primary" type="button" data-tone-act="record">'+
    '🎙 Записать голос</button>'+
    (done<LIMIT?'<button type="button" class="action" data-tone-act="manual">✓ Повторил сам</button>':'')+'</div>'+
   '<div class="tone-aux"><button type="button" class="action" id="lab-replay" '+(replayUrl&&replayWord===i?'':'disabled')+'>▶ Прослушать свою запись / 回听录音</button></div>'+ '<details class="tone-advanced"><summary>Граница слогов и пояснения</summary>'+
    '<details class="tone-stored-summary"><summary>📊 Сводка сохранённых попыток · без новых записей</summary>'+
    '<pre class="tone-stored-report">'+esc(diagnosticSummary())+'</pre>'+
    '<button type="button" class="action" data-tone-act="copy-summary">📋 Скопировать сводку</button></details>'+
    '<div class="tone-split-control"><label for="tone-split">Граница слогов: <strong id="tone-split-value">'+Math.round(ratio*100)+'%</strong></label>'+
    '<input type="range" id="tone-split" min="25" max="75" step="1" value="'+Math.round(ratio*100)+'" '+(!last||busy?'disabled':'')+
    ' aria-label="Сместить примерную границу между слогами">'+
    '<p id="tone-split-hint" class="hint">Разделение '+esc(splitLabel)+'. При необходимости поправь после записи.</p></div>'+
    '<p class="hint">Это график высоты голоса, а не подтверждение правильности тонов. Два слога определяются приблизительно, без распознавания речи. Звук хранится только в памяти открытой страницы для воспроизведения и не отправляется на сервер.</p>'+
    '<button class="action tone-reset" type="button" data-tone-act="clear">↻ Сбросить повторы выбранного слова</button>'+
    (last?'<p class="hint">Запись: '+last.seconds.toFixed(1)+' с; измерений: '+last.points.length+'.'+(last.stats?' Основной: '+last.stats.yin+' · запасной: '+last.stats.fallback+' · пропуски: '+last.stats.none+'.':'')+'</p>':'')+
    ttsNote+'</details>'+
   '<p class="tone-safety-label">Пробный график высоты голоса. Не является оценкой правильности тонов.</p>'+
  '</div>'
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
 if(gap>=.10&&gap*span>=.07)return {ratio:Math.max(SPLIT_MIN,Math.min(SPLIT_MAX,at)),source:'pause'};
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
 const pts=points.filter(p=>p[0]>=segmentFrom&&(segmentTo===1?p[0]<=1:p[0]<segmentTo)&&finite(p[1])&&p[1]>0);
 if(pts.length<4)return '— Мало данных';
 const duration=pts.at(-1)[0]-pts[0][0];
 if(duration<.065)return '— Короткий слог';
 // Flag isolated large jumps as ambiguous; do not mislabel them as a tone contour.
 const suspiciousJump=pts.some((p,i)=>i>0 &&
  (p[0]-pts[i-1][0])<=.16 &&
  Math.abs(12*Math.log2(p[1]/pts[i-1][1]))>=3.3);
 if(suspiciousJump)return '⚠ Резкий скачок F0: данные сомнительны';
 const n=Math.max(2,Math.floor(pts.length*.25));
 const from=median(pts.slice(0,n).map(p=>p[1])),to=median(pts.slice(-n).map(p=>p[1]));
 const delta=12*Math.log2(to/from);
 if(!finite(delta))return '— Мало данных';
 const mid=median(pts.slice(Math.max(0,Math.floor(pts.length*.34)),Math.ceil(pts.length*.66)).map(p=>p[1]));
 const dip=12*Math.log2(mid/Math.sqrt(from*to));
 const fmt=Math.abs(delta).toFixed(1).replace('.',',');
 if(dip < -1.0&&delta > -.9&&pts.length>=7)return '↘↗ Изгиб';
 if(delta>0.85)return '↗ +'+fmt+' полут.';
 if(delta<-.85)return '↘ −'+fmt+' полут.';
 return '→ Изменение менее 1 полутона';
}

function normalizeChartPoints(take,live){
 if(!Array.isArray(take)||!take.length)return [];
 const first=take[0][0],last=take[take.length-1][0],span=Math.max(.001,last-first);
 // Saved attempts already store 0..1 time along the audible interval:
 // normalize ONLY live millisecond/second samples, not stored attempts again.
 return take.map(p=>[live?(p[0]-first)/span:p[0],p[1]])
  .filter(p=>finite(p[0])&&p[0]>=0&&p[0]<=1&&finite(p[1])&&p[1]>0);
}
function semitoneContour(points,segmentFrom,segmentTo){
 const selected=points.filter(p=>p[0]>=segmentFrom&&(segmentTo===1?p[0]<=1:p[0]<segmentTo));
 if(!selected.length)return [];
 const firstWindow=selected.slice(0,Math.max(2,Math.min(4,Math.floor(selected.length*.3))));
 const reference=median(firstWindow.map(p=>p[1]))||selected[0][1];
 return selected.map(p=>({
  x:(p[0]-segmentFrom)/Math.max(.001,segmentTo-segmentFrom),
  time:p[0], semitones:12*Math.log2(p[1]/reference)
 })).filter(p=>finite(p.x)&&finite(p.semitones));
}
function isLongPitchGap(prevTime,nextTime,voiceSeconds){
 // A normalized x-gap means different real times for short and long recordings.
 // Break the drawn line at >= 140ms of unmeasured pitch, never join silent frames.
 return finite(prevTime)&&finite(nextTime)&&finite(voiceSeconds)&&
  (nextTime-prevTime)*voiceSeconds>=.14;
}
function draw(){
 const live=Boolean(active&&active.word===state.selected);
 const recent=visibleAttempt?.word===state.selected?visibleAttempt:state.reps[state.selected].mic.at(-1);
 const liveSamples=live?active.samples:[];
 const livePoints=live?normalizeChartPoints(liveSamples,true):Array.isArray(recent?.previewPoints)?recent.previewPoints:[];
 const finalPoints=live?[]:(recent?.points||[]);
 const split=live?.5:(recent?.splitRatio??.5);
 const liveSeconds=live?Math.max(.1,(liveSamples.at(-1)?.[0]??0)-(liveSamples[0]?.[0]??0)):(recent?.previewSeconds||.8);
 // Freeze the exact preview frame that was last painted. Stop can occur between
 // animation frames, so recalculating from newer microphone samples would jump.
 if(live&&active){
  active.previewRenderedPoints=livePoints.map(p=>[p[0],p[1]]);
  active.previewRenderedSeconds=liveSeconds;
 }
 const finalSeconds=finite(recent?.seconds)&&recent.seconds>.1?recent.seconds:.8;
 const view=live?'preview':(chartView==='analysis'||!livePoints.length?'analysis':'preview');
 for(const button of document.querySelectorAll('.l3-tone-details [data-tone-view]')){
  const current=button.dataset.toneView===view;
  button.setAttribute('aria-pressed',String(current));
  button.classList.toggle('selected',current);
  button.disabled=live||(button.dataset.toneView==='preview'?!livePoints.length:!finalPoints.length);
 }
 const shapes={1:[.5,.5],2:[.5,.23],3:[.5,.82,.56],4:[.5,.82]};
 for(let syll=0;syll<2;syll++){
  const canvas=document.getElementById('tone-canvas-'+(syll+1));if(!canvas)continue;
  const ctx=canvas.getContext('2d');if(!ctx)continue;
  const w=canvas.width,h=canvas.height,l=40,r=12,t=15,b=23,plotW=w-l-r,plotH=h-t-b;
  const liveFrom=syll===0?0:.5,liveTo=syll===0?.5:1;
  const finalFrom=syll===0?0:split,finalTo=syll===0?split:1;
  // Both curves use a FIXED scale. Pressing Stop must not rescale or replace
  // the live curve. Values beyond the visible scale are clipped at plot edges.
  const axisHalf=9;
  const liveTrace=semitoneContour(livePoints,liveFrom,liveTo);
  const finalTrace=semitoneContour(finalPoints,finalFrom,finalTo);
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#fffaff';ctx.fillRect(0,0,w,h);
  ctx.font='11px system-ui';ctx.textBaseline='middle';
  for(let k=0;k<=4;k++){
   const y=t+plotH*k/4;
   ctx.beginPath();ctx.moveTo(l,y);ctx.lineTo(w-r,y);
   ctx.strokeStyle='#ecd3ed';ctx.lineWidth=1;ctx.setLineDash([]);ctx.stroke();
   const v=axisHalf*(1-k/2);
   const vStr=Number(v.toFixed(1)).toString().replace('.',',');
   ctx.fillStyle='#85558d';ctx.fillText((v>0?'+':'')+vStr,3,y);
  }
  const shape=shapes[TONES[state.selected][syll]];
  ctx.beginPath();ctx.strokeStyle='#9d50ca';ctx.setLineDash([9,6]);ctx.lineWidth=4;
  for(let k=0;k<=54;k++){
   const u=k/54,v=u*(shape.length-1),j=Math.min(shape.length-2,Math.floor(v));
   const level=shape[j]+(shape[j+1]-shape[j])*(v-j);
   const x=l+u*plotW,y=t+level*plotH;
   if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.stroke();ctx.setLineDash([]);
  const traceLine=(trace,color,width,seconds)=>{
   if(trace.length<2)return;
   ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash([]);
   let painted=0,prior=null;ctx.beginPath();
   for(const p of trace){
    const x=l+plotW*p.x;
    const y=Math.max(t,Math.min(t+plotH,t+plotH*(.5-p.semitones/(2*axisHalf))));
    if(prior!==null&&isLongPitchGap(prior,p.time,seconds)){
     if(painted>=2)ctx.stroke();
     ctx.beginPath();painted=0;
    }
    if(!painted)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    prior=p.time;painted++;
   }
   if(painted>=2)ctx.stroke();
  };
  // IMPORTANT: do NOT overlay independent time scales / syllable boundaries.
  // Default stays on the exact frozen preview; offline DSP is a separate view.
  if(view==='preview')traceLine(liveTrace,'#198b70',3.5,liveSeconds);
  else traceLine(finalTrace,'#d97827',3.5,finalSeconds);
  const trend=document.getElementById('tone-trend-'+(syll+1));
  if(trend){
   if(live){
    trend.textContent='🎙 Предварительный контур';
   }else if(view==='preview'){
    const a=livePoints.filter(p=>p[0]>=liveFrom&&(liveTo===1?p[0]<=1:p[0]<liveTo)).length;
    trend.textContent='🟢 '+a+' точек F0'+(a<7?' · мало данных':' · без оценки');
   }else{
    const count=finalPoints.filter(p=>p[0]>=finalFrom&&(finalTo===1?p[0]<=1:p[0]<finalTo)).length;
    const finalTrend=observedTrend(finalPoints,finalFrom,finalTo);
    const valid=recent?.validParts?.[syll]===true;
    trend.textContent=valid?'🟠 '+finalTrend+' · '+count+' F0':'🟠 '+count+' F0 · данных недостаточно';
    if(recent?.splitWarning)trend.textContent+=' · ⚠ граница приблизительна';
   }
  }
 }
}

function mount(){draw();syncControls()}
function status(message){note=message;const el=document.getElementById('tone-status');if(el)el.textContent=message}
function syncControls(){
 const btn=document.getElementById('tone-record');if(!btn)return;
 const running=active&&active.word===state.selected;
 btn.textContent=running?'■ Стоп':'🎙 Записать голос';
 btn.disabled=false; // Five is a progress target, not a microphone practice limit.
}
function update(){
 // Lesson 3 shares #workspace with ALL course steps; never replace it.
 // Only update this trainer's immediate panel, preserving step UI and <details>.
 if(!memo)return;
 const old=document.getElementById('tone-trainer');
 const panel=old?.parentElement;
 if(!panel||!old.closest('.l3-tone-details'))return;
 panel.outerHTML=render(memo.words,memo.art,memo.heading,memo.panel,memo.ttsNote,memo.listenButton);
 mount();
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

// Experimental normalized autocorrelation backup, used only in the separate test lab.
// It requires a strong periodic signal; fallback detections are NOT tone correctness.
function fallbackPitchOf(buf,rate,previous){
 if(!buf||!finite(rate)||rate<8000||buf.length<2048)return null;
 const n=960,minLag=Math.max(20,Math.floor(rate/520));
 const maxLag=Math.min(Math.floor(rate/80),Math.floor(buf.length*.30));
 if(maxLag<=minLag||buf.length<n+maxLag)return null;
 const start=buf.length-n-maxLag;
 let energy=0;
 for(let k=0;k<n;k+=3){const a=buf[start+k];energy+=a*a;}
 if(Math.sqrt(energy/Math.ceil(n/3))<.018)return null;
 const corr=new Float32Array(maxLag+2);
 for(let lag=minLag;lag<=maxLag;lag++){
  let cross=0,a2=0,b2=0;
  for(let k=0;k<n;k+=3){
   const a=buf[start+k],b=buf[start+k+lag];
   cross+=a*b;a2+=a*a;b2+=b*b;
  }
  corr[lag]=cross/Math.sqrt(a2*b2+1e-10);
 }
 let best=0,bestValue=.64;
 for(let lag=minLag+1;lag<maxLag-1;lag++){
  if(corr[lag]>bestValue&&corr[lag]>=corr[lag-1]&&corr[lag]>=corr[lag+1]){
   if(!best||corr[lag]>bestValue+.055){
    best=lag;bestValue=corr[lag];
   }
  }
 }
 if(!best)return null;
 let lag=best;
 const a=corr[best-1],b=corr[best],d=corr[best+1],den=a-2*b+d;
 if(Math.abs(den)>1e-6)lag+=Math.max(-1,Math.min(1,.5*(a-d)/den));
 let hz=rate/lag;
 if(previous&&finite(previous)){
  if(hz>previous*1.8&&hz/2>=80)hz/=2;
  else if(hz<previous*.55&&hz*2<=520)hz*=2;
  if(Math.abs(12*Math.log2(hz/previous))>6.5)return null;
 }
 return finite(hz)&&hz>=80&&hz<=520?hz:null;
}

/* Offline PCM reanalysis: 90 ms windows with 18 ms hops at ~12 kHz.
   This supplements, rather than changes, the streaming mic measurement. */
function offlinePitch(frame,rate){
 const lo=Math.max(10,Math.floor(rate/520)),hi=Math.min(Math.floor(rate/78),Math.floor(frame.length*.28));
 const n=frame.length-hi-2;
 if(n<rate*.038)return null;
 let power=0;for(let i=0;i<frame.length;i++)power+=frame[i]*frame[i];
 if(Math.sqrt(power/frame.length)<.017)return null;
 const cmnd=new Float32Array(hi+2),diffs=new Float32Array(hi+2);
 for(let lag=1;lag<=hi;lag++){
  let v=0;for(let i=0;i<n;i+=2){const d=frame[i]-frame[i+lag];v+=d*d;}
  diffs[lag]=v;
 }
 let sum=0;
 for(let lag=1;lag<=hi;lag++){sum+=diffs[lag];cmnd[lag]=sum>1e-12?lag*diffs[lag]/sum:1;}
 let best=0;
 for(let lag=lo+1;lag<hi-1;lag++){
  if(cmnd[lag]<.17&&cmnd[lag]<=cmnd[lag-1]&&cmnd[lag]<=cmnd[lag+1]){best=lag;break;}
 }
 if(!best){
  let val=.25;for(let lag=lo+1;lag<hi-1;lag++)
   if(cmnd[lag]<val&&cmnd[lag]<=cmnd[lag-1]&&cmnd[lag]<=cmnd[lag+1]){val=cmnd[lag];best=lag;}
 }
 if(!best)return null;
 const a=cmnd[best-1],b=cmnd[best],d=cmnd[best+1],den=a-2*b+d;
 const shift=Math.abs(den)>1e-8?Math.max(-.5,Math.min(.5,.5*(a-d)/den)):0;
 const hz=rate/(best+shift);
 return finite(hz)&&hz>=78&&hz<=520?hz:null;
}
function cleanPitch(points,scale=1){
 // Prevent harmonic islands (such as a 150 to 450 Hz jump) from being mistaken
 // for a real second-tone rise. Never synthesize or interpolate absent F0 data.
 const firstPass=points.filter((p,i)=>{
  if(i===0||i===points.length-1)return true;
  const a=points[i-1],b=points[i+1];
  if((p[0]-a[0])*scale>.07||(b[0]-p[0])*scale>.07)return true;
  const delta=(x,y)=>Math.abs(12*Math.log2(x/y));
  return !(delta(a[1],b[1])<1.6&&delta(p[1],a[1])>3.3&&delta(p[1],b[1])>3.3);
 });
 const result=[];
 for(const p of firstPass){
  const prev=result.at(-1);
  if(prev){
   const dt=(p[0]-prev[0])*scale;
   const leap=Math.abs(12*Math.log2(p[1]/prev[1]));
   if(dt>0&&dt<.075&&leap>5.5)continue;
  }
  result.push(p);
 }
 return result;
}
function contourEvidence(points,from,to,voiceSeconds){
 const p=points.filter(q=>q[0]>=from&&(to===1?q[0]<=1:q[0]<to));
 const len=p.length;
 const duration=len>1?(p[len-1][0]-p[0][0])*voiceSeconds:0;
 let maxGap=0,jump=false;
 for(let i=1;i<len;i++){
  const dt=(p[i][0]-p[i-1][0])*voiceSeconds;
  maxGap=Math.max(maxGap,dt);
  if(dt<.085&&Math.abs(12*Math.log2(p[i][1]/p[i-1][1]))>=3.3)jump=true;
 }
 return {points:len,duration,maxGap,jump,usable:len>=7&&duration>=.14&&maxGap<=.13&&!jump};
}
function reanalyzePcm(rec){
 const parts=rec.pcmParts||[],num=parts.reduce((n,p)=>n+p.length,0),sourceRate=rec.ctx.sampleRate;
 if(num<sourceRate*.3)return false;
 const dec=Math.max(1,Math.round(sourceRate/12000)),rate=sourceRate/dec,total=Math.floor(num/dec);
 const pcm=new Float32Array(num),audio=new Float32Array(total);
 let off=0;for(const p of parts){pcm.set(p,off);off+=p.length;}
 for(let i=0;i<total;i++){let sum=0;for(let j=0;j<dec;j++)sum+=pcm[i*dec+j];audio[i]=sum/dec;}
 const levels=[],hopRms=Math.round(rate*.03),win=Math.round(rate*.09),shortWin=Math.round(rate*.056),hop=Math.round(rate*.015);
 for(let i=0;i+hopRms<=total;i+=hopRms){
  let power=0;for(let j=i;j<i+hopRms;j++)power+=audio[j]*audio[j];
  levels.push([i/rate,Math.sqrt(power/hopRms)]);
 }
 const points=[];let missed=0,shortRecovered=0;
 for(let i=0;i+win<=total;i+=hop){
  let hz=offlinePitch(audio.subarray(i,i+win),rate);
  if(!hz){
   // Retest the same center using a strict 56ms frame. This avoids blending an x-/s- onset
   // and a short voiced vowel into a long unreliable 90ms frame.
   const center=i+Math.floor(win*.5);
   const start=Math.max(0,Math.min(total-shortWin,center-Math.floor(shortWin*.5)));
   hz=offlinePitch(audio.subarray(start,start+shortWin),rate);
   if(hz)shortRecovered++;
  }
  if(hz)points.push([(i+win*.5)/rate,hz]);else missed++;
 }
 rec.samples=cleanPitch(points);rec.levels=levels;
 rec.offline={windowMs:90,shortWindowMs:56,hopMs:15,shortRecovered,raw:points.length,kept:rec.samples.length,missed,method:rec.captureMethod};
 return true;
}
async function setupPcmCapture(rec){
 const ctx=rec.ctx,src=rec.source;
 rec.pcmParts=[];rec.captureMethod='none';
 const append=p=>{if(!rec.closed&&rec.pcmParts.length<250)rec.pcmParts.push(new Float32Array(p));};
 const fallback=()=>{
  try{
   const node=ctx.createScriptProcessor(2048,1,1),mute=ctx.createGain();mute.gain.value=0;
   node.onaudioprocess=e=>append(e.inputBuffer.getChannelData(0));
   src.connect(node);node.connect(mute);mute.connect(ctx.destination);
   rec.captureNode=node;rec.muteNode=mute;rec.captureMethod='script';return true;
  }catch{return false;}
 };
 if(!ctx.audioWorklet?.addModule||typeof AudioWorkletNode==='undefined')return fallback();
 const code=`class PGCapture extends AudioWorkletProcessor {
 constructor(){super();this.parts=[];this.size=0;this.port.onmessage=e=>{if(e.data==='flush'){this.flush();this.port.postMessage({type:'flushed'});}};}
 flush(){if(!this.size)return;const out=new Float32Array(this.size);let p=0;
  for(const a of this.parts){out.set(a,p);p+=a.length;}
  this.parts=[];this.size=0;this.port.postMessage(out,[out.buffer]);}
 process(inputs){const a=inputs[0]&&inputs[0][0];
  if(a){this.parts.push(new Float32Array(a));this.size+=a.length;if(this.size>=2048)this.flush();}
  return true;}
}registerProcessor('pg-lab-capture-1',PGCapture);`;
 const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
 try{
  await ctx.audioWorklet.addModule(url);
  const node=new AudioWorkletNode(ctx,'pg-lab-capture-1'),mute=ctx.createGain();mute.gain.value=0;
  node.port.onmessage=e=>{if(e.data instanceof Float32Array)append(e.data);else if(e.data?.type==='flushed'){rec.flushDone?.();rec.flushDone=null;}};
  src.connect(node);node.connect(mute);mute.connect(ctx.destination);
  rec.captureNode=node;rec.muteNode=mute;rec.captureMethod='worklet';return true;
 }catch{return fallback();}
 finally{URL.revokeObjectURL(url);}
}
function cleanup(rec){
 if(!rec)return;
 if(rec.raf)cancelAnimationFrame(rec.raf);
 rec.closed=true;
 try{rec.captureNode?.disconnect()}catch{}
 try{rec.muteNode?.disconnect()}catch{}
 try{rec.source?.disconnect()}catch{}
 try{rec.stream?.getTracks().forEach(t=>t.stop())}catch{}
 try{rec.ctx?.close()}catch{}
}



/* Select a connected compact utterance instead of spanning unrelated noises. */
function selectSpeechSegment(levels,points){
 const loud=levels.filter(p=>p[1]>=.023),maxPause=.38,maxSpan=1.55;
 if(!loud.length)return {from:NaN,to:NaN,frames:0,allFrames:0,discarded:0,ambiguous:false,groups:0};
 const groups=[];let group=[];
 for(const p of loud){
  if(group.length&&p[0]-group.at(-1)[0]>maxPause){groups.push(group);group=[];}
  group.push(p);
 }
 if(group.length)groups.push(group);
 const candidates=[];
 for(const g of groups){
  for(let i=0;i<g.length;i++){
   let j=i;
   while(j+1<g.length&&g[j+1][0]-g[i][0]<=maxSpan)j++;
   const slice=g.slice(i,j+1),from=slice[0][0],to=slice.at(-1)[0];
   if(slice.length<4)continue;
   const pitch=points.filter(p=>p[0]>=from-.06&&p[0]<=to+.06).length;
   const score=slice.length+Math.min(20,pitch)*.18-Math.max(0,to-from-.9)*2;
   candidates.push({from,to,frames:slice.length,score});
   i=Math.max(i,j-2);
  }
 }
 if(!candidates.length)return {from:loud[0][0],to:loud.at(-1)[0],frames:loud.length,allFrames:loud.length,discarded:0,ambiguous:false,groups:groups.length};
 candidates.sort((a,b)=>b.score-a.score);
 const best=candidates[0];
 const alternative=candidates.find(c=>c.to<best.from-.35||c.from>best.to+.35);
 const ambiguous=Boolean(alternative&&alternative.score>=best.score*.72&&alternative.frames>=5);
 return {from:best.from,to:best.to,frames:best.frames,allFrames:loud.length,
  discarded:Math.max(0,loud.length-best.frames),ambiguous,groups:groups.length};
}
function buildRecording(rec){
 const levels=(rec.levels||[]).filter(p=>Array.isArray(p)&&finite(p[0])&&finite(p[1]));
 const voiced=levels.filter(p=>p[1]>=.023);
 const points=(rec.samples||[]).filter(p=>Array.isArray(p)&&finite(p[0])&&finite(p[1])&&p[1]>=70&&p[1]<=600);
 const speech=selectSpeechSegment(levels,points);
 // F0 windows are centered. Use their real timeline within the existing
 // ±60/80ms selection instead of clipping several timestamps to x=1.
 const rmsFrom=speech.from,rmsTo=speech.to;
 const adjacentPitch=points.filter(p=>p[0]>=rmsFrom-.06&&p[0]<=rmsTo+.08);
 const from=adjacentPitch.length?Math.min(rmsFrom,adjacentPitch[0][0]):rmsFrom;
 const to=adjacentPitch.length?Math.max(rmsTo,adjacentPitch.at(-1)[0]):rmsTo;
 const duration=finite(from)&&finite(to)?to-from:0;
 const validSound=speech.frames>=5&&duration>=.24;
 const rmsValues=levels.map(p=>p[1]).sort((a,b)=>a-b),peak=rmsValues.at(-1)??0,p95=rmsValues[Math.max(0,Math.ceil(rmsValues.length*.95)-1)]??0;
 const signal={frames:levels.length,voicedFrames:voiced.length,peak,p95,seconds:levels.at(-1)?.[0]??0,rawF0:points.length,threshold:.023,
   speech:{from:finite(from)?from:0,to:finite(to)?to:0,frames:speech.frames,discarded:speech.discarded,groups:speech.groups,ambiguous:speech.ambiguous,span:duration}};
 const result={word:rec.word,points:[],seconds:Math.max(0,duration),splitRatio:.5,recordedAt:Date.now(),attemptId:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),
  splitSource:'midpoint',splitWarning:'',voiceMs:speech.frames*30,quality:'unmeasured',validParts:[false,false],stats:rec.stats||null,signal,offline:rec.offline||null,
  previewPoints:rec.liveGraphPoints||[],previewSeconds:rec.liveGraphSeconds||0};
 if(!validSound){
   // Preserve meter evidence even if the attempt must not count toward 5/5.
   const span=Math.max(.001,signal.seconds);
   result.levels=levels.map(p=>[Math.max(0,Math.min(1,p[0]/span)),p[1]]).slice(-180);
   return {accepted:false,entry:result,message:'Недостаточный сигнал микрофона: '+voiced.length+' кадров выше порога RMS 0,023 из '+levels.length+'. Пик RMS '+peak.toFixed(4)+'. Проверь, слышен ли голос при воспроизведении записи.'};
 }
 const speechPoints=points.filter(p=>p[0]>=from&&p[0]<=to).slice(-120);
 const span=Math.max(.001,duration);
 const normalized=speechPoints.map(p=>[(p[0]-from)/span,p[1]]);
 // A low-energy valley or a voiced-pitch pause can hint at the boundary.
 // Only use pitch-based alignment when voiced pitch covers most of the audible interval.
 const pitchCoverage=speechPoints.length>1?(speechPoints.at(-1)[0]-speechPoints[0][0])/span:0;
 if(speechPoints.length>=8&&pitchCoverage>.65){
  const guess=estimateSplit(speechPoints,levels);
  const mid=speechPoints[0][0]+guess.ratio*(speechPoints.at(-1)[0]-speechPoints[0][0]);
  result.splitRatio=Math.max(SPLIT_MIN,Math.min(SPLIT_MAX,(mid-from)/span));
  result.splitSource=guess.source;
 }else{
  const nearMiddle=levels.filter(p=>p[0]>=from+.3*span&&p[0]<=from+.7*span);
  if(nearMiddle.length>=4){
   const medium=median(voiced.map(p=>p[1]));
   const valley=nearMiddle.map((p,i)=>({p,rms:nearMiddle.slice(Math.max(0,i-1),i+2).reduce((v,x)=>v+x[1],0)/nearMiddle.slice(Math.max(0,i-1),i+2).length})).sort((a,b)=>a.rms-b.rms)[0];
   if(valley&&valley.rms<medium*.65){result.splitRatio=Math.max(SPLIT_MIN,Math.min(SPLIT_MAX,(valley.p[0]-from)/span));result.splitSource='energy'}
  }
 }
 result.points=cleanPitch(normalized,span);
 // Pitch pauses are not reliable word boundaries in voiceless-onset syllables.
 // An extreme automatic split with insufficient evidence on either side
 // must not be presented as a verified syllable boundary.
 if(result.splitSource==='pause'||result.splitSource==='energy'){
  const ea=contourEvidence(result.points,0,result.splitRatio,duration);
  const eb=contourEvidence(result.points,result.splitRatio,1,duration);
  if((result.splitRatio<.35||result.splitRatio>.65)&&(!ea.usable||!eb.usable)){
   const abandoned=Math.round(result.splitRatio*100);
   result.splitRatio=.5;result.splitSource='uncertain';
   result.splitWarning='Автограница '+abandoned+'% ненадёжна: не хватает данных F0 по обоим слогам. Взята условная середина 50%; проверь границу вручную.';
  }
 }
 result.levels=levels.filter(p=>p[0]>=from&&p[0]<=to).map(p=>[Math.min(1,Math.max(0,(p[0]-from)/span)),p[1]]).slice(-180);
 const i=result.splitRatio;
 result.evidence=[contourEvidence(result.points,0,i,duration),contourEvidence(result.points,i,1,duration)];
 result.validParts=result.evidence.map(x=>x.usable);
 result.quality=result.validParts.every(Boolean)?'both':result.points.length>=2?'partial':'unmeasured';
 if(speech.ambiguous){
  result.splitWarning+=(result.splitWarning?' ':'')+'⚠ В попытке обнаружены несколько похожих голосовых фрагментов, выбор слова неоднозначен.';
  if(result.quality==='both')result.quality='partial';
 }
 const message=result.quality==='both'?'✓ Записано: обе кривые измерены (тоны не оценены).':
  result.quality==='partial'?'✓ Записано. Один слог измерен частично — показаны доступные данные.':
  '✓ Повтор учтён по звуковому сигналу, но высоту голоса измерить не удалось.';
 return {accepted:true,entry:result,message};
}

async function stop(countTake){
 seq++;
 const rec=active;active=null;
 if(!rec){syncControls();return}
 // Freeze EXACTLY the same normalized preview points and 50% split that were
 // displayed during recording. Offline PCM must not replace these points.
 if(countTake){
  rec.liveGraphPoints=rec.previewRenderedPoints||normalizeChartPoints(rec.samples,true);
  rec.liveGraphSeconds=rec.previewRenderedSeconds||(rec.samples.length>=2?Math.max(.1,rec.samples.at(-1)[0]-rec.samples[0][0]):.8);
 }
 rec.keepReplay=Boolean(countTake&&rec.word===state.selected);
 if(countTake&&rec.captureMethod==='worklet'&&rec.captureNode?.port){
  // Flush is asynchronous: the old code analyzed PCM before receiving the
  // final chunk. Wait for the acknowledged chunk (with a short timeout).
  await Promise.race([
   new Promise(resolve=>{
    rec.flushDone=resolve;
    try{rec.captureNode.port.postMessage('flush')}catch{resolve()}
   }),
   new Promise(resolve=>setTimeout(resolve,180))
  ]);
 }
 if(countTake&&rec.pcmParts?.length)reanalyzePcm(rec);
 try{if(rec.recorder?.state==='recording')rec.recorder.stop()}catch{}
 cleanup(rec);
 if(countTake&&rec.word===state.selected){
  const result=buildRecording(rec);
  visibleAttempt=result.entry;
  if(result.accepted){
   const rep=state.reps[rec.word];
   // Keep the last measured attempt even after 5/5; preserve the progress cap.
   if(count(rec.word)>=LIMIT){
    if(rep.mic.length)rep.mic.shift();
    else rep.manual=Math.max(0,rep.manual-1);
   }
   rep.mic.push(result.entry);
   if(rep.mic.length>LIMIT)rep.mic=rep.mic.slice(-LIMIT);
   rep.manual=Math.max(0,Math.min(rep.manual,LIMIT-rep.mic.length));
   persist();
   note=result.message+' '+count(rec.word)+'/5.';
  }else note=result.message;
 }else{
  // A cancelled recording is not a new score and must not reuse an older green line.
  visibleAttempt={word:rec.word,points:[],seconds:0,splitRatio:.5,splitSource:'midpoint',quality:'unmeasured',voiceMs:0};
  note='Запись отменена, попытка не засчитана.';
 }
 update();syncControls();
}

function tick(rec){
 if(active!==rec)return;
 const now=performance.now(),elapsed=now-rec.started;
 if(elapsed>8000){stop(true);return}
 if(now-rec.lastTick>=30){
  rec.lastTick=now;
  rec.analyser.getFloatTimeDomainData(rec.buffer);
  const rms=voiceRms(rec.buffer);
  rec.levels.push([elapsed/1000,rms]);
  if(rec.levels.length>180)rec.levels.shift();
  const lastHz=rec.samples.length?rec.samples[rec.samples.length-1][1]:null;
  let hz=pitchOf(rec.buffer,rec.ctx.sampleRate,lastHz);
  let method='yin';
  if(!hz){hz=fallbackPitchOf(rec.buffer,rec.ctx.sampleRate,lastHz);method='fallback';}
  if(hz){
    rec.stats[method]++;
    // Light smoothing preserving a rising or falling slope.
    const prev=rec.samples.length?rec.samples[rec.samples.length-1][1]:null;
    if(prev&&Math.abs(12*Math.log2(hz/prev))<4)hz=.75*hz+.25*prev;
    rec.samples.push([elapsed/1000,hz]);
    rec.lastVoice=now;
    if(rec.samples.length>150)rec.samples.shift();
  }else rec.stats.none++;
  if(now-(rec.lastDraw||0)>120){rec.lastDraw=now;draw()}
 }
 // A pause helps identify a boundary. Leave enough silence for the next syllable.
 if(rec.lastVoice&&now-rec.lastVoice>1450&&rec.samples.length>=12){stop(true);return}
 rec.raf=requestAnimationFrame(()=>tick(rec));
}

async function start(){
 if(active){stop(true);return}
 if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){
  status('Микрофон недоступен. Открой урок через HTTPS на GitHub Pages в Chrome и разреши доступ к микрофону.');return;
 }
 const turn=++seq,word=state.selected;
 chartView='preview';
 visibleAttempt={word,points:[],seconds:0,splitRatio:.5,splitSource:'midpoint',quality:'unmeasured',voiceMs:0};
 draw();status('Запрашиваю доступ к микрофону…');
 try{
  const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:true,autoGainControl:true}});
  if(turn!==seq||word!==state.selected){stream.getTracks().forEach(t=>t.stop());return}
  const C=window.AudioContext||window.webkitAudioContext;
  if(!C){stream.getTracks().forEach(t=>t.stop());status('Этот браузер не поддерживает обработку звука.');return}
  const ctx=new C();await ctx.resume();
  if(turn!==seq){stream.getTracks().forEach(t=>t.stop());ctx.close();return}
  const source=ctx.createMediaStreamSource(stream),analyser=ctx.createAnalyser();
  analyser.fftSize=4096;analyser.smoothingTimeConstant=0;source.connect(analyser);
  clearReplay();const rec={stream,ctx,source,analyser,buffer:new Float32Array(analyser.fftSize),word,samples:[],levels:[],stats:{yin:0,fallback:0,none:0},lastTick:0,lastDraw:0,lastVoice:0,started:performance.now(),raf:0,recorder:null,token:++replayToken,keepReplay:false,pcmParts:[],captureMethod:'none',captureNode:null,muteNode:null,closed:false};
   const supportsReplay=captureReplay(rec);
   await setupPcmCapture(rec);
   if(turn!==seq||word!==state.selected){cleanup(rec);return;}
   rec.started=performance.now();
  active=rec;status('🎙 Произнеси оба слога. Нажми «Стоп», чтобы закончить.'+(supportsReplay?'':' 回放录音不可用，请用 Chrome 浏览器。'));
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
 r.manual++;persist();note='✓ Повтор '+count(state.selected)+'/5 отмечен вручную, без проверки.';update();
}
function choose(i){
 if(!Number.isInteger(i)||i<0||i>5)return;
 clearReplay();
 if(active)stop(false);
 state.selected=i;visibleAttempt=null;chartView='preview';persist();
 note='Выбрано '+(memo?.words[i]?.zh||'слово')+'. Нажми «Записать голос».';
 update();
 const e=document.getElementById('tone-trainer');e?.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function resetWord(){
 if(active)stop(false);
 if(!window.confirm('Сбросить пять повторений только выбранного слова?'))return;
 state.reps[state.selected]={mic:[],manual:0};visibleAttempt=null;persist();note='Повторы слова сброшены.';update();
}
function reset(){if(active)stop(false);clearReplay();state={selected:0,reps:Array.from({length:6},()=>({mic:[],manual:0}))};visibleAttempt=null;persist()}
// Chart-mode switch is isolated to the tone trainer; it does not affect lesson progress.
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-tone-view]');
 if(!button||button.disabled||!button.closest('.l3-tone-details'))return;
 if(button.dataset.toneView!=='preview'&&button.dataset.toneView!=='analysis')return;
 chartView=button.dataset.toneView;draw();
});
document.addEventListener('click',event=>{
 const btn=event.target.closest('[data-tone-act]');if(!btn||btn.disabled)return;
 const action=btn.dataset.toneAct;
 if(action==='select')choose(Number(btn.dataset.i));
 else if(action==='record')start();
 else if(action==='manual')manual();
 else if(action==='copy-summary'){
  const report=diagnosticSummary();
  const copy=async()=>{
   try{
    if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(report);
    else{
     const el=document.createElement('textarea');
     el.value=report;document.body.appendChild(el);el.select();
     if(!document.execCommand('copy'))throw Error('Copy unavailable');
     el.remove();
    }
    status('✓ Сводка скопирована. Аудио не передаётся.');
   }catch{status('Не удалось скопировать сводку. Можешь выделить текст вручную.');}
  };
  copy();
 }
 else if(action==='clear')resetWord();
 else if(action==='jump')document.getElementById('tone-trainer')?.scrollIntoView({block:'nearest',behavior:'smooth'});
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)stop(false)});
window.addEventListener('pagehide',()=>{if(active)stop(false);clearReplay()});
document.addEventListener('input',event=>{
 const el=event.target;
 if(el?.id!=='tone-split'||active)return;
 const last=visibleAttempt?.word===state.selected?visibleAttempt:state.reps[state.selected].mic.at(-1);
 if(!last||!Array.isArray(last.points)||last.points.length<2)return;
 const pct=Number(el.value);
 if(!finite(pct)||pct<25||pct>75)return;
 last.splitRatio=pct/100;last.splitSource='manual';last.splitWarning='';
  last.evidence=[contourEvidence(last.points,0,last.splitRatio,last.seconds),contourEvidence(last.points,last.splitRatio,1,last.seconds)];
  last.validParts=last.evidence.map(x=>x.usable);last.quality=last.validParts.every(Boolean)?'both':'partial';persist();
 const label=document.getElementById('tone-split-value');
 if(label)label.textContent=pct+'%';
 const hint=document.getElementById('tone-split-hint');
 if(hint)hint.textContent='Граница вручную. Это не распознавание слогов.';
 draw();
});
// Lesson-only replay control: lab page has its own handler, but step 6 does not.
document.addEventListener('click',event=>{
 const button=event.target.closest('#lab-replay');
 if(!button||button.disabled||!button.closest('.l3-tone-details'))return;
 if(!replayUrl||replayWord!==state.selected){status('Нет доступной записи для прослушивания.');return;}
 try{
  if(replayAudio)replayAudio.pause();
  replayAudio=new Audio(replayUrl);
  replayAudio.play().catch(()=>status('Не удалось воспроизвести запись. Проверь звук в браузере.'));
 }catch{status('Не удалось воспроизвести запись.');}
});
window.PandaToneTrainer={render,mount,stop:()=>{if(active)stop(false)},reset,progressText,total,replay:async()=>{if(!replayUrl||replayWord!==state.selected)return false;try{if(replayAudio)replayAudio.pause();replayAudio=new Audio(replayUrl);await replayAudio.play();return true}catch{return false}},diagnostics:()=>{const i=state.selected;return {word:memo?.words?.[i]?.zh||'',pinyin:memo?.words?.[i]?.py||'',selected:i,repeats:count(i),total:total(),recording:Boolean(active),attempt:visibleAttempt?.word===i?visibleAttempt:(state.reps[i]?.mic?.at(-1)||null)}}};
window.PandaToneMathV2={pitchOf,fallbackPitchOf,offlinePitch,reanalyzePcm,cleanPitch,contourEvidence,selectSpeechSegment,estimateSplit,observedTrend,buildRecording,normalizeChartPoints,semitoneContour,isLongPitchGap};
})();
