/* Panda Go HSK2 v4: local, reference-guided spectral alignment.
 * Not a phoneme recognizer or phonetic forced aligner.
 * A reference with correct manually verified syllable marks is required
 * before these transferred timings can be considered trustworthy.
 * No media upload, speech-to-text, remote processing or tone grade.
 */
const TARGET_RATE=12000,FFT=512,HOP=0.02,FILTERS=18;
const m=hz=>2595*Math.log10(1+hz/700);
const hz=mel=>700*(10**(mel/2595)-1);
function createFilters(){
 const lo=m(100),hi=m(4800),p=Array.from({length:FILTERS+2},(_,i)=>hz(lo+(hi-lo)*i/(FILTERS+1))*FFT/TARGET_RATE);
 const out=[];
 for(let k=0;k<FILTERS;k++){
  const line=new Float32Array(FFT/2+1),a=p[k],b=p[k+1],c=p[k+2];
  for(let i=Math.max(0,Math.floor(a));i<=Math.min(FFT/2,Math.ceil(c));i++){
   line[i]=i<b?(i-a)/Math.max(.01,b-a):(c-i)/Math.max(.01,c-b);
   line[i]=Math.max(0,line[i]);
  }out.push(line);
 }return out;
}
const FILTER_BANK=createFilters();
function spectrum(real){
 const n=real.length,im=new Float32Array(n);
 for(let i=1,j=0;i<n;i++){
  let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;
  if(i<j){const a=real[i];real[i]=real[j];real[j]=a;}
 }
 for(let len=2;len<=n;len<<=1){
  const a=-2*Math.PI/len,wr=Math.cos(a),wi=Math.sin(a);
  for(let i=0;i<n;i+=len){let re=1,imag=0;
   for(let j=0;j<len/2;j++){
    const u=real[i+j],v=im[i+j],r=real[i+j+len/2]*re-im[i+j+len/2]*imag;
    const t=real[i+j+len/2]*imag+im[i+j+len/2]*re;
    real[i+j]=u+r;im[i+j]=v+t;real[i+j+len/2]=u-r;im[i+j+len/2]=v-t;
    const nr=re*wr-imag*wi;imag=re*wi+imag*wr;re=nr;
   }
  }
 }
 const power=new Float32Array(n/2+1);
 for(let i=0;i<power.length;i++)power[i]=real[i]*real[i]+im[i]*im[i];
 return power;
}
function features(buffer,start,end){
 if(!buffer?.getChannelData||!(buffer.sampleRate>0))return null;
 const data=buffer.getChannelData(0),sr=buffer.sampleRate;
 start=Math.max(0,start);end=Math.min(data.length/sr,end);
 if(end-start<.35)return null;
 const frames=[],half=(FFT/TARGET_RATE)/2;
 for(let center=start+half;center<=end-half;center+=HOP){
  const real=new Float32Array(FFT);let energy=0,prev=0;
  for(let i=0;i<FFT;i++){
   const srcPos=(center-half+i/TARGET_RATE)*sr;
   const ix=Math.max(0,Math.min(data.length-2,Math.floor(srcPos)));
   const frac=srcPos-ix;
   const x=data[ix]*(1-frac)+data[ix+1]*frac;
   const v=x-.93*prev;prev=x;energy+=x*x;
   real[i]=v*(.54-.46*Math.cos(2*Math.PI*i/(FFT-1)));
  }
  const p=spectrum(real),vec=new Float32Array(FILTERS);
  for(let j=0;j<FILTERS;j++){
   const filt=FILTER_BANK[j];let sum=0;
   for(let k=0;k<p.length;k++)sum+=p[k]*filt[k];
   vec[j]=Math.log(1e-5+sum);
  }
  // Normalize each spectrum: microphone level and vocal pitch are not tone grades.
  let mean=0;for(const v of vec)mean+=v;mean/=FILTERS;
  let norm=0;for(let j=0;j<FILTERS;j++){vec[j]-=mean;norm+=vec[j]*vec[j];}
  norm=Math.sqrt(norm/FILTERS)||1;
  for(let j=0;j<FILTERS;j++)vec[j]/=norm;
  frames.push({t:center,vec,rms:Math.sqrt(energy/FFT)});
 }
 return frames;
}
function cost(a,b){
 let sum=0;
 for(let k=0;k<FILTERS;k++){const d=a.vec[k]-b.vec[k];sum+=d*d;}
 return sum/FILTERS;
}
export function alignFromReference(referenceBuffer,learnerBuffer,referenceBounds,learnerBounds){
 if(!Array.isArray(referenceBounds)||referenceBounds.length<3||
    !Array.isArray(learnerBounds)||referenceBounds.length!==learnerBounds.length||
    referenceBounds.some((v,i)=>!Number.isFinite(v)||(i>0&&v<=referenceBounds[i-1]))||
    learnerBounds.some((v,i)=>!Number.isFinite(v)||(i>0&&v<=learnerBounds[i-1])))
  return {ok:false,reason:'Не найдены корректные границы записи'};
 const validBufferBounds=(buffer,bounds)=>{
  if(!buffer?.getChannelData||!Number.isFinite(buffer.sampleRate)||buffer.sampleRate<8000)return false;
  try{const data=buffer.getChannelData(0);return !!data&&bounds[0]>=0&&bounds.at(-1)<=data.length/buffer.sampleRate+1e-6;}catch{return false;}
 };
 if(!validBufferBounds(referenceBuffer,referenceBounds)||!validBufferBounds(learnerBuffer,learnerBounds))
  return {ok:false,reason:'Границы выходят за пределы записи'};
 const dr=referenceBounds.at(-1)-referenceBounds[0],du=learnerBounds.at(-1)-learnerBounds[0],ratio=du/dr;
 // A substantially shorter recording can omit an entire interval. Refuse
 // automatic transfer; fast natural speech remains valid for manual review.
 if(ratio<.75||ratio>1.95)return {ok:false,reason:'Длительность фраз сильно различается: автоматический перенос границ ненадёжен. Это не ошибка произношения',uncertain:true};
 const r=features(referenceBuffer,referenceBounds[0],referenceBounds.at(-1));
 const u=features(learnerBuffer,learnerBounds[0],learnerBounds.at(-1));
 if(!r||!u||r.length<12||u.length<12||r.length>500||u.length>650)
  return {ok:false,reason:'Недостаточно звуковых кадров или слишком длинная запись'};
 // Guard against matching silence to silence and unvoiced holes.
 // Energy coverage is only a safety gate, not lexical identity or pronunciation.
 const sufficientEnergy=frames=>{
  const peak=Math.max(...frames.map(f=>f.rms));
  if(!Number.isFinite(peak)||peak<.004)return false;
  const gate=Math.max(.0025,Math.min(.018,peak*.12));
  return frames.filter(f=>f.rms>=gate).length>=Math.max(8,Math.ceil(frames.length*.25));
 };
 if(!sufficientEnergy(r)||!sufficientEnergy(u))
  return {ok:false,reason:'Недостаточно звукового сигнала для сопоставления'};
 const n=r.length,z=u.length,stride=z+1;
 const costs=new Float64Array((n+1)*stride),parent=new Uint8Array((n+1)*stride);
 costs.fill(Infinity);costs[0]=0;
 const slope=z/n;
 for(let i=1;i<=n;i++){
  const ideal=i*slope;
  const band=Math.max(9,Math.floor(z*.18));
  const low=Math.max(1,Math.floor(ideal-band));
  const high=Math.min(z,Math.ceil(ideal+band));
  for(let j=low;j<=high;j++){
   const drift=j/z-i/n;
   const local=cost(r[i-1],u[j-1])+1.2*(drift/.18)**2;
   const diag=costs[(i-1)*stride+j-1];
   const up=costs[(i-1)*stride+j]+.075;
   const left=costs[i*stride+j-1]+.075;
   let best=diag,which=1;
   if(up<best){best=up;which=2;}
   if(left<best){best=left;which=3;}
   if(Number.isFinite(best)){costs[i*stride+j]=best+local;parent[i*stride+j]=which;}
  }
 }
 if(!Number.isFinite(costs[n*stride+z]))return {ok:false,reason:'Акустическое сопоставление не нашло непрерывный путь'};
 const links=Array.from({length:n},()=>[]);
 let i=n,j=z,steps=0,stretched=0;const matches=[];
 while(i>0&&j>0&&steps<n+z+3){
  const code=parent[i*stride+j];
  if(!code)break;
  links[i-1].push(u[j-1].t);
  matches.push({rt:r[i-1].t,ut:u[j-1].t,cost:cost(r[i-1],u[j-1]),rms:u[j-1].rms});
  if(code===1){i--;j--;}else if(code===2){i--;stretched++;}else {j--;stretched++;}
  steps++;
 }
 if(i>0||j>0)return {ok:false,reason:'Сопоставление не дошло до начала фразы'};
 const means=links.map(a=>a.length?a.reduce((q,v)=>q+v,0)/a.length:NaN);
 let last=learnerBounds[0];
 for(let k=0;k<means.length;k++){
  if(!Number.isFinite(means[k]))means[k]=last;
  last=means[k];
 }
 const out=[learnerBounds[0]];
 for(let b=1;b<referenceBounds.length-1;b++){
  const t=referenceBounds[b];
  // Interpolate between mapped spectral frame centers rather than snapping
  // every landmark to a 20 ms grid. This improves temporal precision only.
  let k=0;
  while(k+1<r.length&&r[k+1].t<t)k++;
  let mapped=means[k];
  if(k+1<r.length&&t>=r[k].t){
   const fraction=(t-r[k].t)/(r[k+1].t-r[k].t);
   mapped=means[k]+fraction*(means[k+1]-means[k]);
  }
  const prev=out.at(-1),remaining=referenceBounds.length-1-b;
  const safe=Math.max(prev+.055,Math.min(learnerBounds.at(-1)-remaining*.055,mapped));
  out.push(safe);
 }
 out.push(learnerBounds.at(-1));
 // Global average can conceal an entire unmatched interval. Reject the
 // proposed boundary transfer, not the learner's pronunciation.
 // These experimental gates require validation across real speakers.
 const peakU=Math.max(...u.map(f=>f.rms));
 const gateU=Math.max(.0025,Math.min(.018,peakU*.12));
 const localDiagnostics=referenceBounds.slice(0,-1).map((a,k)=>{
  const b=referenceBounds[k+1],m=matches.filter(x=>x.rt>=a&&x.rt<b);
  const unique=new Map(m.map(x=>[x.ut,x.rms]));
  const localCost=m.reduce((sum,x)=>sum+x.cost,0)/Math.max(1,m.length);
  const coverage=[...unique.values()].filter(v=>v>=gateU).length/Math.max(1,unique.size);
  const relativeDuration=(out[k+1]-out[k])/(b-a)/ratio;
  return {frames:unique.size,localCost,coverage,relativeDuration};
 });
 const questionable=localDiagnostics.some(d=>d.frames<3||d.localCost>1.5||d.coverage<.25||d.relativeDuration<.30||d.relativeDuration>3);
 if(questionable)return {ok:false,reason:'Один или несколько участков не удалось надёжно сопоставить. Проверь фразу и границы вручную',diagnostics:{localDiagnostics},uncertain:true};
 const avg=costs[n*stride+z]/Math.max(1,steps);
 // Diagnostics only, NOT a pronunciation score or confidence percentage.
 if(avg>2.6||stretched/Math.max(1,steps)>.76)
  return {ok:false,reason:'Слишком мало акустического сходства для переноса границ',diagnostics:{avgCost:avg,warpingFraction:stretched/steps}};
 return {ok:true,bounds:out,method:'spectral-dtw',referenceFrames:n,learnerFrames:z,
  diagnostics:{avgCost:+avg.toFixed(3),warpingFraction:+(stretched/steps).toFixed(2)},
  uncertain:true,description:'Предварительное сопоставление по звучанию; не фонетически точная разметка и не оценка тонов'};
}

