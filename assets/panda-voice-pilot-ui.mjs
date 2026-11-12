import {withPracticeGreeting,GREETINGS,adjacentConversation} from './panda-live-greetings.mjs?v=live7';
import {lookupPilotAudio} from './panda-live-audio.mjs?v=live6';
import {verifyAnswerFor} from './panda-voice-pilot-engine.mjs?v=live6';
import {CONVERSATIONS,selectConversation,missingConversationAudio} from './panda-live-lessons.mjs?v=live6';
import {ENVELOPES} from './panda-live-envelope.mjs?v=live6';
import {createPandaRig} from './panda-live-rig.mjs';
import {prepareConversation,interpretUtterance,replyToExtraSpeech,howAreYou,extraExamples} from './panda-live-conversation-v266.mjs?v=266';
import {answerCurriculumQuestion} from './panda-curriculum-tutor.mjs';
import {validatedVariants,readMistakes,noteMistake,hardestMistake,clearReviewedMistake} from './panda-live-practice.mjs?v=265';
import {accessibleLessons,nextPrompt,answerNonStop} from './panda-nonstop-v267.mjs?v=267';
const baseConversation=prepareConversation(selectConversation(window.location.search),new window.Date());
const GREETING_CYCLE_KEY='pg-panda-live-practice-greeting-v1';
let fallbackGreetingIndex=0;
function nextGreetingIndex(){
 const fallback=fallbackGreetingIndex++%GREETINGS.length;
 try{
  const raw=window.localStorage.getItem(GREETING_CYCLE_KEY);
  const number=raw===null?fallback:Number(raw);
  const index=Number.isInteger(number)&&number>=0?number%GREETINGS.length:fallback;
  window.localStorage.setItem(GREETING_CYCLE_KEY,String((index+1)%GREETINGS.length));
  return index;
 }catch{return fallback}
}
let conversation=withPracticeGreeting(baseConversation,nextGreetingIndex());
let PILOT_LINES=conversation.lines;
const REPLIES=conversation.replies;
const $=id=>document.getElementById(id);
const rig=createPandaRig($('character'),$('panda-canvas'));
const state={step:0,done:false,busy:false,active:false,recognition:null,epoch:0,audio:null,typing:false,watchdog:null,transition:null,poseTimer:null,slow:false,reviewStep:null,transientReply:null,mode:'short',nonstopAllowed:[],nonstopCursor:0,nonstopPrompt:null,nonstopDisplay:null};
const curriculum=window.PANDA_HSK1_FOUNDATIONS||[];
const storage=(()=>{try{return window.localStorage}catch{return null}})();
let audioFrame=0;
const supported=()=>!!(window.SpeechRecognition||window.webkitSpeechRecognition);
const audioFor=lookupPilotAudio;
const current=()=>state.mode==='nonstop'?(state.nonstopDisplay||state.nonstopPrompt?.line||PILOT_LINES[0]):(state.transientReply||(state.done?REPLIES[state.branch]:PILOT_LINES[state.step]));
const activeLesson=()=>state.mode==='nonstop'?(state.nonstopPrompt?.line?.lesson||conversation.id):conversation.id;
function note(text){$('status').textContent=text}
function pose(value){clearTimeout(state.poseTimer);rig.setState(value)}
function brief(value){pose(value);state.poseTimer=setTimeout(()=>pose('idle'),value==='retry'?2600:1300)}
function clearWatchdog(){clearTimeout(state.watchdog);state.watchdog=null}
function stopAudio(){
 const a=state.audio;state.audio=null;window.cancelAnimationFrame(audioFrame);
 if(a){a.onplaying=a.onended=a.onerror=a.onpause=a.onwaiting=null;a.pause()}
 $('hear').classList.remove('playing');rig.setLevel(0);
 if($('character').dataset.state==='talking')pose('idle');
}
function stopRecognition(){
 clearWatchdog();state.epoch++;const r=state.recognition;state.recognition=null;state.active=false;
 if(r){r.onstart=r.onresult=r.onnomatch=r.onerror=r.onend=null;try{r.abort()}catch{}}
 if($('character').dataset.state==='listening')pose('idle');
}

