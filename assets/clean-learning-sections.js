/* Distinct learning destinations: Words = words only; Dialogues = conversations only;
   Practice = hands-on recall/translation/listening. Does not change the sequential lesson. */
(()=>{
'use strict';
const courseCategories=[{"id":"g01","title":"Местоимения и указатели","icon":"🧑","words":[{"hz":"我","py":"wǒ","ru":"я"},{"hz":"你","py":"nǐ","ru":"ты"},{"hz":"您","py":"nín","ru":"Вы (вежливо)"},{"hz":"他","py":"tā","ru":"он"},{"hz":"她","py":"tā","ru":"она"},{"hz":"它","py":"tā","ru":"оно"},{"hz":"我们","py":"wǒmen","ru":"мы"},{"hz":"你们","py":"nǐmen","ru":"вы"},{"hz":"他们","py":"tāmen","ru":"они"},{"hz":"这","py":"zhè","ru":"это"},{"hz":"那","py":"nà","ru":"то"},{"hz":"自己","py":"zìjǐ","ru":"сам, себя"},{"hz":"别人","py":"biérén","ru":"другие люди"},{"hz":"大家","py":"dàjiā","ru":"все"}]},{"id":"g02","title":"Вопросы: где, куда, откуда","icon":"🧭","words":[{"hz":"谁","py":"shéi","ru":"кто"},{"hz":"什么","py":"shénme","ru":"что"},{"hz":"哪里","py":"nǎlǐ","ru":"где"},{"hz":"哪儿","py":"nǎr","ru":"где (разговорное)"},{"hz":"从哪里","py":"cóng nǎlǐ","ru":"откуда"},{"hz":"去哪里","py":"qù nǎlǐ","ru":"куда"},{"hz":"哪个","py":"nǎge","ru":"который"},{"hz":"什么时候","py":"shénme shíhou","ru":"когда"},{"hz":"为什么","py":"wèishénme","ru":"почему"},{"hz":"怎么","py":"zěnme","ru":"как"},{"hz":"多少","py":"duōshao","ru":"сколько"},{"hz":"几","py":"jǐ","ru":"сколько (небольшое число)"},{"hz":"怎么样","py":"zěnmeyàng","ru":"какой, как"}]},{"id":"g03","title":"Количество и степень","icon":"⚖️","words":[{"hz":"多","py":"duō","ru":"много"},{"hz":"少","py":"shǎo","ru":"мало"},{"hz":"很多","py":"hěn duō","ru":"очень много"},{"hz":"很少","py":"hěn shǎo","ru":"очень мало"},{"hz":"一点儿","py":"yìdiǎnr","ru":"немного"},{"hz":"一些","py":"yìxiē","ru":"несколько, немного"},{"hz":"太","py":"tài","ru":"слишком"},{"hz":"比较","py":"bǐjiào","ru":"сравнительно"},{"hz":"更","py":"gèng","ru":"ещё более"},{"hz":"全部","py":"quánbù","ru":"всё, целиком"},{"hz":"每","py":"měi","ru":"каждый"},{"hz":"一点","py":"yìdiǎn","ru":"чуть-чуть"}]},{"id":"g04","title":"Время и последовательность","icon":"🕒","words":[{"hz":"现在","py":"xiànzài","ru":"сейчас"},{"hz":"今天","py":"jīntiān","ru":"сегодня"},{"hz":"昨天","py":"zuótiān","ru":"вчера"},{"hz":"明天","py":"míngtiān","ru":"завтра"},{"hz":"以前","py":"yǐqián","ru":"раньше"},{"hz":"以后","py":"yǐhòu","ru":"позже, после"},{"hz":"然后","py":"ránhòu","ru":"затем"},{"hz":"再","py":"zài","ru":"снова (о будущем)"},{"hz":"又","py":"yòu","ru":"опять (о произошедшем)"},{"hz":"已经","py":"yǐjīng","ru":"уже"},{"hz":"还","py":"hái","ru":"ещё"},{"hz":"刚才","py":"gāngcái","ru":"только что"},{"hz":"马上","py":"mǎshàng","ru":"скоро, сейчас же"},{"hz":"早上","py":"zǎoshang","ru":"утром"},{"hz":"晚上","py":"wǎnshang","ru":"вечером"},{"hz":"时候","py":"shíhou","ru":"время, момент"}]},{"id":"g05","title":"Действия","icon":"🏃","words":[{"hz":"去","py":"qù","ru":"идти, ехать"},{"hz":"来","py":"lái","ru":"приходить"},{"hz":"回","py":"huí","ru":"возвращаться"},{"hz":"看","py":"kàn","ru":"смотреть"},{"hz":"听","py":"tīng","ru":"слушать"},{"hz":"说","py":"shuō","ru":"говорить"},{"hz":"读","py":"dú","ru":"читать"},{"hz":"写","py":"xiě","ru":"писать"},{"hz":"学","py":"xué","ru":"учиться"},{"hz":"做","py":"zuò","ru":"делать"},{"hz":"买","py":"mǎi","ru":"покупать"},{"hz":"卖","py":"mài","ru":"продавать"},{"hz":"找","py":"zhǎo","ru":"искать"},{"hz":"给","py":"gěi","ru":"давать"},{"hz":"拿","py":"ná","ru":"брать"},{"hz":"知道","py":"zhīdào","ru":"знать"},{"hz":"明白","py":"míngbai","ru":"понимать"},{"hz":"喜欢","py":"xǐhuan","ru":"нравиться"},{"hz":"吃","py":"chī","ru":"есть"},{"hz":"喝","py":"hē","ru":"пить"}]},{"id":"g06","title":"Места и расположение","icon":"📍","words":[{"hz":"家","py":"jiā","ru":"дом"},{"hz":"学校","py":"xuéxiào","ru":"школа"},{"hz":"公司","py":"gōngsī","ru":"компания"},{"hz":"商店","py":"shāngdiàn","ru":"магазин"},{"hz":"饭店","py":"fàndiàn","ru":"ресторан"},{"hz":"医院","py":"yīyuàn","ru":"больница"},{"hz":"车站","py":"chēzhàn","ru":"станция, вокзал"},{"hz":"机场","py":"jīchǎng","ru":"аэропорт"},{"hz":"中国","py":"Zhōngguó","ru":"Китай"},{"hz":"这里","py":"zhèlǐ","ru":"здесь"},{"hz":"那里","py":"nàlǐ","ru":"там"},{"hz":"里面","py":"lǐmiàn","ru":"внутри"},{"hz":"外面","py":"wàimiàn","ru":"снаружи"},{"hz":"左边","py":"zuǒbian","ru":"слева"},{"hz":"右边","py":"yòubian","ru":"справа"}]},{"id":"g07","title":"Люди и семья","icon":"👨‍👩‍👧‍👦","words":[{"hz":"妈妈","py":"māma","ru":"мама"},{"hz":"爸爸","py":"bàba","ru":"папа"},{"hz":"哥哥","py":"gēge","ru":"старший брат"},{"hz":"弟弟","py":"dìdi","ru":"младший брат"},{"hz":"姐姐","py":"jiějie","ru":"старшая сестра"},{"hz":"妹妹","py":"mèimei","ru":"младшая сестра"},{"hz":"朋友","py":"péngyou","ru":"друг"},{"hz":"老师","py":"lǎoshī","ru":"учитель"},{"hz":"学生","py":"xuésheng","ru":"ученик"},{"hz":"同事","py":"tóngshì","ru":"коллега"},{"hz":"人","py":"rén","ru":"человек"},{"hz":"孩子","py":"háizi","ru":"ребёнок"},{"hz":"名字","py":"míngzi","ru":"имя"},{"hz":"工作","py":"gōngzuò","ru":"работа"}]},{"id":"g08","title":"Признаки и противоположности","icon":"✨","words":[{"hz":"好","py":"hǎo","ru":"хороший"},{"hz":"坏","py":"huài","ru":"плохой"},{"hz":"大","py":"dà","ru":"большой"},{"hz":"小","py":"xiǎo","ru":"маленький"},{"hz":"快","py":"kuài","ru":"быстрый"},{"hz":"慢","py":"màn","ru":"медленный"},{"hz":"高","py":"gāo","ru":"высокий"},{"hz":"低","py":"dī","ru":"низкий"},{"hz":"新","py":"xīn","ru":"новый"},{"hz":"旧","py":"jiù","ru":"старый"},{"hz":"热","py":"rè","ru":"горячий"},{"hz":"冷","py":"lěng","ru":"холодный"},{"hz":"容易","py":"róngyì","ru":"легко"},{"hz":"难","py":"nán","ru":"трудный"},{"hz":"贵","py":"guì","ru":"дорогой"},{"hz":"便宜","py":"piányi","ru":"дешёвый"}]},{"id":"g09","title":"Еда и напитки","icon":"🍚","words":[{"hz":"水","py":"shuǐ","ru":"вода"},{"hz":"茶","py":"chá","ru":"чай"},{"hz":"咖啡","py":"kāfēi","ru":"кофе"},{"hz":"米饭","py":"mǐfàn","ru":"варёный рис"},{"hz":"面条","py":"miàntiáo","ru":"лапша"},{"hz":"鸡蛋","py":"jīdàn","ru":"яйцо"},{"hz":"牛奶","py":"niúnǎi","ru":"молоко"},{"hz":"水果","py":"shuǐguǒ","ru":"фрукты"},{"hz":"苹果","py":"píngguǒ","ru":"яблоко"},{"hz":"面包","py":"miànbāo","ru":"хлеб"},{"hz":"肉","py":"ròu","ru":"мясо"},{"hz":"菜","py":"cài","ru":"блюдо, овощи"}]},{"id":"g10","title":"Глаголы и частицы","icon":"🧩","words":[{"hz":"不","py":"bù","ru":"не"},{"hz":"没有","py":"méiyǒu","ru":"не иметь, нет"},{"hz":"有","py":"yǒu","ru":"иметь, есть"},{"hz":"是","py":"shì","ru":"быть, являться"},{"hz":"在","py":"zài","ru":"находиться"},{"hz":"会","py":"huì","ru":"уметь (навык)"},{"hz":"能","py":"néng","ru":"мочь"},{"hz":"可以","py":"kěyǐ","ru":"можно"},{"hz":"要","py":"yào","ru":"хотеть, нужно"},{"hz":"想","py":"xiǎng","ru":"хотеть"},{"hz":"了","py":"le","ru":"частица завершённости/изменения"},{"hz":"过","py":"guo","ru":"суффикс опыта"},{"hz":"的","py":"de","ru":"частица определения"},{"hz":"吗","py":"ma","ru":"вопросительная частица"},{"hz":"呢","py":"ne","ru":"частица вопроса/темы"},{"hz":"和","py":"hé","ru":"и (между существительными)"},{"hz":"因为","py":"yīnwèi","ru":"потому что"},{"hz":"所以","py":"suǒyǐ","ru":"поэтому"},{"hz":"但是","py":"dànshì","ru":"но"},{"hz":"如果","py":"rúguǒ","ru":"если"}]},{"id":"g11","title":"Направления и движение","icon":"🧭","words":[{"hz":"上","py":"shàng","ru":"верх, вверх"},{"hz":"下","py":"xià","ru":"низ, вниз"},{"hz":"前","py":"qián","ru":"перед, впереди"},{"hz":"后","py":"hòu","ru":"зад, после"},{"hz":"这边","py":"zhèbiān","ru":"эта сторона, здесь"},{"hz":"那边","py":"nàbiān","ru":"та сторона, там"},{"hz":"远","py":"yuǎn","ru":"далеко"},{"hz":"近","py":"jìn","ru":"близко"},{"hz":"进","py":"jìn","ru":"входить"},{"hz":"出","py":"chū","ru":"выходить"},{"hz":"到","py":"dào","ru":"прибывать"},{"hz":"从","py":"cóng","ru":"из, от"},{"hz":"向","py":"xiàng","ru":"в направлении"},{"hz":"左","py":"zuǒ","ru":"лево"},{"hz":"右","py":"yòu","ru":"право"}]},{"id":"g12","title":"Числа и счёт","icon":"🔢","words":[{"hz":"一","py":"yī","ru":"один"},{"hz":"二","py":"èr","ru":"два"},{"hz":"三","py":"sān","ru":"три"},{"hz":"四","py":"sì","ru":"четыре"},{"hz":"五","py":"wǔ","ru":"пять"},{"hz":"六","py":"liù","ru":"шесть"},{"hz":"七","py":"qī","ru":"семь"},{"hz":"八","py":"bā","ru":"восемь"},{"hz":"九","py":"jiǔ","ru":"девять"},{"hz":"十","py":"shí","ru":"десять"},{"hz":"百","py":"bǎi","ru":"сто"},{"hz":"千","py":"qiān","ru":"тысяча"},{"hz":"两","py":"liǎng","ru":"два (при счёте)"},{"hz":"个","py":"gè","ru":"универсальное счётное слово"}]},{"id":"g13","title":"Вежливость и общение","icon":"💬","words":[{"hz":"你好","py":"nǐ hǎo","ru":"привет, здравствуйте"},{"hz":"谢谢","py":"xièxie","ru":"спасибо"},{"hz":"再见","py":"zàijiàn","ru":"до свидания"},{"hz":"请","py":"qǐng","ru":"пожалуйста (просьба)"},{"hz":"对","py":"duì","ru":"правильно"},{"hz":"不对","py":"bú duì","ru":"неправильно"},{"hz":"没关系","py":"méi guānxi","ru":"ничего страшного"},{"hz":"对不起","py":"duìbuqǐ","ru":"извините"},{"hz":"不客气","py":"bú kèqi","ru":"не за что"},{"hz":"好的","py":"hǎo de","ru":"хорошо"},{"hz":"好吧","py":"hǎo ba","ru":"ладно"},{"hz":"欢迎","py":"huānyíng","ru":"добро пожаловать"}]}];
const allWords=courseCategories.flatMap(group=>group.words.map(word=>({...word,category:group.id})));
const byHanzi=new Map(allWords.map(w=>[w.hz,w]));
const section=document.getElementById('topics');
const originalOpenTopics=window.openLearningTopics;
const originalPractice=window.openPracticeChoices;
const $=(s,within=section)=>within.querySelector(s);
const $$=(s,within=section)=>[...within.querySelectorAll(s)];
const esc=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
// Shared lightweight SVG art makes category cards crisp on Android without decorative raster overlays.
const categoryMotifs={
 g01:'<rect x="18" y="14" width="36" height="45" rx="5" fill="#fff1d9" stroke="#be869a" stroke-width="2"/><path d="M18 20h36M18 52h36" stroke="#c89b62" stroke-width="4"/><text x="36" y="44" text-anchor="middle" font-size="25" font-weight="700" fill="#753c8d">人</text>',
 g02:'<path d="M33 12v49" stroke="#a56c6a" stroke-width="5" stroke-linecap="round"/><path d="M16 18h43l8 9-8 9H16z" fill="#ffe9ac" stroke="#d79e7e" stroke-width="2"/><path d="M12 40h43l-8 9H12z" fill="#f4bfdb" stroke="#b77ab4" stroke-width="2"/><text x="38" y="31" text-anchor="middle" font-size="15" font-weight="700" fill="#743a70">哪儿</text><text x="31" y="47" text-anchor="middle" font-size="11" fill="#743a70">哪里</text>',
 g03:'<path d="M36 17v41m-20-34h40M25 56h22" stroke="#ac7193" stroke-width="4" stroke-linecap="round"/><circle cx="36" cy="17" r="5" fill="#ffcf6e"/><path d="m20 24-9 21h18l-9-21m32 0-9 21h18l-9-21" fill="#fff1c6" stroke="#d59c53" stroke-width="2"/><path d="M10 45q10 14 20 0m12 0q10 14 20 0" fill="#ffd46e" stroke="#bb8b55" stroke-width="2"/>',
 g04:'<circle cx="36" cy="37" r="24" fill="#fffaf4" stroke="#b68ab8" stroke-width="4"/><circle cx="36" cy="37" r="3" fill="#aa4bb0"/><path d="M36 22v15l12 6" fill="none" stroke="#76368d" stroke-width="4" stroke-linecap="round"/><path d="M36 15v6M36 53v6M14 37h6M52 37h6" stroke="#c08aad" stroke-width="2"/>',
 g05:'<circle cx="45" cy="17" r="8" fill="#e5a1b6"/><path d="m36 28-11 13 17 2 9-13m-10 12-16 15m16-14 17 12m-29-14-12-5" stroke="#814b99" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="m33 29 12-4" stroke="#ffc96a" stroke-width="8" stroke-linecap="round"/>',
 g06:'<path d="M12 52 28 19l19 6 13 30-20-6-28 3" fill="#e2dbf4" stroke="#b09cd9" stroke-width="2"/><path d="M48 12c-10 0-17 7-17 17 0 13 17 27 17 27s17-14 17-27c0-10-7-17-17-17z" fill="#e77aab" stroke="#af598a" stroke-width="2"/><circle cx="48" cy="29" r="7" fill="#fff4f9"/>',
 g07:'<circle cx="23" cy="28" r="9" fill="#d0a4e5"/><circle cx="49" cy="28" r="9" fill="#c18cd8"/><circle cx="36" cy="36" r="7" fill="#ffd0ab"/><path d="M8 59c0-15 7-20 17-20 7 0 11 4 12 11M64 59c0-15-7-20-17-20-7 0-11 4-12 11M23 63c0-13 6-19 13-19s13 6 13 19" fill="#9164b8" stroke="#6e448f" stroke-width="2"/>',
 g08:'<path d="M36 58C13 47 13 32 25 17c1 12 6 18 11 22 5-4 10-10 11-22 12 15 12 30-11 41Z" fill="#fbb3d0" stroke="#ca6ba6" stroke-width="2"/><path d="M36 55C22 47 22 32 36 14c14 18 14 33 0 41Z" fill="#ffe0f0" stroke="#d885bf" stroke-width="2"/><path d="M17 58q19 10 38 0" fill="none" stroke="#76bb9e" stroke-width="4" stroke-linecap="round"/>',
 g09:'<path d="M15 31h43l-7 23H23z" fill="#f7e2b0" stroke="#b99470" stroke-width="3"/><path d="M18 32q15 8 36 0M26 18q-6 6 0 11m13-15q-6 6 0 12m12-8q-6 6 0 11" stroke="#a870ac" stroke-width="3" fill="none" stroke-linecap="round"/>',
 g10:'<rect x="14" y="20" width="23" height="36" rx="3" fill="#f5d6ed" stroke="#a875bd" stroke-width="2"/><rect x="37" y="20" width="22" height="36" rx="3" fill="#e6ddff" stroke="#a875bd" stroke-width="2"/><path d="M36 20v36M20 31h10m14 0h9M20 40h10m14 0h9" stroke="#ad8ab7" stroke-width="2"/><circle cx="36" cy="15" r="6" fill="#ffc968"/>',
 g11:'<circle cx="36" cy="37" r="24" fill="#fff6ea" stroke="#b89ac9" stroke-width="3"/><path d="m47 24-8 16-17 10 10-17z" fill="#f4a0c0" stroke="#bb6c9b" stroke-width="2"/><circle cx="36" cy="37" r="4" fill="#8451a6"/><text x="36" y="18" font-size="9" text-anchor="middle" fill="#6e508b">N</text>',
 g12:'<rect x="15" y="16" width="43" height="41" rx="3" fill="#f6debc" stroke="#aa7a6b" stroke-width="4"/><path d="M19 28h35M19 43h35M28 21v32M43 21v32" stroke="#ae8a75" stroke-width="2"/><circle cx="28" cy="32" r="5" fill="#a66aaf"/><circle cx="43" cy="40" r="5" fill="#e99baf"/>',
 g13:'<path d="M13 18h47v28H33L23 56v-10H13z" fill="#fff2f9" stroke="#bd88cf" stroke-width="3"/><text x="36" y="38" text-anchor="middle" font-size="20" font-weight="700" fill="#8551a3">谢</text>'
};
function categoryArt(group){
 return '<svg class="clean-icon-art" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" role="presentation" focusable="false">'+
  '<rect x="2" y="2" width="68" height="68" rx="19" fill="#fff8ff" stroke="#edc8f2" stroke-width="2"/>'+
  (categoryMotifs[group.id]||'')+
  '<circle cx="10" cy="10" r="5" fill="#f7b3dd"/><circle cx="16" cy="9" r="3" fill="#ffc7e7"/><circle cx="9" cy="17" r="3" fill="#ffc7e7"/>'+
  '</svg>';
}
const norm=s=>String(s).replace(/[！!。．，,？?\s]/g,'');
const PINYIN_PREF='chinese-coach-show-pinyin';
function getPinyinPreference(){try{return localStorage.getItem(PINYIN_PREF)!=='false'}catch{return true}}
function getKnown(){try{const list=JSON.parse(localStorage.getItem('chinese-coach-basic-known-v1')||'[]');return Array.isArray(list)?list:[]}catch{return []}}
const known=new Set(getKnown().filter(k=>byHanzi.has(k)));
window.addEventListener('basic-known-restored',()=>{
 known.clear();getKnown().filter(k=>byHanzi.has(k)).forEach(k=>known.add(k));
 if(view==='words'){if(currentCategory)openCategory(currentCategory);else categories();}
});
function saveKnown(){try{localStorage.setItem('chinese-coach-basic-known-v1',JSON.stringify([...known]))}catch{}}
let dialogueStart=0,dialoguePerPage=0;
let currentCategory=null,view='words',dialogLesson=null,practiceMode='recall',practiceIndex=0,score=0,attempts=0,audio=null;
const practicePool=allWords.filter(w=>w.hz.length<=4);
const REVIEW_KEY='chinese-coach-basic-review-v98';
function getBasicReview(){try{const v=JSON.parse(localStorage.getItem(REVIEW_KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return {}}}
let basicReview=getBasicReview(),skipped=new Set();
window.addEventListener('basic-review-restored',()=>{basicReview=getBasicReview()});
function scheduleBasic(word,success){
 const level=success?Math.min(4,(Number(basicReview[word.hz]?.level)||0)+1):0;
 basicReview[word.hz]={level,due:Date.now()+(success?[0,1,3,7,14][level]*86400000:600000)};
 try{localStorage.setItem(REVIEW_KEY,JSON.stringify(basicReview))}catch{}
 if(success)known.add(word.hz);else known.delete(word.hz);saveKnown();
}
function updatePracticeMetrics(){const e=$('.clean-practice-metrics');if(e)e.textContent='Карточка '+(practiceIndex+1)+' · Верно: '+score+' из '+attempts;}
function stopAudio(){if(audio){audio.pause();audio=null;}}
function getFile(hz){
 const key=norm(hz);
 // Prefer the consistent Xiaoyi vocabulary takes where they exist.
 // Legacy Yue Tan material remains fallback so beginner words never go silent.
 return window.basicWordAudio?.[hz]||window.basicPinyinAudio?.[hz]||
  window.courseNaturalAudio?.[key]||window.courseHumanAudio?.[key]||null;
}
function play(hz,speed=.86){
 stopAudio();
 window.dispatchEvent(new Event('learning-audio-stop'));
 const file=getFile(hz);const feedback=$('[data-section-audio]');
 if(!file){if(feedback)feedback.textContent='Для этого слова MP3 пока не готов. Системный голос не включаем.';return}
 const a=new Audio(file);audio=a;a.preservesPitch=true;a.playbackRate=speed;
 if(feedback)feedback.textContent='▶ Воспроизведение китайской записи';
 a.onended=()=>{if(audio===a){audio=null;if(feedback)feedback.textContent='Нажми ещё раз для повтора.';}};
 a.onerror=()=>{if(audio===a){audio=null;if(feedback)feedback.textContent='Запись недоступна. Проверь сеть или скачай материалы.';}};
 Promise.resolve(a.play()).catch(()=>{if(audio===a){audio=null;if(feedback)feedback.textContent='Браузер не смог включить MP3.';}});
}
function leaveToMenu(){stopAudio();go('home')}
function frame(title,desc,body,back){
 section.dataset.simpleSection=view;
 section.innerHTML='<div class="clean-section-head"><button type="button" class="clean-back" data-clean-back>← '+(back?'К темам':'Разделы')+'</button>'+
  '<h1 class="clean-screen-reader-title">'+esc(title)+'</h1></div>'+body+
  '<p data-section-audio class="clean-audio-feedback" role="status" aria-live="polite"></p>';
 $('[data-clean-back]').onclick=()=>back?back():leaveToMenu();
}
function wordTile(word){
 const done=known.has(word.hz);
 return '<article class="clean-word-card"><button type="button" class="clean-word-play" data-clean-play="'+esc(word.hz)+'" aria-label="Послушать '+esc(word.py)+'"><strong lang="zh-Hans">'+esc(word.hz)+'</strong><span>'+esc(word.py)+'</span><small>'+esc(word.ru)+'</small><b aria-hidden="true">▶</b></button>'+
 '<button class="clean-word-known'+(done?' is-known':'')+'" type="button" data-clean-known="'+esc(word.hz)+'" aria-pressed="'+done+'">'+(done?'✓ Знаю':'☆ Выучил')+'</button></article>';
}
function bindWords(){
 $$('[data-clean-play]').forEach(b=>b.onclick=()=>play(b.dataset.cleanPlay,.83));
 $$('[data-clean-known]').forEach(b=>b.onclick=()=>{
  const hz=b.dataset.cleanKnown;if(known.has(hz))known.delete(hz);else known.add(hz);
  saveKnown();b.setAttribute('aria-pressed',String(known.has(hz)));
  b.textContent=known.has(hz)?'✓ Знаю':'☆ Выучил';b.classList.toggle('is-known',known.has(hz));
  const counter=$('[data-clean-known-counter]');if(counter)counter.textContent=known.size+' / '+allWords.length+' выучено';
 });
}
function categories(){
 currentCategory=null;view='words';
 const body='<span class="clean-screen-reader-title">193 слов в 13 темах</span>'+ 
 '<label class="clean-search-label" for="clean-word-search">Поиск китайского слова</label>'+
 '<input type="search" id="clean-word-search" class="clean-search" placeholder="🔎 Поиск китайского слова" autocomplete="off">'+
 '<div class="clean-category-list">'+courseCategories.map((g,i)=>
 '<button class="clean-category" type="button" '+(i>=8?'hidden ':'')+'data-clean-category="'+g.id+'"><span class="clean-category-icon" aria-hidden="true">'+categoryArt(g)+'</span>'+
 '<span><strong>'+esc(g.title)+'</strong><small>'+g.words.length+' слов</small></span><span aria-hidden="true">›</span></button>').join('')+'</div>'+ 
 '<button class="clean-more-categories" data-clean-more type="button">Показать ещё 5 тем ↓</button>'+ 
 '<div class="clean-search-results" hidden></div>';
 frame('Базовые слова','Только слова по темам. Без диалогов, правил и тестов.',body,false);
 $$('[data-clean-category]').forEach(b=>b.onclick=()=>openCategory(b.dataset.cleanCategory));
 let moreShown=false;const more=$('[data-clean-more]');
 more.onclick=()=>{moreShown=true;$$('[data-clean-category]').forEach(b=>b.hidden=false);more.hidden=true};
 $('#clean-word-search').oninput=e=>{
  const q=e.target.value.toLocaleLowerCase().trim();
  const result=$('.clean-search-results'),items=$('.clean-category-list');
  if(!q){items.hidden=false;more.hidden=moreShown;result.hidden=true;result.innerHTML='';return}
  const matches=allWords.filter(w=>[w.hz,w.py,w.ru].some(x=>x.toLocaleLowerCase().includes(q))).slice(0,90);
  items.hidden=true;more.hidden=true;result.hidden=false;
  result.innerHTML='<p class="clean-results-label">'+matches.length+' совпадений</p><div class="clean-word-grid">'+matches.map(wordTile).join('')+'</div>';
  bindWords();
 };
}
function openCategory(id){
 const g=courseCategories.find(x=>x.id===id);if(!g)return;
 currentCategory=id;view='words';
 frame(g.icon+' '+g.title,g.words.length+' слов и выражений · нажимай ▶ для произношения',
 '<div class="clean-word-grid">'+g.words.map(wordTile).join('')+'</div>',categories);
 bindWords();
}
function dialogueCategories(){
 document.body.classList.remove('rose-dialogue-open','ch110-detail-open');
 dialogLesson=null;view='dialogues';
 section.dataset.simpleSection='dialogues';
 const lessons=COURSE.filter(l=>l.id!==1&&l.dialogue?.length);
 const titles={3:'Страна и место жительства'};
 section.innerHTML='<div class="ch110-categories">'+
 '<header class="ch110-category-header"><button type="button" class="ch110-back" data-110-back aria-label="К разделам"><img src="./assets/vendor/icons/arrow-left.svg" alt=""></button><h1 class="ch110-category-title">Диалоги</h1><button type="button" class="ch110-chinese" data-category-audio aria-label="Слушать первый диалог"><img src="./assets/vendor/icons/volume-2.svg" alt=""></button></header>'+
 '<div class="ch110-category-list">'+lessons.map((l,i)=>
 '<button class="ch110-category ch110-category-'+i+'" data-dialog-lesson="'+l.id+'" type="button">'+
 '<span class="ch110-category-icon" aria-hidden="true"><img src="./assets/vendor/icons/message-circle-more.svg" alt=""></span>'+
 '<span class="ch110-category-copy"><strong>'+esc(titles[l.id]||l.title)+'</strong><small>'+l.dialogue.length+(l.dialogue.length===4?' реплики':' реплик')+'</small></span>'+
 '<span class="ch110-category-next" aria-hidden="true">›</span></button>'
 ).join('')+'</div><div class="ch110-category-footer">Выберите тему диалога</div></div>';
 $('[data-110-back]').onclick=()=>leaveToMenu();
 $('[data-category-audio]').onclick=()=>window.playStandaloneDialogue?.(lessons[0].id);
 $$('[data-dialog-lesson]').forEach(b=>b.onclick=()=>showDialogue(Number(b.dataset.dialogLesson)));
}
function showDialogue(id,page=0){
 const l=COURSE.find(l=>l.id===id&&l.id!==1);if(!l)return;
 dialogLesson=id;view='dialogues';stopAudio();
 const perPage=(window.innerHeight||700)<640?1:2;
 const pages=Math.ceil(l.dialogue.length/perPage);
 page=Math.max(0,Math.min(page,pages-1));
 const start=page*perPage;dialogueStart=start;dialoguePerPage=perPage;
 const shown=l.dialogue.slice(start,start+perPage);
 const title=l.id===3?'Страна и место жительства':l.title;
 document.body.classList.add('rose-dialogue-open','ch110-detail-open');
 section.dataset.simpleSection='dialogues';
 const lines=shown.map(([who,hz,py,ru],localIndex)=>{
  const i=start+localIndex;
  const female=id===2 ? (i===0 || (i>1 && who==='B')) : who==='A';
  const size=hz.length>24?' ch110-line-long':hz.length>14?' ch110-line-medium':'';
  return '<article class="ch110-line dialogue-row'+size+'" data-standalone-line="'+i+'">'+
  '<div class="ch110-person"><img src="./assets/'+(female?'approved-woman-v112.webp':'approved-man-v112.webp')+'" alt="'+(female?'Женщина':'Мужчина')+'" class="ch110-portrait" loading="eager" decoding="sync" fetchpriority="high" width="142" height="161">'+
  '<span class="ch110-person-name">'+(female?'Она':'Он')+' · '+(i+1)+'</span></div>'+
  '<div class="ch110-speech">'+
  '<div class="ch110-speech-top"><span class="ch110-pinyin" lang="zh-Latn">'+esc(py)+'</span>'+
  '<button class="ch110-play" type="button" data-dialogue-line="'+i+'" aria-label="Прослушать реплику '+(i+1)+'"><img src="./assets/vendor/icons/volume-2.svg" alt=""></button></div>'+
  '<strong class="ch110-hanzi" lang="zh-Hans">'+esc(hz)+'</strong>'+
  '<span class="ch110-meaning">'+esc(ru)+'</span></div></article>';
 }).join('');
 section.innerHTML='<section class="ch110-dialogue'+(getPinyinPreference()?'':' ch110-pinyin-off')+'" aria-label="'+esc(title)+'">'+ 
 '<header class="ch110-toolbar"><button class="ch110-round" type="button" data-110-return aria-label="К темам"><img src="./assets/vendor/icons/arrow-left.svg" alt=""></button>'+
 '<button class="ch110-round ch110-listen" type="button" data-dialogue-play-all aria-label="Слушать весь диалог"><img src="./assets/vendor/icons/volume-2.svg" alt=""></button></header>'+
 '<div class="ch110-heading"><h1>'+esc(title)+'</h1><span>Реплики '+(start+1)+'–'+(start+shown.length)+' из '+l.dialogue.length+'</span></div>'+
 '<div class="ch110-heading-ornament" aria-hidden="true"><img src="./assets/approved-divider-v112.webp" alt=""></div>'+ 
 '<div class="ch110-pinyin-controls"><button class="ch110-pinyin-toggle" type="button" data-dialogue-pinyin aria-pressed="'+getPinyinPreference()+'">Пиньинь <span aria-hidden="true">●</span></button></div>'+ 
 '<main class="ch110-dialogue-body">'+lines+'</main>'+
 '<footer class="ch110-dialogue-footer">'+
 '<div class="ch110-pagination"><button type="button" data-110-prev '+(page===0?'disabled':'')+'>‹ Назад</button>'+
 '<span>'+(page+1)+' / '+pages+'</span></div>'+
 '<button class="ch110-forward" type="button" data-110-next>'+(page+1<pages?'Далее »':'К диалогам »')+'</button></footer></section>';
 $('[data-dialogue-pinyin]').onclick=event=>{const enabled=event.currentTarget.getAttribute('aria-pressed')!=='true';event.currentTarget.setAttribute('aria-pressed',String(enabled));$('.ch110-dialogue').classList.toggle('ch110-pinyin-off',!enabled);try{localStorage.setItem(PINYIN_PREF,String(enabled))}catch{}};
 $('[data-110-return]').onclick=()=>dialogueCategories();
 $('[data-dialogue-play-all]').onclick=()=>window.playStandaloneDialogue?.(id);
 $$('[data-dialogue-line]').forEach(b=>b.onclick=()=>window.playDialogueLine?.(id,Number(b.dataset.dialogueLine)));
 $('[data-110-next]').onclick=()=>page+1<pages?showDialogue(id,page+1):dialogueCategories();
 const prev=$('[data-110-prev]');if(page>0)prev.onclick=()=>showDialogue(id,page-1);
 let initialX=null;
 const panel=$('.ch110-dialogue-body');
 panel.addEventListener('touchstart',e=>{if(e.touches.length===1)initialX=e.touches[0].clientX},{passive:true});
 panel.addEventListener('touchend',e=>{
  if(initialX===null||e.changedTouches.length!==1)return;
  const change=e.changedTouches[0].clientX-initialX;initialX=null;
  if(Math.abs(change)<85)return;
  if(change<0&&page+1<pages)showDialogue(id,page+1);
  if(change>0&&page>0)showDialogue(id,page-1);
 },{passive:true});
}

function choiceButtons(target,correctCallback){
 const others=allWords.filter(w=>w.hz!==target.hz&&w.ru!==target.ru);
 let distractors=[];let offset=(practiceIndex*37+11)%others.length;
 for(let i=0;distractors.length<3&&i<others.length;i++){
  const w=others[(i+offset)%others.length];if(!distractors.includes(w.ru))distractors.push(w.ru);
 }
 const choices=[target.ru,...distractors].sort((a,b)=>{const seed=s=>[...s].reduce((n,c)=>n*31+c.charCodeAt(0),0);return ((seed(a)+practiceIndex*19)%101)-((seed(b)+practiceIndex*19)%101)});
 return '<div class="clean-choice-grid">'+choices.map(x=>'<button type="button" data-choice-ru="'+esc(x)+'">'+esc(x)+'</button>').join('')+'</div>';
}
function practiceHome(){
 view='practice';stopAudio();
 frame('Практика','Не повторяем тоны и правила — здесь тренируем память, перевод и понимание.',
 '<div class="clean-category-list">'+[
 ['recall','🧠','Карточки на память','Вспомни перевод и проверь себя'],
 ['translation','🔤','Выбери перевод','Найди правильное значение'],
 ['listening','🎧','Узнай слово на слух','Слушай MP3 и выбирай перевод']
 ].map(([key,icon,title,info])=>'<button type="button" class="clean-category" data-practice-mode="'+key+'"><span class="clean-category-icon">'+icon+'</span><span><strong>'+title+'</strong><small>'+info+'</small></span><span>›</span></button>').join('')+'</div>',false);
 $$('[data-practice-mode]').forEach(b=>b.onclick=()=>startPractice(b.dataset.practiceMode));

}
function practiceCandidates(){
 return practiceMode==='listening'?practicePool.filter(w=>Boolean(getFile(w.hz))):practicePool;
}
function startPractice(mode){
 practiceMode=mode;practiceIndex=0;score=0;attempts=0;skipped=new Set();basicReview=getBasicReview();renderPractice();
}
function renderPractice(){
 view='practice';stopAudio();
 const pool=practiceCandidates();if(!pool.length){frame('Практика','Нет доступных озвученных слов.','<p>Сначала скачай MP3 в настройках.</p>',practiceHome);return}
 const word=pool.find(w=>!skipped.has(w.hz)&&Number.isFinite(basicReview[w.hz]?.due)&&basicReview[w.hz].due<=Date.now())||pool[(practiceIndex*17+5)%pool.length];
 const heading=practiceMode==='recall'?'Карточки на память':practiceMode==='listening'?'Узнай слово на слух':'Выбери перевод';
 const left='<div class="clean-practice-metrics">Карточка '+(practiceIndex+1)+' · Верно: '+score+' из '+attempts+'</div>';
 const prompt=practiceMode==='listening'?'<button class="clean-listen-main" type="button" data-practice-listen>🔊 Послушать слово</button>':
 '<div class="clean-practice-hanzi" lang="zh-Hans">'+esc(word.hz)+'</div><div class="clean-practice-pinyin">'+esc(word.py)+'</div>'+
 '<button class="clean-listen-sub" type="button" data-practice-listen>▶ Послушать</button>';
 const action=practiceMode==='recall'?'<div class="clean-practice-answer" hidden><strong>'+esc(word.ru)+'</strong></div><button type="button" class="clean-action-primary" data-reveal>Показать перевод</button>'+
 '<div class="clean-practice-result" hidden><button data-recall="again">Повторить позже</button><button data-recall="know">Я вспомнил ✓</button></div>':
 choiceButtons(word);
 const foot='<div class="clean-practice-feedback" role="status" aria-live="polite"></div><button type="button" class="clean-action-next" data-practice-next>Следующее слово →</button>';
 frame(heading,'Практика на основных словах, без правил чтения и теории.',left+'<div class="clean-practice-card">'+prompt+action+foot+'</div>',practiceHome);
 $('[data-practice-listen]').onclick=()=>play(word.hz,.85);
 if(practiceMode==='recall'){
  $('[data-reveal]').onclick=()=>{$('.clean-practice-answer').hidden=false;$('[data-reveal]').hidden=true;$('.clean-practice-result').hidden=false};
  $$('[data-recall]').forEach(b=>b.onclick=()=>{
   if(b.disabled)return;
   const success=b.dataset.recall==='know';attempts++;if(success)score++;scheduleBasic(word,success);updatePracticeMetrics();
   $$('[data-recall]').forEach(v=>v.disabled=true);
   $('.clean-practice-feedback').textContent=success?'✓ Верно. Слово вернётся в повторении позже.':'Слово сохранено для повторения через 10 минут.';
  });
 }else{
  $$('[data-choice-ru]').forEach(b=>b.onclick=()=>{
   if($('[data-choice-ru]:disabled'))return;
   const correct=b.dataset.choiceRu===word.ru;attempts++;if(correct)score++;scheduleBasic(word,correct);updatePracticeMetrics();
   $$('.clean-choice-grid button').forEach(v=>{v.disabled=true;v.classList.toggle('is-correct',v.dataset.choiceRu===word.ru)});
   b.classList.toggle('is-wrong',!correct);
   $('.clean-practice-feedback').textContent=correct?'Верно! ✓':'Неверно. Правильный перевод: '+word.ru;
  });
 }
 $('[data-practice-next]').onclick=()=>{skipped.add(word.hz);practiceIndex++;renderPractice()};
}
window.addEventListener('resize',()=>{
 const count=window.innerHeight<640?1:2;
 if(dialogLesson!==null&&section.classList.contains('active')&&count!==dialoguePerPage)showDialogue(dialogLesson,Math.floor(dialogueStart/count));
});
window.openLearningTopics=function(kind='course'){
 if(kind==='words'){originalOpenTopics('words');categories();return}
 if(kind==='dialogues'){originalOpenTopics('dialogues');dialogueCategories();return}
 originalOpenTopics(kind);
};
window.openPracticeChoices=function(){originalPractice();practiceHome()};
window.__simpleSectionPreview={data:courseCategories,total:allWords.length,getFile};
// The initial route is restored before this progressive enhancement loads.
if(location.hash==='#topics/words')categories();
else if(location.hash==='#topics/dialogues')dialogueCategories();
else if(location.hash==='#topics/practice')practiceHome();
})();