/* Panda Go HSK 1 v188 — a beginner-first three-screen hanzi, radicals and strokes introduction.
   The onboarding key is separate from the existing lesson/progress keys. */
(()=>{
  'use strict';
  const params=new URLSearchParams(location.search);
  if(Number(params.get('lesson')||'1')!==1)return;
  const lesson=document.querySelector('#hsk1-app');
  if(!lesson)return;
  const INTRO_KEY='pg-hsk1-hanzi-intro-v188-done';
  const RADICALS=[
    {hanzi:'人',py:'rén',ru:'человек',hint:'2 черты',fact:'Простой иероглиф может одновременно быть ключом.'},
    {hanzi:'口',py:'kǒu',ru:'рот',hint:'3 черты',fact:'В некоторых иероглифах этот компонент располагается слева.'},
    {hanzi:'木',py:'mù',ru:'дерево',hint:'4 черты',fact:'Два 木 образуют 林 — «роща». Этот знак пока не нужно запоминать.'}
  ];
  let page=0,radical=0,stroke=0,root=null,returnFocus=null;
  const esc=t=>String(t).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const allRadicals=RADICALS.map((x,i)=>`<button type="button" class="pg-intro-radical${radical===i?' active':''}" data-intro-radical="${i}" aria-pressed="${radical===i}"><strong lang="zh-Hans">${x.hanzi}</strong><span>${x.ru}</span></button>`).join('');
  const screens=[
    ()=>`<div class="pg-intro-eyebrow">Шаг 1 · Основы китайского письма</div>
      <h1>Что такое иероглиф?</h1>
      <p class="pg-intro-lead">Иероглиф — письменный знак. Он состоит из <b>черт</b>, а многие знаки включают <b>компоненты</b>.</p>
      <div class="pg-intro-hero pg-intro-hero-first">
        <div class="pg-intro-hanzi-glow" lang="zh-Hans">木</div>
        <div class="pg-intro-tag">Один знак · несколько черт</div>
        <div class="pg-intro-word">木 <span>— дерево</span></div>
      </div>
      <div class="pg-intro-difference">
        <div><span class="pg-intro-mini-icon">✎</span><b>Черта</b><small>Одно движение при письме</small></div>
        <div><span class="pg-intro-mini-icon">▣</span><b>Компонент</b><small>Часть составного знака</small></div>
        <div><span class="pg-intro-mini-icon">钥</span><b>Ключ</b><small>Способ найти знак в словаре</small></div>
      </div>
      <p class="pg-intro-footnote">Ключ — это выбранный для словаря компонент. Не любой компонент является ключом данного знака.</p>`,
    ()=>`<div class="pg-intro-eyebrow">Шаг 2 · Первые три ключа</div>
      <h1>Познакомься с ключами</h1>
      <p class="pg-intro-lead">Начнём всего с трёх простых знаков. Нажми на каждый.</p>
      <div class="pg-intro-radicals">${allRadicals()}</div>
      <div class="pg-intro-radical-detail" aria-live="polite">
        <strong class="pg-intro-detail-character" lang="zh-Hans">${RADICALS[radical].hanzi}</strong>
        <span class="pg-intro-detail-pinyin">${RADICALS[radical].py}</span>
        <span class="pg-intro-detail-meaning">${RADICALS[radical].ru} · ${RADICALS[radical].hint}</span>
        <p>${RADICALS[radical].fact}</p>
      </div>
      <div class="pg-intro-example"><span>Пример строения</span><strong lang="zh-Hans">木 + 木 = 林</strong><small>«Роща». Сейчас важно увидеть принцип, а не запоминать новый знак.</small></div>`,
    ()=>`<div class="pg-intro-eyebrow">Шаг 3 · Порядок черт</div>
      <h1>Как пишут иероглиф?</h1>
      <p class="pg-intro-lead">У знака 人 («человек») всего две черты. Нажимай на номера по порядку.</p>
      <div class="pg-intro-stroke-scene">
        <svg viewBox="0 0 240 200" role="img" aria-label="Порядок черт 人: первая черта наклонена влево вниз, вторая — вправо вниз">
          <path d="M115 48 Q104 107 46 169" class="pg-intro-stroke ${stroke===0?'selected':''}" fill="none" stroke-linecap="round" stroke-width="17"/>
          <path d="M111 65 Q138 128 194 171" class="pg-intro-stroke ${stroke===1?'selected':''}" fill="none" stroke-linecap="round" stroke-width="17"/>
          <circle cx="115" cy="48" r="15" class="pg-intro-stroke-number"/><text x="115" y="53" text-anchor="middle" class="pg-intro-stroke-num-text">1</text>
          <circle cx="111" cy="65" r="15" class="pg-intro-stroke-number"/><text x="111" y="70" text-anchor="middle" class="pg-intro-stroke-num-text">2</text>
        </svg>
        <div class="pg-intro-stroke-explain"><strong>${stroke===0?'1. Слева вниз':'2. Справа вниз'}</strong><span>${stroke===0?'Начни сверху и проведи черту вниз влево.':'От верхней части проведи вторую черту вниз вправо.'}</span></div>
      </div>
      <div class="pg-intro-stroke-actions"><button type="button" data-intro-stroke="0" aria-pressed="${stroke===0}">1-я черта</button><button type="button" data-intro-stroke="1" aria-pressed="${stroke===1}">2-я черта</button></div>
      <p class="pg-intro-footnote">Пока не нужно писать на скорость. Сначала научись узнавать знак и направление черт.</p>`
  ];
  function draw(){
    if(!root)return;
    root.querySelector('[data-intro-screen]').innerHTML=screens[page]();
    root.querySelector('[data-intro-counter]').textContent=`${page+1} / 3`;
    root.querySelector('[data-intro-progress]').style.width=((page+1)/3*100)+'%';
    root.querySelector('[data-intro-back]').hidden=page===0;
    root.querySelector('[data-intro-next]').textContent=page===2?'Перейти к словам →':'Дальше →';
    const focus=root.querySelector('h1');if(focus){focus.setAttribute('tabindex','-1');focus.focus({preventScroll:true})}
  }
  function close(){
    if(!root)return;
    root.remove();root=null;
    document.body.classList.remove('pg-intro-active');
    try{localStorage.setItem(INTRO_KEY,'1')}catch{}
    if(returnFocus&&returnFocus.isConnected)returnFocus.focus({preventScroll:true});
  }
  function open(){
    if(root)return;
    returnFocus=document.activeElement;
    page=0;radical=0;stroke=0;
    root=document.createElement('section');
    root.className='pg-intro-overlay';
    root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Знакомство с иероглифами');
    root.innerHTML=`<div class="pg-intro-frame"><div class="pg-intro-header"><span class="pg-intro-brand"><span aria-hidden="true">🐼</span> Panda Go</span><span data-intro-counter>1 / 3</span></div><div class="pg-intro-progress"><i data-intro-progress></i></div><div class="pg-intro-content" data-intro-screen></div><div class="pg-intro-footer"><button type="button" class="pg-intro-back" data-intro-back hidden>← Назад</button><button type="button" class="pg-intro-next" data-intro-next>Дальше →</button></div></div>`;
    document.body.appendChild(root);
    document.body.classList.add('pg-intro-active');
    root.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.hasAttribute('data-intro-radical')){radical=Number(b.dataset.introRadical);draw();return}
      if(b.hasAttribute('data-intro-stroke')){stroke=Number(b.dataset.introStroke);draw();return}
      if(b.hasAttribute('data-intro-back')){page=Math.max(0,page-1);draw();return}
      if(b.hasAttribute('data-intro-next')){if(page===2)close();else{page++;draw()}return}
    });
    root.addEventListener('keydown',e=>{if(e.key==='Escape')e.preventDefault();});
    draw();
  }
  const header=document.querySelector('.lesson-header');
  if(header){
    const button=document.createElement('button');
    button.className='pg-intro-reopen';button.type='button';button.title='Повторить основы иероглифов';
    button.setAttribute('aria-label','Повторить основы иероглифов');button.textContent='✎';
    button.addEventListener('click',open);header.appendChild(button);
  }
  let completed=false;try{completed=localStorage.getItem(INTRO_KEY)==='1'}catch{}
  if(!completed)open();
})();