function refreshReview(){
 const entries=readMistakes(storage).filter(x=>x.lesson===conversation.id);
 $('review-count').textContent=entries.length?'Для повтора: '+entries.length+' фраз':'Ошибок для повторения нет';
 $('review').disabled=!entries.length;
}
function renderVariants(){
 const root=$('variant-choices');root.replaceChildren();
 $('variant-hint').textContent='';
 for(const variant of validatedVariants(conversation.id,state.step,PILOT_LINES)){
  const button=document.createElement('button');
  button.type='button';button.textContent=variant;button.setAttribute('aria-pressed','false');
  button.addEventListener('click',()=>{
   root.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===button)));
   $('variant-hint').textContent='Попробуй самостоятельно произнести: '+variant+'. Панда проверяет распознанный текст, не правильность акустических тонов.';
  });
  root.appendChild(button);
 }
 $('answer-variants').hidden=state.mode==='nonstop'||!root.children.length;
}
function updateSpeed(){
 $('speed-toggle').setAttribute('aria-pressed',String(state.slow));
 $('speed-toggle').textContent=state.slow?'🐢 0,8×':'▶ 1×';
 $('speed-toggle').title=state.slow?'Вернуться к обычной скорости':'Слушать медленнее';
 if(state.audio)state.audio.playbackRate=state.slow?0.8:1;
}
function explainQuestion(question){
 const reply=answerCurriculumQuestion(question,activeLesson(),curriculum);
 $('knowledge-answer').textContent=reply;
 $('knowledge-answer').hidden=false;
 if(!state.active&&!state.audio)brief('happy');
}
function refreshKnowledgePrompts(){
 $('knowledge-answer').hidden=true;
 $('knowledge-answer').textContent='';
 const list=$('knowledge-prompts');list.replaceChildren();
 const topic=curriculum[activeLesson()-1];
 const questions=['Объясни грамматику','Покажи диалог'];
 if(topic?.words?.[0]?.[0])questions.unshift('Что означает '+topic.words[0][0]+'?');
 for(const question of questions){
  const button=document.createElement('button');button.type='button';button.textContent=question;
  button.addEventListener('click',()=>{$('knowledge-question').value=question;explainQuestion(question)});
  list.appendChild(button);
 }
}


function addLearnerTranscript(input,interpreted){
 if(!input)return;
 const box=$('learner-transcript');box.hidden=false;
 const row=document.createElement('div');row.className='learner-item';
 const title=document.createElement('strong');title.textContent='Ты сказал: '+input;row.append(title);
 if(interpreted?.known){
  const py=document.createElement('span');py.className='learner-pinyin';py.textContent=interpreted.pinyin;row.append(py);
 }
 const ru=document.createElement('span');
 ru.className='learner-ru'+(!interpreted?.known?' unverified':'');
 ru.textContent=interpreted?.known?'Перевод: '+interpreted.translation:'Перевод не подтверждён материалами этого урока';
 row.append(ru);box.append(row);
 while(box.childElementCount>6)box.firstElementChild.remove();
 box.scrollTop=box.scrollHeight;
}
function addFollowupMessage(speaker,text,ru){
 const list=$('followup-history');const entry=document.createElement('article');
 const who=document.createElement('strong');who.textContent=speaker;
 const content=document.createElement('span');
 content.textContent=text+(ru?'\n'+ru:'');
 entry.append(who,content);list.append(entry);
 while(list.childElementCount>8)list.firstElementChild.remove();
 list.scrollTop=list.scrollHeight;
}
function buildFollowupSuggestions(){
 const root=$('followup-suggestions');root.replaceChildren();
 for(const example of extraExamples(conversation.id)){
  const btn=document.createElement('button');btn.type='button';btn.textContent=example;
  btn.addEventListener('click',()=>{$('followup-input').value=example;$('followup-input').focus()});
  root.append(btn);
 }
}
function handleFollowup(raw){
 const input=String(raw||'').trim();stopRecognition();stopAudio();
 if(!input){note('Не расслышала. Попробуй ещё раз.');refresh();return}
 const outcome=replyToExtraSpeech(input,conversation.id,curriculum);
 addLearnerTranscript(input,outcome.understood);
 addFollowupMessage('Ты: '+input,'',outcome.understood.known?'Перевод: '+outcome.understood.translation:'Перевод пока не проверен');
 $('followup-input').value='';
 if(!outcome.answer){
  addFollowupMessage('🐼 Панда:',outcome.help,'');
  note('Пока доступны только проверенные темы урока.');
  refresh();return;
 }
 state.transientReply=outcome.answer;
 render();addFollowupMessage('🐼 Панда:',outcome.answer.hanzi,outcome.answer.ru);
 note('Продолжай! Можешь спросить ещё раз или назвать другую фразу из урока.');
 if(audioFor(current()?.audioKey))play();
}


