/* Panda AI HSK 1–2 grammar v2: finite, reviewed parameterized templates.
 * Never infer tones from the microphone, and never rewrite unrecognized input.
 * v1 remains the first (exact-match) layer.
 */
import {correctPandaGrammarV1} from './panda-grammar-hsk12-v1.mjs?v=1';

const WHO=[
 {h:'我',p:'wǒ',sub:'Я',lo:'я',obj:'меня',dat:'мне',pos:'У меня',live:'живу',want:'хочу',can:'умею',like:'люблю',go:'иду',eat:'ем',learn:'учу',getUp:'встаю',sleep:'ложусь спать',work:'я работаю',buy:'купил(а)',breakfast:'завтракаю',drank:'выпил(а)'},
 {h:'你',p:'nǐ',sub:'Ты',lo:'ты',obj:'тебя',dat:'тебе',pos:'У тебя',live:'живёшь',want:'хочешь',can:'умеешь',like:'любишь',go:'идёшь',eat:'ешь',learn:'учишь',getUp:'встаёшь',sleep:'ложишься спать',work:'ты работаешь',buy:'купил(а)',breakfast:'завтракаешь',drank:'выпил(а)'},
 {h:'他',p:'tā',sub:'Он',lo:'он',obj:'его',dat:'ему',pos:'У него',live:'живёт',want:'хочет',can:'умеет',like:'любит',go:'идёт',eat:'ест',learn:'учит',getUp:'встаёт',sleep:'ложится спать',work:'он работает',buy:'купил',breakfast:'завтракает',drank:'выпил'},
 {h:'她',p:'tā',sub:'Она',lo:'она',obj:'её',dat:'ей',pos:'У неё',live:'живёт',want:'хочет',can:'умеет',like:'любит',go:'идёт',eat:'ест',learn:'учит',getUp:'встаёт',sleep:'ложится спать',work:'она работает',buy:'купила',breakfast:'завтракает',drank:'выпила'}
];
const L={
 who:WHO,other:WHO,
 role:[{h:'学生',p:'xuésheng',ru:'ученик'},{h:'老师',p:'lǎoshī',ru:'учитель'},{h:'医生',p:'yīshēng',ru:'врач'},{h:'厨师',p:'chúshī',ru:'повар'}],
 kin:[{h:'哥哥',p:'gēge',ru:'старший брат',count:'старших братьев',two:'старших брата'},
      {h:'姐姐',p:'jiějie',ru:'старшая сестра',count:'старших сестёр',two:'старшие сестры'},
      {h:'弟弟',p:'dìdi',ru:'младший брат',count:'младших братьев',two:'младших брата'},
      {h:'妹妹',p:'mèimei',ru:'младшая сестра',count:'младших сестёр',two:'младшие сестры'}],
 friend:[{h:'朋友',p:'péngyou',ru:'друг',two:'два друга',count:'друзей'}],
 thing:[{h:'钱',p:'qián',gen:'денег'},{h:'时间',p:'shíjiān',gen:'времени'},{h:'朋友',p:'péngyou',gen:'друзей'},{h:'哥哥',p:'gēge',gen:'старшего брата'}],
 name:[{h:'小明',p:'Xiǎomíng',ru:'Сяомин'},{h:'安娜',p:'Ānnà',ru:'Анна'},{h:'大卫',p:'Dàwèi',ru:'Давид'}],
 surname:[{h:'王',p:'Wáng',ru:'Ван'},{h:'李',p:'Lǐ',ru:'Ли'},{h:'张',p:'Zhāng',ru:'Чжан'}],
 city:[{h:'北京',p:'Běijīng',at:'в Пекине',to:'в Пекин'},
       {h:'上海',p:'Shànghǎi',at:'в Шанхае',to:'в Шанхай'},
       {h:'广州',p:'Guǎngzhōu',at:'в Гуанчжоу',to:'в Гуанчжоу'},
       {h:'深圳',p:'Shēnzhèn',at:'в Шэньчжэне',to:'в Шэньчжэнь'}],
 place:[{h:'学校',p:'xuéxiào',at:'в школе',to:'в школу'},
        {h:'家',p:'jiā',at:'дома',to:'домой'},
        {h:'公司',p:'gōngsī',at:'в офисе',to:'в офис'}],
 kinOrFriend:[{h:'哥哥',p:'gēge',two:'два старших брата'},{h:'姐姐',p:'jiějie',two:'две старшие сестры'},
              {h:'弟弟',p:'dìdi',two:'два младших брата'},{h:'妹妹',p:'mèimei',two:'две младшие сестры'},
              {h:'朋友',p:'péngyou',two:'два друга'}],
 animal:[{h:'猫',p:'māo',one:'одна кошка',three:'три кошки'},
         {h:'狗',p:'gǒu',one:'одна собака',three:'три собаки'}],
 drink:[{h:'茶',p:'chá',gen:'чая'},{h:'咖啡',p:'kāfēi',gen:'кофе'},{h:'水',p:'shuǐ',gen:'воды'}],
 action:[{h:'说中文',p:'shuō Zhōngwén',ru:'говорить по-китайски'},
         {h:'做饭',p:'zuò fàn',ru:'готовить'},
         {h:'游泳',p:'yóuyǒng',ru:'плавать'}],
 wantAction:[{h:'喝茶',p:'hē chá',ru:'пить чай'},{h:'吃饭',p:'chīfàn',ru:'есть'},
             {h:'学中文',p:'xué Zhōngwén',ru:'учить китайский'}],
 likeAction:[{h:'喝茶',p:'hē chá',ru:'пить чай'},{h:'学中文',p:'xué Zhōngwén',ru:'учить китайский'},
             {h:'看电影',p:'kàn diànyǐng',ru:'смотреть кино'}],
 food:[{h:'中国菜',p:'Zhōngguó cài',ru:'китайскую кухню'},
       {h:'牛肉面',p:'niúròu miàn',ru:'лапшу с говядиной'},
       {h:'咖啡',p:'kāfēi',ru:'кофе'}],
 hour:[{h:'六',p:'liù',time:'шесть'},{h:'七',p:'qī',time:'семь'},
       {h:'八',p:'bā',time:'восемь'},{h:'九',p:'jiǔ',time:'девять'},
       {h:'十',p:'shí',time:'десять'}],
 adj:[{h:'高',p:'gāo',comp:'выше'},{h:'矮',p:'ǎi',comp:'ниже'}],
 partner:[{h:'朋友',p:'péngyou',inst:'другом'}, {h:'妈妈',p:'māma',inst:'мамой'},
          {h:'爸爸',p:'bàba',inst:'папой'}, {h:'哥哥',p:'gēge',inst:'старшим братом'}]
};
const WHY={
 wh:'В специальном вопросе с 什么、谁、几、哪里 и подобными вопросительными словами частица 吗 не нужна.',
 anota:'В конструкции A-不-A или 有没有 вопрос уже выражен повтором; 吗 в конце не добавляют.',
 neg:'Отрицание 是 — 不是; отрицание 有 — 没有. Не смешивай эти формы.',
 intro:'После 叫 (зовут) и 姓 (фамилия) глагол-связка 是 не нужен.',
 classifier:'Для количества «два» перед счётным словом обычно 两. Подбирай счётное слово к существительному: 个、本、只、杯.',
 order:'Проверь порядок: модальный глагол перед действием; «住在 + место», а место действия «在 + место» ставится перед глаголом.',
 time:'В обычном предложении время действия ставится перед глаголом: 我七点起床.',
 compare:'Сравнение: A 比 B + прилагательное. Очень (很) после 比 здесь не добавляют.',
 degree:'很 / 非常 ставятся перед 喜欢, а не после него.',
 together:'Сначала 和 / 跟 + человек, затем 一起 + действие.'
};
const T=[];
function add(group,id,wrong,right,py,ru,slots=['who']){T.push({id,group,wrong,right,py,ru,slots});}
// Twelve WH-question patterns.
add('wh','P01','{who}叫什么名字吗','{who}叫什么名字？','{who} jiào shénme míngzi?','Как зовут {who.obj}?');
add('wh','P02','{who}是谁吗','{who}是谁？','{who} shì shéi?','Кто {who.lo}?');
add('wh','P03','{who}几岁吗','{who}几岁？','{who} jǐ suì?','Сколько {who.dat} лет?');
add('wh','P04','{who}多大吗','{who}多大？','{who} duō dà?','Сколько {who.dat} лет?');
add('wh','P05','{who}住在哪里吗','{who}住在哪里？','{who} zhù zài nǎlǐ?','Где {who.lo} {who.live}?');
add('wh','P06','{who}住在哪儿吗','{who}住在哪儿？','{who} zhù zài nǎr?','Где {who.lo} {who.live}?');
add('wh','P07','{who}喜欢什么吗','{who}喜欢什么？','{who} xǐhuan shénme?','Что нравится {who.dat}?');
add('wh','P08','今天星期几吗','今天星期几？','Jīntiān xīngqī jǐ?','Какой сегодня день недели?',[]);
add('wh','P09','现在几点吗','现在几点？','Xiànzài jǐ diǎn?','Который сейчас час?',[]);
add('wh','P10','那是什么吗','那是什么？','Nà shì shénme?','Что это там?',[]);
add('wh','P11','{who}有几个{kin}吗','{who}有几个{kin}？','{who} yǒu jǐ ge {kin}?','Сколько {kin.count} у {who.obj}?',['who','kin']);
add('wh','P12','{who}做什么工作吗','{who}做什么工作？','{who} zuò shénme gōngzuò?','Кем {who.work}?');
// Five A-not-A patterns.
add('anota','P13','{who}是不是{role}吗','{who}是不是{role}？','{who} shì bu shì {role}?','{who.sub} — {role.ru} или нет?',['who','role']);
add('anota','P14','{who}有没有{kin}吗','{who}有没有{kin}？','{who} yǒu méiyǒu {kin}?','Есть ли у {who.obj} {kin.ru}?',['who','kin']);
add('anota','P15','{who}会不会{action}吗','{who}会不会{action}？','{who} huì bu huì {action}?','{who.sub} {who.can} {action.ru} или нет?',['who','action']);
add('anota','P16','{who}去不去学校吗','{who}去不去学校？','{who} qù bu qù xuéxiào?','{who.sub} {who.go} в школу или нет?');
add('anota','P17','{who}想不想{wantAction}吗','{who}想不想{wantAction}？','{who} xiǎng bu xiǎng {wantAction}?','{who.sub} {who.want} {wantAction.ru} или нет?',['who','wantAction']);
// Negation and names.
add('neg','P18','{who}没是{role}','{who}不是{role}。','{who} bú shì {role}.','{who.sub} не {role.ru}.',['who','role']);
add('neg','P19','{who}不有{thing}','{who}没有{thing}。','{who} méiyǒu {thing}.','{who.pos} нет {thing.gen}.',['who','thing']);
add('intro','P20','{who}叫是{name}','{who}叫{name}。','{who} jiào {name}.','{who.obj} зовут {name.ru}.',['who','name']);
add('intro','P21','{who}姓是{surname}','{who}姓{surname}。','{who} xìng {surname}.','{who.sub} по фамилии {surname.ru}.',['who','surname']);
// Six classifier patterns.
add('classifier','P22','{who}有二个{kinOrFriend}','{who}有两个{kinOrFriend}。','{who} yǒu liǎng ge {kinOrFriend}.','{who.pos} {kinOrFriend.two}.',['who','kinOrFriend']);
add('classifier','P23','{who}有二本书','{who}有两本书。','{who} yǒu liǎng běn shū.','{who.pos} две книги.');
add('classifier','P24','{who}有一个书','{who}有一本书。','{who} yǒu yì běn shū.','{who.pos} одна книга.');
add('classifier','P25','{who}有一个{animal}','{who}有一只{animal}。','{who} yǒu yì zhī {animal}.','{who.pos} {animal.one}.',['who','animal']);
add('classifier','P26','这里有三个{animal}','这里有三只{animal}。','Zhèlǐ yǒu sān zhī {animal}.','Здесь {animal.three}.',['animal']);
add('classifier','P27','{who}喝了二杯{drink}','{who}喝了两杯{drink}。','{who} hē le liǎng bēi {drink}.','{who.sub} {who.drank} две чашки {drink.gen}.',['who','drink']);
// Seven word-order patterns.
add('order','P28','{who}住{city}在','{who}住在{city}。','{who} zhù zài {city}.','{who.sub} {who.live} {city.at}.',['who','city']);
add('order','P29','{who}{city}想去','{who}想去{city}。','{who} xiǎng qù {city}.','{who.sub} {who.want} поехать {city.to}.',['who','city']);
add('order','P30','{who}会中文说','{who}会说中文。','{who} huì shuō Zhōngwén.','{who.sub} {who.can} говорить по-китайски.');
add('order','P31','{who}想中文学','{who}想学中文。','{who} xiǎng xué Zhōngwén.','{who.sub} {who.want} учить китайский.');
add('order','P32','{who}每天中文学','{who}每天学中文。','{who} měitiān xué Zhōngwén.','{who.sub} каждый день {who.learn} китайский.');
add('order','P33','{who}学习在{place}中文','{who}在{place}学中文。','{who} zài {place} xué Zhōngwén.','{who.sub} {who.learn} китайский {place.at}.',['who','place']);
add('order','P34','{who}吃在{place}饭','{who}在{place}吃饭。','{who} zài {place} chīfàn.','{who.sub} {who.eat} {place.at}.',['who','place']);
// Five time patterns, restricted to HSK1–2 clock hours.
add('time','P35','{who}起床{hour}点','{who}{hour}点起床。','{who} {hour} diǎn qǐchuáng.','{who.sub} {who.getUp} в {hour.time}.',['who','hour']);
add('time','P36','{who}睡觉晚上{hour}点','{who}晚上{hour}点睡觉。','{who} wǎnshang {hour} diǎn shuìjiào.','{who.sub} {who.sleep} вечером в {hour.time}.',['who','hour']);
add('time','P37','{who}去上班{hour}点','{who}{hour}点去上班。','{who} {hour} diǎn qù shàngbān.','{who.sub} {who.go} на работу в {hour.time}.',['who','hour']);
add('time','P38','{who}吃早饭早上','{who}早上吃早饭。','{who} zǎoshang chī zǎofàn.','{who.sub} {who.breakfast} утром.');
add('time','P39','{who}每天起床{hour}点','{who}每天{hour}点起床。','{who} měitiān {hour} diǎn qǐchuáng.','{who.sub} каждый день {who.getUp} в {hour.time}.',['who','hour']);
// Comparison, degree, and doing something together.
add('compare','P40','{who}比{other}很{adj}','{who}比{other}{adj}。','{who} bǐ {other} {adj}.','{who.sub} {adj.comp} {other.obj}.',['who','other','adj']);
add('compare','P41','{who}比{adj}{other}','{who}比{other}{adj}。','{who} bǐ {other} {adj}.','{who.sub} {adj.comp} {other.obj}.',['who','adj','other']);
add('degree','P42','{who}喜欢很{likeAction}','{who}很喜欢{likeAction}。','{who} hěn xǐhuan {likeAction}.','{who.sub} очень {who.like} {likeAction.ru}.',['who','likeAction']);
add('degree','P43','{who}喜欢非常{food}','{who}非常喜欢{food}。','{who} fēicháng xǐhuan {food}.','{who.sub} очень {who.like} {food.ru}.',['who','food']);
add('together','P44','{who}和一起{partner}去','{who}和{partner}一起去。','{who} hé {partner} yìqǐ qù.','{who.sub} вместе с {partner.inst} {who.go}.',['who','partner']);
add('together','P45','{who}跟一起{partner}吃饭','{who}跟{partner}一起吃饭。','{who} gēn {partner} yìqǐ chīfàn.','{who.sub} вместе с {partner.inst} {who.eat}.',['who','partner']);

