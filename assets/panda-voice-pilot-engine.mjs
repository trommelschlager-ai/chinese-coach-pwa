// Panda Go · supplementary conversational practice for Lesson 1.
// Deterministic replies — no API, no paid tokens, no acoustic tone scoring.
// Some words (吗, 很, 呢, 也, 谢谢) are NEW and explicitly explained in the UI.
export const PILOT_LINES=Object.freeze([
 Object.freeze({
  panda:'你好！',pinyin:'Nǐ hǎo!',ru:'Привет!',audioKey:'你好',
  instruction:'Ответь «Привет!»',
  accepted:Object.freeze(['你好','nǐ hǎo','ní hǎo','ni3 hao3','ni2 hao3','ni3hao3','ni2hao3']),
  feedback:'你好！',
  options:Object.freeze([{match:'你好',branch:'greeting'}])
 }),
 Object.freeze({
  panda:'你好吗？',pinyin:'Nǐ hǎo ma?',ru:'Как дела?',audioKey:'你好吗',
  instruction:'Скажи «У меня всё хорошо». Можно добавить «А у тебя?»',
  accepted:Object.freeze([
   '我很好','我很好。','wǒ hěn hǎo','wo3 hen3 hao3','wo3hen3hao3',
   '我很好你呢','我很好，你呢？','wǒ hěn hǎo nǐ ne','wo3 hen3 hao3 ni3 ne5','wo3 hen3 hao3 ni3 ne','wo3hen3hao3ni3ne5'
  ]),
  feedback:'我很好。',
  options:Object.freeze([
   {match:'我很好你呢',branch:'asked-back'},
   {match:'wǒhěnhǎonǐne',branch:'asked-back'},
   {match:'wo3hen3hao3ni3ne5',branch:'asked-back'},
   {match:'wo3hen3hao3ni3ne',branch:'asked-back'}
  ])
 })
]);
export const REPLIES=Object.freeze({
 'asked-back':Object.freeze({hanzi:'我也很好，谢谢！',pinyin:'Wǒ yě hěn hǎo, xièxie!',ru:'У меня тоже всё хорошо, спасибо!',audioKey:'我也很好，谢谢'}),
 'short':Object.freeze({hanzi:'很好！',pinyin:'Hěn hǎo!',ru:'Хорошо!',audioKey:'很好'})
});
export const NEW_WORDS=Object.freeze([
 Object.freeze({hanzi:'吗',pinyin:'ma',ru:'частица вопроса'}),
 Object.freeze({hanzi:'很',pinyin:'hěn',ru:'используется перед прилагательным'}),
 Object.freeze({hanzi:'呢',pinyin:'ne',ru:'«а у тебя?» в 你呢'}),
 Object.freeze({hanzi:'也',pinyin:'yě',ru:'тоже'}),
 Object.freeze({hanzi:'谢谢',pinyin:'xièxie',ru:'спасибо'})
]);
export function normalize(value){
 return String(value??'').toLowerCase().normalize('NFC').trim()
 .replace(/[\s\u3000，。！？!?.,;；:：'"«»\-–—]/g,'');
}
export function verifyPilotAnswer(index,text){
 const line=PILOT_LINES[index];
 if(!line)return {ok:false,message:'Такой реплики нет в диалоге.'};
 const value=normalize(text);
 if(!value)return {ok:false,message:'Скажи или напиши ответ.'};
 if(line.accepted.some(a=>normalize(a)===value)){
  const selected=line.options.find(opt=>normalize(opt.match)===value);
  return {ok:true,message:'Верно!',branch:index===1?(selected?'asked-back':'short'):'greeting'};
 }
 return {ok:false,message:'Не совсем. '+line.instruction};
}
