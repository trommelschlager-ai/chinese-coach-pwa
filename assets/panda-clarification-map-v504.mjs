import {PANDA_CLARIFICATION_VOICE,lookupClarificationVoice} from './panda-clarification-voice-20261122/index.mjs?v=505';

export const CLARIFICATION=PANDA_CLARIFICATION_VOICE.map(({zh,pinyin,ru})=>[zh,pinyin,ru]);
export const clarificationLine=n=> {
 const [hanzi,pinyin,ru]=CLARIFICATION[n-1];
 return {hanzi,pinyin,ru,audioKey:hanzi};
};
export {lookupClarificationVoice};
