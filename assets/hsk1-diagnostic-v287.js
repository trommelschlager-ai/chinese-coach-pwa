(()=>{
'use strict';
const KEY='pg-hsk1-diagnostic-v287';
const el=id=>document.getElementById(id),view=el('pg-exam-body'),prev=el('pg-exam-prev'),next=el('pg-exam-next'),notice=el('pg-exam-notice'),progress=el('pg-exam-progress');
if(!view||!prev||!next)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let questions=[],audio=null,serial=0,ready=false,chosen=[],feedback='',state={index:0,responses:{},finished:false,review:false,reviewQueue:[],reviewPos:0,reviewed:{}};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'&&typeof s.responses==='object')state={...state,...s}}catch{}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
function stop(){serial++;try{audio?.pause()}catch{}audio=null}
function activeIndex(){return state.review?state.reviewQueue[state.reviewPos]:state.index}
function active(){return questions[activeIndex()]}
function solved(){return state.review?state.reviewed[activeIndex()]===true:state.responses[activeIndex()]?.solved===true}
function clearTransient(){stop();ready=false;chosen=[];feedback=''}
function result(status){feedback=status;paint()}
function record(correct){
 const n=activeIndex();
 if(state.review){if(correct)state.reviewed[n]=true}
 else{
  const previous=state.responses[n];
  state.responses[n]={firstCorrect:previous?previous.firstCorrect:correct,solved:!!correct};
 }
 save();result(correct?'✓ Правильно! '+active().explain:'Пока неверно. Подумай ещё раз и попробуй снова.');
}
function showResult(){
 const misses=questions.map((q,i)=>({q,i})).filter(x=>state.responses[x.i]?.firstCorrect===false);
 const good=questions.length-misses.length;
 view.innerHTML='<section class="pg-exam-card pg-exam-results"><div class="pg-exam-eyebrow">Итоговый результат</div>'+
 '<div class="pg-exam-score">'+good+' / '+questions.length+'</div>'+
 '<div class="pg-exam-lead">'+(good>=18?'Материал освоен уверенно.':good>=13?'Основа есть, но ошибки стоит повторить.':'Нужно закрепить несколько тем, прежде чем переходить дальше.')+'</div>'+
 (misses.length?'<h2>Что повторить</h2>'+misses.map(x=>'<div class="pg-exam-miss"><b>Урок '+x.q.lesson+'</b> — '+esc(x.q.explain)+'</div>').join(''):'<p class="pg-exam-lead">Все ответы верны с первой попытки!</p>')+
 '<div class="pg-exam-result-actions">'+(misses.length?'<button type="button" class="primary" data-review>↺ Повторить ошибки ('+misses.length+')</button>':'')+
 '<button type="button" data-restart>Пройти все 21 задание заново</button><a href="./hsk1-map.html">← К карте HSK 1</a></div></section>';
 el('pg-exam-number').textContent=questions.length+' / '+questions.length;
 progress.setAttribute('aria-valuenow',String(questions.length));el('pg-exam-fill').style.width='100%';
 prev.disabled=true;next.disabled=true;next.hidden=true;notice.textContent='Результат первой попытки сохраняется, даже если ты повторил ошибки.';
}
function paint(){
 if(!questions.length)return;
 if(state.finished&&!state.review){showResult();return}
 const n=activeIndex(),q=active();
 if(!q){state.finished=true;state.review=false;save();showResult();return}
 const success=solved();
 const indexLabel=state.review?'Повторение ошибок '+(state.reviewPos+1)+'/'+state.reviewQueue.length:'Вопрос '+(n+1)+'/'+questions.length;
 let controls='';
 if(q.kind==='build'){
  const offset=Math.ceil(q.target.length/2);
  const selected=chosen.map(i=>q.target[i]);
  controls='<div class="pg-exam-assemble">'+(selected.length?selected.map(x=>'<span>'+esc(x)+'</span>').join(''):'<span>Собери фразу</span>')+'</div>'+
   '<div class="pg-exam-tiles">'+q.target.map((_,j)=>{const k=(j+offset)%q.target.length;return '<button type="button" data-pick="'+k+'" '+(chosen.includes(k)||success?'disabled':'')+'>'+esc(q.target[k])+'</button>'}).join('')+'</div>'+
   '<button class="pg-exam-reset" type="button" data-reset '+(success?'disabled':'')+'>↺ Очистить</button>'+
   '<button class="pg-exam-listen" type="button" data-check '+(chosen.length===q.target.length&&!success?'':'disabled')+'>Проверить предложение</button>';
 }else{
  controls=(q.kind==='audio'?'<button type="button" class="pg-exam-listen" data-audio>🔊 '+(ready?'Повторить звук':'Слушать запись')+'</button>':'')+
  '<div class="pg-exam-answers">'+q.choices.map((x,i)=>'<button type="button" data-answer="'+i+'" '+(success||(q.kind==='audio'&&!ready)?'disabled':'')+' class="'+(success&&i===q.correct?'correct':'')+'">'+esc(x)+'</button>').join('')+'</div>';
 }
 view.innerHTML='<section class="pg-exam-card"><div class="pg-exam-eyebrow">Урок '+q.lesson+' · '+indexLabel+'</div>'+
 '<h1>'+esc(q.prompt)+'</h1>'+controls+
 (feedback?'<p class="pg-exam-status '+(success?'good':'bad')+'" role="status">'+esc(feedback)+'</p>':'')+
 (success?'<p class="pg-exam-status good">Ответ засчитан. Можно идти дальше.</p>':'')+'</section>';
 notice.textContent=state.review?'Повторение не меняет результат первой попытки.':'Ошибки сохраняются для итогового повторения.';
 el('pg-exam-number').textContent=state.review?'↺ '+(state.reviewPos+1)+' / '+state.reviewQueue.length:(n+1)+' / '+questions.length;
 progress.setAttribute('aria-valuenow',String(n+1));el('pg-exam-fill').style.width=((n+1)/questions.length*100)+'%';
 prev.disabled=state.review||state.index===0;
 next.hidden=false;next.disabled=!success;
 next.textContent=state.review?(state.reviewPos===state.reviewQueue.length-1?'Завершить повторение →':'Дальше →'):(n===questions.length-1?'Результаты →':'Дальше →');
}
function choose(i){
 const q=active();if(!q||solved()||q.kind==='build'||(q.kind==='audio'&&!ready))return;
 record(i===q.correct);
}
function checkBuild(){
 const q=active();if(!q||q.kind!=='build'||solved()||chosen.length!==q.target.length)return;
 record(chosen.every((id,i)=>id===i));
}
function playAudio(){
 const q=active();if(!q||q.kind!=='audio')return;
 stop();ready=false;paint();
 const token=serial;
 try{
  const player=new Audio(q.audio);audio=player;player.preload='auto';player.playbackRate=1;
  player.onended=()=>{if(token!==serial)return;ready=true;audio=null;paint()};
  player.onerror=()=>{if(token!==serial)return;audio=null;feedback='Запись не загрузилась. Проверь подключение и нажми «Слушать». ';paint()};
  Promise.resolve(player.play()).catch(()=>{if(token!==serial)return;audio=null;feedback='Браузер заблокировал звук. Нажми «Слушать» ещё раз.';paint()});
 }catch{feedback='Не удалось запустить звук.';paint()}
}
function advance(dir){
 if(!questions.length)return;
 if(dir===-1){if(state.review||state.index===0)return;state.index--;clearTransient();save();paint();return}
 if(!solved())return;
 if(state.review){
  state.reviewPos++;
  if(state.reviewPos>=state.reviewQueue.length){state.review=false;state.finished=true}
 }else{
  state.index++;
  if(state.index>=questions.length)state.finished=true;
 }
 clearTransient();save();paint();
}
view.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.hasAttribute('data-audio')){playAudio();return}
 if(b.hasAttribute('data-answer')){choose(Number(b.dataset.answer));return}
 if(b.hasAttribute('data-pick')){
  const id=Number(b.dataset.pick);if(!chosen.includes(id)&&chosen.length<active().target.length){chosen.push(id);paint()}return
 }
 if(b.hasAttribute('data-reset')){chosen=[];feedback='';paint();return}
 if(b.hasAttribute('data-check')){checkBuild();return}
 if(b.hasAttribute('data-restart')){
  clearTransient();state={index:0,responses:{},finished:false,review:false,reviewQueue:[],reviewPos:0,reviewed:{}};save();paint();return
 }
 if(b.hasAttribute('data-review')){
  state.reviewQueue=questions.map((q,i)=>i).filter(i=>state.responses[i]?.firstCorrect===false);
  if(!state.reviewQueue.length)return;
  state.review=true;state.reviewPos=0;state.reviewed={};clearTransient();save();paint()
 }
});
prev.addEventListener('click',()=>advance(-1));
next.addEventListener('click',()=>advance(1));
window.addEventListener('pagehide',stop);
fetch('./assets/hsk1-diagnostic-v287-data.json').then(r=>{if(!r.ok)throw Error('No data');return r.json()}).then(z=>{
 if(z.version!==287||!Array.isArray(z.questions)||z.questions.length!==21)throw Error('Invalid exam data');
 questions=z.questions;
 state.index=Math.max(0,Math.min(questions.length,Number(state.index)||0));
 if(!state.responses||typeof state.responses!=='object')state.responses={};
 if(!Array.isArray(state.reviewQueue))state.reviewQueue=[];
 if(!state.reviewed||typeof state.reviewed!=='object')state.reviewed={};
 paint();
}).catch(()=>{view.textContent='Не удалось загрузить проверку. Обнови страницу при подключённом интернете.'});
})();