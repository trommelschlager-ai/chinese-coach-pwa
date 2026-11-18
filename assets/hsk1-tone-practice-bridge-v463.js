/* HSK1 Lesson 1 tone practice: opt-in modal preserving lesson progress and design. */
(() => {
 'use strict';
 const content=document.getElementById('pg-content');
 if(!content)return;
 const style=document.createElement('style');
 style.textContent=[
 '.pg-tone-practice-open{display:block;width:100%;margin:12px 0 4px;min-height:48px;border:1.5px solid #d79ad9;border-radius:17px;background:linear-gradient(125deg,#fff4ff,#fce7f1);box-shadow:0 4px 13px #ae76bd3b;color:#66318c;font:850 14px system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}',
 '.pg-tone-practice-open:active{transform:translateY(2px);filter:brightness(.96)}',
 '.pg-tone-modal{position:fixed;inset:0;margin:auto;padding:0;border:0;border-radius:22px;width:min(94vw,490px);height:min(91dvh,850px);max-width:none;max-height:none;background:#f5e9ff;box-shadow:0 12px 50px #29104690;overflow:hidden}',
 '.pg-tone-modal::backdrop{background:#1e0e35a9}',
 '.pg-tone-modal-head{display:flex;align-items:center;justify-content:space-between;padding:7px 12px;background:#f6e9ff;border-bottom:1px solid #e6c7ee;gap:10px}',
 '.pg-tone-modal-head strong{font:800 14px system-ui;color:#643885}',
 '.pg-tone-close{border:1px solid #d8b5e2;border-radius:12px;background:#fff;padding:7px 13px;color:#643885;font:800 14px system-ui;cursor:pointer}',
 '.pg-tone-modal iframe{display:block;width:100%;height:calc(100% - 50px);border:0;background:#f7edff}',
 '@media(max-width:360px){.pg-tone-modal{width:97vw;height:96dvh;border-radius:14px}}'
 ].join('\n');
 document.head.append(style);
 const dialog=document.createElement('dialog');
 dialog.className='pg-tone-modal';
 dialog.setAttribute('aria-label','Тренировка четырёх тонов');
 const head=document.createElement('div');head.className='pg-tone-modal-head';
 const title=document.createElement('strong');title.textContent='🐼 Тренировка тонов';
 const close=document.createElement('button');close.type='button';close.className='pg-tone-close';close.textContent='✕ Закрыть';
 head.append(title,close);dialog.append(head);document.body.append(dialog);
 let opener=null;
 const stop=()=>{
  const frame=dialog.querySelector('iframe');
  try{frame?.contentWindow?.postMessage('panda-tone-modal-close',location.origin);}catch{}
  frame?.remove();
  if(opener?.isConnected)opener.focus();
  opener=null;
 };
 dialog.addEventListener('close',stop);
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 function open(e){
  if(!dialog.showModal){location.href='./panda-tone-ma-practice.html';return;}
  opener=e.currentTarget;
  const frame=document.createElement('iframe');
  frame.src='./panda-tone-ma-practice.html';
  frame.title='Тренировка произношения: четыре китайских тона';
  frame.allow='microphone; autoplay';
  dialog.append(frame);
  dialog.showModal();
 }
 function mount(){
  const tones=content.querySelector('.tone-list');
  if(!tones||!tones.querySelector('[data-tone-play]'))return;
  if(tones.parentElement?.querySelector('[data-panda-tone-cta]'))return;
  const button=document.createElement('button');button.type='button';button.className='pg-tone-practice-open';
  button.setAttribute('data-panda-tone-cta','');button.textContent='🎙 Тренировать четыре тона';
  button.addEventListener('click',open);
  tones.insertAdjacentElement('afterend',button);
 }
 const observer=new MutationObserver(mount);
 observer.observe(content,{childList:true,subtree:true});
 mount();
 window.addEventListener('pagehide',()=>{observer.disconnect();stop();});
})();
