/* Panda Go, course 2: interactive five-step pilot for "Мой распорядок дня".
 * This is real HTML interaction, not a rasterized fake form.
 * Browser ASR checks transcribed characters ONLY; tone accuracy is not measured.
 */
(function(){
'use strict';
const day=window.PandaGoDay1V1;
if(!day)return;
let recognizer=null,recording=false;
const names=['Слово','Примеры','Правило','Тест','Речь'];
const normalize=s=>String(s||'').replace(/[，。？！!?.,\s]/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const makeState=()=>({selected:2,quiz:[null,null],build:[],attempts:day.words.map(()=>[]),speechWord:2,permission:false,showConsent:false,speechInfo:'',working:false});
function cancel(){if(recognizer){const r=recognizer;recognizer=null;r.onresult=r.onerror=r.onend=null;try{r.abort()}catch{}}recording=false}
function textLine(v,ctx){
 return '<div class="day-line"><div class="day-hanzi" lang="zh-Hans">'+esc(v[0])+'</div><div class="day-py">'+esc(v[1])+'</div><div class="day-ru">'+esc(v[2])+'</div>'+ctx.sound(v[0])+'</div>';
}
function nav(state){
 let step=state.stage;
 return '<div class="day-bottom"><button type="button" class="secondary" data-day-prev>← '+(step===0?'К теме':'Назад')+'</button><button type="button" class="primary" data-day-next'+(step===3&&!ready(state)?' disabled':'')+'>'+(step===4?'Завершить урок ✓':'Дальше →')+'</button></div>';
}
function ready(state){
 const d=state.day;
 return d.quiz[0]===day.quiz[0].answer&&d.quiz[1]===day.quiz[1].answer&&normalize(d.build.map(i=>day.builder[i]).join(''))===normalize(day.target);
}
function render(state,ctx){
 if(!state.day)state.day=makeState();
 const d=state.day,step=state.stage,word=day.words[d.selected];
 let html='<section class="day-pilot"><div class="day-title"><img class="day-panda" src="./assets/hsk2-panda-new-v328.svg" alt="Панда Panda Go" draggable="false"><span class="day-label">PANDA GO · КИТАЙСКИЙ + ЛЕГКО</span><h1>🌅 Урок 1 · Мой распорядок дня</h1><p>Мини-урок 1 из 3 · учимся говорить о своём утре</p><div class="day-stages">'+names.map((n,i)=>'<span class="'+(i===step?'current':i<step?'passed':'')+'"><b>'+(i+1)+'</b>'+n+'</span>').join('')+'</div></div>';
 if(step===0){
  html+='<div class="day-card day-focus"><div class="day-topline"><span>① Разбираем слово</span><span>7 слов</span></div><div class="day-headword" lang="zh-Hans">'+esc(word.zh)+'</div><div class="day-headpy">'+esc(word.py)+'</div><div class="day-meaning">'+esc(word.ru)+'</div>'+ctx.sound(word.zh)+'</div>'+
  '<div class="day-card"><h2>Из чего состоит '+esc(word.zh)+'?</h2><div class="day-chars">'+word.chars.map(ch=>'<div class="day-char"><span class="day-glyph" lang="zh-Hans">'+esc(ch[0])+'</span><b>'+esc(ch[1])+'</b><span>'+esc(ch[2])+'</span></div>').join('<span class="day-plus">+</span>')+'</div><div class="day-tip">💡 '+esc(word.tip)+'</div></div>'+
  '<div class="day-card"><h2>📖 Слова этого мини-урока</h2><div class="day-vocab">'+day.words.map((w,i)=>'<button type="button" class="day-vword'+(i===d.selected?' picked':'')+'" data-day-word="'+i+'"><strong lang="zh-Hans">'+esc(w.zh)+'</strong><small>'+esc(w.py)+'</small><span>'+esc(w.ru)+'</span></button>').join('')+'</div></div>';
 }
 if(step===1){
  html+='<div class="day-card"><h2>② Полезные примеры</h2><p class="day-hint">Прослушай доступные MP3 и прочитай предложения с пиньинем.</p>'+day.examples.map(x=>textLine(x,ctx)).join('')+'</div>'+
  '<div class="day-card"><h2>💬 Мини-диалог</h2>'+day.dialogue.map(x=>'<div class="day-dialogue"><b>'+x[0]+'</b>'+textLine(x.slice(1),ctx)+'</div>').join('')+'</div>';
 }
 if(step===2){
  html+='<div class="day-card"><h2>③ Грамматика · время перед действием</h2><p>В обычном утверждении по-китайски после подлежащего указываем, когда происходит действие, затем само действие.</p><div class="day-formula">'+
  [['我','я'],['每天','каждый день'],['七点','в 7 часов'],['起床','вставать']].map((v,i)=>'<span><b lang="zh-Hans">'+v[0]+'</b><small>'+v[1]+'</small></span>').join('<i>+</i>')+
  '</div>'+textLine([day.target,day.targetPy,day.targetRu],ctx)+
  '<div class="day-tip">💡 <b>每天 měitiān</b> — 3-й + 1-й тоны. <b>起床 qǐchuáng</b> — 3-й + 2-й тоны. Читаем не «méitiān»!</div></div>'+
  '<div class="day-card"><h2>Применяем правило</h2><p>Можно изменить время:</p>'+textLine(day.examples[0],ctx)+'<p class="day-hint">Конструкция: кто → когда → действие. Фраза 我每天七点起床。 — твой первый шаблон для разговора.</p></div>';
 }
 if(step===3){
  html+='<div class="day-card"><h2>④ Проверь понимание</h2>'+day.quiz.map((q,qi)=>'<div class="day-question"><strong>Вопрос '+(qi+1)+' из 2</strong><p>'+esc(q.question)+'</p><div class="day-options">'+q.options.map((answer,i)=>'<button type="button" data-day-quiz="'+qi+':'+i+'" class="day-option'+(d.quiz[qi]===i?(i===q.answer?' good':' bad'):'')+'">'+String.fromCharCode(65+i)+'. '+esc(answer)+'</button>').join('')+'</div>'+(d.quiz[qi]!==null?'<div class="day-feedback '+(d.quiz[qi]===q.answer?'good':'bad')+'">'+(d.quiz[qi]===q.answer?'✓ Верно!':'Не подходит. Попробуй ещё раз.')+'</div>':'')+'</div>').join('')+'</div>'+
  '<div class="day-card"><h2>🧩 Собери предложение</h2><p>'+esc(day.targetRu)+'</p><div class="day-build">'+(d.build.length?d.build.map((key,i)=>'<button type="button" data-day-remove="'+i+'">'+esc(day.builder[key])+' ×</button>').join(''):'Нажимай на слова ниже в правильном порядке')+'</div><div class="day-tokens">'+[2,0,3,1].map(k=>'<button type="button" data-day-token="'+k+'"'+(d.build.includes(k)?' disabled':'')+'>'+esc(day.builder[k])+'</button>').join('')+'</div>'+(d.build.length===4?'<div class="day-feedback '+(normalize(d.build.map(k=>day.builder[k]).join(''))===normalize(day.target)?'good':'bad')+'">'+(normalize(d.build.map(k=>day.builder[k]).join(''))===normalize(day.target)?'✓ Порядок слов правильный.':'Проверь порядок и убери неправильные слова нажатием.')+'</div>':'')+'</div>';
 }
 if(step===4){
  const attempts=d.attempts[d.speechWord],passed=attempts.filter(a=>a.match).length,total=d.attempts.reduce((n,a)=>n+a.length,0);
  html+='<div class="day-card"><h2>⑤ Произнеси каждое слово 5 раз</h2><p class="day-hint">Проверяем, какое слово распознал браузер. <b>Высоту тонов алгоритм не оценивает.</b></p>'+
  '<div class="day-wordchoice">'+day.words.map((w,i)=>'<button type="button" data-day-speech-word="'+i+'" class="'+(i===d.speechWord?'picked':'')+'">'+esc(w.zh)+' <small>'+d.attempts[i].length+'/5</small></button>').join('')+'</div>'+
  '<div class="day-speechhero"><div lang="zh-Hans">'+esc(day.words[d.speechWord].zh)+'</div><strong>'+esc(day.words[d.speechWord].py)+'</strong><span>'+esc(day.words[d.speechWord].ru)+'</span>'+ctx.sound(day.words[d.speechWord].zh)+'</div>'+
  '<div class="day-attempts">'+[0,1,2,3,4].map(i=>'<div class="'+(attempts[i]?(attempts[i].match?'heard':'not-heard'):'')+'"><b>'+(i+1)+'</b><span>'+(attempts[i]?(attempts[i].match?'✓':'×'):'🎙')+'</span></div>').join('')+'</div>'+
  '<p class="day-feedback">'+attempts.length+'/5 попыток · '+passed+' распознано как нужное слово</p>'+
  '<p class="day-hint">Распознанный текст: '+(attempts.length?'<b lang="zh-Hans">'+esc(attempts[attempts.length-1].said)+'</b>':'—')+'</p>'+
  (d.speechInfo?'<p class="day-feedback bad">'+esc(d.speechInfo)+'</p>':'')+
  ((!window.SpeechRecognition&&!window.webkitSpeechRecognition)?
  '<div class="day-tip">🎙 В этом браузере нет доступного распознавания. Открой страницу в Chrome на Android или продолжи урок без оценки речи.</div>':
  attempts.length<5?'<button type="button" class="primary day-record" data-day-record'+(recording?' disabled':'')+'>'+(recording?'🎙 Слушаю…':'🎙 Нажми и произнеси')+'</button>':'<p class="day-tip">✓ Пять попыток зафиксированы. Выбери следующее слово.</p>')+
  (d.showConsent?'<div class="day-consent"><p>Распознавание выполняет браузер и может передавать аудио сторонней службе. Panda Go не сохраняет запись голоса. Разрешить распознавание?</p><button type="button" data-day-consent class="primary">Разрешить и говорить</button><button type="button" data-day-cancel-consent class="secondary">Отмена</button></div>':'')+
  '<p class="day-hint">'+total+' из 35 попыток сделано. Можешь повторять постепенно: микрофон не обязателен для завершения урока.</p></div>';
 }
 html+=nav(state)+'</section>';
 return html;
}
function recognize(state,render){
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){state.day.speechInfo='Распознавание речи недоступно в этом браузере.';render();return}
 const d=state.day,idx=d.speechWord;if(d.attempts[idx].length>=5||recording)return;
 const r=new SR();recognizer=r;recording=true;d.speechInfo='';
 r.lang='zh-CN';r.interimResults=false;r.maxAlternatives=1;let got=false;
 r.onresult=e=>{
  if(recognizer!==r||state.view!=='lesson'||state.topic!==0||state.mini!==0||state.stage!==4)return;
  const said=String(e.results?.[0]?.[0]?.transcript||'').trim();
  if(!said){d.speechInfo='Браузер вернул пустую расшифровку.';return}
  got=true;
  const expected=normalize(day.words[idx].zh),match=normalize(said)===expected;
  d.attempts[idx].push({said,match});d.speechInfo=match?'':'Распознано другое слово. Это проверка текста, не акустики тонов.';
 };
 r.onerror=e=>{if(recognizer!==r)return;d.speechInfo='Микрофон: '+String(e.error||'ошибка распознавания')+'. Можно продолжить без него.';};
 r.onend=()=>{if(recognizer!==r)return;recognizer=null;recording=false;if(!got&&!d.speechInfo)d.speechInfo='Речь не распознана. Попробуй ещё раз.';if(state.view==='lesson'&&state.stage===4)render()};
 try{r.start();render()}catch(e){recognizer=null;recording=false;d.speechInfo='Не удалось запустить распознавание. Проверь разрешение микрофона.';render()}
}
function handle(button,state,api){
 const d=state.day||makeState(),key=button.dataset;
 if(key.dayWord!==undefined){d.selected=Number(key.dayWord);api.render();return true}
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
