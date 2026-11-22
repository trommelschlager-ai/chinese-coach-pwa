// v512: only explicitly documented Panda Luvvoice packs. Provenance is not acoustic certification.
import {lookupPandaVoiceClip as original} from './panda-live-audio.mjs?v=451';
import {PANDA_V422_VOICE} from './qa-v411/panda-voice-v422.mjs?v=422';
import {PANDA_CLARIFICATION_VOICE} from './panda-clarification-voice-20261122/index.mjs?v=505';
const DAY=Object.freeze([{"zh":"你好！今天我说说我的一天。","src":"./assets/panda-hsk2-my-day-voice-20261120/day01.mp3"},{"zh":"我早上刷牙。","src":"./assets/panda-hsk2-my-day-voice-20261120/day02.mp3"},{"zh":"你早上吃早饭吗？","src":"./assets/panda-hsk2-my-day-voice-20261120/day03.mp3"},{"zh":"你几点去上班？","src":"./assets/panda-hsk2-my-day-voice-20261120/day04.mp3"},{"zh":"你晚上几点睡觉？","src":"./assets/panda-hsk2-my-day-voice-20261120/day05.mp3"},{"zh":"我九点去上班。","src":"./assets/panda-hsk2-my-day-voice-20261120/day06.mp3"},{"zh":"我晚上十一点睡觉。","src":"./assets/panda-hsk2-my-day-voice-20261120/day07.mp3"},{"zh":"我早上不吃早饭。","src":"./assets/panda-hsk2-my-day-voice-20261120/day08.mp3"},{"zh":"我不上班。","src":"./assets/panda-hsk2-my-day-voice-20261120/day09.mp3"},{"zh":"现在请你说说你的一天。","src":"./assets/panda-hsk2-my-day-voice-20261120/day10.mp3"},{"zh":"我没听清楚，请再说一遍。","src":"./assets/panda-hsk2-my-day-voice-20261120/day11.mp3"},{"zh":"这是你的一天。","src":"./assets/panda-hsk2-my-day-voice-20261120/day12.mp3"},{"zh":"做得好！","src":"./assets/panda-hsk2-my-day-voice-20261120/day13.mp3"},{"zh":"我们再试一次。","src":"./assets/panda-hsk2-my-day-voice-20261120/day14.mp3"}]);
const EMBEDDED_KEYS=Object.freeze(["起床","洗脸","刷牙","吃早饭","去上班","睡觉","你每天几点起床？","我每天七点起床。","我每天八点起床。","我早上洗脸。","我起床以后刷牙。"]);
export const voiceNorm=s=>String(s||'').normalize('NFC').replace(/[\p{P}\s]/gu,'');
const exact=new Map([...PANDA_V422_VOICE.map(e=>({...e,batch:'family-v422'})),...DAY.map(e=>({...e,batch:'my-day'})),...PANDA_CLARIFICATION_VOICE.map(e=>({...e,batch:'clarification'}))].map(e=>[voiceNorm(e.zh),e]));
const OLD_ALLOWED=/^\.\/assets\/(?:panda-voice-clips-v365\/p\d{3}|panda-voice-clips-v411\/p\d{3}|panda-grammar-voice-v451\/g\d{3}|panda-live-voice-v[234]\/[\w-]+|panda-live-voice-bridge-v307\/B\d{2}|hsk2-user-voice\/20261114-job-question-v343)\.mp3$/;
export function lookupApprovedPandaVoice(text){
 const key=voiceNorm(text);if(!key)return null;
 const entry=exact.get(key);if(entry)return {src:entry.src,start:0,end:null,source:'panda-approved-luvvoice:'+entry.batch};
 const originalKey=EMBEDDED_KEYS.find(k=>voiceNorm(k)===key),src=originalKey&&globalThis.PandaGoHSK2Lesson1NativeAudioV459?.[originalKey];
 if(typeof src==='string'&&src.startsWith('data:audio/mpeg;base64,'))return {src,start:0,end:null,source:'panda-approved-luvvoice:day-v459'};
 const old=original(key);
 return old&&OLD_ALLOWED.test(old.src)?old:null;
}
