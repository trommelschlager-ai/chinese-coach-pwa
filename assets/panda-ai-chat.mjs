import {TONE_ITEMS,checkPinyin} from './panda-tone-check.mjs';
const $=id=>document.getElementById(id);
const config=window.PANDA_AI_CONFIG||{};
let apiBase='',ready=false,challenge='',widgetId=null,busy=false;
const conversation=[];
const messages=$('chat-messages'),send=$('send'),status=$('chat-status');
function note(text,kind=''){status.textContent=text;status.className='status '+kind;}
function bubble(kind,text){
 const el=document.createElement('div');
 el.className='bubble '+kind;el.textContent=text;
 messages.appendChild(el);messages.scrollTop=messages.scrollHeight;return el;
}
function updateSend(){send.disabled=!ready||!challenge||busy;}
function resetChallenge(){
 challenge='';if(widgetId!==null&&window.turnstile)window.turnstile.reset(widgetId);
 updateSend();
}
function installTurnstile(){
 const script=document.createElement('script');
 script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
 script.async=true;script.defer=true;
 script.onload=()=>{
  if(!window.turnstile){note('Не удалось загрузить защиту чата.','error');return;}
  widgetId=window.turnstile.render('#turnstile',{
   sitekey:config.siteKey,
   callback:token=>{challenge=token;note('Можно задать вопрос.');updateSend()},
   'expired-callback':()=>{challenge='';note('Обнови проверку безопасности.');updateSend()},
   'error-callback':()=>{challenge='';note('Проверка безопасности не работает. Попробуй позже.','error');updateSend()}
  });
 };
 script.onerror=()=>note('Проверка безопасности недоступна: проверь интернет.','error');
 document.head.appendChild(script);
}
function validBase(value){
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)return '';return u.href.replace(/\/+$/,'');}
 catch{return '';}
}
async function initialize(){
 bubble('ai','你好! Я Panda AI 🐼\nЗадай вопрос по своему уроку. Например: «Почему 你好 звучит ní hǎo?»');
 const lesson=new URLSearchParams(location.search).get('lesson');
 if(lesson&&['1','2','3','4','5','6','7'].includes(lesson))$('lesson').value=lesson;
 apiBase=validBase(config.apiBase);
 if(!apiBase||!config.siteKey){note('Panda AI готовится к подключению. Проверка письменных тонов ниже уже работает.');return;}
 try{
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),9000);
  let response;
  try{response=await fetch(apiBase+'/health',{signal:controller.signal,cache:'no-store'})}
  finally{clearTimeout(timer)}
  const health=await response.json();
  if(!response.ok||!health.ready){note('AI-сервер ещё не настроен. Тренажёр тонов доступен.','error');return;}
  ready=true;note('Пройди короткую проверку безопасности, затем спроси панду.');installTurnstile();
 }catch{note('AI-сервер недоступен. Попробуй позже; тренажёр тонов работает.','error');}
}
$('chat-form').addEventListener('submit',async event=>{
 event.preventDefault();if(busy||!ready)return;
 const question=$('question').value.trim();
 if(question.length<2||question.length>700){note('Введи вопрос от 2 до 700 символов.','error');return;}
 if(!challenge){note('Сначала пройди проверку безопасности.','error');return;}
 const token=challenge;const history=conversation.slice(-6);
 busy=true;updateSend();const shown=bubble('user',question);note('Панда думает…');
 try{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),26000);
  let response;
  try{
   response=await fetch(apiBase+'/v1/chat',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({question,lesson:Number($('lesson').value),history,turnstileToken:token}),
    signal:controller.signal,cache:'no-store'
   });
  }finally{clearTimeout(timer)}
  const data=await response.json();
  if(!response.ok||typeof data.answer!=='string')throw new Error(data.error||'AI не смог ответить.');
  bubble('ai',data.answer);
  conversation.push({role:'user',content:question},{role:'assistant',content:data.answer.slice(0,900)});
  while(conversation.length>6)conversation.shift();
  $('question').value='';note('Ответ получен. Для следующего вопроса пройди проверку снова.','success');
 }catch(error){shown.remove();note(error.message==='signal timed out'?'Истекло время ожидания.':(error.message||'Ошибка соединения. Попробуй снова.'),'error')}
 finally{busy=false;resetChallenge();}
});
$('clear').addEventListener('click',()=>{
 conversation.length=0;messages.replaceChildren();
 bubble('ai','Начнём заново! 🐼 Выбери тему и задай вопрос.');
 note(ready?'История чата очищена.':'AI пока не подключён.');
});
document.querySelectorAll('[data-example]').forEach(b=>b.addEventListener('click',()=>{
 $('question').value=b.dataset.example;$('question').focus();
}));
const word=$('tone-word'),mode=$('tone-mode'),toneInput=$('tone-input'),toneResult=$('tone-result');
for(const item of TONE_ITEMS){
 const option=document.createElement('option');
 option.value=item.hanzi;option.textContent=item.hanzi+' — '+item.meaning;word.appendChild(option);
}
function clearTone(){toneResult.textContent='';toneResult.className='tone-result';toneInput.value='';}
word.addEventListener('change',clearTone);mode.addEventListener('change',clearTone);
$('tone-form').addEventListener('submit',event=>{
 event.preventDefault();
 const result=checkPinyin(word.value,toneInput.value,mode.value);
 toneResult.textContent=result.message;
 toneResult.className='tone-result '+(result.ok?'success':'error');
});
$('tone-hint').addEventListener('click',()=>{
 const item=TONE_ITEMS.find(x=>x.hanzi===word.value);
 toneResult.textContent='Подсказка: '+(mode.value==='standard'?item.standard:item.spoken)+'. '+item.rule;
 toneResult.className='tone-result';
});
initialize();
