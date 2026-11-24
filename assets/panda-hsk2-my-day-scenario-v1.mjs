/* Panda Go: HSK2 我的⼀天 scenario. Opt-in URL; approved scenery/mascot untouched.
   Browser ASR is transcription only, never acoustic tone grading. */
import {lookupApprovedPandaVoice} from './panda-approved-voice-registry-v516.mjs';
import {understandDayAnswer,getDayCorrectionLine,readDayReview,saveDayReview,masterDayReview,clearDayReview,dueDayReview,dayReviewStats,practiceDayReview} from './panda-hsk2-day-understanding-v1.mjs?v=6';
import {respondToPandaChat} from './panda-hsk2-smalltalk-v16.mjs?v=3';
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
const voicePackReady=Promise.resolve();
 function approvedClips(text){const clip=lookupApprovedPandaVoice(text);return clip?[clip.src]:[];}
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
 // Match Android browser/PWA status bar to the approved day/night scene.
 const themeMeta=document.querySelector('meta[name="theme-color"]');
 const syncThemeBar=()=>{if(themeMeta)themeMeta.content=stage.dataset.theme==='day'?'#5bb4e5':'#08182f'};
 syncThemeBar();
 const themeObserver=new MutationObserver(syncThemeBar);
 themeObserver.observe(stage,{attributes:true,attributeFilter:['data-theme']});
 window.addEventListener('pagehide',()=>themeObserver.disconnect(),{once:true});
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
 speedGroup.innerHTML='<span class="pg-day-speed-icon" aria-hidden="true">◴</span>'+
  '<span class="pg-day-speed-name">Скорость</span>'+
  '<input type="range" id="day-speed" min="0.75" max="1.25" step="0.25" value="1"'+
  ' aria-label="Скорость речи Панды" aria-valuetext="1 раз" list="day-speed-ticks">'+
  '<output id="day-speed-value" for="day-speed" aria-hidden="true">1×</output>'+
  '<datalist id="day-speed-ticks"><option value="0.75"></option><option value="1"></option><option value="1.25"></option></datalist>';
 controls.append(speedGroup);
 const transcript=document.createElement('details');transcript.className='pg-day-transcript';transcript.hidden=true;
 transcript.innerHTML='<summary>👤 Мой распознанный рассказ</summary><p id="day-transcribed" lang="zh-Hans"></p>';
 panel.append(transcript);
 const chat=document.createElement('details');chat.className='pg-day-chat-log';chat.hidden=true;
 chat.innerHTML='<summary id="day-chat-label">💬 Чат: сообщений пока нет</summary>'+
  '<div id="day-chat-messages" role="log" aria-live="polite" aria-label="Сообщения ученика и ответы Панды"></div>';
 panel.append(chat);
 const review=document.createElement('details');review.className='pg-day-chat-log';
 review.innerHTML='<summary id="day-review-label">📚 Мои ошибки</summary><label><input id="day-review-consent" type="checkbox"> Сохранять исправленные фразы в этом браузере</label><p>Не сохраняем голос и исходную переписку. Согласие выключается после перезагрузки.</p><p id="day-review-stats"></p><button id="day-review-start" type="button">Тренировать ошибки</button><form id="day-review-exercise" hidden><p id="day-review-prompt"></p><input id="day-review-answer" maxlength="100" aria-label="Переведи на китайский" placeholder="Ответ на китайском" autocomplete="off"><button type="submit">Проверить</button><p id="day-review-feedback" role="status"></p><button id="day-review-next" type="button" hidden>Следующая карточка</button><button id="day-review-close" type="button">Закончить тренировку</button></form><div id="day-review-cards"></div><p id="day-review-status" role="status"></p><button id="day-review-clear" type="button">Удалить мои карточки</button>';
 panel.append(review);
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
 const chatModeButton=document.createElement('button');chatModeButton.type='button';
 chatModeButton.id='day-chat-mode';chatModeButton.textContent='💬';
 chatModeButton.title='Свободный разговор';chatModeButton.setAttribute('aria-label','Открыть простой разговор с Пандой');
 chatModeButton.setAttribute('aria-pressed','false');
 if(preferences)preferences.before(chatModeButton);
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
 '<button id="day-next" type="button" aria-label="Следующее предложение">▶▶ След.</button></div>'+
 '<div class="pg-day-player-progress" aria-label="Прогресс урока"><span id="day-progress-count">Фраза 1 из 6</span>'+
 '<div id="day-progress-dots" role="group" aria-label="Выбор предложения"></div></div>';
 stage.querySelector('.pg346-scene').after(storyPlayer);
 storyPlayer.querySelector('.pg-day-player-head').append(speedGroup);
 const pauseButton=controls.querySelector('#day-pause');
 if(pauseButton)storyPlayer.querySelector('#day-next').before(pauseButton);
 const entry=controls.querySelector('.pg-day-entry');
 // One clearly separated answer field and primary action, in the approved
 // photo 2 hierarchy. Existing voice and send controls are moved, not replaced.
 const answerFields=document.createElement('div');answerFields.className='pg-day-answer-fields';
 for(const id of ['day-input','day-long','day-mic','day-send']){
  const control=entry?.querySelector('#'+id);if(control)answerFields.append(control);
 }
 if(entry)entry.prepend(answerFields);
 const questionSubmit=document.createElement('button');
 questionSubmit.id='day-answer-primary';
 questionSubmit.type='button';
 questionSubmit.textContent='✓ Ответить';
 questionSubmit.setAttribute('aria-label','Отправить ответ Пандe');
 if(entry)entry.append(questionSubmit);
 const finishButton=controls.querySelector('#day-finish');
 if(entry&&finishButton)entry.append(finishButton);
 const $=id=>stage.querySelector('#'+id);
 let phase='ready',i=0,round=0,reviewIndex=0,answers=Array(5).fill(null),notes=[],errors=[],spoken=[],monologueSent=[],last=null,sequence=0,player=null,recognizer=null,silence=null,attempt=0,paused=false,consent=false,chatContext={awaiting:null,turn:0},chatResume=null;const missingAudio=new Set();
 let pendingCorrection=null;
 const syncRetry=()=>{const button=$('day-answer-primary');const retry=phase==='questions'&&pendingCorrection?.index===i;button.textContent=retry?'↻ Попробовать ещё раз':phase==='freechat'?'✓ Отправить':'✓ Ответить';button.setAttribute('aria-label',retry?'Отправить исправленный ответ':'Отправить ответ Панде');};
 let playbackRate=1; // Normal speed is the learner-approved default; slow and fast are opt-in.
 const status=s=>{$('day-status').textContent=s};
 const reviewStorage=(()=>{try{return localStorage}catch{return null}})();
 let activeReview=null;
 const safeReviewPhase=()=>['ready','results'].includes(phase);
 function closeReview(){
  activeReview=null;$('day-review-exercise').hidden=true;$('day-review-cards').hidden=false;
  $('day-review-answer').value='';$('day-review-feedback').textContent='';renderDayReview();
 }
 function startReview(){
  if(!safeReviewPhase()){$('day-review-status').textContent='Сначала заверши текущий разговор.';return}
  if(!$('day-review-consent').checked){$('day-review-status').textContent='Разреши локальное сохранение результатов тренировки.';return}
  const item=dueDayReview(reviewStorage)[0];
  if(!item){closeReview();$('day-review-status').textContent='На сегодня всё повторено.';return}
  stop();stopRecognition();activeReview=item.zh;
  $('day-review-exercise').hidden=false;$('day-review-cards').hidden=true;
  $('day-review-prompt').textContent='Переведи на китайский: '+getDayCorrectionLine(item.zh)[2];
  $('day-review-answer').value='';$('day-review-answer').disabled=false;
  $('day-review-feedback').textContent='';$('day-review-next').hidden=true;
  $('day-review-exercise').querySelector('[type="submit"]').disabled=false;
  $('day-review-answer').focus();
 }
 $('day-review-start').onclick=startReview;
 $('day-review-next').onclick=startReview;
 $('day-review-close').onclick=closeReview;
 $('day-review-consent').addEventListener('change',()=>{if(!$('day-review-consent').checked)closeReview()});
 $('day-review-exercise').addEventListener('submit',event=>{
  event.preventDefault();
  if(!activeReview||!safeReviewPhase()){closeReview();return}
  const result=practiceDayReview(reviewStorage,activeReview,$('day-review-answer').value,$('day-review-consent').checked);
  if(result.kind==='empty'){$('day-review-feedback').textContent='Введи ответ.';return}
  if(!['matched','different'].includes(result.kind)){closeReview();$('day-review-status').textContent='Карточка недоступна или сохранение выключено.';return}
  $('day-review-feedback').textContent=result.kind==='matched'?(result.stage===4?'✓ Цикл повторений завершён.':'✓ Совпало. Следующее повторение через '+[1,3,7][result.stage-1]+' дн.'):'Ответ не совпал с учебным образцом (другой вариант может быть правильным). Образец: '+result.line.join(' — ');
  $('day-review-answer').disabled=true;$('day-review-exercise').querySelector('[type="submit"]').disabled=true;
  $('day-review-next').hidden=false;$('day-review-next').textContent=result.kind==='different'?'Попробовать ещё раз':'Следующая карточка';
  activeReview=null;renderDayReview();
 });
 function renderDayReview(){
  const items=readDayReview(reviewStorage),root=$('day-review-cards');
  const stats=dayReviewStats(reviewStorage);
  $('day-review-label').textContent='📚 Мои ошибки · '+stats.due+' к повторению';
  $('day-review-stats').textContent='Всего: '+stats.total+' · Сегодня: '+stats.due+' · Позже: '+stats.scheduled+' · Цикл завершён: '+stats.completed;
  $('day-review-start').disabled=stats.due===0;
  root.replaceChildren();
  if(!items.length){const p=document.createElement('p');p.textContent='Пока нет сохранённых исправлений.';root.append(p)}
  for(const item of items){
   const [zh,py,ru]=getDayCorrectionLine(item.zh),card=document.createElement('div');card.className='pg-day-chat-msg';
   const title=document.createElement('strong');title.lang='zh-Hans';title.textContent=zh;
   const info=document.createElement('p');info.textContent=py+' — '+ru+' · '+(item.stage===4?'✓ Цикл завершён':item.due>Date.now()?'Следующее: '+new Date(item.due).toLocaleDateString('ru-RU'):'К повторению')+' · Ошибок: '+item.count;
   card.append(title,info);
   const listen=document.createElement('button');listen.type='button';listen.textContent='🔊 Слушать';listen.disabled=!approvedClips(zh).length;
   listen.title=listen.disabled?'Точной MP3 пока нет':'Слушать утверждённую запись';
   listen.onclick=()=>{
    if(!['ready','results'].includes(phase)&&!(phase==='questions'&&pendingCorrection?.index===i)){$('day-review-status').textContent='Заверши текущий этап, чтобы не прерывать разговор.';return}
    stop();stopRecognition();speak([zh,py,ru]);
   };
   card.append(listen);root.append(card);
  }
 }
 function storeReviewCorrection(zh){
  if(!$('day-review-consent').checked)return;
  $('day-review-status').textContent=saveDayReview(reviewStorage,zh,true)?'Исправление сохранено.':'Не удалось сохранить исправление.';
  renderDayReview();
 }
 function resolveReviewCorrection(expected,answer){
  if($('day-review-consent').checked&&masterDayReview(reviewStorage,expected,answer,true))renderDayReview();
 }
 $('day-review-clear').onclick=()=>{
  if(!window.confirm('Удалить все личные карточки ошибок «Мой день» из этого браузера?'))return;
  closeReview();
  $('day-review-status').textContent=clearDayReview(reviewStorage)?'Карточки удалены.':'Не удалось удалить карточки.';
  renderDayReview();
 };
 renderDayReview();
 let chatCount=0;
 function addChatMessage(role,message){
   const content=String(message??'').trim();
   if(!content)return;
   chatCount++;
   chat.hidden=false;
   const container=$('day-chat-messages');
   const bubble=document.createElement('p');
   bubble.className='pg-day-chat-msg '+(role==='user'?'pg-day-chat-user':'pg-day-chat-panda');
   bubble.textContent=(role==='user'?'Ты: ':'Панда: ')+content;
   container.append(bubble);
   while(container.children.length>36)container.firstElementChild.remove();
   const label=$('day-chat-label');
   if(role==='user'){
     label.textContent='💬 Отправлено: '+(content.length>32?content.slice(0,32)+'…':content);
     label.title='Сообщение принято. Нажми, чтобы просмотреть историю переписки.';
   }
   if(chat.open)container.scrollTop=container.scrollHeight;
 }
 // In simple chat, only exact approved MP3s may play. No browser voice swaps.
 let lastChatLine=null, chatReview=null;
 const replayCommand=/^(?:请|麻烦你)?(?:你能)?(?:再说一遍|重复一遍|说慢一点|慢一点说)(?:吗)?$/u;
 function chatReplyTo(raw,{alreadyLogged=false}={}){
  const text=String(raw??'').trim();
  if(!text){status('Напиши вопрос или предложение на китайском.');return}
  stop();
  if(!alreadyLogged)addChatMessage('user',text);
  const words=norm(text);
  const repeat=replayCommand.test(words);
  if(repeat){
   if(!lastChatLine){status('Сначала задай Панде вопрос.');return}
   line(lastChatLine);
   void speak(lastChatLine,words.includes('慢'));
   return;
  }
  const chatAnswer=respondToPandaChat(text,chatContext);
  const dayQuestion=understandDayAnswer(text,0);
  let reply;
  if(dayQuestion.kind==='user-question'){
   const idx=dayQuestion.questionIndex;
   reply={line:STORY[round%2][[0,1,3,4,5][idx]],supported:true};
   chatContext={dayQuestion:idx};
  }else if(!chatAnswer.supported&&Number.isInteger(chatContext?.dayQuestion)&&understandDayAnswer(text,chatContext.dayQuestion).kind==='accepted'){
   const idx=chatContext.dayQuestion;
   reply={line:['好的，我明白了。','Hǎo de, wǒ míngbai le.','Хорошо, я поняла.'],supported:true};
   chatContext={dayQuestion:idx};
  }else{
   reply=chatAnswer;chatContext=reply.context;
  }
  if(reply.review&&!chatReview)chatReview={original:text,line:reply.line,tip:reply.review};
  lastChatLine=reply.line;
  addChatMessage('panda',reply.line[0]+' — '+reply.line[2]);
  line(reply.line);
  if(/^(?:再见|明天见|拜拜)$/u.test(words))showChatReview();
  status(reply.supported?'✓ Ответ Панды показан. Продолжай диалог.':
   '✓ Вопрос получен, но на эту тему пока нет подготовленного ответа.');
  if(approvedClips(reply.line[0]).length){
   void speak(reply.line);
  }else if(reply.supported){
   status('💬 Ответ текстом. Для этой фразы пока нет записи.');
  }
 }
 function showChatReview(){
  if(!chatReview)return;
  const {original,line,tip}=chatReview;
  addChatMessage('panda','Разбор: '+original+' → '+line[0]+' · '+line[1]+' · '+line[2]+' '+tip);
  chatReview=null;
 }
 function line(a){last=a;$('day-zh').textContent=a[0];$('day-py').textContent=a[1]||'';$('day-ru').textContent=a[2]||'';const repeat=$('day-hear');if(repeat){repeat.disabled=!approvedClips(a[0]).length;repeat.title=repeat.disabled?'Нет точной записи утверждённым голосом':'Повторить одобренную запись'};updateStoryPlayer()}
 function storyLines(){
  return phase==='story'||phase==='monologue'?STORY[round%2]:
    phase==='summary'?answers.filter(Boolean).map(x=>[x,'','Из твоего ответа']):[];
 }
 function updateStoryPlayer(){
  const lines=storyLines();
  const isQuestion=phase==='questions',isReview=phase==='monologue';
  const active=['story','summary','questions','monologue'].includes(phase);
  const current=isReview?reviewIndex:i;
  const total=isQuestion?5:lines.length;
  const count=isQuestion?'Вопрос '+(i+1)+' из 5':
    active?'Фраза '+Math.min(current+1,Math.max(1,total))+' из '+total:'';
  $('day-player-count').textContent=phase==='story'?'Слушай предложения и повторяй.':
    phase==='questions'?'Слушай вопросы, отвечай и повторяй.':
    phase==='summary'?'Повтори свой день по предложениям.':
    phase==='monologue'?'Подсказки к твоему рассказу.':'';
  $('day-progress-count').textContent=count;
  const dots=$('day-progress-dots');
  if(dots&&active){
    const buttons=[];
    for(let index=0;index<total;index++){
      const cls=index<current?'done':index===current?'current':'future';
      const label=(isQuestion?'Вопрос ':'Фраза ')+(index+1)+(cls==='current'?' — текущая':'');
      buttons.push('<button type="button" class="pg-day-progress-dot '+cls+'" data-index="'+index+
       '" aria-label="'+label+'" aria-current="'+(cls==='current'?'step':'false')+'"'+
       ((isQuestion&&index>i)?' disabled':'')+'><span>'+(cls==='done'?'✓':index+1)+'</span></button>');
    }
    dots.innerHTML=buttons.join('');
  }else if(dots) dots.replaceChildren();
  $('day-prev').disabled=!active||current<=0;
  $('day-next').disabled=!active||(isReview&&current>=lines.length-1);
  const targetLine=isQuestion?Q[i]?.[0]:isReview?lines[reviewIndex]?.[0]:last?.[0];
  $('day-repeat-sentence').disabled=!targetLine||!approvedClips(targetLine).length;
  $('day-repeat-sentence').textContent=isQuestion?'↻ Повтор вопроса':'↻ Повтор фразы';
  $('day-next').textContent=isQuestion?'▶▶ След.':'▶▶ След.';
  $('day-next').title=isQuestion?'Следующий вопрос (пропуск с подтверждением)':'Следующее предложение';
  const heading=$('day-story-player')?.querySelector('.pg-day-player-title strong');
  if(heading)heading.textContent=isQuestion?'📖 Режим вопросов Panda':'📖 Режим рассказа Panda';
 }
 function stagePhase(p){
  phase=p;stage.dataset.dayPhase=p;
   if(!safeReviewPhase()&&!$('day-review-exercise').hidden)closeReview();
  $('day-phase').textContent=({ready:'🐼 Мой день',intro:'🐼 Приветствие',story:'🐼 История Панды',questions:'🐼 Вопросы',summary:'🐼 Твой день',monologue:'👤 Расскажи сам',freechat:'💬 Разговор',results:'🏆 Итоги'}[p]);
  // The step counter belongs in the progress strip, as in approved photo 2.
  $('day-step').textContent='HSK 2';
  const show=(id,on)=>$(id).hidden=!on;
  show('day-start',p==='ready');show('day-hear',!['ready','results'].includes(p));
  show('day-pause',['story','summary','questions','monologue'].includes(p));
  show('day-hint',['story','questions','summary','monologue','freechat'].includes(p));
  show('day-finish',p==='monologue');show('day-retry',p==='results');
  show('day-story-player',['story','summary','questions','monologue'].includes(p));
  show('day-speed-wrap',['story','summary','questions','monologue'].includes(p));
  show('day-input',['questions','freechat'].includes(p));show('day-send',['questions','monologue','freechat'].includes(p));
  show('day-long',p==='monologue');show('day-mic',['questions','monologue','freechat'].includes(p));
  show('day-answer-primary',['questions','freechat'].includes(p));
  syncRetry();
  $('day-input').placeholder=p==='freechat'?'Напиши вопрос по-китайски…':'Ответ на китайском…';
  chatModeButton.setAttribute('aria-pressed',String(p==='freechat'));
  chatModeButton.title=p==='freechat'?'Вернуться к уроку':'Свободный разговор';
  chatModeButton.setAttribute('aria-label',chatModeButton.title);
  $('day-pause').textContent='Ⅱ';
  $('day-pause').setAttribute('aria-label','Пауза');
  $('day-pause').title='Пауза';
  updateStoryPlayer();
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
     let ended=false,active=null,stallTimer=null;
     const clearStall=()=>{clearTimeout(stallTimer);stallTimer=null};
     const done=()=>{
       if(ended)return;
       ended=true;clearStall();
       if(player===active){player=null;if(token===sequence)stage.dataset.dayTalking='false'}
       resolve();
     };
     function next(k){
       if(token!==sequence){done();return}
       clearStall();
       if(k>=candidates.length){
         missingAudio.add(norm(a[0]));
         status('🔇 Исходная запись пока не доступна. Другой голос не подставляется.');
         done();return;
       }
       const audio=new Audio(candidates[k]);
       active=audio;player=audio;audio.preload='auto';
       audio.playbackRate=slow?Math.max(0.60,playbackRate*0.85):playbackRate;
       if('preservesPitch' in audio)audio.preservesPitch=true;
       stage.dataset.dayTalking='true';
       // A stalled or blocked MP3 must never leave Panda "speaking" forever.
       const watchStall=()=>{
         if(ended||token!==sequence||active!==audio||stallTimer)return;
         stallTimer=setTimeout(()=>{
           if(ended||token!==sequence||active!==audio)return;
           missingAudio.add(norm(a[0]));
           status('🔇 Запись не воспроизводится. Нажми «Повторить» или проверь интернет.');
           try{audio.pause()}catch(_){}
           done();
         },10000);
       };
       audio.onplaying=clearStall;
       audio.onwaiting=watchStall;
       audio.onstalled=watchStall;
       audio.onended=done;
       audio.onpause=()=>{if(token!==sequence)done()};
       audio.onerror=()=>next(k+1);
       watchStall();
       audio.play().catch(err=>{
         if(ended||token!==sequence||active!==audio)return;
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
   // A grammar correction must never be silently skipped by a timeout.
   if(pendingCorrection?.index===i)return;
   silence=setTimeout(async()=>{
   if(phase!=='questions'||i!==idx||recognizer)return;
   // Never auto-skip while the student is typing/editing an answer.
   if($('day-input').value.trim()||document.activeElement===$('day-input')){
     status('✍️ Текст в поле сохранён. Нажми стрелку или «Ответить», чтобы отправить.');
     return;
   }
   if(attempt===0){attempt++;status('Панда повторит вопрос медленнее. Это не оценка произношения.');const token=sequence;await speak(['我没听清楚，请再说一遍。','Wǒ méi tīng qīngchu, qǐng zài shuō yí biàn.','Я не расслышала, повтори, пожалуйста.']);if(token!==sequence)return;await delay(200);if(token!==sequence)return;await speak(Q[i].slice(0,3),true);if(token===sequence)countdown()}
   else if(attempt===1){attempt++;status('Подсказка: '+Q[i][3]);countdown()}
   else if(attempt===2){attempt++;status('Пример: '+Q[i][4]+' Ты можешь ответить иначе.');countdown()}
   else{notes.push('Вопрос '+(i+1)+' пропущен.');ask(i+1)}
  },8000);
 }
 async function ask(idx){
  stop();paused=false;i=idx;attempt=0;pendingCorrection=null;
  if(idx===5){finishQuestions();return}
  stagePhase('questions');line(Q[idx].slice(0,3));status('Ответь свободно. Тоны по тексту не оцениваются.');
  const token=++sequence;await speak(Q[idx]);if(token===sequence)countdown();
 }
 async function answer(raw){
  if(phase==='freechat'){
   const text=String(raw??'').trim();chatReplyTo(text);
   if(text)$('day-input').value='';
   return;
  }
  if(phase!=='questions'){status('Начни вопросы, чтобы отправить ответ.');return}
  const submitted=String(raw??'').trim();
  if(!submitted){status('Поле пустое. Напиши или произнеси свой ответ.');return}
  const idx=i;
  const reciprocal=/你呢[？?。！!\s]*$/u.test(submitted);
  const statement=reciprocal?submitted.replace(/[，,。！？!?\s]*你呢[？?。！!\s]*$/u,''):submitted;
  const result=reciprocal&&!statement?{kind:'user-question',questionIndex:idx}:understandDayAnswer(statement,idx);
  stop(); // Stop pending audio/timeout so a late callback cannot erase the reply.
  addChatMessage('user',submitted);
  if(result.kind==='user-question'){
   // Answer only factual questions already covered by the approved Panda story.
   $('day-input').value='';
   const story=STORY[round%2],reply=story[[0,1,3,4,5][result.questionIndex]];
   line(reply);
   addChatMessage('panda',reply[0]+' — '+reply[2]);
   status('✓ Вопрос отправлен. Панда отвечает по своему дню.');
   const token=sequence;
   (async()=>{
    await speak(reply);if(token!==sequence)return;
    await delay(500);if(token!==sequence)return;
    line(Q[idx].slice(0,3));
    status('Теперь твоя очередь: '+Q[idx][2]);
    await speak(Q[idx].slice(0,3));
    if(token===sequence)countdown();
   })();
   return;
  }
  if(result.kind==='accepted'){
   answers[idx]=result.value;$('day-input').value='';if(pendingCorrection?.index===idx)resolveReviewCorrection(pendingCorrection.line[0],result.value);pendingCorrection=null;syncRetry();
   line([result.value,'','Твой ответ']);
   addChatMessage('panda','✓ '+result.message);
   status('✓ Ответ отправлен и принят. '+result.message);
   const token=++sequence;
   if(reciprocal){
    const reply=STORY[round%2][[0,1,3,4,5][idx]];
    addChatMessage('panda',reply[0]+' — '+reply[2]);line(reply);
    await speak(reply);
   }
   if(token===sequence)setTimeout(()=>{if(token===sequence)ask(idx+1)},reciprocal?2200:1100);
   return;
  }
  if(result.kind==='correct'){
   if(!notes.includes('Исправление: '+result.correction))notes.push('Исправление: '+result.correction);
   if(!errors.includes(result.correction))errors.push(result.correction);
   const correctionLine=getDayCorrectionLine(result.correction);
    pendingCorrection={index:idx,line:correctionLine,message:result.message};
    storeReviewCorrection(correctionLine[0]);
    $('day-input').value='';syncRetry();line(correctionLine);
    const response='💡 '+result.message+' Правильно: '+correctionLine.filter(Boolean).join(' — ');
    addChatMessage('panda',response);
    status(result.message+' Введи или произнеси исправленный ответ.'+(approvedClips(correctionLine[0]).length?'':' Точной MP3 пока нет.'));
    // Stay on this question until a new answer is accepted or the learner explicitly skips.
    if(approvedClips(correctionLine[0]).length)speak(correctionLine);
    else missingAudio.add(norm(correctionLine[0]));
   return;
  }
  if(result.kind==='other-question'){
   $('day-input').value='';chatReplyTo(submitted,{alreadyLogged:true});
   // Do not skip the active curriculum question.
   return;
  }
  // Even unrecognized phrases remain visible in chat. Preserve editable text.
  addChatMessage('panda',result.message);
  status('✓ Сообщение отправлено. '+result.message);
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
  stop();paused=false;reviewIndex=0;monologueSent=[];stagePhase('monologue');
  const prompt=['现在请你说说你的一天。','Xiànzài qǐng nǐ shuōshuo nǐ de yì tiān.','Теперь расскажи о своём дне.'];
  line(prompt);
  status('Говори несколько предложений подряд или введи текст. Не нужно повторять слова Панды.');
  $('day-long').value='';
  speak(prompt);
 }
 function finish(){
  const pending=$('day-long').value.trim();
  if(pending)addChatMessage('user',pending);
  const text=[...monologueSent,pending].filter(Boolean).join('。').trim();
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
   if(recognizer!==r)return;
   let text='',confidence=null;
   for(let j=e.resultIndex;j<e.results.length;j++){
     if(!e.results[j].isFinal)continue;
     text+=(e.results[j][0]?.transcript||'')+' ';
     const score=e.results[j][0]?.confidence;
     if(typeof score==='number'&&score>0)confidence=confidence===null?score:Math.min(confidence,score);
   }
   text=text.trim();
   if(!text)return;
   if(phase==='questions'||phase==='freechat'){
     // Recognition is a draft transcript, NOT verified pronunciation or permission
     // to advance the lesson. Never auto-submit even a high-confidence ASR result.
     stopRecognition();
     $('day-input').value=text;
     status(confidence!==null&&confidence<0.65
       ?'⚠️ Распознано неуверенно: '+text+'. Проверь или исправь текст и нажми «Ответить». Тоны не оценивались.'
       :'🎙 Распознано: '+text+'. Проверь текст и нажми «Ответить». Тоны не оценивались.');
     return;
   }
   if(phase==='monologue'){
     $('day-long').value+=($('day-long').value.trim()?'。':'')+text;
     status('Продолжай рассказ. После окончания нажми «Завершить рассказ». Тоны не оценивались.');
   }
  };
  r.onerror=e=>{if(recognizer!==r)return;stopRecognition();status('Микрофон или распознавание: '+(e.error||'сбой')+'. Можно ответить текстом. Это НЕ означает ошибку в произношении.');};
  r.onend=()=>{if(recognizer!==r)return;recognizer=null;if(phase==='questions')status('Распознавание закончилось. Повтори 🎙 или напиши ответ — вопрос не пропущен.');};
  try{r.start()}catch(_){recognizer=null;status('Не удалось включить микрофон. Проверь разрешение Chrome или напиши ответ.')}
 }
 function setSpeedFromSlider(){
   const range=$('day-speed'),chosen=Number(range.value);
   if(![0.75,1,1.25].includes(chosen))return;
   playbackRate=chosen;
   const label=chosen.toString().replace('.',',');
   $('day-speed-value').textContent=label+'×';
   range.style.setProperty('--day-speed-progress',((chosen-0.75)/0.50*100)+'%');
   range.setAttribute('aria-valuetext',label+' раза');
   if(player&&!player.paused)player.playbackRate=chosen;
 }
 $('day-speed').addEventListener('input',setSpeedFromSlider);
 $('day-speed').addEventListener('change',setSpeedFromSlider);
 setSpeedFromSlider();
 chatModeButton.onclick=()=>{
  if(phase!=='freechat'){
   stop();stopRecognition();
   lastChatLine=null;chatReview=null;chatContext=null;
   chatResume={phase,idx:i,last,lastInput:$('day-input').value,lastLong:$('day-long').value};
   $('day-input').value='';
   stagePhase('freechat');
   line(['自由聊天','Zìyóu liáotiān','Простой разговор: имя, увлечения, еда, учёба и повседневные дела.']);
   status('Начни с 早上好 — «Доброе утро». Для повтора скажи 请再说一遍, для замедления — 请说慢一点.');
   chat.open=true;
   $('day-input').focus();return;
  }
  stop();stopRecognition();
  showChatReview();
  const saved=chatResume;chatResume=null;
  const restore=saved?.phase||'ready';
  if(restore==='questions'){
   i=saved.idx;stagePhase('questions');
   line(pendingCorrection?.index===i?pendingCorrection.line:Q[i].slice(0,3));$('day-input').value=saved.lastInput||'';
    status(pendingCorrection?.index===i?pendingCorrection.message+' Повтори исправленный ответ.':'Вернулись к вопросу '+(i+1)+' из 5. Можно повторить вопрос или ответить.');
  }else if(restore==='monologue'){
   stagePhase('monologue');line(saved.last||['我的一天','Wǒ de yì tiān','Мой день.']);
   $('day-long').value=saved.lastLong||'';status('Твой рассказ сохранён. Продолжай.');
  }else{
   stagePhase('ready');line(['我的一天','Wǒ de yì tiān','Мой день.']);
   status('Нажми «Начать», чтобы пройти урок «Мой день».');
  }
 };
 $('day-start').onclick=begin;
 $('day-send').onclick=()=>{
   if(phase==='questions'||phase==='freechat'){answer($('day-input').value);return}
   if(phase==='monologue'){
    const el=$('day-long'),raw=el.value.trim();
    if(!raw){status('Скажи или напиши хотя бы одну фразу.');return}
    // The arrow is a real "send" action, not an invisible punctuation edit.
    const isQuestion=/[?？]$/.test(raw)||/^(?:你|您|什么|为什么|怎么|哪里|哪儿)/u.test(raw);
    addChatMessage('user',raw);
    el.value='';
    if(isQuestion){
     chatReplyTo(raw,{alreadyLogged:true});
    }else{
      monologueSent.push(raw);
      addChatMessage('panda','Фраза получена. Продолжай или нажми «Завершить рассказ».');
      status('✓ Фраза отправлена. Можно продолжить или завершить рассказ.');
    }
    el.focus();
   }
 };
 $('day-answer-primary').onclick=()=>answer($('day-input').value);
 $('day-input').onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();answer($('day-input').value)}};
 $('day-input').addEventListener('input',()=>{clearTimeout(silence);if(phase==='questions'&&$('day-input').value.trim())status('✍️ Напечатано. Нажми стрелку или «Ответить», чтобы отправить.')});
 $('day-mic').onclick=mic;
 $('day-hear').onclick=async()=>{
  const clip=last,mode=phase,position=i;
  if(!clip)return;
  if(mode==='story'||mode==='summary'){paused=false;$('day-pause').textContent='Ⅱ';$('day-pause').setAttribute('aria-label','Пауза')}
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
  else if(phase==='freechat')status('💡 Спроси: 你喜欢什么？ / 你叫什么名字？ / 你在做什么？ / 你喜欢吃什么？');
  else status('💡 起床 → 洗脸 → 刷牙 → 吃早饭 → 去上班 → 睡觉');
 };
 $('day-prev').onclick=()=>seekStory(-1);
 $('day-next').onclick=()=>seekStory(1);
 // Progress dots are functional: tap any completed or current step to replay.
 $('day-progress-dots').addEventListener('click',event=>{
  const dot=event.target.closest('button[data-index]');
  if(!dot||dot.disabled)return;
  const index=Number(dot.dataset.index);
  if(!Number.isInteger(index))return;
  if(phase==='story'||phase==='summary'){
    const lines=storyLines();
    if(index>=0&&index<lines.length){stop();paused=false;playList(lines,phase,index)}
  }else if(phase==='questions'){
    if(index>=0&&index<=i){$('day-input').value='';ask(index)}
  }else if(phase==='monologue'){
    if(index>=0&&index<storyLines().length)reviewExample(index);
  }
 });
 $('day-repeat-sentence').onclick=()=>{
  if(phase==='questions'){replayQuestion();return}
  if(phase==='monologue'){reviewExample(reviewIndex);return}
  $('day-hear').click();
 };
 $('day-finish').onclick=finish;
 async function replayQuestion(){
  if(phase!=='questions')return;
  stop();paused=false;
  const current=pendingCorrection?.index===i?pendingCorrection.line:Q[i].slice(0,3);
   line(current);
   status(pendingCorrection?.index===i?'Повтори исправленный ответ.':'🔊 Слушай вопрос ещё раз, затем ответь.');
   const token=sequence;
   if(pendingCorrection?.index===i&&!approvedClips(current[0]).length){status('Повтори исправленный ответ. Точной MP3 пока нет.');return}
   await speak(current);
   if(token===sequence)countdown();
 }
 async function reviewExample(n){
  if(phase!=='monologue')return;
  const lines=STORY[round%2];
  reviewIndex=Math.max(0,Math.min(n,lines.length-1));
  stop();paused=false;updateStoryPlayer();
  line(lines[reviewIndex]);
  status('🔊 Образец Панды: повтори эту фразу, затем продолжи свой рассказ.');
  await speak(lines[reviewIndex]);
 }
 function seekStory(delta){
  const mode=phase;
  if(mode==='questions'){
   if(delta<0){if(i>0){$('day-input').value=answers[i-1]?.replace(/。$/,'')||'';ask(i-1)}}
   else if(window.confirm('Пропустить этот вопрос? Ответ не будет придуман.')){
    if(!answers[i])notes.push('Вопрос '+(i+1)+' пропущен.');
    $('day-input').value='';
    ask(i+1);
   }
   return;
  }
  if(mode==='monologue'){reviewExample(reviewIndex+delta);return}
  if(mode!=='story'&&mode!=='summary')return;
  const lines=storyLines(),next=i+delta;
  if(next<0)return;
  stop();paused=false;$('day-pause').textContent='Ⅱ';
  $('day-pause').setAttribute('aria-label','Пауза');
  if(next>=lines.length){if(mode==='story')ask(0);else monologue();return}
  playList(lines,mode,next);
 }
 $('day-pause').onclick=()=>{
  const mode=phase;
  if(!['story','summary','questions','monologue'].includes(mode))return;
  if(!paused){
   paused=true;stop();$('day-pause').textContent='▶';
   $('day-pause').setAttribute('aria-label','Продолжить');
   $('day-pause').title='Продолжить';
   status(mode==='questions'?'Вопрос на паузе. Нажми «Продолжить», когда готов.':
    'Пауза. Нажми «Продолжить» или «Повтор фразы».');
  }else{
   paused=false;$('day-pause').textContent='Ⅱ';
   $('day-pause').setAttribute('aria-label','Пауза');
   $('day-pause').title='Пауза';
   if(mode==='questions')replayQuestion();
   else if(mode==='monologue')reviewExample(reviewIndex);
   else playList(storyLines(),mode,i);
  }
 };
 $('day-retry').onclick=async()=>{
   stop();const token=sequence;
   await speak(['我们再试一次。','Wǒmen zài shì yí cì.','Давай попробуем ещё раз.']);
   if(token!==sequence)return;
   round++;answers=Array(5).fill(null);notes=[];errors=[];spoken=[];i=0;pendingCorrection=null;transcript.hidden=true;begin();
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
