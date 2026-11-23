import {lookupApprovedPandaVoice} from './panda-approved-voice-registry-v516.mjs?v=546';
export const lookupPandaVoiceClip=lookupApprovedPandaVoice;
export const lookupPilotAudio=text=>lookupApprovedPandaVoice(text)?.src||null;
