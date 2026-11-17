/* Panda Go v414 · HSK2 / Topic 1 · Six approved purple-gold screen sequence.
   Real HTML controls; the reference PNGs are layout references, not fake working widgets.
   This module is installed after the original v413 implementation but before course-app. */
(function(){
'use strict';
const modules=window.PandaGoDayModulesV391||[];
if(modules.length!==3)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').replace(/[，。？！!?,.\s]/g,'');
const icons=['🗓️','🌅','🛏️','💦','🪥','🥐','🥣'];
const groups=['Слово','Правило','Речь','Тест','Примеры'];
const bespoke=[
 ['我早上洗脸。','Wǒ zǎoshang xǐliǎn.','Утром я умываюсь.','💧'],
 ['我每天刷牙。','Wǒ měitiān shuāyá.','Я каждый день чищу зубы.','🪥'],
 ['我吃早餐。','Wǒ chī zǎocān.','Я завтракаю.','🍳']
];
const schemes=[
 {fill:'我 ____ 吃早饭。',fillOptions:['每天','以后','晚饭'],fillAnswer:0,truth:'早上 означает «утром».',truthAnswer:true,listen:6},
 {fill:'我 ____ 吃早饭，再去上班。',fillOptions:['再','先','晚上'],fillAnswer:1,truth:'下班 означает «заканчивать работу».',truthAnswer:true,listen:3},
 {fill:'我晚上 ____ 看书。',fillOptions:['以前','常常','晚饭'],fillAnswer:1,truth:'睡觉 означает «чистить зубы».',truthAnswer:false,listen:0}
];
let recog=null,active=false;
function cancel(){if(recog){try{recog.onresult=recog.onerror=recog.onend=null;recog.abort()}catch(e){}recog=null}active=false}
function makeState(mini){
 return {selected:0,quiz:[null,null],build:[],attempts:modules[mini||0].words.map(()=>[]),
 speechWord:0,permission:false,showConsent:false,speechInfo:'',working:false,poster:false,
 v414:{pairs:[],pairLeft:null,listen:null,fill:null,truth:null,rule:null,wrongPair:false}};
}
function data(state){return modules[Math.min(2,Math.max(0,Number(state.mini)||0))]||modules[0]}
function extra(state){const d=state.day;return d.v414||(d.v414={pairs:[],pairLeft:null,listen:null,fill:null,truth:null,rule:null,wrongPair:false})}
function player(text,ctx){return '<span class="pg414-sound">'+ctx.sound(text)+'</span>'}
function pinyin(s,py,state){return state.showPy?'<span class="pg414-pinyin">'+esc(py)+'</span>':''}
function header(state){
 const stage=state.stage,day=data(state);
 return '<header class="pg414-hero"><div class="pg414-brand"><b>Panda Go<span>🐾</span></b><small>Курс 2 · Моя жизнь на китайском</small></div>'+
 '<div class="pg414-scroll"><strong>Урок 1 · Мой распорядок дня</strong></div>'+
 '<div class="pg414-miniline">☀️ Мини-урок '+(state.mini+1)+' из 3 · '+esc(day.name||'Начало дня')+'</div>'+
 '<button class="pg414-toggle-py" type="button" data-day-pinyin aria-label="Показать или скрыть пиньинь">拼音</button><nav class="pg414-tabs" aria-label="Этапы урока">'+groups.map((s,i)=>'<span class="'+(stage===i?'active':i<stage?'passed':'')+'"><b>'+(i+1)+'</b>'+s+'</span>').join('')+'</nav></header>';
}
function wordBody(state,ctx){
 const m=data(state),list=m.words;
 return '<section class="pg414-panel pg414-words"><h2>☀️ '+(state.mini===0?'Начало дня':esc(m.name))+'</h2>'+
 list.map((w,i)=>{
  const emoji=state.mini===0?icons[i]:['💼','🕔','🍽️','🌇','🌙','📘','⏰'][i%7];
  return '<div class="pg414-vocab-row day-vword" data-idx="'+i+'"><span class="pg414-number">'+(i+1)+'</span>'+
  '<span class="pg414-vocab-art" aria-hidden="true">'+emoji+'</span>'+
  '<span class="pg414-word-main"><strong lang="zh-Hans">'+esc(w.zh)+'</strong></span>'+
  '<span class="pg414-vocab-meta">'+pinyin(null,w.py,state)+'<span>'+esc(w.ru)+'</span></span>'+
  player(w.zh,ctx)+'</div>';
 }).join('')+'</section>';
}
function grammarBody(state,ctx){
 const m=data(state);
 const title=state.mini===0?'每天 + время + действие':m.ruleTitle;
 const description=state.mini===0?'После подлежащего обычно указываем частоту, затем время и действие. 每天 означает «каждый день».':m.ruleText;
 const formula=state.mini===0?[['我','я'],['每天','каждый день'],['七点','в 7 часов'],['起床','вставать']]:m.formula;
 const examples=state.mini===0?[
 ['我每天七点起床。','Wǒ měitiān qī diǎn qǐchuáng.','Я каждый день встаю в семь часов.','🛏️'],
 ['我每天刷牙。','Wǒ měitiān shuāyá.','Я каждый день чищу зубы.','🪥']
 ]:m.examples.slice(0,2).map((x,i)=>[...x,i?'🌆':'☀️']);
 const choices=state.mini===0?['我 每天 七点 起床。','我 七点 每天 起床。']:
  state.mini===1?['我 先 吃早饭，再 去上班。','我 再 吃早饭，先 去上班。']:
  ['我 晚上 常常 看书。','我 常常 看书 晚上。'];
 const chosen=extra(state).rule;
 return '<section class="pg414-panel pg414-rule"><h2>📖 Грамматика: '+esc(title)+'</h2>'+
 '<div class="pg414-rule-intro">'+esc(description)+'</div>'+
 '<div class="pg414-formula"><b>Структура:</b>'+formula.map(([zh,ru])=>'<span><strong lang="zh-Hans">'+esc(zh)+'</strong><small>'+esc(ru)+'</small></span>').join('<i>+</i>')+'</div>'+
 '<h3>📖 Примеры</h3>'+
 examples.map(x=>'<div class="pg414-example-compact"><span class="pg414-ill">'+x[3]+'</span>'+
 player(x[0],ctx)+'<span><strong lang="zh-Hans">'+esc(x[0])+'</strong>'+pinyin(null,x[1],state)+'<small>'+esc(x[2])+'</small></span></div>').join('')+
 '<h3>🎯 Упражнение</h3><p>Выбери предложение с правильным порядком слов.</p>'+
 '<div class="pg414-rule-options">'+choices.map((x,i)=>'<button type="button" data-day-rule-choice="'+i+'" class="'+(chosen===i?(i===0?'good':'bad'):'')+'">'+(chosen===i?(i===0?'✓ ':'× '):'○ ')+esc(x)+'</button>').join('')+'</div>'+
 '<p class="pg414-small">Сначала читай слова в правильном порядке, затем произнеси предложение вслух.</p></section>';
}
function speechBody(state,ctx){
 const m=data(state),d=state.day;
 const mastered=d.attempts.filter(a=>a.some(r=>r.match)).length;
 return '<section class="pg414-panel pg414-speech"><div class="pg414-panel-title"><h2>🎙 Речь · Тренировка произношения</h2><span class="pg414-progress">'+mastered+'/'+m.words.length+'</span></div>'+
 '<p>Слушай слово и произноси. ✓ означает совпадение распознанного текста, но не оценку тонов.</p>'+
 '<div class="pg414-speech-list">'+m.words.map((w,i)=>{
  const hist=d.attempts[i],last=hist[hist.length-1],status=active&&d.speechWord===i?'Слушаю…':!last?'Ещё не пробовал':last.match?'✓ Распознано':'× Попробуй снова';
  return '<div class="pg414-speech-row"><span class="pg414-vocab-art">'+(state.mini===0?icons[i]:['💼','🕔','🍽️','🌆','🌙','📘','⏰'][i%7])+'</span>'+
   '<span class="pg414-word-main"><strong lang="zh-Hans">'+esc(w.zh)+'</strong>'+pinyin(null,w.py,state)+'</span>'+
   '<span class="pg414-translation">'+esc(w.ru)+'</span>'+player(w.zh,ctx)+
   '<button type="button" data-day-speech-mic="'+i+'" class="pg414-mic" aria-label="Произнести '+esc(w.zh)+'">🎙</button>'+
   '<span class="pg414-speech-status '+(last?(last.match?'yes':'no'):'')+'">'+esc(status)+'</span></div>';
 }).join('')+'</div>'+
 (d.speechInfo?'<p class="pg414-rec-message" role="status">'+esc(d.speechInfo)+'</p>':'')+
 (d.showConsent?'<div class="pg414-consent" role="dialog" aria-label="Разрешение микрофона"><p>Для распознавания браузер может передавать голос стороннему сервису. Panda Go не сохраняет аудиозапись. Разрешить?</p><button data-day-consent type="button">Разрешить</button><button data-day-cancel-consent type="button">Отмена</button></div>':'')+
 '<div class="pg414-info">ⓘ Ошибка распознавания не блокирует повторную попытку. Микрофон необязателен для завершения урока.</div></section>';
}
function question(ordinal,title,body){return '<div class="pg414-question day-question"><h3><span>'+ordinal+'</span>'+title+'</h3>'+body+'</div>'}
function choiceButtons(options,sel,correct,key){
 return '<div class="pg414-choices">'+options.map((x,i)=>'<button type="button" data-day-'+(key.startsWith('quiz-')?'quiz':key)+'="'+(key.startsWith('quiz-')?key.slice(-1)+':'+i:i)+'" class="'+(sel===i?(i===correct?'correct':'wrong'):'')+'">'+String.fromCharCode(65+i)+'. '+esc(x)+(sel===i?(i===correct?' ✓':' ×'):'')+'</button>').join('')+'</div>';
}
function testBody(state,ctx){
 const m=data(state),d=state.day,x=extra(state),sc=schemes[state.mini];
 const q0=m.quiz[0],q1=m.quiz[1],firstChoices=choiceButtons(q0.options,d.quiz[0],q0.answer,'quiz-0'),
 secondChoices=choiceButtons(q1.options,d.quiz[1],q1.answer,'quiz-1');
 const pairWords=state.mini===0?[m.words[1],m.words[3],m.words[4]]:m.words.slice(0,3),rightOrder=[2,0,1];
 const bld=m.builder,order=bld.length===5?[2,0,4,1,3]:[2,0,3,1];
 const normalized=norm(d.build.map(i=>bld[i]).join(''))===norm(m.target);
 const filled=[...sc.fillOptions],matched=x.pairs||[];
 const listenChoices=[m.words[sc.listen],m.words[(sc.listen+1)%m.words.length],m.words[(sc.listen+2)%m.words.length]];
 const total=Number(d.quiz[0]===q0.answer)+Number(d.quiz[1]===q1.answer)+
  Number(matched.length===3)+Number(x.listen===0)+Number(normalized&&d.build.length===bld.length)+
  Number(x.fill===sc.fillAnswer)+Number(x.truth===sc.truthAnswer);
 return '<section class="pg414-panel pg414-test"><div class="pg414-panel-title"><h2>☑️ Тест · Проверь свои знания!</h2><span class="pg414-progress">'+total+'/7</span></div>'+
 question(1,'Что означает слово?','<div class="pg414-test-flex"><div class="pg414-prompt" lang="zh-Hans">'+esc((m.words.find(w=>q0.question.includes(w.zh))||m.words[2]).zh)+'</div>'+firstChoices+'</div>')+
 question(2,'Выбери правильный перевод.','<div class="pg414-test-flex"><div class="pg414-prompt" lang="zh-Hans">'+esc(m.target)+'</div>'+secondChoices+'</div>')+
 question(3,'Соотнеси слово и перевод.','<p>Нажми китайское слово, затем его значение.</p><div class="pg414-pairs">'+
  '<div>'+pairWords.map((w,i)=>'<button data-day-pair-left="'+i+'" type="button" class="'+(matched.includes(i)?'correct':x.pairLeft===i?'selected':'')+'">'+esc(w.zh)+'</button>').join('')+'</div>'+
  '<div>'+rightOrder.map(i=>'<button data-day-pair-right="'+i+'" type="button" class="'+(matched.includes(i)?'correct':'')+'">'+esc(pairWords[i].ru)+'</button>').join('')+'</div></div>'+
  '<small>'+matched.length+'/3 пары'+(x.wrongPair?' · Не совпало, попробуй ещё раз':'')+'</small>')+
 question(4,'Послушай и выбери слово.','<div class="pg414-listen">'+player(m.words[sc.listen].zh,ctx)+choiceButtons(listenChoices.map(w=>w.zh),x.listen,0,'listen')+'</div>')+
 question(5,'Собери предложение.','<p>'+esc(m.targetRu)+'</p><div class="pg414-builder">'+
  (d.build.length?d.build.map((key,i)=>'<button type="button" data-day-remove="'+i+'">'+esc(bld[key])+' ×</button>').join(''):'Нажимай на слова ниже')+'</div>'+
  '<div class="pg414-tokens">'+order.map(i=>'<button data-day-token="'+i+'" type="button"'+(d.build.includes(i)?' disabled':'')+'>'+esc(bld[i])+'</button>').join('')+'</div>'+
  (d.build.length===bld.length?'<small>'+(normalized?'✓ Верно!':'× Проверь порядок слов.')+'</small>':''))+
 question(6,'Выбери подходящее слово.','<div class="pg414-fill">'+esc(sc.fill)+'</div>'+choiceButtons(filled,x.fill,sc.fillAnswer,'fill'))+
 question(7,'Верно или неверно?','<div class="pg414-fill">'+esc(sc.truth)+'</div><div class="pg414-truth">'+
  '<button data-day-truth="true" class="'+(x.truth===true?(sc.truthAnswer?'correct':'wrong'):'')+'">✓ Верно</button>'+
  '<button data-day-truth="false" class="'+(x.truth===false?(!sc.truthAnswer?'correct':'wrong'):'')+'">× Неверно</button></div>')+
 '<div class="pg414-info">'+(total===7?'✓ Все 7 заданий выполнены правильно.':'Ответь правильно на все 7 заданий, чтобы закончить тест.')+'</div></section>';
}
function examplesBody(state,ctx){
 const m=data(state),examples=state.mini===0?bespoke:m.examples.map((x,i)=>[...x,['☀️','🌆','🌙'][i%3]]);
 return '<section class="pg414-panel pg414-examples"><h2>📖 Примеры употребления</h2><p>Прослушай примеры, повтори и запомни.</p>'+
 examples.map(x=>'<div class="pg414-example-large"><span class="pg414-ill">'+x[3]+'</span>'+
 '<span class="pg414-example-copy"><strong lang="zh-Hans">'+esc(x[0])+'</strong>'+pinyin(null,x[1],state)+'<span>'+esc(x[2])+'</span></span>'+player(x[0],ctx)+'</div>').join('')+
 '<details class="pg414-dialogue"><summary>💬 Мини-диалог · 4 реплики</summary>'+
 m.dialogue.map(([who,zh,py,ru])=>'<div class="day-dialogue"><span>'+esc(who)+'</span>'+
 '<div><strong lang="zh-Hans">'+esc(zh)+'</strong>'+pinyin(null,py,state)+'<span>'+esc(ru)+'</span></div>'+player(zh,ctx)+'</div>').join('')+
 '</details></section>';
}
function nav(state){
 const d=state.day;const blocked=state.stage===3&&!ready(state);
 return '<div class="day-bottom pg414-bottom"><button type="button" class="secondary" data-day-prev>← '+(state.stage===0?'К теме':'Назад')+'</button>'+
 '<button type="button" class="primary" data-day-next'+(blocked?' disabled':'')+'>'+(state.stage===4?'Завершить урок ✓':'Дальше ➜')+'</button></div>';
}
function ready(state){
 const m=data(state),d=state.day,x=extra(state),sc=schemes[state.mini];
 return d.quiz[0]===m.quiz[0].answer&&d.quiz[1]===m.quiz[1].answer&&
  x.pairs.length===3&&x.listen===0&&norm(d.build.map(i=>m.builder[i]).join(''))===norm(m.target)&&
  x.fill===sc.fillAnswer&&x.truth===sc.truthAnswer;
}
function render(state,ctx){
 if(!state.day)state.day=makeState(state.mini);
 const s=state.stage;
 const body=s===0?wordBody(state,ctx):s===1?grammarBody(state,ctx):s===2?speechBody(state,ctx):s===3?testBody(state,ctx):examplesBody(state,ctx);
 return '<section class="day-pilot pg414-lesson pg414-step-'+s+'">'+header(state)+body+nav(state)+'</section>';
}
function recognize(state,render){
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition,d=state.day,idx=d.speechWord;
 if(!SR){d.speechInfo='Распознавание речи недоступно. Можно заниматься без микрофона.';render();return}
 if(active)cancel();
 const r=new SR();recog=r;active=true;d.speechInfo='';
 r.lang='zh-CN';r.interimResults=false;r.maxAlternatives=1;
 r.onresult=e=>{
  if(recog!==r||state.view!=='lesson'||state.topic!==0||state.stage!==2)return;
  const said=String(e.results?.[0]?.[0]?.transcript||'').trim();
  if(!said){d.speechInfo='Система не распознала речь.';return}
  const match=norm(said)===norm(data(state).words[idx].zh);
  d.attempts[idx].push({said,match});
  if(d.attempts[idx].length>5)d.attempts[idx].shift();
  d.speechInfo=match?'Распознано: '+said+'. Тоны не оценивались.':'Распознано: '+said+'. Повтори нужное слово.';
 };
 r.onerror=e=>{if(recog===r)d.speechInfo='Микрофон: '+String(e.error||'ошибка')+'. Можно попробовать снова.'};
 r.onend=()=>{if(recog!==r)return;recog=null;active=false;if(state.view==='lesson'&&state.stage===2)render()};
 try{r.start();render()}catch(e){cancel();d.speechInfo='Не удалось открыть микрофон. Проверь разрешения Chrome.';render()}
}
function next(state,api){
 if(state.stage===3&&!ready(state))return;
 if(state.stage===4){cancel();api.complete();return}
 cancel();state.stage++;api.render();
}
function handle(button,state,api){
 const d=state.day||makeState(state.mini),e=extra(state),key=button.dataset,m=data(state);
 if(key.dayPinyin!==undefined){state.showPy=!state.showPy;api.render();return true}
 if(key.dayPrev!==undefined){cancel();if(state.stage===0)api.go('topic');else{state.stage--;api.render()}return true}
 if(key.dayNext!==undefined){next(state,api);return true}
 if(key.dayRuleChoice!==undefined){e.rule=Number(key.dayRuleChoice);api.render();return true}
 if(key.daySpeechMic!==undefined){cancel();d.speechWord=Number(key.daySpeechMic);if(!d.permission){d.showConsent=true;api.render()}else recognize(state,api.render);return true}
 if(key.dayConsent!==undefined){d.permission=true;d.showConsent=false;recognize(state,api.render);return true}
 if(key.dayCancelConsent!==undefined){d.showConsent=false;api.render();return true}
 if(key.dayQuiz!==undefined){const [q,a]=key.dayQuiz.split(':').map(Number);d.quiz[q]=a;api.render();return true}
 if(key.dayPairLeft!==undefined){e.pairLeft=Number(key.dayPairLeft);e.wrongPair=false;api.render();return true}
 if(key.dayPairRight!==undefined){
  const choice=Number(key.dayPairRight);
  if(e.pairLeft!==null){if(e.pairLeft===choice){if(!e.pairs.includes(choice))e.pairs.push(choice);e.wrongPair=false}else e.wrongPair=true;e.pairLeft=null}
  api.render();return true;
 }
 if(key.dayListen!==undefined){e.listen=Number(key.dayListen);api.render();return true}
 if(key.dayToken!==undefined){const k=Number(key.dayToken);if(!d.build.includes(k))d.build.push(k);api.render();return true}
 if(key.dayRemove!==undefined){d.build.splice(Number(key.dayRemove),1);api.render();return true}
 if(key.dayFill!==undefined){e.fill=Number(key.dayFill);api.render();return true}
 if(key.dayTruth!==undefined){e.truth=key.dayTruth==='true';api.render();return true}
 return false;
}
window.PandaGoDayFirstUIV1=Object.freeze({makeState,render,handle,next,cancel,ready});
})();
