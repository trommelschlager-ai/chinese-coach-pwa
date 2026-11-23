#!/usr/bin/env node
'use strict';
/* Compare short F0 windows on existing lesson-3 MP3s. No lesson changes. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const lab=fs.readFileSync(path.join(root,'panda-tone-test-lab.html'),'utf8');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const median=a=>{const b=[...a].sort((x,y)=>x-y);return b.length?b[Math.floor(b.length/2)]:0};
const names=['公司 gōngsī','学校 xuéxiào','同事 tóngshì','同学 tóngxué','电脑 diànnǎo','会说 huì shuō'];
const windows=[
 {label:'BASE 90/60/18',primary:90,short:60,hop:18},
 {label:'90/56/18',primary:90,short:56,hop:18},
 {label:'90/56/15',primary:90,short:56,hop:15},
 {label:'90/60/15',primary:90,short:60,hop:15},
 {label:'90/60/12',primary:90,short:60,hop:12},
 {label:'90/64/15',primary:90,short:64,hop:15},
 {label:'80/60/15',primary:80,short:60,hop:15}
];
function once(source,oldValue,newValue){
 const hits=source.split(oldValue).length-1;
 if(hits!==1)throw Error('Unexpected source '+hits+': '+oldValue);
 return source.replace(oldValue,newValue);
}
function engine(v){
 const source=once(lab,
  'win=Math.round(rate*.09),shortWin=Math.round(rate*.060),hop=Math.round(rate*.018)',
  'win=Math.round(rate*.'+String(v.primary/1000).slice(2)+'),shortWin=Math.round(rate*.'+String(v.short/1000).slice(2)+'),hop=Math.round(rate*.'+String(v.hop/1000).slice(2)+')');
 const part=(a,b)=>{const i=source.indexOf(a),j=source.indexOf(b,i+a.length);if(i<0||j<i)throw Error('DSP function missing '+a);return source.slice(i,j)};
 return new Function('finite','median','SPLIT_MIN','SPLIT_MAX',
  part('function estimateSplit(rawPoints,levels){','function observedTrend(')+
  part('function observedTrend(points,segmentFrom,segmentTo){','function normalizeChartPoints(')+
  part('function offlinePitch(frame,rate){','function cleanup(rec){')+
  part('function selectSpeechSegment(levels,points){','async function stop(countTake){')+
  '\nreturn {reanalyzePcm,buildRecording,contourEvidence};'
 )(finite,median,.25,.75);
}
function decode(file){
 const res=cp.spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-i',file,
 '-t','8','-f','f32le','-ac','1','-ar','12000','pipe:1'],{maxBuffer:20*1024*1024,timeout:20000});
 if(res.error||res.status!==0||!res.stdout?.length)throw Error('Could not decode '+file+': '+(res.error?.message||res.stderr?.toString().slice(0,100)));
 const b=res.stdout;if(b.length%4)throw Error('Invalid f32le buffer '+file);
 return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.length));
}
function measure(dsp,pcm,i){
 const rec={word:i,ctx:{sampleRate:12000},pcmParts:[pcm],captureMethod:'experiment',
  samples:[],levels:[],stats:{yin:0,fallback:0,none:0}};
 if(!dsp.reanalyzePcm(rec))throw Error('Audio too short');
 const r=dsp.buildRecording(rec).entry,pts=r.points||[];
 const splits=[pts.filter(p=>p[0]<r.splitRatio),pts.filter(p=>p[0]>=r.splitRatio)];
 const curves=splits.map(part=>part.map(p=>({tMs:Math.round(p[0]*r.seconds*1000),hz:Math.round(p[1])})));
 const syllables=(r.evidence||[]).map((e,j)=>({
  syllable:j+1,points:e.points,durationMs:Math.round(e.duration*1000),
  maxGapMs:Math.round(e.maxGap*1000),jump:e.jump,usable:e.usable,
  deltaSt:splits[j].length>=2?+(12*Math.log2(splits[j].at(-1)[1]/splits[j][0][1])).toFixed(2):null
 }));
 return {quality:r.quality,points:pts.length,syllables,curves,splitPct:Math.round(r.splitRatio*100),
  splitSource:r.splitSource,warning:!!r.splitWarning,groups:r.signal?.speech?.groups||0,
  shortRecovered:rec.offline?.shortRecovered||0};
}
function sample(kind){
 const rate=12000,seconds=1.12,pcm=new Float32Array(Math.round(seconds*rate));
 let phase=0,seed=741;
 for(let i=0;i<pcm.length;i++){
  const t=i/rate,syll=t>=.15&&t<.48?0:t>=.55&&t<.93?1:-1;
  if(syll<0||kind==='silence')continue;
  if(kind==='noise'){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   pcm[i]=.16*(seed/4294967296-.5);continue;
  }
  const f=syll===0?185:kind==='rising'?180+70*Math.min(1,(t-.55)/.38):205;
  phase+=2*Math.PI*f/rate;
  pcm[i]=.17*Math.sin(phase)+.025*Math.sin(2*phase);
 }
 return pcm;
}
const clips=names.map((name,i)=>decode(path.join(root,'assets/hsk2-lesson3-voice/l3-'+String(i+1).padStart(2,'0')+'.mp3')));
const results=windows.map(config=>{
 const dsp=engine(config),samples=clips.map((pcm,i)=>({name:names[i],...measure(dsp,pcm,i)}));
 const synthetic={
  silence:measure(dsp,sample('silence'),0),
  noise:measure(dsp,sample('noise'),0),
  flat:measure(dsp,sample('flat'),0),
  rising:measure(dsp,sample('rising'),0)
 };
 const sane=synthetic.silence.points===0&&synthetic.noise.quality!=='both'&&
  synthetic.flat.quality==='both'&&synthetic.rising.quality==='both';
 return {config,sane,samples,synthetic,
  complete:samples.filter(x=>x.quality==='both').length,
  partial:samples.filter(x=>x.quality==='partial').length};
});
const report={generated:new Date().toISOString(),source:'panda-tone-test-lab.html',
 note:'Experiments only: no edits to production pitch code or pronunciation grading.',results};
fs.writeFileSync(path.join(root,'tone-window-sweep.json'),JSON.stringify(report,null,2)+'\n');
console.log('Panda Go short-syllable F0 sweep on real lesson-3 MP3 (no microphone)');
for(const result of results){
 console.log(result.config.label+': both='+result.complete+'/6, partial='+result.partial+'/6, synthetic='+ (result.sane?'pass':'FAIL'));
 for(const [i,a] of result.samples.entries()){
  if(i!==1&&i!==2)continue;
  console.log('  '+a.name+': '+a.quality+', F0 '+a.points+', syllables '+a.syllables.map(x=>x.points+'/'+x.durationMs+'ms'+(x.jump?' JUMP':'')).join(' | ')+', split='+a.splitPct+'%'+(a.warning?' warning':''));
  if(i===2&&(result.config.label==='BASE 90/60/18'||result.config.label==='90/60/12')){
   console.log('  同事 shì F0 sequence (ms:Hz): '+a.curves[1].map(p=>p.tMs+':'+p.hz).join(', '));
  }
 }
}
if(process.env.GITHUB_STEP_SUMMARY){
 const rows=[
 '## Измерения F0: сравнение окон на существующих MP3',
 '',
 '> Эксперимент. НЕ является проверкой правильности китайских тонов. Кандидаты не включены в урок.',
 '',
 '| Окно: основное/резервное/шаг (мс) | Оба слога из 6 | 学校 · второй слог | 同事 · второй слог | Искусственные сигналы |',
 '|---|---:|---|---|---|',
 ...results.map(x=>{
 const slot=x.samples[1].syllables[1],col=x.samples[2].syllables[1];
 const display=y=>y?y.points+' F0; '+y.durationMs+' мс'+(y.jump?'; скачок':''):'нет данных';
 return '| '+x.config.label+' | '+x.complete+'/6 | '+display(slot)+' | '+display(col)+' | '+(x.sane?'OK':'FAIL')+' |';
 }),
 '','Полная диагностика: tone-window-sweep.json в артефакте GitHub Actions.'];
 fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,rows.join('\n')+'\n');
}
if(!results[0].sane)process.exitCode=1; // Experimental candidates may fail guards; report, don't promote them.
