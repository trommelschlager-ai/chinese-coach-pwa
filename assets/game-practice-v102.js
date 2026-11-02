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
 choose:{title:'Выбери перевод',subtitle:'Найди правильный перевод',icon:'✅'},
 listen:{title:'Слушай и выбирай',subtitle:'Какая фраза прозвучала?',icon:'🎧'}
};
const safe=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const one=s=>section.querySelector(s);
const all=s=>[...section.querySelectorAll(s)];
// All game audio is spoken by the same original native speaker (Yue Tan).
// Do not use alternate narrator, device speech synthesis, or older dialogue files.
function readStats(){return window.courseProgress.readGame()}
function writeStats(s){try{window.courseProgress.writeGame(s)}catch{feedback='Не удалось сохранить достижения. Проверь свободное место и разрешение хранения данных.'}}
const dayKey=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
function recordResult(){
 const st=readStats(),today=dayKey();
 if(session.review)return st;
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
let session=null,screen='hub',feedback='',audioNote='';
let voiceContext=null,voiceGeneration=0,voiceSources=[];
const decodedWords=new Map();
function stopAudio(){
 voiceGeneration++;
 for(const src of voiceSources){try{src.stop()}catch{}}
 voiceSources=[];
 try{window.speechSynthesis?.cancel?.()}catch{}
}
function audioParts(han){
 if(han==='中国人')return [{word:'中'},{word:'国'},{word:'人'}];
 if(han==='小明')return [{word:'小'},{word:'名字',firstSyllable:true}];
 if(han==='二十五')return [{word:'二'},{word:'十'},{word:'五'}];
 return [{word:han}];
}
function contextForAudio(){
 const Context=window.AudioContext||window.webkitAudioContext;
 if(!Context)throw new Error('На устройстве нет поддержки звукового движка.');
 if(!voiceContext)voiceContext=new Context();
 return voiceContext;
}
async function decodedWord(word,ctx){
 const url=window.courseHumanAudio?.[word];
 if(!url)throw new Error('Нет записи '+word+' основным голосом.');
 if(!decodedWords.has(word)){
  const task=(async()=>{
   const response=await fetch(url);
   if(!response.ok)throw new Error('Не удалось загрузить запись '+word+'.');
   return await ctx.decodeAudioData(await response.arrayBuffer());
  })();
  decodedWords.set(word,task);
  task.catch(()=>{if(decodedWords.get(word)===task)decodedWords.delete(word)});
 }
 return decodedWords.get(word);
}
/* Trim room noise before/after speech, rather than playing 1-second MP3 padding.
   The original records all come from one verified Mandarin speaker. */
function spokenRange(buffer,firstSyllable){
 const rate=buffer.sampleRate,samples=buffer.getChannelData(0),step=Math.max(1,Math.round(rate*0.012));
 const rms=[];
 for(let p=0;p<samples.length;p+=step){
  let sum=0,n=Math.min(step,samples.length-p);
  for(let i=p;i<p+n;i++)sum+=samples[i]*samples[i];
  rms.push(Math.sqrt(sum/n));
 }
 const levels=[...rms].sort((a,b)=>a-b);
 const noise=levels[Math.floor(levels.length*.15)]||0;
 const peak=levels[Math.floor(levels.length*.96)]||0;
 const threshold=Math.max(.003,noise*2.1,peak*.12);
 let a=0,b=rms.length-1;
 while(a<b && rms[a]<threshold)a++;
 while(b>a && rms[b]<threshold)b--;
 let from=Math.max(0,(a*step/rate)-.028);
 let until=Math.min(buffer.duration,((b+1)*step/rate)+.045);
 if(until-from<.10){from=0;until=buffer.duration}
 if(firstSyllable){
  // 名字 (míngzi) is recorded by the same speaker: use only the first míng.
  // Choose the syllable boundary using the energy minimum around its middle.
  const aIndex=Math.max(0,Math.floor(a+(b-a)*.40));
  const bIndex=Math.min(rms.length-1,Math.ceil(a+(b-a)*.67));
  let boundary=aIndex;
  for(let i=aIndex;i<=bIndex;i++)if(rms[i]<rms[boundary])boundary=i;
  until=Math.max(from+.18,Math.min(until,(boundary*step/rate)+.014));
 }
 return {from,duration:Math.max(.08,until-from)};
}
async function playHumanSpeech(hans,display){
 stopAudio();
 const generation=voiceGeneration;
 const notice=one('[data-game-audio-feedback]');
 const note=message=>{if(generation===voiceGeneration && notice)notice.textContent=message};
 try{
  const ctx=contextForAudio();
  // Resume synchronously from the user's click, before awaiting network requests.
  await ctx.resume();
  const steps=hans.flatMap(han=>audioParts(han).map((x,i,arr)=>({...x,gapAfter:i===arr.length-1?.095:.026})));
  const clips=await Promise.all(steps.map(async step=>({
   ...step,buffer:await decodedWord(step.word,ctx)
  })));
  if(generation!==voiceGeneration)return;
  let time=ctx.currentTime+.015;
  const nodes=[];
  const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=4800;
  const high=ctx.createBiquadFilter();high.type='highpass';high.frequency.value=125;
  const compressor=ctx.createDynamicsCompressor();
  compressor.threshold.value=-25;compressor.knee.value=8;compressor.ratio.value=2.5;
  compressor.attack.value=.006;compressor.release.value=.11;
  high.connect(low);low.connect(compressor);compressor.connect(ctx.destination);
  for(const clip of clips){
   const range=spokenRange(clip.buffer,clip.firstSyllable);
   const src=ctx.createBufferSource();
   const fade=ctx.createGain();
   src.buffer=clip.buffer;
   src.connect(fade);fade.connect(high);
   const duration=range.duration,fadeTime=Math.min(.025,duration/5),peak=.95;
   fade.gain.setValueAtTime(.0001,time);
   fade.gain.linearRampToValueAtTime(peak,time+fadeTime);
   fade.gain.setValueAtTime(peak,time+duration-fadeTime);
   fade.gain.linearRampToValueAtTime(.0001,time+duration);
   src.start(time,range.from,duration);
   src.stop(time+duration+.005);
   nodes.push(src);
   time+=duration+clip.gapAfter;
  }
  voiceSources=nodes;
  const last=nodes[nodes.length-1];
  if(last)last.onended=()=>{if(generation===voiceGeneration){voiceSources=[];note('🔊 '+display)}};
  note('🔊 '+display);
 }catch(error){
  if(generation===voiceGeneration){
   voiceSources=[];
   note('Звук недоступен: '+(error?.message||'проверь подключение'));
  }
 }
}
function speakCardWord(han){playHumanSpeech([han],han)}
window.addEventListener('learning-audio-stop',stopAudio);
function play(){
 if(!session)return;
 window.dispatchEvent(new Event('learning-audio-stop'));
 const q=items[session.index];
 playHumanSpeech(q.parts.map(part=>part[0]),q.zh);
}
function shuffled(n,seed){
 const values=Array.from({length:n},(_,i)=>i);
 for(let i=n-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[values[i],values[j]]=[values[j],values[i]]}
 return values;
}
function start(mode,order){
 if(!modes[mode])return;
 const questions=order?.length?order:Array.from({length:items.length},(_,i)=>i);
 session={mode,index:questions[0],order:questions,position:0,review:!!order,score:0,combo:0,bestCombo:0,errors:[],mistakes:[],done:false,selected:[],choice:-1,locked:false,bank:[],showPinyin:mode==='build'};
 screen='question';initQuestion();render();
}
function initQuestion(){
 const q=items[session.index],base=q.parts.map((p,i)=>({han:p[0],pin:p[1],target:i}));
 const extra=[['你','nǐ'],['吗','ma'],['我','wǒ'],['不','bù'],['很','hěn'],['谢谢','xièxie'],['三','sān'],['在','zài']].filter(p=>!base.some(t=>t.han===p[0]));
 const distractions=extra.slice((session.index*2)%Math.max(1,extra.length-2),((session.index*2)%Math.max(1,extra.length-2))+2)
 .map(p=>({han:p[0],pin:p[1],target:-1}));
 const arr=[...base,...distractions],order=shuffled(arr.length,197+(session.index+1)*93);
 session.bank=order.map(i=>arr[i]);session.selected=[];session.choice=-1;session.locked=false;if(session.mode!=='build')session.showPinyin=false;feedback='';audioNote='Нажми ▶, чтобы прослушать';
 stopAudio();
}

function shell(inner){
 section.dataset.simpleSection='game';section.innerHTML='<div class="game-shell audit-game">'+inner+'</div>';
}
function panda(){return '<img class="audit-panda" src="./assets/game-panda-v80.webp" width="150" height="171" alt="Панда с книжкой" decoding="async">'}
function topBar(text){return '<button class="audit-back" type="button" data-game-back>← '+safe(text)+'</button>'}
function hero(title,subtitle){return '<header class="audit-game-hero"><div><h1>'+safe(title)+'</h1><p>'+safe(subtitle)+'</p></div>'+panda()+'</header>'}
function renderHub(){
 screen='hub';session=null;stopAudio();const s=readStats();
 shell('<div class="approved-art-hub restored-hub"><img class="approved-art-image" src="./assets/game-approved-menu-v87-original.png" width="864" height="1536" alt="" aria-hidden="true">'+
 '<h1 class="restore-sr">Игровая практика</h1><button type="button" class="approved-hit approved-hit-back" data-game-back aria-label="К занятиям"></button>'+
 '<div class="restore-hub-stats" aria-label="Прогресс обучения"><span>🔥 Серия: <b>'+s.streak+' '+pluralDays(s.streak)+'</b></span><span>⭐ <b>'+s.points+'</b> очков</span></div>'+
 Object.entries(modes).map(([key,v])=>'<button type="button" class="approved-hit approved-hit-'+key+'" data-game-mode="'+key+'" aria-label="'+safe(v.title)+' — 10 заданий"></button>').join('')+
 '<button type="button" class="approved-hit approved-hit-results" data-game-results aria-label="Результаты и награды"></button></div>');
}
function pluralDays(n){const v=n%100,k=n%10;return v>=11&&v<=14?'дней':k===1?'день':k>=2&&k<=4?'дня':'дней'}
const explanations={
 name:'Я + называться + имя: 我 + 叫 + 小明.',country:'Я + быть + национальность: 我 + 是 + 中国人.',
 where:'Место после 住: 你 + 住 + 在 + 哪里. 哪里 означает «где».',time:'Сначала «сейчас», затем «сколько часов»: 现在 + 几 + 点.',
 tea:'Я + хотеть + пить + одну чашку чая: 我 + 想 + 喝 + 一 + 杯 + 茶.',askname:'Ты + называться + какое имя: 你 + 叫 + 什么 + 名字.',
 age:'Я + возраст + лет: 我 + 二十五 + 岁. Здесь 是 не нужно.',three:'Сейчас + три + часа: 现在 + 三 + 点.',
 fine:'Я + очень + хорошо, спасибо: 我 + 很 + 好 + 谢谢.',howold:'你多大？ — «Сколько тебе лет?». 多大 спрашивает возраст.'
};
function correction(q){return session.locked?'<div class="audit-correction"><strong>Правильный ответ</strong><span lang="zh-Hans">'+safe(q.zh)+'</span>'+
 (session.showPinyin||session.mode==='choose'?'<small>'+safe(q.py)+'</small>':'')+'<p>'+safe(q.ru)+'</p>'+
 (session.lastCorrect?'':'<p>'+safe(explanations[q.id])+'</p>')+'</div>':''}
function token(t,i,selected=false){return '<button type="button" class="'+(selected?'audit-answer-token':'audit-token')+'" '+(selected?'data-game-remove="'+i+'"':'data-game-token="'+i+'"')+' '+(session.locked?'disabled':'')+
 ' aria-label="'+safe((selected?'Убрать ':'Добавить ')+t.han+' '+t.pin)+'"><small>'+safe(t.pin)+'</small><strong lang="zh-Hans">'+safe(t.han)+'</strong></button>'}
function choiceOptions(){
 const other=shuffled(items.length,session.index*119+13).filter(i=>i!==session.index).slice(0,2);
 return shuffled(3,session.index+89).map(i=>[session.index,...other][i]);
}
function restoredStage(mode,content,meter){
 return '<div class="restore-stage restore-'+mode+'">'+topBar('Игровая практика')+
 '<h1 class="restore-sr">'+safe(modes[mode].title)+'</h1><div class="restore-status"><span>'+(session.review?'Повтор · ':'')+'Задание '+(session.position+1)+' из '+session.order.length+'</span><span>🔥 Комбо ×'+session.combo+'</span></div>'+
 '<progress class="restore-meter" max="100" value="'+meter+'" aria-label="Выполнено заданий"></progress>'+content+'</div>';
}
function renderQuestion(){
 const q=items[session.index],mode=session.mode;let body='';
 const meter=(session.position+(session.locked?1:0))/session.order.length*100;
 if(mode==='build'){
  // Fully structured interactive screen: the artwork is a static backdrop,
  // not a giant image which resizes when answer tiles change.
  body='<div class="ch110-build-screen"><header class="ch110-game-toolbar">'+
   '<button class="ch110-game-back" type="button" data-game-back>‹ Игровая практика</button>'+
   '<div class="ch110-game-status"><span>Задание '+(session.position+1)+' из '+session.order.length+'</span><span>🔥 Комбо ×'+session.combo+'</span></div>'+
   '<progress class="ch110-game-progress" max="100" value="'+meter+'"></progress></header>'+
   '<div class="ch110-game-title">Переведи<br>предложение</div>'+
   '<div class="ch110-prompt-row"><img class="ch110-panda" src="./assets/game-panda-v80.webp" alt="Панда с книгой">'+
   '<div class="ch110-prompt"><span>Переведи предложение</span><strong>'+safe(q.ru)+'</strong></div></div>'+
   '<div class="restore-deck game-build-static'+(session.showPinyin?'':' game-py-hidden')+'">'+
   '<div class="audit-answer" role="group" aria-label="Твоя фраза">'+session.selected.map((id,k)=>token(session.bank[id],k,true)).join('')+
   (session.selected.length?'':'<span class="audit-answer-hint">Выбери слова ниже</span>')+'</div>'+
   '<div class="audit-bank" role="group" aria-label="Слова для ответа">'+session.bank.map((t,id)=>session.selected.includes(id)?'':token(t,id)).join('')+
   '</div>'+
   '<div class="ch110-build-controls"><button class="ch110-game-pinyin" type="button" data-game-toggle-pinyin aria-pressed="'+session.showPinyin+'">'+
   (session.showPinyin?'Скрыть пиньинь':'Показать пиньинь')+'</button></div>'+
   '<p class="audit-audio-note" data-game-audio-feedback aria-live="polite"></p></div>'+
   '<div class="ch110-game-bottom"><div class="audit-feedback" role="status" aria-live="polite">'+safe(feedback)+'</div>'+correction(q)+
   '<div class="audit-actions"><button type="button" class="audit-secondary ch110-game-reset" data-game-clear '+(session.locked?'disabled':'')+' aria-label="Сбросить ответ">↻</button>'+
   '<button type="button" class="audit-primary" data-game-check>'+(session.locked?(session.position===session.order.length-1?'Результат →':'Далее →'):'Проверить →')+
   '</button></div></div></div>';
  shell('<div class="audit-question restored-question" data-mode="build">'+body+'</div>');
  return;
 }else{
  const choices=session.choices||choiceOptions();session.choices=choices;
  const prompt=mode==='listen'?'<div class="audit-listen"><button type="button" class="audit-play" data-game-play aria-label="Прослушать китайскую фразу">▶ Прослушать</button><p>Какая фраза прозвучала?</p></div>':
  '<div class="audit-prompt"><p>Что означает эта фраза?</p><h2 lang="zh-Hans">'+safe(q.zh)+'</h2><p class="audit-pinyin">'+safe(q.py)+'</p><button type="button" class="audit-secondary" data-game-play>🔊 Послушать</button></div>';
  body=restoredStage(mode,prompt+'<p class="audit-audio-note" data-game-audio-feedback role="status" aria-live="polite">'+(mode==='listen'?safe(audioNote):'')+'</p>',meter)+'<div class="restore-deck">'+
  '<div class="audit-choices" role="group" aria-label="Варианты ответа">'+choices.map((id,i)=>{
   const selected=session.choice===i,correct=session.locked&&id===session.index,wrong=session.locked&&selected&&!correct,x=items[id];
   return '<button type="button" data-game-option="'+i+'" class="audit-choice'+(selected?' is-selected':'')+(correct?' is-correct':'')+(wrong?' is-wrong':'')+'" aria-pressed="'+selected+'" '+(session.locked?'disabled':'')+'><b aria-hidden="true">'+(i+1)+'</b><span>'+
    (mode==='listen'?'<strong lang="zh-Hans">'+safe(x.zh)+'</strong>'+(session.showPinyin?'<span class="original-listen-py audit-pinyin">'+safe(x.py)+'</span>':'')+'<small>'+safe(x.ru)+'</small>':'<strong>'+safe(x.ru)+'</strong>')+
    (correct?'<em>✓ Верный ответ</em>':wrong?'<em>✕ Твой ответ — неверно</em>':'')+'</span></button>';
  }).join('')+'</div>';
  if(mode==='listen')body+='<button type="button" class="audit-secondary audit-pinyin-toggle" data-game-toggle-pinyin aria-expanded="'+session.showPinyin+'">'+(session.showPinyin?'Скрыть пиньинь':'Показать пиньинь')+'</button>';
 }
 shell('<div class="audit-question restored-question" data-mode="'+mode+'">'+body+
 '<div class="audit-feedback" role="status" aria-live="polite">'+safe(feedback)+'</div>'+correction(q)+
 '<div class="audit-actions">'+(mode==='build'?'<button type="button" class="audit-secondary" data-game-clear '+(session.locked?'disabled':'')+'>Очистить</button>':'')+
 '<button type="button" class="audit-primary" data-game-check>'+(session.locked?(session.position===session.order.length-1?'Результат →':'Далее →'):'Проверить →')+'</button></div></div></div>');
}
// Update only interactive tiles. Replacing the whole game screen on every tap
// made the background and the browser scroll anchor jump on mobile.
function updateBuildTokens(){
 if(!session||session.mode!=='build'||screen!=='question')return;
 const answer=one('.game-build-static .audit-answer');
 const bank=one('.game-build-static .audit-bank');
 if(!answer||!bank){renderQuestion();return}
 answer.innerHTML=session.selected.map((id,k)=>token(session.bank[id],k,true)).join('')+
  (session.selected.length?'':'<span class="audit-answer-hint">Нажимай слова ниже. Нажми выбранное слово, чтобы убрать его.</span>');
 bank.innerHTML=session.bank.map((t,id)=>session.selected.includes(id)?'':token(t,id)).join('');
 const status=one('.audit-feedback');if(status)status.textContent=feedback;
}
function check(){
 if(session.locked){next();return}
 const q=items[session.index];
 if(session.mode==='build'&&session.selected.length!==q.parts.length){feedback='Выбери '+q.parts.length+' слова. Сейчас выбрано: '+session.selected.length+'.';renderQuestion();return}
 if(session.mode!=='build'&&session.choice<0){feedback='Выбери один ответ.';renderQuestion();return}
 const correct=session.mode==='build'?session.selected.every((id,i)=>session.bank[id].target===i):session.choices[session.choice]===session.index;
 session.locked=true;session.lastCorrect=correct;
 if(correct){session.score++;session.combo++;session.bestCombo=Math.max(session.bestCombo,session.combo)}
 else{session.combo=0;session.errors.push(q.id);session.mistakes.push({id:q.id,answer:session.mode==='build'?session.selected.map(id=>session.bank[id].han).join(''):items[session.choices[session.choice]].zh})}
 feedback=correct?'✓ Верно!':'✕ Неверно. Сравни свой ответ с образцом.';renderQuestion();
}
function next(){
 if(session.position===session.order.length-1){const s=recordResult();session.done=true;renderResult(s);return}
 session.position++;session.index=session.order[session.position];session.choices=null;initQuestion();renderQuestion();
}
function renderResult(stats){
 screen='result';stopAudio();const total=session.order.length;
 shell(topBar('Игровая практика')+hero(session.review?'Повтор завершён':'Мини-урок завершён',session.score===total?'Все ответы верны':'Разберём ошибки и попробуем ещё раз')+
 '<div class="audit-result-score"><strong>'+session.score+' из '+total+'</strong><p>'+(session.review?'Повтор ошибок не меняет очки за полный урок.':'+'+(session.score*10)+' очков · серия '+stats.streak+' '+pluralDays(stats.streak))+'</p></div>'+
 (session.mistakes.length?'<section class="audit-mistakes"><h2>Что повторить</h2>'+session.mistakes.map(m=>{const q=items.find(x=>x.id===m.id);return '<article><h3>'+safe(q.ru)+'</h3><p>Твой ответ: <span lang="zh-Hans">'+safe(m.answer)+'</span></p><p>Правильно: <strong lang="zh-Hans">'+safe(q.zh)+'</strong></p><p>'+safe(q.py)+'</p><p>'+safe(explanations[q.id])+'</p></article>'}).join('')+
 '<button type="button" class="audit-primary audit-full" data-game-retry-errors>Повторить ошибки ('+session.errors.length+')</button></section>':'<p class="audit-complete">✓ Без ошибок. Можно перейти к следующему упражнению.</p>')+
 '<div class="audit-actions"><button type="button" class="audit-secondary" data-game-retry>Пройти весь режим заново</button><button type="button" class="audit-primary" data-game-hub>К играм →</button></div>');
}
function renderResultsHub(){
 screen='stats';stopAudio();const s=readStats();
 shell(topBar('Игровая практика')+hero('Результаты','Прогресс сохранён на этом устройстве')+
 '<div class="audit-stats"><span><b>'+s.streak+' '+pluralDays(s.streak)+'</b> подряд</span><span><b>'+s.points+'</b> очков</span><span><b>'+s.completed+'</b> игр</span></div>'+
 '<div class="audit-best">'+Object.entries(modes).map(([key,v])=>'<p><strong>'+safe(v.title)+'</strong><span>'+(s.best[key]===undefined?'Пока нет результата':s.best[key]+' из 10')+'</span></p>').join('')+'</div><button type="button" class="audit-primary audit-full" data-game-hub>К играм →</button>');
}
function render(){if(screen==='question')renderQuestion();else if(screen==='hub')renderHub()}
section.addEventListener('click',event=>{
 if(section.dataset.simpleSection!=='game')return;
 const b=event.target.closest('button');if(!b||!section.contains(b)||b.disabled)return;
 if(b.hasAttribute('data-game-back')){stopAudio();if(screen==='hub')window.showLaunchMenu?.();else renderHub();return}
 if(b.hasAttribute('data-game-hub')){renderHub();return}
 if(b.hasAttribute('data-game-mode')){start(b.dataset.gameMode);return}
 if(b.hasAttribute('data-game-results')){renderResultsHub();return}
 if(b.hasAttribute('data-game-retry-errors')){const order=[...new Set(session.errors)].map(id=>items.findIndex(q=>q.id===id));start(session.mode,order);return}
 if(b.hasAttribute('data-game-retry')){if(session)start(session.mode);return}
 if(!session||screen!=='question')return;
 if(b.hasAttribute('data-game-play')){play();return}
 if(b.hasAttribute('data-game-toggle-pinyin')){
  if(session.mode==='build'){
   session.showPinyin=!session.showPinyin;
   one('.game-build-static')?.classList.toggle('game-py-hidden',!session.showPinyin);
   b.textContent=session.showPinyin?'Скрыть пиньинь':'Показать пиньинь';
   b.setAttribute('aria-pressed',String(session.showPinyin));return;
  }
  if(session.mode==='listen'){session.showPinyin=!session.showPinyin;renderQuestion();return}
 }
 if(b.hasAttribute('data-game-clear')&&!session.locked){session.selected=[];feedback='';updateBuildTokens();return}
 if(b.hasAttribute('data-game-remove')&&!session.locked){session.selected.splice(Number(b.dataset.gameRemove),1);feedback='';updateBuildTokens();return}
 if(b.hasAttribute('data-game-token')&&!session.locked){
  const id=Number(b.dataset.gameToken);if(!session.bank[id]||session.selected.includes(id))return;
  if(session.selected.length>=items[session.index].parts.length){feedback='Все места заполнены. Убери выбранное слово или нажми «Очистить».';updateBuildTokens();return}
  session.selected.push(id);feedback='';updateBuildTokens();speakCardWord(session.bank[id].han);return;
 }
 if(b.hasAttribute('data-game-option')&&!session.locked){session.choice=Number(b.dataset.gameOption);feedback='';renderQuestion();return}
 if(b.hasAttribute('data-game-check'))check();
});
window.addEventListener('game-progress-restored',()=>{if(screen==='hub')renderHub();else if(screen==='stats')renderResultsHub()});
window.openGamePractice=renderHub;
window.__gamePracticeV76={items,modes,getStats:readStats,open:renderHub};
})();
