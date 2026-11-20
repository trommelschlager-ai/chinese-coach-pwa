import test from 'node:test';
import assert from 'node:assert/strict';
import {alignFromReference} from '../assets/panda-sentence-align-v4.mjs';

const rate=12000;
const bounds=[0.10,0.42,0.81,1.17,1.52,1.95];
function syntheticSpeech(speed=1){
 const durations=2.1,tones=[135,160,145,175,130],samples=new Float32Array(Math.round(rate*durations*speed));
 for(let i=0;i<samples.length;i++){
  const t=i/rate/speed,idx=bounds.findIndex((b,j)=>j>0&&t<b),k=idx<0?4:idx-1;
  const f=tones[k]+7*Math.sin(2*Math.PI*t);
  samples[i]=.25*Math.sin(2*Math.PI*f*t)+.15*Math.sin(2*Math.PI*(f*2.4+20*k)*t)+.035*Math.sin(2*Math.PI*(850+130*k)*t);
 }
 return {sampleRate:rate,getChannelData:()=>samples};
}
test('same recording maps reference landmarks to themselves (within ~one hop)',()=>{
 const out=alignFromReference(syntheticSpeech(),syntheticSpeech(),bounds,bounds);
 assert.equal(out.ok,true);
 for(let i=0;i<bounds.length;i++)assert.ok(Math.abs(out.bounds[i]-bounds[i])<.03,'landmark '+i);
 assert.equal(out.uncertain,true);
 assert.equal(Object.hasOwn(out,'toneScore'),false);
});
test('28% longer same utterance retains monotonic syllable boundaries',()=>{
 const target=bounds.map(x=>x*1.28);
 const out=alignFromReference(syntheticSpeech(),syntheticSpeech(1.28),bounds,target);
 assert.equal(out.ok,true);
 assert.equal(out.bounds.length,target.length);
 for(let i=1;i<out.bounds.length;i++)assert.ok(out.bounds[i]>out.bounds[i-1]);
 for(let i=0;i<target.length;i++)assert.ok(Math.abs(out.bounds[i]-target[i])<.13,'landmark '+i);
});
test('large duration mismatch does not generate dubious boundaries',()=>{
 const out=alignFromReference(syntheticSpeech(),syntheticSpeech(2.2),bounds,bounds.map(x=>x*2.2));
 assert.equal(out.ok,false);
 assert.ok(out.reason);
});
test('reject malformed syllable labels',()=>{
 const out=alignFromReference(syntheticSpeech(),syntheticSpeech(),[0.1,.4,.3,1.5],[0.1,.4,.8,1.5]);
 assert.equal(out.ok,false);
});
