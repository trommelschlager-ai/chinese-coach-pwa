import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const page=fs.readFileSync(new URL('../panda-tone-ma-practice.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../assets/panda-tone-ma-pilot-v463.mjs',import.meta.url),'utf8');

test('recording controls and level meter are visibly available to learners',()=>{
 assert(page.includes('id="replay"'));
 assert(page.includes('id="mic-level-fill"'));
 assert(page.includes('id="mic-level-label"'));
 assert(page.includes('id="recording-message"'));
 assert(page.includes('panda-tone-ma-pilot-v463.mjs?v=465'));
 assert(page.includes('не отправляется на сервер'));
 assert(js.includes('new MediaRecorder(newStream)'));
 assert(js.includes('recordedAudio=new Audio(recordedUrl)'));
 assert(!/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/i.test(js));
});

test('Android-like microphone capture can be replayed locally even if F0 estimation is insufficient',async()=>{
 const dom=new JSDOM(page,{url:'https://example.test/chinese-coach-pwa/panda-tone-ma-practice.html',runScripts:'outside-only'});
 const w=dom.window,document=w.document;
 const observed={plays:[],revoked:[],blobs:[],tracksStopped:0,recorderStopped:0};
 try{
  Object.defineProperty(w,'isSecureContext',{configurable:true,value:true});
  Object.defineProperty(w.navigator,'mediaDevices',{configurable:true,value:{
   getUserMedia:async()=>({getTracks:()=>[{stop(){observed.tracksStopped++;}}]})
  }});
  class FakeAudio{
   constructor(src){this.src=src;this.paused=true;this.currentTime=0;}
   play(){this.paused=false;observed.plays.push(this.src);return Promise.resolve();}
   pause(){this.paused=true;}
  }
  w.Audio=FakeAudio;
  class FakeContext{
   constructor(){this.sampleRate=48000;}
   async resume(){}
   async close(){}
   createAnalyser(){return {fftSize:4096,smoothingTimeConstant:0,connect(){},disconnect(){},
     getFloatTimeDomainData(array){for(let i=0;i<array.length;i++)array[i]=.08*Math.sin(i*.4);}
   };}
   createMediaStreamSource(){return {connect(){},disconnect(){}};}
  }
  w.AudioContext=FakeContext;
  class FakeRecorder extends w.EventTarget{
   constructor(){super();this.state='inactive';this.mimeType='audio/webm';}
   start(){this.state='recording';}
   stop(){
    this.state='inactive';observed.recorderStopped++;
    this.ondataavailable?.({data:new w.Blob(['fake-local-microphone-recording'.repeat(30)],{type:this.mimeType})});
    this.dispatchEvent(new w.Event('stop'));
   }
  }
  w.MediaRecorder=FakeRecorder;
  w.URL.createObjectURL=blob=>{observed.blobs.push(blob);return 'blob:https://example.test/local-'+observed.blobs.length;};
  w.URL.revokeObjectURL=url=>observed.revoked.push(url);
  w.__fakeTone={estimatePitch:()=>null,analyseContour:()=>({
   kind:'insufficient',label:'Недостаточно высоты',reason:'Нужно повторить',points:[],isToneGrade:false
  })};
  const runnable=js.replace(
   /^import \{estimatePitch, analyseContour\} from [^\n]+;\s*/m,
   'const {estimatePitch, analyseContour}=window.__fakeTone;\n'
  );
  const runnableWithDecode=runnable.replace(
   /^import \{analyseRecordedBlob\} from [^\n]+;\s*/m,
   'const {analyseRecordedBlob}=window.__fakeTone;\n'
  );
  assert(!runnableWithDecode.includes("import {analyseRecordedBlob}"));
  w.__fakeTone.analyseRecordedBlob=async()=>({available:true,frames:[],
   result:w.__fakeTone.analyseContour(),
   signal:{hasAudibleSignal:true,soundFrames:12,pitchFrames:0}});
  w.eval(runnableWithDecode);
  const record=document.getElementById('record');
  const replay=document.getElementById('replay');
  assert.equal(replay.disabled,true,'No stale playback before first attempt');
  record.click();
  await new Promise(resolve=>setTimeout(resolve,130));
  assert.match(document.getElementById('mic-level-label').textContent,/Микрофон слышит звук/);
  record.click();
  await new Promise(resolve=>setTimeout(resolve,35));
  assert.equal(observed.recorderStopped,1);
  assert.equal(observed.tracksStopped,1);
  assert.equal(replay.disabled,false,'Playback is available even though F0 was not found');
  assert.equal(observed.blobs.length,1);
  assert.match(document.getElementById('status').textContent,/Голос записан/);
  replay.click();
  await new Promise(resolve=>setTimeout(resolve,10));
  assert(observed.plays.at(-1).startsWith('blob:'),'Learner hears local recorded blob, not the reference MP3');
  assert.equal(record.disabled,false);
  document.querySelector('[data-tone="2"]').click();
  assert.equal(replay.disabled,true,'Switching tones discards previous recording');
  assert.equal(observed.revoked.length,1,'Blob URL revoked for privacy');
  w.dispatchEvent(new w.Event('pagehide'));
 }finally{dom.window.close();}
});
