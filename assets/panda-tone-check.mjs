// Panda Go — проверка письменного пиньиня (не акустическая оценка голоса).
// Данные утверждённых учебных тем HSK 1. Никаких обращений к платной AI-модели.
export const TONE_ITEMS = Object.freeze([
  {hanzi:'你好',meaning:'Привет',standard:'nǐ hǎo',spoken:'ní hǎo',rule:'Два третьих тона подряд: первый в речи становится вторым.'},
  {hanzi:'我',meaning:'Я',standard:'wǒ',spoken:'wǒ',rule:'我 — третий тон.'},
  {hanzi:'你',meaning:'Ты',standard:'nǐ',spoken:'nǐ',rule:'你 — третий тон.'},
  {hanzi:'老师',meaning:'Учитель',standard:'lǎo shī',spoken:'lǎo shī',rule:'老 — третий, 师 — первый тон.'},
  {hanzi:'学生',meaning:'Ученик',standard:'xué sheng',spoken:'xué sheng',rule:'В 学生 второй слог обычно нейтральный.'},
  {hanzi:'今天',meaning:'Сегодня',standard:'jīn tiān',spoken:'jīn tiān',rule:'Оба слога произносятся первым тоном.'},
  {hanzi:'天气',meaning:'Погода',standard:'tiān qì',spoken:'tiān qì',rule:'天 — первый, 气 — четвёртый тон.'},
  {hanzi:'星期天',meaning:'Воскресенье',standard:'xīng qī tiān',spoken:'xīng qī tiān',rule:'Во всех трёх слогах первый тон.'},
  {hanzi:'一',meaning:'Один (отдельно)',standard:'yī',spoken:'yī',rule:'Отдельно 一 читается первым тоном.'},
  {hanzi:'一百',meaning:'Сто',standard:'yì bǎi',spoken:'yì bǎi',rule:'一 перед нечетвёртым тоном обычно меняется на четвёртый.'},
  {hanzi:'一个',meaning:'Один предмет',standard:'yí ge',spoken:'yí ge',rule:'一 меняется на второй тон перед 个 (основной тон gè; в сочетании часто нейтральный ge).'},
  {hanzi:'一杯茶',meaning:'Чашка чая',standard:'yì bēi chá',spoken:'yì bēi chá',rule:'一 перед слогом первого тона читается четвёртым.'},
  {hanzi:'不要',meaning:'Не надо',standard:'bú yào',spoken:'bú yào',rule:'不 перед четвёртым тоном меняется на второй.'},
  {hanzi:'谢谢',meaning:'Спасибо',standard:'xiè xie',spoken:'xiè xie',rule:'Второй слог 谢 обычно произносится нейтральным тоном.'}
]);

const COMBINING = {'\u0304':1,'\u0301':2,'\u030c':3,'\u0300':4};
function syllable(value) {
  const raw=String(value).toLowerCase().normalize('NFD');
  const match=raw.match(/([1-5])$/); const numeric=match?Number(match[1]):null;
  let tone=null,base='';
  for(const c of raw.replace(/[1-5]$/,'')){
    if(COMBINING[c]) { if(tone!==null)return null; tone=COMBINING[c];}
    else if(c==='\u0308'){} // ü and u: share the same base for tone comparisons.
    else if(/[a-z:]/.test(c)) base+=c;
    else return null;
  }
  base=base.replace(/u:/g,'u').replace(/v/g,'u');
  if(!base || !/^[a-z]+$/.test(base) || (numeric!==null&&tone!==null&&numeric!==tone))return null;
  return {base,tone:numeric??tone??5,marked: numeric!==null||tone!==null};
}
export function checkPinyin(itemId,input,mode='spoken') {
  const item=TONE_ITEMS.find(x=>x.hanzi===itemId);
  if(!item) return {ok:false,message:'Выбери слово или фразу из списка.'};
  const expected=(mode==='standard'?item.standard:item.spoken).split(/\s+/).map(syllable);
  const parts=String(input||'').trim().replace(/[，。！？,.!?;；]+/g,' ').split(/\s+/).filter(Boolean);
  if(parts.length!==expected.length)return {ok:false,message:'Введи '+expected.length+' слог(а/ов) через пробел. Например: '+(mode==='standard'?item.standard:item.spoken)+'.'};
  const actual=parts.map(syllable);
  if(actual.some(x=>!x))return {ok:false,message:'Используй пиньинь со знаками тонов (nǐ hǎo) или цифрами (ni3 hao3).'};
  const expectedStrings=(mode==='standard'?item.standard:item.spoken).split(/\s+/);
  for(let i=0;i<expected.length;i++){
    if(actual[i].base!==expected[i].base)return {ok:false,message:'Слог '+(i+1)+': проверь буквы. Ожидалось «'+expectedStrings[i]+'». '+item.rule};
    if(!actual[i].marked&&expected[i].tone!==5)return {ok:false,message:'В слоге '+(i+1)+' не указан тон. Добавь знак или цифру.'};
    if(actual[i].tone!==expected[i].tone)return {ok:false,message:'Слог '+(i+1)+': ожидается '+(expected[i].tone===5?'нейтральный':expected[i].tone+'-й')+' тон («'+expectedStrings[i]+'»). '+item.rule};
  }
  return {ok:true,message:'Верно! '+item.hanzi+' — '+item.spoken+'. '+item.rule};
}
