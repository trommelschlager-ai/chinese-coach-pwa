#!/usr/bin/env node
'use strict';
/* Run the SAME functions from the isolated lab on generated tones and actual MP3.
   Results measure F0 signal quality, not pronunciation correctness. */
const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.join(__dirname,'..');
let html=fs.readFileSync(path.join(root,'panda-tone-test-lab.html'),'utf8');
const candidate=process.env.PANDA_TONE_EXPERIMENT==='90-60-18';
if(candidate){
 const a='win=Math.round(rate*.09),shortWin=Math.round(rate*.056),hop=Math.round(rate*.015)';
 const b='win=Math.round(rate*.09),shortWin=Math.round(rate*.060),hop=Math.round(rate*.018)';
 if(html.split(a).length!==2)throw Error('Pitch source changed: promoted settings missing');
 html=html.replace(a,b);
 html=html.replace('windowMs:90,shortWindowMs:56,hopMs:15','windowMs:90,shortWindowMs:60,hopMs:18');
}
function part(a,b){const i=html.indexOf(a),j=html.indexOf(b,i+a.length);if(i<0||j<i)throw Error('Missing DSP code: '+a);return html.slice(i,j);}
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const median=a=>{const v=a.slice().sort((x,y)=>x-y);return v[Math.floor(v.length/2)]||0;};
const dsp=new Function('finite','median','SPLIT_MIN','SPLIT_MAX',
 part('function estimateSplit(rawPoints,levels){','function observedTrend(')+
 part('function observedTrend(points,segmentFrom,segmentTo){','function normalizeChartPoints(')+
 part('function offlinePitch(frame,rate){','function cleanup(rec){')+
 part('function selectSpeechSegment(levels,points){','async function stop(countTake){')+
 '\nreturn {reanalyzePcm,buildRecording,observedTrend,cleanPitch,contourEvidence};'
)(finite,median,.25,.75);
function measure(pcm,rate,name,word=0){
 const r={word,ctx:{sampleRate:rate},pcmParts:[pcm],captureMethod:'github-ci',samples:[],levels:[],stats:{yin:0,fallback:0,none:0}};
 if(!dsp.reanalyzePcm(r))throw Error('Audio too short');
 const {entry,accepted}=dsp.buildRecording(r),pts=entry.points||[],split=entry.splitRatio;
 const a=pts.filter(x=>x[0]<split),b=pts.filter(x=>x[0]>=split);
 const delta=x=>x.length<2?null:+(12*Math.log2(x.at(-1)[1]/x[0][1])).toFixed(2);
 const timestampsMonotonic=pts.every((p,i)=>p[0]>=0&&p[0]<=1&&(i===0||p[0]>pts[i-1][0]));
 const evidence=(entry.evidence||[]).map((ev,i)=>{
  const reasons=[];
  if(ev.points<7)reasons.push('F0<7 ('+ev.points+')');
  if(ev.duration<.14)reasons.push('voiced<140ms ('+Math.round(ev.duration*1000)+'ms)');
  if(ev.maxGap>.13)reasons.push('gap>130ms ('+Math.round(ev.maxGap*1000)+'ms)');
  if(ev.jump)reasons.push('sudden F0 jump');
  return {syllable:i+1,...ev,reasons};
 });
 const diagnostics=evidence.flatMap(x=>x.reasons.map(y=>'syllable '+x.syllable+': '+y));
 if(entry.splitWarning)diagnostics.push('split uncertain: '+entry.splitWarning);
 return {name,accepted,quality:entry.quality,points:pts.length,syllables:[a.length,b.length],evidence,diagnostics,timestampsMonotonic,
  delta:[delta(a),delta(b)],trend:[dsp.observedTrend(pts,0,split),dsp.observedTrend(pts,split,1)],
  length:+entry.seconds.toFixed(2),speech:entry.signal?.speech,splitPct:Math.round(split*100),
  shortRecovered:r.offline?.shortRecovered||0,shortWindowMs:r.offline?.shortWindowMs||0};
}
function synth(mode,rate=48000){
 const length=mode==='pause'||mode==='double'?4.4:1.15,n=Math.floor(rate*length),pcm=new Float32Array(n);
 let phase=0,seed=191;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296-.5;};
 if(mode==='silence')return measure(pcm,rate,mode);
 for(let i=0;i<n;i++){
  const t=i/rate,a=t>=.15&&t<.49,b=t>=.57&&t<.93;
  const later=mode==='pause'&&t>=3.4&&t<3.7;
  const again=mode==='double'&&(t>=3.1&&t<3.44||t>=3.52&&t<3.86);
  if(!(a||b||later||again))continue;
  if(mode==='noise'||mode==='short'&&t>=.57&&t<.74){pcm[i]=.17*rnd();continue;}
  const u=Math.max(0,Math.min(1,(t-.57)/.36));
  let hz=a?190:205;
  if(!a&&mode==='rise')hz=185+78*u;
  if(!a&&mode==='fall')hz=279-82*u;
  if(!a&&mode==='third')hz=215-46*Math.sin(Math.PI*u);
  phase+=2*Math.PI*hz/rate;pcm[i]=.17*Math.sin(phase)+.035*Math.sin(2*phase);
 }
 return measure(pcm,rate,mode);
}
const definitions=[
 ['flat-44.1k',()=>synth('flat',44100),x=>x.quality==='both'&&Math.abs(x.delta[1])<1.5],
 ['flat-48k',()=>synth('flat'),x=>x.quality==='both'&&Math.abs(x.delta[1])<1.5],
 ['rising',()=>synth('rise'),x=>x.quality==='both'&&x.delta[1]>2.3&&x.delta[1]<8.5],
 ['falling',()=>synth('fall'),x=>x.quality==='both'&&x.delta[1]<-2.3&&x.delta[1]>-8.5],
 ['third-dip',()=>synth('third'),x=>x.quality==='both'&&x.trend[1].includes('Изгиб')],
 ['short-vowel',()=>synth('short'),x=>x.accepted&&x.syllables[1]>=4],
 ['silence',()=>synth('silence'),x=>!x.accepted&&x.points===0],
 ['noise',()=>synth('noise'),x=>x.quality!=='both'],
 ['long-pause',()=>synth('pause'),x=>x.accepted&&x.length<1.55&&x.speech.discarded>0],
 ['double-utterance',()=>synth('double'),x=>x.speech.ambiguous&&x.quality!=='both']
];
const tests=definitions.map(([name,fn,judge])=>{
 try{const result=fn();return {name,pass:Boolean(judge(result)),result};}
 catch(e){return {name,pass:false,error:String(e)};}
});
const glitch=[[0,150],[.018,151],[.036,150],[.054,450],[.072,454],[.09,450]];
const gradual=[[0,180],[.018,190],[.036,200],[.054,215],[.072,230],[.09,245]];
tests.push({name:'harmonic-glitch',pass:dsp.cleanPitch(glitch).length<glitch.length});
tests.push({name:'preserve-rising',pass:dsp.cleanPitch(gradual).length===gradual.length});
const boundary=[[0,170],[.25,170],[.5,171],[.75,172],[1,173]];
tests.push({name:'boundary-no-double-count',pass:dsp.contourEvidence(boundary,0,.5,.8).points+dsp.contourEvidence(boundary,.5,1,.8).points===5});
tests.push({name:'synthetic-strictly-increasing-timestamps',pass:tests.every(x=>!x.result||x.result.timestampsMonotonic!==false)});
// Regression of the actual bug: several trailing F0 windows used to collapse
// onto x=1.0 when the RMS end boundary was earlier than the pitch samples.
// This test must keep true frame ordering and not fabricate repeated timestamps.
const edgeFixture={
 word:2,stats:{},levels:Array.from({length:16},(_,i)=>[.09+i*.03,.045]),
 samples:[
  ...Array.from({length:14},(_,i)=>[.105+i*.015,190+.5*i]),
  ...[.405,.420,.435,.450,.465,.480,.525,.540,.555,.600,.615]
    .map((t,i)=>[t,[325,325,324,323,316,299,241,239,204,196,185][i]])
 ]};
