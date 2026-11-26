import test from 'node:test';
import assert from 'node:assert/strict';
import {alignFromReference,reviewInterval,intervalPitchEvidence,contextualPitchAdvice,compareContextualPitch} from '../assets/panda-sentence-align-v4.mjs';

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

test('selected audio interval is playable only inside the decoded recording',()=>{
 const buffer={sampleRate:12000,getChannelData:()=>new Float32Array(24000)};
 assert.deepEqual(reviewInterval(buffer,[.1,.5,.9],0),{startSec:.1,durationSec:.4});
 assert.equal(reviewInterval(buffer,[.1,2.1],0),null);
 assert.equal(reviewInterval(buffer,[.5,.1],0),null);
 assert.equal(reviewInterval(buffer,[.1,.5],1),null);
});
test('a checked syllable boundary still requires reliable continuous pitch evidence',()=>{
 const bounds=[.1,.5,.9],pts=Array.from({length:12},(_,i)=>({t:.11+i*.03,hz:140+i,method:'yin'}));
 assert.equal(intervalPitchEvidence(pts,bounds,0).weak,false);
 assert.equal(intervalPitchEvidence(pts.map((p,i)=>({...p,method:i<6?'autocorrelation':'yin'})),bounds,0).weak,true);
 assert.equal(intervalPitchEvidence(pts.map((p,i)=>({...p,hz:i>=6?p.hz*2:p.hz})),bounds,0).weak,true);
 assert.equal(intervalPitchEvidence(pts.filter((_,i)=>i<4||i>7),bounds,0).weak,true);
 assert.equal(intervalPitchEvidence(pts,bounds,0).isToneGrade,false);
});

test('substantially shorter input requires manual review, never a pronunciation error',()=>{
 const out=alignFromReference(syntheticSpeech(),syntheticSpeech(.67),bounds,bounds.map(x=>x*.67));
 assert.equal(out.ok,false);
 assert.equal(out.uncertain,true);
 assert.match(out.reason,/не ошибка произношения/);
 assert.equal(Object.hasOwn(out,'toneScore'),false);
 const normal=alignFromReference(syntheticSpeech(),syntheticSpeech(.8),bounds,bounds.map(x=>x*.8));
 assert.equal(normal.ok,true);
});

test('identical audio preserves off-grid reference landmarks without rounding to frame centers',()=>{
 const landmarks=[.1,.423,.817,1.173,1.527,1.95];
 const samples=Float32Array.from({length:25200},(_,i)=>.2*Math.sin(2*Math.PI*155*i/rate)+.1*Math.sin(2*Math.PI*365*i/rate));
 const audio={sampleRate:rate,getChannelData:()=>samples};
 const out=alignFromReference(audio,audio,landmarks,landmarks);
 assert.equal(out.ok,true);
 for(let i=0;i<landmarks.length;i++)assert.ok(Math.abs(out.bounds[i]-landmarks[i])<1e-7);
 assert.equal(out.uncertain,true);
});

test('contextual advice respects sandhi, neutral and variable third tone without scoring',()=>{
 const evidence=hz=>({weak:false,points:hz.map((h,i)=>({hz:h,t:i*.025}))});
 const rise=evidence([100,104,108,112,116,120,124,128,132,136,140,144]);
 const fall=evidence([144,140,136,132,128,124,120,116,112,108,104,100]);
 const dip=evidence([140,132,124,116,108,100,100,108,116,124,132,140]);
 for(const [input,kind,word] of [
  [{surfaceTone:2,evidence:rise,verified:true},'rise','похоже'],
  [{surfaceTone:2,evidence:fall,verified:true},'fall','плавный подъём'],
  [{surfaceTone:3,evidence:fall,verified:true},'fall','не обязателен'],
  [{surfaceTone:3,evidence:dip,verified:true},'dip','не обязателен'],
  [{surfaceTone:0,evidence:fall,verified:true},'neutral','нет фиксированного'],
  [{surfaceTone:2,evidence:rise,verified:false},'unverified','не проверены'],
  [{surfaceTone:2,evidence:{weak:true},verified:true},'uncertain','ненадёжны']
 ]){
  const out=contextualPitchAdvice(input);
  assert.equal(out.kind,kind);
  assert.ok(out.text.includes(word));
  assert.equal(out.isToneGrade,false);
 }
});