function nonstopEntry(who,hanzi,secondary='',fromLearner=false){
 const box=$('nonstop-history'),entry=document.createElement('article');entry.className=fromLearner?'from-learner':'from-panda';
 const label=document.createElement('strong');label.textContent=who;entry.append(label);
 const message=document.createElement('span');message.textContent=hanzi+(secondary?'\n'+secondary:'');entry.append(message);box.append(entry);
 while(box.childElementCount>24)box.firstElementChild.remove();
 box.scrollTop=box.scrollHeight;
}
function refreshNonstopTopics(){
 const root=$('nonstop-topics');root.replaceChildren();
 for(const id of state.nonstopAllowed){
  const topic=CONVERSATIONS.find(x=>x.id===id);
  const badge=document.createElement('span');badge.className=id===activeLesson()?'current':'';
  badge.textContent=(id===conversation.id?'📖 ':'✓ ')+id+'. '+(topic?.theme||'Урок');
  root.append(badge);
 }
}
function askNextNonstop(){
 if(state.mode!=='nonstop')return;
 clearTimeout(state.transition);stopRecognition();stopAudio();
 const selected=nextPrompt(CONVERSATIONS,state.nonstopAllowed,state.nonstopCursor,new Date());
 if(!selected){
  $('nonstop-feedback').textContent='Нет подтверждённых голосовых вопросов для выбранных уроков.';return;
 }
 state.nonstopPrompt=selected;state.nonstopCursor=selected.nextIndex;state.nonstopDisplay=selected.line;
 refreshNonstopTopics();render();
 nonstopEntry('🐼 Панда · урок '+selected.line.lesson,selected.line.hanzi,selected.line.pinyin+' — '+selected.line.ru);
 $('nonstop-feedback').textContent='Отвечай или задавай собственный вопрос из изученного материала.';
 if(audioFor(current()?.audioKey))play();
}
function handleNonstop(raw){
 const input=String(raw||'').trim();stopRecognition();stopAudio();
 if(state.mode!=='nonstop')return;
 const result=answerNonStop(input,state.nonstopAllowed,state.nonstopPrompt?.line,curriculum,new Date());
 if(result.kind==='empty'){$('nonstop-feedback').textContent=result.message;refresh();return;}
 $('nonstop-input').value='';
 if(result.kind==='unknown'){
  nonstopEntry('🐼 Подсказка',result.message);
  $('nonstop-feedback').textContent='Не выдумываем ответы вне проверенной базы.';
  brief('retry');refresh();return;
 }
 const understood=result.spoken?.known?result.spoken.translation:'Перевод не подтверждён базой уроков.';
 nonstopEntry('Ты сказал',input,understood,true);
 if(result.kind==='question'){
  state.nonstopDisplay=result.reply;render();
  nonstopEntry('🐼 Панда',result.reply.hanzi,result.reply.pinyin+' — '+result.reply.ru);
  $('nonstop-feedback').textContent='Можешь продолжать говорить или перейти к следующему вопросу.';
  if(audioFor(current()?.audioKey))play();
  return;
 }
 if(result.kind==='answer'||result.kind==='statement'){
  $('nonstop-feedback').textContent='Хорошо! Продолжаем разговор.';
  askNextNonstop();return;
 }
}
function setDialogueMode(mode){
 if(!['short','nonstop'].includes(mode)||state.mode===mode)return;
 clearTimeout(state.transition);stopAudio();stopRecognition();state.mode=mode;
 for(const name of ['short','nonstop']){
  const active=mode===name,button=$('mode-'+name);
  button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
 }
 if(mode==='nonstop'){
  state.nonstopAllowed=accessibleLessons(storage,conversation.id);
  state.nonstopCursor=Math.max(0,state.nonstopAllowed.indexOf(conversation.id));
  state.nonstopPrompt=null;state.nonstopDisplay=null;
  $('nonstop-history').replaceChildren();$('nonstop-feedback').textContent='';
  askNextNonstop();
 }else{
  state.nonstopPrompt=null;state.nonstopDisplay=null;
  restart(false);
 }
 render();
}

