// Reviewed text from user voice pack 2026-11-22. Audio files are separate, probe before enabling.
export const CLARIFICATION=[
  [
    "我没听懂。你可以再说一遍，或者换一种说法吗？",
    "Wǒ méi tīng dǒng. Nǐ kěyǐ zài shuō yí biàn, huòzhě huàn yì zhǒng shuōfǎ ma?",
    "Я не поняла. Можешь повторить или сказать по-другому?"
  ],
  [
    "我没听清楚，请再说一遍。",
    "Wǒ méi tīng qīngchu, qǐng zài shuō yí biàn.",
    "Я не расслышала, повтори, пожалуйста."
  ],
  [
    "你可以说慢一点吗？",
    "Nǐ kěyǐ shuō màn yìdiǎn ma?",
    "Можешь говорить медленнее?"
  ],
  [
    "你说的是什么？",
    "Nǐ shuō de shì shénme?",
    "О чём ты говоришь?"
  ],
  [
    "你说的是人名吗？",
    "Nǐ shuō de shì rénmíng ma?",
    "Ты говоришь об имени человека?"
  ],
  [
    "你能解释一下吗？",
    "Nǐ néng jiěshì yíxià ma?",
    "Можешь объяснить?"
  ],
  [
    "你可以用简单一点的中文说吗？",
    "Nǐ kěyǐ yòng jiǎndān yìdiǎn de Zhōngwén shuō ma?",
    "Можешь сказать на более простом китайском?"
  ],
  [
    "不客气！",
    "Bú kèqi!",
    "Пожалуйста!"
  ],
  [
    "我明白你的意思了。",
    "Wǒ míngbai nǐ de yìsi le.",
    "Я поняла, что ты имеешь в виду."
  ],
  [
    "你还想聊什么？",
    "Nǐ hái xiǎng liáo shénme?",
    "О чём ещё хочешь поговорить?"
  ],
  [
    "你喜欢做什么？",
    "Nǐ xǐhuan zuò shénme?",
    "Что любишь делать?"
  ],
  [
    "你喜欢喝什么？",
    "Nǐ xǐhuan hē shénme?",
    "Что любишь пить?"
  ],
  [
    "我喜欢喝茶。",
    "Wǒ xǐhuan hē chá.",
    "Я люблю пить чай."
  ],
  [
    "我喜欢吃竹子。",
    "Wǒ xǐhuan chī zhúzi.",
    "Я люблю есть бамбук."
  ],
  [
    "你为什么喜欢跑步？",
    "Nǐ wèishénme xǐhuan pǎobù?",
    "Почему ты любишь бегать?"
  ],
  [
    "你经常跑步吗？",
    "Nǐ jīngcháng pǎobù ma?",
    "Ты часто бегаешь?"
  ],
  [
    "你最喜欢什么运动？",
    "Nǐ zuì xǐhuan shénme yùndòng?",
    "Какой спорт ты больше всего любишь?"
  ],
  [
    "你有女朋友吗？",
    "Nǐ yǒu nǚpéngyou ma?",
    "У тебя есть девушка?"
  ],
  [
    "你们是怎么认识的？",
    "Nǐmen shì zěnme rènshi de?",
    "Как вы познакомились?"
  ],
  [
    "你喜欢她什么？",
    "Nǐ xǐhuan tā shénme?",
    "Что тебе в ней нравится?"
  ]
];
export const clarificationLine=n=>{const a=CLARIFICATION[n-1];return {hanzi:a[0],pinyin:a[1],ru:a[2],audioKey:a[0]}};
const norm=s=>String(s||'').normalize('NFC').replace(/[\p{P}\s]/gu,'');
const available=new Map();
export async function checkClarificationAudio(){
 await Promise.all(CLARIFICATION.map(async(a,i)=>{
  const src='./assets/panda-clarification-voice-20261122/clarify'+String(i+1).padStart(2,'0')+'.mp3';
  try{const res=await fetch(src,{method:'HEAD',cache:'no-store',signal:AbortSignal.timeout(5000)});if(res.ok&&/audio|application\/octet-stream/i.test(res.headers.get('content-type')||''))available.set(norm(a[0]),{src,start:0,end:null,source:'user-luvvoice-20261122'});}catch{}
 }));
}
export const lookupClarificationVoice=s=>available.get(norm(s))||null;
