import {lookupApprovedPandaVoice} from './panda-approved-voice-registry-v516.mjs';
export const lookupPandaVoiceClip=lookupApprovedPandaVoice;
export const lookupPilotAudio=text=>lookupApprovedPandaVoice(text)?.src||null;
