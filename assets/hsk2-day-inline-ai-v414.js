/* Panda Go HSK2 v414 · Two real inline Panda AI questions.
   Reuses reviewed day-coach validator; tone quality is NEVER inferred from ASR. */
(function(){
'use strict';
let currentRoot=null,idx=0,recognizer=null;
function elements(){
 const root=document.querySelector('.pg414-ai');
 if(root!==currentRoot){currentRoot=root;idx=0;recognizer=null}
 if(!root)return null;
 return {root,input:root.querySelector('#pg414-ai-input'),feedback:root.querySelector('#pg414-ai-feedback'),questions:[...root.querySelectorAll('.pg414-ai-question')]};
}
function message(text,success=false){
 const el=elements();if(!el)return;
 el.feedback.textContent=text;el.feedback.classList.toggle('success',success);
 // On the approved scenic screen, feedback stays available to screen readers,
 // while the duplicate visible beige status row is removed. Use the one
 // existing composer field for a concise success hint.
 const scenic=el.root.classList.contains('pg415-ai-screen');
 if(scenic){
  const box=el.root.querySelector('.pg415-ai-answer');
  if(box)box.dataset.feedback=success?'success':'error';
  if(success)el.input.placeholder=idx>=2?'Ответы приняты':'Ответ принят — следующий вопрос';
  el.input.title=text;
 }
}
function updateQuestions(){
 const el=elements();if(!el)return;
 el.questions.forEach((q,i)=>{q.classList.toggle('current',i===idx);q.classList.toggle('answered',i<idx)});
}
async function submit(){
 const el=elements();if(!el||idx>=2)return;
 const answer=(el.input.value||'').trim();
 if(!answer){message('Напиши или произнеси ответ по-китайски.');return}
 try{
  const coach=await import('./panda-hsk2-day-coach-v1.mjs?v=381');
  const mini=Math.max(0,Math.min(2,Number(el.root.dataset.mini)||0));
  const result=coach.checkDayAnswer(answer,idx,mini);
  if(!result.ok){message(result.message||'Этот ответ пока не подтверждён. Попробуй ещё раз.');return}
  idx++;el.input.value='';
  updateQuestions();
  if(idx>=2){
   message('✓ Два ответа подходят. Тоны не оценивались.',true);
   el.input.placeholder=el.root.classList.contains('pg415-ai-screen')?' ':'Открой полный диалог с Пандой AI';
   el.input.disabled=true;
   const send=el.root.querySelector('[data-pg414-send]');if(send)send.disabled=true;
  }else{message('✓ Ответ подходит! Тоны не оценивались. Теперь ответь на второй вопрос.',true)}
 }catch(err){message('Проверка ответа временно недоступна. Открой полный разговор с Panda AI ниже.')}
}
function mic(){
 const el=elements();if(!el||el.input.disabled)return;
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){message('В этом браузере нет распознавания речи. Можешь написать ответ.');return}
 if(!window.confirm('Для распознавания браузер может передавать голос сторонней службе. Panda Go не сохраняет аудиозапись. Начать?'))return;
 if(recognizer){try{recognizer.abort()}catch(e){}recognizer=null}
 const r=new Speech();recognizer=r;r.lang='zh-CN';r.interimResults=false;r.maxAlternatives=1;
 r.onresult=e=>{
  const said=String(e.results?.[0]?.[0]?.transcript||'').trim();
  if(said){el.input.value=said;message('Распознано: '+said+'. Тоны не оценивались. Нажми «Ответить».')}
 };
 r.onerror=e=>message('Микрофон: '+String(e.error||'ошибка распознавания')+'. Можно написать ответ.');
 r.onend=()=>{if(recognizer===r)recognizer=null};
 try{r.start();message('🎙 Слушаю твой ответ…')}catch(e){message('Не удалось включить микрофон. Проверь разрешение Chrome.')}
}
document.addEventListener('click',e=>{
 const button=e.target.closest('button');if(!button)return;
 if(button.dataset.pg414Send!==undefined){submit();return}
 if(button.dataset.pg414Mic!==undefined){mic();return}
});
document.addEventListener('keydown',e=>{
 if(e.key==='Enter'&&e.target?.id==='pg414-ai-input'){e.preventDefault();submit()}
});
})();
