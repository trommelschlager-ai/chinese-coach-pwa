/* One guided learning sequence, using existing local recordings. */
(() => {
  'use strict';

  const storageKey = 'pg-intro-step';
  const content = document.getElementById('content');
  const nextButton = document.getElementById('next');
  const backButton = document.getElementById('back');
  const feedback = document.getElementById('feedback');
  const heading = document.querySelector('h1');
  const words = [
    ['我', 'wǒ', 'я'],
    ['你', 'nǐ', 'ты'],
    ['叫', 'jiào', 'зваться'],
  ];
  const dialogue = [
    ['А', '你叫什么名字？', 'Nǐ jiào shénme míngzi?', 'Как тебя зовут?', './assets/dialogue-voices-v73/l2-03-a.mp3'],
    ['Б', '我叫安娜。你呢？', 'Wǒ jiào Ānnà. Nǐ ne?', 'Меня зовут Анна. А тебя?', './assets/dialogue-voices-v73/l2-04-b.mp3'],
    ['А', '我叫小明。', 'Wǒ jiào Xiǎomíng.', 'Меня зовут Сяомин.', './assets/dialogue-voices-v73/l2-05-a.mp3'],
  ];

  let step = 0;
  let answered = false;
  let audio = null;
  let generation = 0;
  try {
    const saved = Number(localStorage.getItem(storageKey));
    if (Number.isInteger(saved) && saved >= 0 && saved <= 6) step = saved;
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

  const pages = [
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
        '<a href="./index.html?panda=dialogues#panda/dialogues">Открыть диалоги →</a>'),
      next: 'Повторить урок',
    },
  ];

  function render() {
    stopAudio();
    const page = pages[step];
    document.getElementById('step').textContent = step < 6 ? 'Урок 1 · Шаг ' + (step + 1) + ' из 6' : 'Урок 1 · Завершён';
    document.querySelector('progress').value = step;
    heading.textContent = page.title;
    content.innerHTML = page.body();
    feedback.textContent = '';
    backButton.hidden = step === 0;
    nextButton.disabled = step === 4 && !answered;
    nextButton.textContent = page.next;
    try { localStorage.setItem(storageKey, String(step)); } catch {}
    heading.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  nextButton.addEventListener('click', () => {
    step = (step + 1) % pages.length;
    if (step === 0) answered = false;
    render();
  });
  backButton.addEventListener('click', () => { step--; render(); });
  content.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.word) {
      const file = window.courseHumanAudio?.[button.dataset.word];
      if (file) playFiles([file]);
      else feedback.textContent = 'Запись пока недоступна.';
    }
    if (button.hasAttribute('data-listen-all')) {
      playFiles(dialogue.map(line => line[4]), [...content.querySelectorAll('[data-line]')]);
    }
    if (button.hasAttribute('data-listen')) {
      const index = Number(button.dataset.listen);
      playFiles([dialogue[index][4]], [content.querySelector('[data-line="' + index + '"]')]);
    }
    if (button.hasAttribute('data-stop')) {
      stopAudio();
      feedback.textContent = 'Прослушивание остановлено.';
    }
    if (button.dataset.answer) {
      answered = button.dataset.answer === 'yes';
      content.querySelectorAll('[data-answer]').forEach(answer => answer.setAttribute('aria-pressed', String(answer === button)));
      nextButton.disabled = !answered;
      feedback.textContent = answered ? 'Верно. После 我叫 ставим своё имя.' : '你呢？ значит «А ты?». Сначала назови своё имя с 我叫…';
    }
  });
  window.addEventListener('pagehide', stopAudio);
  render();
})();
