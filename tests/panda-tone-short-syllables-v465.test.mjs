import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {analyseRecordedBuffer,estimatePitchAutocorrelation} from '../assets/panda-tone-recording-analysis-v465.mjs';
import {estimatePitch,analyseContour} from '../assets/panda-tone-analytics-v457.mjs';

const rate=48000;
function audioBurst({duration=.33,amp=.075,baseHz=155,quiet=.0001,rateHz=rate}={}){
 const total=Math.round(rateHz*3.1),start=Math.round(rateHz*.9);
 const samples=new Float32Array(total),len=Math.round(rateHz*duration);
 let phase=0;
 for(let i=0;i<total;i++){
  samples[i]=quiet*Math.sin(i*.15);
  if(i<start||i>=start+len)continue;
  const u=(i-start)/len;
  const hz=baseHz+40*u;
  phase+=2*Math.PI*hz/rateHz;
  const fade=Math.min(1,(i-start)/(rateHz*.012),(start+len-i)/(rateHz*.012));
  samples[i]+=amp*Math.sin(phase)*Math.max(0,fade);
 }
 return {
  sampleRate:rateHz,length:samples.length,numberOfChannels:1,
  getChannelData(){return samples}
 };
}
const helpers={estimatePitch,analyseContour};
test('natural 0.33 second short ma is sampled throughout the recorded buffer',()=>{
 const out=analyseRecordedBuffer(audioBurst(),helpers);
 assert.equal(out.available,true);
 assert.equal(out.signal.hasAudibleSignal,true);
 assert(out.signal.soundFrames>=9,'Short syllables must have regular sampled audio frames: '+JSON.stringify(out.signal));
 assert(out.signal.pitchFrames>=8,'Realistic vowel should produce contour points: '+JSON.stringify(out.signal));
 assert.equal(out.result.isToneGrade,false);
 assert.equal(out.result.kind,'insufficient','Short contour is observed but never graded');
 assert(out.result.points.length>1,'Show a cautious short line instead of pretending the microphone missed speech');
});
test('softer 0.31 sec vowel can be heard without shouting or forcing 1 sec duration',()=>{
 const out=analyseRecordedBuffer(audioBurst({duration:.31,amp:.009,baseHz:190}),helpers);
 assert.equal(out.signal.hasAudibleSignal,true);
 assert(out.signal.pitchFrames>=7,JSON.stringify(out.signal));
 assert.equal(out.result.isToneGrade,false);
});
test('short naturally spoken 0.29s ma is detected by autocorrelation even when strict YIN fails',()=>{
 const recording=audioBurst({duration:.29,amp:.035,baseHz:112});
 const result=analyseRecordedBuffer(recording,{
  estimatePitch:()=>null,
  analyseContour
 });
 assert(result.available);
 assert(result.signal.hasAudibleSignal);
 assert(result.signal.fallbackPitchFrames>=5,JSON.stringify(result.signal));
 assert(result.preview.length>=5,'At least a cautious partial F0 line should appear');
 assert.equal(result.result.isToneGrade,false);
 assert.equal(result.result.kind,'insufficient','0.29s cannot become a certified tone');
});
test('autocorrelation fallback rejects silence and never returns a Mandarin tone grade',()=>{
 assert.equal(estimatePitchAutocorrelation(new Float32Array(4096),48000),null);
 const signal=new Float32Array(4096);
 for(let i=0;i<signal.length;i++)signal[i]=.08*Math.sin(2*Math.PI*110*i/48000);
 const result=estimatePitchAutocorrelation(signal,48000);
 assert(result,'Should track low-F0 voice');
 assert(Math.abs(result.hz-110)<8,JSON.stringify(result));
 assert(result.clarity>.53);
 assert.equal(result.method,'autocorrelation');
});
test('empty, short, and quiet noise cannot fabricate a Mandarin score',()=>{
 const zero=audioBurst({amp:0,quiet:0});
 const out=analyseRecordedBuffer(zero,helpers);
 assert.equal(out.signal.hasAudibleSignal,false);
 assert.equal(out.signal.pitchFrames,0);
 assert.equal(out.result.kind,'insufficient');
 assert.equal(out.result.isToneGrade,false);
 const invalid=analyseRecordedBuffer(null,helpers);
 assert.equal(invalid.available,false);
 assert.equal(invalid.result.isToneGrade,false);
});
test('published page uses post-record analysis rather than only setInterval samples',()=>{
 const page=fs.readFileSync(new URL('../panda-tone-ma-practice.html',import.meta.url),'utf8');
 const trainer=fs.readFileSync(new URL('../assets/panda-tone-ma-pilot-v463.mjs',import.meta.url),'utf8');
 assert(trainer.includes('analyseRecordedBlob(blob'));
 assert(trainer.includes('offline?.available?offline.frames:frames'));
 assert(trainer.includes('hasAudibleSignal'));
 assert(trainer.includes('MediaRecorder'));
 assert(trainer.includes('decode')||trainer.includes('analyseRecordedBlob'));
 assert(page.includes('panda-tone-ma-pilot-v463.mjs?v=468'));
 assert(!/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/i.test(trainer));
 assert(page.includes('Нет оценок'));
 assert(trainer.includes('offline?.preview||[]'),'Ungraded preview should be used for short audio');
 assert(trainer.includes('plot(displayPoints)'));
 assert(trainer.includes('Голос уже был обнаружен'),'Live mic label should not switch to silence after hearing a syllable');
});

test('reference graph uses only stable measured points on the real time axis',async()=>{
 const {referenceContourPath}=await import('../assets/panda-tone-recording-analysis-v465.mjs');
 const points=Array.from({length:12},(_,i)=>({t:i*.02,st:i*.2-1}));
 const good={available:true,signal:{hasAudibleSignal:true,discardedOtherRegions:0,pitchFrames:12,fallbackPitchFrames:0},result:{kind:'insufficient',stats:{previewOnly:true,octaveJumpCount:0},points}};
 const path=referenceContourPath(good);
 assert.match(path,/^M30\.0 /);
 assert.match(path,/L85\.4 /);
 assert.equal(referenceContourPath({...good,signal:{...good.signal,discardedOtherRegions:1}}),'');
 assert.equal(referenceContourPath({...good,result:{...good.result,kind:'uncertain'}}),'');
 assert.equal(referenceContourPath({...good,result:{...good.result,stats:{previewOnly:true,octaveJumpCount:1}}}),'');
 assert.equal(referenceContourPath({...good,signal:{...good.signal,fallbackPitchFrames:8}}),'');
 assert.equal(referenceContourPath({...good,result:{...good.result,points:points.map((p,i)=>({...p,t:p.t+(i>6?.2:0)}))}}),'');
 assert.equal(referenceContourPath(null),'');
});
test('reference overlay reads only fixed same-origin lesson audio and has a separate status',()=>{
 const page=fs.readFileSync(new URL('../panda-tone-ma-practice.html',import.meta.url),'utf8');
 assert(page.includes('id="reference-audio-path"'));
 assert(page.includes('id="reference-audio-status"'));
 assert(page.includes("method:'GET',mode:'same-origin'"));
 assert(page.includes("lesson1-xiaoxiao-v260/ma'+n+'.mp3"));
 assert(page.includes('ticket!==request'));
 assert(page.includes('referenceContourPath(analysis)'));
 assert(page.includes('относительно медианы каждого голоса'));
});
