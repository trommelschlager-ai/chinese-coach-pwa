'use strict';
/* Panda Go: vendor the Arphic-licensed Hanzi Writer stroke data for offline lessons. */
const fs=require('node:fs'),path=require('node:path');
const meta=JSON.parse(fs.readFileSync('assets/hanzi-writing-curriculum-v283.json','utf8'));
const chars=[...new Set(meta.lessons.flatMap(l=>l.characters.map(x=>x[0])))];
const dirname='assets/hanzi-data';fs.mkdirSync(dirname,{recursive:true});
const validate=(ch,data)=>{
 if(!data||!Array.isArray(data.strokes)||!Array.isArray(data.medians)||!data.strokes.length||data.strokes.length!==data.medians.length)
  throw Error('Invalid HanziWriter data for '+ch);
};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function fetchChar(ch){
 const url='https://raw.githubusercontent.com/chanind/hanzi-writer-data/master/data/'+encodeURIComponent(ch)+'.json';
 let last;
 for(let i=0;i<4;i++){
  try{
   const res=await fetch(url,{signal:AbortSignal.timeout(25000)});
   if(!res.ok)throw Error('HTTP '+res.status+' '+url);
   const data=await res.json();validate(ch,data);return data;
  }catch(e){last=e;await wait(850*(i+1))}
 }
 throw Error('Could not download '+ch+': '+String(last));
}
(async()=>{
 let copied=0,verified=0,queue=[];
 for(const ch of chars){
  const file=path.join(dirname,ch+'.json');
  if(fs.existsSync(file)){validate(ch,JSON.parse(fs.readFileSync(file,'utf8')));verified++}
  else queue.push(ch);
 }
 let ix=0,errors=[];
 const workers=Array.from({length:Math.min(8,queue.length)},async()=>{
  while(ix<queue.length){
   const ch=queue[ix++];
   try{
    const data=await fetchChar(ch);
    fs.writeFileSync(path.join(dirname,ch+'.json'),JSON.stringify(data));
    copied++;
   }catch(e){errors.push(String(e))}
  }
 });
 await Promise.all(workers);
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS HanziWriter offline data: '+chars.length+' unique chars, '+copied+' new, '+verified+' already present');
})().catch(e=>{console.error(e);process.exit(1)});
