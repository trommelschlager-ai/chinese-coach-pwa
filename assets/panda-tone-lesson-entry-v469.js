/* Panda Go v469 — opt-in tone training for HSK1 1–7.
 * Reuses a single same-origin iframe modal; never edits lesson state or gates.
 * In the lesson, only a 34px icon is added alongside the existing tools.
 */
(()=>{'use strict';
 const lesson=Number(document.body.dataset.pgHsk1);
 if(!Number.isInteger(lesson)||lesson<1||lesson>7)return;
 const header=document.querySelector('[data-pg-hsk1-header]');
 const tools=header?.querySelector('.pg-hsk1-tools');
 if(!tools||tools.querySelector('[data-tone-training-link]'))return;
 const css=document.createElement('style');
 css.textContent=String.raw`
 [data-pg-hsk1] .pg-tone-training-entry{display:grid;place-items:center;flex:0 0 34px;box-sizing:border-box;width:34px;height:35px;border:1px solid #cda9e2;border-radius:12px;background:linear-gradient(#fff9ff,#f1e4ff);box-shadow:0 2px 4px #b883d54a;color:#5c3183;font:22px/1 Arial,sans-serif;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent}
 [data-pg-hsk1] .pg-tone-training-entry:active{transform:translateY(2px);box-shadow:0 1px 2px #b883d54a}
 [data-pg-hsk1] .pg-tone-training-entry:focus-visible{outline:3px solid #9153cd;outline-offset:2px}
 .pg-tone-training-dialog{padding:0;border:0;overflow:hidden;width:min(96vw,500px);height:min(93dvh,860px);max-width:none;max-height:none;border-radius:19px;margin:auto;background:#f6ebfc;box-shadow:0 14px 46px #25103d70}
 .pg-tone-training-dialog::backdrop{background:#1e0e35b5}
 .pg-tone-training-head{height:49px;display:flex;align-items:center;justify-content:space-between;padding:7px 11px;background:#f6e9ff;border-bottom:1px solid #e0c5ed;color:#5c3183;font:800 14px system-ui,sans-serif}
 .pg-tone-training-close{border-radius:11px;background:white;border:1px solid #d2afe0;color:#5c3183;padding:7px 11px;min-height:34px;font:800 13px system-ui,sans-serif;cursor:pointer}
 .pg-tone-training-dialog iframe{display:block;border:0;width:100%;height:calc(100% - 49px);background:#fff9ff}
 @media(max-width:360px){.pg-tone-training-dialog{width:98vw;height:97dvh;border-radius:12px}[data-pg-hsk1] .pg-tone-training-entry{width:30px;flex-basis:30px}}
`;
 document.head.append(css);
 const entry=document.createElement('a');
 entry.className='pg-tone-training-entry';
 entry.href='./panda-tone-exercises.html?v=469';
 entry.setAttribute('data-tone-training-link','');
 entry.title='🎧 Упражнения на четыре китайских тона';
 entry.setAttribute('aria-label','Упражнения на четыре китайских тона, без оценок произношения');
 entry.textContent='🎧';
 const count=tools.querySelector('.pg-hsk1-count');
 if(count)tools.insertBefore(entry,count);else tools.append(entry);
 const dialog=document.createElement('dialog');
 dialog.className='pg-tone-training-dialog';
 dialog.setAttribute('aria-label','Упражнения по четырём китайским тонам');
 const head=document.createElement('div');head.className='pg-tone-training-head';
 const title=document.createElement('strong');title.textContent='🐼 Тоны · тренировка';
 const close=document.createElement('button');close.type='button';close.className='pg-tone-training-close';close.textContent='✕ Закрыть';
 head.append(title,close);dialog.append(head);document.body.append(dialog);
 function cleanup(){
  dialog.querySelector('iframe')?.remove();
  if(entry.isConnected)entry.focus({preventScroll:true});
 }
 dialog.addEventListener('close',cleanup);
 close.addEventListener('click',()=>{if(dialog.open)dialog.close();});
 dialog.addEventListener('click',e=>{if(e.target===dialog&&dialog.open)dialog.close();});
 entry.addEventListener('click',e=>{
  if(typeof dialog.showModal!=='function')return;
  e.preventDefault();
  if(dialog.open)return;
  const iframe=document.createElement('iframe');
  iframe.src='./panda-tone-exercises.html?v=469';
  iframe.title='Упражнения по четырём тонам: слушай, узнавай, говори';
  iframe.allow='microphone; autoplay';
  dialog.append(iframe);
  dialog.showModal();
 });
 window.addEventListener('pagehide',()=>{
  if(dialog.open)dialog.close();else dialog.querySelector('iframe')?.remove();
 });
})();
