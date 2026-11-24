// Offline diagnostic: quantify the limits of a contour-to-tone heuristic.
// The browser continues to show contours without assigning pronunciation grades.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {estimatePitch,analyseContour} from '../assets/panda-tone-analytics-v457.mjs';
import {analyseRecordedBuffer} from '../assets/panda-tone-recording-analysis-v465.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const curriculum=JSON.parse(readFileSync(join(root,'assets/pinyin-reading-curriculum.json'),'utf8'));
const combiningTones={'\u0304':1,'\u0301':2,'\u030c':3,'\u0300':4};
const isolated=curriculum.clips.flatMap(({id,pinyin,text})=>{
 if(!/^\p{Script=Han}$/u.test(text)||!/^\p{L}+$/u.test(pinyin))return [];
 const labels=[...pinyin.normalize('NFD')].flatMap(ch=>combiningTones[ch]?[combiningTones[ch]]:[]);
 return labels.length===1?[{id,tone:labels[0]}]:[];
});
const sets=['pinyin-reading-v2','pinyin-reading-v5'].map(name=>({
 name,samples:isolated.map(({id,tone})=>({file:join(root,'assets',name,id+'.mp3'),tone}))
}));
const external=process.argv[2];
if(external){
 const syllables=['ai','ba','bei','da','di','hao','ji','ma','qi','shi','xing','zai'];
 sets.push({name:'external-isolated-pinyin',samples:syllables.flatMap(syllable=>
  [1,2,3,4].map(tone=>({file:join(external,syllable+tone+'.mp3'),tone})))});
}

const rate=48000;
const contourTone={level:1,rise:2,dip:3,fall:4};
function readAudio(file){
 const pcm=execFileSync('ffmpeg',['-hide_banner','-nostdin','-loglevel','error','-i',file,'-vn','-ac','1',
  '-ar',String(rate),'-f','f32le','pipe:1'],{timeout:15000,maxBuffer:8*1024*1024});
 if(!pcm.length||pcm.length%4)throw new Error('Empty or incomplete PCM');
 const samples=Float32Array.from({length:pcm.length/4},(_,i)=>pcm.readFloatLE(i*4));
 return {sampleRate:rate,length:samples.length,numberOfChannels:1,getChannelData:()=>samples};
}

const seen=new Map();
const failures=[];
const results=[];
function newMatrix(){
 return Array.from({length:4},()=>[0,0,0,0,0]);
}
function record(matrix,tone,contour){
 const predicted=contourTone[contour];
 matrix[tone-1][predicted?predicted-1:4]++;
}
function summarize(matrix){
 const sum=values=>values.reduce((total,value)=>total+value,0);
 const total=sum(matrix.flat());
 const correct=sum(matrix.map((row,index)=>row[index]));
 const abstained=sum(matrix.map(row=>row[4]));
 return {total,correct,incorrect:total-correct-abstained,abstained,matrix};
}
for(const {name,samples} of sets){
 // Rows show reference tones 1–4. Columns show inferred tones 1–4, then abstentions.
 const full=newMatrix(),withShort=newMatrix();
 let duplicates=0;
 for(const {file,tone} of samples){
  try{
   const sha=createHash('sha256').update(readFileSync(file)).digest('hex');
   const identical=seen.get(sha);
   if(identical){
    if(identical.tone!==tone)throw new Error('Identical audio has two tone labels: '+identical.file);
    duplicates++;
    continue;
   }
   const audio=readAudio(file);
   const {result}=analyseRecordedBuffer(audio,{estimatePitch,analyseContour});
   record(full,tone,result.kind);
   record(withShort,tone,result.shapeHint?.direction??result.kind);
   seen.set(sha,{file,tone});
  }catch(error){
   failures.push({file,message:error.message});
  }
 }
 results.push({name,duplicates,full:summarize(full),withShort:summarize(withShort)});
}
console.log(JSON.stringify({diagnosticOnly:true,results,failures},null,2));
if(failures.length)process.exitCode=1;
