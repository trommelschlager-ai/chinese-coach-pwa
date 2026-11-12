/* Lesson 1 supplements: searchable dictionary of 214 radicals, full sound library, first grammar explanation. */
(()=>{'use strict';
 const all=()=>window.PANDA_HSK1_RADICALS_V295?.all||[];
 const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const state={search:'',page:0,selected:38};
 const pageSize=18;
 function results(){
  const term=state.search.trim().toLowerCase();
  const found=all().filter(x=>!term||[x.n,x.hz,x.py,x.ru,x.example].join(' ').toLowerCase().includes(term));
  const pages=Math.max(1,Math.ceil(found.length/pageSize));
  state.page=Math.max(0,Math.min(state.page,pages-1));
  const current=all().find(x=>x.n===state.selected);
  let html='<p class="pg-radical-count">Найдено '+found.length+' из 214 ключей</p><div class="pg-radical-grid">';
  for(const item of found.slice(state.page*pageSize,(state.page+1)*pageSize)){
   html+='<button type="button" class="pg-radical-tile'+(state.selected===item.n?' active':'')+
     '" data-catalog-select="'+item.n+'" aria-pressed="'+(state.selected===item.n)+'">'+
     '<span>№ '+item.n+'</span><b lang="zh-Hans">'+esc(item.hz)+'</b><small>'+esc(item.ru)+'</small></button>';
  }
  html+='</div>';
  if(found.length){
   html+='<div class="pg-radical-nav"><button type="button" data-catalog-page="-1"'+(state.page===0?' disabled':'')+' aria-label="Предыдущие ключи">←</button>'+
    '<strong>'+ (state.page+1)+' / '+pages+'</strong>'+
    '<button type="button" data-catalog-page="1"'+(state.page>=pages-1?' disabled':'')+' aria-label="Следующие ключи">→</button></div>';
  }else html+='<p class="pg-radical-count">Ничего не найдено. Попробуй иероглиф, номер или русское значение.</p>';
  if(current)html+='<div class="pg-radical-chosen"><strong lang="zh-Hans">'+esc(current.hz)+'</strong>'+
   '<div><b>Ключ № '+current.n+'</b><p>'+esc(current.ru)+(current.py?' · '+esc(current.py):'')+'</p>'+
   (current.example?'<small>Примеры: '+esc(current.example)+'</small>':'')+'</div></div>';
  return html;
 }
 function catalogMarkup(){
  return '<details class="sheet pg-all-radicals" open><summary>📚 Все 214 ключей <small>Справочник и поиск</small></summary>'+
   '<p>Это <b>словарные ключи</b> Канси — не список обязательных слов для первого урока. У части ключей форма меняется в иероглифах: 水 → 氵, 人 → 亻.</p>'+
   '<label for="pg-radical-search">Найти ключ по знаку, значению или номеру</label>'+
   '<input id="pg-radical-search" type="search" value="'+esc(state.search)+'" placeholder="女, вода, 38…" autocomplete="off">'+
   '<div id="pg-radical-results">'+results()+'</div></details>';
 }
 function grammarMarkup(){
  return '<div class="sheet pg-shi-grammar"><span class="sheet-label">ЗАЧЕМ НУЖНО 是?</span>'+
   '<strong lang="zh-Hans" class="big-hanzi">是</strong><p class="pinyin">shì · 4-й тон</p>'+
   '<p><b>是</b> связывает человека с профессией или ролью: <b>кто + 是 + кто он</b>. В этом случае значение похоже на английские <b>am, is, are</b>.</p>'+
   '<div class="pg-shi-formula"><div><strong lang="zh-Hans">我</strong><small>wǒ · я</small></div><em>+</em>'+
   '<div><strong lang="zh-Hans">是</strong><small>shì · являюсь</small></div><em>+</em>'+
   '<div><strong lang="zh-Hans">学生</strong><small>xuésheng · студент</small></div></div>'+
   '<div class="pg-shi-example"><b lang="zh-Hans">我是学生。</b><span>Wǒ shì xuésheng.</span>'+
   '<p>🇷🇺 Я студент.</p><p>🇬🇧 I am a student.</p>'+
   '<button type="button" class="audio" data-say="我是学生">▶ Послушать всю фразу</button></div>'+
   '<p class="pg-shi-note"><b>Почему не просто 我学生?</b> Здесь мы говорим, кем является человек, поэтому между 我 и 学生 ставим 是.</p>'+
   '<p class="pg-shi-note">В обычном русском «есть» не произносят: «Я студент», а не «Я есть студент». В английском с <b>I</b> говорят <b>am</b>, а не is. В китайском 是 не меняется по лицам.</p>'+
   '<p class="pg-shi-note">Не ставь 是 перед любым прилагательным: для «Я занят» китайский использует другую конструкцию. Сейчас запомни <b>我 + 是 + 学生</b>.</p></div>';
 }
 function toneSection(){
  return '<div class="sheet pg-pronunciation-embedded"><h2>🎧 Все звуки китайского</h2>'+
   '<p>Те же 13 сочетаний, 190 слоговых записей и тренировка тонов, что в отдельном разделе Panda Go. Всё доступно прямо в этом уроке.</p>'+
   '<iframe class="pg-pronunciation-frame" src="./hsk1-pronunciation.html?embedded=1" title="Тренажёр всех звуков китайского: сочетания, слоги, тоны" loading="lazy" allow="microphone"></iframe>'+
   '<a class="pg-pronunciation-inline" href="./hsk1-pronunciation.html"><span>Открыть все звуки на весь экран</span><span aria-hidden="true">›</span></a></div>';
 }
 function refresh(){
  const container=document.getElementById('pg-radical-results');
  if(container)container.innerHTML=results();
 }
 document.addEventListener('input',e=>{
  if(e.target?.id!=='pg-radical-search')return;
  state.search=String(e.target.value).slice(0,100);state.page=0;refresh();
 });
 document.addEventListener('click',e=>{
  const b=e.target?.closest?.('[data-catalog-select],[data-catalog-page]');
  if(!b)return;
  if(b.hasAttribute('data-catalog-select'))state.selected=Number(b.dataset.catalogSelect);
  else state.page+=Number(b.dataset.catalogPage)||0;
  refresh();
 });
 window.PANDA_HSK1_LESSON1_EXTRAS_V295=Object.freeze({catalogMarkup,grammarMarkup,toneSection});
})();
