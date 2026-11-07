/* Panda Go HSK1 v189. Standalone, beginner-first lesson; no old CSS or page logic. */
(()=>{
 'use strict';
 const STEPS=14;
 const PROGRESS_KEY='pg-hsk1-v189-lesson1';
 const LEGACY_KEY='pg-hsk1-v3-foundations';
 const COMPLETE_KEY='pg-hsk1-v3-complete';
 const app=document.querySelector('#app');
 if(!app)return;
 const area=document.querySelector('#pg-content'),counter=document.querySelector('#pg-counter'),progress=document.querySelector('#pg-progress'),fill=document.querySelector('#pg-progress-fill');
 const prev=document.querySelector('#pg-back'),next=document.querySelector('#pg-next'),note=document.querySelector('#pg-announcement');
 const radicals=[
  {
    "hz": "戈",
    "py": "gē",
    "ru": "алебарда",
    "count": "4 черты",
    "target": "我",
    "display": "我",
    "word": "я",
    "fact": "Это словарный ключ иероглифа 我. Значение ключа не равно значению всего знака."
  },
  {
    "hz": "日",
    "py": "rì",
    "ru": "солнце, день",
    "count": "4 черты",
    "target": "是",
    "display": "是",
    "word": "быть",
    "fact": "Это словарный ключ иероглифа 是; он расположен сверху."
  },
  {
    "hz": "子",
    "py": "zǐ",
    "ru": "ребёнок",
    "count": "3 черты",
    "target": "学",
    "display": "学生",
    "word": "студент",
    "fact": "Это ключ иероглифа 学 — первого знака слова 学生. У 生 свой отдельный ключ."
  }
];
 let step=0,radical=0,stroke=0,toneChoice=0,order=[],verified=false,audio=null,recorder=null,stream=null,recordUrl=null,recording=false,playedAtLeastOnce=false;
 try{const v=JSON.parse(localStorage.getItem(PROGRESS_KEY)||'null');if(v&&Number.isInteger(v.step))step=Math.min(STEPS-1,Math.max(0,v.step))}catch{}
 const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const intro=(n,title,sub)=>`<p class="screen-eyebrow">${esc(n)}</p><h1 class="screen-title">${esc(title)}</h1><p class="screen-sub">${sub}</p>`;
 const getClip=key=>{
  const vo=window.PANDA_HSK1_VOICES?.female||{};
  if(vo[key])return vo[key];
  const norm=String(key).replace(/[。！?!？，,\s]/g,'');
  for(const [k,v] of Object.entries(vo))if(k.replace(/[。！?!？，,\s]/g,'')===norm&&typeof v==='string')return v;
  return null;
 };
 const playBtn=(key,txt='Слушать слово')=>{
  const has=!!getClip(key);
  return `<button type="button" class="audio" data-say="${esc(key)}" ${has?'':'disabled'}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5ZM15 9c1 2 1 4 0 6m3-9c3 4 3 8 0 12"/></svg>${has?txt:'Запись недоступна'}</button><p class="audio-error" id="audio-error" role="status"></p>`;
 };
 const word=(hz,py,ru,extra='')=>`<div class="sheet soft"><span class="sheet-label">НОВОЕ СЛОВО</span><strong lang="zh-Hans" class="big-hanzi">${esc(hz)}</strong><p class="pinyin">${esc(py)}</p><div class="translation">${esc(ru)}</div>${playBtn(hz)}${extra}</div>`;
 const toneCards=()=>[
  ['妈','mā','1-й · ровный'],['麻','má','2-й · вверх'],['马','mǎ','3-й · низкий'],['骂','mà','4-й · вниз']
 ].map(([hz,py,description],i)=>{
  const source=window.courseHumanAudio?.[hz];
  return `<div class="tone-item${toneChoice===i+1?' selected':''}"><b>${py}</b><span>${description}</span><button type="button" class="tone-play" data-tone-play="${esc(hz)}" ${source?'':'disabled'} aria-label="Слушать ${esc(py)}">▶</button><button type="button" class="small-action" data-tone-pick="${i+1}" aria-pressed="${toneChoice===i+1}">Выбрать</button></div>`;
 }).join('');
 const radicalMarkup=()=>{const cur=radicals[radical];return `<div class="sheet"><span class="sheet-label">КЛЮЧИ ПЕРВЫХ СЛОВ</span><div class="radical-tabs">${radicals.map((r,i)=>`<button type="button" class="radical-tab" data-radical="${i}" aria-pressed="${radical===i}">${r.hz}<small>${r.target}${r.hz==='子'?' (学生)':''}</small></button>`).join('')}</div><div class="radical-selected"><span class="hz">${cur.hz}</span><div><div class="meaning">${cur.ru}</div><div class="read">${cur.py}</div><p class="helper">${cur.count}. ${cur.fact}</p></div></div><div class="radical-link"><span>Ключ</span><b>${cur.hz}</b><span>в иероглифе</span><b>${cur.target}</b></div><p class="radical-hint">${cur.hz==="子"?"Слово 学生 состоит из двух иероглифов; ключ 子 относится к 学.":"Ключ помогает найти знак в словаре, но не переводит его."}</p></div>`};
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
 const strokeMessages=['Посмотри четыре черты','1. Вертикальная слева','2. Верхний угол и правая сторона','3. Горизонталь посередине','4. Нижняя горизонталь'];
 const strokeButtons=['Показать 1-ю черту','Показать 2-ю черту','Показать 3-ю черту','Показать 4-ю черту','↻ Повторить'];
 const views=[
  ()=>intro('Знакомство · 1/4','Что такое иероглиф?','')+`<div class="sheet"><span class="sheet-label">ОДИН ЗНАК — НЕСКОЛЬКО ЧЕРТ</span><strong class="big-hanzi" lang="zh-Hans">我</strong><p class="translation">я</p><div class="note">Иероглиф — письменный знак. Он состоит из <b>черт</b>. Составные иероглифы могут включать <b>компоненты</b>.</div></div>`,
  ()=>intro('Знакомство · 2/4','Из чего состоит знак?','Черта — одно движение кисти. Вот четыре распространённых вида.')+`<div class="sheet"><span class="sheet-label">ЧЕТЫРЕ БАЗОВЫЕ ЧЕРТЫ</span><div class="strokes"><div class="stroke"><b>一</b><span>Горизонтальная</span></div><div class="stroke"><b>丨</b><span>Вертикальная</span></div><div class="stroke"><b>丿</b><span>Влево вниз</span></div><div class="stroke"><b>㇏</b><span>Вправо вниз</span></div></div><div class="note">Компонент — часть сложного знака. <b>Ключ</b> — компонент, по которому иероглиф относят к разделу словаря.</div></div>`,
  ()=>intro('Знакомство · 3/4','Первые три ключа','')+radicalMarkup(),
  ()=>intro('Знакомство · 4/4','Как пишется 日?','')+`<div class="sheet"><div class="writing-scene"><svg viewBox="0 0 220 210" role="img" aria-label="Четыре черты иероглифа 日"><path d="M59 37 L59 170" class="stroke-path ${stroke>=1?'visible':''} ${stroke===1?'focus':''}"/><path d="M61 37 L163 37 L163 169" class="stroke-path ${stroke>=2?'visible':''} ${stroke===2?'focus':''}"/><path d="M61 103 L161 103" class="stroke-path ${stroke>=3?'visible':''} ${stroke===3?'focus':''}"/><path d="M60 169 L163 169" class="stroke-path ${stroke>=4?'visible':''} ${stroke===4?'focus':''}"/><text x="46" y="40" font-size="15" fill="#79559a">1</text><text x="166" y="27" font-size="15" fill="#79559a">2</text><text x="101" y="96" font-size="15" fill="#79559a">3</text><text x="100" y="192" font-size="15" fill="#79559a">4</text></svg></div><div class="step-tag">${strokeMessages[stroke]}</div><div style="text-align:center"><button type="button" class="small-action" id="stroke-next">${strokeButtons[stroke]}</button></div><div class="note">日 — ключ иероглифа 是. Четыре черты: вертикаль, угол, середина, низ.</div></div>`,
  ()=>intro('Первые слова · 1/3','Слово №1','')+word('我','wǒ','я'),
  ()=>intro('Первые слова · 2/3','Слово №2','')+word('是','shì','быть, являться'),
  ()=>intro('Звуки и тоны','Четыре тона','Выбери восходящий (второй) тон.')+`<div class="sheet"><div class="tone-list">${toneCards()}</div><p class="tone-result" id="tone-result" role="status">${toneChoice===2?'✓ Верно! Второй тон поднимается.':toneChoice?'Попробуй ещё раз.':''}</p></div>`,
  ()=>intro('Первые слова · 3/3','Слово №3','')+word('学生','xuésheng','ученик, студент',`<details class="word-structure"><summary>Как устроено слово 学生?</summary><div class="word-breakdown"><span><b>学</b><small>учиться</small></span><span><b>生</b><small>рождаться; жизнь</small></span></div><p>Вместе 学生 означает «ученик, студент». Второй слог здесь обычно нейтральный.</p></details>`),
  ()=>intro('Практика · 1/2','Собери предложение','')+buildMarkup(),
  ()=>intro('Ещё одно слово','Ты — 你','')+word('你','nǐ','ты'),
  ()=>intro('Первое приветствие','你好 — привет!','')+word('你好','nǐ hǎo','привет, здравствуйте',`<div class="word-subparts">你 — ты · 好 — хороший</div><details class="word-structure"><summary>Почему произношение меняется?</summary><p>Оба иероглифа пишутся с третьим тоном. В живой речи первый обычно звучит как второй: ní hǎo. Значки пиньиня в записи остаются nǐ hǎo.</p></details>`),
  ()=>intro('Мини-диалог','Разговор из знакомых слов','')+dialogue(),
  ()=>intro('Практика · 2/2','Скажи сам','')+`<div class="sheet"><strong class="big-hanzi" style="font-size:clamp(46px,13vw,65px)">我是学生。</strong><p class="pinyin">Wǒ shì xuésheng.</p><p class="translation">Я студент.</p>${playBtn('我是学生','Слушать образец')}<div class="recorder"><button type="button" id="record-start">🎙 Записать себя</button><button type="button" id="record-stop" hidden>■ Стоп</button><button type="button" id="record-listen" hidden>▶ Мой голос</button></div><span class="sr-only" id="record-status" role="status"></span></div>`,
  ()=>intro('Урок 1 · завершён','Отлично, первые шаги сделаны!','')+`<div class="sheet"><p class="result-title">Ты уже умеешь</p><div class="learning-pairs">${radicals.map(r=>`<div class="learning-pair"><strong class="pair-key">${r.hz}</strong><small>ключ</small><span class="pair-arrow" aria-hidden="true">↓</span><b class="pair-word">${r.display}</b><small>${r.word}</small></div>`).join('')}</div><div class="rule" style="margin-top:15px"><b>我是学生。</b><div class="mini-desc">Я студент.</div></div><div class="complete-links"><button type="button" id="repeat-course">↻ Повторить урок</button><a href="./hsk1-map.html">К карте HSK 1 →</a></div></div>`
 ];
 function save(){try{localStorage.setItem(PROGRESS_KEY,JSON.stringify({step,updatedAt:Date.now()}))}catch{}}
 function markComplete(){try{const prev=JSON.parse(localStorage.getItem(LEGACY_KEY)||'{}')||{};if(!prev.completed)localStorage.setItem(LEGACY_KEY,JSON.stringify({...prev,completed:true,maxStep:6,step:6}));let ids=JSON.parse(localStorage.getItem(COMPLETE_KEY)||'[]');if(!Array.isArray(ids))ids=[];if(!ids.includes('foundations')){ids.push('foundations');localStorage.setItem(COMPLETE_KEY,JSON.stringify(ids))}}catch{}}
 function stopSound(){if(audio){try{audio.pause()}catch{}audio=null}}
 function showMessage(message){note.textContent=message;const feedback=document.querySelector('#audio-error');if(feedback)feedback.textContent=message}
 function play(src){stopSound();if(!src){showMessage('Для этой фразы пока нет аудиозаписи.');return}try{audio=new Audio(src);audio.playbackRate=1;audio.preservesPitch=true;audio.onended=()=>{audio=null};audio.onerror=()=>showMessage('Не удалось загрузить аудио. Проверь интернет.');const result=audio.play();if(result?.catch)result.catch(()=>showMessage('Нажми ещё раз для воспроизведения.'))}catch{showMessage('Не удалось воспроизвести запись.')}}
 function stopRecord(){if(recorder&&recorder.state==='recording')recorder.stop();stream?.getTracks()?.forEach(t=>t.stop());stream=null;recording=false}
 function cleanupRecord(){stopRecord();if(recordUrl){URL.revokeObjectURL(recordUrl);recordUrl=null}}
 function render(){stopSound();counter.textContent=String(step+1).padStart(2,'0')+' / '+STEPS;progress.setAttribute('aria-valuenow',String(step+1));fill.style.width=(100*(step+1)/STEPS)+'%';area.innerHTML=views[step]();area.scrollTop=0;prev.disabled=step===0;next.hidden=step===STEPS-1;next.textContent=step===STEPS-2?'Завершить урок ✓':step===3?'К первым словам →':'Дальше →';next.disabled=(step===6&&toneChoice!==2)||(step===8&&!verified);if(step===STEPS-1){markComplete();prev.textContent='← Назад'}save()}
 function advance(){if(step===6&&toneChoice!==2)return;if(step===8&&!verified)return;if(step<STEPS-1){if(step===12)cleanupRecord();step++;render()}}
 prev.addEventListener('click',()=>{if(step>0){if(step===12)cleanupRecord();step--;render()}});
 next.addEventListener('click',advance);
 area.addEventListener('click',async e=>{
  const btn=e.target.closest('button');if(!btn||btn.disabled)return;
  if(btn.hasAttribute('data-radical')){radical=Number(btn.dataset.radical);render();return}
  if(btn.id==='stroke-next'){stroke=stroke===4?0:stroke+1;render();return}
  if(btn.hasAttribute('data-say')){play(getClip(btn.dataset.say));return}
  if(btn.hasAttribute('data-tone-play')){play(window.courseHumanAudio?.[btn.dataset.tonePlay]);return}
  if(btn.hasAttribute('data-tone-pick')){toneChoice=Number(btn.dataset.tonePick);render();return}
  if(btn.hasAttribute('data-add')){const i=Number(btn.dataset.add);if(!order.includes(i)){order.push(i);verified=false;render()}return}
  if(btn.hasAttribute('data-remove')){order.splice(Number(btn.dataset.remove),1);verified=false;render();return}
  if(btn.id==='verify-answer'){if(buildAnswer()==='我是学生'){verified=true;showMessage('Правильно! Ты собрал первое предложение.')}else{verified=false;showMessage('Порядок неверный: начни со слова 我 («я»).')}render();if(!verified)showMessage('Попробуй ещё раз. Начни со слова 我.');return}
  if(btn.id==='repeat-course'){step=0;radical=0;stroke=0;toneChoice=0;order=[];verified=false;render();return}
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