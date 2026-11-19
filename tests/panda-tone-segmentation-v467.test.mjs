import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {analyseRecordedBuffer,segmentVoicedRegion} from '../assets/panda-tone-recording-analysis-v465.mjs';
import {estimatePitch,analyseContour} from '../assets/panda-tone-analytics-v457.mjs';

const sr=48000;
function recorded(bursts=[],duration=3.1){
 const samples=new Float32Array(Math.round(sr*duration));
 for(const b of bursts){
  const start=Math.round(b.start*sr),size=Math.round(b.length*sr);
  let phase=0;
  for(let i=0;i<size&&start+i<samples.length;i++){
   const u=i/size;
   const freq=b.hz+(b.delta||0)*u;
   phase+=2*Math.PI*freq/sr;
   const fade=Math.max(0,Math.min(1,i/(sr*.01),(size-i)/(sr*.01)));
   samples[start+i]+=(b.amp||.055)*Math.sin(phase)*fade;
  }
 }
 return {sampleRate:sr,length:samples.length,numberOfChannels:1,getChannelData:()=>samples};
}
const pitchHelpers={estimatePitch,analyseContour};

test('one naturally short syllable is isolated from 0.9s silence on each side',()=>{
 const out=analyseRecordedBuffer(recorded([{start:.9,length:.31,hz:180,delta:-55}]),pitchHelpers);
 assert.equal(out.available,true);
 assert.equal(out.signal.hasAudibleSignal,true);
 assert(out.signal.segmentStartSec>.72&&out.signal.segmentStartSec<1.02,JSON.stringify(out.signal));
 assert(out.signal.segmentEndSec>1.1&&out.signal.segmentEndSec<1.4,JSON.stringify(out.signal));
 assert(out.signal.syllableDurationSec>.24&&out.signal.syllableDurationSec<.48,JSON.stringify(out.signal));
 assert(out.signal.pitchFrames>=5,JSON.stringify(out.signal));
 assert.equal(out.result.isToneGrade,false);
});

test('two attempts with a gap are NOT combined into a fabricated long tone contour',()=>{
 const out=analyseRecordedBuffer(recorded([
  {start:.42,length:.19,hz:155,delta:-5,amp:.018},
  {start:1.82,length:.31,hz:230,delta:-60,amp:.09}
 ]),pitchHelpers);
 assert.equal(out.available,true);
 assert(out.signal.segmentStartSec>1.60,JSON.stringify(out.signal));
 assert(out.signal.segmentEndSec<2.34,JSON.stringify(out.signal));
 assert(out.signal.discardedOtherRegions>=1,'second attempt must be distinct from first');
 assert(out.frames.length>=5);
 assert(out.frames.every(f=>f.t>1.60&&f.t<2.36));
 assert.equal(out.result.isToneGrade,false);
});

test('short click and silence cannot fabricate a voice or Mandarin tone',()=>{
 const blank=recorded();
 const s=blank.getChannelData(0);
 s[Math.round(sr*.8)]=.9;
 const out=analyseRecordedBuffer(blank,pitchHelpers);
 assert.equal(out.signal.hasAudibleSignal,false,JSON.stringify(out.signal));
 assert.equal(out.signal.pitchFrames,0);
 assert.equal(out.result.kind,'insufficient');
 assert.equal(out.result.isToneGrade,false);
 assert.equal(segmentVoicedRegion([],sr,4096),null);
});

test('four 0.3-0.4s synthetic tone contours remain diagnostic, never grades',()=>{
 const cases=[
  {hz:190,delta:0},{hz:150,delta:65},{hz:210,delta:-44},{hz:245,delta:-100}
 ];
 for(const b of cases){
  const out=analyseRecordedBuffer(recorded([{...b,start:1,length:.34}]),pitchHelpers);
  assert.equal(out.signal.hasAudibleSignal,true,JSON.stringify(out.signal));
  assert.equal(out.result.isToneGrade,false);
  assert(out.signal.syllableDurationSec<.5,'natural short syllables are not artificially extended');
 }
});

test('short 0.30s tone line cannot occupy 1.2s graph width',()=>{
 const script=fs.readFileSync(new URL('../assets/panda-tone-ma-pilot-v463.mjs',import.meta.url),'utf8');
 const begin=script.indexOf('const PLOT_SECONDS='),end=script.indexOf('function toneGuidance');
 assert(begin>=0&&end>begin,'fixed-time plot function expected');
 const body=script.slice(begin,end);
 const plot=new Function(body+'\nreturn plot;')();
 const path=plot([{t:0,st:0},{t:.3,st:-2}]);
 const match=path.match(/L([\d.]+) ([\d.]+)/);
 assert(match,'Must contain a second plot point');
 const endpoint=Number(match[1]);
 assert(endpoint>95&&endpoint<120,'a 0.3s syllable should use ~1/4 of the graph, got '+endpoint);
 const short=plot([{t:.9,st:1},{t:1.2,st:-1}]);
 assert(short.match(/L([\d.]+)/)[1]===match[1],'leading silence must not shift plot');
});
