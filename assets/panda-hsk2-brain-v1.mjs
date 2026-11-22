import {HSK2_TOPICS} from './panda-hsk2-brain-data-v1.mjs';
import {respondToPandaChat} from './panda-hsk2-smalltalk-v16.mjs?v=3';
import {recordedPandaAnswer} from './panda-recorded-qa-v358.mjs?v=381';
import {clarificationLine} from './panda-clarification-map-v504.mjs';
export const norm=s=>String(s||'').normalize('NFC').replace(/[\p{P}\s]/gu,'').toLowerCase();
export const getTopic=id=>HSK2_TOPICS.find(t=>t.id===Number(id));
export const line=a=>({hanzi:a[0],pinyin:a[1]||'',ru:a[2]||'',audioKey:a[0]});
export const prompt=q=>line([q.q,q.p,q.ru]);
const patterns={
101:[/^我(?:来自|是)[\p{Script=Han}]{1,12}$/u,/^我(?:现在)?住在[\p{Script=Han}]{1,14}$/u,/^我(?:的爱好是|喜欢|不喜欢)[\p{Script=Han}]{1,15}$/u],
102:[/^(?:我)?(?:每天|早上)?[一二两三四五六七八九十0-9]{1,3}点半?起床$/u,/^(?:我)?(?:早上)?(?:洗脸|刷牙|吃早饭|不吃早饭|喝茶|喝咖啡|去上班)$/u,/^(?:我)?起床以后(?:洗脸|刷牙|吃早饭|喝茶|喝咖啡)$/u,/^(?:我)?(?:早上)?(?:吃|不吃)早饭$/u,/^(?:我)?(?:每天)?[一二两三四五六七八九十0-9]{1,3}点半?去上班$/u,/^(?:我)?(?:晚上)?[一二两三四五六七八九十0-9]{1,3}点半?睡觉$/u],
103:[/^我(?:现在)?(?:不工作|在[\p{Script=Han}]{1,12}工作)$/u,/^(?:我)?(?:在[\p{Script=Han}]{1,12}学习|不在学校学习)$/u,/^(?:我)?(?:会|不会)说(?:一点)?中文$/u],
104:[/^我(?:喜欢|不喜欢|的爱好是)[\p{Script=Han}]{1,16}$/u,/^我周末(?:喜欢|常常|有时候|不)[\p{Script=Han}]{1,16}$/u,/^(?:我)?(?:很喜欢|喜欢|不喜欢)运动$/u],
105:[/^(?:我)?(?:明天(?:下午)?)?(?:有空|没空|没有时间|有时间)$/u,/^(?:我们)?(?:上午|下午|晚上)?[一二两三四五六七八九十0-9]{1,3}点半?(?:见面)?吧?$/u,/^(?:我们)?一起(?:去公园|吃饭|喝咖啡|看电影|学习中文)吧?$/u],
106:[/^我昨天(?:看了电影|听了音乐|看了书|去了公园|上班了|没有上班|跑步了|游泳了|没做什么)$/u,/^(?:我)?(?:昨天)?(?:没有运动|没运动|跑步了|游泳了|运动了)$/u,/^(?:我)?(?:去过|没去过|没有去过)上海$/u],
107:[/^我(?:明天)?(?:打算|想|准备|不打算)[\p{Script=Han}]{1,16}$/u,/^我(?:下个月)?(?:想去[\p{Script=Han}]{1,12}|不打算旅行)$/u,/^因为我(?:喜欢|想)[\p{Script=Han}]{1,16}$/u],
108:[/^我(?:想|不想)买[\p{Script=Han}]{1,16}$/u,/^我喜欢[\p{Script=Han}]{1,6}色$/u,/^(?:这件衣服)?(?:很好看|很漂亮|太贵了|很便宜|不喜欢)$/u],
109:[/^(?:我)?(?:今天)?(?:很好|身体很好|不舒服|有点儿不舒服|好多了)$/u,/^(?:我)?(?:有点儿)?(?:头疼|发烧了|不舒服|没事)$/u,/^我(?:现在)?想(?:休息|休息一下|看医生|喝水)$/u],
110:[/^(?:你好)?我(?:也)?很高兴认识你$/u,/^(?:好啊|可以|不好意思我没空|下次吧|我周末没空)$/u,/^(?:我们)?在[\p{Script=Han}]{1,12}见面吧?$/u]};
const aliases=[[/^你从哪里来$|^你来自哪儿$/,101,0],[/^你(?:现在)?住在哪儿$/,101,1],[/^你(?:每天)?几点起床$/,102,0],[/^你在哪儿工作$|^你在哪里上班$/,103,0],[/^你会讲中文吗$/,103,2],[/^你明天有空吗$/,105,0],[/^你昨天干什么了$/,106,0],[/^你明天有什么计划$/,107,0],[/^你哪里不舒服$/,109,1]];
const BASIC=new Map([["很好","hěn hǎo","Очень хорошо."],["我很好","wǒ hěn hǎo","У меня всё хорошо."],["我也很好","wǒ yě hěn hǎo","У меня тоже всё хорошо."],["好","hǎo","Хорошо."],["还好","hái hǎo","Нормально."],["挺好的","tǐng hǎo de","Вполне хорошо."],["不错","búcuò","Неплохо."],["还不错","hái búcuò","Вполне неплохо."],["不太好","bú tài hǎo","Не очень хорошо."],["不好","bù hǎo","Плохо."],["我不好","wǒ bù hǎo","У меня не всё хорошо."],["我不太好","wǒ bú tài hǎo","У меня не очень хорошо."],["很累","hěn lèi","Очень устал(а)."],["我很累","wǒ hěn lèi","Я очень устал(а)."],["有点累","yǒudiǎn lèi","Немного устал(а)."],["很忙","hěn máng","Очень занят(а)."],["我很忙","wǒ hěn máng","Я очень занят(а)."],["很开心","hěn kāixīn","Очень рад(а)."],["很高兴","hěn gāoxìng","Очень рад(а)."],["谢谢","xièxie","Спасибо!"],["谢谢你","xièxie nǐ","Спасибо тебе!"],["非常感谢","fēicháng gǎnxiè","Большое спасибо!"],["多谢","duōxiè","Большое спасибо!"],["不客气","bú kèqi","Пожалуйста (в ответ на благодарность)."],["没关系","méi guānxi","Ничего страшного."],["对不起","duìbuqǐ","Извини."],["不好意思","bù hǎoyìsi","Извини, неловко."],["是","shì","Да; быть."],["是的","shì de","Да."],["对","duì","Верно."],["不是","bú shì","Нет, не так."],["不","bù","Нет; не."],["有","yǒu","Есть."],["没有","méiyǒu","Нет; не имеется."],["会","huì","Умею."],["不会","bú huì","Не умею."],["可以","kěyǐ","Можно; могу."],["不可以","bù kěyǐ","Нельзя."],["喜欢","xǐhuan","Нравится."],["不喜欢","bù xǐhuan","Не нравится."],["想","xiǎng","Хочу."],["不想","bù xiǎng","Не хочу."],["有空","yǒu kòng","Есть свободное время."],["没空","méi kòng","Нет свободного времени."],["吃了","chī le","Уже поел(а)."],["没吃","méi chī","Не ел(а)."],["我还没吃","wǒ hái méi chī","Я ещё не ел(а)."],["我知道","wǒ zhīdào","Я знаю."],["不知道","bù zhīdào","Не знаю."],["我不知道","wǒ bù zhīdào","Я не знаю."],["我明白了","wǒ míngbai le","Я понял(а)."],["明白了","míngbai le","Понятно."],["不明白","bù míngbai","Не понимаю."],["听不懂","tīng bu dǒng","Не понимаю на слух."],["我也是","wǒ yě shì","Я тоже."],["你呢","nǐ ne","А ты?"],["再见","zàijiàn","До свидания!"],["明天见","míngtiān jiàn","До завтра!"],["好啊","hǎo a","Хорошо!"],["好的","hǎo de","Хорошо."],["当然","dāngrán","Конечно."],["你好吗","nǐ hǎo ma","Как дела?"],["你今天怎么样","nǐ jīntiān zěnmeyàng","Как у тебя сегодня дела?"],["你叫什么名字","nǐ jiào shénme míngzi","Как тебя зовут?"],["你喜欢喝什么","nǐ xǐhuan hē shénme","Что ты любишь пить?"],["你吃了吗","nǐ chī le ma","Ты уже поел(а)?"],["你吃饭了吗","nǐ chīfàn le ma","Ты уже поел(а)?"]].map(a=>[norm(a[0]),a]));
export function knownHSK2(raw){
 const k=norm(raw);let a=BASIC.get(k);
 if(!a)for(const t of HSK2_TOPICS){
  const w=t.words.find(w=>norm(w.zh)===k);if(w){a=[w.zh,w.py,w.ru];break;}
  a=t.phrases.find(a=>norm(a[0])===k)||t.questions.flatMap(q=>[[q.q,q.p,q.ru],...q.options]).find(a=>norm(a[0])===k);if(a)break;
 }
 return a?line([raw,a[1],a[2]]):null;
}
const R={
 activity:['你今天做什么？','Nǐ jīntiān zuò shénme?','Что ты сегодня делаешь?'],
 rest:['你想休息吗？','Nǐ xiǎng xiūxi ma?','Хочешь отдохнуть?'],
 thanks:['不客气！','Bú kèqi!','Пожалуйста!'],
 practice:['你想练习什么？','Nǐ xiǎng liànxí shénme?','Что хочешь потренировать?'],
 understand:['好的，我明白了。','Hǎo de, wǒ míngbai le.','Хорошо, я поняла.'],
 slow:['可以，我说慢一点。','Kěyǐ, wǒ shuō màn yìdiǎn.','Хорошо, буду говорить медленнее.'],
 repeat:['可以，我再说一遍。','Kěyǐ, wǒ zài shuō yí biàn.','Хорошо, повторю.']
};
function everydayShort(raw,context){
 const k=norm(raw),spoken=knownHSK2(raw);
 const respond=(a,awaiting=null,followup=null,action=null)=>({kind:'social',line:line(a),spoken,context:{awaiting},...(followup?{followup:line(followup)}:{}),...(action?{action}:{})});
 if(/^(?:谢谢|谢谢你|非常感谢|多谢)$/.test(k))return respond(R.thanks,'topic');
 if(/^(?:你好吗|你今天怎么样|你最近好吗|你还好吗)$/.test(k))return respond(['我很好，你呢？','Wǒ hěn hǎo, nǐ ne?','У меня всё хорошо, а у тебя?'],'mood');
 if(/^(?:我(?:也|今天)?(?:很)?好|很好|好|还好|挺好的|不错|还不错)$/.test(k)&&context?.awaiting==='mood')return respond(R.activity,'activity');
 if(/^(?:我)?(?:不太好|不好|很累|有点累)$/.test(k)&&context?.awaiting==='mood')return respond(R.rest,'offerRest');
 if(/^(?:我)?(?:很忙|很开心|很高兴)$/.test(k)&&context?.awaiting==='mood')return respond(R.activity,'activity');
 if(context?.awaiting==='offerRest'&&/^(?:想|不想|可以|好|好啊|好的|不用了)$/.test(k))return respond(R.understand,null,R.practice);
 if(/^(?:对不起|不好意思)$/.test(k))return respond(['没关系，我们慢慢来。','Méi guānxi, wǒmen mànmàn lái.','Ничего страшного, давай потихоньку.']);
 if(/^(?:我)?(?:不知道|不明白|听不懂)$/.test(k))return respond(['没关系，我们慢慢来。','Méi guānxi, wǒmen mànmàn lái.','Ничего страшного, давай потихоньку.']);
 if(/^(?:请)?(?:你能)?(?:再说一遍|重复一遍)(?:吗)?$/.test(k))return respond(R.repeat,context?.awaiting,null,'repeat');
 if(/^(?:请)?(?:你能)?(?:说慢一点|慢一点)(?:吗)?$/.test(k))return respond(R.slow,context?.awaiting,null,'slow');
 if(/^(?:我)?明白了$/.test(k))return respond(R.understand,null,R.practice);
 return null;
}
function clarificationContext(raw,context){
 const k=norm(raw),known=knownHSK2(raw),previous=context?.awaiting;
 const say=(id,awaiting,spoken=known,extra={})=>({kind:'social',line:clarificationLine(id),spoken,context:{...context,awaiting,lastClarification:id,...extra}});
 const annotated=(py,ru)=>line([raw,py,ru]);
 const afterRun=()=>previous==='run-frequency'?say(15,'run-reason',annotated('Wǒ xǐhuan pǎobù.','Я люблю бегать.')):say(16,'run-frequency',annotated('Wǒ xǐhuan pǎobù.','Я люблю бегать.'));
 if(/^(?:我)?(?:很|最)?喜欢跑步$/.test(k))return afterRun();
 if(previous==='run-frequency'&&/^(?:我)?(?:每天|经常|常常|有时候|不常|很少)(?:跑步)?$/.test(k)){
  const a={每天:['měitiān','Каждый день.'],经常:['jīngcháng','Часто.'],常常:['chángcháng','Часто.'],有时候:['yǒu shíhou','Иногда.'],不常:['bù cháng','Нечасто.'],很少:['hěn shǎo','Редко.']};const m=k.match(/^(我)?(每天|经常|常常|有时候|不常|很少)(跑步)?$/);const v=a[m[2]];return say(15,'run-reason',annotated((m[1]?'Wǒ ':'')+v[0]+(m[3]?' pǎobù':''),m[3]?v[1].replace(/\.$/,'')+' бегаю.':v[1]));
 }
 if(previous==='run-frequency'&&/^(?:是的|是|对|不|没有)$/.test(k))return say(15,'run-reason');
 if(previous==='run-reason'&&/^(?:因为)?(?:跑步)?(?:对身体好|对健康好|很有意思|让我开心|我喜欢运动)$/.test(k))return say(17,'sport');
 if(/^(?:我)?喜欢(?:运动|游泳|打篮球|踢足球)$/.test(k))return say(17,'sport');
 if(/^(?:我)?喜欢(?:一个女孩|一个女生|一个女孩子|一个女朋友)$/.test(k)){
 const z=k.replace(/^我?/,'').slice(2),d={'一个女孩':['yí ge nǚhái','одна девушка'],'一个女生':['yí ge nǚshēng','одна девушка'],'一个女孩子':['yí ge nǚháizi','одна девушка']};
 // A girl the learner likes is not necessarily their girlfriend.
 if(z==='一个女朋友')return say(6,'clarify',null);
 return say(18,'relationship-status',annotated((k.startsWith('我')?'Wǒ ':'')+'xǐhuan '+d[z][0],'Мне нравится одна девушка.'));
 }
 if(/^(?:我)?(?:现在)?有女朋友(?:了)?$/.test(k)||previous==='relationship-status'&&/^(?:有|有啊|是的|对)$/.test(k))return say(19,'relationship-how',known||annotated('','У меня есть девушка.'),{relationshipConfirmed:true});
 if(/^(?:我)?(?:现在)?(?:没有|没)女朋友$/.test(k)||previous==='relationship-status'&&/^(?:没有|没|没有啊)$/.test(k))return say(10,'topic',known||annotated('','У меня нет девушки.'),{relationshipConfirmed:false});
 if(previous==='relationship-how'&&context?.relationshipConfirmed&&/^(?:我们)?(?:是)?(?:在(?:学校|公司|网上|中国)|通过朋友|朋友介绍)(?:认识的|认识|介绍的)?$/.test(k))return say(20,'relationship-likes');
 if(/^(?:你)(?:最)?喜欢喝什么$/.test(k))return say(13,'drink',annotated('Nǐ xǐhuan hē shénme?','Что ты любишь пить?'));
 if(/^(?:你)(?:最)?喜欢吃什么$/.test(k))return say(14,'food',annotated('Nǐ xǐhuan chī shénme?','Что ты любишь есть?'));
 if(/^(?:我)?喜欢喝(?:茶|咖啡|水|牛奶)$/.test(k))return say(12,'drink',known);
 if(/^(?:我)?喜欢[\p{Script=Han}]{1,20}$/u.test(k)&&!known){
 const tail=k.replace(/^我?喜欢/,'');const learned=knownHSK2(tail);
 if(!learned&&!/^(?:看书|看电影|听音乐|学中文|吃饭|喝水|旅游|唱歌|画画|跳舞)$/.test(tail))return say(previous==='clarify'?6:4,'clarify',annotated('','Частично: «Мне нравится…». Значение «'+tail+'» не уточнено.'),{unresolved:tail});
 }
 return null;
}
const foodQuestion=/^(?:你|你们)(?:今天|早上|已经)?(?:吃了(?:饭|早饭|早餐)?吗|吃(?:饭|早饭|早餐)(?:了|过)?吗|吃过(?:饭|早饭|早餐)?了吗|吃过吗|吃了吗|吃没吃饭|吃饭了没有|吃了没有)$/u;
const foodReplies={
 yes:['吃了，谢谢。','Chī le, xièxie.','Да, уже поела, спасибо.'],
 no:['你想不想喝茶？','Nǐ xiǎng bu xiǎng hē chá?','Хочешь чаю?']
};
export function replyHSK2(raw,id,index,done=false,context=null){
 const input=norm(raw);
 const everyday=everydayShort(raw,context);if(everyday)return everyday;
 if(foodQuestion.test(input)){
 const p=input.includes('早饭')?'Nǐ chī zǎofàn le ma?':input.includes('早餐')?'Nǐ chī zǎocān le ma?':input==='你吃了吗'?'Nǐ chī le ma?':'';
 return {kind:'social',line:line(foodReplies.yes),spoken:line([raw,p|| (input==='你吃饭了吗'?'Nǐ chīfàn le ma?':''),'Ты уже поел(а)?']),context:{awaiting:'breakfastToday',turn:(context?.turn||0)+1}};
 }
 if(context?.awaiting==='breakfastToday'&&/^(?:我)?(?:还)?没(?:有)?(?:吃(?:饭|早饭|早餐)?)?(?:呢)?$/u.test(input))return {kind:'social',line:line(foodReplies.no),spoken:line([raw,'','Я ещё не ел(а).']),context:{awaiting:'offerTea'}};
 if(context?.awaiting==='breakfastToday'&&/^(?:我)?(?:已经)?吃(?:了|过了|过)(?:饭|早饭|早餐)?(?:了)?$/u.test(input))return {kind:'social',line:line(['很好！','Hěn hǎo!','Отлично!']),spoken:line([raw,'','Я уже поел(а).']),context:{awaiting:null}};
 if(/^(?:你好|您好|哈喽|嗨|早上好|中午好|下午好|晚上好)$/u.test(input)){
 const greetings={你好:['你好！','Nǐ hǎo!','Привет!'],您好:['你好！','Nǐ hǎo!','Здравствуйте!'],哈喽:['你好！','Nǐ hǎo!','Привет!'],嗨:['你好！','Nǐ hǎo!','Привет!'],早上好:['早上好！','Zǎoshang hǎo!','Доброе утро!'],中午好:['中午好！','Zhōngwǔ hǎo!','Добрый день!'],下午好:['下午好！','Xiàwǔ hǎo!','Добрый день!'],晚上好:['晚上好！','Wǎnshang hǎo!','Добрый вечер!']};
 return {kind:'social',line:line(greetings[input]),spoken:line([raw,greetings[input][1],greetings[input][2]]),context:{awaiting:null}};
 }

 const t=getTopic(id),s=norm(raw),q=t?.questions[index];
 if(!t||!q||!s)return {kind:'unknown'};
 const exact=!done&&q.options.find(a=>norm(a[0])===s);if(exact)return {kind:'accepted',answer:line(exact)};
 const contextual=clarificationContext(raw,context);if(contextual)return contextual;
 if(/^(?:你呢|那你呢)$/.test(s)&&context?.awaiting){const reply=respondToPandaChat(raw,context);if(reply.supported)return {kind:'social',line:line(reply.line),context:reply.context,spoken:line([raw,'Nǐ ne?','А ты?'])};}
 if(/^(?:你呢|那你呢)$/.test(s))return {kind:'question',line:line(q.options[0]),spoken:line([raw,'Nǐ ne?','А ты?'])};
 if(/^(?:再见|拜拜|明天见)$/.test(s))return {kind:'end',line:line(['再见！','Zàijiàn!','До свидания!'])};
 if(/перевод|значит|означает|как сказать|пиньинь|什么意思|怎么说|怎么读/i.test(raw)){
 const w=[...t.words,...HSK2_TOPICS.filter(x=>x.id!==id).flatMap(x=>x.words)].find(w=>s.includes(norm(w.zh))||s.includes(norm(w.ru))||s.includes(norm(w.py)));if(w)return {kind:'word',line:line([w.zh,w.py,w.ru])};}
 for(const topic of [t,...HSK2_TOPICS.filter(x=>x.id!==id)]){const m=topic.questions.find(x=>norm(x.q)===s);if(m)return {kind:'question',line:line(m.options[0]),spoken:line([raw,m.p,m.ru])};}
 const a=aliases.find(x=>x[0].test(s));if(a){const m=getTopic(a[1]).questions[a[2]];return {kind:'question',line:line(m.options[0]),spoken:line([raw,'',m.ru])};}
 const isQuestion=/[?？]/.test(raw)||/(?:吗|呢)$/.test(s)||/^你.*(?:什么|哪里|哪儿|几点|多少|为什么|怎么样)/.test(s);
 if(!done&&!isQuestion&&patterns[id]?.[index]?.test(s))return {kind:'variant',spoken:knownHSK2(raw)};
 const phrase=t.phrases.find(a=>norm(a[0])===s);if(phrase)return {kind:'example',line:line(phrase),spoken:line(phrase)};
 const recorded=recordedPandaAnswer(raw,[1,2,3,4,5,6,7])||recordedPandaAnswer(raw,[1],{course:'hsk2-day'});
 const dayRecorded=recorded?.kind==='clarify'?recordedPandaAnswer(raw,[1],{course:'hsk2-day'}):recorded;
 if(dayRecorded?.kind==='question')return {kind:'social',line:dayRecorded.reply,spoken:line([raw,dayRecorded.spoken.pinyin,dayRecorded.spoken.translation]),context};
 const social=respondToPandaChat(raw,context);if(social.supported)return {kind:'social',line:line(social.line),context:social.context,spoken:knownHSK2(raw)};
 if(knownHSK2(raw)&&/^(?:很好|我很好|还好|不错|挺好的|我也很好)$/.test(s))return {kind:'social',line:line(R.activity),spoken:knownHSK2(raw),context:{awaiting:'activity'}};
 if(knownHSK2(raw)&&/^(?:好|好的|好啊|当然|对|是的|不客气|没关系)$/.test(s))return {kind:'social',line:line(R.practice),spoken:knownHSK2(raw),context:{awaiting:'topic'}};
 return {kind:'unknown',line:clarificationLine(context?.lastClarification===1?7:1),context:{...context,lastClarification:context?.lastClarification===1?7:1}};
}
