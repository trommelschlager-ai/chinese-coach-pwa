# Panda Go — контрольная точка 26.11.2026

Эта запись предназначена для продолжения работы в новом чате без повторного согласования уже утверждённых решений. Код хранится в GitHub; эта запись не означает выпуск всех изменений на основной сайт.

## 1. Разговорный интеллект Panda AI

PR #257, ветка `feature/panda-dialogue-context-travel-20261126`. Проверенный код до добавления этого документа: `5535b327b5057f2bf1901ec9b546d585ba1b8428`. На этом коммите 14 успешных workflow, 4 skipped, 0 failures (проверено 26.11). Предыдущая редакция `01696ef0437fff106d0476b5b8e1ded70f4dd923`: 41/41 тестов unified engine, 14/14 workflow, браузерный тест с имитацией ASR и декодированием 3 MP3. Тестовая публикация этой предыдущей редакции: https://panda-ai-android-preview-cjkgvdibd-antontuchinn-4225.vercel.app/panda-voice-pilot.html?semantic=1 . Это СТАРАЯ ссылка, не давать её как исправленную.

Реализовано:
- Связанные диалоги: мотивация учить китайский -> поездка в Китай -> сроки -> транспорт.
- Уточнения 什么意思 / 请再说一遍 / 我没听懂 сохраняют ожидаемый ответ и объясняют предыдущую реплику.
- Смена темы; вопросы про еду, увлечения, частоту действий, выходные, следующий план.
- Ограниченная память текущего разговора: увлечения, распорядок дня, работа, мотивация изучения китайского, семья. Контекст истекает после 24 ходов; не создавать отдельное серверное хранилище. Отказ от обсуждения семьи учитывается; не инициировать семейную тему автоматически.
- 你来选话题吧 / 你选吧: выбор следующей ещё не обсуждённой темы.
- Проверенная грамматика HSK1–2: при известном исправлении и надёжном тексте сохранять смысл и продолжать диалог, показывать исправление отдельно, не запускать конкурирующую озвучку. При ASR confidence ниже .85 не применять inline correction. При согласии — существующая система повторения ошибок. Тоны по одному тексту не оценивать.
- Новые сценарии проверялись сначала с fixture аудио, затем в GitHub CI с настоящим реестром и браузером; не складывать перекрывающиеся числа тестов как независимое покрытие.

### Реальный тест пользователя (скриншоты)
Последовательность: 你来选话题吧 -> 你有什么爱好？; 我想学中文 -> 你为什么想学中文？; 因为我想去中国 -> 你打算什么时候去？; 什么意思 -> объяснение 打算 / 什么时候 / 去. Затем 什么时候去中国 было ошибочно отклонено фразой 你能说得简单一点吗？. При повторном объяснении показана ошибка «Запись не загрузилась».
В коммите 5535b327 уже исправлено понимание 什么时候去中国 / 什么时候去 в контексте вопроса о поездке, явных вопросов о поездке самой Панды и ряда полных ответов; восстановление pending question при уточнении, одна повторная попытка воспроизведения идентичной MP3 при сбое (без нового голоса). 14/14 workflow успешны. **Исправленный коммит пока не подтверждён как опубликованный**. Причина конкретного сетевого сбоя на телефоне не установлена; повторная попытка не гарантирует устранение всех ошибок.
Следующий шаг: опубликовать только preview точного проверенного коммита, проверить загрузку и повтор PA-V556-052.mp3, затем на телефоне повторить цепочку с 什么时候去中国 и полным ответом 我下个月去中国. Не менять main и не выпускать production без отдельного разрешения.

## 2. Panda Tone v568

