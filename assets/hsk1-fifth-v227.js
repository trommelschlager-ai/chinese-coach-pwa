/* Panda Go HSK1 lesson 5 · 14-screen months and dates v227.
 * Reuses existing unchanged voice libraries and HSK1 dates curriculum.
 * Isolated saved state; legacy 7-step records remain untouched.
 */
(()=>{
'use strict';
const topic=(window.PANDA_HSK1_FOUNDATIONS||[]).find(x=>x.id==='dates');
const app=document.getElementById('pg5-stage');
const kicker=document.getElementById('pg5-kicker'),title=document.getElementById('pg5-title'),sub=document.getElementById('pg5-subtitle');
const counter=document.getElementById('pg5-count'),bar=document.getElementById('pg5-fill');
const forward=document.getElementById('pg5-next'),back=document.getElementById('pg5-prev');
const scroll=document.getElementById('pg5-scroll'),notice=document.getElementById('pg5-status');
if(!topic||!app||!forward||!back)return;
const KEY='pg-hsk1-l5-v227',OLD_DONE='pg-hsk1-v3-complete',TOTAL=14;
const titles=[
 ['УРОК 5 · HSK1','Месяцы и даты','Научимся читать китайские месяцы и календарные даты'],
 ['НОВЫЕ СЛОВА','Месяцы 1–4','Январь, февраль, март, апрель'],
 ['НОВЫЕ СЛОВА','Месяцы 5–8','Май, июнь, июль, август'],
 ['НОВЫЕ СЛОВА','Месяцы 9–12','Сентябрь, октябрь, ноябрь, декабрь'],
 ['ОСНОВНЫЕ СЛОВА','Год, месяц и число','Четыре иероглифа, без которых не прочитать дату'],
 ['ПРАВИЛО','Как сказать месяц','Номер месяца + 月 yuè'],
 ['ПРАВИЛО','Как устроена дата','Сначала год, затем месяц и число'],
 ['ПРОИЗНОШЕНИЕ','Слушай и сравнивай','Не перепутай месяцы и даты'],
 ['ДИАЛОГ','Какое сегодня число?','Три короткие реплики в естественном порядке'],
 ['АУДИОПРАКТИКА','Угадай месяц','Послушай запись и выбери правильный месяц'],
 ['КОНСТРУКТОР','Собери месяц','Создай слово из китайских иероглифов'],
 ['ПРОПИСЬ','Напиши 月','Четыре черты и порядок написания'],
 ['ГОВОРИ САМ','Назови дату','Послушай, произнеси и сравни себя с записью'],
 ['ПОВТОРЕНИЕ','Урок 5 · итог','Повтори месяцы и закрепи порядок даты']
];
const months=topic.words.filter(w=>/^(?:一|二|三|四|五|六|七|八|九|十|十一|十二)月$/.test(w[0]));
const monthGroups=[months.slice(0,4),months.slice(4,8),months.slice(8,12)];
const keywords=topic.words.slice(0,4);
const questions=[
 {sound:'四月',correct:'四月',choices:['二月','四月','十月'],hint:'四月 sì yuè — апрель'},
 {sound:'十一月',correct:'十一月',choices:['十二月','十一月','十月'],hint:'十一月 shíyī yuè — ноябрь'},
 {sound:'十二月',correct:'十二月',choices:['二月','十月','十二月'],hint:'十二月 shíèr yuè — декабрь'}
];
const builds=[
 {parts:['十','一','月'],word:'十一月',ru:'ноябрь'},
 {parts:['十','二','月'],word:'十二月',ru:'декабрь'},
 {parts:['三','月'],word:'三月',ru:'март'}
];
const defaultState=()=>({step:0,maxStep:0,heard:{},listen:0,built:0,chosen:[],used:[],quizPassed:false,done:false});
let state=defaultState();
try{
 const raw=JSON.parse(localStorage.getItem(KEY)||'null');
 if(raw&&typeof raw==='object'){
  state.step=Number.isInteger(raw.step)?Math.min(13,Math.max(0,raw.step)):0;
  state.maxStep=Number.isInteger(raw.maxStep)?Math.min(13,Math.max(state.step,raw.maxStep)):state.step;
  state.listen=Number.isInteger(raw.listen)?Math.min(questions.length,Math.max(0,raw.listen)):0;
  state.built=Number.isInteger(raw.built)?Math.min(builds.length,Math.max(0,raw.built)):0;
  state.chosen=Array.isArray(raw.chosen)?raw.chosen.filter(x=>typeof x==='string').slice(0,3):[];
  state.used=Array.isArray(raw.used)?raw.used.filter(Number.isInteger).slice(0,3):[];
  state.heard=raw.heard&&typeof raw.heard==='object'?raw.heard:{};
  state.quizPassed=raw.quizPassed===true;state.done=raw.done===true;
 }
}catch{}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let audio=null,playId=0,writer=null,writerId=0,stream=null,recorder=null,micUrl=null,recordParts=[];
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
function markDone(){
 state.done=true;state.quizPassed=true;save();
 try{
  const old=JSON.parse(localStorage.getItem(OLD_DONE)||'[]');
  const all=Array.isArray(old)?old:[];
  if(!all.includes('dates'))all.push('dates');
  localStorage.setItem(OLD_DONE,JSON.stringify(all));
 }catch{}
}
function say(message,kind=''){notice.textContent=message;notice.className='result '+kind;notice.hidden=!message}
function stopAudio(){
 ++playId;
 if(audio){try{audio.pause();audio.currentTime=0}catch{}audio=null}
 app.querySelectorAll('[aria-busy="true"]').forEach(el=>el.removeAttribute('aria-busy'));
}
function voice(hz,role='female'){
 const maps=window.PANDA_HSK1_VOICES||{};
 const primary=maps[role]?.[hz]||maps.female?.[hz];
 const alternate=(window.courseHumanAudio||{})[hz]||(window.courseNaturalAudio||{})[hz];
 return typeof primary==='string'&&primary?primary:(typeof alternate==='string'&&alternate?alternate:null);
}
function play(hz,role='female'){
 const path=voice(hz,role);if(!path){say('Для этой фразы пока нет проверенной записи.','bad');return}
 stopAudio();const serial=playId;
 try{
  const a=new Audio(path);audio=a;a.preload='auto';
  a.preservesPitch=true;
  a.playbackRate=1;
  const pressed=[...app.querySelectorAll('[data-play]')].find(el=>el.dataset.play===hz);
  pressed?.setAttribute('aria-busy','true');
  a.onended=()=>{if(serial!==playId)return;audio=null;pressed?.removeAttribute('aria-busy')};
  a.onerror=()=>{if(serial!==playId)return;audio=null;pressed?.removeAttribute('aria-busy');say('Ошибка загрузки аудио. Проверь интернет.','bad')};
  Promise.resolve(a.play()).catch(()=>{if(serial===playId){audio=null;pressed?.removeAttribute('aria-busy');say('Нажми «Слушать» ещё раз.','bad')}});
 }catch{say('Не удалось воспроизвести запись.','bad')}
}
function audioButton(hz,role='female'){
 const exists=!!voice(hz,role);
 return '<button type="button" class="audio" data-play="'+esc(hz)+'" data-role="'+role+'"'+(exists?'':' disabled title="Запись пока отсутствует"')+
 ' aria-label="'+(exists?'Послушать ':'Запись недоступна: ')+esc(hz)+'">🔊</button>';
}
function word(w){return '<div class="word"><div><strong lang="zh-Hans">'+esc(w[0])+'</strong><span class="py">'+esc(w[1])+'</span><span class="ru">'+esc(w[2])+'</span></div>'+audioButton(w[0])+'</div>'}
function card(body,extra=''){return '<section class="card '+extra+'">'+body+'</section>'}
function example(hz,py,ru){return '<div class="example"><strong lang="zh-Hans">'+esc(hz)+'</strong><span class="py">'+esc(py)+'</span><span class="ru">'+esc(ru)+'</span><div class="buttons">'+audioButton(hz)+'</div></div>'}
function intro(){return '<div class="intro"><div class="intro-copy"><span class="pg5-kicker">HSK 1 · УРОК 5</span><strong>Открой китайский календарь!</strong><p>Сегодня изучаем месяцы, год и даты.</p></div><div class="intro-art" role="img" aria-label="Панда в фиолетовых наушниках"></div></div>'+
 card('<h2 class="center">Смотри, как просто!</h2><div class="date-grid"><div class="date-chip"><strong>一月</strong><small>январь</small></div><div class="date-chip"><strong>五月</strong><small>май</small></div><div class="date-chip"><strong>十二月</strong><small>декабрь</small></div></div>')+
 card('<p class="center">За урок разберём 12 месяцев, порядок даты, короткий разговор и практику.</p>');}
function groupWords(group){return card('<div class="grid two">'+group.map(word).join('')+'</div>')+
 '<p class="small center">Нажимай 🔊, чтобы услышать китайское произношение.</p>'}
function basicTerms(){return card('<div class="grid two">'+keywords.map(word).join('')+'</div>')+
 card('<div class="rule-card"><b>日 (rì)</b> — день даты, часто в письменном языке.<div><b>号 (hào)</b> — число месяца в повседневной речи.</div></div>');}
function monthRule(){return card('<h2 class="center">Месяц = число + 月</h2><div class="formula"><span class="part">十</span><b>+</b><span class="part">一</span><b>+</b><span class="part">月</span></div>'+
 example('十一月','shíyī yuè','ноябрь')+
 '<p class="center">Достаточно запомнить числа от 1 до 12 и слово 月 (yuè) — «месяц».</p>')+
 card('<p>Например: <b>三月</b> — март; <b>十月</b> — октябрь; <b>十二月</b> — декабрь.</p>');}
function dateRule(){return card('<h2 class="center">年 → 月 → 日 / 号</h2><div class="formula"><span class="part">年</span><b>›</b><span class="part">月</span><b>›</b><span class="part">日</span></div>'+
 example('二零二六年十一月六日','èr líng èr liù nián shíyī yuè liù rì','6 ноября 2026 года')+
 '<div class="rule-card">Год в китайском читают по цифрам. В записи полных дат сначала идёт год, затем месяц и день.</div>');}
function sounds(){return card('<h2>Не спутай похожие слова</h2><div class="grid two">'+
 [['四月','sì yuè','апрель'],['十月','shí yuè','октябрь'],['十一月','shíyī yuè','ноябрь'],['十二月','shíèr yuè','декабрь']].map(word).join('')+'</div>')+
 card('<p>В <b>月 yuè</b> — четвёртый тон. Слушай также <b>十 shí</b> (второй тон) и <b>四 sì</b> (четвёртый тон).</p>');}
function conversation(){return card('<h2>Послушай разговор</h2><div class="dialogue">'+topic.dialogue.map(([who,hz,py,ru])=>
 '<div class="bubble"><strong lang="zh-Hans">'+esc(hz)+'</strong><small>'+esc(py)+'</small><span class="ru">'+esc(ru)+'</span>'+audioButton(hz,who==='А'?'male':'female')+'</div>').join('')+'</div>')+
 card('<p class="center">Попробуй самостоятельно ответить на вопрос: <b>今天几月几号？</b></p>');}
function listening(){
 const i=state.listen,done=i>=questions.length,q=questions[Math.min(i,questions.length-1)];
 return card('<h2>Слушай и выбирай</h2><p class="center small">Вопрос '+Math.min(i+1,questions.length)+' из '+questions.length+'</p>'+
 '<div class="buttons">'+audioButton(q.sound)+'</div><div class="grid three">'+q.choices.map(z=>
 '<button type="button" class="card-choice" data-listen="'+esc(z)+'"'+(done?' disabled':'')+'><strong>'+esc(z)+'</strong></button>').join('')+'</div>'+
 (done?'<p class="result good">✓ Три ответа верны. Нажми «Дальше».</p>':'<p class="small center">Сначала прослушай, затем выбери китайское слово.</p>'));}
function builder(){
 const i=state.built,done=i>=builds.length,b=builds[Math.min(i,builds.length-1)];
 const pool=b.parts.concat(['四']);
 return card('<h2 class="center">Собери '+b.ru+'</h2><p class="small center">Слово '+Math.min(i+1,builds.length)+' из '+builds.length+'</p>'+
 '<div class="assemble">'+b.parts.map((_,j)=>'<div class="unit" style="display:grid;place-items:center">'+esc(state.chosen[j]||'＿')+'</div>').join('')+'</div>'+
 '<div class="assemble">'+pool.map((z,j)=>
 '<button type="button" class="unit" data-tile="'+j+'"'+(done||state.used.includes(j)?' disabled':'')+'>'+z+'</button>').join('')+'</div>'+
 '<div class="buttons"><button class="soft" type="button" data-clear>Сброс</button><button class="soft primary" type="button" data-build-check'+(done?' disabled':'')+'>Проверить</button></div>'+
 (done?'<p class="result good">✓ Все три месяца собраны. Дальше — пропись.</p>':'<p class="small center">Нажимай иероглифы в правильном порядке.</p>'));}
function writing(){return card('<h2 class="center">月 — месяц</h2>'+
 '<div class="write-grid"><div id="writer" aria-label="Анимация черт иероглифа 月"></div></div>'+
 '<div class="buttons"><button class="soft" type="button" data-animate>▶ Показать черты</button>'+
 '<button class="soft primary" type="button" data-trace>✍️ Написать</button></div>'+
 '<p class="small center">Пропись — тренировка по желанию. Всего четыре черты.</p>');}
function speaking(){
 const speech=topic.speech;
 return card('<div class="speech-card"><h2>Повтори дату вслух</h2><strong lang="zh-Hans">'+esc(speech.hz)+'</strong><p>'+esc(speech.py)+'</p><p>'+esc(speech.ru)+'</p>'+
 '<div class="buttons">'+audioButton(speech.hz)+'<button class="soft" data-record-start type="button">🎙 Записать себя</button><button class="soft" type="button" data-record-stop disabled>■ Стоп</button><button class="soft" type="button" data-record-play disabled>▶ Мой голос</button></div>'+
 '<p class="small">Сравни своё произношение с образцом. Автоматической проверки тонов здесь нет.</p></div>')+
 card('<p class="center">Скажи также: <b>今天几月几号？</b> — Какое сегодня число?</p>');}
function summary(){
 const q=topic.quiz;
 return '<div class="intro"><div class="intro-copy"><span class="pg5-kicker">УРОК 5 · HSK 1</span><strong>Отлично! 🌸</strong><p>Ты разобрал месяцы, слова 年、月、日、号 и китайский порядок даты.</p></div><div class="intro-art" role="img" aria-label="Панда в фиолетовых наушниках"></div></div>'+
 card('<h2>Последняя проверка</h2><p>'+esc(q.question)+'</p><div class="grid">'+q.choices.map((c,i)=>
 '<button type="button" class="card-choice '+(state.quizPassed&&i===q.correct?'correct':'')+'" data-final="'+i+'"'+(state.quizPassed?' disabled':'')+'>'+esc(c)+'</button>').join('')+'</div>'+
 (state.quizPassed?'<p class="result good">✓ Верно! Урок 5 завершён.</p>':'<p class="small">Выбери правильный ответ, чтобы завершить урок.</p>'))+
 card('<h2>Повтори четыре важных слова</h2><div class="grid two">'+keywords.map(word).join('')+'</div>')+
 (state.done?'<div class="buttons"><a class="soft primary" style="text-decoration:none;display:grid;place-items:center" href="./hsk1-lesson.html?lesson=6">К уроку 6 →</a></div>':'');
}
const renderers=[intro,()=>groupWords(monthGroups[0]),()=>groupWords(monthGroups[1]),()=>groupWords(monthGroups[2]),basicTerms,monthRule,dateRule,sounds,conversation,listening,builder,writing,speaking,summary];
function stopWriter(){++writerId;try{writer?.cancelQuiz?.();writer?.pauseAnimation?.()}catch{}writer=null}
function prepareWriter(){
 const area=document.getElementById('writer');if(!area)return;
 if(!window.HanziWriter){area.innerHTML='<span style="font-size:85px;color:#6c5192">月</span>';return}
 const id=++writerId;
 try{
  writer=HanziWriter.create('writer','月',{
   width:Math.min(245,area.clientWidth||210),height:Math.min(245,area.clientWidth||210),
   padding:9,showCharacter:false,showOutline:true,strokeColor:'#865cb1',outlineColor:'#e6d5ec',drawingColor:'#bf79b9',
   showHintAfterMisses:3,
   charDataLoader:(char,onComplete,onError)=>fetch('./assets/hanzi-data/'+encodeURIComponent(char)+'.json')
    .then(r=>{if(!r.ok)throw Error('No character data');return r.json()}).then(data=>{if(id===writerId)onComplete(data)})
    .catch(e=>{if(id===writerId)onError(e)})
  });
 }catch{area.innerHTML='<span style="font-size:85px;color:#6c5192">月</span>'}
}
function refresh(){
 stopAudio();stopWriter();const step=state.step;
 state.maxStep=Math.max(state.maxStep,step);
 const [label,name,subtitle]=titles[step];
 kicker.textContent=label;title.textContent=name;sub.textContent=subtitle;
 counter.textContent=(step+1)+' из '+TOTAL;bar.style.width=((step+1)/TOTAL*100)+'%';
 document.title='Урок 5 · '+name+' — Panda Go';
 app.innerHTML=renderers[step]();say('');
 back.disabled=step===0;forward.disabled=(step===9&&state.listen<questions.length)||
  (step===10&&state.built<builds.length)||(step===13&&!state.quizPassed);
 forward.textContent=step===13?'✓ Завершить урок':'Дальше →';
 scroll.scrollTop=0;save();
 if(step===11)prepareWriter();
}
function go(d){
 if(d===1&&forward.disabled)return;
 if(d<0&&state.step===0)return;
 if(d===1&&state.step===13){markDone();location.assign('./hsk1-map.html');return}
 state.step=Math.max(0,Math.min(13,state.step+d));refresh();
}
function clearBuilder(){state.chosen=[];state.used=[];save()}
function setButtons(){
 if(!app)return;
 const stopping=app.querySelector('[data-record-stop]'),starting=app.querySelector('[data-record-start]'),replay=app.querySelector('[data-record-play]');
 if(stopping)stopping.disabled=!recorder||recorder.state!=='recording';
 if(starting)starting.disabled=!!recorder&&recorder.state==='recording';
 if(replay)replay.disabled=!micUrl;
}
async function recordStart(){
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){say('Запись не поддерживается этим браузером.','bad');return}
 try{
  if(recorder&&recorder.state==='recording')return;
  if(micUrl){URL.revokeObjectURL(micUrl);micUrl=null}
  stream=await navigator.mediaDevices.getUserMedia({audio:true});recordParts=[];
  recorder=new MediaRecorder(stream);
  recorder.ondataavailable=e=>{if(e.data?.size)recordParts.push(e.data)};
  recorder.onstop=()=>{
   if(recordParts.length){micUrl=URL.createObjectURL(new Blob(recordParts,{type:recorder.mimeType||'audio/webm'}))}
   stream?.getTracks().forEach(t=>t.stop());stream=null;setButtons();
   say(micUrl?'Запись готова. Нажми «Мой голос».':'Запись не получилась.',micUrl?'good':'bad');
  };
  recorder.start();setButtons();say('Записываю голос…');
 }catch{say('Нет доступа к микрофону. Разреши его в браузере.','bad')}
}
function recordStop(){if(recorder?.state==='recording')recorder.stop()}
app.addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b||b.disabled)return;
 if(b.hasAttribute('data-play')){play(b.dataset.play,b.dataset.role||'female');return}
 if(b.hasAttribute('data-listen')){
  const i=state.listen;if(i>=questions.length)return;
  if(b.dataset.listen===questions[i].correct){state.listen++;save();refresh();say(questions[i].hint,'good')}
  else say('Пока неверно. Послушай запись ещё раз.','bad');return;
 }
 if(b.hasAttribute('data-tile')){
  const i=Number(b.dataset.tile),current=builds[Math.min(state.built,builds.length-1)];
  if(!Number.isInteger(i)||state.used.includes(i)||state.chosen.length>=current.parts.length)return;
  const pool=current.parts.concat(['四']);
  state.used.push(i);state.chosen.push(pool[i]);save();
  const cells=[...app.querySelectorAll('.assemble')][0].querySelectorAll('.unit');
  cells.forEach((cell,j)=>{cell.textContent=state.chosen[j]||'＿'});
  b.disabled=true;return;
 }
 if(b.hasAttribute('data-clear')){clearBuilder();refresh();return}
 if(b.hasAttribute('data-build-check')){
  const current=builds[state.built];if(!current)return;
  if(state.chosen.join('')===current.word){state.built++;clearBuilder();refresh();say('✓ Верно: '+current.word+' — '+current.ru,'good')}
  else {say('Неверный порядок. Сначала число, затем 月.','bad')}
  return;
 }
 if(b.hasAttribute('data-animate')){try{writer?.animateCharacter?.()}catch{say('Анимация недоступна.','bad')}return}
 if(b.hasAttribute('data-trace')){try{writer?.quiz?.({onComplete:()=>say('✓ Ты написал 月!','good')})}catch{say('Пропись недоступна.','bad')}return}
 if(b.hasAttribute('data-record-start')){recordStart();return}
 if(b.hasAttribute('data-record-stop')){recordStop();return}
 if(b.hasAttribute('data-record-play')){if(micUrl){stopAudio();try{audio=new Audio(micUrl);audio.play().catch(()=>say('Не удалось открыть запись.','bad'))}catch{}}return}
 if(b.hasAttribute('data-final')){
  const index=Number(b.dataset.final);
  if(index===topic.quiz.correct){state.quizPassed=true;markDone();refresh();say('✓ Правильно! '+topic.quiz.explain,'good')}
  else say('Неверно. Подумай, что в китайском пишут первым.','bad');return;
 }
});
back.addEventListener('click',()=>go(-1));forward.addEventListener('click',()=>go(1));
window.addEventListener('pagehide',()=>{stopAudio();stopWriter();if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(t=>t.stop());if(micUrl)URL.revokeObjectURL(micUrl)});
refresh();
})();