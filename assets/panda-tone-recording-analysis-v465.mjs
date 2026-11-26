/* Panda Go 465 — process a short recorded syllable after capture.
 * AnalyserNode live timers can miss a 250–400ms Mandarin syllable on Android.
 * Read the recorded PCM at regular sample intervals instead; never grade tone.
 * No network, storage, speech-to-text, or persistence.
 */
const median = values => {
 if (!values.length) return 0;
 const sorted=[...values].sort((a,b)=>a-b);
 const mid=Math.floor(sorted.length/2);
 return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;
};
function averageRms(samples,start,size){
 let energy=0,n=0;
 const end=Math.min(samples.length,start+size);
 for(let i=start;i<end;i+=4){energy+=samples[i]*samples[i];n++;}
 return n?Math.sqrt(energy/n):0;
}
// Conservative normalized-autocorrelation fallback for naturally short,
// breathy or low-F0 vowels. Candidate F0 is ALWAYS ungraded.
export function estimatePitchAutocorrelation(samples,rate){
 if(!samples||samples.length<2048||!Number.isFinite(rate)||rate<8000)return null;
 const factor=Math.max(1,Math.round(rate/12000));
 const n=Math.floor(samples.length/factor);
 if(n<600)return null;
 const ds=new Float32Array(n);
 let mean=0;
 for(let i=0;i<n;i++){
  let v=0;
  for(let j=0;j<factor;j++)v+=samples[i*factor+j];
  ds[i]=v/factor;mean+=ds[i];
 }
 mean/=n;
 const power=new Float64Array(n+1);
 for(let i=0;i<n;i++){
  ds[i]-=mean;
  power[i+1]=power[i]+ds[i]*ds[i];
 }
 if(power[n]/n<.00008)return null;
 const sr=rate/factor;
 const lo=Math.max(2,Math.floor(sr/550)),hi=Math.min(Math.floor(sr/65),Math.floor(n/3));
 if(hi<=lo+2)return null;
 const correlation=new Float32Array(hi+1);
 let bestScore=0;
 for(let lag=lo;lag<=hi;lag++){
  let sum=0;
  for(let i=0;i<n-lag;i++)sum+=ds[i]*ds[i+lag];
  const left=power[n-lag],right=power[n]-power[lag];
  const score=left>0&&right>0?sum/Math.sqrt(left*right):0;
  correlation[lag]=score;
  if(score>bestScore)bestScore=score;
 }
 const minScore=Math.max(.53,bestScore*.86);
 let bestLag=-1,best=0;
 for(let lag=lo+1;lag<hi;lag++){
  const v=correlation[lag];
  if(v>=minScore&&v>=correlation[lag-1]&&v>=correlation[lag+1]&&v>best){
   bestLag=lag;best=v;
  }
 }
 if(bestLag<0)return null;
 return {hz:sr/bestLag,clarity:best,method:'autocorrelation'};
}
function bestStablePitchRun(frames){
 const runs=[];let run=[];
 for(const point of frames){
  const prev=run.at(-1);
  const gap=prev?point.t-prev.t:0;
  const jump=prev?Math.abs(12*Math.log2(point.hz/prev.hz)):0;
  if(prev&&(gap>.065||jump>4.5)){if(run.length)runs.push(run);run=[];}
  run.push(point);
 }
 if(run.length)runs.push(run);
 runs.sort((a,b)=>b.length-a.length);
 return runs[0]||[];
}
function shortPreview(frames){
 const longest=bestStablePitchRun(frames);
 if(longest.length<5)return [];
 const dur=longest.at(-1).t-longest[0].t;
 if(dur<.065)return [];
 const hzRef=median(longest.map(x=>x.hz));
 return longest.map(p=>({t:p.t-longest[0].t,
  st:Math.max(-8,Math.min(8,12*Math.log2(p.hz/hzRef)))}));
}

/*
 * Find a single contiguous voiced candidate by the energy envelope.
 * Silence before and after the syllable is discarded; separate attempts
 * are NEVER joined by the pitch display. Amplitude alone is not speech proof.
 */
