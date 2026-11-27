/* Panda Go HSK2 My Day — isolated, opt-in phrase tone pilot v1. */
(()=>{'use strict';
 const workspace=document.getElementById('workspace');
 const app=document.getElementById('app');
 if(!workspace||!app||document.querySelector('.pg2-tone-pilot-dialog'))return;
 const style=document.createElement('style');
 style.textContent=[
 '#workspace .pg2-tone-pilot-link{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-height:32px;max-width:100%;border:1px solid #cb9adc;border-radius:12px;padding:5px 10px;color:#663384;background:linear-gradient(#fff9ff,#f3e4ff);font:750 12px/1.25 system-ui,sans-serif;white-space:nowrap;box-shadow:0 3px 0 #c699d6aa;cursor:pointer;touch-action:manipulation}',
 '#workspace .pg2-tone-pilot-link:active{transform:translateY(2px);box-shadow:0 1px 0 #c699d6aa}',
 '#workspace .pg2-tone-pilot-link:focus-visible{outline:3px solid #a75ed2;outline-offset:2px}',
 '#workspace .pill-title.pg2-tone-title{display:flex;align-items:center;justify-content:space-between;gap:7px}',
 '#workspace .pg2-tone-pilot-link.pg2-tone-speechlink{display:flex;width:fit-content;margin:7px auto 9px}',
 '.pg2-tone-pilot-dialog{padding:0;border:0;overflow:hidden;width:min(96vw,530px);height:min(94dvh,885px);max-width:none;max-height:none;border-radius:19px;margin:auto;background:#faf0fc;box-shadow:0 16px 45px #35174175}',
 '.pg2-tone-pilot-dialog::backdrop{background:#28153bbf}',
 '.pg2-tone-pilot-top{height:44px;display:flex;align-items:center;justify-content:space-between;gap:7px;padding:6px 10px;background:#f8e9fd;border-bottom:1px solid #e5c7ee;font:750 13px system-ui,sans-serif;color:#5c3478}',
 '.pg2-tone-pilot-exit{border:1px solid #d2b2e2;border-radius:11px;padding:6px 11px;min-height:30px;color:#5d307e;background:#fff;font:750 13px system-ui,sans-serif;cursor:pointer}',
 '.pg2-tone-pilot-dialog iframe{width:100%;height:calc(100% - 44px);display:block;border:0;background:#faf0fc}',
 '@media(max-width:370px){#workspace .pg2-tone-pilot-link{font-size:11px;padding:5px 7px}.pg2-tone-pilot-dialog{width:98vw;height:97dvh;border-radius:13px}}'
 ].join('');
 document.head.append(style);
 const dialog=document.createElement('dialog');dialog.className='pg2-tone-pilot-dialog';dialog.setAttribute('aria-label','Panda Tone — сравнение интонации');
 const top=document.createElement('div');top.className='pg2-tone-pilot-top';const title=document.createElement('strong');title.textContent='🐼 Panda Tone';
 const exit=document.createElement('button');exit.type='button';exit.className='pg2-tone-pilot-exit';exit.textContent='✕ Закрыть';
 top.append(title,exit);dialog.append(top);document.body.append(dialog);
 function close(){if(dialog.open)dialog.close();}
 exit.addEventListener('click',close);
 dialog.addEventListener('close',()=>{dialog.querySelector('iframe')?.remove();});
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
 function open(e){e.preventDefault();
  if(typeof dialog.showModal!=='function'){location.href='./panda-hsk2-tone-sentence-pilot.html';return;}
  if(dialog.open)return;
  const iframe=document.createElement('iframe');iframe.title='Panda Tone — слова и фразы урока';iframe.src='./panda-hsk2-tone-sentence-pilot.html?v=6';iframe.allow='microphone; autoplay';dialog.append(iframe);dialog.showModal();
 }
 function button(type){const b=document.createElement('button');b.type='button';b.className='pg2-tone-pilot-link'+(type==='tones'?' pg2-tone-speechlink':'');b.textContent='🎙 Panda Tone';b.setAttribute('aria-label','Открыть сравнение интонации слов и фраз, без автоматической оценки');b.setAttribute('data-pg2-tone-pilot','');b.addEventListener('click',open);return b;}
 function mount(){
  const view=app.dataset.view;
  if(view==='6'){const heading=workspace.querySelector('h1.pill-title');if(heading&&!heading.querySelector('[data-pg2-tone-pilot]')){heading.classList.add('pg2-tone-title');heading.append(button('words'));}}
 }
 const obs=new MutationObserver(mount);obs.observe(workspace,{childList:true,subtree:true});mount();
 window.addEventListener('pagehide',()=>{close();dialog.querySelector('iframe')?.remove();obs.disconnect();});
})();