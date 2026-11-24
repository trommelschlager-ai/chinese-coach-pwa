// Panda Street lesson standard: same HSK1 components; independent Street state.
(()=>{
'use strict';
const L1=[
 ['哈喽','Hālou','Привет!','👋','Приветствие, заимствованное из английского. Неофициально; обычно среди знакомых. Первый слог hā; второй в одной распространённой записи нейтральный.'],
 ['嗨','Hāi','Хай!','🙌','Короткое дружеское приветствие.'],
 ['早啊','Zǎo a','Утречко!','🌅','Говорят утром своим; 啊 — безударная разговорная частица.'],
 ['最近怎么样','Zuìjìn zěnmeyàng','Как дела в последнее время?','💬','Часто спрашивают знакомых после перерыва в общении.'],
 ['还行吧','Hái xíng ba','Да нормально вроде.','🙂','Сдержанная реакция: ни отлично, ни ужасно. 吧 делает ответ мягче.'],
 ['挺好的','Tǐng hǎo de','Вполне хорошо!','😎','Тёплый, повседневный ответ. В быстрой речи 挺 перед 好 обычно меняет звучание на второй тон.'],
 ['你呢','Nǐ ne','А ты?','🔁','Короткая фраза, чтобы вернуть вопрос собеседнику.'],
 ['拜拜','Báibái','Пока!','👋','Дружеское прощание, особенно в переписке и разговорах.'],
 ['没事','Méi shì','Ничего страшного / Всё нормально.','👌','Подходит как реакция на беспокойство или извинение, но не всегда на вопрос «Как дела?».']
];
const L2=[
["你叫什么呀？","Nǐ jiào shénme ya?","Как тебя зовут?","呀 смягчает вопрос. Звучит дружелюбно, неофициально."],
["我叫小明，你呢？","Wǒ jiào Xiǎomíng, nǐ ne?","Меня зовут Сяомин. А тебя?","你呢？ — очень короткий способ вернуть вопрос."],
["你哪儿人啊？","Nǐ nǎr rén a?","Ты откуда?","Разговорная северная форма. На юге часто говорят 你哪里人啊？"],
["我从俄罗斯来的。","Wǒ cóng Éluósī lái de.","Я приехал из России.","Это естественно, если говоришь о том, откуда приехал. Для национальности проще: 我是俄罗斯人。"],
["你也学中文啊？","Nǐ yě xué Zhōngwén a?","О, ты тоже учишь китайский?","啊 показывает удивление и делает вопрос живее."],
["对啊，刚学。","Duì a, gāng xué.","Ага, только начал учить.","刚 — только что / недавно; подходит, если обучение началось недавно."],
["我也是！","Wǒ yě shì!","Я тоже!","Короткая реакция на похожий факт о себе."],
["真的假的？","Zhēn de jiǎ de?","Да ладно! Серьёзно?","Выражает удивление. Между друзьями; в формальной беседе не подходит."],
["加个微信？","Jiā ge Wēixìn?","Добавимся в WeChat?","Разговорная просьба обменяться контактами."],
["行啊！","Xíng a!","Конечно! / Давай!","Дружеское согласие. 行 — второй тон: xíng."]
];
const dialogue2=[
[0,"Панда","哈喽！你叫什么呀？","Hālou! Nǐ jiào shénme ya?","Привет! Как тебя зовут?"],
[1,"Анна","我叫安娜，你呢？","Wǒ jiào Ānnà, nǐ ne?","Я Анна, а тебя?"],
[0,"Панда","我叫小明。你哪儿人啊？","Wǒ jiào Xiǎomíng. Nǐ nǎr rén a?","Я Сяомин. Ты откуда?"],
[1,"Анна","我从俄罗斯来的。","Wǒ cóng Éluósī lái de.","Я приехала из России."],
[0,"Панда","你也学中文啊？","Nǐ yě xué Zhōngwén a?","Ты тоже учишь китайский?"],
[1,"Анна","对啊，刚学。","Duì a, gāng xué.","Ага, только начала."],
[0,"Панда","我也是！","Wǒ yě shì!","Я тоже!"],
[1,"Анна","真的假的？","Zhēn de jiǎ de?","Серьёзно?!"],
[0,"Панда","真的！加个微信？","Zhēn de! Jiā ge Wēixìn?","Правда! Добавимся в WeChat?"],
[1,"Анна","行啊！","Xíng a!","Давай!"]
];
const cues={
 '哈喽聊两句':[0.150,1.443],
 '哈喽':[1.613,2.120],
 '嗨':[2.290,2.632],
 '早啊':[2.802,3.248],
 '最近怎么样':[3.418,4.280],
 '还行吧':[4.450,5.117],
 '挺好的':[5.286,5.913],
 '你呢':[6.083,6.605],
 '拜拜':[6.775,7.371],
 '没事':[7.541,8.053],
 '还行吧你呢':[8.223,9.407],
 '改天聊':[9.576,10.313],
 '哈喽最近怎么样':[10.483,11.847],
 '那就好':[12.017,12.653]
};
const lesson=Number(document.body.dataset.streetLesson);
const words=lesson===1?L1.map(([zh,py,ru,icon,note])=>[zh,py,ru,note]):L2;
const dialogue1=[
[0,'Панда','哈喽！最近怎么样？','Hālou! Zuìjìn zěnmeyàng?','Привет! Как дела?'],
[1,'Ты','还行吧，你呢？','Hái xíng ba, nǐ ne?','Да нормально вроде, а ты?'],
[0,'Панда','挺好的！','Tǐng hǎo de!','Вполне хорошо!'],
[1,'Ты','那就好！','Nà jiù hǎo!','Ну и отлично!']
];
const tones=[['shī','1-й тон','ровный','M11 16 H85'],['shí','2-й тон','восходящий','M12 43 L84 12'],['shǐ','3-й тон','вниз и вверх','M11 18 Q43 58 84 17'],['shì','4-й тон','нисходящий','M12 12 L84 44']];
const $=id=>document.getElementById(id), area=$('pg-content'),next=$('pg-next'),prev=$('pg-back');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s).replace(/[，。！？、?!,.\s]/g,'');
const key='panda-street-standard-lesson-'+lesson+'-v1';
let index=0,answers={},order=[],verified=false,recordUrl='',recorder=null,stream=null,recordEpoch=0,voice=null,voiceSeq=0,speed=1;
try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved){index=Number(saved.index)||0;answers=saved.answers||{};order=Array.isArray(saved.order)?saved.order:[];verified=!!saved.verified;}}catch{}
if(new URLSearchParams(location.search).get('welcome')==='1')index=0;
const msg=s=>{const e=$('street-status');if(e)e.textContent=s;$('pg-announcement').textContent=s};
function stopVoice(){voiceSeq++;if(voice){voice.pause();voice=null}}
function stopRecord(){if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(t=>t.stop());stream=null}
function clearRecord(){recordEpoch++;stopRecord();recorder=null;if(recordUrl)URL.revokeObjectURL(recordUrl);recordUrl=''}
const hasAudio=zh=>Object.hasOwn(cues,norm(zh));
const button=(zh,label='Слушать')=>'<button type="button" class="audio" data-pg-control="audio" data-say="'+esc(zh)+'" '+(hasAudio(zh)?'':'disabled')+'>'+ (hasAudio(zh)?'▶ '+esc(label):'Запись пока не готова')+'</button>';
const status=()=>'<p id="street-status" class="audio-error" role="status"></p>';
const title=(k,t,s='')=>'<p class="screen-eyebrow">'+esc(k)+'</p><h1 class="screen-title">'+esc(t)+'</h1>'+(s?'<p class="screen-sub">'+esc(s)+'</p>':'');
const phrase=(w,label='ЖИВОЕ ВЫРАЖЕНИЕ')=>'<div class="sheet soft"><span class="sheet-label">'+label+'</span><strong class="big-hanzi pg-v415-phrase" lang="zh-Hans">'+esc(w[0])+'</strong><p class="pinyin">'+esc(w[1])+'</p><p class="translation">'+esc(w[2])+'</p>'+button(w[0])+status()+(w[3]?'<p class="pg-v414-word-foot">'+esc(w[3])+'</p>':'')+'</div>';
const card=(w,i)=>title('Разговорные выражения · '+(i+1)+'/'+words.length,'Фраза: '+w[0],'Слушай и повторяй в своём темпе.')+phrase(w);
const speedControl=()=>'<div class="street-standard-speed"><label for="street-speed">Скорость речи</label><select id="street-speed"><option value="0.85" '+(speed===.85?'selected':'')+'>0.85×</option><option value="1" '+(speed===1?'selected':'')+'>1.00×</option><option value="1.15" '+(speed===1.15?'selected':'')+'>1.15×</option></select></div>';
const toneScreen=()=>title('Звуки и тоны','Четыре тона','Один слог — разные значения.')+'<div class="sheet pg-v415-tones"><div class="tone-list">'+tones.map(t=>'<div class="tone-item"><div class="tone-choice"><b>'+t[0]+'</b><svg class="tone-curve" viewBox="0 0 96 58" role="img" aria-label="'+t[1]+'"><path d="'+t[3]+'"/></svg><span>'+t[1]+'<small>'+t[2]+'</small></span></div><button type="button" class="tone-play" disabled>Нет записи</button></div>').join('')+'</div><p class="pg-v415-smallnote">Отдельные утверждённые записи четырёх тонов ещё нужны. В третьем тоне в связной речи полный подъём не всегда произносится.</p></div>';
const grammar=()=>title('Грамматика','Разговорные частицы')+ '<div class="sheet">'+(lesson===1?'<p class="translation">吧 · ba — смягчает ответ</p><div class="note">还行吧 — нормально вроде.</div><p class="translation">呢 · ne — возвращает вопрос</p><div class="note">你呢？ — а ты?</div>'+button('还行吧，你呢？'):'<p class="translation">呀 · ya — смягчает вопрос</p><div class="note">你叫什么呀？</div><p class="translation">呢 · ne — а ты?</p><div class="note">你呢？</div><p class="translation">啊 · a — добавляет эмоцию</p><div class="note">你也学中文啊？</div>')+status()+'</div>';
const talk=(items,part='')=>title('Диалог'+part,'Как говорят знакомые','Прочитай и повтори каждую реплику.')+speedControl()+'<div class="sheet pg-v414-dialogue">'+items.map(([role,who,zh,py,ru])=>'<div class="pg-v414-line street-standard-line"><span class="street-standard-avatar">'+(role?'你':'熊猫')+'</span><div class="pg-v414-bubble"><small>'+esc(who)+'</small><strong lang="zh-Hans">'+esc(zh)+'</strong><div class="pg-v414-py">'+esc(py)+'</div><div class="pg-v414-meaning">'+esc(ru)+'</div>'+button(zh)+'</div></div>').join('')+status()+'</div>';
const questions=lesson===1?[[3,['Пока!','Как дела в последнее время?','Спасибо!'],1],[4,['Да нормально вроде.','Я занят.','Доброе утро!'],0],[8,['Ничего страшного.','Меня зовут…','Привет!'],0]]:[[0,['Ты откуда?','Как тебя зовут?','Ты тоже учишь китайский?'],1],[5,['Ага, только начал.','Я приехал из России.','Пока!'],0],[8,['Пойдём в кафе?','Как тебя зовут?','Добавимся в WeChat?'],2]];
const quiz=()=>title('Практика · 1/3','Проверь себя','Выбери правильный перевод.')+questions.map(([w,opts,correct],i)=>'<div class="sheet"><p class="translation">'+esc(words[w][0])+'</p><p class="pinyin">'+esc(words[w][1])+'</p><div class="street-standard-choices">'+opts.map((o,j)=>'<button class="secondary" data-answer="'+i+':'+j+'" aria-pressed="'+(answers[i]===j)+'" '+(answers[i]===correct?'disabled':'')+'>'+esc(o)+'</button>').join('')+'</div><p class="mini-desc" role="status">'+(answers[i]===undefined?'Выбери ответ':answers[i]===correct?'✓ Верно!':'Попробуй ещё раз.')+'</p></div>').join('');
const buildWords=lesson===1?['吧','还','行']:['中文','你','啊？','也','学'];
const target=lesson===1?'还行吧':'你也学中文啊？';
const build=()=>title('Практика · 2/3','Собери предложение')+'<div class="sheet"><p class="translation">'+(lesson===1?'Да нормально вроде.':'Ты тоже учишь китайский?')+'</p><div class="gold-caption">Твой ответ</div><div class="answer-space">'+(order.length?order.map((j,i)=>'<button class="sentence-word filled" data-remove="'+i+'">'+esc(buildWords[j])+'</button>').join(''):'<span class="empty">Выбери слова снизу по порядку</span>')+'</div><div class="sentence-row">'+buildWords.map((w,i)=>'<button class="sentence-word" data-add="'+i+'" '+(order.includes(i)?'disabled':'')+'>'+esc(w)+'</button>').join('')+'</div><button id="verify" class="validate" data-pg-control="primary">Проверить</button><p id="street-status" class="mini-desc" role="status">'+(verified?'✓ Верно!':'')+'</p></div>';
const sample=lesson===1?['哈喽！最近怎么样？','Hālou! Zuìjìn zěnmeyàng?','Привет! Как дела?']:L2[0];
const record=()=>title('Практика · 3/3','Скажи сам','Запиши себя и сравни с образцом, когда он доступен.')+phrase(sample)+'<div class="sheet"><div class="recorder pg-v416-hello-recorder"><button id="record-start">🎙 Записать себя</button><button id="record-stop" hidden>■ Стоп</button><button id="record-listen" hidden>▶ Мой голос</button></div><p id="record-status" class="pg-v416-record-status" role="status">Тоны автоматически не оцениваются.</p></div>';
const finish=()=>title('Итог','Урок завершён')+'<div class="sheet pg-v415-finish"><div class="pg-v415-success">✓</div><p class="result-title">Изучено '+words.length+' выражений</p><p class="translation">Тест: '+questions.filter((q,i)=>answers[i]===q[2]).length+' из '+questions.length+'</p><p class="mini-desc">'+(verified?'Предложение собрано верно.':'Предложение можно повторить.')+'</p><p class="note">Это тестовая версия: пока не все утверждённые записи готовы.</p><div class="pg-lesson-complete-actions"><button class="pg-end-repeat" id="repeat-course">↻ Повторить урок</button>'+(lesson===1?'<a class="pg-end-next" href="./panda-street-slang-lesson2-preview.html?welcome=1">Урок 2 →</a>':'')+'<a class="pg-end-next" href="./panda-street-ai-preview.html">Поговорить с Panda Street AI</a><a href="./panda-street-hsk1-map.html">К карте уроков</a></div></div>';
const views=words.map((w,i)=>()=>card(w,i));
if(lesson===1){views.splice(4,0,toneScreen);views.push(grammar,()=>talk(dialogue1),quiz,build,record,finish)}
else views.push(grammar,()=>talk(dialogue2.slice(0,5),' · 1/2'),()=>talk(dialogue2.slice(5),' · 2/2'),quiz,build,record,finish);
index=Math.max(0,Math.min(views.length-1,index));
function save(){try{localStorage.setItem(key,JSON.stringify({index,answers,order,verified}))}catch{}}
function render(){stopVoice();clearRecord();area.innerHTML=views[index]();area.scrollTop=0;$('pg-counter').textContent=String(index+1).padStart(2,'0')+' / '+String(views.length).padStart(2,'0');$('pg-progress').setAttribute('aria-valuemax',views.length);$('pg-progress').setAttribute('aria-valuenow',index+1);$('pg-progress-fill').style.width=100*(index+1)/views.length+'%';prev.disabled=index===0;next.hidden=index===views.length-1;next.textContent=index===views.length-2?'Завершить урок ✓':'Дальше →';next.disabled=(views[index]===quiz&&questions.some((q,i)=>answers[i]!==q[2]))||(views[index]===build&&!verified);save()}
function play(zh){stopVoice();const cue=cues[norm(zh)];if(!cue){msg('Для этой фразы нужна утверждённая запись.');return}const token=voiceSeq;const a=new Audio('./assets/panda-street-lesson1-luvvoice.m4a');voice=a;a.playbackRate=speed;a.preload='auto';a.preservesPitch=true;a.addEventListener('error',()=>{if(token===voiceSeq)msg('Аудиофайл не загрузился.')},{once:true});const start=()=>{if(token!==voiceSeq)return;try{a.currentTime=cue[0];a.volume=0;const watch=()=>{if(token!==voiceSeq||a.paused)return;const left=cue[1]-a.currentTime;if(left<=.05){a.pause();return}a.volume=Math.min(1,Math.max(0,(a.currentTime-cue[0])/.035),Math.max(0,(left-.05)/.125));requestAnimationFrame(watch)};a.play().then(()=>requestAnimationFrame(watch)).catch(()=>msg('Не удалось воспроизвести запись.'))}catch{msg('Не удалось воспроизвести запись.')}};if(a.readyState>=1)start();else a.addEventListener('loadedmetadata',start,{once:true});}
next.onclick=()=>{if(!next.disabled&&index<views.length-1){index++;render()}};prev.onclick=()=>{if(index>0){index--;render()}};
area.addEventListener('change',e=>{if(e.target.id==='street-speed'){speed=Number(e.target.value);if(voice)voice.playbackRate=speed}});
area.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.say){play(b.dataset.say);return}if(b.dataset.answer){const [i,j]=b.dataset.answer.split(':').map(Number);answers[i]=j;render();return}if(b.dataset.add!==undefined){const i=Number(b.dataset.add);if(!order.includes(i))order.push(i);verified=false;render();return}if(b.dataset.remove!==undefined){order.splice(Number(b.dataset.remove),1);verified=false;render();return}if(b.id==='verify'){verified=order.map(i=>buildWords[i]).join('')===target;render();msg(verified?'✓ Правильно!':'Попробуй ещё раз.');return}if(b.id==='repeat-course'){index=0;answers={};order=[];verified=false;render();return}if(b.id==='record-start'){stopVoice();b.disabled=true;const epoch=++recordEpoch;try{const input=await navigator.mediaDevices.getUserMedia({audio:true});if(epoch!==recordEpoch){input.getTracks().forEach(t=>t.stop());return}stream=input;recorder=new MediaRecorder(stream);const chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=()=>{if(epoch!==recordEpoch)return;if(recordUrl)URL.revokeObjectURL(recordUrl);recordUrl=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));$('record-listen').hidden=false;$('record-status').textContent='Запись готова.'};recorder.start();b.hidden=true;$('record-stop').hidden=false;$('record-status').textContent='Идёт запись…'}catch{stream?.getTracks().forEach(t=>t.stop());stream=null;const s=$('record-status');if(s)s.textContent='Микрофон недоступен. Проверь разрешения браузера.'}finally{b.disabled=false}return}if(b.id==='record-stop'){stopRecord();b.hidden=true;$('record-start').hidden=false;return}if(b.id==='record-listen'&&recordUrl){stopVoice();voice=new Audio(recordUrl);voice.play().catch(()=>msg('Не удалось воспроизвести твою запись.'))}});
window.addEventListener('pagehide',()=>{stopVoice();clearRecord()});document.addEventListener('visibilitychange',()=>{if(document.hidden){stopVoice();stopRecord()}});
render();
})();