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
export function analyseRecordedBuffer(buffer,{estimatePitch,analyseContour}){
 if(!buffer||!Number.isFinite(buffer.sampleRate)||buffer.sampleRate<8000||
    !Number.isFinite(buffer.length)||buffer.length<1024||typeof buffer.getChannelData!=='function'){
  return {available:false,reason:'decoded-audio-unavailable',frames:[],result:analyseContour([]),signal:null};
 }
 const rate=buffer.sampleRate,channels=Math.max(1,Math.min(2,buffer.numberOfChannels||1));
 const data=buffer.getChannelData(0);
 // Phones generally supply mono. For stereo choose the channel with more signal
 // rather than phase-cancelling two microphone tracks.
 let samples=data;
 if(channels>1){
  const right=buffer.getChannelData(1);
  const e1=averageRms(data,0,data.length),e2=averageRms(right,0,right.length);
  if(e2>e1)samples=right;
 }
 const width=Math.min(4096,samples.length),hop=Math.max(256,Math.round(rate*.022));
 const windows=[];
 for(let start=0;start+width<=samples.length;start+=hop){
  windows.push({start,rms:averageRms(samples,start,width)});
 }
 if(!windows.length)return {available:false,reason:'audio-too-short',frames:[],result:analyseContour([]),signal:null};
 const energies=windows.map(x=>x.rms);
 const peak=Math.max(...energies);
 const floor=median([...energies].sort((a,b)=>a-b).slice(0,Math.max(2,Math.floor(energies.length*.35))));
 // A gate independent of the old fixed 0.012 threshold.
 // If the whole file is near silence, report no audible signal; never classify pitch.
 const threshold=Math.max(.0025,Math.min(.012,peak*.18),floor*2.0);
 const usable=peak>=.004;
 const voiced=usable?windows.filter(x=>x.rms>threshold):[];
 const samplesForPitch=[];
 // Pitch estimation is CPU-intensive; skip silent windows but sample
 // all frames of a real syllable at steady 22ms intervals, not setInterval jitter.
 const input=new Float32Array(width);
 const targetPeak=.055;
 const gain=usable?Math.max(1,Math.min(12,targetPeak/Math.max(.001,peak))):1;
 for(const candidate of voiced){
  const slice=samples.subarray(candidate.start,candidate.start+width);
  for(let i=0;i<width;i++)input[i]=Math.max(-1,Math.min(1,slice[i]*gain));
  const found=estimatePitch(input,rate);
  if(found&&found.clarity>=.7&&Number.isFinite(found.hz)){
   samplesForPitch.push({
    t:(candidate.start+width/2)/rate,
    hz:found.hz,
    clarity:found.clarity
   });
  }
 }
 const span=samplesForPitch.length
  ?samplesForPitch.at(-1).t-samplesForPitch[0].t:0;
 const signal={
  durationSec:+(samples.length/rate).toFixed(2),
  peakRms:+peak.toFixed(4),noiseRms:+floor.toFixed(4),gateRms:+threshold.toFixed(4),
  hasAudibleSignal:voiced.length>=3,
  soundFrames:voiced.length,totalFrames:windows.length,
  pitchFrames:samplesForPitch.length,
  pitchSpanSec:+span.toFixed(2)
 };
 return {available:true,frames:samplesForPitch,result:analyseContour(samplesForPitch),signal};
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
