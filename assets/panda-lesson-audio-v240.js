/* Panda Go v248: focused realtime cleaning of five owner-supplied Mandarin recordings.
 * High/low-pass filters reduce rumble and hiss; compression, gain and peak limiter
 * balance perceived loudness without altering tone pitch or rewriting source audio.
 */
(()=>{'use strict';
 if(window.PandaLessonAudioV240)return;
 const AudioCtx=window.AudioContext||window.webkitAudioContext;
 const priority=new Set(['今天','几','明天七号','明天下雨吗','明天下雨']);
 const key=s=>String(s||'').replace(/[。！？!?？，,\s]/g,'');
 const isPriority=s=>priority.has(key(s));
 let ctx=null;
 function improve(element,profile='dates',phrase=''){
  if(!AudioCtx||!element||!['dates','weather'].includes(profile))return false;
  let source=null,hp=null,lp=null,presence=null,compressor=null,gain=null,limiter=null;
  try{
   if(!ctx)ctx=new AudioCtx();
   const focus=isPriority(phrase);
   source=ctx.createMediaElementSource(element);
   hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=85;hp.Q.value=0.70;
   lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=7200;lp.Q.value=0.70;
   presence=ctx.createBiquadFilter();presence.type='peaking';presence.frequency.value=2400;
   presence.Q.value=0.75;presence.gain.value=focus?1.1:0;
   compressor=ctx.createDynamicsCompressor();compressor.threshold.value=focus?-18:-15;
   compressor.knee.value=7;compressor.ratio.value=focus?2.8:2.5;
   compressor.attack.value=0.007;compressor.release.value=0.16;
   gain=ctx.createGain();gain.gain.value=focus?1.8:(profile==='dates'?1.35:1.4);
   limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-2.5;
   limiter.knee.value=0;limiter.ratio.value=15;limiter.attack.value=0.002;limiter.release.value=0.09;
   source.connect(hp);hp.connect(lp);lp.connect(presence);presence.connect(compressor);
   compressor.connect(gain);gain.connect(limiter);limiter.connect(ctx.destination);
   let cleaned=false;
   const cleanup=()=>{if(cleaned)return;cleaned=true;
    try{source.disconnect();hp.disconnect();lp.disconnect();presence.disconnect();
     compressor.disconnect();gain.disconnect();limiter.disconnect()}catch{}
   };
   element.addEventListener('ended',cleanup,{once:true});
   element.addEventListener('pause',cleanup,{once:true});
   element.addEventListener('error',cleanup,{once:true});
   if(ctx.state==='suspended')ctx.resume().catch(()=>{});
   return true;
  }catch(e){
   try{source?.disconnect();source?.connect(ctx.destination)}catch{}
   return false;
  }
 }
 window.PandaLessonAudioV240=Object.freeze({improve,isPriority});
})();