import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../assets/panda-hsk2-my-day-scenario-v1.mjs',import.meta.url),'utf8');
const start=source.indexOf(' function speak(a,slow=false){');
const end=source.indexOf(' const delay=ms=>',start);
const speechSource=source.slice(start,end);
assert(start>=0&&end>start,'Cannot locate the approved speech player');

function playbackHarness(){
 const stage={dataset:{}},statuses=[],missingAudio=new Set(),clips=[],timers=new Map();
 let timerId=0;
 class Audio {
  constructor(src){this.src=src;this.paused=true;clips.push(this)}
  play(){this.paused=false;return Promise.resolve()}
  pause(){this.paused=true;this.onpause?.()}
 }
 const setTimer=(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id};
 const clearTimer=id=>timers.delete(id);
 const api=new Function('approvedClips','stage','missingAudio','norm','status','Audio','setTimeout','clearTimeout',
   'let sequence=1,playbackRate=1,player=null;\n'+speechSource+'\nreturn {speak,getPlayer:()=>player};'
 )(()=>['approved.mp3'],stage,missingAudio,s=>s,s=>statuses.push(s),Audio,setTimer,clearTimer);
 return {...api,stage,statuses,missingAudio,clips,timers};
}

function asrHarness(phase){
 const micStart=source.indexOf(' function mic(){');
 const start=source.indexOf('  r.onresult=e=>{',micStart);
 const end=source.indexOf('  try{r.start()}',start);
 assert(start>=0&&end>start,'Cannot locate speech recognition handlers');
 const handlerSource=source.slice(start,end),statuses=[];
 const harness=new Function('phase','status',
  'const r={};let recognizer=r;const dayInput={value:""},dayLong={value:""};'+
  'const $=id=>id==="day-input"?dayInput:dayLong;'+
  'const stopRecognition=()=>{recognizer=null};'+
  'const countdown=()=>{throw new Error("ASR must not skip the lesson")};\n'+handlerSource+
  '\nreturn {r,dayInput,dayLong,current:()=>recognizer};'
 )(phase,msg=>statuses.push(msg));
 return {...harness,statuses};
}
const finalResult=(text,confidence)=> {
 const alternative=[{transcript:text,confidence}];
 alternative.isFinal=true;
 return {resultIndex:0,results:[alternative]};
};

test('approved MP3 playback clears the speaking state after a real onended event',async()=>{
 const h=playbackHarness(),result=h.speak(['你好！']);
 assert.equal(h.clips.length,1);
 assert.equal(h.stage.dataset.dayTalking,'true');
 h.clips[0].onplaying();
 assert.equal(h.timers.size,0,'Playback start removes the timeout');
 h.clips[0].onended();
 await result;
 assert.equal(h.stage.dataset.dayTalking,'false');
 assert.equal(h.getPlayer(),null);
});

test('MP3 stalled for ten seconds recovers with a visible text fallback',async()=>{
 const h=playbackHarness(),result=h.speak(['你好！']);
 const waiting=[...h.timers.values()];
 assert.equal(waiting.length,1);
 assert.equal(waiting[0].ms,10000);
 waiting[0].fn();
 await result;
 assert.equal(h.stage.dataset.dayTalking,'false');
 assert(h.missingAudio.has('你好！'));
 assert.match(h.statuses.join(' '),/Запись не воспроизводится/);
});

test('low-confidence Chinese ASR never auto-submits a learner answer',()=>{
 const h=asrHarness('questions');
 h.r.onresult(finalResult('我今天八点起床',0.30));
 assert.equal(h.dayInput.value,'我今天八点起床');
 assert.equal(h.current(),null);
 assert.match(h.statuses.join(' '),/неуверенно/);
 assert.match(h.statuses.join(' '),/Тоны не оценивались/);
});

test('even high-confidence voice commands require learner confirmation',()=>{
 const h=asrHarness('freechat');
 h.r.onresult(finalResult('再说一遍',0.99));
 assert.equal(h.dayInput.value,'再说一遍');
 assert.equal(h.current(),null);
 assert.match(h.statuses.join(' '),/нажми «Ответить»/);
});

test('ASR errors release the recognizer and leave typed input available',()=>{
 const h=asrHarness('questions');
 h.r.onerror({error:'network'});
 assert.equal(h.current(),null);
 assert.match(h.statuses.join(' '),/Можно ответить текстом/);
});

test('the scenario never requests system TTS or arbitrary substitute voice',()=>{
 assert(!source.includes('speechSynthesis.speak('));
 assert.match(source,/function approvedClips\(text\)/);
 assert.match(source,/lookupApprovedPandaVoice\(text\)/);
});
