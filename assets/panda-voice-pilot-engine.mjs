// Minimal independent Android speech pilot: only two authorized Lesson 1 phrases.
export const PILOT_LINES=Object.freeze([
 Object.freeze({
  panda:'你好！',pinyin:'Nǐ hǎo!',ru:'Привет!',audioKey:'你好',
  instruction:'Ответь Панде: «Привет!»',
  accepted:Object.freeze(['你好','nǐ hǎo','ní hǎo','ni3 hao3','ni2 hao3','ni3hao3','ni2hao3']),
  feedback:'你好 — nǐ hǎo. В речи произносится ní hǎo.'
 }),
 Object.freeze({
  panda:'我是学生。',pinyin:'Wǒ shì xuésheng.',ru:'Я студент.',audioKey:'我是学生',
  instruction:'Повтори за Пандой: «Я студент».',
  accepted:Object.freeze(['我是学生','wǒ shì xuésheng','wo3 shi4 xue2 sheng5','wo3 shi4 xue2sheng','wo3shi4xue2sheng','wo3shi4xue2sheng5']),
  feedback:'我是学生 — Wǒ shì xuésheng. Порядок: 我 + 是 + 学生.'
 })
]);
export function normalize(value){
 return String(value??'').toLowerCase().normalize('NFC').trim()
 .replace(/[\s\u3000，。！？!?.,;；:：'"«»\-–—]/g,'');
}
export function verifyPilotAnswer(index,text){
 const line=PILOT_LINES[index];
 if(!line)return {ok:false,message:'Такой реплики нет в уроке.'};
 const value=normalize(text);
 if(!value)return {ok:false,message:'Произнеси или напиши ответ.'};
 if(line.accepted.some(a=>normalize(a)===value))return {ok:true,message:'✅ Верно! '+line.feedback};
 return {ok:false,message:'Пока не совпадает с образцом. '+line.instruction+' Подсказка: '+line.panda+' — '+line.pinyin+' В пиньине обязательно указывай тоны.'};
}
