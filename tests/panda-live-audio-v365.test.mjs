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
 f.w.PandaApprovedBridge337.playEntry({hanzi:c.zh});const a=f.clips.at(-1);assert.equal(a.muted,false);assert.equal(a.volume,1);assert.equal(a.currentTime,0);assert.equal(a.onseeked,undefined);}
 }finally{f.close()}
});
test('history, repeat and mic share cancellation; stale callbacks cannot stop newer audio',async()=>{
 const f=await liveDOM();try{
 const b=f.w.PandaApprovedBridge337;b.play();let old=f.clips.at(-1);const stale=old.onended;
 b.playEntry({hanzi:'你好'});const latest=f.clips.at(-1);assert(old.paused);assert.equal(old.onended,null);stale();assert.equal(latest.onended instanceof Function,true);latest.playing();assert.equal(b.snapshot().pose,'talking');
 b.playEntry({hanzi:'谢谢'});assert(latest.paused);assert.equal(f.clips.at(-1).muted,false);
 b.toggleSpeed();b.play();assert.equal(f.clips.at(-1).playbackRate,.8);b.toggleSpeed();b.play();assert.equal(f.clips.at(-1).playbackRate,1);
 f.el('speech-dialog').close();f.el('speech-allow').click();const a=f.clips.at(-1);assert(a.paused);b.playEntry({hanzi:'你好'});assert.equal(b.snapshot().active,false);
 b.stopPlayback();b.play();assert.equal(f.clips.at(-1).muted,false);
 }finally{f.close()}
});
test('service worker leaves Range media requests to the browser and never caches partial 206',async()=>{
 const vm=await import('node:vm');const listeners={};let intercepted=false;
 vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{Request,Response,URL,AbortController,setTimeout,clearTimeout,self:{location:{origin:'https://panda.test'},registration:{scope:'https://panda.test/'},addEventListener:(n,f)=>listeners[n]=f}});
 listeners.fetch({request:new Request('https://panda.test/assets/sample.mp3',{headers:{Range:'bytes=0-'}}),respondWith:()=>intercepted=true});assert.equal(intercepted,false);
});
