import {TOPICS,TASKS,grade,answerLessonQuestion} from './panda-lesson1-engine.mjs';
import {answerCurriculumQuestion} from './panda-curriculum-tutor.mjs';
const $=id=>document.getElementById(id);
const chat=$('chat'),answer=$('answer'),topics=$('topics');
const lessonSelect=$('ask-lesson'),curriculum=window.PANDA_HSK1_FOUNDATIONS||[];
curriculum.slice(0,7).forEach((topic,i)=>{
 const o=document.createElement('option');o.value=String(i+1);o.textContent='Урок '+(i+1)+' · '+topic.name;lessonSelect.appendChild(o);
});
lessonSelect.addEventListener('change',()=>{
 if(state.mode==='ask'){chat.replaceChildren();say('ai','🐼 Тема: '+(curriculum[Number(lessonSelect.value)-1]?.name||'первый урок')+'. Спроси о словах, грамматике или диалоге.');}
});

const state={mode:'practice',topic:'dialog',tasks:[],position:0,correct:0,mistakes:0,attempt:0};
let audio=null;
function say(role,text){
 const bubble=document.createElement('div');bubble.className='bubble '+role;bubble.textContent=text;
 chat.appendChild(bubble);chat.scrollTop=chat.scrollHeight;return bubble;
}
function status(text){$('status').textContent=text}
function stopAudio(){if(audio){try{audio.pause();audio.currentTime=0}catch{}audio=null}}
function updateBar(){
 const total=state.tasks.length;
 $('question-count').textContent=total?'Вопрос '+Math.min(state.position+1,total)+' из '+total:'Выбери тему';
 $('score').textContent=total?'Верно: '+state.correct:'';
 $('progress-fill').style.width=total?(100*state.position/total)+'%':'0%';
}
function activeTask(){return state.tasks[state.position]||null}
function playAudio(){
 const task=activeTask();if(!task||task.topic!=='listening')return;
 const src=window.PandaOwnerAudio?.lookup(task.audio);
 if(!src){status('Запись сейчас недоступна. Можно пропустить вопрос.');return;}
 stopAudio();audio=new Audio(src);audio.play().catch(()=>status('Не удалось воспроизвести аудио. Проверь интернет или попробуй пропустить.'));
}
function showTask(){
 const task=activeTask();stopAudio();
 if(!task){finish();return;}
 state.attempt=0;
 answer.value='';
 $('listen-block').classList.toggle('hidden',task.topic!=='listening');
 $('listen').disabled=task.topic==='listening'&&!window.PandaOwnerAudio?.lookup(task.audio);
 $('skip').classList.remove('hidden');
 $('send').disabled=false;
 say('ai','🐼 '+task.prompt);
 updateBar();status('Напиши ответ и нажми «Ответить».');
 answer.focus({preventScroll:true});
}
function finish(){
 stopAudio();$('listen-block').classList.add('hidden');$('skip').classList.add('hidden');
 $('send').disabled=true;$('progress-fill').style.width='100%';
 $('question-count').textContent='Все '+state.tasks.length+' вопросов пройдены';
 $('score').textContent='Верно с первой попытки: '+state.correct;
 say('ai','🐼 Тренировка завершена! Правильно с первой попытки: '+state.correct+' из '+state.tasks.length+'.\nМожешь повторить эту тему или перейти к другой.');
 status('Результат относится только к текущей тренировке, не к оценке произношения.');
}
function activateTopic(topic){
 state.topic=topic;state.tasks=TASKS.filter(task=>task.topic===topic);
 state.position=0;state.correct=0;state.mistakes=0;state.attempt=0;
 topics.querySelectorAll('button').forEach(button=>button.classList.toggle('active',button.dataset.topic===topic));
 chat.replaceChildren();
 say('ai','你好! Я Панда. 🐼\nБудем тренировать только материал урока 1. Отвечай иероглифами или пиньинем с правильными тонами.');
 showTask();
}
for(const topic of TOPICS){
 const button=document.createElement('button');button.type='button';button.className='topic';
 button.dataset.topic=topic.id;
 const title=document.createElement('strong');title.textContent=topic.title;
 const sub=document.createElement('small');sub.textContent=topic.subtitle+' · '+TASKS.filter(x=>x.topic===topic.id).length+' вопросов';
 button.append(title,sub);
 button.addEventListener('click',()=>activateTopic(topic.id));
 topics.appendChild(button);
}
function setMode(mode){
 stopAudio();state.mode=mode;
 const practice=mode==='practice';
 $('practice-box').classList.toggle('hidden',!practice);
 $('ask-box').classList.toggle('hidden',practice);
 $('mode-practice').classList.toggle('active',practice);
 $('mode-ask').classList.toggle('active',!practice);
 $('mode-practice').setAttribute('aria-pressed',String(practice));
 $('mode-ask').setAttribute('aria-pressed',String(!practice));
 $('listen-block').classList.add('hidden');
 $('skip').classList.toggle('hidden',!practice);
 $('send').disabled=false;
 $('answer-label').textContent=practice?'Твой ответ':'Твой вопрос по выбранному уроку';
 answer.placeholder=practice?'Напиши ответ здесь…':'Например: Почему 你好 меняет тон?';
 chat.replaceChildren();
 if(practice)activateTopic(state.topic);
 else{say('ai','🐼 Выбери урок 1–7 и спроси о словах, правилах или диалоге. Посторонние темы я не обсуждаю.');status('Без платных AI API.');answer.value='';}
}
$('mode-practice').addEventListener('click',()=>setMode('practice'));
$('mode-ask').addEventListener('click',()=>setMode('ask'));
$('listen').addEventListener('click',playAudio);
$('skip').addEventListener('click',()=>{
 if(state.mode!=='practice')return;
 const task=activeTask();if(!task)return;
 say('ai','Пропускаем. Правильный ответ: '+task.correct);
 state.position++;showTask();
});
$('restart').addEventListener('click',()=>{
 if(state.mode==='practice')activateTopic(state.topic);
 else{chat.replaceChildren();say('ai','Привет! 🐼 О чём ты хочешь спросить по первому уроку?');answer.value='';status('Чат очищен.');}
});
document.querySelectorAll('[data-q]').forEach(button=>button.addEventListener('click',()=>{answer.value=button.dataset.q;answer.focus()}));
$('chat-form').addEventListener('submit',event=>{
 event.preventDefault();const input=answer.value.trim();if(!input){status('Сначала напиши ответ или вопрос.');return;}
 if(state.mode==='ask'){
  if(input.length>500){status('Слишком длинный вопрос: максимум 500 символов.');return;}
  say('user',input);say('ai',lessonSelect.value==='1'?answerLessonQuestion(input):answerCurriculumQuestion(input,Number(lessonSelect.value),curriculum));answer.value='';status('Ответ по подготовленным материалам выбранного урока.');return;
 }
 const task=activeTask();if(!task)return;
 state.attempt++;
 const result=grade(task,input,state.attempt);
 say('user',input);
 say('ai',result.text);
 if(result.ok){if(state.attempt===1)state.correct++;state.position++;showTask();}
 else{state.mistakes++;status('Попробуй ещё раз или нажми «Пропустить».');answer.select()}
});
activateTopic('dialog');
