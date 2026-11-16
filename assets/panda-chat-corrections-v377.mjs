/* Panda AI v377: reviewed, bounded corrections for 不有 + basic nouns.
 * This is a written/transcribed-text grammar check, NOT an acoustic tone grade.
 * Never infer translations for unknown words or invent an audio clip.
 */
const normalize=value=>String(value??'').normalize('NFC').replace(/[\s\u3000，。！？?!,.、]/g,'');
const SUBJECTS=Object.freeze({
 '我':{py:'Wǒ',ru:'У меня'},
 '你':{py:'Nǐ',ru:'У тебя'},
 '他':{py:'Tā',ru:'У него'},
 '她':{py:'Tā',ru:'У неё'}
});
const OBJECTS=Object.freeze({
 '钱':{py:'qián',ru:'денег'},
 '时间':{py:'shíjiān',ru:'времени'},
 '朋友':{py:'péngyou',ru:'друзей'},
 '工作':{py:'gōngzuò',ru:'работы'},
 '书':{py:'shū',ru:'книг'},
 '车':{py:'chē',ru:'машины'}
});
export function correctCommonPhrase(raw){
 const input=String(raw??'').trim(),s=normalize(input);
 const m=/^(我|你|他|她)不有(钱|时间|朋友|工作|书|车)$/u.exec(s);
 if(!m)return null;
 const subject=SUBJECTS[m[1]],object=OBJECTS[m[2]];
 const ru=subject.ru+' нет '+object.ru+'.';
 const correction={hanzi:m[1]+'没有'+m[2]+'。',pinyin:subject.py+' méiyǒu '+object.py+'.',ru,
  why:'Для отрицания 有 (yǒu, «иметь») используется 没有 (méiyǒu), а не 不有.'};
 return {kind:'correction',lesson:1,spoken:{known:false,hanzi:input,
  pinyin:null,translation:null,topic:1,probable:ru,correction},
  message:correction.why};
}
