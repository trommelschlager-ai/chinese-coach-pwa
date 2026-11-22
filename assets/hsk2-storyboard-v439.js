/* Panda Go HSK2 v433 — selected 20-screen visual direction, REAL HTML learning UI.
 * Do not replace lesson logic/data/audio: wrap v432/v415/v414, preserve original handlers and progress.
 * First mini-lesson: 2 vocab + 2 grammar + 2 speech + 4 test + examples + chat.
 * Second/third minis: storyboard preview followed by existing full working mini-lessons.
 */
(function(){'use strict';
const previous=window.PandaGoDayFirstUIV1;
const modules=window.PandaGoDayModulesV391;
if(!previous||!modules||modules.length!==3)return;
const NAMES=['Слова','Правило','Речь','Тест','Примеры'];
const STAGE=[0,0,1,1,2,2,3,3,3,3,4,4];
const PAGE_START=[0,2,4,6,10];
const LABELS=['Слова 1/2','Слова 2/2','Правило 1/2','Правило 2/2','Речь 1/2','Речь 2/2','Тест 1/4','Тест 2/4','Тест 3/4','Тест 4/4','Примеры','Диалог'];
const ICONS=['🗓️','🌅','🛏️','💧','🪥','🥐','🥣'];
const SCHEMES=[null,{fill:'我 ____ 吃早饭，再去上班。',options:['再','先','晚上'],answer:1,truth:'下班 означает «заканчивать работу».',truthAnswer:true,listen:3},{fill:'我晚上 ____ 看书。',options:['以前','常常','晚饭'],answer:1,truth:'睡觉 означает «чистить зубы».',truthAnswer:false,listen:0}];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').replace(/[\s，。？！,.!?]/g,'');
const word=(v)=>'<span class="pg433-hanzi" lang="zh-Hans">'+esc(v)+'</span>';
function blossom(i){
 let seed=(i+13)*19;
 const flip=i%2===0;
 const xy=[[29,21],[75,45],[107,17],[142,59],[165,23]];
 const blooms=xy.map(([x,y],j)=>{
   const a=(seed+j*37)%25, X=x+a-10, Y=y+((j*13+seed)%21)-11;
   return '<g transform="translate('+X+' '+Y+')">'+[0,72,144,216,288].map(q=>'<ellipse cx="0" cy="-9" rx="5.8" ry="9" transform="rotate('+q+')" fill="'+(['#ffd8e7','#ffb8d1','#fac5d9'][j%3])+'" stroke="#ee98b1" stroke-width=".5"/>').join('')+'<circle r="3.3" fill="#efbc57"/></g>';
 }).join('');
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 205 112"><path d="M-5 8 Q65 16 113 52 T213 99 M48 21 Q66 49 50 84 M117 53 Q119 28 149 7" fill="none" stroke="#a87b78" stroke-width="4.5" stroke-linecap="round"/>'+blooms+'</svg>';
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
function audio(ctx,zh){return '<span class="pg433-sound" aria-label="Озвучить '+esc(zh)+'">'+ctx.sound(zh)+'</span>'}
function row(ctx,w,i){return '<article class="pg433-wordrow"><span class="pg433-num">'+(i+1)+'</span><div class="pg433-wordmain">'+word(w.zh)+'<span class="pg433-py">'+esc(w.py)+'</span><small>'+esc(w.ru)+'</small></div><span class="pg433-wordicon" aria-hidden="true">'+ICONS[i]+'</span>'+audio(ctx,w.zh)+'</article>'}
function sentence(ctx,a){return '<div class="pg433-sentence">'+audio(ctx,a[0])+'<div>'+word(a[0])+'<span class="pg433-py">'+esc(a[1])+'</span><small>'+esc(a[2])+'</small></div></div>'}
function pick(label,attr,value,chosen,answer){
 const comp=attr==='data-day-quiz'?Number(String(value).split(':')[1]):value;
 const selected=chosen===comp;
 return '<button type="button" class="pg433-option '+(selected?(comp===answer?'correct':'wrong'):'')+'" '+attr+'="'+esc(value)+'" aria-pressed="'+selected+'">'+esc(label)+(selected?(comp===answer?' ✓':' ×'):'')+'</button>';
}
function pairScreen(d,mini){
 const xs=d.v414||{},sel=xs.pairLeft,done=xs.pairs||[];
 const data=mini===0?[modules[0].words[1],modules[0].words[3],modules[0].words[4]]:modules[mini].words.slice(0,3), order=[2,0,1];
 return '<div class="pg433-panel"><h3>3. Соотнеси слово и перевод</h3><p>Нажми китайское слово, затем его значение.</p><div class="pg433-pairs"><div>'+data.map((w,i)=>'<button type="button" data-day-pair-left="'+i+'" class="'+(done.includes(i)?'correct':sel===i?'selected':'')+'">'+word(w.zh)+'</button>').join('')+'</div><div>'+order.map(i=>'<button type="button" data-day-pair-right="'+i+'" class="'+(done.includes(i)?'correct':'')+'">'+esc(data[i].ru)+'</button>').join('')+'</div></div><p class="pg433-hint">Соединено: '+done.length+'/3'+(xs.wrongPair?' · Попробуй ещё раз':'')+'</p></div>';
}
function quizBox(n,body){return '<section class="pg433-panel pg433-quiz"><h3>'+n+'</h3>'+body+'</section>'}
function pageMarkup(state,ctx){
 const d=state.day,m=modules[0],x=d.v414||(d.v414={}),page=d.pg433Page||0;
 const w=m.words;
 if(page===0)return '<h2>📖 Новые слова <span class="pg433-tag">1–4 / 7</span></h2><p class="pg433-hint">Четыре слова — изучаем иероглифы, пиньинь и перевод.</p>'+w.slice(0,4).map((v,i)=>row(ctx,v,i)).join('')+'<div class="pg433-note">🔊 Слушай доступные записи. 🔇 означает, что отдельный MP3 пока не записан.</div>';
 if(page===1)return '<h2>📖 Продолжение словаря <span class="pg433-tag">5–7 / 7</span></h2>'+w.slice(4).map((v,i)=>row(ctx,v,i+4)).join('')+'<div class="pg433-panel pg433-analysis"><h3>🔎 Разбор слова 起床</h3><div class="pg433-chars"><div><b>起</b><span>qǐ</span><small>подниматься</small></div><strong>+</strong><div><b>床</b><span>chuáng</span><small>кровать</small></div></div><p>起床 — вставать с постели.</p></div>'+ (window.PandaHsk2AudioV330?.lookup?.('我早上吃早饭。')?'<div class="pg433-panel"><h3>🎧 Пример с настоящей записью</h3>'+sentence(ctx,['我早上吃早饭。','Wǒ zǎoshang chī zǎofàn.','Утром я завтракаю.'])+'<p>Это запись целого предложения, а не отдельного слова.</p></div>':'');
 if(page===2)return '<h2>📕 Грамматика · правило</h2><p class="pg433-hint">Порядок слов в предложении.</p><div class="pg433-panel"><h3>Каждый день + время + действие</h3><div class="pg433-formula"><span>我</span><span>每天</span><span>七点</span><span>起床</span></div><div class="pg433-formula-ru"><span>я</span><span>каждый день</span><span>в 7 часов</span><span>встаю</span></div><p>После подлежащего указываем частоту, затем время и действие.</p></div>'+sentence(ctx,['我每天七点起床。','Wǒ měitiān qī diǎn qǐchuáng.','Я каждый день встаю в семь часов.'])+'<div class="pg433-note">💡 Кто? → Как часто? → Во сколько? → Что делает?</div>';
 if(page===3)return '<h2>📘 Примеры и упражнение</h2>'+sentence(ctx,['我每天刷牙。','Wǒ měitiān shuāyá.','Я каждый день чищу зубы.'])+sentence(ctx,['我早上洗脸。','Wǒ zǎoshang xǐliǎn.','Утром я умываюсь.'])+'<div class="pg433-panel pg433-quiz"><h3>🎯 Выбери правильный порядок</h3>'+['我 每天 七点 起床。','我 七点 每天 起床。'].map((s,i)=>pick(s,'data-day-rule-choice',i,x.rule,0)).join('')+'</div>';
 if(page===4||page===5){
  const start=page===4?0:4,end=page===4?4:7;
  return '<h2>🎙 Практика произношения <span class="pg433-tag">'+(start+1)+'–'+end+' / 7</span></h2><p class="pg433-hint">Произнеси слова вслух по пиньиню. Если есть 🔊 — прослушай запись. Микрофон распознаёт текст, но не проверяет точность тонов.</p>'+w.slice(start,end).map((v,k)=>{
   const i=start+k,h=d.attempts?.[i]||[],last=h.at(-1);
   return '<div class="pg433-speechrow"><span class="pg433-num">'+(i+1)+'</span><div>'+word(v.zh)+'<span class="pg433-py">'+esc(v.py)+'</span><small>'+esc(v.ru)+'</small><em>'+(last?(last.match?'✓ Распознано':'Повтори ещё раз'):'')+'</em></div>'+audio(ctx,v.zh)+'<button type="button" class="pg433-mic" data-day-speech-mic="'+i+'" aria-label="Произнести '+esc(v.zh)+'">🎙</button></div>';
  }).join('')+(page===5?'<div class="pg433-panel"><h3>🎧 Следи за тонами</h3><p><b>洗脸 xǐliǎn</b> — при двух третьих тонах первый меняется на второй в связной речи.</p><p><b>起床 qǐchuáng</b> — третий + второй.</p></div>':'')+
  (d.speechInfo?'<p role="status" class="pg433-note">'+esc(d.speechInfo)+'</p>':'')+
  (d.showConsent?'<div role="dialog" aria-label="Микрофон" class="pg433-panel"><h3>Разрешить микрофон?</h3><p>Распознавание речи в браузере может передавать голос стороннему сервису. Panda Go не сохраняет аудиозаписи.</p><button class="pg433-option" data-day-consent>Разрешить</button><button class="pg433-option" data-day-cancel-consent>Отмена</button></div>':'');
 }
 if(page===6){const q=m.quiz;
  return '<h2>🎯 Тест · часть 1 <span class="pg433-tag">1–2 / 7</span></h2>'+quizBox('1. Что означает 起床?',q[0].options.map((a,i)=>pick(a,'data-day-quiz','0:'+i,d.quiz[0],q[0].answer)).join(''))+
   quizBox('2. Переведи предложение',word(m.target)+q[1].options.map((a,i)=>pick(a,'data-day-quiz','1:'+i,d.quiz[1],q[1].answer)).join(''));
 }
 if(page===7)return '<h2>🧩 Тест · часть 2 <span class="pg433-tag">3 / 7</span></h2>'+pairScreen(d,0);
 if(page===8){const lis=[w[6],w[0],w[1]];
 const correct='我每天七点起床。';const tokens=m.builder;const ordered=[2,0,3,1];
 return '<h2>🎧 Тест · часть 3 <span class="pg433-tag">4–5 / 7</span></h2>'+quizBox(window.PandaHsk2AudioV330?.lookup?.(w[6].zh)?'4. Послушай и выбери':'4. Найди слово «завтракать»',(window.PandaHsk2AudioV330?.lookup?.(w[6].zh)?audio(ctx,w[6].zh):'<p class="pg433-hint">Отдельной записи ещё нет. Выбери китайское слово по значению.</p>')+lis.map((w,i)=>pick(w.zh,'data-day-listen',i,x.listen,0)).join(''))+
 quizBox('5. Собери предложение','<p>Я каждый день встаю в семь часов.</p><div class="pg433-build">'+(d.build.length?d.build.map((ix,i)=>'<button type="button" data-day-remove="'+i+'">'+esc(tokens[ix])+' ×</button>').join(''):'Нажимай на слова ниже')+'</div><div class="pg433-tokens">'+ordered.map(i=>'<button type="button" data-day-token="'+i+'" '+(d.build.includes(i)?'disabled':'')+'>'+esc(tokens[i])+'</button>').join('')+'</div>');
 }
 if(page===9)return '<h2>✅ Тест · часть 4 <span class="pg433-tag">6–7 / 7</span></h2>'+quizBox('6. Вставь пропущенное слово',word('我 ____ 吃早饭。')+['每天','以后','晚饭'].map((s,i)=>pick(s,'data-day-fill',i,x.fill,0)).join(''))+quizBox('7. Верно или неверно?','<p>早上 означает «утром».</p>'+[['Верно','true'],['Неверно','false']].map(([s,val])=>pick(s,'data-day-truth',val,x.truth===null?null:String(x.truth),'true')).join(''));
 if(page===10)return '<h2>📝 Примеры употребления</h2><p class="pg433-hint">Прочитай фразы, прослушай доступные записи 🔊 и повтори.</p>'+[['我早上洗脸。','Wǒ zǎoshang xǐliǎn.','Утром я умываюсь.'],['我每天刷牙。','Wǒ měitiān shuāyá.','Я каждый день чищу зубы.'],['我吃早餐。','Wǒ chī zǎocān.','Я завтракаю.']].map(v=>sentence(ctx,v)).join('')+'<div class="pg433-note">🗣 Попробуй повторить фразы без подсказки.</div>';
 if(page===11)return '<h2>💬 Диалог с Пандой <span class="pg433-tag">4 реплики</span></h2><p class="pg433-hint">Пример разговора. Читай реплики и слушай доступные записи 🔊.</p>'+m.dialogue.map(([who,zh,py,ru],i)=>'<div class="pg433-chat '+(i%2?'right':'left')+'"><div class="pg433-avatar">'+who+'</div><div class="pg433-bubble">'+word(zh)+'<span class="pg433-py">'+esc(py)+'</span><small>'+esc(ru)+'</small>'+audio(ctx,zh)+'</div></div>').join('')+'<div class="pg433-note">После диалога откроется Panda AI для самостоятельной практики.</div>';
 return '';
}
function otherMarkup(state,ctx){
 const d=state.day,m=modules[state.mini],pg=d.pg433Page||0,x=d.v414||(d.v414={}),words=m.words,sc=SCHEMES[state.mini],start=pg===0||pg===4?0:4;
 const audioWords=(low,high)=>words.slice(low,high).map((v,i)=>{
   const j=low+i,icon=['💼','🕕','☀️','🍽️','🌇','📖','🛌'][j%7];
   return '<article class="pg433-wordrow"><span class="pg433-num">'+(j+1)+'</span><div class="pg433-wordmain">'+word(v.zh)+'<span class="pg433-py">'+esc(v.py)+'</span><small>'+esc(v.ru)+'</small></div><span class="pg433-wordicon">'+icon+'</span>'+audio(ctx,v.zh)+'</article>';
 }).join('');
 if(pg===0||pg===1){const low=pg===0?0:4,high=pg===0?4:words.length;
   return '<h2>📖 Новые слова <span class="pg433-tag">'+(low+1)+'–'+high+' / '+words.length+'</span></h2>'+audioWords(low,high)+
    (pg===1?'<div class="pg433-panel"><h3>🔎 Разбор и тоны</h3><p>'+esc(words[0].tip||'Повтори новые слова и проверь пиньинь.')+'</p></div>':'<div class="pg433-note">🔊 Слушай доступные записи. 🔇 означает, что отдельный MP3 пока не записан.</div>');
 }
 if(pg===2)return '<h2>📕 Грамматика · правило</h2><div class="pg433-panel"><h3>'+esc(m.ruleTitle)+'</h3><p>'+esc(m.ruleText)+'</p><p>'+esc(m.ruleTip||'')+'</p></div>'+sentence(ctx,[m.target,m.targetPy,m.targetRu]);
 if(pg===3){const choices=state.mini===1?['我 先 吃早饭，再 去上班。','我 再 吃早饭，先 去上班。']:['我 晚上 常常 看书。','我 常常 看书 晚上。'];
   return '<h2>📘 Примеры и упражнение</h2>'+m.examples.slice(1).map(v=>sentence(ctx,v)).join('')+'<div class="pg433-panel"><h3>🎯 Выбери правильное предложение</h3>'+choices.map((s,i)=>pick(s,'data-day-rule-choice',i,x.rule,0)).join('')+'</div>';
 }
 if(pg===4||pg===5){const low=pg===4?0:4,high=pg===4?4:words.length;
   return '<h2>🎙 Речь <span class="pg433-tag">'+(low+1)+'–'+high+' / '+words.length+'</span></h2><p class="pg433-hint">Произнеси слова по пиньиню. При наличии 🔊 прослушай запись. Микрофон не оценивает точность тонов.</p>'+words.slice(low,high).map((v,i)=>{const n=low+i,a=d.attempts?.[n]||[],last=a.at(-1);return '<div class="pg433-speechrow"><span class="pg433-num">'+(n+1)+'</span><div>'+word(v.zh)+'<span class="pg433-py">'+esc(v.py)+'</span><small>'+esc(v.ru)+'</small><em>'+(last?(last.match?'✓ Распознано':'Повтори ещё раз'):'')+'</em></div>'+audio(ctx,v.zh)+'<button class="pg433-mic" data-day-speech-mic="'+n+'">🎙</button></div>'}).join('')+(d.speechInfo?'<p role="status" class="pg433-note">'+esc(d.speechInfo)+'</p>':'')+(d.showConsent?'<div class="pg433-panel" role="dialog"><h3>Разрешить микрофон?</h3><p>Браузер может передавать голос стороннему сервису распознавания.</p><button class="pg433-option" data-day-consent>Разрешить</button><button class="pg433-option" data-day-cancel-consent>Отмена</button></div>':'');
 }
 if(pg===6){return '<h2>🎯 Тест · часть 1</h2>'+m.quiz.map((q,i)=>quizBox((i+1)+'. '+esc(q.question),q.options.map((s,j)=>pick(s,'data-day-quiz',i+':'+j,d.quiz[i],q.answer)).join(''))).join('')}
 if(pg===7)return '<h2>🧩 Тест · часть 2</h2>'+pairScreen(d,state.mini);
 if(pg===8){const lis=[words[sc.listen],words[(sc.listen+1)%words.length],words[(sc.listen+2)%words.length]],builder=m.builder,order=builder.length===5?[2,0,4,1,3]:[2,0,3,1];
   return '<h2>🎧 Тест · часть 3</h2>'+quizBox(window.PandaHsk2AudioV330?.lookup?.(lis[0].zh)?'4. Послушай и выбери':'4. Найди: '+esc(lis[0].ru),(window.PandaHsk2AudioV330?.lookup?.(lis[0].zh)?audio(ctx,lis[0].zh):'<p class="pg433-hint">Отдельной записи ещё нет. Выбери подходящее слово.</p>')+lis.map((v,i)=>pick(v.zh,'data-day-listen',i,x.listen,0)).join(''))+quizBox('5. Собери предложение','<p>'+esc(m.targetRu)+'</p><div class="pg433-build">'+(d.build.length?d.build.map((j,i)=>'<button data-day-remove="'+i+'">'+esc(builder[j])+' ×</button>').join(''):'Нажимай на слова ниже')+'</div><div class="pg433-tokens">'+order.map(j=>'<button data-day-token="'+j+'" '+(d.build.includes(j)?'disabled':'')+'>'+esc(builder[j])+'</button>').join('')+'</div>');
 }
 if(pg===9)return '<h2>✅ Тест · часть 4</h2>'+quizBox('6. Вставь пропущенное слово',word(sc.fill)+sc.options.map((v,i)=>pick(v,'data-day-fill',i,x.fill,sc.answer)).join(''))+quizBox('7. Верно или неверно?','<p>'+esc(sc.truth)+'</p>'+[['Верно','true'],['Неверно','false']].map(([s,val])=>pick(s,'data-day-truth',val,x.truth===null?null:String(x.truth),String(sc.truthAnswer))).join(''));
 if(pg===10)return '<h2>📝 Примеры употребления</h2>'+m.examples.map(v=>sentence(ctx,v)).join('')+'<div class="pg433-note">Произнеси каждую фразу и проверь значение.</div>';
 if(pg===11)return '<h2>💬 Диалог с Пандой</h2><p class="pg433-hint">Четыре реплики — читай и повторяй; звук 🔊 доступен не для всех фраз.</p>'+m.dialogue.map(([who,zh,py,ru],i)=>'<div class="pg433-chat '+(i%2?'right':'left')+'"><div class="pg433-avatar">'+who+'</div><div class="pg433-bubble">'+word(zh)+'<span class="pg433-py">'+esc(py)+'</span><small>'+esc(ru)+'</small>'+audio(ctx,zh)+'</div></div>').join('');
 return '';
}

function testReady(state,page){const d=state.day,x=d.v414||{},m=modules[state.mini],sc=SCHEMES[state.mini];
 if(page===6)return d.quiz[0]===m.quiz[0].answer&&d.quiz[1]===m.quiz[1].answer;
 if(page===7)return (x.pairs||[]).length===3;
 if(page===8)return x.listen===0&&d.build.length===m.builder.length&&norm(d.build.map(i=>m.builder[i]).join(''))===norm(m.target);
 if(page===9)return state.mini===0?(x.fill===0&&x.truth===true):(x.fill===sc.answer&&x.truth===sc.truthAnswer);
 return true;
}
function chrome(state,page,sub,mini){
 const branch=(a,b,cls)=>'<span class="pg433-blossom '+cls+'" style="background-image:url(&quot;'+blossom(a+b)+'&quot;)"></span>';
 const chapter=mini===0?'Мини-урок 1 · Начало дня':mini===1?'Мини-урок 2 · Утро, работа и вечер':'Мини-урок 3 · Мой вечер и привычки';
 return '<header class="pg433-header">'+branch(page,mini,'top')+'<div class="pg433-topline"><button type="button" data-pg433-back class="pg433-back" aria-label="Назад">‹</button><div class="pg433-title"><small>HSK 2 · Тема 1</small><strong>Мой день</strong></div><span class="pg433-pill">'+esc(chapter)+'</span></div>'+
 '<div class="pg433-tabs">'+NAMES.map((s,i)=>'<button type="button" data-pg433-step="'+i+'" class="'+(state.stage===i?'active':'')+'" aria-current="'+(state.stage===i?'step':'false')+'" '+(i>(state.day.pg433HighestStage||0)?'disabled title="Сначала пройди предыдущие этапы"':'')+'><b>'+(i+1)+'</b><span>'+s+'</span></button>').join('')+'</div></header>';
}
function whole(state,ctx){const d=state.day,page=d.pg433Page||0;
 const panel='<div id="pg433" class="pg433-root">'+chrome(state,page,'',state.mini)+'<span class="pg433-blossom bottom" style="background-image:url(&quot;'+blossom(page+17)+'&quot;)"></span>'+
  '<span class="pg433-edge-sakura left" aria-hidden="true" style="background-image:url(&quot;'+blossom(page+31)+'&quot;)"></span>'+
  '<span class="pg433-edge-sakura right" aria-hidden="true" style="background-image:url(&quot;'+blossom(page+49)+'&quot;)"></span><main class="pg433-content" id="pg433-content" tabindex="0">'+(state.mini===0?pageMarkup(state,ctx):otherMarkup(state,ctx))+'</main>'+
 '<footer class="pg433-footer"><button type="button" class="pg433-secondary" data-pg433-prev>← Назад</button><span class="pg433-counter">'+(page+1)+' / 12</span><button type="button" class="pg433-primary" data-pg433-next '+(!testReady(state,page)?'disabled aria-label="Выполни задания"':'')+'>'+ (page===11?'К Panda AI':'Дальше →')+'</button></footer></div>';
 return panel;
}
function miniPreview(state){const m=modules[state.mini],index=state.mini;
 return '<section id="pg433" class="pg433-root pg433-preview">'+chrome(state,15+index,'',index)+'<main class="pg433-content"><h2>'+(index===1?'🌤 Утро, работа и вечер':'🌙 Мой вечер и привычки')+'</h2><p class="pg433-hint">'+m.words.length+' новых слов · правило · речь · тест · примеры · Panda AI</p><div class="pg433-chips">'+m.words.map(v=>'<div>'+word(v.zh)+'<span class="pg433-py">'+esc(v.py)+'</span><small>'+esc(v.ru)+'</small></div>').join('')+'</div><div class="pg433-panel"><h3>Грамматика</h3><p>'+esc(m.ruleTitle)+'</p>'+word(m.target)+'<p>'+esc(m.targetPy)+' · '+esc(m.targetRu)+'</p></div></main><footer class="pg433-footer"><button class="pg433-secondary" data-pg433-back>← К теме</button><button class="pg433-primary" data-pg433-start-mini>Начать мини-урок →</button></footer></section>';
}
function done(state,sound,link){const d=state.day||{};
 return '<section id="pg433" class="pg433-root pg433-done">'+chrome({...state,stage:4,day:{...d,pg433HighestStage:4}},12,'',state.mini)+'<main class="pg433-content"><h2>🐼 Panda AI · разговор</h2><p class="pg433-hint">Первый мини-урок пройден. Теперь ответь Панде самостоятельно.</p><div class="pg433-panel"><h3>🎙 Панда спрашивает</h3>'+[['你几点起床？','Nǐ jǐ diǎn qǐchuáng?','Во сколько ты встаёшь?'],['你早上做什么？','Nǐ zǎoshang zuò shénme?','Что ты делаешь утром?']].map(q=>'<div class="pg433-sentence">'+audio({sound},q[0])+'<div>'+word(q[0])+'<span class="pg433-py">'+esc(q[1])+'</span><small>'+esc(q[2])+'</small></div></div>').join('')+'</div><a class="pg433-ai-link" href="'+esc(link)+'">🎙 Открыть Panda AI для ответа →</a><p class="pg433-note">Речь и текст проверяются в настоящей Panda AI. Одна лишь транскрипция не доказывает правильность тонов.</p></main><footer class="pg433-footer"><button class="pg433-secondary" data-repeat>↻ Повторить</button><button class="pg433-primary" data-next-mini>Следующий мини-урок →</button></footer></section>';
}
function mapView(topics,completed,expandedTopic=null,mainProgress=[]){
  // Visual-only course catalog refresh. Do not change topic IDs, localStorage progress, routes or lesson engines.
  const safeDone=Array.isArray(completed)?completed:[];
  const coreLessons=[
    {n:1,name:'О себе',cn:'自我介绍',desc:'Расскажи, как тебя зовут и откуда ты',href:'./hsk2-about-me.html',art:'about',done:!!mainProgress[0]},
    {n:2,name:'Мой день',cn:'我的一天',desc:'Говори об утре, работе и привычках',href:'./hsk2-lesson1.html',art:'day',done:!!mainProgress[1]},
    {n:3,name:'Работа',cn:'工作和学习',desc:'Моя работа и учёба',href:'./hsk2-lesson3-work-study-preview.html',art:'work',done:!!mainProgress[2]},
    {n:4,name:'Моё хобби',cn:'我的爱好',desc:'Расскажи об увлечениях и выходных',href:'./hsk2-lesson4-hobby-preview.html',art:'hobby',done:!!mainProgress[3]},
    {n:5,name:'Друзья и встречи',cn:'朋友与见面',desc:'Приглашай друзей и договаривайся о встрече',href:'./hsk2-lesson5-friends-v2.html?rev=20261121',art:'friends',done:!!mainProgress[4]},
    {n:6,name:'Вчера и мой опыт',cn:'昨天和我的经历',desc:'Расскажи о вчерашнем дне и своём опыте',href:'./hsk2-lesson6-yesterday-preview.html?v=4',art:'yesterday',done:!!mainProgress[5]},
    {n:7,name:'Мои планы на будущее',cn:'我的未来计划',desc:'Учёба, работа, путешествия и планы',href:'./hsk2-lesson7-future-preview.html?cover=v6&rev=approved7',art:'future',done:!!mainProgress[6]},
    {n:8,name:'В магазине',cn:'在商店',desc:'Покупки, цены и выбор товаров',href:'./hsk2-lesson8-shop-preview.html?rev=shop8-layout-v4',art:'shop',preview:true,done:!!mainProgress[7]},
    {n:9,name:'Здоровье и самочувствие',cn:'健康和身体状况',desc:'Расскажи о здоровье и самочувствии',href:'./hsk2-lesson9-health-preview.html',art:'health',preview:true,done:!!mainProgress[8]},
    {n:10,name:'Любовь и отношения',cn:'恋爱与相处',desc:'Знакомство, чувства и отношения',href:'./hsk2-lesson10-relationships-preview.html',art:'relationships',preview:true,done:!!mainProgress[9]}
  ];
  const cards=coreLessons.map(lesson=>
    '<a class="pgc-feature-card pgc-feature-'+lesson.art+'" href="'+lesson.href+'" aria-label="Урок '+lesson.n+': '+esc(lesson.name)+(lesson.done?'. Пройден. Повторить':'. Открыть')+'">'+
      '<span class="pgc-feature-art pgc-art-'+lesson.art+'" aria-hidden="true"></span>'+
      '<span class="pgc-feature-text"><span class="pgc-feature-tag">УРОК '+lesson.n+(lesson.preview?' · ПРЕДПРОСМОТР':lesson.done?' · ✓ ПРОЙДЕН':'')+'</span>'+ 
        '<strong>'+esc(lesson.name)+'</strong><span class="pgc-feature-cn" lang="zh-Hans">'+esc(lesson.cn)+'</span>'+
        '<small>'+esc(lesson.desc)+'</small></span>'+
      '<span class="pgc-feature-action" aria-hidden="true">'+(lesson.done?'✓':'▶')+'</span>'+ 
    '</a>'
  ).join('');
  const topicsMarkup=topics.map((t,i)=>{
    if(expandedTopic!==i)return '';
    const done=[0,1,2].filter(m=>safeDone.includes(i*3+m)).length;
    const expanded=expandedTopic===i;
    const name=i===0?'Утро и привычки':t.name;
    const miniTitles=i===0?['Начало дня','Утро, работа и вечер','Мой вечер и привычки']:t.scenes.map(sc=>sc[0]);
    const miniCards=expanded?'<div class="pgc-mini-panel" id="pgc-minis-'+i+'" role="group" aria-label="Мини-уроки темы '+esc(name)+'">'+
      '<p class="pgc-mini-intro">Выбери мини-урок. Задания и прогресс самостоятельные.</p>'+
      t.scenes.map((sc,m)=>'<button type="button" class="pgc-mini-card" data-practice-mini="'+i+':'+m+'" aria-label="Практика '+(i+1)+', мини-урок '+(m+1)+': '+esc(miniTitles[m])+'">'+
        '<span class="pgc-mini-index">'+(m+1)+'</span>'+
        '<span class="pgc-mini-copy"><b>'+esc(miniTitles[m])+'</b><small lang="zh-Hans">'+esc(sc[2])+'</small></span>'+
        '<span class="pgc-mini-state">'+(safeDone.includes(i*3+m)?'✓':'▶')+'</span></button>').join('')+
      '</div>':'';
    return '<div class="pgc-topic-wrap">'+
      '<button type="button" class="pg433-map-card pgc-topic-card" data-topic="'+i+'" aria-expanded="'+expanded+'" aria-controls="pgc-minis-'+i+'" aria-label="Практика '+(i+1)+': '+esc(name)+'. Пройдено '+done+' из 3">'+
        '<span class="pgc-topic-icon" aria-hidden="true">'+esc(t.icon)+'</span>'+
        '<span class="pgc-topic-copy"><b>'+esc(name)+'</b>'+
        '<small>'+(i===0?'Дополнительные упражнения после «Моего дня»':'<span lang="zh-Hans">'+esc(t.cn)+'</span> · 3 мини-урока')+'</small></span>'+
        '<span class="pgc-topic-meta"><span>'+done+' / 3</span>'+
        '<span class="pgc-topic-meter" aria-hidden="true"><i style="width:'+(done*100/3)+'%"></i></span></span>'+
        '<span class="pgc-topic-chevron" aria-hidden="true">'+(expanded?'⌃':'⌄')+'</span>'+
      '</button>'+miniCards+'</div>';
  }).join('');
  const grammar=(window.PandaHSK2GrammarReview||[]).map((rules,i)=>{
    const lesson=coreLessons[i];
    const label=lesson.preview?' · Предпросмотр':lesson.done?' · Пройден':'';
    const examples=rules.map(([rule,explanation,zh,py,ru,recording])=>{
      const src=recording||window.PandaGoHSK2Lesson1NativeAudioV459?.[zh];
      return '<article class="pgc-grammar-rule"><h3>'+esc(rule)+'</h3><p>'+esc(explanation)+'</p>'+
        '<strong lang="zh-Hans">'+esc(zh)+'</strong><span class="pgc-grammar-pinyin">'+esc(py)+'</span>'+
        '<span>'+esc(ru)+'</span>'+
        (src?'<audio controls preload="none" src="'+esc(src)+'" aria-label="Прослушать '+esc(zh)+'"></audio>':'')+
        '</article>';
    }).join('');
    return '<details class="pgc-grammar-lesson" name="pgc-grammar-lessons"><summary>'+
      'Урок '+lesson.n+' · '+esc(lesson.name)+'<small>'+label+'</small></summary>'+examples+'</details>';
  }).join('');
  return '<section id="pg433" class="pg433-root pg433-map pgc-catalog">'+
   '<header class="pg433-header"><div class="pg433-topline">'+
     '<div class="pg433-title"><small>PANDA GO · КУРС HSK 2</small><strong>Все уроки</strong></div>'+
     '<span class="pg433-pill">'+coreLessons.length+' уроков <span aria-hidden="true">✦</span> '+coreLessons.filter(lesson=>!lesson.preview).length+' готовых</span>'+
   '</div></header>'+
   '<main class="pg433-content">'+
     '<div class="pgc-hero"><div class="pgc-hero-copy"><span class="pgc-hero-eyebrow">ТВОЙ ПУТЬ К КИТАЙСКОМУ</span>'+
       '<h2>От первых фраз к свободному разговору</h2>'+
       '<p>Изучай темы по порядку и говори с Пандой 🐼</p></div>'+
       '<span class="pgc-hero-panda" aria-hidden="true"></span></div>'+
     '<div class="pgc-section-head"><span class="pgc-section-emoji" aria-hidden="true">📚</span>'+
       '<div><h2>Основные уроки</h2><p>От знакомства до планов на будущее</p></div></div>'+
     '<div class="pgc-feature-list">'+cards+'</div>'+
     '<details class="pgc-grammar" id="grammar"><summary><span aria-hidden="true">📖</span> Грамматика HSK 2</summary>'+
       '<div class="pgc-grammar-lessons">'+grammar+'</div></details>'+
     (topicsMarkup?'<div class="pgc-topic-list">'+topicsMarkup+'</div>':'')+
     '<p class="pgc-endnote">Твой прогресс сохраняется на этом устройстве ✨</p>'+
   '</main>'+
   '<footer class="pg433-footer"><button class="pg433-secondary" data-view="welcome">← На главную</button>'+
     '<button class="pg433-primary" data-start="0">Начать урок 1 →</button></footer>'+
  '</section>';
}
function topicView(state,t){
 const done=(state.completed||[]).filter(v=>Math.floor(v/3)===state.topic).length;
 return '<section id="pg433" class="pg433-root pg433-topic"><header class="pg433-header"><div class="pg433-topline"><div class="pg433-title"><small>HSK 2 · Тема '+(state.topic+1)+'</small><strong>'+esc(t.name)+'</strong></div><span class="pg433-pill">'+done+' из 3 пройдено</span></div></header><main class="pg433-content"><h2>'+esc(t.icon)+' '+esc(t.name)+'</h2><div class="pg433-panel"><div class="pg433-map-zh">'+esc(t.cn)+'</div><p>'+esc(t.goal)+'</p><p>20 слов · три мини-урока · речь · диалоги · тесты</p></div><h2>📖 Три части темы</h2>'+t.scenes.map((sc,i)=>'<button type="button" class="pg433-map-card" data-mini="'+i+'"><span class="pg433-map-no">'+(i+1)+'</span><span><b>'+esc(state.topic===0?['Начало дня','Утро, работа и вечер','Мой вечер и привычки'][i]:sc[0])+'</b><small>'+esc(sc[2])+'</small></span><em>'+(state.completed?.includes(state.topic*3+i)?'✓':'▶')+'</em></button>').join('')+'</main><footer class="pg433-footer"><button class="pg433-secondary" data-view="map">← К карте</button><button class="pg433-primary" data-mini="'+(done<3?done:0)+'">Начать →</button></footer></section>';
}
function installPetals(){
 const art=document.querySelector('.approved-welcome-screen .approved-art');
 if(!art||art.querySelector('.pg433-petals'))return;
 const sky=document.createElement('div');sky.className='pg433-petals';sky.setAttribute('aria-hidden','true');
 for(let i=0;i<9;i++){const petal=document.createElement('span');petal.textContent='';petal.style.setProperty('--x',String(i%2?2+(i*7)%16:83+(i*5)%13)+'%');petal.style.setProperty('--duration',String(10+(i*7)%9)+'s');petal.style.setProperty('--delay',String(-i*2.9)+'s');petal.style.setProperty('--scale',String(0.55+(i%3)*.2));sky.appendChild(petal)}
 art.appendChild(sky);
}
function watchHome(){if(!document.getElementById||typeof MutationObserver==='undefined')return;const root=document.getElementById('screen');if(!root)return;const obs=new MutationObserver(installPetals);obs.observe(root,{childList:true,subtree:true});installPetals()}
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchHome,{once:true});else watchHome();
}
window.PandaGoStoryboardV433={done,mapView,topicView};
window.PandaGoDayFirstUIV1={
 ...previous,
 makeState(mini){const d=previous.makeState(mini);d.pg433Page=0;d.pg433HighestStage=0;d.pg433Preview=false;d.pgApprovedCover=false;return d;},
 render(state,ctx){if(state.topic!==0)return previous.render(state,ctx);
  if(state.day?.pg433Preview)return miniPreview(state);
  if(state.mini===0&&state.day?.pgApprovedCover)return previous.render(state,ctx);
  const page=Number(state.day?.pg433Page)||0;state.stage=STAGE[Math.max(0,Math.min(11,page))];return whole(state,ctx);
 },
 next(state,api){if(state.topic!==0)return previous.next(state,api);
  const d=state.day;
  if(d.pgApprovedCover)return previous.next(state,api);
  const p=d.pg433Page||0;
  if(!testReady(state,p))return;
  if(p>=11){previous.cancel?.();api.complete();return;}
  d.pg433Page=p+1;state.stage=STAGE[d.pg433Page];d.pg433HighestStage=Math.max(d.pg433HighestStage,state.stage);api.render();
 },
 handle(button,state,api){const k=button.dataset,d=state.day;
  if(state.topic!==0||!d)return previous.handle(button,state,api);
  if(k.pg433Back!==undefined){if(d.pg433Page>0){d.pg433Page--;state.stage=STAGE[d.pg433Page];api.render()}else api.go('map');return true}
  if(k.pg433StartMini!==undefined){d.pg433Preview=false;api.render();return true}
  if(k.pg433Prev!==undefined){if(d.pg433Page>0){d.pg433Page--;state.stage=STAGE[d.pg433Page];api.render()}else api.go('map');return true}
  if(k.pg433Next!==undefined){this.next(state,api);return true}
  if(k.pg433Step!==undefined){const n=Number(k.pg433Step);if(n<=d.pg433HighestStage){d.pg433Page=PAGE_START[n];state.stage=n;api.render()}return true}
  // Keep the ORIGINAL real microphone, quiz and matching handlers with original scoring.
  const oldY=(typeof document!=='undefined')?document.querySelector('#pg433-content')?.scrollTop:0;
  return previous.handle(button,state,{...api,render(){api.render();if(typeof document!=='undefined'){const el=document.querySelector('#pg433-content');if(el&&oldY!=null)el.scrollTop=oldY;}}});
 }
};
})();
