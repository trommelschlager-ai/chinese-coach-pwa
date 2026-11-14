/* Panda AI v337 — faithful, interactive overlay on the approved illustration.
   Does not edit the panda's face, the landscape, human MP3s, or the dialogue engine. */
import {lookupPandaVoiceClip} from './panda-live-audio.mjs?v=336';
const bridge=window.PandaApprovedBridge337;
if(!bridge){console.warn('Panda approved UI: engine bridge missing; keeping working original screen');}
else{
 const stage=document.createElement('section');stage.id='pg-approved-v337';stage.setAttribute('aria-label','Panda AI — разговорная практика');stage.dataset.showPy='true';stage.dataset.showRu='true';stage.dataset.listening='false';stage.dataset.speaking='false';
 stage.innerHTML=`
  <img class="v337-art" src="./assets/panda-live-approved-v337.webp?v=337" alt="" aria-hidden="true" decoding="async" draggable="false">
  <div class="v337-sakura-sway" aria-hidden="true"></div><div class="v337-petals" aria-hidden="true"></div><div class="v337-wave" aria-hidden="true"></div>
  <a class="v337-hit v337-back" href="./panda-lesson1.html" aria-label="Назад к уроку"></a>
  <button class="v337-hit v337-mode-short" type="button" aria-label="Краткие диалоги"></button>
  <button class="v337-hit v337-mode-nonstop" type="button" aria-label="Non-Stop диалоги"></button>
  <button class="v337-hit v337-history" type="button" aria-label="История диалога"></button>
  <button class="v337-hit v337-questions" type="button" aria-label="Вопросы к Панде"></button>
  <button class="v337-toggle v337-py-toggle" type="button" aria-label="Показать или скрыть пиньинь" aria-pressed="true">汉 Пиньинь</button>
  <button class="v337-toggle v337-ru-toggle" type="button" aria-label="Показать или скрыть русский перевод" aria-pressed="true">RU</button>
  <div class="v337-chat" aria-label="Последние три реплики диалога" aria-live="polite"></div>
  <div class="v337-speech" aria-live="polite" aria-label="Текущая реплика Панды">
   <strong class="v337-main-zh">你好！</strong><span class="v337-main-py v337-py">Nǐ hǎo!</span><span class="v337-main-ru">Привет!</span>
   <div class="v337-main-tools"><button type="button" id="v337-hear" aria-label="Слушать фразу Панды">🔊</button><button type="button" id="v337-speed" aria-label="Скорость прослушивания">1× ▾</button><button type="button" id="v337-play" aria-label="Произнести снова">▶</button></div>
   <button type="button" class="v337-repeat" aria-label="Повторить фразу Панды">↻ Повтори</button>
  </div>
  <div class="v337-live-badge" role="status" aria-live="polite">Готова слушать</div>
  <div class="v337-feedback" aria-live="polite"><span class="v337-subtle">Напиши или произнеси ответ — Панда поможет его разобрать.</span></div>
  <button type="button" class="v337-topics" aria-label="Все темы — открыть список изученных уроков" aria-expanded="false" aria-controls="v337-topics-pop"></button>
  <div class="v337-topics-pop" id="v337-topics-pop" hidden>
   <div class="v337-popup-head"><span>▱ Все темы HSK 1</span><button class="v337-close" type="button" aria-label="Закрыть темы">×</button></div>
   <div class="v337-topic-grid" role="group" aria-label="Темы по семи урокам HSK 1"></div>
  </div>
  <form class="v337-input-form" aria-label="Отправить сообщение Панде"><input class="v337-input" type="text" maxlength="160" autocomplete="off" enterkeyhint="send" aria-label="Напиши по-китайски" placeholder="Напиши по-китайски…"></form>
  <button type="button" class="v337-hit v337-send" aria-label="Отправить сообщение"></button>
  <button type="button" class="v337-hit v337-mic" aria-label="Ответить голосом" aria-pressed="false"></button>
  <a class="v337-hit v337-bottom-link" style="left:2%;width:19%" href="./index.html#panda/home" aria-label="Главная"></a>
  <a class="v337-hit v337-bottom-link" style="left:22%;width:19%" href="./hsk1-map.html" aria-label="Уроки"></a>
  <a class="v337-hit v337-bottom-link" style="left:43%;width:18%" href="./index.html#panda/training" aria-label="Тренажёр"></a>
  <a class="v337-hit v337-bottom-link" style="left:62%;width:19%" href="./panda-voice-pilot.html" aria-label="Panda AI"></a>
  <a class="v337-hit v337-bottom-link" style="left:81%;width:18%" href="./index.html#panda/settings" aria-label="Профиль"></a>`;
 document.body.append(stage);document.body.classList.add('v337-ready');
 const $=q=>stage.querySelector(q);
 const PY=$('.v337-py-toggle'),RU=$('.v337-ru-toggle'),IN=$('.v337-input'),feedback=$('.v337-feedback'),pop=$('.v337-topics-pop'),grid=$('.v337-topic-grid');
 let showPy=true,showRu=true,lastFingerprint='',lastRows='',lastFeedback='',historyAudio=null;
 const topics=[['👋','Знакомство'],['👥','Местоимения'],['🔢','Числа'],['📅','Дни недели'],['🗓','Месяцы и даты'],['🏡','Моя семья'],['🌤','Погода']];
 function stopHistory(){if(historyAudio){historyAudio.pause();historyAudio=null;}}
 function clipFor(line){if(!line)return null;return lookupPandaVoiceClip(line.hanzi||line.panda)||lookupPandaVoiceClip(line.audioKey)}
 function playLine(line){const p=clipFor(line);if(!p){bridge.note('🔇 Для этой точной фразы нет проверенного MP3.');return}stopHistory();bridge.stopPlayback();const a=new Audio(new URL(p.src,document.baseURI).href);historyAudio=a;a.playbackRate=bridge.snapshot().slow?.8:1;const start=Number(p.start)||0;const end=Number.isFinite(p.end)?Number(p.end):null;a.onloadedmetadata=()=>{if(historyAudio===a){try{a.currentTime=start}catch{}}};a.ontimeupdate=()=>{if(historyAudio===a&&end!==null&&a.currentTime>=end-.025)stopHistory()};a.onended=()=>{if(historyAudio===a)historyAudio=null};a.onerror=()=>{if(historyAudio===a){stopHistory();bridge.note('Файл озвучки не загрузился.')}};a.play().catch(()=>{if(historyAudio===a){stopHistory();bridge.note('Для воспроизведения нажми динамик снова.')}})}
 const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e};
 function renderRows(rows){const root=$('.v337-chat');root.replaceChildren();const subset=rows.slice(-3);for(let i=0;i<3;i++){
   const entry=subset[i];const row=el('article','v337-row');if(!entry){const a=el('span','v337-avatar','🐼'),z=el('span','v337-zh','Панда ждёт ответа'),py=el('small','v337-py',''),ru=el('span','v337-ru','Начни разговор'),sound=el('button','v337-play-row','◌');sound.disabled=true;row.append(a,z,ru,sound);root.append(row);continue}
   const avatar=el('span','v337-avatar',entry.who==='you'?'👤':'🐼');const left=el('div','v337-left');left.append(el('strong','v337-zh',entry.hanzi||''),el('span','v337-py',entry.pinyin||''));const right=el('span','v337-ru',entry.ru||entry.analysis?.probable||'Перевод не подтверждён');const sound=el('button','v337-play-row','🔊');sound.type='button';const playable=!!clipFor(entry);sound.disabled=!playable;sound.title=playable?'Прослушать реплику':'Для этой реплики нет MP3';sound.setAttribute('aria-label',sound.title);if(playable)sound.addEventListener('click',()=>playLine(entry));row.append(avatar,left,right,sound);root.append(row)
 }}
 function feedbackText(s){const entry=s.history.slice().reverse().find(e=>e.who==='you');if(!entry)return ['Напиши или произнеси ответ — Панда поможет его разобрать.',''];const c=entry.analysis?.correction;
   if(c){return ['Ты сказал: '+entry.hanzi,'Правильно: '+c.hanzi+(c.pinyin?' · '+c.pinyin:'')+' — '+(c.ru||'')+' '+(c.why||'')]}
   if(s.feedback){return ['Ты сказал: '+entry.hanzi,s.feedback]}
   const t=entry.ru||entry.analysis?.probable;
   return ['Ты сказал: '+entry.hanzi,t?'Смысл: '+t+'.':'Смысл пока не подтверждён. Уточни фразу.'];
 }
 function renderFeedback(s){const [a,b]=feedbackText(s);const key=a+'|'+b+'|'+s.status;if(key===lastFeedback)return;lastFeedback=key;feedback.replaceChildren();feedback.append(el('strong','',a));if(b)feedback.append(el('p','v337-subtle',b));if(s.status&&!s.status.startsWith('Урок ')&&!s.status.startsWith('Ответ по смыслу подходит'))feedback.append(el('p','v337-subtle',s.status));}
 function renderTopics(s){const key=s.allowed.join(',')+':'+s.topic;if(key===lastRows)return;lastRows=key;grid.replaceChildren();topics.forEach(([icon,title],i)=>{const id=i+1;const b=el('button','',icon+' '+title);const allowed=s.allowed.includes(id);b.type='button';b.disabled=!allowed;b.setAttribute('aria-current',String(s.topic===id));if(!allowed)b.title='Сначала пройди урок '+id;b.addEventListener('click',()=>{if(bridge.chooseTopic(id)){closeTopics();sync()}});grid.append(b)})}
 function sync(){const s=bridge.snapshot();stage.dataset.listening=String(s.active);stage.dataset.speaking=String(s.pose==='talking');$('.v337-mic').setAttribute('aria-pressed',String(s.active));$('.v337-live-badge').textContent=s.active?'🎙 Слушаю…':s.pose==='talking'?'🔊 Панда говорит':s.status?.includes('🔇')?'🔇 Нет записи':'Готова слушать';
  const a=s.current||{};const key=[a.hanzi,a.panda,a.pinyin,a.ru,s.slow,s.audioAvailable].join('|');if(key!==lastFingerprint){lastFingerprint=key;$('.v337-main-zh').textContent=a.hanzi||a.panda||'你好！';$('.v337-main-py').textContent=a.pinyin||'';$('.v337-main-ru').textContent=a.ru||'';$('#v337-hear').disabled=!s.audioAvailable;$('#v337-play').disabled=!s.audioAvailable}
  $('#v337-speed').textContent=s.slow?'0,8× ▾':'1× ▾';const entries=s.history.slice(-3);const rows=JSON.stringify(entries.map(e=>[e.who,e.hanzi,e.pinyin,e.ru]));if(rows!==stage.dataset.rows){stage.dataset.rows=rows;renderRows(entries)}renderFeedback(s);renderTopics(s);
  stage.querySelector('.v337-mode-short').setAttribute('aria-pressed',String(s.mode==='short'));stage.querySelector('.v337-mode-nonstop').setAttribute('aria-pressed',String(s.mode==='nonstop'));
  const back=stage.querySelector('.v337-back');const real=document.getElementById('back-link');if(real&&back.getAttribute('href')!==real.getAttribute('href'))back.setAttribute('href',real.getAttribute('href'));
 }
 function closeTopics(){pop.hidden=true;$('.v337-topics').setAttribute('aria-expanded','false')}
 function toggleTopics(){pop.hidden=!pop.hidden;$('.v337-topics').setAttribute('aria-expanded',String(!pop.hidden));if(!pop.hidden){renderTopics(bridge.snapshot());$('.v337-close').focus()}}
 function send(){const value=IN.value.trim();if(!value){IN.focus();return}stopHistory();IN.value='';bridge.send(value);sync()}
 function toggleVisual(flag){if(flag==='py'){showPy=!showPy;stage.dataset.showPy=String(showPy);PY.setAttribute('aria-pressed',String(showPy))}else{showRu=!showRu;stage.dataset.showRu=String(showRu);RU.setAttribute('aria-pressed',String(showRu))}}
 $('.v337-mode-short').addEventListener('click',()=>{stopHistory();bridge.setMode('short');sync()});$('.v337-mode-nonstop').addEventListener('click',()=>{stopHistory();bridge.setMode('nonstop');sync()});$('.v337-history').addEventListener('click',()=>{stopHistory();document.getElementById('history-open')?.click()});$('.v337-questions').addEventListener('click',()=>document.getElementById('ask-panda-open')?.click());PY.addEventListener('click',()=>toggleVisual('py'));RU.addEventListener('click',()=>toggleVisual('ru'));
 $('#v337-hear').addEventListener('click',()=>{stopHistory();bridge.play();sync()});$('#v337-play').addEventListener('click',()=>{stopHistory();bridge.play();sync()});$('.v337-repeat').addEventListener('click',()=>{stopHistory();bridge.play();sync()});$('#v337-speed').addEventListener('click',()=>{bridge.toggleSpeed();sync()});$('.v337-topics').addEventListener('click',toggleTopics);$('.v337-close').addEventListener('click',closeTopics);
 $('.v337-input-form').addEventListener('submit',e=>{e.preventDefault();send()});$('.v337-send').addEventListener('click',send);$('.v337-mic').addEventListener('click',()=>{stopHistory();bridge.mic();sync()});
 stage.addEventListener('keydown',e=>{if(e.key==='Escape')closeTopics()});
 const petals=$('.v337-petals');for(let i=0;i<13;i++){const p=el('span','v337-petal');p.style.setProperty('--petal-left',(1+(i*29)%17)+'%');p.style.setProperty('--petal-top',(16+(i*13)%52)+'%');p.style.setProperty('--petal-size',(5+i%4*2)+'px');p.style.setProperty('--petal-angle',(i*41%180)+'deg');p.style.setProperty('--petal-time',(6+i%5)+'s');p.style.setProperty('--petal-delay',(-i*.6)+'s');petals.append(p)}
 const old=document.querySelector('main');if(old){const observer=new MutationObserver(()=>{if(!document.hidden)requestAnimationFrame(sync)});observer.observe(old,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-state','aria-pressed','disabled']});}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopHistory();else sync()});window.addEventListener('pagehide',stopHistory);
 stage.addEventListener('click',e=>{if(!pop.hidden&&!e.target.closest('.v337-topics-pop,.v337-topics'))closeTopics()});sync();
}
