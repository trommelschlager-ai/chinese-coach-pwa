import {lookupPandaVoiceClip as old,lookupPilotAudio} from './panda-live-audio.mjs?v=451';
import {HSK2_AUDIO} from './panda-hsk2-brain-data-v1.mjs';
import {norm} from './panda-hsk2-brain-v1.mjs';
export {lookupPilotAudio};
export function lookupPandaVoiceClip(text){const a=old(text);if(a)return a;const key=norm(text),src=HSK2_AUDIO[key]||globalThis.PandaGoHSK2Lesson1NativeAudioV459?.[key];return src?{src,start:0,end:null,source:'hsk2-exact-candidate'}:null;}