PR #254, ветка feature/panda-tone-r566-review-20261126, HEAD `b381e482e60164ab0fa8cb9587b54ab64f4c6198` (проверено). Синхронизирован main в feature, не наоборот. Последняя ранее проверенная опубликованная редакция c96538ac4c405c703f6eabd506279403c4b84416:
https://panda-ai-android-preview-6lucm9w3y-antontuchinn-4225.vercel.app/panda-hsk2-tone-sentence-pilot.html
- Живой предварительный график F0 с шагом 40 мс, сравнение эталона и ученика, разрывы при недостоверном сигнале, адаптация тихой речи, контекстные подсказки тона, проверка границ слогов.
- Пять фраз: 我早上洗脸、你好、很好、不是、一天. Два новых MP3 в assets/panda-tone-phrase-ref-v567/.
- 19/19 прямых программных проверок прежнего алгоритма. По предыдущему отчёту синхронизированный коммит: 22 успешных workflow, 4 skipped; Android CI пройден. Реальный микрофон и новая публикация синхронизированной версии отдельно не подтверждены.
- Не выдавать текстовое ASR за акустическую оценку тонов; не повторять неподтверждённые количественные аудиобенчмарки. Не публиковать частные записи 小公主. Не просить дополнительные MP3 без необходимости.
- Оставить тренажёр в отдельной ветке, не задерживать разговорный интеллект.

## 3. Panda Street

PR #247: street-sakura-complete-audio-20261125, HEAD b7ff6be87f8ad7cdfbb1cd295a2932be4f20b15f (проверено). По отдельному сегодняшнему чату v582: 2 урока HSK1, 62 этапа, 67 MP3, тестовая Vercel публикация сообщалась READY; фактическая визуальная и аудиопроверка телефона ещё не подтверждена здесь. Не утверждать, что этот PR содержит все изменения v582 без сверки соответствующей ветки. Пользователь утвердил последнюю структуру экранов: первая страница, обложки, нижние кнопки не менять. Остальные экраны привести к эталону; без растягивания картинок, лишних кнопок или прокрутки. Panda Street — утверждённый мужской Mandarin Luvvoice, средний тембр, скорость −10%, громкость +10%, высота 0. Не заменять голос. 

## 4. Cloudflare — отдельный эксперимент

Ветка cloudflare-panda-go-test-20261126. По отдельному чату подготовлены конфигурация и список 4548 файлов, включая 3361 MP3; проверены бесплатные лимиты. Build: node scripts/prepare-cloudflare-panda.cjs; Deploy: npx wrangler deploy; root /; Preview Builds OFF. Сообщалось о сложностях GitHub-авторизации и запуске первой сборки, но финальная публикация не подтверждена. Проверить актуальный статус и логи, не начинать с нуля. Не менять main, Vercel, Supabase или основной проект в рамках Cloudflare-теста; не подключать платные услуги.

## 5. Другие контрольные точки

PR #226 panda-ai-family-understanding-20261124 — merged, HEAD 21cde252098d4586e4eb7217602ada6d7259dbfa. PR #228 fix/panda-go-release-qa-20261124 — open, HEAD b6a219687a3212e05e95a78b66e1ca7ae794cba1. Проверять актуальный HEAD перед продолжением.
Основной адрес: https://trommelschlager-ai.github.io/chinese-coach-pwa/ .
Сохранить утверждённый внешний вид Panda AI, существующую анимацию лица, голос, MP3, HSK1/2. Никаких TinyFish/HeyGen. Основной приоритет — проверенная работа разговора, а не количество сценариев. Работать крупными циклами без запроса «Го» на каждом шаге; краткий итог фактических изменений, тестов, ссылки и блокеров. Новую версию не объявлять готовой до проверенной публикации, а реальный микрофон — до физического теста.

## 6. Повторный тест телефона — 26.11.2026, 20:21–20:22 (время на скриншотах)
Тестовая публикация commit c0fd16d811a11f76c07f2d30afe8d46c3eeb61e3: https://panda-ai-android-preview-grp5f6bq5-antontuchinn-4225.vercel.app/panda-voice-pilot.html?semantic=1 . Vercel READY; HTML, обновлённый контекст, retryExact и PA-V556-052.mp3 — HTTP 200; 42/42 unit tests, 14 successful workflows, 4 skipped, 0 failures. Браузерный тест искусственной ошибки media подтвердил однократный повтор записи.
Пользователь прислал 4 скриншота повторного теста. Видно: 我想学中文 -> 你为什么想学中文？; 因为我想去中国 -> 你打算什么时候去？; 什么时候去中国？ -> объяснение предыдущего вопроса с пиньинем и переводом; 我下个月去中国。 -> 你打算怎么去？. Исправление контекста подтверждено визуально на телефоне. На присланных кадрах нет нового сообщения об ошибке аудио, но слышимость звука и способ ввода (голос/текст) по скриншотам подтвердить нельзя. Следующая контрольная реплика: 我打算坐飞机。 -> 祝你旅途愉快！. Основной сайт не изменён.

