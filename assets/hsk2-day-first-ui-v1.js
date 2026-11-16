/* Panda Go, course 2: interactive five-step pilot for "Мой распорядок дня".
 * This is real HTML interaction, not a rasterized fake form.
 * Browser ASR checks transcribed characters ONLY; tone accuracy is not measured.
 */
(function(){
'use strict';
const modules=window.PandaGoDayModulesV391||[window.PandaGoDay1V1];
if(!modules[0])return;
const getDay=state=>modules[Math.min(2,Math.max(0,Number(state.mini)||0))]||modules[0];
let recognizer=null,recording=false;
const names=['Слово','Примеры','Правило','Тест','Речь'];
const normalize=s=>String(s||'').replace(/[，。？！!?.,\s]/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const makeState=mini=>({selected:mini===0?2:0,quiz:[null,null],build:[],attempts:(modules[mini||0]||modules[0]).words.map(()=>[]),speechWord:mini===0?2:0,permission:false,showConsent:false,speechInfo:'',working:false,poster:mini===0,showAudioNote:false});
function cancel(){if(recognizer){const r=recognizer;recognizer=null;r.onresult=r.onerror=r.onend=null;try{r.abort()}catch{}}recording=false}
function textLine(v,ctx){
 return '<div class="day-line"><div class="day-hanzi" lang="zh-Hans">'+esc(v[0])+'</div><div class="day-py">'+esc(v[1])+'</div><div class="day-ru">'+esc(v[2])+'</div>'+ctx.sound(v[0])+'</div>';
}
// Exact full-sentence recordings already provided by the course author.
 // A sample is labelled as a SENTENCE; never claim it is a recording of the isolated word.
 const recordedContexts=Object.freeze({
 '每天':['你每天学习吗','Nǐ měitiān xuéxí ma?','Ты занимаешься каждый день?'],
 '早上':['我早上吃早饭','Wǒ zǎoshang chī zǎofàn.','Я завтракаю утром.'],
 '起床':['我起床以后洗脸','Wǒ qǐchuáng yǐhòu xǐliǎn.','После подъёма я умываюсь.'],
 '洗脸':['我起床以后洗脸','Wǒ qǐchuáng yǐhòu xǐliǎn.','После подъёма я умываюсь.'],
 '吃早饭':['我早上吃早饭','Wǒ zǎoshang chī zǎofàn.','Я завтракаю утром.'],
 '中午':['我中午吃饭','Wǒ zhōngwǔ chī fàn.','Я обедаю в полдень.'],
 '下午':['我下午看书','Wǒ xiàwǔ kàn shū.','Днём я читаю книгу.'],
 '晚上':['我晚上听音乐','Wǒ wǎnshang tīng yīnyuè.','Вечером я слушаю музыку.'],
 '以后':['我回家以后休息','Wǒ huí jiā yǐhòu xiūxi.','Я отдыхаю после возвращения домой.']
 });
 function audioExample(zh,ctx){
  const voice=window.PandaHsk2AudioV330;
  if(voice?.lookup(zh))return ctx.sound(zh);
  const example=recordedContexts[zh];
  if(example&&voice?.lookup(example[0])){
   return '<div class="day-recorded-example"><span>🔊 Запись предложения:</span><button type="button" data-sound="'+esc(example[0])+'" aria-label="Слушать пример '+esc(example[0])+'">▶ '+esc(example[0])+'</button><small>'+esc(example[2])+'</small></div>';
  }
  return '<span class="day-audio-pending">🔇 Отдельной MP3-записи ещё нет</span>';
 }
function nav(state){
 let step=state.stage;
 return '<div class="day-bottom"><button type="button" class="secondary" data-day-prev>← '+(step===0?'К теме':'Назад')+'</button><button type="button" class="primary" data-day-next'+(step===3&&!ready(state)?' disabled':'')+'>'+(step===4?'Завершить урок ✓':'Дальше →')+'</button></div>';
}
function ready(state){
 const day=getDay(state),d=state.day;
 return d.quiz[0]===day.quiz[0].answer&&d.quiz[1]===day.quiz[1].answer&&normalize(d.build.map(i=>day.builder[i]).join(''))===normalize(day.target);
}
function render(state,ctx){
 if(!state.day)state.day=makeState(state.mini);
 const day=getDay(state),d=state.day,step=state.stage,word=day.words[d.selected];
 if(step===0&&state.mini===0&&d.poster){
  return '<section class="approved-stage day-visual-start" aria-label="Утверждённый дизайн: первый урок Мой день"><div class="approved-art"><img src="./assets/approved-course-v390/day-lesson.png" width="941" height="1672" draggable="false" alt="Иллюстрация первого урока: Панда, слово 起床, подробный разбор 起 + 床 и пять этапов обучения"><button class="approved-hotspot art-back" type="button" data-day-prev aria-label="Назад к теме"></button><button class="approved-hotspot art-words" type="button" data-day-show-words aria-label="Перейти к разбору семи слов"></button><button class="approved-hotspot art-next" type="button" data-day-show-words aria-label="Начать пошаговый разбор слов"></button><button class="approved-hotspot art-sound" type="button" data-day-poster-audio aria-label="Прослушать пример с 起床"></button>'+(d.showAudioNote?'<div class="art-audio-note" role="status"><strong>🔊 Записанный пример:</strong><span lang="zh-Hans">我起床以后洗脸。</span><small>После подъёма я умываюсь.</small>'+audioExample('起床',ctx)+'</div>':'')+'</div></section>';
 }
 let html='<section class="day-pilot"><div class="day-title"><div class="day-approved-banner"><img src="./assets/approved-course-v390/day-lesson.png" alt="Panda Go · Мой распорядок дня" width="941" height="1672"></div><img class="day-panda" src="./assets/hsk2-panda-new-v328.svg" alt="Панда Panda Go" draggable="false"><span class="day-label">PANDA GO · КИТАЙСКИЙ + ЛЕГКО</span><h1>🌅 Урок 1 · Мой распорядок дня</h1><p>Мини-урок '+(state.mini+1)+' из 3 · '+esc(day.name||'учимся говорить о своём утре')+'</p><div class="day-stages">'+names.map((n,i)=>'<span class="'+(i===step?'current':i<step?'passed':'')+'"><b>'+(i+1)+'</b>'+n+'</span>').join('')+'</div></div>';
 if(step===0){
  html+='<div class="day-card day-quicklist"><h2>🗂 Выбери слово · '+day.words.length+' слов</h2><div class="day-vocab">'+day.words.map((w,i)=>'<button type="button" class="day-vword'+(i===d.selected?' picked':'')+'" data-day-word="'+i+'"><strong lang="zh-Hans">'+esc(w.zh)+'</strong><small>'+esc(w.py)+'</small><span>'+esc(w.ru)+'</span></button>').join('')+'</div></div>'+
  '<div class="day-card day-focus"><div class="day-topline"><span>① Разбираем выбранное слово</span><span>'+(d.selected+1)+'/'+day.words.length+'</span></div><div class="day-headword" lang="zh-Hans">'+esc(word.zh)+'</div><div class="day-headpy">'+esc(word.py)+'</div><div class="day-meaning">'+esc(word.ru)+'</div>'+audioExample(word.zh,ctx)+'</div>'+
  '<div class="day-card day-breakdown"><h2>Из чего состоит '+esc(word.zh)+'?</h2><div class="day-chars">'+word.chars.map(ch=>'<div class="day-char"><span class="day-glyph" lang="zh-Hans">'+esc(ch[0])+'</span><b>'+esc(ch[1])+'</b><span>'+esc(ch[2])+'</span></div>').join('<span class="day-plus">+</span>')+'</div><div class="day-tip">💡 '+esc(word.tip)+'</div></div>';
 }
 if(step===1){
  html+='<div class="day-card"><h2>② Полезные примеры</h2><p class="day-hint">Прослушай доступные MP3 и прочитай предложения с пиньинем.</p>'+day.examples.map(x=>textLine(x,ctx)).join('')+'</div>'+
  '<div class="day-card"><h2>💬 Мини-диалог</h2>'+day.dialogue.map(x=>'<div class="day-dialogue"><b>'+x[0]+'</b>'+textLine(x.slice(1),ctx)+'</div>').join('')+'</div>';
 }
 if(step===2){
  html+='<div class="day-card"><h2>③ '+esc(day.ruleTitle||'Грамматика · время перед действием')+'</h2><p>'+esc(day.ruleText||'В обычном утверждении по-китайски после подлежащего указываем, когда происходит действие, затем само действие.')+'</p><div class="day-formula">'+
  (day.formula||[['我','я'],['每天','каждый день'],['七点','в 7 часов'],['起床','вставать']]).map((v,i)=>'<span><b lang="zh-Hans">'+v[0]+'</b><small>'+v[1]+'</small></span>').join('<i>+</i>')+
  '</div>'+textLine([day.target,day.targetPy,day.targetRu],ctx)+
  '<div class="day-tip">💡 '+esc(day.ruleTip||'每天 měitiān — 3-й + 1-й тоны. 起床 qǐchuáng — 3-й + 2-й тоны.')+'</div></div>'+
  '<div class="day-card"><h2>Применяем правило</h2><p>Ещё один пример:</p>'+textLine(day.examples[1]||day.examples[0],ctx)+'<p class="day-hint">Обрати внимание на порядок слов и тоны. Фраза '+esc(day.target)+' — твой шаблон для разговора.</p></div>';
 }
 if(step===3){
  html+='<div class="day-card"><h2>④ Проверь понимание</h2>'+day.quiz.map((q,qi)=>'<div class="day-question"><strong>Вопрос '+(qi+1)+' из 2</strong><p>'+esc(q.question)+'</p><div class="day-options">'+q.options.map((answer,i)=>'<button type="button" data-day-quiz="'+qi+':'+i+'" class="day-option'+(d.quiz[qi]===i?(i===q.answer?' good':' bad'):'')+'">'+String.fromCharCode(65+i)+'. '+esc(answer)+'</button>').join('')+'</div>'+(d.quiz[qi]!==null?'<div class="day-feedback '+(d.quiz[qi]===q.answer?'good':'bad')+'">'+(d.quiz[qi]===q.answer?'✓ Верно!':'Не подходит. Попробуй ещё раз.')+'</div>':'')+'</div>').join('')+'</div>'+
  '<div class="day-card"><h2>🧩 Собери предложение</h2><p>'+esc(day.targetRu)+'</p><div class="day-build">'+(d.build.length?d.build.map((key,i)=>'<button type="button" data-day-remove="'+i+'">'+esc(day.builder[key])+' ×</button>').join(''):'Нажимай на слова ниже в правильном порядке')+'</div><div class="day-tokens">'+(day.builder.length===5?[2,0,4,1,3]:[2,0,3,1]).map(k=>'<button type="button" data-day-token="'+k+'"'+(d.build.includes(k)?' disabled':'')+'>'+esc(day.builder[k])+'</button>').join('')+'</div>'+(d.build.length===day.builder.length?'<div class="day-feedback '+(normalize(d.build.map(k=>day.builder[k]).join(''))===normalize(day.target)?'good':'bad')+'">'+(normalize(d.build.map(k=>day.builder[k]).join(''))===normalize(day.target)?'✓ Порядок слов правильный.':'Проверь порядок и убери неправильные слова нажатием.')+'</div>':'')+'</div>';
 }
 if(step===4){
  const attempts=d.attempts[d.speechWord],passed=attempts.filter(a=>a.match).length,total=d.attempts.reduce((n,a)=>n+a.length,0);
  const dayAction=(!window.SpeechRecognition&&!window.webkitSpeechRecognition)?
  '<div class="day-tip">🎙 Для проверки речи нужен Chrome с доступом к микрофону.</div>':
  attempts.length<5?'<button type="button" class="primary day-record" data-day-record'+(recording?' disabled':'')+'>'+(recording?'🎙 Слушаю…':'🎙 Нажми и произнеси')+'</button>':'<p class="day-tip">✓ Пять попыток зафиксированы. Выбери следующее слово.</p>';
  html+='<div class="day-card day-speech-card"><h2>⑤ Произнеси каждое слово 5 раз</h2><p class="day-hint">Выбери слово, послушай пример и произнеси его пять раз.</p>'+
  '<div class="day-wordchoice">'+day.words.map((w,i)=>'<button type="button" data-day-speech-word="'+i+'" class="'+(i===d.speechWord?'picked':'')+'">'+esc(w.zh)+' <small>'+d.attempts[i].length+'/5</small></button>').join('')+'</div>'+
  '<div class="day-speechhero"><div lang="zh-Hans">'+esc(day.words[d.speechWord].zh)+'</div><strong>'+esc(day.words[d.speechWord].py)+'</strong><span>'+esc(day.words[d.speechWord].ru)+'</span>'+audioExample(day.words[d.speechWord].zh,ctx)+dayAction+'</div>'+
  '<div class="day-attempts">'+[0,1,2,3,4].map(i=>'<div class="'+(attempts[i]?(attempts[i].match?'heard':'not-heard'):'')+'"><b>'+(i+1)+'</b><span>'+(attempts[i]?(attempts[i].match?'✓':'×'):'🎙')+'</span></div>').join('')+'</div>'+
  '<p class="day-feedback">'+attempts.length+'/5 попыток · '+passed+' распознано как нужное слово</p>'+
  '<p class="day-hint">Распознанный текст: '+(attempts.length?'<b lang="zh-Hans">'+esc(attempts[attempts.length-1].said)+'</b>':'—')+'</p>'+
  (d.speechInfo?'<p class="day-feedback bad">'+esc(d.speechInfo)+'</p>':'')+

  (d.showConsent?'<div class="day-consent"><p>Распознавание выполняет браузер и может передавать аудио сторонней службе. Panda Go не сохраняет запись голоса. Разрешить распознавание?</p><button type="button" data-day-consent class="primary">Разрешить и говорить</button><button type="button" data-day-cancel-consent class="secondary">Отмена</button></div>':'')+
  '<p class="day-hint">'+total+' из 35 попыток сделано. Можешь повторять постепенно: микрофон не обязателен для завершения урока.</p></div>';
 }
 html+=nav(state)+'</section>';
 return html;
}
function recognize(state,render){
 const day=getDay(state);
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){state.day.speechInfo='Распознавание речи недоступно в этом браузере.';render();return}
 const d=state.day,idx=d.speechWord;if(d.attempts[idx].length>=5||recording)return;
 const r=new SR();recognizer=r;recording=true;d.speechInfo='';
 r.lang='zh-CN';r.interimResults=false;r.maxAlternatives=1;let got=false;
 r.onresult=e=>{
  if(recognizer!==r||state.view!=='lesson'||state.topic!==0||state.stage!==4)return;
  const said=String(e.results?.[0]?.[0]?.transcript||'').trim();
  if(!said){d.speechInfo='Браузер вернул пустую расшифровку.';return}
  got=true;
  const expected=normalize(day.words[idx].zh),match=normalize(said)===expected;
  d.attempts[idx].push({said,match});d.speechInfo=match?'':'Распознано другое слово.';
 };
 r.onerror=e=>{if(recognizer!==r)return;d.speechInfo='Микрофон: '+String(e.error||'ошибка распознавания')+'. Можно продолжить без него.';};
 r.onend=()=>{if(recognizer!==r)return;recognizer=null;recording=false;if(!got&&!d.speechInfo)d.speechInfo='Речь не распознана. Попробуй ещё раз.';if(state.view==='lesson'&&state.stage===4)render()};
 try{r.start();render()}catch(e){recognizer=null;recording=false;d.speechInfo='Не удалось запустить распознавание. Проверь разрешение микрофона.';render()}
}
function handle(button,state,api){
 const day=getDay(state),d=state.day||makeState(state.mini),key=button.dataset;
 if(key.dayShowWords!==undefined){d.poster=false;api.render();return true}
 if(key.dayPosterAudio!==undefined){d.showAudioNote=true;api.render();return true}
 if(key.dayWord!==undefined){window.PandaHsk2AudioV330?.stop?.();d.selected=Number(key.dayWord);api.render();return true}
 if(key.dayPrev!==undefined){cancel();if(state.stage===0)api.go('topic');else{state.stage--;api.render()}return true}
 if(key.dayNext!==undefined){next(state,api);return true}
 if(key.dayQuiz!==undefined){const [q,a]=key.dayQuiz.split(':').map(Number);d.quiz[q]=a;api.render();return true}
 if(key.dayToken!==undefined){const k=Number(key.dayToken);if(!d.build.includes(k))d.build.push(k);api.render();return true}
 if(key.dayRemove!==undefined){d.build.splice(Number(key.dayRemove),1);api.render();return true}
 if(key.daySpeechWord!==undefined){cancel();d.speechWord=Number(key.daySpeechWord);d.speechInfo='';api.render();return true}
 if(key.dayRecord!==undefined){if(!d.permission){d.showConsent=true;api.render()}else recognize(state,api.render);return true}
 if(key.dayConsent!==undefined){d.permission=true;d.showConsent=false;recognize(state,api.render);return true}
 if(key.dayCancelConsent!==undefined){d.showConsent=false;api.render();return true}
 return false;
}
function next(state,api){
 const step=state.stage;
 if(step===3&&!ready(state))return;
 if(step===4){cancel();api.complete();return}
 state.stage=Math.min(4,step+1);api.render();
}
window.PandaGoDayFirstUIV1=Object.freeze({makeState,render,handle,next,cancel});
})();
