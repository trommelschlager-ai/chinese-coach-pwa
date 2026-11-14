import {pickCoursePrompt,courseCoverage} from './panda-hsk1-questions-v281.mjs?v=319';
// One conversation surface, existing character rig and exact existing audio only.
import {withPracticeGreeting,GREETINGS} from './panda-live-greetings.mjs?v=live7';
import {lookupPilotAudio,lookupPandaVoiceClip} from './panda-live-audio.mjs?v=336';
import {verifyAnswerFor,normalize} from './panda-voice-pilot-engine.mjs?v=live6';
import {CONVERSATIONS,selectConversation} from './panda-live-lessons.mjs?v=live6';
import {ENVELOPES} from './panda-live-envelope.mjs?v=live6';
import {createPandaRig} from './panda-live-rig.mjs';
import {prepareConversation,interpretUtterance,replyToExtraSpeech,extraExamples} from './panda-live-conversation-v266.mjs?v=270';
import {answerCurriculumQuestion} from './panda-curriculum-tutor.mjs';
import {validatedVariants,readMistakes,noteMistake,hardestMistake,clearReviewedMistake} from './panda-live-practice.mjs?v=265';
import {accessibleLessons,answerNonStop} from './panda-nonstop-v267.mjs?v=270';
import {choosePracticePrompt} from './panda-live-prompts-v270.mjs?v=270';
import {answerLive,analyzeLearner,nextTopicPrompt} from './panda-live-dialogue-v272.mjs?v=323';
import {availableAskGroups} from './panda-ask-catalog-v326.mjs?v=326';
const $=id=>document.getElementById(id);
const storage=(()=>{try{return localStorage}catch{return null}})();
const curriculum=window.PANDA_HSK1_FOUNDATIONS||[];
const rig=createPandaRig($('character'),$('panda-canvas'));
let conversation,base,audio=null,audioFrame=0,recognition=null,epoch=0,watchdog,poseTimer,followupTimer;
const state={mode:'short',step:0,done:false,slow:false,allowed:[],cursor:0,askedInTopic:0,prompt:null,display:null,history:[],discussed:new Set(),questions:[],answers:[],awaitQuestion:false,speechConsent:false,active:false,hint:false,confidence:null,reviewStep:null,topic:1,turns:0,profile:{family:{}},followup:null};
const current=()=>state.display;
const lesson=()=>state.mode==='nonstop'?(state.topic||state.prompt?.line.lesson||conversation.id):conversation.id;
function note(text){$('status').textContent=text||''}
function pose(value){clearTimeout(poseTimer);rig.setState(value)}
function happy(){pose('happy');poseTimer=setTimeout(()=>pose('idle'),1300)}
function stopAudio(){const a=audio;audio=null;cancelAnimationFrame(audioFrame);if(a){a.onplaying=a.onended=a.onerror=a.onpause=a.onwaiting=a.onloadedmetadata=a.ontimeupdate=null;a.pause()}$('hear').classList.remove('playing');rig.setLevel(0);if($('character').dataset.state==='talking')pose('idle')}
function stopRecognition(){clearTimeout(watchdog);epoch++;const r=recognition;recognition=null;state.active=false;if(r){r.onstart=r.onresult=r.onerror=r.onend=r.onnomatch=null;try{r.abort()}catch{}}if($('character').dataset.state==='listening')pose('idle');updateMic()}
function updateMic(){$('mic').setAttribute('aria-pressed',String(state.active));$('mic').textContent=state.active?'■':'🎙';$('mic').setAttribute('aria-label',state.active?'Остановить распознавание':'Ответить Панде голосом')}
function play(){
 const currentLine=current();
 const part=lookupPandaVoiceClip(currentLine?.hanzi||currentLine?.panda)||lookupPandaVoiceClip(currentLine?.audioKey);
 if(!part){note('Для этой точной фразы пока нет загруженной MP3-записи.');return}
 stopRecognition();stopAudio();
 const src=part.src,begin=Number(part.start)||0,end=Number.isFinite(part.end)?Number(part.end):null;
 const a=new Audio(new URL(src,document.baseURI).href);audio=a;a.playbackRate=state.slow?.8:1;a.preload='auto';
 if('preservesPitch' in a)a.preservesPitch=true;
 const envelope=end===null?ENVELOPES[src]:null,valid=()=>audio===a;
 const seek=()=>{if(valid()&&begin>0){try{a.currentTime=begin}catch{}}};
 // Request playback during the user's gesture; the metadata event seeks inside
 // the ORIGINAL MP3 file before decoding the selected utterance.
 a.onloadedmetadata=seek;
 const animate=()=>{if(!valid()||a.paused||a.ended)return;rig.setLevel(envelope?envelope.levels[Math.floor(a.currentTime/envelope.binSeconds)]||0:.5+.5*Math.sin(a.currentTime*23));audioFrame=requestAnimationFrame(animate)};
 a.onplaying=()=>{if(valid()){pose('talking');$('hear').classList.add('playing');if($('status').textContent==='Нажми динамик, чтобы включить звук.')note('');animate()}};
 a.onwaiting=()=>{if(valid()){cancelAnimationFrame(audioFrame);pose('idle')}};
 a.onpause=()=>{if(valid()){cancelAnimationFrame(audioFrame);pose('idle')}};
 const finished=()=>{if(valid()){stopAudio();if(state.followup)scheduleFollowup(1200)}};
 a.onended=finished;
 a.ontimeupdate=()=>{if(valid()&&end!==null&&a.currentTime>=end-.025)finished()};
 a.onerror=()=>{if(valid()){stopAudio();note('Запись не загрузилась. Нажми динамик ещё раз.')}};
 seek();
 a.play().catch(()=>{if(valid()){stopAudio();note('Браузер не включил звук автоматически. Нажми динамик.')}});
}
function cancelFollowup(){clearTimeout(followupTimer);state.followup=null}
function scheduleFollowup(delay=4500){clearTimeout(followupTimer);if(!state.followup)return;followupTimer=setTimeout(()=>{if(state.mode!=='nonstop'||document.hidden||document.querySelector('dialog[open]')||document.activeElement===$('message')&&$('message').value){scheduleFollowup(1200);return}if(audio){scheduleFollowup(900);return}const prompt=state.followup;state.followup=null;state.prompt={line:prompt};state.awaitQuestion=false;state.topic=prompt.lesson;state.questions.push(prompt.hanzi);if(state.questions.length>50)state.questions.shift();showLearnerFeedback(null);say(prompt);note('Твой ответ? Можно также задать свой вопрос.');},delay)}
function remember(spoken){
 if(!spoken?.known)return;
 if(spoken.fact){
  Object.assign(state.profile,spoken.fact);
  if(spoken.fact.relative&&Number.isInteger(spoken.fact.relativeAge)){
   if(!state.profile.siblingAges)state.profile.siblingAges={};
   state.profile.siblingAges[spoken.fact.relative]=spoken.fact.relativeAge;
  }
 }
 if(spoken.family){
  for(const n of spoken.family.present||[])state.profile.family[n]=true;
  if(spoken.family.absent)state.profile.family[spoken.family.absent]=false;
 }
}
function makeRow(entry,full=false){
 const row=document.createElement('article'),who=document.createElement('strong');who.textContent=entry.who==='you'?'Ты: ':'Панда: ';row.append(who,document.createTextNode(entry.hanzi));
 if(entry.pinyin&&(full||entry.who==='you')){const py=document.createElement('span');py.className='py';py.textContent=entry.pinyin;row.append(py)}
 const ru=document.createElement('span');ru.className='ru';ru.textContent=(full?'Перевод: ':' — ')+(entry.ru||(entry.analysis?.probable?'Возможный смысл: '+entry.analysis.probable:'Точный перевод пока не подтверждён'));row.append(ru);
 if(full&&entry.analysis?.explanation){const detail=document.createElement('p');detail.textContent=entry.analysis.explanation;row.append(detail)}
 if(full&&entry.analysis?.correction){const c=entry.analysis.correction;const detail=document.createElement('p');detail.textContent='Правильно: '+c.hanzi+' '+(c.pinyin||'')+' — '+c.ru+' '+c.why;row.append(detail)}
 if(full&&entry.analysis?.words?.length){const detail=document.createElement('p');detail.textContent='Знакомые слова: '+entry.analysis.words.map(w=>w.join(' — ')).join('; ');row.append(detail)}
 if(full&&entry.confidence!==null&&entry.confidence<.65){const warn=document.createElement('p');warn.textContent='Распознавание неуверенное — проверь текст.';row.append(warn)}
 return row;
}
function refreshHistory(){
 $('recent').replaceChildren(...state.history.slice(-2).map(e=>makeRow(e)));
 $('history').replaceChildren(...state.history.map(e=>makeRow(e,true)));
 $('history-count').textContent=String(state.history.length);
}
function record(who,hanzi,pinyin,ru,analysis=null){state.history.push({who,hanzi,pinyin,ru,analysis,confidence:who==='you'?state.confidence:null});if(state.history.length>100)state.history.shift();refreshHistory()}
function say(line,autoplay=true,analysis=null){state.display=line;render();record('panda',line.hanzi||line.panda,line.pinyin,line.ru,analysis);if(autoplay)play()}
function learner(input,spoken){record('you',input,spoken?.known?spoken.pinyin:null,spoken?.known?spoken.translation:null,spoken);showLearnerFeedback(spoken);state.answers.push(input);if(state.answers.length>16)state.answers.shift()}
function showLearnerFeedback(spoken){
 const root=$('learner-feedback');root.replaceChildren();root.hidden=true;
 if(spoken?.correction){const c=spoken.correction;for(const text of ['Возможный смысл: '+spoken.probable,'Правильно: '+c.hanzi+(c.pinyin?' · '+c.pinyin:''),c.why]){const row=document.createElement('p');row.textContent=text;root.append(row)}root.hidden=false;}
 else if(!spoken?.known&&spoken?.words?.length){const row=document.createElement('p');row.textContent='Знакомые слова: '+spoken.words.map(w=>w.join(' — ')).join('; ')+'. Полный смысл уточни.';root.append(row);root.hidden=false}
 if(!root.hidden&&state.confidence!==null&&state.confidence<.65){const warn=document.createElement('p');warn.textContent='Распознавание неуверенное — проверь исходный текст.';root.append(warn)}
 document.documentElement.dataset.feedback=String(!root.hidden);
}
function showWordCard(card){
 const root=$('learner-feedback');root.replaceChildren();
 const wrap=document.createElement('div');wrap.className='word-card';
 const tones=document.createElement('p');tones.className='word-card-tones';tones.textContent='Тоны: '+card.tones;
 const zh=document.createElement('p');zh.className='word-card-example';zh.textContent='Пример: '+card.example.hanzi;
 const py=document.createElement('p');py.className='word-card-translation';py.textContent=card.example.pinyin+' — '+card.example.ru;
 wrap.append(tones,zh,py);
 if(card.rule){const rule=document.createElement('p');rule.className='word-card-rule';rule.textContent=card.rule;wrap.append(rule)}
 root.append(wrap);root.hidden=false;document.documentElement.dataset.feedback='true';
}
function refreshReview(){const list=readMistakes(storage).filter(x=>x.lesson===conversation.id);$('review-count').textContent=list.length?'Для повторения: '+list.length+' фраз':'Ошибок для повторения нет';$('review').disabled=!list.length}
function render(){
 const line=current(),text=String(line.hanzi||line.panda||'');
 $('phrase').textContent=text;$('pinyin').textContent=line.pinyin||'';$('translation').textContent=line.ru||'';
 const speech=document.querySelector('.speech'),hanziCount=Array.from(text.replace(/[，。！？?!\s]/g,'')).length;
 speech.dataset.length=hanziCount>=10?'verylong':hanziCount>=6?'long':'short';
 const clip=lookupPandaVoiceClip(line.hanzi||line.panda)||lookupPandaVoiceClip(line.audioKey);$('hear').disabled=!clip;$('audio-note').hidden=!!clip;
 $('hear').parentElement.hidden=!clip;
 $('audio-note').textContent='🔇 Для этой точной фразы пока нет MP3';
 $('step').textContent=state.mode==='nonstop'?'∞ Разговор без лимита':state.done?'Диалог завершён':`${state.step+1} из ${conversation.lines.length}`;
 $('mode-short').classList.toggle('active',state.mode==='short');$('mode-nonstop').classList.toggle('active',state.mode==='nonstop');
 for(const name of ['short','nonstop'])$('mode-'+name).setAttribute('aria-pressed',String(state.mode===name));
 $('mode-description').textContent=state.mode==='nonstop'?'Отвечай по HSK 1 и вводным словам HSK 2':'Панда спрашивает — ты отвечаешь по уроку';
 const bars=document.querySelector('.bars');bars.replaceChildren();bars.hidden=state.mode==='nonstop';
 for(let i=0;i<conversation.lines.length;i++){const b=document.createElement('i');b.className='bar'+(state.done||i<=state.step?' on':'');bars.append(b)}
 $('finish').hidden=state.mode!=='nonstop';$('next').hidden=state.mode!=='nonstop';
 $('message').placeholder=state.done&&state.mode==='short'?'Спроси Панду или начни заново…':'Напиши по-китайски…';
 const context=line.context||(state.mode==='nonstop'?(state.prompt?.line.context||''):conversation.context||'');
 $('exercise-banner').textContent=conversation.id===5&&state.mode==='short'&&!line.context?'Учебная сценка: '+context:context;$('exercise-banner').hidden=!context;
 const activePrompt=state.followup||state.prompt?.line;const questionExamples=state.followup||pickCoursePrompt(lesson(),curriculum,state.questions,new Date(),{...state.profile,unlocked:state.allowed});
 const examples=state.mode==='nonstop'?(state.awaitQuestion?[...(questionExamples?[questionExamples.hanzi]:[]),...extraExamples(lesson())]:[...(activePrompt?.accepted||activePrompt?.verifiedLines?.[1]?.accepted||[]).filter(x=>/[\u3400-\u9fff]/.test(x)).slice(0,2),...(questionExamples?[questionExamples.hanzi]:[])]):state.done?extraExamples(conversation.id):validatedVariants(conversation.id,state.step,conversation.lines);
 $('quick-phrases').replaceChildren();for(const text of examples.filter((text,index,all)=>all.findIndex(x=>normalize(x)===normalize(text))===index).slice(0,3)){const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',()=>{$('message').value=text;$('message').focus()});$('quick-phrases').append(b)}
 document.documentElement.dataset.hint=String(state.hint);$('hint').setAttribute('aria-expanded',String(state.hint));$('hint-text').hidden=!state.hint;
 if(state.hint)$('hint-text').textContent=state.mode==='nonstop'?(state.awaitQuestion?'Можно спросить: '+(questionExamples?.hanzi||'你好吗？')+' — '+(questionExamples?.ru||'Как дела?'):(activePrompt?.instruction||'Выбери короткую фразу по текущей теме.')):state.done?'Нажми «Заново» для нового диалога или задай вопрос.':conversation.lines[state.step].instruction;
 refreshReview();updateMic();
}
function rotateGreeting(){let index=0;try{index=Number(storage?.getItem('pg-panda-live-practice-greeting-v1'))||0;storage?.setItem('pg-panda-live-practice-greeting-v1',String((index+1)%4))}catch{}return index%4}
function initLesson(id){
 cancelFollowup();stopAudio();stopRecognition();base=prepareConversation(CONVERSATIONS.find(c=>c.id===id)||CONVERSATIONS[0],new Date());
 conversation=withPracticeGreeting(base,rotateGreeting());state.step=0;state.done=false;state.reviewStep=null;state.prompt=null;state.shortDisplay=null;state.nonstopDisplay=null;state.awaitQuestion=false;state.hint=false;state.topic=base.id;state.turns=0;state.askedInTopic=0;showLearnerFeedback(null);
 state.allowed=accessibleLessons(storage,conversation.id);state.profile.hasNumbers=state.allowed.includes(3);state.cursor=Math.max(0,state.allowed.indexOf(conversation.id));$('lesson-select').value=String(conversation.id);
 const routes={1:'panda-lesson1.html',2:'hsk1-second-v203.html',3:'hsk1-third-v212.html',4:'hsk1-fourth-v214.html',5:'hsk1-fifth-v227.html',6:'hsk1-family-v231.html',7:'hsk1-weather-v231.html'};$('back-link').href='./'+routes[conversation.id];
 $('allowed-topics').textContent='Доступны текущий и пройденные уроки: '+state.allowed.map(n=>CONVERSATIONS.find(c=>c.id===n).theme).join(', ')+'. Панда задаёт вопросы из этих уроков, использует их голосовые записи и разбирает слова.';
 $('words').replaceChildren();for(const w of [...(base.vocabulary||base.newWords||[]),...(base.examples||[])]){const p=document.createElement('p');p.textContent=[w.hanzi,w.pinyin,w.ru].join(' — ');$('words').append(p)}
 $('knowledge-answer').textContent='';$('message').value='';note('');
 if(state.mode==='nonstop')askNext();else say(conversation.lines[0],false);
}
function askNext(){
 cancelFollowup();stopRecognition();stopAudio();state.awaitQuestion=false;
 const topics=state.allowed.length?state.allowed:[conversation.id];
 if(state.askedInTopic>=3&&topics.length>1){state.cursor=(state.cursor+1)%topics.length;state.askedInTopic=0;}
 const selectedTopic=topics[state.cursor%topics.length];
 const selected=pickCoursePrompt(selectedTopic,curriculum,state.questions,new Date(),{...state.profile,unlocked:state.allowed});
 const p=selected?{line:selected}:choosePracticePrompt(CONVERSATIONS,state.allowed,state.questions,new Date(),selectedTopic);
 if(!p){note('Для доступных уроков пока нет проверенных вопросов.');return}
 state.prompt=p;state.topic=p.line.lesson;state.discussed.add(p.line.lesson);state.questions.push(p.line.hanzi);state.askedInTopic++;if(state.questions.length>50)state.questions.shift();
 say(p.line);note('Урок '+state.topic+'. Ответь или сам спроси Панду по пройденному материалу.');
}
function setMode(mode){if(state.mode===mode)return;cancelFollowup();stopRecognition();stopAudio();if(state.mode==='short')state.shortDisplay=state.display;else state.nonstopDisplay=state.display;state.mode=mode;state.hint=false;note('');if(mode==='nonstop'){if(state.prompt){state.display=state.nonstopDisplay||state.prompt.line;render()}else askNext()}else{state.display=state.shortDisplay||(state.done?state.shortReply:conversation.lines[state.step]);render()}}
function submit(raw){
 const input=String(raw||'').trim();if(!input){note('Скажи или напиши фразу на китайском.');return}
 cancelFollowup();stopRecognition();stopAudio();$('message').value='';
 if(state.mode==='nonstop'){
  const result=answerLive(input,{allowed:state.allowed,topic:lesson(),prompt:state.awaitQuestion?null:state.prompt?.line,curriculum,date:new Date(),turn:state.turns,profile:{...state.profile,recentQuestions:state.questions.slice(-40)}});
  learner(input,result.spoken||analyzeLearner(input,state.allowed,state.prompt?.line,curriculum));
  if(result.kind==='empty'){note(result.message);return}
  if(result.kind==='correction'){state.topic=result.lesson||lesson();pose('retry');note(result.message);render();return}
  if(result.reply){
   state.turns++;state.topic=result.lesson||lesson();state.discussed.add(state.topic);if(state.allowed.includes(state.topic))state.cursor=state.allowed.indexOf(state.topic);if(state.confidence===null||state.confidence>=.65){remember(result.spoken);state.profile.followupOffset=(state.profile.followupOffset||0)+1;}
   state.awaitQuestion=true;if(result.kind==='answer')happy();say(result.reply,true,result.explanation?{explanation:result.explanation}:null);
   if(result.wordCard)showWordCard(result.wordCard);
    else if(result.explanation){const row=document.createElement('p');row.textContent=result.explanation;$('learner-feedback').replaceChildren(row);$('learner-feedback').hidden=false;document.documentElement.dataset.feedback='true';}
   let followup=result.followup;
   if(followup&&followup.intent!=='relative-age'&&!followup.isContextual){
     if(state.allowed.length>1&&state.turns%3===0){
      const currentIndex=state.allowed.indexOf(state.topic);
      state.cursor=(currentIndex+1)%state.allowed.length;state.askedInTopic=0;
     }
     const selected=state.allowed[state.cursor%state.allowed.length]||state.topic;
     followup=pickCoursePrompt(selected,curriculum,state.questions.concat(input),new Date(),{...state.profile,unlocked:state.allowed})||followup;
    }
   if(followup){state.followup=followup;scheduleFollowup(Math.max(4500,Math.min(7000,(result.reply.pinyin?.length||50)*65)));render();}
   note(followup?.intent==='relative-age'?'Панда запомнила твою реплику о семье и задаст уточняющий вопрос.':followup?'Панда продолжит вопросом по пройденным темам. Можешь ответить или спросить раньше.':result.message||'Продолжай или нажми «Ещё вопрос».');
   if(state.confidence!==null&&state.confidence<.65){cancelFollowup();note('Распознано неуверенно. Проверь текст в истории и повтори при необходимости.');}return;
  }
  note(result.message);render();return;
 }
 const spoken=analyzeLearner(input,[1,conversation.id],conversation.lines[state.step],curriculum);learner(input,spoken);
 const greeting=/^(你好[呀啊]?|早上好[呀啊]?|中午好[呀啊]?|下午好[呀啊]?|晚上好[呀啊]?)$/.test(normalize(input));
 const social=replyToExtraSpeech(input,conversation.id,curriculum);
 if(spoken.correction){pose('retry');note(spoken.correction.why);render();return}
 const question=answerLive(input,{allowed:state.allowed,topic:conversation.id,curriculum,date:new Date(),turn:1,profile:state.profile});
 if(['question','explanation'].includes(question.kind)&&!(greeting&&state.step===0&&!state.done)){say(question.reply);note(state.done?'Можно продолжить в Non-Stop.':'Теперь вернись к учебному вопросу: '+conversation.lines[state.step].instruction);return}
 if(question.kind==='locked'){note(question.message);return}
 // Any supported greeting can answer the opening, with the same greeting echoed.

 const result=verifyAnswerFor(conversation.lines,state.step,input);
 if(!state.done&&(result.ok||(state.step===0&&greeting))){
  if(state.reviewStep===state.step){clearReviewedMistake(storage,conversation.id,state.step);state.reviewStep=null}
  state.step++;happy();
  if(state.step>=conversation.lines.length){state.done=true;state.shortReply=conversation.replies[result.branch||'short']||conversation.replies.short||Object.values(conversation.replies)[0];try{storage?.setItem(conversation.id===1?'pg-panda-voice-pilot-v1-last':`pg-panda-voice-lesson${conversation.id}-last`,new Date().toISOString())}catch{}say(state.shortReply);note('Краткий диалог завершён. Можешь продолжить в Non-Stop.');}
  else{say(conversation.lines[state.step]);note('Ответ по смыслу подходит. '+conversation.lines[state.step].instruction)}return;
 }
 // Answer greetings and genuine learner questions without marking them wrong.
 if(social.answer&&(['你好吗','你呢','谢谢'].includes(normalize(input))||greeting||state.done)){
  say(social.answer);note(state.done?'Продолжай или выбери Non-Stop.':'Теперь ответь на учебный вопрос. '+conversation.lines[state.step].instruction);return;
 }
 if(!state.done){noteMistake(storage,conversation.id,state.step);pose('retry');state.display=conversation.lines[state.step];render();note('Пока не подходит. '+conversation.lines[state.step].instruction)}else note(social.help||'Попробуй фразу из этого урока.');
}
// Browser speech recognition is not the same as permission to use the microphone.
// Some in-app browsers expose SpeechRecognition but never call onstart/onerror.
function showMicRecovery(message){
 note(message);
 $('speech-recovery-message').textContent=message;
 $('speech-check-result').textContent='';
 $('speech-recovery').hidden=false;
}
function hideMicRecovery(){
 $('speech-recovery').hidden=true;
 $('speech-check-result').textContent='';
}
function shareableSpeechUrl(){
 const link=new URL('panda-voice-pilot.html',document.baseURI);
 const params=new URLSearchParams(location.search);
 if(params.has('lesson'))link.searchParams.set('lesson',params.get('lesson'));
 return link.href;
}
async function inspectMicPermission(){
 const target=$('speech-check-result');
 target.textContent='Проверяю доступ (браузер может запросить разрешение)…';
 if(!window.isSecureContext){target.textContent='Микрофон доступен только через HTTPS. Открой ссылку в Chrome.';return}
 if(!navigator.mediaDevices?.getUserMedia){
  target.textContent='Этот браузер не умеет проверять микрофон. Открой страницу непосредственно в Chrome.';return;
 }
 let stream=null;
 try{
  // Diagnostic only; no audio is stored or uploaded by Panda Go.
  stream=await navigator.mediaDevices.getUserMedia({audio:true});
  target.textContent='✅ Микрофон разрешён и доступен. Если Панда не распознаёт речь, попробуй Chrome: браузерная служба распознавания может быть недоступна.';
 }catch(e){
  const key=String(e?.name||'');
  target.textContent=key==='NotAllowedError'||key==='PermissionDeniedError'
   ?'⛔ Микрофон запрещён. Android: разреши микрофон для Chrome. Chrome: Настройки сайтов → Микрофон → Разрешить для Panda Go.'
   :key==='NotFoundError'||key==='DevicesNotFoundError'
    ?'Микрофон не найден. Проверь настройки Android и подключённую гарнитуру.'
    :'Не удалось проверить микрофон ('+(key||'неизвестная ошибка')+'). Попробуй напрямую в Chrome.';
 }finally{
  try{stream?.getTracks().forEach(track=>track.stop())}catch{}
 }
}
async function copySpeechUrl(){
 const target=$('speech-check-result'),value=shareableSpeechUrl();
 try{
  if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(value);
  else{
   const input=document.createElement('textarea');input.value=value;input.setAttribute('readonly','');input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.select();
   const copied=document.execCommand?.('copy');input.remove();if(!copied)throw Error('clipboard unavailable');
  }
  target.textContent='✅ Ссылка скопирована. Открой Chrome и вставь её в адресную строку.';
 }catch{
  target.textContent='Браузер запретил копирование. Используй кнопку «Открыть страницу» или скопируй адрес сайта вручную.';
 }
}
$('speech-check').addEventListener('click',inspectMicPermission);
$('speech-copy').addEventListener('click',copySpeechUrl);
$('speech-chrome').href=shareableSpeechUrl();

function startRecognition(){
 if(state.active){stopRecognition();note('Микрофон остановлен.');return}
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){showMicRecovery('Распознавание китайской речи в этом браузере недоступно. Открой ссылку в Chrome или отвечай текстом.');return}
 if(!state.speechConsent){$('speech-dialog').showModal();return}
 if(window.isSecureContext===false){showMicRecovery('Для микрофона нужен HTTPS. Открой опубликованный Panda Go в Chrome.');return}
 cancelFollowup();stopAudio();stopRecognition();let r;
 try{
  r=new Speech();r.lang='zh-CN';r.continuous=false;r.interimResults=false;r.maxAlternatives=1;
 }catch{showMicRecovery('Браузер не смог создать сеанс распознавания. Открой ссылку в Chrome.');return}
 recognition=r;const token=++epoch;state.active=true;
 let heard=false,failed=false,started=false,audioStarted=false;
 const valid=()=>recognition===r&&epoch===token;
 const fail=(message)=>{if(!valid())return;failed=true;stopRecognition();showMicRecovery(message)};
 hideMicRecovery();updateMic();note('Подключаю микрофон…');
 r.onstart=()=>{
  if(!valid())return;
  started=true;pose('listening');note('Распознавание запущено. Говори по-китайски…');
  clearTimeout(watchdog);
  watchdog=setTimeout(()=>{if(valid())fail(audioStarted
   ?'Микрофон подключён, но речь не распознана. Попробуй говорить ближе или открой в Chrome.'
   :'Служба распознавания запустилась, но не получила звук с микрофона. Проверь разрешение или открой в Chrome.');},16000);
 };
 r.onaudiostart=()=>{if(valid()){audioStarted=true;note('🎙 Микрофон активен. Говори по-китайски…')}};
 r.onspeechstart=()=>{if(valid())note('🎙 Слышу речь, распознаю китайский…')};
 r.onresult=e=>{
  if(!valid())return;
  const a=e.results?.[0]?.[0];const text=String(a?.transcript||'').trim();
  if(!text){fail('Браузер вернул пустой ответ. Попробуй ещё раз в Chrome или напиши фразу.');return}
  heard=true;state.confidence=typeof a?.confidence==='number'&&a.confidence>0?a.confidence:null;
  submit(text);
  if(state.confidence!==null&&state.confidence<.65)note('Распознано неуверенно. Проверь текст и повтори при необходимости.');
  state.confidence=null;
 };
 r.onerror=e=>{
  if(!valid())return;
  const reasons={
   'not-allowed':'Доступ к микрофону запрещён. Разреши микрофон для сайта в Chrome и в настройках Android.',
   'service-not-allowed':'Браузер запретил службу распознавания. Открой страницу напрямую в Chrome.',
   'network':'Служба распознавания речи не отвечает через эту сеть. Проверь интернет или используй текст.',
   'no-speech':'Не расслышала китайскую речь. Повтори поближе к микрофону.',
   'audio-capture':'Микрофон занят или недоступен. Проверь разрешение в Android и Chrome.',
   'language-not-supported':'Этот браузер не поддерживает распознавание китайского zh-CN.',
   'aborted':'Распознавание неожиданно прервалось. Попробуй ещё раз.'
  };
  fail(reasons[e?.error]||'Ошибка распознавания. Открой Panda Go напрямую в Chrome или используй текст.');
 };
 r.onnomatch=()=>fail('Речь не распознана. Попробуй ещё раз или напиши ответ по-китайски.');
 r.onend=()=>{if(valid()&&!heard&&!failed)fail(started?'Распознавание завершилось без результата. Попробуй Chrome или текст.':'Браузер не подключил службу распознавания. Открой ссылку напрямую в Chrome.')};
 // Start watchdog BEFORE r.start(): some implementations fire onstart synchronously.
 watchdog=setTimeout(()=>fail('Браузер не подключил распознавание за 7 секунд. Если ссылка открыта внутри мессенджера, выбери ⋮ → Открыть в браузере → Chrome.'),7000);
 try{r.start()}catch{
  fail('Не удалось запустить распознавание. Проверь разрешения или открой Panda Go напрямую в Chrome.');
 }
}
// One-tap practice guide. Lessons are selected from actual progress, and every
// advertised question has been checked against the same answer engine used here.
function openAskPandaGuide(){
 cancelFollowup();stopRecognition();stopAudio();
 const root=$('ask-panda-topics');root.replaceChildren();
 const groups=availableAskGroups(state.allowed,curriculum,new Date());
 for(const group of groups){
  const box=document.createElement('details');box.className='ask-panda-topic';
  box.open=group.lesson===conversation.id||groups.length===1;
  const summary=document.createElement('summary');summary.textContent=group.lesson+'. '+group.title+' · '+group.questions.length+' вопросов';
  const options=document.createElement('div');options.className='ask-panda-question-list';
  for(const question of group.questions){
   const b=document.createElement('button');b.type='button';b.className='ask-panda-question';
   b.setAttribute('aria-label',question.hanzi+' — '+question.ru+'. Вставить вопрос');
   const zh=document.createElement('strong');zh.className='zh';zh.textContent=question.hanzi;
   const py=document.createElement('span');py.className='py';py.textContent=question.pinyin;
   const ru=document.createElement('span');ru.className='ru';ru.textContent=question.ru;
   b.append(zh,py,ru);
   b.addEventListener('click',()=>{
    $('ask-panda-dialog').close();
    if(state.mode!=='nonstop')setMode('nonstop');
    cancelFollowup();$('message').value=question.hanzi;
    $('message').focus();
    note('Вопрос выбран. Нажми ➤, чтобы отправить, или скажи его сам через 🎙. Это не оценка тонов.');
   });
   options.append(b);
  }
  box.append(summary,options);root.append(box);
 }
 if(!groups.length){const p=document.createElement('p');p.textContent='Пока нет проверенных вопросов для текущего урока.';root.append(p)}
 $('ask-panda-dialog').showModal();
}
$('ask-panda-open').addEventListener('click',openAskPandaGuide);

