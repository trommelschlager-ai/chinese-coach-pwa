/* Learning flow, one vocabulary record per word, and recoverable offline downloads. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}};
 const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{toast('Не удалось сохранить данные на устройстве.')}};
 const originalWords=words;
 const byWord=new Map();
 COURSE.forEach(l=>l.vocab.forEach(([hz,py,ru])=>{if(!byWord.has(hz))byWord.set(hz,{hz,py,ru,lessons:[]});byWord.get(hz).lessons.push(l.id)}));
 originalWords.forEach(w=>{if(!byWord.has(w.hz))byWord.set(w.hz,{...w,lessons:[]})});
 words=[...byWord.values()];
 let review=read('chinese-coach-review-v1',{});
 if(!review||typeof review!=='object'||Array.isArray(review))review={};
 const valid=new Set(words.map(w=>w.hz));
 const known=new Set(state.learned.filter(h=>valid.has(h)));
 COURSE.forEach(l=>l.vocab.forEach((w,i)=>{if(courseState.known.includes(l.id+'-'+i))known.add(w[0])}));
 state.learned=[...known];
 function mirrorKnown(){
  state.learned=[...new Set(state.learned)].filter(h=>valid.has(h));
  courseState.known=COURSE.flatMap(l=>l.vocab.flatMap((w,i)=>state.learned.includes(w[0])?[l.id+'-'+i]:[]));
  write(cacheKey,state);write(courseStoreKey,courseState);
 }
 function schedule(hz,success){
  if(!valid.has(hz))return;
  const old=review[hz]||{},level=success?Math.min(4,(Number(old.level)||0)+1):0;
  review[hz]={level,due:Date.now()+(success?[0,1,3,7,14][level]*86400000:0)};
  write('chinese-coach-review-v1',review);
 }
 const due=hz=>review[hz]&&review[hz].due<=Date.now();
 const oldSave=save;
 save=function(){mirrorKnown();oldSave();updateCourseMetrics();};
 const oldSaveCourse=saveCourse;
 saveCourse=function(){
  const courseKnown=new Set(COURSE.flatMap(l=>l.vocab.flatMap((w,i)=>courseState.known.includes(l.id+'-'+i)?[w[0]]:[])));
  state.learned=[...new Set([...state.learned,...courseKnown])];mirrorKnown();oldSaveCourse();renderWords();
 };
 const oldMetrics=updateCourseMetrics;
 updateCourseMetrics=function(){oldMetrics();const n=state.learned.filter(h=>valid.has(h)).length;
  $('statwords').textContent=n+' / '+words.length;$('course-known').textContent=String(n);
  $('progressbar').style.width=(100*n/words.length)+'%';$('statpercent').textContent=Math.round(100*n/words.length)+'%';
  $('wordmessage').textContent='Знакомых слов и выражений: '+n+' из '+words.length+'. К повторению: '+words.filter(w=>due(w.hz)).length+'.';
 };
 mirrorKnown();
 let topicFilter='all';
 const search=document.createElement('div');search.className='vocab-search';
 search.innerHTML='<label>Тема<select id="vocab-topic"><option value="all">Все темы</option>'+COURSE.map(l=>'<option value="'+l.id+'">'+safe(l.title)+'</option>').join('')+'</select></label><label>Найти слово<input id="vocab-search" type="search" placeholder="Иероглиф, пиньинь или перевод"></label>';
 $('words').querySelector('.vocabcontrols').before(search);
 const dueButton=document.createElement('button');dueButton.className='chip';dueButton.textContent='Пора повторить';dueButton.dataset.filter='due';
 $('words').querySelector('.vocabcontrols').append(dueButton);
 dueButton.onclick=()=>{filter='due';document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b===dueButton));renderWords()};
 const baseRenderWords=renderWords;
 renderWords=function(){const all=words,query=($('vocab-search').value||'').trim().toLocaleLowerCase();
  words=all.filter(w=>(topicFilter==='all'||w.lessons.includes(Number(topicFilter)))&&(!query||[w.hz,w.py,w.ru].some(v=>v.toLocaleLowerCase().includes(query)))&&(filter!=='due'||due(w.hz)));
  const f=filter;if(f==='due')filter='all';try{baseRenderWords()}finally{words=all;filter=f}
  document.querySelectorAll('#wordlist .star').forEach(el=>{if(el.textContent==='HSK 1–2')el.textContent='Из курса'});
  document.querySelectorAll('#wordlist .wordcard').forEach(e=>e.style.removeProperty('background-image'));
  updateCourseMetrics();
 };
 $('vocab-topic').onchange=e=>{topicFilter=e.target.value;renderWords()};$('vocab-search').oninput=()=>renderWords();
 $('wordlist').addEventListener('click',e=>{const b=e.target.closest('[data-learn]');if(b){schedule(b.dataset.learn,state.learned.includes(b.dataset.learn));updateCourseMetrics()}});
 const notice=$('words').querySelector('.notice');notice.textContent='Для большинства слов доступны MP3. При недоступности записи роботизированный голос не включается. Загрузки — в настройках.';
 // User-owned settings remain available without occupying the lesson viewport.
 const settings=document.createElement('details');settings.id='app-settings';settings.className='app-settings';
 settings.innerHTML='<summary>Настройки</summary><div class="settings-content"><p class="settings-intro">Для проверки фраз нужен интернет. Оценка тонов приблизительная.</p><div id="offline-settings-slot"></div><button class="btn primary" id="download-course" type="button">Скачать материалы для занятий</button><p id="download-status" role="status" aria-live="polite"></p><button class="btn soft" id="open-voice-settings" type="button">Выбрать голос и скорость</button><button class="btn soft" id="apply-course-update" type="button" hidden>Применить обновление</button><details><summary>Об аудио и лицензиях</summary><p>Локальные записи слов: Yue Tan, CC BY-SA 3.0 US. Слог mā: Chen Wang, CC BY-SA. Источник: <a href="https://github.com/hugolpz/audio-cmn" target="_blank" rel="noopener noreferrer">audio-cmn</a>. Тоны и демонстрационные записи сохраняют авторство, указанное в соответствующих упражнениях.</p><p>Библиотека письма Hanzi Writer: Chanind, MIT; данные черт Make Me a Hanzi: Arphic Public License. <a href="https://github.com/chanind/hanzi-writer" target="_blank" rel="noopener noreferrer">Исходный код и лицензии</a>.</p></details><div id="backup-settings-slot"></div></div>';
 document.querySelector('.shell > main').before(settings);
 $('offline-settings-slot').append($('offlinebar'),$('installhelp'));
 const backupDisclosure=document.createElement('details');backupDisclosure.className='backup-disclosure';backupDisclosure.innerHTML='<summary>💾 Резервная копия прогресса</summary>';backupDisclosure.append(document.querySelector('.backup-panel'));$('backup-settings-slot').append(backupDisclosure);
 const voiceSettings=$('pronunciation-settings');settings.querySelector('.settings-content').append(voiceSettings);
 $('open-voice-settings').remove();
 const courseTech=document.querySelector('.course-tech');settings.querySelector('.settings-content').append(courseTech);
 // Attribution remains accessible in Settings rather than under the listening quiz.
 const listeningCredits=document.querySelector('#listening-lab .ear-credits');
 const licenseSection=settings.querySelector('.settings-content > details');
 if(listeningCredits&&licenseSection)licenseSection.append(listeningCredits);
 const tools=document.createElement('div');tools.className='section-tools';
 tools.innerHTML='<button class="btn soft" type="button" id="section-back">← Разделы</button>';
 settings.before(tools);tools.append(settings);
 let sectionOrigin='menu';
 $('section-back').onclick=()=>{if(sectionOrigin==='practice'&&document.body.dataset.currentPage!=='topics')window.openPracticeChoices();else if(sectionOrigin==='words'&&document.body.dataset.currentPage==='words')window.openLearningTopics('words');else go('home')};

 window.addEventListener('course-update-ready',()=>{$('apply-course-update').hidden=false;toast('Доступно обновление. Можно применить его в настройках.')});
 $('apply-course-update').onclick=()=>location.reload();
 settings.addEventListener('toggle',()=>{if(settings.open&&!settings.dataset.sizeLoaded){settings.dataset.sizeLoaded='1';fetch('./assets/offline-pack.json').then(r=>r.json()).then(m=>{$('download-course').textContent='Скачать материалы · около '+(m.bytes/1000000).toFixed(1).replace('.',',')+' МБ'}).catch(()=>{})}});
 let downloadBusy=false;
 $('download-course').onclick=async()=>{
  if(downloadBusy)return;
  const status=$('download-status'),button=$('download-course');
  if(!navigator.onLine){status.textContent='Для скачивания подключи интернет.';return}
  if(!('serviceWorker' in navigator)){status.textContent='Сохранение недоступно в этом браузере. Открой приложение в Chrome.';return}
  downloadBusy=true;button.disabled=true;status.textContent='Готовим загрузку…';
  let timer;
  try{const reg=await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('timeout')),10000))]);
   const worker=reg.active;if(!worker)throw Error('no_worker');
   const channel=new MessageChannel();
   await new Promise((resolve,reject)=>{
    timer=setTimeout(()=>reject(Error('timeout')),180000);
    channel.port1.onmessage=event=>{const m=event.data;
     status.textContent=m.done?'Сохранено '+m.saved+' из '+m.total+' файлов.'+(m.failed?' Не удалось скачать: '+m.failed+'. Нажми ещё раз для повторной попытки.':' Материалы доступны без сети; распознавание фраз работает онлайн.'):'Скачиваем: '+m.saved+' из '+m.total+'…';
     if(m.done){clearTimeout(timer);channel.port1.close();resolve()}
    };worker.postMessage({type:'DOWNLOAD_COURSE'},[channel.port2]);
   });
  }catch{status.textContent='Загрузка прервалась. Уже сохранённые файлы останутся. Попробуй ещё раз.'}
  finally{clearTimeout(timer);downloadBusy=false;button.disabled=false}
 };
 // Named sections open topic choices rather than an arbitrary lesson in the middle.
 const topics=document.createElement('section');topics.id='topics';topics.className='page';document.querySelector('main').append(topics);
 let topicKind='course';

 // The first lesson teaches tones. Do not repeat that lesson as a vocabulary topic.
 // Search appears automatically when the growing course exceeds eight word topics.
 function learningTopicsFor(kind){return kind==='words'?COURSE.filter(l=>l.id!==1):COURSE;}
 function topicButtons(kind,items=learningTopicsFor(kind)){
  const step=kind==='words'?1:kind==='dialogues'?2:0;
  const illustrations=['🎵','💬','🌏','🕒','🍵'];
  return items.map(l=>'<button class="topic-card" type="button" data-topic-lesson="'+l.id+'" data-topic-step="'+step+'"><span class="topic-icon" aria-hidden="true">'+(illustrations[l.id-1]||'📖')+'</span><strong>'+safe(l.title)+'</strong><span class="topic-sub">'+(kind==='words'?l.vocab.length+' слов и выражений':kind==='dialogues'?l.dialogue.length+' реплик':'Правила · слова · диалог · тест')+'</span><span class="topic-arrow" aria-hidden="true">›</span></button>').join('');
 }
 window.openLearningTopics=function(kind='course'){
  topicKind=['course','words','dialogues'].includes(kind)?kind:'course';
  topics.dataset.topicKind=topicKind;
  const shown=learningTopicsFor(topicKind),sum=shown.reduce((n,l)=>n+l.vocab.length,0);
  const overview='<div class="words-overview"><p class="words-overview-count">'+shown.length+' темы · '+sum+' слов и выражений</p><button class="words-all-link" type="button" data-full-dictionary>Весь словарь ›</button></div>';
  const search=topicKind==='words'&&shown.length>8?'<label class="topic-search-label" for="topic-search">Найти тему</label><input id="topic-search" class="topic-search" type="search" placeholder="Поиск темы" autocomplete="off">':'';
  topics.innerHTML='<button class="btn soft" type="button" data-back-menu>← Разделы</button><h1>'+({course:'Уроки китайского',words:'Слова и фразы',dialogues:'Выбери диалог'})[topicKind]+'</h1>'+(topicKind==='words'?overview+search:'<p class="topic-lead">Выбери тему и начни занятие.</p>')+(topicKind==='course'?'<p class="topic-progress">Пройдено уроков: '+courseState.completed.length+'/'+COURSE.length+'</p>':'')+'<div class="topic-grid">'+topicButtons(topicKind,shown)+'</div>';
  topics.querySelector('[data-back-menu]').onclick=()=>go('home');
  topics.querySelector('[data-full-dictionary]')?.addEventListener('click',()=>{sectionOrigin='words';go('words')});
  function bindTopicButtons(){topics.querySelectorAll('[data-topic-lesson]').forEach(b=>b.onclick=()=>openCourseLesson(Number(b.dataset.topicLesson),Number(b.dataset.topicStep)));}
  topics.querySelector('#topic-search')?.addEventListener('input',e=>{
   const q=e.target.value.trim().toLocaleLowerCase('ru');
   const selected=shown.filter(l=>(l.title+' '+l.subtitle).toLocaleLowerCase('ru').includes(q));
   topics.querySelector('.topic-grid').innerHTML=topicButtons(topicKind,selected)||'<p class="topic-empty">Такая тема пока не найдена.</p>';
   bindTopicButtons();
  });
  bindTopicButtons();
  go('topics');
 };
 window.openPracticeChoices=function(){
  topicKind='practice';topics.innerHTML='<button class="btn soft" data-back-menu type="button">← Разделы</button><h1>Практика китайского</h1><p>Выбери упражнение.</p><div class="topic-grid"><button class="topic-card" data-practice="tones"><span class="topic-icon" aria-hidden="true">🎙️</span><strong>Тренировать речь</strong><span class="topic-sub">Слушай и повторяй китайские тоны</span><span class="topic-arrow" aria-hidden="true">›</span></button><button class="topic-card" data-practice="words"><span class="topic-icon" aria-hidden="true">📚</span><strong>Повторить слова</strong><span class="topic-sub">Слова, которые пора вспомнить</span><span class="topic-arrow" aria-hidden="true">›</span></button><button class="topic-card" data-practice="dialog"><span class="topic-icon" aria-hidden="true">🗣️</span><strong>Разговор с ИИ</strong><span class="topic-sub">Диалоги в ChatGPT · нужен интернет</span><span class="topic-arrow" aria-hidden="true">›</span></button></div>';
  topics.querySelector('[data-back-menu]').onclick=()=>go('home');topics.querySelectorAll('[data-practice]').forEach(b=>b.onclick=()=>{sectionOrigin='practice';go(b.dataset.practice)});go('topics');
 };
 window.returnToLearningTopics=()=>window.openLearningTopics(['course','words','dialogues'].includes(topicKind)?topicKind:'course');
 $('course-topics-back').onclick=()=>window.returnToLearningTopics();
 document.querySelectorAll('.six-number').forEach(e=>e.remove());
 document.querySelector('.six-orange').setAttribute('aria-label','Пишем иероглифы');
 function simplifyPage(name){
  document.querySelectorAll('#words .wordcard,#quiz .quizpicture,#quiz #quizopts button').forEach(e=>e.style.removeProperty('background-image'));
  if(name==='tones')window.showPronunciationMode?.(null);
  $('section-back').textContent=sectionOrigin==='practice'&&name!=='topics'?'← Практика':sectionOrigin==='words'&&name==='words'?'← Темы слов':'← Разделы';
  const label=$('course-topics-back');label.textContent=topicKind==='words'?'← Темы слов':topicKind==='dialogues'?'← Диалоги':'← Все уроки';
 }
 // Avoid jumping the whole page when the active card is already visible.
 focusScroll=function(){
  const panel=$('lesson-panel'),page=$('course');
  if(!panel||!page.classList.contains('active'))return;
  const top=panel.getBoundingClientRect().top;
  if(top<16||top>window.innerHeight*.75)panel.scrollIntoView({behavior:'instant',block:'start'});
 };
 // All routes contain only learning position, never recordings or personal data.
 let restoring=false,lastLocation='';
 function courseHash(){return '#course/'+selectedLesson+'/'+selectedStep+'/'+(selectedStep===0?selectedNote:selectedStep===1?vocabIndex:selectedStep===2?dialogueIndex:0)}
 function routeFor(name){return name==='home'?'#menu':name==='topics'?'#topics/'+topicKind:name==='course'?courseHash():'#'+name}
 function pushRoute(name){if(restoring)return;const hash=routeFor(name);if(location.hash!==hash)history.pushState({learning:true},'',hash);lastLocation=hash;}
 const baseGo=go;
 go=function(name){stopLearningAudio();if(name==='course'&&!restoring&&document.body.dataset.currentPage!=='course')closeLessonPicker();if(name==='home'||document.body.dataset.currentPage==='menu')sectionOrigin='menu';baseGo(name);if(name==='home')document.body.dataset.currentPage='menu';else document.body.dataset.currentPage=name;pushRoute(name);updateResume();simplifyPage(name);};
 function restoreRoute(){const parts=location.hash.slice(1).split('/'),name=parts[0];restoring=true;
  try{if(name==='menu'){window.showLaunchMenu();document.body.dataset.currentPage='menu'}
   else if(name==='cover'){window.showLaunchCover();document.body.dataset.currentPage='cover'}
   else if(name==='course'){const id=Number(parts[1]),step=Number(parts[2]),part=Number(parts[3]);if(Number.isInteger(id)&&id>=1&&id<=COURSE.length&&Number.isInteger(step)&&step>=0&&step<=3)openCourseLesson(id,step,Number.isInteger(part)?part:0);else go('home')}
   else if(name==='topics'){if(parts[1]==='practice')window.openPracticeChoices();else window.openLearningTopics(parts[1])}
   else if(['tones','words','quiz','dialog'].includes(name))go(name);
   else if(!name){window.showLaunchCover();document.body.dataset.currentPage='cover'}
   else go('home');
  }finally{restoring=false;lastLocation=location.hash;updateResume()}
 }
 window.addEventListener('popstate',()=>{stopLearningAudio();restoreRoute()});window.addEventListener('hashchange',()=>{if(location.hash!==lastLocation)restoreRoute()});
 $('launch-start').addEventListener('click',()=>{pushRoute('home');document.body.dataset.currentPage='menu';updateResume()});
 $('launch-back').addEventListener('click',()=>{stopLearningAudio();history.pushState({learning:true},'','#cover');lastLocation='#cover';document.body.dataset.currentPage='cover'});
 $('launch-resume').onclick=()=>continueLearning();
 // Do not suppress Sakura for returning learners; cover owns the animation.
 function updateResume(){const r=read('chinese-coach-resume-v1',null),b=$('launch-resume');b.hidden=false;const validResume=r&&COURSE.some(l=>l.id===r.id);b.textContent=validResume?'▶ Продолжить урок '+r.id+' →':'▶ Начать урок 1 · Звуки и тоны →';b.setAttribute('aria-label',validResume?'Продолжить обучение с урока '+r.id:'Начать обучение по порядку, с первого урока');}
 // Unify card learning, visible position and review intervals.
 const basePanel=renderCoursePanel;
 renderCoursePanel=function(){stopLearningAudio();basePanel();
  document.querySelectorAll('.course-footnav .btn').forEach(b=>b.style.setProperty('background-image','none','important'));
  const next=$('course-next');if(/^Следующ/.test(next.textContent))next.textContent='Далее →';
  const panel=$('lesson-panel');panel.querySelectorAll('.focus-hanzi').forEach(e=>e.lang='zh-Hans');
  const b=panel.querySelector('#focus-known');if(b){const hz=COURSE[selectedLesson-1].vocab[vocabIndex][0];b.addEventListener('click',()=>schedule(hz,true))}
  panel.querySelectorAll('.focus-phrase,.focus-banner,.course-quiz-question').forEach(e=>e.style.removeProperty('background-image'));
  const recall=panel.querySelector('.recall-practice');
  if(recall){const phrase=panel.querySelector('.focus-phrase');
   const hideAnswer=hide=>phrase.querySelectorAll('.focus-pinyin,.focus-russian').forEach(e=>e.hidden=hide);
   recall.addEventListener('toggle',()=>{hideAnswer(recall.open);$('recall-assessment').hidden=true;$('recall-reveal').hidden=false});
   $('recall-reveal').onclick=()=>{hideAnswer(false);$('recall-assessment').hidden=false;$('recall-reveal').hidden=true};
   const hz=COURSE[selectedLesson-1].vocab[vocabIndex][0];
   $('recall-again').onclick=()=>{schedule(hz,false);state.learned=state.learned.filter(w=>w!==hz);mirrorKnown();updateCourseMetrics();$('course-next').click()};
  }
  if(selectedStep===1){
   const hint=document.createElement('p');hint.className='learning-one-step';hint.textContent='Слушай слово → повтори вслух → проверь память → далее.';
   panel.prepend(hint);
  }
  const toneButton=panel.querySelector('#focus-check-tone');
  if(toneButton)toneButton.textContent='🎙️ Сравнить мелодику';
  const phraseButton=panel.querySelector('#focus-check');
  if(phraseButton)phraseButton.textContent=phraseButton.dataset.checkPy&&isSingleToneSyllable(phraseButton.dataset.checkPy,phraseButton.dataset.checkHz)?'Сравнить мелодику':'Распознать фразу';
  if(selectedStep===2){const play=document.createElement('button');play.type='button';play.className='btn soft dialogue-full';play.textContent='Слушать весь диалог';play.onclick=()=>playDialogue(COURSE[selectedLesson-1]);panel.querySelector('.dialogue-transcript').before(play);panel.querySelector('.current-line').append(panel.querySelector('.focus-dialog-card'));}

  if(document.body.dataset.currentPage==='course')pushRoute('course');updateResume();
 };
 const baseLessonQuiz=renderLessonQuiz;
 renderLessonQuiz=function(){
  baseLessonQuiz();
  document.querySelectorAll('.course-options button,.course-quiz-question').forEach(b=>b.style.setProperty('background-image','none','important'));
  const result=$('lesson-panel').querySelector('.course-score');
  if(result){
   const note=document.createElement('p');note.className='learning-assessment-note';
   note.textContent='Этот результат отражает знание слов и правил, а не точность произношения. Для тренировки речи открой «Звуки и тоны».';
   result.append(note);
  }
 };
 // Errors become due for repetition; they do not silently mark a word learned.
 document.addEventListener('click',e=>{
  const answer=e.target.closest('#quizopts button');if(answer&&answer.classList.contains('wrong')){const w=quiz[qi];if(w)schedule(w.hz,false)}
  const courseAnswer=e.target.closest('[data-answer]');if(courseAnswer&&courseAnswer.classList.contains('incorrect')){const lesson=COURSE[selectedLesson-1],question=lesson.quiz[questionNumber];const text=question?question[0]+' '+question[1][question[2]]:'';const target=lesson.vocab.filter(w=>text.includes(w[0])).sort((a,b)=>b[0].length-a[0].length)[0];if(target)schedule(target[0],false);}
 });
 // Reuse natural recordings when an exact word recording is available; never concatenate syllables into phrases.
 let audio=null,audioGeneration=0,recordingStop=null,recordingUrl=null;
 function stopLearningAudio(){audioGeneration++;if(audio){audio.pause();audio=null}if(finishSpeech){finishSpeech();finishSpeech=null}window.speechSynthesis?.cancel();if(recordingStop){const stop=recordingStop;recordingStop=null;stop()}window.dispatchEvent(new Event('learning-audio-stop'));}
 window.stopLearningAudio=stopLearningAudio;
 let finishSpeech=null;
 const audioStatus=document.createElement('div');audioStatus.id='learning-audio-status';audioStatus.className='audio-status';audioStatus.hidden=true;
 audioStatus.innerHTML='<span role="status" aria-live="polite"></span><button type="button">Остановить</button>';
 document.body.append(audioStatus);audioStatus.querySelector('button').onclick=()=>{stopLearningAudio();audioStatus.hidden=true};
 function status(text){audioStatus.hidden=false;audioStatus.querySelector('span').textContent=text;if(/не удалось|недоступна/i.test(text))toast(text);}
 // Dialogue voice files are used only after the generated batch passes all 25 MP3 checks.
 let dialogueMp3Status=null,dialogueMp3Checked=0,dialogueMp3Check=null;
 async function ensureDialogueMp3Ready(){
  if(dialogueMp3Status===true)return true;
  if(dialogueMp3Check)return dialogueMp3Check;
  if(dialogueMp3Status===false && Date.now()-dialogueMp3Checked<60000)return false;
  dialogueMp3Checked=Date.now();
  dialogueMp3Check=(async()=>{
   try{
    const response=await fetch('./assets/dialogue-voices-v72/status.json',{cache:'no-store'});
    if(!response.ok)return false;
    const status=await response.json();
    return status.ready===true&&status.count===25&&status.voices?.A==='zh-CN-XiaoxuanNeural'&&status.voices?.B==='zh-CN-YunjianNeural';
   }catch{return false}
  })();
  dialogueMp3Status=await dialogueMp3Check;dialogueMp3Check=null;
  return dialogueMp3Status;
 }
 function getDialogueClip(lessonId,index,speaker,useNew){
  const folder=useNew?'dialogue-voices-v72':'dialogue-voices';
  return './assets/'+folder+'/l'+lessonId+'-'+String(index+1).padStart(2,'0')+'-'+speaker.toLowerCase()+'.mp3';
 }
 async function playWord(text,rate=.82,token=audioGeneration,voice=null,dialogueClip=null,allowSystem=false){
  const key=String(text).replace(/[！!。．，,？?\s]/g,''),file=dialogueClip||(voice?null:(window.courseHumanAudio?.[key]||window.courseNaturalAudio?.[key]));
  if(file){const a=new Audio(file);audio=a;
   // Fresh v72 MP3s are truly different voices; keep original native pitch and tone contours.
   // For optional A/B comparison, play the unmodified old MP3 at its natural pitch too.
   a.playbackRate=dialogueClip?1:(rate<=.8?rate:Math.max(.94,rate));
   a.preservesPitch=true;
   if('webkitPreservesPitch' in a)a.webkitPreservesPitch=true;
   status('Загружается запись носителя…');
   try{await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{a.pause();reject(Error('timeout'))},10000);a.onended=()=>{clearTimeout(timer);resolve()};a.onerror=()=>{clearTimeout(timer);reject(Error('audio'))};a.onpause=()=>{clearTimeout(timer);resolve()};Promise.resolve(a.play()).then(()=>{if(token!==audioGeneration){a.pause();resolve()}else status('Играет запись носителя')},reject)});return}
   catch{a.pause();if(token!==audioGeneration)return;
    if(!allowSystem){status('Не удалось загрузить MP3. Проверь интернет или скачай урок в настройках.');return;}
   }
  }
  if(token!==audioGeneration)return;
  // Synthetic speech is strictly opt-in for the explicitly marked phone-voice preview.
  if(!allowSystem){status('Для этой учебной фразы ещё нет MP3-записи.');return;}
  status('Голос телефона · '+(voice?'собеседник '+voice:'учебная фраза'));
  if(!('speechSynthesis' in window)){status('Китайская озвучка недоступна в этом браузере.');return}
  const v=chineseVoice(),choices=speechSynthesis.getVoices().filter(x=>/^(zh|cmn)[-_]CN/i.test(x.lang));
  await new Promise(resolve=>{
   const u=new SpeechSynthesisUtterance(text);let timer;
   const finish=()=>{clearTimeout(timer);if(finishSpeech===finish)finishSpeech=null;resolve()};finishSpeech=finish;
   u.lang='zh-CN';
    const selected=voice==='A'?(choices.find(x=>/xiaoxiao/i.test(x.name))||v):
      voice==='B'?(choices.find(x=>/yunxi/i.test(x.name))||v):v;
    if(selected)u.voice=selected;
   u.rate=rate;u.pitch=1;u.onend=finish;u.onerror=()=>{toast('Не удалось озвучить. Выбери китайский голос в настройках.');finish()};
   timer=setTimeout(finish,20000);speechSynthesis.speak(u);
  });
 }

 speakChinese=function(text,rate,allowSystem=false){stopLearningAudio();const token=audioGeneration;const pref=Number(localStorage.getItem('chinese-coach-tts-rate-v2'))||.94;const speed=rate&&rate<=.8?Math.min(pref,rate):pref;return playWord(text,speed,token,null,null,allowSystem).finally(()=>{if(token===audioGeneration)audioStatus.hidden=true})};
 window.playDialogueLine=async function(lessonId,index){
  const lesson=COURSE.find(x=>x.id===lessonId),line=lesson?.dialogue[index];
  if(!line)return;
  stopLearningAudio();const token=audioGeneration;
  const ready=await ensureDialogueMp3Ready();if(token!==audioGeneration)return;
  const [speaker,text]=line;
  try{await playWord(text,.97,token,speaker,getDialogueClip(lessonId,index,speaker,ready&&localStorage.getItem('chinese-coach-dialogue-original-v72')!=='1'))}
  finally{if(token===audioGeneration)audioStatus.hidden=true}
 };
 window.playStandaloneDialogue=function(lessonId){
  const lesson=COURSE.find(l=>l.id===Number(lessonId)&&l.id!==1);
  if(!lesson)return Promise.resolve();
  return playDialogue(lesson);
 };
 async function playDialogue(lesson){
  stopLearningAudio();const token=audioGeneration;
  const rows=[...document.querySelectorAll('#topics.active .dialogue-row, #course.active .dialogue-row')];
  const ready=await ensureDialogueMp3Ready();if(token!==audioGeneration)return;
  try{
   for(let i=0;i<lesson.dialogue.length;i++){
    if(token!==audioGeneration)break;
    const [speaker,text]=lesson.dialogue[i];
    rows.forEach((r,j)=>r.classList.toggle('playing-line',j===i));
    await playWord(text,.97,token,speaker,getDialogueClip(lesson.id,i,speaker,ready&&localStorage.getItem('chinese-coach-dialogue-original-v72')!=='1'));
   }
  }finally{rows.forEach(r=>r.classList.remove('playing-line'));if(token===audioGeneration)audioStatus.hidden=true}
 }
 // Record until Stop, retain a replay button; navigation cancels recording and releases the mic.
 recordFocusRepeat=async function(){
  if(recordingStop){recordingStop();return}
  stopLearningAudio();const panel=$('lesson-panel'),message=$('focus-feedback'),button=$('focus-repeat');
  if(!message||!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){if(message)message.textContent='Запись недоступна. Открой приложение в Chrome и проверь разрешение микрофона.';return}
  const token=audioGeneration;let stream,rec,timer,cancelled=false;
  try{stream=await navigator.mediaDevices.getUserMedia({audio:true});if(token!==audioGeneration){stream.getTracks().forEach(t=>t.stop());return}
   rec=new MediaRecorder(stream);const chunks=[];
   const stop=()=>{clearTimeout(timer);if(rec.state==='recording')rec.stop();stream.getTracks().forEach(t=>t.stop());recordingStop=null};
   recordingStop=()=>{cancelled=token!==audioGeneration;stop()};
   rec.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
   rec.onerror=()=>{cancelled=true;stop();message.textContent='Не удалось записать голос. Попробуй ещё раз.';button.textContent='🎤 Записать себя'};
   rec.onstop=()=>{clearTimeout(timer);stream.getTracks().forEach(t=>t.stop());if(!button.isConnected)return;button.textContent='🎤 Записать себя';if(cancelled||!chunks.length)return;
    if(recordingUrl)URL.revokeObjectURL(recordingUrl);recordingUrl=URL.createObjectURL(new Blob(chunks,{type:rec.mimeType||'audio/webm'}));
    message.textContent='Запись готова. Сравни её с образцом. Автоматической оценки здесь нет.';
    let replay=panel.querySelector('#replay-recording');if(!replay){replay=document.createElement('button');replay.id='replay-recording';replay.type='button';replay.className='btn soft';message.after(replay)}
    replay.textContent='Послушать мою запись';replay.onclick=()=>{stopLearningAudio();audio=new Audio(recordingUrl);audio.play().catch(()=>{message.textContent='Не удалось воспроизвести запись. Попробуй записать ещё раз.'})};
   };
   rec.start();button.textContent='■ Остановить запись';message.textContent='Говори. Нажми «Остановить запись», когда закончишь (до 15 секунд).';timer=setTimeout(stop,15000);
  }catch{stream?.getTracks().forEach(t=>t.stop());message.textContent='Разреши микрофон в настройках браузера и попробуй ещё раз.'}
 };
 window.addEventListener('pagehide',()=>{stopLearningAudio();if(recordingUrl)URL.revokeObjectURL(recordingUrl)});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopLearningAudio()});
 // All lessons remain accessible, including progress and backup tools formerly hidden behind the cover.
 document.querySelectorAll('[data-page="course"]').forEach(b=>{const clean=b.cloneNode(true);b.replaceWith(clean);clean.addEventListener('click',()=>window.openLearningTopics('course'))});
 const tech=document.querySelector('.course-tech p');if(tech)tech.textContent='Для отдельных слов используются локальные записи носителя; остальные фразы озвучивает выбранный голос телефона. Проверка высоты одиночного слога приблизительная и не подтверждает правильность всех звуков.';
 // A single backup includes the unified vocabulary, repetition, writing and resume position.
 $('exportprogress').addEventListener('click',e=>{
  e.stopImmediatePropagation();
  const data={format:'chinese-trainer-offline',version:3,exportedAt:new Date().toISOString(),learned:state.learned,correct:state.correct,course:courseState,review,hanzi:read('chinese-coach-hanzi-lab-v1',[]),basicKnown:read('chinese-coach-basic-known-v1',[]),resume:read('chinese-coach-resume-v1',null)};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='moi-kitaiskii-progress.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);$('backupmessage').textContent='Сохранены базовые слова, уроки, повторение и иероглифы.';
 },true);
 const importOld=$('importprogress'),importNew=importOld.cloneNode(true);importOld.replaceWith(importNew);
 importNew.addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;
  try{if(file.size>250000)throw Error('Файл слишком большой');const data=JSON.parse(await file.text());
   if(data.format!=='chinese-trainer-offline'||!Array.isArray(data.learned)||!Number.isFinite(data.correct)||data.correct<0)throw Error('Неверный формат прогресса');
   state.learned=[...new Set(data.learned)].filter(h=>valid.has(h));state.correct=Math.floor(data.correct);
   if(data.course&&typeof data.course==='object'){
    courseState.completed=Array.isArray(data.course.completed)?[...new Set(data.course.completed.filter(id=>Number.isInteger(id)&&id>=1&&id<=COURSE.length))]:[];
    const keys=new Set(COURSE.flatMap(l=>l.vocab.map((w,i)=>l.id+'-'+i)));
    courseState.known=Array.isArray(data.course.known)?data.course.known.filter(k=>keys.has(k)):[];
    const last=data.course.last;courseState.last=last&&Number.isFinite(last.score)&&Number.isFinite(last.total)&&last.total>0&&last.score>=0&&last.score<=last.total?last:null;
    COURSE.forEach(l=>l.vocab.forEach((w,i)=>{if(courseState.known.includes(l.id+'-'+i)&&!state.learned.includes(w[0]))state.learned.push(w[0])}));
   }
   if(data.review&&typeof data.review==='object'&&!Array.isArray(data.review)){review={};for(const [hz,v] of Object.entries(data.review)){if(valid.has(hz)&&Number.isInteger(v?.level)&&v.level>=0&&v.level<=4&&Number.isFinite(v.due))review[hz]={level:v.level,due:v.due}}write('chinese-coach-review-v1',review)}
   if(Array.isArray(data.hanzi))write('chinese-coach-hanzi-lab-v1',[...new Set(data.hanzi.filter(h=>'大人小一二三口日月木'.includes(h)&&h.length===1))]);
   if(Array.isArray(data.basicKnown)){
    const allowed=new Set((window.__simpleSectionPreview?.data||[]).flatMap(g=>g.words.map(w=>w.hz)));
    if(allowed.size){write('chinese-coach-basic-known-v1',[...new Set(data.basicKnown)].filter(h=>typeof h==='string'&&allowed.has(h)).slice(0,allowed.size));window.dispatchEvent(new Event('basic-known-restored'));}
   }
   const r=data.resume;if(r&&Number.isInteger(r.id)&&r.id>=1&&r.id<=COURSE.length&&Number.isInteger(r.step)&&r.step>=0&&r.step<=3)write('chinese-coach-resume-v1',{id:r.id,step:r.step,part:Math.max(0,Number(r.part)||0)});
   mirrorKnown();renderWords();updateCourseMetrics();updateResume();$('backupmessage').textContent='Прогресс восстановлен.';
  }catch(error){$('backupmessage').textContent='Не удалось восстановить: '+error.message}finally{e.target.value=''}
 });

 $('tone-check').textContent='🎙️ Сравнить мелодику';
 renderWords();resetQuiz();updateCourseMetrics();updateResume();
 if(location.hash)restoreRoute();else{history.replaceState({learning:true},'','#cover');lastLocation='#cover';}
})();
