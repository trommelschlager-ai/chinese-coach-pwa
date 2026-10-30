/* Simplified pronunciation hub — approved variant 3.
   Existing lessons, artwork, tone grid, microphone and listening lab remain intact. */
(() => {
  'use strict';
  const page=document.getElementById('tones');
  const head=page?.querySelector('.columnhead');
  const intro=page?.querySelector('.tone-intro');
  const grid=page?.querySelector('.tonegrid');
  const lab=document.getElementById('listening-lab');
  const practice=page?.querySelector('.practice');
  const voices=document.getElementById('mandarin-voice-settings');
  if(!head||!intro||!grid||!lab||!practice||!voices||document.getElementById('pronunciation-hub'))return;

  const heading=head.querySelector('h1'),description=head.querySelector('p'),eyebrow=head.querySelector('.eyebrow');
  if(heading)heading.textContent='Китайское произношение';
  if(description)description.textContent='Выбери, что будем тренировать сегодня.';
  if(eyebrow)eyebrow.textContent='ПРОСТО · ПО ШАГАМ';

  const hub=document.createElement('section');
  hub.id='pronunciation-hub';
  hub.className='pronunciation-hub';
  hub.innerHTML=[
    '<div class="pronunciation-choices">',
      '<button type="button" class="pronunciation-choice" data-pronunciation-mode="listen">',
        '<span class="pronunciation-icon" aria-hidden="true">🎧</span>',
        '<span class="pronunciation-choice-copy"><strong>Слушать тоны</strong><small>Узнай, как звучат четыре тона</small></span>',
        '<span class="pronunciation-chevron" aria-hidden="true">›</span>',
      '</button>',
      '<button type="button" class="pronunciation-choice" data-pronunciation-mode="combinations">',
        '<span class="pronunciation-icon" aria-hidden="true">拼</span>',
        '<span class="pronunciation-choice-copy"><strong>Чтение пиньиня A–Z</strong><small>Все звуки, финали, сочетания и правила</small></span>',
        '<span class="pronunciation-chevron" aria-hidden="true">›</span>',
      '</button>',
      '<button type="button" class="pronunciation-choice" data-pronunciation-mode="quiz">',
        '<span class="pronunciation-icon" aria-hidden="true">🧠</span>',
        '<span class="pronunciation-choice-copy"><strong>Угадать на слух</strong><small>10 вопросов · включая нейтральный тон</small></span>',
        '<span class="pronunciation-chevron" aria-hidden="true">›</span>',
      '</button>',
      '<button type="button" class="pronunciation-choice" data-pronunciation-mode="speak">',
        '<span class="pronunciation-icon" aria-hidden="true">🎙️</span>',
        '<span class="pronunciation-choice-copy"><strong>Моё произношение</strong><small>Запиши голос и сравни интонацию</small></span>',
        '<span class="pronunciation-chevron" aria-hidden="true">›</span>',
      '</button>',
    '</div>',
    '<div class="pronunciation-tools">',
      '<details id="pronunciation-settings"><summary>⚙️ Голос и скорость · образцы</summary>',
        '<div id="pronunciation-voice-slot"></div>',
        '<section class="pronunciation-voice-demos" aria-label="Сравнить настоящие голоса">',
          '<p><strong>Послушай записи носителей перед заменой голоса по умолчанию</strong></p>',
          '<p class="pronunciation-demo-note">Это короткие записи двух разных слов, а не озвучка всего курса. Для прослушивания нужен интернет.</p>',
          '<div class="pronunciation-demo-buttons">',
            '<button type="button" data-demo-voice="female">▶ Женский голос · 麻 má</button>',
            '<button type="button" data-demo-voice="male">▶ Мужской голос · 马 mǎ</button>',
            '<button type="button" data-demo-voice="system">▶ Голос телефона · 你好</button>',
          '</div>',
          '<p id="pronunciation-demo-feedback" role="status" aria-live="polite" class="pronunciation-demo-feedback"></p>',
          '<details class="pronunciation-audio-credits"><summary>Авторы и лицензии записей</summary>',
            '<p><a href="https://commons.wikimedia.org/wiki/File:Zh-m%C3%A1.ogg" target="_blank" rel="noopener noreferrer">麻 má: Yue Tan, CC BY-SA 3.0 US</a></p>',
            '<p><a href="https://commons.wikimedia.org/wiki/File:Zh-m%C7%8E.ogg" target="_blank" rel="noopener noreferrer">马 mǎ: Wei Gao / Vion Nicolas, CC BY 2.0 FR</a></p>',
          '</details>',
          '<p class="pronunciation-demo-notice">В уроках используется сохранённое MP3-аудио. Голос телефона включается только при ручном выборе образца.</p>',
        '</section>',
      '</details>',
      '<details id="pronunciation-howto"><summary>📖 Как заниматься</summary>',
        '<p>Начни со «Слушать тоны», затем попробуй «Угадать на слух». Когда почувствуешь разницу, открой «Моё произношение» и повтори слог. Проверка микрофоном приблизительная.</p>',
      '</details>',
    '</div>'
  ].join('');


  // Comprehensive Hanyu Pinyin reference: school-style initials, all common
  // finals, spelling changes and tone rules, sorted A-to-Z for mobile study.
  const reading={"groups":[{"letter":"A","title":"a → ao · финали","hint":"a, ai, an, ang и ao. Отличай передний -n от заднего -ng.","items":[{"unit":"a","py":"bā","hz":"八","ru":"восемь","id":"p001"},{"unit":"ai","py":"ài","hz":"爱","ru":"любить","id":"p002"},{"unit":"an","py":"ān","hz":"安","ru":"спокойствие","id":"p003"},{"unit":"ang","py":"áng","hz":"昂","ru":"высокий","id":"p004"},{"unit":"ao","py":"ǎo","hz":"袄","ru":"куртка","id":"p005"},{"unit":"a","py":"dà","hz":"大","ru":"большой","id":"p009"},{"unit":"ai","py":"lái","hz":"来","ru":"приходить","id":"p030"},{"unit":"an","py":"kàn","hz":"看","ru":"смотреть","id":"p092"},{"unit":"ang","py":"máng","hz":"忙","ru":"занятой","id":"p093"},{"unit":"ao","py":"hǎo","hz":"好","ru":"хорошо","id":"p017"}]},{"letter":"B","title":"b · согласная","hint":"b без сильного придыхания. Сравни потом с p.","items":[{"unit":"b","py":"bāo","hz":"包","ru":"сумка","id":"p006"},{"unit":"b","py":"bā","hz":"八","ru":"восемь","id":"p001"},{"unit":"b","py":"bǐ","hz":"比","ru":"сравнивать","id":"p094"},{"unit":"b","py":"bù","hz":"不","ru":"не","id":"p095"},{"unit":"b","py":"běi","hz":"北","ru":"север","id":"p096"},{"unit":"b","py":"běn","hz":"本","ru":"книга (счётное слово)","id":"p097"},{"unit":"b","py":"biǎo","hz":"表","ru":"таблица","id":"p098"}]},{"letter":"C","title":"c · ch","hint":"c — передний придыхательный звук; ch — с языком, загнутым назад.","items":[{"unit":"c","py":"cài","hz":"菜","ru":"блюдо","id":"p007"},{"unit":"ch","py":"chī","hz":"吃","ru":"есть","id":"p008"},{"unit":"c","py":"cì","hz":"次","ru":"раз","id":"p062"},{"unit":"c","py":"cǎo","hz":"草","ru":"трава","id":"p099"},{"unit":"ch","py":"chá","hz":"茶","ru":"чай","id":"p100"},{"unit":"ch","py":"chūn","hz":"春","ru":"весна","id":"p049"},{"unit":"ch","py":"cháng","hz":"长","ru":"длинный","id":"p101"}]},{"letter":"D","title":"d · согласная","hint":"d без сильного придыхания; t произносится с сильнее заметным выдохом.","items":[{"unit":"d","py":"dà","hz":"大","ru":"большой","id":"p009"},{"unit":"d","py":"duì","hz":"对","ru":"верно","id":"p074"},{"unit":"d","py":"duō","hz":"多","ru":"много","id":"p102"},{"unit":"d","py":"dōng","hz":"东","ru":"восток","id":"p034"},{"unit":"d","py":"diàn","hz":"电","ru":"электричество","id":"p103"},{"unit":"d","py":"dī","hz":"低","ru":"низкий","id":"p104"}]},{"letter":"E","title":"e → er · финали","hint":"e не всегда русское «э»; ei — скользящее сочетание. er — особый слог.","items":[{"unit":"e","py":"è","hz":"饿","ru":"голодный","id":"p010"},{"unit":"ei","py":"bēi","hz":"杯","ru":"чашка","id":"p011"},{"unit":"en","py":"ēn","hz":"恩","ru":"доброта","id":"p012"},{"unit":"eng","py":"dēng","hz":"灯","ru":"лампа","id":"p013"},{"unit":"er","py":"èr","hz":"二","ru":"два","id":"p014"},{"unit":"e","py":"é","hz":"额","ru":"лоб","id":"p105"},{"unit":"ei","py":"gěi","hz":"给","ru":"давать","id":"p106"},{"unit":"en","py":"hěn","hz":"很","ru":"очень","id":"p107"},{"unit":"eng","py":"lěng","hz":"冷","ru":"холодный","id":"p108"},{"unit":"er","py":"ěr","hz":"耳","ru":"ухо","id":"p109"}]},{"letter":"F","title":"f · согласная","hint":"f похожа на русскую «ф».","items":[{"unit":"f","py":"fàn","hz":"饭","ru":"еда","id":"p015"},{"unit":"f","py":"fēi","hz":"飞","ru":"летать","id":"p110"},{"unit":"f","py":"fēng","hz":"风","ru":"ветер","id":"p111"},{"unit":"f","py":"fáng","hz":"房","ru":"комната","id":"p112"},{"unit":"f","py":"fēn","hz":"分","ru":"минута","id":"p113"},{"unit":"f","py":"fàng","hz":"放","ru":"класть","id":"p114"}]},{"letter":"G","title":"g · согласная","hint":"g без придыхания, в отличие от k.","items":[{"unit":"g","py":"gē","hz":"哥","ru":"старший брат","id":"p016"},{"unit":"g","py":"gāo","hz":"高","ru":"высокий","id":"p115"},{"unit":"g","py":"gōng","hz":"工","ru":"работа","id":"p116"},{"unit":"g","py":"guì","hz":"贵","ru":"дорогой","id":"p117"},{"unit":"g","py":"guǒ","hz":"果","ru":"фрукт","id":"p118"},{"unit":"g","py":"gēn","hz":"跟","ru":"с","id":"p119"}]},{"letter":"H","title":"h · согласная","hint":"h образуется глубже в горле; не совсем русское «х».","items":[{"unit":"h","py":"hǎo","hz":"好","ru":"хорошо","id":"p017"},{"unit":"h","py":"hē","hz":"喝","ru":"пить","id":"p120"},{"unit":"h","py":"hǎi","hz":"海","ru":"море","id":"p121"},{"unit":"h","py":"hěn","hz":"很","ru":"очень","id":"p107"},{"unit":"h","py":"hóng","hz":"红","ru":"красный","id":"p122"},{"unit":"h","py":"huā","hz":"花","ru":"цветок","id":"p043"}]},{"letter":"I","title":"i → iu · финали","hint":"После некоторых согласных i звучит необычно: в zi, zhi она не равна обычному «и».","items":[{"unit":"i","py":"yī","hz":"衣","ru":"одежда","id":"p018"},{"unit":"ia","py":"jiā","hz":"家","ru":"дом","id":"p019"},{"unit":"ian","py":"tiān","hz":"天","ru":"небо","id":"p020"},{"unit":"iang","py":"xiāng","hz":"香","ru":"ароматный","id":"p021"},{"unit":"iao","py":"xiǎo","hz":"小","ru":"маленький","id":"p022"},{"unit":"ie","py":"xiè","hz":"谢","ru":"благодарить","id":"p023"},{"unit":"in","py":"xīn","hz":"新","ru":"новый","id":"p024"},{"unit":"ing","py":"tīng","hz":"听","ru":"слушать","id":"p025"},{"unit":"iong","py":"xióng","hz":"熊","ru":"медведь","id":"p026"},{"unit":"iu","py":"liù","hz":"六","ru":"шесть","id":"p027"},{"unit":"ian","py":"miàn","hz":"面","ru":"лицо","id":"p123"},{"unit":"iang","py":"xiǎng","hz":"想","ru":"думать","id":"p124"},{"unit":"iao","py":"niǎo","hz":"鸟","ru":"птица","id":"p125"},{"unit":"ie","py":"xiě","hz":"写","ru":"писать","id":"p126"},{"unit":"ing","py":"míng","hz":"明","ru":"светлый","id":"p127"},{"unit":"iu","py":"jiǔ","hz":"九","ru":"девять","id":"p128"}]},{"letter":"J","title":"j · согласная","hint":"j — мягкий звук без сильного выдоха. Сравни с q.","items":[{"unit":"j","py":"jī","hz":"鸡","ru":"курица","id":"p028"},{"unit":"j","py":"jiàn","hz":"见","ru":"видеть","id":"p129"},{"unit":"j","py":"jiā","hz":"家","ru":"дом","id":"p019"},{"unit":"j","py":"jiǔ","hz":"九","ru":"девять","id":"p128"},{"unit":"j","py":"jiào","hz":"叫","ru":"звать","id":"p130"},{"unit":"j","py":"jiù","hz":"就","ru":"как раз","id":"p131"}]},{"letter":"K","title":"k · согласная","hint":"k произносится с придыханием; в паре g/k важно ощущать выдох.","items":[{"unit":"k","py":"kě","hz":"可","ru":"можно","id":"p029"},{"unit":"k","py":"kāi","hz":"开","ru":"открывать","id":"p132"},{"unit":"k","py":"kǒu","hz":"口","ru":"рот","id":"p133"},{"unit":"k","py":"kuài","hz":"快","ru":"быстрый","id":"p044"},{"unit":"k","py":"kōng","hz":"空","ru":"пустой","id":"p134"},{"unit":"k","py":"kàn","hz":"看","ru":"смотреть","id":"p092"}]},{"letter":"L","title":"l · согласная","hint":"l произносится кончиком языка у верхних зубов.","items":[{"unit":"l","py":"lái","hz":"来","ru":"приходить","id":"p030"},{"unit":"l","py":"lǎo","hz":"老","ru":"старый","id":"p135"},{"unit":"l","py":"lǐ","hz":"里","ru":"внутри","id":"p136"},{"unit":"l","py":"lù","hz":"路","ru":"дорога","id":"p137"},{"unit":"l","py":"liù","hz":"六","ru":"шесть","id":"p027"},{"unit":"l","py":"lǜ","hz":"绿","ru":"зелёный","id":"p072"}]},{"letter":"M","title":"m · согласная","hint":"m — носовой звук.","items":[{"unit":"m","py":"mā","hz":"妈","ru":"мама","id":"p031"},{"unit":"m","py":"mǎ","hz":"马","ru":"лошадь","id":"p077"},{"unit":"m","py":"mǐ","hz":"米","ru":"рис","id":"p138"},{"unit":"m","py":"mǎi","hz":"买","ru":"покупать","id":"p139"},{"unit":"m","py":"màn","hz":"慢","ru":"медленный","id":"p140"},{"unit":"m","py":"méi","hz":"没","ru":"не иметь","id":"p141"}]},{"letter":"N","title":"n · согласная","hint":"n — носовой звук, не путай с l.","items":[{"unit":"n","py":"nǐ","hz":"你","ru":"ты","id":"p032"},{"unit":"n","py":"nián","hz":"年","ru":"год","id":"p142"},{"unit":"n","py":"nán","hz":"男","ru":"мужчина","id":"p143"},{"unit":"n","py":"nǚ","hz":"女","ru":"женщина","id":"p051"},{"unit":"n","py":"néng","hz":"能","ru":"мочь","id":"p144"},{"unit":"n","py":"nán","hz":"南","ru":"юг","id":"p145"}]},{"letter":"O","title":"o → ou · финали","hint":"ong — носовая финаль; ou — скользящий гласный.","items":[{"unit":"o","py":"bō","hz":"波","ru":"волна","id":"p033"},{"unit":"ong","py":"dōng","hz":"东","ru":"восток","id":"p034"},{"unit":"ou","py":"ōu","hz":"欧","ru":"Европа","id":"p035"},{"unit":"o","py":"pō","hz":"坡","ru":"склон","id":"p146"},{"unit":"o","py":"mō","hz":"摸","ru":"трогать","id":"p147"},{"unit":"o","py":"fó","hz":"佛","ru":"Будда","id":"p148"},{"unit":"ong","py":"hóng","hz":"红","ru":"красный","id":"p122"},{"unit":"ong","py":"zhōng","hz":"中","ru":"середина","id":"p149"},{"unit":"ou","py":"zǒu","hz":"走","ru":"идти","id":"p150"},{"unit":"ou","py":"shǒu","hz":"手","ru":"рука","id":"p151"}]},{"letter":"P","title":"p · согласная","hint":"p — сильное придыхание; поднеси ладонь ко рту и почувствуй выдох.","items":[{"unit":"p","py":"pāi","hz":"拍","ru":"хлопать","id":"p036"},{"unit":"p","py":"pà","hz":"怕","ru":"бояться","id":"p152"},{"unit":"p","py":"piào","hz":"票","ru":"билет","id":"p153"},{"unit":"p","py":"pǎo","hz":"跑","ru":"бежать","id":"p154"},{"unit":"p","py":"péng","hz":"朋","ru":"друг","id":"p155"},{"unit":"p","py":"píng","hz":"平","ru":"ровный","id":"p156"}]},{"letter":"Q","title":"q · согласная","hint":"q похожа на мягкий придыхательный «ч», не путай с ch.","items":[{"unit":"q","py":"qī","hz":"七","ru":"семь","id":"p037"},{"unit":"q","py":"qù","hz":"去","ru":"идти","id":"p069"},{"unit":"q","py":"qián","hz":"钱","ru":"деньги","id":"p157"},{"unit":"q","py":"qǐng","hz":"请","ru":"пожалуйста","id":"p158"},{"unit":"q","py":"qǐ","hz":"起","ru":"вставать","id":"p159"},{"unit":"q","py":"qiú","hz":"球","ru":"мяч","id":"p160"}]},{"letter":"R","title":"r · согласная","hint":"Китайская r не равна русской раскатистой «р».","items":[{"unit":"r","py":"rén","hz":"人","ru":"человек","id":"p038"},{"unit":"r","py":"rè","hz":"热","ru":"горячий","id":"p161"},{"unit":"r","py":"rì","hz":"日","ru":"день","id":"p065"},{"unit":"r","py":"ràng","hz":"让","ru":"позволять","id":"p162"},{"unit":"r","py":"róng","hz":"容","ru":"вмещать","id":"p163"},{"unit":"r","py":"ròu","hz":"肉","ru":"мясо","id":"p164"}]},{"letter":"S","title":"s · sh","hint":"s — передний звук, sh — с загнутым назад языком.","items":[{"unit":"s","py":"sān","hz":"三","ru":"три","id":"p039"},{"unit":"sh","py":"shū","hz":"书","ru":"книга","id":"p040"},{"unit":"s","py":"sì","hz":"四","ru":"четыре","id":"p063"},{"unit":"s","py":"sòng","hz":"送","ru":"дарить","id":"p165"},{"unit":"s","py":"sù","hz":"素","ru":"вегетарианский","id":"p166"},{"unit":"sh","py":"shān","hz":"山","ru":"гора","id":"p167"},{"unit":"sh","py":"shuǐ","hz":"水","ru":"вода","id":"p048"},{"unit":"sh","py":"shuō","hz":"说","ru":"говорить","id":"p168"}]},{"letter":"T","title":"t · согласная","hint":"t с выраженным придыханием, в отличие от d.","items":[{"unit":"t","py":"tā","hz":"他","ru":"он","id":"p041"},{"unit":"t","py":"tiān","hz":"天","ru":"небо","id":"p020"},{"unit":"t","py":"tīng","hz":"听","ru":"слушать","id":"p025"},{"unit":"t","py":"tài","hz":"太","ru":"слишком","id":"p169"},{"unit":"t","py":"tóng","hz":"同","ru":"одинаковый","id":"p170"},{"unit":"t","py":"tǔ","hz":"土","ru":"земля","id":"p171"}]},{"letter":"U","title":"u → uo · финали","hint":"ui и un — сокращённые записи uei и uen. Различай u и ü.","items":[{"unit":"u","py":"wū","hz":"屋","ru":"дом","id":"p042"},{"unit":"ua","py":"huā","hz":"花","ru":"цветок","id":"p043"},{"unit":"uai","py":"kuài","hz":"快","ru":"быстрый","id":"p044"},{"unit":"uan","py":"guān","hz":"关","ru":"закрывать","id":"p045"},{"unit":"uang","py":"guāng","hz":"光","ru":"свет","id":"p046"},{"unit":"ueng","py":"wēng","hz":"翁","ru":"старец","id":"p047"},{"unit":"ui","py":"shuǐ","hz":"水","ru":"вода","id":"p048"},{"unit":"un","py":"chūn","hz":"春","ru":"весна","id":"p049"},{"unit":"uo","py":"guó","hz":"国","ru":"страна","id":"p050"},{"unit":"u","py":"wǔ","hz":"五","ru":"пять","id":"p172"},{"unit":"ua","py":"guā","hz":"瓜","ru":"дыня","id":"p173"},{"unit":"uai","py":"wài","hz":"外","ru":"снаружи","id":"p174"},{"unit":"uan","py":"wán","hz":"玩","ru":"играть","id":"p175"},{"unit":"uang","py":"wáng","hz":"王","ru":"король","id":"p176"},{"unit":"ui","py":"duì","hz":"对","ru":"верно","id":"p074"},{"unit":"un","py":"lùn","hz":"论","ru":"обсуждать","id":"p075"},{"unit":"uo","py":"shuō","hz":"说","ru":"говорить","id":"p168"}]},{"letter":"Ü","title":"ü · финали с округлёнными губами","hint":"Скажи «и», сохрани положение языка и округли губы как для «у».","items":[{"unit":"ü","py":"nǚ","hz":"女","ru":"женщина","id":"p051"},{"unit":"üe","py":"yuè","hz":"月","ru":"луна","id":"p052"},{"unit":"üan","py":"yuán","hz":"圆","ru":"круглый","id":"p053"},{"unit":"ün","py":"yún","hz":"云","ru":"облако","id":"p054"},{"unit":"ü","py":"lǜ","hz":"绿","ru":"зелёный","id":"p072"},{"unit":"ü","py":"yú","hz":"鱼","ru":"рыба","id":"p071"},{"unit":"üe","py":"xuě","hz":"雪","ru":"снег","id":"p177"},{"unit":"üan","py":"juǎn","hz":"卷","ru":"сворачивать","id":"p178"},{"unit":"ün","py":"qún","hz":"群","ru":"группа","id":"p179"}]},{"letter":"W","title":"w · вспомогательная буква","hint":"w записывает слоги без начального согласного: wu, wo, wai, wen.","items":[{"unit":"w","py":"wǒ","hz":"我","ru":"я","id":"p055"},{"unit":"w","py":"wèn","hz":"问","ru":"спрашивать","id":"p180"},{"unit":"w","py":"wǎn","hz":"晚","ru":"поздний","id":"p181"},{"unit":"w","py":"wán","hz":"玩","ru":"играть","id":"p175"},{"unit":"w","py":"wài","hz":"外","ru":"снаружи","id":"p174"},{"unit":"w","py":"wú","hz":"无","ru":"нет","id":"p182"}]},{"letter":"X","title":"x · согласная","hint":"x — мягкая шипящая согласная; не путай с русским «кс».","items":[{"unit":"x","py":"xī","hz":"西","ru":"запад","id":"p056"},{"unit":"x","py":"xiǎng","hz":"想","ru":"думать","id":"p124"},{"unit":"x","py":"xuě","hz":"雪","ru":"снег","id":"p177"},{"unit":"x","py":"xué","hz":"学","ru":"учиться","id":"p183"},{"unit":"x","py":"xiān","hz":"先","ru":"сначала","id":"p090"},{"unit":"x","py":"xiè","hz":"谢","ru":"благодарить","id":"p023"}]},{"letter":"Y","title":"y · вспомогательная буква","hint":"y записывает слоги без начального согласного: yi, ya, ye, yu.","items":[{"unit":"y","py":"yī","hz":"一","ru":"один","id":"p057"},{"unit":"y","py":"yuè","hz":"月","ru":"луна","id":"p052"},{"unit":"y","py":"yún","hz":"云","ru":"облако","id":"p054"},{"unit":"y","py":"yáng","hz":"羊","ru":"овца","id":"p184"},{"unit":"y","py":"yǒu","hz":"有","ru":"иметь","id":"p185"},{"unit":"y","py":"yào","hz":"要","ru":"хотеть","id":"p186"}]},{"letter":"Z","title":"z · zh","hint":"z произносится с языком впереди; zh — с языком, загнутым назад.","items":[{"unit":"z","py":"zì","hz":"字","ru":"иероглиф","id":"p058"},{"unit":"zh","py":"zhī","hz":"知","ru":"знать","id":"p059"},{"unit":"z","py":"zuò","hz":"做","ru":"делать","id":"p187"},{"unit":"z","py":"zǒu","hz":"走","ru":"идти","id":"p150"},{"unit":"z","py":"zài","hz":"在","ru":"находиться","id":"p188"},{"unit":"zh","py":"zhè","hz":"这","ru":"этот","id":"p189"},{"unit":"zh","py":"zhōng","hz":"中","ru":"середина","id":"p149"},{"unit":"zh","py":"zǎo","hz":"早","ru":"рано","id":"p190"}]}],"rules":[{"title":"1. Слог = начальная + финаль + тон","detail":"Начальной согласной может не быть. В bā: b + a + первый тон.","items":[{"py":"bā","hz":"八","ru":"восемь","id":"p001"},{"py":"mā","hz":"妈","ru":"мама","id":"p031"}]},{"title":"2. Придыхание: b/p, d/t, g/k","detail":"Пары отличаются прежде всего силой выдоха, а не русским противопоставлением «звонкий/глухой».","items":[{"py":"bā","hz":"八","ru":"восемь","id":"p001"},{"py":"pā","hz":"趴","ru":"лежать лицом вниз","id":"p060"},{"py":"dà","hz":"大","ru":"большой","id":"p009"},{"py":"tā","hz":"他","ru":"он","id":"p041"},{"py":"gē","hz":"哥","ru":"брат","id":"p016"},{"py":"kē","hz":"科","ru":"предмет науки","id":"p061"}]},{"title":"3. Передние z/c/s и загнутые zh/ch/sh/r","detail":"В zh, ch, sh кончик языка отходит назад. В z, c, s остаётся ближе к зубам.","items":[{"py":"zì","hz":"字","ru":"иероглиф","id":"p058"},{"py":"cì","hz":"次","ru":"раз","id":"p062"},{"py":"sì","hz":"四","ru":"четыре","id":"p063"},{"py":"zhī","hz":"知","ru":"знать","id":"p059"},{"py":"chī","hz":"吃","ru":"есть","id":"p008"},{"py":"shī","hz":"诗","ru":"стих","id":"p064"},{"py":"rì","hz":"日","ru":"день","id":"p065"}]},{"title":"4. Мягкие j/q/x","detail":"j без сильного выдоха, q с придыханием, x — щелевой звук. Не заменяй русскими «дж/ч/кс».","items":[{"py":"jī","hz":"鸡","ru":"курица","id":"p028"},{"py":"qī","hz":"七","ru":"семь","id":"p037"},{"py":"xī","hz":"西","ru":"запад","id":"p056"}]},{"title":"5. Особенная i после z, c, s, zh, ch, sh, r","detail":"В zi, ci, si, zhi, chi, shi, ri буква i не произносится как обычное «и».","items":[{"py":"zì","hz":"字","ru":"иероглиф","id":"p058"},{"py":"cí","hz":"词","ru":"слово","id":"p066"},{"py":"sì","hz":"四","ru":"четыре","id":"p063"},{"py":"zhī","hz":"知","ru":"знать","id":"p059"},{"py":"chī","hz":"吃","ru":"есть","id":"p008"},{"py":"shì","hz":"是","ru":"быть","id":"p067"},{"py":"rì","hz":"日","ru":"день","id":"p065"}]},{"title":"6. ü и написание после j, q, x, y","detail":"После j/q/x/y точки над ü опускаются: ju, qu, xu, yu. Но звучит ü, не u.","items":[{"py":"jǔ","hz":"举","ru":"поднимать","id":"p068"},{"py":"qù","hz":"去","ru":"идти","id":"p069"},{"py":"xū","hz":"需","ru":"нужно","id":"p070"},{"py":"yú","hz":"鱼","ru":"рыба","id":"p071"}]},{"title":"7. После n и l точки над ü остаются","detail":"nǚ и lǜ не путай с nu и lu — это разные слоги.","items":[{"py":"nǚ","hz":"女","ru":"женщина","id":"p051"},{"py":"lǜ","hz":"绿","ru":"зелёный","id":"p072"}]},{"title":"8. Почему пишут y и w","detail":"Если начального согласного нет, написание начинается с y/w: yi, wu, ya, wo, yu.","items":[{"py":"yī","hz":"衣","ru":"одежда","id":"p018"},{"py":"wū","hz":"屋","ru":"дом","id":"p042"},{"py":"yú","hz":"鱼","ru":"рыба","id":"p071"},{"py":"wǒ","hz":"我","ru":"я","id":"p055"}]},{"title":"9. Сокращение iou → iu","detail":"После согласного полное сочетание iou пишут iu: liù, niú. Знак тона ставится над u.","items":[{"py":"liù","hz":"六","ru":"шесть","id":"p027"},{"py":"niú","hz":"牛","ru":"корова","id":"p073"}]},{"title":"10. Сокращение uei → ui","detail":"После согласного uei пишут ui: shuǐ, duì. Знак тона ставится над i.","items":[{"py":"shuǐ","hz":"水","ru":"вода","id":"p048"},{"py":"duì","hz":"对","ru":"верно","id":"p074"}]},{"title":"11. Сокращение uen → un","detail":"После согласного uen пишут un: chūn, lùn.","items":[{"py":"chūn","hz":"春","ru":"весна","id":"p049"},{"py":"lùn","hz":"论","ru":"обсуждать","id":"p075"}]},{"title":"12. Куда ставить знак тона","detail":"Приоритет у a, затем o/e; в сочетаниях iu/ui знак над последней гласной.","items":[{"py":"hǎo","hz":"好","ru":"хорошо","id":"p017"},{"py":"liù","hz":"六","ru":"шесть","id":"p027"},{"py":"shuǐ","hz":"水","ru":"вода","id":"p048"}]},{"title":"13. Четыре тона и нейтральный","detail":"mā высокий ровный, má восходящий, mǎ низкий (изолированно с подъёмом), mà нисходящий; ma — без собственного устойчивого тона.","items":[{"py":"mā","hz":"妈","ru":"мама","id":"p031"},{"py":"má","hz":"麻","ru":"конопля","id":"p076"},{"py":"mǎ","hz":"马","ru":"лошадь","id":"p077"},{"py":"mà","hz":"骂","ru":"ругать","id":"p078"},{"py":"ma","hz":"吗","ru":"вопросительная частица","id":"p079"}]},{"title":"14. Два третьих тона подряд","detail":"В 你好 словарно nǐ hǎo, а в обычной речи первый слог звучит как ní.","items":[{"py":"nǐ hǎo","hz":"你好","ru":"привет","id":"p080"},{"py":"hěn hǎo","hz":"很好","ru":"очень хорошо","id":"p081"}]},{"title":"15. Как меняется 不 (bù)","detail":"Перед 4-м тоном bù произносится bú, например bú shì; в других обычных случаях остаётся bù.","items":[{"py":"bú shì","hz":"不是","ru":"не является","id":"p082"},{"py":"bù hǎo","hz":"不好","ru":"нехорошо","id":"p083"}]},{"title":"16. Как меняется 一 (yī)","detail":"Перед 4-м тоном часто yí, перед 1–3-м — yì. В изолированном чтении — yī.","items":[{"py":"yí gè","hz":"一个","ru":"один (предмет)","id":"p084"},{"py":"yì tiān","hz":"一天","ru":"один день","id":"p085"},{"py":"yī","hz":"一","ru":"один","id":"p057"}]},{"title":"17. Нейтральные слоги","detail":"Вторая часть слова может быть краткой и без значка тона.","items":[{"py":"māma","hz":"妈妈","ru":"мама","id":"p086"},{"py":"xièxie","hz":"谢谢","ru":"спасибо","id":"p087"},{"py":"ma","hz":"吗","ru":"вопросительная частица","id":"p079"}]},{"title":"18. Окончания -n и -ng","detail":"-n — язык у верхних зубов; -ng — задняя носовая финаль, язык дальше к мягкому нёбу.","items":[{"py":"xīn","hz":"新","ru":"новый","id":"p024"},{"py":"xīng","hz":"星","ru":"звезда","id":"p088"},{"py":"ān","hz":"安","ru":"спокойствие","id":"p003"},{"py":"áng","hz":"昂","ru":"высокий","id":"p004"}]},{"title":"19. Апостроф разделяет слоги","detail":"Перед новым слогом на a/o/e ставят апостроф, когда без него возникает двусмысленность: Xī'ān ≠ xiān.","items":[{"py":"Xī'ān","hz":"西安","ru":"город Сиань","id":"p089"},{"py":"xiān","hz":"先","ru":"раньше","id":"p090"}]},{"title":"20. -r и er","detail":"er — отдельный слог; в разговорной речи окончание -r добавляется к слову (儿化).","items":[{"py":"èr","hz":"二","ru":"два","id":"p014"},{"py":"nǎr","hz":"哪儿","ru":"где","id":"p091"}]},{"title":"21. Не все сочетания букв допустимы","detail":"Например, sz — не стандартный слог пиньиня. Правильно zi, si; ch, sh, zh считаются одной начальной согласной.","items":[{"py":"zì","hz":"字","ru":"иероглиф","id":"p058"},{"py":"sì","hz":"四","ru":"четыре","id":"p063"},{"py":"chī","hz":"吃","ru":"есть","id":"p008"}]}],"guidance":{"o":"Финаль o после b, p, m, f звучит с коротким переходом через u: b(u)o, p(u)o, m(u)o, f(u)o. В кнопке звучит целый слог, а не отдельная буква.","a":"Для финали a пример 八 bā: произносится весь слог b+a с первым тоном.","notice":"На карточке записан целый пример (иероглиф и пиньинь). Обозначение сверху показывает изучаемую часть слога."},"audio":{"voice":"zh-CN-XiaoyiNeural","source":"Edge Read Aloud personal-preview only","synthesisRate":"-16%","playbackRate":0.82,"slowRate":0.72,"note":"Only MP3s of complete example syllables; unit labels denote a component, not standalone audio."}};
  const comboSection=document.createElement('section');
  comboSection.id='pinyin-combinations';
  comboSection.className='pinyin-combinations';
  comboSection.innerHTML='<div class="pinyin-reading-switch" role="group" aria-label="Раздел справочника">'+
    '<button type="button" data-reference-mode="letters" aria-pressed="true">A–Z · Звуки</button>'+
    '<button type="button" data-reference-mode="rules" aria-pressed="false">Правила чтения · 21</button></div>'+
    '<p class="pinyin-reading-brief">36 финалей · 21 начальная согласная · 21 правило. В кнопках звучат <strong>целые слоги</strong>, а не отдельные буквы.</p>'+
    '<div class="pinyin-audio-speed" role="group" aria-label="Скорость китайской озвучки">'+
      '<span>Скорость:</span><button type="button" data-pinyin-rate="0.75" aria-pressed="true">Медленно · 0,75×</button>'+
      '<button type="button" data-pinyin-rate="0.85" aria-pressed="false">0,85×</button>'+
      '<button type="button" data-pinyin-rate="1" aria-pressed="false">1×</button></div>'+
    '<div id="pinyin-reading-letters"></div><div id="pinyin-reading-rules" hidden></div>'+
    '<p class="pinyin-combo-feedback" role="status" aria-live="polite"></p>';
  const comboFeedback=comboSection.querySelector('.pinyin-combo-feedback');
  const letterArea=comboSection.querySelector('#pinyin-reading-letters');
  const rulesArea=comboSection.querySelector('#pinyin-reading-rules');
  let currentLetter=0,comboAudio=null,readingView='letters',readingRate=.75;
  function safePinyin(value){return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function toneTile(item,showUnit){
    return '<button type="button" class="pinyin-combo-tile" data-pinyin-audio="'+safePinyin(item.id)+'" aria-label="Послушать '+safePinyin(item.py)+' — '+safePinyin(item.ru)+'">'+
      (showUnit?'<span class="pinyin-combo-unit">'+safePinyin(item.unit)+'</span>':'')+
      '<strong lang="zh-Hans">'+safePinyin(item.hz)+'</strong>'+
      '<span class="pinyin-combo-pinyin">'+safePinyin(item.py)+'</span>'+
      '<small>'+safePinyin(item.ru)+'</small><span class="pinyin-combo-play" aria-hidden="true">▶</span></button>';
  }
  function bindReadingAudio(container){
    container.querySelectorAll('[data-pinyin-audio]').forEach(button=>button.addEventListener('click',async()=>{
      stopComboAudio();
      const id=button.dataset.pinyinAudio;
      if(!/^p\d{3}$/.test(id))return;
      const a=new Audio('./assets/pinyin-reading-v2/'+id+'.mp3');
      a.preload='auto';a.playbackRate=readingRate;a.preservesPitch=true;comboAudio=a;button.classList.add('playing');
      comboFeedback.textContent='Слушай и повторяй. Сохраняй тон!';
      a.onended=()=>{if(comboAudio===a){stopComboAudio();comboFeedback.textContent='Можешь послушать ещё раз.';}};
      a.onerror=()=>{if(comboAudio===a){stopComboAudio();comboFeedback.textContent='Не удалось открыть MP3. Скачай материалы или проверь интернет.';}};
      try{await a.play();}catch{if(comboAudio===a){stopComboAudio();comboFeedback.textContent='Звук не включился. Попробуй снова.';}}
    }));
  }
  function stopComboAudio(){
    if(comboAudio){comboAudio.pause();comboAudio=null;}
    comboSection.querySelectorAll('.pinyin-combo-tile').forEach(b=>b.classList.remove('playing'));
  }
  function setLetter(index){
    stopComboAudio();comboFeedback.textContent='';
    currentLetter=Math.max(0,Math.min(index,reading.groups.length-1));
    const letter=reading.groups[currentLetter];
    letterArea.innerHTML='<div class="pinyin-alphabet" role="group" aria-label="Буквы A–Z">'+
      reading.groups.map((g,i)=>'<button type="button" data-pinyin-letter="'+i+'" aria-pressed="'+(i===currentLetter)+'" class="'+(i===currentLetter?'selected':'')+'">'+safePinyin(g.letter)+'</button>').join('')+'</div>'+
      '<div class="pinyin-letter-progress">Раздел '+(currentLetter+1)+' из '+reading.groups.length+' · '+letter.items.length+' примеров</div>'+
      '<div class="pinyin-combo-group"><h3>'+safePinyin(letter.title)+'</h3><p>'+safePinyin(letter.hint)+'</p>'+
      (letter.letter==='O'?'<p class="pinyin-letter-warning">'+safePinyin(reading.guidance.o)+'</p>':'')+
      (letter.letter==='A'?'<p class="pinyin-letter-warning">'+safePinyin(reading.guidance.a)+'</p>':'')+
      '<div class="pinyin-combo-tiles">'+letter.items.map(item=>toneTile(item,true)).join('')+'</div></div>'+
      '<div class="pinyin-letter-actions"><button type="button" data-letter-prev '+(currentLetter===0?'disabled':'')+'>← Назад</button>'+
      '<button type="button" data-letter-next '+(currentLetter===reading.groups.length-1?'disabled':'')+'>Следующая буква →</button></div>';
    letterArea.querySelectorAll('[data-pinyin-letter]').forEach(b=>b.addEventListener('click',()=>{
      setLetter(Number(b.dataset.pinyinLetter));
    }));
    letterArea.querySelector('[data-letter-prev]').addEventListener('click',()=>setLetter(currentLetter-1));
    letterArea.querySelector('[data-letter-next]').addEventListener('click',()=>setLetter(currentLetter+1));
    bindReadingAudio(letterArea);
    const selected=letterArea.querySelector('[data-pinyin-letter].selected');
    selected?.scrollIntoView?.({block:'nearest',inline:'nearest'});
  }
  function renderRules(){
    const buckets=[['Начальные звуки',0,5],['Слоги и написание',5,12],['Тоны и изменение тонов',12,17],['Носовые и особые случаи',17,21]];
    rulesArea.innerHTML='<p class="pinyin-reading-rule-head">Все основные правила. Открой интересующий пункт, послушай примеры.</p>'+
      buckets.map(([title,first,last])=>'<section class="pinyin-rules-chapter"><h3>'+title+'</h3>'+
      reading.rules.slice(first,last).map(rule=>
      '<details class="pinyin-rule"><summary>'+safePinyin(rule.title)+'</summary>'+
      '<p>'+safePinyin(rule.detail)+'</p><div class="pinyin-combo-tiles">'+rule.items.map(item=>toneTile(item,false)).join('')+'</div></details>').join('')+'</section>').join('')+
      '<p class="pinyin-combo-warning"><strong>Важно:</strong> «sz» не существует как стандартный слог пиньиня. Пиши zi, si; zh, ch, sh — цельные начальные звуки.</p>';
    bindReadingAudio(rulesArea);
  }
  comboSection.querySelectorAll('[data-reference-mode]').forEach(button=>button.addEventListener('click',()=>{
    stopComboAudio();comboFeedback.textContent='';
    readingView=button.dataset.referenceMode;
    letterArea.hidden=readingView!=='letters';rulesArea.hidden=readingView!=='rules';
    comboSection.querySelectorAll('[data-reference-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.referenceMode===readingView)));
  }));
  comboSection.querySelectorAll('[data-pinyin-rate]').forEach(button=>button.addEventListener('click',()=>{
    readingRate=Number(button.dataset.pinyinRate);
    comboSection.querySelectorAll('[data-pinyin-rate]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    if(comboAudio)comboAudio.playbackRate=readingRate;
    comboFeedback.textContent=readingRate<.8?'Медленный режим включён.':'Скорость изменена.';
  }));
  setLetter(0);renderRules();
  window.addEventListener('learning-audio-stop',stopComboAudio);
  window.addEventListener('pagehide',stopComboAudio);

  const view=document.createElement('section');
  view.id='pronunciation-selected-view';
  view.hidden=true;
  view.innerHTML=[
    '<button type="button" class="pronunciation-back" id="pronunciation-back">← К выбору занятия</button>',
    '<h2 id="pronunciation-view-title"></h2>'
  ].join('');
  head.after(hub,view);
  const voiceSlot=hub.querySelector('#pronunciation-voice-slot');
  voiceSlot.appendChild(voices);
  const settings=hub.querySelector('#pronunciation-settings');
  const modeTitles={listen:'Слушать тоны',combinations:'Чтение пиньиня A–Z',quiz:'Угадать на слух',speak:'Моё произношение'};
  const sections={listen:[intro,grid],combinations:[comboSection],quiz:[lab],speak:[practice]};
  let mode=null,voiceAudio=null;

  function hide(el,hidden){el.hidden=hidden;el.classList.toggle('pronunciation-panel-hidden',hidden);}
  function stopDemo(){if(voiceAudio){voiceAudio.pause();voiceAudio=null}}
  window.addEventListener('learning-audio-stop',stopDemo);
  function show(modeName,scroll=true){
    stopDemo();stopComboAudio();
    if(!Object.prototype.hasOwnProperty.call(sections,modeName))modeName=null;
    mode=modeName;
    hide(hub,!!mode);
    hide(view,!mode);
    Object.entries(sections).forEach(([key,elements])=>elements.forEach(el=>hide(el,key!==mode)));
    if(mode){
      view.querySelector('#pronunciation-view-title').textContent=modeTitles[mode];
      const selected=sections[mode][0];
      view.insertAdjacentElement('afterend',selected);
      if(scroll)view.scrollIntoView({behavior:'smooth',block:'start'});
    }else if(scroll)head.scrollIntoView({behavior:'smooth',block:'start'});
    // The actual audio lab remains in the document; we only control visibility.
  }
  // Restore the original DOM order before showing a new section, especially
  // for listen mode's two elements, without duplicating any event handlers.
  const originalShow=show;
  function showStable(modeName,scroll=true){
    if(modeName==='listen'){
      practice.before(lab);
      lab.before(intro);
      intro.after(grid);
    }else if(modeName==='quiz'){
      practice.before(lab);
    }
    originalShow(modeName,scroll);
  }
  hub.querySelectorAll('[data-pronunciation-mode]').forEach(b=>b.addEventListener('click',()=>showStable(b.dataset.pronunciationMode)));
  view.querySelector('#pronunciation-back').onclick=()=>showStable(null);

  const recordings={
    female:'https://upload.wikimedia.org/wikipedia/commons/c/c9/Zh-m%C3%A1.ogg',
    male:'https://upload.wikimedia.org/wikipedia/commons/c/cc/Zh-m%C7%8E.ogg'
  };
  const demoFeedback=hub.querySelector('#pronunciation-demo-feedback');
  hub.querySelectorAll('[data-demo-voice]').forEach(button=>button.addEventListener('click',async()=>{
    stopDemo();
    const which=button.dataset.demoVoice;
    if(which==='system'){
      demoFeedback.textContent='Воспроизводится системный китайский голос телефона.';
      if(typeof speakChinese==='function')speakChinese('你好',.95,true);
      return;
    }
    if(!navigator.onLine){demoFeedback.textContent='Для голосов носителей подключи интернет.';return;}
    const audio=new Audio(recordings[which]);
    voiceAudio=audio;demoFeedback.textContent='Включаю образец…';
    try{await audio.play();demoFeedback.textContent=which==='female'?'Женский голос: má, второй тон.':'Мужской голос: mǎ, третий тон.';}
    catch(e){demoFeedback.textContent='Не удалось загрузить образец. Проверь подключение и попробуй ещё раз.';}
  }));
  settings.addEventListener('toggle',()=>{if(!settings.open)stopDemo()});
  document.querySelectorAll('[data-page="tones"],[data-go="tones"]').forEach(el=>el.addEventListener('click',()=>showStable(null,false)));
  window.showPronunciationMode=(name)=>showStable(name,true);
  const params=new URLSearchParams(window.location.search);
  const deepLinked=params.get('start')==='listening';
  showStable(deepLinked?'quiz':null,false);
  if(deepLinked)requestAnimationFrame(()=>view.scrollIntoView({block:'start'}));
})();