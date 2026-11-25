/* Present the same five sections as the tabs, independently of saved screen IDs. */
window.PandaHsk2Speech = (() => {
  const escape = value => String(value).replace(/[&<>"']/g, ch =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);
  const paths = ['', 'M3 8 H19', 'M3 15 L19 3', 'M3 4 Q11 24 19 4', 'M3 3 L19 15'];

  function position(sections, step) {
    const index = sections.findIndex(section => section.steps.includes(step));
    return {number: index + 1, total: sections.length, label: sections[index]?.name ?? 'Начало'};
  }

  function row({zh, py, ru, tones}, controls) {
    const marks = tones.map(tone => {
      const graphic = tone === 0 ? '<circle cx="11" cy="9" r="2.8" fill="currentColor"/>' :
        '<path d="' + paths[tone] + '" fill="none" stroke="currentColor" stroke-width="3.3" stroke-linecap="round"/>';
      return '<span class="pg-standard-tone"><svg viewBox="0 0 22 20" aria-hidden="true">' +
        graphic + '</svg><b>' + tone + '</b></span>';
    }).join('');
    return '<article class="pg-standard-speech-row"><div class="pg-standard-copy">' +
      '<strong class="pg-standard-cn" lang="zh-Hans">' + escape(zh) + '</strong>' +
      '<span class="pg-standard-py">' + escape(py) + '</span>' +
      '<span class="pg-standard-ru">' + escape(ru) + '</span></div>' +
      '<div class="pg-standard-tones" role="img" aria-label="Тоны: ' + tones.join(', ') + '">' +
      marks + '</div>' + controls + '</article>';
  }

  function render({hero, words, phrases, phraseTones, tab, audio, mic, status, fallback}) {
    const wordsActive = tab !== 'phrases';
    const entries = wordsActive ? words :
      phrases.map(([zh, py, ru], i) => ({zh, py, ru, tones: [...phraseTones[i]].map(Number)}));
    function button(id, label, count, active) {
      return '<button type="button" data-tone-tab="' + id + '" aria-pressed="' + active +
        '" class="' + (active ? 'primary' : 'soft') + '">' + label + ' (' + count + ')</button>';
    }
    return hero + '<div class="tone-tabs panel" aria-label="Материалы тренировки">' +
      button('words', '📖 Слова урока', words.length, wordsActive) +
      button('phrases', '💬 Фразы', phrases.length, !wordsActive) +
      '</div><div class="pg-standard-list" tabindex="0" aria-label="' +
      (wordsActive ? 'Слова урока' : 'Фразы') + '">' +
      entries.map((item, i) => row(item, audio(item.zh) + mic(item.zh, wordsActive ? i : 'phrase:' + i))).join('') +
      '</div><div class="pg-speech-status">' + status +
      '<button type="button" class="soft pg-speech-fallback" data-practice-mode="' +
      (fallback ? 'mic">Вернуться к микрофону' : 'self">Самопроверка') + '</button></div>';
  }

  return {position, render};
})();
