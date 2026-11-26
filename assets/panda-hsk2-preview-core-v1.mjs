import {saveGrammarReview,readDayReview,getReviewCardLine,dueDayReview,dayReviewStats,practiceDayReview,clearDayReview} from './panda-hsk2-day-understanding-v1.mjs?v=6';
import {friendlyIntroduction,everydayMeaning} from './panda-everyday-meaning-v515.mjs?v=543';
import {respondToNaturalStatement} from './panda-natural-statements-v552.mjs?v=563&rev=565';
import {clarificationLine} from './panda-clarification-map-v504.mjs?v=505';
import {pickCoursePrompt,courseCoverage} from './panda-hsk1-questions-v281.mjs?v=409';
// One conversation surface, existing character rig and exact existing audio only.
import {withPracticeGreeting,GREETINGS} from './panda-live-greetings.mjs?v=live7';
import {lookupPilotAudio,lookupPandaVoiceClip} from './panda-hsk2-preview-audio-v1.mjs?v=546';
import {HSK2_TOPICS} from './panda-hsk2-brain-data-v1.mjs';
import {getTopic,replyHSK2,knownHSK2,prompt,line as hsk2Line,norm as hsk2Norm} from './panda-hsk2-brain-v1.mjs?v=523';
import {PILOT_LINES,verifyAnswerFor,normalize} from './panda-voice-pilot-engine.mjs?v=live6';
import {CONVERSATIONS,selectConversation} from './panda-live-lessons.mjs?v=live6';
import {ENVELOPES} from './panda-live-envelope.mjs?v=live6';
import {createPandaRig} from './panda-live-rig.mjs';
import {prepareConversation,interpretUtterance,replyToExtraSpeech,extraExamples} from './panda-live-conversation-v266.mjs?v=270';
import {answerCurriculumQuestion} from './panda-curriculum-tutor.mjs';
import {validatedVariants,readMistakes,noteMistake,hardestMistake,clearReviewedMistake} from './panda-live-practice.mjs?v=265';
import {accessibleLessons,answerNonStop} from './panda-nonstop-v267.mjs?v=270';
import {choosePracticePrompt} from './panda-live-prompts-v270.mjs?v=270';
import {answerLive,analyzeLearner,nextTopicPrompt} from './panda-live-dialogue-v272.mjs?v=536';
import {recordedPandaAnswer} from './panda-recorded-qa-v358.mjs?v=381';
import {availableAskGroups} from './panda-ask-catalog-v326.mjs?v=436';
import {dailyQuestions,checkDayAnswer,dailyFinal} from './panda-hsk2-day-coach-v1.mjs?v=398';
import {interpretWorkReply,addPersonalFollowup} from './panda-context-flow-v376.mjs?v=376';
import {correctCommonPhrase} from './panda-chat-corrections-v377.mjs?v=377';
import {explainPandaAnswer441} from './panda-error-coach-v441.mjs?v=441';
import {correctPandaGrammarV2} from './panda-grammar-hsk12-v2.mjs?v=2';
import {isCalendarRoundFinished} from './panda-calendar-literal-v383.mjs?v=405';
import {coherentPandaFollowup} from './panda-nonstop-continuity-v425.mjs?v=425';
import {continueFamilyAfterAnswer} from './panda-family-turn-v426.mjs?v=427';
import {enrichConversation430} from './panda-conversation-memory-v430.mjs?v=430';
import {enrichTopics431} from './panda-topic-memory-v431.mjs?v=431';
import {mergePandaFacts435,refineFollowup435} from './panda-natural-memory-v435.mjs?v=435';
import {readSharedPandaProfile,saveSharedPandaProfile} from './panda-cross-character-memory-v1.mjs';
const $=id=>document.getElementById(id);
const storage=(()=>{try{return localStorage}catch{return null}})();
const curriculum=window.PANDA_HSK1_FOUNDATIONS||[];
const dayParams=new URLSearchParams(location.search);
const dayLaunch=dayParams.get('practice')==='day';
// Online-only experiment. The default route never loads the new modules.
// No personal profile or microphone data is stored by the semantic pilot.
const semanticRequested=dayParams.get('semantic')==='1'&&!['practice','scenario','from','topic','lesson'].some(k=>dayParams.has(k));
let semanticPilot=null,semanticMetadata=null,semanticContinues=false;
const semanticFreeChat=()=>!!semanticPilot&&!state.dayMode&&entry.beginnerGreeting&&hsk2?.id===101&&hsk2.openChat===true&&state.mode==='nonstop';
function resetSemanticPilot(){semanticPilot?.reset();semanticContinues=false;}
function observeSemanticPanda(line){
 if(semanticFreeChat())semanticPilot.observePanda({hanzi:line.hanzi||line.panda,pinyin:line.pinyin,ru:line.ru},{continuesLearnerTurn:semanticContinues});
 semanticContinues=false;
}
const dayMini=Math.min(2,Math.max(0,Number(dayParams.get('mini'))||0));
const rig=createPandaRig($('character'),$('panda-canvas'));
let conversation,base,audio=null,audioFrame=0,audioBufferTimer=0,recognition=null,epoch=0,watchdog,speechEndTimer,recognitionEndTimer,poseTimer,followupTimer;
let pandaVisualAudioLevel=0; // Read-only signal for the approved face animation.
let micActivatedAt=0; // Guard the first seconds of a new recording against accidental second taps.
const state={mode:'short',step:0,done:false,slow:false,allowed:[],cursor:0,askedInTopic:0,prompt:null,display:null,history:[],discussed:new Set(),questions:[],answers:[],awaitQuestion:false,speechConsent:false,active:false,hint:false,confidence:null,reviewStep:null,topic:1,lockedTopic:null,pendingAudioReply:null,turns:0,profile:readSharedPandaProfile(storage),followup:null,speechSignal:null,dayMode:dayLaunch,dayMini,dayStep:0,dayDone:false,dayResumeStep:null};
// Cache verified question groups while the same HSK lessons are unlocked.
let cachedAskGroupsKey='',cachedAskGroups=[];
function topicCatalogGroups(){
 const key=state.allowed.join(',')+'|'+new Date().toDateString();
 if(key!==cachedAskGroupsKey){
  cachedAskGroups=availableAskGroups(state.allowed,curriculum,new Date()).map(g=>({...g,questions:g.questions.map(q=>({...q,...(normalize(q.hanzi)==='你今天好吗'?{pinyin:'Nǐ jīntiān hǎo ma?'}:{}),hasReplyAudio:!!lookupPandaVoiceClip(q.hanzi)}))}));
  cachedAskGroupsKey=key;
 }
 return cachedAskGroups;
}
const current=()=>state.display;
const lesson=()=>state.mode==='nonstop'?(state.topic||state.prompt?.line.lesson||conversation.id):conversation.id;
function note(text){$('status').textContent=text||''}
function pose(value){clearTimeout(poseTimer);rig.setState(value)}
function happy(){pose('happy');poseTimer=setTimeout(()=>pose('idle'),1300)}
function stopAudio(){const a=audio;audio=null;clearTimeout(audioBufferTimer);cancelAnimationFrame(audioFrame);if(a){a.onplaying=a.onended=a.onerror=a.onpause=a.onwaiting=a.onstalled=a.onloadedmetadata=a.ontimeupdate=a.onseeked=a.oncanplay=null;a.pause()}$('hear').classList.remove('playing');rig.setLevel(0);pandaVisualAudioLevel=0;if($('character').dataset.state==='talking')pose('idle')}
function stopRecognition(){clearTimeout(watchdog);clearTimeout(speechEndTimer);clearTimeout(recognitionEndTimer);epoch++;const r=recognition;recognition=null;state.active=false;micActivatedAt=0;if(r){r.onstart=r.onaudiostart=r.onspeechstart=r.onspeechend=r.onresult=r.onerror=r.onend=r.onnomatch=null;try{r.abort()}catch{}}if($('character').dataset.state==='listening')pose('idle');updateMic()}
function updateMic(){$('mic').setAttribute('aria-pressed',String(state.active));$('mic').textContent=state.active?'■':'🎙';$('mic').setAttribute('aria-label',state.active?'Остановить распознавание':'Ответить Панде голосом')}
let blockedPlayback=null;
function play(entry=null){
 blockedPlayback=null;
 const currentLine=entry||current();
 const replyKey=normalize(currentLine?.hanzi||currentLine?.panda||'');
 const resumingMissedReply=!!state.pendingAudioReply&&replyKey===state.pendingAudioReply;
 const part=lookupPandaVoiceClip(currentLine?.hanzi||currentLine?.panda)||lookupPandaVoiceClip(currentLine?.audioKey);
 if(!part){stopAudio();note('Для этой точной фразы пока нет загруженной MP3-записи.');return}
 stopRecognition();stopAudio();
 const src=part.src,begin=Number(part.start)||0,end=Number.isFinite(part.end)?Number(part.end):null;
 const a=new Audio(new URL(src,document.baseURI).href);audio=a;a.playbackRate=state.slow?.8:1;a.preload='auto';
 if('preservesPitch' in a)a.preservesPitch=true;
 const envelope=end===null?ENVELOPES[src]:null,valid=()=>audio===a;
 // Every indexed phrase is now its own MP3; playback starts at zero.
 a.muted=false;a.volume=1;
 const animate=()=>{if(!valid()||a.paused||a.ended)return;pandaVisualAudioLevel=Math.max(0,Math.min(1,envelope?envelope.levels[Math.floor(a.currentTime/envelope.binSeconds)]||0:.5+.5*Math.sin(a.currentTime*23)));rig.setLevel(pandaVisualAudioLevel);audioFrame=requestAnimationFrame(animate)};
 a.onplaying=()=>{if(valid()){clearTimeout(audioBufferTimer);pose('talking');$('hear').classList.add('playing');if(/^(Нажми динамик|Браузер не включил звук|Запись не загрузилась|Не удалось перейти|Загрузка аудио)/.test($('status').textContent))note('');animate()}};
 const waitForAudio=()=>{if(!valid())return;cancelAnimationFrame(audioFrame);pose('idle');note('Загрузка аудио задерживается…');clearTimeout(audioBufferTimer);audioBufferTimer=setTimeout(()=>{if(valid())failed('Аудио не загрузилось за 10 секунд. Нажми 🔊 на реплике Панды или проверь интернет.')},10000)};
 a.onwaiting=waitForAudio;
 a.onstalled=waitForAudio;
 a.onpause=()=>{if(valid()){cancelAnimationFrame(audioFrame);pose('idle')}};
 const finished=()=>{if(valid()){stopAudio();if(resumingMissedReply)state.pendingAudioReply=null;
   if(state.dayMode&&state.dayResumeStep===state.dayStep&&!state.dayDone){
    const prompt=state.prompt?.line;state.dayResumeStep=null;
    if(prompt){state.display=prompt;render();note('Продолжай HSK2 «Мой день»: ответь на учебный вопрос.');}
    return;
   }
   if(entry&&replyKey===opening.audioKey&&hsk2&&state.history.length===2){play();return;}
   if((!entry||resumingMissedReply)&&state.followup)scheduleFollowup(1200);
  }};
 a.onended=finished;
 a.ontimeupdate=()=>{if(valid()&&end!==null&&a.currentTime>=end-.025)finished()};
 const failed=message=>{if(!valid())return;stopAudio();
  if(state.mode==='nonstop'&&state.followup){state.pendingAudioReply=replyKey;clearTimeout(followupTimer);}
  note(message);
 };
 a.onerror=()=>failed('Запись не загрузилась. Нажми 🔊 на реплике Панды, чтобы продолжить.');
 a.play().catch(()=>{if(valid()){blockedPlayback=entry||currentLine;failed('Браузер не включил звук автоматически. Нажми 🔊 на реплике Панды, чтобы продолжить.')}});
}
function cancelFollowup(){clearTimeout(followupTimer);state.followup=null;state.pendingAudioReply=null}
function scheduleFollowup(delay=4500){clearTimeout(followupTimer);if(!state.followup)return;followupTimer=setTimeout(()=>{if(state.pendingAudioReply)return;if(state.mode!=='nonstop'||document.hidden||document.querySelector('dialog[open]')||document.activeElement===$('message')&&$('message').value){scheduleFollowup(1200);return}if(audio){scheduleFollowup(900);return}const prompt=state.followup;state.followup=null;state.prompt={line:prompt};state.awaitQuestion=false;state.topic=prompt.lesson;state.questions.push(prompt.hanzi);if(state.questions.length>50)state.questions.shift();showLearnerFeedback(null);say(prompt);note('Твой ответ? Можно также задать свой вопрос.');},delay)}
function remember(spoken){
 // v435: facts stay only in this open session. A corrected "没有妹妹"
 // also clears the stale age remembered from an earlier "有妹妹".
 state.profile=mergePandaFacts435(state.profile,spoken);
 if(spoken?.known&&!spoken.correction)saveSharedPandaProfile(storage,state.profile);
}
function makeRow(entry,full=false){
 const row=document.createElement('article'),who=document.createElement('strong');who.textContent=entry.who==='you'?'Ты: ':entry.who==='example'?'💡 Правильный пример: ':'Панда: ';row.append(who,document.createTextNode(entry.hanzi));
 if(entry.pinyin&&(full||entry.who==='you')){const py=document.createElement('span');py.className='py';py.textContent=entry.pinyin;row.append(py)}
 const translated=entry.ru||(entry.analysis?.probable?'Возможный смысл: '+entry.analysis.probable:'');
 if(translated){const ru=document.createElement('span');ru.className='ru';ru.textContent=(full?'Перевод: ':' — ')+translated;row.append(ru)}
 if(full&&entry.analysis?.explanation){const detail=document.createElement('p');detail.textContent=entry.analysis.explanation;row.append(detail)}
 if(entry.analysis?.kind==='calendar-complete'&&entry.analysis.summary){const detail=document.createElement('p');detail.textContent=entry.analysis.summary;row.append(detail)}
 if(full&&entry.analysis?.correction){const c=entry.analysis.correction;const detail=document.createElement('p');detail.textContent='Правильно: '+c.hanzi+' '+(c.pinyin||'')+' — '+c.ru+' '+c.why;row.append(detail)}
 if(full&&entry.analysis?.kind==='correction-response'){const detail=document.createElement('p');detail.textContent='Предполагаемый смысл: '+entry.analysis.probable+' · Ошибка: '+entry.analysis.original+' · '+entry.analysis.why;row.append(detail)}
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
function say(line,autoplay=true,analysis=null){
 state.display=line;render();record('panda',line.hanzi||line.panda,line.pinyin,line.ru,analysis);observeSemanticPanda(line);
 // Text-only is a valid learning response, not an audio failure. Show the
 // existing 🔇 caption, but never attempt playback without an exact MP3.
 if(autoplay&&(lookupPandaVoiceClip(line.hanzi||line.panda)||lookupPandaVoiceClip(line.audioKey)))play();
}
function learner(input,spoken){record('you',input,spoken?.known?spoken.pinyin:null,spoken?.known?spoken.translation:null,spoken);showLearnerFeedback(spoken);state.answers.push(input);if(state.answers.length>16)state.answers.shift()}
// Personal correction review: same browser deck as HSK2 My Day, no raw learner speech.
let personalCorrection=null,personalReviewRoot=null,personalReviewActive=null,personalReviewRetry=null;
function rememberPersonalCorrection(c,confidence){
 personalCorrection=null;
 if(c?.category!=='grammar'||c.uncertain||(typeof confidence==='number'&&confidence<.85))return;
 personalCorrection={correction:c,confidence,saved:false};
 if(personalReviewRoot?.querySelector('#pg-review-consent')?.checked)savePersonalCorrection();
}
function savePersonalCorrection(){
 if(!personalCorrection||personalCorrection.saved||!personalReviewRoot?.querySelector('#pg-review-consent')?.checked)return;
 personalCorrection.saved=saveGrammarReview(storage,personalCorrection.correction,true,personalCorrection.confidence);
 refreshPersonalReview();
}
function refreshPersonalReview(){
 if(!personalReviewRoot)return;
 const q=id=>personalReviewRoot.querySelector('#'+id),stats=dayReviewStats(storage);
 q('pg-review-summary').textContent='📚 Мои ошибки · '+stats.due+' к повторению';
 q('pg-review-stats').textContent='Всего: '+stats.total+' · Сегодня: '+stats.due+' · Позже: '+stats.scheduled+' · Цикл завершён: '+stats.completed;
 const consent=q('pg-review-consent').checked;
 q('pg-review-save').disabled=!consent||!personalCorrection||personalCorrection.saved;
 q('pg-review-start').disabled=!consent||!stats.due;
 const list=q('pg-review-list');list.replaceChildren();
 for(const card of readDayReview(storage)){
  const line=getReviewCardLine(card);if(!line)continue;
  const row=document.createElement('p');row.textContent=line.join(' — ')+' · '+(card.stage===4?'Цикл завершён':card.due>Date.now()?'Следующее: '+new Date(card.due).toLocaleDateString('ru-RU'):'К повторению')+' · Ошибок: '+card.count;
  list.append(row);
 }
}
function mountPersonalReview(){
 if(personalReviewRoot){refreshPersonalReview();return}
 const host=$('history-dialog');if(!host)return;
 const root=document.createElement('details');root.id='pg-personal-review';
 root.innerHTML='<summary id="pg-review-summary">📚 Мои ошибки</summary><label><input id="pg-review-consent" type="checkbox"> Сохранять исправления и результаты в этом браузере</label><p>Только учебные исправления. Без исходной речи и аудио. Согласие выключается после перезагрузки.</p><p id="pg-review-stats"></p><button id="pg-review-save" type="button">Сохранить последнее исправление</button><button id="pg-review-start" type="button">Тренировать ошибки</button><p id="pg-review-status" role="status"></p><form id="pg-review-form" hidden><p id="pg-review-prompt"></p><input id="pg-review-input" maxlength="100" aria-label="Переведи на китайский" autocomplete="off"><button type="submit">Проверить</button><p id="pg-review-feedback" role="status"></p><button id="pg-review-next" type="button" hidden>Следующая карточка</button><button id="pg-review-close" type="button">Закончить тренировку</button></form><div id="pg-review-list"></div><button id="pg-review-clear" type="button">Удалить личные карточки ошибок</button>';
 host.insertBefore(root,$('history'));personalReviewRoot=root;
 const q=id=>root.querySelector('#'+id);
 const close=()=>{personalReviewActive=null;personalReviewRetry=null;q('pg-review-form').hidden=true;q('pg-review-list').hidden=false;q('pg-review-input').value='';q('pg-review-feedback').textContent='';refreshPersonalReview()};
 const start=()=>{
  if(!q('pg-review-consent').checked)return;
  const due=dueDayReview(storage),card=due.find(x=>x.zh===personalReviewRetry)||due[0];personalReviewRetry=null;
  if(!card){close();q('pg-review-status').textContent='На сегодня всё повторено.';return}
  const line=getReviewCardLine(card);if(!line)return;
  cancelFollowup();stopRecognition();stopAudio();
  personalReviewActive=card.zh;q('pg-review-form').hidden=false;q('pg-review-list').hidden=true;
  q('pg-review-prompt').textContent='Переведи на китайский: '+line[2];
  q('pg-review-input').value='';q('pg-review-input').disabled=false;q('pg-review-feedback').textContent='';
  q('pg-review-form').querySelector('[type="submit"]').disabled=false;q('pg-review-next').hidden=true;q('pg-review-input').focus();
 };
 q('pg-review-consent').addEventListener('change',()=>{if(!q('pg-review-consent').checked)close();refreshPersonalReview()});
 q('pg-review-save').onclick=savePersonalCorrection;q('pg-review-start').onclick=start;q('pg-review-next').onclick=start;q('pg-review-close').onclick=close;
 q('pg-review-form').addEventListener('submit',event=>{
  event.preventDefault();if(!personalReviewActive)return;
  const result=practiceDayReview(storage,personalReviewActive,q('pg-review-input').value,q('pg-review-consent').checked);
  if(result.kind==='empty'){q('pg-review-feedback').textContent='Введи ответ.';return}
  if(!['matched','different'].includes(result.kind)){close();q('pg-review-status').textContent='Карточка недоступна.';return}
  q('pg-review-feedback').textContent=result.kind==='matched'?(result.stage===4?'✓ Цикл завершён.':'✓ Совпало. Следующее повторение через '+['1 день','3 дня','7 дней'][result.stage-1]):'Ответ не совпал с образцом (другой вариант может быть правильным). '+result.line.join(' — ');
  personalReviewRetry=result.kind==='different'?personalReviewActive:null;personalReviewActive=null;
  q('pg-review-input').disabled=true;q('pg-review-form').querySelector('[type="submit"]').disabled=true;
  q('pg-review-next').hidden=false;q('pg-review-next').textContent=personalReviewRetry?'Попробовать ещё раз':'Следующая карточка';refreshPersonalReview();
 });
 q('pg-review-clear').onclick=()=>{if(!window.confirm('Удалить все личные карточки ошибок Panda AI из этого браузера?'))return;close();personalCorrection=null;q('pg-review-status').textContent=clearDayReview(storage)?'Карточки удалены.':'Не удалось удалить карточки.';refreshPersonalReview()};
 host.addEventListener('close',close);root.addEventListener('toggle',()=>{if(root.open)refreshPersonalReview()});refreshPersonalReview();
}
function recordCorrection(input,spoken){
 const c=spoken?.correction;if(!c)return;
 if(typeof rememberPersonalCorrection==='function')rememberPersonalCorrection(c,state.confidence);
 // Keep the verified model sentence separate from Panda's conversational replies.
 record('example',c.hanzi,c.pinyin,c.ru,{kind:'correction-response',original:input,probable:spoken.probable||c.ru,why:c.why});
 // v452: read the corrected sentence immediately, not only after tapping 🔊.
 // Do not speak an unreliable ASR correction or substitute another voice/phrase.
 const verifiedClip=!c.uncertain&&lookupPandaVoiceClip(c.hanzi);
 if(verifiedClip)play({hanzi:c.hanzi,audioKey:c.hanzi});
}
function showLearnerFeedback(spoken){
 const root=$('learner-feedback');root.replaceChildren();root.hidden=true;
 if(spoken?.correction){const c=spoken.correction;for(const text of ['Предполагаемый смысл: '+(spoken.probable||c.ru),'❌ '+spoken.hanzi,'✅ '+c.hanzi,c.pinyin||'',c.ru||'',c.why].filter(Boolean)){const row=document.createElement('p');row.textContent=text;root.append(row)}root.hidden=false;}
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
 $('step').textContent=state.dayMode?'Мой день · '+(state.dayDone?'готово':(state.dayStep+1)+' из '+dailyQuestions(state.dayMini).length):state.mode==='nonstop'?'∞ Разговор без лимита':state.done?'Диалог завершён':`${state.step+1} из ${conversation.lines.length}`;
 $('mode-short').classList.toggle('active',state.mode==='short');$('mode-nonstop').classList.toggle('active',state.mode==='nonstop');
 for(const name of ['short','nonstop'])$('mode-'+name).setAttribute('aria-pressed',String(state.mode===name));
 $('mode-description').textContent=state.dayMode?'Мой день: вопросы только по изученным словам. Проверяем содержание ответа, а не тоны.':state.mode==='nonstop'?'Отвечай по HSK 1 и вводным словам HSK 2':'Панда спрашивает — ты отвечаешь по уроку';
 const bars=document.querySelector('.bars');bars.replaceChildren();bars.hidden=state.mode==='nonstop';
 for(let i=0;i<conversation.lines.length;i++){const b=document.createElement('i');b.className='bar'+(state.done||i<=state.step?' on':'');bars.append(b)}
 $('finish').hidden=state.mode!=='nonstop';$('next').hidden=state.mode!=='nonstop';
 $('message').placeholder=state.done&&state.mode==='short'?'Спроси Панду или начни заново…':'Напиши по-китайски…';
 const context=line.context||(state.mode==='nonstop'?(state.prompt?.line.context||''):conversation.context||'');
 $('exercise-banner').textContent=conversation.id===5&&state.mode==='short'&&!line.context?'Учебная сценка: '+context:context;$('exercise-banner').hidden=!context;
 const activePrompt=state.followup||state.prompt?.line;const questionExamples=state.dayMode?null:state.followup||pickCoursePrompt(lesson(),curriculum,state.questions,new Date(),{...state.profile,unlocked:state.allowed});
 const examples=state.dayMode?(state.dayDone?[]:[String(state.prompt?.line?.hint||'').replace(/^Попробуй:\s*/,'')]):state.mode==='nonstop'?(state.awaitQuestion?[...(questionExamples?[questionExamples.hanzi]:[]),...extraExamples(lesson())]:[...(activePrompt?.accepted||activePrompt?.verifiedLines?.[1]?.accepted||[]).filter(x=>/[\u3400-\u9fff]/.test(x)).slice(0,2),...(questionExamples?[questionExamples.hanzi]:[])]):state.done?extraExamples(conversation.id):validatedVariants(conversation.id,state.step,conversation.lines);
 $('quick-phrases').replaceChildren();for(const text of examples.filter((text,index,all)=>all.findIndex(x=>normalize(x)===normalize(text))===index).slice(0,3)){const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',()=>{$('message').value=text;$('message').focus()});$('quick-phrases').append(b)}
 document.documentElement.dataset.hint=String(state.hint);$('hint').setAttribute('aria-expanded',String(state.hint));$('hint-text').hidden=!state.hint;
 if(state.hint)$('hint-text').textContent=state.dayMode?(state.prompt?.line?.hint||'Говори по теме Мой день.'):state.mode==='nonstop'?(state.awaitQuestion?'Можно спросить: '+(questionExamples?.hanzi||'你好吗？')+' — '+(questionExamples?.ru||'Как дела?'):(activePrompt?.instruction||'Выбери короткую фразу по текущей теме.')):state.done?'Нажми «Заново» для нового диалога или задай вопрос.':conversation.lines[state.step].instruction;
 refreshReview();updateMic();
}
function rotateGreeting(){let index=0;try{index=Number(storage?.getItem('pg-panda-live-practice-greeting-v1'))||0;storage?.setItem('pg-panda-live-practice-greeting-v1',String((index+1)%4))}catch{}return index%4}
function dayReturnHref(){
 const params=new URLSearchParams(location.search);
 const mini=/^[0-2]$/.test(params.get('mini')||'')?params.get('mini'):'0';
    if(params.get('from')==='hsk2-lesson1')return './hsk2-lesson1.html?step=8';
 return './hsk2-life-course.html?from=hsk2-life-course&return=done&mini='+mini+'&v=420';
}
function initLesson(id){
 resetSemanticPilot();hsk2=null;state.naturalAwaiting=null;
 cancelFollowup();stopAudio();stopRecognition();base=prepareConversation(CONVERSATIONS.find(c=>c.id===id)||CONVERSATIONS[0],new Date());
 conversation=withPracticeGreeting(base,rotateGreeting());state.step=0;state.done=false;state.reviewStep=null;state.prompt=null;state.shortDisplay=null;state.nonstopDisplay=null;state.awaitQuestion=false;state.hint=false;state.topic=base.id;state.turns=0;state.askedInTopic=0;showLearnerFeedback(null);
 state.allowed=accessibleLessons(storage,conversation.id);state.profile.hasNumbers=state.allowed.includes(3);state.cursor=Math.max(0,state.allowed.indexOf(conversation.id));$('lesson-select').value=String(conversation.id);
 const routes={1:'panda-lesson1.html',2:'hsk1-second-v203.html',3:'hsk1-third-v212.html',4:'hsk1-fourth-v214.html',5:'hsk1-fifth-v227.html',6:'hsk1-family-v231.html',7:'hsk1-weather-v231.html'};$('back-link').href='./'+routes[conversation.id];
 if(new URLSearchParams(location.search).get('from')==='hsk2-about-me') $('back-link').href='./hsk2-about-me.html?step=8';
 $('allowed-topics').textContent='Доступны текущий и пройденные уроки: '+state.allowed.map(n=>CONVERSATIONS.find(c=>c.id===n).theme).join(', ')+'. Панда задаёт вопросы из этих уроков, использует их голосовые записи и разбирает слова.';
 $('words').replaceChildren();for(const w of [...(base.vocabulary||base.newWords||[]),...(base.examples||[])]){const p=document.createElement('p');p.textContent=[w.hanzi,w.pinyin,w.ru].join(' — ');$('words').append(p)}
 $('knowledge-answer').textContent='';$('message').value='';note('');
 if(state.dayMode){state.mode='nonstop';state.dayStep=0;state.dayDone=false;$('back-link').href=dayReturnHref();$('allowed-topics').textContent='Практика Мой день: вопросы ограничены словами, которые ученик уже прошёл в курсе 2.';askNext();}else if(state.mode==='nonstop')askNext();else say(conversation.lines[0],false);
}
function askNext(){
 cancelFollowup();stopRecognition();stopAudio();state.awaitQuestion=false;state.dayResumeStep=null;
 if(state.dayMode){
  const prompt=dailyQuestions(state.dayMini)[state.dayStep];
  if(!prompt){state.dayDone=true;state.prompt=null;say(dailyFinal,false);note('Все вопросы по теме Мой день пройдены. Это проверка смысла, а не тонов. Нажми «Назад», чтобы вернуться в курс.');return;}
  state.prompt={line:prompt};state.topic=1;state.questions.push(prompt.hanzi);
  say(prompt,document.documentElement.dataset.pandaLiveReady==='true');note('Мой день · вопрос '+(state.dayStep+1)+' из '+dailyQuestions(state.dayMini).length+'. Ответь голосом или текстом.');return;
 }
 const topics=state.lockedTopic&&state.allowed.includes(state.lockedTopic)?[state.lockedTopic]:(state.allowed.length?state.allowed:[conversation.id]);
 if(!state.lockedTopic&&state.askedInTopic>=3&&topics.length>1){state.cursor=(state.cursor+1)%topics.length;state.askedInTopic=0;}
 const selectedTopic=state.lockedTopic||topics[state.cursor%topics.length];
 const selected=pickCoursePrompt(selectedTopic,curriculum,state.questions,new Date(),{...state.profile,unlocked:state.allowed});
 const p=selected?{line:selected}:choosePracticePrompt(CONVERSATIONS,state.allowed,state.questions,new Date(),selectedTopic);
 if(!p){note('Для доступных уроков пока нет проверенных вопросов.');return}
 state.prompt=p;state.topic=p.line.lesson;state.discussed.add(p.line.lesson);state.questions.push(p.line.hanzi);state.askedInTopic++;if(state.questions.length>50)state.questions.shift();
 say(p.line);note('Урок '+state.topic+'. Ответь или сам спроси Панду по пройденному материалу.');
}
function setMode(mode){
 if(mode===state.mode)return;
 resetSemanticPilot();
 if(hsk2){
  cancelFollowup();stopRecognition();stopAudio();
  // v550: default Panda AI boots HSK2-101 internally. Non-Stop must
  // activate actual open chat, not only change the selected tab.
  // Explicit course lessons and the My Day scenario keep scored practice.
  if(mode==='nonstop'&&entry.beginnerGreeting&&hsk2.id===101){
   hsk2.openChat=true;state.mode='nonstop';state.prompt=null;
   state.naturalAwaiting=null;state.awaitQuestion=true;state.hint=false;
   render();if(semanticFreeChat()){const last=state.history.at(-1);if(last?.who==='panda')observeSemanticPanda(last);}note('Non-Stop: свободный разговор на знакомые темы. Напиши свою фразу по-китайски.');
   return;
  }
  // Leaving free topic chat restores the ordinary scored HSK2 question path.
  if(hsk2.openChat&&mode==='short'){
   hsk2.openChat=false;state.mode='short';askHSK2(false);
   note('Короткие вопросы HSK 2. Теперь отвечай на учебный вопрос.');return;
  }
  state.mode=mode;
  if(hsk2.done){hsk2.done=false;hsk2.index=0;askHSK2(false)}else render();
  return;
 }
 if(mode==='short')state.lockedTopic=null;if(state.dayMode&&mode==='short'){state.dayMode=false;state.dayDone=false;state.prompt=null;}if(state.mode===mode)return;cancelFollowup();stopRecognition();stopAudio();if(state.mode==='short')state.shortDisplay=state.display;else state.nonstopDisplay=state.display;state.mode=mode;state.hint=false;note('');if(mode==='nonstop'){if(state.prompt){state.display=state.nonstopDisplay||state.prompt.line;render()}else askNext()}else{state.display=state.shortDisplay||(state.done?state.shortReply:conversation.lines[state.step]);render()}}
let hsk2=null;
function beginHSK2(id,index=0,autoplay=true,skipInitialQuestion=false){
 resetSemanticPilot();friendlyStage=null;state.naturalAwaiting=null;
 const t=getTopic(id);if(!t)return false;
 cancelFollowup();stopAudio();stopRecognition();hsk2={id:t.id,index,done:false,exact:0,similar:0,unknown:0,context:null};
 state.mode='short';state.dayMode=false;state.done=false;
 if(dayParams.get('from')==='hsk2-about-me')$('back-link').href='./hsk2-about-me.html?step=7';
 $('allowed-topics').textContent='HSK 2 · '+t.name+' — разговорная практика по изученным конструкциям.';
 $('words').replaceChildren();for(const w of t.words){const p=document.createElement('p');p.textContent=[w.zh,w.py,w.ru].join(' — ');$('words').append(p)}
 if(!skipInitialQuestion)askHSK2(autoplay);return true;
}
function askHSK2(autoplay=true){
 const q=getTopic(hsk2.id).questions[hsk2.index],l=prompt(q);
 state.prompt={line:{...l,accepted:q.options.map(a=>a[0])}};state.awaitQuestion=false;state.hint=false;say(l,autoplay);
}
// v556: a reviewed independent statement is not a failed lesson answer.
// Keep scored exact/variant answers and dedicated My Day training intact.
function respondIndependentNatural(input){
 if(state.dayMode||entry.kind==='scenario')return false;
 const natural=respondToNaturalStatement(input,{awaiting:state.naturalAwaiting});
 if(!natural||(natural.kind!=='statement'&&!['work','identity','family','everyday'].includes(natural.domain))||!natural.spoken?.known||(!natural.spoken.pinyin&&natural.domain!=='identity')||natural.next==='clarify')return false;
 state.naturalAwaiting=natural.next;
 learner(input,natural.spoken);
 state.turns=(state.turns||0)+1;
 say(natural.reply,!!lookupPandaVoiceClip(natural.reply.hanzi));
 note(natural.message);
 return true;
}
function submitHSK2(input){
 // "Своя фраза" is conversation, not a scored HSK2 quiz.
 if(hsk2.openChat){
  const out=replyHSK2(input,hsk2.id,hsk2.index,true,hsk2.context);
  if('context' in out)hsk2.context=out.context;
  let fallback=null;
  if(out.kind==='unknown')fallback=answerLive(input,{allowed:state.allowed,topic:conversation.id,prompt:null,curriculum,date:new Date(),turn:state.turns,profile:state.profile});
  const known=out.spoken||knownHSK2(input);
  const spoken=fallback?.spoken?.known?fallback.spoken:known?{known:true,pinyin:known.pinyin||null,translation:known.ru||known.translation||null}:null;
  learner(input,spoken);
  state.turns=(state.turns||0)+1;
  const reply=fallback?.reply||(['example','variant'].includes(out.kind)?
   {hanzi:'我明白了。你还想说什么？',pinyin:'Wǒ míngbai le. Nǐ hái xiǎng shuō shénme?',ru:'Понятно. Что ещё хочешь рассказать?'}:
   out.kind==='unknown'?
    {hanzi:'你能说得简单一点吗？',pinyin:'Nǐ néng shuō de jiǎndān yìdiǎn ma?',ru:'Можешь сказать немного проще?'}:out.line);
  if(reply)say(reply,!!lookupPandaVoiceClip(reply.hanzi));
  note(out.kind==='unknown'&&!fallback?.reply?
   'Пока нет проверенного ответа на эту формулировку. Попробуй проще или другое выражение. Тоны не проверялись.':
   'Продолжай разговор своими словами. Тоны произношения не оценивались.');
  return;
 }
 const t=getTopic(hsk2.id),q=t.questions[hsk2.index],prior=state.display,out=replyHSK2(input,hsk2.id,hsk2.index,hsk2.done,hsk2.context);
 // Origin-question wildcard used to accept any 我是… as a nationality.
 // A reviewed profession is an independent statement, not an origin answer.
 const possibleRoleInsteadOfOrigin=hsk2.id===101&&hsk2.index===0&&/^我(?:不)?是/.test(normalize(input));
 if(out.kind!=='accepted'&&(out.kind!=='variant'||possibleRoleInsteadOfOrigin||(['work-place','job-role','job-liking','work-busy','job-change','after-work'].includes(state.naturalAwaiting)||/^(intro-|family-|hobby-frequency:|food-|routine-|weather-|shop-|travel-|health-)/.test(String(state.naturalAwaiting||''))))&&respondIndependentNatural(input))return;
 const known=out.spoken||knownHSK2(input);const legacy=known?null:analyzeLearner(input,[1,2,3,4,5,6,7],null,curriculum,false);
 const spoken=known?{known:true,pinyin:known.pinyin,translation:known.ru}:legacy?.known?legacy:null;
 if('context' in out)hsk2.context=out.context;
 if(out.kind==='accepted'){learner(input,{known:true,pinyin:out.answer.pinyin,translation:out.answer.ru});hsk2.exact++;}
 else if(out.kind==='variant'){learner(input,spoken);hsk2.similar++;}
 else if(out.kind==='unknown'){
 const c=explainPandaAnswer441(input,{prompt:null,confidence:state.confidence})||correctPandaGrammarV2(input,{prompt:null,confidence:state.confidence})||correctCommonPhrase(input);
 if(c){learner(input,c.spoken);recordCorrection(input,c.spoken);note(c.message);render();return;}
 learner(input,spoken);hsk2.unknown++;if(out.line)say(out.line,true);note('Ответ не подтверждён. Текущий вопрос: '+(state.prompt?.line?.panda||q.q));return;
 }else{learner(input,spoken);if(out.action==='slow')state.slow=true;if(out.action==='repeat'&&prior){say(prior,true);return;}if(out.line)say(out.line,!out.followup);if(out.followup)say(out.followup,true);if(out.coachNote)note(out.coachNote);if(out.kind==='end')hsk2.done=true;return;}
 if(hsk2.index+1<t.questions.length){hsk2.index++;askHSK2();return;}
 if(state.mode==='nonstop'){hsk2.id=HSK2_TOPICS[(HSK2_TOPICS.findIndex(x=>x.id===hsk2.id)+1)%HSK2_TOPICS.length].id;hsk2.index=0;askHSK2();return;}
 hsk2.done=true;say(hsk2Line(['很好！','Hěn hǎo!','Раунд завершён. Точных ответов: '+hsk2.exact+'. Вариантов по смыслу: '+hsk2.similar+'. Не распознано: '+hsk2.unknown+'. Тоны не оценивались.']));
}
let friendlyStage=null;
function submit(raw){
 const input=String(raw||'').trim();if(!input){note('Скажи или напиши фразу на китайском.');return}
 cancelFollowup();stopRecognition();stopAudio();state.dayResumeStep=null;$('message').value='';
 // Experimental route takes only explicitly reviewed learner metadata and exact existing audio.
 // All other input follows the established engine below, including corrections.
 if(semanticFreeChat()&&(state.confidence===null||state.confidence>=.85)){
  const planned=semanticPilot.plan(input,{mode:'free-chat'});
  const spoken=planned&&semanticMetadata(input,planned.semantic);
  if(spoken){
   friendlyStage=null;state.naturalAwaiting=null;state.awaitQuestion=true;state.turns=(state.turns||0)+1;
   learner(input,spoken);semanticContinues=planned.continuesLearnerTurn===true;
   say(planned.line,true,{semanticPilot:true,kind:planned.kind,toneVerified:false});
   note(planned.kind==='explain-exact'?'Значение предыдущей реплики показано в переводе. Тоны не оценивались.':'Панда поняла смысл реплики. Тоны по тексту не оценивались.');
   return;
  }
 }else if(semanticPilot)resetSemanticPilot();
 // Accept repeated agreement in conversational context without replacing unrelated lesson answers.
 if(!state.dayMode&&((hsk2&&(hsk2.openChat||(entry.beginnerGreeting&&hsk2.id===101)))||(!hsk2&&state.mode==='nonstop'))&&/^(对对|对对对|是的是的)$/.test(normalize(input))){
  const last=[...state.history].reverse().find(t=>t.who==='panda');
  const s=normalize(input),py=s==='对对'?'Duì, duì.':s==='对对对'?'Duì, duì, duì.':'Shì de, shì de.';
  learner(input,{known:true,pinyin:py,translation:'Да, верно.',toneVerified:false});
  const reply=normalize(last?.hanzi)==='你今天休息吗'?{hanzi:'那你休息一下吧。',pinyin:'Nà nǐ xiūxi yíxià ba.',ru:'Тогда немного отдохни.'}:{hanzi:'然后呢？',pinyin:'Ránhòu ne?',ru:'А дальше?'};
  state.naturalAwaiting=null;state.awaitQuestion=true;say(reply,!!lookupPandaVoiceClip(reply.hanzi));note('Панда поняла согласие; тоны не оценивались.');return;
 }
 // A standalone 什么 / 什么意思 / 请再说一遍 is a contextual clarification in free chat.
 // Preserve graded lesson flows and never reinterpret a longer question as repetition.
 if(!state.dayMode&&((hsk2&&(hsk2.openChat||(entry.beginnerGreeting&&hsk2.id===101))))&&/^(?:什么|什么意思|请再说一遍|再说一遍|你说什么|没听懂|我没听懂)$/.test(normalize(input))){
  const expressions={'什么':['Shénme?','Что?'],'什么意思':['Shénme yìsi?','Что это значит?'],'请再说一遍':['Qǐng zài shuō yí biàn.','Повтори, пожалуйста.'],'再说一遍':['Zài shuō yí biàn.','Повтори ещё раз.'],'你说什么':['Nǐ shuō shénme?','Что ты сказал(а)?'],'没听懂':['Méi tīng dǒng.','Не понял(а).'],'我没听懂':['Wǒ méi tīng dǒng.','Я не понял(а).']};
  const previous=[...state.history].reverse().find(t=>t.who==='panda'&&t.hanzi&&t.pinyin&&t.ru);
  const [pinyin,translation]=expressions[normalize(input)];
  learner(input,{known:true,pinyin,translation,toneVerified:false});
  const reply=previous?{hanzi:previous.hanzi,pinyin:previous.pinyin,ru:previous.ru}:{hanzi:'你想问什么？',pinyin:'Nǐ xiǎng wèn shénme?',ru:'Что ты хочешь спросить?'};
  say(reply,!!lookupPandaVoiceClip(reply.hanzi));note('Панда повторила предыдущую реплику. Перевод и пиньинь показаны. Тоны не оценивались.');return;
 }
 // Recognize voluntary Chinese name introductions in free HSK1 conversation.
 const standaloneName=state.mode==='nonstop'&&!hsk2&&!state.dayMode&&/^我叫[\p{Script=Han}]{1,12}$/u.test(normalize(input));
 const alreadyIntroduced=state.history.some(turn=>turn.who==='you'&&/^我叫[\p{Script=Han}]{1,12}$/u.test(normalize(turn.hanzi)));
  const establishedLove=normalize(input)==='我爱你'&&alreadyIntroduced&&!state.dayMode&&(!hsk2||hsk2.openChat||(entry.beginnerGreeting&&hsk2.id===101));
  if(establishedLove){
   const affectionate=respondToNaturalStatement(input,{introduced:true});
   friendlyStage=null;state.naturalAwaiting=null;state.awaitQuestion=true;
   learner(input,affectionate.spoken);say(affectionate.reply,!!lookupPandaVoiceClip(affectionate.reply.hanzi));note(affectionate.message);return;
  }
  const introduction=friendlyIntroduction(input,standaloneName?'name':friendlyStage);
 friendlyStage=introduction?.next||null;
 if(introduction){
  const [pinyin,translation]=introduction.spoken;
  learner(input,{known:true,pinyin,translation});
  const [hanzi,replyPinyin,ru]=introduction.reply;
  note('');
  say({hanzi,pinyin:replyPinyin,ru});
  return;
 }
 // v548: an independent, basic HSK1 question about Panda's profession
 // must be understood in BOTH Short and Non-Stop modes. The previously
 // approved Luvvoice files already include 你是老师吗？ (p01) and
 // 我是老师。 (p03); never replace them with synthetic speech or PA-001,
 // which is for the different assertion 我是老师 by the learner.
 // The main /panda-voice-pilot.html route boots with beginnerGreeting
 // inside HSK2 topic 101, even when the visible tab says "Краткие диалоги".
 // Exempt that conversational entry (and explicit free HSK2 chat) from scored
 // HSK2 answer validation; retain the dedicated HSK2 My Day path untouched.
 if(!state.dayMode&&(!hsk2||hsk2.openChat||(entry.beginnerGreeting&&hsk2.id===101))){
  const teacherQuestion=normalize(input);
  if(teacherQuestion==='你是老师吗'||teacherQuestion==='你是老师'){
   const isQuestion=teacherQuestion.endsWith('吗');
   learner(input,{
    known:true,
    pinyin:isQuestion?'Nǐ shì lǎoshī ma?':'Nǐ shì lǎoshī?',
    translation:isQuestion?'Ты учитель?':'Ты учитель.'
   });
   state.naturalAwaiting=null;
   state.awaitQuestion=true;
   const teacherReply={hanzi:'我是老师。',pinyin:'Wǒ shì lǎoshī.',ru:'Я учитель.'};
   say(teacherReply,!!lookupPandaVoiceClip(teacherReply.hanzi));
   note('Панда поняла вопрос. Ответ озвучивается существующей записью 我是老师. Тоны по тексту не оцениваются.');
   return;
  }
 }
 // v539: a simple 什么？ requests repetition, it is not an unknown phrase.
 if(!hsk2&&!state.dayMode&&state.mode==='nonstop'&&normalize(input)==='什么'){
  learner(input,{known:true,pinyin:'Shénme?',translation:'Что?'});
  const previousQuestion=state.prompt?.line;
  const questionText=String(previousQuestion?.hanzi||previousQuestion?.panda||'');
  if(previousQuestion&&/[？?]$/.test(questionText)){
   say(previousQuestion,!!lookupPandaVoiceClip(questionText));
   note('Панда повторила последний вопрос.');
  }else{
   say({hanzi:'你想问什么？',pinyin:'Nǐ xiǎng wèn shénme?',ru:'О чём ты хочешь спросить?'},false);
   note('Можешь задать вопрос по-китайски.');
  }
  return;
 }
 // v542: use reviewed beginner statements as genuine conversation turns,
 // rather than treating a correct assertion as a failed quiz answer.
 // Keep short HSK1 drills and the independent HSK2 My Day scenario intact.
 // Default beginner chat understands natural statements in both visible tabs;
 // other explicit HSK2 lesson entries retain their assessed question path.
 if(((hsk2&&(hsk2.openChat||(entry.beginnerGreeting&&hsk2.id===101)))||(!hsk2&&state.mode==='nonstop'))&&!state.dayMode){
  // Keep HSK1 Non-Stop family answer validation and recorded follow-ups intact.
  // v552 family facts are for the free HSK2 chat route; new 有没有 questions work in both.
  const legacyFamilyAnswer=!hsk2&&state.mode==='nonstop'&&/^(?:我(?:有一个|有|没有)(?:哥哥|姐姐|弟弟|妹妹)|我(?:的)?(?:哥哥|姐姐|弟弟|妹妹)[一二三四五六七八九十]岁)$/u.test(normalize(input));
  const natural=legacyFamilyAnswer?null:respondToNaturalStatement(input,{awaiting:state.naturalAwaiting});
  if(natural&&!(!hsk2&&state.mode==='nonstop'&&(natural.domain==='identity'||(natural.domain==='everyday'&&/^(你好吗|今天天气怎么样|你几点起床|你几点睡觉)$/.test(normalize(input)))||(natural.domain==='family'&&(/^你有(?:哥哥|姐姐|弟弟|妹妹|妈妈|爸爸)吗$|^你家有几口人$/.test(normalize(input))))))){
   state.naturalAwaiting=natural.next;
   learner(input,natural.spoken);
   state.turns=(state.turns||0)+1;
   state.awaitQuestion=true;
   // Exact approved clips autoplay; unrecorded answers remain text-only.
   say(natural.reply,!!lookupPandaVoiceClip(natural.reply.hanzi));
   note(natural.message);
   return;
  }
  state.naturalAwaiting=null;
 }
 // v536: standalone HSK1 short and Non-Stop replies from real Android reports.
 // HSK2 day practice keeps its dedicated answer validator.
 if(!hsk2&&!state.dayMode){
  const s=normalize(input);
  const genuineLessonAnswer=state.mode==='short'&&!state.done&&conversation?.lines?.[state.step]&&verifyAnswerFor(conversation.lines,state.step,input).ok;
  if(!genuineLessonAnswer&&['不好','我不好','非常好','我非常好','很不错你呢','我很不错你呢','休息','你可以说中文','跑步这么样'].includes(s)){
   const social=everydayMeaning(input,lesson(),null);
   if(social){
    learner(input,{known:true,hanzi:input,pinyin:social.spoken[1],translation:social.spoken[2],topic:1});
    const [hanzi,pinyin,ru]=social.reply;
    say({hanzi,pinyin,ru},false);
    note(social.coachNote||'Панда поняла фразу. Китайские тоны по тексту не оценивались.');
    return;
   }
  }
 }
 if(hsk2){submitHSK2(input);return;}
 if(state.dayMode){
  if(state.dayDone){note('Тренировка завершена. Вернись к уроку или выбери обычные диалоги.');return;}
  // Keep reviewed grammar corrections available inside the HSK2 day dialogue.
  const correction=explainPandaAnswer441(input,{prompt:state.prompt?.line,confidence:state.confidence})||correctPandaGrammarV2(input,{prompt:state.prompt?.line,confidence:state.confidence})||correctCommonPhrase(input);
  if(correction){learner(input,correction.spoken);recordCorrection(input,correction.spoken);pose('retry');note(correction.message);render();return;}
  // A learner may ask one of the recorded HSK2 questions. Answer it in the
  // HSK2 context without advancing the current five-step practice prompt.
  const dayQA=recordedPandaAnswer(input,[1],{course:'hsk2-day'});
  if(dayQA?.kind==='question'){
   learner(input,dayQA.spoken);state.dayResumeStep=state.dayStep;say(dayQA.reply,true);
   note('Это вопрос HSK2 «Мой день». После ответа Панда вернёт текущий вопрос тренировки.');
   return;
  }
  const checked=checkDayAnswer(input,state.dayStep,state.dayMini);
  learner(input,checked.spoken);
  if(checked.ok){state.dayStep++;happy();if(state.dayStep>=dailyQuestions(state.dayMini).length){askNext()}else{askNext();note('Ответ по теме принят. Следующий вопрос. Тоны не оценивались.')}}
  else{pose('retry');note(checked.message);render();}
  return;
 }
 if(state.mode==='nonstop'){
  const activePrompt=state.awaitQuestion?null:state.prompt?.line;
   const rawResult=explainPandaAnswer441(input,{prompt:activePrompt,confidence:state.confidence})||correctPandaGrammarV2(input,{prompt:activePrompt,confidence:state.confidence})||correctCommonPhrase(input)||interpretWorkReply(input,{prompt:activePrompt})||answerLive(input,{allowed:state.allowed,topic:lesson(),prompt:activePrompt,curriculum,date:new Date(),turn:state.turns,profile:{...state.profile,recentQuestions:state.questions.slice(-40)}});
   const familyResult=continueFamilyAfterAnswer({
    input,activePrompt,
    result:addPersonalFollowup(rawResult,{allowed:state.allowed,recentQuestions:state.questions.slice(-40)}),
    allowed:state.allowed,questions:state.questions.slice(-40),
    history:state.history.slice(-60),catalog:topicCatalogGroups(),lookupAudio:lookupPandaVoiceClip
   });
   // v430: use only known facts from THIS open dialogue, and only reviewed
   // questions whose exact approved Panda audio exists.
   const rememberedFamily=state.confidence!==null&&state.confidence<.65?familyResult:
    enrichConversation430({
     input,activePrompt,result:familyResult,profile:state.profile,
     allowed:state.allowed,questions:state.questions.slice(-40),
     history:state.history.slice(-60),catalog:topicCatalogGroups(),lookupAudio:lookupPandaVoiceClip
    });
   const result=state.confidence!==null&&state.confidence<.65?rememberedFamily:
    enrichTopics431({
     input,activePrompt,result:rememberedFamily,profile:state.profile,
     allowed:state.allowed,questions:state.questions.slice(-40),
     history:state.history.slice(-60),catalog:topicCatalogGroups(),lookupAudio:lookupPandaVoiceClip
    });
  learner(input,result.spoken||analyzeLearner(input,state.allowed,state.prompt?.line,curriculum));
  if(result.kind==='empty'){note(result.message);return}
  if(result.kind==='correction'){recordCorrection(input,result.spoken);pose('retry');note(result.message);render();return}
  if(result.reply){
   // Decide completion before drawing Panda's reply. The translated learner
   // date already appears in chat, so the Panda can acknowledge the exercise.
   const completedCalendarRound=isCalendarRoundFinished({
    input,resultKind:result.kind,spoken:result.spoken,prompt:activePrompt,questions:state.questions
   });
   const closingReply=completedCalendarRound?
    {hanzi:'很好！',pinyin:'Hěn hǎo!',ru:'Отлично!'}:result.reply;
   const closingSummary='Мы повторили день недели и дату. Выбери другую тему или задай свой вопрос.';
   state.turns++;state.topic=state.lockedTopic&&state.allowed.includes(state.lockedTopic)?state.lockedTopic:(result.lesson||lesson());state.discussed.add(state.topic);if(state.allowed.includes(state.topic))state.cursor=state.allowed.indexOf(state.topic);if(state.confidence===null||state.confidence>=.65){remember(result.spoken);state.profile.followupOffset=(state.profile.followupOffset||0)+1;}
   state.awaitQuestion=true;if(result.kind==='answer')happy();
   // Do not attempt nonexistent MP3 or switch Panda to a different voice.
   const playReply=completedCalendarRound?false:
    (!result.spoken?.calendarLiteral||!!lookupPandaVoiceClip(closingReply.hanzi));
   say(closingReply,playReply,completedCalendarRound?
    {kind:'calendar-complete',summary:closingSummary}:
    result.explanation?{explanation:result.explanation}:null);
   if(result.wordCard)showWordCard(result.wordCard);
    else if(result.explanation){const row=document.createElement('p');row.textContent=result.explanation;$('learner-feedback').replaceChildren(row);$('learner-feedback').hidden=false;document.documentElement.dataset.feedback='true';}
   let followup=result.followup;
   // Respect the learner's actual calendar topic and previously asked questions.
   // The generic question picker can otherwise jump from today's weekday to a
   // tomorrow-weekday variant, or alternate today's date/weekday indefinitely.
   if(result.spoken?.calendarLiteral&&!state.lockedTopic){
    const otherLesson=result.spoken.topic===4?5:4;
    const nextCalendar=otherLesson===5?'今天几月几号':'今天星期几';
    const askedRecently=state.questions.slice(-8).some(q=>normalize(q)===nextCalendar);
    const candidate=state.allowed.includes(otherLesson)&&!askedRecently?
     nextTopicPrompt(otherLesson,[],new Date(),state.profile):null;
    followup=candidate&&normalize(candidate.hanzi)===nextCalendar
     &&lookupPandaVoiceClip(candidate.hanzi)?
     {...candidate,isContextual:true,audioKey:candidate.hanzi}:null;
   }
   if(completedCalendarRound){followup=null;}
   else if(followup&&state.lockedTopic&&state.allowed.includes(state.lockedTopic)&&followup.lesson!==state.lockedTopic){
     // Preserve contextual questions from the chosen topic. If the generic
     // engine suggests a different topic, use a verified question here instead.
     const pool=topicCatalogGroups().find(g=>g.lesson===state.lockedTopic)?.questions||[];
     const q=pool.find(item=>!state.questions.some(seen=>normalize(seen)===normalize(item.hanzi)))||pool[0];
     followup=q?{hanzi:q.hanzi,pinyin:q.pinyin,ru:q.ru,lesson:state.lockedTopic,audioKey:q.hanzi,accepted:[]}:null;
   }
   else if(followup&&followup.intent!=='relative-age'&&!followup.isContextual){
     if(state.allowed.length>1&&state.turns%3===0){
      const currentIndex=state.allowed.indexOf(state.topic);
      state.cursor=(currentIndex+1)%state.allowed.length;state.askedInTopic=0;
     }
     const selected=state.allowed[state.cursor%state.allowed.length]||state.topic;
     followup=pickCoursePrompt(selected,curriculum,state.questions.concat(input),new Date(),{...state.profile,unlocked:state.allowed})||followup;
    }
   // v425: keep a spontaneous learner question on its own topic and avoid echoing it.
   followup=coherentPandaFollowup({input,result,followup,
    allowed:state.lockedTopic?[state.lockedTopic]:state.allowed,
    questions:state.questions.slice(-20),catalog:topicCatalogGroups(),lookupAudio:lookupPandaVoiceClip});
   // v435: preserve a useful question but never re-ask a known fact.
   // Replacement is from the same unlocked topic with an exact existing MP3.
   if(state.confidence===null||state.confidence>=.65)
    followup=refineFollowup435({
     followup,profile:state.profile,
     allowed:state.lockedTopic?[state.lockedTopic]:state.allowed,
     questions:state.questions.slice(-40),history:state.history.slice(-60),
     catalog:topicCatalogGroups(),lookupAudio:lookupPandaVoiceClip
    });
   if(followup){state.followup=followup;scheduleFollowup(Math.max(4500,Math.min(7000,(result.reply.pinyin?.length||50)*65)));render();}
   note(completedCalendarRound?closingSummary:
    followup?.intent==='relative-age'?'Панда запомнила твою реплику о семье и задаст уточняющий вопрос.':
    followup?'Панда продолжит вопросом по пройденным темам. Можешь ответить или спросить раньше.':
    result.message||'Продолжай или нажми «Ещё вопрос».');
   if(state.confidence!==null&&state.confidence<.65){cancelFollowup();note('Распознано неуверенно. Проверь текст в истории и повтори при необходимости.');}return;
  }
  note(result.message);render();return;
 }
 // Keep actual lesson answers and reviewed grammar corrections on the original path.
 if((state.done||!verifyAnswerFor(conversation.lines,state.step,input).ok)&&respondIndependentNatural(input))return;
 const spoken=explainPandaAnswer441(input,{prompt:conversation.lines[state.step],confidence:state.confidence})?.spoken||correctPandaGrammarV2(input,{prompt:conversation.lines[state.step],confidence:state.confidence})?.spoken||correctCommonPhrase(input)?.spoken||analyzeLearner(input,[1,conversation.id],conversation.lines[state.step],curriculum);learner(input,spoken);
 const greeting=/^(你好[呀啊]?|早上好[呀啊]?|中午好[呀啊]?|下午好[呀啊]?|晚上好[呀啊]?)$/.test(normalize(input));
 const social=replyToExtraSpeech(input,conversation.id,curriculum);
 if(spoken.correction){recordCorrection(input,spoken);pose('retry');note(spoken.correction.why);render();return}
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
 // An independent calendar phrase may be discussed without counting it as
 // the required short-dialog answer or advancing the lesson.
 if(question.spoken?.calendarLiteral&&question.reply){
  say(question.reply,!!lookupPandaVoiceClip(question.reply.hanzi));
  note(state.done?'Календарная фраза понятна. Можешь продолжить в Non-Stop.':
   'Календарная фраза понятна. Теперь ответь на учебный вопрос: '+conversation.lines[state.step]?.hanzi);
  return;
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
 const link=new URL(location.href);
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

function selectPandaSpeech563(result, allowProfessionRecovery) {
 const alternatives=Array.from(result||[]).map(a=>({text:String(a?.transcript||'').trim(),confidence:typeof a?.confidence==='number'&&a.confidence>0?a.confidence:null})).filter(a=>a.text);
 const first=alternatives[0]||{text:'',confidence:null};
 const key=s=>s.normalize('NFKC').replace(/[\p{P}\s]/gu,'');
 if(!allowProfessionRecovery||!/^你是(?:一双|一首)(?:吗)?$/u.test(key(first.text)))return {...first,original:first.text,recovered:false};
 const exact=alternatives.find(a=>/^你是医生(?:吗)?$/u.test(key(a.text)));
 if(exact)return {...exact,original:first.text,recovered:true};
 return {...first,text:key(first.text).endsWith('吗')?'你是医生吗？':'你是医生？',original:first.text,recovered:true};
}
function startRecognition(){
 if(state.active){
   // A second tap immediately after Android permission or microphone activation is usually accidental.
   if(Date.now()-micActivatedAt<2800){note('🎙 Микрофон уже включён. Говори по-китайски…');return}
   stopRecognition();note('Микрофон остановлен по нажатию. Нажми 🎙, чтобы говорить снова.');return
  }
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){showMicRecovery('Распознавание китайской речи в этом браузере недоступно. Открой ссылку в Chrome или отвечай текстом.');return}
 if(!state.speechConsent){$('speech-dialog').showModal();return}
 if(window.isSecureContext===false){showMicRecovery('Для микрофона нужен HTTPS. Открой опубликованный Panda Go в Chrome.');return}
 cancelFollowup();stopAudio();stopRecognition();let r;
 try{
  r=new Speech();r.lang='zh-CN';r.continuous=false;r.interimResults=false;r.maxAlternatives=5;
 }catch{showMicRecovery('Браузер не смог создать сеанс распознавания. Открой ссылку в Chrome.');return}
 recognition=r;const token=++epoch;state.active=true;micActivatedAt=Date.now();
 let heard=false,failed=false,started=false,audioStarted=false;
 const valid=()=>recognition===r&&epoch===token;
 const fail=(message,unheard=false)=>{
  if(!valid())return;
  failed=true;stopRecognition();showMicRecovery(message);
  if(unheard)play(clarificationLine(2));
 };;
 hideMicRecovery();updateMic();note('Подключаю микрофон…');
 r.onstart=()=>{
  if(!valid())return;
  started=true;pose('listening');note('Распознавание запущено. Говори по-китайски…');
  clearTimeout(watchdog);
  watchdog=setTimeout(()=>{if(valid()&&!heard&&!failed)fail(audioStarted
   ?'Микрофон подключён, но речь не распознана. Попробуй говорить ближе или открой в Chrome.'
   :'Служба распознавания запустилась, но не получила звук с микрофона. Проверь разрешение или открой в Chrome.');},16000);
 };
 r.onaudiostart=()=>{if(valid()){audioStarted=true;note('🎙 Микрофон активен. Говори по-китайски…')}};
 r.onspeechstart=()=>{if(valid()){clearTimeout(speechEndTimer);note('🎙 Слышу речь, распознаю китайский…')}};
 // Request final transcription when Android Chrome detects the end of actual speech.
 // r.stop() finalizes audio; unlike abort() it can still deliver the final result.
 r.onspeechend=()=>{if(!valid()||heard)return;note('⏳ Речь закончилась. Распознаю китайскую фразу…');clearTimeout(speechEndTimer);speechEndTimer=setTimeout(()=>{if(valid()&&!heard){try{r.stop()}catch{fail('Не удалось завершить распознавание. Попробуй написать фразу или повтори ещё раз.')}}},1100)};
 r.onresult=e=>{
  if(!valid())return;
  clearTimeout(speechEndTimer);clearTimeout(recognitionEndTimer);
  const result=e.results?.[e.resultIndex??0]||e.results?.[0];
   const freeConversation=!state.dayMode&&(!hsk2||hsk2.openChat||(entry.beginnerGreeting&&hsk2.id===101));
   const selected=selectPandaSpeech563(result,freeConversation);
   const text=selected.text;
  if(!text){fail('Браузер вернул пустой ответ. Попробуй ещё раз в Chrome или напиши фразу.');return}
  heard=true;
  // A final ASR transcript must cancel all watchdogs and finish mic capture.
  // Otherwise Android can later say 'speech not recognized' after Panda replied.
  clearTimeout(watchdog);
  stopRecognition();
  const confidence=selected.confidence;
  if(confidence!==null&&confidence<.65){
   // The ASR transcript is uncertain: the learner must approve it before any dialogue update.
   state.confidence=null;$('message').value=text;
   state.speechSignal={id:(state.speechSignal?.id||0)+1,kind:'uncertain',text,confidence,contentVerified:false,toneVerified:false};
   note('Распознано неуверенно: '+selected.original+(selected.recovered?' → возможно, '+text:'')+'. Проверь текст и нажми ➤ или повтори через 🎙.');
   $('message').focus();return;
  }
  state.confidence=confidence;
  submit(text);
  // ASR returns text and optional confidence, never a validated acoustic tone score.
  const latestLearner=[...state.history].reverse().find(turn=>turn.who==='you'&&turn.hanzi===text);
  const correctionHanzi=latestLearner?.analysis?.correction?.hanzi||null;
  const reliable=!selected.recovered&&state.confidence!==null&&state.confidence>=.85;
  const kind=state.confidence!==null&&state.confidence<.65?'uncertain'
    :correctionHanzi&&reliable?'content-error':'text-only';
  state.speechSignal={
    id:(state.speechSignal?.id||0)+1,kind,text,confidence:state.confidence,
    correctionHanzi:kind==='content-error'?correctionHanzi:null,
    contentVerified:false,toneVerified:false
  };
  if(selected.recovered)note('Браузер распознал: '+selected.original+'. Панда предположила: '+text+'. Тоны не оценивались.');
   else if(kind==='uncertain')note('Распознано неуверенно. Проверь текст и повтори при необходимости.');
  state.confidence=null;
 };
 r.onerror=e=>{
  if(!valid()||heard)return;
  const reasons={
   'not-allowed':'Доступ к микрофону запрещён. Разреши микрофон для сайта в Chrome и в настройках Android.',
   'service-not-allowed':'Браузер запретил службу распознавания. Открой страницу напрямую в Chrome.',
   'network':'Служба распознавания речи не отвечает через эту сеть. Проверь интернет или используй текст.',
   'no-speech':'Не расслышала китайскую речь. Повтори поближе к микрофону.',
   'audio-capture':'Микрофон занят или недоступен. Проверь разрешение в Android и Chrome.',
   'language-not-supported':'Этот браузер не поддерживает распознавание китайского zh-CN.',
   'aborted':'Распознавание неожиданно прервалось. Попробуй ещё раз.'
  };
  fail(reasons[e?.error]||'Ошибка распознавания. Открой Panda Go напрямую в Chrome или используй текст.',e?.error==='no-speech');
 };
 r.onnomatch=()=>{if(valid()&&!heard)fail('Речь не распознана. Попробуй ещё раз или напиши ответ по-китайски.',true)};
 r.onend=()=>{if(!valid()||heard||failed)return;clearTimeout(watchdog);clearTimeout(speechEndTimer);note('⏳ Завершаю распознавание…');
  // Some mobile implementations deliver the final transcript after the end event.
  recognitionEndTimer=setTimeout(()=>{if(valid()&&!heard&&!failed)fail(started?'Распознавание завершилось без результата. Попробуй Chrome или текст.':'Браузер не подключил службу распознавания. Открой ссылку напрямую в Chrome.')},1200);
 };
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
 const groups=topicCatalogGroups();
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
$('hear').addEventListener('click',()=>play());$('speed-toggle').addEventListener('click',()=>{state.slow=!state.slow;$('speed-toggle').textContent=state.slow?'🐢 0,8×':'▶ 1×';$('speed-toggle').setAttribute('aria-pressed',String(state.slow));if(audio)audio.playbackRate=state.slow?.8:1});
$('mode-short').addEventListener('click',()=>setMode('short'));$('mode-nonstop').addEventListener('click',()=>setMode('nonstop'));
$('next').addEventListener('click',askNext);$('finish').addEventListener('click',()=>{if(state.dayMode){location.assign(dayReturnHref());return;}cancelFollowup();stopAudio();stopRecognition();state.prompt=null;setMode('short');note('Non-Stop завершён. История осталась в этой вкладке.');});
$('reset').addEventListener('click',()=>initLesson(conversation.id));$('hint').addEventListener('click',()=>{state.hint=!state.hint;render()});
for(const [button,dialog] of [['history-open','history-dialog'],['study-open','study-dialog']])$(button).addEventListener('click',()=>{stopRecognition();stopAudio();if(dialog==='history-dialog'){cancelFollowup();mountPersonalReview()}if(dialog==='study-dialog'){
 const studyTopic=lesson(),studyBase=CONVERSATIONS.find(c=>c.id===studyTopic);$('words').replaceChildren();const seenWords=new Set();for(const [zh,py,ru] of [...(curriculum[studyTopic-1]?.words||[]),...(studyBase?.examples||[]).map(w=>[w.hanzi,w.pinyin,w.ru])]){if(seenWords.has(zh))continue;seenWords.add(zh);const row=document.createElement('p');row.textContent=[zh,py,ru].join(' — ');$('words').append(row)}
 const variants=state.mode==='nonstop'?(state.followup||state.prompt?.line)?.accepted||[]:validatedVariants(conversation.id,Math.min(state.step,conversation.lines.length-1),conversation.lines);
 $('variant-choices').replaceChildren();for(const text of variants.slice(0,8)){const b=document.createElement('button');b.textContent=text;b.addEventListener('click',()=>{$('message').value=text;$(dialog).close();$('message').focus()});$('variant-choices').append(b)}
 }$(dialog).showModal()});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
$('knowledge-form').addEventListener('submit',e=>{e.preventDefault();$('knowledge-answer').textContent=answerCurriculumQuestion($('knowledge-question').value,lesson(),curriculum)});
$('review').addEventListener('click',()=>{const item=hardestMistake(storage,conversation.id);if(!item)return;setMode('short');state.step=Math.min(item.step,conversation.lines.length-1);state.reviewStep=state.step;state.done=false;$('study-dialog').close();say(conversation.lines[state.step]);note('Повтори эту фразу. После верного ответа она исчезнет из списка повторения.')});
for(const c of CONVERSATIONS.filter(c=>c.lines.length&&!c.status.startsWith('draft'))){const o=document.createElement('option');o.value=c.id;o.textContent=c.id+'. '+c.theme;$('lesson-select').append(o)}
$('lesson-select').addEventListener('change',()=>{const id=Number($('lesson-select').value);const url=new URL(location.href);url.searchParams.set('lesson',id);history.replaceState(null,'',url);initLesson(id)});
function resize(){const v=window.visualViewport;const h=v?.height||window.innerHeight;document.documentElement.style.setProperty('--screen-height',h+'px');document.documentElement.style.setProperty('--screen-top',(v?.offsetTop||0)+'px');document.documentElement.dataset.keyboard=String((window.innerHeight-h>120)||(document.activeElement?.matches('#pg346-input, #message')&&h<560))}
window.visualViewport?.addEventListener('resize',resize);window.visualViewport?.addEventListener('scroll',resize);window.addEventListener('resize',resize);document.addEventListener('focusin',resize);document.addEventListener('focusout',resize);
window.addEventListener('pagehide',e=>{cancelFollowup();stopRecognition();stopAudio();clearTimeout(poseTimer);if(!e.persisted)rig.dispose()});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelFollowup();stopRecognition();stopAudio()}});
if('serviceWorker' in navigator && !['localhost','127.0.0.1','terminal.local'].includes(location.hostname))navigator.serviceWorker.register('./sw.js?v=517',{scope:'./',updateViaCache:'none'}).then(async r=>{await r.update();r.active?.postMessage?.({type:'PRUNE_PANDA_LEGACY'})}).catch(()=>{});
if(window.ResizeObserver){const observer=new window.ResizeObserver(entries=>{document.documentElement.style.setProperty('--scene-height',entries[0].contentRect.height+'px')});observer.observe(document.querySelector('.scene'))}

// v337: Bridge for the approved artwork layer; retain the existing dialogue,
// user-audio, speech-recognition, vocabulary and progress logic unchanged.
window.PandaApprovedBridge337={
 snapshot:()=>{
  const line=current()||{};
  return {history:state.history.slice(-3).map(e=>({...e})),current:{...line},
   allowed:[...state.allowed,...HSK2_TOPICS.map(t=>t.id)],topic:hsk2?.id||lesson(),mode:state.mode,
   slow:state.slow,active:state.active,pose:$('character').dataset.state,
   feedback:$('learner-feedback').hidden?'':$('learner-feedback').textContent,
   status:$('status').textContent,audioAvailable:!$('hear').disabled,speechSignal:state.speechSignal};
 },
 chooseTopic:id=>{
  resetSemanticPilot();id=Number(id);
 if(getTopic(id))return beginHSK2(id,0,false);
  if(!state.allowed.includes(id))return false;
  hsk2=null;
  cancelFollowup();stopAudio();stopRecognition();
  state.cursor=state.allowed.indexOf(id);state.askedInTopic=0;state.topic=id;
  // Selecting a topic opens its question catalogue. Do NOT choose or speak
  // an arbitrary first prompt until the learner selects one.
  state.mode='nonstop';state.lockedTopic=id;state.prompt=null;state.awaitQuestion=true;state.hint=false;
  render();note('Тема выбрана. Выбери вопрос из списка.');
  return true;
 },
 openTopicForChat:id=>{
  id=Number(id);state.naturalAwaiting=null;
  if(getTopic(id)){
   if(!beginHSK2(id,0,false,true))return false;
   hsk2.openChat=true;state.mode='nonstop';state.prompt=null;state.awaitQuestion=true;
  }else{
   if(!window.PandaApprovedBridge337.chooseTopic(id))return false;
  }
  say({hanzi:'你想聊什么？',pinyin:'Nǐ xiǎng liáo shénme?',ru:'О чём ты хочешь поговорить?'},false);
  note('Напиши своё предложение на китайском. Панда понимает изученные выражения; незнакомую фразу может попросить уточнить.');
  return true;
 },
 topicQuestions:id=>{
  id=Number(id);
 if(getTopic(id))return getTopic(id).questions.map(q=>({...prompt(q),hasReplyAudio:!!lookupPandaVoiceClip(q.q)}));
  if(!state.allowed.includes(id))return [];
  return topicCatalogGroups().find(g=>g.lesson===id)?.questions||[];
 },
 startTopicQuestion:(id,text)=>{
  resetSemanticPilot();id=Number(id);
 if(getTopic(id)){const i=getTopic(id).questions.findIndex(q=>hsk2Norm(q.q)===hsk2Norm(text));return i>=0&&beginHSK2(id,i);}
  if(!state.allowed.includes(id))return false;
  hsk2=null;
  const question=topicCatalogGroups()
    .find(g=>g.lesson===id)?.questions.find(q=>normalize(q.hanzi)===normalize(text));
  if(!question)return false;
  cancelFollowup();stopAudio();stopRecognition();
  state.cursor=state.allowed.indexOf(id);state.askedInTopic=0;state.topic=id;
  state.mode='nonstop';state.lockedTopic=id;state.awaitQuestion=false;state.hint=false;
  const line={hanzi:question.hanzi,pinyin:question.pinyin,ru:question.ru,lesson:id,audioKey:question.hanzi};
  state.prompt={line};state.questions.push(question.hanzi);
  if(state.questions.length>50)state.questions.shift();
  say(line,true);
  note('Тема '+id+'. Панда задаёт выбранный вопрос. Ответь или продолжай разговор на эту тему.');
  return true;
 },

 retryPlayback:()=>play(blockedPlayback),play:()=>play(),playEntry:entry=>{const sameBlocked=!!state.pendingAudioReply&&normalize(entry?.hanzi||entry?.panda||'')===state.pendingAudioReply;if(!sameBlocked)cancelFollowup();play(entry)},stopPlayback:()=>stopAudio(),
 getAudioLevel:()=>audio&&!audio.paused&&!audio.ended?pandaVisualAudioLevel:null,
 toggleSpeed:()=>$('speed-toggle').click(),
 setMode:mode=>{if(mode==='short'||mode==='nonstop')setMode(mode)},
 send:value=>submit(value),mic:()=>startRecognition(),note:text=>note(text)
};

const opening={hanzi:'你好！',pinyin:'Nǐ hǎo!',ru:'Привет!',audioKey:'你好'};
function resolvePandaEntry(search){
 const params=new URLSearchParams(search);
 if(params.get('scenario')==='hsk2-my-day')return {kind:'scenario'};
 if(params.get('practice')==='day')return {kind:'day'};
 if(params.get('from')==='hsk2-about-me')return {kind:'hsk2',id:101};
 const topic=Number(params.get('topic'));
 if(params.has('topic')&&Number.isInteger(topic)&&topic>=1&&topic<=10)return {kind:'hsk2',id:100+topic};
 if(params.has('lesson')&&/^[1-7]$/.test(params.get('lesson')))return {kind:'hsk1'};
 return {kind:'hsk2',id:101,beginnerGreeting:true};
}
const entry=resolvePandaEntry(location.search);
initLesson(selectConversation(location.search).id);resize();document.documentElement.dataset.pandaLiveReady='true';
if(entry.kind==='hsk2'){
 beginHSK2(entry.id,0,false);
 state.history=[];refreshHistory();say(opening,false);
 if(entry.beginnerGreeting){
  const question=PILOT_LINES[1];
  state.prompt={line:question};
  say(question,false);
 }else askHSK2(false);
 const greet=()=>{if(!document.hidden)play(opening)};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',greet,{once:true});else greet();
}else if(entry.kind!=='scenario'){play();}

// Load only on the explicit experimental URL, fail open to the established brain.
if(semanticRequested){
 Promise.all([import('./panda-unified-pilot-adapter-v1.mjs'),import('./panda-unified-pilot-metadata-v1.mjs')]).then(([adapter,meta])=>{
  semanticMetadata=meta.pilotLearnerMetadata;semanticPilot=adapter.createSemanticPilot({enabled:true,lookupExact:lookupPandaVoiceClip});
  if(semanticFreeChat()){const last=state.history.at(-1);if(last?.who==='panda')observeSemanticPanda(last);}
  document.documentElement.dataset.pandaSemanticPilot='ready';
 }).catch(()=>{semanticPilot=null;document.documentElement.dataset.pandaSemanticPilot='unavailable';});
}