// An interval is a provisional audio landmark, not a recognized syllable.
export function reviewInterval(buffer,bounds,index){
 if(!buffer?.getChannelData||!Number.isFinite(buffer.sampleRate)||buffer.sampleRate<8000||
    !Array.isArray(bounds)||!Number.isInteger(index)||index<0||index>=bounds.length-1||
    bounds.some((x,i)=>!Number.isFinite(x)||x<0||(i>0&&x<=bounds[i-1])))return null;
 const start=bounds[index],end=bounds[index+1];
 let limit;try{limit=buffer.getChannelData(0).length/buffer.sampleRate}catch{return null}
 if(end>limit+1e-6||end-start<.055)return null;
 return {startSec:start,durationSec:Math.min(limit,end)-start};
}
// Do not infer a pitch direction from disconnected or fallback-heavy points.
export function intervalPitchEvidence(frames,bounds,index){
 const fail=(text,count=0)=>({weak:true,text,count,isToneGrade:false});
 if(!Array.isArray(frames)||!Array.isArray(bounds)||!Number.isInteger(index)||index<0||index>=bounds.length-1)return fail('нет данных');
 const a=bounds[index],b=bounds[index+1];
 if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a)return fail('нет границ');
 const points=frames.filter(p=>Number.isFinite(p.t)&&Number.isFinite(p.hz)&&p.hz>=65&&p.hz<=550&&p.t>=a&&(index===bounds.length-2?p.t<=b:p.t<b));
 const count=points.length;
 if(count<6)return fail('мало F0',count);
 if(points.filter(p=>p.method==='autocorrelation').length/count>.4)return fail('неустойчивое F0',count);
 if(points.some((p,i)=>i>0&&(p.t<=points[i-1].t||p.t-points[i-1].t>.085||Math.abs(12*Math.log2(p.hz/points[i-1].hz))>=5)))return fail('разрыв F0',count);
 if((points.at(-1).t-points[0].t)/(b-a)<.45)return fail('мало покрытия F0',count);
 return {weak:false,text:'контур виден',count,points,isToneGrade:false};
}


