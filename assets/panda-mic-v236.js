/* Panda Go v236: local playback leveling for learner microphone recordings.
 * No network or tone/pitch/speed changes. Unchanged audio stays available on failure.
 */
(function(){
 'use strict';
 if(window.PANDA_MIC_V236)return;
 async function normalize(blob){
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context||!blob||!blob.size||blob.size>12000000)return blob;
  let ctx;
  try{
   ctx=new Context();
   const input=await ctx.decodeAudioData(await blob.arrayBuffer());
   if(!input.length||!input.numberOfChannels||input.duration>45||input.sampleRate>96000)return blob;
   const mono=new Float32Array(input.length),n=input.length;
   for(let c=0;c<input.numberOfChannels;c++){
    const channel=input.getChannelData(c);
    for(let i=0;i<n;i++)mono[i]+=channel[i]/input.numberOfChannels;
   }
   let peak=0,maxFrame=0;
   const frame=Math.max(64,Math.floor(input.sampleRate*0.025)),levels=[];
   for(let start=0;start<n;start+=frame){
    let power=0,count=0;
    for(let i=start;i<Math.min(n,start+frame);i++){
     const value=mono[i];peak=Math.max(peak,Math.abs(value));power+=value*value;count++;
    }
    const level=Math.sqrt(power/Math.max(1,count));
    levels.push(level);maxFrame=Math.max(maxFrame,level);
   }
   if(peak<0.003||maxFrame<0.004)return blob;
   const threshold=Math.max(0.004,maxFrame*0.2);
   let power=0,count=0;
   for(const level of levels)if(level>=threshold){power+=level*level;count++}
   if(!count)return blob;
   const activeRms=Math.sqrt(power/count);
   const quiet=levels.filter(x=>x<threshold).sort((a,b)=>a-b);
   const floor=quiet.length?quiet[Math.floor(quiet.length/2)]:0;
   const noiseCap=floor>0.008?Math.max(1,0.018/floor):4;
   const gain=Math.min(4,noiseCap,Math.max(1,0.16/Math.max(0.001,activeRms)),0.9/peak);
   if(!Number.isFinite(gain)||gain<1.07)return blob;
   const buffer=new ArrayBuffer(44+n*2),dv=new DataView(buffer);
   const word=(pos,w)=>{for(let i=0;i<w.length;i++)dv.setUint8(pos+i,w.charCodeAt(i))};
   word(0,'RIFF');dv.setUint32(4,36+n*2,true);word(8,'WAVE');word(12,'fmt ');
   dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);
   dv.setUint32(24,input.sampleRate,true);dv.setUint32(28,input.sampleRate*2,true);
   dv.setUint16(32,2,true);dv.setUint16(34,16,true);word(36,'data');dv.setUint32(40,n*2,true);
   for(let i=0;i<n;i++)dv.setInt16(44+i*2,Math.round(Math.max(-0.9,Math.min(0.9,mono[i]*gain))*32767),true);
   return new Blob([buffer],{type:'audio/wav'});
  }catch{return blob}
  finally{if(ctx)try{await ctx.close()}catch{}}
 }
 function enhance(blob,currentUrl,getUrl,setUrl){
  if(!blob||!currentUrl||typeof getUrl!=='function'||typeof setUrl!=='function')return;
  Promise.resolve(normalize(blob)).then(improved=>{
   if(!improved||improved===blob||getUrl()!==currentUrl)return;
   const next=URL.createObjectURL(improved);
   setUrl(next);URL.revokeObjectURL(currentUrl);
  }).catch(()=>{});
 }
 window.PANDA_MIC_V236=Object.freeze({normalize,enhance});
})();
