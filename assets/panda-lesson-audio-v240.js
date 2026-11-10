/* Panda Go v240 — gentle gain + dynamics for quiet learner-facing audio.
 * Web Audio processing is local; preserves pitch and avoids hard clipping.
 * Best effort: if unsupported, original MP3 remains directly playable.
 */
(()=>{'use strict';
 if(window.PandaLessonAudioV240)return;
 const AudioCtx=window.AudioContext||window.webkitAudioContext;
 let ctx=null;
 function improve(element,profile='dates'){
  if(!AudioCtx||!element||profile!=='dates')return false;
  let source=null,compressor=null,gain=null;
  try{
   if(!ctx)ctx=new AudioCtx();
   source=ctx.createMediaElementSource(element);
   compressor=ctx.createDynamicsCompressor();
   compressor.threshold.value=-14;compressor.knee.value=14;
   compressor.ratio.value=6;compressor.attack.value=0.004;compressor.release.value=0.18;
   gain=ctx.createGain();
   gain.gain.value=1.75;
   source.connect(compressor);compressor.connect(gain);gain.connect(ctx.destination);
   const cleanup=()=>{try{source.disconnect();compressor.disconnect();gain.disconnect()}catch{}};
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
