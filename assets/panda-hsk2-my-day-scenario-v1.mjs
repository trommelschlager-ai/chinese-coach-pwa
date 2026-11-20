/* Panda Go: HSK2 我的⼀天 scenario. Opt-in URL; approved scenery/mascot untouched.
   Browser ASR is transcription only, never acoustic tone grading. */
import {PANDA_CLIPS} from './panda-voice-clips-v365.mjs?v=365';
import {PANDA_GRAMMAR_AUDIO_V451} from './panda-grammar-voice-v451.mjs?v=451';
import {understandDayAnswer} from './panda-hsk2-day-understanding-v1.mjs?v=2';
if(new URLSearchParams(location.search).get('scenario')==='hsk2-my-day'){
const STORY=[
[['我每天七点起床。','Wǒ měitiān qī diǎn qǐchuáng.','Я встаю в 7.'],['我起床以后洗脸。','Wǒ qǐchuáng yǐhòu xǐliǎn.','После подъёма умываюсь.'],['我早上刷牙。','Wǒ zǎoshang shuāyá.','Утром чищу зубы.'],['我早上吃早饭。','Wǒ zǎoshang chī zǎofàn.','Утром завтракаю.'],['我八点去上班。','Wǒ bā diǎn qù shàngbān.','В 8 иду на работу.'],['我晚上十点睡觉。','Wǒ wǎnshang shí diǎn shuìjiào.','В 10 вечера ложусь спать.']],
[['我每天六点起床。','Wǒ měitiān liù diǎn qǐchuáng.','Я встаю в 6.'],['我起床以后刷牙。','Wǒ qǐchuáng yǐhòu shuāyá.','После подъёма чищу зубы.'],['我早上洗脸。','Wǒ zǎoshang xǐliǎn.','Утром умываюсь.'],['我早上吃早饭。','Wǒ zǎoshang chī zǎofàn.','Утром завтракаю.'],['我九点去上班。','Wǒ jiǔ diǎn qù shàngbān.','В 9 иду на работу.'],['我晚上十一点睡觉。','Wǒ wǎnshang shíyī diǎn shuìjiào.','В 11 вечера ложусь спать.']]
];
const Q=[
['你每天几点起床？','Nǐ měitiān jǐ diǎn qǐchuáng?','Когда ты встаёшь?','我每天……点起床。','我每天八点起床。'],
['你起床以后做什么？','Nǐ qǐchuáng yǐhòu zuò shénme?','Что делаешь после подъёма?','我起床以后……','我起床以后洗脸。'],
['你早上吃早饭吗？','Nǐ zǎoshang chī zǎofàn ma?','Ты завтракаешь?','我早上……早饭。','我早上不吃早饭。'],
['你几点去上班？','Nǐ jǐ diǎn qù shàngbān?','Во сколько идёшь на работу?','我……点去上班。 / 我不上班。','我九点去上班。'],
['你晚上几点睡觉？','Nǐ wǎnshang jǐ diǎn shuìjiào?','Во сколько ложишься спать?','我晚上……点睡觉。','我晚上十一点睡觉。']
];
const norm=s=>String(s||'').normalize('NFC').replace(/[。？！!?，,.\s、]/gu,'');
const dot=s=>norm(s)+'。';
// Restrict this scenario to exact, user-approved adult LuvVoice phrase recordings.
// No Android TTS, unrelated lesson voices or stitched fragments.
const exactLuvvoice=new Map(PANDA_CLIPS.filter(item=>/^\.\/assets\/panda-voice-clips-v365\/p\d{3}\.mp3$/.test(item.src))
  .map(item=>[norm(item.zh),item.src]));
// The 14 user-recorded MP3s are distributed as a separate binary pack.
 // The GitHub connector cannot copy uploaded binaries directly into the repo,
 // so the app activates the pack only when ALL 14 MP3s and the manifest exist.
 const DAY_AUDIO_DIRECTORY='./assets/panda-hsk2-my-day-voice-20261120/';
 const extraDayVoice=new Map();
 const voicePackReady=fetch(DAY_AUDIO_DIRECTORY+'manifest.json',{cache:'no-store'})
   .then(async response=>response.ok?response.json():null)
   .then(async manifest=>{
     if(!manifest||!Array.isArray(manifest.items)||manifest.items.length!==14)return;
     const entries=manifest.items;
     if(new Set(entries.map(e=>e.id)).size!==14)return;
     if(!entries.every(e=>/^day(?:0[1-9]|1[0-4])$/.test(e.id)&&
       typeof e.zh==='string'&&e.zh.length>0))return;
     // Verify each binary is actually present before marking the pack as installed.
     const checks=await Promise.all(entries.map(e=>fetch(DAY_AUDIO_DIRECTORY+e.id+'.mp3',{method:'HEAD',cache:'no-store'}).then(x=>x.ok).catch(()=>false)));
     if(!checks.every(Boolean))return;
     for(const e of entries)extraDayVoice.set(norm(e.zh),DAY_AUDIO_DIRECTORY+e.id+'.mp3');
   }).catch(()=>{});
 function approvedClips(text){
   const key=norm(text),native=window.PandaGoHSK2Lesson1NativeAudioV459;
   return [...new Set([extraDayVoice.get(key),exactLuvvoice.get(key),
     PANDA_GRAMMAR_AUDIO_V451[key],native?.[text],native?.[key]].filter(Boolean))];
 }
const cn={零:0,〇:0,一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};
function num(s){
 if(/^\d{1,2}$/.test(s))return +s;
 if(Object.hasOwn(cn,s))return cn[s];
 const m=/^([一二三四五六七八九]?)(十)([一二三四五六七八九]?)$/.exec(s);
 return m?(m[1]?cn[m[1]]:1)*10+(m[3]?cn[m[3]]:0):null;
}
function time(s){
 const m=/([零〇一二两三四五六七八九十\d]{1,3})点(半|一刻|三刻|[零〇一二两三四五六七八九十\d]{1,3}分?)?/.exec(s);
 if(!m)return null;
 const h=num(m[1]),v=m[2],minute=!v?0:v==='半'?30:v==='一刻'?15:v==='三刻'?45:num(v.replace('分',''));
 return h!==null&&h>=0&&h<=23&&minute!==null&&minute>=0&&minute<=59?m:null;
}
function check(raw,i){
 const s=norm(raw);if(!s)return {error:'Напиши или произнеси ответ.'};
 if(i===3){
  const wrong=/^(?:我)?去([零〇一二两三四五六七八九十\d]{1,3}点(?:半)?)上班$/.exec(s);
  if(wrong&&time(wrong[1]))return {correction:'我'+wrong[1]+'去上班。',error:'Время ставится перед действием. Повтори исправленное предложение один раз.'};
 }
 if(i===0||i===4){
  const act=i===0?'起床':'睡觉',m=time(s);
  if(m&&s.endsWith(act)&&m.index<s.indexOf(act)&&/^(我)?(?:每天|每天早上|每天晚上|早上|晚上|夜里|上午|一般|通常)*/.test(s))return {value:dot(s)};
 }
 if(i===1&&/^(?:我)?(?:起床(?:以后|之后|后))?(?:先)?(?:洗脸|刷牙)(?:(?:再|然后|和)?(?:洗脸|刷牙))?$/.test(s))return {value:dot(s)};
 if(i===2){
  if(/^(?:我)?(?:每天)?(?:早上)?不?吃(?:早饭|早餐)$/.test(s))return {value:dot(s)};
  if(s==='吃'||s==='不吃')return {value:s==='吃'?'我早上吃早饭。':'我早上不吃早饭。'};
 }
 if(i===3){
  if(/^(?:我)?(?:不|没)(?:上班|工作)$/.test(s))return {value:dot(s)};
  const m=time(s);
  if(m&&m.index<s.length-3&&/^(?:我)?(?:每天|早上|上午|晚上)?/.test(s)&&
     /(?:去上班|上班|去上学)$/.test(s)&&!/^(?:我)?去[零〇一二两三四五六七八九十\d]/.test(s))return {value:dot(s)};
 }
 return {error:'Я не могу уверенно подтвердить этот ответ. Это не обязательно ошибка. Проверь текст или воспользуйся подсказкой.'};
}
function init(stage){
 if(stage.dataset.dayScenario)return;stage.dataset.dayScenario='ready';stage.dataset.dayPy='true';stage.dataset.dayRu='true';
 const bridge=window.PandaApprovedBridge337;bridge?.stopPlayback?.();
 const back=stage.querySelector('.pg346-back');if(back)back.href='./hsk2-lesson1.html?step=8';
 const panel=document.createElement('section');panel.className='pg-day-panel';panel.setAttribute('aria-label','Разговор Мой день');
 panel.innerHTML='<div class="pg-day-title"><b id="day-phase">🐼 Мой день · HSK 2</b><span id="day-step">10–15 минут</span></div>'+
 '<strong id="day-zh" lang="zh-Hans">我的一天</strong><span id="day-py">Wǒ de yì tiān</span><span id="day-ru">Панда расскажет о своём дне, потом вы поговорите.</span><p id="day-status" role="status" aria-live="polite">Нажми «Начать».</p>';
 const controls=document.createElement('section');controls.className='pg-day-controls';
 controls.innerHTML='<div class="pg-day-entry"><input id="day-input" maxlength="260" placeholder="Ответ на китайском…" aria-label="Ответ по-китайски">'+
 '<textarea id="day-long" rows="2" maxlength="1100" placeholder="Твой рассказ на китайском…" aria-label="Самостоятельный рассказ"></textarea>'+
 '<button id="day-send" type="button">➤</button><button id="day-mic" type="button">🎙</button></div>'+
 '<div class="pg-day-buttons"><button id="day-start" type="button">▶ Начать</button><button id="day-hear" type="button">🔊 Повторить</button>'+
 '<button id="day-pause" type="button">⏸ Пауза</button><button id="day-hint" type="button">💡 Подсказка</button>'+
 '<button id="day-finish" type="button">✓ Завершить рассказ</button><button id="day-retry" type="button">↻ Ещё раз</button></div>'+
 '<div class="pg-day-toggles"><button id="day-show-py" type="button" aria-pressed="true">拼 Пиньинь</button>'+
 '<button id="day-show-ru" type="button" aria-pressed="true">RU Перевод</button><a href="./hsk2-lesson1.html?step=8">← К уроку</a></div>';
 // A compact, real playback-speed selector; independent from browser TTS.
 // Keep it on the story controls, never replace the hint or repeated-phrase buttons.
 const speedGroup=document.createElement('label');
 speedGroup.id='day-speed-wrap';
 speedGroup.className='pg-day-speed';
 speedGroup.innerHTML='<span class="pg-day-speed-icon" aria-hidden="true">◴</span><span class="pg-day-speed-name">Скорость</span>'+
  '<select id="day-speed" aria-label="Скорость речи Панды"><option value="0.75" selected>0,75×</option>'+
  '<option value="1">1×</option><option value="1.25">1,25×</option></select><span class="pg-day-speed-chevron" aria-hidden="true">⌄</span>';
 controls.append(speedGroup);
 const transcript=document.createElement('details');transcript.className='pg-day-transcript';transcript.hidden=true;
 transcript.innerHTML='<summary>👤 Мой распознанный рассказ</summary><p id="day-transcribed" lang="zh-Hans"></p>';
 panel.append(transcript);
 stage.querySelector('.pg346-history').after(panel);stage.querySelector('.pg346-scene').after(controls);
 // Approved Street screen is a reference for control hierarchy only:
 // move existing interactive nodes; do not replace mascot/scenery or handlers.
 const titleRow=panel.querySelector('.pg-day-title');
 const preferences=controls.querySelector('.pg-day-toggles');
 const returnShortcut=preferences?.querySelector('a');
 // The existing circular top-left back arrow already returns to this lesson.
 returnShortcut?.remove();
 const pinyinToggle=preferences?.querySelector('#day-show-py');
 const russianToggle=preferences?.querySelector('#day-show-ru');
 if(pinyinToggle){pinyinToggle.textContent='拼';pinyinToggle.setAttribute('aria-label','Показать или скрыть пиньинь');pinyinToggle.title='Пиньинь'}
 if(russianToggle){russianToggle.textContent='RU';russianToggle.setAttribute('aria-label','Показать или скрыть перевод');russianToggle.title='Русский перевод'}
 if(preferences)titleRow.querySelector('#day-step').before(preferences);
 const scene=stage.querySelector('.pg346-scene');
 const rail=document.createElement('div');rail.className='pg-day-rail';rail.setAttribute('aria-label','Помощь и повторение');
 for(const id of ['day-hear','day-hint']){
  const button=controls.querySelector('#'+id);
  if(button){button.setAttribute('aria-label',id==='day-hear'?'Повторить фразу Панды':'Показать подсказку');rail.append(button)}
 }
 scene.append(rail);
 // Story-only player: speed sits in its header instead of floating over Panda.
 const storyPlayer=document.createElement('section');
 storyPlayer.id='day-story-player';
 storyPlayer.className='pg-day-player';
 storyPlayer.setAttribute('aria-label','Управление рассказом Панды');
 storyPlayer.innerHTML='<div class="pg-day-player-head"><div class="pg-day-player-title">'+
 '<strong>📖 Режим рассказа Panda</strong><span id="day-player-count">Фраза 1 из 6</span></div></div>'+
 '<div class="pg-day-player-buttons"><button id="day-prev" type="button" aria-label="Предыдущее предложение">◀ Пред.</button>'+
 '<button id="day-repeat-sentence" type="button" aria-label="Повторить текущее предложение">↻ Повтор фразы</button>'+
 '<button id="day-next" type="button" aria-label="Следующее предложение">След. ▶</button></div>';
 stage.querySelector('.pg346-scene').after(storyPlayer);
 storyPlayer.querySelector('.pg-day-player-head').append(speedGroup);
 const pauseButton=controls.querySelector('#day-pause');
 if(pauseButton)storyPlayer.querySelector('#day-next').before(pauseButton);
 const entry=controls.querySelector('.pg-day-entry');
 const finishButton=controls.querySelector('#day-finish');
 if(entry&&finishButton)entry.append(finishButton);
 const $=id=>stage.querySelector('#'+id);
 let phase='ready',i=0,round=0,answers=Array(5).fill(null),notes=[],errors=[],spoken=[],last=null,sequence=0,player=null,recognizer=null,silence=null,attempt=0,paused=false,consent=false;const missingAudio=new Set();
 let playbackRate=0.75; // Learner-friendly default shown in the approved speed reference.
 const status=s=>{$('day-status').textContent=s};
 function line(a){last=a;$('day-zh').textContent=a[0];$('day-py').textContent=a[1]||'';$('day-ru').textContent=a[2]||'';const repeat=$('day-hear');if(repeat){repeat.disabled=!approvedClips(a[0]).length;repeat.title=repeat.disabled?'Нет точной записи утверждённым голосом':'Повторить одобренную запись'};updateStoryPlayer()}
 function storyLines(){
  return phase==='story'?STORY[round%2]:phase==='summary'?answers.filter(Boolean).map(x=>[x,'','Из твоего ответа']):[];
 }
 function updateStoryPlayer(){
  const lines=storyLines(),active=phase==='story'||phase==='summary';
  $('day-player-count').textContent=phase==='intro'?'Приветствие':active?'Фраза '+Math.min(i+1,lines.length)+' из '+lines.length:'';
  $('day-prev').disabled=!active||i<=0;
  $('day-next').disabled=!active;
  $('day-repeat-sentence').disabled=!last||!approvedClips(last[0]).length;
 }
 function stagePhase(p){
  phase=p;stage.dataset.dayPhase=p;
  $('day-phase').textContent=({ready:'🐼 Мой день',intro:'🐼 Приветствие',story:'🐼 История Панды',questions:'🐼 Вопросы',summary:'🐼 Твой день',monologue:'👤 Расскажи сам',results:'🏆 Итоги'}[p]);
  $('day-step').textContent=p==='questions'?(i+1)+'/5':p==='story'?(i+1)+'/6':'HSK 2';
  const show=(id,on)=>$(id).hidden=!on;
  show('day-start',p==='ready');show('day-hear',!['ready','results'].includes(p));
  show('day-pause',['story','summary'].includes(p));show('day-hint',['story','questions','summary','monologue'].includes(p));
  show('day-finish',p==='monologue');show('day-retry',p==='results');
  show('day-story-player',['story','summary'].includes(p));
  show('day-speed-wrap',['story','summary'].includes(p));
  updateStoryPlayer();
  show('day-input',p==='questions');show('day-send',p==='questions');
  show('day-long',p==='monologue');show('day-mic',['questions','monologue'].includes(p));
 }
 function stop(){
  sequence++;clearTimeout(silence);silence=null;
  try{player?.pause()}catch(_){}
  player=null;try{speechSynthesis.cancel()}catch(_){}
  stage.dataset.dayTalking='false';
 }
 function speak(a,slow=false){
   const candidates=approvedClips(a[0]),token=sequence;
   stage.dataset.dayTalking='false';
   if(!candidates.length){
     missingAudio.add(norm(a[0]));
     status('🔇 У этой фразы пока нет точной записи тем же голосом. Текст показан вместо синтезированного голоса.');
     return new Promise(resolve=>setTimeout(resolve,1000));
   }
   return new Promise(resolve=>{
     let ended=false;
     const done=()=>{if(ended)return;ended=true;player=null;stage.dataset.dayTalking='false';resolve()};
     function next(k){
       if(token!==sequence){done();return}
       if(k>=candidates.length){
         missingAudio.add(norm(a[0]));
         status('🔇 Исходная запись пока не доступна. Другой голос не подставляется.');
         done();return;
       }
       const audio=new Audio(candidates[k]);
       player=audio;audio.preload='auto';audio.playbackRate=slow?Math.max(0.60,playbackRate*0.85):playbackRate;
       if('preservesPitch' in audio)audio.preservesPitch=true;
       stage.dataset.dayTalking='true';
       audio.onended=done;
       audio.onpause=()=>{if(token!==sequence)done()};
       audio.onerror=()=>next(k+1);
       audio.play().catch(err=>{
         if(err?.name==='NotAllowedError'){
           status('🔇 Chrome заблокировал звук. Нажми «Повторить» и разреши воспроизведение.');
           done();
         }else next(k+1);
       });
     }
     next(0);
   });
 }
 const delay=ms=>new Promise(r=>setTimeout(r,ms));
 async function playList(lines,p,start=0){
  stagePhase(p);const token=++sequence;
  for(let n=start;n<lines.length;n++){
   if(token!==sequence||paused)return;
   i=n;stagePhase(p);line(lines[n]);updateStoryPlayer();status(p==='story'?(n===1?'洗脸: xǐliǎn (3+3); в речи первый третий тон меняется на второй — xíliǎn.':'Слушай Панду.'):'Панда повторяет только твои ответы.');
   await speak(lines[n]);if(token!==sequence||paused)return;
   await delay(1000);
  }
  if(token!==sequence||paused)return;
  if(p==='story')ask(0);else monologue();
 }
 async function begin(){
  stop();paused=false;missingAudio.clear();stagePhase('intro');
  status('Проверяю единую озвучку…');
  await voicePackReady;
  const a=['你好！今天我说说我的一天。','Nǐ hǎo! Jīntiān wǒ shuōshuo wǒ de yì tiān.','Привет! Сегодня я расскажу о своём дне.'];
  line(a);status('Сначала Панда рассказывает, затем задаёт вопросы.');
  const token=++sequence;
  await speak(a);if(token!==sequence)return;
  await delay(700);if(token===sequence)playList(STORY[round%2],'story');
 }
 function countdown(){
  clearTimeout(silence);const idx=i;
  silence=setTimeout(async()=>{
   if(phase!=='questions'||i!==idx||recognizer)return;
   if(attempt===0){attempt++;status('Панда повторит вопрос медленнее. Это не оценка произношения.');const token=sequence;await speak(['我没听清楚，请再说一遍。','Wǒ méi tīng qīngchu, qǐng zài shuō yí biàn.','Я не расслышала, повтори, пожалуйста.']);if(token!==sequence)return;await delay(200);if(token!==sequence)return;await speak(Q[i].slice(0,3),true);if(token===sequence)countdown()}
   else if(attempt===1){attempt++;status('Подсказка: '+Q[i][3]);countdown()}
   else if(attempt===2){attempt++;status('Пример: '+Q[i][4]+' Ты можешь ответить иначе.');countdown()}
   else{notes.push('Вопрос '+(i+1)+' пропущен.');ask(i+1)}
  },8000);
 }
 async function ask(idx){
  stop();i=idx;attempt=0;
  if(idx===5){finishQuestions();return}
  stagePhase('questions');line(Q[idx].slice(0,3));status('Ответь свободно. Тоны по тексту не оцениваются.');
  const token=++sequence;await speak(Q[idx]);if(token===sequence)countdown();
 }
 function answer(raw){
  if(phase!=='questions')return;
  const idx=i,result=understandDayAnswer(raw,idx);
  clearTimeout(silence);
  if(result.kind==='user-question'){
   // Real turn-taking: answer a learner's question with a recorded fact from
   // Panda's own story, then return to the question already being practiced.
   $('day-input').value='';
   stop();stagePhase('questions');
   const story=STORY[round%2],reply=story[[0,1,3,4,5][result.questionIndex]];
   line(reply);
   status('🐼 Ты спросил Панду. Она ответит о своём дне, затем продолжит урок.');
   const token=sequence;
   (async()=>{
    await speak(reply);if(token!==sequence)return;
    await delay(500);if(token!==sequence)return;
    line(Q[idx].slice(0,3));
    status('Теперь твоя очередь: '+Q[idx][2]+' Тоны по тексту не проверяются.');
    await speak(Q[idx].slice(0,3));
    if(token===sequence)countdown();
   })();
   return;
  }
  if(result.kind==='accepted'){
   answers[idx]=result.value;$('day-input').value='';
   line([result.value,'','Твой ответ']);
   status('✓ '+result.message);
   const token=++sequence;
   setTimeout(()=>{if(token===sequence)ask(idx+1)},1100);
   return;
  }
  if(result.kind==='correct'){
   if(!notes.includes('Исправление: '+result.correction))notes.push('Исправление: '+result.correction);
   if(!errors.includes(result.correction))errors.push(result.correction);
   line([result.correction,'','Время ставим перед глаголом.']);
   status('💡 '+result.message+' Правильно: '+result.correction);
   const token=++sequence;
   speak([result.correction,'','']).then(()=>{if(token===sequence)countdown()});
   return;
  }
  // A clarification is a follow-up within the SAME question. Do not mistake
  // an unclear ASR transcript for wrong Chinese or invent personal details.
  status(result.message);
  const token=++sequence;
  setTimeout(()=>{if(token===sequence)countdown()},1500);
 }
 async function finishQuestions(){
   stop();const list=answers.filter(Boolean).map(x=>[x,'','Из твоего ответа']);
   if(!list.length){monologue();return}
   stagePhase('summary');
   const intro=['这是你的一天。','Zhè shì nǐ de yì tiān.','Это твой день.'];
   line(intro);
   const token=sequence;
   await speak(intro);
   if(token!==sequence)return;
   await delay(500);
   if(token===sequence)playList(list,'summary');
 }
 function monologue(){
  stop();stagePhase('monologue');
  const prompt=['现在请你说说你的一天。','Xiànzài qǐng nǐ shuōshuo nǐ de yì tiān.','Теперь расскажи о своём дне.'];
  line(prompt);
  status('Говори несколько предложений подряд или введи текст. Не нужно повторять слова Панды.');
  $('day-long').value='';
  speak(prompt);
 }
 function finish(){
  const text=$('day-long').value.trim();
  if(!text){status('Расскажи хотя бы одно предложение или напиши его.');return}
  stopRecognition();spoken=text.split(/[。！？!?\n]+/).map(x=>x.trim()).filter(Boolean);
  $('day-transcribed').textContent=text;transcript.hidden=false;
  if(spoken.some(x=>/我去[一二三四五六七八九十\d]+点上班/.test(norm(x))))notes.push('Проверь порядок слов: 我八点去上班。');
  stop();stagePhase('results');line(['做得好！','Zuò de hǎo!','Разговор завершён.']);
  const notMentioned=[['подъём','起床'],['умывание / чистка зубов','洗脸|刷牙'],['завтрак','早饭|早餐'],['работа / учёба','上班|工作|上学'],['сон','睡觉']].filter(([label,pattern])=>!new RegExp(pattern).test(text)).map(([label])=>label);
  const report='Рассказ Панды — прослушан.\nВопросы — '+answers.filter(Boolean).length+' / 5.\nСамостоятельный рассказ — '+spoken.length+' предложений (по распознанному/введённому тексту).\nНе упомянуто (не обязательно ошибка) — '+(notMentioned.join(', ')||'все пять тем затронуты')+'.\nГрамматика — '+(notes.join(' ')||'В проверенных примерах явных ошибок не найдено; свободный текст полностью не проверяется.')+
  '\nПроизношение и тоны — не удалось проверить по тексту.\nПовторить завтра — '+(errors.join(' ')||'одну сложную фразу из рассказа.')+
  (missingAudio.size?'\nБез записи утверждённым голосом: '+missingAudio.size+' уникальных фраз (показаны текстом).':'\nГолос: только утверждённые записи LuvVoice.');
  status(report);
  speak(['做得好！','Zuò de hǎo!','Хорошо получилось!']).then(()=>{if(phase==='results')status(report)});
 }
 function stopRecognition(){if(recognizer){const old=recognizer;recognizer=null;try{old.abort()}catch(_){}}}
 function mic(){
  if(recognizer){stopRecognition();status('Микрофон остановлен.');return}
  // Never let Panda's voice leak into browser speech recognition.
  stop();
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){status('Распознавание в браузере недоступно. Используй текстовый ввод.');return}
  if(!consent){if(!confirm('Браузер может передавать звук для распознавания сторонней службе. Panda Go не сохраняет голос. Продолжить?'))return;consent=true}
  clearTimeout(silence);
  const r=new SR();recognizer=r;r.lang='zh-CN';r.interimResults=false;r.maxAlternatives=3;r.continuous=phase==='monologue';
  status('🎙 Слушаю китайскую речь…');
  r.onresult=e=>{
   let text='';for(let j=e.resultIndex;j<e.results.length;j++)if(e.results[j].isFinal)text+=e.results[j][0].transcript+' ';
   text=text.trim();if(!text)return;
   if(phase==='questions'){
    $('day-input').value=text;status('Распознано: '+text+'. Тоны не оценивались.');
    const question=i;
    // Advance without extra tap only when the recognized text fits a reviewed answer.
    // Anything uncertain stays editable and is never graded as bad pronunciation.
    const intent=understandDayAnswer(text,question);
    if(intent.kind==='accepted'||intent.kind==='user-question')setTimeout(()=>{
     if(phase==='questions'&&i===question&&$('day-input').value===text)answer(text)
    },750);
   }
   if(phase==='monologue'){$('day-long').value+=($('day-long').value.trim()?'。':'')+text;status('Продолжай рассказ. После окончания нажми «Завершить рассказ».')}
  };
  r.onerror=e=>status('Микрофон или распознавание: '+(e.error||'сбой')+'. Это НЕ означает ошибку в произношении.');
  r.onend=()=>{const wasCurrent=recognizer===r;if(wasCurrent)recognizer=null;if(wasCurrent&&phase==='questions')countdown()};
  try{r.start()}catch(_){recognizer=null;status('Не удалось включить микрофон. Проверь разрешение Chrome или напиши ответ.')}
 }
 $('day-speed').onchange=()=>{
   const chosen=Number($('day-speed').value);
   if(![0.75,1,1.25].includes(chosen))return;
   playbackRate=chosen;
   if(player&& !player.paused)player.playbackRate=playbackRate;
   $('day-speed').setAttribute('aria-label','Скорость речи Панды: '+chosen.toString().replace('.',',')+' раза');
 };
 $('day-start').onclick=begin;
 $('day-send').onclick=()=>answer($('day-input').value);
 $('day-input').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();answer($('day-input').value)}};
 $('day-mic').onclick=mic;
 $('day-hear').onclick=async()=>{
  const clip=last,mode=phase,position=i;
  if(!clip)return;
  if(mode==='story'||mode==='summary'){paused=false;$('day-pause').textContent='⏸ Пауза'}
  stop();const token=sequence;
  await speak(clip);
  if(token!==sequence)return;
  if(mode==='questions')countdown();
  else if(mode==='story'||mode==='summary'){
    await delay(1000);
    if(token!==sequence)return;
    const lines=mode==='story'?STORY[round%2]:answers.filter(Boolean).map(x=>[x,'','Из твоего ответа']);
    if(position+1<lines.length)playList(lines,mode,position+1);
    else if(mode==='story')ask(0);
    else monologue();
  }
 };
 function storyHint(){
  const sentence=STORY[round%2]?.[i]?.[0]||'';
  if(sentence.includes('起床以后')&&sentence.includes('洗脸'))return '起床以后 = после подъёма; 洗脸 = умываться. Тоны xǐliǎn, в речи xíliǎn.';
  if(sentence.includes('起床以后')&&sentence.includes('刷牙'))return '起床以后 = после подъёма; 刷牙 = чистить зубы.';
  if(sentence.includes('洗脸'))return '早上 = утром; 洗脸 = умываться. Тоны xǐliǎn, в речи xíliǎn.';
  if(sentence.includes('刷牙'))return '早上 = утром; 刷牙 = чистить зубы.';
  if(sentence.includes('吃早饭'))return '吃早饭 = завтракать. 不吃早饭 = не завтракать.';
  if(sentence.includes('上班'))return '去上班 = идти на работу. Время ставится перед 去上班.';
  if(sentence.includes('睡觉'))return '晚上 = вечером; 睡觉 = ложиться спать.';
  return '每天 = каждый день. Время ставится перед действием.';
 }
 $('day-hint').onclick=()=>{
  if(phase==='questions'){status('💡 '+Q[i][3]+' Пример: '+Q[i][4]);countdown()}
  else if(phase==='story')status('💡 '+storyHint());
  else if(phase==='summary')status('💡 Повтори свой ответ, следя за порядком слов.');
  else status('💡 起床 → 洗脸 → 刷牙 → 吃早饭 → 去上班 → 睡觉');
 };
 $('day-prev').onclick=()=>seekStory(-1);
 $('day-next').onclick=()=>seekStory(1);
 $('day-repeat-sentence').onclick=()=>{$('day-hear').click()};
 $('day-finish').onclick=finish;
 function seekStory(delta){
  const mode=phase;
  if(mode!=='story'&&mode!=='summary')return;
  const lines=storyLines(),next=i+delta;
  if(next<0)return;
  stop();paused=false;$('day-pause').textContent='⏸ Пауза';
  if(next>=lines.length){if(mode==='story')ask(0);else monologue();return}
  playList(lines,mode,next);
 }
 $('day-pause').onclick=()=>{
  if(phase!=='story'&&phase!=='summary')return;
  if(!paused){paused=true;stop();$('day-pause').textContent='▶ Продолжить';status('Пауза. Нажми «Продолжить» или «Повтор фразы».')}
  else{paused=false;$('day-pause').textContent='⏸ Пауза';playList(storyLines(),phase,i)}
 };
 $('day-retry').onclick=async()=>{
   stop();const token=sequence;
   await speak(['我们再试一次。','Wǒmen zài shì yí cì.','Давай попробуем ещё раз.']);
   if(token!==sequence)return;
   round++;answers=Array(5).fill(null);notes=[];errors=[];spoken=[];i=0;transcript.hidden=true;begin();
 };
 $('day-show-py').onclick=()=>{stage.dataset.dayPy=String(stage.dataset.dayPy!=='true');$('day-show-py').setAttribute('aria-pressed',stage.dataset.dayPy)};
 $('day-show-ru').onclick=()=>{stage.dataset.dayRu=String(stage.dataset.dayRu!=='true');$('day-show-ru').setAttribute('aria-pressed',stage.dataset.dayRu)};
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();stopRecognition()}});
 window.addEventListener('pagehide',()=>{stop();stopRecognition()},{once:true});
 stagePhase('ready');
}
function mount(){const stage=document.querySelector('#pg346');if(!stage||!window.PandaApprovedBridge337)return false;init(stage);return true}
if(!mount()){const mo=new MutationObserver(()=>{if(mount())mo.disconnect()});mo.observe(document.documentElement,{subtree:true,childList:true});window.addEventListener('pagehide',()=>mo.disconnect(),{once:true})}
}
