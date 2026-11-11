import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

test('Panda practice handles live DOM interactions, fixes answers and switches to Q&A',async()=>{
 const markup=readFileSync(new URL('../panda-lesson1.html',import.meta.url),'utf8');
 const dom=new JSDOM(markup,{url:'https://example.test/panda-lesson1.html',pretendToBeVisual:true});
 globalThis.window=dom.window;
 globalThis.document=dom.window.document;
 globalThis.Audio=class{constructor(src){this.src=src}pause(){}play(){return Promise.resolve()}};
 dom.window.PandaOwnerAudio={lookup:key=>['你好','我','是','学生'].includes(key)?'./assets/owner-clean-v237/'+key+'.mp3':null};
 const d=dom.window.document;
 try{
  await import('../assets/panda-lesson1-ui.mjs');
  const get=id=>d.getElementById(id);
  const chat=()=>get('chat').textContent;
  assert.equal(d.querySelectorAll('[data-topic]').length,5);
  assert(chat().includes('你好！'));
  assert(get('question-count').textContent.includes('из 2'));
  get('answer').value='你好';
  get('chat-form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  assert(chat().includes('Верно'));
  assert(chat().includes('Я студент'));
  get('answer').value='学生';
  get('chat-form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  assert(chat().includes('Пока неправильно'));
  get('answer').value='我是学生';
  get('chat-form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  assert(chat().includes('Тренировка завершена'));
  get('mode-ask').click();
  get('answer').value='Почему 你好 меняет тон?';
  get('chat-form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  assert(chat().includes('ní hǎo'));
  d.querySelector('[data-topic="listening"]').click(); // topic can be chosen in either mode.
  get('mode-practice').click();
  assert(get('question-count').textContent.includes('из 3'));
  assert(!get('listen-block').classList.contains('hidden'));
  assert(!get('listen').disabled);
  get('listen').click();
  get('answer').value='我';
  get('chat-form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  assert(chat().includes('Верно'));
 }finally{
  dom.window.close();delete globalThis.window;delete globalThis.document;delete globalThis.Audio;
 }
});