## 7. Записи недостающих фраз — согласовано пользователем
На телефоне при новой беседе фраза 我打算坐飞机 была отклонена. Исправление самостоятельных транспортных планов, замена неозвученного уточнения существующей точной записью clarify07, повтор при зависании аудио сохранены в 7beece10eb11616885df4e66beb9af8122b1d17b. 24 прямых теста и 5 отрицательных сценариев проверены; отдельный CI free chat прошёл. В семи проверенных ранее MP3 сервер вернул HTTP 200. Не считать доступность файла доказательством звучания на Android.
Новый пакет для записи утверждён пользователем. Использовать утверждённый женский голос Panda AI (Xiaoxiao, прежний эталон); не путать с мужским голосом Panda Street. Точные файлы отсутствуют в одобренном реестре. Поиск в main не выявил доступных записей этих фраз. Статус: ожидаются реальные MP3; не регистрировать фиктивные пути, не подменять другими голосами.
| ID | Китайский текст | Пиньинь | Перевод |
|---|---|---|---|
| PA-TRAVEL-01 | 你来选话题吧。 | Nǐ lái xuǎn huàtí ba. | Выбери тему разговора. |
| PA-TRAVEL-02 | 什么意思？ | Shénme yìsi? | Что это значит? |
| PA-TRAVEL-03 | 什么时候去中国？ | Shénme shíhou qù Zhōngguó? | Когда ехать в Китай? |
| PA-TRAVEL-04 | 我下个月去中国。 | Wǒ xià ge yuè qù Zhōngguó. | Я поеду в Китай в следующем месяце. |
| PA-TRAVEL-05 | 我打算坐飞机。 | Wǒ dǎsuàn zuò fēijī. | Я собираюсь лететь на самолёте. |
При получении записей: проверить соответствие текста, голос, отсутствие шума и обрезанных окончаний, сохранить по одной MP3 на фразу; реестр exact, офлайн-манифест, проверка декодирования и клика по реплике ученика, затем только preview. Основной сайт не менять. Дополнительная запись ответа Панды 你能说得简单一点吗？ не нужна: используем уже записанное 你可以用简单一点的中文说吗？.

## 8. Пользователь прислал пакет пяти записей
Получен Luvvoice MP3 длительностью 11.16 с, 24 кГц, mono. Пять участков речи выделены по паузам 0.81 с, с запасом около 0.15–0.21 с до и после речи. Сохранены пять отдельных MP3 по 48 кбит/с в assets/panda-ai-travel-voice-20261126; контрольные Git SHA каждого файла совпали при передаче. Не заменять прежние записи. Реестр точных фраз и offline-pack дополнены, cache обновлён. Голос использован из предоставленного пользователем файла, независимое подтверждение соответствия эталонному тембру и физическая проверка Android ещё нужны. Добавлены тесты проверки SHA256 и кнопок реальных MP3, CI ожидается. Основной сайт не изменён.

