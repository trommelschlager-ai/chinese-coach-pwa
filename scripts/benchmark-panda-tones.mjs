// Panda Go: diagnostic ONLY on four existing lesson-1 Mandarin tone recordings.
// F0 curves never certify tone, word identity or natural pronunciation.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {estimatePitch, analyseContour} from '../assets/panda-tone-analytics-v457.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const cases=[
 {hanzi:'妈',pinyin:'mā',tone:1,src:'assets/lesson1-xiaoxiao-v260/ma1.mp3'},
 {hanzi:'麻',pinyin:'má',tone:2,src:'assets/lesson1-xiaoxiao-v260/ma2.mp3'},
 {hanzi:'马',pinyin:'mǎ',tone:3,src:'assets/lesson1-xiaoxiao-v260/ma3.mp3'},
 {hanzi:'骂',pinyin:'mà',tone:4,src:'assets/lesson1-xiaoxiao-v260/ma4.mp3'}
];
const rate=48000;
const report={
 generatedAt:new Date().toISOString(),
 source:'Existing XIAOXIAO_LESSON1 MP3 mapping, HSK1 lesson 1',
 note:'Diagnostic only; third tone may be realized low, without a rise. No automatic Mandarin pronunciation grading, speech recognition or speaker-quality verification.',
 checks:[],technicalFailures:[]
};
function decode(file){
 const r=spawnSync('ffmpeg',['-hide_banner','-nostdin','-loglevel','error','-i',file,'-vn','-ac','1','-ar',String(rate),'-f','f32le','pipe:1'],{encoding:null,timeout:15000,maxBuffer:8*1024*1024});
 if(r.error||r.status!==0||!r.stdout?.length)throw Error(String(r.stderr||r.error?.message||'decoder failed').slice(0,300));
 const n=Math.floor(r.stdout.length/4),samples=new Float32Array(n);
 for(let i=0;i<n;i++)samples[i]=r.stdout.readFloatLE(i*4);
 return samples;
}
function extract(samples){
 const frames=[],size=4096,hop=1344;
 let peakRms=0;
 for(let start=0;start+size<=samples.length;start+=hop){
  let power=0;
  for(let j=start;j<start+size;j+=4)power+=samples[j]*samples[j];
  peakRms=Math.max(peakRms,Math.sqrt(power/(size/4)));
  const p=estimatePitch(samples.subarray(start,start+size),rate);
  if(p?.clarity>.78)frames.push({t:+((start+size/2)/rate).toFixed(3),hz:p.hz,clarity:p.clarity});
 }
 return {frames,peakRms};
}
const mapping=fs.readFileSync(path.join(root,'assets/hsk1-first-v189.js'),'utf8');
for(const item of cases){
 const mapped=JSON.stringify(item.hanzi)+":'./"+item.src+"'";
 const filename=path.join(root,item.src);
 if(!mapping.includes(mapped)){report.technicalFailures.push({file:item.src,error:'Lesson audio map differs from diagnostic manifest'});continue;}
 if(!fs.existsSync(filename)){report.technicalFailures.push({file:item.src,error:'Missing MP3'});continue;}
 try{
  const pcm=decode(filename),{frames,peakRms}=extract(pcm),result=analyseContour(frames);
  report.checks.push({
   hanzi:item.hanzi,pinyin:item.pinyin,expectedTone:item.tone,src:item.src,
   audioDurationSec:+(pcm.length/rate).toFixed(3),pitchFrames:frames.length,
   peakRms:+peakRms.toFixed(4),observedContour:result.kind,
   observation:result.label,explanation:result.reason,
   voicedDurationSec:result.stats?.duration??null,isToneGrade:false,
   pitchTrackHz:frames.slice(0,250).map(p=>({t:p.t,hz:+p.hz.toFixed(1)}))
  });
 }catch(e){report.technicalFailures.push({file:item.src,error:String(e.message||e)});}
}
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports/panda-real-tone-diagnostics.json'),JSON.stringify(report,null,2)+'\n');
for(const c of report.checks)console.log(c.hanzi+' '+c.pinyin+': '+c.observedContour+'; '+c.pitchFrames+' F0 frames (NOT a tone grade)');
for(const c of report.technicalFailures)console.error('TECHNICAL FAILURE: '+c.file+': '+c.error);
console.log('Real MP3 diagnostic: '+report.checks.length+'/'+cases.length+'; failures: '+report.technicalFailures.length);
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
 '\n### Four lesson tone recordings (diagnostic only)\n'+
 report.checks.map(c=>'- '+c.hanzi+' ('+c.pinyin+'): '+c.observedContour+'; '+c.pitchFrames+' pitch frames').join('\n')+
 '\n**NOT a pronunciation grade.**\n');
if(report.technicalFailures.length)process.exitCode=1;
