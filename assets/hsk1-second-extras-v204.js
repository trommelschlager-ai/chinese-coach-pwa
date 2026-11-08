/* Panda Go HSK1 Lesson 2 v204: optional authentic stroke trainer and voiced micro-scene.
   A self-contained enhancement: 12 screen curriculum and saved progress remain unchanged.
   Character data: hanzi-writer-data / Make Me A Hanzi under existing Arphic license.
   The micro-scene uses the site's existing, licensed male/female full sentence samples.
*/
(()=>{
'use strict';
const KEY='pg-hsk1-v204-extras';
let saved={hanziCompleted:false,sceneWatched:false};
try{const p=JSON.parse(localStorage.getItem(KEY)||'null');if(p&&typeof p==='object'){
 saved.hanziCompleted=p.hanziCompleted===true;saved.sceneWatched=p.sceneWatched===true;
}}catch{}
let writer=null,writingEpoch=0,sceneAudio=null,sceneEpoch=0;
const $=(selector)=>document.querySelector(selector);
const store=()=>{try{localStorage.setItem(KEY,JSON.stringify(saved))}catch{}};
const setWritingStatus=message=>{const el=$('[data-writing-status]');if(el)el.textContent=message};
function stopWriting(){
 writingEpoch++;
 if(writer){try{writer.cancelQuiz?.()}catch{}try{writer.pauseAnimation?.()}catch{}}
 writer=null;
}
function loadWriting(){
 const panel=$('[data-writing-panel]'),paper=$('#pg3-handwriting');
 if(!panel?.open||!paper||writer)return;
 if(!window.HanziWriter){setWritingStatus('Не удалось загрузить модуль письма.');return}
 const width=paper.getBoundingClientRect?.().width;
 const size=Math.floor(Math.min(230,Math.max(170,width||220)));
 const epoch=++writingEpoch;
 try{
  writer=HanziWriter.create('pg3-handwriting','他',{
   width:size,height:size,padding:7,
   showOutline:true,showCharacter:false,strokeColor:'#63338f',
   radicalColor:'#9c56ac',outlineColor:'#e7d4ed',
   drawingColor:'#ce6fbb',highlightColor:'#eeb96f',
   strokeAnimationSpeed:1.1,delayBetweenStrokes:380,
   showHintAfterMisses:3,acceptBackwardsStrokes:false,
   charDataLoader:(character,onComplete,onError)=>{
    if(character!=='他'){onError(new Error('Unsupported character'));return}
    fetch('./assets/hanzi-data/'+encodeURIComponent(character)+'.json')
      .then(r=>{if(!r.ok)throw new Error('Character data unavailable');return r.json()})
      .then(data=>{if(epoch===writingEpoch)onComplete(data)})
      .catch(error=>{if(epoch===writingEpoch){setWritingStatus('Ошибка загрузки черт. Попробуй снова.');onError(error)}})
   }
  });
 }catch{writer=null;setWritingStatus('Не удалось открыть интерактивную пропись.')}
}
function demonstrate(){
 if(!writer){setWritingStatus('Открой пропись, затем нажми ещё раз.');return}
 try{
  writer.cancelQuiz?.();
  setWritingStatus('Смотри порядок пяти черт и затем попробуй сам.');
  Promise.resolve(writer.animateCharacter()).catch(()=>setWritingStatus('Не удалось запустить анимацию черт.'));
 }catch{setWritingStatus('Не удалось запустить анимацию.')}
}
function practice(){
 if(!writer){setWritingStatus('Сначала открой поле для письма.');return}
 const active=writer,epoch=writingEpoch;
 try{
  active.cancelQuiz?.();
  Promise.resolve(active.showOutline({duration:0})).then(()=>{
   if(epoch!==writingEpoch||active!==writer)return;
   return Promise.resolve(active.hideCharacter({duration:0})).then(()=>{
    if(epoch!==writingEpoch||active!==writer)return;
    setWritingStatus('Пиши пальцем: сначала первую черту компонента 亻.');
    active.quiz({
     onCorrectStroke:result=>{
      if(epoch!==writingEpoch||active!==writer)return;
      setWritingStatus(result.strokesRemaining?
       'Верно. Осталось черт: '+result.strokesRemaining+'.':'Все пять черт написаны!');
     },
     onComplete:()=>{
      if(epoch!==writingEpoch||active!==writer)return;
      saved.hanziCompleted=true;store();
      setWritingStatus('✓ Отлично! Ты написал 他 в правильном порядке.');
      const summary=$('[data-writing-panel] summary');
      if(summary&&!summary.textContent.includes('✓'))summary.textContent+=' ✓';
     }
    });
   });
  }).catch(()=>setWritingStatus('Не удалось начать пропись. Нажми ещё раз.'));
 }catch{setWritingStatus('Не удалось начать письмо.')}
}
function writingMarkup(){
 return '<details class="pg4-writing" data-writing-panel><summary>✍️ Попробуй написать 他 · 5 черт'+
 (saved.hanziCompleted?' ✓':'')+'</summary>'+
 '<div class="pg4-writing-body"><p class="pg4-writing-tip">Нажми «Показать черты», затем напиши 他 пальцем. Сначала пишем 亻, затем 也.</p>'+
 '<div class="pg4-writing-paper"><div id="pg3-handwriting" aria-label="Пиши пальцем иероглиф 他 в правильном порядке"></div></div>'+
 '<div class="pg4-write-controls"><button data-write-demo type="button">▶ Показать черты</button>'+
 '<button data-write-practice type="button">✍️ Написать самому</button></div>'+
 '<p class="pg4-writing-status" role="status" data-writing-status>'+
 (saved.hanziCompleted?'✓ Ты уже написал 他 правильно.':'Упражнение по желанию. Кнопка «Дальше» остаётся доступной после ответа на вопрос.')+
 '</p><small class="pg4-writing-license">Hanzi Writer / Make Me A Hanzi · Arphic Public License</small></div></details>';
}
function sceneMarkup(){
 return '<section class="pg4-scene" aria-label="Анимированная сценка с преподавателями">'+
 '<div class="pg4-scene-window" data-scene-window data-phase="idle">'+
 '<div class="pg4-scene-glow" aria-hidden="true"></div>'+
 '<div class="pg4-scene-actors">'+
 '<div class="pg4-scene-actor pg4-scene-man"><img src="./assets/approved-man-v112.webp" alt="Мужчина" loading="lazy"></div>'+
 '<div class="pg4-scene-actor pg4-scene-woman"><img src="./assets/approved-woman-v112.webp" alt="Женщина" loading="lazy"></div>'+
 '</div>'+
 '<div class="pg4-subtitle" data-scene-caption aria-live="polite">'+
 '<span>Нажми «Смотреть сценку» и послушай диалог</span></div>'+
 '</div><div class="pg4-scene-controls">'+
 '<button type="button" data-scene-play>▶ Смотреть сценку</button>'+
 '<button type="button" data-scene-stop>■ Стоп</button></div>'+
 '<p class="pg4-scene-footnote">Анимированный диалог с сохранёнными учебными голосами. Это не отдельный видеофайл.</p>'+
 '</section>';
}
const words=[
 {hz:'你是老师吗？',pinyin:'Nǐ shì lǎoshī ma?',translation:'Ты учитель?',voice:'male'},
 {hz:'我是老师。',pinyin:'Wǒ shì lǎoshī.',translation:'Я учитель.',voice:'female'}
];
function setScenePhase(phase,html){
 const stage=$('[data-scene-window]'),caption=$('[data-scene-caption]');
 if(stage)stage.dataset.phase=phase;
 if(caption)caption.innerHTML=html;
}
function stopScene(){
 sceneEpoch++;
 if(sceneAudio){try{sceneAudio.onended=null;sceneAudio.onerror=null;sceneAudio.pause()}catch{};sceneAudio=null}
 setScenePhase('idle','<span>Нажми «Смотреть сценку» и послушай диалог</span>');
}
function startScene(){
 stopScene();
 const run=sceneEpoch;
 const voices=window.PANDA_HSK1_VOICES||{};
 const clips=words.map(w=>voices[w.voice]?.[w.hz]);
 if(clips.some(x=>typeof x!=='string'||!x)){
  setScenePhase('idle','<span>Одна из записей недоступна. Ответь на вопросы ниже.</span>');
  return;
 }
 let i=0;
 const playNext=()=>{
  if(run!==sceneEpoch||!$('[data-scene-window]'))return;
  if(i===words.length){
   saved.sceneWatched=true;store();
   setScenePhase('done','<strong>✓ Сценка завершена</strong><span>Теперь выбери ответ ниже</span>');
   return;
  }
  const w=words[i],file=clips[i];i++;
  setScenePhase(String(i),
   '<strong lang="zh-Hans">'+w.hz+'</strong><span>'+w.pinyin+'</span><em>'+w.translation+'</em>');
  try{
   const player=new Audio(file);
   sceneAudio=player;player.preload='auto';player.preservesPitch=true;player.playbackRate=.94;
   player.onended=()=>{if(run!==sceneEpoch||sceneAudio!==player)return;sceneAudio=null;playNext()};
   player.onerror=()=>{if(run===sceneEpoch){stopScene();setScenePhase('idle','<span>Ошибка загрузки записи. Нажми «Смотреть» снова.</span>')}};
   Promise.resolve(player.play()).catch(()=>{if(run===sceneEpoch){
    stopScene();setScenePhase('idle','<span>Звук не включился. Нажми «Смотреть» ещё раз.</span>');
   }});
  }catch{stopScene();setScenePhase('idle','<span>Не удалось воспроизвести сценку.</span>')}
 };
 playNext();
}
const area=$('#pg-content');
if(area){
 area.addEventListener('toggle',event=>{
  const el=event.target;
  if(el.matches?.('[data-writing-panel]')){if(el.open)loadWriting();else stopWriting()}
 },true);
 area.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||button.disabled)return;
  if(button.hasAttribute('data-write-demo'))demonstrate();
  else if(button.hasAttribute('data-write-practice'))practice();
  else if(button.hasAttribute('data-scene-play'))startScene();
  else if(button.hasAttribute('data-scene-stop'))stopScene();
 });
}
window.PG2_EXTRAS={
 beforeRender(){stopWriting();stopScene()},
 afterRender(step,root){
  if(step===1){
   const sheets=root.querySelectorAll('.sheet'),last=sheets[sheets.length-1];
   if(last)last.insertAdjacentHTML('afterend',writingMarkup());
  }
  if(step===9){
   const sheet=root.querySelector('.sheet');
   if(sheet)sheet.insertAdjacentHTML('afterbegin',sceneMarkup());
  }
 },
 stopScene,
 cleanup(){stopWriting();stopScene()}
};
window.addEventListener('pagehide',()=>window.PG2_EXTRAS.cleanup());
})();