$('message-form').addEventListener('submit',e=>{e.preventDefault();state.confidence=null;submit($('message').value)});
$('mic').addEventListener('click',startRecognition);$('speech-allow').addEventListener('click',()=>{state.speechConsent=true;$('speech-dialog').close();startRecognition()});
$('hear').addEventListener('click',play);$('speed-toggle').addEventListener('click',()=>{state.slow=!state.slow;$('speed-toggle').textContent=state.slow?'🐢 0,8×':'▶ 1×';$('speed-toggle').setAttribute('aria-pressed',String(state.slow));if(audio)audio.playbackRate=state.slow?.8:1});
$('mode-short').addEventListener('click',()=>setMode('short'));$('mode-nonstop').addEventListener('click',()=>setMode('nonstop'));
$('next').addEventListener('click',askNext);$('finish').addEventListener('click',()=>{cancelFollowup();stopAudio();stopRecognition();state.prompt=null;setMode('short');note('Non-Stop завершён. История осталась в этой вкладке.');});
$('reset').addEventListener('click',()=>initLesson(conversation.id));$('hint').addEventListener('click',()=>{state.hint=!state.hint;render()});
for(const [button,dialog] of [['history-open','history-dialog'],['study-open','study-dialog']])$(button).addEventListener('click',()=>{stopRecognition();stopAudio();if(dialog==='study-dialog'){
 const studyTopic=lesson(),studyBase=CONVERSATIONS.find(c=>c.id===studyTopic);$('words').replaceChildren();const seenWords=new Set();for(const [zh,py,ru] of [...(curriculum[studyTopic-1]?.words||[]),...(studyBase?.examples||[]).map(w=>[w.hanzi,w.pinyin,w.ru])]){if(seenWords.has(zh))continue;seenWords.add(zh);const row=document.createElement('p');row.textContent=[zh,py,ru].join(' — ');$('words').append(row)}
 const variants=state.mode==='nonstop'?(state.followup||state.prompt?.line)?.accepted||[]:validatedVariants(conversation.id,Math.min(state.step,conversation.lines.length-1),conversation.lines);
 $('variant-choices').replaceChildren();for(const text of variants.slice(0,8)){const b=document.createElement('button');b.textContent=text;b.addEventListener('click',()=>{$('message').value=text;$(dialog).close();$('message').focus()});$('variant-choices').append(b)}
 }$(dialog).showModal()});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
