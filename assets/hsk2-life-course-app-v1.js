/* Panda Go · Моя жизнь на китайском · интерактивный 10x3 курс v1.
   Проверка тонов микрофоном и полная MP3-озвучка НЕ заявляются. */
(function(){
'use strict';
var catalog=window.PandaLifeCourseV1;
if(!catalog||!Array.isArray(catalog.topics)||catalog.topics.length!==10){
 document.getElementById('screen').textContent='Учебные материалы временно недоступны.';
 return;
}
var topics=catalog.topics;
var builders=[
 '我|每天|七点|起床','我|先|吃早饭|再|去上班','我|晚上|常常|看书',
 '我|在|公司|工作','我|会|用|电脑','我|今天|很|忙',
 '我|喜欢|听|音乐','我|周末|常常|跑步','我|觉得|这个|电影|很|有意思',
 '银行|在|学校|旁边','公园|在|医院|后面','我家|离|学校|很近',
 '我|坐|地铁|去|上班','我|从家|到公司|坐|公交车','到|机场|需要|一个小时',
 '我|想要|一碗|面条','请|给|我|一杯|茶','我|还要|一碗|汤',
 '这件|衣服|多少钱','这件|衣服|太贵了','这个|比|那个|便宜',
 '我们|星期六|见面|吧','我们|几点|见面','我们|一起|去|公园|吧',
 '我|昨天|看了|电影','我|昨天|没有|上班','我|去过|上海',
 '我|打算|下个月|去|上海','因为|我|喜欢|中文|所以|我|每天|学习','如果|明天|有空|我|就|去|公园'
].map(function(s){return s.split('|')});
var mistakes=[];
function normalize(s){return String(s||'').replace(/[，。？！,.!?、\s]/g,'')}
for(var ti=0;ti<10;ti++)for(var mi=0;mi<3;mi++){
 var i=ti*3+mi;
 if(normalize(builders[i].join(''))!==normalize(topics[ti].scenes[mi][2]))
  mistakes.push('Lesson '+(i+1)+' needs builder token correction');
}
if(mistakes.length)console.warn('Panda Go course QA:',mistakes.join('; '));
var KEY='pg-hsk2-life-course-v1';
var state={view:'welcome',topic:0,mini:0,stage:0,showPy:true,completed:[],difficult:[],quizWord:null,quizSentence:null,build:[],finalAnswers:{},examPassed:false,catalogExpanded:null};
var dayUI=window.PandaGoDayFirstUIV1;
function dayPilot(){return state.topic===0&&!!dayUI;}
function dayCoachingLink(mini){return './panda-voice-pilot.html?practice=day&mini='+Math.max(0,Math.min(2,Number(mini)||0))+'&from=hsk2-life-course&return=done&start=audio&origin=lesson1-done';}
function dayAIBlock(mini){return '<section class="day-ai-panel"><h2>🐼 Поговори с Пандой AI</h2><p>Потренируй то, что уже изучил: Панда задаст вопросы, а ты ответишь голосом или текстом.</p><div class="day-ai-examples"><strong lang="zh-Hans">你早上做什么？</strong><br>Что ты делаешь утром?</div><a href="'+dayCoachingLink(mini)+'" aria-label="Открыть разговорную практику Мой день с Panda AI">🎙 Начать практику →</a></section>';}

try{
 var saved=JSON.parse(localStorage.getItem(KEY)||'null');
 if(saved&&Array.isArray(saved.completed)){
  state.completed=saved.completed.filter(function(v){return Number.isInteger(v)&&v>=0&&v<30});
  state.difficult=Array.isArray(saved.difficult)?saved.difficult.filter(function(v){return typeof v==='string'}):[];
  state.showPy=saved.showPy!==false;
  state.examPassed=!!saved.examPassed;
  var resume=saved.resume;
  if(resume&&typeof resume==='object'&&Number.isInteger(resume.topic)&&resume.topic>=0&&resume.topic<10
   &&Number.isInteger(resume.mini)&&resume.mini>=0&&resume.mini<3){
   state.view='lesson';
   state.topic=resume.topic;state.mini=resume.mini;
   state.stage=Number.isInteger(resume.stage)?Math.max(0,Math.min(resume.topic===0?4:3,resume.stage)):0;
    // Remap existing progress to the five-step v413 lesson order.
    if(resume.topic===0&&!resume.stepOrderV413)state.stage=({0:0,1:4,2:1,3:3,4:2})[state.stage]??0;
   state.quizWord=[0,1,2].includes(resume.quizWord)?resume.quizWord:null;
   state.quizSentence=[0,1,2].includes(resume.quizSentence)?resume.quizSentence:null;
   var tokenCount=builders[state.topic*3+state.mini].length;
   state.build=Array.isArray(resume.build)?
    [...new Set(resume.build.filter(function(n){return Number.isInteger(n)&&n>=0&&n<tokenCount}))]:[];
   if(resume.topic===0&&dayUI){
    var d=dayUI.makeState(resume.mini),prior=resume.day;
    if(prior&&typeof prior==='object'){
     d.selected=Number.isInteger(prior.selected)?Math.max(0,Math.min(d.attempts.length-1,prior.selected)):d.selected;
     d.speechWord=Number.isInteger(prior.speechWord)?Math.max(0,Math.min(d.attempts.length-1,prior.speechWord)):d.speechWord;
     d.quiz=Array.isArray(prior.quiz)?[0,1].map(function(i){return [0,1,2].includes(prior.quiz[i])?prior.quiz[i]:null}):d.quiz;
     d.build=Array.isArray(prior.build)?[...new Set(prior.build.filter(function(n){return Number.isInteger(n)&&n>=0&&n<(window.PandaGoDayModulesV391?.[state.mini]?.builder.length||4)}))]:d.build;
     d.attempts=d.attempts.map(function(_,i){return Array.isArray(prior.attempts?.[i])?
      prior.attempts[i].slice(0,5).filter(function(v){return v&&typeof v.said==='string'&&typeof v.match==='boolean'}).map(function(v){return {said:v.said.slice(0,80),match:v.match}}):[]});
     d.poster=false;
     // Words 先/再 and 晚上/晚饭 moved between mini-lessons in v414.
     // Old microphone scores at those indices may not be attributed to a different word.
     if(!resume.wordOrderV414&&resume.mini===1){d.attempts[5]=[];d.attempts[6]=[]}
     if(!resume.wordOrderV414&&resume.mini===2){d.attempts[3]=[];d.attempts[4]=[]}
     if(prior.v414&&typeof prior.v414==='object')d.v414={...d.v414,...prior.v414,pairs:Array.isArray(prior.v414.pairs)?prior.v414.pairs.filter(x=>Number.isInteger(x)&&x>=0&&x<3):[]};
     if(window.PandaGoStoryboardV433){
      const stagePage=[0,2,4,6,10][state.stage]||0;
      d.pg433Page=Number.isInteger(prior.pg433Page)?Math.max(0,Math.min(11,prior.pg433Page)):stagePage;
      d.pg433HighestStage=Number.isInteger(prior.pg433HighestStage)?Math.max(0,Math.min(4,prior.pg433HighestStage)):state.stage;
      // Old cover/preview flags are display-only; resume directly in learning steps.
      d.pg433Preview=false;
      d.pgApprovedCover=false;
     }
     // v442 opt-in timeline and guided Panda replies. Preserve progress on Android reload.
     if(prior.pg441&&typeof prior.pg441==='object'){
      const p=prior.pg441;
      d.pg441TimelineOpen=p.timelineOpen===true;
      d.pg441Preset=Number.isInteger(p.preset)?Math.max(0,Math.min(2,p.preset)):1;
      d.pg441DialogOpen=p.dialogOpen===true;
      d.pg441DialogStep=Number.isInteger(p.dialogStep)?Math.max(0,Math.min(3,p.dialogStep)):0;
      d.pg441DialogHistory=Array.isArray(p.dialogHistory)?p.dialogHistory.slice(-12)
       .filter(x=>x&&(x.who==='panda'||x.who==='student')&&typeof x.zh==='string')
       .map(x=>({who:x.who,zh:x.zh.slice(0,120),py:String(x.py||'').slice(0,100),ru:String(x.ru||'').slice(0,130)})):[];
      d.pg441Feedback=typeof p.dialogFeedback==='string'?p.dialogFeedback.slice(0,220):'';
     }
    }
    state.day=d;
   }
  }
 }
}catch(e){}
var screen=document.getElementById('screen');
var status=document.getElementById('message');
function store(){
 try{
  var day=state.topic===0&&state.day?{
   selected:state.day.selected,speechWord:state.day.speechWord,quiz:state.day.quiz,build:state.day.build,
   pg433Page:state.day.pg433Page,pg433HighestStage:state.day.pg433HighestStage,
   pg433Preview:state.day.pg433Preview,pgApprovedCover:state.day.pgApprovedCover,
   pg441:{
    timelineOpen:state.day.pg441TimelineOpen===true,
    preset:state.day.pg441Preset,
    dialogOpen:state.day.pg441DialogOpen===true,
    dialogStep:state.day.pg441DialogStep,
    dialogHistory:Array.isArray(state.day.pg441DialogHistory)?state.day.pg441DialogHistory.slice(-12):[],
    dialogFeedback:String(state.day.pg441Feedback||'').slice(0,220)
   },
   attempts:state.day.attempts,poster:false,v414:state.day.v414
  }:null;
  var resume=state.view==='lesson'?{
   topic:state.topic,mini:state.mini,stage:state.stage,stepOrderV413:true,wordOrderV414:true,quizWord:state.quizWord,
   quizSentence:state.quizSentence,build:state.build,day:day
  }:null;
  localStorage.setItem(KEY,JSON.stringify({
   completed:state.completed,difficult:state.difficult,showPy:state.showPy,
   examPassed:state.examPassed,resume:resume
  }));
 }catch(e){}
}
function E(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function perc(){return Math.round(state.completed.length/30*100)}
function id(){return state.topic*3+state.mini}
function chosen(){return topics[state.topic]}
function current(){return chosen().scenes[state.mini]}
function words(t,m){return topics[t].words.slice(m===0?0:m===1?7:14,m===0?7:m===1?14:20)}
function rec(zh){return !!(window.PandaHsk2AudioV330&&window.PandaHsk2AudioV330.lookup(zh))}
const approvedAboutClips=Object.freeze({
 '工作':'./assets/hsk2-about-me/voice-luvvoice-20261120/about04.mp3',
 '爱好':'./assets/hsk2-about-me/voice-luvvoice-20261120/about05.mp3',
 '学习':'./assets/hsk2-about-me/voice-luvvoice-20261120/about06.mp3'
});
let approvedAudio=null;
function approvedSrc(zh){
 const native=window.PandaGoHSK2Lesson1NativeAudioV459;
 const src=(native&&native[zh])||approvedAboutClips[zh]||null;
 return typeof src==='string'&&(/^(?:data:audio\/mpeg;base64,|\.\/assets\/hsk2-about-me\/voice-luvvoice-20261120\/about0[456]\.mp3$)/).test(src)?src:null;
}
function stopApprovedAudio(){
 if(approvedAudio){try{approvedAudio.pause();approvedAudio.currentTime=0}catch{}approvedAudio=null;}
}
function playApproved(zh){
 const src=approvedSrc(zh);
 if(!src){if(status)status.textContent='Нет точной утверждённой записи для этого слова.';return;}
 try{
  stopApprovedAudio();
  window.PandaHsk2AudioV330?.stop?.();
  window.speechSynthesis?.cancel?.();
  const clip=new Audio(src);
  approvedAudio=clip;
  clip.onended=()=>{if(approvedAudio===clip)approvedAudio=null;};
  clip.onerror=()=>{if(approvedAudio===clip){approvedAudio=null;if(status)status.textContent='Не удалось открыть MP3. Проверь соединение.';}};
  const task=clip.play();
  if(task?.catch)task.catch(()=>{if(approvedAudio===clip){approvedAudio=null;if(status)status.textContent='MP3 не воспроизвёлся в браузере.';}});
 }catch{if(status)status.textContent='Ошибка запуска утверждённого MP3.';}
}
function deviceVoiceAvailable(){return !!window.speechSynthesis&&typeof window.SpeechSynthesisUtterance==='function'}
function deviceSound(zh){
 if(!deviceVoiceAvailable()){if(status)status.textContent='Голос устройства недоступен в этом браузере.';return false}
 try{
  window.PandaHsk2AudioV330?.stop?.();
  const synth=window.speechSynthesis,u=new window.SpeechSynthesisUtterance(zh);
  u.lang='zh-CN';u.rate=0.88;u.pitch=1;
  const voices=synth.getVoices?.()||[];
  u.voice=voices.find(v=>/^zh[-_]CN/i.test(v.lang))||voices.find(v=>/^zh[-_]/i.test(v.lang))||null;
  synth.cancel();synth.speak(u);return true;
 }catch(e){if(status)status.textContent='Голос устройства не запустился.';return false}
}
function daySound(zh){
 // Use only exact indexed MP3 for the first HSK2 topic.
 // No robotic Android speech is silently substituted for missing recordings.
 if(rec(zh)||approvedSrc(zh))return sound(zh);
 return '<span class="audio hsk2-no-mp3" role="status" aria-label="Для '+E(zh)+' нет подтверждённого MP3" title="Для этой фразы MP3 ещё не предоставлен">🔇<small>MP3 нет</small></span>';
}
function sound(zh){
 if(rec(zh))return '<button class="audio" type="button" data-sound="'+E(zh)+'" aria-label="Прослушать настоящий MP3: '+E(zh)+'">🔊</button>';
 if(approvedSrc(zh))return '<button class="audio approved-voice" type="button" data-approved-sound="'+E(zh)+'" aria-label="Прослушать утверждённую LuvVoice запись: '+E(zh)+'">🔊</button>';
 if(deviceVoiceAvailable())return '<button class="audio device-voice" type="button" data-device-sound="'+E(zh)+'" title="Синтезированное произношение устройства (не запись носителя)" aria-label="Воспроизвести синтезированный голос устройства: '+E(zh)+'">🔉</button>';
 return '<span class="audio unavailable" title="Для этой фразы нет MP3 и голос устройства недоступен" aria-label="Озвучка недоступна">🔇</span>';
}
function phrase(zh,py,ru){return '<div class="phrase"><span class="han" lang="zh-Hans">'+E(zh)+'</span>'+(state.showPy?'<span class="py">'+E(py)+'</span>':'')+'<span class="meaning">'+E(ru)+'</span>'+sound(zh)+'</div>'}
function wordCard(w){
 var flagged=state.difficult.includes(w[0]);
 return '<div class="word-card"><div class="word-top"><span class="han" lang="zh-Hans">'+E(w[0])+'</span>'+sound(w[0])+'</div>'+(state.showPy?'<span class="py">'+E(w[1])+'</span>':'')+'<span class="meaning">'+E(w[2])+'</span><button type="button" data-flag="'+E(w[0])+'" class="flag'+(flagged?' selected':'')+'" aria-label="Пометить слово для повторения">'+(flagged?'★ Повторить':'☆ Сложное')+'</button></div>';
}
function shuffledIndices(n,seed){
 var a=Array.from({length:n},function(_,i){return i});
 for(var i=n-1;i>0;i--){var j=(seed*17+i*23+7)%(i+1);var v=a[i];a[i]=a[j];a[j]=v}
 if(a.every(function(v,i){return v===i})&&n>1){a.reverse()}
 return a;
}
function selection(q,options,selected,type,answer){
 return '<div class="exercise"><h3>'+E(q)+'</h3><div class="options">'+options.map(function(s,i){
  var c=selected===i?(i===answer?' correct':' wrong'):'';
  return '<button class="option'+c+'" type="button" data-'+type+'="'+i+'">'+E(s)+'</button>';
 }).join('')+'</div>'+
 (selected!==null?'<p class="feedback '+(selected===answer?'good':'bad')+'">'+(selected===answer?'✓ Правильно':'✕ Попробуй другой вариант')+'</p>':'')+'</div>';
}
function viewWelcome(){
 // Approved 842×1867 full-height illustration, uncut and unaltered.
 // Interactive controls remain accessible DOM hotspots on the original image plane.
 return '<section class="approved-stage approved-welcome-screen" style="--approved-image:url(./assets/hsk2-life-approved-fullscreen-v412.png)" aria-label="Panda Go Китайский плюс Легко · курс 2"><div class="approved-art">'+
 '<img src="./assets/hsk2-life-approved-fullscreen-v412.png" alt="Panda Go Китайский + Легко. 10 тем, 30 мини-уроков, 200+ слов и выражений. Грамматика, тесты, произношение 5 раз, общение с Panda AI. Кнопки: Посмотреть программу, Начать курс." width="842" height="1867" fetchpriority="high" decoding="async" draggable="false">'+
 '<button type="button" class="approved-hotspot approved-program poster-welcome-program" data-view="map" aria-label="Посмотреть программу: десять тем и 30 мини-уроков"></button>'+
 '<button type="button" class="approved-hotspot approved-start poster-welcome-start" data-start="0" aria-label="Начать курс: урок 1 О себе"></button>'+
 '<a class="approved-hotspot approved-ai-top poster-welcome-ai" href="./panda-voice-pilot.html" aria-label="Открыть Panda AI: разговорная практика"></a>'+
 '<a class="approved-hotspot poster-welcome-ai-card" href="./panda-voice-pilot.html" aria-label="Открыть Panda AI через карточку"></a>'+
 '</div></section>';
}
function mainLessonProgress(){
  // Main lessons have their own records; do not derive them from the 30-mini-lesson trainer.
  function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}}
  function finished(state){
    const core=state?.quiz?.[0];
    if(!Array.isArray(core)||core.length!==6||!core.every(Boolean))return false;
    const spoken=[...(Array.isArray(state.mic)?state.mic:[]),...(Array.isArray(state.selfSpoken)?state.selfSpoken:[])];
    return Array.isArray(state.heardWords)&&new Set(state.heardWords).size===6 &&
      state.grammarDone===true&&state.dayDone===true &&
      new Set(spoken).size===6&&Array.isArray(state.chat)&&state.chat.length===3;
  }
  function done(k,index=0){const s=read(k);return Array.isArray(s?.completed)&&s.completed.includes(index)}
  function fullEightWordLesson(key){
    const s=read(key),quiz=s?.quiz?.[0];
    return Array.isArray(quiz)&&quiz.length===8&&quiz.every(Boolean)&&
      s.grammarDone===true&&Array.isArray(s.chat)&&s.chat.length===3;
  }
  return [
    done('pg-hsk2-about-me-preview-v1')||finished(read('panda-go-hsk2-about-me-v1')),
    done('pg-hsk2-my-day-main-v1')||finished(read('panda-go-hsk2-lesson1-word-flow-review-v1')),
    done('pg-hsk2-lesson3-preview-v1',2)||finished(read('panda-go-hsk2-lesson3-standard-v1')),
    fullEightWordLesson('panda-go-hsk2-hobby-v1'),
    fullEightWordLesson('panda-go-hsk2-friends-v2'),
    fullEightWordLesson('panda-go-hsk2-yesterday-lesson6-v1'),
    fullEightWordLesson('panda-go-hsk2-future-lesson7-v1'),
    fullEightWordLesson('panda-go-hsk2-shop-lesson8-v1'),
    fullEightWordLesson('panda-go-hsk2-health-lesson9-v1'),
    fullEightWordLesson('panda-go-hsk2-relationships-lesson10-v1')
  ];
}
function viewMap(grammarPage=false){
 if(window.PandaGoStoryboardV433)return window.PandaGoStoryboardV433.mapView(topics,state.completed,state.catalogExpanded,mainLessonProgress(),grammarPage);
 const counts=topics.map(function(t,i){return [0,1,2].filter(function(m){return state.completed.includes(i*3+m)}).length});
 return '<section class="approved-stage approved-map-screen" style="--approved-image:url(./assets/approved-course-v390/course-map.png)" aria-label="Карта курса: десять тем, 30 мини-уроков"><div class="approved-art">'+
 '<img src="./assets/approved-course-v390/course-map.png" alt="Panda Go: десять жизненных тем — мой распорядок дня, работа, хобби, город, транспорт, кафе, покупки, встречи, опыт, планы. Все темы открываются по нажатию." width="941" height="1672" decoding="async" draggable="false">'+
 '<button class="approved-hotspot poster-map-back" type="button" data-view="welcome" aria-label="Назад на главную страницу курса"></button>'+
 topics.map(function(t,i){var row=Math.floor(i/2),col=i%2;return '<button class="approved-hotspot poster-map-card topic-card row'+row+' col'+col+'" type="button" data-topic="'+i+'" aria-label="Тема '+(i+1)+': '+E(t.name)+', '+counts[i]+' из трёх мини-уроков завершено"></button>';}).join('')+
 '<button class="approved-hotspot poster-map-nav start" type="button" data-view="welcome" aria-label="На старт"></button>'+
 '<button class="approved-hotspot poster-map-nav map" type="button" data-view="map" aria-label="Карта тем"></button>'+
 '<a class="approved-hotspot poster-map-nav ai" href="./panda-voice-pilot.html" aria-label="Панда AI"></a>'+
 '<button class="approved-hotspot poster-map-nav review" type="button" data-view="review" aria-label="Повторение слов"></button>'+
 '<button class="approved-hotspot poster-map-nav exam" type="button" data-view="exam" aria-label="Итоговый тест"></button>'+
 '<span class="poster-count poster-counter" aria-label="Завершено '+state.completed.length+' из 30 мини-уроков">'+state.completed.length+'/30</span>'+
 counts.map(function(n,i){var row=Math.floor(i/2),col=i%2;return n?'<span class="poster-count poster-topic-count row'+row+' col'+col+'" aria-label="Пройдено '+n+' из 3">'+n+'/3</span>':''}).join('')+
 '</div></section>';
}
function viewTopic(){
 if(window.PandaGoStoryboardV433)return window.PandaGoStoryboardV433.topicView(state,chosen());
 var t=chosen();var completed=[0,1,2].filter(function(m){return state.completed.includes(state.topic*3+m)}).length;
 return '<section class="topic"><div class="panel topic-banner"><span class="topic-icon large">'+t.icon+'</span><div><div class="eyebrow">ТЕМА '+(state.topic+1)+' ИЗ 10</div><h1>'+E(t.name)+'</h1><p lang="zh-Hans">'+E(t.cn)+'</p><p class="small">'+E(t.goal)+'</p><div class="progress-line">'+completed+' из 3 мини-уроков пройдено</div></div></div>'+
 (state.topic===0?'<a class="pg393-bastian-shortcut" href="./hsk2-bastian-intro.html">👋 Повторить знакомство с Бастианом · 4 фразы →</a>':'')+
 '<div class="mini-list">'+t.scenes.map(function(sc,i){
  var done=state.completed.includes(state.topic*3+i);
  return '<button class="mini-card" type="button" data-mini="'+i+'"><span class="mini-no">'+(i+1)+'</span><span class="mini-copy"><b>'+E(sc[0])+'</b><small>'+(i===0?'7 новых слов':i===1?'7 новых слов':'6 новых слов')+' · диалог · упражнения</small></span><span class="mini-play">'+(done?'✅':'▶')+'</span></button>';
 }).join('')+'</div><div class="tip-box"><b>Как учиться без перегрузки</b><p>Изучи слова, послушай пример, прочитай правило и ответь на вопросы. Не торопись: следующая тема никуда не исчезнет.</p></div><div class="button-row"><button class="secondary" data-view="map">← К карте</button><button class="primary" data-mini="'+(completed<3?completed:0)+'">▶ '+(completed?'Продолжить / повторить':'Начать тему')+'</button></div></section>';
}
function viewLesson(){
 if(dayPilot())return dayUI.render(state,{sound:daySound});
 var t=chosen(), sc=current(), step=state.stage, ws=words(state.topic,state.mini), idx=id();
 var html='<section class="lesson"><div class="lesson-head"><div class="eyebrow">ТЕМАТИЧЕСКАЯ ПРАКТИКА · ТЕМА '+(state.topic+1)+' / 10 · МИНИ-УРОК '+(state.mini+1)+' / 3</div><h1>'+t.icon+' '+E(t.name)+'</h1><p>'+E(sc[0])+'</p><div class="step-meter"><i style="width:'+((step+1)*25)+'%"></i></div><div class="step-labels"><span>Слова</span><span>Правило</span><span>Проверка</span><span>Собери</span></div></div>';
 if(step===0){
  html+='<div class="stage-title"><h2>📖 Слова и выражения</h2><span>'+ws.length+' слов</span></div>'+
   '<div class="word-grid">'+ws.map(wordCard).join('')+'</div>'+
   '<p class="hint">🔊 — подтверждённый MP3; 🔉 — синтезированный голос устройства (это не запись носительницы). Нажми ☆, чтобы оставить слово на повторение.</p>';
 }
 if(step===1){
  html+='<div class="panel gram"><div class="eyebrow">ОДНО ПРАВИЛО</div><h2>'+E(sc[0])+'</h2><p>'+E(sc[1])+'</p><div class="example">'+phrase(sc[2],sc[3],sc[4])+'</div></div>'+
   '<div class="panel"><h2>💬 Мини-диалог</h2><div class="dialogue"><div class="bubble"><b>🐼 Собеседник</b>'+phrase(sc[5],sc[6],sc[7])+'</div>'+
   '<div class="bubble response"><b>👤 Ты</b>'+phrase(sc[8],sc[9],sc[10])+'</div></div></div>'+
   '<div class="tip-box">🎧 Прочитай пиньинь и повтори обе реплики вслух. Если нет MP3, правильность произношения не считается автоматически проверенной.</div>';
 }
 if(step===2){
  var word=ws[Math.min(2,ws.length-1)],a=[word[2],ws[0][2],ws[ws.length-1][2]];
  if(a[1]===a[0])a[1]=ws[1][2];
  if(a[2]===a[0]||a[2]===a[1])a[2]=ws[ws.length-2][2];
  var indices=shuffledIndices(3,idx+2),options=indices.map(function(k){return a[k]});
  var ans=indices.indexOf(0);
  var other1=topics[state.topic].scenes[(state.mini+1)%3][4];
  var other2=topics[state.topic].scenes[(state.mini+2)%3][4];
  var translations=[sc[4],other1,other2],order=shuffledIndices(3,idx+7);
  html+='<div class="stage-title"><h2>🎯 Проверь понимание</h2><span>2 вопроса</span></div>'+
   selection('Что значит '+word[0]+'?',options,state.quizWord,'quiz-word',ans)+
   selection('Как перевести «'+sc[2]+'»?',order.map(function(k){return translations[k]}),state.quizSentence,'quiz-sentence',order.indexOf(0));
  var correctWord=state.quizWord===ans,correctSentence=state.quizSentence===order.indexOf(0);
  html+='<p class="hint">'+(correctWord&&correctSentence?'✅ Оба задания верны. Можно переходить дальше.':'Правильные ответы откроют следующий шаг. Ошибаться и повторять можно сколько угодно.')+'</p>';
 }
 if(step===3){
  var tokens=builders[idx],shuffle=shuffledIndices(tokens.length,idx+13);
  var text=state.build.map(function(k){return tokens[k]}).join(''),ok=state.build.length===tokens.length&&normalize(text)===normalize(sc[2]);
  html+='<div class="panel builder"><div class="stage-title"><h2>🧩 Собери предложение</h2><span>Задание 2 / 2</span></div><p>Скажи по-китайски: <b>'+E(sc[4])+'</b></p>'+
   '<div class="build-target">'+(state.build.length?state.build.map(function(k,i){return '<button type="button" data-remove="'+i+'" class="token chosen">'+E(tokens[k])+'</button>'}).join(''):'<span>Нажимай на части предложения в правильном порядке</span>')+'</div>'+
   '<div class="tokens">'+shuffle.map(function(k){return '<button type="button" class="token" data-token="'+k+'"'+(state.build.includes(k)?' disabled':'')+'>'+E(tokens[k])+'</button>'}).join('')+'</div>'+
   '<p class="feedback '+(ok?'good':'')+'">'+(ok?'✓ Отлично! Предложение собрано правильно.':state.build.length===tokens.length?'Порядок слов неверный. Убери часть предложения и попробуй ещё.':'Помни правило: '+E(sc[0]))+'</p></div>';
 }
 var lock=false;
 if(step===2){var q=ws[Math.min(2,ws.length-1)],opts=[q[2],ws[0][2],ws[ws.length-1][2]],ids=shuffledIndices(3,idx+2);lock=state.quizWord!==ids.indexOf(0)||state.quizSentence!==shuffledIndices(3,idx+7).indexOf(0)}
 if(step===3){lock=state.build.length!==builders[idx].length||normalize(state.build.map(function(k){return builders[idx][k]}).join(''))!==normalize(sc[2])}
 html+='<div class="lesson-nav"><button class="secondary" type="button" data-step-prev>← '+(step===0?'К списку тем':'Назад')+'</button><button class="primary" type="button" data-step-next'+(lock?' disabled':'')+'>'+(step===3?'✅ Завершить урок':'Далее →')+'</button></div></section>';
 return html;
}
function viewDone(){
 if(state.topic===0&&window.PandaGoStoryboardV433)return window.PandaGoStoryboardV433.done(state,daySound,dayCoachingLink(state.mini));
 var t=chosen(),sc=current(),number=id();
 if(state.topic===0&&state.mini===0&&window.PandaGoExactV415)return window.PandaGoExactV415.renderAI(state,daySound,dayCoachingLink(state.mini));
 if(state.topic===0)return '<section class="done day-done pg414-ai" data-mini="'+state.mini+'">'+
  '<div class="pg414-ai-header"><h1>Panda Go 🐾</h1><small>Курс 2 · HSK2</small><h2>Урок 1 · Мой распорядок дня</h2><div>💬 Разговорная практика</div></div>'+
  '<div class="pg414-ai-questions">'+
   '<div class="pg414-ai-question">'+sound('你几点起床？')+'<strong lang="zh-Hans">你几点起床？</strong><span>Nǐ jǐ diǎn qǐchuáng?</span><small>Во сколько ты встаёшь?</small></div>'+
   '<div class="pg414-ai-question">'+sound('你早上做什么？')+'<strong lang="zh-Hans">你早上做什么？</strong><span>Nǐ zǎoshang zuò shénme?</span><small>Что ты делаешь утром?</small></div></div>'+
  '<div class="day-done-mascot"><img src="./assets/hsk2-panda-new-v328.svg" alt="Панда в наушниках готова к разговору"></div>'+
  '<div class="day-done-head"><h2>🏆 Мини-урок '+(state.mini+1)+' пройден!</h2><p>Готов поговорить? Нажми на микрофон, чтобы открыть настоящую Panda AI с распознаванием речи и вводом текста.</p></div>'+
  '<div class="pg414-ai-answer"><label for="pg414-ai-input">Скажи по-китайски…</label><input id="pg414-ai-input" type="text" lang="zh-CN" inputmode="text" autocomplete="off" placeholder="Например: 我每天七点起床"><div class="pg414-ai-controls"><button type="button" data-pg414-mic>🎙 Микрофон</button><button type="button" data-pg414-send>Ответить →</button></div><p id="pg414-ai-feedback" role="status">Ответь на первый вопрос. После правильного ответа перейдём ко второму.</p></div>'+
  '<div class="day-ai-panel"><h2>🐼 Panda AI — полный разговор</h2><a href="'+dayCoachingLink(state.mini)+'" aria-label="Начать полный разговор с Panda AI">🎙 Продолжить разговор с Пандой AI →</a></div>'+
  '<div class="pg414-ai-actions"><button class="secondary" data-repeat>↻ Повторить</button><button class="primary" data-next-mini>Следующий мини-урок →</button></div>'+
  '<div class="day-done-line" hidden>'+phrase(sc[2],sc[3],sc[4])+'</div></section>';
 return '<section class="done"><div class="reward-icon">🏆</div><h1>Мини-урок пройден!</h1><p>Ты разобрал слова, грамматику и правильно собрал предложение.</p><div class="panel">'+phrase(sc[2],sc[3],sc[4])+'</div><p class="honest">Запоминание и произношение нужно закреплять повторениями. Эта отметка показывает выполнение заданий, а не официальный экзаменационный результат.</p><div class="button-row"><button class="secondary" data-repeat>↻ Повторить</button><button class="primary" data-next-mini>Следующий мини-урок →</button></div><button class="text-link" data-view="map">Вернуться к десяти темам</button></section>';
}
function viewTones(){
 var toneCards=[
 ['mā','1-й тон','Высокий ровный','↗','—'],
 ['má','2-й тон','Поднимается вверх','↗','↗'],
 ['mǎ','3-й тон','Низкий с подъёмом','⤴','∨'],
 ['mà','4-й тон','Резко падает','↘','↘']
 ];
 return '<section class="tones"><div class="panel"><div class="eyebrow">ПРОИЗНОШЕНИЕ</div><h1>🎧 Китайские тоны</h1><p>Тон меняет значение слова. Сначала посмотри на направление голоса, потом сравни с правильными аудиозаписями в мини-уроках.</p></div>'+
 '<div class="tone-grid">'+toneCards.map(function(t,i){return '<div class="tone-card"><span class="tone-number">'+(i+1)+'</span><span class="tone-pinyin">'+t[0]+'</span><b>'+t[1]+'</b><span>'+t[2]+'</span><span class="tone-line">'+t[4]+'</span></div>'}).join('')+'</div>'+
 '<div class="panel tone-rules"><h2>Три важных изменения тона</h2>'+
 '<div class="tone-rule"><b>1. Два третьих тона</b><span>你好: пишем nǐ hǎo, но произносим ní hǎo.</span></div>'+
 '<div class="tone-rule"><b>2. 不 перед четвёртым</b><span>不是: произносим bú shì, хотя 不 отдельно — bù.</span></div>'+
 '<div class="tone-rule"><b>3. 一 меняет тон</b><span>一个: yí ge; 一杯: yì bēi. Пиньинь читаем по контексту.</span></div></div>'+
 '<div class="panel"><h2>🎯 Мини-проверка</h2><p>Какой тон у zhù (住)?</p><div class="tone-answers">'+[1,2,3,4].map(function(n){
 return '<button class="option'+(state.toneAnswer===n?(n===4?' correct':' wrong'):'')+'" data-tone-answer="'+n+'">'+n+'-й тон</button>';
 }).join('')+'</div>'+(state.toneAnswer?'<p class="feedback '+(state.toneAnswer===4?'good':'bad')+'">'+(state.toneAnswer===4?'✓ Верно, четвёртый тон резко падает.':'Это четвёртый тон. Попробуй выбрать снова.')+'</p>':'')+'</div>'+
 '<div class="tip-box">Приложение пока не измеряет тон твоего голоса. Даже если распознавание речи определило слово, это не означает, что произношение тона было правильным.</div>'+
 '<div class="button-row"><button class="secondary" data-view="map">🗺️ К темам</button><button class="primary" data-start="0">▶ К первому уроку</button></div></section>';
}
function viewReview(){
 var list=[];
 topics.forEach(function(t){t.words.forEach(function(w){if(state.difficult.includes(w[0]))list.push(w)})});
 return '<section class="review"><h1>⭐ Мои трудные слова</h1><p class="muted">Отмечай слова в мини-уроках — здесь они соберутся для повторения.</p>'+
 (list.length?'<div class="word-grid">'+list.map(wordCard).join('')+'</div>':'<div class="panel">Пока нет отмеченных слов. Начни первый мини-урок и отмечай ☆ слова, которые хочешь повторить.</div>')+
 '<div class="button-row"><button class="primary" data-view="map">К темам →</button></div></section>';
}
function examOptions(i){
 var a=topics[i].scenes[0][4],b=topics[(i+1)%10].scenes[0][4],c=topics[(i+2)%10].scenes[0][4];
 var original=[a,b,c],ord=shuffledIndices(3,i+17);
 return {choices:ord.map(function(v){return original[v]}),correct:ord.indexOf(0)};
}
function viewExam(){
 var answered=Object.keys(state.finalAnswers).length;
 var score=topics.reduce(function(n,t,i){return n+(state.finalAnswers[i]===examOptions(i).correct?1:0)},0);
 return '<section class="exam"><div class="panel"><div class="eyebrow">ИТОГОВАЯ ПРОВЕРКА</div><h1>🏅 Моё путешествие</h1><p>Десять вопросов по десяти жизненным темам. Цель — не менее 8 правильных ответов из 10.</p><div class="meter"><i style="width:'+(answered*10)+'%"></i></div><p class="small">Отвечено: '+answered+' / 10</p></div>'+
 topics.map(function(t,i){var s=t.scenes[0],opts=examOptions(i),selected=state.finalAnswers[i];
 return '<div class="exam-question"><span class="eyebrow">'+(i+1)+'. '+E(t.name)+'</span><h2 lang="zh-Hans">'+E(s[2])+'</h2>'+
 (state.showPy?'<p class="py">'+E(s[3])+'</p>':'')+'<div class="options">'+opts.choices.map(function(x,j){
 return '<button class="option'+(selected===j?' chosen':'')+'" data-exam-choice="'+i+':'+j+'">'+E(x)+'</button>';
 }).join('')+'</div></div>';
 }).join('')+
 (answered===10?'<div class="panel result"><h2>'+score+' из 10</h2><p>'+(score>=8?'✅ Задания выполнены успешно!':'Нужно повторить материал и попробовать снова.')+'</p><button class="primary" data-exam-finish>'+(score>=8?'Сохранить результат':'Повторить тест')+'</button></div>':'')+
 (state.examPassed?'<p class="honest">🏆 Итоговый тест пройден. Это внутренний результат курса, не официальный сертификат HSK.</p>':'')+'</section>';
}
function updateNav(){
 document.querySelectorAll('[data-nav]').forEach(function(b){
  var v=b.dataset.nav;
  b.classList.toggle('active',v===state.view||(v==='map'&&(state.view==='topic'||state.view==='lesson'||state.view==='done')));
 });
 var counter=document.getElementById('course-counter');
 if(counter)counter.textContent=state.completed.length+'/30';
}
var lastPaintKey=null;
function render(){
 // Word choice, quiz taps and pronunciation results must not jump to the top.
 // Reset only when the learner really changes page / lesson / step.
 var paintKey=[state.view,state.topic,state.mini,state.stage,state.view==='lesson'&&state.topic===0&&state.stage===3?(state.day?.v414?.testPage||0):'',state.day&&state.day.poster?'poster':'content'].join(':');
 var preserve=paintKey===lastPaintKey;
  // A navigation step must silence the previous lesson's clip before repainting.
  if(lastPaintKey!==null&&!preserve){window.PandaHsk2AudioV330?.stop?.();stopApprovedAudio();}
 var rememberedY=preserve?screen.scrollTop:0;
 // The live seven-question test scrolls inside the approved artwork.
 // Remember its own position, not just the outer screen scrollTop.
 var examBefore=preserve?screen.querySelector('.pg415-live-test'):null;
 var dialogueBefore=preserve?screen.querySelector('.pg415-dialogue-panel'):null;
 var savedExamY=examBefore?examBefore.scrollTop:0;
 var savedDialogueY=dialogueBefore?dialogueBefore.scrollTop:0;
 var html=state.view==='welcome'?viewWelcome():state.view==='grammar'?viewMap(true):state.view==='map'?viewMap():state.view==='topic'?viewTopic():state.view==='lesson'?viewLesson():state.view==='done'?viewDone():state.view==='review'?viewReview():state.view==='tones'?viewTones():viewExam();
 if(state.view==='topic' && state.topic===6){
 html += '<aside class="pg-shop8-preview" style="margin:10px;padding:13px;border-radius:18px;background:linear-gradient(145deg,#fff6fa,#f7ddff);border:2px solid #eac0f4;box-shadow:0 4px 10px #7d3a8540;text-align:center">'+
  '<strong style="display:block;margin-bottom:7px;color:#601b7f">🛍️ HSK 2 · Урок 8 — В магазине</strong>'+
  '<a href="./hsk2-lesson8-shop-preview.html?rev=shop8-layout-v4" style="display:block;border-radius:24px;background:linear-gradient(#d657ef,#7728b1);border:2px solid #f2d181;padding:10px;color:#fff;font-weight:800;text-decoration:none;box-shadow:0 4px 8px #71208d55">▶ Открыть интерактивный урок 8</a>'+
  '<small style="display:block;margin-top:7px;color:#5b326d">Слова, цены, примерка, диалог · предварительная версия без MP3</small>'+
 '</aside>';
}
screen.innerHTML=html;
 var app=document.getElementById('app');
 app.classList.toggle('show-approved-welcome',state.view==='welcome');
 app.classList.toggle('approved-welcome-v390',state.view==='welcome');
 app.classList.toggle('approved-map-v390',state.view==='map'||state.view==='grammar');
  app.classList.toggle('course-practice-active',state.view==='lesson'&&state.topic!==0);
 var isDayLesson=state.view==='lesson'&&dayPilot(),isDayDone=state.view==='done'&&state.topic===0;
 app.classList.toggle('day-lesson-active',isDayLesson);
 var isDayArt=isDayLesson&&!!screen.querySelector('.day-visual-start,.pg415-art-screen');
 app.classList.toggle('day-visual-v390',isDayArt);
 app.classList.toggle('day-done-active',isDayDone);
 app.classList.toggle('day-stage-0',isDayLesson&&!isDayArt&&state.stage===0);
 app.classList.toggle('day-stage-2',isDayLesson&&!isDayArt&&state.stage===2);
 var footer=document.getElementById('day-fixed-actions');
 if(footer){
  footer.replaceChildren();
  footer.hidden=!isDayLesson||isDayArt;
  if(isDayLesson&&!isDayArt){
   var nav=screen.querySelector('.day-bottom');
   if(nav)footer.appendChild(nav);
  }
 }
 updateNav();
 // For a rerender on the same step, keep the learner's reading position.
 // The old unconditional scrollTop=0 caused every vocabulary tap to jump.
 screen.scrollTop=rememberedY;
 function restoreInnerScroll(){
  if(lastPaintKey!==paintKey)return;
  var exam=screen.querySelector('.pg415-live-test');
  var dialogue=screen.querySelector('.pg415-dialogue-panel');
  if(exam&&preserve)exam.scrollTop=savedExamY;
  if(dialogue&&preserve)dialogue.scrollTop=savedDialogueY;
 }
 lastPaintKey=paintKey;
 restoreInnerScroll();
 if(preserve&&typeof window.requestAnimationFrame==='function')window.requestAnimationFrame(function(){
  if(lastPaintKey===paintKey && Math.abs(screen.scrollTop-rememberedY)>1)screen.scrollTop=rememberedY;
  restoreInnerScroll();
  window.requestAnimationFrame(restoreInnerScroll);
 });
 if(window.PandaGoApprovedV391&&typeof window.requestAnimationFrame==='function')window.requestAnimationFrame(function(){window.PandaGoApprovedV391.fit()});
 if(status)status.textContent='';
 store();
}
function go(v){if(v==='topic'){state.catalogExpanded=state.topic;v='map'}if(state.view==='lesson'&&v!=='lesson'&&dayUI)dayUI.cancel();state.view=v;render()}
function enter(t,m){
 // Mini-lessons are exercises within this catalog, not aliases of main lessons.
 if(dayUI)dayUI.cancel();
 state.catalogExpanded=t;
 state.topic=t;state.mini=m;state.stage=0;state.quizWord=null;state.quizSentence=null;state.build=[];
 state.day=t===0&&dayUI?dayUI.makeState(m):null;
 go('lesson');
}
function next(){
 if(dayPilot())return dayUI.next(state,{render:render,go:go,complete:function(){if(!state.completed.includes(id()))state.completed.push(id());go('done')}});
 if(state.stage===2){
  var ws=words(state.topic,state.mini),q=ws[Math.min(2,ws.length-1)],idx=id();
  if(state.quizWord!==shuffledIndices(3,idx+2).indexOf(0)||state.quizSentence!==shuffledIndices(3,idx+7).indexOf(0))return;
 }
 if(state.stage===3){
  if(state.build.length!==builders[id()].length||normalize(state.build.map(function(i){return builders[id()][i]}).join(''))!==normalize(current()[2]))return;
  if(!state.completed.includes(id()))state.completed.push(id());
  return go('done');
 }
 state.stage=Math.min(3,state.stage+1);render();
}
function openMergedDay(step){
 window.location.assign('./hsk2-lesson1.html?step='+step);
}
function openFirstLesson(step){
 window.location.assign('./hsk2-about-me.html'+(step?'?step='+step:''));
}
document.addEventListener('click',function(e){
 var b=e.target.closest('button');if(!b)return;
 if(b.dataset.sound!==undefined){
  stopApprovedAudio();
  window.speechSynthesis?.cancel?.();
  if(window.PandaHsk2AudioV330)window.PandaHsk2AudioV330.play(b.dataset.sound,function(msg){if(status)status.textContent=msg});
  return;
 }
 if(b.dataset.approvedSound!==undefined){playApproved(b.dataset.approvedSound);return;}
 if(b.dataset.missingSound!==undefined){
   window.speechSynthesis?.cancel?.();
   if(status){
    status.textContent='Для «'+b.dataset.missingSound+'» пока нет проверенной MP3-записи. Роботизированная озвучка отключена.';
    // On the scenic chat screen the warning must never become a permanent beige
    // strip covering the lesson navigation. Keep its accessible status announcement.
    if(state.view==='done'&&state.topic===0){
     const warning=status.textContent;
     window.setTimeout(function(){if(status.textContent===warning)status.textContent=''},2500);
    }
   }
   return;
  }
  if(b.dataset.deviceSound!==undefined){stopApprovedAudio();deviceSound(b.dataset.deviceSound);return}
 if(b.dataset.pg432CoverStart!==undefined&&state.view==='lesson'&&state.topic===0&&state.mini===0){
  if(state.day){state.day.pgApprovedCover=false;state.day.pg433Preview=false;}render();return;
 }
 if(state.view==='lesson'&&dayPilot()&&dayUI.handle(b,state,{render:render,go:go,deviceSound:deviceSound,complete:function(){if(!state.completed.includes(id()))state.completed.push(id());go('done')}}))return;
 if(b.dataset.nav){go(b.dataset.nav);return}
 if(b.dataset.toneAnswer!==undefined){state.toneAnswer=Number(b.dataset.toneAnswer);render();return}
 if(b.dataset.view){go(b.dataset.view);return}
 if(b.dataset.v445Stage!==undefined){
  const sections=[2,4,6,3,7];
  const step=sections[Number(b.dataset.v445Stage)];
  if(step)openFirstLesson(step);
  return;
 }
 if(b.dataset.start!==undefined){openFirstLesson(1);return}
 if(b.dataset.topic!==undefined){
  const t=Number(b.dataset.topic);
  if(!Number.isInteger(t)||t<0||t>=topics.length)return;
  // HSK2 lesson 5 has its own approved five-tab course page and 3D illustrations.
  if(t===4){window.location.assign('./hsk2-lesson5-friends-v2.html?rev=20261121');return;}
  state.catalogExpanded=state.catalogExpanded===t&&state.view==='map'?null:t;
  go('map');return;
 }
 if(b.dataset.practiceMini!==undefined){
  const parts=/^([0-9]):([0-2])$/.exec(b.dataset.practiceMini);
  if(parts)enter(Number(parts[1]),Number(parts[2]));return;
 }
 if(b.dataset.mini!==undefined){enter(state.topic,Number(b.dataset.mini));return}
 if(b.dataset.flag!==undefined){
  var w=b.dataset.flag,i=state.difficult.indexOf(w);
  if(i<0)state.difficult.push(w);else state.difficult.splice(i,1);
  render();return;
 }
 if(b.dataset.stepPrev!==undefined){
  if(state.stage===0)go('map');else{state.stage--;render()}return;
 }
 if(b.dataset.stepNext!==undefined){next();return}
 if(b.dataset.quizWord!==undefined){state.quizWord=Number(b.dataset.quizWord);render();return}
 if(b.dataset.quizSentence!==undefined){state.quizSentence=Number(b.dataset.quizSentence);render();return}
 if(b.dataset.token!==undefined){
  var k=Number(b.dataset.token);
  if(!state.build.includes(k))state.build.push(k);
  render();return;
 }
 if(b.dataset.remove!==undefined){state.build.splice(Number(b.dataset.remove),1);render();return}
 if(b.dataset.pg419AiBack!==undefined){
  // From the sixth approved screen, go to the immediately preceding
  // examples step. Do not restart the lesson or go to the topic map.
  state.view='lesson';state.stage=4;
  if(!state.day&&dayUI)state.day=dayUI.makeState(state.mini);
  render();return;
 }
 if(b.dataset.repeat!==undefined){enter(state.topic,state.mini);return}
 if(b.dataset.nextMini!==undefined){
  if(id()===29)go('exam');else{var k=id()+1;enter(Math.floor(k/3),k%3)}return;
 }
 if(b.dataset.examChoice!==undefined){
  var parts=b.dataset.examChoice.split(':');state.finalAnswers[Number(parts[0])]=Number(parts[1]);render();return;
 }
 if(b.dataset.examFinish!==undefined){
  var score=topics.reduce(function(n,t,i){return n+(state.finalAnswers[i]===examOptions(i).correct?1:0)},0);
  if(score>=8){state.examPassed=true;go('map')}else{state.finalAnswers={};render()}
  return;
 }
 if(b.dataset.togglePy!==undefined){state.showPy=!state.showPy;render()}
});
var toggle=document.getElementById('toggle-pinyin');
if(toggle)toggle.addEventListener('click',function(){state.showPy=!state.showPy;render()});
/* Allow direct links from the ten cards on the existing HSK2 course map. */
try {
 var params=new URLSearchParams(window.location.search);
 if(params.get('start')==='1'){openFirstLesson(1);return;}
 if(params.get('view')==='map')state.view='map';
 if(params.get('view')==='grammar'){state.view='grammar';document.title='Грамматика HSK 2 · Panda Go';}
 if(params.get('view')==='welcome')state.view='welcome';
 // Panda AI -> the exact mini-lesson completion screen the student left.
 // Query values are fixed and validated; other courses keep their own routing.
 if(params.get('return')==='done'&&params.get('from')==='hsk2-life-course'){
  const backMini=params.get('mini');
  if(backMini!==null&&/^[0-2]$/.test(backMini)){
   state.view='done';state.topic=0;state.mini=Number(backMini);
   if(!state.day&&dayUI)state.day=dayUI.makeState(state.mini);
  }
 }
 var requested=params.get('topic');
 if(requested!==null&&/^(?:[0-9])$/.test(requested)){
  state.catalogExpanded=Number(requested);
  state.view='map';
 }
}catch(e){}
if(state.view==='lesson'&&state.topic===0&&state.day){
 state.day.pg433Preview=false;state.day.pgApprovedCover=false;
}
render();
})();