## 9. v569 preview and next conversation batch
Stable preview commit dbdd42f22ad5ddfeb27596c18a8cdac0be456ca4: https://panda-ai-android-preview-338cclahb-antontuchinn-4225.vercel.app/panda-voice-pilot.html?semantic=1 . 19 successful workflows, 4 skipped, 45/45 semantic tests; all five exact learner audio buttons played in browser CI. All five MP3 plus registry and SW returned HTTP 200 on Vercel. Physical Android playback remains unconfirmed. Cache version fixed to match 569, no production release.
New code commits 200e2745e352631f828fe7bdcbe19c0adee4beb8 and bd57b5afc7f36ae2465612dcad8c4df3c02f4146: composed reviewed contextual answers for clocks (12 hours × six minute forms × two contexts), breakfast, work, hobby frequency and travel dates; 164 direct cases and eight guards. Study difficulty and practice topic choice: 67 direct cases and five guards. Direct checks used actual semantic modules and fixture audio, not physical speech. Follow-up patch preserves existing express-opinion classification for supported Chinese difficulty statements, intentionally selects recorded 你想练习什么？ instead of unrecorded 你觉得什么最难？; adds real browser regression and updates the exact reply expectation. No new MP3, voice or artwork. New combined revision not yet published; CI and physical phone check required.

## 10. v570 — подключение в обычное меню, по прямому согласованию пользователя
Интеграция сохранена в b51c1ae8363dad2febe5187f25ffed8815d3e3ed. Новый движок включён для обычного Panda AI Non-Stop, legacy rollback semantic=0. Street использует общий движок с отдельным контекстом, только утверждённые мужские записи, текст для отсутствующих мужских MP3. Уроки, Short и оценки не изменены. Cache/offline v570. 47/47 unified tests; реальный браузерный тест HSK1 menu → обычный Panda AI, Street shared context и male-only playback, пять learner MP3 пройден. 19 общих проверок успешны, один beginner release gate обнаружил перехват старой семейной цепочки. Эта редакция исправляет владение вопросами старой семейной цепочки, добавляет регрессионный тест; новая полная проверка необходима. Preview b51c1ae READY, но не основной релиз. Не сливать дефектный коммит в main. Физический Android не проверен. Пользователь просил не забыть интеграцию; это основной приоритет, не начинать новые функции до прохождения release gate.

## 11. v570 — повторный release gate, 27.11.2026
HEAD 22233f6a1544511cd4d043eb8d753c744b7b7526: 19 workflows success, 4 skipped, 1 failure (run 45886402268, job 140138073706). Семейная цепочка пройдена до следующего сбоя: в Non-Stop, ширина 393 px, после 你几点去上班？ → 九点 общий движок ошибочно отвечает 你接下来想做什么？ вместо 你晚上几点睡觉？. Исправление ограничено владением legacy work-time и daily-sleep: оба вопроса остаются у исходной цепочки распорядка дня, если заданы старым движком; в явно начатой общей беседе обработка времени сохранена. Добавлен отдельный тест двух режимов. Исходные ожидания браузерного release gate не ослаблены. Новая CI-проверка обязательна; основной сайт не обновлён, реальный Android и отсутствующие мужские MP3 ещё не подтверждены.

## 12. Развитие Panda AI — разговорные уточнения и выбор темы
HEAD c9388307d2c6e881bc65490cadf00f461ff19690: 18 success, 2 failures, 4 skipped. Beginner gate 45904598846: generic shared sequence reply intercepts 我先刷牙然后吃早饭, expected recorded 你早上吃什么？ (PA-V563-03). Preserve existing specific legacy recorded follow-up in live AI, leave general shared sequence logic intact. Chinese course QA 45904598828 fails in scripts/verify-panda-home-photo1-v319.cjs on document not defined after separate Street home change; this batch does not alter design or test expectations. Added 11 reviewed topic-request synonyms and 11 repeat/meaning phrases, exact preceding line reference, reviewed pinyin/Russian translation, pending question resumption, no inference from fragments and no new MP3. Tests added for both semantic adapter and real browser; execution pending. Shared Street voice boundary unchanged; learner audio for new expressions not independently verified. No production publication.

