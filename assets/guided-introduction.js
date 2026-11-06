/* One guided learning sequence, using existing local recordings. */
(() => {
  'use strict';

  const requestedLesson = Number(new URLSearchParams(location.search).get('lesson'));
  const lessonNumber = [1, 2, 3, 4].includes(requestedLesson) ? requestedLesson : 1;
  const lessonTitles = { 1: 'Знакомство', 2: 'Откуда ты?', 3: 'В кафе', 4: 'Где ты живёшь?' };
  const storageKeys = { 1: 'pg-intro-step', 2: 'pg-identity-step', 3: 'pg-cafe-step', 4: 'pg-location-step' };
  const storageKey = storageKeys[lessonNumber];
  document.title = lessonTitles[lessonNumber] + ' · Panda Go';
  document.querySelector('header span').textContent = lessonTitles[lessonNumber];
  const content = document.getElementById('content');
  const nextButton = document.getElementById('next');
  const backButton = document.getElementById('back');
  const feedback = document.getElementById('feedback');
  const heading = document.querySelector('h1');
  const introductionWords = [
    ['我', 'wǒ', 'я'],
    ['你', 'nǐ', 'ты'],
    ['叫', 'jiào', 'зваться'],
  ];
  const introductionDialogue = [
    ['А', '你叫什么名字？', 'Nǐ jiào shénme míngzi?', 'Как тебя зовут?', './assets/dialogue-voices-v73/l2-03-a.mp3'],
    ['Б', '我叫安娜。你呢？', 'Wǒ jiào Ānnà. Nǐ ne?', 'Меня зовут Анна. А тебя?', './assets/dialogue-voices-v73/l2-04-b.mp3'],
    ['А', '我叫小明。', 'Wǒ jiào Xiǎomíng.', 'Меня зовут Сяомин.', './assets/dialogue-voices-v73/l2-05-a.mp3'],
  ];

  const identityWords = [
    ['是', 'shì', 'быть / являться'],
    ['人', 'rén', 'человек'],
    ['中国', 'Zhōngguó', 'Китай'],
    ['俄罗斯', 'Éluósī', 'Россия'],
  ];
  const identityDialogue = [
    ['А', '你好！你是哪国人？', 'Nǐ hǎo! Nǐ shì nǎ guó rén?', 'Привет! Из какой ты страны?', './assets/dialogue-voices-v73/l3-01-a.mp3'],
    ['Б', '我是俄罗斯人。你呢？', 'Wǒ shì Éluósī rén. Nǐ ne?', 'Я из России. А ты?', './assets/dialogue-voices-v73/l3-02-b.mp3'],
    ['А', '我是中国人。', 'Wǒ shì Zhōngguó rén.', 'Я китаец / китаянка.', './assets/dialogue-voices-v73/l3-03-a.mp3'],
  ];
  const cafeWords = [
    ['想', 'xiǎng', 'хотеть / хотеть что-то сделать'],
    ['喝', 'hē', 'пить'],
    ['茶', 'chá', 'чай'],
    ['一', 'yī', 'один'],
    ['杯', 'bēi', 'чашка / стакан; счётное слово'],
  ];
  const cafeDialogue = [
    ['А', '你好！你想喝什么？', 'Nǐ hǎo! Nǐ xiǎng hē shénme?', 'Здравствуйте! Что хотите выпить?', './assets/dialogue-voices-v73/l5-01-a.mp3'],
    ['Б', '我想喝一杯茶。', 'Wǒ xiǎng hē yì bēi chá.', 'Я хотел(а) бы выпить чашку чая.', './assets/dialogue-voices-v73/l5-02-b.mp3'],
    ['А', '好的。', 'Hǎo de.', 'Хорошо.', './assets/dialogue-voices-v73/l5-03-a.mp3'],
  ];
  const locationWords = [
    ['住', 'zhù', 'жить / проживать'],
    ['在', 'zài', 'в / на — перед местом'],
    ['哪里', 'nǎlǐ', 'где'],
    ['北京', 'Běijīng', 'Пекин'],
  ];
  const locationDialogue = [
    ['А', '你住在哪里？', 'Nǐ zhù zài nǎlǐ?', 'Где ты живёшь?', './assets/dialogue-voices-v73/l3-04-b.mp3'],
    ['Б', '我住在北京。', 'Wǒ zhù zài Běijīng.', 'Я живу в Пекине.', './assets/dialogue-voices-v73/l3-05-a.mp3'],
  ];
  const wordsByLesson = { 1: introductionWords, 2: identityWords, 3: cafeWords, 4: locationWords };
  const dialoguesByLesson = { 1: introductionDialogue, 2: identityDialogue, 3: cafeDialogue, 4: locationDialogue };
  const words = wordsByLesson[lessonNumber];
  const dialogue = dialoguesByLesson[lessonNumber];

  // Preserve the original six-step keys while tracking the approved seven-step journey separately.
  const v2Key = 'pg-hsk1-v2-lesson-' + lessonNumber;
  const visitedKey = 'pg-hsk1-v2-visited-' + lessonNumber;
  let step = 0, visitedMax = 0, assembled = [], buildSolved = false;
  let answered = false, audio = null, generation = 0;
  try {
    const savedV2 = localStorage.getItem(v2Key);
    if (savedV2 !== null && /^\\d+$/.test(savedV2) && Number(savedV2) <= 7) {
      step = Number(savedV2);
    } else {
      const old = Number(localStorage.getItem(storageKey) || '0');
      // Legacy 6 meant lesson completed. 1=words, 2=examples, 3=dialogue, 4=quiz, 5=speak.
      step = old >= 6 ? 7 : [0,0,2,3,4,5][Math.max(0,Math.min(5,old))];
    }
    visitedMax = Math.max(step,Math.min(7,Number(localStorage.getItem(visitedKey))||0));
  } catch {}
  const card = text => '<div class="card">' + text + '</div>';
  const phrase = (hz, py, ru) =>
    '<span lang="zh-Hans">' + hz + '</span><span class="py">' + py + '</span><p>' + ru + '</p>';

  function stopAudio() {
    generation++;
    if (audio) {
      audio.onended = audio.onerror = audio.onplaying = null;
      audio.pause();
      audio = null;
    }
    content.querySelectorAll('[data-active]').forEach(row => row.removeAttribute('data-active'));
  }

  async function playFiles(files, rows = []) {
    stopAudio();
    const token = generation;
    async function playAt(index) {
      if (token !== generation) return;
      content.querySelectorAll('[data-active]').forEach(row => row.removeAttribute('data-active'));
      if (index >= files.length) {
        feedback.textContent = 'Прослушивание завершено.';
        return;
      }
      if (!files[index]) {
        feedback.textContent = 'Запись этой реплики пока недоступна.';
        return;
      }
      const clip = new Audio(files[index]);
      audio = clip;
      const valid = () => token === generation && audio === clip;
      clip.onplaying = () => {
        if (!valid()) return;
        rows[index]?.setAttribute('data-active', 'true');
        feedback.textContent = rows.length ? 'Звучит реплика ' + (index + 1) + ' из ' + files.length + '.' : '';
      };
      clip.onended = () => { if (valid()) playAt(index + 1); };
      clip.onerror = () => {
        if (valid()) {
          stopAudio();
          feedback.textContent = 'Запись недоступна. Проверь подключение и нажми ещё раз.';
        }
      };
      try {
        await clip.play();
      } catch {
        if (valid()) {
          stopAudio();
          feedback.textContent = 'Звук не включился. Нажми ещё раз.';
        }
      }
    }
    await playAt(0);
  }

  const introductionPages = [
    {
      title: 'Представься по-китайски',
      body: () => card('<h2>Что ты сможешь сказать</h2><p>«Меня зовут…» и «Как тебя зовут?»</p><p>Сначала выучим три слова, затем соберём фразу и попробуем короткий разговор.</p><small>Около 5 минут · 6 коротких шагов</small>'),
      next: 'Начать урок',
    },
    {
      title: 'Три слова для знакомства',
      body: () => words.map(([hz, py, ru]) =>
        '<div class="card word"><div>' + phrase(hz, py, ru) + '</div><button data-word="' + hz + '" aria-label="Послушать ' + hz + '">🔊</button></div>'
      ).join('') + '<p>Нажми на звук, послушай и повтори каждое слово.</p>',
      next: 'Перейти к фразе',
    },
    {
      title: 'Назови своё имя',
      body: () => card(phrase('我叫安娜。', 'Wǒ jiào Ānnà.', 'Меня зовут Анна.') +
        '<p><strong>我 + 叫 + имя</strong></p><p>我 означает «я», 叫 здесь — «зваться». После 我叫 поставь своё имя. Например, Антон — 安东 (Āndōng).</p>') +
        card('<h2>Спроси имя</h2>' + phrase('你叫什么名字？', 'Nǐ jiào shénme míngzi?', 'Как тебя зовут?') +
        '<p>你 — ты, 叫 — зваться, 什么 — какой/что, 名字 — имя. Вопрос 什么名字 значит «какое имя».</p>' +
        '<p>Частица 吗 здесь не нужна, потому что вопрос уже содержит 什么.</p>') +
        card(phrase('你呢？', 'Nǐ ne?', 'А тебя? / А ты?') + '<p>После своего ответа так можно задать собеседнику тот же вопрос.</p>'),
      next: 'Послушать разговор',
    },
    {
      title: 'Прочитай и послушай',
      body: () => '<div class="controls"><button data-listen-all>🔊 Весь разговор</button><button data-stop>Остановить</button></div>' +
        dialogue.map(([speaker, hz, py, ru], index) =>
          '<div class="line" data-line="' + index + '"><small>Собеседник ' + speaker + '</small>' +
          phrase(hz, py, ru) + '<button data-listen="' + index + '" aria-label="Послушать реплику ' + (index + 1) + '">🔊 Реплика</button></div>'
        ).join(''),
      next: 'Проверить себя',
    },
    {
      title: 'Ответь на вопрос об имени',
      body: () => card(phrase('你叫什么名字？', 'Nǐ jiào shénme míngzi?', 'Как тебя зовут?') +
        '<div class="answers"><button data-answer="no" aria-pressed="false"><span lang="zh-Hans">你呢？</span></button>' +
        '<button data-answer="yes" aria-pressed="false"><span lang="zh-Hans">我叫安娜。</span></button></div>'),
      next: 'Ответить самостоятельно',
    },
    {
      title: 'Теперь твоя очередь',
      body: () => card('<p>Представься вслух по-китайски со своим именем. Затем спроси собеседника, как его зовут.</p>' +
        '<details><summary>Сверить с образцом</summary>' + phrase('我叫…', 'Wǒ jiào…', 'Меня зовут…') +
        phrase('你叫什么名字？', 'Nǐ jiào shénme míngzi?', 'Как тебя зовут?') + '</details>') +
        '<small>Сверь фразы с образцом самостоятельно.</small>',
      next: 'Завершить урок',
    },
    {
      title: 'Первый урок завершён',
      body: () => card('<h2>Ты потренировался</h2><p>Представляться с 我叫… и спрашивать имя с 你叫什么名字？</p>' +
        '<p>Вернись к разговору и попробуй ответить за собеседника Б, используя своё имя.</p>' +
        '<a href="./start-chinese.html?lesson=2">Урок 2 · Откуда ты? →</a>'),
      next: 'Повторить урок',
    },
  ];

  const identityPages = [
    {
      title: 'Расскажи, откуда ты',
      body: () => card('<h2>Что ты сможешь сказать</h2><p>«Я из России» и «Из какой ты страны?»</p><p>Мы уже знаем 我 — я, 你 — ты и 你呢？ — «А ты?». Сейчас добавим четыре слова и правило 是.</p><small>Около 5 минут · 6 коротких шагов</small>'),
      next: 'Начать урок',
    },
    {
      title: 'Четыре новых слова',
      body: () => words.map(([hz, py, ru]) =>
        '<div class="card word"><div>' + phrase(hz, py, ru) + '</div><button data-word="' + hz + '" aria-label="Послушать ' + hz + '">🔊</button></div>'
      ).join('') + '<p>Послушай и повтори слова. 人 после названия страны обозначает человека из этой страны.</p>',
      next: 'Перейти к правилу',
    },
    {
      title: 'Я из России',
      body: () => card(phrase('我是俄罗斯人。', 'Wǒ shì Éluósī rén.', 'Я из России.') +
        '<p><strong>我 + 是 + 俄罗斯人</strong></p><p>是 связывает человека с тем, кем он является. В русском «я россиянин» слово «есть» обычно опускают. В этой китайской конструкции 是 нужно.</p>' +
        '<p>俄罗斯 + 人 → 俄罗斯人 — россиянин / россиянка. 中国 + 人 → 中国人 — китаец / китаянка.</p>') +
        card(phrase('你是哪国人？', 'Nǐ shì nǎ guó rén?', 'Из какой ты страны?') +
        '<p>哪 — какой / который, 国 — страна. 哪国 — «какая страна». Частицу 吗 не добавляем: вопрос уже содержит 哪.</p>' +
        '<p>你好！(Nǐ hǎo!) в начале разговора — «Привет!». При произнесении первый третий тон становится вторым.</p>'),
      next: 'Послушать разговор',
    },
    {
      title: 'Знакомство продолжается',
      body: introductionPages[3].body,
      next: 'Проверить себя',
    },
    {
      title: 'Скажи «Я из России»',
      body: () => card('<div class="answers"><button data-answer="no" aria-pressed="false"><span lang="zh-Hans">我是中国人。</span></button>' +
        '<button data-answer="yes" aria-pressed="false"><span lang="zh-Hans">我是俄罗斯人。</span></button></div>'),
      next: 'Ответить самостоятельно',
    },
    {
      title: 'Теперь твоя очередь',
      body: () => card('<p>Скажи по-китайски «Я из России». Затем спроси собеседника, из какой он страны.</p>' +
        '<details><summary>Сверить с образцом</summary>' + phrase('我是俄罗斯人。', 'Wǒ shì Éluósī rén.', 'Я из России.') +
        phrase('你是哪国人？', 'Nǐ shì nǎ guó rén?', 'Из какой ты страны?') + '</details>') +
        '<small>Если ты из другой страны, в своём ответе используй её название + 人.</small>',
      next: 'Завершить урок',
    },
    {
      title: 'Второй урок завершён',
      body: () => card('<h2>Соедини два урока</h2><p>Сначала представься с 我叫…, затем скажи, откуда ты, с 我是…人.</p>' +
        '<p>Попробуй ответить на оба вопроса без подсказки.</p><a href="./start-chinese.html?lesson=3">Урок 3 · В кафе →</a>'),
      next: 'Повторить урок',
    },
  ];
  const cafePages = [
    {
      title: 'Закажи чай по-китайски',
      body: () => card('<h2>Что ты сможешь сказать</h2><p>«Я хочу выпить чаю» и «Я хотел(а) бы чашку чая».</p><p>Мы уже знаем 我 — я, 你 — ты и 什么 — что. Теперь добавим 想 — хотеть, 喝 — пить и название напитка.</p><small>Около 5 минут · 6 коротких шагов</small>'),
      next: 'Начать урок',
    },
    {
      title: 'Пять слов для заказа',
      body: () => words.map(([hz, py, ru]) =>
        '<div class="card word"><div>' + phrase(hz, py, ru) + '</div><button data-word="' + hz + '" aria-label="Послушать ' + hz + '">🔊</button></div>'
      ).join('') + '<p>一 отдельно произносится yī. В сочетании 一杯 — yì bēi. Это изменение тона разберём дальше.</p>',
      next: 'Перейти к правилу',
    },
    {
      title: 'Хочу выпить чашку чая',
      body: () => card(phrase('我想喝茶。', 'Wǒ xiǎng hē chá.', 'Я хочу выпить чаю.') +
        '<p><strong>我 + 想 + 喝 + 茶</strong></p><p>我 — я, 想 — хочу, 喝 — пить, 茶 — чай. После 想 ставим действие. Перед 喝 слово 是 не добавляем.</p>') +
        card(phrase('我想喝一杯茶。', 'Wǒ xiǎng hē yì bēi chá.', 'Я хотел(а) бы выпить чашку чая.') +
        '<p><strong>一 + 杯 + 茶</strong> — одна чашка чая. 杯 здесь указывает, чем измеряем напиток. Счётное слово стоит между числом и названием напитка.</p><p>Перед первым тоном bēi единица 一 произносится четвёртым тоном — yì. Запомни сочетание yì bēi.</p>') +
        card(phrase('你想喝什么？', 'Nǐ xiǎng hē shénme?', 'Что ты хочешь выпить?') +
        '<p>什么 — «что» — стоит на месте напитка. Для ответа меняем 什么 на 茶 и 你 на 我.</p><p>好的 (hǎo de) — «хорошо». Это короткое подтверждение твоего заказа.</p>'),
      next: 'Послушать разговор',
    },
    {
      title: 'Короткий заказ в кафе',
      body: introductionPages[3].body,
      next: 'Проверить себя',
    },
    {
      title: 'Закажи чашку чая',
      body: () => card('<p>Выбери «Я хочу выпить чашку чая».</p><div class="answers">' +
        '<button data-answer="yes" aria-pressed="false"><span lang="zh-Hans">我想喝一杯茶。</span></button>' +
        '<button data-answer="no" aria-pressed="false"><span lang="zh-Hans">我是一杯茶。</span></button></div>'),
      next: 'Ответить самостоятельно',
    },
    {
      title: 'Теперь твой заказ',
      body: () => card('<p>Ответь вслух на вопрос 你想喝什么？ Закажи одну чашку чая.</p>' +
        '<details><summary>Сверить с образцом</summary>' + phrase('我想喝一杯茶。', 'Wǒ xiǎng hē yì bēi chá.', 'Я хотел(а) бы выпить чашку чая.') +
        '<p>Проверь порядок 想 → 喝 → 一杯茶. Произнеси 一杯 как yì bēi.</p></details>'),
      next: 'Завершить урок',
    },
    {
      title: 'Третий урок завершён',
      body: () => card('<h2>Ты умеешь заказать чай</h2><p>想 + действие — хочу что-то сделать. 一杯茶 — одна чашка чая.</p><p>Повтори весь разговор, ответив за гостя кафе своим голосом.</p><a href="./start-chinese.html?lesson=4">Урок 4 · Где ты живёшь? →</a>'),
      next: 'Повторить урок',
    },
  ];
  const locationPages = [
    {
      title: 'Скажи, где ты живёшь',
      body: () => card('<h2>Что ты сможешь сказать</h2><p>«Я живу в Пекине» и «Где ты живёшь?»</p><p>Вспомним 我 — я и 你 — ты. Затем добавим действие 住 и место после 在.</p><small>Около 5 минут · 6 коротких шагов</small>'),
      next: 'Начать урок',
    },
    {
      title: 'Действие и место',
      body: () => words.map(([hz, py, ru]) =>
        '<div class="card word"><div>' + phrase(hz, py, ru) + '</div><button data-word="' + hz + '" aria-label="' +
        ('Послушать ' + hz) + '">🔊</button></div>'
      ).join(''),
      next: 'Перейти к правилу',
    },
    {
      title: 'Кто + живёт + где',
      body: () => card(phrase('我住在北京。', 'Wǒ zhù zài Běijīng.', 'Я живу в Пекине.') +
        '<p><strong>我 + 住 + 在 + 北京</strong></p><p>我 — кто говорит, 住 — живёт, 在 — вводит место, 北京 — название города. В этом шаблоне 在 стоит после 住.</p>') +
        card(phrase('你住在哪里？', 'Nǐ zhù zài nǎlǐ?', 'Где ты живёшь?') +
        '<p>哪里 заменяет название места. Для ответа меняем 你 на 我, а 哪里 — на 北京.</p><p>Вопрос уже содержит 哪里, поэтому 吗 добавлять не нужно.</p>') +
        card('<h2>Страна и место проживания</h2>' + phrase('我是俄罗斯人。', 'Wǒ shì Éluósī rén.', 'Я из России.') +
        phrase('我住在北京。', 'Wǒ zhù zài Běijīng.', 'Я живу в Пекине.') +
        '<p>Можно быть из одной страны и жить в другой. 住在 описывает место проживания.</p>'),
      next: 'Послушать разговор',
    },
    {
      title: 'Где ты живёшь?',
      body: introductionPages[3].body,
      next: 'Проверить себя',
    },
    {
      title: 'Ответь «Я живу в Пекине»',
      body: () => card('<div class="answers"><button data-answer="no" aria-pressed="false"><span lang="zh-Hans">我是北京。</span></button>' +
        '<button data-answer="yes" aria-pressed="false"><span lang="zh-Hans">我住在北京。</span></button></div>'),
      next: 'Ответить самостоятельно',
    },
    {
      title: 'Теперь твоя очередь',
      body: () => card('<p>Спроси, где живёт собеседник. Затем ответь за человека, который живёт в Пекине.</p>' +
        '<details><summary>Сверить с образцом</summary>' + phrase('你住在哪里？', 'Nǐ zhù zài nǎlǐ?', 'Где ты живёшь?') +
        phrase('我住在北京。', 'Wǒ zhù zài Běijīng.', 'Я живу в Пекине.') + '</details>'),
      next: 'Завершить урок',
    },
    {
      title: 'Четвёртый урок завершён',
      body: () => card('<h2>Собери рассказ о себе</h2><p>Меня зовут… — 我叫…</p><p>Я из России — 我是俄罗斯人。</p><p>Я живу в Пекине — 我住在北京。</p>' +
        '<p>Повтори эти фразы, затем вернись к нужной теме через меню «Уроки».</p>'),
      next: 'Повторить урок',
    },
  ];
  const pagesByLesson = { 1: introductionPages, 2: identityPages, 3: cafePages, 4: locationPages };
  const oldPages = pagesByLesson[lessonNumber];
  const toneNotes = {
    1: [['你','nǐ','Третий тон'],['叫','jiào','Четвёртый тон'],['我','wǒ','Третий тон']],
    2: [['是','shì','Четвёртый тон'],['人','rén','Второй тон'],['中国','Zhōngguó','Первый + второй тон']],
    3: [['想','xiǎng','Третий тон'],['喝','hē','Первый тон'],['茶','chá','Второй тон'],['杯','bēi','Первый тон']],
    4: [['住','zhù','Четвёртый тон'],['在','zài','Четвёртый тон'],['北京','Běijīng','Третий + первый тон']]
  };
  const assembleWords = {
    1:['我','叫','安娜'],2:['我','是','俄罗斯人'],
    3:['我','想','喝','茶'],4:['我','住','在','北京']
  };
  const assemblePinyin = {
    1:'Wǒ jiào Ānnà.',2:'Wǒ shì Éluósī rén.',
    3:'Wǒ xiǎng hē chá.',4:'Wǒ zhù zài Běijīng.'
  };
  const buildGoal = assembleWords[lessonNumber];
  const steps = [
    ['Новые слова','📖'],['Тоны и произношение','◉'],['Примеры','▣'],
    ['Диалог','💬'],['Собери предложение','🧩'],['Говори сам','🎙'],
    ['Итог и повторение','↻']
  ];
  const toneBody = () => '<p class="lesson-instruction">Нажми на каждое слово, внимательно повтори тон.</p>' +
    '<div class="lesson-tone-grid">' + toneNotes[lessonNumber].map(([hz,py,note]) =>
      '<div class="card lesson-tone-card"><button data-word="'+hz+'" aria-label="Послушать '+hz+'"><strong lang="zh-Hans">'+hz+'</strong><span>'+py+'</span><small>'+note+'</small><b aria-hidden="true">🔊</b></button></div>'
    ).join('') + '</div>' +
    (lessonNumber===1?'<p class="lesson-note">В сочетании 你好 (nǐ hǎo) два третьих тона произносятся как второй и третий: ní hǎo.</p>':
     lessonNumber===3?'<p class="lesson-note">Перед первым тоном 一 в 一杯 (yì bēi) произносится четвёртым тоном.</p>':'');
  const dialogueBody = () => '<div class="lesson-dialogue-visual">' +
    '<img src="./assets/panda-v130/dialogue-scene.webp" alt="Два собеседника в китайском городе" loading="eager">' +
    '<button class="lesson-dialogue-play" data-listen-all aria-label="Прослушать весь диалог">▶</button></div>' +
    '<div class="lesson-dialogue-actions"><button data-stop>■ Остановить</button><span>Нажми на реплику, чтобы услышать её</span></div>' +
    '<div class="lesson-chat">' + dialogue.map(([speaker,hz,py,ru],index)=>
      '<div class="line lesson-chat-line '+(speaker==='Б'?'lesson-speaker-b':'lesson-speaker-a')+'" data-line="'+index+'">' +
      '<img src="./assets/approved-'+(speaker==='Б'?'woman':'man')+'-v112.webp" alt="" aria-hidden="true">' +
      '<div class="lesson-bubble">'+phrase(hz,py,ru)+'</div>' +
      '<button data-listen="'+index+'" aria-label="Прослушать реплику '+(index+1)+'">🔊</button></div>'
    ).join('') + '</div>';
  const buildBody = () => '<div class="card lesson-build-card"><h2>Собери китайскую фразу</h2>' +
    '<p>Расставь слова в правильном порядке. При ошибке попробуй снова.</p>' +
    '<div id="build-task" aria-live="polite"></div></div>';
  const pages = [
    {title:steps[0][0],body:oldPages[1].body,next:'Дальше →'},
    {title:steps[1][0],body:toneBody,next:'Дальше →'},
    {title:steps[2][0],body:oldPages[2].body,next:'Дальше →'},
    {title:steps[3][0],body:dialogueBody,next:'Дальше →'},
    {title:steps[4][0],body:buildBody,next:'Дальше →'},
    {title:steps[5][0],body:oldPages[5].body,next:'Дальше →'},
    {title:steps[6][0],body:()=>card('<h2>Повтори главное</h2><p>Прочитай разговор ещё раз, прослушай реплики и проверь своё произношение.</p>')+dialogueBody(),next:'Завершить урок'},
    {title:'Урок завершён',body:oldPages[6].body,next:'Повторить урок'}
  ];
  function renderBuildTask(){
    const task=document.getElementById('build-task');
    if(!task)return;
    const available=buildGoal.map((word,i)=>({word,i})).filter(x=>!assembled.includes(x.i)).reverse();
    task.innerHTML='<p class="lesson-built" aria-label="Твой ответ">'+
      (assembled.length?assembled.map((i,pos)=>'<button data-remove-index="'+pos+'" aria-label="Убрать '+buildGoal[i]+'">'+buildGoal[i]+' ×</button>').join(''):'Нажми на слова внизу')+
      '</p><div class="lesson-build-pool">'+available.map(({word,i})=>'<button data-piece="'+i+'">'+word+'</button>').join('')+'</div>'+
      '<div class="lesson-build-buttons"><button data-check-build'+(assembled.length!==buildGoal.length||buildSolved?' disabled':'')+'>Проверить</button><button data-reset-build>Сбросить</button></div>'+
      (buildSolved?'<p class="lesson-correct">✓ Верно! '+assemblePinyin[lessonNumber]+'</p>':'');
    nextButton.disabled=!buildSolved;
  }
  function renderStepList(){
    const box=document.getElementById('lesson-step-list');
    if(!box)return;
    box.innerHTML=steps.map(([label,art],i)=>{
      const active=step===i,done=step>i||step===7;
      return '<button class="lesson-step-row'+(active?' active':'')+(done?' done':'')+'" data-go-step="'+i+'"'+(i>visitedMax?' disabled':'')+
        ' aria-current="'+(active?'step':'false')+'"><span class="lesson-step-number">'+(i+1)+'</span>'+
        '<span class="lesson-step-art" aria-hidden="true">'+art+'</span><span class="lesson-step-name">'+label+'</span>'+
        '<span class="lesson-step-state" aria-hidden="true">'+(done?'✓':active?'›':i>visitedMax?'🔒':'•')+'</span></button>';
    }).join('');
  }
  const answerFeedback = {
    1: ['你呢？ значит «А ты?». Сначала назови своё имя с 我叫…', 'Верно. После 我叫 ставим своё имя.'],
    2: ['中国人 означает «китаец / китаянка». Для России используй 俄罗斯人.', 'Верно. 俄罗斯人 — человек из России.'],
    4: ['我是北京 означает «Я — Пекин». Чтобы сказать, где ты живёшь, используй 住在 перед названием города.', 'Верно. 我 + 住 + 在 + 北京 — я живу в Пекине.'],
    3: ['我是一杯茶 означает «Я — чашка чая». Для желания нужно 想, а для действия — 喝.', 'Верно. 我 + 想 + 喝 + 一杯茶 — я хочу выпить чашку чая.'],
  };


  const lessonMenu = document.createElement('details');
  lessonMenu.className = 'lesson-menu';
  document.querySelector('header').after(lessonMenu);

  function renderLessonMenu() {
    const entries=Object.entries(lessonTitles).map(([number,title])=>{
      let current=0,previous=0;
      try{
        const raw=localStorage.getItem('pg-hsk1-v2-lesson-'+number);
        previous=Number(localStorage.getItem(storageKeys[number])||0);
        current=raw!==null?Number(raw):(previous>=6?7:[0,0,2,3,4,5][Math.min(5,Math.max(0,previous))]);
      }catch{}
      const status=current>=7?'Завершён':current>0?'Шаг '+(current+1)+' из 7':'Начать';
      return '<a href="./start-chinese.html?lesson='+number+'"'+(Number(number)===lessonNumber?' aria-current="page"':'')+'><strong>'+number+'. '+title+'</strong><small>'+status+'</small></a>';
    });
    lessonMenu.innerHTML='<summary>Уроки</summary><nav aria-label="Все уроки">'+entries.join('')+'</nav>';
  }

  function render() {
    stopAudio();
    const page=pages[step];
    const stepLabel=document.getElementById('step');
    stepLabel.textContent=step<7?'Шаг '+(step+1)+' из 7':'Урок '+lessonNumber+' завершён';
    document.querySelector('progress').value=step;
    heading.textContent=page.title;
    document.querySelector('header span').textContent='Урок '+lessonNumber+' · '+lessonTitles[lessonNumber];
    content.innerHTML=page.body();
    feedback.textContent='';
    backButton.hidden=step===0;
    nextButton.textContent=page.next;
    nextButton.disabled=step===4&&!buildSolved;
    renderStepList();
    if(step===4)renderBuildTask();
    try{
      visitedMax=Math.max(visitedMax,step);
      localStorage.setItem(v2Key,String(step));
      localStorage.setItem(visitedKey,String(visitedMax));
      // Keep the old completion key exactly as before; don't downgrade older 6-step learners.
      if(step===7){
        localStorage.setItem(storageKey,'6');
        const key='pg-hsk1-completed-v1';
        let finished=[];try{finished=JSON.parse(localStorage.getItem(key)||'[]');}catch{}
        if(!Array.isArray(finished))finished=[];
        if(!finished.includes(lessonNumber))finished.push(lessonNumber);
        localStorage.setItem(key,JSON.stringify(finished));
      }
    }catch{}
    renderLessonMenu();
    heading.focus({preventScroll:true});
    window.scrollTo(0,0);
  }
  nextButton.addEventListener('click',()=>{
    if(step===4&&!buildSolved)return;
    step=(step+1)%pages.length;
    if(step===0){assembled=[];buildSolved=false;}
    if(step===4){assembled=[];buildSolved=false;}
    render();
  });
  backButton.addEventListener('click',()=>{if(step>0){step--;render();}});
  document.getElementById('lesson-step-list')?.addEventListener('click',event=>{
    const button=event.target.closest('button[data-go-step]');
    if(!button||button.disabled)return;
    step=Number(button.dataset.goStep);
    if(step===4){assembled=[];buildSolved=false;}
    render();
  });
  content.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button||button.disabled)return;
    if(button.dataset.word){
      const file=window.courseGuidedAudio?.[button.dataset.word];
      if(file)playFiles([file]);
      else feedback.textContent='Запись пока недоступна.';
    }
    if(button.hasAttribute('data-listen-all'))playFiles(dialogue.map(line=>window.courseGuidedAudio?.[line[1]]),[...content.querySelectorAll('[data-line]')]);
    if(button.hasAttribute('data-listen')){
      const index=Number(button.dataset.listen);
      playFiles([window.courseGuidedAudio?.[dialogue[index][1]]],[content.querySelector('[data-line="'+index+'"]')]);
    }
    if(button.hasAttribute('data-stop')){stopAudio();feedback.textContent='Прослушивание остановлено.';}
    if(button.hasAttribute('data-piece')){
      const index=Number(button.dataset.piece);
      if(!assembled.includes(index)){assembled.push(index);renderBuildTask();}
    }
    if(button.hasAttribute('data-remove-index')){assembled.splice(Number(button.dataset.removeIndex),1);buildSolved=false;renderBuildTask();}
    if(button.hasAttribute('data-reset-build')){assembled=[];buildSolved=false;feedback.textContent='';renderBuildTask();}
    if(button.hasAttribute('data-check-build')){
      buildSolved=assembled.length===buildGoal.length&&assembled.every((i,position)=>i===position);
      feedback.textContent=buildSolved?'Отлично! Предложение составлено правильно.':'Неправильный порядок слов. Попробуй ещё раз.';
      renderBuildTask();
    }
  });
  window.addEventListener('pagehide', stopAudio);
  render();
})();
