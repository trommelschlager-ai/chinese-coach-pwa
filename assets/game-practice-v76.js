/* v77: game practice on the main menu. Does not replace the established lessons. */
(()=>{
'use strict';
const section=document.getElementById('topics');
if(!section)return;
const KEY='chinese-coach-game-v76';
const items=[
 {id:'name',zh:'我叫小明。',py:'wǒ jiào Xiǎomíng.',ru:'Меня зовут Сяомин.',audio:'l2-05-a.mp3',parts:[['我','wǒ'],['叫','jiào'],['小明','Xiǎomíng']]},
 {id:'country',zh:'我是中国人。',py:'wǒ shì Zhōngguó rén.',ru:'Я китаец.',audio:'l3-03-a.mp3',parts:[['我','wǒ'],['是','shì'],['中国人','Zhōngguó rén']]},
 {id:'where',zh:'你住在哪里？',py:'nǐ zhù zài nǎlǐ?',ru:'Где ты живёшь?',audio:'l3-04-b.mp3',parts:[['你','nǐ'],['住','zhù'],['在','zài'],['哪里','nǎlǐ']]},
 {id:'time',zh:'现在几点？',py:'xiànzài jǐ diǎn?',ru:'Который сейчас час?',audio:'l4-03-a.mp3',parts:[['现在','xiànzài'],['几','jǐ'],['点','diǎn']]},
 {id:'tea',zh:'我想喝一杯茶。',py:'wǒ xiǎng hē yì bēi chá.',ru:'Я хочу выпить чашку чая.',audio:'l5-02-b.mp3',parts:[['我','wǒ'],['想','xiǎng'],['喝','hē'],['一','yì'],['杯','bēi'],['茶','chá']]},
 {id:'askname',zh:'你叫什么名字？',py:'nǐ jiào shénme míngzi?',ru:'Как тебя зовут?',audio:'l2-03-a.mp3',parts:[['你','nǐ'],['叫','jiào'],['什么','shénme'],['名字','míngzi']]},
 {id:'age',zh:'我二十五岁。',py:'wǒ èrshíwǔ suì.',ru:'Мне двадцать пять лет.',audio:'l4-02-b.mp3',parts:[['我','wǒ'],['二十五','èrshíwǔ'],['岁','suì']]},
 {id:'three',zh:'现在三点。',py:'xiànzài sān diǎn.',ru:'Сейчас три часа.',audio:'l4-04-b.mp3',parts:[['现在','xiànzài'],['三','sān'],['点','diǎn']]},
 {id:'fine',zh:'我很好，谢谢！',py:'wǒ hěn hǎo, xièxie!',ru:'У меня всё хорошо, спасибо!',audio:'l1-04-b.mp3',parts:[['我','wǒ'],['很','hěn'],['好','hǎo'],['谢谢','xièxie']]},
 {id:'howold',zh:'你多大？',py:'nǐ duō dà?',ru:'Сколько тебе лет?',audio:'l4-01-a.mp3',parts:[['你','nǐ'],['多','duō'],['大','dà']]}
];
const modes={
 build:{title:'Собери фразу',subtitle:'Переведи предложение',icon:'🧩'},
 choose:{title:'Выбери ответ',subtitle:'Найди правильный перевод',icon:'✅'},
 listen:{title:'Слушай и выбирай',subtitle:'Какая фраза прозвучала?',icon:'🎧'}
};
const safe=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const one=s=>section.querySelector(s);
const all=s=>[...section.querySelectorAll(s)];
const soundFile=i=>'./assets/dialogue-voices-v73/'+items[i].audio;
function readStats(){
 try{const o=JSON.parse(localStorage.getItem(KEY)||'{}');return {
  completed:Number(o.completed)||0,points:Number(o.points)||0,
  streak:Number(o.streak)||0,lastDay:typeof o.lastDay==='string'?o.lastDay:'',
  best:o.best&&typeof o.best==='object'?o.best:{}
 }}catch{return {completed:0,points:0,streak:0,lastDay:'',best:{}}}
}
function writeStats(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch{}}
const dayKey=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
function recordResult(){
 const st=readStats(),today=dayKey();
 if(st.lastDay!==today){
  const previous=new Date(st.lastDay+'T12:00:00Z');
  const current=new Date(today+'T12:00:00Z');
  const distance=(current-previous)/86400000;
  st.streak=distance===1?st.streak+1:1;
  st.lastDay=today;
 }
 st.completed++;st.points+=session.score*10;
 st.best[session.mode]=Math.max(Number(st.best[session.mode])||0,session.score);
 writeStats(st);return st;
}
let session=null,screen='hub',currentAudio=null,feedback='';
function stopAudio(){
 if(currentAudio){currentAudio.pause();currentAudio=null}
 try{window.speechSynthesis?.cancel?.()}catch{}
}
/* Recorded Mandarin MP3s take precedence; fallback synthesizer is only for missing words. */
/* Consistent Mandarin voice for selectable word tiles; dialogue recordings are unchanged. */
let selectedMandarinVoice=null;
function speakCardWord(han){
 stopAudio();
 const note=one('[data-game-audio-feedback]');
 if(!window.speechSynthesis || !window.SpeechSynthesisUtterance){
  if(note)note.textContent='Озвучка слов недоступна на этом устройстве.';
  return;
 }
 try{
  const voices=window.speechSynthesis.getVoices()||[];
  const available=voices.filter(v=>/^(zh-CN|cmn)/i.test(v.lang));
  if(!selectedMandarinVoice || !voices.some(v=>v.voiceURI===selectedMandarinVoice.voiceURI)){
   selectedMandarinVoice=available.find(v=>/xiaoxiao|xiaoxuan|yunyang|google.*chinese/i.test(v.name))
     || available[0] || voices.find(v=>/^zh/i.test(v.lang)) || null;
  }
  const speech=new SpeechSynthesisUtterance(han);
  speech.lang='zh-CN';speech.rate=0.84;speech.pitch=1;
  if(selectedMandarinVoice)speech.voice=selectedMandarinVoice;
  if(note)note.textContent='🔊 '+han;
  window.speechSynthesis.speak(speech);
 }catch{
  if(note)note.textContent='Не удалось воспроизвести слово.';
 }
}

window.addEventListener('learning-audio-stop',stopAudio);
function play(){
 if(!session)return;
 stopAudio();window.dispatchEvent(new Event('learning-audio-stop'));
 const audio=new Audio(soundFile(session.index));currentAudio=audio;
 audio.playbackRate=1;audio.preservesPitch=true;if('webkitPreservesPitch' in audio)audio.webkitPreservesPitch=true;
 const notice=one('[data-game-audio-feedback]');if(notice)notice.textContent='▶ Китайская запись';
 audio.onerror=()=>{if(currentAudio===audio){currentAudio=null;const message=one('[data-game-audio-feedback]');if(message)message.textContent='MP3 недоступен. Проверь подключение или скачай офлайн-материалы.'}};
 audio.onended=()=>{if(currentAudio===audio){currentAudio=null;const message=one('[data-game-audio-feedback]');if(message)message.textContent='Можно прослушать ещё раз.'}};
 Promise.resolve(audio.play()).catch(()=>{if(currentAudio===audio){currentAudio=null;const message=one('[data-game-audio-feedback]');if(message)message.textContent='Не удалось воспроизвести MP3.'}});
}
function shuffled(n,seed){
 const values=Array.from({length:n},(_,i)=>i);
 for(let i=n-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[values[i],values[j]]=[values[j],values[i]]}
 return values;
}
function start(mode){
 if(!modes[mode])return;
 session={mode,index:0,score:0,combo:0,bestCombo:0,errors:[],done:false,selected:[],choice:-1,locked:false,bank:[],showPinyin:false};
 screen='question';initQuestion();render();
}
function initQuestion(){
 const q=items[session.index],base=q.parts.map((p,i)=>({han:p[0],pin:p[1],target:i}));
 const extra=[['你','nǐ'],['吗','ma'],['我','wǒ'],['不','bù'],['很','hěn'],['谢谢','xièxie'],['三','sān'],['在','zài']].filter(p=>!base.some(t=>t.han===p[0]));
 const distractions=extra.slice((session.index*2)%Math.max(1,extra.length-2),((session.index*2)%Math.max(1,extra.length-2))+2)
 .map(p=>({han:p[0],pin:p[1],target:-1}));
 const arr=[...base,...distractions],order=shuffled(arr.length,197+(session.index+1)*93);
 session.bank=order.map(i=>arr[i]);session.selected=[];session.choice=-1;session.locked=false;session.showPinyin=false;feedback='';
 stopAudio();
}
function shell(inner){
 section.dataset.simpleSection='game';section.innerHTML='<div class="game-shell">'+inner+'</div>';
}
function panda(){
 return '<img class="game-panda" src="./assets/game-panda-v80.webp" alt="Панда с книжкой — талисман игры" loading="lazy">';
}
function topBar(text){
 return '<button class="game-back" type="button" data-game-back>← '+safe(text)+'</button>';
}
function menuCard(mode,sub,meta,icon){
 return '<button class="game-mode game-mode-'+mode+'" type="button" data-game-mode="'+mode+'">'+
 '<span class="game-mode-copy"><span class="game-mode-icon" aria-hidden="true">'+icon+'</span><strong>'+safe(modes[mode].title)+'</strong>'+
 '<small>'+safe(sub)+'</small><em>'+meta+'</em></span><span class="game-mode-arrow" aria-hidden="true">→</span></button>';
}
/* Faithful original artwork view. Automatically used once approved PNG is uploaded
   to /assets/game-approved-menu-v87-original.png. Does not interfere with gameplay. */
let approvedArtReady=false,approvedArtChecked=false;
function renderApprovedHub(){
 if(!approvedArtReady||screen!=='hub')return;
 const st=readStats();
 shell('<div class="approved-art-hub">'+
 '<img class="approved-art-image" src="./assets/game-approved-menu-v87-original.png" width="864" height="1536" alt="" aria-hidden="true" decoding="async">'+
 '<button type="button" class="approved-hit approved-hit-back" data-game-back aria-label="Вернуться к занятиям"></button>'+
 '<button type="button" class="approved-hit approved-hit-build" data-game-mode="build" aria-label="Собери фразу — 10 заданий"></button>'+
 '<button type="button" class="approved-hit approved-hit-choose" data-game-mode="choose" aria-label="Выбери ответ — 10 заданий"></button>'+
 '<button type="button" class="approved-hit approved-hit-listen" data-game-mode="listen" aria-label="Слушай и выбирай — 10 заданий"></button>'+
 '<button type="button" class="approved-hit approved-hit-results" data-game-results aria-label="Результаты и награды"></button>'+
 (st.streak||st.points?'<span class="approved-progress-live" aria-live="polite">🔥 '+st.streak+' '+pluralDays(st.streak)+' · ⭐ '+st.points+' очков</span>':'')+
 '</div>');
}
function checkApprovedArt(){
 if(approvedArtChecked)return;
 approvedArtChecked=true;
 const image=new Image();
 image.onload=()=>{approvedArtReady=true;if(screen==='hub')renderApprovedHub()};
 image.onerror=()=>{approvedArtReady=false};
 image.src='./assets/game-approved-menu-v87-original.png';
}
function renderHub(){
 screen='hub';session=null;stopAudio();
 if(approvedArtReady){renderApprovedHub();return}
 checkApprovedArt();
 const st=readStats();
 shell(topBar('К занятиям')+
 '<div class="game-hero"><div class="game-hero-copy"><span class="game-kicker">🎮 Новая игра</span>'+
 '<h1>Игровая<br>практика</h1><p>Учись в формате мини-игр</p></div>'+panda()+'</div>'+
 '<div class="game-streak" aria-label="Прогресс обучения"><span>🔥 Серия: <strong>'+st.streak+' '+pluralDays(st.streak)+'</strong></span>'+
 '<span>⭐ '+st.points+' очков</span></div>'+
 '<div class="game-modes">'+menuCard('build','Собери перевод из карточек','10 заданий · Лёгкий старт','🀄')+
 menuCard('choose','Найди правильный перевод','10 заданий','✅')+
 menuCard('listen','Услышь фразу и выбери вариант','10 заданий · Аудио MP3','🎧')+'</div>'+
 '<button class="game-results-link" type="button" data-game-results><span>🏆</span><span><strong>Результаты и награды</strong><small>Прогресс и лучшие результаты</small></span><b>→</b></button>');
}
function pluralDays(n){const v=n%100,k=n%10;return v>=11&&v<=14?'дней':k===1?'день':k>=2&&k<=4?'дня':'дней'}
function meter(){
 return '<div class="game-metrics"><span>Задание '+(session.index+1)+' из 10</span><span>🔥 Комбо ×'+session.combo+'</span></div>'+
 '<div class="game-meter" role="progressbar" aria-label="Выполнено заданий" aria-valuenow="'+session.index+'" aria-valuemin="0" aria-valuemax="10"><i style="width:'+(session.index*10)+'%"></i></div>';
}
function bankTile(t,i,selected){
 return '<button type="button" class="game-token'+(selected?' is-used':'')+'" data-game-token="'+i+'" '+(selected||session.locked?'disabled':'')+'><small>'+safe(t.pin)+'</small><strong lang="zh-Hans">'+safe(t.han)+'</strong></button>';
}
function buildBody(q){
 const answer=session.selected.map((i,k)=>{const t=session.bank[i];return '<button type="button" data-game-remove="'+k+'" class="game-answer-token" '+(session.locked?'disabled':'')+'><small>'+safe(t.pin)+'</small><strong lang="zh-Hans">'+safe(t.han)+'</strong></button>'}).join('');
 const blanks=Math.max(0,q.parts.length-session.selected.length);
 return '<div class="game-build-hero">'+panda()+'<div class="game-prompt"><span>Переведи предложение</span><strong>'+safe(q.ru)+'</strong></div></div>'+
 '<div class="game-answer-area" aria-label="Ваш ответ">'+answer+Array.from({length:blanks},()=>'<span class="game-blank" aria-hidden="true">+</span>').join('')+'</div>'+
 '<div class="game-bank" aria-label="Карточки для составления ответа">'+session.bank.map((t,i)=>bankTile(t,i,session.selected.includes(i))).join('')+'</div>';
}
function choiceOptions(){
 const order=shuffled(items.length,session.index*119+13);
 const others=order.filter(i=>i!==session.index).slice(0,2),choices=shuffled(3,session.index+89).map(i=>[session.index,...others][i]);
 return choices;
}
function answerOptions(mode){
 const list=session.choices||choiceOptions();session.choices=list;
 return '<div class="game-choice-list">'+list.map((id,i)=>{
  const x=items[id],selected=session.choice===i;
  return '<button type="button" class="game-choice'+(selected?' is-selected':'')+'" data-game-option="'+i+'" aria-pressed="'+selected+'" '+(session.locked?'disabled':'')+'>'+
  '<span class="game-choice-index">'+(i+1)+'</span><span class="game-choice-words">'+
  (mode==='listen'?'<strong lang="zh-Hans">'+safe(x.zh)+'</strong>'+(session.showPinyin?'<span class="game-choice-pinyin">'+safe(x.py)+'</span>':'')+'<small>'+safe(x.ru)+'</small>':
  '<strong>'+safe(x.ru)+'</strong>')+'</span><span class="game-radio" aria-hidden="true"></span></button>';
 }).join('')+'</div>';
}
/* The listening screen uses the user's original, unaltered two-screen artwork.
   CSS crops its RIGHT half; functional answer controls overlay the printed example. */
function renderApprovedListening(){
 const q=items[session.index],st=readStats(),choices=session.choices||choiceOptions();session.choices=choices;
 const rows=choices.map((id,i)=>{const x=items[id],selected=session.choice===i;
 return '<button type="button" class="original-listen-answer'+(selected?' is-selected':'')+'" data-game-option="'+i+'" aria-pressed="'+selected+'" '+(session.locked?'disabled':'')+'><b class="original-listen-num">'+(i+1)+'</b><span class="original-listen-words"><strong lang="zh-Hans">'+safe(x.zh)+'</strong>'+(session.showPinyin?'<span class="original-listen-py">'+safe(x.py)+'</span>':'')+'<small>'+safe(x.ru)+'</small></span><span class="original-listen-radio" aria-hidden="true"></span></button>'}).join('');
 shell('<div class="original-listen-screen" aria-label="Прослушай и выбери — игровая практика">'+
 '<div class="original-listen-art" aria-hidden="true"></div>'+
 '<button type="button" class="original-listen-back" data-game-back aria-label="К игровой практике">← Игровая практика</button>'+
 '<div class="original-listen-combo">🔥 Комбо ×'+session.combo+'</div>'+
 '<div class="original-listen-progress"><span>Задание '+(session.index+1)+' из 10</span><div class="original-listen-meter"><i style="width:'+((session.index+1)*10)+'%"></i></div></div>'+
 '<button type="button" class="original-listen-play" data-game-play aria-label="Прослушать китайскую фразу"><span aria-hidden="true">▶</span></button>'+
 '<div class="original-listen-audio-note" data-game-audio-feedback role="status" aria-live="polite">Можно прослушать ещё раз</div>'+
 '<div class="original-listen-answers">'+rows+'</div>'+
 '<button type="button" class="original-listen-pinyin" data-game-toggle-pinyin aria-expanded="'+session.showPinyin+'">◉ '+(session.showPinyin?'Скрыть пиньинь':'Показать пиньинь')+'</button>'+
 '<div class="original-listen-feedback" role="status" aria-live="polite">'+safe(feedback)+(session.locked?'<small>Правильный ответ: '+safe(q.zh)+' '+(session.showPinyin?safe(q.py):'')+'</small>':'')+'</div>'+
 '<button type="button" class="original-listen-check" data-game-check>'+(session.locked?(session.index===9?'Результат →':'Далее →'):'Проверить →')+'</button>'+
 '</div>');
}
function renderQuestion(){
 if(session.mode==='listen'){renderApprovedListening();return;}

 const q=items[session.index],mode=session.mode,config=modes[mode];
 const task=mode==='build'?'<h1>Переведи<br>предложение</h1>':mode==='listen'?'<h1>Прослушай<br>и выбери</h1>':'<h1>Выбери<br>перевод</h1>';
 const body=mode==='build'?buildBody(q):mode==='listen'?
 '<div class="game-listen-hero">'+panda()+'</div><div class="game-listening"><button type="button" class="game-play-big" data-game-play aria-label="Воспроизвести китайскую фразу">▶</button>'+
 '<span>Нажми, чтобы прослушать</span><button type="button" class="game-pinyin-toggle" data-game-toggle-pinyin aria-expanded="'+session.showPinyin+'">'+(session.showPinyin?'Скрыть пиньинь':'Показать пиньинь')+'</button></div>'+answerOptions(mode):
 '<div class="game-prompt"><span>Что означает эта фраза?</span><strong lang="zh-Hans">'+safe(q.zh)+'</strong><small>'+safe(q.py)+'</small>'+
 '<button type="button" class="game-prompt-audio" data-game-play>🔊 Послушать</button></div>'+answerOptions(mode);
 shell(topBar('Игровая практика')+meter()+
 '<div class="game-task-title">'+task+'<p>'+safe(config.subtitle)+'</p></div>'+
 '<div class="game-question-wrap">'+body+'</div>'+
 '<div class="game-feedback" role="status" aria-live="polite">'+safe(feedback)+(session.locked?'<div class="game-correction"><strong>Правильный ответ:</strong> <span lang="zh-Hans">'+safe(q.zh)+'</span><small>'+(mode==='listen'&&!session.showPinyin?'':safe(q.py)+' · ')+safe(q.ru)+'</small></div>':'')+'</div>'+
 '<div class="game-audio-note" data-game-audio-feedback role="status" aria-live="polite"></div>'+
 '<div class="game-actions">'+(mode==='build'?'<button type="button" class="game-secondary" data-game-clear '+(session.locked?'disabled':'')+'>Очистить</button>':'')+
 '<button type="button" class="game-primary" data-game-check>'+ (session.locked?(session.index===9?'Результат →':'Далее →'):'Проверить →')+'</button></div>');
}
function check(){
 if(session.locked){next();return}
 if(session.mode==='build'&&session.selected.length!==items[session.index].parts.length){feedback='Сначала собери фразу из карточек.';renderQuestion();return}
 if(session.mode!=='build'&&session.choice<0){feedback='Выбери один ответ.';renderQuestion();return}
 const q=items[session.index],correct=session.mode==='build'?
 session.selected.every((tokenIndex,idx)=>session.bank[tokenIndex].target===idx):
 session.choices[session.choice]===session.index;
 session.locked=true;
 if(correct){session.score++;session.combo++;session.bestCombo=Math.max(session.bestCombo,session.combo)}
 else{session.combo=0;session.errors.push(q.id)}
 feedback=correct?'✅ Верно! Отличная работа.':'✦ Ещё немного практики — и получится!';
 renderQuestion();
}
function next(){
 if(session.index===9){const stats=recordResult();session.done=true;renderResult(stats);return}
 session.index++;session.choices=null;initQuestion();renderQuestion();
}
function renderResult(stats){
 screen='result';stopAudio();
 shell(topBar('Игровая практика')+
 '<div class="game-result-header"><h1>Отлично!</h1><p>Мини-урок завершён</p>'+panda()+'</div>'+
 '<div class="game-result-score"><span>🏅 Результат</span><strong>'+session.score+' <small>из 10</small></strong><p>'+ (session.score>=8?'Ты хорошо справился!':'Хорошее начало — повторение поможет!')+'</p></div>'+
 '<div class="game-awards"><span>🔥 <b>'+stats.streak+' '+pluralDays(stats.streak)+'</b><small>серия</small></span>'+
 '<span>⭐ <b>+'+(session.score*10)+'</b><small>очков</small></span>'+
 '<span>⚡ <b>×'+session.bestCombo+'</b><small>комбо</small></span></div>'+
 '<div class="game-repeat"><h2>Что повторить</h2><p>'+ (session.errors.length?
 'Ошибок: '+session.errors.length+'. Повтори этот режим, чтобы закрепить фразы.':
 'Без ошибок! Продолжай тренировать китайский.')+'</p>'+
 '<button type="button" data-game-retry-mode>↻ '+safe(modes[session.mode].title)+'</button></div>'+
 '<div class="game-actions"><button type="button" class="game-secondary" data-game-retry>Повторить</button>'+
 '<button type="button" class="game-primary" data-game-hub>Дальше →</button></div>');
}
function renderResultsHub(){
 screen='stats';stopAudio();
 const s=readStats();
 shell(topBar('Игровая практика')+'<div class="game-stats-head"><h1>🏆 Результаты</h1><p>Твои реальные достижения, сохранённые на этом телефоне</p></div>'+
 '<div class="game-awards"><span>🔥 <b>'+s.streak+' '+pluralDays(s.streak)+'</b><small>серия</small></span>'+
 '<span>⭐ <b>'+s.points+'</b><small>очков</small></span>'+
 '<span>🎮 <b>'+s.completed+'</b><small>игр</small></span></div>'+
 '<div class="game-best">'+Object.entries(modes).map(([id,v])=>'<div><strong>'+safe(v.title)+'</strong><span>'+((s.best[id]||0)?s.best[id]+' из 10':'Пока нет результата')+'</span></div>').join('')+'</div>'+
 '<button type="button" class="game-primary game-full" data-game-hub>К играм →</button>');
}
function render(){if(screen==='question')renderQuestion();else if(screen==='hub')renderHub()}
section.addEventListener('click',event=>{
 if(section.dataset.simpleSection!=='game')return;
 const button=event.target.closest('button');if(!button||!section.contains(button))return;
 if(button.hasAttribute('data-game-back')){stopAudio();if(screen==='hub'){window.showLaunchMenu?.()}else renderHub();return}
 if(button.hasAttribute('data-game-hub')){renderHub();return}
 if(button.hasAttribute('data-game-mode')){start(button.dataset.gameMode);return}
 if(button.hasAttribute('data-game-results')){renderResultsHub();return}
 if(button.hasAttribute('data-game-retry-mode')||button.hasAttribute('data-game-retry')){if(session)start(session.mode);return}
 if(!session||screen!=='question')return;
 if(button.hasAttribute('data-game-play')){play();return}
 if(button.hasAttribute('data-game-toggle-pinyin')&&session.mode==='listen'){session.showPinyin=!session.showPinyin;renderQuestion();return}
 if(button.hasAttribute('data-game-clear')&&!session.locked){session.selected=[];feedback='';renderQuestion();return}
 if(button.hasAttribute('data-game-remove')&&!session.locked){
  session.selected.splice(Number(button.dataset.gameRemove),1);feedback='';renderQuestion();return
 }
 if(button.hasAttribute('data-game-token')&&!session.locked){
  const idx=Number(button.dataset.gameToken);
  if(!session.selected.includes(idx)){const word=session.bank[idx].han;session.selected.push(idx);feedback='';renderQuestion();speakCardWord(word)}
  return
 }
 if(button.hasAttribute('data-game-option')&&!session.locked){
  session.choice=Number(button.dataset.gameOption);feedback='';renderQuestion();return
 }
 if(button.hasAttribute('data-game-check')){check()}
});
window.openGamePractice=renderHub;
window.__gamePracticeV76={items,modes,getStats:readStats,open:renderHub};
})();