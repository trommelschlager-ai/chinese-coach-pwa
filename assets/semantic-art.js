/* Images are keyed by meaning, never by shuffled answer position. */
(function(){
'use strict';
const exact = {};
function entries(key, values){values.forEach(v=>exact[v.toLowerCase()]=key)}
entries('intro',['你好','您好','привет','здравствуйте (вежливо)','ты','你','как дела','你好吗','вопросительная частица','吗']);
entries('name',['名字','叫','什么','имя','называться','зовут / звать','что / какой','как тебя зовут','我叫小明','你叫小明','我不小明','小明什么','叫什么']);
entries('thanks',['谢谢','спасибо','不客气','не за что','没关系','ничего страшного']);
entries('farewell',['再见','до свидания','пока']);
entries('please',['请','请问','пожалуйста (просьба)','скажите, пожалуйста','对不起','извините']);
entries('tea',['茶','чай','一杯茶','чашка чая','杯','чашка / стакан','yī bēi','yì bēi','yí bēi','yǐ bēi']);
entries('water',['水','вода','горячая вода','我要水']);
entries('coffee',['咖啡','кофе','два кофе']);
entries('rice',['米饭','рис (готовый)','одна порция риса']);
entries('noodles',['面条','лапша']);
entries('eat',['吃','есть']);entries('drink',['喝','пить','что ты пьёшь']);
entries('study',['学生','студент','учиться','学习','我是学生','我学生是']);
entries('work',['工作','работа / работать','работать']);
entries('teacher',['老师','учитель','你是老师','lǎoshī','láoshì','làoshī','lǎoshi']);
entries('china',['中国','Китай','в Китае','我是中国']);entries('russia',['俄罗斯','Россия']);
entries('language',['中文','китайский язык','是','不是','не являться','нет','не','没有','不']);
entries('friends',['朋友','друг']);entries('good',['好','хорошо','喜欢','нравиться','хотеть / хотелось бы','хотеть / брать','想','要']);
entries('man',['我','я','他','он','человек','人','кто ты']);entries('woman',['她','она']);entries('group',['他们','они','мы','我们']);
entries('home',['住','在','哪里','где','жить','где ты живёшь']);
entries('calendar',['今天','明天','сегодня','завтра']);
entries('mother',['妈','мама']);entries('hemp',['麻','конопля']);entries('horse',['马','лошадь']);entries('scold',['骂','ругать']);
entries('clock',['现在','сейчас','几点','который час','три часа','三点','我二十五点']);
entries('birthday',['岁','лет (возраст)','сколько тебе лет','три года','我二十五岁','我是二十五','我叫二十五']);
entries('money',['多少钱','сколько стоит','три юаня']);
entries('spicy',['不要辣','без острого','我喜欢辣','我喝辣','bù yào','bú yào','bū yào','bǔ yào']);
entries('numbers',['零','一','二','三','四','五','六','七','八','九','十','二十','两','ноль','один','два','три','четыре','пять','шесть','семь','восемь','девять','десять','двенадцать','двадцать','двадцать два','двадцать пять','二十五','五十二','二五','十十五','два (перед счётным словом)','二个人','两个人','十个人','五个人','три человека']);
function key(text){
 const t=String(text).replace(/[。！？?!«»]/g,'').trim().toLowerCase();
 if(exact[t])return exact[t];
 if(/тон|нейтральн|первый|второй|четвёртый|[m][āáǎà]/.test(t))return 'language';
 const rules=[['spicy',/остр|辣|[b][ùúūǔ] yào/],['money',/стоит|юан|钱|块/],['clock',/час|几点|点|врем/],['birthday',/лет|возраст|岁|мне 25/],['name',/зовут|имя|名字|叫/],['thanks',/спасибо|谢谢|客气/],['farewell',/свидания|再见|пока/],['please',/извин|пожалуйста|请|对不起/],['russia',/росси|俄罗斯/],['china',/кита[йе]|中国/],['home',/жив|住|где|哪里/],['teacher',/учитель|老师|l[ǎáà]osh/],['study',/студент|学生|учит|学习/],['coffee',/кофе|咖啡/],['rice',/рис|米饭/],['noodles',/лапш|面条/],['water',/вода|воды|水/],['tea',/ча[йюя]|茶|bēi|杯/],['drink',/пь|пит|喝/],['work',/работ|工作/],['good',/хорош|喜欢|好/],['intro',/привет|您好|你好/],['numbers',/[一二三四五六七八九十零两]|\d/]];
 for(const [k,re] of rules)if(re.test(t))return k;
 return 'language';
}
function path(k){return './assets/meaning-'+k+'.webp'}
function style(k,kind='card'){
 const fade=kind==='quiz'?'linear-gradient(90deg,#fffdfa 0%,rgba(255,253,250,.98) 32%,rgba(255,253,250,.85) 52%,rgba(255,253,250,.12) 88%,transparent 100%)':kind==='photo'?'linear-gradient(90deg,rgba(255,253,250,.65),rgba(255,253,250,0) 48%)':kind==='button'?'linear-gradient(90deg,#fffdfa 0%,#fffdfa calc(100% - 145px),rgba(255,253,250,.94) calc(100% - 125px),rgba(255,253,250,.25) calc(100% - 60px),rgba(255,253,250,0) 100%)':'linear-gradient(90deg,#fffdfa 0%,rgba(255,253,250,.97) 36%,rgba(255,253,250,.78) 58%,rgba(255,253,250,.16) 83%,rgba(255,253,250,0) 100%)';
 return `background-image:${fade},url('${path(k)}')!important;background-size:${kind==='button'?'100% 100%,auto 140%':'cover'}!important;background-position:${kind==='button'?'center,right 35%':kind==='quiz'?'right 35%':'center right'}!important;background-repeat:no-repeat!important;`;
}
function paint(el,k,kind){if(!el)return;el.dataset.art=k;el.style.cssText+=';'+style(k,kind)}
window.semanticArt={key,path,style,paint};
})();
