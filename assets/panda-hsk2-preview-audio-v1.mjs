import {lookupPandaVoiceClip as old,lookupPilotAudio} from './panda-live-audio.mjs?v=451';
import {HSK2_AUDIO} from './panda-hsk2-brain-data-v1.mjs';
import {norm} from './panda-hsk2-brain-v1.mjs?v=511';
import {lookupClarificationVoice} from './panda-clarification-map-v504.mjs?v=505';
export {lookupPilotAudio};
export function lookupPandaVoiceClip(text){const a=lookupClarificationVoice(text)||old(text);if(a)return a;const key=norm(text),src=HSK2_AUDIO[key]||globalThis.PandaGoHSK2Lesson1NativeAudioV459?.[key];return src?{src,start:0,end:null,source:'hsk2-exact-candidate'}:null;}
