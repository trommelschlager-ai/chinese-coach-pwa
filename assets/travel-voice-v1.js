/* Optional airport speaking drill. SpeechRecognition compares recognized text only; never claims to score tones.
   Personal MediaRecorder clips are local Blob URLs and are not uploaded by this script. */
(()=>{
'use strict';
const reward=document.getElementById('reward-screen');
const map=document.getElementById('map-screen');
if(!reward||document.getElementById('voice-screen'))return;
const phrases=[
 {zh:'你好！',py:'Nǐ hǎo!',ru:'Здравствуйте!',audio:'./assets/dialogue-voices/l1-01-a.mp3'},
 {zh:'我是俄罗斯人。你呢？',py:'Wǒ shì Éluósī rén. Nǐ ne?',ru:'Я из России. А ты?',audio:'./assets/dialogue-voices/l3-02-b.mp3'},
 {zh:'谢谢！',py:'Xièxie!',ru:'Спасибо!',audio:'./assets/course-human/cmn-谢谢.mp3'}
];
const $=id=>document.getElementById(id);
const openButton=document.createElement('button');
openButton.id='voice-open';openButton.className='btn btn-primary';openButton.type='button';
openButton.textContent='🎤 Голосовая практика · 3 фразы';
reward.querySelector('.bottom-actions').prepend(openButton);
const mapButton=document.createElement('button');
mapButton.id='voice-from-map';mapButton.type='button';mapButton.className='btn btn-secondary';
mapButton.textContent='🎤 Голосовая практика · Аэропорт';
map.querySelector('.bottom-actions').append(mapButton);
const mapStatus=document.getElementById('airport-status');
const updateMapButton=()=>{mapButton.hidden=!mapStatus.textContent.includes('Пройдено')};
new MutationObserver(updateMapButton).observe(mapStatus,{subtree:true,characterData:true,childList:true});
updateMapButton();
const screen=document.createElement('section');
screen.className='screen travel-voice';screen.id='voice-screen';screen.hidden=true;screen.setAttribute('aria-label','Голосовая практика аэропорта');
screen.innerHTML=[
 '<div class="voice-top"><strong>✈️ Аэропорт · Говорим сами</strong><span id="voice-counter">1 из 3</span></div>',
 '<div class="voice-progress" id="voice-progress" aria-label="Прогресс голосовой практики"></div>',
 '<div class="voice-scene"><span aria-hidden="true">👩🏻‍✈️</span><div><strong>Сотрудник аэропорта</strong><small>Слушай и повторяй</small></div></div>',
 '<div class="voice-task" id="voice-task"><strong class="voice-zh" id="voice-zh" lang="zh-Hans"></strong>',
 '<span id="voice-py" class="voice-py"></span><span id="voice-ru" class="voice-ru"></span>',
 '<div class="voice-sample"><button id="voice-listen" class="voice-small" type="button">🔊 Послушать образец</button>',
 '<button id="voice-pinyin" class="voice-small" type="button" aria-pressed="true">Скрыть пиньинь</button></div></div>',
 '<div class="voice-action-card" id="voice-actions"><p class="voice-prompt">Теперь твоя очередь!</p>',
 '<button id="voice-recognize" type="button" class="voice-mic">🎤 <span>Сказать и проверить слова</span></button>',
 '<p id="voice-result" class="voice-result" role="status" aria-live="polite">Нажми и произнеси фразу.</p>',
 '<div class="voice-record-controls"><button id="voice-record" class="voice-small" type="button">🎙️ Записать свой голос</button>',
 '<audio id="voice-playback" controls hidden aria-label="Прослушать свою запись"></audio></div>',
 '<p class="voice-privacy">Распознавание может передавать голос службе браузера. Личная запись остаётся на устройстве. Автоматической проверки тонов пока нет.</p></div>',
 '<div class="voice-end" id="voice-end" hidden><span class="voice-medal" aria-hidden="true">🐼🏅</span>',
 '<h2>Отличная практика!</h2><p id="voice-end-text"></p><p>Распознавание слов не означает правильность всех китайских тонов.</p></div>',
 '<div class="bottom-actions voice-bottom"><button id="voice-next" type="button" class="btn btn-primary">Далее ›</button>',
 '<button id="voice-close" type="button" class="btn btn-ghost">← К награде</button></div>'
].join('');
reward.before(screen);
const el={zh:$('voice-zh'),py:$('voice-py'),ru:$('voice-ru'),next:$('voice-next'),listen:$('voice-listen'),pinyin:$('voice-pinyin'),recognize:$('voice-recognize'),record:$('voice-record'),result:$('voice-result'),player:$('voice-playback')};
let returnTo='reward';
let step=0,attempted=new Set(),pinyinVisible=true,listenAudio=null,recognizer=null,recognizerTimer=0,recognizerGen=0,recorder=null,stream=null,recordTimer=0,blobUrl=null,sessionGen=0;
function note(text,cls=''){el.result.textContent=text;el.result.className='voice-result '+cls}
function stopAudio(){if(listenAudio){try{listenAudio.pause();listenAudio.currentTime=0}catch{}listenAudio=null}el.listen.disabled=false}
function stopRecognizer(){recognizerGen++;clearTimeout(recognizerTimer);recognizerTimer=0;if(recognizer){const r=recognizer;recognizer=null;try{r.abort()}catch{}}el.recognize.classList.remove('is-listening');el.recognize.querySelector('span').textContent='Сказать и проверить слова'}
function stopRecording(){clearTimeout(recordTimer);recordTimer=0;if(recorder&&recorder.state!=='inactive')try{recorder.stop()}catch{}recorder=null;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}el.record.classList.remove('is-listening');el.record.textContent='🎙️ Записать свой голос'}
function clearClip(){el.player.pause();el.player.removeAttribute('src');el.player.hidden=true;if(blobUrl){URL.revokeObjectURL(blobUrl);blobUrl=null}}
function cleanup(){sessionGen++;stopAudio();stopRecognizer();stopRecording();clearClip()}
function render(){
 cleanup();
 $('voice-end').hidden=true;$('voice-task').hidden=false;$('voice-actions').hidden=false;
 const item=phrases[step];$('voice-counter').textContent=(step+1)+' из 3';
 $('voice-progress').replaceChildren(...phrases.map((_,i)=>{const bar=document.createElement('span');if(i<=step)bar.className='active';return bar}));
 el.zh.textContent=item.zh;el.py.textContent=item.py;el.ru.textContent=item.ru;el.py.hidden=!pinyinVisible;
 el.pinyin.textContent=pinyinVisible?'Скрыть пиньинь':'Показать пиньинь';el.pinyin.setAttribute('aria-pressed',String(pinyinVisible));
 el.next.textContent=step===2?'Завершить практику ›':'Далее ›';
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 el.recognize.disabled=!Speech;
 el.recognize.querySelector('span').textContent=Speech?'Сказать и проверить слова':'Распознавание недоступно';
 el.record.disabled=!(navigator.mediaDevices?.getUserMedia&&window.MediaRecorder);
 note(Speech?'Нажми на микрофон и произнеси фразу.':'Проверка слов недоступна. Запиши свой голос или переходи дальше.');
}
function open(origin='reward'){returnTo=origin;step=0;attempted=new Set();pinyinVisible=true;reward.hidden=true;map.hidden=true;screen.hidden=false;render();$('voice-close').textContent=origin==='map'?'← На карту':'← К награде';window.scrollTo(0,0)}
function close(){cleanup();screen.hidden=true;if(returnTo==='map')map.hidden=false;else reward.hidden=false;window.scrollTo(0,0)}
function mark(){attempted.add(step)}
function finish(){
 cleanup();$('voice-end').hidden=false;$('voice-actions').hidden=true;$('voice-task').hidden=true;$('voice-counter').textContent='Готово';
 const n=attempted.size;
 $('voice-end-text').textContent=n===3?'Ты потренировал все три фразы!':'Ты потренировал '+n+' из 3 фраз. Можно вернуться и попробовать остальные.';
 el.next.textContent='↻ Повторить голосовую практику';
 if(n===3)try{localStorage.setItem('panda-go-travel-voice-v1',JSON.stringify({finished:true,date:new Date().toISOString()}))}catch{}
}
openButton.addEventListener('click',()=>open('reward'));
mapButton.addEventListener('click',()=>open('map'));
$('voice-close').addEventListener('click',close);
el.next.addEventListener('click',()=>{if(!$('voice-end').hidden){open();return}if(step===2)finish();else{step++;render()}});
el.pinyin.addEventListener('click',()=>{pinyinVisible=!pinyinVisible;el.py.hidden=!pinyinVisible;el.pinyin.textContent=pinyinVisible?'Скрыть пиньинь':'Показать пиньинь';el.pinyin.setAttribute('aria-pressed',String(pinyinVisible))});
el.listen.addEventListener('click',async()=>{
 stopAudio();const audio=new Audio(phrases[step].audio);listenAudio=audio;el.listen.disabled=true;
 audio.onended=()=>{if(listenAudio===audio){listenAudio=null;el.listen.disabled=false}};
 audio.onerror=()=>{if(listenAudio===audio){listenAudio=null;el.listen.disabled=false;note('Образец недоступен. Проверь интернет.','hint')}};
 try{await audio.play()}catch{if(listenAudio===audio){listenAudio=null;el.listen.disabled=false;note('Не удалось включить образец.','hint')}}
});
const normalize=s=>String(s||'').normalize('NFKC').replace(/[^\u3400-\u9fff]/g,'');
el.recognize.addEventListener('click',()=>{
 if(recognizer){stopRecognizer();note('Распознавание остановлено.');return}
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){note('Браузер не поддерживает проверку слов. Можно записать голос.','hint');return}
 if(!navigator.onLine){note('Нет сети. Попробуй записать свой голос и сравнить с образцом.','hint');return}
 stopAudio();stopRecording();
 const phrase=phrases[step],gen=++recognizerGen;let rec;
 try{rec=new Speech();rec.lang='zh-CN';rec.interimResults=false;rec.continuous=false;rec.maxAlternatives=3}catch{note('Проверка слов не запустилась.','hint');return}
 recognizer=rec;el.recognize.classList.add('is-listening');el.recognize.querySelector('span').textContent='Остановить';
 const finishRec=(message,kind='')=>{if(recognizer!==rec||recognizerGen!==gen)return;recognizer=null;clearTimeout(recognizerTimer);recognizerTimer=0;el.recognize.classList.remove('is-listening');el.recognize.querySelector('span').textContent='Сказать и проверить слова';note(message,kind);try{rec.abort()}catch{}};
 rec.onresult=e=>{
  const options=Array.from(e.results[0],x=>x.transcript);
  const match=options.some(x=>normalize(x)===normalize(phrase.zh));
  mark();const heard=options[0]||'';
  if(match)finishRec('✓ Слова распознаны: '+heard+'. Это не проверка тонов.','good');
  else finishRec('Распознано: '+heard+'. Ожидалось: '+phrase.zh+' Попробуй ещё раз.','hint');
 };
 rec.onerror=e=>finishRec(e.error==='not-allowed'?'Доступ к микрофону запрещён. Разреши в настройках Chrome.':e.error==='no-speech'?'Речь не услышана. Попробуй ещё раз.':'Ошибка распознавания. Можно записать голос.','hint');
 rec.onend=()=>finishRec('Речь не распознана. Попробуй ещё раз.','hint');
 try{rec.start();note('🎤 Слушаю китайскую фразу…');recognizerTimer=setTimeout(()=>finishRec('Время вышло. Попробуй ещё раз.','hint'),9000)}
 catch{recognizer=null;el.recognize.classList.remove('is-listening');el.recognize.querySelector('span').textContent='Сказать и проверить слова';note('Распознавание не запустилось.','hint')}
});
el.record.addEventListener('click',async()=>{
 if(recorder?.state==='recording'){recorder.stop();return}
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){note('Браузер не поддерживает запись.','hint');return}
 stopAudio();stopRecognizer();clearClip();const generation=sessionGen;
 try{
  const source=await navigator.mediaDevices.getUserMedia({audio:true});
  if(generation!==sessionGen||screen.hidden){source.getTracks().forEach(t=>t.stop());return}
  stream=source;const r=new MediaRecorder(source);recorder=r;const chunks=[];
  r.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
  r.onstop=()=>{
   if(recorder!==r)return;clearTimeout(recordTimer);recordTimer=0;source.getTracks().forEach(t=>t.stop());stream=null;recorder=null;
   el.record.classList.remove('is-listening');el.record.textContent='🎙️ Записать ещё раз';
   if(generation!==sessionGen||screen.hidden)return;
   const blob=new Blob(chunks,{type:r.mimeType||'audio/webm'});
   if(!blob.size){note('Запись пустая. Попробуй ещё раз.','hint');return}
   blobUrl=URL.createObjectURL(blob);el.player.src=blobUrl;el.player.hidden=false;mark();
   note('Запись готова. Прослушай и сравни с образцом. Тоны не оценены.','good');
  };
  r.onerror=()=>{note('Ошибка записи. Проверь микрофон.','hint');stopRecording()};
  r.start();el.record.classList.add('is-listening');el.record.textContent='■ Остановить запись';note('🎙️ Идёт запись · до 6 секунд');
  recordTimer=setTimeout(()=>{if(recorder===r&&r.state==='recording')r.stop()},6000);
 }catch{if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}if(generation===sessionGen)note('Нет доступа к микрофону. Разреши его в Chrome.','hint')}
});
window.addEventListener('pagehide',cleanup);
window.__travelVoiceQA={open,close,getStep:()=>step,getAttempts:()=>attempted.size,getScreen:()=>screen.hidden?'hidden':'visible'};
})();