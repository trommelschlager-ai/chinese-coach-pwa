// Topic-specific guided practice, not a general Chinese-language evaluator.
const line=(zh,py,ru)=>({zh,py,ru});
const clean=s=>String(s??'').normalize('NFC').replace(/[\s\p{P}]/gu,'');
const steps=[
 {prompt:line('你今天忙吗？','Nǐ jīntiān máng ma?','Ты сегодня занят?'),
  hint:line('不太忙，你呢？','Bú tài máng, nǐ ne?','Не очень, а ты?'),
  accepts:[['不太忙你呢','Bú tài máng, nǐ ne?','Не очень, а ты?'],['我不忙你呢','Wǒ bù máng, nǐ ne?','Я не занят, а ты?'],['我很忙你呢','Wǒ hěn máng, nǐ ne?','Я занят, а ты?'],['你呢','Nǐ ne?','А ты?'],['我也不忙你呢','Wǒ yě bù máng, nǐ ne?','Я тоже не занят, а ты?']],
  reply:line('我有点忙。','Wǒ yǒudiǎn máng.','Я немного занят.'),
  instruction:'Ответь и задай встречный вопрос с 呢.'},
 {prompt:line('我们聊聊吧！','Wǒmen liáoliao ba!','Давай поговорим!'),
  hint:line('好呀！','Hǎo ya!','Давай!'),
  accepts:[['好呀','Hǎo ya!','Давай!'],['好啊','Hǎo a!','Давай!'],['行啊','Xíng a!','Давай!'],['可以呀','Kěyǐ ya!','Можно!'],['可以啊','Kěyǐ a!','Конечно!']],
  reply:line('你真棒！','Nǐ zhēn bàng!','Отлично!'),
  instruction:'Согласись дружелюбно с 呀 или 啊.'},
 {prompt:line('你想聊什么？','Nǐ xiǎng liáo shénme?','О чём хочешь поговорить?'),
  hint:line('我们聊中文吧！','Wǒmen liáo Zhōngwén ba!','Давай поговорим о китайском!'),
  accepts:[['我们聊中文吧','Wǒmen liáo Zhōngwén ba!','Давай поговорим о китайском!'],['聊中文吧','Liáo Zhōngwén ba!','Давай поговорим о китайском!'],['我们聊工作吧','Wǒmen liáo gōngzuò ba!','Давай поговорим о работе!'],['聊工作吧','Liáo gōngzuò ba!','Давай поговорим о работе!'],['我们聊聊吧','Wǒmen liáoliao ba!','Давай поговорим!']],
  reply:line('那就好！','Nà jiù hǎo!','Ну и хорошо!'),
  instruction:'Предложи тему разговора с 吧.'},
 {prompt:line('很简单嘛，我教你。','Hěn jiǎndān ma, wǒ jiāo nǐ.','Да это же просто, я научу тебя.'),
  hint:line('哦，我知道了。','Ò, wǒ zhīdào le.','А, понятно.'),
  accepts:[['哦我知道了','Ò, wǒ zhīdào le.','А, понятно.'],['哦原来是这样','Ò, yuánlái shì zhèyàng.','А, вот оно как.'],['嗯我知道了','Ǹg, wǒ zhīdào le.','Угу, понятно.'],['嗯好','Ǹg, hǎo.','Угу, хорошо.'],['哦','Ò.','А, понятно.'],['嗯','Ǹg.','Угу.']],
  reply:line('你真棒！','Nǐ zhēn bàng!','Отлично!'),
  instruction:'Покажи, что понял, используя 哦 или 嗯.'}
];
export function createStreetParticlePractice(){
 let i=0,mode='nonstop',pending=false,done=false;
 function start(m='nonstop'){i=0;pending=false;done=false;mode=m;return steps[0].prompt;}
 function nextQuestion(){if(!pending||done)return null;pending=false;i++;return steps[i].prompt;}
 function hint(){return done?null:{...steps[i].hint,instruction:steps[i].instruction};}
 function answer(input,{mode:m=mode}={}){
  const raw=String(input??'').trim(),s=clean(raw);
  if(!s)return {kind:'empty',message:'Скажи или напиши ответ.'};
  if(done)return {kind:'explanation',message:'Практика завершена. Нажми Non-Stop, чтобы повторить.'};
  if(pending){pending=false;i++;}
  const st=steps[i],match=st.accepts.find(v=>v[0]===s);
  if(!match){
   if(s==='你忙嘛'||s==='你今天忙嘛')return {kind:'correction',correction:line('你忙吗？','Nǐ máng ma?','Ты занят?'),why:'Для обычного вопроса нужна 吗. 嘛 подчёркивает очевидность или смягчает уговор. '+st.instruction};
   return {kind:'clarify',message:'Этот вариант не входит в проверенные ответы упражнения. Это не означает, что фраза неправильная. '+st.instruction,correction:null};
  }
  done=i===steps.length-1;
  pending=!done;
  const message=done?'Практика завершена: 4 из 4 ситуаций. Тоны по аудио не оценивались.':'Ответ подходит по смыслу. Тоны по аудио не оценивались.';
  return {kind:'answer',learner:line(raw,match[1],match[2]),panda:st.reply,nextQuestion:pending&&m==='nonstop'?steps[i+1].prompt:null,message};
 }
 return {start,nextQuestion,hint,answer,getState:()=>({step:i+1,done})};
}