function recovery(text){$('voice-recovery').hidden=false;note(text);refresh()}
function refresh(){
 const isNonStop=state.mode==='nonstop';
 $('conversation').hidden=isNonStop||state.done;
 $('completed').hidden=isNonStop||!state.done;
 $('nonstop-panel').hidden=!isNonStop;
 document.querySelector('.bars').style.display=isNonStop?'none':'';
 $('nonstop-mic').disabled=!isNonStop||state.busy||!supported();
 $('nonstop-mic').setAttribute('aria-pressed',String(isNonStop&&state.active));
 $('nonstop-mic').textContent=isNonStop&&state.active?'■':'🎙';

 $('step').textContent=isNonStop?'∞ Разговор без лимита':(state.done?'Готово':`${state.step+1} из ${PILOT_LINES.length}`);
 document.querySelectorAll('.bar').forEach((bar,index)=>bar.classList.toggle('on',state.done||index<=state.step));
 $('mic').disabled=state.done||state.busy||!supported();
 $('followup-mic').disabled=!state.done||state.busy||!supported();
 $('followup-mic').setAttribute('aria-pressed',String(state.active&&state.done));
 $('followup-mic').textContent=state.active&&state.done?'■ Стоп':'🎙 Говорить';
 $('mic').setAttribute('aria-pressed',String(state.active));$('mic').textContent=state.active?'■':'🎙';
 $('mic-caption').textContent=state.active?'Слушаю…':supported()?'Ответь голосом':'Ответь текстом';
 $('type-toggle').setAttribute('aria-expanded',String(state.typing));$('typing').hidden=!state.typing||state.done;
 $('send').disabled=state.busy;
 const src=audioFor(current()?.audioKey);$('hear').hidden=!src;$('hear').disabled=!src||state.busy;$('audio-note').hidden=!!src;
 refreshReview();updateSpeed();
}
function render(){
 const line=current();$('phrase').textContent=line.hanzi||line.panda;$('pinyin').textContent=line.pinyin;$('translation').textContent=line.ru;
 renderVariants();refresh();
}
function play(){
 const src=audioFor(current()?.audioKey);
 if(!src){note('Запись этой фразы пока недоступна.');return}
 stopRecognition();stopAudio();refresh();
 const a=new Audio(new URL(src,document.baseURI).href);state.audio=a;a.preload='auto';a.playbackRate=state.slow?0.8:1;if('preservesPitch' in a)a.preservesPitch=true;
 const envelope=ENVELOPES[src];
 const valid=()=>state.audio===a;
 const animate=()=>{
  if(!valid()||a.paused||a.ended)return;
  const level=envelope?envelope.levels[Math.floor(a.currentTime/envelope.binSeconds)]||0:.5+.5*Math.sin(a.currentTime*23);
  rig.setLevel(level);audioFrame=window.requestAnimationFrame(animate);
 };
 // "playing", not "play": buffered / rejected playback never animates speech.
 a.onplaying=()=>{if(valid()){pose('talking');$('hear').classList.add('playing');note('Слушай Панду…');window.cancelAnimationFrame(audioFrame);animate()}};
 a.onwaiting=()=>{if(valid()){window.cancelAnimationFrame(audioFrame);pose('idle');$('hear').classList.remove('playing');note('Загружаю звук…')}};
 a.onpause=()=>{if(valid()){window.cancelAnimationFrame(audioFrame);pose('idle');$('hear').classList.remove('playing')}};
 a.onended=()=>{if(valid()){stopAudio();note('')}};
 a.onerror=()=>{if(valid()){stopAudio();note('MP3 не загрузился. Проверь интернет и попробуй ещё раз.')}};
 a.play().catch(error=>{if(valid()){stopAudio();note(`Звук не запустился (${error?.name||'ошибка'}). Нажми динамик ещё раз.`)}});
}
function restart(nextGreeting=false,reviewStep=null){
 clearTimeout(state.transition);stopAudio();stopRecognition();pose('idle');
 if(nextGreeting){
  conversation=withPracticeGreeting(baseConversation,nextGreetingIndex());
  PILOT_LINES=conversation.lines;
 }
 Object.assign(state,{step:Number.isInteger(reviewStep)?reviewStep:0,reviewStep,done:false,busy:false,typing:false,branch:'short',transientReply:null});
 $('heard').textContent='';$('answer').value='';$('followup-input').value='';$('followup-history').replaceChildren();$('learner-transcript').replaceChildren();$('learner-transcript').hidden=true;$('voice-recovery').hidden=true;note('');render();
 if(!supported())recovery('В этом браузере распознавание недоступно. Открой страницу в Chrome или нажми «Написать».');
}
function checkAnswer(raw){
 if(state.done||state.busy)return;
 const input=String(raw||'').trim();stopRecognition();stopAudio();
 const interpreted=interpretUtterance(input,conversation.id,curriculum);
 if(input)addLearnerTranscript(input,interpreted);
 $('heard').textContent=input?'Ты: '+input+(interpreted.known?' · '+interpreted.translation:''):'';
 if(howAreYou(input)){
  const phrase=replyToExtraSpeech(input,conversation.id,curriculum);
  state.transientReply=phrase.answer;
  render();note('🐼 Панда ответила на вопрос «Как дела?». Можешь продолжить учебную реплику.');
  if(audioFor(current()?.audioKey))play();return;
 }
 const result=verifyAnswerFor(PILOT_LINES,state.step,input);
 if(!result.ok){
  state.transientReply=null;
  if(input)noteMistake(storage,conversation.id,state.step);
  refreshReview();brief('retry');note(input?'Не совсем. '+PILOT_LINES[state.step].instruction:'Не расслышала. Повтори ещё раз.');refresh();
  // Repeat the exact question clip from the same uploaded voice.
  if(audioFor(current().audioKey))state.transition=setTimeout(()=>{play();note(result.message)},3200);
  return;
 }
 state.transientReply=null;
 if(state.reviewStep===state.step){clearReviewedMistake(storage,conversation.id,state.step);state.reviewStep=null;}
 clearTimeout(state.transition);brief('happy');state.busy=true;note('Верно!');refresh();
 state.transition=setTimeout(()=>{
  state.busy=false;state.step++;
  if(state.step>=PILOT_LINES.length){
   state.done=true;state.branch=result.branch||'short';
   $('final-feedback').textContent=state.branch==='asked-back'?'Ты поддержал разговор по-китайски!':'Ты ответил по-китайски!';
   try{localStorage.setItem(conversation.id===1?'pg-panda-voice-pilot-v1-last':`pg-panda-voice-lesson${conversation.id}-last`,new Date().toISOString())}catch{}
  }
  $('answer').value='';$('heard').textContent='';note('');render();
  if(audioFor(current()?.audioKey))play();
 },900);
}
function startRecognition(mode='lesson'){
 const followup=mode==='followup',nonstop=mode==='nonstop';
 if((state.done&&!followup&&!nonstop)||state.busy)return;
 if(state.active){try{state.recognition.stop();note('Завершаю распознавание…')}catch{stopRecognition();refresh()}return}
 clearTimeout(state.transition);stopAudio();stopRecognition();
 if(window.isSecureContext===false){recovery('Микрофон требует HTTPS. Открой опубликованную страницу Panda Go.');return}
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){recovery('Распознавание в этом браузере недоступно. Открой в Chrome или используй «Написать».');return}
 let r;try{r=new Speech();r.lang='zh-CN';r.continuous=false;r.interimResults=false;r.maxAlternatives=1}
 catch{recovery('Браузер не смог создать сеанс распознавания. Используй «Написать».');return}
 state.recognition=r;const epoch=++state.epoch;state.active=true;let heard=false,failed=false;
 const valid=()=>state.recognition===r&&state.epoch===epoch&&(!state.done||followup||nonstop);
 $('voice-recovery').hidden=true;note('Подключаю микрофон…');refresh();
 r.onstart=()=>{if(valid()){pose('listening');note('Слушаю…')}};
 r.onresult=e=>{if(!valid())return;const text=String(e.results?.[0]?.[0]?.transcript||'').trim();heard=!!text;if(nonstop)handleNonstop(text);else if(followup)handleFollowup(text);else checkAnswer(text)};
 r.onnomatch=()=>{if(valid()){failed=true;stopRecognition();brief('retry');recovery('Речь не распознана. Повтори или напиши ответ.')}};
 r.onerror=e=>{
  if(!valid())return;failed=true;
  const errors={
   'not-allowed':'Доступ к микрофону запрещён. Разреши микрофон в настройках сайта Chrome.',
   'service-not-allowed':'Браузер запретил службу распознавания. Попробуй Chrome.',
   'network':'Сбой сети службы распознавания. Проверь интернет или используй «Написать».',
   'no-speech':'Речь не обнаружена. Повтори ближе к микрофону.',
   'audio-capture':'Микрофон недоступен или занят другим приложением.',
   'language-not-supported':'Служба этого браузера не поддерживает китайский zh-CN.',
   'aborted':'Распознавание прервано. Можно попробовать ещё раз.'
  };
  stopRecognition();recovery(errors[e.error]||`Ошибка распознавания: ${e.error||'неизвестна'}.`);
 };
 r.onend=()=>{if(!valid())return;stopRecognition();refresh();if(!heard&&!failed)recovery('Сеанс завершён без результата. Повтори или используй «Написать».')};
 try{r.start();state.watchdog=setTimeout(()=>{if(valid()){stopRecognition();recovery('Служба распознавания не ответила за 16 секунд. Попробуй Chrome или «Написать».')}},16000)}
 catch{stopRecognition();recovery('Микрофон не запустился. Проверь разрешение сайта.')}
}

