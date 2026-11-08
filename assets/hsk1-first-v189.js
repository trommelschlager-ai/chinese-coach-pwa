/* Panda Go HSK1 v194 — contextual character study, auditory recognition and persistent progress. */
/* 好 drawing data from Hanzi Writer Data / Make Me A Hanzi (Arphic Public License).
   License in repository: assets/hanzi-data/ARPHICPL.TXT */
(()=>{
 'use strict';
 const STEPS=15;
 const PROGRESS_KEY='pg-hsk1-v189-lesson1';
 const LEGACY_KEY='pg-hsk1-v3-foundations';
 const COMPLETE_KEY='pg-hsk1-v3-complete';
 const app=document.querySelector('#app');
 if(!app)return;
 const area=document.querySelector('#pg-content'),counter=document.querySelector('#pg-counter'),progress=document.querySelector('#pg-progress'),fill=document.querySelector('#pg-progress-fill');
 const prev=document.querySelector('#pg-back'),next=document.querySelector('#pg-next'),note=document.querySelector('#pg-announcement');
 const radicals=[
  {
    "hz": "女",
    "py": "nǚ",
    "ru": "женщина",
    "count": "3 черты",
    "target": "好",
    "display": "好",
    "word": "хороший",
    "fact": "女 — левая часть и словарный ключ иероглифа 好."
  },
  {
    "hz": "子",
    "py": "zǐ",
    "ru": "ребёнок",
    "count": "3 черты",
    "target": "好",
    "display": "好",
    "word": "хороший",
    "fact": "子 — правая часть 好, но не его словарный ключ."
  }
];
 let step=0,radical=0,order=[],verified=false,listenPassed=false,listenSelected='',audio=null,recorder=null,stream=null,recordUrl=null,recording=false,playedAtLeastOnce=false;
 try{const v=JSON.parse(localStorage.getItem(PROGRESS_KEY)||'null');if(v&&Number.isInteger(v.step)){const alreadyDone=v.step===13&&v.lessonVersion!==194;step=alreadyDone?14:Math.min(STEPS-1,Math.max(0,v.step));verified=!!v.verified||v.step>8;listenPassed=!!v.listenPassed||alreadyDone}}catch{}
 const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const intro=(n,title,sub)=>`${n?`<p class="screen-eyebrow">${esc(n)}</p>`:""}<h1 class="screen-title">${esc(title)}</h1>${sub?`<p class="screen-sub">${sub}</p>`:""}`;
 const getClip=key=>{
  const vo=window.PANDA_HSK1_VOICES?.female||{};
  if(vo[key])return vo[key];
  const norm=String(key).replace(/[。！?!？，,\s]/g,'');
  for(const [k,v] of Object.entries(vo))if(k.replace(/[。！?!？，,\s]/g,'')===norm&&typeof v==='string')return v;
  return null;
 };
 const listeningWords=['我','是','学生'];
 const nativeSamples=listeningWords.filter(key=>String(getClip(key)||'').startsWith('data:audio/mpeg;base64,'));
 const validSamples=nativeSamples.length?nativeSamples:listeningWords.filter(key=>!!getClip(key));
 const listenTarget=validSamples.length?validSamples[Math.floor(Math.random()*validSamples.length)]:null;
 const listenMarkup=()=>'<div class="sheet pg-listening"><span class="sheet-label">СЛУШАЙ И УЗНАВАЙ</span>'+
  '<h2 class="result-title">Какое слово ты слышишь?</h2>'+
  (listenTarget?'<button class="audio" type="button" data-say="'+listenTarget+'">▶ Слушать</button>':
   '<p class="mini-desc">Запись недоступна. Продолжай урок.</p>')+
  '<div class="listening-choices">'+listeningWords.map(hz=>'<button type="button" class="listening-choice" data-listen-answer="'+hz+'" aria-pressed="'+(listenSelected===hz)+'">'+hz+'</button>').join('')+'</div>'+
  '<p class="inline-result" id="listen-result" role="status">'+(listenPassed?'✓ Правильно!':'')+'</p></div>';
 const playBtn=(key,txt='Слушать слово')=>{
  const has=!!getClip(key);
  return `<button type="button" class="audio" data-say="${esc(key)}" ${has?'':'disabled'}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5ZM15 9c1 2 1 4 0 6m3-9c3 4 3 8 0 12"/></svg>${has?txt:'Запись недоступна'}</button><p class="audio-error" id="audio-error" role="status"></p>`;
 };
 const word=(hz,py,ru,extra='')=>`<div class="sheet soft"><span class="sheet-label">НОВОЕ СЛОВО</span><strong lang="zh-Hans" class="big-hanzi">${esc(hz)}</strong><p class="pinyin">${esc(py)}</p><div class="translation">${esc(ru)}</div>${playBtn(hz)}${extra}</div>`;
 const toneCards=()=>[
  {hz:'妈',py:'mā',name:'1-й тон',label:'ровный',curve:'M11 16 H85 M77 8 L85 16 L77 24'},
  {hz:'麻',py:'má',name:'2-й тон',label:'восходящий',curve:'M12 43 L84 12 M73 12 L84 12 L83 24'},
  {hz:'马',py:'mǎ',name:'3-й тон',label:'вниз и вверх',curve:'M11 18 Q43 58 84 17 M72 19 L84 17 L80 29'},
  {hz:'骂',py:'mà',name:'4-й тон',label:'нисходящий',curve:'M12 12 L84 44 M75 32 L84 44 L71 44'}
 ].map((t,i)=>{
  const source=window.courseHumanAudio?.[t.hz];
  return `<div class="tone-item">
    <div class="tone-choice">
      <b>${t.py}</b>
      <svg class="tone-curve" viewBox="0 0 96 58" role="img" aria-label="${t.name}: ${t.label}"><path d="${t.curve}"/></svg>
      <span>${t.name}<small>${t.label}</small></span>
    </div>
    <button type="button" class="tone-play" data-tone-play="${esc(t.hz)}" ${source?'':'disabled'} aria-label="Слушать ${esc(t.py)}">▶ Слушать</button>
  </div>`;
 }).join('');
 const radicalMarkup=()=>{const cur=radicals[radical];return `<div class="sheet"><span class="sheet-label">ЧАСТИ ИЕРОГЛИФА 好</span><div class="radical-tabs">${radicals.map((r,i)=>`<button type="button" class="radical-tab" data-radical="${i}" aria-pressed="${radical===i}">${r.hz}<small>${r.target}${''}</small></button>`).join('')}</div><div class="radical-selected"><span class="hz">${cur.hz}</span><div><div class="meaning">${cur.ru}</div><div class="read">${cur.py}</div><p class="helper">${cur.count}. ${cur.fact}</p></div></div><div class="radical-link"><span>Часть</span><b>${cur.hz}</b><span>в иероглифе</span><b>${cur.target}</b></div><p class="radical-hint">${cur.hz==="女"?"女 — ключ 好.":"子 — второй компонент 好."}</p></div>`};
 const buildAnswer=()=>order.map(i=>['我','是','学生'][i]).join('');
 const buildMarkup=()=>{
  const choices=[['学生','xuésheng'],['我','wǒ'],['是','shì']];
  const canonical={0:'我',1:'是',2:'学生'};
  return `<div class="sheet"><span class="sheet-label">ПЕРЕВЕДИ НА КИТАЙСКИЙ</span><h2 class="result-title">Я студент</h2><div class="gold-caption">Твой ответ</div><div class="answer-space">${order.length?order.map((n,index)=>`<button type="button" class="sentence-word filled" data-remove="${index}">${canonical[n]}</button>`).join(''):'<span class="empty">Выбери слова снизу по порядку</span>'}</div><div class="gold-caption">Выбери карточки</div><div class="sentence-row">${choices.map(([hz,py])=>{const id=Object.keys(canonical).find(k=>canonical[k]===hz);return order.includes(Number(id))?'':`<button type="button" class="sentence-word" data-add="${id}">${hz}<small>${py}</small></button>`}).join('')}</div><button type="button" class="validate" id="verify-answer" ${order.length!==3?'disabled':''}>Проверить</button><p class="inline-result" id="build-result" role="status">${verified?'✓ Правильно! 我是学生。':''}</p>${verified?playBtn('我是学生','Слушать готовую фразу'):''}</div>`;
 };
 const dialogue=()=>{
  const lines=[['🐼','你好！','nǐ hǎo','Привет!'],['👩','你好！','nǐ hǎo','Привет!'],['🐼','我是学生。','wǒ shì xuésheng','Я студент.']];
  return `<div class="sheet"><span class="sheet-label">СЛУШАЙ ЗНАКОМЫЕ СЛОВА</span><div style="margin-top:12px">${lines.map(([em,hz,py,ru])=>`<div class="dialogue-line"><span class="avatar">${em}</span><div class="bubble">${hz}<small>${py} · ${ru}</small><button class="sound-sm" type="button" data-say="${hz}" ${getClip(hz)?'':'disabled'}>▶ Слушать</button></div></div>`).join('')}</div><p id="audio-error" class="audio-error" role="status"></p></div>`;
 };
 const views=[
  ()=>intro('Знакомство · 1/4','Что такое иероглиф?','')+`<div class="sheet pg-hanzi-intro"><strong class="big-hanzi" lang="zh-Hans">好</strong><p class="pinyin">hǎo</p><p class="translation">Хороший · Хорошо</p><div class="pg-intro-equation" aria-label="女 плюс 子 — компоненты иероглифа 好">
  <div class="pg-intro-part"><b lang="zh-Hans">女</b><small>женщина</small></div>
  <span class="pg-intro-op" aria-hidden="true">+</span>
  <div class="pg-intro-part"><b lang="zh-Hans">子</b><small>ребёнок</small></div>
  <span class="pg-intro-op" aria-hidden="true">=</span>
  <div class="pg-intro-part"><b lang="zh-Hans">好</b><small>хороший</small></div>
 </div><p class="pg-intro-info">Иероглиф состоит из черт и может включать несколько компонентов.</p></div>`,
  ()=>intro('Знакомство · 2/4','Из чего состоит иероглиф?','')+`<div class="sheet"><span class="sheet-label">6 базовых черт и 2 распространённые формы</span><div class="strokes"><div class="stroke"><b lang="zh-Hans">一</b><span>горизонталь</span></div><div class="stroke"><b lang="zh-Hans">丨</b><span>вертикаль</span></div><div class="stroke"><b lang="zh-Hans">丿</b><span>влево</span></div><div class="stroke"><b lang="zh-Hans">㇏</b><span>вправо</span></div><div class="stroke"><b lang="zh-Hans">丶</b><span>точка</span></div><div class="stroke"><b lang="zh-Hans">㇀</b><span>подъём</span></div><div class="stroke"><b lang="zh-Hans">㇕</b><span>сгиб</span></div><div class="stroke"><b lang="zh-Hans">亅</b><span>крюк</span></div></div><p class="stroke-footnote">Это основные примеры. Есть и другие составные разновидности черт.</p></div>`,
  ()=>intro('Знакомство · 3/4','Части иероглифа 好','')+radicalMarkup(),
  ()=>intro('Знакомство · 4/4','Как пишется 好?','')+`<div class="sheet"><div class="writing-scene"><svg class="writing-animate pg-hao-writing" viewBox="0 0 1024 1024" role="img" aria-label="Автоматическая пропись шести черт иероглифа 好"><g transform="translate(0 1024) scale(1 -1)"><path class="pg-hao-guide" d="M 330 202 Q 361 175 399 134 Q 415 119 424 118 Q 433 118 439 128 Q 446 138 442 170 Q 435 206 361 247 L 319 270 Q 292 286 258 304 Q 237 314 240 335 Q 261 393 281 453 L 293 492 Q 317 568 337 644 Q 347 690 366 715 Q 379 737 373 750 Q 360 769 313 797 Q 294 810 276 801 Q 263 794 273 778 Q 303 733 247 486 L 236 442 Q 218 373 195 336 Q 185 314 206 296 Q 254 268 294 233 L 330 202 Z" data-hao-guide="1"/><path class="pg-hao-guide" d="M 294 233 Q 287 226 281 217 Q 250 180 196 143 Q 183 134 165 124 Q 149 114 133 104 Q 120 95 131 92 Q 212 86 327 199 Q 328 200 330 202 L 361 247 Q 406 322 421 385 Q 449 488 463 510 Q 473 526 458 537 Q 416 576 387 569 Q 374 565 378 550 Q 387 531 387 507 L 385 481 Q 384 469 382 455 Q 375 376 319 270 L 294 233 Z" data-hao-guide="2"/><path class="pg-hao-guide" d="M 387 507 Q 341 501 293 492 L 247 486 Q 183 479 115 468 Q 94 465 61 471 Q 48 471 45 462 Q 41 450 49 441 Q 68 422 96 400 Q 106 396 118 402 Q 190 436 236 442 L 281 453 Q 320 463 362 474 Q 372 478 385 481 C 414 489 417 511 387 507 Z" data-hao-guide="3"/><path class="pg-hao-guide" d="M 671 521 Q 788 635 822 648 Q 843 655 835 672 Q 831 688 760 725 Q 739 735 716 725 Q 661 703 575 676 Q 553 669 498 669 Q 473 669 482 648 Q 491 635 511 623 Q 544 605 578 627 Q 597 636 691 676 Q 706 682 719 673 Q 732 664 726 649 Q 693 595 655 531 C 640 505 649 500 671 521 Z" data-hao-guide="4"/><path class="pg-hao-guide" d="M 717 430 Q 702 497 671 521 L 655 531 Q 648 535 640 538 Q 618 547 608 540 Q 595 533 608 519 Q 645 491 653 444 Q 656 434 659 421 L 668 384 Q 701 204 658 103 Q 643 76 607 83 Q 576 89 548 94 Q 536 97 542 85 Q 546 78 564 65 Q 604 31 618 5 Q 628 -14 645 -11 Q 660 -10 687 17 Q 775 107 726 391 L 717 430 Z" data-hao-guide="5"/><path class="pg-hao-guide" d="M 726 391 Q 783 397 947 397 Q 966 398 971 406 Q 977 416 960 430 Q 909 467 848 454 Q 793 445 717 430 L 659 421 Q 562 409 452 393 Q 431 392 447 375 Q 460 362 478 357 Q 497 351 514 356 Q 586 375 668 384 L 726 391 Z" data-hao-guide="6"/><path class="pg-hao-stroke pg-hao-1" data-hao-stroke="1" pathLength="100" d="M 282 788 L 307 769 L 327 733 L 264 465 L 216 321 L 235 298 L 386 194 L 411 166 L 424 133"/><path class="pg-hao-stroke pg-hao-2" data-hao-stroke="2" pathLength="100" d="M 390 556 L 417 530 L 424 516 L 422 504 L 387 361 L 338 255 L 304 207 L 260 165 L 206 127 L 137 97"/><path class="pg-hao-stroke pg-hao-3" data-hao-stroke="3" pathLength="100" d="M 59 457 L 107 434 L 373 491 L 380 501"/><path class="pg-hao-stroke pg-hao-4" data-hao-stroke="4" pathLength="100" d="M 493 656 L 517 646 L 550 644 L 680 692 L 706 699 L 743 696 L 771 669 L 765 657 L 677 546 L 674 535 L 663 536"/><path class="pg-hao-stroke pg-hao-5" data-hao-stroke="5" pathLength="100" d="M 613 530 L 637 519 L 659 499 L 674 474 L 687 432 L 711 289 L 709 166 L 692 92 L 672 59 L 648 41 L 551 85"/><path class="pg-hao-stroke pg-hao-6" data-hao-stroke="6" pathLength="100" d="M 449 384 L 504 377 L 860 427 L 906 426 L 960 412"/></g></svg></div><div class="step-tag">好 · hǎo · 6 черт</div><div style="text-align:center"><button type="button" class="small-action" id="stroke-restart">↻ Повторить</button></div></div>`,
  ()=>intro('Первые слова · 1/3','Слово №1','')+word('我','wǒ','я',`<details class="word-structure"><summary>Строение 我</summary><p>В левой части есть элемент, похожий на 手 (shǒu) — «рука». Это графическая подсказка.</p></details>`),
  ()=>intro('Первые слова · 2/3','Слово №2','')+word('是','shì','быть, являться',`<details class="word-structure"><summary>Строение 是</summary><p>Сверху — 日 (rì), «солнце, день». Это словарный ключ 是.</p></details>`),
  ()=>intro('Звуки и тоны','Четыре тона','Слушай и сравни.')+`<div class="sheet"><div class="tone-list">${toneCards()}</div></div>`,
  ()=>intro('Первые слова · 3/3','Слово №3','')+word('学生','xuésheng','ученик, студент',`<details class="word-structure"><summary>Как устроено слово 学生?</summary><div class="word-breakdown"><span><b>学</b><small>учиться</small></span><span><b>生</b><small>рождаться; жизнь</small></span></div><p>В 学 есть компонент 子 (zǐ) — «ребёнок». Вместе 学生 означает «ученик, студент». Второй слог обычно нейтральный.</p></details>`),
  ()=>intro('Практика · 1/2','Собери предложение','')+buildMarkup(),
  ()=>intro('Ещё одно слово','Ты — 你','')+word('你','nǐ','ты'),
  ()=>intro('Первое приветствие','你好 — привет!','')+word('你好','nǐ hǎo','привет, здравствуйте',`<div class="word-subparts">你 — ты · 好 — хороший</div><details class="word-structure"><summary>Почему произношение меняется?</summary><p>Оба иероглифа пишутся с третьим тоном. В живой речи первый обычно звучит как второй: ní hǎo. Значки пиньиня в записи остаются nǐ hǎo.</p></details>`),
  ()=>intro('Мини-диалог','Разговор из знакомых слов','')+dialogue(),
  ()=>intro('Практика · 2/2','Скажи сам','')+`<div class="sheet"><strong class="big-hanzi" style="font-size:clamp(46px,13vw,65px)">我是学生。</strong><p class="pinyin">Wǒ shì xuésheng.</p><p class="translation">Я студент.</p>${playBtn('我是学生','Слушать образец')}<div class="recorder"><button type="button" id="record-start">🎙 Записать себя</button><button type="button" id="record-stop" hidden>■ Стоп</button><button type="button" id="record-listen" hidden>▶ Мой голос</button></div><span class="sr-only" id="record-status" role="status"></span></div>`,
  ()=>intro('Практика · 3/3','Проверь слух','')+listenMarkup(),
  ()=>intro('','Отлично, первые шаги сделаны!','')+`<div class="sheet"><p class="result-title">Ты уже умеешь</p><div class="learning-pairs">${[['我','wǒ','я'],['是','shì','быть'],['学生','xuésheng','студент']].map(([hz,py,ru])=>`<div class="learning-pair"><b class="pair-word">${hz}</b><small>${py}</small><small>${ru}</small></div>`).join('')}</div><div class="rule" style="margin-top:15px"><b>我是学生。</b><div class="mini-desc">Я студент.</div></div><div class="complete-links"><button type="button" id="repeat-course">↻ Повторить урок</button><a href="./hsk1-map.html">К карте HSK 1 →</a></div></div>`
 ];
 function save(){try{localStorage.setItem(PROGRESS_KEY,JSON.stringify({step,verified,listenPassed,lessonVersion:194,updatedAt:Date.now()}))}catch{}}
 function markComplete(){try{const prev=JSON.parse(localStorage.getItem(LEGACY_KEY)||'{}')||{};if(!prev.completed)localStorage.setItem(LEGACY_KEY,JSON.stringify({...prev,completed:true,maxStep:6,step:6}));let ids=JSON.parse(localStorage.getItem(COMPLETE_KEY)||'[]');if(!Array.isArray(ids))ids=[];if(!ids.includes('foundations')){ids.push('foundations');localStorage.setItem(COMPLETE_KEY,JSON.stringify(ids))}}catch{}}
 function stopSound(){if(audio){try{audio.pause()}catch{}audio=null}}
 function showMessage(message){note.textContent=message;const feedback=document.querySelector('#audio-error');if(feedback)feedback.textContent=message}
 function play(src){stopSound();if(!src){showMessage('Для этой фразы пока нет аудиозаписи.');return}try{audio=new Audio(src);audio.playbackRate=1;audio.preservesPitch=true;audio.onended=()=>{audio=null};audio.onerror=()=>showMessage('Не удалось загрузить аудио. Проверь интернет.');const result=audio.play();if(result?.catch)result.catch(()=>showMessage('Нажми ещё раз для воспроизведения.'))}catch{showMessage('Не удалось воспроизвести запись.')}}
 function stopRecord(){if(recorder&&recorder.state==='recording')recorder.stop();stream?.getTracks()?.forEach(t=>t.stop());stream=null;recording=false}
 function cleanupRecord(){stopRecord();if(recordUrl){URL.revokeObjectURL(recordUrl);recordUrl=null}}
 function render(){stopSound();counter.textContent=String(step+1).padStart(2,'0')+' / '+STEPS;progress.setAttribute('aria-valuenow',String(step+1));fill.style.width=(100*(step+1)/STEPS)+'%';area.innerHTML=views[step]();area.scrollTop=0;prev.disabled=step===0;next.hidden=step===STEPS-1;next.textContent=step===STEPS-2?'Завершить урок ✓':step===3?'К первым словам →':'Дальше →';next.disabled=(step===8&&!verified)||(step===13&&!!listenTarget&&!listenPassed);if(step===STEPS-1){markComplete();prev.textContent='← Назад'}save()}
 function advance(){if(step===8&&!verified)return;if(step===13&&listenTarget&&!listenPassed)return;if(step<STEPS-1){if(step===12)cleanupRecord();step++;render()}}
 prev.addEventListener('click',()=>{if(step>0){if(step===12)cleanupRecord();step--;render()}});
 next.addEventListener('click',advance);
 area.addEventListener('click',async e=>{
  const btn=e.target.closest('button');if(!btn||btn.disabled)return;
  if(btn.hasAttribute('data-radical')){radical=Number(btn.dataset.radical);render();return}
  if(btn.id==='stroke-restart'){const svg=area.querySelector('.writing-animate');if(svg)svg.replaceWith(svg.cloneNode(true));return}
  if(btn.hasAttribute('data-say')){play(getClip(btn.dataset.say));return}
  if(btn.hasAttribute('data-tone-play')){play(window.courseHumanAudio?.[btn.dataset.tonePlay]);return}
  if(btn.hasAttribute('data-listen-answer')){listenSelected=btn.dataset.listenAnswer;if(!listenTarget){listenPassed=true;render();return}listenPassed=listenSelected===listenTarget;render();if(!listenPassed)showMessage('Послушай ещё раз.');return}
  if(btn.hasAttribute('data-add')){const i=Number(btn.dataset.add);if(!order.includes(i)){order.push(i);verified=false;render()}return}
  if(btn.hasAttribute('data-remove')){order.splice(Number(btn.dataset.remove),1);verified=false;render();return}
  if(btn.id==='verify-answer'){if(buildAnswer()==='我是学生'){verified=true;showMessage('Правильно! Ты собрал первое предложение.')}else{verified=false;showMessage('Порядок неверный: начни со слова 我 («я»).')}render();if(!verified)showMessage('Попробуй ещё раз. Начни со слова 我.');return}
  if(btn.id==='repeat-course'){step=0;radical=0;order=[];verified=false;listenPassed=false;listenSelected='';render();return}
  if(btn.id==='record-start'){
   if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){showMessage('В этом браузере запись недоступна. Повтори фразу вслух.');return}
   try{
    cleanupRecord();stream=await navigator.mediaDevices.getUserMedia({audio:true});recorder=new MediaRecorder(stream);const chunks=[];
    recorder.ondataavailable=ev=>{if(ev.data.size)chunks.push(ev.data)};
    recorder.onstop=()=>{if(!chunks.length)return;recordUrl=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType||'audio/webm'}));const p=document.querySelector('#record-listen');if(p)p.hidden=false};
    recorder.start();recording=true;btn.hidden=true;document.querySelector('#record-stop').hidden=false;document.querySelector('#record-status').textContent='Идёт запись';
   }catch{showMessage('Микрофон не разрешён. Можно просто повторить вслух.')}return
  }
  if(btn.id==='record-stop'){stopRecord();btn.hidden=true;const p=document.querySelector('#record-start');if(p){p.hidden=false;p.textContent='🎙 Записать ещё раз'}document.querySelector('#record-status').textContent='Запись готова';return}
  if(btn.id==='record-listen'){play(recordUrl);return}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stopSound();if(recording)stopRecord()}});
 window.addEventListener('pagehide',()=>{stopSound();cleanupRecord()});
 render();
})();