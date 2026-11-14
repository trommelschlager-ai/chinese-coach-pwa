import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
test('mobile view preserves latest messages, topic focus and keyboard space',async()=>{
 const dom=new JSDOM('<main></main><select id="lesson-select"></select>',{url:'https://example.test/panda-voice-pilot.html',pretendToBeVisual:true});
 const w=dom.window;
 for(const key of ['window','document','MutationObserver'])globalThis[key]=key==='window'?w:w[key];
 globalThis.requestAnimationFrame=w.requestAnimationFrame.bind(w);
 const state={allowed:[1,2],topic:1,history:[],current:{hanzi:'你好',pinyin:'Nǐ hǎo',ru:'Привет'},mode:'short'};
 w.PandaApprovedBridge337={snapshot:()=>state,chooseTopic:()=>true};
 try{
  await import('../assets/panda-live-v346.mjs?mobile-test='+Date.now());
  const $=s=>w.document.querySelector(s);
  assert.equal($('#pg346').querySelectorAll('.pg346-panda').length,1);
  $('#pg346-topics-btn').click();assert.equal($('#pg346-topics').hidden,false);
  $('#pg346-topics-close').click();assert.equal(w.document.activeElement.id,'pg346-topics-btn');
  Object.defineProperty(w,'innerHeight',{value:825,writable:true});
  $('#pg346-input').focus();w.innerHeight=600;w.dispatchEvent(new w.Event('resize'));
  assert.equal(w.document.documentElement.dataset.keyboard,'true');
  assert.equal(w.document.documentElement.style.getPropertyValue('--screen-height'),'600px');
  $('#pg346-input').blur();w.innerHeight=825;w.dispatchEvent(new w.Event('resize'));
  assert.equal(w.document.documentElement.dataset.keyboard,'false');
  state.history=Array.from({length:6},(_,i)=>({who:'you',hanzi:String(i),ru:'тест'}));
  const rows=$('#pg346-rows');Object.defineProperty(rows,'scrollHeight',{value:180});
  $('main').textContent='updated';await new Promise(resolve=>w.requestAnimationFrame(resolve));
  assert.equal(rows.children.length,3);assert.equal(rows.firstChild.textContent.includes('3'),true);assert.equal(rows.scrollTop,180);
 }finally{w.close()}
});
