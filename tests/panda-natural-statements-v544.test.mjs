import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {respondToNaturalStatement as reply} from '../assets/panda-natural-statements-v544.mjs';

test('all 18 declared Mandarin professions have individual follow-ups and tone-marked pinyin',()=>{
 const jobs=['老师','学生','医生','工程师','护士','老板','经理','司机','厨师','服务员','警察','销售员','工人','翻译','演员','商人','程序员','设计师'];
 for(const job of jobs){
  const r=reply('我是'+job+'。');
  assert(r,job+' should be recognized');
  assert(r.spoken.pinyin?.startsWith('Wǒ shì '),job);
  assert.equal(r.spoken.toneVerified,false);
  assert(r.reply.hanzi.includes(job),job+' must be acknowledged naturally');
  assert(r.reply.pinyin && r.reply.ru,job);
  assert(!/我没听懂/.test(r.reply.hanzi),job);
 }
});
test('negated jobs use 不 tone sandhi and never affirm the wrong job',()=>{
 for(const phrase of ['我不是医生','我不是护士','我不是程序员']){
  const r=reply(phrase);
  assert(r.spoken.pinyin.startsWith('Wǒ bú shì '));
  assert.equal(r.reply.hanzi,'明白了。你做什么工作？');
 }
});
test('11 named workplaces preserve natural Mandarin and truthful Russian translations',()=>{
 const workplaces=['学校','公司','医院','饭店','餐厅','商店','工厂','办公室','银行','超市','家'];
 for(const workplace of workplaces){
  const r=reply('我在'+workplace+'工作');
  assert(r,'Unrecognized workplace: '+workplace);
  assert.equal(r.reply.hanzi,'你喜欢你的工作吗？');
  assert.equal(r.next,'job-liking');
 }
 assert.equal(reply('我在家工作').spoken.translation,'Я работаю дома.');
 assert.equal(reply('我在餐厅工作').spoken.pinyin,'Wǒ zài cāntīng gōngzuò.');
});
test('work conversation follows the actual yes/no and busy replies',()=>{
 assert.equal(reply('喜欢',{awaiting:'job-liking'}).reply.hanzi,'太好了！你工作忙吗？');
 assert.equal(reply('我喜欢我的工作',{awaiting:'job-liking'}).next,'work-busy');
 assert.equal(reply('我不喜欢我的工作',{awaiting:'job-liking'}).reply.hanzi,'明白了。你想换工作吗？');
 assert.equal(reply('我很忙',{awaiting:'work-busy'}).reply.hanzi,'辛苦了！你每天几点下班？');
 assert.equal(reply('我不忙',{awaiting:'work-busy'}).next,'after-work');
});
test('everyday examples from Mandarin tester no longer become unknown',()=>{
 const cases=[
  ['我在看电影。','你在看什么电影？','Wǒ zài kàn diànyǐng.'],
  ['很无聊','我们聊聊天吧！你喜欢看电影吗？','Hěn wúliáo.'],
  ['你知道吗？','你想告诉我什么？','Nǐ zhīdào ma?'],
  ['我不知道','没关系。你想聊什么？','Wǒ bù zhīdào.'],
  ['我在学习中文','你学中文多久了？','Wǒ zài xuéxí Zhōngwén.'],
  ['我在听音乐','你在听什么音乐？','Wǒ zài tīng yīnyuè.']
 ];
 for(const [phrase,expected,pinyin] of cases){
  const r=reply(phrase);
  assert(r,phrase+' not recognized');
  assert.equal(r.reply.hanzi,expected);
  assert.equal(r.spoken.pinyin,pinyin);
  assert.equal(r.spoken.toneVerified,false);
 }
});
test('work and unemployment do not claim that learner has a job',()=>{
 for(const x of ['我不工作','我没有工作','我现在没有工作','我退休了','我在找工作']){
  const r=reply(x);
  assert(r,x+' must be recognized');
  assert(!r.reply.hanzi.includes('你喜欢你的工作吗'),x);
 }
 assert.equal(reply('我退休了').reply.hanzi,'你退休后喜欢做什么？');
});
test('unreviewed statements stay unknown; no made-up Chinese pronunciation',()=>{
 for(const x of ['我是宇航员','我在外国语学院教书','我是老师你呢','我的名字有六个字','我在放风筝','你知道这个吗']){
  assert.equal(reply(x),null,x);
 }
 assert.equal(reply('我叫米沙').spoken.pinyin,null);
});
test('active Panda AI free chat uses new v544 engine, not the graded quiz or the My Day scenario',()=>{
 const core=readFileSync(new URL('../assets/panda-hsk2-preview-core-v1.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 const pack=JSON.parse(readFileSync(new URL('../assets/offline-pack.json',import.meta.url),'utf8'));
 assert.match(core,/from '.\/panda-natural-statements-v552\.mjs\?v=552'/);
 assert(core.includes("entry.beginnerGreeting&&hsk2.id===101"));
 assert(core.includes("if(mode==='nonstop'&&entry.beginnerGreeting&&hsk2.id===101)"));
 assert(core.includes("hsk2.openChat=true;state.mode='nonstop'"));
 assert.match(core,/say\(natural\.reply,!!lookupPandaVoiceClip\(natural\.reply\.hanzi\)\)/);
 assert.match(html,/panda-hsk2-preview-core-v1\.mjs\?v=552/);
 assert(pack.version>=545,'Offline pack must include the latest Panda layout version');
 assert(sw.includes("const CACHE='chinese-coach-pwa-v"+pack.version+"-"),'Service worker cache must match offline pack version');
 assert(pack.files.includes('./assets/panda-natural-statements-v552.mjs?v=552'));
 assert(sw.includes('./assets/panda-natural-statements-v552.mjs?v=552'));
});

test('40 work turns in the active v552 engine retain reviewed pinyin and follow-ups',async()=>{
 const {respondToNaturalStatement:respond}=await import('../assets/panda-natural-statements-v552.mjs');
 const professions=[
  ['老师','lǎoshī'],['学生','xuésheng'],['医生','yīshēng'],['工程师','gōngchéngshī'],
  ['护士','hùshi'],['老板','lǎobǎn'],['经理','jīnglǐ'],['司机','sījī'],['厨师','chúshī'],
  ['服务员','fúwùyuán'],['警察','jǐngchá'],['销售员','xiāoshòuyuán'],['工人','gōngrén'],
  ['翻译','fānyì'],['演员','yǎnyuán'],['商人','shāngrén'],['程序员','chéngxùyuán'],['设计师','shèjìshī']
 ];
 const workplaces=[
  ['学校','xuéxiào'],['公司','gōngsī'],['医院','yīyuàn'],['饭店','fàndiàn'],['餐厅','cāntīng'],
  ['商店','shāngdiàn'],['工厂','gōngchǎng'],['办公室','bàngōngshì'],['银行','yínháng'],['超市','chāoshì'],['家','jiā']
 ];
 const cases=[
  ...professions.map(([job,py])=>['我是'+job,'Wǒ shì '+py+'.',job==='学生'?'study':'work-place']),
  ...workplaces.map(([place,py])=>['我在'+place+'工作','Wǒ zài '+py+' gōngzuò.','job-liking']),
  ['我不是老师','Wǒ bú shì lǎoshī.','job-role'],
  ['我不工作','Wǒ bù gōngzuò.','job-role'],
  ['我没有工作','Wǒ méiyǒu gōngzuò.','job-role'],
  ['我现在没有工作','Wǒ xiànzài méiyǒu gōngzuò.','job-role'],
  ['我退休了','Wǒ tuìxiū le.','job-role'],
  ['我在找工作','Wǒ zài zhǎo gōngzuò.','job-role'],
  ['我喜欢我的工作','Wǒ xǐhuan wǒ de gōngzuò.','work-busy'],
  ['不喜欢','Bù xǐhuan.','job-change',respond('我在公司工作').next],
  ['工作很忙','Gōngzuò hěn máng.','after-work'],
  ['想换工作','Xiǎng huàn gōngzuò.','job-role',respond('我不喜欢我的工作').next],
  ['我不想换工作','Wǒ bù xiǎng huàn gōngzuò.','after-work',respond('我不喜欢我的工作').next]
 ];
 assert.equal(cases.length,40);
 for(const [input,pinyin,next,awaiting] of cases){
  const r=respond(input,{awaiting});
  assert(r,input);
  assert.equal(r.spoken.pinyin,pinyin,input);
  assert.equal(r.next,next,input);
  assert(r.spoken.translation&&r.reply.hanzi&&r.reply.pinyin&&r.reply.ru,input);
  assert.equal(r.spoken.toneVerified,false,input);
 }
 assert.equal(respond('想换工作'),null);
});

test('40 food and drink inputs distinguish intention, preference and negation',async()=>{
 const {respondToNaturalStatement:respond}=await import('../assets/panda-natural-statements-v552.mjs');
 const items=[
  ['米饭','mǐfàn','рис'],['面条','miàntiáo','лапшу'],['鸡肉','jīròu','курицу'],
  ['牛肉','niúròu','говядину'],['水果','shuǐguǒ','фрукты'],['水','shuǐ','воду','喝'],
  ['茶','chá','чай','喝'],['咖啡','kāfēi','кофе','喝'],['牛奶','niúnǎi','молоко','喝'],
  ['果汁','guǒzhī','сок','喝']
 ];
 const intents=[
  ['想','xiǎng','хочу'],['不想','bù xiǎng','не хочу'],
  ['爱','ài','люблю'],['不爱','bú ài','не люблю']
 ];
 const inputs=new Set();
 for(const [item,py,ru,verb='吃'] of items){
  const drink=verb==='喝';
  for(const [intent,intentPy,intentRu] of intents){
   const input='我'+intent+verb+item;
   inputs.add(input);
   const r=respond(input);
   assert(r,input);
   assert.equal(r.spoken.pinyin,`Wǒ ${intentPy} ${drink?'hē':'chī'} ${py}.`,input);
   assert.equal(r.spoken.translation,`Я ${intentRu} ${drink?'пить':'есть'} ${ru}.`,input);
   assert.equal(r.reply.hanzi,intent.startsWith('不')?`那你想${verb}什么？`:`你经常${verb}吗？`,input);
   assert(r.reply.pinyin&&r.reply.ru,input);
   assert.equal(r.spoken.toneVerified,false,input);
  }
 }
 assert.equal(inputs.size,40);
 const coffee=respond('我爱喝咖啡');
 assert.equal(respond('我不经常喝',{awaiting:coffee.context}).spoken.pinyin,'Wǒ bù jīngcháng hē.');
 assert.equal(respond('经常',{awaiting:coffee.context}).spoken.translation,'Я часто это пью.');
 assert.equal(respond('经常'),null);
 assert.equal(respond('我想喝米饭'),null);
});

test('40 shopping inputs preserve item, aspect and purchase intent',async()=>{
 const {respondToNaturalStatement:respond}=await import('../assets/panda-natural-statements-v552.mjs');
 const items=[
  ['衣服','yīfu'],['衬衫','chènshān'],['裙子','qúnzi'],['裤子','kùzi'],
  ['鞋','xié'],['袜子','wàzi'],['书','shū'],['手机','shǒujī']
 ];
 const variants=[
  ['想买','xiǎng mǎi','你有多少预算？'],['要买','yào mǎi','你有多少预算？'],
  ['打算买','dǎsuàn mǎi','你有多少预算？'],['不想买','bù xiǎng mǎi','那你想买什么？'],
  ['已经买了','yǐjīng mǎi le','你花了多少钱？']
 ];
 const inputs=new Set();
 for(const [item,py] of items)for(const [form,formPy,answer] of variants){
  const input='我'+form+item;
  inputs.add(input);
  const r=respond(input);
  assert(r,input);
  assert.equal(r.spoken.pinyin,`Wǒ ${formPy} ${py}.`,input);
  assert.equal(r.reply.hanzi,answer,input);
  assert(r.spoken.translation&&r.reply.pinyin&&r.reply.ru,input);
  assert.equal(r.spoken.toneVerified,false,input);
 }
 assert.equal(inputs.size,40);
 assert.equal(respond('我想买一双鞋').spoken.pinyin,'Wǒ xiǎng mǎi yì shuāng xié.');
 assert.equal(respond('我想买一件衣服').spoken.pinyin,'Wǒ xiǎng mǎi yí jiàn yīfu.');
 assert.equal(respond('我想买一本手机'),null);
 assert.equal(respond('两百块',{awaiting:respond('我想买衣服').next}).spoken.translation,'200 юаней.');
 assert.equal(respond('两百块'),null);
});

test('40 travel inputs distinguish past trips, plans and intentions',async()=>{
 const {respondToNaturalStatement:respond}=await import('../assets/panda-natural-statements-v552.mjs');
 const cities=[
  ['北京','Běijīng'],['上海','Shànghǎi'],['广州','Guǎngzhōu'],['深圳','Shēnzhèn'],
  ['成都','Chéngdū'],['杭州','Hángzhōu'],['西安','Xī’ān'],['南京','Nánjīng']
 ];
 const variants=[
  ['想去','xiǎng qù','你什么时候去？'],['打算去','dǎsuàn qù','你什么时候去？'],
  ['明天去','míngtiān qù','你怎么去？'],['去过','qùguo','你喜欢那里吗？'],['没去过','méi qùguo','你想去那里吗？']
 ];
 const inputs=new Set();
 for(const [city,py] of cities)for(const [form,formPy,answer] of variants){
  const input='我'+form+city;
  inputs.add(input);
  const r=respond(input);
  assert(r,input);
  assert.equal(r.spoken.pinyin,`Wǒ ${formPy} ${py}.`,input);
  assert.equal(r.reply.hanzi,answer,input);
  assert(r.spoken.translation&&r.reply.pinyin&&r.reply.ru,input);
  assert.equal(r.spoken.toneVerified,false,input);
 }
 assert.equal(inputs.size,40);
 assert.equal(respond('我没去过北京').spoken.translation,'Я ещё не бывал / не бывала в Пекине.');
 assert.equal(respond('下周',{awaiting:respond('我想去北京').next}).reply.hanzi,'你怎么去？');
 const departure=respond('下周',{awaiting:respond('我想去北京').next});
 assert.equal(respond('坐火车',{awaiting:departure.next}).reply.hanzi,'祝你一路顺风！');
 assert.equal(respond('下周'),null);
});

test('40 My Day inputs distinguish the time and the daily action',async()=>{
 const {respondToNaturalStatement:respond}=await import('../assets/panda-natural-statements-v552.mjs');
 const hours=[['五','wǔ'],['六','liù'],['七','qī'],['八','bā'],['九','jiǔ'],['十','shí'],['十一','shíyī'],['十二','shí’èr']];
 const activities=[
  ['每天早上','měitiān zǎoshang','起床','qǐchuáng','你起床以后做什么？'],
  ['早上','zǎoshang','吃早饭','chī zǎofàn','你早饭吃什么？'],
  ['每天','měitiān','去上班','qù shàngbān','你怎么去上班？'],
  ['','', '下班','xiàbān','你下班以后做什么？'],
  ['晚上','wǎnshang','睡觉','shuìjiào','你睡觉以前做什么？']
 ];
 const inputs=new Set();
 for(const [prefix,prefixPy,activity,activityPy,answer] of activities)for(const [hour,hourPy] of hours){
  const half=activity==='吃早饭';
  const input=`我${prefix}${hour}点${half?'半':''}${activity}`;
  inputs.add(input);
  const r=respond(input);
  assert(r,input);
  assert.equal(r.spoken.pinyin,`Wǒ ${prefixPy?prefixPy+' ':''}${hourPy} diǎn${half?' bàn':''} ${activityPy}.`,input);
  assert.equal(r.reply.hanzi,answer,input);
  assert(r.spoken.translation&&r.reply.pinyin&&r.reply.ru,input);
  assert.equal(r.spoken.toneVerified,false,input);
 }
 assert.equal(inputs.size,40);
 const wake=respond('我每天早上七点起床');
 assert.equal(respond('我先刷牙',{awaiting:wake.next}).spoken.pinyin,'Wǒ xiān shuāyá.');
 assert.equal(respond('我早上七点半吃早饭').spoken.translation,'Я завтракаю в 7:30 утра.');
 assert.equal(respond('我早上二十五点起床'),null);
});

test('30 introductions cover polite replies, origin, hometown and nationality',async()=>{
 const {respondToNaturalStatement:respond}=await import('../assets/panda-natural-statements-v552.mjs');
 const countries=[['俄罗斯','Éluósī'],['中国','Zhōngguó'],['吉尔吉斯斯坦','Jí’ěrjísīsītǎn'],['法国','Fǎguó'],['德国','Déguó'],['日本','Rìběn']];
 const forms=[['来自','Wǒ láizì','',''],['从','Wǒ cóng','来',' lái'],['是','Wǒ shì','人',' rén'],['的家乡是','Wǒ de jiāxiāng shì','','']];
 const cases=[
  ['很高兴认识你','Hěn gāoxìng rènshi nǐ.','我也很高兴认识你！'],
  ['见到你很高兴','Jiàndào nǐ hěn gāoxìng.','我也很高兴见到你！'],
  ['可以认识一下吗','Kěyǐ rènshi yíxià ma?','当然可以。你叫什么名字？'],
  ['我们认识一下吧','Wǒmen rènshi yíxià ba.','好啊！你叫什么名字？'],
  ['我先介绍一下自己','Wǒ xiān jièshào yíxià zìjǐ.','好啊！你来自哪里？'],
  ['请问你怎么称呼','Qǐngwèn nǐ zěnme chēnghu?','你可以叫我熊猫。']
 ];
 for(const [country,py] of countries)for(const [form,opening,suffix,ending] of forms)
  cases.push(['我'+form+country+suffix,`${opening} ${py}${ending}.`,'你现在住在哪儿？']);
 assert.equal(new Set(cases.map(row=>row[0])).size,30);
 for(const [input,pinyin,answer] of cases){
  const r=respond(input);
  assert(r,input);
  assert.equal(r.spoken.pinyin,pinyin,input);
  assert.equal(r.reply.hanzi,answer,input);
  assert(r.spoken.translation&&r.reply.pinyin&&r.reply.ru,input);
  assert.equal(r.spoken.toneVerified,false,input);
 }
 const meet=respond('我先介绍一下自己');
 assert.equal(respond('吉尔吉斯斯坦',{awaiting:meet.next}).spoken.translation,'Я из Кыргызстана.');
 assert.equal(respond('我是俄罗斯人').spoken.translation,'Я русский / русская.');
 assert.equal(respond('我从中国'),null);
});

test('50 free conversation inputs use reviewed responses and preserve context when repeating',async()=>{
 const {respondToNaturalStatement:respond}=await import('../assets/panda-natural-statements-v552.mjs');
 const groups=[
  ['哪一句你没听懂？',['我没听懂','我没有听懂','我听不懂这句话','我不太明白','我没明白你的意思']],
  ['你想听哪一句？',['能再说一遍吗','你可以再说一遍吗','请再说一遍','请重复一下','再说一次吧']],
  ['请用慢速按钮。你也可以看拼音。',['你说得太快了','请说慢一点','可以说慢一点吗','麻烦你说慢一点','你能说得慢一点吗']],
  ['请把那个词打出来。',['这个词怎么写','这个字怎么读','这个词是什么意思','这个字我不认识','我不知道这个词怎么读']],
  ['不客气！还想练习吗？',['谢谢你的帮助','太谢谢你了','谢谢你帮我','非常感谢你','多谢你的提醒']],
  ['好，下次见！',['我先走了','我们下次再聊','今天就聊到这里吧','我得走了','我一会儿再来']],
  ['辛苦了。你想休息一下吗？',['我有点儿累','我今天很累','今天过得不太好','我今天心情不好','我今天有点儿难过']],
  ['好啊！你想练什么？',['我想练习中文','我们继续练习吧','我想多说一点中文','今天我想练口语','我想和你用中文聊天']],
  ['谢谢你！你喜欢熊猫吗？',['你很可爱','你真可爱']],
  ['谢谢你！你喜欢这里的风景吗？',['你很漂亮','你真漂亮']],
  ['太好了！我们继续聊吧！',['太好了']],
  ['谢谢你！你喜欢我的耳机吗？',['你很酷','你真酷']],
  ['谢谢你！我们一起加油！',['你太厉害了','你太棒了']],
  ['没关系。你想聊什么？',['我不喜欢你']]
 ];
 const inputs=new Set();
 for(const [answer,phrases] of groups)for(const input of phrases){
  inputs.add(input);
  const r=respond(input);
  assert(r,input);
  assert.equal(r.reply.hanzi,answer,input);
  assert.match(r.spoken.pinyin,/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/u,input);
  assert(r.spoken.translation&&r.reply.pinyin&&r.reply.ru,input);
  assert.equal(r.spoken.toneVerified,false,input);
 }
 assert.equal(inputs.size,50);
 const family=respond('我有一个姐姐');
 const repeat=respond('请再说一遍',{awaiting:family.context,previous:family.reply});
 assert.deepEqual(repeat.reply,family.reply);
 assert.equal(repeat.next,family.context);
 assert.equal(repeat.spoken.pinyin,'Qǐng zài shuō yí biàn.');
 assert.equal(respond('她二十二岁',{awaiting:repeat.next}).reply.hanzi,'你姐姐二十二岁！她喜欢做什么？');
 assert.equal(respond('我没听懂').spoken.translation,'Я не понял / поняла на слух.');
});
