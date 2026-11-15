/* Panda AI v358 — explicitly reviewed question/answer pairs from the
 * user's November 14 Luvvoice transcript and existing audio timestamps.
 * This is content routing, not microphone recognition or pronunciation grading.
 * No synthetic voice and no fabricated audio files. */
const RECORDED = [
 // Learning and speaking
 ['你会写汉字吗','Nǐ huì xiě Hànzì ma?','Ты умеешь писать иероглифы?','会写一点','Huì xiě yìdiǎn.','Умею немного.',1],
 ['你觉得中文难吗','Nǐ juéde Zhōngwén nán ma?','Как думаешь, китайский сложный?','有一点难','Yǒu yìdiǎn nán.','Немного сложный.',1],
 ['你每天学习吗','Nǐ měitiān xuéxí ma?','Ты учишься каждый день?','是，我每天学习','Shì, wǒ měitiān xuéxí.','Да, я учусь каждый день.',1],
 ['你想学什么','Nǐ xiǎng xué shénme?','Что ты хочешь изучать?','我想学中文','Wǒ xiǎng xué Zhōngwén.','Я хочу изучать китайский.',1],
 ['你会读中文吗','Nǐ huì dú Zhōngwén ma?','Ты умеешь читать по-китайски?','我会读一点中文','Wǒ huì dú yìdiǎn Zhōngwén.','Я немного умею читать по-китайски.',1],
 ['你能说慢一点吗','Nǐ néng shuō màn yìdiǎn ma?','Можешь говорить чуть медленнее?','可以，我说慢一点','Kěyǐ, wǒ shuō màn yìdiǎn.','Да, буду говорить помедленнее.',1],
 // My day (lesson 7 review)
 ['你早上做什么','Nǐ zǎoshang zuò shénme?','Что ты делаешь утром?','我早上吃早饭','Wǒ zǎoshang chī zǎofàn.','Утром я завтракаю.',7],
 ['你起床以后做什么','Nǐ qǐchuáng yǐhòu zuò shénme?','Что делаешь после того, как встаёшь?','我起床以后洗脸','Wǒ qǐchuáng yǐhòu xǐliǎn.','После подъёма я умываюсь.',7],
 ['你每天喝水吗','Nǐ měitiān hē shuǐ ma?','Ты каждый день пьёшь воду?','是，我每天喝水','Shì, wǒ měitiān hē shuǐ.','Да, каждый день пью воду.',7],
 ['你上午做什么','Nǐ shàngwǔ zuò shénme?','Что ты делаешь до обеда?','我上午学习中文','Wǒ shàngwǔ xuéxí Zhōngwén.','До обеда я учу китайский.',7],
 ['你中午做什么','Nǐ zhōngwǔ zuò shénme?','Что ты делаешь в полдень?','我中午吃饭','Wǒ zhōngwǔ chīfàn.','В полдень я ем.',7],
 ['你下午做什么','Nǐ xiàwǔ zuò shénme?','Что ты делаешь после обеда?','我下午看书','Wǒ xiàwǔ kàn shū.','После обеда я читаю.',7],
 ['你晚上做什么','Nǐ wǎnshang zuò shénme?','Что ты делаешь вечером?','我晚上听音乐','Wǒ wǎnshang tīng yīnyuè.','Вечером я слушаю музыку.',7],
 ['你每天运动吗','Nǐ měitiān yùndòng ma?','Ты тренируешься каждый день?','是，我每天运动','Shì, wǒ měitiān yùndòng.','Да, каждый день занимаюсь спортом.',7],
 ['你回家以后做什么','Nǐ huí jiā yǐhòu zuò shénme?','Что делаешь после возвращения домой?','我回家以后休息','Wǒ huí jiā yǐhòu xiūxi.','Вернувшись домой, я отдыхаю.',7],
 ['你今天做什么','Nǐ jīntiān zuò shénme?','Что ты делаешь сегодня?','我今天教中文','Wǒ jīntiān jiāo Zhōngwén.','Сегодня я преподаю китайский.',7],
 // Numbers
 ['你有几个朋友','Nǐ yǒu jǐ ge péngyou?','Сколько у тебя друзей?','我有三个朋友','Wǒ yǒu sān ge péngyou.','У меня три друга.',3],
 ['你有几本书','Nǐ yǒu jǐ běn shū?','Сколько у тебя книг?','我有两本书','Wǒ yǒu liǎng běn shū.','У меня две книги.',3],
 ['你有几支笔','Nǐ yǒu jǐ zhī bǐ?','Сколько у тебя ручек?','我有一支笔','Wǒ yǒu yì zhī bǐ.','У меня одна ручка.',3],
 ['你想买几个苹果','Nǐ xiǎng mǎi jǐ ge píngguǒ?','Сколько яблок хочешь купить?','我想买两个苹果','Wǒ xiǎng mǎi liǎng ge píngguǒ.','Хочу купить два яблока.',3],
 ['你有几杯水','Nǐ yǒu jǐ bēi shuǐ?','Сколько у тебя стаканов воды?','我有一杯水','Wǒ yǒu yì bēi shuǐ.','У меня один стакан воды.',3],
 ['你每天学几个汉字','Nǐ měitiān xué jǐ ge Hànzì?','Сколько иероглифов учишь каждый день?','我每天学五个汉字','Wǒ měitiān xué wǔ ge Hànzì.','Я учу пять иероглифов в день.',3],
 ['你会数到十吗','Nǐ huì shǔ dào shí ma?','Можешь посчитать до десяти?','会，我会数到十','Huì, wǒ huì shǔ dào shí.','Да, я могу досчитать до десяти.',3],
 ['你最喜欢哪个数字','Nǐ zuì xǐhuan nǎ ge shùzì?','Какое число тебе нравится больше всего?','我最喜欢八','Wǒ zuì xǐhuan bā.','Больше всего мне нравится восемь.',3],
 // Languages, family and basic identity
 ['你会说俄语吗','Nǐ huì shuō Éyǔ ma?','Ты говоришь по-русски?','我会说一点俄语','Wǒ huì shuō yìdiǎn Éyǔ.','Я немного говорю по-русски.',2],
 ['你会说英语吗','Nǐ huì shuō Yīngyǔ ma?','Ты говоришь по-английски?','我会说一点英语','Wǒ huì shuō yìdiǎn Yīngyǔ.','Я немного говорю по-английски.',2],
 ['我可以叫你熊猫吗','Wǒ kěyǐ jiào nǐ Xióngmāo ma?','Можно называть тебя Пандой?','可以，你可以叫我熊猫','Kěyǐ, nǐ kěyǐ jiào wǒ Xióngmāo.','Да, можешь называть меня Пандой.',1],
 ['你有姐姐吗','Nǐ yǒu jiějie ma?','У тебя есть старшая сестра?','没有，我没有姐姐','Méiyǒu, wǒ méiyǒu jiějie.','Нет, у меня нет старшей сестры.',6],
 ['你有弟弟吗','Nǐ yǒu dìdi ma?','У тебя есть младший брат?','没有，我没有弟弟','Méiyǒu, wǒ méiyǒu dìdi.','Нет, у меня нет младшего брата.',6],
 ['你妈妈好吗','Nǐ māma hǎo ma?','Как поживает твоя мама?','她很好，谢谢','Tā hěn hǎo, xièxie.','Она хорошо, спасибо.',6],
 ['你爸爸怎么样','Nǐ bàba zěnmeyàng?','Как поживает твой папа?','他很好，谢谢','Tā hěn hǎo, xièxie.','Он хорошо, спасибо.',6],
 ['你姐姐怎么样','Nǐ jiějie zěnmeyàng?','Как поживает твоя старшая сестра?','我没有姐姐','Wǒ méiyǒu jiějie.','У меня нет старшей сестры.',6],
 ['你哥哥几岁','Nǐ gēge jǐ suì?','Сколько лет твоему старшему брату?','他五岁','Tā wǔ suì.','Ему пять лет.',6],
 ['你妹妹几岁','Nǐ mèimei jǐ suì?','Сколько лет твоей младшей сестре?','她一岁','Tā yí suì.','Ей один год.',6],
 // Everyday mood and feedback
 ['你累吗','Nǐ lèi ma?','Ты устал(а)?','我不累','Wǒ bú lèi.','Я не устал(а).',1],
 ['你开心吗','Nǐ kāixīn ma?','Ты рад(а)?','我很开心','Wǒ hěn kāixīn.','Я очень рад(а).',1],
 ['你高兴吗','Nǐ gāoxìng ma?','Ты доволен(на)?','我很高兴','Wǒ hěn gāoxìng.','Я очень рад(а).',1],
 ['你现在有空吗','Nǐ xiànzài yǒu kòng ma?','У тебя сейчас есть время?','有，我现在有空','Yǒu, wǒ xiànzài yǒu kòng.','Да, сейчас я свободен(на).',1],
 ['你怎么了','Nǐ zěnme le?','Что с тобой?','我没事，谢谢','Wǒ méi shì, xièxie.','Всё в порядке, спасибо.',1],
 ['你想休息吗','Nǐ xiǎng xiūxi ma?','Ты хочешь отдохнуть?','我想休息一下','Wǒ xiǎng xiūxi yíxià.','Я хочу немного отдохнуть.',1],
 ['你今天心情怎么样','Nǐ jīntiān xīnqíng zěnmeyàng?','Какое у тебя сегодня настроение?','我今天心情很好','Wǒ jīntiān xīnqíng hěn hǎo.','У меня сегодня хорошее настроение.',1],
 ['你冷吗','Nǐ lěng ma?','Тебе холодно?','我不冷','Wǒ bù lěng.','Мне не холодно.',7],
 ['你需要帮助吗','Nǐ xūyào bāngzhù ma?','Тебе нужна помощь?','谢谢，我不需要帮助','Xièxie, wǒ bù xūyào bāngzhù.','Спасибо, помощь не нужна.',1]
];
const norm=s=>String(s||'').normalize('NFC').replace(/[。！？?!，,\s]/gu,'');
const table=new Map(RECORDED.map(([question,qpy,qru,answer,apy,aru,lesson])=>[norm(question),{question,qpy,qru,answer,apy,aru,lesson}]));
export function recordedPandaAnswer(raw,allowed=[1]){
 const hit=table.get(norm(raw));if(!hit)return null;
 if(!allowed.includes(hit.lesson))return {kind:'locked',lesson:hit.lesson,
   spoken:{known:false,hanzi:raw,translation:null},
   message:'Этот вопрос изучается в уроке '+hit.lesson+'. Сначала открой соответствующий урок.'};
 return {kind:'question',lesson:hit.lesson,
   spoken:{known:true,hanzi:raw,pinyin:hit.qpy,translation:hit.qru,topic:hit.lesson},
   reply:{hanzi:hit.answer+'。',pinyin:hit.apy,ru:hit.aru,context:'Ответ из проверенного списка пользовательских MP3'},
   followup:null};
}
export const RECORDED_PANDA_QA=Object.freeze(RECORDED.map(row=>Object.freeze([...row])));