export const PANDA_GRAMMAR_TEMPLATES_V2=Object.freeze(T.map(t=>Object.freeze(t)));
const normalize=v=>String(v??'').normalize('NFC').replace(/[\s\u3000，。！？?!,.、]/g,'');
const fill=(tpl,values,field)=>tpl.replace(/\{([a-zA-Z]+)(?:\.([a-zA-Z]+))?\}/g,(_,slot,fieldOverride)=>{
 const value=values[slot];if(!value)throw new Error('Unknown slot: '+slot);
 const result=value[fieldOverride||field];if(result==null)throw new Error('Unknown field: '+slot+'.'+(fieldOverride||field));
 return String(result);
});
function* combinations(slots,i=0,values={}){
 if(i===slots.length){yield values;return;}
 const slot=slots[i];
 for(const value of L[slot]||[])yield* combinations(slots,i+1,{...values,[slot]:value});
}
const CASES=new Map();
for(const t of T){
 for(const vals of combinations(t.slots)){
  if(vals.who&&vals.other&&vals.who.h===vals.other.h)continue;
  const wrong=fill(t.wrong,vals,'h'),hanzi=fill(t.right,vals,'h');
  const pinyin=fill(t.py,vals,'p').replace(/^./u,c=>c.toUpperCase());
  const ru=fill(t.ru,vals,'ru');
  const key=normalize(wrong);
  if(CASES.has(key)&&CASES.get(key).hanzi!==hanzi)throw new Error('Ambiguous grammar correction: '+wrong);
  CASES.set(key,Object.freeze({id:t.id,group:t.group,wrong,hanzi,pinyin,ru,why:WHY[t.group]}));
 }
}
export const PANDA_GRAMMAR_VARIANT_COUNT_V2=CASES.size;
export function correctPandaGrammarV2(raw,{prompt=null,confidence=null}={}){
 const exact=correctPandaGrammarV1(raw,{prompt,confidence});
 if(exact)return exact;
 const input=String(raw??'').trim();
 const row=CASES.get(normalize(input));if(!row)return null;
 const uncertain=typeof confidence==='number'&&confidence<.85;
 const correction={category:'grammar',ruleId:row.id,hanzi:row.hanzi,pinyin:row.pinyin,
  ru:row.ru,why:row.why,title:'Объяснение ошибки · HSK 1–2',
  retry:'Попробуй сказать или написать исправленный вариант.'};
 if(uncertain){correction.uncertain=true;correction.why='Проверь распознанный текст: браузер мог ослышаться. Если фраза записана верно: '+row.why;}
 const topic=Number(prompt?.lesson||prompt?.topic)||1;
 return {kind:'correction',lesson:topic,
  spoken:{known:false,hanzi:input,pinyin:null,translation:null,topic,
   probable:'Возможный смысл: '+row.ru,correction},
  message:uncertain?'Проверь распознанную фразу перед исправлением.':'Панда объясняет грамматическую конструкцию.'};
}
