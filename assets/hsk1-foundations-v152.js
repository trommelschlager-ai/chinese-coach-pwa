/* Panda Go HSK 1 — seven lessons, seven logical steps, stable IDs; old lesson records remain untouched. */
(()=>{
'use strict';
const topics=window.PANDA_HSK1_FOUNDATIONS||[];
const requested=Number(new URLSearchParams(location.search).get('lesson'))||1;
const lessonNumber=Number.isInteger(requested)&&requested>=1&&requested<=topics.length?requested:1;
const topic=topics[lessonNumber-1];
if(!topic){document.getElementById('stage-content').textContent='Материал пока недоступен.';return;}
const key='pg-hsk1-v3-'+topic.id,completeKey='pg-hsk1-v3-complete';
const bonusBuild=topic.id==='foundations'?{
 target:['我','叫','小明。'],prompt:'Собери предложение «Меня зовут Сяомин»',
 py:'Wǒ jiào Xiǎomíng.',note:'我 (wǒ) — я; 叫 (jiào) — звать; 小明 (Xiǎomíng) — имя.'
}:null;
const builds=bonusBuild?[...(topic.builds||[topic.build]),bonusBuild]:(topic.builds||[topic.build]);
const speakingPrompts=topic.id==='foundations'?[
 topic.speech,
 {hz:'我叫小明。',py:'Wǒ jiào Xiǎomíng.',ru:'Меня зовут Сяомин.',
  role:'male',tip:'我 (wǒ) — я; 叫 (jiào) — зовут. После тренировки сможешь подставить своё имя.'}
]:[topic.speech];
function extraQuestions(){
 const [word0,word1,word2,word3]=topic.words;
 const last=topic.dialogue[topic.dialogue.length-1];
 const alternatives=[...new Set([...topic.dialogue.map(line=>line[3]),...topic.words.map(w=>w[2])])]
  .filter(text=>text!==last[3]).slice(0,3);
 return [
  {question:'Что означает '+word0[0]+'?',choices:[word2[2],word0[2],word1[2],word3[2]],
   correct:1,explain:word0[0]+' ('+word0[1]+') — '+word0[2]+'.',audio:word0[0],speaker:'female'},
  {question:'Как переводится '+last[1]+'?',choices:[alternatives[0],last[3],alternatives[1],alternatives[2]],
   correct:1,explain:last[1]+' — '+last[3],audio:last[1],
   speaker:last[0]==='А'?'male':'female'}
 ];
}
const reviewQuestions=topic.id==='foundations'?
 [topic.quiz,
  {question:'Что означает 你好?',choices:['Привет! Здравствуйте!','Спасибо','До свидания','Доброе утро'],correct:0,explain:'你好 (nǐ hǎo) — приветствие.',audio:'你好',speaker:'female'},
  {question:'Что значит 我叫小明。?',choices:['Меня зовут Сяомин.','Я учу китайский.','Как тебя зовут?','Я иду домой.'],correct:0,explain:'我 — я, 叫 — зовут, 小明 — Сяомин.',audio:'我叫小明。',speaker:'male'}]:
 [topic.quiz,...extraQuestions()];
const tonePool=['妈','麻','马','骂'];
const shuffleTones=()=>{const a=[...tonePool];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const $=id=>document.getElementById(id),esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state={step:0,maxStep:0,buildPassed:false,quizPassed:false,spoken:false,completed:false,toneEarProgress:0,earProgress:0,buildProgress:0,wordPage:0,wordIndex:0,ruleIndex:0,dialogueIndex:0,
 wordRatings:{},toneSequence:shuffleTones(),reviewProgress:0,speechProgress:0,firstTryCorrect:0,reviewErrors:{},buildPending:false};
try{
 const raw=JSON.parse(localStorage.getItem(key)||'{}');
 if(raw&&typeof raw==='object'){
   state.step=Math.max(0,Math.min(6,Number(raw.step)||0));
   state.maxStep=Math.max(state.step,Math.min(6,Number(raw.maxStep)||0));
   // The previous one-question builder remains credited as task 1, not as all three new tasks.
   state.buildProgress=Math.min(builds.length,Math.max(0,
    raw.buildPassed===true?builds.length:(Number.isInteger(raw.buildProgress)?raw.buildProgress:0)));
   state.buildPassed=raw.buildPassed===true||state.buildProgress===builds.length;
   state.buildPending=raw.buildPending===true&&!state.buildPassed;
   state.earProgress=Math.min(4,Math.max(0,Number(raw.earProgress)||0));
   state.wordPage=Math.min(Math.ceil(topic.words.length/4)-1,Math.max(0,Number(raw.wordPage)||0));
   // Migrate old four-card pages to one-card navigation, keeping the saved spot.
   state.wordIndex=Math.min(topic.words.length-1,Math.max(0,Number.isInteger(raw.wordIndex)?raw.wordIndex:state.wordPage*4));
   state.ruleIndex=Math.min(topic.rules.length-1,Math.max(0,Number(raw.ruleIndex)||0));
   state.dialogueIndex=Math.min(topic.dialogue.length-1,Math.max(0,Number(raw.dialogueIndex)||0));
   state.reviewProgress=Math.max(0,Math.min(reviewQuestions.length,
    Number.isInteger(raw.reviewProgress)?raw.reviewProgress:
     (raw.completed?reviewQuestions.length:(raw.quizPassed?1:0))));
   state.quizPassed=raw.completed===true||state.reviewProgress===reviewQuestions.length;
   state.firstTryCorrect=Number.isInteger(raw.firstTryCorrect)&&raw.firstTryCorrect>=0?
    Math.min(reviewQuestions.length,raw.firstTryCorrect):
    (state.reviewProgress>0?null:0);
   if(raw.reviewErrors&&typeof raw.reviewErrors==='object'&&!Array.isArray(raw.reviewErrors))
    state.reviewErrors=Object.fromEntries(Object.entries(raw.reviewErrors)
      .filter(([k,v])=>/^\d+$/.test(k)&&Number(k)<reviewQuestions.length&&Number.isInteger(v)&&v>=0));
   if(raw.wordRatings&&typeof raw.wordRatings==='object'&&!Array.isArray(raw.wordRatings)){
    state.wordRatings=Object.fromEntries(Object.entries(raw.wordRatings)
     .filter(([k,v])=>/^\d+$/.test(k)&&Number(k)<topic.words.length&&['know','review'].includes(v)));
   }
   if(Array.isArray(raw.toneSequence)&&raw.toneSequence.length===4&&
      tonePool.every(v=>raw.toneSequence.includes(v)))state.toneSequence=[...raw.toneSequence];
   state.spoken=raw.spoken===true;
   state.speechProgress=state.spoken?speakingPrompts.length:
    Math.max(0,Math.min(speakingPrompts.length,Number(raw.speechProgress)||0));
   state.toneEarProgress=Math.max(0,Math.min(4,Number(raw.toneEarProgress)||0));
   state.completed=raw.completed===true;
 }
}catch{}
let assembled=[],currentAudio=null,playId=0,answerChosen=-1;
let recallMode=false,recallRevealed=false,wordPlayed=false,buildMistakes=0,reviewMistakes=0;
let mediaRecorder=null,micStream=null,micObjectUrl=null,micRecording=false;
const exerciseOrder=[2,0,3,1];
const stepTitles=[
 ['Новые слова','你好'],['Тоны и произношение','ā á ǎ à'],['Примеры','📖'],
 ['Диалог','💬'],['Собери предложение','🧩'],['Говори сам','🎙'],['Итог и повторение','🏆']
];
const norm=s=>String(s).replace(/[。？！!?.,，\s]/g,'');
const maps=[
 window.courseGuidedAudio||{},window.courseHumanAudio||{},
 window.basicWordAudio||{},window.basicPinyinAudio||{}
];
const resolved={};
for(const map of maps){for(const [k,v] of Object.entries(map)){const key=norm(k);if(key&&!resolved[key]&&typeof v==='string'&&v.endsWith('.mp3'))resolved[key]=v;}}
// One approved female narrator and fixed two-speaker dialogue.
 // When a complete production map is loaded, never accidentally fall back to a
 // different legacy speaker for the same Chinese text.
const productionVoices=window.PANDA_HSK1_VOICES||null;
// Human Mandarin examples are available only by explicitly pressing 🎙.
// Never replace a dialogue line with an unreviewed speaker or concatenate fragments.
const humanSamples=window.PANDA_HSK1_NATIVE_HUMAN_V167||{};
function clipFor(hz,role='female'){
 if(productionVoices){
  return productionVoices[role]?.[hz]||null;
 }
 // Legacy teaching MP3 stay available while the reviewed voice pack is staged.
 // No legacy voice is labelled male if its identity is unknown.
 return role==='male'?null:(resolved[norm(hz)]||null);
}
function roleForDialogue(speaker){return speaker==='А'?'male':'female'}
function save(){
 try{localStorage.setItem(key,JSON.stringify(state));if(state.completed){
   let all=[];try{all=JSON.parse(localStorage.getItem(completeKey)||'[]')}catch{}
   if(!Array.isArray(all))all=[];
   if(!all.includes(topic.id))all.push(topic.id);
   localStorage.setItem(completeKey,JSON.stringify(all));
 }}catch{feedback('Прогресс не удалось сохранить на устройстве. Проверь свободное место.')}
}
function feedback(message){$('lesson-feedback').textContent=message}
function openStudy(smooth=false){
 const section=$('lesson-study');
 if(section&&typeof section.scrollIntoView==='function')section.scrollIntoView({behavior:smooth?'smooth':'auto',block:'start'});
}
function stopAudio(){playId++;if(currentAudio){currentAudio.onended=null;currentAudio.onerror=null;currentAudio.pause();currentAudio=null;}document.querySelectorAll('[data-playing]').forEach(n=>n.removeAttribute('data-playing'));}
// Preserve Mandarin pitch while gently shortening overlong synthetic syllables.
 // Native-human listening samples and the user's own mic recording are not modified.
// The rejected female Kokoro voice is replaced by independent Mandarin MeloTTS.
// Never alter the phonetic pitch or stretch Mandarin syllables.
// Slower learning pace for female Mandarin MeloTTS only, with pitch preservation.
// The user's microphone and human tone reference recordings stay at original speed.
// Persist separately from lesson progress so changing a preference never alters completion.
const FEMALE_SPEED_KEY='pg-hsk1-female-speed-v161';
const FEMALE_SPEED_OPTIONS=[0.75,0.85,1.0];
let femaleSpeed=0.85;
try {
 const remembered=Number(localStorage.getItem(FEMALE_SPEED_KEY));
 if(FEMALE_SPEED_OPTIONS.includes(remembered))femaleSpeed=remembered;
} catch {}
function isFemaleLessonClip(file,role){
 return role==='female'&&typeof file==='string'&&file.includes('/hsk1-voices-v160/');
}
function tuneVoice(audio,file,role){
 if(isFemaleLessonClip(file,role)){
  audio.playbackRate=femaleSpeed;
  if('preservesPitch' in audio)audio.preservesPitch=true;
  if('webkitPreservesPitch' in audio)audio.webkitPreservesPitch=true;
 }
}
const speedControl=$('hsk1-female-voice-speed');
if(speedControl){
 speedControl.value=String(femaleSpeed);
 speedControl.addEventListener('change',()=>{
  const chosen=Number(speedControl.value);
  if(!FEMALE_SPEED_OPTIONS.includes(chosen))return;
  femaleSpeed=chosen;
  try{localStorage.setItem(FEMALE_SPEED_KEY,String(chosen))}catch{}
  // Apply immediately to an already playing female lesson clip, never to human tone samples.
  if(currentAudio&&isFemaleLessonClip(currentAudio.src,'female')){
   currentAudio.playbackRate=femaleSpeed;
  }
 });
}
function playOne(file,row,role='female'){
 if(!file){feedback('Для этого элемента пока нет готовой записи.');return;}
 stopAudio();const token=playId;
 try{const audio=new Audio(file);tuneVoice(audio,file,role);currentAudio=audio;
  audio.onplaying=()=>{if(token===playId&&row)row.setAttribute('data-playing','true')};
  audio.onended=()=>{if(token===playId){currentAudio=null;if(row)row.removeAttribute('data-playing')}};
  audio.onerror=()=>{if(token===playId)feedback('Аудиофайл не загрузился.')};
  Promise.resolve(audio.play()).catch(()=>{if(token===playId)feedback('Звук не включился. Нажми ещё раз.')});
 }catch{feedback('Не удалось запустить аудио.');}
}
function playDialogue(){
 const clips=topic.dialogue.map(x=>clipFor(x[1],roleForDialogue(x[0])));
 if(clips.some(x=>!x)){feedback('Не все реплики пока записаны одним голосом. Можно читать диалог и слушать доступные реплики отдельно.');return;}
 stopAudio();const token=playId;let index=0;
 const next=()=>{if(token!==playId||index>=clips.length)return;
  document.querySelectorAll('[data-playing]').forEach(n=>n.removeAttribute('data-playing'));
  const current=index++;const row=document.querySelector('[data-dialog-row="'+current+'"]');
  const audio=new Audio(clips[current]);tuneVoice(audio,clips[current],roleForDialogue(topic.dialogue[current][0]));currentAudio=audio;
  audio.onplaying=()=>{if(token===playId)row?.setAttribute('data-playing','true')};
  audio.onended=next;audio.onerror=()=>{if(token===playId)feedback('Ошибка загрузки реплики.')};
  Promise.resolve(audio.play()).catch(()=>{if(token===playId)feedback('Звук не включился.')});
 };
 next();
}
function audioButton(hz,role,hideNative=false){
 const speaker=role||'female';
 const file=clipFor(hz,speaker);
 const original=speaker==='female'?humanSamples[hz]:null;
 return '<div class="lesson-audio-label"><button type="button" class="lesson-audio" data-play="'+esc(hz)+'" data-speaker="'+esc(speaker)+'"'+(file?'':' disabled title="Запись готовится"')+' aria-label="'+(file?'Прослушать ':'Записи пока нет: ')+esc(hz)+'">'+(file?'🔊':'—')+'</button>'+
  (original&&!hideNative?'<button type="button" class="lesson-audio-native" data-human-play="'+esc(hz)+'" title="Дополнительная запись носительницы Yue Tan (1×)" aria-label="Слушать носительницу Yue Tan: '+esc(hz)+'">🎙</button>':'')+
  (file?'':'<small class="lesson-audio-caption">Нет записи</small>')+'</div>';
}
function hanzi(hz,py,ru){
 return '<strong class="lesson-hanzi" lang="zh-Hans">'+esc(hz)+'</strong><span class="lesson-py">'+esc(py)+'</span><span class="lesson-ru">'+esc(ru)+'</span>';
}
function resetRecall(){recallMode=false;recallRevealed=false;wordPlayed=false}
function renderWords(){
 const i=state.wordIndex,[hz,py,ru]=topic.words[i],rating=state.wordRatings[i];
 const example=topic.dialogue.find(row=>row[1].includes(hz));
 const context=example?'<div class="pg-word-example" aria-label="Пример употребления">'+
  '<span class="pg-word-example-label">В предложении</span>'+
  '<strong lang="zh-Hans">'+esc(example[1])+'</strong><span>'+esc(example[3])+'</span></div>':'';
 const neutral=hz==='吗'&&py==='ma'?'<small class="pg-neutral-hint">Нейтральный тон — без значка над гласной</small>':'';
 const label=recallMode&&!recallRevealed?'Показать перевод':'Скрыть перевод';
 const toggle=recallMode&&!recallRevealed?'data-recall-reveal':'data-recall-start';
 const bookmark=rating==='review'?'↻':'☆';
 const isHidden=recallMode&&!recallRevealed;
 return '<div class="lesson-exercise-indicator">Слово '+(i+1)+' из '+topic.words.length+'</div>'+
 '<article class="lesson-card lesson-word'+(isHidden?' pg-recall-active':'')+'">'+
 hanzi(hz,py,ru)+neutral+audioButton(hz,'female',true)+context+
 '<div class="pg-word-tools"><button type="button" class="pg-word-translation" '+toggle+' aria-pressed="'+isHidden+'">'+label+'</button>'+
 '<button type="button" class="pg-word-pin" data-word-pin aria-pressed="'+(rating==='review')+'" aria-label="'+
 (rating==='review'?'Убрать из повторения':'Добавить слово в повторение')+'">'+bookmark+'</button></div>'+
 '</article>'+
 '<details class="pg-more"><summary>Подробнее и повторение</summary>'+
 '<p>'+esc(topic.goal)+'</p>'+
 (humanSamples[hz]?'<button type="button" class="pg-inline-action" data-human-play="'+esc(hz)+'">▶ Слушать носительницу (оригинал)</button>':'')+
 '<p>Отметь трудное слово значком ☆. Список повторения сохраняется на устройстве.</p>'+
 '<div class="pg-rating-tools"><button type="button" data-recall-mark="know">✓ Запомнил</button>'+
 '<button type="button" data-recall-mark="review">↻ Повторить</button></div>'+
 (i>0?'<button type="button" class="pg-inline-action" data-word-restart>С первого слова</button>':'')+
 '<p><a href="./yue-tan-listening.html">Оригинальные записи и авторство</a></p></details>';
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
const toneOrder=state.toneSequence;
function renderToneEar(){
 const i=state.toneEarProgress;
 if(i>=4)return '<div class="lesson-note">✅ Четыре тона распознаны!</div>'+
 '<button type="button" class="lesson-action" data-tone-reset>↻ Повторить тоны в другом порядке</button>';
 return '<article class="lesson-card lesson-listening"><div class="lesson-exercise-indicator">Задание на слух '+(i+1)+' из 4</div>'+
 '<button type="button" class="lesson-action" data-tone-hear>▶ Слушать тон</button>'+
 '<div class="lesson-tone-answer">'+[1,2,3,4].map(n=>'<button type="button" data-tone-choice="'+n+'">'+n+'-й тон</button>').join('')+'</div>'+
 '<p class="lesson-small">Послушай и выбери номер услышанного тона.</p></article>';
}
function renderPronunciation(){
 const grid=topic.id==='foundations'?
 '<div class="lesson-tone-grid" aria-label="Четыре тона китайского языка">'+
 [['mā','1-й · ровный'],['má','2-й · вверх'],['mǎ','3-й · низкий'],['mà','4-й · вниз']].map(([a,b])=>
 '<div class="lesson-tone"><b>'+a+'</b><small>'+b+'</small></div>').join('')+'</div>'+
 '<div class="lesson-sound-demo"><strong>Сравни все тоны</strong><button type="button" data-tones-demo>▶ Слушать</button></div>':
 '<p class="pg-mini-instruction">Послушай знакомые слова и выбери правильный ответ.</p>';
 return grid+(topic.id==='foundations'?renderToneEar():renderListeningEar())+
 '<details class="pg-more"><summary>Правила произношения и пиньиня</summary>'+
 topic.pronunciation.map((p,i)=>'<p><b>'+(i+1)+'.</b> '+esc(p)+'</p>').join('')+
 (topic.id==='foundations'?'<p>Нейтральный тон: ma (без знака). Звукосочетания: zh, ch, sh, j, q, x, z, c, s, ü.</p>':'')+
 '</details>';
}
function renderRules(){
 const i=state.ruleIndex,[head,desc,hz,py,ru]=topic.rules[i];
 return '<div class="lesson-exercise-indicator">Пример '+(i+1)+' из '+topic.rules.length+'</div>'+
 '<article class="lesson-card pg-rule-card"><h2>'+esc(head)+'</h2>'+hanzi(hz,py,ru)+audioButton(hz)+'</article>'+
 ''+
 '<details class="pg-more"><summary>Объяснение примера</summary><p>'+esc(desc)+'</p>'+
 (topic.id==='foundations'?'<p>Базовые компоненты: 人 · 口 · 女 · 木 · 日.</p>':'')+'</details>';
}
function renderDialogue(){
 const i=state.dialogueIndex,[who,hz,py,ru]=topic.dialogue[i];
 const allRecorded=topic.dialogue.every(d=>clipFor(d[1],roleForDialogue(d[0])));
 return '<div class="lesson-exercise-indicator">Реплика '+(i+1)+' из '+topic.dialogue.length+'</div>'+
 '<img class="pg-dialogue-scene" src="./assets/panda-v130/dialogue-scene.webp" alt="Собеседники в китайском городе">'+
 '<div class="lesson-line '+(who==='Б'?'speaker-b':'speaker-a')+'" data-dialog-row="'+i+'">'+
 '<img class="lesson-portrait" src="./assets/approved-'+(who==='Б'?'woman':'man')+'-v112.webp" alt="">'+
 '<div>'+hanzi(hz,py,ru)+'</div>'+audioButton(hz,roleForDialogue(who))+'</div>'+
 '<p class="pg-mini-instruction">Послушай и повтори. Затем переходи к следующей реплике.</p>'+
 (topic.id==='foundations'&&i===topic.dialogue.length-1?
 '<div class="pg-dialogue-explain"><strong>Как сказать «Меня зовут...»</strong>'+
 '<span>我 (wǒ) — я · 叫 (jiào) — зовут · 小明 (Xiǎomíng) — имя.</span></div>':'')+
 '<details class="pg-more"><summary>Весь разговор'+(allRecorded?' · прослушать':'')+'</summary>'+
 (allRecorded?'<button type="button" class="lesson-action" data-dialog-all>▶ Прослушать целиком</button>':'')+
 topic.dialogue.map(d=>'<p>'+esc(d[1])+' — '+esc(d[3])+'</p>').join('')+'</details>';
}
function currentBuild(){return builds[Math.min(state.buildProgress,builds.length-1)]}
function buildTokens(){
 const target=currentBuild().target;
 const unused=target.map((t,i)=>({t,i})).filter(o=>!assembled.includes(o.i)).reverse();
 return '<div class="lesson-selected" aria-label="Твой ответ">'+(assembled.length?assembled.map(i=>'<button class="lesson-token" type="button" data-remove="'+i+'" lang="zh-Hans">'+esc(target[i])+' ×</button>').join(''):'<span class="lesson-small">Нажимай слова снизу по порядку</span>')+'</div>'+
 '<div class="lesson-tokens" aria-label="Слова для составления">'+unused.map(o=>'<button class="lesson-token" type="button" data-add="'+o.i+'" lang="zh-Hans">'+esc(o.t)+'</button>').join('')+'</div>';
}
function renderCompose(){
 if(state.buildPending){
  const b=currentBuild(),answer=b.target.join('');
  return '<article class="lesson-compose pg-build-confirmed"><h2>✓ Правильно!</h2>'+
   '<strong lang="zh-Hans" class="lesson-hanzi">'+esc(answer)+'</strong>'+
   '<span class="lesson-py">'+esc(b.py)+'</span>'+
   (clipFor(answer)?audioButton(answer):'<p class="pg-mini-instruction">Произнеси фразу вслух.</p>')+
   '<p>'+esc(b.note)+'</p>'+
   '<p class="pg-mini-instruction">Теперь переходи к следующему заданию.</p></article>';
 }
 if(state.buildPassed)return '<article class="lesson-compose"><h2>✅ Все задания выполнены!</h2>'+
 '<p>Ты собрал слова и фразу. Теперь потренируй произношение.</p>'+
 '<details class="pg-more"><summary>Вспомнить готовые ответы</summary>'+
 builds.map((b,i)=>'<p>'+(i+1)+'. '+esc(b.target.join(''))+' — '+esc(b.py)+'</p>').join('')+'</details></article>';
 const b=currentBuild();
 return '<article class="lesson-compose"><div class="lesson-exercise-indicator">Задание '+(state.buildProgress+1)+' из '+builds.length+'</div>'+
 '<h2>'+esc(b.prompt)+'</h2>'+
 '<div id="lesson-build-area">'+buildTokens()+'</div>'+
 '<button type="button" id="lesson-verify-build" class="lesson-action" data-verify-build>Проверить ✓</button>'+
 '<details class="pg-more"><summary>Подсказка</summary><p>Нажимай элементы снизу в нужном порядке. Чтобы убрать элемент, нажми его сверху.</p></details></article>';
}
function renderSpeak(){
 const micCapable=!!(navigator.mediaDevices?.getUserMedia&&window.MediaRecorder);
 const i=Math.min(state.speechProgress,speakingPrompts.length-1),speech=speakingPrompts[i];
 return '<article class="lesson-card pg-speak-card">'+
 '<div class="lesson-exercise-indicator">Произнеси фразу '+(i+1)+' из '+speakingPrompts.length+'</div>'+
 hanzi(speech.hz,speech.py,speech.ru)+
 '<p class="pg-mini-instruction" style="color:#692778">Сначала слушай, затем повторяй и сравни.</p>'+
 audioButton(speech.hz,speech.role||'female')+
 (micCapable?
 '<div id="lesson-microphone" class="lesson-recorder"><button class="lesson-action" type="button" data-record-start>🎙 Записать себя</button>'+
 '<button class="lesson-action" type="button" data-record-stop hidden>■ Остановить запись</button>'+
 '<button class="lesson-action" type="button" data-record-play hidden>▶ Прослушать себя</button></div>':
 '<p class="lesson-small">Микрофон недоступен. Произнеси фразу без записи.</p>')+
 '<button type="button" class="lesson-action" data-spoken>'+(state.spoken?'✓ Я сравнил':'Я повторил и сравнил')+'</button>'+
 '<details class="pg-more" style="width:100%"><summary>Совет по произношению</summary><p>'+esc(speech.tip)+'</p>'+
 '<p>Автоматической оценки тонов пока нет. Запись остаётся на устройстве и удаляется при выходе с экрана.</p></details>'+
 '</article>';
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
 if(state.completed){
  const flagged=topic.words.filter((_,i)=>state.wordRatings[i]==='review');
  const known=Object.values(state.wordRatings).filter(v=>v==='know').length;
  const firstTry=state.firstTryCorrect===null?'Оценка с первой попытки не сохранилась':
   'С первой попытки: '+state.firstTryCorrect+' из '+reviewQuestions.length;
  return '<article class="lesson-quiz pg-result-card"><h2>🏆 Урок завершён!</h2>'+
   '<p>Вопросы пройдены: '+reviewQuestions.length+' из '+reviewQuestions.length+
   ' · '+firstTry+'</p>'+
   '<p>Отмечено как знакомое: '+known+' из '+topic.words.length+'</p>'+
   '<p>Ты изучил слова, потренировал слух, собрал фразы и повторил произношение.</p></article>'+
   (flagged.length?'<details class="pg-more"><summary>↻ Повторить трудные слова ('+flagged.length+')</summary>'+
    flagged.map(([hz,py,ru])=>'<div class="pg-difficult-word">'+hanzi(hz,py,ru)+audioButton(hz)+'</div>').join('')+'</details>':'')+
   '<p class="pg-mini-instruction">Нажми «К карте HSK 1», чтобы продолжить обучение.</p>';
 }
 if(state.reviewProgress>=reviewQuestions.length){
  return '<article class="lesson-quiz pg-result-card"><h2>✅ Проверка пройдена!</h2>'+
   '<p>Все вопросы пройдены: '+reviewQuestions.length+' из '+reviewQuestions.length+'</p>'+
   (state.firstTryCorrect===null?'':'<p>С первой попытки: '+state.firstTryCorrect+' из '+reviewQuestions.length+'</p>')+
   '<p>Нажми «Завершить», чтобы сохранить результат.</p></article>';
 }
 const q=reviewQuestions[state.reviewProgress];
 return '<article class="lesson-quiz"><div class="lesson-exercise-indicator">Проверка '+(state.reviewProgress+1)+' из '+reviewQuestions.length+'</div>'+
 '<p class="lesson-question">'+esc(q.question)+'</p>'+
 (q.audio?'<div class="pg-quiz-audio">'+audioButton(q.audio,q.speaker)+'</div>':'')+
 '<div class="lesson-choices">'+q.choices.map((c,i)=>
 '<button type="button" data-answer="'+i+'" class="lesson-choice '+(answerChosen===i?'is-wrong':'')+'">'+esc(c)+'</button>').join('')+'</div></article>'+
 '<details class="pg-more"><summary>Повторить теорию</summary><p>'+esc(topic.review)+'</p></details>';
}
function renderSteps(){
 $('lesson-steps').innerHTML=stepTitles.map(([name,icon],i)=>{
  const current=i===state.step,passed=i<state.maxStep||state.completed,disabled=i>state.maxStep&&!state.completed;
  return '<button class="lesson-step '+(current?'active ':passed?'passed ':'')+'" type="button" data-step="'+i+'"'+(disabled?' disabled':'')+
   ' aria-current="'+(current?'step':'false')+'" aria-label="Шаг '+(i+1)+': '+name+'">'+
   '<span class="step-index">'+(i+1)+'</span><span class="step-icon">'+icon+'</span><span class="step-label">'+name+'</span><span class="step-status">'+(passed?'✓':current?'›':'')+'</span></button>';
 }).reverse().join('');
}
function render(){
 stopAudio();
 if(state.step!==5)releaseMic();
 $('course-heading').innerHTML='<span class="pg-lesson-no">Урок '+lessonNumber+'</span><span class="pg-lesson-name">'+esc(topic.name)+'</span>';
 $('lesson-count').textContent='Шаг '+(state.step+1)+' из 7';
 $('progress-fill').style.width=(state.completed?100:(state.step+1)/7*100)+'%';
 $('lesson-progress').setAttribute('aria-valuenow',String(state.completed?7:state.step));
 $('lesson-progress').setAttribute('aria-valuetext','Пройдено '+(state.completed?7:state.step)+' из 7 шагов');
 document.title='Урок '+lessonNumber+' · '+topic.name+' — Panda Go';
 renderSteps();
 const renderers=[renderWords,renderPronunciation,renderRules,renderDialogue,renderCompose,renderSpeak,renderReview];
 $('stage-title').textContent=stepTitles[state.step][0];
 $('stage-content').innerHTML=renderers[state.step]();
 feedback('');
 $('lesson-prev').disabled=state.step===0&&state.wordIndex===0;
 $('lesson-prev').textContent=state.step===0&&state.wordIndex>0?'← Слово':state.step===2&&state.ruleIndex>0?'← Пример':state.step===3&&state.dialogueIndex>0?'← Реплика':'← Назад';
 $('lesson-next').disabled=(state.step===1&&(topic.id==='foundations'?state.toneEarProgress<4:state.earProgress<4))||
 (state.step===4&&!state.buildPassed&&!state.buildPending)||
 (state.step===5&&!state.spoken)||(state.step===6&&!state.quizPassed&&!state.completed);
 $('lesson-next').textContent=state.step===0?(state.wordIndex<topic.words.length-1?'Следующее слово →':'К тонам →'):
 state.step===2?(state.ruleIndex<topic.rules.length-1?'Следующий пример →':'К диалогу →'):
 state.step===3?(state.dialogueIndex<topic.dialogue.length-1?'Следующая реплика →':'К заданию →'):
 state.step===4&&state.buildPending?(state.buildProgress===builds.length-1?'К произношению →':'Следующее задание →'):
 state.step===6?(state.completed?'К карте HSK 1 →':'✓ Завершить урок'):'Дальше →';
 if(state.completed&&state.step===6)$('lesson-next').textContent='К карте HSK 1 →';
 save();
 const pane=$('lesson-body');if(pane)pane.scrollTop=0;
}
function goNext(){
 if(state.step===0&&state.wordIndex<topic.words.length-1){
  state.wordIndex++;state.wordPage=Math.floor(state.wordIndex/4);resetRecall();render();return;
 }
 if(state.step===1&&(topic.id==='foundations'?state.toneEarProgress<4:state.earProgress<4)){feedback('Сначала пройди четыре задания на слух.');return;}
 if(state.step===2&&state.ruleIndex<topic.rules.length-1){state.ruleIndex++;render();return;}
 if(state.step===3&&state.dialogueIndex<topic.dialogue.length-1){state.dialogueIndex++;render();return;}
 if(state.step===4&&state.buildPending){
  state.buildPending=false;
  state.buildProgress=Math.min(builds.length,state.buildProgress+1);
  state.buildPassed=state.buildProgress>=builds.length;
  assembled=[];save();
  if(!state.buildPassed){render();return;}
 }
 if(state.step===4&&!state.buildPassed){feedback('Сначала правильно собери фразу.');return;}
 if(state.step===5&&!state.spoken){feedback('Сначала проговори фразу и подтверди повторение.');return;}
 if(state.step===6){
  if(state.completed){location.href='./hsk1-map.html';return;}
  if(!state.quizPassed){feedback('Ответь на все вопросы итоговой проверки.');return;}
  state.completed=true;save();render();return;
 }
 state.step+=1;state.maxStep=Math.max(state.maxStep,state.step);save();render();openStudy();
}
$('lesson-next').addEventListener('click',goNext);
$('lesson-prev').addEventListener('click',()=>{
 if(state.step===0&&state.wordIndex>0){state.wordIndex--;state.wordPage=Math.floor(state.wordIndex/4);resetRecall();render();return;}
 if(state.step===2&&state.ruleIndex>0){state.ruleIndex--;render();return;}
 if(state.step===3&&state.dialogueIndex>0){state.dialogueIndex--;render();return;}
 if(state.step>0){state.step--;render();openStudy()}
});
$('lesson-steps').addEventListener('click',e=>{
 const b=e.target.closest('[data-step]');if(!b||b.disabled)return;
 const s=Number(b.dataset.step);if(s<=state.maxStep){state.step=s;render();openStudy(true)}
});
$('stage-content').addEventListener('click',e=>{
 const button=e.target.closest('button');if(!button||button.disabled)return;
 if(button.hasAttribute('data-recall-start')){recallMode=true;recallRevealed=false;render();return}
 if(button.hasAttribute('data-recall-reveal')){recallMode=false;recallRevealed=true;render();return}
 if(button.hasAttribute('data-word-pin')){
  if(state.wordRatings[state.wordIndex]==='review')delete state.wordRatings[state.wordIndex];
  else state.wordRatings[state.wordIndex]='review';
  save();render();return;
 }
 if(button.hasAttribute('data-recall-mark')){
   state.wordRatings[state.wordIndex]=button.dataset.recallMark==='know'?'know':'review';
   save();resetRecall();render();
   // The compact bookmark on the card already indicates whether repetition is needed.
   return;
 }
 if(button.hasAttribute('data-word-restart')){
   state.wordIndex=0;state.wordPage=0;resetRecall();render();return;
 }
 if(button.hasAttribute('data-word-next')||button.hasAttribute('data-word-prev')){
   state.wordIndex=Math.max(0,Math.min(topic.words.length-1,state.wordIndex+(button.hasAttribute('data-word-next')?1:-1)));
   state.wordPage=Math.floor(state.wordIndex/4);resetRecall();
   render();return;
 }
 if(button.hasAttribute('data-rule-next')||button.hasAttribute('data-rule-prev')){
   state.ruleIndex=Math.max(0,Math.min(topic.rules.length-1,state.ruleIndex+(button.hasAttribute('data-rule-next')?1:-1)));
   render();return;
 }
 if(button.hasAttribute('data-dialogue-next')||button.hasAttribute('data-dialogue-prev')){
   state.dialogueIndex=Math.max(0,Math.min(topic.dialogue.length-1,state.dialogueIndex+(button.hasAttribute('data-dialogue-next')?1:-1)));
   render();return;
 }
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
 if(button.hasAttribute('data-tone-reset')){
   state.toneEarProgress=0;toneOrder.splice(0,4,...shuffleTones());save();render();return;
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
     feedback(state.toneEarProgress===4?'✅ Четыре тона распознаны правильно!':'Верно! Слушай следующий тон.');
     if(state.toneEarProgress>=4)$('lesson-next').disabled=false;
   }else{
     const shapes={1:'высокий и ровный',2:'повышается',3:'обычно низкий, иногда с подъёмом',4:'резко понижается'};
     const choice=Number(button.dataset.toneChoice);
     feedback('Ты выбрал '+choice+'-й тон ('+shapes[choice]+'), а прозвучал '+correct+'-й ('+shapes[correct]+'). Прослушай ещё раз.');
   }
   return;
 }
 if(button.hasAttribute('data-human-play')){
  const original=humanSamples[button.dataset.humanPlay];
  if(original&&original.startsWith('./assets/')&&original.endsWith('.mp3'))playOne(original,button.closest('.lesson-line,.lesson-word,.lesson-card'),'human');
  else feedback('Оригинальной записи этой фразы пока нет.');
  return;
 }
 if(button.hasAttribute('data-play')){
  playOne(clipFor(button.dataset.play,button.dataset.speaker||'female'),button.closest('.lesson-line,.lesson-word,.lesson-card'),button.dataset.speaker||'female')
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
    state.buildPending=true;
    assembled=[];buildMistakes=0;save();render();
    feedback('✓ Правильно! Прослушай готовую фразу, если есть запись, и нажми «Дальше».');
  }else{
   buildMistakes++;
   const hint=buildMistakes>=2?' Начни с «'+target[0]+'».':' Попробуй ещё раз.';
   feedback(assembled.length!==target.length?'Нужно выбрать '+target.length+' элемента. Выбрано: '+assembled.length+'.':
     'Порядок элементов пока неверный.'+hint);
  }
  return;
 }
 if(button.hasAttribute('data-spoken')){
  if(!state.spoken){
   state.speechProgress=Math.min(speakingPrompts.length,state.speechProgress+1);
   state.spoken=state.speechProgress>=speakingPrompts.length;
   save();releaseMic();render();
  }
  feedback(state.spoken?'✓ Обе фразы повторены. Переходи к итогу.':
   '✓ Приветствие отработано. Теперь повтори «Меня зовут Сяомин».');
  return;
 }
 if(button.hasAttribute('data-answer')){
  if(state.completed||state.reviewProgress>=reviewQuestions.length)return;
  const q=reviewQuestions[state.reviewProgress];
  answerChosen=Number(button.dataset.answer);
  if(answerChosen===q.correct){
    const thisQuestion=state.reviewProgress;
    if(state.firstTryCorrect!==null&&!state.reviewErrors[thisQuestion])state.firstTryCorrect++;
    state.reviewProgress++;reviewMistakes=0;answerChosen=-1;
    state.quizPassed=state.reviewProgress===reviewQuestions.length;
    save();$('stage-content').innerHTML=renderReview();
    feedback('✓ Верно! '+q.explain+(state.quizPassed?' Проверка завершена.':' Следующий вопрос.'));
    $('lesson-next').disabled=!state.quizPassed;
  }else{
    reviewMistakes++;
    state.reviewErrors[state.reviewProgress]=(state.reviewErrors[state.reviewProgress]||0)+1;
    save();
    feedback(reviewMistakes>1?'Пока неверно. Попробуй повторить тему и сравнить варианты.':
     'Пока неверно. Прослушай ещё раз или открой «Повторить теорию».');
    document.querySelectorAll('.lesson-choice').forEach((el,i)=>el.classList.toggle('is-wrong',i===answerChosen));
  }
 }
});
window.addEventListener('pagehide',()=>{stopAudio();releaseMic();});
render();
})();