$('knowledge-form').addEventListener('submit',e=>{e.preventDefault();$('knowledge-answer').textContent=answerCurriculumQuestion($('knowledge-question').value,lesson(),curriculum)});
$('review').addEventListener('click',()=>{const item=hardestMistake(storage,conversation.id);if(!item)return;setMode('short');state.step=Math.min(item.step,conversation.lines.length-1);state.reviewStep=state.step;state.done=false;$('study-dialog').close();say(conversation.lines[state.step]);note('Повтори эту фразу. После верного ответа она исчезнет из списка повторения.')});
for(const c of CONVERSATIONS.filter(c=>c.lines.length&&!c.status.startsWith('draft'))){const o=document.createElement('option');o.value=c.id;o.textContent=c.id+'. '+c.theme;$('lesson-select').append(o)}
$('lesson-select').addEventListener('change',()=>{const id=Number($('lesson-select').value);const url=new URL(location.href);url.searchParams.set('lesson',id);history.replaceState(null,'',url);initLesson(id)});
function resize(){const v=window.visualViewport;const h=v?.height||window.innerHeight;document.documentElement.style.setProperty('--screen-height',h+'px');document.documentElement.style.setProperty('--screen-top',(v?.offsetTop||0)+'px');document.documentElement.dataset.keyboard=String((window.innerHeight-h>120)||(h<560))}
window.visualViewport?.addEventListener('resize',resize);window.visualViewport?.addEventListener('scroll',resize);window.addEventListener('resize',resize);document.addEventListener('focusin',resize);document.addEventListener('focusout',resize);
window.addEventListener('pagehide',e=>{cancelFollowup();stopRecognition();stopAudio();clearTimeout(poseTimer);if(!e.persisted)rig.dispose()});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelFollowup();stopRecognition();stopAudio()}});
if('serviceWorker' in navigator && !['localhost','127.0.0.1','terminal.local'].includes(location.hostname))navigator.serviceWorker.register('./sw.js?v=326',{scope:'./',updateViaCache:'none'}).then(async r=>{await r.update();r.active?.postMessage?.({type:'PRUNE_PANDA_LEGACY'})}).catch(()=>{});
if(window.ResizeObserver){const observer=new window.ResizeObserver(entries=>{document.documentElement.style.setProperty('--scene-height',entries[0].contentRect.height+'px')});observer.observe(document.querySelector('.scene'))}
initLesson(selectConversation(location.search).id);resize();document.documentElement.dataset.pandaLiveReady='true';
// Try the existing recording; browsers may require the first tap before playback.
play();
