/* Panda Go v240 — gentle gain + dynamics for quiet learner-facing audio.
 * Web Audio processing is local; preserves pitch and avoids hard clipping.
 * Best effort: if unsupported, original MP3 remains directly playable.
 */
(()=>{'use strict';
 if(window.PandaLessonAudioV240)return;
 const AudioCtx=window.AudioContext||window.webkitAudioContext;
 let ctx=null;
 function improve(element,profile='dates'){
  if(!AudioCtx||!element||!['dates','weather'].includes(profile))return false;
  let source=null,compressor=null,gain=null,highpass=null;
  try{
   if(!ctx)ctx=new AudioCtx();
   source=ctx.createMediaElementSource(element);
   compressor=ctx.createDynamicsCompressor();
   compressor.threshold.value=-15;compressor.knee.value=6;
   compressor.ratio.value=3;compressor.attack.value=0.006;compressor.release.value=0.20;
   gain=ctx.createGain();
   gain.gain.value=profile==='dates'?1.35:1.4;
   highpass=ctx.createBiquadFilter();highpass.type='highpass';highpass.frequency.value=75;
   source.connect(highpass);highpass.connect(gain);gain.connect(compressor);compressor.connect(ctx.destination); // gentle voice levelling
   const cleanup=()=>{try{source.disconnect();highpass.disconnect();compressor.disconnect();gain.disconnect()}catch{}};
   element.addEventListener('ended',cleanup,{once:true});
   element.addEventListener('pause',cleanup,{once:true});
   element.addEventListener('error',cleanup,{once:true});
   if(ctx.state==='suspended')ctx.resume().catch(()=>{});
   return true;
  }catch(e){
   // On failure, reconnect to unprocessed destination where possible.
   try{source?.disconnect();source?.connect(ctx.destination)}catch{}
   return false;
  }
 }
 window.PandaLessonAudioV240=Object.freeze({improve});
})();
