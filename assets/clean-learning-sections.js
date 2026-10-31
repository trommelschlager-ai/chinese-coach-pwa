/* Distinct learning destinations: Words = words only; Dialogues = conversations only;
   Practice = hands-on recall/translation/listening. Does not change the sequential lesson. */
(()=>{
'use strict';
const courseCategories=[{"id":"g01","title":"Местоимения и указатели","icon":"🧑","words":[{"hz":"我","py":"wǒ","ru":"я"},{"hz":"你","py":"nǐ","ru":"ты"},{"hz":"您","py":"nín","ru":"Вы (вежливо)"},{"hz":"他","py":"tā","ru":"он"},{"hz":"她","py":"tā","ru":"она"},{"hz":"它","py":"tā","ru":"оно"},{"hz":"我们","py":"wǒmen","ru":"мы"},{"hz":"你们","py":"nǐmen","ru":"вы"},{"hz":"他们","py":"tāmen","ru":"они"},{"hz":"这","py":"zhè","ru":"это"},{"hz":"那","py":"nà","ru":"то"},{"hz":"自己","py":"zìjǐ","ru":"сам, себя"},{"hz":"别人","py":"biérén","ru":"другие люди"},{"hz":"大家","py":"dàjiā","ru":"все"}]},{"id":"g02","title":"Вопросы: где, куда, откуда","icon":"❓","words":[{"hz":"谁","py":"shéi","ru":"кто"},{"hz":"什么","py":"shénme","ru":"что"},{"hz":"哪里","py":"nǎlǐ","ru":"где"},{"hz":"哪儿","py":"nǎr","ru":"где (разговорное)"},{"hz":"从哪里","py":"cóng nǎlǐ","ru":"откуда"},{"hz":"去哪里","py":"qù nǎlǐ","ru":"куда"},{"hz":"哪个","py":"nǎge","ru":"который"},{"hz":"什么时候","py":"shénme shíhou","ru":"когда"},{"hz":"为什么","py":"wèishénme","ru":"почему"},{"hz":"怎么","py":"zěnme","ru":"как"},{"hz":"多少","py":"duōshao","ru":"сколько"},{"hz":"几","py":"jǐ","ru":"сколько (небольшое число)"},{"hz":"怎么样","py":"zěnmeyàng","ru":"какой, как"}]},{"id":"g03","title":"Количество и степень","icon":"⚖️","words":[{"hz":"多","py":"duō","ru":"много"},{"hz":"少","py":"shǎo","ru":"мало"},{"hz":"很多","py":"hěn duō","ru":"очень много"},{"hz":"很少","py":"hěn shǎo","ru":"очень мало"},{"hz":"一点儿","py":"yìdiǎnr","ru":"немного"},{"hz":"一些","py":"yìxiē","ru":"несколько, немного"},{"hz":"太","py":"tài","ru":"слишком"},{"hz":"比较","py":"bǐjiào","ru":"сравнительно"},{"hz":"更","py":"gèng","ru":"ещё более"},{"hz":"全部","py":"quánbù","ru":"всё, целиком"},{"hz":"每","py":"měi","ru":"каждый"},{"hz":"一点","py":"yìdiǎn","ru":"чуть-чуть"}]},{"id":"g04","title":"Время и последовательность","icon":"🕒","words":[{"hz":"现在","py":"xiànzài","ru":"сейчас"},{"hz":"今天","py":"jīntiān","ru":"сегодня"},{"hz":"昨天","py":"zuótiān","ru":"вчера"},{"hz":"明天","py":"míngtiān","ru":"завтра"},{"hz":"以前","py":"yǐqián","ru":"раньше"},{"hz":"以后","py":"yǐhòu","ru":"позже, после"},{"hz":"然后","py":"ránhòu","ru":"затем"},{"hz":"再","py":"zài","ru":"снова (о будущем)"},{"hz":"又","py":"yòu","ru":"опять (о произошедшем)"},{"hz":"已经","py":"yǐjīng","ru":"уже"},{"hz":"还","py":"hái","ru":"ещё"},{"hz":"刚才","py":"gāngcái","ru":"только что"},{"hz":"马上","py":"mǎshàng","ru":"скоро, сейчас же"},{"hz":"早上","py":"zǎoshang","ru":"утром"},{"hz":"晚上","py":"wǎnshang","ru":"вечером"},{"hz":"时候","py":"shíhou","ru":"время, момент"}]},{"id":"g05","title":"Действия","icon":"🏃","words":[{"hz":"去","py":"qù","ru":"идти, ехать"},{"hz":"来","py":"lái","ru":"приходить"},{"hz":"回","py":"huí","ru":"возвращаться"},{"hz":"看","py":"kàn","ru":"смотреть"},{"hz":"听","py":"tīng","ru":"слушать"},{"hz":"说","py":"shuō","ru":"говорить"},{"hz":"读","py":"dú","ru":"читать"},{"hz":"写","py":"xiě","ru":"писать"},{"hz":"学","py":"xué","ru":"учиться"},{"hz":"做","py":"zuò","ru":"делать"},{"hz":"买","py":"mǎi","ru":"покупать"},{"hz":"卖","py":"mài","ru":"продавать"},{"hz":"找","py":"zhǎo","ru":"искать"},{"hz":"给","py":"gěi","ru":"давать"},{"hz":"拿","py":"ná","ru":"брать"},{"hz":"知道","py":"zhīdào","ru":"знать"},{"hz":"明白","py":"míngbai","ru":"понимать"},{"hz":"喜欢","py":"xǐhuan","ru":"нравиться"},{"hz":"吃","py":"chī","ru":"есть"},{"hz":"喝","py":"hē","ru":"пить"}]},{"id":"g06","title":"Места и расположение","icon":"📍","words":[{"hz":"家","py":"jiā","ru":"дом"},{"hz":"学校","py":"xuéxiào","ru":"школа"},{"hz":"公司","py":"gōngsī","ru":"компания"},{"hz":"商店","py":"shāngdiàn","ru":"магазин"},{"hz":"饭店","py":"fàndiàn","ru":"ресторан"},{"hz":"医院","py":"yīyuàn","ru":"больница"},{"hz":"车站","py":"chēzhàn","ru":"станция, вокзал"},{"hz":"机场","py":"jīchǎng","ru":"аэропорт"},{"hz":"中国","py":"Zhōngguó","ru":"Китай"},{"hz":"这里","py":"zhèlǐ","ru":"здесь"},{"hz":"那里","py":"nàlǐ","ru":"там"},{"hz":"里面","py":"lǐmiàn","ru":"внутри"},{"hz":"外面","py":"wàimiàn","ru":"снаружи"},{"hz":"左边","py":"zuǒbian","ru":"слева"},{"hz":"右边","py":"yòubian","ru":"справа"}]},{"id":"g07","title":"Люди и семья","icon":"👨‍👩‍👧‍👦","words":[{"hz":"妈妈","py":"māma","ru":"мама"},{"hz":"爸爸","py":"bàba","ru":"папа"},{"hz":"哥哥","py":"gēge","ru":"старший брат"},{"hz":"弟弟","py":"dìdi","ru":"младший брат"},{"hz":"姐姐","py":"jiějie","ru":"старшая сестра"},{"hz":"妹妹","py":"mèimei","ru":"младшая сестра"},{"hz":"朋友","py":"péngyou","ru":"друг"},{"hz":"老师","py":"lǎoshī","ru":"учитель"},{"hz":"学生","py":"xuésheng","ru":"ученик"},{"hz":"同事","py":"tóngshì","ru":"коллега"},{"hz":"人","py":"rén","ru":"человек"},{"hz":"孩子","py":"háizi","ru":"ребёнок"},{"hz":"名字","py":"míngzi","ru":"имя"},{"hz":"工作","py":"gōngzuò","ru":"работа"}]},{"id":"g08","title":"Признаки и противоположности","icon":"✨","words":[{"hz":"好","py":"hǎo","ru":"хороший"},{"hz":"坏","py":"huài","ru":"плохой"},{"hz":"大","py":"dà","ru":"большой"},{"hz":"小","py":"xiǎo","ru":"маленький"},{"hz":"快","py":"kuài","ru":"быстрый"},{"hz":"慢","py":"màn","ru":"медленный"},{"hz":"高","py":"gāo","ru":"высокий"},{"hz":"低","py":"dī","ru":"низкий"},{"hz":"新","py":"xīn","ru":"новый"},{"hz":"旧","py":"jiù","ru":"старый"},{"hz":"热","py":"rè","ru":"горячий"},{"hz":"冷","py":"lěng","ru":"холодный"},{"hz":"容易","py":"róngyì","ru":"легко"},{"hz":"难","py":"nán","ru":"трудный"},{"hz":"贵","py":"guì","ru":"дорогой"},{"hz":"便宜","py":"piányi","ru":"дешёвый"}]},{"id":"g09","title":"Еда и напитки","icon":"🍚","words":[{"hz":"水","py":"shuǐ","ru":"вода"},{"hz":"茶","py":"chá","ru":"чай"},{"hz":"咖啡","py":"kāfēi","ru":"кофе"},{"hz":"米饭","py":"mǐfàn","ru":"варёный рис"},{"hz":"面条","py":"miàntiáo","ru":"лапша"},{"hz":"鸡蛋","py":"jīdàn","ru":"яйцо"},{"hz":"牛奶","py":"niúnǎi","ru":"молоко"},{"hz":"水果","py":"shuǐguǒ","ru":"фрукты"},{"hz":"苹果","py":"píngguǒ","ru":"яблоко"},{"hz":"面包","py":"miànbāo","ru":"хлеб"},{"hz":"肉","py":"ròu","ru":"мясо"},{"hz":"菜","py":"cài","ru":"блюдо, овощи"}]},{"id":"g10","title":"Глаголы и частицы","icon":"🧩","words":[{"hz":"不","py":"bù","ru":"не"},{"hz":"没有","py":"méiyǒu","ru":"не иметь, нет"},{"hz":"有","py":"yǒu","ru":"иметь, есть"},{"hz":"是","py":"shì","ru":"быть, являться"},{"hz":"在","py":"zài","ru":"находиться"},{"hz":"会","py":"huì","ru":"уметь (навык)"},{"hz":"能","py":"néng","ru":"мочь"},{"hz":"可以","py":"kěyǐ","ru":"можно"},{"hz":"要","py":"yào","ru":"хотеть, нужно"},{"hz":"想","py":"xiǎng","ru":"хотеть"},{"hz":"了","py":"le","ru":"частица завершённости/изменения"},{"hz":"过","py":"guo","ru":"суффикс опыта"},{"hz":"的","py":"de","ru":"частица определения"},{"hz":"吗","py":"ma","ru":"вопросительная частица"},{"hz":"呢","py":"ne","ru":"частица вопроса/темы"},{"hz":"和","py":"hé","ru":"и (между существительными)"},{"hz":"因为","py":"yīnwèi","ru":"потому что"},{"hz":"所以","py":"suǒyǐ","ru":"поэтому"},{"hz":"但是","py":"dànshì","ru":"но"},{"hz":"如果","py":"rúguǒ","ru":"если"}]},{"id":"g11","title":"Направления и движение","icon":"🧭","words":[{"hz":"上","py":"shàng","ru":"верх, вверх"},{"hz":"下","py":"xià","ru":"низ, вниз"},{"hz":"前","py":"qián","ru":"перед, впереди"},{"hz":"后","py":"hòu","ru":"зад, после"},{"hz":"这边","py":"zhèbiān","ru":"эта сторона, здесь"},{"hz":"那边","py":"nàbiān","ru":"та сторона, там"},{"hz":"远","py":"yuǎn","ru":"далеко"},{"hz":"近","py":"jìn","ru":"близко"},{"hz":"进","py":"jìn","ru":"входить"},{"hz":"出","py":"chū","ru":"выходить"},{"hz":"到","py":"dào","ru":"прибывать"},{"hz":"从","py":"cóng","ru":"из, от"},{"hz":"向","py":"xiàng","ru":"в направлении"},{"hz":"左","py":"zuǒ","ru":"лево"},{"hz":"右","py":"yòu","ru":"право"}]},{"id":"g12","title":"Числа и счёт","icon":"🔢","words":[{"hz":"一","py":"yī","ru":"один"},{"hz":"二","py":"èr","ru":"два"},{"hz":"三","py":"sān","ru":"три"},{"hz":"四","py":"sì","ru":"четыре"},{"hz":"五","py":"wǔ","ru":"пять"},{"hz":"六","py":"liù","ru":"шесть"},{"hz":"七","py":"qī","ru":"семь"},{"hz":"八","py":"bā","ru":"восемь"},{"hz":"九","py":"jiǔ","ru":"девять"},{"hz":"十","py":"shí","ru":"десять"},{"hz":"百","py":"bǎi","ru":"сто"},{"hz":"千","py":"qiān","ru":"тысяча"},{"hz":"两","py":"liǎng","ru":"два (при счёте)"},{"hz":"个","py":"gè","ru":"универсальное счётное слово"}]},{"id":"g13","title":"Вежливость и общение","icon":"💬","words":[{"hz":"你好","py":"nǐ hǎo","ru":"привет, здравствуйте"},{"hz":"谢谢","py":"xièxie","ru":"спасибо"},{"hz":"再见","py":"zàijiàn","ru":"до свидания"},{"hz":"请","py":"qǐng","ru":"пожалуйста (просьба)"},{"hz":"对","py":"duì","ru":"правильно"},{"hz":"不对","py":"bú duì","ru":"неправильно"},{"hz":"没关系","py":"méi guānxi","ru":"ничего страшного"},{"hz":"对不起","py":"duìbuqǐ","ru":"извините"},{"hz":"不客气","py":"bú kèqi","ru":"не за что"},{"hz":"好的","py":"hǎo de","ru":"хорошо"},{"hz":"好吧","py":"hǎo ba","ru":"ладно"},{"hz":"欢迎","py":"huānyíng","ru":"добро пожаловать"}]}];
const allWords=courseCategories.flatMap(group=>group.words.map(word=>({...word,category:group.id})));
const byHanzi=new Map(allWords.map(w=>[w.hz,w]));
const section=document.getElementById('topics');
const originalOpenTopics=window.openLearningTopics;
const originalPractice=window.openPracticeChoices;
const $=(s,within=section)=>within.querySelector(s);
const $$=(s,within=section)=>[...within.querySelectorAll(s)];
const esc=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const norm=s=>String(s).replace(/[！!。．，,？?\s]/g,'');
function getKnown(){try{const list=JSON.parse(localStorage.getItem('chinese-coach-basic-known-v1')||'[]');return Array.isArray(list)?list:[]}catch{return []}}
const known=new Set(getKnown().filter(k=>byHanzi.has(k)));
window.addEventListener('basic-known-restored',()=>{
 known.clear();getKnown().filter(k=>byHanzi.has(k)).forEach(k=>known.add(k));
 if(view==='words'){if(currentCategory)openCategory(currentCategory);else categories();}
});
function saveKnown(){try{localStorage.setItem('chinese-coach-basic-known-v1',JSON.stringify([...known]))}catch{}}
let currentCategory=null,view='words',dialogLesson=null,practiceMode='recall',practiceIndex=0,score=0,attempts=0,audio=null;
const practicePool=allWords.filter(w=>w.hz.length<=4);
function stopAudio(){if(audio){audio.pause();audio=null;}}
function getFile(hz){
 const key=norm(hz);
 return window.courseHumanAudio?.[key]||window.courseNaturalAudio?.[key]||
  window.basicWordAudio?.[hz]||window.basicPinyinAudio?.[hz]||null;
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
  '<h1>'+esc(title)+'</h1>'+(desc?'<p>'+esc(desc)+'</p>':'')+'</div>'+body+
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
 const body='<div class="clean-word-summary"><strong>'+courseCategories.length+' тематических групп · '+allWords.length+' слов и выражений</strong><span data-clean-known-counter>'+known.size+' / '+allWords.length+' выучено</span></div>'+
 '<label class="clean-search-label" for="clean-word-search">Поиск китайского слова</label>'+
 '<input type="search" id="clean-word-search" class="clean-search" placeholder="我, nǎlǐ, куда..." autocomplete="off">'+
 '<div class="clean-category-list">'+courseCategories.map(g=>
 '<button class="clean-category" type="button" data-clean-category="'+g.id+'"><span class="clean-category-icon" aria-hidden="true">'+g.icon+'</span>'+
 '<span><strong>'+esc(g.title)+'</strong><small>'+g.words.length+' слов</small></span><span aria-hidden="true">›</span></button>').join('')+'</div>'+
 '<div class="clean-search-results" hidden></div>';
 frame('Базовые слова','Только слова по темам. Без диалогов, правил и тестов.',body,false);
 $$('[data-clean-category]').forEach(b=>b.onclick=()=>openCategory(b.dataset.cleanCategory));
 $('#clean-word-search').oninput=e=>{
  const q=e.target.value.toLocaleLowerCase().trim();
  const result=$('.clean-search-results'),items=$('.clean-category-list');
  if(!q){items.hidden=false;result.hidden=true;result.innerHTML='';return}
  const matches=allWords.filter(w=>[w.hz,w.py,w.ru].some(x=>x.toLocaleLowerCase().includes(q))).slice(0,90);
  items.hidden=true;result.hidden=false;
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
 dialogLesson=null;view='dialogues';
 const lessons=COURSE.filter(l=>l.id!==1&&l.dialogue?.length);
 frame('Диалоги','Только разговоры. Женский и мужской голоса по ролям.',
 '<div class="clean-category-list">'+lessons.map(l=>
 '<button class="clean-category" data-dialog-lesson="'+l.id+'" type="button"><span class="clean-category-icon" aria-hidden="true">💬</span>'+
 '<span><strong>'+esc(l.title)+'</strong><small>'+l.dialogue.length+' реплик</small></span><span aria-hidden="true">›</span></button>').join('')+'</div>',false);
 $$('[data-dialog-lesson]').forEach(b=>b.onclick=()=>showDialogue(Number(b.dataset.dialogLesson)));
}
function showDialogue(id){
 const l=COURSE.find(l=>l.id===id&&l.id!==1);if(!l)return;
 dialogLesson=id;view='dialogues';stopAudio();
 const legacy=localStorage.getItem('chinese-coach-dialogue-original-v72')==='1';
 const voiceRow=id===2
  ?'<div class="clean-dialog-voice"><span>Анна — женский голос · Сяомин — мужской голос</span></div>'
  :'<div class="clean-dialog-voice"><span data-dialogue-voice-caption>'+(legacy?'Старые голоса · Xiaoxiao / Yunxi':'Новые голоса · Xiaoxuan / Yunjian')+'</span><button type="button" data-dialogue-voice-toggle>'+(legacy?'Включить новые голоса':'Сравнить со старыми')+'</button></div>';
 const content='<div class="clean-dialog-head"><button type="button" class="clean-action-primary" data-dialogue-play-all>▶ Слушать весь диалог</button></div>'+voiceRow+
 '<div class="clean-dialog-lines">'+l.dialogue.map(([who,hz,py,ru],i)=>
 '<article class="dialogue-row clean-dialog-line" data-standalone-line="'+i+'"><div class="clean-dialog-avatar '+((id===2?who==='B':who==='A')?'girl':'boy')+'">'+
 '<img src="./assets/'+((id===2?who==='B':who==='A')?'meaning-woman.webp':'meaning-man.webp')+'" alt="'+((id===2?who==='B':who==='A')?'Собеседница':'Собеседник')+'"></div>'+
 '<div class="clean-dialog-bubble"><strong lang="zh-Hans">'+esc(hz)+'</strong><span>'+esc(py)+'</span><small>'+esc(ru)+'</small>'+
 '<button type="button" data-dialogue-line="'+i+'">🔊 Слушать</button></div></article>').join('')+'</div>';
 frame(l.title,'Диалог · '+l.dialogue.length+' реплик',content,dialogueCategories);
 $$('[data-dialogue-line]').forEach(b=>b.onclick=()=>window.playDialogueLine?.(id,Number(b.dataset.dialogueLine)));
 $('[data-dialogue-play-all]').onclick=()=>window.playStandaloneDialogue?.(id);
 const toggle=$('[data-dialogue-voice-toggle]');
 if(toggle)toggle.onclick=()=>{
  const wasLegacy=localStorage.getItem('chinese-coach-dialogue-original-v72')==='1';
  localStorage.setItem('chinese-coach-dialogue-original-v72',wasLegacy?'0':'1');
  stopAudio();window.dispatchEvent(new Event('learning-audio-stop'));
  $('[data-dialogue-voice-caption]').textContent=wasLegacy?'Новые голоса · Xiaoxuan / Yunjian':'Старые голоса · Xiaoxiao / Yunxi';
  $('[data-dialogue-voice-toggle]').textContent=wasLegacy?'Сравнить со старыми':'Включить новые голоса';
 };
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
 practiceMode=mode;practiceIndex=0;score=0;attempts=0;renderPractice();
}
function renderPractice(){
 view='practice';stopAudio();
 const pool=practiceCandidates();if(!pool.length){frame('Практика','Нет доступных озвученных слов.','<p>Сначала скачай MP3 в настройках.</p>',practiceHome);return}
 const word=pool[(practiceIndex*17+5)%pool.length];
 const heading=practiceMode==='recall'?'Карточки на память':practiceMode==='listening'?'Узнай слово на слух':'Выбери перевод';
 const left='<div class="clean-practice-metrics">Задание '+(attempts+1)+' · Верно: '+score+' из '+attempts+'</div>';
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
  $$('[data-recall]').forEach(b=>b.onclick=()=>{attempts++;if(b.dataset.recall==='know'){score++;known.add(word.hz);saveKnown()}practiceIndex++;renderPractice()});
 }else{
  $$('[data-choice-ru]').forEach(b=>b.onclick=()=>{
   if($('[data-choice-ru]:disabled'))return;
   const correct=b.dataset.choiceRu===word.ru;attempts++;if(correct){score++;known.add(word.hz);saveKnown()}
   $$('.clean-choice-grid button').forEach(v=>{v.disabled=true;v.classList.toggle('is-correct',v.dataset.choiceRu===word.ru)});
   b.classList.toggle('is-wrong',!correct);
   $('.clean-practice-feedback').textContent=correct?'Верно! ✓':'Правильный перевод: '+word.ru;
  });
 }
 $('[data-practice-next]').onclick=()=>{practiceIndex++;renderPractice()};
}
window.openLearningTopics=function(kind='course'){
 if(kind==='words'){originalOpenTopics('words');categories();return}
 if(kind==='dialogues'){originalOpenTopics('dialogues');dialogueCategories();return}
 originalOpenTopics(kind);
};
window.openPracticeChoices=function(){originalPractice();practiceHome()};
window.__simpleSectionPreview={data:courseCategories,total:allWords.length,getFile};
})();