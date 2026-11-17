/* Panda Teacher v441 — bounded, reviewed text explanations.
 * Never infer learner intention or grade acoustic tones from ASR text.
 * Do not synthesize speech, invent MP3 or silently change lesson content.
 */
const norm=v=>String(v??'').normalize('NFC').replace(/[\s\u3000，。！？?!,.、]/g,'');
const FAMILY=Object.freeze({
 哥哥:{py:'gēge',exists:'старший брат',none:'старшего брата',two:'старших брата'},
 姐姐:{py:'jiějie',exists:'старшая сестра',none:'старшей сестры',two:'старшие сестры'},
 弟弟:{py:'dìdi',exists:'младший брат',none:'младшего брата',two:'младших брата'},
 妹妹:{py:'mèimei',exists:'младшая сестра',none:'младшей сестры',two:'младшие сестры'}
});
const question=p=>norm(typeof p==='string'?p:p?.hanzi||p?.panda);
const detail=(raw,category,probable,correction)=>({
 kind:'correction',lesson:6,
 spoken:{known:false,hanzi:raw,pinyin:null,translation:probable,topic:6,
   probable,correction:{...correction,category}},
 message:category==='meaning'?'Смысл понятен, но ответ не на вопрос.':
  'Панда объясняет грамматическое правило.'
});
export function explainPandaAnswer441(raw,{prompt=null,confidence=null}={}){
 const input=String(raw??'').trim(),s=norm(input);
 const asked=/^你有(哥哥|姐姐|弟弟|妹妹)吗$/.exec(question(prompt))?.[1];
 const desire=/^我(要|想要)(?:一个)?(哥哥|姐姐|弟弟|妹妹)$/.exec(s);
 let output=null;
 if(asked&&desire?.[2]===asked){
  const r=FAMILY[asked];
  const copula=asked==='姐姐'||asked==='妹妹'?'была':'был';
  output=detail(input,'meaning','Я хочу, чтобы у меня '+copula+' '+r.exists+'.',{
   title:'Правильное предложение, но другой смысл',
   hanzi:'我有一个'+asked+'。',pinyin:'Wǒ yǒu yí ge '+r.py+'.',
   ru:'У меня есть '+r.exists+'.',
   label:'Если ты хотел ответить, что родственник есть',
   why:'要 (yào) — «хотеть», а 有 (yǒu) — «иметь». Ты сказал о желании, а Панда спрашивала, есть ли у тебя '+r.exists+'.',
   retry:'Ответь снова: 我有… (есть) или 我没有… (нет).'
  });
 }
 const neg=/^我不有(?:一个)?(哥哥|姐姐|弟弟|妹妹)$/.exec(s);
 if(!output&&neg){
  const r=FAMILY[neg[1]];
  output=detail(input,'grammar','Ты пытаешься сказать, что у тебя нет '+r.none+'.',{
   title:'Отрицание глагола 有',
   hanzi:'我没有'+neg[1]+'。',pinyin:'Wǒ méiyǒu '+r.py+'.',
   ru:'У меня нет '+r.none+'.',
   why:'Чтобы сказать «не иметь», используй 没有 (méiyǒu), а не 不有 (bù yǒu).',
   retry:'Попробуй повторить исправленную фразу.'
  });
 }
 const two=/^我有二个(哥哥|姐姐|弟弟|妹妹)$/.exec(s);
 if(!output&&two){
  const r=FAMILY[two[1]];
  output=detail(input,'grammar','Ты говоришь о двух родственниках.',{
   title:'Два человека: 两个',
   hanzi:'我有两个'+two[1]+'。',pinyin:'Wǒ yǒu liǎng ge '+r.py+'.',
   ru:'У меня есть '+(two[1]==='哥哥'?'два старших брата':two[1]==='弟弟'?'два младших брата':two[1]==='姐姐'?'две старшие сестры':'две младшие сестры')+'.',
   why:'Перед счётным словом 个 для количества два обычно используют 两 (liǎng), а не 二 (èr).',
   retry:'Повтори правильный вариант.'
  });
 }
 if(!output)return null;
 // A browser transcript may be wrong; only suggest a possible interpretation.
 if(typeof confidence==='number'&&confidence<.85){
  output.spoken.correction={...output.spoken.correction,uncertain:true,
   why:'Распознавание речи может ошибаться. Если ты действительно сказал эту фразу: '+output.spoken.correction.why};
  output.message='Сначала проверь распознанный текст — браузер мог ослышаться.';
 }
 return output;
}
