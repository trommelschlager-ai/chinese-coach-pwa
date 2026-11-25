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

test('silence and boundaries outside the recording cannot produce successful alignment',()=>{
 const blank={sampleRate:rate,getChannelData:()=>new Float32Array(rate*2.1)};
 assert.equal(alignFromReference(blank,blank,bounds,bounds).ok,false);
 assert.equal(alignFromReference(syntheticSpeech(),blank,bounds,bounds).ok,false);
 assert.equal(alignFromReference(syntheticSpeech(),syntheticSpeech(),bounds,[.1,.42,.81,1.17,1.52,2.15]).ok,false);
 assert.equal(alignFromReference(syntheticSpeech(),syntheticSpeech(),[-.1,.42,.81,1.17,1.52,1.95],bounds).ok,false);
});

test('sentence pilot withholds per-character movement until boundaries are reviewed',async()=>{
 const {readFileSync}=await import('node:fs');
 const page=readFileSync(new URL('../panda-hsk2-tone-sentence-pilot.html',import.meta.url),'utf8');
 const start=page.indexOf('function describeMovement(i)'),end=page.indexOf('function adjustControls()',start);
 assert(start>=0&&end>start);
 const run=new Function('learner','$','tokens','syllableQuality','median',page.slice(start,end)+'\nreturn describeMovement(0);');
 assert.match(run({valid:true},()=>({checked:false}),[{py:'wǒ'}],()=>({weak:false}),()=>0),/Границы пока не проверены/);
 assert(page.includes('id="boundary-verified"'));
 assert(page.includes("function guidedAlign(){\n $('boundary-verified').checked=false;"));
});

function distinctIntervals(seq=[0,1,2,3,4],speed=1,blank=-1){
 const bs=[.1];
 for(const k of seq)bs.push(bs.at(-1)+(bounds[k+1]-bounds[k])*speed);
 const samples=new Float32Array(Math.ceil(rate*(bs.at(-1)+.15)));
 let phase=0;
 for(let i=0;i<samples.length;i++){
  const t=i/rate,idx=bs.findIndex((b,j)=>j>0&&t<b)-1;
  if(idx<0||t<bs[0]||idx===blank)continue;
  const k=seq[idx],f=[135,160,145,175,130][k];
  phase+=2*Math.PI*f/rate;
  const gain=Math.max(0,Math.min(1,(t-bs[idx])/.012,(bs[idx+1]-t)/.012));
  samples[i]=gain*(.12*Math.sin(phase)+.13*Math.sin(2*Math.PI*[450,750,1100,1700,2700][k]*t)+.07*Math.sin(2*Math.PI*[2100,2800,3400,4000,4400][k]*t));
 }
 return {b:bs,buf:{sampleRate:rate,getChannelData:()=>samples}};
}
test('local alignment guard refuses synthetic deletion, silence, substitution and reordering',()=>{
 const reference=distinctIntervals();
 const compare=learner=>{
  const b=learner.b.length===6?learner.b:Array.from({length:6},(_,i)=>learner.b[0]+(learner.b.at(-1)-learner.b[0])*i/5);
  return alignFromReference(reference.buf,learner.buf,reference.b,b);
 };
 assert.equal(compare(reference).ok,true);
 assert.equal(compare(distinctIntervals([0,1,2,3,4],1.28)).ok,true);
 for(const learner of [
  distinctIntervals([0,1,3,4]),
  distinctIntervals([0,1,2,3,4],1,2),
  distinctIntervals([0,1,1,3,4]),
  distinctIntervals([4,3,2,1,0]),
  distinctIntervals([0,0,0,0,0])
 ]){
  const out=compare(learner);
  assert.equal(out.ok,false);
  assert.equal(out.uncertain,true);
  assert.equal(Object.hasOwn(out,'toneScore'),false);
 }
});
