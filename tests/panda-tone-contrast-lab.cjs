#!/usr/bin/env node
'use strict';
/* OFFLINE EXPERIMENT ONLY. Classify synthetic acoustic tone contours and contrast
 * correct vs deliberately wrong pairs. Never use this to grade a real student.
 * All samples flow through the production F0 extraction + segment logic. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'panda-tone-test-lab.html'),'utf8');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const median=a=>{const v=a.slice().sort((a,b)=>a-b);return v[Math.floor(v.length/2)]||0;};
function part(a,b){
 const i=html.indexOf(a),j=html.indexOf(b,i+a.length);
 if(i<0||j<i)throw Error('Missing DSP source: '+a);
 return html.slice(i,j);
}
const dsp=new Function('finite','median','SPLIT_MIN','SPLIT_MAX',
 part('function estimateSplit(rawPoints,levels){','function observedTrend(')+
 part('function observedTrend(points,segmentFrom,segmentTo){','function normalizeChartPoints(')+
 part('function offlinePitch(frame,rate){','function cleanup(rec){')+
 part('function selectSpeechSegment(levels,points){','async function stop(countTake){')+
 '\nreturn {reanalyzePcm,buildRecording,contourEvidence,voicedRmsFrames};')(finite,median,.25,.75);
const tones={1:'level',2:'rise',3:'dip',4:'fall'};
const words=[
 {name:'公司 gōngsī',target:[1,1]},
 {name:'学校 xuéxiào',target:[2,4]},
 {name:'同事 tóngshì',target:[2,4]},
 {name:'同学 tóngxué',target:[2,2]},
 {name:'电脑 diànnǎo',target:[4,3]},
 {name:'会说 huì shuō',target:[4,1]}
];
function signal(pair,base=185,rate=12000,mode='normal'){
 const audio=new Float32Array(Math.round(rate*1.12));let phase=0,seed=734;
 const profile=(tone,u)=>{
  if(tone===1)return .12*Math.sin(2*Math.PI*u);
  if(tone===2)return -2.5+5*u;
  if(tone===3)return u<.58?1.3-4.8*u/.58:-3.5+3.4*(u-.58)/.42;
  return 2.7-5.4*u;
 };
 for(let i=0;i<audio.length;i++){
  const t=i/rate,syll=t>=.12&&t<.45?0:t>=.54&&t<.90?1:-1;
  if(syll<0||mode==='silence')continue;
  if(mode==='noise'){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   audio[i]=.18*(seed/4294967296-.5);continue;
  }
  const start=syll===0?.12:.54,duration=syll===0?.33:.36,u=(t-start)/duration;
  if(mode==='short-last'&&syll===1&&u>.25)continue;
  const hz=base*Math.pow(2,profile(pair[syll],u)/12);
  phase+=2*Math.PI*hz/rate;
  const envelope=Math.max(0,Math.min(1,u*20,(1-u)*20));
  audio[i]=envelope*(.19*Math.sin(phase)+.035*Math.sin(2*phase));
 }
 return audio;
}
function decode(file){
 const p=cp.spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-i',file,
  '-t','8','-f','f32le','-ac','1','-ar','12000','pipe:1'],{maxBuffer:20*1024*1024,timeout:20000});
 if(p.error||p.status!==0)throw Error('MP3 decoder: '+(p.error?.message||p.stderr?.toString().slice(0,180)));
 const b=p.stdout;if(!b.length||b.length%4)throw Error('Invalid MP3 output');
 return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.length));
}
function extract(audio,word){
 const rec={word,ctx:{sampleRate:12000},pcmParts:[audio],captureMethod:'synthetic-contrast',
  samples:[],levels:[],stats:{yin:0,fallback:0,none:0}};
 if(!dsp.reanalyzePcm(rec))throw Error('Audio too short to analyze');
 return dsp.buildRecording(rec);
}
// Acoustic direction only. No pinyin, word identity or expected tone is passed.
function shape(segment,seconds){
 const p=segment.filter(q=>finite(q[0])&&finite(q[1])&&q[1]>0);
 if(p.length<7)return {kind:'unknown',reason:'few F0'};
 const duration=(p.at(-1)[0]-p[0][0])*seconds;
 if(duration<.14)return {kind:'unknown',reason:'short vowel'};
 for(let i=1;i<p.length;i++){
  const dt=(p[i][0]-p[i-1][0])*seconds;
  const st=Math.abs(12*Math.log2(p[i][1]/p[i-1][1]));
  if(dt>.13||dt<.085&&st>=3.3)return {kind:'unknown',reason:'pitch gap or jump'};
 }
 const n=p.length,sz=Math.max(2,Math.floor(n*.24));
 const start=median(p.slice(0,sz).map(x=>x[1]));
 const end=median(p.slice(-sz).map(x=>x[1]));
 const mid=median(p.slice(Math.floor(n*.42),Math.ceil(n*.61)).map(x=>x[1]));
 const delta=12*Math.log2(end/start);
 const into=12*Math.log2(mid/start),out=12*Math.log2(end/mid);
 if(into < -1.2&&out > 1.25)return {kind:'dip',reason:'fall then rise'};
 if(delta>2)return {kind:'rise',reason:'rising'};
 if(delta< -2)return {kind:'fall',reason:'falling'};
 if(Math.abs(delta)<1.2)return {kind:'level',reason:'level'};
 return {kind:'unknown',reason:'ambiguous slope'};
}
function classify(audio,word){
 const r=extract(audio,word),entry=r.entry,points=entry.points||[];
 const p=[points.filter(x=>x[0]<entry.splitRatio),points.filter(x=>x[0]>=entry.splitRatio)];
 const observed=p.map(x=>shape(x,entry.seconds));
 // Use exactly the same independent RMS-duration gate as the lesson UI.
 // This is acoustic-data quality, NOT correct Chinese pronunciation.
 const rmsFrames=dsp.voicedRmsFrames(entry.levels||[],entry.splitRatio);
 const enoughRms=rmsFrames.every(n=>n>=5);
 const usable=r.accepted&&entry.quality==='both'&&enoughRms&&
  !entry.splitWarning&&entry.validParts?.every(Boolean)&&observed.every(x=>x.kind!=='unknown');
 return {accepted:r.accepted,quality:entry.quality,usable,rmsFrames,
  observed:observed.map(x=>x.kind),reasons:observed.map(x=>x.reason),
  points:p.map(x=>x.length),split:entry.splitRatio,seconds:entry.seconds};
}
const trials=[];
const pitches=[150,185,235];
for(let i=0;i<words.length;i++){
 for(const base of pitches){
  for(let a=1;a<=4;a++)for(let b=1;b<=4;b++){
   const actual=[a,b],target=words[i].target;
   const output=classify(signal(actual,base),i);
   const correct=actual.every((n,j)=>n===target[j]);
   const matched=output.usable&&output.observed.every((x,j)=>x===tones[target[j]]);
   trials.push({word:words[i].name,expected:target,actual,base,correct,matched,
    abstained:!output.usable,observation:output.observed,quality:output.quality});
  }
 }
}
const positive=trials.filter(t=>t.correct),negative=trials.filter(t=>!t.correct);
const tp=positive.filter(t=>t.matched).length;
const missed=positive.length-tp;
const falseAccept=negative.filter(t=>t.matched).length;
const correctReject=negative.length-falseAccept;
const unsure=negative.filter(t=>t.abstained).length;
const controls=[
 {name:'silence',audio:signal([1,1],185,12000,'silence')},
 {name:'noise',audio:signal([1,1],185,12000,'noise')},
 {name:'short-second-syllable',audio:signal([1,1],185,12000,'short-last')}
].map(x=>{
 const result=classify(x.audio,0);
 return {name:x.name,pass:!result.usable,result};
});
const mp3=words.map((w,i)=>{
 const file=path.join(root,'assets/hsk2-lesson3-voice/l3-'+String(i+1).padStart(2,'0')+'.mp3');
 try{
  const diagnostic=classify(decode(file),i),targetShapes=w.target.map(t=>tones[t]);
  return {name:w.name,expected:w.target,targetShapes,diagnostic,
   shapeAgreement:diagnostic.usable&&targetShapes.every((tone,j)=>diagnostic.observed[j]===tone)};
 }catch(e){return {name:w.name,error:String(e)};}
});
const realShapeMatches=mp3.filter(x=>x.shapeAgreement).length;
// NOTE: These are course reference clips, not independently annotated native
// speakers or a representative sample of learners' Mandarin speech.
const readiness={
 studentPronunciationGrading:false,
 reason:'Insufficient independently validated natural-speech controls and real-voice contour disagreements',
 realReferenceShapeMatches:realShapeMatches,
 realReferenceTotal:mp3.length,
 requires:'Independent labels, multiple speakers, negative natural-speech examples, tone sandhi/coarticulation checks'
};
const report={
 generated:new Date().toISOString(),method:'experimental offline shape classification',
 disclaimer:'This test is NOT validation on human speech; no automated grading is enabled.',
 toneShapes:tones,
 synthetic:{
  total:trials.length,positive:positive.length,negative:negative.length,
  matchesOnCorrect:tp,abstainedOrMisreadOnCorrect:missed,
  falseAcceptanceOnWrong:falseAccept,rejectedOrAbstainedOnWrong:correctReject,
  abstainedOnWrong:unsure,
  byWord:words.map(w=>{
   const rows=trials.filter(t=>t.word===w.name),yes=rows.filter(t=>t.correct),no=rows.filter(t=>!t.correct);
   return {name:w.name,correctMatched:yes.filter(t=>t.matched).length,correctTotal:yes.length,
    wrongAccepted:no.filter(t=>t.matched).length,wrongTotal:no.length};
  }),
  failures:trials.filter(t=>t.correct&&!t.matched||!t.correct&&t.matched)
 },controls,realMp3:mp3,readiness
};
fs.writeFileSync(path.join(root,'tone-contrast-lab.json'),JSON.stringify(report,null,2)+'\n');
console.log('Panda Go CONTRAST LAB (synthetic only; no student grading)');
console.log('Generated '+trials.length+' samples; correct-target '+tp+'/'+positive.length+
  '; wrong-target wrongly accepted '+falseAccept+'/'+negative.length+
  '; negative abstentions '+unsure+'/'+negative.length);
for(const w of report.synthetic.byWord)
 console.log(w.name+': correct '+w.correctMatched+'/'+w.correctTotal+
  ', wrong accepted '+w.wrongAccepted+'/'+w.wrongTotal);
for(const c of controls)console.log('Control '+c.name+': '+(c.pass?'PASS':'FAIL')+
  ', quality='+c.result.quality+', predicted='+c.result.observed.join('/'));
for(const r of mp3)console.log('MP3 diagnostic '+r.name+': '+
 (r.error||r.diagnostic.observed.join('/')+', quality='+r.diagnostic.quality+
 ', usable='+r.diagnostic.usable+', shapeAgreement='+r.shapeAgreement)+
 ' (NOT pronunciation correctness)');
console.log('STUDENT GRADING: DISABLED; natural reference shape agreement '+realShapeMatches+'/'+mp3.length);
if(process.env.GITHUB_STEP_SUMMARY){
 const lines=[
 '## Лаборатория контрастов тонов (не для оценки ученика)',
 '',
 '**Это синтетические сигналы, не проверка правильности произношения человека.**',
 '',
 '- Синтетических пар: **'+trials.length+'**.',
 '- Совпало на заданных правильных тонах: **'+tp+'/'+positive.length+'**.',
 '- Ошибочно приняты намеренно неправильные пары: **'+falseAccept+'/'+negative.length+'**.',
 '- Не прошли отрицательные контрольные сигналы: **'+controls.filter(x=>!x.pass).length+'**.',
 '',
 '| Слово | Верные приняты | Неверные ошибочно приняты |',
 '|---|---:|---:|',
 ...report.synthetic.byWord.map(w=>'| '+w.name+' | '+w.correctMatched+'/'+w.correctTotal+
  ' | '+w.wrongAccepted+'/'+w.wrongTotal+' |'),
 '',
 'Результаты MP3 — лишь диагностический вывод, потому что нет независимой разметки человеческих тонов.',
 '',
 '### Сопоставление с ожидаемым контуром на учебных MP3',
 '| Слово | Ожидалось | Получено | Совпадение формы |',
 '|---|---|---|---|',
 ...mp3.map(x=>'| '+x.name+' | '+(x.targetShapes?.join('/')||'—')+
  ' | '+(x.diagnostic?.observed.join('/')||'ошибка')+' | '+(x.shapeAgreement?'да':'нет / неизвестно')+' |'),
 '',
 '**Оценка произношения ученика: ВЫКЛЮЧЕНА.** Простое совпадение формы с эталоном НЕ доказывает правильность тона.',
 'Подробности: tone-contrast-lab.json в артефакте.'];
 fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines.join('\n')+'\n');
}
if(falseAccept>0||controls.some(x=>!x.pass)||mp3.some(x=>x.error))process.exitCode=1;
