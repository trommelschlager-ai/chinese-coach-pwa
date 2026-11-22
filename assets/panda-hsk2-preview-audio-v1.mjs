import {lookupApprovedPandaVoice} from './panda-approved-voice-registry-v513.mjs';
export const lookupPandaVoiceClip=lookupApprovedPandaVoice;
export const lookupPilotAudio=text=>lookupApprovedPandaVoice(text)?.src||null;