$('speed-toggle').addEventListener('click',()=>{state.slow=!state.slow;updateSpeed()});
$('mode-short').addEventListener('click',()=>setDialogueMode('short'));
$('mode-nonstop').addEventListener('click',()=>setDialogueMode('nonstop'));
$('nonstop-form').addEventListener('submit',event=>{event.preventDefault();handleNonstop($('nonstop-input').value)});
$('nonstop-mic').addEventListener('click',()=>startRecognition('nonstop'));
$('nonstop-next').addEventListener('click',askNextNonstop);
$('nonstop-hint').addEventListener('click',()=>{
 if(state.mode!=='nonstop')return;
 const line=state.nonstopPrompt?.line;
 $('nonstop-feedback').textContent=line?.instruction||'Выбери изученную тему и попробуй ответить.';
});
$('nonstop-stop').addEventListener('click',()=>setDialogueMode('short'));
$('review').addEventListener('click',()=>{
 const selected=hardestMistake(storage,conversation.id);if(!selected)return;
 restart(false,Math.min(selected.step,PILOT_LINES.length-1));
 note('🔁 Повтори трудную фразу. После верного ответа уберу её из списка повторения.');
});
$('knowledge-toggle').addEventListener('click',()=>{
 const panel=$('knowledge-panel'),opened=panel.hidden;
 panel.hidden=!opened;
 $('knowledge-toggle').setAttribute('aria-expanded',String(opened));
 if(opened)refreshKnowledgePrompts();
});
$('knowledge-form').addEventListener('submit',event=>{
 event.preventDefault();
 explainQuestion($('knowledge-question').value);
});

