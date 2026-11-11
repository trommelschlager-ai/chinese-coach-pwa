/* Panda Go HSK1 lesson 2 — speech practice v209
 * 16 items in order. Listen to a reference, then have 3 consecutive utterances
 * accepted by the browser's zh-CN speech-to-text recognition.
 * IMPORTANT: speech recognition does not reliably assess Mandarin tone contour,
 * naturalness, or native phonetics. It checks recognized words, NOT tone quality.
 * Same-sounding 他/她/它 are deliberately treated as equivalent audio answers.
 * No audio or transcripts are uploaded to our app/server or persisted here;
 * the browser's speech recognizer may use the device provider's online service.
 */
(()=>{
'use strict';
const STORAGE_KEY='pg-hsk1-v209-speaking-check';
const ITEMS=[
 ['我','wǒ','я'],['你','nǐ','ты'],['您','nín','Вы — вежливо к одному человеку'],
 ['他','tā','он'],['她','tā','она'],['它','tā','оно'],
 ['我们','wǒmen','мы'],['你们','nǐmen','вы — несколько человек'],
 ['你好','nǐ hǎo','привет / здравствуйте'],['是','shì','быть / являться'],
 ['老师','lǎoshī','учитель'],['学生','xuésheng','студент'],
 ['吗','ma','вопросительная частица'],
 ['你是老师吗？','Nǐ shì lǎoshī ma?','Ты учитель?'],
 ['我是老师。','Wǒ shì lǎoshī.','Я учитель.'],
 ['是的，我是老师。','Shì de, wǒ shì lǎoshī.','Да, я учитель.']
];
const QUICK_WORDS=['我','你','您','他','我是老师。','你是老师吗？'];
let mode='full';
const activeItems=()=>mode==='quick'?ITEMS.filter(item=>QUICK_WORDS.includes(item[0])):ITEMS;
const storageKey=()=>mode==='quick'?'pg-hsk1-v211-speaking-quick':STORAGE_KEY;
const Native=()=>window.SpeechRecognition||window.webkitSpeechRecognition;
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>String(s||'').normalize('NFKC').replace(/[\s.,!?，。！？、；;：:"“”'‘’（）()]/g,'').trim();
const aliases={
 '他':['他','她','它'], '她':['他','她','它'], '它':['他','她','它'],
 '你是老师吗？':['你是老师吗','你是老师嘛'],
 '我是老师。':['我是老师'],
 '是的，我是老师。':['是的我是老师'],
 '老师':['老师','老師'], '学生':['学生','學生'],
 '我们':['我们','我們'], '你们':['你们','你們']
};
function isCorrect(target,possibilities){
 const allowed=(aliases[target]||[target]).map(normalize);
 return possibilities.some(transcript=>allowed.includes(normalize(transcript)));
}
function loadProgress(){
 const result={position:0,streak:0,finished:false,correctTotal:0};
 try{
  const old=JSON.parse(localStorage.getItem(storageKey())||'null');
  if(old&&typeof old==='object'){
   result.position=Number.isInteger(old.position)?Math.max(0,Math.min(activeItems().length-1,old.position)):0;
   result.streak=Number.isInteger(old.streak)?Math.max(0,Math.min(3,old.streak)):0;
   result.finished=old.finished===true;
   result.correctTotal=Number.isInteger(old.correctTotal)?Math.max(0,old.correctTotal):0;
  }
 }catch{}
 return result;
}
let saved=loadProgress();
let heard=false,busy=false,audio=null,recognition=null,speechUtterance=null,attemptEpoch=0,feedbackText='';
const persist=()=>{try{localStorage.setItem(storageKey(),JSON.stringify(saved))}catch{}};
const root=()=>document.getElementById('pg2-speaking-root');
const availableAudio=word=>{
 const xiaoxiao=window.PandaLesson2XiaoxiaoV261?.lookup(word);if(xiaoxiao)return xiaoxiao;
 const original=window.PandaOwnerAudio?.lookup(word);if(original)return original;
 const unified=window.PANDA_HSK1_L2_ONE_VOICE_V208||{};
 const map=window.PANDA_HSK1_VOICES?.female||{};
 return unified[word]||map[word]||null;
};
function stopPlayback(){
 if(audio){audio.onended=null;audio.onerror=null;audio.onplaying=null;try{audio.pause()}catch{}audio=null}
 if(speechUtterance){speechUtterance.onend=null;speechUtterance.onerror=null;speechUtterance=null}
 try{window.speechSynthesis?.cancel()}catch{}
}
function stopRecognition(){
 attemptEpoch++;
 const current=recognition;
 recognition=null;
 if(current){
  try{current.onresult=null;current.onerror=null;current.onend=null;current.stop()}catch{}
 }
 busy=false;
}
function cleanUp(){
 stopRecognition();stopPlayback();
}
function update(){
 const target=root();
 if(!target)return;
 target.innerHTML=markup();
}
function setStatus(message){
 feedbackText=message;
 const note=root()?.querySelector('[data-speak-feedback]');
 if(note)note.textContent=message;
}
function enableMicrophone(){
 heard=true;
 update();
}
function sample(){
 if(saved.finished)return;
 if(busy){setStatus('Заверши текущую запись перед прослушиванием.');return}
 stopPlayback();
 heard=false;
 const word=activeItems()[saved.position][0];
 const file=availableAudio(word);
 feedbackText=file?'Слушай образец, затем повтори в микрофон.':'Слушай системное китайское произношение.';
 if(file){
  try{
   const player=new Audio(window.PandaAudioLevel?.[file]||file);audio=player;
   player.preload='auto';player.preservesPitch=true;player.playbackRate=1;
   player.onplaying=()=>setStatus('Слушай произношение до конца. Затем откроется микрофон.');
   player.onended=()=>{if(audio===player){audio=null;enableMicrophone()}};
   player.onerror=()=>setStatus('Файл не открылся. Проверь подключение и попробуй ещё раз.');
   const result=player.play();
   if(result&&typeof result.catch==='function')result.catch(()=>setStatus('Нажми «Слушать» ещё раз.'));
  }catch{setStatus('Не удалось воспроизвести запись.')}
 }else if(window.speechSynthesis&&window.SpeechSynthesisUtterance){
  try{
   const utterance=new SpeechSynthesisUtterance(word);
   speechUtterance=utterance;
   utterance.lang='zh-CN';utterance.rate=.83;utterance.pitch=1;
   const voices=window.speechSynthesis.getVoices?.()||[];
   const zh=voices.filter(v=>/^zh[-_]/i.test(v.lang||''));
   const preferred=zh.find(v=>/female|woman|xiaoxiao|tingting|huihui|meijia|xiaoyi/i.test(v.name||''))||zh[0];
   if(preferred)utterance.voice=preferred;
   utterance.onstart=()=>setStatus('Слушай образец до конца. Затем откроется микрофон.');
   utterance.onend=enableMicrophone;
   utterance.onerror=()=>setStatus('Системная озвучка недоступна.');
   window.speechSynthesis.speak(utterance);
  }catch{setStatus('Системная китайская озвучка недоступна.')}
 }else{
  setStatus('Аудио для этого выражения недоступно.');
 }
}
function hearResult(transcripts,epoch){
 if(epoch!==attemptEpoch||!busy)return;
 busy=false;recognition=null;
 const target=activeItems()[saved.position][0],passed=isCorrect(target,transcripts);
 if(passed){
  saved.streak=Math.min(3,saved.streak+1);
  saved.correctTotal++;
  feedbackText=saved.streak===3?'✓ Три распознанных повтора подряд. Теперь доступно следующее слово.':
   '✓ Слово распознано. Повтори ещё '+(3-saved.streak)+' '+(3-saved.streak===1?'раз':'раза')+'.';
 }else{
  saved.streak=0;
  feedbackText='Распознано: «'+(transcripts[0]||'не разобрано')+'». Не совпало с образцом. Серия сброшена: 0 из 3. Послушай и попробуй снова.';
 }
 persist();update();
}
function startRecording(){
 if(saved.finished||busy||saved.streak>=3)return;
 if(!heard){setStatus('Сначала нажми «Слушать слово».');return}
 const Constructor=Native();
 if(!Constructor){setStatus('В этом браузере нет распознавания китайской речи. Открой урок в актуальном Chrome на Android.');return}
 stopPlayback();
 busy=true;
 const epoch=++attemptEpoch;
 let received=false;
 try{
  recognition=new Constructor();
  recognition.lang='zh-CN';
  recognition.continuous=false;
  recognition.interimResults=false;
  recognition.maxAlternatives=5;
  recognition.onresult=event=>{
   if(epoch!==attemptEpoch||received)return;
   const results=event.results||[];
   for(let i=0;i<results.length;i++){
    if(results[i]?.isFinal===false)continue;
    const alternatives=[];
    for(let j=0;j<results[i].length;j++)alternatives.push(results[i][j]?.transcript||'');
    received=true;hearResult(alternatives,epoch);return;
   }
  };
  recognition.onerror=event=>{
   if(epoch!==attemptEpoch||received)return;
   busy=false;recognition=null;
   const error=event?.error||'unknown';
   feedbackText=error==='not-allowed'||error==='service-not-allowed'?
    'Доступ к микрофону запрещён. Разреши микрофон для сайта в настройках браузера.':
    error==='no-speech'?'Речь не распознана. Говори после сигнала и повтори попытку.':
    'Не удалось распознать речь ('+error+'). Попробуй ещё раз.';
   update();
  };
  recognition.onend=()=>{
   if(epoch!==attemptEpoch||received)return;
   busy=false;recognition=null;
   feedbackText='Не услышал законченного слова. Нажми микрофон и повтори.';
   update();
  };
  recognition.start();
  feedbackText='🎙 Слушаю. Произнеси «'+activeItems()[saved.position][0]+'» один раз.';
  update();
 }catch(error){
  busy=false;recognition=null;
  feedbackText='Распознавание не запустилось. Разреши микрофон и попробуй снова.';
  update();
 }
}
function advance(){
 if(saved.streak<3||busy||saved.finished)return;
 cleanUp();
 if(saved.position===activeItems().length-1){
  saved.finished=true;
  feedbackText='Все слова завершены!';
 }else{
  saved.position++;
  saved.streak=0;
  heard=false;
  feedbackText='';
 }
 persist();update();
}
function restart(){
 cleanUp();
 saved={position:0,streak:0,finished:false,correctTotal:0};
 heard=false;feedbackText='';persist();update();
}
function markup(){
 if(saved.finished){
  return '<div class="pg9-finished"><h3>🎉 Все '+activeItems().length+' слов и фраз повторены!</h3>'+
   '<p>В каждом пункте три раза подряд браузер распознал нужное слово. Продолжай тренировать тоны на слух.</p>'+
   '<button data-speak-restart type="button">↻ Пройти тренировку заново</button></div>';
 }
 const [word,pinyin,translation]=activeItems()[saved.position];
 const file=availableAudio(word);
 const options=Native();
 return '<div class="pg9-training" aria-label="Повтори каждое слово три раза подряд">'+
  '<div class="pg9-progress">Слово '+(saved.position+1)+' из '+activeItems().length+
  '<span>Нужно 3 подряд</span></div>'+
  '<strong class="pg9-hanzi" lang="zh-Hans">'+escapeHtml(word)+'</strong>'+
  '<div class="pg9-pinyin">'+escapeHtml(pinyin)+'</div>'+
  '<div class="pg9-translation">'+escapeHtml(translation)+'</div>'+
  '<div class="pg9-dots" aria-label="Успешных повторов подряд: '+saved.streak+' из 3">'+
  [1,2,3].map(n=>'<span class="'+(saved.streak>=n?'active':'')+'">'+(saved.streak>=n?'✓':n)+'</span>').join('')+
  '</div>'+
  '<button class="pg9-listen" type="button" data-speak-listen'+(busy?' disabled':'')+'>▶ Слушать слово</button>'+
  '<button class="pg9-microphone" type="button" data-speak-start'+(!options||busy||!heard||saved.streak===3?' disabled':'')+'>'+
  (busy?'🎙 Слушаю…':'🎤 Произнести')+'</button>'+
  '<div class="pg9-feedback" data-speak-feedback role="status">'+escapeHtml(feedbackText||'Послушай слово и произнеси его три раза, каждый раз нажимая микрофон.')+'</div>'+
  '<button class="pg9-next" type="button" data-speak-next'+(saved.streak===3?'':' disabled')+'>'+
  (saved.position===activeItems().length-1?'Завершить тренировку ✓':'Следующее слово →')+'</button>'+
  '<p class="pg9-caveat"><a href="./hsk1-second-practice.html?mode=listen">Тренироваться без распознавания</a></p>'+
  (!options?'<p class="pg9-warning">Распознавание речи недоступно. Для этой проверки нужен совместимый браузер с микрофоном, например Chrome на Android. Без распознавания переход не засчитывается.</p>':'')+
  (!file?'<p class="pg9-warning">Временно звучит системный голос, не запись нашей китаянки.</p>':'')+
  ((word==='他'||word==='她'||word==='它')?
   '<p class="pg9-caveat">他, 她 и 它 произносятся одинаково (tā). Распознавание не различает эти иероглифы по звуку.</p>':'')+
  '<p class="pg9-caveat">Проверяется распознанное слово, не точность тонов. Распознавание может использовать онлайн-сервис устройства.</p>'+
  '</div>';
}
const area=document.getElementById('pg-content');
if(area){
 area.addEventListener('click',event=>{
  const btn=event.target.closest('button');
  if(!btn||btn.disabled)return;
  if(btn.hasAttribute('data-speak-listen'))sample();
  else if(btn.hasAttribute('data-speak-start'))startRecording();
  else if(btn.hasAttribute('data-speak-next'))advance();
  else if(btn.hasAttribute('data-speak-restart'))restart();
 });
}
function setMode(nextMode){
 if(nextMode!=='quick'&&nextMode!=='full')return;
 cleanUp();
 mode=nextMode;
 saved=loadProgress();
 heard=false;feedbackText='';
 update();
}
window.PG2_SPEAKING={
 render:()=>'<section id="pg2-speaking-root" class="pg9-section">'+
  '<h2>🎧 Слушай и произноси</h2>'+
  '<p class="pg9-intro">'+(mode==='quick'?'6 ключевых слов и фраз. ':'Полная тренировка — 16 слов и фраз. ')+
  'Произнеси каждый пункт так, чтобы браузер распознал его три раза подряд. Это не проверка тонов.</p>'+
  markup()+'</section>',
 afterRender(){
  // Re-enter the final screen with the last saved word and preserved streak.
  // Audio permission is never silently reused when reopening the page.
  heard=false;busy=false;
 },
 reset:restart,
 setMode,
 getItems:()=>ITEMS.map(item=>item.slice()),
 getMode:()=>mode,
 audioFor:availableAudio,
 cleanup:cleanUp,
 test:{isCorrect,normalize}
};
window.addEventListener('pagehide',cleanUp);
})();