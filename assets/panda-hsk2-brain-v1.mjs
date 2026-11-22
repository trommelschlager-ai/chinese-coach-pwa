import {HSK2_TOPICS} from './panda-hsk2-brain-data-v1.mjs';
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
export function replyHSK2(raw,id,index,done=false){
 const t=getTopic(id),s=norm(raw),q=t?.questions[index];
 if(!t||!q||!s)return {kind:'unknown'};
 const exact=!done&&q.options.find(a=>norm(a[0])===s);if(exact)return {kind:'accepted',answer:line(exact)};
 if(/^(?:你呢|那你呢)$/.test(s))return {kind:'question',line:line(q.options[0])};
 if(/^(?:再见|拜拜|明天见)$/.test(s))return {kind:'end',line:line(['再见！','Zàijiàn!','До свидания!'])};
 if(/перевод|значит|означает|как сказать|пиньинь|什么意思|怎么说|怎么读/i.test(raw)){
 const w=[...t.words,...HSK2_TOPICS.filter(x=>x.id!==id).flatMap(x=>x.words)].find(w=>s.includes(norm(w.zh))||s.includes(norm(w.ru))||s.includes(norm(w.py)));if(w)return {kind:'word',line:line([w.zh,w.py,w.ru])};}
 for(const topic of [t,...HSK2_TOPICS.filter(x=>x.id!==id)]){const m=topic.questions.find(x=>norm(x.q)===s);if(m)return {kind:'question',line:line(m.options[0])};}
 const a=aliases.find(x=>x[0].test(s));if(a)return {kind:'question',line:line(getTopic(a[1]).questions[a[2]].options[0])};
 const isQuestion=/[?？]/.test(raw)||/(?:吗|呢)$/.test(s)||/^你.*(?:什么|哪里|哪儿|几点|多少|为什么|怎么样)/.test(s);
 if(!done&&!isQuestion&&patterns[id]?.[index]?.test(s))return {kind:'variant'};
 const phrase=t.phrases.find(a=>norm(a[0])===s);if(phrase)return {kind:'example',line:line(phrase)};
 return {kind:'unknown',line:line(['请再说一遍。','Qǐng zài shuō yí biàn.','Пока не могу уверенно понять. Попробуй сказать иначе.'])};
}