export function segmentVoicedRegion(windows,rate,width){
 if(!Array.isArray(windows)||windows.length<2||!Number.isFinite(rate)||rate<8000)return null;
 const amplitudes=windows.map(w=>w.rms).filter(Number.isFinite);
 if(amplitudes.length<2)return null;
 const peak=Math.max(...amplitudes);
 if(peak<.004)return null;
 const count=Math.max(2,Math.floor(amplitudes.length*.3));
 const floor=median([...amplitudes].sort((a,b)=>a-b).slice(0,count));
 const gate=Math.max(.0025,Math.min(.018,peak*.14),floor*1.8);
 const indices=windows.map((w,i)=>w.rms>=gate?i:-1).filter(i=>i>=0);
 if(!indices.length)return null;
 const groups=[];let group=[];
 for(const i of indices){
  if(group.length&&i-group.at(-1)>3){groups.push(group);group=[];}
  group.push(i);
 }
 if(group.length)groups.push(group);
 const candidates=groups.map(indices=>{
  const loudest=Math.max(...indices.map(i=>windows[i].rms));
  const energy=indices.reduce((sum,i)=>sum+windows[i].rms**2,0);
  const first=indices[0],last=indices.at(-1);
  return {indices,first,last,loudest,energy};
 }).filter(x=>x.indices.length>=7&&x.loudest>=.005);
 if(!candidates.length)return null;
 candidates.sort((a,b)=>b.energy-a.energy);
 const chosen=candidates[0];
 const frameSec=width/rate;
 const firstCenter=(windows[chosen.first].start+width/2)/rate;
 const lastCenter=(windows[chosen.last].start+width/2)/rate;
 const startSec=Math.max(0,firstCenter-frameSec*.38);
 const endSec=Math.max(startSec,lastCenter+frameSec*.38);
 return {
  startSec:+startSec.toFixed(4),endSec:+endSec.toFixed(4),
  durationSec:+(endSec-startSec).toFixed(3),
  activeFrames:chosen.indices.length,peakRms:+peak.toFixed(4),
  noiseRms:+floor.toFixed(4),gateRms:+gate.toFixed(4),
  firstFrame:chosen.first,lastFrame:chosen.last,
  discardedOtherRegions:Math.max(0,candidates.length-1)
 };
}

export function analyseRecordedBuffer(buffer,{estimatePitch,analyseContour}){
 if(!buffer||!Number.isFinite(buffer.sampleRate)||buffer.sampleRate<8000||
    !Number.isFinite(buffer.length)||buffer.length<1024||typeof buffer.getChannelData!=='function'){
  return {available:false,reason:'decoded-audio-unavailable',frames:[],preview:[],result:analyseContour([]),signal:null};
 }
 const rate=buffer.sampleRate,channels=Math.max(1,Math.min(2,buffer.numberOfChannels||1));
 const data=buffer.getChannelData(0);
 let samples=data;
 if(channels>1){
  const right=buffer.getChannelData(1);
  const e1=averageRms(data,0,data.length),e2=averageRms(right,0,right.length);
  if(e2>e1)samples=right;
 }
 const width=Math.min(4096,samples.length),hop=Math.max(256,Math.round(rate*.016));
 const windows=[];
 for(let start=0;start+width<=samples.length;start+=hop){
  windows.push({start,rms:averageRms(samples,start,width)});
 }
 const region=segmentVoicedRegion(windows,rate,width);
 if(!region){
  const signal={durationSec:+(samples.length/rate).toFixed(2),
   hasAudibleSignal:false,soundFrames:0,totalFrames:windows.length,pitchFrames:0,
   pitchSpanSec:0,syllableDurationSec:0,fallbackPitchFrames:0,
   discardedOtherRegions:0};
  return {available:true,frames:[],preview:[],result:analyseContour([]),signal};
 }
 const voiced=windows.slice(region.firstFrame,region.lastFrame+1).filter(x=>x.rms>region.gateRms);
 const input=new Float32Array(width),samplesForPitch=[];
 // Limited adaptive gain can help phone recordings. It cannot prove
 // whether a syllable was pronounced correctly.
 const gain=Math.max(1,Math.min(12,.055/Math.max(.001,region.peakRms)));
 for(const candidate of voiced){
  const centerSec=(candidate.start+width/2)/rate;
  if(centerSec<region.startSec||centerSec>region.endSec)continue;
  const slice=samples.subarray(candidate.start,candidate.start+width);
  for(let i=0;i<width;i++)input[i]=Math.max(-1,Math.min(1,slice[i]*gain));
  const strict=estimatePitch(input,rate);
  const found=strict&&strict.clarity>=.7?strict:estimatePitchAutocorrelation(input,rate);
  if(found&&found.clarity>=.53&&Number.isFinite(found.hz)&&found.hz>=65&&found.hz<=550){
   samplesForPitch.push({
    t:centerSec,hz:found.hz,clarity:found.clarity,
    method:found.method||'yin'
   });
  }
 }
 const span=samplesForPitch.length
  ?samplesForPitch.at(-1).t-samplesForPitch[0].t:0;
 const signal={
  durationSec:+(samples.length/rate).toFixed(2),
  peakRms:region.peakRms,noiseRms:region.noiseRms,gateRms:region.gateRms,
  hasAudibleSignal:voiced.length>=7,
  soundFrames:voiced.length,totalFrames:windows.length,
  pitchFrames:samplesForPitch.length,
  pitchSpanSec:+span.toFixed(2),
  syllableDurationSec:region.durationSec,
  segmentStartSec:region.startSec,
  segmentEndSec:region.endSec,
  discardedOtherRegions:region.discardedOtherRegions,
  fallbackPitchFrames:samplesForPitch.filter(x=>x.method==='autocorrelation').length
 };
 return {available:true,frames:samplesForPitch,preview:shortPreview(samplesForPitch),result:analyseContour(samplesForPitch),signal};
}

