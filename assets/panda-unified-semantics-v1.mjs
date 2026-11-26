/* Shared, pure HSK1–2 semantic pilot. Not wired to live UI. No invented translation, voice or tone scoring. */
export function interpretOpinion(raw){
 const s=String(raw||'').normalize('NFC').replace(/[\p{P}\s]/gu,'');
 const targets={'':{py:'',ru:null},'中文':{py:'Zhōngwén',ru:'китайский язык'},'这个电影':{py:'zhège diànyǐng',ru:'этот фильм'},'这本书':{py:'zhè běn shū',ru:'эта книга'},'这个菜':{py:'zhège cài',ru:'это блюдо'},'这个工作':{py:'zhège gōngzuò',ru:'эта работа'},'这个地方':{py:'zhège dìfang',ru:'это место'},'这个问题':{py:'zhège wèntí',ru:'этот вопрос'},'今天的天气':{py:'jīntiān de tiānqì',ru:'сегодняшняя погода'}};
 const qualities={'好':{py:'hǎo',ru:'хорошо',polarity:'positive'},'坏':{py:'huài',ru:'плохо',polarity:'negative'},'难':{py:'nán',ru:'трудно',polarity:'neutral'},'简单':{py:'jiǎndān',ru:'просто',polarity:'neutral'},'有意思':{py:'yǒu yìsi',ru:'интересно',polarity:'positive'},'贵':{py:'guì',ru:'дорого',polarity:'neutral'},'漂亮':{py:'piàoliang',ru:'красиво',polarity:'positive'},'舒服':{py:'shūfu',ru:'комфортно',polarity:'positive'}};
 const modifiers={'':{py:'',ru:'',negated:false},'很':{py:'hěn',ru:'очень',negated:false},'非常':{py:'fēicháng',ru:'очень',negated:false},'不':{py:'bù',ru:'не',negated:true},'不太':{py:'bú tài',ru:'не слишком',negated:true}};
 const m=/^(我|你)觉得(.*)$/u.exec(s);if(!m)return null;
 const [_,speaker,body]=m;const base={raw:String(raw),construction:'觉得',speaker:speaker==='我'?'learner':'panda',toneVerified:false};
 const py=speaker==='我'?'Wǒ juéde':'Nǐ juéde';
 if(speaker==='你'&&body.endsWith('怎么样')){
  const target=body.slice(0,-3);if(!Object.hasOwn(targets,target))return null;
  return {...base,intent:'ask-opinion',target:target||null,targetMeaning:targets[target].ru,pinyin:[py,targets[target].py,'zěnmeyàng?'].filter(Boolean).join(' ')};
 }
 const question=body.endsWith('吗');if(question&&speaker!=='你')return null;
 const phrase=question?body.slice(0,-1):body;
 for(const target of Object.keys(targets).sort((a,b)=>b.length-a.length)){
  if(!phrase.startsWith(target))continue;
  const rest=phrase.slice(target.length);
  for(const mod of Object.keys(modifiers).sort((a,b)=>b.length-a.length)){
   if(!rest.startsWith(mod))continue;
   const q=rest.slice(mod.length);if(!Object.hasOwn(qualities,q))continue;
   const qual=qualities[q],modifier=modifiers[mod];
   return {...base,intent:question?'confirm-opinion':speaker==='我'?'express-opinion':'ask-opinion',target:target||null,targetMeaning:targets[target].ru,quality:q,qualityMeaning:qual.ru,modifier:mod,negated:modifier.negated,polarity:qual.polarity,pinyin:[py,targets[target].py,modifier.py,qual.py,question?'ma?':''].filter(Boolean).join(' ')+(question?'':'.')};
  }
 }
 return null;
}
