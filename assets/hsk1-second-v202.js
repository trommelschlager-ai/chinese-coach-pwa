/* Panda Go HSK1 Lesson 2 preview v202.
   Uses the approved Lesson 1 layout, without changing its UI or saved progress.
   All 12 individual vocabulary recordings use the same licensed Yue Tan speaker.
   Full sentences use existing, separately attributed female/male course recordings.
   Preview state is isolated; prior lesson-2 progress is not overwritten.
*/
(()=>{
'use strict';
const app=document.getElementById('app');
if(!app)return;
const area=document.getElementById('pg-content');
const counter=document.getElementById('pg-counter');
const bar=document.getElementById('pg-progress');
const fill=document.getElementById('pg-progress-fill');
const next=document.getElementById('pg-next');
const back=document.getElementById('pg-back');
const note=document.getElementById('pg-announcement');
const STEPS=16, KEY='pg-hsk1-v202-pronouns-preview';
const words=[
 ['我','wǒ','я'],['你','nǐ','ты'],
 ['他','tā','он'],['她','tā','она'],['它','tā','оно'],
 ['我们','wǒmen','мы'],['你们','nǐmen','вы (мн. ч.)'],['他们','tāmen','они'],
 ['是','shì','быть'],['老师','lǎoshī','учитель'],['学生','xuésheng','студент'],['吗','ma','вопрос']
];
const humanWords=new Set(words.map(w=>w[0]));
const listeningWords=['我','你','老师','学生'];
const listeningOrder=[2,0,3,1];
const builds=[
 {target:['我','是','老师'],ru:'Я учитель',py:'Wǒ shì lǎoshī.'},
 {target:['你','是','学生'],ru:'Ты студент',py:'Nǐ shì xuésheng.'}
];
const quiz=[
 {q:'Как написать «она»?',options:['他','它','她'],correct:2,help:'她 — она; 他 — он; 它 — оно.'},
 {q:'Что означает 你们?',options:['ты','вы (несколько человек)','они'],correct:1,help:'Суффикс 们 образует множественное число местоимений.'},
 {q:'Как спросить «Ты учитель»?',options:['吗你是老师？','你是老师吗？','你吗是老师？'],correct:1,help:'Вопросительная частица 吗 ставится в конце предложения.'}
];
const dialogue=[
 ['👨','你是老师吗？','Nǐ shì lǎoshī ma?','Ты учитель?','male'],
 ['👩','不是，我是学生。','Bú shì, wǒ shì xuésheng.','Нет, я студентка.','female'],
 ['👨','我是老师。','Wǒ shì lǎoshī.','Я учитель.','male']
];
const defaults=()=>({step:0,buildPass:[false,false],listenIndex:0,quizIndex:0,spoke:false,selected:[]});
let state=defaults();
try{
 const old=JSON.parse(localStorage.getItem(KEY)||'null');
 if(old&&typeof old==='object'){
  state.step=Number.isInteger(old.step)?Math.max(0,Math.min(STEPS-1,old.step)):0;
  state.buildPass=[!!old.buildPass?.[0],!!old.buildPass?.[1]];
  state.listenIndex=Number.isInteger(old.listenIndex)?Math.max(0,Math.min(4,old.listenIndex)):0;
  state.quizIndex=Number.isInteger(old.quizIndex)?Math.max(0,Math.min(quiz.length,old.quizIndex)):0;
  state.spoke=old.spoke===true;
  state.selected=Array.isArray(old.selected)?old.selected.filter(n=>Number.isInteger(n)&&n>=0&&n<=2).slice(0,3):[];
 }
}catch{}
let audio=null,recording=false,stream=null,recorder=null,recordUrl=null,recordChunks=[];
const esc=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const heading=(eyebrow,title,sub='')=>
 '<p class="screen-eyebrow">'+esc(eyebrow)+'</p><h1 class="screen-title">'+esc(title)+'</h1>'+
 (sub?'<p class="screen-sub">'+esc(sub)+'</p>':'');
const normalized=s=>String(s).replace(/[。！？，?!,\s]/g,'');
const getSound=(text,role='female')=>{
 const key=normalized(text);
 const native=window.PANDA_HSK1_NATIVE_HUMAN_V167||{};
 const map=window.PANDA_HSK1_VOICES||{};
 if(humanWords.has(key)&&native[key])return native[key];
 const selected=map[role]||{};
 return selected[text]||selected[key]||(!humanWords.has(key)?window.courseHumanAudio?.[key]:null)||null;
};
function stopSound(){
 if(audio){try{audio.pause()}catch{}audio.onended=null;audio=null;}
}
function showStatus(message){
 note.textContent=message;
 const el=area.querySelector('.pg2-result');
 if(el)el.textContent=message;
}
function play(text,role='female'){
 stopSound();
 const src=getSound(text,role);
 if(!src){showStatus('Пока нет проверенной записи для этого предложения.');return;}
 try{
  const sound=new Audio(src);audio=sound;
  sound.preload='auto';
  sound.playbackRate=humanWords.has(normalized(text))?1:0.85;
  sound.preservesPitch=true;
  sound.onended=()=>{if(audio===sound)audio=null};
  sound.onerror=()=>{if(audio===sound)showStatus('Не удалось загрузить звук. Проверь соединение.')};
  Promise.resolve(sound.play()).catch(()=>showStatus('Звук не включился. Нажми ещё раз.'));
 }catch{showStatus('Не удалось включить запись.');}
}
function audioButton(text,role='female',small=false){
 const has=!!getSound(text,role);
 return '<button type="button" class="'+(small?'sound-sm':'audio')+'" data-say="'+esc(text)+'" data-role="'+esc(role)+'"'+(has?'':' disabled')+' aria-label="Слушать '+esc(text)+'">'+(small?'▶ Слушать':'▶ Слушать слово')+'</button>';
}
function wordCard(word){
 const [hz,py,ru]=word;
 const has=!!getSound(hz);
 return '<div class="pg2-word"><b lang="zh-Hans">'+esc(hz)+'</b>'+
 '<span class="pg2-py">'+esc(py)+'</span><span class="pg2-ru">'+esc(ru)+'</span>'+
 '<button type="button" data-say="'+esc(hz)+'"'+(has?'':' disabled')+'>▶ Слушать</button></div>';
}
function vocab(group,tip,eyebrow,title){
 return heading(eyebrow,title)+
 '<div class="sheet soft"><span class="sheet-label">ПОСЛУШАЙ И ПОВТОРИ</span>'+
 '<div class="pg2-vocab'+(group.length>=3?' three':'')+'">'+group.map(wordCard).join('')+'</div>'+
 (tip?'<p class="pg2-note">'+esc(tip)+'</p>':'')+'</div>';
}
function rule(title,hz,py,ru,detail){
 return heading('ГРАММАТИКА',title)+
 '<div class="sheet"><span class="sheet-label">ПРИМЕР</span>'+
 '<div class="pg2-focus" lang="zh-Hans">'+esc(hz)+'</div>'+
 '<p class="pinyin">'+esc(py)+'</p><p class="translation">'+esc(ru)+'</p>'+
 audioButton(hz)+
 '<div class="pg2-note">'+esc(detail)+'</div><p class="pg2-result" role="status"></p></div>';
}
function renderDialogue(){
 return heading('РАЗГОВОР', 'Познакомимся','Слушай реплики по очереди.')+
 '<div class="sheet pg2-dialogue"><span class="sheet-label">МИНИ-ДИАЛОГ</span>'+
 dialogue.map(([avatar,hz,py,ru,role])=>
 '<div class="dialogue-line"><span class="pg2-avatar" aria-hidden="true">'+avatar+'</span>'+
 '<div class="bubble"><strong lang="zh-Hans">'+esc(hz)+'</strong><small>'+esc(py)+'</small><small>'+esc(ru)+'</small>'+
 audioButton(hz,role,true)+'</div></div>').join('')+
 '<div class="pg2-note">В диалоге две роли. Для длинных фраз пока используются отдельные учебные голоса, не голос из твоей записи.</div>'+
 '<p class="pg2-result" role="status"></p></div>';
}
function renderBuild(n){
 const obj=builds[n],selected=state.selected,remaining=[0,1,2].filter(i=>!selected.includes(i));
 const pieces=remaining.map(i=>({i,word:obj.target[i]})).reverse();
 return heading('СОБЕРИ ФРАЗУ', 'Поставь слова по порядку')+
 '<div class="sheet"><span class="sheet-label">ПЕРЕВЕДИ НА КИТАЙСКИЙ</span>'+
 '<h2 class="result-title">'+esc(obj.ru)+'</h2><p class="gold-caption">Твой ответ</p>'+
 '<div class="answer-space">'+(selected.length?selected.map((i,k)=>
 '<button class="pg2-token selected" type="button" data-remove="'+k+'">'+esc(obj.target[i])+' ×</button>').join(''):
 '<span class="empty">Нажми на слова снизу</span>')+'</div>'+
 '<div class="pg2-row">'+pieces.map(p=>'<button type="button" class="pg2-token" data-add="'+p.i+'">'+esc(p.word)+'</button>').join('')+'</div>'+
 '<button class="pg2-check" type="button" data-check-build="'+n+'">Проверить ✓</button>'+
 (state.buildPass[n]?'<p class="pg2-result">✓ Правильно! '+esc(obj.py)+'</p>':
 '<p class="pg2-result" role="status"></p>')+'</div>';
}
function renderListening(){
 const n=state.listenIndex;
 if(n>=4)return heading('ПРАКТИКА','Слух проверен')+
 '<div class="sheet"><h2 class="result-title">✅ Все четыре слова узнаны</h2>'+
 '<p class="mini-desc">Второй урок: одна запись носительницы для каждого слова.</p></div>';
 const target=listeningWords[listeningOrder[n]],file=getSound(target);
 return heading('ПРАКТИКА · '+(n+1)+'/4','Проверь слух','Прослушай запись и выбери иероглиф.')+
 '<div class="sheet pg-listening"><span class="sheet-label">СЛУШАЙ И УЗНАВАЙ</span>'+
 '<button type="button" class="audio" data-say="'+esc(target)+'"'+(file?'':' disabled')+'>▶ Слушать</button>'+
 '<div class="pg2-choices">'+listeningWords.map((k,i)=>
 '<button type="button" class="pg2-choice" data-listen-answer="'+i+'"'+(file?'':' disabled')+'>'+esc(k)+'</button>').join('')+'</div>'+
 '<p class="pg2-result" role="status"></p></div>';
}
function renderSpeaking(){
 return heading('ПРОИЗНОШЕНИЕ','Теперь скажи сам','Прослушай фразу и произнеси её своими словами.')+
 '<div class="sheet"><div class="pg2-focus">我是老师。</div>'+
 '<p class="pinyin">Wǒ shì lǎoshī.</p><p class="translation">Я учитель.</p>'+
 audioButton('我是老师。')+
 '<div class="pg2-row">'+
 '<button class="pg2-check" type="button" data-start-record'+(recording?' disabled':'')+'>🎙 Записать себя</button>'+
 '<button class="pg2-token" type="button" data-stop-record'+(recording?'':' disabled')+'>■ Стоп</button>'+
 (recordUrl?'<button class="pg2-token" type="button" data-play-record>▶ Мой голос</button>':'')+
 '</div><p class="mini-desc">Запись остаётся только на твоём устройстве; автоматической оценки тонов пока нет.</p>'+
 '<button type="button" class="pg2-check" data-spoke'+(state.spoke?' disabled':'')+'>'+(state.spoke?'✓ Повторено':'Я повторил фразу ✓')+'</button>'+
 '<p class="pg2-result" role="status"></p></div>';
}
function renderQuiz(){
 if(state.quizIndex>=quiz.length)return heading('ПРОВЕРКА','Всё верно!')+
 '<div class="sheet"><h2 class="result-title">✅ 3 из 3 заданий выполнено</h2>'+
 '<p class="mini-desc">Можно завершить второй урок.</p></div>';
 const q=quiz[state.quizIndex];
 return heading('ПРОВЕРКА · '+(state.quizIndex+1)+'/3','Выбери ответ')+
 '<div class="sheet"><h2 class="result-title">'+esc(q.q)+'</h2>'+
 '<div class="pg2-choices">'+q.options.map((option,i)=>
 '<button type="button" class="pg2-choice" data-quiz-answer="'+i+'">'+esc(option)+'</button>').join('')+
 '</div><p class="pg2-result" role="status"></p></div>';
}
const screens=[
 ()=>heading('УРОК 2 · HSK 1','Личные местоимения','Кто я, кто ты и как задавать простые вопросы.')+
 '<div class="sheet"><span class="sheet-label">НАЧИНАЕМ</span><div class="learning-pairs">'+
 [['我','wǒ','я'],['你','nǐ','ты'],['他','tā','он']].map(w=>
 '<div class="learning-pair"><strong class="pair-word">'+w[0]+'</strong><small>'+w[1]+'</small><small>'+w[2]+'</small></div>').join('')+
 '</div><p class="pg2-note">Сначала узнаем слова, затем научимся говорить: «Я учитель», «Ты студент», «Ты учитель?».</p></div>',
 ()=>vocab(words.slice(0,2),'В 我 (wǒ) и 你 (nǐ) — третий тон.','МЕСТОИМЕНИЯ · 1/4','Я и ты'),
 ()=>vocab(words.slice(2,5),'他, 她 и 它 звучат одинаково: tā, первый тон. На слух их не различают — только по контексту.','МЕСТОИМЕНИЯ · 2/4','Он, она, оно'),
 ()=>vocab(words.slice(5,8),'们 (men) произносится нейтральным тоном. Внимание: 他们 означает группу мужчин или смешанную группу.','МЕСТОИМЕНИЯ · 3/4','Мы, вы, они'),
 ()=>vocab(words.slice(8,11),'学生 читается xuésheng: у sheng обычно нейтральный тон. 老师 читается lǎoshī.','МЕСТОИМЕНИЯ · 4/4','Кто по профессии?'),
 ()=>vocab(words.slice(11,12),'Частица 吗 (ma) делает предложение вопросом и произносится без ударного тона.','НОВОЕ СЛОВО','Вопросительная частица'),
 ()=>rule('Это — 是','我是老师。','Wǒ shì lǎoshī.','Я учитель.','Порядок слов: кто + 是 + существительное. Здесь 是 связывает подлежащее и профессию.'),
 ()=>rule('Отрицание с 不','我不是老师。','Wǒ bú shì lǎoshī.','Я не учитель.','不 ставим перед 是. Перед четвёртым тоном shì слово 不 произносится bú — вторым тоном.'),
 ()=>rule('Вопрос с 吗','你是老师吗？','Nǐ shì lǎoshī ma?','Ты учитель?','Порядок слов не меняется. Добавь 吗 в конец утверждения.'),
 renderDialogue,
 ()=>renderBuild(0),
 ()=>renderBuild(1),
 renderListening,
 renderSpeaking,
 renderQuiz,
 ()=>heading('УРОК 2 ПРОЙДЕН','Отличная работа!','Ты освоил основы личных местоимений.')+
 '<div class="sheet"><span class="sheet-label">ТЕПЕРЬ ТЫ ЗНАЕШЬ</span>'+
 '<div class="learning-pairs">'+[['我','wǒ','я'],['你们','nǐmen','вы'],['吗','ma','вопрос']].map(w=>
 '<div class="learning-pair"><strong class="pair-word">'+w[0]+'</strong><small>'+w[1]+'</small><small>'+w[2]+'</small></div>').join('')+'</div>'+
 '<div class="pg2-soft-example"><strong>你是老师吗？</strong><span>Nǐ shì lǎoshī ma? — Ты учитель?</span></div>'+
 '<div class="pg2-finish"><button type="button" data-restart>↻ Повторить урок</button>'+
 '<a href="./hsk1-map.html">К карте HSK1 →</a></div>'+
 '<p class="pg2-disclaimer">Это предварительная версия урока 2. Ранее сохранённый прогресс основной версии не изменён.</p></div>'
];
function save(){
 try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}
}
function isGated(){
 if(state.step===10)return !state.buildPass[0];
 if(state.step===11)return !state.buildPass[1];
 if(state.step===12)return state.listenIndex<4;
 if(state.step===13)return !state.spoke;
 if(state.step===14)return state.quizIndex<quiz.length;
 return false;
}
function cleanMicrophone(){
 if(recorder?.state==='recording'){try{recorder.onstop=null;recorder.stop()}catch{}}
 if(stream){for(const track of stream.getTracks())track.stop();stream=null}
 recorder=null;recording=false;
}
function render(){
 stopSound();
 if(state.step!==13&&recording)cleanMicrophone();
 counter.textContent=String(state.step+1).padStart(2,'0')+' / '+STEPS;
 bar.setAttribute('aria-valuenow',String(state.step+1));
 fill.style.width=(100*(state.step+1)/STEPS)+'%';
 area.innerHTML=screens[state.step]();
 area.scrollTop=0;
 back.disabled=state.step===0;
 next.hidden=state.step===STEPS-1;
 next.disabled=isGated();
 next.textContent=state.step===STEPS-2?'Завершить урок ✓':'Дальше →';
 save();
}
function goNext(){
 if(isGated())return;
 if(state.step<STEPS-1){state.step++;state.selected=[];render()}
}
back.addEventListener('click',()=>{
 if(state.step>0){state.step--;state.selected=[];render()}
});
next.addEventListener('click',goNext);
area.addEventListener('click',async event=>{
 const button=event.target.closest('button');
 if(!button||button.disabled)return;
 if(button.hasAttribute('data-say')){play(button.dataset.say,button.dataset.role||'female');return}
 if(button.hasAttribute('data-add')){
  const n=Number(button.dataset.add);
  if(Number.isInteger(n)&&n>=0&&n<3&&!state.selected.includes(n)){state.selected.push(n);render()}
  return;
 }
 if(button.hasAttribute('data-remove')){
  state.selected.splice(Number(button.dataset.remove),1);render();return;
 }
 if(button.hasAttribute('data-check-build')){
  const n=Number(button.dataset.checkBuild);
  const correct=state.selected.length===3&&state.selected.every((v,i)=>v===i);
  if(correct){state.buildPass[n]=true;render()}
  else showStatus('Порядок неверный. Начни с подлежащего, затем 是, затем профессия.');
  return;
 }
 if(button.hasAttribute('data-listen-answer')){
  const answer=Number(button.dataset.listenAnswer),correct=listeningOrder[state.listenIndex];
  if(answer===correct){state.listenIndex++;render()}
  else showStatus('Пока неверно. Послушай слово ещё раз.');
  return;
 }
 if(button.hasAttribute('data-quiz-answer')){
  const q=quiz[state.quizIndex];
  if(Number(button.dataset.quizAnswer)===q.correct){state.quizIndex++;render()}
  else showStatus('Пока неверно. '+q.help);
  return;
 }
 if(button.hasAttribute('data-spoke')){
  state.spoke=true;render();return;
 }
 if(button.hasAttribute('data-start-record')){
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){showStatus('Запись не поддерживается. Повтори фразу вслух.');return}
  try{
   cleanMicrophone();
   try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}})}
   catch{stream=await navigator.mediaDevices.getUserMedia({audio:true})}
   const types=['audio/webm;codecs=opus','audio/mp4','audio/webm'];
   const format=types.find(x=>MediaRecorder.isTypeSupported(x));
   recorder=new MediaRecorder(stream,format?{mimeType:format}:undefined);
   recordChunks=[];
   const captureMime=recorder.mimeType||'audio/webm';
   recorder.ondataavailable=e=>{if(e.data.size)recordChunks.push(e.data)};
   recorder.onstop=()=>{
    const chunks=recordChunks.slice();
    if(chunks.length){
     if(recordUrl)URL.revokeObjectURL(recordUrl);
     recordUrl=URL.createObjectURL(new Blob(chunks,{type:captureMime}));
    }
    if(stream){for(const track of stream.getTracks())track.stop();stream=null}
    recording=false;recorder=null;render();
   };
   recorder.start();recording=true;render();
  }catch{cleanMicrophone();showStatus('Разреши доступ к микрофону или повтори вслух.')}
  return;
 }
 if(button.hasAttribute('data-stop-record')){
  if(recorder?.state==='recording'){recorder.stop();recording=false;return}
 }
 if(button.hasAttribute('data-play-record')){
  if(recordUrl){stopSound();try{audio=new Audio(recordUrl);audio.play()}catch{showStatus('Не удалось открыть запись.')}}return;
 }
 if(button.hasAttribute('data-restart')){
  state=defaults();if(recordUrl){URL.revokeObjectURL(recordUrl);recordUrl=null}render();return;
 }
});
window.addEventListener('pagehide',()=>{
 stopSound();cleanMicrophone();
 if(recordUrl)URL.revokeObjectURL(recordUrl);
});
render();
})();