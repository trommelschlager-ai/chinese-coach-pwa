import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {liveDOM} from './panda-live-dom-fixture.mjs';
import {PANDA_CLIPS} from '../assets/panda-voice-clips-v365.mjs';
import {lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';
test('all 155 indexed phrases use exact standalone files without runtime mute/seek',async()=>{
 const f=await liveDOM();
 try{
 f.w.eval(fs.readFileSync('assets/hsk2-user-voice/phrase-index-v332.js','utf8'));
 for(const c of PANDA_CLIPS){const part=lookupPandaVoiceClip(c.zh);assert(part);assert.equal(part.start,0);assert.equal(part.end,null);assert(fs.existsSync(part.src));
 f.w.PandaApprovedBridge337.playEntry({hanzi:c.zh});const a=f.clips.at(-1);assert.equal(a.muted,false);assert.equal(a.volume,1);assert.equal(a.currentTime,0);assert.equal(a.onseeked==null,true);}
 }finally{f.close()}
});
test('history, repeat and mic share cancellation; stale callbacks cannot stop newer audio',async()=>{
 const f=await liveDOM();try{
 const b=f.w.PandaApprovedBridge337;b.play();let old=f.clips.at(-1);const stale=old.onended;
 b.playEntry({hanzi:'你好'});const latest=f.clips.at(-1);assert.equal(latest,old,'One reusable Panda audio element');assert(old.paused);stale();assert.equal(latest.onended instanceof Function,true);latest.playing();assert.equal(b.snapshot().pose,'talking');
 b.playEntry({hanzi:'谢谢'});assert(latest.paused);assert.equal(f.clips.at(-1).muted,false);
 b.toggleSpeed();b.play();assert.equal(f.clips.at(-1).playbackRate,.8);b.toggleSpeed();b.play();assert.equal(f.clips.at(-1).playbackRate,1);
 f.el('speech-dialog').close();f.el('speech-allow').click();const a=f.clips.at(-1);assert(a.paused);b.playEntry({hanzi:'你好'});assert.equal(b.snapshot().active,false);
 b.stopPlayback();b.play();assert.equal(f.clips.at(-1).muted,false);
 }finally{f.close()}
});
test('online Range bypasses caching; offline ranges use a full cached MP3',async()=>{
 const vm=await import('node:vm');const listeners={};let online=true,writes=0;
 vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{Request,Response,Headers,URL,AbortController,setTimeout,clearTimeout,fetch:async()=>{if(!online)throw Error('offline');return new Response('network bytes',{status:206})},caches:{open:async()=>({match:async()=>new Response('0123456789',{headers:{'Content-Type':'audio/mpeg'}}),put:async()=>writes++})},self:{location:{origin:'https://panda.test'},registration:{scope:'https://panda.test/'},addEventListener:(n,f)=>listeners[n]=f}});
 const request=async range=>{let result;listeners.fetch({request:new Request('https://panda.test/assets/sample.mp3',{headers:{Range:range}}),respondWith:r=>result=r});return await result};
 assert.equal(await (await request('bytes=2-4')).text(),'network bytes');assert.equal(writes,0);online=false;
 let r=await request('bytes=2-4');assert.equal(r.status,206);assert.equal(await r.text(),'234');assert.equal(r.headers.get('Content-Range'),'bytes 2-4/10');
 assert.equal(await (await request('bytes=7-')).text(),'789');assert.equal(await (await request('bytes=-3')).text(),'789');assert.equal((await request('bytes=20-')).status,416);assert.equal(writes,0);
});

test('successful replay clears the earlier autoplay warning',async()=>{
 const f=await liveDOM();try{const b=f.w.PandaApprovedBridge337;b.note('Браузер не включил звук автоматически. Нажми динамик.');b.play();f.clips.at(-1).playing();assert.equal(b.snapshot().status,'')}finally{f.close()}
});


test('missing recording stops earlier voice rather than playing wrong Chinese sentence',async()=>{
 const f=await liveDOM();
 try{
  const bridge=f.w.PandaApprovedBridge337;
  bridge.playEntry({hanzi:'你好'});
  const first=f.clips.at(-1);first.playing();
  assert.equal(bridge.snapshot().pose,'talking');
  bridge.playEntry({hanzi:'这句话尚未录音'});
  assert.equal(first.paused,true);
  assert.equal(bridge.snapshot().pose==='talking',false);
  assert.match(bridge.snapshot().status,/нет загруженной MP3/);
 }finally{f.close()}
});

test('stalled audio stops after bounded wait and reports how to retry',async()=>{
 const f=await liveDOM();
 const original=globalThis.setTimeout;let expire;
 try{
  const bridge=f.w.PandaApprovedBridge337;
  bridge.playEntry({hanzi:'你好'});
  const audio=f.clips.at(-1);audio.playing();
  globalThis.setTimeout=(fn,ms,...args)=>ms===10000?(expire=fn,original(()=>{},700000)):original(fn,ms,...args);
  audio.onwaiting();
  assert(expire,'A stalled MP3 must have a watchdog');
  expire();
  assert(audio.paused);
  assert.match(bridge.snapshot().status,/10 секунд/);
 }finally{globalThis.setTimeout=original;f.close()}
});

test('Panda p173 auto-response uses one audio player and reports Android autoplay restrictions',async()=>{
 const f=await liveDOM(6,{completed:['family']});
 try{
  const bridge=f.w.PandaApprovedBridge337;
  assert.equal(bridge.chooseTopic(6),true,'Family topic must be available');
  const player=f.clips.at(-1);
  // Simulate Android Chrome refusing automated playback after ASR.
  player.play=()=>Promise.reject(Object.assign(new Error('user gesture required'),{name:'NotAllowedError'}));
  bridge.send('你哥哥几岁？');
  await Promise.resolve();await Promise.resolve();
  assert(bridge.snapshot().history.some(h=>h.who==='panda'&&h.hanzi==='我哥哥五岁。'));
  assert.match(player.src,/p173\.mp3$/,'The panda must use the approved exact p173 recording');
  assert.equal(bridge.snapshot().audioAvailable,true,'MP3 exists even when autoplay is blocked');
  assert.equal(bridge.snapshot().audioNeedsTap,true,'UI must show a manual playback hint');
  assert.match(bridge.snapshot().status,/Android заблокировал автозапуск/);
  const count=f.clips.length;
  player.play=()=>Promise.resolve();
  bridge.playEntry({hanzi:'我哥哥五岁。'});
  player.playing();
  assert.equal(f.clips.length,count,'Manual replay must reuse the same audio element');
  assert.equal(bridge.snapshot().audioNeedsTap,false);
  assert.equal(bridge.snapshot().pose,'talking');
  assert.equal(bridge.snapshot().audioAvailable,true);
 }finally{f.close()}
});
