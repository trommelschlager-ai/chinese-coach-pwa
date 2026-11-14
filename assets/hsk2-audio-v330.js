/* HSK2 user recordings v331.
   Original Luvvoice file recorded 2026-11-13, B01-B10 in confirmed order.
   Time ranges end in silence; a clip never uses synthetic speech or older speaker clips.
*/
(()=>{'use strict';
const original='./assets/hsk2-user-voice/B01-B10-20261113.mp3';
const rows=[
 ['你学习中文吗',0.00,1.86],
 ['我学习中文',2.25,3.96],
 ['你忙吗',4.26,5.51],
 ['我很忙',5.90,7.10],
 ['我不忙',7.47,8.63],
 ['中文',9.03,10.05],
 ['学习',10.43,11.58],
 ['忙',11.97,12.70],
 ['你为什么学习中文',13.06,15.19],
 ['因为我喜欢中文',15.55,17.93]
];
const normalize=s=>String(s||'').replace(/[。？！!?，,\s]/g,'');
const segments=new Map(rows.map(([zh,start,end])=>[normalize(zh),{url:original,start,end,source:'user-lv-20261113-B01-B10'}]));
let active=null;
function stop(){
 const a=active;if(!a)return;
 active=null;a.pause();a.ontimeupdate=null;a.onended=null;a.onerror=null;
}
function lookup(phrase){
 const clip=segments.get(normalize(phrase));
 return clip?.url||null;
}
function play(phrase,report){
 const clip=segments.get(normalize(phrase));
 if(!clip){report?.('Для «'+phrase+'» нет подтверждённого MP3 в присланных записях.');return false}
 stop();
 try{
  const a=new Audio(clip.url);active=a;
  a.preload='auto';a.playbackRate=0.9;
  let started=false;
  const fail=()=>{
   if(active===a){stop();report?.('Аудиозапись не воспроизвелась. Проверь загрузку MP3.')}
  };
  a.onerror=fail;
  a.onended=()=>{if(active===a){stop();report?.('Запись воспроизведена.')}}
  a.ontimeupdate=()=>{if(active===a&&a.currentTime>=clip.end){stop();report?.('Запись воспроизведена.')}};
  const start=()=>{
   if(active!==a||started)return;started=true;
   const task=a.play();
   if(task?.catch)task.catch(fail);
  };
  a.onloadedmetadata=()=>{
   if(active!==a)return;
   if(clip.start>0.05){
    a.addEventListener('seeked',start,{once:true});
    try{a.currentTime=clip.start}catch{fail()}
   }else start();
  };
  if(a.readyState>=1)a.onloadedmetadata();
  a.load?.();
  return true;
 }catch{stop();report?.('Ошибка запуска MP3.');return false}
}
const escapeHtml=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function button(phrase,showMissing=false){
 const exact=!!lookup(phrase);
 if(exact)return '<button class="hsk2-clip" data-hsk2-sound="'+escapeHtml(phrase)+'" type="button">🔊 Слушать</button>';
 if(showMissing)return '<span class="hsk2-missing-audio" title="Нет точной записи в присланных MP3">🎧 Нет отдельного MP3</span>';
 return '';
}
function bind(root=document){
 root.querySelectorAll('[data-hsk2-sound]').forEach(el=>{
  if(el.dataset.bound==='1')return;el.dataset.bound='1';
  el.addEventListener('click',()=>{
   const report=m=>{
    const status=root.querySelector('#audio-status')||root.querySelector('.pg-sound-hint')||root.querySelector('.hsk2-clip-status');
    if(status)status.textContent=m;
   };
   play(el.dataset.hsk2Sound,report);
  });
 });
}
window.PandaHsk2AudioV331=Object.freeze({lookup,play,button,bind,normalize,stop,segments:Object.freeze(rows.map(x=>x[0]))});
window.PandaHsk2AudioV330=window.PandaHsk2AudioV331;
})();
