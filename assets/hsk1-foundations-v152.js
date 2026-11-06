/* Panda Go HSK 1 — seven lessons, seven logical steps, stable IDs; old lesson records remain untouched. */
(()=>{
'use strict';
const topics=window.PANDA_HSK1_FOUNDATIONS||[];
const requested=Number(new URLSearchParams(location.search).get('lesson'))||1;
const lessonNumber=Number.isInteger(requested)&&requested>=1&&requested<=topics.length?requested:1;
const topic=topics[lessonNumber-1];
if(!topic){document.getElementById('stage-content').textContent='Материал пока недоступен.';return;}
const key='pg-hsk1-v3-'+topic.id,completeKey='pg-hsk1-v3-complete';
const $=id=>document.getElementById(id),esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state={step:0,maxStep:0,buildPassed:false,quizPassed:false,spoken:false,completed:false,toneEarProgress:0,earProgress:0,buildProgress:0};
try{
 const raw=JSON.parse(localStorage.getItem(key)||'{}');
 if(raw&&typeof raw==='object'){
   state.step=Math.max(0,Math.min(6,Number(raw.step)||0));
   state.maxStep=Math.max(state.step,Math.min(6,Number(raw.maxStep)||0));
   // The previous one-question builder remains credited as task 1, not as all three new tasks.
   state.buildProgress=Math.min(3,Math.max(0,Number.isInteger(raw.buildProgress)?raw.buildProgress:(raw.buildPassed?1:0)));
   state.buildPassed=state.buildProgress===3;
   state.earProgress=Math.min(4,Math.max(0,Number(raw.earProgress)||0));
   state.quizPassed=raw.quizPassed===true;
   state.spoken=raw.spoken===true;
   state.toneEarProgress=Math.max(0,Math.min(4,Number(raw.toneEarProgress)||0));
   state.completed=raw.completed===true;
 }
}catch{}
let assembled=[],currentAudio=null,playId=0,answerChosen=-1;
let mediaRecorder=null,micStream=null,micObjectUrl=null,micRecording=false;
const exerciseOrder=[2,0,3,1];
const builds=topic.builds||[topic.build];
const stepTitles=[
 ['Новые слова','▤'],['Тоны и произношение','◉'],['Примеры','▱'],
 ['Диалог','●'],['Собери предложение','✥'],['Говори сам','🎙'],['Итог и повторение','↻']
];
const norm=s=>String(s).replace(/[。？！!?.,，\s]/g,'');
const maps=[
 window.courseGuidedAudio||{},window.courseHumanAudio||{},
 window.basicWordAudio||{},window.basicPinyinAudio||{}
];
const resolved={};
for(const map of maps){for(const [k,v] of Object.entries(map)){const key=norm(k);if(key&&!resolved[key]&&typeof v==='string'&&v.endsWith('.mp3'))resolved[key]=v;}}
const clipFor=hz=>resolved[norm(hz)]||null;
function save(){
 try{localStorage.setItem(key,JSON.stringify(state));if(state.completed){
   let all=[];try{all=JSON.parse(localStorage.getItem(completeKey)||'[]')}catch{}
   if(!Array.isArray(all))all=[];
   if(!all.includes(topic.id))all.push(topic.id);
   localStorage.setItem(completeKey,JSON.stringify(all));
 }}catch{feedback('Прогресс не удалось сохранить на устройстве. Проверь свободное место.')}
}
function feedback(message){$('lesson-feedback').textContent=message}
function stopAudio(){playId++;if(currentAudio){currentAudio.onended=null;currentAudio.onerror=null;currentAudio.pause();currentAudio=null;}document.querySelectorAll('[data-playing]').forEach(n=>n.removeAttribute('data-playing'));}
function playOne(file,row){
 if(!file){feedback('Для этого элемента пока нет готовой записи.');return;}
 stopAudio();const token=playId;
 try{const audio=new Audio(file);currentAudio=audio;
  audio.onplaying=()=>{if(token===playId&&row)row.setAttribute('data-playing','true')};
  audio.onended=()=>{if(token===playId){currentAudio=null;if(row)row.removeAttribute('data-playing')}};
  audio.onerror=()=>{if(token===playId)feedback('Аудиофайл не загрузился.')};
  Promise.resolve(audio.play()).catch(()=>{if(token===playId)feedback('Звук не включился. Нажми ещё раз.')});
 }catch{feedback('Не удалось запустить аудио.');}
}
function playDialogue(){
 const clips=topic.dialogue.map(x=>clipFor(x[1]));
 if(clips.some(x=>!x)){feedback('Не все реплики пока записаны одним голосом. Можно читать диалог и слушать доступные реплики отдельно.');return;}
 stopAudio();const token=playId;let index=0;
 const next=()=>{if(token!==playId||index>=clips.length)return;
  document.querySelectorAll('[data-playing]').forEach(n=>n.removeAttribute('data-playing'));
  const current=index++;const row=document.querySelector('[data-dialog-row="'+current+'"]');
  const audio=new Audio(clips[current]);currentAudio=audio;
  audio.onplaying=()=>{if(token===playId)row?.setAttribute('data-playing','true')};
  audio.onended=next;audio.onerror=()=>{if(token===playId)feedback('Ошибка загрузки реплики.')};
  Promise.resolve(audio.play()).catch(()=>{if(token===playId)feedback('Звук не включился.')});
 };
 next();
}
function audioButton(hz,role){
 const file=clipFor(hz);
 return '<div class="lesson-audio-label"><button type="button" class="lesson-audio" data-play="'+esc(hz)+'"'+(file?'':' disabled title="Запись готовится"')+' aria-label="'+(file?'Прослушать ':'Записи пока нет: ')+esc(hz)+'">'+(file?'🔊':'—')+'</button>'+(file?'':'<small class="lesson-audio-caption">Нет записи</small>')+'</div>';
}
function hanzi(hz,py,ru){
 return '<strong class="lesson-hanzi" lang="zh-Hans">'+esc(hz)+'</strong><span class="lesson-py">'+esc(py)+'</span><span class="lesson-ru">'+esc(ru)+'</span>';
}
function renderWords(){
 return '<p class="lesson-intro">'+esc(topic.goal)+'</p>'+
 topic.words.map(([hz,py,ru])=>'<article class="lesson-card lesson-word"><div>'+hanzi(hz,py,ru)+'</div>'+audioButton(hz)+'</article>').join('')+
 '<div class="lesson-note">Повторяй вслух и обращай внимание на знаки тонов в пиньине. Ключевые слова мы ещё встретим в примерах.</div>';
}
function renderListeningEar(){
 if(topic.id==='foundations')return '';
 const list=topic.listen?.items||[],i=state.earProgress;
 if(!list.length)return '';
 if(i>=list.length)return '<div class="lesson-note">✅ Ты правильно различил все '+list.length+' записи на слух.</div>';
 const index=exerciseOrder[i%exerciseOrder.length],item=list[index];
 const file=(window.courseHumanAudio||{})[item[0]];
 return '<article class="lesson-card lesson-listening"><h2>Слушай и выбирай · '+(i+1)+' из '+list.length+'</h2>'+
 '<p>'+esc(topic.listen.tip)+'</p>'+
 '<button type="button" class="lesson-action" data-listen-prompt'+(file?'':' disabled')+'>'+ (file?'▶ Слушать запись':'Запись недоступна')+'</button>'+
 '<div class="lesson-tone-answer">'+list.map(([hz,label],j)=>'<button type="button" data-listen-answer="'+j+'"'+(file?'':' disabled')+'>'+esc(label)+'</button>').join('')+'</div>'+
 '<p class="lesson-small">Все четыре записи этого задания принадлежат одному диктору. Ответ не зависит от написания.</p></article>';
}
const toneOrder=['马','妈','骂','麻'];
function renderToneEar(){
 const i=state.toneEarProgress;
 if(i>=4)return '<div class="lesson-note">✅ Ты различил все четыре тона на слух. Можно переходить дальше.</div>';
 return '<div class="lesson-card"><h2>Проверь слух · '+(i+1)+' из 4</h2>'+
   '<p>Прослушай запись, затем выбери номер тона. Иероглиф и пиньинь намеренно скрыты.</p>'+
   '<button type="button" class="lesson-action" data-tone-hear>▶ Прослушать тон</button>'+
   '<div class="lesson-tone-answer">'+[1,2,3,4].map(n=>'<button type="button" data-tone-choice="'+n+'">'+n+'-й тон</button>').join('')+'</div>'+
   '<p class="lesson-small">После правильного ответа прозвучит следующий образец. Все записи — один диктор.</p></div>';
}
function renderPronunciation(){
 let extra='';
 if(topic.id==='foundations')extra=
 '<div class="lesson-tone-grid" aria-label="Четыре тона китайского языка">'+
 [['mā','1-й · высокий ровный'],['má','2-й · восходящий'],['mǎ','3-й · низкий'],['mà','4-й · нисходящий']].map(x=>'<div class="lesson-tone"><b>'+x[0]+'</b><small>'+x[1]+'</small></div>').join('')+'</div>'+
 '<div class="lesson-sound-demo"><strong>Послушай все четыре тона</strong><button type="button" data-tones-demo>▶ Аудио</button></div>'+
 '<p class="lesson-note">Пятый вариант — нейтральный тон, без знака: ma. Он короткий и зависит от соседних слогов.</p>'+
 '<div class="lesson-character-grid" aria-label="Примеры согласных и звукосочетаний"><span>zh</span><span>ch</span><span>sh</span><span>j</span><span>q</span><span>x</span><span>z</span><span>c</span><span>s</span><span>ü</span></div>'+renderToneEar();
 else extra='<div class="lesson-note">Отработай чтение каждого слова: иероглиф → пиньинь → тон → значение. После прослушивания произнеси фразу ещё раз.</div>'+renderListeningEar();
 return extra+topic.pronunciation.map((p,i)=>'<article class="lesson-card"><span class="lesson-rule-head">'+(i+1)+'.</span><p>'+esc(p)+'</p></article>').join('')+
 '<p class="lesson-fineprint">Аудио воспроизводится только для записей, которые уже есть в приложении. Непроверенные голоса автоматически не подставляются.</p>';
}
function renderRules(){
 const radicals=topic.id==='foundations'
 ?'<div class="lesson-character-grid" aria-label="Элементы иероглифов"><span>人</span><span>口</span><span>女</span><span>木</span><span>日</span></div><p class="lesson-note">Некоторые ключи используются как смысловые компоненты, а другие элементы подсказывают чтение. Не каждый знак произошёл от рисунка.</p>':'';
 return radicals+topic.rules.map(([head,desc,hz,py,ru])=>'<article class="lesson-card"><h2>'+esc(head)+'</h2><p>'+esc(desc)+'</p><div>'+hanzi(hz,py,ru)+'</div><div style="margin-top:10px">'+audioButton(hz)+'</div></article>').join('');
}
function renderDialogue(){
 const allRecorded=topic.dialogue.every(d=>clipFor(d[1]));
 let out='<div class="lesson-dialogue-hero"><img src="./assets/panda-v130/dialogue-scene.webp" alt="Мужчина и женщина разговаривают на улице китайского города">'+
 '<button type="button" class="hero-play" data-dialog-all aria-label="Прослушать весь диалог"'+(allRecorded?'':' disabled title="Полная запись готовится"')+'>▶</button></div>'+
 '<p class="lesson-note">'+(allRecorded?'Нажми ▶, чтобы прослушать весь разговор.':'Весь диалог показан ниже. Для некоторых реплик ещё не готовы точные аудиозаписи.')+'</p><div class="lesson-chat">';
 topic.dialogue.forEach(([who,hz,py,ru],i)=>{
  out+='<div class="lesson-line '+(who==='Б'?'speaker-b':'speaker-a')+'" data-dialog-row="'+i+'">'+
  '<img class="lesson-portrait" src="./assets/approved-'+(who==='Б'?'woman':'man')+'-v112.webp" alt="" aria-hidden="true">'+
  '<div>'+hanzi(hz,py,ru)+'</div>'+audioButton(hz)+'</div>';
 });
 return out+'</div>';
}
function currentBuild(){return builds[Math.min(state.buildProgress,builds.length-1)]}
function buildTokens(){
 const target=currentBuild().target;
 const unused=target.map((t,i)=>({t,i})).filter(o=>!assembled.includes(o.i)).reverse();
 return '<div class="lesson-selected" aria-label="Твой ответ">'+(assembled.length?assembled.map(i=>'<button class="lesson-token" type="button" data-remove="'+i+'" lang="zh-Hans">'+esc(target[i])+' ×</button>').join(''):'<span class="lesson-small">Нажимай слова снизу по порядку</span>')+'</div>'+
 '<div class="lesson-tokens" aria-label="Слова для составления">'+unused.map(o=>'<button class="lesson-token" type="button" data-add="'+o.i+'" lang="zh-Hans">'+esc(o.t)+'</button>').join('')+'</div>';
}
function renderCompose(){
 if(state.buildPassed)return '<article class="lesson-compose"><h2>✅ Все три упражнения выполнены</h2>'+
  builds.map((b,i)=>'<p class="lesson-note">'+(i+1)+'. '+esc(b.target.join(''))+' — '+esc(b.py)+'</p>').join('')+
  '<p>Теперь можно переходить к самостоятельной речи.</p></article>';
 const b=currentBuild();
 return '<article class="lesson-compose"><div class="lesson-exercise-indicator">Задание '+(state.buildProgress+1)+' из '+builds.length+'</div>'+
 '<h2>'+esc(b.prompt)+'</h2><div id="lesson-build-area">'+buildTokens()+'</div>'+
 '<p class="lesson-small">Нажимай слова по порядку. Чтобы убрать слово, нажми его в верхней строке.</p>'+
 '<button type="button" id="lesson-verify-build" class="lesson-action" data-verify-build>Проверить</button></article>';
}
function renderSpeak(){
 const micCapable=!!(navigator.mediaDevices?.getUserMedia&&window.MediaRecorder);
 return '<article class="lesson-card"><p>Произнеси всю фразу вслух, уделяя внимание каждому тону.</p>'+hanzi(topic.speech.hz,topic.speech.py,topic.speech.ru)+
 '<div style="margin-top:15px">'+audioButton(topic.speech.hz)+'</div>'+
 '<p class="lesson-note">'+esc(topic.speech.tip)+'</p>'+
 (micCapable?
   '<div id="lesson-microphone" class="lesson-recorder"><button class="lesson-action" type="button" data-record-start>🎙 Записать свой голос</button>'+
   '<button type="button" class="lesson-action" data-record-stop hidden>■ Остановить запись</button>'+
   '<button type="button" class="lesson-action" data-record-play hidden>▶ Прослушать себя</button>'+
   '<p class="lesson-fineprint">Запись остаётся на устройстве и не отправляется на сервер. После ухода с этой страницы запись удалится из памяти.</p></div>':
   '<p class="lesson-fineprint">Запись микрофона недоступна в этом браузере. Можно проговорить фразу вслух.</p>')+
 '<p class="lesson-fineprint">Проверь звучание самостоятельно: автоматической оценки тонов здесь пока нет.</p>'+
 '<button type="button" class="lesson-action" data-spoken>'+ (state.spoken?'✓ Я повторил и сверил':'Я повторил и сверил произношение')+'</button></article>';
}
function refreshMic(){
 const root=$('lesson-microphone');if(!root)return;
 const start=root.querySelector('[data-record-start]'),stop=root.querySelector('[data-record-stop]'),play=root.querySelector('[data-record-play]');
 if(start)start.hidden=micRecording;
 if(stop)stop.hidden=!micRecording;
 if(play)play.hidden=micRecording||!micObjectUrl;
}
function releaseMic(){
 if(mediaRecorder&&mediaRecorder.state!=='inactive'){mediaRecorder.onstop=null;try{mediaRecorder.stop()}catch{}}
 mediaRecorder=null;micRecording=false;
 if(micStream){micStream.getTracks().forEach(track=>track.stop());micStream=null}
 if(micObjectUrl&&window.URL?.revokeObjectURL){URL.revokeObjectURL(micObjectUrl);micObjectUrl=null}
}
async function startMic(){
 if(state.step!==5||!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)return;
 releaseMic();
 try{
  const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
  if(state.step!==5){stream.getTracks().forEach(track=>track.stop());return}
  micStream=stream;
  const opts=MediaRecorder.isTypeSupported?.('audio/webm;codecs=opus')?{mimeType:'audio/webm;codecs=opus'}:{};
  const recorder=new MediaRecorder(stream,opts),parts=[];mediaRecorder=recorder;
  recorder.ondataavailable=e=>{if(e.data.size>0)parts.push(e.data)};
  recorder.onstop=()=>{
   const blob=new Blob(parts,{type:recorder.mimeType||'audio/webm'});
   if(micStream){micStream.getTracks().forEach(track=>track.stop());micStream=null}
   micRecording=false;
   if(blob.size&&window.URL?.createObjectURL){micObjectUrl=URL.createObjectURL(blob);feedback('Запись готова. Послушай себя и сравни с образцом.')}
   else feedback('Запись получилась пустой. Попробуй ещё раз.');
   refreshMic();
  };
  recorder.onerror=()=>{micRecording=false;feedback('Ошибка записи. Попробуй ещё раз.');refreshMic()};
  recorder.start();micRecording=true;refreshMic();feedback('Идёт запись. Произнеси фразу и нажми «Остановить».');
 }catch{feedback('Нет доступа к микрофону. Разреши его в настройках браузера или повтори фразу вслух.')}
}
function stopMic(){
 if(mediaRecorder?.state==='recording')mediaRecorder.stop();
}
function renderReview(){
 const q=topic.quiz;
 return '<article class="lesson-card"><h2>Повтори главное</h2><p>'+esc(topic.review)+'</p></article>'+
 '<div class="lesson-quiz"><h2>Контрольный вопрос</h2><p class="lesson-question">'+esc(q.question)+'</p>'+
 '<div class="lesson-choices">'+q.choices.map((c,i)=>
  '<button type="button" data-answer="'+i+'" class="lesson-choice '+(answerChosen===i?(i===q.correct?'is-correct':'is-wrong'):'')+'">'+esc(c)+'</button>').join('')+'</div>'+
 (state.quizPassed?'<p class="lesson-note">✓ Правильно! '+esc(q.explain)+'</p>':'')+'</div>'+
 (state.completed?'<p class="lesson-note">✅ Урок завершён и сохранён. Его можно повторить в любое время.</p>':'');
}
function renderSteps(){
 $('lesson-steps').innerHTML=stepTitles.map(([name,icon],i)=>{
  const current=i===state.step,passed=i<state.maxStep||state.completed,disabled=i>state.maxStep&&!state.completed;
  return '<button class="lesson-step '+(current?'active ':passed?'passed ':'')+'" type="button" data-step="'+i+'"'+(disabled?' disabled':'')+
   ' aria-current="'+(current?'step':'false')+'" aria-label="Шаг '+(i+1)+': '+name+'">'+
   '<span class="step-index">'+(i+1)+'</span><span class="step-icon">'+icon+'</span><span class="step-label">'+name+'</span><span class="step-status">'+(passed?'✓':current?'›':disabled?'🔒':'›')+'</span></button>';
 }).join('');
}
function render(){
 stopAudio();
 if(state.step!==5)releaseMic();
 $('course-heading').textContent='Урок '+lessonNumber+' · '+topic.name;
 $('lesson-count').textContent='Шаг '+(state.step+1)+' из 7';
 $('progress-fill').style.width=(state.completed?100:state.step/7*100)+'%';
 document.title='Урок '+lessonNumber+' · '+topic.name+' — Panda Go';
 renderSteps();
 const renderers=[renderWords,renderPronunciation,renderRules,renderDialogue,renderCompose,renderSpeak,renderReview];
 $('stage-title').textContent=stepTitles[state.step][0];
 $('stage-content').innerHTML=renderers[state.step]();
 feedback('');
 $('lesson-prev').disabled=state.step===0;
 $('lesson-next').disabled=(state.step===1&&(topic.id==='foundations'?state.toneEarProgress<4:state.earProgress<4))||(state.step===4&&!state.buildPassed)||(state.step===5&&!state.spoken)||(state.step===6&&!state.quizPassed);
 $('lesson-next').textContent=state.step===6?'✓ Завершить и к карте':'Дальше →';
 if(state.completed&&state.step===6)$('lesson-next').textContent='К карте HSK 1 →';
 save();
}
function goNext(){
 if(state.step===1&&(topic.id==='foundations'?state.toneEarProgress<4:state.earProgress<4)){feedback('Сначала пройди четыре задания на слух.');return;}
 if(state.step===4&&!state.buildPassed){feedback('Сначала правильно собери фразу.');return;}
 if(state.step===5&&!state.spoken){feedback('Сначала проговори фразу и подтверди повторение.');return;}
 if(state.step===6){
  if(!state.quizPassed){feedback('Сначала ответь на контрольный вопрос.');return;}
  state.completed=true;save();location.href='./hsk1-map.html';return;
 }
 state.step+=1;state.maxStep=Math.max(state.maxStep,state.step);save();render();window.scrollTo({top:0,behavior:'instant'});
}
$('lesson-next').addEventListener('click',goNext);
$('lesson-prev').addEventListener('click',()=>{if(state.step>0){state.step--;render();window.scrollTo(0,0)}});
$('lesson-steps').addEventListener('click',e=>{
 const b=e.target.closest('[data-step]');if(!b||b.disabled)return;
 const s=Number(b.dataset.step);if(s<=state.maxStep){state.step=s;render();window.scrollTo(0,0)}
});
$('stage-content').addEventListener('click',e=>{
 const button=e.target.closest('button');if(!button||button.disabled)return;
 if(button.hasAttribute('data-listen-prompt')){
   const item=topic.listen?.items?.[exerciseOrder[state.earProgress]];
   playOne(item&&(window.courseHumanAudio||{})[item[0]],null);return;
 }
 if(button.hasAttribute('data-listen-answer')){
   const correct=exerciseOrder[state.earProgress];
   if(Number(button.dataset.listenAnswer)===correct){
    state.earProgress=Math.min(4,state.earProgress+1);save();
    const root=document.querySelector('.lesson-listening');if(root)root.outerHTML=renderListeningEar();
    feedback(state.earProgress===4?'✅ Все четыре записи распознаны!':'Верно. Прослушай следующий пример.');
    if(state.earProgress>=4)$('lesson-next').disabled=false;
   }else feedback('Пока нет. Прослушай ещё раз и сравни звучание.');
   return;
 }
 if(button.hasAttribute('data-record-start')){startMic();return}
 if(button.hasAttribute('data-record-stop')){stopMic();return}
 if(button.hasAttribute('data-record-play')){
   if(micObjectUrl){stopAudio();playOne(micObjectUrl,null)}
   return;
 }
 if(button.hasAttribute('data-tone-hear')){
   playOne((window.courseHumanAudio||{})[toneOrder[state.toneEarProgress]],null);return;
 }
 if(button.hasAttribute('data-tone-choice')){
   const correct=['妈','麻','马','骂'].indexOf(toneOrder[state.toneEarProgress])+1;
   if(Number(button.dataset.toneChoice)===correct){
     state.toneEarProgress=Math.min(4,state.toneEarProgress+1);save();
     const container=document.querySelector('.lesson-tone-answer')?.closest('.lesson-card');
     if(container)container.outerHTML=renderToneEar();
     feedback(state.toneEarProgress===4?'✅ Четыре тона распознаны правильно!':'Верно! Теперь слушай следующий тон.');
     if(state.toneEarProgress>=4)$('lesson-next').disabled=false;
   }else feedback('Не совпало. Прослушай ещё раз и обрати внимание на направление тона.');
   return;
 }
 if(button.hasAttribute('data-play')){
  playOne(clipFor(button.dataset.play),button.closest('.lesson-line,.lesson-word,.lesson-card'));
  return;
 }
 if(button.hasAttribute('data-tones-demo')){
  const keys=['妈','麻','马','骂'],clips=keys.map(k=>(window.courseHumanAudio||{})[k]); 
  if(clips.some(x=>!x)){feedback('Нет полных записей четырёх тонов.');return;}
  stopAudio();const token=playId;let i=0;const playNext=()=>{if(token!==playId||i>=clips.length)return;const a=new Audio(clips[i++]);currentAudio=a;a.onplaying=()=>{if(token===playId)feedback('Звучит тон '+i+' из 4.')};a.onended=playNext;a.onerror=()=>{if(token===playId)feedback('Запись тона не загрузилась.')};Promise.resolve(a.play()).catch(()=>{if(token===playId)feedback('Звук не включился.')});};playNext();return;
 }
 if(button.hasAttribute('data-dialog-all')){playDialogue();return;}
 if(button.hasAttribute('data-add')&&!state.buildPassed){const id=Number(button.dataset.add);if(!assembled.includes(id)){assembled.push(id);$('lesson-build-area').innerHTML=buildTokens()}return;}
 if(button.hasAttribute('data-remove')&&!state.buildPassed){assembled=assembled.filter(i=>i!==Number(button.dataset.remove));$('lesson-build-area').innerHTML=buildTokens();return;}
 if(button.hasAttribute('data-verify-build')){
  const b=currentBuild(),target=b.target;
  const correct=assembled.length===target.length&&assembled.every((v,i)=>v===i);
  if(correct){
    state.buildProgress=Math.min(builds.length,state.buildProgress+1);
    state.buildPassed=state.buildProgress>=builds.length;
    assembled=[];save();
    $('stage-content').innerHTML=renderCompose();
    feedback(state.buildPassed?'✅ Все три предложения составлены!':'Верно! '+b.note+' Теперь следующий пример.');
    $('lesson-next').disabled=!state.buildPassed;
  }else feedback('Проверь порядок слов или иероглифов и попробуй снова.');
  return;
 }
 if(button.hasAttribute('data-spoken')){state.spoken=true;save();button.textContent='✓ Я повторил фразу';$('lesson-next').disabled=false;feedback('Отлично. Теперь переходи к повторению.');return;}
 if(button.hasAttribute('data-answer')){
  answerChosen=Number(button.dataset.answer);
  const correct=answerChosen===topic.quiz.correct;
  if(correct){state.quizPassed=true;save();feedback('✓ Верно! '+topic.quiz.explain);$('lesson-next').disabled=false;}
  else feedback('Пока неверно. Подумай ещё раз — можно вернуться к объяснениям.');
  document.querySelectorAll('.lesson-choice').forEach((el,i)=>{
    el.classList.toggle('is-correct',i===topic.quiz.correct&&correct);
    el.classList.toggle('is-wrong',i===answerChosen&&!correct);
  });
 }
});
window.addEventListener('pagehide',()=>{stopAudio();releaseMic();});
render();
})();
