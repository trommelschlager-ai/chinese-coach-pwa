import {PANDA_CLIPS} from './panda-voice-clips-v365.mjs?v=365';
import {PANDA_V411_VOICE} from './panda-voice-v411.mjs?v=411';
import {HSK1_VOICE_PHRASES} from './panda-hsk1-voice-v280.mjs?v=281';
// Exact phrases from the user-supplied Luvvoice recordings. No alternate voices.
export const PILOT_AUDIO=Object.freeze({"早上好": "./assets/panda-live-voice-v4/p01.mp3", "中午好": "./assets/panda-live-voice-v4/p02.mp3", "下午好": "./assets/panda-live-voice-v4/p03.mp3", "晚上好": "./assets/panda-live-voice-v4/p04.mp3", "你好": "./assets/panda-live-voice-v2/hello.mp3", "你好吗": "./assets/panda-live-voice-v2/how-are-you.mp3", "很好": "./assets/panda-live-voice-v2/good.mp3", "我也很好谢谢": "./assets/panda-live-voice-v2/me-too-thanks.mp3", "谢谢": "./assets/panda-live-voice-v2/thanks.mp3", "你是老师吗": "./assets/panda-live-voice-v3/p01.mp3", "我也是老师": "./assets/panda-live-voice-v3/p02.mp3", "我是老师": "./assets/panda-live-voice-v3/p03.mp3", "你几岁": "./assets/panda-live-voice-v3/p04.mp3", "我三岁": "./assets/panda-live-voice-v3/p05.mp3", "今天星期几": "./assets/panda-live-voice-v3/p06.mp3", "明天星期二": "./assets/panda-live-voice-v3/p07.mp3", "今天几月几号": "./assets/panda-live-voice-v3/p08.mp3", "明天三月六号": "./assets/panda-live-voice-v3/p09.mp3", "你有哥哥吗": "./assets/panda-live-voice-v3/p10.mp3", "我也有哥哥": "./assets/panda-live-voice-v3/p11.mp3", "我有一个哥哥": "./assets/panda-live-voice-v3/p12.mp3", "今天天气怎么样": "./assets/panda-live-voice-v3/p13.mp3", "明天天气怎么样": "./assets/panda-live-voice-v3/p14.mp3", "你学习中文吗": "./assets/panda-live-voice-bridge-v307/B01.mp3", "我学习中文": "./assets/panda-live-voice-bridge-v307/B02.mp3", "你忙吗": "./assets/panda-live-voice-bridge-v307/B03.mp3", "我很忙": "./assets/panda-live-voice-bridge-v307/B04.mp3", "我不忙": "./assets/panda-live-voice-bridge-v307/B05.mp3", "中文": "./assets/panda-live-voice-bridge-v307/B06.mp3", "学习": "./assets/panda-live-voice-bridge-v307/B07.mp3", "忙": "./assets/panda-live-voice-bridge-v307/B08.mp3", "你做什么工作": "./assets/hsk2-user-voice/20261114-job-question-v343.mp3", "你为什么学习中文": "./assets/panda-live-voice-bridge-v307/B09.mp3", "因为我喜欢中文": "./assets/panda-live-voice-bridge-v307/B10.mp3"});
// Panda AI voice must be single-source: its approved Luvvoice recordings only.
// IMPORTANT: HSK1 lesson clips (Xiaoxiao and original native-speaker files)
// belong to lesson playback, not to the conversational Panda. Never fallback
// to those recordings when Panda lacks the exact approved phrase.
export const lookupPilotAudio=text=>{
 const key=String(text||'').replace(/[。！?!？，,\s]/g,'');
 return PANDA_V411_VOICE.find(entry=>entry.zh===key)?.src||PILOT_AUDIO[key]||null;
};
export const recordedCoursePhrases=()=>HSK1_VOICE_PHRASES.slice();

// v336: connect the 14 November Luvvoice corpus to the conversational Panda.
// Each index entry is a time range inside the user's original MP3.
// Only exact written phrases are allowed; never substitute a sentence for a word.
const voiceNorm=s=>String(s||'').normalize('NFC').replace(/[。！？?!，,\s]/g,'');
export function lookupPandaVoiceClip(phrase){
 const key=voiceNorm(phrase);
 if(!key)return null;
 const newClip=PANDA_V411_VOICE.find(entry=>entry.zh===key);
 if(newClip)return {src:newClip.src,start:0,end:null,source:'user-luvvoice-nov16-cut'};
 const index=typeof window!=='undefined'?window.PandaUserVoiceIndexV332?.clips:null;
 if(Array.isArray(index)){
  const clip=index.find(item=>voiceNorm(item.zh)===key);
  if(clip&&/^[\w.-]+\.mp3$/.test(clip.file)&&Number.isFinite(clip.start)&&Number.isFinite(clip.end)&&clip.end>clip.start){
   const cut=PANDA_CLIPS.find(c=>c.file===clip.file&&c.start===clip.start&&c.end===clip.end&&voiceNorm(c.zh)===key);
   // Dedicated files remove runtime seeks and their muted-unmute race.
   return cut?{src:cut.src,start:0,end:null,source:'user-luvvoice-nov14-cut'}:null;
  }
 }
 const old=lookupPilotAudio(phrase);
 return old?{src:old,start:0,end:null,source:'prior-verified'}:null;
}
