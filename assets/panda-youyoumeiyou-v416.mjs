/* Panda AI · reviewed A-not-A pattern: 你有没有…？
   No artificial audio. Only explicit known family and time phrases.
   The persona's family and availability are fictional classroom scenarios. */
import {normalize} from './panda-voice-pilot-engine.mjs?v=live6';

const family=Object.freeze({
  哥哥:['gēge','старший брат','старшего брата',true],
  姐姐:['jiějie','старшая сестра','старшей сестры',false],
  弟弟:['dìdi','младший брат','младшего брата',false],
  妹妹:['mèimei','младшая сестра','младшей сестры',true]
});
const normalized=s=>normalize(String(s||''));
const sample=(hanzi,pinyin,ru)=>({hanzi,pinyin,ru,audioKey:null});
const classroom='Учебная роль Панды, а не сведения о реальной семье или расписании.';

export function reviewedYouYouMeiyou(raw,{allowed=[1],prompt=null}={}){
 const original=String(raw||'').trim(),s=normalized(original);
 const active=normalized(prompt?.hanzi||prompt?.panda||prompt?.line?.hanzi||'');
 const currentLesson=/^你有没有(哥哥|姐姐|弟弟|妹妹)$/.test(active)?6:
    /^你(?:今天|明天)?有没有(?:空|时间)$/.test(active)?4:null;
 if(currentLesson&&['有','没有'].includes(s)){
   if(!allowed.includes(currentLesson))return {kind:'locked',lesson:currentLesson,message:'Сначала открой урок '+currentLesson+'.'};
   const yes=s==='有';
   return {kind:'answer',lesson:currentLesson,
     spoken:{known:true,hanzi:original,pinyin:yes?'Yǒu.':'Méiyǒu.',
       translation:yes?'Да, есть.':'Нет.',topic:currentLesson,matchedPrompt:true},
     reply:sample('很好！','Hěn hǎo!','Отлично!'),
     followup:null,message:'Правильный короткий ответ на вопрос 有—没有. Тоны голоса не оценивались.'};
 }
 if(s==='你有没有')return {kind:'clarify',spoken:{known:false,hanzi:original,pinyin:'Nǐ yǒu méiyǒu…?',translation:'Есть ли у тебя…?'},
   message:'После 你有没有 добавь предмет или обстоятельство: 你有没有妹妹？ / 你今天有没有空？. В конце не нужно 吗.'};

 const familyMatch=/^你有没有(哥哥|姐姐|弟弟|妹妹)(吗)?$/.exec(s);
 const timeMatch=/^你(今天|明天)?有没有(空|时间)(吗)?$/.exec(s);
 if(!familyMatch&&!timeMatch)return null;
 const lesson=familyMatch?6:4;
 if(!allowed.includes(lesson))return {kind:'locked',lesson,
   spoken:{known:false,hanzi:original,translation:null,topic:lesson},
   message:'Это конструкция из темы урока '+lesson+'. Сначала открой этот урок.'};

 let pinyin,meaning,answer;
 if(familyMatch){
   const name=familyMatch[1],r=family[name];
   pinyin='Nǐ yǒu méiyǒu '+r[0]+'?';
   meaning='У тебя есть '+r[1]+'?';
   const yes=r[3];
   answer=yes?
    sample('有，我有一个'+name+'。','Yǒu, wǒ yǒu yí ge '+r[0]+'.','Да, у меня есть '+r[1]+'.'):
    sample('没有，我没有'+name+'。','Méiyǒu, wǒ méiyǒu '+r[0]+'.','Нет, у меня нет '+r[2]+'.');
 }else{
   const day=timeMatch[1]||'',thing=timeMatch[2];
   const dayPy=day==='今天'?'jīntiān ':day==='明天'?'míngtiān ':'';
   const dayRu=day==='今天'?'сегодня ':day==='明天'?'завтра ':'';
   const termPy=thing==='空'?'kòng':'shíjiān';
   pinyin='Nǐ '+dayPy+'yǒu méiyǒu '+termPy+'?';
   meaning='У тебя '+dayRu+'есть '+(thing==='空'?'свободное время':'время')+'?';
   answer=sample('有，我'+day+'有'+thing+'。','Yǒu, wǒ '+dayPy+'yǒu '+termPy+'.',
     'Да, у меня '+dayRu+'есть '+(thing==='空'?'свободное время':'время')+'.');
 }
 if((familyMatch&&familyMatch[2])||(timeMatch&&timeMatch[3])){
   const correct=s.replace(/吗$/,'')+'？';
   return {kind:'correction',lesson,
     spoken:{known:false,hanzi:original,translation:null,topic:lesson,
       correction:{hanzi:correct,pinyin,ru:meaning,
         why:'В вопросе 有—没有 уже есть выбор «есть или нет». Частицу 吗 в конце не добавляют.'}},
     message:'Убери 吗: '+correct};
 }
 return {kind:'question',lesson,
   spoken:{known:true,hanzi:original,pinyin,translation:meaning,topic:lesson},
   reply:{...answer,context:classroom},followup:null,
   message:'你有没有…？ = «Есть ли у тебя…?». Можно ответить 有 или 没有. Без 吗. В этой учебной роли Панда отвечает по сценарию; точной MP3-записи новой фразы пока нет.'};
}
