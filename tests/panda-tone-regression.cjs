#!/usr/bin/env node
'use strict';
/* Run the SAME functions from the isolated lab on generated tones and actual MP3.
   Results measure F0 signal quality, not pronunciation correctness. */
const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'panda-tone-test-lab.html'),'utf8');
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
 return {name,accepted,quality:entry.quality,points:pts.length,syllables:[a.length,b.length],
  delta:[delta(a),delta(b)],trend:[dsp.observedTrend(pts,0,split),dsp.observedTrend(pts,split,1)],
  length:+entry.seconds.toFixed(2),speech:entry.signal?.speech,splitPct:Math.round(split*100)};
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
const report={generated:new Date().toISOString(),source:'panda-tone-test-lab.html',
 automatic:{passed:passes,total:tests.length,tests},realAudio:{decoded,total:6,mp3},
 note:'F0 measurements only. Real MP3 output does not prove tone recognition accuracy.'};
fs.writeFileSync(path.join(root,'tone-regression-report.json'),JSON.stringify(report,null,2)+'\n');

const both=mp3.filter(x=>!x.error&&x.quality==='both').length;
const partial=mp3.filter(x=>!x.error&&x.quality==='partial').length;
const failed=mp3.filter(x=>x.error||x.quality==='unmeasured').length;
const markdown=[
 '# Panda Go · Проверка анализатора тонов',
 '',
 'Проверено синтетических сценариев: **'+passes+'/'+tests.length+'**.',
 'Настоящих MP3 прочитано: **'+decoded+'/6**; оба слога пригодны для измерения: **'+both+'/6**; частично: **'+partial+'**; ошибки/не измерено: **'+failed+'**.',
 '',
 '| Слово | F0 | Слог 1 | Слог 2 | Качество |',
 '|---|---:|---:|---:|---|',
 ...mp3.map(a=>a.error?
  '| '+a.name+' | — | — | — | ОШИБКА: '+a.error.replace(/[|]/g,'/')+' |':
  '| '+a.name+' | '+a.points+' | '+a.syllables[0]+' | '+a.syllables[1]+' | '+a.quality+(a.speech?.ambiguous?' · граница неоднозначна':'')+' |'),
 '',
 '> **Не является оценкой произношения.** Статус both значит только достаточное качество F0 в двух слогах. Без размеченных записей живой речи нельзя включать автоматическое «правильно/неправильно».',
 '',
 'Подробный машинный отчёт находится в артефакте tone-regression-report.json.'
].join('\n')+'\n';
if(process.env.GITHUB_STEP_SUMMARY){
 try{fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,markdown)}
 catch(error){console.warn('GitHub step summary unavailable: '+error.message)}
}

console.log('Synthetic checks: '+passes+'/'+tests.length);
for(const a of mp3)console.log(a.name+': '+(a.error||('quality='+a.quality+', F0='+a.points+', points='+a.syllables.join('/')+', Δ='+a.delta.join('/'))));
if(passes!==tests.length||decoded!==6)process.exitCode=1;
