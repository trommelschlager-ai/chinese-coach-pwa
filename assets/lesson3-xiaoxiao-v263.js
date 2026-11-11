/* Panda Go HSK1 Lesson 3 v263 — Xiaoxiao, numbers 0–100.
 * All 101 user-provided full-number clips; no fragments or old synthetic fallbacks.
 * Native review of Mandarin tones and commercial TTS rights pending. */
(()=>{'use strict';
  const base='./assets/lesson3-xiaoxiao-v263/';
  const clips=Object.freeze(Array.from({length:101},(_,n)=>base+String(n).padStart(3,'0')+'.mp3'));
  window.PandaLesson3XiaoxiaoV263=Object.freeze({clips,lookup:n=>Number.isInteger(Number(n))&&Number(n)>=0&&Number(n)<=100?clips[Number(n)]:null});
})();