## 13. Обязательный сценарий для обеих Панд — повторить и продолжить
Коммит c2f6dfdcf06f94a6555e97f20df76784ffd5d479: 19 success, 4 skipped, 1 failure (Chinese course QA; отдельное изменение главного меню), unified browser gate 45907836488 и beginner release gate успешны. Пользователь подтвердил обязательность цепочки для Panda AI и Panda Street: 我想学中文 → 你为什么想学中文？ → 我没听清楚。 → 你为什么想学中文？ → 因为我想去中国。 → 你打算什么时候去？. Сохранить пиньинь, русский перевод и предыдущий вопрос без перехода на другую тему. Все 22 новые формы уже доступны через общий движок; добавлена отдельная браузерная проверка Street с историей и метаданными, результат ожидается. В активном мужском каталоге Street отсутствуют точные записи 你为什么想学中文？ (Nǐ wèishénme xiǎng xué Zhōngwén?) и 你打算什么时候去？ (Nǐ dǎsuàn shénme shíhou qù?). Требуются две отдельные записи утверждённым мужским Luvvoice Mandarin, скорость −10%, громкость +10%, высота 0; до загрузки и проверки только текст, без женской и системной озвучки. Дизайн не изменён; production не опубликован. Впредь изменения общего разговорного интеллекта проверять на обеих Пандах, не дублировать движок.

## 14. Общий аудит курса — исправление тестовой среды
HEAD 4819b27e34f020d23729c48e05980838d1cefa08: 19 success, 4 skipped, 1 failure, Chinese course QA run 45908880487 job 140212144118. Root cause: verify-panda-home-photo1-v319.cjs executes the isolated home() in Node VM without document; the separately added Street menu style needs document.getElementById/createElement/head.append. Fix: give the existing test its own JSDOM document before executing home(), assert identical repeated renders, a single installed stylesheet, actual Street HSK1 link and disabled Street HSK2. All original JPEG hash, HSK hotspots, petals, CSS, progress and offline assertions preserved. No production code, layout, voice or lesson changed. Repeat CI required. Two user-provided male MP3 54/55 are received in chat; repository upload still pending (binary connector transfer not verified). Do not mark the clips registered until the actual bytes and playback are confirmed. No merge or publication.


## 15. Обязательные ограничения инфраструктуры и завершение v570
Пользователь подтвердил 27.11.2026: НЕ использовать Vercel, Supabase, TinyFish, HeyGen. Для разработки — GitHub и GitHub Actions; дальнейшая инфраструктура — Cloudflare, без публикации production до отдельного разрешения. Не создавать новых сборок Vercel и не использовать ранее созданную сборку для приёмки. Не менять существующие настройки внешних сервисов без отдельного запроса.
На HEAD a7cf02d1b9115125c2b0684bbdfe86dad57b80b9 проверено: все 20 активных GitHub Actions success, 4 skipped, 0 failures. Реальный Android не проверен. Не считать браузерные тесты физическим Android.
Две оригинальные мужские записи из чата подготовлены без перекодирования, назначение: assets/panda-street-voice-v20261125/54.mp3 — 你为什么想学中文？ (16416 bytes, SHA-256 dd526edf34034b00348a1021e58954f055853044909d130146f57341c4514fdd); assets/panda-street-voice-v20261125/55.mp3 — 你打算什么时候去？ (15840 bytes, SHA-256 bd2450fbf9a89d868007ad1936c9f97a21946d80155070fa0a86cc0052d665c8). Перед регистрацией проверить точные байты, тембр, фразы и playback. GitHub из файловой среды не разрешается по DNS; оригиналы пока не перенесены. Не добавлять фиктивные записи каталога. До загрузки Street отвечает текстом. После загрузки обновить мужской реестр, необходимые offline/cache записи и добавить тест воспроизведения повторного вопроса и следующего вопроса на точном коммите. Сохранять утверждённые дизайн и уроки. 

## 16. Voice transfer preparation
All 58 female clips and 2 Street male clips are present in chat/container and decode successfully; SHA-256 checked against manifests. One ZIP prepared, SHA-256 17e5412e1dd90adf994475b29d832c5f560a72becf029332cdfa0dd4c3e4373b. Direct binary GitHub transfer unavailable (DNS); owner uploads the single archive to the existing feature branch root. Import workflow validates the exact archive, refuses overwrite, checks 58 audited missing phrases, adds only real audio, verifies hashes and offline inventory before feature-branch commit. Full release CI, native listening, physical Android review still required. No runtime audio changes until import succeeds. No Vercel, Supabase, TinyFish, HeyGen.
