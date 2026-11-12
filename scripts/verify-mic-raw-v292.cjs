'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('assets/panda-mic-v236.js','utf8');
new vm.Script(src);
assert(src.includes('Math.min(1.35,'),'No gain beyond 1.35x');
assert(src.includes('processedByRaw.set(currentUrl,newUrl)'),'Filtered recording should be a separate alternative');
class FakeAudioContext{
 async decodeAudioData(){
  const samples=new Float32Array(16000);
  for(let i=0;i<samples.length;i++)samples[i]=0.18*Math.sin(2*Math.PI*330*i/16000);
  return {length:samples.length,sampleRate:16000,numberOfChannels:1,duration:1,getChannelData:()=>samples};
 }
 async close(){}
}
const created=[],revoked=[];
const sandbox={window:{AudioContext:FakeAudioContext},URL:{createObjectURL(blob){const url='blob:filtered-'+(created.length+1);created.push({url,blob});return url},revokeObjectURL(url){revoked.push(url)}},Blob,DataView,ArrayBuffer,Float32Array,Math,Promise};
vm.createContext(sandbox);vm.runInContext(src,sandbox);
(async()=>{
 const mic=sandbox.window.PANDA_MIC_V236;
 const raw='blob:original';
 let changed=false;
 mic.enhance(new Blob(['test'],{type:'audio/webm'}),raw,()=>raw,()=>{changed=true});
 await new Promise(r=>setTimeout(r,50));
 assert.equal(changed,false,'Original raw take must never be silently overwritten');
 assert.equal(mic.processedUrl(raw),'blob:filtered-1','Filtered take should be accessible separately');
 assert(created[0].blob.size>5000,'Processed WAV must contain sample data');
 const wavHeader=Buffer.from(await created[0].blob.arrayBuffer()).subarray(0,4).toString('ascii');
 assert.equal(wavHeader,'RIFF');
 mic.forget(raw);
 assert.equal(mic.processedUrl(raw),null);
 assert(revoked.includes('blob:filtered-1'));
 for(const [page,js,button] of [
  ['hsk1-second-v203.html','assets/hsk1-second-v203.js','data-record-filter'],
  ['hsk1-fifth-v227.html','assets/hsk1-fifth-v227.js','data-record-filter'],
  ['hsk1-family-v231.html','assets/panda-go-companion-v231.js','data-replay-filter'],
  ['hsk1-weather-v231.html','assets/panda-go-companion-v231.js','data-replay-filter']
 ]){
  assert(fs.readFileSync(page,'utf8').includes('panda-mic-v236.js?v=292'),page+' stale script');
  const code=fs.readFileSync(js,'utf8');
  new vm.Script(code);assert(code.includes(button),page+' has no filtered comparison button');
 }
 console.log('PASS HSK1 v292: original preserved; filtered WAV optional; gain capped; four course UIs updated');
})().catch(e=>{console.error(e);process.exit(1)});
