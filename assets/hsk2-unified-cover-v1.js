/* Panda Go HSK2 — unified native cover (lessons 2–10).
   Exact same proportions, heading, tile grid, button and footer for every lesson.
   Artwork stays at its natural ratio. No voice or progress changes. */
(function(){
'use strict';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stepNames = ['Слова','Мини-тесты','Грамматика','Мой рассказ','Произношение','Диалог с Пандой'];
const icons=['📚','🎯','🗓️','🪪','🎙️','🗣️'];
function unifiedCover(o){
  const lesson=Math.max(2,Math.min(10,Number(o.lesson)||2));
  const count=Math.max(1,Number(o.words)||6);
  const tests=count*5;
  const steps=[2,3,4,5,6,7];
  const names=(o.tiles&&o.tiles.length===6)?o.tiles:stepNames;
  const alt=[o.title,o.hanzi,o.summary].filter(Boolean).join('. ');
  const tiles=steps.map((step,i)=>'<button type="button" data-step="'+step+'" class="pg-ref-tile" aria-label="Открыть: '+esc(names[i])+'">'+
      '<span class="pg-ref-tile-icon" aria-hidden="true">'+(i===0?'📚':i===1?'🎯':i===2?'🗓️':i===3?'🪪':i===4?'🎙️':'🗣️')+'</span>'+
      '<span class="pg-ref-tile-label">'+(i===0?count+' новых выражений':i===1?tests+' мини-тестов':esc(names[i]))+'</span></button>').join('');
  return '<section class="pg-ref-cover pg-ref-lesson-'+lesson+'" aria-label="HSK 2 · Урок '+lesson+' · '+esc(o.title)+'">'+
   '<div class="pg-ref-top"><div class="pg-ref-brandline">'+
      '<a href="./hsk2-start.html#map" class="pg-ref-back" aria-label="Назад к карте уроков">‹</a>'+
      '<img class="pg-ref-brand-panda" src="./icons/icon-192.png" alt="" width="48" height="48" decoding="async">'+
      '<div class="pg-ref-brandtext"><strong>Panda <em>Go</em></strong><span>Китайский с удовольствием</span></div></div>'+
      '<div class="pg-ref-progress" role="progressbar" aria-valuemin="0" aria-valuemax="10" aria-valuenow="'+lesson+'" aria-label="Урок '+lesson+' из 10"><i style="width:'+lesson*10+'%"></i></div></div>'+
   '<div class="pg-ref-hero">'+
     '<div class="pg-ref-hero-title"><span class="pg-ref-chapter">HSK 2 · УРОК '+lesson+'</span>'+
       '<h1>'+esc(o.title)+'</h1><strong lang="zh-Hans">'+esc(o.hanzi)+'</strong>'+
       '<span class="pg-ref-pinyin">'+esc(o.pinyin)+'</span>'+
       '<p>'+esc(o.subtitle||'Говори по-китайски вместе с Пандой!')+'</p></div>'+
     '<div class="pg-ref-art"><img src="'+esc(o.art)+'" style="object-position:center '+esc(o.focus||'50%')+'" alt="'+esc(alt)+'" fetchpriority="high" decoding="async" draggable="false"></div>'+
     '<span class="pg-ref-lantern" aria-hidden="true">🏮</span></div>'+
   '<div class="pg-ref-summary"><strong><span aria-hidden="true">📚</span> Содержание урока:</strong>'+
     '<p>'+esc(o.summary)+'</p></div>'+
   '<div class="pg-ref-tiles">'+tiles+'</div>'+
   '<div class="pg-ref-cta"><button type="button" class="pg-ref-start" data-step="2">Начать урок <span aria-hidden="true">➜</span></button></div>'+
   '<div class="pg-ref-quote"><div class="pg-ref-scroll">'+esc(o.motto||'Каждый новый язык открывает двери в другой мир.')+'</div></div>'+
   '<div class="pg-ref-landscape" aria-hidden="true"></div>'+
   '</section>';
}
window.PandaGoHSK2UnifiedCover=unifiedCover;
})();