$('hear').addEventListener('click',()=>{clearTimeout(state.transition);play()});
$('mic').addEventListener('click',()=>startRecognition('lesson'));
$('followup-mic').addEventListener('click',()=>startRecognition('followup'));
$('followup-form').addEventListener('submit',e=>{e.preventDefault();handleFollowup($('followup-input').value)});
$('type-toggle').addEventListener('click',()=>{if(state.busy)return;clearTimeout(state.transition);stopRecognition();state.typing=!state.typing;refresh();if(state.typing)$('answer').focus()});
$('typing').addEventListener('submit',e=>{e.preventDefault();clearTimeout(state.transition);checkAnswer($('answer').value)});
$('reset').addEventListener('click',()=>restart(true));$('again').addEventListener('click',()=>restart(true));
$('character').querySelector('img').addEventListener('error',()=>{note('Изображение Панды не загрузилось. Обнови страницу.');$('mic').disabled=true});
window.addEventListener('pagehide',event=>{clearTimeout(state.transition);clearTimeout(state.poseTimer);stopRecognition();stopAudio();if(!event.persisted)rig.dispose()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopAudio();stopRecognition();refresh()}});
$('lesson-tag').textContent=conversation.theme;
const preview=new URLSearchParams(window.location.search).get('preview')==='1';
const available=CONVERSATIONS.filter(x=>x.lines.length&&(!x.status.startsWith('draft')||preview));
$('topic-count').textContent=`${available.findIndex(x=>x.id===conversation.id)+1} / ${available.length}`;
for(const [id,direction] of [['topic-prev',-1],['topic-next',1]]){
 const target=adjacentConversation(CONVERSATIONS,conversation.id,direction,preview),url=new URL(window.location.href.startsWith('about:')?'./panda-voice-pilot.html':window.location.href,document.baseURI);
 url.searchParams.set('lesson',String(target.id));if(!preview)url.searchParams.delete('preview');
 const link=$(id);link.href=url.href;link.setAttribute('aria-label',`${direction<0?'Предыдущая':'Следующая'} тема: ${target.theme}`);
 link.addEventListener('click',()=>{clearTimeout(state.transition);stopRecognition();stopAudio()});
}
const bars=document.querySelector('.bars');bars.replaceChildren();
for(let index=0;index<PILOT_LINES.length;index++){const bar=document.createElement('i');bar.className='bar';bar.id=`bar${index+1}`;bars.append(bar)}
if(conversation.id!==1){

 const routes={2:'hsk1-second-v203.html',3:'hsk1-third-v212.html',4:'hsk1-fourth-v214.html',5:'hsk1-fifth-v227.html',6:'hsk1-family-v231.html',7:'hsk1-weather-v231.html'};
 $('back-link').href='./'+routes[conversation.id];
 const missing=missingConversationAudio(conversation,lookupPilotAudio);
 $('pilot-note').textContent=missing.length?`Черновик урока ${conversation.id} · не хватает ${missing.length} записей`:'Тестовая практика · единый голос';
 if(conversation.context){
  if(conversation.id===4||conversation.id===5){
   $('exercise-banner').hidden=false;
   $('exercise-banner').textContent=conversation.id===5?'🎭 УЧЕБНАЯ СЦЕНКА, не сегодняшняя дата. '+conversation.context:conversation.context;
  }else{
   const context=document.createElement('p');context.className='test-note';context.id='exercise-context';context.textContent=conversation.context;$('pilot-note').after(context);
  }
 }
 const vocabulary=$('words');vocabulary.replaceChildren();
 for(const item of [...(conversation.vocabulary||conversation.newWords),...(conversation.examples||[])]){
  const p=document.createElement('p');p.textContent=`${item.hanzi} — ${item.pinyin} — ${item.ru}`;vocabulary.append(p);
 }
 const note=document.createElement('p');note.textContent='Проверяется распознанный текст, а не правильность произнесённых тонов.'+(missing.length?' Новые записи ещё не подключены.':'');vocabulary.append(note);
}
const greetingHelp=document.createElement('div');
for(const item of GREETINGS){const p=document.createElement('p');p.textContent=`${item.panda} — ${item.pinyin} — ${item.ru}`;greetingHelp.append(p)}
const greetingNote=document.createElement('p');greetingNote.textContent='Для тренировки приветствия чередуются при новом открытии и после кнопки «Заново»: 早上好 → 中午好 → 下午好 → 晚上好. Это учебный цикл, не текущие часы. Ответь так же или скажи 你好. Все четыре записи сделаны тем же голосом.';greetingHelp.append(greetingNote);$('words').prepend(greetingHelp);
buildFollowupSuggestions();refreshKnowledgePrompts();restart();

document.documentElement.dataset.pandaLiveReady='true';
