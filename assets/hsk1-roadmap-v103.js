/* HSK 1 learning roadmap — additive only; current lessons, cover, game and audio are untouched.
 * Supplementary themes reuse the existing Basic Words cards and their recorded audio.
 */
(()=>{
 'use strict';
 const topics=document.getElementById('topics');
 const previous=window.openLearningTopics;
 if(!topics||typeof previous!=='function')return;
 const themes=[
  {id:'g07',icon:'👨‍👩‍👧',title:'Семья и близкие',words:'爸爸 · 妈妈 · 哥哥 · 姐姐',zh:'这是我爸爸。',py:'zhè shì wǒ bàba.',ru:'Это мой папа.'},
  {id:'g02',icon:'❓',title:'Вопросы и знакомство',words:'谁 · 什么 · 哪里 · 怎么',zh:'你住在哪里？',py:'nǐ zhù zài nǎlǐ?',ru:'Где ты живёшь?'},
  {id:'g04',icon:'🕒',title:'Сегодня, вчера, завтра',words:'今天 · 昨天 · 明天 · 现在',zh:'现在几点？',py:'xiànzài jǐ diǎn?',ru:'Который час?'},
  {id:'g05',icon:'🚶',title:'Ежедневные действия',words:'去 · 来 · 看 · 听 · 说',zh:'我喜欢喝茶。',py:'wǒ xǐhuan hē chá.',ru:'Я люблю пить чай.'},
  {id:'g06',icon:'🏯',title:'Город и места',words:'家 · 学校 · 商店 · 医院',zh:'我去学校。',py:'wǒ qù xuéxiào.',ru:'Я иду в школу.'},
  {id:'g09',icon:'🍵',title:'Еда и напитки',words:'茶 · 水 · 咖啡 · 米饭',zh:'我想喝水。',py:'wǒ xiǎng hē shuǐ.',ru:'Я хочу пить воду.'},
  {id:'g10',icon:'🧩',title:'Простая грамматика',words:'是 · 有 · 不 · 吗 · 的',zh:'你是学生吗？',py:'nǐ shì xuésheng ma?',ru:'Ты студент?'},
  {id:'g12',icon:'🔢',title:'Числа и возраст',words:'一 · 二 · 三 · 两 · 十',zh:'我二十五岁。',py:'wǒ èrshíwǔ suì.',ru:'Мне двадцать пять лет.'},
  {id:'g13',icon:'🙏',title:'Вежливые выражения',words:'请 · 谢谢 · 对不起 · 欢迎',zh:'谢谢！— 不客气！',py:'xièxie! — bú kèqi!',ru:'Спасибо! — Не за что!'},
  {id:'g11',icon:'🧭',title:'Направления и движение',words:'上 · 下 · 前 · 后 · 到',zh:'学校在哪里？',py:'xuéxiào zài nǎlǐ?',ru:'Где находится школа?'}
 ];
 const safe=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
 function render(){
  if(topics.dataset.topicKind!=='course')return;
  const originalGrid=topics.querySelector('.topic-grid');
  if(!originalGrid)return;
  topics.querySelector('.hsk1-roadmap')?.remove();
  const panel=document.createElement('section');
  panel.className='hsk1-roadmap';
  panel.setAttribute('aria-labelledby','hsk1-roadmap-heading');
  panel.innerHTML=
   '<div class="hsk1-roadmap-heading"><span class="hsk1-roadmap-kicker">🇨🇳 HSK 1 · учебный маршрут</span>'+
   '<h2 id="hsk1-roadmap-heading">Расширяем уже готовые уроки</h2>'+
   '<p>Пять полноценных уроков находятся выше. Дополнительные темы ниже используют наш действующий словарь, карточки и записи.</p></div>'+
   '<div class="hsk1-catalogue-coverage" aria-label="Состояние материалов для HSK 1">'+
   '<span><b>141 из 300</b><small>слов HSK 1 уже есть в материалах</small></span>'+
   '<span><b>159</b><small>ещё нужно подготовить</small></span></div>'+
   '<p class="hsk1-coverage-note">Это проверка наполнения курса, а не твой личный прогресс и не обещание готовности экзаменационного курса.</p>'+
   '<details class="hsk1-more-topics"><summary>Дополнительная практика по 10 темам <span aria-hidden="true">⌄</span></summary>'+
   '<div class="hsk1-path-grid">'+themes.map(t=>'<button class="hsk1-path-card" type="button" data-hsk1-topic="'+t.id+'">'+
   '<span class="hsk1-path-icon" aria-hidden="true">'+t.icon+'</span><span class="hsk1-path-info"><strong>'+safe(t.title)+'</strong>'+
   '<span class="hsk1-path-words">'+safe(t.words)+'</span>'+
   '<span class="hsk1-path-example" lang="zh-Hans">'+safe(t.zh)+'</span>'+
   '<span class="hsk1-path-pinyin">'+safe(t.py)+'</span>'+
   '<span class="hsk1-path-translation">'+safe(t.ru)+'</span></span>'+
   '<span class="hsk1-path-arrow" aria-hidden="true">›</span></button>').join('')+'</div></details>'+
   '<p class="hsk1-roadmap-disclaimer">В этих темах есть и слова выше уровня HSK 1. Они пока являются дополнительной практикой, а не новыми завершёнными уроками.</p>';
  originalGrid.insertAdjacentElement('afterend',panel);
  panel.querySelectorAll('[data-hsk1-topic]').forEach(button=>button.addEventListener('click',()=>{
   const id=button.dataset.hsk1Topic;
   window.openLearningTopics('words');
   const target=topics.querySelector('[data-clean-category="'+id+'"]');
   if(target)target.click();
  }));
 }
 window.openLearningTopics=function(kind,...args){
  const result=previous.apply(this,[kind,...args]);
  if(kind===undefined||kind==='course')render();
  return result;
 };
 window.__hsk1Roadmap={topics:themes.map(t=>({id:t.id,title:t.title}))};
})();
