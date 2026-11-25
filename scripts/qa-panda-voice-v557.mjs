import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import fs from 'node:fs';
import {PANDA_XIAOXIAO_V557_BATCH as batch} from '../assets/panda-approved-voice-registry-v516.mjs';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:393,height:800},isMobile:true,hasTouch:true});
 await page.goto(base+'/panda-voice-pilot.html',{waitUntil:'domcontentloaded'});
 const results=[];
 for(let i=0;i<batch.length;i+=8){
  const rows=await page.evaluate(async entries=>{
   const audio=new AudioContext();
   try{return await Promise.all(entries.map(async x=>{
    try{
     const response=await fetch(x.src);
     if(!response.ok)throw Error('HTTP '+response.status);
     const bytes=await response.arrayBuffer();
     const decoded=await audio.decodeAudioData(bytes);
     return {zh:x.zh,src:x.src,bytes:bytes.byteLength,duration:decoded.duration,ok:true};
    }catch(e){return {zh:x.zh,src:x.src,ok:false,error:String(e)}}
   }));}finally{await audio.close();}
  },batch.slice(i,i+8));
  results.push(...rows);
 }
 fs.mkdirSync('qa/panda-dialogue-v556',{recursive:true});
 fs.writeFileSync('qa/panda-dialogue-v556/voice-decode-v557.json',JSON.stringify(results,null,2));
 assert.equal(results.length,64);
 for(const r of results)assert(r.ok&&r.duration>0&&r.bytes>1000,JSON.stringify(r));
 console.log('PASS Chromium fetch and audio decode 64/64');
}finally{await browser.close()}
