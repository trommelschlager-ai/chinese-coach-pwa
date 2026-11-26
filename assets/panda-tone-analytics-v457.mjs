/* Panda Go — experimental Mandarin tone contour helper v1.
 * Pitch movement ONLY. A microphone F0 curve cannot certify Mandarin tone,
 * vowel/consonant quality, lexical identity, or native-like pronunciation.
 * Audio stays in browser memory and is never transmitted by this module.
 */
export const TONE_LAB_VERSION="v468-short-movement-diagnostics";
const median=a=>{if(!a.length)return null;const s=[...a].sort((x,y)=>x-y),k=s.length>>1;return s.length%2?s[k]:(s[k-1]+s[k])/2;};
export const semitones=(hz,ref)=>12*Math.log2(hz/ref);

/* Cautious movement description for SHORT natural syllables.
 * A direction is NOT a lexical Mandarin tone or a grade. No interpolation
 * across missing voiced frames or octave jumps: use only one stable run.
 */
export function shortPitchMovement(frames){
 const p=Array.isArray(frames)?frames:[];
 if(p.length<12)return null;
 const duration=p.at(-1).t-p[0].t;
 if(duration<.20||duration>.52)return null;
 if(p.some((x,i)=>!Number.isFinite(x.hz)||x.hz<=0||
  (i>0&&(x.t<=p[i-1].t||x.t-p[i-1].t>.085))))return null;
 if(findOctaveDiscontinuities(p).length)return null;
 const hzRef=median(p.map(x=>x.hz));
 const values=p.map(x=>semitones(x.hz,hzRef));
 const part=Math.max(3,Math.floor(values.length*.24));
 const head=median(values.slice(0,part));
 const tail=median(values.slice(-part));
 const change=tail-head;
 const valley=Math.min(...values.slice(part,values.length-part));
 const middle=median(values.slice(Math.floor(values.length*.4),Math.ceil(values.length*.6)));
 const range=Math.max(...values)-Math.min(...values);
 const settled=values.slice(Math.floor(values.length*.30));
 const settledRange=Math.max(...settled)-Math.min(...settled);
 let direction="uncertain",text="Движение высоты пока неоднозначно";
 // Tone-1 reference has a short initial rise, then a high, almost level vowel.
 // Do not label that phonation onset as an overall rising (second-tone) pattern.
 if(change>1.5&&settledRange<1.25){
  direction="level";text="После короткого начала высота почти ровная";
 }else if(head-valley>1.3&&tail-valley>1.3&&middle<head-.65&&middle<tail-.65){
  direction="dip";text="Высота сначала снижается, затем повышается";
 }else if(change>=1.8){
  direction="rise";text="Высота в основном повышается";
 }else if(change<=-1.8){
  direction="fall";text="Высота в основном снижается";
 }else if(Math.abs(change)<.9&&range<1.8){
  direction="level";text="Высота почти не меняется";
 }
 return {direction,text,durationSec:+duration.toFixed(2),
  startToEndSt:+change.toFixed(1),
  isToneGrade:false,confidence:"exploratory"};
}


/* Rapid almost-2x or half-F0 changes are a warning for octave tracking errors.
 * This heuristic NEVER repairs a frequency or assigns a Mandarin tone.
 * Natural irregular phonation may also cause them: the verdict stays uncertain.
 */
export function findOctaveDiscontinuities(frames){
 const pts=(frames||[]).filter(p=>Number.isFinite(p?.hz)&&p.hz>0&&Number.isFinite(p?.t)).sort((a,b)=>a.t-b.t);
 const jumps=[];
 for(let i=1;i<pts.length;i++){
  const a=pts[i-1],b=pts[i],dt=b.t-a.t,ratio=b.hz/a.hz;
  if(dt<=0||dt>0.09)continue;
  if((ratio>=1.7&&ratio<=2.35)||(ratio>=1/2.35&&ratio<=1/1.7)){
   jumps.push({t:+b.t.toFixed(3),fromHz:+a.hz.toFixed(1),toHz:+b.hz.toFixed(1)});
  }
 }
 return jumps;
}


