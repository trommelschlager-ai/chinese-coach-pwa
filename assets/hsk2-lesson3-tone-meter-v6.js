/* Panda Go HSK2 · Урок 3 · v5: readable local semitone contours, short-syllable sampling, partial attempts retained. */
(function(){
'use strict';
const KEY='pg-hsk2-l3-tone-trainer-v1';
const TONES=[[1,1],[2,4],[2,4],[2,2],[4,3],[4,1]];
const SYLLABLES=[['gōng','sī'],['xué','xiào'],['tóng','shì'],['tóng','xué'],['diàn','nǎo'],['huì','shuō']];
const SPLIT_MIN=.25,SPLIT_MAX=.75;
const LIMIT=5;
let state={selected:0,reps:Array.from({length:6},()=>({mic:[],manual:0}))};
let active=null, seq=0, memo=null, visibleAttempt=null, note='Выбери слово и нажми «Записать голос».';
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
      splitSource:['pause','energy','manual','midpoint'].includes(t.splitSource)?t.splitSource:'midpoint',
      quality,validParts:Array.isArray(t.validParts)&&t.validParts.length===2?t.validParts.map(Boolean):[false,false],
      voiceMs:finite(t.voiceMs)?Math.max(0,Math.min(8000,t.voiceMs)):0};
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
function esc(x){return String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function render(words,art,heading,panel,ttsNote,listenButton){
 memo={words,art,heading,panel,ttsNote,listenButton};
 const i=state.selected,w=words[i],r=state.reps[i];
 const last=(visibleAttempt?.word===i ? visibleAttempt : (r.mic.length?r.mic[r.mic.length-1]:null));
 const syllables=SYLLABLES[i];
 const ratio=last?.splitRatio??.5;
 const splitLabel=({pause:'по паузе',energy:'по снижению громкости',manual:'вручную',midpoint:'примерно посередине'})[last?.splitSource||'midpoint'];
 const done=count(i),busy=active&&active.word===i;
 return panel(
  '<div id="tone-trainer" class="tone-trainer tone-compact">'+
   '<div class="tone-compact-head"><strong>🎙 Тоны и произношение</strong><span>'+progressText()+' повторений</span></div>'+
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
   '<div class="tone-legend"><span class="tone-legend-target">Пунктир — схема</span><span class="tone-legend-user">Зелёная — твой голос</span></div>'+
   '<div id="tone-status" class="tone-status" role="status" aria-live="polite">'+esc(note)+'</div>'+
   '<div class="btnrow tone-actions">'+(typeof listenButton==='function'?listenButton(w.zh):'')+'<button id="tone-record" class="primary" type="button" data-tone-act="record">'+
    '🎙 Записать голос</button>'+
    '<button type="button" class="action" data-tone-act="manual" '+(done>=LIMIT?'disabled':'')+'>✓ Повторил сам</button></div>'+
   '<details class="tone-advanced"><summary>Граница слогов и пояснения</summary>'+
    '<div class="tone-split-control"><label for="tone-split">Граница слогов: <strong id="tone-split-value">'+Math.round(ratio*100)+'%</strong></label>'+
    '<input type="range" id="tone-split" min="25" max="75" step="1" value="'+Math.round(ratio*100)+'" '+(!last||busy?'disabled':'')+
    ' aria-label="Сместить примерную границу между слогами">'+
    '<p id="tone-split-hint" class="hint">Разделение '+esc(splitLabel)+'. При необходимости поправь после записи.</p></div>'+
    '<p class="hint">Это график высоты голоса, а не подтверждение правильности тонов. Два слога определяются приблизительно, без распознавания речи. Звук не сохраняется и не отправляется на сервер.</p>'+
    '<button class="action tone-reset" type="button" data-tone-act="clear">↻ Сбросить повторы выбранного слова</button>'+
    (last?'<p class="hint">Запись: '+last.seconds.toFixed(1)+' с; измерений: '+last.points.length+'.</p>':'')+
    ttsNote+'</details>'+
   '<p class="tone-safety-label">Схема тонов — ориентир, не оценка произношения.</p>'+
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
 if(pts.length<4)return '— Мало данных';
 const duration=pts.at(-1)[0]-pts[0][0];
 if(duration<.065)return '— Короткий слог';
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
 const selected=points.filter(p=>p[0]>=segmentFrom&&p[0]<=segmentTo);
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
 const take=live?active.samples:(recent?.points||[]);
 const split=live?.5:(recent?.splitRatio??.5);
 const normalized=normalizeChartPoints(take,live);
 const voiceSeconds=live?Math.max(.1,(take.at(-1)?.[0]??0)-(take[0]?.[0]??0)):
  (finite(recent?.seconds)&&recent.seconds>.1?recent.seconds:.8);
 const shapes={1:[.26,.26],2:[.72,.20],3:[.57,.82,.40],4:[.17,.84]};
 for(let syll=0;syll<2;syll++){
  const canvas=document.getElementById('tone-canvas-'+(syll+1));if(!canvas)continue;
  const ctx=canvas.getContext('2d');if(!ctx)continue;
  const w=canvas.width,h=canvas.height,l=40,r=12,t=15,b=23,plotW=w-l-r,plotH=h-t-b;
  const segmentFrom=syll===0?0:split,segmentTo=syll===0?split:1;
  const trace=semitoneContour(normalized,segmentFrom,segmentTo);
  // Minimum ±5 semitones makes 2.8–3.6-semitone movements clearly visible.
  // Expand instead of clipping and inventing a horizontal end plateau.
  const axisHalf=Math.max(5,Math.ceil(Math.max(0,...trace.map(p=>Math.abs(p.semitones)))*2)/2);
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
  const trend=document.getElementById('tone-trend-'+(syll+1));
  if(trend)trend.textContent=observedTrend(normalized,segmentFrom,segmentTo);
  if(trace.length<2)continue;
  ctx.strokeStyle='#198b70';ctx.lineWidth=3.5;
  let painted=0,prior=null;ctx.beginPath();
  for(const p of trace){
   const x=l+plotW*p.x;
   const y=t+plotH*(.5-p.semitones/(2*axisHalf));
   if(prior!==null&&isLongPitchGap(prior,p.time,voiceSeconds)){
    if(painted>=2)ctx.stroke();
    ctx.beginPath();painted=0;
   }
   if(painted===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
   prior=p.time;painted++;
  }
  if(painted>=2)ctx.stroke();
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
 if(!memo)return;
 const root=document.getElementById('content');if(!root||!document.getElementById('tone-trainer'))return;
 const scroll=root.scrollTop;
 root.innerHTML=render(memo.words,memo.art,memo.heading,memo.panel,memo.ttsNote,memo.listenButton);
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


function buildRecording(rec){
 const levels=(rec.levels||[]).filter(p=>Array.isArray(p)&&finite(p[0])&&finite(p[1]));
 const voiced=levels.filter(p=>p[1]>=.023);
 const from=voiced[0]?.[0],to=voiced[voiced.length-1]?.[0],duration=finite(from)&&finite(to)?to-from:0;
 const validSound=voiced.length>=5&&duration>=.24;
 const points=(rec.samples||[]).filter(p=>Array.isArray(p)&&finite(p[0])&&finite(p[1])&&p[1]>=70&&p[1]<=600);
 const result={word:rec.word,points:[],seconds:Math.max(0,duration),splitRatio:.5,
  splitSource:'midpoint',voiceMs:voiced.length*45,quality:'unmeasured',validParts:[false,false]};
 if(!validSound)return {accepted:false,entry:result,message:'Слишком мало звука для попытки. Повтори слово ближе к микрофону.'};
 const speechPoints=points.filter(p=>p[0]>=from-.08&&p[0]<=to+.08).slice(-120);
 const span=Math.max(.001,duration);
 const normalized=speechPoints.map(p=>[Math.min(1,Math.max(0,(p[0]-from)/span)),p[1]]);
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
 result.points=normalized;
 const i=result.splitRatio,first=normalized.filter(p=>p[0]<i),second=normalized.filter(p=>p[0]>=i);
 const enough=arr=>arr.length>=4&&(arr.at(-1)[0]-arr[0][0])>=.10;
 result.validParts=[enough(first),enough(second)];
 result.quality=result.validParts.every(Boolean)?'both':normalized.length>=2?'partial':'unmeasured';
 const message=result.quality==='both'?'✓ Записано: обе кривые измерены (тоны не оценены).':
  result.quality==='partial'?'✓ Записано. Один слог измерен частично — показаны доступные данные.':
  '✓ Повтор учтён по звуковому сигналу, но высоту голоса измерить не удалось.';
 return {accepted:true,entry:result,message};
}

function stop(countTake){
 seq++;
 const rec=active;active=null;
 if(!rec){syncControls();return}
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
 if(now-rec.lastTick>=45){
  rec.lastTick=now;
  rec.analyser.getFloatTimeDomainData(rec.buffer);
  const rms=voiceRms(rec.buffer);
  rec.levels.push([elapsed/1000,rms]);
  if(rec.levels.length>180)rec.levels.shift();
  const lastHz=rec.samples.length?rec.samples[rec.samples.length-1][1]:null;
  let hz=pitchOf(rec.buffer,rec.ctx.sampleRate,lastHz);
  if(hz){
    // Light smoothing preserving a rising or falling slope.
    const prev=rec.samples.length?rec.samples[rec.samples.length-1][1]:null;
    if(prev&&Math.abs(12*Math.log2(hz/prev))<4)hz=.75*hz+.25*prev;
    rec.samples.push([elapsed/1000,hz]);
    rec.lastVoice=now;
    if(rec.samples.length>150)rec.samples.shift();
  }
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
  const rec={stream,ctx,source,analyser,buffer:new Float32Array(analyser.fftSize),word,samples:[],levels:[],lastTick:0,lastDraw:0,lastVoice:0,started:performance.now(),raf:0};
  active=rec;status('🎙 Произнеси оба слога. Нажми «Стоп», чтобы закончить.');
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
 if(active)stop(false);
 state.selected=i;visibleAttempt=null;persist();
 note='Выбрано '+(memo?.words[i]?.zh||'слово')+'. Нажми «Записать голос».';
 update();
 const e=document.getElementById('tone-trainer');e?.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function resetWord(){
 if(active)stop(false);
 if(!window.confirm('Сбросить пять повторений только выбранного слова?'))return;
 state.reps[state.selected]={mic:[],manual:0};visibleAttempt=null;persist();note='Повторы слова сброшены.';update();
}
function reset(){if(active)stop(false);state={selected:0,reps:Array.from({length:6},()=>({mic:[],manual:0}))};visibleAttempt=null;persist()}
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
 const last=visibleAttempt?.word===state.selected?visibleAttempt:state.reps[state.selected].mic.at(-1);
 if(!last||!Array.isArray(last.points)||last.points.length<2)return;
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
window.PandaToneMathV2={pitchOf,estimateSplit,observedTrend,buildRecording,normalizeChartPoints,semitoneContour,isLongPitchGap};
})();