export async function analyseRecordedBlob(blob,{estimatePitch,analyseContour,AudioContextClass}){
 if(!blob||blob.size<128||!AudioContextClass)throw new Error('Recorded audio decoder unavailable');
 const context=new AudioContextClass();
 try{
  const array=await blob.arrayBuffer();
  const buffer=await context.decodeAudioData(array.slice(0));
  return analyseRecordedBuffer(buffer,{estimatePitch,analyseContour});
 }finally{
  try{await context.close();}catch{}
 }
}

// A measured reference is displayed only if enough stable F0 is available.
// It is not a grade; the two voices have independent median pitch baselines.
export function referenceContourPath(analysis){
 const r=analysis?.result,s=analysis?.signal,p=r?.points;
 if(!analysis?.available||!s?.hasAudibleSignal||s.discardedOtherRegions!==0||r?.kind==='uncertain'||r?.stats?.octaveJumpCount>0||!Array.isArray(p)||p.length<8||s.pitchFrames<8||s.fallbackPitchFrames/s.pitchFrames>.4)return '';
 if(r.kind==='insufficient'&&r.stats?.previewOnly!==true)return '';
 const first=p[0].t,duration=p.at(-1).t-first;
 if(!Number.isFinite(duration)||duration<.15||duration>1.2)return '';
 if(p.some((v,i)=>!Number.isFinite(v.t)||!Number.isFinite(v.st)||Math.abs(v.st)>8||(i>0&&(v.t<=p[i-1].t||v.t-p[i-1].t>.085))))return '';
 return p.map((v,i)=>(i?'L':'M')+(30+302*(v.t-first)/1.2).toFixed(1)+' '+Math.max(25,Math.min(117,70-13*v.st)).toFixed(1)).join(' ');
}

// Whole-phrase diagnostic: analyse decoded audio instead of sparse UI timers.
// Voiced runs are NOT syllables; no lexical alignment or tone grade is inferred.
export function analysePhraseBuffer(buffer,{estimatePitch}){
 const empty={available:false,frames:[],runs:[],durationSec:0,isToneGrade:false};
 if(!buffer||!Number.isFinite(buffer.sampleRate)||buffer.sampleRate<8000||typeof buffer.getChannelData!=='function'||!Number.isFinite(buffer.length)||buffer.length<4096)return empty;
 const rate=buffer.sampleRate,limit=Math.min(buffer.length,Math.floor(8*rate));
 let data=buffer.getChannelData(0);
 if(buffer.numberOfChannels>1){const right=buffer.getChannelData(1);if(averageRms(right,0,limit)>averageRms(data,0,limit))data=right;}
 const width=4096,hop=Math.max(256,Math.round(rate*.016)),runs=[];let run=[];
 // Apply the same bounded gain principle as the isolated-syllable recorder.
 // Keep periodicity requirements unchanged; quiet audio is not a tone grade.
 let peak=0;
 for(let i=0;i+width<=limit;i+=hop)peak=Math.max(peak,averageRms(data,i,width));
 const gain=peak>=.004?Math.max(1,Math.min(12,.055/peak)):1;
 const input=new Float32Array(width);
 const flush=()=>{if(run.length>=3)runs.push(run);run=[];};
 for(let start=0;start+width<=limit;start+=hop){
  const slice=data.subarray(start,start+width);
  for(let i=0;i<width;i++)input[i]=Math.max(-1,Math.min(1,slice[i]*gain));
  const p=estimatePitch(input,rate);
  if(!p||p.clarity<.78||!Number.isFinite(p.hz)||p.hz<70||p.hz>550)continue;
  const t=(start+width/2)/rate,prev=run.at(-1);
  if(prev&&(t-prev.t>.085||Math.abs(12*Math.log2(p.hz/prev.hz))>=5))flush();
  run.push({t,hz:p.hz,clarity:p.clarity});
 }
 flush();
 return {available:true,frames:runs.flat(),runs:runs.map(r=>({startSec:r[0].t,endSec:r.at(-1).t,points:r.length})),durationSec:limit/rate,isToneGrade:false};
}
export async function analysePhraseBlob(blob,{estimatePitch,AudioContextClass}){
 if(!blob||blob.size<128||!AudioContextClass)throw Error('Phrase decoder unavailable');
 const context=new AudioContextClass();
 try{return analysePhraseBuffer(await context.decodeAudioData(await blob.arrayBuffer()),{estimatePitch});}
 finally{try{await context.close()}catch{}}
}