const edgeResult=dsp.buildRecording(edgeFixture),edgePoints=edgeResult.entry.points;
tests.push({name:'trailing-pitch-not-collapsed-to-one-timestamp',
 pass:edgeResult.accepted&&edgePoints.length>=20&&
 edgePoints.every((p,i)=>Number.isFinite(p[0])&&p[0]>=0&&p[0]<=1&&
   (i===0||p[0]>edgePoints[i-1][0]))&&
 edgeResult.entry.seconds>.50&&edgePoints.at(-1)[0]>=.99});
// Nine credible F0 frames spanning 120 ms are NOT a validated tone contour.
// More measurements alone must never weaken the minimum voiced duration.
const shortEvidence=dsp.contourEvidence(
 Array.from({length:9},(_,i)=>[.55+i*.015,310-i*8]),.5,.8,1);
tests.push({name:'short-120ms-syllable-remains-insufficient',
 pass:shortEvidence.points===9&&shortEvidence.duration>.115&&shortEvidence.duration<.13&&
 !shortEvidence.usable});
function decode(file){
 const p=cp.spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-i',file,
  '-t','8','-f','f32le','-ac','1','-ar','12000','pipe:1'],{maxBuffer:20*1024*1024,timeout:20000});
 if(p.error||p.status!==0)throw Error('ffmpeg error: '+(p.error?.message||p.stderr.toString().slice(0,120)));
 const b=p.stdout;if(!b.length||b.length%4!==0)throw Error('Invalid decoded audio');
 return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.length));
}
const names=['公司 gōngsī','学校 xuéxiào','同事 tóngshì','同学 tóngxué','电脑 diànnǎo','会说 huì shuō'];
const mp3=names.map((name,i)=>{
 const filename='assets/hsk2-lesson3-voice/l3-'+String(i+1).padStart(2,'0')+'.mp3';
 try{return {file:filename,...measure(decode(path.join(root,filename)),12000,name,i)};}
 catch(e){return {name,file:filename,error:String(e)};}
});
const passes=tests.filter(x=>x.pass).length,decoded=mp3.filter(x=>!x.error).length;
const timelineErrors=mp3.filter(x=>!x.error&&!x.timestampsMonotonic).map(x=>x.name);
const report={generated:new Date().toISOString(),source:'panda-tone-test-lab.html',
 automatic:{passed:passes,total:tests.length,tests},realAudio:{decoded,total:6,mp3},
 note:'F0 measurements only. Real MP3 output does not prove tone recognition accuracy.'};
