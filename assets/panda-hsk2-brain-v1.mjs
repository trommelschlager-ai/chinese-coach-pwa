import {HSK2_TOPICS} from './panda-hsk2-brain-data-v1.mjs';
import {respondToPandaChat} from './panda-hsk2-smalltalk-v16.mjs?v=3';
import {recordedPandaAnswer} from './panda-recorded-qa-v358.mjs?v=381';
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
const foodQuestion=/^(?:你|你们)(?:今天|早上|已经)?(?:吃了(?:饭|早饭|早餐)?吗|吃(?:饭|早饭|早餐)(?:了|过)?吗|吃过(?:饭|早饭|早餐)?了吗|吃过吗|吃了吗|吃没吃饭|吃饭了没有|吃了没有)$/u;
const foodReplies={
 yes:['吃了，谢谢。','Chī le, xièxie.','Да, уже поела, спасибо.'],
 no:['你想不想喝茶？','Nǐ xiǎng bu xiǎng hē chá?','Хочешь чаю?']
};
export function replyHSK2(raw,id,index,done=false,context=null){
 const input=norm(raw);
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
 if(/^(?:你呢|那你呢)$/.test(s)&&context?.awaiting){const reply=respondToPandaChat(raw,context);if(reply.supported)return {kind:'social',line:line(reply.line),context:reply.context,spoken:line([raw,'Nǐ ne?','А ты?'])};}
 if(/^(?:你呢|那你呢)$/.test(s))return {kind:'question',line:line(q.options[0]),spoken:line([raw,'Nǐ ne?','А ты?'])};
 if(/^(?:再见|拜拜|明天见)$/.test(s))return {kind:'end',line:line(['再见！','Zàijiàn!','До свидания!'])};
 if(/перевод|значит|означает|как сказать|пиньинь|什么意思|怎么说|怎么读/i.test(raw)){
 const w=[...t.words,...HSK2_TOPICS.filter(x=>x.id!==id).flatMap(x=>x.words)].find(w=>s.includes(norm(w.zh))||s.includes(norm(w.ru))||s.includes(norm(w.py)));if(w)return {kind:'word',line:line([w.zh,w.py,w.ru])};}
 for(const topic of [t,...HSK2_TOPICS.filter(x=>x.id!==id)]){const m=topic.questions.find(x=>norm(x.q)===s);if(m)return {kind:'question',line:line(m.options[0]),spoken:line([raw,m.p,m.ru])};}
 const a=aliases.find(x=>x[0].test(s));if(a){const m=getTopic(a[1]).questions[a[2]];return {kind:'question',line:line(m.options[0]),spoken:line([raw,'',m.ru])};}
 const isQuestion=/[?？]/.test(raw)||/(?:吗|呢)$/.test(s)||/^你.*(?:什么|哪里|哪儿|几点|多少|为什么|怎么样)/.test(s);
 if(!done&&!isQuestion&&patterns[id]?.[index]?.test(s))return {kind:'variant'};
 const phrase=t.phrases.find(a=>norm(a[0])===s);if(phrase)return {kind:'example',line:line(phrase),spoken:line(phrase)};
 const recorded=recordedPandaAnswer(raw,[1,2,3,4,5,6,7])||recordedPandaAnswer(raw,[1],{course:'hsk2-day'});
 const dayRecorded=recorded?.kind==='clarify'?recordedPandaAnswer(raw,[1],{course:'hsk2-day'}):recorded;
 if(dayRecorded?.kind==='question')return {kind:'social',line:dayRecorded.reply,spoken:line([raw,dayRecorded.spoken.pinyin,dayRecorded.spoken.translation]),context};
 const social=respondToPandaChat(raw,context);if(social.supported)return {kind:'social',line:line(social.line),context:social.context};
 return {kind:'unknown',line:line(['请再说一遍。','Qǐng zài shuō yí biàn.','Пока не могу уверенно понять. Попробуй сказать иначе.'])};
}
