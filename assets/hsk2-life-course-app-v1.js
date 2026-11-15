/* Panda Go · Моя жизнь на китайском · интерактивный 10x3 курс v1.
   Проверка тонов микрофоном и полная MP3-озвучка НЕ заявляются. */
(function(){
'use strict';
var catalog=window.PandaLifeCourseV1;
if(!catalog||!Array.isArray(catalog.topics)||catalog.topics.length!==10){
 document.getElementById('screen').textContent='Учебные материалы временно недоступны.';
 return;
}
var topics=catalog.topics;
var builders=[
 '我|每天|七点|起床','我|先|吃早饭|再|去上班','我|晚上|常常|看书',
 '我|在|公司|工作','我|会|用|电脑','我|今天|很|忙',
 '我|喜欢|听|音乐','我|周末|常常|跑步','我|觉得|这个|电影|很|有意思',
 '银行|在|学校|旁边','公园|在|医院|后面','我家|离|学校|很近',
 '我|坐|地铁|去|上班','我|从家|到公司|坐|公交车','到|机场|需要|一个小时',
 '我|想要|一碗|面条','请|给|我|一杯|茶','我|还要|一碗|汤',
 '这件|衣服|多少钱','这件|衣服|太贵了','这个|比|那个|便宜',
 '我们|星期六|见面|吧','我们|几点|见面','我们|一起|去|公园|吧',
 '我|昨天|看了|电影','我|昨天|没有|上班','我|去过|上海',
 '我|打算|下个月|去|上海','因为|我|喜欢|中文|所以|我|每天|学习','如果|明天|有空|我|就|去|公园'
].map(function(s){return s.split('|')});
var mistakes=[];
function normalize(s){return String(s||'').replace(/[，。？！,.!?、\s]/g,'')}
for(var ti=0;ti<10;ti++)for(var mi=0;mi<3;mi++){
 var i=ti*3+mi;
 if(normalize(builders[i].join(''))!==normalize(topics[ti].scenes[mi][2]))
  mistakes.push('Lesson '+(i+1)+' needs builder token correction');
}
if(mistakes.length)console.warn('Panda Go course QA:',mistakes.join('; '));
var KEY='pg-hsk2-life-course-v1';
var state={view:'welcome',topic:0,mini:0,stage:0,showPy:true,completed:[],difficult:[],quizWord:null,quizSentence:null,build:[],finalAnswers:{},examPassed:false};
var dayUI=window.PandaGoDayFirstUIV1;
function dayPilot(){return state.topic===0&&state.mini===0&&!!dayUI;}
function dayCoachingLink(mini){return './panda-voice-pilot.html?practice=day&mini='+Math.max(0,Math.min(2,Number(mini)||0))+'&from=hsk2-life-course';}
function dayAIBlock(mini){return '<section class="day-ai-panel"><h2>🐼 Поговори с Пандой AI</h2><p>Потренируй то, что уже изучил: Панда задаст вопросы, а ты ответишь голосом или текстом.</p><div class="day-ai-examples"><strong lang="zh-Hans">你每天几点起床？</strong><br>Во сколько ты каждый день встаёшь?</div><a href="'+dayCoachingLink(mini)+'" aria-label="Открыть разговорную практику Мой день с Panda AI">🎙 Начать практику →</a><p class="day-ai-note">Проверяется смысл ответа; точность тонов пока не оценивается.</p></section>';}

try{
 var saved=JSON.parse(localStorage.getItem(KEY)||'null');
 if(saved&&Array.isArray(saved.completed)){
  state.completed=saved.completed.filter(function(v){return Number.isInteger(v)&&v>=0&&v<30});
  state.difficult=Array.isArray(saved.difficult)?saved.difficult:[];
  state.showPy=saved.showPy!==false;
  state.examPassed=!!saved.examPassed;
 }
}catch(e){}
var screen=document.getElementById('screen');
var status=document.getElementById('message');
function store(){try{localStorage.setItem(KEY,JSON.stringify({completed:state.completed,difficult:state.difficult,showPy:state.showPy,examPassed:state.examPassed}))}catch(e){}}
function E(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function perc(){return Math.round(state.completed.length/30*100)}
function id(){return state.topic*3+state.mini}
function chosen(){return topics[state.topic]}
function current(){return chosen().scenes[state.mini]}
function words(t,m){return topics[t].words.slice(m===0?0:m===1?7:14,m===0?7:m===1?14:20)}
function rec(zh){return !!(window.PandaHsk2AudioV330&&window.PandaHsk2AudioV330.lookup(zh))}
function sound(zh){return rec(zh)?'<button class="audio" type="button" data-sound="'+E(zh)+'" aria-label="Прослушать '+E(zh)+'">🔊</button>':'<span class="audio unavailable" title="Для этой фразы пока нет отдельного проверенного MP3" aria-label="Нет MP3">🔇</span>'}
function phrase(zh,py,ru){return '<div class="phrase"><span class="han" lang="zh-Hans">'+E(zh)+'</span>'+(state.showPy?'<span class="py">'+E(py)+'</span>':'')+'<span class="meaning">'+E(ru)+'</span>'+sound(zh)+'</div>'}
function wordCard(w){
 var flagged=state.difficult.includes(w[0]);
 return '<div class="word-card"><div class="word-top"><span class="han" lang="zh-Hans">'+E(w[0])+'</span>'+sound(w[0])+'</div>'+(state.showPy?'<span class="py">'+E(w[1])+'</span>':'')+'<span class="meaning">'+E(w[2])+'</span><button type="button" data-flag="'+E(w[0])+'" class="flag'+(flagged?' selected':'')+'" aria-label="Пометить слово для повторения">'+(flagged?'★ Повторить':'☆ Сложное')+'</button></div>';
}
function shuffledIndices(n,seed){
 var a=Array.from({length:n},function(_,i){return i});
 for(var i=n-1;i>0;i--){var j=(seed*17+i*23+7)%(i+1);var v=a[i];a[i]=a[j];a[j]=v}
 if(a.every(function(v,i){return v===i})&&n>1){a.reverse()}
 return a;
}
function selection(q,options,selected,type,answer){
 return '<div class="exercise"><h3>'+E(q)+'</h3><div class="options">'+options.map(function(s,i){
  var c=selected===i?(i===answer?' correct':' wrong'):'';
  return '<button class="option'+c+'" type="button" data-'+type+'="'+i+'">'+E(s)+'</button>';
 }).join('')+'</div>'+
 (selected!==null?'<p class="feedback '+(selected===answer?'good':'bad')+'">'+(selected===answer?'✓ Правильно':'✕ Попробуй другой вариант')+'</p>':'')+'</div>';
}
function viewWelcome(){
 var parts=[
  ['01_header_panda.png',220],
  ['02_course_and_ai.png',130],
  ['03_proverb.png',130],
  ['04_course_numbers.png',158],
  ['05_grammar_tests_speech.png',446],
  ['06_outcomes.png',221],
  ['07_actions_and_lake.png',231]
 ];
 return '<section class="approved-welcome" aria-label="Китайский плюс легко, презентация второго курса">'+
 '<div class="approved-poster" role="group" aria-label="Утверждённый дизайн Panda Go: семь фрагментов без растяжения">'+
 parts.map(function(part,i){
  return '<img src="./assets/hsk2-life-landing-approved-v1/'+part[0]+'" width="1024" height="'+part[1]+'" class="approved-slice" alt="" draggable="false" decoding="async" loading="eager">';
 }).join('')+
 '<button type="button" class="approved-hotspot approved-program" data-view="map" aria-label="Посмотреть программу: все 10 тем"></button>'+
 '<button type="button" class="approved-hotspot approved-start" data-start="0" aria-label="Начать курс: первый мини-урок Мой распорядок дня"></button>'+
 '<a class="approved-hotspot approved-ai-top" href="./panda-voice-pilot.html" aria-label="Открыть Панда AI и разговорную практику"></a>'+
 '<a class="approved-hotspot approved-ai-card" href="./panda-voice-pilot.html" aria-label="Открыть Панда AI"></a>'+
 '</div><span class="visually-hidden">Китайский плюс легко: 10 тем, 30 мини-уроков, 200+ слов и выражений. Не бойся говорить с ошибками. Бойся никогда не заговорить. Грамматика, тесты, практика произношения и разговоры с Панда AI.</span></section>';
}
function viewMap(){
 return '<section class="map"><div class="map-head"><h1>🗺️ Все 10 тем</h1><p>Моя жизнь на китайском · 30 коротких уроков</p><div class="meter"><i style="width:'+perc()+'%"></i></div><p class="small">'+state.completed.length+' из 30 мини-уроков завершено</p></div><div class="topic-grid">'+topics.map(function(t,i){
  var n=[0,1,2].filter(function(m){return state.completed.includes(i*3+m)}).length;
  return '<button type="button" data-topic="'+i+'" class="topic-card"><span class="topic-icon">'+t.icon+'</span><span class="topic-title"><b>'+(i+1)+'. '+E(t.name)+'</b><small lang="zh-Hans">'+E(t.cn)+'</small></span><span class="topic-count">'+n+'/3</span></button>';
 }).join('')+'</div><p class="small map-foot">Все 10 тем доступны для ознакомления. Ты можешь выбирать любую тему и повторять уроки без ограничений.</p></section>';
}
function viewTopic(){
 var t=chosen();var completed=[0,1,2].filter(function(m){return state.completed.includes(state.topic*3+m)}).length;
 return '<section class="topic"><div class="panel topic-banner"><span class="topic-icon large">'+t.icon+'</span><div><div class="eyebrow">ТЕМА '+(state.topic+1)+' ИЗ 10</div><h1>'+E(t.name)+'</h1><p lang="zh-Hans">'+E(t.cn)+'</p><p class="small">'+E(t.goal)+'</p><div class="progress-line">'+completed+' из 3 мини-уроков пройдено</div></div></div>'+
 '<div class="mini-list">'+t.scenes.map(function(sc,i){
  var done=state.completed.includes(state.topic*3+i);
  return '<button class="mini-card" type="button" data-mini="'+i+'"><span class="mini-no">'+(i+1)+'</span><span class="mini-copy"><b>'+E(sc[0])+'</b><small>'+(i===0?'7 новых слов':i===1?'7 новых слов':'6 новых слов')+' · диалог · упражнения</small></span><span class="mini-play">'+(done?'✅':'▶')+'</span></button>';
 }).join('')+'</div><div class="tip-box"><b>Как учиться без перегрузки</b><p>Изучи слова, послушай пример, прочитай правило и ответь на вопросы. Не торопись: следующая тема никуда не исчезнет.</p></div><div class="button-row"><button class="secondary" data-view="map">← К карте</button><button class="primary" data-mini="'+(completed<3?completed:0)+'">▶ '+(completed?'Продолжить / повторить':'Начать тему')+'</button></div></section>';
}
function viewLesson(){
 if(dayPilot())return dayUI.render(state,{sound:sound});
 var t=chosen(), sc=current(), step=state.stage, ws=words(state.topic,state.mini), idx=id();
 var html='<section class="lesson"><div class="lesson-head"><div class="eyebrow">ТЕМА '+(state.topic+1)+' / 10 · МИНИ-УРОК '+(state.mini+1)+' / 3</div><h1>'+t.icon+' '+E(t.name)+'</h1><p>'+E(sc[0])+'</p><div class="step-meter"><i style="width:'+((step+1)*25)+'%"></i></div><div class="step-labels"><span>Слова</span><span>Правило</span><span>Проверка</span><span>Собери</span></div></div>';
 if(step===0){
  html+='<div class="stage-title"><h2>📖 Слова и выражения</h2><span>'+ws.length+' слов</span></div>'+
   '<div class="word-grid">'+ws.map(wordCard).join('')+'</div>'+
   '<p class="hint">🔊 Только подтверждённые MP3. Если рядом стоит 🔇, запись ещё не добавлена. Нажми ☆, чтобы оставить слово на повторение.</p>';
 }
 if(step===1){
  html+='<div class="panel gram"><div class="eyebrow">ОДНО ПРАВИЛО</div><h2>'+E(sc[0])+'</h2><p>'+E(sc[1])+'</p><div class="example">'+phrase(sc[2],sc[3],sc[4])+'</div></div>'+
   '<div class="panel"><h2>💬 Мини-диалог</h2><div class="dialogue"><div class="bubble"><b>🐼 Собеседник</b>'+phrase(sc[5],sc[6],sc[7])+'</div>'+
   '<div class="bubble response"><b>👤 Ты</b>'+phrase(sc[8],sc[9],sc[10])+'</div></div></div>'+
   '<div class="tip-box">🎧 Прочитай пиньинь и повтори обе реплики вслух. Если нет MP3, правильность произношения не считается автоматически проверенной.</div>';
 }
 if(step===2){
  var word=ws[Math.min(2,ws.length-1)],a=[word[2],ws[0][2],ws[ws.length-1][2]];
  if(a[1]===a[0])a[1]=ws[1][2];
  if(a[2]===a[0]||a[2]===a[1])a[2]=ws[ws.length-2][2];
  var indices=shuffledIndices(3,idx+2),options=indices.map(function(k){return a[k]});
  var ans=indices.indexOf(0);
  var other1=topics[state.topic].scenes[(state.mini+1)%3][4];
  var other2=topics[state.topic].scenes[(state.mini+2)%3][4];
  var translations=[sc[4],other1,other2],order=shuffledIndices(3,idx+7);
  html+='<div class="stage-title"><h2>🎯 Проверь понимание</h2><span>2 вопроса</span></div>'+
   selection('Что значит '+word[0]+'?',options,state.quizWord,'quiz-word',ans)+
   selection('Как перевести «'+sc[2]+'»?',order.map(function(k){return translations[k]}),state.quizSentence,'quiz-sentence',order.indexOf(0));
  var correctWord=state.quizWord===ans,correctSentence=state.quizSentence===order.indexOf(0);
  html+='<p class="hint">'+(correctWord&&correctSentence?'✅ Оба задания верны. Можно переходить дальше.':'Правильные ответы откроют следующий шаг. Ошибаться и повторять можно сколько угодно.')+'</p>';
 }
 if(step===3){
  var tokens=builders[idx],shuffle=shuffledIndices(tokens.length,idx+13);
  var text=state.build.map(function(k){return tokens[k]}).join(''),ok=state.build.length===tokens.length&&normalize(text)===normalize(sc[2]);
  html+='<div class="panel builder"><div class="stage-title"><h2>🧩 Собери предложение</h2><span>Задание 2 / 2</span></div><p>Скажи по-китайски: <b>'+E(sc[4])+'</b></p>'+
   '<div class="build-target">'+(state.build.length?state.build.map(function(k,i){return '<button type="button" data-remove="'+i+'" class="token chosen">'+E(tokens[k])+'</button>'}).join(''):'<span>Нажимай на части предложения в правильном порядке</span>')+'</div>'+
   '<div class="tokens">'+shuffle.map(function(k){return '<button type="button" class="token" data-token="'+k+'"'+(state.build.includes(k)?' disabled':'')+'>'+E(tokens[k])+'</button>'}).join('')+'</div>'+
   '<p class="feedback '+(ok?'good':'')+'">'+(ok?'✓ Отлично! Предложение собрано правильно.':state.build.length===tokens.length?'Порядок слов неверный. Убери часть предложения и попробуй ещё.':'Помни правило: '+E(sc[0]))+'</p></div>';
 }
 var lock=false;
 if(step===2){var q=ws[Math.min(2,ws.length-1)],opts=[q[2],ws[0][2],ws[ws.length-1][2]],ids=shuffledIndices(3,idx+2);lock=state.quizWord!==ids.indexOf(0)||state.quizSentence!==shuffledIndices(3,idx+7).indexOf(0)}
 if(step===3){lock=state.build.length!==builders[idx].length||normalize(state.build.map(function(k){return builders[idx][k]}).join(''))!==normalize(sc[2])}
 html+='<div class="lesson-nav"><button class="secondary" type="button" data-step-prev>← '+(step===0?'К теме':'Назад')+'</button><button class="primary" type="button" data-step-next'+(lock?' disabled':'')+'>'+(step===3?'✅ Завершить урок':'Далее →')+'</button></div></section>';
 return html;
}
function viewDone(){
 var t=chosen(),sc=current(),number=id();
 if(state.topic===0)return '<section class="done day-done"><div class="day-done-head"><h1>🏆 Мини-урок '+(state.mini+1)+' пройден!</h1><p>Ты изучил слова, правило и выполнил тест.</p></div>'+
 '<div class="day-done-line">'+phrase(sc[2],sc[3],sc[4])+'</div>'+
 dayAIBlock(state.mini)+
 '<div class="button-row"><button class="secondary" data-repeat>↻ Повторить</button><button class="primary" data-next-mini>Следующий урок →</button></div>'+
 '<p class="honest">Проверка слов по голосу показывает распознанный текст, не точность тонов.</p></section>';
 return '<section class="done"><div class="reward-icon">🏆</div><h1>Мини-урок пройден!</h1><p>Ты разобрал слова, грамматику и правильно собрал предложение.</p><div class="panel">'+phrase(sc[2],sc[3],sc[4])+'</div><p class="honest">Запоминание и произношение нужно закреплять повторениями. Эта отметка показывает выполнение заданий, а не официальный экзаменационный результат.</p><div class="button-row"><button class="secondary" data-repeat>↻ Повторить</button><button class="primary" data-next-mini>Следующий мини-урок →</button></div><button class="text-link" data-view="map">Вернуться к десяти темам</button></section>';
}
function viewTones(){
 var toneCards=[
 ['mā','1-й тон','Высокий ровный','↗','—'],
 ['má','2-й тон','Поднимается вверх','↗','↗'],
 ['mǎ','3-й тон','Низкий с подъёмом','⤴','∨'],
 ['mà','4-й тон','Резко падает','↘','↘']
 ];
 return '<section class="tones"><div class="panel"><div class="eyebrow">ПРОИЗНОШЕНИЕ</div><h1>🎧 Китайские тоны</h1><p>Тон меняет значение слова. Сначала посмотри на направление голоса, потом сравни с правильными аудиозаписями в мини-уроках.</p></div>'+
 '<div class="tone-grid">'+toneCards.map(function(t,i){return '<div class="tone-card"><span class="tone-number">'+(i+1)+'</span><span class="tone-pinyin">'+t[0]+'</span><b>'+t[1]+'</b><span>'+t[2]+'</span><span class="tone-line">'+t[4]+'</span></div>'}).join('')+'</div>'+
 '<div class="panel tone-rules"><h2>Три важных изменения тона</h2>'+
 '<div class="tone-rule"><b>1. Два третьих тона</b><span>你好: пишем nǐ hǎo, но произносим ní hǎo.</span></div>'+
 '<div class="tone-rule"><b>2. 不 перед четвёртым</b><span>不是: произносим bú shì, хотя 不 отдельно — bù.</span></div>'+
 '<div class="tone-rule"><b>3. 一 меняет тон</b><span>一个: yí ge; 一杯: yì bēi. Пиньинь читаем по контексту.</span></div></div>'+
 '<div class="panel"><h2>🎯 Мини-проверка</h2><p>Какой тон у zhù (住)?</p><div class="tone-answers">'+[1,2,3,4].map(function(n){
 return '<button class="option'+(state.toneAnswer===n?(n===4?' correct':' wrong'):'')+'" data-tone-answer="'+n+'">'+n+'-й тон</button>';
 }).join('')+'</div>'+(state.toneAnswer?'<p class="feedback '+(state.toneAnswer===4?'good':'bad')+'">'+(state.toneAnswer===4?'✓ Верно, четвёртый тон резко падает.':'Это четвёртый тон. Попробуй выбрать снова.')+'</p>':'')+'</div>'+
 '<div class="tip-box">Приложение пока не измеряет тон твоего голоса. Даже если распознавание речи определило слово, это не означает, что произношение тона было правильным.</div>'+
 '<div class="button-row"><button class="secondary" data-view="map">🗺️ К темам</button><button class="primary" data-start="0">▶ К первому уроку</button></div></section>';
}
function viewReview(){
 var list=[];
 topics.forEach(function(t){t.words.forEach(function(w){if(state.difficult.includes(w[0]))list.push(w)})});
 return '<section class="review"><h1>⭐ Мои трудные слова</h1><p class="muted">Отмечай слова в мини-уроках — здесь они соберутся для повторения.</p>'+
 (list.length?'<div class="word-grid">'+list.map(wordCard).join('')+'</div>':'<div class="panel">Пока нет отмеченных слов. Начни первый мини-урок и отмечай ☆ слова, которые хочешь повторить.</div>')+
 '<div class="button-row"><button class="primary" data-view="map">К темам →</button></div></section>';
}
function examOptions(i){
 var a=topics[i].scenes[0][4],b=topics[(i+1)%10].scenes[0][4],c=topics[(i+2)%10].scenes[0][4];
 var original=[a,b,c],ord=shuffledIndices(3,i+17);
 return {choices:ord.map(function(v){return original[v]}),correct:ord.indexOf(0)};
}
function viewExam(){
 var answered=Object.keys(state.finalAnswers).length;
 var score=topics.reduce(function(n,t,i){return n+(state.finalAnswers[i]===examOptions(i).correct?1:0)},0);
 return '<section class="exam"><div class="panel"><div class="eyebrow">ИТОГОВАЯ ПРОВЕРКА</div><h1>🏅 Моё путешествие</h1><p>Десять вопросов по десяти жизненным темам. Цель — не менее 8 правильных ответов из 10.</p><div class="meter"><i style="width:'+(answered*10)+'%"></i></div><p class="small">Отвечено: '+answered+' / 10</p></div>'+
 topics.map(function(t,i){var s=t.scenes[0],opts=examOptions(i),selected=state.finalAnswers[i];
 return '<div class="exam-question"><span class="eyebrow">'+(i+1)+'. '+E(t.name)+'</span><h2 lang="zh-Hans">'+E(s[2])+'</h2>'+
 (state.showPy?'<p class="py">'+E(s[3])+'</p>':'')+'<div class="options">'+opts.choices.map(function(x,j){
 return '<button class="option'+(selected===j?' chosen':'')+'" data-exam-choice="'+i+':'+j+'">'+E(x)+'</button>';
 }).join('')+'</div></div>';
 }).join('')+
 (answered===10?'<div class="panel result"><h2>'+score+' из 10</h2><p>'+(score>=8?'✅ Задания выполнены успешно!':'Нужно повторить материал и попробовать снова.')+'</p><button class="primary" data-exam-finish>'+(score>=8?'Сохранить результат':'Повторить тест')+'</button></div>':'')+
 (state.examPassed?'<p class="honest">🏆 Итоговый тест пройден. Это внутренний результат курса, не официальный сертификат HSK.</p>':'')+'</section>';
}
function updateNav(){
 document.querySelectorAll('[data-nav]').forEach(function(b){
  var v=b.dataset.nav;
  b.classList.toggle('active',v===state.view||(v==='map'&&(state.view==='topic'||state.view==='lesson'||state.view==='done')));
 });
 var counter=document.getElementById('course-counter');
 if(counter)counter.textContent=state.completed.length+'/30';
}
function render(){
 var html=state.view==='welcome'?viewWelcome():state.view==='map'?viewMap():state.view==='topic'?viewTopic():state.view==='lesson'?viewLesson():state.view==='done'?viewDone():state.view==='review'?viewReview():state.view==='tones'?viewTones():viewExam();
 screen.innerHTML=html;
 document.getElementById('app').classList.toggle('show-approved-welcome',state.view==='welcome');
 updateNav();
 screen.scrollTop=0;
 if(status)status.textContent='';
 store();
}
function go(v){if(state.view==='lesson'&&v!=='lesson'&&dayUI)dayUI.cancel();state.view=v;render()}
function enter(t,m){
 if(dayUI)dayUI.cancel();
 state.topic=t;state.mini=m;state.stage=0;state.quizWord=null;state.quizSentence=null;state.build=[];
 state.day=t===0&&m===0&&dayUI?dayUI.makeState():null;
 go('lesson');
}
function next(){
 if(dayPilot())return dayUI.next(state,{render:render,go:go,complete:function(){if(!state.completed.includes(id()))state.completed.push(id());go('done')}});
 if(state.stage===2){
  var ws=words(state.topic,state.mini),q=ws[Math.min(2,ws.length-1)],idx=id();
  if(state.quizWord!==shuffledIndices(3,idx+2).indexOf(0)||state.quizSentence!==shuffledIndices(3,idx+7).indexOf(0))return;
 }
 if(state.stage===3){
  if(state.build.length!==builders[id()].length||normalize(state.build.map(function(i){return builders[id()][i]}).join(''))!==normalize(current()[2]))return;
  if(!state.completed.includes(id()))state.completed.push(id());
  return go('done');
 }
 state.stage=Math.min(3,state.stage+1);render();
}
document.addEventListener('click',function(e){
 var b=e.target.closest('button');if(!b)return;
 if(b.dataset.sound!==undefined){
  if(window.PandaHsk2AudioV330)window.PandaHsk2AudioV330.play(b.dataset.sound,function(msg){if(status)status.textContent=msg});
  return;
 }
 if(state.view==='lesson'&&dayPilot()&&dayUI.handle(b,state,{render:render,go:go,complete:function(){if(!state.completed.includes(id()))state.completed.push(id());go('done')}}))return;
 if(b.dataset.nav){go(b.dataset.nav);return}
 if(b.dataset.toneAnswer!==undefined){state.toneAnswer=Number(b.dataset.toneAnswer);render();return}
 if(b.dataset.view){go(b.dataset.view);return}
 if(b.dataset.start!==undefined){enter(0,0);return}
 if(b.dataset.topic!==undefined){state.topic=Number(b.dataset.topic);go('topic');return}
 if(b.dataset.mini!==undefined){enter(state.topic,Number(b.dataset.mini));return}
 if(b.dataset.flag!==undefined){
  var w=b.dataset.flag,i=state.difficult.indexOf(w);
  if(i<0)state.difficult.push(w);else state.difficult.splice(i,1);
  render();return;
 }
 if(b.dataset.stepPrev!==undefined){
  if(state.stage===0)go('topic');else{state.stage--;render()}return;
 }
 if(b.dataset.stepNext!==undefined){next();return}
 if(b.dataset.quizWord!==undefined){state.quizWord=Number(b.dataset.quizWord);render();return}
 if(b.dataset.quizSentence!==undefined){state.quizSentence=Number(b.dataset.quizSentence);render();return}
 if(b.dataset.token!==undefined){
  var k=Number(b.dataset.token);
  if(!state.build.includes(k))state.build.push(k);
  render();return;
 }
 if(b.dataset.remove!==undefined){state.build.splice(Number(b.dataset.remove),1);render();return}
 if(b.dataset.repeat!==undefined){enter(state.topic,state.mini);return}
 if(b.dataset.nextMini!==undefined){
  if(id()===29)go('exam');else{var k=id()+1;enter(Math.floor(k/3),k%3)}return;
 }
 if(b.dataset.examChoice!==undefined){
  var parts=b.dataset.examChoice.split(':');state.finalAnswers[Number(parts[0])]=Number(parts[1]);render();return;
 }
 if(b.dataset.examFinish!==undefined){
  var score=topics.reduce(function(n,t,i){return n+(state.finalAnswers[i]===examOptions(i).correct?1:0)},0);
  if(score>=8){state.examPassed=true;go('map')}else{state.finalAnswers={};render()}
  return;
 }
 if(b.dataset.togglePy!==undefined){state.showPy=!state.showPy;render()}
});
var toggle=document.getElementById('toggle-pinyin');
if(toggle)toggle.addEventListener('click',function(){state.showPy=!state.showPy;render()});
/* Allow direct links from the ten cards on the existing HSK2 course map. */
try {
 var params=new URLSearchParams(window.location.search);
 if(params.get('start')==='1') {state.view='lesson';state.topic=0;state.mini=0;state.stage=0;state.day=dayUI?dayUI.makeState():null;}
 var requested=params.get('topic');
 if(requested!==null&&/^(?:[0-9])$/.test(requested)){
  state.topic=Number(requested);
  state.view='topic';
 }
}catch(e){}
render();
})();