report.configuration=candidate?'historical 90/60/18':'production 90/56/15';
fs.writeFileSync(path.join(root,candidate?'tone-regression-baseline.json':'tone-regression-report.json'),JSON.stringify(report,null,2)+'\n');

const both=mp3.filter(x=>!x.error&&x.quality==='both').length;
const partial=mp3.filter(x=>!x.error&&x.quality==='partial').length;
const failed=mp3.filter(x=>x.error||x.quality==='unmeasured').length;
const markdown=[
 '# Panda Go · Проверка анализатора тонов'+(candidate?' (СТАРЫЙ ВАРИАНТ 90/60/18)':''),
 '',
 'Проверено синтетических сценариев: **'+passes+'/'+tests.length+'**.',
 'Настоящих MP3 прочитано: **'+decoded+'/6**; оба слога пригодны для измерения: **'+both+'/6**; частично: **'+partial+'**; ошибки/не измерено: **'+failed+'**.',
 '',
 '| Слово | F0 | Слог 1 | Слог 2 | Восстановлено ('+(candidate?'60':'56')+' мс) | Качество | Причина partial |',
 '|---|---:|---:|---:|---:|---|---|',
 ...mp3.map(a=>a.error?
  '| '+a.name+' | — | — | — | — | ОШИБКА | '+a.error.replace(/[|]/g,'/')+' |':
  '| '+a.name+' | '+a.points+' | '+a.syllables[0]+' | '+a.syllables[1]+' | '+a.shortRecovered+' | '+a.quality+(a.speech?.ambiguous?' · граница неоднозначна':'')+' | '+(a.diagnostics.length?a.diagnostics.join('; ').replace(/[|]/g,'/'):'—')+' |'),
 '',
 '> **Не является оценкой произношения.** Статус both значит только достаточное качество F0 в двух слогах. Без размеченных записей живой речи нельзя включать автоматическое «правильно/неправильно».',
 '',
 'Машинный отчёт: '+(candidate?'tone-regression-baseline.json':'tone-regression-report.json')+'.'
].join('\n')+'\n';
if(process.env.GITHUB_STEP_SUMMARY){
 try{fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,markdown)}
 catch(error){console.warn('GitHub step summary unavailable: '+error.message)}
}

console.log((candidate?'HISTORICAL 90/60/18 ':'')+'Synthetic checks: '+passes+'/'+tests.length);
for(const a of mp3)console.log(a.name+': '+(a.error||('quality='+a.quality+', F0='+a.points+', '+(candidate?'60':'56')+'ms recovered='+a.shortRecovered+', points='+a.syllables.join('/')+', Δ='+a.delta.join('/')+', reasons='+(a.diagnostics.join('; ')||'none'))));
if(timelineErrors.length)console.error('F0 timestamps not strictly increasing: '+timelineErrors.join(', '));
// Guard pitch *coverage* on the six current approved MP3 files; this never
// claims tone or pronunciation accuracy. Keep historical A/B free to report
// its expected lower coverage.
if(!candidate&&both<5)console.error('Real MP3 F0 coverage regression: '+both+'/6, expected >=5/6');
if(passes!==tests.length||decoded!==6||timelineErrors.length||(!candidate&&both<5))process.exitCode=1;
