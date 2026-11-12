// One conversation surface, existing character rig and exact existing audio only.
import {withPracticeGreeting,GREETINGS} from './panda-live-greetings.mjs?v=live7';
import {lookupPilotAudio} from './panda-live-audio.mjs?v=live6';
import {verifyAnswerFor,normalize} from './panda-voice-pilot-engine.mjs?v=live6';
import {CONVERSATIONS,selectConversation} from './panda-live-lessons.mjs?v=live6';
import {ENVELOPES} from './panda-live-envelope.mjs?v=live6';
import {createPandaRig} from './panda-live-rig.mjs';
import {prepareConversation,interpretUtterance,replyToExtraSpeech,extraExamples} from './panda-live-conversation-v266.mjs?v=270';
import {answerCurriculumQuestion} from './panda-curriculum-tutor.mjs';
import {validatedVariants,readMistakes,noteMistake,hardestMistake,clearReviewedMistake} from './panda-live-practice.mjs?v=265';
import {accessibleLessons,answerNonStop} from './panda-nonstop-v267.mjs?v=270';
import {choosePracticePrompt} from './panda-live-prompts-v270.mjs?v=270';
const $=id=>document.getElementById(id);
const storage=(()=>{try{return localStorage}catch{return null}})();
const curriculum=window.PANDA_HSK1_FOUNDATIONS||[];
const rig=createPandaRig($('character'),$('panda-canvas'));
let conversation,base,audio=null,audioFrame=0,recognition=null,epoch=0,watchdog,poseTimer;
const state={mode:'short',step:0,done:false,slow:false,allowed:[],cursor:0,prompt:null,display:null,history:[],discussed:new Set(),questions:[],answers:[],awaitQuestion:false,speechConsent:false,active:false,hint:false,confidence:null,reviewStep:null};
const current=()=>state.display;
const lesson=()=>state.mode==='nonstop'?(state.prompt?.line.lesson||conversation.id):conversation.id;
function note(text){$('status').textContent=text||''}
function pose(value){clearTimeout(poseTimer);rig.setState(value)}
function happy(){pose('happy');poseTimer=setTimeout(()=>pose('idle'),1300)}
function stopAudio(){const a=audio;audio=null;cancelAnimationFrame(audioFrame);if(a){a.onplaying=a.onended=a.onerror=a.onpause=a.onwaiting=null;a.pause()}$('hear').classList.remove('playing');rig.setLevel(0);if($('character').dataset.state==='talking')pose('idle')}
function stopRecognition(){clearTimeout(watchdog);epoch++;const r=recognition;recognition=null;state.active=false;if(r){r.onstart=r.onresult=r.onerror=r.onend=r.onnomatch=null;try{r.abort()}catch{}}if($('character').dataset.state==='listening')pose('idle');updateMic()}
function updateMic(){$('mic').setAttribute('aria-pressed',String(state.active));$('mic').textContent=state.active?'■':'🎙';$('mic').setAttribute('aria-label',state.active?'Остановить распознавание':'Ответить Панде голосом')}
function play(){
 const src=lookupPilotAudio(current()?.audioKey);if(!src){note('Для этой фразы пока нет записи.');return}
 stopRecognition();stopAudio();const a=new Audio(new URL(src,document.baseURI).href);audio=a;a.playbackRate=state.slow?.8:1;a.preload='auto';if('preservesPitch' in a)a.preservesPitch=true;
 const playbackNote=$('status').textContent;const envelope=ENVELOPES[src],valid=()=>audio===a;
 const animate=()=>{if(!valid()||a.paused||a.ended)return;rig.setLevel(envelope?envelope.levels[Math.floor(a.currentTime/envelope.binSeconds)]||0:.5+.5*Math.sin(a.currentTime*23));audioFrame=requestAnimationFrame(animate)};
 a.onplaying=()=>{if(valid()){pose('talking');$('hear').classList.add('playing');if(['Загружаю звук…','Нажми динамик, чтобы включить звук.'].includes($('status').textContent))note(playbackNote==='Нажми динамик, чтобы включить звук.'?'':playbackNote);animate()}};
 a.onwaiting=()=>{if(valid()){cancelAnimationFrame(audioFrame);pose('idle');note('Загружаю звук…')}};
 a.onpause=()=>{if(valid()){cancelAnimationFrame(audioFrame);pose('idle')}};
 a.onended=()=>{if(valid())stopAudio()};a.onerror=()=>{if(valid()){stopAudio();note('Запись не загрузилась. Нажми динамик, чтобы повторить.')}};
 a.play().catch(()=>{if(valid()){stopAudio();note('Нажми динамик, чтобы включить звук.')}});
}
function makeRow(entry,full=false){
 const row=document.createElement('article'),who=document.createElement('strong');who.textContent=entry.who==='you'?'Ты: ':'Панда: ';row.append(who,document.createTextNode(entry.hanzi));
 if(entry.pinyin&&(full||entry.who==='you')){const py=document.createElement('span');py.className='py';py.textContent=entry.pinyin;row.append(py)}
 const ru=document.createElement('span');ru.className='ru';ru.textContent=(full?'Перевод: ':' — ')+(entry.ru||'Точный перевод пока не подтверждён');row.append(ru);
 if(full&&entry.confidence!==null&&entry.confidence<.65){const warn=document.createElement('p');warn.textContent='Распознавание неуверенное — проверь текст.';row.append(warn)}
 return row;
}
function refreshHistory(){
 $('recent').replaceChildren(...state.history.slice(-2).map(e=>makeRow(e)));
 $('history').replaceChildren(...state.history.map(e=>makeRow(e,true)));
 $('history-count').textContent=String(state.history.length);
}
function record(who,hanzi,pinyin,ru){state.history.push({who,hanzi,pinyin,ru,confidence:who==='you'?state.confidence:null});if(state.history.length>100)state.history.shift();refreshHistory()}
function say(line,autoplay=true){state.display=line;render();record('panda',line.hanzi||line.panda,line.pinyin,line.ru);if(autoplay)play()}
function learner(input,spoken){record('you',input,spoken?.known?spoken.pinyin:null,spoken?.known?spoken.translation:null);state.answers.push(input);if(state.answers.length>16)state.answers.shift()}
function refreshReview(){const list=readMistakes(storage).filter(x=>x.lesson===conversation.id);$('review-count').textContent=list.length?'Для повторения: '+list.length+' фраз':'Ошибок для повторения нет';$('review').disabled=!list.length}
function render(){
 const line=current();$('phrase').textContent=line.hanzi||line.panda;$('pinyin').textContent=line.pinyin||'';$('translation').textContent=line.ru||'';
 const src=lookupPilotAudio(line.audioKey);$('hear').disabled=!src;$('audio-note').hidden=!!src;
 $('step').textContent=state.mode==='nonstop'?'∞ Разговор без лимита':state.done?'Диалог завершён':`${state.step+1} из ${conversation.lines.length}`;
 $('mode-short').classList.toggle('active',state.mode==='short');$('mode-nonstop').classList.toggle('active',state.mode==='nonstop');
 for(const name of ['short','nonstop'])$('mode-'+name).setAttribute('aria-pressed',String(state.mode===name));
 $('mode-description').textContent=state.mode==='nonstop'?'Отвечай и спрашивай по пройденным темам HSK 1':'Панда спрашивает — ты отвечаешь по уроку';
 const bars=document.querySelector('.bars');bars.replaceChildren();bars.hidden=state.mode==='nonstop';
 for(let i=0;i<conversation.lines.length;i++){const b=document.createElement('i');b.className='bar'+(state.done||i<=state.step?' on':'');bars.append(b)}
 $('finish').hidden=state.mode!=='nonstop';$('next').hidden=state.mode!=='nonstop';
 $('message').placeholder=state.done&&state.mode==='short'?'Спроси Панду или начни заново…':'Напиши по-китайски…';
 const context=state.mode==='nonstop'?(state.prompt?.line.context||''):conversation.context||'';
 $('exercise-banner').textContent=conversation.id===5&&state.mode==='short'?'Учебная сценка: '+context:context;$('exercise-banner').hidden=!context;
 const examples=state.mode==='nonstop'?(state.awaitQuestion?['你好吗？',...extraExamples(lesson())]:[...(state.prompt?.line.verifiedLines?.[1]?.accepted||[]).filter(x=>/[\u3400-\u9fff]/.test(x)).slice(0,2),'你好吗？']):state.done?extraExamples(conversation.id):validatedVariants(conversation.id,state.step,conversation.lines);
 $('quick-phrases').replaceChildren();for(const text of examples.filter((text,index,all)=>all.findIndex(x=>normalize(x)===normalize(text))===index).slice(0,3)){const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',()=>{$('message').value=text;$('message').focus()});$('quick-phrases').append(b)}
 document.documentElement.dataset.hint=String(state.hint);$('hint').setAttribute('aria-expanded',String(state.hint));$('hint-text').hidden=!state.hint;
 if(state.hint)$('hint-text').textContent=state.mode==='nonstop'?(state.awaitQuestion?'Теперь спроси Панду: 你好吗？ — Как дела?':state.prompt?.line.instruction):state.done?'Нажми «Заново» для нового диалога или задай вопрос.':conversation.lines[state.step].instruction;
 refreshReview();updateMic();
}
function rotateGreeting(){let index=0;try{index=Number(storage?.getItem('pg-panda-live-practice-greeting-v1'))||0;storage?.setItem('pg-panda-live-practice-greeting-v1',String((index+1)%4))}catch{}return index%4}
function initLesson(id){
 stopAudio();stopRecognition();base=prepareConversation(CONVERSATIONS.find(c=>c.id===id)||CONVERSATIONS[0],new Date());
 conversation=withPracticeGreeting(base,rotateGreeting());state.step=0;state.done=false;state.reviewStep=null;state.prompt=null;state.shortDisplay=null;state.nonstopDisplay=null;state.awaitQuestion=false;state.hint=false;
 state.allowed=accessibleLessons(storage,conversation.id);state.cursor=Math.max(0,state.allowed.indexOf(conversation.id));$('lesson-select').value=String(conversation.id);
 const routes={1:'panda-lesson1.html',2:'hsk1-second-v203.html',3:'hsk1-third-v212.html',4:'hsk1-fourth-v214.html',5:'hsk1-fifth-v227.html',6:'hsk1-family-v231.html',7:'hsk1-weather-v231.html'};$('back-link').href='./'+routes[conversation.id];
 $('allowed-topics').textContent='Доступны текущий и пройденные уроки: '+state.allowed.map(n=>CONVERSATIONS.find(c=>c.id===n).theme).join(', ')+'.';
 $('words').replaceChildren();for(const w of [...(base.vocabulary||base.newWords||[]),...(base.examples||[])]){const p=document.createElement('p');p.textContent=[w.hanzi,w.pinyin,w.ru].join(' — ');$('words').append(p)}
 $('knowledge-answer').textContent='';$('message').value='';note('');
 if(state.mode==='nonstop')askNext();else say(conversation.lines[0],false);
}
function askNext(){
 stopRecognition();stopAudio();state.awaitQuestion=false;
 const p=choosePracticePrompt(CONVERSATIONS,state.allowed,state.questions,new Date(),state.prompt?null:conversation.id);if(!p){note('Для доступных уроков пока нет проверенных вопросов.');return}
 state.prompt=p;state.discussed.add(p.line.lesson);state.questions.push(p.line.hanzi);if(state.questions.length>16)state.questions.shift();
 say(p.line);note('Ответь или задай свой вопрос по изученному материалу.');
}
function setMode(mode){if(state.mode===mode)return;stopRecognition();stopAudio();if(state.mode==='short')state.shortDisplay=state.display;else state.nonstopDisplay=state.display;state.mode=mode;state.hint=false;note('');if(mode==='nonstop'){if(state.prompt){state.display=state.nonstopDisplay||state.prompt.line;render()}else askNext()}else{state.display=state.shortDisplay||(state.done?state.shortReply:conversation.lines[state.step]);render()}}
function submit(raw){
 const input=String(raw||'').trim();if(!input){note('Скажи или напиши фразу на китайском.');return}
 stopRecognition();stopAudio();$('message').value='';
 if(state.mode==='nonstop'){
  const result=answerNonStop(input,state.allowed,state.awaitQuestion?null:state.prompt?.line,curriculum,new Date());
  learner(input,result.spoken||interpretUtterance(input,lesson(),curriculum));
  if(result.kind==='question'){say(result.reply);note('Продолжай или нажми «Ещё вопрос».');if(state.confidence!==null&&state.confidence<.65)note('Распознано неуверенно. Проверь текст в истории.');return}
  if(result.kind==='answer'){
   state.awaitQuestion=true;state.discussed.add(result.lesson);happy();
   const understood=result.spoken;const thanks={hanzi:'谢谢！',pinyin:'Xièxie!',ru:'Спасибо!',audioKey:'谢谢'};
   say(thanks);note('Ответ по смыслу подходит. Теперь задай свой вопрос Панде или выбери следующий.');return;
  }
  if(result.kind==='statement'){note(result.message);render();return}
  note(result.message);render();return;
 }
 const spoken=interpretUtterance(input,conversation.id,curriculum);learner(input,spoken);
 const social=replyToExtraSpeech(input,conversation.id,curriculum);
 // Any supported greeting can answer the opening, with the same greeting echoed.
 const greeting=/^(你好[呀啊]?|早上好[呀啊]?|中午好[呀啊]?|下午好[呀啊]?|晚上好[呀啊]?)$/.test(normalize(input));
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
function startRecognition(){
 if(state.active){try{recognition.stop()}catch{stopRecognition()}return}
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){note('Распознавание недоступно. Используй поле ввода или микрофон клавиатуры Android.');return}
 if(!state.speechConsent){$('speech-dialog').showModal();return}
 if(!window.isSecureContext){note('Для микрофона требуется HTTPS.');return}
 stopAudio();stopRecognition();let r;
 try{r=new Speech();r.lang='zh-CN';r.continuous=false;r.interimResults=false;r.maxAlternatives=1}catch{note('Микрофон не запустился. Ответь текстом.');return}
 recognition=r;const token=++epoch;state.active=true;let heard=false,failed=false;const valid=()=>recognition===r&&epoch===token;updateMic();note('Подключаю микрофон…');
 r.onstart=()=>{if(valid()){pose('listening');note('Слушаю…')}};
 r.onresult=e=>{if(!valid())return;const a=e.results?.[0]?.[0];state.confidence=typeof a?.confidence==='number'&&a.confidence>0?a.confidence:null;const text=String(a?.transcript||'').trim();heard=!!text;submit(text);if(state.confidence!==null&&state.confidence<.65)note('Распознано неуверенно. Проверь текст и повтори при необходимости.');state.confidence=null};
 r.onerror=e=>{if(!valid())return;failed=true;stopRecognition();note(({'not-allowed':'Разреши микрофон в настройках сайта.','network':'Служба распознавания недоступна. Ответь текстом.','no-speech':'Не расслышала. Повтори ближе к микрофону.','audio-capture':'Микрофон занят или недоступен.'})[e.error]||'Распознавание не удалось. Попробуй текстовый ответ.')};
 r.onnomatch=()=>{if(valid()){failed=true;stopRecognition();note('Речь не распознана. Повтори или напиши ответ.')}};
 r.onend=()=>{if(valid()){stopRecognition();if(!heard&&!failed)note('Не расслышала. Повтори или напиши ответ.')}};
 try{r.start();watchdog=setTimeout(()=>{if(valid()){stopRecognition();note('Служба распознавания не ответила. Попробуй текстовый ответ.')}},16000)}catch{stopRecognition();note('Микрофон не запустился. Проверь разрешение сайта.')}
}
$('message-form').addEventListener('submit',e=>{e.preventDefault();state.confidence=null;submit($('message').value)});
$('mic').addEventListener('click',startRecognition);$('speech-allow').addEventListener('click',()=>{state.speechConsent=true;$('speech-dialog').close();startRecognition()});
$('hear').addEventListener('click',play);$('speed-toggle').addEventListener('click',()=>{state.slow=!state.slow;$('speed-toggle').textContent=state.slow?'🐢 0,8×':'▶ 1×';$('speed-toggle').setAttribute('aria-pressed',String(state.slow));if(audio)audio.playbackRate=state.slow?.8:1});
$('mode-short').addEventListener('click',()=>setMode('short'));$('mode-nonstop').addEventListener('click',()=>setMode('nonstop'));
$('next').addEventListener('click',askNext);$('finish').addEventListener('click',()=>{stopAudio();stopRecognition();state.prompt=null;setMode('short');note('Non-Stop завершён. История осталась в этой вкладке.');});
$('reset').addEventListener('click',()=>initLesson(conversation.id));$('hint').addEventListener('click',()=>{state.hint=!state.hint;render()});
for(const [button,dialog] of [['history-open','history-dialog'],['study-open','study-dialog']])$(button).addEventListener('click',()=>{stopRecognition();stopAudio();if(dialog==='study-dialog'){
 $('variant-choices').replaceChildren();for(const text of validatedVariants(conversation.id,Math.min(state.step,conversation.lines.length-1),conversation.lines)){const b=document.createElement('button');b.textContent=text;b.addEventListener('click',()=>{$('message').value=text;$(dialog).close();$('message').focus()});$('variant-choices').append(b)}
 }$(dialog).showModal()});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
$('knowledge-form').addEventListener('submit',e=>{e.preventDefault();$('knowledge-answer').textContent=answerCurriculumQuestion($('knowledge-question').value,lesson(),curriculum)});
$('review').addEventListener('click',()=>{const item=hardestMistake(storage,conversation.id);if(!item)return;setMode('short');state.step=Math.min(item.step,conversation.lines.length-1);state.reviewStep=state.step;state.done=false;$('study-dialog').close();say(conversation.lines[state.step]);note('Повтори эту фразу. После верного ответа она исчезнет из списка повторения.')});
for(const c of CONVERSATIONS.filter(c=>c.lines.length&&!c.status.startsWith('draft'))){const o=document.createElement('option');o.value=c.id;o.textContent=c.id+'. '+c.theme;$('lesson-select').append(o)}
$('lesson-select').addEventListener('change',()=>{const id=Number($('lesson-select').value);const url=new URL(location.href);url.searchParams.set('lesson',id);history.replaceState(null,'',url);initLesson(id)});
function resize(){const v=window.visualViewport;const h=v?.height||window.innerHeight;document.documentElement.style.setProperty('--screen-height',h+'px');document.documentElement.style.setProperty('--screen-top',(v?.offsetTop||0)+'px');document.documentElement.dataset.keyboard=String((window.innerHeight-h>120)||(h<560))}
window.visualViewport?.addEventListener('resize',resize);window.visualViewport?.addEventListener('scroll',resize);window.addEventListener('resize',resize);document.addEventListener('focusin',resize);document.addEventListener('focusout',resize);
window.addEventListener('pagehide',e=>{stopRecognition();stopAudio();clearTimeout(poseTimer);if(!e.persisted)rig.dispose()});document.addEventListener('visibilitychange',()=>{if(document.hidden){stopRecognition();stopAudio()}});
if('serviceWorker' in navigator && !['localhost','127.0.0.1','terminal.local'].includes(location.hostname))navigator.serviceWorker.register('./sw.js?v=161',{scope:'./',updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
if(window.ResizeObserver){const observer=new window.ResizeObserver(entries=>{document.documentElement.style.setProperty('--scene-height',entries[0].contentRect.height+'px')});observer.observe(document.querySelector('.scene'))}
initLesson(selectConversation(location.search).id);resize();document.documentElement.dataset.pandaLiveReady='true';
// Try the existing recording; browsers may require the first tap before playback.
play();
