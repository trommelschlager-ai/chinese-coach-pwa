/* Panda Go HSK2 · Урок 3 · v3: partial syllable measurements, attempts retained, stale curves cleared. */
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

function render(words,art,heading,panel,ttsNote){
 memo={words,art,heading,panel,ttsNote};
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
   '<div class="btnrow tone-actions"><button id="tone-record" class="primary" type="button" data-tone-act="record" '+(done>=LIMIT&&!busy?'disabled':'')+'>'+
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
 const take=active?.word===state.selected?active.samples:(visibleAttempt?.word===state.selected?visibleAttempt.points:(state.reps[state.selected].mic.at(-1)?.points||[]));
 const split=(active&&active.word===state.selected) ? .5 : (visibleAttempt?.word===state.selected?(visibleAttempt.splitRatio??.5):(state.reps[state.selected].mic.at(-1)?.splitRatio??.5));
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
  if(trend){
   const description=observedTrend(normalized,segmentFrom,segmentTo);
   trend.textContent=description.includes('снижалась в середине')?'↘↗ Изгиб':
    description.includes('повышалась')?'↗ Повышается':
    description.includes('понижалась')?'↘ Понижается':
    description.includes('ровной')?'→ Ровный':'— Недостаточно данных';
  }
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
 btn.textContent=running?'■ Стоп':'🎙 Записать голос';
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


function buildRecording(rec){
 const levels=(rec.levels||[]).filter(p=>Array.isArray(p)&&finite(p[0])&&finite(p[1]));
 const voiced=levels.filter(p=>p[1]>=.023);
 const from=voiced[0]?.[0],to=voiced[voiced.length-1]?.[0],duration=finite(from)&&finite(to)?to-from:0;
 const validSound=voiced.length>=5&&duration>=.24;
 const points=(rec.samples||[]).filter(p=>Array.isArray(p)&&finite(p[0])&&finite(p[1])&&p[1]>=70&&p[1]<=600);
 const result={word:rec.word,points:[],seconds:Math.max(0,duration),splitRatio:.5,
  splitSource:'midpoint',voiceMs:voiced.length*65,quality:'unmeasured',validParts:[false,false]};
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
  if(result.accepted&&count(rec.word)<LIMIT){
   state.reps[rec.word].mic.push(result.entry);persist();
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
  if(now-(rec.lastDraw||0)>120){rec.lastDraw=now;draw()}
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
window.PandaToneMathV2={pitchOf,estimateSplit,observedTrend,buildRecording};
})();