test('five selectable phrases use explicit surface tones and exact reference paths',async()=>{
 const {readFileSync}=await import('node:fs');
 const page=readFileSync(new URL('../panda-hsk2-tone-sentence-pilot.html',import.meta.url),'utf8');
 const start=page.indexOf('const phraseOptions='),end=page.indexOf('const requested=',start);
 const options=new Function(page.slice(start,end)+'\nreturn phraseOptions;')();
 assert.deepEqual(options.map(p=>p.tokens.map(t=>t.surfaceTone)),[[2,3,0,2,3],[2,3],[2,3],[2,4],[4,1]]);
 assert.equal(options[1].src,'./assets/panda-live-voice-v2/hello.mp3');
 assert.equal(options[2].src,'./assets/panda-live-voice-v2/good.mp3');
 assert.equal(options[3].src,'./assets/panda-tone-phrase-ref-v567/bushi.mp3');
 assert.equal(options[4].src,'./assets/panda-tone-phrase-ref-v567/yitian.mp3');
 assert(options.every(p=>p.tokens.length===p.weights.length&&p.tokens.map(t=>t.zh).join('')===p.zh.replace('。','')));
 assert(page.includes("if(!reference?.valid)return 'Нет проверяемого образца"));
 assert(page.includes("$('listen').disabled=!source;"));
 assert(page.includes("$('phrase-select').disabled=true;"));
});

test('personalized guidance requires reliable reference and learner evidence',()=>{
 const make=(from,to)=>Array.from({length:12},(_,i)=>({t:.025*i,hz:from+(to-from)*i/11,method:'yin'}));
 const rising=make(100,145),falling=make(145,100),level=make(120,120),bs=[0,.30];
 const q=frames=>intervalPitchEvidence(frames,bs,0);
 const weak=q(rising.map((p,i)=>({...p,method:i<6?'autocorrelation':'yin'})));
 const gap=q(rising.filter((_,i)=>i<3||i>7));
 const octave=q(rising.map((p,i)=>({...p,hz:i>5?p.hz*2:p.hz})));
 const cases=[
 [2,q(rising),q(rising),true,'similar'],[2,q(falling),q(rising),true,'contrast'],
 [4,q(rising),q(falling),true,'contrast'],[4,q(falling),q(falling),true,'similar'],
 [1,q(level),q(level),true,'similar'],[1,q(rising),q(level),true,'review'],
 [2,q(level),q(rising),true,'review'],[2,q(falling),weak,true,'reference-uncertain'],
 [2,q(falling),q(falling),true,'reference-uncertain'],[2,weak,q(rising),true,'uncertain'],
 [2,gap,q(rising),true,'uncertain'],[2,octave,q(rising),true,'uncertain'],
 [2,q(falling),q(rising),false,'unverified'],[0,q(falling),weak,true,'neutral'],
 [3,q(falling),weak,true,'fall']];
 for(const [surfaceTone,evidence,referenceEvidence,verified,want] of cases){
  const out=compareContextualPitch({surfaceTone,evidence,referenceEvidence,verified});
  assert.equal(out.kind,want);assert.equal(out.isToneGrade,false);
 }
});


// Measured Praat F0 from user-supplied 26 Nov Luvvoice clips and PSOLA
// resyntheses of those same clips. 16 ms grid, rounded to 0.1 Hz.
// Approximate review windows, NOT validated phonetic syllable labels.
// Tests the advice layer, not the browser pitch extractor or pronunciation.
test('real-audio F0 fixtures with altered pitch do not overrule weak references',()=>{
 const cases=[
 {tone:2,a:.24,b:.55,refStart:.264,ref:[217,210.6,206.9,205.6,206.1,208,212.9,218.9,225,227.5,227.3],modifiedStart:.248,modified:[326,319.8,314.8,308.1,301.4,294.5,288.3,281,276.2,269.8,265,255.6,253.1,246.6],want:'reference-uncertain'},
 {tone:4,a:.55,b:.88,refStart:.648,ref:[347.3,349.5,348,347.6,344.9,340.7,336.2,326.9,309.5,292.2,264.4,231.1,73.6,77.9],modifiedStart:.664,modified:[251,255.2,260.7,265.8,272.2,277.7,283.9,289.6,295.7,301.5,308.6,null,77.9],want:'uncertain'},
 {tone:4,a:.29,b:.55,refStart:.312,ref:[317.7,316,316.3,315.6,313,308.3,300.6,289.7,277.1,256.4,236],modifiedStart:.312,modified:[247.3,251,260.1,266.8,273.2,280.9,289.4,296.2,305,311,319.7],want:'contrast'},
 {tone:1,a:.55,b:.93,refStart:.648,ref:[284,284.6,283.4,282.7,282.5,282.3,282.1,282.6,283.3,285.4,286.6,288.8,291,293.7,295.2,294.5,299.4],modifiedStart:.648,modified:[242.6,247.3,252.2,257.1,261.3,265.8,270.7,274.7,279.8,285.1,290.2,295.4,302.3,305.5,311.2,317.1,323.9],want:'review'}];
 const frames=(start,hz)=>hz.flatMap((h,i)=>h===null?[]:[{t:start+.016*i,hz:h,method:'praat'}]);
 for(const c of cases){
  const referenceEvidence=intervalPitchEvidence(frames(c.refStart,c.ref),[c.a,c.b],0);
  const evidence=intervalPitchEvidence(frames(c.modifiedStart,c.modified),[c.a,c.b],0);
  const out=compareContextualPitch({surfaceTone:c.tone,evidence,referenceEvidence,verified:true});
  assert.equal(out.kind,c.want);assert.equal(out.isToneGrade,false);
 }
});
