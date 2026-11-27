/* Small, explicitly reviewed translation boundary for the first live pilot. */
export function pilotLearnerMetadata(raw,semantic){
 if(!semantic?.pinyin)return null;
 const key=String(raw??'').normalize('NFC').replace(/[\p{P}\s]/gu,'');
 const phrases={'什么':'Что?','什么意思':'Что это значит?','你说什么':'Что ты сказал(а)?','请再说一遍':'Повтори, пожалуйста.','再说一遍':'Повтори ещё раз.','没听懂':'Не понял(а).','我没听懂':'Я не понял(а).','我想休息':'Я хочу отдохнуть.','我现在想休息':'Я сейчас хочу отдохнуть.','我今天想休息':'Я сегодня хочу отдохнуть.','我想去公园':'Я хочу пойти в парк.','我想学中文':'Я хочу учить китайский.','我想学习中文':'Я хочу изучать китайский.','我一回家就吃饭':'Как только прихожу домой, сразу ем.','我一起床就刷牙':'Как только встаю, сразу чищу зубы.','我一下班就回家':'Как только заканчиваю работу, сразу иду домой.','我先刷牙再吃早饭':'Сначала чищу зубы, потом завтракаю.','我先刷牙然后吃早饭':'Сначала чищу зубы, потом завтракаю.','我先洗脸再刷牙':'Сначала умываюсь, потом чищу зубы.','因为我很累所以我想休息':'Поскольку я очень устал(а), хочу отдохнуть.','你现在做什么':'Что ты сейчас делаешь?'};
 let translation=Object.hasOwn(phrases,key)?phrases[key]:null;
 if((['answer-open-reviewed','request-topic-change','correct-hobby-memory','ask-panda-travel-time','express-transport-plan','express-study-difficulty'].includes(semantic.intent)||semantic.travelQuestion===true||semantic.studyDifficulty===true||semantic.reviewedRepair===true)&&typeof semantic.translation==='string'&&String(semantic.raw??'').normalize('NFC').replace(/[\p{P}\s]/gu,'')===key)translation=semantic.translation;
 if(semantic.intent==='answer-yes-no'&&semantic.accepted===true&&semantic.action==='休息'&&['对','对对','对对对','是的','是的是的'].includes(key))translation='Да, верно.';
 return translation?{known:true,pinyin:semantic.pinyin,translation,toneVerified:false}:null;
}
