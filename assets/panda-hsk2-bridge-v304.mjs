// Panda Go v304 — free bridge to the HSK 2 draft, NOT a paid HSK 2 unlock.
// Only four already-approved introductory words and reviewed mini-dialogues are public.
// Offline, deterministic; no network, TTS, invented audio or tonal evaluation.
const VOCAB=Object.freeze({
 '中文':{pinyin:'Zhōngwén',ru:'китайский язык',pos:'существительное',tones:'1 + 2',example:['我学习中文。','Wǒ xuéxí Zhōngwén.','Я изучаю китайский язык.']},
 '学习':{pinyin:'xuéxí',ru:'учиться, изучать',pos:'глагол',tones:'2 + 2',example:['我学习中文。','Wǒ xuéxí Zhōngwén.','Я изучаю китайский язык.']},
 '忙':{pinyin:'máng',ru:'занятый, занят',pos:'прилагательное',tones:'2',example:['我很忙。','Wǒ hěn máng.','Я занят.']},
 '很':{pinyin:'hěn',ru:'наречие перед прилагательным; не всегда означает сильное «очень»',pos:'наречие',tones:'3',example:['我很忙。','Wǒ hěn máng.','Я занят.']}
});
const normalize=value=>String(value??'').normalize('NFC').trim().replace(/[\s\u3000，。！？!?.,;；:：'"«»\-–—]/g,'');
const RECORDED=new Set(['你学习中文吗','我学习中文','你忙吗','我很忙','我不忙','中文','学习','忙','你为什么学习中文','因为我喜欢中文','很']);
const line=(hanzi,pinyin,ru,audioKey=null)=>({hanzi,pinyin,ru,audioKey:audioKey|| (RECORDED.has(normalize(hanzi))?normalize(hanzi):null)});
const studyQuestion=()=>({hanzi:'你学习中文吗？',pinyin:'Nǐ xuéxí Zhōngwén ma?',ru:'Ты изучаешь китайский?',lesson:1,intent:'hsk2-bridge-study',isContextual:true,accepted:['我学习中文'],instruction:'Можно ответить: 我学习中文。',audioKey:'你学习中文吗'});
const busyQuestion=()=>({hanzi:'你忙吗？',pinyin:'Nǐ máng ma?',ru:'Ты занят?',lesson:1,intent:'hsk2-bridge-busy',isContextual:true,accepted:['我很忙','我不忙'],instruction:'Ответь: 我很忙。 или 我不忙。',audioKey:'你忙吗'});
const reasonQuestion=()=>({hanzi:'你为什么学习中文？',pinyin:'Nǐ wèishénme xuéxí Zhōngwén?',ru:'Почему ты изучаешь китайский?',lesson:1,intent:'hsk2-bridge-why',isContextual:true,accepted:['因为我喜欢中文'],instruction:'Можно ответить: 因为我喜欢中文。',audioKey:'你为什么学习中文'});
const spoken=(raw,pinyin=null,ru=null)=>({known:true,hanzi:String(raw).trim(),pinyin,translation:ru,topic:1});
const example=(row)=>line(row[0],row[1],row[2]);
const wordPattern=/^(中文|学习|忙|很)(是什么意思|什么意思|的意思是什么|怎么读|怎么念|怎么发音|的拼音是什么|是几声|的声调是什么|是什么词性|怎么用|怎么造句)$/;
const sentencePattern=/^用(中文|学习|忙|很)造句$/;
export const HSK2_BRIDGE_WORDS=Object.freeze(Object.keys(VOCAB));
export function answerHsk2Bridge(raw,{prompt=null}={}){
 const input=String(raw??'').trim(),s=normalize(input);
 if(!s||s.length>180)return null;
 const intro=/^(?:hsk2|hsk二级|hsk第二级|第二级|第二水平|二级|второйуровень|уровень2|уровеньhsk2)$/i.test(s);
 if(intro)return {kind:'explanation',lesson:1,spoken:spoken(input),reply:line('我学习中文。','Wǒ xuéxí Zhōngwén.','Я изучаю китайский язык.'),explanation:'HSK 2 готовится. В этой бесплатной вводной практике доступны 中文、学习、忙、很, примеры и короткие вопросы. Остальные темы пока не открыты.',followup:studyQuestion()};
 let word=null,intent='meaning';
 const ex=sentencePattern.exec(s),zh=wordPattern.exec(s);
 if(ex){word=ex[1];intent='example'}
 else if(zh){word=zh[1];intent=/怎么读|怎么念|发音|拼音|几声|声调/.test(zh[2])?'tone':/词性/.test(zh[2])?'grammar':/怎么用|造句/.test(zh[2])?'example':'meaning'}
 else {
  const isRuQuestion=/(что\s+значит|что\s+означает|переведи|как\s+читается|произнос|пиньинь|какие?\s+тоны?|составь\s+предложение|приведи\s+пример|часть\s+речи)/i.test(input);
  if(isRuQuestion){
   const words=HSK2_BRIDGE_WORDS.filter(w=>input.includes(w));
   if(words.length===1){word=words[0];intent=/(предложени|пример)/i.test(input)?'example':/(читается|произнос|пиньинь|тон)/i.test(input)?'tone':/часть\s+речи/i.test(input)?'grammar':'meaning'}
  }
 }
 if(word){
  const info=VOCAB[word],[hanzi,pinyin,ru]=info.example;
  // Give a short, word-specific teaching note. Do not attach the 忙 grammar rule to 中文 or 学习.
  const rule=word==='忙'?'Прилагательное: 我很忙, без 是.':word==='很'?'Перед прилагательным 很 часто не усиливает значение.':null;
  const card={hanzi:word,pinyin:info.pinyin,ru:info.ru,pos:info.pos,tones:info.tones,
   example:{hanzi,pinyin,ru},rule};
  const text=word+' — '+info.pinyin+' — '+info.ru+'. Тоны: '+info.tones+
   '. Пример: '+hanzi+' · '+pinyin+' — '+ru+'.'+(rule?' '+rule:'');
  return {kind:'explanation',lesson:1,spoken:spoken(input),reply:intent==='example'?example(info.example):line(word,info.pinyin,info.ru),
   explanation:text,wordCard:card,followup:['忙','很'].includes(word)?busyQuestion():studyQuestion()};
 }
 if(s==='我是很忙'||s==='我是忙'||s==='他是很忙'||s==='她是很忙'){
  const subject=s[0],py={我:'Wǒ',他:'Tā',她:'Tā'}[subject],ru={我:'Я занят.',他:'Он занят.',她:'Она занята.'}[subject];
  return {kind:'correction',lesson:1,spoken:{known:false,hanzi:input,pinyin:null,translation:null,probable:ru,topic:1,correction:{hanzi:subject+'很忙。',pinyin:py+' hěn máng.',ru,why:'Перед прилагательным 忙 не ставим 是. Правильно: '+subject+'很忙。'}},message:'Перед прилагательным 忙 не ставим 是. Правильно: '+subject+'很忙。'};
 }
 if(s==='你学习中文吗')return {kind:'question',lesson:1,spoken:spoken(input,'Nǐ xuéxí Zhōngwén ma?','Ты изучаешь китайский?'),reply:line('我学习中文。','Wǒ xuéxí Zhōngwén.','Я изучаю китайский язык.'),followup:busyQuestion()};
 if(s==='你为什么学习中文')return {kind:'question',lesson:1,spoken:spoken(input,'Nǐ wèishénme xuéxí Zhōngwén?','Почему ты изучаешь китайский?'),reply:line('因为我喜欢中文。','Yīnwèi wǒ xǐhuan Zhōngwén.','Потому что мне нравится китайский язык.'),followup:busyQuestion()};
 if(s==='因为我喜欢中文')return {kind:prompt?.intent==='hsk2-bridge-why'?'answer':'statement',lesson:1,spoken:spoken(input,'Yīnwèi wǒ xǐhuan Zhōngwén.','Потому что мне нравится китайский язык.'),reply:line('很好！','Hěn hǎo!','Отлично!','很好'),followup:busyQuestion()};
 if(s==='你忙吗')return {kind:'question',lesson:1,spoken:spoken(input,'Nǐ máng ma?','Ты занят?'),reply:line('我不忙。','Wǒ bù máng.','Я не занят.'),followup:studyQuestion()};
 if(s==='我学习中文'||s==='你学习中文'||s==='他学习中文'||s==='她学习中文'){
  const subject=s[0],py={我:'Wǒ',你:'Nǐ',他:'Tā',她:'Tā'}[subject],ru={我:'Я изучаю',你:'Ты изучаешь',他:'Он изучает',她:'Она изучает'}[subject]+' китайский язык.';
  return {kind:prompt?.intent==='hsk2-bridge-study'&&subject==='我'?'answer':'statement',lesson:1,spoken:spoken(input,py+' xuéxí Zhōngwén.',ru),reply:line('很好！','Hěn hǎo!','Отлично!','很好'),followup:subject==='我'?reasonQuestion():busyQuestion()};
 }
 if(['我很忙','我不忙','你很忙','他很忙','她很忙'].includes(s)){
  const subject=s[0],negative=s==='我不忙',py={我:'Wǒ',你:'Nǐ',他:'Tā',她:'Tā'}[subject],ru=({我:'Я',你:'Ты',他:'Он',她:'Она'})[subject]+(negative?' не занят.':' занят'+(subject==='她'?'а':'')+'.');
  return {kind:prompt?.intent==='hsk2-bridge-busy'&&subject==='我'?'answer':'statement',lesson:1,spoken:spoken(input,py+(negative?' bù máng.':' hěn máng.'),ru),reply:line('很好！','Hěn hǎo!','Хорошо!','很好'),followup:studyQuestion()};
 }
 return null;
}
