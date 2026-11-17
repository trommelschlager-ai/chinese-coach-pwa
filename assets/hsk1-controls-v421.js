/* Semantic control colors for HSK1 1–4; never loaded by lessons 5–7. */
(()=>{'use strict';
 const body=document.body;
 if(!['1','2','3','4'].includes(body.dataset.pgHsk1))return;
 function paint(root){
  const nodes=[...(root.matches?.('button,a')?[root]:[]),...root.querySelectorAll('button,a')];
  for(const b of nodes){
   if(b.closest('[data-pg-hsk1-header]'))continue;
   const text=b.textContent.trim(),label=b.getAttribute('aria-label')||text;
   let kind=null;
   // Vocabulary tiles remain cards: do not resize/recolor them as action buttons.
   if(b.matches('.pg13-recap button,.pg4-study,[data-time],.pg13-num-card,.pg-radical-tile,.sentence-word,.pg3-token,[data-tile],[data-tile-index]'))continue;
   if(b.matches('[data-say],[data-tone-play],[data-play],[data-audio],[data-dialogue-toggle],[data-record-play],[data-record-filter],#record-listen,.pg3-audio,.pg4-audio,.pg4-audio-icon,.tone-play,.sound-sm')||/^(?:[▶🔊🔉🎧🎵\s]*)?(?:Слушать|Прослушать|Послушать)/u.test(label))kind='audio';
   if(/Повтор|заново|Сброс|Написать|Назад/u.test(text)||b.matches('#pg-back,#pg3-prev,.pg-end-repeat,.pg-end-back,[data-trace],[data-write-practice],[data-clear-build]'))kind='secondary';
   if(b.matches('#pg-next,#pg3-next,.pg-end-next,[data-next-item],[data-finish],[data-check-tiles],[data-check-build],#verify-answer,[data-generate]')||/^(?:[✓✅\s]*)?(?:Дальше|Далее|Начать|Завершить|Следующий урок)/u.test(text))kind='primary';
   if(kind&&b.dataset.pgControl!==kind)b.dataset.pgControl=kind;
  }
 }
 paint(body);
 new MutationObserver(list=>{for(const item of list){if(item.type==='childList'){for(const n of item.addedNodes){if(n.nodeType===1)paint(n);else if(n.parentElement?.matches('button,a'))paint(n.parentElement)}}}}).observe(body,{childList:true,subtree:true});
})();