// Context is supplied by the known teaching phrase, never inferred from F0.
// These are practice suggestions, not a classification of lexical tone.
export function contextualPitchAdvice({surfaceTone,evidence,verified}={}){
 const reply=(kind,text)=>({kind,text,isToneGrade:false});
 if(!verified)return reply('unverified','Границы пока не проверены на слух: отдельный контур не связываем с конкретным иероглифом.');
 if(surfaceTone===0)return reply('neutral','У нейтрального тона нет фиксированного контура. Сравни краткость и лёгкость с образцом, не пытайся удерживать заданную высоту.');
 if(![1,2,3,4].includes(surfaceTone)||!evidence||evidence.weak||!Array.isArray(evidence.points))return reply('uncertain','Измерения участка ненадёжны: направление пока не определяем.');
 const pts=evidence.points;
 if(pts.length<8||pts.at(-1).t-pts[0].t<.12||pts.some(p=>!Number.isFinite(p.hz)||p.hz<=0))return reply('uncertain','Участок слишком короткий для подсказки о движении высоты.');
 const median=values=>{const a=[...values].sort((x,y)=>x-y),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;};
 const n=pts.length,k=Math.max(2,Math.floor(n*.25));
 const st=pts.map(p=>12*Math.log2(p.hz));
 const first=median(st.slice(0,k)),last=median(st.slice(-k)),mid=median(st.slice(Math.floor(n*.35),Math.ceil(n*.65)));
 const delta=last-first;
 const kind=first-mid>1.4&&last-mid>1.4?'dip':delta>2?'rise':delta< -2?'fall':Math.max(...st)-Math.min(...st)<2?'level':'uncertain';
 if(kind==='uncertain')return reply(kind,'Движение неоднозначно. Послушай образец и повтори естественно, не растягивая слог.');
 const observed={rise:'Высота в измеренном участке повышается.',fall:'Высота в измеренном участке снижается.',dip:'Виден спад и последующий подъём.',level:'Высота почти ровная.'}[kind];
 const notes={
  1:kind==='level'?'Движение похоже на схему первого тона.':'Попробуй удерживать высоту ровно.',
  2:kind==='rise'?'Движение похоже на восходящий тон в этой фразе.':'В этой фразе потренируй плавный подъём от средней высоты; сравни с образцом.',
  3:'В связной речи третий тон часто низкий, иногда нисходящий. Подъём в конце не обязателен; по этому графику ошибку не определяем.',
  4:kind==='fall'?'Движение похоже на схему четвёртого тона.':'Потренируй нисходящее движение, не повышая громкость.'
 };
 return reply(kind,observed+' '+notes[surfaceTone]+' Это подсказка по высоте, не оценка произношения.');
}