export function estimatePitch(samples,rate,{minHz=70,maxHz=550}={}){
 if(!samples||samples.length<1024||!Number.isFinite(rate)||rate<8000)return null;
 // Microphone sample rates are usually 44.1/48 kHz. Downsample for mobile CPU.
 const factor=Math.max(1,Math.round(rate/12000));
 const n=Math.floor(samples.length/factor),ds=new Float32Array(n);
 let sumSq=0;
 for(let i=0;i<n;i++){
  let v=0;for(let k=0;k<factor;k++)v+=samples[i*factor+k];
  ds[i]=v/factor;sumSq+=ds[i]*ds[i];
 }
 const rms=Math.sqrt(sumSq/n);
 if(rms<0.012)return null; // Silence / background room noise
 const sr=rate/factor,minLag=Math.max(2,Math.floor(sr/maxHz)),maxLag=Math.min(Math.floor(sr/minHz),Math.floor(n/3));
 if(maxLag<=minLag)return null;
 // YIN: normalized difference between overlapping frames.
 const d=new Float64Array(maxLag+1),span=Math.min(900,n-maxLag);
 for(let lag=1;lag<=maxLag;lag++){
  let sum=0;
  for(let i=0;i<span;i++){
   const v=ds[i]-ds[i+lag];sum+=v*v;
  }
  d[lag]=sum;
 }
 const score=new Float64Array(maxLag+1);
 let total=0;
 for(let lag=1;lag<=maxLag;lag++){
  total+=d[lag];
  score[lag]=total>0?(d[lag]*lag)/total:1;
 }
 // First deep enough local minimum, avoiding higher-octave harmonic locks.
 let best=-1;
 for(let lag=minLag;lag<maxLag-1;lag++){
  if(score[lag]<0.18){
   while(lag<maxLag-1&&score[lag+1]<score[lag])lag++;
   best=lag;break;
  }
 }
 if(best<0)return null; // Not confidently periodic: don't invent pitch
 let offset=0;
 if(best>1&&best<maxLag){
  const a=score[best-1],b=score[best],c=score[best+1],denom=a-2*b+c;
  if(Math.abs(denom)>1e-8)offset=Math.max(-0.5,Math.min(0.5,(a-c)/(2*denom)));
 }
 const hz=sr/(best+offset);
 if(!Number.isFinite(hz)||hz<minHz||hz>maxHz)return null;
 return {hz,rms,clarity:Math.max(0,Math.min(1,1-score[best]))};
}

