/* v415: the six APPROVED original Panda Go purple-gold screens as interactive artwork.
   Original 941×1672 images are never redrawn or stretched. Stage 4's originally prechecked
   image is fully masked by a REAL seven-question live test so no fake scores are shown. */
(function(){
'use strict';
const original=window.PandaGoDayFirstUIV1;
if(!original)return;
const imageNames=['01-words','02-rule','03-speech','04-test','05-examples','06-panda-ai'];
const root='./assets/hsk2-approved-v414/';
const words=['每天','早上','起床','洗脸','刷牙','早餐','吃早饭'];
const py=['měitiān','zǎoshang','qǐchuáng','xǐliǎn','shuāyá','zǎocān','chī zǎofàn'];
const examples=['我早上洗脸。','我每天刷牙。','我吃早餐。'];
const ruleExamples=['我每天七点起床。','我每天刷牙。'];
const audioY=[590,723,855,980,1115,1245,1377];
const speechY=[626,733,841,950,1057,1166,1277];
const navY=[[1500,1500],[1540,1540],[1462,1462],[1534,1534],[1524,1524]];
const tabY=[329,241,322,240,399];
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const perc=(n,total)=>((n/total)*100).toFixed(3)+'%';
function at(x,y,w,h){return 'left:'+perc(x,941)+';top:'+perc(y,1672)+';width:'+perc(w,941)+';height:'+perc(h,1672)+';'}
function press(x,y,w,h,attrs,label,cls=''){
 return '<button type="button" class="pg415-hit '+cls+'" style="'+at(x,y,w,h)+'" '+attrs+' aria-label="'+esc(label)+'"></button>';
}
function audio(x,y,w,h,zh,ctx){
 return '<span class="pg415-hit pg415-audio" style="'+at(x,y,w,h)+'" data-for="'+esc(zh)+'">'+ctx.sound(zh)+'</span>';
}
function art(stage){return root+imageNames[stage]+'.webp'}
function ensureDay(state){
 if(!state.day)state.day=original.makeState(state.mini);
 const d=state.day; d.v414=d.v414||{};
 d.v414.highest=Number.isInteger(d.v414.highest)?d.v414.highest:0;
 return d;
}
function livePanel(state,ctx){
 const parser=document.createElement('template');
 parser.innerHTML=original.render(state,ctx);
 const panel=parser.content.querySelector('.pg414-panel');
 return panel?panel.outerHTML:'<div class="pg415-error">Не удалось показать интерактивный тест</div>';
}
function nav(stage,state){
 const done=stage===3&&!original.ready(state);
 let out=press(23,navY[stage][0],420,133,'data-day-prev','Назад');
 out+=press(451,navY[stage][1],457,133,'data-day-next'+(done?' disabled':''),stage===4?'Завершить урок':'Дальше',done?'pg415-disabled':'');
 out+=press(20,18,108,110,'data-day-prev','Назад');
 const xs=[25,213,395,565,739],width=175;
 for(let i=0;i<5;i++){
  if(i===stage)continue;
  out+=press(xs[i],tabY[stage],width,100,'data-pg415-tab="'+i+'"','Открыть этап '+(i+1)+': '+['Слово','Правило','Речь','Тест','Примеры'][i],'pg415-tab');
 }
 return out;
}
function vocabulary(state,ctx){
 let out='';
 for(let i=0;i<7;i++){
  out+='<span class="pg414-vocab-row pg415-vocab-audio" style="'+at(777,audioY[i]-51,109,105)+'" aria-label="'+esc(words[i])+'">'+
    (state.showPy?'<span class="pg414-pinyin">'+py[i]+'</span>':'')+ctx.sound(words[i])+'</span>';
  if(!state.showPy)out+='<span class="pg415-py-mask" style="'+at(509,audioY[i]-41,246,48)+'"></span>';
 }
 out+=press(750,18,185,92,'data-day-pinyin','Показать или скрыть пиньинь','pg415-py-switch');
 out+='<span class="pg415-toggle-label" style="'+at(728,116,183,39)+'">拼音</span>';
 return out;
}
function grammar(state,ctx){
 let out='';
 ruleExamples.forEach((zh,i)=>{
  out+='<span class="pg414-example-compact pg415-example-audio" style="'+at(363, i?974:775,90,100)+'">'+ctx.sound(zh)+'</span>';
 });
 const choice=ensureDay(state).v414.rule;
 out+='<div class="pg415-rule-cover" style="'+at(45,1407,846,100)+'">'+
  ['我 每天 七点 起床。','我 七点 每天 起床。'].map((s,i)=>
  '<button type="button" data-day-rule-choice="'+i+'" class="'+(choice===i?(i===0?'pg415-correct':'pg415-wrong'):'')+'">'+
  (choice===i?(i===0?'✓ ':'× '):'○ ')+s+'</button>').join('')+'</div>';
 if(choice!==null&&choice!==undefined)out+='<div class="pg415-rule-notice" style="'+at(215,1366,580,39)+'">'+(choice===0?'✓ Правильный порядок слов':'× Попробуй ещё раз')+'</div>';
 return out;
}
function speech(state,ctx){
 const d=ensureDay(state);
 const mastered=d.attempts.filter(a=>a.some(r=>r.match)).length;
 let out='';
 if(mastered)out+='<span class="pg415-score" style="'+at(745,478,110,59)+'">'+mastered+'/7</span>';
 for(let i=0;i<7;i++){
  const y=speechY[i],attempts=d.attempts[i],last=attempts[attempts.length-1];
  out+='<span class="pg414-speech-row pg415-speech-overlay" style="'+at(505,y-48,78,95)+'">'+ctx.sound(words[i])+'</span>'+
     press(594,y-48,108,95,'data-day-speech-mic="'+i+'"','Произнеси '+words[i],'pg415-mic-overlay');
  if(last){
   out+='<span class="pg415-rec-status '+(last.match?'good':'bad')+'" style="'+at(708,y-40,180,83)+'">'+
   (last.match?'✓ Распознано':'× Повтори ещё')+'</span>';
  }
 }
 if(d.showConsent){
  out+='<div class="pg415-consent"><h3>Разрешить микрофон?</h3><p>Браузер может передать голос стороннему сервису для распознавания. Panda Go не сохраняет запись.</p><button data-day-consent>Разрешить</button><button data-day-cancel-consent>Отмена</button></div>';
 }
 if(d.speechInfo)out+='<div class="pg415-speech-info" role="status">'+esc(d.speechInfo)+'</div>';
 return out;
}
function exam(state,ctx){
 // The approved artwork contains prefilled correct answers; cover those completely.
 // Under the opaque purple-cream panel are the seven REAL questions from v414.
 return '<div class="pg415-live-test" role="region" aria-label="Семь интерактивных заданий">'+livePanel(state,ctx)+'</div>';
}
function samples(state,ctx){
 const d=ensureDay(state);
 let out='';
 for(let i=0;i<3;i++){
  out+='<span class="pg414-example-large pg415-sample-audio" style="'+at(770, [744,1000,1253][i],119,114)+'">'+ctx.sound(examples[i])+'</span>';
 }
 out+=press(700,528,200,94,'data-pg415-dialogue','Открыть мини-диалог','pg415-dialogue-toggle');
 out+='<span class="pg415-dialogue-label" style="'+at(705,617,187,42)+'">💬 Диалог</span>';
 const t=document.createElement('template');t.innerHTML=original.render(state,ctx);
 const dlg=t.content.querySelector('.pg414-dialogue');
 const lines=dlg?dlg.innerHTML:'<p>Диалог недоступен</p>';
 if(d.v414.dialogueOpen){
  out+='<div class="pg415-dialogue-panel"><button type="button" data-pg415-dialogue class="pg415-close" aria-label="Закрыть диалог">×</button>'+
  '<h3>💬 Мини-диалог</h3>'+lines+'</div>';
 }else out+='<div class="pg415-dialogue-hidden" hidden>'+lines+'</div>';
 return out;
}
function render(state,ctx){
 if(state.mini!==0)return original.render(state,ctx);
 const d=ensureDay(state),stage=state.stage;
 let controls=stage===0?vocabulary(state,ctx):stage===1?grammar(state,ctx):stage===2?speech(state,ctx):stage===3?exam(state,ctx):samples(state,ctx);
 return '<section class="day-pilot pg415-art-screen pg415-step-'+stage+'">'+
 '<div class="pg415-graphic" role="group" aria-label="Panda Go HSK2: '+['Слово','Правило','Речь','Тест','Примеры'][stage]+'">'+
 '<img class="pg415-art" src="'+art(stage)+'" width="941" height="1672" alt="Утверждённый фиолетово-золотой экран '+(stage+1)+' первого мини-урока" decoding="async" draggable="false">'+
 controls+nav(stage,state)+'</div></section>';
}
function next(state,api){
 if(state.mini!==0)return original.next(state,api);
 if(state.stage===3&&!original.ready(state))return;
 const n=state.stage;
 if(n<4)ensureDay(state).v414.highest=Math.max(state.day.v414.highest,n+1);
 original.next(state,api);
}
function handle(button,state,api){
 if(state.mini!==0)return original.handle(button,state,api);
 const k=button.dataset,d=ensureDay(state);
 if(k.pg415Tab!==undefined){
  const n=Number(k.pg415Tab);
  if(n<=d.v414.highest){original.cancel();state.stage=n;api.render()}
  return true;
 }
 if(k.pg415Dialogue!==undefined){d.v414.dialogueOpen=!d.v414.dialogueOpen;api.render();return true}
 return original.handle(button,state,api);
}
function renderAI(state,sound,link){
 const a=root+'06-panda-ai.webp',mini=state.mini;
 const showSound=(x,y,w,h,zh)=>'<span class="pg415-hit pg415-audio pg415-bubble-audio" style="position:absolute;left:2%;top:5%;width:17%;height:43%">'+sound(zh)+'</span>';
 return '<section class="done pg414-ai pg415-ai-screen" data-mini="'+mini+'">'+
 '<div class="pg415-graphic">'+
 '<img class="pg415-art" src="'+a+'" width="941" height="1672" alt="Panda Go AI — утверждённый фиолетово-золотой экран практики речи" draggable="false" decoding="async">'+
 '<span class="pg414-ai-question pg415-ai-bubble" style="'+at(275,403,630,232)+'" aria-label="Первый вопрос: во сколько встаёшь?">'+showSound(20,20,125,118,'你几点起床？')+'</span>'+
 '<span class="pg414-ai-question pg415-ai-bubble" style="'+at(335,689,565,254)+'" aria-label="Второй вопрос: что делаешь утром?">'+showSound(20,20,125,118,'你早上做什么？')+'</span>'+
 '<div class="pg414-ai-answer pg415-ai-answer" style="'+at(32,1045,870,142)+'">'+
  '<label class="pg415-sr-only" for="pg414-ai-input">Напиши ответ на китайском языке</label>'+
  '<input id="pg414-ai-input" type="text" lang="zh-CN" inputmode="text" autocomplete="off" placeholder=" ">'+
  '<button class="pg415-ai-submit" type="button" data-pg414-send aria-label="Проверить ответ">✓</button></div>'+
 '<button class="pg415-hit pg415-ai-microphone" style="'+at(335,1194,207,212)+'" type="button" data-pg414-mic aria-label="Начать голосовой ответ"></button>'+
 '<span class="pg415-hit pg415-audio pg415-listen" style="'+at(570,1267,312,111)+'">'+sound('你几点起床？')+'</span>'+
 '<p id="pg414-ai-feedback" class="pg415-ai-feedback" role="status" style="'+at(75,1166,791,44)+'">Ответь на первый вопрос.</p>'+
 '<a class="pg415-hit pg415-ai-next" href="'+esc(link)+'" style="'+at(104,1440,729,124)+'" aria-label="Открыть полный диалог с Panda AI"></a>'+
 '<button type="button" class="pg415-hit pg415-ai-back" data-repeat style="'+at(29,27,107,108)+'" aria-label="Повторить мини-урок"></button>'+
 '</div><div class="day-ai-panel pg415-accessible-link"><a href="'+esc(link)+'">🎙 Открыть полный диалог Panda AI →</a></div>'+
 '<div class="pg415-ai-controls"><button data-repeat type="button">↻ Повторить</button><button data-next-mini type="button">Следующий мини-урок →</button></div></section>';
}
window.PandaGoExactV415={renderAI,art};
window.PandaGoDayFirstUIV1={makeState:original.makeState,render,handle,next,cancel:original.cancel,ready:original.ready};
})();
