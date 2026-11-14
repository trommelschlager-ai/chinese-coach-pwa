import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {liveDOM} from './panda-live-dom-fixture.mjs';
import {lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs?v=336';

test('single reference view stays connected to real conversation, history, audio, topics and microphone',async()=>{
 const ctx=await liveDOM(1,{completed:[1,2,3,4,5,6,7]});const {w,el,clips,sessions,close}=ctx;
 w.__lookup=lookupPandaVoiceClip;
 const source=fs.readFileSync(new URL('../assets/panda-ai-view.mjs',import.meta.url),'utf8').replace(/^import .*;$/gm,'');
 const settle=()=>new Promise(r=>setTimeout(r,45));
 try{
  w.eval('const lookupPandaVoiceClip=window.__lookup;'+source);
  assert.equal(w.document.querySelectorAll('#pg346').length,1);
  assert.equal(w.document.querySelector('main').getAttribute('aria-hidden'),'true');
  const bridge=w.PandaApprovedBridge337,original=bridge.snapshot;
  for(const count of [1,2,3]){
   const history=Array.from({length:count},(_,i)=>({who:i%2?'you':'panda',hanzi:'你好！',pinyin:'Nǐ hǎo!',ru:'Привет!'}));
   bridge.snapshot=()=>({...original(),history});el('status').textContent='history '+count;await settle();
   assert.equal(w.document.querySelectorAll('.pg346-row').length,count);
  }
  bridge.snapshot=original;
  el('pg346-nonstop').click();el('pg346-input').value='你好吗？';el('pg346-send').click();await settle();
  assert.equal(el('pg346-input').value,'');
  assert.equal(w.document.querySelector('.pg346-main-zh').textContent,el('phrase').textContent);
  assert.equal(el('pg346-nonstop').getAttribute('aria-pressed'),'true');
  el('pg346-py').click();assert.equal(el('pg346').dataset.py,'false');el('pg346-py').click();
  el('pg346-speed').click();assert.match(el('pg346-speed').textContent,/0,8/);
  const before=clips.length;el('pg346-hear').click();assert(clips.length>before);assert.equal(clips.at(-1).playbackRate,.8);
  el('pg346-history').click();assert(el('history-dialog').open);el('history-dialog').close();
  assert.equal(el('pg346-topics').hidden,true);el('pg346-topics-btn').click();
  const allowed=bridge.snapshot().allowed;
  assert.equal(w.document.querySelectorAll('.pg346-topic-list button').length,allowed.length);
  assert.equal(el('pg346-topics-btn').getAttribute('aria-expanded'),'true');el('pg346-topics-close').click();
  el('pg346-mic').click();assert(el('speech-dialog').open);el('speech-allow').click();assert.equal(sessions.length,1);
  sessions[0].emit('晚上好');await settle();assert.equal(w.document.querySelector('.pg346-main-zh').textContent,'晚上好！');
  const long='这是一个很长的中文句子。'.repeat(12),longRu='Длинный перевод предложения. '.repeat(15);
  bridge.snapshot=()=>({...original(),current:{hanzi:long,pinyin:'Zhè shì yí ge hěn cháng de Zhōngwén jùzi.',ru:longRu},history:[{who:'you',hanzi:long,pinyin:'Zhè shì…',ru:longRu}]});
  el('status').textContent='long';await settle();
  assert.equal(w.document.querySelector('.pg346-main-zh').textContent,long);
  assert.equal(w.document.querySelector('.pg346-ru').textContent,longRu);
 }finally{close()}
});