export function analyseContour(frames){
 const voiced=(frames||[]).filter(f=>Number.isFinite(f?.hz)&&f.hz>=70&&f.hz<=550&&Number.isFinite(f?.t)).sort((a,b)=>a.t-b.t);
 if(voiced.length<10)return {kind:"insufficient",label:"Недостаточно чистого голоса",reason:"Голос обнаружен недостаточно устойчиво для графика; можно повторить слог обычным голосом.",points:[],isToneGrade:false};
 // Keep the longest contiguous voiced run: avoid mixing two attempts / noises.
 let runs=[],run=[];
 for(const point of voiced){
  if(run.length&&point.t-run.at(-1).t>0.16){runs.push(run);run=[];}
  run.push(point);
 }
 if(run.length)runs.push(run);
 const pts=runs.sort((a,b)=>b.length-a.length)[0]||[];
 const octaveJumps=findOctaveDiscontinuities(pts);
 const suspicious=octaveJumps.length;
 // A 0.34 s voice fragment with 10 f0 samples is NOT enough evidence to describe tone movement.
 // Require a stable voiced portion, not merely 3 seconds with mostly silence.
 const MIN_VOICED_S=0.50,MIN_PITCH_FRAMES=16;
 if(pts.length<MIN_PITCH_FRAMES||pts.at(-1).t-pts[0].t<MIN_VOICED_S){
  const duration=pts.length?pts.at(-1).t-pts[0].t:0;
  // Show *ungraded* pitch dots for some short stable syllables, including natural clips.
  // Do not join noisy gaps (unvoiced frames) or octave jumps into a fake tone curve.
  const stableShort=!suspicious&&pts.length>=8&&duration>=.20&&
   pts.every((p,i)=>i===0||p.t-pts[i-1].t<=.085);
  const reference=stableShort?median(pts.map(x=>x.hz)):null;
  const preview=stableShort?pts.map(p=>({t:p.t-pts[0].t,st:semitones(p.hz,reference)})):[];
  return {kind:"insufficient",label:preview.length?"Короткий участок голоса виден, но для оценки его мало":"Слишком короткий голосовой фрагмент",
   reason:suspicious
     ?"Фрагмент короткий и содержит резкие скачки частоты почти вдвое. Это может быть ошибка измерения, а не твоё произношение. Попробуй повторить слог обычным голосом."
     :preview.length
       ?"Сплошная линия показывает только измеренный короткий участок, не правильность тона. Можно попробовать ещё раз обычным голосом, без искусственного растягивания слога."
       :"Достоверно сравнить движение тона пока нельзя. Попробуй произнести слог как в обычной речи.",
   points:preview,shapeHint:preview.length?shortPitchMovement(pts):null,
   stats:{duration:+duration.toFixed(2),voicedFrames:pts.length,octaveJumpCount:suspicious,previewOnly:preview.length>0},
   isToneGrade:false};
 }
 // Even a long clip must NOT yield a tone-shaped verdict if f0 abruptly doubles/halves.
 // Preserve raw points in manual diagnostics, but omit misleading plotted points.
 if(suspicious)return {kind:"uncertain",label:"Возможный сбой отслеживания высоты голоса",
  reason:"Найдены резкие изменения частоты почти вдвое. Это может быть ошибка октавы в алгоритме. Нельзя оценить китайский тон по такому графику.",
  points:[],stats:{duration:+(pts.at(-1).t-pts[0].t).toFixed(2),voicedFrames:pts.length,octaveJumpCount:suspicious},
  isToneGrade:false};
 // Median filtering removes single octave jumps without manufacturing a melody.
 const medHz=median(pts.map(p=>p.hz));
 let cleaned=pts.filter((p,i)=>{
  const nearby=pts.slice(Math.max(0,i-2),Math.min(pts.length,i+3)).map(x=>x.hz);
  return Math.abs(semitones(p.hz,median(nearby)))<5;
 });
 if(cleaned.length<MIN_PITCH_FRAMES)return {kind:"uncertain",label:"Слишком шумная запись",reason:"Стабильных отсчётов мало. Попробуй повторить слог обычным голосом; отдельные звуки могли быть пропущены анализатором.",points:[],isToneGrade:false};
 const smooth=cleaned.map((p,i)=>{
  const nearby=cleaned.slice(Math.max(0,i-1),Math.min(cleaned.length,i+2)).map(x=>x.hz);
  return {t:p.t,hz:median(nearby)};
 });
 // Missing F0 is not a measured pitch transition. Refuse directional
 // coaching on an internally interrupted long contour, rather than
 // interpolating across it or treating the absence as a learner mistake.
 const gapCount=smooth.slice(1).filter((p,i)=>p.t-smooth[i].t>.085||p.t<=smooth[i].t).length;
 if(gapCount)return {kind:"uncertain",label:"Измерение высоты прерывается",
  reason:"В записи есть пропуски измерений. Нельзя уверенно сравнить движение тона; это не означает ошибку произношения.",
  points:[],stats:{duration:+(smooth.at(-1).t-smooth[0].t).toFixed(2),voicedFrames:smooth.length,gapCount},isToneGrade:false};
 const values=smooth.map(p=>semitones(p.hz,medHz));
 const N=values.length,part=Math.max(3,Math.floor(N*0.24));
 const first=median(values.slice(0,part)),mid=median(values.slice(Math.floor(N*.38),Math.ceil(N*.62))),last=median(values.slice(-part));
 const early=median(values.slice(0,Math.ceil(N*.38))),late=median(values.slice(Math.floor(N*.62)));
 const valley=Math.min(...values.slice(Math.floor(N*.12),Math.ceil(N*.85)));
 const totalRise=last-first,fallToValley=first-valley,riseFromValley=last-valley;
 let kind="uncertain",label="Контур неоднозначный",reason="По одной высоте голоса тон достоверно не определяется. Повтори слог спокойно.";
 if(fallToValley>1.35&&riseFromValley>1.6&&mid<first-.8&&mid<last-.6){
  kind="dip";label="Видно снижение и последующий подъём";reason="Такая форма возможна у изолированного 3-го тона, но это ещё не проверка произношения.";
 }else if(totalRise>2.2&&fallToValley<1.75&&late>early+.8){
  kind="rise";label="Высота голоса повышается";reason="Это движение характерно для 2-го тона. Одной кривой недостаточно для оценки правильности.";
 }else if(totalRise< -1.8){
  kind="fall";label="Высота голоса снижается";reason="Низкий/нисходящий вариант 3-го тона бывает в связной речи; изолированный слог требует контекста.";
 }else if(Math.abs(totalRise)<1.1&&Math.max(...values)-Math.min(...values)<2.2){
  kind="level";label="Высота голоса почти ровная";reason="Попробуй выраженнее изменить интонацию и повтори.";
 }
 const duration=smooth.at(-1).t-smooth[0].t;
 return {kind,label,reason,points:smooth.map(p=>({t:p.t-smooth[0].t,st:semitones(p.hz,medHz)})),
  stats:{duration:+duration.toFixed(2),voicedFrames:smooth.length,startToEndSt:+totalRise.toFixed(1),valleySt:+valley.toFixed(1),medianHz:+medHz.toFixed(0)},
  isToneGrade:false};
}
