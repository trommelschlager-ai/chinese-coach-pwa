// PANDA MIRROR: local, ungraded comparison of recorded audio; single syllable pitch only.
import {analyseRecordedBuffer} from './panda-tone-recording-analysis-v465.mjs';
import {estimatePitch,analyseContour} from './panda-tone-analytics-v457.mjs';
function mirrorCurve(analysis){
 const bad=reason=>({available:false,reason,points:[],isToneGrade:false});
 if(!analysis?.available||!analysis.signal?.hasAudibleSignal)return bad("no-audible-signal");
 if(analysis.signal.discardedOtherRegions>0)return bad("multiple-voice-regions");
 const frames=analysis.frames;
 if(!Array.isArray(frames)||frames.length<9)return bad("too-few-pitch-frames");
 if(frames.some(p=>!Number.isFinite(p.t)||!Number.isFinite(p.hz)||p.hz<70||p.hz>550||!Number.isFinite(p.clarity)||p.clarity<.75))return bad("unstable-pitch");
 const duration=frames.at(-1).t-frames[0].t;
 if(duration<.13||duration>1.5)return bad("single-syllable-duration");
 for(let i=1;i<frames.length;i++){const gap=frames[i].t-frames[i-1].t,jump=Math.abs(12*Math.log2(frames[i].hz/frames[i-1].hz));if(gap<=0||gap>.055||jump>4.5)return bad("pitch-discontinuity");}
 const sorted=frames.map(p=>p.hz).sort((a,b)=>a-b),mid=Math.floor(sorted.length/2),base=sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;
 return {available:true,reason:null,durationSec:duration,points:frames.map(p=>({x:(p.t-frames[0].t)/duration,semitones:12*Math.log2(p.hz/base)})),isToneGrade:false};
}

function compareMirror(reference,learner){
 const a=mirrorCurve(reference),b=mirrorCurve(learner);
 return {available:a.available&&b.available,reference:a,learner:b,score:null,isToneGrade:false,axis:"relative-semitones-normalized-time",message:a.available&&b.available?"Сравни движение высоты двух голосов. Это не оценка правильности тона.":"Недостаточно устойчивого сигнала для сравнения. Прослушай записи и попробуй ещё раз."};
}

function waveform(buffer,bins=100){
 if(!buffer||!Number.isInteger(buffer.length)||buffer.length<1||typeof buffer.getChannelData!=="function"||!Number.isFinite(buffer.sampleRate)||buffer.sampleRate<8000||!Number.isInteger(bins)||bins<1||bins>512)throw new TypeError("Invalid audio buffer");
 if(buffer.length/buffer.sampleRate>30)throw new RangeError("Audio exceeds 30 seconds");
 const samples=buffer.getChannelData(0);if(samples.length!==buffer.length)throw new TypeError("Invalid channel");
 const n=Math.min(bins,samples.length),points=[];
 for(let i=0;i<n;i++){let peak=0;for(let j=Math.floor(i*samples.length/n);j<Math.floor((i+1)*samples.length/n);j++){if(!Number.isFinite(samples[j]))throw new TypeError("Invalid sample");peak=Math.max(peak,Math.abs(samples[j]));}points.push(Math.min(1,peak));}
 return points;
}
export function analyseMirrorBuffers(reference,learner,{singleSyllable=false}={}){
 const waveforms={reference:waveform(reference),learner:waveform(learner)};
 if(!singleSyllable||reference.length/reference.sampleRate>3||learner.length/learner.sampleRate>3)return {available:false,reference:null,learner:null,waveforms,score:null,isToneGrade:false,message:'Для фразы сравни записи на слух. График высоты доступен только для отдельного слога.'};
 return {...compareMirror(analyseRecordedBuffer(reference,{estimatePitch,analyseContour}),analyseRecordedBuffer(learner,{estimatePitch,analyseContour})),waveforms};
}
export {mirrorCurve,compareMirror,waveform};