// Only give a personalized directional cue when BOTH reviewed intervals
// support it. A weak or atypical reference must never be treated as truth.
export function compareContextualPitch({surfaceTone,evidence,referenceEvidence,verified}={}){
 const result=contextualPitchAdvice({surfaceTone,evidence,verified});
 const reply=(kind,text)=>({kind,text,isToneGrade:false});
 if(!verified||surfaceTone===0||surfaceTone===3||result.kind==='uncertain')return result;
 const reference=contextualPitchAdvice({surfaceTone,evidence:referenceEvidence,verified:true});
 const expected={1:'level',2:'rise',4:'fall'}[surfaceTone];
 if(!expected||reference.kind!==expected)
  return reply('reference-uncertain','Контур образца для этого слога недостаточно ясный или отличается от учебной схемы. Послушай обе записи; персональный совет о движении высоты пока не даём.');
 if(result.kind===expected)
  return reply('similar','В обеих записях видно сходное направление высоты. Это не подтверждает правильность произношения.');
 // A dip or flat contour may be a natural partial observation: do not
 // diagnose a wrong tone, even when the reference is clear.
 if((surfaceTone===2&&result.kind==='fall')||(surfaceTone===4&&result.kind==='rise'))
  return reply('contrast','В измеренном участке направление противоположно образцу. '+(surfaceTone===2?'Попробуй плавно повысить голос.':'Попробуй плавно понизить голос.')+' Послушай обе записи и повтори. Это подсказка, не оценка тона.');
 return reply('review','Движение отличается от измеренного образца, но причина неясна. Сравни записи на слух и повтори естественно.');
}


// Keep the pitch-analysis duration consistent across ordinary decoded
// AudioContext rates. Preserve the estimator's 1024-sample minimum at
// lower rates, and never read beyond the decoded audio. This is only for
// the phrase pilot; the live and standalone syllable analyzers are unchanged.
export function sentencePitchWindowSize(rate,sampleCount){
 if(!Number.isFinite(rate)||rate<8000||!Number.isInteger(sampleCount)||sampleCount<0)return 0;
 return Math.min(sampleCount,Math.max(1024,Math.round(rate*.065)));
}
